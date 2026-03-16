---
summary: "TypeBox schemas as the single source of truth for the gateway protocol"
description: "Gateway WebSocket protocol의 source of truth인 TypeBox schema와 validation, JSON Schema export, Swift codegen 파이프라인을 설명합니다."
read_when:
  - protocol schema나 codegen을 수정할 때
title: "TypeBox"
x-i18n:
  source_path: "concepts/typebox.md"
---

# TypeBox as protocol source of truth

Last updated: 2026-01-10

TypeBox는 TypeScript-first schema library입니다. OpenClaw는 이를 사용해
**Gateway WebSocket protocol**
(handshake, request/response, server event)을 정의합니다.
이 schema는 **runtime validation**, **JSON Schema export**, macOS app용
**Swift codegen**을 구동합니다. source of truth는 하나이고, 나머지는 모두 생성물입니다.

더 높은 수준의 protocol 맥락은 [Gateway architecture](/concepts/architecture)에서
확인하세요.

## Mental model (30 seconds)

모든 Gateway WS message는 세 가지 frame 중 하나입니다.

- **Request**:
  `{ type: "req", id, method, params }`
- **Response**:
  `{ type: "res", id, ok, payload | error }`
- **Event**:
  `{ type: "event", event, payload, seq?, stateVersion? }`

첫 frame은 **반드시** `connect` request여야 합니다. 그 뒤에 client는
`health`, `send`, `chat.send` 같은 method를 호출하고,
`presence`, `tick`, `agent` 같은 event를 구독할 수 있습니다.

최소 connection flow:

```text
Client                    Gateway
  |---- req:connect -------->|
  |<---- res:hello-ok --------|
  |<---- event:tick ----------|
  |---- req:health ---------->|
  |<---- res:health ----------|
```

주요 method + event:

| Category  | Examples                                                  | Notes                              |
| --------- | --------------------------------------------------------- | ---------------------------------- |
| Core      | `connect`, `health`, `status`                             | `connect` must be first            |
| Messaging | `send`, `poll`, `agent`, `agent.wait`                     | side-effects need `idempotencyKey` |
| Chat      | `chat.history`, `chat.send`, `chat.abort`, `chat.inject`  | WebChat uses these                 |
| Sessions  | `sessions.list`, `sessions.patch`, `sessions.delete`      | session admin                      |
| Nodes     | `node.list`, `node.invoke`, `node.pair.*`                 | Gateway WS + node actions          |
| Events    | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown` | server push                        |

authoritative list는 `src/gateway/server.ts`의 `METHODS`, `EVENTS`에 있습니다.

## Where the schemas live

- Source:
  `src/gateway/protocol/schema.ts`
- Runtime validator
  (AJV):
  `src/gateway/protocol/index.ts`
- Server handshake + method dispatch:
  `src/gateway/server.ts`
- Node client:
  `src/gateway/client.ts`
- Generated JSON Schema:
  `dist/protocol.schema.json`
- Generated Swift model:
  `apps/macos/Sources/OpenClawProtocol/GatewayModels.swift`

## Current pipeline

- `pnpm protocol:gen`
  - JSON Schema
    (draft-07)를 `dist/protocol.schema.json`에 기록
- `pnpm protocol:gen:swift`
  - Swift gateway model 생성
- `pnpm protocol:check`
  - 두 generator를 모두 실행하고 output이 commit돼 있는지 검증

## How the schemas are used at runtime

- **Server side:** 들어오는 모든 frame을 AJV로 검증.
  handshake는 `ConnectParams`에 맞는 `connect` request만 허용
- **Client side:** JS client는 event와 response frame을 사용하기 전에 검증
- **Method surface:** Gateway는 `hello-ok`에서 지원하는 `methods`와 `events`를 광고

## Example frames

Connect
(첫 message):

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
      "platform": "macos 15.1",
      "mode": "ui",
      "instanceId": "A1B2"
    }
  }
}
```

Hello-ok response:

```json
{
  "type": "res",
  "id": "c1",
  "ok": true,
  "payload": {
    "type": "hello-ok",
    "protocol": 2,
    "server": { "version": "dev", "connId": "ws-1" },
    "features": { "methods": ["health"], "events": ["tick"] },
    "snapshot": {
      "presence": [],
      "health": {},
      "stateVersion": { "presence": 0, "health": 0 },
      "uptimeMs": 0
    },
    "policy": { "maxPayload": 1048576, "maxBufferedBytes": 1048576, "tickIntervalMs": 30000 }
  }
}
```

Request + response:

```json
{ "type": "req", "id": "r1", "method": "health" }
```

```json
{ "type": "res", "id": "r1", "ok": true, "payload": { "ok": true } }
```

Event:

```json
{ "type": "event", "event": "tick", "payload": { "ts": 1730000000 }, "seq": 12 }
```

## Minimal client (Node.js)

가장 작은 유용한 흐름은 connect + health입니다.

```ts
import { WebSocket } from "ws";

const ws = new WebSocket("ws://127.0.0.1:18789");

ws.on("open", () => {
  ws.send(
    JSON.stringify({
      type: "req",
      id: "c1",
      method: "connect",
      params: {
        minProtocol: 3,
        maxProtocol: 3,
        client: {
          id: "cli",
          displayName: "example",
          version: "dev",
          platform: "node",
          mode: "cli",
        },
      },
    }),
  );
});

ws.on("message", (data) => {
  const msg = JSON.parse(String(data));
  if (msg.type === "res" && msg.id === "c1" && msg.ok) {
    ws.send(JSON.stringify({ type: "req", id: "h1", method: "health" }));
  }
  if (msg.type === "res" && msg.id === "h1") {
    console.log("health:", msg.payload);
    ws.close();
  }
});
```

## Worked example: add a method end-to-end

예시: `{ ok: true, text }`를 반환하는 새 `system.echo` request를 추가합니다.

1. **Schema (source of truth)**

`src/gateway/protocol/schema.ts`에 추가:

```ts
export const SystemEchoParamsSchema = Type.Object(
  { text: NonEmptyString },
  { additionalProperties: false },
);

export const SystemEchoResultSchema = Type.Object(
  { ok: Type.Boolean(), text: NonEmptyString },
  { additionalProperties: false },
);
```

`ProtocolSchemas`에 둘 다 추가하고 type export:

```ts
  SystemEchoParams: SystemEchoParamsSchema,
  SystemEchoResult: SystemEchoResultSchema,
```

```ts
export type SystemEchoParams = Static<typeof SystemEchoParamsSchema>;
export type SystemEchoResult = Static<typeof SystemEchoResultSchema>;
```

2. **Validation**

`src/gateway/protocol/index.ts`에서 AJV validator export:

```ts
export const validateSystemEchoParams = ajv.compile<SystemEchoParams>(SystemEchoParamsSchema);
```

3. **Server behavior**

`src/gateway/server-methods/system.ts`에 handler 추가:

```ts
export const systemHandlers: GatewayRequestHandlers = {
  "system.echo": ({ params, respond }) => {
    const text = String(params.text ?? "");
    respond(true, { ok: true, text });
  },
};
```

`src/gateway/server-methods.ts`에 등록하고,
`src/gateway/server.ts`의 `METHODS`에 `"system.echo"`를 추가합니다.

4. **Regenerate**

```bash
pnpm protocol:check
```

5. **Tests + docs**

`src/gateway/server.*.test.ts`에 server test를 추가하고 문서에도 method를 기록합니다.

## Swift codegen behavior

Swift generator는 다음을 생성합니다.

- `GatewayFrame` enum
  (`req`, `res`, `event`, `unknown`)
- strongly typed payload struct/enum
- `ErrorCode` 값과 `GATEWAY_PROTOCOL_VERSION`

알 수 없는 frame type은 forward compatibility를 위해 raw payload로 보존됩니다.

## Versioning + compatibility

- `PROTOCOL_VERSION`은 `src/gateway/protocol/schema.ts`에 있습니다
- client는 `minProtocol` + `maxProtocol`을 보내고, server는 mismatch를 reject합니다
- Swift model은 오래된 client가 깨지지 않도록 unknown frame type을 유지합니다

## Schema patterns and conventions

- 대부분 object는 엄격한 payload를 위해 `additionalProperties: false`를 사용
- ID와 method/event name에는 기본적으로 `NonEmptyString` 사용
- top-level `GatewayFrame`은 `type` discriminator를 사용
- side effect가 있는 method는 보통 params에 `idempotencyKey`가 필요
  (예: `send`, `poll`, `agent`, `chat.send`)
- `agent`는 runtime-generated orchestration context를 위한 optional `internalEvents`를
  받을 수 있으며
  (예: subagent/cron task completion handoff), 이는 internal API surface로 다뤄야 합니다

## Live schema JSON

생성된 JSON Schema는 repo의 `dist/protocol.schema.json`에 있습니다.
published raw file은 보통 다음 주소에서 확인할 수 있습니다.

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## When you change schemas

1. TypeBox schema를 수정합니다
2. `pnpm protocol:check`를 실행합니다
3. regenerated schema + Swift model을 commit합니다
