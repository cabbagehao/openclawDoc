---
summary: "WebSocket 리스너 바인딩을 사용하는 gateway 단일 인스턴스 보호"
read_when:
  - gateway 프로세스를 실행하거나 디버깅할 때
  - 단일 인스턴스 강제를 조사할 때
title: "Gateway 잠금"
---

# Gateway 잠금

마지막 업데이트: 2025-12-11

## 이유

- 동일한 호스트에서 base port마다 gateway 인스턴스가 하나만 실행되도록 보장합니다. 추가 gateway는 격리된 프로필과 고유한 포트를 사용해야 합니다.
- 오래된 lock 파일을 남기지 않고 crash/SIGKILL을 견딥니다.
- control port가 이미 점유되어 있으면 명확한 오류와 함께 즉시 실패합니다.

## 메커니즘

- gateway는 시작 직후 독점 TCP 리스너를 사용해 WebSocket 리스너(기본값 `ws://127.0.0.1:18789`)를 바인딩합니다.
- 바인딩이 `EADDRINUSE` 로 실패하면 시작 과정에서 `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")` 를 발생시킵니다.
- crash와 SIGKILL을 포함해 프로세스가 어떤 방식으로든 종료되면 OS가 리스너를 자동으로 해제하므로, 별도의 lock 파일이나 정리 단계가 필요하지 않습니다.
- 종료 시 gateway는 포트를 신속히 해제하기 위해 WebSocket 서버와 기반 HTTP 서버를 닫습니다.

## 오류 표면

- 다른 프로세스가 해당 포트를 점유하고 있으면 시작 과정에서 `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")` 를 발생시킵니다.
- 그 외 바인딩 실패는 `GatewayLockError("failed to bind gateway socket on ws://127.0.0.1:<port>: …")` 로 노출됩니다.

## 운영 메모

- 포트를 _다른_ 프로세스가 점유한 경우에도 오류는 동일합니다. 포트를 비우거나 `openclaw gateway --port <port>` 로 다른 포트를 선택하세요.
- macOS 앱은 여전히 gateway를 spawn하기 전에 자체적인 경량 PID guard를 유지하지만, 런타임 lock은 WebSocket 바인딩으로 강제됩니다.
