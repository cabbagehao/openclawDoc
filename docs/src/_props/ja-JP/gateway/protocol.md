---
summary: "ゲートウェイの WebSocket プロトコル: ハンドシェイク、フレーム構造、バージョン管理"
read_when:
  - ゲートウェイの WebSocket クライアントを実装・更新する場合
  - プロトコルの不一致や接続エラーをデバッグする場合
  - プロトコルのスキーマやモデルを再生成する場合
title: "ゲートウェイプロトコル"
x-i18n:
  source_hash: "d0d110acae55813c5d8c126d95912e5ca145910b05d9a01a9a53822830cc8cd6"
---

# ゲートウェイプロトコル (WebSocket)

ゲートウェイの WebSocket (WS) プロトコルは、OpenClaw における **統合されたコントロールプレーンおよびノード通信路** です。すべてのクライアント（CLI、Web UI、macOS アプリ、iOS/Android ノード、ヘッドレスノード）は WebSocket 経由で接続し、接続確立（ハンドシェイク）時に自身の **ロール (Role)** と **スコープ (Scope)** を宣言します。

## 通信方式（トランスポート）

* WebSocket を使用し、テキストフレーム内に JSON ペイロードを含めます。
* 最初のフレームは **必ず** `connect` リクエストである必要があります。

## ハンドシェイク (connect)

ゲートウェイ → クライアント (接続前チャレンジ):

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
    "locale": "ja-JP",
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

デバイストークンが発行された場合、`hello-ok` には以下も含まれます:

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
    "locale": "ja-JP",
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

## フレーム構造

* **リクエスト (Request)**: `{type:"req", id, method, params}`
* **レスポンス (Response)**: `{type:"res", id, ok, payload|error}`
* **イベント (Event)**: `{type:"event", event, payload, seq?, stateVersion?}`

副作用を伴うメソッドには **べき等キー (idempotency keys)** が必要です（詳細はスキーマを参照）。

## ロールとスコープ

### ロール (Roles)

* `operator`: コントロールプレーンクライアント (CLI, UI, 自動化ツールなど)。
* `node`: 機能（Capabilities）を提供するホスト (カメラ, 画面, Canvas, system.run など)。

### スコープ (Scopes - operator 用)

一般的なスコープ例:

* `operator.read`
* `operator.write`
* `operator.admin`
* `operator.approvals`
* `operator.pairing`

メソッドごとのスコープチェックは最初のゲートに過ぎません。`chat.send` を介して実行される一部のスラッシュコマンドでは、さらに厳格なコマンドレベルのチェックが適用されます。例えば、永続的な `/config set` や `/config unset` の実行には `operator.admin` スコープが必要です。

### 機能・コマンド・権限 (Caps/commands/permissions - node 用)

ノードは接続時に、自身が提供可能な機能の宣言（クレーム）を行います:

* `caps`: 大まかな機能カテゴリ。
* `commands`: 外部から呼び出し可能なコマンドの許可リスト。
* `permissions`: 詳細なオン/オフ設定 (例: `screen.record`, `camera.capture`)。

ゲートウェイはこれらを **クレーム（自己申告）** として扱い、サーバー側で許可リストによる制限を適用します。

## プレゼンス (Presence)

* `system-presence` メソッドは、デバイスのアイデンティティをキーとしたエントリを返します。
* プレゼンスエントリには `deviceId`, `roles`, `scopes` が含まれるため、同じデバイスが **operator** と **node** の両方として接続していても、UI 上では 1 つの行として集約して表示できます。

### ノード用ヘルパーメソッド

* ノードは `skills.bins` を呼び出すことで、自動許可チェックに使用する現在のスキル実行ファイルのリストを取得できます。

### オペレーター用ヘルパーメソッド

* オペレーターは `tools.catalog` (`operator.read`) を呼び出すことで、特定のエージェントの実行時ツールカタログを取得できます。レスポンスには、グループ化されたツール情報と由来（provenance）メタデータが含まれます:
  * `source`: `core` または `plugin`
  * `pluginId`: `source="plugin"` の場合のプラグイン提供元
  * `optional`: プラグインツールがオプション（任意）であるかどうか

## 実行承認 (Exec approvals)

* `exec` リクエストに承認が必要な場合、ゲートウェイは `exec.approval.requested` イベントをブロードキャスト（一斉送信）します。
* オペレータークライアントは、`exec.approval.resolve` を呼び出すことでこれを解決します（`operator.approvals` スコープが必要です）。
* `host=node` の場合、`exec.approval.request` には `systemRunPlan`（正規化された `argv`, `cwd`, `rawCommand`, セッションメタデータ）が含まれている必要があります。`systemRunPlan` が欠落しているリクエストは拒否されます。

## バージョン管理

* `PROTOCOL_VERSION` は `src/gateway/protocol/schema.ts` で定義されています。
* クライアントは接続時に `minProtocol` と `maxProtocol` を送信し、サーバーは不一致がある場合に拒否します。
* スキーマとモデルは、TypeBox の定義から自動生成されます:
  * `pnpm protocol:gen`
  * `pnpm protocol:gen:swift`
  * `pnpm protocol:check`

## 認証 (Auth)

* `OPENCLAW_GATEWAY_TOKEN` (または `--token`) が設定されている場合、`connect.params.auth.token` が一致しなければソケットは即座に閉じられます。
* ペアリング成功後、ゲートウェイは接続時のロールとスコープに制限された **デバイストークン** を発行します。これは `hello-ok.auth.deviceToken` として返され、クライアント側で保存して次回の接続時に再利用する必要があります。
* デバイストークンは `device.token.rotate` および `device.token.revoke` メソッドで更新・取り消しが可能です（`operator.pairing` スコープが必要です）。

## デバイスアイデンティティとペアリング

* ノードは、キーペアのフィンガープリントから派生した、固定のデバイスアイデンティティ (`device.id`) を含める必要があります。
* ゲートウェイは、デバイスとロールの組み合わせごとにトークンを発行します。
* 未登録のデバイス ID からの接続にはペアリング承認が必要ですが、ローカル環境での自動承認設定が有効な場合はスキップされます。
* **ローカル**接続には、ループバックおよびゲートウェイホスト自身の Tailnet アドレスが含まれます（そのため、同じホスト内であれば Tailnet バインド経由でも自動承認が可能です）。
* すべての WebSocket クライアント（operator および node）は、`connect` 時に `device` 情報を提示する必要があります。コントロール UI においては、緊急時（break-glass）の利用目的で `gateway.controlUi.dangerouslyDisableDeviceAuth` が有効な場合にのみ省略可能です。
* すべての接続において、サーバーから提供された `connect.challenge` ノンス（一時的な数値）への署名が必要です。

### デバイス認証の移行診断

チャレンジベースの署名に対応していない古いクライアントに対して、`connect` 時に `error.details.code` 配下で `DEVICE_AUTH_*` 形式の詳細コードと、固定の `error.details.reason` を返すようになりました。

よくある移行時の失敗例:

| メッセージ                       | details.code                     | details.reason           | 意味                                      |
| :-------------------------- | :------------------------------- | :----------------------- | :-------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | クライアントが `device.nonce` を省略した（または空で送った）。 |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | 古い、あるいは誤ったノンスで署名した。                     |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | 署名対象のペイロードが v2 の形式と一致しない。               |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | 署名時刻が許容範囲外（古すぎる）。                       |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` が公開鍵のフィンガープリントと一致しない。       |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | 公開鍵のフォーマットや正規化に失敗した。                    |

移行の目標仕様:

* 常に `connect.challenge` イベントを待機する。
* サーバーからのノンスを含む v2 ペイロードに対して署名する。
* `connect.params.device.nonce` に同じノンスを含めて送信する。
* 推奨される署名ペイロードは `v3` です。これはデバイス/クライアント/ロール/スコープ/トークン/ノンスに加え、`platform` と `deviceFamily` も紐付けます。
* 従来の `v2` 署名も互換性のために受け入れられますが、再接続時のコマンドポリシー制御のために、ペアリング済みデバイスのメタデータの固定（pinning）が引き続き適用されます。

## TLS とピン留め (Pinning)

* WebSocket 接続における TLS をサポートしています。
* クライアントは、オプションでゲートウェイ証明書のフィンガープリントを固定できます（`gateway.tls` 構成、`gateway.remote.tlsFingerprint`、または CLI の `--tls-fingerprint` を参照）。

## 対象範囲 (Scope)

本プロトコルは、**ゲートウェイの全 API**（ステータス、チャネル、モデル、チャット、エージェント、セッション、ノード、承認など）を公開します。具体的なインターフェース面は、`src/gateway/protocol/schema.ts` にある TypeBox スキーマによって定義されます。
