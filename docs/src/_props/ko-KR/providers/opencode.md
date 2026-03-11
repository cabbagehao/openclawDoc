---
summary: "OpenClaw에서 OpenCode Zen(엄선된 모델) 사용하기"
read_when:
  - 모델 액세스를 위해 OpenCode Zen을 사용하고 싶을 때
  - 코딩 친화적인 모델의 엄선된 목록이 필요할 때
title: "OpenCode Zen"
x-i18n:
  source_path: "providers/opencode.md"
---

# OpenCode Zen

OpenCode Zen은 OpenCode 팀이 코딩 에이전트용으로 추천하는 **엄선된 모델 목록**입니다.
API 키와 `opencode` 제공업체를 사용하는 선택형 호스팅 모델 액세스 경로입니다.
Zen은 현재 베타입니다.

## CLI setup

```bash
openclaw onboard --auth-choice opencode-zen
# or non-interactive
openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
```

## Config snippet

```json5
{
  env: { OPENCODE_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

## Notes

* `OPENCODE_ZEN_API_KEY`도 지원됩니다.
* Zen에 로그인하고 결제 정보를 추가한 뒤 API 키를 복사하면 됩니다.
* OpenCode Zen은 요청당 과금되며, 자세한 내용은 OpenCode 대시보드에서 확인하세요.
