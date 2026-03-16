---
summary: "Agent session tools for listing sessions, fetching history, and sending cross-session messages"
description: "session 목록 조회, transcript 확인, inter-session message 전송, sub-agent spawn에 사용하는 OpenClaw session tool을 설명합니다."
read_when:
  - session tool을 추가하거나 수정할 때
title: "Session Tools"
x-i18n:
  source_path: "concepts/session-tool.md"
---

# Session Tools

목표는 agent가 session을 나열하고, history를 가져오고, 다른 session으로 message를
보낼 수 있게 하되, 오용하기 어렵고 작은 tool set을 제공하는 것입니다.

## Tool Names

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

## Key Model

- main direct chat bucket은 항상 literal key `"main"`입니다
  (현재 agent의 main key로 resolve됨)
- group chat은
  `agent:<agentId>:<channel>:group:<id>` 또는
  `agent:<agentId>:<channel>:channel:<id>`를 사용합니다
  (full key 전달)
- cron job은 `cron:<job.id>`
- hook은 명시적으로 설정하지 않으면 `hook:<uuid>`
- node session은 명시적으로 설정하지 않으면 `node-<nodeId>`

`global`과 `unknown`은 reserved value라 절대 list되지 않습니다.
`session.scope = "global"`이면 caller가 `global`을 보지 않도록, 모든 tool에서
`main`으로 alias합니다.

## sessions_list

session을 row array로 반환합니다.

Parameters:

- `kinds?: string[]`
  filter:
  `"main" | "group" | "cron" | "hook" | "node" | "other"` 중 하나 이상
- `limit?: number`
  최대 row 수
  (기본값은 server default, 예: 200으로 clamp)
- `activeMinutes?: number`
  최근 N분 내 update된 session만 포함
- `messageLimit?: number`
  `0`이면 message 제외
  (기본값 0), `>0`이면 최근 N개 message 포함

Behavior:

- `messageLimit > 0`이면 session별로 `chat.history`를 가져와 마지막 N개 message를 포함
- list output에서는 tool result를 필터링합니다.
  tool message가 필요하면 `sessions_history`를 사용하세요
- **sandboxed** agent session에서는 session tool이 기본적으로
  **spawned-only visibility**를 가집니다
  (아래 설명 참고)

Row shape (JSON):

- `key`: session key
- `kind`: `main | group | cron | hook | node | other`
- `channel`: `whatsapp | telegram | discord | signal | imessage | webchat | internal | unknown`
- `displayName`
  (가능하면 group display label)
- `updatedAt`
  (ms)
- `sessionId`
- `model`, `contextTokens`, `totalTokens`
- `thinkingLevel`, `verboseLevel`, `systemSent`, `abortedLastRun`
- `sendPolicy`
  (session override가 있으면)
- `lastChannel`, `lastTo`
- `deliveryContext`
  (가능하면 normalized `{ channel, to, accountId }`)
- `transcriptPath`
  (store dir + sessionId에서 유도한 best-effort path)
- `messages?`
  (`messageLimit > 0`일 때만)

## sessions_history

하나의 session transcript를 가져옵니다.

Parameters:

- `sessionKey`
  (required; session key 또는 `sessions_list`의 `sessionId`)
- `limit?: number`
  최대 message 수
  (server clamp)
- `includeTools?: boolean`
  (기본값 false)

Behavior:

- `includeTools=false`이면 `role: "toolResult"` message를 필터링
- raw transcript format의 messages array를 반환
- `sessionId`를 주면 OpenClaw가 해당 session key로 resolve
  (없으면 error)

## sessions_send

다른 session으로 message를 보냅니다.

Parameters:

- `sessionKey`
  (required; session key 또는 `sessions_list`의 `sessionId`)
- `message`
  (required)
- `timeoutSeconds?: number`
  (기본값은 0보다 큼; `0`은 fire-and-forget)

Behavior:

- `timeoutSeconds = 0`:
  enqueue 후 `{ runId, status: "accepted" }` 반환
- `timeoutSeconds > 0`:
  N초까지 completion을 기다렸다가
  `{ runId, status: "ok", reply }` 반환
- wait가 timeout되면:
  `{ runId, status: "timeout", error }`
  run은 계속되므로 나중에 `sessions_history`로 확인 가능
- run이 실패하면:
  `{ runId, status: "error", error }`
- announce delivery run은 primary run 완료 뒤에 best-effort로 실행되며,
  `status: "ok"`라고 해서 announce delivery까지 보장되지는 않습니다
- wait는 gateway `agent.wait`
  (server-side)로 처리되므로 reconnect되어도 wait가 끊기지 않습니다
- primary run에는 agent-to-agent message context가 inject됩니다
- inter-session message는
  `message.provenance.kind = "inter_session"`로 저장되어 transcript reader가
  routed agent instruction과 외부 user input을 구분할 수 있습니다
- primary run이 끝나면 OpenClaw는 **reply-back loop**를 실행합니다
  - round 2+는 requester agent와 target agent가 번갈아가며 reply
  - ping-pong을 멈추려면 정확히 `REPLY_SKIP`를 반환
  - 최대 turn 수는 `session.agentToAgent.maxPingPongTurns`
    (0–5, 기본값 5)
- loop가 끝나면 OpenClaw는 **agent-to-agent announce step**
  (target agent only)을 실행합니다
  - 조용히 끝내려면 정확히 `ANNOUNCE_SKIP`를 반환
  - 그 외 reply는 target channel로 전송
  - announce step에는 original request, round-1 reply, latest ping-pong reply가 포함

## Channel Field

- group은 session entry에 기록된 channel을 사용
- direct chat은 `lastChannel`에서 channel을 매핑
- cron/hook/node는 `internal`
- 없으면 `unknown`

## Security / Send Policy

channel/chat type 기준의 policy block을 적용합니다
(session id 기준이 아님).

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

runtime override
(session entry별):

- `sendPolicy: "allow" | "deny"`
  (unset이면 config 상속)
- `sessions.patch` 또는 owner-only `/send on|off|inherit`
  (standalone message)로 설정 가능

enforcement point:

- `chat.send` / `agent`
  (gateway)
- auto-reply delivery logic

## sessions_spawn

isolated session에서 sub-agent run을 spawn하고, 결과를 requester chat channel에
announce합니다.

Parameters:

- `task`
  (required)
- `label?`
  (optional; log/UI용)
- `agentId?`
  (optional; 허용되면 다른 agent id 아래에서 spawn)
- `model?`
  (optional; sub-agent model override, invalid value는 error)
- `thinking?`
  (optional; sub-agent run thinking level override)
- `runTimeoutSeconds?`
  (`agents.defaults.subagents.runTimeoutSeconds`가 있으면 그 값을 기본값으로, 없으면 `0`;
  설정되면 N초 후 sub-agent run abort)
- `thread?`
  (기본값 false; channel/plugin이 지원하면 thread-bound routing 요청)
- `mode?`
  (`run|session`; 기본값은 `run`, 단 `thread=true`이면 `session`;
  `mode="session"`은 `thread=true` 필요)
- `cleanup?`
  (`delete|keep`, 기본값 `keep`)
- `sandbox?`
  (`inherit|require`, 기본값 `inherit`;
  `require`는 target child runtime이 sandbox가 아니면 reject)
- `attachments?`
  (optional inline file array; subagent runtime only, ACP는 reject)
  각 항목은
  `{ name, content, encoding?: "utf8" | "base64", mimeType? }`
  형식이고, child workspace의 `.openclaw/attachments/<uuid>/`에 materialize됩니다.
  file별 sha256 receipt를 반환합니다
- `attachAs?`
  (optional; `{ mountPath? }`
  형태의 향후 mount 구현용 hint)

Allowlist:

- `agents.list[].subagents.allowAgents`:
  `agentId`로 spawn 가능한 agent id 목록
  (`["*"]`면 모두 허용). 기본값은 requester agent만 허용
- sandbox inheritance guard:
  requester session이 sandboxed면, unsandboxed target은 reject

Discovery:

- `sessions_spawn`에 허용된 agent id는 `agents_list`로 찾습니다

Behavior:

- `deliver: false`인 새 `agent:<agentId>:subagent:<uuid>` session을 시작
- sub-agent는 기본적으로 전체 tool set에서 **session tool만 제외**된 상태로 시작
  (`tools.subagents.tools`로 설정 가능)
- sub-agent는 `sessions_spawn`을 다시 호출할 수 없습니다
  (sub-agent → sub-agent spawn 금지)
- 항상 non-blocking:
  즉시 `{ status: "accepted", runId, childSessionKey }` 반환
- `thread=true`이면 channel plugin이 delivery/routing을 thread target에 bind할 수 있음
  (Discord support는 `session.threadBindings.*`,
  `channels.discord.threadBindings.*`로 제어)
- completion 후 OpenClaw는 sub-agent **announce step**을 실행해 requester chat channel에
  결과를 올립니다
  - assistant final reply가 비어 있으면 sub-agent history의 최신 `toolResult`를
    `Result`로 포함
- announce step에서 정확히 `ANNOUNCE_SKIP`를 reply하면 조용히 종료
- announce reply는 `Status` / `Result` / `Notes`로 normalize되며,
  `Status`는 model text가 아니라 runtime outcome에서 결정
- sub-agent session은
  `agents.defaults.subagents.archiveAfterMinutes`
  (기본값 60) 후 auto-archive
- announce reply에는 runtime, tokens, sessionKey/sessionId, transcript path,
  optional cost를 담은 stats line이 포함

## Sandbox Session Visibility

session tool은 cross-session access를 줄이기 위해 scope를 제한할 수 있습니다.

기본 동작:

- `tools.sessions.visibility` 기본값은 `tree`
  (현재 session + spawned subagent session)
- sandboxed session에서는
  `agents.defaults.sandbox.sessionToolsVisibility`가 visibility를 강하게 clamp할 수 있음

Config:

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
        sessionToolsVisibility: "spawned", // or "all"
      },
    },
  },
}
```

Notes:

- `self`: 현재 session key만
- `tree`: 현재 session + 현재 session이 spawn한 session
- `agent`: 현재 agent id에 속한 어떤 session이든
- `all`: 어떤 session이든
  (cross-agent access에는 여전히 `tools.agentToAgent` 필요)
- session이 sandboxed이고 `sessionToolsVisibility="spawned"`이면,
  `tools.sessions.visibility="all"`이어도 OpenClaw는 `tree`로 clamp합니다
