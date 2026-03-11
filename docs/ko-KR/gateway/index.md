---
summary: "Gateway 서비스, 수명 주기, 운영을 위한 런북"
read_when:
  - gateway 프로세스를 실행하거나 디버깅할 때
title: "Gateway 런북"
---

# Gateway 런북

이 페이지는 Gateway 서비스의 day-1 시작 절차와 day-2 운영 작업을 위한 문서입니다.

<CardGroup cols={2}>
  <Card title="심층 문제 해결" icon="siren" href="/gateway/troubleshooting">
    증상 중심 진단, 정확한 명령 순서, 로그 시그니처를 제공합니다.
  </Card>
  <Card title="설정" icon="sliders" href="/gateway/configuration">
    작업 중심 설정 가이드와 전체 설정 레퍼런스를 제공합니다.
  </Card>
  <Card title="시크릿 관리" icon="key-round" href="/gateway/secrets">
    SecretRef 계약, 런타임 스냅샷 동작, 마이그레이션/리로드 작업을 설명합니다.
  </Card>
  <Card title="시크릿 플랜 계약" icon="shield-check" href="/gateway/secrets-plan-contract">
    정확한 `secrets apply` 대상/경로 규칙과 ref-only auth-profile 동작을 설명합니다.
  </Card>
</CardGroup>

## 5분 로컬 시작

<Steps>
  <Step title="Gateway 시작">

```bash
openclaw gateway --port 18789
# debug/trace mirrored to stdio
openclaw gateway --port 18789 --verbose
# force-kill listener on selected port, then start
openclaw gateway --force
```

  </Step>

  <Step title="서비스 상태 확인">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

정상 기준: `Runtime: running` 과 `RPC probe: ok`.

  </Step>

  <Step title="채널 준비 상태 검증">

```bash
openclaw channels status --probe
```

  </Step>
</Steps>

<Note>
Gateway 설정 리로드는 활성 설정 파일 경로를 감시합니다(프로필/상태 기본값에서 해석되거나, 설정된 경우 `OPENCLAW_CONFIG_PATH` 사용).
기본 모드는 `gateway.reload.mode="hybrid"` 입니다.
</Note>

## 런타임 모델

- 라우팅, 제어 플레인, 채널 연결을 담당하는 항상 켜져 있는 단일 프로세스
- 다음을 모두 처리하는 단일 멀티플렉스 포트
  - WebSocket control/RPC
  - HTTP APIs (OpenAI 호환, Responses, tools invoke)
  - Control UI 및 hooks
- 기본 bind 모드: `loopback`
- 기본적으로 인증 필요 (`gateway.auth.token` / `gateway.auth.password`, 또는 `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`)

### 포트 및 bind 우선순위

| 설정 | 결정 순서 |
| --- | --- |
| Gateway 포트 | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Bind 모드 | CLI/override → `gateway.bind` → `loopback` |

### 핫 리로드 모드

| `gateway.reload.mode` | 동작 |
| --- | --- |
| `off` | 설정 리로드 안 함 |
| `hot` | hot-safe 변경만 적용 |
| `restart` | 재시작이 필요한 변경 시 재시작 |
| `hybrid` (기본값) | 안전하면 핫 적용, 필요하면 재시작 |

## 운영자 명령 세트

```bash
openclaw gateway status
openclaw gateway status --deep
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

## 원격 액세스

권장: Tailscale/VPN.
대안: SSH 터널.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

그다음 클라이언트를 로컬의 `ws://127.0.0.1:18789` 에 연결합니다.

<Warning>
gateway 인증이 설정되어 있으면 SSH 터널을 사용하더라도 클라이언트는 여전히 `token`/`password` 인증을 보내야 합니다.
</Warning>

참고: [원격 Gateway](/gateway/remote), [인증](/gateway/authentication), [Tailscale](/gateway/tailscale)

## 감독 및 서비스 수명 주기

프로덕션에 가까운 안정성이 필요하면 supervised run을 사용하세요.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

LaunchAgent label은 기본값이 `ai.openclaw.gateway`, 이름 있는 프로필은 `ai.openclaw.<profile>` 입니다. `openclaw doctor` 는 서비스 설정 드리프트를 점검하고 복구합니다.

  </Tab>

  <Tab title="Linux (systemd user)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

로그아웃 후에도 유지하려면 lingering을 활성화하세요.

```bash
sudo loginctl enable-linger <user>
```

  </Tab>

  <Tab title="Linux (system service)">

여러 사용자/항상 켜짐 호스트에는 system unit을 사용하세요.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

  </Tab>
</Tabs>

## 한 호스트에서 여러 Gateway 실행

대부분의 환경은 **Gateway 하나**만 실행해야 합니다.
여러 개는 엄격한 격리나 이중화(예: rescue profile)가 필요할 때만 사용하세요.

인스턴스별 체크리스트:

- 고유한 `gateway.port`
- 고유한 `OPENCLAW_CONFIG_PATH`
- 고유한 `OPENCLAW_STATE_DIR`
- 고유한 `agents.defaults.workspace`

예시:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json OPENCLAW_STATE_DIR=~/.openclaw-a openclaw gateway --port 19001
OPENCLAW_CONFIG_PATH=~/.openclaw/b.json OPENCLAW_STATE_DIR=~/.openclaw-b openclaw gateway --port 19002
```

참고: [여러 Gateway](/gateway/multiple-gateways)

### Dev profile 빠른 경로

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

기본값에는 격리된 state/config와 기본 gateway 포트 `19001` 이 포함됩니다.

## 프로토콜 빠른 참조 (운영자 관점)

- 첫 번째 클라이언트 프레임은 반드시 `connect`
- Gateway는 `hello-ok` 스냅샷(`presence`, `health`, `stateVersion`, `uptimeMs`, limits/policy)을 반환
- 요청: `req(method, params)` → `res(ok/payload|error)`
- 일반 이벤트: `connect.challenge`, `agent`, `chat`, `presence`, `tick`, `health`, `heartbeat`, `shutdown`

에이전트 실행은 2단계입니다.

1. 즉시 수락 ack (`status:"accepted"`)
2. 최종 완료 응답 (`status:"ok"|"error"`), 그 사이에 스트리밍 `agent` 이벤트가 옴

전체 프로토콜 문서: [Gateway 프로토콜](/gateway/protocol)

## 운영 점검

### Liveness

- WS를 열고 `connect` 를 전송
- 스냅샷이 포함된 `hello-ok` 응답을 기대

### Readiness

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### Gap recovery

이벤트는 재생되지 않습니다. 시퀀스 갭이 생기면 계속 진행하기 전에 상태(`health`, `system-presence`)를 새로 고치세요.

## 흔한 실패 시그니처

| 시그니처 | 가능성이 높은 문제 |
| --- | --- |
| `refusing to bind gateway ... without auth` | token/password 없이 non-loopback bind |
| `another gateway instance is already listening` / `EADDRINUSE` | 포트 충돌 |
| `Gateway start blocked: set gateway.mode=local` | 설정이 remote 모드로 되어 있음 |
| `unauthorized` during connect | 클라이언트와 gateway 사이 인증 불일치 |

전체 진단 순서는 [Gateway 문제 해결](/gateway/troubleshooting) 을 사용하세요.

## 안전 보장

- Gateway 프로토콜 클라이언트는 Gateway를 사용할 수 없으면 즉시 실패합니다(암묵적인 direct-channel fallback 없음).
- 잘못된/non-connect 첫 프레임은 거부되고 연결이 종료됩니다.
- 정상 종료 시 소켓이 닫히기 전에 `shutdown` 이벤트를 보냅니다.

---

관련 문서:

- [문제 해결](/gateway/troubleshooting)
- [백그라운드 프로세스](/gateway/background-process)
- [설정](/gateway/configuration)
- [상태 확인](/gateway/health)
- [Doctor](/gateway/doctor)
- [인증](/gateway/authentication)
