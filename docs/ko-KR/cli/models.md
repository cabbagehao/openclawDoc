---
summary: "`openclaw models`를 위한 CLI 참조 (status/list/set/scan, aliases, fallbacks, auth)"
read_when:
  - 기본 모델을 변경하거나 provider auth 상태를 확인하려고 할 때
  - 사용 가능한 모델/provider를 스캔하고 auth 프로필을 디버그하려고 할 때
title: "models"
---

# `openclaw models`

모델 검색, 스캔, 구성(기본 모델, 폴백, auth 프로필).

관련 항목:

- Provider + 모델: [Models](/providers/models)
- Provider auth 설정: [Getting started](/start/getting-started)

## Common commands

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status`는 해석된 기본값/폴백과 auth 개요를 보여줍니다.
provider 사용량 스냅샷을 사용할 수 있는 경우, OAuth/token 상태 섹션에는
provider 사용량 헤더가 포함됩니다.
`--probe`를 추가하면 구성된 각 provider 프로필에 대해 실제 auth 프로브를 실행합니다.
프로브는 실제 요청이므로(토큰을 소모하거나 rate limit를 유발할 수 있습니다).
구성된 agent의 모델/auth 상태를 확인하려면 `--agent <id>`를 사용하세요. 생략하면
이 명령은 `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`이 설정된 경우 이를 사용하고, 그렇지 않으면
구성된 기본 agent를 사용합니다.

참고:

- `models set <model-or-alias>`는 `provider/model` 또는 alias를 받습니다.
- 모델 ref는 **첫 번째** `/`를 기준으로 분리하여 파싱됩니다. 모델 ID에 `/`가 포함되어 있으면(OpenRouter 스타일) provider 접두사를 포함하세요(예: `openrouter/moonshotai/kimi-k2`).
- provider를 생략하면 OpenClaw는 입력값을 alias 또는 **기본 provider**의 모델로 처리합니다(모델 ID에 `/`가 없을 때만 작동).
- `models status`는 비밀이 아닌 placeholder(예: `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `qwen-oauth`, `ollama-local`)에 대해 auth 출력에서 이를 secret처럼 마스킹하는 대신 `marker(<value>)`를 표시할 수 있습니다.

### `models status`

옵션:

- `--json`
- `--plain`
- `--check` (exit 1=만료/누락, 2=곧 만료)
- `--probe` (구성된 auth 프로필에 대한 실시간 프로브)
- `--probe-provider <name>` (하나의 provider 프로브)
- `--probe-profile <id>` (반복 가능 또는 쉼표로 구분된 프로필 id)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (구성된 agent id, `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`보다 우선)

## Aliases + fallbacks

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## Auth profiles

```bash
openclaw models auth add
openclaw models auth login --provider <id>
openclaw models auth setup-token
openclaw models auth paste-token
```

`models auth login`은 provider 플러그인의 auth 흐름(OAuth/API key)을 실행합니다.
어떤 provider가 설치되어 있는지 확인하려면 `openclaw plugins list`를 사용하세요.

참고:

- `setup-token`은 설정 토큰 값을 입력하라는 프롬프트를 표시합니다(아무 머신에서나 `claude setup-token`으로 생성할 수 있습니다).
- `paste-token`은 다른 곳이나 자동화에서 생성된 토큰 문자열을 받습니다.
- Anthropic 정책 참고: setup-token 지원은 기술적 호환성입니다. Anthropic은 과거 Claude Code 외부에서 일부 구독 사용을 차단한 적이 있으므로, 널리 사용하기 전에 현재 약관을 확인하세요.
