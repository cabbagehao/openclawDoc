---
summary: "「openclaw リセット」の CLI リファレンス (ローカル状態/設定をリセット)"
read_when:
  - CLI をインストールしたままローカル状態を消去したい
  - 削除される内容の予行演習が必要な場合
title: "OpenClaw CLI: openclaw reset コマンドの使い方と主要オプション・実行例"
description: "ローカルの設定/状態をリセットします (CLI のインストールを維持します)。ローカル状態を削除する前に復元可能なスナップショットが必要な場合は、最初に openclaw backup create を実行します。"
x-i18n:
  source_hash: "76e808ce44da49603504aacf92e67ea4af427f0ed9081684b24fb7d3f3922cd5"
---
ローカルの設定/状態をリセットします (CLI のインストールを維持します)。

```bash
openclaw backup create
openclaw reset
openclaw reset --dry-run
openclaw reset --scope config+creds+sessions --yes --non-interactive
```

ローカル状態を削除する前に復元可能なスナップショットが必要な場合は、最初に `openclaw backup create` を実行します。
