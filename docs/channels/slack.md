---
summary: "Slack のセットアップと実行時の動作 (ソケットモード + HTTP イベント API)"
read_when:
  - Slack のセットアップまたは Slack のソケット/HTTP モードをデバッグする場合
title: "OpenClawのSlackボット連携の設定方法と配信運用ガイド"
description: "Slack アプリを OpenClaw に接続する設定と運用ガイドです。Socket Mode と HTTP Event API の違い、権限設定、ペアリングを確認できます。"
x-i18n:
  source_hash: "be99246c8d9235549e030416966b72b5db1d7d111364d35aeb2ae2760e66dc1e"
---
ステータス: Slack アプリ連携を介した DM およびチャネルでの利用が可能です。デフォルトはソケットモード（Socket Mode）ですが、HTTP イベント API モードもサポートされています。

<CardGroup cols={3}>
  <Card title="ペアリング" icon="link" href="/channels/pairing">
    Slack の DM はデフォルトでペアリングモードになります。
  </Card>
  <Card title="スラッシュコマンド" icon="terminal" href="/tools/slash-commands">
    ネイティブコマンドの動作とコマンドカタログ。
  </Card>
  <Card title="トラブルシューティング" icon="wrench" href="/channels/troubleshooting">
    チャネルを横断した診断と修復の手順。
  </Card>
</CardGroup>

## クイックセットアップ

<Tabs>
  <Tab title="ソケットモード (デフォルト)">
    <Steps>
      <Step title="Slack アプリとトークンの作成">
        Slack アプリの設定で以下の操作を行います:

        - **Socket Mode** を有効にする。
        - `connections:write` 権限を持つ **App Token** (`xapp-...`) を作成する。
        - アプリをインストールし、**Bot Token** (`xoxb-...`) をコピーする。
      </Step>

      <Step title="OpenClaw の構成">

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

        環境変数によるフォールバック (デフォルトアカウントのみ):

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="アプリイベントの購読">
        以下のボットイベントを購読（Subscribe）します:

        - `app_mention`
        - `message.channels`, `message.groups`, `message.im`, `message.mpim`
        - `reaction_added`, `reaction_removed`
        - `member_joined_channel`, `member_left_channel`
        - `channel_rename`
        - `pin_added`, `pin_removed`

        また、DM を利用するために App Home の **Messages Tab** を有効にしてください。
      </Step>

      <Step title="ゲートウェイの起動">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTP イベント API モード">
    <Steps>
      <Step title="Slack アプリを HTTP 用に構成">

        - モードを HTTP に設定 (`channels.slack.mode="http"`)。
        - Slack の **Signing Secret** をコピーする。
        - Event Subscriptions、Interactivity、および Slash command の Request URL をすべて同じ webhook パス（デフォルトは `/slack/events`）に設定する。

      </Step>

      <Step title="OpenClaw HTTP モードの構成">

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

      <Step title="マルチアカウント HTTP で一意の webhook パスを使用">
        アカウントごとの HTTP モードがサポートされています。

        登録が衝突しないように、各アカウントに個別の `webhookPath` を割り当ててください。
      </Step>
    </Steps>

  </Tab>
</Tabs>

## トークンモデル

- ソケットモードには `botToken` と `appToken` が必要です。
- HTTP モードには `botToken` と `signingSecret` が必要です。
- 構成ファイル内のトークンは、環境変数の値を上書きします。
- `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` 環境変数は、デフォルトアカウントにのみ適用されます。
- `userToken` (`xoxp-...`) は構成ファイルでのみ指定可能（環境変数なし）で、デフォルトは読み取り専用 (`userTokenReadOnly: true`) です。
- オプション: 送信メッセージにアクティブなエージェントのアイデンティティ（カスタム `username` とアイコン）を使用したい場合は、`chat:write.customize` 権限を追加してください。`icon_emoji` は `:emoji_name:` 形式を使用します。

<Tip>
アクションやディレクトリの読み取りでは、設定されていればユーザートークンが優先されます。書き込みに関してはボットトークンが優先されます。ユーザートークンによる書き込みは、`userTokenReadOnly: false` であり、かつボットトークンが利用できない場合にのみ許可されます。
</Tip>

## アクセス制御とルーティング

<Tabs>
  <Tab title="DM ポリシー">
    `channels.slack.dmPolicy` で DM アクセスを制御します (旧キー: `channels.slack.dm.policy`):

    - `pairing` (デフォルト)
    - `allowlist`
    - `open` (`channels.slack.allowFrom` に `"*"` を含める必要があります。旧キー: `channels.slack.dm.allowFrom`)
    - `disabled`

    DM 関連のフラグ:

    - `dm.enabled` (デフォルト true)
    - `channels.slack.allowFrom` (推奨)
    - `dm.allowFrom` (旧キー)
    - `dm.groupEnabled` (グループ DM。デフォルト false)
    - `dm.groupChannels` (オプション。MPIM の許可リスト)

    マルチアカウント時の優先順位:

    - `channels.slack.accounts.default.allowFrom` は `default` アカウントにのみ適用されます。
    - 名前付きアカウントは、自身の `allowFrom` が未設定の場合、`channels.slack.allowFrom` を継承します。
    - 名前付きアカウントは `channels.slack.accounts.default.allowFrom` を継承しません。

    DM でのペアリング承認には `openclaw pairing approve slack <code>` を使用します。

  </Tab>

  <Tab title="チャネルポリシー">
    `channels.slack.groupPolicy` でチャネルの扱いを制御します:

    - `open`
    - `allowlist`
    - `disabled`

    チャネルの許可リストは `channels.slack.channels` で管理します。

    注意: `channels.slack` 設定が完全に欠落している（環境変数のみのセットアップ）場合、ランタイムは `groupPolicy="allowlist"` にフォールバックし、警告をログに出力します（`channels.defaults.groupPolicy` が設定されていても同様です）。

    名前/ID の解決:

    - トークン権限がある場合、チャネルおよび DM の許可リストのエントリは起動時に解決されます。
    - 解決できなかったエントリは、設定されたままの形式で保持されます。
    - インバウンドの認証一致は、デフォルトで ID が優先されます。ユーザー名やスラッグによる直接一致を有効にするには `channels.slack.dangerouslyAllowNameMatching: true` が必要です。

  </Tab>

  <Tab title="メンションとチャネルユーザー">
    チャネルメッセージはデフォルトでメンション制約を受けます。

    メンションの判定基準:

    - 明示的なアプリへのメンション (`<@botId>`)
    - メンション正規表現パターン (`agents.list[].groupChat.mentionPatterns`, フォールバックは `messages.groupChat.mentionPatterns`)
    - ボットへの返信スレッド内での暗黙的な動作

    チャネルごとの制御 (`channels.slack.channels.<id|name>`):

    - `requireMention`
    - `users` (許可リスト)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - `toolsBySender` のキー形式: `id:`, `e164:`, `username:`, `name:`, または `"*"` ワイルドカード
      （プレフィックスのない古いキーは引き続き `id:` のみとして扱われます）

  </Tab>
</Tabs>

## コマンドとスラッシュコマンドの動作

- Slack ではネイティブコマンドの自動モードは **オフ** です (`commands.native: "auto"` では Slack のネイティブコマンドは有効になりません)。
- Slack ネイティブのコマンドハンドラーを有効にするには `channels.slack.commands.native: true` (またはグローバルな `commands.native: true`) を設定してください。
- ネイティブコマンドを有効にした場合は、Slack 側で対応するスラッシュコマンド (`/<command>` 名) を登録してください。ただし、以下の例外があります:
  - ステータスコマンドには `/agentstatus` を登録してください (Slack は `/status` を予約済みのため)。
- ネイティブコマンドが有効でない場合、`channels.slack.slashCommand` 経由で構成された単一のスラッシュコマンドを実行できます。
- ネイティブの引数メニューは、選択肢の数に応じてレンダリング戦略を自動調整します:
  - 5 つまで: ボタンブロック。
  - 6〜100 個: 静的セレクトメニュー。
  - 100 個超: インタラクティブオプションハンドラーが利用可能な場合、非同期フィルタリング付きの外部セレクト。
  - エンコードされたオプション値が Slack の制限を超える場合はボタンにフォールバックします。
- 長いオプションペイロードの場合、スラッシュコマンド引数メニューは値を送信する前に確認ダイアログを表示します。

デフォルトのスラッシュコマンド設定:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

スラッシュコマンドのセッションは分離されたキーを使用します:

- `agent:<agentId>:slack:slash:<userId>`

ただし、コマンドの実行自体はターゲットの会話セッション (`CommandTargetSessionKey`) に対してルーティングされます。

## スレッド、セッション、および返信タグ

- DM は `direct`、チャネルは `channel`、MPIM は `group` としてルーティングされます。
- デフォルトの `session.dmScope=main` 設定では、Slack の DM はエージェントのメインセッションに集約されます。
- チャネルセッション: `agent:<agentId>:slack:channel:<channelId>`。
- スレッドへの返信は、適用可能な場合にスレッドセッションサフィックス (`:thread:<threadTs>`) を作成します。
- `channels.slack.thread.historyScope` のデフォルトは `thread` です。`thread.inheritParent` のデフォルトは `false` です。
- `channels.slack.thread.initialHistoryLimit` は、新しいスレッドセッション開始時に取得する既存メッセージの数を制御します（デフォルト `20`。`0` で無効）。

返信スレッドの制御:

- `channels.slack.replyToMode`: `off|first|all` (デフォルト `off`)
- `channels.slack.replyToModeByChatType`: `direct|group|channel` ごとに設定
- ダイレクトチャット用のレガシーフォールバック: `channels.slack.dm.replyToMode`

手動返信タグがサポートされています:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

注: `replyToMode="off"` は、明示的な `[[reply_to_*]]` タグを含め、Slack における **すべての** 返信スレッド化を無効にします。これは、`"off"` モードでも明示的なタグが尊重される Telegram とは異なります。この違いはプラットフォームのスレッドモデルを反映しています（Slack のスレッドはチャネルのメインフローからメッセージを隠しますが、Telegram の返信はメインフローに見えたままになります）。

## メディア、チャンク化、配信

<AccordionGroup>
  <Accordion title="受信添付ファイル">
    Slack の添付ファイルは、Slack がホストするプライベート URL（トークン認証されたリクエストフロー）からダウンロードされ、フェッチ成功時かつサイズ制限内であればメディアストアに書き込まれます。

    インバウンドのサイズ上限はデフォルトで `20MB` です（`channels.slack.mediaMaxMb` で上書き可能）。

  </Accordion>

  <Accordion title="送信テキストとファイル">
    - テキストチャンクは `channels.slack.textChunkLimit` (デフォルト 4000) を使用します。
    - `channels.slack.chunkMode="newline"` を設定すると段落優先の分割が有効になります。
    - ファイル送信は Slack のアップロード API を使用し、スレッド返信 (`thread_ts`) を含めることができます。
    - 送信メディアの上限は `channels.slack.mediaMaxMb` に従います（設定されている場合）。未設定時はメディアパイプラインの MIME タイプごとのデフォルトが使用されます。
  </Accordion>

  <Accordion title="配信ターゲット">
    推奨される明示的なターゲット:

    - DM の場合: `user:<id>`
    - チャネルの場合: `channel:<id>`

    ユーザーターゲットに送信する場合、Slack の conversation API を介して DM が開かれます。

  </Accordion>
</AccordionGroup>

## アクションとゲート (Action Gating)

Slack のアクションは `channels.slack.actions.*` で制御されます。

現在の Slack ツールで利用可能なアクショングループ:

| グループ名 | デフォルト |
| :--- | :--- |
| `messages` | 有効 |
| `reactions` | 有効 |
| `pins` | 有効 |
| `memberInfo` | 有効 |
| `emojiList` | 有効 |

## イベントと運用の動作

- メッセージの編集、削除、スレッド放送（Thread broadcast）はシステムイベントにマップされます。
- リアクションの追加および削除イベントはシステムイベントにマップされます。
- メンバーの参加・脱退、チャネルの作成・名前変更、およびピンの追加・削除イベントはシステムイベントにマップされます。
- アシスタントのスレッドステータス更新（スレッド内の「入力中...」インジケーター用）は `assistant.threads.setStatus` を使用し、ボットスコープ `assistant:write` を必要とします。
- `configWrites` が有効な場合、`channel_id_changed` イベントによってチャネル構成キーが移行されることがあります。
- チャネルのトピックや目的（Purpose）のメタデータは信頼できないコンテキストとして扱われ、ルーティングコンテキストに注入される場合があります。
- ブロックアクションやモーダル操作は、豊富なペイロードフィールドを持つ構造化された `Slack interaction: ...` システムイベントを発行します:
  - ブロックアクション: 選択された値、ラベル、ピッカーの値、および `workflow_*` メタデータ。
  - モーダルの `view_submission` および `view_closed` イベント: ルーティングされたチャネルメタデータとフォーム入力。

## 確認リアクション (Ack reactions)

`ackReaction` は、OpenClaw がメッセージを処理している間、確認用の絵文字を送信します。

解決順序:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- エージェントのアイデンティティ絵文字 (`agents.list[].identity.emoji`, なければ "👀")

注意点:

- Slack ではショートコード（例: `"eyes"`) を指定してください。
- `""` を設定すると、そのアカウントまたはグローバルでリアクションを無効にできます。

## タイピングリアクションのフォールバック

`typingReaction` は、OpenClaw が返信を生成している間、受信メッセージに一時的なリアクションを追加し、完了後に削除します。これは、Slack ネイティブのアシスタントタイピングが利用できない場合（特に DM など）に有用なフォールバックです。

解決順序:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

注意点:

- Slack ではショートコード（例: `"hourglass_flowing_sand"`) を指定してください。
- このリアクションはベストエフォートであり、返信の完了時または失敗時に自動的に削除が試みられます。

## マニフェストとスコープのチェックリスト

<AccordionGroup>
  <Accordion title="Slack アプリマニフェストの例">

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

  <Accordion title="オプションのユーザートークンスコープ (読み取り操作)">
    `channels.slack.userToken` を構成する場合、一般的な読み取りスコープは以下の通りです:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (Slack の検索結果を読み取る必要がある場合)

  </Accordion>
</AccordionGroup>

## トラブルシューティング

<AccordionGroup>
  <Accordion title="チャネルで返信がない">
    以下の項目を順番に確認してください:

    - `groupPolicy`
    - チャネルの許可リスト (`channels.slack.channels`)
    - `requireMention`
    - チャネルごとの `users` 許可リスト

    便利なコマンド:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="DM メッセージが無視される">
    以下の項目を確認してください:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (または旧キー `channels.slack.dm.policy`)
    - ペアリングの承認状態、または許可リストのエントリ

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket Mode が接続されない">
    Slack アプリ設定で Bot トークンと App トークンが正しいか、また Socket Mode が有効になっているかを確認してください。
  </Accordion>

  <Accordion title="HTTP モードでイベントを受信しない">
    以下を確認してください:

    - Signing Secret
    - webhook パス
    - Slack の Request URL (Events, Interactivity, Slash Commands)
    - 各 HTTP アカウントごとに一意の `webhookPath` が設定されているか

  </Accordion>

  <Accordion title="ネイティブコマンド/スラッシュコマンドが動作しない">
    意図したモードが正しく設定されているか確認してください:

    - ネイティブコマンドモード (`channels.slack.commands.native: true`) で、Slack 側に一致するスラッシュコマンドが登録されているか。
    - または、単一スラッシュコマンドモード (`channels.slack.slashCommand.enabled: true`)。

    また、`commands.useAccessGroups` やチャネル/ユーザーの許可リストも確認してください。

  </Accordion>
</AccordionGroup>

## テキストストリーミング

OpenClaw は、Agents and AI Apps API を介した Slack ネイティブのテキストストリーミングをサポートしています。

`channels.slack.streaming` でライブプレビューの動作を制御します:

- `off`: ライブプレビューのストリーミングを無効にします。
- `partial` (デフォルト): プレビューテキストを最新の部分出力で置き換えます。
- `block`: チャンク化されたプレビュー更新を追記します。
- `progress`: 生成中に進行状況ステータステキストを表示し、最後に最終テキストを送信します。

`channels.slack.nativeStreaming` は、`streaming` が `partial` の場合に Slack ネイティブのストリーミング API (`chat.startStream` / `chat.appendStream` / `chat.stopStream`) を使用するかどうかを制御します (デフォルト: `true`)。

ネイティブストリーミングを無効にする（ドラフトプレビュー動作を維持する）場合:

```yaml
channels:
  slack:
    streaming: partial
    nativeStreaming: false
```

レガシーなキー:

- `channels.slack.streamMode` (`replace | status_final | append`) は `channels.slack.streaming` に自動移行されます。
- ブール値の `channels.slack.streaming` は `channels.slack.nativeStreaming` に自動移行されます。

### 要件

1. Slack アプリ設定で **Agents and AI Apps** を有効にする。
2. アプリに `assistant:write` スコープが付与されていること。
3. そのメッセージに対して返信スレッドが利用可能であること（スレッドの選択は `replyToMode` に従います）。

### 動作

- 最初のテキストチャンクでストリームが開始されます (`chat.startStream`)。
- 以降のテキストチャンクは同じストリームに追加されます (`chat.appendStream`)。
- 返信の終了時にストリームが完了します (`chat.stopStream`)。
- メディアやテキスト以外のペイロードは、通常の配信方法にフォールバックします。
- 返信の途中でストリーミングが失敗した場合、残りのペイロードは通常の配信方法で送信されます。

## 構成リファレンスのポインタ

主要なリファレンス:

- [構成リファレンス - Slack](/gateway/configuration-reference#slack)

  重要な Slack フィールド:
  - モード/認証: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
  - DM アクセス: `dm.enabled`, `dmPolicy`, `allowFrom` (旧: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
  - 互換性スイッチ: `dangerouslyAllowNameMatching` (非常時のみ。通常はオフ推奨)
  - チャネルアクセス: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
  - スレッド/履歴: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
  - 配信: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `nativeStreaming`
  - 機能/運用: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

## 関連ドキュメント

- [ペアリング](/channels/pairing)
- [チャネルルーティング](/channels/channel-routing)
- [トラブルシューティング](/channels/troubleshooting)
- [構成](/gateway/configuration)
- [スラッシュコマンド](/tools/slash-commands)
