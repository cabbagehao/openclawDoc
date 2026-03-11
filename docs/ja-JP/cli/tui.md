---
summary: "`openclaw tui` の CLI リファレンス (ゲートウェイに接続するターミナル UI)"
read_when:
  - ゲートウェイ用のターミナル UI（リモート環境にも対応）を使用したい場合
  - スクリプトから URL、トークン、セッション情報を渡したい場合
title: "tui"
x-i18n:
  source_hash: "60e35062c0551f85ce0da604a915b3e1ca2514d00d840afe3b94c529304c2c1a"
---

# `openclaw tui`

ゲートウェイに接続して対話を行うターミナル UI（TUI）を開きます。

関連ドキュメント:
- TUI ガイド: [TUI](/web/tui)

## 補足事項

- `tui` は、可能であれば構成されたゲートウェイ認証用の SecretRef を解決し、トークンやパスワード認証に使用します（`env`, `file`, `exec` プロバイダーに対応）。
- 構成済みのエージェントワークスペースディレクトリ内から起動された場合、TUI はそのエージェントをセッションキーのデフォルトとして自動的に選択します（`--session` で明示的に `agent:<id>:...` が指定されている場合を除きます）。

## 実行例

```bash
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
# エージェントワークスペース内で実行した場合、そのエージェントが自動的に推論されます
openclaw tui --session bugfix
```
