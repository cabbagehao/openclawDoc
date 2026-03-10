---
summary: "「openclaw ステータス」の CLI リファレンス (診断、プローブ、使用状況スナップショット)"
read_when:
  - チャネルの健全性と最近のセッション受信者を簡単に診断したい
  - デバッグ用に貼り付け可能な「すべて」ステータスが必要な場合
title: "状態"
x-i18n:
  source_hash: "7c0050b01ed5c9027e4eb274048ca6e40ae042805896585edc48ca5edfbce2f0"
---

# `openclaw status`

チャネル + セッションの診断。

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

注:

- `--deep` はライブ プローブ (WhatsApp Web + Telegram + Discord + Google Chat + Slack + Signal) を実行します。
- 複数のエージェントが構成されている場合、出力にはエージェントごとのセッション ストアが含まれます。
- 概要には、ゲートウェイ + ノード ホスト サービスのインストール/実行時のステータスが含まれます (利用可能な場合)。
- 概要には、アップデート チャネル + git SHA (ソース チェックアウト用) が含まれます。
- 概要の情報画面を更新します。更新が利用可能な場合、ステータスは `openclaw update` を実行するためのヒントを出力します ([更新](/install/updating) を参照)。
- 読み取り専用ステータス サーフェス (`status`、`status --json`、`status --all`) は、可能な場合、ターゲット設定パスに対してサポートされている SecretRef を解決します。
- サポートされているチャネル SecretRef が構成されているが、現在のコマンド パスで使用できない場合、ステータスは読み取り専用のままになり、クラッシュするのではなく、出力の低下が報告されます。人間の出力には「このコマンド パスでは構成されたトークンが利用できません」などの警告が表示され、JSON 出力には `secretDiagnostics` が含まれます。
