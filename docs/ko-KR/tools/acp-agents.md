---
description: ACP backend plugin으로 Codex, Claude Code, Gemini CLI 같은 외부 coding harness 세션을 바인딩하고 운용하는 가이드
summary: "Pi, Claude Code, Codex, OpenCode, Gemini CLI 및 기타 harness agent에 ACP 런타임 세션 사용"
read_when:
  - ACP를 통해 coding harness를 실행할 때
  - 스레드 지원 채널에서 스레드 바운드 ACP 세션을 설정할 때
  - Discord 채널 또는 Telegram forum topic을 영속 ACP 세션에 바인딩할 때
  - ACP backend 및 plugin 연결을 troubleshooting할 때
  - 채팅에서 /acp 명령을 운용할 때
title: "ACP Agents"
x-i18n:
  source_path: "tools/acp-agents.md"
---

# ACP agents

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) 세션을 사용하면 OpenClaw가 ACP backend plugin을 통해 외부 coding harness(예: Pi, Claude Code, Codex, OpenCode, Gemini CLI)를 실행할 수 있습니다.

OpenClaw에게 자연어로 "run this in Codex" 또는 "start Claude Code in a thread"라고 요청하면, OpenClaw는 그 요청을 네이티브 sub-agent runtime이 아니라 ACP runtime으로 라우팅해야 합니다.

## 빠른 운영자 흐름

실용적인 `/acp` runbook이 필요할 때 사용하세요.

1. 세션을 spawn합니다.
   - `/acp spawn codex --mode persistent --thread auto`
2. 바인딩된 스레드에서 작업합니다(또는 해당 session key를 명시적으로 지정).
3. 런타임 상태를 확인합니다.
   - `/acp status`
4. 필요에 따라 런타임 옵션을 조정합니다.
   - `/acp model <provider/model>`
   - `/acp permissions <profile>`
   - `/acp timeout <seconds>`
5. 컨텍스트를 교체하지 않고 활성 세션을 살짝 유도합니다.
   - `/acp steer tighten logging and continue`
6. 작업을 중단합니다.
   - `/acp cancel` (현재 turn 중단), 또는
   - `/acp close` (세션 종료 + 바인딩 제거)

## 사람을 위한 빠른 시작

자연스러운 요청 예시:

- "Start a persistent Codex session in a thread here and keep it focused."
- "Run this as a one-shot Claude Code ACP session and summarize the result."
- "Use Gemini CLI for this task in a thread, then keep follow-ups in that same thread."

OpenClaw가 해야 할 일:

1. `runtime: "acp"`를 선택합니다.
2. 요청된 harness 대상(`agentId`, 예: `codex`)을 해석합니다.
3. 스레드 바인딩이 요청되었고 현재 채널이 이를 지원하면, ACP 세션을 해당 스레드에 바인딩합니다.
4. unfocus/close/expire될 때까지 이후 스레드 메시지를 동일한 ACP 세션으로 라우팅합니다.

## ACP와 sub-agent 비교

외부 harness runtime이 필요하면 ACP를 사용하세요. OpenClaw 네이티브 delegated run이 필요하면 sub-agent를 사용하세요.

| Area          | ACP session                           | Sub-agent run                     |
| ------------- | ------------------------------------- | --------------------------------- |
| Runtime       | ACP backend plugin (예: acpx)         | OpenClaw 네이티브 sub-agent runtime |
| Session key   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>` |
| Main commands | `/acp ...`                            | `/subagents ...`                  |
| Spawn tool    | `sessions_spawn` with `runtime:"acp"` | `sessions_spawn` (default runtime) |

[Sub-agents](/tools/subagents)도 참고하세요.

## 스레드 바운드 세션 (채널 불문)

채널 adapter에 대해 thread binding이 활성화되어 있으면 ACP 세션을 스레드에 바인딩할 수 있습니다.

- OpenClaw가 스레드를 대상 ACP 세션에 바인딩합니다.
- 해당 스레드의 후속 메시지는 바인딩된 ACP 세션으로 라우팅됩니다.
- ACP 출력은 동일한 스레드로 다시 전달됩니다.
- unfocus/close/archive/idle-timeout 또는 max-age 만료 시 바인딩이 제거됩니다.

thread binding 지원은 adapter별입니다. 현재 활성 채널 adapter가 thread binding을 지원하지 않으면, OpenClaw는 명확한 unsupported/unavailable 메시지를 반환합니다.

스레드 바운드 ACP에 필요한 feature flag:

- `acp.enabled=true`
- `acp.dispatch.enabled`는 기본적으로 켜져 있음 (ACP dispatch를 일시 중지하려면 `false` 설정)
- 채널 adapter의 ACP thread-spawn flag 활성화 (adapter별)
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### 스레드 지원 채널

- session/thread binding capability를 노출하는 모든 채널 adapter
- 현재 내장 지원:
  - Discord threads/channels
  - Telegram topics (groups/supergroups의 forum topic 및 DM topic)
- Plugin 채널도 동일한 binding interface를 통해 지원을 추가할 수 있습니다.

## 채널별 설정

비일시적 워크플로우의 경우, 최상위 `bindings[]` 항목에 영속 ACP 바인딩을 설정하세요.

### 바인딩 모델

- `bindings[].type="acp"`는 영속적인 ACP conversation binding을 표시합니다.
- `bindings[].match`는 대상 conversation을 식별합니다.
  - Discord channel 또는 thread: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Telegram forum topic: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- `bindings[].agentId`는 소유 OpenClaw agent id입니다.
- 선택적 ACP override는 `bindings[].acp` 아래에 둡니다.
  - `mode` (`persistent` 또는 `oneshot`)
  - `label`
  - `cwd`
  - `backend`

### 에이전트별 런타임 기본값

에이전트마다 ACP 기본값을 한 번만 정의하려면 `agents.list[].runtime`을 사용하세요.

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (harness id, 예: `codex` 또는 `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

ACP 바운드 세션의 override 우선순위:

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. 전역 ACP 기본값 (예: `acp.backend`)

예시:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
      {
        id: "claude",
        runtime: {
          type: "acp",
          acp: { agent: "claude", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
    {
      type: "acp",
      agentId: "claude",
      match: {
        channel: "telegram",
        accountId: "default",
        peer: { kind: "group", id: "-1001234567890:topic:42" },
      },
      acp: { cwd: "/workspace/repo-b" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "discord", accountId: "default" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "telegram", accountId: "default" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": { requireMention: false },
          },
        },
      },
    },
    telegram: {
      groups: {
        "-1001234567890": {
          topics: { "42": { requireMention: false } },
        },
      },
    },
  },
}
```

동작:

- OpenClaw는 사용 전에 구성된 ACP 세션이 존재하는지 확인합니다.
- 해당 channel 또는 topic의 메시지는 구성된 ACP 세션으로 라우팅됩니다.
- 바인딩된 대화에서는 `/new`와 `/reset`이 같은 ACP session key를 제자리에서 reset합니다.
- 임시 런타임 바인딩(예: thread-focus 흐름에서 생성된 것)은 존재할 경우 여전히 적용됩니다.

## ACP 세션 시작 (인터페이스)

### `sessions_spawn`에서 시작

agent turn 또는 tool call에서 ACP 세션을 시작하려면 `runtime: "acp"`를 사용하세요.

```json
{
  "task": "Open the repo and summarize failing tests",
  "runtime": "acp",
  "agentId": "codex",
  "thread": true,
  "mode": "session"
}
```

참고:

- `runtime`의 기본값은 `subagent`이므로, ACP 세션에는 `runtime: "acp"`를 명시적으로 설정하세요.
- `agentId`가 생략되면, 설정된 경우 OpenClaw는 `acp.defaultAgent`를 사용합니다.
- `mode: "session"`은 영속적인 바인딩 대화를 유지하려면 `thread: true`가 필요합니다.

인터페이스 상세:

- `task` (필수): ACP 세션으로 전송되는 초기 프롬프트.
- `runtime` (ACP에 필수): 반드시 `"acp"`여야 합니다.
- `agentId` (선택 사항): ACP 대상 harness id. 설정되어 있으면 `acp.defaultAgent`로 fallback됩니다.
- `thread` (선택 사항, 기본값 `false`): 지원되는 경우 thread binding 흐름을 요청합니다.
- `mode` (선택 사항): `run` (one-shot) 또는 `session` (영속).
  - 기본값은 `run`
  - `thread: true`이고 mode를 생략하면 OpenClaw는 runtime path에 따라 영속 동작을 기본값으로 삼을 수 있음
  - `mode: "session"`은 `thread: true`가 필요
- `cwd` (선택 사항): 요청된 runtime working directory (backend/runtime policy로 검증됨).
- `label` (선택 사항): session/banner 텍스트에 사용되는 운영자 표시용 label.
- `streamTo` (선택 사항): `"parent"`는 초기 ACP run 진행 요약을 system event로 요청자 session에 다시 스트리밍합니다.
  - 사용 가능한 경우, 허용된 응답에는 전체 relay 이력을 tail할 수 있는 session-scoped JSONL log(`<sessionId>.acp-stream.jsonl`)를 가리키는 `streamLogPath`가 포함됩니다.

### 기존 세션 재개

`resumeSessionId`를 사용하면 새 ACP 세션을 시작하는 대신 이전 세션을 이어서 사용할 수 있습니다. agent는 `session/load`를 통해 이전 대화 이력을 다시 불러오므로, 기존 컨텍스트를 유지한 채 계속 진행할 수 있습니다.

### 운영자 smoke test

gateway 배포 후 ACP spawn이 단지 unit test를 통과하는 수준이 아니라 실제로 종단간 동작하는지 빠르게 확인하려면 이를 사용하세요.

권장 게이트:

1. 대상 호스트에서 배포된 gateway version/commit을 확인합니다.
2. 배포된 소스에 `src/gateway/sessions-patch.ts`의 ACP lineage acceptance가 포함되어 있는지 확인합니다 (`subagent:* or acp:* sessions`).
3. 라이브 agent에 대한 임시 ACPX bridge session을 엽니다 (예:
   `razor(main)` on `jpclawhq`).
4. 그 agent에게 다음으로 `sessions_spawn`을 호출하라고 요청합니다.
   - `runtime: "acp"`
   - `agentId: "codex"`
   - `mode: "run"`
   - task: `Reply with exactly LIVE-ACP-SPAWN-OK`
5. agent가 다음을 보고하는지 검증합니다.
   - `accepted=yes`
   - 실제 `childSessionKey`
   - validator error 없음
6. 임시 ACPX bridge session을 정리합니다.

라이브 agent에 보낼 예시 프롬프트:

```text
Use the sessions_spawn tool now with runtime: "acp", agentId: "codex", and mode: "run".
Set the task to: "Reply with exactly LIVE-ACP-SPAWN-OK".
Then report only: accepted=<yes/no>; childSessionKey=<value or none>; error=<exact text or none>.
```

참고:

- 스레드 바운드 영속 ACP 세션을 의도적으로 테스트하는 것이 아니라면, 이 smoke test는 `mode: "run"`으로 유지하세요.
- 기본 게이트에서는 `streamTo: "parent"`를 요구하지 마세요. 이 경로는 요청자/session capability에 의존하며 별도의 통합 검사입니다.
- 스레드 바운드 `mode: "session"` 테스트는 실제 Discord thread 또는 Telegram topic에서 두 번째, 더 풍부한 통합 단계로 취급하세요.

## Sandbox 호환성

ACP 세션은 현재 OpenClaw sandbox 내부가 아니라 호스트 런타임에서 실행됩니다.

현재 제한 사항:

- 요청자 세션이 sandboxed 상태라면, `sessions_spawn({ runtime: "acp" })`와 `/acp spawn` 모두에서 ACP spawn이 차단됩니다.
  - Error: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `runtime: "acp"`를 사용하는 `sessions_spawn`은 `sandbox: "require"`를 지원하지 않습니다.
  - Error: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

sandbox 강제 실행이 필요하면 `runtime: "subagent"`를 사용하세요.

### `/acp` 명령에서 시작

채팅에서 명시적인 운영자 제어가 필요할 때는 `/acp spawn`을 사용하세요.

```text
/acp spawn codex --mode persistent --thread auto
/acp spawn codex --mode oneshot --thread off
/acp spawn codex --thread here
```

핵심 플래그:

- `--mode persistent|oneshot`
- `--thread auto|here|off`
- `--cwd <absolute-path>`
- `--label <name>`

[Slash Commands](/tools/slash-commands)를 참고하세요.

## 세션 대상 해석

대부분의 `/acp` 동작은 선택적인 세션 대상(`session-key`, `session-id`, 또는 `session-label`)을 받습니다.

해석 순서:

1. 명시적인 대상 인수(또는 `/acp steer`의 `--session`)
   - 먼저 key 시도
   - 다음으로 UUID 형태의 session id
   - 다음으로 label
2. 현재 스레드 바인딩(이 대화/스레드가 ACP 세션에 바인딩된 경우)
3. 현재 요청자 세션 fallback

대상을 해석하지 못하면, OpenClaw는 명확한 오류(`Unable to resolve session target: ...`)를 반환합니다.

## Spawn 스레드 모드

`/acp spawn`은 `--thread auto|here|off`를 지원합니다.

| Mode   | Behavior                                                                                             |
| ------ | ---------------------------------------------------------------------------------------------------- |
| `auto` | 활성 스레드 안에서는 그 스레드를 바인딩합니다. 스레드 밖에서는 지원되는 경우 child thread를 생성/바인딩합니다. |
| `here` | 현재 활성 스레드를 요구하며, 스레드 안이 아니면 실패합니다.                                         |
| `off`  | 바인딩하지 않습니다. 세션은 unbound 상태로 시작합니다.                                               |

참고:

- non-thread binding surface에서는 기본 동작이 사실상 `off`입니다.
- 스레드 바운드 spawn에는 채널 정책 지원이 필요합니다.
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

## ACP 제어

사용 가능한 명령 계열:

- `/acp spawn`
- `/acp cancel`
- `/acp steer`
- `/acp close`
- `/acp status`
- `/acp set-mode`
- `/acp set`
- `/acp cwd`
- `/acp permissions`
- `/acp timeout`
- `/acp model`
- `/acp reset-options`
- `/acp sessions`
- `/acp doctor`
- `/acp install`

`/acp status`는 유효 runtime option을 보여주며, 가능할 경우 runtime 레벨과 backend 레벨의 session identifier를 모두 표시합니다.

일부 제어는 backend capability에 의존합니다. backend가 특정 제어를 지원하지 않으면, OpenClaw는 명확한 unsupported-control 오류를 반환합니다.

## ACP 명령 cookbook

| Command              | What it does                                              | Example                                                        |
| -------------------- | --------------------------------------------------------- | -------------------------------------------------------------- |
| `/acp spawn`         | ACP 세션 생성; 선택적으로 thread bind.                    | `/acp spawn codex --mode persistent --thread auto --cwd /repo` |
| `/acp cancel`        | 대상 세션의 진행 중 turn 취소.                            | `/acp cancel agent:codex:acp:<uuid>`                           |
| `/acp steer`         | 실행 중 세션에 steer instruction 전송.                    | `/acp steer --session support inbox prioritize failing tests`  |
| `/acp close`         | 세션 종료 및 thread target unbind.                        | `/acp close`                                                   |
| `/acp status`        | backend, mode, state, runtime option, capability 표시.    | `/acp status`                                                  |
| `/acp set-mode`      | 대상 세션의 runtime mode 설정.                            | `/acp set-mode plan`                                           |
| `/acp set`           | 일반적인 runtime config option 쓰기.                      | `/acp set model openai/gpt-5.2`                                |
| `/acp cwd`           | runtime working directory override 설정.                  | `/acp cwd /Users/user/Projects/repo`                           |
| `/acp permissions`   | approval policy profile 설정.                             | `/acp permissions strict`                                      |
| `/acp timeout`       | runtime timeout(초) 설정.                                 | `/acp timeout 120`                                             |
| `/acp model`         | runtime model override 설정.                              | `/acp model anthropic/claude-opus-4-5`                         |
| `/acp reset-options` | 세션 runtime option override 제거.                        | `/acp reset-options`                                           |
| `/acp sessions`      | store에서 최근 ACP 세션 목록 표시.                        | `/acp sessions`                                                |
| `/acp doctor`        | backend health, capability, 실행 가능한 수정안 표시.      | `/acp doctor`                                                  |
| `/acp install`       | 결정적인 설치 및 활성화 단계 출력.                        | `/acp install`                                                 |

## 런타임 옵션 매핑

`/acp`에는 편의 명령과 일반 setter가 있습니다.

동등한 작업:

- `/acp model <id>`는 runtime config key `model`에 매핑됩니다.
- `/acp permissions <profile>`은 runtime config key `approval_policy`에 매핑됩니다.
- `/acp timeout <seconds>`는 runtime config key `timeout`에 매핑됩니다.
- `/acp cwd <path>`는 runtime cwd override를 직접 갱신합니다.
- `/acp set <key> <value>`는 일반 경로입니다.
  - 특수 케이스: `key=cwd`는 cwd override 경로를 사용합니다.
- `/acp reset-options`는 대상 세션의 모든 runtime override를 지웁니다.

## acpx harness 지원 (현재)

현재 acpx 내장 harness alias:

- `pi`
- `claude`
- `codex`
- `opencode`
- `gemini`
- `kimi`

OpenClaw가 acpx backend를 사용할 때는, acpx 설정에 커스텀 agent alias가 정의되어 있지 않은 한 `agentId`로 이 값들을 우선 사용하세요.

직접 acpx CLI를 사용할 때는 `--agent <command>`를 통해 임의 adapter를 대상으로 지정할 수도 있지만, 이 raw escape hatch는 acpx CLI 기능이지 일반적인 OpenClaw `agentId` 경로는 아닙니다.

## 필요한 설정

Core ACP 기본선:

```json5
{
  acp: {
    enabled: true,
    // Optional. Default is true; set false to pause ACP dispatch while keeping /acp controls.
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "codex",
    allowedAgents: ["pi", "claude", "codex", "opencode", "gemini", "kimi"],
    maxConcurrentSessions: 8,
    stream: {
      coalesceIdleMs: 300,
      maxChunkChars: 1200,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

thread binding 설정은 채널 adapter별입니다. Discord 예시:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        spawnAcpSessions: true,
      },
    },
  },
}
```

스레드 바운드 ACP spawn이 동작하지 않으면, 먼저 adapter feature flag를 확인하세요.

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

[Configuration Reference](/gateway/configuration-reference)를 참고하세요.

## acpx backend용 plugin 설정

plugin을 설치하고 활성화합니다.

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

개발 중 로컬 workspace 설치:

```bash
openclaw plugins install ./extensions/acpx
```

그다음 backend health를 검증합니다.

```text
/acp doctor
```

### acpx command 및 version 설정

기본적으로 `@openclaw/acpx`로 배포되는 acpx plugin은 plugin-local pinned binary를 사용합니다.

1. command의 기본값은 `extensions/acpx/node_modules/.bin/acpx`입니다.
2. 예상 version의 기본값은 extension pin입니다.
3. startup은 ACP backend를 즉시 not-ready 상태로 등록합니다.
4. 백그라운드 ensure job이 `acpx --version`을 검증합니다.
5. plugin-local binary가 없거나 일치하지 않으면 다음을 실행합니다.
   `npm install --omit=dev --no-save acpx@<pinned>` 후 다시 검증합니다.

plugin config에서 command/version을 override할 수 있습니다.

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "command": "../acpx/dist/cli.js",
          "expectedVersion": "any"
        }
      }
    }
  }
}
```

참고:

- `command`는 절대 경로, 상대 경로, 또는 명령 이름(`acpx`)을 받을 수 있습니다.
- 상대 경로는 OpenClaw workspace directory 기준으로 해석됩니다.
- `expectedVersion: "any"`는 엄격한 version 일치를 비활성화합니다.
- `command`가 커스텀 binary/path를 가리키면 plugin-local auto-install은 비활성화됩니다.
- backend health check가 실행되는 동안 OpenClaw startup은 비차단 상태를 유지합니다.

[Plugins](/tools/plugin)를 참고하세요.

## 권한 설정

ACP 세션은 비대화형으로 실행됩니다. 파일 쓰기 및 shell 실행 permission prompt를 승인하거나 거부할 TTY가 없습니다. acpx plugin은 권한 처리 방식을 제어하는 두 개의 config key를 제공합니다.

### `permissionMode`

prompt 없이 harness agent가 수행할 수 있는 작업을 제어합니다.

| Value           | Behavior                                                    |
| --------------- | ----------------------------------------------------------- |
| `approve-all`   | 모든 파일 쓰기와 shell command를 자동 승인합니다.           |
| `approve-reads` | 읽기만 자동 승인하고, 쓰기와 exec는 prompt가 필요합니다.    |
| `deny-all`      | 모든 permission prompt를 거부합니다.                        |

### `nonInteractivePermissions`

permission prompt가 표시되어야 하지만 대화형 TTY를 사용할 수 없을 때(ACP 세션에서는 항상 해당) 어떻게 할지 제어합니다.

| Value  | Behavior                                                         |
| ------ | ---------------------------------------------------------------- |
| `fail` | `AcpRuntimeError`와 함께 세션을 중단합니다. **(기본값)**         |
| `deny` | permission을 조용히 거부하고 계속 진행합니다 (graceful degradation). |

### 설정

plugin config를 통해 설정합니다.

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

이 값을 변경한 후 gateway를 재시작하세요.

> **중요:** OpenClaw는 현재 기본값으로 `permissionMode=approve-reads`와 `nonInteractivePermissions=fail`을 사용합니다. 비대화형 ACP 세션에서는 permission prompt를 유발하는 모든 write 또는 exec가 `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`와 함께 실패할 수 있습니다.
>
> 권한을 제한해야 한다면, 세션이 크래시하는 대신 graceful degradation되도록 `nonInteractivePermissions`를 `deny`로 설정하세요.

## Troubleshooting

| Symptom                                                                  | Likely cause                                                                    | Fix                                                                                                                                                               |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                  | Backend plugin이 없거나 비활성화됨.                                             | backend plugin을 설치하고 활성화한 다음 `/acp doctor`를 실행하세요.                                                                                              |
| `ACP is disabled by policy (acp.enabled=false)`                          | ACP가 전역적으로 비활성화됨.                                                    | `acp.enabled=true`를 설정하세요.                                                                                                                                  |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`        | 일반 스레드 메시지에서의 dispatch가 비활성화됨.                                 | `acp.dispatch.enabled=true`를 설정하세요.                                                                                                                         |
| `ACP agent "<id>" is not allowed by policy`                              | agent가 allowlist에 없음.                                                       | 허용된 `agentId`를 사용하거나 `acp.allowedAgents`를 업데이트하세요.                                                                                               |
| `Unable to resolve session target: ...`                                  | 잘못된 key/id/label token.                                                      | `/acp sessions`를 실행해 정확한 key/label을 복사한 뒤 다시 시도하세요.                                                                                            |
| `--thread here requires running /acp spawn inside an active ... thread`  | `--thread here`를 스레드 컨텍스트 밖에서 사용함.                                | 대상 스레드로 이동하거나 `--thread auto`/`off`를 사용하세요.                                                                                                      |
| `Only <user-id> can rebind this thread.`                                 | 다른 사용자가 thread binding을 소유하고 있음.                                   | 소유자로 다시 bind하거나 다른 스레드를 사용하세요.                                                                                                                |
| `Thread bindings are unavailable for <channel>.`                         | adapter에 thread binding capability가 없음.                                     | `--thread off`를 사용하거나 지원되는 adapter/channel로 이동하세요.                                                                                                |
| `Sandboxed sessions cannot spawn ACP sessions ...`                       | ACP runtime은 host 측에서 실행되고, 요청자 세션은 sandboxed 상태임.              | sandboxed 세션에서는 `runtime="subagent"`를 사용하거나, sandbox되지 않은 세션에서 ACP spawn을 실행하세요.                                                          |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`  | ACP runtime에 대해 `sandbox="require"`를 요청함.                                | 필수 sandboxing에는 `runtime="subagent"`를 사용하거나, sandbox되지 않은 세션에서 ACP와 `sandbox="inherit"`를 사용하세요.                                          |
| Missing ACP metadata for bound session                                   | 오래되었거나 삭제된 ACP session metadata.                                       | `/acp spawn`으로 다시 생성한 뒤 스레드를 다시 bind/focus하세요.                                                                                                   |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` | `permissionMode`가 비대화형 ACP 세션에서 write/exec를 차단함.                   | `plugins.entries.acpx.config.permissionMode`를 `approve-all`로 설정하고 gateway를 재시작하세요. [Permission configuration](#permission-configuration) 참고.      |
| ACP session fails early with little output                               | permission prompt가 `permissionMode`/`nonInteractivePermissions`에 막힘.        | `AcpRuntimeError`가 있는지 gateway log를 확인하세요. 전체 권한이 필요하면 `permissionMode=approve-all`, graceful degradation이 필요하면 `nonInteractivePermissions=deny`를 설정하세요. |
| ACP session stalls indefinitely after completing work                    | harness process는 끝났지만 ACP session이 완료를 보고하지 않음.                  | `ps aux \| grep acpx`로 모니터링하고, 오래된 프로세스를 수동으로 종료하세요.                                                                                      |
