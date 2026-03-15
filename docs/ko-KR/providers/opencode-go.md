---
summary: "OpenClaw에서 OpenCode Go 카탈로그 사용하기"
read_when:
  - OpenCode Go 카탈로그를 쓰고 싶을 때
  - Go 호스팅 모델용 runtime model ref를 확인해야 할 때
title: "OpenCode Go"
x-i18n:
  source_path: "providers/opencode-go.md"
---

# OpenCode Go

OpenCode Go는 [OpenCode](/providers/opencode) 안에 포함된 Go 카탈로그입니다.
Zen 카탈로그와 같은 `OPENCODE_API_KEY`를 사용하지만, upstream의 모델별 라우팅이 정확히 유지되도록 runtime provider id는 `opencode-go`를 그대로 씁니다.

## 지원 모델

- `opencode-go/kimi-k2.5`
- `opencode-go/glm-5`
- `opencode-go/minimax-m2.5`

## CLI setup

```bash
openclaw onboard --auth-choice opencode-go
# or non-interactive
openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
```

## Config snippet

```json5
{
  env: { OPENCODE_API_KEY: "YOUR_API_KEY_HERE" }, // pragma: allowlist secret
  agents: { defaults: { model: { primary: "opencode-go/kimi-k2.5" } } },
}
```

## Routing behavior

model ref가 `opencode-go/...` 형태이면 OpenClaw가 모델별 라우팅을 자동으로 처리합니다.

## Notes

- 공용 온보딩 절차와 카탈로그 개요는 [OpenCode](/providers/opencode)를 참고하세요.
- runtime ref는 명시적으로 유지됩니다. Zen은 `opencode/...`, Go는 `opencode-go/...`를 사용합니다.
