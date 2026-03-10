---
summary: "ログの概要: ファイル ログ、コンソール出力、CLI テーリング、およびコントロール UI"
read_when:
  - 初心者向けのロギングの概要が必要です
  - ログレベルまたはフォーマットを設定したい
  - トラブルシューティングを行っており、ログをすぐに見つける必要がある
title: "ロギング"
x-i18n:
  source_hash: "11907b8364e374c6eb1f157f380c2c14aced3053ef28c0f90e732ab475c21f93"
---

# ロギング

OpenClaw のログは 2 か所にあります。

- **ファイル ログ** (JSON 行) ゲートウェイによって書き込まれます。
- **コンソール出力**は端末とコントロール UI に表示されます。

このページでは、ログの保存場所、ログの読み取り方法、ログの構成方法について説明します。
レベルとフォーマット。

## ログが存在する場所

デフォルトでは、ゲートウェイはローリング ログ ファイルを次の場所に書き込みます。

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

日付にはゲートウェイ ホストのローカル タイムゾーンが使用されます。

これは `~/.openclaw/openclaw.json` でオーバーライドできます。

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## ログの見方

### CLI: ライブテール (推奨)

CLI を使用して、RPC 経由でゲートウェイ ログ ファイルを追跡します。

```bash
openclaw logs --follow
```

出力モード:

- **TTY セッション**: 美しく、色分けされ、構造化されたログ行。
- **非 TTY セッション**: プレーン テキスト。
- `--json`: 行区切りの JSON (1 行に 1 つのログ イベント)。
- `--plain`: TTY セッションでプレーン テキストを強制します。
- `--no-color`: ANSI カラーを無効にします。

JSON モードでは、CLI は `type` タグ付きオブジェクトを出力します。

- `meta`: ストリームのメタデータ (ファイル、カーソル、サイズ)
- `log`: 解析されたログ エントリ
- `notice`: 切り捨て/回転のヒント
- `raw`: 未解析のログ行

ゲートウェイに到達できない場合、CLI は実行するための短いヒントを出力します。

```bash
openclaw doctor
```

### コントロール UI (Web)

コントロール UI の **ログ** タブは、`logs.tail` を使用して同じファイルを追跡します。
開く方法については、[/web/control-ui](/web/control-ui) を参照してください。

### チャネルのみのログチャネルアクティビティ (WhatsApp/Telegram/など) をフィルタリングするには、次を使用します

```bash
openclaw channels logs --channel whatsapp
```

## ログ形式

### ファイルログ (JSONL)

ログ ファイルの各行は JSON オブジェクトです。 CLI とコントロール UI はこれらを解析します。
構造化された出力 (時間、レベル、サブシステム、メッセージ) をレンダリングするためのエントリ。

### コンソール出力

コンソール ログは **TTY 対応**で、読みやすいようにフォーマットされています。

- サブシステムのプレフィックス (例: `gateway/channels/whatsapp`)
- レベルの色付け (情報/警告/エラー)
- オプションのコンパクトまたは JSON モード

コンソールのフォーマットは `logging.consoleStyle` によって制御されます。

## ロギングの構成

すべてのロギング設定は、`~/.openclaw/openclaw.json` の `logging` の下に存在します。

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

- `logging.level`: **ファイル ログ** (JSONL) レベル。
- `logging.consoleLevel`: **コンソール**の冗長レベル。

**`OPENCLAW_LOG_LEVEL`** 環境変数 (例: `OPENCLAW_LOG_LEVEL=debug`) を介して両方をオーバーライドできます。環境変数は構成ファイルよりも優先されるため、`openclaw.json` を編集せずに 1 回の実行の詳細度を上げることができます。グローバル CLI オプション **`--log-level <level>`** (`openclaw --log-level debug gateway run` など) を渡すこともできます。これにより、そのコマンドの環境変数がオーバーライドされます。

`--verbose` はコンソール出力にのみ影響します。ファイルのログ レベルは変更されません。

### コンソールのスタイル

`logging.consoleStyle`:- `pretty`: 人間に優しい、色付き、タイムスタンプ付き。

- `compact`: よりタイトな出力 (長時間のセッションに最適)。
- `json`: 行ごとの JSON (ログ プロセッサ用)。

### 編集

ツールの概要により、機密トークンがコンソールに表示される前に編集できます。

- `logging.redactSensitive`: `off` | `tools` (デフォルト: `tools`)
- `logging.redactPatterns`: デフォルトのセットをオーバーライドする正規表現文字列のリスト

編集は **コンソール出力のみ**に影響し、ファイル ログは変更されません。

## 診断 + OpenTelemetry

診断は、モデルの実行に関する構造化された機械可読イベントです**および**
メッセージ フロー テレメトリ (Webhook、キューイング、セッション状態)。彼らは**しません**
ログを置き換えます。これらは、メトリクス、トレース、およびその他のエクスポーターをフィードするために存在します。

診断イベントはプロセス内で発行されますが、エクスポーターは次の場合にのみアタッチします。
診断 + エクスポーター プラグインが有効になっています。

### OpenTelemetry と OTLP の比較

- **OpenTelemetry (OTel)**: トレース、メトリクス、ログ用のデータ モデル + SDK。
- **OTLP**: OTel データをコレクタ/バックエンドにエクスポートするために使用されるワイヤ プロトコル。
- 現在、OpenClaw は **OTLP/HTTP (protobuf)** 経由でエクスポートします。

### エクスポートされた信号- **メトリクス**: カウンター + ヒストグラム (トークン使用量、メッセージ フロー、キューイング)

- **トレース**: モデルの使用 + Webhook/メッセージ処理の範囲。
- **ログ**: `diagnostics.otel.logs` が有効な場合、OTLP 経由でエクスポートされます。ログ
  音量が大きくなる可能性があります。 `logging.level` とエクスポーター フィルターに留意してください。

### 診断イベント カタログ

モデルの使用法:

- `model.usage`: トークン、コスト、期間、コンテキスト、プロバイダー/モデル/チャネル、セッション ID。

メッセージの流れ:

- `webhook.received`: チャネルごとの Webhook 受信数。
- `webhook.processed`: Webhook 処理 + 期間。
- `webhook.error`: Webhook ハンドラー エラー。
- `message.queued`: メッセージが処理のためにキューに入れられました。
- `message.processed`: 結果 + 期間 + オプションのエラー。

キュー + セッション:

- `queue.lane.enqueue`: コマンド キュー レーンのエンキュー + 深さ。
- `queue.lane.dequeue`: コマンド キュー レーンのデキュー + 待機時間。
- `session.state`: セッション状態の遷移 + 理由。
- `session.stuck`: セッションスタック警告 + 経過時間。
- `run.attempt`: メタデータの再試行/試行を実行します。
- `diagnostic.heartbeat`: 集計カウンター (Webhook/キュー/セッション)。

### 診断を有効にする (エクスポーターなし)

プラグインまたはカスタム シンクで診断イベントを利用できるようにする場合は、これを使用します。

```json
{
  "diagnostics": {
    "enabled": true
  }
}
```

### 診断フラグ (対象となるログ)

フラグを使用して、`logging.level` を発生させずに、対象を絞った追加のデバッグ ログを有効にします。
フラグは大文字と小文字を区別せず、ワイルドカードをサポートします (例: `telegram.*` または `*`)。

```json
{
"diagnostics": {
"flags": ["telegram.http"]
}
}

```

環境オーバーライド (1 回限り):

```

OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload

````

注:

- フラグ ログは標準ログ ファイル (`logging.file` と同じ) に保存されます。
- 出力は `logging.redactSensitive` に従って編集されています。
- 完全ガイド: [/diagnostics/flags](/diagnostics/flags)。

### OpenTelemetry へのエクスポート

診断は、`diagnostics-otel` プラグイン (OTLP/HTTP) 経由でエクスポートできます。これ
OTLP/HTTP を受け入れる任意の OpenTelemetry コレクター/バックエンドで動作します。

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
````

注:

- `openclaw plugins enable diagnostics-otel` を使用してプラグインを有効にすることもできます。
- `protocol` は現在、`http/protobuf` のみをサポートしています。 `grpc` は無視されます。
- メトリクスには、トークン使用量、コスト、コンテキスト サイズ、実行期間、メッセージ フローが含まれます。
  カウンター/ヒストグラム (Webhook、キューイング、セッション状態、キューの深さ/待機)。
- トレース/メトリクスは `traces` / `metrics` で切り替えることができます (デフォルト: オン)。痕跡
  モデルの使用スパンと、有効になっている場合の Webhook/メッセージ処理スパンが含まれます。
- コレクターが認証を必要とする場合は、`headers` を設定します。
- サポートされている環境変数: `OTEL_EXPORTER_OTLP_ENDPOINT`、
  `OTEL_SERVICE_NAME`、`OTEL_EXPORTER_OTLP_PROTOCOL`。

### エクスポートされたメトリクス (名前 + タイプ)

モデルの使用法:- `openclaw.tokens` (カウンタ、属性: `openclaw.token`、`openclaw.channel`、
`openclaw.provider`、`openclaw.model`)

- `openclaw.cost.usd` (カウンター、属性: `openclaw.channel`、`openclaw.provider`、
  `openclaw.model`)
- `openclaw.run.duration_ms` (ヒストグラム、属性: `openclaw.channel`、
  `openclaw.provider`、`openclaw.model`)
- `openclaw.context.tokens` (ヒストグラム、属性: `openclaw.context`、
  `openclaw.channel`、`openclaw.provider`、`openclaw.model`)

メッセージの流れ:

- `openclaw.webhook.received` (カウンタ、属性: `openclaw.channel`、
  `openclaw.webhook`)
- `openclaw.webhook.error` (カウンター、属性: `openclaw.channel`、
  `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (ヒストグラム、属性: `openclaw.channel`、
  `openclaw.webhook`)
- `openclaw.message.queued` (カウンタ、属性: `openclaw.channel`、
  `openclaw.source`)
- `openclaw.message.processed` (カウンタ、属性: `openclaw.channel`、
  `openclaw.outcome`)
- `openclaw.message.duration_ms` (ヒストグラム、属性: `openclaw.channel`、
  `openclaw.outcome`)

キュー + セッション:

- `openclaw.queue.lane.enqueue` (カウンター、属性: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (カウンター、属性: `openclaw.lane`)
- `openclaw.queue.depth` (ヒストグラム、属性: `openclaw.lane` または
  `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (ヒストグラム、属性: `openclaw.lane`)
- `openclaw.session.state` (カウンター、属性: `openclaw.state`、`openclaw.reason`)
- `openclaw.session.stuck` (カウンター、属性: `openclaw.state`)
- `openclaw.session.stuck_age_ms` (ヒストグラム、属性: `openclaw.state`)
- `openclaw.run.attempt` (カウンター、属性: `openclaw.attempt`)### エクスポートされたスパン (名前 + キー属性)

- `openclaw.model.usage`
  - `openclaw.channel`、`openclaw.provider`、`openclaw.model`
  - `openclaw.sessionKey`、`openclaw.sessionId`
  - `openclaw.tokens.*` (入力/出力/キャッシュ読み取り/キャッシュ書き込み/合計)
- `openclaw.webhook.processed`
  - `openclaw.channel`、`openclaw.webhook`、`openclaw.chatId`
- `openclaw.webhook.error`
  - `openclaw.channel`、`openclaw.webhook`、`openclaw.chatId`、
    `openclaw.error`
- `openclaw.message.processed`
  - `openclaw.channel`、`openclaw.outcome`、`openclaw.chatId`、
    `openclaw.messageId`、`openclaw.sessionKey`、`openclaw.sessionId`、
    `openclaw.reason`
- `openclaw.session.stuck`
  - `openclaw.state`、`openclaw.ageMs`、`openclaw.queueDepth`、
    `openclaw.sessionKey`、`openclaw.sessionId`

### サンプリング + フラッシング

- トレース サンプリング: `diagnostics.otel.sampleRate` (0.0 ～ 1.0、ルート スパンのみ)。
- メトリクスのエクスポート間隔: `diagnostics.otel.flushIntervalMs` (最小 1000 ミリ秒)。

### プロトコルに関する注意事項

- OTLP/HTTP エンドポイントは `diagnostics.otel.endpoint` または
  `OTEL_EXPORTER_OTLP_ENDPOINT`。
- エンドポイントにすでに `/v1/traces` または `/v1/metrics` が含まれている場合は、そのまま使用されます。
- エンドポイントにすでに `/v1/logs` が含まれている場合は、それがそのままログに使用されます。
- `diagnostics.otel.logs` は、メイン ロガー出力の OTLP ログ エクスポートを有効にします。

### ログのエクスポート動作- OTLP ログは、`logging.file` に書き込まれたものと同じ構造化レコードを使用します

- `logging.level` (ファイル ログ レベル) を尊重します。コンソールの編集は**適用されません**
  OTLP ログに保存されます。
- 大容量インストールでは、OTLP コレクターのサンプリング/フィルタリングを優先する必要があります。

## トラブルシューティングのヒント

- **ゲートウェイに到達できませんか?** 最初に `openclaw doctor` を実行してください。
- **ログが空ですか?** ゲートウェイが実行中であり、ファイル パスに書き込んでいることを確認してください。
  `logging.file` で。
- **さらに詳細が必要ですか?** `logging.level` を `debug` または `trace` に設定して、再試行してください。
