---
summary: "OpenClaw에서 Kilo Gateway의 통합 API로 다양한 모델에 접근하기"
read_when:
  - 하나의 API 키로 여러 LLM을 쓰고 싶을 때
  - OpenClaw에서 Kilo Gateway를 통해 모델을 실행하고 싶을 때
x-i18n:
  source_path: "providers/kilocode.md"
---

# Kilo Gateway

Kilo Gateway는 단일 엔드포인트와 API 키 뒤에서 요청을 여러 모델로 라우팅하는
**통합 API**를 제공합니다. OpenAI 호환이므로 대부분의 OpenAI SDK는 base URL만 바꿔서
사용할 수 있습니다.

## Getting an API key

1. [app.kilo.ai](https://app.kilo.ai)로 이동합니다.
2. 로그인하거나 계정을 만듭니다.
3. API Keys로 이동해 새 키를 생성합니다.

## CLI setup

```bash
openclaw onboard --kilocode-api-key <key>
```

또는 환경 변수를 설정하세요.

```bash
export KILOCODE_API_KEY="<your-kilocode-api-key>" # pragma: allowlist secret
```

## Config snippet

```json5
{
  env: { KILOCODE_API_KEY: "<your-kilocode-api-key>" }, // pragma: allowlist secret
  agents: {
    defaults: {
      model: { primary: "kilocode/kilo/auto" },
    },
  },
}
```

## Default model

기본 모델은 `kilocode/kilo/auto`이며, 작업에 따라 가장 적합한 하위 모델을 자동 선택하는
스마트 라우팅 모델입니다.

* 기획, 디버깅, 오케스트레이션 작업은 Claude Opus로 라우팅
* 코드 작성과 탐색 작업은 Claude Sonnet으로 라우팅

## Available models

OpenClaw는 시작 시 Kilo Gateway에서 사용 가능한 모델을 동적으로 탐지합니다.
계정에서 쓸 수 있는 전체 모델 목록은 `/models kilocode`로 확인하세요.

Gateway에서 사용 가능한 모델은 모두 `kilocode/` 접두사로 사용할 수 있습니다.

```
kilocode/kilo/auto              (default - smart routing)
kilocode/anthropic/claude-sonnet-4
kilocode/openai/gpt-5.2
kilocode/google/gemini-3-pro-preview
...and many more
```

## Notes

* 모델 ref는 `kilocode/<model-id>` 형식입니다(예: `kilocode/anthropic/claude-sonnet-4`).
* 기본 모델: `kilocode/kilo/auto`
* Base URL: `https://api.kilo.ai/api/gateway/`
* 더 많은 모델/제공업체 옵션은 [/concepts/model-providers](/concepts/model-providers)를 참고하세요.
* Kilo Gateway는 내부적으로 API 키와 함께 Bearer 토큰을 사용합니다.
