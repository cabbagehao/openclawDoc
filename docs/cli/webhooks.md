---
summary: "「openclaw Webhook」の CLI リファレンス (Webhook ヘルパー + Gmail Pub/Sub)"
read_when:
  - Gmail Pub/Sub イベントを OpenClaw に接続したい
  - Webhook ヘルパー コマンドが必要な場合
title: "Webhook"
seoTitle: "OpenClaw CLI: openclaw webhooks コマンドの使い方と主要オプション・実行例"
description: "Webhook ヘルパーと統合 (Gmail Pub/Sub、Webhook ヘルパー)。"
x-i18n:
  source_hash: "785ec62afe6631b340ce4a4541ceb34cd6b97704cf7a9889762cb4c1f29a5ca0"
---
Webhook ヘルパーと統合 (Gmail Pub/Sub、Webhook ヘルパー)。

関連:

- Webhook: [Webhook](/automation/webhook)
- Gmail Pub/Sub: [Gmail Pub/Sub](/automation/gmail-pubsub)

## Gmail

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail run
```

詳細については、[Gmail Pub/Sub ドキュメント](/automation/gmail-pubsub) を参照してください。
