---
summary: "BlueBubbles macOS サーバー経由の iMessage (REST 送受信、タイピング、リアクション、ペアリング、高度なアクション)。"
read_when:
  - BlueBubbles チャンネルのセットアップ
  - webhook ペアリングのトラブルシューティング
  - macOS での iMessage の設定
title: "BlueBubbles"
seoTitle: "OpenClawでBlueBubbles経由のiMessage連携を設定する方法"
description: "BlueBubbles 経由で iMessage を OpenClaw に接続する設定ガイドです。REST 連携の特徴、ペアリング、送受信やリアクション対応範囲を確認できます。"
---
ステータス: HTTP 経由で BlueBubbles の macOS サーバーと通信する同梱プラグインです。レガシーな `imsg` チャンネルより API が充実しており、導入も簡単なため、**iMessage 連携にはこちらを推奨**します。

## 概要

- BlueBubbles ヘルパーアプリ ([bluebubbles.app](https://bluebubbles.app)) を使って macOS 上で動作します。
- 推奨および検証済みの環境は macOS Sequoia (15) です。macOS Tahoe (26) でも動作しますが、現時点では Tahoe で編集機能が壊れており、グループアイコンの更新は成功と表示されても同期されない場合があります。
- OpenClaw は REST API (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`) を通じて通信します。
- 受信メッセージは webhook 経由で受け取り、返信送信、タイピングインジケーター、既読通知、Tapback は REST 呼び出しで処理します。
- 添付ファイルやステッカーは受信メディアとして取り込まれ、可能であればエージェントにも渡されます。
- ペアリングや許可リストの扱いは他のチャンネル (`/channels/pairing` など) と同様で、`channels.bluebubbles.allowFrom` とペアリングコードを利用します。
- リアクションは Slack や Telegram と同様にシステムイベントとして扱われるため、エージェントは返信前にその内容へ触れられます。
- 高度な機能として、編集、送信取り消し、スレッド返信、メッセージエフェクト、グループ管理を利用できます。

## クイックスタート

1. Mac に BlueBubbles サーバーをインストールします ([bluebubbles.app/install](https://bluebubbles.app/install) の手順に従ってください)。
2. BlueBubbles の設定で、Web API を有効にし、パスワードを設定します。
3. `openclaw onboard` を実行して BlueBubbles を選択するか、手動で設定します。

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

4. BlueBubbles の webhook をゲートウェイへ向けます (例: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`)。
5. ゲートウェイを起動します。webhook ハンドラーが登録され、ペアリングが始まります。

セキュリティに関する注意:

- webhook 用のパスワードは必ず設定してください。
- webhook 認証は常に必須です。ループバックやプロキシ構成に関係なく、`channels.bluebubbles.password` と一致するパスワードまたは GUID を含まない BlueBubbles の webhook リクエストは拒否されます (例: `?password=<password>` または `x-password`)。
- パスワード認証は、webhook 本文を最後まで読み込んだり解析したりする前に実行されます。

## Messages.app をアクティブに保つ (VM / ヘッドレスセットアップ)

一部の macOS VM や常時稼働の構成では、Messages.app が「アイドル」状態になり、アプリを開くかフォアグラウンドに戻すまで受信イベントが止まることがあります。簡単な回避策として、AppleScript と LaunchAgent を使って **5 分ごとに Messages を刺激する** 方法があります。

### 1) AppleScript を保存する

次の場所に保存します。

- `~/Scripts/poke-messages.scpt`

スクリプト例です。非対話型で動作し、フォーカスは奪いません。

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

次の場所に保存します。

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

- この設定は **300 秒ごと** と **ログイン時** に実行されます。
- 初回実行時には macOS の **Automation** プロンプト (`osascript` → Messages) が表示されることがあります。LaunchAgent を動かすのと同じユーザーセッションで承認してください。

読み込むには、次を実行します。

```bash
launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
```

## オンボーディング

BlueBubbles は対話型セットアップウィザードから利用できます。

```
openclaw onboard
```

ウィザードでは次の項目を入力します。

- **サーバー URL** (必須): BlueBubbles サーバーアドレス (例: `http://192.168.1.100:1234`)
- **パスワード** (必須): BlueBubbles サーバー設定からの API パスワード
- **webhook パス** (オプション): デフォルトは `/bluebubbles-webhook`
- **DM ポリシー**: pairing、allowlist、open、または disabled
- **許可リスト**: 電話番号、メールアドレス、またはチャットターゲット

CLI から BlueBubbles を追加することもできます。

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## アクセス制御 (DM + グループ)

DM:

- デフォルト: `channels.bluebubbles.dmPolicy = "pairing"`。
- 未知の送信者にはペアリングコードが返され、承認されるまでメッセージは無視されます。コードの有効期限は 1 時間です。
- 承認には次のコマンドを使います。
  - `openclaw pairing list bluebubbles`
  - `openclaw pairing approve bluebubbles <CODE>`
- ペアリングが既定のトークン交換手段です。詳細は [ペアリング](/channels/pairing) を参照してください。

グループ:

- `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (デフォルト: `allowlist`)。
- `allowlist` を設定した場合、`channels.bluebubbles.groupAllowFrom` でグループ内の実行許可元を制御します。

### メンションゲーティング (グループ)

BlueBubbles は、iMessage や WhatsApp と同じ考え方で、グループチャットのメンション制御をサポートします。

- メンションの検出には `agents.list[].groupChat.mentionPatterns` または `messages.groupChat.mentionPatterns` を使います。
- グループで `requireMention` が有効な場合、エージェントはメンションされたときだけ返信します。
- 認可済み送信者からの制御コマンドは、この制約を迂回できます。

グループ単位の設定例:

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

- 制御コマンド (例: `/config`, `/model`) の実行には認可が必要です。
- コマンド実行の可否は `allowFrom` と `groupAllowFrom` で判定されます。
- 認可済み送信者は、グループ内でメンションがなくても制御コマンドを実行できます。

## タイピング + 既読確認

- **タイピングインジケーター**: 応答生成の前後および生成中に自動送信されます。
- **既読通知**: `channels.bluebubbles.sendReadReceipts` で制御します (デフォルトは `true`)。
- **タイピングの終了**: OpenClaw はタイピング開始イベントを送信し、BlueBubbles 側で送信時またはタイムアウト時に自動解除されます。DELETE による手動停止は信頼できません。

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

設定で有効にすると、BlueBubbles は高度なメッセージ操作をサポートします。

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

- **react**: Tapback リアクションの追加または削除 (`messageId`, `emoji`, `remove`)
- **edit**: 送信済みメッセージの編集 (`messageId`, `text`)
- **unsend**: メッセージの送信取り消し (`messageId`)
- **reply**: 特定のメッセージへの返信 (`messageId`, `text`, `to`)
- **sendWithEffect**: iMessage エフェクト付きでの送信 (`text`, `to`, `effectId`)
- **renameGroup**: グループチャットの名前変更 (`chatGuid`, `displayName`)
- **setGroupIcon**: グループチャットのアイコンや写真を設定 (`chatGuid`, `media`)。macOS 26 Tahoe では不安定で、API が成功を返してもアイコンが同期されない場合があります。
- **addParticipant**: グループに誰かを追加 (`chatGuid`, `address`)
- **removeParticipant**: グループから誰かを削除 (`chatGuid`, `address`)
- **leaveGroup**: グループチャットからの退出 (`chatGuid`)
- **sendAttachment**: メディア/ファイルの送信 (`to`, `buffer`, `filename`, `asVoice`)
  - ボイスメモ: **MP3** または **CAF** の音声を iMessage のボイスメッセージとして送るには `asVoice: true` を設定します。BlueBubbles は送信時に MP3 を CAF へ変換します。

### メッセージ ID (短い vs 完全)

OpenClaw はトークン節約のために *短い* メッセージ ID (例: `1`, `2`) を表示することがあります。

- `MessageSid` と `ReplyToId` には短い ID が入ることがあります。
- `MessageSidFull` / `ReplyToIdFull` にはプロバイダーの完全な ID が含まれています。
- 短い ID はメモリ上にのみ保持されるため、再起動やキャッシュ削除で失効する可能性があります。
- 各アクションは短い `messageId` と完全な `messageId` の両方を受け付けますが、短い ID が失効している場合はエラーになります。

永続的な自動化や保存用途では完全な ID を使ってください。

- テンプレート: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- コンテキスト: 受信ペイロード内の `MessageSidFull` / `ReplyToIdFull`

テンプレート変数の詳細は [設定](/gateway/configuration) を参照してください。

## ブロックストリーミング

応答を 1 件のメッセージとして送るか、複数ブロックに分けてストリーミングするかを制御します。

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
- 受信と送信のメディア上限は `channels.bluebubbles.mediaMaxMb` で指定します (デフォルトは 8 MB)。
- 送信テキストは `channels.bluebubbles.textChunkLimit` に従って分割されます (デフォルトは 4000 文字)。

## 設定リファレンス

完全な設定一覧は [設定](/gateway/configuration) を参照してください。

プロバイダーオプション:

- `channels.bluebubbles.enabled`: チャンネルの有効化または無効化。
- `channels.bluebubbles.serverUrl`: BlueBubbles REST API ベース URL。
- `channels.bluebubbles.password`: API パスワード。
- `channels.bluebubbles.webhookPath`: webhook エンドポイントパス (デフォルト: `/bluebubbles-webhook`)。
- `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (デフォルト: `pairing`)。
- `channels.bluebubbles.allowFrom`: DM 許可リスト (ハンドル、メールアドレス、E.164 番号、`chat_id:*`, `chat_guid:*`)。
- `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (デフォルト: `allowlist`)。
- `channels.bluebubbles.groupAllowFrom`: グループ送信者許可リスト。
- `channels.bluebubbles.groups`: グループごとの設定 (`requireMention` など)。
- `channels.bluebubbles.sendReadReceipts`: 既読通知を送信するかどうか (デフォルトは `true`)。
- `channels.bluebubbles.blockStreaming`: ブロックストリーミングを有効にするかどうか (デフォルトは `false`。ストリーミング返信に必要)。
- `channels.bluebubbles.textChunkLimit`: 送信時のチャンクサイズ上限。単位は文字数です (デフォルトは 4000)。
- `channels.bluebubbles.chunkMode`: `length` (デフォルト) は `textChunkLimit` を超えたときだけ分割します。`newline` は文字数ベースの分割前に空行、つまり段落境界で区切ります。
- `channels.bluebubbles.mediaMaxMb`: 受信および送信メディアの上限。単位は MB です (デフォルトは 8)。
- `channels.bluebubbles.mediaLocalRoots`: 送信時に使えるローカルメディアパスとして許可する絶対ディレクトリの明示的な allowlist です。これを設定しない限り、ローカルパスからの送信は既定で拒否されます。アカウント単位で上書きする場合は `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots` を使います。
- `channels.bluebubbles.historyLimit`: コンテキストに含めるグループメッセージの最大数 (`0` で無効化)。
- `channels.bluebubbles.dmHistoryLimit`: DM 履歴の制限。
- `channels.bluebubbles.actions`: 特定のアクションの有効化/無効化。
- `channels.bluebubbles.accounts`: マルチアカウント設定。

関連するグローバル設定:

- `agents.list[].groupChat.mentionPatterns` (または `messages.groupChat.mentionPatterns`)。
- `messages.responsePrefix`。

## 宛先指定 / 配信ターゲット

安定したルーティングには `chat_guid` の使用を推奨します。

- `chat_guid:iMessage;-;+15555550123` (グループに推奨)
- `chat_id:123`
- `chat_identifier:...`
- ダイレクトハンドル: `+15555550123`, `user@example.com`
  - ダイレクトハンドルに既存の DM チャットがない場合、OpenClaw は `POST /api/v1/chat/new` を使って新規作成します。この操作には BlueBubbles Private API を有効にしておく必要があります。

## セキュリティ

- webhook リクエストは、クエリパラメーターまたはヘッダーの `guid` / `password` を `channels.bluebubbles.password` と照合して認証します。`localhost` からのリクエストも受け入れられます。
- API パスワードと webhook エンドポイントは秘密として扱ってください。認証情報と同じ水準で保護する必要があります。
- `localhost` を信頼する構成では、同一ホスト上のリバースプロキシが意図せずパスワードを回避してしまう可能性があります。ゲートウェイをプロキシ越しに公開する場合は、プロキシ側でも認証を必須にし、`gateway.trustedProxies` を設定してください。詳細は [ゲートウェイのセキュリティ](/gateway/security#reverse-proxy-configuration) を参照してください。
- BlueBubbles サーバーを LAN の外部に公開する場合は、HTTPS + ファイアウォールルールを有効にしてください。

## トラブルシューティング

- タイピングや既読イベントが止まった場合は、BlueBubbles の webhook ログを確認し、ゲートウェイのパスが `channels.bluebubbles.webhookPath` と一致していることを確認してください。
- ペアリングコードの有効期限は 1 時間です。`openclaw pairing list bluebubbles` と `openclaw pairing approve bluebubbles <code>` を利用してください。
- リアクションには BlueBubbles Private API (`POST /api/v1/message/react`) が必要です。利用中のサーバーバージョンで公開されているか確認してください。
- 編集/送信取り消しには、macOS 13+ および互換性のある BlueBubbles サーバーバージョンが必要です。macOS 26 (Tahoe) では、プライベート API の変更により、編集は現在壊れています。
- macOS 26 (Tahoe) ではグループアイコン更新も不安定で、API が成功を返しても新しいアイコンが同期されないことがあります。
- OpenClaw は BlueBubbles サーバーの macOS バージョンに基づいて、既知の不具合があるアクションを自動的に隠します。macOS 26 (Tahoe) で編集がまだ表示される場合は、`channels.bluebubbles.actions.edit=false` を設定して手動で無効化してください。
- ステータスやヘルス情報は `openclaw status --all` または `openclaw status --deep` で確認できます。

チャンネル全般の運用フローについては、[チャンネル](/channels) と [プラグイン](/tools/plugin) を参照してください。
