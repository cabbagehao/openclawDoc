---
description: "세션 store, transcript JSONL, compaction, 유지관리와 디스크 제어까지 OpenClaw 세션 내부 동작을 설명합니다"
summary: "심층 분석: session store + transcript, lifecycle, 그리고 (auto)compaction 내부 동작"
read_when:
  - session id, transcript JSONL, 또는 sessions.json 필드를 디버깅해야 할 때
  - auto-compaction 동작을 변경하거나 “pre-compaction” housekeeping을 추가할 때
  - memory flush 또는 silent system turn을 구현하고 싶을 때
title: "세션 관리 심층 분석"
x-i18n:
  source_path: "reference/session-management-compaction.md"
---

# Session Management & Compaction (Deep Dive)

이 문서는 OpenClaw가 세션을 end-to-end로 관리하는 방식을 설명합니다:

- **Session routing** (인바운드 메시지가 `sessionKey`에 매핑되는 방식)
- **Session store** (`sessions.json`)와 여기에 추적되는 항목
- **Transcript persistence** (`*.jsonl`)와 그 구조
- **Transcript hygiene** (실행 전 provider별 수정 작업)
- **Context limits** (context window와 추적된 token의 차이)
- **Compaction** (수동 + auto-compaction) 및 pre-compaction 작업을 연결할 위치
- **Silent housekeeping** (예: 사용자에게 보이는 출력을 만들지 않아야 하는 memory write)

먼저 더 높은 수준의 개요가 필요하다면 다음부터 시작하세요:

- [/concepts/session](/concepts/session)
- [/concepts/compaction](/concepts/compaction)
- [/concepts/session-pruning](/concepts/session-pruning)
- [/reference/transcript-hygiene](/reference/transcript-hygiene)

---

## Source of truth: Gateway

OpenClaw는 session state를 소유하는 단일 **Gateway process**를 중심으로 설계되어 있습니다.

- UI(macOS app, web Control UI, TUI)는 session list와 token count를 Gateway에 질의해야 합니다.
- remote mode에서는 session file이 원격 호스트에 있으므로, “로컬 Mac 파일을 확인하는 것”은 Gateway가 실제로 사용하는 상태를 반영하지 않습니다.

---

## 두 개의 persistence 계층

OpenClaw는 세션을 두 계층에 걸쳐 persist합니다:

1. **Session store (`sessions.json`)**
   - 키/값 맵: `sessionKey -> SessionEntry`
   - 작고, 가변적이며, 편집(또는 항목 삭제)해도 안전함
   - 세션 메타데이터(현재 session id, 마지막 활동 시간, 토글, token counter 등)를 추적함

2. **Transcript (`<sessionId>.jsonl`)**
   - 트리 구조를 갖는 append-only transcript(항목은 `id` + `parentId`를 가짐)
   - 실제 대화 + tool call + compaction summary를 저장함
   - 향후 turn을 위한 model context를 다시 구성하는 데 사용됨

---

## 디스크상의 위치

Gateway 호스트에서 agent별 위치:

- Store: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transcript: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram topic session: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw는 이를 `src/config/sessions.ts`를 통해 resolve합니다.

---

## Store maintenance와 디스크 제어

Session persistence에는 `sessions.json`과 transcript artifact를 위한 자동 maintenance 제어(`session.maintenance`)가 있습니다:

- `mode`: `warn`(기본값) 또는 `enforce`
- `pruneAfter`: 오래된 항목의 연령 컷오프(기본값 `30d`)
- `maxEntries`: `sessions.json` 내 항목 상한(기본값 `500`)
- `rotateBytes`: `sessions.json`이 너무 커졌을 때 rotate(기본값 `10mb`)
- `resetArchiveRetention`: `*.reset.<timestamp>` transcript archive의 보존 기간(기본값: `pruneAfter`와 동일, `false`면 cleanup 비활성화)
- `maxDiskBytes`: 선택적 sessions directory 예산
- `highWaterBytes`: cleanup 후 목표치(선택 사항, 기본값 `maxDiskBytes`의 `80%`)

디스크 예산 cleanup(`mode: "enforce"`)의 enforcement 순서:

1. 가장 오래된 archived 또는 orphan transcript artifact를 먼저 제거합니다.
2. 여전히 목표치보다 높으면, 가장 오래된 session entry와 해당 transcript file을 제거합니다.
3. 사용량이 `highWaterBytes` 이하가 될 때까지 계속합니다.

`mode: "warn"`에서는 OpenClaw가 가능한 eviction을 보고만 하고 store/file을 변경하지는 않습니다.

필요할 때 maintenance 실행:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron session과 run log

격리된 cron 실행도 session entry/transcript를 생성하며, 전용 보존 제어가 있습니다:

- `cron.sessionRetention`(기본값 `24h`)은 오래된 격리 cron run session을 session store에서 정리합니다(`false`면 비활성화).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines`는 `~/.openclaw/cron/runs/<jobId>.jsonl` file을 정리합니다(기본값: `2_000_000` bytes 및 `2000` lines).

---

## Session key (`sessionKey`)

`sessionKey`는 _어떤 대화 버킷_ 안에 있는지를 식별합니다(routing + isolation).

일반적인 패턴:

- 메인/direct chat (agent별): `agent:<agentId>:<mainKey>` (기본값 `main`)
- Group: `agent:<agentId>:<channel>:group:<id>`
- Room/channel (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` 또는 `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (override하지 않는 한)

정식 규칙은 [/concepts/session](/concepts/session)에 문서화되어 있습니다.

---

## Session id (`sessionId`)

각 `sessionKey`는 현재 `sessionId`(대화를 이어 가는 transcript file)를 가리킵니다.

실무적인 규칙:

- **Reset** (`/new`, `/reset`)은 해당 `sessionKey`에 대해 새 `sessionId`를 만듭니다.
- **Daily reset** (기본값: gateway host의 로컬 시간 오전 4:00)는 reset 경계를 지난 후 다음 메시지에서 새 `sessionId`를 만듭니다.
- **Idle expiry** (`session.reset.idleMinutes` 또는 레거시 `session.idleMinutes`)는 idle window 이후에 메시지가 도착하면 새 `sessionId`를 만듭니다. daily + idle이 모두 구성된 경우, 먼저 만료되는 쪽이 우선합니다.
- **Thread parent fork guard** (`session.parentForkMaxTokens`, 기본값 `100000`)는 부모 session이 이미 너무 클 때 parent transcript forking을 건너뜁니다. 새 thread는 깨끗한 상태에서 시작합니다. 비활성화하려면 `0`으로 설정하세요.

구현 세부 사항: 이 판단은 `src/auto-reply/reply/session.ts`의 `initSessionState()`에서 이루어집니다.

---

## Session store schema (`sessions.json`)

Store의 값 타입은 `src/config/sessions.ts`의 `SessionEntry`입니다.

주요 필드(전체는 아님):

- `sessionId`: 현재 transcript id (`sessionFile`이 설정되지 않았다면 파일명은 여기서 파생됨)
- `updatedAt`: 마지막 활동 timestamp
- `sessionFile`: 선택적인 명시적 transcript path override
- `chatType`: `direct | group | room` (UI와 send policy에 도움)
- `provider`, `subject`, `room`, `space`, `displayName`: group/channel label용 메타데이터
- 토글:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (세션별 override)
- Model 선택:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Token counter (best-effort / provider-dependent):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: 이 session key에서 auto-compaction이 완료된 횟수
- `memoryFlushAt`: 마지막 pre-compaction memory flush의 timestamp
- `memoryFlushCompactionCount`: 마지막 flush가 실행되었을 때의 compaction count

Store는 편집해도 안전하지만, 권한은 Gateway에 있습니다. 세션이 실행되면서 항목을 다시 쓰거나 다시 hydrate할 수 있습니다.

---

## Transcript 구조 (`*.jsonl`)

Transcript는 `@mariozechner/pi-coding-agent`의 `SessionManager`가 관리합니다.

파일은 JSONL 형식입니다:

- 첫 줄: session header (`type: "session"`, `id`, `cwd`, `timestamp`, 선택적 `parentSession` 포함)
- 이후: `id` + `parentId`를 갖는 session entry(트리 구조)

주요 entry type:

- `message`: user/assistant/toolResult 메시지
- `custom_message`: model context에 _들어가는_ extension 주입 메시지(UI에서는 숨길 수 있음)
- `custom`: model context에 _들어가지 않는_ extension state
- `compaction`: `firstKeptEntryId`와 `tokensBefore`를 포함한 persist된 compaction summary
- `branch_summary`: 트리 branch를 탐색할 때 persist되는 summary

OpenClaw는 의도적으로 transcript를 “fix up”하지 않습니다. Gateway는 `SessionManager`를 사용해 transcript를 읽고 씁니다.

---

## Context window와 추적 token의 차이

중요한 개념은 서로 다른 두 가지입니다:

1. **Model context window**: 모델별 하드 한도(모델에 보이는 token 수)
2. **Session store counter**: `sessions.json`에 기록되는 rolling 통계(`/status`와 dashboard에서 사용)

한도를 조정하고 있다면:

- context window는 model catalog에서 오며(config로 override 가능), 
- store의 `contextTokens`는 런타임 추정/보고 값이므로 엄격한 보장으로 취급하면 안 됩니다.

자세한 내용은 [/token-use](/reference/token-use)를 참고하세요.

---

## Compaction: 무엇인가

Compaction은 transcript에 persist된 `compaction` entry 형태로 오래된 대화를 요약하고, 최근 메시지는 그대로 유지합니다.

Compaction 후 미래의 turn에서는 다음이 보입니다:

- compaction summary
- `firstKeptEntryId` 이후의 메시지

Compaction은 **영구적**입니다(session pruning과 다름). [/concepts/session-pruning](/concepts/session-pruning)을 참고하세요.

---

## Auto-compaction이 발생하는 시점 (Pi runtime)

임베디드 Pi agent에서 auto-compaction은 두 경우에 트리거됩니다:

1. **Overflow recovery**: 모델이 context overflow error를 반환함 → compact → 재시도.
2. **Threshold maintenance**: 성공적인 turn 후 다음 조건일 때:

`contextTokens > contextWindow - reserveTokens`

여기서:

- `contextWindow`는 모델의 context window
- `reserveTokens`는 prompt + 다음 model output을 위해 남겨 두는 headroom

이는 Pi runtime의 동작 의미입니다(OpenClaw가 이벤트를 소비하긴 하지만, compact 시점은 Pi가 결정합니다).

---

## Compaction 설정 (`reserveTokens`, `keepRecentTokens`)

Pi의 compaction 설정은 Pi settings에 있습니다:

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw는 임베디드 실행에 대해 safety floor도 강제합니다:

- `compaction.reserveTokens < reserveTokensFloor`이면 OpenClaw가 값을 올립니다.
- 기본 floor는 `20000` token입니다.
- floor를 끄려면 `agents.defaults.compaction.reserveTokensFloor: 0`으로 설정하세요.
- 이미 더 높은 값이면 OpenClaw는 그대로 둡니다.

이유: compaction이 불가피해지기 전에 multi-turn “housekeeping”(예: memory write)을 수행할 수 있을 만큼 충분한 headroom을 남기기 위해서입니다.

구현: `src/agents/pi-settings.ts`의 `ensurePiCompactionReserveTokens()`
(`src/agents/pi-embedded-runner.ts`에서 호출됨).

---

## 사용자에게 보이는 표면

다음에서 compaction과 session state를 관찰할 수 있습니다:

- `/status` (모든 chat session에서)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- verbose mode: `🧹 Auto-compaction complete` + compaction count

---

## Silent housekeeping (`NO_REPLY`)

OpenClaw는 사용자가 중간 출력을 보면 안 되는 백그라운드 작업을 위해 “silent” turn을 지원합니다.

규칙:

- assistant는 출력 시작을 `NO_REPLY`로 시작하여 “사용자에게 reply를 전달하지 말라”는 뜻을 나타냅니다.
- OpenClaw는 delivery layer에서 이를 제거/억제합니다.

`2026.1.10`부터는 partial chunk가 `NO_REPLY`로 시작할 때 **draft/typing streaming**도 억제하므로, silent 작업이 turn 중간에 partial output을 유출하지 않습니다.

---

## Pre-compaction “memory flush” (구현됨)

목표: auto-compaction이 일어나기 전에 디스크에 durable state(예: agent workspace의 `memory/YYYY-MM-DD.md`)를 쓰는 silent agentic turn을 실행하여, compaction이 중요한 context를 지워 버리지 못하게 합니다.

OpenClaw는 **pre-threshold flush** 방식을 사용합니다:

1. session context 사용량을 모니터링합니다.
2. usage가 “soft threshold”(Pi compaction threshold보다 낮음)를 넘으면 agent에 대해 silent
   “지금 memory를 써라” directive를 실행합니다.
3. `NO_REPLY`를 사용해 사용자는 아무것도 보지 않게 합니다.

Config (`agents.defaults.compaction.memoryFlush`):

- `enabled` (기본값: `true`)
- `softThresholdTokens` (기본값: `4000`)
- `prompt` (flush turn용 user message)
- `systemPrompt` (flush turn에 추가되는 extra system prompt)

참고:

- 기본 prompt/system prompt에는 delivery를 억제하기 위한 `NO_REPLY` 힌트가 포함됩니다.
- flush는 compaction cycle당 한 번 실행됩니다(`sessions.json`에서 추적).
- flush는 임베디드 Pi session에서만 실행됩니다(CLI backend는 건너뜀).
- session workspace가 read-only일 때는 flush를 건너뜁니다(`workspaceAccess: "ro"` 또는 `"none"`).
- workspace file layout과 write pattern은 [Memory](/concepts/memory)를 참고하세요.

Pi는 extension API에서 `session_before_compact` hook도 노출하지만, 현재 OpenClaw의 flush 로직은 Gateway 측에 있습니다.

---

## 문제 해결 체크리스트

- Session key가 잘못됐나요? [/concepts/session](/concepts/session)부터 시작하고 `/status`의 `sessionKey`를 확인하세요.
- Store와 transcript가 맞지 않나요? `openclaw status`에서 Gateway host와 store path를 확인하세요.
- Compaction이 너무 자주 발생하나요? 다음을 확인하세요:
  - model context window (너무 작음)
  - compaction 설정 (모델 window에 비해 `reserveTokens`가 너무 높으면 더 이른 compaction이 발생할 수 있음)
  - tool-result 팽창: session pruning을 활성화/조정하세요
- Silent turn이 유출되나요? reply가 `NO_REPLY`(정확한 token)로 시작하는지, 그리고 streaming suppression fix가 포함된 build인지 확인하세요.
