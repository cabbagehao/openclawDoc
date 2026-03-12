---
summary: "ゲートウェイのHTTPエンドポイント経由で単一のツールを直接呼び出す方法"
description: "単一ツールを HTTP から実行するエンドポイントの認証、リクエスト形式、ポリシー適用、レスポンス、実行例を整理します。"
read_when:
  - エージェントのフルターンを実行せずにツールを呼び出す場合
  - ツールポリシーの適用が必要な自動化を構築する場合
title: "Tools Invoke API"
seoTitle: "OpenClaw Tools Invoke HTTP API の直接呼び出しと認証ガイド"
---
OpenClawのゲートウェイは、単一のツールを直接呼び出すためのシンプルなHTTPエンドポイントを公開しています。この機能は常に有効ですが、ゲートウェイ認証とツールポリシーによって制限されます。

- `POST /tools/invoke`
- ゲートウェイと同じポート（WebSocket + HTTPマルチプレックス）：`http://<gateway-host>:<port>/tools/invoke`

デフォルトの最大ペイロードサイズは2MBです。

## 認証

ゲートウェイの認証設定を使用します。以下の形式でベアラートークンを送信してください。

- `Authorization: Bearer <token>`

注意点：

- `gateway.auth.mode="token"` の場合は、`gateway.auth.token`（または `OPENCLAW_GATEWAY_TOKEN`）を使用します。
- `gateway.auth.mode="password"` の場合は、`gateway.auth.password`（または `OPENCLAW_GATEWAY_PASSWORD`）を使用します。
- `gateway.auth.rateLimit` が設定されており、認証エラーが多すぎる場合、エンドポイントは `429` (Too Many Requests) と `Retry-After` ヘッダーを返します。

## リクエストボディ

```json
{
  "tool": "sessions_list",
  "action": "json",
  "args": {},
  "sessionKey": "main",
  "dryRun": false
}
```

フィールド：

- `tool` (string, 必須): 呼び出すツールの名前。
- `action` (string, オプション): ツールスキーマが `action` をサポートしており、`args` ペイロードで省略されている場合、`args` にマップされます。
- `args` (object, オプション): ツール固有の引数。
- `sessionKey` (string, オプション): ターゲットとなるセッションキー。省略された場合、または `"main"` の場合、ゲートウェイは設定されたメインセッションキーを使用します（`session.mainKey` やデフォルトエージェント、またはグローバルスコープの `global` が優先されます）。
- `dryRun` (boolean, オプション): 将来の使用のために予約されており、現在は無視されます。

## ポリシーとルーティングの挙動

ツールの可用性は、ゲートウェイエージェントが使用するのと同じポリシーチェーンを通じてフィルタリングされます。

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- グループポリシー（セッションキーがグループやチャネルにマッピングされている場合）
- サブエージェントポリシー（サブエージェントのセッションキーを使用して呼び出す場合）

ツールがポリシーで許可されていない場合、エンドポイントは **404** を返します。

また、ゲートウェイHTTPでは、セッションポリシーでツールが許可されている場合でも、デフォルトで以下の強力な拒否リスト（Deny List）が適用されます。

- `sessions_spawn`
- `sessions_send`
- `gateway`
- `whatsapp_login`

この拒否リストは `gateway.tools` を通じてカスタマイズ可能です。

```json5
{
  gateway: {
    tools: {
      // HTTP経由の /tools/invoke でブロックするツールを追加
      deny: ["browser"],
      // デフォルトの拒否リストからツールを除外
      allow: ["gateway"],
    },
  },
}
```

グループポリシーがコンテキストを解決しやすくするために、オプションで以下のヘッダーを設定できます。

- `x-openclaw-message-channel: <channel>` (例: `slack`, `telegram`)
- `x-openclaw-account-id: <accountId>` (複数のアカウントが存在する場合)

## レスポンス

- `200` → `{ ok: true, result }`
- `400` → `{ ok: false, error: { type, message } }` (不正なリクエスト、またはツールの入力エラー)
- `401` → 認証エラー（Unauthorized）
- `429` → 認証レート制限（`Retry-After` が設定されます）
- `404` → ツールが利用不可（見つからない、または許可リストに含まれていない）
- `405` → メソッド不許可（Method Not Allowed）
- `500` → `{ ok: false, error: { type, message } }` (予期しないツール実行エラー。メッセージはサニタイズされます)

## 実行例

```bash
curl -sS http://127.0.0.1:18789/tools/invoke \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "tool": "sessions_list",
    "action": "json",
    "args": {}
  }'
```
