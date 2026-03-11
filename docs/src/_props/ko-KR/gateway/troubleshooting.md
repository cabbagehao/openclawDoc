---
summary: "Gateway, 통신 채널, 자동화, 노드 및 브라우저 관련 심층 문제 해결 가이드"
read_when:
  - 문제 해결 허브를 통해 보다 심층적인 진단이 필요할 때
  - 특정 증상별 대응 절차와 정확한 확인 명령어가 필요할 때
title: "문제 해결"
x-i18n:
  source_path: "gateway/troubleshooting.md"
---

# Gateway 문제 해결 (Troubleshooting)

본 문서는 심층적인 문제 해결을 위한 실행 가이드(Runbook)임. 빠른 자가 진단 흐름이 필요한 경우 [빠른 문제 해결 가이드](/help/troubleshooting)를 먼저 참조함.

## 진단 명령어 계층 (Command Ladder)

문제 발생 시 다음 명령어를 순서대로 실행하여 상태를 점검함:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

**정상 상태의 주요 신호:**

* `openclaw gateway status`: `Runtime: running` 및 `RPC probe: ok` 표시.
* `openclaw doctor`: 실행을 차단하는 설정이나 서비스 이슈가 보고되지 않음.
* `openclaw channels status --probe`: 각 채널이 `connected` 또는 `ready` 상태임.

## Anthropic 429: 긴 컨텍스트 사용량 초과 오류

로그나 오류 메시지에 `HTTP 429: rate_limit_error: Extra usage is required for long context requests`가 포함된 경우임.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

**체크리스트:**

* 선택된 Anthropic 모델(Opus/Sonnet)에 `params.context1m: true` 설정이 되어 있는지 확인.
* 현재 사용 중인 Anthropic 자격 증명이 긴 컨텍스트(1M Beta) 사용 권한을 보유했는지 확인.
* 1M Beta 경로가 필요한 매우 긴 세션이나 모델 실행에서만 요청이 실패하는지 확인.

**해결 방법:**

1. 해당 모델의 `context1m` 설정을 비활성화하여 일반 컨텍스트 창으로 폴백(Fallback)함.
2. 유료 결제가 가능한 Anthropic API 키를 사용하거나, 구독 계정에서 '추가 사용량(Extra Usage)' 옵션을 활성화함.
3. Anthropic의 긴 컨텍스트 요청이 거부되더라도 대화가 중단되지 않도록 폴백 모델을 구성함.

**관련 문서:**

* [Anthropic 공급자 설정](/providers/anthropic)
* [토큰 사용량 레퍼런스](/reference/token-use)
* [자주 묻는 질문: Anthropic 429 오류](/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## 응답 없음 (No Replies)

채널 연결은 정상이지만 에이전트가 응답하지 않는 경우, 재연결을 시도하기 전 라우팅 및 정책 설정을 먼저 점검함.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

**체크리스트:**

* 개인 대화(DM) 발신자의 페어링 승인이 보류(`pending`) 중인지 확인.
* 그룹 대화 멘션 게이팅(`requireMention`, `mentionPatterns`) 설정 확인.
* 채널 또는 그룹의 허용 목록(`allowlist`) 불일치 여부 확인.

**주요 로그 시그니처:**

* `drop guild message (mention required)`: 멘션이 없어 그룹 메시지를 무시함.
* `pairing request`: 발신자에 대한 관리자 승인이 필요함.
* `blocked` / `allowlist`: 정책에 의해 발신자 또는 채널이 필터링됨.

**관련 문서:**

* [채널 문제 해결](/channels/troubleshooting)
* [페어링 가이드](/channels/pairing)
* [그룹 대화 관리](/channels/groups)

## 대시보드 및 제어 UI 접속 불가

대시보드 또는 제어 UI가 연결되지 않는 경우 접속 URL, 인증 모드 및 보안 컨텍스트(HTTPS) 가정을 검증함.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

**체크리스트:**

* 접속하려는 Probe URL 및 대시보드 URL의 정확성 확인.
* 클라이언트와 Gateway 간의 인증 모드(Auth mode) 및 토큰 일치 여부 확인.
* 기기 인증이 필요한 환경에서 비보안 HTTP를 사용하고 있지 않은지 확인.

**주요 로그 시그니처:**

* `device identity required`: 보안 컨텍스트가 아니거나 기기 인증 정보가 누락됨.
* `device nonce required` / `device nonce mismatch`: 챌린지 기반 기기 인증 흐름(`connect.challenge` + `device.nonce`)이 완료되지 않음.
* `device signature invalid` / `device signature expired`: 서명 페이로드가 잘못되었거나 타임스탬프가 만료됨.
* `unauthorized` / 재연결 루프: 토큰 또는 비밀번호가 일치하지 않음.
* `gateway connect failed:`: 호스트, 포트 또는 URL 대상이 잘못 지정됨.

**기기 인증 v2 마이그레이션 점검:**
로그에 논스(Nonce)나 서명 오류가 표시된다면 연결 클라이언트를 업데이트하고 다음을 확인함:

1. `connect.challenge` 이벤트를 정상적으로 수신하는지.
2. 수신한 챌린지에 바인딩된 페이로드에 서명하는지.
3. 동일한 챌린지 논스를 `connect.params.device.nonce` 필드에 포함하여 전송하는지.

**관련 문서:**

* [제어 UI 가이드](/web/control-ui)
* [인증 설정](/gateway/authentication)
* [원격 액세스](/gateway/remote)

## Gateway 서비스 실행 실패

서비스가 설치되었으나 프로세스가 상주하지 못하고 종료되는 경우임.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep
```

**체크리스트:**

* `Runtime: stopped` 메시지와 함께 표시되는 종료 사유 확인.
* CLI 실행 시와 서비스 실행 시의 설정 불일치 여부 확인 (`Config (cli)` vs `Config (service)`).
* 포트 또는 리스너 충돌 여부 점검.

**주요 로그 시그니처:**

* `Gateway start blocked: set gateway.mode=local`: 로컬 Gateway 모드가 활성화되지 않음. 설정 파일에서 `gateway.mode="local"`로 변경하거나 `openclaw configure`를 실행함. (Podman 환경의 경우 `~openclaw/.openclaw/openclaw.json` 경로 확인)
* `refusing to bind gateway ... without auth`: 루프백 외부 바인딩 시 토큰/비밀번호 인증이 누락됨.
* `another gateway instance is already listening` / `EADDRINUSE`: 지정된 포트가 이미 사용 중임.

**관련 문서:**

* [백그라운드 프로세스 관리](/gateway/background-process)
* [Gateway 설정](/gateway/configuration)
* [Doctor 진단 도구](/gateway/doctor)

## 채널 연결은 되었으나 메시지 수신 불가

채널 상태는 '연결됨'이지만 메시지 흐름이 끊긴 경우, 정책과 권한 설정을 중점적으로 점검함.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

**체크리스트:**

* DM 정책(`pairing`, `allowlist`, `open`, `disabled`) 설정 확인.
* 그룹 허용 목록 및 멘션 필수 조건 충족 여부 확인.
* 채널 API 권한(Scopes) 또는 권한 부여 누락 여부 확인.

**주요 로그 시그니처:**

* `mention required`: 그룹 멘션 정책에 의해 메시지가 무시됨.
* `pairing` / 승인 대기 로그: 발신자가 승인된 목록에 없음.
* `missing_scope`, `not_in_channel`, `Forbidden`, `401/403`: 채널 인증 또는 API 권한 이슈.

**관련 문서:**

* [채널 문제 해결](/channels/troubleshooting)
* [WhatsApp 설정](/channels/whatsapp)
* [Telegram 설정](/channels/telegram)
* [Discord 설정](/channels/discord)

## 크론 및 하트비트 전송 실패

예약 작업이나 주기적 점검이 수행되지 않는 경우, 스케줄러 상태를 먼저 확인한 뒤 대상 채널을 점검함.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

**체크리스트:**

* 크론 기능이 활성화되어 있고 다음 실행 시점(`next wake`)이 존재하는지 확인.
* 작업 실행 이력 상태(`ok`, `skipped`, `error`) 확인.
* 하트비트 건너뜀 사유(`quiet-hours`, `requests-in-flight`, `alerts-disabled`) 확인.

**주요 로그 시그니처:**

* `cron: scheduler disabled; jobs will not run automatically`: 크론 기능이 꺼져 있음.
* `cron: timer tick failed`: 스케줄러 틱 실패. 파일 시스템이나 런타임 오류 확인 필요.
* `heartbeat skipped (reason=quiet-hours)`: 설정된 활동 시간대(Active hours) 외부임.
* `heartbeat: unknown accountId`: 하트비트 전송 대상 계정 ID가 유효하지 않음.
* `heartbeat skipped (reason=dm-blocked)`: 전송 대상이 DM 형식이지만 `directPolicy`가 `block`으로 설정됨.

**관련 문서:**

* [자동화 문제 해결](/automation/troubleshooting)
* [크론 예약 작업](/automation/cron-jobs)
* [하트비트 가이드](/gateway/heartbeat)

## 페어링된 노드 도구 실행 실패

노드 기기는 연결되어 있으나 도구 호출이 실패하는 경우, 포그라운드 유지 여부 및 권한 상태를 점검함.

```bash
openclaw nodes status
openclaw nodes describe --node <ID/이름/IP>
openclaw approvals get --node <ID/이름/IP>
openclaw logs --follow
openclaw status
```

**체크리스트:**

* 노드가 온라인 상태이며 예상된 역량(Capabilities)을 보유했는지 확인.
* OS 차원의 권한(카메라, 마이크, 위치, 화면 기록 등) 부여 여부 확인.
* 실행 승인(Exec approval) 및 허용 목록 상태 확인.

**주요 로그 시그니처:**

* `NODE_BACKGROUND_UNAVAILABLE`: 노드 앱이 반드시 포그라운드(화면 표시) 상태여야 함.
* `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED`: OS 보안 권한이 거부됨.
* `SYSTEM_RUN_DENIED: approval required`: 실행 승인 요청이 보류 중임.
* `SYSTEM_RUN_DENIED: allowlist miss`: 해당 명령어가 노드의 허용 목록에 없음.

**관련 문서:**

* [노드 문제 해결](/nodes/troubleshooting)
* [노드 관리 개요](/nodes/index)
* [실행 승인 가이드](/tools/exec-approvals)

## 브라우저 도구 실행 실패

Gateway는 정상이지만 브라우저 제어 작업만 실패하는 경우임.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

**체크리스트:**

* 브라우저 실행 파일 경로의 유효성 확인.
* CDP 프로필 도달 가능 여부 확인.
* `chrome` 프로필 사용 시 확장 프로그램 릴레이(Extension relay) 탭 연결 여부 확인.

**주요 로그 시그니처:**

* `Failed to start Chrome CDP on port`: 브라우저 프로세스 시작 실패.
* `browser.executablePath not found`: 설정된 실행 파일 경로가 잘못됨.
* `Chrome extension relay is running, but no tab is connected`: 릴레이는 작동 중이나 연결된 탭이 없음.
* `Browser attachOnly is enabled ... not reachable`: 연결 전용 프로필에 도달 가능한 대상이 없음.

**관련 문서:**

* [Linux 브라우저 문제 해결](/tools/browser-linux-troubleshooting)
* [Chrome 확장 프로그램 연동](/tools/chrome-extension)
* [브라우저 도구 가이드](/tools/browser)

## 업그레이드 후 발생한 문제 대응

업그레이드 직후 발생하는 문제는 대부분 설정 누락(Drift)이나 강화된 기본 보안 정책 때문임.

### 1) 인증 및 URL 오버라이드 동작 변경

* `gateway.mode=remote`로 설정된 경우, 로컬 서비스가 정상이더라도 CLI 호출이 원격을 향하고 있을 수 있음.
* 명시적으로 `--url` 플래그를 사용하면 저장된 자격 증명을 자동으로 참조하지 않으므로 인증 정보를 직접 포함해야 함.

### 2) 바인딩 및 인증 가드레일 강화

* 루프백 외부 바인딩(`lan`, `tailnet`, `custom`)은 반드시 명시적인 인증 설정이 필요함.
* 이전 버전의 `gateway.token` 키는 더 이상 사용되지 않으며 `gateway.auth.token`을 사용해야 함.

### 3) 페어링 및 기기 인증 상태 변경

* 대시보드나 노드 접속을 위한 기기 승인이 보류 중인지 확인.
* 정책 변경 후 기존 발신자에 대한 DM 페어링 승인이 다시 필요한지 확인.

모든 점검 후에도 불일치가 지속된다면, 동일한 프로필 환경에서 서비스 메타데이터를 재설치함:

```bash
openclaw gateway install --force
openclaw gateway restart
```

**관련 문서:**

* [Gateway 페어링](/gateway/pairing)
* [인증 가이드](/gateway/authentication)
* [백그라운드 프로세스](/gateway/background-process)
