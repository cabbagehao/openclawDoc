---
summary: "CLI 온보딩 마법사: 게이트웨이, 워크스페이스, 채널 및 스킬에 대한 안내식 설정"
read_when:
  - 온보딩 마법사 실행 또는 구성 시
  - 새 머신 설정 시
title: "온보딩 마법사 (CLI)"
sidebarTitle: "온보딩: CLI"
x-i18n:
  source_path: "start/wizard.md"
  source_hash: "b3dfe75414d62468d6678fdeb23b81b7669d3c2083f7d8228737b6eec8d48bf4"
  provider: "anthropic"
  model: "claude-opus-4-6"
  workflow: 1
  generated_at: "2026-03-10T08:20:39.818Z"
---


# 온보딩 마법사 (CLI)

온보딩 마법사는 macOS, Linux 또는 Windows(WSL2 사용 시; 강력 권장)에서 OpenClaw를 설정하는 **권장** 방법입니다.
로컬 Gateway 또는 원격 Gateway 연결과 함께 채널, 스킬 및 워크스페이스 기본값을 하나의 안내 흐름으로 구성합니다.

```bash
openclaw onboard
```

<Info>
가장 빠른 첫 채팅: Control UI를 열면 됩니다(채널 설정 불필요). `openclaw dashboard`를 실행하고 브라우저에서 채팅하세요. 문서: [Dashboard](/web/dashboard).
</Info>

나중에 재구성하려면:

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json`은 비대화형 모드를 의미하지 않습니다. 스크립트의 경우 `--non-interactive`를 사용하세요.
</Note>

<Tip>
온보딩 마법사에는 웹 검색 단계가 포함되어 있어 제공업체(Perplexity, Brave, Gemini, Grok 또는 Kimi)를 선택하고 API 키를 붙여넣어 에이전트가 `web_search`를 사용할 수 있도록 할 수 있습니다. `openclaw configure --section web`으로 나중에 구성할 수도 있습니다. 문서: [Web tools](/tools/web).
</Tip>

## QuickStart vs Advanced

마법사는 **QuickStart**(기본값) 또는 **Advanced**(전체 제어)로 시작합니다.

<Tabs>
  <Tab title="QuickStart (기본값)">
    - 로컬 게이트웨이 (local loopback)
    - 워크스페이스 기본값 (또는 기존 워크스페이스)
    - Gateway 포트 **18789**
    - Gateway 인증 **Token** (자동 생성, local loopback에서도)
    - 새 로컬 설정의 도구 정책 기본값: `tools.profile: "coding"` (기존 명시적 프로필은 유지됨)
    - DM 격리 기본값: 로컬 온보딩은 설정되지 않은 경우 `session.dmScope: "per-channel-peer"`를 작성합니다. 세부 정보: [CLI Onboarding Reference](/start/wizard-cli-reference#outputs-and-internals)
    - Tailscale 노출 **Off**
    - Telegram + WhatsApp DM은 기본적으로 **allowlist** (전화번호 입력 요청됨)
  </Tab>
  <Tab title="Advanced (전체 제어)">
    - 모든 단계(모드, 워크스페이스, 게이트웨이, 채널, 데몬, 스킬)를 노출합니다.
  </Tab>
</Tabs>

## 마법사가 구성하는 항목

**로컬 모드(기본값)**는 다음 단계를 안내합니다:

1. **Model/Auth** — 지원되는 모든 제공업체/인증 흐름(API 키, OAuth 또는 setup-token) 선택, Custom Provider(OpenAI 호환, Anthropic 호환 또는 Unknown 자동 감지) 포함. 기본 모델을 선택하세요.
   보안 참고: 이 에이전트가 도구를 실행하거나 webhook/hooks 콘텐츠를 처리하는 경우, 사용 가능한 가장 강력한 최신 세대 모델을 선호하고 도구 정책을 엄격하게 유지하세요. 약하거나 오래된 계층은 프롬프트 주입에 더 취약합니다.
   비대화형 실행의 경우, `--secret-input-mode ref`는 일반 텍스트 API 키 값 대신 인증 프로필에 환경 변수 기반 참조를 저장합니다.
   비대화형 `ref` 모드에서는 제공업체 환경 변수가 설정되어야 합니다. 해당 환경 변수 없이 인라인 키 플래그를 전달하면 빠르게 실패합니다.
   대화형 실행에서 비밀 참조 모드를 선택하면 환경 변수 또는 구성된 제공업체 참조(`file` 또는 `exec`)를 가리킬 수 있으며, 저장 전에 빠른 사전 검증이 수행됩니다.
2. **Workspace** — 에이전트 파일 위치 (기본값 `~/.openclaw/workspace`). 부트스트랩 파일을 시드합니다.
3. **Gateway** — 포트, 바인드 주소, 인증 모드, Tailscale 노출.
   대화형 토큰 모드에서는 기본 일반 텍스트 토큰 저장소를 선택하거나 SecretRef를 선택할 수 있습니다.
   비대화형 토큰 SecretRef 경로: `--gateway-token-ref-env <ENV_VAR>`.
4. **Channels** — WhatsApp, Telegram, Discord, Google Chat, Mattermost, Signal, BlueBubbles 또는 iMessage.
5. **Daemon** — LaunchAgent(macOS) 또는 systemd 사용자 유닛(Linux/WSL2)을 설치합니다.
   토큰 인증에 토큰이 필요하고 `gateway.auth.token`이 SecretRef로 관리되는 경우, 데몬 설치는 이를 검증하지만 해결된 토큰을 슈퍼바이저 서비스 환경 메타데이터에 유지하지 않습니다.
   토큰 인증에 토큰이 필요하고 구성된 토큰 SecretRef가 해결되지 않은 경우, 데몬 설치는 실행 가능한 안내와 함께 차단됩니다.
   `gateway.auth.token`과 `gateway.auth.password`가 모두 구성되어 있고 `gateway.auth.mode`가 설정되지 않은 경우, 모드가 명시적으로 설정될 때까지 데몬 설치가 차단됩니다.
6. **Health check** — Gateway를 시작하고 실행 중인지 확인합니다.
7. **Skills** — 권장 스킬 및 선택적 종속성을 설치합니다.

<Note>
마법사를 다시 실행해도 명시적으로 **Reset**을 선택하거나 `--reset`을 전달하지 않는 한 아무것도 삭제되지 않습니다.
CLI `--reset`은 기본적으로 구성, 자격 증명 및 세션을 대상으로 합니다. 워크스페이스를 포함하려면 `--reset-scope full`을 사용하세요.
구성이 유효하지 않거나 레거시 키를 포함하는 경우, 마법사는 먼저 `openclaw doctor`를 실행하도록 요청합니다.
</Note>

**원격 모드**는 다른 곳에 있는 Gateway에 연결하도록 로컬 클라이언트만 구성합니다.
원격 호스트에 아무것도 설치하거나 변경하지 **않습니다**.

## 다른 에이전트 추가

`openclaw agents add <name>`을 사용하여 자체 워크스페이스, 세션 및 인증 프로필을 가진 별도의 에이전트를 생성하세요. `--workspace` 없이 실행하면 마법사가 시작됩니다.

설정 항목:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

참고:

- 기본 워크스페이스는 `~/.openclaw/workspace-<agentId>`를 따릅니다.
- 인바운드 메시지를 라우팅하려면 `bindings`를 추가하세요(마법사가 이를 수행할 수 있음).
- 비대화형 플래그: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## 전체 참조

단계별 세부 분석, 비대화형 스크립팅, Signal 설정, RPC API 및 마법사가 작성하는 구성 필드의 전체 목록은 [Wizard Reference](/reference/wizard)를 참조하세요.

## 관련 문서

- CLI 명령 참조: [`openclaw onboard`](/cli/onboard)
- 온보딩 개요: [Onboarding Overview](/start/onboarding-overview)
- macOS 앱 온보딩: [Onboarding](/start/onboarding)
- 에이전트 첫 실행 의식: [Agent Bootstrapping](/start/bootstrapping)
