---
summary: "OpenClaw 에서 Xiaomi MiMo (mimo-v2-flash) 사용하기"
read_when:
  - OpenClaw 에서 Xiaomi MiMo 모델을 사용하고 싶을 때
  - XIAOMI_API_KEY 설정이 필요할 때
title: "Xiaomi MiMo"
---

# Xiaomi MiMo

Xiaomi MiMo 는 **MiMo** 모델용 API 플랫폼입니다. OpenAI 및 Anthropic 형식과 호환되는 REST API 를 제공하며 API key 인증을 사용합니다. [Xiaomi MiMo console](https://platform.xiaomimimo.com/#/console/api-keys) 에서 API key 를 생성하세요. OpenClaw 는 Xiaomi MiMo API key 와 함께 `xiaomi` provider 를 사용합니다.

## 모델 개요

* **mimo-v2-flash**: 262144-token context window, Anthropic Messages API 호환
* Base URL: `https://api.xiaomimimo.com/anthropic`
* Authorization: `Bearer $XIAOMI_API_KEY`

## CLI 설정

```bash
openclaw onboard --auth-choice xiaomi-api-key
# 또는 non-interactive
openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
```

## Config snippet

```json5
{
  env: { XIAOMI_API_KEY: "your-key" },
  agents: { defaults: { model: { primary: "xiaomi/mimo-v2-flash" } } },
  models: {
    mode: "merge",
    providers: {
      xiaomi: {
        baseUrl: "https://api.xiaomimimo.com/anthropic",
        api: "anthropic-messages",
        apiKey: "XIAOMI_API_KEY",
        models: [
          {
            id: "mimo-v2-flash",
            name: "Xiaomi MiMo V2 Flash",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## 메모

* Model ref: `xiaomi/mimo-v2-flash`
* `XIAOMI_API_KEY` 가 설정되면(또는 auth profile 이 있으면) provider 가 자동 주입됩니다.
* provider 규칙은 [/concepts/model-providers](/concepts/model-providers) 를 참고하세요.
