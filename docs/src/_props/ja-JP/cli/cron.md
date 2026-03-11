---
summary: "`openclaw cron` の CLI リファレンス (バックグラウンドジョブのスケジュールと実行)"
read_when:
  - ジョブのスケジュール実行や定期的なウェイクアップを設定したい場合
  - Cron の実行状況やログをデバッグしたい場合
title: "cron"
x-i18n:
  source_hash: "e298fef3a657d10183dbcdb71cd65a4b1b5b5b04485d726fe925be82b06c099a"
---

# `openclaw cron`

ゲートウェイスケジューラにおける Cron ジョブを管理します。

関連ドキュメント:

* Cron ジョブ: [Cron ジョブ](/automation/cron-jobs)

ヒント: `openclaw cron --help` を実行すると、利用可能なすべてのサブコマンドとフラグを確認できます。

補足: `cron add` で作成した独立した（isolated）ジョブは、デフォルトで `--announce`（通知）配信になります。出力を内部のみに留めたい場合は `--no-deliver` を使用してください。`--deliver` フラグは `--announce` の古い別名として引き続き利用可能です。

補足: 単発実行（`--at`）のジョブは、デフォルトでは実行成功後に削除されます。ジョブを保持したい場合は `--keep-after-run` を指定してください。

補足: 定期実行ジョブにおいて連続してエラーが発生した場合、指数関数的なバックオフ（30秒 → 1分 → 5分 → 15分 → 60分）が適用されるようになりました。次回の実行が成功すると、通常のスケジュールに戻ります。

補足: `openclaw cron run` は、手動実行が実行キューに追加されると即座に応答を返すようになりました。成功時のレスポンスには `{ ok: true, enqueued: true, runId }` が含まれます。最終的な結果を確認するには `openclaw cron runs --id <job-id>` を使用してください。

補足: データの保持期間（リテンション）やプルーニングは構成ファイルで制御されます:

* `cron.sessionRetention` (デフォルト `24h`): 完了した独立実行セッションを削除します。
* `cron.runLog.maxBytes` および `cron.runLog.keepLines`: `~/.openclaw/cron/runs/<jobId>.jsonl` ファイルをプルーニングします。

アップグレードに関する注意: 現在の配信/保存形式が導入される前の古い Cron ジョブがある場合は、`openclaw doctor --fix` を実行してください。Doctor は古い形式のフィールド（`jobId`, `schedule.cron`, トップレベルの配信フィールド, ペイロード内の `provider` 別名など）を正規化し、`cron.webhook` が構成されている場合は `notify: true` を使用している古いジョブを明示的な webhook 配信に移行します。

## よく使われる編集操作

メッセージ内容はそのままに、配信設定のみを更新する:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

独立したジョブの配信を無効にする:

```bash
openclaw cron edit <job-id> --no-deliver
```

独立したジョブで軽量なブートストラップコンテキストを有効にする:

```bash
openclaw cron edit <job-id> --light-context
```

特定のチャネルにアナウンス（通知）する:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

軽量なブートストラップコンテキストを使用して、独立したジョブを作成する:

```bash
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "夜間の更新情報を要約してください。" \
  --light-context \
  --no-deliver
```

`--light-context` は、エージェントターン形式の独立したジョブにのみ適用されます。Cron 実行時、軽量モードではワークスペース全体のブートストラップファイルを注入せず、ブートストラップコンテキストを空の状態に保ちます。
