---
title: "Vercel AI Gateway"
summary: "Vercel AI Gateway 설정(auth + 모델 선택)"
description: "Vercel AI Gateway 설정(auth + 모델 선택)"
read_when:
  - OpenClaw 에서 Vercel AI Gateway 를 사용하고 싶을 때
  - API 키 env var 또는 CLI auth choice 가 필요할 때
---

# Vercel AI Gateway

[Vercel AI Gateway](https://vercel.com/ai-gateway) 는 단일 엔드포인트를 통해 수백 개 모델에 접근할 수 있는 통합 API 를 제공합니다.

- provider: `vercel-ai-gateway`
- 인증: `AI_GATEWAY_API_KEY`
- API: Anthropic Messages 호환
- OpenClaw 는 Gateway 의 `/v1/models` 카탈로그를 자동 발견하므로, `/models vercel-ai-gateway`
  에는 `vercel-ai-gateway/openai/gpt-5.4` 같은 최신 모델 ref 가 포함됩니다.

## 빠른 시작

1. API 키 를 설정합니다(권장: Gateway 용으로 저장):

```bash
openclaw onboard --auth-choice ai-gateway-api-key
```

2. 기본 모델을 설정합니다:

```json5
{
  agents: {
    defaults: {
      model: { primary: "vercel-ai-gateway/anthropic/claude-opus-4.6" },
    },
  },
}
```

## 비대화형 예시

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## 환경 메모

Gateway 가 daemon(launchd/systemd)으로 실행된다면, `AI_GATEWAY_API_KEY` 가
그 프로세스에서 사용 가능해야 합니다(예: `~/.openclaw/.env` 또는
`env.shellEnv` 를 통해).

## Model ID shorthand

OpenClaw 는 Vercel Claude shorthand 모델 ref 를 받아 런타임에 정규화합니다:

- `vercel-ai-gateway/claude-opus-4.6` -> `vercel-ai-gateway/anthropic/claude-opus-4.6`
- `vercel-ai-gateway/opus-4.6` -> `vercel-ai-gateway/anthropic/claude-opus-4-6`
