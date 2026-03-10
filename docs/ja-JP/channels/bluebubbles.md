---
summary: "BlueBubbles macOS サーバー経由の iMessage (REST 送受信、タイピング、リアクション、ペアリング、高度なアクション)。"
read_when:
  - BlueBubbles チャンネルのセットアップ
  - Webhook ペアリングのトラブルシューティング
  - macOS での iMessage の設定
title: "BlueBubbles"
---

# BlueBubbles (macOS REST)

ステータス: HTTP 経由で BlueBubbles macOS サーバーと通信するバンドルされたプラグインです。より豊富な API と、レガシーな imsg チャンネルに比べて簡単なセットアップのため、**iMessage 統合にはこちらを推奨**します。

## 概要

- BlueBubbles ヘルパーアプリ ([bluebubbles.app](https://bluebubbles.app)) を介して macOS 上で動作します。
- 推奨/テスト済み: macOS Sequoia (15)。macOS Tahoe (26) も動作しますが、現在 Tahoe では編集が機能せず、グループアイコンの更新は成功を報告しても同期しない可能性があります。
- OpenClaw は REST API (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`) を通じて通信します。
- 受信メッセージは Webhook 経由で到着し、送信される返信、タイピングインジケーター、既読確認、および Tapback は REST 呼び出しです。
- 添付ファイルとステッカーは受信メディアとして取り込まれます (可能であればエージェントにも表示されます)。
- ペアリング/許可リストは他のチャンネル (`/channels/pairing` など) と同じように機能し、`channels.bluebubbles.allowFrom` + ペアリングコードを使用します。
- リアクションは Slack/Telegram と同様にシステムイベントとして表示されるため、エージェントは返信する前にそれらに「言及」できます。
- 高度な機能: 編集、送信取り消し、返信スレッド、メッセージエフェクト、グループ管理。

## クイックスタート

1. Mac に BlueBubbles サーバーをインストールします ([bluebubbles.app/install](https://bluebubbles.app/install) の手順に従ってください)。
2. BlueBubbles の設定で、Web API を有効にし、パスワードを設定します。
3. `openclaw onboard` を実行して BlueBubbles を選択するか、手動で設定します:

   ```json5
   {
     channels: {
       bluebubbles: {
         enabled: true,
         serverUrl: "http://192.168.1.100:1234",
         password: "example-password",
         webhookPath: "/bluebubbles-webhook",
       },
     },
   }
   ```

4. BlueBubbles Webhook を Gateway に向けます (例: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`)。
5. Gateway を起動します。Webhook ハンドラーが登録され、ペアリングが開始されます。

セキュリティに関する注意:

- 常に Webhook パスワードを設定してください。
- Webhook 認証は常に必要です。ループバック/プロキシトポロジーに関係なく、OpenClaw は `channels.bluebubbles.password` と一致するパスワード/GUID を含んでいない BlueBubbles Webhook リクエストを拒否します (例: `?password=<password>` または `x-password`)。
- パスワード認証は、完全な Webhook ボディを読み取る/解析する前にチェックされます。

## Messages.app をアクティブに保つ (VM / ヘッドレスセットアップ)

一部の macOS VM / 常時起動のセットアップでは、Messages.app が「アイドル」状態になり (アプリが開かれる/フォアグラウンドになるまで受信イベントが停止する)、問題が発生する可能性があります。簡単な回避策は、AppleScript + LaunchAgent を使用して**5分ごとに Messages をつつく**ことです。

### 1) AppleScript を保存する

次のように保存します:

- `~/Scripts/poke-messages.scpt`

スクリプト例 (非対話型。フォーカスを奪いません):

```applescript
try
  tell application "Messages"
    if not running then
      launch
    end if

    -- プロセスの応答性を維持するためにスクリプティングインターフェースに触れる
    set _chatCount to (count of chats)
  end tell
on error
  -- 一時的な障害 (初回起動プロンプト、ロックされたセッションなど) を無視する
end try
```

### 2) LaunchAgent をインストールする

次のように保存します:

- `~/Library/LaunchAgents/com.user.poke-messages.plist`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>Label</key>
    <string>com.user.poke-messages</string>

    <key>ProgramArguments</key>
    <array>
      <string>/bin/bash</string>
      <string>-lc</string>
      <string>/usr/bin/osascript &quot;$HOME/Scripts/poke-messages.scpt&quot;</string>
    </array>

    <key>RunAtLoad</key>
    <true/>

    <key>StartInterval</key>
    <integer>300</integer>

    <key>StandardOutPath</key>
    <string>/tmp/poke-messages.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/poke-messages.err</string>
  </dict>
</plist>
```

注意:

- これは**300秒ごと**、および**ログイン時**に実行されます。
- 初回実行時に macOS の**オートメーション**プロンプト (`osascript` → Messages) が表示される場合があります。LaunchAgent を実行するのと同じユーザーセッションでそれらを承認してください。

ロードします:

```bash
launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
```

## オンボーディング

BlueBubbles は対話型のセットアップウィザードで利用できます:

```
openclaw onboard
```

ウィザードは以下を要求します:

- **サーバー URL** (必須): BlueBubbles サーバーアドレス (例: `http://192.168.1.100:1234`)
- **パスワード** (必須): BlueBubbles サーバー設定からの API パスワード
- **Webhook パス** (オプション): デフォルトは `/bluebubbles-webhook`
- **DM ポリシー**: pairing、allowlist、open、または disabled
- **許可リスト**: 電話番号、メールアドレス、またはチャットターゲット

CLI を介して BlueBubbles を追加することもできます:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## アクセス制御 (DM + グループ)

DM:

- デフォルト: `channels.bluebubbles.dmPolicy = "pairing"`。
- 不明な送信者はペアリングコードを受け取ります。承認されるまでメッセージは無視されます (コードは1時間で期限切れになります)。
- 以下を介して承認します:
  - `openclaw pairing list bluebubbles`
  - `openclaw pairing approve bluebubbles <CODE>`
- ペアリングはデフォルトのトークン交換です。詳細: [ペアリング](/channels/pairing)

グループ:

- `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (デフォルト: `allowlist`)。
- `allowlist` が設定されている場合、`channels.bluebubbles.groupAllowFrom` は誰がグループ内でトリガーできるかを制御します。

### メンションゲーティング (グループ)

BlueBubbles は、iMessage/WhatsApp の動作に合わせて、グループチャットのメンションゲーティングをサポートしています:

- メンションを検出するために `agents.list[].groupChat.mentionPatterns` (または `messages.groupChat.mentionPatterns`) を使用します。
- グループで `requireMention` が有効になっている場合、エージェントはメンションされた場合のみ返信します。
- 承認された送信者からのコントロールコマンドは、メンションゲーティングをバイパスします。

グループごとの設定:

```json5
{
  channels: {
    bluebubbles: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true }, // すべてのグループのデフォルト
        "iMessage;-;chat123": { requireMention: false }, // 特定のグループの上書き
      },
    },
  },
}
```

### コマンドゲーティング

- コマンドコントロール (例: `/config`, `/model`) には承認が必要です。
- `allowFrom` および `groupAllowFrom` を使用してコマンドの承認を決定します。
- 承認された送信者は、グループ内でメンションしなくてもコントロールコマンドを実行できます。

## タイピング + 既読確認

- **タイピングインジケーター**: 応答生成の前と実行中に自動的に送信されます。
- **既読確認**: `channels.bluebubbles.sendReadReceipts` によって制御されます (デフォルト: `true`)。
- **タイピングインジケーター**: OpenClaw はタイピング開始イベントを送信します。BlueBubbles は送信時またはタイムアウト時に自動的にタイピングをクリアします (DELETE を介した手動停止は信頼性がありません)。

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // 既読確認を無効にする
    },
  },
}
```

## 高度なアクション

設定で有効にすると、BlueBubbles は高度なメッセージアクションをサポートします:

```json5
{
  channels: {
    bluebubbles: {
      actions: {
        reactions: true, // tapbacks (デフォルト: true)
        edit: true, // 送信済みメッセージの編集 (macOS 13+、macOS 26 Tahoe では壊れています)
        unsend: true, // メッセージの送信取り消し (macOS 13+)
        reply: true, // メッセージ GUID による返信スレッド
        sendWithEffect: true, // メッセージエフェクト (スラム、ラウドなど)
        renameGroup: true, // グループチャットの名前変更
        setGroupIcon: true, // グループチャットのアイコン/写真の設定 (macOS 26 Tahoe では不安定)
        addParticipant: true, // グループへの参加者の追加
        removeParticipant: true, // グループからの参加者の削除
        leaveGroup: true, // グループチャットからの退出
        sendAttachment: true, // 添付ファイル/メディアの送信
      },
    },
  },
}
```

利用可能なアクション:

- **react**: Tapback リアクションの追加/削除 (`messageId`, `emoji`, `remove`)
- **edit**: 送信済みメッセージの編集 (`messageId`, `text`)
- **unsend**: メッセージの送信取り消し (`messageId`)
- **reply**: 特定のメッセージへの返信 (`messageId`, `text`, `to`)
- **sendWithEffect**: iMessage エフェクト付きでの送信 (`text`, `to`, `effectId`)
- **renameGroup**: グループチャットの名前変更 (`chatGuid`, `displayName`)
- **setGroupIcon**: グループチャットのアイコン/写真の設定 (`chatGuid`, `media`) — macOS 26 Tahoe では不安定です (API は成功を返す場合がありますが、アイコンは同期しません)。
- **addParticipant**: グループに誰かを追加 (`chatGuid`, `address`)
- **removeParticipant**: グループから誰かを削除 (`chatGuid`, `address`)
- **leaveGroup**: グループチャットからの退出 (`chatGuid`)
- **sendAttachment**: メディア/ファイルの送信 (`to`, `buffer`, `filename`, `asVoice`)
  - ボイスメモ: **MP3** または **CAF** オーディオを iMessage の音声メッセージとして送信するには、`asVoice: true` を設定します。ボイスメモを送信する際、BlueBubbles は MP3 → CAF に変換します。

### メッセージ ID (短い vs 完全)

OpenClaw はトークンを節約するために*短い*メッセージ ID (例: `1`, `2`) を表示する場合があります。

- `MessageSid` / `ReplyToId` は短い ID にすることができます。
- `MessageSidFull` / `ReplyToIdFull` にはプロバイダーの完全な ID が含まれています。
- 短い ID はインメモリにあります。再起動やキャッシュの立ち退き時に期限切れになる可能性があります。
- アクションは短い、または完全な `messageId` の両方を受け入れますが、短い ID がもはや利用できない場合はエラーになります。

永続的な自動化とストレージには完全な ID を使用してください:

- テンプレート: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- コンテキスト: 受信ペイロード内の `MessageSidFull` / `ReplyToIdFull`

テンプレート変数については、[設定](/gateway/configuration) を参照してください。

## ブロックストリーミング

応答を単一のメッセージとして送信するか、ブロックにストリーミングするかを制御します:

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // ブロックストリーミングを有効にする (デフォルトはオフ)
    },
  },
}
```

## メディア + 制限

- 受信した添付ファイルはダウンロードされ、メディアキャッシュに保存されます。
- 受信および送信メディアのメディア上限は `channels.bluebubbles.mediaMaxMb` 経由です (デフォルト: 8 MB)。
- 送信テキストは `channels.bluebubbles.textChunkLimit` に分割されます (デフォルト: 4000 文字)。

## 設定リファレンス

完全な設定: [設定](/gateway/configuration)

プロバイダーオプション:

- `channels.bluebubbles.enabled`: チャンネルを有効/無効にします。
- `channels.bluebubbles.serverUrl`: BlueBubbles REST API ベース URL。
- `channels.bluebubbles.password`: API パスワード。
- `channels.bluebubbles.webhookPath`: Webhook エンドポイントパス (デフォルト: `/bluebubbles-webhook`)。
- `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (デフォルト: `pairing`)。
- `channels.bluebubbles.allowFrom`: DM 許可リスト (ハンドル、メールアドレス、E.164 番号、`chat_id:*`, `chat_guid:*`)。
- `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (デフォルト: `allowlist`)。
- `channels.bluebubbles.groupAllowFrom`: グループ送信者許可リスト。
- `channels.bluebubbles.groups`: グループごとの設定 (`requireMention` など)。
- `channels.bluebubbles.sendReadReceipts`: 既読確認を送信します (デフォルト: `true`)。
- `channels.bluebubbles.blockStreaming`: ブロックストリーミングを有効にします (デフォルト: `false`、ストリーミング返信に必要)。
- `channels.bluebubbles.textChunkLimit`: 文字数での送信チャンクサイズ (デフォルト: 4000)。
- `channels.bluebubbles.chunkMode`: `length` (デフォルト) は `textChunkLimit` を超えた場合にのみ分割します。`newline` は長さのチャンク化の前に空白行 (段落の境界) で分割します。
- `channels.bluebubbles.mediaMaxMb`: MB 単位の受信/送信メディア上限 (デフォルト: 8)。
- `channels.bluebubbles.mediaLocalRoots`: 送信ローカルメディアパスに許可される絶対ローカルディレクトリの明示的な許可リスト。これが設定されていない限り、ローカルパスの送信はデフォルトで拒否されます。アカウントごとの上書き: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`。
- `channels.bluebubbles.historyLimit`: コンテキストの最大グループメッセージ (0 で無効化)。
- `channels.bluebubbles.dmHistoryLimit`: DM 履歴の制限。
- `channels.bluebubbles.actions`: 特定のアクションの有効化/無効化。
- `channels.bluebubbles.accounts`: マルチアカウント設定。

関連するグローバルオプション:

- `agents.list[].groupChat.mentionPatterns` (または `messages.groupChat.mentionPatterns`)。
- `messages.responsePrefix`。

## アドレス指定 / 配信ターゲット

安定したルーティングには `chat_guid` を推奨します:

- `chat_guid:iMessage;-;+15555550123` (グループに推奨)
- `chat_id:123`
- `chat_identifier:...`
- ダイレクトハンドル: `+15555550123`, `user@example.com`
  - ダイレクトハンドルに既存の DM チャットがない場合、OpenClaw は `POST /api/v1/chat/new` を介して新しく作成します。これには BlueBubbles プライベート API が有効になっている必要があります。

## セキュリティ

- Webhook リクエストは、`guid`/`password` クエリパラメーターまたはヘッダーを `channels.bluebubbles.password` と比較することによって認証されます。`localhost` からのリクエストも受け入れられます。
- API パスワードと Webhook エンドポイントは秘密にしてください (資格情報のように扱ってください)。
- localhost の信頼は、同一ホストのリバースプロキシが意図せずパスワードをバイパスする可能性があることを意味します。Gateway をプロキシする場合は、プロキシで認証を要求し、`gateway.trustedProxies` を設定してください。[Gateway セキュリティ](/gateway/security#reverse-proxy-configuration) を参照してください。
- BlueBubbles サーバーを LAN の外部に公開する場合は、HTTPS + ファイアウォールルールを有効にしてください。

## トラブルシューティング

- タイピング/既読イベントが機能しなくなった場合は、BlueBubbles Webhook ログを確認し、Gateway パスが `channels.bluebubbles.webhookPath` と一致していることを確認してください。
- ペアリングコードは1時間後に期限切れになります。`openclaw pairing list bluebubbles` と `openclaw pairing approve bluebubbles <code>` を使用してください。
- リアクションには BlueBubbles プライベート API (`POST /api/v1/message/react`) が必要です。サーバーのバージョンがそれを公開していることを確認してください。
- 編集/送信取り消しには、macOS 13+ および互換性のある BlueBubbles サーバーバージョンが必要です。macOS 26 (Tahoe) では、プライベート API の変更により、編集は現在壊れています。
- グループアイコンの更新は macOS 26 (Tahoe) では不安定になる可能性があります。API は成功を返す可能性がありますが、新しいアイコンは同期しません。
- OpenClaw は、BlueBubbles サーバーの macOS バージョンに基づいて、既知の壊れているアクションを自動非表示にします。macOS 26 (Tahoe) で編集がまだ表示される場合は、`channels.bluebubbles.actions.edit=false` で手動で無効にしてください。
- ステータス/ヘルス情報について: `openclaw status --all` または `openclaw status --deep`。

一般的なチャンネルのワークフローリファレンスについては、[チャンネル](/channels) と [プラグイン](/tools/plugin) ガイドを参照してください。
