---
summary: "/think + /verbose のディレクティブ構文とそれらがモデル推論に与える影響"
read_when:
  - 思考または詳細なディレクティブ解析またはデフォルトの調整
title: "OpenClaw思考レベル設定の使い方と制御ポイントガイド"
description: "2. セッションオーバーライド (ディレクティブ専用メッセージの送信によって設定)。3. グローバルデフォルト (構成内の agents.defaults.thinkingDefault)。"
x-i18n:
  source_hash: "8553ee7532439b0c61346679a95063049c9430e6bf5307012154bb9735bed961"
---
## 何をするのか

- 受信本文内のインライン ディレクティブ: `/t <level>`、`/think:<level>`、または `/thinking <level>`。
- レベル (エイリアス): `off | minimal | low | medium | high | xhigh | adaptive`
  - ミニマル→「考える」
  - 低い → 「よく考える」
  - 中 → 「もっとよく考える」
  - 高 → 「超考える」（最大予算）
  - xhigh → 「ultrathink+」 (GPT-5.2 + Codex モデルのみ)
  - 適応→プロバイダー管理の適応推論バジェット (Anthropic Claude 4.6 モデル ファミリでサポート)
  - `x-high`、`x_high`、`extra-high`、`extra high`、および `extra_high` は `xhigh` にマップされます。
  - `highest`、`max` は `high` にマップされます。
- プロバイダーのメモ:
  - Anthropic Claude 4.6 モデルは、明示的思考レベルが設定されていない場合、デフォルトで `adaptive` になります。
  - Z.AI (`zai/*`) は二項思考 (`on`/`off`) のみをサポートします。 `off` 以外のレベルは、`on` として扱われます (`low` にマップされます)。
  - ムーンショット (`moonshot/*`) は、`/think off` を `thinking: { type: "disabled" }` にマッピングし、`off` 以外のレベルを `thinking: { type: "enabled" }` にマッピングします。思考が有効な場合、Moonshot は `tool_choice` `auto|none` のみを受け入れます。 OpenClaw は、互換性のない値を `auto` に正規化します。

## 解決順序1. メッセージのインライン ディレクティブ (そのメッセージにのみ適用されます)

2. セッションオーバーライド (ディレクティブ専用メッセージの送信によって設定)。
3. グローバルデフォルト (構成内の `agents.defaults.thinkingDefault`)。
4. フォールバック: Anthropic Claude 4.6 モデルの場合は `adaptive`、他の推論可能なモデルの場合は `low`、それ以外の場合は `off`。

## セッションのデフォルトの設定

- ディレクティブ **のみ** のメッセージを送信します (空白は許可されます)。 `/think:medium` または `/t high`。
- 現在のセッションに適用されます (デフォルトでは送信者ごと)。 `/think:off` またはセッション アイドル リセットによってクリアされます。
- 確認応答が送信されます (`Thinking level set to high.` / `Thinking disabled.`)。レベルが無効な場合 (`/thinking big` など)、コマンドはヒントとともに拒否され、セッション状態は変更されません。
- 現在の思考レベルを確認するには、引数なしで `/think` (または `/think:`) を送信します。

## 代理人による申請

- **埋め込み Pi**: 解決されたレベルは、インプロセス Pi エージェント ランタイムに渡されます。

## 冗長ディレクティブ (/verbose または /v)- レベル: `on` (最小) | `full` | `off` (デフォルト)

- ディレクティブのみのメッセージはセッションの詳細を切り替え、`Verbose logging enabled.` / `Verbose logging disabled.` を返します。無効なレベルは状態を変更せずにヒントを返します。
- `/verbose off` は明示的なセッション オーバーライドを保存します。セッション UI から `inherit` を選択してクリアします。
- インラインディレクティブはそのメッセージのみに影響します。それ以外の場合は、セッション/グローバルのデフォルトが適用されます。
- 現在の冗長レベルを確認するには、引数なしで `/verbose` (または `/verbose:`) を送信します。
- Verbose がオンの場合、構造化ツールの結果を発行するエージェント (Pi、他の JSON エージェント) は、各ツール コールバックを独自のメタデータ専用メッセージとして送信し、利用可能な場合は `<emoji> <tool-name>: <arg>` というプレフィックス (パス/コマンド) を付けます。これらのツールの概要は、ストリーミング デルタとしてではなく、各ツールが開始されるとすぐに送信されます (個別のバブル)。
- ツール障害の概要は通常モードでも表示されたままですが、詳細が `on` または `full` でない限り、生のエラー詳細サフィックスは非表示になります。
- 詳細が `full` の場合、ツール出力も完了後に転送されます (別個のバブル、安全な長さに切り詰められます)。実行中に `/verbose on|full|off` を切り替えると、後続のツール バブルでは新しい設定が適用されます。

## 推論の可視性 (/reasoning)- レベル: `on|off|stream`

- ディレクティブのみのメッセージは、返信に思考ブロックを表示するかどうかを切り替えます。
- 有効にすると、推論は `Reasoning:` というプレフィックスが付いた **別のメッセージ**として送信されます。
- `stream` (Telegram のみ): 応答の生成中に推論を Telegram ドラフト バブルにストリーミングし、推論なしで最終的な回答を送信します。
- エイリアス: `/reason`。
- 現在の推論レベルを確認するには、引数なしで `/reasoning` (または `/reasoning:`) を送信します。

## 関連

- 昇格モードのドキュメントは [昇格モード](/tools/elevated) にあります。

## 心拍数

- ハートビート プローブ本体は、構成されたハートビート プロンプトです (デフォルト: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`)。ハートビート メッセージ内のインライン ディレクティブは通常どおり適用されます (ただし、ハートビートからセッションのデフォルトを変更することは避けてください)。
- ハートビート配信のデフォルトは最終ペイロードのみです。個別の `Reasoning:` メッセージ (利用可能な場合) も送信するには、`agents.defaults.heartbeat.includeReasoning: true` またはエージェントごとに `agents.list[].heartbeat.includeReasoning: true` を設定します。

## Web チャット UI

- Web チャット思考セレクターは、ページの読み込み時に受信セッション ストア/構成からセッションの保存されたレベルをミラーリングします。
- 別のレベルを選択すると、次のメッセージ (`thinkingOnce`) にのみ適用されます。送信後、セレクターは保存されたセッション レベルに戻ります。
- セッションのデフォルトを変更するには、(以前と同様に) `/think:<level>` ディレクティブを送信します。セレクターは次回のリロード後にそれを反映します。
