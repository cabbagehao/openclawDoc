---
summary: "「openclaw システム」の CLI リファレンス (システム イベント、ハートビート、プレゼンス)"
read_when:
  - cron ジョブを作成せずにシステム イベントをキューに入れたい
  - ハートビートを有効または無効にする必要があります
  - システムの存在エントリを検査したい場合
title: "システム"
x-i18n:
  source_hash: "36ae5dbdec327f5a32f7ef44bdc1f161bad69868de62f5071bb4d25a71bfdfe9"
---

# `openclaw system`

ゲートウェイのシステム レベルのヘルパー: システム イベントをキューに入れ、ハートビートを制御し、
そして存在感を確認します。

## 共通コマンド

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
openclaw system heartbeat enable
openclaw system heartbeat last
openclaw system presence
```

## `system event`

**メイン** セッションでシステム イベントをキューに入れます。次の心拍が注入されます
これはプロンプトの `System:` 行として表示されます。 `--mode now` を使用してハートビートをトリガーします
すぐに; `next-heartbeat` は、次にスケジュールされたティックを待ちます。

フラグ:

- `--text <text>`: 必須のシステム イベント テキスト。
- `--mode <mode>`: `now` または `next-heartbeat` (デフォルト)。
- `--json`: 機械可読出力。

## `system heartbeat last|enable|disable`

ハートビート制御:

- `last`: 最後のハートビート イベントを表示します。
- `enable`: ハートビートをオンに戻します (ハートビートが無効になっている場合はこれを使用します)。
- `disable`: ハートビートを一時停止します。

フラグ:

- `--json`: 機械可読出力。

## `system presence`

ゲートウェイが認識している現在のシステム プレゼンス エントリ (ノード、
インスタンス、および同様のステータス行)。

フラグ:

- `--json`: 機械可読出力。

## 注意事項

- 現在の構成 (ローカルまたはリモート) から到達可能な、実行中のゲートウェイが必要です。
- システム イベントは一時的なものであり、再起動後は持続しません。
