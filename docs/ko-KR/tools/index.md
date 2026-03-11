---
summary: "legacy `openclaw-*` skills를 대체하는 OpenClaw용 agent tool surface (browser, canvas, nodes, message, cron)"
read_when:
  - agent tool을 추가하거나 수정할 때
  - "`openclaw-*` skills를 폐기하거나 변경할 때"
title: "Tools"
---

# Tools (OpenClaw)

OpenClaw는 browser, canvas, nodes, cron을 위한 **first-class agent tools**를 제공합니다.
이 도구들은 오래된 `openclaw-*` skills를 대체합니다. tool은 typed되어 있고 shelling이 필요 없으며,
agent는 이들을 직접 사용해야 합니다.

## Disabling tools

`openclaw.json`의 `tools.allow` / `tools.deny`를 통해 tool을 전역적으로 허용/차단할 수 있습니다
(`deny`가 우선함). 이렇게 하면 허용되지 않은 tool이 model provider로 전송되지 않습니다.

```json5
{
  tools: { deny: ["browser"] },
}
```

참고:

- 매칭은 대소문자를 구분하지 않습니다.
- `*` wildcard를 지원합니다 (`"*"`는 모든 tool을 의미).
- `tools.allow`가 알 수 없거나 로드되지 않은 plugin tool 이름만 참조하면, OpenClaw는 경고를 기록하고 allowlist를 무시하여 core tool이 계속 사용 가능하도록 합니다.

## Tool profiles (base allowlist)

`tools.profile`은 `tools.allow`/`tools.deny` 전에 적용되는 **기본 tool allowlist**를 설정합니다.
agent별 override: `agents.list[].tools.profile`.

프로필:

- `minimal`: `session_status`만
- `coding`: `group:fs`, `group:runtime`, `group:sessions`, `group:memory`, `image`
- `messaging`: `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`
- `full`: 제한 없음 (미설정과 동일)

예시 (기본은 messaging-only, Slack + Discord tool도 허용):

```json5
{
  tools: {
    profile: "messaging",
    allow: ["slack", "discord"],
  },
}
```

예시 (coding 프로필이지만 어디서나 exec/process는 차단):

```json5
{
  tools: {
    profile: "coding",
    deny: ["group:runtime"],
  },
}
```

예시 (전역 coding 프로필, support agent는 messaging-only):

```json5
{
  tools: { profile: "coding" },
  agents: {
    list: [
      {
        id: "support",
        tools: { profile: "messaging", allow: ["slack"] },
      },
    ],
  },
}
```

## Provider-specific tool policy

`tools.byProvider`를 사용하면 전역 기본값을 바꾸지 않고도 특정 provider
(또는 단일 `provider/model`)에 대해 tool을 **추가로 제한**할 수 있습니다.
agent별 override: `agents.list[].tools.byProvider`.

이는 **기본 tool profile 이후**, **allow/deny list 이전**에 적용되므로
tool 집합을 더 좁히는 것만 가능합니다.
provider key는 `provider`(예: `google-antigravity`) 또는
`provider/model`(예: `openai/gpt-5.2`) 둘 다 사용할 수 있습니다.

예시 (전역 coding 프로필 유지, 하지만 Google Antigravity에는 minimal tool만 사용):

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
    },
  },
}
```

예시 (불안정한 endpoint에 대해 provider/model별 allowlist 적용):

```json5
{
  tools: {
    allow: ["group:fs", "group:runtime", "sessions_list"],
    byProvider: {
      "openai/gpt-5.2": { allow: ["group:fs", "sessions_list"] },
    },
  },
}
```

예시 (단일 provider에 대한 agent-specific override):

```json5
{
  agents: {
    list: [
      {
        id: "support",
        tools: {
          byProvider: {
            "google-antigravity": { allow: ["message", "sessions_list"] },
          },
        },
      },
    ],
  },
}
```

## Tool groups (shorthands)

tool policy(전역, agent, sandbox)는 여러 tool로 확장되는 `group:*` 항목을 지원합니다.
`tools.allow` / `tools.deny`에서 사용하세요.

사용 가능한 그룹:

- `group:runtime`: `exec`, `bash`, `process`
- `group:fs`: `read`, `write`, `edit`, `apply_patch`
- `group:sessions`: `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `session_status`
- `group:memory`: `memory_search`, `memory_get`
- `group:web`: `web_search`, `web_fetch`
- `group:ui`: `browser`, `canvas`
- `group:automation`: `cron`, `gateway`
- `group:messaging`: `message`
- `group:nodes`: `nodes`
- `group:openclaw`: 모든 built-in OpenClaw tool (provider plugin 제외)

예시 (파일 tool + browser만 허용):

```json5
{
  tools: {
    allow: ["group:fs", "browser"],
  },
}
```

## Plugins + tools

plugin은 core set 외에 **추가 tool**(및 CLI 명령)을 등록할 수 있습니다.
설치 및 구성은 [Plugins](/tools/plugin)을 참고하고, tool 사용 가이드가 prompt에 어떻게
주입되는지는 [Skills](/tools/skills)를 참고하세요. 일부 plugin은 tool과 함께
자체 skill도 제공합니다(예: voice-call plugin).

선택적 plugin tool:

- [Lobster](/tools/lobster): 재개 가능한 승인 기능이 있는 typed workflow runtime (gateway host에 Lobster CLI 필요).
- [LLM Task](/tools/llm-task): 구조화된 workflow 출력을 위한 JSON-only LLM step (선택적 schema validation).
- [Diffs](/tools/diffs): before/after text 또는 unified patch를 위한 read-only diff viewer 및 PNG/PDF 파일 renderer.

## Tool inventory

### `apply_patch`

하나 이상의 파일에 구조화된 patch를 적용합니다. multi-hunk 편집에 사용합니다.
실험적 기능이며 `tools.exec.applyPatch.enabled`로 활성화합니다 (OpenAI model 전용).
`tools.exec.applyPatch.workspaceOnly`의 기본값은 `true`(workspace 내부 한정)입니다. `apply_patch`가 workspace 디렉터리 밖에 쓰기/삭제하도록 의도한 경우에만 `false`로 설정하세요.

### `exec`

workspace에서 shell 명령을 실행합니다.

핵심 매개변수:

- `command` (필수)
- `yieldMs` (timeout 후 자동 background, 기본값 10000)
- `background` (즉시 background)
- `timeout` (초 단위, 초과 시 process 종료, 기본값 1800)
- `elevated` (bool; elevated mode가 활성/허용된 경우 host에서 실행. agent가 sandboxed일 때만 동작 변화가 있음)
- `host` (`sandbox | gateway | node`)
- `security` (`deny | allowlist | full`)
- `ask` (`off | on-miss | always`)
- `node` (`host=node`용 node id/name)
- 실제 TTY가 필요하다면 `pty: true`를 설정하세요.

참고:

- background로 전환되면 `status: "running"`과 `sessionId`를 반환합니다.
- background session을 poll/log/write/kill/clear하려면 `process`를 사용하세요.
- `process`가 허용되지 않으면 `exec`는 동기식으로 실행되며 `yieldMs`/`background`를 무시합니다.
- `elevated`는 `tools.elevated`와 `agents.list[].tools.elevated` override의 제약을 받습니다(둘 다 허용해야 함). 이는 `host=gateway` + `security=full`의 별칭입니다.
- `elevated`는 agent가 sandboxed일 때만 동작을 바꿉니다(그 외에는 no-op).
- `host=node`는 macOS companion app 또는 headless node host(`openclaw node run`)를 대상으로 할 수 있습니다.
- gateway/node approval 및 allowlist는 [Exec approvals](/tools/exec-approvals)를 참고하세요.

### `process`

background exec session을 관리합니다.

핵심 action:

- `list`, `poll`, `log`, `write`, `kill`, `clear`, `remove`

참고:

- `poll`은 완료 시 새 출력과 exit status를 반환합니다.
- `log`는 줄 단위 `offset`/`limit`를 지원합니다 (`offset`을 생략하면 마지막 N줄을 가져옴).
- `process`는 agent별 범위로 제한되며, 다른 agent의 session은 보이지 않습니다.

### `loop-detection` (tool-call loop guardrails)

OpenClaw는 최근 tool-call 기록을 추적하고, 진전 없는 반복 루프를 감지하면 차단하거나 경고합니다.
`tools.loopDetection.enabled: true`로 활성화하세요 (기본값은 `false`).

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      historySize: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

- `genericRepeat`: 같은 tool + 같은 params 호출 패턴 반복.
- `knownPollNoProgress`: 동일한 출력을 가진 poll 계열 tool의 반복.
- `pingPong`: `A/B/A/B` 식의 진전 없는 교대 패턴.
- agent별 override: `agents.list[].tools.loopDetection`.

### `web_search`

Perplexity, Brave, Gemini, Grok, Kimi를 사용해 웹을 검색합니다.

핵심 매개변수:

- `query` (필수)
- `count` (1–10, 기본값은 `tools.web.search.maxResults`에서 가져옴)

참고:

- 선택한 provider에 대한 API key가 필요합니다 (권장: `openclaw configure --section web`).
- `tools.web.search.enabled`로 활성화합니다.
- 응답은 캐시됩니다 (기본 15분).
- 설정은 [Web tools](/tools/web)를 참고하세요.

### `web_fetch`

URL에서 읽기 좋은 콘텐츠를 가져와 추출합니다 (HTML → markdown/text).

핵심 매개변수:

- `url` (필수)
- `extractMode` (`markdown` | `text`)
- `maxChars` (긴 페이지 잘라내기)

참고:

- `tools.web.fetch.enabled`로 활성화합니다.
- `maxChars`는 `tools.web.fetch.maxCharsCap`으로 상한이 적용됩니다 (기본 50000).
- 응답은 캐시됩니다 (기본 15분).
- JS 비중이 큰 사이트는 browser tool을 우선 사용하세요.
- 설정은 [Web tools](/tools/web)를 참고하세요.
- 선택적 anti-bot fallback은 [Firecrawl](/tools/firecrawl)을 참고하세요.

### `browser`

OpenClaw가 관리하는 전용 browser를 제어합니다.

핵심 action:

- `status`, `start`, `stop`, `tabs`, `open`, `focus`, `close`
- `snapshot` (aria/ai)
- `screenshot` (image block + `MEDIA:<path>` 반환)
- `act` (UI action: click/type/press/hover/drag/select/fill/resize/wait/evaluate)
- `navigate`, `console`, `pdf`, `upload`, `dialog`

프로필 관리:

- `profiles` — 상태와 함께 모든 browser profile 나열
- `create-profile` — 자동 할당된 port(또는 `cdpUrl`)로 새 profile 생성
- `delete-profile` — browser 중지, user data 삭제, config에서 제거 (local 전용)
- `reset-profile` — profile port의 orphan process 종료 (local 전용)

일반 매개변수:

- `profile` (선택 사항, 기본값은 `browser.defaultProfile`)
- `target` (`sandbox` | `host` | `node`)
- `node` (선택 사항, 특정 node id/name 지정)
  참고:
- `browser.enabled=true`가 필요합니다 (기본값은 `true`; 비활성화하려면 `false` 설정).
- 모든 action은 multi-instance 지원을 위해 선택적 `profile` 매개변수를 받습니다.
- `profile`을 생략하면 `browser.defaultProfile`을 사용합니다 (기본값 `"chrome"`).
- profile 이름은 소문자 영숫자 + 하이픈만 허용합니다 (최대 64자).
- port 범위: 18800-18899 (최대 약 100개 profile).
- remote profile은 attach-only입니다 (`start/stop/reset` 불가).
- browser-capable node가 연결되어 있으면 tool이 자동으로 그쪽으로 라우팅할 수 있습니다 (`target`을 고정하지 않은 경우).
- Playwright가 설치되어 있으면 `snapshot` 기본값은 `ai`입니다. accessibility tree가 필요하면 `aria`를 사용하세요.
- `snapshot`은 role-snapshot 옵션(`interactive`, `compact`, `depth`, `selector`)도 지원하며 `e12` 같은 ref를 반환합니다.
- `act`는 `snapshot`에서 받은 `ref`가 필요합니다 (AI snapshot은 숫자 `12`, role snapshot은 `e12`). 드문 CSS selector 필요 시에는 `evaluate`를 사용하세요.
- 기본적으로 `act` → `wait`를 남용하지 마세요. 신뢰할 수 있는 UI 상태를 기다릴 수 없는 예외적인 경우에만 사용하세요.
- `upload`는 준비 후 자동 click하도록 선택적 `ref`를 전달할 수 있습니다.
- `upload`는 `<input type="file">`에 직접 설정하기 위한 `inputRef`(aria ref) 또는 `element`(CSS selector)도 지원합니다.

### `canvas`

node Canvas를 구동합니다 (present, eval, snapshot, A2UI).

핵심 action:

- `present`, `hide`, `navigate`, `eval`
- `snapshot` (image block + `MEDIA:<path>` 반환)
- `a2ui_push`, `a2ui_reset`

참고:

- 내부적으로 gateway `node.invoke`를 사용합니다.
- `node`를 지정하지 않으면 tool이 기본값을 선택합니다 (연결된 단일 node 또는 로컬 mac node).
- A2UI는 v0.8 전용입니다 (`createSurface` 없음). CLI는 v0.9 JSONL을 줄 단위 오류와 함께 거부합니다.
- 빠른 smoke test: `openclaw nodes canvas a2ui push --node <id> --text "Hello from A2UI"`.

### `nodes`

pairing된 node를 탐색하고 대상으로 지정하며, notification을 보내고, camera/screen을 캡처합니다.

핵심 action:

- `status`, `describe`
- `pending`, `approve`, `reject` (pairing)
- `notify` (macOS `system.notify`)
- `run` (macOS `system.run`)
- `camera_list`, `camera_snap`, `camera_clip`, `screen_record`
- `location_get`, `notifications_list`, `notifications_action`
- `device_status`, `device_info`, `device_permissions`, `device_health`

참고:

- camera/screen 명령은 node app이 foreground에 있어야 합니다.
- 이미지는 image block + `MEDIA:<path>`를 반환합니다.
- 비디오는 `FILE:<path>`(mp4)를 반환합니다.
- location은 JSON payload(lat/lon/accuracy/timestamp)를 반환합니다.
- `run` params: `command` argv 배열, 선택적 `cwd`, `env` (`KEY=VAL`), `commandTimeoutMs`, `invokeTimeoutMs`, `needsScreenRecording`.

예시 (`run`):

```json
{
  "action": "run",
  "node": "office-mac",
  "command": ["echo", "Hello"],
  "env": ["FOO=bar"],
  "commandTimeoutMs": 12000,
  "invokeTimeoutMs": 45000,
  "needsScreenRecording": false
}
```

### `image`

구성된 image model로 이미지를 분석합니다.

핵심 매개변수:

- `image` (필수 path 또는 URL)
- `prompt` (선택 사항, 기본값은 `"Describe the image."`)
- `model` (선택적 override)
- `maxBytesMb` (선택적 크기 상한)

참고:

- `agents.defaults.imageModel`이 구성된 경우(기본값 또는 fallback), 또는 기본 model + 구성된 auth로부터 암시적 image model을 추론할 수 있는 경우에만 사용 가능합니다 (best-effort pairing).
- main chat model과 독립적으로 image model을 직접 사용합니다.

### `pdf`

하나 이상의 PDF 문서를 분석합니다.

전체 동작, 제한, config, 예시는 [PDF tool](/tools/pdf)를 참고하세요.

### `message`

Discord/Google Chat/Slack/Telegram/WhatsApp/Signal/iMessage/MS Teams 전반에서 메시지와 채널 action을 전송합니다.

핵심 action:

- `send` (텍스트 + 선택적 media, MS Teams는 Adaptive Cards용 `card`도 지원)
- `poll` (WhatsApp/Discord/MS Teams poll)
- `react` / `reactions` / `read` / `edit` / `delete`
- `pin` / `unpin` / `list-pins`
- `permissions`
- `thread-create` / `thread-list` / `thread-reply`
- `search`
- `sticker`
- `member-info` / `role-info`
- `emoji-list` / `emoji-upload` / `sticker-upload`
- `role-add` / `role-remove`
- `channel-info` / `channel-list`
- `voice-status`
- `event-list` / `event-create`
- `timeout` / `kick` / `ban`

참고:

- `send`는 WhatsApp을 Gateway를 통해 라우팅하고, 다른 채널은 직접 전송합니다.
- `poll`은 WhatsApp과 MS Teams에서 Gateway를 사용하며, Discord poll은 직접 전송합니다.
- message tool 호출이 활성 chat session에 바인딩된 경우, 교차 컨텍스트 유출을 막기 위해 전송은 그 session의 target으로 제한됩니다.

### `cron`

Gateway cron job과 wakeup을 관리합니다.

핵심 action:

- `status`, `list`
- `add`, `update`, `remove`, `run`, `runs`
- `wake` (system event enqueue + 선택적 즉시 heartbeat)

참고:

- `add`는 전체 cron job 객체를 기대합니다 (`cron.add` RPC와 동일한 schema).
- `update`는 `{ jobId, patch }`를 사용합니다 (`id`도 호환성을 위해 허용됨).

### `gateway`

실행 중인 Gateway process를 재시작하거나 update를 적용합니다(in-place).

핵심 action:

- `restart` (권한 확인 후 in-process restart를 위해 `SIGUSR1` 전송, `openclaw gateway` 재시작 in-place)
- `config.schema.lookup` (전체 schema를 prompt context에 로드하지 않고 config path 하나만 검사)
- `config.get`
- `config.apply` (validate + config 쓰기 + restart + wake)
- `config.patch` (부분 update merge + restart + wake)
- `update.run` (update 실행 + restart + wake)

참고:

- `config.schema.lookup`에는 `gateway.auth` 또는 `agents.list.*.heartbeat` 같은 대상 config path를 전달해야 합니다.
- `plugins.entries.<id>`를 다룰 때는 slash로 구분된 plugin id를 path에 포함할 수 있습니다. 예: `plugins.entries.pack/one.config`.
- 진행 중인 reply를 끊지 않으려면 `delayMs`(기본값 2000)를 사용하세요.
- `config.schema`는 내부 Control UI 흐름에는 계속 사용 가능하지만 agent `gateway` tool로는 노출되지 않습니다.
- `restart`는 기본적으로 활성화되어 있습니다. 비활성화하려면 `commands.restart: false`를 설정하세요.

### `sessions_list` / `sessions_history` / `sessions_send` / `sessions_spawn` / `session_status`

session을 나열하고, transcript history를 확인하거나, 다른 session으로 전송합니다.

핵심 매개변수:

- `sessions_list`: `kinds?`, `limit?`, `activeMinutes?`, `messageLimit?` (`0` = 없음)
- `sessions_history`: `sessionKey`(또는 `sessionId`), `limit?`, `includeTools?`
- `sessions_send`: `sessionKey`(또는 `sessionId`), `message`, `timeoutSeconds?` (`0` = fire-and-forget)
- `sessions_spawn`: `task`, `label?`, `runtime?`, `agentId?`, `model?`, `thinking?`, `cwd?`, `runTimeoutSeconds?`, `thread?`, `mode?`, `cleanup?`, `sandbox?`, `streamTo?`, `attachments?`, `attachAs?`
- `session_status`: `sessionKey?` (기본값은 현재 session, `sessionId` 허용), `model?` (`default`는 override 해제)

참고:

- `main`은 canonical direct-chat key이며, global/unknown은 숨겨집니다.
- `messageLimit > 0`이면 session별 마지막 N개 메시지를 가져옵니다 (tool 메시지는 필터링됨).
- session targeting은 `tools.sessions.visibility`로 제어됩니다 (기본값 `tree`: 현재 session + spawn된 subagent session). 여러 사용자를 위해 공유 agent를 실행한다면, 교차 session 탐색을 방지하려고 `tools.sessions.visibility: "self"` 설정을 고려하세요.
- `sessions_send`는 `timeoutSeconds > 0`일 때 최종 완료까지 대기합니다.
- delivery/announce는 완료 후 best-effort로 이뤄집니다. `status: "ok"`는 announce가 전달되었다는 뜻이 아니라 agent 실행이 끝났다는 뜻입니다.
- `sessions_spawn`은 `runtime: "subagent" | "acp"`를 지원합니다 (기본값은 `subagent`). ACP runtime 동작은 [ACP Agents](/tools/acp-agents)를 참고하세요.
- ACP runtime에서 `streamTo: "parent"`는 초기 실행 진행 요약을 직접 child 전달 대신 requester session으로 system event 형태로 라우팅합니다.
- `sessions_spawn`은 sub-agent 실행을 시작하고 requester chat으로 announce reply를 게시합니다.
  - one-shot mode(`mode: "run"`)와 persistent thread-bound mode(`mode: "session"` + `thread: true`)를 지원합니다.
  - `thread: true`이고 `mode`가 생략되면 mode 기본값은 `session`입니다.
  - `mode: "session"`에는 `thread: true`가 필요합니다.
  - `runTimeoutSeconds`를 생략하면, 설정된 경우 OpenClaw는 `agents.defaults.subagents.runTimeoutSeconds`를 사용하고, 그렇지 않으면 기본 timeout은 `0`(timeout 없음)입니다.
  - Discord thread-bound flow는 `session.threadBindings.*`와 `channels.discord.threadBindings.*`에 의존합니다.
  - reply 형식에는 `Status`, `Result`, compact stats가 포함됩니다.
  - `Result`는 assistant completion text이며, 없으면 최신 `toolResult`를 fallback으로 사용합니다.
- 수동 completion-mode spawn은 먼저 direct로 전송한 뒤, 일시적 실패 시 queue fallback과 retry를 수행합니다 (`status: "ok"`는 announce 전달이 아니라 실행 종료를 의미).
- `sessions_spawn`은 subagent runtime에 한해 inline file attachment를 지원합니다 (ACP는 이를 거부함). 각 attachment는 `name`, `content`, 선택적 `encoding`(`utf8` 또는 `base64`), `mimeType`을 가집니다. 파일은 child workspace의 `.openclaw/attachments/<uuid>/`에 `.manifest.json` metadata 파일과 함께 materialize됩니다. tool은 `count`, `totalBytes`, 파일별 `sha256`, `relDir`를 담은 receipt를 반환합니다. attachment content는 transcript persistence에서 자동으로 redaction됩니다.
  - 제한은 `tools.sessions_spawn.attachments`(`enabled`, `maxTotalBytes`, `maxFiles`, `maxFileBytes`, `retainOnSessionKeep`)로 구성합니다.
  - `attachAs.mountPath`는 향후 mount 구현을 위한 예약 힌트입니다.
- `sessions_spawn`은 non-blocking이며 즉시 `status: "accepted"`를 반환합니다.
- ACP `streamTo: "parent"` 응답에는 진행 history를 tailing하기 위한 `streamLogPath`(session-scoped `*.acp-stream.jsonl`)가 포함될 수 있습니다.
- `sessions_send`는 reply-back ping-pong을 수행합니다 (`REPLY_SKIP`로 중단, 최대 turn 수는 `session.agentToAgent.maxPingPongTurns`, 0–5).
- ping-pong 이후 target agent는 **announce step**을 실행합니다. announcement를 막으려면 `ANNOUNCE_SKIP`로 reply하세요.
- sandbox clamp: 현재 session이 sandboxed이고 `agents.defaults.sandbox.sessionToolsVisibility: "spawned"`이면, OpenClaw는 `tools.sessions.visibility`를 `tree`로 clamp합니다.

### `agents_list`

현재 session이 `sessions_spawn`으로 대상으로 지정할 수 있는 agent id를 나열합니다.

참고:

- 결과는 agent별 allowlist(`agents.list[].subagents.allowAgents`)로 제한됩니다.
- `["*"]`가 설정된 경우 tool은 구성된 모든 agent를 포함하고 `allowAny: true`를 표시합니다.

## Parameters (common)

Gateway-backed tool(`canvas`, `nodes`, `cron`):

- `gatewayUrl` (기본값 `ws://127.0.0.1:18789`)
- `gatewayToken` (auth가 활성화된 경우)
- `timeoutMs`

참고: `gatewayUrl`을 설정했다면 `gatewayToken`도 명시적으로 포함해야 합니다. override 시 tool은 config나 environment 자격 증명을 상속하지 않으며, 필요한 자격 증명이 명시되지 않으면 오류가 발생합니다.

Browser tool:

- `profile` (선택 사항, 기본값은 `browser.defaultProfile`)
- `target` (`sandbox` | `host` | `node`)
- `node` (선택 사항, 특정 node id/name 고정)
- 문제 해결 가이드:
  - Linux startup/CDP 문제: [Browser troubleshooting (Linux)](/tools/browser-linux-troubleshooting)
  - WSL2 Gateway + Windows remote Chrome CDP: [WSL2 + Windows + remote Chrome CDP troubleshooting](/tools/browser-wsl2-windows-remote-cdp-troubleshooting)

## Recommended agent flows

Browser automation:

1. `browser` → `status` / `start`
2. `snapshot` (ai 또는 aria)
3. `act` (click/type/press)
4. 시각적 확인이 필요하면 `screenshot`

Canvas render:

1. `canvas` → `present`
2. `a2ui_push` (선택 사항)
3. `snapshot`

Node targeting:

1. `nodes` → `status`
2. 선택한 node에 `describe`
3. `notify` / `run` / `camera_snap` / `screen_record`

## Safety

- 직접 `system.run`을 사용하지 말고, `nodes` → `run`은 명시적 사용자 동의가 있을 때만 사용하세요.
- camera/screen 캡처에 대해서는 사용자 동의를 존중하세요.
- media 명령을 호출하기 전에 `status/describe`로 권한을 확인하세요.

## How tools are presented to the agent

tool은 두 개의 병렬 채널로 agent에 노출됩니다:

1. **System prompt text**: 사람이 읽을 수 있는 목록 + 가이드.
2. **Tool schema**: model API로 전송되는 구조화된 function 정의.

즉, agent는 “어떤 tool이 존재하는가”와 “어떻게 호출하는가”를 모두 봅니다. tool이
system prompt나 schema에 나타나지 않으면, model은 해당 tool을 호출할 수 없습니다.
