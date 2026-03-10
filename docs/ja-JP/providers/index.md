---
summary: "OpenClaw でサポートされるモデル プロバイダー (LLM)"
read_when:
  - モデルプロバイダーを選択したい
  - サポートされている LLM バックエンドの概要を簡単に理解する必要がある
title: "モデルプロバイダー"
x-i18n:
  source_hash: "4d17e6399e5b0a8c7e4cb3b4678ec75aa61225a37c65bf3d6884c1d35d229466"
---

# モデルプロバイダー

OpenClaw は多くの LLM プロバイダーを使用できます。プロバイダーを選択し、認証してから、
デフォルトのモデルは `provider/model` です。

チャット チャネル ドキュメント (WhatsApp/Telegram/Discord/Slack/Mattermost (プラグイン)/など) をお探しですか? [チャネル](/channels) を参照してください。

## クイックスタート

1. プロバイダーで認証します (通常は `openclaw onboard` 経由)。
2. デフォルトのモデルを設定します。

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## プロバイダーのドキュメント

- [Amazon Bedrock](/providers/bedrock)
- [人類 (API + クロード コード CLI)](/providers/anthropic)
- [Cloudflare AI ゲートウェイ](/providers/cloudflare-ai-gateway)
- [GLMモデル](/providers/glm)
- [抱き合う顔(推測)](/providers/huggingface)
- [キロコード](/providers/kilocode)
- [LiteLLM (統合ゲートウェイ)](/providers/litellm)
- [ミニマックス](/providers/minimax)
- [ミストラル](/providers/mistral)
- [ムーンショット AI (キミ + キミ コーディング)](/providers/moonshot)
- [NVIDIA](/providers/nvidia)
- [オラマ (ローカルモデル)](/providers/ollama)
- [OpenAI (API + コーデックス)](/providers/openai)
- [OpenCode Zen](/providers/opencode)
- [オープンルーター](/providers/openrouter)
- [チェンファン](/providers/qianfan)
- [クウェン (OAuth)](/providers/qwen)
- [一緒にAI](/providers/together)
- [Vercel AI ゲートウェイ](/providers/vercel-ai-gateway)
- [ヴェニス (ヴェニス AI、プライバシー重視)](/providers/venice)
- [vLLM (ローカル モデル)](/providers/vllm)
- [Xiaomi](/providers/xiaomi)
- [Z.AI](/providers/zai)

## 文字起こしプロバイダー

- [ディープグラム (音声転写)](/providers/deepgram)

## コミュニティツール- [Claude Max API プロキシ](/providers/claude-max-api-proxy) - Claude サブスクリプション資格情報のコミュニティ プロキシ (使用前に Anthropic ポリシー/条件を確認してください)

完全なプロバイダー カタログ (xAI、Groq、Mistral など) と高度な構成については、
[モデルプロバイダー](/concepts/model-providers) を参照してください。
