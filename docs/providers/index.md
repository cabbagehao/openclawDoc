---
summary: "OpenClaw でサポートされるモデル プロバイダー (LLM)"
read_when:
  - モデル プロバイダーを選びたいとき
  - サポートされている LLM backend を手早く確認したいとき
title: "Model Providers"
seoTitle: "OpenClaw対応LLMプロバイダー一覧と認証・接続比較ガイド"
description: "OpenClaw で使える LLM プロバイダーの一覧ページです。各 provider の特徴と認証方式を比較し、用途に合った接続先を選ぶ手がかりを得られます。"
x-i18n:
  source_hash: "4d17e6399e5b0a8c7e4cb3b4678ec75aa61225a37c65bf3d6884c1d35d229466"
---
OpenClaw は多数の LLM provider を利用できます。provider を選び、認証を済ませたうえで、既定モデルを `provider/model` 形式で設定します。

チャット用 channel の説明 (WhatsApp / Telegram / Discord / Slack / Mattermost (plugin) など) を探している場合は、[Channels](/channels) を参照してください。

## クイックスタート

1. provider で認証します (通常は `openclaw onboard` を使います)。
2. 既定モデルを設定します。

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Provider ドキュメント

- [Amazon Bedrock](/providers/bedrock)
- [Anthropic (API + Claude Code CLI)](/providers/anthropic)
- [Cloudflare AI Gateway](/providers/cloudflare-ai-gateway)
- [GLM models](/providers/glm)
- [Hugging Face (Inference)](/providers/huggingface)
- [Kilocode](/providers/kilocode)
- [LiteLLM (unified gateway)](/providers/litellm)
- [MiniMax](/providers/minimax)
- [Mistral](/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/providers/moonshot)
- [NVIDIA](/providers/nvidia)
- [Ollama (local models)](/providers/ollama)
- [OpenAI (API + Codex)](/providers/openai)
- [OpenCode Zen](/providers/opencode)
- [OpenRouter](/providers/openrouter)
- [Qianfan](/providers/qianfan)
- [Qwen (OAuth)](/providers/qwen)
- [Together AI](/providers/together)
- [Vercel AI Gateway](/providers/vercel-ai-gateway)
- [Venice (Venice AI, privacy-focused)](/providers/venice)
- [vLLM (local models)](/providers/vllm)
- [Xiaomi](/providers/xiaomi)
- [Z.AI](/providers/zai)

## 文字起こし provider

- [Deepgram (audio transcription)](/providers/deepgram)

## コミュニティ ツール

- [Claude Max API Proxy](/providers/claude-max-api-proxy) - Claude subscription の認証情報を使うコミュニティ製 proxy です。使用前に Anthropic の policy / terms を確認してください。

完全な provider catalog (xAI、Groq、Mistral など) や高度な設定については、[Model providers](/concepts/model-providers) を参照してください。
