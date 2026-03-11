---
summary: "CLI 온보딩 흐름, 인증/모델 설정, 출력, 내부 동작에 대한 전체 참조"
read_when:
  - `openclaw onboard`의 상세 동작이 필요할 때
  - 온보딩 결과를 디버깅하거나 온보딩 클라이언트를 통합할 때
title: "CLI 온보딩 레퍼런스"
sidebarTitle: "CLI 레퍼런스"
x-i18n:
  source_path: "start/wizard-cli-reference.md"
---

# CLI 온보딩 레퍼런스

이 페이지는 `openclaw onboard`에 대한 전체 참조입니다.
짧은 안내가 필요하면 [온보딩 마법사(CLI)](/start/wizard)를 참고하세요.

## 마법사가 하는 일

로컬 모드(기본값)에서는 다음 과정을 안내합니다.

- 모델 및 인증 설정(OpenAI Code 구독 OAuth, Anthropic API 키 또는 setup token, 그리고 MiniMax, GLM, Moonshot, AI Gateway 옵션)
- 워크스페이스 위치와 부트스트랩 파일 설정
- Gateway 설정(port, bind, auth, tailscale)
- 채널 및 제공업체(Telegram, WhatsApp, Discord, Google Chat, Mattermost 플러그인, Signal)
- 데몬 설치(LaunchAgent 또는 systemd user unit)
- 상태 확인(health check)
- 스킬 설정

원격 모드는 이 머신이 다른 곳에 있는 Gateway에 연결되도록 구성합니다.
원격 호스트에는 아무것도 설치하거나 수정하지 않습니다.

## 로컬 흐름 상세

<Steps>
  <Step title="기존 설정 감지">
    - `~/.openclaw/openclaw.json`이 있으면 유지, 수정, 초기화 중 하나를 선택합니다.
    - 마법사를 다시 실행해도 명시적으로 Reset을 선택하지 않는 한(또는 `--reset`을 넘기지 않는 한) 아무것도 지워지지 않습니다.
    - CLI의 `--reset` 기본값은 `config+creds+sessions`이며, 워크스페이스까지 제거하려면 `--reset-scope full`을 사용합니다.
    - 설정이 잘못되었거나 레거시 키를 포함하고 있으면, 마법사는 계속 진행하기 전에 `openclaw doctor`를 실행하라고 안내하고 멈춥니다.
    - Reset은 `trash`를 사용하며 다음 범위를 제공합니다.
      - 설정만 초기화
      - 설정 + 자격 증명 + 세션 초기화
      - 전체 초기화(워크스페이스도 제거)
  </Step>
  <Step title="모델과 인증">
    - 전체 선택지 매트릭스는 [인증 및 모델 옵션](#auth-and-model-options)에 있습니다.
  </Step>
  <Step title="워크스페이스">
    - 기본값은 `~/.openclaw/workspace`이며 변경할 수 있습니다.
    - 첫 실행 시 부트스트랩 절차에 필요한 워크스페이스 파일을 채웁니다.
    - 워크스페이스 레이아웃: [에이전트 워크스페이스](/concepts/agent-workspace)
  </Step>
  <Step title="Gateway">
    - port, bind, auth mode, tailscale 노출 여부를 묻습니다.
    - 권장 설정은 루프백만 쓰더라도 token auth를 유지해 로컬 WS 클라이언트가 인증하도록 하는 것입니다.
    - token 모드에서는 대화형 온보딩 시 다음 중 하나를 선택할 수 있습니다.
      - **평문 token 생성/저장**(기본값)
      - **SecretRef 사용**(선택)
    - password 모드에서도 대화형 온보딩은 평문 또는 SecretRef 저장을 지원합니다.
    - 비대화형 token SecretRef 경로는 `--gateway-token-ref-env <ENV_VAR>`입니다.
      - 온보딩 프로세스 환경에 비어 있지 않은 env var가 있어야 합니다.
      - `--gateway-token`과 함께 사용할 수 없습니다.
    - 모든 로컬 프로세스를 완전히 신뢰하는 경우가 아니라면 auth를 끄지 마세요.
    - 루프백이 아닌 bind에는 여전히 auth가 필요합니다.
  </Step>
  <Step title="채널">
    - [WhatsApp](/channels/whatsapp): 선택적 QR 로그인
    - [Telegram](/channels/telegram): bot token
    - [Discord](/channels/discord): bot token
    - [Google Chat](/channels/googlechat): 서비스 계정 JSON 파일 + webhook audience 값
    - [Mattermost](/channels/mattermost) 플러그인: bot token + base URL
    - [Signal](/channels/signal): 선택적 `signal-cli` 설치 + 계정 구성
    - [BlueBubbles](/channels/bluebubbles): iMessage용 권장 방식, server URL + password + webhook
    - [iMessage](/channels/imessage): 레거시 `imsg` CLI 경로 + DB 접근
    - DM 보안의 기본값은 페어링입니다. 첫 DM은 코드를 보내고, `openclaw pairing approve <channel> <code>`로 승인하거나 허용 목록을 사용할 수 있습니다.
  </Step>
  <Step title="데몬 설치">
    - macOS: LaunchAgent
      - 로그인된 사용자 세션이 필요하며, 헤드리스 환경에서는 커스텀 LaunchDaemon을 사용해야 합니다(기본 제공되지 않음).
    - Linux 및 Windows(WSL2 경유): systemd user unit
      - 로그아웃 후에도 Gateway가 유지되도록 마법사는 `loginctl enable-linger <user>`를 시도합니다.
      - sudo를 요청할 수 있습니다(`/var/lib/systemd/linger`에 기록). 우선 sudo 없이 시도합니다.
    - 런타임 선택: Node(권장, WhatsApp과 Telegram에 필요). Bun은 권장되지 않습니다.
  </Step>
  <Step title="상태 확인">
    - 필요하면 Gateway를 시작한 뒤 `openclaw health`를 실행합니다.
    - `openclaw status --deep`는 상태 출력에 Gateway 상태 점검 결과를 추가합니다.
  </Step>
  <Step title="스킬">
    - 사용 가능한 스킬을 읽고 요구 사항을 확인합니다.
    - node manager로 npm 또는 pnpm을 선택할 수 있습니다(bun은 권장되지 않음).
    - 선택적 의존성을 설치합니다(일부는 macOS에서 Homebrew 사용).
  </Step>
  <Step title="마무리">
    - iOS, Android, macOS 앱 옵션을 포함한 요약과 다음 단계를 보여줍니다.
  </Step>
</Steps>

<Note>
GUI가 감지되지 않으면 마법사는 브라우저를 여는 대신 Control UI용 SSH 포트 포워딩 안내를 출력합니다.
Control UI 자산이 없으면 마법사는 이를 빌드하려고 시도하며, 실패 시 `pnpm ui:build`를 사용합니다(UI 의존성 자동 설치).
</Note>

## 원격 모드 상세

원격 모드는 이 머신이 다른 곳에 있는 Gateway에 연결되도록 구성합니다.

<Info>
원격 모드는 원격 호스트에 아무것도 설치하거나 수정하지 않습니다.
</Info>

설정하는 항목:

- 원격 Gateway URL (`ws://...`)
- 원격 Gateway auth가 필요할 때의 token(권장)

<Note>
- Gateway가 루프백 전용이라면 SSH 터널링이나 Tailscale 네트워크를 사용하세요.
- 디스커버리 힌트:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)
</Note>

## 인증 및 모델 옵션

<AccordionGroup>
  <Accordion title="Anthropic API key">
    `ANTHROPIC_API_KEY`가 있으면 사용하고, 없으면 키를 입력받아 데몬에서 사용할 수 있도록 저장합니다.
  </Accordion>
  <Accordion title="Anthropic OAuth (Claude Code CLI)">
    - macOS: Keychain 항목 "Claude Code-credentials"를 확인합니다.
    - Linux 및 Windows: `~/.claude/.credentials.json`이 있으면 재사용합니다.

    macOS에서는 launchd 시작이 막히지 않도록 "Always Allow"를 선택하세요.

  </Accordion>
  <Accordion title="Anthropic token (setup-token paste)">
    아무 머신에서나 `claude setup-token`을 실행한 뒤 token을 붙여 넣습니다.
    이름을 지정할 수 있으며, 비워 두면 기본값을 사용합니다.
  </Accordion>
  <Accordion title="OpenAI Code subscription (Codex CLI reuse)">
    `~/.codex/auth.json`이 있으면 마법사가 이를 재사용할 수 있습니다.
  </Accordion>
  <Accordion title="OpenAI Code subscription (OAuth)">
    브라우저 흐름을 사용하며 `code#state`를 붙여 넣습니다.

    model이 비어 있거나 `openai/*`일 때 `agents.defaults.model`을 `openai-codex/gpt-5.4`로 설정합니다.

  </Accordion>
  <Accordion title="OpenAI API key">
    `OPENAI_API_KEY`가 있으면 사용하고, 없으면 키를 입력받아 auth profile에 자격 증명을 저장합니다.

    model이 비어 있거나 `openai/*`, `openai-codex/*`인 경우 `agents.defaults.model`을 `openai/gpt-5.1-codex`로 설정합니다.

  </Accordion>
  <Accordion title="xAI (Grok) API key">
    `XAI_API_KEY`를 입력받아 xAI를 모델 제공업체로 구성합니다.
  </Accordion>
  <Accordion title="OpenCode Zen">
    `OPENCODE_API_KEY`(또는 `OPENCODE_ZEN_API_KEY`)를 입력받습니다.
    설정 URL: [opencode.ai/auth](https://opencode.ai/auth)
  </Accordion>
  <Accordion title="API key (generic)">
    키를 대신 저장해 줍니다.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    `AI_GATEWAY_API_KEY`를 입력받습니다.
    자세한 내용: [Vercel AI Gateway](/providers/vercel-ai-gateway)
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    account ID, gateway ID, `CLOUDFLARE_AI_GATEWAY_API_KEY`를 입력받습니다.
    자세한 내용: [Cloudflare AI Gateway](/providers/cloudflare-ai-gateway)
  </Accordion>
  <Accordion title="MiniMax M2.5">
    설정이 자동으로 작성됩니다.
    자세한 내용: [MiniMax](/providers/minimax)
  </Accordion>
  <Accordion title="Synthetic (Anthropic-compatible)">
    `SYNTHETIC_API_KEY`를 입력받습니다.
    자세한 내용: [Synthetic](/providers/synthetic)
  </Accordion>
  <Accordion title="Moonshot and Kimi Coding">
    Moonshot(Kimi K2)과 Kimi Coding 설정은 자동으로 작성됩니다.
    자세한 내용: [Moonshot AI (Kimi + Kimi Coding)](/providers/moonshot)
  </Accordion>
  <Accordion title="Custom provider">
    OpenAI 호환 및 Anthropic 호환 엔드포인트에서 동작합니다.

    대화형 온보딩은 다른 제공업체 API 키 흐름과 동일한 저장 방식을 지원합니다.
    - **Paste API key now** (plaintext)
    - **Use secret reference** (env ref 또는 설정된 provider ref, 사전 검증 포함)

    비대화형 플래그:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (선택, 없으면 `CUSTOM_API_KEY` 사용)
    - `--custom-provider-id` (선택)
    - `--custom-compatibility <openai|anthropic>` (선택, 기본값 `openai`)

  </Accordion>
  <Accordion title="Skip">
    인증을 구성하지 않은 채로 둡니다.
  </Accordion>
</AccordionGroup>

모델 동작:

- 감지된 옵션에서 기본 model을 고르거나, provider와 model을 직접 입력합니다.
- 마법사는 model 점검을 수행하고, 구성된 model을 알 수 없거나 auth가 없으면 경고합니다.

자격 증명 및 profile 경로:

- OAuth 자격 증명: `~/.openclaw/credentials/oauth.json`
- Auth profile(API 키 + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`

자격 증명 저장 모드:

- 기본 온보딩 동작은 API 키를 auth profile 안에 평문 값으로 저장합니다.
- `--secret-input-mode ref`를 사용하면 plaintext 키 저장 대신 참조 모드를 사용합니다.
  대화형 온보딩에서는 다음 중 하나를 선택할 수 있습니다.
  - 환경 변수 참조 (예: `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - provider alias + id를 사용하는 provider ref (`file` 또는 `exec`)
- 대화형 참조 모드는 저장 전에 빠른 사전 검증(preflight validation)을 수행합니다.
  - Env ref: 변수 이름과 현재 온보딩 환경에서 비어 있지 않은 값인지 확인합니다.
  - Provider ref: provider 설정을 검증하고 요청한 id를 해석합니다.
  - 사전 검증이 실패하면 온보딩은 오류를 보여주고 다시 시도할 수 있게 합니다.
- 비대화형 모드에서 `--secret-input-mode ref`는 env 기반 방식만 지원합니다.
  - 온보딩 프로세스 환경에 provider env var를 설정해야 합니다.
  - 인라인 키 플래그(예: `--openai-api-key`)를 사용할 경우 해당 env var도 설정되어 있어야 하며, 없으면 온보딩이 즉시 실패합니다.
  - Custom provider의 비대화형 `ref` 모드는 `models.providers.<id>.apiKey`를 `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`로 저장합니다.
  - 이 Custom provider 경우 `--custom-api-key`를 쓰려면 `CUSTOM_API_KEY`가 설정되어 있어야 하며, 없으면 온보딩이 즉시 실패합니다.
- Gateway auth 자격 증명은 대화형 온보딩에서 plaintext와 SecretRef 모두 지원합니다.
  - token 모드: **평문 token 생성/저장**(기본값) 또는 **SecretRef 사용**
  - 비밀번호 모드: plaintext 또는 SecretRef
- 비대화형 token SecretRef 경로: `--gateway-token-ref-env <ENV_VAR>`
- 기존 plaintext 설정은 그대로 계속 동작합니다.

<Note>
헤드리스 및 서버 팁: 브라우저가 있는 머신에서 OAuth를 완료한 뒤
`~/.openclaw/credentials/oauth.json`(또는 `$OPENCLAW_STATE_DIR/credentials/oauth.json`)을
gateway host로 복사하세요.
</Note>

## 출력 및 내부 동작

`~/.openclaw/openclaw.json`에 자주 들어가는 필드:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (MiniMax를 선택한 경우)
- `tools.profile` (로컬 온보딩은 unset일 때 기본값으로 `"coding"`을 사용하며, 기존에 명시된 값은 유지됩니다)
- `gateway.*` (mode, bind, auth, tailscale)
- `session.dmScope` (로컬 온보딩은 unset일 때 기본값으로 `per-channel-peer`를 사용하며, 기존에 명시된 값은 유지됩니다)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.signal.*`, `channels.imessage.*`
- 프롬프트에서 선택하여 활성화할 때 채워지는 채널 허용 목록(Slack, Discord, Matrix, Microsoft Teams, 가능하면 이름을 ID로 해석)
- `skills.install.nodeManager`
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add`는 `agents.list[]`와 선택적 `bindings`를 기록합니다.

WhatsApp 자격 증명은 `~/.openclaw/credentials/whatsapp/<accountId>/` 아래에 저장됩니다.
세션은 `~/.openclaw/agents/<agentId>/sessions/` 아래에 저장됩니다.

<Note>
일부 채널은 플러그인으로 제공됩니다. 온보딩에서 이를 선택하면 마법사는 채널 구성을 시작하기 전에 플러그인 설치(npm 또는 로컬 경로)를 먼저 묻습니다.
</Note>

Gateway 마법사 RPC:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

클라이언트(macOS 앱과 Control UI)는 온보딩 로직을 다시 구현하지 않고도 각 단계를 렌더링할 수 있습니다.

Signal 설정 동작:

- 적절한 릴리스 파일 다운로드
- `~/.openclaw/tools/signal-cli/<version>/` 아래에 저장
- 설정에 `channels.signal.cliPath` 기록
- JVM 빌드는 Java 21 필요
- 가능하면 native build 사용
- Windows는 WSL2를 사용하며 WSL 내부에서 Linux signal-cli 흐름을 따릅니다

## 관련 문서

- 온보딩 허브: [온보딩 마법사(CLI)](/start/wizard)
- 자동화 및 스크립트: [CLI Automation](/start/wizard-cli-automation)
- 명령 참조: [`openclaw onboard`](/cli/onboard)
