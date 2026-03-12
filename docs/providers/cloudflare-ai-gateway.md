---
title: "Cloudflare AI Gateway"
summary: "Cloudflare AI Gateway のセットアップ (認証 + モデル選択)"
read_when:
  - OpenClaw で Cloudflare AI Gateway を使いたいとき
  - account ID、gateway ID、または API key の環境変数を確認したいとき
x-i18n:
  source_hash: "db77652c37652ca20f7c50f32382dbaeaeb50ea5bdeaf1d4fd17dc394e58950c"
---

# Cloudflare AI Gateway

Cloudflare AI Gateway は provider API の前段に置かれ、分析、キャッシュ、各種制御を追加できます。Anthropic については、OpenClaw はゲートウェイ endpoint を通して Anthropic Messages API を利用します。

- Provider: `cloudflare-ai-gateway`
- Base URL: `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`
- Default model: `cloudflare-ai-gateway/claude-sonnet-4-5`
- API key: `CLOUDFLARE_AI_GATEWAY_API_KEY` (ゲートウェイ経由で request を送る際の provider API key)

Anthropic モデルを使う場合は、Anthropic API key を使用してください。

## クイックスタート

1. provider API key と Gateway 情報を設定します。

```bash
openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
```

2. 既定モデルを設定します。

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

## 認証付き Gateway

Cloudflare 側で Gateway 認証を有効化している場合は、provider API key に加えて `cf-aig-authorization` header も設定します。

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

## 環境に関する注意

ゲートウェイが daemon (launchd / systemd) として動作している場合は、`CLOUDFLARE_AI_GATEWAY_API_KEY` がその process から参照できることを確認してください。たとえば `~/.openclaw/.env` や `env.shellEnv` 経由で設定します。
