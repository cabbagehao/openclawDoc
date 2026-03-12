---
summary: "cron と heartbeat のスケジューリングと配信に関するトラブルシューティング"
read_when:
  - cron が実行されなかった
  - cron は実行されたがメッセージが配信されなかった
  - heartbeat が止まっている、またはスキップされているように見える
title: "自動化のトラブルシューティング"
seoTitle: "OpenClawのcronとHeartbeatの不具合を切り分ける対処ガイド"
description: "このページは、スケジューラーと配信まわり（cron + heartbeat）の問題を切り分けるためのものです。確認コマンドの順番、cron が動かない、cron は動いたが配信されないを確認できます。"
x-i18n:
  source_path: "automation/troubleshooting.md"
  source_hash: "da9ccbd94651fedba573f4f344c1981d6e38d2023c19edd737dc71ce35a4bac2"
  provider: "anthropic"
  model: "claude-opus-4-6"
  workflow: 1
  generated_at: "2026-03-10T06:30:24.219Z"
---
このページは、スケジューラーと配信まわり（`cron` + `heartbeat`）の問題を切り分けるためのものです。

## 確認コマンドの順番

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

続けて、自動化まわりのチェックを実行します。

```bash
openclaw cron status
openclaw cron list
openclaw system heartbeat last
```

## cron が動かない

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw logs --follow
```

期待する状態は次のとおりです。

- `cron status` が有効状態を示し、将来の `nextWakeAtMs` が表示される。
- ジョブが有効で、妥当なスケジュールとタイムゾーンを持っている。
- `cron runs` に `ok` または明示的なスキップ理由が表示される。

よくある兆候:

- `cron: scheduler disabled; jobs will not run automatically` → 設定または環境変数で cron が無効になっている。
- `cron: timer tick failed` → スケジューラーの tick がクラッシュしているため、周辺のスタックトレースやログを確認する。
- 実行結果に `reason: not-due` が出る → `--force` なしで手動実行しており、まだ実行時刻になっていない。

## cron は動いたが配信されない

```bash
openclaw cron runs --id <jobId> --limit 20
openclaw cron list
openclaw channels status --probe
openclaw logs --follow
```

期待する状態は次のとおりです。

- 実行ステータスが `ok` である。
- 分離ジョブ向けの配信モードとターゲットが設定されている。
- チャンネルプローブで対象チャンネルが接続済みと確認できる。

よくある兆候:

- 実行は成功したが配信モードが `none` → 外部メッセージは送られないのが正常です。
- 配信ターゲットが欠落または不正（`channel` / `to`） → 内部処理は成功しても、外向きの配信はスキップされることがあります。
- チャンネル認証エラー（`unauthorized`、`missing_scope`、`Forbidden`） → チャンネルの認証情報または権限不足で配信が止まっています。

## heartbeat が抑制またはスキップされる

```bash
openclaw system heartbeat last
openclaw logs --follow
openclaw config get agents.defaults.heartbeat
openclaw channels status --probe
```

期待する状態は次のとおりです。

- heartbeat が 0 以外の間隔で有効になっている。
- 最後の heartbeat 結果が `ran` である、またはスキップ理由を説明できる。

よくある兆候:

- `heartbeat skipped` と `reason=quiet-hours` が出る → `activeHours` の時間外です。
- `requests-in-flight` → メインレーンがビジーのため、heartbeat が延期されています。
- `empty-heartbeat-file` → `HEARTBEAT.md` に実行可能な内容がなく、タグ付き cron イベントもキューにないため、定期 heartbeat がスキップされています。
- `alerts-disabled` → 表示設定により外向きの heartbeat メッセージが抑制されています。

## タイムゾーンと activeHours の落とし穴

```bash
openclaw config get agents.defaults.heartbeat.activeHours
openclaw config get agents.defaults.heartbeat.activeHours.timezone
openclaw config get agents.defaults.userTimezone || echo "agents.defaults.userTimezone not set"
openclaw cron list
openclaw logs --follow
```

確認ポイント:

- `Config path not found: agents.defaults.userTimezone` は、そのキーが未設定であることを意味します。heartbeat はホストのタイムゾーン（`activeHours.timezone` が設定されていればそちら）へフォールバックします。
- `--tz` なしの cron は、ゲートウェイホストのタイムゾーンを使います。
- heartbeat の `activeHours` は、設定されたタイムゾーン解決（`user`、`local`、または明示的な IANA tz）を使います。
- タイムゾーンを含まない ISO タイムスタンプは、cron の `at` スケジュールでは UTC として扱われます。

よくある兆候:

- ホストのタイムゾーン変更後に、ジョブが意図しない時刻で実行される。
- `activeHours.timezone` が誤っているため、日中なのに heartbeat が常にスキップされる。

関連ドキュメント:

- [/automation/cron-jobs](/automation/cron-jobs)
- [/gateway/heartbeat](/gateway/heartbeat)
- [/automation/cron-vs-heartbeat](/automation/cron-vs-heartbeat)
- [/concepts/timezone](/concepts/timezone)
