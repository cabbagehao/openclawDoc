---
summary: "Discord ボットのサポート状況、機能、構成"
read_when:
  - Discord チャンネル機能の開発中
title: "不和"
x-i18n:
  source_hash: "62001ac1c2832bc2321787bbdb97e40240dc9478b7b4f024434e299d580f763c"
---

# Discord (ボットAPI)

ステータス: 公式 Discord ゲートウェイ経由で DM とギルド チャンネルを送信できる準備が整っています。

<CardGroup cols={3}>
  <Card title="ペアリング" icon="link" href="/channels/pairing">
    DiscordのDMはデフォルトでペアリングモードになっています。
  </Card>
  <Card title="スラッシュコマンド" icon="terminal" href="/tools/slash-commands">
    ネイティブ コマンドの動作とコマンド カタログ。
  </Card>
  <Card title="チャネルのトラブルシューティング" icon="wrench" href="/channels/troubleshooting">
    クロスチャネル診断と修復フロー。
  </Card>
</CardGroup>

## クイックセットアップ

ボットを含む新しいアプリケーションを作成し、ボットをサーバーに追加して、OpenClaw とペアリングする必要があります。ボットを独自のプライベート サーバーに追加することをお勧めします。まだお持ちでない場合は、[最初に作成してください](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (**[独自に作成] > [自分と友達用] を選択します**)。

<Steps>
  <Step title="Discord アプリケーションとボットを作成する">
    [Discord 開発者ポータル](https://discord.com/developers/applications) に移動し、**新しいアプリケーション** をクリックします。 「OpenClaw」などの名前を付けます。

    サイドバーの [**ボット**] をクリックします。 **ユーザー名** を OpenClaw エージェントと呼ぶものに設定します。

  </Step>

  <Step title="特権インテントを有効にする">
    引き続き **ボット** ページで、**Privileged Gateway Intents** まで下にスクロールし、以下を有効にします。

    - **メッセージ内容の意図** (必須)
    - **サーバー メンバーの意図** (推奨; ロールのホワイトリストと名前と ID の一致に必要)
    - **プレゼンス インテント** (オプション、プレゼンスの更新にのみ必要)

  </Step>

  <Step title="ボットトークンをコピーします">
    **ボット** ページを上にスクロールして、**トークンのリセット** をクリックします。
    <Note>
    名前に反して、これにより最初のトークンが生成されます。何も「リセット」されません。
    </Note>

    トークンをコピーしてどこかに保存します。これはあなたの**ボット トークン**であり、すぐに必要になります。

  </Step>

  <Step title="招待 URL を生成し、ボットをサーバーに追加します">
    サイドバーの **OAuth2** をクリックします。ボットをサーバーに追加するための適切な権限を持つ招待 URL を生成します。

    **OAuth2 URL Generator** まで下にスクロールし、次を有効にします。

    - `bot`
    - `applications.commands`

    **ボットの権限** セクションが下に表示されます。有効にする:

    - チャンネルを見る
    - メッセージを送信する
    - メッセージ履歴を読む
    - リンクを埋め込む
    - ファイルを添付する
    - リアクションの追加 (オプション)

    下部にある生成された URL をコピーしてブラウザに貼り付け、サーバーを選択して、[**続行**] をクリックして接続します。これで、Discord サーバーにボットが表示されるはずです。

  </Step>

  <Step title="開発者モードを有効にして ID を収集します">
    Discord アプリに戻り、内部 ID をコピーできるように開発者モードを有効にする必要があります。

    1. **ユーザー設定** (アバターの横にある歯車アイコン) → **詳細** をクリックし、**開発者モード** に切り替えます
    2. サイドバーの **サーバー アイコン**を右クリック → **サーバー ID をコピー**
    3. **自分のアバター**を右クリック → **ユーザーIDをコピー**

    **サーバー ID** と **ユーザー ID** をボット トークンと一緒に保存します。次のステップで 3 つすべてを OpenClaw に送信します。

</Step><Step title="サーバーメンバーからのDMを許可する">
ペアリングを機能させるには、Discord がボットからの DM を許可する必要があります。 **サーバー アイコン**を右クリック→**プライバシー設定**→**ダイレクト メッセージ**に切り替えます。

    これにより、サーバー メンバー (ボットを含む) があなたに DM を送信できるようになります。 OpenClaw で Discord DM を使用する場合は、これを有効にしておきます。ギルドチャンネルのみを使用する予定がある場合は、ペアリング後に DM を無効にすることができます。

  </Step>

  <Step title="ステップ 0: ボット トークンを安全に設定します (チャットで送信しないでください)">
    Discord ボット トークンは秘密です (パスワードと同様)。エージェントにメッセージを送信する前に、OpenClaw を実行しているマシンに設定してください。

```bash
openclaw config set channels.discord.token '"YOUR_BOT_TOKEN"' --json
openclaw config set channels.discord.enabled true --json
openclaw gateway
```

    OpenClaw が既にバックグラウンド サービスとして実行されている場合は、代わりに `openclaw gateway restart` を使用してください。

  </Step>

  <Step title="OpenClaw を構成してペアリングする">

    <Tabs>
      <Tab title="エージェントに問い合わせてください">
        既存のチャネル (例: Telegram) で OpenClaw エージェントとチャットして伝えます。 Discord が最初のチャンネルの場合は、代わりに CLI / config タブを使用してください。

        > 「既に設定に Discord ボット トークンを設定しています。ユーザー ID `<user_id>` とサーバー ID `<server_id>` を使用して Discord のセットアップを完了してください。」
      </Tab>
      <Tab title="CLI / config">
        ファイルベースの構成を希望する場合は、次のように設定します。

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

        デフォルトアカウントの環境フォールバック:

```bash
DISCORD_BOT_TOKEN=...
```

        SecretRef 値は、`channels.discord.token` (環境/ファイル/実行プロバイダー) でもサポートされています。 [秘密管理](/gateway/secrets) を参照してください。

      </Tab>
    </Tabs></Step>

  <Step title="最初の DM ペアリングを承認する">
    ゲートウェイが実行されるまで待ってから、Discord でボットに DM を送信します。ペアリングコードで応答します。

    <Tabs>
      <Tab title="エージェントに問い合わせてください">
        ペアリング コードを既存のチャネルのエージェントに送信します。

        > 「この Discord ペアリング コードを承認します: `<CODE>`」
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    ペアリング コードは 1 時間後に期限切れになります。

    これで、Discord で DM 経由でエージェントとチャットできるようになります。

  </Step>
</Steps>

<Note>
トークン解決はアカウントを認識します。構成トークン値は環境フォールバックよりも優先されます。 `DISCORD_BOT_TOKEN` はデフォルトのアカウントにのみ使用されます。
</Note>

## 推奨: ギルド ワークスペースをセットアップする

DM が機能したら、Discord サーバーを完全なワークスペースとして設定し、各チャネルが独自のコンテキストを持つ独自のエージェント セッションを取得できるようになります。これは、あなたとあなたのボットだけが使用できるプライベート サーバーに推奨されます。

<Steps>
  <Step title="サーバーをギルド許可リストに追加します">
    これにより、エージェントは DM だけでなく、サーバー上の任意のチャネルで応答できるようになります。

    <Tabs>
      <Tab title="エージェントに問い合わせてください">
        > 「Discord サーバー ID `<server_id>` をギルド許可リストに追加してください」
      </Tab>
      <Tab title="構成">

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

</Step><Step title="@メンションなしで応答を許可する">
デフォルトでは、エージェントは @メンションされた場合にのみギルド チャネルで応答します。プライベート サーバーの場合は、すべてのメッセージに応答する必要があるでしょう。

    <Tabs>
      <Tab title="エージェントに問い合わせてください">
        > 「私のエージェントが @メンションされなくてもこのサーバーで応答できるようにします」
      </Tab>
      <Tab title="構成">
        ギルド設定に `requireMention: false` を設定します。

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

  <Step title="ギルドチャンネルでの思い出を計画する">
    デフォルトでは、長期メモリ (MEMORY.md) は DM セッションでのみロードされます。ギルドチャンネルはMEMORY.mdを自動ロードしません。

    <Tabs>
      <Tab title="エージェントに問い合わせてください">
        > 「Discord チャンネルで質問するとき、MEMORY.md からの長期的なコンテキストが必要な場合は、memory_search またはmemory_get を使用してください。」
      </Tab>
      <Tab title="マニュアル">
        すべてのチャネルで共有コンテキストが必要な場合は、安定した命令を `AGENTS.md` または `USER.md` に配置します (これらはセッションごとに挿入されます)。長期メモを `MEMORY.md` に保存し、メモリ ツールを使用してオンデマンドでアクセスします。
      </Tab>
    </Tabs>

  </Step>
</Steps>次に、Discord サーバー上にいくつかのチャンネルを作成し、チャットを開始します。エージェントはチャネル名を確認でき、各チャネルは独自の分離セッションを取得します。そのため、`#coding`、`#home`、`#research` など、ワークフローに合ったものを設定できます。

## ランタイムモデル

- ゲートウェイは Discord 接続を所有します。
- 返信ルーティングは決定的です: Discord の受信返信は Discord に返されます。
- デフォルト (`session.dmScope=main`) では、ダイレクト チャットはエージェントのメイン セッション (`agent:main:main`) を共有します。
- ギルド チャネルは分離されたセッション キー (`agent:<agentId>:discord:channel:<channelId>`) です。
- グループ DM はデフォルトで無視されます (`channels.discord.dm.groupEnabled=false`)。
- ネイティブ スラッシュ コマンドは、分離されたコマンド セッション (`agent:<agentId>:discord:slash:<userId>`) で実行されますが、`CommandTargetSessionKey` はルーティングされた会話セッションに転送されます。

## フォーラム チャネル

Discord フォーラムとメディア チャネルはスレッド投稿のみを受け入れます。 OpenClaw は、次の 2 つの作成方法をサポートしています。

- スレッドを自動作成するには、フォーラムの親 (`channel:<forumId>`) にメッセージを送信します。スレッドのタイトルには、メッセージの空でない最初の行が使用されます。
- `openclaw message thread create` を使用してスレッドを直接作成します。フォーラム チャネルには `--message-id` を渡さないでください。

例: スレッドを作成するためにフォーラムの親に送信します

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

例: フォーラムのスレッドを明示的に作成する

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

フォーラムの親は Discord コンポーネントを受け入れません。コンポーネントが必要な場合は、スレッド自体に送信してください (`channel:<threadId>`)。

## インタラクティブなコンポーネントOpenClaw は、エージェント メッセージ用の Discord コンポーネント v2 コンテナをサポートしています。 `components` ペイロードを含むメッセージ ツールを使用します。インタラクションの結果は通常の受信メッセージとしてエージェントにルーティングされ、既存の Discord `replyToMode` 設定に従います

サポートされているブロック:

- `text`、`section`、`separator`、`actions`、`media-gallery`、`file`
- アクション行では、最大 5 つのボタンまたは 1 つの選択メニューを使用できます
- タイプの選択: `string`、`user`、`role`、`mentionable`、`channel`

デフォルトでは、コンポーネントは使い捨てです。 `components.reusable=true` を設定すると、有効期限が切れるまでボタン、選択、フォームを複数回使用できるようになります。

ボタンをクリックできるユーザーを制限するには、そのボタンに `allowedUsers` (Discord ユーザー ID、タグ、または `*`) を設定します。構成すると、一致しないユーザーは一時的な拒否を受け取ります。

`/model` および `/models` スラッシュ コマンドは、プロバイダーとモデルのドロップダウンと送信ステップを備えた対話型のモデル ピッカーを開きます。ピッカーの応答は一時的なものであり、呼び出し元のユーザーのみが使用できます。

添付ファイル:- `file` ブロックは添付ファイル参照 (`attachment://<filename>`) を指す必要があります。

- `media`/`path`/`filePath` (単一ファイル) 経由で添付ファイルを提供します。複数のファイルには `media-gallery` を使用してください
- アップロード名が添付ファイルの参照と一致する必要がある場合は、`filename` を使用してアップロード名をオーバーライドします。

モーダルフォーム:

- `components.modal` を最大 5 つのフィールドで追加します
- フィールド タイプ: `text`、`checkbox`、`radio`、`select`、`role-select`、`user-select`
- OpenClaw はトリガーボタンを自動的に追加します

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
  <Tab title="DMポリシー">
    `channels.discord.dmPolicy` は DM アクセスを制御します (レガシー: `channels.discord.dm.policy`):

    - `pairing` (デフォルト)
    - `allowlist`
    - `open` (`"*"` を含めるには `channels.discord.allowFrom` が必要です。レガシー: `channels.discord.dm.allowFrom`)
    - `disabled`

    DM ポリシーが開いていない場合、不明なユーザーはブロックされます (または、`pairing` モードでペアリングを要求されます)。

    マルチアカウントの優先順位:

    - `channels.discord.accounts.default.allowFrom` は `default` アカウントにのみ適用されます。
    - 名前付きアカウントは、独自の `allowFrom` が設定されていない場合、 `channels.discord.allowFrom` を継承します。
    - 名前付きアカウントは `channels.discord.accounts.default.allowFrom` を継承しません。

    DMの配信対象フォーマット：

    - `user:<id>`
    - `<@id>` の言及裸の数値 ID は曖昧であり、明示的なユーザー/チャネル ターゲットの種類が指定されていない限り拒否されます。

  </Tab>

  <Tab title="ギルドポリシー">
    ギルドの処理は `channels.discord.groupPolicy` によって制御されます。

    - `open`
    - `allowlist`
    - `disabled`

    `channels.discord` が存在する場合のセキュア ベースラインは `allowlist` です。

    `allowlist` の動作:

    - ギルドは `channels.discord.guilds` と一致する必要があります (`id` が推奨、スラッグは受け入れられます)
    - オプションの送信者許可リスト: `users` (安定した ID を推奨) および `roles` (ロール ID のみ)。どちらかが設定されている場合、送信者は `users` または `roles` に一致する場合に許可されます。
    - 名前/タグの直接一致はデフォルトで無効になっています。 `channels.discord.dangerouslyAllowNameMatching: true` をブレークグラス互換モードとしてのみ有効にする
    - `users` では名前/タグがサポートされていますが、ID の方が安全です。 `openclaw security audit` は、名前/タグエントリが使用されている場合に警告します
    - ギルドに `channels` が設定されている場合、リストにないチャンネルは拒否されます
    - ギルドに `channels` ブロックがない場合、その許可リストに登録されたギルド内のすべてのチャンネルが許可されます

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

    `DISCORD_BOT_TOKEN` のみを設定し、`channels.discord` ブロックを作成しない場合、`channels.defaults.groupPolicy` が `open` であっても、ランタイム フォールバックは `groupPolicy="allowlist"` (ログに警告が記録されます) になります。

</Tab><Tab title="メンションとグループDM">
ギルドメッセージはデフォルトでメンションゲートされます。

    メンション検出には次のものが含まれます。

    - 明示的なボットへの言及
    - 設定されたメンション パターン (`agents.list[].groupChat.mentionPatterns`、フォールバック `messages.groupChat.mentionPatterns`)
    - サポートされている場合のボットへの暗黙的な応答動作

    `requireMention` はギルド/チャネルごとに構成されます (`channels.discord.guilds...`)。
    `ignoreOtherMentions` は、オプションで、別のユーザー/ロールについては言及するが、ボットについては言及しないメッセージを削除します (@everyone/@here を除く)。

    グループDM:

    - デフォルト: 無視 (`dm.groupEnabled=false`)
    - `dm.groupChannels` 経由のオプションの許可リスト (チャネル ID またはスラッグ)

  </Tab>
</Tabs>

### ロールベースのエージェントルーティング

`bindings[].match.roles` を使用して、Discord ギルドメンバーをロール ID によって別のエージェントにルーティングします。ロールベースのバインディングはロール ID のみを受け入れ、ピアまたは親-ピア バインディングの後、ギルドのみのバインディングの前に評価されます。バインディングで他の一致フィールド (`peer` + `guildId` + `roles` など) も設定する場合は、構成されたすべてのフィールドが一致する必要があります。

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

## 開発者ポータルのセットアップ

<AccordionGroup>
  <Accordion title="アプリとボットを作成する">

    1. Discord 開発者ポータル -> **アプリケーション** -> **新しいアプリケーション**
    2. **ボット** -> **ボットの追加**
    3. ボットトークンをコピーする

  </Accordion>

  <Accordion title="特権インテント">
    **[ボット] -> [特権ゲートウェイ インテント]** で、次を有効にします。

    - メッセージ内容の意図
    - サーバーメンバーの意図 (推奨)プレゼンス インテントはオプションであり、プレゼンスの更新を受信する場合にのみ必要です。ボット プレゼンス (`setPresence`) を設定するには、メンバーのプレゼンス更新を有効にする必要はありません。

  </Accordion>

  <Accordion title="OAuth スコープとベースライン権限">
    OAuth URL ジェネレーター:

    - スコープ: `bot`、`applications.commands`

    一般的なベースライン権限:

    - チャンネルを見る
    - メッセージを送信する
    - メッセージ履歴を読む
    - リンクを埋め込む
    - ファイルを添付する
    - リアクションの追加 (オプション)

    明示的に必要な場合を除き、`Administrator` は避けてください。

  </Accordion>

  <Accordion title="IDをコピーする">
    Discord 開発者モードを有効にして、以下をコピーします。

    - サーバーID
    - チャンネルID
    - ユーザーID

    信頼性の高い監査とプローブを実現するには、OpenClaw 構成内の数値 ID を優先します。

  </Accordion>
</AccordionGroup>

## ネイティブ コマンドとコマンド認証

- `commands.native` はデフォルトで `"auto"` になり、Discord に対して有効になります。
- チャネルごとのオーバーライド: `channels.discord.commands.native`。
- `commands.native=false` は、以前に登録された Discord ネイティブ コマンドを明示的にクリアします。
- ネイティブ コマンド認証では、通常のメッセージ処理と同じ Discord の許可リスト/ポリシーが使用されます。
- 権限のないユーザーに対しても、Discord UI にコマンドが表示される場合があります。実行しても OpenClaw 認証が強制され、「未承認」が返されます。

コマンドのカタログと動作については、[スラッシュ コマンド](/tools/slash-commands) を参照してください。

デフォルトのスラッシュコマンド設定:

- `ephemeral: true`

## 機能の詳細<AccordionGroup>

  <Accordion title="返信タグとネイティブ返信">
    Discord はエージェント出力での返信タグをサポートしています。

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    `channels.discord.replyToMode` によって制御されます:

    - `off` (デフォルト)
    - `first`
    - `all`

    注: `off` は、暗黙的な応答スレッドを無効にします。明示的な `[[reply_to_*]]` タグは引き続き受け入れられます。

    メッセージ ID はコンテキスト/履歴に表示されるため、エージェントは特定のメッセージをターゲットにすることができます。

  </Accordion>

  <Accordion title="ライブストリームプレビュー">
    OpenClaw は、一時メッセージを送信し、テキストが到着したときにそれを編集することで、返信の下書きをストリーミングできます。

    - `channels.discord.streaming` は、プレビュー ストリーミングを制御します (`off` | `partial` | `block` | `progress`、デフォルト: `off`)。
    - `progress` はチャネル間の一貫性のために受け入れられ、Discord の `partial` にマップされます。
    - `channels.discord.streamMode` は従来のエイリアスであり、自動移行されます。
    - `partial` は、トークンの到着時に 1 つのプレビュー メッセージを編集します。
    - `block` はドラフト サイズのチャンクを出力します (サイズとブレークポイントを調整するには `draftChunk` を使用します)。

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

    `block` モードのチャンクのデフォルト (`channels.discord.textChunkLimit` に固定):

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

    プレビュー ストリーミングはテキストのみです。メディアの返信は通常の配信に戻ります。注: プレビュー ストリーミングはブロック ストリーミングとは別のものです。ブロックストリーミングが明示的に行われる場合
    Discord で有効にすると、OpenClaw は二重ストリーミングを避けるためにプレビュー ストリームをスキップします。

  </Accordion>

  <Accordion title="履歴、コンテキスト、およびスレッドの動作">
    ギルドの歴史のコンテキスト:

    - `channels.discord.historyLimit` デフォルト `20`
    - フォールバック: `messages.groupChat.historyLimit`
    - `0` を無効にします

    DM 履歴コントロール:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    スレッドの動作:

    - Discord スレッドはチャネルセッションとしてルーティングされます
    - 親スレッドのメタデータは親セッションのリンクに使用できます
    - スレッド固有のエントリが存在しない限り、スレッド設定は親チャネル設定を継承します。

    チャネル トピックは、**信頼できない** コンテキストとして (システム プロンプトとしてではなく) 挿入されます。

  </Accordion>

  <Accordion title="サブエージェントのスレッドバインドされたセッション">
    Discord はスレッドをセッション ターゲットにバインドできるため、そのスレッド内のフォローアップ メッセージは同じセッション (サブエージェント セッションを含む) にルーティングされ続けます。

    コマンド:

    - `/focus <target>` 現在/新しいスレッドをサブエージェント/セッション ターゲットにバインドします
    - `/unfocus` 現在のスレッド バインディングを削除します
    - `/agents` アクティブな実行とバインディング状態を表示します
    - `/session idle <duration|off>` フォーカスされたバインディングの非アクティブな自動フォーカス解除を検査/更新します
    - `/session max-age <duration|off>` フォーカスされたバインディングのハード マックス期間を検査/更新します

    構成:

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

    注:- `session.threadBindings.*` はグローバルなデフォルトを設定します。
    - `channels.discord.threadBindings.*` は Discord の動作をオーバーライドします。
    - `sessions_spawn({ thread: true })` のスレッドを自動作成/バインドするには、`spawnSubagentSessions` が true である必要があります。
    - ACP (`/acp spawn ... --thread ...` または `sessions_spawn({ runtime: "acp", thread: true })`) のスレッドを自動作成/バインドするには、`spawnAcpSessions` が true である必要があります。
    - アカウントのスレッド バインドが無効になっている場合、`/focus` および関連するスレッド バインド操作は利用できません。

    [サブエージェント](/tools/subagents)、[ACP エージェント](/tools/acp-agents)、および [構成リファレンス](/gateway/configuration-reference) を参照してください。

  </Accordion>

  <Accordion title="永続的な ACP チャネル バインディング">
    安定した「常時接続」ACP ワークスペースを実現するには、Discord 会話を対象としたトップレベルの型付き ACP バインディングを構成します。

    構成パス:

    - `bindings[]` と `type: "acp"` および `match.channel: "discord"`

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

    注:

    - スレッド メッセージは親チャネル ACP バインディングを継承できます。
    - バインドされたチャネルまたはスレッドでは、`/new` と `/reset` が同じ ACP セッションを所定の場所にリセットします。
    - 一時的なスレッド バインディングは引き続き機能し、アクティブな間はターゲットの解決をオーバーライドできます。

    バインディング動作の詳細については、[ACP エージェント](/tools/acp-agents) を参照してください。

  </Accordion>

  <Accordion title="反応通知">
    ギルドごとの反応通知モード:

    - `off`
    - `own` (デフォルト)
    - `all`
    - `allowlist` (`guilds.<id>.users` を使用)リアクションイベントはシステムイベントに変換され、ルーティングされた Discord セッションに添付されます。

  </Accordion>

  <Accordion title="ACK反応">
    `ackReaction` は、OpenClaw が受信メッセージを処理している間に、確認の絵文字を送信します。

    解決順序:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - エージェント ID 絵文字フォールバック (`agents.list[].identity.emoji`、それ以外の場合は「👀」)

    注:

    - Discord は Unicode 絵文字またはカスタム絵文字名を受け入れます。
    - `""` を使用して、チャネルまたはアカウントの反応を無効にします。

  </Accordion>

  <Accordion title="構成の書き込み">
    チャネル開始の設定書き込みはデフォルトで有効になっています。

    これは `/config set|unset` フローに影響します (コマンド機能が有効な場合)。

    無効にする:

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
    Discord ゲートウェイ WebSocket トラフィックと起動 REST ルックアップ (アプリケーション ID + ホワイトリスト解決) を、`channels.discord.proxy` を使用して HTTP(S) プロキシ経由でルーティングします。

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    アカウントごとの上書き:

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

  <Accordion title="複数キットのサポート">
    PluralKit 解決を有効にして、プロキシされたメッセージをシステム メンバー ID にマッピングします。

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

    注:- ホワイトリストでは `pk:<memberId>` を使用できます
    - メンバーの表示名は、`channels.discord.dangerouslyAllowNameMatching: true` の場合にのみ名前/スラッグと一致します。
    - ルックアップは元のメッセージ ID を使用し、時間枠に制約があります
    - ルックアップが失敗した場合、`allowBots=true` を除き、プロキシされたメッセージはボット メッセージとして扱われ、ドロップされます。

  </Accordion>

  <Accordion title="プレゼンス設定">
    プレゼンスの更新は、ステータスまたはアクティビティ フィールドを設定するとき、または自動プレゼンスを有効にするときに適用されます。

    ステータスのみの例:

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    アクティビティの例 (カスタム ステータスがデフォルトのアクティビティ タイプ):

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

    ストリーミングの例:

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

    アクティビティ タイプ マップ:

    - 0: 再生中
    - 1: ストリーミング (`activityUrl` が必要)
    - 2: リスニング
    - 3: 見る
    - 4: カスタム (アクティビティ テキストをステータス状態として使用します。絵文字はオプションです)
    - 5: 競争する

    自動プレゼンスの例 (実行時健全性信号):

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

    自動プレゼンスは、ランタイムの可用性を Discord のステータスにマッピングします。正常 => オンライン、劣化または不明 => アイドル、消耗または使用不可 => 停止。オプションのテキストの上書き:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (`{reason}` プレースホルダーをサポート)

  </Accordion>

  <Accordion title="Discord での幹部の承認">
    Discord は DM でのボタンベースの幹部承認をサポートしており、必要に応じて元のチャネルに承認プロンプトを投稿できます。

    構成パス:- `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers`
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`、デフォルト: `dm`)
    - `agentFilter`、`sessionFilter`、`cleanupAfterResolve`

    `target` が `channel` または `both` の場合、承認プロンプトがチャネルに表示されます。設定された承認者のみがボタンを使用できます。他のユーザーは一時的な拒否を受け取ります。承認プロンプトにはコマンド テキストが含まれるため、信頼できるチャネルでのみチャネル配信を有効にします。セッション キーからチャネル ID を導出できない場合、OpenClaw は DM 配信に戻ります。

    このハンドラーのゲートウェイ認証では、他のゲートウェイ クライアントと同じ共有資格情報解決コントラクトが使用されます。

    - env-first ローカル認証 (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`、次に `gateway.auth.*`)
    - ローカル モードでは、`gateway.auth.*` が設定されていない場合、`gateway.remote.*` をフォールバックとして使用できます。
    - 該当する場合、`gateway.remote.*` によるリモート モードのサポート
    - URL オーバーライドはオーバーライド セーフです。CLI オーバーライドは暗黙的な認証情報を再利用せず、env オーバーライドは env 認証情報のみを使用します。

    不明な承認 ID で承認が失敗した場合は、承認者リストと機能の有効化を確認してください。

    関連ドキュメント: [幹部の承認](/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## ツールとアクション ゲートDiscord のメッセージ アクションには、メッセージング、チャンネル管理、モデレーション、プレゼンス、メタデータ アクションが含まれます

主な例:

- メッセージング: `sendMessage`、`readMessages`、`editMessage`、`deleteMessage`、`threadReply`
- 反応: `react`、`reactions`、`emojiList`
- モデレーション: `timeout`、`kick`、`ban`
- プレゼンス: `setPresence`

アクション ゲートは `channels.discord.actions.*` の下に存在します。

| デフォルトのゲート動作:                                                                                                                                                                  | アクショングループ | デフォルト |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | ---------- |
| リアクション、メッセージ、スレッド、ピン、投票、検索、memberInfo、roleInfo、channelInfo、チャンネル、voiceStatus、イベント、ステッカー、絵文字アップロード、ステッカーアップロード、権限 | 有効               |
| 役割                                                                                                                                                                                     | 無効               |
| 節度                                                                                                                                                                                     | 無効               |
| 存在感                                                                                                                                                                                   | 無効               |

## コンポーネント v2 UI

OpenClaw は、幹部の承認とクロスコンテキスト マーカーに Discord コンポーネント v2 を使用します。 Discord メッセージ アクションでは、カスタム UI の `components` も受け入れることができます (高度な機能、Carbon コンポーネント インスタンスが必要です)。一方、従来の `embeds` も引き続き利用可能ですが、推奨されません。- `channels.discord.ui.components.accentColor` は、Discord コンポーネント コンテナで使用されるアクセント カラーを設定します (16 進数)。

- `channels.discord.accounts.<id>.ui.components.accentColor` を使用してアカウントごとに設定します。
- コンポーネント v2 が存在する場合、`embeds` は無視されます。

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

OpenClaw は、Discord 音声チャネルに参加して、リアルタイムで継続的な会話を行うことができます。これは音声メッセージの添付ファイルとは別のものです。

要件:

- ネイティブ コマンド (`commands.native` または `channels.discord.commands.native`) を有効にします。
- `channels.discord.voice` を構成します。
- ボットには、ターゲット音声チャネルでの接続 + 発言権限が必要です。

Discord 専用のネイティブ コマンド `/vc join|leave|status` を使用してセッションを制御します。このコマンドはアカウントのデフォルト エージェントを使用し、他の Discord コマンドと同じ許可リストとグループ ポリシー ルールに従います。

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

注:- `voice.tts` は、音声再生の場合のみ `messages.tts` をオーバーライドします。

- 音声トランスクリプトは、Discord `allowFrom` (または `dm.allowFrom`) からオーナー ステータスを取得します。所有者以外の発言者は、所有者専用ツール (`gateway` や `cron` など) にアクセスできません。
- 音声はデフォルトで有効になっています。 `channels.discord.voice.enabled=false` を設定して無効にします。
- `voice.daveEncryption` および `voice.decryptionFailureTolerance` は `@discordjs/voice` 結合オプションに渡されます。
- `@discordjs/voice` のデフォルトは、未設定の場合は `daveEncryption=true` および `decryptionFailureTolerance=24` です。
- OpenClaw は、受信復号化の失敗も監視し、短いウィンドウ内で失敗が繰り返された後、音声チャネルから離脱/再参加することで自動回復します。
- 受信ログに繰り返し `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` が表示される場合、これは [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) で追跡されているアップストリームの `@discordjs/voice` 受信バグである可能性があります。

## 音声メッセージ

Discord の音声メッセージには波形プレビューが表示され、OGG/Opus オーディオとメタデータが必要です。 OpenClaw は波形を自動的に生成しますが、オーディオ ファイルを検査して変換するには、ゲートウェイ ホストで利用可能な `ffmpeg` と `ffprobe` が必要です。

要件と制約:

- **ローカル ファイル パス**を指定します (URL は拒否されます)。
- テキストコンテンツを省略します (Discord では、同じペイロードにテキスト + 音声メッセージを含めることはできません)。
- あらゆるオーディオ形式が受け入れられます。 OpenClaw は、必要に応じて OGG/Opus に変換します。

例:

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## トラブルシューティング<AccordionGroup>

  <Accordion title="許可されていないインテントが使用されているか、ボットにギルドメッセージが表示されない">

    - メッセージコンテンツインテントを有効にする
    - ユーザー/メンバーの解決に依存する場合は、サーバー メンバー インテントを有効にします
    - インテントを変更した後にゲートウェイを再起動します

  </Accordion>

  <Accordion title="ギルドメッセージが予期せずブロックされました">

    - `groupPolicy` を確認してください
    - `channels.discord.guilds` の下のギルド許可リストを確認してください
    - ギルド `channels` マップが存在する場合、リストされたチャネルのみが許可されます
    - `requireMention` の動作と言及パターンを確認する

    便利なチェック:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="必須メンションが false ですが、まだブロックされています">
    一般的な原因:

    - `groupPolicy="allowlist"` ギルド/チャンネルの許可リストが一致しない
    - `requireMention` が間違った場所に設定されています (`channels.discord.guilds` またはチャネル エントリの下にある必要があります)
    - 送信者はギルド/チャネル `users` 許可リストによってブロックされています

  </Accordion>

  <Accordion title="長時間実行されるハンドラーがタイムアウトになるか、応答が重複する">

    典型的なログ:

    - `Listener DiscordMessageListener timed out after 30000ms for event MESSAGE_CREATE`
    - `Slow listener detected ...`
    - `discord inbound worker timed out after ...`

    リスナーの予算ノブ:

    - 単一アカウント: `channels.discord.eventQueue.listenerTimeout`
    - マルチアカウント: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`

    ワーカー実行タイムアウト ノブ:

    - 単一アカウント: `channels.discord.inboundWorker.runTimeoutMs`
    - マルチアカウント: `channels.discord.accounts.<accountId>.inboundWorker.runTimeoutMs`
    - デフォルト: `1800000` (30 分); `0` を無効に設定します

    推奨されるベースライン:

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

    遅いリスナーのセットアップには `eventQueue.listenerTimeout` を使用し、`inboundWorker.runTimeoutMs` を使用します。
    待機中のエージェントのターンに別の安全弁が必要な場合のみ。</Accordion>

  <Accordion title="権限監査の不一致">
    `channels status --probe` 権限チェックは数値チャネル ID に対してのみ機能します。

    スラグ キーを使用する場合でも、ランタイム マッチングは機能しますが、プローブはアクセス許可を完全に検証できません。

  </Accordion>

  <Accordion title="DMとペアリングの問題">

    - DM が無効になっています: `channels.discord.dm.enabled=false`
    - DM ポリシーが無効になりました: `channels.discord.dmPolicy="disabled"` (レガシー: `channels.discord.dm.policy`)
    - `pairing` モードでペアリングの承認を待っています

  </Accordion>

  <Accordion title="ボット間のループ">
    デフォルトでは、ボットが作成したメッセージは無視されます。

    `channels.discord.allowBots=true` を設定する場合は、厳密なメンションと許可リストのルールを使用して、ループ動作を回避してください。
    `channels.discord.allowBots="mentions"` を使用して、ボットに言及するボット メッセージのみを受け入れるようにしてください。

  </Accordion>

  <Accordion title="音声 STT は DecryptionFailed(...) でドロップします">

    - Discord 音声受信回復ロジックが存在するように、OpenClaw を最新の状態に保ちます (`openclaw update`)。
    - `channels.discord.voice.daveEncryption=true` (デフォルト) を確認します。
    - `channels.discord.voice.decryptionFailureTolerance=24` (アップストリームのデフォルト) から開始し、必要な場合にのみ調整します
    - 監視ログ:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - 自動再参加後も失敗が続く場合は、ログを収集し、[discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) と比較します。

  </Accordion>
</AccordionGroup>

## 構成参照ポインタ

主な参考文献:

- [設定リファレンス - Discord](/gateway/configuration-reference#discord)

信号の多い Discord フィールド:- 起動/認証: `enabled`、`token`、`accounts.*`、`allowBots`

- ポリシー: `groupPolicy`、`dm.*`、`guilds.*`、`guilds.*.channels.*`
- コマンド: `commands.native`、`commands.useAccessGroups`、`configWrites`、`slashCommand.*`
- イベントキュー: `eventQueue.listenerTimeout` (リスナーバジェット)、`eventQueue.maxQueueSize`、`eventQueue.maxConcurrency`
- インバウンド労働者: `inboundWorker.runTimeoutMs`
- 返信/履歴: `replyToMode`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`
- 配送: `textChunkLimit`、`chunkMode`、`maxLinesPerMessage`
- ストリーミング: `streaming` (従来のエイリアス: `streamMode`)、`draftChunk`、`blockStreaming`、`blockStreamingCoalesce`
- メディア/再試行: `mediaMaxMb`、`retry`
  - `mediaMaxMb` は、Discord の送信アップロードを制限します (デフォルト: `8MB`)
- アクション: `actions.*`
- プレゼンス: `activity`、`status`、`activityType`、`activityUrl`
- UI: `ui.components.accentColor`
- 機能: `threadBindings`、トップレベル `bindings[]` (`type: "acp"`)、`pluralkit`、`execApprovals`、`intents`、`agentComponents`、 `heartbeat`、`responsePrefix`

## 安全性と運用

- ボット トークンをシークレットとして扱います (`DISCORD_BOT_TOKEN` は監視された環境で推奨されます)。
- 最小権限の Discord 権限を付与します。
- コマンドのデプロイ/状態が古い場合は、ゲートウェイを再起動し、`openclaw channels status --probe` で再確認します。

＃＃ 関連している- [ペアリング](/channels/pairing)

- [チャンネルルーティング](/channels/channel-routing)
- [マルチエージェントルーティング](/concepts/multi-agent)
- [トラブルシューティング](/channels/troubleshooting)
- [スラッシュコマンド](/tools/slash-commands)
