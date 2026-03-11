---
summary: "Telegram ボットのサポート ステータス、機能、および構成"
read_when:
  - Telegram 機能または Webhook の作業
title: "Telegram"
x-i18n:
  source_hash: "bf7d861c40280b172e13ce6d1778e9ebe6a5441c0d7ad0f09506cbbc5b1afd7d"
---

# テレグラム（ボットAPI）

ステータス: grammY を介したボット DM + グループの運用準備が整っています。ロングポーリングがデフォルトのモードです。 Webhook モードはオプションです。

<CardGroup cols={3}>
  <Card title="ペアリング" icon="link" href="/channels/pairing">
    Telegram のデフォルトの DM ポリシーはペアリングです。
  </Card>

  <Card title="チャネルのトラブルシューティング" icon="wrench" href="/channels/troubleshooting">
    クロスチャネル診断と修復プレイブック。
  </Card>

  <Card title="ゲートウェイ構成" icon="settings" href="/gateway/configuration">
    完全なチャネル構成パターンと例。
  </Card>
</CardGroup>

## クイックセットアップ

<Steps>
  <Step title="BotFather でボット トークンを作成する">
    Telegram を開いて **@BotFather** とチャットします (ハンドルが正確に `@BotFather` であることを確認してください)。

    `/newbot` を実行し、プロンプトに従い、トークンを保存します。
  </Step>

  <Step title="トークンとDMポリシーを構成する">
    ```json5
    {
      channels: {
        telegram: {
          enabled: true,
          botToken: "123:abc",
          dmPolicy: "pairing",
          groups: { "*": { requireMention: true } },
        },
      },
    }
    ```

    環境フォールバック: `TELEGRAM_BOT_TOKEN=...` (デフォルト アカウントのみ)。
    Telegram は `openclaw channels login telegram` を**使用しません**。 config/env でトークンを構成し、ゲートウェイを開始します。
  </Step>

  <Step title="ゲートウェイを開始し、最初の DM を承認する">
    ```bash
    openclaw gateway
    openclaw pairing list telegram
    openclaw pairing approve telegram <CODE>
    ```

    ペアリング コードは 1 時間後に期限切れになります。
  </Step>

  <Step title="ボットをグループに追加する">
    ボットをグループに追加し、アクセス モデルに一致するように `channels.telegram.groups` と `groupPolicy` を設定します。
  </Step>
</Steps>

<Note>
  トークン解決順序はアカウントに応じて決まります。実際には、構成値は環境フォールバックよりも優先され、`TELEGRAM_BOT_TOKEN` はデフォルトのアカウントにのみ適用されます。
</Note>

## Telegram側の設定

<AccordionGroup>
  <Accordion title="プライバシーモードとグループの可視性">
    Telegram ボットはデフォルトで **プライバシー モード** になっており、受信するグループ メッセージが制限されます。

    ボットがすべてのグループ メッセージを参照する必要がある場合は、次のいずれかを実行します。

    * `/setprivacy` 経由でプライバシー モードを無効にする、または
    * ボットをグループ管理者にします。

    プライバシー モードを切り替えるときは、各グループのボットを削除して再追加し、Telegram が変更を適用できるようにします。
  </Accordion>

  <Accordion title="グループ権限">
    管理ステータスは Telegram グループ設定で制御されます。

    管理ボットはすべてのグループ メッセージを受信するため、常時接続のグループ動作に役立ちます。
  </Accordion>

  <Accordion title="便利な BotFather 切り替え">
    * `/setjoingroups` グループの追加を許可/拒否します
    * `/setprivacy` グループの可視性動作用
  </Accordion>
</AccordionGroup>

## アクセス制御とアクティベーション

<Tabs>
  <Tab title="DMポリシー">
    `channels.telegram.dmPolicy` はダイレクト メッセージ アクセスを制御します。

    * `pairing` (デフォルト)
    * `allowlist` (`allowFrom` には少なくとも 1 つの送信者 ID が必要です)
    * `open` (`"*"` を含めるには `allowFrom` が必要です)
    * `disabled``channels.telegram.allowFrom` は、数値の Telegram ユーザー ID を受け入れます。 `telegram:` / `tg:` プレフィックスは受け入れられ、正規化されます。
      `dmPolicy: "allowlist"` と空の `allowFrom` はすべての DM をブロックし、構成検証によって拒否されます。
      オンボーディング ウィザードは `@username` 入力を受け入れ、それを数値 ID に解決します。
      アップグレードしていて、構成に `@username` 許可リスト エントリが含まれている場合は、`openclaw doctor --fix` を実行してそれらを解決します (ベストエフォート。Telegram ボット トークンが必要です)。
      以前にペアリング ストア ホワイトリスト ファイルに依存していた場合、`openclaw doctor --fix` はホワイトリスト フロー内の `channels.telegram.allowFrom` へのエントリを回復できます (たとえば、`dmPolicy: "allowlist"` にまだ明示的な ID がない場合)。

    単一所有者ボットの場合は、(以前のペアリングの承認に依存するのではなく) アクセス ポリシーを構成内で永続的に保つために、明示的な数値 `allowFrom` ID を持つ `dmPolicy: "allowlist"` を優先します。

    ### Telegram ユーザー ID を見つける

    より安全 (サードパーティのボットなし):

    1. ボットに DM を送ります。
    2. `openclaw logs --follow` を実行します。
    3. `from.id` を読みます。

    公式ボット API メソッド:

    ```bash
    curl "https://api.telegram.org/bot<bot_token>/getUpdates"
    ```

    サードパーティの方法 (非公開): `@userinfobot` または `@getidsbot`。
  </Tab>

  <Tab title="グループポリシーと許可リスト">
    2 つのコントロールが一緒に適用されます。1. **許可されるグループ** (`channels.telegram.groups`)

    * `groups` 構成がありません:
      * `groupPolicy: "open"` の場合: どのグループもグループ ID チェックに合格できます
      * `groupPolicy: "allowlist"` の場合 (デフォルト): `groups` エントリ (または `"*"`) を追加するまで、グループはブロックされます。
    * `groups` 構成済み: 許可リストとして機能します (明示的な ID または `"*"`)

    2. **グループ内で許可される送信者** (`channels.telegram.groupPolicy`)
       * `open`
       * `allowlist` (デフォルト)
       * `disabled`

    `groupAllowFrom` は、グループ送信者のフィルタリングに使用されます。設定されていない場合、Telegram は `allowFrom` に戻ります。
    `groupAllowFrom` エントリは、数値の Telegram ユーザー ID である必要があります (`telegram:` / `tg:` プレフィックスは正規化されます)。
    数値以外のエントリは送信者の認証では無視されます。
    セキュリティ境界 (`2026.2.25+`): グループ送信者の認証は、DM ペアリングとストアの承認を**継承しません**。
    ペアリングはDMのみのままです。グループの場合は、`groupAllowFrom` またはグループごと/トピックごとに `allowFrom` を設定します。
    ランタイムに関する注意: `channels.telegram` が完全に欠落している場合、`channels.defaults.groupPolicy` が明示的に設定されていない限り、ランタイムはデフォルトでフェールクローズされた `groupPolicy="allowlist"` になります。

    例: 1 つの特定のグループ内の任意のメンバーを許可します。

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              groupPolicy: "open",
              requireMention: false,
            },
          },
        },
      },
    }
    ```
  </Tab>

  <Tab title="言及行動">
    グループ返信にはデフォルトでメンションが必要です。

    言及は次のとおりです。- ネイティブ `@botusername` の言及、または

    * パターンについての言及:
      * `agents.list[].groupChat.mentionPatterns`
      * `messages.groupChat.mentionPatterns`

    セッションレベルのコマンドの切り替え：

    * `/activation always`
    * `/activation mention`

    これらはセッション状態のみを更新します。永続化のために config を使用します。

    永続的な構成の例:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "*": { requireMention: false },
          },
        },
      },
    }
    ```

    グループチャットIDの取得：

    * グループメッセージを `@userinfobot` / `@getidsbot` に転送します
    * または `openclaw logs --follow` から `chat.id` を読み取ります
    * またはボット API `getUpdates` を検査します
  </Tab>
</Tabs>

## 実行時の動作

* テレグラムはゲートウェイプロセスによって所有されます。
* ルーティングは決定的です: Telegram の受信応答は Telegram に返されます (モデルはチャネルを選択しません)。
* 受信メッセージは、返信メタデータとメディア プレースホルダーを使用して共有チャネル エンベロープに正規化されます。
* グループセッションはグループIDによって分離されます。トピックを分離するために、フォーラムのトピックには `:topic:<threadId>` が追加されます。
* DM メッセージには `message_thread_id` を含めることができます。 OpenClaw は、スレッド対応のセッション キーを使用してそれらをルーティングし、応答用のスレッド ID を保存します。
* ロングポーリングでは、チャットごと/スレッドごとのシーケンスを持つ grammY ランナーを使用します。全体的なランナー シンクの同時実行性は `agents.defaults.maxConcurrent` を使用します。
* Telegram Bot API には読み取り受信サポートがありません (`sendReadReceipts` は適用されません)。

## 機能リファレンス

<AccordionGroup>
  <Accordion title="ライブ ストリーム プレビュー (メッセージ編集)">
    OpenClaw は部分的な応答をリアルタイムでストリーミングできます。- ダイレクト チャット: プレビュー メッセージ + `editMessageText`

    * グループ/トピック: プレビュー メッセージ + `editMessageText`

    要件:

    * `channels.telegram.streaming` は `off | partial | block | progress` (デフォルト: `partial`)
    * `progress` は Telegram の `partial` にマップされます (クロスチャネル命名と互換)
    * 従来の `channels.telegram.streamMode` およびブール値 `streaming` 値は自動マッピングされます

    テキストのみの返信の場合:

    * DM: OpenClaw は同じプレビュー メッセージを保持し、その場で最終編集を実行します (2 番目のメッセージはありません)
    * グループ/トピック: OpenClaw は同じプレビュー メッセージを保持し、その場で最終編集を実行します (2 番目のメッセージはありません)。

    複雑な応答 (メディア ペイロードなど) の場合、OpenClaw は通常の最終配信に戻り、プレビュー メッセージをクリーンアップします。

    プレビュー ストリーミングはブロック ストリーミングとは別のものです。 Telegram に対してブロック ストリーミングが明示的に有効になっている場合、OpenClaw は二重ストリーミングを避けるためにプレビュー ストリームをスキップします。

    ネイティブ ドラフト トランスポートが利用できないか拒否された場合、OpenClaw は自動的に `sendMessage` + `editMessageText` にフォールバックします。

    テレグラムのみの推論ストリーム:

    * `/reasoning stream` は生成中に推論をライブ プレビューに送信します
    * 最終回答は推論テキストなしで送信されます
  </Accordion>

  <Accordion title="書式設定と HTML フォールバック">
    送信テキストには Telegram `parse_mode: "HTML"` が使用されます。- Markdown 風のテキストは Telegram セーフな HTML にレンダリングされます。

    * 生のモデル HTML は、Telegram の解析エラーを減らすためにエスケープされます。
    * Telegram が解析された HTML を拒否した場合、OpenClaw はプレーン テキストとして再試行します。

    リンク プレビューはデフォルトで有効になっており、`channels.telegram.linkPreview: false` で無効にできます。
  </Accordion>

  <Accordion title="ネイティブコマンドとカスタムコマンド">
    Telegram コマンド メニューの登録は、起動時に `setMyCommands` で処理されます。

    ネイティブ コマンドのデフォルト:

    * `commands.native: "auto"` は Telegram のネイティブ コマンドを有効にします

    カスタム コマンド メニュー エントリを追加します。

    ```json5
    {
      channels: {
        telegram: {
          customCommands: [
            { command: "backup", description: "Git backup" },
            { command: "generate", description: "Create an image" },
          ],
        },
      },
    }
    ```

    ルール:

    * 名前は正規化されます (先頭の `/` を削除し、小文字にします)
    * 有効なパターン: `a-z`、`0-9`、`_`、長さ `1..32`
    * カスタム コマンドはネイティブ コマンドをオーバーライドできません
    * 競合/重複はスキップされ、ログに記録されます

    注:

    * カスタム コマンドはメニュー エントリのみです。動作を自動実装しない
    * プラグイン/スキルコマンドは、テレグラムメニューに表示されていなくても、入力すると機能します

    ネイティブ コマンドが無効になっている場合、組み込みは削除されます。カスタム/プラグイン コマンドが設定されている場合は、引き続き登録される可能性があります。

    よくあるセットアップの失敗:

    * `setMyCommands failed` は通常、`api.telegram.org` へのアウトバウンド DNS/HTTPS がブロックされていることを意味します。

    ### デバイス ペアリング コマンド (`device-pair` プラグイン)

    `device-pair` プラグインがインストールされている場合:1. `/pair` はセットアップ コードを生成します
    2\. iOS アプリにコードを貼り付けます
    3\. `/pair approve` が最新の保留中のリクエストを承認します

    詳細: [ペアリング](/channels/pairing#pair-via-telegram-recommended-for-ios)。
  </Accordion>

  <Accordion title="インラインボタン">
    インライン キーボード スコープを構成します。

    ```json5
    {
      channels: {
        telegram: {
          capabilities: {
            inlineButtons: "allowlist",
          },
        },
      },
    }
    ```

    アカウントごとの上書き:

    ```json5
    {
      channels: {
        telegram: {
          accounts: {
            main: {
              capabilities: {
                inlineButtons: "allowlist",
              },
            },
          },
        },
      },
    }
    ```

    範囲:

    * `off`
    * `dm`
    * `group`
    * `all`
    * `allowlist` (デフォルト)

    レガシー `capabilities: ["inlineButtons"]` は `inlineButtons: "all"` にマップされます。

    メッセージアクションの例:

    ```json5
    {
      action: "send",
      channel: "telegram",
      to: "123456789",
      message: "Choose an option:",
      buttons: [
        [
          { text: "Yes", callback_data: "yes" },
          { text: "No", callback_data: "no" },
        ],
        [{ text: "Cancel", callback_data: "cancel" }],
      ],
    }
    ```

    コールバックのクリックはテキストとしてエージェントに渡されます。
    `callback_data: <value>`
  </Accordion>

  <Accordion title="エージェントと自動化のためのTelegramメッセージ アクション">
    Telegram ツールのアクションには次のものが含まれます。

    * `sendMessage` (`to`、`content`、オプションの `mediaUrl`、`replyToMessageId`、`messageThreadId`)
    * `react` (`chatId`、`messageId`、`emoji`)
    * `deleteMessage` (`chatId`、`messageId`)
    * `editMessage` (`chatId`、`messageId`、`content`)
    * `createForumTopic` (`chatId`、`name`、オプションの `iconColor`、`iconCustomEmojiId`)

    チャネル メッセージ アクションは、人間工学に基づいたエイリアス (`send`、`react`、`delete`、`edit`、`sticker`、`sticker-search`、`topic-create`) を公開します。

    ゲート制御:- `channels.telegram.actions.sendMessage`

    * `channels.telegram.actions.deleteMessage`
    * `channels.telegram.actions.reactions`
    * `channels.telegram.actions.sticker` (デフォルト: 無効)

    注: `edit` と `topic-create` は現在デフォルトで有効になっており、個別の `channels.telegram.actions.*` 切り替えはありません。

    リアクション削除セマンティクス: [/tools/reactions](/tools/reactions)
  </Accordion>

  <Accordion title="返信スレッドタグ">
    Telegram は、生成された出力で明示的な応答スレッド タグをサポートしています。

    * `[[reply_to_current]]` はトリガーメッセージに応答します
    * `[[reply_to:<id>]]` は特定の Telegram メッセージ ID に応答します

    `channels.telegram.replyToMode` は次の処理を制御します。

    * `off` (デフォルト)
    * `first`
    * `all`

    注: `off` は、暗黙的な応答スレッドを無効にします。明示的な `[[reply_to_*]]` タグは引き続き受け入れられます。
  </Accordion>

  <Accordion title="フォーラムのトピックとスレッドの動作">
    フォーラムのスーパーグループ:

    * トピック セッション キーは `:topic:<threadId>` を追加します
    * 返信と入力はトピックのスレッドをターゲットにします
    * トピック構成パス:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    一般トピック (`threadId=1`) 特殊ケース:

    * メッセージは `message_thread_id` を省略して送信されます (テレグラムは `sendMessage(...thread_id=1)` を拒否します)
    * 入力アクションには引き続き `message_thread_id` が含まれますトピックの継承: トピック エントリは、オーバーライドされない限り、グループ設定を継承します (`requireMention`、`allowFrom`、`skills`、`systemPrompt`、`enabled`、`groupPolicy`)。
      `agentId` はトピックのみであり、グループのデフォルトを継承しません。

    **トピックごとのエージェント ルーティング**: トピック構成で `agentId` を設定することで、各トピックを異なるエージェントにルーティングできます。これにより、各トピックに独自の分離されたワークスペース、メモリ、セッションが与えられます。例:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // General topic → main agent
                "3": { agentId: "zu" },        // Dev topic → zu agent
                "5": { agentId: "coder" }      // Code review → coder agent
              }
            }
          }
        }
      }
    }
    ```

    各トピックには独自のセッション キーがあります: `agent:zu:telegram:group:-1001234567890:topic:3`

    **永続的な ACP トピック バインディング**: フォーラム トピックは、トップレベルの型付き ACP バインディングを通じて ACP ハーネス セッションを固定できます。

    * `bindings[]` と `type: "acp"` および `match.channel: "telegram"`

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
            channel: "telegram",
            accountId: "default",
            peer: { kind: "group", id: "-1001234567890:topic:42" },
          },
        },
      ],
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "42": {
                  requireMention: false,
                },
              },
            },
          },
        },
      },
    }
    ```

    現在、これはグループおよびスーパーグループのフォーラム トピックに限定されています。

    **スレッドバインドされた ACP がチャットから生成**:

    * `/acp spawn <agent> --thread here|auto` は、現在の Telegram トピックを新しい ACP セッションにバインドできます。
    * フォローアップ トピック メッセージは、バインドされた ACP セッションに直接ルーティングされます (`/acp steer` は必要ありません)。
    * OpenClaw は、バインドが成功した後、トピック内に生成確認メッセージを固定します。
    * `channels.telegram.threadBindings.spawnAcpSessions=true` が必要です。

    テンプレートのコンテキストには次のものが含まれます。

    * `MessageThreadId`
    * `IsForum`

    DM スレッドの動作:- `message_thread_id` とのプライベート チャットは DM ルーティングを維持しますが、スレッド対応のセッション キー/返信ターゲットを使用します。
  </Accordion>

  <Accordion title="オーディオ、ビデオ、ステッカー">
    ### 音声メッセージ

    Telegram は音声メモと音声ファイルを区別します。

    * デフォルト: オーディオファイルの動作
    * エージェントの応答に `[[audio_as_voice]]` タグを付けて、ボイスメモの送信を強制します

    メッセージアクションの例:

    ```json5
    {
      action: "send",
      channel: "telegram",
      to: "123456789",
      media: "https://example.com/voice.ogg",
      asVoice: true,
    }
    ```

    ### ビデオメッセージ

    Telegram はビデオ ファイルとビデオ メモを区別します。

    メッセージアクションの例:

    ```json5
    {
      action: "send",
      channel: "telegram",
      to: "123456789",
      media: "https://example.com/video.mp4",
      asVideoNote: true,
    }
    ```

    ビデオノートはキャプションをサポートしていません。指定されたメッセージ テキストは別個に送信されます。

    ### ステッカー

    インバウンドステッカーの処理:

    * 静的 WEBP: ダウンロードおよび処理済み (プレースホルダー `<media:sticker>`)
    * アニメーション TGS: スキップされました
    * ビデオ WEBM: スキップされました

    ステッカーコンテキストフィールド:

    * `Sticker.emoji`
    * `Sticker.setName`
    * `Sticker.fileId`
    * `Sticker.fileUniqueId`
    * `Sticker.cachedDescription`

    ステッカーキャッシュファイル:

    * `~/.openclaw/telegram/sticker-cache.json`

    ステッカーは (可能な場合) 1 回記述され、ビジョン呼び出しの繰り返しを減らすためにキャッシュされます。

    ステッカーアクションを有効にします。

    ```json5
    {
      channels: {
        telegram: {
          actions: {
            sticker: true,
          },
        },
      },
    }
    ```

    ステッカーを送信するアクション:

    ```json5
    {
      action: "sticker",
      channel: "telegram",
      to: "123456789",
      fileId: "CAACAgIAAxkBAAI...",
    }
    ```

    キャッシュされたステッカーを検索:

    ```json5
    {
      action: "sticker-search",
      channel: "telegram",
      query: "cat waving",
      limit: 5,
    }
    ```
  </Accordion>

  <Accordion title="反応通知">
    Telegram の反応は、`message_reaction` 更新として (メッセージ ペイロードとは別に) 到着します。

    有効にすると、OpenClaw は次のようなシステム イベントをキューに入れます。- `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    構成:

    * `channels.telegram.reactionNotifications`: `off | own | all` (デフォルト: `own`)
    * `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (デフォルト: `minimal`)

    注:

    * `own` は、ボット送信メッセージのみに対するユーザーの反応を意味します (送信メッセージ キャッシュによるベストエフォート)。
    * リアクション イベントは依然として Telegram のアクセス制御を尊重します (`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`)。不正な送信者はドロップされます。
    * Telegram はリアクション更新でスレッド ID を提供しません。
      * 非フォーラムグループはグループチャットセッションにルーティングされます
      * フォーラム グループは、正確な元のトピックではなく、グループの一般トピック セッション (`:topic:1`) にルーティングされます。

    ポーリング/Webhook の `allowed_updates` には、`message_reaction` が自動的に含まれます。
  </Accordion>

  <Accordion title="ACK反応">
    `ackReaction` は、OpenClaw が受信メッセージを処理している間に、確認の絵文字を送信します。

    解決順序:

    * `channels.telegram.accounts.<accountId>.ackReaction`
    * `channels.telegram.ackReaction`
    * `messages.ackReaction`
    * エージェント ID 絵文字フォールバック (`agents.list[].identity.emoji`、それ以外の場合は「👀」)

    注:

    * Telegram は Unicode 絵文字 (「👀」など) を想定しています。
    * `""` を使用して、チャネルまたはアカウントの反応を無効にします。
  </Accordion>

  <Accordion title="Telegram イベントおよびコマンドからの構成の書き込み">
    チャネル構成の書き込みはデフォルトで有効になっています (`configWrites !== false`)。

    Telegram によってトリガーされる書き込みには次のものが含まれます。- `channels.telegram.groups` を更新するグループ移行イベント (`migrate_to_chat_id`)

    * `/config set` および `/config unset` (コマンドの有効化が必要)

    無効にする:

    ```json5
    {
      channels: {
        telegram: {
          configWrites: false,
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="ロングポーリングと Webhook の比較">
    デフォルト: ロングポーリング。

    Webhook モード:

    * `channels.telegram.webhookUrl` を設定します
    * set `channels.telegram.webhookSecret` (Webhook URL を設定する場合に必要)
    * オプションの `channels.telegram.webhookPath` (デフォルトは `/telegram-webhook`)
    * オプションの `channels.telegram.webhookHost` (デフォルトは `127.0.0.1`)
    * オプションの `channels.telegram.webhookPort` (デフォルトは `8787`)

    Webhook モードのデフォルトのローカル リスナーは `127.0.0.1:8787` にバインドされます。

    パブリック エンドポイントが異なる場合は、リバース プロキシを前面に配置し、`webhookUrl` をパブリック URL に指定します。
    意図的に外部イングレスが必要な場合は、`webhookHost` (例: `0.0.0.0`) を設定します。
  </Accordion>

  <Accordion title="制限、再試行、および CLI ターゲット">
    * `channels.telegram.textChunkLimit` のデフォルトは 4000 です。
    * `channels.telegram.chunkMode="newline"` は、長さで分割する前に段落境界（空行）を優先します。
    * `channels.telegram.mediaMaxMb`（デフォルト 100）は、受信および送信する Telegram メディアのサイズを制限します。
    * `channels.telegram.timeoutSeconds` は Telegram API クライアントのタイムアウトを上書きします（未設定時は grammY の既定値が使われます）。
    * グループ コンテキスト履歴は `channels.telegram.historyLimit` または `messages.groupChat.historyLimit`（デフォルト 50）を使います。`0` で無効になります。
    * DM 履歴の制御項目:
      * `channels.telegram.dmHistoryLimit`
      * `channels.telegram.dms["<user_id>"].historyLimit`
    * `channels.telegram.retry` 設定は、回復可能な送信 API エラーに対する Telegram 送信ヘルパー（CLI / ツール / アクション）へ適用されます。

    CLI 送信ターゲットには、数値のチャット ID またはユーザー名を指定できます。

    ```bash
    openclaw message send --channel telegram --target 123456789 --message "hi"
    openclaw message send --channel telegram --target @name --message "hi"
    ```

    Telegram の投票では `openclaw message poll` を使用し、フォーラム トピックもサポートします。

    ```bash
    openclaw message poll --channel telegram --target 123456789 \
      --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
    openclaw message poll --channel telegram --target -1001234567890:topic:42 \
      --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
      --poll-duration-seconds 300 --poll-public
    ```

    Telegram のみのポーリング フラグ:

    * `--poll-duration-seconds` (5-600)
    * `--poll-anonymous`
    * `--poll-public`
    * フォーラム トピックの場合は `--thread-id` (または `:topic:` ターゲットを使用)

    アクションゲート:

    * `channels.telegram.actions.sendMessage=false` は、投票を含むアウトバウンド Telegram メッセージを無効にします
    * `channels.telegram.actions.poll=false` は、定期的な送信を有効にしたまま、テレグラム投票の作成を無効にします
  </Accordion>
</AccordionGroup>

## トラブルシューティング

<AccordionGroup>
  <Accordion title="ボットはメンション以外のグループ メッセージに応答しません">
    * `requireMention=false` の場合、Telegram プライバシー モードでは完全な可視性を許可する必要があります。
    * BotFather: `/setprivacy` -> 無効にする
    * その後、ボットを削除してグループに再度追加します
    * `openclaw channels status` は、構成で言及されていないグループ メッセージが予期される場合に警告します。
    * `openclaw channels status --probe` は、明示的な数値グループ ID をチェックできます。ワイルドカード `"*"` はメンバーシップを調査できません。
    * クイックセッションテスト: `/activation always`。
  </Accordion>

  <Accordion title="ボットにグループメッセージがまったく表示されない">
    * `channels.telegram.groups` が存在する場合、グループをリストする必要があります (または `"*"` を含める)
    * グループ内のボットのメンバーシップを確認する
    * ログの確認: スキップ理由の `openclaw logs --follow`
  </Accordion>

  <Accordion title="コマンドが部分的に機能するか、まったく機能しない">
    * 送信者の ID を認証します (ペアリングおよび/または数値 `allowFrom`)
    * グループ ポリシーが `open` の場合でも、コマンド認可は引き続き適用されます。
    * `setMyCommands failed` は通常、`api.telegram.org` への DNS/HTTPS 到達可能性の問題を示します。
  </Accordion>

  <Accordion title="ポーリングまたはネットワークの不安定性">
    * ノード 22 以降 + カスタム フェッチ/プロキシは、AbortSignal タイプが一致しない場合に即時中止動作をトリガーできます。
    * 一部のホストは、最初に `api.telegram.org` を IPv6 に解決します。壊れた IPv6 出力により、断続的な Telegram API エラーが発生する可能性があります。
    * ログに `TypeError: fetch failed` または `Network request for 'getUpdates' failed!` が含まれている場合、OpenClaw はこれらを回復可能なネットワーク エラーとして再試行するようになりました。
    * 不安定な直接出力/TLS を備えた VPS ホストでは、Telegram API 呼び出しを `channels.telegram.proxy` 経由でルーティングします。

    ```yaml
    channels:
      telegram:
        proxy: socks5://<user>:<password>@proxy-host:1080
    ```

    * ノード 22+ のデフォルトは `autoSelectFamily=true` (WSL2 を除く) および `dnsResultOrder=ipv4first` です。
    * ホストが WSL2 であるか、明示的に IPv4 のみの動作でより適切に動作する場合は、ファミリーの選択を強制します。

    ```yaml
    channels:
      telegram:
        network:
          autoSelectFamily: false
    ```

    * 環境の上書き (一時的):
      * `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      * `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      * `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    * DNS 応答を検証します。

    ```bash
    dig +short api.telegram.org A
    dig +short api.telegram.org AAAA
    ```
  </Accordion>
</AccordionGroup>

その他のヘルプ: [チャネルのトラブルシューティング](/channels/troubleshooting)。

## Telegram 構成参照ポインタ

主な参考文献:- `channels.telegram.enabled`: チャネルの起動を有効/無効にします。

* `channels.telegram.botToken`: ボット トークン (BotFather)。

* `channels.telegram.tokenFile`: ファイル パスからトークンを読み取ります。

* `channels.telegram.dmPolicy`: `pairing | allowlist | open | disabled` (デフォルト: ペアリング)。

* `channels.telegram.allowFrom`: DM 許可リスト (数値の Telegram ユーザー ID)。 `allowlist` には少なくとも 1 つの送信者 ID が必要です。 `open` には `"*"` が必要です。 `openclaw doctor --fix` は、レガシー `@username` エントリを ID に解決でき、ホワイトリスト移行フローのペアリング ストア ファイルからホワイトリスト エントリを回復できます。

* `channels.telegram.actions.poll`: Telegram 投票の作成を有効または無効にします (デフォルト: 有効。それでも `sendMessage` が必要です)。

* `channels.telegram.defaultTo`: 明示的な `--reply-to` が指定されていない場合に、CLI `--deliver` によって使用されるデフォルトの Telegram ターゲット。

* `channels.telegram.groupPolicy`: `open | allowlist | disabled` (デフォルト: ホワイトリスト)。

* `channels.telegram.groupAllowFrom`: グループ送信者の許可リスト (数値の Telegram ユーザー ID)。 `openclaw doctor --fix` は、従来の `@username` エントリを ID に解決できます。数値以外のエントリは認証時に無視されます。グループ認証では、DM ペアリングとストアのフォールバックは使用されません (`2026.2.25+`)。

* マルチアカウントの優先順位:
  * 2 つ以上のアカウント ID が設定されている場合は、`channels.telegram.defaultAccount` を設定 (または `channels.telegram.accounts.default` を含めて) デフォルトのルーティングを明示します。
  * どちらも設定されていない場合、OpenClaw は最初の正規化されたアカウント ID にフォールバックし、`openclaw doctor` が警告します。- `channels.telegram.accounts.default.allowFrom` および `channels.telegram.accounts.default.groupAllowFrom` は、`default` アカウントにのみ適用されます。
  * アカウントレベルの値が設定されていない場合、名前付きアカウントは `channels.telegram.allowFrom` および `channels.telegram.groupAllowFrom` を継承します。
  * 名前付きアカウントは `channels.telegram.accounts.default.allowFrom` / `groupAllowFrom` を継承しません。

* `channels.telegram.groups`: グループごとのデフォルト + ホワイトリスト (グローバルデフォルトには `"*"` を使用します)。
  * `channels.telegram.groups.<id>.groupPolicy`: groupPolicy のグループごとの上書き (`open | allowlist | disabled`)。
  * `channels.telegram.groups.<id>.requireMention`: ゲートのデフォルトについて言及。
  * `channels.telegram.groups.<id>.skills`: スキル フィルター (省略 = すべてのスキル、空 = なし)。
  * `channels.telegram.groups.<id>.allowFrom`: グループごとの送信者許可リストの上書き。
  * `channels.telegram.groups.<id>.systemPrompt`: グループの追加のシステム プロンプト。
  * `channels.telegram.groups.<id>.enabled`: `false` の場合はグループを無効にします。
  * `channels.telegram.groups.<id>.topics.<threadId>.*`: トピックごとのオーバーライド (グループ フィールド + トピックのみ `agentId`)。
  * `channels.telegram.groups.<id>.topics.<threadId>.agentId`: このトピックを特定のエージェントにルーティングします (グループ レベルおよびバインディング ルーティングをオーバーライドします)。
  * `channels.telegram.groups.<id>.topics.<threadId>.groupPolicy`: groupPolicy のトピックごとのオーバーライド (`open | allowlist | disabled`)。
  * `channels.telegram.groups.<id>.topics.<threadId>.requireMention`: トピックごとのメンション ゲートのオーバーライド。
  * トップレベル `bindings[]` と `type: "acp"` および正規トピック ID `chatId:topic:topicId` (`match.peer.id`): 永続的な ACP トピック バインディング フィールド ([ACP エージェント](/tools/acp-agents#channel-specific-settings) を参照)。
  * `channels.telegram.direct.<id>.topics.<threadId>.agentId`: DM トピックを特定のエージェントにルーティングします (フォーラム トピックと同じ動作)。

* `channels.telegram.capabilities.inlineButtons`: `off | dm | group | all | allowlist` (デフォルト: ホワイトリスト)。- `channels.telegram.accounts.<account>.capabilities.inlineButtons`: アカウントごとの上書き。

* `channels.telegram.commands.nativeSkills`: Telegram ネイティブ スキル コマンドを有効/無効にします。

* `channels.telegram.replyToMode`: `off | first | all` (デフォルト: `off`)。

* `channels.telegram.textChunkLimit`: 送信チャンク サイズ (文字数)。

* `channels.telegram.chunkMode`: `length` (デフォルト) または `newline` は、長さをチャンクする前に空白行 (段落境界) で分割します。

* `channels.telegram.linkPreview`: 送信メッセージのリンク プレビューを切り替えます (デフォルト: true)。

* `channels.telegram.streaming`: `off | partial | block | progress` (ライブ ストリーム プレビュー; デフォルト: `partial`; `progress` は `partial` にマップされます。 `block` は従来のプレビュー モードとの互換性です)。 Telegram プレビュー ストリーミングでは、その場で編集された単一のプレビュー メッセージが使用されます。

* `channels.telegram.mediaMaxMb`: インバウンド/アウトバウンド Telegram メディアの上限 (MB、デフォルト: 100)。

* `channels.telegram.retry`: 回復可能なアウトバウンド API エラー (試行、minDelayMs、maxDelayMs、ジッター) に対する Telegram 送信ヘルパー (CLI/ツール/アクション) の再試行ポリシー。

* `channels.telegram.network.autoSelectFamily`: ノード autoSelectFamily をオーバーライドします (true=有効、false=無効)。ノード 22 以降ではデフォルトで有効になり、WSL2 はデフォルトで無効になります。

* `channels.telegram.network.dnsResultOrder`: DNS 結果の順序を上書きします (`ipv4first` または `verbatim`)。ノード 22 以降のデフォルトは `ipv4first` です。

* `channels.telegram.proxy`: ボット API 呼び出しのプロキシ URL (SOCKS/HTTP)。

* `channels.telegram.webhookUrl`: Webhook モードを有効にします (`channels.telegram.webhookSecret` が必要)。- `channels.telegram.webhookSecret`: Webhook シークレット (WebhookUrl が設定されている場合に必要)。

* `channels.telegram.webhookPath`: ローカル Webhook パス (デフォルト `/telegram-webhook`)。

* `channels.telegram.webhookHost`: ローカル Webhook バインド ホスト (デフォルト `127.0.0.1`)。

* `channels.telegram.webhookPort`: ローカル Webhook バインド ポート (デフォルト `8787`)。

* `channels.telegram.actions.reactions`: ゲートTelegramツールの反応。

* `channels.telegram.actions.sendMessage`: ゲート テレグラム ツール メッセージの送信。

* `channels.telegram.actions.deleteMessage`: ゲート テレグラム ツール メッセージが削除されます。

* `channels.telegram.actions.sticker`: ゲート テレグラム ステッカー アクション — 送信および検索 (デフォルト: false)。

* `channels.telegram.reactionNotifications`: `off | own | all` — どの反応がシステム イベントをトリガーするかを制御します (設定されていない場合、デフォルト: `own`)。

* `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` — 制御エージェントの反応能力 (設定されていない場合のデフォルト: `minimal`)。

* [設定リファレンス - Telegram](/gateway/configuration-reference#telegram)

Telegram特有の高信号フィールド:- 起動/認証: `enabled`、`botToken`、`tokenFile`、`accounts.*`

* アクセス制御: `dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`groups`、`groups.*.topics.*`、トップレベル `bindings[]` (`type: "acp"`)
* コマンド/メニュー: `commands.native`、`commands.nativeSkills`、`customCommands`
* スレッド化/返信: `replyToMode`
* ストリーミング: `streaming` (プレビュー)、`blockStreaming`
* フォーマット/配信: `textChunkLimit`、`chunkMode`、`linkPreview`、`responsePrefix`
* メディア/ネットワーク: `mediaMaxMb`、`timeoutSeconds`、`retry`、`network.autoSelectFamily`、`proxy`
* Webhook: `webhookUrl`、`webhookSecret`、`webhookPath`、`webhookHost`
* アクション/機能: `capabilities.inlineButtons`、`actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
* 反応: `reactionNotifications`、`reactionLevel`
* 書き込み/履歴: `configWrites`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`

## 関連

* [ペアリング](/channels/pairing)
* [チャンネルルーティング](/channels/channel-routing)
* [マルチエージェントルーティング](/concepts/multi-agent)
* [トラブルシューティング](/channels/troubleshooting)
