---
summary: "Slack のセットアップと実行時の動作 (ソケット モード + HTTP イベント API)"
read_when:
  - Slack のセットアップまたは Slack ソケット/HTTP モードのデバッグ
title: "スラック"
x-i18n:
  source_hash: "be99246c8d9235549e030416966b72b5db1d7d111364d35aeb2ae2760e66dc1e"
---

# スラック

ステータス: Slack アプリ統合による DM + チャネルの運用準備が整っています。デフォルトのモードはソケット モードです。 HTTP イベント API モードもサポートされています。

<CardGroup cols={3}>
  <Card title="ペアリング" icon="link" href="/channels/pairing">
    Slack DM はデフォルトでペアリング モードになります。
  </Card>
  <Card title="スラッシュコマンド" icon="terminal" href="/tools/slash-commands">
    ネイティブ コマンドの動作とコマンド カタログ。
  </Card>
  <Card title="チャネルのトラブルシューティング" icon="wrench" href="/channels/troubleshooting">
    クロスチャネル診断と修復プレイブック。
  </Card>
</CardGroup>

## クイックセットアップ

<Tabs>
  <Tab title="ソケットモード (デフォルト)">
    <Steps>
      <Step title="Slack アプリとトークンを作成する">
        Slack アプリの設定で:

        - **ソケット モード**を有効にする
        - `connections:write` を使用して **アプリ トークン** (`xapp-...`) を作成します
        - アプリをインストールし、**ボット トークン** (`xoxb-...`) をコピーします。
      </Step>

      <Step title="OpenClaw を構成する">

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      appToken: "xapp-...",
      botToken: "xoxb-...",
    },
  },
}
```

        環境フォールバック (デフォルトアカウントのみ):

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="アプリイベントを購読する">
        次のボット イベントをサブスクライブします。

        - `app_mention`
        - `message.channels`、`message.groups`、`message.im`、`message.mpim`
        - `reaction_added`、`reaction_removed`
        - `member_joined_channel`、`member_left_channel`
        - `channel_rename`
        - `pin_added`、`pin_removed`

        また、アプリのホーム **メッセージ タブ** を DM に対して有効にします。
      </Step>

      <Step title="スタートゲートウェイ">

```bash
openclaw gateway
```

      </Step>
    </Steps></Tab>

  <Tab title="HTTP イベント API モード">
    <Steps>
      <Step title="Slack アプリを HTTP 用に構成する">

        - モードを HTTP に設定します (`channels.slack.mode="http"`)
        - Slack **署名秘密**をコピーします
        - イベント サブスクリプション + インタラクティビティ + スラッシュ コマンド リクエスト URL を同じ Webhook パスに設定します (デフォルト `/slack/events`)

      </Step>

      <Step title="OpenClaw HTTP モードを構成する">

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      botToken: "xoxb-...",
      signingSecret: "your-signing-secret",
      webhookPath: "/slack/events",
    },
  },
}
```

      </Step>

      <Step title="マルチアカウント HTTP に一意の Webhook パスを使用する">
        アカウントごとの HTTP モードがサポートされています。

        登録が衝突しないように、各アカウントに個別の `webhookPath` を与えます。
      </Step>
    </Steps>

  </Tab>
</Tabs>

## トークンモデル

- ソケット モードには `botToken` + `appToken` が必要です。
- HTTP モードには `botToken` + `signingSecret` が必要です。
- 構成トークンは環境フォールバックをオーバーライドします。
- `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` 環境フォールバックはデフォルトのアカウントにのみ適用されます。
- `userToken` (`xoxp-...`) は構成専用 (環境フォールバックなし) であり、デフォルトは読み取り専用動作 (`userTokenReadOnly: true`) です。
- オプション: 送信メッセージでアクティブなエージェント ID (カスタム `username` とアイコン) を使用する場合は、`chat:write.customize` を追加します。 `icon_emoji` は `:emoji_name:` 構文を使用します。
  <Tip>
  アクション/ディレクトリ読み取りでは、構成時にユーザー トークンを優先できます。書き込みの場合は、ボット トークンが引き続き優先されます。ユーザー トークンの書き込みは、`userTokenReadOnly: false` とボット トークンが利用できない場合にのみ許可されます。
  </Tip>

## アクセス制御とルーティング

<Tabs>
  <Tab title="DMポリシー">
    `channels.slack.dmPolicy` は DM アクセスを制御します (レガシー: `channels.slack.dm.policy`):

    - `pairing` (デフォルト)
    - `allowlist`
    - `open` (`"*"` を含めるには `channels.slack.allowFrom` が必要です。レガシー: `channels.slack.dm.allowFrom`)
    - `disabled`

    DM フラグ:

    - `dm.enabled` (デフォルトは true)
    - `channels.slack.allowFrom` (推奨)
    - `dm.allowFrom` (レガシー)
    - `dm.groupEnabled` (グループ DM のデフォルトは false)
    - `dm.groupChannels` (オプションの MPIM 許可リスト)

    マルチアカウントの優先順位:

    - `channels.slack.accounts.default.allowFrom` は `default` アカウントにのみ適用されます。
    - 名前付きアカウントは、独自の `allowFrom` が設定されていない場合、 `channels.slack.allowFrom` を継承します。
    - 名前付きアカウントは `channels.slack.accounts.default.allowFrom` を継承しません。

    DM でのペアリングには `openclaw pairing approve slack <code>` を使用します。

  </Tab>

  <Tab title="チャネルポリシー">
    `channels.slack.groupPolicy` はチャネル処理を制御します。

    - `open`
    - `allowlist`
    - `disabled`

    チャネル許可リストは `channels.slack.channels` の下にあります。ランタイムに関する注意: `channels.slack` が完全に欠落している場合 (環境のみのセットアップ)、ランタイムは `groupPolicy="allowlist"` にフォールバックし、警告をログに記録します (`channels.defaults.groupPolicy` が設定されている場合でも)。

    名前/ID解決:

    - トークン アクセスが許可されている場合、チャネル ホワイトリスト エントリと DM ホワイトリスト エントリは起動時に解決されます。
    - 未解決のエントリは設定どおりに保持されます
    - インバウンド認証照合はデフォルトで ID 優先です。ユーザー名/スラッグの直接一致には `channels.slack.dangerouslyAllowNameMatching: true` が必要です

  </Tab>

  <Tab title="メンションとチャンネル ユーザー">
    チャンネルメッセージはデフォルトでメンションゲートされます。

    出典について言及する:

    - 明示的なアプリの言及 (`<@botId>`)
    - 正規表現パターンについての言及 (`agents.list[].groupChat.mentionPatterns`、フォールバック `messages.groupChat.mentionPatterns`)
    - 暗黙的なボットへの返信スレッドの動作

    チャンネルごとのコントロール (`channels.slack.channels.<id|name>`):

    - `requireMention`
    - `users` (許可リスト)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`、`toolsBySender`
    - `toolsBySender` キー形式: `id:`、`e164:`、`username:`、`name:`、または `"*"` ワイルドカード
      (従来のプレフィックスのないキーは引き続き `id:` のみにマップされます)

  </Tab>
</Tabs>

## コマンドとスラッシュの動作- Slack ではネイティブ コマンドの自動モードが **オフ** です (`commands.native: "auto"` では Slack ネイティブ コマンドが有効になりません)

- `channels.slack.commands.native: true` (またはグローバル `commands.native: true`) を使用してネイティブ Slack コマンド ハンドラーを有効にします。
- ネイティブ コマンドが有効な場合、Slack に一致するスラッシュ コマンド (`/<command>` 名) を登録します。ただし、次の 1 つの例外があります。
  - ステータスコマンド用に `/agentstatus` を登録します (Slack は `/status` を予約します)
- ネイティブ コマンドが有効になっていない場合は、`channels.slack.slashCommand` 経由で構成された単一のスラッシュ コマンドを実行できます。
- ネイティブ arg メニューがレンダリング戦略を適応させるようになりました。
  - 最大 5 つのオプション: ボタンブロック
  - 6 ～ 100 のオプション: 静的な選択メニュー
  - 100 を超えるオプション: インタラクティブ オプション ハンドラーが使用可能な場合、非同期オプション フィルタリングを使用した外部選択
  - エンコードされたオプション値が Slack の制限を超える場合、フローはボタンに戻ります。
- 長いオプション ペイロードの場合、スラッシュ コマンド引数メニューでは、選択した値をディスパッチする前に確認ダイアログが使用されます。

デフォルトのスラッシュコマンド設定:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

スラッシュ セッションでは分離されたキーが使用されます。

- `agent:<agentId>:slack:slash:<userId>`

そして、ターゲットの会話セッションに対してコマンドの実行をルーティングします (`CommandTargetSessionKey`)。

## スレッド、セッション、および応答タグ- DM は `direct` としてルーティングされます。チャンネルは`channel`として。 MPIM は `group` です

- デフォルトの `session.dmScope=main` では、Slack DM はエージェントのメイン セッションに折りたたまれます。
- チャネルセッション: `agent:<agentId>:slack:channel:<channelId>`。
- スレッド応答は、該当する場合、スレッド セッション サフィックス (`:thread:<threadTs>`) を作成できます。
- `channels.slack.thread.historyScope` のデフォルトは `thread` です。 `thread.inheritParent` のデフォルトは `false` です。
- `channels.slack.thread.initialHistoryLimit` は、新しいスレッド セッションの開始時にフェッチされる既存のスレッド メッセージの数を制御します (デフォルトは `20`、無効にするには `0` を設定します)。

返信スレッド制御:

- `channels.slack.replyToMode`: `off|first|all` (デフォルトは `off`)
- `channels.slack.replyToModeByChatType`: `direct|group|channel` に従って
- ダイレクト チャットのレガシー フォールバック: `channels.slack.dm.replyToMode`

手動返信タグがサポートされています。

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

注: `replyToMode="off"` は、明示的な `[[reply_to_*]]` タグを含む、Slack の **すべて** の返信スレッドを無効にします。これは、明示的なタグが `"off"` モードでも受け入れられる Telegram とは異なります。この違いはプラットフォームのスレッド モデルを反映しています。Slack スレッドはチャネルからのメッセージを非表示にしますが、Telegram の返信はメインのチャット フローに表示されたままになります。

## メディア、チャンキング、配信<AccordionGroup>

  <Accordion title="受信添付ファイル">
    Slack ファイルの添付ファイルは、Slack がホストするプライベート URL (トークン認証されたリクエスト フロー) からダウンロードされ、フェッチが成功し、サイズ制限が許せばメディア ストアに書き込まれます。

    `channels.slack.mediaMaxMb` によってオーバーライドされない限り、実行時の受信サイズの上限はデフォルトで `20MB` になります。

  </Accordion>

  <Accordion title="送信テキストとファイル">
    - テキスト チャンクは `channels.slack.textChunkLimit` (デフォルトは 4000) を使用します。
    - `channels.slack.chunkMode="newline"` は段落先頭の分割を有効にします
    - ファイル送信には Slack アップロード API が使用され、スレッド返信を含めることができます (`thread_ts`)
    - 設定されている場合、送信メディアの上限は `channels.slack.mediaMaxMb` に従います。それ以外の場合、チャネル送信はメディア パイプラインからの MIME 種類のデフォルトを使用します
  </Accordion>

  <Accordion title="配信対象">
    推奨される明示的なターゲット:

    - `user:<id>` DM用
    - `channel:<id>` チャネル用

    Slack DM は、ユーザーターゲットに送信するときに Slack 会話 API 経由で開かれます。

  </Accordion>
</AccordionGroup>

## アクションとゲート

Slack のアクションは `channels.slack.actions.*` によって制御されます。

現在の Slack ツールで利用可能なアクション グループ:

| グループ     | デフォルト |
| ------------ | ---------- |
| メッセージ   | 有効       |
| 反応         | 有効       |
| ピン         | 有効       |
| メンバー情報 | 有効       |
| 絵文字リスト | 有効       |

## イベントと運用動作- メッセージの編集/削除/スレッド ブロードキャストはシステム イベントにマッピングされます

- リアクション追加/削除イベントはシステム イベントにマッピングされます。
- メンバーの参加/脱退、チャンネルの作成/名前変更、およびピンの追加/削除イベントはシステム イベントにマッピングされます。
- アシスタント スレッド ステータスの更新 (スレッド内の「入力中...」インジケーター用) は `assistant.threads.setStatus` を使用し、ボット スコープ `assistant:write` を必要とします。
- `configWrites` が有効な場合、`channel_id_changed` はチャネル構成キーを移行できます。
- チャネルのトピック/目的のメタデータは信頼できないコンテキストとして扱われ、ルーティング コンテキストに挿入できます。
- ブロック アクションとモーダル インタラクションは、豊富なペイロード フィールドを含む構造化された `Slack interaction: ...` システム イベントを生成します。
  - ブロックアクション: 選択された値、ラベル、ピッカー値、および `workflow_*` メタデータ
  - ルーティングされたチャネルメタデータとフォーム入力を含むモーダル `view_submission` および `view_closed` イベント

## ACK 反応

`ackReaction` は、OpenClaw が受信メッセージを処理している間に、確認の絵文字を送信します。

解決順序:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- エージェント ID 絵文字フォールバック (`agents.list[].identity.emoji`、それ以外の場合は「👀」)

注:

- Slack はショートコード (`"eyes"` など) を想定しています。
- Slack アカウントまたはグローバルでの反応を無効にするには、`""` を使用します。

## 入力反応のフォールバック`typingReaction` は、OpenClaw が応答を処理している間に受信 Slack メッセージに一時的な応答を追加し、実行が終了すると削除します。これは、特に DM で Slack ネイティブ アシスタントの入力が利用できない場合に便利なフォールバックです

解決順序:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

注:

- Slack はショートコード (`"hourglass_flowing_sand"` など) を想定しています。
- 反応はベストエフォートで行われ、応答または失敗パスが完了した後にクリーンアップが自動的に試行されます。

## マニフェストとスコープのチェックリスト

<AccordionGroup>
  <Accordion title="Slack アプリのマニフェストの例">

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw",
      "always_online": false
    },
    "app_home": {
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "chat:write",
        "channels:history",
        "channels:read",
        "groups:history",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "users:read",
        "app_mentions:read",
        "assistant:write",
        "reactions:read",
        "reactions:write",
        "pins:read",
        "pins:write",
        "emoji:read",
        "commands",
        "files:read",
        "files:write"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_mention",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "reaction_added",
        "reaction_removed",
        "member_joined_channel",
        "member_left_channel",
        "channel_rename",
        "pin_added",
        "pin_removed"
      ]
    }
  }
}
```

  </Accordion>

  <Accordion title="オプションのユーザー トークン スコープ (読み取り操作)">
    `channels.slack.userToken` を構成する場合、一般的な読み取りスコープは次のとおりです。

    - `channels:history`、`groups:history`、`im:history`、`mpim:history`
    - `channels:read`、`groups:read`、`im:read`、`mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (Slack 検索の読み取りに依存している場合)

  </Accordion>
</AccordionGroup>

## トラブルシューティング

<AccordionGroup>
  <Accordion title="チャンネルに返信がありません">
    順番に確認してください:

    - `groupPolicy`
    - チャネル許可リスト (`channels.slack.channels`)
    - `requireMention`
    - チャネルごとの `users` 許可リスト

    便利なコマンド:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="DMメッセージは無視されました">
    確認してください:- `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (または従来の `channels.slack.dm.policy`)
    - ペアリングの承認/許可リストのエントリ

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="ソケットモードで接続できない">
    Slack アプリ設定でボット + アプリ トークンとソケット モードの有効化を検証します。
  </Accordion>

  <Accordion title="HTTP モードがイベントを受信しない">
    検証:

    - 署名の秘密
    - Webhook パス
    - Slack リクエスト URL (イベント + インタラクティブ + スラッシュ コマンド)
    - HTTP アカウントごとに一意の `webhookPath`

  </Accordion>

  <Accordion title="Native/slash commands not firing">
    次のことを意図していたかどうかを確認してください。

    - ネイティブ コマンド モード (`channels.slack.commands.native: true`) と、Slack に登録されている一致するスラッシュ コマンド
    - または単一スラッシュ コマンド モード (`channels.slack.slashCommand.enabled: true`)

    `commands.useAccessGroups` とチャネル/ユーザーの許可リストも確認してください。

  </Accordion>
</AccordionGroup>

## テキストストリーミング

OpenClaw は、エージェントおよび AI アプリ API を介した Slack ネイティブ テキスト ストリーミングをサポートしています。

`channels.slack.streaming` はライブ プレビューの動作を制御します。

- `off`: ライブ プレビュー ストリーミングを無効にします。
- `partial` (デフォルト): プレビュー テキストを最新の部分出力に置き換えます。
- `block`: チャンク化されたプレビュー更新を追加します。
- `progress`: 生成中に進行状況のテキストを表示し、最終的なテキストを送信します。

`channels.slack.nativeStreaming` は、`streaming` が `partial` (デフォルト: `true`) の場合、Slack のネイティブ ストリーミング API (`chat.startStream` / `chat.appendStream` / `chat.stopStream`) を制御します。ネイティブ Slack ストリーミングを無効にします (ドラフト プレビュー動作を維持します)。

```yaml
channels:
  slack:
    streaming: partial
    nativeStreaming: false
```

従来のキー:

- `channels.slack.streamMode` (`replace | status_final | append`) は `channels.slack.streaming` に自動移行されます。
- ブール値 `channels.slack.streaming` は `channels.slack.nativeStreaming` に自動移行されます。

### 要件

1. Slack アプリの設定で **エージェントと AI アプリ**を有効にします。
2. アプリに `assistant:write` スコープがあることを確認します。
3. そのメッセージに対して返信スレッドが使用可能である必要があります。スレッドの選択は引き続き `replyToMode` に従います。

### 行動

- 最初のテキスト チャンクがストリームを開始します (`chat.startStream`)。
- 後のテキスト チャンクは同じストリームに追加されます (`chat.appendStream`)。
- 応答の終わりによりストリームが終了します (`chat.stopStream`)。
- メディアと非テキストのペイロードは通常の配信に戻ります。
- 応答中にストリーミングが失敗した場合、OpenClaw は残りのペイロードの通常の配信に戻ります。

## 構成参照ポインタ

主な参考文献:

- [設定リファレンス - Slack](/gateway/configuration-reference#slack)シグナルの高い Slack フィールド:
  - モード/認証: `mode`、`botToken`、`appToken`、`signingSecret`、`webhookPath`、`accounts.*`
  - DM アクセス: `dm.enabled`、`dmPolicy`、`allowFrom` (従来: `dm.policy`、`dm.allowFrom`)、`dm.groupEnabled`、`dm.groupChannels`
  - 互換性切り替え: `dangerouslyAllowNameMatching` (ガラス破り; 必要な場合以外はオフにしてください)
  - チャネルアクセス: `groupPolicy`、`channels.*`、`channels.*.users`、`channels.*.requireMention`
  - スレッド/履歴: `replyToMode`、`replyToModeByChatType`、`thread.*`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`
  - 配送: `textChunkLimit`、`chunkMode`、`mediaMaxMb`、`streaming`、`nativeStreaming`
  - 操作/機能: `configWrites`、`commands.native`、`slashCommand.*`、`actions.*`、`userToken`、`userTokenReadOnly`

## 関連

- [ペアリング](/channels/pairing)
- [チャンネルルーティング](/channels/channel-routing)
- [トラブルシューティング](/channels/troubleshooting)
- [構成](/gateway/configuration)
- [スラッシュコマンド](/tools/slash-commands)
