---
summary: "OpenClaw Gateway CLI (`openclaw gateway`) - gateway 실행, 질의, discovery"
read_when:
  - CLI에서 Gateway를 실행할 때(dev 또는 서버)
  - Gateway auth, bind mode, connectivity를 디버깅할 때
  - Bonjour(LAN + tailnet)로 gateway를 찾을 때
title: "gateway"
---

# Gateway CLI

Gateway는 OpenClaw의 WebSocket 서버입니다(channels, nodes, sessions, hooks 담당).

이 페이지의 하위 명령은 모두 `openclaw gateway …` 아래에 있습니다.

관련 문서:

- [/gateway/bonjour](/gateway/bonjour)
- [/gateway/discovery](/gateway/discovery)
- [/gateway/configuration](/gateway/configuration)

## Run the Gateway

로컬 Gateway 프로세스를 실행합니다.

```bash
openclaw gateway
```

포그라운드 별칭:

```bash
openclaw gateway run
```

참고:

- 기본적으로 `~/.openclaw/openclaw.json`에서 `gateway.mode=local`이 설정되지 않으면 Gateway는 시작을 거부합니다. 임시/dev 실행에는 `--allow-unconfigured`를 사용하세요.
- 인증 없이 loopback 바깥으로 바인딩하는 것은 safety guardrail에 의해 차단됩니다.
- `SIGUSR1`은 권한이 있을 때 프로세스 내부 재시작을 트리거합니다(`commands.restart`는 기본 활성화, 수동 재시작을 막으려면 `commands.restart: false`를 설정하세요. 단 gateway tool/config apply/update는 계속 허용됩니다).
- `SIGINT`/`SIGTERM` 핸들러는 gateway 프로세스를 멈추지만, 커스텀 터미널 상태는 복원하지 않습니다. CLI를 TUI나 raw-mode 입력으로 감싸고 있다면 종료 전에 터미널을 직접 복원하세요.

### Options

- `--port <port>`: WebSocket 포트(기본값은 config/env에서 오며 보통 `18789`)
- `--bind <loopback|lan|tailnet|auto|custom>`: listener bind mode
- `--auth <token|password>`: auth mode override
- `--token <token>`: token override(프로세스에 `OPENCLAW_GATEWAY_TOKEN`도 설정)
- `--password <password>`: password override. 경고: 인라인 비밀번호는 로컬 프로세스 목록에 노출될 수 있습니다.
- `--password-file <path>`: 파일에서 gateway password 읽기
- `--tailscale <off|serve|funnel>`: Tailscale을 통해 Gateway 노출
- `--tailscale-reset-on-exit`: 종료 시 Tailscale serve/funnel 설정 초기화
- `--allow-unconfigured`: config에 `gateway.mode=local`이 없어도 gateway 시작 허용
- `--dev`: dev config + workspace가 없으면 생성(BOOTSTRAP.md는 건너뜀)
- `--reset`: dev config + credentials + sessions + workspace 초기화(`--dev` 필요)
- `--force`: 시작 전에 선택한 포트에서 이미 열려 있는 listener 강제 종료
- `--verbose`: 상세 로그
- `--claude-cli-logs`: 콘솔에 claude-cli 로그만 표시(해당 stdout/stderr도 활성화)
- `--ws-log <auto|full|compact>`: websocket 로그 스타일(기본값 `auto`)
- `--compact`: `--ws-log compact`의 별칭
- `--raw-stream`: 원시 model stream 이벤트를 jsonl로 기록
- `--raw-stream-path <path>`: raw stream jsonl 경로

## Query a running Gateway

모든 query 명령은 WebSocket RPC를 사용합니다.

출력 모드:

- 기본: 사람이 읽기 쉬운 형식(TTY에서는 색상 포함)
- `--json`: 기계 읽기용 JSON(styling/spinner 없음)
- `--no-color` 또는 `NO_COLOR=1`: 사람이 읽는 레이아웃은 유지하되 ANSI 비활성화

공통 옵션(지원되는 명령에 한함):

- `--url <url>`: Gateway WebSocket URL
- `--token <token>`: Gateway token
- `--password <password>`: Gateway password
- `--timeout <ms>`: timeout/budget(명령마다 다름)
- `--expect-final`: “final” 응답(agent call)을 기다림

참고: `--url`을 지정하면 CLI는 config나 environment의 자격 증명으로 fallback 하지 않습니다. `--token` 또는 `--password`를 명시적으로 전달하세요. 명시적 자격 증명이 없으면 오류입니다.

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

### `gateway status`

`gateway status`는 Gateway 서비스(launchd/systemd/schtasks)와 선택적인 RPC probe를 함께 보여줍니다.

```bash
openclaw gateway status
openclaw gateway status --json
```

옵션:

- `--url <url>`: probe URL override
- `--token <token>`: probe용 token auth
- `--password <password>`: probe용 password auth
- `--timeout <ms>`: probe timeout(기본값 `10000`)
- `--no-probe`: RPC probe를 건너뛰고 서비스 상태만 보기
- `--deep`: 시스템 수준 서비스도 스캔

참고:

- `gateway status`는 가능할 경우 probe auth용으로 설정된 auth SecretRef를 해석합니다.
- 이 명령 경로에서 필요한 auth SecretRef를 해석할 수 없으면 probe auth가 실패할 수 있습니다. `--token`/`--password`를 직접 전달하거나 secret source를 먼저 해결하세요.
- Linux systemd 설치에서 service auth drift check는 유닛의 `Environment=`와 `EnvironmentFile=` 값을 모두 읽습니다. `%h`, 인용된 경로, 여러 파일, 선택적 `-` 파일도 포함됩니다.

### `gateway probe`

`gateway probe`는 “모든 것을 디버깅”하는 명령입니다. 항상 다음을 probe합니다.

- 설정된 remote gateway(있다면)
- **remote가 설정되어 있어도** localhost(loopback)

여러 gateway에 도달 가능하면 모두 출력합니다. rescue bot처럼 profile/port를 분리한 경우 여러 gateway를 함께 두는 구성이 가능하지만, 대부분의 설치는 여전히 단일 gateway를 사용합니다.

```bash
openclaw gateway probe
openclaw gateway probe --json
```

#### Remote over SSH (Mac app parity)

macOS 앱의 “Remote over SSH” 모드는 로컬 포트 포워드를 사용해 loopback 전용으로 바인딩된 remote gateway도 `ws://127.0.0.1:<port>`에서 접근 가능하게 만듭니다.

동등한 CLI 명령:

```bash
openclaw gateway probe --ssh user@gateway-host
```

옵션:

- `--ssh <target>`: `user@host` 또는 `user@host:port`(포트 기본값 `22`)
- `--ssh-identity <path>`: identity file
- `--ssh-auto`: 첫 번째로 발견된 gateway host를 SSH 대상으로 선택(LAN/WAB만)

설정(선택, 기본값으로 사용):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

저수준 RPC helper입니다.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

## Manage the Gateway service

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

참고:

- `gateway install`은 `--port`, `--runtime`, `--token`, `--force`, `--json`을 지원합니다.
- token auth에 token이 필요하고 `gateway.auth.token`이 SecretRef로 관리된다면, `gateway install`은 SecretRef가 해석 가능한지만 검증하고 실제 token 값을 서비스 환경 메타데이터에 저장하지는 않습니다.
- token auth에 token이 필요하지만 설정된 token SecretRef를 해석할 수 없으면, install은 fallback 평문을 저장하지 않고 fail closed 합니다.
- `gateway run`에서 password auth를 쓸 때는 인라인 `--password`보다 `OPENCLAW_GATEWAY_PASSWORD`, `--password-file`, 또는 SecretRef 기반 `gateway.auth.password`를 권장합니다.
- inferred auth mode에서 셸에만 설정된 `OPENCLAW_GATEWAY_PASSWORD`/`CLAWDBOT_GATEWAY_PASSWORD`는 install token 요구사항을 완화하지 않습니다. 관리형 서비스를 설치할 때는 영속 설정(`gateway.auth.password` 또는 config `env`)을 사용하세요.
- `gateway.auth.token`과 `gateway.auth.password`가 모두 설정되어 있고 `gateway.auth.mode`가 비어 있으면, mode를 명시적으로 설정할 때까지 install이 차단됩니다.
- lifecycle 명령은 스크립팅용 `--json`도 지원합니다.

## Discover gateways (Bonjour)

`gateway discover`는 Gateway beacon(`_openclaw-gw._tcp`)을 스캔합니다.

- 멀티캐스트 DNS-SD: `local.`
- 유니캐스트 DNS-SD(Wide-Area Bonjour): 도메인(예: `openclaw.internal.`)을 정하고 split DNS + DNS server를 구성합니다. [/gateway/bonjour](/gateway/bonjour) 참고

Bonjour discovery가 활성화된 gateway만(기본값은 활성) beacon을 광고합니다.

Wide-Area discovery 레코드는 다음 TXT를 포함합니다.

- `role` (gateway 역할 힌트)
- `transport` (전송 힌트, 예: `gateway`)
- `gatewayPort` (WebSocket 포트, 일반적으로 `18789`)
- `sshPort` (SSH 포트, 없으면 기본값 `22`)
- `tailnetDns` (가능할 경우 MagicDNS hostname)
- `gatewayTls` / `gatewayTlsSha256` (TLS 활성화 여부와 인증서 fingerprint)
- `cliPath` (선택적 remote install 힌트)

### `gateway discover`

```bash
openclaw gateway discover
```

옵션:

- `--timeout <ms>`: 명령별 timeout(browse/resolve), 기본값 `2000`
- `--json`: 기계 읽기용 출력(styling/spinner도 비활성화)

예시:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```
