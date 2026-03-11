---
summary: "agents, envelopes, prompts 의 timezone 처리"
read_when:
  - 모델에 보여지는 timestamp 가 어떻게 정규화되는지 이해해야 할 때
  - system prompt 의 사용자 timezone 을 설정할 때
title: "Timezones"
---

# Timezones

OpenClaw 는 모델이 **하나의 기준 시간** 을 보도록 timestamp 를 표준화합니다.

## 메시지 envelope (기본은 로컬 시간)

인바운드 메시지는 다음과 같은 envelope 로 감싸집니다:

```
[Provider ... 2026-01-05 16:26 PST] message text
```

envelope 의 timestamp 는 기본적으로 **host-local** 이며, 분 단위 정밀도를 가집니다.

다음 설정으로 재정의할 수 있습니다:

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

- `envelopeTimezone: "utc"` 는 UTC 를 사용합니다.
- `envelopeTimezone: "user"` 는 `agents.defaults.userTimezone` 를 사용합니다(host timezone 으로 폴백).
- 고정 offset 을 원하면 명시적 IANA timezone(예: `"Europe/Vienna"`)을 사용하세요.
- `envelopeTimestamp: "off"` 는 envelope header 의 절대 timestamp 를 제거합니다.
- `envelopeElapsed: "off"` 는 경과 시간 suffix(`+2m` 형식)를 제거합니다.

### 예시

**로컬(기본값):**

```
[Signal Alice +1555 2026-01-18 00:19 PST] hello
```

**고정 timezone:**

```
[Signal Alice +1555 2026-01-18 06:19 GMT+1] hello
```

**경과 시간:**

```
[Signal Alice +1555 +2m 2026-01-18T05:19Z] follow-up
```

## Tool payloads (raw provider data + normalized fields)

tool 호출(`channels.discord.readMessages`, `channels.slack.readMessages` 등)은 **raw provider timestamp** 를 반환합니다.
일관성을 위해 정규화된 필드도 함께 붙습니다:

- `timestampMs` (UTC epoch milliseconds)
- `timestampUtc` (ISO 8601 UTC string)

raw provider 필드는 그대로 보존됩니다.

## system prompt 의 사용자 timezone

모델에 사용자의 로컬 timezone 을 알려주려면 `agents.defaults.userTimezone` 을 설정하세요.
unset 이면 OpenClaw 는 **런타임에 host timezone 을 해석** 합니다(config write 없음).

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

system prompt 에는 다음이 포함됩니다:

- 로컬 시간과 timezone 이 담긴 `Current Date & Time` 섹션
- `Time format: 12-hour` 또는 `24-hour`

prompt 형식은 `agents.defaults.timeFormat` (`auto` | `12` | `24`)로 제어할 수 있습니다.

전체 동작과 예시는 [Date & Time](/date-time) 문서를 참고하세요.
