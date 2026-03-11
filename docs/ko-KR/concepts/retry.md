---
summary: "아웃바운드 provider 호출용 재시도 정책"
read_when:
  - provider 재시도 동작이나 기본값을 업데이트할 때
  - provider 전송 오류나 rate limit 을 디버깅할 때
title: "Retry Policy"
---

# Retry policy

## 목표

- 여러 단계를 한 번에 재시도하지 않고 HTTP 요청 단위로 재시도
- 현재 단계만 재시도하여 순서를 보존
- 비멱등 작업이 중복되지 않도록 방지

## 기본값

- Attempts: 3
- Max delay cap: 30000 ms
- Jitter: 0.1 (10 percent)
- Provider 기본값:
  - Telegram min delay: 400 ms
  - Discord min delay: 500 ms

## 동작

### Discord

- rate-limit 오류(HTTP 429)에서만 재시도
- 가능하면 Discord `retry_after` 를 사용하고, 없으면 exponential backoff 사용

### Telegram

- 일시적 오류(429, timeout, connect/reset/closed, temporarily unavailable)에서 재시도
- 가능하면 `retry_after` 를 사용하고, 없으면 exponential backoff 사용
- Markdown parse 오류는 재시도하지 않고 plain text 로 폴백

## 설정

`~/.openclaw/openclaw.json` 에서 provider 별 retry policy 를 설정합니다:

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

## 메모

- 재시도는 요청별로 적용됩니다(메시지 전송, 미디어 업로드, 반응, poll, sticker).
- composite flow 는 이미 완료된 단계를 재시도하지 않습니다.
