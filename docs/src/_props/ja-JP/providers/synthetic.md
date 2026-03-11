---
summary: "OpenClaw で Synthetic の Anthropic 互換 API を使用する"
read_when:
  - Synthetic をモデルプロバイダーとして使用したい場合
  - 合成 API キーまたはベース URL の設定が必要です
title: "合成"
x-i18n:
  source_hash: "3a2adb0b831babe3e88b027772167748764d85ee72d402ff759571420a91757f"
---

# 合成

Synthetic は Anthropic 互換のエンドポイントを公開します。 OpenClaw はそれを
`synthetic` プロバイダーであり、Anthropic Messages API を使用します。

## クイックセットアップ

1. `SYNTHETIC_API_KEY` を設定します (または以下のウィザードを実行します)。
2. オンボーディングを実行します。

```bash
openclaw onboard --auth-choice synthetic-api-key
```

デフォルトのモデルは次のように設定されています。

```
synthetic/hf:MiniMaxAI/MiniMax-M2.5
```

## 設定例

```json5
{
  env: { SYNTHETIC_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
      models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "hf:MiniMaxAI/MiniMax-M2.5",
            name: "MiniMax M2.5",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 192000,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

注: OpenClaw の Anthropic クライアントはベース URL に `/v1` を追加するため、
`https://api.synthetic.new/anthropic` (`/anthropic/v1` ではありません)。合成が変更された場合
ベース URL をオーバーライドするには、`models.providers.synthetic.baseUrl` を使用します。

## モデルカタログ

\| 以下のすべてのモデルはコスト `0` (入力/出力/キャッシュ) を使用します。 | モデルID | コンテキストウィンドウ | 最大トークン数 | 推論            | 入力 |
\| ---------------------------------------------------------------------- | -------- | ---------------------- | -------------- | --------------- | ---- | ------------------------ | ------ | ---- | --- | -------- |
\| `hf:MiniMaxAI/MiniMax-M2.5`                                            | 192000   | 65536                  | 偽             | テキスト        |
\| `hf:moonshotai/Kimi-K2-Thinking`                                       | 256000   | 8192                   | 本当           | テキスト        |
\| `hf:zai-org/GLM-4.7`                                                   | 198000   | 128000                 | 偽             | テキスト        |
\| `hf:deepseek-ai/DeepSeek-R1-0528`                                      | 128000   | 8192                   | 偽             | テキスト        |
\| `hf:deepseek-ai/DeepSeek-V3-0324`                                      | 128000   | 8192                   | 偽             | テキスト        |
\| `hf:deepseek-ai/DeepSeek-V3.1`                                         | 128000   | 8192                   | 偽             | テキスト        |
\| `hf:deepseek-ai/DeepSeek-V3.1-Terminus`                                | 128000   | 8192                   | 偽             | テキスト        |
\| `hf:deepseek-ai/DeepSeek-V3.2`                                         | 159000   | 8192                   | 偽             | テキスト        |
\| `hf:meta-llama/Llama-3.3-70B-Instruct`                                 | 128000   | 8192                   | 偽             | テキスト        |
\| `hf:meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8`                 | 524000   | 8192                   | 偽             | テキスト        |
\| `hf:moonshotai/Kimi-K2-Instruct-0905`                                  | 256000   | 8192                   | 偽             | テキスト        |      | `hf:openai/gpt-oss-120b` | 128000 | 8192 | 偽  | テキスト |
\| `hf:Qwen/Qwen3-235B-A22B-Instruct-2507`                                | 256000   | 8192                   | 偽             | テキスト        |
\| `hf:Qwen/Qwen3-Coder-480B-A35B-Instruct`                               | 256000   | 8192                   | 偽             | テキスト        |
\| `hf:Qwen/Qwen3-VL-235B-A22B-Instruct`                                  | 250000   | 8192                   | 偽             | テキスト + 画像 |
\| `hf:zai-org/GLM-4.5`                                                   | 128000   | 128000                 | 偽             | テキスト        |
\| `hf:zai-org/GLM-4.6`                                                   | 198000   | 128000                 | 偽             | テキスト        |
\| `hf:deepseek-ai/DeepSeek-V3`                                           | 128000   | 8192                   | 偽             | テキスト        |
\| `hf:Qwen/Qwen3-235B-A22B-Thinking-2507`                                | 256000   | 8192                   | 本当           | テキスト        |

## 注意事項

* モデル参照は `synthetic/<modelId>` を使用します。
* モデル許可リスト (`agents.defaults.models`) を有効にした場合は、必要なすべてのモデルを追加します。
  使用する予定。
* プロバイダーのルールについては、[モデルプロバイダー](/concepts/model-providers) を参照してください。
