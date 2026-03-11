---
summary: "외부 CLI(signal-cli, legacy imsg)와 gateway 패턴을 위한 RPC 어댑터"
read_when:
  - 외부 CLI 통합을 추가하거나 변경할 때
  - RPC 어댑터(signal-cli, imsg)를 디버깅할 때
title: "RPC Adapters"
---

# RPC 어댑터

OpenClaw 는 JSON-RPC 를 통해 외부 CLI 와 통합합니다. 현재는 두 가지 패턴을 사용합니다.

## 패턴 A: HTTP daemon (signal-cli)

- `signal-cli` 는 JSON-RPC over HTTP 로 동작하는 daemon 으로 실행됩니다.
- 이벤트 스트림은 SSE (`/api/v1/events`)입니다.
- 헬스 프로브: `/api/v1/check`
- `channels.signal.autoStart=true` 이면 OpenClaw 가 라이프사이클을 소유합니다.

설정과 엔드포인트는 [Signal](/channels/signal) 문서를 참고하세요.

## 패턴 B: stdio child process (legacy: imsg)

> **Note:** 새 iMessage 설정에서는 대신 [BlueBubbles](/channels/bluebubbles) 를 사용하세요.

- OpenClaw 는 `imsg rpc` 를 child process 로 실행합니다(레거시 iMessage 통합).
- JSON-RPC 는 stdin/stdout 을 통해 줄 단위로 전달됩니다(한 줄에 JSON 객체 하나).
- TCP 포트도, daemon 도 필요하지 않습니다.

사용되는 핵심 메서드:

- `watch.subscribe` → 알림(`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (프로브/진단)

레거시 설정과 주소 지정(`chat_id` 권장)은 [iMessage](/channels/imessage) 문서를 참고하세요.

## 어댑터 가이드라인

- Gateway 가 프로세스를 소유해야 합니다(provider 라이프사이클과 start/stop 연동).
- RPC 클라이언트는 복원력 있게 유지하세요. 타임아웃, 종료 시 재시작이 필요합니다.
- 표시 문자열보다 안정적인 ID(예: `chat_id`)를 선호하세요.
