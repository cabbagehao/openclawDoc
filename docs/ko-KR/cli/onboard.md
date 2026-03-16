---
summary: "CLI reference for `openclaw onboard` (interactive onboarding wizard)"
description: "Gateway, workspace, auth, channel, skill 설정을 안내하는 `openclaw onboard` interactive wizard의 흐름과 비대화형 옵션을 설명합니다."
read_when:
  - Gateway, workspace, auth, channel, skill 설정을 안내형으로 진행하고 싶을 때
title: "onboard"
x-i18n:
  source_path: "cli/onboard.md"
---

# `openclaw onboard`

interactive onboarding wizard입니다. (local 또는 remote Gateway setup)

## Related guides

- CLI onboarding hub: [Onboarding Wizard (CLI)](/start/wizard)
- Onboarding overview: [Onboarding Overview](/start/onboarding-overview)
- CLI onboarding reference: [CLI Onboarding Reference](/start/wizard-cli-reference)
- CLI automation: [CLI Automation](/start/wizard-cli-automation)
- macOS onboarding: [Onboarding (macOS App)](/start/onboarding)

## Examples

```bash
openclaw onboard
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

신뢰할 수 있는 private network에서만 `ws://` target을 써야 한다면, onboarding process environment에
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`을 설정하세요.

Non-interactive custom provider:

```bash
openclaw onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --secret-input-mode plaintext \
  --custom-compatibility openai
```

non-interactive mode에서 `--custom-api-key`는 선택 사항입니다. 생략하면 onboarding은 `CUSTOM_API_KEY`를 확인합니다.

plaintext 대신 provider key를 ref로 저장:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

`--secret-input-mode ref`를 쓰면 onboarding은 plaintext key 값 대신 env-backed ref를 기록합니다.
auth-profile backed provider는 `keyRef` entry를 쓰고, custom provider는 `models.providers.<id>.apiKey`를 env ref로 기록합니다.
(예: `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`)

Non-interactive `ref` mode contract:

- provider env var를 onboarding process environment에 설정하세요. (예: `OPENAI_API_KEY`)
- inline key flag(예: `--openai-api-key`)는 해당 env var도 함께 설정된 경우에만 전달하세요.
- 필요한 env var 없이 inline key flag를 넘기면 onboarding은 안내와 함께 즉시 실패합니다.

non-interactive mode의 Gateway token option:

- `--gateway-auth token --gateway-token <token>`은 plaintext token을 저장합니다.
- `--gateway-auth token --gateway-token-ref-env <name>`은 `gateway.auth.token`을 env SecretRef로 저장합니다.
- `--gateway-token`과 `--gateway-token-ref-env`는 함께 사용할 수 없습니다.
- `--gateway-token-ref-env`는 onboarding process environment에 비어 있지 않은 env var가 필요합니다.
- `--install-daemon`과 함께 쓸 때 token auth가 token을 요구하면, SecretRef-managed gateway token은 검증되지만 supervisor service environment metadata에 resolved plaintext로 저장되지는 않습니다.
- `--install-daemon`과 함께 쓸 때 token mode가 token을 요구하고 configured token SecretRef가 unresolved 상태면, onboarding은 remediation guidance와 함께 fail-closed로 동작합니다.
- `--install-daemon`과 함께 쓸 때 `gateway.auth.token`과 `gateway.auth.password`가 모두 configured되어 있고 `gateway.auth.mode`가 비어 있으면, mode를 명시하기 전까지 install이 차단됩니다.

Example:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN \
  --accept-risk
```

interactive onboarding에서 reference mode를 사용할 때:

- prompt에서 **Use secret reference**를 선택합니다.
- 다음 중 하나를 선택합니다.
  - Environment variable
  - Configured secret provider (`file` 또는 `exec`)
- onboarding은 저장 전에 빠른 preflight validation을 수행합니다.
  - validation이 실패하면 오류를 보여 주고 다시 시도할 수 있게 합니다.

Non-interactive Z.AI endpoint choice:

참고: `--auth-choice zai-api-key`는 이제 key에 가장 맞는 Z.AI endpoint를 자동 감지합니다. (`zai/glm-5`가 있는 general API 선호)
GLM Coding Plan endpoint를 명시적으로 원하면 `zai-coding-global` 또는 `zai-coding-cn`을 선택하세요.

```bash
# Promptless endpoint selection
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# Other Z.AI endpoint choices:
# --auth-choice zai-coding-cn
# --auth-choice zai-global
# --auth-choice zai-cn
```

Non-interactive Mistral example:

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

Flow notes:

- `quickstart`: 최소 질문만 묻고, gateway token을 자동 생성합니다.
- `manual`: port/bind/auth 전체 질문을 보여 줍니다. (`advanced`의 alias)
- local onboarding DM scope behavior: [CLI Onboarding Reference](/start/wizard-cli-reference#outputs-and-internals)
- 가장 빠른 첫 chat: `openclaw dashboard` (Control UI, channel setup 불필요)
- Custom Provider: 목록에 없는 OpenAI 또는 Anthropic compatible endpoint를 연결할 수 있습니다. Unknown을 선택하면 auto-detect를 시도합니다.

## Common follow-up commands

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json`은 non-interactive mode를 의미하지 않습니다. script에서는 `--non-interactive`를 사용하세요.
</Note>
