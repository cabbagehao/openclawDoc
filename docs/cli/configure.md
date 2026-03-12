---
summary: "`openclaw configure` の CLI リファレンス (対話形式による構成設定プロンプト)"
read_when:
  - 認証情報、デバイス、またはエージェントのデフォルト設定を対話的に調整したい場合
title: "configure"
x-i18n:
  source_hash: "2df6bce0bf8c02cca7cdc28d6d28f3e32dd52329c54438c7b4fb7a236e105fa4"
---
認証情報、デバイス、およびエージェントのデフォルト設定を行うための対話形式のプロンプトです。

補足: **Model** セクションには、`agents.defaults.models` の許可リスト（`/model` コマンドやモデル選択ツールに表示されるモデル）の複数選択機能が含まれています。

ヒント: サブコマンドなしの `openclaw config` を実行しても同じウィザードが開きます。非対話形式で編集したい場合は `openclaw config get|set|unset` を使用してください。

関連ドキュメント:
- ゲートウェイ構成リファレンス: [構成](/gateway/configuration)
- 構成用 CLI: [Config](/cli/config)

注意事項:
- ゲートウェイの実行場所を選択すると、常に `gateway.mode` が更新されます。他のセクションの設定が不要な場合は、そのまま "Continue" を選択して終了できます。
- チャネル系のサービス（Slack, Discord, Matrix, Microsoft Teams）では、セットアップ中にチャネルやルームの許可リスト（allowlist）の設定を求められます。名前または ID を入力でき、ウィザードは可能な限り名前を ID に解決しようと試みます。
- デーモンのインストール手順において、トークン認証が有効で、かつ `gateway.auth.token` が SecretRef で管理されている場合、ウィザードは SecretRef の妥当性を検証しますが、解決された平文のトークン値をサービスの環境メタデータに永続化させることはありません。
- トークン認証が必要な状況で、構成されたトークン用の SecretRef が解決できない場合、ウィザードは具体的な解決策を提示した上でデーモンのインストールをブロックします。
- `gateway.auth.token` と `gateway.auth.password` の両方が構成され、かつ `gateway.auth.mode` が未設定の場合、モードが明示的に設定されるまでデーモンのインストールはブロックされます。

## 実行例

```bash
openclaw configure
openclaw configure --section model --section channels
```
