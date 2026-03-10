---
summary: "Gatewayスケジューラ向けのCronジョブとウェイクアップ"
read_when:
  - バックグラウンドジョブやウェイクアップをスケジュールする場合
  - Heartbeatと一緒に、またはHeartbeatに合わせて動く自動化を構成する場合
  - スケジュールされたタスクでHeartbeatとcronのどちらを使うか判断する場合
title: "Cronジョブ"
x-i18n:
  source_path: "automation/cron-jobs.md"
  source_hash: "20423a485cbc31977665d70e8d31937cbf99b9cb387741ee11b64cb88399691b"
  provider: "anthropic"
  model: "claude-opus-4-6"
  workflow: 1
  generated_at: "2026-03-10T05:54:25.000Z"
---

# Cronジョブ (Gatewayスケジューラ)

> **CronとHeartbeatの使い分けは?** どちらを使うべきかの判断は[Cron vs Heartbeat](/automation/cron-vs-heartbeat)を参照してください。

CronはGatewayに組み込まれたスケジューラです。ジョブを永続化し、適切なタイミングでエージェントを起動し、必要に応じて出力をチャットへ返せます。

「毎朝これを実行したい」や「20分後にエージェントを起こしたい」といった用途では、cronがその仕組みです。

トラブルシューティング: [/automation/troubleshooting](/automation/troubleshooting)

## 要点

- Cronは**Gateway内**で実行されます(モデル内ではありません)。
- ジョブは`~/.openclaw/cron/`以下に保存されるため、再起動してもスケジュールは失われません。
- 実行スタイルは2種類あります:
  - **Main session**: システムイベントをキューに入れ、次のHeartbeatで実行します。
  - **Isolated**: `cron:<jobId>`で専用のエージェントターンを実行し、deliveryを適用します(既定はannounce、またはnone)。
- ウェイクアップは第一級機能です。ジョブごとに「今すぐ起こす」か「次のHeartbeatで実行する」かを選べます。
- Webhook投稿はジョブ単位で`delivery.mode = "webhook"`と`delivery.to = "<url>"`を使って設定します。
- `cron.webhook`が設定されている場合は、保存済みの`notify: true`ジョブ向けの従来フォールバックも残っています。これらのジョブはwebhook delivery modeへ移行してください。
- アップグレード時は、スケジューラがcronストアに触れる前に`openclaw doctor --fix`で従来のcronストア項目を正規化できます。

## クイックスタート (そのまま試せる例)

ワンショットのリマインダーを作成し、存在を確認して、すぐに実行します:

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

delivery付きの定期isolatedジョブをスケジュールします:

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

## ツール呼び出しでの対応形式 (Gateway cron tool)

正規のJSON形式と例は[ツール呼び出し用JSON schema](/automation/cron-jobs#json-schema-for-tool-calls)を参照してください。

## Cronジョブの保存場所

Cronジョブは既定でGatewayホストの`~/.openclaw/cron/jobs.json`に永続化されます。Gatewayはこのファイルをメモリに読み込み、変更時に書き戻すため、手動編集が安全なのはGateway停止中だけです。変更には`openclaw cron add/edit`またはcron tool call APIを使うことを推奨します。

## 初心者向けの概要

Cronジョブは、**いつ実行するか** + **何をするか**の組み合わせだと考えると分かりやすいです。

1. **スケジュールを選ぶ**
   - ワンショットのリマインダー → `schedule.kind = "at"` (CLI: `--at`)
   - 定期ジョブ → `schedule.kind = "every"`または`schedule.kind = "cron"`
   - ISOタイムスタンプにタイムゾーンがない場合は、**UTC**として扱われます。

2. **どこで実行するかを選ぶ**
   - `sessionTarget: "main"` → 次のHeartbeat中にmainコンテキストで実行します。
   - `sessionTarget: "isolated"` → `cron:<jobId>`で専用のエージェントターンを実行します。

3. **ペイロードを選ぶ**
   - Main session → `payload.kind = "systemEvent"`
   - Isolated session → `payload.kind = "agentTurn"`

補足: ワンショットジョブ(`schedule.kind = "at"`)は、既定で成功後に削除されます。保持したい場合は`deleteAfterRun: false`を設定してください(成功後は無効化されます)。

## 概念

### ジョブ

Cronジョブは、次の情報を持つ保存済みレコードです。

- **schedule**(いつ実行するか)
- **payload**(何をするか)
- オプションの**delivery mode**(`announce`、`webhook`、`none`)
- オプションの**agent binding**(`agentId`): 特定のエージェントでジョブを実行します。指定がない、または不明な場合は、Gatewayが既定のエージェントにフォールバックします。

ジョブは安定した`jobId`で識別されます(CLI/Gateway APIで使用)。
エージェントのtool callでは`jobId`が正規で、互換性のために従来の`id`も受け付けます。
ワンショットジョブは既定で成功後に自動削除されます。保持したい場合は`deleteAfterRun: false`を設定してください。

### スケジュール

Cronは3種類のスケジュール種別をサポートします。

- `at`: `schedule.at`で指定するワンショットのタイムスタンプ(ISO 8601)
- `every`: 固定間隔(ms)
- `cron`: オプションのIANAタイムゾーン付き5フィールドcron式(秒を含む6フィールドも可)

Cron式には`croner`を使用します。タイムゾーンを省略した場合は、Gatewayホストのローカルタイムゾーンが使われます。

毎時ちょうどに多数のGatewayで負荷が集中するのを避けるため、OpenClawは毎時開始の定期式(例: `0 * * * *`、`0 */2 * * *`)に対して、ジョブごとに決定論的な最大5分のstagger windowを適用します。`0 7 * * *`のような固定時刻の式は正確な時刻のままです。

どのcronスケジュールでも、`schedule.staggerMs`で明示的なstagger windowを設定できます(`0`なら正確な時刻を維持します)。CLIのショートカット:

- `--stagger 30s` (`1m`、`5m`でも可)で明示的なstagger windowを設定
- `--exact`で`staggerMs = 0`を強制

### Main実行とisolated実行

#### Main sessionジョブ (system events)

Mainジョブはsystem eventをキューに入れ、必要に応じてheartbeat runnerを起こします。これらのジョブは`payload.kind = "systemEvent"`を使う必要があります。

- `wakeMode: "now"` (既定): eventが即時のHeartbeat実行を引き起こします。
- `wakeMode: "next-heartbeat"`: eventは次回のスケジュール済みHeartbeatまで待機します。

通常のheartbeat promptとmain sessionコンテキストを使いたい場合に最も適しています。[Heartbeat](/gateway/heartbeat)を参照してください。

#### Isolatedジョブ (専用のcronセッション)

Isolatedジョブはセッション`cron:<jobId>`で専用のエージェントターンを実行します。

主な挙動:

- プロンプトには追跡しやすいように`[cron:<jobId> <job name>]`が付きます。
- 各実行は**新しいsession id**で始まります(過去の会話は引き継がれません)。
- 既定の挙動: `delivery`を省略した場合、isolatedジョブは要約をannounceします(`delivery.mode = "announce"`)。
- `delivery.mode`で動作を選びます:
  - `announce`: 対象チャンネルに要約を配信し、main sessionにも短い要約を投稿します。
  - `webhook`: finished eventにsummaryが含まれる場合、`delivery.to`へfinished event payloadをPOSTします。
  - `none`: 内部処理のみです(配信なし、main session要約もなし)。
- `wakeMode`はmain session要約の投稿タイミングを制御します:
  - `now`: 即時Heartbeat
  - `next-heartbeat`: 次回のスケジュール済みHeartbeatまで待機

メインのチャット履歴を汚したくない、騒がしい処理や高頻度の処理、「裏方作業」向けにはisolatedジョブを使ってください。

### ペイロードの形 (何が実行されるか)

サポートされるpayloadの種類は2つです。

- `systemEvent`: main session専用で、heartbeat promptを通してルーティングされます。
- `agentTurn`: isolated session専用で、専用のエージェントターンを実行します。

主な`agentTurn`フィールド:

- `message`: 必須のテキストプロンプト
- `model` / `thinking`: オプションのoverride(後述)
- `timeoutSeconds`: オプションのタイムアウトoverride
- `lightContext`: ワークスペースbootstrap file injectionを必要としないジョブ向けの、オプションの軽量bootstrapモード

delivery設定:

- `delivery.mode`: `none` | `announce` | `webhook`
- `delivery.channel`: `last`または特定のchannel
- `delivery.to`: channel固有のtarget (`announce`) またはwebhook URL (`webhook` mode)
- `delivery.bestEffort`: announce deliveryに失敗してもジョブを失敗扱いにしない

Announce deliveryでは、その実行中のmessaging tool送信が抑制されます。代わりに`delivery.channel` / `delivery.to`でチャットの宛先を指定してください。`delivery.mode = "none"`の場合、main sessionには要約は投稿されません。

Isolatedジョブで`delivery`を省略すると、OpenClawは既定で`announce`を使います。

#### Announce deliveryフロー

`delivery.mode = "announce"`の場合、cronはoutbound channel adapter経由で直接配信します。メインのagentを起動してメッセージを作成したり転送したりはしません。

挙動の詳細:

- コンテンツ: 配信にはisolated runのoutbound payloads (テキスト/メディア) を使用し、通常のchunkingとchannel formattingが適用されます。
- Heartbeat専用の応答(`HEARTBEAT_OK`で実質的な内容がないもの)は配信されません。
- Isolated runがすでに同じtargetへmessage toolで送信していた場合、重複を避けるためdeliveryはスキップされます。
- Delivery targetが欠落している、または無効な場合、`delivery.bestEffort = true`でない限りジョブは失敗します。
- `delivery.mode = "announce"`の場合のみ、短い要約がmain sessionに投稿されます。
- Main session要約は`wakeMode`に従います。`now`は即時Heartbeatをトリガーし、`next-heartbeat`は次回のスケジュール済みHeartbeatまで待機します。

#### Webhook deliveryフロー

`delivery.mode = "webhook"`の場合、finished eventにsummaryが含まれると、cronはfinished event payloadを`delivery.to`へPOSTします。

挙動の詳細:

- エンドポイントは有効なHTTP(S) URLである必要があります。
- Webhook modeではchannel deliveryは試行されません。
- Webhook modeではmain session要約は投稿されません。
- `cron.webhookToken`が設定されている場合、auth headerは`Authorization: Bearer <cron.webhookToken>`になります。
- 非推奨のフォールバック: 保存済みの従来ジョブで`notify: true`のものは、警告付きで引き続き`cron.webhook`へPOSTされます。`delivery.mode = "webhook"`へ移行してください。

### モデルとthinkingのoverride

Isolatedジョブ(`agentTurn`)では、modelとthinking levelをoverrideできます。

- `model`: Provider/model文字列(例: `anthropic/claude-sonnet-4-20250514`)またはalias(例: `opus`)
- `thinking`: Thinking level (`off`、`minimal`、`low`、`medium`、`high`、`xhigh`; GPT-5.2 + Codexモデルのみ)

補足: `model`はmain sessionジョブにも設定できますが、共有されているmain session modelが切り替わります。予期しないコンテキストの変化を避けるため、model overrideはisolatedジョブでのみ使うことを推奨します。

解決優先順位:

1. ジョブpayloadのoverride (最優先)
2. Hook固有の既定値(例: `hooks.gmail.model`)
3. Agent設定の既定値

### 軽量bootstrap context

Isolatedジョブ(`agentTurn`)では、`lightContext: true`を設定して軽量なbootstrap contextで実行できます。

- ワークスペースbootstrap file injectionを必要としない定期処理に使ってください。
- 実際には、組み込みランタイムが`bootstrapContextMode: "lightweight"`で実行されるため、cronのbootstrap contextは意図的に空のままになります。
- CLIの対応: `openclaw cron add --light-context ...`と`openclaw cron edit --light-context`

### Delivery (channel + target)

Isolatedジョブは、トップレベルの`delivery`設定を使って出力をchannelへ配信できます。

- `delivery.mode`: `announce` (channel delivery)、`webhook` (HTTP POST)、または`none`
- `delivery.channel`: `whatsapp` / `telegram` / `discord` / `slack` / `mattermost` (plugin) / `signal` / `imessage` / `last`
- `delivery.to`: channel固有のrecipient target

`announce` deliveryはisolatedジョブ(`sessionTarget: "isolated"`)でのみ有効です。`webhook` deliveryはmainジョブとisolatedジョブの両方で有効です。

`delivery.channel`または`delivery.to`を省略した場合、cronはmain sessionの「last route」(エージェントが最後に返信した場所)にフォールバックできます。

宛先形式の補足:

- Slack/Discord/Mattermost (plugin) のtargetは、曖昧さを避けるために`channel:<id>`や`user:<id>`のような明示的なprefixを使ってください。
- Telegramのtopicは`:topic:`形式を使ってください(詳細は後述)。

#### Telegramのdelivery宛先 (topics / forum threads)

Telegramは`message_thread_id`によるforum topicをサポートしています。cron deliveryでは、`to`フィールドにtopic/threadをエンコードできます。

- `-1001234567890` (chat idのみ)
- `-1001234567890:topic:123` (推奨: topic markerを明示)
- `-1001234567890:123` (短縮形: 数値suffix)

`telegram:...` / `telegram:group:...`のようなprefix付きtargetも受け付けます。

- `telegram:group:-1001234567890:topic:123`

## ツール呼び出し用JSON schema

Gatewayの`cron.*`ツールを直接呼び出すとき(agent tool callsまたはRPC)は、次の形式を使用してください。CLIフラグは`20m`のような人間向けdurationを受け付けますが、tool callsでは`schedule.at`にISO 8601文字列を、`schedule.everyMs`にはミリ秒を使ってください。

### cron.add params

ワンショットのmain sessionジョブ(system event):

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

delivery付きの定期isolatedジョブ:

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

- `schedule.kind`: `at` (`at`)、`every` (`everyMs`)、または`cron` (`expr`、オプションで`tz`)
- `schedule.at`はISO 8601を受け付けます(タイムゾーンは省略可。省略時はUTCとして扱われます)。
- `everyMs`はミリ秒です。
- `sessionTarget`は`"main"`または`"isolated"`である必要があり、`payload.kind`と一致していなければなりません。
- オプション項目: `agentId`、`description`、`enabled`、`deleteAfterRun` (`at`では既定でtrue)、`delivery`
- `wakeMode`は省略時に`"now"`が既定になります。

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

- `jobId`が正規で、互換性のために`id`も受け付けます。
- Agent bindingを解除するには、patchで`agentId: null`を使用します。

### cron.runとcron.remove params

```json
{ "jobId": "job-123", "mode": "force" }
```

```json
{ "jobId": "job-123" }
```

## 保存場所と履歴

- ジョブストア: `~/.openclaw/cron/jobs.json` (Gateway管理のJSON)
- 実行履歴: `~/.openclaw/cron/runs/<jobId>.jsonl` (JSONL。サイズと行数に基づいて自動でpruneされます)
- `sessions.json`内のisolated cron run sessionは`cron.sessionRetention`でpruneされます(既定は`24h`。無効にするには`false`を設定します)。
- ストアパスの上書き: 設定の`cron.store`

## リトライポリシー

ジョブが失敗すると、OpenClawはエラーを**transient** (リトライ可能) と**permanent** (即時に無効化) に分類します。

### Transient error (リトライあり)

- レート制限 (429、too many requests、resource exhausted)
- プロバイダー過負荷 (例: Anthropicの`529 overloaded_error`、overload fallback summaries)
- ネットワークエラー (timeout、ECONNRESET、fetch failed、socket)
- サーバーエラー (5xx)
- Cloudflare関連のエラー

### Permanent error (リトライなし)

- 認証失敗 (無効なAPI key、unauthorized)
- 設定またはvalidationエラー
- その他のnon-transient error

### 既定の挙動 (設定なし)

**ワンショットジョブ (`schedule.kind: "at"`):**

- Transient error時: 指数バックオフ(30s → 1m → 5m)で最大3回までリトライします。
- Permanent error時: 直ちに無効化します。
- 成功またはskip時: 無効化します(`deleteAfterRun: true`なら削除)。

**定期ジョブ (`cron` / `every`):**

- どのエラーでも: 次のスケジュール実行前に指数バックオフ(30s → 1m → 5m → 15m → 60m)を適用します。
- ジョブは有効のままで、次に成功するとバックオフはリセットされます。

これらの既定値を上書きするには`cron.retry`を設定してください([Configuration](/automation/cron-jobs#configuration)を参照)。

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

run-log pruningの挙動:

- `cron.runLog.maxBytes`: prune前に許容されるrun-logファイルの最大サイズ
- `cron.runLog.keepLines`: prune時に保持する最新N行
- どちらも`cron/runs/<jobId>.jsonl`ファイルに適用されます。

Webhookの挙動:

- 推奨: ジョブごとに`delivery.mode: "webhook"`と`delivery.to: "https://..."`を設定します。
- Webhook URLは有効な`http://`または`https://` URLである必要があります。
- POST時のpayloadはcron finished eventのJSONです。
- `cron.webhookToken`が設定されている場合、auth headerは`Authorization: Bearer <cron.webhookToken>`になります。
- `cron.webhookToken`が設定されていない場合、`Authorization` headerは送信されません。
- 非推奨のフォールバック: 保存済みの従来ジョブで`notify: true`のものは、`cron.webhook`がある場合に引き続きそれを使用します。

cronを完全に無効化する方法:

- `cron.enabled: false` (config)
- `OPENCLAW_SKIP_CRON=1` (env)

## メンテナンス

Cronには、isolated run session retentionとrun-log pruningという2つの組み込みメンテナンス経路があります。

### 既定値

- `cron.sessionRetention`: `24h` (run-session pruningを無効にするには`false`を設定)
- `cron.runLog.maxBytes`: `2_000_000` bytes
- `cron.runLog.keepLines`: `2000`

### 仕組み

- Isolated runはsession entry (`...:cron:<jobId>:run:<uuid>`) とtranscript fileを作成します。
- reaperは`cron.sessionRetention`より古い期限切れのrun-session entryを削除します。
- session storeから参照されなくなった削除済みrun sessionについては、OpenClawがtranscript fileをアーカイブし、同じretention windowに基づいて古い削除済みアーカイブをpurgeします。
- 各実行の追記後、`cron/runs/<jobId>.jsonl`はサイズチェックされます:
  - ファイルサイズが`runLog.maxBytes`を超えた場合、最新の`runLog.keepLines`行だけを残すようにtrimされます。

### 高トラフィックなスケジューラ向けのパフォーマンス上の注意

高頻度のcron構成では、run-sessionとrun-logが大きく膨らむことがあります。メンテナンス機能は組み込まれていますが、制限を緩くしすぎると不要なIOやクリーンアップ作業が増える可能性があります。

確認すべき点:

- isolated runが多い環境で`cron.sessionRetention`を長く設定している
- `cron.runLog.keepLines`が大きく、かつ`runLog.maxBytes`も大きい
- 同じ`cron/runs/<jobId>.jsonl`へ大量に書き込む、騒がしい定期ジョブが多い

対応方法:

- `cron.sessionRetention`は、デバッグや監査に必要な範囲でできるだけ短く保つ
- `runLog.maxBytes`と`runLog.keepLines`は適度な値にして、run logのサイズを制限する
- 不要なチャット送信を避けるdelivery ruleと組み合わせて、騒がしいバックグラウンドジョブはisolated modeへ移す
- `openclaw cron runs`で定期的に増加状況を確認し、ログが大きくなる前にretentionを調整する

### カスタマイズ例

run sessionを1週間保持し、より大きいrun logを許可する例:

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

isolated run-session pruningを無効にしつつ、run-log pruningは維持する例:

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

高頻度のcron利用向けに調整する例:

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

## CLIクイックスタート

ワンショットのリマインダー(UTCのISO、成功後に自動削除):

```bash
openclaw cron add \
  --name "Send reminder" \
  --at "2026-01-12T18:00:00Z" \
  --session main \
  --system-event "Reminder: submit expense report." \
  --wake now \
  --delete-after-run
```

ワンショットのリマインダー(main session、すぐにwake):

```bash
openclaw cron add \
  --name "Calendar check" \
  --at "20m" \
  --session main \
  --system-event "Next heartbeat: check calendar." \
  --wake now
```

定期isolatedジョブ(WhatsAppへannounce):

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

明示的に30秒のstaggerを設定した定期cronジョブ:

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

定期isolatedジョブ(Telegramのtopicへ配信):

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

modelとthinkingをoverrideするisolatedジョブ:

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

エージェント選択(マルチエージェント構成):

```bash
# Pin a job to agent "ops" (falls back to default if that agent is missing)
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops

# Switch or clear the agent on an existing job
openclaw cron edit <jobId> --agent ops
openclaw cron edit <jobId> --clear-agent
```

手動実行(`force`が既定。期限が来ているときだけ実行するには`--due`を使用):

```bash
openclaw cron run <jobId>
openclaw cron run <jobId> --due
```

`cron.run`は現在、ジョブ完了後ではなく、手動実行がキューに入った時点で確認応答を返します。キュー投入成功時の応答は`{ ok: true, enqueued: true, runId }`のようになります。ジョブがすでに実行中の場合や、`--due`で期限到来ジョブがなかった場合の応答は、引き続き`{ ok: true, ran: false, reason }`です。最終的なfinished entryは`openclaw cron runs --id <jobId>`または`cron.runs` Gateway methodで確認してください。

既存ジョブを編集する(項目をpatch):

```bash
openclaw cron edit <jobId> \
  --message "Updated prompt" \
  --model "opus" \
  --thinking low
```

既存のcronジョブをスケジュールどおりに正確に実行する(staggerなし):

```bash
openclaw cron edit <jobId> --exact
```

実行履歴:

```bash
openclaw cron runs --id <jobId> --limit 50
```

ジョブを作成せずに即時system eventを送る:

```bash
openclaw system event --mode now --text "Next heartbeat: check battery."
```

## Gateway API surface

- `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`
- `cron.run` (forceまたはdue), `cron.runs`
  ジョブを作らずに即時system eventを送るには[`openclaw system event`](/cli/system)を使ってください。

## トラブルシューティング

### 「何も実行されない」

- cronが有効か確認してください: `cron.enabled`と`OPENCLAW_SKIP_CRON`
- Gatewayが継続的に実行されているか確認してください(cronはGateway process内で動作します)。
- `cron`スケジュールでは、タイムゾーン(`--tz`)とホストのタイムゾーンが合っているか確認してください。

### 定期ジョブが失敗後ずっと遅延し続ける

- OpenClawは定期ジョブで連続エラーが起きると、指数リトライバックオフを適用します:
  30s、1m、5m、15m、その後は60m間隔でリトライします。
- 次に成功するとバックオフは自動的にリセットされます。
- ワンショット(`at`)ジョブは、transient error (rate limit、overloaded、network、server_error) をバックオフ付きで最大3回までリトライします。permanent errorは即座に無効化されます。詳しくは[Retry policy](/automation/cron-jobs#retry-policy)を参照してください。

### Telegramが違う場所に配信される

- forum topicでは、明示的で曖昧さのない`-100…:topic:<id>`を使ってください。
- ログや保存済みの「last route」targetに`telegram:...` prefixが見えても正常です。cron deliveryはこれらを受け付け、topic IDも正しく解析します。

### Subagentのannounce deliveryがリトライされる

- subagent runが完了すると、gatewayは結果をrequester sessionへannounceします。
- announceフローが`false`を返した場合(例: requester sessionがbusy)、gatewayは`announceRetryCount`で追跡しつつ最大3回までリトライします。
- `endedAt`から5分を過ぎたannounceは、古いentryが無限ループしないよう強制的に期限切れ扱いになります。
- ログでannounce deliveryの繰り返しが見える場合は、subagent registry内で`announceRetryCount`が大きいentryを確認してください。
