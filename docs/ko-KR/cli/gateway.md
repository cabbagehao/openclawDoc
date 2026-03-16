---
summary: "OpenClaw Gateway CLI (`openclaw gateway`) — run, query, and discover gateways"
description: "Gateway를 실행하고, RPC로 상태를 조회하고, service를 관리하고, Bonjour로 gateway를 발견하는 `openclaw gateway` CLI 전체 흐름을 설명합니다."
read_when:
  - CLI에서 Gateway를 실행할 때
  - Gateway auth, bind mode, connectivity를 디버깅할 때
  - Bonjour로 gateway를 발견할 때
title: "gateway"
x-i18n:
  source_path: "cli/gateway.md"
---

# Gateway CLI

Gateway는 OpenClaw의 WebSocket server입니다. (channels, nodes, sessions, hooks)

이 페이지의 subcommand는 모두 `openclaw gateway …` 아래에 있습니다.

Related docs:

- [/gateway/bonjour](/gateway/bonjour)
- [/gateway/discovery](/gateway/discovery)
- [/gateway/configuration](/gateway/configuration)

## Run the Gateway

local Gateway process 실행:

```bash
openclaw gateway
```

foreground alias:

```bash
openclaw gateway run
```

Notes:

- 기본적으로 Gateway는 `~/.openclaw/openclaw.json`에 `gateway.mode=local`이 설정되어 있지 않으면 시작을 거부합니다. ad-hoc/dev 실행에는 `--allow-unconfigured`를 사용하세요.
- auth 없이 loopback 바깥으로 bind하는 것은 차단됩니다. (safety guardrail)
- 권한이 허용되면 `SIGUSR1`은 in-process restart를 트리거합니다. (`commands.restart`는 기본적으로 활성화되어 있으며, 수동 restart를 막으려면 `commands.restart: false`로 설정하세요. gateway tool/config apply/update는 계속 허용됩니다.)
- `SIGINT`/`SIGTERM` handler는 gateway process를 종료하지만, custom terminal state는 복구하지 않습니다. CLI를 TUI나 raw-mode input으로 감쌌다면 종료 전에 terminal을 복구하세요.

### Options

- `--port <port>`: WebSocket port (기본값은 config/env에서 오며, 보통 `18789`)
- `--bind <loopback|lan|tailnet|auto|custom>`: listener bind mode
- `--auth <token|password>`: auth mode override
- `--token <token>`: token override (`OPENCLAW_GATEWAY_TOKEN`도 process에 설정)
- `--password <password>`: password override. 경고: inline password는 local process listing에 노출될 수 있음
- `--password-file <path>`: file에서 gateway password 읽기
- `--tailscale <off|serve|funnel>`: Tailscale로 Gateway 노출
- `--tailscale-reset-on-exit`: shutdown 시 Tailscale serve/funnel config reset
- `--allow-unconfigured`: config에 `gateway.mode=local`이 없어도 gateway 시작 허용
- `--dev`: dev config + workspace가 없으면 생성 (`BOOTSTRAP.md`는 건너뜀)
- `--reset`: dev config + credentials + sessions + workspace reset (`--dev` 필요)
- `--force`: 시작 전에 선택된 port의 기존 listener를 강제 종료
- `--verbose`: verbose log
- `--claude-cli-logs`: console에는 claude-cli log만 보여주고 stdout/stderr도 활성화
- `--ws-log <auto|full|compact>`: websocket log style (기본값 `auto`)
- `--compact`: `--ws-log compact` alias
- `--raw-stream`: raw model stream event를 jsonl로 기록
- `--raw-stream-path <path>`: raw stream jsonl path

## Query a running Gateway

모든 query command는 WebSocket RPC를 사용합니다.

Output mode:

- 기본값: human-readable (TTY에서는 color 사용)
- `--json`: machine-readable JSON (styling/spinner 없음)
- `--no-color` 또는 `NO_COLOR=1`: human layout은 유지하되 ANSI 비활성화

Shared options (지원되는 경우):

- `--url <url>`: Gateway WebSocket URL
- `--token <token>`: Gateway token
- `--password <password>`: Gateway password
- `--timeout <ms>`: timeout/budget (명령마다 다름)
- `--expect-final`: “final” response까지 기다림 (agent call용)

참고: `--url`을 지정하면 CLI는 config나 environment credential로 fallback하지 않습니다.
`--token` 또는 `--password`를 명시적으로 넘겨야 하며, explicit credential이 없으면 오류입니다.

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

### `gateway status`

`gateway status`는 Gateway service (`launchd`/`systemd`/`schtasks`)와 optional RPC probe를 함께 보여줍니다.

```bash
openclaw gateway status
openclaw gateway status --json
```

Options:

- `--url <url>`: probe URL override
- `--token <token>`: probe용 token auth
- `--password <password>`: probe용 password auth
- `--timeout <ms>`: probe timeout (기본값 `10000`)
- `--no-probe`: RPC probe 생략 (service-only view)
- `--deep`: system-level service까지 스캔

Notes:

- `gateway status`는 가능하면 probe auth를 위해 configured auth SecretRef를 resolve합니다.
- 필요한 auth SecretRef가 현재 command path에서 unresolved면 probe auth가 실패할 수 있습니다. `--token`/`--password`를 직접 넘기거나 secret source를 먼저 해결하세요.
- Linux systemd install에서는 service auth drift check가 unit의 `Environment=`와 `EnvironmentFile=` 값을 모두 읽습니다. (`%h`, quoted path, multiple file, optional `-` file 포함)

### `gateway probe`

`gateway probe`는 “debug everything” 명령입니다. 항상 다음 둘을 probe합니다.

- configured remote gateway (설정되어 있으면)
- localhost (loopback) **원격이 설정돼 있어도 항상**

여러 gateway가 reachable하면 모두 출력합니다. isolated profile/port를 쓰는 rescue bot 같은 경우 multiple gateway도 지원되지만, 대부분 설치는 여전히 single gateway입니다.

```bash
openclaw gateway probe
openclaw gateway probe --json
```

#### Remote over SSH (Mac app parity)

macOS app의 “Remote over SSH” mode는 local port-forward를 써서, loopback에만 bind된 remote gateway도 `ws://127.0.0.1:<port>`에서 접근 가능하게 만듭니다.

CLI equivalent:

```bash
openclaw gateway probe --ssh user@gateway-host
```

Options:

- `--ssh <target>`: `user@host` 또는 `user@host:port` (`port` 기본값 `22`)
- `--ssh-identity <path>`: identity file
- `--ssh-auto`: 발견된 첫 gateway host를 SSH target으로 사용 (LAN/WAB only)

Config (optional, default로 사용):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

low-level RPC helper입니다.

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

Notes:

- `gateway install`은 `--port`, `--runtime`, `--token`, `--force`, `--json`을 지원합니다.
- token auth에 token이 필요하고 `gateway.auth.token`이 SecretRef-managed이면, `gateway install`은 SecretRef가 resolvable한지 검증하지만 resolved token을 service environment metadata에 저장하지는 않습니다.
- token auth에 token이 필요한데 configured token SecretRef가 unresolved면, install은 fallback plaintext를 저장하지 않고 fail closed합니다.
- password auth로 `gateway run`을 할 때는 inline `--password`보다 `OPENCLAW_GATEWAY_PASSWORD`, `--password-file`, 또는 SecretRef-backed `gateway.auth.password`를 선호하세요.
- inferred auth mode에서는 shell-only `OPENCLAW_GATEWAY_PASSWORD`/`CLAWDBOT_GATEWAY_PASSWORD`가 install의 token requirement를 완화하지 않습니다. managed service 설치에는 durable config (`gateway.auth.password` 또는 config `env`)를 사용하세요.
- `gateway.auth.token`과 `gateway.auth.password`가 모두 설정되어 있고 `gateway.auth.mode`가 unset이면, install은 mode를 명시할 때까지 차단됩니다.
- lifecycle command는 스크립트 용도로 `--json`을 받습니다.

## Discover gateways (Bonjour)

`gateway discover`는 Gateway beacon (`_openclaw-gw._tcp`)을 스캔합니다.

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): 도메인 하나를 선택합니다. (예: `openclaw.internal.`) 그런 다음 split DNS + DNS server를 설정합니다. 자세한 내용은 [/gateway/bonjour](/gateway/bonjour)

Bonjour discovery가 활성화된 gateway만 beacon을 광고합니다. (기본값 활성화)

Wide-Area discovery record는 다음 TXT를 포함합니다.

- `role` (gateway role hint)
- `transport` (transport hint, 예: `gateway`)
- `gatewayPort` (WebSocket port, 보통 `18789`)
- `sshPort` (SSH port, 없으면 기본값 `22`)
- `tailnetDns` (가능하면 MagicDNS hostname)
- `gatewayTls` / `gatewayTlsSha256` (TLS enabled 여부와 cert fingerprint)
- `cliPath` (optional remote install hint)

### `gateway discover`

```bash
openclaw gateway discover
```

Options:

- `--timeout <ms>`: per-command timeout (browse/resolve), 기본값 `2000`
- `--json`: machine-readable output (styling/spinner도 비활성화)

Examples:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```
