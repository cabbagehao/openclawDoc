---
summary: "로컬 LLM(LM Studio, vLLM, LiteLLM, custom OpenAI endpoint)으로 OpenClaw 실행"
read_when:
  - 자체 GPU 장비에서 모델을 제공하고 싶을 때
  - LM Studio 또는 OpenAI 호환 프록시를 연결할 때
  - 가장 안전한 로컬 모델 운영 지침이 필요할 때
title: "Local Models"
---

# Local models

로컬 구동은 가능하지만, OpenClaw는 큰 컨텍스트와 강한 프롬프트 인젝션 방어를 전제로 합니다. 작은 카드로는 컨텍스트가 잘리고 안전성도 약해집니다. 목표는 높게 잡아야 합니다. **풀옵션 Mac Studio 2대 이상 또는 동급 GPU 장비(약 3만 달러 이상)**를 권장합니다. 단일 **24 GB** GPU는 더 가벼운 프롬프트에서 높은 지연 시간을 감수하는 경우에만 실용적입니다. 실행 가능한 범위 안에서 **가장 크고 완전한 모델 변형**을 사용하세요. 과도하게 양자화된 모델이나 “small” 체크포인트는 프롬프트 인젝션 위험을 키웁니다. 자세한 내용은 [Security](/gateway/security)를 참고하세요.

## Recommended: LM Studio + MiniMax M2.5 (Responses API, full-size)

현재 기준으로 가장 좋은 로컬 스택입니다. LM Studio에 MiniMax M2.5를 로드하고 로컬 서버(기본값 `http://127.0.0.1:1234`)를 켠 뒤, Responses API를 사용해 reasoning을 최종 텍스트와 분리하세요.

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/minimax-m2.5-gs32" },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "lmstudio/minimax-m2.5-gs32": { alias: "Minimax" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "minimax-m2.5-gs32",
            name: "MiniMax M2.5 GS32",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

**Setup checklist**

- LM Studio 설치: [https://lmstudio.ai](https://lmstudio.ai)
- LM Studio에서 **가장 큰 MiniMax M2.5 빌드**를 다운로드합니다. “small” 또는 과도하게 양자화된 변형은 피하세요. 서버를 시작한 뒤 `http://127.0.0.1:1234/v1/models`에 모델이 표시되는지 확인합니다.
- 모델을 계속 로드된 상태로 유지하세요. cold-load는 시작 지연을 유발합니다.
- LM Studio 빌드가 다르면 `contextWindow`와 `maxTokens`를 조정하세요.
- WhatsApp에서는 최종 텍스트만 전송되도록 Responses API를 유지하세요.

로컬 실행 중에도 hosted model은 함께 설정해 두세요. `models.mode: "merge"`를 쓰면 fallback을 계속 사용할 수 있습니다.

### Hybrid config: hosted primary, local fallback

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-sonnet-4-5",
        fallbacks: ["lmstudio/minimax-m2.5-gs32", "anthropic/claude-opus-4-6"],
      },
      models: {
        "anthropic/claude-sonnet-4-5": { alias: "Sonnet" },
        "lmstudio/minimax-m2.5-gs32": { alias: "MiniMax Local" },
        "anthropic/claude-opus-4-6": { alias: "Opus" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "minimax-m2.5-gs32",
            name: "MiniMax M2.5 GS32",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

### Local-first with hosted safety net

primary와 fallback 순서를 바꾸면 됩니다. provider block과 `models.mode: "merge"`는 그대로 두고, 로컬 장비가 내려갔을 때 Sonnet이나 Opus로 fallback 하도록 유지하세요.

### Regional hosting / data routing

- Hosted MiniMax/Kimi/GLM 변형은 OpenRouter에도 있으며 region-pinned endpoint(예: US-hosted)를 제공합니다. 선택한 관할권 안에 트래픽을 머물게 하려면 해당 regional variant를 고르세요. 동시에 Anthropic/OpenAI fallback을 위해 `models.mode: "merge"`를 유지할 수 있습니다.
- 개인정보 보호 면에서는 로컬 전용이 가장 강하고, hosted regional routing은 provider 기능이 필요하지만 데이터 흐름도 통제하고 싶을 때의 중간 지점입니다.

## Other OpenAI-compatible local proxies

OpenAI 스타일 `/v1` 엔드포인트를 노출한다면 vLLM, LiteLLM, OAI-proxy, 커스텀 gateway도 사용할 수 있습니다. 위 provider block을 해당 endpoint와 model ID로 바꾸면 됩니다.

```json5
{
  models: {
    mode: "merge",
    providers: {
      local: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "sk-local",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 120000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

hosted model을 fallback으로 쓸 수 있게 `models.mode: "merge"`는 유지하세요.

## Troubleshooting

- Gateway가 프록시에 접근 가능한가요? `curl http://127.0.0.1:1234/v1/models`
- LM Studio 모델이 언로드되었나요? 다시 로드하세요. cold start는 “멈춘 것처럼 보이는” 가장 흔한 원인입니다.
- 컨텍스트 오류가 나나요? `contextWindow`를 낮추거나 서버 한도를 올리세요.
- 안전성: 로컬 모델은 provider 측 필터를 우회하므로, 프롬프트 인젝션 영향 범위를 줄이기 위해 agent 범위를 좁히고 compaction을 켜두세요.
