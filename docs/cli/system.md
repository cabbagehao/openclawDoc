---
summary: "`openclaw system` の CLI リファレンス (システムイベント、ハートビート、プレゼンス)"
read_when:
  - Cron ジョブを作成せずにシステムイベントを投入したい場合
  - ハートビート（生存確認と定期実行）を有効化・無効化したい場合
  - システムのプレゼンス（ノードの接続状況など）情報を確認したい場合
title: "OpenClaw CLI: openclaw system コマンドの使い方と主要オプション・実行例"
description: "ゲートウェイ用のシステムレベルヘルパーです。システムイベントの投入、ハートビートの制御、プレゼンス情報の表示を行います。よく使われるコマンド、system event (システムイベント)、system heartbeat last|enable|disable。"
x-i18n:
  source_hash: "36ae5dbdec327f5a32f7ef44bdc1f161bad69868de62f5071bb4d25a71bfdfe9"
---
ゲートウェイ用のシステムレベルヘルパーです。システムイベントの投入、ハートビートの制御、プレゼンス情報の表示を行います。

## よく使われるコマンド

```bash
openclaw system event --text "緊急のフォローアップをチェックしてください" --mode now
openclaw system heartbeat enable
openclaw system heartbeat last
openclaw system presence
```

## `system event` (システムイベント)

**メイン**セッションにシステムイベントを投入します。次回のハートビート実行時に、プロンプト内に `System:` 行として注入されます。`--mode now` を指定すると、即座にハートビートがトリガーされます。デフォルトの `next-heartbeat` は、次回のスケジュール実行を待ちます。

フラグ:
- `--text <テキスト>`: 必須。注入するイベント内容。
- `--mode <mode>`: `now` (即時) または `next-heartbeat` (次回。デフォルト)。
- `--json`: 機械可読な形式で出力。

## `system heartbeat last|enable|disable` (ハートビート制御)

ハートビート機能の操作:
- `last`: 最後に実行されたハートビートイベントを表示します。
- `enable`: ハートビートを再開します（無効化されていた場合に使用）。
- `disable`: ハートビートを一時停止します。

フラグ:
- `--json`: 機械可読な形式で出力。

## `system presence` (プレゼンス情報)

ゲートウェイが把握している現在のシステムプレゼンスエントリ（ノード、インスタンス、および同様のステータス情報）の一覧を表示します。

フラグ:
- `--json`: 機械可読な形式で出力。

## 補足事項

- 実行には、現在の構成（ローカルまたはリモート）から到達可能な稼働中のゲートウェイが必要です。
- システムイベントは一時的なものであり、再起動後は保持されません。
