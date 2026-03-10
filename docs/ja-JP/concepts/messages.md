---
summary: "メッセージ フロー、セッション、キューイング、および推論の可視性"
read_when:
  - 受信メッセージがどのように返信になるのかを説明する
  - セッション、キューイングモード、またはストリーミング動作の明確化
  - 推論の可視性と使用上の影響を文書化する
title: "メッセージ"
x-i18n:
  source_hash: "773301d5c0c1e3b87d1b7ba6d670400cb8ab65d35943f6d54647490e377c369a"
---

# メッセージ

このページでは、OpenClaw が受信メッセージ、セッション、キューイング、
ストリーミングと推論の可視性。

## メッセージ フロー (高レベル)

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

キーノブは設定内に存在します:

- プレフィックス、キューイング、グループ動作については `messages.*`。
- `agents.defaults.*` ブロック ストリーミングとチャンクのデフォルト。
- キャップとストリーミング切り替えのチャネル オーバーライド (`channels.whatsapp.*`、`channels.telegram.*` など)。

完全なスキーマについては、[構成](/gateway/configuration) を参照してください。

## 受信重複排除

チャネルは再接続後に同じメッセージを再配信できます。 OpenClaw は
チャネル/アカウント/ピア/セッション/メッセージ ID をキーとする短期キャッシュなので重複する
配信によって別のエージェントが実行されることはありません。

## インバウンドのデバウンス

**同じ送信者**からの迅速な連続メッセージを 1 つのメッセージにバッチ処理できます。
`messages.inbound` 経由でエージェントに連絡します。デバウンスはチャネル + 会話ごとにスコープが設定されます
そして、返信スレッド/ID に最新のメッセージを使用します。

構成 (グローバルデフォルト + チャネルごとのオーバーライド):

```json5
{
  messages: {
    inbound: {
      debounceMs: 2000,
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
        discord: 1500,
      },
    },
  },
}
```

注:

- デバウンスは **テキストのみ** メッセージに適用されます。メディア/添付ファイルはすぐにフラッシュされます。
- 制御コマンドはデバウンスをバイパスするため、スタンドアロンのままになります。

## セッションとデバイス

セッションはクライアントではなくゲートウェイによって所有されます。- ダイレクト チャットはエージェントのメイン セッション キーに折りたたまれます。

- グループ/チャネルは独自のセッション キーを取得します。
- セッション ストアとトランスクリプトはゲートウェイ ホスト上に存在します。

複数のデバイス/チャネルを同じセッションにマッピングできますが、履歴は完全ではありません
すべてのクライアントに同期されます。推奨事項: 1 つのプライマリ デバイスを長期間使用する
文脈の相違を避けるための会話。コントロール UI と TUI には常に、
ゲートウェイでバックアップされたセッション記録なので、これらが真実の情報源となります。

詳細: [セッション管理](/concepts/session)。

## インバウンド本文と履歴コンテキスト

OpenClaw は **プロンプト本文**を **コマンド本文**から分離します。

- `Body`: エージェントに送信されるプロンプト テキスト。これには、チャネル エンベロープと
  オプションの履歴ラッパー。
- `CommandBody`: ディレクティブ/コマンド解析用の生のユーザー テキスト。
- `RawBody`: `CommandBody` のレガシー エイリアス (互換性のために保持)。

チャネルが履歴を提供する場合、共有ラッパーを使用します。

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

**非直接チャット** (グループ/チャネル/ルーム) の場合、**現在のメッセージ本文** の先頭に
送信者ラベル (履歴エントリに使用されるのと同じスタイル)。これにより、リアルタイムとキュー/履歴が保持されます。
エージェントのプロンプト内で一貫したメッセージが表示されます。履歴バッファは **保留専用**です。履歴バッファには、_not_ されたグループ メッセージが含まれます。
実行のトリガー (メンションゲート メッセージなど) および **除外** メッセージ
すでにセッション記録にあります。

ディレクティブの削除は **現在のメッセージ** セクションにのみ適用されるため、履歴
無傷のままです。履歴をラップするチャネルは `CommandBody` (または
`RawBody`) を元のメッセージ テキストに変更し、`Body` を結合されたプロンプトとして保持します。
履歴バッファは `messages.groupChat.historyLimit` (グローバル
デフォルト）および `channels.slack.historyLimit` のようなチャネルごとのオーバーライドまたは
`channels.telegram.accounts.<id>.historyLimit` (`0` を無効に設定)。

## キューイングとフォローアップ

実行がすでにアクティブな場合、受信メッセージはキューに入れられ、
現在の実行、またはフォローアップターンのために収集されます。

- `messages.queue` (および `messages.queue.byChannel`) 経由で構成します。
- モード: `interrupt`、`steer`、`followup`、`collect`、およびバックログのバリアント。

詳細: [キューイング](/concepts/queue)。

## ストリーミング、チャンキング、バッチ処理

ブロック ストリーミングは、モデルがテキスト ブロックを生成するときに部分的な応答を送信します。
チャンク化では、チャネル テキストの制限が尊重され、フェンスで囲まれたコードの分割が回避されます。

主要な設定:- `agents.defaults.blockStreamingDefault` (`on|off`、デフォルトはオフ)

- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (アイドルベースのバッチ処理)
- `agents.defaults.humanDelay` (ブロック返信間の人間のような一時停止)
- チャネルオーバーライド: `*.blockStreaming` および `*.blockStreamingCoalesce` (テレグラム以外のチャネルには明示的な `*.blockStreaming: true` が必要です)

詳細: [ストリーミング + チャンキング](/concepts/streaming)。

## 可視性とトークンの推論

OpenClaw はモデル推論を公開または非表示にすることができます。

- `/reasoning on|off|stream` は可視性を制御します。
- 推論コンテンツは、モデルによって生成されたときにもトークンの使用量にカウントされます。
- Telegram は、ドラフト バブルへの推論ストリームをサポートします。

詳細: [思考 + 推論ディレクティブ](/tools/thinking) および [トークンの使用](/reference/token-use)。

## プレフィックス、スレッド化、および応答

送信メッセージの書式設定は `messages` に集中されています。

- `messages.responsePrefix`、`channels.<channel>.responsePrefix`、および `channels.<channel>.accounts.<id>.responsePrefix` (送信プレフィックス カスケード)、および `channels.whatsapp.messagePrefix` (WhatsApp 受信プレフィックス)
- `replyToMode` およびチャネルごとのデフォルトによる応答スレッド

詳細: [構成](/gateway/configuration#messages) およびチャネル ドキュメント。
