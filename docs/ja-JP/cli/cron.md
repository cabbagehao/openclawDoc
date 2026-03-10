---
summary: "「openclaw cron」の CLI リファレンス (バックグラウンド ジョブのスケジュールと実行)"
read_when:
  - スケジュールされたジョブとウェイクアップが必要な場合
  - cron の実行とログをデバッグしています
title: "クロン"
x-i18n:
  source_hash: "e298fef3a657d10183dbcdb71cd65a4b1b5b5b04485d726fe925be82b06c099a"
---

# `openclaw cron`

ゲートウェイ スケジューラの cron ジョブを管理します。

関連:

- Cron ジョブ: [Cron ジョブ](/automation/cron-jobs)

ヒント: コマンド サーフェイス全体に対して `openclaw cron --help` を実行します。

注: 分離された `cron add` ジョブは、デフォルトで `--announce` 配信になります。 `--no-deliver` を使用して保持します
内部出力。 `--deliver` は、`--announce` の非推奨のエイリアスとして残ります。

注: ワンショット (`--at`) ジョブは、デフォルトで成功後に削除されます。 `--keep-after-run` を使用して保存してください。

注: 定期的なジョブでは、連続したエラー (30 秒→ 1 分→ 5 分→ 15 分→ 60 分) の後に指数関数的な再試行バックオフが使用され、次の実行が成功すると通常のスケジュールに戻ります。

注: `openclaw cron run` は、手動実行が実行キューに入れられるとすぐに返されるようになりました。成功した応答には `{ ok: true, enqueued: true, runId }` が含まれます。最終的な結果を追跡するには、`openclaw cron runs --id <job-id>` を使用してください。

注: 保持/削除は構成で制御されます。

- `cron.sessionRetention` (デフォルト `24h`) は、完了した分離実行セッションをプルーニングします。
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` `~/.openclaw/cron/runs/<jobId>.jsonl` を削除します。アップグレードに関する注意: 現在の配信/ストア形式より前の古い cron ジョブがある場合は、次のコマンドを実行します。
  `openclaw doctor --fix`。 Doctor は従来の cron フィールド (`jobId`、`schedule.cron`、
  最上位の配信フィールド、ペイロード `provider` 配信エイリアス) と単純な移行
  `notify: true` `cron.webhook` の場合、明示的な Webhook 配信への Webhook フォールバック ジョブ
  設定されています。

## 一般的な編集

メッセージを変更せずに配信設定を更新します。

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

分離されたジョブの配信を無効にします。

```bash
openclaw cron edit <job-id> --no-deliver
```

分離されたジョブの軽量ブートストラップ コンテキストを有効にします。

```bash
openclaw cron edit <job-id> --light-context
```

特定のチャネルにアナウンスします。

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

軽量のブートストラップ コンテキストを使用して分離ジョブを作成します。

```bash
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context` は、孤立したエージェントターンジョブのみに適用されます。 cron 実行の場合、軽量モードでは、完全なワークスペース ブートストラップ セットを挿入するのではなく、ブートストラップ コンテキストを空に保ちます。
