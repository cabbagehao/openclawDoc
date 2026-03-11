---
summary: "OpenClaw 앱, gateway node transport, PeekabooBridge 를 위한 macOS IPC 아키텍처"
read_when:
  - IPC 계약이나 메뉴 바 앱 IPC 를 수정할 때
title: "macOS IPC"
---

# OpenClaw macOS IPC 아키텍처

**현재 모델:** 로컬 Unix socket 이 **node host service** 와 **macOS app** 을 연결하여 exec approvals 와 `system.run` 을 처리합니다. 발견/연결 확인용 `openclaw-mac` 디버그 CLI 가 존재하며, agent action 은 여전히 Gateway WebSocket 과 `node.invoke` 를 통해 흐릅니다. UI 자동화는 PeekabooBridge 를 사용합니다.

## 목표

- 모든 TCC 관련 작업(알림, screen recording, mic, speech, AppleScript)을 단일 GUI 앱 인스턴스가 소유
- 자동화를 위한 작은 표면 유지: Gateway + node commands, 그리고 UI 자동화를 위한 PeekabooBridge
- 예측 가능한 권한: 항상 같은 서명된 bundle ID 가 launchd 에 의해 실행되어 TCC 권한이 유지됨

## 동작 방식

### Gateway + node transport

- 앱이 Gateway 를 실행(local mode)하고 node 로 연결됩니다.
- agent action 은 `node.invoke` 로 수행됩니다(예: `system.run`, `system.notify`, `canvas.*`).

### Node service + app IPC

- headless node host service 가 Gateway WebSocket 에 연결됩니다.
- `system.run` 요청은 로컬 Unix socket 을 통해 macOS 앱으로 전달됩니다.
- 앱은 UI 컨텍스트에서 exec 를 수행하고, 필요 시 프롬프트를 띄운 뒤 출력을 반환합니다.

다이어그램 (SCI):

```
Agent -> Gateway -> Node Service (WS)
                      |  IPC (UDS + token + HMAC + TTL)
                      v
                  Mac App (UI + TCC + system.run)
```

### PeekabooBridge (UI 자동화)

- UI 자동화는 `bridge.sock` 이라는 별도 UNIX socket 과 PeekabooBridge JSON protocol 을 사용합니다.
- 호스트 우선순위(클라이언트 측): Peekaboo.app → Claude.app → OpenClaw.app → local execution
- 보안: bridge host 는 허용된 TeamID 를 요구합니다. DEBUG 전용 same-UID escape hatch 는 `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` 로 보호됩니다(Peekaboo 관례).
- 자세한 내용: [PeekabooBridge usage](/platforms/mac/peekaboo)

## 운영 흐름

- 재시작/재빌드: `SIGN_IDENTITY="Apple Development: <Developer Name> (<TEAMID>)" scripts/restart-mac.sh`
  - 기존 인스턴스 종료
  - Swift build + package
  - LaunchAgent 작성/부트스트랩/킥스타트
- 단일 인스턴스: 동일 bundle ID 의 다른 인스턴스가 이미 실행 중이면 앱이 조기 종료합니다.

## 하드닝 메모

- 가능한 한 모든 privileged surface 에 TeamID 일치를 요구하는 편이 좋습니다.
- PeekabooBridge: `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (DEBUG 전용)은 로컬 개발 시 same-UID caller 를 허용할 수 있습니다.
- 모든 통신은 로컬에만 머물며 네트워크 소켓은 노출되지 않습니다.
- TCC 프롬프트는 GUI 앱 번들에서만 발생합니다. 재빌드 간에도 signed bundle ID 를 안정적으로 유지하세요.
- IPC 하드닝: socket mode `0600`, token, peer-UID checks, HMAC challenge/response, 짧은 TTL.
