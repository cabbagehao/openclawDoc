---
title: "Cloudflare AI Gateway"
summary: "Cloudflare AI Gateway 설정(auth + 모델 선택)"
description: "OpenClaw에서 Cloudflare AI Gateway를 Anthropic 경유 프록시로 설정하고 auth header와 기본 모델을 지정하는 방법을 설명합니다."
read_when:
  - OpenClaw 에서 Cloudflare AI Gateway 를 사용하고 싶을 때
  - account ID, gateway ID, 또는 API 키 env var 가 필요할 때
---

# Cloudflare AI Gateway

Cloudflare AI Gateway 는 프로바이더 API 앞단에 위치해 analytics, caching, controls 를 추가할 수 있게 해 줍니다. Anthropic 의 경우 OpenClaw 는 Gateway 엔드포인트를 통해 Anthropic Messages API 를 사용합니다.

- provider: `cloudflare-ai-gateway`
- Base URL: `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`
- Default model: `cloudflare-ai-gateway/claude-sonnet-4-5`
- API 키: `CLOUDFLARE_AI_GATEWAY_API_KEY` (Gateway 를 통한 요청에 사용하는 프로바이더 API 키)

Anthropic 모델에는 Anthropic API 키 를 사용하세요.

## 빠른 시작

1. 프로바이더 API 키 와 Gateway 세부 정보를 설정합니다:

```bash
openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
```

2. 기본 모델을 설정합니다:

```json5
{
  agents: {
    defaults: {
      model: { primary: "cloudflare-ai-gateway/claude-sonnet-4-5" },
    },
  },
}
```

## 비대화형 예시

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cloudflare-ai-gateway-api-key \
  --cloudflare-ai-gateway-account-id "your-account-id" \
  --cloudflare-ai-gateway-gateway-id "your-gateway-id" \
  --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY"
```

## 인증된 Gateway

Cloudflare 에서 Gateway authentication 을 활성화했다면, `cf-aig-authorization` 헤더를 추가하세요(이것은 프로바이더 API 키 외에 추가로 필요합니다).

```json5
{
  models: {
    providers: {
      "cloudflare-ai-gateway": {
        headers: {
          "cf-aig-authorization": "Bearer <cloudflare-ai-gateway-token>",
        },
      },
    },
  },
}
```

## 환경 메모

Gateway 가 daemon(launchd/systemd)으로 실행된다면, `CLOUDFLARE_AI_GATEWAY_API_KEY` 가 해당 프로세스에서 사용 가능해야 합니다(예: `~/.openclaw/.env` 또는 `env.shellEnv` 를 통해).
