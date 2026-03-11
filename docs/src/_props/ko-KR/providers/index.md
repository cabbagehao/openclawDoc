---
summary: "OpenClaw가 지원하는 모델 제공업체(LLM)"
read_when:
  - 모델 제공업체를 선택하고 싶을 때
  - 지원되는 LLM 백엔드를 빠르게 훑어보고 싶을 때
title: "모델 제공업체"
x-i18n:
  source_path: "providers/index.md"
---

# 모델 제공업체

OpenClaw는 다양한 LLM 제공업체를 사용할 수 있습니다. 제공업체를 고르고 인증한 뒤,
기본 모델을 `provider/model` 형식으로 설정하세요.

채팅 채널 문서(WhatsApp/Telegram/Discord/Slack/Mattermost(플러그인) 등)를 찾고 있나요?
[채널](/channels)을 참고하세요.

## 빠른 시작

1. 제공업체에 인증합니다(보통 `openclaw onboard` 사용).
2. 기본 모델을 설정합니다.

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## 제공업체 문서

* [Amazon Bedrock](/providers/bedrock)
* [Anthropic (API + Claude Code CLI)](/providers/anthropic)
* [Cloudflare AI Gateway](/providers/cloudflare-ai-gateway)
* [GLM models](/providers/glm)
* [Hugging Face (Inference)](/providers/huggingface)
* [Kilocode](/providers/kilocode)
* [LiteLLM (unified gateway)](/providers/litellm)
* [MiniMax](/providers/minimax)
* [Mistral](/providers/mistral)
* [Moonshot AI (Kimi + Kimi Coding)](/providers/moonshot)
* [NVIDIA](/providers/nvidia)
* [Ollama (local models)](/providers/ollama)
* [OpenAI (API + Codex)](/providers/openai)
* [OpenCode Zen](/providers/opencode)
* [OpenRouter](/providers/openrouter)
* [Qianfan](/providers/qianfan)
* [Qwen (OAuth)](/providers/qwen)
* [Together AI](/providers/together)
* [Vercel AI Gateway](/providers/vercel-ai-gateway)
* [Venice (Venice AI, privacy-focused)](/providers/venice)
* [vLLM (local models)](/providers/vllm)
* [Xiaomi](/providers/xiaomi)
* [Z.AI](/providers/zai)

## 전사 제공업체

* [Deepgram (audio transcription)](/providers/deepgram)

## 커뮤니티 도구

* [Claude Max API Proxy](/providers/claude-max-api-proxy) - Claude 구독 자격 증명을 위한 커뮤니티 프록시입니다(사용 전 Anthropic 정책/약관을 확인하세요).

전체 제공업체 카탈로그(xAI, Groq, Mistral 등)와 고급 설정은
[모델 제공업체](/concepts/model-providers)를 참고하세요.
