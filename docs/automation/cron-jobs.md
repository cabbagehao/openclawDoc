---
summary: "ゲートウェイスケジューラ向けの cron ジョブとウェイクアップ"
read_when:
  - バックグラウンドジョブやウェイクアップをスケジュールする場合
  - heartbeat と一緒に、または heartbeat に合わせて動く自動化を構成する場合
  - スケジュールされたタスクで heartbeat と cron のどちらを使うか判断する場合
title: "cron ジョブ"
x-i18n:
  source_path: "automation/cron-jobs.md"
  source_hash: "20423a485cbc31977665d70e8d31937cbf99b9cb387741ee11b64cb88399691b"
  provider: "anthropic"
  model: "claude-opus-4-6"
  workflow: 1
  generated_at: "2026-03-10T05:54:25.000Z"
---
> **cron と heartbeat はどう使い分けるべきですか？** 判断の目安は [Cron vs Heartbeat](/automation/cron-vs-heartbeat) を参照してください。

cron はゲートウェイに組み込まれたスケジューラです。ジョブを永続化し、適切なタイミングでエージェントを起動し、必要に応じて出力をチャットへ返せます。

「毎朝これを実行したい」や「20 分後にエージェントを起こしたい」といった用途では、cron を使います。

トラブルシューティング: [/automation/troubleshooting](/automation/troubleshooting)

## 要点

- cron は **ゲートウェイ内** で実行されます（モデル内ではありません）。
- ジョブは `~/.openclaw/cron/` 以下に保存されるため、再起動してもスケジュールは失われません。
- 実行スタイルは 2 種類あります:
  - **Main session**: システムイベントをキューに入れ、次の heartbeat で実行します。
  - **Isolated**: `cron:<jobId>` で専用のエージェントターンを実行し、delivery を適用します（既定は `announce`、または `none`）。
- ウェイクアップは第一級の機能です。ジョブごとに「今すぐ起こす」か「次の heartbeat で実行する」かを選べます。
- webhook 投稿はジョブ単位で `delivery.mode = "webhook"` と `delivery.to = "<url>"` を使って設定します。
- `cron.webhook` が設定されている場合は、保存済みの `notify: true` ジョブ向けの従来フォールバックも残っています。これらのジョブは `webhook` delivery mode へ移行してください。
- アップグレード時は、スケジューラが cron ストアに触れる前に `openclaw doctor --fix` で従来形式の項目を正規化できます。

## クイックスタート（そのまま試せる例）

ワンショットのリマインダーを作成し、存在を確認して、すぐに実行します。

```bash
openclaw cron add \
  --name "Reminder" \
  --at "2026-02-01T16:00:00Z" \
  --session main \
  --system-event "Reminder: check the cron docs draft" \
  --wake now \
  --delete-after-run

openclaw cron list
openclaw cron run <job-id>
openclaw cron runs --id <job-id>
```

delivery 付きの定期 isolated ジョブをスケジュールする例:

```bash
openclaw cron add \
  --name "Morning brief" \
  --cron "0 7 * * *" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "Summarize overnight updates." \
  --announce \
  --channel slack \
  --to "channel:C1234567890"
```

## ツール呼び出しでの対応形式（ゲートウェイの cron ツール）

正規の JSON 形式と例は [ツール呼び出し用 JSON schema](/automation/cron-jobs#json-schema-for-tool-calls) を参照してください。

## cron ジョブの保存場所

cron ジョブは既定でゲートウェイホストの `~/.openclaw/cron/jobs.json` に永続化されます。ゲートウェイはこのファイルをメモリに読み込み、変更時に書き戻すため、手動編集が安全なのはゲートウェイ停止中だけです。変更には `openclaw cron add/edit` または cron tool call API を使うことを推奨します。

## 初心者向けの概要

cron ジョブは、**いつ実行するか** と **何をするか** の組み合わせだと考えると分かりやすくなります。

1. **スケジュールを選ぶ**
   - ワンショットのリマインダー → `schedule.kind = "at"`（CLI: `--at`）
   - 定期ジョブ → `schedule.kind = "every"` または `schedule.kind = "cron"`
- ISO タイムスタンプにタイムゾーンがない場合は、**UTC** として扱われます。

2. **どこで実行するかを選ぶ**
   - `sessionTarget: "main"` → 次の heartbeat 中に main コンテキストで実行します。
   - `sessionTarget: "isolated"` → `cron:<jobId>` で専用のエージェントターンを実行します。

3. **ペイロードを選ぶ**
   - Main session → `payload.kind = "systemEvent"`
   - Isolated session → `payload.kind = "agentTurn"`

補足: ワンショットジョブ（`schedule.kind = "at"`）は、既定で成功後に削除されます。保持したい場合は `deleteAfterRun: false` を設定してください（成功後は無効化されます）。

## 概念

### ジョブ

cron ジョブは、次の情報を持つ保存済みレコードです。

- **schedule**（いつ実行するか）
- **payload**（何をするか）
- オプションの **delivery mode**（`announce`、`webhook`、`none`）
- オプションの **agent binding**（`agentId`）: 特定のエージェントでジョブを実行します。指定がない、または不明な場合は、ゲートウェイが既定のエージェントにフォールバックします。

ジョブは安定した `jobId` で識別されます（CLI / ゲートウェイ API で使用）。
エージェントの tool call では `jobId` が正規で、互換性のために従来の `id` も受け付けます。
ワンショットジョブは既定で成功後に自動削除されます。保持したい場合は `deleteAfterRun: false` を設定してください。

### スケジュール

cron は 3 種類のスケジュール種別をサポートします。

- `at`: `schedule.at` で指定するワンショットのタイムスタンプ（ISO 8601）
- `every`: 固定間隔（ms）
- `cron`: オプションの IANA タイムゾーン付き 5 フィールド cron 式（秒を含む 6 フィールドも可）

cron 式には `croner` を使用します。タイムゾーンを省略した場合は、ゲートウェイホストのローカルタイムゾーンが使われます。

毎時ちょうどに多数のゲートウェイで負荷が集中するのを避けるため、OpenClaw は毎時開始の定期式（例: `0 * * * *`、`0 */2 * * *`）に対して、ジョブごとに決定論的な最大 5 分の stagger window を適用します。`0 7 * * *` のような固定時刻の式は正確な時刻のままです。

どの cron スケジュールでも、`schedule.staggerMs` で明示的な stagger window を設定できます（`0` なら正確な時刻を維持します）。CLI のショートカット:

- `--stagger 30s`（`1m`、`5m` でも可）で明示的な stagger window を設定
- `--exact` で `staggerMs = 0` を強制

### Main 実行と isolated 実行

#### Main session ジョブ（system events）

Main ジョブは system event をキューに入れ、必要に応じて heartbeat runner を起こします。これらのジョブは `payload.kind = "systemEvent"` を使う必要があります。

- `wakeMode: "now"`（既定）: event が即時の heartbeat 実行を引き起こします。
- `wakeMode: "next-heartbeat"`: event は次回のスケジュール済み heartbeat まで待機します。

通常の heartbeat prompt と main session コンテキストを使いたい場合に最も適しています。[Heartbeat](/gateway/heartbeat) を参照してください。

#### Isolated ジョブ（専用の cron セッション）

Isolated ジョブはセッション `cron:<jobId>` で専用のエージェントターンを実行します。

主な挙動:

- プロンプトには追跡しやすいように `[cron:<jobId> <job name>]` が付きます。
- 各実行は **新しい session id** で始まります（過去の会話は引き継がれません）。
- 既定の挙動: `delivery` を省略した場合、isolated ジョブは要約を `announce` します（`delivery.mode = "announce"`）。
- `delivery.mode` で動作を選びます:
  - `announce`: 対象チャンネルに要約を配信し、main session にも短い要約を投稿します。
  - `webhook`: finished event に summary が含まれる場合、`delivery.to` へ finished event payload を `POST` します。
  - `none`: 内部処理のみです（配信なし、main session 要約もなし）。
- `wakeMode` は main session 要約の投稿タイミングを制御します:
  - `now`: 即時 heartbeat
  - `next-heartbeat`: 次回のスケジュール済み heartbeat まで待機

メインのチャット履歴を汚したくない場合や、騒がしい処理、高頻度の処理、裏方作業には isolated ジョブを使ってください。

### ペイロードの形（何が実行されるか）

サポートされる payload の種類は 2 つです。

- `systemEvent`: main session 専用で、heartbeat prompt を通してルーティングされます。
- `agentTurn`: isolated session 専用で、専用のエージェントターンを実行します。

主な `agentTurn` フィールド:

- `message`: 必須のテキストプロンプト
- `model` / `thinking`: オプションの override（後述）
- `timeoutSeconds`: オプションのタイムアウト override
- `lightContext`: ワークスペース bootstrap file injection を必要としないジョブ向けの、オプションの軽量 bootstrap モード

delivery 設定:

- `delivery.mode`: `none` | `announce` | `webhook`
- `delivery.channel`: `last` または特定の channel
- `delivery.to`: channel 固有の target（`announce`）または webhook URL（`webhook` mode）
- `delivery.bestEffort`: announce delivery に失敗してもジョブを失敗扱いにしない

Announce delivery では、その実行中の messaging tool 送信が抑制されます。代わりに `delivery.channel` / `delivery.to` でチャットの宛先を指定してください。`delivery.mode = "none"` の場合、main session には要約は投稿されません。

Isolated ジョブで `delivery` を省略すると、OpenClaw は既定で `announce` を使います。

#### Announce delivery フロー

`delivery.mode = "announce"` の場合、cron は outbound channel adapter 経由で直接配信します。メインの agent を起動してメッセージを作成したり転送したりはしません。

挙動の詳細:

- コンテンツ: 配信には isolated run の outbound payload（テキスト / メディア）を使用し、通常の chunking と channel formatting が適用されます。
- heartbeat 専用の応答（`HEARTBEAT_OK` で実質的な内容がないもの）は配信されません。
- Isolated run がすでに同じ target へ message tool で送信していた場合、重複を避けるため delivery はスキップされます。
- Delivery target が欠落している、または無効な場合、`delivery.bestEffort = true` でない限りジョブは失敗します。
- `delivery.mode = "announce"` の場合のみ、短い要約が main session に投稿されます。
- Main session 要約は `wakeMode` に従います。`now` は即時 heartbeat をトリガーし、`next-heartbeat` は次回のスケジュール済み heartbeat まで待機します。

#### Webhook delivery フロー

`delivery.mode = "webhook"` の場合、finished event に summary が含まれると、cron は finished event payload を `delivery.to` へ `POST` します。

挙動の詳細:

- エンドポイントは有効な HTTP(S) URL である必要があります。
- webhook mode では channel delivery は試行されません。
- webhook mode では main session 要約は投稿されません。
- `cron.webhookToken` が設定されている場合、auth header は `Authorization: Bearer <cron.webhookToken>` になります。
- 非推奨のフォールバック: 保存済みの従来ジョブで `notify: true` のものは、警告付きで引き続き `cron.webhook` へ `POST` されます。`delivery.mode = "webhook"` へ移行してください。

### モデルと thinking の override

Isolated ジョブ（`agentTurn`）では、model と thinking level を override できます。

- `model`: Provider / model 文字列（例: `anthropic/claude-sonnet-4-20250514`）または alias（例: `opus`）
- `thinking`: Thinking level（`off`、`minimal`、`low`、`medium`、`high`、`xhigh`; GPT-5.2 + Codex モデルのみ）

補足: `model` は main session ジョブにも設定できますが、共有されている main session model が切り替わります。予期しないコンテキストの変化を避けるため、model override は isolated ジョブでのみ使うことを推奨します。

解決優先順位:

1. ジョブ payload の override（最優先）
2. Hook 固有の既定値（例: `hooks.gmail.model`）
3. Agent 設定の既定値

### 軽量 bootstrap context

Isolated ジョブ（`agentTurn`）では、`lightContext: true` を設定して軽量な bootstrap context で実行できます。

- ワークスペース bootstrap file injection を必要としない定期処理に使ってください。
- 実際には、組み込みランタイムが `bootstrapContextMode: "lightweight"` で実行されるため、cron の bootstrap context は意図的に空のままになります。
- CLI の対応: `openclaw cron add --light-context ...` と `openclaw cron edit --light-context`

### Delivery（channel + target）

Isolated ジョブは、トップレベルの `delivery` 設定を使って出力を channel へ配信できます。

- `delivery.mode`: `announce`（channel delivery）、`webhook`（HTTP POST）、または `none`
- `delivery.channel`: `whatsapp` / `telegram` / `discord` / `slack` / `mattermost`（plugin）/ `signal` / `imessage` / `last`
- `delivery.to`: channel 固有の recipient target

`announce` delivery は isolated ジョブ（`sessionTarget: "isolated"`）でのみ有効です。`webhook` delivery は main ジョブと isolated ジョブの両方で有効です。

`delivery.channel` または `delivery.to` を省略した場合、cron は main session の「last route」（エージェントが最後に返信した宛先）にフォールバックできます。

宛先形式の補足:

- Slack / Discord / Mattermost（plugin）の target は、曖昧さを避けるために `channel:<id>` や `user:<id>` のような明示的な prefix を使ってください。
- Telegram の topic は `:topic:` 形式を使ってください（詳細は後述）。

#### Telegram の delivery 宛先（topics / forum threads）

Telegram は `message_thread_id` によるフォーラムトピックをサポートしています。cron delivery では、`to` フィールドに topic / thread をエンコードできます。

- `-1001234567890`（chat id のみ）
- `-1001234567890:topic:123`（推奨: topic marker を明示）
- `-1001234567890:123`（短縮形: 数値 suffix）

`telegram:...` / `telegram:group:...` のような prefix 付き target も受け付けます。

- `telegram:group:-1001234567890:topic:123`

## ツール呼び出し用 JSON schema

ゲートウェイの `cron.*` ツールを直接呼び出すとき（agent tool calls または RPC）は、次の形式を使用してください。CLI フラグは `20m` のような人間向け duration を受け付けますが、tool calls では `schedule.at` に ISO 8601 文字列を、`schedule.everyMs` にはミリ秒を使ってください。

### cron.add params

ワンショットの main session ジョブ（system event）:

```json
{
  "name": "Reminder",
  "schedule": { "kind": "at", "at": "2026-02-01T16:00:00Z" },
  "sessionTarget": "main",
  "wakeMode": "now",
  "payload": { "kind": "systemEvent", "text": "Reminder text" },
  "deleteAfterRun": true
}
```

delivery 付きの定期 isolated ジョブ:

```json
{
  "name": "Morning brief",
  "schedule": { "kind": "cron", "expr": "0 7 * * *", "tz": "America/Los_Angeles" },
  "sessionTarget": "isolated",
  "wakeMode": "next-heartbeat",
  "payload": {
    "kind": "agentTurn",
    "message": "Summarize overnight updates.",
    "lightContext": true
  },
  "delivery": {
    "mode": "announce",
    "channel": "slack",
    "to": "channel:C1234567890",
    "bestEffort": true
  }
}
```

補足:

- `schedule.kind`: `at`（`at`）、`every`（`everyMs`）、または `cron`（`expr`、オプションで `tz`）
- `schedule.at` は ISO 8601 を受け付けます（タイムゾーンは省略可。省略時は UTC として扱われます）。
- `everyMs` はミリ秒です。
- `sessionTarget` は `"main"` または `"isolated"` である必要があり、`payload.kind` と一致していなければなりません。
- オプション項目: `agentId`、`description`、`enabled`、`deleteAfterRun`（`at` では既定で true）、`delivery`
- `wakeMode` は省略時に `"now"` が既定になります。

### cron.update params

```json
{
  "jobId": "job-123",
  "patch": {
    "enabled": false,
    "schedule": { "kind": "every", "everyMs": 3600000 }
  }
}
```

補足:

- `jobId` が正規で、互換性のために `id` も受け付けます。
- Agent binding を解除するには、patch で `agentId: null` を使用します。

### cron.runとcron.remove params

```json
{ "jobId": "job-123", "mode": "force" }
```

```json
{ "jobId": "job-123" }
```

## 保存場所と履歴

- ジョブストア: `~/.openclaw/cron/jobs.json`（ゲートウェイ管理の JSON）
- 実行履歴: `~/.openclaw/cron/runs/<jobId>.jsonl`（JSONL。サイズと行数に基づいて自動で prune されます）
- `sessions.json` 内の isolated cron run session は `cron.sessionRetention` で prune されます（既定は `24h`。無効にするには `false` を設定します）。
- ストアパスの上書き: 設定の `cron.store`

## リトライポリシー

ジョブが失敗すると、OpenClaw はエラーを **transient**（リトライ可能）と **permanent**（即時に無効化）に分類します。

### Transient error（リトライあり）

- レート制限（429、too many requests、resource exhausted）
- プロバイダー過負荷（例: Anthropic の `529 overloaded_error`、overload fallback summaries）
- ネットワークエラー（timeout、ECONNRESET、fetch failed、socket）
- サーバーエラー（5xx）
- Cloudflare 関連のエラー

### Permanent error（リトライなし）

- 認証失敗（無効な API key、unauthorized）
- 設定または validation エラー
- その他の non-transient error

### 既定の挙動（設定なし）

**ワンショットジョブ (`schedule.kind: "at"`):**

- Transient error 時: 指数バックオフ（30s → 1m → 5m）で最大 3 回までリトライします。
- Permanent error 時: 直ちに無効化します。
- 成功または skip 時: 無効化します（`deleteAfterRun: true` なら削除）。

**定期ジョブ (`cron` / `every`):**

- どのエラーでも: 次のスケジュール実行前に指数バックオフ（30s → 1m → 5m → 15m → 60m）を適用します。
- ジョブは有効のままで、次に成功するとバックオフはリセットされます。

これらの既定値を上書きするには `cron.retry` を設定してください（[Configuration](/automation/cron-jobs#configuration) を参照）。

## Configuration

```json5
{
  cron: {
    enabled: true, // default true
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 1, // default 1
    // Optional: override retry policy for one-shot jobs
    retry: {
      maxAttempts: 3,
      backoffMs: [60000, 120000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "server_error"],
    },
    webhook: "https://example.invalid/legacy", // deprecated fallback for stored notify:true jobs
    webhookToken: "replace-with-dedicated-webhook-token", // optional bearer token for webhook mode
    sessionRetention: "24h", // duration string or false
    runLog: {
      maxBytes: "2mb", // default 2_000_000 bytes
      keepLines: 2000, // default 2000
    },
  },
}
```

run-log pruning の挙動:

- `cron.runLog.maxBytes`: prune 前に許容される run-log ファイルの最大サイズ
- `cron.runLog.keepLines`: prune 時に保持する最新 N 行
- どちらも`cron/runs/<jobId>.jsonl`ファイルに適用されます。

webhook の挙動:

- 推奨: ジョブごとに `delivery.mode: "webhook"` と `delivery.to: "https://..."` を設定します。
- webhook URL は有効な `http://` または `https://` URL である必要があります。
- `POST` 時の payload は cron finished event の JSON です。
- `cron.webhookToken` が設定されている場合、auth header は `Authorization: Bearer <cron.webhookToken>` になります。
- `cron.webhookToken` が設定されていない場合、`Authorization` header は送信されません。
- 非推奨のフォールバック: 保存済みの従来ジョブで `notify: true` のものは、`cron.webhook` がある場合に引き続きそれを使用します。

cron を完全に無効化する方法:

- `cron.enabled: false` (config)
- `OPENCLAW_SKIP_CRON=1` (env)

## メンテナンス

cron には、isolated run session retention と run-log pruning という 2 つの組み込みメンテナンス経路があります。

### 既定値

- `cron.sessionRetention`: `24h`（run-session pruning を無効にするには `false` を設定）
- `cron.runLog.maxBytes`: `2_000_000` bytes
- `cron.runLog.keepLines`: `2000`

### 仕組み

- Isolated run は session entry（`...:cron:<jobId>:run:<uuid>`）と transcript file を作成します。
- reaper は `cron.sessionRetention` より古い期限切れの run-session entry を削除します。
- session store から参照されなくなった削除済み run session については、OpenClaw が transcript file をアーカイブし、同じ retention window に基づいて古い削除済みアーカイブを purge します。
- 各実行の追記後、`cron/runs/<jobId>.jsonl` はサイズチェックされます:
  - ファイルサイズが `runLog.maxBytes` を超えた場合、最新の `runLog.keepLines` 行だけを残すように trim されます。

### 高負荷なスケジューラでのパフォーマンス上の注意

高頻度の cron 構成では、run-session と run-log が大きく膨らむことがあります。メンテナンス機能は組み込まれていますが、制限を緩くしすぎると不要な I/O やクリーンアップ作業が増える可能性があります。

確認すべき点:

- isolated run が多い環境で `cron.sessionRetention` を長く設定している
- `cron.runLog.keepLines` が大きく、かつ `runLog.maxBytes` も大きい
- 同じ`cron/runs/<jobId>.jsonl`へ大量に書き込む、騒がしい定期ジョブが多い

対応方法:

- `cron.sessionRetention` は、デバッグや監査に必要な範囲でできるだけ短く保つ
- `runLog.maxBytes` と `runLog.keepLines` は適度な値にして、run log のサイズを制限する
- 不要なチャット送信を避ける delivery rule と組み合わせて、騒がしいバックグラウンドジョブは isolated mode へ移す
- `openclaw cron runs` で定期的に増加状況を確認し、ログが大きくなる前に retention を調整する

### カスタマイズ例

run session を 1 週間保持し、より大きい run log を許可する例:

```json5
{
  cron: {
    sessionRetention: "7d",
    runLog: {
      maxBytes: "10mb",
      keepLines: 5000,
    },
  },
}
```

isolated run-session pruning を無効にしつつ、run-log pruning は維持する例:

```json5
{
  cron: {
    sessionRetention: false,
    runLog: {
      maxBytes: "5mb",
      keepLines: 3000,
    },
  },
}
```

高頻度の cron 利用向けに調整する例:

```json5
{
  cron: {
    sessionRetention: "12h",
    runLog: {
      maxBytes: "3mb",
      keepLines: 1500,
    },
  },
}
```

## CLI クイックスタート

ワンショットのリマインダー（UTC の ISO、成功後に自動削除）:

```bash
openclaw cron add \
  --name "Send reminder" \
  --at "2026-01-12T18:00:00Z" \
  --session main \
  --system-event "Reminder: submit expense report." \
  --wake now \
  --delete-after-run
```

ワンショットのリマインダー（main session、すぐに wake）:

```bash
openclaw cron add \
  --name "Calendar check" \
  --at "20m" \
  --session main \
  --system-event "Next heartbeat: check calendar." \
  --wake now
```

定期 isolated ジョブ（WhatsApp へ announce）:

```bash
openclaw cron add \
  --name "Morning status" \
  --cron "0 7 * * *" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "Summarize inbox + calendar for today." \
  --announce \
  --channel whatsapp \
  --to "+15551234567"
```

明示的に 30 秒の stagger を設定した定期 cron ジョブ:

```bash
openclaw cron add \
  --name "Minute watcher" \
  --cron "0 * * * * *" \
  --tz "UTC" \
  --stagger 30s \
  --session isolated \
  --message "Run minute watcher checks." \
  --announce
```

定期 isolated ジョブ（Telegram の topic へ配信）:

```bash
openclaw cron add \
  --name "Nightly summary (topic)" \
  --cron "0 22 * * *" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "Summarize today; send to the nightly topic." \
  --announce \
  --channel telegram \
  --to "-1001234567890:topic:123"
```

model と thinking を override する isolated ジョブ:

```bash
openclaw cron add \
  --name "Deep analysis" \
  --cron "0 6 * * 1" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "Weekly deep analysis of project progress." \
  --model "opus" \
  --thinking high \
  --announce \
  --channel whatsapp \
  --to "+15551234567"
```

エージェント選択（マルチエージェント構成）:

```bash
# Pin a job to agent "ops" (falls back to default if that agent is missing)
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops

# Switch or clear the agent on an existing job
openclaw cron edit <jobId> --agent ops
openclaw cron edit <jobId> --clear-agent
```

手動実行（`force` が既定。期限が来ているときだけ実行するには `--due` を使用）:

```bash
openclaw cron run <jobId>
openclaw cron run <jobId> --due
```

`cron.run` は現在、ジョブ完了後ではなく、手動実行がキューに入った時点で確認応答を返します。キュー投入成功時の応答は `{ ok: true, enqueued: true, runId }` のようになります。ジョブがすでに実行中の場合や、`--due` で期限到来ジョブがなかった場合の応答は、引き続き `{ ok: true, ran: false, reason }` です。最終的な完了エントリは `openclaw cron runs --id <jobId>` または `cron.runs` gateway method で確認してください。

既存ジョブを編集する（項目を patch）:

```bash
openclaw cron edit <jobId> \
  --message "Updated prompt" \
  --model "opus" \
  --thinking low
```

既存の cron ジョブをスケジュールどおりに正確に実行する（stagger なし）:

```bash
openclaw cron edit <jobId> --exact
```

実行履歴:

```bash
openclaw cron runs --id <jobId> --limit 50
```

ジョブを作成せずに即時 system event を送る:

```bash
openclaw system event --mode now --text "Next heartbeat: check battery."
```

## ゲートウェイ API

- `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`
- `cron.run`（force または due）, `cron.runs`
  ジョブを作らずに即時 system event を送るには [`openclaw system event`](/cli/system) を使ってください。

## トラブルシューティング

### 「何も実行されない」

- cron が有効か確認してください: `cron.enabled` と `OPENCLAW_SKIP_CRON`
- ゲートウェイが継続的に実行されているか確認してください（cron はゲートウェイ process 内で動作します）。
- `cron` スケジュールでは、タイムゾーン（`--tz`）とホストのタイムゾーンが合っているか確認してください。

### 定期ジョブが失敗後ずっと遅延し続ける

- OpenClaw は定期ジョブで連続エラーが起きると、指数リトライバックオフを適用します:
  30s、1m、5m、15m、その後は60m間隔でリトライします。
- 次に成功するとバックオフは自動的にリセットされます。
- ワンショット（`at`）ジョブは、transient error（rate limit、overloaded、network、server_error）をバックオフ付きで最大 3 回までリトライします。permanent error は即座に無効化されます。詳しくは [Retry policy](/automation/cron-jobs#retry-policy) を参照してください。

### Telegramが違う場所に配信される

- フォーラムトピックでは、明示的で曖昧さのない `-100…:topic:<id>` を使ってください。
- ログや保存済みの「last route」target に `telegram:...` prefix が見えても正常です。cron delivery はこれらを受け付け、topic ID も正しく解析します。

### Subagent の announce delivery がリトライされる

- subagent run が完了すると、ゲートウェイは結果を requester session へ announce します。
- announce フローが `false` を返した場合（例: requester session が busy）、ゲートウェイは `announceRetryCount` で追跡しつつ最大 3 回までリトライします。
- `endedAt` から 5 分を過ぎた announce は、古い entry が無限ループしないよう強制的に期限切れ扱いになります。
- ログで announce delivery の繰り返しが見える場合は、subagent registry 内で `announceRetryCount` が大きい entry を確認してください。
