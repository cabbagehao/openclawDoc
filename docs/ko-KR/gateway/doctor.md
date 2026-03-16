---
description: openclaw doctor 명령으로 설정 마이그레이션, 상태 점검, 인증 확인, 서비스 복구를 수행하는 방법
summary: "Doctor 명령어: 시스템 헬스 체크, 설정 마이그레이션 및 자동 복구 절차 안내"
read_when:
  - Doctor 마이그레이션 로직을 추가하거나 수정할 때
  - 하위 호환성을 깨트리는 설정 변경(Breaking changes)을 도입할 때
title: "Doctor"
x-i18n:
  source_path: "gateway/doctor.md"
---

# Doctor

`openclaw doctor`는 OpenClaw의 복구 및 마이그레이션 도구입니다. 오래된 config와 state를 정리하고, health를 점검하며, 실행 가능한 복구 단계를 제시합니다.

## 빠른 시작

```bash
openclaw doctor
```

### 헤드리스 / 자동화 모드

```bash
openclaw doctor --yes
```

해당하는 경우 재시작, 서비스 복구, 샌드박스 수정 단계를 포함해 사용자 프롬프트 없이 기본값을 수락합니다.

```bash
openclaw doctor --repair
```

사용자 확인 없이 권장 복구 조치를 적용합니다. 안전한 범위의 복구와 재시작이 포함됩니다.

```bash
openclaw doctor --repair --force
```

커스텀 supervisor config를 덮어쓰는 등 더 공격적인 복구 조치까지 적용합니다.

```bash
openclaw doctor --non-interactive
```

사용자 상호작용 없이 실행하며, 안전한 마이그레이션(설정 정규화, 디스크 state 이동)만 적용합니다. 사용자 확인이 필요한 재시작, 서비스 관리, 샌드박스 조치는 건너뜁니다. 레거시 state 마이그레이션은 감지 시 자동으로 수행됩니다.

```bash
openclaw doctor --deep
```

시스템 서비스(launchd, systemd, schtasks)를 스캔해 추가 Gateway 설치 흔적이 있는지 확인합니다.

변경 사항을 쓰기 전에 내용을 검토하려면 먼저 config 파일을 확인하세요.

```bash
cat ~/.openclaw/openclaw.json
```

## 주요 기능 요약

- 선택적 사전 업데이트(Git 설치본, 대화형 모드 전용)
- UI protocol 최신성 점검 및 필요 시 Control UI 재빌드
- health check 및 재시작 프롬프트
- skills 상태 요약(사용 가능/누락/차단)
- 레거시 config 정규화
- `models.providers.opencode` 등 OpenCode provider override 경고
- 세션, agent 디렉터리, WhatsApp auth 등 레거시 디스크 state 마이그레이션
- `jobId`, `schedule.cron`, payload/delivery 필드 등 레거시 cron store 정리
- 세션, transcript, state 디렉터리 무결성 및 권한 점검
- OAuth 만료, 토큰 갱신, auth-profile cooldown/disabled 상태 점검
- 중복 workspace 디렉터리 감지
- sandbox 이미지 복구
- 레거시 서비스 마이그레이션과 gateway 포트 충돌(`18789`) 진단
- Node vs Bun, version-manager 경로 등 gateway runtime 모범 사례 점검
- 개방형 DM 정책 등 보안 경고
- Linux systemd linger 확인
- 업데이트된 config와 wizard metadata 기록

## 상세 동작 원리 및 근거

### 1) 설정 정규화 (Config normalization)

설정 파일에 채널별 오버라이드가 없는 전역 설정(예: `messages.ackReaction`) 등 레거시 형식이 포함된 경우, 이를 현재 스키마 규격으로 정규화함.

### 2) 레거시 설정 키 마이그레이션

더 이상 사용되지 않는 키가 감지되면 시스템은 실행을 거부하고 `openclaw doctor` 실행을 요청함.

**Doctor 수행 내용:**
- 발견된 레거시 키 목록 설명.
- 적용될 마이그레이션 내용 표시.
- 최신 스키마를 적용하여 `~/.openclaw/openclaw.json` 파일 재기록.

Gateway 실행 시에도 레거시 형식이 감지되면 자동으로 마이그레이션을 시도하므로, 수동 조작 없이도 설정을 최신 상태로 유지할 수 있음.

**현재 지원되는 마이그레이션 항목:**
- `routing.allowFrom` → `channels.whatsapp.allowFrom`
- `routing.groupChat.requireMention` → `channels.<provider>.groups."*".requireMention`
- `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
- `routing.queue` → `messages.queue`
- `routing.bindings` → 최상위 `bindings`
- `routing.agents`/`routing.defaultAgentId` → `agents.list` 및 `agents.list[].default`
- `routing.agentToAgent` → `tools.agentToAgent`
- `agent.*` → `agents.defaults` 및 `tools.*` (tools/elevated/exec/sandbox/subagents)
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`

또한, 다중 계정 채널에서 `defaultAccount` 설정이 누락되어 예기치 않은 라우팅이 발생할 수 있는 경우에 대해서도 가이드를 제공함.

### 3) 디스크 레이아웃 마이그레이션

오래된 디스크 경로 구조를 최신 구조로 자동 이동함:
- **세션 및 트랜스크립트**: `~/.openclaw/sessions/` → `~/.openclaw/agents/<agentId>/sessions/`
- **에이전트 디렉터리**: `~/.openclaw/agent/` → `~/.openclaw/agents/<agentId>/agent/`
- **WhatsApp 인증 정보**: `~/.openclaw/credentials/*.json` → `~/.openclaw/credentials/whatsapp/<accountId>/`

이 과정은 멱등성(Idempotent)을 유지하며 안전하게 수행됨. WhatsApp 인증 정보의 경우 반드시 `openclaw doctor`를 통해서만 마이그레이션되도록 설계됨.

### 4) 상태 무결성 점검 (세션, 라우팅 및 보안)

상태 디렉터리는 시스템의 핵심 데이터를 담고 있음. 해당 경로에 문제가 생기면 세션, 인증 정보, 로그 등이 유실될 수 있음.

- **디렉터리 누락**: 데이터 유실 경고 및 디렉터리 재구성 제안.
- **파일 권한**: 쓰기 권한 확인 및 `chown` 등 복구 힌트 제공.
- **클라우드 동기화 경고**: iCloud Drive 등 동기화 경로 사용 시 I/O 지연 및 락(Lock) 경합 위험 알림.
- **저장 매체 수명**: SD 카드나 eMMC 환경에서 잦은 쓰기로 인한 수명 단축 및 성능 저하 경고 (Linux).
- **트랜스크립트 불일치**: 세션 엔트리에 대응하는 실제 파일이 없는 경우 경고.
- **설정 파일 보안**: `openclaw.json` 파일이 타인에게 읽기 권한이 부여된 경우 `600`으로 제한할 것을 권장함.

### 5) 모델 인증 상태 및 갱신 (OAuth)

인증 저장소의 OAuth 프로필을 검사하여 토큰 만료를 경고하고, 안전한 경우 자동 갱신을 수행함. Anthropic Claude Code 프로필이 만료된 경우 `setup-token` 재설정을 안내함. 갱신 프롬프트는 대화형(TTY) 환경에서만 표시됨.

### 6) 샌드박스 이미지 복구

샌드박싱 기능 활성화 시 Docker 이미지 존재 여부를 확인하고, 누락된 경우 빌드 또는 설정을 지원함.

### 7) 서비스(Supervisor) 구성 진단 및 복구

설치된 서비스 설정(launchd, systemd, schtasks)이 최신 기본값(네트워크 의존성, 재시작 지연 등)을 따르는지 확인함. 불일치 감지 시 업데이트를 권장하며 설정을 재기록할 수 있음.

**참고 사항:**
- 토큰 인증 사용 시, 시크릿 참조(SecretRef)로 관리되는 토큰 값은 서비스 환경 변수에 평문으로 노출되지 않도록 처리함.
- `gateway.auth.mode`가 명확하지 않은 경우 서비스 설치/복구 단계를 차단하고 설정을 요청함.
- Linux 사용자 systemd 유닛의 경우 `Environment=` 및 `EnvironmentFile=` 소스를 모두 대조하여 토큰 드리프트(Drift) 여부를 확인함.

### 8) 포트 충돌 및 런타임 진단

기본 포트(`18789`) 충돌 여부를 확인하고 원인(기존 프로세스, SSH 터널 등)을 진단함. 또한 서비스가 설치되었으나 실행 중이 아닌 상태를 감지하여 보고함.

### 9) 런타임 권장 사항 (Node.js)

Gateway 서비스가 Bun 또는 버전 관리 도구(nvm, fnm 등) 경로에서 실행되는 경우 경고를 표시함. WhatsApp 및 Telegram 채널은 Node.js 환경이 필수적이며, 버전 관리 도구 경로는 시스템 업데이트 시 서비스 실행이 중단될 위험이 있음. 가능하면 시스템 설치 Node.js(Homebrew, apt 등) 경로로 마이그레이션할 것을 권장함.

### 10) 워크스페이스 팁 (백업 및 메모리)

워크스페이스에 메모리 시스템이 구축되어 있지 않거나 Git으로 관리되고 있지 않은 경우, 데이터 보존 및 에이전트 성능 향상을 위한 백업 및 메모리 활용 팁을 제공함.

상세 내용은 [에이전트 워크스페이스 개념 가이드](/concepts/agent-workspace)를 참조함.
