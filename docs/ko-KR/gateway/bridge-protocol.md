---
summary: "Bridge protocol (레거시 nodes): TCP JSONL, pairing, scoped RPC"
read_when:
  - node client(iOS/Android/macOS node mode)를 만들거나 디버깅할 때
  - pairing 또는 bridge auth 실패를 조사할 때
  - gateway 가 노출하는 node 표면을 감사할 때
title: "Bridge Protocol"
---

# Bridge protocol (레거시 node transport)

Bridge protocol 은 **레거시** node transport(TCP JSONL)입니다. 새 node client 는 대신 통합 Gateway WebSocket protocol 을 사용해야 합니다.

운영 도구나 node client 를 만들고 있다면 [Gateway protocol](/gateway/protocol) 을 사용하세요.

**Note:** 현재 OpenClaw 빌드는 더 이상 TCP bridge listener 를 포함하지 않습니다. 이 문서는 역사적 참고를 위해 유지됩니다.
레거시 `bridge.*` config key 역시 더 이상 config schema 의 일부가 아닙니다.

## 왜 둘 다 있었나

- **보안 경계**: bridge 는 전체 gateway API surface 대신 작은 allowlist 만 노출
- **Pairing + node identity**: node admission 은 gateway 가 소유하며 node 별 token 과 연결됨
- **Discovery UX**: node 는 LAN 에서 Bonjour 로 gateway 를 찾거나 tailnet 을 통해 직접 연결 가능
- **Loopback WS**: SSH 로 터널링하지 않는 한 전체 WS control plane 은 로컬에만 유지됨

## Transport

- TCP, 한 줄당 하나의 JSON object (JSONL)
- 선택적 TLS (`bridge.tls.enabled` 가 true 일 때)
- 레거시 기본 listener 포트는 `18790` 이었음(현재 빌드는 TCP bridge 를 시작하지 않음)

TLS 가 활성화되면 discovery TXT record 에는 `bridgeTls=1` 과 함께 비밀이 아닌 힌트로 `bridgeTlsSha256` 이 포함됩니다. 다만 Bonjour/mDNS TXT record 는 인증되지 않으므로, 클라이언트는 사용자의 명시적 의도나 다른 out-of-band 검증 없이 광고된 fingerprint 를 권위 있는 pin 으로 취급해서는 안 됩니다.

## Handshake + pairing

1. client 가 node metadata + token(이미 paired 된 경우)을 담은 `hello` 전송
2. paired 상태가 아니면 gateway 가 `error` (`NOT_PAIRED`/`UNAUTHORIZED`) 응답
3. client 가 `pair-request` 전송
4. gateway 가 승인을 기다린 뒤 `pair-ok` 와 `hello-ok` 전송

`hello-ok` 는 `serverName` 을 반환하며 `canvasHostUrl` 을 포함할 수 있습니다.

## Frames

Client → Gateway:

- `req` / `res`: 범위가 제한된 gateway RPC (chat, sessions, config, health, voicewake, skills.bins)
- `event`: node signals (voice transcript, agent request, chat subscribe, exec lifecycle)

Gateway → Client:

- `invoke` / `invoke-res`: node commands (`canvas.*`, `camera.*`, `screen.record`,
  `location.get`, `sms.send`)
- `event`: 구독된 session 의 chat updates
- `ping` / `pong`: keepalive

레거시 allowlist enforcement 는 `src/gateway/server-bridge.ts` 에 있었으며 지금은 제거되었습니다.

## Exec lifecycle events

node 는 `exec.finished` 또는 `exec.denied` 이벤트를 내보내 `system.run` 활동을 노출할 수 있습니다.
이 이벤트는 gateway 에서 system event 로 매핑됩니다. (레거시 node 는 여전히 `exec.started` 를 보낼 수 있습니다.)

payload 필드(명시되지 않으면 모두 선택 사항):

- `sessionKey` (필수): system event 를 받을 agent session
- `runId`: 그룹화를 위한 고유 exec id
- `command`: raw 또는 포맷된 command string
- `exitCode`, `timedOut`, `success`, `output`: 완료 상세(finished 에만)
- `reason`: 거부 사유(denied 에만)

## Tailnet 사용

- bridge 를 tailnet IP 에 bind: `~/.openclaw/openclaw.json` 에서 `bridge.bind: "tailnet"`
- client 는 MagicDNS 이름이나 tailnet IP 로 연결
- Bonjour 는 네트워크를 넘지 않으므로, 필요하면 수동 host/port 또는 wide-area DNS-SD 를 사용

## Versioning

Bridge 는 현재 **암묵적 v1** 입니다(min/max 협상 없음). 하위 호환이 기대되며, breaking change 전에 bridge protocol version 필드를 추가해야 합니다.
