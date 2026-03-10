---
summary: "サーフェス間でのグループ チャットの動作 (WhatsApp/Telegram/Discord/Slack/Signal/iMessage/Microsoft Teams/Zalo)"
read_when:
  - グループチャットの動作またはメンションゲートの変更
title: "グループ"
x-i18n:
  source_hash: "3464d9d4f283ea437a6e4ac3984df163f44715c51469e449241bf7a4d9ba6332"
---

# グループ

OpenClaw は、WhatsApp、Telegram、Discord、Slack、Signal、iMessage、Microsoft Teams、Zalo などのサーフェス間でグループ チャットを一貫して処理します。

## 初心者入門 (2 分)

OpenClaw は、ユーザー自身のメッセージング アカウント上に「存在」します。個別の WhatsApp ボット ユーザーは存在しません。
**あなた**がグループに属している場合、OpenClaw はそのグループを確認し、そこで応答できます。

デフォルトの動作:

- グループは制限されています (`groupPolicy: "allowlist"`)。
- メンション ゲートを明示的に無効にしない限り、返信にはメンションが必要です。

翻訳: ホワイトリストに登録された送信者は、OpenClaw に言及することで OpenClaw をトリガーできます。

> TL;DR
>
> - **DM アクセス** は `*.allowFrom` によって制御されます。
> - **グループ アクセス**は、`*.groupPolicy` + 許可リスト (`*.groups`、`*.groupAllowFrom`) によって制御されます。
> - **返信トリガー**はメンション ゲーティング (`requireMention`、`/activation`) によって制御されます。

簡単なフロー (グループ メッセージに何が起こるか):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

![グループメッセージフロー](/images/groups-flow.svg)

| ご希望であれば...                                           | 目標                                                       | 何を設定するか |
| ----------------------------------------------------------- | ---------------------------------------------------------- | -------------- |
| すべてのグループを許可しますが、@メンションにのみ返信します | `groups: { "*": { requireMention: true } }`                |
| すべてのグループ返信を無効にする                            | `groupPolicy: "disabled"`                                  |
| 特定のグループのみ                                          | `groups: { "<group-id>": { ... } }` (`"*"` キーなし)       |
| グループ内でトリガーできるのは自分だけです                  | `groupPolicy: "allowlist"`、`groupAllowFrom: ["+1555..."]` |

## セッションキー

- グループ セッションは `agent:<agentId>:<channel>:group:<id>` セッション キーを使用します (ルーム/チャネルは `agent:<agentId>:<channel>:channel:<id>` を使用します)。
- Telegram フォーラムのトピックでは、グループ ID に `:topic:<threadId>` が追加されるため、各トピックには独自のセッションが存在します。
- ダイレクト チャットはメイン セッション (または構成されている場合は送信者ごと) を使用します。
- グループセッションではハートビートはスキップされます。

## パターン: 個人 DM + 公開グループ (単一エージェント)

はい。「個人」トラフィックが **DM** で、「パブリック」トラフィックが **グループ**の場合、これはうまく機能します。

理由: シングルエージェント モードでは、DM は通常 **メイン** セッション キー (`agent:main:main`) に到達しますが、グループは常に **非メイン** セッション キー (`agent:main:<channel>:group:<id>`) を使用します。 `mode: "non-main"` でサンドボックスを有効にすると、メインの DM セッションがホスト上に留まりながら、それらのグループ セッションが Docker で実行されます。これにより、エージェントの「頭脳」 (共有ワークスペース + メモリ) が 1 つになりますが、実行姿勢は 2 つになります。

- **DM**: フルツール (ホスト)
- **グループ**: サンドボックス + 制限付きツール (Docker)

> 本当に別々のワークスペース/ペルソナが必要な場合 (「個人」と「パブリック」を決して混在させてはなりません)、2 番目のエージェント + バインディングを使用します。 [マルチエージェント ルーティング](/concepts/multi-agent) を参照してください。

例 (ホスト上の DM、サンドボックス化されたグループ + メッセージング専用ツール):

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // groups/channels are non-main -> sandboxed
        scope: "session", // strongest isolation (one container per group/channel)
        workspaceAccess: "none",
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        // If allow is non-empty, everything else is blocked (deny still wins).
        allow: ["group:messaging", "group:sessions"],
        deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
      },
    },
  },
}
```

「ホストアクセスなし」ではなく「グループはフォルダー X のみを表示できる」ようにしたいですか? `workspaceAccess: "none"` を保持し、許可リストに登録されたパスのみをサンドボックスにマウントします。

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        scope: "session",
        workspaceAccess: "none",
        docker: {
          binds: [
            // hostPath:containerPath:mode
            "/home/user/FriendsShared:/data:ro",
          ],
        },
      },
    },
  },
}
```

関連:

- 構成キーとデフォルト: [ゲートウェイ構成](/gateway/configuration#agentsdefaultssandbox)
- ツールがブロックされる理由のデバッグ: [サンドボックス vs ツール ポリシー vs 昇格](/gateway/sandbox-vs-tool-policy-vs-elevated)
- バインドマウントの詳細: [サンドボックス](/gateway/sandboxing#custom-bind-mounts)

## ラベルを表示する

- UI ラベルは、利用可能な場合は `displayName` を使用し、`<channel>:<token>` としてフォーマットされます。
- `#room` はルーム/チャンネル用に予約されています。グループ チャットでは `g-<slug>` (小文字、スペース -> `-`、`#@+._-` のまま) を使用します。

## グループポリシー

グループ/ルーム メッセージをチャネルごとに処理する方法を制御します。

````json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789"], // numeric Telegram user id (wizard can resolve @username)
    },
    signal: {
      groupPolicy: "disabled",
      groupAllowFrom: ["+15551234567"],
    },
    imessage: {
      groupPolicy: "disabled",
      groupAllowFrom: ["chat_id:123"],
    },
    msteams: {
      groupPolicy: "disabled",
      groupAllowFrom: ["user@org.com"],
    },
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        GUILD_ID: { channels: { help: { allow: true } } },
      },
    },
    slack: {
      groupPolicy: "allowlist",
      channels: { "#general": { allow: true } },
    },
    matrix: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["@owner:example.org"],
      groups: {
        "!roomId:example.org": { allow: true },
        "#alias:example.org": { allow: true },
      },
    },
  },
}
```|ポリシー |行動 |
| ------------- | -------------------------------------------------------------- |
| `"open"` |グループは許可リストをバイパスします。メンションゲートは引き続き適用されます。      |
| `"disabled"` |すべてのグループメッセージを完全にブロックします。                           |
| `"allowlist"` |設定された許可リストに一致するグループ/ルームのみを許可します。 |

注:- `groupPolicy` は、メンションゲート (@メンションが必要) とは別のものです。
- WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: `groupAllowFrom` を使用します (フォールバック: 明示的な `allowFrom`)。
- DM ペアリングの承認 (`*-allowFrom` ストア エントリ) は DM アクセスにのみ適用されます。グループ送信者の承認は、グループ許可リストに対して明示的なままになります。
- Discord: 許可リストは `channels.discord.guilds.<id>.channels` を使用します。
- Slack: 許可リストは `channels.slack.channels` を使用します。
- マトリックス: ホワイトリストは `channels.matrix.groups` (ルーム ID、エイリアス、または名前) を使用します。 `channels.matrix.groupAllowFrom` を使用して送信者を制限します。部屋ごとの `users` 許可リストもサポートされています。
- グループ DM は個別に制御されます (`channels.discord.dm.*`、`channels.slack.dm.*`)。
- Telegram ホワイトリストはユーザー ID (`"123456789"`、`"telegram:123456789"`、`"tg:123456789"`) またはユーザー名 (`"@alice"` または `"alice"`) と一致します。接頭辞は大文字と小文字が区別されません。
- デフォルトは `groupPolicy: "allowlist"` です。グループの許可リストが空の場合、グループ メッセージはブロックされます。
- 実行時の安全性: プロバイダー ブロックが完全に欠落している (`channels.<provider>` が存在しない) 場合、グループ ポリシーは `channels.defaults.groupPolicy` を継承するのではなく、フェールクローズ モード (通常は `allowlist`) に戻ります。

クイックメンタルモデル (グループメッセージの評価順序):

1. `groupPolicy` (オープン/無効/許可リスト)
2. グループ許可リスト (`*.groups`、`*.groupAllowFrom`、チャネル固有の許可リスト)
3. ゲーティングについての言及 (`requireMention`、`/activation`)## メンションゲート (デフォルト)

グループごとにオーバーライドしない限り、グループ メッセージにはメンションが必要です。デフォルトは、サブシステムごとに `*.groups."*"` で有効です。

ボット メッセージへの返信は、暗黙的なメンションとしてカウントされます (チャネルが返信メタデータをサポートしている場合)。これは、Telegram、WhatsApp、Slack、Discord、および Microsoft Teams に適用されます。

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
        "123@g.us": { requireMention: false },
      },
    },
    telegram: {
      groups: {
        "*": { requireMention: true },
        "123456789": { requireMention: false },
      },
    },
    imessage: {
      groups: {
        "*": { requireMention: true },
        "123": { requireMention: false },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          mentionPatterns: ["@openclaw", "openclaw", "\\+15555550123"],
          historyLimit: 50,
        },
      },
    ],
  },
}
````

注:

- `mentionPatterns` は、大文字と小文字を区別しない正規表現です。
- 明示的な言及を提供する表面は引き続き合格します。パターンはフォールバックです。
- エージェントごとのオーバーライド: `agents.list[].groupChat.mentionPatterns` (複数のエージェントがグループを共有する場合に便利)。
- メンション ゲートは、メンション検出が可能な場合 (ネイティブ メンションまたは `mentionPatterns` が設定されている場合) にのみ適用されます。
- Discord のデフォルトは `channels.discord.guilds."*"` にあります (ギルド/チャンネルごとに上書き可能)。
- グループ履歴コンテキストはチャネル全体で均一にラップされ、**保留専用** (メンション ゲートによりメッセージがスキップされます)。グローバルデフォルトには `messages.groupChat.historyLimit` を使用し、オーバーライドには `channels.<channel>.historyLimit` (または `channels.<channel>.accounts.*.historyLimit`) を使用します。 `0` を無効に設定します。

## グループ/チャネルツールの制限 (オプション)

一部のチャネル構成は、**特定のグループ/ルーム/チャネル**内で使用できるツールの制限をサポートしています。- `tools`: グループ全体に対してツールを許可/拒否します。

- `toolsBySender`: グループ内の送信者ごとのオーバーライド。
  明示的なキープレフィックスを使用します。
  `id:<senderId>`、`e164:<phone>`、`username:<handle>`、`name:<displayName>`、および `"*"` ワイルドカード。
  従来のプレフィックスのないキーは引き続き受け入れられ、`id:` としてのみ照合されます。

解決順序 (最も具体的な優先順位):

1. グループ/チャンネル `toolsBySender` の一致
2. グループ/チャンネル `tools`
3. デフォルト (`"*"`) `toolsBySender` 一致
4. デフォルト (`"*"`) `tools`

例（電報）：

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { tools: { deny: ["exec"] } },
        "-1001234567890": {
          tools: { deny: ["exec", "read", "write"] },
          toolsBySender: {
            "id:123456789": { alsoAllow: ["exec"] },
          },
        },
      },
    },
  },
}
```

注:

- グローバル/エージェント ツール ポリシーに加えて、グループ/チャネル ツールの制限が適用されます (拒否しても優先されます)。
- 一部のチャネルでは、ルーム/チャネルに異なるネストが使用されます (例: Discord `guilds.*.channels.*`、Slack `channels.*`、MS Teams `teams.*.channels.*`)。

## グループ許可リスト

`channels.whatsapp.groups`、`channels.telegram.groups`、または `channels.imessage.groups` が構成されている場合、キーはグループ許可リストとして機能します。 `"*"` を使用して、デフォルトのメンション動作を設定しながらすべてのグループを許可します。

共通のインテント (コピー/ペースト):

1. すべてのグループ返信を無効にする

```json5
{
  channels: { whatsapp: { groupPolicy: "disabled" } },
}
```

2. 特定のグループのみを許可する (WhatsApp)

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "123@g.us": { requireMention: true },
        "456@g.us": { requireMention: false },
      },
    },
  },
}
```

3. すべてのグループを許可しますが、言及が必要です (明示的)

```json5
{
  channels: {
    whatsapp: {
      groups: { "*": { requireMention: true } },
    },
  },
}
```

4. グループ内でトリガーできるのは所有者だけです (WhatsApp)

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
      groups: { "*": { requireMention: true } },
    },
  },
}
```

## アクティベーション (所有者のみ)グループ所有者は、グループごとのアクティブ化を切り替えることができます

- `/activation mention`
- `/activation always`

所有者は `channels.whatsapp.allowFrom` (または設定されていない場合はボット自身の E.164) によって決定されます。コマンドをスタンドアロン メッセージとして送信します。他のサーフェスは現在、`/activation` を無視します。

## コンテキストフィールド

グループ受信ペイロードセット:

- `ChatType=group`
- `GroupSubject` (既知の場合)
- `GroupMembers` (既知の場合)
- `WasMentioned` (ゲート結果について言及)
- Telegram フォーラムのトピックには、`MessageThreadId` および `IsForum` も含まれます。

エージェント システム プロンプトには、新しいグループ セッションの最初のターンにグループの紹介が含まれます。これにより、モデルは人間のように応答し、Markdown テーブルを避け、リテラルの `\n` シーケンスの入力を避けるようになります。

## iMessage の詳細

- ルーティングまたは許可リストに登録する場合は、`chat_id:<id>` を優先します。
- チャットのリスト: `imsg chats --limit 20`。
- グループの返信は常に同じ `chat_id` に戻ります。

## WhatsApp の詳細

WhatsApp のみの動作 (履歴挿入、メンション処理の詳細) については、[グループ メッセージ](/channels/group-messages) を参照してください。
