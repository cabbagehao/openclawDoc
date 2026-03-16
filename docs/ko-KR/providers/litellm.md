---
summary: "통합 모델 접근과 비용 추적을 위해 LiteLLM Proxy를 거쳐 OpenClaw 실행하기"
description: "통합 모델 접근과 비용 추적을 위해 LiteLLM Proxy를 거쳐 OpenClaw 실행하기"
read_when:
  - LiteLLM 프록시를 통해 OpenClaw를 라우팅하고 싶을 때
  - LiteLLM을 통해 비용 추적, 로깅, 모델 라우팅이 필요할 때
x-i18n:
  source_path: "providers/litellm.md"
---

# LiteLLM

[LiteLLM](https://litellm.ai)은 100개가 넘는 모델 제공업체에 통합 API를 제공하는 오픈소스 LLM 게이트웨이입니다.
OpenClaw를 LiteLLM 뒤로 라우팅하면 중앙 집중식 비용 추적, 로깅, 그리고 OpenClaw 설정을 바꾸지 않고도
백엔드를 전환할 수 있는 유연성을 얻을 수 있습니다.

## 왜 OpenClaw에서 LiteLLM을 사용할까요?

- **비용 추적**: OpenClaw가 모든 모델에서 정확히 얼마를 쓰는지 확인
- **모델 라우팅**: 설정 변경 없이 Claude, GPT-4, Gemini, Bedrock 사이 전환
- **가상 키**: OpenClaw 전용으로 지출 한도가 있는 키 생성
- **로깅**: 디버깅용 전체 요청/응답 로그
- **폴백**: 기본 제공업체가 다운되면 자동 페일오버

## 빠른 시작

### 온보딩 사용

```bash
openclaw onboard --auth-choice litellm-api-key
```

### 수동 설정

1. LiteLLM Proxy를 시작합니다.

```bash
pip install 'litellm[proxy]'
litellm --model claude-opus-4-6
```

2. OpenClaw가 LiteLLM을 가리키도록 설정합니다.

```bash
export LITELLM_API_KEY="your-litellm-key"

openclaw
```

이제 OpenClaw는 LiteLLM을 통해 라우팅됩니다.

## 설정

### 환경 변수

```bash
export LITELLM_API_KEY="sk-litellm-key"
```

### 설정 파일

```json5
{
  models: {
    providers: {
      litellm: {
        baseUrl: "http://localhost:4000",
        apiKey: "${LITELLM_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "claude-opus-4-6",
            name: "Claude Opus 4.6",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 200000,
            maxTokens: 64000,
          },
          {
            id: "gpt-4o",
            name: "GPT-4o",
            reasoning: false,
            input: ["text", "image"],
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "litellm/claude-opus-4-6" },
    },
  },
}
```

## 가상 키

지출 한도를 적용한 OpenClaw 전용 키를 만드세요.

```bash
curl -X POST "http://localhost:4000/key/generate" \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "key_alias": "openclaw",
    "max_budget": 50.00,
    "budget_duration": "monthly"
  }'
```

생성된 키를 `LITELLM_API_KEY`로 사용하세요.

## 모델 라우팅

LiteLLM은 모델 요청을 서로 다른 백엔드로 라우팅할 수 있습니다. LiteLLM의 `config.yaml`에서 설정하세요.

```yaml
model_list:
  - model_name: claude-opus-4-6
    litellm_params:
      model: claude-opus-4-6
      api_key: os.environ/ANTHROPIC_API_KEY

  - model_name: gpt-4o
    litellm_params:
      model: gpt-4o
      api_key: os.environ/OPENAI_API_KEY
```

OpenClaw는 계속 `claude-opus-4-6`을 요청하고, 실제 라우팅은 LiteLLM이 처리합니다.

## 사용량 확인

LiteLLM의 대시보드나 API로 사용량을 확인하세요.

```bash
# Key info
curl "http://localhost:4000/key/info" \
  -H "Authorization: Bearer sk-litellm-key"

# Spend logs
curl "http://localhost:4000/spend/logs" \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY"
```

## 참고 사항

- LiteLLM은 기본적으로 `http://localhost:4000`에서 실행됩니다.
- OpenClaw는 OpenAI 호환 `/v1/chat/completions` 엔드포인트로 연결합니다.
- 모든 OpenClaw 기능은 LiteLLM을 통해서도 동작하며 제한 사항이 없습니다.

## 함께 보기

- [LiteLLM Docs](https://docs.litellm.ai)
- [Model Providers](/concepts/model-providers)
