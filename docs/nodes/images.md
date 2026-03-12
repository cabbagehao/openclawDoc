---
summary: "送信、ゲートウェイ、エージェント返信における画像 / メディア処理ルール"
read_when:
  - メディアパイプラインや添付ファイル処理を変更するとき
title: "OpenClawの画像とメディア理解機能の設定方法と解析ガイド"
description: "WhatsApp チャンネルは Baileys Web で動作します。この文書では、送信、gateway、エージェント返信における現在のメディア処理ルールを整理します。"
x-i18n:
  source_hash: "971aed398ea01078efbad7a8a4bca17f2a975222a2c4db557565e4334c9450e0"
---
WhatsApp チャンネルは **Baileys Web** で動作します。この文書では、送信、gateway、エージェント返信における現在のメディア処理ルールを整理します。

## 目標

- `openclaw message send --media` で、任意の caption 付きメディアを送信できるようにする
- Web inbox からの自動返信で、テキストと一緒にメディアを返せるようにする
- メディア種別ごとの制限を妥当で予測可能なものに保つ

## CLI surface

- `openclaw message send --media <path-or-url> [--message <caption>]`
  - `--media` は任意。メディアのみ送る場合、caption は空でもよい
  - `--dry-run` は解決済みペイロードを表示する
  - `--json` は `{ channel, to, messageId, mediaUrl, caption }` を出力する

## WhatsApp Web channel の挙動

- 入力: ローカルファイルパス **または** HTTP(S) URL
- 処理フロー: Buffer に読み込み、メディア種別を判定し、適切なペイロードを構築する
  - **画像**: `agents.defaults.mediaMaxMb`（デフォルト 5 MB）を目安に JPEG へリサイズ / 再圧縮し、最大辺 2048 px、上限 6 MB
  - **音声 / voice / 動画**: 16 MB までパススルー。音声は voice note（`ptt: true`）として送信
  - **ドキュメント**: それ以外は document 扱いで最大 100 MB。可能ならファイル名を保持
- WhatsApp の GIF 風再生には、`gifPlayback: true` 付きの MP4 を送る（CLI: `--gif-playback`）。モバイルクライアントではインラインループする
- MIME 判定は magic bytes、header、ファイル拡張子の順で優先する
- caption は `--message` または `reply.text` から取得する。空 caption も許可される
- logging は、非 verbose では `↩️` / `✅` を表示し、verbose ではサイズと元の path / URL まで出す

## 自動返信パイプライン

- `getReplyFromConfig` は `{ text?, mediaUrl?, mediaUrls? }` を返す
- メディアがある場合、Web sender は `openclaw message send` と同じパイプラインでローカル path または URL を解決する
- 複数メディアが指定された場合は順番に送信する

## コマンド向け受信メディア（Pi）

- 受信した Web メッセージにメディアが含まれる場合、OpenClaw は一時ファイルへダウンロードし、テンプレート変数を公開する
  - `{{MediaUrl}}`: 受信メディア用の擬似 URL
  - `{{MediaPath}}`: コマンド実行前に書き込まれたローカル一時パス
- セッション単位の Docker サンドボックスが有効な場合、受信メディアはサンドボックス workspace にコピーされ、`MediaPath` / `MediaUrl` は `media/inbound/<filename>` のような相対パスへ書き換えられる
- メディア理解（`tools.media.*` または共有 `tools.media.models` で設定）が有効なら、テンプレート展開前に実行され、`Body` に `[Image]`、`[Audio]`、`[Video]` ブロックを挿入できる
  - 音声では `{{Transcript}}` が設定され、コマンド解析にも transcript を使うため slash command が引き続き機能する
  - 動画 / 画像の説明では、caption テキストもコマンド解析用に保持される
- デフォルトでは、最初に一致した画像 / 音声 / 動画添付だけを処理する。複数添付を扱うには `tools.media.<cap>.attachments` を設定する

## 制限とエラー

**送信時の上限（WhatsApp Web send）**

- 画像: 再圧縮後でおよそ 6 MB 上限
- 音声 / voice / 動画: 16 MB 上限
- document: 100 MB 上限
- サイズ超過または読み取り不能なメディアは、ログに明確なエラーを残して返信をスキップする

**メディア理解時の上限（文字起こし / 説明）**

- 画像のデフォルト: 10 MB（`tools.media.image.maxBytes`）
- 音声のデフォルト: 20 MB（`tools.media.audio.maxBytes`）
- 動画のデフォルト: 50 MB（`tools.media.video.maxBytes`）
- サイズ超過メディアでは understanding はスキップされるが、返信自体は元の本文で継続する

## テストメモ

- 画像 / 音声 / document の送信 + 返信フローをカバーする
- 画像の再圧縮（サイズ制限）と、音声の voice-note flag を検証する
- マルチメディア返信が順次送信として fan-out されることを確認する
