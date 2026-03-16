---
summary: "Retry policy for outbound provider calls"
description: "Telegram과 Discord를 포함한 outbound provider call의 retry 기준, 기본값, 설정 방법을 설명합니다."
read_when:
  - provider retry behavior나 기본값을 수정할 때
  - provider send error나 rate limit 문제를 디버깅할 때
title: "Retry Policy"
x-i18n:
  source_path: "concepts/retry.md"
---

# Retry policy

## Goals

- multi-step flow 전체가 아니라 **HTTP request 단위**로 retry
- 현재 step만 retry해서 ordering 보존
- non-idempotent operation 중복 실행 방지

## Defaults

- Attempts: 3
- Max delay cap: 30000 ms
- Jitter: 0.1
  (10 percent)
- Provider defaults:
  - Telegram min delay: 400 ms
  - Discord min delay: 500 ms

## Behavior

### Discord

- rate-limit error
  (`HTTP 429`)에서만 retry
- 가능하면 Discord의 `retry_after`를 사용하고, 없으면 exponential backoff 사용

### Telegram

- transient error
  (`429`, timeout, connect/reset/closed, temporarily unavailable)에서 retry
- 가능하면 `retry_after`를 사용하고, 없으면 exponential backoff 사용
- Markdown parse error는 retry하지 않고 plain text로 fallback

## Configuration

provider별 retry policy는 `~/.openclaw/openclaw.json`에서 설정합니다.

```json5
{
  channels: {
    telegram: {
      retry: {
        attempts: 3,
        minDelayMs: 400,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
    discord: {
      retry: {
        attempts: 3,
        minDelayMs: 500,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
  },
}
```

## Notes

- retry는 request별로 적용됩니다
  (message send, media upload, reaction, poll, sticker)
- composite flow에서는 이미 완료된 step을 다시 retry하지 않습니다
