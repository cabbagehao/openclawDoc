---
summary: "에이전트, 메시지 봉투(Envelope) 및 시스템 프롬프트의 시간대(Timezone) 처리 가이드"
read_when:
  - 모델에 표시되는 타임스탬프 정규화 방식을 이해하고자 할 때
  - 시스템 프롬프트용 사용자 시간대를 설정할 때
title: "시간대 (Timezones)"
x-i18n:
  source_path: "concepts/timezone.md"
---

# 시간대 (Timezones)

OpenClaw는 모델이 **단일 기준 시간**을 참조할 수 있도록 모든 타임스탬프를 표준화하여 처리함.

## 메시지 봉투 (Envelope) (기본값: 로컬)

수신되는 메시지는 다음과 같은 형식의 봉투(Envelope)로 감싸짐:

```
[Provider ... 2026-01-05 16:26 PST] message text
```

봉투에 포함되는 타임스탬프는 기본적으로 **호스트 로컬 시간** 기준이며, 분 단위 정밀도를 제공함.

다음 설정을 통해 시간대 표시 방식을 변경할 수 있음:

```json5
{
  agents: {
    defaults: {
      envelopeTimezone: "local", // "utc" | "local" | "user" | IANA 시간대 이름
      envelopeTimestamp: "on", // "on" | "off"
      envelopeElapsed: "on", // "on" | "off"
    },
  },
}
```

* `envelopeTimezone: "utc"`: UTC 시간 기준 사용.
* `envelopeTimezone: "user"`: `agents.defaults.userTimezone` 설정값 사용 (설정되지 않은 경우 호스트 시간대로 대체).
* 고정 시간대 지정: IANA 시간대 이름(예: `"Asia/Seoul"`)을 직접 사용하여 고정된 오프셋 적용 가능.
* `envelopeTimestamp: "off"`: 헤더에서 절대 타임스탬프 정보 제거.
* `envelopeElapsed: "off"`: 경과 시간 접미사(`+2m` 형식) 제거.

### 표시 예시

**로컬 시간 (기본값):**

```
[Signal Alice +1555 2026-01-18 00:19 PST] hello
```

**고정 시간대:**

```
[Signal Alice +1555 2026-01-18 06:19 GMT+1] hello
```

**경과 시간 표시:**

```
[Signal Alice +1555 +2m 2026-01-18T05:19Z] follow-up
```

## 도구 페이로드 (공급자 원본 + 정규화 필드)

메시지 읽기 도구(`channels.slack.readMessages` 등)는 **공급자 원본 타임스탬프**를 그대로 반환함. 데이터 일관성을 위해 시스템은 다음과 같은 정규화된 필드를 함께 제공함:

* `timestampMs`: UTC 기준 Epoch Milliseconds.
* `timestampUtc`: ISO 8601 UTC 문자열.

원본 필드는 정보 유실 방지를 위해 그대로 유지됨.

## 시스템 프롬프트용 사용자 시간대 설정

`agents.defaults.userTimezone` 설정을 통해 에이전트에게 사용자의 현재 로컬 시간대를 알려줄 수 있음. 설정되지 않은 경우 OpenClaw는 실행 시점의 **호스트 시간대**를 자동으로 해석함.

```json5
{
  agents: { defaults: { userTimezone: "Asia/Seoul" } },
}
```

시스템 프롬프트 주입 항목:

* **`Current Date & Time`** 섹션: 사용자의 현재 날짜, 시각 및 시간대 정보.
* **`Time format`**: `12-hour` 또는 `24-hour` 표기 방식 정보.

프롬프트 내 시간 표기 방식은 `agents.defaults.timeFormat` (`auto` | `12` | `24`) 설정을 통해 제어 가능함.

상세 동작 원리 및 추가 예시는 [날짜 및 시간 가이드](/date-time) 참조.
