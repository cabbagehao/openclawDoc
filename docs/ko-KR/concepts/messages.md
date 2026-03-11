---
summary: "메시지 흐름, 세션, 큐잉, 추론 가시성"
read_when:
  - 들어오는 메시지가 어떻게 응답으로 바뀌는지 설명할 때
  - 세션, 큐잉 모드, 스트리밍 동작을 명확히 할 때
  - 추론 가시성과 사용량 영향을 문서화할 때
title: "메시지"
---

# 메시지

이 페이지는 OpenClaw가 들어오는 메시지, 세션, 큐잉,
스트리밍, 추론 가시성을 어떻게 처리하는지 연결해서 설명합니다.

## 메시지 흐름(상위 수준)

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

주요 제어값은 설정에 있습니다.

- 접두사, 큐잉, 그룹 동작은 `messages.*`
- 블록 스트리밍과 청킹 기본값은 `agents.defaults.*`
- 상한과 스트리밍 토글은 채널별 재정의(`channels.whatsapp.*`, `channels.telegram.*` 등)

전체 스키마는 [설정](/gateway/configuration)을 참고하세요.

## 인바운드 중복 제거

채널은 재연결 후 같은 메시지를 다시 전달할 수 있습니다. OpenClaw는 채널/계정/피어/세션/메시지 ID를 키로 하는 짧은 수명의 캐시를 유지하여 중복 전달이 또 다른 에이전트 런을 유발하지 않도록 합니다.

## 인바운드 디바운싱

**같은 발신자**의 빠른 연속 메시지는 `messages.inbound`를 통해 하나의 에이전트 턴으로 묶을 수 있습니다. 디바운싱은 채널 + 대화 단위로 적용되며, 응답 스레딩/ID에는 가장 최근 메시지를 사용합니다.

설정(전역 기본값 + 채널별 재정의):

```json5
{
  messages: {
    inbound: {
      debounceMs: 2000,
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
        discord: 1500,
      },
    },
  },
}
```

참고:

- 디바운스는 **텍스트 전용** 메시지에만 적용됩니다. 미디어/첨부물은 즉시 플러시됩니다.
- 제어 명령은 독립형으로 유지되도록 디바운싱을 우회합니다.

## 세션과 기기

세션은 클라이언트가 아니라 게이트웨이가 소유합니다.

- 직접 채팅은 에이전트 메인 세션 키로 합쳐집니다.
- 그룹/채널은 각자 고유한 세션 키를 가집니다.
- 세션 저장소와 전사본은 게이트웨이 호스트에 있습니다.

여러 기기/채널이 같은 세션으로 매핑될 수 있지만, 기록이 모든 클라이언트로 완전히 다시 동기화되지는 않습니다. 권장 사항: 컨텍스트 분기를 피하려면 긴 대화에는 기본 기기 하나를 사용하세요. Control UI와 TUI는 항상 게이트웨이 기반 세션 전사본을 보여주므로 그것이 단일 진실 공급원입니다.

자세한 내용: [세션 관리](/concepts/session).

## 인바운드 본문과 기록 컨텍스트

OpenClaw는 **프롬프트 본문**과 **명령 본문**을 분리합니다.

- `Body`: 에이전트로 전송되는 프롬프트 텍스트. 채널 엔벨로프와 선택적 기록 래퍼를 포함할 수 있습니다.
- `CommandBody`: 지시어/명령 파싱을 위한 원본 사용자 텍스트.
- `RawBody`: `CommandBody`의 레거시 별칭(호환성을 위해 유지).

채널이 기록을 제공하면 공통 래퍼를 사용합니다.

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

**비직접 채팅**(그룹/채널/룸)의 경우, **현재 메시지 본문** 앞에 발신자 레이블이 붙습니다(기록 엔트리와 같은 스타일). 이렇게 하면 실시간 메시지와 큐/기록 메시지가 에이전트 프롬프트에서 일관되게 보입니다.

기록 버퍼는 **pending-only**입니다. 즉, 실행을 트리거하지 않은 그룹 메시지(예: 멘션 게이트된 메시지)를 포함하고, 이미 세션 전사본에 있는 메시지는 **제외**합니다.

지시어 제거는 **현재 메시지** 섹션에만 적용되므로 기록은 그대로 유지됩니다. 기록을 래핑하는 채널은 `CommandBody`(또는 `RawBody`)에 원본 메시지 텍스트를 넣고, `Body`는 합쳐진 프롬프트로 유지해야 합니다.
기록 버퍼는 `messages.groupChat.historyLimit`(전역 기본값)과
`channels.slack.historyLimit` 또는 `channels.telegram.accounts.<id>.historyLimit` 같은 채널별 재정의로 설정합니다(`0`이면 비활성화).

## 큐잉과 후속 메시지

이미 런이 활성화되어 있으면 들어오는 메시지는 큐에 넣거나, 현재 런에 조향하거나, 후속 턴을 위해 수집할 수 있습니다.

- `messages.queue`(및 `messages.queue.byChannel`)로 설정합니다.
- 모드: `interrupt`, `steer`, `followup`, `collect`, 그리고 backlog 변형.

자세한 내용: [큐잉](/concepts/queue).

## 스트리밍, 청킹, 배칭

블록 스트리밍은 모델이 텍스트 블록을 생성하는 동안 부분 응답을 전송합니다.
청킹은 채널 텍스트 제한을 존중하고 fenced code를 분리하지 않도록 합니다.

주요 설정:

- `agents.defaults.blockStreamingDefault` (`on|off`, 기본 off)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (유휴 시간 기반 배칭)
- `agents.defaults.humanDelay` (블록 응답 사이 사람 같은 지연)
- 채널 재정의: `*.blockStreaming` 및 `*.blockStreamingCoalesce` (Telegram이 아닌 채널은 명시적 `*.blockStreaming: true` 필요)

자세한 내용: [스트리밍 + 청킹](/concepts/streaming).

## 추론 가시성과 토큰

OpenClaw는 모델 추론을 표시하거나 숨길 수 있습니다.

- `/reasoning on|off|stream`이 가시성을 제어합니다.
- 추론 내용은 모델이 생성하면 토큰 사용량에 계속 포함됩니다.
- Telegram은 초안 버블에서 추론 스트림을 지원합니다.

자세한 내용: [Thinking + reasoning 지시어](/tools/thinking) 및 [토큰 사용량](/reference/token-use).

## 접두사, 스레딩, 응답

발신 메시지 형식은 `messages`에서 중앙 관리됩니다.

- `messages.responsePrefix`, `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`(발신 접두사 단계적 적용), 그리고 `channels.whatsapp.messagePrefix`(WhatsApp 수신 접두사)
- `replyToMode`와 채널별 기본값을 통한 응답 스레딩

자세한 내용: [설정](/gateway/configuration#messages) 및 각 채널 문서를 참고하세요.
