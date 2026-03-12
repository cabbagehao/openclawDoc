---
summary: "各チャネルで共通して使われるリアクションの意味"
read_when:
  - いずれかのチャネルでリアクション機能を扱っている
title: "Reactions"
x-i18n:
  source_hash: "db7aae38b5f7a53cd1ef58545c5fd66238f89240f09e6acc775bac24dbcbbca1"
---

# リアクションツール

チャネルをまたいで共通するリアクションの意味は次のとおりです。

- リアクションを追加する場合、`emoji` は必須です
- `emoji=""` は、サポートされている場合に bot のリアクションを削除します
- `remove: true` は、サポートされている場合に指定した絵文字のリアクションを削除します（この場合も `emoji` は必要）

チャネル別の補足:

- **Discord/Slack**: 空の `emoji` は、そのメッセージに付いている bot のリアクションをすべて削除します。`remove: true` は指定した絵文字だけを削除します
- **Google Chat**: 空の `emoji` は、そのメッセージに付いた app のリアクションを削除します。`remove: true` は指定した絵文字だけを削除します
- **Telegram**: 空の `emoji` は bot のリアクションを削除します。`remove: true` でも削除できますが、tool validation 上は空でない `emoji` が必要です
- **WhatsApp**: 空の `emoji` は bot のリアクションを削除します。`remove: true` は内部的に空の emoji と同じ扱いになります（それでも `emoji` は必要）
- **Zalo Personal (`zalouser`)**: 空でない `emoji` が必須で、`remove: true` はその特定の絵文字リアクションを削除します
- **Signal**: `channels.signal.reactionNotifications` が有効な場合、受信したリアクション通知は system event として発行されます
