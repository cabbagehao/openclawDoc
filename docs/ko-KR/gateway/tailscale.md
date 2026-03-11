---
summary: "Gateway 대시보드를 위한 통합 Tailscale Serve/Funnel"
read_when:
  - Gateway Control UI를 localhost 밖으로 노출할 때
  - tailnet 또는 public dashboard 접근을 자동화할 때
title: "Tailscale"
---

# Tailscale (Gateway dashboard)

OpenClaw는 Gateway dashboard와 WebSocket 포트를 위해 Tailscale **Serve**(tailnet) 또는 **Funnel**(public)을 자동으로 설정할 수 있습니다. 이렇게 하면 Gateway는 loopback에만 바인딩한 상태로 두고, HTTPS, 라우팅, 그리고 Serve의 경우 identity header 처리는 Tailscale에 맡길 수 있습니다.

## Modes

- `serve`: `tailscale serve`를 통한 tailnet 전용 Serve. Gateway는 `127.0.0.1`에 유지됩니다.
- `funnel`: `tailscale funnel`을 통한 public HTTPS. OpenClaw는 공유 비밀번호를 요구합니다.
- `off`: 기본값이며 Tailscale 자동화를 사용하지 않습니다.

## Auth

핸드셰이크를 제어하려면 `gateway.auth.mode`를 설정하세요.

- `token` (`OPENCLAW_GATEWAY_TOKEN`이 설정되어 있으면 기본값)
- `password` (`OPENCLAW_GATEWAY_PASSWORD` 또는 설정 파일의 공유 비밀)

`tailscale.mode = "serve"`이고 `gateway.auth.allowTailscale`가 `true`이면, Control UI/WebSocket 인증은 token/password 없이도 Tailscale identity header(`tailscale-user-login`)를 사용할 수 있습니다. OpenClaw는 이 헤더를 수락하기 전에 로컬 Tailscale daemon(`tailscale whois`)을 통해 `x-forwarded-for` 주소를 조회하고 헤더와 일치하는지 검증합니다. OpenClaw는 요청이 loopback에서 들어오고 Tailscale의 `x-forwarded-for`, `x-forwarded-proto`, `x-forwarded-host` 헤더를 포함할 때만 이를 Serve 요청으로 간주합니다.

HTTP API 엔드포인트(예: `/v1/*`, `/tools/invoke`, `/api/channels/*`)는 여전히 token/password 인증이 필요합니다.

이 token 없는 흐름은 gateway 호스트를 신뢰할 수 있다는 전제를 둡니다. 같은 호스트에서 신뢰할 수 없는 로컬 코드가 실행될 수 있다면 `gateway.auth.allowTailscale`를 비활성화하고 token/password 인증을 요구하세요.

명시적 자격 증명을 강제하려면 `gateway.auth.allowTailscale: false`를 설정하거나 `gateway.auth.mode: "password"`를 강제하세요.

## Config examples

### Tailnet-only (Serve)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

열기: `https://<magicdns>/` 또는 설정한 `gateway.controlUi.basePath`

### Tailnet-only (bind to Tailnet IP)

Serve/Funnel 없이 Gateway가 Tailnet IP에 직접 리슨하도록 하려면 이 모드를 사용합니다.

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

다른 Tailnet 기기에서 연결:

- Control UI: `http://<tailscale-ip>:18789/`
- WebSocket: `ws://<tailscale-ip>:18789`

참고: 이 모드에서는 loopback(`http://127.0.0.1:18789`)이 **동작하지 않습니다**.

### Public internet (Funnel + shared password)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password", password: "replace-me" },
  },
}
```

비밀번호를 파일에 커밋하는 대신 `OPENCLAW_GATEWAY_PASSWORD`를 사용하는 편이 낫습니다.

## CLI examples

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## Notes

- Tailscale Serve/Funnel을 사용하려면 `tailscale` CLI가 설치되어 있고 로그인되어 있어야 합니다.
- `tailscale.mode: "funnel"`은 public 노출을 피하기 위해 인증 모드가 `password`가 아니면 시작을 거부합니다.
- 종료 시 OpenClaw가 `tailscale serve` 또는 `tailscale funnel` 설정을 되돌리게 하려면 `gateway.tailscale.resetOnExit`를 설정하세요.
- `gateway.bind: "tailnet"`은 Tailnet에 직접 바인딩하는 방식입니다. HTTPS나 Serve/Funnel은 사용하지 않습니다.
- `gateway.bind: "auto"`는 loopback을 선호합니다. Tailnet 전용으로 쓰려면 `tailnet`을 사용하세요.
- Serve/Funnel은 **Gateway control UI + WS**만 노출합니다. 노드는 같은 Gateway WS 엔드포인트로 연결되므로, node 접근에도 Serve를 사용할 수 있습니다.

## Browser control (remote Gateway + local browser)

Gateway를 한 기기에서 실행하고 브라우저는 다른 기기에서 제어하려면, 브라우저가 있는 기기에서 **node host**를 실행하고 둘을 같은 tailnet에 두세요. Gateway가 브라우저 작업을 그 node로 프록시하므로, 별도 control server나 Serve URL은 필요하지 않습니다.

브라우저 제어에는 Funnel을 피하세요. node pairing은 운영자 접근처럼 다루어야 합니다.

## Tailscale prerequisites + limits

- Serve는 tailnet에 HTTPS가 활성화되어 있어야 하며, 없으면 CLI가 안내합니다.
- Serve는 Tailscale identity header를 주입하지만 Funnel은 그렇지 않습니다.
- Funnel에는 Tailscale v1.38.3+, MagicDNS, HTTPS 활성화, funnel node attribute가 필요합니다.
- Funnel은 TLS에서 `443`, `8443`, `10000` 포트만 지원합니다.
- macOS에서 Funnel을 사용하려면 오픈소스 Tailscale 앱 변형이 필요합니다.

## Learn more

- Tailscale Serve overview: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- `tailscale serve` command: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Tailscale Funnel overview: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- `tailscale funnel` command: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)
