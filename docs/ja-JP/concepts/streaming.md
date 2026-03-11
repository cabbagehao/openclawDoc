---
summary: "ストリーミングとチャンク化（分割送信）の挙動: ブロック返信、プレビュー表示、モードのマッピング"
read_when:
  - チャネル上でのストリーミングやチャンク化の仕組みを知りたい場合
  - ブロックストリーミングやチャネル固有の分割動作を変更したい場合
  - 重複した返信や、プレビュー表示の不具合をデバッグしている場合
title: "ストリーミングとチャンク化"
x-i18n:
  source_hash: "e2bde094e3959b878b027264d550c77a3aae3c883785fd634fef1246e6d3f23d"
---

# ストリーミングとチャンク化

OpenClaw には、2 つの異なるストリーミング層があります:

- **ブロックストリーミング (チャネル)**: アシスタントが回答を生成する過程で、完了した「ブロック」単位でメッセージを送信します。これらは通常のチャネルメッセージ（吹き出し）として届きます。
- **プレビュー表示 (Telegram/Discord/Slack)**: 回答の生成中に、一時的な「プレビューメッセージ」の内容をリアルタイムで更新し続けます。

現時点では、チャネルメッセージに対する **完全なトークン単位のストリーミング** はありません。プレビュー表示はメッセージベースの処理（送信、編集、追記）によって実現されています。

## ブロックストリーミング (チャネルメッセージ)

ブロックストリーミングは、アシスタントの出力が一定量まとまるたびに、粗いチャンク（塊）として送信します。

```
モデルの出力
  └─ text_delta (差分) / イベント
       ├─ (blockStreamingBreak=text_end の場合)
       │    └─ チャンカーがバッファの蓄積に合わせてブロックを発行
       └─ (blockStreamingBreak=message_end の場合)
            └─ ターン終了時にまとめてフラッシュ (送信)
                   └─ チャネル送信 (ブロック単位の返信)
```

**コントロール項目:**
- `agents.defaults.blockStreamingDefault`: `"on"` / `"off"` (デフォルトは off)。
- チャネルごとの上書き: `*.blockStreaming` (およびアカウントごとの設定)。チャネルごとに強制的に有効・無効を切り替えられます。
- `agents.defaults.blockStreamingBreak`: `"text_end"` (文の区切りなど) または `"message_end"` (ターンの終わり)。
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }` (最小/最大文字数と分割優先度)。
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (送信前に短いチャンクを結合)。
- チャネルのハードリミット: `*.textChunkLimit` (例: WhatsApp は 4000 文字)。
- チャネルの分割モード: `*.chunkMode` (`length` (デフォルト) または `newline` (空行による段落区切りを優先))。
- Discord のソフトリミット: `channels.discord.maxLinesPerMessage` (デフォルト 17 行)。UI での表示切れを防ぐために縦に長い返信を分割します。

**区切りのセマンティクス:**
- `text_end`: チャンカーがブロックを切り出した直後に送信します。各 `text_end` イベントでフラッシュされます。
- `message_end`: アシスタントの生成が完全に終了するまで待ち、バッファに溜まった内容をフラッシュします。

`message_end` を使用した場合でも、バッファ内のテキストが `maxChars` を超えている場合はチャンカーが動作し、最終的に複数の吹き出しに分かれて送信されることがあります。

## チャンク化アルゴリズム (最小/最大範囲)

ブロックの切り出しは `EmbeddedBlockChunker` によって行われます:

- **最小範囲 (Low bound)**: バッファが `minChars` 以上になるまで（強制されない限り）送信しません。
- **最大範囲 (High bound)**: `maxChars` を超える前に分割することを優先しますが、適切な区切りが見つからず上限に達した場合はそこで強制的に分割します。
- **分割の優先度 (Break preference)**: 段落 (`paragraph`) → 改行 (`newline`) → 文の終わり (`sentence`) → 空白 (`whitespace`) → 強制分割。
- **コードブロック (Code fences)**: 原則としてコードブロック内で分割しません。どうしても `maxChars` で分割が必要な場合は、Markdown の整合性を保つために、一度ブロックを閉じて次のメッセージで開き直します。

`maxChars` は各チャネルの `textChunkLimit` を超えないように自動的に調整（クランプ）されます。

## 結合 (ストリームされたブロックのマージ)

ブロックストリーミングが有効な場合、OpenClaw は送信前に **連続するチャンクをマージ（結合）** することができます。これにより、短いメッセージが連投されるのを防ぎつつ、段階的な出力を提供できます。

- 結合処理は、入力が止まるまで（`idleMs`）フラッシュを待ちます。
- バッファが `maxChars` を超えた場合は、タイマーに関わらずフラッシュされます。
- `minChars` 設定により、十分なテキストが蓄積されるまで小さな断片の送信を保留します（最終的なフラッシュでは残りのテキストがすべて送信されます）。
- 結合時の繋ぎ目は `blockStreamingChunk.breakPreference` に基づきます（段落 → `\n\n`、改行 → `\n`、文末 → スペース）。
- チャネルごとの上書き設定は `*.blockStreamingCoalesce` で可能です。
- Signal, Slack, Discord では、上書きがない場合のデフォルトの結合文字数 `minChars` が 1500 に引き上げられています。

## ブロック間の人間らしい一時停止 (Human-like pacing)

ブロックストリーミングが有効な場合、複数の吹き出しを送信する間に **ランダムな一時停止** を挟むことができます。これにより、複数メッセージでの回答がより自然に感じられるようになります。

- 構成: `agents.defaults.humanDelay` (エージェントごとの上書きは `agents.list[].humanDelay`)。
- モード: `off` (デフォルト), `natural` (800〜2500ms), `custom` (`minMs`/`maxMs` を指定)。
- 対象: ブロック返信（部分的な回答）にのみ適用されます。最終的な回答やツールの要約には適用されません。

## ストリーミングのパターン

- **チャンクごとにストリーム**: `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"`。Telegram 以外のチャネルでは `*.blockStreaming: true` も必要です。
- **最後にまとめて送信**: `blockStreamingBreak: "message_end"`。回答が非常に長い場合は複数の吹き出しになる可能性があります。
- **ブロックストリーミングなし**: `blockStreamingDefault: "off"`。回答が完了してから最終的なメッセージのみを送信します。

**チャネルに関する注意**: ブロックストリーミングは、`*.blockStreaming` が明示的に `true` に設定されていない限り **オフ** です。チャネル側でプレビュー表示設定 (`channels.<channel>.streaming`) が有効であっても、ブロック返信が行われるとは限りません。

## プレビュー表示モード

構成キー: `channels.<channel>.streaming`

モード:
- `off`: プレビュー表示を無効にします。
- `partial`: 1 つのプレビューメッセージを最新のテキストで常に上書きします。
- `block`: プレビューメッセージにチャンク（塊）を追記していきます。
- `progress`: 生成中は進捗やステータスを表示し、完了後に最終的な回答に置き換えます。

### チャネルごとの対応状況

| チャネル | `off` | `partial` | `block` | `progress` |
| :--- | :---: | :---: | :---: | :---: |
| Telegram | ✅ | ✅ | ✅ | `partial` として動作 |
| Discord | ✅ | ✅ | ✅ | `partial` として動作 |
| Slack | ✅ | ✅ | ✅ | ✅ |

Slack 専用:
- `channels.slack.nativeStreaming`: `streaming=partial` の場合に Slack ネイティブのストリーミング API を使用するかどうか (デフォルト: `true`)。

レガシー設定の移行:
- Telegram/Discord: `streamMode` やブール値の `streaming` は、自動的に新しい enum 形式に移行されます。
- Slack: `streamMode` は新しい enum 形式に、ブール値の `streaming` は `nativeStreaming` に移行されます。

### 実行時の挙動

**Telegram:**
- DM およびグループ/トピックにおいて、`sendMessage` + `editMessageText` を使用して更新します。
- Telegram のブロックストリーミングが有効な場合、表示の重複を避けるためにプレビュー表示はスキップされます。
- `/reasoning stream` が設定されている場合、推論プロセスをプレビューに書き込むことができます。

**Discord:**
- プレビューメッセージの送信と編集（edit）を使用します。
- `block` モードでは、ドラフト用のチャンク化 (`draftChunk`) が使用されます。
- Discord のブロックストリーミングが有効な場合、プレビュー表示はスキップされます。

**Slack:**
- `partial` モードでは、利用可能な場合に Slack ネイティブのストリーミング API (`chat.startStream` / `append` / `stop`) を使用できます。
- `block` モードでは、追記型のドラフトプレビューを使用します。
- `progress` モードでは、ステータスを表示した後に最終回答を投稿します。
