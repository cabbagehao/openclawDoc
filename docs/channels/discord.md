---
summary: "Discord ボットのサポート状況、機能、設定"
read_when:
  - Discord チャンネル機能を扱うとき
title: "Discord"
x-i18n:
  source_hash: "62001ac1c2832bc2321787bbdb97e40240dc9478b7b4f024434e299d580f763c"
---
ステータス: 公式 Discord ゲートウェイ経由で、DM とギルドチャンネルに対応しています。

<CardGroup cols={3}>
  <Card title="ペアリング" icon="link" href="/channels/pairing">
    Discord の DM はデフォルトでペアリングモードです。
  </Card>
  <Card title="スラッシュコマンド" icon="terminal" href="/tools/slash-commands">
    ネイティブコマンドの挙動とコマンド一覧を確認できます。
  </Card>
  <Card title="チャンネルトラブルシューティング" icon="wrench" href="/channels/troubleshooting">
    チャンネル横断の診断手順と修復フローを確認できます。
  </Card>
</CardGroup>

## クイックセットアップ

新しいアプリケーションとボットを作成し、ボットを Discord サーバーに追加したうえで、OpenClaw とペアリングする必要があります。ボットは、自分専用のプライベートサーバーに追加する構成を推奨します。まだサーバーがない場合は、先に [作成してください](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server)（**Create My Own > For me and my friends** を選択します）。

<Steps>
  <Step title="Discord アプリケーションとボットを作成する">
    [Discord Developer Portal](https://discord.com/developers/applications) に移動し、**New Application** をクリックします。名前は「OpenClaw」などで構いません。

    左側の **Bot** を開き、**Username** を OpenClaw エージェントとして使いたい名前に設定します。

  </Step>

  <Step title="特権インテントを有効にする">
    引き続き **Bot** ページで、**Privileged Gateway Intents** までスクロールし、次を有効にします。

    - **Message Content Intent**（必須）
    - **Server Members Intent**（推奨。ロール allowlist と名前から ID への解決に必要です）
    - **Presence Intent**（任意。プレゼンス更新を受信する場合のみ必要です）

  </Step>

  <Step title="ボットトークンをコピーする">
    **Bot** ページ上部に戻り、**Reset Token** をクリックします。

    <Note>
    名前に反して、ここでは最初のトークンが生成されます。既存の何かが「リセット」されるわけではありません。
    </Note>

    表示されたトークンをコピーして安全な場所に保存します。これは **Bot Token** であり、後続の設定で使用します。

  </Step>

  <Step title="招待 URL を生成してボットをサーバーに追加する">
    左側の **OAuth2** を開き、ボットをサーバーに追加するための招待 URL を生成します。

    **OAuth2 URL Generator** までスクロールし、次を有効にします。

    - `bot`
    - `applications.commands`

    その下に **Bot Permissions** が表示されるので、次を有効にします。

    - View Channels
    - Send Messages
    - Read Message History
    - Embed Links
    - Attach Files
    - Add Reactions（任意）

    下部に表示された URL をコピーしてブラウザで開き、対象サーバーを選択して **Continue** を押します。完了すると、Discord サーバーにボットが追加されます。

  </Step>

  <Step title="Developer Mode を有効にして ID を取得する">
    Discord アプリ側で Developer Mode を有効にし、内部 ID をコピーできるようにします。

    1. **User Settings**（アバター横の歯車）→ **Advanced** → **Developer Mode** をオンにする
    2. サイドバーの **サーバーアイコン** を右クリックして **Copy Server ID**
    3. **自分のアバター** を右クリックして **Copy User ID**

    **Server ID** と **User ID** は、Bot Token とあわせて保存しておきます。次の手順でこの 3 つを使います。

  </Step>

  <Step title="サーバーメンバーからの DM を許可する">
    ペアリングを成立させるには、Discord 側でボットから DM を受け取れる必要があります。**サーバーアイコン** を右クリックし、**Privacy Settings** を開いて **Direct Messages** をオンにします。

    これにより、サーバーメンバー（ボットを含む）から DM を受信できます。OpenClaw で Discord DM を使う場合は、この設定を有効のままにしてください。ギルドチャンネルだけを使う予定であれば、ペアリング完了後に無効化しても構いません。

  </Step>

  <Step title="Step 0: ボットトークンを安全に設定する（チャットには送らない）">
    Discord のボットトークンは、パスワードと同様に機密情報です。エージェントへメッセージを送る前に、OpenClaw を動かしているマシンに設定してください。

```bash
openclaw config set channels.discord.token '"YOUR_BOT_TOKEN"' --json
openclaw config set channels.discord.enabled true --json
openclaw gateway
```

    すでに OpenClaw をバックグラウンドサービスとして実行している場合は、`openclaw gateway restart` を使います。

  </Step>

  <Step title="OpenClaw を設定してペアリングする">

    <Tabs>
      <Tab title="エージェントに依頼する">
        既存のチャンネル（例: Telegram）で OpenClaw エージェントに次のように伝えます。Discord が最初のチャンネルである場合は、CLI / config タブを使ってください。

        > 「Discord の bot token はすでに config に設定済みです。User ID `<user_id>` と Server ID `<server_id>` を使って Discord のセットアップを完了してください。」
      </Tab>
      <Tab title="CLI / config">
        ファイルベースで設定する場合は、次のように指定します。

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: "YOUR_BOT_TOKEN",
    },
  },
}
```

        デフォルトアカウントでは、環境変数によるフォールバックも使用できます。

```bash
DISCORD_BOT_TOKEN=...
```

        `channels.discord.token` には SecretRef（env/file/exec プロバイダー）も利用できます。詳しくは [Secrets Management](/gateway/secrets) を参照してください。

      </Tab>
    </Tabs>

  </Step>

  <Step title="最初の DM ペアリングを承認する">
    ゲートウェイが起動していることを確認したうえで、Discord からボットへ DM を送ります。ボットからペアリングコードが返されます。

    <Tabs>
      <Tab title="エージェントに依頼する">
        既存のチャンネル上でエージェントにペアリングコードを送ります。

        > 「この Discord のペアリングコードを承認してください: `<CODE>`」
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    ペアリングコードの有効期限は 1 時間です。

    これで Discord の DM からエージェントと会話できるようになります。

  </Step>
</Steps>

<Note>
トークン解決はアカウント単位で行われます。config に設定されたトークンが環境変数より優先されます。`DISCORD_BOT_TOKEN` が使われるのはデフォルトアカウントだけです。
</Note>

## 推奨: ギルドワークスペースを用意する

DM が動作したら、Discord サーバー全体をワークスペースとして構成できます。各チャンネルは独自のコンテキストを持つ個別のエージェントセッションになり、プライベートサーバーではこの構成が特に有効です。

<Steps>
  <Step title="サーバーをギルド allowlist に追加する">
    これにより、エージェントは DM だけでなく、サーバー内のチャンネルにも応答できるようになります。

    <Tabs>
      <Tab title="エージェントに依頼する">
        > 「Discord Server ID `<server_id>` を guild allowlist に追加してください」
      </Tab>
      <Tab title="Config">

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        YOUR_SERVER_ID: {
          requireMention: true,
          users: ["YOUR_USER_ID"],
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="@mention なしでも応答できるようにする">
    デフォルトでは、ギルドチャンネルではエージェントへの @mention がある場合だけ応答します。プライベートサーバーでは、すべてのメッセージに応答させたいケースが多くあります。

    <Tabs>
      <Tab title="エージェントに依頼する">
        > 「このサーバーでは、@mention なしでもエージェントが応答できるようにしてください」
      </Tab>
      <Tab title="Config">
        ギルド設定で `requireMention: false` を指定します。

```json5
{
  channels: {
    discord: {
      guilds: {
        YOUR_SERVER_ID: {
          requireMention: false,
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="ギルドチャンネルでのメモリの扱いを決める">
    デフォルトでは、長期メモリ（`MEMORY.md`）は DM セッションでのみ自動読み込みされます。ギルドチャンネルでは自動では読み込まれません。

    <Tabs>
      <Tab title="エージェントに依頼する">
        > 「Discord チャンネルで質問したとき、`MEMORY.md` の長期コンテキストが必要なら `memory_search` または `memory_get` を使ってください」
      </Tab>
      <Tab title="手動で設定する">
        すべてのチャンネルで共通コンテキストを使いたい場合は、安定した指示を `AGENTS.md` や `USER.md` に置きます。これらはすべてのセッションに注入されます。長期メモは `MEMORY.md` に保持し、必要なときだけメモリツールで参照する運用を推奨します。
      </Tab>
    </Tabs>

  </Step>
</Steps>

ここまで完了したら、Discord サーバー上にいくつかチャンネルを作成して会話を始めてください。エージェントはチャンネル名を認識でき、各チャンネルには独立したセッションキーが割り当てられます。`#coding`、`#home`、`#research` など、用途ごとに分けて運用できます。

## ランタイムモデル

- ゲートウェイが Discord 接続を保持します。
- 応答ルーティングは決定的です。Discord から入った返信は Discord に返ります。
- デフォルトでは（`session.dmScope=main`）、DM はエージェントのメインセッション（`agent:main:main`）を共有します。
- ギルドチャンネルは独立したセッションキー（`agent:<agentId>:discord:channel:<channelId>`）として扱われます。
- グループ DM はデフォルトで無視されます（`channels.discord.dm.groupEnabled=false`）。
- ネイティブスラッシュコマンドは独立したコマンドセッション（`agent:<agentId>:discord:slash:<userId>`）で実行されますが、ルーティング先の会話セッションに対する `CommandTargetSessionKey` は保持されます。

## フォーラムチャンネル

Discord の forum チャンネルと media チャンネルでは、投稿はスレッド形式のみ受け付けられます。OpenClaw では、次の 2 通りの作成方法に対応しています。

- forum 親（`channel:<forumId>`）にメッセージを送信してスレッドを自動作成する
- `openclaw message thread create` でスレッドを直接作成する。forum チャンネルでは `--message-id` を渡さないでください

例: forum 親に送信してスレッドを作成する

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

例: forum スレッドを明示的に作成する

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

forum 親では Discord コンポーネントを受け付けません。コンポーネントが必要な場合は、スレッド本体（`channel:<threadId>`）に送信してください。

## インタラクティブコンポーネント

OpenClaw は、エージェントメッセージ向けに Discord components v2 コンテナをサポートしています。`components` ペイロードを含む message ツールを使用してください。インタラクション結果は通常の受信メッセージとしてエージェントへ戻り、既存の Discord `replyToMode` 設定に従って処理されます。

サポートされるブロック:

- `text`、`section`、`separator`、`actions`、`media-gallery`、`file`
- action row では最大 5 個のボタン、または 1 個の select menu を使用できます
- select の型は `string`、`user`、`role`、`mentionable`、`channel` です

デフォルトでは、コンポーネントは 1 回限りの利用です。`components.reusable=true` を指定すると、有効期限が切れるまでボタン、select、フォームを複数回利用できます。

ボタンを押せるユーザーを制限するには、そのボタンに `allowedUsers` を設定します（Discord ユーザー ID、タグ、または `*`）。設定されている場合、一致しないユーザーには一時的な拒否メッセージが返されます。

`/model` と `/models` スラッシュコマンドでは、プロバイダーとモデルのドロップダウン、および Submit ステップを持つ対話型モデルピッカーが開きます。ピッカーの応答は ephemeral で、実行したユーザーだけが利用できます。

ファイル添付:

- `file` ブロックは、添付参照（`attachment://<filename>`）を指している必要があります
- 添付ファイルは `media` / `path` / `filePath`（単一ファイル）で渡します。複数ファイルには `media-gallery` を使用してください
- 添付参照名とアップロード名を一致させたい場合は、`filename` でアップロード名を上書きします

モーダルフォーム:

- 最大 5 フィールドまで持てる `components.modal` を追加できます
- フィールド型は `text`、`checkbox`、`radio`、`select`、`role-select`、`user-select` です
- OpenClaw がトリガーボタンを自動で追加します

例:

```json5
{
  channel: "discord",
  action: "send",
  to: "channel:123456789012345678",
  message: "Optional fallback text",
  components: {
    reusable: true,
    text: "Choose a path",
    blocks: [
      {
        type: "actions",
        buttons: [
          {
            label: "Approve",
            style: "success",
            allowedUsers: ["123456789012345678"],
          },
          { label: "Decline", style: "danger" },
        ],
      },
      {
        type: "actions",
        select: {
          type: "string",
          placeholder: "Pick an option",
          options: [
            { label: "Option A", value: "a" },
            { label: "Option B", value: "b" },
          ],
        },
      },
    ],
    modal: {
      title: "Details",
      triggerLabel: "Open form",
      fields: [
        { type: "text", label: "Requester" },
        {
          type: "select",
          label: "Priority",
          options: [
            { label: "Low", value: "low" },
            { label: "High", value: "high" },
          ],
        },
      ],
    },
  },
}
```

## アクセス制御とルーティング

<Tabs>
  <Tab title="DM ポリシー">
    `channels.discord.dmPolicy` は DM へのアクセスを制御します（旧設定: `channels.discord.dm.policy`）。

    - `pairing`（デフォルト）
    - `allowlist`
    - `open`（`channels.discord.allowFrom` に `"*"` を含める必要があります。旧設定: `channels.discord.dm.allowFrom`）
    - `disabled`

    DM ポリシーが `open` でない場合、不明なユーザーはブロックされます。`pairing` モードではペアリングが要求されます。

    マルチアカウント時の優先順位:

    - `channels.discord.accounts.default.allowFrom` は `default` アカウントにのみ適用されます
    - 名前付きアカウントは、自身の `allowFrom` が未設定なら `channels.discord.allowFrom` を継承します
    - 名前付きアカウントは `channels.discord.accounts.default.allowFrom` を継承しません

    DM 配信時のターゲット形式:

    - `user:<id>`
    - `<@id>` 形式の mention

    数値 ID を裸で渡すと曖昧になるため、明示的な user/channel ターゲット種別がない限り拒否されます。

  </Tab>

  <Tab title="ギルドポリシー">
    ギルドの処理は `channels.discord.groupPolicy` で制御されます。

    - `open`
    - `allowlist`
    - `disabled`

    `channels.discord` ブロックが存在する場合の安全なベースラインは `allowlist` です。

    `allowlist` の挙動:

    - ギルドは `channels.discord.guilds` に一致する必要があります（`id` 推奨、slug も可）
    - 送信者 allowlist として `users` と `roles` を任意で指定できます。どちらかが設定されている場合、送信者は `users` または `roles` のどちらかに一致すれば許可されます
    - 直接の名前／タグ一致はデフォルトで無効です。互換性維持のための緊急措置としてのみ `channels.discord.dangerouslyAllowNameMatching: true` を使ってください
    - `users` には名前やタグも指定できますが、監査の安定性を考えると ID の使用を推奨します。`openclaw security audit` は名前／タグ指定に対して警告を出します
    - ギルドに `channels` が設定されている場合、列挙されていないチャンネルは拒否されます
    - ギルドに `channels` ブロックがなければ、その allowlist 対象ギルド内の全チャンネルが許可されます

    例:

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "123456789012345678": {
          requireMention: true,
          ignoreOtherMentions: true,
          users: ["987654321098765432"],
          roles: ["123456789012345678"],
          channels: {
            general: { allow: true },
            help: { allow: true, requireMention: true },
          },
        },
      },
    },
  },
}
```

    `DISCORD_BOT_TOKEN` だけを設定し、`channels.discord` ブロックを作成していない場合でも、ランタイムのフォールバックは `groupPolicy="allowlist"` です（ログに警告が出ます）。`channels.defaults.groupPolicy` が `open` でも同様です。

  </Tab>

  <Tab title="メンションとグループ DM">
    ギルドメッセージはデフォルトで mention によるゲート制御が有効です。

    mention 検出には次が含まれます。

    - ボットへの明示的な mention
    - 設定済みの mention パターン（`agents.list[].groupChat.mentionPatterns`、未設定時は `messages.groupChat.mentionPatterns`）
    - 対応ケースにおける、ボット宛て返信の暗黙的判定

    `requireMention` はギルドまたはチャンネル単位（`channels.discord.guilds...`）で設定します。
    `ignoreOtherMentions` を有効にすると、ボットに言及せず別のユーザーやロールだけを mention しているメッセージを無視できます（`@everyone` / `@here` は除外されます）。

    グループ DM:

    - デフォルトでは無視されます（`dm.groupEnabled=false`）
    - 必要であれば `dm.groupChannels` で allowlist 指定できます（チャンネル ID または slug）

  </Tab>
</Tabs>

### ロールベースのエージェントルーティング

`bindings[].match.roles` を使うと、Discord ギルドメンバーをロール ID に応じて別のエージェントへ振り分けられます。ロールベースの binding はロール ID のみを受け付け、評価順は peer / parent-peer binding の後、guild 単位 binding の前です。binding に `peer`、`guildId`、`roles` など複数の条件がある場合は、設定されたすべての条件に一致する必要があります。

```json5
{
  bindings: [
    {
      agentId: "opus",
      match: {
        channel: "discord",
        guildId: "123456789012345678",
        roles: ["111111111111111111"],
      },
    },
    {
      agentId: "sonnet",
      match: {
        channel: "discord",
        guildId: "123456789012345678",
      },
    },
  ],
}
```

## Developer Portal の設定

<AccordionGroup>
  <Accordion title="アプリとボットを作成する">

    1. Discord Developer Portal → **Applications** → **New Application**
    2. **Bot** → **Add Bot**
    3. ボットトークンをコピーする

  </Accordion>

  <Accordion title="特権インテント">
    **Bot → Privileged Gateway Intents** で次を有効にします。

    - Message Content Intent
    - Server Members Intent（推奨）

    Presence Intent は任意で、メンバーのプレゼンス更新を受信したい場合にのみ必要です。ボット自身のプレゼンス設定（`setPresence`）だけであれば、メンバー向けの presence updates を有効化する必要はありません。

  </Accordion>

  <Accordion title="OAuth スコープと基本権限">
    OAuth URL generator:

    - scopes: `bot`, `applications.commands`

    一般的な最小権限:

    - View Channels
    - Send Messages
    - Read Message History
    - Embed Links
    - Attach Files
    - Add Reactions（任意）

    明示的に必要な場合を除き、`Administrator` は付与しないでください。

  </Accordion>

  <Accordion title="ID をコピーする">
    Discord の Developer Mode を有効にしたうえで、次の ID をコピーします。

    - server ID
    - channel ID
    - user ID

    OpenClaw の設定では、監査や probe の信頼性のため、数値 ID の使用を推奨します。

  </Accordion>
</AccordionGroup>

## ネイティブコマンドとコマンド認可

- `commands.native` のデフォルトは `"auto"` で、Discord では有効になります
- チャンネル単位の上書きは `channels.discord.commands.native` です
- `commands.native=false` を指定すると、以前に登録された Discord ネイティブコマンドを明示的に削除します
- ネイティブコマンドの認可には、通常メッセージ処理と同じ Discord allowlist / policy が使われます
- 権限のないユーザーにも Discord UI 上でコマンドが見えることがありますが、実行時には OpenClaw の認可が適用され、"not authorized" が返ります

コマンド一覧と挙動は [Slash commands](/tools/slash-commands) を参照してください。

デフォルトのスラッシュコマンド設定:

- `ephemeral: true`

## 機能の詳細

<AccordionGroup>
  <Accordion title="返信タグとネイティブ返信">
    Discord は、エージェント出力に含まれる返信タグをサポートします。

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    これらは `channels.discord.replyToMode` で制御されます。

    - `off`（デフォルト）
    - `first`
    - `all`

    注: `off` は暗黙的な reply threading を無効にしますが、明示的な `[[reply_to_*]]` タグは引き続き有効です。

    メッセージ ID はコンテキストや履歴にも現れるため、エージェントは特定のメッセージを対象にできます。

  </Accordion>

  <Accordion title="ライブストリームプレビュー">
    OpenClaw は、一時メッセージを送信し、テキストの到着にあわせて編集することで、返信ドラフトをストリーミング表示できます。

    - `channels.discord.streaming` はプレビュー配信を制御します（`off` | `partial` | `block` | `progress`、デフォルト: `off`）
    - `progress` はチャンネル間の一貫性のために受け付けられ、Discord では `partial` にマッピングされます
    - `channels.discord.streamMode` は旧エイリアスで、自動移行されます
    - `partial` では、トークン到着に応じて 1 つのプレビューメッセージを編集します
    - `block` では、ドラフトサイズのチャンク単位で出力します。サイズや分割位置は `draftChunk` で調整できます

    例:

```json5
{
  channels: {
    discord: {
      streaming: "partial",
    },
  },
}
```

    `block` モードのデフォルトチャンク設定（`channels.discord.textChunkLimit` の範囲内に丸められます）:

```json5
{
  channels: {
    discord: {
      streaming: "block",
      draftChunk: {
        minChars: 200,
        maxChars: 800,
        breakPreference: "paragraph",
      },
    },
  },
}
```

    プレビュー配信はテキストのみが対象で、メディア返信は通常の配信にフォールバックします。

    注: preview streaming と block streaming は別機能です。Discord で block streaming が明示的に有効になっている場合、OpenClaw は二重配信を避けるため preview stream をスキップします。

  </Accordion>

  <Accordion title="履歴、コンテキスト、スレッド挙動">
    ギルド履歴コンテキスト:

    - `channels.discord.historyLimit` のデフォルトは `20`
    - フォールバックは `messages.groupChat.historyLimit`
    - `0` を指定すると無効になります

    DM 履歴の制御:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    スレッド挙動:

    - Discord スレッドはチャンネルセッションとしてルーティングされます
    - 親スレッドのメタデータは、親セッションとの関連付けに利用できます
    - スレッド固有の設定がない場合、スレッド設定は親チャンネル設定を継承します

    チャンネルトピックは **信頼されない** コンテキストとして注入されます。システムプロンプトとしては扱われません。

  </Accordion>

  <Accordion title="サブエージェント向けスレッド固定セッション">
    Discord では、スレッドを特定のセッションターゲットに固定できます。これにより、そのスレッドでの後続メッセージは同じセッション（サブエージェントセッションを含む）へ継続してルーティングされます。

    コマンド:

    - `/focus <target>` 現在または新規スレッドをサブエージェント / セッションターゲットへ固定する
    - `/unfocus` 現在のスレッド固定を解除する
    - `/agents` アクティブな実行と binding 状態を表示する
    - `/session idle <duration|off>` 固定中セッションの無操作による自動 unfocus 設定を確認 / 更新する
    - `/session max-age <duration|off>` 固定中セッションの最大寿命を確認 / 更新する

    設定:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        idleHours: 24,
        maxAgeHours: 0,
        spawnSubagentSessions: false, // opt-in
      },
    },
  },
}
```

    注意:

    - `session.threadBindings.*` はグローバルデフォルトを設定します
    - `channels.discord.threadBindings.*` は Discord 用の挙動を上書きします
    - `sessions_spawn({ thread: true })` に対してスレッドを自動作成 / 固定するには `spawnSubagentSessions` を true にする必要があります
    - ACP（`/acp spawn ... --thread ...` または `sessions_spawn({ runtime: "acp", thread: true })`）でスレッドを自動作成 / 固定するには `spawnAcpSessions` を true にする必要があります
    - アカウントで thread binding が無効化されている場合、`/focus` および関連操作は利用できません

    詳しくは [Sub-agents](/tools/subagents)、[ACP Agents](/tools/acp-agents)、[Configuration Reference](/gateway/configuration-reference) を参照してください。

  </Accordion>

  <Accordion title="永続的な ACP チャンネル binding">
    安定した「常時接続」型の ACP ワークスペースを実現するには、Discord 会話を対象にしたトップレベルの型付き ACP binding を設定します。

    設定パス:

    - `bindings[]` に `type: "acp"` と `match.channel: "discord"` を指定します

    例:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": {
              requireMention: false,
            },
          },
        },
      },
    },
  },
}
```

    注意:

    - スレッドメッセージは親チャンネルの ACP binding を継承できます
    - binding 済みのチャンネルまたはスレッドでは、`/new` と `/reset` は同じ ACP セッションをその場でリセットします
    - 一時的な thread binding も引き続き利用でき、アクティブな間はターゲット解決を上書きできます

    binding の詳細は [ACP Agents](/tools/acp-agents) を参照してください。

  </Accordion>

  <Accordion title="リアクション通知">
    ギルド単位のリアクション通知モード:

    - `off`
    - `own`（デフォルト）
    - `all`
    - `allowlist`（`guilds.<id>.users` を使用）

    リアクションイベントはシステムイベントへ変換され、ルーティング済みの Discord セッションに付与されます。

  </Accordion>

  <Accordion title="ack リアクション">
    `ackReaction` は、OpenClaw が受信メッセージを処理中であることを示す絵文字リアクションを送ります。

    解決順序:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - エージェント identity の絵文字フォールバック（`agents.list[].identity.emoji`、未設定時は `"👀"`）

    注意:

    - Discord は Unicode 絵文字とカスタム絵文字名の両方を受け付けます
    - チャンネルまたはアカウント単位で無効化するには `""` を使います

  </Accordion>

  <Accordion title="設定の書き込み">
    チャンネル起点の設定書き込みは、デフォルトで有効です。

    これは `/config set|unset` のフローに影響します（コマンド機能が有効な場合）。

    無効化:

```json5
{
  channels: {
    discord: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="ゲートウェイプロキシ">
    `channels.discord.proxy` を使うと、Discord ゲートウェイの WebSocket 通信と起動時の REST 参照（application ID と allowlist 解決）を HTTP(S) プロキシ経由にできます。

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    アカウント単位の上書き:

```json5
{
  channels: {
    discord: {
      accounts: {
        primary: {
          proxy: "http://proxy.example:8080",
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="PluralKit サポート">
    PluralKit 解決を有効にすると、プロキシされたメッセージをシステムメンバーの identity にマッピングできます。

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // optional; needed for private systems
      },
    },
  },
}
```

    注意:

    - allowlist では `pk:<memberId>` を使用できます
    - メンバー表示名の名前 / slug 一致は、`channels.discord.dangerouslyAllowNameMatching: true` のときだけ有効です
    - 参照には元のメッセージ ID が使われ、時間窓の制約があります
    - 解決に失敗した場合、プロキシメッセージは bot メッセージとして扱われ、`allowBots=true` でない限り破棄されます

  </Accordion>

  <Accordion title="プレゼンス設定">
    プレゼンス更新は、status または activity を設定したとき、あるいは auto presence を有効にしたときに適用されます。

    status のみを設定する例:

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    activity を設定する例（デフォルトの activity type は custom status）:

```json5
{
  channels: {
    discord: {
      activity: "Focus time",
      activityType: 4,
    },
  },
}
```

    streaming の例:

```json5
{
  channels: {
    discord: {
      activity: "Live coding",
      activityType: 1,
      activityUrl: "https://twitch.tv/openclaw",
    },
  },
}
```

    activity type の対応:

    - 0: Playing
    - 1: Streaming（`activityUrl` 必須）
    - 2: Listening
    - 3: Watching
    - 4: Custom（activity テキストを status state として使います。絵文字は任意です）
    - 5: Competing

    auto presence の例（ランタイム健全性シグナル）:

```json5
{
  channels: {
    discord: {
      autoPresence: {
        enabled: true,
        intervalMs: 30000,
        minUpdateIntervalMs: 15000,
        exhaustedText: "token exhausted",
      },
    },
  },
}
```

    auto presence は、ランタイム可用性を Discord status にマッピングします。healthy は online、degraded または unknown は idle、exhausted または unavailable は dnd になります。テキスト上書き:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText`（`{reason}` プレースホルダー対応）

  </Accordion>

  <Accordion title="Discord 上での exec 承認">
    Discord は、DM 内でのボタンベース exec 承認に対応しており、必要に応じて元のチャンネルに承認プロンプトを投稿することもできます。

    設定パス:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers`
    - `channels.discord.execApprovals.target`（`dm` | `channel` | `both`、デフォルト: `dm`）
    - `agentFilter`、`sessionFilter`、`cleanupAfterResolve`

    `target` が `channel` または `both` の場合、承認プロンプトはチャンネルにも表示されます。ボタンを使えるのは設定された承認者だけで、その他のユーザーには ephemeral の拒否が返されます。承認プロンプトにはコマンド本文が含まれるため、チャンネル配信は信頼できるチャンネルにだけ有効化してください。セッションキーからチャンネル ID を導出できない場合、OpenClaw は DM 配信へフォールバックします。

    このハンドラーのゲートウェイ認可には、他のゲートウェイクライアントと同じ共有認証情報解決契約が使われます。

    - env 優先のローカル認可（`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`、次に `gateway.auth.*`）
    - ローカルモードでは、`gateway.auth.*` が未設定なら `gateway.remote.*` をフォールバックとして使用可能
    - 必要に応じて `gateway.remote.*` によるリモートモードをサポート
    - URL override は override-safe です。CLI override は暗黙の認証情報を再利用せず、env override は env の認証情報だけを使います

    承認時に unknown approval ID エラーが出る場合は、承認者一覧と機能の有効化状態を確認してください。

    関連ドキュメント: [Exec approvals](/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## ツールとアクションゲート

Discord の message action には、メッセージ送受信、チャンネル管理、モデレーション、プレゼンス、メタデータ関連のアクションが含まれます。

代表例:

- messaging: `sendMessage`、`readMessages`、`editMessage`、`deleteMessage`、`threadReply`
- reactions: `react`、`reactions`、`emojiList`
- moderation: `timeout`、`kick`、`ban`
- presence: `setPresence`

action gate は `channels.discord.actions.*` 配下にあります。

デフォルトの gate 挙動:

| Action group                                                                                                                                                             | Default  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | enabled  |
| roles                                                                                                                                                                    | disabled |
| moderation                                                                                                                                                               | disabled |
| presence                                                                                                                                                                 | disabled |

## コンポーネント v2 UI

OpenClaw は、exec 承認と cross-context marker に Discord components v2 を使用します。Discord の message action では、カスタム UI 用の `components` も受け付けられます（高度な用途。Carbon component instance が必要です）。従来の `embeds` も引き続き利用できますが、推奨はされません。

- `channels.discord.ui.components.accentColor` は、Discord component container で使用するアクセントカラー（16 進数）を設定します
- アカウント単位では `channels.discord.accounts.<id>.ui.components.accentColor` で設定します
- components v2 が存在する場合、`embeds` は無視されます

例:

```json5
{
  channels: {
    discord: {
      ui: {
        components: {
          accentColor: "#5865F2",
        },
      },
    },
  },
}
```

## 音声チャンネル

OpenClaw は Discord の音声チャンネルに参加し、リアルタイムで継続的な会話を行えます。これは音声メッセージ添付とは別機能です。

要件:

- ネイティブコマンド（`commands.native` または `channels.discord.commands.native`）を有効にする
- `channels.discord.voice` を設定する
- ボットに対象音声チャンネルでの Connect と Speak 権限を付与する

セッション制御には Discord 専用のネイティブコマンド `/vc join|leave|status` を使います。このコマンドはアカウントのデフォルトエージェントを使い、他の Discord コマンドと同じ allowlist と group policy ルールに従います。

自動参加の例:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        tts: {
          provider: "openai",
          openai: { voice: "alloy" },
        },
      },
    },
  },
}
```

注意:

- `voice.tts` は音声再生に限って `messages.tts` を上書きします
- 音声 transcript turn の owner 判定は Discord の `allowFrom`（または `dm.allowFrom`）から導かれます。owner でない発話者は、`gateway` や `cron` などの owner 限定ツールにアクセスできません
- 音声機能はデフォルトで有効です。無効化するには `channels.discord.voice.enabled=false` を設定します
- `voice.daveEncryption` と `voice.decryptionFailureTolerance` は `@discordjs/voice` の join option にそのまま渡されます
- `@discordjs/voice` 側のデフォルトは、未設定時に `daveEncryption=true` および `decryptionFailureTolerance=24` です
- OpenClaw は受信時の復号失敗も監視し、短時間に繰り返し失敗した場合は音声チャンネルから一度離脱して再参加することで自動回復を試みます
- 受信ログに `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` が繰り返し出る場合は、上流の `@discordjs/voice` 受信バグである [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) に該当している可能性があります

## 音声メッセージ

Discord の音声メッセージでは波形プレビューが表示され、OGG/Opus 音声とメタデータが必要です。OpenClaw は波形を自動生成しますが、音声ファイルを検査して変換するために、ゲートウェイホスト上で `ffmpeg` と `ffprobe` が利用可能である必要があります。

要件と制約:

- **ローカルファイルパス** を指定してください（URL は拒否されます）
- テキスト本文は省略してください（Discord は同じペイロード内でテキストと音声メッセージを同時に送れません）
- 音声形式は任意です。必要に応じて OpenClaw が OGG/Opus に変換します

例:

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## トラブルシューティング

<AccordionGroup>
  <Accordion title="許可されていない intent を使っている、またはボットがギルドメッセージを受信できない">

    - Message Content Intent を有効にする
    - ユーザー / メンバー解決に依存する場合は Server Members Intent も有効にする
    - intent を変更したあとはゲートウェイを再起動する

  </Accordion>

  <Accordion title="ギルドメッセージが予期せずブロックされる">

    - `groupPolicy` を確認する
    - `channels.discord.guilds` 配下の guild allowlist を確認する
    - guild の `channels` マップが存在する場合、列挙されたチャンネルだけが許可される
    - `requireMention` の挙動と mention パターンを確認する

    便利な確認コマンド:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="requireMention=false なのにブロックされる">
    よくある原因:

    - `groupPolicy="allowlist"` だが、一致する guild / channel allowlist がない
    - `requireMention` の設定場所が誤っている（`channels.discord.guilds` または channel entry の下である必要があります）
    - 送信者が guild / channel の `users` allowlist によってブロックされている

  </Accordion>

  <Accordion title="長時間実行されるハンドラーがタイムアウトする、または返信が重複する">

    典型的なログ:

    - `Listener DiscordMessageListener timed out after 30000ms for event MESSAGE_CREATE`
    - `Slow listener detected ...`
    - `discord inbound worker timed out after ...`

    listener budget の設定:

    - 単一アカウント: `channels.discord.eventQueue.listenerTimeout`
    - マルチアカウント: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`

    worker 実行タイムアウトの設定:

    - 単一アカウント: `channels.discord.inboundWorker.runTimeoutMs`
    - マルチアカウント: `channels.discord.accounts.<accountId>.inboundWorker.runTimeoutMs`
    - デフォルト: `1800000`（30 分）。無効化するには `0` を指定します

    推奨ベースライン:

```json5
{
  channels: {
    discord: {
      accounts: {
        default: {
          eventQueue: {
            listenerTimeout: 120000,
          },
          inboundWorker: {
            runTimeoutMs: 1800000,
          },
        },
      },
    },
  },
}
```

    遅い listener のための余裕を増やしたい場合は `eventQueue.listenerTimeout` を使います。キュー済みエージェントターンに別の安全弁が必要な場合にだけ `inboundWorker.runTimeoutMs` を調整してください。

  </Accordion>

  <Accordion title="権限監査の不一致">
    `channels status --probe` の権限チェックは、数値チャンネル ID に対してのみ完全に機能します。

    slug キーを使用していても、ランタイム上のマッチング自体は可能ですが、probe では権限を完全には検証できません。

  </Accordion>

  <Accordion title="DM とペアリングの問題">

    - DM が無効化されている: `channels.discord.dm.enabled=false`
    - DM policy が無効化されている: `channels.discord.dmPolicy="disabled"`（旧設定: `channels.discord.dm.policy`）
    - `pairing` モードでペアリング承認待ちになっている

  </Accordion>

  <Accordion title="bot 同士のループ">
    デフォルトでは、bot が投稿したメッセージは無視されます。

    `channels.discord.allowBots=true` を使う場合は、ループを防ぐために厳格な mention ルールと allowlist を組み合わせてください。通常は、ボット自身への mention を含む bot メッセージだけを受け付ける `channels.discord.allowBots="mentions"` を推奨します。

  </Accordion>

  <Accordion title="音声 STT が DecryptionFailed(...) で落ちる">

    - Discord 音声受信の回復ロジックが入っているよう、OpenClaw を最新に保つ（`openclaw update`）
    - `channels.discord.voice.daveEncryption=true`（デフォルト）を確認する
    - `channels.discord.voice.decryptionFailureTolerance=24`（上流デフォルト）から始め、必要な場合だけ調整する
    - 次のログを確認する:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - 自動再参加後も失敗が続く場合は、ログを収集して [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) と比較する

  </Accordion>
</AccordionGroup>

## 設定リファレンスの参照先

主な参照先:

- [Configuration reference - Discord](/gateway/configuration-reference#discord)

特に確認頻度の高い Discord フィールド:

- 起動 / 認可: `enabled`、`token`、`accounts.*`、`allowBots`
- policy: `groupPolicy`、`dm.*`、`guilds.*`、`guilds.*.channels.*`
- command: `commands.native`、`commands.useAccessGroups`、`configWrites`、`slashCommand.*`
- event queue: `eventQueue.listenerTimeout`（listener budget）、`eventQueue.maxQueueSize`、`eventQueue.maxConcurrency`
- inbound worker: `inboundWorker.runTimeoutMs`
- reply / history: `replyToMode`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`
- delivery: `textChunkLimit`、`chunkMode`、`maxLinesPerMessage`
- streaming: `streaming`（旧エイリアス: `streamMode`）、`draftChunk`、`blockStreaming`、`blockStreamingCoalesce`
- media / retry: `mediaMaxMb`、`retry`
  - `mediaMaxMb` は Discord への送信アップロード上限です（デフォルト: `8MB`）
- actions: `actions.*`
- presence: `activity`、`status`、`activityType`、`activityUrl`
- UI: `ui.components.accentColor`
- features: `threadBindings`、トップレベルの `bindings[]`（`type: "acp"`）、`pluralkit`、`execApprovals`、`intents`、`agentComponents`、`heartbeat`、`responsePrefix`

## セーフティと運用

- ボットトークンは機密情報として扱ってください（監視付き環境では `DISCORD_BOT_TOKEN` を推奨します）
- Discord 権限は最小権限で付与してください
- コマンドの deploy 状態や反映状態が古い場合は、ゲートウェイを再起動し、`openclaw channels status --probe` で再確認してください

## 関連

- [Pairing](/channels/pairing)
- [Channel routing](/channels/channel-routing)
- [Multi-agent routing](/concepts/multi-agent)
- [Troubleshooting](/channels/troubleshooting)
- [Slash commands](/tools/slash-commands)
