---
summary: "envelope, prompt, tools, connectors 전반의 날짜 및 시간 처리"
read_when:
  - 타임스탬프가 모델이나 사용자에게 어떻게 표시되는지 변경할 때
  - 메시지나 system prompt 출력의 시간 포맷 문제를 디버깅할 때
title: "날짜 및 시간"
description: "OpenClaw가 transport 타임스탬프, system prompt 시간대, tool payload의 시간을 어떻게 처리하고 유지하는지 설명합니다."
x-i18n:
  source_path: "date-time.md"
---

# 날짜 및 시간

OpenClaw는 기본적으로 **transport timestamp에는 host-local time**을 사용하고,
**system prompt에는 user timezone만** 사용합니다. Provider timestamp는 그대로
보존되므로 tool은 native semantics를 유지합니다(현재 시간은 `session_status`로
확인할 수 있습니다).

## 메시지 envelope(기본값: local)

들어오는 메시지는 분 단위 정밀도의 timestamp와 함께 감싸집니다.

```
[Provider ... 2026-01-05 16:26 PST] message text
```

이 envelope timestamp는 provider timezone과 무관하게 기본적으로
**host-local**입니다.

이 동작은 재정의할 수 있습니다.

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
- `envelopeTimezone: "local"`은 host timezone을 사용합니다.
- `envelopeTimezone: "user"`는 `agents.defaults.userTimezone`을 사용합니다
  (없으면 host timezone으로 fallback).
- 고정된 zone이 필요하면 명시적인 IANA timezone(예: `"America/Chicago"`)을
  사용합니다.
- `envelopeTimestamp: "off"`는 envelope header에서 absolute timestamp를
  제거합니다.
- `envelopeElapsed: "off"`는 elapsed time suffix(`+2m` 형식)를 제거합니다.

### 예시

**Local (default):**

```
[WhatsApp +1555 2026-01-18 00:19 PST] hello
```

**User timezone:**

```
[WhatsApp +1555 2026-01-18 00:19 CST] hello
```

**Elapsed time enabled:**

```
[WhatsApp +1555 +30s 2026-01-18T05:19Z] follow-up
```

## System prompt: Current Date & Time

사용자 timezone을 알고 있으면, system prompt에는 prompt caching을 안정적으로
유지하기 위해 dedicated **Current Date & Time** 섹션이 들어가며, 여기에는
**time zone만** 포함됩니다(시계 시각이나 시간 형식은 포함되지 않음).

```
Time zone: America/Chicago
```

에이전트가 현재 시간이 필요하면 `session_status` tool을 사용하세요. status
card에는 timestamp line이 포함됩니다.

## System event lines(기본값: local)

에이전트 컨텍스트에 삽입되는 queued system event는 message envelope와 같은
timezone 선택을 사용해 timestamp prefix를 붙입니다(기본값: host-local).

```
System: [2026-01-12 12:19:17 PST] Model switched.
```

### User timezone + format 설정

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

- `userTimezone`은 prompt context에서 사용할 **user-local timezone**을
  설정합니다.
- `timeFormat`은 prompt에서 **12h/24h 표시**를 제어합니다. `auto`는 OS 설정을
  따릅니다.

## 시간 형식 감지(auto)

`timeFormat: "auto"`일 때 OpenClaw는 OS preference(macOS/Windows)를 확인하고,
이후 locale formatting으로 fallback합니다. 감지된 값은 반복적인 system call을
피하기 위해 **process 단위로 캐시**됩니다.

## Tool payloads + connectors(raw provider time + normalized fields)

채널 tool은 **provider-native timestamp**를 반환하고, 일관성을 위해 정규화된
필드를 추가합니다.

- `timestampMs`: epoch milliseconds (UTC)
- `timestampUtc`: ISO 8601 UTC string

원본 provider field도 보존되므로 정보가 손실되지 않습니다.

- Slack: API의 epoch-like strings
- Discord: UTC ISO timestamps
- Telegram/WhatsApp: provider-specific numeric/ISO timestamps

local time이 필요하면 알려진 timezone을 사용해 downstream에서 변환하세요.

## 관련 문서

- [System Prompt](/concepts/system-prompt)
- [Timezones](/concepts/timezone)
- [Messages](/concepts/messages)
