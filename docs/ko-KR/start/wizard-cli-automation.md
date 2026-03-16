---
summary: "OpenClaw CLI용 스크립트 기반 온보딩 및 에이전트 설정"
read_when:
  - 스크립트나 CI에서 온보딩을 자동화할 때
  - 특정 공급자용 non-interactive 예제가 필요할 때
title: "CLI 자동화"
description: "OpenClaw CLI용 스크립트 기반 온보딩 및 에이전트 설정"
sidebarTitle: "CLI 자동화"
x-i18n:
  source_path: "start/wizard-cli-automation.md"
---

# CLI 자동화

`--non-interactive`를 사용하면 `openclaw onboard`를 자동화할 수 있습니다.

<Note>
`--json`은 non-interactive mode를 의미하지 않습니다. 스크립트에서는 `--non-interactive`(그리고 `--workspace`)를 사용하세요.
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

`--secret-input-mode ref`를 사용하면 auth profiles에 plaintext 값 대신 env-backed refs를 저장할 수 있습니다.
env refs와 구성된 provider refs(`file` 또는 `exec`) 사이의 interactive 선택은 onboarding wizard 흐름에서 지원됩니다.

non-interactive `ref` mode에서는 provider env vars가 process environment에 설정되어 있어야 합니다.
일치하는 env var 없이 inline key flags를 넘기면 즉시 실패합니다.

예시:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

## 공급자별 예제

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
    Go catalog을 쓰려면 `--auth-choice opencode-go --opencode-go-api-key "$OPENCODE_API_KEY"`로 바꾸세요.
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

    Ref-mode variant:

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

`openclaw agents add <name>`을 사용하면 별도의 workspace, sessions, auth profiles를 가진 agent를 만들 수 있습니다. `--workspace` 없이 실행하면 마법사가 시작됩니다.

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
- 들어오는 메시지를 라우팅하려면 `bindings`를 추가하세요(마법사에서도 가능).
- non-interactive flags: `--model`, `--agent-dir`, `--bind`, `--non-interactive`

## 관련 문서

- 온보딩 허브: [Onboarding Wizard (CLI)](/start/wizard)
- 전체 레퍼런스: [CLI Onboarding Reference](/start/wizard-cli-reference)
- 명령어 레퍼런스: [`openclaw onboard`](/cli/onboard)
