---
summary: "ログの概要: ファイルログ、コンソール出力、CLI での tail、Control UI"
read_when:
  - ロギングの全体像を手早く把握したいとき
  - ログレベルや出力形式を設定したいとき
  - トラブルシューティングのためにログを素早く見つけたいとき
title: "Logging"
x-i18n:
  source_hash: "11907b8364e374c6eb1f157f380c2c14aced3053ef28c0f90e732ab475c21f93"
---

# Logging

OpenClaw のログは 2 か所に出力されます。

- **ファイルログ**: ゲートウェイが書き込む JSON Lines 形式のログ
- **コンソール出力**: ターミナルと Control UI に表示されるログ

このページでは、ログの保存場所、読み取り方法、ログレベルや出力形式の設定方法を説明します。

## ログの保存場所

デフォルトでは、ゲートウェイは次の場所に日次ローテーション形式のログファイルを書き込みます。

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

日付は、ゲートウェイホストのローカルタイムゾーンに基づきます。

`~/.openclaw/openclaw.json` で保存先を上書きできます。

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## ログの読み方

### CLI: ライブ tail（推奨）

CLI から RPC 経由でゲートウェイのログファイルを tail できます。

```bash
openclaw logs --follow
```

出力モード:

- **TTY セッション**: 色付きで読みやすく整形された構造化ログ
- **非 TTY セッション**: プレーンテキスト
- `--json`: 1 行 1 イベントの line-delimited JSON
- `--plain`: TTY セッションでもプレーンテキストを強制する
- `--no-color`: ANSI カラーを無効にする

JSON モードでは、CLI は `type` 付きのオブジェクトを出力します。

- `meta`: ストリームのメタデータ（ファイル、cursor、size）
- `log`: パース済みログエントリ
- `notice`: truncation や rotation に関する通知
- `raw`: パースできなかった生ログ行

ゲートウェイに到達できない場合、CLI は次を実行するよう短いヒントを表示します。

```bash
openclaw doctor
```

### Control UI（Web）

Control UI の **Logs** タブは、`logs.tail` を使って同じログファイルを tail します。開き方は [/web/control-ui](/web/control-ui) を参照してください。

### チャンネル関連ログだけを見る

チャンネルアクティビティ（WhatsApp / Telegram など）だけを絞り込む場合は、次を使います。

```bash
openclaw channels logs --channel whatsapp
```

## ログ形式

### ファイルログ（JSONL）

ログファイルの各行は JSON オブジェクトです。CLI と Control UI はこれらをパースして、時刻、レベル、サブシステム、メッセージなどを含む構造化表示を行います。

### コンソール出力

コンソールログは **TTY 対応**で、人間が読みやすいように整形されます。

- サブシステム接頭辞（例: `gateway/channels/whatsapp`）
- レベルごとの色分け（info / warn / error）
- compact モードや JSON モードへの切り替え

コンソール出力の形式は `logging.consoleStyle` で制御します。

## ロギング設定

ロギング設定はすべて `~/.openclaw/openclaw.json` の `logging` 配下にあります。

```json
{
  "logging": {
    "level": "info",
    "file": "/tmp/openclaw/openclaw-YYYY-MM-DD.log",
    "consoleLevel": "info",
    "consoleStyle": "pretty",
    "redactSensitive": "tools",
    "redactPatterns": ["sk-.*"]
  }
}
```

### ログレベル

- `logging.level`: **ファイルログ**（JSONL）のレベル
- `logging.consoleLevel`: **コンソール出力**の詳細度

両方とも環境変数 **`OPENCLAW_LOG_LEVEL`** で上書きできます（例: `OPENCLAW_LOG_LEVEL=debug`）。環境変数は設定ファイルより優先されるため、`openclaw.json` を編集せずに単発実行だけ詳細度を上げられます。さらに、グローバル CLI オプション **`--log-level <level>`**（例: `openclaw --log-level debug gateway run`）を指定すると、そのコマンドでは環境変数よりもこちらが優先されます。

`--verbose` が影響するのはコンソール出力だけで、ファイルログのレベルは変わりません。

### コンソールスタイル

`logging.consoleStyle`:

- `pretty`: 人が読みやすい色付き表示。タイムスタンプあり
- `compact`: より詰まった表示。長時間セッション向け
- `json`: 1 行ごとの JSON。ログ処理系向け

### マスキング

ツール要約では、機密トークンをコンソールに出す前にマスキングできます。

- `logging.redactSensitive`: `off` | `tools`（デフォルト: `tools`）
- `logging.redactPatterns`: 既定パターンを上書きする正規表現文字列の一覧

マスキングが適用されるのは **コンソール出力だけ** で、ファイルログは変更されません。

## Diagnostics と OpenTelemetry

diagnostics は、モデル実行やメッセージフローテレメトリ（webhook、queueing、session state）についての、構造化された機械可読イベントです。これは通常のログを置き換えるものではなく、メトリクス、トレース、その他の exporter にデータを供給するための仕組みです。

diagnostics event 自体はプロセス内で発行されますが、exporter が実際に接続されるのは diagnostics と exporter plugin の両方が有効な場合だけです。

### OpenTelemetry と OTLP の違い

- **OpenTelemetry（OTel）**: trace、metric、log のためのデータモデルと SDK 群
- **OTLP**: OTel データを collector / backend に送るための wire protocol
- OpenClaw は現時点では **OTLP/HTTP（protobuf）** で export する

### エクスポートされる signal

- **Metrics**: counter と histogram（トークン使用量、メッセージフロー、queueing）
- **Traces**: モデル利用や webhook / message 処理の span
- **Logs**: `diagnostics.otel.logs` を有効にすると OTLP 経由でエクスポートされる。ログ量は多くなりやすいため、`logging.level` と exporter 側の filter を考慮してください

### Diagnostics event カタログ

モデル使用:

- `model.usage`: token 数、コスト、duration、context、provider / model / channel、session ID

メッセージフロー:

- `webhook.received`: チャンネルごとの webhook 受信
- `webhook.processed`: webhook 処理結果と所要時間
- `webhook.error`: webhook handler エラー
- `message.queued`: 処理待ちキューへの登録
- `message.processed`: 処理結果、所要時間、任意のエラー

キューとセッション:

- `queue.lane.enqueue`: コマンドキューレーンへの enqueue と depth
- `queue.lane.dequeue`: コマンドキューレーンからの dequeue と待機時間
- `session.state`: session state の遷移と理由
- `session.stuck`: stuck session の警告と経過時間
- `run.attempt`: run の retry / attempt メタデータ
- `diagnostic.heartbeat`: webhook / queue / session の集約カウンタ

### diagnostics を有効にする（exporter なし）

plugin や custom sink から diagnostics event を利用したいだけの場合は、次の設定で十分です。

```json
{
  "diagnostics": {
    "enabled": true
  }
}
```

### diagnostics flags（対象を絞ったログ）

`logging.level` を上げずに、対象を絞った追加のデバッグログを有効化するには flags を使います。flags は大文字小文字を区別せず、ワイルドカード（例: `telegram.*`、`*`）にも対応します。

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

環境変数による一時上書き:

```
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

注:

- flag ログは通常のログファイル（`logging.file`）へ出力されます
- 出力のマスキングは `logging.redactSensitive` に従います
- 詳細ガイドは [/diagnostics/flags](/diagnostics/flags) を参照してください

### OpenTelemetry へエクスポートする

diagnostics は `diagnostics-otel` plugin（OTLP/HTTP）経由で export できます。OTLP/HTTP を受け付ける任意の OpenTelemetry collector / backend と組み合わせて利用できます。

```json
{
  "plugins": {
    "allow": ["diagnostics-otel"],
    "entries": {
      "diagnostics-otel": {
        "enabled": true
      }
    }
  },
  "diagnostics": {
    "enabled": true,
    "otel": {
      "enabled": true,
      "endpoint": "http://otel-collector:4318",
      "protocol": "http/protobuf",
      "serviceName": "openclaw-gateway",
      "traces": true,
      "metrics": true,
      "logs": true,
      "sampleRate": 0.2,
      "flushIntervalMs": 60000
    }
  }
}
```

注:

- `openclaw plugins enable diagnostics-otel` でも plugin を有効化できます
- `protocol` が現在サポートするのは `http/protobuf` のみで、`grpc` は無視されます
- metrics には、トークン使用量、コスト、コンテキストサイズ、実行時間、メッセージフロー関連の counter / histogram（webhook、queueing、session state、queue depth / wait）が含まれます
- traces / metrics は `traces` / `metrics` で切り替えられます（デフォルトは on）。traces には、モデル利用 span と、必要に応じて webhook / message 処理 span が含まれます
- collector 側で認証が必要な場合は `headers` を設定してください
- サポートする環境変数は `OTEL_EXPORTER_OTLP_ENDPOINT`、`OTEL_SERVICE_NAME`、`OTEL_EXPORTER_OTLP_PROTOCOL` です

### エクスポートされる metrics（名前と型）

モデル使用:

- `openclaw.tokens`（counter、attrs: `openclaw.token`、`openclaw.channel`、`openclaw.provider`、`openclaw.model`）
- `openclaw.cost.usd`（counter、attrs: `openclaw.channel`、`openclaw.provider`、`openclaw.model`）
- `openclaw.run.duration_ms`（histogram、attrs: `openclaw.channel`、`openclaw.provider`、`openclaw.model`）
- `openclaw.context.tokens`（histogram、attrs: `openclaw.context`、`openclaw.channel`、`openclaw.provider`、`openclaw.model`）

メッセージフロー:

- `openclaw.webhook.received`（counter、attrs: `openclaw.channel`、`openclaw.webhook`）
- `openclaw.webhook.error`（counter、attrs: `openclaw.channel`、`openclaw.webhook`）
- `openclaw.webhook.duration_ms`（histogram、attrs: `openclaw.channel`、`openclaw.webhook`）
- `openclaw.message.queued`（counter、attrs: `openclaw.channel`、`openclaw.source`）
- `openclaw.message.processed`（counter、attrs: `openclaw.channel`、`openclaw.outcome`）
- `openclaw.message.duration_ms`（histogram、attrs: `openclaw.channel`、`openclaw.outcome`）

キューとセッション:

- `openclaw.queue.lane.enqueue`（counter、attrs: `openclaw.lane`）
- `openclaw.queue.lane.dequeue`（counter、attrs: `openclaw.lane`）
- `openclaw.queue.depth`（histogram、attrs: `openclaw.lane` または `openclaw.channel=heartbeat`）
- `openclaw.queue.wait_ms`（histogram、attrs: `openclaw.lane`）
- `openclaw.session.state`（counter、attrs: `openclaw.state`、`openclaw.reason`）
- `openclaw.session.stuck`（counter、attrs: `openclaw.state`）
- `openclaw.session.stuck_age_ms`（histogram、attrs: `openclaw.state`）
- `openclaw.run.attempt`（counter、attrs: `openclaw.attempt`）

### エクスポートされる span（名前と主要属性）

- `openclaw.model.usage`
  - `openclaw.channel`、`openclaw.provider`、`openclaw.model`
  - `openclaw.sessionKey`、`openclaw.sessionId`
  - `openclaw.tokens.*`（input / output / cache_read / cache_write / total）
- `openclaw.webhook.processed`
  - `openclaw.channel`、`openclaw.webhook`、`openclaw.chatId`
- `openclaw.webhook.error`
  - `openclaw.channel`、`openclaw.webhook`、`openclaw.chatId`、`openclaw.error`
- `openclaw.message.processed`
  - `openclaw.channel`、`openclaw.outcome`、`openclaw.chatId`
  - `openclaw.messageId`、`openclaw.sessionKey`、`openclaw.sessionId`、`openclaw.reason`
- `openclaw.session.stuck`
  - `openclaw.state`、`openclaw.ageMs`、`openclaw.queueDepth`
  - `openclaw.sessionKey`、`openclaw.sessionId`

### サンプリングと flush

- trace sampling: `diagnostics.otel.sampleRate`（0.0〜1.0、root span のみ）
- metrics export 間隔: `diagnostics.otel.flushIntervalMs`（最小 1000ms）

### protocol に関する注記

- OTLP/HTTP endpoint は `diagnostics.otel.endpoint` または `OTEL_EXPORTER_OTLP_ENDPOINT` で設定できます
- endpoint にすでに `/v1/traces` または `/v1/metrics` が含まれている場合は、そのまま利用されます
- endpoint にすでに `/v1/logs` が含まれている場合は、ログ用にもそのまま利用されます
- `diagnostics.otel.logs` を有効にすると、メイン logger 出力を OTLP logs として export します

### ログエクスポートの挙動

- OTLP logs では、`logging.file` に書き込まれるのと同じ構造化レコードを使います
- `logging.level`（ファイルログレベル）に従います。コンソール向けのマスキングは **OTLP logs には適用されません**
- 高トラフィック環境では、OTLP collector 側での sampling / filtering を優先してください

## トラブルシューティングのヒント

- **ゲートウェイに接続できない場合**: まず `openclaw doctor` を実行してください
- **ログが空の場合**: ゲートウェイが起動しており、`logging.file` で指定されたパスへ書き込んでいるか確認してください
- **さらに詳細が必要な場合**: `logging.level` を `debug` または `trace` に上げて再試行してください
