---
summary: "自動化で heartbeat と cron ジョブのどちらを選ぶか判断するためのガイド"
read_when:
  - 定期タスクをどのようにスケジュールするか決める場合
  - バックグラウンド監視や通知を設定する場合
  - 定期チェックのトークン使用量を最適化したい場合
title: "Cron と Heartbeat"
x-i18n:
  source_path: "automation/cron-vs-heartbeat.md"
  source_hash: "f41e6321e67971407b9e51e8288b6215d56f0008ee5a58713789eadb6e56cba9"
  provider: "anthropic"
  model: "claude-opus-4-6"
  workflow: 1
  generated_at: "2026-03-10T05:54:30.000Z"
---

# Cron と Heartbeat: それぞれを使うべき場面

Heartbeat と cron ジョブは、どちらもスケジュールに従ってタスクを実行できます。このガイドでは、用途に応じてどちらを選ぶべきかを整理します。

## すばやい判断ガイド

| ユースケース                           | 推奨                 | 理由                                                 |
| -------------------------------------- | -------------------- | ---------------------------------------------------- |
| 30 分ごとに受信トレイを確認する        | Heartbeat            | 他のチェックとまとめて実行でき、コンテキストも使える |
| 毎日午前 9 時ちょうどにレポートを送る  | Cron（isolated）     | 正確な時刻指定が必要                                 |
| 予定が近いカレンダーイベントを監視する | Heartbeat            | 定期的な状況把握に自然に適している                   |
| 毎週の詳細分析を実行する               | Cron（isolated）     | 単独タスクで、別モデルも使える                       |
| 20 分後にリマインドする                | Cron（main, `--at`） | 正確な時刻でのワンショット実行に向いている           |
| プロジェクト状態のバックグラウンド確認 | Heartbeat            | 既存のサイクルに相乗りできる                         |

## Heartbeat: 定期的な状況把握

Heartbeat は一定間隔（デフォルト: 30 分）で**メインセッション**内で実行されます。エージェントが状況を確認し、重要なものだけを表に出すための仕組みです。

### Heartbeat を使う場面

- **複数の定期チェック**: 受信トレイ、カレンダー、天気、通知、プロジェクト状況を 5 つの別々の cron ジョブで監視する代わりに、1 つの heartbeat ですべてまとめて処理できます。
- **コンテキストを踏まえた判断**: エージェントはメインセッションの完全なコンテキストを持っているため、何が急ぎで何が後回しでよいかを賢く判断できます。
- **会話の連続性**: Heartbeat 実行は同じセッションを共有するため、エージェントは最近の会話を覚えており、自然にフォローアップできます。
- **低オーバーヘッドな監視**: 1 つの heartbeat で、多数の小さなポーリングタスクを置き換えられます。

### Heartbeat の利点

- **複数チェックをまとめて実行**: 1 回のエージェントターンで、受信トレイ、カレンダー、通知をまとめて確認できます。
- **API 呼び出しを削減**: heartbeat 1 回の方が、独立した cron ジョブを 5 本動かすより安価です。
- **コンテキストを考慮できる**: いま何に取り組んでいるかをエージェントが理解しており、優先度を判断できます。
- **賢い抑制**: 注意すべきことが何もなければ、エージェントは `HEARTBEAT_OK` を返し、メッセージは配信されません。
- **自然なタイミング**: キューの負荷に応じて多少ずれますが、多くの監視用途では問題ありません。

### Heartbeat の例: HEARTBEAT.md チェックリスト

```md
# Heartbeat checklist

- Check email for urgent messages
- Review calendar for events in next 2 hours
- If a background task finished, summarize results
- If idle for 8+ hours, send a brief check-in
```

エージェントは heartbeat のたびにこれを読み、すべての項目を 1 ターンで処理します。

### Heartbeat の設定

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 間隔
        target: "last", // 明示的なアラート配信先（デフォルトは "none"）
        activeHours: { start: "08:00", end: "22:00" }, // 任意
      },
    },
  },
}
```

設定の詳細は [Heartbeat](/gateway/heartbeat) を参照してください。

## Cron: 正確なスケジューリング

Cron ジョブは正確な時刻に実行され、メインコンテキストに影響を与えない独立セッションでも実行できます。
毎時ちょうどの繰り返しスケジュールは、自動的にジョブごとの決定論的なオフセットで 0〜5 分の範囲に分散されます。

### Cron を使う場面

- **正確な時刻が必要**: 「毎週月曜の午前 9:00 に送る」のように、「9 時前後」でなく正確な実行時刻が必要な場合。
- **単独タスク**: 会話のコンテキストを必要としないタスク。
- **異なるモデル / thinking**: より高性能なモデルを使う価値がある重い分析。
- **ワンショットのリマインダー**: `--at` を使った「20 分後に知らせて」。
- **頻繁でノイズが多いタスク**: メインセッションの履歴を散らかしたくないタスク。
- **外部トリガー**: エージェントがほかに動いているかどうかに関係なく、独立して実行されるべきタスク。

### Cron の利点

- **正確な時刻指定**: タイムゾーン対応の 5 フィールドまたは 6 フィールド（秒付き）の cron 式を使えます。
- **負荷分散を内蔵**: 毎時ちょうどの繰り返しスケジュールは、デフォルトで最大 5 分ずらして実行されます。
- **ジョブ単位の制御**: `--stagger <duration>` で分散を上書きするか、`--exact` で厳密な時刻実行を強制できます。
- **セッション分離**: `cron:<jobId>` で実行され、メイン履歴を汚しません。
- **モデルの上書き**: ジョブごとに、より安価なモデルや高性能なモデルを指定できます。
- **配信制御**: 独立ジョブのデフォルトは `announce`（要約配信）で、必要に応じて `none` も選べます。
- **即時配信**: announce モードでは heartbeat を待たずに直接投稿されます。
- **エージェントのコンテキストが不要**: メインセッションがアイドル状態でも compact 済みでも実行できます。
- **ワンショット対応**: `--at` で将来の正確な時刻を指定できます。

### Cron の例: 毎朝のブリーフィング

```bash
openclaw cron add \
  --name "Morning briefing" \
  --cron "0 7 * * *" \
  --tz "America/New_York" \
  --session isolated \
  --message "Generate today's briefing: weather, calendar, top emails, news summary." \
  --model opus \
  --announce \
  --channel whatsapp \
  --to "+15551234567"
```

これはニューヨーク時間の午前 7:00 ちょうどに実行され、品質重視で Opus を使い、要約を WhatsApp に直接配信します。

### Cron の例: ワンショットのリマインダー

```bash
openclaw cron add \
  --name "Meeting reminder" \
  --at "20m" \
  --session main \
  --system-event "Reminder: standup meeting starts in 10 minutes." \
  --wake now \
  --delete-after-run
```

CLI リファレンスの詳細は [Cron jobs](/automation/cron-jobs) を参照してください。

## 判断フローチャート

```
Does the task need to run at an EXACT time?
  YES -> Use cron
  NO  -> Continue...

Does the task need isolation from main session?
  YES -> Use cron (isolated)
  NO  -> Continue...

Can this task be batched with other periodic checks?
  YES -> Use heartbeat (add to HEARTBEAT.md)
  NO  -> Use cron

Is this a one-shot reminder?
  YES -> Use cron with --at
  NO  -> Continue...

Does it need a different model or thinking level?
  YES -> Use cron (isolated) with --model/--thinking
  NO  -> Use heartbeat
```

## 両方を組み合わせる

最も効率的な構成は、**両方を併用すること**です。

1. **Heartbeat** は、受信トレイ、カレンダー、通知などの日常的な監視を、30 分ごとに 1 回のバッチ処理で行います。
2. **Cron** は、毎日のレポートや週次レビューのような正確なスケジュールと、ワンショットのリマインダーを担当します。

### 例: 効率的な自動化構成

**HEARTBEAT.md**（30 分ごとに確認）:

```md
# Heartbeat checklist

- Scan inbox for urgent emails
- Check calendar for events in next 2h
- Review any pending tasks
- Light check-in if quiet for 8+ hours
```

**Cron jobs**（正確なタイミング）:

```bash
# Daily morning briefing at 7am
openclaw cron add --name "Morning brief" --cron "0 7 * * *" --session isolated --message "..." --announce

# Weekly project review on Mondays at 9am
openclaw cron add --name "Weekly review" --cron "0 9 * * 1" --session isolated --message "..." --model opus

# One-shot reminder
openclaw cron add --name "Call back" --at "2h" --session main --system-event "Call back the client" --wake now
```

## Lobster: 承認付きの決定論的ワークフロー

Lobster は、決定論的な実行と明示的な承認が必要な**複数ステップのツールパイプライン**向けワークフローランタイムです。
タスクが単一のエージェントターンで終わらず、人間のチェックポイントを挟める再開可能なワークフローが欲しい場合に使います。

### Lobster が適している場面

- **複数ステップの自動化**: 単発プロンプトではなく、ツール呼び出しの固定パイプラインが必要。
- **承認ゲート**: 副作用を伴う処理を一時停止し、承認後に再開したい。
- **再開可能な実行**: 以前のステップをやり直さず、一時停止したワークフローを続行したい。

### Heartbeat / Cron との関係

- **Heartbeat / cron** は、実行が*いつ*起きるかを決めます。
- **Lobster** は、実行開始後に*どの手順*を踏むかを定義します。

スケジュール実行のワークフローでは、cron または heartbeat で Lobster を呼び出すエージェントターンを起動します。
アドホックなワークフローでは、Lobster を直接呼び出します。

### 運用上のメモ（コードベース準拠）

- Lobster はツールモードで**ローカルサブプロセス**（`lobster` CLI）として実行され、**JSON エンベロープ**を返します。
- ツールが `needs_approval` を返した場合は、`resumeToken` と `approve` フラグを使って再開します。
- このツールは**オプションのプラグイン**であり、`tools.alsoAllow: ["lobster"]` で追加的に有効化します（推奨）。
- Lobster を使うには、`lobster` CLI が `PATH` 上に存在している必要があります。

使い方と例の詳細は [Lobster](/tools/lobster) を参照してください。

## メインセッションと独立セッション

Heartbeat と cron はどちらもメインセッションと連携できますが、方法は異なります。

|              | Heartbeat                     | Cron (main)               | Cron (isolated)          |
| ------------ | ----------------------------- | ------------------------- | ------------------------ |
| セッション   | Main                          | Main（system event 経由） | `cron:<jobId>`           |
| 履歴         | 共有                          | 共有                      | 実行ごとに新規           |
| コンテキスト | 完全                          | 完全                      | なし（クリーン開始）     |
| モデル       | メインセッションのモデル      | メインセッションのモデル  | 上書き可能               |
| 出力         | `HEARTBEAT_OK` でなければ配信 | Heartbeat prompt + event  | Announce summary（既定） |

### メインセッション cron を使う場面

次のような場合は、`--session main` と `--system-event` を使います。

- リマインダーやイベントをメインセッションのコンテキストに表示したい
- エージェントに次の heartbeat で完全なコンテキストを使って処理させたい
- 別の独立実行は不要

```bash
openclaw cron add \
  --name "Check project" \
  --every "4h" \
  --session main \
  --system-event "Time for a project health check" \
  --wake now
```

### 独立 cron を使う場面

次のような場合は、`--session isolated` を使います。

- 事前コンテキストなしのクリーンな状態で始めたい
- 異なるモデルや thinking 設定を使いたい
- 要約をチャンネルに直接 announce したい
- メインセッションを履歴で埋めたくない

```bash
openclaw cron add \
  --name "Deep analysis" \
  --cron "0 6 * * 0" \
  --session isolated \
  --message "Weekly codebase analysis..." \
  --model opus \
  --thinking high \
  --announce
```

## コストに関する考慮点

| 仕組み          | コスト特性                                                 |
| --------------- | ---------------------------------------------------------- |
| Heartbeat       | N 分ごとに 1 ターン。`HEARTBEAT.md` の大きさに応じて増加   |
| Cron (main)     | 次の heartbeat にイベントを追加する（独立ターンなし）      |
| Cron (isolated) | ジョブごとに完全なエージェントターン。安価なモデルも使える |

**ヒント**:

- トークンオーバーヘッドを抑えるため、`HEARTBEAT.md` は小さく保ってください。
- 似たチェックは複数の cron ジョブに分けず、heartbeat にまとめてください。
- 内部処理だけが必要なら、heartbeat で `target: "none"` を使ってください。
- 定常タスクには、より安価なモデルを指定した独立 cron を使ってください。

## 関連

- [Heartbeat](/gateway/heartbeat) - heartbeat 設定の詳細
- [Cron jobs](/automation/cron-jobs) - cron CLI / API リファレンスの詳細
- [System](/cli/system) - system event と heartbeat 制御
