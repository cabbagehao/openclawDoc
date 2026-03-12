---
title: "OpenClawでVercel AI Gatewayを使う認証・モデル設定ガイド"
description: "Vercel AI Gateway を OpenClaw に接続する設定ガイドです。API キー認証、統合 endpoint、モデル選択の基本を確認できます。"
summary: "Vercel AI Gateway のセットアップ (認証 + モデルの選択)"
read_when:
  - OpenClaw で Vercel AI Gateway を使用したい
  - API キーの環境変数または CLI 認証の選択が必要です
x-i18n:
  source_hash: "f30768dc3db49708b25042d317906f7ad9a2c72b0fa03263bc04f5eefbf7a507"
---
[Vercel AI Gateway](https://vercel.com/ai-gateway) は、単一のエンドポイントを通じて数百のモデルにアクセスするための統合 API を提供します。

- プロバイダー: `vercel-ai-gateway`
- 認証: `AI_GATEWAY_API_KEY`
- API: Anthropic Messages 互換
- OpenClaw はゲートウェイ `/v1/models` カタログを自動検出するため、`/models vercel-ai-gateway`
  `vercel-ai-gateway/openai/gpt-5.4` などの現在のモデル参照が含まれます。

## クイックスタート

1. API キーを設定します (推奨: ゲートウェイ用に保存します)。

```bash
openclaw onboard --auth-choice ai-gateway-api-key
```

2. デフォルトのモデルを設定します。

```json5
{
  agents: {
    defaults: {
      model: { primary: "vercel-ai-gateway/anthropic/claude-opus-4.6" },
    },
  },
}
```

## 非対話型の例

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## 環境に関する注意事項

ゲートウェイがデーモン (launchd/systemd) として実行されている場合は、`AI_GATEWAY_API_KEY` であることを確認してください。
そのプロセスで利用できます (たとえば、`~/.openclaw/.env` または経由)
`env.shellEnv`)。

## モデル ID の省略表記

OpenClaw は Vercel Claude の短縮形モデル参照を受け入れ、それらを次のように正規化します。
ランタイム:

- `vercel-ai-gateway/claude-opus-4.6` -> `vercel-ai-gateway/anthropic/claude-opus-4.6`
- `vercel-ai-gateway/opus-4.6` -> `vercel-ai-gateway/anthropic/claude-opus-4-6`
