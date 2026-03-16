---
summary: "Streaming + chunking behavior (block replies, channel preview streaming, mode mapping)"
description: "OpenClaw의 block streaming과 preview streaming이 어떻게 다르고, chunking·coalescing·channel mode가 어떻게 동작하는지 설명합니다."
read_when:
  - channel에서 streaming이나 chunking이 어떻게 동작하는지 설명해야 할 때
  - block streaming이나 channel chunking 동작을 바꿔야 할 때
  - duplicate/early block reply나 preview streaming을 디버깅할 때
title: "Streaming and Chunking"
x-i18n:
  source_path: "concepts/streaming.md"
---

# Streaming + chunking

OpenClaw에는 서로 다른 두 개의 streaming layer가 있습니다.

- **Block streaming (channels):** assistant가 작성하는 동안 완성된 **block**을 보냄.
  이것은 일반 channel message이지 token delta가 아닙니다
- **Preview streaming (Telegram/Discord/Slack):** 생성 중 임시 **preview message**를
  update함

현재 channel message에는 **true token-delta streaming**이 없습니다.
preview streaming도 message 기반
(send + edit/append)입니다.

## Block streaming (channel messages)

block streaming은 assistant output이 준비되는 대로 비교적 큰 chunk로 나눠 보냅니다.

```text
Model output
  └─ text_delta/events
       ├─ (blockStreamingBreak=text_end)
       │    └─ chunker emits blocks as buffer grows
       └─ (blockStreamingBreak=message_end)
            └─ chunker flushes at message_end
                   └─ channel send (block replies)
```

legend:

- `text_delta/events`: model stream event
  (non-streaming model에서는 sparse할 수 있음)
- `chunker`: min/max bound와 break preference를 적용하는 `EmbeddedBlockChunker`
- `channel send`: 실제 outbound message

**Controls:**

- `agents.defaults.blockStreamingDefault`:
  `"on"` / `"off"` (기본값 off)
- channel override:
  `*.blockStreaming`
  (account별 variant 포함)으로 channel마다 `"on"` / `"off"` 강제 가능
- `agents.defaults.blockStreamingBreak`:
  `"text_end"` 또는 `"message_end"`
- `agents.defaults.blockStreamingChunk`:
  `{ minChars, maxChars, breakPreference? }`
- `agents.defaults.blockStreamingCoalesce`:
  `{ minChars?, maxChars?, idleMs? }`
  (send 전에 streamed block 병합)
- channel hard cap:
  `*.textChunkLimit`
  (예: `channels.whatsapp.textChunkLimit`)
- channel chunk mode:
  `*.chunkMode`
  (`length` 기본값, `newline`은 빈 줄 단위로 먼저 자른 뒤 길이 기준 적용)
- Discord soft cap:
  `channels.discord.maxLinesPerMessage`
  (기본값 17)
  너무 높은 reply가 UI에서 잘리는 것을 막기 위해 분할

**Boundary semantics:**

- `text_end`: chunker가 emit하는 즉시 stream하고, 각 `text_end`마다 flush
- `message_end`: assistant message가 끝날 때까지 기다렸다가 buffered output을 flush

`message_end`여도 buffered text가 `maxChars`를 넘으면 chunker를 사용하므로 끝에서 여러
chunk가 나갈 수 있습니다.

## Chunking algorithm (low/high bounds)

block chunking은 `EmbeddedBlockChunker`로 구현됩니다.

- **Low bound:** buffer가 `minChars` 이상이 되기 전에는 emit하지 않음
  (강제 flush 제외)
- **High bound:** 가능하면 `maxChars` 이전에서 split하고, 강제 시 `maxChars`에서 split
- **Break preference:**
  `paragraph` → `newline` → `sentence` → `whitespace` → hard break
- **Code fence:** code fence 안에서는 split하지 않음.
  `maxChars`에서 강제로 잘라야 할 때는 Markdown이 깨지지 않도록 fence를 닫고 다시 엽니다

`maxChars`는 channel `textChunkLimit`으로 clamp되므로, channel cap을 넘길 수 없습니다.

## Coalescing (merge streamed blocks)

block streaming이 켜져 있으면, OpenClaw는 연속된 block chunk를 **하나로 merge**한 뒤
보낼 수 있습니다. 한 줄짜리 message가 계속 나가는 현상을 줄이면서도 progress output은
유지할 수 있습니다.

- coalescing은 **idle gap**(`idleMs`)이 생길 때까지 기다렸다가 flush합니다
- buffer가 `maxChars`를 넘으면 즉시 flush합니다
- `minChars`는 너무 작은 fragment가 바로 전송되지 않도록 막습니다
  (최종 flush는 남은 내용을 항상 전송)
- joiner는 `blockStreamingChunk.breakPreference`에서 파생됩니다
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → space)
- `*.blockStreamingCoalesce`로 channel override도 가능합니다
  (account별 config 포함)
- Signal/Slack/Discord는 override가 없으면 기본 coalesce `minChars`를 1500으로 높입니다

## Human-like pacing between blocks

block streaming이 켜져 있을 때, block reply 사이
(첫 block 이후)에 **랜덤 지연**을 넣을 수 있습니다.
multi-bubble response를 더 자연스럽게 보이게 하는 기능입니다.

- config:
  `agents.defaults.humanDelay`
  (agent별 `agents.list[].humanDelay`로 override 가능)
- mode:
  `off` (기본값),
  `natural` (800–2500ms),
  `custom` (`minMs` / `maxMs`)
- **block reply**에만 적용되며, final reply나 tool summary에는 적용되지 않습니다

## "Stream chunks or everything"

이 선택은 다음 설정으로 대응됩니다.

- **Stream chunks:**
  `blockStreamingDefault: "on"` +
  `blockStreamingBreak: "text_end"`
  (생성되는 대로 emit).
  Telegram 외 channel은 `*.blockStreaming: true`도 필요
- **Stream everything at end:**
  `blockStreamingBreak: "message_end"`
  (끝에서 한 번 flush, 너무 길면 여러 chunk 가능)
- **No block streaming:**
  `blockStreamingDefault: "off"`
  (final reply만 전송)

**Channel note:** block streaming은 `*.blockStreaming`이 명시적으로 `true`일 때만
동작합니다. 대신 channel은 live preview
(`channels.<channel>.streaming`)를 block reply 없이 사용할 수 있습니다.

참고로 `blockStreaming*` 기본값은 root config가 아니라 `agents.defaults` 아래에
있습니다.

## Preview streaming modes

canonical key:
`channels.<channel>.streaming`

mode:

- `off`: preview streaming 비활성화
- `partial`: single preview를 최신 text로 계속 교체
- `block`: preview를 chunked/appended step으로 갱신
- `progress`: 생성 중에는 progress/status preview, 완료 후 최종 answer 전송

### Channel mapping

| Channel  | `off` | `partial` | `block` | `progress`        |
| -------- | ----- | --------- | ------- | ----------------- |
| Telegram | ✅    | ✅        | ✅      | maps to `partial` |
| Discord  | ✅    | ✅        | ✅      | maps to `partial` |
| Slack    | ✅    | ✅        | ✅      | ✅                |

Slack 전용:

- `channels.slack.nativeStreaming`은 `streaming=partial`일 때 Slack native streaming API
  call 사용 여부를 제어합니다
  (기본값 `true`)

legacy key migration:

- Telegram:
  `streamMode` + boolean `streaming` → `streaming` enum으로 자동 migration
- Discord:
  `streamMode` + boolean `streaming` → `streaming` enum으로 자동 migration
- Slack:
  `streamMode` → `streaming` enum으로 자동 migration,
  boolean `streaming` → `nativeStreaming`으로 자동 migration

### Runtime behavior

Telegram:

- DM과 group/topic에서 `sendMessage` + `editMessageText`로 preview를 갱신
- Telegram block streaming이 명시적으로 켜져 있으면 preview streaming은 skip
  (double-streaming 방지)
- `/reasoning stream`은 preview에 reasoning을 쓸 수 있음

Discord:

- send + edit preview message 사용
- `block` mode는 `draftChunk`를 사용
- Discord block streaming이 명시적으로 켜져 있으면 preview streaming은 skip

Slack:

- `partial`은 가능하면 Slack native streaming
  (`chat.startStream` / `append` / `stop`)을 사용
- `block`은 append-style draft preview 사용
- `progress`는 status preview text 후 최종 answer 전송
