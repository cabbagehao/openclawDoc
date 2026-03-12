---
summary: "OpenClaw で Qwen OAuth (無料枠) を使用する"
read_when:
  - OpenClaw で Qwen を使用したい
  - Qwen Coder への無料層 OAuth アクセスが必要です
title: "クウェン"
x-i18n:
  source_hash: "88b88e224e2fecbb1ca26e24fbccdbe25609be40b38335d0451343a5da53fdd4"
---

# クウェン

Qwen は、Qwen Coder および Qwen Vision モデルに無料層 OAuth フローを提供します
(1 日あたり 2,000 リクエスト、Qwen のレート制限の対象となります)。

## プラグインを有効にする

```bash
openclaw plugins enable qwen-portal-auth
```

有効にした後、ゲートウェイを再起動します。

## 認証する

```bash
openclaw models auth login --provider qwen-portal --set-default
```

これにより、Qwen デバイスコード OAuth フローが実行され、プロバイダー エントリが
`models.json` (さらに、クイック切り替え用の `qwen` エイリアス)。

## モデル ID

- `qwen-portal/coder-model`
- `qwen-portal/vision-model`

次の方法でモデルを切り替えます。

```bash
openclaw models set qwen-portal/coder-model
```

## Qwen コード CLI ログインを再利用する

Qwen Code CLI を使用してすでにログインしている場合、OpenClaw は認証情報を同期します。
認証ストアをロードするときに `~/.qwen/oauth_creds.json` から。まだ必要です
`models.providers.qwen-portal` エントリ (作成するには上記のログイン コマンドを使用します)。

## 注意事項

- トークンは自動更新されます。更新が失敗した場合、またはアクセスが取り消された場合は、ログイン コマンドを再実行します。
- デフォルトのベース URL: `https://portal.qwen.ai/v1` (でオーバーライドします)
  `models.providers.qwen-portal.baseUrl` Qwen が別のエンドポイントを提供する場合)。
- プロバイダー全体のルールについては、[モデル プロバイダー](/concepts/model-providers) を参照してください。
