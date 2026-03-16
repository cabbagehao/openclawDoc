---
title: CLI Onboarding Reference
description: OpenClaw CLI 온보딩의 로컬·원격 흐름, 인증 옵션, SecretRef 저장, 출력과 내부 동작을 정리한 상세 레퍼런스
summary: CLI 온보딩 흐름, 인증 및 모델 설정, 출력과 내부 동작 전체 레퍼런스
read_when: openclaw onboard의 세부 동작을 파악하거나 온보딩 결과를 디버깅할 때
sidebarTitle: CLI reference
x-i18n:
  source_path: "start/wizard-cli-reference.md"
---

# CLI Onboarding Reference

이 페이지는 `openclaw onboard`의 전체 레퍼런스입니다.
짧은 안내는 [Onboarding Wizard (CLI)](/start/wizard)를 참고하세요.

## What the wizard does

로컬 모드(기본값)는 다음 항목을 안내합니다.

- 모델 및 인증 설정(OpenAI Code subscription OAuth, Anthropic API key 또는 setup token, MiniMax, GLM, Moonshot, AI Gateway 옵션 포함)
- 워크스페이스 위치와 bootstrap 파일
- Gateway 설정(port, bind, auth, tailscale)
- 채널 및 provider(Telegram, WhatsApp, Discord, Google Chat, Mattermost plugin, Signal)
- 데몬 설치(LaunchAgent 또는 systemd user unit)
- 상태 점검
- 스킬 설정

원격 모드는 이 머신이 다른 곳에 있는 gateway에 연결하도록 구성합니다.
원격 호스트에 설치하거나 수정하지는 않습니다.

## Local flow details

<Steps>
  <Step title="기존 config 감지">
    - `~/.openclaw/openclaw.json`이 있으면 Keep, Modify, Reset 중 하나를 선택합니다.
    - 마법사를 다시 실행해도 사용자가 명시적으로 Reset을 선택하지 않는 한(또는 `--reset`을 주지 않는 한) 데이터를 지우지 않습니다.
    - CLI `--reset`의 기본 범위는 `config+creds+sessions`이며, workspace까지 지우려면 `--reset-scope full`을 사용합니다.
    - config가 유효하지 않거나 legacy key가 들어 있으면, 마법사는 진행을 멈추고 `openclaw doctor`를 먼저 실행하라고 안내합니다.
    - Reset은 `trash`를 사용하며 범위를 선택할 수 있습니다.
      - Config only
      - Config + credentials + sessions
      - Full reset (workspace까지 제거)
  </Step>
  <Step title="모델 및 인증">
    - 전체 옵션 매트릭스는 아래 [Auth and model options](#auth-and-model-options)를 참고하세요.
  </Step>
  <Step title="Workspace">
    - 기본값은 `~/.openclaw/workspace`이며 변경할 수 있습니다.
    - 첫 실행 bootstrap에 필요한 workspace 파일을 seed합니다.
    - workspace 구조: [Agent workspace](/concepts/agent-workspace)
  </Step>
  <Step title="Gateway">
    - port, bind, auth mode, tailscale 노출 여부를 묻습니다.
    - 권장값은 loopback에서도 token auth를 유지해 로컬 WS client도 인증하게 하는 것입니다.
    - token mode의 interactive onboarding에서는 다음 중 하나를 선택합니다.
      - **Generate/store plaintext token** (기본값)
      - **Use SecretRef** (선택)
    - password mode도 interactive onboarding에서 plaintext 또는 SecretRef 저장을 지원합니다.
    - non-interactive token SecretRef 경로: `--gateway-token-ref-env <ENV_VAR>`
      - onboarding process environment에 비어 있지 않은 env var가 있어야 합니다.
      - `--gateway-token`과 함께 쓸 수 없습니다.
    - auth는 모든 로컬 프로세스를 완전히 신뢰할 때만 끄는 것이 좋습니다.
    - non-loopback bind는 여전히 auth가 필요합니다.
  </Step>
  <Step title="Channels">
    - [WhatsApp](/channels/whatsapp): 선택적인 QR 로그인
    - [Telegram](/channels/telegram): bot token
    - [Discord](/channels/discord): bot token
    - [Google Chat](/channels/googlechat): service account JSON + webhook audience
    - [Mattermost](/channels/mattermost) plugin: bot token + base URL
    - [Signal](/channels/signal): 선택적인 `signal-cli` 설치 + account config
    - [BlueBubbles](/channels/bluebubbles): iMessage 권장 방식, server URL + password + webhook
    - [iMessage](/channels/imessage): legacy `imsg` CLI 경로 + DB access
    - DM 보안 기본값은 pairing입니다. 첫 DM은 코드를 보내며, `openclaw pairing approve <channel> <code>`로 승인하거나 allowlist를 사용할 수 있습니다.
  </Step>
  <Step title="Daemon install">
    - macOS: LaunchAgent
      - 로그인된 사용자 세션이 필요합니다. headless 용 LaunchDaemon은 기본 제공하지 않습니다.
    - Linux와 Windows via WSL2: systemd user unit
      - 로그아웃 후에도 gateway가 계속 실행되도록 마법사가 `loginctl enable-linger <user>`를 시도합니다.
      - `/var/lib/systemd/linger`에 쓰기 위해 sudo를 요청할 수 있으며, 먼저 sudo 없이 시도합니다.
    - runtime 선택: Node 권장(WhatsApp, Telegram에 필요). Bun은 권장하지 않습니다.
  </Step>
  <Step title="Health check">
    - 필요하면 gateway를 시작하고 `openclaw health`를 실행합니다.
    - `openclaw status --deep`는 gateway health probe를 status 출력에 추가합니다.
  </Step>
  <Step title="Skills">
    - 사용 가능한 skill을 읽고 요구 사항을 확인합니다.
    - node manager로 npm 또는 pnpm을 고를 수 있습니다. bun은 권장하지 않습니다.
    - 선택적인 의존성을 설치합니다. 일부는 macOS에서 Homebrew를 사용합니다.
  </Step>
  <Step title="Finish">
    - 요약과 다음 단계(iOS, Android, macOS app 옵션 포함)를 보여 줍니다.
  </Step>
</Steps>

<Note>
GUI가 감지되지 않으면 마법사는 브라우저를 여는 대신 Control UI용 SSH port-forwarding 안내를 출력합니다.
Control UI asset이 없으면 빌드를 시도하며, fallback은 `pnpm ui:build`입니다. 필요한 UI 의존성도 자동 설치합니다.
</Note>

## Remote mode details

원격 모드는 이 머신이 다른 곳에 있는 gateway에 연결되도록 구성합니다.

<Info>
Remote mode는 원격 호스트에 아무것도 설치하거나 수정하지 않습니다.
</Info>

설정하는 항목:

- remote gateway URL (`ws://...`)
- remote gateway auth가 필요한 경우 token(권장)

<Note>
- gateway가 loopback-only라면 SSH tunneling이나 tailnet을 사용하세요.
- discovery 힌트:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)
</Note>

## Auth and model options

<AccordionGroup>
  <Accordion title="Anthropic API key">
    `ANTHROPIC_API_KEY`가 있으면 재사용하고, 없으면 키를 물은 뒤 daemon용으로 저장합니다.
  </Accordion>
  <Accordion title="Anthropic OAuth (Claude Code CLI)">
    - macOS: Keychain의 "Claude Code-credentials" 항목을 확인합니다.
    - Linux와 Windows: `~/.claude/.credentials.json`이 있으면 재사용합니다.

    macOS에서는 launchd 시작 시 막히지 않도록 "Always Allow"를 선택하세요.

  </Accordion>
  <Accordion title="Anthropic token (setup-token paste)">
    아무 머신에서나 `claude setup-token`을 실행한 뒤 token을 붙여 넣습니다.
    이름을 지정할 수 있으며, 비워 두면 기본값을 씁니다.
  </Accordion>
  <Accordion title="OpenAI Code subscription (Codex CLI reuse)">
    `~/.codex/auth.json`이 있으면 마법사가 재사용할 수 있습니다.
  </Accordion>
  <Accordion title="OpenAI Code subscription (OAuth)">
    브라우저 플로우를 사용하고 `code#state`를 붙여 넣습니다.

    model이 unset이거나 `openai/*`일 때 `agents.defaults.model`을 `openai-codex/gpt-5.4`로 설정합니다.

  </Accordion>
  <Accordion title="OpenAI API key">
    `OPENAI_API_KEY`가 있으면 재사용하고, 없으면 키를 물은 뒤 auth profile에 저장합니다.

    model이 unset, `openai/*`, `openai-codex/*`이면 `agents.defaults.model`을 `openai/gpt-5.1-codex`로 설정합니다.

  </Accordion>
  <Accordion title="xAI (Grok) API key">
    `XAI_API_KEY`를 물어 보고 xAI를 model provider로 구성합니다.
  </Accordion>
  <Accordion title="OpenCode">
    `OPENCODE_API_KEY`(또는 `OPENCODE_ZEN_API_KEY`)를 물어 보고 Zen 또는 Go catalog를 선택하게 합니다.
    설정 URL: [opencode.ai/auth](https://opencode.ai/auth)
  </Accordion>
  <Accordion title="API key (generic)">
    API key를 입력받아 저장합니다.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    `AI_GATEWAY_API_KEY`를 물어 봅니다.
    자세한 내용: [Vercel AI Gateway](/providers/vercel-ai-gateway)
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    account ID, gateway ID, `CLOUDFLARE_AI_GATEWAY_API_KEY`를 물어 봅니다.
    자세한 내용: [Cloudflare AI Gateway](/providers/cloudflare-ai-gateway)
  </Accordion>
  <Accordion title="MiniMax M2.5">
    config를 자동으로 작성합니다.
    자세한 내용: [MiniMax](/providers/minimax)
  </Accordion>
  <Accordion title="Synthetic (Anthropic-compatible)">
    `SYNTHETIC_API_KEY`를 물어 봅니다.
    자세한 내용: [Synthetic](/providers/synthetic)
  </Accordion>
  <Accordion title="Moonshot and Kimi Coding">
    Moonshot (Kimi K2)과 Kimi Coding config를 자동으로 작성합니다.
    자세한 내용: [Moonshot AI (Kimi + Kimi Coding)](/providers/moonshot)
  </Accordion>
  <Accordion title="Custom provider">
    OpenAI-compatible, Anthropic-compatible endpoint 모두 지원합니다.

    interactive onboarding은 다른 provider API key 흐름과 같은 저장 방식을 지원합니다.
    - **Paste API key now** (plaintext)
    - **Use secret reference** (env ref 또는 미리 구성한 provider ref, preflight validation 포함)

    non-interactive flags:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (선택 사항, 없으면 `CUSTOM_API_KEY`로 fallback)
    - `--custom-provider-id` (선택 사항)
    - `--custom-compatibility <openai|anthropic>` (선택 사항, 기본값 `openai`)

  </Accordion>
  <Accordion title="Skip">
    auth를 구성하지 않고 건너뜁니다.
  </Accordion>
</AccordionGroup>

Model 동작:

- 감지된 옵션 중 기본 model을 고르거나, provider와 model을 수동 입력할 수 있습니다.
- 마법사는 model check를 실행하고, 설정된 model을 모르거나 auth가 없으면 경고합니다.

Credential 및 profile 경로:

- OAuth credentials: `~/.openclaw/credentials/oauth.json`
- Auth profiles (API keys + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`

Credential 저장 모드:

- 기본 온보딩 동작은 API key를 auth profile 안에 plaintext로 저장합니다.
- `--secret-input-mode ref`를 사용하면 plaintext 대신 reference mode를 켭니다.
  interactive onboarding에서는 다음 중 하나를 고를 수 있습니다.
  - environment variable ref 예: `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`
  - provider alias + id를 사용하는 configured provider ref (`file` 또는 `exec`)
- interactive reference mode는 저장 전에 빠른 preflight validation을 수행합니다.
  - Env ref: 현재 onboarding environment에서 변수 이름과 비어 있지 않은 값을 검증
  - Provider ref: provider config를 검증하고 요청한 id를 해석
  - preflight가 실패하면 onboarding이 오류를 보여 주고 재시도를 허용
- non-interactive mode에서 `--secret-input-mode ref`는 env-backed 방식만 지원합니다.
  - onboarding process environment에 provider env var를 설정해야 합니다.
  - inline key flag(예: `--openai-api-key`)를 쓰더라도 대응 env var가 없으면 onboarding은 즉시 실패합니다.
  - custom provider에서 non-interactive `ref` mode는 `models.providers.<id>.apiKey`를 `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`로 저장합니다.
  - 이 custom-provider 경우 `--custom-api-key`를 쓰려면 `CUSTOM_API_KEY`가 설정되어 있어야 하며, 없으면 즉시 실패합니다.
- gateway auth credential도 interactive onboarding에서 plaintext와 SecretRef를 모두 지원합니다.
  - Token mode: **Generate/store plaintext token** (기본값) 또는 **Use SecretRef**
  - Password mode: plaintext 또는 SecretRef
- non-interactive token SecretRef 경로: `--gateway-token-ref-env <ENV_VAR>`
- 기존 plaintext 설정은 그대로 계속 동작합니다.

<Note>
headless/server 환경 팁: 브라우저가 있는 머신에서 OAuth를 완료한 뒤
`~/.openclaw/credentials/oauth.json` (또는 `$OPENCLAW_STATE_DIR/credentials/oauth.json`)을 gateway host로 복사하세요.
</Note>

## Outputs and internals

`~/.openclaw/openclaw.json`에 흔히 기록되는 필드:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (MiniMax를 선택한 경우)
- `tools.profile` (local onboarding은 값이 비어 있을 때 `"coding"`을 기본으로 넣고, 기존 explicit 값은 유지)
- `gateway.*` (mode, bind, auth, tailscale)
- `session.dmScope` (local onboarding은 값이 없을 때 `per-channel-peer`를 기본으로 넣고, 기존 explicit 값은 유지)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.signal.*`, `channels.imessage.*`
- prompt 중 opt-in했을 때의 channel allowlist(Slack, Discord, Matrix, Microsoft Teams). 가능하면 이름을 ID로 해석합니다.
- `skills.install.nodeManager`
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add`는 `agents.list[]`와 선택적 `bindings`를 기록합니다.

WhatsApp credential은 `~/.openclaw/credentials/whatsapp/<accountId>/` 아래에 저장됩니다.
session은 `~/.openclaw/agents/<agentId>/sessions/` 아래에 저장됩니다.

<Note>
일부 channel은 plugin 형태로 전달됩니다. 온보딩 중 선택하면 channel config 전에 plugin 설치(npm 또는 local path)를 먼저 물어 봅니다.
</Note>

Gateway wizard RPC:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

macOS 앱과 Control UI 같은 client는 온보딩 로직을 다시 구현하지 않고도 이 step을 렌더링할 수 있습니다.

Signal setup 동작:

- 적절한 release asset을 다운로드
- `~/.openclaw/tools/signal-cli/<version>/` 아래에 저장
- config에 `channels.signal.cliPath` 기록
- JVM build는 Java 21 필요
- 가능하면 native build를 사용
- Windows는 WSL2를 사용하며, WSL 내부에서 Linux signal-cli 흐름을 따름

## Related docs

- Onboarding hub: [Onboarding Wizard (CLI)](/start/wizard)
- Automation and scripts: [CLI Automation](/start/wizard-cli-automation)
- Command reference: [`openclaw onboard`](/cli/onboard)
