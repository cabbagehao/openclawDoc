---
summary: "스트리밍과 chunking 동작(block reply, channel preview streaming, mode 매핑)"
read_when:
  - 채널에서 streaming이나 chunking이 어떻게 동작하는지 설명할 때
  - block streaming 또는 channel chunking 동작을 바꿀 때
  - 중복되거나 너무 이른 block reply, channel preview streaming 문제를 디버깅할 때
title: "Streaming and Chunking"
---

# Streaming + chunking

OpenClaw에는 서로 다른 두 가지 streaming 계층이 있습니다.

- **Block streaming (channels):** assistant가 작성하는 도중 완료된 **block**을 채널 메시지로 보냅니다. 토큰 delta가 아니라 일반 채널 메시지입니다.
- **Preview streaming (Telegram/Discord/Slack):** 생성 중인 임시 **preview message**를 갱신합니다.

현재 채널 메시지에는 진정한 token-delta streaming이 없습니다. preview streaming은 메시지 기반(send + edit/append)입니다.

## Block streaming (channel messages)

block streaming은 assistant 출력이 생성되는 대로 거친 단위의 chunk로 전송합니다.

```
Model output
  └─ text_delta/events
       ├─ (blockStreamingBreak=text_end)
       │    └─ chunker emits blocks as buffer grows
       └─ (blockStreamingBreak=message_end)
            └─ chunker flushes at message_end
                   └─ channel send (block replies)
```

범례:

- `text_delta/events`: 모델 stream 이벤트(비스트리밍 모델에서는 드물 수 있음)
- `chunker`: min/max 경계와 break preference를 적용하는 `EmbeddedBlockChunker`
- `channel send`: 실제 외부로 나가는 메시지(block reply)

**Controls:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"`(기본값 off)
- 채널 override: `*.blockStreaming` 및 계정별 변형으로 채널별 `"on"`/`"off"` 강제
- `agents.defaults.blockStreamingBreak`: `"text_end"` 또는 `"message_end"`
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }`(전송 전에 streamed block 병합)
- 채널 hard cap: `*.textChunkLimit`(예: `channels.whatsapp.textChunkLimit`)
- 채널 chunk mode: `*.chunkMode` (`length`가 기본, `newline`은 길이 분할 전에 빈 줄 기준으로 나눔)
- Discord soft cap: `channels.discord.maxLinesPerMessage`(기본값 17), UI clipping을 피하기 위해 긴 응답을 분할

**Boundary semantics:**

- `text_end`: chunker가 내보내는 즉시 block을 스트리밍하고, 각 `text_end`마다 flush
- `message_end`: assistant 메시지가 끝날 때까지 기다린 뒤 버퍼된 출력을 flush

`message_end`도 버퍼된 텍스트가 `maxChars`를 넘으면 chunker를 사용하므로, 마지막에 여러 chunk를 내보낼 수 있습니다.

## Chunking algorithm (low/high bounds)

block chunking은 `EmbeddedBlockChunker`가 구현합니다.

- **Low bound:** 버퍼가 `minChars` 이상이 되기 전에는 내보내지 않음(강제 flush 제외)
- **High bound:** `maxChars` 이전에서 자연스러운 분할을 선호하고, 강제 상황이면 `maxChars`에서 분할
- **Break preference:** `paragraph` → `newline` → `sentence` → `whitespace` → hard break
- **Code fences:** fence 내부에서는 절대 분할하지 않음. `maxChars`에서 강제로 끊을 때는 fence를 닫고 다시 열어 Markdown 유효성을 유지

`maxChars`는 채널 `textChunkLimit`에 맞춰 clamp되므로, 채널 한도를 초과할 수 없습니다.

## Coalescing (merge streamed blocks)

block streaming이 활성화되면, OpenClaw는 연속된 block chunk를 **병합**한 뒤 전송할 수 있습니다. 이렇게 하면 진행 중 출력은 유지하면서도 한 줄짜리 메시지 난발을 줄일 수 있습니다.

- coalescing은 **idle gap**(`idleMs`)이 생길 때까지 기다렸다가 flush합니다.
- 버퍼는 `maxChars`에 의해 제한되며, 초과하면 즉시 flush됩니다.
- `minChars`는 텍스트가 충분히 쌓일 때까지 너무 작은 조각의 전송을 막습니다.
  최종 flush는 남은 내용을 항상 전송합니다.
- joiner는 `blockStreamingChunk.breakPreference`에서 파생됩니다.
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → 공백)
- 채널 override는 `*.blockStreamingCoalesce`로 제공되며 계정별 설정도 가능합니다.
- Signal/Slack/Discord에서는 override가 없으면 기본 coalesce `minChars`가 1500으로 올라갑니다.

## Human-like pacing between blocks

block streaming이 활성화된 경우, 첫 block 이후 block reply 사이에 **무작위 지연**을 넣을 수 있습니다. 다중 버블 응답을 더 자연스럽게 보이게 하기 위한 기능입니다.

- 설정: `agents.defaults.humanDelay`(agent별로 `agents.list[].humanDelay`에서 override 가능)
- 모드: `off`(기본값), `natural`(800–2500ms), `custom`(`minMs`/`maxMs`)
- **block reply**에만 적용되며, 최종 응답이나 tool summary에는 적용되지 않습니다.

## “Stream chunks or everything”

이 옵션은 다음과 같이 매핑됩니다.

- **Stream chunks:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"`(생성 중 전송)
  Telegram 외 채널은 `*.blockStreaming: true`도 필요합니다.
- **Stream everything at end:** `blockStreamingBreak: "message_end"`(끝에서 한 번 flush, 너무 길면 여러 chunk 가능)
- **No block streaming:** `blockStreamingDefault: "off"`(최종 응답만 전송)

**채널 참고:** block streaming은 `*.blockStreaming`이 명시적으로 `true`로 설정되지 않으면 **꺼져 있습니다**. 반면 채널은 `channels.<channel>.streaming`을 통해 실시간 preview는 켤 수 있습니다.

설정 위치 참고: `blockStreaming*` 기본값은 루트가 아니라 `agents.defaults` 아래에 있습니다.

## Preview streaming modes

정식 키는 `channels.<channel>.streaming`입니다.

모드:

- `off`: preview streaming 비활성화
- `partial`: 단일 preview를 최신 텍스트로 교체
- `block`: chunked/appended 방식으로 preview 갱신
- `progress`: 생성 중 상태 preview를 보여주고 완료 후 최종 답변 전송

### Channel mapping

| Channel  | `off` | `partial` | `block` | `progress`        |
| -------- | ----- | --------- | ------- | ----------------- |
| Telegram | ✅    | ✅        | ✅      | maps to `partial` |
| Discord  | ✅    | ✅        | ✅      | maps to `partial` |
| Slack    | ✅    | ✅        | ✅      | ✅                |

Slack 전용:

- `channels.slack.nativeStreaming`은 `streaming=partial`일 때 Slack native streaming API 호출 사용 여부를 제어합니다(기본값: `true`).

레거시 키 마이그레이션:

- Telegram: `streamMode` + boolean `streaming`은 `streaming` enum으로 자동 마이그레이션
- Discord: `streamMode` + boolean `streaming`은 `streaming` enum으로 자동 마이그레이션
- Slack: `streamMode`는 `streaming` enum으로 자동 마이그레이션, boolean `streaming`은 `nativeStreaming`으로 자동 마이그레이션

### Runtime behavior

Telegram:

- DM과 group/topics 모두에서 `sendMessage` + `editMessageText`로 preview를 갱신합니다.
- Telegram block streaming이 명시적으로 활성화되어 있으면 중복 streaming을 피하기 위해 preview streaming은 건너뜁니다.
- `/reasoning stream`은 reasoning을 preview에 쓸 수 있습니다.

Discord:

- send + edit preview message를 사용합니다.
- `block` 모드는 `draftChunk`를 사용한 초안 chunking을 적용합니다.
- Discord block streaming이 명시적으로 활성화되어 있으면 preview streaming은 건너뜁니다.

Slack:

- `partial`은 가능할 경우 Slack native streaming(`chat.startStream`/`append`/`stop`)을 사용할 수 있습니다.
- `block`은 append 스타일 draft preview를 사용합니다.
- `progress`는 상태 preview 텍스트를 보여준 뒤 최종 응답을 전송합니다.
