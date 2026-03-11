---
summary: "대화형 온보딩 마법사 `openclaw onboard`용 CLI 참고 문서"
read_when:
  - gateway, workspace, auth, channels, skills를 안내형으로 설정하고 싶을 때
title: "onboard"
---

# `openclaw onboard`

대화형 온보딩 마법사입니다. 로컬 또는 원격 Gateway 설정을 지원합니다.

## Related guides

- CLI 온보딩 허브: [Onboarding Wizard (CLI)](/start/wizard)
- 온보딩 개요: [Onboarding Overview](/start/onboarding-overview)
- CLI 온보딩 참고: [CLI Onboarding Reference](/start/wizard-cli-reference)
- CLI 자동화: [CLI Automation](/start/wizard-cli-automation)
- macOS 온보딩: [Onboarding (macOS App)](/start/onboarding)

## Examples

```bash
openclaw onboard
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

평문 private-network `ws://` 대상(신뢰할 수 있는 네트워크에서만 사용)의 경우, 온보딩 프로세스 환경에 `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`을 설정하세요.

비대화형 custom provider 예시:

```bash
openclaw onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --secret-input-mode plaintext \
  --custom-compatibility openai
```

비대화형 모드에서 `--custom-api-key`는 선택 사항입니다. 생략하면 온보딩이 `CUSTOM_API_KEY`를 확인합니다.

provider key를 평문 대신 ref로 저장:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

`--secret-input-mode ref`를 사용하면 온보딩은 평문 키 값 대신 env 기반 ref를 기록합니다. auth-profile 기반 provider의 경우 `keyRef` 항목을 쓰고, custom provider의 경우 `models.providers.<id>.apiKey`에 env ref(예: `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`)를 기록합니다.

비대화형 `ref` 모드 계약:

- 온보딩 프로세스 환경에 provider용 env var(예: `OPENAI_API_KEY`)를 설정합니다.
- 해당 env var도 설정되어 있지 않다면, `--openai-api-key` 같은 인라인 키 플래그를 넘기지 마세요.
- 필요한 env var 없이 인라인 키 플래그를 넘기면, 온보딩은 안내 메시지와 함께 즉시 실패합니다.

비대화형 모드의 Gateway token 옵션:

- `--gateway-auth token --gateway-token <token>`은 평문 token을 저장합니다.
- `--gateway-auth token --gateway-token-ref-env <name>`은 `gateway.auth.token`을 env SecretRef로 저장합니다.
- `--gateway-token`과 `--gateway-token-ref-env`는 함께 사용할 수 없습니다.
- `--gateway-token-ref-env`는 온보딩 프로세스 환경에 비어 있지 않은 env var가 있어야 합니다.
- `--install-daemon`과 함께 사용 시, token auth에 token이 필요하면 SecretRef 기반 gateway token은 검증되지만 supervisor 서비스 환경 메타데이터에 해석된 평문으로 저장되지는 않습니다.
- `--install-daemon`과 함께 사용 시, token 모드에 token이 필요한데 설정된 token SecretRef를 해석할 수 없으면, 온보딩은 remediation 안내와 함께 fail closed 합니다.
- `--install-daemon`과 함께 사용 시, `gateway.auth.token`과 `gateway.auth.password`가 모두 설정되어 있고 `gateway.auth.mode`가 비어 있으면, 온보딩은 mode를 명시적으로 설정할 때까지 설치를 막습니다.

예시:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN \
  --accept-risk
```

reference 모드의 대화형 온보딩 동작:

- 프롬프트가 나오면 **Use secret reference**를 선택합니다.
- 그런 다음 다음 중 하나를 선택합니다.
  - Environment variable
  - Configured secret provider (`file` 또는 `exec`)
- 저장 전에 온보딩이 빠른 preflight validation을 수행합니다.
  - 검증에 실패하면 오류를 보여주고 다시 시도할 수 있습니다.

비대화형 Z.AI 엔드포인트 선택:

참고: `--auth-choice zai-api-key`는 이제 키에 가장 적합한 Z.AI 엔드포인트를 자동 감지합니다. 기본적으로 일반 API와 `zai/glm-5`를 선호합니다.
GLM Coding Plan 엔드포인트를 특정해서 쓰고 싶다면 `zai-coding-global` 또는 `zai-coding-cn`을 선택하세요.

```bash
# 프롬프트 없이 엔드포인트 선택
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# 다른 Z.AI 엔드포인트 선택:
# --auth-choice zai-coding-cn
# --auth-choice zai-global
# --auth-choice zai-cn
```

비대화형 Mistral 예시:

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

Flow 참고:

- `quickstart`: 최소한의 프롬프트만 표시하며 gateway token을 자동 생성합니다.
- `manual`: 포트, bind, auth에 대한 전체 프롬프트를 표시합니다(`advanced`의 별칭).
- 로컬 온보딩 DM 범위 동작: [CLI Onboarding Reference](/start/wizard-cli-reference#outputs-and-internals)
- 가장 빠른 첫 채팅: `openclaw dashboard` (Control UI, channel 설정 불필요)
- Custom Provider: 나열되지 않은 호스팅 provider를 포함해 모든 OpenAI 또는 Anthropic 호환 엔드포인트에 연결할 수 있습니다. Unknown을 사용하면 자동 감지를 시도합니다.

## Common follow-up commands

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json`은 비대화형 모드를 의미하지 않습니다. 스크립트에서는 `--non-interactive`를 사용하세요.
</Note>
