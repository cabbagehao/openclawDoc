---
summary: "WebSocket listener bind로 Gateway singleton을 보장하는 방식을 설명합니다."
description: "Gateway가 lock file 없이도 단일 인스턴스를 강제하는 이유, `EADDRINUSE` 오류가 나는 조건, 운영 시 확인할 점을 정리합니다."
read_when:
  - Gateway process를 실행하거나 디버깅할 때
  - single-instance enforcement를 확인할 때
title: "Gateway Lock"
x-i18n:
  source_path: "gateway/gateway-lock.md"
---

# Gateway lock

Last updated: 2025-12-11

## Why

- 같은 호스트에서 같은 base port마다 gateway instance가 하나만 실행되도록 보장합니다. 추가 gateway는 profile과 port를 분리해야 합니다.
- crash나 `SIGKILL` 이후에도 stale lock file 없이 복구되어야 합니다.
- control port가 이미 점유된 경우 명확한 오류와 함께 즉시 실패해야 합니다.

## Mechanism

- gateway는 시작 직후 WebSocket listener(기본값 `ws://127.0.0.1:18789`)를 exclusive TCP listener로 bind합니다.
- bind가 `EADDRINUSE`로 실패하면 startup에서 `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`를 던집니다.
- process가 정상 종료되든 crash/SIGKILL로 끝나든 OS가 listener를 자동으로 해제하므로 별도 lock file이나 cleanup 단계가 필요 없습니다.
- 종료 시에는 WebSocket server와 underlying HTTP server를 닫아 port를 빠르게 반환합니다.

## Error surface

- 다른 process가 port를 잡고 있으면 `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`가 발생합니다.
- 그 외 bind 실패는 `GatewayLockError("failed to bind gateway socket on ws://127.0.0.1:<port>: …")`로 노출됩니다.

## Operational notes

- port를 점유한 주체가 다른 gateway가 아니라 다른 process여도 동일한 오류가 납니다. 이 경우 port를 비우거나 `openclaw gateway --port <port>`로 다른 port를 사용하세요.
- macOS app은 gateway를 spawn하기 전에 자체적인 lightweight PID guard를 유지하지만, 실제 runtime lock은 WebSocket bind가 강제합니다.
