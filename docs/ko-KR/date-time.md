---
summary: "OpenClaw 전반의 날짜 및 시간 처리 방식 (봉투(Envelope), 프롬프트, 도구, 커넥터)"
read_when:
  - 타임스탬프 표시 형식을 변경하고자 할 때
  - 메시지 또는 시스템 프롬프트의 시간 포맷 관련 문제를 디버깅할 때
title: "날짜 및 시간 처리"
x-i18n:
  source_path: "date-time.md"
---

# 날짜 및 시간 처리

OpenClaw는 기본적으로 **전송 타임스탬프에는 호스트 로컬 시간**을 사용하고, **시스템 프롬프트에는 사용자의 시간대 정보**만을 포함함.
공급자(Provider)로부터 수신된 타임스탬프는 원본 그대로 보존됨. (현재 시간 정보는 `session_status` 도구를 통해 확인 가능함)

## 메시지 봉투(Envelope) (기본값: 로컬)

수신된 메시지는 분 단위 정밀도의 타임스탬프 헤더로 감싸짐.

```
[Provider ... 2026-01-05 16:26 PST] message text
```

이 봉투 타임스탬프는 공급자의 시간대와 관계없이 기본적으로 **호스트 로컬 시간**을 사용함.

이 동작은 다음과 같이 설정을 통해 변경할 수 있음.

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

- `envelopeTimezone: "utc"`: UTC 시간 사용.
- `envelopeTimezone: "local"`: 호스트 장치의 시간대 사용.
- `envelopeTimezone: "user"`: `agents.defaults.userTimezone` 설정값 사용 (설정되지 않은 경우 호스트 시간대로 대체됨).
- 고정 시간대: IANA 시간대 이름(예: `"Asia/Seoul"`)을 직접 지정 가능함.
- `envelopeTimestamp: "off"`: 헤더에서 절대 타임스탬프를 제거함.
- `envelopeElapsed: "off"`: 경과 시간 접미사(`+2m` 형식)를 제거함.

### 예시

**로컬 시간 (기본값):**

```
[WhatsApp +1555 2026-01-18 00:19 PST] hello
```

**사용자 지정 시간대:**

```
[WhatsApp +1555 2026-01-18 00:19 KST] hello
```

**경과 시간 활성화:**

```
[WhatsApp +1555 +30s 2026-01-18T05:19Z] follow-up
```

## 시스템 프롬프트: 현재 날짜 및 시간

사용자 시간대 정보가 있는 경우, 프롬프트 캐시의 안정성을 위해 시스템 프롬프트에 **시간대 정보만** 추가됨. (특정 시각이나 시간 형식은 포함되지 않음)

```
Time zone: Asia/Seoul
```

에이전트가 현재 시각을 알아야 하는 경우 `session_status` 도구를 사용해야 함. 상태 카드에는 상세 타임스탬프가 포함되어 제공됨.

## 시스템 이벤트 (기본값: 로컬)

에이전트 컨텍스트에 삽입되는 시스템 이벤트는 메시지 봉투와 동일한 시간대 설정을 따르며 타임스탬프 접두사가 붙음.

```
System: [2026-01-12 12:19:17 KST] Model switched.
```

### 사용자 시간대 및 형식 설정

```json5
{
  agents: {
    defaults: {
      userTimezone: "Asia/Seoul",
      timeFormat: "auto", // auto | 12 | 24
    },
  },
}
```

- `userTimezone`: 프롬프트 컨텍스트에서 사용할 사용자의 로컬 시간대를 지정함.
- `timeFormat`: 프롬프트의 12시간/24시간 표기 방식을 제어함. `auto`는 운영체제(OS) 설정을 따름.

## 시간 형식 자동 감지 (auto)

`timeFormat: "auto"`인 경우, OpenClaw는 OS 기본 설정(macOS/Windows)을 우선 확인하며, 그 외 환경에서는 로케일(Locale) 형식을 따름. 감지된 값은 시스템 호출 부하를 줄이기 위해 **프로세스 단위로 캐싱**됨.

## 도구 페이로드 및 커넥터 (원본 시간 + 정규화 필드)

채널 도구는 **공급자 고유의 타임스탬프**를 반환하며, 데이터 일관성을 위해 다음과 같은 정규화 필드를 추가로 제공함.

- `timestampMs`: Epoch Milliseconds (UTC 기준)
- `timestampUtc`: ISO 8601 UTC 문자열

정보 손실 방지를 위해 공급자별 원본 필드도 보존됨.

- Slack: API에서 제공하는 Epoch 형식 문자열
- Discord: UTC ISO 타임스탬프
- Telegram/WhatsApp: 공급자별 숫자형 또는 ISO 타임스탬프

현지 시각이 필요한 경우, 애플리케이션 하단부에서 해당 시간대 정보를 기반으로 변환하여 사용해야 함.

## 관련 문서

- [시스템 프롬프트](/concepts/system-prompt)
- [시간대(Timezones)](/concepts/timezone)
- [메시지 구조](/concepts/messages)
