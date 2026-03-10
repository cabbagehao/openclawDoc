---
summary: "OpenAI 互換の /v1/chat/completions HTTP エンドポイントをゲートウェイから公開する"
read_when:
  - OpenAI Chat Completions を期待する統合ツール
title: "OpenAI チャットの完了"
x-i18n:
  source_hash: "e12f1b5dacbd5a6fe6fe5304dc6a84f56312c57d4b88db5037b1863a8e0edd65"
---

# OpenAI チャット補完 (HTTP)

OpenClaw のゲートウェイは、小規模な OpenAI 互換の Chat Completions エンドポイントを提供できます。

このエンドポイントは **デフォルトでは無効になっています**。まず設定で有効にしてください。

- `POST /v1/chat/completions`
- ゲートウェイと同じポート (WS + HTTP マルチプレックス): `http://<gateway-host>:<port>/v1/chat/completions`

内部では、リクエストは通常のゲートウェイ エージェントの実行 (`openclaw agent` と同じコードパス) として実行されるため、ルーティング/権限/構成はゲートウェイと一致します。

## 認証

ゲートウェイ認証構成を使用します。無記名トークンを送信します。

- `Authorization: Bearer <token>`

注:

- `gateway.auth.mode="token"`の場合は、`gateway.auth.token`(または`OPENCLAW_GATEWAY_TOKEN`)を使用してください。
- `gateway.auth.mode="password"`の場合は、`gateway.auth.password`(または`OPENCLAW_GATEWAY_PASSWORD`)を使用します。
- `gateway.auth.rateLimit` が構成されており、認証失敗が多すぎる場合、エンドポイントは `429` と `Retry-After` を返します。

## セキュリティ境界 (重要)

このエンドポイントを、ゲートウェイ インスタンスの **完全なオペレータ アクセス** サーフェスとして扱います。- ここでの HTTP ベアラー認証は、ユーザーごとの範囲が狭いモデルではありません。

- このエンドポイントの有効なゲートウェイ トークン/パスワードは、所有者/オペレーターの資格情報と同様に扱われる必要があります。
- リクエストは、信頼されたオペレーターのアクションと同じコントロール プレーン エージェント パスを通じて実行されます。
- このエンドポイントには、非所有者/ユーザーごとの個別のツール境界はありません。呼び出し元がここでゲートウェイ認証を通過すると、OpenClaw はその呼び出し元をこのゲートウェイの信頼できるオペレーターとして扱います。
- ターゲット エージェント ポリシーで機密ツールが許可されている場合、このエンドポイントはそれらを使用できます。
- このエンドポイントをループバック/テールネット/プライベートイングレスのみに保持します。公共のインターネットに直接公開しないでください。

[セキュリティ](/gateway/security) および [リモート アクセス](/gateway/remote) を参照してください。

## エージェントの選択

カスタム ヘッダーは必要ありません。OpenAI `model` フィールドでエージェント ID をエンコードします。

- `model: "openclaw:<agentId>"` (例: `"openclaw:main"`、`"openclaw:beta"`)
- `model: "agent:<agentId>"` (エイリアス)

または、ヘッダーによって特定の OpenClaw エージェントをターゲットにします。

- `x-openclaw-agent-id: <agentId>` (デフォルト: `main`)

上級:

- `x-openclaw-session-key: <sessionKey>` はセッション ルーティングを完全に制御します。

## エンドポイントを有効にする

`gateway.http.endpoints.chatCompletions.enabled` を `true` に設定します。

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

## エンドポイントの無効化

`gateway.http.endpoints.chatCompletions.enabled` を `false` に設定します。

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

## セッションの動作

デフォルトでは、エンドポイントは **リクエストごとにステートレス** です (呼び出しごとに新しいセッション キーが生成されます)。リクエストに OpenAI `user` 文字列が含まれている場合、ゲートウェイはそこから安定したセッション キーを取得するため、繰り返しの呼び出しでエージェント セッションを共有できます。

## ストリーミング (SSE)

サーバー送信イベント (SSE) を受信するように `stream: true` を設定します。

- `Content-Type: text/event-stream`
- 各イベント行は `data: <json>` です
- ストリームは `data: [DONE]` で終了します

## 例

非ストリーミング:

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "messages": [{"role":"user","content":"hi"}]
  }'
```

ストリーミング:

```bash
curl -N http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "stream": true,
    "messages": [{"role":"user","content":"hi"}]
  }'
```
