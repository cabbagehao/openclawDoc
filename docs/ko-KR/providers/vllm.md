---
summary: "vLLM(OpenAI 호환 로컬 서버)으로 OpenClaw 실행하기"
description: "vLLM(OpenAI 호환 로컬 서버)으로 OpenClaw 실행하기"
read_when:
  - 로컬 vLLM 서버에 OpenClaw 를 연결하고 싶을 때
  - 자체 모델로 OpenAI 호환 `/v1` 엔드포인트를 사용하고 싶을 때
title: "vLLM"
---

# vLLM

vLLM 은 **OpenAI 호환** HTTP API 를 통해 오픈소스(및 일부 커스텀) 모델을 서비스할 수 있습니다. OpenClaw 는 `openai-completions` API 를 통해 vLLM 에 연결할 수 있습니다.

또한 `VLLM_API_KEY` 로 opt-in 하고 명시적 `models.providers.vllm` 항목을 정의하지 않으면, OpenClaw 는 vLLM 의 사용 가능한 모델을 **자동 발견** 할 수도 있습니다(서버가 auth 를 강제하지 않는다면 어떤 값이든 동작).

## 빠른 시작

1. OpenAI 호환 서버로 vLLM 을 시작합니다.

base URL 은 `/v1` 엔드포인트(예: `/v1/models`, `/v1/chat/completions`)를 노출해야 합니다. vLLM 은 흔히 다음에서 실행됩니다:

- `http://127.0.0.1:8000/v1`

2. Opt in 합니다(auth 가 없으면 어떤 값이든 가능):

```bash
export VLLM_API_KEY="vllm-local"
```

3. 모델을 선택합니다(vLLM 모델 ID 중 하나로 교체):

```json5
{
  agents: {
    defaults: {
      model: { primary: "vllm/your-model-id" },
    },
  },
}
```

## Model discovery (암묵적 프로바이더)

`VLLM_API_KEY` 가 설정되어 있거나(auth profile 이 존재) **그리고** `models.providers.vllm` 을 정의하지 않으면, OpenClaw 는 다음을 질의합니다:

- `GET http://127.0.0.1:8000/v1/models`

그리고 반환된 ID 를 모델 항목으로 변환합니다.

`models.providers.vllm` 을 명시적으로 설정하면 auto-discovery 는 건너뛰며, 모델을 수동 정의해야 합니다.

## Explicit configuration (수동 모델)

다음과 같은 경우 explicit config 를 사용하세요:

- vLLM 이 다른 host/port 에서 실행될 때
- `contextWindow`/`maxTokens` 값을 고정하고 싶을 때
- 서버에 실제 API 키 가 필요하거나 header 를 직접 제어하고 싶을 때

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "your-model-id",
            name: "Local vLLM Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## 문제 해결

- 서버 접근 가능 여부 확인:

```bash
curl http://127.0.0.1:8000/v1/models
```

- 요청이 auth 오류로 실패하면, 서버 설정과 맞는 실제 `VLLM_API_KEY` 를 설정하거나 `models.providers.vllm` 아래에 프로바이더 를 명시적으로 구성하세요.
