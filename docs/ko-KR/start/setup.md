---
summary: "OpenClaw의 고급 설정 및 개발 워크플로"
read_when:
  - 새 머신 설정 시
  - 개인 설정을 손상시키지 않고 "최신 + 최고" 버전을 원할 때
title: "설정"
x-i18n:
  source_path: "start/setup.md"
  source_hash: "971b07c55c51c44685450fb7256cbe6aad38e45e13ac04526148f6e08b27b35b"
  provider: "anthropic"
  model: "claude-opus-4-6"
  workflow: 1
  generated_at: "2026-03-10T08:20:09.395Z"
---


# 설정

<Note>
처음 설정하는 경우 [시작하기](/start/getting-started)부터 시작하세요.
마법사 세부 정보는 [온보딩 마법사](/start/wizard)를 참조하세요.
</Note>

마지막 업데이트: 2026-01-01

## 요약

- **맞춤 설정은 저장소 외부에 위치:** `~/.openclaw/workspace` (작업 공간) + `~/.openclaw/openclaw.json` (설정).
- **안정적인 워크플로:** macOS 앱을 설치하고 번들된 Gateway를 실행하도록 합니다.
- **최신 워크플로:** `pnpm gateway:watch`를 통해 직접 Gateway를 실행한 다음 macOS 앱이 Local 모드로 연결하도록 합니다.

## 사전 요구 사항 (소스에서)

- Node `>=22`
- `pnpm`
- Docker (선택 사항; 컨테이너화된 설정/e2e 전용 — [Docker](/install/docker) 참조)

## 맞춤 설정 전략 (업데이트 시 문제 방지)

"100% 나에게 맞춤" _및_ 쉬운 업데이트를 원한다면 다음에 맞춤 설정을 유지하세요:

- **설정:** `~/.openclaw/openclaw.json` (JSON/JSON5 형식)
- **작업 공간:** `~/.openclaw/workspace` (skills, prompts, memories; 비공개 git 저장소로 만드세요)

한 번 부트스트랩:

```bash
openclaw setup
```

이 저장소 내부에서 로컬 CLI 진입점을 사용:

```bash
openclaw setup
```

아직 전역 설치가 없다면 `pnpm openclaw setup`을 통해 실행하세요.

## 이 저장소에서 Gateway 실행

`pnpm build` 후 패키징된 CLI를 직접 실행할 수 있습니다:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## 안정적인 워크플로 (macOS 앱 우선)

1. **OpenClaw.app** 설치 + 실행 (메뉴 바).
2. 온보딩/권한 체크리스트 완료 (TCC 프롬프트).
3. Gateway가 **Local**이고 실행 중인지 확인 (앱이 관리함).
4. 표면 연결 (예: WhatsApp):

```bash
openclaw channels login
```

5. 정상 작동 확인:

```bash
openclaw health
```

빌드에서 온보딩을 사용할 수 없는 경우:

- `openclaw setup`을 실행한 다음 `openclaw channels login`을 실행하고 Gateway를 수동으로 시작하세요 (`openclaw gateway`).

## 최신 워크플로 (터미널에서 Gateway)

목표: TypeScript Gateway 작업, 핫 리로드 활용, macOS 앱 UI 연결 유지.

### 0) (선택 사항) 소스에서 macOS 앱도 실행

macOS 앱도 최신 버전으로 원한다면:

```bash
./scripts/restart-mac.sh
```

### 1) 개발 Gateway 시작

```bash
pnpm install
pnpm gateway:watch
```

`gateway:watch`는 게이트웨이를 watch 모드로 실행하고 TypeScript 변경 시 다시 로드합니다.

### 2) macOS 앱을 실행 중인 Gateway에 연결

**OpenClaw.app**에서:

- 연결 모드: **Local**
  앱이 구성된 포트에서 실행 중인 게이트웨이에 연결됩니다.

### 3) 확인

- 앱 내 Gateway 상태가 **"Using existing gateway …"**로 표시되어야 함
- 또는 CLI를 통해:

```bash
openclaw health
```

### 일반적인 함정

- **잘못된 포트:** Gateway WS 기본값은 `ws://127.0.0.1:18789`; 앱 + CLI를 동일한 포트에 유지하세요.
- **상태 저장 위치:**
  - 자격 증명: `~/.openclaw/credentials/`
  - 세션: `~/.openclaw/agents/<agentId>/sessions/`
  - 로그: `/tmp/openclaw/`

## 자격 증명 저장 맵

인증 디버깅 또는 백업 대상 결정 시 사용:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram 봇 토큰**: config/env 또는 `channels.telegram.tokenFile`
- **Discord 봇 토큰**: config/env 또는 SecretRef (env/file/exec 제공자)
- **Slack 토큰**: config/env (`channels.slack.*`)
- **페어링 허용 목록**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (기본 계정)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (비기본 계정)
- **모델 인증 프로필**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **파일 기반 비밀 페이로드 (선택 사항)**: `~/.openclaw/secrets.json`
- **레거시 OAuth 가져오기**: `~/.openclaw/credentials/oauth.json`
  자세한 내용: [보안](/gateway/security#credential-storage-map).

## 업데이트 (설정 손상 없이)

- `~/.openclaw/workspace`와 `~/.openclaw/`를 "내 것"으로 유지; 개인 프롬프트/설정을 `openclaw` 저장소에 넣지 마세요.
- 소스 업데이트: `git pull` + `pnpm install` (lockfile 변경 시) + `pnpm gateway:watch` 계속 사용.

## Linux (systemd 사용자 서비스)

Linux 설치는 systemd **사용자** 서비스를 사용합니다. 기본적으로 systemd는 로그아웃/유휴 시 사용자 서비스를 중지하여 Gateway를 종료합니다. 온보딩은 자동으로 lingering을 활성화하려고 시도합니다 (sudo 프롬프트 가능). 여전히 꺼져 있다면 실행하세요:

```bash
sudo loginctl enable-linger $USER
```

상시 가동 또는 다중 사용자 서버의 경우 사용자 서비스 대신 **시스템** 서비스를 고려하세요 (lingering 불필요). systemd 참고 사항은 [Gateway 런북](/gateway)을 참조하세요.

## 관련 문서

- [Gateway 런북](/gateway) (플래그, 감독, 포트)
- [Gateway 구성](/gateway/configuration) (설정 스키마 + 예제)
- [Discord](/channels/discord) 및 [Telegram](/channels/telegram) (답장 태그 + replyToMode 설정)
- [OpenClaw 어시스턴트 설정](/start/openclaw)
- [macOS 앱](/platforms/macos) (게이트웨이 수명 주기)
