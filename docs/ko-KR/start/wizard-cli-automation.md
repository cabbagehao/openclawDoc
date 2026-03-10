---
summary: "OpenClaw CLI의 스크립트 온보딩 및 에이전트 설정"
read_when:
  - 스크립트 또는 CI에서 온보딩을 자동화하는 경우
  - 특정 프로바이더에 대한 비대화형 예제가 필요한 경우
title: "CLI 자동화"
sidebarTitle: "CLI 자동화"
x-i18n:
  source_path: "start/wizard-cli-automation.md"
  source_hash: "86495bbfd6c1ba7a2c204b879a869b94c1f2a93c2311e7553555bebbd6a665ec"
  provider: "anthropic"
  model: "claude-opus-4-6"
  workflow: 1
  generated_at: "2026-03-10T08:19:25.499Z"
---


# CLI 자동화

`--non-interactive`를 사용하여 `openclaw onboard`를 자동화하세요.

<Note>
`--json`은 비대화형 모드를 의미하지 않습니다. 스크립트에는 `--non-interactive` (및 `--workspace`)를 사용하세요.
</Note>

## 기본 비대화형 예제

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

머신 판독 가능한 요약을 위해 `--json`을 추가하세요.

평문 값 대신 인증 프로필에 환경 변수 기반 참조를 저장하려면 `--secret-input-mode ref`를 사용하세요.
환경 변수 참조와 구성된 프로바이더 참조(`file` 또는 `exec`) 간의 대화형 선택은 온보딩 마법사 플로우에서 사용할 수 있습니다.

비대화형 `ref` 모드에서는 프로바이더 환경 변수가 프로세스 환경에 설정되어 있어야 합니다.
일치하는 환경 변수 없이 인라인 키 플래그를 전달하면 즉시 실패합니다.

예제:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

## 프로바이더별 예제

<AccordionGroup>
  <Accordion title="Gemini 예제">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice gemini-api-key \
      --gemini-api-key "$GEMINI_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Z.AI 예제">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice zai-api-key \
      --zai-api-key "$ZAI_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Vercel AI Gateway 예제">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice ai-gateway-api-key \
      --ai-gateway-api-key "$AI_GATEWAY_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Cloudflare AI Gateway 예제">
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
  <Accordion title="Moonshot 예제">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice moonshot-api-key \
      --moonshot-api-key "$MOONSHOT_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Mistral 예제">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice mistral-api-key \
      --mistral-api-key "$MISTRAL_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Synthetic 예제">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice synthetic-api-key \
      --synthetic-api-key "$SYNTHETIC_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="OpenCode Zen 예제">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice opencode-zen \
      --opencode-zen-api-key "$OPENCODE_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="커스텀 프로바이더 예제">
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

    `--custom-api-key`는 선택 사항입니다. 생략하면 온보딩이 `CUSTOM_API_KEY`를 확인합니다.

    참조 모드 변형:

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

    이 모드에서 온보딩은 `apiKey`를 `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`로 저장합니다.

  </Accordion>
</AccordionGroup>

## 다른 에이전트 추가

`openclaw agents add <name>`을 사용하여 자체 작업 공간, 세션 및 인증 프로필을 가진 별도의 에이전트를 생성하세요. `--workspace` 없이 실행하면 마법사가 시작됩니다.

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.2 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

설정 항목:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

참고 사항:

- 기본 작업 공간은 `~/.openclaw/workspace-<agentId>` 형식을 따릅니다.
- 인바운드 메시지를 라우팅하려면 `bindings`를 추가하세요 (마법사에서 수행 가능).
- 비대화형 플래그: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## 관련 문서

- 온보딩 허브: [온보딩 마법사 (CLI)](/start/wizard)
- 전체 참조: [CLI 온보딩 참조](/start/wizard-cli-reference)
- 명령 참조: [`openclaw onboard`](/cli/onboard)
