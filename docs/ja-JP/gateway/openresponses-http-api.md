---
summary: "OpenResponses 互換の /v1/responses HTTP エンドポイントをゲートウェイから公開する"
read_when:
  - OpenResponses API を使用するクライアントの統合
  - アイテムベースの入力、クライアント ツール呼び出し、または SSE イベントが必要な場合
title: "オープンレスポンス API"
x-i18n:
  source_hash: "59aceb2143d65b2d13f39736170ef7c2d01f61b2b223941635148ba819c702d6"
---

# OpenResponses API (HTTP)

OpenClaw のゲートウェイは、OpenResponses 互換の `POST /v1/responses` エンドポイントにサービスを提供できます。

このエンドポイントは **デフォルトでは無効になっています**。まず設定で有効にしてください。

- `POST /v1/responses`
- ゲートウェイと同じポート (WS + HTTP マルチプレックス): `http://<gateway-host>:<port>/v1/responses`

内部では、リクエストは通常のゲートウェイ エージェントの実行として実行されます (ゲートウェイ エージェントと同じコードパス)。
`openclaw agent`)、ルーティング/権限/構成がゲートウェイと一致するようにします。

## 認証

ゲートウェイ認証構成を使用します。無記名トークンを送信します。

- `Authorization: Bearer <token>`

注:

- `gateway.auth.mode="token"`の場合は、`gateway.auth.token`(または`OPENCLAW_GATEWAY_TOKEN`)を使用してください。
- `gateway.auth.mode="password"`の場合は、`gateway.auth.password`(または`OPENCLAW_GATEWAY_PASSWORD`)を使用してください。
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

カスタム ヘッダーは必要ありません。OpenResponses `model` フィールドでエージェント ID をエンコードします。

- `model: "openclaw:<agentId>"` (例: `"openclaw:main"`、`"openclaw:beta"`)
- `model: "agent:<agentId>"` (エイリアス)

または、ヘッダーによって特定の OpenClaw エージェントをターゲットにします。

- `x-openclaw-agent-id: <agentId>` (デフォルト: `main`)

上級:

- `x-openclaw-session-key: <sessionKey>` はセッション ルーティングを完全に制御します。

## エンドポイントを有効にする

`gateway.http.endpoints.responses.enabled` を `true` に設定します。

```json5
{
  gateway: {
    http: {
      endpoints: {
        responses: { enabled: true },
      },
    },
  },
}
```

## エンドポイントの無効化

`gateway.http.endpoints.responses.enabled` を `false` に設定します。

```json5
{
  gateway: {
    http: {
      endpoints: {
        responses: { enabled: false },
      },
    },
  },
}
```

## セッションの動作

デフォルトでは、エンドポイントは **リクエストごとにステートレス** です (呼び出しごとに新しいセッション キーが生成されます)。リクエストに OpenResponses `user` 文字列が含まれている場合、ゲートウェイは安定したセッション キーを取得します。
これにより、繰り返しの通話でエージェント セッションを共有できるようになります。

## リクエスト形状 (サポートされています)

リクエストは、項目ベースの入力を使用して OpenResponses API に従います。現在のサポート:

- `input`: 項目オブジェクトの文字列または配列。
- `instructions`: システム プロンプトに統合されました。
- `tools`: クライアント ツール定義 (機能ツール)。
- `tool_choice`: フィルタリングするか、クライアント ツールを要求します。
- `stream`: SSE ストリーミングを有効にします。
- `max_output_tokens`: ベストエフォート型の出力制限 (プロバイダーに依存)。
- `user`: 安定したセッション ルーティング。

受け入れられましたが、**現在無視されています**:

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `previous_response_id`
- `truncation`

## 項目 (入力)

### `message`

役割: `system`、`developer`、`user`、`assistant`。

- `system` および `developer` がシステム プロンプトに追加されます。
- 最新の `user` または `function_call_output` アイテムが「現在のメッセージ」になります。
- 以前のユーザー/アシスタント メッセージは、コンテキストの履歴として含まれます。

### `function_call_output` (ターンベースのツール)

ツールの結果をモデルに送り返します。

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` および `item_reference`

スキーマの互換性のために受け入れられますが、プロンプトの構築時には無視されます。## ツール (クライアント側の機能ツール)

`tools: [{ type: "function", function: { name, description?, parameters? } }]` のツールを提供します。

エージェントがツールを呼び出すことを決定した場合、応答は `function_call` 出力項目を返します。
次に、`function_call_output` を使用してフォローアップ リクエストを送信し、ターンを続行します。

## 画像 (`input_image`)

Base64 または URL ソースをサポートします。

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

許可される MIME タイプ (現在): `image/jpeg`、`image/png`、`image/gif`、`image/webp`、`image/heic`、`image/heif`。
最大サイズ (現在): 10MB。

## ファイル (`input_file`)

Base64 または URL ソースをサポートします。

```json
{
  "type": "input_file",
  "source": {
    "type": "base64",
    "media_type": "text/plain",
    "data": "SGVsbG8gV29ybGQh",
    "filename": "hello.txt"
  }
}
```

許可されている MIME タイプ (現在): `text/plain`、`text/markdown`、`text/html`、`text/csv`、
`application/json`、`application/pdf`。

最大サイズ (現在): 5MB。

現在の動作:

- ファイルの内容はデコードされ、ユーザー メッセージではなく **システム プロンプト**に追加されます。
  そのため、一時的なままになります (セッション履歴には保持されません)。
- PDF はテキストとして解析されます。テキストがほとんど見つからない場合は、最初のページがラスタライズされます
  画像に変換され、モデルに渡されます。

PDF 解析では、ノードフレンドリーな `pdfjs-dist` レガシー ビルド (ワーカーなし) が使用されます。現代の
PDF.js ビルドはブラウザー ワーカー/DOM グローバルを想定しているため、ゲートウェイでは使用されません。

URL フェッチのデフォルト:- `files.allowUrl`: `true`

- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (リクエストごとの URL ベースの合計 `input_file` + `input_image` パーツ)
- リクエストは保護されます (DNS 解決、プライベート IP ブロック、リダイレクト キャップ、タイムアウト)。
- 入力タイプごとにオプションのホスト名ホワイトリストがサポートされています (`files.urlAllowlist`、`images.urlAllowlist`)。
  - 正確なホスト: `"cdn.example.com"`
  - ワイルドカード サブドメイン: `"*.assets.example.com"` (頂点と一致しません)

## ファイル + 画像の制限 (構成)

デフォルトは `gateway.http.endpoints.responses` で調整できます。

```json5
{
  gateway: {
    http: {
      endpoints: {
        responses: {
          enabled: true,
          maxBodyBytes: 20000000,
          maxUrlParts: 8,
          files: {
            allowUrl: true,
            urlAllowlist: ["cdn.example.com", "*.assets.example.com"],
            allowedMimes: [
              "text/plain",
              "text/markdown",
              "text/html",
              "text/csv",
              "application/json",
              "application/pdf",
            ],
            maxBytes: 5242880,
            maxChars: 200000,
            maxRedirects: 3,
            timeoutMs: 10000,
            pdf: {
              maxPages: 4,
              maxPixels: 4000000,
              minTextChars: 200,
            },
          },
          images: {
            allowUrl: true,
            urlAllowlist: ["images.example.com"],
            allowedMimes: [
              "image/jpeg",
              "image/png",
              "image/gif",
              "image/webp",
              "image/heic",
              "image/heif",
            ],
            maxBytes: 10485760,
            maxRedirects: 3,
            timeoutMs: 10000,
          },
        },
      },
    },
  },
}
```

省略時のデフォルト:

- `maxBodyBytes`: 20MB
- `maxUrlParts`: 8
- `files.maxBytes`: 5MB
- `files.maxChars`: 200k
- `files.maxRedirects`: 3
- `files.timeoutMs`: 10秒
- `files.pdf.maxPages`: 4
- `files.pdf.maxPixels`: 4,000,000
- `files.pdf.minTextChars`: 200
- `images.maxBytes`: 10MB
- `images.maxRedirects`: 3
- `images.timeoutMs`: 10秒
- HEIC/HEIF `input_image` ソースは受け入れられ、プロバイダー配信前に JPEG に正規化されます。

セキュリティ上の注意:

- URL ホワイトリストは、フェッチ前およびリダイレクト ホップで適用されます。
- ホスト名を許可リストに登録しても、プライベート/内部 IP ブロックはバイパスされません。
- インターネットに公開されたゲートウェイの場合、アプリレベルのガードに加えてネットワーク下り制御を適用します。
  [セキュリティ](/gateway/security) を参照してください。

## ストリーミング (SSE)

サーバー送信イベント (SSE) を受信するように `stream: true` を設定します。- `Content-Type: text/event-stream`

- 各イベント行は `event: <type>` および `data: <json>` です。
- ストリームは `data: [DONE]` で終了します

現在発行されているイベントの種類:

- `response.created`
- `response.in_progress`
- `response.output_item.added`
- `response.content_part.added`
- `response.output_text.delta`
- `response.output_text.done`
- `response.content_part.done`
- `response.output_item.done`
- `response.completed`
- `response.failed` (エラー時)

## 使用法

`usage` は、基礎となるプロバイダーがトークン数を報告するときに設定されます。

## エラー

エラーでは次のような JSON オブジェクトが使用されます。

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

よくあるケース:

- `401` 認証が見つからない/無効です
- `400` リクエスト本文が無効です
- `405` 間違った方法です

## 例

非ストリーミング:

```bash
curl -sS http://127.0.0.1:18789/v1/responses \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "input": "hi"
  }'
```

ストリーミング:

```bash
curl -N http://127.0.0.1:18789/v1/responses \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "stream": true,
    "input": "hi"
  }'
```
