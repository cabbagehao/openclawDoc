---
summary: "gateway protocol의 단일 source of truth로 쓰이는 TypeBox schema"
read_when:
  - protocol schema나 codegen을 업데이트할 때
title: "TypeBox"
---

# TypeBox as protocol source of truth

최종 업데이트: 2026-01-10

TypeBox는 TypeScript 중심 schema library입니다. OpenClaw는 이를 사용해 **Gateway WebSocket protocol**(handshake, request/response, server event)을 정의합니다. 이 schema는 **runtime validation**, **JSON Schema export**, **Swift codegen**(macOS 앱용)을 모두 구동합니다. 하나의 source of truth에서 나머지를 생성하는 구조입니다.

더 높은 수준의 protocol 맥락이 필요하다면 [Gateway architecture](/concepts/architecture)부터 보세요.

## Mental model (30 seconds)

모든 Gateway WS 메시지는 세 가지 frame 중 하나입니다.

- **Request**: `{ type: "req", id, method, params }`
- **Response**: `{ type: "res", id, ok, payload | error }`
- **Event**: `{ type: "event", event, payload, seq?, stateVersion? }`

첫 frame은 반드시 `connect` request여야 합니다. 그 후에야 client가 method(`health`, `send`, `chat.send` 등)를 호출하고 event(`presence`, `tick`, `agent` 등)를 구독할 수 있습니다.

연결 흐름(최소):

```
Client                    Gateway
  |---- req:connect -------->|
  |<---- res:hello-ok --------|
  |<---- event:tick ----------|
  |---- req:health ---------->|
  |<---- res:health ----------|
```

대표 method + event:

| Category  | Examples                                                  | Notes                                 |
| --------- | --------------------------------------------------------- | ------------------------------------- |
| Core      | `connect`, `health`, `status`                             | `connect`가 첫 호출이어야 함          |
| Messaging | `send`, `poll`, `agent`, `agent.wait`                     | side-effect에는 `idempotencyKey` 필요 |
| Chat      | `chat.history`, `chat.send`, `chat.abort`, `chat.inject`  | WebChat이 사용                        |
| Sessions  | `sessions.list`, `sessions.patch`, `sessions.delete`      | session 관리                          |
| Nodes     | `node.list`, `node.invoke`, `node.pair.*`                 | Gateway WS + node action              |
| Events    | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown` | server push                           |

권위 있는 목록은 `src/gateway/server.ts`의 `METHODS`, `EVENTS`에 있습니다.

## Where the schemas live

- Source: `src/gateway/protocol/schema.ts`
- Runtime validator(AJV): `src/gateway/protocol/index.ts`
- Server handshake + method dispatch: `src/gateway/server.ts`
- Node client: `src/gateway/client.ts`
- Generated JSON Schema: `dist/protocol.schema.json`
- Generated Swift models: `apps/macos/Sources/OpenClawProtocol/GatewayModels.swift`

## Current pipeline

- `pnpm protocol:gen`
  - JSON Schema(draft-07)를 `dist/protocol.schema.json`에 기록
- `pnpm protocol:gen:swift`
  - Swift gateway model 생성
- `pnpm protocol:check`
  - 두 생성기를 모두 실행하고 결과가 커밋되어 있는지 확인

## How the schemas are used at runtime

- **Server side**: 모든 inbound frame은 AJV로 검증됩니다. handshake는 `params`가 `ConnectParams`에 맞는 `connect` request만 허용합니다.
- **Client side**: JS client는 event frame과 response frame을 사용 전에 검증합니다.
- **Method surface**: Gateway는 `hello-ok`에서 지원되는 `methods`와 `events`를 광고합니다.

## Example frames

Connect (첫 메시지):

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

가장 작은 실용 흐름은 connect + health입니다.

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

이를 `ProtocolSchemas`에 추가하고 type을 export:

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

이를 `src/gateway/server-methods.ts`에 등록하고(이미 `systemHandlers` 병합 구조가 있음), `src/gateway/server.ts`의 `METHODS`에 `"system.echo"`를 추가합니다.

4. **Regenerate**

```bash
pnpm protocol:check
```

5. **Tests + docs**

`src/gateway/server.*.test.ts`에 서버 테스트를 추가하고, 문서에 해당 method를 적어 둡니다.

## Swift codegen behavior

Swift generator는 다음을 생성합니다.

- `GatewayFrame` enum (`req`, `res`, `event`, `unknown` case 포함)
- 강한 타입의 payload struct/enum
- `ErrorCode` 값과 `GATEWAY_PROTOCOL_VERSION`
