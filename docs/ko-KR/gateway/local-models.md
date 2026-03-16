---
description: LM Studio, vLLM, LiteLLM 등 OpenAI 호환 로컬 모델 서버를 OpenClaw Gateway에 연결하는 방법
summary: "로컬 LLM(LM Studio, vLLM, LiteLLM, 커스텀 OpenAI 엔드포인트) 연동 및 운영 가이드"
read_when:
  - 자체 GPU 인프라를 활용하여 모델을 서빙하고자 할 때
  - LM Studio 또는 OpenAI 호환 프록시(Proxy)를 연결할 때
  - 로컬 모델 운영 시 보안 및 성능 관련 지침이 필요할 때
title: "Local Models"
x-i18n:
  source_path: "gateway/local-models.md"
---

# Local Models

로컬 모델도 가능하지만, OpenClaw는 큰 context와 강한 prompt injection 방어를 전제로 설계되어 있습니다. 사양이 낮은 GPU에서는 context가 잘리거나 안전성이 약해질 수 있으므로, **풀옵션 Mac Studio 2대 이상 또는 이에 준하는 GPU 리그(약 3만 달러 이상)**를 권장합니다. 단일 **24GB** GPU는 더 가벼운 prompt와 더 높은 지연 시간을 감수할 수 있을 때만 실용적입니다. 가능하면 **가장 크고 완전한 모델 변형**을 사용하세요. 과도하게 양자화된 "small" 계열 checkpoint는 prompt injection 위험을 키웁니다([Security](/gateway/security) 참고).

가장 마찰이 적은 로컬 구성이 필요하다면 [Ollama](/providers/ollama)와 `openclaw onboard`부터 시작하세요. 이 페이지는 더 고급 로컬 스택과 custom OpenAI-compatible local server를 위한 가이드입니다.

## 권장 조합: LM Studio + MiniMax M2.5 (Responses API)

현재 기준으로 가장 추천하는 로컬 스택입니다. LM Studio에서 MiniMax M2.5를 로드하고 로컬 서버(기본값 `http://127.0.0.1:1234`)를 활성화한 뒤, Responses API를 사용해 reasoning과 최종 텍스트를 분리하세요.

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

**설치 및 확인 사항:**
- LM Studio 설치: [https://lmstudio.ai](https://lmstudio.ai)
- LM Studio 내에서 **가장 큰 규모의 MiniMax M2.5 빌드**를 다운로드함 (작은 변형이나 과도하게 양자화된 버전은 지양함). 서버 시작 후 `http://127.0.0.1:1234/v1/models` 경로에서 모델 목록이 정상적으로 표시되는지 확인함.
- 모델은 항상 메모리에 로드된 상태(Keep-loaded)를 유지함. 콜드 로드(Cold-load)는 실행 시 상당한 지연을 초래함.
- 사용 중인 LM Studio 빌드 사양에 따라 `contextWindow` 및 `maxTokens` 값을 조정함.
- WhatsApp 채널 사용 시, 최종 텍스트만 전송되도록 반드시 Responses API 방식을 유지함.

로컬 모델을 사용하더라도 hosted model 설정은 유지하고 `models.mode: "merge"`를 사용해 fallback을 남겨 두는 편이 좋습니다.

### 하이브리드 구성: 클라우드 주 모델, 로컬 폴백

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

### 로컬 우선 및 클라우드 안전망 구성

주 모델(Primary)과 폴백(Fallback) 순서를 맞바꾸어 설정함. 공급자 블록과 `models.mode: "merge"` 설정은 그대로 유지하여 로컬 서버 장애 시 Sonnet이나 Opus 모델이 자동으로 대체하도록 구성함.

### 지역 호스팅 및 데이터 라우팅 전략

- **OpenRouter 리전 고정**: MiniMax, Kimi, GLM 등 호스팅 모델을 OpenRouter의 리전 고정 엔드포인트(예: US-hosted)를 통해 사용할 수 있음. 특정 관할권 내에 데이터를 머물게 하면서도 Anthropic이나 OpenAI 모델을 폴백으로 병행 사용 가능함.
- **개인정보 보호**: 로컬 전용 구동이 가장 강력한 개인정보 보호 수단임. 호스팅 모델의 리전 라우팅은 공급자 기능을 활용하면서 데이터 흐름을 어느 정도 통제하고자 할 때 선택할 수 있는 중간 지점임.

## 기타 OpenAI 호환 로컬 프록시

vLLM, LiteLLM, OAI-proxy 또는 커스텀 게이트웨이가 OpenAI 규격의 `/v1` 엔드포인트를 제공한다면 모두 연동 가능함. 위 설정 예시의 공급자 블록을 해당 엔드포인트와 모델 ID로 수정하여 적용함.

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

## 문제 해결 (Troubleshooting)

- **프록시 접속 확인**: `curl http://127.0.0.1:1234/v1/models` 명령으로 Gateway가 프록시 서버에 정상적으로 도달하는지 점검함.
- **모델 로드 상태**: 모델이 언로드(Unload)되었는지 확인함. 콜드 스타트 상황은 서버가 "멈춘 것"처럼 보이는 가장 흔한 원인임.
- **컨텍스트 오류**: `contextWindow` 값을 낮추거나 서버 측의 제한 한도를 높여 대응함.
- **보안 주의**: 로컬 모델은 공급자 측의 필터링 거치지 않으므로, 프롬프트 인젝션 피해를 최소화하기 위해 에이전트의 작업 범위를 좁게 설정하고 압축(Compaction) 기능을 활성화할 것을 권장함.
