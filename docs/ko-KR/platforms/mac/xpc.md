---
summary: "OpenClaw app, gateway node transport, PeekabooBridge를 잇는 macOS IPC 구조를 설명합니다."
description: "macOS에서 Unix socket 기반 IPC, `system.run` 전달, PeekabooBridge UI automation, TeamID 기반 하드닝이 어떻게 연결되는지 정리합니다."
read_when:
  - IPC contract나 menu bar app IPC를 수정할 때
title: "macOS IPC"
x-i18n:
  source_path: "platforms/mac/xpc.md"
---

# OpenClaw macOS IPC 아키텍처

**현재 모델:** local Unix socket이 **node host service**와 **macOS app**을 연결해 exec approval과 `system.run`을 처리합니다. discovery/connect 확인용 `openclaw-mac` debug CLI가 있고, agent action은 여전히 Gateway WebSocket과 `node.invoke`를 통해 흐릅니다. UI automation은 PeekabooBridge를 사용합니다.

## 목표

- 모든 TCC 관련 작업(notification, screen recording, mic, speech, AppleScript)을 단일 GUI app instance가 소유
- automation surface를 작게 유지: Gateway + node command, 그리고 UI automation용 PeekabooBridge
- 예측 가능한 permission 유지: 항상 같은 signed bundle ID가 launchd로 실행되어 TCC grant가 유지됨

## 동작 방식

### Gateway + node transport

- app이 Gateway를 실행(local mode)하고 node로 연결됩니다.
- agent action은 `node.invoke`로 수행됩니다(예: `system.run`, `system.notify`, `canvas.*`).

### Node service + app IPC

- headless node host service가 Gateway WebSocket에 연결됩니다.
- `system.run` 요청은 local Unix socket을 통해 macOS app으로 전달됩니다.
- app은 UI context에서 exec를 수행하고, 필요하면 prompt를 띄운 뒤 output을 반환합니다.

다이어그램 (SCI):

```
Agent -> Gateway -> Node Service (WS)
                      |  IPC (UDS + token + HMAC + TTL)
                      v
                  Mac App (UI + TCC + system.run)
```

### PeekabooBridge (UI 자동화)

- UI automation은 `bridge.sock`이라는 별도 UNIX socket과 PeekabooBridge JSON protocol을 사용합니다.
- host 우선순위(client side): Peekaboo.app -> Claude.app -> OpenClaw.app -> local execution
- security: bridge host는 허용된 TeamID를 요구합니다. DEBUG 전용 same-UID escape hatch는 `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1`로 보호됩니다.
- 자세한 내용: [PeekabooBridge usage](/platforms/mac/peekaboo)

## 운영 흐름

- 재시작/재빌드: `SIGN_IDENTITY="Apple Development: <Developer Name> (<TEAMID>)" scripts/restart-mac.sh`
  - 기존 인스턴스 종료
  - Swift build + package
  - LaunchAgent 작성/부트스트랩/킥스타트
- 단일 instance: 동일 bundle ID의 다른 instance가 이미 실행 중이면 app이 조기 종료합니다.

## 하드닝 메모

- 가능하면 모든 privileged surface에 TeamID match를 요구하세요.
- PeekabooBridge의 `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1`은 DEBUG 전용이며, local development에서 same-UID caller를 허용할 수 있습니다.
- 모든 통신은 local-only이며 network socket은 노출되지 않습니다.
- TCC prompt는 GUI app bundle에서만 발생합니다. rebuild 사이에서도 signed bundle ID를 안정적으로 유지하세요.
- IPC hardening 요소는 socket mode `0600`, token, peer-UID check, HMAC challenge/response, 짧은 TTL입니다.
