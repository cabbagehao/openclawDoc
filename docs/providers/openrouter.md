---
summary: "OpenClaw で OpenRouter の統合 API を使って多数のモデルへアクセスする"
read_when:
  - 1 つの API キーで多数の LLM を使いたいとき
  - OpenClaw で OpenRouter 経由のモデルを使いたいとき
title: "OpenRouter"
x-i18n:
  source_hash: "b7e29fc9c456c64d567dd909a85166e6dea8388ebd22155a31e69c970e081586"
---

# OpenRouter

OpenRouter は、単一の endpoint と API キーの背後で多数のモデルへリクエストをルーティングする**統合 API**を提供します。OpenAI 互換であるため、多くの OpenAI SDK は base URL を切り替えるだけで利用できます。

## CLI セットアップ

```bash
openclaw onboard --auth-choice apiKey --token-provider openrouter --token "$OPENROUTER_API_KEY"
```

## 設定例

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/anthropic/claude-sonnet-4-5" },
    },
  },
}
```

## 注意事項

- モデル参照名は `openrouter/<provider>/<model>` です。
- 利用可能なモデルや provider の詳細は [/concepts/model-providers](/concepts/model-providers) を参照してください。
- OpenRouter では内部的に API キーを Bearer トークンとして使用します。
