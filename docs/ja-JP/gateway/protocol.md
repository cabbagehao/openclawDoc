---
summary: "ゲートウェイ WebSocket プロトコル: ハンドシェイク、フレーム、バージョン管理"
read_when:
  - ゲートウェイ WS クライアントの実装または更新
  - プロトコルの不一致または接続失敗のデバッグ
  - プロトコルスキーマ/モデルの再生成
title: "ゲートウェイプロトコル"
x-i18n:
  source_hash: "d0d110acae55813c5d8c126d95912e5ca145910b05d9a01a9a53822830cc8cd6"
---

# ゲートウェイプロトコル(WebSocket)

Gateway WS プロトコルは、**単一のコントロール プレーン + ノード トランスポート**です。
オープンクロー。すべてのクライアント (CLI、Web UI、macOS アプリ、iOS/Android ノード、ヘッドレス)
ノード) WebSocket 経由で接続し、**ロール** + **スコープ** を宣言します
握手タイム。

## 輸送

- WebSocket、JSON ペイロードを含むテキスト フレーム。
- 最初のフレームは **必ず** `connect` リクエストです。

## ハンドシェイク (接続)

ゲートウェイ → クライアント (事前接続チャレンジ):

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

クライアント → ゲートウェイ:

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

ゲートウェイ → クライアント:

```json
{
  "type": "res",
  "id": "…",
  "ok": true,
  "payload": { "type": "hello-ok", "protocol": 3, "policy": { "tickIntervalMs": 15000 } }
}
```

デバイス トークンが発行されると、`hello-ok` には次のものも含まれます。

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

### ノードの例

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

## フレーミング

- **リクエスト**: `{type:"req", id, method, params}`
- **応答**: `{type:"res", id, ok, payload|error}`
- **イベント**: `{type:"event", event, payload, seq?, stateVersion?}`

副作用のあるメソッドには **冪等キー** が必要です (スキーマを参照)。

## ロール + スコープ

### 役割

- `operator` = コントロール プレーン クライアント (CLI/UI/オートメーション)。
- `node` = 機能ホスト (camera/screen/canvas/system.run)。

### スコープ (演算子)

共通のスコープ:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`

メソッドのスコープは最初のゲートのみです。一部のスラッシュ コマンドは、
`chat.send` より厳格なコマンドレベルのチェックを最上位に適用します。たとえば、持続的な
`/config set` および `/config unset` の書き込みには `operator.admin` が必要です。### キャップ/コマンド/権限 (ノード)

ノードは接続時に機能要求を宣言します。

- `caps`: 高レベルの機能カテゴリ。
- `commands`: 呼び出し用のコマンド許可リスト。
- `permissions`: 詳細な切り替え (例: `screen.record`、`camera.capture`)。

ゲートウェイはこれらを **クレーム** として扱い、サーバー側のホワイトリストを適用します。

## プレゼンス

- `system-presence` は、デバイス ID をキーとしたエントリを返します。
- プレゼンス エントリには `deviceId`、`roles`、`scopes` が含まれるため、UI はデバイスごとに 1 行を表示できます
  **オペレーター**と**ノード**の両方として接続している場合でも。

### ノードヘルパーメソッド

- ノードは `skills.bins` を呼び出して、スキル実行可能ファイルの現在のリストを取得できます。
  自動許可チェック用。

### オペレーターヘルパーメソッド

- オペレーターは、`tools.catalog` (`operator.read`) を呼び出して、ランタイム ツール カタログを取得できます。
  エージェント。応答には、グループ化されたツールと来歴メタデータが含まれます。
  - `source`: `core` または `plugin`
  - `pluginId`: `source="plugin"` の場合のプラグイン所有者
  - `optional`: プラグイン ツールがオプションであるかどうか

## 幹部の承認- 実行リクエストの承認が必要な場合、ゲートウェイは `exec.approval.requested` をブロードキャストします

- オペレーター クライアントは、`exec.approval.resolve` を呼び出すことで解決します (`operator.approvals` スコープが必要です)。
- `host=node` の場合、`exec.approval.request` には `systemRunPlan` (正規の `argv`/`cwd`/`rawCommand`/セッション メタデータ) が含まれている必要があります。 `systemRunPlan` が欠落しているリクエストは拒否されます。

## バージョン管理

- `PROTOCOL_VERSION` は `src/gateway/protocol/schema.ts` に住んでいます。
- クライアントは `minProtocol` + `maxProtocol` を送信します。サーバーは不一致を拒否します。
- スキーマ + モデルは TypeBox 定義から生成されます。
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

## 認証

- `OPENCLAW_GATEWAY_TOKEN` (または `--token`) が設定されている場合、`connect.params.auth.token`
  一致する必要があります。そうでない場合はソケットが閉じられています。
- ペアリング後、ゲートウェイは接続をスコープとする **デバイス トークン**を発行します。
  ロール + スコープ。これは `hello-ok.auth.deviceToken` で返されます。
  将来の接続のためにクライアントによって永続化されます。
- デバイス トークンは `device.token.rotate` を介してローテーション/取り消しでき、
  `device.token.revoke` (`operator.pairing` スコープが必要)。

## デバイス ID + ペアリング- ノードには、

キーペアの指紋。

- ゲートウェイはデバイス + ロールごとにトークンを発行します。
- ローカルの自動承認がない限り、新しいデバイス ID にはペアリングの承認が必要です
  有効になっています。
- **ローカル**接続には、ループバックとゲートウェイ ホスト自身のテールネット アドレスが含まれます
  (そのため、同じホストのテールネット バインドは引き続き自動承認できます)。
- すべての WS クライアントには、`connect` (オペレーター + ノード) 中に `device` ID が含まれている必要があります。
  コントロール UI は、`gateway.controlUi.dangerouslyDisableDeviceAuth` の場合にのみ\*\*省略できます。
  ガラス破りの使用が有効になっています。
- すべての接続は、サーバーが提供する `connect.challenge` nonce に署名する必要があります。

### デバイス認証移行診断

チャレンジ前の署名動作をまだ使用している従来のクライアントの場合、`connect` が返されるようになりました。
`DEVICE_AUTH_*` は、安定した `error.details.reason` を含む `error.details.code` の下の詳細コードです。

| よくある移行の失敗:         | メッセージ                       | 詳細.コード              | 詳細.理由                                                                 | 意味 |
| --------------------------- | -------------------------------- | ------------------------ | ------------------------------------------------------------------------- | ---- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | クライアントは `device.nonce` を省略しました (または空白で送信しました)。 |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | クライアントが古い/間違った nonce で署名しました。                        |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | 署名ペイロードが v2 ペイロードと一致しません。                            |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | 署名されたタイムスタンプが許容されるスキューを超えています。              |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` は公開キーのフィンガープリントと一致しません。                |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | 公開キーのフォーマット/正規化に失敗しました。                             |

移行ターゲット:- 常に `connect.challenge` を待ちます。

- サーバー nonce を含む v2 ペイロードに署名します。
- `connect.params.device.nonce` で同じ nonce を送信します。
- 優先される署名ペイロードは `v3` で、`platform` と `deviceFamily` をバインドします。
  デバイス/クライアント/ロール/スコープ/トークン/ノンスフィールドに加えて。
- 従来の `v2` 署名は互換性のために引き続き受け入れられますが、ペアリングされたデバイスは受け入れられます
  メタデータの固定は、再接続時のコマンド ポリシーを引き続き制御します。

## TLS + ピン留め

- TLS は WS 接続でサポートされています。
- クライアントはオプションでゲートウェイ証明書のフィンガープリントを固定できます (`gateway.tls` を参照)
  config と `gateway.remote.tlsFingerprint` または CLI `--tls-fingerprint`)。

## 範囲

このプロトコルは、**完全なゲートウェイ API** (ステータス、チャネル、モデル、チャット、
エージェント、セッション、ノード、承認など)。正確な表面は次のように定義されます。
`src/gateway/protocol/schema.ts` の TypeBox スキーマ。
