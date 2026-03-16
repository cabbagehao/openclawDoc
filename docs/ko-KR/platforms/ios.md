---
summary: "iOS node app: Gateway 연결, pairing, canvas, 문제 해결"
description: "iOS node app을 Gateway에 연결하고 pairing, discovery, canvas, talk mode, common errors를 점검하는 가이드입니다."
read_when:
  - "iOS node를 pair하거나 다시 연결할 때"
  - "source에서 iOS app을 실행할 때"
  - "gateway discovery 또는 canvas commands를 디버깅할 때"
title: "iOS App"
x-i18n:
  source_path: "platforms/ios.md"
---

# iOS App (Node)

Availability: internal preview입니다. iOS app은 아직 공개 배포되지 않습니다.

## What it does

- WebSocket (LAN 또는 tailnet)으로 Gateway에 연결합니다.
- Canvas, Screen snapshot, Camera capture, Location, Talk mode, Voice wake 등 node capabilities를 노출합니다.
- `node.invoke` commands를 수신하고 node status events를 보고합니다.

## Requirements

- 다른 기기(macOS, Linux, 또는 WSL2를 통한 Windows)에서 Gateway가 실행 중이어야 합니다.
- 네트워크 경로:
  - Bonjour 를 통한 동일 LAN, **또는**
  - unicast DNS-SD 를 통한 tailnet(예시 도메인: `openclaw.internal.`), **또는**
  - 수동 host/port 입력(fallback).

## Quick start (pair + connect)

1. Gateway를 시작합니다.

```bash
openclaw gateway --port 18789
```

2. iOS app에서 Settings를 열고 discovered gateway를 선택합니다. 또는 Manual Host를 활성화하고 host/port를 입력합니다.

3. gateway host에서 pairing request를 승인합니다.

```bash
openclaw devices list
openclaw devices approve <requestId>
```

4. 연결을 확인합니다.

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Discovery paths

### Bonjour (LAN)

Gateway는 `local.`에서 `_openclaw-gw._tcp`를 광고합니다. iOS app은 이를 자동으로 나열합니다.

### Tailnet (cross-network)

mDNS가 차단되어 있다면 unicast DNS-SD zone(예: `openclaw.internal.`)과 Tailscale split DNS를 사용하세요.
CoreDNS 예시는 [Bonjour](/gateway/bonjour)를 참고하세요.

### Manual host/port

Settings에서 **Manual Host**를 활성화하고 gateway host + port(기본값 `18789`)를 입력합니다.

## Canvas + A2UI

iOS node는 WKWebView canvas를 렌더링합니다. 이를 제어하려면 `node.invoke`를 사용하세요.

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Notes:

- Gateway canvas host는 `/__openclaw__/canvas/`와 `/__openclaw__/a2ui/`를 제공합니다.
- 이것은 Gateway HTTP server에서 제공되며, 포트는 `gateway.port`와 같습니다(기본값 `18789`).
- iOS node는 canvas host URL이 광고되면 connect 시 자동으로 A2UI로 이동합니다.
- `canvas.navigate`와 `{"url":""}`로 built-in scaffold로 돌아갈 수 있습니다.

### Canvas eval / snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Voice wake + talk mode

- Settings에서 Voice wake와 Talk mode를 사용할 수 있습니다.
- iOS는 background audio를 중단할 수 있으므로, 앱이 활성 상태가 아닐 때 voice features는 best-effort로 취급하세요.

## Common errors

- `NODE_BACKGROUND_UNAVAILABLE`: iOS app을 foreground로 가져오세요. canvas/camera/screen commands에는 이것이 필요합니다.
- `A2UI_HOST_NOT_CONFIGURED`: Gateway가 canvas host URL을 광고하지 않았습니다. [Gateway configuration](/gateway/configuration)의 `canvasHost`를 확인하세요.
- Pairing prompt never appears: `openclaw devices list`를 실행하고 수동으로 승인하세요.
- Reconnect fails after reinstall: Keychain pairing token이 지워졌습니다. node를 다시 pair하세요.

## Related docs

- [Pairing](/channels/pairing)
- [Discovery](/gateway/discovery)
- [Bonjour](/gateway/bonjour)
