---
title: "Cloudflare AI ゲートウェイ"
summary: "Cloudflare AI Gatewayのセットアップ（認証+モデルの選択）"
read_when:
  - OpenClaw で Cloudflare AI Gateway を使用したい
  - アカウント ID、ゲートウェイ ID、または API キー環境変数が必要です
x-i18n:
  source_hash: "db77652c37652ca20f7c50f32382dbaeaeb50ea5bdeaf1d4fd17dc394e58950c"
---

# Cloudflare AI ゲートウェイ

Cloudflare AI Gateway はプロバイダー API の前に位置し、分析、キャッシュ、コントロールを追加できます。 Anthropic の場合、OpenClaw はゲートウェイ エンドポイントを通じて Anthropic Messages API を使用します。

- プロバイダー: `cloudflare-ai-gateway`
- ベース URL: `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`
- デフォルトのモデル: `cloudflare-ai-gateway/claude-sonnet-4-5`
- API キー: `CLOUDFLARE_AI_GATEWAY_API_KEY` (ゲートウェイ経由のリクエスト用のプロバイダー API キー)

Anthropic モデルの場合は、Anthropic API キーを使用します。

## クイックスタート

1. プロバイダー API キーとゲートウェイの詳細を設定します。

```bash
openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
```

2. デフォルトのモデルを設定します。

```json5
{
  agents: {
    defaults: {
      model: { primary: "cloudflare-ai-gateway/claude-sonnet-4-5" },
    },
  },
}
```

## 非対話型の例

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cloudflare-ai-gateway-api-key \
  --cloudflare-ai-gateway-account-id "your-account-id" \
  --cloudflare-ai-gateway-gateway-id "your-gateway-id" \
  --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY"
```

## 認証されたゲートウェイ

Cloudflareでゲートウェイ認証を有効にした場合は、`cf-aig-authorization`ヘッダーを追加します(これはプロバイダーAPIキーに追加されます)。

```json5
{
  models: {
    providers: {
      "cloudflare-ai-gateway": {
        headers: {
          "cf-aig-authorization": "Bearer <cloudflare-ai-gateway-token>",
        },
      },
    },
  },
}
```

## 環境に関する注意事項

ゲートウェイがデーモン (launchd/systemd) として実行されている場合は、`CLOUDFLARE_AI_GATEWAY_API_KEY` がそのプロセスで利用可能であることを確認してください (たとえば、`~/.openclaw/.env` 内または `env.shellEnv` 経由)。
