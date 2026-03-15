---
summary: "Sub-agent: 요청자 chat에 결과를 다시 알리는 격리된 agent run 생성"
read_when:
  - agent를 통해 background/parallel 작업을 하고 싶을 때
  - sessions_spawn 또는 sub-agent tool policy를 변경할 때
  - thread-bound subagent session을 구현하거나 문제를 해결할 때
title: "Sub-Agents"
---

# Sub-agents

Sub-agent는 기존 agent run에서 생성되는 background agent run입니다. 이들은 자체 session(`agent:<agentId>:subagent:<uuid>`)에서 실행되며, 완료되면 결과를 요청자 chat channel에 **announce**합니다.

## Slash command

현재 session의 sub-agent run을 확인하거나 제어하려면 `/subagents` 를 사용하세요.

- `/subagents list`
- `/subagents kill <id|#|all>`
- `/subagents log <id|#> [limit] [tools]`
- `/subagents info <id|#>`
- `/subagents send <id|#> <message>`
- `/subagents steer <id|#> <message>`
- `/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]`

Thread binding 제어:

이 명령들은 persistent thread binding을 지원하는 채널에서 동작합니다. 아래의 **Thread supporting channels** 를 참고하세요.

- `/focus <subagent-label|session-key|session-id|session-label>`
- `/unfocus`
- `/agents`
- `/session idle <duration|off>`
- `/session max-age <duration|off>`

`/subagents info` 는 run 메타데이터(status, timestamp, session id, transcript path, cleanup)를 보여줍니다.

### Spawn 동작

`/subagents spawn` 은 background sub-agent를 내부 relay가 아닌 사용자 명령으로 시작하며, run이 끝나면 요청자 chat에 최종 완료 업데이트 하나를 보냅니다.

- spawn 명령은 non-blocking입니다. run id를 즉시 반환합니다.
- 완료되면 sub-agent가 요청자 chat channel에 summary/result 메시지를 announce합니다.
- 수동 spawn의 경우 전달은 resilient하게 처리됩니다.
  - OpenClaw는 먼저 안정적인 idempotency key를 사용해 직접 `agent` 전달을 시도합니다.
  - direct delivery가 실패하면 queue routing으로 fallback합니다.
  - queue routing도 사용할 수 없으면 최종 포기 전까지 짧은 exponential backoff로 announce를 재시도합니다.
- 요청자 session으로 넘기는 completion handoff는 런타임 생성 internal context(사용자 작성 텍스트 아님)이며 다음을 포함합니다.
  - `Result` (`assistant` reply 텍스트, assistant reply가 비어 있으면 최신 `toolResult`)
  - `Status` (`completed successfully` / `failed` / `timed out` / `unknown`)
  - compact runtime/token 통계
  - 요청자 agent가 raw internal metadata를 그대로 전달하지 않고 일반 assistant voice로 다시 쓰도록 지시하는 delivery instruction
- `--model` 과 `--thinking` 은 해당 run에 한해 기본값을 override합니다.
- 완료 후 세부 내용과 출력을 보려면 `info`/`log` 를 사용하세요.
- `/subagents spawn` 은 one-shot mode(`mode: "run"`)입니다. persistent thread-bound session에는 `sessions_spawn` 에 `thread: true` 와 `mode: "session"` 을 사용하세요.
- ACP harness session(Codex, Claude Code, Gemini CLI)에는 `runtime: "acp"` 와 함께 `sessions_spawn` 을 사용하고 [ACP Agents](/tools/acp-agents)를 참고하세요.

주요 목표:

- main run을 막지 않고 "research / long task / slow tool" 작업을 병렬화
- 기본적으로 sub-agent를 격리 유지(session 분리 + 선택적 sandboxing)
- tool surface가 오용되기 어렵게 유지: 기본적으로 sub-agent는 session tool을 **받지 않습니다**
- orchestrator 패턴을 위해 중첩 깊이를 설정 가능하게 지원

비용 참고: 각 sub-agent는 자체 **컨텍스트와 token 사용량**을 가집니다. 무겁거나 반복적인 작업에는 sub-agent에 더 저렴한 모델을 설정하고, main agent는 더 고품질 모델에 유지하세요. 이는 `agents.defaults.subagents.model` 또는 agent별 override로 설정할 수 있습니다.

## Tool

`sessions_spawn` 을 사용합니다.

- sub-agent run을 시작합니다(`deliver: false`, global lane: `subagent`)
- 그런 다음 announce 단계를 실행하고 요청자 chat channel에 announce reply를 게시합니다
- 기본 model: `agents.defaults.subagents.model` (또는 agent별 `agents.list[].subagents.model`)을 설정하지 않으면 호출자를 상속합니다. 명시적인 `sessions_spawn.model` 이 있으면 항상 그것이 우선합니다.
- 기본 thinking: `agents.defaults.subagents.thinking` (또는 agent별 `agents.list[].subagents.thinking`)을 설정하지 않으면 호출자를 상속합니다. 명시적인 `sessions_spawn.thinking` 이 있으면 항상 그것이 우선합니다.
- 기본 run timeout: `sessions_spawn.runTimeoutSeconds` 를 생략하면, OpenClaw는 설정된 경우 `agents.defaults.subagents.runTimeoutSeconds` 를 사용하고, 아니면 `0` (timeout 없음)으로 fallback합니다.

Tool 파라미터:

- `task` (required)
- `label?` (optional)
- `agentId?` (optional; 허용된 경우 다른 agent id 아래에서 spawn)
- `model?` (optional; sub-agent model override; 유효하지 않은 값은 건너뛰고 tool result에 경고를 남긴 채 기본 model로 실행)
- `thinking?` (optional; sub-agent run의 thinking level override)
- `runTimeoutSeconds?` (설정된 경우 `agents.defaults.subagents.runTimeoutSeconds`, 아니면 `0`; 설정 시 N초 후 sub-agent run 중단)
- `thread?` (기본값 `false`; `true` 이면 이 sub-agent session에 대해 channel thread binding 요청)
- `mode?` (`run|session`)
  - 기본값은 `run`
  - `thread: true` 이고 `mode` 를 생략하면 기본값은 `session`
  - `mode: "session"` 은 `thread: true` 가 필요
- `cleanup?` (`delete|keep`, 기본값 `keep`)
- `sandbox?` (`inherit|require`, 기본값 `inherit`; `require` 는 대상 child runtime이 sandbox되지 않았으면 spawn을 거부)
- `sessions_spawn` 은 channel-delivery 파라미터(`target`, `channel`, `to`, `threadId`, `replyTo`, `transport`)를 받지 않습니다. 전달에는 spawned run 내부에서 `message`/`sessions_send` 를 사용하세요.

## Thread-bound session

채널에서 thread binding이 활성화되어 있으면, sub-agent는 thread에 바인딩된 상태를 유지할 수 있어 그 thread의 후속 사용자 메시지가 계속 같은 sub-agent session으로 라우팅됩니다.

### Thread supporting channels

- Discord (현재 유일한 지원 채널): persistent thread-bound subagent session(`thread: true` 를 사용한 `sessions_spawn`), manual thread control(`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`), 그리고 adapter key `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`, `channels.discord.threadBindings.spawnSubagentSessions` 를 지원합니다.

빠른 흐름:

1. `thread: true` (선택적으로 `mode: "session"`)를 사용해 `sessions_spawn` 으로 spawn합니다.
2. OpenClaw가 active channel에서 그 session target용 thread를 생성하거나 bind합니다.
3. 해당 thread의 reply와 후속 메시지는 bound session으로 라우팅됩니다.
4. `/session idle` 로 비활성 auto-unfocus를 확인/갱신하고 `/session max-age` 로 hard cap을 제어합니다.
5. 수동 분리에는 `/unfocus` 를 사용합니다.

수동 제어:

- `/focus <target>` 은 현재 thread를 sub-agent/session target에 bind합니다(또는 thread 생성).
- `/unfocus` 는 현재 bound thread의 binding을 제거합니다.
- `/agents` 는 active run과 binding state(`thread:<id>` 또는 `unbound`)를 나열합니다.
- `/session idle` 과 `/session max-age` 는 focused bound thread에서만 동작합니다.

Config 스위치:

- 전역 기본값: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`
- channel override와 spawn auto-bind key는 adapter별입니다. 위의 **Thread supporting channels** 를 참고하세요.

현재 adapter 세부 정보는 [Configuration Reference](/gateway/configuration-reference) 와 [Slash commands](/tools/slash-commands) 를 참고하세요.

Allowlist:

- `agents.list[].subagents.allowAgents`: `agentId` 로 지정할 수 있는 agent id 목록 (`["*"]` 이면 모두 허용). 기본값: 요청자 agent만.
- Sandbox inheritance guard: 요청자 session이 sandboxed이면, `sessions_spawn` 은 unsandboxed로 실행될 target을 거부합니다.

Discovery:

- 현재 `sessions_spawn` 에 허용된 agent id를 보려면 `agents_list` 를 사용하세요.

Auto-archive:

- sub-agent session은 `agents.defaults.subagents.archiveAfterMinutes` 후 자동 archive됩니다(기본값: 60).
- archive는 `sessions.delete` 를 사용하며 transcript를 같은 폴더의 `*.deleted.<timestamp>` 로 이름 변경합니다.
- `cleanup: "delete"` 는 announce 직후 즉시 archive합니다(transcript는 이름 변경으로 유지).
- Auto-archive는 best-effort입니다. gateway가 재시작되면 pending timer는 유실됩니다.
- `runTimeoutSeconds` 는 auto-archive를 하지 않습니다. run만 멈추고 session은 auto-archive 전까지 남습니다.
- Auto-archive는 depth-1 과 depth-2 session에 동일하게 적용됩니다.

## Nested Sub-Agents

기본적으로 sub-agent는 자신의 sub-agent를 spawn할 수 없습니다(`maxSpawnDepth: 1`). `maxSpawnDepth: 2` 로 설정하면 한 단계 중첩이 가능해지고, 즉 **orchestrator pattern**(main → orchestrator sub-agent → worker sub-sub-agents)을 사용할 수 있습니다.

### 활성화 방법

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // allow sub-agents to spawn children (default: 1)
        maxChildrenPerAgent: 5, // max active children per agent session (default: 5)
        maxConcurrent: 8, // global concurrency lane cap (default: 8)
        runTimeoutSeconds: 900, // default timeout for sessions_spawn when omitted (0 = no timeout)
      },
    },
  },
}
```

### Depth level

| Depth | Session key shape                            | Role                                                | Can spawn?                   |
| ----- | -------------------------------------------- | --------------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | Main agent                                          | Always                       |
| 1     | `agent:<id>:subagent:<uuid>`                 | Sub-agent (`maxSpawnDepth >= 2` 일 때 orchestrator) | Only if `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-sub-agent (leaf worker)                         | Never                        |

### Announce chain

결과는 체인을 따라 위로 전달됩니다.

1. Depth-2 worker 완료 → 부모(depth-1 orchestrator)에 announce
2. Depth-1 orchestrator가 announce를 받아 결과를 종합하고 완료 → main에 announce
3. Main agent가 announce를 받아 사용자에게 전달

각 level은 자신의 직접 자식에게서 온 announce만 볼 수 있습니다.

### Depth별 tool policy

- **Depth 1 (orchestrator, `maxSpawnDepth >= 2` 일 때)**: 자식을 관리할 수 있도록 `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` 를 받습니다. 다른 session/system tool은 계속 거부됩니다.
- **Depth 1 (leaf, `maxSpawnDepth == 1` 일 때)**: session tool 없음(현재 기본 동작).
- **Depth 2 (leaf worker)**: session tool 없음 — depth 2에서는 `sessions_spawn` 이 항상 거부됩니다. 더 깊은 자식을 spawn할 수 없습니다.

### Agent별 spawn 제한

각 agent session(어느 depth든)은 동시에 최대 `maxChildrenPerAgent` (기본값: 5)개의 active child를 가질 수 있습니다. 이는 단일 orchestrator가 제어 없이 fan-out되는 것을 막습니다.

### Cascade stop

depth-1 orchestrator를 중지하면 그 depth-2 자식들도 자동으로 중지됩니다.

- main chat에서 `/stop` 을 실행하면 모든 depth-1 agent가 중지되고 그 depth-2 자식들에게 cascade됩니다.
- `/subagents kill <id>` 는 특정 sub-agent를 중지하고 그 자식들에게 cascade합니다.
- `/subagents kill all` 은 요청자에게 속한 모든 sub-agent를 중지하고 cascade합니다.

## Authentication

Sub-agent auth는 session type이 아니라 **agent id** 를 기준으로 해석됩니다.

- sub-agent session key는 `agent:<agentId>:subagent:<uuid>` 입니다.
- auth store는 그 agent의 `agentDir` 에서 로드됩니다.
- main agent의 auth profile은 **fallback** 으로 병합되며, 충돌 시 agent profile이 main profile보다 우선합니다.

참고: 병합은 additive이므로 main profile은 항상 fallback으로 사용 가능합니다. agent별 완전한 auth 격리는 아직 지원되지 않습니다.

## Announce

Sub-agent는 announce 단계를 통해 결과를 보고합니다.

- announce 단계는 요청자 session이 아니라 sub-agent session 내부에서 실행됩니다.
- sub-agent가 정확히 `ANNOUNCE_SKIP` 라고 응답하면 아무것도 게시되지 않습니다.
- 그 외에는 요청자 depth에 따라 전달 방식이 달라집니다.
  - 최상위 요청자 session은 external delivery(`deliver=true`)를 사용하는 후속 `agent` 호출을 사용합니다
  - 중첩된 요청자 subagent session은 internal follow-up injection(`deliver=false`)을 받아 orchestrator가 session 내부에서 child 결과를 종합할 수 있게 합니다
  - 중첩된 요청자 subagent session이 사라졌다면, OpenClaw는 가능한 경우 해당 session의 requester로 fallback합니다
- nested completion finding을 만들 때 child completion aggregation은 현재 requester run 범위로 제한되므로, 이전 run의 오래된 child output이 현재 announce에 섞여 들어오지 않습니다.
- 채널 adapter가 가능하면 announce reply는 thread/topic routing을 보존합니다.
- announce context는 안정적인 internal event block으로 normalize됩니다.
  - source (`subagent` 또는 `cron`)
  - child session key/id
  - announce type + task label
  - runtime outcome(`success`, `error`, `timeout`, `unknown`)에서 파생된 status line
  - announce step의 결과 콘텐츠(없으면 `(no output)`)
  - 언제 reply하고 언제 침묵할지 설명하는 follow-up instruction
- `Status` 는 model output에서 추론하지 않으며, runtime outcome signal에서 가져옵니다.

announce payload는 끝에 stats line을 포함합니다(랩핑된 경우도 포함).

- Runtime (예: `runtime 5m12s`)
- Token usage (input/output/total)
- model pricing이 설정된 경우 추정 비용(`models.providers.*.models[].cost`)
- `sessionKey`, `sessionId`, transcript path (main agent가 `sessions_history` 를 통해 기록을 가져오거나 디스크의 파일을 직접 검사할 수 있게 함)
- internal metadata는 orchestration 전용입니다. 사용자용 reply는 일반 assistant voice로 다시 작성해야 합니다.

## Tool Policy (sub-agent tools)

기본적으로 sub-agent는 session tool과 system tool을 제외한 **모든 tool** 을 받습니다.

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`maxSpawnDepth >= 2` 일 때는 depth-1 orchestrator sub-agent가 자식을 관리할 수 있도록 `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` 를 추가로 받습니다.

config로 override:

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxConcurrent: 1,
      },
    },
  },
  tools: {
    subagents: {
      tools: {
        // deny wins
        deny: ["gateway", "cron"],
        // if allow is set, it becomes allow-only (deny still wins)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

## Concurrency

Sub-agent는 전용 in-process queue lane을 사용합니다.

- Lane 이름: `subagent`
- Concurrency: `agents.defaults.subagents.maxConcurrent` (기본값 `8`)

## 중지

- 요청자 chat에서 `/stop` 을 보내면 요청자 session이 중단되고, 그 session에서 spawn된 active sub-agent run도 모두 중지되며 nested child에게 cascade됩니다.
- `/subagents kill <id>` 는 특정 sub-agent를 중지하고 그 자식에게 cascade합니다.

## 제한 사항

- sub-agent announce는 **best-effort** 입니다. gateway가 재시작되면 대기 중인 "announce back" 작업은 유실됩니다.
- sub-agent도 여전히 같은 gateway process 자원을 공유하므로, `maxConcurrent` 는 safety valve로 취급하세요.
- `sessions_spawn` 은 항상 non-blocking입니다. 즉시 `{ status: "accepted", runId, childSessionKey }` 를 반환합니다.
- sub-agent context는 `AGENTS.md` + `TOOLS.md` 만 주입합니다(`SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` 는 없음).
- 최대 중첩 깊이는 5입니다(`maxSpawnDepth` 범위: 1–5). 대부분의 사용 사례에는 depth 2가 권장됩니다.
- `maxChildrenPerAgent` 는 session당 active child 수를 제한합니다(기본값: 5, 범위: 1–20).
