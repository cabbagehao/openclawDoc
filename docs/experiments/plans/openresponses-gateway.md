---
summary: "計画: OpenResponses の `/v1/responses` エンドポイントを追加し、Chat Completions を段階的に非推奨化する"
read_when:
  - "`/v1/responses` のゲートウェイサポートを設計または実装するとき"
  - Chat Completions 互換からの移行を計画するとき
owner: "openclaw"
status: "draft"
last_updated: "2026-01-19"
title: "OpenResponses ゲートウェイ計画"
seoTitle: "OpenClaw OpenResponsesゲートウェイ計画と設計論点"
description: "OpenClaw Gateway は現在、最小限の OpenAI 互換 Chat Completions エンドポイントを /v1/chat/completions で公開しています。詳細は OpenAI Chat Completions を参照してください。"
x-i18n:
  source_hash: "c112e9eb5077ff7c88b1bd1b28d57f0526280207211e1f19ada88ebf212b51d1"
---
## コンテキスト

OpenClaw Gateway は現在、最小限の OpenAI 互換 Chat Completions エンドポイントを `/v1/chat/completions` で公開しています。詳細は [OpenAI Chat Completions](/gateway/openai-http-api) を参照してください。

Open Responses は、OpenAI Responses API をベースにしたオープンな推論標準です。エージェント型ワークフロー向けに設計されており、アイテムベースの入力と意味論的なストリーミングイベントを使用します。OpenResponses の仕様で定義されているのは `/v1/responses` であり、`/v1/chat/completions` ではありません。

## 目標

- OpenResponses のセマンティクスに準拠した `/v1/responses` エンドポイントを追加する
- Chat Completions は、無効化しやすく、最終的に削除しやすい互換レイヤーとして維持する
- 独立して再利用できるスキーマにより、検証とパースを標準化する

## 非目標

- 初期フェーズで OpenResponses の全機能と同等にすること（画像、ファイル、ホスト型ツールを含む）
- 内部のエージェント実行ロジックやツールオーケストレーションを置き換えること
- 第 1 フェーズで既存の `/v1/chat/completions` の挙動を変更すること

## 調査の要約

参照元: OpenResponses OpenAPI、OpenResponses 仕様サイト、Hugging Face のブログ記事。

主な確認事項:

- `POST /v1/responses` は、`model`、`input`（文字列または `ItemParam[]`）、`instructions`、`tools`、`tool_choice`、`stream`、`max_output_tokens`、`max_tool_calls` などの `CreateResponseBody` フィールドを受け付ける
- `ItemParam` は次の判別共用体で構成される
  - `system`、`developer`、`user`、`assistant` の各 role を持つ `message`
  - `function_call` と `function_call_output`
  - `reasoning`
  - `item_reference`
- 正常応答では `object: "response"`、`status`、`output` を含む `ResponseResource` が返る
- ストリーミングでは、次のような意味論的イベントを使用する
  - `response.created`、`response.in_progress`、`response.completed`、`response.failed`
  - `response.output_item.added`、`response.output_item.done`
  - `response.content_part.added`、`response.content_part.done`
  - `response.output_text.delta`、`response.output_text.done`
- 仕様上の必須要件は次のとおり
  - `Content-Type: text/event-stream`
  - `event:` は JSON の `type` フィールドと一致すること
  - 終端イベントはリテラルの `[DONE]` であること
- `reasoning` アイテムは `content`、`encrypted_content`、`summary` を公開する場合がある
- Hugging Face の例では、リクエストに `OpenResponses-Version: latest` を含めている（任意ヘッダー）

## 提案アーキテクチャ

- Zod スキーマだけを持つ `src/gateway/open-responses.schema.ts` を追加する（ゲートウェイ側 import は含めない）
- `/v1/responses` 向けに `src/gateway/openresponses-http.ts`（または `open-responses-http.ts`）を追加する
- `src/gateway/openai-http.ts` は従来互換アダプターとしてそのまま維持する
- 設定項目 `gateway.http.endpoints.responses.enabled` を追加する（デフォルトは `false`）
- `gateway.http.endpoints.chatCompletions.enabled` は独立させ、両エンドポイントを個別に切り替えられるようにする
- Chat Completions が有効な場合は、従来機能であることを示す起動時警告を出す

## Chat Completions の非推奨化方針

- 厳密なモジュール境界を維持し、responses と chat completions の間でスキーマ型を共有しない
- Chat Completions は設定による opt-in にして、コード変更なしで無効化できるようにする
- `/v1/responses` が安定した段階で、Chat Completions を legacy と明示するようドキュメントを更新する
- 将来的な任意の施策として、Chat Completions リクエストを Responses ハンドラーへマップし、削除経路を単純化することを検討する

## フェーズ 1 のサポート範囲

- `input` は文字列、または message role と `function_call_output` を含む `ItemParam[]` として受け付ける
- `system` / `developer` メッセージは `extraSystemPrompt` に抽出する
- エージェント実行時の現在メッセージには、最新の `user` または `function_call_output` を使う
- 未対応の content part（画像 / ファイル）は `invalid_request_error` で拒否する
- `output_text` を含む単一の assistant message を返す
- トークン集計が接続されるまでは、`usage` は 0 埋めした値を返す

## 検証戦略（SDK なし）

- 次の対応範囲について Zod スキーマを実装する
  - `CreateResponseBody`
  - `ItemParam` と message content part union
  - `ResponseResource`
  - ゲートウェイで使用するストリーミングイベント形状
- スキーマは単一で独立したモジュールにまとめ、仕様との乖離を防ぎつつ、将来的な codegen にも対応しやすくする

## ストリーミング実装（フェーズ 1）

- SSE 行には `event:` と `data:` の両方を含める
- 必要となる最小シーケンス:
  - `response.created`
  - `response.output_item.added`
  - `response.content_part.added`
  - `response.output_text.delta`（必要に応じて繰り返す）
  - `response.output_text.done`
  - `response.content_part.done`
  - `response.completed`
  - `[DONE]`

## テストと検証計画

- `/v1/responses` 向けに e2e カバレッジを追加する
  - 認証が必須であること
  - 非ストリーミング応答の形状
  - ストリームイベントの順序と `[DONE]`
  - ヘッダーと `user` を使ったセッションルーティング
- `src/gateway/openai-http.test.ts` は変更しない
- 手動確認として、`stream: true` を指定して `/v1/responses` に `curl` し、イベント順序と終端の `[DONE]` を確認する

## ドキュメント更新（後続タスク）

- `/v1/responses` の使い方と例を説明する新しいドキュメントページを追加する
- `/gateway/openai-http-api` に legacy 注記を追加し、`/v1/responses` への導線を設ける
