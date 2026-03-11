---
summary: "ゲートウェイから OpenResponses 互換の /v1/responses HTTP エンドポイントを公開する"
read_when:
  - OpenResponses API を使用するクライアントと統合する場合
  - アイテムベースの入力、クライアント側のツール呼び出し、または SSE イベントを利用したい場合
title: "OpenResponses API"
x-i18n:
  source_hash: "59aceb2143d65b2d13f39736170ef7c2d01f61b2b223941635148ba819c702d6"
---

# OpenResponses API (HTTP)

OpenClaw ゲートウェイは、OpenResponses 互換の `POST /v1/responses` エンドポイントを提供できます。

このエンドポイントは **デフォルトで無効** になっています。利用するには、まず構成ファイルで有効にする必要があります。

* エンドポイント: `POST /v1/responses`
* ポート: ゲートウェイと同じポート（WebSocket と HTTP のマルチプレックス）: `http://<gateway-host>:<port>/v1/responses`

内部的には、リクエストは通常のゲートウェイエージェントの実行（`openclaw agent` と同じパス）として処理されます。そのため、ルーティング、権限、および構成設定はゲートウェイ本体の設定に従います。

## 認証 (Auth)

ゲートウェイの認証設定を使用します。リクエスト時に Bearer トークンを送信してください:

* `Authorization: Bearer <トークン>`

補足事項:

* `gateway.auth.mode="token"` の場合、`gateway.auth.token` (または環境変数 `OPENCLAW_GATEWAY_TOKEN`) を使用します。
* `gateway.auth.mode="password"` の場合、`gateway.auth.password` (または環境変数 `OPENCLAW_GATEWAY_PASSWORD`) を使用します。
* `gateway.auth.rateLimit` が構成されている場合、認証失敗が繰り返されるとエンドポイントは `429` (Retry-After 付き) を返します。

## セキュリティ境界 (重要)

このエンドポイントは、ゲートウェイインスタンスに対する **フルアクセス（オペレーター権限）** を持つインターフェースとして扱ってください。

* ここでの HTTP Bearer 認証は、一般ユーザー向けの制限されたスコープを持つものではありません。
* このエンドポイントで使用する有効なトークンやパスワードは、オーナー/オペレーターの認証情報と同等に扱う必要があります。
* リクエストは、信頼されたオペレーターのアクションと同じコントロールプレーンのエージェントパスを通じて実行されます。
* このエンドポイントには、非所有者や一般ユーザー向けの個別のツール制限レイヤーはありません。ゲートウェイ認証を通過した呼び出し元は、OpenClaw によってこのゲートウェイの信頼されたオペレーターとして扱われます。
* ターゲットとなるエージェントのポリシーで機密ツールが許可されている場合、このエンドポイント経由でもそれらのツールが実行可能です。
* セキュリティのため、このエンドポイントはループバック、Tailnet、またはプライベートなネットワーク内でのみ公開し、インターネット上に直接公開することは避けてください。

詳細は [セキュリティ](/gateway/security) および [リモートアクセス](/gateway/remote) を参照してください。

## エージェントの選択

カスタムヘッダーは不要です。OpenResponses の `model` フィールドにエージェント ID を埋め込んでください:

* `model: "openclaw:<agentId>"` (例: `"openclaw:main"`, `"openclaw:beta"`)
* `model: "agent:<agentId>"` (エイリアス)

または、特定の OpenClaw エージェントをヘッダーで指定することも可能です:

* `x-openclaw-agent-id: <agentId>` (デフォルトは `main`)

高度な設定:

* `x-openclaw-session-key: <sessionKey>` を指定することで、セッションルーティングを完全に制御できます。

## 有効化の手順

`gateway.http.endpoints.responses.enabled` を `true` に設定してください:

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

## 無効化の手順

`gateway.http.endpoints.responses.enabled` を `false` に設定してください:

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

## セッションの挙動

デフォルトでは、エンドポイントは **リクエストごとにステートレス** です（呼び出しのたびに新しいセッションキーが生成されます）。

リクエストに OpenResponses の `user` 文字列が含まれている場合、ゲートウェイはそこから固定のセッションキーを導出します。これにより、同じユーザー文字列を使用する繰り返しの呼び出しで、エージェントセッションを共有することが可能になります。

## 対応しているリクエスト形式

アイテムベースの入力を伴う OpenResponses API に従います。現在サポートされている項目は以下の通りです:

* `input`: 文字列、またはアイテムオブジェクトの配列。
* `instructions`: システムプロンプトにマージされます。
* `tools`: クライアント側のツール定義（function tools）。
* `tool_choice`: クライアントツールの使用を制限、あるいは強制します。
* `stream`: SSE によるストリーミングを有効にします。
* `max_output_tokens`: 出力トークン数の上限を指定します（プロバイダーに依存）。
* `user`: 固定のセッションルーティング用文字列。

受け入れ可能ですが、**現在は無視される** 項目:

* `max_tool_calls`
* `reasoning`
* `metadata`
* `store`
* `previous_response_id`
* `truncation`

## アイテム (入力)

### `message`

ロール: `system`, `developer`, `user`, `assistant`。

* `system` および `developer` はシステムプロンプトの末尾に追加されます。
* 最新の `user` または `function_call_output` アイテムが「現在のメッセージ」となります。
* それより前のユーザー/アシスタントのメッセージは、文脈（履歴）として含まれます。

### `function_call_output` (ターンベースのツール)

ツールの実行結果をモデルに返します:

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` および `item_reference`

スキーマの互換性のために受け入れられますが、プロンプト構築時には無視されます。

## ツール (クライアント側の関数ツール)

`tools: [{ type: "function", function: { name, description?, parameters? } }]` の形式でツールを提供します。

エージェントがツールの呼び出しを決定した場合、レスポンスには `function_call` 出力アイテムが含まれます。その後、`function_call_output` を含む次のリクエストを送信することでターンを継続できます。

## 画像 (`input_image`)

base64 または URL ソースをサポートしています:

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

許可される MIME タイプ: `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/heic`, `image/heif`。
最大サイズ: 10MB。

## ファイル (`input_file`)

base64 または URL ソースをサポートしています:

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

許可される MIME タイプ: `text/plain`, `text/markdown`, `text/html`, `text/csv`, `application/json`, `application/pdf`。
最大サイズ: 5MB。

現在の挙動:

* ファイルの内容はデコードされ、ユーザーメッセージではなく **システムプロンプト** に追加されます。そのため、セッション履歴には保存されず一時的なものとなります。
* PDF はテキスト抽出が行われます。テキストが少ない場合は、最初の数ページが画像化（ラスタライズ）され、画像としてモデルに渡されます。

PDF のパースには Node.js 親和性の高い `pdfjs-dist` のレガシービルド（ワーカーなし）を使用しています。最新の PDF.js ビルドはブラウザのワーカーや DOM グローバル変数を必要とするため、ゲートウェイ内では使用されません。

URL 取得のデフォルト設定:

* `files.allowUrl`: `true`
* `images.allowUrl`: `true`
* `maxUrlParts`: `8` (1回のリクエストに含まれる URL ベースの `input_file` + `input_image` の合計数)
* リクエストは安全に保護されます（DNS 解決、プライベート IP のブロック、リダイレクト制限、タイムアウト）。
* 入力タイプごとに追加のホスト名許可リストを指定可能です (`files.urlAllowlist`, `images.urlAllowlist`)。
  * 完全一致: `"cdn.example.com"`
  * ワイルドカード（サブドメインのみ）: `"*.assets.example.com"` (apex ドメイン自体には一致しません)

## ファイルおよび画像の上限設定 (構成)

`gateway.http.endpoints.responses` 配下で調整可能です:

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

省略時のデフォルト値:

* `maxBodyBytes`: 20MB
* `maxUrlParts`: 8
* `files.maxBytes`: 5MB
* `files.maxChars`: 20万文字
* `files.maxRedirects`: 3
* `files.timeoutMs`: 10秒
* `files.pdf.maxPages`: 4
* `files.pdf.maxPixels`: 4,000,000
* `files.pdf.minTextChars`: 200
* `images.maxBytes`: 10MB
* `images.maxRedirects`: 3
* `images.timeoutMs`: 10秒
* HEIC/HEIF 形式の画像は受け入れられ、モデルプロバイダーに送られる前に自動的に JPEG に正規化されます。

セキュリティ上の注意:

* ホスト名許可リストは、最初のフェッチ時およびリダイレクトの各ホップで適用されます。
* ホスト名を許可リストに入れても、プライベート/内部 IP へのブロッキングをバイパスすることはできません。
* インターネットに公開されたゲートウェイを運用する場合は、アプリレベルの保護に加えて、OS/ネットワークレベルでの下り通信制限（Egress control）も適用してください（詳細は [セキュリティ](/gateway/security) を参照）。

## ストリーミング (SSE)

`stream: true` を設定することで、Server-Sent Events (SSE) を受信できます:

* `Content-Type: text/event-stream`
* 各イベント行の形式: `event: <タイプ>` および `data: <JSON>`
* ストリームの終了: `data: [DONE]`

現在発行されるイベントタイプ:

* `response.created`
* `response.in_progress`
* `response.output_item.added`
* `response.content_part.added`
* `response.output_text.delta`
* `response.output_text.done`
* `response.content_part.done`
* `response.output_item.done`
* `response.completed`
* `response.failed` (エラー発生時)

## 利用状況 (Usage)

下位のプロバイダーからトークン数が報告された場合、レスポンスの `usage` フィールドに値がセットされます。

## エラー形式

エラーは以下の形式の JSON オブジェクトとして返されます:

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

主なステータスコード:

* `401`: 認証情報の欠落、または無効。
* `400`: リクエストボディが不正。
* `405`: 許可されていないメソッド。

## 実行例

通常（非ストリーミング）の実行:

```bash
curl -sS http://127.0.0.1:18789/v1/responses \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "input": "こんにちは"
  }'
```

ストリーミング実行:

```bash
curl -N http://127.0.0.1:18789/v1/responses \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "stream": true,
    "input": "こんにちは"
  }'
```
