---
summary: "`openclaw node`용 CLI 레퍼런스(헤드리스 node host)"
read_when:
  - 헤드리스 node host를 실행할 때
  - `system.run`용 비-macOS 노드를 페어링할 때
title: "node"
---

# `openclaw node`

Gateway WebSocket에 연결하고 이 머신에서 `system.run` / `system.which`를
노출하는 **헤드리스 node host**를 실행합니다.

## 왜 node host를 사용하나요?

네트워크 안의 **다른 머신에서 명령을 실행**하고 싶지만, 그곳에 전체 macOS
companion app을 설치하고 싶지 않을 때 node host를 사용합니다.

일반적인 사용 사례:

- 원격 Linux/Windows 박스(빌드 서버, 랩 장비, NAS)에서 명령을 실행합니다.
- exec는 gateway에서 **샌드박스** 상태로 유지하면서, 승인된 실행은 다른 host에 위임합니다.
- 자동화 또는 CI 노드용으로 가벼운 헤드리스 실행 대상을 제공합니다.

실행은 여전히 node host의 **exec approvals**와 agent별 allowlist로 보호되므로,
명령 접근 범위를 명시적으로 제한할 수 있습니다.

## 브라우저 프록시(추가 설정 없음)

node에서 `browser.enabled`가 비활성화되어 있지 않으면, node host는 자동으로
브라우저 프록시를 advertise합니다. 따라서 추가 설정 없이도 agent가 해당
node에서 브라우저 자동화를 사용할 수 있습니다.

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

## 실행(포그라운드)

```bash
openclaw node run --host <gateway-host> --port 18789
```

옵션:

- `--host <host>`: Gateway WebSocket 호스트(기본값: `127.0.0.1`)
- `--port <port>`: Gateway WebSocket 포트(기본값: `18789`)
- `--tls`: gateway 연결에 TLS를 사용합니다
- `--tls-fingerprint <sha256>`: 예상 TLS 인증서 지문(sha256)
- `--node-id <id>`: node id를 override합니다(페어링 토큰 삭제)
- `--display-name <name>`: node 표시 이름을 override합니다

## node host용 Gateway 인증

`openclaw node run`과 `openclaw node install`은 gateway 인증을 config/env에서 해석합니다(node 명령에는 `--token`/`--password` 플래그가 없음).

- 먼저 `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`를 확인합니다.
- 다음으로 로컬 config fallback: `gateway.auth.token` / `gateway.auth.password`.
- 로컬 모드에서는 `gateway.auth.*`가 설정되지 않았을 때 `gateway.remote.token` / `gateway.remote.password`도 fallback 후보가 됩니다.
- `gateway.mode=remote`에서는 원격 우선순위 규칙에 따라 원격 클라이언트 필드(`gateway.remote.token` / `gateway.remote.password`)도 사용할 수 있습니다.
- 레거시 `CLAWDBOT_GATEWAY_*` env 변수는 node host 인증 해석에서 무시됩니다.

## 서비스(백그라운드)

헤드리스 node host를 사용자 서비스로 설치합니다.

```bash
openclaw node install --host <gateway-host> --port 18789
```

옵션:

- `--host <host>`: Gateway WebSocket 호스트(기본값: `127.0.0.1`)
- `--port <port>`: Gateway WebSocket 포트(기본값: `18789`)
- `--tls`: gateway 연결에 TLS를 사용합니다
- `--tls-fingerprint <sha256>`: 예상 TLS 인증서 지문(sha256)
- `--node-id <id>`: node id를 override합니다(페어링 토큰 삭제)
- `--display-name <name>`: node 표시 이름을 override합니다
- `--runtime <runtime>`: 서비스 런타임(`node` 또는 `bun`)
- `--force`: 이미 설치되어 있으면 다시 설치하거나 덮어씁니다

서비스 관리:

```bash
openclaw node status
openclaw node stop
openclaw node restart
openclaw node uninstall
```

포그라운드 node host(서비스 없음)에는 `openclaw node run`을 사용하세요.

서비스 명령은 기계가 읽을 수 있는 출력을 위해 `--json`을 지원합니다.

## 페어링

첫 번째 연결 시 Gateway에 대기 중인 디바이스 페어링 요청(`role: node`)이 생성됩니다.
다음 명령으로 승인하세요:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

node host는 node id, token, 표시 이름, gateway 연결 정보를
`~/.openclaw/node.json`에 저장합니다.

## Exec approvals

`system.run`은 로컬 exec approvals로 제어됩니다:

- `~/.openclaw/exec-approvals.json`
- [Exec approvals](/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (Gateway에서 편집)
