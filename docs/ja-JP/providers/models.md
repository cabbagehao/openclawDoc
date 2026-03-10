---
summary: "OpenClaw でサポートされるモデル プロバイダー (LLM)"
read_when:
  - モデルプロバイダーを選択したい
  - LLM 認証とモデル選択の簡単なセットアップ例が必要な場合
title: "モデルプロバイダーのクイックスタート"
x-i18n:
  source_hash: "76b3fce65756fbb2598ea592ab97e257f72246f0476b7ed3e7d6018a9f75778b"
---

# モデルプロバイダー

OpenClaw は多くの LLM プロバイダーを使用できます。 1 つ選択して認証し、デフォルトを設定します
モデルは `provider/model` です。

## クイックスタート (2 ステップ)

1. プロバイダーで認証します (通常は `openclaw onboard` 経由)。
2. デフォルトのモデルを設定します。

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## サポートされているプロバイダー (スターター セット)

- [OpenAI (API + コーデックス)](/providers/openai)
- [人類 (API + クロード コード CLI)](/providers/anthropic)
- [オープンルーター](/providers/openrouter)
- [Vercel AI ゲートウェイ](/providers/vercel-ai-gateway)
- [Cloudflare AI ゲートウェイ](/providers/cloudflare-ai-gateway)
- [ムーンショット AI (キミ + キミ コーディング)](/providers/moonshot)
- [ミストラル](/providers/mistral)
- [合成](/providers/synthetic)
- [OpenCode Zen](/providers/opencode)
- [Z.AI](/providers/zai)
- [GLMモデル](/providers/glm)
- [ミニマックス](/providers/minimax)
- [ヴェネツィア (ヴェネツィア AI)](/providers/venice)
- [Amazon Bedrock](/providers/bedrock)
- [チェンファン](/providers/qianfan)

完全なプロバイダー カタログ (xAI、Groq、Mistral など) と高度な構成については、
[モデルプロバイダー](/concepts/model-providers) を参照してください。
