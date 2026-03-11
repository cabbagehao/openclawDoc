---
summary: "Gateway 프로토콜의 데이터 단일 원천(SSOT)인 TypeBox 스키마 및 자동 생성 파이프라인 안내"
read_when:
  - 통신 프로토콜 스키마를 수정하거나 코드 생성(Codegen) 로직을 업데이트할 때
  - 시스템 내부의 메시지 구조를 파악해야 할 때
title: "TypeBox"
x-i18n:
  source_path: "concepts/typebox.md"
---

# TypeBox: 프로토콜의 단일 소스(SSOT)

최종 업데이트: 2026-01-10

OpenClaw는 TypeScript 기반의 스키마 라이브러리인 **TypeBox**를 사용하여 **Gateway WebSocket 프로토콜**(핸드셰이크, 요청/응답, 서버 이벤트)을 정의함. 정의된 스키마는 **런타임 데이터 검증**, **JSON Schema 내보내기**, 그리고 macOS 앱을 위한 **Swift 코드 생성**의 기초가 됨. 모든 데이터 구조는 이 하나의 원천에서 파생되어 일관성을 유지함.

상위 수준의 프로토콜 아키텍처는 [Gateway 아키텍처](/concepts/architecture)를 참조함.

## 프로토콜 멘탈 모델 (Mental Model)

Gateway와 주고받는 모든 WebSocket 메시지는 다음 세 가지 프레임 중 하나에 해당함:

* **요청 (Request)**: `{ type: "req", id, method, params }`
* **응답 (Response)**: `{ type: "res", id, ok, payload | error }`
* **이벤트 (Event)**: `{ type: "event", event, payload, seq?, stateVersion? }`

연결 후 첫 번째 메시지는 반드시 `connect` 요청이어야 함. 인증 및 연결이 완료된 후 클라이언트는 각종 메서드(`health`, `send`, `chat.send` 등)를 호출하거나 서버 이벤트(`presence`, `tick`, `agent` 등)를 구독할 수 있음.

**연결 흐름 예시:**

```text
클라이언트 (Client)           Gateway
  |---- req:connect -------->|
  |<---- res:hello-ok -------|
  |<---- event:tick ---------|
  |---- req:health ---------->|
  |<---- res:health ---------|
```

**주요 메서드 및 이벤트 카테고리:**

| 카테고리           | 주요 사례                                                | 비고                             |
| :------------- | :--------------------------------------------------- | :----------------------------- |
| **코어 (Core)**  | `connect`, `health`, `status`                        | `connect`가 첫 호출이어야 함           |
| **메시징**        | `send`, `poll`, `agent`, `agent.wait`                | 부수 효과 발생 시 `idempotencyKey` 필요 |
| **채팅**         | `chat.history`, `chat.send`, `chat.abort`            | WebChat UI에서 주로 사용             |
| **세션**         | `sessions.list`, `sessions.patch`, `sessions.delete` | 에이전트 세션 관리 및 운영                |
| **노드 (Nodes)** | `node.list`, `node.invoke`, `node.pair.*`            | Gateway와 노드 간의 상호작용            |
| **이벤트**        | `tick`, `presence`, `agent`, `chat`, `shutdown`      | 서버에서 클라이언트로의 푸시 알림             |

전체 목록은 `src/gateway/server.ts`의 `METHODS` 및 `EVENTS` 정의를 참조함.

## 관련 파일 위치

* **소스 코드**: `src/gateway/protocol/schema.ts`
* **런타임 검증기 (AJV)**: `src/gateway/protocol/index.ts`
* **서버 핸드셰이크 및 디스패치**: `src/gateway/server.ts`
* **생성된 JSON Schema**: `dist/protocol.schema.json`
* **생성된 Swift 모델**: `apps/macos/Sources/OpenClawProtocol/GatewayModels.swift`

## 빌드 파이프라인 (Pipeline)

* `pnpm protocol:gen`: JSON Schema (Draft-07)를 `dist/` 경로에 생성함.
* `pnpm protocol:gen:swift`: macOS 앱용 Swift 데이터 모델을 생성함.
* `pnpm protocol:check`: 생성기를 실행하고 결과물이 최신 상태로 커밋되었는지 검증함.

## 런타임 스키마 활용 방식

* **서버 측**: 유입되는 모든 프레임을 AJV로 즉시 검증함. 특히 핸드셰이크 단계에서는 `ConnectParams` 규격에 맞는 요청만 수락함.
* **클라이언트 측**: 수신된 이벤트 및 응답 프레임을 처리하기 전 규격 일치 여부를 확인함.
* **기능 광고**: Gateway는 `hello-ok` 응답을 통해 현재 지원하는 `methods`와 `events` 목록을 클라이언트에 전달함.

## 데이터 프레임 예시

**연결 요청 (Connect):**

```json
{
  "type": "req",
  "id": "c1",
  "method": "connect",
  "params": {
    "minProtocol": 2,
    "maxProtocol": 2,
    "client": {
      "id": "openclaw-macos",
      "displayName": "macos",
      "version": "1.0.0",
      "mode": "ui"
    }
  }
}
```

**연결 성공 응답 (Hello-ok):**

```json
{
  "type": "res",
  "id": "c1",
  "ok": true,
  "payload": {
    "type": "hello-ok",
    "protocol": 2,
    "server": { "version": "dev", "connId": "ws-1" },
    "features": { "methods": ["health"], "events": ["tick"] }
  }
}
```

## 신규 메서드 추가 절차 (End-to-End)

예: 텍스트를 그대로 돌려주는 `system.echo` 요청 추가 시.

1. **스키마 정의**: `src/gateway/protocol/schema.ts`에 파라미터 및 결과값 스키마를 추가하고 유형(Type)을 내보냄.
2. **검증 로직 등록**: `src/gateway/protocol/index.ts`에 AJV 검증기를 등록함.
3. **서버 핸들러 구현**: `src/gateway/server-methods/` 경로에 실제 로직을 작성하고 서버 메서드 목록에 등록함.
4. **코드 재생성**: `pnpm protocol:check` 명령어를 실행하여 JSON 및 Swift 코드를 갱신함.
5. **테스트 및 문서화**: 유닛 테스트를 추가하고 관련 문서를 업데이트함.

## 버전 관리 및 호환성

* `PROTOCOL_VERSION` 정보는 `src/gateway/protocol/schema.ts`에서 관리됨.
* 클라이언트는 연결 시 지원 가능한 프로토콜 범위(`min` \~ `max`)를 전송하며, 서버는 호환되지 않을 경우 연결을 거부함.
* Swift 모델은 상위 호환성을 위해 미지의 프레임 타입을 원시 데이터 형태로 유지함.

## 스키마 설계 원칙

* 엄격한 데이터 검증을 위해 가급적 `additionalProperties: false` 설정을 사용함.
* ID, 메서드명, 이벤트명 등에는 `NonEmptyString` 타입을 기본으로 사용함.
* 부수 효과가 있는 메서드(예: `send`, `agent`)는 중복 실행 방지를 위해 `idempotencyKey` 파라미터를 필수로 요구함.

## 실시간 스키마 정보

최신 생성된 JSON 스키마는 GitHub 저장소의 `dist/protocol.schema.json` 파일에서 확인 가능함.
