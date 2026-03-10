---
summary: "ゲートウェイ HTTP エンドポイント経由で単一のツールを直接呼び出す"
read_when:
  - エージェントの完全なターンを実行せずにツールを呼び出す
  - ツールポリシーの適用が必要なビルディングオートメーション
title: "ツール呼び出しAPI"
x-i18n:
  source_hash: "ca7c696724c227de97279c74fedfd169d30e04dbc60732d2683b8f3b0d1ab691"
---

# ツールの呼び出し (HTTP)

OpenClaw のゲートウェイは、単一のツールを直接呼び出すためのシンプルな HTTP エンドポイントを公開します。これは常に有効ですが、ゲートウェイ認証とツール ポリシーによって制限されます。

- `POST /tools/invoke`
- ゲートウェイと同じポート (WS + HTTP マルチプレックス): `http://<gateway-host>:<port>/tools/invoke`

デフォルトの最大ペイロード サイズは 2 MB です。

## 認証

ゲートウェイ認証構成を使用します。無記名トークンを送信します。

- `Authorization: Bearer <token>`

注:

- `gateway.auth.mode="token"`の場合は、`gateway.auth.token`(または`OPENCLAW_GATEWAY_TOKEN`)を使用してください。
- `gateway.auth.mode="password"`の場合は、`gateway.auth.password`(または`OPENCLAW_GATEWAY_PASSWORD`)を使用してください。
- `gateway.auth.rateLimit` が構成されており、認証失敗が多すぎる場合、エンドポイントは `429` と `Retry-After` を返します。

## リクエスト本文

```json
{
  "tool": "sessions_list",
  "action": "json",
  "args": {},
  "sessionKey": "main",
  "dryRun": false
}
```

フィールド:

- `tool` (文字列、必須): 呼び出すツール名。
- `action` (文字列、オプション): ツール スキーマが `action` をサポートし、args ペイロードがそれを省略した場合、args にマップされます。
- `args` (オブジェクト、オプション): ツール固有の引数。
- `sessionKey` (文字列、オプション): ターゲット セッション キー。省略された場合、または `"main"` の場合、ゲートウェイは構成されたメイン セッション キーを使用します (`session.mainKey` とデフォルト エージェント、またはグローバル スコープの `global` を優先します)。
- `dryRun` (ブール値、オプション): 将来の使用のために予約されています。現在無視されています。

## ポリシー + ルーティング動作

ツールの可用性は、ゲートウェイ エージェントが使用するのと同じポリシー チェーンを通じてフィルタリングされます。- `tools.profile` / `tools.byProvider.profile`

- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- グループ ポリシー (セッション キーがグループまたはチャネルにマッピングされている場合)
- サブエージェントポリシー（サブエージェントセッションキーを使用して起動する場合）

ツールがポリシーで許可されていない場合、エンドポイントは **404** を返します。

ゲートウェイ HTTP は、デフォルトでハード拒否リストも適用します (セッション ポリシーでツールが許可されている場合でも)。

- `sessions_spawn`
- `sessions_send`
- `gateway`
- `whatsapp_login`

この拒否リストは `gateway.tools` 経由でカスタマイズできます。

```json5
{
  gateway: {
    tools: {
      // Additional tools to block over HTTP /tools/invoke
      deny: ["browser"],
      // Remove tools from the default deny list
      allow: ["gateway"],
    },
  },
}
```

グループ ポリシーがコンテキストを解決できるようにするために、オプションで以下を設定できます。

- `x-openclaw-message-channel: <channel>` (例: `slack`、`telegram`)
- `x-openclaw-account-id: <accountId>` (複数のアカウントが存在する場合)

## 応答

- `200` → `{ ok: true, result }`
- `400` → `{ ok: false, error: { type, message } }` (無効なリクエストまたはツール入力エラー)
- `401` → 無許可
- `429` → 認証レート制限 (`Retry-After` セット)
- `404` → ツールは利用できません (見つからないか許可リストに登録されていません)
- `405` → メソッドは許可されません
- `500` → `{ ok: false, error: { type, message } }` (予期しないツール実行エラー、サニタイズされたメッセージ)

## 例

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
