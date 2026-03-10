---
summary: "「openclaw configure」の CLI リファレンス (対話型構成プロンプト)"
read_when:
  - 資格情報、デバイス、またはエージェントのデフォルトを対話的に調整したい
title: "構成する"
x-i18n:
  source_hash: "2df6bce0bf8c02cca7cdc28d6d28f3e32dd52329c54438c7b4fb7a236e105fa4"
---

# `openclaw configure`

資格情報、デバイス、エージェントのデフォルトを設定するための対話型プロンプト。

注: **モデル** セクションには、
`agents.defaults.models` ホワイトリスト (`/model` およびモデル ピッカーに表示されるもの)。

ヒント: サブコマンドを指定しない `openclaw config` と同じウィザードが開きます。使用する
`openclaw config get|set|unset` 非対話型編集の場合。

関連:

- ゲートウェイ構成リファレンス: [構成](/gateway/configuration)
- 構成 CLI: [構成](/cli/config)

注:

- ゲートウェイを実行する場所を選択すると、常に `gateway.mode` が更新されます。それだけが必要な場合は、他のセクションを選択せず​​に「続行」を選択できます。
- チャネル指向のサービス (Slack/Discord/Matrix/Microsoft Teams) は、セットアップ中にチャネル/ルームの許可リストの入力を求めます。名前または ID を入力できます。可能な場合、ウィザードは名前を ID に解決します。
- デーモンのインストール手順を実行し、トークン認証にトークンが必要で、`gateway.auth.token` が SecretRef で管理されている場合、configure は SecretRef を検証しますが、解決されたプレーンテキストのトークン値をスーパーバイザ サービス環境のメタデータに保持しません。
- トークン認証にトークンが必要で、構成されたトークン SecretRef が未解決の場合は、実行可能な修復ガイダンスを使用して、ブロック デーモンのインストールを構成します。
- `gateway.auth.token` と `gateway.auth.password` の両方が構成され、`gateway.auth.mode` が設定されていない場合は、モードが明示的に設定されるまで、ブロック デーモンのインストールを構成します。

## 例```bash

openclaw configure
openclaw configure --section model --section channels

```

```
