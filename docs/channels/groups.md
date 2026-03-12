---
summary: "各サーフェスにおけるグループチャットの挙動"
read_when:
  - グループチャットの挙動やメンション制御を変更する場合
title: "Groups"
seoTitle: "OpenClawのグループチャット挙動とメンション制御ガイド"
description: "複数チャネルに共通するグループチャットの挙動をまとめます。メンション、アクセス制御、各プラットフォームごとの違いを確認できます。"
x-i18n:
  source_hash: "3464d9d4f283ea437a6e4ac3984df163f44715c51469e449241bf7a4d9ba6332"
---
OpenClaw は、WhatsApp、Telegram、Discord、Slack、Signal、iMessage、Microsoft Teams、Zalo など、複数のサーフェスにまたがってグループチャットを一貫した考え方で扱います。

## Beginner intro (2 minutes)

OpenClaw は、利用者自身のメッセージングアカウント上で動作します。WhatsApp 専用の別ボットユーザーが存在するわけではありません。利用者がグループに参加していれば、OpenClaw もそのグループを認識し、そこで応答できます。

デフォルトの挙動は次のとおりです。

- グループは制限付きです (`groupPolicy: "allowlist"`)。
- 明示的に無効化しない限り、返信にはメンションが必要です。

つまり、allowlist に登録された送信者がメンションしたときに OpenClaw が反応します。

> TL;DR
>
> - **DM access** は `*.allowFrom` で制御されます。
> - **Group access** は `*.groupPolicy` と allowlist (`*.groups`, `*.groupAllowFrom`) で制御されます。
> - **Reply triggering** はメンション制御 (`requireMention`, `/activation`) で制御されます。

グループメッセージは概ね次の順序で処理されます。

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

![Group message flow](/images/groups-flow.svg)

よくある目的と設定例:

| Goal                                         | What to set                                                |
| -------------------------------------------- | ---------------------------------------------------------- |
| Allow all groups but only reply on @mentions | `groups: { "*": { requireMention: true } }`                |
| Disable all group replies                    | `groupPolicy: "disabled"`                                  |
| Only specific groups                         | `groups: { "<group-id>": { ... } }` (no `"*"` key)         |
| Only you can trigger in groups               | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## Session keys

- グループセッションには `agent:<agentId>:<channel>:group:<id>` 形式のセッションキーを使います。ルームやチャンネルでは `agent:<agentId>:<channel>:channel:<id>` を使います。
- Telegram のフォーラムトピックでは、グループ ID に `:topic:<threadId>` が追加されるため、トピックごとに独立したセッションになります。
- ダイレクトチャットはメインセッションを使います。構成によっては送信者ごとに分けることもできます。
- ハートビートはグループセッションでは実行されません。

## Pattern: personal DMs + public groups (single agent)

「個人用」は **DM**、「公開用」は **グループ** という使い分けであれば、単一エージェント構成でもうまく運用できます。

理由は、シングルエージェント構成では DM が通常 **main** セッションキー (`agent:main:main`) に入り、グループは常に **non-main** セッションキー (`agent:main:<channel>:group:<id>`) を使うためです。`mode: "non-main"` でサンドボックスを有効にすると、DM のメインセッションはホスト上に残しつつ、グループセッションだけを Docker 内で動かせます。

これにより、ワークスペースやメモリは 1 つの「頭脳」として共有しながら、実行形態だけを分けられます。

- **DMs**: フルツールをホスト上で実行
- **Groups**: 制限付きツールをサンドボックス内で実行

> 「個人用」と「公開用」を完全に分離し、ワークスペースや人格を絶対に混在させたくない場合は、2 つ目のエージェントと bindings を使ってください。詳しくは [Multi-Agent Routing](/concepts/multi-agent) を参照してください。

例: DM はホスト上、グループはサンドボックス化し、メッセージング系ツールだけを許可する構成です。

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

「ホストへ一切アクセスさせない」代わりに、「グループでは特定フォルダだけ見せたい」場合は、`workspaceAccess: "none"` を維持したまま、許可するパスだけをサンドボックスへ bind mount します。

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
- ツールがブロックされる理由の調査: [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated)
- bind mount の詳細: [Sandboxing](/gateway/sandboxing#custom-bind-mounts)

## Display labels

- UI ラベルでは、利用できる場合は `displayName` を使い、`<channel>:<token>` 形式で表示します。
- `#room` はルーム / チャンネル用に予約されています。グループチャットでは `g-<slug>` を使います。小文字化し、空白は `-` に変換し、`#@+._-` は保持されます。

## Group policy

チャンネルごとに、グループ / ルームメッセージをどう扱うかを制御します。

```json5
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
```

| Policy        | Behavior                                                     |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | グループは allowlist を迂回しますが、メンション制御は引き続き適用されます。 |
| `"disabled"`  | すべてのグループメッセージを完全に拒否します。                           |
| `"allowlist"` | 設定済み allowlist に一致するグループ / ルームだけを許可します。         |

補足:

- `groupPolicy` はメンション制御とは別物です。メンション制御は @メンション必須かどうかを決めます。
- WhatsApp、Telegram、Signal、iMessage、Microsoft Teams、Zalo では `groupAllowFrom` を使います。未設定時は明示的な `allowFrom` へフォールバックします。
- DM のペアリング承認 (`*-allowFrom` ストアエントリ) は DM アクセスにだけ適用されます。グループ送信者の認可は、グループ allowlist 側で明示的に管理されます。
- Discord の allowlist は `channels.discord.guilds.<id>.channels` を使います。
- Slack の allowlist は `channels.slack.channels` を使います。
- Matrix の allowlist は `channels.matrix.groups` を使います。ルーム ID、エイリアス、名前に対応します。送信者制限には `channels.matrix.groupAllowFrom` を使い、ルームごとの `users` allowlist も利用できます。
- グループ DM は別系統で制御されます (`channels.discord.dm.*`, `channels.slack.dm.*`)。
- Telegram の allowlist は、ユーザー ID (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) またはユーザー名 (`"@alice"` または `"alice"`) に一致できます。プレフィックスの大文字小文字は区別されません。
- デフォルトは `groupPolicy: "allowlist"` です。グループ allowlist が空なら、グループメッセージはブロックされます。
- 実行時の安全策として、プロバイダーブロック自体が存在しない (`channels.<provider>` がない) 場合は、`channels.defaults.groupPolicy` を継承せず、フェイルクローズ動作として通常 `allowlist` にフォールバックします。

グループメッセージの評価順序は、概ね次のとおりです。

1. `groupPolicy` (`open`, `disabled`, `allowlist`)
2. グループ allowlist (`*.groups`, `*.groupAllowFrom`, チャンネル固有の allowlist)
3. メンション制御 (`requireMention`, `/activation`)

## Mention gating (default)

グループメッセージは、グループごとに上書きしない限りメンション必須です。既定値はサブシステムごとの `*.groups."*"` にあります。

チャネルが返信メタデータをサポートしている場合、ボットのメッセージへ返信することも暗黙のメンションとして扱われます。これは Telegram、WhatsApp、Slack、Discord、Microsoft Teams に適用されます。

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
```

補足:

- `mentionPatterns` は大文字小文字を区別しない正規表現です。
- 明示的なメンションを提供するサーフェスでは、その仕組みが優先されます。パターンはフォールバックです。
- エージェント単位で上書きする場合は `agents.list[].groupChat.mentionPatterns` を使います。複数エージェントが同じグループを共有する場合に便利です。
- メンション制御は、ネイティブメンションまたは `mentionPatterns` によってメンション検出が可能な場合にだけ適用されます。
- Discord の既定値は `channels.discord.guilds."*"` にあります。ギルド単位やチャンネル単位で上書きできます。
- グループ履歴コンテキストはチャネル間で共通の形式に包まれ、**pending-only** です。つまり、メンション制御によってスキップされたメッセージだけが対象です。グローバル既定値には `messages.groupChat.historyLimit`、個別上書きには `channels.<channel>.historyLimit` または `channels.<channel>.accounts.*.historyLimit` を使います。`0` にすると無効化できます。

## Group/channel tool restrictions (optional)

一部のチャンネル設定では、**特定のグループ / ルーム / チャンネル内** で使えるツールを制限できます。

- `tools`: グループ全体に対する allow / deny 設定です。
- `toolsBySender`: グループ内の送信者ごとの上書き設定です。
  使うキーには明示的なプレフィックスを付けます。
  `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>`, および `"*"` ワイルドカードです。

プレフィックスのない従来形式のキーも引き続き受け付けますが、`id:` としてのみ照合されます。

評価順序は、より具体的なものが優先されます。

1. グループ / チャンネルの `toolsBySender`
2. グループ / チャンネルの `tools`
3. デフォルト (`"*"`) の `toolsBySender`
4. デフォルト (`"*"`) の `tools`

例 (Telegram):

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

補足:

- グループ / チャンネル単位のツール制限は、グローバルまたはエージェント単位のツールポリシーに追加で適用されます。`deny` が競合した場合は `deny` が優先されます。
- 一部のチャンネルでは、ルームやチャンネルのネスト構造が異なります。たとえば Discord は `guilds.*.channels.*`、Slack は `channels.*`、MS Teams は `teams.*.channels.*` を使います。

## Group allowlists

`channels.whatsapp.groups`、`channels.telegram.groups`、`channels.imessage.groups` を設定すると、そのキー自体がグループ allowlist として機能します。`"*"` を使えば、全グループを許可しつつ既定のメンション挙動も設定できます。

よくある設定例:

1. すべてのグループ返信を無効化する

```json5
{
  channels: { whatsapp: { groupPolicy: "disabled" } },
}
```

2. 特定のグループだけを許可する (WhatsApp)

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

3. すべてのグループを許可しつつ、メンション必須にする

```json5
{
  channels: {
    whatsapp: {
      groups: { "*": { requireMention: true } },
    },
  },
}
```

4. グループ内で起動できるのをオーナーだけにする (WhatsApp)

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

## Activation (owner-only)

グループオーナーは、グループごとの起動モードを切り替えられます。

- `/activation mention`
- `/activation always`

オーナーは `channels.whatsapp.allowFrom` によって決まります。未設定の場合は、ボット自身の E.164 が使われます。コマンドは単独メッセージとして送ってください。現在、他のサーフェスでは `/activation` は無視されます。

## Context fields

グループの受信ペイロードでは、次のフィールドが設定されます。

- `ChatType=group`
- `GroupSubject` (分かる場合)
- `GroupMembers` (分かる場合)
- `WasMentioned` (メンション制御の結果)
- Telegram のフォーラムトピックでは `MessageThreadId` と `IsForum` も含まれます。

新しいグループセッションの最初のターンでは、エージェントのシステムプロンプトにグループ用の導入文が追加されます。そこでは、人間らしく応答すること、Markdown テーブルを避けること、リテラルの `\n` をそのまま出力しないことなどが案内されます。

## iMessage specifics

- ルーティングや allowlist では `chat_id:<id>` を優先してください。
- チャット一覧は `imsg chats --limit 20` で確認できます。
- グループ返信は常に同じ `chat_id` へ返されます。

## WhatsApp specifics

WhatsApp 固有の挙動、たとえば履歴注入やメンション処理の詳細については [Group messages](/channels/group-messages) を参照してください。
