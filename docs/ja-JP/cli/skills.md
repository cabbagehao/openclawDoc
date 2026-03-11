---
summary: "`openclaw skills` の CLI リファレンス (一覧表示、詳細情報、実行可否のチェック)"
read_when:
  - どのスキルが利用可能で、実行準備が整っているかを確認したい場合
  - スキルに必要なバイナリ、環境変数、構成設定の不足をデバッグしたい場合
title: "skills"
x-i18n:
  source_hash: "7878442c88a27ec8033f3125c319e9a6a85a1c497a404a06112ad45185c261b0"
---

# `openclaw skills`

スキル（同梱スキル、ワークスペース内スキル、マネージドオーバーライド）を検査し、実行条件を満たしているか、あるいは何が不足しているかを確認します。

関連ドキュメント:
- スキルシステム: [スキル](/tools/skills)
- スキル構成: [スキル構成](/tools/skills-config)
- ClawHub によるインストール: [ClawHub](/tools/clawhub)

## コマンド一覧

```bash
openclaw skills list
openclaw skills list --eligible
openclaw skills info <name>
openclaw skills check
```
