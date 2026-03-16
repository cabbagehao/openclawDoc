---
description: "OpenClaw Gateway WebSocket 프로토콜의 핸드셰이크, 프레임 구조, 역할, 인증, 버전 관리를 설명하는 레퍼런스"
summary: "Gateway WebSocket 프로토콜 명세: 핸드셰이크 절차, 프레임 구조 및 버전 관리 안내"
read_when:
  - Gateway WebSocket 클라이언트를 구현하거나 업데이트할 때
  - 프로토콜 버전 불일치 또는 접속 실패 문제를 디버깅할 때
  - 프로토콜 스키마 및 모델을 재생성할 때
title: "Gateway 프로토콜"
x-i18n:
  source_path: "gateway/protocol.md"
---

# Gateway 프로토콜 (WebSocket)

OpenClaw의 Gateway WebSocket 프로토콜은 시스템의 **통합 제어 플레인 및 노드 전송 계층** 역할을 수행함. 모든 클라이언트(CLI, 제어 UI, macOS 앱, iOS/Android 노드, 헤드리스 노드 등)는 WebSocket을 통해 연결하며, 핸드셰이크 시점에 자신의 **역할(Role)**과 **스코프(Scope)**를 선언함.

## 전송 계층 (Transport)

- **방식**: WebSocket 기반, JSON 페이로드를 담은 텍스트 프레임 사용.
- **규칙**: 연결 후 첫 번째 프레임은 **반드시** `connect` 요청이어야 함.

## 핸드셰이크 절차 (`connect`)

**Gateway → 클라이언트 (챌린지 전달):**

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

**클라이언트 → Gateway (연결 요청):**

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

**Gateway → 클라이언트 (응답):**

```json
{
  "type": "res",
  "id": "…",
  "ok": true,
  "payload": { "type": "hello-ok", "protocol": 3, "policy": { "tickIntervalMs": 15000 } }
}
```

기기 토큰(Device token)이 발급된 경우, 응답에 다음 정보가 포함됨:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

### 노드 기기 연결 예시

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

## 프레이밍 구조 (Framing)

- **요청 (Request)**: `{type: "req", id, method, params}`
- **응답 (Response)**: `{type: "res", id, ok, payload|error}`
- **이벤트 (Event)**: `{type: "event", event, payload, seq?, stateVersion?}`

부수 효과(Side-effect)가 발생하는 메서드는 스키마에 정의된 **멱등성 키(Idempotency keys)**를 필요로 함.

## 역할 및 스코프 (Roles & Scopes)

### 역할 (Roles)
- **`operator`**: 제어 플레인 클라이언트 (CLI, UI, 자동화 도구).
- **`node`**: 기능 제공 호스트 (카메라, 화면 공유, 캔버스, 명령어 실행 등).

### 스코프 (Scopes: operator 전용)
- `operator.read` / `operator.write`: 기본 읽기/쓰기 권한.
- `operator.admin`: 관리자 권한.
- `operator.approvals`: 실행 승인 권한.
- `operator.pairing`: 기기 페어링 관리 권한.

메서드 스코프는 1차적인 검문소이며, `/config set`과 같이 민감한 슬래시 명령은 추가로 `operator.admin` 권한을 요구함.

### 기능 및 명령 (node 전용)
노드는 연결 시 자신의 역량을 선언함:
- **`caps`**: 상위 카테고리 (예: `camera`).
- **`commands`**: 실행 허용 명령 목록 (Invoke 대상).
- **`permissions`**: 세부 권한 토글 (예: `screen.record`).

Gateway는 노드의 선언을 **클레임(Claims)**으로 취급하며, 서버 측 허용 목록을 기반으로 실제 권한을 강제함.

## 프레즌스 (Presence)

- **`system-presence`**: 기기 식별자(`deviceId`)를 키로 하는 접속 상태 정보를 반환함.
- 동일 기기가 **운영자**와 **노드** 역할을 동시에 수행하더라도 UI에서는 단일 행으로 표시될 수 있도록 메타데이터를 포함함.

## 실행 승인 (Exec approvals)

- 승인이 필요한 실행 요청이 발생하면 Gateway는 `exec.approval.requested` 이벤트를 브로드캐스트함.
- `operator.approvals` 스코프를 가진 클라이언트가 `exec.approval.resolve` 메서드를 호출하여 승인 여부를 결정함.
- 노드에서 실행되는 경우(`host=node`), 요청에는 반드시 정규화된 실행 계획(`systemRunPlan`)이 포함되어야 함.

## 버전 관리 (Versioning)

- **`PROTOCOL_VERSION`**: `src/gateway/protocol/schema.ts`에서 관리됨.
- 클라이언트는 `minProtocol` 및 `maxProtocol` 범위를 전송하며, 서버 사양과 맞지 않을 경우 접속이 거부됨.
- 모든 스키마와 모델은 TypeBox 정의를 기반으로 자동 생성됨 (`pnpm protocol:gen`).

## 인증 및 보안 (Auth)

- **Gateway 토큰**: `OPENCLAW_GATEWAY_TOKEN` 설정 시 클라이언트의 연결 토큰이 일치해야 함.
- **기기 토큰**: 페어링 완료 후 역할과 스코프가 할당된 전용 토큰이 발급됨. 클라이언트는 이후 재접속을 위해 이 토큰을 영구 저장해야 함.
- **기기 식별**: 노드는 키 쌍 지문을 기반으로 한 안정적인 `device.id`를 제공해야 함.
- **챌린지 서명**: 모든 연결은 서버가 제공한 `connect.challenge` 논스(Nonce)에 대해 기기 키로 서명해야 함.

### 인증 마이그레이션 진단

챌린지 서명 방식을 따르지 않는 레거시 클라이언트를 위해 다음과 같은 상세 오류 코드를 제공함:

| 메시지 | 상세 코드 (code) | 사유 (reason) | 의미 |
| :--- | :--- | :--- | :--- |
| `device nonce required` | `DEVICE_AUTH_NONCE_REQUIRED` | `device-nonce-missing` | 논스 값이 누락됨. |
| `device nonce mismatch` | `DEVICE_AUTH_NONCE_MISMATCH` | `device-nonce-mismatch` | 잘못된 논스로 서명됨. |
| `device signature invalid` | `DEVICE_AUTH_SIGNATURE_INVALID` | `device-signature` | 서명 페이로드가 규격(v2/v3)에 맞지 않음. |
| `device signature expired` | `DEVICE_AUTH_SIGNATURE_EXPIRED` | `device-signature-stale` | 서명 타임스탬프 허용 오차 초과. |
| `device identity mismatch` | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch` | ID가 공개 키 지문과 일치하지 않음. |

**권장 마이그레이션 방향:**
- 반드시 `connect.challenge` 이벤트를 대기한 후 서명을 생성함.
- 서버 논스가 포함된 `v3` 페이로드 서명을 권장함 (플랫폼 및 기기군 정보 포함).

## 프로토콜 노출 범위

본 프로토콜은 상태 조회, 채널 관리, 모델 제어, 채팅, 에이전트 실행, 세션 관리, 노드 및 승인 관리 등 **Gateway의 모든 API**를 노출함. 구체적인 명세는 `src/gateway/protocol/schema.ts` 파일의 TypeBox 스키마를 참조함.
