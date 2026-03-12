---
summary: "vLLM で OpenClaw を実行する (OpenAI 互換のローカル サーバー)"
read_when:
  - ローカル vLLM サーバーに対して OpenClaw を実行したい
  - 独自のモデルで OpenAI 互換の /v1 エンドポイントが必要な場合
title: "vLLM"
x-i18n:
  source_hash: "47a7b4a302fa829dd9de2da048d6ecd0cea843b84acf92455653a900976216c3"
---
vLLM は、**OpenAI 互換** HTTP API 経由でオープンソース (および一部のカスタム) モデルを提供できます。 OpenClaw は、`openai-completions` API を使用して vLLM に接続できます。

OpenClaw は、`VLLM_API_KEY` (サーバーが認証を強制しない場合は任意の値が機能します) でオプトインし、明示的な `models.providers.vllm` エントリを定義しない場合、vLLM から利用可能なモデルを**自動検出**することもできます。

## クイックスタート

1. OpenAI 互換サーバーで vLLM を起動します。

ベース URL は `/v1` エンドポイント (例: `/v1/models`、`/v1/chat/completions`) を公開する必要があります。 vLLM は通常、次の環境で実行されます。

- `http://127.0.0.1:8000/v1`

2. オプトインします (認証が設定されていない場合は、任意の値が機能します):

```bash
export VLLM_API_KEY="vllm-local"
```

3. モデルを選択します (vLLM モデル ID の 1 つに置き換えます)。

```json5
{
  agents: {
    defaults: {
      model: { primary: "vllm/your-model-id" },
    },
  },
}
```

## モデル検出 (暗黙的なプロバイダー)

`VLLM_API_KEY` が設定されている (または認証プロファイルが存在している) のに、`models.providers.vllm` を**定義していない**場合、OpenClaw は次のクエリを実行します。

- `GET http://127.0.0.1:8000/v1/models`

…そして、返された ID をモデル エントリに変換します。

`models.providers.vllm` を明示的に設定した場合、自動検出はスキップされるため、モデルを手動で定義する必要があります。

## 明示的な構成 (手動モデル)

次の場合に明示的な構成を使用します。

- vLLM は別のホスト/ポートで実行されます。
- `contextWindow`/`maxTokens` 値を固定したい。
- サーバーには実際の API キーが必要です (またはヘッダーを制御したい場合)。

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "your-model-id",
            name: "Local vLLM Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## トラブルシューティング

- サーバーが到達可能であることを確認します。```bash
  curl http://127.0.0.1:8000/v1/models

```

- リクエストが認証エラーで失敗した場合は、サーバー構成に一致する実際の `VLLM_API_KEY` を設定するか、プロバイダーを `models.providers.vllm` で明示的に構成します。
```
