---
summary: "OpenClaw의 고급 설정 및 개발 워크플로우"
read_when:
  - 새로운 머신을 설정할 때
  - 개인 설정을 망치지 않고 최신 기능을 쓰고 싶을 때
title: "설정"
description: "OpenClaw를 새 머신에 설정하고 안정적인 앱 중심 워크플로우와 소스 기반 개발 워크플로우를 구성하는 방법을 안내합니다."
x-i18n:
  source_path: "start/setup.md"
---

# 설정

<Note>
처음 설정하는 경우에는 [Getting Started](/start/getting-started)부터 시작하세요.
마법사 세부 사항은 [Onboarding Wizard](/start/wizard)를 참고하세요.
</Note>

Last updated: 2026-01-01

## TL;DR

- **개인화는 저장소 밖에 둡니다:** `~/.openclaw/workspace` (workspace) + `~/.openclaw/openclaw.json` (config).
- **안정적인 워크플로우:** macOS 앱을 설치하고, 번들된 Gateway를 앱에 맡겨 실행합니다.
- **최신 개발 워크플로우:** `pnpm gateway:watch`로 직접 Gateway를 실행하고, macOS 앱을 Local mode로 연결합니다.

## 사전 요구사항 (소스 빌드 기준)

- Node `>=22`
- `pnpm`
- Docker (선택 사항, 컨테이너 기반 설정 또는 e2e 테스트에서만 필요. [Docker](/install/docker) 참고)

## 개인화 전략(업데이트 시 설정이 깨지지 않게)

"나에게 100% 맞춘 구성"과 쉬운 업데이트를 모두 원한다면, 커스터마이징은 다음 위치에 두세요.

- **Config:** `~/.openclaw/openclaw.json` (JSON/JSON5 유사 형식)
- **Workspace:** `~/.openclaw/workspace` (skills, prompts, memories 저장. 비공개 git repo 권장)

한 번만 초기 bootstrap을 수행합니다.

```bash
openclaw setup
```

이 저장소 안에서는 로컬 CLI 엔트리를 그대로 사용할 수 있습니다.

```bash
openclaw setup
```

아직 전역 설치가 없다면 `pnpm openclaw setup`으로 실행하세요.

## 이 저장소에서 Gateway 실행하기

`pnpm build` 후에는 패키징된 CLI를 직접 실행할 수 있습니다.

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## 안정적인 워크플로우(macOS 앱 우선)

1. **OpenClaw.app**을 설치하고 실행합니다(메뉴 막대 앱).
2. 온보딩/권한 체크리스트(TCC prompts)를 완료합니다.
3. Gateway가 **Local**로 설정되어 있고 실행 중인지 확인합니다(앱이 관리함).
4. 채널 surface를 연결합니다(예: WhatsApp).

```bash
openclaw channels login
```

5. 기본 점검:

```bash
openclaw health
```

현재 빌드에서 온보딩을 사용할 수 없다면:

- `openclaw setup`을 실행한 뒤 `openclaw channels login`을 실행하고, 이후 Gateway를 수동으로 시작하세요(`openclaw gateway`).

## 최신 개발 워크플로우(터미널에서 Gateway 실행)

목표: TypeScript Gateway를 개발하면서 hot reload를 사용하고, macOS 앱 UI는 계속 연결된 상태로 유지하는 것입니다.

### 0) (선택 사항) macOS 앱도 소스에서 실행하기

macOS 앱도 최신 상태로 돌리고 싶다면:

```bash
./scripts/restart-mac.sh
```

### 1) 개발용 Gateway 시작

```bash
pnpm install
pnpm gateway:watch
```

`gateway:watch`는 Gateway를 watch mode로 실행하고 TypeScript 변경 시 다시 로드합니다.

### 2) macOS 앱을 현재 실행 중인 Gateway에 연결

**OpenClaw.app**에서:

- Connection Mode: **Local**
  앱이 설정된 포트에서 실행 중인 Gateway에 연결합니다.

### 3) 확인

- 앱 안의 Gateway status가 **“Using existing gateway …”**로 표시되어야 합니다.
- 또는 CLI로 확인:

```bash
openclaw health
```

### 자주 걸리는 함정

- **포트 불일치:** Gateway WS 기본값은 `ws://127.0.0.1:18789`입니다. 앱과 CLI가 같은 포트를 쓰도록 맞추세요.
- **상태 저장 위치:**
  - Credentials: `~/.openclaw/credentials/`
  - Sessions: `~/.openclaw/agents/<agentId>/sessions/`
  - Logs: `/tmp/openclaw/`

## 자격 증명 저장 위치 맵

인증 문제를 디버깅하거나 백업 대상을 결정할 때 참고하세요.

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram bot token**: config/env 또는 `channels.telegram.tokenFile` (일반 파일만 허용, symlink 거부)
- **Discord bot token**: config/env 또는 SecretRef (env/file/exec providers)
- **Slack tokens**: config/env (`channels.slack.*`)
- **Pairing allowlists**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (default account)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (non-default accounts)
- **Model auth profiles**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **File-backed secrets payload (optional)**: `~/.openclaw/secrets.json`
- **Legacy OAuth import**: `~/.openclaw/credentials/oauth.json`
  자세한 내용: [Security](/gateway/security#credential-storage-map)

## 설정을 망치지 않고 업데이트하기

- `~/.openclaw/workspace`와 `~/.openclaw/`는 "내 데이터"로 보고, 개인 프롬프트나 config를 `openclaw` 저장소 안에 넣지 마세요.
- 소스 업데이트: `git pull` + `pnpm install` (lockfile이 바뀐 경우) 후 계속 `pnpm gateway:watch`를 사용하세요.

## Linux (systemd user service)

Linux 설치는 systemd **user** service를 사용합니다. 기본적으로 systemd는 logout/idle 시 user service를 중지하므로 Gateway도 종료됩니다. 온보딩은 이를 막기 위해 lingering을 자동 활성화하려고 시도하며, 필요하면 sudo를 요청할 수 있습니다. 아직도 꺼져 있다면 다음을 실행하세요.

```bash
sudo loginctl enable-linger $USER
```

항상 켜져 있어야 하거나 다중 사용자 서버라면 user service 대신 **system** service를 고려하세요(lingering 불필요). systemd 관련 내용은 [Gateway runbook](/gateway)를 참고하세요.

## 관련 문서

- [Gateway runbook](/gateway) (flags, supervision, ports)
- [Gateway configuration](/gateway/configuration) (config schema + examples)
- [Discord](/channels/discord) 및 [Telegram](/channels/telegram) (reply tags + replyToMode settings)
- [OpenClaw assistant setup](/start/openclaw)
- [macOS app](/platforms/macos) (gateway lifecycle)
