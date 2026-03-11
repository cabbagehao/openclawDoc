---
summary: "Gmail Pub/Sub 연동 및 웹훅 처리를 지원하는 `openclaw webhooks` 명령어 레퍼런스"
read_when:
  - Gmail Pub/Sub 이벤트를 OpenClaw로 전달하고자 할 때
  - 웹훅 관련 헬퍼 명령어가 필요할 때
title: "webhooks"
x-i18n:
  source_path: "cli/webhooks.md"
---

# `openclaw webhooks`

웹훅(Webhook) 관련 헬퍼 도구 및 Gmail Pub/Sub 통합 기능을 제공함.

**관련 문서:**

* 웹훅 개요: [Webhook](/automation/webhook)
* Gmail Pub/Sub 연동 가이드: [Gmail Pub/Sub](/automation/gmail-pubsub)

## Gmail 통합

```bash
# 특정 계정에 대해 Gmail Pub/Sub 설정 시작
openclaw webhooks gmail setup --account you@example.com

# Gmail 웹훅 리스너 실행
openclaw webhooks gmail run
```

상세한 설정 및 운영 방법은 [Gmail Pub/Sub 상세 가이드](/automation/gmail-pubsub)를 참조함.
