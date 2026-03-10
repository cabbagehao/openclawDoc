---
summary: "OpenRouter の統合 API を使用して、OpenClaw の多くのモデルにアクセスします"
read_when:
  - 多数の LLM に対して単一の API キーが必要な場合
  - OpenClaw で OpenRouter 経由でモデルを実行したい
title: "オープンルーター"
x-i18n:
  source_hash: "b7e29fc9c456c64d567dd909a85166e6dea8388ebd22155a31e69c970e081586"
---

# オープンルーター

OpenRouter は、単一のモジュールの背後にある多くのモデルにリクエストをルーティングする **統合 API** を提供します
エンドポイントと API キー。 OpenAI と互換性があるため、ほとんどの OpenAI SDK はベース URL を切り替えることで動作します。

## CLI セットアップ

```bash
openclaw onboard --auth-choice apiKey --token-provider openrouter --token "$OPENROUTER_API_KEY"
```

## 構成スニペット

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

- モデル参照番号は `openrouter/<provider>/<model>` です。
- モデル/プロバイダーのオプションの詳細については、[/concepts/model-providers](/concepts/model-providers) を参照してください。
- OpenRouter は、API キーを使用してベアラー トークンを内部で使用します。
