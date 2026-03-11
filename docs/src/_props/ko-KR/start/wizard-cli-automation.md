---
summary: "OpenClaw CLI를 사용한 스크립트 기반 온보딩 및 에이전트 설정 자동화 가이드"
read_when:
  - 셸 스크립트 또는 CI 환경에서 온보딩 과정을 자동화하고자 할 때
  - 특정 공급자별 비대화형(Non-interactive) 설정 예시가 필요할 때
title: "CLI 자동화 가이드"
sidebarTitle: "CLI 자동화"
x-i18n:
  source_path: "start/wizard-cli-automation.md"
---

# CLI 자동화 (CLI Automation)

`--non-interactive` 플래그를 사용하여 `openclaw onboard` 과정을 자동화할 수 있음.

<Note>
  `--json` 플래그만으로는 비대화형 모드가 활성화되지 않음. 스크립트 자동화 시에는 반드시 `--non-interactive` 플래그를 사용하고, 가급적 `--workspace` 경로를 명시할 것을 권장함.
</Note>

## 기본적인 비대화형 설정 예시

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

출력 결과를 기계 판독 가능한 형식으로 받으려면 `--json` 플래그를 추가함.

평문 키 대신 환경 변수 기반의 참조를 저장하려면 `--secret-input-mode ref` 옵션을 사용함. 비대화형 `ref` 모드 사용 시, 해당 공급자의 환경 변수가 프로세스 환경에 미리 설정되어 있어야 하며, 일치하는 환경 변수가 없을 경우 즉시 실패함.

**환경 변수 참조(Ref) 모드 예시:**

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

## 공급자별 자동화 예시

<AccordionGroup>
  <Accordion title="Google Gemini 설정">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice gemini-api-key \
      --gemini-api-key "$GEMINI_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>

  <Accordion title="Z.AI 설정">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice zai-api-key \
      --zai-api-key "$ZAI_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>

  <Accordion title="Vercel AI Gateway 설정">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice ai-gateway-api-key \
      --ai-gateway-api-key "$AI_GATEWAY_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>

  <Accordion title="Cloudflare AI Gateway 설정">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice cloudflare-ai-gateway-api-key \
      --cloudflare-ai-gateway-account-id "YOUR_ACCOUNT_ID" \
      --cloudflare-ai-gateway-gateway-id "YOUR_GATEWAY_ID" \
      --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>

  <Accordion title="Moonshot 설정">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice moonshot-api-key \
      --moonshot-api-key "$MOONSHOT_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>

  <Accordion title="Mistral 설정">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice mistral-api-key \
      --mistral-api-key "$MISTRAL_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>

  <Accordion title="Synthetic 설정">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice synthetic-api-key \
      --synthetic-api-key "$SYNTHETIC_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>

  <Accordion title="OpenCode Zen 설정">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice opencode-zen \
      --opencode-zen-api-key "$OPENCODE_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>

  <Accordion title="커스텀 공급자 (Custom Provider) 설정">
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

    `--custom-api-key` 플래그 생략 시, 시스템은 `CUSTOM_API_KEY` 환경 변수를 자동으로 확인함.

    **참조(Ref) 모드 사용 시:**

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

    이 모드에서는 `apiKey` 정보가 `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }` 구조로 저장됨.
  </Accordion>
</AccordionGroup>

## 추가 에이전트 생성 자동화

`openclaw agents add <name>` 명령어를 사용하여 독립적인 워크스페이스, 세션 및 인증 프로필을 가진 별도의 에이전트를 생성할 수 있음.

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-4o \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

**자동 설정되는 항목:**

* 에이전트 이름 (`agents.list[].name`)
* 워크스페이스 경로 (`agents.list[].workspace`)
* 에이전트 데이터 디렉터리 (`agents.list[].agentDir`)

**참고 사항:**

* 기본 워크스페이스는 `~/.openclaw/workspace-<agentId>` 경로를 따름.
* 수신 메시지 라우팅을 위해 `bindings` 설정을 추가할 수 있음.
* 주요 자동화 플래그: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## 관련 문서 목록

* **온보딩 통합 허브**: [온보딩 마법사 가이드](/start/wizard)
* **명령어 전체 레퍼런스**: [CLI 온보딩 상세 레퍼런스](/start/wizard-cli-reference)
* **명령어 상세 설명**: [`openclaw onboard` 명령어](/cli/onboard)
