---
summary: "CLI reference for `openclaw webhooks` (webhook 헬퍼 + Gmail Pub/Sub)"
read_when:
  - Gmail Pub/Sub 이벤트를 OpenClaw 에 연결하고 싶을 때
  - webhook 헬퍼 명령이 필요할 때
title: "webhooks"
---

# `openclaw webhooks`

Webhook 헬퍼와 통합(Gmail Pub/Sub, webhook helpers)입니다.

관련 문서:

- Webhooks: [Webhook](/automation/webhook)
- Gmail Pub/Sub: [Gmail Pub/Sub](/automation/gmail-pubsub)

## Gmail

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail run
```

자세한 내용은 [Gmail Pub/Sub documentation](/automation/gmail-pubsub) 를 참고하세요.
