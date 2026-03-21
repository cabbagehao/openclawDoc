---
summary: "Moonshot K2 と Kimi コーディングの構成 (個別のプロバイダー + キー)"
read_when:
  - Moonshot K2 (Moonshot Open Platform) と Kimicoding のセットアップが必要な場合
  - 個別のエンドポイント、キー、モデル参照を理解する必要がある
  - いずれかのプロバイダーの設定をコピー/ペーストする必要がある
title: "Moonshot AI"
seoTitle: "OpenClawでMoonshot K2とKimi Codingを使う設定ガイド"
description: "Moonshot K2 と Kimi Coding を OpenClaw で使う設定ガイドです。provider の分け方、API キー、既定モデルの指定方法を整理しています。"
x-i18n:
  source_hash: "fb44b0d1213834934aac9b049193104d65fe01dbedc73558495d3cc8a1d3b6bf"
---
Moonshot は、OpenAI 互換エンドポイントを備えた Kim API を提供します。を設定します。
プロバイダーを選択し、デフォルトのモデルを `moonshot/kimi-k2.5` に設定するか、使用します
`kimi-coding/k2p5` を使用したキミ コーディング。

現在の Kim K2 モデル ID:

{/_Moonshot-kimi-k2-ids:start_/}

- `kimi-k2.5`
- `kimi-k2-0905-preview`
- `kimi-k2-turbo-preview`
- `kimi-k2-thinking`
- `kimi-k2-thinking-turbo`
  {/_ムーンショット-キミ-k2-ids:end_/}

```bash
openclaw onboard --auth-choice moonshot-api-key
```

キミコーディング:

```bash
openclaw onboard --auth-choice kimi-code-api-key
```

注: Moonshot と Kimicoding は別のプロバイダーです。キーは交換可能ではなく、エンドポイントが異なり、モデル参照も異なります (Moonshot は `moonshot/...` を使用し、Kimicoding は `kimi-coding/...` を使用します)。

## 構成スニペット (Moonshot API)

```json5
{
  env: { MOONSHOT_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "moonshot/kimi-k2.5" },
      models: {
        // moonshot-kimi-k2-aliases:start
        "moonshot/kimi-k2.5": { alias: "Kimi K2.5" },
        "moonshot/kimi-k2-0905-preview": { alias: "Kimi K2" },
        "moonshot/kimi-k2-turbo-preview": { alias: "Kimi K2 Turbo" },
        "moonshot/kimi-k2-thinking": { alias: "Kimi K2 Thinking" },
        "moonshot/kimi-k2-thinking-turbo": { alias: "Kimi K2 Thinking Turbo" },
        // moonshot-kimi-k2-aliases:end
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [
          // moonshot-kimi-k2-models:start
          {
            id: "kimi-k2.5",
            name: "Kimi K2.5",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 256000,
            maxTokens: 8192,
          },
          {
            id: "kimi-k2-0905-preview",
            name: "Kimi K2 0905 Preview",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 256000,
            maxTokens: 8192,
          },
          {
            id: "kimi-k2-turbo-preview",
            name: "Kimi K2 Turbo",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 256000,
            maxTokens: 8192,
          },
          {
            id: "kimi-k2-thinking",
            name: "Kimi K2 Thinking",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 256000,
            maxTokens: 8192,
          },
          {
            id: "kimi-k2-thinking-turbo",
            name: "Kimi K2 Thinking Turbo",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 256000,
            maxTokens: 8192,
          },
          // moonshot-kimi-k2-models:end
        ],
      },
    },
  },
}
```

## キミコーディング

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "kimi-coding/k2p5" },
      models: {
        "kimi-coding/k2p5": { alias: "Kimi K2.5" },
      },
    },
  },
}
```

## 注意事項

- ムーンショット モデルの参照では `moonshot/<modelId>` を使用します。 kimicoding モデル参照では `kimi-coding/<modelId>` を使用します。
- 必要に応じて、`models.providers` の価格設定とコンテキスト メタデータを上書きします。
- Moonshot がモデルに対して異なるコンテキスト制限を公開している場合は、調整します
  `contextWindow` となります。
- 国際エンドポイントには `https://api.moonshot.ai/v1` を使用し、中国エンドポイントには `https://api.moonshot.cn/v1` を使用します。

## ネイティブ思考モード (ムーンショット)

Moonshot Kim はバイナリ ネイティブ思考をサポートしています。

- `thinking: { type: "enabled" }`
- `thinking: { type: "disabled" }`

`agents.defaults.models.<provider/model>.params` を介してモデルごとに構成します。

```json5
{
  agents: {
    defaults: {
      models: {
        "moonshot/kimi-k2.5": {
          params: {
            thinking: { type: "disabled" },
          },
        },
      },
    },
  },
}
```

OpenClaw は、Moonshot のランタイム `/think` レベルもマッピングします。- `/think off` -> `thinking.type=disabled`

- オフではない思考レベル -> `thinking.type=enabled`

ムーンショット思考が有効な場合、`tool_choice` は `auto` または `none` でなければなりません。 OpenClaw は、互換性を確保するために、互換性のない `tool_choice` 値を `auto` に正規化します。
