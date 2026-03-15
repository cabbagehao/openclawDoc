---
summary: "iOS node app: Gateway 연결, pairing, canvas, 문제 해결"
read_when:
  - iOS node 를 페어링하거나 다시 연결할 때
  - 소스에서 iOS 앱을 실행할 때
  - gateway discovery 또는 canvas 명령을 디버깅할 때
title: "iOS App"
---

# iOS App (Node)

Availability: 내부 프리뷰입니다. iOS 앱은 아직 공개 배포되지 않습니다.

## What it does

- WebSocket(LAN 또는 tailnet)으로 Gateway 에 연결합니다.
- Canvas, Screen snapshot, Camera capture, Location, Talk mode, Voice wake 등 node capability 를 노출합니다.
- `node.invoke` 명령을 수신하고 node status event 를 보고합니다.

## Requirements

- 다른 기기(macOS, Linux, 또는 WSL2 를 통한 Windows)에서 Gateway 가 실행 중이어야 합니다.
- 네트워크 경로:
  - Bonjour 를 통한 동일 LAN, **또는**
  - unicast DNS-SD 를 통한 tailnet(예시 도메인: `openclaw.internal.`), **또는**
  - 수동 host/port 입력(fallback).

## Quick start (pair + connect)

1. Gateway 를 시작합니다:

```bash
openclaw gateway --port 18789
```

2. iOS 앱에서 Settings 를 열고 발견된 gateway 를 선택합니다(또는 Manual Host 를 활성화하고 host/port 를 입력합니다).

3. gateway 호스트에서 pairing 요청을 승인합니다:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

4. 연결을 확인합니다:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Discovery paths

### Bonjour (LAN)

Gateway 는 `local.` 에서 `_openclaw-gw._tcp` 를 광고합니다. iOS 앱은 이를 자동으로 나열합니다.

### Tailnet (cross-network)

mDNS 가 차단되어 있다면 unicast DNS-SD zone(도메인을 하나 선택하세요. 예: `openclaw.internal.`)과 Tailscale split DNS 를 사용하세요.
CoreDNS 예시는 [Bonjour](/gateway/bonjour) 를 참고하세요.

### Manual host/port

Settings 에서 **Manual Host** 를 활성화하고 gateway host + port(기본값 `18789`)를 입력합니다.

## Canvas + A2UI

iOS node 는 WKWebView canvas 를 렌더링합니다. 이를 제어하려면 `node.invoke` 를 사용하세요:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Notes:

- Gateway canvas host 는 `/__openclaw__/canvas/` 와 `/__openclaw__/a2ui/` 를 제공합니다.
- 이것은 Gateway HTTP server(`gateway.port`, 기본값 `18789` 와 같은 포트)에서 제공됩니다.
- iOS node 는 canvas host URL 이 광고되면 연결 시 자동으로 A2UI 로 이동합니다.
- `canvas.navigate` 와 `{"url":""}` 로 내장 scaffold 로 돌아갈 수 있습니다.

### Canvas eval / snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Voice wake + talk mode

- Settings 에서 Voice wake 와 talk mode 를 사용할 수 있습니다.
- iOS 는 백그라운드 오디오를 중단할 수 있으므로, 앱이 활성 상태가 아닐 때 음성 기능은 best-effort 로 취급하세요.

## Common errors

- `NODE_BACKGROUND_UNAVAILABLE`: iOS 앱을 foreground 로 가져오세요(canvas/camera/screen 명령에는 이것이 필요합니다).
- `A2UI_HOST_NOT_CONFIGURED`: Gateway 가 canvas host URL 을 광고하지 않았습니다. [Gateway configuration](/gateway/configuration) 의 `canvasHost` 를 확인하세요.
- Pairing prompt never appears: `openclaw devices list` 를 실행하고 수동으로 승인하세요.
- Reconnect fails after reinstall: Keychain pairing token 이 지워졌습니다. node 를 다시 페어링하세요.

## Related docs

- [Pairing](/channels/pairing)
- [Discovery](/gateway/discovery)
- [Bonjour](/gateway/bonjour)
