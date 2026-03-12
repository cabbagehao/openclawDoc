---
summary: "ウェイクと分離されたエージェント実行のための webhook 受信"
read_when:
  - webhook エンドポイントを追加または変更する場合
  - 外部システムをOpenClawに接続する場合
title: "OpenClawのWebhook受信の設定方法と外部システム連携ガイド"
description: "ゲートウェイは、外部トリガー向けに小さな HTTP webhook エンドポイントを公開できます。有効化、認証、エンドポイントを確認できます。"
---
ゲートウェイは、外部トリガー向けに小さな HTTP webhook エンドポイントを公開できます。

## 有効化

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    // オプション: 明示的な `agentId` ルーティングをこの許可リストに制限します。
    // 省略するか "*" を含めると、すべてのエージェントを許可します。
    // [] を設定すると、すべての明示的な `agentId` ルーティングを拒否します。
    allowedAgentIds: ["hooks", "main"],
  },
}
```

注意:

- `hooks.enabled=true` の場合、`hooks.token` は必須です。
- `hooks.path` のデフォルトは `/hooks` です。

## 認証

すべてのリクエストにフックトークンを含める必要があります。ヘッダーを使用することを推奨します:

- `Authorization: Bearer <token>` (推奨)
- `x-openclaw-token: <token>`
- クエリ文字列のトークンは拒否されます (`?token=...` は `400` を返します)。

## エンドポイント

### `POST /hooks/wake`

ペイロード:

```json
{ "text": "System line", "mode": "now" }
```

- `text` **必須** (文字列): イベントの説明 (例: "New email received")。
- `mode` オプション (`now` | `next-heartbeat`): 即座にハートビートをトリガーするか (デフォルト `now`)、次の定期チェックまで待つか。

効果:

- **main** セッションにシステムイベントをエンキューします。
- `mode=now` の場合、即座にハートビートをトリガーします。

### `POST /hooks/agent`

ペイロード:

```json
{
  "message": "Run this",
  "name": "Email",
  "agentId": "hooks",
  "sessionKey": "hook:email:msg-123",
  "wakeMode": "now",
  "deliver": true,
  "channel": "last",
  "to": "+15551234567",
  "model": "openai/gpt-5.2-mini",
  "thinking": "low",
  "timeoutSeconds": 120
}
```

- `message` **必須** (文字列): エージェントが処理するプロンプトまたはメッセージ。
- `name` オプション (文字列): フックの人間が読める名前 (例: "GitHub")。セッションの要約でプレフィックスとして使用されます。
- `agentId` オプション (文字列): このフックを特定のエージェントにルーティングします。不明な ID はデフォルトエージェントにフォールバックします。設定された場合、フックは解決済みエージェントのワークスペースと設定を使って実行されます。
- `sessionKey` オプション (文字列): エージェントのセッションを識別するために使用されるキー。デフォルトでは、`hooks.allowRequestSessionKey=true` でない限り、このフィールドは拒否されます。
- `wakeMode` オプション (`now` | `next-heartbeat`): 即座にハートビートをトリガーするか (デフォルト `now`)、次の定期チェックまで待つか。
- `deliver` オプション (ブール値): `true` の場合、エージェントの応答はメッセージングチャンネルに送信されます。デフォルトは `true` です。ハートビートの確認のみの応答は自動的にスキップされます。
- `channel` オプション (文字列): 配信用のメッセージングチャンネル。次のいずれか: `last`, `whatsapp`, `telegram`, `discord`, `slack`, `mattermost` (プラグイン), `signal`, `imessage`, `msteams`。デフォルトは `last` です。
- `to` オプション (文字列): チャンネルの受信者識別子 (例: WhatsApp/Signalの電話番号、TelegramのチャットID、Discord/Slack/Mattermost(プラグイン)のチャンネルID、MS Teamsの会話ID)。デフォルトはメインセッションの最後の受信者です。
- `model` オプション (文字列): モデルのオーバーライド (例: `anthropic/claude-3-5-sonnet` またはエイリアス)。制限されている場合、許可されたモデルリストに含まれている必要があります。
- `thinking` オプション (文字列): 思考レベルのオーバーライド (例: `low`, `medium`, `high`)。
- `timeoutSeconds` オプション (数値): エージェント実行の最大継続時間 (秒)。

効果:

- **分離された**エージェントのターン (独自のセッションキー) を実行します。
- 常に **main** セッションに要約を投稿します。
- `wakeMode=now` の場合、即座にハートビートをトリガーします。

## セッションキーポリシー（breaking change）

`/hooks/agent` ペイロードの `sessionKey` オーバーライドはデフォルトで無効になっています。

- 推奨: 固定の `hooks.defaultSessionKey` を設定し、リクエストのオーバーライドをオフのままにします。
- オプション: 必要な場合のみリクエストのオーバーライドを許可し、プレフィックスを制限します。

推奨設定:

```json5
{
  hooks: {
    enabled: true,
    token: "${OPENCLAW_HOOKS_TOKEN}",
    defaultSessionKey: "hook:ingress",
    allowRequestSessionKey: false,
    allowedSessionKeyPrefixes: ["hook:"],
  },
}
```

互換性設定 (レガシーな動作):

```json5
{
  hooks: {
    enabled: true,
    token: "${OPENCLAW_HOOKS_TOKEN}",
    allowRequestSessionKey: true,
    allowedSessionKeyPrefixes: ["hook:"], // 強く推奨
  },
}
```

### `POST /hooks/<name>`（マッピング経由）

カスタムフック名は `hooks.mappings` を介して解決されます (設定を参照)。マッピングにより、任意のペイロードをオプションのテンプレートやコード変換を使用して `wake` または `agent` アクションに変換できます。

マッピングオプション (概要):

- `hooks.presets: ["gmail"]` は組み込みのGmailマッピングを有効にします。
- `hooks.mappings` により、設定で `match`、`action`、テンプレートを定義できます。
- `hooks.transformsDir` + `transform.module` は、カスタムロジック用の JS / TS モジュールを読み込みます。
  - `hooks.transformsDir` (設定されている場合) は、OpenClaw設定ディレクトリ (通常は `~/.openclaw/hooks/transforms`) 下の変換ルート内に留まる必要があります。
  - `transform.module` は、有効な変換ディレクトリ内で解決される必要があります (トラバーサル/エスケープパスは拒否されます)。
- `match.source` を使用して、汎用的な取り込みエンドポイントを維持します (ペイロード主導のルーティング)。
- TS 変換は、実行時に TS ローダー（例: `bun` または `tsx`）または事前コンパイル済みの `.js` を必要とします。
- マッピングに `deliver: true` + `channel`/`to` を設定して、応答をチャットサーフェスにルーティングします
  (`channel` のデフォルトは `last` で、WhatsAppにフォールバックします)。
- `agentId` はフックを特定のエージェントにルーティングします。不明なIDはデフォルトエージェントにフォールバックします。
- `hooks.allowedAgentIds` は明示的な `agentId` ルーティングを制限します。省略する (または `*` を含める) と任意のエージェントを許可します。`[]` を設定すると明示的な `agentId` ルーティングを拒否します。
- `hooks.defaultSessionKey` は、明示的なキーが提供されていない場合のフックエージェント実行のデフォルトセッションを設定します。
- `hooks.allowRequestSessionKey` は、`/hooks/agent` ペイロードが `sessionKey` を設定できるかどうかを制御します (デフォルト: `false`)。
- `hooks.allowedSessionKeyPrefixes` は、リクエストペイロードとマッピングからの明示的な `sessionKey` 値をオプションで制限します。
- `allowUnsafeExternalContent: true` は、そのフックの外部コンテンツ安全ラッパーを無効にします
  (危険; 信頼できる内部ソース用のみ)。
- `openclaw webhooks gmail setup` は `openclaw webhooks gmail run` 用の `hooks.gmail` 設定を書き込みます。
  完全なGmail監視フローについては [Gmail Pub/Sub](/automation/gmail-pubsub) を参照してください。

## レスポンス

- `/hooks/wake` の場合は `200`
- `/hooks/agent` (非同期実行の受け入れ) の場合は `200`
- 認証失敗の場合は `401`
- 同じクライアントからの度重なる認証失敗の後は `429` (`Retry-After` を確認)
- 無効なペイロードの場合は `400`
- 特大のペイロードの場合は `413`

## 例

```bash
curl -X POST http://127.0.0.1:18789/hooks/wake \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"text":"New email received","mode":"now"}'
```

```bash
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'x-openclaw-token: SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"message":"Summarize inbox","name":"Email","wakeMode":"next-heartbeat"}'
```

### 別のモデルを使う

エージェントペイロード（またはマッピング）に `model` を追加すると、その実行で使うモデルを上書きできます。

```bash
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'x-openclaw-token: SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.2-mini"}'
```

`agents.defaults.models` を強制する場合、オーバーライドモデルがそこに含まれていることを確認してください。

```bash
curl -X POST http://127.0.0.1:18789/hooks/gmail \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"source":"gmail","messages":[{"from":"Ada","subject":"Hello","snippet":"Hi"}]}'
```

## セキュリティ

- フックエンドポイントは、ループバック、tailnet、または信頼できるリバースプロキシの背後に配置してください。
- 専用のフックトークンを使用してください。ゲートウェイ認証トークンを再利用しないでください。
- 度重なる認証失敗は、ブルートフォース試行を遅らせるためにクライアントアドレスごとにレート制限されます。
- マルチエージェントルーティングを使用する場合、明示的な `agentId` の選択を制限するために `hooks.allowedAgentIds` を設定してください。
- 呼び出し元が選択したセッションが必要な場合を除き、`hooks.allowRequestSessionKey=false` を維持してください。
- リクエスト `sessionKey` を有効にする場合、`hooks.allowedSessionKeyPrefixes` を制限してください (例: `["hook:"]`)。
- webhook ログに機密性の高い生のペイロードを含めないようにしてください。
- フックペイロードはデフォルトで信頼できないものとして扱われ、安全境界でラップされます。
  特定のフックでこれを無効にする必要がある場合は、そのフックのマッピングで `allowUnsafeExternalContent: true` を設定します (危険)。
