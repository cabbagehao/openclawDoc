---
summary: "OpenClaw で Xiaomi MiMo (mimo-v2-flash) を使用する"
read_when:
  - OpenClaw で Xiaomi MiMo モデルが必要な場合
  - XIAOMI_API_KEYの設定が必要です
title: "OpenClawでXiaomi MiMoモデルAPIを使う認証・設定ガイド"
description: "Xiaomi MiMo モデル API を OpenClaw で使う設定ガイドです。API キー作成、対応 API 形式、provider 設定の流れを確認できます。"
x-i18n:
  source_hash: "366fd2297b2caf8c5ad944d7f1b6d233b248fe43aedd22a28352ae7f370d2435"
---
Xiaomi MiMo は **MiMo** モデル用の API プラットフォームです。と互換性のある REST API を提供します。
OpenAI と Anthropic は認証に API キーをフォーマットし、使用します。 API キーを作成します
[Xiaomi MiMo コンソール](https://platform.xiaomimimo.com/#/console/api-keys)。 OpenClaw の用途
Xiaomi MiMo API キーを持つ `xiaomi` プロバイダー。

## モデルの概要

- **mimo-v2-flash**: 262144-token コンテキスト ウィンドウ、Anthropic Messages API と互換性があります。
- ベース URL: `https://api.xiaomimimo.com/anthropic`
- 認可: `Bearer $XIAOMI_API_KEY`

## CLI セットアップ

```bash
openclaw onboard --auth-choice xiaomi-api-key
# or non-interactive
openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
```

## 構成スニペット

```json5
{
  env: { XIAOMI_API_KEY: "your-key" },
  agents: { defaults: { model: { primary: "xiaomi/mimo-v2-flash" } } },
  models: {
    mode: "merge",
    providers: {
      xiaomi: {
        baseUrl: "https://api.xiaomimimo.com/anthropic",
        api: "anthropic-messages",
        apiKey: "XIAOMI_API_KEY",
        models: [
          {
            id: "mimo-v2-flash",
            name: "Xiaomi MiMo V2 Flash",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## 注意事項

- モデル参照: `xiaomi/mimo-v2-flash`。
- `XIAOMI_API_KEY` が設定されている場合 (または認証プロファイルが存在している場合)、プロバイダーは自動的に挿入されます。
- プロバイダーのルールについては、[/concepts/model-providers](/concepts/model-providers) を参照してください。
