---
summary: "Gateway 대시보드 및 WebSocket을 위한 통합 Tailscale Serve/Funnel 설정 가이드"
description: "Tailscale Serve 또는 Funnel로 Gateway dashboard와 WS를 노출할 때의 mode, auth, config examples, limits를 설명합니다."
read_when:
  - "Gateway control UI를 localhost 밖으로 노출할 때"
  - "tailnet 또는 public dashboard access를 자동화할 때"
title: "Tailscale"
x-i18n:
  source_path: "gateway/tailscale.md"
---

# Tailscale (Gateway dashboard)

OpenClaw는 Gateway dashboard와 WebSocket port를 위해 Tailscale **Serve** (tailnet) 또는 **Funnel** (public)을 자동 구성할 수 있습니다. 이렇게 하면 Gateway는 loopback에 bind된 상태를 유지하면서, Tailscale이 HTTPS, routing, 그리고 Serve의 경우 identity headers를 제공합니다.

## Modes

- `serve`: `tailscale serve`를 통한 tailnet-only Serve. Gateway는 `127.0.0.1`에 남습니다.
- `funnel`: `tailscale funnel`을 통한 public HTTPS. OpenClaw는 shared password를 요구합니다.
- `off`: 기본값. Tailscale automation을 사용하지 않음.

## Auth

handshake는 `gateway.auth.mode`로 제어합니다.

- `token` (`OPENCLAW_GATEWAY_TOKEN`이 있으면 기본값)
- `password` (`OPENCLAW_GATEWAY_PASSWORD` 또는 config)

`tailscale.mode = "serve"`이고 `gateway.auth.allowTailscale`이 `true`이면, Control UI/WebSocket auth는 token/password 없이 Tailscale identity headers (`tailscale-user-login`)를 사용할 수 있습니다.

- OpenClaw는 local Tailscale daemon (`tailscale whois`)으로 `x-forwarded-for`를 조회해 header 정보와 일치하는지 검증합니다.
- 요청이 loopback에서 들어오고 Tailscale의 `x-forwarded-for`, `x-forwarded-proto`, `x-forwarded-host` headers가 모두 있을 때만 Serve로 간주합니다.
- HTTP API endpoints (예: `/v1/*`, `/tools/invoke`, `/api/channels/*`)는 여전히 token/password auth를 요구합니다.
- 이 tokenless flow는 gateway host를 신뢰한다는 전제에 의존합니다. 같은 host에서 신뢰할 수 없는 local code가 실행될 수 있다면 `gateway.auth.allowTailscale`을 끄고 token/password auth를 사용하세요.

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
열기: `https://<magicdns>/` (또는 설정한 `gateway.controlUi.basePath`)

### Tailnet-only (bind to Tailnet IP)

Serve/Funnel 없이 Gateway가 Tailnet IP에서 직접 listen해야 할 때 사용합니다.

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```
다른 Tailnet device에서 연결:
- 제어 UI: `http://<tailscale-ip>:18789/`
- WebSocket: `ws://<tailscale-ip>:18789`

Note: 이 모드에서는 loopback (`http://127.0.0.1:18789`)이 동작하지 않습니다.

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

비밀번호를 disk에 commit하기보다는 `OPENCLAW_GATEWAY_PASSWORD`를 사용하는 편이 좋습니다.

## CLI examples

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## Notes

- Tailscale Serve/Funnel을 쓰려면 `tailscale` CLI가 설치되어 있고 로그인되어 있어야 합니다.
- `tailscale.mode: "funnel"`은 auth mode가 `password`가 아니면 시작을 거부합니다.
- 종료 시 `tailscale serve` 또는 `tailscale funnel` 구성을 되돌리고 싶다면 `gateway.tailscale.resetOnExit`를 설정하세요.
- `gateway.bind: "tailnet"`은 direct Tailnet bind입니다. HTTPS도, Serve/Funnel도 아닙니다.
- `gateway.bind: "auto"`는 loopback을 선호합니다. Tailnet-only를 원하면 `tailnet`을 쓰세요.
- Serve/Funnel은 **Gateway control UI + WS**를 노출합니다. nodes도 같은 Gateway WS endpoint를 사용하므로 Serve로 node access가 동작할 수 있습니다.

## Browser control (remote Gateway + local browser)

Gateway는 한 기계에 있고 브라우저는 다른 기계에서 제어하고 싶다면, 브라우저 기계에서 **node host**를 실행하고 둘을 같은 tailnet에 두세요. Gateway가 browser actions를 node로 프록시하므로 별도 control server나 Serve URL이 필요하지 않습니다.

browser control에는 Funnel을 쓰지 마세요. node pairing은 operator access처럼 다뤄야 합니다.

## Tailscale prerequisites + limits

- Serve는 tailnet에 HTTPS가 활성화되어 있어야 합니다.
- Serve는 Tailscale identity headers를 주입하지만 Funnel은 주입하지 않습니다.
- Funnel은 Tailscale v1.38.3+, MagicDNS, HTTPS enabled, funnel node attribute가 필요합니다.
- Funnel은 TLS에서 `443`, `8443`, `10000` 포트만 지원합니다.
- macOS에서 Funnel은 open-source Tailscale app variant가 필요합니다.

## Learn more

- Tailscale Serve 개요: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- `tailscale serve` 명령어: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Tailscale Funnel 개요: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- `tailscale funnel` 명령어: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)
