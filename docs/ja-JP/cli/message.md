---
summary: "「openclaw メッセージ」の CLI リファレンス (送信 + チャネル アクション)"
read_when:
  - メッセージ CLI アクションの追加または変更
  - アウトバウンドチャネルの動作の変更
title: "メッセージ"
x-i18n:
  source_hash: "41b8483f92051e5ac96eff1887fa03a1c1158876a54a2ae2fdbfb2322bdc98d8"
---

# `openclaw message`

メッセージとチャネルアクションを送信するための単一のアウトバウンドコマンド
(Discord/Google Chat/Slack/Mattermost (プラグイン)/Telegram/WhatsApp/Signal/iMessage/MS Teams)。

## 使用法

```
openclaw message <subcommand> [flags]
```

チャンネル選択:

- 複数のチャネルが設定されている場合は、`--channel` が必要です。
- チャネルが 1 つだけ設定されている場合、それがデフォルトになります。
- 値: `whatsapp|telegram|discord|googlechat|slack|mattermost|signal|imessage|msteams` (Mattermost にはプラグインが必要です)

ターゲット形式 (`--target`):

- WhatsApp: E.164 またはグループ JID
- 電報: チャット ID または `@username`
- Discord: `channel:<id>` または `user:<id>` (または `<@id>` の言及。生の数値 ID はチャネルとして扱われます)
- Google チャット: `spaces/<spaceId>` または `users/<userId>`
- Slack: `channel:<id>` または `user:<id>` (生のチャネル ID が受け入れられます)
- Mattermost (プラグイン): `channel:<id>`、`user:<id>`、または `@username` (裸の ID はチャネルとして扱われます)
- 信号: `+E.164`、`group:<id>`、`signal:+E.164`、`signal:group:<id>`、または `username:<name>`/`u:<name>`
- iMessage: ハンドル、`chat_id:<id>`、`chat_guid:<guid>`、または `chat_identifier:<id>`
- MS Teams: 会話 ID (`19:...@thread.tacv2`) または `conversation:<id>` または `user:<aad-object-id>`

名前の検索:- サポートされているプロバイダー (Discord/Slack/など) の場合、`Help` や `#help` などのチャンネル名はディレクトリ キャッシュを介して解決されます。

- キャッシュ ミスの場合、プロバイダーがサポートしている場合、OpenClaw はライブ ディレクトリ ルックアップを試みます。

## 共通フラグ

- `--channel <name>`
- `--account <id>`
- `--target <dest>` (送信/ポーリング/読み取りなどのターゲット チャネルまたはユーザー)
- `--targets <name>` (繰り返し、ブロードキャストのみ)
- `--json`
- `--dry-run`
- `--verbose`

## アクション

### コア

- `send`
  - チャネル: WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (プラグイン)/Signal/iMessage/MS Teams
  - 必須: `--target`、プラス `--message` または `--media`
  - オプション: `--media`、`--reply-to`、`--thread-id`、`--gif-playback`
  - 電報のみ: `--buttons` (許可するには `channels.telegram.capabilities.inlineButtons` が必要です)
  - 電報のみ: `--thread-id` (フォーラムのトピック ID)
  - Slack のみ: `--thread-id` (スレッドのタイムスタンプ; `--reply-to` は同じフィールドを使用します)
  - WhatsApp のみ: `--gif-playback`

- `poll`
  - チャネル: WhatsApp/Telegram/Discord/Matrix/MS Teams
  - 必須: `--target`、`--poll-question`、`--poll-option` (繰り返し)
  - オプション: `--poll-multi`
  - Discord のみ: `--poll-duration-hours`、`--silent`、`--message`
  - 電報のみ: `--poll-duration-seconds` (5-600)、`--silent`、`--poll-anonymous` / `--poll-public`、`--thread-id`- `react`
  - チャネル: Discord/Google Chat/Slack/Telegram/WhatsApp/Signal
  - 必須: `--message-id`、`--target`
  - オプション: `--emoji`、`--remove`、`--participant`、`--from-me`、`--target-author`、`--target-author-uuid`
  - 注: `--remove` には `--emoji` が必要です (サポートされている場合、独自のリアクションをクリアするには `--emoji` を省略します。/tools/reactions を参照)
  - WhatsApp のみ: `--participant`、`--from-me`
  - シグナルグループ反応: `--target-author` または `--target-author-uuid` が必要

- `reactions`
  - チャンネル: Discord/Google Chat/Slack
  - 必須: `--message-id`、`--target`
  - オプション: `--limit`

- `read`
  - チャンネル: Discord/Slack
  - 必須: `--target`
  - オプション: `--limit`、`--before`、`--after`
  - Discord のみ: `--around`

- `edit`
  - チャンネル: Discord/Slack
  - 必須: `--message-id`、`--message`、`--target`

- `delete`
  - チャンネル: Discord/Slack/Telegram
  - 必須: `--message-id`、`--target`

- `pin` / `unpin`
  - チャンネル: Discord/Slack
  - 必須: `--message-id`、`--target`

- `pins` (リスト)
  - チャンネル: Discord/Slack
  - 必須: `--target`

- `permissions`
  - チャンネル: Discord
  - 必須: `--target`- `search`
  - チャンネル: Discord
  - 必須: `--guild-id`、`--query`
  - オプション: `--channel-id`、`--channel-ids` (繰り返し)、`--author-id`、`--author-ids` (繰り返し)、`--limit`

### スレッド

- `thread create`
  - チャンネル: Discord
  - 必須: `--thread-name`、`--target` (チャネル ID)
  - オプション: `--message-id`、`--message`、`--auto-archive-min`

- `thread list`
  - チャンネル: Discord
  - 必須: `--guild-id`
  - オプション: `--channel-id`、`--include-archived`、`--before`、`--limit`

- `thread reply`
  - チャンネル: Discord
  - 必須: `--target` (スレッド ID)、`--message`
  - オプション: `--media`、`--reply-to`

### 絵文字

- `emoji list`
  - ディスコード: `--guild-id`
  - Slack: 余分なフラグはありません

- `emoji upload`
  - チャンネル: Discord
  - 必須: `--guild-id`、`--emoji-name`、`--media`
  - オプション: `--role-ids` (繰り返し)

### ステッカー

- `sticker send`
  - チャンネル: Discord
  - 必須: `--target`、`--sticker-id` (繰り返し)
  - オプション: `--message`

- `sticker upload`
  - チャンネル: Discord
  - 必須: `--guild-id`、`--sticker-name`、`--sticker-desc`、`--sticker-tags`、`--media`

### 役割 / チャンネル / メンバー / 声- `role info` (Discord): `--guild-id`

- `role add` / `role remove` (Discord): `--guild-id`、`--user-id`、`--role-id`
- `channel info` (Discord): `--target`
- `channel list` (Discord): `--guild-id`
- `member info` (Discord/Slack): `--user-id` (+ Discord の場合は `--guild-id`)
- `voice status` (Discord): `--guild-id`、`--user-id`

### イベント

- `event list` (Discord): `--guild-id`
- `event create` (Discord): `--guild-id`、`--event-name`、`--start-time`
  - オプション: `--end-time`、`--desc`、`--channel-id`、`--location`、`--event-type`

### モデレーション (Discord)

- `timeout`: `--guild-id`、`--user-id` (オプションの `--duration-min` または `--until`。タイムアウトをクリアするには両方を省略します)
- `kick`: `--guild-id`、`--user-id` (+ `--reason`)
- `ban`: `--guild-id`、`--user-id` (+ `--delete-days`、`--reason`)
  - `timeout` は `--reason` もサポートします

### ブロードキャスト

- `broadcast`
  - チャネル: 設定された任意のチャネル。 `--channel all` を使用してすべてのプロバイダーをターゲットにします
  - 必須: `--targets` (繰り返し)
  - オプション: `--message`、`--media`、`--dry-run`

## 例

Discord に返信を送信します。

```
openclaw message send --channel discord \
  --target channel:123 --message "hi" --reply-to 456
```

コンポーネントを含む Discord メッセージを送信します。

````
openclaw message send --channel discord \
  --target channel:123 --message "Choose:" \
  --components '{"text":"Choose a path","blocks":[{"type":"actions","buttons":[{"label":"Approve","style":"success"},{"label":"Decline","style":"danger"}]}]}'
```完全なスキーマについては、[Discord コンポーネント](/channels/discord#interactive-components) を参照してください。

Discord 投票を作成します。

````

openclaw message poll --channel discord \
 --target channel:123 \
 --poll-question "Snack?" \
 --poll-option Pizza --poll-option Sushi \
 --poll-multi --poll-duration-hours 48

```

Telegram 投票を作成します (2 分で自動終了):

```

openclaw message poll --channel telegram \
 --target @mychat \
 --poll-question "Lunch?" \
 --poll-option Pizza --poll-option Sushi \
 --poll-duration-seconds 120 --silent

```

Teams のプロアクティブなメッセージを送信します。

```

openclaw message send --channel msteams \
 --target conversation:19:abc@thread.tacv2 --message "hi"

```

Teams の投票を作成します。

```

openclaw message poll --channel msteams \
 --target conversation:19:abc@thread.tacv2 \
 --poll-question "Lunch?" \
 --poll-option Pizza --poll-option Sushi

```

Slack で反応する:

```

openclaw message react --channel slack \
 --target C123 --message-id 456 --emoji "✅"

```

Signal グループで反応します。

```

openclaw message react --channel signal \
 --target signal:group:abc123 --message-id 1737630212345 \
 --emoji "✅" --target-author-uuid 123e4567-e89b-12d3-a456-426614174000

```

Telegram のインライン送信ボタン:

```bash
openclaw message send --channel telegram --target @mychat --message "Choose:" \
 --buttons '[ [{"text":"Yes","callback_data":"cmd:yes"}], [{"text":"No","callback_data":"cmd:no"}] ]'
```
