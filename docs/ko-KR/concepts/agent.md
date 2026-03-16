---
summary: "Agent runtime (embedded pi-mono), workspace contract, and session bootstrap"
description: "OpenClaw의 단일 embedded agent runtime이 workspace, bootstrap file, tool, skill, session을 어떻게 구성하는지 설명합니다."
read_when:
  - agent runtime, workspace bootstrap, session 동작을 바꾸거나 이해할 때
title: "Agent Runtime"
x-i18n:
  source_path: "concepts/agent.md"
---

# Agent Runtime 🤖

OpenClaw는 **pi-mono**에서 파생된 단일 embedded agent runtime을 실행합니다.

## Workspace (required)

OpenClaw는 단일 agent workspace directory(`agents.defaults.workspace`)를
tool과 context의 **유일한** working directory(`cwd`)로 사용합니다.

권장: `openclaw setup`을 사용해 `~/.openclaw/openclaw.json`이 없으면 생성하고,
workspace file을 초기화하세요.

전체 workspace layout과 backup guide: [Agent workspace](/concepts/agent-workspace)

`agents.defaults.sandbox`가 활성화되어 있으면 non-main session은
`agents.defaults.sandbox.workspaceRoot` 아래의 per-session workspace로 이를 override할 수 있습니다.
자세한 내용은 [Gateway configuration](/gateway/configuration)을 참고하세요.

## Bootstrap files (injected)

`agents.defaults.workspace` 안에서 OpenClaw는 다음 user-editable file을 기대합니다.

- `AGENTS.md` — operating instruction과 “memory”
- `SOUL.md` — persona, boundary, tone
- `TOOLS.md` — 사용자가 관리하는 tool note (예: `imsg`, `sag`, convention)
- `BOOTSTRAP.md` — one-time first-run ritual (완료 후 삭제)
- `IDENTITY.md` — agent name, vibe, emoji
- `USER.md` — user profile과 preferred address

새 session의 첫 turn에서 OpenClaw는 이 file의 내용을 agent context에 직접 inject합니다.

blank file은 건너뜁니다. 큰 file은 prompt를 가볍게 유지하기 위해 trim/truncate되며,
전체 내용은 원본 file을 직접 읽으면 됩니다.

file이 없으면 OpenClaw는 단일 “missing file” marker line을 inject합니다.
(`openclaw setup`은 안전한 기본 template도 만들어 줍니다)

`BOOTSTRAP.md`는 **brand new workspace**에서만 생성됩니다.
(다른 bootstrap file이 하나도 없을 때)
ritual을 마치고 삭제하면 이후 restart에서 다시 만들어지지 않아야 합니다.

bootstrap file 생성을 완전히 끄려면(이미 준비된 workspace용):

```json5
{ agent: { skipBootstrap: true } }
```

## Built-in tools

core tool(read/exec/edit/write와 관련 system tool)은 tool policy에 따라 항상 available합니다.
`apply_patch`는 optional이며 `tools.exec.applyPatch`로 gate됩니다.
`TOOLS.md`는 어떤 tool이 존재하는지를 결정하지 않고, **어떻게 사용하길 원하는지**에 대한 guidance만 제공합니다.

## Skills

OpenClaw는 세 위치에서 skill을 로드합니다. (이름 충돌 시 workspace 우선)

- Bundled (설치본에 포함)
- Managed/local: `~/.openclaw/skills`
- Workspace: `<workspace>/skills`

skill은 config/env에 의해 gate될 수 있습니다. ([Gateway configuration](/gateway/configuration)의 `skills` 참고)

## pi-mono integration

OpenClaw는 pi-mono codebase의 일부(model/tool)를 재사용하지만,
**session management, discovery, tool wiring은 OpenClaw가 소유**합니다.

- pi-coding agent runtime 없음
- `~/.pi/agent` 또는 `<workspace>/.pi` 설정을 읽지 않음

## Sessions

session transcript는 다음 위치의 JSONL로 저장됩니다.

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

session id는 OpenClaw가 안정적으로 선택합니다.
legacy Pi/Tau session folder는 읽지 않습니다.

## Steering while streaming

queue mode가 `steer`이면 inbound message는 현재 run에 주입됩니다.
queue는 **각 tool call 이후** 확인되며, queued message가 있으면 현재 assistant message의 남은 tool call을 skip합니다.
(tool result에는 `"Skipped due to queued user message."` 오류 결과 기록)
그 뒤 queued user message를 주입하고 다음 assistant response를 진행합니다.

queue mode가 `followup` 또는 `collect`이면 inbound message는 현재 turn이 끝날 때까지 보류되고,
이후 queued payload로 새 agent turn이 시작됩니다.
mode와 debounce/cap 동작은 [Queue](/concepts/queue)를 참고하세요.

block streaming은 completed assistant block이 끝나는 즉시 전송되도록 합니다.
기본값은 **off**입니다. (`agents.defaults.blockStreamingDefault: "off"`)
경계는 `agents.defaults.blockStreamingBreak`로 조절합니다. (`text_end` vs `message_end`, 기본값 `text_end`)
soft block chunking은 `agents.defaults.blockStreamingChunk`로 제어합니다.
(기본 800–1200자, paragraph break 우선, 다음 newline, 마지막으로 sentence)
`agents.defaults.blockStreamingCoalesce`로 streamed chunk를 병합해 single-line spam을 줄일 수 있습니다.
Telegram이 아닌 channel은 block reply를 활성화하려면 명시적으로 `*.blockStreaming: true`가 필요합니다.
verbose tool summary는 tool 시작 시 즉시 전송되며, Control UI는 가능하면 agent event로 tool output을 stream합니다.
자세한 내용은 [Streaming + chunking](/concepts/streaming)을 참고하세요.

## Model refs

config의 model ref(`agents.defaults.model`, `agents.defaults.models`)는 첫 번째 `/`를 기준으로 parse됩니다.

- model 설정에는 `provider/model`을 사용하세요.
- model ID 자체에 `/`가 포함되면(OpenRouter 스타일) provider prefix를 포함하세요. 예: `openrouter/moonshotai/kimi-k2`
- provider를 생략하면 OpenClaw는 이를 alias 또는 **default provider**용 model로 처리합니다. (model ID에 `/`가 없을 때만 가능)

## Configuration (minimal)

최소한 다음을 설정하세요.

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom` (강력 권장)

---

_Next: [Group Chats](/channels/group-messages)_ 🦞
