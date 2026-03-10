---
summary: "「openclaw スキル」(リスト/情報/チェック) およびスキル資格に関する CLI リファレンス"
read_when:
  - どのスキルが利用可能ですぐに実行できるかを確認したい
  - スキルの不足しているバイナリ/env/config をデバッグしたい
title: "スキル"
x-i18n:
  source_hash: "7878442c88a27ec8033f3125c319e9a6a85a1c497a404a06112ad45185c261b0"
---

# `openclaw skills`

スキル (バンドル + ワークスペース + マネージド オーバーライド) を検査し、何が適格なのか、何が不足しているのかを確認します。

関連:

- スキルシステム: [スキル](/tools/skills)
- スキル構成: [スキル構成](/tools/skills-config)
- ClawHub のインストール: [ClawHub](/tools/clawhub)

## コマンド

```bash
openclaw skills list
openclaw skills list --eligible
openclaw skills info <name>
openclaw skills check
```
