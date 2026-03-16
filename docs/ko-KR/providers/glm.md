---
summary: "OpenClaw에서 GLM 모델 제품군 개요 + 사용 방법"
description: "OpenClaw에서 Z.AI provider를 통해 GLM 모델 제품군을 선택하고 기본 모델로 설정하는 방법을 간단히 안내합니다."
read_when:
  - OpenClaw에서 GLM 모델을 사용하고 싶을 때
  - 모델 이름 규칙과 설정 방법이 필요할 때
title: "GLM Models"
---

# GLM 모델

GLM은 Z.AI 플랫폼을 통해 사용할 수 있는 **모델 제품군**입니다(회사가 아닙니다). OpenClaw에서 GLM
모델은 `zai` 프로바이더와 `zai/glm-5` 같은 모델 ID를 통해 접근합니다.

## CLI 설정

```bash
openclaw onboard --auth-choice zai-api-key
```

## 설정 예시

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "zai/glm-5" } } },
}
```

## 참고 사항

- GLM 버전과 제공 여부는 바뀔 수 있으므로, 최신 정보는 Z.AI 문서를 확인하세요.
- 예시 모델 ID에는 `glm-5`, `glm-4.7`, `glm-4.6`이 있습니다.
- 프로바이더 상세 내용은 [/providers/zai](/providers/zai)를 참고하세요.
