---
summary: "Gateway WebSocket 프로토콜: 핸드셰이크, 프레임, 버저닝"
read_when:
  - gateway WS 클라이언트를 구현하거나 업데이트할 때
  - 프로토콜 불일치나 connect 실패를 디버깅할 때
  - 프로토콜 스키마/모델을 다시 생성할 때
title: "Gateway 프로토콜"
---

# Gateway 프로토콜 (WebSocket)

Gateway WS 프로토콜은 OpenClaw의 **단일 control plane + node transport** 입니다. 모든 클라이언트(CLI, web UI, macOS app, iOS/Android node, headless node)는 WebSocket으로 연결하고 핸드셰이크 시점에 자신의 **role** 과 **scope** 를 선언합니다.

## 전송

- WebSocket, JSON payload를 담는 text frame 사용
- 첫 번째 frame은 **반드시** `connect` 요청이어야 함

## 핸드셰이크 (`connect`)

Gateway → Client (pre-connect challenge):

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

Client → Gateway:

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
    "client": {
      "id": "cli",
      "version": "1.2.3",
      "platform": "macos",
      "mode": "operator"
    },
    "role": "operator",
    "scopes": ["operator.read", "operator.write"],
    "caps": [],
    "commands": [],
    "permissions": {},
    "auth": { "token": "…" },
    "locale": "en-US",
    "userAgent": "openclaw-cli/1.2.3",
    "device": {
      "id": "device_fingerprint",
      "publicKey": "…",
      "signature": "…",
      "signedAt": 1737264000000,
      "nonce": "…"
    }
  }
}
```

Gateway → Client:

```json
{
  "type": "res",
  "id": "…",
  "ok": true,
  "payload": { "type": "hello-ok", "protocol": 3, "policy": { "tickIntervalMs": 15000 } }
}
```

device token이 발급되면 `hello-ok` 에는 다음도 포함됩니다.

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

### Node 예시

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
    "client": {
      "id": "ios-node",
      "version": "1.2.3",
      "platform": "ios",
      "mode": "node"
    },
    "role": "node",
    "scopes": [],
    "caps": ["camera", "canvas", "screen", "location", "voice"],
    "commands": ["camera.snap", "canvas.navigate", "screen.record", "location.get"],
    "permissions": { "camera.capture": true, "screen.record": false },
    "auth": { "token": "…" },
    "locale": "en-US",
    "userAgent": "openclaw-ios/1.2.3",
    "device": {
      "id": "device_fingerprint",
      "publicKey": "…",
      "signature": "…",
      "signedAt": 1737264000000,
      "nonce": "…"
    }
  }
}
```

## 프레이밍

- **Request**: `{type:"req", id, method, params}`
- **Response**: `{type:"res", id, ok, payload|error}`
- **Event**: `{type:"event", event, payload, seq?, stateVersion?}`

부수 효과가 있는 메서드는 **idempotency key** 가 필요합니다(스키마 참고).

## 역할 + 스코프

### 역할

- `operator` = control plane 클라이언트(CLI/UI/automation)
- `node` = capability host(camera/screen/canvas/system.run)

### 스코프(operator)

일반적인 스코프:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`

메서드 스코프는 첫 번째 게이트일 뿐입니다. `chat.send` 를 통해 도달하는 일부 slash command는 그 위에 더 엄격한 명령 수준 검사를 적용합니다. 예를 들어 영구적인 `/config set` 과 `/config unset` 쓰기는 `operator.admin` 이 필요합니다.

### Caps/commands/permissions (node)

node는 connect 시 capability claim을 선언합니다.

- `caps`: 상위 수준 capability 분류
- `commands`: invoke용 command allowlist
- `permissions`: 세부 토글(예: `screen.record`, `camera.capture`)

Gateway는 이것을 **claim** 으로 취급하고 서버 측 allowlist를 강제합니다.

## Presence

- `system-presence` 는 device identity를 키로 하는 항목을 반환합니다.
- presence 항목에는 `deviceId`, `roles`, `scopes` 가 포함되어, UI가 한 디바이스가 **operator** 와 **node** 로 모두 연결되더라도 한 줄로 보여줄 수 있습니다.

### Node helper 메서드

- node는 자동 허용 검사에 사용할 현재 skill executable 목록을 가져오기 위해 `skills.bins` 를 호출할 수 있습니다.

### Operator helper 메서드

- operator는 에이전트의 런타임 tool catalog를 가져오기 위해 `tools.catalog` (`operator.read`) 를 호출할 수 있습니다. 응답에는 그룹화된 도구와 provenance metadata가 포함됩니다.
  - `source`: `core` 또는 `plugin`
  - `pluginId`: `source="plugin"` 일 때 plugin owner
  - `optional`: plugin tool이 선택 사항인지 여부

## Exec 승인

- exec 요청에 승인이 필요하면 gateway는 `exec.approval.requested` 를 브로드캐스트합니다.
- operator 클라이언트는 `exec.approval.resolve` 호출로 이를 처리합니다(`operator.approvals` scope 필요).
- `host=node` 인 경우 `exec.approval.request` 에는 `systemRunPlan`(정규 `argv`/`cwd`/`rawCommand`/session metadata)이 포함되어야 합니다. `systemRunPlan` 이 없는 요청은 거부됩니다.

## 버저닝

- `PROTOCOL_VERSION` 은 `src/gateway/protocol/schema.ts` 에 있습니다.
- 클라이언트는 `minProtocol` + `maxProtocol` 을 보내며, 서버는 불일치를 거부합니다.
- 스키마 + 모델은 TypeBox 정의에서 생성됩니다.
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

## 인증

- `OPENCLAW_GATEWAY_TOKEN` (또는 `--token`) 이 설정되어 있으면 `connect.params.auth.token` 이 일치해야 하며, 그렇지 않으면 소켓이 닫힙니다.
- 페어링 후 Gateway는 연결의 role + scope에 바인딩된 **device token** 을 발급합니다. 이 값은 `hello-ok.auth.deviceToken` 으로 반환되며, 이후 연결을 위해 클라이언트가 저장해야 합니다.
- device token은 `device.token.rotate`, `device.token.revoke` 로 회전/폐기할 수 있습니다(`operator.pairing` scope 필요).

## Device identity + pairing

- node는 keypair fingerprint에서 파생한 안정적인 device identity(`device.id`)를 포함해야 합니다.
- gateway는 device + role별로 token을 발급합니다.
- local auto-approval이 켜져 있지 않으면, 새로운 device ID는 페어링 승인이 필요합니다.
- **로컬** 연결에는 loopback과 gateway 호스트 자신의 tailnet 주소가 포함됩니다(같은 호스트의 tailnet bind도 auto-approve 가능).
- 모든 WS 클라이언트는 `connect` 중 `device` identity를 포함해야 합니다(operator + node).
  Control UI만 `gateway.controlUi.dangerouslyDisableDeviceAuth` 가 break-glass 용도로 켜져 있을 때 생략할 수 있습니다.
- 모든 연결은 서버가 제공한 `connect.challenge` nonce에 서명해야 합니다.

### Device auth 마이그레이션 진단

예전처럼 pre-challenge 서명을 사용하는 레거시 클라이언트의 경우, 이제 `connect` 는 `error.details.code` 아래에 `DEVICE_AUTH_*` detail code를, `error.details.reason` 아래에 안정적인 reason을 반환합니다.

일반적인 마이그레이션 실패:

| 메시지 | details.code | details.reason | 의미 |
| --- | --- | --- | --- |
| `device nonce required` | `DEVICE_AUTH_NONCE_REQUIRED` | `device-nonce-missing` | 클라이언트가 `device.nonce` 를 생략했거나 비워 보냄 |
| `device nonce mismatch` | `DEVICE_AUTH_NONCE_MISMATCH` | `device-nonce-mismatch` | 오래되었거나 잘못된 nonce로 서명함 |
| `device signature invalid` | `DEVICE_AUTH_SIGNATURE_INVALID` | `device-signature` | 서명 payload가 v2 payload와 일치하지 않음 |
| `device signature expired` | `DEVICE_AUTH_SIGNATURE_EXPIRED` | `device-signature-stale` | 서명 타임스탬프가 허용 skew 범위를 벗어남 |
| `device identity mismatch` | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch` | `device.id` 가 public key fingerprint와 일치하지 않음 |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key` | public key 포맷/정규화 실패 |

마이그레이션 목표:

- 항상 `connect.challenge` 를 기다릴 것
- 서버 nonce가 포함된 v2 payload에 서명할 것
- 동일한 nonce를 `connect.params.device.nonce` 로 보낼 것
- 권장 서명 payload는 `v3` 이며, device/client/role/scopes/token/nonce 외에 `platform` 과 `deviceFamily` 도 바인딩함
- 호환성을 위해 레거시 `v2` 서명도 계속 허용되지만, paired-device metadata pinning이 재연결 시 명령 정책을 계속 제어함

## TLS + pinning

- WS 연결에 TLS를 사용할 수 있습니다.
- 클라이언트는 필요하면 gateway cert fingerprint를 pin할 수 있습니다(`gateway.tls` 설정, `gateway.remote.tlsFingerprint` 또는 CLI `--tls-fingerprint` 참고).

## 범위

이 프로토콜은 **전체 gateway API**(status, channels, models, chat, agent, sessions, nodes, approvals 등)를 노출합니다. 정확한 표면은 `src/gateway/protocol/schema.ts` 의 TypeBox 스키마에 정의되어 있습니다.
