---
summary: "「openclaw アンインストール」の CLI リファレンス (ゲートウェイ サービス + ローカル データの削除)"
read_when:
  - ゲートウェイ サービスやローカル状態を削除したい
  - 最初に予行演習が必要です
title: "アンインストールする"
x-i18n:
  source_hash: "5a82cdcb2a7254f87edd3c6678e4c35f00c805971c705610149cbb2ff48b29a4"
---

# `openclaw uninstall`

ゲートウェイ サービスとローカル データをアンインストールします (CLI は残ります)。

```bash
openclaw backup create
openclaw uninstall
openclaw uninstall --all --yes
openclaw uninstall --dry-run
```

状態またはワークスペースを削除する前に復元可能なスナップショットが必要な場合は、最初に `openclaw backup create` を実行します。
