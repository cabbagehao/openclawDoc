---
summary: "マルチエージェントルーティング: 分離されたエージェント、チャネルアカウント、およびバインディング"
title: "マルチエージェントルーティング"
read_when: "1つのゲートウェイプロセス内で、複数の分離されたエージェント（ワークスペース + 認証）を運用したい場合。"
status: active
x-i18n:
  source_hash: "8e7b7cd0b54bc3856644cc6c42d8b8137e8b8fa2436792947e89a6cdbb1dc206"
---
目標: 1つの実行中のゲートウェイ内で、複数の*分離された*エージェント（個別のワークスペース + `agentDir` + セッション）、および複数のチャネルアカウント（例: 2つの WhatsApp アカウント）を運用すること。受信メッセージはバインディングを介して適切なエージェントにルーティングされます。

## 「1つのエージェント」とは何を指しますか？

**エージェント**は、以下の要素を独自に持つ、完全にスコープ化された「頭脳」です。

- **ワークスペース** (ファイル、AGENTS.md/SOUL.md/USER.md、ローカルメモ、ペルソナルール)。
- **状態ディレクトリ** (`agentDir`): 認証プロファイル、モデルレジストリ、およびエージェントごとの構成を保持します。
- **セッションストア** (チャット履歴 + ルーティング状態): `~/.openclaw/agents/<agentId>/sessions` 配下に保存されます。

認証プロファイルは**エージェントごと**に管理されます。各エージェントは自身のディレクトリから読み取ります。

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

メインエージェントの認証情報は自動的には共有されません。エージェント間で `agentDir` を再利用しないでください（認証やセッションの衝突の原因となります）。認証情報を共有したい場合は、`auth-profiles.json` を別のエージェントの `agentDir` にコピーしてください。

スキルは各ワークスペースの `skills/` フォルダを介してエージェントごとに管理されます。また、`~/.openclaw/skills` から共有スキルを利用することも可能です。詳細は [スキル: エージェントごと vs 共有](/tools/skills#per-agent-vs-shared-skills) を参照してください。

ゲートウェイは、**1つのエージェント**（デフォルト）または**複数のエージェント**を並行してホストできます。

**ワークスペースに関する注意:** 各エージェントのワークスペースは**デフォルトの作業ディレクトリ (cwd)** であり、厳密なサンドボックスではありません。相対パスはワークスペース内で解決されますが、サンドボックスが有効でない限り、絶対パスを使用してホスト上の他の場所にアクセスできてしまいます。詳細は [サンドボックス](/gateway/sandboxing) を参照してください。

## パス (クイックマップ)

- 構成ファイル: `~/.openclaw/openclaw.json` (または `OPENCLAW_CONFIG_PATH`)
- 状態ディレクトリ: `~/.openclaw` (または `OPENCLAW_STATE_DIR`)
- ワークスペース: `~/.openclaw/workspace` (または `~/.openclaw/workspace-<agentId>`)
- エージェントディレクトリ: `~/.openclaw/agents/<agentId>/agent` (または `agents.list[].agentDir`)
- セッション: `~/.openclaw/agents/<agentId>/sessions`

### シングルエージェントモード (デフォルト)

特に設定を行わない場合、OpenClaw は単一のエージェントを実行します。

- `agentId` のデフォルトは **`main`** です。
- セッションキーは `agent:main:<mainKey>` の形式になります。
- ワークスペースのデフォルトは `~/.openclaw/workspace` です（`OPENCLAW_PROFILE` が設定されている場合は `~/.openclaw/workspace-<profile>`）。
- 状態のデフォルトは `~/.openclaw/agents/main/agent` です。

## エージェントヘルパー

エージェントウィザードを使用して、新しい分離されたエージェントを追加できます。

```bash
openclaw agents add work
```

その後、受信メッセージをルーティングするための `bindings` を追加します（ウィザードで自動設定することも可能です）。

以下のコマンドで確認できます。

```bash
openclaw agents list --bindings
```

## クイックスタート

<Steps>
  <Step title="各エージェントのワークスペースを作成する">

ウィザードを使用するか、手動でワークスペースを作成します。

```bash
openclaw agents add coding
openclaw agents add social
```

各エージェントは、`SOUL.md`、`AGENTS.md`、オプションの `USER.md` を含む独自のワークスペースと、`~/.openclaw/agents/<agentId>` 配下の専用の `agentDir` およびセッションストアを取得します。

  </Step>

  <Step title="チャネルアカウントを作成する">

利用したいチャネルで、エージェントごとにアカウントを作成します。

- Discord: エージェントごとに 1 つのボットを作成し、「Message Content Intent」を有効にして、それぞれのトークンをコピーします。
- Telegram: BotFather を使用してエージェントごとに 1 つのボットを作成し、それぞれのトークンをコピーします。
- WhatsApp: アカウントごとに電話番号をリンクします。

```bash
openclaw channels login --channel whatsapp --account work
```

詳細はチャネルガイドを参照してください: [Discord](/channels/discord)、[Telegram](/channels/telegram)、[WhatsApp](/channels/whatsapp)。

  </Step>

  <Step title="エージェント、アカウント、バインディングを追加する">

`agents.list` にエージェントを追加し、`channels.<channel>.accounts` にチャネルアカウントを追加して、それらを `bindings` で接続します（例は後述）。

  </Step>

  <Step title="再起動して確認する">

```bash
openclaw gateway restart
openclaw agents list --bindings
openclaw channels status --probe
```

  </Step>
</Steps>

## 複数のエージェント = 複数の人格、複数のキャラクター

**複数のエージェント**を運用する場合、各 `agentId` は**完全に独立したペルソナ**として機能します。

- **異なる電話番号/アカウント** (チャネルごとの `accountId`)。
- **異なるキャラクター** (`AGENTS.md` や `SOUL.md` などのエージェントごとのワークスペースファイルによる設定)。
- **個別の認証とセッション** (明示的に有効にしない限り、データが混ざることはありません)。

これにより、**複数のユーザー**が 1 つのゲートウェイサーバーを共有しながら、それぞれの AI の「頭脳」とデータを分離して保持できます。

## 1 つの WhatsApp 番号で、複数人を相手にする (DM 分割)

**1 つの WhatsApp アカウント**を使用しながら、**異なる相手からの DM** をそれぞれ別々のエージェントにルーティングできます。送信者の E.164 番号（例: `+15551234567`）と `peer.kind: "direct"` で判定します。返信はすべて同じ WhatsApp 番号から送信されます（エージェントごとの送信者 ID は持てません）。

重要な詳細: ダイレクトチャットはエージェントの**メインセッションキー**に集約されるため、真の分離を実現するには**1人につき1つのエージェント**を割り当てる必要があります。

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

注:

- DM のアクセス制御は、エージェントごとではなく、**WhatsApp アカウント単位でグローバル**に適用されます（ペアリング/許可リスト）。
- 共有グループの場合は、グループを特定のエージェントにバインドするか、[ブロードキャストグループ](/channels/broadcast-groups) を使用してください。

## ルーティングルール (メッセージがどのエージェントに送られるか)

バインディングは**確定的**であり、**最も条件が限定されているもの（具体的なもの）が優先**されます。

1. `peer` の一致 (特定の DM/グループ/チャネル ID)
2. `parentPeer` の一致 (スレッドの継承)
3. `guildId + roles` (Discord のロールによるルーティング)
4. `guildId` (Discord)
5. `teamId` (Slack)
6. `accountId` によるチャネルの一致
7. チャネルレベルの一致 (`accountId: "*"`)
8. デフォルトエージェントへのフォールバック (`agents.list[].default`、設定がない場合はリストの最初のエントリ、デフォルトは `main`)

複数のバインディングが同じ優先度で一致した場合は、設定ファイル内で先に記述されているものが優先されます。1つのバインディングに複数の条件（例: `peer` + `guildId`）を設定した場合、それらすべての条件を満たす必要があります（AND 条件）。

アカウントスコープに関する重要な詳細:

- `accountId` を省略したバインディングは、デフォルトのアカウントのみに一致します。
- すべてのアカウントにわたるチャネル全体のフォールバック設定には、`accountId: "*"` を使用します。
- 後で同じエージェントに対して特定のアカウント ID を指定したバインディングを追加すると、OpenClaw は既存のチャネルのみのバインディングを重複させるのではなく、アカウントスコープの設定にアップグレードします。

## 複数のアカウント / 電話番号

WhatsApp のように**複数のアカウント**をサポートするチャネルでは、`accountId` を使用して各ログインを識別します。各 `accountId` を異なるエージェントにルーティングできるため、1つのサーバーでセッションを混合させることなく、複数の電話番号をホストできます。

`accountId` が省略された場合にチャネル全体のデフォルトアカウントを使用したい場合は、`channels.<channel>.defaultAccount` を設定します（オプション）。設定されていない場合、OpenClaw は `default` アカウントがあればそれを、なければ最初に構成されたアカウント ID（ソート順）を使用します。

このパターンをサポートする主なチャネルは以下の通りです。

- `whatsapp`、`telegram`、`discord`、`slack`、`signal`、`imessage`
- `irc`、`line`、`googlechat`、`mattermost`、`matrix`、`nextcloud-talk`
- `bluebubbles`、`zalo`、`zalouser`、`nostr`、`feishu`

## コンセプト

- `agentId`: 1つの「頭脳」 (ワークスペース、エージェントごとの認証、エージェントごとのセッションストア)。
- `accountId`: チャネルアカウントの 1 つのインスタンス (例: WhatsApp アカウントの `"personal"` と `"biz"`)。
- `binding`: 受信メッセージを `(channel, accountId, peer)` およびオプションでギルド/チーム ID に基づいて特定の `agentId` にルーティングします。
- ダイレクトチャットは `agent:<agentId>:<mainKey>` に集約されます。

## プラットフォーム別の例

### エージェントごとの Discord ボット

各 Discord ボットアカウントは、一意の `accountId` にマッピングされます。各アカウントをエージェントにバインドし、ボットごとに許可リストを管理します。

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

- 各ボットをサーバー（ギルド）に招待し、「Message Content Intent」を有効にしてください。
- トークンは `channels.discord.accounts.<id>.token` に設定します（デフォルトアカウントでは `DISCORD_BOT_TOKEN` 環境変数も使用可能です）。

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

- BotFather を使用してエージェントごとにボットを作成し、トークンをコピーしてください。
- トークンは `channels.telegram.accounts.<id>.botToken` に設定します（デフォルトアカウントでは `TELEGRAM_BOT_TOKEN` 環境変数も使用可能です）。

### エージェントごとの WhatsApp 番号

ゲートウェイを起動する前に、各アカウントをリンクしておきます。

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

  // 確定的なルーティング: 最初に一致したものが優先されます。
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },

    // 特定の相手（グループなど）を別のエージェントに送る例
    {
      agentId: "work",
      match: {
        channel: "whatsapp",
        accountId: "personal",
        peer: { kind: "group", id: "1203630...@g.us" },
      },
    },
  ],

  // デフォルトではオフ: エージェント間のメッセージ送信は明示的な有効化と許可が必要です。
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
          // オプションのオーバーライド。デフォルト: ~/.openclaw/credentials/whatsapp/personal
          // authDir: "~/.openclaw/credentials/whatsapp/personal",
        },
        biz: {
          // オプションのオーバーライド。デフォルト: ~/.openclaw/credentials/whatsapp/biz
          // authDir: "~/.openclaw/credentials/whatsapp/biz",
        },
      },
    },
  },
}
```

## 例: WhatsApp は日常用 + Telegram は集中作業用

チャネルごとに分割する例: WhatsApp は日常的な高速エージェントに、Telegram は Opus エージェントにルーティングします。

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

- 同一チャネルで複数のアカウントがある場合は、バインディングに `accountId` を追加してください。
- 特定の DM/グループだけを Opus に送り、残りを通常チャットに維持したい場合は、その相手に対して `match.peer` バインディングを追加してください。ピア一致は常にチャネル全体のルールよりも優先されます。

## 例: 同一チャネルで、特定の相手だけ Opus に送る

WhatsApp は高速エージェントを使用しつつ、特定の 1 人からの DM だけを Opus に送る設定です。

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

ピアバインディングが常に優先されるよう、チャネル全体のルールよりも上に記述してください。

## WhatsApp グループに紐付けられたファミリーエージェント

特定の WhatsApp グループに専用のファミリーエージェントを割り当て、メンションによる制限と厳格なツールポリシーを適用する例です。

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

- ツールの許可/拒否リストは**ツール**の設定であり、スキルの設定ではありません。スキルがバイナリを実行する必要がある場合は、`exec` が許可されており、かつバイナリがサンドボックス内に存在することを確認してください。
- ゲートをより厳密にするには、`agents.list[].groupChat.mentionPatterns` を設定し、そのチャネルのグループ許可リストを有効にしておきます。

## エージェントごとのサンドボックスとツールの設定

v2026.1.6 以降、各エージェントは独自のサンドボックス設定とツールの制限を持つことができます。

```js
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: {
          mode: "off",  // パーソナルエージェントはサンドボックスなし
        },
        // ツール制限なし - すべてのツールを利用可能
      },
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",     // 常にサンドボックス化
          scope: "agent",  // エージェントごとに 1 つのコンテナ
          docker: {
            // コンテナ作成時のオプション設定
            setupCommand: "apt-get update && apt-get install -y git curl",
          },
        },
        tools: {
          allow: ["read"],                    // 読み取りツールのみ許可
          deny: ["exec", "write", "edit", "apply_patch"],    // その他を拒否
        },
      },
    ],
  },
}
```

注: `setupCommand` は `sandbox.docker` 配下に記述し、コンテナ作成時に 1 回だけ実行されます。解決されたスコープが `"shared"` の場合、エージェントごとの `sandbox.docker.*` のオーバーライドは無視されます。

**メリット:**

- **セキュリティの分離**: 信頼できないエージェントのツールを制限できます。
- **リソース管理**: 特定のエージェントだけをサンドボックス化し、他はホスト上で実行できます。
- **柔軟なポリシー**: エージェントごとに異なる権限を設定できます。

注: `tools.elevated` は**グローバル**かつ送信者ベースの設定であり、エージェントごとに構成することはできません。エージェントごとの境界を設けたい場合は、`agents.list[].tools` を使用して `exec` を拒否してください。グループ内でのターゲット指定には、`agents.list[].groupChat.mentionPatterns` を使用し、@メンションが目的のエージェントに正しくマッピングされるようにします。

詳細は [マルチエージェントサンドボックス & ツール](/tools/multi-agent-sandbox-tools) を参照してください。
