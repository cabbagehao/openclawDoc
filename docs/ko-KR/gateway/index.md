---
summary: "Gateway 서비스의 실행 가이드(Runbook), 생명주기 관리 및 운영 방법 안내"
read_when:
  - Gateway 프로세스를 실행하거나 디버깅할 때
title: "Gateway 운영 가이드"
x-i18n:
  source_path: "gateway/index.md"
---

# Gateway 실행 가이드 (Runbook)

이 페이지는 Gateway 서비스의 초기 구축(Day-1) 및 지속적인 운영(Day-2)을 위한 절차를 설명함.

<CardGroup cols={2}>
  <Card title="심층 문제 해결" icon="siren" href="/gateway/troubleshooting">
    증상별 진단 사다리 및 로그 시그니처 분석 가이드.
  </Card>
  <Card title="설정 레퍼런스" icon="sliders" href="/gateway/configuration">
    작업 중심의 설정 가이드 및 전체 구성 요소 명세.
  </Card>
  <Card title="시크릿 관리" icon="key-round" href="/gateway/secrets">
    시크릿 참조(SecretRef) 규약, 런타임 스냅샷 동작 및 마이그레이션 안내.
  </Card>
  <Card title="시크릿 플랜 규약" icon="shield-check" href="/gateway/secrets-plan-contract">
    `secrets apply` 명령어의 대상 경로 규칙 및 보안 정책 상세.
  </Card>
</CardGroup>

## 5분 로컬 시작 가이드

<Steps>
  <Step title="Gateway 시작">

```bash
# 기본 실행 (포트 18789)
openclaw gateway

# 상세 디버그 로그 출력 (stdio 미러링)
openclaw gateway --verbose

# 기존 포트를 사용 중인 프로세스를 강제 종료하고 시작
openclaw gateway --force
```

  </Step>

  <Step title="서비스 상태 확인">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

**정상 기준선**: `Runtime: running` 및 `RPC probe: ok` 상태 확인.

  </Step>

  <Step title="채널 준비 상태 검증">

```bash
openclaw channels status --probe
```

  </Step>
</Steps>

<Note>
Gateway 설정 재로드는 활성 설정 파일 경로를 감시함 (프로필별 기본값 또는 `OPENCLAW_CONFIG_PATH` 기준). 기본 모드는 `gateway.reload.mode="hybrid"`임.
</Note>

## 런타임 모델 (Runtime Model)

- **상시 가동 프로세스**: 라우팅, 제어 플레인(Control plane), 채널 연결을 전담하는 단일 프로세스 기반임.
- **멀티플렉싱 포트**: 하나의 포트로 다음 기능을 모두 처리함:
  - WebSocket 제어 및 RPC 통신.
  - HTTP API (OpenAI 호환, Responses, 도구 호출 등).
  - Control UI 및 훅(Hooks) 서비스.
- **기본 바인딩**: `loopback` (로컬 호스트 전용).
- **인증 필수**: 기본적으로 토큰(`gateway.auth.token`) 또는 비밀번호(`gateway.auth.password`) 인증이 강제됨.

### 포트 및 바인딩 우선순위

| 항목 | 결정 순서 |
| :--- | :--- |
| **Gateway 포트** | CLI `--port` → `OPENCLAW_GATEWAY_PORT` → 설정 파일 `gateway.port` → `18789` |
| **바인딩 모드** | CLI 오버라이드 → 설정 파일 `gateway.bind` → `loopback` |

### 핫 리로드 (Hot Reload) 모드

| 모드 (`gateway.reload.mode`) | 동작 설명 |
| :--- | :--- |
| `off` | 자동 재로드 기능을 사용하지 않음. |
| `hot` | 중단 없이 적용 가능한 안전한 변경 사항만 즉시 반영함. |
| `restart` | 재시작이 필요한 항목 변경 시 프로세스를 자동으로 재시작함. |
| `hybrid` (기본값) | 가능하면 핫 리로드를 적용하고, 필요 시에만 재시작함. |

## 관리자 명령어 세트

```bash
openclaw gateway status         # 서비스 및 통신 상태 요약
openclaw gateway status --deep  # 정밀 진단 수행
openclaw gateway install        # 백그라운드 서비스 등록
openclaw gateway restart        # 서버 재시작
openclaw gateway stop           # 서버 중지
openclaw secrets reload         # 시크릿 참조 재해석 및 스냅샷 갱신
openclaw logs --follow          # 실시간 로그 모니터링
openclaw doctor                 # 종합 자가 진단 및 복구
```

## 원격 접속 (Remote Access)

- **권장 방식**: Tailscale 또는 사설 VPN 사용.
- **차선책**: SSH 터널링 활용.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

설정 후 로컬 클라이언트를 `ws://127.0.0.1:18789` 주소로 연결함.

<Warning>
SSH 터널링을 사용하더라도 Gateway에 인증이 설정되어 있다면 클라이언트는 반드시 유효한 토큰이나 비밀번호 정보를 전송해야 함.
</Warning>

참조: [원격 Gateway](/gateway/remote), [인증 가이드](/gateway/authentication), [Tailscale 연동](/gateway/tailscale).

## 서비스 감독 및 수명 주기 관리

실제 운영 환경의 안정성을 위해 운영체제별 서비스 관리 도구를 활용함.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

LaunchAgent 식별자는 `ai.openclaw.gateway` (기본값) 또는 `ai.openclaw.<프로필명>`임. `openclaw doctor` 명령어로 서비스 설정의 편차(Drift)를 점검하고 복구할 수 있음.

  </Tab>

  <Tab title="Linux (systemd 사용자 유닛)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<프로필>].service
openclaw gateway status
```

로그아웃 후에도 서버를 유지하려면 링거링(Lingering) 기능을 활성화함:

```bash
sudo loginctl enable-linger <사용자명>
```

  </Tab>

  <Tab title="Linux (시스템 서비스)">

다중 사용자 서버나 상시 가동 호스트의 경우 시스템 서비스 유닛을 사용함.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<프로필>].service
```

  </Tab>
</Tabs>

## 단일 호스트 내 다중 Gateway 운영

일반적인 환경에서는 **하나의 Gateway**만 운영할 것을 권장함. 엄격한 격리나 이중화(예: 복구용 프로필 운영)가 필요한 경우에만 추가 인스턴스를 구동함.

**인스턴스별 필수 분리 항목:**
- 고유한 `gateway.port`.
- 고유한 `OPENCLAW_CONFIG_PATH` (설정 파일).
- 고유한 `OPENCLAW_STATE_DIR` (상태 디렉터리).
- 고유한 `agents.defaults.workspace` (워크스페이스).

**사용 예시:**
```bash
# 인스턴스 A 실행
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json OPENCLAW_STATE_DIR=~/.openclaw-a openclaw gateway --port 19001

# 인스턴스 B 실행
OPENCLAW_CONFIG_PATH=~/.openclaw/b.json OPENCLAW_STATE_DIR=~/.openclaw-b openclaw gateway --port 19002
```

상세 내용: [다중 Gateway 구성](/gateway/multiple-gateways).

### 개발용 프로필 빠른 시작 (Dev Profile)

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```
`--dev` 플래그 사용 시 격리된 상태 폴더와 기본 포트 `19001`이 자동으로 할당됨.

## 프로토콜 요약 (운영자 참조용)

- 클라이언트의 첫 프레임은 반드시 **`connect`** 요청이어야 함.
- 성공 시 Gateway는 `hello-ok` 스냅샷(`presence`, `health`, `uptimeMs`, 정책 등)을 반환함.
- 요청/응답 구조: `req(method, params)` → `res(ok/payload|error)`.
- 주요 이벤트: `connect.challenge`, `agent`, `chat`, `presence`, `tick`, `shutdown`.

에이전트 실행은 **2단계**로 진행됨:
1. 즉시 수락 확인 (`status: "accepted"`).
2. 최종 완료 응답 (`status: "ok" | "error"`). 그 사이 실시간 `agent` 스트림 이벤트가 전달됨.

상세 기술 명세: [Gateway 프로토콜](/gateway/protocol).

## 운영 점검 항목

### 활성 상태 점검 (Liveness)
- WebSocket 연결 후 `connect` 프레임 전송.
- 스냅샷 정보가 포함된 `hello-ok` 응답 수신 여부 확인.

### 준비 상태 점검 (Readiness)
```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### 메시지 간격 복구 (Gap Recovery)
과거 이벤트는 재현되지 않음. 시퀀스 갭이 감지되면 계속 진행하기 전 상태 정보(`health`, `system-presence`)를 새로 고쳐 데이터 일관성을 확보함.

## 일반적인 오류 패턴 (Failure Signatures)

| 로그 시그니처 | 예상 원인 |
| :--- | :--- |
| `refusing to bind gateway ... without auth` | 루프백 이외의 주소에 인증 정보 없이 바인딩 시도함. |
| `another gateway instance is already listening` | 설정한 포트가 이미 사용 중임. |
| `Gateway start blocked: set gateway.mode=local` | 설정 파일이 원격(Remote) 모드로 지정되어 있음. |
| `unauthorized` (연결 시 발생) | 클라이언트와 서버 간의 인증 토큰/비밀번호 불일치. |

상세 진단 절차는 [Gateway 문제 해결 가이드](/gateway/troubleshooting) 참조.

## 안전성 보장 (Safety Guarantees)

- Gateway 프로콜 클라이언트는 Gateway 서버가 불능 상태일 때 즉시 실패 처리함 (보안을 위해 채널 직접 접근 방식으로 자동 전환되지 않음).
- 유효하지 않거나 `connect`가 아닌 첫 번째 프레임은 즉시 차단 및 연결 종료됨.
- 정상 종료(Graceful shutdown) 시 소켓이 닫히기 전 `shutdown` 이벤트를 송출함.

---

**관련 문서 목록:**
- [문제 해결(Troubleshooting)](/gateway/troubleshooting)
- [백그라운드 프로세스 관리](/gateway/background-process)
- [Gateway 설정 레퍼런스](/gateway/configuration)
- [상태 진단(Health)](/gateway/health)
- [Doctor 가이드](/gateway/doctor)
- [인증 아키텍처](/gateway/authentication)
