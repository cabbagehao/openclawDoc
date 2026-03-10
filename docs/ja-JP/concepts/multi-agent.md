---
summary: "マルチエージェントルーティング: 分離されたエージェント、チャネルアカウント、およびバインディング"
title: "マルチエージェントルーティング"
read_when: "You want multiple isolated agents (workspaces + auth) in one gateway process."
status: active
x-i18n:
  source_hash: "8e7b7cd0b54bc3856644cc6c42d8b8137e8b8fa2436792947e89a6cdbb1dc206"
---

# マルチエージェントルーティング

目標: 複数の*分離* エージェント (個別のワークスペース + `agentDir` + セッション)、および 1 つの実行中のゲートウェイ内での複数のチャネル アカウント (例: 2 つの WhatsApps)。受信はバインディングを介してエージェントにルーティングされます。

## 「ワンエージェント」とは何ですか?

**エージェント** は、独自の以下を備えた完全にスコープされた頭脳です。

- **ワークスペース** (ファイル、AGENTS.md/SOUL.md/USER.md、ローカルメモ、ペルソナルール)。
- 認証プロファイル、モデル レジストリ、およびエージェントごとの構成用の **状態ディレクトリ** (`agentDir`)。
- **セッション ストア** (チャット履歴 + ルーティング状態) (`~/.openclaw/agents/<agentId>/sessions`)。

認証プロファイルは**エージェントごと**です。各エージェントは独自のエージェントから次のものを読み取ります。

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

主要なエージェントの認証情報は自動的には共有されません\*\*。 `agentDir` を再利用しないでください。
エージェント間で実行されます (認証/セッションの衝突が発生します)。信条を共有したい場合は、
`auth-profiles.json` を他のエージェントの `agentDir` にコピーします。

スキルは各ワークスペースの `skills/` フォルダを介してエージェントごとに共有されます。
`~/.openclaw/skills` から入手可能です。 [スキル: エージェントごとと共有](/tools/skills#per-agent-vs-shared-skills) を参照してください。

ゲートウェイは、**1 つのエージェント** (デフォルト) または **多数のエージェント**を並列してホストできます。

**ワークスペースに関する注意:** 各エージェントのワークスペースは **デフォルトの cwd** であり、ハードウェアではありません
サンドボックス。相対パスはワークスペース内で解決されますが、絶対パスは解決できます。
サンドボックスが有効になっていない限り、他のホストの場所にアクセスできません。参照
[サンドボックス](/gateway/sandboxing)。

## パス (クイックマップ)- 構成: `~/.openclaw/openclaw.json` (または `OPENCLAW_CONFIG_PATH`)

- 状態ディレクトリ: `~/.openclaw` (または `OPENCLAW_STATE_DIR`)
- ワークスペース: `~/.openclaw/workspace` (または `~/.openclaw/workspace-<agentId>`)
- エージェント ディレクトリ: `~/.openclaw/agents/<agentId>/agent` (または `agents.list[].agentDir`)
- セッション: `~/.openclaw/agents/<agentId>/sessions`

### シングルエージェントモード (デフォルト)

何もしないと、OpenClaw は単一のエージェントを実行します。

- `agentId` のデフォルトは **`main`** です。
- セッションのキーは `agent:main:<mainKey>` です。
- ワークスペースのデフォルトは `~/.openclaw/workspace` (または `OPENCLAW_PROFILE` が設定されている場合は `~/.openclaw/workspace-<profile>`) です。
- 状態のデフォルトは `~/.openclaw/agents/main/agent` です。

## エージェントヘルパー

エージェント ウィザードを使用して、新しい分離エージェントを追加します。

```bash
openclaw agents add work
```

次に、受信メッセージをルーティングするために `bindings` を追加します (またはウィザードに実行させます)。

次の方法で確認します。

```bash
openclaw agents list --bindings
```

## クイックスタート

<Steps>
  <Step title="各エージェントのワークスペースを作成する">

ウィザードを使用するか、ワークスペースを手動で作成します。

```bash
openclaw agents add coding
openclaw agents add social
```

各エージェントは、`SOUL.md`、`AGENTS.md`、およびオプションの `USER.md` を含む独自のワークスペースに加えて、専用の `agentDir` と `~/.openclaw/agents/<agentId>` の下のセッション ストアを取得します。

  </Step>

  <Step title="チャンネルアカウントを作成する">

優先チャネルでエージェントごとに 1 つのアカウントを作成します。

- Discord: エージェントごとに 1 つのボット、メッセージ コンテンツ インテントを有効にし、各トークンをコピーします。
- テレグラム: BotFather 経由でエージェントごとに 1 つのボット、各トークンをコピーします。
- WhatsApp: アカウントごとに各電話番号をリンクします。

````bash
openclaw channels login --channel whatsapp --account work
```チャンネル ガイドを参照してください: [Discord](/channels/discord)、[Telegram](/channels/telegram)、[WhatsApp](/channels/whatsapp)。

  </Step>

  <Step title="エージェント、アカウント、バインディングを追加する">

エージェントを `agents.list` に追加し、チャネル アカウントを `channels.<channel>.accounts` に追加し、それらを `bindings` に接続します (以下の例)。

  </Step>

  <Step title="再起動して確認する">

```bash
openclaw gateway restart
openclaw agents list --bindings
openclaw channels status --probe
````

  </Step>
</Steps>

## 複数のエージェント = 複数の人物、複数の人格

**複数のエージェント**がある場合、各 `agentId` は **完全に分離されたペルソナ**になります。

- **異なる電話番号/アカウント** (チャネルごとに `accountId`)。
- **異なるパーソナリティ** (`AGENTS.md` や `SOUL.md` などのエージェントごとのワークスペース ファイル)。
- **個別の認証 + セッション** (明示的に有効にしない限り、クロストークはありません)。

これにより、**複数の人**が 1 つのゲートウェイ サーバーを共有しながら、AI の「頭脳」とデータを分離できるようになります。

## 1 つの WhatsApp 番号、複数人 (DM 分割)

**1 つの WhatsApp アカウント**を使用したまま、**異なる WhatsApp DM** を異なるエージェントにルーティングできます。送信者 E.164 (`+15551234567` など) と `peer.kind: "direct"` を照合します。応答は引き続き同じ WhatsApp 番号から送信されます (エージェントごとの送信者 ID はありません)。

重要な詳細: ダイレクト チャットはエージェントの **メイン セッション キー**に折りたたまれるため、真の分離には **1 人あたり 1 人のエージェント**が必要です。

例:

```json5
{
  agents: {
    list: [
      { id: "alex", workspace: "~/.openclaw/workspace-alex" },
      { id: "mia", workspace: "~/.openclaw/workspace-mia" },
    ],
  },
  bindings: [
    {
      agentId: "alex",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551230001" } },
    },
    {
      agentId: "mia",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551230002" } },
    },
  ],
  channels: {
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551230001", "+15551230002"],
    },
  },
}
```

注:- DM アクセス制御は、エージェントごとではなく、**WhatsApp アカウントごとにグローバル** (ペアリング/許可リスト) です。

- 共有グループの場合は、グループを 1 つのエージェントにバインドするか、[ブロードキャスト グループ](/channels/broadcast-groups) を使用します。

## ルーティング ルール (メッセージがエージェントを選択する方法)

バインディングは **決定的**であり、**最も具体的な勝利**です。

1. `peer` 一致 (正確な DM/グループ/チャネル ID)
2. `parentPeer` 一致 (スレッド継承)
3. `guildId + roles` (Discord ロール ルーティング)
4. `guildId` (不和)
5. `teamId` (スラック)
6. `accountId` チャネルの一致
7. チャネルレベルの一致 (`accountId: "*"`)
8. デフォルトのエージェントへのフォールバック (`agents.list[].default`、それ以外の場合は最初のリスト エントリ、デフォルト: `main`)

複数のバインディングが同じ層で一致する場合、構成順序の最初のバインディングが優先されます。
バインディングで複数の一致フィールドを設定する場合 (`peer` + `guildId` など)、指定されたフィールドはすべて必須です (`AND` セマンティクス)。

重要なアカウント範囲の詳細:

- `accountId` を省略したバインディングは、デフォルトのアカウントのみに一致します。
- すべてのアカウントにわたるチャネル全体のフォールバックには、`accountId: "*"` を使用します。
- 後で明示的なアカウント ID を使用して同じエージェントに同じバインディングを追加すると、OpenClaw は既存のチャネルのみのバインディングを複製する代わりにアカウント スコープにアップグレードします。

## 複数のアカウント/電話番号**複数のアカウント**をサポートするチャネル (例: WhatsApp) は、`accountId` を使用して識別します

各ログイン。各 `accountId` は異なるエージェントにルーティングできるため、1 つのサーバーでホストできる
セッションを混在させることなく複数の電話番号を利用できます。

`accountId` を省略したときにチャネル全体のデフォルト アカウントが必要な場合は、次のように設定します。
`channels.<channel>.defaultAccount` (オプション)。設定を解除すると、OpenClaw はフォールバックします
存在する場合は `default` に、それ以外の場合は最初に構成されたアカウント ID (ソート済み)。

このパターンをサポートする一般的なチャネルは次のとおりです。

- `whatsapp`、`telegram`、`discord`、`slack`、`signal`、`imessage`
- `irc`、`line`、`googlechat`、`mattermost`、`matrix`、`nextcloud-talk`
- `bluebubbles`、`zalo`、`zalouser`、`nostr`、`feishu`

## 概念

- `agentId`: 1 つの「ブレイン」 (ワークスペース、エージェントごとの認証、エージェントごとのセッション ストア)。
- `accountId`: 1 つのチャネル アカウント インスタンス (例: WhatsApp アカウント `"personal"` と `"biz"`)。
- `binding`: 受信メッセージを `(channel, accountId, peer)` およびオプションでギルド/チーム ID によって `agentId` にルーティングします。
- ダイレクト チャットは `agent:<agentId>:<mainKey>` (エージェントごとの「メイン」; `session.mainKey`) に折りたたまれます。

## プラットフォームの例

### エージェントごとの Discord ボットの数各 Discord ボット アカウントは、一意の `accountId` にマッピングされます。各アカウントをエージェントにバインドし、ボットごとに許可リストを保持します

```json5
{
  agents: {
    list: [
      { id: "main", workspace: "~/.openclaw/workspace-main" },
      { id: "coding", workspace: "~/.openclaw/workspace-coding" },
    ],
  },
  bindings: [
    { agentId: "main", match: { channel: "discord", accountId: "default" } },
    { agentId: "coding", match: { channel: "discord", accountId: "coding" } },
  ],
  channels: {
    discord: {
      groupPolicy: "allowlist",
      accounts: {
        default: {
          token: "DISCORD_BOT_TOKEN_MAIN",
          guilds: {
            "123456789012345678": {
              channels: {
                "222222222222222222": { allow: true, requireMention: false },
              },
            },
          },
        },
        coding: {
          token: "DISCORD_BOT_TOKEN_CODING",
          guilds: {
            "123456789012345678": {
              channels: {
                "333333333333333333": { allow: true, requireMention: false },
              },
            },
          },
        },
      },
    },
  },
}
```

注:

- 各ボットをギルドに招待し、メッセージ コンテンツ インテントを有効にします。
- トークンは `channels.discord.accounts.<id>.token` に存在します (デフォルトのアカウントは `DISCORD_BOT_TOKEN` を使用できます)。

### エージェントごとの Telegram ボット

```json5
{
  agents: {
    list: [
      { id: "main", workspace: "~/.openclaw/workspace-main" },
      { id: "alerts", workspace: "~/.openclaw/workspace-alerts" },
    ],
  },
  bindings: [
    { agentId: "main", match: { channel: "telegram", accountId: "default" } },
    { agentId: "alerts", match: { channel: "telegram", accountId: "alerts" } },
  ],
  channels: {
    telegram: {
      accounts: {
        default: {
          botToken: "123456:ABC...",
          dmPolicy: "pairing",
        },
        alerts: {
          botToken: "987654:XYZ...",
          dmPolicy: "allowlist",
          allowFrom: ["tg:123456789"],
        },
      },
    },
  },
}
```

注:

- BotFather を使用してエージェントごとに 1 つのボットを作成し、各トークンをコピーします。
- トークンは `channels.telegram.accounts.<id>.botToken` に存在します (デフォルトのアカウントは `TELEGRAM_BOT_TOKEN` を使用できます)。

### エージェントごとの WhatsApp 数

ゲートウェイを開始する前に、各アカウントをリンクします。

```bash
openclaw channels login --channel whatsapp --account personal
openclaw channels login --channel whatsapp --account biz
```

`~/.openclaw/openclaw.json` (JSON5):

```js
{
  agents: {
    list: [
      {
        id: "home",
        default: true,
        name: "Home",
        workspace: "~/.openclaw/workspace-home",
        agentDir: "~/.openclaw/agents/home/agent",
      },
      {
        id: "work",
        name: "Work",
        workspace: "~/.openclaw/workspace-work",
        agentDir: "~/.openclaw/agents/work/agent",
      },
    ],
  },

  // Deterministic routing: first match wins (most-specific first).
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },

    // Optional per-peer override (example: send a specific group to work agent).
    {
      agentId: "work",
      match: {
        channel: "whatsapp",
        accountId: "personal",
        peer: { kind: "group", id: "1203630...@g.us" },
      },
    },
  ],

  // Off by default: agent-to-agent messaging must be explicitly enabled + allowlisted.
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },

  channels: {
    whatsapp: {
      accounts: {
        personal: {
          // Optional override. Default: ~/.openclaw/credentials/whatsapp/personal
          // authDir: "~/.openclaw/credentials/whatsapp/personal",
        },
        biz: {
          // Optional override. Default: ~/.openclaw/credentials/whatsapp/biz
          // authDir: "~/.openclaw/credentials/whatsapp/biz",
        },
      },
    },
  },
}
```

## 例: WhatsApp の毎日のチャット + Telegram の詳細な作業

チャネルごとに分割: WhatsApp を日常の高速エージェントにルーティングし、Telegram を Opus エージェントにルーティングします。

```json5
{
  agents: {
    list: [
      {
        id: "chat",
        name: "Everyday",
        workspace: "~/.openclaw/workspace-chat",
        model: "anthropic/claude-sonnet-4-5",
      },
      {
        id: "opus",
        name: "Deep Work",
        workspace: "~/.openclaw/workspace-opus",
        model: "anthropic/claude-opus-4-6",
      },
    ],
  },
  bindings: [
    { agentId: "chat", match: { channel: "whatsapp" } },
    { agentId: "opus", match: { channel: "telegram" } },
  ],
}
```

注:

- チャネルに複数のアカウントがある場合は、バインディングに `accountId` を追加します (例: `{ channel: "whatsapp", accountId: "personal" }`)。
- 単一の DM/グループを Opus にルーティングし、残りをチャットに維持するには、そのピアに `match.peer` バインディングを追加します。ピアマッチは常にチャネル全体のルールよりも優先されます。

## 例: 同じチャネル、Opus に対して 1 つのピア

WhatsApp を高速エージェント上に保持しますが、1 つの DM を Opus にルーティングします。

```json5
{
  agents: {
    list: [
      {
        id: "chat",
        name: "Everyday",
        workspace: "~/.openclaw/workspace-chat",
        model: "anthropic/claude-sonnet-4-5",
      },
      {
        id: "opus",
        name: "Deep Work",
        workspace: "~/.openclaw/workspace-opus",
        model: "anthropic/claude-opus-4-6",
      },
    ],
  },
  bindings: [
    {
      agentId: "opus",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551234567" } },
    },
    { agentId: "chat", match: { channel: "whatsapp" } },
  ],
}
```

ピア バインディングは常に優先されるため、チャネル全体のルールよりも上位に保ってください。

## WhatsApp グループにバインドされたファミリー エージェント専任のファミリー エージェントを単一の WhatsApp グループにバインドし、メンション ゲーティングを行う

そしてより厳格なツールポリシー:

```json5
{
  agents: {
    list: [
      {
        id: "family",
        name: "Family",
        workspace: "~/.openclaw/workspace-family",
        identity: { name: "Family Bot" },
        groupChat: {
          mentionPatterns: ["@family", "@familybot", "@Family Bot"],
        },
        sandbox: {
          mode: "all",
          scope: "agent",
        },
        tools: {
          allow: [
            "exec",
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "browser", "canvas", "nodes", "cron"],
        },
      },
    ],
  },
  bindings: [
    {
      agentId: "family",
      match: {
        channel: "whatsapp",
        peer: { kind: "group", id: "120363999999999999@g.us" },
      },
    },
  ],
}
```

注:

- ツールの許可/拒否リストは **ツール** であり、スキルではありません。スキルで実行する必要がある場合は、
  バイナリの場合、`exec` が許可されていること、およびバイナリがサンドボックスに存在することを確認してください。
- ゲートをより厳密にするには、`agents.list[].groupChat.mentionPatterns` を設定し、そのままにしておきます。
  チャネルに対してグループ許可リストが有効になっています。

## エージェントごとのサンドボックスとツールの構成

v2026.1.6 以降、各エージェントは独自のサンドボックスとツールの制限を持つことができます。

```js
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: {
          mode: "off",  // No sandbox for personal agent
        },
        // No tool restrictions - all tools available
      },
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",     // Always sandboxed
          scope: "agent",  // One container per agent
          docker: {
            // Optional one-time setup after container creation
            setupCommand: "apt-get update && apt-get install -y git curl",
          },
        },
        tools: {
          allow: ["read"],                    // Only read tool
          deny: ["exec", "write", "edit", "apply_patch"],    // Deny others
        },
      },
    ],
  },
}
```

注: `setupCommand` は `sandbox.docker` の下に存在し、コンテナーの作成時に 1 回実行されます。
解決されたスコープが `"shared"` の場合、エージェントごとの `sandbox.docker.*` オーバーライドは無視されます。

**利点:**

- **セキュリティ分離**: 信頼できないエージェントのツールを制限します
- **リソース制御**: 他のエージェントをホスト上に維持しながら、特定のエージェントをサンドボックス化します。
- **柔軟なポリシー**: エージェントごとに異なる権限

注: `tools.elevated` は **グローバル** であり、送信者ベースです。エージェントごとに構成することはできません。
エージェントごとの境界が必要な場合は、`agents.list[].tools` を使用して `exec` を拒否します。
グループ ターゲティングの場合は、`agents.list[].groupChat.mentionPatterns` を使用して、@メンションが目的のエージェントに正確にマップされるようにします。

詳細な例については、[マルチエージェント サンドボックスとツール](/tools/multi-agent-sandbox-tools) を参照してください。
