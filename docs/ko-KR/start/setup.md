---
summary: "OpenClaw의 심화 설정 가이드 및 개발 워크플로우 안내"
read_when:
  - 새로운 환경에 OpenClaw를 구축할 때
  - 개인 설정을 유지하면서 최신 기능을 안전하게 테스트하고 싶을 때
title: "설정 가이드"
x-i18n:
  source_path: "start/setup.md"
---

# 설정 가이드 (Setup)

<Note>
처음 OpenClaw를 시작한다면 [시작하기](/start/getting-started) 문서를 먼저 읽어볼 것을 권장함. 설정 마법사에 대한 상세 내용은 [온보딩 마법사](/start/wizard)를 참조함.
</Note>

최종 업데이트: 2026-01-01

## 핵심 요약 (TL;DR)

- **데이터 분리**: 사용자 맞춤 설정은 저장소 외부인 `~/.openclaw/workspace` (워크스페이스) 및 `~/.openclaw/openclaw.json` (설정 파일)에서 관리됨.
- **안정적인 워크플로우**: macOS 앱을 설치하여 내장된 Gateway를 사용하는 방식임.
- **최신 개발 워크플로우**: 터미널에서 `pnpm gateway:watch`로 직접 Gateway를 실행하고, macOS 앱을 **로컬(Local)** 모드로 연결하여 사용함.

## 사전 요구 사항 (소스 빌드 기준)

- Node.js `>=22`
- `pnpm` 패키지 매니저
- Docker (선택 사항: 컨테이너 기반 구축 시 필요 — [Docker 가이드](/install/docker) 참조)

## 개인화 전략 (안전한 업데이트를 위한 팁)

업데이트 시 개인 설정이 손상되는 것을 방지하려면 다음 위치에 커스텀 데이터를 유지함:

- **설정 파일**: `~/.openclaw/openclaw.json` (JSON/JSON5 규격)
- **워크스페이스**: `~/.openclaw/workspace` (스킬, 프롬프트, 기억 데이터 포함. 가급적 비공개 Git 저장소로 관리 권장)

초기 환경 구성 명령어:

```bash
openclaw setup
```

저장소 내부에서 직접 실행할 경우:

```bash
node openclaw.mjs setup
```

전역 설치 전이라면 `pnpm openclaw setup` 명령어를 사용함.

## 저장소에서 직접 Gateway 실행

`pnpm build` 완료 후, 패키징된 CLI를 직접 실행할 수 있음:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## 안정적인 운영 워크플로우 (macOS 앱 중심)

1. **OpenClaw.app** 설치 및 실행 (메뉴 막대 앱).
2. 온보딩 및 시스템 권한(TCC) 승인 절차 완료.
3. Gateway 연결 모드가 **로컬(Local)**로 설정되어 정상 작동하는지 확인 (앱이 서버를 직접 관리함).
4. 서비스 채널 연결 (예: WhatsApp):
   ```bash
   openclaw channels login
   ```
5. 상태 점검:
   ```bash
   openclaw health
   ```

만약 사용 중인 빌드에서 온보딩 기능을 사용할 수 없다면:
- `openclaw setup` 실행 -> `openclaw channels login` 수행 -> `openclaw gateway` 명령어로 서버 수동 시작.

## 개발용 워크플로우 (터미널 기반 Gateway)

목표: TypeScript 기반 Gateway 코드를 수정하면서 핫 리로드(Hot Reload) 기능을 활용하고, macOS 앱의 UI를 연결하여 유지함.

### 1. 개발용 Gateway 시작

```bash
pnpm install
pnpm gateway:watch
```

`gateway:watch` 명령어는 소스 코드 변경 시 자동으로 서버를 재시작함.

### 2. macOS 앱을 실행 중인 Gateway에 연결

- **OpenClaw.app** 설정에서 연결 모드를 **Local**로 지정함.
- 앱은 설정된 포트에서 이미 실행 중인 Gateway 인스턴스에 자동으로 연결됨.

### 3. 연결 확인

- 앱 내 Gateway 상태가 **"Using existing gateway …"**로 표시되는지 확인함.
- 또는 CLI 명령어로 확인:
  ```bash
   openclaw health
  ```

### 주요 주의 사항 (Footguns)

- **포트 충돌**: Gateway의 기본 WebSocket 주소는 `ws://127.0.0.1:18789`임. 앱과 CLI가 동일한 포트를 사용하도록 주의함.
- **데이터 저장 경로**:
  - 자격 증명(Credentials): `~/.openclaw/credentials/`
  - 세션 데이터: `~/.openclaw/agents/<agentId>/sessions/`
  - 시스템 로그: `/tmp/openclaw/`

## 자격 증명(Credential) 저장소 구조

인증 문제 디버깅이나 데이터 백업 시 다음 경로를 참조함:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram 봇 토큰**: 설정 파일, 환경 변수 또는 `channels.telegram.tokenFile` 경로.
- **Discord 봇 토큰**: 설정 파일, 환경 변수 또는 SecretRef 공급자.
- **Slack 토큰**: 설정 파일 또는 환경 변수 (`channels.slack.*`).
- **채널 허용 목록(Allowlist)**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (기본 계정)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (부계정)
- **모델 인증 프로필**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **파일 기반 시크릿(Secrets)**: `~/.openclaw/secrets.json` (선택 사항)

상세 정보: [자격 증명 저장소 맵](/gateway/security#credential-storage-map)

## 안전한 업데이트 방법

- `~/.openclaw/workspace` 및 `~/.openclaw/` 폴더를 프로젝트 저장소와 별개로 관리함. 개인적인 프롬프트나 설정을 프로젝트 내부에 직접 커밋하지 않음.
- 소스 업데이트 시: `git pull` -> `pnpm install` (Lock 파일 변경 시) -> `pnpm gateway:watch` 실행 순으로 진행함.

## Linux 환경 설정 (systemd 사용자 서비스)

Linux 환경에서는 systemd **사용자(User)** 서비스를 사용함. 기본적으로 systemd는 사용자가 로그아웃하거나 유휴 상태가 되면 사용자 서비스를 중단시키며, 이로 인해 Gateway가 종료될 수 있음. 온보딩 과정에서 자동으로 링거링(Lingering) 활성화를 시도하지만, 수동 설정이 필요한 경우 다음 명령어를 실행함:

```bash
sudo loginctl enable-linger $USER
```

다중 사용자 서버나 상시 가동이 필요한 경우, 사용자 서비스 대신 **시스템(System)** 서비스로 구성하는 것을 권장함. 관련 내용은 [Gateway 실행 가이드](/gateway)를 참조함.

## 관련 문서 목록

- [Gateway 실행 가이드(Runbook)](/gateway): 플래그 설정, 프로세스 감시, 포트 관리 상세.
- [Gateway 설정 레퍼런스](/gateway/configuration): 설정 스키마 및 다양한 예시.
- [Discord](/channels/discord) / [Telegram](/channels/telegram): 답장 태그 및 `replyToMode` 상세 설정.
- [개인 비서 구축 가이드](/start/openclaw)
- [macOS 앱 가이드](/platforms/macos): Gateway 생명주기 관리.
