---
summary: "OpenClaw でサポートされるモデルプロバイダー (LLM) のクイックスタート"
read_when:
  - モデルプロバイダーを選びたいとき
  - LLM 認証とモデル選択の最短手順を確認したいとき
title: "モデルプロバイダー クイックスタート"
x-i18n:
  source_path: "providers/models.md"
  source_hash: "76b3fce65756fbb2598ea592ab97e257f72246f0476b7ed3e7d6018a9f75778b"
---

# モデルプロバイダー

OpenClaw は多くの LLM プロバイダーを利用できます。1 つ選んで認証し、既定モデルを `provider/model` 形式で設定してください。

## クイックスタート (2 ステップ)

1. プロバイダーで認証します (通常は `openclaw onboard`)。
2. 既定モデルを設定します:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## サポートされるプロバイダー (スターターセット)

- [OpenAI (API + Codex)](/providers/openai)
- [Anthropic (API + Claude Code CLI)](/providers/anthropic)
- [OpenRouter](/providers/openrouter)
- [Vercel AI Gateway](/providers/vercel-ai-gateway)
- [Cloudflare AI Gateway](/providers/cloudflare-ai-gateway)
- [Moonshot AI (Kimi + Kimi Coding)](/providers/moonshot)
- [Mistral](/providers/mistral)
- [Synthetic](/providers/synthetic)
- [OpenCode Zen](/providers/opencode)
- [Z.AI](/providers/zai)
- [GLM models](/providers/glm)
- [MiniMax](/providers/minimax)
- [Venice (Venice AI)](/providers/venice)
- [Amazon Bedrock](/providers/bedrock)
- [Qianfan](/providers/qianfan)

完全な provider catalog (xAI、Groq、Mistral など) や高度な設定については、[モデルプロバイダー](/concepts/model-providers) を参照してください。
