---
summary: "모델 검색, 스캔 및 기본 모델, 폴백(Fallback), 인증 프로필 설정을 위한 `openclaw models` 명령어 레퍼런스"
description: "기본 model 확인, provider auth 점검, alias와 fallback 관리까지 `openclaw models` CLI의 핵심 작업을 정리합니다."
read_when:
  - 기본 사용 모델을 변경하거나 공급자별 인증 상태를 확인하고자 할 때
  - 사용 가능한 모델을 스캔하고 인증 프로필의 오류를 디버깅할 때
title: "models"
x-i18n:
  source_path: "cli/models.md"
---

# `openclaw models`

model discovery, scan, configuration(default model, fallback, auth profile)을 관리합니다.

Related:

- Providers + models: [Models](/providers/models)
- Provider auth setup: [Getting started](/start/getting-started)

## 주요 명령어

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status`는 해석된 default/fallback model과 auth overview를 보여줍니다.
provider usage snapshot이 있으면 OAuth/token 상태 섹션에 provider usage header도 포함됩니다.
`--probe`를 추가하면 configured된 각 provider profile에 대해 live auth probe를 실행합니다.
probe는 실제 요청이므로 token을 소모하거나 rate limit를 유발할 수 있습니다.
`--agent <id>`를 사용하면 특정 configured agent의 model/auth 상태를 확인합니다. 생략하면 `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`를 우선 사용하고, 없으면 configured된 default agent를 사용합니다.

Notes:

- `models set <model-or-alias>`는 `provider/model` 또는 alias를 받습니다.
- model ref는 첫 번째 `/`를 기준으로 parsing합니다. model ID 안에 `/`가 들어가는 경우(OpenRouter 스타일) provider prefix를 포함해야 합니다. 예: `openrouter/moonshotai/kimi-k2`
- provider를 생략하면 OpenClaw는 이를 alias 또는 default provider용 model로 처리합니다. (model ID에 `/`가 없을 때만 가능)
- `models status`의 auth 출력에는 secret masking 대신 `marker(<value>)`가 보일 수 있습니다. 이는 `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `qwen-oauth`, `ollama-local` 같은 non-secret placeholder용입니다.

### `models status`

Options:

- `--json`
- `--plain`
- `--check` (exit 1=expired/missing, 2=expiring)
- `--probe` (configured된 auth profile에 대해 live probe 실행)
- `--probe-provider <name>` (하나의 provider만 probe)
- `--probe-profile <id>` (repeat 또는 comma-separated profile id)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (configured agent id, `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`보다 우선)

## 별칭 및 폴백 관리

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## 인증 프로필 (Auth Profiles)

```bash
openclaw models auth add
openclaw models auth login --provider <id>
openclaw models auth setup-token
openclaw models auth paste-token
```

`models auth login`은 provider plugin의 auth flow(OAuth/API key)를 실행합니다.
설치된 provider는 `openclaw plugins list`에서 확인할 수 있습니다.

Notes:

- `setup-token`은 setup-token 값을 프롬프트로 입력받습니다. 값은 다른 기기에서 `claude setup-token`으로 생성할 수 있습니다.
- `paste-token`은 다른 곳이나 automation에서 생성한 token string을 직접 받습니다.
- Anthropic policy note: setup-token 지원은 기술적 호환성 목적입니다. Anthropic은 과거 Claude Code 외 환경에서 일부 subscription 사용을 차단한 적이 있으므로, 넓게 사용하기 전에 최신 약관을 확인하세요.
