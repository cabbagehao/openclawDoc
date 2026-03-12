---
summary: "ワークスペースとIDファイルを初期化するエージェントブートストラップ処理"
read_when:
  - エージェントの初回実行時に何が起こるかを理解する
  - ブートストラップファイルの保存場所を説明する
  - オンボーディングID設定のデバッグ
title: "エージェントブートストラップ"
sidebarTitle: "ブートストラップ"
x-i18n:
  source_path: "start/bootstrapping.md"
  source_hash: "4a08b5102f25c6c4bcdbbdd44384252a9e537b245a7b070c4961a72b4c6c6601"
  provider: "anthropic"
  model: "claude-opus-4-6"
  workflow: 1
  generated_at: "2026-03-10T05:49:19.769Z"
---
ブートストラップは、エージェントワークスペースを準備し、ID情報を収集する**初回実行**時の処理です。オンボーディング後、エージェントが初めて起動するときに実行されます。

## ブートストラップの動作

エージェントの初回実行時、OpenClawはワークスペース(デフォルトは`~/.openclaw/workspace`)をブートストラップします:

- `AGENTS.md`、`BOOTSTRAP.md`、`IDENTITY.md`、`USER.md`を生成します。
- 短いQ&A処理を実行します(一度に1つの質問)。
- IDと設定を`IDENTITY.md`、`USER.md`、`SOUL.md`に書き込みます。
- 完了後に`BOOTSTRAP.md`を削除し、一度だけ実行されるようにします。

## 実行場所

ブートストラップは常に**Gatewayホスト**上で実行されます。macOSアプリがリモートGatewayに接続している場合、ワークスペースとブートストラップファイルはそのリモートマシン上に存在します。

<Note>
Gatewayが別のマシン上で実行されている場合、Gatewayホスト上でワークスペースファイルを編集してください(例: `user@gateway-host:~/.openclaw/workspace`)。
</Note>

## 関連ドキュメント

- macOSアプリのオンボーディング: [オンボーディング](/start/onboarding)
- ワークスペースレイアウト: [エージェントワークスペース](/concepts/agent-workspace)
