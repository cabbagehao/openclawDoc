---
summary: "session 나열, history 조회, 세션 간 메시지 전송을 위한 agent session tool"
read_when:
  - session tool을 추가하거나 수정할 때
title: "Session Tools"
---

# Session Tools

목표: agent가 session을 나열하고, history를 가져오고, 다른 session으로 메시지를 보내는 작업을 안전하게 할 수 있도록 작은 도구 집합을 제공하는 것

## Tool Names

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

## Key Model

- main direct chat bucket은 항상 리터럴 key `"main"`입니다(현재 agent의 main key로 해석됨).
- group chat은 `agent:<agentId>:<channel>:group:<id>` 또는 `agent:<agentId>:<channel>:channel:<id>` 형식을 사용합니다(전체 key를 그대로 전달).
- cron job은 `cron:<job.id>`
- hook은 명시적으로 지정하지 않으면 `hook:<uuid>`
- node session은 명시하지 않으면 `node-<nodeId>`

`global`과 `unknown`은 예약 값이며 절대 나열되지 않습니다. `session.scope = "global"`이면 모든 tool에서 이를 `main`으로 alias 하여 호출자가 `global` 값을 보지 않게 합니다.

## sessions_list

session을 row 배열로 나열합니다.

파라미터:

- `kinds?: string[]` 필터: `"main" | "group" | "cron" | "hook" | "node" | "other"` 중 하나 이상
- `limit?: number` 최대 row 수(기본값: 서버 기본값, 예: 200으로 clamp)
- `activeMinutes?: number` 최근 N분 안에 업데이트된 session만
- `messageLimit?: number` 0 = 메시지 미포함(기본값 0), >0 = 마지막 N개 메시지 포함

동작:

- `messageLimit > 0`이면 session별로 `chat.history`를 가져와 마지막 N개 메시지를 포함합니다.
- list 출력에서는 tool result가 필터링됩니다. tool message가 필요하면 `sessions_history`를 사용하세요.
- **sandboxed** agent session에서 실행되면, session tool은 기본적으로 **spawned-only visibility**를 사용합니다(아래 참고).

Row shape (JSON):

- `key`: session key (string)
- `kind`: `main | group | cron | hook | node | other`
- `channel`: `whatsapp | telegram | discord | signal | imessage | webchat | internal | unknown`
- `displayName` (가능하면 group display label)
- `updatedAt` (ms)
- `sessionId`
- `model`, `contextTokens`, `totalTokens`
- `thinkingLevel`, `verboseLevel`, `systemSent`, `abortedLastRun`
- `sendPolicy` (설정된 경우 session override)
- `lastChannel`, `lastTo`
- `deliveryContext` (가능하면 정규화된 `{ channel, to, accountId }`)
- `transcriptPath` (store dir + sessionId에서 best-effort로 계산한 경로)
- `messages?` (`messageLimit > 0`일 때만)

## sessions_history

하나의 session transcript를 가져옵니다.

파라미터:

- `sessionKey` (필수, session key 또는 `sessions_list`의 `sessionId` 허용)
- `limit?: number` 최대 메시지 수(서버에서 clamp)
- `includeTools?: boolean` (기본값 false)

동작:

- `includeTools=false`면 `role: "toolResult"` 메시지를 필터링합니다.
- 메시지 배열을 raw transcript 형식으로 반환합니다.
- `sessionId`가 주어지면 OpenClaw가 대응되는 session key로 해석합니다. 없으면 오류입니다.

## sessions_send

다른 session으로 메시지를 보냅니다.

파라미터:

- `sessionKey` (필수, session key 또는 `sessions_list`의 `sessionId` 허용)
- `message` (필수)
- `timeoutSeconds?: number` (기본값 >0, 0 = fire-and-forget)

동작:

- `timeoutSeconds = 0`: enqueue 후 `{ runId, status: "accepted" }` 반환
- `timeoutSeconds > 0`: N초 동안 완료를 기다린 뒤 `{ runId, status: "ok", reply }` 반환
- 대기 timeout: `{ runId, status: "timeout", error }`. 실행은 계속되며, 나중에 `sessions_history`로 확인 가능
- 실행 실패: `{ runId, status: "error", error }`
- announce delivery는 primary run이 끝난 뒤 best-effort로 수행됩니다. `status: "ok"`여도 announce가 실제 전달되었다는 보장은 없습니다.
- 대기는 gateway의 `agent.wait`(server-side)를 사용하므로 reconnect가 있어도 wait가 끊기지 않습니다.
- agent 간 message context가 primary run에 주입됩니다.
- inter-session message는 `message.provenance.kind = "inter_session"`로 저장되어, transcript reader가 라우팅된 agent instruction과 외부 사용자 입력을 구분할 수 있습니다.
- primary run이 끝난 뒤 OpenClaw는 **reply-back loop**를 실행합니다.
  - 2라운드 이상에서는 requester와 target agent가 번갈아 응답
  - ping-pong를 끝내려면 정확히 `REPLY_SKIP`로 응답
  - 최대 턴 수는 `session.agentToAgent.maxPingPongTurns` (0–5, 기본값 5)
- loop가 끝나면 OpenClaw는 **agent-to-agent announce step**(target agent만)을 실행합니다.
  - 조용히 끝내려면 정확히 `ANNOUNCE_SKIP`로 응답
  - 그 외의 응답은 target channel로 전송
  - announce step에는 원래 요청 + 1라운드 응답 + 최신 ping-pong 응답이 포함됩니다.

## Channel Field

- group에서는 `channel`이 session entry에 기록된 channel 값입니다.
- direct chat에서는 `lastChannel`에서 매핑합니다.
- cron/hook/node에서는 `channel`이 `internal`입니다.
- 값이 없으면 `channel`은 `unknown`입니다.

## Security / Send Policy

채널/채팅 유형 단위의 정책 기반 차단입니다. session id별 정책은 아닙니다.

```json
{
  "session": {
    "sendPolicy": {
      "rules": [
        {
          "match": { "channel": "discord", "chatType": "group" },
          "action": "deny"
        }
      ],
      "default": "allow"
    }
  }
}
```

런타임 override(session entry별):

- `sendPolicy: "allow" | "deny"` (unset이면 config 상속)
- `sessions.patch` 또는 owner-only `/send on|off|inherit`(단독 메시지)로 설정 가능

강제 지점:

- `chat.send` / `agent` (gateway)
- auto-reply delivery logic

## sessions_spawn

격리된 session에서 sub-agent run을 시작하고, 결과를 requester chat channel로 announce합니다.

파라미터:

- `task` (필수)
- `label?` (선택, log/UI용)
- `agentId?` (선택, 허용되면 다른 agent id로 spawn)
- `model?` (선택, sub-agent model override, 잘못된 값은 오류)
- `thinking?` (선택, sub-agent run의 thinking level override)
- `runTimeoutSeconds?` (`agents.defaults.subagents.runTimeoutSeconds`가 있으면 그 값을, 없으면 `0`; 설정 시 N초 후 sub-agent run abort)
- `thread?` (기본 false, 채널/plugin이 지원하면 thread-bound routing 요청)
- `mode?` (`run|session`, 기본값 `run`, 단 `thread=true`면 기본값 `session`; `mode="session"`은 `thread=true` 필요)
- `cleanup?` (`delete|keep`, 기본값 `keep`)
- `sandbox?` (`inherit|require`, 기본값 `inherit`; `require`면 target child runtime이 sandboxed가 아니면 거부)
- `attachments?` (선택, inline file 배열; subagent runtime 전용이며 ACP는 거부). 각 항목: `{ name, content, encoding?: "utf8" | "base64", mimeType? }`
  파일은 child workspace의 `.openclaw/attachments/<uuid>/`에 materialize되며, 파일별 sha256 receipt를 반환합니다.
- `attachAs?` (선택, `{ mountPath? }` 힌트, 향후 mount 구현용 예약)

Allowlist:

- `agents.list[].subagents.allowAgents`: `agentId`로 허용할 agent id 목록(`["*"]`면 전체 허용). 기본값은 requester agent만 허용
- Sandbox inheritance guard: requester session이 sandboxed이면, target child runtime이 unsandboxed일 때 `sessions_spawn`을 거부

Discovery:

- `sessions_spawn`에서 허용되는 agent id를 찾으려면 `agents_list`를 사용하세요.

동작:

- 새 `agent:<agentId>:subagent:<uuid>` session을 `deliver: false`로 시작
- sub-agent는 기본적으로 전체 tool 집합을 사용하지만 **session tool은 제외**됩니다(`tools.subagents.tools`로 설정 가능)
- sub-agent는 `sessions_spawn`을 다시 호출할 수 없습니다(sub-agent -> sub-agent spawn 금지)
- 항상 non-blocking이며 `{ status: "accepted", runId, childSessionKey }`를 즉시 반환
- `thread=true`면 channel plugin이 delivery/routing을 thread target에 바인딩할 수 있습니다(Discord는 `session.threadBindings.*`, `channels.discord.threadBindings.*`로 제어)
- 완료 후 OpenClaw는 sub-agent **announce step**을 실행하고 결과를 requester chat channel에 게시
  - assistant final reply가 비어 있으면 sub-agent history의 최신 `toolResult`를 `Result`로 포함
- announce step에서 정확히 `ANNOUNCE_SKIP`로 응답하면 조용히 종료
- announce 응답은 `Status`/`Result`/`Notes`로 정규화되며, `Status`는 모델 텍스트가 아니라 runtime outcome에서 가져옵니다
- sub-agent session은 `agents.defaults.subagents.archiveAfterMinutes`(기본값: 60) 후 자동 아카이브
- announce 응답에는 runtime, token, sessionKey/sessionId, transcript path, 선택적 cost를 포함한 통계 줄이 들어갑니다

## Sandbox Session Visibility

session tool은 세션 간 접근 범위를 줄이도록 scope를 지정할 수 있습니다.

기본 동작:

- `tools.sessions.visibility`의 기본값은 `tree`입니다(현재 session + 현재 session이 spawn한 subagent session)
- sandboxed session의 경우 `agents.defaults.sandbox.sessionToolsVisibility`가 visibility를 더 좁게 강제할 수 있습니다

설정:

```json5
{
  tools: {
    sessions: {
      // "self" | "tree" | "agent" | "all"
      // default: "tree"
      visibility: "tree",
    },
  },
  agents: {
    defaults: {
      sandbox: {
        // default: "spawned"
        sessionToolsVisibility: "spawned", // 또는 "all"
      },
    },
  },
}
```

참고:

- `self`: 현재 session key만
- `tree`: 현재 session + 현재 session이 spawn한 session
- `agent`: 현재 agent id에 속한 모든 session
- `all`: 모든 session(cross-agent access는 여전히 `tools.agentToAgent` 필요)
- session이 sandboxed이고 `sessionToolsVisibility="spawned"`이면, `tools.sessions.visibility="all"`로 설정해도 OpenClaw는 이를 `tree`로 clamp합니다.
