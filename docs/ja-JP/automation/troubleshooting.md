---
summary: "cronとheartbeatのスケジューリングと配信のトラブルシューティング"
read_when:
  - cronが実行されなかった
  - cronは実行されたがメッセージが配信されなかった
  - heartbeatが無音またはスキップされているようだ
title: "自動化のトラブルシューティング"
x-i18n:
  source_path: "automation/troubleshooting.md"
  source_hash: "da9ccbd94651fedba573f4f344c1981d6e38d2023c19edd737dc71ce35a4bac2"
  provider: "anthropic"
  model: "claude-opus-4-6"
  workflow: 1
  generated_at: "2026-03-10T06:30:24.219Z"
---

# 自動化のトラブルシューティング

このページは、スケジューラーと配信の問題（`cron` + `heartbeat`）に使用します。

## コマンドラダー

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

次に自動化チェックを実行します：

```bash
openclaw cron status
openclaw cron list
openclaw system heartbeat last
```

## cronが起動しない

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw logs --follow
```

正常な出力は次のようになります：

- `cron status`が有効と報告し、将来の`nextWakeAtMs`を表示する。
- ジョブが有効で、有効なスケジュール/タイムゾーンを持っている。
- `cron runs`が`ok`または明示的なスキップ理由を表示する。

一般的なシグネチャ：

- `cron: scheduler disabled; jobs will not run automatically` → 設定/環境でcronが無効化されている。
- `cron: timer tick failed` → スケジューラーティックがクラッシュした；周辺のスタック/ログコンテキストを調査する。
- 実行出力に`reason: not-due` → 手動実行が`--force`なしで呼び出され、ジョブがまだ実行予定時刻ではない。

## cronは起動したが配信されない

```bash
openclaw cron runs --id <jobId> --limit 20
openclaw cron list
openclaw channels status --probe
openclaw logs --follow
```

正常な出力は次のようになります：

- 実行ステータスが`ok`。
- 分離されたジョブに対して配信モード/ターゲットが設定されている。
- チャンネルプローブがターゲットチャンネルが接続されていると報告する。

一般的なシグネチャ：

- 実行は成功したが配信モードが`none` → 外部メッセージは期待されない。
- 配信ターゲットが欠落/無効（`channel`/`to`） → 実行は内部的に成功する可能性があるが、アウトバウンドをスキップする。
- チャンネル認証エラー（`unauthorized`、`missing_scope`、`Forbidden`） → チャンネルの認証情報/権限によって配信がブロックされている。

## heartbeatが抑制またはスキップされる

```bash
openclaw system heartbeat last
openclaw logs --follow
openclaw config get agents.defaults.heartbeat
openclaw channels status --probe
```

正常な出力は次のようになります：

- heartbeatがゼロ以外の間隔で有効化されている。
- 最後のheartbeat結果が`ran`（またはスキップ理由が理解できる）。

一般的なシグネチャ：

- `heartbeat skipped`で`reason=quiet-hours` → `activeHours`の外。
- `requests-in-flight` → メインレーンがビジー；heartbeatが延期された。
- `empty-heartbeat-file` → `HEARTBEAT.md`に実行可能なコンテンツがなく、タグ付きcronイベントがキューに入っていないため、間隔heartbeatがスキップされた。
- `alerts-disabled` → 可視性設定がアウトバウンドheartbeatメッセージを抑制している。

## タイムゾーンとactiveHoursの落とし穴

```bash
openclaw config get agents.defaults.heartbeat.activeHours
openclaw config get agents.defaults.heartbeat.activeHours.timezone
openclaw config get agents.defaults.userTimezone || echo "agents.defaults.userTimezone not set"
openclaw cron list
openclaw logs --follow
```

クイックルール：

- `Config path not found: agents.defaults.userTimezone`は、キーが設定されていないことを意味する；heartbeatはホストタイムゾーン（または`activeHours.timezone`が設定されている場合はそれ）にフォールバックする。
- `--tz`なしのcronはGatewayホストタイムゾーンを使用する。
- heartbeat `activeHours`は設定されたタイムゾーン解決（`user`、`local`、または明示的なIANA tz）を使用する。
- タイムゾーンなしのISOタイムスタンプは、cron `at`スケジュールではUTCとして扱われる。

一般的なシグネチャ：

- ホストタイムゾーン変更後、ジョブが間違った壁時計時刻で実行される。
- `activeHours.timezone`が間違っているため、heartbeatが日中常にスキップされる。

関連：

- [/automation/cron-jobs](/automation/cron-jobs)
- [/gateway/heartbeat](/gateway/heartbeat)
- [/automation/cron-vs-heartbeat](/automation/cron-vs-heartbeat)
- [/concepts/timezone](/concepts/timezone)
