---
summary: "ゲートウェイから OpenAI 互換の /v1/chat/completions HTTP エンドポイントを公開する"
read_when:
  - OpenAI Chat Completions API を期待する外部ツールと統合する場合
title: "OpenAI 互換 HTTP API"
x-i18n:
  source_hash: "e12f1b5dacbd5a6fe6fe5304dc6a84f56312c57d4b88db5037b1863a8e0edd65"
---
OpenClaw ゲートウェイは、OpenAI 互換の最小限の Chat Completions エンドポイントを提供できます。

このエンドポイントは **デフォルトで無効** になっています。利用するには、まず構成ファイルで有効にする必要があります。

- エンドポイント: `POST /v1/chat/completions`
- ポート: ゲートウェイと同じポート（WebSocket と HTTP のマルチプレックス）: `http://<gateway-host>:<port>/v1/chat/completions`

内部的には、リクエストは通常のゲートウェイエージェントの実行（`openclaw agent` と同じパス）として処理されます。そのため、ルーティング、権限、および構成設定はゲートウェイ本体の設定に従います。

## 認証 (Auth)

ゲートウェイの認証設定を使用します。リクエスト時に Bearer トークンを送信してください:

- `Authorization: Bearer <トークン>`

補足事項:
- `gateway.auth.mode="token"` の場合、`gateway.auth.token` (または環境変数 `OPENCLAW_GATEWAY_TOKEN`) を使用します。
- `gateway.auth.mode="password"` の場合、`gateway.auth.password` (または環境変数 `OPENCLAW_GATEWAY_PASSWORD`) を使用します。
- `gateway.auth.rateLimit` が構成されている場合、認証失敗が繰り返されるとエンドポイントは `429` (Retry-After 付き) を返します。

## セキュリティ境界 (重要)

このエンドポイントは、ゲートウェイインスタンスに対する **フルアクセス（オペレーター権限）** を持つインターフェースとして扱ってください。

- ここでの HTTP Bearer 認証は、一般ユーザー向けの制限されたスコープを持つものではありません。
- このエンドポイントで使用する有効なトークンやパスワードは、オーナー/オペレーターの認証情報と同等に扱う必要があります。
- リクエストは、信頼されたオペレーターのアクションと同じコントロールプレーンのエージェントパスを通じて実行されます。
- このエンドポイントには、非所有者や一般ユーザー向けの個別のツール制限レイヤーはありません。ゲートウェイ認証を通過した呼び出し元は、OpenClaw によってこのゲートウェイの信頼されたオペレーターとして扱われます。
- ターゲットとなるエージェントのポリシーで機密ツールが許可されている場合、このエンドポイント経由でもそれらのツールが実行可能です。
- セキュリティのため、このエンドポイントはループバック、Tailnet、またはプライベートなネットワーク内でのみ公開し、インターネット上に直接公開することは避けてください。

詳細は [セキュリティ](/gateway/security) および [リモートアクセス](/gateway/remote) を参照してください。

## エージェントの選択

カスタムヘッダーは不要です。OpenAI の `model` フィールドにエージェント ID を埋め込んでください:

- `model: "openclaw:<agentId>"` (例: `"openclaw:main"`, `"openclaw:beta"`)
- `model: "agent:<agentId>"` (エイリアス)

または、特定の OpenClaw エージェントをヘッダーで指定することも可能です:

- `x-openclaw-agent-id: <agentId>` (デフォルトは `main`)

高度な設定:
- `x-openclaw-session-key: <sessionKey>` を指定することで、セッションルーティングを完全に制御できます。

## 有効化の手順

`gateway.http.endpoints.chatCompletions.enabled` を `true` に設定してください:

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: { enabled: true },
      },
    },
  },
}
```

## 無効化の手順

`gateway.http.endpoints.chatCompletions.enabled` を `false` に設定してください:

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: { enabled: false },
      },
    },
  },
}
```

## セッションの挙動

デフォルトでは、エンドポイントは **リクエストごとにステートレス** です（呼び出しのたびに新しいセッションキーが生成されます）。

リクエストに OpenAI の `user` 文字列が含まれている場合、ゲートウェイはそこから固定のセッションキーを導出します。これにより、同じユーザー文字列を使用する繰り返しの呼び出しで、エージェントセッションを共有することが可能になります。

## ストリーミング (SSE)

`stream: true` を設定することで、Server-Sent Events (SSE) を受信できます:

- `Content-Type: text/event-stream`
- 各イベント行の形式: `data: <JSON>`
- ストリームの終了: `data: [DONE]`

## 実行例

通常（非ストリーミング）の実行:

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "messages": [{"role":"user","content":"こんにちは"}]
  }'
```

ストリーミング実行:

```bash
curl -N http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "stream": true,
    "messages": [{"role":"user","content":"こんにちは"}]
  }'
```
