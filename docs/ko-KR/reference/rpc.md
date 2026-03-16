---
summary: "외부 CLI 통합에 쓰이는 RPC adapter 패턴을 설명합니다."
description: "OpenClaw가 signal-cli와 legacy imsg를 HTTP daemon 또는 stdio child process 패턴으로 연결하는 방식을 정리합니다."
read_when:
  - 외부 CLI 통합을 추가하거나 변경할 때
  - RPC adapter(signal-cli, imsg)를 디버깅할 때
title: "RPC Adapters"
x-i18n:
  source_path: "reference/rpc.md"
---

# RPC 어댑터

OpenClaw는 JSON-RPC를 통해 외부 CLI와 통합합니다. 현재는 두 가지 패턴을 사용합니다.

## 패턴 A: HTTP daemon (signal-cli)

- `signal-cli`는 JSON-RPC over HTTP로 동작하는 daemon으로 실행됩니다.
- 이벤트 스트림은 SSE (`/api/v1/events`)입니다.
- 헬스 프로브: `/api/v1/check`
- `channels.signal.autoStart=true`이면 OpenClaw가 lifecycle을 소유합니다.

설정과 엔드포인트는 [Signal](/channels/signal) 문서를 참고하세요.

## 패턴 B: stdio child process (legacy: imsg)

> **Note:** 새 iMessage 설정에서는 [BlueBubbles](/channels/bluebubbles)를 사용하세요.

- OpenClaw는 `imsg rpc`를 child process로 실행합니다(legacy iMessage 통합).
- JSON-RPC는 stdin/stdout을 통해 line-delimited 방식으로 전달됩니다. 한 줄에 JSON object 하나입니다.
- TCP port나 daemon은 필요하지 않습니다.

사용되는 핵심 메서드:

- `watch.subscribe` → 알림(`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (probe/diagnostics)

레거시 설정과 주소 지정(`chat_id` 권장)은 [iMessage](/channels/imessage) 문서를 참고하세요.

## 어댑터 가이드라인

- Gateway가 process를 소유해야 합니다. start/stop은 provider lifecycle과 연결되어야 합니다.
- RPC client는 timeout과 exit 후 restart를 포함해 resilient하게 유지하세요.
- display string보다 안정적인 ID(예: `chat_id`)를 선호하세요.
