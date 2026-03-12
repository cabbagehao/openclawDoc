---
summary: "「openclaw セットアップ」の CLI リファレンス (設定 + ワークスペースの初期化)"
read_when:
  - 完全なオンボーディング ウィザードを使用せずに初回実行セットアップを実行している
  - デフォルトのワークスペースパスを設定したい
title: "OpenClaw CLI: openclaw setup コマンドの使い方と主要オプション・実行例"
description: "~/.openclaw/openclaw.json とエージェント ワークスペースを初期化します。例を確認できます。"
x-i18n:
  source_hash: "7f3fc8b246924edf48501785be2c0d356bd31bfbb133e75a139a5ee41dbf57f4"
---
`~/.openclaw/openclaw.json` とエージェント ワークスペースを初期化します。

関連:

- はじめに: [はじめに](/start/getting-started)
- ウィザード: [オンボーディング](/start/onboarding)

## 例

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
```

セットアップ経由でウィザードを実行するには:

```bash
openclaw setup --wizard
```
