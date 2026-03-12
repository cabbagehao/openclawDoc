---
summary: "ゲートウェイ プロトコルの信頼できる唯一の情報源としての TypeBox スキーマ"
read_when:
  - プロトコルスキーマまたはコード生成の更新
title: "OpenClawのTypeBox採用理由とスキーマ設計の考え方ガイド"
description: "TypeBox は、TypeScript ファーストのスキーマ ライブラリです。これを使用して ゲートウェイを定義します WebSocket プロトコル (ハンドシェイク、リクエスト/レスポンス、サーバー イベント)。"
x-i18n:
  source_hash: "b270406f956d486b75d513f6355b9021ca5e6c73eac31f3eba3259ce6c1915b0"
---
最終更新日: 2026-01-10

TypeBox は、TypeScript ファーストのスキーマ ライブラリです。これを使用して **ゲートウェイを定義します
WebSocket プロトコル** (ハンドシェイク、リクエスト/レスポンス、サーバー イベント)。それらのスキーマ
**ランタイム検証**、**JSON スキーマ エクスポート**、**Swift codegen** をドライブします。
macOS アプリ。唯一の真実の情報源。それ以外はすべて生成されます。

より高いレベルのプロトコル コンテキストが必要な場合は、次から始めます。
[ゲートウェイ アーキテクチャ](/concepts/architecture)。

## メンタルモデル (30秒)

すべての Gateway WS メッセージは、次の 3 つのフレームの 1 つです。

- **リクエスト**: `{ type: "req", id, method, params }`
- **応答**: `{ type: "res", id, ok, payload | error }`
- **イベント**: `{ type: "event", event, payload, seq?, stateVersion? }`

最初のフレームは **必ず** `connect` リクエストです。その後、クライアントは電話をかけることができます
メソッド (例: `health`、`send`、`chat.send`) とイベントのサブスクライブ (例:
`presence`、`tick`、`agent`)。

接続フロー (最小限):

```
Client                    Gateway
  |---- req:connect -------->|
  |<---- res:hello-ok --------|
  |<---- event:tick ----------|
  |---- req:health ---------->|
  |<---- res:health ----------|
```

| 一般的なメソッド + イベント: | カテゴリー                                                | 例                                       | メモ |
| ---------------------------- | --------------------------------------------------------- | ---------------------------------------- | ---- |
| コア                         | `connect`、`health`、`status`                             | `connect` は最初でなければなりません     |
| メッセージ                   | `send`、`poll`、`agent`、`agent.wait`                     | 副作用には `idempotencyKey` が必要です。 |
| チャット                     | `chat.history`、`chat.send`、`chat.abort`、`chat.inject`  | WebChat はこれらを使用します。           |
| セッション                   | `sessions.list`、`sessions.patch`、`sessions.delete`      | セッション管理者                         |
| ノード                       | `node.list`、`node.invoke`、`node.pair.*`                 | ゲートウェイ WS + ノード アクション      |
| イベント                     | `tick`、`presence`、`agent`、`chat`、`health`、`shutdown` | サーバープッシュ                         |

権限のあるリストは `src/gateway/server.ts` (`METHODS`、`EVENTS`) にあります。

## スキーマが存在する場所

- 出典: `src/gateway/protocol/schema.ts`
- ランタイムバリデータ (AJV): `src/gateway/protocol/index.ts`
- サーバー ハンドシェイク + メソッド ディスパッチ: `src/gateway/server.ts`
- ノードクライアント: `src/gateway/client.ts`
- 生成された JSON スキーマ: `dist/protocol.schema.json`
- 生成された Swift モデル: `apps/macos/Sources/OpenClawProtocol/GatewayModels.swift`## 現在のパイプライン

- `pnpm protocol:gen`
  - JSON スキーマ (ドラフト‑07) を `dist/protocol.schema.json` に書き込みます
- `pnpm protocol:gen:swift`
  - Swift ゲートウェイ モデルを生成します
- `pnpm protocol:check`
  - 両方のジェネレーターを実行し、出力がコミットされていることを確認します

## 実行時にスキーマがどのように使用されるか

- **サーバー側**: すべての受信フレームが AJV で検証されます。握手のみ
  パラメータが `ConnectParams` と一致する `connect` リクエストを受け入れます。
- **クライアント側**: JS クライアントはイベントと応答フレームを検証する前に
  それらを使って。
- **メソッド サーフェス**: ゲートウェイはサポートされている `methods` と
  `events` の `hello-ok`。

## フレームの例

接続 (最初のメッセージ):

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

こんにちは、OK の応答:

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

リクエスト+レスポンス:

```json
{ "type": "req", "id": "r1", "method": "health" }
```

```json
{ "type": "res", "id": "r1", "ok": true, "payload": { "ok": true } }
```

イベント:

```json
{ "type": "event", "event": "tick", "payload": { "ts": 1730000000 }, "seq": 12 }
```

## 最小限のクライアント (Node.js)

最小の有用なフロー: 接続 + 健康。

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

## 成功した例: メソッドをエンドツーエンドで追加します

例: `{ ok: true, text }` を返す新しい `system.echo` リクエストを追加します。

1. **スキーマ (信頼できる情報源)**

`src/gateway/protocol/schema.ts` に追加:

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

両方を `ProtocolSchemas` に追加し、タイプをエクスポートします。

```ts
  SystemEchoParams: SystemEchoParamsSchema,
  SystemEchoResult: SystemEchoResultSchema,
```

```ts
export type SystemEchoParams = Static<typeof SystemEchoParamsSchema>;
export type SystemEchoResult = Static<typeof SystemEchoResultSchema>;
```

2. **検証**

`src/gateway/protocol/index.ts` で、AJV バリデーターをエクスポートします。

```ts
export const validateSystemEchoParams = ajv.compile<SystemEchoParams>(SystemEchoParamsSchema);
```

3. **サーバーの動作**

`src/gateway/server-methods/system.ts` にハンドラーを追加します。

`````ts
export const systemHandlers: GatewayRequestHandlers = {
  "system.echo": ({ params, respond }) => {
    const text = String(params.text ?? "");
    respond(true, { ok: true, text });
  },
};
````src/gateway/server-methods.ts` に登録します (`systemHandlers` はマージ済み)、
次に、`"system.echo"` を `src/gateway/server.ts` の `METHODS` に追加します。

4. **再生**

```bash
pnpm protocol:check
`````

5. **テスト + ドキュメント**

`src/gateway/server.*.test.ts` にサーバー テストを追加し、その方法をドキュメントに記載します。

## Swift コード生成の動作

Swift ジェネレーターは次のものを出力します。

- `req`、`res`、`event`、および `unknown` の場合の `GatewayFrame` 列挙型
- 厳密に型指定されたペイロード構造体/列挙型
- `ErrorCode` 値と `GATEWAY_PROTOCOL_VERSION`

未知のフレーム タイプは、前方互換性のために生のペイロードとして保存されます。

## バージョン管理 + 互換性

- `PROTOCOL_VERSION` は `src/gateway/protocol/schema.ts` に住んでいます。
- クライアントは `minProtocol` + `maxProtocol` を送信します。サーバーは不一致を拒否します。
- Swift モデルは、古いクライアントの破損を避けるために不明なフレーム タイプを保持します。

## スキーマのパターンと規則- ほとんどのオブジェクトは、厳密なペイロードに `additionalProperties: false` を使用します

- `NonEmptyString` は、ID およびメソッド/イベント名のデフォルトです。
- トップレベルの `GatewayFrame` は、`type` の **識別子** を使用します。
- 副作用のあるメソッドには通常、params に `idempotencyKey` が必要です
  (例: `send`、`poll`、`agent`、`chat.send`)。
- `agent` は、ランタイムで生成されたオーケストレーション コンテキストのオプションの `internalEvents` を受け入れます
  (例: サブエージェント/cron タスク完了ハンドオフ);これを内部 API サーフェスとして扱います。

## ライブスキーマ JSON

生成された JSON スキーマは、`dist/protocol.schema.json` のリポジトリにあります。の
公開された生のファイルは通常、次の場所で入手できます。

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## スキーマを変更する場合

1. TypeBox スキーマを更新します。
2. `pnpm protocol:check` を実行します。
3. 再生成されたスキーマ + Swift モデルをコミットします。
