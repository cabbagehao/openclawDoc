---
summary: "計画: OpenResponses /v1/responses エンドポイントを追加し、チャット完了を完全に非推奨にする"
read_when:
  - "`/v1/responses` ゲートウェイ サポートの設計または実装"
  - "チャットコンプリーションの互換性からの移行の計画"
owner: "openclaw"
status: "draft"
last_updated: "2026-01-19"
title: "OpenResponses ゲートウェイ プラン"
x-i18n:
  source_hash: "c112e9eb5077ff7c88b1bd1b28d57f0526280207211e1f19ada88ebf212b51d1"
---

# OpenResponses ゲートウェイ統合計画

## コンテキスト

OpenClaw Gateway は現在、最小限の OpenAI 互換 Chat Completions エンドポイントを次の場所で公開しています。
`/v1/chat/completions` ([OpenAI チャットの完了](/gateway/openai-http-api) を参照)。

Open Responses は、OpenAI Responses API に基づくオープン推論標準です。設計されています
エージェント ワークフロー用であり、アイテムベースの入力とセマンティック ストリーミング イベントを使用します。オープンレスポンス
仕様では `/v1/chat/completions` ではなく `/v1/responses` が定義されています。

## 目標

- OpenResponses セマンティクスに準拠する `/v1/responses` エンドポイントを追加します。
- チャット完了を、簡単に無効化し、最終的には削除できる互換性レイヤーとして保持します。
- 分離された再利用可能なスキーマを使用して検証と解析を標準化します。

## 非目標

- 最初のパスでの完全な OpenResponses 機能の同等性 (画像、ファイル、ホストされたツール)。
- 内部エージェント実行ロジックまたはツール オーケストレーションを置き換えます。
- 最初のフェーズでの既存の `/v1/chat/completions` の動作を変更します。

## 研究概要

出典: OpenResponses OpenAPI、OpenResponses 仕様サイト、および Hugging Face ブログ投稿。

抽出された重要なポイント:- `POST /v1/responses` は、`model`、`input` (文字列または
`ItemParam[]`)、`instructions`、`tools`、`tool_choice`、`stream`、`max_output_tokens`、および
`max_tool_calls`。

- `ItemParam` は、以下の判別共用体です。
  - `system`、`developer`、`user`、`assistant` のロールを持つ `message` アイテム
  - `function_call` および `function_call_output`
  - `reasoning`
  - `item_reference`
- 成功した応答は、`object: "response"`、`status`、および `ResponseResource` を返します。
  `output` アイテム。
- ストリーミングでは、次のようなセマンティック イベントが使用されます。
  - `response.created`、`response.in_progress`、`response.completed`、`response.failed`
  - `response.output_item.added`、`response.output_item.done`
  - `response.content_part.added`、`response.content_part.done`
  - `response.output_text.delta`、`response.output_text.done`
- 仕様には以下が必要です。
  - `Content-Type: text/event-stream`
  - `event:` は JSON `type` フィールドと一致する必要があります
  - ターミナル イベントはリテラル `[DONE]` である必要があります
- 推論項目では、`content`、`encrypted_content`、および `summary` が公開される可能性があります。
- HF の例には、リクエストに `OpenResponses-Version: latest` が含まれます (オプションのヘッダー)。

## 提案されたアーキテクチャ- Zod スキーマのみを含む `src/gateway/open-responses.schema.ts` を追加します (ゲートウェイ インポートは含まれません)

- `/v1/responses` に `src/gateway/openresponses-http.ts` (または `open-responses-http.ts`) を追加します。
- `src/gateway/openai-http.ts` をレガシー互換アダプターとしてそのまま保持します。
- 構成 `gateway.http.endpoints.responses.enabled` (デフォルトは `false`) を追加します。
- `gateway.http.endpoints.chatCompletions.enabled` を独立させます。両方のエンドポイントを許可します
  個別に切り替えられます。
- チャット完了が有効になっている場合、レガシー ステータスを通知するために起動警告を発します。

## チャット完了の非推奨パス

- 厳格なモジュール境界を維持します。応答とチャット完了の間でスキーマ タイプを共有しません。
- コードを変更せずにチャット完了を無効にできるように、構成によってチャット完了をオプトインします。
- `/v1/responses` が安定したら、チャット完了にレガシーとしてラベルを付けるようにドキュメントを更新します。
- 将来のオプションのステップ: チャット完了リクエストを応答ハンドラーにマップして、よりシンプルにします。
  削除パス。

## フェーズ 1 サポート サブセット

- `input` を文字列として受け入れるか、メッセージ ロールと `function_call_output` を含む `ItemParam[]` を受け入れます。
- システムおよび開発者のメッセージを `extraSystemPrompt` に抽出します。
- エージェント実行の現在のメッセージとして、最新の `user` または `function_call_output` を使用します。
- サポートされていないコンテンツ部分 (画像/ファイル) を `invalid_request_error` で拒否します。
- `output_text` コンテンツを含む単一のアシスタント メッセージを返します。
- トークン アカウンティングが接続されるまで、ゼロ化された値で `usage` を返します。

## 検証戦略 (SDK なし)- サポートされているサブセットの Zod スキーマを実装します

- `CreateResponseBody`
- `ItemParam` + メッセージコンテンツ部分の結合
- `ResponseResource`
- ゲートウェイで使用されるストリーミング イベント シェイプ
- ドリフトを回避し、将来のコード生成を可能にするために、スキーマを単一の分離されたモジュールに保持します。

## ストリーミングの実装 (フェーズ 1)

- `event:` と `data:` の両方を含む SSE 行。
- 必要なシーケンス (実行可能な最小限):
  - `response.created`
  - `response.output_item.added`
  - `response.content_part.added`
  - `response.output_text.delta` (必要に応じて繰り返します)
  - `response.output_text.done`
  - `response.content_part.done`
  - `response.completed`
  - `[DONE]`

## テストと検証計画

- `/v1/responses` の e2e カバレッジを追加:
  - 認証が必要です
  - 非ストリーム応答形状
  - ストリームイベントの順序付けと `[DONE]`
  - ヘッダーと `user` を使用したセッション ルーティング
- `src/gateway/openai-http.test.ts` を変更しないでください。
- 手動: `stream: true` を使用して `/v1/responses` にカールし、イベントの順序とターミナルを確認します
  `[DONE]`。

## ドキュメントの更新 (フォローアップ)

- `/v1/responses` の使用法と例に関する新しいドキュメント ページを追加します。
- 従来のメモと `/v1/responses` へのポインタを使用して `/gateway/openai-http-api` を更新します。
