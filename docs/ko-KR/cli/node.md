---
summary: "헤드리스 노드 호스트 실행 및 관리를 위한 `openclaw node` 명령어 레퍼런스"
description: "원격 machine용 headless node host를 실행하고 설치하고 pairing하는 절차를 설명합니다."
read_when:
  - 헤드리스 node host를 실행할 때
  - 비 macOS node를 pairing할 때
title: "node"
x-i18n:
  source_path: "cli/node.md"
---

# `openclaw node`

Gateway WebSocket에 연결되는 **headless node host**를 실행하고,
이 machine의 `system.run` / `system.which`를 노출합니다.

## Why use a node host?

node host는 네트워크 안의 **다른 machine에서 command를 실행**하고 싶지만,
그곳에 전체 macOS companion app을 설치하고 싶지 않을 때 사용합니다.

일반적인 use case:

- 원격 Linux/Windows box(build server, lab machine, NAS)에서 command 실행
- gateway의 exec는 **sandboxed** 상태로 두고, 승인된 실행만 다른 host에 위임
- automation이나 CI node를 위한 가벼운 headless execution target 제공

실행은 여전히 **exec approval**과 agent별 allowlist로 보호되므로,
command access를 명시적으로 제한할 수 있습니다.

## Browser proxy (zero-config)

node에서 `browser.enabled`가 비활성화되지 않았다면, node host는 browser proxy를 자동으로 advertise합니다.
덕분에 agent는 추가 설정 없이도 해당 node에서 browser automation을 사용할 수 있습니다.

필요하면 node에서 비활성화하세요:

```json5
{
  nodeHost: {
    browserProxy: {
      enabled: false,
    },
  },
}
```

## Run (foreground)

```bash
openclaw node run --host <gateway-host> --port 18789
```

Options:

- `--host <host>`: Gateway WebSocket host (기본값 `127.0.0.1`)
- `--port <port>`: Gateway WebSocket port (기본값 `18789`)
- `--tls`: gateway connection에 TLS 사용
- `--tls-fingerprint <sha256>`: 기대하는 TLS certificate fingerprint (sha256)
- `--node-id <id>`: node id override (pairing token 제거)
- `--display-name <name>`: node display name override

## Gateway auth for node host

`openclaw node run`과 `openclaw node install`은 config/env에서 gateway auth를 resolve합니다.
(node command에는 `--token`/`--password` flag가 없습니다.)

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`를 먼저 확인합니다.
- 그다음 local config의 `gateway.auth.token` / `gateway.auth.password`를 fallback으로 사용합니다.
- local mode에서는 node host가 `gateway.remote.token` / `gateway.remote.password`를 의도적으로 상속하지 않습니다.
- `gateway.auth.token` / `gateway.auth.password`가 SecretRef로 명시되어 있지만 resolve되지 않으면, node auth resolution은 fail-closed로 동작합니다. remote fallback으로 가려주지 않습니다.
- `gateway.mode=remote`에서는 remote precedence rule에 따라 `gateway.remote.token` / `gateway.remote.password`도 대상이 될 수 있습니다.
- legacy `CLAWDBOT_GATEWAY_*` env var는 node host auth resolution에서 무시합니다.

## Service (background)

headless node host를 user service로 설치할 수 있습니다.

```bash
openclaw node install --host <gateway-host> --port 18789
```

Options:

- `--host <host>`: Gateway WebSocket host (기본값 `127.0.0.1`)
- `--port <port>`: Gateway WebSocket port (기본값 `18789`)
- `--tls`: gateway connection에 TLS 사용
- `--tls-fingerprint <sha256>`: 기대하는 TLS certificate fingerprint (sha256)
- `--node-id <id>`: node id override (pairing token 제거)
- `--display-name <name>`: node display name override
- `--runtime <runtime>`: service runtime (`node` 또는 `bun`)
- `--force`: 이미 설치되어 있으면 재설치 또는 덮어쓰기

서비스 관리:

```bash
openclaw node status
openclaw node stop
openclaw node restart
openclaw node uninstall
```

foreground node host만 실행하려면 `openclaw node run`을 사용하세요. (service 없음)

service command는 machine-readable output을 위해 `--json`을 지원합니다.

## Pairing

첫 연결 시 Gateway에 pending device pairing request(`role: node`)가 생성됩니다.
다음 명령으로 승인하세요:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

node host는 node id, token, display name, gateway connection 정보를
`~/.openclaw/node.json`에 저장합니다.

## Exec approvals

`system.run`은 local exec approval로 제어됩니다.

- `~/.openclaw/exec-approvals.json`
- [Exec approvals](/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (Gateway에서 편집)
