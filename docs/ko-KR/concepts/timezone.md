---
summary: "Timezone handling for agents, envelopes, and prompts"
description: "OpenClaw가 message envelope, tool payload, system prompt에서 timezone을 어떻게 표준화하는지 설명합니다."
read_when:
  - 타임스탬프가 모델에 전달될 때 어떻게 정규화되는지 이해해야 할 때
  - system prompt용 user timezone을 설정해야 할 때
title: "Timezones"
x-i18n:
  source_path: "concepts/timezone.md"
---

# Timezones

OpenClaw는 모델이 **하나의 기준 시간**을 보도록 timestamp를 표준화합니다.

## Message envelopes (local by default)

inbound message는 다음과 같은 envelope로 감싸집니다.

```text
[Provider ... 2026-01-05 16:26 PST] message text
```

envelope의 timestamp는 기본적으로 **host local time**이며, 분 단위 정밀도를 가집니다.

다음 설정으로 override할 수 있습니다.

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

- `envelopeTimezone: "utc"`는 UTC를 사용합니다
- `envelopeTimezone: "user"`는 `agents.defaults.userTimezone`을 사용하며,
  없으면 host timezone으로 fallback합니다
- `"Europe/Vienna"` 같은 명시적 IANA timezone을 쓰면 고정 timezone을 사용할 수
  있습니다
- `envelopeTimestamp: "off"`는 envelope header에서 absolute timestamp를 제거합니다
- `envelopeElapsed: "off"`는 `+2m` 같은 elapsed suffix를 제거합니다

### Examples

**Local (default):**

```text
[Signal Alice +1555 2026-01-18 00:19 PST] hello
```

**Fixed timezone:**

```text
[Signal Alice +1555 2026-01-18 06:19 GMT+1] hello
```

**Elapsed time:**

```text
[Signal Alice +1555 +2m 2026-01-18T05:19Z] follow-up
```

## Tool payloads (raw provider data + normalized fields)

tool call
(`channels.discord.readMessages`, `channels.slack.readMessages` 등)은 **raw provider
timestamp**를 반환합니다. 동시에 일관성을 위해 아래 normalized field도 함께 붙습니다.

- `timestampMs`
  (UTC epoch milliseconds)
- `timestampUtc`
  (ISO 8601 UTC string)

raw provider field는 그대로 보존됩니다.

## User timezone for the system prompt

`agents.defaults.userTimezone`을 설정하면 모델에 user의 local timezone을 알려줄 수
있습니다. 설정하지 않으면 OpenClaw는 runtime에 **host timezone**을 해석해 사용합니다.
(config file을 직접 쓰지는 않음)

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

system prompt에는 다음이 포함됩니다.

- local time과 timezone을 담은 `Current Date & Time` section
- `Time format: 12-hour` 또는 `24-hour`

prompt format은 `agents.defaults.timeFormat`
(`auto` | `12` | `24`)으로 제어할 수 있습니다.

전체 동작과 예시는 [Date & Time](/date-time) 문서를 참고하세요.
