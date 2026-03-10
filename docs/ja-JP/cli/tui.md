---
summary: "「openclaw tui」の CLI リファレンス (ゲートウェイに接続されたターミナル UI)"
read_when:
  - ゲートウェイ用のターミナル UI (リモート対応) が必要な場合
  - スクリプトからURL/トークン/セッションを渡したい
title: "トゥイ"
x-i18n:
  source_hash: "60e35062c0551f85ce0da604a915b3e1ca2514d00d840afe3b94c529304c2c1a"
---

# `openclaw tui`

ゲートウェイに接続されているターミナル UI を開きます。

関連:

- TUI ガイド: [TUI](/web/tui)

注:

- `tui` は、可能な場合、トークン/パスワード認証用に構成されたゲートウェイ認証 SecretRef を解決します (`env`/`file`/`exec` プロバイダー)。
- 構成されたエージェント ワークスペース ディレクトリ内から起動されると、TUI はセッション キーのデフォルトとしてそのエージェントを自動的に選択します (`--session` が明示的に `agent:<id>:...` である場合を除く)。

## 例

```bash
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
# when run inside an agent workspace, infers that agent automatically
openclaw tui --session bugfix
```
