---
summary: "`openclaw message` の CLI リファレンス (送信およびチャネル操作)"
read_when:
  - CLI からのメッセージ送信やチャネル固有のアクションを追加・変更する場合
  - アウトバウンド（送信）チャネルの動作を調整する場合
title: "message"
x-i18n:
  source_hash: "41b8483f92051e5ac96eff1887fa03a1c1158876a54a2ae2fdbfb2322bdc98d8"
---

# `openclaw message`

メッセージの送信およびチャネル固有のアクション（Discord, Google Chat, Slack, Mattermost, Telegram, WhatsApp, Signal, iMessage, MS Teams）を一括して管理するためのアウトバウンド用コマンドです。

## 使用法

```bash
openclaw message <subcommand> [flags]
```

チャネルの選択:

* 2 つ以上のチャネルが構成されている場合は、`--channel` フラグが必須です。
* チャネルが 1 つだけ構成されている場合、それがデフォルトの送信先となります。
* 指定可能な値: `whatsapp|telegram|discord|googlechat|slack|mattermost|signal|imessage|msteams` (Mattermost はプラグインが必要です)

宛先（ターゲット）の形式 (`--target`):

* WhatsApp: E.164 形式の電話番号、またはグループ JID。
* Telegram: チャット ID または `@username`。
* Discord: `channel:<id>` または `user:<id>` (または `<@id>` 形式のメンション。数値のみの ID はチャネルとして扱われます)。
* Google Chat: `spaces/<spaceId>` または `users/<userId>`。
* Slack: `channel:<id>` または `user:<id>` (数値のみのチャネル ID も受け入れ可能です)。
* Mattermost (プラグイン): `channel:<id>`, `user:<id>`, または `@username` (プレフィックスなしの ID はチャネルとして扱われます)。
* Signal: `+E.164`, `group:<id>`, `signal:+E.164`, `signal:group:<id>`, または `username:<name>`。
* iMessage: ハンドル, `chat_id:<id>`, `chat_guid:<guid>`, または `chat_identifier:<id>`。
* MS Teams: 会話 ID (`19:...@thread.tacv2`), `conversation:<id>`, または `user:<aad-object-id>`。

名前の解決:

* 対応しているプロバイダー（Discord, Slack など）では、`Help` や `#help` といったチャネル名をキャッシュから解決します。
* キャッシュに存在しない場合、プロバイダーが対応していればライブディレクトリ検索を試みます。

## よく使われるフラグ

* `--channel <name>`
* `--account <id>`
* `--target <dest>` (送信/投票/既読などの対象となるチャネルやユーザー)
* `--targets <name>` (複数指定可能。一斉配信（ブロードキャスト）用)
* `--json`
* `--dry-run`
* `--verbose`

## アクション一覧

### 基本機能

* `send`
  * 対応チャネル: 全チャネル
  * 必須項目: `--target`、および `--message` または `--media`
  * オプション: `--media`, `--reply-to`, `--thread-id`, `--gif-playback`
  * Telegram 専用: `--buttons` (`inlineButtons` 機能の許可が必要)
  * Telegram 専用: `--thread-id` (フォーラムのトピック ID)
  * Slack 専用: `--thread-id` (スレッドのタイムスタンプ。`--reply-to` も同じフィールドを使用します)
  * WhatsApp 専用: `--gif-playback`

* `poll` (投票)
  * 対応チャネル: WhatsApp, Telegram, Discord, Matrix, MS Teams
  * 必須項目: `--target`, `--poll-question`, `--poll-option` (複数指定可)
  * オプション: `--poll-multi` (複数回答)
  * Discord 専用: `--poll-duration-hours`, `--silent`, `--message`
  * Telegram 専用: `--poll-duration-seconds` (5-600秒), `--silent`, `--poll-anonymous` (匿名投票), `--poll-public` (公開投票), `--thread-id`

* `react` (リアクション)
  * 対応チャネル: Discord, Google Chat, Slack, Telegram, WhatsApp, Signal
  * 必須項目: `--message-id`, `--target`
  * オプション: `--emoji`, `--remove` (リアクション削除), `--target-author` (Signal グループ用)
  * 補足: `--remove` を行うには `--emoji` の指定も必要です（[リアクション](/tools/reactions) を参照）。

* `reactions` (リアクション一覧)
  * 対応チャネル: Discord, Google Chat, Slack
  * 必須項目: `--message-id`, `--target`

* `read` (読み取り)
  * 対応チャネル: Discord, Slack
  * 必須項目: `--target`
  * オプション: `--limit`, `--before`, `--after`, `--around` (Discord のみ)

* `edit` (編集) / `delete` (削除) / `pin` (ピン留め)
  * 対応チャネル: Discord, Slack (削除は Telegram も対応)
  * 必須項目: `--message-id`, `--target`

### スレッド (Threads)

* `thread create`: Discord でスレッドを作成。
* `thread list`: Discord のスレッド一覧を取得。
* `thread reply`: 特定のスレッドに返信。

### 絵文字とステッカー (Discord/Slack)

* `emoji list` / `emoji upload`
* `sticker send` / `sticker upload`

### メンバー管理とステータス (Discord/Slack)

* `role info`, `role add`, `role remove` (Discord)
* `member info` (Discord, Slack)
* `voice status` (Discord)

### イベント (Events)

* `event list`, `event create` (Discord)

### モデレーション (Discord)

* `timeout`, `kick`, `ban` (理由の指定や期間設定に対応)

### 一斉配信 (Broadcast)

* `broadcast`: 構成済みのすべてのチャネル（または `--channel all` で指定したすべて）にメッセージを送信します。

## 実行例

Discord で返信する:

```bash
openclaw message send --channel discord \
  --target channel:123 --message "こんにちは" --reply-to 456
```

Discord でコンポーネント（ボタンなど）付きのメッセージを送信する:

```bash
openclaw message send --channel discord \
  --target channel:123 --message "選択してください:" \
  --components '{"text":"道を選んでください","blocks":[{"type":"actions","buttons":[{"label":"承認","style":"success"},{"label":"拒否","style":"danger"}]}]}'
```

Discord で投票を作成する:

```bash
openclaw message poll --channel discord \
  --target channel:123 \
  --poll-question "おやつは何がいい？" \
  --poll-option ピザ --poll-option 寿司 \
  --poll-multi --poll-duration-hours 48
```

Slack でリアクションを付ける:

```bash
openclaw message react --channel slack \
  --target C123 --message-id 456 --emoji "✅"
```

Telegram でインラインボタンを送信する:

```bash
openclaw message send --channel telegram --target @mychat --message "選んでください:" \
  --buttons '[ [{"text":"はい","callback_data":"cmd:yes"}], [{"text":"いいえ","callback_data":"cmd:no"}] ]'
```
