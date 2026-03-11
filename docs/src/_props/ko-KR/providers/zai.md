---
summary: "OpenClaw 에서 Z.AI (GLM 모델) 사용하기"
read_when:
  - OpenClaw 에서 Z.AI / GLM 모델을 사용하고 싶을 때
  - 간단한 ZAI_API_KEY 설정이 필요할 때
title: "Z.AI"
---

# Z.AI

Z.AI 는 **GLM** 모델용 API 플랫폼입니다. GLM 용 REST API 를 제공하며 인증에는 API key 를 사용합니다. Z.AI 콘솔에서 API key 를 생성하세요. OpenClaw 는 Z.AI API key 와 함께 `zai` provider 를 사용합니다.

## CLI 설정

```bash
openclaw onboard --auth-choice zai-api-key
# 또는 non-interactive
openclaw onboard --zai-api-key "$ZAI_API_KEY"
```

## Config snippet

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "zai/glm-5" } } },
}
```

## 메모

* GLM 모델은 `zai/<model>` 형식으로 사용할 수 있습니다(예: `zai/glm-5`).
* Z.AI 의 tool-call streaming 을 위해 `tool_stream` 이 기본 활성화됩니다. 비활성화하려면 `agents.defaults.models["zai/<model>"].params.tool_stream` 을 `false` 로 설정하세요.
* 모델 계열 개요는 [/providers/glm](/providers/glm) 을 참고하세요.
* Z.AI 는 API key 와 함께 Bearer auth 를 사용합니다.
