---
summary: "레거시 노드 전송 프로토콜인 브리지 프로토콜(TCP JSONL)의 구조, 페어링 및 역사적 배경 안내"
description: "레거시 TCP JSONL bridge transport의 handshake, pairing, scoped RPC 표면, 역사적 배경을 정리한 참고 문서입니다."
read_when:
  - "레거시 노드 클라이언트(구형 iOS/Android/macOS 노드)를 디버깅하거나 구조를 파악해야 할 때"
  - "과거의 페어링 또는 브리지 인증 실패 사례를 조사할 때"
  - "시스템에서 제거된 노드 노출 영역을 감사할 때"
title: "브리지 프로토콜 (레거시)"
x-i18n:
  source_path: "gateway/bridge-protocol.md"
---

# 브리지 프로토콜 (레거시 노드 전송 계층)

Bridge 프로토콜은 **레거시** 노드 전송 방식(TCP JSONL)입니다. 새 노드 클라이언트는 이 방식 대신 통합된 Gateway WebSocket 프로토콜을 사용해야 합니다.

새 operator나 node client를 만든다면 [Gateway protocol](/gateway/protocol)을 사용하세요.

**참고:** 현재 OpenClaw 빌드는 더 이상 TCP bridge listener를 포함하지 않습니다. 이 문서는 역사적 참고용으로만 유지되며, 레거시 `bridge.*` config keys도 현재 config schema에 포함되지 않습니다.

## Why we have both

과거에 bridge와 WebSocket을 함께 둔 이유는 다음과 같습니다.

- **Security boundary**: 전체 gateway API surface 대신 작은 allowlist만 노출했습니다.
- **Pairing + node identity**: node admission은 gateway가 소유하고, per-node token과 연결됐습니다.
- **Discovery UX**: nodes는 LAN에서 Bonjour로 gateway를 찾거나 tailnet을 통해 직접 연결할 수 있었습니다.
- **Loopback WS**: SSH로 터널링하지 않는 한 전체 WS control plane은 로컬에 머물렀습니다.

## Transport

- TCP, 한 줄에 하나의 JSON 객체를 쓰는 JSONL 형식입니다.
- 선택적으로 TLS를 지원했습니다 (`bridge.tls.enabled`가 true일 때).
- 레거시 기본 listener port는 `18790`이었습니다. 현재 빌드는 TCP bridge를 시작하지 않습니다.

TLS가 활성화되면 discovery TXT records에 `bridgeTls=1`과 `bridgeTlsSha256`이 포함됐습니다. 단, Bonjour/mDNS TXT records는 인증되지 않으므로, 명시적인 사용자 의도나 별도 검증 없이 광고된 fingerprint를 authoritative pin처럼 취급하면 안 됩니다.

## Handshake + pairing

1. 클라이언트가 node metadata와 token(이미 paired된 경우)을 담아 `hello`를 보냅니다.
2. paired되지 않았다면 gateway는 `error` (`NOT_PAIRED`/`UNAUTHORIZED`)를 돌려줍니다.
3. 클라이언트가 `pair-request`를 보냅니다.
4. gateway는 승인을 기다린 뒤 `pair-ok`와 `hello-ok`를 보냅니다.

`hello-ok`는 `serverName`을 반환하며, 경우에 따라 `canvasHostUrl`을 포함할 수 있습니다.

## Frames

Client → Gateway:

- `req` / `res`: scoped gateway RPC (chat, sessions, config, health, voicewake, skills.bins)
- `event`: node signals (voice transcript, agent request, chat subscribe, exec lifecycle)

Gateway → Client:

- `invoke` / `invoke-res`: node commands (`canvas.*`, `camera.*`, `screen.record`, `location.get`, `sms.send`)
- `event`: subscribed sessions의 chat updates
- `ping` / `pong`: keepalive

레거시 allowlist enforcement는 `src/gateway/server-bridge.ts`에 있었지만 지금은 제거됐습니다.

## Exec lifecycle events

nodes는 `system.run` 활동을 표면화하기 위해 `exec.finished` 또는 `exec.denied` 이벤트를 보낼 수 있습니다. 이 이벤트는 gateway 안에서 system events로 매핑됩니다. 레거시 nodes는 `exec.started`를 보낼 수도 있습니다.

Payload fields (명시되지 않은 항목은 선택 사항):

- `sessionKey` (필수): system event를 받을 agent session
- `runId`: 그룹화를 위한 고유 exec id
- `command`: 원시 또는 포맷된 command string
- `exitCode`, `timedOut`, `success`, `output`: 완료 상세 (`finished` 전용)
- `reason`: 거부 사유 (`denied` 전용)

## Tailnet usage

- bridge를 tailnet IP에 바인딩하려면 `~/.openclaw/openclaw.json`에서 `bridge.bind: "tailnet"`을 사용했습니다.
- clients는 MagicDNS name이나 tailnet IP로 연결했습니다.
- Bonjour는 네트워크를 넘지 않으므로 필요하면 수동 host/port 또는 wide-area DNS-SD를 사용했습니다.

## Versioning

Bridge는 현재 **암묵적인 v1**입니다. 최소/최대 버전 협상은 없고, 하위 호환성을 유지하는 것이 전제입니다. breaking changes를 만들기 전에는 bridge protocol version field를 추가해야 합니다.
