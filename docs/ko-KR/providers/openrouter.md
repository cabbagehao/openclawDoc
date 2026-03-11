---
summary: "OpenClaw에서 OpenRouter의 통합 API로 다양한 모델에 접근하기"
read_when:
  - 하나의 API 키로 여러 LLM을 쓰고 싶을 때
  - OpenClaw에서 OpenRouter를 통해 모델을 실행하고 싶을 때
title: "OpenRouter"
x-i18n:
  source_path: "providers/openrouter.md"
---

# OpenRouter

OpenRouter는 단일 엔드포인트와 API 키 뒤에서 요청을 여러 모델로 라우팅하는
**통합 API**를 제공합니다. OpenAI 호환이므로 대부분의 OpenAI SDK는 base URL만 바꿔서
사용할 수 있습니다.

## CLI setup

```bash
openclaw onboard --auth-choice apiKey --token-provider openrouter --token "$OPENROUTER_API_KEY"
```

## Config snippet

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/anthropic/claude-sonnet-4-5" },
    },
  },
}
```

## Notes

- 모델 ref는 `openrouter/<provider>/<model>` 형식입니다.
- 더 많은 모델/제공업체 옵션은 [/concepts/model-providers](/concepts/model-providers)를 참고하세요.
- OpenRouter는 내부적으로 API 키와 함께 Bearer 토큰을 사용합니다.
