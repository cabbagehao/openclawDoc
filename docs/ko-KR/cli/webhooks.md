---
summary: "CLI reference for `openclaw webhooks` (webhook helpers + Gmail Pub/Sub)"
description: "Gmail Pub/Sub 이벤트를 OpenClaw로 연결하고 webhook helper를 실행하는 `openclaw webhooks` CLI 사용법을 설명합니다."
read_when:
  - Gmail Pub/Sub 이벤트를 OpenClaw에 연결하고 싶을 때
  - webhook helper 명령이 필요할 때
title: "webhooks"
x-i18n:
  source_path: "cli/webhooks.md"
---

# `openclaw webhooks`

webhook helper와 integration 명령입니다. (Gmail Pub/Sub, webhook helper)

Related:

- Webhooks: [Webhook](/automation/webhook)
- Gmail Pub/Sub: [Gmail Pub/Sub](/automation/gmail-pubsub)

## Gmail

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail run
```

자세한 내용은 [Gmail Pub/Sub documentation](/automation/gmail-pubsub)를 참고하세요.
