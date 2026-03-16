---
summary: "Command queue design that serializes inbound auto-reply runs"
description: "자동 응답 run을 session별로 직렬화하고 lane별 동시성을 제어하는 OpenClaw command queue 설계를 설명합니다."
read_when:
  - auto-reply execution이나 concurrency 동작을 바꿔야 할 때
title: "Command Queue"
x-i18n:
  source_path: "concepts/queue.md"
---

# Command Queue (2026-01-16)

OpenClaw는 inbound auto-reply run
(모든 channel)을 작은 in-process queue로 직렬화합니다. 목적은 여러 agent run이 서로
충돌하는 것을 막으면서도, 서로 다른 session 간에는 안전한 병렬성을 유지하는 것입니다.

## Why

- auto-reply run은 LLM call 때문에 비용이 크고, 여러 inbound message가 가까운 시점에
  들어오면 서로 충돌할 수 있습니다
- 직렬화하면 shared resource
  (session file, log, CLI stdin) 경쟁을 줄이고 upstream rate limit 가능성도 낮출 수
  있습니다

## How it works

- lane-aware FIFO queue가 각 lane을 drain하며, configurable concurrency cap을
  적용합니다
  (설정 없는 lane 기본 1, `main` 기본 4, `subagent` 기본 8)
- `runEmbeddedPiAgent`는 **session key** 기준으로 enqueue합니다
  (lane `session:<key>`)
  따라서 하나의 session에서는 동시에 하나의 active run만 허용됩니다
- 각 session run은 다시 **global lane**
  (기본은 `main`)에 queue되어 전체 병렬성이
  `agents.defaults.maxConcurrent`로 제한됩니다
- verbose logging이 켜져 있으면, 시작 전 약 2초 이상 기다린 run은 짧은 notice를
  남깁니다
- typing indicator는 enqueue 직후 즉시 켜집니다
  (channel이 지원하는 경우)
  따라서 순서를 기다리는 동안에도 user experience는 유지됩니다

## Queue modes (per channel)

inbound message는 현재 run을 조정하거나, followup turn을 기다리게 하거나,
둘 다 할 수 있습니다.

- `steer`: 현재 run에 즉시 inject
  (다음 tool boundary 이후 pending tool call 취소)
  streaming이 아니면 `followup`으로 fallback
- `followup`: 현재 run이 끝난 뒤 다음 agent turn으로 enqueue
- `collect`: queued message를 **하나의** followup turn으로 coalesce
  (기본값). 다만 서로 다른 channel/thread를 향한 message는 routing 보존을 위해
  개별 drain
- `steer-backlog`
  (alias `steer+backlog`): 지금 steer하고, message도 followup용으로 보존
- `interrupt` (legacy): 해당 session의 active run을 abort한 뒤 최신 message 실행
- `queue` (legacy alias): `steer`와 동일

steer-backlog를 쓰면 steered run 뒤에 followup response가 추가로 생길 수 있어,
streaming surface에서는 duplicate처럼 보일 수 있습니다. inbound message당 응답 하나를
원하면 `collect` 또는 `steer`를 우선 고려하세요.
세션 단위 standalone command로 `/queue collect`를 보내거나,
`messages.queue.byChannel.discord: "collect"`처럼 설정할 수 있습니다.

기본값
(config에서 unset일 때):

- 모든 surface → `collect`

global 또는 channel별로 `messages.queue`에서 설정합니다.

```json5
{
  messages: {
    queue: {
      mode: "collect",
      debounceMs: 1000,
      cap: 20,
      drop: "summarize",
      byChannel: { discord: "collect" },
    },
  },
}
```

## Queue options

이 옵션은 `followup`, `collect`, `steer-backlog`에 적용되며,
`steer`가 followup으로 fallback될 때도 적용됩니다.

- `debounceMs`: followup turn을 시작하기 전 quiet period를 기다림
  ("continue, continue" 같은 연속 입력을 흡수)
- `cap`: session당 최대 queued message 수
- `drop`: overflow policy
  (`old`, `new`, `summarize`)

`summarize`는 drop된 message를 짧은 bullet list로 보존해 synthetic followup prompt로
inject합니다.
기본값은 `debounceMs: 1000`, `cap: 20`, `drop: summarize`입니다.

## Per-session overrides

- standalone command `/queue <mode>`를 보내면 현재 session의 mode가 저장됩니다
- option을 조합할 수 있습니다:
  `/queue collect debounce:2s cap:25 drop:summarize`
- `/queue default` 또는 `/queue reset`은 session override를 지웁니다

## Scope and guarantees

- Gateway reply pipeline을 사용하는 모든 inbound channel의 auto-reply agent run에
  적용됩니다
  (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat 등)
- default lane인 `main`은 inbound와 main heartbeat에 대해 process-wide입니다.
  여러 session을 병렬로 처리하려면 `agents.defaults.maxConcurrent`를 조정하세요
- `cron`, `subagent` 같은 additional lane이 있을 수 있어 background job은 inbound
  reply를 막지 않고 병렬로 돌 수 있습니다
- per-session lane은 같은 session에 동시에 하나의 agent run만 접근하도록 보장합니다
- external dependency나 background worker thread 없이, 순수 TypeScript + promise로
  구현됩니다

## Troubleshooting

- command가 멈춘 것처럼 보이면 verbose log를 켜고
  `"queued for …ms"` line이 보이는지 확인하세요.
  queue가 실제로 drain 중인지 판단할 수 있습니다
- queue depth가 필요하면 verbose log를 켜고 queue timing line을 확인하세요
