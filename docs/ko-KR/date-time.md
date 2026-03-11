---
summary: "envelope, 프롬프트, 도구, 커넥터 전반의 날짜 및 시간 처리"
read_when:
  - 모델이나 사용자에게 타임스탬프를 어떻게 보여줄지 변경할 때
  - 메시지나 시스템 프롬프트 출력의 시간 포맷 문제를 디버깅할 때
title: "날짜 및 시간"
x-i18n:
  source_path: "date-time.md"
---

# 날짜 및 시간

OpenClaw는 기본적으로 **전송 타임스탬프에는 호스트 로컬 시간**을, **시스템 프롬프트에는 사용자 시간대만** 사용합니다.
제공업체 타임스탬프는 그대로 보존되므로 도구는 원래 의미 체계를 유지합니다(현재 시간은 `session_status`를 통해 확인할 수 있습니다).

## 메시지 envelope(기본값: 로컬)

수신 메시지는 분 단위 정밀도의 타임스탬프와 함께 감싸집니다.

```
[Provider ... 2026-01-05 16:26 PST] message text
```

이 envelope 타임스탬프는 제공업체 시간대와 무관하게 기본적으로 **호스트 로컬 시간**을 사용합니다.

이 동작은 다음과 같이 재정의할 수 있습니다.

```json5
{
  agents: {
    defaults: {
      envelopeTimezone: "local", // "utc" | "local" | "user" | IANA timezone
      envelopeTimestamp: "on", // "on" | "off"
      envelopeElapsed: "on", // "on" | "off"
    },
  },
}
```

- `envelopeTimezone: "utc"`는 UTC를 사용합니다.
- `envelopeTimezone: "local"`은 호스트 시간대를 사용합니다.
- `envelopeTimezone: "user"`는 `agents.defaults.userTimezone`을 사용합니다(없으면 호스트 시간대로 대체).
- 고정 시간대를 쓰려면 명시적인 IANA 시간대(예: `"America/Chicago"`)를 사용합니다.
- `envelopeTimestamp: "off"`는 envelope 헤더의 절대 타임스탬프를 제거합니다.
- `envelopeElapsed: "off"`는 경과 시간 접미사(`+2m` 형식)를 제거합니다.

### 예시

**로컬(기본값):**

```
[WhatsApp +1555 2026-01-18 00:19 PST] hello
```

**사용자 시간대:**

```
[WhatsApp +1555 2026-01-18 00:19 CST] hello
```

**경과 시간 활성화:**

```
[WhatsApp +1555 +30s 2026-01-18T05:19Z] follow-up
```

## 시스템 프롬프트: 현재 날짜 및 시간

사용자 시간대를 알고 있다면, 시스템 프롬프트에는 프롬프트 캐시 안정성을 위해
**시간대만** 포함하는 전용 **현재 날짜 및 시간** 섹션이 추가됩니다(시계 표시나 시간 형식은 포함되지 않음).

```
Time zone: America/Chicago
```

에이전트가 현재 시간이 필요하면 `session_status` 도구를 사용하세요. 상태 카드에는 타임스탬프 줄이 포함됩니다.

## 시스템 이벤트 줄(기본값: 로컬)

에이전트 컨텍스트에 삽입되는 대기 중 시스템 이벤트에는 메시지 envelope과 동일한 시간대 선택(기본값: 호스트 로컬)을 사용한 타임스탬프 접두사가 붙습니다.

```
System: [2026-01-12 12:19:17 PST] Model switched.
```

### 사용자 시간대와 형식 설정

```json5
{
  agents: {
    defaults: {
      userTimezone: "America/Chicago",
      timeFormat: "auto", // auto | 12 | 24
    },
  },
}
```

- `userTimezone`은 프롬프트 컨텍스트에서 사용할 **사용자 로컬 시간대**를 설정합니다.
- `timeFormat`은 프롬프트에서 **12시간/24시간 표기**를 제어합니다. `auto`는 OS 기본 설정을 따릅니다.

## 시간 형식 감지(auto)

`timeFormat: "auto"`일 때 OpenClaw는 OS 기본 설정(macOS/Windows)을 확인하고, 그 외에는 로케일 포맷으로 대체합니다. 감지된 값은 반복적인 시스템 호출을 피하기 위해 **프로세스 단위로 캐시**됩니다.

## 도구 payload와 커넥터(원본 제공업체 시간 + 정규화 필드)

채널 도구는 **제공업체 고유 타임스탬프**를 반환하면서 일관성을 위한 정규화 필드를 함께 추가합니다.

- `timestampMs`: epoch milliseconds (UTC)
- `timestampUtc`: ISO 8601 UTC 문자열

원본 제공업체 필드는 정보 손실이 없도록 그대로 보존됩니다.

- Slack: API의 epoch 유사 문자열
- Discord: UTC ISO 타임스탬프
- Telegram/WhatsApp: 제공업체별 숫자형/ISO 타임스탬프

로컬 시간이 필요하다면, 알려진 시간대를 사용해 다운스트림에서 변환하세요.

## 관련 문서

- [System Prompt](/concepts/system-prompt)
- [Timezones](/concepts/timezone)
- [Messages](/concepts/messages)
