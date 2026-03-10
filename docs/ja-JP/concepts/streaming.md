---
summary: "ストリーミング + チャンク動作 (ブロック返信、チャンネル プレビュー ストリーミング、モード マッピング)"
read_when:
  - チャネル上でストリーミングまたはチャンクがどのように機能するかを説明する
  - ブロックストリーミングまたはチャネルチャンキング動作の変更
  - 重複/早期ブロック返信またはチャンネル プレビュー ストリーミングのデバッグ
title: "ストリーミングとチャンク化"
x-i18n:
  source_hash: "e2bde094e3959b878b027264d550c77a3aae3c883785fd634fef1246e6d3f23d"
---

# ストリーミング + チャンキング

OpenClaw には 2 つの独立したストリーミング レイヤーがあります。

- **ブロック ストリーミング (チャネル):** アシスタントが書き込みを行うと、完了した**ブロック**が送信されます。これらは通常のチャネル メッセージです (トークン デルタではありません)。
- **プレビュー ストリーミング (Telegram/Discord/Slack):** 生成中に一時的な **プレビュー メッセージ**を更新します。

現在、チャネル メッセージに対する **真のトークンデルタ ストリーミング**はありません。プレビュー ストリーミングはメッセージ ベースです (送信 + 編集/追加)。

## ストリーミングをブロックする (チャネル メッセージ)

ブロック ストリーミングは、アシスタント出力が利用可能になると、粗いチャンクで送信します。

```
Model output
  └─ text_delta/events
       ├─ (blockStreamingBreak=text_end)
       │    └─ chunker emits blocks as buffer grows
       └─ (blockStreamingBreak=message_end)
            └─ chunker flushes at message_end
                   └─ channel send (block replies)
```

凡例:

- `text_delta/events`: モデル ストリーム イベント (非ストリーミング モデルの場合はスパースである可能性があります)。
- `chunker`: `EmbeddedBlockChunker` 最小/最大境界 + ブレーク設定を適用します。
- `channel send`: 実際の送信メッセージ (ブロック返信)。

**コントロール:**- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (デフォルトはオフ)。

- チャネル オーバーライド: `*.blockStreaming` (およびアカウントごとのバリアント) により、チャネルごとに `"on"`/`"off"` が強制されます。
- `agents.defaults.blockStreamingBreak`: `"text_end"` または `"message_end"`。
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`。
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (送信前にストリーミングされたブロックをマージします)。
- チャネルハードキャップ: `*.textChunkLimit` (例: `channels.whatsapp.textChunkLimit`)。
- チャネルチャンクモード: `*.chunkMode` (`length` デフォルト、`newline` は長さをチャンクする前に空白行 (段落境界) で分割します)。
- Discord のソフト キャップ: `channels.discord.maxLinesPerMessage` (デフォルト 17) は、UI のクリッピングを避けるために長い返信を分割します。

**境界セマンティクス:**

- `text_end`: チャンカーが放出されるとすぐにブロックをストリームします。各 `text_end` でフラッシュします。
- `message_end`: アシスタント メッセージが終了するまで待機し、バッファされた出力をフラッシュします。

`message_end` は、バッファリングされたテキストが `maxChars` を超える場合でもチャンカーを使用するため、最後に複数のチャンクを出力できます。

## チャンク化アルゴリズム (下限/上限)

ブロック チャンクは `EmbeddedBlockChunker` によって実装されます。- **下限:** バッファ >= `minChars` まで放出しません (強制されない限り)。

- **上限:** `maxChars` より前の分割を優先します。強制する場合は、`maxChars` で分割します。
- **ブレーク設定:** `paragraph` → `newline` → `sentence` → `whitespace` → ハード ブレーク。
- **コード フェンス:** フェンス内で分割されることはありません。 `maxChars` で強制された場合は、マークダウンを有効に保つためにフェンスを閉じて再度開きます。

`maxChars` はチャネル `textChunkLimit` にクランプされているため、チャネルごとの上限を超えることはできません。

## 合体 (ストリームされたブロックをマージ)

ブロック ストリーミングが有効な場合、OpenClaw は **連続したブロック チャンクをマージ**できます
発送する前に。これにより、「単一行スパム」が減少すると同時に、
プログレッシブ出力。

- 合体は、フラッシュする前に **アイドル ギャップ** (`idleMs`) を待機します。
- バッファは `maxChars` で制限されており、それを超えるとフラッシュされます。
- `minChars` は、十分なテキストが蓄積されるまで小さなフラグメントの送信を防止します
  (最後のフラッシュは常に残りのテキストを送信します)。
- ジョイナーは `blockStreamingChunk.breakPreference` から派生します
  (`paragraph` → `\n\n`、`newline` → `\n`、`sentence` → スペース)。
- チャネル オーバーライドは `*.blockStreamingCoalesce` 経由で利用できます (アカウントごとの構成を含む)。
- デフォルトの結合 `minChars` は、オーバーライドされない限り、Signal/Slack/Discord の場合は 1500 に上がります。

## ブロック間の人間のようなペース調整ブロック ストリーミングが有効になっている場合、次の間隔に **ランダムな一時停止**を追加できます

返信をブロックします (最初のブロックの後)。これにより、マルチバブルのレスポンスが感じられます。
より自然に。

- 構成: `agents.defaults.humanDelay` (`agents.list[].humanDelay` を介してエージェントごとに上書き)。
- モード: `off` (デフォルト)、`natural` (800 ～ 2500ms)、`custom` (`minMs`/`maxMs`)。
- **ブロック返信**にのみ適用され、最終返信やツールの概要には適用されません。

## 「チャンクまたはすべてをストリーム」

これは以下にマッピングされます。

- **ストリーム チャンク:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (進行中に放出)。 Telegram 以外のチャネルにも `*.blockStreaming: true` が必要です。
- **最後にすべてをストリーミングします:** `blockStreamingBreak: "message_end"` (一度フラッシュします。非常に長い場合は複数のチャンクをフラッシュする可能性があります)。
- **ブロック ストリーミングなし:** `blockStreamingDefault: "off"` (最終応答のみ)。

**チャンネルメモ:** ブロック ストリーミングは **以下の場合はオフになります**
`*.blockStreaming` は明示的に `true` に設定されます。チャンネルはライブ プレビューをストリーミングできます
(`channels.<channel>.streaming`) ブロック返信なし。

構成の場所のリマインダー: `blockStreaming*` のデフォルトは以下にあります
`agents.defaults`、ルート構成ではありません。

## ストリーミング モードをプレビューする

正規キー: `channels.<channel>.streaming`

モード:- `off`: プレビュー ストリーミングを無効にします。

- `partial`: 最新のテキストに置き換えられる単一のプレビュー。
- `block`: チャンク化/追加されたステップで更新をプレビューします。
- `progress`: 生成中の進行状況/ステータスのプレビュー、完了時の最終回答。

### チャネルマッピング

| チャンネル | `off` | `partial` | `block` | `progress`                 |
| ---------- | ----- | --------- | ------- | -------------------------- |
| Telegram       | ✅    | ✅        | ✅      | `partial` にマップします。 |
| 不和       | ✅    | ✅        | ✅      | `partial` にマップします。 |
| スラック   | ✅    | ✅        | ✅      | ✅                         |

Slack のみ:

- `channels.slack.nativeStreaming` は、`streaming=partial` の場合の Slack ネイティブ ストリーミング API 呼び出しを切り替えます (デフォルト: `true`)。

レガシーキーの移行:

- テレグラム: `streamMode` + ブール値 `streaming` は `streaming` 列挙型に自動移行します。
- Discord: `streamMode` + ブール値 `streaming` は `streaming` 列挙型に自動移行します。
- Slack: `streamMode` は `streaming` 列挙型に自動移行します。ブール値 `streaming` は `nativeStreaming` に自動移行されます。

### 実行時の動作

Telegram:

- `sendMessage` + `editMessageText` を使用して、DM およびグループ/トピック全体で更新をプレビューします。
- Telegram ブロック ストリーミングが明示的に有効になっている場合 (二重ストリーミングを避けるため)、プレビュー ストリーミングはスキップされます。
- `/reasoning stream` はプレビューに推論を書くことができます。不和：

- プレビュー メッセージの送信と編集を使用します。
- `block` モードでは、ドラフト チャンキング (`draftChunk`) が使用されます。
- Discord ブロック ストリーミングが明示的に有効になっている場合、プレビュー ストリーミングはスキップされます。

スラック:

- `partial` は、利用可能な場合は Slack ネイティブ ストリーミング (`chat.startStream`/`append`/`stop`) を使用できます。
- `block` は、追加スタイルのドラフト プレビューを使用します。
- `progress` は、ステータス プレビュー テキストを使用してから、最終的な回答を使用します。
