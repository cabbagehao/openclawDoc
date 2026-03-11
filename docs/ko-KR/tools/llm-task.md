---
summary: "워크플로용 JSON 전용 LLM 작업(선택적 플러그인 도구)"
read_when:
  - 워크플로 내부에 JSON 전용 LLM 단계를 두고 싶을 때
  - 자동화를 위해 스키마로 검증된 LLM 출력이 필요할 때
title: "LLM 작업"
---

# LLM 작업

`llm-task`는 JSON 전용 LLM 작업을 실행하고 구조화된 출력을 반환하는
**선택적 플러그인 도구**입니다(선택적으로 JSON Schema로 검증 가능).

이 도구는 Lobster 같은 워크플로 엔진에 적합합니다. 각 워크플로마다
커스텀 OpenClaw 코드를 작성하지 않고도 단일 LLM 단계를 추가할 수 있습니다.

## 플러그인 활성화

1. 플러그인을 활성화합니다:

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  }
}
```

2. 도구를 허용 목록에 추가합니다(`optional: true`로 등록됨):

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": { "allow": ["llm-task"] }
      }
    ]
  }
}
```

## 구성(선택 사항)

```json
{
  "plugins": {
    "entries": {
      "llm-task": {
        "enabled": true,
        "config": {
          "defaultProvider": "openai-codex",
          "defaultModel": "gpt-5.4",
          "defaultAuthProfileId": "main",
          "allowedModels": ["openai-codex/gpt-5.4"],
          "maxTokens": 800,
          "timeoutMs": 30000
        }
      }
    }
  }
}
```

`allowedModels`는 `provider/model` 문자열의 허용 목록입니다. 설정되어 있으면
목록 밖의 모든 요청은 거부됩니다.

## 도구 매개변수

- `prompt` (문자열, 필수)
- `input` (임의 값, 선택 사항)
- `schema` (객체, 선택 사항, JSON Schema)
- `provider` (문자열, 선택 사항)
- `model` (문자열, 선택 사항)
- `authProfileId` (문자열, 선택 사항)
- `temperature` (숫자, 선택 사항)
- `maxTokens` (숫자, 선택 사항)
- `timeoutMs` (숫자, 선택 사항)

## 출력

파싱된 JSON을 담은 `details.json`을 반환합니다(`schema`가 제공되면 이에 대해
검증도 수행합니다).

## 예시: Lobster 워크플로 단계

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{
  "prompt": "Given the input email, return intent and draft.",
  "input": {
    "subject": "Hello",
    "body": "Can you help?"
  },
  "schema": {
    "type": "object",
    "properties": {
      "intent": { "type": "string" },
      "draft": { "type": "string" }
    },
    "required": ["intent", "draft"],
    "additionalProperties": false
  }
}'
```

## 안전 참고 사항

- 이 도구는 **JSON 전용**이며, 모델에는 JSON만 출력하도록 지시합니다(코드 펜스,
  설명문 없음).
- 이 실행에서는 어떤 도구도 모델에 노출되지 않습니다.
- `schema`로 검증하기 전까지는 출력을 신뢰할 수 없는 것으로 취급하세요.
- 부작용이 있는 단계(send, post, exec) 앞에는 반드시 승인 절차를 두세요.
