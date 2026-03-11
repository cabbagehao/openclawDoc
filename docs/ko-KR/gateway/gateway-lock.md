---
summary: "WebSocket 리스너 바인딩을 활용한 Gateway 단일 인스턴스 실행 보장 메커니즘 안내"
read_when:
  - Gateway 프로세스를 실행하거나 디버깅할 때
  - 중복 실행 방지 및 인스턴스 잠금 로직을 조사할 때
title: "Gateway 잠금 (인스턴스 보호)"
x-i18n:
  source_path: "gateway/gateway-lock.md"
---

# Gateway 잠금 (Gateway Lock)

최종 업데이트: 2025-12-11

## 목적 및 필요성

- **중복 실행 방지**: 동일한 호스트 내에서 기본 포트당 하나의 Gateway 인스턴스만 실행되도록 보장함. 추가 Gateway를 실행하려면 별도의 프로필과 고유한 포트 설정이 필요함.
- **안정적인 상태 관리**: 시스템 크래시나 강제 종료(SIGKILL) 상황에서도 유효하지 않은 잠금 파일(Stale lock files)을 남기지 않고 안전하게 재시작할 수 있어야 함.
- **빠른 실패(Fail-fast)**: 제어 포트가 이미 사용 중인 경우, 명확한 오류 메시지와 함께 즉시 실행을 중단하여 혼선을 방지함.

## 동작 메커니즘

- **독점적 바인딩**: Gateway는 시작 시점에 즉시 WebSocket 리스너(기본값 `ws://127.0.0.1:18789`)를 독점 TCP 리스너 방식으로 바인딩함.
- **충돌 감지**: 바인딩 시 `EADDRINUSE` 오류가 발생하면, 시스템은 `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")` 예외를 발생시키고 종료됨.
- **자동 해제**: 프로세스가 정상 종료되거나 크래시, SIGKILL 등으로 비정상 종료되더라도 운영체제(OS)가 리스너를 자동으로 해제함. 따라서 별도의 잠금 파일 생성이나 수동 정리 단계가 필요하지 않음.
- **정상 종료 처리**: 서버 종료 시 WebSocket 서버와 하부 HTTP 서버를 명시적으로 닫아 포트를 즉시 반환함.

## 오류 메시지 규격

- **포트 점유 중**: 다른 프로세스가 해당 포트를 사용 중인 경우 `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`를 반환함.
- **기타 바인딩 오류**: 권한 문제 등 기타 사유로 바인딩이 실패할 경우 `GatewayLockError("failed to bind gateway socket on ws://127.0.0.1:<port>: …")` 형태의 메시지를 노출함.

## 운영 참고 사항

- **포트 충돌 해결**: 만약 OpenClaw가 아닌 다른 프로세스가 포트를 점유하고 있더라도 동일한 오류가 발생함. 이 경우 해당 포트를 점유 중인 프로세스를 종료하거나, `openclaw gateway --port <port>` 명령어를 통해 다른 포트를 지정하여 실행해야 함.
- **macOS 앱 특이사항**: macOS 메뉴 막대 앱은 Gateway 프로세스를 생성(Spawn)하기 전에 자체적인 경량 PID 가드(Guard)를 별도로 유지하지만, 최종적인 런타임 잠금은 WebSocket 바인딩을 통해 강제됨.
