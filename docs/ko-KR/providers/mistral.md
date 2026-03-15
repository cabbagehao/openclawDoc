---
summary: "OpenClaw 에서 Mistral 모델과 Voxtral 전사를 사용하기"
read_when:
  - OpenClaw 에서 Mistral 모델을 사용하고 싶을 때
  - Mistral API key 온보딩과 model ref 가 필요할 때
title: "Mistral"
---

# Mistral

OpenClaw 는 텍스트/이미지 모델 라우팅(`mistral/...`)과
media understanding 의 Voxtral 오디오 전사 모두에 Mistral 을 지원합니다.
Mistral 은 메모리 임베딩(`memorySearch.provider = "mistral"`)에도 사용할 수 있습니다.

## CLI 설정

```bash
openclaw onboard --auth-choice mistral-api-key
# 또는 non-interactive
openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"
```

## Config snippet (LLM provider)

```json5
{
  env: { MISTRAL_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "mistral/mistral-large-latest" } } },
}
```

## Config snippet (Voxtral 오디오 전사)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

## 메모

- Mistral 인증은 `MISTRAL_API_KEY` 를 사용합니다.
- Provider 기본 base URL 은 `https://api.mistral.ai/v1` 입니다.
- Onboarding 기본 모델은 `mistral/mistral-large-latest` 입니다.
- Mistral 의 media-understanding 기본 오디오 모델은 `voxtral-mini-latest` 입니다.
- 미디어 전사 경로는 `/v1/audio/transcriptions` 를 사용합니다.
- 메모리 임베딩 경로는 `/v1/embeddings` 입니다(기본 모델: `mistral-embed`).
