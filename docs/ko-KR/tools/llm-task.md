---
summary: "워크플로용 JSON 전용 LLM 작업(선택적 플러그인 도구)"
description: "워크플로 안에서 JSON-only LLM step을 실행하고 schema-validated structured output을 받는 `llm-task` plugin tool을 설명합니다."
read_when:
  - "워크플로 안에 JSON-only LLM step을 두고 싶을 때"
  - "automation을 위해 schema-validated LLM output이 필요할 때"
title: "LLM Task"
x-i18n:
  source_path: "tools/llm-task.md"
---

# LLM 작업

`llm-task`는 JSON-only LLM task를 실행하고 structured output을 반환하는 **선택적 plugin tool**입니다. 선택적으로 JSON Schema validation도 수행할 수 있습니다.

이 도구는 Lobster 같은 workflow engines에 적합합니다. 각 workflow마다 custom OpenClaw code를 쓰지 않고도 single LLM step을 추가할 수 있습니다.

## Enable the plugin

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

2. tool을 allowlist에 추가합니다 (`optional: true`로 등록됨).

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

## Config (optional)

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

`allowedModels`는 `provider/model` 문자열의 allowlist입니다. 설정되어 있으면 목록 밖의 모든 요청은 거부됩니다.

## Tool parameters

- `prompt` (문자열, 필수)
- `input` (임의 값, 선택 사항)
- `schema` (객체, 선택 사항, JSON Schema)
- `provider` (문자열, 선택 사항)
- `model` (문자열, 선택 사항)
- `thinking` (문자열, 선택 사항)
- `authProfileId` (문자열, 선택 사항)
- `temperature` (숫자, 선택 사항)
- `maxTokens` (숫자, 선택 사항)
- `timeoutMs` (숫자, 선택 사항)

`thinking`은 `low`, `medium` 같은 표준 OpenClaw reasoning presets를 받습니다.

## Output

파싱된 JSON을 담은 `details.json`을 반환합니다. `schema`가 있으면 그에 대해 validation도 수행합니다.

## Example: Lobster workflow step

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{
  "prompt": "Given the input email, return intent and draft.",
  "thinking": "low",
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

## Safety notes

- 이 도구는 **JSON-only**이며, 모델에는 JSON만 출력하도록 지시합니다 (code fences, commentary 없음).
- 이 실행에서는 어떤 tools도 모델에 노출되지 않습니다.
- `schema`로 검증하기 전까지는 output을 untrusted로 취급하세요.
- side-effecting steps (send, post, exec) 앞에는 approvals를 두세요.
