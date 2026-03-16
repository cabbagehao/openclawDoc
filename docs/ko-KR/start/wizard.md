---
summary: "gateway, workspace, channels, skills를 안내형으로 설정하는 CLI 온보딩 마법사"
read_when:
  - 온보딩 마법사를 실행하거나 구성할 때
  - 새 머신을 설정할 때
title: "온보딩 마법사 (CLI)"
description: "OpenClaw의 gateway, workspace, channels, skills를 한 번에 안내형으로 설정하는 CLI 온보딩 마법사를 설명합니다."
sidebarTitle: "온보딩: CLI"
x-i18n:
  source_path: "start/wizard.md"
---

# 온보딩 마법사 (CLI)

온보딩 마법사는 macOS, Linux, Windows(WSL2 사용 강력 권장)에서 OpenClaw를 설정하는 **권장 방법**입니다.
하나의 안내형 흐름 안에서 로컬 Gateway 또는 원격 Gateway 연결, 그리고 channels, skills, workspace 기본값까지 함께 구성합니다.

```bash
openclaw onboard
```

<Info>
가장 빠른 첫 채팅 방법은 Control UI를 여는 것입니다(channel setup 불필요). `openclaw dashboard`를 실행하고 브라우저에서 바로 채팅하세요. 문서: [Dashboard](/web/dashboard).
</Info>

나중에 다시 구성하려면:

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json`은 non-interactive mode를 의미하지 않습니다. 스크립트에서는 `--non-interactive`를 사용하세요.
</Note>

<Tip>
온보딩 마법사에는 web search 단계가 포함되어 있어 provider(Perplexity, Brave, Gemini, Grok, Kimi)를 선택하고 API key를 붙여 넣어 에이전트가 `web_search`를 사용하도록 설정할 수 있습니다. 이 설정은 나중에 `openclaw configure --section web`으로도 바꿀 수 있습니다. 문서: [Web tools](/tools/web).
</Tip>

## QuickStart vs Advanced

마법사는 **QuickStart**(기본값 중심)와 **Advanced**(완전 제어) 중에서 시작합니다.

<Tabs>
  <Tab title="QuickStart (defaults)">
    - Local gateway (loopback)
    - Workspace 기본값(또는 기존 workspace)
    - Gateway port **18789**
    - Gateway auth **Token** (loopback에서도 자동 생성)
    - 새 로컬 설정의 tool policy 기본값: `tools.profile: "coding"` (기존에 명시한 profile은 유지)
    - DM isolation 기본값: 로컬 온보딩은 값이 없을 때 `session.dmScope: "per-channel-peer"`를 기록합니다. 자세한 내용: [CLI Onboarding Reference](/start/wizard-cli-reference#outputs-and-internals)
    - Tailscale 노출 **Off**
    - Telegram + WhatsApp DMs 기본값은 **allowlist** (전화번호를 입력하라는 안내가 나옴)
  </Tab>
  <Tab title="Advanced (full control)">
    - 모든 단계를 노출합니다(mode, workspace, gateway, channels, daemon, skills).
  </Tab>
</Tabs>

## What the wizard configures

**Local mode (default)**에서는 다음 단계를 안내합니다.

1. **Model/Auth**: 지원되는 provider/auth flow(API key, OAuth, setup-token) 중 하나를 선택합니다. Custom Provider(OpenAI-compatible, Anthropic-compatible, Unknown auto-detect 포함)도 가능합니다. 기본 model도 선택합니다.
   보안 참고: 이 agent가 tools를 실행하거나 webhook/hooks content를 처리할 예정이라면, 가능한 한 가장 강력한 최신 model을 사용하고 tool policy를 엄격하게 유지하세요. 약하거나 오래된 tier는 prompt injection에 더 취약합니다.
   non-interactive 실행에서는 `--secret-input-mode ref`가 auth profiles에 plaintext API key 대신 env-backed refs를 저장합니다.
   non-interactive `ref` mode에서는 provider env var가 반드시 설정되어 있어야 하며, 해당 env var 없이 inline key flags를 넘기면 즉시 실패합니다.
   interactive 실행에서 secret reference mode를 선택하면 environment variable 또는 구성된 provider ref(`file` 또는 `exec`)를 지정할 수 있으며, 저장 전에 빠른 preflight validation을 수행합니다.
2. **Workspace**: agent files 위치입니다 (기본값 `~/.openclaw/workspace`). bootstrap files를 생성합니다.
3. **Gateway**: port, bind address, auth mode, Tailscale exposure를 설정합니다.
   interactive token mode에서는 기본 plaintext token 저장을 사용하거나 SecretRef로 전환할 수 있습니다.
   non-interactive token SecretRef 경로: `--gateway-token-ref-env <ENV_VAR>`.
4. **Channels**: WhatsApp, Telegram, Discord, Google Chat, Mattermost, Signal, BlueBubbles, iMessage를 설정합니다.
5. **Daemon**: LaunchAgent(macOS) 또는 systemd user unit(Linux/WSL2)을 설치합니다.
   token auth에 token이 필요하고 `gateway.auth.token`이 SecretRef-managed라면, daemon install은 이를 검증하지만 해결된 token 값을 supervisor service environment metadata에 저장하지는 않습니다.
   token auth에 token이 필요하지만 구성된 token SecretRef를 해결할 수 없으면, daemon install은 실행 가능한 guidance를 보여주며 차단됩니다.
   `gateway.auth.token`과 `gateway.auth.password`가 모두 설정되어 있는데 `gateway.auth.mode`가 비어 있으면, mode를 명시적으로 설정할 때까지 daemon install이 차단됩니다.
6. **Health check**: Gateway를 시작하고 실제로 실행 중인지 확인합니다.
7. **Skills**: 권장 skills와 optional dependencies를 설치합니다.

<Note>
마법사를 다시 실행해도 **Reset**을 명시적으로 선택하거나 `--reset`을 주지 않는 한 아무것도 지워지지 않습니다.
CLI `--reset`의 기본 범위는 config, credentials, sessions이며, workspace까지 포함하려면 `--reset-scope full`을 사용하세요.
config가 유효하지 않거나 legacy keys가 있으면, 마법사는 먼저 `openclaw doctor`를 실행하라고 안내합니다.
</Note>

**Remote mode**는 이 local client가 다른 곳의 Gateway에 연결하도록만 설정합니다.
원격 host에는 **아무것도 설치하거나 변경하지 않습니다**.

## Add another agent

`openclaw agents add <name>`을 사용하면 별도의 workspace, sessions, auth profiles를 가진 agent를 만들 수 있습니다. `--workspace` 없이 실행하면 마법사가 시작됩니다.

What it sets:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Notes:

- 기본 workspaces는 `~/.openclaw/workspace-<agentId>` 형식을 따릅니다.
- incoming messages를 라우팅하려면 `bindings`를 추가하세요 (마법사에서도 가능).
- non-interactive flags: `--model`, `--agent-dir`, `--bind`, `--non-interactive`

## Full reference

단계별 세부 설명, non-interactive scripting, Signal 설정, RPC API, 그리고 마법사가 기록하는 config fields 전체 목록은 [Wizard Reference](/reference/wizard)를 참고하세요.

## 관련 문서

- CLI command reference: [`openclaw onboard`](/cli/onboard)
- 온보딩 개요: [Onboarding Overview](/start/onboarding-overview)
- macOS 앱 온보딩: [Onboarding](/start/onboarding)
- agent 첫 실행 의식: [Agent Bootstrapping](/start/bootstrapping)
