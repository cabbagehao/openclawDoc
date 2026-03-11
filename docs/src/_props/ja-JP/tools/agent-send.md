---
summary: "直接の「openclaw エージェント」 CLI の実行 (オプションの配信あり)"
read_when:
  - エージェント CLI エントリポイントの追加または変更
title: "エージェント送信"
x-i18n:
  source_hash: "a84d6a304333eebe155da2bf24cf5fc0482022a0a48ab34aa1465cd6e667022d"
---

# `openclaw agent` (直接エージェントを実行)

`openclaw agent` は、受信チャット メッセージを必要とせずに、単一のエージェント ターンを実行します。
デフォルトでは、**ゲートウェイ**を経由します。 `--local` を追加して埋め込みを強制します
現在のマシンのランタイム。

## 動作

* 必須: `--message <text>`
* セッションの選択:
  * `--to <dest>` はセッション キーを取得します (グループ/チャネル ターゲットは分離を維持します。直接チャットは `main` に折りたたまれます)、**または**
  * `--session-id <id>` は、ID、**または** によって既存のセッションを再利用します。
  * `--agent <id>` は、設定されたエージェントを直接ターゲットにします (そのエージェントの `main` セッション キーを使用します)
* 通常の受信応答と同じ組み込みエージェント ランタイムを実行します。
* 思考/冗長フラグはセッション ストアに永続化されます。
* 出力:
  * デフォルト: 返信テキスト (および `MEDIA:<url>` 行) を印刷します。
  * `--json`: 構造化ペイロード + メタデータを出力します
* `--deliver` + `--channel` を使用してチャネルに返送するオプションの配信 (ターゲット形式は `openclaw message --target` と一致します)。
* `--reply-channel`/`--reply-to`/`--reply-account` を使用して、セッションを変更せずに配信を上書きします。

ゲートウェイに到達できない場合、CLI は埋め込まれたローカル実行に **フォールバック**します。

## 例

```bash
openclaw agent --to +15555550123 --message "status update"
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --to +15555550123 --message "Summon reply" --deliver
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
```

## フラグ- `--local`: ローカルで実行します (シェルにモデル プロバイダー API キーが必要です)

* `--deliver`: 選択したチャネルに応答を送信します
* `--channel`: 配信チャネル (`whatsapp|telegram|discord|googlechat|slack|signal|imessage`、デフォルト: `whatsapp`)
* `--reply-to`: 配信ターゲットの上書き
* `--reply-channel`: 配信チャネルの上書き
* `--reply-account`: 配信アカウント ID の上書き
* `--thinking <off|minimal|low|medium|high|xhigh>`: 持続思考レベル (GPT-5.2 + Codex モデルのみ)
* `--verbose <on|full|off>`: 詳細レベルを保持します
* `--timeout <seconds>`: エージェントのタイムアウトを上書きします
* `--json`: 構造化された JSON を出力します
