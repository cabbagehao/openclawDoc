---
summary: "스트리밍 및 청킹(Chunking) 가이드: 블록 응답, 채널별 미리보기 스트리밍 및 모드 매핑 안내"
read_when:
  - 채팅 채널별 스트리밍 또는 청킹 동작 원리를 이해하고자 할 때
  - 블록 스트리밍이나 채널별 청킹 설정을 변경할 때
  - 중복 응답이나 미리보기 스트리밍 관련 문제를 디버깅할 때
title: "스트리밍 및 청킹"
x-i18n:
  source_path: "concepts/streaming.md"
---

# 스트리밍 및 청킹 (Streaming + Chunking)

OpenClaw는 두 가지 독립적인 스트리밍 계층을 제공함:

* **블록 스트리밍 (Block Streaming)**: 에이전트가 답변을 작성하는 동안 완성된 **텍스트 블록** 단위로 실제 메시지를 발송함. 이는 토큰 단위의 실시간 변화량(Delta)이 아닌, 일반적인 채널 메시지 형식임.
* **미리보기 스트리밍 (Preview Streaming)**: 생성 중인 내용을 임시 **미리보기 메시지**에 실시간으로 업데이트함 (Telegram, Discord, Slack 지원).

현재 일반 채팅 채널의 메시지 규격상 진정한 의미의 '토큰 단위 스트리밍'은 불가능하므로, 미리보기 스트리밍은 기존 메시지를 수정하거나 덧붙이는(Send + Edit/Append) 방식으로 구현됨.

## 블록 스트리밍 (채널 메시지)

에이전트의 출력을 의미 있는 덩어리(Chunk)로 나누어 실시간으로 전송함.

```
모델 출력 (Model output)
  └─ 텍스트 델타/이벤트
       ├─ (blockStreamingBreak=text_end)
       │    └─ 청커(Chunker)가 버퍼가 찰 때마다 블록 발송
       └─ (blockStreamingBreak=message_end)
            └─ 메시지 종료 시점에 모든 버퍼 데이터 발송
                   └─ 채널 메시지 전송 (블록 응답)
```

**주요 제어 항목:**

* `agents.defaults.blockStreamingDefault`: `"on"` / `"off"` (기본값: `off`).
* **채널별 오버라이드**: `*.blockStreaming` 설정을 통해 특정 채널에서만 강제로 활성화 가능.
* `blockStreamingBreak`: 블록을 끊는 기준 (`text_end` 또는 `message_end`).
* `blockStreamingChunk`: 최소/최대 글자 수 및 분할 우선순위(`breakPreference`) 설정.
* `blockStreamingCoalesce`: 전송 전 짧은 스트리밍 블록들을 하나로 병합하는 설정.
* **용량 제한**: `*.textChunkLimit` (예: WhatsApp의 글자 수 제한).
* **분할 모드**: `*.chunkMode` (길이 기준 또는 빈 줄 기준 분할).

## 청킹 알고리즘 및 경계 처리

`EmbeddedBlockChunker`를 통해 다음과 같이 블록을 분할함:

* **최소 제한 (Low bound)**: 버퍼 내용이 `minChars` 이상 쌓이기 전에는 전송하지 않음 (단, 강제 플러시 시점 제외).
* **최대 제한 (High bound)**: 가급적 `maxChars` 이전에 자연스럽게 끊으며, 필요 시 해당 위치에서 강제 분할함.
* **분할 우선순위**: 단락(`paragraph`) → 줄바꿈(`newline`) → 문장(`sentence`) → 공백(`whitespace`) → 강제 분할 순으로 적용함.
* **코드 블록 보호**: 코드 펜스(` ``` `) 내부에서는 절대 끊지 않음. 강제로 끊어야 할 경우 마크다운 문법이 깨지지 않도록 펜스를 닫고 다음 블록에서 다시 열어줌.

## 병합 (Coalescing) 처리

연속된 스트리밍 블록들을 전송 전 하나로 뭉쳐서 '한 줄씩 끊어 보내는 현상'을 방지함.

* **유휴 대기**: 지정된 시간(`idleMs`) 동안 추가 입력이 없을 때까지 기다린 후 전송함.
* **용량 관리**: 병합된 내용이 `maxChars`를 초과하면 즉시 전송함.
* **연결 문자**: 분할 우선순위 설정에 따라 적절한 구분자(줄바꿈, 공백 등)를 삽입함.

## 블록 간 자연스러운 시간 차 (Human-like Delay)

여러 개의 메시지 버블이 전송될 때 사람이 직접 타이핑하는 듯한 느낌을 주도록 블록 사이에 **무작위 지연 시간**을 추가할 수 있음.

* **설정**: `agents.defaults.humanDelay`.
* **모드**: `off` (기본값), `natural` (800\~2500ms 사이 자동), `custom` (직접 지정).
* 이 지연은 실시간 블록 응답에만 적용되며, 최종 응답이나 도구 실행 요약에는 적용되지 않음.

## 설정 조합에 따른 동작 차이

* **실시간 블록 전송**: `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"`. (Telegram 외 채널은 개별 활성화 필요)
* **종료 시 일괄 전송**: `blockStreamingBreak: "message_end"`. (메시지가 매우 길 경우 여러 개의 블록으로 나뉘어 전송될 수 있음)
* **스트리밍 미사용**: `blockStreamingDefault: "off"`. (최종 결과물만 한 번에 전송)

<Note>
  **채널별 참고**: `*.blockStreaming` 설정이 `true`가 아니면 기본적으로 블록 스트리밍은 작동하지 않음. 단, 실시간 미리보기 기능(`streaming` 모드)은 이와 별개로 작동할 수 있음.
</Note>

## 미리보기 스트리밍 모드 (Preview Streaming)

설정 키: `channels.<channel>.streaming`

* **`off`**: 미리보기 기능을 사용하지 않음.
* **`partial`**: 하나의 메시지를 생성하고 최신 내용으로 계속 덮어씀.
* **`block`**: 내용을 점진적으로 덧붙여가며 미리보기를 업데이트함.
* **`progress`**: 생성 중에는 진행 상태나 요약 문구를 보여주고, 완료 시 최종 답변으로 교체함.

### 채널별 지원 현황

| 채널           | `off` | `partial` | `block` |    `progress`   |
| :----------- | :---: | :-------: | :-----: | :-------------: |
| **Telegram** |   ✅   |     ✅     |    ✅    | (`partial`로 매핑) |
| **Discord**  |   ✅   |     ✅     |    ✅    | (`partial`로 매핑) |
| **Slack**    |   ✅   |     ✅     |    ✅    |        ✅        |

### 런타임 세부 동작

* **Telegram**: `sendMessage`와 `editMessageText`를 조합하여 미리보기를 구현함. 블록 스트리밍이 활성화된 경우 중복 표시 방지를 위해 미리보기는 자동으로 비활성화됨.
* **Discord**: 메시지 수정(Edit) 기능을 사용함. `block` 모드에서는 초안 청킹(`draftChunk`) 기술을 적용함.
* **Slack**: 가능한 경우 Slack 네이티브 스트리밍 API를 활용하여 가장 부드러운 미리보기를 제공함.
