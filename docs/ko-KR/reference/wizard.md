---
summary: "CLI onboarding wizard의 모든 단계, flag, config 필드에 대한 전체 참조"
read_when:
  - 특정 wizard 단계나 flag를 찾아볼 때
  - non-interactive mode로 onboarding을 자동화할 때
  - wizard 동작을 디버깅할 때
title: "Onboarding Wizard Reference"
sidebarTitle: "Wizard Reference"
---

# Onboarding Wizard Reference

이 문서는 `openclaw onboard` CLI wizard의 전체 참조입니다.
상위 수준 개요는 [Onboarding Wizard](/start/wizard)를 참고하세요.

## Flow details (local mode)

<Steps>
  <Step title="기존 config 감지">
    - `~/.openclaw/openclaw.json`이 있으면 **Keep / Modify / Reset** 중에서 선택합니다.
    - Wizard를 다시 실행해도 명시적으로 **Reset**을 선택하지 않는 한
      (또는 `--reset`을 넘기지 않는 한) 아무것도 지워지지 않습니다.
    - CLI `--reset`의 기본값은 `config+creds+sessions`이며, workspace까지 제거하려면 `--reset-scope full`
      을 사용하세요.
    - Config가 유효하지 않거나 legacy key를 포함하면 wizard는 멈추고,
      계속하기 전에 `openclaw doctor`를 실행하라고 안내합니다.
    - Reset은 `trash`를 사용하며(`rm`은 절대 사용하지 않음), 다음 scope를 제공합니다.
      - Config만
      - Config + credentials + sessions
      - Full reset(workspace도 제거)
  </Step>
  <Step title="Model/Auth">
    - **Anthropic API key**: `ANTHROPIC_API_KEY`가 있으면 이를 사용하고, 없으면 key를 요청한 뒤 daemon이 사용할 수 있도록 저장합니다.
    - **Anthropic OAuth (Claude Code CLI)**: macOS에서는 wizard가 Keychain 항목 "Claude Code-credentials"를 확인합니다(launchd 시작이 막히지 않도록 "Always Allow"를 선택하세요). Linux/Windows에서는 `~/.claude/.credentials.json`이 있으면 이를 재사용합니다.
    - **Anthropic token (setup-token 붙여넣기)**: 아무 머신에서나 `claude setup-token`을 실행한 다음 token을 붙여 넣습니다(이름을 지정할 수 있으며, 비워 두면 default).
    - **OpenAI Code (Codex) subscription (Codex CLI)**: `~/.codex/auth.json`이 있으면 wizard가 이를 재사용할 수 있습니다.
    - **OpenAI Code (Codex) subscription (OAuth)**: browser flow; `code#state`를 붙여 넣습니다.
      - Model이 설정되지 않았거나 `openai/*`일 때 `agents.defaults.model`을 `openai-codex/gpt-5.2`로 설정합니다.
    - **OpenAI API key**: `OPENAI_API_KEY`가 있으면 이를 사용하고, 없으면 key를 요청한 뒤 auth profile에 저장합니다.
    - **xAI (Grok) API key**: `XAI_API_KEY`를 요청하고 xAI를 model provider로 구성합니다.
    - **OpenCode Zen (multi-model proxy)**: `OPENCODE_API_KEY`(또는 `OPENCODE_ZEN_API_KEY`, https://opencode.ai/auth 에서 발급)를 요청합니다.
    - **API key**: key를 대신 저장해 줍니다.
    - **Vercel AI Gateway (multi-model proxy)**: `AI_GATEWAY_API_KEY`를 요청합니다.
    - 자세한 내용: [Vercel AI Gateway](/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: Account ID, Gateway ID, `CLOUDFLARE_AI_GATEWAY_API_KEY`를 요청합니다.
    - 자세한 내용: [Cloudflare AI Gateway](/providers/cloudflare-ai-gateway)
    - **MiniMax M2.5**: config가 자동으로 기록됩니다.
    - 자세한 내용: [MiniMax](/providers/minimax)
    - **Synthetic (Anthropic-compatible)**: `SYNTHETIC_API_KEY`를 요청합니다.
    - 자세한 내용: [Synthetic](/providers/synthetic)
    - **Moonshot (Kimi K2)**: config가 자동으로 기록됩니다.
    - **Kimi Coding**: config가 자동으로 기록됩니다.
    - 자세한 내용: [Moonshot AI (Kimi + Kimi Coding)](/providers/moonshot)
    - **Skip**: 아직 auth를 구성하지 않습니다.
    - 감지된 옵션에서 기본 model을 고르거나 `provider/model`을 직접 입력합니다. 최상의 품질과 더 낮은 prompt-injection 위험을 원한다면, provider 스택에서 사용할 수 있는 가장 강력한 최신 세대 model을 고르세요.
    - Wizard는 model check를 실행하고, 구성한 model이 알 수 없거나 auth가 없으면 경고합니다.
    - API key 저장 모드는 기본적으로 평문 auth-profile 값을 사용합니다. 대신 env 기반 ref로 저장하려면 `--secret-input-mode ref`를 사용하세요(예: `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - OAuth credential은 `~/.openclaw/credentials/oauth.json`에, auth profile은 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`에 저장됩니다(API key + OAuth).
    - 자세한 내용: [/concepts/oauth](/concepts/oauth)
    <Note>
    Headless/server 팁: browser가 있는 머신에서 OAuth를 완료한 뒤,
    `~/.openclaw/credentials/oauth.json`(또는 `$OPENCLAW_STATE_DIR/credentials/oauth.json`)을
    gateway host로 복사하세요.
    </Note>
  </Step>
  <Step title="Workspace">
    - 기본값은 `~/.openclaw/workspace`입니다(변경 가능).
    - Agent bootstrap ritual에 필요한 workspace 파일을 시드합니다.
    - 전체 workspace 레이아웃 + 백업 가이드: [Agent workspace](/concepts/agent-workspace)
  </Step>
  <Step title="Gateway">
    - Port, bind, auth mode, tailscale 노출 여부
    - Auth 권장 사항: loopback에서도 local WS client가 인증해야 하므로 **Token**을 유지하세요.
    - Token mode에서 interactive onboarding은 다음을 제공합니다.
      - **평문 token 생성/저장**(기본값)
      - **SecretRef 사용**(opt-in)
      - Quickstart는 onboarding probe/dashboard bootstrap을 위해 `env`, `file`, `exec` provider 전반에서 기존 `gateway.auth.token` SecretRef를 재사용합니다.
      - 해당 SecretRef가 구성되어 있지만 해석할 수 없으면 onboarding은 런타임 auth를 조용히 약화시키는 대신, 명확한 수정 메시지와 함께 초기에 실패합니다.
    - Password mode에서도 interactive onboarding은 평문 저장과 SecretRef 저장을 모두 지원합니다.
    - Non-interactive token SecretRef 경로: `--gateway-token-ref-env <ENV_VAR>`
      - Onboarding process environment 안에 비어 있지 않은 env var가 필요합니다.
      - `--gateway-token`과 함께 사용할 수 없습니다.
    - 모든 local process를 완전히 신뢰하는 경우에만 auth를 비활성화하세요.
    - Non‑loopback bind는 여전히 auth가 필요합니다.
  </Step>
  <Step title="Channels">
    - [WhatsApp](/channels/whatsapp): 선택적 QR login
    - [Telegram](/channels/telegram): bot token
    - [Discord](/channels/discord): bot token
    - [Google Chat](/channels/googlechat): service account JSON + webhook audience
    - [Mattermost](/channels/mattermost) (plugin): bot token + base URL
    - [Signal](/channels/signal): 선택적 `signal-cli` 설치 + account config
    - [BlueBubbles](/channels/bluebubbles): **iMessage에 권장**; server URL + password + webhook
    - [iMessage](/channels/imessage): legacy `imsg` CLI path + DB access
    - DM 보안: 기본값은 pairing입니다. 첫 DM은 code를 보내며, `openclaw pairing approve <channel> <code>`로 승인하거나 allowlist를 사용할 수 있습니다.
  </Step>
  <Step title="Web search">
    - Provider 선택: Perplexity, Brave, Gemini, Grok, Kimi(또는 건너뛰기)
    - API key 붙여넣기(QuickStart는 env var나 기존 config에서 key를 자동 감지)
    - `--skip-search`로 건너뛰기
    - 나중에 구성: `openclaw configure --section web`
  </Step>
  <Step title="Daemon install">
    - macOS: LaunchAgent
      - 로그인된 사용자 세션이 필요합니다. headless 환경에서는 custom LaunchDaemon을 사용하세요(기본 제공되지 않음).
    - Linux(및 WSL2를 통한 Windows): systemd user unit
      - Wizard는 logout 후에도 Gateway가 계속 실행되도록 `loginctl enable-linger <user>`를 활성화하려고 시도합니다.
      - sudo를 요청할 수 있으며(`/var/lib/systemd/linger`에 기록), 먼저 sudo 없이 시도합니다.
    - **Runtime selection:** Node(권장; WhatsApp/Telegram에 필요). Bun은 **권장되지 않습니다**.
    - Token auth에 token이 필요하고 `gateway.auth.token`이 SecretRef로 관리된다면, daemon install은 이를 검증하지만 해석된 평문 token 값을 supervisor service environment metadata에 저장하지는 않습니다.
    - Token auth에 token이 필요하고 구성된 token SecretRef가 해석되지 않으면, daemon install은 실행 가능한 안내와 함께 차단됩니다.
    - `gateway.auth.token`과 `gateway.auth.password`가 모두 구성되어 있고 `gateway.auth.mode`가 설정되지 않았다면, mode를 명시적으로 설정하기 전까지 daemon install은 차단됩니다.
  </Step>
  <Step title="Health check">
    - 필요하면 Gateway를 시작하고 `openclaw health`를 실행합니다.
    - 팁: `openclaw status --deep`는 status output에 gateway health probe를 추가합니다(reachable gateway 필요).
  </Step>
  <Step title="Skills (권장)">
    - 사용 가능한 skill을 읽고 요구 사항을 확인합니다.
    - Node manager를 고를 수 있습니다: **npm / pnpm** (bun은 권장되지 않음).
    - 선택적 dependency를 설치합니다(일부는 macOS에서 Homebrew 사용).
  </Step>
  <Step title="마무리">
    - 추가 기능을 위한 iOS/Android/macOS app을 포함한 요약 + 다음 단계
  </Step>
</Steps>

<Note>
GUI가 감지되지 않으면 wizard는 browser를 여는 대신 Control UI용 SSH port-forward 지침을 출력합니다.
Control UI asset이 없으면 wizard는 이를 빌드하려고 시도하며, fallback은 `pnpm ui:build`입니다(UI dependency 자동 설치).
</Note>

## Non-interactive mode

Onboarding을 자동화하거나 스크립트로 실행하려면 `--non-interactive`를 사용하세요.

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-skills
```

머신이 읽을 수 있는 요약을 원하면 `--json`을 추가하세요.

Non-interactive mode에서 Gateway token SecretRef:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN
```

`--gateway-token`과 `--gateway-token-ref-env`는 함께 사용할 수 없습니다.

<Note>
`--json`은 **자동으로** non-interactive mode를 의미하지 않습니다. 스크립트에서는 `--non-interactive`(및 `--workspace`)를 사용하세요.
</Note>

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
  <Accordion title="OpenCode Zen example">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice opencode-zen \
      --opencode-zen-api-key "$OPENCODE_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
</AccordionGroup>

### Agent 추가 (non-interactive)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.2 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## Gateway wizard RPC

Gateway는 RPC를 통해 wizard flow를 노출합니다(`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
Client(macOS app, Control UI)는 onboarding logic을 다시 구현하지 않고도 단계를 렌더링할 수 있습니다.

## Signal setup (signal-cli)

Wizard는 GitHub release에서 `signal-cli`를 설치할 수 있습니다.

- 적절한 release asset을 다운로드합니다.
- 이를 `~/.openclaw/tools/signal-cli/<version>/` 아래에 저장합니다.
- `channels.signal.cliPath`를 config에 기록합니다.

참고:

- JVM 빌드에는 **Java 21**이 필요합니다.
- Native build가 있으면 이를 사용합니다.
- Windows는 WSL2를 사용하며, signal-cli 설치는 WSL 내부에서 Linux 흐름을 따릅니다.

## Wizard가 기록하는 내용

`~/.openclaw/openclaw.json`의 대표적인 필드:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (Minimax를 선택한 경우)
- `tools.profile` (local onboarding은 설정되지 않은 경우 기본값으로 `"coding"`을 사용하며, 기존의 명시적 값은 유지합니다)
- `gateway.*` (mode, bind, auth, tailscale)
- `session.dmScope` (동작 세부사항: [CLI Onboarding Reference](/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.signal.*`, `channels.imessage.*`
- Prompt 중 opt-in하면 채널 allowlist(Slack/Discord/Matrix/Microsoft Teams)도 기록됩니다(가능하면 이름을 ID로 해석).
- `skills.install.nodeManager`
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add`는 `agents.list[]`와 선택적 `bindings`를 기록합니다.

WhatsApp credential은 `~/.openclaw/credentials/whatsapp/<accountId>/` 아래에 저장됩니다.
Session은 `~/.openclaw/agents/<agentId>/sessions/` 아래에 저장됩니다.

일부 채널은 plugin으로 제공됩니다. Onboarding 중 이런 채널을 선택하면 wizard는
구성하기 전에 이를 설치하도록 안내합니다(npm 또는 local path).

## 관련 문서

- Wizard 개요: [Onboarding Wizard](/start/wizard)
- macOS app onboarding: [Onboarding](/start/onboarding)
- Config reference: [Gateway configuration](/gateway/configuration)
- Provider: [WhatsApp](/channels/whatsapp), [Telegram](/channels/telegram), [Discord](/channels/discord), [Google Chat](/channels/googlechat), [Signal](/channels/signal), [BlueBubbles](/channels/bluebubbles) (iMessage), [iMessage](/channels/imessage) (legacy)
- Skill: [Skills](/tools/skills), [Skills config](/tools/skills-config)
