---
summary: "OpenClaw가 지원하는 모델 제공업체(LLM)"
read_when:
  - 모델 제공업체를 선택하고 싶을 때
  - LLM 인증과 모델 선택 예시를 빠르게 보고 싶을 때
title: "모델 제공업체 빠른 시작"
x-i18n:
  source_path: "providers/models.md"
---

# 모델 제공업체

OpenClaw는 다양한 LLM 제공업체를 사용할 수 있습니다. 하나를 고르고 인증한 뒤,
기본 모델을 `provider/model` 형식으로 설정하세요.

## 빠른 시작(두 단계)

1. 제공업체에 인증합니다(보통 `openclaw onboard` 사용).
2. 기본 모델을 설정합니다.

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## 지원되는 제공업체(입문용)

* [OpenAI (API + Codex)](/providers/openai)
* [Anthropic (API + Claude Code CLI)](/providers/anthropic)
* [OpenRouter](/providers/openrouter)
* [Vercel AI Gateway](/providers/vercel-ai-gateway)
* [Cloudflare AI Gateway](/providers/cloudflare-ai-gateway)
* [Moonshot AI (Kimi + Kimi Coding)](/providers/moonshot)
* [Mistral](/providers/mistral)
* [Synthetic](/providers/synthetic)
* [OpenCode Zen](/providers/opencode)
* [Z.AI](/providers/zai)
* [GLM models](/providers/glm)
* [MiniMax](/providers/minimax)
* [Venice (Venice AI)](/providers/venice)
* [Amazon Bedrock](/providers/bedrock)
* [Qianfan](/providers/qianfan)

전체 제공업체 카탈로그(xAI, Groq, Mistral 등)와 고급 설정은
[모델 제공업체](/concepts/model-providers)를 참고하세요.
