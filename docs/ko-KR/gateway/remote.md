---
summary: "SSH tunnel(Gateway WS)과 tailnet을 사용하는 remote access"
read_when:
  - remote gateway 구성을 실행하거나 문제를 해결할 때
title: "Remote Access"
---

# Remote access (SSH, tunnels, and tailnets)

이 저장소는 전용 호스트(데스크톱/서버)에서 단일 Gateway(master)를 실행하고, 클라이언트가 여기에 연결하는 “remote over SSH” 구성을 지원합니다.

- **운영자(사용자/macOS 앱)**에게는 SSH tunneling이 범용 fallback입니다.
- **노드(iOS/Android 및 향후 기기)**는 Gateway **WebSocket**에 연결합니다(LAN/tailnet 또는 필요 시 SSH tunnel).

## The core idea

- Gateway WebSocket은 설정한 포트(기본값 18789)의 **loopback**에 바인딩됩니다.
- 원격 사용 시에는 이 loopback 포트를 SSH로 포워딩합니다. tailnet/VPN을 쓰는 경우 tunnel 의존도를 줄일 수 있습니다.

## Common VPN/tailnet setups (where the agent lives)

**Gateway host**를 “agent가 사는 곳”으로 생각하면 됩니다. 이 호스트가 session, auth profile, channel, state를 보유합니다.
노트북/데스크톱(및 node)은 그 호스트에 연결합니다.

### 1) Always-on Gateway in your tailnet (VPS or home server)

지속적으로 켜져 있는 호스트에서 Gateway를 실행하고, **Tailscale** 또는 SSH로 접근합니다.

- **가장 좋은 UX:** `gateway.bind: "loopback"`을 유지하고 Control UI에는 **Tailscale Serve**를 사용
- **Fallback:** loopback 유지 + 접근이 필요한 각 머신에서 SSH tunnel 사용
- **예시:** [exe.dev](/install/exe-dev) (간단한 VM) 또는 [Hetzner](/install/hetzner) (운영용 VPS)

노트북이 자주 잠들지만 agent는 항상 켜 두고 싶을 때 적합합니다.

### 2) Home desktop runs the Gateway, laptop is remote control

노트북은 agent를 실행하지 않습니다. 원격으로 연결만 합니다.

- macOS 앱의 **Remote over SSH** 모드 사용(Settings → General → “OpenClaw runs”)
- 앱이 tunnel을 열고 관리하므로 WebChat + health check가 자연스럽게 동작합니다.

운영 절차: [macOS remote access](/platforms/mac/remote)

### 3) Laptop runs the Gateway, remote access from other machines

Gateway는 로컬에서 돌리되 안전하게 노출합니다.

- 다른 머신에서 노트북으로 SSH tunnel을 연결하거나
- Tailscale Serve로 Control UI를 노출하고 Gateway는 loopback 전용으로 유지

가이드: [Tailscale](/gateway/tailscale), [Web overview](/web)

## Command flow (what runs where)

하나의 gateway 서비스가 state + channel을 소유합니다. node는 주변 장치 역할입니다.

흐름 예시(Telegram → node):

- Telegram 메시지가 **Gateway**에 도착
- Gateway가 **agent**를 실행하고 node tool 호출 여부 결정
- Gateway가 Gateway WebSocket을 통해 **node**를 호출(`node.*` RPC)
- node가 결과를 반환하면 Gateway가 Telegram으로 응답

참고:

- **Node는 gateway 서비스를 실행하지 않습니다.** profile을 분리해 고립된 구성을 의도적으로 운영하는 경우가 아니라면, 호스트당 하나의 gateway만 실행해야 합니다. 자세한 내용은 [Multiple gateways](/gateway/multiple-gateways)를 참고하세요.
- macOS 앱의 “node mode”는 Gateway WebSocket 위에서 동작하는 node client일 뿐입니다.

## SSH tunnel (CLI + tools)

remote Gateway WS에 대한 로컬 tunnel 생성:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

tunnel이 올라온 뒤:

- `openclaw health`, `openclaw status --deep`는 `ws://127.0.0.1:18789`를 통해 remote gateway에 접근합니다.
- `openclaw gateway {status,health,send,agent,call}`도 필요하면 `--url`로 포워딩된 URL을 직접 대상으로 삼을 수 있습니다.

참고: `18789`는 설정된 `gateway.port` 값(또는 `--port`/`OPENCLAW_GATEWAY_PORT`)으로 바꿔야 할 수 있습니다.
참고: `--url`을 넘기면 CLI는 config나 environment credential로 fallback 하지 않습니다.
`--token` 또는 `--password`를 명시적으로 포함해야 하며, 없으면 오류입니다.

## CLI remote defaults

원격 대상을 저장해 두면 CLI 명령이 기본적으로 이를 사용합니다.

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      url: "ws://127.0.0.1:18789",
      token: "your-token",
    },
  },
}
```

gateway가 loopback 전용이면 URL은 `ws://127.0.0.1:18789`로 두고, 먼저 SSH tunnel을 여세요.

## Credential precedence

Gateway credential 해석은 call/probe/status 경로, Discord exec-approval monitoring, node-host connection에 걸쳐 공통 규칙을 따릅니다.

- 명시적 자격 증명(`--token`, `--password`, tool의 `gatewayToken`)이 항상 우선합니다.
- URL override 안전 규칙:
  - CLI URL override(`--url`)는 암묵적인 config/env credential을 절대 재사용하지 않습니다.
  - Env URL override(`OPENCLAW_GATEWAY_URL`)는 env credential(`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`)만 사용할 수 있습니다.
- Local mode 기본값:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password`
- Remote mode 기본값:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- remote probe/status token 검사는 기본적으로 엄격합니다. remote mode를 대상으로 할 때는 `gateway.remote.token`만 사용하며 local token fallback은 하지 않습니다.
- 레거시 `CLAWDBOT_GATEWAY_*` env var는 호환성 call path에서만 사용됩니다. probe/status/auth 해석에는 `OPENCLAW_GATEWAY_*`만 사용합니다.

## Chat UI over SSH

WebChat은 더 이상 별도 HTTP 포트를 사용하지 않습니다. SwiftUI chat UI가 직접 Gateway WebSocket에 연결합니다.

- SSH로 `18789`를 포워딩한 뒤(위 참고), client를 `ws://127.0.0.1:18789`에 연결하세요.
- macOS에서는 tunnel을 자동으로 관리하는 앱의 “Remote over SSH” 모드를 권장합니다.

## macOS app “Remote over SSH”

macOS menu bar 앱은 이 구성을 end-to-end로 처리할 수 있습니다. remote status check, WebChat, Voice Wake forwarding까지 포함합니다.

운영 절차: [macOS remote access](/platforms/mac/remote)

## Security rules (remote/VPN)

짧게 말하면: 정말 필요한 경우가 아니라면 **Gateway는 loopback-only**로 유지하세요.

- **Loopback + SSH/Tailscale Serve**가 가장 안전한 기본값입니다. 공개 노출이 없습니다.
- 평문 `ws://`는 기본적으로 loopback 전용입니다. 신뢰할 수 있는 private network에서만, 비상 수단으로 client process에 `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`을 설정할 수 있습니다.
- **Non-loopback bind**(`lan`/`tailnet`/`custom`, 또는 loopback을 못 쓸 때의 `auto`)는 반드시 auth token/password를 사용해야 합니다.
- `gateway.remote.token` / `.password`는 client 자격 증명 source입니다. 이것만으로 server auth가 구성되지는 않습니다.
- local call path는 `gateway.auth.*`가 비어 있으면 `gateway.remote.*`를 fallback으로 사용할 수 있습니다.
- `gateway.remote.tlsFingerprint`는 `wss://` 사용 시 remote TLS 인증서를 pinning합니다.
- **Tailscale Serve**는 `gateway.auth.allowTailscale: true`일 때 identity header로 Control UI/WebSocket을 인증할 수 있습니다. 하지만 HTTP API endpoint는 여전히 token/password auth가 필요합니다. 이 tokenless 흐름은 gateway host가 신뢰된다는 가정에 의존합니다. 모든 곳에서 token/password를 쓰고 싶다면 `false`로 두세요.
- browser control은 운영자 접근으로 취급하세요. tailnet 전용 + 의도적인 node pairing이 바람직합니다.

심화 내용: [Security](/gateway/security)
