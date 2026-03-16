---
summary: "Models CLI: list, set, aliases, fallbacks, scan, status"
description: "OpenClaw Models CLI의 선택 규칙, allowlist, scan, aliases, fallbacks, status 확인 방법을 정리합니다."
read_when:
  - models CLI (`models list/set/scan/aliases/fallbacks`)를 수정해야 할 때
  - model fallback 동작이나 selection UX를 바꿔야 할 때
  - model scan probe의 tool/image 지원 로직을 다뤄야 할 때
title: "Models CLI"
x-i18n:
  source_path: "concepts/models.md"
---

# Models CLI

auth profile rotation, cooldown, 그리고 이것이 fallback과 어떻게 상호작용하는지는
[/concepts/model-failover](/concepts/model-failover)를 참고하세요.
provider 개요와 예시는 [/concepts/model-providers](/concepts/model-providers)에
정리되어 있습니다.

## How model selection works

OpenClaw는 model을 아래 순서로 선택합니다.

1. **Primary** model
   (`agents.defaults.model.primary` 또는 `agents.defaults.model`)
2. `agents.defaults.model.fallbacks`에 정의된 순서의 **fallback**
3. 다음 model로 넘어가기 전, 같은 provider 안에서의 **provider auth failover**

관련 설정:

- `agents.defaults.models`는 OpenClaw가 사용할 수 있는 model allowlist/catalog이며,
  alias도 함께 정의합니다
- `agents.defaults.imageModel`은 primary model이 image를 받을 수 없을 때에만
  사용됩니다
- agent별 기본값은 `agents.list[].model`과 binding을 통해
  `agents.defaults.model`을 override할 수 있습니다
  ([/concepts/multi-agent](/concepts/multi-agent) 참고)

## Quick model policy

- primary는 사용할 수 있는 최신 세대의 가장 강력한 model로 두는 편이 좋습니다
- fallback은 비용이나 latency가 중요한 작업, 중요도가 낮은 chat에 활용하세요
- tool-enabled agent나 untrusted input을 다룰 때는 오래되거나 약한 model tier를
  피하세요

## Setup wizard (recommended)

config를 직접 편집하고 싶지 않다면 onboarding wizard를 실행하세요.

```bash
openclaw onboard
```

이 wizard는 common provider의 model + auth 설정을 도와주며, **OpenAI Code (Codex)
subscription**(OAuth)과 **Anthropic**(API key 또는 `claude setup-token`)도 포함합니다.

## Config keys (overview)

- `agents.defaults.model.primary`와 `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary`와 `agents.defaults.imageModel.fallbacks`
- `agents.defaults.models` (allowlist + alias + provider param)
- `models.providers` (`models.json`에 기록되는 custom provider)

model ref는 lowercase로 normalize됩니다. `z.ai/*` 같은 provider alias는 `zai/*`로
정규화됩니다.

provider 설정 예시는 OpenCode를 포함해
[/gateway/configuration](/gateway/configuration#opencode)에 있습니다.

## "Model is not allowed" (and why replies stop)

`agents.defaults.models`가 설정돼 있으면 `/model`과 session override에서의
**allowlist**가 됩니다. 사용자가 그 allowlist에 없는 model을 선택하면 OpenClaw는
다음 메시지를 반환합니다.

```text
Model "provider/model" is not allowed. Use /model to list available models.
```

이 검사는 일반 reply가 생성되기 **전**에 이뤄지므로, 사용자 입장에서는 응답이
끊긴 것처럼 보일 수 있습니다. 해결 방법은 다음과 같습니다.

- 해당 model을 `agents.defaults.models`에 추가
- `agents.defaults.models`를 제거해서 allowlist를 비움
- `/model list`에서 허용된 model을 선택

예시:

```json5
{
  agent: {
    model: { primary: "anthropic/claude-sonnet-4-5" },
    models: {
      "anthropic/claude-sonnet-4-5": { alias: "Sonnet" },
      "anthropic/claude-opus-4-6": { alias: "Opus" },
    },
  },
}
```

## Switching models in chat (`/model`)

gateway를 재시작하지 않고도 현재 session의 model을 바꿀 수 있습니다.

```text
/model
/model list
/model 3
/model openai/gpt-5.2
/model status
```

참고:

- `/model`과 `/model list`는 compact numbered picker를 보여주며, model family와
  available provider를 함께 표시합니다
- Discord에서는 `/model`과 `/models`가 provider/model dropdown과 Submit 단계가 있는
  interactive picker를 엽니다
- `/model <#>`는 picker에 있는 번호를 선택합니다
- `/model status`는 auth candidate와, 설정된 경우 provider endpoint의 `baseUrl`,
  `api` mode까지 보여주는 detailed view입니다
- model ref는 **첫 번째** `/`를 기준으로 분리됩니다. 직접 입력할 때는
  `provider/model` 형식을 사용하세요
- model ID 자체에 `/`가 포함되어 있으면(OpenRouter 스타일) provider prefix를
  반드시 포함해야 합니다
  (예: `/model openrouter/moonshotai/kimi-k2`)
- provider를 생략하면 OpenClaw는 이를 alias 또는 **default provider**의 model로
  처리합니다. 단, model ID 안에 `/`가 없어야 합니다

전체 command 동작과 config는 [Slash commands](/tools/slash-commands)를 보세요.

## CLI commands

```bash
openclaw models list
openclaw models status
openclaw models set <provider/model>
openclaw models set-image <provider/model>

openclaw models aliases list
openclaw models aliases add <alias> <provider/model>
openclaw models aliases remove <alias>

openclaw models fallbacks list
openclaw models fallbacks add <provider/model>
openclaw models fallbacks remove <provider/model>
openclaw models fallbacks clear

openclaw models image-fallbacks list
openclaw models image-fallbacks add <provider/model>
openclaw models image-fallbacks remove <provider/model>
openclaw models image-fallbacks clear
```

`openclaw models`만 실행하면 `models status`의 shortcut으로 동작합니다.

### `models list`

기본적으로 configured model만 보여줍니다. 유용한 flag:

- `--all`: 전체 catalog
- `--local`: local provider만
- `--provider <name>`: 특정 provider filter
- `--plain`: model당 한 줄
- `--json`: machine-readable output

### `models status`

resolved primary model, fallback, image model, 그리고 configured provider의 auth
overview를 표시합니다. auth store에서 찾은 profile의 OAuth expiry 상태도 보여주며,
기본적으로 24시간 이내 만료 예정이면 경고합니다. `--plain`은 resolved primary model만
출력합니다.
OAuth status는 항상 보이며 `--json`에도 포함됩니다. configured provider에 credential이
없으면 `models status`는 **Missing auth** section을 출력합니다.
JSON에는 `auth.oauth`(warn window + profile)와
`auth.providers`(provider별 effective auth)가 포함됩니다.
자동화에서는 `--check`를 사용하세요.
missing/expired는 exit `1`, expiring은 exit `2`입니다.

auth choice는 provider와 account에 따라 달라집니다. 항상 켜 두는 gateway host에서는
대체로 API key가 가장 예측 가능하지만, subscription token flow도 지원됩니다.

예시 (Anthropic setup-token):

```bash
claude setup-token
openclaw models status
```

## Scanning (OpenRouter free models)

`openclaw models scan`은 OpenRouter의 **free model catalog**를 검사하고, 필요하면
tool support와 image support를 live probe할 수 있습니다.

주요 flag:

- `--no-probe`: live probe 없이 metadata만 보기
- `--min-params <b>`: 최소 parameter 수(십억 단위)
- `--max-age-days <days>`: 오래된 model 제외
- `--provider <name>`: provider prefix filter
- `--max-candidates <n>`: fallback list 크기
- `--set-default`: 첫 selection을 `agents.defaults.model.primary`로 설정
- `--set-image`: 첫 image selection을 `agents.defaults.imageModel.primary`로 설정

probe에는 OpenRouter API key가 필요합니다. auth profile 또는 `OPENROUTER_API_KEY`에서
읽습니다. key가 없으면 `--no-probe`로 candidate만 확인하세요.

scan result는 다음 순서로 ranking됩니다.

1. image support
2. tool latency
3. context size
4. parameter count

입력:

- OpenRouter `/models` 목록 (`:free` filter 적용)
- auth profile 또는 `OPENROUTER_API_KEY`의 OpenRouter API key 필요
  ([/environment](/help/environment) 참고)
- optional filter:
  `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- probe control: `--timeout`, `--concurrency`

TTY에서 실행하면 fallback을 interactive하게 고를 수 있고, non-interactive mode에서는
`--yes`로 기본값을 수락할 수 있습니다.

## Models registry (`models.json`)

`models.providers`의 custom provider는 agent directory 아래의 `models.json`에
기록됩니다
(기본값: `~/.openclaw/agents/<agentId>/agent/models.json`).
`models.mode`가 `replace`가 아닌 한 이 파일은 merge됩니다.

같은 provider ID가 겹칠 때 merge precedence:

- agent `models.json`에 이미 있는 non-empty `baseUrl`이 우선
- agent `models.json`의 non-empty `apiKey`는 해당 provider가 현재 config/auth-profile
  context에서 SecretRef-managed가 아닐 때만 우선
- SecretRef-managed provider의 `apiKey`는 해석된 secret 값 대신 source marker로
  갱신됩니다
  (env ref는 `ENV_VAR_NAME`, file/exec ref는 `secretref-managed`)
- SecretRef-managed provider header 값도 source marker로 refresh됩니다
  (env ref는 `secretref-env:ENV_VAR_NAME`, file/exec ref는 `secretref-managed`)
- agent 쪽 `apiKey`/`baseUrl`이 비어 있거나 없으면 config `models.providers`를 사용
- 다른 provider field는 config와 normalized catalog data로 refresh

marker persistence는 source-authoritative입니다. OpenClaw는 runtime secret 값이 아니라
active source config snapshot(pre-resolution) 기준으로 marker를 기록합니다.
이 규칙은 `openclaw agent` 같은 command-driven path를 포함해 OpenClaw가
`models.json`을 다시 생성할 때마다 적용됩니다.
