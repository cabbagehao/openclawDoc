---
summary: "チャネル間で共有される反応セマンティクス"
read_when:
  - あらゆるチャネルでの反応に取り組む
title: "反応"
x-i18n:
  source_hash: "db7aae38b5f7a53cd1ef58545c5fd66238f89240f09e6acc775bac24dbcbbca1"
---

# リアクションツール

チャネル間で共有される反応セマンティクス:

- 反応を追加する場合は、`emoji` が必要です。
- `emoji=""` は、サポートされている場合にボットの反応を削除します。
- `remove: true` は、サポートされている場合、指定された絵文字を削除します (`emoji` が必要)。

チャンネルメモ:

- **Discord/Slack**: 空の `emoji` は、メッセージに対するボットの反応をすべて削除します。 `remove: true` はその絵文字だけを削除します。
- **Google Chat**: 空の `emoji` は、メッセージに対するアプリの反応を削除します。 `remove: true` はその絵文字だけを削除します。
- **テレグラム**: 空の `emoji` はボットの反応を削除します。 `remove: true` も反応を削除しますが、ツールの検証には空ではない `emoji` が必要です。
- **WhatsApp**: 空の `emoji` はボットの反応を削除します。 `remove: true` は空の絵文字にマップされます (それでも `emoji` が必要です)。
- **Zalo Personal (`zalouser`)**: 空でない `emoji` が必要です。 `remove: true` は、その特定の絵文字反応を削除します。
- **シグナル**: `channels.signal.reactionNotifications` が有効な場合、受信反応通知はシステム イベントを発行します。
