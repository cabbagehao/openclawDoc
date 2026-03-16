---
title: "CLI Automation"
description: "`openclaw onboard`를 스크립트와 CI에서 non-interactive로 자동화하고 provider별 예제를 정리한 가이드입니다."
summary: "OpenClaw CLI용 스크립트 기반 온보딩과 agent 설정"
read_when:
  - 스크립트나 CI에서 온보딩을 자동화할 때
  - 특정 provider용 non-interactive 예제가 필요할 때
sidebarTitle: "CLI automation"
x-i18n:
  source_path: "start/wizard-cli-automation.md"
---

# CLI Automation

`--non-interactive`를 사용하면 `openclaw onboard`를 자동화할 수 있습니다.

<Note>
`--json`만으로는 non-interactive mode가 되지 않습니다. 스크립트에서는 `--non-interactive`(그리고 필요하면 `--workspace`)를 함께 사용하세요.
</Note>

## 기본 non-interactive 예제

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --secret-input-mode plaintext \
  --gateway-port 18789 \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-skills
```

machine-readable summary가 필요하면 `--json`을 추가하세요.

`--secret-input-mode ref`를 사용하면 plaintext 값 대신 env-backed ref를 auth profile에 저장할 수 있습니다.
env ref와 미리 구성된 provider ref(`file` 또는 `exec`) 중 선택하는 interactive 흐름은 onboarding wizard에서 지원됩니다.

non-interactive `ref` mode에서는 provider env var가 process environment에 설정되어 있어야 합니다.
대응 env var 없이 inline key flag를 넘기면 onboarding이 즉시 실패합니다.

예시:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

## Provider별 예제

<AccordionGroup>
  <Accordion title="Gemini example">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice gemini-api-key \
      --gemini-api-key "$GEMINI_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Z.AI example">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice zai-api-key \
      --zai-api-key "$ZAI_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Vercel AI Gateway example">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice ai-gateway-api-key \
      --ai-gateway-api-key "$AI_GATEWAY_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Cloudflare AI Gateway example">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice cloudflare-ai-gateway-api-key \
      --cloudflare-ai-gateway-account-id "your-account-id" \
      --cloudflare-ai-gateway-gateway-id "your-gateway-id" \
      --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Moonshot example">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice moonshot-api-key \
      --moonshot-api-key "$MOONSHOT_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Mistral example">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice mistral-api-key \
      --mistral-api-key "$MISTRAL_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Synthetic example">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice synthetic-api-key \
      --synthetic-api-key "$SYNTHETIC_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="OpenCode example">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice opencode-zen \
      --opencode-zen-api-key "$OPENCODE_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
    Go catalog를 사용하려면 `--auth-choice opencode-go --opencode-go-api-key "$OPENCODE_API_KEY"`로 바꾸세요.
  </Accordion>
  <Accordion title="Custom provider example">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice custom-api-key \
      --custom-base-url "https://llm.example.com/v1" \
      --custom-model-id "foo-large" \
      --custom-api-key "$CUSTOM_API_KEY" \
      --custom-provider-id "my-custom" \
      --custom-compatibility anthropic \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```

    `--custom-api-key`는 선택 사항입니다. 생략하면 onboarding이 `CUSTOM_API_KEY`를 확인합니다.

    ref mode variant:

    ```bash
    export CUSTOM_API_KEY="your-key"
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice custom-api-key \
      --custom-base-url "https://llm.example.com/v1" \
      --custom-model-id "foo-large" \
      --secret-input-mode ref \
      --custom-provider-id "my-custom" \
      --custom-compatibility anthropic \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```

    이 모드에서는 onboarding이 `apiKey`를 `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`로 저장합니다.

  </Accordion>
</AccordionGroup>

## 다른 agent 추가

`openclaw agents add <name>`을 사용하면 별도의 workspace, sessions, auth profile을 가진 agent를 만들 수 있습니다.
`--workspace` 없이 실행하면 마법사가 열립니다.

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.2 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

설정되는 항목:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

참고:

- 기본 workspace는 `~/.openclaw/workspace-<agentId>` 형식을 따릅니다.
- inbound message를 라우팅하려면 `bindings`를 추가하세요. 마법사에서도 설정할 수 있습니다.
- non-interactive flag: `--model`, `--agent-dir`, `--bind`, `--non-interactive`

## 관련 문서

- Onboarding hub: [Onboarding Wizard (CLI)](/start/wizard)
- Full reference: [CLI Onboarding Reference](/start/wizard-cli-reference)
- Command reference: [`openclaw onboard`](/cli/onboard)
