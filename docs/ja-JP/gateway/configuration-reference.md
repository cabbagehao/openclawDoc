---
title: "構成リファレンス"
description: "Complete field-by-field reference for ~/.openclaw/openclaw.json"
summary: "すべての OpenClaw 構成キー、デフォルト、およびチャネル設定の完全なリファレンス"
read_when:
  - 正確なフィールドレベルの設定セマンティクスまたはデフォルトが必要です
  - チャネル、モデル、ゲートウェイ、またはツール構成ブロックを検証しています
x-i18n:
  source_hash: "318b2ef4b8a06e532d46ff62de58de6bcfeae469af9765d0832a74b9a187b0a7"
---

# 構成リファレンス

`~/.openclaw/openclaw.json` で使用可能なすべてのフィールド。タスク指向の概要については、「[構成](/gateway/configuration)」を参照してください。

構成形式は **JSON5** (コメント + 末尾のカンマは許可されます) です。すべてのフィールドはオプションです。省略された場合、OpenClaw は安全なデフォルトを使用します。

---

## チャンネル

各チャネルは、その構成セクションが存在すると自動的に開始されます (`enabled: false` を除く)。

### DMとグループアクセス

すべてのチャネルは DM ポリシーとグループ ポリシーをサポートします。

| DMポリシー               | 行動                                                                                   |
| ------------------------ | -------------------------------------------------------------------------------------- | --- | ---------------- | ---- |
| `pairing` (デフォルト)   | 不明な送信者はワンタイムペアリングコードを受け取ります。所有者は承認する必要があります |
| `allowlist`              | `allowFrom` (またはペアの許可ストア) の送信者のみ                                      |
| `open`                   | すべての受信 DM を許可する (`allowFrom: ["*"]` が必要)                                 |
| `disabled`               | すべての受信 DM を無視する                                                             |     | グループポリシー | 行動 |
| ---------------------    | --------------------------------------------------------                               |
| `allowlist` (デフォルト) | 設定された許可リストに一致するグループのみ                                             |
| `open`                   | グループ許可リストをバイパスします (メンションゲートは引き続き適用されます)。          |
| `disabled`               | すべてのグループ/ルーム メッセージをブロックする                                       |

<Note>
`channels.defaults.groupPolicy` は、プロバイダーの `groupPolicy` が設定されていない場合のデフォルトを設定します。
ペアリング コードは 1 時間後に期限切れになります。保留中の DM ペアリング要求の上限は、**チャネルあたり 3** です。
プロバイダー ブロックが完全に欠落している (`channels.<provider>` が欠落している) 場合、ランタイム グループ ポリシーは起動警告とともに `allowlist` (フェールクローズ) にフォールバックします。
</Note>

### チャネルモデルのオーバーライド

`channels.modelByChannel` を使用して、特定のチャネル ID をモデルに固定します。値は `provider/model` または構成されたモデルのエイリアスを受け入れます。チャネル マッピングは、セッションにモデル オーバーライドがまだない場合 (たとえば、`/model` によって設定されている場合) に適用されます。

```json5
{
  channels: {
    modelByChannel: {
      discord: {
        "123456789012345678": "anthropic/claude-opus-4-6",
      },
      slack: {
        C1234567890: "openai/gpt-4.1",
      },
      telegram: {
        "-1001234567890": "openai/gpt-4.1-mini",
        "-1001234567890:topic:99": "anthropic/claude-sonnet-4-6",
      },
    },
  },
}
```

### チャネルのデフォルトとハートビート

プロバイダー間で共有されるグループ ポリシーとハートビートの動作には、`channels.defaults` を使用します。

````json5
{
  channels: {
    defaults: {
      groupPolicy: "allowlist", // open | allowlist | disabled
      heartbeat: {
        showOk: false,
        showAlerts: true,
        useIndicator: true,
      },
    },
  },
}
```- `channels.defaults.groupPolicy`: プロバイダーレベルの `groupPolicy` が設定されていない場合のフォールバック グループ ポリシー。
- `channels.defaults.heartbeat.showOk`: ハートビート出力に正常なチャネルのステータスを含めます。
- `channels.defaults.heartbeat.showAlerts`: ハートビート出力に劣化/エラーステータスを含めます。
- `channels.defaults.heartbeat.useIndicator`: コンパクトなインジケーター スタイルのハートビート出力をレンダリングします。

### WhatsApp

WhatsApp は、ゲートウェイの Web チャネル (Baileys Web) を通じて実行されます。リンクされたセッションが存在する場合、自動的に開始されます。

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      chunkMode: "length", // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // blue ticks (false in self-chat mode)
      groups: {
        "*": { requireMention: true },
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
  web: {
    enabled: true,
    heartbeatSeconds: 60,
    reconnect: {
      initialMs: 2000,
      maxMs: 120000,
      factor: 1.4,
      jitter: 0.2,
      maxAttempts: 0,
    },
  },
}
````

<Accordion title="マルチアカウント WhatsApp">

```json5
{
  channels: {
    whatsapp: {
      accounts: {
        default: {},
        personal: {},
        biz: {
          // authDir: "~/.openclaw/credentials/whatsapp/biz",
        },
      },
    },
  },
}
```

- アウトバウンド コマンドは、デフォルトでアカウント `default` が存在する場合に使用されます。それ以外の場合は、最初に設定されたアカウント ID (ソート済み)。
- オプションの `channels.whatsapp.defaultAccount` は、構成されたアカウント ID と一致する場合にフォールバックのデフォルトのアカウント選択をオーバーライドします。
- 従来の単一アカウントの Baileys 認証ディレクトリは、`openclaw doctor` によって `whatsapp/default` に移行されます。
- アカウントごとの上書き: `channels.whatsapp.accounts.<id>.sendReadReceipts`、`channels.whatsapp.accounts.<id>.dmPolicy`、`channels.whatsapp.accounts.<id>.allowFrom`。

</Accordion>

### 電報

````json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "your-bot-token",
      dmPolicy: "pairing",
      allowFrom: ["tg:123456789"],
      groups: {
        "*": { requireMention: true },
        "-1001234567890": {
          allowFrom: ["@admin"],
          systemPrompt: "Keep answers brief.",
          topics: {
            "99": {
              requireMention: false,
              skills: ["search"],
              systemPrompt: "Stay on topic.",
            },
          },
        },
      },
      customCommands: [
        { command: "backup", description: "Git backup" },
        { command: "generate", description: "Create an image" },
      ],
      historyLimit: 50,
      replyToMode: "first", // off | first | all
      linkPreview: true,
      streaming: "partial", // off | partial | block | progress (default: off)
      actions: { reactions: true, sendMessage: true },
      reactionNotifications: "own", // off | own | all
      mediaMaxMb: 100,
      retry: {
        attempts: 3,
        minDelayMs: 400,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
      network: {
        autoSelectFamily: true,
        dnsResultOrder: "ipv4first",
      },
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook",
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook",
    },
  },
}
```- ボット トークン: `channels.telegram.botToken` または `channels.telegram.tokenFile`、`TELEGRAM_BOT_TOKEN` はデフォルト アカウントのフォールバックとして使用されます。
- オプションの `channels.telegram.defaultAccount` は、構成されたアカウント ID と一致する場合、デフォルトのアカウント選択をオーバーライドします。
- マルチアカウント設定 (2 つ以上のアカウント ID) では、明示的なデフォルト (`channels.telegram.defaultAccount` または `channels.telegram.accounts.default`) を設定して、フォールバック ルーティングを回避します。 `openclaw doctor` は、これが欠落しているか無効な場合に警告します。
- `configWrites: false` は、Telegram が開始する設定の書き込みをブロックします (スーパーグループ ID の移行、`/config set|unset`)。
- `type: "acp"` を含むトップレベルの `bindings[]` エントリは、フォーラム トピックの永続的な ACP バインディングを構成します (`match.peer.id` の正規の `chatId:topic:topicId` を使用します)。フィールド セマンティクスは [ACP エージェント](/tools/acp-agents#channel-specific-settings) で共有されます。
- Telegram ストリーム プレビューは `sendMessage` + `editMessageText` を使用します (ダイレクト チャットおよびグループ チャットで機能します)。
- 再試行ポリシー: [再試行ポリシー](/concepts/retry) を参照してください。

### 不和

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: "your-bot-token",
      mediaMaxMb: 8,
      allowBots: false,
      actions: {
        reactions: true,
        stickers: true,
        polls: true,
        permissions: true,
        messages: true,
        threads: true,
        pins: true,
        search: true,
        memberInfo: true,
        roleInfo: true,
        roles: false,
        channelInfo: true,
        voiceStatus: true,
        events: true,
        moderation: false,
      },
      replyToMode: "off", // off | first | all
      dmPolicy: "pairing",
      allowFrom: ["1234567890", "123456789012345678"],
      dm: { enabled: true, groupEnabled: false, groupChannels: ["openclaw-dm"] },
      guilds: {
        "123456789012345678": {
          slug: "friends-of-openclaw",
          requireMention: false,
          ignoreOtherMentions: true,
          reactionNotifications: "own",
          users: ["987654321098765432"],
          channels: {
            general: { allow: true },
            help: {
              allow: true,
              requireMention: true,
              users: ["987654321098765432"],
              skills: ["docs"],
              systemPrompt: "Short answers only.",
            },
          },
        },
      },
      historyLimit: 20,
      textChunkLimit: 2000,
      chunkMode: "length", // length | newline
      streaming: "off", // off | partial | block | progress (progress maps to partial on Discord)
      maxLinesPerMessage: 17,
      ui: {
        components: {
          accentColor: "#5865F2",
        },
      },
      threadBindings: {
        enabled: true,
        idleHours: 24,
        maxAgeHours: 0,
        spawnSubagentSessions: false, // opt-in for sessions_spawn({ thread: true })
      },
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
      retry: {
        attempts: 3,
        minDelayMs: 500,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
  },
}
```- トークン: `channels.discord.token`、デフォルト アカウントのフォールバックとして `DISCORD_BOT_TOKEN`。
- オプションの `channels.discord.defaultAccount` は、設定されたアカウント ID と一致する場合、デフォルトのアカウント選択をオーバーライドします。
- 配信ターゲットには `user:<id>` (DM) または `channel:<id>` (ギルド チャネル) を使用します。裸の数値 ID は拒否されます。
- ギルド スラッグは小文字でスペースが `-` に置き換えられます。チャンネルキーはスラッグ名 (`#` ではありません) を使用します。ギルドIDを優先します。
- ボットが作成したメッセージはデフォルトでは無視されます。 `allowBots: true` はそれらを有効にします。 `allowBots: "mentions"` を使用して、ボットに言及するボット メッセージのみを受け入れます (独自のメッセージはまだフィルターされています)。
- `channels.discord.guilds.<id>.ignoreOtherMentions` (およびチャネル オーバーライド) は、別のユーザーまたはロールに言及するメッセージを削除しますが、ボットには言及しません (@everyone/@here を除く)。
- `maxLinesPerMessage` (デフォルトは 17) は、2000 文字未満の場合でも長いメッセージを分割します。
- `channels.discord.threadBindings` は、Discord のスレッドバインドされたルーティングを制御します。
  - `enabled`: スレッドバインドされたセッション機能の Discord オーバーライド (`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`、バインド配信/ルーティング)
  - `idleHours`: 非アクティブ状態が数時間で自動フォーカス解除されるための Discord オーバーライド (`0` は無効になります)
  - `maxAgeHours`: 時間単位のハードマックス年齢の Discord オーバーライド (`0` は無効になります)
  - `spawnSubagentSessions`: `sessions_spawn({ thread: true })` 自動スレッド作成/バインドのオプトイン スイッチ- `type: "acp"` を含むトップレベルの `bindings[]` エントリは、チャネルとスレッドの永続的な ACP バインディングを構成します (`match.peer.id` のチャネル/スレッド ID を使用します)。フィールド セマンティクスは [ACP エージェント](/tools/acp-agents#channel-specific-settings) で共有されます。
- `channels.discord.ui.components.accentColor` は、Discord コンポーネント v2 コンテナのアクセント カラーを設定します。
- `channels.discord.voice` は、Discord 音声チャネル会話とオプションの自動参加 + TTS オーバーライドを有効にします。
- `channels.discord.voice.daveEncryption` および `channels.discord.voice.decryptionFailureTolerance` は `@discordjs/voice` DAVE オプションに渡されます (デフォルトでは `true` および `24`)。
- OpenClaw はさらに、繰り返し復号化に失敗した後、音声セッションから離脱/再参加することで音声受信の回復を試みます。
- `channels.discord.streaming` は正規ストリーム モード キーです。従来の `streamMode` およびブール値 `streaming` 値は自動移行されます。
- `channels.discord.autoPresence` は、実行時の可用性をボットの存在にマップし (正常 => オンライン、劣化 => アイドル、消耗 => 停止)、オプションでステータス テキストの上書きを許可します。
- `channels.discord.dangerouslyAllowNameMatching` は、変更可能な名前/タグの一致を再度有効にします (ブレークグラス互換モード)。

**反応通知モード:** `off` (なし)、`own` (ボットのメッセージ、デフォルト)、`all` (すべてのメッセージ)、`allowlist` (すべてのメッセージの `guilds.<id>.users` から)。

### Google チャット

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      audienceType: "app-url", // app-url | project-number
      audience: "https://gateway.example.com/googlechat",
      webhookPath: "/googlechat",
      botUser: "users/1234567890",
      dm: {
        enabled: true,
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": { allow: true, requireMention: true },
      },
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```- サービス アカウント JSON: インライン (`serviceAccount`) またはファイルベース (`serviceAccountFile`)。
- サービス アカウント SecretRef もサポートされています (`serviceAccountRef`)。
- 環境フォールバック: `GOOGLE_CHAT_SERVICE_ACCOUNT` または `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`。
- 配信ターゲットには `spaces/<spaceId>` または `users/<userId>` を使用します。
- `channels.googlechat.dangerouslyAllowNameMatching` は、変更可能な電子メール プリンシパルの一致を再度有効にします (ブレークグラス互換モード)。

### スラック

```json5
{
  channels: {
    slack: {
      enabled: true,
      botToken: "xoxb-...",
      appToken: "xapp-...",
      dmPolicy: "pairing",
      allowFrom: ["U123", "U456", "*"],
      dm: { enabled: true, groupEnabled: false, groupChannels: ["G123"] },
      channels: {
        C123: { allow: true, requireMention: true, allowBots: false },
        "#general": {
          allow: true,
          requireMention: true,
          allowBots: false,
          users: ["U123"],
          skills: ["docs"],
          systemPrompt: "Short answers only.",
        },
      },
      historyLimit: 50,
      allowBots: false,
      reactionNotifications: "own",
      reactionAllowlist: ["U123"],
      replyToMode: "off", // off | first | all
      thread: {
        historyScope: "thread", // thread | channel
        inheritParent: false,
      },
      actions: {
        reactions: true,
        messages: true,
        pins: true,
        memberInfo: true,
        emojiList: true,
      },
      slashCommand: {
        enabled: true,
        name: "openclaw",
        sessionPrefix: "slack:slash",
        ephemeral: true,
      },
      typingReaction: "hourglass_flowing_sand",
      textChunkLimit: 4000,
      chunkMode: "length",
      streaming: "partial", // off | partial | block | progress (preview mode)
      nativeStreaming: true, // use Slack native streaming API when streaming=partial
      mediaMaxMb: 20,
    },
  },
}
````

- **ソケット モード**には、`botToken` と `appToken` の両方が必要です (デフォルトのアカウント環境フォールバックの場合は `SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN`)。
- **HTTP モード** には、`botToken` と `signingSecret` (ルートまたはアカウントごと) が必要です。
- `configWrites: false` は、Slack によって開始される設定の書き込みをブロックします。
- オプションの `channels.slack.defaultAccount` は、設定されたアカウント ID と一致する場合、デフォルトのアカウント選択をオーバーライドします。
- `channels.slack.streaming` は正規ストリーム モード キーです。従来の `streamMode` 値とブール値 `streaming` 値は自動移行されます。
- 配信ターゲットには `user:<id>` (DM) または `channel:<id>` を使用します。

**反応通知モード:** `off`、`own` (デフォルト)、`all`、`allowlist` (`reactionAllowlist` から)。

**スレッド セッションの分離:** `thread.historyScope` はスレッドごと (デフォルト)、またはチャネル全体で共有されます。 `thread.inheritParent` は、親チャネルのトランスクリプトを新しいスレッドにコピーします。- `typingReaction` は、返信の実行中に受信 Slack メッセージに一時的な反応を追加し、完了時に削除します。 `"hourglass_flowing_sand"` などの Slack 絵文字ショートコードを使用します。

| アクショングループ | デフォルト | メモ                    |
| ------------------ | ---------- | ----------------------- |
| 反応               | 有効       | 反応 + 反応のリスト     |
| メッセージ         | 有効       | 読み取り/送信/編集/削除 |
| ピン               | 有効       | 固定/固定解除/リスト    |
| メンバー情報       | 有効       | 会員情報                |
| 絵文字リスト       | 有効       | カスタム絵文字リスト    |

### 最も重要なこと

Mattermost はプラグインとして出荷されます: `openclaw plugins install @openclaw/mattermost`。

```json5
{
  channels: {
    mattermost: {
      enabled: true,
      botToken: "mm-token",
      baseUrl: "https://chat.example.com",
      dmPolicy: "pairing",
      chatmode: "oncall", // oncall | onmessage | onchar
      oncharPrefixes: [">", "!"],
      commands: {
        native: true, // opt-in
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Optional explicit URL for reverse-proxy/public deployments
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

チャット モード: `oncall` (@ メンションで応答、デフォルト)、`onmessage` (すべてのメッセージ)、`onchar` (トリガー プレフィックスで始まるメッセージ)。

Mattermost ネイティブ コマンドが有効な場合:- `commands.callbackPath` は、完全な URL ではなく、パス (`/api/channels/mattermost/command` など) である必要があります。

- `commands.callbackUrl` は OpenClaw ゲートウェイ エンドポイントに解決され、Mattermost サーバーから到達可能である必要があります。
- プライベート/テールネット/内部コールバック ホストの場合、Mattermost は必要な場合があります
  `ServiceSettings.AllowedUntrustedInternalConnections` には、コールバック ホスト/ドメインが含まれます。
  完全な URL ではなく、ホスト/ドメインの値を使用します。
- `channels.mattermost.configWrites`: Mattermost が開始する構成書き込みを許可または拒否します。
- `channels.mattermost.requireMention`: チャネルで返信する前に `@mention` が必要です。
- オプションの `channels.mattermost.defaultAccount` は、構成されたアカウント ID と一致する場合、デフォルトのアカウント選択をオーバーライドします。

### 信号

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // optional account binding
      dmPolicy: "pairing",
      allowFrom: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      configWrites: true,
      reactionNotifications: "own", // off | own | all | allowlist
      reactionAllowlist: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      historyLimit: 50,
    },
  },
}
```

**反応通知モード:** `off`、`own` (デフォルト)、`all`、`allowlist` (`reactionAllowlist` から)。

- `channels.signal.account`: チャネルの起動を特定の Signal アカウント ID に固定します。
- `channels.signal.configWrites`: Signal によって開始される構成書き込みを許可または拒否します。
- オプションの `channels.signal.defaultAccount` は、設定されたアカウント ID と一致する場合、デフォルトのアカウント選択をオーバーライドします。

### ブルーバブルズ

BlueBubbles が推奨される iMessage パスです (プラグインベース、`channels.bluebubbles` で構成)。

````json5
{
  channels: {
    bluebubbles: {
      enabled: true,
      dmPolicy: "pairing",
      // serverUrl, password, webhookPath, group controls, and advanced actions:
      // see /channels/bluebubbles
    },
  },
}
```- ここで取り上げるコアキーのパス: `channels.bluebubbles`、`channels.bluebubbles.dmPolicy`。
- オプションの `channels.bluebubbles.defaultAccount` は、構成されたアカウント ID と一致する場合、デフォルトのアカウント選択をオーバーライドします。
- 完全な BlueBubbles チャネル構成は [BlueBubbles](/channels/bluebubbles) に文書化されています。

### iメッセージ

OpenClaw は `imsg rpc` (標準入出力上の JSON-RPC) を生成します。デーモンやポートは必要ありません。

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "imsg",
      dbPath: "~/Library/Messages/chat.db",
      remoteHost: "user@gateway-host",
      dmPolicy: "pairing",
      allowFrom: ["+15555550123", "user@example.com", "chat_id:123"],
      historyLimit: 50,
      includeAttachments: false,
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      mediaMaxMb: 16,
      service: "auto",
      region: "US",
    },
  },
}
````

- オプションの `channels.imessage.defaultAccount` は、設定されたアカウント ID と一致する場合、デフォルトのアカウント選択をオーバーライドします。

- メッセージ DB へのフルディスク アクセスが必要です。
- `chat_id:<id>` ターゲットを優先します。チャットを一覧表示するには、`imsg chats --limit 20` を使用します。
- `cliPath` は SSH ラッパーを指すことができます。 SCP 添付ファイルを取得するために `remoteHost` (`host` または `user@host`) を設定します。
- `attachmentRoots` および `remoteAttachmentRoots` は、受信添付ファイル パスを制限します (デフォルト: `/Users/*/Library/Messages/Attachments`)。
- SCP は厳密なホスト キー チェックを使用するため、リレー ホスト キーが `~/.ssh/known_hosts` にすでに存在していることを確認してください。
- `channels.imessage.configWrites`: iMessage によって開始される設定の書き込みを許可または拒否します。

<Accordion title="iMessage SSH ラッパーの例">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Microsoft Teams

Microsoft Teams は拡張機能をサポートしており、`channels.msteams` で構成されています。

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, team/channel policies:
      // see /channels/msteams
    },
  },
}
```

- ここで取り上げるコアキーのパス: `channels.msteams`、`channels.msteams.configWrites`。
- 完全な Teams 構成 (資格情報、Webhook、DM/グループ ポリシー、チームごと/チャネルごとのオーバーライド) は、[Microsoft Teams](/channels/msteams) に文書化されています。### IRC

IRC は拡張機能をサポートしており、`channels.irc` で構成されています。

```json5
{
  channels: {
    irc: {
      enabled: true,
      dmPolicy: "pairing",
      configWrites: true,
      nickserv: {
        enabled: true,
        service: "NickServ",
        password: "${IRC_NICKSERV_PASSWORD}",
        register: false,
        registerEmail: "bot@example.com",
      },
    },
  },
}
```

- ここで説明するコアキーのパス: `channels.irc`、`channels.irc.dmPolicy`、`channels.irc.configWrites`、`channels.irc.nickserv.*`。
- オプションの `channels.irc.defaultAccount` は、構成されたアカウント ID と一致する場合、デフォルトのアカウント選択をオーバーライドします。
- 完全な IRC チャネル設定 (ホスト/ポート/TLS/チャネル/許可リスト/メンション ゲーティング) は [IRC](/channels/irc) に文書化されています。

### マルチアカウント (すべてのチャネル)

チャネルごとに複数のアカウントを実行します (それぞれに独自の `accountId` があります)。

````json5
{
  channels: {
    telegram: {
      accounts: {
        default: {
          name: "Primary bot",
          botToken: "123456:ABC...",
        },
        alerts: {
          name: "Alerts bot",
          botToken: "987654:XYZ...",
        },
      },
    },
  },
}
```- `default` は、`accountId` が省略された場合に使用されます (CLI + ルーティング)。
- 環境トークンは **デフォルト** アカウントにのみ適用されます。
- 基本チャネル設定は、アカウントごとに上書きされない限り、すべてのアカウントに適用されます。
- `bindings[].match.accountId` を使用して、各アカウントを別のエージェントにルーティングします。
- 単一アカウントのトップレベルのチャネル設定を使用しているときに、`openclaw channels add` (またはチャネルのオンボーディング) 経由でデフォルト以外のアカウントを追加すると、OpenClaw は最初にアカウントスコープのトップレベルの単一アカウントの値を `channels.<channel>.accounts.default` に移動し、元のアカウントが機能し続けるようにします。
- 既存のチャネルのみのバインディング (`accountId` なし) はデフォルトのアカウントと一致し続けます。アカウント スコープのバインディングはオプションのままです。
- `openclaw doctor --fix` は、名前付きアカウントが存在するが `default` が欠落している場合、アカウントをスコープとする最上位の単一アカウントの値を `accounts.default` に移動することにより、混合シェイプも修復します。

### その他の拡張チャネル

多くの拡張チャネルは `channels.<id>` として構成され、専用チャネル ページ (Feishu、Matrix、LINE、Nostr、Zalo、Nextcloud Talk、Synology Chat、Twitch など) に文書化されています。
完全なチャネル インデックスを参照してください: [チャネル](/channels)。

### グループチャットのメンションゲート

グループ メッセージはデフォルトで **メンションが必要** (メタデータのメンションまたは正規表現パターン) です。 WhatsApp、Telegram、Discord、Google Chat、および iMessage のグループ チャットに適用されます。

**メンションの種類:**- **メタデータのメンション**: ネイティブ プラットフォームの @-メンション。 WhatsApp セルフチャット モードでは無視されます。
- **テキスト パターン**: `agents.list[].groupChat.mentionPatterns` の正規表現パターン。常にチェックされています。
- メンション ゲートは、検出が可能な場合 (ネイティブ メンションまたは少なくとも 1 つのパターン) にのみ適用されます。

```json5
{
  messages: {
    groupChat: { historyLimit: 50 },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
````

`messages.groupChat.historyLimit` はグローバルなデフォルトを設定します。チャネルは `channels.<channel>.historyLimit` (またはアカウントごと) でオーバーライドできます。 `0` を無効に設定します。

#### DM 履歴の制限

```json5
{
  channels: {
    telegram: {
      dmHistoryLimit: 30,
      dms: {
        "123456789": { historyLimit: 50 },
      },
    },
  },
}
```

解決策: DM ごとのオーバーライド → プロバイダーのデフォルト → 制限なし (すべて保持)。

サポートされている: `telegram`、`whatsapp`、`discord`、`slack`、`signal`、`imessage`、`msteams`。

#### セルフチャットモード

セルフチャット モードを有効にするには、`allowFrom` に独自の番号を含めます (ネイティブの @-メンションを無視し、テキスト パターンにのみ応答します)。

```json5
{
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: { "*": { requireMention: true } },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: { mentionPatterns: ["reisponde", "@openclaw"] },
      },
    ],
  },
}
```

### コマンド (チャット コマンドの処理)

```json5
{
  commands: {
    native: "auto", // register native commands when supported
    text: true, // parse /commands in chat messages
    bash: false, // allow ! (alias: /bash)
    bashForegroundMs: 2000,
    config: false, // allow /config
    debug: false, // allow /debug
    restart: false, // allow /restart + gateway restart tool
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

<Accordion title="コマンド詳細">- テキスト コマンドは、先頭に `/` が付いた **スタンドアロン** メッセージである必要があります。

- `native: "auto"` は、Discord/Telegram のネイティブ コマンドをオンにし、Slack をオフのままにします。
- チャネルごとのオーバーライド: `channels.discord.commands.native` (ブール値または `"auto"`)。 `false` は、以前に登録されたコマンドをクリアします。
- `channels.telegram.customCommands` は、Telegram ボット メニュー エントリを追加します。
- `bash: true` は、ホスト シェルの `! <cmd>` を有効にします。 `tools.elevated.enabled` と `tools.elevated.allowFrom.<channel>` の送信者が必要です。
- `config: true` は `/config` を有効にします (`openclaw.json` の読み取り/書き込み)。ゲートウェイ `chat.send` クライアントの場合、永続的な `/config set|unset` 書き込みには `operator.admin` も必要です。読み取り専用 `/config show` は、通常の書き込みスコープのオペレーター クライアントで引き続き使用できます。
- `channels.<provider>.configWrites` はチャネルごとに構成の変更をゲートします (デフォルト: true)。
- `allowFrom` はプロバイダーごとです。設定すると、**唯一**の認証ソースになります (チャネル許可リスト/ペアリングと `useAccessGroups` は無視されます)。
- `useAccessGroups: false` を使用すると、`allowFrom` が設定されていない場合に、コマンドがアクセス グループ ポリシーをバイパスできます。

</Accordion>

---

## エージェントのデフォルト

### `agents.defaults.workspace`

デフォルト: `~/.openclaw/workspace`。

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

システム プロンプトのランタイム行に表示されるオプションのリポジトリ ルート。設定されていない場合、OpenClaw はワークスペースから上に向かって歩くことによって自動検出します。

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skipBootstrap`ワークスペース ブートストラップ ファイル (`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、 `BOOTSTRAP.md`)

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.bootstrapMaxChars`

切り詰められる前のワークスペース ブートストラップ ファイルあたりの最大文字数。デフォルト: `20000`。

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

すべてのワークスペース ブートストラップ ファイルに挿入される最大合計文字数。デフォルト: `150000`。

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 150000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

ブートストラップ コンテキストが切り詰められた場合に、エージェントに表示される警告テキストを制御します。
デフォルト: `"once"`。

- `"off"`: システム プロンプトに警告テキストを挿入しないでください。
- `"once"`: 一意の切り捨て署名ごとに 1 回警告を挿入します (推奨)。
- `"always"`: 切り捨てが存在する場合、実行ごとに警告を挿入します。

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### `agents.defaults.imageMaxDimensionPx`

プロバイダー呼び出し前のトランスクリプト/ツール画像ブロック内の最長画像側の最大ピクセル サイズ。
デフォルト: `1200`。

通常、値を低くすると、ビジョン トークンの使用量が減り、スクリーンショットを大量に使用する実行の場合に要求されるペイロード サイズが減ります。
値を大きくすると、視覚的な詳細がより多く保持されます。

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

システム プロンプト コンテキストのタイムゾーン (メッセージ タイムスタンプではありません)。ホストのタイムゾーンにフォールバックします。

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

システムプロンプトの時刻形式。デフォルト: `auto` (OS 設定)。

````json5
{
  agents: { defaults: { timeFormat: "auto" } }, // auto | 12 | 24
}
```### `agents.defaults.model`

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "minimax/MiniMax-M2.5": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.5"],
      },
      imageModel: {
        primary: "openrouter/qwen/qwen-2.5-vl-72b-instruct:free",
        fallbacks: ["openrouter/google/gemini-2.0-flash-vision:free"],
      },
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5-mini"],
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
      elevatedDefault: "on",
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      contextTokens: 200000,
      maxConcurrent: 3,
    },
  },
}
```- `model`: 文字列 (`"provider/model"`) またはオブジェクト (`{ primary, fallbacks }`) を受け入れます。
  ・文字列形式はプライマリモデルのみ設定します。
  - オブジェクト形式は、プライマリおよび順序付けされたフェイルオーバー モデルを設定します。
- `imageModel`: 文字列 (`"provider/model"`) またはオブジェクト (`{ primary, fallbacks }`) を受け入れます。
  - `image` ツール パスによってビジョン モデル構成として使用されます。
  - 選択/デフォルトのモデルが画像入力を受け入れられない場合のフォールバック ルーティングとしても使用されます。
- `pdfModel`: 文字列 (`"provider/model"`) またはオブジェクト (`{ primary, fallbacks }`) を受け入れます。
  - モデル ルーティング用の `pdf` ツールによって使用されます。
  - 省略した場合、PDF ツールは `imageModel` にフォールバックし、その後ベストエフォート型プロバイダーのデフォルトにフォールバックします。
- `pdfMaxBytesMb`: 呼び出し時に `maxBytesMb` が渡されない場合の、`pdf` ツールのデフォルトの PDF サイズ制限。
- `pdfMaxPages`: `pdf` ツールの抽出フォールバック モードで考慮されるデフォルトの最大ページ数。
- `model.primary`: `provider/model` の形式 (例: `anthropic/claude-opus-4-6`)。プロバイダーを省略した場合、OpenClaw は `anthropic` (非推奨) を想定します。
- `models`: `/model` の構成されたモデル カタログと許可リスト。各エントリには、`alias` (ショートカット) および `params` (プロバイダー固有、たとえば、`temperature`、`maxTokens`、`cacheRetention`、`context1m`) を含めることができます。- `params` マージ優先順位 (構成): `agents.defaults.models["provider/model"].params` がベースで、その後 `agents.list[].params` (エージェント ID と一致する) がキーによってオーバーライドされます。
- これらのフィールドを変更する構成ライター (`/models set`、`/models set-image`、およびフォールバック追加/削除コマンドなど) は、可能であれば正規のオブジェクト形式を保存し、既存のフォールバック リストを保存します。
- `maxConcurrent`: 最大並列エージェントはセッション間で実行されます (各セッションはまだシリアル化されています)。デフォルト: 1。

**組み込みのエイリアスの短縮表記** (モデルが `agents.defaults.models` の場合にのみ適用されます):

|別名 |モデル |
| ------------------- | -------------------------------------- |
| `opus` | `anthropic/claude-opus-4-6` |
| `sonnet` | `anthropic/claude-sonnet-4-6` |
| `gpt` | `openai/gpt-5.4` |
| `gpt-mini` | `openai/gpt-5-mini` |
| `gemini` | `google/gemini-3.1-pro-preview` |
| `gemini-flash` | `google/gemini-3-flash-preview` |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview` |

設定したエイリアスは常にデフォルトよりも優先されます。Z.AI GLM-4.x モデルは、`--thinking off` を設定するか、`agents.defaults.models["zai/<model>"].params.thinking` を自分で定義しない限り、思考モードを自動的に有効にします。
Z.AI モデルでは、ツール呼び出しストリーミングに対してデフォルトで `tool_stream` が有効になっています。無効にするには、`agents.defaults.models["zai/<model>"].params.tool_stream` を `false` に設定します。
Anthropic Claude 4.6 モデルは、明示的思考レベルが設定されていない場合、デフォルトで `adaptive` 思考になります。

### `agents.defaults.cliBackends`

テキストのみのフォールバック実行用のオプションの CLI バックエンド (ツール呼び出しなし)。 API プロバイダーに障害が発生した場合のバックアップとして役立ちます。

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          systemPromptArg: "--system",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
````

- CLI バックエンドはテキストファーストです。ツールは常に無効になっています。
- `sessionArg` が設定されている場合にサポートされるセッション。
- `imageArg` がファイル パスを受け入れる場合、イメージ パススルーがサポートされます。

### `agents.defaults.heartbeat`

定期的なハートビートが実行されます。

````json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m disables
        model: "openai/gpt-5.2-mini",
        includeReasoning: false,
        lightContext: false, // default: false; true keeps only HEARTBEAT.md from workspace bootstrap files
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (default) | block
        target: "none", // default: none | options: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
      },
    },
  },
}
```- `every`: 期間文字列 (ms/s/m/h)。デフォルト: `30m`。
- `suppressToolErrorWarnings`: true の場合、ハートビートの実行中にツール エラー警告ペイロードが抑制されます。
- `directPolicy`: 直接/DM 配信ポリシー。 `allow` (デフォルト) は、直接ターゲット配信を許可します。 `block` は直接ターゲットの配信を抑制し、`reason=dm-blocked` を発行します。
- `lightContext`: true の場合、ハートビートの実行では軽量ブートストラップ コンテキストが使用され、ワー​​クスペース ブートストラップ ファイルから `HEARTBEAT.md` のみが保持されます。
- エージェントごと: `agents.list[].heartbeat` を設定します。いずれかのエージェントが `heartbeat` を定義すると、**それらのエージェントのみ** がハートビートを実行します。
- ハートビートはエージェント ターン全体を実行します。間隔が短いほど、より多くのトークンが消費されます。

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        reserveTokensFloor: 24000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // used when identifierPolicy=custom
        postCompactionSections: ["Session Startup", "Red Lines"], // [] disables reinjection
        model: "openrouter/anthropic/claude-sonnet-4-5", // optional compaction-only model override
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```- `mode`: `default` または `safeguard` (長い履歴のチャンク化された要約)。 [圧縮](/concepts/compaction) を参照してください。
- `identifierPolicy`: `strict` (デフォルト)、`off`、または `custom`。 `strict` は、圧縮要約中に組み込みの不透明な識別子保持ガイダンスを先頭に追加します。
- `identifierInstructions`: `identifierPolicy=custom` の場合に使用されるオプションのカスタム識別子保存テキスト。
- `postCompactionSections`: 圧縮後に再挿入するオプションの AGENTS.md H2/H3 セクション名。デフォルトは `["Session Startup", "Red Lines"]` です。 `[]` を設定して再注入を無効にします。設定を解除するか、そのデフォルトのペアに明示的に設定すると、古い `Every Session`/`Safety` 見出しもレガシー フォールバックとして受け入れられます。
- `model`: 圧縮要約のみのオプションの `provider/model-id` オーバーライド。これは、メイン セッションで 1 つのモデルを保持する必要があるが、圧縮サマリーを別のモデルで実行する必要がある場合に使用します。設定されていない場合、圧縮ではセッションのプライマリ モデルが使用されます。
- `memoryFlush`: 耐久性のあるメモリを保存するための自動圧縮前のサイレント エージェント ターン。ワークスペースが読み取り専用の場合はスキップされます。

### `agents.defaults.contextPruning`

LLM に送信する前に、メモリ内コンテキストから **古いツールの結果** を削除します。ディスク上のセッション履歴は**変更されません**。

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // duration (ms/s/m/h), default unit: minutes
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Old tool result content cleared]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
````

<Accordion title="キャッシュ TTL モードの動作">- `mode: "cache-ttl"` はプルーニング パスを有効にします。

- `ttl` は、プルーニングを再度実行できる頻度 (最後のキャッシュ タッチ後) を制御します。
- プルーニングでは、まずサイズの大きいツール結果がソフト トリムされ、次に必要に応じて古いツール結果がハードクリアされます。

**ソフトトリム**は、先頭と末尾を維持し、途中に `...` を挿入します。

**ハードクリア** は、ツールの結果全体をプレースホルダーに置き換えます。

注:

- 画像ブロックは決してトリミング/クリアされません。
- 比率は文字ベース (概算) であり、正確なトークン数ではありません。
- 存在するアシスタント メッセージが `keepLastAssistants` 未満の場合、プルーニングはスキップされます。

</Accordion>

動作の詳細については、[セッション プルーニング](/concepts/session-pruning) を参照してください。

### ストリーミングをブロックする

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (use minMs/maxMs)
    },
  },
}
```

- Telegram 以外のチャネルでは、ブロック応答を有効にするには明示的な `*.blockStreaming: true` が必要です。
- チャネル オーバーライド: `channels.<channel>.blockStreamingCoalesce` (およびアカウントごとのバリアント)。 Signal/Slack/Discord/Google Chat のデフォルト `minChars: 1500`。
- `humanDelay`: ブロック返信間のランダムな一時停止。 `natural` = 800 ～ 2500 ミリ秒。エージェントごとのオーバーライド: `agents.list[].humanDelay`。

動作とチャンク化の詳細については、[ストリーミング](/concepts/streaming) を参照してください。

### タイピングインジケーター

```json5
{
  agents: {
    defaults: {
      typingMode: "instant", // never | instant | thinking | message
      typingIntervalSeconds: 6,
    },
  },
}
```

- デフォルト: 直接チャット/メンションの場合は `instant`、言及されていないグループ チャットの場合は `message`。
- セッションごとのオーバーライド: `session.typingMode`、`session.typingIntervalSeconds`。

[タイピングインジケーター](/concepts/typing-indicators) を参照してください。

### `agents.defaults.sandbox`埋め込みエージェント用のオプションの **Docker サンドボックス**。完全なガイドについては、[サンドボックス](/gateway/sandboxing) を参照してください

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        scope: "agent", // session | agent | shared
        workspaceAccess: "none", // none | ro | rw
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          containerPrefix: "openclaw-sbx-",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
          capDrop: ["ALL"],
          env: { LANG: "C.UTF-8" },
          setupCommand: "apt-get update && apt-get install -y git curl jq",
          pidsLimit: 256,
          memory: "1g",
          memorySwap: "2g",
          cpus: 1,
          ulimits: {
            nofile: { soft: 1024, hard: 2048 },
            nproc: 256,
          },
          seccompProfile: "/path/to/seccomp.json",
          apparmorProfile: "openclaw-sandbox",
          dns: ["1.1.1.1", "8.8.8.8"],
          extraHosts: ["internal.service:10.0.0.5"],
          binds: ["/home/user/source:/source:rw"],
        },
        browser: {
          enabled: false,
          image: "openclaw-sandbox-browser:bookworm-slim",
          network: "openclaw-sandbox-browser",
          cdpPort: 9222,
          cdpSourceRange: "172.21.0.1/32",
          vncPort: 5900,
          noVncPort: 6080,
          headless: false,
          enableNoVnc: true,
          allowHostControl: false,
          autoStart: true,
          autoStartTimeoutMs: 12000,
        },
        prune: {
          idleHours: 24,
          maxAgeDays: 7,
        },
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        allow: [
          "exec",
          "process",
          "read",
          "write",
          "edit",
          "apply_patch",
          "sessions_list",
          "sessions_history",
          "sessions_send",
          "sessions_spawn",
          "session_status",
        ],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"],
      },
    },
  },
}
```

<Accordion title="サンドボックスの詳細">

**ワークスペースへのアクセス:**

- `none`: `~/.openclaw/sandboxes` の下のスコープごとのサンドボックス ワークスペース
- `ro`: サンドボックス ワークスペースは `/workspace`、エージェント ワークスペースは `/agent` に読み取り専用でマウントされています
- `rw`: エージェント ワークスペースは `/workspace` に読み取り/書き込み可能にマウントされました

**範囲:**

- `session`: セッションごとのコンテナ + ワークスペース
- `agent`: エージェントごとに 1 つのコンテナ + ワークスペース (デフォルト)
- `shared`: 共有コンテナーとワークスペース (セッション間の分離なし)

**`setupCommand`** は、コンテナーの作成後に 1 回実行されます (`sh -lc` 経由)。ネットワーク出力、書き込み可能な root、root ユーザーが必要です。

**コンテナのデフォルトは `network: "none"`** です。エージェントが送信アクセスを必要とする場合は、`"bridge"` (またはカスタム ブリッジ ネットワーク) に設定されます。
`"host"` はブロックされています。 `"container:<id>"` は、明示的に設定しない限り、デフォルトでブロックされます
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (ガラス破り)。

**受信添付ファイル**は、アクティブなワークスペースの `media/inbound/*` にステージングされます。

**`docker.binds`** は追加のホスト ディレクトリをマウントします。グローバル バインドとエージェントごとのバインドがマージされます。**サンドボックス ブラウザ** (`sandbox.browser.enabled`): コンテナ内の Chromium + CDP。 noVNC URL がシステム プロンプトに挿入されました。 `openclaw.json` に `browser.enabled` は必要ありません。
noVNC オブザーバー アクセスでは、デフォルトで VNC 認証が使用され、OpenClaw は (共有 URL でパスワードを公開する代わりに) 有効期間の短いトークン URL を発行します。- `allowHostControl: false` (デフォルト) は、サンドボックス化されたセッションがホスト ブラウザーをターゲットにすることをブロックします。

- `network` のデフォルトは `openclaw-sandbox-browser` (専用ブリッジ ネットワーク) です。明示的にグローバル ブリッジ接続が必要な場合にのみ、`bridge` に設定します。
- `cdpSourceRange` は、オプションでコンテナ エッジでの CDP イングレスを CIDR 範囲に制限します (`172.21.0.1/32` など)。
- `sandbox.browser.binds` は、追加のホスト ディレクトリをサンドボックス ブラウザ コンテナのみにマウントします。設定すると (`[]` を含む)、ブラウザー コンテナーの `docker.binds` が置き換えられます。
- 起動デフォルトは `scripts/sandbox-browser-entrypoint.sh` で定義され、コンテナー ホスト用に調整されています。
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-3d-apis`
  - `--disable-gpu`
  - `--disable-software-rasterizer`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-features=TranslateUI`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--renderer-process-limit=2`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--disable-extensions` (デフォルトで有効)
  - `--disable-3d-apis`、`--disable-software-rasterizer`、および `--disable-gpu` は
    デフォルトで有効になっており、次のコマンドで無効にできます
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` WebGL/3D の使用に必要な場合。
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` は、ワークフローが次の場合に拡張機能を再度有効にします。
    彼ら次第です。
  - `--renderer-process-limit=2` は次のように変更できます。
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; Chromium を使用するように `0` を設定します
    デフォルトのプロセス制限。- `noSandbox` が有効な場合は、`--no-sandbox` および `--disable-setuid-sandbox` が追加されます。
  - デフォルトはコンテナイメージのベースラインです。カスタムのブラウザ画像をカスタムで使用する
    コンテナのデフォルトを変更するためのエントリポイント。

</Accordion>

イメージをビルドします。

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

### `agents.list` (エージェントごとの上書き)

````json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "Main Agent",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // or { primary, fallbacks }
        params: { cacheRetention: "none" }, // overrides matching defaults.models params by key
        identity: {
          name: "Samantha",
          theme: "helpful sloth",
          emoji: "🦥",
          avatar: "avatars/samantha.png",
        },
        groupChat: { mentionPatterns: ["@openclaw"] },
        sandbox: { mode: "off" },
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
        subagents: { allowAgents: ["*"] },
        tools: {
          profile: "coding",
          allow: ["browser"],
          deny: ["canvas"],
          elevated: { enabled: true },
        },
      },
    ],
  },
}
```- `id`: 安定したエージェント ID (必須)。
- `default`: 複数が設定されている場合、最初が優先されます (警告がログに記録されます)。何も設定されていない場合は、最初のリスト エントリがデフォルトになります。
- `model`: 文字列形式は `primary` のみをオーバーライドします。オブジェクト フォーム `{ primary, fallbacks }` は両方をオーバーライドします (`[]` はグローバル フォールバックを無効にします)。 `primary` をオーバーライドするだけの Cron ジョブは、`fallbacks: []` を設定しない限り、デフォルトのフォールバックを継承します。
- `params`: `agents.defaults.models` で選択されたモデル エントリにマージされたエージェントごとのストリーム パラメーター。これは、モデル カタログ全体を複製せずに、`cacheRetention`、`temperature`、`maxTokens` などのエージェント固有のオーバーライドに使用します。
- `runtime`: オプションのエージェントごとのランタイム記述子。エージェントがデフォルトで ACP ハーネス セッションを使用する必要がある場合は、`type: "acp"` を `runtime.acp` デフォルト (`agent`、`backend`、`mode`、`cwd`) とともに使用します。
- `identity.avatar`: ワークスペース相対パス、`http(s)` URL、または `data:` URI。
- `identity` はデフォルトを派生します: `emoji` から `ackReaction`、`name`/`emoji` から `mentionPatterns`。
- `subagents.allowAgents`: `sessions_spawn` のエージェント ID の許可リスト (`["*"]` = 任意、デフォルト: 同じエージェントのみ)。
- サンドボックス継承ガード: リクエスター セッションがサンドボックス化されている場合、`sessions_spawn` はサンドボックス化されずに実行されるターゲットを拒否します。

---## マルチエージェントルーティング

1 つのゲートウェイ内で複数の分離されたエージェントを実行します。 [マルチエージェント](/concepts/multi-agent) を参照してください。

```json5
{
  agents: {
    list: [
      { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
      { id: "work", workspace: "~/.openclaw/workspace-work" },
    ],
  },
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
  ],
}
````

### 一致フィールドのバインディング

- `type` (オプション): 通常のルーティングの場合は `route` (タイプが欠落している場合はデフォルトでルーティングされます)、永続的な ACP 会話バインディングの場合は `acp`。
- `match.channel` (必須)
- `match.accountId` (オプション; `*` = 任意のアカウント; 省略 = デフォルトのアカウント)
- `match.peer` (オプション; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (オプション、チャネル固有)
- `acp` (オプション; `type: "acp"` のみ): `{ mode, label, cwd, backend }`

**決定的な一致順序:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (正確、ピア/ギルド/チームなし)
5. `match.accountId: "*"` (チャネル全体)
6. デフォルトエージェント

各層内で、最初に一致した `bindings` エントリが優先されます。

`type: "acp"` エントリの場合、OpenClaw は正確な会話 ID (`match.channel` + アカウント + `match.peer.id`) によって解決し、上記のルート バインディング層の順序は使用しません。

### エージェントごとのアクセス プロファイル

<Accordion title="フルアクセス (サンドボックスなし)">

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="読み取り専用ツール + ワークスペース">

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "ro" },
        tools: {
          allow: [
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="ファイルシステムへのアクセスなし (メッセージングのみ)">

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "none" },
        tools: {
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
            "gateway",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

</Accordion>

優先順位の詳細については、[マルチエージェント サンドボックスとツール](/tools/multi-agent-sandbox-tools) を参照してください。

---

## セッション

```json5
{
  session: {
    scope: "per-sender",
    dmScope: "main", // main | per-peer | per-channel-peer | per-account-channel-peer
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      mode: "daily", // daily | idle
      atHour: 4,
      idleMinutes: 60,
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      direct: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    parentForkMaxTokens: 100000, // skip parent-thread fork above this token count (0 disables)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // duration or false
      maxDiskBytes: "500mb", // optional hard budget
      highWaterBytes: "400mb", // optional cleanup target
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // default inactivity auto-unfocus in hours (`0` disables)
      maxAgeHours: 0, // default hard max age in hours (`0` disables)
    },
    mainKey: "main", // legacy (runtime always uses "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="セッションフィールドの詳細">- **`dmScope`**: DM がグループ化される方法。

- `main`: すべての DM がメイン セッションを共有します。
- `per-peer`: チャネル間で送信者 ID によって分離します。
- `per-channel-peer`: チャネル + 送信者ごとに分離します (マルチユーザーの受信箱に推奨)。
- `per-account-channel-peer`: アカウント + チャネル + 送信者ごとに分離します (複数のアカウントに推奨)。
- **`identityLinks`**: クロスチャネルセッション共有のために、正規 ID をプロバイダープレフィックス付きのピアにマップします。
- **`reset`**: プライマリ リセット ポリシー。 `daily` は現地時間の `atHour` にリセットされます。 `idle` は `idleMinutes` の後にリセットされます。両方が設定されている場合は、先に期限が切れた方が優先されます。
- **`resetByType`**: タイプごとのオーバーライド (`direct`、`group`、`thread`)。レガシー `dm` は `direct` のエイリアスとして受け入れられます。
- **`parentForkMaxTokens`**: フォークされたスレッド セッションの作成時に許可される最大親セッション `totalTokens` (デフォルト `100000`)。
  - 親 `totalTokens` がこの値を超えている場合、OpenClaw は親トランスクリプト履歴を継承する代わりに、新しいスレッド セッションを開始します。
  - このガードを無効にし、常に親のフォークを許可するには、`0` を設定します。
- **`mainKey`**: 従来のフィールド。ランタイムは、メインのダイレクト チャット バケットに常に `"main"` を使用するようになりました。- **`sendPolicy`**: `channel`、`chatType` (`direct|group|channel`、従来の `dm` エイリアスを使用)、`keyPrefix`、または `rawKeyPrefix` による一致。最初に拒否した方が勝ちです。
- **`maintenance`**: セッション ストアのクリーンアップ + 保持制御。
  - `mode`: `warn` は警告のみを発行します。 `enforce` はクリーンアップを適用します。
  - `pruneAfter`: 古いエントリの期限切れ (デフォルト `30d`)。
  - `maxEntries`: `sessions.json` のエントリの最大数 (デフォルトは `500`)。
  - `rotateBytes`: このサイズを超える場合、`sessions.json` を回転します (デフォルト `10mb`)。
  - `resetArchiveRetention`: `*.reset.<timestamp>` トランスクリプト アーカイブの保持。デフォルトは `pruneAfter` です。 `false` を無効に設定します。
  - `maxDiskBytes`: オプションのセッション ディレクトリのディスク バジェット。 `warn` モードでは、警告がログに記録されます。 `enforce` モードでは、最も古いアーティファクト/セッションが最初に削除されます。
  - `highWaterBytes`: 予算クリーンアップ後のオプションのターゲット。デフォルトは `80%` または `maxDiskBytes` です。
- **`threadBindings`**: スレッドバインドされたセッション機能のグローバルデフォルト。
  - `enabled`: マスターデフォルトスイッチ (プロバイダーは上書き可能; Discord は `channels.discord.threadBindings.enabled` を使用します)
  - `idleHours`: デフォルトの非アクティブ状態は時間単位で自動的にフォーカスを解除します (`0` は無効になります。プロバイダーはオーバーライドできます)- `maxAgeHours`: デフォルトのハードマックス経過時間 (`0` は無効になります。プロバイダーはオーバーライドできます)

</Accordion>

---

## メッセージ

```json5
{
  messages: {
    responsePrefix: "🦞", // or "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "collect", // steer | followup | collect | steer-backlog | steer+backlog | queue | interrupt
      debounceMs: 1000,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "collect",
        telegram: "collect",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 disables
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### 応答プレフィックス

チャネル/アカウントごとのオーバーライド: `channels.<channel>.responsePrefix`、`channels.<channel>.accounts.<id>.responsePrefix`。

解決策 (最も具体的な勝利): アカウント → チャネル → グローバル。 `""` はカスケードを無効にして停止します。 `"auto"` は `[{identity.name}]` を派生させます。

**テンプレート変数:**

| 変数              | 説明               | 例                          |
| ----------------- | ------------------ | --------------------------- |
| `{model}`         | 短いモデル名       | `claude-opus-4-6`           |
| `{modelFull}`     | 完全なモデル識別子 | `anthropic/claude-opus-4-6` |
| `{provider}`      | プロバイダー名     | `anthropic`                 |
| `{thinkingLevel}` | 現在の思考レベル   | `high`、`low`、`off`        |
| `{identity.name}` | エージェント ID 名 | (`"auto"` と同じ)           |

変数では大文字と小文字が区別されません。 `{think}` は、`{thinkingLevel}` のエイリアスです。

### ACK反応- デフォルトはアクティブなエージェントの `identity.emoji`、それ以外の場合は `"👀"` です。 `""` を無効に設定します

- チャネルごとのオーバーライド: `channels.<channel>.ackReaction`、`channels.<channel>.accounts.<id>.ackReaction`。
- 解決順序: アカウント → チャネル → `messages.ackReaction` → ID フォールバック。
- スコープ: `group-mentions` (デフォルト)、`group-all`、`direct`、`all`。
- `removeAckAfterReply`: 返信後の確認応答を削除します (Slack/Discord/Telegram/Google Chat のみ)。

### インバウンドデバウンス

同じ送信者からのテキストのみの迅速なメッセージを 1 つのエージェント ターンにバッチ処理します。メディア/添付ファイルはすぐにフラッシュされます。制御コマンドはデバウンスをバイパスします。

### TTS (テキスト読み上げ)

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      elevenlabs: {
        apiKey: "elevenlabs_api_key",
        baseUrl: "https://api.elevenlabs.io",
        voiceId: "voice_id",
        modelId: "eleven_multilingual_v2",
        seed: 42,
        applyTextNormalization: "auto",
        languageCode: "en",
        voiceSettings: {
          stability: 0.5,
          similarityBoost: 0.75,
          style: 0.0,
          useSpeakerBoost: true,
          speed: 1.0,
        },
      },
      openai: {
        apiKey: "openai_api_key",
        baseUrl: "https://api.openai.com/v1",
        model: "gpt-4o-mini-tts",
        voice: "alloy",
      },
    },
  },
}
```

- `auto` は自動 TTS を制御します。 `/tts off|always|inbound|tagged` はセッションごとにオーバーライドされます。
- `summaryModel` は、自動要約の `agents.defaults.model.primary` をオーバーライドします。
- `modelOverrides` はデフォルトで有効になっています。 `modelOverrides.allowProvider` のデフォルトは `false` (オプトイン) です。
- API キーは `ELEVENLABS_API_KEY`/`XI_API_KEY` および `OPENAI_API_KEY` にフォールバックします。
- `openai.baseUrl` は OpenAI TTS エンドポイントをオーバーライドします。解決順序は、config、次に `OPENAI_TTS_BASE_URL`、次に `https://api.openai.com/v1` です。
- `openai.baseUrl` が非 OpenAI エンドポイントを指している場合、OpenClaw はそれを OpenAI 互換の TTS サーバーとして扱い、モデル/音声の検証を緩和します。

---

## 話す

トーク モードのデフォルト (macOS/iOS/Android)。

````json5
{
  talk: {
    voiceId: "elevenlabs_voice_id",
    voiceAliases: {
      Clawd: "EXAVITQu4vr4xnSDxMaL",
      Roger: "CwhRBWXzGAHq8TQ4Fs17",
    },
    modelId: "eleven_v3",
    outputFormat: "mp3_44100_128",
    apiKey: "elevenlabs_api_key",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```- 音声 ID は `ELEVENLABS_VOICE_ID` または `SAG_VOICE_ID` にフォールバックします。
- `apiKey` および `providers.*.apiKey` は、プレーンテキスト文字列または SecretRef オブジェクトを受け入れます。
- `ELEVENLABS_API_KEY` フォールバックは、Talk API キーが設定されていない場合にのみ適用されます。
- `voiceAliases` により、Talk ディレクティブにフレンドリ名を使用できるようになります。
- `silenceTimeoutMs` は、ユーザーが沈黙した後、トランスクリプトを送信するまでトーク モードが待機する時間を制御します。設定を解除すると、プラットフォームのデフォルトの一時停止ウィンドウ (`700 ms on macOS and Android, 900 ms on iOS`) が維持されます。

---

## ツール

### 工具プロファイル

`tools.profile` は、`tools.allow`/`tools.deny` の前に基本ホワイトリストを設定します。

ローカル オンボーディングは、設定を解除すると、新しいローカル構成をデフォルトで `tools.profile: "coding"` に設定します (既存の明示的なプロファイルは保持されます)。

|プロフィール |含まれるもの |
| ----------- | ----------------------------------------------------------------------------------------- |
| `minimal` | `session_status` のみ |
| `coding` | `group:fs`、`group:runtime`、`group:sessions`、`group:memory`、`image` |
| `messaging` | `group:messaging`、`sessions_list`、`sessions_history`、`sessions_send`、`session_status` |
| `full` |制限なし（未設定と同じ） |### ツールグループ|グループ |ツール |
| ------------------ | -------------------------------------------------------------------------------------- |
| `group:runtime` | `exec`、`process` (`bash` は `exec` のエイリアスとして受け入れられます)
| `group:fs` | `read`、`write`、`edit`、`apply_patch` |
| `group:sessions` | `sessions_list`、`sessions_history`、`sessions_send`、`sessions_spawn`、`session_status` |
| `group:memory` | `memory_search`、`memory_get` |
| `group:web` | `web_search`、`web_fetch` |
| `group:ui` | `browser`、`canvas` |
| `group:automation` | `cron`、`gateway` |
| `group:messaging` | `message` || `group:nodes` | `nodes` |
| `group:openclaw` |すべての組み込みツール (プロバイダー プラグインを除く) |

### `tools.allow` / `tools.deny`

グローバル ツールの許可/拒否ポリシー (拒否の勝利)。大文字と小文字は区別されず、`*` ワイルドカードをサポートします。 Docker サンドボックスがオフの場合でも適用されます。

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
````

### `tools.byProvider`

特定のプロバイダーまたはモデル用のツールをさらに制限します。順序: 基本プロファイル → プロバイダー プロファイル → 許可/拒否。

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
      "openai/gpt-5.2": { allow: ["group:fs", "sessions_list"] },
    },
  },
}
```

### `tools.elevated`

昇格された (ホスト) 実行アクセスを制御します。

```json5
{
  tools: {
    elevated: {
      enabled: true,
      allowFrom: {
        whatsapp: ["+15555550123"],
        discord: ["1234567890123", "987654321098765432"],
      },
    },
  },
}
```

- エージェントごとのオーバーライド (`agents.list[].tools.elevated`) は、さらに制限することしかできません。
- `/elevated on|off|ask|full` はセッションごとの状態を保存します。インラインディレクティブは単一のメッセージに適用されます。
- 昇格された `exec` がホスト上で実行され、サンドボックスがバイパスされます。

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.2"],
      },
    },
  },
}
```

### `tools.loopDetection`

ツールループの安全性チェックは **デフォルトでは無効になっています**。 `enabled: true` を設定して検出を有効にします。
設定は `tools.loopDetection` でグローバルに定義でき、`agents.list[].tools.loopDetection` でエージェントごとに上書きできます。

````json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```- `historySize`: ループ解析のために保持される最大ツール呼び出し履歴。
- `warningThreshold`: 警告に対する進行なしパターンのしきい値を繰り返します。
- `criticalThreshold`: クリティカルなループをブロックするためのより高い繰り返ししきい値。
- `globalCircuitBreakerThreshold`: 進行状況のない実行に対するハードストップのしきい値。
- `detectors.genericRepeat`: 同じツール/同じ引数の繰り返し呼び出しを警告します。
- `detectors.knownPollNoProgress`: 既知の投票ツール (`process.poll`、`command_status` など) に対して警告/ブロックします。
- `detectors.pingPong`: 交互に進行しないペアのパターンを警告/ブロックします。
- `warningThreshold >= criticalThreshold` または `criticalThreshold >= globalCircuitBreakerThreshold` の場合、検証は失敗します。

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // or BRAVE_API_KEY env
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        maxChars: 50000,
        maxCharsCap: 50000,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        userAgent: "custom-ua",
      },
    },
  },
}
````

### `tools.media`

インバウンドメディア理解 (画像/音声/ビデオ) を構成します。

```json5
{
  tools: {
    media: {
      concurrency: 2,
      audio: {
        enabled: true,
        maxBytes: 20971520,
        scope: {
          default: "deny",
          rules: [{ action: "allow", match: { chatType: "direct" } }],
        },
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          { type: "cli", command: "whisper", args: ["--model", "base", "{{MediaPath}}"] },
        ],
      },
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },
}
```

<Accordion title="メディアモデル入力フィールド">

**プロバイダーエントリ** (`type: "provider"` または省略):

- `provider`: API プロバイダー ID (`openai`、`anthropic`、`google`/`gemini`、`groq` など)
- `model`: モデル ID の上書き
- `profile` / `preferredProfile`: `auth-profiles.json` プロファイルの選択

**CLI エントリ** (`type: "cli"`):

- `command`: 実行する実行可能ファイル
- `args`: テンプレート化された引数 (`{{MediaPath}}`、`{{Prompt}}`、`{{MaxChars}}` などをサポート)

**共通フィールド:**- `capabilities`: オプションのリスト (`image`、`audio`、`video`)。デフォルト: `openai`/`anthropic`/`minimax` → 画像、`google` → 画像+音声+ビデオ、`groq` → 音声。

- `prompt`、`maxChars`、`maxBytes`、`timeoutSeconds`、`language`: エントリごとの上書き。
- 失敗は次のエントリにフォールバックします。

プロバイダー認証は標準の順序に従います: `auth-profiles.json` → 環境変数 → `models.providers.*.apiKey`。

</Accordion>

### `tools.agentToAgent`

```json5
{
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },
}
```

### `tools.sessions`

セッション ツール (`sessions_list`、`sessions_history`、`sessions_send`) の対象にできるセッションを制御します。

デフォルト: `tree` (現在のセッション + それによって生成されたセッション (サブエージェントなど))。

```json5
{
  tools: {
    sessions: {
      // "self" | "tree" | "agent" | "all"
      visibility: "tree",
    },
  },
}
```

注:

- `self`: 現在のセッション キーのみ。
- `tree`: 現在のセッション + 現在のセッションによって生成されたセッション (サブエージェント)。
- `agent`: 現在のエージェント ID に属する任意のセッション (同じエージェント ID で送信者ごとのセッションを実行する場合は、他のユーザーを含めることができます)。
- `all`: 任意のセッション。クロスエージェントターゲティングには引き続き `tools.agentToAgent` が必要です。
- サンドボックス クランプ: 現在のセッションがサンドボックス化されており、`agents.defaults.sandbox.sessionToolsVisibility="spawned"` である場合、`tools.sessions.visibility="all"` であっても、可視性は強制的に `tree` に設定されます。

### `tools.sessions_spawn`

`sessions_spawn` のインライン添付ファイルのサポートを制御します。

````json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // opt-in: set true to allow inline file attachments
        maxTotalBytes: 5242880, // 5 MB total across all files
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB per file
        retainOnSessionKeep: false, // keep attachments when cleanup="keep"
      },
    },
  },
}
```注:

- 添付ファイルは `runtime: "subagent"` でのみサポートされます。 ACP ランタイムはそれらを拒否します。
- ファイルは、`.manifest.json` を使用して、`.openclaw/attachments/<uuid>/` の子ワークスペースに実体化されます。
- 添付ファイルのコンテンツは、トランスクリプトの永続性から自動的に編集されます。
- Base64 入力は、厳密なアルファベット/パディング チェックとプリデコード サイズ ガードによって検証されます。
- ファイル権限は、ディレクトリの場合は `0700`、ファイルの場合は `0600` です。
- クリーンアップは `cleanup` ポリシーに従います。 `delete` は常に添付ファイルを削除します。 `keep` は、`retainOnSessionKeep: true` の場合にのみそれらを保持します。

### `tools.subagents`

```json5
{
  agents: {
    defaults: {
      subagents: {
        model: "minimax/MiniMax-M2.5",
        maxConcurrent: 1,
        runTimeoutSeconds: 900,
        archiveAfterMinutes: 60,
      },
    },
  },
}
````

- `model`: 生成されたサブエージェントのデフォルト モデル。省略した場合、サブエージェントは呼び出し元のモデルを継承します。
- `runTimeoutSeconds`: ツール呼び出しで `runTimeoutSeconds` が省略された場合の `sessions_spawn` のデフォルトのタイムアウト (秒)。 `0` はタイムアウトがないことを意味します。
- サブエージェントごとのツール ポリシー: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`。

---

## カスタムプロバイダーとベース URL

OpenClaw は、pi-coding-agent モデル カタログを使用します。構成内の `models.providers` または `~/.openclaw/agents/<agentId>/agent/models.json` を介してカスタム プロバイダーを追加します。

````json5
{
  models: {
    mode: "merge", // merge (default) | replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai
        models: [
          {
            id: "llama-3.1-8b",
            name: "Llama 3.1 8B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```- カスタム認証が必要な場合は、`authHeader: true` + `headers` を使用します。
- エージェント設定ルートを `OPENCLAW_AGENT_DIR` (または `PI_CODING_AGENT_DIR`) でオーバーライドします。
- 一致するプロバイダー ID のマージの優先順位:
  - 空ではないエージェント `models.json` `baseUrl` 値が優先されます。
  - 空ではないエージェント `apiKey` 値は、そのプロバイダーが現在の構成/認証プロファイル コンテキストで SecretRef で管理されていない場合にのみ優先されます。
  - SecretRef 管理プロバイダーの `apiKey` 値は、解決されたシークレットを保持するのではなく、ソース マーカー (環境参照の場合は `ENV_VAR_NAME`、ファイル/実行参照の場合は `secretref-managed`) から更新されます。
  - 空または欠落しているエージェント `apiKey`/`baseUrl` は、構成内の `models.providers` にフォールバックします。
  - マッチングモデル `contextWindow`/`maxTokens` は、明示的な構成値と暗黙的なカタログ値の間の高い値を使用します。
  - 構成で `models.json` を完全に書き換える場合は、`models.mode: "replace"` を使用します。

### プロバイダーフィールドの詳細- `models.mode`: プロバイダー カタログの動作 (`merge` または `replace`)。
- `models.providers`: プロバイダー ID をキーとするカスタム プロバイダー マップ。
- `models.providers.*.api`: アダプターを要求します (`openai-completions`、`openai-responses`、`anthropic-messages`、`google-generative-ai` など)。
- `models.providers.*.apiKey`: プロバイダーの資格情報 (SecretRef/env 置換を推奨)。
- `models.providers.*.auth`: 認証戦略 (`api-key`、`token`、`oauth`、`aws-sdk`)。
- `models.providers.*.injectNumCtxForOpenAICompat`: Ollama + `openai-completions` の場合、`options.num_ctx` をリクエストに挿入します (デフォルト: `true`)。
- `models.providers.*.authHeader`: 必要に応じて、`Authorization` ヘッダーで資格情報のトランスポートを強制します。
- `models.providers.*.baseUrl`: アップストリーム API ベース URL。
- `models.providers.*.headers`: プロキシ/テナント ルーティング用の追加の静的ヘッダー。
- `models.providers.*.models`: 明示的なプロバイダー モデル カタログ エントリ。
- `models.providers.*.models.*.compat.supportsDeveloperRole`: オプションの互換性ヒント。空ではない非ネイティブ `baseUrl` (`api.openai.com` ではないホスト) を持つ `api: "openai-completions"` の場合、OpenClaw は実行時にこれを強制的に `false` に設定します。空または省略された `baseUrl` は、デフォルトの OpenAI 動作を維持します。
- `models.bedrockDiscovery`: Bedrock 自動検出設定のルート。
- `models.bedrockDiscovery.enabled`: 検出ポーリングをオン/オフにします。
- `models.bedrockDiscovery.region`: 検出用の AWS リージョン。
- `models.bedrockDiscovery.providerFilter`: ターゲットを絞った検出のためのオプションのプロバイダー ID フィルター。
- `models.bedrockDiscovery.refreshInterval`: 検出更新のポーリング間隔。- `models.bedrockDiscovery.defaultContextWindow`: 検出されたモデルのフォールバック コンテキスト ウィンドウ。
- `models.bedrockDiscovery.defaultMaxTokens`: 検出されたモデルのフォールバック最大出力トークン。

### プロバイダーの例

<Accordion title="Cerebras (GLM 4.6 / 4.7)">

```json5
{
  env: { CEREBRAS_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: {
        primary: "cerebras/zai-glm-4.7",
        fallbacks: ["cerebras/zai-glm-4.6"],
      },
      models: {
        "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
        "cerebras/zai-glm-4.6": { alias: "GLM 4.6 (Cerebras)" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      cerebras: {
        baseUrl: "https://api.cerebras.ai/v1",
        apiKey: "${CEREBRAS_API_KEY}",
        api: "openai-completions",
        models: [
          { id: "zai-glm-4.7", name: "GLM 4.7 (Cerebras)" },
          { id: "zai-glm-4.6", name: "GLM 4.6 (Cerebras)" },
        ],
      },
    },
  },
}
````

大脳には `cerebras/zai-glm-4.7` を使用します。 Z.AI ダイレクトの `zai/glm-4.7`。

</Accordion>

<Accordion title="OpenCode Zen">

```json5
{
  agents: {
    defaults: {
      model: { primary: "opencode/claude-opus-4-6" },
      models: { "opencode/claude-opus-4-6": { alias: "Opus" } },
    },
  },
}
```

`OPENCODE_API_KEY` (または `OPENCODE_ZEN_API_KEY`) を設定します。ショートカット: `openclaw onboard --auth-choice opencode-zen`。

</Accordion>

<Accordion title="Z.AI（GLM-4.7）">

```json5
{
  agents: {
    defaults: {
      model: { primary: "zai/glm-4.7" },
      models: { "zai/glm-4.7": {} },
    },
  },
}
```

`ZAI_API_KEY` を設定します。 `z.ai/*` および `z-ai/*` は別名として受け入れられます。ショートカット: `openclaw onboard --auth-choice zai-api-key`。

- 一般エンドポイント: `https://api.z.ai/api/paas/v4`
- コーディングエンドポイント (デフォルト): `https://api.z.ai/api/coding/paas/v4`
- 一般的なエンドポイントの場合、ベース URL オーバーライドを使用してカスタム プロバイダーを定義します。

</Accordion>

<Accordion title="ムーンショットAI（キミ）">

```json5
{
  env: { MOONSHOT_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "moonshot/kimi-k2.5" },
      models: { "moonshot/kimi-k2.5": { alias: "Kimi K2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "kimi-k2.5",
            name: "Kimi K2.5",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 256000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

中国エンドポイントの場合: `baseUrl: "https://api.moonshot.cn/v1"` または `openclaw onboard --auth-choice moonshot-api-key-cn`。

</Accordion>

<Accordion title="キミコーディング">

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "kimi-coding/k2p5" },
      models: { "kimi-coding/k2p5": { alias: "Kimi K2.5" } },
    },
  },
}
```

Anthropic 互換の組み込みプロバイダー。ショートカット: `openclaw onboard --auth-choice kimi-code-api-key`。

</Accordion>

<Accordion title="合成 (人為的互換性)">

```json5
{
  env: { SYNTHETIC_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
      models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "hf:MiniMaxAI/MiniMax-M2.5",
            name: "MiniMax M2.5",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 192000,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

ベース URL は `/v1` を省略する必要があります (Anthropic クライアントが追加します)。ショートカット: `openclaw onboard --auth-choice synthetic-api-key`。

</Accordion>

<Accordion title="MiniMax M2.5 (直接)">

```json5
{
  agents: {
    defaults: {
      model: { primary: "minimax/MiniMax-M2.5" },
      models: {
        "minimax/MiniMax-M2.5": { alias: "Minimax" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      minimax: {
        baseUrl: "https://api.minimax.io/anthropic",
        apiKey: "${MINIMAX_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "MiniMax-M2.5",
            name: "MiniMax M2.5",
            reasoning: false,
            input: ["text"],
            cost: { input: 15, output: 60, cacheRead: 2, cacheWrite: 10 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

`MINIMAX_API_KEY` を設定します。ショートカット: `openclaw onboard --auth-choice minimax-api`。

</Accordion>

<Accordion title="ローカルモデル (LM Studio)">[ローカル モデル](/gateway/local-models) を参照してください。 TL;DR: 本格的なハードウェアで LM Studio Response API 経由で MiniMax M2.5 を実行します。フォールバックのためにホストされたモデルをマージしたままにします。

</Accordion>

---

## スキル

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn
    },
    entries: {
      "nano-banana-pro": {
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: バンドルされたスキルのみのオプションの許可リスト (管理/ワークスペース スキルは影響を受けません)。
- `entries.<skillKey>.enabled: false` は、バンドル/インストールされている場合でもスキルを無効にします。
- `entries.<skillKey>.apiKey`: プライマリ環境変数 (プレーンテキスト文字列または SecretRef オブジェクト) を宣言するスキルの利便性。

---

## プラグイン

````json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: [],
    load: {
      paths: ["~/Projects/oss/voice-call-extension"],
    },
    entries: {
      "voice-call": {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
        config: { provider: "twilio" },
      },
    },
  },
}
```- `~/.openclaw/extensions`、`<workspace>/.openclaw/extensions`、および `plugins.load.paths` からロードされます。
- **構成を変更するにはゲートウェイの再起動が必要です。**
- `allow`: オプションの許可リスト (リストされたプラグインのみがロードされます)。 `deny` が勝ちます。
- `plugins.entries.<id>.apiKey`: プラグインレベルの API キー便利フィールド (プラグインでサポートされている場合)。
- `plugins.entries.<id>.env`: プラグインスコープの環境変数マップ。
- `plugins.entries.<id>.hooks.allowPromptInjection`: `false` の場合、コアは `before_prompt_build` をブロックし、レガシー `before_agent_start` からのプロンプト変更フィールドを無視しますが、レガシー `modelOverride` および `providerOverride` は保持します。
- `plugins.entries.<id>.config`: プラグイン定義の設定オブジェクト (プラグイン スキーマによって検証される)。
- `plugins.slots.memory`: アクティブなメモリ プラグイン ID を選択するか、メモリ プラグインを無効にする場合は `"none"` を選択します。
- `plugins.slots.contextEngine`: アクティブなコンテキスト エンジン プラグイン ID を選択します。別のエンジンをインストールして選択しない限り、デフォルトは `"legacy"` になります。
- `plugins.installs`: `openclaw plugins update` によって使用される CLI 管理のインストール メタデータ。
  - `source`、`spec`、`sourcePath`、`installPath`、`version`、`resolvedName`、`resolvedVersion`、 `resolvedSpec`、`integrity`、`shasum`、`resolvedAt`、`installedAt`。
  - `plugins.installs.*` を管理対象状態として扱います。手動編集よりも CLI コマンドを優先します。

[プラグイン](/tools/plugin) を参照してください。

---

## ブラウザ

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "chrome",
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: true, // default trusted-network mode
      // allowPrivateNetwork: true, // legacy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
    color: "#FF4500",
    // headless: false,
    // noSandbox: false,
    // extraArgs: [],
    // relayBindHost: "0.0.0.0", // only when the extension relay must be reachable across namespaces (for example WSL2)
    // executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    // attachOnly: false,
  },
}
```- `evaluateEnabled: false` は、`act:evaluate` および `wait --fn` を無効にします。
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` は、未設定の場合はデフォルトで `true` になります (信頼されたネットワーク モデル)。
- `ssrfPolicy.dangerouslyAllowPrivateNetwork: false` を設定して、厳密なパブリックのみのブラウザ ナビゲーションを実現します。
- `ssrfPolicy.allowPrivateNetwork` はレガシー エイリアスとして引き続きサポートされます。
- 厳密モードでは、明示的な例外に `ssrfPolicy.hostnameAllowlist` および `ssrfPolicy.allowedHostnames` を使用します。
- リモート プロファイルは接続専用です (開始/停止/リセットは無効)。
- 自動検出順序: Chromium ベースの場合はデフォルトのブラウザ → Chrome → Brave → Edge → Chromium → Chrome Canary。
- 制御サービス: ループバックのみ (ポートは `gateway.port` から派生、デフォルトは `18791`)。
- `extraArgs` は、ローカルの Chromium 起動に追加の起動フラグを追加します (たとえば、
  `--disable-gpu`、ウィンドウ サイズ、またはデバッグ フラグ)。
- `relayBindHost` は、Chrome 拡張機能リレーがリッスンする場所を変更します。ループバックのみのアクセスの場合は未設定のままにしておきます。 `0.0.0.0` などの明示的な非ループバック バインド アドレスは、リレーが名前空間の境界 (WSL2 など) を越える必要があり、ホスト ネットワークがすでに信頼されている場合にのみ設定します。

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, short text, image URL, or data URI
    },
  },
}
````

- `seamColor`: ネイティブ アプリ UI クロムのアクセント カラー (トーク モードのバブルの色合いなど)。
- `assistant`: UI ID オーバーライドを制御します。アクティブなエージェント ID にフォールバックします。

---

## ゲートウェイ

```json5
{
  gateway: {
    mode: "local", // local | remote
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token", // none | token | password | trusted-proxy
      token: "your-token",
      // password: "your-password", // or OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // for mode=trusted-proxy; see /gateway/trusted-proxy-auth
      allowTailscale: true,
      rateLimit: {
        maxAttempts: 10,
        windowMs: 60000,
        lockoutMs: 300000,
        exemptLoopback: true,
      },
    },
    tailscale: {
      mode: "off", // off | serve | funnel
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // allowedOrigins: ["https://control.example.com"], // required for non-loopback Control UI
      // dangerouslyAllowHostHeaderOriginFallback: false, // dangerous Host-header origin fallback mode
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    remote: {
      url: "ws://gateway.tailnet:18789",
      transport: "ssh", // ssh | direct
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // Optional. Default false.
    allowRealIpFallback: false,
    tools: {
      // Additional /tools/invoke HTTP denies
      deny: ["browser"],
      // Remove tools from the default HTTP deny list
      allow: ["gateway"],
    },
  },
}
```

<Accordion title="ゲートウェイフィールドの詳細">- `mode`: `local` (ゲートウェイを実行) または `remote` (リモート ゲートウェイに接続)。 `local` を除き、ゲートウェイは起動を拒否します。

- `port`: WS + HTTP 用の単一の多重化ポート。優先順位: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`。
- `bind`: `auto`、`loopback` (デフォルト)、`lan` (`0.0.0.0`)、`tailnet` (Tailscale IP のみ)、または`custom`。
- **レガシー バインド エイリアス**: ホスト エイリアスではなく、`gateway.bind` (`auto`、`loopback`、`lan`、`tailnet`、`custom`) のバインド モード値を使用します。 (`0.0.0.0`、`127.0.0.1`、`localhost`、`::`、`::1`)。
- **Docker 注**: デフォルトの `loopback` バインドは、コンテナー内の `127.0.0.1` をリッスンします。 Docker ブリッジ ネットワーキング (`-p 18789:18789`) では、トラフィックは `eth0` に到着するため、ゲートウェイに到達できません。すべてのインターフェイスでリッスンするには、`--network host` を使用するか、`bind: "lan"` (または `bind: "custom"` と `customBindHost: "0.0.0.0"`) を設定します。
- **認証**: デフォルトで必須。非ループバック バインドには共有トークン/パスワードが必要です。オンボーディング ウィザードはデフォルトでトークンを生成します。- `gateway.auth.token` と `gateway.auth.password` の両方が構成されている場合 (SecretRef を含む)、`gateway.auth.mode` を明示的に `token` または `password` に設定します。起動とサービスのインストール/修復フローの両方が構成され、モードが設定されていない場合、失敗します。
- `gateway.auth.mode: "none"`: 明示的な非認証モード。信頼できるローカル ループバック設定にのみ使用してください。これはオンボーディング プロンプトでは意図的に提供されません。
- `gateway.auth.mode: "trusted-proxy"`: ID 対応リバース プロキシに認証を委任し、`gateway.trustedProxies` からの ID ヘッダーを信頼します ([信頼されたプロキシ認証](/gateway/trusted-proxy-auth) を参照)。
- `gateway.auth.allowTailscale`: `true` の場合、Tailscale Serve ID ヘッダーはコントロール UI/WebSocket 認証を満たすことができます (`tailscale whois` で検証)。 HTTP API エンドポイントでは依然としてトークン/パスワード認証が必要です。このトークンレス フローは、ゲートウェイ ホストが信頼できることを前提としています。 `tailscale.mode = "serve"` の場合、デフォルトは `true` になります。
- `gateway.auth.rateLimit`: オプションの認証失敗リミッター。クライアント IP ごとおよび認証スコープごとに適用されます (共有シークレットとデバイス トークンは個別に追跡されます)。ブロックされた試行は `429` + `Retry-After` を返します。
  - `gateway.auth.rateLimit.exemptLoopback` のデフォルトは `true` です。 localhost のトラフィック レートも意図的に制限したい場合は、`false` を設定します (テスト セットアップまたは厳密なプロキシ展開の場合)。- ブラウザー オリジンの WS 認証試行は、ループバック除外が無効になっている状態で常に抑制されます (ブラウザー ベースのローカルホスト ブルート フォースに対する多層防御)。
- `tailscale.mode`: `serve` (テールネットのみ、ループバック バインド) または `funnel` (パブリック、認証が必要)。
- `controlUi.allowedOrigins`: ゲートウェイ WebSocket 接続用の明示的なブラウザー起点許可リスト。ブラウザクライアントが非ループバックオリジンからのものであることが予期される場合に必要です。
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: ホスト ヘッダー オリジン ポリシーに意図的に依存する展開でホスト ヘッダー オリジン フォールバックを有効にする危険なモード。
- `remote.transport`: `ssh` (デフォルト) または `direct` (ws/wss)。 `direct` の場合、`remote.url` は `ws://` または `wss://` である必要があります。
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: 信頼されたプライベート ネットワーク IP へのプレーンテキスト `ws://` を許可するクライアント側のブレークグラス オーバーライド。デフォルトでは平文の場合はループバックのみになります。
- `gateway.remote.token` / `.password` は、リモート クライアントの資格情報フィールドです。ゲートウェイ認証を独自に構成することはありません。
- `gateway.auth.*` が設定されていない場合、ローカル ゲートウェイの呼び出しパスはフォールバックとして `gateway.remote.*` を使用できます。
- `trustedProxies`: TLS を終了するリバース プロキシ IP。自分が制御するプロキシのみをリストします。
- `allowRealIpFallback`: `true` の場合、`X-Forwarded-For` が欠落している場合、ゲートウェイは `X-Real-IP` を受け入れます。フェールクローズ動作のデフォルト `false`。- `gateway.tools.deny`: HTTP `POST /tools/invoke` に対して追加のツール名がブロックされました (デフォルトの拒否リストを拡張します)。
- `gateway.tools.allow`: デフォルトの HTTP 拒否リストからツール名を削除します。

</Accordion>

### OpenAI 互換エンドポイント

- チャット完了: デフォルトでは無効になっています。 `gateway.http.endpoints.chatCompletions.enabled: true` で有効にします。
- 応答 API: `gateway.http.endpoints.responses.enabled`。
- 応答 URL 入力の強化:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
- オプションの応答強化ヘッダー:
  - `gateway.http.securityHeaders.strictTransportSecurity` (制御する HTTPS オリジンに対してのみ設定します。[信頼されたプロキシ認証](/gateway/trusted-proxy-auth#tls-termination-and-hsts) を参照)

### マルチインスタンスの分離

一意のポートと状態ディレクトリを使用して、1 つのホスト上で複数のゲートウェイを実行します。

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

便利なフラグ: `--dev` (`~/.openclaw-dev` + ポート `19001` を使用)、`--profile <name>` (`~/.openclaw-<name>` を使用)。

[複数のゲートウェイ](/gateway/multiple-gateways) を参照してください。

---

## フック

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    maxBodyBytes: 262144,
    defaultSessionKey: "hook:ingress",
    allowRequestSessionKey: false,
    allowedSessionKeyPrefixes: ["hook:"],
    allowedAgentIds: ["hooks", "main"],
    presets: ["gmail"],
    transformsDir: "~/.openclaw/hooks/transforms",
    mappings: [
      {
        match: { path: "gmail" },
        action: "agent",
        agentId: "hooks",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate: "From: {{messages[0].from}}\nSubject: {{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.2-mini",
      },
    ],
  },
}
```

認証: `Authorization: Bearer <token>` または `x-openclaw-token: <token>`。

**エンドポイント:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - リクエスト ペイロードの `sessionKey` は、`hooks.allowRequestSessionKey=true` (デフォルト: `false`) の場合にのみ受け入れられます。
- `POST /hooks/<name>` → `hooks.mappings` によって解決されました

<Accordion title="マッピングの詳細">- `match.path` は、`/hooks` の後のサブパスと一致します (例: `/hooks/gmail` → `gmail`)。

- `match.source` は、汎用パスのペイロード フィールドと一致します。
- `{{messages[0].subject}}` のようなテンプレートはペイロードから読み取られます。
- `transform` は、フック アクションを返す JS/TS モジュールを指すことができます。
  - `transform.module` は相対パスであり、`hooks.transformsDir` 内に収まる必要があります (絶対パスとトラバースは拒否されます)。
- `agentId` は特定のエージェントにルーティングします。不明な ID はデフォルトに戻ります。
- `allowedAgentIds`: 明示的なルーティングを制限します (`*` または省略 = すべて許可、`[]` = すべて拒否)。
- `defaultSessionKey`: フック エージェントのオプションの固定セッション キーは、明示的な `sessionKey` なしで実行されます。
- `allowRequestSessionKey`: `/hooks/agent` 呼び出し元が `sessionKey` を設定できるようにします (デフォルト: `false`)。
- `allowedSessionKeyPrefixes`: 明示的な `sessionKey` 値 (リクエスト + マッピング) のオプションのプレフィックス許可リスト。 `["hook:"]`。
- `deliver: true` はチャネルに最終応答を送信します。 `channel` のデフォルトは `last` です。
- `model` は、このフック実行の LLM をオーバーライドします (モデル カタログが設定されている場合は許可する必要があります)。

</Accordion>

### Gmail の統合

```json5
{
  hooks: {
    gmail: {
      account: "openclaw@gmail.com",
      topic: "projects/<project-id>/topics/gog-gmail-watch",
      subscription: "gog-gmail-watch-push",
      pushToken: "shared-push-token",
      hookUrl: "http://127.0.0.1:18789/hooks/gmail",
      includeBody: true,
      maxBytes: 20000,
      renewEveryMinutes: 720,
      serve: { bind: "127.0.0.1", port: 8788, path: "/" },
      tailscale: { mode: "funnel", path: "/gmail-pubsub" },
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

- 構成されている場合、ゲートウェイは起動時に `gog gmail watch serve` を自動起動します。 `OPENCLAW_SKIP_GMAIL_WATCHER=1` を無効に設定します。
- ゲートウェイと一緒に別の `gog gmail watch serve` を実行しないでください。

---

## キャンバスホスト

```json5

{
canvasHost: {
root: "~/.openclaw/workspace/canvas",
liveReload: true,
// enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
},
}

````

- エージェントが編集可能な HTML/CSS/JS および A2UI をゲートウェイ ポートで HTTP 経由で提供します。
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- ローカルのみ: `gateway.bind: "loopback"` (デフォルト) を維持します。
- 非ループバック バインド: キャンバス ルートには、他のゲートウェイ HTTP サーフェスと同様に、ゲートウェイ認証 (トークン/パスワード/信頼できるプロキシ) が必要です。
- ノード WebView は通常、認証ヘッダーを送信しません。ノードがペアリングされて接続されると、ゲートウェイはキャンバス/A2UI アクセス用にノード スコープの機能 URL をアドバタイズします。
- 機能 URL はアクティブ ノード WS セッションにバインドされており、すぐに期限切れになります。 IP ベースのフォールバックは使用されません。
- ライブリロードクライアントを提供される HTML に挿入します。
- 空の場合、スターター `index.html` を自動作成します。
- `/__openclaw__/a2ui/` で A2UI も提供します。
- 変更にはゲートウェイの再起動が必要です。
- 大きなディレクトリまたは `EMFILE` エラーのライブ リロードを無効にします。

---

## 発見

### mDNS (ボンジュール)

```json5
{
  discovery: {
    mdns: {
      mode: "minimal", // minimal | full | off
    },
  },
}
````

- `minimal` (デフォルト): TXT レコードから `cliPath` + `sshPort` を省略します。
- `full`: `cliPath` + `sshPort` を含みます。
- ホスト名のデフォルトは `openclaw` です。 `OPENCLAW_MDNS_HOSTNAME` でオーバーライドします。

### 広域 (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

ユニキャスト DNS-SD ゾーンを `~/.openclaw/dns/` に書き込みます。クロスネットワーク検出の場合は、DNS サーバー (CoreDNS 推奨) + Tailscale Split DNS とペアリングします。

セットアップ: `openclaw dns setup --apply`。

---

## 環境

### `env` (インライン環境変数)```json5

{
env: {
OPENROUTER_API_KEY: "sk-or-...",
vars: {
GROQ_API_KEY: "gsk-...",
},
shellEnv: {
enabled: true,
timeoutMs: 15000,
},
},
}

````

- インライン環境変数は、プロセス環境にキーがない場合にのみ適用されます。
- `.env` ファイル: CWD `.env` + `~/.openclaw/.env` (どちらも既存の変数をオーバーライドしません)。
- `shellEnv`: ログイン シェル プロファイルから不足している予期されたキーをインポートします。
- 完全な優先順位については、[環境](/help/environment) を参照してください。

### 環境変数の置換

`${VAR_NAME}` を使用して、構成文字列内の環境変数を参照します。

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
````

- 大文字の名前のみが一致しました: `[A-Z_][A-Z0-9_]*`。
- 変数が欠落しているか空であると、構成ロード時にエラーがスローされます。
- リテラル `${VAR}` の場合は、`${VAR}` でエスケープします。
- `$include` で動作します。

---

## 秘密

Secret ref は追加的です。プレーンテキストの値は引き続き機能します。

### `SecretRef`

1 つのオブジェクト シェイプを使用します。

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

検証:

- `provider` パターン: `^[a-z][a-z0-9_-]{0,63}# 構成リファレンス

`~/.openclaw/openclaw.json` で使用可能なすべてのフィールド。タスク指向の概要については、「[構成](/gateway/configuration)」を参照してください。

構成形式は **JSON5** (コメント + 末尾のカンマは許可されます) です。すべてのフィールドはオプションです。省略された場合、OpenClaw は安全なデフォルトを使用します。

---

## チャンネル

各チャネルは、その構成セクションが存在すると自動的に開始されます (`enabled: false` を除く)。

### DMとグループアクセス

すべてのチャネルは DM ポリシーとグループ ポリシーをサポートします。

| DMポリシー               | 行動                                                                                   |
| ------------------------ | -------------------------------------------------------------------------------------- | --- | ---------------- | ---- |
| `pairing` (デフォルト)   | 不明な送信者はワンタイムペアリングコードを受け取ります。所有者は承認する必要があります |
| `allowlist`              | `allowFrom` (またはペアの許可ストア) の送信者のみ                                      |
| `open`                   | すべての受信 DM を許可する (`allowFrom: ["*"]` が必要)                                 |
| `disabled`               | すべての受信 DM を無視する                                                             |     | グループポリシー | 行動 |
| ---------------------    | --------------------------------------------------------                               |
| `allowlist` (デフォルト) | 設定された許可リストに一致するグループのみ                                             |
| `open`                   | グループ許可リストをバイパスします (メンションゲートは引き続き適用されます)。          |
| `disabled`               | すべてのグループ/ルーム メッセージをブロックする                                       |

<Note>
`channels.defaults.groupPolicy` は、プロバイダーの `groupPolicy` が設定されていない場合のデフォルトを設定します。
ペアリング コードは 1 時間後に期限切れになります。保留中の DM ペアリング要求の上限は、**チャネルあたり 3** です。
プロバイダー ブロックが完全に欠落している (`channels.<provider>` が欠落している) 場合、ランタイム グループ ポリシーは起動警告とともに `allowlist` (フェールクローズ) にフォールバックします。
</Note>

### チャネルモデルのオーバーライド

`channels.modelByChannel` を使用して、特定のチャネル ID をモデルに固定します。値は `provider/model` または構成されたモデルのエイリアスを受け入れます。チャネル マッピングは、セッションにモデル オーバーライドがまだない場合 (たとえば、`/model` によって設定されている場合) に適用されます。

```json5
{
  channels: {
    modelByChannel: {
      discord: {
        "123456789012345678": "anthropic/claude-opus-4-6",
      },
      slack: {
        C1234567890: "openai/gpt-4.1",
      },
      telegram: {
        "-1001234567890": "openai/gpt-4.1-mini",
        "-1001234567890:topic:99": "anthropic/claude-sonnet-4-6",
      },
    },
  },
}
```

### チャネルのデフォルトとハートビート

プロバイダー間で共有されるグループ ポリシーとハートビートの動作には、`channels.defaults` を使用します。

````json5
{
  channels: {
    defaults: {
      groupPolicy: "allowlist", // open | allowlist | disabled
      heartbeat: {
        showOk: false,
        showAlerts: true,
        useIndicator: true,
      },
    },
  },
}
```- `channels.defaults.groupPolicy`: プロバイダーレベルの `groupPolicy` が設定されていない場合のフォールバック グループ ポリシー。
- `channels.defaults.heartbeat.showOk`: ハートビート出力に正常なチャネルのステータスを含めます。
- `channels.defaults.heartbeat.showAlerts`: ハートビート出力に劣化/エラーステータスを含めます。
- `channels.defaults.heartbeat.useIndicator`: コンパクトなインジケーター スタイルのハートビート出力をレンダリングします。

### WhatsApp

WhatsApp は、ゲートウェイの Web チャネル (Baileys Web) を通じて実行されます。リンクされたセッションが存在する場合、自動的に開始されます。

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      chunkMode: "length", // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // blue ticks (false in self-chat mode)
      groups: {
        "*": { requireMention: true },
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
  web: {
    enabled: true,
    heartbeatSeconds: 60,
    reconnect: {
      initialMs: 2000,
      maxMs: 120000,
      factor: 1.4,
      jitter: 0.2,
      maxAttempts: 0,
    },
  },
}
````

<Accordion title="マルチアカウント WhatsApp">

```json5
{
  channels: {
    whatsapp: {
      accounts: {
        default: {},
        personal: {},
        biz: {
          // authDir: "~/.openclaw/credentials/whatsapp/biz",
        },
      },
    },
  },
}
```

- アウトバウンド コマンドは、デフォルトでアカウント `default` が存在する場合に使用されます。それ以外の場合は、最初に設定されたアカウント ID (ソート済み)。
- オプションの `channels.whatsapp.defaultAccount` は、構成されたアカウント ID と一致する場合にフォールバックのデフォルトのアカウント選択をオーバーライドします。
- 従来の単一アカウントの Baileys 認証ディレクトリは、`openclaw doctor` によって `whatsapp/default` に移行されます。
- アカウントごとの上書き: `channels.whatsapp.accounts.<id>.sendReadReceipts`、`channels.whatsapp.accounts.<id>.dmPolicy`、`channels.whatsapp.accounts.<id>.allowFrom`。

</Accordion>

### 電報

````json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "your-bot-token",
      dmPolicy: "pairing",
      allowFrom: ["tg:123456789"],
      groups: {
        "*": { requireMention: true },
        "-1001234567890": {
          allowFrom: ["@admin"],
          systemPrompt: "Keep answers brief.",
          topics: {
            "99": {
              requireMention: false,
              skills: ["search"],
              systemPrompt: "Stay on topic.",
            },
          },
        },
      },
      customCommands: [
        { command: "backup", description: "Git backup" },
        { command: "generate", description: "Create an image" },
      ],
      historyLimit: 50,
      replyToMode: "first", // off | first | all
      linkPreview: true,
      streaming: "partial", // off | partial | block | progress (default: off)
      actions: { reactions: true, sendMessage: true },
      reactionNotifications: "own", // off | own | all
      mediaMaxMb: 100,
      retry: {
        attempts: 3,
        minDelayMs: 400,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
      network: {
        autoSelectFamily: true,
        dnsResultOrder: "ipv4first",
      },
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook",
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook",
    },
  },
}
```- ボット トークン: `channels.telegram.botToken` または `channels.telegram.tokenFile`、`TELEGRAM_BOT_TOKEN` はデフォルト アカウントのフォールバックとして使用されます。
- オプションの `channels.telegram.defaultAccount` は、構成されたアカウント ID と一致する場合、デフォルトのアカウント選択をオーバーライドします。
- マルチアカウント設定 (2 つ以上のアカウント ID) では、明示的なデフォルト (`channels.telegram.defaultAccount` または `channels.telegram.accounts.default`) を設定して、フォールバック ルーティングを回避します。 `openclaw doctor` は、これが欠落しているか無効な場合に警告します。
- `configWrites: false` は、Telegram が開始する設定の書き込みをブロックします (スーパーグループ ID の移行、`/config set|unset`)。
- `type: "acp"` を含むトップレベルの `bindings[]` エントリは、フォーラム トピックの永続的な ACP バインディングを構成します (`match.peer.id` の正規の `chatId:topic:topicId` を使用します)。フィールド セマンティクスは [ACP エージェント](/tools/acp-agents#channel-specific-settings) で共有されます。
- Telegram ストリーム プレビューは `sendMessage` + `editMessageText` を使用します (ダイレクト チャットおよびグループ チャットで機能します)。
- 再試行ポリシー: [再試行ポリシー](/concepts/retry) を参照してください。

### 不和

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: "your-bot-token",
      mediaMaxMb: 8,
      allowBots: false,
      actions: {
        reactions: true,
        stickers: true,
        polls: true,
        permissions: true,
        messages: true,
        threads: true,
        pins: true,
        search: true,
        memberInfo: true,
        roleInfo: true,
        roles: false,
        channelInfo: true,
        voiceStatus: true,
        events: true,
        moderation: false,
      },
      replyToMode: "off", // off | first | all
      dmPolicy: "pairing",
      allowFrom: ["1234567890", "123456789012345678"],
      dm: { enabled: true, groupEnabled: false, groupChannels: ["openclaw-dm"] },
      guilds: {
        "123456789012345678": {
          slug: "friends-of-openclaw",
          requireMention: false,
          ignoreOtherMentions: true,
          reactionNotifications: "own",
          users: ["987654321098765432"],
          channels: {
            general: { allow: true },
            help: {
              allow: true,
              requireMention: true,
              users: ["987654321098765432"],
              skills: ["docs"],
              systemPrompt: "Short answers only.",
            },
          },
        },
      },
      historyLimit: 20,
      textChunkLimit: 2000,
      chunkMode: "length", // length | newline
      streaming: "off", // off | partial | block | progress (progress maps to partial on Discord)
      maxLinesPerMessage: 17,
      ui: {
        components: {
          accentColor: "#5865F2",
        },
      },
      threadBindings: {
        enabled: true,
        idleHours: 24,
        maxAgeHours: 0,
        spawnSubagentSessions: false, // opt-in for sessions_spawn({ thread: true })
      },
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
      retry: {
        attempts: 3,
        minDelayMs: 500,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
  },
}
```- トークン: `channels.discord.token`、デフォルト アカウントのフォールバックとして `DISCORD_BOT_TOKEN`。
- オプションの `channels.discord.defaultAccount` は、設定されたアカウント ID と一致する場合、デフォルトのアカウント選択をオーバーライドします。
- 配信ターゲットには `user:<id>` (DM) または `channel:<id>` (ギルド チャネル) を使用します。裸の数値 ID は拒否されます。
- ギルド スラッグは小文字でスペースが `-` に置き換えられます。チャンネルキーはスラッグ名 (`#` ではありません) を使用します。ギルドIDを優先します。
- ボットが作成したメッセージはデフォルトでは無視されます。 `allowBots: true` はそれらを有効にします。 `allowBots: "mentions"` を使用して、ボットに言及するボット メッセージのみを受け入れます (独自のメッセージはまだフィルターされています)。
- `channels.discord.guilds.<id>.ignoreOtherMentions` (およびチャネル オーバーライド) は、別のユーザーまたはロールに言及するメッセージを削除しますが、ボットには言及しません (@everyone/@here を除く)。
- `maxLinesPerMessage` (デフォルトは 17) は、2000 文字未満の場合でも長いメッセージを分割します。
- `channels.discord.threadBindings` は、Discord のスレッドバインドされたルーティングを制御します。
  - `enabled`: スレッドバインドされたセッション機能の Discord オーバーライド (`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`、バインド配信/ルーティング)
  - `idleHours`: 非アクティブ状態が数時間で自動フォーカス解除されるための Discord オーバーライド (`0` は無効になります)
  - `maxAgeHours`: 時間単位のハードマックス年齢の Discord オーバーライド (`0` は無効になります)
  - `spawnSubagentSessions`: `sessions_spawn({ thread: true })` 自動スレッド作成/バインドのオプトイン スイッチ- `type: "acp"` を含むトップレベルの `bindings[]` エントリは、チャネルとスレッドの永続的な ACP バインディングを構成します (`match.peer.id` のチャネル/スレッド ID を使用します)。フィールド セマンティクスは [ACP エージェント](/tools/acp-agents#channel-specific-settings) で共有されます。
- `channels.discord.ui.components.accentColor` は、Discord コンポーネント v2 コンテナのアクセント カラーを設定します。
- `channels.discord.voice` は、Discord 音声チャネル会話とオプションの自動参加 + TTS オーバーライドを有効にします。
- `channels.discord.voice.daveEncryption` および `channels.discord.voice.decryptionFailureTolerance` は `@discordjs/voice` DAVE オプションに渡されます (デフォルトでは `true` および `24`)。
- OpenClaw はさらに、繰り返し復号化に失敗した後、音声セッションから離脱/再参加することで音声受信の回復を試みます。
- `channels.discord.streaming` は正規ストリーム モード キーです。従来の `streamMode` およびブール値 `streaming` 値は自動移行されます。
- `channels.discord.autoPresence` は、実行時の可用性をボットの存在にマップし (正常 => オンライン、劣化 => アイドル、消耗 => 停止)、オプションでステータス テキストの上書きを許可します。
- `channels.discord.dangerouslyAllowNameMatching` は、変更可能な名前/タグの一致を再度有効にします (ブレークグラス互換モード)。

**反応通知モード:** `off` (なし)、`own` (ボットのメッセージ、デフォルト)、`all` (すべてのメッセージ)、`allowlist` (すべてのメッセージの `guilds.<id>.users` から)。

### Google チャット

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      audienceType: "app-url", // app-url | project-number
      audience: "https://gateway.example.com/googlechat",
      webhookPath: "/googlechat",
      botUser: "users/1234567890",
      dm: {
        enabled: true,
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": { allow: true, requireMention: true },
      },
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```- サービス アカウント JSON: インライン (`serviceAccount`) またはファイルベース (`serviceAccountFile`)。
- サービス アカウント SecretRef もサポートされています (`serviceAccountRef`)。
- 環境フォールバック: `GOOGLE_CHAT_SERVICE_ACCOUNT` または `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`。
- 配信ターゲットには `spaces/<spaceId>` または `users/<userId>` を使用します。
- `channels.googlechat.dangerouslyAllowNameMatching` は、変更可能な電子メール プリンシパルの一致を再度有効にします (ブレークグラス互換モード)。

### スラック

```json5
{
  channels: {
    slack: {
      enabled: true,
      botToken: "xoxb-...",
      appToken: "xapp-...",
      dmPolicy: "pairing",
      allowFrom: ["U123", "U456", "*"],
      dm: { enabled: true, groupEnabled: false, groupChannels: ["G123"] },
      channels: {
        C123: { allow: true, requireMention: true, allowBots: false },
        "#general": {
          allow: true,
          requireMention: true,
          allowBots: false,
          users: ["U123"],
          skills: ["docs"],
          systemPrompt: "Short answers only.",
        },
      },
      historyLimit: 50,
      allowBots: false,
      reactionNotifications: "own",
      reactionAllowlist: ["U123"],
      replyToMode: "off", // off | first | all
      thread: {
        historyScope: "thread", // thread | channel
        inheritParent: false,
      },
      actions: {
        reactions: true,
        messages: true,
        pins: true,
        memberInfo: true,
        emojiList: true,
      },
      slashCommand: {
        enabled: true,
        name: "openclaw",
        sessionPrefix: "slack:slash",
        ephemeral: true,
      },
      typingReaction: "hourglass_flowing_sand",
      textChunkLimit: 4000,
      chunkMode: "length",
      streaming: "partial", // off | partial | block | progress (preview mode)
      nativeStreaming: true, // use Slack native streaming API when streaming=partial
      mediaMaxMb: 20,
    },
  },
}
````

- **ソケット モード**には、`botToken` と `appToken` の両方が必要です (デフォルトのアカウント環境フォールバックの場合は `SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN`)。
- **HTTP モード** には、`botToken` と `signingSecret` (ルートまたはアカウントごと) が必要です。
- `configWrites: false` は、Slack によって開始される設定の書き込みをブロックします。
- オプションの `channels.slack.defaultAccount` は、設定されたアカウント ID と一致する場合、デフォルトのアカウント選択をオーバーライドします。
- `channels.slack.streaming` は正規ストリーム モード キーです。従来の `streamMode` 値とブール値 `streaming` 値は自動移行されます。
- 配信ターゲットには `user:<id>` (DM) または `channel:<id>` を使用します。

**反応通知モード:** `off`、`own` (デフォルト)、`all`、`allowlist` (`reactionAllowlist` から)。

**スレッド セッションの分離:** `thread.historyScope` はスレッドごと (デフォルト)、またはチャネル全体で共有されます。 `thread.inheritParent` は、親チャネルのトランスクリプトを新しいスレッドにコピーします。- `typingReaction` は、返信の実行中に受信 Slack メッセージに一時的な反応を追加し、完了時に削除します。 `"hourglass_flowing_sand"` などの Slack 絵文字ショートコードを使用します。

| アクショングループ | デフォルト | メモ                    |
| ------------------ | ---------- | ----------------------- |
| 反応               | 有効       | 反応 + 反応のリスト     |
| メッセージ         | 有効       | 読み取り/送信/編集/削除 |
| ピン               | 有効       | 固定/固定解除/リスト    |
| メンバー情報       | 有効       | 会員情報                |
| 絵文字リスト       | 有効       | カスタム絵文字リスト    |

### 最も重要なこと

Mattermost はプラグインとして出荷されます: `openclaw plugins install @openclaw/mattermost`。

```json5
{
  channels: {
    mattermost: {
      enabled: true,
      botToken: "mm-token",
      baseUrl: "https://chat.example.com",
      dmPolicy: "pairing",
      chatmode: "oncall", // oncall | onmessage | onchar
      oncharPrefixes: [">", "!"],
      commands: {
        native: true, // opt-in
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Optional explicit URL for reverse-proxy/public deployments
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

チャット モード: `oncall` (@ メンションで応答、デフォルト)、`onmessage` (すべてのメッセージ)、`onchar` (トリガー プレフィックスで始まるメッセージ)。

Mattermost ネイティブ コマンドが有効な場合:- `commands.callbackPath` は、完全な URL ではなく、パス (`/api/channels/mattermost/command` など) である必要があります。

- `commands.callbackUrl` は OpenClaw ゲートウェイ エンドポイントに解決され、Mattermost サーバーから到達可能である必要があります。
- プライベート/テールネット/内部コールバック ホストの場合、Mattermost は必要な場合があります
  `ServiceSettings.AllowedUntrustedInternalConnections` には、コールバック ホスト/ドメインが含まれます。
  完全な URL ではなく、ホスト/ドメインの値を使用します。
- `channels.mattermost.configWrites`: Mattermost が開始する構成書き込みを許可または拒否します。
- `channels.mattermost.requireMention`: チャネルで返信する前に `@mention` が必要です。
- オプションの `channels.mattermost.defaultAccount` は、構成されたアカウント ID と一致する場合、デフォルトのアカウント選択をオーバーライドします。

### 信号

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // optional account binding
      dmPolicy: "pairing",
      allowFrom: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      configWrites: true,
      reactionNotifications: "own", // off | own | all | allowlist
      reactionAllowlist: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      historyLimit: 50,
    },
  },
}
```

**反応通知モード:** `off`、`own` (デフォルト)、`all`、`allowlist` (`reactionAllowlist` から)。

- `channels.signal.account`: チャネルの起動を特定の Signal アカウント ID に固定します。
- `channels.signal.configWrites`: Signal によって開始される構成書き込みを許可または拒否します。
- オプションの `channels.signal.defaultAccount` は、設定されたアカウント ID と一致する場合、デフォルトのアカウント選択をオーバーライドします。

### ブルーバブルズ

BlueBubbles が推奨される iMessage パスです (プラグインベース、`channels.bluebubbles` で構成)。

````json5
{
  channels: {
    bluebubbles: {
      enabled: true,
      dmPolicy: "pairing",
      // serverUrl, password, webhookPath, group controls, and advanced actions:
      // see /channels/bluebubbles
    },
  },
}
```- ここで取り上げるコアキーのパス: `channels.bluebubbles`、`channels.bluebubbles.dmPolicy`。
- オプションの `channels.bluebubbles.defaultAccount` は、構成されたアカウント ID と一致する場合、デフォルトのアカウント選択をオーバーライドします。
- 完全な BlueBubbles チャネル構成は [BlueBubbles](/channels/bluebubbles) に文書化されています。

### iメッセージ

OpenClaw は `imsg rpc` (標準入出力上の JSON-RPC) を生成します。デーモンやポートは必要ありません。

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "imsg",
      dbPath: "~/Library/Messages/chat.db",
      remoteHost: "user@gateway-host",
      dmPolicy: "pairing",
      allowFrom: ["+15555550123", "user@example.com", "chat_id:123"],
      historyLimit: 50,
      includeAttachments: false,
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      mediaMaxMb: 16,
      service: "auto",
      region: "US",
    },
  },
}
````

- オプションの `channels.imessage.defaultAccount` は、設定されたアカウント ID と一致する場合、デフォルトのアカウント選択をオーバーライドします。

- メッセージ DB へのフルディスク アクセスが必要です。
- `chat_id:<id>` ターゲットを優先します。チャットを一覧表示するには、`imsg chats --limit 20` を使用します。
- `cliPath` は SSH ラッパーを指すことができます。 SCP 添付ファイルを取得するために `remoteHost` (`host` または `user@host`) を設定します。
- `attachmentRoots` および `remoteAttachmentRoots` は、受信添付ファイル パスを制限します (デフォルト: `/Users/*/Library/Messages/Attachments`)。
- SCP は厳密なホスト キー チェックを使用するため、リレー ホスト キーが `~/.ssh/known_hosts` にすでに存在していることを確認してください。
- `channels.imessage.configWrites`: iMessage によって開始される設定の書き込みを許可または拒否します。

<Accordion title="iMessage SSH ラッパーの例">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Microsoft Teams

Microsoft Teams は拡張機能をサポートしており、`channels.msteams` で構成されています。

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, team/channel policies:
      // see /channels/msteams
    },
  },
}
```

- ここで取り上げるコアキーのパス: `channels.msteams`、`channels.msteams.configWrites`。
- 完全な Teams 構成 (資格情報、Webhook、DM/グループ ポリシー、チームごと/チャネルごとのオーバーライド) は、[Microsoft Teams](/channels/msteams) に文書化されています。### IRC

IRC は拡張機能をサポートしており、`channels.irc` で構成されています。

```json5
{
  channels: {
    irc: {
      enabled: true,
      dmPolicy: "pairing",
      configWrites: true,
      nickserv: {
        enabled: true,
        service: "NickServ",
        password: "${IRC_NICKSERV_PASSWORD}",
        register: false,
        registerEmail: "bot@example.com",
      },
    },
  },
}
```

- ここで説明するコアキーのパス: `channels.irc`、`channels.irc.dmPolicy`、`channels.irc.configWrites`、`channels.irc.nickserv.*`。
- オプションの `channels.irc.defaultAccount` は、構成されたアカウント ID と一致する場合、デフォルトのアカウント選択をオーバーライドします。
- 完全な IRC チャネル設定 (ホスト/ポート/TLS/チャネル/許可リスト/メンション ゲーティング) は [IRC](/channels/irc) に文書化されています。

### マルチアカウント (すべてのチャネル)

チャネルごとに複数のアカウントを実行します (それぞれに独自の `accountId` があります)。

````json5
{
  channels: {
    telegram: {
      accounts: {
        default: {
          name: "Primary bot",
          botToken: "123456:ABC...",
        },
        alerts: {
          name: "Alerts bot",
          botToken: "987654:XYZ...",
        },
      },
    },
  },
}
```- `default` は、`accountId` が省略された場合に使用されます (CLI + ルーティング)。
- 環境トークンは **デフォルト** アカウントにのみ適用されます。
- 基本チャネル設定は、アカウントごとに上書きされない限り、すべてのアカウントに適用されます。
- `bindings[].match.accountId` を使用して、各アカウントを別のエージェントにルーティングします。
- 単一アカウントのトップレベルのチャネル設定を使用しているときに、`openclaw channels add` (またはチャネルのオンボーディング) 経由でデフォルト以外のアカウントを追加すると、OpenClaw は最初にアカウントスコープのトップレベルの単一アカウントの値を `channels.<channel>.accounts.default` に移動し、元のアカウントが機能し続けるようにします。
- 既存のチャネルのみのバインディング (`accountId` なし) はデフォルトのアカウントと一致し続けます。アカウント スコープのバインディングはオプションのままです。
- `openclaw doctor --fix` は、名前付きアカウントが存在するが `default` が欠落している場合、アカウントをスコープとする最上位の単一アカウントの値を `accounts.default` に移動することにより、混合シェイプも修復します。

### その他の拡張チャネル

多くの拡張チャネルは `channels.<id>` として構成され、専用チャネル ページ (Feishu、Matrix、LINE、Nostr、Zalo、Nextcloud Talk、Synology Chat、Twitch など) に文書化されています。
完全なチャネル インデックスを参照してください: [チャネル](/channels)。

### グループチャットのメンションゲート

グループ メッセージはデフォルトで **メンションが必要** (メタデータのメンションまたは正規表現パターン) です。 WhatsApp、Telegram、Discord、Google Chat、および iMessage のグループ チャットに適用されます。

**メンションの種類:**- **メタデータのメンション**: ネイティブ プラットフォームの @-メンション。 WhatsApp セルフチャット モードでは無視されます。
- **テキスト パターン**: `agents.list[].groupChat.mentionPatterns` の正規表現パターン。常にチェックされています。
- メンション ゲートは、検出が可能な場合 (ネイティブ メンションまたは少なくとも 1 つのパターン) にのみ適用されます。

```json5
{
  messages: {
    groupChat: { historyLimit: 50 },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
````

`messages.groupChat.historyLimit` はグローバルなデフォルトを設定します。チャネルは `channels.<channel>.historyLimit` (またはアカウントごと) でオーバーライドできます。 `0` を無効に設定します。

#### DM 履歴の制限

```json5
{
  channels: {
    telegram: {
      dmHistoryLimit: 30,
      dms: {
        "123456789": { historyLimit: 50 },
      },
    },
  },
}
```

解決策: DM ごとのオーバーライド → プロバイダーのデフォルト → 制限なし (すべて保持)。

サポートされている: `telegram`、`whatsapp`、`discord`、`slack`、`signal`、`imessage`、`msteams`。

#### セルフチャットモード

セルフチャット モードを有効にするには、`allowFrom` に独自の番号を含めます (ネイティブの @-メンションを無視し、テキスト パターンにのみ応答します)。

```json5
{
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: { "*": { requireMention: true } },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: { mentionPatterns: ["reisponde", "@openclaw"] },
      },
    ],
  },
}
```

### コマンド (チャット コマンドの処理)

```json5
{
  commands: {
    native: "auto", // register native commands when supported
    text: true, // parse /commands in chat messages
    bash: false, // allow ! (alias: /bash)
    bashForegroundMs: 2000,
    config: false, // allow /config
    debug: false, // allow /debug
    restart: false, // allow /restart + gateway restart tool
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

<Accordion title="コマンド詳細">- テキスト コマンドは、先頭に `/` が付いた **スタンドアロン** メッセージである必要があります。

- `native: "auto"` は、Discord/Telegram のネイティブ コマンドをオンにし、Slack をオフのままにします。
- チャネルごとのオーバーライド: `channels.discord.commands.native` (ブール値または `"auto"`)。 `false` は、以前に登録されたコマンドをクリアします。
- `channels.telegram.customCommands` は、Telegram ボット メニュー エントリを追加します。
- `bash: true` は、ホスト シェルの `! <cmd>` を有効にします。 `tools.elevated.enabled` と `tools.elevated.allowFrom.<channel>` の送信者が必要です。
- `config: true` は `/config` を有効にします (`openclaw.json` の読み取り/書き込み)。ゲートウェイ `chat.send` クライアントの場合、永続的な `/config set|unset` 書き込みには `operator.admin` も必要です。読み取り専用 `/config show` は、通常の書き込みスコープのオペレーター クライアントで引き続き使用できます。
- `channels.<provider>.configWrites` はチャネルごとに構成の変更をゲートします (デフォルト: true)。
- `allowFrom` はプロバイダーごとです。設定すると、**唯一**の認証ソースになります (チャネル許可リスト/ペアリングと `useAccessGroups` は無視されます)。
- `useAccessGroups: false` を使用すると、`allowFrom` が設定されていない場合に、コマンドがアクセス グループ ポリシーをバイパスできます。

</Accordion>

---

## エージェントのデフォルト

### `agents.defaults.workspace`

デフォルト: `~/.openclaw/workspace`。

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

システム プロンプトのランタイム行に表示されるオプションのリポジトリ ルート。設定されていない場合、OpenClaw はワークスペースから上に向かって歩くことによって自動検出します。

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skipBootstrap`ワークスペース ブートストラップ ファイル (`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、 `BOOTSTRAP.md`)

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.bootstrapMaxChars`

切り詰められる前のワークスペース ブートストラップ ファイルあたりの最大文字数。デフォルト: `20000`。

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

すべてのワークスペース ブートストラップ ファイルに挿入される最大合計文字数。デフォルト: `150000`。

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 150000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

ブートストラップ コンテキストが切り詰められた場合に、エージェントに表示される警告テキストを制御します。
デフォルト: `"once"`。

- `"off"`: システム プロンプトに警告テキストを挿入しないでください。
- `"once"`: 一意の切り捨て署名ごとに 1 回警告を挿入します (推奨)。
- `"always"`: 切り捨てが存在する場合、実行ごとに警告を挿入します。

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### `agents.defaults.imageMaxDimensionPx`

プロバイダー呼び出し前のトランスクリプト/ツール画像ブロック内の最長画像側の最大ピクセル サイズ。
デフォルト: `1200`。

通常、値を低くすると、ビジョン トークンの使用量が減り、スクリーンショットを大量に使用する実行の場合に要求されるペイロード サイズが減ります。
値を大きくすると、視覚的な詳細がより多く保持されます。

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

システム プロンプト コンテキストのタイムゾーン (メッセージ タイムスタンプではありません)。ホストのタイムゾーンにフォールバックします。

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

システムプロンプトの時刻形式。デフォルト: `auto` (OS 設定)。

````json5
{
  agents: { defaults: { timeFormat: "auto" } }, // auto | 12 | 24
}
```### `agents.defaults.model`

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "minimax/MiniMax-M2.5": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.5"],
      },
      imageModel: {
        primary: "openrouter/qwen/qwen-2.5-vl-72b-instruct:free",
        fallbacks: ["openrouter/google/gemini-2.0-flash-vision:free"],
      },
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5-mini"],
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
      elevatedDefault: "on",
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      contextTokens: 200000,
      maxConcurrent: 3,
    },
  },
}
```- `model`: 文字列 (`"provider/model"`) またはオブジェクト (`{ primary, fallbacks }`) を受け入れます。
  ・文字列形式はプライマリモデルのみ設定します。
  - オブジェクト形式は、プライマリおよび順序付けされたフェイルオーバー モデルを設定します。
- `imageModel`: 文字列 (`"provider/model"`) またはオブジェクト (`{ primary, fallbacks }`) を受け入れます。
  - `image` ツール パスによってビジョン モデル構成として使用されます。
  - 選択/デフォルトのモデルが画像入力を受け入れられない場合のフォールバック ルーティングとしても使用されます。
- `pdfModel`: 文字列 (`"provider/model"`) またはオブジェクト (`{ primary, fallbacks }`) を受け入れます。
  - モデル ルーティング用の `pdf` ツールによって使用されます。
  - 省略した場合、PDF ツールは `imageModel` にフォールバックし、その後ベストエフォート型プロバイダーのデフォルトにフォールバックします。
- `pdfMaxBytesMb`: 呼び出し時に `maxBytesMb` が渡されない場合の、`pdf` ツールのデフォルトの PDF サイズ制限。
- `pdfMaxPages`: `pdf` ツールの抽出フォールバック モードで考慮されるデフォルトの最大ページ数。
- `model.primary`: `provider/model` の形式 (例: `anthropic/claude-opus-4-6`)。プロバイダーを省略した場合、OpenClaw は `anthropic` (非推奨) を想定します。
- `models`: `/model` の構成されたモデル カタログと許可リスト。各エントリには、`alias` (ショートカット) および `params` (プロバイダー固有、たとえば、`temperature`、`maxTokens`、`cacheRetention`、`context1m`) を含めることができます。- `params` マージ優先順位 (構成): `agents.defaults.models["provider/model"].params` がベースで、その後 `agents.list[].params` (エージェント ID と一致する) がキーによってオーバーライドされます。
- これらのフィールドを変更する構成ライター (`/models set`、`/models set-image`、およびフォールバック追加/削除コマンドなど) は、可能であれば正規のオブジェクト形式を保存し、既存のフォールバック リストを保存します。
- `maxConcurrent`: 最大並列エージェントはセッション間で実行されます (各セッションはまだシリアル化されています)。デフォルト: 1。

**組み込みのエイリアスの短縮表記** (モデルが `agents.defaults.models` の場合にのみ適用されます):

|別名 |モデル |
| ------------------- | -------------------------------------- |
| `opus` | `anthropic/claude-opus-4-6` |
| `sonnet` | `anthropic/claude-sonnet-4-6` |
| `gpt` | `openai/gpt-5.4` |
| `gpt-mini` | `openai/gpt-5-mini` |
| `gemini` | `google/gemini-3.1-pro-preview` |
| `gemini-flash` | `google/gemini-3-flash-preview` |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview` |

設定したエイリアスは常にデフォルトよりも優先されます。Z.AI GLM-4.x モデルは、`--thinking off` を設定するか、`agents.defaults.models["zai/<model>"].params.thinking` を自分で定義しない限り、思考モードを自動的に有効にします。
Z.AI モデルでは、ツール呼び出しストリーミングに対してデフォルトで `tool_stream` が有効になっています。無効にするには、`agents.defaults.models["zai/<model>"].params.tool_stream` を `false` に設定します。
Anthropic Claude 4.6 モデルは、明示的思考レベルが設定されていない場合、デフォルトで `adaptive` 思考になります。

### `agents.defaults.cliBackends`

テキストのみのフォールバック実行用のオプションの CLI バックエンド (ツール呼び出しなし)。 API プロバイダーに障害が発生した場合のバックアップとして役立ちます。

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          systemPromptArg: "--system",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
````

- CLI バックエンドはテキストファーストです。ツールは常に無効になっています。
- `sessionArg` が設定されている場合にサポートされるセッション。
- `imageArg` がファイル パスを受け入れる場合、イメージ パススルーがサポートされます。

### `agents.defaults.heartbeat`

定期的なハートビートが実行されます。

````json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m disables
        model: "openai/gpt-5.2-mini",
        includeReasoning: false,
        lightContext: false, // default: false; true keeps only HEARTBEAT.md from workspace bootstrap files
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (default) | block
        target: "none", // default: none | options: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
      },
    },
  },
}
```- `every`: 期間文字列 (ms/s/m/h)。デフォルト: `30m`。
- `suppressToolErrorWarnings`: true の場合、ハートビートの実行中にツール エラー警告ペイロードが抑制されます。
- `directPolicy`: 直接/DM 配信ポリシー。 `allow` (デフォルト) は、直接ターゲット配信を許可します。 `block` は直接ターゲットの配信を抑制し、`reason=dm-blocked` を発行します。
- `lightContext`: true の場合、ハートビートの実行では軽量ブートストラップ コンテキストが使用され、ワー​​クスペース ブートストラップ ファイルから `HEARTBEAT.md` のみが保持されます。
- エージェントごと: `agents.list[].heartbeat` を設定します。いずれかのエージェントが `heartbeat` を定義すると、**それらのエージェントのみ** がハートビートを実行します。
- ハートビートはエージェント ターン全体を実行します。間隔が短いほど、より多くのトークンが消費されます。

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        reserveTokensFloor: 24000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // used when identifierPolicy=custom
        postCompactionSections: ["Session Startup", "Red Lines"], // [] disables reinjection
        model: "openrouter/anthropic/claude-sonnet-4-5", // optional compaction-only model override
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```- `mode`: `default` または `safeguard` (長い履歴のチャンク化された要約)。 [圧縮](/concepts/compaction) を参照してください。
- `identifierPolicy`: `strict` (デフォルト)、`off`、または `custom`。 `strict` は、圧縮要約中に組み込みの不透明な識別子保持ガイダンスを先頭に追加します。
- `identifierInstructions`: `identifierPolicy=custom` の場合に使用されるオプションのカスタム識別子保存テキスト。
- `postCompactionSections`: 圧縮後に再挿入するオプションの AGENTS.md H2/H3 セクション名。デフォルトは `["Session Startup", "Red Lines"]` です。 `[]` を設定して再注入を無効にします。設定を解除するか、そのデフォルトのペアに明示的に設定すると、古い `Every Session`/`Safety` 見出しもレガシー フォールバックとして受け入れられます。
- `model`: 圧縮要約のみのオプションの `provider/model-id` オーバーライド。これは、メイン セッションで 1 つのモデルを保持する必要があるが、圧縮サマリーを別のモデルで実行する必要がある場合に使用します。設定されていない場合、圧縮ではセッションのプライマリ モデルが使用されます。
- `memoryFlush`: 耐久性のあるメモリを保存するための自動圧縮前のサイレント エージェント ターン。ワークスペースが読み取り専用の場合はスキップされます。

### `agents.defaults.contextPruning`

LLM に送信する前に、メモリ内コンテキストから **古いツールの結果** を削除します。ディスク上のセッション履歴は**変更されません**。

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // duration (ms/s/m/h), default unit: minutes
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Old tool result content cleared]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
````

<Accordion title="キャッシュ TTL モードの動作">- `mode: "cache-ttl"` はプルーニング パスを有効にします。

- `ttl` は、プルーニングを再度実行できる頻度 (最後のキャッシュ タッチ後) を制御します。
- プルーニングでは、まずサイズの大きいツール結果がソフト トリムされ、次に必要に応じて古いツール結果がハードクリアされます。

**ソフトトリム**は、先頭と末尾を維持し、途中に `...` を挿入します。

**ハードクリア** は、ツールの結果全体をプレースホルダーに置き換えます。

注:

- 画像ブロックは決してトリミング/クリアされません。
- 比率は文字ベース (概算) であり、正確なトークン数ではありません。
- 存在するアシスタント メッセージが `keepLastAssistants` 未満の場合、プルーニングはスキップされます。

</Accordion>

動作の詳細については、[セッション プルーニング](/concepts/session-pruning) を参照してください。

### ストリーミングをブロックする

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (use minMs/maxMs)
    },
  },
}
```

- Telegram 以外のチャネルでは、ブロック応答を有効にするには明示的な `*.blockStreaming: true` が必要です。
- チャネル オーバーライド: `channels.<channel>.blockStreamingCoalesce` (およびアカウントごとのバリアント)。 Signal/Slack/Discord/Google Chat のデフォルト `minChars: 1500`。
- `humanDelay`: ブロック返信間のランダムな一時停止。 `natural` = 800 ～ 2500 ミリ秒。エージェントごとのオーバーライド: `agents.list[].humanDelay`。

動作とチャンク化の詳細については、[ストリーミング](/concepts/streaming) を参照してください。

### タイピングインジケーター

```json5
{
  agents: {
    defaults: {
      typingMode: "instant", // never | instant | thinking | message
      typingIntervalSeconds: 6,
    },
  },
}
```

- デフォルト: 直接チャット/メンションの場合は `instant`、言及されていないグループ チャットの場合は `message`。
- セッションごとのオーバーライド: `session.typingMode`、`session.typingIntervalSeconds`。

[タイピングインジケーター](/concepts/typing-indicators) を参照してください。

### `agents.defaults.sandbox`埋め込みエージェント用のオプションの **Docker サンドボックス**。完全なガイドについては、[サンドボックス](/gateway/sandboxing) を参照してください

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        scope: "agent", // session | agent | shared
        workspaceAccess: "none", // none | ro | rw
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          containerPrefix: "openclaw-sbx-",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
          capDrop: ["ALL"],
          env: { LANG: "C.UTF-8" },
          setupCommand: "apt-get update && apt-get install -y git curl jq",
          pidsLimit: 256,
          memory: "1g",
          memorySwap: "2g",
          cpus: 1,
          ulimits: {
            nofile: { soft: 1024, hard: 2048 },
            nproc: 256,
          },
          seccompProfile: "/path/to/seccomp.json",
          apparmorProfile: "openclaw-sandbox",
          dns: ["1.1.1.1", "8.8.8.8"],
          extraHosts: ["internal.service:10.0.0.5"],
          binds: ["/home/user/source:/source:rw"],
        },
        browser: {
          enabled: false,
          image: "openclaw-sandbox-browser:bookworm-slim",
          network: "openclaw-sandbox-browser",
          cdpPort: 9222,
          cdpSourceRange: "172.21.0.1/32",
          vncPort: 5900,
          noVncPort: 6080,
          headless: false,
          enableNoVnc: true,
          allowHostControl: false,
          autoStart: true,
          autoStartTimeoutMs: 12000,
        },
        prune: {
          idleHours: 24,
          maxAgeDays: 7,
        },
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        allow: [
          "exec",
          "process",
          "read",
          "write",
          "edit",
          "apply_patch",
          "sessions_list",
          "sessions_history",
          "sessions_send",
          "sessions_spawn",
          "session_status",
        ],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"],
      },
    },
  },
}
```

<Accordion title="サンドボックスの詳細">

**ワークスペースへのアクセス:**

- `none`: `~/.openclaw/sandboxes` の下のスコープごとのサンドボックス ワークスペース
- `ro`: サンドボックス ワークスペースは `/workspace`、エージェント ワークスペースは `/agent` に読み取り専用でマウントされています
- `rw`: エージェント ワークスペースは `/workspace` に読み取り/書き込み可能にマウントされました

**範囲:**

- `session`: セッションごとのコンテナ + ワークスペース
- `agent`: エージェントごとに 1 つのコンテナ + ワークスペース (デフォルト)
- `shared`: 共有コンテナーとワークスペース (セッション間の分離なし)

**`setupCommand`** は、コンテナーの作成後に 1 回実行されます (`sh -lc` 経由)。ネットワーク出力、書き込み可能な root、root ユーザーが必要です。

**コンテナのデフォルトは `network: "none"`** です。エージェントが送信アクセスを必要とする場合は、`"bridge"` (またはカスタム ブリッジ ネットワーク) に設定されます。
`"host"` はブロックされています。 `"container:<id>"` は、明示的に設定しない限り、デフォルトでブロックされます
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (ガラス破り)。

**受信添付ファイル**は、アクティブなワークスペースの `media/inbound/*` にステージングされます。

**`docker.binds`** は追加のホスト ディレクトリをマウントします。グローバル バインドとエージェントごとのバインドがマージされます。**サンドボックス ブラウザ** (`sandbox.browser.enabled`): コンテナ内の Chromium + CDP。 noVNC URL がシステム プロンプトに挿入されました。 `openclaw.json` に `browser.enabled` は必要ありません。
noVNC オブザーバー アクセスでは、デフォルトで VNC 認証が使用され、OpenClaw は (共有 URL でパスワードを公開する代わりに) 有効期間の短いトークン URL を発行します。- `allowHostControl: false` (デフォルト) は、サンドボックス化されたセッションがホスト ブラウザーをターゲットにすることをブロックします。

- `network` のデフォルトは `openclaw-sandbox-browser` (専用ブリッジ ネットワーク) です。明示的にグローバル ブリッジ接続が必要な場合にのみ、`bridge` に設定します。
- `cdpSourceRange` は、オプションでコンテナ エッジでの CDP イングレスを CIDR 範囲に制限します (`172.21.0.1/32` など)。
- `sandbox.browser.binds` は、追加のホスト ディレクトリをサンドボックス ブラウザ コンテナのみにマウントします。設定すると (`[]` を含む)、ブラウザー コンテナーの `docker.binds` が置き換えられます。
- 起動デフォルトは `scripts/sandbox-browser-entrypoint.sh` で定義され、コンテナー ホスト用に調整されています。
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-3d-apis`
  - `--disable-gpu`
  - `--disable-software-rasterizer`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-features=TranslateUI`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--renderer-process-limit=2`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--disable-extensions` (デフォルトで有効)
  - `--disable-3d-apis`、`--disable-software-rasterizer`、および `--disable-gpu` は
    デフォルトで有効になっており、次のコマンドで無効にできます
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` WebGL/3D の使用に必要な場合。
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` は、ワークフローが次の場合に拡張機能を再度有効にします。
    彼ら次第です。
  - `--renderer-process-limit=2` は次のように変更できます。
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; Chromium を使用するように `0` を設定します
    デフォルトのプロセス制限。- `noSandbox` が有効な場合は、`--no-sandbox` および `--disable-setuid-sandbox` が追加されます。
  - デフォルトはコンテナイメージのベースラインです。カスタムのブラウザ画像をカスタムで使用する
    コンテナのデフォルトを変更するためのエントリポイント。

</Accordion>

イメージをビルドします。

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

### `agents.list` (エージェントごとの上書き)

````json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "Main Agent",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // or { primary, fallbacks }
        params: { cacheRetention: "none" }, // overrides matching defaults.models params by key
        identity: {
          name: "Samantha",
          theme: "helpful sloth",
          emoji: "🦥",
          avatar: "avatars/samantha.png",
        },
        groupChat: { mentionPatterns: ["@openclaw"] },
        sandbox: { mode: "off" },
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
        subagents: { allowAgents: ["*"] },
        tools: {
          profile: "coding",
          allow: ["browser"],
          deny: ["canvas"],
          elevated: { enabled: true },
        },
      },
    ],
  },
}
```- `id`: 安定したエージェント ID (必須)。
- `default`: 複数が設定されている場合、最初が優先されます (警告がログに記録されます)。何も設定されていない場合は、最初のリスト エントリがデフォルトになります。
- `model`: 文字列形式は `primary` のみをオーバーライドします。オブジェクト フォーム `{ primary, fallbacks }` は両方をオーバーライドします (`[]` はグローバル フォールバックを無効にします)。 `primary` をオーバーライドするだけの Cron ジョブは、`fallbacks: []` を設定しない限り、デフォルトのフォールバックを継承します。
- `params`: `agents.defaults.models` で選択されたモデル エントリにマージされたエージェントごとのストリーム パラメーター。これは、モデル カタログ全体を複製せずに、`cacheRetention`、`temperature`、`maxTokens` などのエージェント固有のオーバーライドに使用します。
- `runtime`: オプションのエージェントごとのランタイム記述子。エージェントがデフォルトで ACP ハーネス セッションを使用する必要がある場合は、`type: "acp"` を `runtime.acp` デフォルト (`agent`、`backend`、`mode`、`cwd`) とともに使用します。
- `identity.avatar`: ワークスペース相対パス、`http(s)` URL、または `data:` URI。
- `identity` はデフォルトを派生します: `emoji` から `ackReaction`、`name`/`emoji` から `mentionPatterns`。
- `subagents.allowAgents`: `sessions_spawn` のエージェント ID の許可リスト (`["*"]` = 任意、デフォルト: 同じエージェントのみ)。
- サンドボックス継承ガード: リクエスター セッションがサンドボックス化されている場合、`sessions_spawn` はサンドボックス化されずに実行されるターゲットを拒否します。

---## マルチエージェントルーティング

1 つのゲートウェイ内で複数の分離されたエージェントを実行します。 [マルチエージェント](/concepts/multi-agent) を参照してください。

```json5
{
  agents: {
    list: [
      { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
      { id: "work", workspace: "~/.openclaw/workspace-work" },
    ],
  },
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
  ],
}
````

### 一致フィールドのバインディング

- `type` (オプション): 通常のルーティングの場合は `route` (タイプが欠落している場合はデフォルトでルーティングされます)、永続的な ACP 会話バインディングの場合は `acp`。
- `match.channel` (必須)
- `match.accountId` (オプション; `*` = 任意のアカウント; 省略 = デフォルトのアカウント)
- `match.peer` (オプション; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (オプション、チャネル固有)
- `acp` (オプション; `type: "acp"` のみ): `{ mode, label, cwd, backend }`

**決定的な一致順序:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (正確、ピア/ギルド/チームなし)
5. `match.accountId: "*"` (チャネル全体)
6. デフォルトエージェント

各層内で、最初に一致した `bindings` エントリが優先されます。

`type: "acp"` エントリの場合、OpenClaw は正確な会話 ID (`match.channel` + アカウント + `match.peer.id`) によって解決し、上記のルート バインディング層の順序は使用しません。

### エージェントごとのアクセス プロファイル

<Accordion title="フルアクセス (サンドボックスなし)">

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="読み取り専用ツール + ワークスペース">

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "ro" },
        tools: {
          allow: [
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="ファイルシステムへのアクセスなし (メッセージングのみ)">

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "none" },
        tools: {
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
            "gateway",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

</Accordion>

優先順位の詳細については、[マルチエージェント サンドボックスとツール](/tools/multi-agent-sandbox-tools) を参照してください。

---

## セッション

```json5
{
  session: {
    scope: "per-sender",
    dmScope: "main", // main | per-peer | per-channel-peer | per-account-channel-peer
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      mode: "daily", // daily | idle
      atHour: 4,
      idleMinutes: 60,
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      direct: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    parentForkMaxTokens: 100000, // skip parent-thread fork above this token count (0 disables)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // duration or false
      maxDiskBytes: "500mb", // optional hard budget
      highWaterBytes: "400mb", // optional cleanup target
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // default inactivity auto-unfocus in hours (`0` disables)
      maxAgeHours: 0, // default hard max age in hours (`0` disables)
    },
    mainKey: "main", // legacy (runtime always uses "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="セッションフィールドの詳細">- **`dmScope`**: DM がグループ化される方法。

- `main`: すべての DM がメイン セッションを共有します。
- `per-peer`: チャネル間で送信者 ID によって分離します。
- `per-channel-peer`: チャネル + 送信者ごとに分離します (マルチユーザーの受信箱に推奨)。
- `per-account-channel-peer`: アカウント + チャネル + 送信者ごとに分離します (複数のアカウントに推奨)。
- **`identityLinks`**: クロスチャネルセッション共有のために、正規 ID をプロバイダープレフィックス付きのピアにマップします。
- **`reset`**: プライマリ リセット ポリシー。 `daily` は現地時間の `atHour` にリセットされます。 `idle` は `idleMinutes` の後にリセットされます。両方が設定されている場合は、先に期限が切れた方が優先されます。
- **`resetByType`**: タイプごとのオーバーライド (`direct`、`group`、`thread`)。レガシー `dm` は `direct` のエイリアスとして受け入れられます。
- **`parentForkMaxTokens`**: フォークされたスレッド セッションの作成時に許可される最大親セッション `totalTokens` (デフォルト `100000`)。
  - 親 `totalTokens` がこの値を超えている場合、OpenClaw は親トランスクリプト履歴を継承する代わりに、新しいスレッド セッションを開始します。
  - このガードを無効にし、常に親のフォークを許可するには、`0` を設定します。
- **`mainKey`**: 従来のフィールド。ランタイムは、メインのダイレクト チャット バケットに常に `"main"` を使用するようになりました。- **`sendPolicy`**: `channel`、`chatType` (`direct|group|channel`、従来の `dm` エイリアスを使用)、`keyPrefix`、または `rawKeyPrefix` による一致。最初に拒否した方が勝ちです。
- **`maintenance`**: セッション ストアのクリーンアップ + 保持制御。
  - `mode`: `warn` は警告のみを発行します。 `enforce` はクリーンアップを適用します。
  - `pruneAfter`: 古いエントリの期限切れ (デフォルト `30d`)。
  - `maxEntries`: `sessions.json` のエントリの最大数 (デフォルトは `500`)。
  - `rotateBytes`: このサイズを超える場合、`sessions.json` を回転します (デフォルト `10mb`)。
  - `resetArchiveRetention`: `*.reset.<timestamp>` トランスクリプト アーカイブの保持。デフォルトは `pruneAfter` です。 `false` を無効に設定します。
  - `maxDiskBytes`: オプションのセッション ディレクトリのディスク バジェット。 `warn` モードでは、警告がログに記録されます。 `enforce` モードでは、最も古いアーティファクト/セッションが最初に削除されます。
  - `highWaterBytes`: 予算クリーンアップ後のオプションのターゲット。デフォルトは `80%` または `maxDiskBytes` です。
- **`threadBindings`**: スレッドバインドされたセッション機能のグローバルデフォルト。
  - `enabled`: マスターデフォルトスイッチ (プロバイダーは上書き可能; Discord は `channels.discord.threadBindings.enabled` を使用します)
  - `idleHours`: デフォルトの非アクティブ状態は時間単位で自動的にフォーカスを解除します (`0` は無効になります。プロバイダーはオーバーライドできます)- `maxAgeHours`: デフォルトのハードマックス経過時間 (`0` は無効になります。プロバイダーはオーバーライドできます)

</Accordion>

---

## メッセージ

```json5
{
  messages: {
    responsePrefix: "🦞", // or "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "collect", // steer | followup | collect | steer-backlog | steer+backlog | queue | interrupt
      debounceMs: 1000,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "collect",
        telegram: "collect",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 disables
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### 応答プレフィックス

チャネル/アカウントごとのオーバーライド: `channels.<channel>.responsePrefix`、`channels.<channel>.accounts.<id>.responsePrefix`。

解決策 (最も具体的な勝利): アカウント → チャネル → グローバル。 `""` はカスケードを無効にして停止します。 `"auto"` は `[{identity.name}]` を派生させます。

**テンプレート変数:**

| 変数              | 説明               | 例                          |
| ----------------- | ------------------ | --------------------------- |
| `{model}`         | 短いモデル名       | `claude-opus-4-6`           |
| `{modelFull}`     | 完全なモデル識別子 | `anthropic/claude-opus-4-6` |
| `{provider}`      | プロバイダー名     | `anthropic`                 |
| `{thinkingLevel}` | 現在の思考レベル   | `high`、`low`、`off`        |
| `{identity.name}` | エージェント ID 名 | (`"auto"` と同じ)           |

変数では大文字と小文字が区別されません。 `{think}` は、`{thinkingLevel}` のエイリアスです。

### ACK反応- デフォルトはアクティブなエージェントの `identity.emoji`、それ以外の場合は `"👀"` です。 `""` を無効に設定します

- チャネルごとのオーバーライド: `channels.<channel>.ackReaction`、`channels.<channel>.accounts.<id>.ackReaction`。
- 解決順序: アカウント → チャネル → `messages.ackReaction` → ID フォールバック。
- スコープ: `group-mentions` (デフォルト)、`group-all`、`direct`、`all`。
- `removeAckAfterReply`: 返信後の確認応答を削除します (Slack/Discord/Telegram/Google Chat のみ)。

### インバウンドデバウンス

同じ送信者からのテキストのみの迅速なメッセージを 1 つのエージェント ターンにバッチ処理します。メディア/添付ファイルはすぐにフラッシュされます。制御コマンドはデバウンスをバイパスします。

### TTS (テキスト読み上げ)

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      elevenlabs: {
        apiKey: "elevenlabs_api_key",
        baseUrl: "https://api.elevenlabs.io",
        voiceId: "voice_id",
        modelId: "eleven_multilingual_v2",
        seed: 42,
        applyTextNormalization: "auto",
        languageCode: "en",
        voiceSettings: {
          stability: 0.5,
          similarityBoost: 0.75,
          style: 0.0,
          useSpeakerBoost: true,
          speed: 1.0,
        },
      },
      openai: {
        apiKey: "openai_api_key",
        baseUrl: "https://api.openai.com/v1",
        model: "gpt-4o-mini-tts",
        voice: "alloy",
      },
    },
  },
}
```

- `auto` は自動 TTS を制御します。 `/tts off|always|inbound|tagged` はセッションごとにオーバーライドされます。
- `summaryModel` は、自動要約の `agents.defaults.model.primary` をオーバーライドします。
- `modelOverrides` はデフォルトで有効になっています。 `modelOverrides.allowProvider` のデフォルトは `false` (オプトイン) です。
- API キーは `ELEVENLABS_API_KEY`/`XI_API_KEY` および `OPENAI_API_KEY` にフォールバックします。
- `openai.baseUrl` は OpenAI TTS エンドポイントをオーバーライドします。解決順序は、config、次に `OPENAI_TTS_BASE_URL`、次に `https://api.openai.com/v1` です。
- `openai.baseUrl` が非 OpenAI エンドポイントを指している場合、OpenClaw はそれを OpenAI 互換の TTS サーバーとして扱い、モデル/音声の検証を緩和します。

---

## 話す

トーク モードのデフォルト (macOS/iOS/Android)。

````json5
{
  talk: {
    voiceId: "elevenlabs_voice_id",
    voiceAliases: {
      Clawd: "EXAVITQu4vr4xnSDxMaL",
      Roger: "CwhRBWXzGAHq8TQ4Fs17",
    },
    modelId: "eleven_v3",
    outputFormat: "mp3_44100_128",
    apiKey: "elevenlabs_api_key",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```- 音声 ID は `ELEVENLABS_VOICE_ID` または `SAG_VOICE_ID` にフォールバックします。
- `apiKey` および `providers.*.apiKey` は、プレーンテキスト文字列または SecretRef オブジェクトを受け入れます。
- `ELEVENLABS_API_KEY` フォールバックは、Talk API キーが設定されていない場合にのみ適用されます。
- `voiceAliases` により、Talk ディレクティブにフレンドリ名を使用できるようになります。
- `silenceTimeoutMs` は、ユーザーが沈黙した後、トランスクリプトを送信するまでトーク モードが待機する時間を制御します。設定を解除すると、プラットフォームのデフォルトの一時停止ウィンドウ (`700 ms on macOS and Android, 900 ms on iOS`) が維持されます。

---

## ツール

### 工具プロファイル

`tools.profile` は、`tools.allow`/`tools.deny` の前に基本ホワイトリストを設定します。

ローカル オンボーディングは、設定を解除すると、新しいローカル構成をデフォルトで `tools.profile: "coding"` に設定します (既存の明示的なプロファイルは保持されます)。

|プロフィール |含まれるもの |
| ----------- | ----------------------------------------------------------------------------------------- |
| `minimal` | `session_status` のみ |
| `coding` | `group:fs`、`group:runtime`、`group:sessions`、`group:memory`、`image` |
| `messaging` | `group:messaging`、`sessions_list`、`sessions_history`、`sessions_send`、`session_status` |
| `full` |制限なし（未設定と同じ） |### ツールグループ|グループ |ツール |
| ------------------ | -------------------------------------------------------------------------------------- |
| `group:runtime` | `exec`、`process` (`bash` は `exec` のエイリアスとして受け入れられます)
| `group:fs` | `read`、`write`、`edit`、`apply_patch` |
| `group:sessions` | `sessions_list`、`sessions_history`、`sessions_send`、`sessions_spawn`、`session_status` |
| `group:memory` | `memory_search`、`memory_get` |
| `group:web` | `web_search`、`web_fetch` |
| `group:ui` | `browser`、`canvas` |
| `group:automation` | `cron`、`gateway` |
| `group:messaging` | `message` || `group:nodes` | `nodes` |
| `group:openclaw` |すべての組み込みツール (プロバイダー プラグインを除く) |

### `tools.allow` / `tools.deny`

グローバル ツールの許可/拒否ポリシー (拒否の勝利)。大文字と小文字は区別されず、`*` ワイルドカードをサポートします。 Docker サンドボックスがオフの場合でも適用されます。

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
````

### `tools.byProvider`

特定のプロバイダーまたはモデル用のツールをさらに制限します。順序: 基本プロファイル → プロバイダー プロファイル → 許可/拒否。

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
      "openai/gpt-5.2": { allow: ["group:fs", "sessions_list"] },
    },
  },
}
```

### `tools.elevated`

昇格された (ホスト) 実行アクセスを制御します。

```json5
{
  tools: {
    elevated: {
      enabled: true,
      allowFrom: {
        whatsapp: ["+15555550123"],
        discord: ["1234567890123", "987654321098765432"],
      },
    },
  },
}
```

- エージェントごとのオーバーライド (`agents.list[].tools.elevated`) は、さらに制限することしかできません。
- `/elevated on|off|ask|full` はセッションごとの状態を保存します。インラインディレクティブは単一のメッセージに適用されます。
- 昇格された `exec` がホスト上で実行され、サンドボックスがバイパスされます。

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.2"],
      },
    },
  },
}
```

### `tools.loopDetection`

ツールループの安全性チェックは **デフォルトでは無効になっています**。 `enabled: true` を設定して検出を有効にします。
設定は `tools.loopDetection` でグローバルに定義でき、`agents.list[].tools.loopDetection` でエージェントごとに上書きできます。

````json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```- `historySize`: ループ解析のために保持される最大ツール呼び出し履歴。
- `warningThreshold`: 警告に対する進行なしパターンのしきい値を繰り返します。
- `criticalThreshold`: クリティカルなループをブロックするためのより高い繰り返ししきい値。
- `globalCircuitBreakerThreshold`: 進行状況のない実行に対するハードストップのしきい値。
- `detectors.genericRepeat`: 同じツール/同じ引数の繰り返し呼び出しを警告します。
- `detectors.knownPollNoProgress`: 既知の投票ツール (`process.poll`、`command_status` など) に対して警告/ブロックします。
- `detectors.pingPong`: 交互に進行しないペアのパターンを警告/ブロックします。
- `warningThreshold >= criticalThreshold` または `criticalThreshold >= globalCircuitBreakerThreshold` の場合、検証は失敗します。

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // or BRAVE_API_KEY env
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        maxChars: 50000,
        maxCharsCap: 50000,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        userAgent: "custom-ua",
      },
    },
  },
}
````

### `tools.media`

インバウンドメディア理解 (画像/音声/ビデオ) を構成します。

```json5
{
  tools: {
    media: {
      concurrency: 2,
      audio: {
        enabled: true,
        maxBytes: 20971520,
        scope: {
          default: "deny",
          rules: [{ action: "allow", match: { chatType: "direct" } }],
        },
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          { type: "cli", command: "whisper", args: ["--model", "base", "{{MediaPath}}"] },
        ],
      },
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },
}
```

<Accordion title="メディアモデル入力フィールド">

**プロバイダーエントリ** (`type: "provider"` または省略):

- `provider`: API プロバイダー ID (`openai`、`anthropic`、`google`/`gemini`、`groq` など)
- `model`: モデル ID の上書き
- `profile` / `preferredProfile`: `auth-profiles.json` プロファイルの選択

**CLI エントリ** (`type: "cli"`):

- `command`: 実行する実行可能ファイル
- `args`: テンプレート化された引数 (`{{MediaPath}}`、`{{Prompt}}`、`{{MaxChars}}` などをサポート)

**共通フィールド:**- `capabilities`: オプションのリスト (`image`、`audio`、`video`)。デフォルト: `openai`/`anthropic`/`minimax` → 画像、`google` → 画像+音声+ビデオ、`groq` → 音声。

- `prompt`、`maxChars`、`maxBytes`、`timeoutSeconds`、`language`: エントリごとの上書き。
- 失敗は次のエントリにフォールバックします。

プロバイダー認証は標準の順序に従います: `auth-profiles.json` → 環境変数 → `models.providers.*.apiKey`。

</Accordion>

### `tools.agentToAgent`

```json5
{
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },
}
```

### `tools.sessions`

セッション ツール (`sessions_list`、`sessions_history`、`sessions_send`) の対象にできるセッションを制御します。

デフォルト: `tree` (現在のセッション + それによって生成されたセッション (サブエージェントなど))。

```json5
{
  tools: {
    sessions: {
      // "self" | "tree" | "agent" | "all"
      visibility: "tree",
    },
  },
}
```

注:

- `self`: 現在のセッション キーのみ。
- `tree`: 現在のセッション + 現在のセッションによって生成されたセッション (サブエージェント)。
- `agent`: 現在のエージェント ID に属する任意のセッション (同じエージェント ID で送信者ごとのセッションを実行する場合は、他のユーザーを含めることができます)。
- `all`: 任意のセッション。クロスエージェントターゲティングには引き続き `tools.agentToAgent` が必要です。
- サンドボックス クランプ: 現在のセッションがサンドボックス化されており、`agents.defaults.sandbox.sessionToolsVisibility="spawned"` である場合、`tools.sessions.visibility="all"` であっても、可視性は強制的に `tree` に設定されます。

### `tools.sessions_spawn`

`sessions_spawn` のインライン添付ファイルのサポートを制御します。

````json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // opt-in: set true to allow inline file attachments
        maxTotalBytes: 5242880, // 5 MB total across all files
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB per file
        retainOnSessionKeep: false, // keep attachments when cleanup="keep"
      },
    },
  },
}
```注:

- 添付ファイルは `runtime: "subagent"` でのみサポートされます。 ACP ランタイムはそれらを拒否します。
- ファイルは、`.manifest.json` を使用して、`.openclaw/attachments/<uuid>/` の子ワークスペースに実体化されます。
- 添付ファイルのコンテンツは、トランスクリプトの永続性から自動的に編集されます。
- Base64 入力は、厳密なアルファベット/パディング チェックとプリデコード サイズ ガードによって検証されます。
- ファイル権限は、ディレクトリの場合は `0700`、ファイルの場合は `0600` です。
- クリーンアップは `cleanup` ポリシーに従います。 `delete` は常に添付ファイルを削除します。 `keep` は、`retainOnSessionKeep: true` の場合にのみそれらを保持します。

### `tools.subagents`

```json5
{
  agents: {
    defaults: {
      subagents: {
        model: "minimax/MiniMax-M2.5",
        maxConcurrent: 1,
        runTimeoutSeconds: 900,
        archiveAfterMinutes: 60,
      },
    },
  },
}
````

- `model`: 生成されたサブエージェントのデフォルト モデル。省略した場合、サブエージェントは呼び出し元のモデルを継承します。
- `runTimeoutSeconds`: ツール呼び出しで `runTimeoutSeconds` が省略された場合の `sessions_spawn` のデフォルトのタイムアウト (秒)。 `0` はタイムアウトがないことを意味します。
- サブエージェントごとのツール ポリシー: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`。

---

## カスタムプロバイダーとベース URL

OpenClaw は、pi-coding-agent モデル カタログを使用します。構成内の `models.providers` または `~/.openclaw/agents/<agentId>/agent/models.json` を介してカスタム プロバイダーを追加します。

````json5
{
  models: {
    mode: "merge", // merge (default) | replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai
        models: [
          {
            id: "llama-3.1-8b",
            name: "Llama 3.1 8B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```- カスタム認証が必要な場合は、`authHeader: true` + `headers` を使用します。
- エージェント設定ルートを `OPENCLAW_AGENT_DIR` (または `PI_CODING_AGENT_DIR`) でオーバーライドします。
- 一致するプロバイダー ID のマージの優先順位:
  - 空ではないエージェント `models.json` `baseUrl` 値が優先されます。
  - 空ではないエージェント `apiKey` 値は、そのプロバイダーが現在の構成/認証プロファイル コンテキストで SecretRef で管理されていない場合にのみ優先されます。
  - SecretRef 管理プロバイダーの `apiKey` 値は、解決されたシークレットを保持するのではなく、ソース マーカー (環境参照の場合は `ENV_VAR_NAME`、ファイル/実行参照の場合は `secretref-managed`) から更新されます。
  - 空または欠落しているエージェント `apiKey`/`baseUrl` は、構成内の `models.providers` にフォールバックします。
  - マッチングモデル `contextWindow`/`maxTokens` は、明示的な構成値と暗黙的なカタログ値の間の高い値を使用します。
  - 構成で `models.json` を完全に書き換える場合は、`models.mode: "replace"` を使用します。

### プロバイダーフィールドの詳細- `models.mode`: プロバイダー カタログの動作 (`merge` または `replace`)。
- `models.providers`: プロバイダー ID をキーとするカスタム プロバイダー マップ。
- `models.providers.*.api`: アダプターを要求します (`openai-completions`、`openai-responses`、`anthropic-messages`、`google-generative-ai` など)。
- `models.providers.*.apiKey`: プロバイダーの資格情報 (SecretRef/env 置換を推奨)。
- `models.providers.*.auth`: 認証戦略 (`api-key`、`token`、`oauth`、`aws-sdk`)。
- `models.providers.*.injectNumCtxForOpenAICompat`: Ollama + `openai-completions` の場合、`options.num_ctx` をリクエストに挿入します (デフォルト: `true`)。
- `models.providers.*.authHeader`: 必要に応じて、`Authorization` ヘッダーで資格情報のトランスポートを強制します。
- `models.providers.*.baseUrl`: アップストリーム API ベース URL。
- `models.providers.*.headers`: プロキシ/テナント ルーティング用の追加の静的ヘッダー。
- `models.providers.*.models`: 明示的なプロバイダー モデル カタログ エントリ。
- `models.providers.*.models.*.compat.supportsDeveloperRole`: オプションの互換性ヒント。空ではない非ネイティブ `baseUrl` (`api.openai.com` ではないホスト) を持つ `api: "openai-completions"` の場合、OpenClaw は実行時にこれを強制的に `false` に設定します。空または省略された `baseUrl` は、デフォルトの OpenAI 動作を維持します。
- `models.bedrockDiscovery`: Bedrock 自動検出設定のルート。
- `models.bedrockDiscovery.enabled`: 検出ポーリングをオン/オフにします。
- `models.bedrockDiscovery.region`: 検出用の AWS リージョン。
- `models.bedrockDiscovery.providerFilter`: ターゲットを絞った検出のためのオプションのプロバイダー ID フィルター。
- `models.bedrockDiscovery.refreshInterval`: 検出更新のポーリング間隔。- `models.bedrockDiscovery.defaultContextWindow`: 検出されたモデルのフォールバック コンテキスト ウィンドウ。
- `models.bedrockDiscovery.defaultMaxTokens`: 検出されたモデルのフォールバック最大出力トークン。

### プロバイダーの例

<Accordion title="Cerebras (GLM 4.6 / 4.7)">

```json5
{
  env: { CEREBRAS_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: {
        primary: "cerebras/zai-glm-4.7",
        fallbacks: ["cerebras/zai-glm-4.6"],
      },
      models: {
        "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
        "cerebras/zai-glm-4.6": { alias: "GLM 4.6 (Cerebras)" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      cerebras: {
        baseUrl: "https://api.cerebras.ai/v1",
        apiKey: "${CEREBRAS_API_KEY}",
        api: "openai-completions",
        models: [
          { id: "zai-glm-4.7", name: "GLM 4.7 (Cerebras)" },
          { id: "zai-glm-4.6", name: "GLM 4.6 (Cerebras)" },
        ],
      },
    },
  },
}
````

大脳には `cerebras/zai-glm-4.7` を使用します。 Z.AI ダイレクトの `zai/glm-4.7`。

</Accordion>

<Accordion title="OpenCode Zen">

```json5
{
  agents: {
    defaults: {
      model: { primary: "opencode/claude-opus-4-6" },
      models: { "opencode/claude-opus-4-6": { alias: "Opus" } },
    },
  },
}
```

`OPENCODE_API_KEY` (または `OPENCODE_ZEN_API_KEY`) を設定します。ショートカット: `openclaw onboard --auth-choice opencode-zen`。

</Accordion>

<Accordion title="Z.AI（GLM-4.7）">

```json5
{
  agents: {
    defaults: {
      model: { primary: "zai/glm-4.7" },
      models: { "zai/glm-4.7": {} },
    },
  },
}
```

`ZAI_API_KEY` を設定します。 `z.ai/*` および `z-ai/*` は別名として受け入れられます。ショートカット: `openclaw onboard --auth-choice zai-api-key`。

- 一般エンドポイント: `https://api.z.ai/api/paas/v4`
- コーディングエンドポイント (デフォルト): `https://api.z.ai/api/coding/paas/v4`
- 一般的なエンドポイントの場合、ベース URL オーバーライドを使用してカスタム プロバイダーを定義します。

</Accordion>

<Accordion title="ムーンショットAI（キミ）">

```json5
{
  env: { MOONSHOT_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "moonshot/kimi-k2.5" },
      models: { "moonshot/kimi-k2.5": { alias: "Kimi K2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "kimi-k2.5",
            name: "Kimi K2.5",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 256000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

中国エンドポイントの場合: `baseUrl: "https://api.moonshot.cn/v1"` または `openclaw onboard --auth-choice moonshot-api-key-cn`。

</Accordion>

<Accordion title="キミコーディング">

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "kimi-coding/k2p5" },
      models: { "kimi-coding/k2p5": { alias: "Kimi K2.5" } },
    },
  },
}
```

Anthropic 互換の組み込みプロバイダー。ショートカット: `openclaw onboard --auth-choice kimi-code-api-key`。

</Accordion>

<Accordion title="合成 (人為的互換性)">

```json5
{
  env: { SYNTHETIC_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
      models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "hf:MiniMaxAI/MiniMax-M2.5",
            name: "MiniMax M2.5",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 192000,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

ベース URL は `/v1` を省略する必要があります (Anthropic クライアントが追加します)。ショートカット: `openclaw onboard --auth-choice synthetic-api-key`。

</Accordion>

<Accordion title="MiniMax M2.5 (直接)">

```json5
{
  agents: {
    defaults: {
      model: { primary: "minimax/MiniMax-M2.5" },
      models: {
        "minimax/MiniMax-M2.5": { alias: "Minimax" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      minimax: {
        baseUrl: "https://api.minimax.io/anthropic",
        apiKey: "${MINIMAX_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "MiniMax-M2.5",
            name: "MiniMax M2.5",
            reasoning: false,
            input: ["text"],
            cost: { input: 15, output: 60, cacheRead: 2, cacheWrite: 10 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

`MINIMAX_API_KEY` を設定します。ショートカット: `openclaw onboard --auth-choice minimax-api`。

</Accordion>

<Accordion title="ローカルモデル (LM Studio)">[ローカル モデル](/gateway/local-models) を参照してください。 TL;DR: 本格的なハードウェアで LM Studio Response API 経由で MiniMax M2.5 を実行します。フォールバックのためにホストされたモデルをマージしたままにします。

</Accordion>

---

## スキル

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn
    },
    entries: {
      "nano-banana-pro": {
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: バンドルされたスキルのみのオプションの許可リスト (管理/ワークスペース スキルは影響を受けません)。
- `entries.<skillKey>.enabled: false` は、バンドル/インストールされている場合でもスキルを無効にします。
- `entries.<skillKey>.apiKey`: プライマリ環境変数 (プレーンテキスト文字列または SecretRef オブジェクト) を宣言するスキルの利便性。

---

## プラグイン

````json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: [],
    load: {
      paths: ["~/Projects/oss/voice-call-extension"],
    },
    entries: {
      "voice-call": {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
        config: { provider: "twilio" },
      },
    },
  },
}
```- `~/.openclaw/extensions`、`<workspace>/.openclaw/extensions`、および `plugins.load.paths` からロードされます。
- **構成を変更するにはゲートウェイの再起動が必要です。**
- `allow`: オプションの許可リスト (リストされたプラグインのみがロードされます)。 `deny` が勝ちます。
- `plugins.entries.<id>.apiKey`: プラグインレベルの API キー便利フィールド (プラグインでサポートされている場合)。
- `plugins.entries.<id>.env`: プラグインスコープの環境変数マップ。
- `plugins.entries.<id>.hooks.allowPromptInjection`: `false` の場合、コアは `before_prompt_build` をブロックし、レガシー `before_agent_start` からのプロンプト変更フィールドを無視しますが、レガシー `modelOverride` および `providerOverride` は保持します。
- `plugins.entries.<id>.config`: プラグイン定義の設定オブジェクト (プラグイン スキーマによって検証される)。
- `plugins.slots.memory`: アクティブなメモリ プラグイン ID を選択するか、メモリ プラグインを無効にする場合は `"none"` を選択します。
- `plugins.slots.contextEngine`: アクティブなコンテキスト エンジン プラグイン ID を選択します。別のエンジンをインストールして選択しない限り、デフォルトは `"legacy"` になります。
- `plugins.installs`: `openclaw plugins update` によって使用される CLI 管理のインストール メタデータ。
  - `source`、`spec`、`sourcePath`、`installPath`、`version`、`resolvedName`、`resolvedVersion`、 `resolvedSpec`、`integrity`、`shasum`、`resolvedAt`、`installedAt`。
  - `plugins.installs.*` を管理対象状態として扱います。手動編集よりも CLI コマンドを優先します。

[プラグイン](/tools/plugin) を参照してください。

---

## ブラウザ

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "chrome",
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: true, // default trusted-network mode
      // allowPrivateNetwork: true, // legacy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
    color: "#FF4500",
    // headless: false,
    // noSandbox: false,
    // extraArgs: [],
    // relayBindHost: "0.0.0.0", // only when the extension relay must be reachable across namespaces (for example WSL2)
    // executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    // attachOnly: false,
  },
}
```- `evaluateEnabled: false` は、`act:evaluate` および `wait --fn` を無効にします。
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` は、未設定の場合はデフォルトで `true` になります (信頼されたネットワーク モデル)。
- `ssrfPolicy.dangerouslyAllowPrivateNetwork: false` を設定して、厳密なパブリックのみのブラウザ ナビゲーションを実現します。
- `ssrfPolicy.allowPrivateNetwork` はレガシー エイリアスとして引き続きサポートされます。
- 厳密モードでは、明示的な例外に `ssrfPolicy.hostnameAllowlist` および `ssrfPolicy.allowedHostnames` を使用します。
- リモート プロファイルは接続専用です (開始/停止/リセットは無効)。
- 自動検出順序: Chromium ベースの場合はデフォルトのブラウザ → Chrome → Brave → Edge → Chromium → Chrome Canary。
- 制御サービス: ループバックのみ (ポートは `gateway.port` から派生、デフォルトは `18791`)。
- `extraArgs` は、ローカルの Chromium 起動に追加の起動フラグを追加します (たとえば、
  `--disable-gpu`、ウィンドウ サイズ、またはデバッグ フラグ)。
- `relayBindHost` は、Chrome 拡張機能リレーがリッスンする場所を変更します。ループバックのみのアクセスの場合は未設定のままにしておきます。 `0.0.0.0` などの明示的な非ループバック バインド アドレスは、リレーが名前空間の境界 (WSL2 など) を越える必要があり、ホスト ネットワークがすでに信頼されている場合にのみ設定します。

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, short text, image URL, or data URI
    },
  },
}
````

- `seamColor`: ネイティブ アプリ UI クロムのアクセント カラー (トーク モードのバブルの色合いなど)。
- `assistant`: UI ID オーバーライドを制御します。アクティブなエージェント ID にフォールバックします。

---

## ゲートウェイ

```json5
{
  gateway: {
    mode: "local", // local | remote
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token", // none | token | password | trusted-proxy
      token: "your-token",
      // password: "your-password", // or OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // for mode=trusted-proxy; see /gateway/trusted-proxy-auth
      allowTailscale: true,
      rateLimit: {
        maxAttempts: 10,
        windowMs: 60000,
        lockoutMs: 300000,
        exemptLoopback: true,
      },
    },
    tailscale: {
      mode: "off", // off | serve | funnel
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // allowedOrigins: ["https://control.example.com"], // required for non-loopback Control UI
      // dangerouslyAllowHostHeaderOriginFallback: false, // dangerous Host-header origin fallback mode
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    remote: {
      url: "ws://gateway.tailnet:18789",
      transport: "ssh", // ssh | direct
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // Optional. Default false.
    allowRealIpFallback: false,
    tools: {
      // Additional /tools/invoke HTTP denies
      deny: ["browser"],
      // Remove tools from the default HTTP deny list
      allow: ["gateway"],
    },
  },
}
```

<Accordion title="ゲートウェイフィールドの詳細">- `mode`: `local` (ゲートウェイを実行) または `remote` (リモート ゲートウェイに接続)。 `local` を除き、ゲートウェイは起動を拒否します。

- `port`: WS + HTTP 用の単一の多重化ポート。優先順位: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`。
- `bind`: `auto`、`loopback` (デフォルト)、`lan` (`0.0.0.0`)、`tailnet` (Tailscale IP のみ)、または`custom`。
- **レガシー バインド エイリアス**: ホスト エイリアスではなく、`gateway.bind` (`auto`、`loopback`、`lan`、`tailnet`、`custom`) のバインド モード値を使用します。 (`0.0.0.0`、`127.0.0.1`、`localhost`、`::`、`::1`)。
- **Docker 注**: デフォルトの `loopback` バインドは、コンテナー内の `127.0.0.1` をリッスンします。 Docker ブリッジ ネットワーキング (`-p 18789:18789`) では、トラフィックは `eth0` に到着するため、ゲートウェイに到達できません。すべてのインターフェイスでリッスンするには、`--network host` を使用するか、`bind: "lan"` (または `bind: "custom"` と `customBindHost: "0.0.0.0"`) を設定します。
- **認証**: デフォルトで必須。非ループバック バインドには共有トークン/パスワードが必要です。オンボーディング ウィザードはデフォルトでトークンを生成します。- `gateway.auth.token` と `gateway.auth.password` の両方が構成されている場合 (SecretRef を含む)、`gateway.auth.mode` を明示的に `token` または `password` に設定します。起動とサービスのインストール/修復フローの両方が構成され、モードが設定されていない場合、失敗します。
- `gateway.auth.mode: "none"`: 明示的な非認証モード。信頼できるローカル ループバック設定にのみ使用してください。これはオンボーディング プロンプトでは意図的に提供されません。
- `gateway.auth.mode: "trusted-proxy"`: ID 対応リバース プロキシに認証を委任し、`gateway.trustedProxies` からの ID ヘッダーを信頼します ([信頼されたプロキシ認証](/gateway/trusted-proxy-auth) を参照)。
- `gateway.auth.allowTailscale`: `true` の場合、Tailscale Serve ID ヘッダーはコントロール UI/WebSocket 認証を満たすことができます (`tailscale whois` で検証)。 HTTP API エンドポイントでは依然としてトークン/パスワード認証が必要です。このトークンレス フローは、ゲートウェイ ホストが信頼できることを前提としています。 `tailscale.mode = "serve"` の場合、デフォルトは `true` になります。
- `gateway.auth.rateLimit`: オプションの認証失敗リミッター。クライアント IP ごとおよび認証スコープごとに適用されます (共有シークレットとデバイス トークンは個別に追跡されます)。ブロックされた試行は `429` + `Retry-After` を返します。
  - `gateway.auth.rateLimit.exemptLoopback` のデフォルトは `true` です。 localhost のトラフィック レートも意図的に制限したい場合は、`false` を設定します (テスト セットアップまたは厳密なプロキシ展開の場合)。- ブラウザー オリジンの WS 認証試行は、ループバック除外が無効になっている状態で常に抑制されます (ブラウザー ベースのローカルホスト ブルート フォースに対する多層防御)。
- `tailscale.mode`: `serve` (テールネットのみ、ループバック バインド) または `funnel` (パブリック、認証が必要)。
- `controlUi.allowedOrigins`: ゲートウェイ WebSocket 接続用の明示的なブラウザー起点許可リスト。ブラウザクライアントが非ループバックオリジンからのものであることが予期される場合に必要です。
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: ホスト ヘッダー オリジン ポリシーに意図的に依存する展開でホスト ヘッダー オリジン フォールバックを有効にする危険なモード。
- `remote.transport`: `ssh` (デフォルト) または `direct` (ws/wss)。 `direct` の場合、`remote.url` は `ws://` または `wss://` である必要があります。
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: 信頼されたプライベート ネットワーク IP へのプレーンテキスト `ws://` を許可するクライアント側のブレークグラス オーバーライド。デフォルトでは平文の場合はループバックのみになります。
- `gateway.remote.token` / `.password` は、リモート クライアントの資格情報フィールドです。ゲートウェイ認証を独自に構成することはありません。
- `gateway.auth.*` が設定されていない場合、ローカル ゲートウェイの呼び出しパスはフォールバックとして `gateway.remote.*` を使用できます。
- `trustedProxies`: TLS を終了するリバース プロキシ IP。自分が制御するプロキシのみをリストします。
- `allowRealIpFallback`: `true` の場合、`X-Forwarded-For` が欠落している場合、ゲートウェイは `X-Real-IP` を受け入れます。フェールクローズ動作のデフォルト `false`。- `gateway.tools.deny`: HTTP `POST /tools/invoke` に対して追加のツール名がブロックされました (デフォルトの拒否リストを拡張します)。
- `gateway.tools.allow`: デフォルトの HTTP 拒否リストからツール名を削除します。

</Accordion>

### OpenAI 互換エンドポイント

- チャット完了: デフォルトでは無効になっています。 `gateway.http.endpoints.chatCompletions.enabled: true` で有効にします。
- 応答 API: `gateway.http.endpoints.responses.enabled`。
- 応答 URL 入力の強化:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
- オプションの応答強化ヘッダー:
  - `gateway.http.securityHeaders.strictTransportSecurity` (制御する HTTPS オリジンに対してのみ設定します。[信頼されたプロキシ認証](/gateway/trusted-proxy-auth#tls-termination-and-hsts) を参照)

### マルチインスタンスの分離

一意のポートと状態ディレクトリを使用して、1 つのホスト上で複数のゲートウェイを実行します。

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

便利なフラグ: `--dev` (`~/.openclaw-dev` + ポート `19001` を使用)、`--profile <name>` (`~/.openclaw-<name>` を使用)。

[複数のゲートウェイ](/gateway/multiple-gateways) を参照してください。

---

## フック

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    maxBodyBytes: 262144,
    defaultSessionKey: "hook:ingress",
    allowRequestSessionKey: false,
    allowedSessionKeyPrefixes: ["hook:"],
    allowedAgentIds: ["hooks", "main"],
    presets: ["gmail"],
    transformsDir: "~/.openclaw/hooks/transforms",
    mappings: [
      {
        match: { path: "gmail" },
        action: "agent",
        agentId: "hooks",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate: "From: {{messages[0].from}}\nSubject: {{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.2-mini",
      },
    ],
  },
}
```

認証: `Authorization: Bearer <token>` または `x-openclaw-token: <token>`。

**エンドポイント:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - リクエスト ペイロードの `sessionKey` は、`hooks.allowRequestSessionKey=true` (デフォルト: `false`) の場合にのみ受け入れられます。
- `POST /hooks/<name>` → `hooks.mappings` によって解決されました

<Accordion title="マッピングの詳細">- `match.path` は、`/hooks` の後のサブパスと一致します (例: `/hooks/gmail` → `gmail`)。

- `match.source` は、汎用パスのペイロード フィールドと一致します。
- `{{messages[0].subject}}` のようなテンプレートはペイロードから読み取られます。
- `transform` は、フック アクションを返す JS/TS モジュールを指すことができます。
  - `transform.module` は相対パスであり、`hooks.transformsDir` 内に収まる必要があります (絶対パスとトラバースは拒否されます)。
- `agentId` は特定のエージェントにルーティングします。不明な ID はデフォルトに戻ります。
- `allowedAgentIds`: 明示的なルーティングを制限します (`*` または省略 = すべて許可、`[]` = すべて拒否)。
- `defaultSessionKey`: フック エージェントのオプションの固定セッション キーは、明示的な `sessionKey` なしで実行されます。
- `allowRequestSessionKey`: `/hooks/agent` 呼び出し元が `sessionKey` を設定できるようにします (デフォルト: `false`)。
- `allowedSessionKeyPrefixes`: 明示的な `sessionKey` 値 (リクエスト + マッピング) のオプションのプレフィックス許可リスト。 `["hook:"]`。
- `deliver: true` はチャネルに最終応答を送信します。 `channel` のデフォルトは `last` です。
- `model` は、このフック実行の LLM をオーバーライドします (モデル カタログが設定されている場合は許可する必要があります)。

</Accordion>

### Gmail の統合

```json5
{
  hooks: {
    gmail: {
      account: "openclaw@gmail.com",
      topic: "projects/<project-id>/topics/gog-gmail-watch",
      subscription: "gog-gmail-watch-push",
      pushToken: "shared-push-token",
      hookUrl: "http://127.0.0.1:18789/hooks/gmail",
      includeBody: true,
      maxBytes: 20000,
      renewEveryMinutes: 720,
      serve: { bind: "127.0.0.1", port: 8788, path: "/" },
      tailscale: { mode: "funnel", path: "/gmail-pubsub" },
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

- 構成されている場合、ゲートウェイは起動時に `gog gmail watch serve` を自動起動します。 `OPENCLAW_SKIP_GMAIL_WATCHER=1` を無効に設定します。
- ゲートウェイと一緒に別の `gog gmail watch serve` を実行しないでください。

---

## キャンバスホスト

```json5

{
canvasHost: {
root: "~/.openclaw/workspace/canvas",
liveReload: true,
// enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
},
}

````

- エージェントが編集可能な HTML/CSS/JS および A2UI をゲートウェイ ポートで HTTP 経由で提供します。
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- ローカルのみ: `gateway.bind: "loopback"` (デフォルト) を維持します。
- 非ループバック バインド: キャンバス ルートには、他のゲートウェイ HTTP サーフェスと同様に、ゲートウェイ認証 (トークン/パスワード/信頼できるプロキシ) が必要です。
- ノード WebView は通常、認証ヘッダーを送信しません。ノードがペアリングされて接続されると、ゲートウェイはキャンバス/A2UI アクセス用にノード スコープの機能 URL をアドバタイズします。
- 機能 URL はアクティブ ノード WS セッションにバインドされており、すぐに期限切れになります。 IP ベースのフォールバックは使用されません。
- ライブリロードクライアントを提供される HTML に挿入します。
- 空の場合、スターター `index.html` を自動作成します。
- `/__openclaw__/a2ui/` で A2UI も提供します。
- 変更にはゲートウェイの再起動が必要です。
- 大きなディレクトリまたは `EMFILE` エラーのライブ リロードを無効にします。

---

## 発見

### mDNS (ボンジュール)

```json5
{
  discovery: {
    mdns: {
      mode: "minimal", // minimal | full | off
    },
  },
}
````

- `minimal` (デフォルト): TXT レコードから `cliPath` + `sshPort` を省略します。
- `full`: `cliPath` + `sshPort` を含みます。
- ホスト名のデフォルトは `openclaw` です。 `OPENCLAW_MDNS_HOSTNAME` でオーバーライドします。

### 広域 (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

ユニキャスト DNS-SD ゾーンを `~/.openclaw/dns/` に書き込みます。クロスネットワーク検出の場合は、DNS サーバー (CoreDNS 推奨) + Tailscale Split DNS とペアリングします。

セットアップ: `openclaw dns setup --apply`。

---

## 環境

### `env` (インライン環境変数)```json5

{
env: {
OPENROUTER_API_KEY: "sk-or-...",
vars: {
GROQ_API_KEY: "gsk-...",
},
shellEnv: {
enabled: true,
timeoutMs: 15000,
},
},
}

````

- インライン環境変数は、プロセス環境にキーがない場合にのみ適用されます。
- `.env` ファイル: CWD `.env` + `~/.openclaw/.env` (どちらも既存の変数をオーバーライドしません)。
- `shellEnv`: ログイン シェル プロファイルから不足している予期されたキーをインポートします。
- 完全な優先順位については、[環境](/help/environment) を参照してください。

### 環境変数の置換

`${VAR_NAME}` を使用して、構成文字列内の環境変数を参照します。

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
````

- 大文字の名前のみが一致しました: `[A-Z_][A-Z0-9_]*`。
- 変数が欠落しているか空であると、構成ロード時にエラーがスローされます。
- リテラル `${VAR}` の場合は、`${VAR}` でエスケープします。
- `$include` で動作します。

---

## 秘密

Secret ref は追加的です。プレーンテキストの値は引き続き機能します。

### `SecretRef`

1 つのオブジェクト シェイプを使用します。

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

検証:

- `provider` パターン:
- `source: "env"` ID パターン: `^[A-Z][A-Z0-9_]{0,127}# 構成リファレンス

`~/.openclaw/openclaw.json` で使用可能なすべてのフィールド。タスク指向の概要については、「[構成](/gateway/configuration)」を参照してください。

構成形式は **JSON5** (コメント + 末尾のカンマは許可されます) です。すべてのフィールドはオプションです。省略された場合、OpenClaw は安全なデフォルトを使用します。

---

## チャンネル

各チャネルは、その構成セクションが存在すると自動的に開始されます (`enabled: false` を除く)。

### DMとグループアクセス

すべてのチャネルは DM ポリシーとグループ ポリシーをサポートします。

| DMポリシー               | 行動                                                                                   |
| ------------------------ | -------------------------------------------------------------------------------------- | --- | ---------------- | ---- |
| `pairing` (デフォルト)   | 不明な送信者はワンタイムペアリングコードを受け取ります。所有者は承認する必要があります |
| `allowlist`              | `allowFrom` (またはペアの許可ストア) の送信者のみ                                      |
| `open`                   | すべての受信 DM を許可する (`allowFrom: ["*"]` が必要)                                 |
| `disabled`               | すべての受信 DM を無視する                                                             |     | グループポリシー | 行動 |
| ---------------------    | --------------------------------------------------------                               |
| `allowlist` (デフォルト) | 設定された許可リストに一致するグループのみ                                             |
| `open`                   | グループ許可リストをバイパスします (メンションゲートは引き続き適用されます)。          |
| `disabled`               | すべてのグループ/ルーム メッセージをブロックする                                       |

<Note>
`channels.defaults.groupPolicy` は、プロバイダーの `groupPolicy` が設定されていない場合のデフォルトを設定します。
ペアリング コードは 1 時間後に期限切れになります。保留中の DM ペアリング要求の上限は、**チャネルあたり 3** です。
プロバイダー ブロックが完全に欠落している (`channels.<provider>` が欠落している) 場合、ランタイム グループ ポリシーは起動警告とともに `allowlist` (フェールクローズ) にフォールバックします。
</Note>

### チャネルモデルのオーバーライド

`channels.modelByChannel` を使用して、特定のチャネル ID をモデルに固定します。値は `provider/model` または構成されたモデルのエイリアスを受け入れます。チャネル マッピングは、セッションにモデル オーバーライドがまだない場合 (たとえば、`/model` によって設定されている場合) に適用されます。

```json5
{
  channels: {
    modelByChannel: {
      discord: {
        "123456789012345678": "anthropic/claude-opus-4-6",
      },
      slack: {
        C1234567890: "openai/gpt-4.1",
      },
      telegram: {
        "-1001234567890": "openai/gpt-4.1-mini",
        "-1001234567890:topic:99": "anthropic/claude-sonnet-4-6",
      },
    },
  },
}
```

### チャネルのデフォルトとハートビート

プロバイダー間で共有されるグループ ポリシーとハートビートの動作には、`channels.defaults` を使用します。

````json5
{
  channels: {
    defaults: {
      groupPolicy: "allowlist", // open | allowlist | disabled
      heartbeat: {
        showOk: false,
        showAlerts: true,
        useIndicator: true,
      },
    },
  },
}
```- `channels.defaults.groupPolicy`: プロバイダーレベルの `groupPolicy` が設定されていない場合のフォールバック グループ ポリシー。
- `channels.defaults.heartbeat.showOk`: ハートビート出力に正常なチャネルのステータスを含めます。
- `channels.defaults.heartbeat.showAlerts`: ハートビート出力に劣化/エラーステータスを含めます。
- `channels.defaults.heartbeat.useIndicator`: コンパクトなインジケーター スタイルのハートビート出力をレンダリングします。

### WhatsApp

WhatsApp は、ゲートウェイの Web チャネル (Baileys Web) を通じて実行されます。リンクされたセッションが存在する場合、自動的に開始されます。

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      chunkMode: "length", // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // blue ticks (false in self-chat mode)
      groups: {
        "*": { requireMention: true },
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
  web: {
    enabled: true,
    heartbeatSeconds: 60,
    reconnect: {
      initialMs: 2000,
      maxMs: 120000,
      factor: 1.4,
      jitter: 0.2,
      maxAttempts: 0,
    },
  },
}
````

<Accordion title="マルチアカウント WhatsApp">

```json5
{
  channels: {
    whatsapp: {
      accounts: {
        default: {},
        personal: {},
        biz: {
          // authDir: "~/.openclaw/credentials/whatsapp/biz",
        },
      },
    },
  },
}
```

- アウトバウンド コマンドは、デフォルトでアカウント `default` が存在する場合に使用されます。それ以外の場合は、最初に設定されたアカウント ID (ソート済み)。
- オプションの `channels.whatsapp.defaultAccount` は、構成されたアカウント ID と一致する場合にフォールバックのデフォルトのアカウント選択をオーバーライドします。
- 従来の単一アカウントの Baileys 認証ディレクトリは、`openclaw doctor` によって `whatsapp/default` に移行されます。
- アカウントごとの上書き: `channels.whatsapp.accounts.<id>.sendReadReceipts`、`channels.whatsapp.accounts.<id>.dmPolicy`、`channels.whatsapp.accounts.<id>.allowFrom`。

</Accordion>

### 電報

````json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "your-bot-token",
      dmPolicy: "pairing",
      allowFrom: ["tg:123456789"],
      groups: {
        "*": { requireMention: true },
        "-1001234567890": {
          allowFrom: ["@admin"],
          systemPrompt: "Keep answers brief.",
          topics: {
            "99": {
              requireMention: false,
              skills: ["search"],
              systemPrompt: "Stay on topic.",
            },
          },
        },
      },
      customCommands: [
        { command: "backup", description: "Git backup" },
        { command: "generate", description: "Create an image" },
      ],
      historyLimit: 50,
      replyToMode: "first", // off | first | all
      linkPreview: true,
      streaming: "partial", // off | partial | block | progress (default: off)
      actions: { reactions: true, sendMessage: true },
      reactionNotifications: "own", // off | own | all
      mediaMaxMb: 100,
      retry: {
        attempts: 3,
        minDelayMs: 400,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
      network: {
        autoSelectFamily: true,
        dnsResultOrder: "ipv4first",
      },
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook",
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook",
    },
  },
}
```- ボット トークン: `channels.telegram.botToken` または `channels.telegram.tokenFile`、`TELEGRAM_BOT_TOKEN` はデフォルト アカウントのフォールバックとして使用されます。
- オプションの `channels.telegram.defaultAccount` は、構成されたアカウント ID と一致する場合、デフォルトのアカウント選択をオーバーライドします。
- マルチアカウント設定 (2 つ以上のアカウント ID) では、明示的なデフォルト (`channels.telegram.defaultAccount` または `channels.telegram.accounts.default`) を設定して、フォールバック ルーティングを回避します。 `openclaw doctor` は、これが欠落しているか無効な場合に警告します。
- `configWrites: false` は、Telegram が開始する設定の書き込みをブロックします (スーパーグループ ID の移行、`/config set|unset`)。
- `type: "acp"` を含むトップレベルの `bindings[]` エントリは、フォーラム トピックの永続的な ACP バインディングを構成します (`match.peer.id` の正規の `chatId:topic:topicId` を使用します)。フィールド セマンティクスは [ACP エージェント](/tools/acp-agents#channel-specific-settings) で共有されます。
- Telegram ストリーム プレビューは `sendMessage` + `editMessageText` を使用します (ダイレクト チャットおよびグループ チャットで機能します)。
- 再試行ポリシー: [再試行ポリシー](/concepts/retry) を参照してください。

### 不和

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: "your-bot-token",
      mediaMaxMb: 8,
      allowBots: false,
      actions: {
        reactions: true,
        stickers: true,
        polls: true,
        permissions: true,
        messages: true,
        threads: true,
        pins: true,
        search: true,
        memberInfo: true,
        roleInfo: true,
        roles: false,
        channelInfo: true,
        voiceStatus: true,
        events: true,
        moderation: false,
      },
      replyToMode: "off", // off | first | all
      dmPolicy: "pairing",
      allowFrom: ["1234567890", "123456789012345678"],
      dm: { enabled: true, groupEnabled: false, groupChannels: ["openclaw-dm"] },
      guilds: {
        "123456789012345678": {
          slug: "friends-of-openclaw",
          requireMention: false,
          ignoreOtherMentions: true,
          reactionNotifications: "own",
          users: ["987654321098765432"],
          channels: {
            general: { allow: true },
            help: {
              allow: true,
              requireMention: true,
              users: ["987654321098765432"],
              skills: ["docs"],
              systemPrompt: "Short answers only.",
            },
          },
        },
      },
      historyLimit: 20,
      textChunkLimit: 2000,
      chunkMode: "length", // length | newline
      streaming: "off", // off | partial | block | progress (progress maps to partial on Discord)
      maxLinesPerMessage: 17,
      ui: {
        components: {
          accentColor: "#5865F2",
        },
      },
      threadBindings: {
        enabled: true,
        idleHours: 24,
        maxAgeHours: 0,
        spawnSubagentSessions: false, // opt-in for sessions_spawn({ thread: true })
      },
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
      retry: {
        attempts: 3,
        minDelayMs: 500,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
  },
}
```- トークン: `channels.discord.token`、デフォルト アカウントのフォールバックとして `DISCORD_BOT_TOKEN`。
- オプションの `channels.discord.defaultAccount` は、設定されたアカウント ID と一致する場合、デフォルトのアカウント選択をオーバーライドします。
- 配信ターゲットには `user:<id>` (DM) または `channel:<id>` (ギルド チャネル) を使用します。裸の数値 ID は拒否されます。
- ギルド スラッグは小文字でスペースが `-` に置き換えられます。チャンネルキーはスラッグ名 (`#` ではありません) を使用します。ギルドIDを優先します。
- ボットが作成したメッセージはデフォルトでは無視されます。 `allowBots: true` はそれらを有効にします。 `allowBots: "mentions"` を使用して、ボットに言及するボット メッセージのみを受け入れます (独自のメッセージはまだフィルターされています)。
- `channels.discord.guilds.<id>.ignoreOtherMentions` (およびチャネル オーバーライド) は、別のユーザーまたはロールに言及するメッセージを削除しますが、ボットには言及しません (@everyone/@here を除く)。
- `maxLinesPerMessage` (デフォルトは 17) は、2000 文字未満の場合でも長いメッセージを分割します。
- `channels.discord.threadBindings` は、Discord のスレッドバインドされたルーティングを制御します。
  - `enabled`: スレッドバインドされたセッション機能の Discord オーバーライド (`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`、バインド配信/ルーティング)
  - `idleHours`: 非アクティブ状態が数時間で自動フォーカス解除されるための Discord オーバーライド (`0` は無効になります)
  - `maxAgeHours`: 時間単位のハードマックス年齢の Discord オーバーライド (`0` は無効になります)
  - `spawnSubagentSessions`: `sessions_spawn({ thread: true })` 自動スレッド作成/バインドのオプトイン スイッチ- `type: "acp"` を含むトップレベルの `bindings[]` エントリは、チャネルとスレッドの永続的な ACP バインディングを構成します (`match.peer.id` のチャネル/スレッド ID を使用します)。フィールド セマンティクスは [ACP エージェント](/tools/acp-agents#channel-specific-settings) で共有されます。
- `channels.discord.ui.components.accentColor` は、Discord コンポーネント v2 コンテナのアクセント カラーを設定します。
- `channels.discord.voice` は、Discord 音声チャネル会話とオプションの自動参加 + TTS オーバーライドを有効にします。
- `channels.discord.voice.daveEncryption` および `channels.discord.voice.decryptionFailureTolerance` は `@discordjs/voice` DAVE オプションに渡されます (デフォルトでは `true` および `24`)。
- OpenClaw はさらに、繰り返し復号化に失敗した後、音声セッションから離脱/再参加することで音声受信の回復を試みます。
- `channels.discord.streaming` は正規ストリーム モード キーです。従来の `streamMode` およびブール値 `streaming` 値は自動移行されます。
- `channels.discord.autoPresence` は、実行時の可用性をボットの存在にマップし (正常 => オンライン、劣化 => アイドル、消耗 => 停止)、オプションでステータス テキストの上書きを許可します。
- `channels.discord.dangerouslyAllowNameMatching` は、変更可能な名前/タグの一致を再度有効にします (ブレークグラス互換モード)。

**反応通知モード:** `off` (なし)、`own` (ボットのメッセージ、デフォルト)、`all` (すべてのメッセージ)、`allowlist` (すべてのメッセージの `guilds.<id>.users` から)。

### Google チャット

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      audienceType: "app-url", // app-url | project-number
      audience: "https://gateway.example.com/googlechat",
      webhookPath: "/googlechat",
      botUser: "users/1234567890",
      dm: {
        enabled: true,
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": { allow: true, requireMention: true },
      },
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```- サービス アカウント JSON: インライン (`serviceAccount`) またはファイルベース (`serviceAccountFile`)。
- サービス アカウント SecretRef もサポートされています (`serviceAccountRef`)。
- 環境フォールバック: `GOOGLE_CHAT_SERVICE_ACCOUNT` または `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`。
- 配信ターゲットには `spaces/<spaceId>` または `users/<userId>` を使用します。
- `channels.googlechat.dangerouslyAllowNameMatching` は、変更可能な電子メール プリンシパルの一致を再度有効にします (ブレークグラス互換モード)。

### スラック

```json5
{
  channels: {
    slack: {
      enabled: true,
      botToken: "xoxb-...",
      appToken: "xapp-...",
      dmPolicy: "pairing",
      allowFrom: ["U123", "U456", "*"],
      dm: { enabled: true, groupEnabled: false, groupChannels: ["G123"] },
      channels: {
        C123: { allow: true, requireMention: true, allowBots: false },
        "#general": {
          allow: true,
          requireMention: true,
          allowBots: false,
          users: ["U123"],
          skills: ["docs"],
          systemPrompt: "Short answers only.",
        },
      },
      historyLimit: 50,
      allowBots: false,
      reactionNotifications: "own",
      reactionAllowlist: ["U123"],
      replyToMode: "off", // off | first | all
      thread: {
        historyScope: "thread", // thread | channel
        inheritParent: false,
      },
      actions: {
        reactions: true,
        messages: true,
        pins: true,
        memberInfo: true,
        emojiList: true,
      },
      slashCommand: {
        enabled: true,
        name: "openclaw",
        sessionPrefix: "slack:slash",
        ephemeral: true,
      },
      typingReaction: "hourglass_flowing_sand",
      textChunkLimit: 4000,
      chunkMode: "length",
      streaming: "partial", // off | partial | block | progress (preview mode)
      nativeStreaming: true, // use Slack native streaming API when streaming=partial
      mediaMaxMb: 20,
    },
  },
}
````

- **ソケット モード**には、`botToken` と `appToken` の両方が必要です (デフォルトのアカウント環境フォールバックの場合は `SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN`)。
- **HTTP モード** には、`botToken` と `signingSecret` (ルートまたはアカウントごと) が必要です。
- `configWrites: false` は、Slack によって開始される設定の書き込みをブロックします。
- オプションの `channels.slack.defaultAccount` は、設定されたアカウント ID と一致する場合、デフォルトのアカウント選択をオーバーライドします。
- `channels.slack.streaming` は正規ストリーム モード キーです。従来の `streamMode` 値とブール値 `streaming` 値は自動移行されます。
- 配信ターゲットには `user:<id>` (DM) または `channel:<id>` を使用します。

**反応通知モード:** `off`、`own` (デフォルト)、`all`、`allowlist` (`reactionAllowlist` から)。

**スレッド セッションの分離:** `thread.historyScope` はスレッドごと (デフォルト)、またはチャネル全体で共有されます。 `thread.inheritParent` は、親チャネルのトランスクリプトを新しいスレッドにコピーします。- `typingReaction` は、返信の実行中に受信 Slack メッセージに一時的な反応を追加し、完了時に削除します。 `"hourglass_flowing_sand"` などの Slack 絵文字ショートコードを使用します。

| アクショングループ | デフォルト | メモ                    |
| ------------------ | ---------- | ----------------------- |
| 反応               | 有効       | 反応 + 反応のリスト     |
| メッセージ         | 有効       | 読み取り/送信/編集/削除 |
| ピン               | 有効       | 固定/固定解除/リスト    |
| メンバー情報       | 有効       | 会員情報                |
| 絵文字リスト       | 有効       | カスタム絵文字リスト    |

### 最も重要なこと

Mattermost はプラグインとして出荷されます: `openclaw plugins install @openclaw/mattermost`。

```json5
{
  channels: {
    mattermost: {
      enabled: true,
      botToken: "mm-token",
      baseUrl: "https://chat.example.com",
      dmPolicy: "pairing",
      chatmode: "oncall", // oncall | onmessage | onchar
      oncharPrefixes: [">", "!"],
      commands: {
        native: true, // opt-in
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Optional explicit URL for reverse-proxy/public deployments
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

チャット モード: `oncall` (@ メンションで応答、デフォルト)、`onmessage` (すべてのメッセージ)、`onchar` (トリガー プレフィックスで始まるメッセージ)。

Mattermost ネイティブ コマンドが有効な場合:- `commands.callbackPath` は、完全な URL ではなく、パス (`/api/channels/mattermost/command` など) である必要があります。

- `commands.callbackUrl` は OpenClaw ゲートウェイ エンドポイントに解決され、Mattermost サーバーから到達可能である必要があります。
- プライベート/テールネット/内部コールバック ホストの場合、Mattermost は必要な場合があります
  `ServiceSettings.AllowedUntrustedInternalConnections` には、コールバック ホスト/ドメインが含まれます。
  完全な URL ではなく、ホスト/ドメインの値を使用します。
- `channels.mattermost.configWrites`: Mattermost が開始する構成書き込みを許可または拒否します。
- `channels.mattermost.requireMention`: チャネルで返信する前に `@mention` が必要です。
- オプションの `channels.mattermost.defaultAccount` は、構成されたアカウント ID と一致する場合、デフォルトのアカウント選択をオーバーライドします。

### 信号

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // optional account binding
      dmPolicy: "pairing",
      allowFrom: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      configWrites: true,
      reactionNotifications: "own", // off | own | all | allowlist
      reactionAllowlist: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      historyLimit: 50,
    },
  },
}
```

**反応通知モード:** `off`、`own` (デフォルト)、`all`、`allowlist` (`reactionAllowlist` から)。

- `channels.signal.account`: チャネルの起動を特定の Signal アカウント ID に固定します。
- `channels.signal.configWrites`: Signal によって開始される構成書き込みを許可または拒否します。
- オプションの `channels.signal.defaultAccount` は、設定されたアカウント ID と一致する場合、デフォルトのアカウント選択をオーバーライドします。

### ブルーバブルズ

BlueBubbles が推奨される iMessage パスです (プラグインベース、`channels.bluebubbles` で構成)。

````json5
{
  channels: {
    bluebubbles: {
      enabled: true,
      dmPolicy: "pairing",
      // serverUrl, password, webhookPath, group controls, and advanced actions:
      // see /channels/bluebubbles
    },
  },
}
```- ここで取り上げるコアキーのパス: `channels.bluebubbles`、`channels.bluebubbles.dmPolicy`。
- オプションの `channels.bluebubbles.defaultAccount` は、構成されたアカウント ID と一致する場合、デフォルトのアカウント選択をオーバーライドします。
- 完全な BlueBubbles チャネル構成は [BlueBubbles](/channels/bluebubbles) に文書化されています。

### iメッセージ

OpenClaw は `imsg rpc` (標準入出力上の JSON-RPC) を生成します。デーモンやポートは必要ありません。

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "imsg",
      dbPath: "~/Library/Messages/chat.db",
      remoteHost: "user@gateway-host",
      dmPolicy: "pairing",
      allowFrom: ["+15555550123", "user@example.com", "chat_id:123"],
      historyLimit: 50,
      includeAttachments: false,
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      mediaMaxMb: 16,
      service: "auto",
      region: "US",
    },
  },
}
````

- オプションの `channels.imessage.defaultAccount` は、設定されたアカウント ID と一致する場合、デフォルトのアカウント選択をオーバーライドします。

- メッセージ DB へのフルディスク アクセスが必要です。
- `chat_id:<id>` ターゲットを優先します。チャットを一覧表示するには、`imsg chats --limit 20` を使用します。
- `cliPath` は SSH ラッパーを指すことができます。 SCP 添付ファイルを取得するために `remoteHost` (`host` または `user@host`) を設定します。
- `attachmentRoots` および `remoteAttachmentRoots` は、受信添付ファイル パスを制限します (デフォルト: `/Users/*/Library/Messages/Attachments`)。
- SCP は厳密なホスト キー チェックを使用するため、リレー ホスト キーが `~/.ssh/known_hosts` にすでに存在していることを確認してください。
- `channels.imessage.configWrites`: iMessage によって開始される設定の書き込みを許可または拒否します。

<Accordion title="iMessage SSH ラッパーの例">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Microsoft Teams

Microsoft Teams は拡張機能をサポートしており、`channels.msteams` で構成されています。

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, team/channel policies:
      // see /channels/msteams
    },
  },
}
```

- ここで取り上げるコアキーのパス: `channels.msteams`、`channels.msteams.configWrites`。
- 完全な Teams 構成 (資格情報、Webhook、DM/グループ ポリシー、チームごと/チャネルごとのオーバーライド) は、[Microsoft Teams](/channels/msteams) に文書化されています。### IRC

IRC は拡張機能をサポートしており、`channels.irc` で構成されています。

```json5
{
  channels: {
    irc: {
      enabled: true,
      dmPolicy: "pairing",
      configWrites: true,
      nickserv: {
        enabled: true,
        service: "NickServ",
        password: "${IRC_NICKSERV_PASSWORD}",
        register: false,
        registerEmail: "bot@example.com",
      },
    },
  },
}
```

- ここで説明するコアキーのパス: `channels.irc`、`channels.irc.dmPolicy`、`channels.irc.configWrites`、`channels.irc.nickserv.*`。
- オプションの `channels.irc.defaultAccount` は、構成されたアカウント ID と一致する場合、デフォルトのアカウント選択をオーバーライドします。
- 完全な IRC チャネル設定 (ホスト/ポート/TLS/チャネル/許可リスト/メンション ゲーティング) は [IRC](/channels/irc) に文書化されています。

### マルチアカウント (すべてのチャネル)

チャネルごとに複数のアカウントを実行します (それぞれに独自の `accountId` があります)。

````json5
{
  channels: {
    telegram: {
      accounts: {
        default: {
          name: "Primary bot",
          botToken: "123456:ABC...",
        },
        alerts: {
          name: "Alerts bot",
          botToken: "987654:XYZ...",
        },
      },
    },
  },
}
```- `default` は、`accountId` が省略された場合に使用されます (CLI + ルーティング)。
- 環境トークンは **デフォルト** アカウントにのみ適用されます。
- 基本チャネル設定は、アカウントごとに上書きされない限り、すべてのアカウントに適用されます。
- `bindings[].match.accountId` を使用して、各アカウントを別のエージェントにルーティングします。
- 単一アカウントのトップレベルのチャネル設定を使用しているときに、`openclaw channels add` (またはチャネルのオンボーディング) 経由でデフォルト以外のアカウントを追加すると、OpenClaw は最初にアカウントスコープのトップレベルの単一アカウントの値を `channels.<channel>.accounts.default` に移動し、元のアカウントが機能し続けるようにします。
- 既存のチャネルのみのバインディング (`accountId` なし) はデフォルトのアカウントと一致し続けます。アカウント スコープのバインディングはオプションのままです。
- `openclaw doctor --fix` は、名前付きアカウントが存在するが `default` が欠落している場合、アカウントをスコープとする最上位の単一アカウントの値を `accounts.default` に移動することにより、混合シェイプも修復します。

### その他の拡張チャネル

多くの拡張チャネルは `channels.<id>` として構成され、専用チャネル ページ (Feishu、Matrix、LINE、Nostr、Zalo、Nextcloud Talk、Synology Chat、Twitch など) に文書化されています。
完全なチャネル インデックスを参照してください: [チャネル](/channels)。

### グループチャットのメンションゲート

グループ メッセージはデフォルトで **メンションが必要** (メタデータのメンションまたは正規表現パターン) です。 WhatsApp、Telegram、Discord、Google Chat、および iMessage のグループ チャットに適用されます。

**メンションの種類:**- **メタデータのメンション**: ネイティブ プラットフォームの @-メンション。 WhatsApp セルフチャット モードでは無視されます。
- **テキスト パターン**: `agents.list[].groupChat.mentionPatterns` の正規表現パターン。常にチェックされています。
- メンション ゲートは、検出が可能な場合 (ネイティブ メンションまたは少なくとも 1 つのパターン) にのみ適用されます。

```json5
{
  messages: {
    groupChat: { historyLimit: 50 },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
````

`messages.groupChat.historyLimit` はグローバルなデフォルトを設定します。チャネルは `channels.<channel>.historyLimit` (またはアカウントごと) でオーバーライドできます。 `0` を無効に設定します。

#### DM 履歴の制限

```json5
{
  channels: {
    telegram: {
      dmHistoryLimit: 30,
      dms: {
        "123456789": { historyLimit: 50 },
      },
    },
  },
}
```

解決策: DM ごとのオーバーライド → プロバイダーのデフォルト → 制限なし (すべて保持)。

サポートされている: `telegram`、`whatsapp`、`discord`、`slack`、`signal`、`imessage`、`msteams`。

#### セルフチャットモード

セルフチャット モードを有効にするには、`allowFrom` に独自の番号を含めます (ネイティブの @-メンションを無視し、テキスト パターンにのみ応答します)。

```json5
{
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: { "*": { requireMention: true } },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: { mentionPatterns: ["reisponde", "@openclaw"] },
      },
    ],
  },
}
```

### コマンド (チャット コマンドの処理)

```json5
{
  commands: {
    native: "auto", // register native commands when supported
    text: true, // parse /commands in chat messages
    bash: false, // allow ! (alias: /bash)
    bashForegroundMs: 2000,
    config: false, // allow /config
    debug: false, // allow /debug
    restart: false, // allow /restart + gateway restart tool
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

<Accordion title="コマンド詳細">- テキスト コマンドは、先頭に `/` が付いた **スタンドアロン** メッセージである必要があります。

- `native: "auto"` は、Discord/Telegram のネイティブ コマンドをオンにし、Slack をオフのままにします。
- チャネルごとのオーバーライド: `channels.discord.commands.native` (ブール値または `"auto"`)。 `false` は、以前に登録されたコマンドをクリアします。
- `channels.telegram.customCommands` は、Telegram ボット メニュー エントリを追加します。
- `bash: true` は、ホスト シェルの `! <cmd>` を有効にします。 `tools.elevated.enabled` と `tools.elevated.allowFrom.<channel>` の送信者が必要です。
- `config: true` は `/config` を有効にします (`openclaw.json` の読み取り/書き込み)。ゲートウェイ `chat.send` クライアントの場合、永続的な `/config set|unset` 書き込みには `operator.admin` も必要です。読み取り専用 `/config show` は、通常の書き込みスコープのオペレーター クライアントで引き続き使用できます。
- `channels.<provider>.configWrites` はチャネルごとに構成の変更をゲートします (デフォルト: true)。
- `allowFrom` はプロバイダーごとです。設定すると、**唯一**の認証ソースになります (チャネル許可リスト/ペアリングと `useAccessGroups` は無視されます)。
- `useAccessGroups: false` を使用すると、`allowFrom` が設定されていない場合に、コマンドがアクセス グループ ポリシーをバイパスできます。

</Accordion>

---

## エージェントのデフォルト

### `agents.defaults.workspace`

デフォルト: `~/.openclaw/workspace`。

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

システム プロンプトのランタイム行に表示されるオプションのリポジトリ ルート。設定されていない場合、OpenClaw はワークスペースから上に向かって歩くことによって自動検出します。

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skipBootstrap`ワークスペース ブートストラップ ファイル (`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、 `BOOTSTRAP.md`)

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.bootstrapMaxChars`

切り詰められる前のワークスペース ブートストラップ ファイルあたりの最大文字数。デフォルト: `20000`。

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

すべてのワークスペース ブートストラップ ファイルに挿入される最大合計文字数。デフォルト: `150000`。

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 150000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

ブートストラップ コンテキストが切り詰められた場合に、エージェントに表示される警告テキストを制御します。
デフォルト: `"once"`。

- `"off"`: システム プロンプトに警告テキストを挿入しないでください。
- `"once"`: 一意の切り捨て署名ごとに 1 回警告を挿入します (推奨)。
- `"always"`: 切り捨てが存在する場合、実行ごとに警告を挿入します。

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### `agents.defaults.imageMaxDimensionPx`

プロバイダー呼び出し前のトランスクリプト/ツール画像ブロック内の最長画像側の最大ピクセル サイズ。
デフォルト: `1200`。

通常、値を低くすると、ビジョン トークンの使用量が減り、スクリーンショットを大量に使用する実行の場合に要求されるペイロード サイズが減ります。
値を大きくすると、視覚的な詳細がより多く保持されます。

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

システム プロンプト コンテキストのタイムゾーン (メッセージ タイムスタンプではありません)。ホストのタイムゾーンにフォールバックします。

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

システムプロンプトの時刻形式。デフォルト: `auto` (OS 設定)。

````json5
{
  agents: { defaults: { timeFormat: "auto" } }, // auto | 12 | 24
}
```### `agents.defaults.model`

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "minimax/MiniMax-M2.5": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.5"],
      },
      imageModel: {
        primary: "openrouter/qwen/qwen-2.5-vl-72b-instruct:free",
        fallbacks: ["openrouter/google/gemini-2.0-flash-vision:free"],
      },
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5-mini"],
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
      elevatedDefault: "on",
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      contextTokens: 200000,
      maxConcurrent: 3,
    },
  },
}
```- `model`: 文字列 (`"provider/model"`) またはオブジェクト (`{ primary, fallbacks }`) を受け入れます。
  ・文字列形式はプライマリモデルのみ設定します。
  - オブジェクト形式は、プライマリおよび順序付けされたフェイルオーバー モデルを設定します。
- `imageModel`: 文字列 (`"provider/model"`) またはオブジェクト (`{ primary, fallbacks }`) を受け入れます。
  - `image` ツール パスによってビジョン モデル構成として使用されます。
  - 選択/デフォルトのモデルが画像入力を受け入れられない場合のフォールバック ルーティングとしても使用されます。
- `pdfModel`: 文字列 (`"provider/model"`) またはオブジェクト (`{ primary, fallbacks }`) を受け入れます。
  - モデル ルーティング用の `pdf` ツールによって使用されます。
  - 省略した場合、PDF ツールは `imageModel` にフォールバックし、その後ベストエフォート型プロバイダーのデフォルトにフォールバックします。
- `pdfMaxBytesMb`: 呼び出し時に `maxBytesMb` が渡されない場合の、`pdf` ツールのデフォルトの PDF サイズ制限。
- `pdfMaxPages`: `pdf` ツールの抽出フォールバック モードで考慮されるデフォルトの最大ページ数。
- `model.primary`: `provider/model` の形式 (例: `anthropic/claude-opus-4-6`)。プロバイダーを省略した場合、OpenClaw は `anthropic` (非推奨) を想定します。
- `models`: `/model` の構成されたモデル カタログと許可リスト。各エントリには、`alias` (ショートカット) および `params` (プロバイダー固有、たとえば、`temperature`、`maxTokens`、`cacheRetention`、`context1m`) を含めることができます。- `params` マージ優先順位 (構成): `agents.defaults.models["provider/model"].params` がベースで、その後 `agents.list[].params` (エージェント ID と一致する) がキーによってオーバーライドされます。
- これらのフィールドを変更する構成ライター (`/models set`、`/models set-image`、およびフォールバック追加/削除コマンドなど) は、可能であれば正規のオブジェクト形式を保存し、既存のフォールバック リストを保存します。
- `maxConcurrent`: 最大並列エージェントはセッション間で実行されます (各セッションはまだシリアル化されています)。デフォルト: 1。

**組み込みのエイリアスの短縮表記** (モデルが `agents.defaults.models` の場合にのみ適用されます):

|別名 |モデル |
| ------------------- | -------------------------------------- |
| `opus` | `anthropic/claude-opus-4-6` |
| `sonnet` | `anthropic/claude-sonnet-4-6` |
| `gpt` | `openai/gpt-5.4` |
| `gpt-mini` | `openai/gpt-5-mini` |
| `gemini` | `google/gemini-3.1-pro-preview` |
| `gemini-flash` | `google/gemini-3-flash-preview` |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview` |

設定したエイリアスは常にデフォルトよりも優先されます。Z.AI GLM-4.x モデルは、`--thinking off` を設定するか、`agents.defaults.models["zai/<model>"].params.thinking` を自分で定義しない限り、思考モードを自動的に有効にします。
Z.AI モデルでは、ツール呼び出しストリーミングに対してデフォルトで `tool_stream` が有効になっています。無効にするには、`agents.defaults.models["zai/<model>"].params.tool_stream` を `false` に設定します。
Anthropic Claude 4.6 モデルは、明示的思考レベルが設定されていない場合、デフォルトで `adaptive` 思考になります。

### `agents.defaults.cliBackends`

テキストのみのフォールバック実行用のオプションの CLI バックエンド (ツール呼び出しなし)。 API プロバイダーに障害が発生した場合のバックアップとして役立ちます。

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          systemPromptArg: "--system",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
````

- CLI バックエンドはテキストファーストです。ツールは常に無効になっています。
- `sessionArg` が設定されている場合にサポートされるセッション。
- `imageArg` がファイル パスを受け入れる場合、イメージ パススルーがサポートされます。

### `agents.defaults.heartbeat`

定期的なハートビートが実行されます。

````json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m disables
        model: "openai/gpt-5.2-mini",
        includeReasoning: false,
        lightContext: false, // default: false; true keeps only HEARTBEAT.md from workspace bootstrap files
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (default) | block
        target: "none", // default: none | options: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
      },
    },
  },
}
```- `every`: 期間文字列 (ms/s/m/h)。デフォルト: `30m`。
- `suppressToolErrorWarnings`: true の場合、ハートビートの実行中にツール エラー警告ペイロードが抑制されます。
- `directPolicy`: 直接/DM 配信ポリシー。 `allow` (デフォルト) は、直接ターゲット配信を許可します。 `block` は直接ターゲットの配信を抑制し、`reason=dm-blocked` を発行します。
- `lightContext`: true の場合、ハートビートの実行では軽量ブートストラップ コンテキストが使用され、ワー​​クスペース ブートストラップ ファイルから `HEARTBEAT.md` のみが保持されます。
- エージェントごと: `agents.list[].heartbeat` を設定します。いずれかのエージェントが `heartbeat` を定義すると、**それらのエージェントのみ** がハートビートを実行します。
- ハートビートはエージェント ターン全体を実行します。間隔が短いほど、より多くのトークンが消費されます。

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        reserveTokensFloor: 24000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // used when identifierPolicy=custom
        postCompactionSections: ["Session Startup", "Red Lines"], // [] disables reinjection
        model: "openrouter/anthropic/claude-sonnet-4-5", // optional compaction-only model override
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```- `mode`: `default` または `safeguard` (長い履歴のチャンク化された要約)。 [圧縮](/concepts/compaction) を参照してください。
- `identifierPolicy`: `strict` (デフォルト)、`off`、または `custom`。 `strict` は、圧縮要約中に組み込みの不透明な識別子保持ガイダンスを先頭に追加します。
- `identifierInstructions`: `identifierPolicy=custom` の場合に使用されるオプションのカスタム識別子保存テキスト。
- `postCompactionSections`: 圧縮後に再挿入するオプションの AGENTS.md H2/H3 セクション名。デフォルトは `["Session Startup", "Red Lines"]` です。 `[]` を設定して再注入を無効にします。設定を解除するか、そのデフォルトのペアに明示的に設定すると、古い `Every Session`/`Safety` 見出しもレガシー フォールバックとして受け入れられます。
- `model`: 圧縮要約のみのオプションの `provider/model-id` オーバーライド。これは、メイン セッションで 1 つのモデルを保持する必要があるが、圧縮サマリーを別のモデルで実行する必要がある場合に使用します。設定されていない場合、圧縮ではセッションのプライマリ モデルが使用されます。
- `memoryFlush`: 耐久性のあるメモリを保存するための自動圧縮前のサイレント エージェント ターン。ワークスペースが読み取り専用の場合はスキップされます。

### `agents.defaults.contextPruning`

LLM に送信する前に、メモリ内コンテキストから **古いツールの結果** を削除します。ディスク上のセッション履歴は**変更されません**。

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // duration (ms/s/m/h), default unit: minutes
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Old tool result content cleared]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
````

<Accordion title="キャッシュ TTL モードの動作">- `mode: "cache-ttl"` はプルーニング パスを有効にします。

- `ttl` は、プルーニングを再度実行できる頻度 (最後のキャッシュ タッチ後) を制御します。
- プルーニングでは、まずサイズの大きいツール結果がソフト トリムされ、次に必要に応じて古いツール結果がハードクリアされます。

**ソフトトリム**は、先頭と末尾を維持し、途中に `...` を挿入します。

**ハードクリア** は、ツールの結果全体をプレースホルダーに置き換えます。

注:

- 画像ブロックは決してトリミング/クリアされません。
- 比率は文字ベース (概算) であり、正確なトークン数ではありません。
- 存在するアシスタント メッセージが `keepLastAssistants` 未満の場合、プルーニングはスキップされます。

</Accordion>

動作の詳細については、[セッション プルーニング](/concepts/session-pruning) を参照してください。

### ストリーミングをブロックする

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (use minMs/maxMs)
    },
  },
}
```

- Telegram 以外のチャネルでは、ブロック応答を有効にするには明示的な `*.blockStreaming: true` が必要です。
- チャネル オーバーライド: `channels.<channel>.blockStreamingCoalesce` (およびアカウントごとのバリアント)。 Signal/Slack/Discord/Google Chat のデフォルト `minChars: 1500`。
- `humanDelay`: ブロック返信間のランダムな一時停止。 `natural` = 800 ～ 2500 ミリ秒。エージェントごとのオーバーライド: `agents.list[].humanDelay`。

動作とチャンク化の詳細については、[ストリーミング](/concepts/streaming) を参照してください。

### タイピングインジケーター

```json5
{
  agents: {
    defaults: {
      typingMode: "instant", // never | instant | thinking | message
      typingIntervalSeconds: 6,
    },
  },
}
```

- デフォルト: 直接チャット/メンションの場合は `instant`、言及されていないグループ チャットの場合は `message`。
- セッションごとのオーバーライド: `session.typingMode`、`session.typingIntervalSeconds`。

[タイピングインジケーター](/concepts/typing-indicators) を参照してください。

### `agents.defaults.sandbox`埋め込みエージェント用のオプションの **Docker サンドボックス**。完全なガイドについては、[サンドボックス](/gateway/sandboxing) を参照してください

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        scope: "agent", // session | agent | shared
        workspaceAccess: "none", // none | ro | rw
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          containerPrefix: "openclaw-sbx-",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
          capDrop: ["ALL"],
          env: { LANG: "C.UTF-8" },
          setupCommand: "apt-get update && apt-get install -y git curl jq",
          pidsLimit: 256,
          memory: "1g",
          memorySwap: "2g",
          cpus: 1,
          ulimits: {
            nofile: { soft: 1024, hard: 2048 },
            nproc: 256,
          },
          seccompProfile: "/path/to/seccomp.json",
          apparmorProfile: "openclaw-sandbox",
          dns: ["1.1.1.1", "8.8.8.8"],
          extraHosts: ["internal.service:10.0.0.5"],
          binds: ["/home/user/source:/source:rw"],
        },
        browser: {
          enabled: false,
          image: "openclaw-sandbox-browser:bookworm-slim",
          network: "openclaw-sandbox-browser",
          cdpPort: 9222,
          cdpSourceRange: "172.21.0.1/32",
          vncPort: 5900,
          noVncPort: 6080,
          headless: false,
          enableNoVnc: true,
          allowHostControl: false,
          autoStart: true,
          autoStartTimeoutMs: 12000,
        },
        prune: {
          idleHours: 24,
          maxAgeDays: 7,
        },
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        allow: [
          "exec",
          "process",
          "read",
          "write",
          "edit",
          "apply_patch",
          "sessions_list",
          "sessions_history",
          "sessions_send",
          "sessions_spawn",
          "session_status",
        ],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"],
      },
    },
  },
}
```

<Accordion title="サンドボックスの詳細">

**ワークスペースへのアクセス:**

- `none`: `~/.openclaw/sandboxes` の下のスコープごとのサンドボックス ワークスペース
- `ro`: サンドボックス ワークスペースは `/workspace`、エージェント ワークスペースは `/agent` に読み取り専用でマウントされています
- `rw`: エージェント ワークスペースは `/workspace` に読み取り/書き込み可能にマウントされました

**範囲:**

- `session`: セッションごとのコンテナ + ワークスペース
- `agent`: エージェントごとに 1 つのコンテナ + ワークスペース (デフォルト)
- `shared`: 共有コンテナーとワークスペース (セッション間の分離なし)

**`setupCommand`** は、コンテナーの作成後に 1 回実行されます (`sh -lc` 経由)。ネットワーク出力、書き込み可能な root、root ユーザーが必要です。

**コンテナのデフォルトは `network: "none"`** です。エージェントが送信アクセスを必要とする場合は、`"bridge"` (またはカスタム ブリッジ ネットワーク) に設定されます。
`"host"` はブロックされています。 `"container:<id>"` は、明示的に設定しない限り、デフォルトでブロックされます
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (ガラス破り)。

**受信添付ファイル**は、アクティブなワークスペースの `media/inbound/*` にステージングされます。

**`docker.binds`** は追加のホスト ディレクトリをマウントします。グローバル バインドとエージェントごとのバインドがマージされます。**サンドボックス ブラウザ** (`sandbox.browser.enabled`): コンテナ内の Chromium + CDP。 noVNC URL がシステム プロンプトに挿入されました。 `openclaw.json` に `browser.enabled` は必要ありません。
noVNC オブザーバー アクセスでは、デフォルトで VNC 認証が使用され、OpenClaw は (共有 URL でパスワードを公開する代わりに) 有効期間の短いトークン URL を発行します。- `allowHostControl: false` (デフォルト) は、サンドボックス化されたセッションがホスト ブラウザーをターゲットにすることをブロックします。

- `network` のデフォルトは `openclaw-sandbox-browser` (専用ブリッジ ネットワーク) です。明示的にグローバル ブリッジ接続が必要な場合にのみ、`bridge` に設定します。
- `cdpSourceRange` は、オプションでコンテナ エッジでの CDP イングレスを CIDR 範囲に制限します (`172.21.0.1/32` など)。
- `sandbox.browser.binds` は、追加のホスト ディレクトリをサンドボックス ブラウザ コンテナのみにマウントします。設定すると (`[]` を含む)、ブラウザー コンテナーの `docker.binds` が置き換えられます。
- 起動デフォルトは `scripts/sandbox-browser-entrypoint.sh` で定義され、コンテナー ホスト用に調整されています。
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-3d-apis`
  - `--disable-gpu`
  - `--disable-software-rasterizer`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-features=TranslateUI`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--renderer-process-limit=2`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--disable-extensions` (デフォルトで有効)
  - `--disable-3d-apis`、`--disable-software-rasterizer`、および `--disable-gpu` は
    デフォルトで有効になっており、次のコマンドで無効にできます
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` WebGL/3D の使用に必要な場合。
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` は、ワークフローが次の場合に拡張機能を再度有効にします。
    彼ら次第です。
  - `--renderer-process-limit=2` は次のように変更できます。
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; Chromium を使用するように `0` を設定します
    デフォルトのプロセス制限。- `noSandbox` が有効な場合は、`--no-sandbox` および `--disable-setuid-sandbox` が追加されます。
  - デフォルトはコンテナイメージのベースラインです。カスタムのブラウザ画像をカスタムで使用する
    コンテナのデフォルトを変更するためのエントリポイント。

</Accordion>

イメージをビルドします。

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

### `agents.list` (エージェントごとの上書き)

````json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "Main Agent",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // or { primary, fallbacks }
        params: { cacheRetention: "none" }, // overrides matching defaults.models params by key
        identity: {
          name: "Samantha",
          theme: "helpful sloth",
          emoji: "🦥",
          avatar: "avatars/samantha.png",
        },
        groupChat: { mentionPatterns: ["@openclaw"] },
        sandbox: { mode: "off" },
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
        subagents: { allowAgents: ["*"] },
        tools: {
          profile: "coding",
          allow: ["browser"],
          deny: ["canvas"],
          elevated: { enabled: true },
        },
      },
    ],
  },
}
```- `id`: 安定したエージェント ID (必須)。
- `default`: 複数が設定されている場合、最初が優先されます (警告がログに記録されます)。何も設定されていない場合は、最初のリスト エントリがデフォルトになります。
- `model`: 文字列形式は `primary` のみをオーバーライドします。オブジェクト フォーム `{ primary, fallbacks }` は両方をオーバーライドします (`[]` はグローバル フォールバックを無効にします)。 `primary` をオーバーライドするだけの Cron ジョブは、`fallbacks: []` を設定しない限り、デフォルトのフォールバックを継承します。
- `params`: `agents.defaults.models` で選択されたモデル エントリにマージされたエージェントごとのストリーム パラメーター。これは、モデル カタログ全体を複製せずに、`cacheRetention`、`temperature`、`maxTokens` などのエージェント固有のオーバーライドに使用します。
- `runtime`: オプションのエージェントごとのランタイム記述子。エージェントがデフォルトで ACP ハーネス セッションを使用する必要がある場合は、`type: "acp"` を `runtime.acp` デフォルト (`agent`、`backend`、`mode`、`cwd`) とともに使用します。
- `identity.avatar`: ワークスペース相対パス、`http(s)` URL、または `data:` URI。
- `identity` はデフォルトを派生します: `emoji` から `ackReaction`、`name`/`emoji` から `mentionPatterns`。
- `subagents.allowAgents`: `sessions_spawn` のエージェント ID の許可リスト (`["*"]` = 任意、デフォルト: 同じエージェントのみ)。
- サンドボックス継承ガード: リクエスター セッションがサンドボックス化されている場合、`sessions_spawn` はサンドボックス化されずに実行されるターゲットを拒否します。

---## マルチエージェントルーティング

1 つのゲートウェイ内で複数の分離されたエージェントを実行します。 [マルチエージェント](/concepts/multi-agent) を参照してください。

```json5
{
  agents: {
    list: [
      { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
      { id: "work", workspace: "~/.openclaw/workspace-work" },
    ],
  },
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
  ],
}
````

### 一致フィールドのバインディング

- `type` (オプション): 通常のルーティングの場合は `route` (タイプが欠落している場合はデフォルトでルーティングされます)、永続的な ACP 会話バインディングの場合は `acp`。
- `match.channel` (必須)
- `match.accountId` (オプション; `*` = 任意のアカウント; 省略 = デフォルトのアカウント)
- `match.peer` (オプション; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (オプション、チャネル固有)
- `acp` (オプション; `type: "acp"` のみ): `{ mode, label, cwd, backend }`

**決定的な一致順序:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (正確、ピア/ギルド/チームなし)
5. `match.accountId: "*"` (チャネル全体)
6. デフォルトエージェント

各層内で、最初に一致した `bindings` エントリが優先されます。

`type: "acp"` エントリの場合、OpenClaw は正確な会話 ID (`match.channel` + アカウント + `match.peer.id`) によって解決し、上記のルート バインディング層の順序は使用しません。

### エージェントごとのアクセス プロファイル

<Accordion title="フルアクセス (サンドボックスなし)">

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="読み取り専用ツール + ワークスペース">

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "ro" },
        tools: {
          allow: [
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="ファイルシステムへのアクセスなし (メッセージングのみ)">

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "none" },
        tools: {
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
            "gateway",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

</Accordion>

優先順位の詳細については、[マルチエージェント サンドボックスとツール](/tools/multi-agent-sandbox-tools) を参照してください。

---

## セッション

```json5
{
  session: {
    scope: "per-sender",
    dmScope: "main", // main | per-peer | per-channel-peer | per-account-channel-peer
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      mode: "daily", // daily | idle
      atHour: 4,
      idleMinutes: 60,
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      direct: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    parentForkMaxTokens: 100000, // skip parent-thread fork above this token count (0 disables)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // duration or false
      maxDiskBytes: "500mb", // optional hard budget
      highWaterBytes: "400mb", // optional cleanup target
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // default inactivity auto-unfocus in hours (`0` disables)
      maxAgeHours: 0, // default hard max age in hours (`0` disables)
    },
    mainKey: "main", // legacy (runtime always uses "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="セッションフィールドの詳細">- **`dmScope`**: DM がグループ化される方法。

- `main`: すべての DM がメイン セッションを共有します。
- `per-peer`: チャネル間で送信者 ID によって分離します。
- `per-channel-peer`: チャネル + 送信者ごとに分離します (マルチユーザーの受信箱に推奨)。
- `per-account-channel-peer`: アカウント + チャネル + 送信者ごとに分離します (複数のアカウントに推奨)。
- **`identityLinks`**: クロスチャネルセッション共有のために、正規 ID をプロバイダープレフィックス付きのピアにマップします。
- **`reset`**: プライマリ リセット ポリシー。 `daily` は現地時間の `atHour` にリセットされます。 `idle` は `idleMinutes` の後にリセットされます。両方が設定されている場合は、先に期限が切れた方が優先されます。
- **`resetByType`**: タイプごとのオーバーライド (`direct`、`group`、`thread`)。レガシー `dm` は `direct` のエイリアスとして受け入れられます。
- **`parentForkMaxTokens`**: フォークされたスレッド セッションの作成時に許可される最大親セッション `totalTokens` (デフォルト `100000`)。
  - 親 `totalTokens` がこの値を超えている場合、OpenClaw は親トランスクリプト履歴を継承する代わりに、新しいスレッド セッションを開始します。
  - このガードを無効にし、常に親のフォークを許可するには、`0` を設定します。
- **`mainKey`**: 従来のフィールド。ランタイムは、メインのダイレクト チャット バケットに常に `"main"` を使用するようになりました。- **`sendPolicy`**: `channel`、`chatType` (`direct|group|channel`、従来の `dm` エイリアスを使用)、`keyPrefix`、または `rawKeyPrefix` による一致。最初に拒否した方が勝ちです。
- **`maintenance`**: セッション ストアのクリーンアップ + 保持制御。
  - `mode`: `warn` は警告のみを発行します。 `enforce` はクリーンアップを適用します。
  - `pruneAfter`: 古いエントリの期限切れ (デフォルト `30d`)。
  - `maxEntries`: `sessions.json` のエントリの最大数 (デフォルトは `500`)。
  - `rotateBytes`: このサイズを超える場合、`sessions.json` を回転します (デフォルト `10mb`)。
  - `resetArchiveRetention`: `*.reset.<timestamp>` トランスクリプト アーカイブの保持。デフォルトは `pruneAfter` です。 `false` を無効に設定します。
  - `maxDiskBytes`: オプションのセッション ディレクトリのディスク バジェット。 `warn` モードでは、警告がログに記録されます。 `enforce` モードでは、最も古いアーティファクト/セッションが最初に削除されます。
  - `highWaterBytes`: 予算クリーンアップ後のオプションのターゲット。デフォルトは `80%` または `maxDiskBytes` です。
- **`threadBindings`**: スレッドバインドされたセッション機能のグローバルデフォルト。
  - `enabled`: マスターデフォルトスイッチ (プロバイダーは上書き可能; Discord は `channels.discord.threadBindings.enabled` を使用します)
  - `idleHours`: デフォルトの非アクティブ状態は時間単位で自動的にフォーカスを解除します (`0` は無効になります。プロバイダーはオーバーライドできます)- `maxAgeHours`: デフォルトのハードマックス経過時間 (`0` は無効になります。プロバイダーはオーバーライドできます)

</Accordion>

---

## メッセージ

```json5
{
  messages: {
    responsePrefix: "🦞", // or "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "collect", // steer | followup | collect | steer-backlog | steer+backlog | queue | interrupt
      debounceMs: 1000,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "collect",
        telegram: "collect",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 disables
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### 応答プレフィックス

チャネル/アカウントごとのオーバーライド: `channels.<channel>.responsePrefix`、`channels.<channel>.accounts.<id>.responsePrefix`。

解決策 (最も具体的な勝利): アカウント → チャネル → グローバル。 `""` はカスケードを無効にして停止します。 `"auto"` は `[{identity.name}]` を派生させます。

**テンプレート変数:**

| 変数              | 説明               | 例                          |
| ----------------- | ------------------ | --------------------------- |
| `{model}`         | 短いモデル名       | `claude-opus-4-6`           |
| `{modelFull}`     | 完全なモデル識別子 | `anthropic/claude-opus-4-6` |
| `{provider}`      | プロバイダー名     | `anthropic`                 |
| `{thinkingLevel}` | 現在の思考レベル   | `high`、`low`、`off`        |
| `{identity.name}` | エージェント ID 名 | (`"auto"` と同じ)           |

変数では大文字と小文字が区別されません。 `{think}` は、`{thinkingLevel}` のエイリアスです。

### ACK反応- デフォルトはアクティブなエージェントの `identity.emoji`、それ以外の場合は `"👀"` です。 `""` を無効に設定します

- チャネルごとのオーバーライド: `channels.<channel>.ackReaction`、`channels.<channel>.accounts.<id>.ackReaction`。
- 解決順序: アカウント → チャネル → `messages.ackReaction` → ID フォールバック。
- スコープ: `group-mentions` (デフォルト)、`group-all`、`direct`、`all`。
- `removeAckAfterReply`: 返信後の確認応答を削除します (Slack/Discord/Telegram/Google Chat のみ)。

### インバウンドデバウンス

同じ送信者からのテキストのみの迅速なメッセージを 1 つのエージェント ターンにバッチ処理します。メディア/添付ファイルはすぐにフラッシュされます。制御コマンドはデバウンスをバイパスします。

### TTS (テキスト読み上げ)

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      elevenlabs: {
        apiKey: "elevenlabs_api_key",
        baseUrl: "https://api.elevenlabs.io",
        voiceId: "voice_id",
        modelId: "eleven_multilingual_v2",
        seed: 42,
        applyTextNormalization: "auto",
        languageCode: "en",
        voiceSettings: {
          stability: 0.5,
          similarityBoost: 0.75,
          style: 0.0,
          useSpeakerBoost: true,
          speed: 1.0,
        },
      },
      openai: {
        apiKey: "openai_api_key",
        baseUrl: "https://api.openai.com/v1",
        model: "gpt-4o-mini-tts",
        voice: "alloy",
      },
    },
  },
}
```

- `auto` は自動 TTS を制御します。 `/tts off|always|inbound|tagged` はセッションごとにオーバーライドされます。
- `summaryModel` は、自動要約の `agents.defaults.model.primary` をオーバーライドします。
- `modelOverrides` はデフォルトで有効になっています。 `modelOverrides.allowProvider` のデフォルトは `false` (オプトイン) です。
- API キーは `ELEVENLABS_API_KEY`/`XI_API_KEY` および `OPENAI_API_KEY` にフォールバックします。
- `openai.baseUrl` は OpenAI TTS エンドポイントをオーバーライドします。解決順序は、config、次に `OPENAI_TTS_BASE_URL`、次に `https://api.openai.com/v1` です。
- `openai.baseUrl` が非 OpenAI エンドポイントを指している場合、OpenClaw はそれを OpenAI 互換の TTS サーバーとして扱い、モデル/音声の検証を緩和します。

---

## 話す

トーク モードのデフォルト (macOS/iOS/Android)。

````json5
{
  talk: {
    voiceId: "elevenlabs_voice_id",
    voiceAliases: {
      Clawd: "EXAVITQu4vr4xnSDxMaL",
      Roger: "CwhRBWXzGAHq8TQ4Fs17",
    },
    modelId: "eleven_v3",
    outputFormat: "mp3_44100_128",
    apiKey: "elevenlabs_api_key",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```- 音声 ID は `ELEVENLABS_VOICE_ID` または `SAG_VOICE_ID` にフォールバックします。
- `apiKey` および `providers.*.apiKey` は、プレーンテキスト文字列または SecretRef オブジェクトを受け入れます。
- `ELEVENLABS_API_KEY` フォールバックは、Talk API キーが設定されていない場合にのみ適用されます。
- `voiceAliases` により、Talk ディレクティブにフレンドリ名を使用できるようになります。
- `silenceTimeoutMs` は、ユーザーが沈黙した後、トランスクリプトを送信するまでトーク モードが待機する時間を制御します。設定を解除すると、プラットフォームのデフォルトの一時停止ウィンドウ (`700 ms on macOS and Android, 900 ms on iOS`) が維持されます。

---

## ツール

### 工具プロファイル

`tools.profile` は、`tools.allow`/`tools.deny` の前に基本ホワイトリストを設定します。

ローカル オンボーディングは、設定を解除すると、新しいローカル構成をデフォルトで `tools.profile: "coding"` に設定します (既存の明示的なプロファイルは保持されます)。

|プロフィール |含まれるもの |
| ----------- | ----------------------------------------------------------------------------------------- |
| `minimal` | `session_status` のみ |
| `coding` | `group:fs`、`group:runtime`、`group:sessions`、`group:memory`、`image` |
| `messaging` | `group:messaging`、`sessions_list`、`sessions_history`、`sessions_send`、`session_status` |
| `full` |制限なし（未設定と同じ） |### ツールグループ|グループ |ツール |
| ------------------ | -------------------------------------------------------------------------------------- |
| `group:runtime` | `exec`、`process` (`bash` は `exec` のエイリアスとして受け入れられます)
| `group:fs` | `read`、`write`、`edit`、`apply_patch` |
| `group:sessions` | `sessions_list`、`sessions_history`、`sessions_send`、`sessions_spawn`、`session_status` |
| `group:memory` | `memory_search`、`memory_get` |
| `group:web` | `web_search`、`web_fetch` |
| `group:ui` | `browser`、`canvas` |
| `group:automation` | `cron`、`gateway` |
| `group:messaging` | `message` || `group:nodes` | `nodes` |
| `group:openclaw` |すべての組み込みツール (プロバイダー プラグインを除く) |

### `tools.allow` / `tools.deny`

グローバル ツールの許可/拒否ポリシー (拒否の勝利)。大文字と小文字は区別されず、`*` ワイルドカードをサポートします。 Docker サンドボックスがオフの場合でも適用されます。

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
````

### `tools.byProvider`

特定のプロバイダーまたはモデル用のツールをさらに制限します。順序: 基本プロファイル → プロバイダー プロファイル → 許可/拒否。

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
      "openai/gpt-5.2": { allow: ["group:fs", "sessions_list"] },
    },
  },
}
```

### `tools.elevated`

昇格された (ホスト) 実行アクセスを制御します。

```json5
{
  tools: {
    elevated: {
      enabled: true,
      allowFrom: {
        whatsapp: ["+15555550123"],
        discord: ["1234567890123", "987654321098765432"],
      },
    },
  },
}
```

- エージェントごとのオーバーライド (`agents.list[].tools.elevated`) は、さらに制限することしかできません。
- `/elevated on|off|ask|full` はセッションごとの状態を保存します。インラインディレクティブは単一のメッセージに適用されます。
- 昇格された `exec` がホスト上で実行され、サンドボックスがバイパスされます。

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.2"],
      },
    },
  },
}
```

### `tools.loopDetection`

ツールループの安全性チェックは **デフォルトでは無効になっています**。 `enabled: true` を設定して検出を有効にします。
設定は `tools.loopDetection` でグローバルに定義でき、`agents.list[].tools.loopDetection` でエージェントごとに上書きできます。

````json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```- `historySize`: ループ解析のために保持される最大ツール呼び出し履歴。
- `warningThreshold`: 警告に対する進行なしパターンのしきい値を繰り返します。
- `criticalThreshold`: クリティカルなループをブロックするためのより高い繰り返ししきい値。
- `globalCircuitBreakerThreshold`: 進行状況のない実行に対するハードストップのしきい値。
- `detectors.genericRepeat`: 同じツール/同じ引数の繰り返し呼び出しを警告します。
- `detectors.knownPollNoProgress`: 既知の投票ツール (`process.poll`、`command_status` など) に対して警告/ブロックします。
- `detectors.pingPong`: 交互に進行しないペアのパターンを警告/ブロックします。
- `warningThreshold >= criticalThreshold` または `criticalThreshold >= globalCircuitBreakerThreshold` の場合、検証は失敗します。

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // or BRAVE_API_KEY env
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        maxChars: 50000,
        maxCharsCap: 50000,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        userAgent: "custom-ua",
      },
    },
  },
}
````

### `tools.media`

インバウンドメディア理解 (画像/音声/ビデオ) を構成します。

```json5
{
  tools: {
    media: {
      concurrency: 2,
      audio: {
        enabled: true,
        maxBytes: 20971520,
        scope: {
          default: "deny",
          rules: [{ action: "allow", match: { chatType: "direct" } }],
        },
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          { type: "cli", command: "whisper", args: ["--model", "base", "{{MediaPath}}"] },
        ],
      },
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },
}
```

<Accordion title="メディアモデル入力フィールド">

**プロバイダーエントリ** (`type: "provider"` または省略):

- `provider`: API プロバイダー ID (`openai`、`anthropic`、`google`/`gemini`、`groq` など)
- `model`: モデル ID の上書き
- `profile` / `preferredProfile`: `auth-profiles.json` プロファイルの選択

**CLI エントリ** (`type: "cli"`):

- `command`: 実行する実行可能ファイル
- `args`: テンプレート化された引数 (`{{MediaPath}}`、`{{Prompt}}`、`{{MaxChars}}` などをサポート)

**共通フィールド:**- `capabilities`: オプションのリスト (`image`、`audio`、`video`)。デフォルト: `openai`/`anthropic`/`minimax` → 画像、`google` → 画像+音声+ビデオ、`groq` → 音声。

- `prompt`、`maxChars`、`maxBytes`、`timeoutSeconds`、`language`: エントリごとの上書き。
- 失敗は次のエントリにフォールバックします。

プロバイダー認証は標準の順序に従います: `auth-profiles.json` → 環境変数 → `models.providers.*.apiKey`。

</Accordion>

### `tools.agentToAgent`

```json5
{
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },
}
```

### `tools.sessions`

セッション ツール (`sessions_list`、`sessions_history`、`sessions_send`) の対象にできるセッションを制御します。

デフォルト: `tree` (現在のセッション + それによって生成されたセッション (サブエージェントなど))。

```json5
{
  tools: {
    sessions: {
      // "self" | "tree" | "agent" | "all"
      visibility: "tree",
    },
  },
}
```

注:

- `self`: 現在のセッション キーのみ。
- `tree`: 現在のセッション + 現在のセッションによって生成されたセッション (サブエージェント)。
- `agent`: 現在のエージェント ID に属する任意のセッション (同じエージェント ID で送信者ごとのセッションを実行する場合は、他のユーザーを含めることができます)。
- `all`: 任意のセッション。クロスエージェントターゲティングには引き続き `tools.agentToAgent` が必要です。
- サンドボックス クランプ: 現在のセッションがサンドボックス化されており、`agents.defaults.sandbox.sessionToolsVisibility="spawned"` である場合、`tools.sessions.visibility="all"` であっても、可視性は強制的に `tree` に設定されます。

### `tools.sessions_spawn`

`sessions_spawn` のインライン添付ファイルのサポートを制御します。

````json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // opt-in: set true to allow inline file attachments
        maxTotalBytes: 5242880, // 5 MB total across all files
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB per file
        retainOnSessionKeep: false, // keep attachments when cleanup="keep"
      },
    },
  },
}
```注:

- 添付ファイルは `runtime: "subagent"` でのみサポートされます。 ACP ランタイムはそれらを拒否します。
- ファイルは、`.manifest.json` を使用して、`.openclaw/attachments/<uuid>/` の子ワークスペースに実体化されます。
- 添付ファイルのコンテンツは、トランスクリプトの永続性から自動的に編集されます。
- Base64 入力は、厳密なアルファベット/パディング チェックとプリデコード サイズ ガードによって検証されます。
- ファイル権限は、ディレクトリの場合は `0700`、ファイルの場合は `0600` です。
- クリーンアップは `cleanup` ポリシーに従います。 `delete` は常に添付ファイルを削除します。 `keep` は、`retainOnSessionKeep: true` の場合にのみそれらを保持します。

### `tools.subagents`

```json5
{
  agents: {
    defaults: {
      subagents: {
        model: "minimax/MiniMax-M2.5",
        maxConcurrent: 1,
        runTimeoutSeconds: 900,
        archiveAfterMinutes: 60,
      },
    },
  },
}
````

- `model`: 生成されたサブエージェントのデフォルト モデル。省略した場合、サブエージェントは呼び出し元のモデルを継承します。
- `runTimeoutSeconds`: ツール呼び出しで `runTimeoutSeconds` が省略された場合の `sessions_spawn` のデフォルトのタイムアウト (秒)。 `0` はタイムアウトがないことを意味します。
- サブエージェントごとのツール ポリシー: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`。

---

## カスタムプロバイダーとベース URL

OpenClaw は、pi-coding-agent モデル カタログを使用します。構成内の `models.providers` または `~/.openclaw/agents/<agentId>/agent/models.json` を介してカスタム プロバイダーを追加します。

````json5
{
  models: {
    mode: "merge", // merge (default) | replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai
        models: [
          {
            id: "llama-3.1-8b",
            name: "Llama 3.1 8B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```- カスタム認証が必要な場合は、`authHeader: true` + `headers` を使用します。
- エージェント設定ルートを `OPENCLAW_AGENT_DIR` (または `PI_CODING_AGENT_DIR`) でオーバーライドします。
- 一致するプロバイダー ID のマージの優先順位:
  - 空ではないエージェント `models.json` `baseUrl` 値が優先されます。
  - 空ではないエージェント `apiKey` 値は、そのプロバイダーが現在の構成/認証プロファイル コンテキストで SecretRef で管理されていない場合にのみ優先されます。
  - SecretRef 管理プロバイダーの `apiKey` 値は、解決されたシークレットを保持するのではなく、ソース マーカー (環境参照の場合は `ENV_VAR_NAME`、ファイル/実行参照の場合は `secretref-managed`) から更新されます。
  - 空または欠落しているエージェント `apiKey`/`baseUrl` は、構成内の `models.providers` にフォールバックします。
  - マッチングモデル `contextWindow`/`maxTokens` は、明示的な構成値と暗黙的なカタログ値の間の高い値を使用します。
  - 構成で `models.json` を完全に書き換える場合は、`models.mode: "replace"` を使用します。

### プロバイダーフィールドの詳細- `models.mode`: プロバイダー カタログの動作 (`merge` または `replace`)。
- `models.providers`: プロバイダー ID をキーとするカスタム プロバイダー マップ。
- `models.providers.*.api`: アダプターを要求します (`openai-completions`、`openai-responses`、`anthropic-messages`、`google-generative-ai` など)。
- `models.providers.*.apiKey`: プロバイダーの資格情報 (SecretRef/env 置換を推奨)。
- `models.providers.*.auth`: 認証戦略 (`api-key`、`token`、`oauth`、`aws-sdk`)。
- `models.providers.*.injectNumCtxForOpenAICompat`: Ollama + `openai-completions` の場合、`options.num_ctx` をリクエストに挿入します (デフォルト: `true`)。
- `models.providers.*.authHeader`: 必要に応じて、`Authorization` ヘッダーで資格情報のトランスポートを強制します。
- `models.providers.*.baseUrl`: アップストリーム API ベース URL。
- `models.providers.*.headers`: プロキシ/テナント ルーティング用の追加の静的ヘッダー。
- `models.providers.*.models`: 明示的なプロバイダー モデル カタログ エントリ。
- `models.providers.*.models.*.compat.supportsDeveloperRole`: オプションの互換性ヒント。空ではない非ネイティブ `baseUrl` (`api.openai.com` ではないホスト) を持つ `api: "openai-completions"` の場合、OpenClaw は実行時にこれを強制的に `false` に設定します。空または省略された `baseUrl` は、デフォルトの OpenAI 動作を維持します。
- `models.bedrockDiscovery`: Bedrock 自動検出設定のルート。
- `models.bedrockDiscovery.enabled`: 検出ポーリングをオン/オフにします。
- `models.bedrockDiscovery.region`: 検出用の AWS リージョン。
- `models.bedrockDiscovery.providerFilter`: ターゲットを絞った検出のためのオプションのプロバイダー ID フィルター。
- `models.bedrockDiscovery.refreshInterval`: 検出更新のポーリング間隔。- `models.bedrockDiscovery.defaultContextWindow`: 検出されたモデルのフォールバック コンテキスト ウィンドウ。
- `models.bedrockDiscovery.defaultMaxTokens`: 検出されたモデルのフォールバック最大出力トークン。

### プロバイダーの例

<Accordion title="Cerebras (GLM 4.6 / 4.7)">

```json5
{
  env: { CEREBRAS_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: {
        primary: "cerebras/zai-glm-4.7",
        fallbacks: ["cerebras/zai-glm-4.6"],
      },
      models: {
        "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
        "cerebras/zai-glm-4.6": { alias: "GLM 4.6 (Cerebras)" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      cerebras: {
        baseUrl: "https://api.cerebras.ai/v1",
        apiKey: "${CEREBRAS_API_KEY}",
        api: "openai-completions",
        models: [
          { id: "zai-glm-4.7", name: "GLM 4.7 (Cerebras)" },
          { id: "zai-glm-4.6", name: "GLM 4.6 (Cerebras)" },
        ],
      },
    },
  },
}
````

大脳には `cerebras/zai-glm-4.7` を使用します。 Z.AI ダイレクトの `zai/glm-4.7`。

</Accordion>

<Accordion title="OpenCode Zen">

```json5
{
  agents: {
    defaults: {
      model: { primary: "opencode/claude-opus-4-6" },
      models: { "opencode/claude-opus-4-6": { alias: "Opus" } },
    },
  },
}
```

`OPENCODE_API_KEY` (または `OPENCODE_ZEN_API_KEY`) を設定します。ショートカット: `openclaw onboard --auth-choice opencode-zen`。

</Accordion>

<Accordion title="Z.AI（GLM-4.7）">

```json5
{
  agents: {
    defaults: {
      model: { primary: "zai/glm-4.7" },
      models: { "zai/glm-4.7": {} },
    },
  },
}
```

`ZAI_API_KEY` を設定します。 `z.ai/*` および `z-ai/*` は別名として受け入れられます。ショートカット: `openclaw onboard --auth-choice zai-api-key`。

- 一般エンドポイント: `https://api.z.ai/api/paas/v4`
- コーディングエンドポイント (デフォルト): `https://api.z.ai/api/coding/paas/v4`
- 一般的なエンドポイントの場合、ベース URL オーバーライドを使用してカスタム プロバイダーを定義します。

</Accordion>

<Accordion title="ムーンショットAI（キミ）">

```json5
{
  env: { MOONSHOT_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "moonshot/kimi-k2.5" },
      models: { "moonshot/kimi-k2.5": { alias: "Kimi K2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "kimi-k2.5",
            name: "Kimi K2.5",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 256000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

中国エンドポイントの場合: `baseUrl: "https://api.moonshot.cn/v1"` または `openclaw onboard --auth-choice moonshot-api-key-cn`。

</Accordion>

<Accordion title="キミコーディング">

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "kimi-coding/k2p5" },
      models: { "kimi-coding/k2p5": { alias: "Kimi K2.5" } },
    },
  },
}
```

Anthropic 互換の組み込みプロバイダー。ショートカット: `openclaw onboard --auth-choice kimi-code-api-key`。

</Accordion>

<Accordion title="合成 (人為的互換性)">

```json5
{
  env: { SYNTHETIC_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
      models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "hf:MiniMaxAI/MiniMax-M2.5",
            name: "MiniMax M2.5",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 192000,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

ベース URL は `/v1` を省略する必要があります (Anthropic クライアントが追加します)。ショートカット: `openclaw onboard --auth-choice synthetic-api-key`。

</Accordion>

<Accordion title="MiniMax M2.5 (直接)">

```json5
{
  agents: {
    defaults: {
      model: { primary: "minimax/MiniMax-M2.5" },
      models: {
        "minimax/MiniMax-M2.5": { alias: "Minimax" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      minimax: {
        baseUrl: "https://api.minimax.io/anthropic",
        apiKey: "${MINIMAX_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "MiniMax-M2.5",
            name: "MiniMax M2.5",
            reasoning: false,
            input: ["text"],
            cost: { input: 15, output: 60, cacheRead: 2, cacheWrite: 10 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

`MINIMAX_API_KEY` を設定します。ショートカット: `openclaw onboard --auth-choice minimax-api`。

</Accordion>

<Accordion title="ローカルモデル (LM Studio)">[ローカル モデル](/gateway/local-models) を参照してください。 TL;DR: 本格的なハードウェアで LM Studio Response API 経由で MiniMax M2.5 を実行します。フォールバックのためにホストされたモデルをマージしたままにします。

</Accordion>

---

## スキル

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn
    },
    entries: {
      "nano-banana-pro": {
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: バンドルされたスキルのみのオプションの許可リスト (管理/ワークスペース スキルは影響を受けません)。
- `entries.<skillKey>.enabled: false` は、バンドル/インストールされている場合でもスキルを無効にします。
- `entries.<skillKey>.apiKey`: プライマリ環境変数 (プレーンテキスト文字列または SecretRef オブジェクト) を宣言するスキルの利便性。

---

## プラグイン

````json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: [],
    load: {
      paths: ["~/Projects/oss/voice-call-extension"],
    },
    entries: {
      "voice-call": {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
        config: { provider: "twilio" },
      },
    },
  },
}
```- `~/.openclaw/extensions`、`<workspace>/.openclaw/extensions`、および `plugins.load.paths` からロードされます。
- **構成を変更するにはゲートウェイの再起動が必要です。**
- `allow`: オプションの許可リスト (リストされたプラグインのみがロードされます)。 `deny` が勝ちます。
- `plugins.entries.<id>.apiKey`: プラグインレベルの API キー便利フィールド (プラグインでサポートされている場合)。
- `plugins.entries.<id>.env`: プラグインスコープの環境変数マップ。
- `plugins.entries.<id>.hooks.allowPromptInjection`: `false` の場合、コアは `before_prompt_build` をブロックし、レガシー `before_agent_start` からのプロンプト変更フィールドを無視しますが、レガシー `modelOverride` および `providerOverride` は保持します。
- `plugins.entries.<id>.config`: プラグイン定義の設定オブジェクト (プラグイン スキーマによって検証される)。
- `plugins.slots.memory`: アクティブなメモリ プラグイン ID を選択するか、メモリ プラグインを無効にする場合は `"none"` を選択します。
- `plugins.slots.contextEngine`: アクティブなコンテキスト エンジン プラグイン ID を選択します。別のエンジンをインストールして選択しない限り、デフォルトは `"legacy"` になります。
- `plugins.installs`: `openclaw plugins update` によって使用される CLI 管理のインストール メタデータ。
  - `source`、`spec`、`sourcePath`、`installPath`、`version`、`resolvedName`、`resolvedVersion`、 `resolvedSpec`、`integrity`、`shasum`、`resolvedAt`、`installedAt`。
  - `plugins.installs.*` を管理対象状態として扱います。手動編集よりも CLI コマンドを優先します。

[プラグイン](/tools/plugin) を参照してください。

---

## ブラウザ

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "chrome",
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: true, // default trusted-network mode
      // allowPrivateNetwork: true, // legacy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
    color: "#FF4500",
    // headless: false,
    // noSandbox: false,
    // extraArgs: [],
    // relayBindHost: "0.0.0.0", // only when the extension relay must be reachable across namespaces (for example WSL2)
    // executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    // attachOnly: false,
  },
}
```- `evaluateEnabled: false` は、`act:evaluate` および `wait --fn` を無効にします。
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` は、未設定の場合はデフォルトで `true` になります (信頼されたネットワーク モデル)。
- `ssrfPolicy.dangerouslyAllowPrivateNetwork: false` を設定して、厳密なパブリックのみのブラウザ ナビゲーションを実現します。
- `ssrfPolicy.allowPrivateNetwork` はレガシー エイリアスとして引き続きサポートされます。
- 厳密モードでは、明示的な例外に `ssrfPolicy.hostnameAllowlist` および `ssrfPolicy.allowedHostnames` を使用します。
- リモート プロファイルは接続専用です (開始/停止/リセットは無効)。
- 自動検出順序: Chromium ベースの場合はデフォルトのブラウザ → Chrome → Brave → Edge → Chromium → Chrome Canary。
- 制御サービス: ループバックのみ (ポートは `gateway.port` から派生、デフォルトは `18791`)。
- `extraArgs` は、ローカルの Chromium 起動に追加の起動フラグを追加します (たとえば、
  `--disable-gpu`、ウィンドウ サイズ、またはデバッグ フラグ)。
- `relayBindHost` は、Chrome 拡張機能リレーがリッスンする場所を変更します。ループバックのみのアクセスの場合は未設定のままにしておきます。 `0.0.0.0` などの明示的な非ループバック バインド アドレスは、リレーが名前空間の境界 (WSL2 など) を越える必要があり、ホスト ネットワークがすでに信頼されている場合にのみ設定します。

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, short text, image URL, or data URI
    },
  },
}
````

- `seamColor`: ネイティブ アプリ UI クロムのアクセント カラー (トーク モードのバブルの色合いなど)。
- `assistant`: UI ID オーバーライドを制御します。アクティブなエージェント ID にフォールバックします。

---

## ゲートウェイ

```json5
{
  gateway: {
    mode: "local", // local | remote
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token", // none | token | password | trusted-proxy
      token: "your-token",
      // password: "your-password", // or OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // for mode=trusted-proxy; see /gateway/trusted-proxy-auth
      allowTailscale: true,
      rateLimit: {
        maxAttempts: 10,
        windowMs: 60000,
        lockoutMs: 300000,
        exemptLoopback: true,
      },
    },
    tailscale: {
      mode: "off", // off | serve | funnel
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // allowedOrigins: ["https://control.example.com"], // required for non-loopback Control UI
      // dangerouslyAllowHostHeaderOriginFallback: false, // dangerous Host-header origin fallback mode
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    remote: {
      url: "ws://gateway.tailnet:18789",
      transport: "ssh", // ssh | direct
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // Optional. Default false.
    allowRealIpFallback: false,
    tools: {
      // Additional /tools/invoke HTTP denies
      deny: ["browser"],
      // Remove tools from the default HTTP deny list
      allow: ["gateway"],
    },
  },
}
```

<Accordion title="ゲートウェイフィールドの詳細">- `mode`: `local` (ゲートウェイを実行) または `remote` (リモート ゲートウェイに接続)。 `local` を除き、ゲートウェイは起動を拒否します。

- `port`: WS + HTTP 用の単一の多重化ポート。優先順位: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`。
- `bind`: `auto`、`loopback` (デフォルト)、`lan` (`0.0.0.0`)、`tailnet` (Tailscale IP のみ)、または`custom`。
- **レガシー バインド エイリアス**: ホスト エイリアスではなく、`gateway.bind` (`auto`、`loopback`、`lan`、`tailnet`、`custom`) のバインド モード値を使用します。 (`0.0.0.0`、`127.0.0.1`、`localhost`、`::`、`::1`)。
- **Docker 注**: デフォルトの `loopback` バインドは、コンテナー内の `127.0.0.1` をリッスンします。 Docker ブリッジ ネットワーキング (`-p 18789:18789`) では、トラフィックは `eth0` に到着するため、ゲートウェイに到達できません。すべてのインターフェイスでリッスンするには、`--network host` を使用するか、`bind: "lan"` (または `bind: "custom"` と `customBindHost: "0.0.0.0"`) を設定します。
- **認証**: デフォルトで必須。非ループバック バインドには共有トークン/パスワードが必要です。オンボーディング ウィザードはデフォルトでトークンを生成します。- `gateway.auth.token` と `gateway.auth.password` の両方が構成されている場合 (SecretRef を含む)、`gateway.auth.mode` を明示的に `token` または `password` に設定します。起動とサービスのインストール/修復フローの両方が構成され、モードが設定されていない場合、失敗します。
- `gateway.auth.mode: "none"`: 明示的な非認証モード。信頼できるローカル ループバック設定にのみ使用してください。これはオンボーディング プロンプトでは意図的に提供されません。
- `gateway.auth.mode: "trusted-proxy"`: ID 対応リバース プロキシに認証を委任し、`gateway.trustedProxies` からの ID ヘッダーを信頼します ([信頼されたプロキシ認証](/gateway/trusted-proxy-auth) を参照)。
- `gateway.auth.allowTailscale`: `true` の場合、Tailscale Serve ID ヘッダーはコントロール UI/WebSocket 認証を満たすことができます (`tailscale whois` で検証)。 HTTP API エンドポイントでは依然としてトークン/パスワード認証が必要です。このトークンレス フローは、ゲートウェイ ホストが信頼できることを前提としています。 `tailscale.mode = "serve"` の場合、デフォルトは `true` になります。
- `gateway.auth.rateLimit`: オプションの認証失敗リミッター。クライアント IP ごとおよび認証スコープごとに適用されます (共有シークレットとデバイス トークンは個別に追跡されます)。ブロックされた試行は `429` + `Retry-After` を返します。
  - `gateway.auth.rateLimit.exemptLoopback` のデフォルトは `true` です。 localhost のトラフィック レートも意図的に制限したい場合は、`false` を設定します (テスト セットアップまたは厳密なプロキシ展開の場合)。- ブラウザー オリジンの WS 認証試行は、ループバック除外が無効になっている状態で常に抑制されます (ブラウザー ベースのローカルホスト ブルート フォースに対する多層防御)。
- `tailscale.mode`: `serve` (テールネットのみ、ループバック バインド) または `funnel` (パブリック、認証が必要)。
- `controlUi.allowedOrigins`: ゲートウェイ WebSocket 接続用の明示的なブラウザー起点許可リスト。ブラウザクライアントが非ループバックオリジンからのものであることが予期される場合に必要です。
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: ホスト ヘッダー オリジン ポリシーに意図的に依存する展開でホスト ヘッダー オリジン フォールバックを有効にする危険なモード。
- `remote.transport`: `ssh` (デフォルト) または `direct` (ws/wss)。 `direct` の場合、`remote.url` は `ws://` または `wss://` である必要があります。
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: 信頼されたプライベート ネットワーク IP へのプレーンテキスト `ws://` を許可するクライアント側のブレークグラス オーバーライド。デフォルトでは平文の場合はループバックのみになります。
- `gateway.remote.token` / `.password` は、リモート クライアントの資格情報フィールドです。ゲートウェイ認証を独自に構成することはありません。
- `gateway.auth.*` が設定されていない場合、ローカル ゲートウェイの呼び出しパスはフォールバックとして `gateway.remote.*` を使用できます。
- `trustedProxies`: TLS を終了するリバース プロキシ IP。自分が制御するプロキシのみをリストします。
- `allowRealIpFallback`: `true` の場合、`X-Forwarded-For` が欠落している場合、ゲートウェイは `X-Real-IP` を受け入れます。フェールクローズ動作のデフォルト `false`。- `gateway.tools.deny`: HTTP `POST /tools/invoke` に対して追加のツール名がブロックされました (デフォルトの拒否リストを拡張します)。
- `gateway.tools.allow`: デフォルトの HTTP 拒否リストからツール名を削除します。

</Accordion>

### OpenAI 互換エンドポイント

- チャット完了: デフォルトでは無効になっています。 `gateway.http.endpoints.chatCompletions.enabled: true` で有効にします。
- 応答 API: `gateway.http.endpoints.responses.enabled`。
- 応答 URL 入力の強化:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
- オプションの応答強化ヘッダー:
  - `gateway.http.securityHeaders.strictTransportSecurity` (制御する HTTPS オリジンに対してのみ設定します。[信頼されたプロキシ認証](/gateway/trusted-proxy-auth#tls-termination-and-hsts) を参照)

### マルチインスタンスの分離

一意のポートと状態ディレクトリを使用して、1 つのホスト上で複数のゲートウェイを実行します。

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

便利なフラグ: `--dev` (`~/.openclaw-dev` + ポート `19001` を使用)、`--profile <name>` (`~/.openclaw-<name>` を使用)。

[複数のゲートウェイ](/gateway/multiple-gateways) を参照してください。

---

## フック

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    maxBodyBytes: 262144,
    defaultSessionKey: "hook:ingress",
    allowRequestSessionKey: false,
    allowedSessionKeyPrefixes: ["hook:"],
    allowedAgentIds: ["hooks", "main"],
    presets: ["gmail"],
    transformsDir: "~/.openclaw/hooks/transforms",
    mappings: [
      {
        match: { path: "gmail" },
        action: "agent",
        agentId: "hooks",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate: "From: {{messages[0].from}}\nSubject: {{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.2-mini",
      },
    ],
  },
}
```

認証: `Authorization: Bearer <token>` または `x-openclaw-token: <token>`。

**エンドポイント:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - リクエスト ペイロードの `sessionKey` は、`hooks.allowRequestSessionKey=true` (デフォルト: `false`) の場合にのみ受け入れられます。
- `POST /hooks/<name>` → `hooks.mappings` によって解決されました

<Accordion title="マッピングの詳細">- `match.path` は、`/hooks` の後のサブパスと一致します (例: `/hooks/gmail` → `gmail`)。

- `match.source` は、汎用パスのペイロード フィールドと一致します。
- `{{messages[0].subject}}` のようなテンプレートはペイロードから読み取られます。
- `transform` は、フック アクションを返す JS/TS モジュールを指すことができます。
  - `transform.module` は相対パスであり、`hooks.transformsDir` 内に収まる必要があります (絶対パスとトラバースは拒否されます)。
- `agentId` は特定のエージェントにルーティングします。不明な ID はデフォルトに戻ります。
- `allowedAgentIds`: 明示的なルーティングを制限します (`*` または省略 = すべて許可、`[]` = すべて拒否)。
- `defaultSessionKey`: フック エージェントのオプションの固定セッション キーは、明示的な `sessionKey` なしで実行されます。
- `allowRequestSessionKey`: `/hooks/agent` 呼び出し元が `sessionKey` を設定できるようにします (デフォルト: `false`)。
- `allowedSessionKeyPrefixes`: 明示的な `sessionKey` 値 (リクエスト + マッピング) のオプションのプレフィックス許可リスト。 `["hook:"]`。
- `deliver: true` はチャネルに最終応答を送信します。 `channel` のデフォルトは `last` です。
- `model` は、このフック実行の LLM をオーバーライドします (モデル カタログが設定されている場合は許可する必要があります)。

</Accordion>

### Gmail の統合

```json5
{
  hooks: {
    gmail: {
      account: "openclaw@gmail.com",
      topic: "projects/<project-id>/topics/gog-gmail-watch",
      subscription: "gog-gmail-watch-push",
      pushToken: "shared-push-token",
      hookUrl: "http://127.0.0.1:18789/hooks/gmail",
      includeBody: true,
      maxBytes: 20000,
      renewEveryMinutes: 720,
      serve: { bind: "127.0.0.1", port: 8788, path: "/" },
      tailscale: { mode: "funnel", path: "/gmail-pubsub" },
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

- 構成されている場合、ゲートウェイは起動時に `gog gmail watch serve` を自動起動します。 `OPENCLAW_SKIP_GMAIL_WATCHER=1` を無効に設定します。
- ゲートウェイと一緒に別の `gog gmail watch serve` を実行しないでください。

---

## キャンバスホスト

```json5

{
canvasHost: {
root: "~/.openclaw/workspace/canvas",
liveReload: true,
// enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
},
}

````

- エージェントが編集可能な HTML/CSS/JS および A2UI をゲートウェイ ポートで HTTP 経由で提供します。
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- ローカルのみ: `gateway.bind: "loopback"` (デフォルト) を維持します。
- 非ループバック バインド: キャンバス ルートには、他のゲートウェイ HTTP サーフェスと同様に、ゲートウェイ認証 (トークン/パスワード/信頼できるプロキシ) が必要です。
- ノード WebView は通常、認証ヘッダーを送信しません。ノードがペアリングされて接続されると、ゲートウェイはキャンバス/A2UI アクセス用にノード スコープの機能 URL をアドバタイズします。
- 機能 URL はアクティブ ノード WS セッションにバインドされており、すぐに期限切れになります。 IP ベースのフォールバックは使用されません。
- ライブリロードクライアントを提供される HTML に挿入します。
- 空の場合、スターター `index.html` を自動作成します。
- `/__openclaw__/a2ui/` で A2UI も提供します。
- 変更にはゲートウェイの再起動が必要です。
- 大きなディレクトリまたは `EMFILE` エラーのライブ リロードを無効にします。

---

## 発見

### mDNS (ボンジュール)

```json5
{
  discovery: {
    mdns: {
      mode: "minimal", // minimal | full | off
    },
  },
}
````

- `minimal` (デフォルト): TXT レコードから `cliPath` + `sshPort` を省略します。
- `full`: `cliPath` + `sshPort` を含みます。
- ホスト名のデフォルトは `openclaw` です。 `OPENCLAW_MDNS_HOSTNAME` でオーバーライドします。

### 広域 (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

ユニキャスト DNS-SD ゾーンを `~/.openclaw/dns/` に書き込みます。クロスネットワーク検出の場合は、DNS サーバー (CoreDNS 推奨) + Tailscale Split DNS とペアリングします。

セットアップ: `openclaw dns setup --apply`。

---

## 環境

### `env` (インライン環境変数)```json5

{
env: {
OPENROUTER_API_KEY: "sk-or-...",
vars: {
GROQ_API_KEY: "gsk-...",
},
shellEnv: {
enabled: true,
timeoutMs: 15000,
},
},
}

````

- インライン環境変数は、プロセス環境にキーがない場合にのみ適用されます。
- `.env` ファイル: CWD `.env` + `~/.openclaw/.env` (どちらも既存の変数をオーバーライドしません)。
- `shellEnv`: ログイン シェル プロファイルから不足している予期されたキーをインポートします。
- 完全な優先順位については、[環境](/help/environment) を参照してください。

### 環境変数の置換

`${VAR_NAME}` を使用して、構成文字列内の環境変数を参照します。

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
````

- 大文字の名前のみが一致しました: `[A-Z_][A-Z0-9_]*`。
- 変数が欠落しているか空であると、構成ロード時にエラーがスローされます。
- リテラル `${VAR}` の場合は、`${VAR}` でエスケープします。
- `$include` で動作します。

---

## 秘密

Secret ref は追加的です。プレーンテキストの値は引き続き機能します。

### `SecretRef`

1 つのオブジェクト シェイプを使用します。

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

検証:

- `provider` パターン: `^[a-z][a-z0-9_-]{0,63}# 構成リファレンス

`~/.openclaw/openclaw.json` で使用可能なすべてのフィールド。タスク指向の概要については、「[構成](/gateway/configuration)」を参照してください。

構成形式は **JSON5** (コメント + 末尾のカンマは許可されます) です。すべてのフィールドはオプションです。省略された場合、OpenClaw は安全なデフォルトを使用します。

---

## チャンネル

各チャネルは、その構成セクションが存在すると自動的に開始されます (`enabled: false` を除く)。

### DMとグループアクセス

すべてのチャネルは DM ポリシーとグループ ポリシーをサポートします。

| DMポリシー               | 行動                                                                                   |
| ------------------------ | -------------------------------------------------------------------------------------- | --- | ---------------- | ---- |
| `pairing` (デフォルト)   | 不明な送信者はワンタイムペアリングコードを受け取ります。所有者は承認する必要があります |
| `allowlist`              | `allowFrom` (またはペアの許可ストア) の送信者のみ                                      |
| `open`                   | すべての受信 DM を許可する (`allowFrom: ["*"]` が必要)                                 |
| `disabled`               | すべての受信 DM を無視する                                                             |     | グループポリシー | 行動 |
| ---------------------    | --------------------------------------------------------                               |
| `allowlist` (デフォルト) | 設定された許可リストに一致するグループのみ                                             |
| `open`                   | グループ許可リストをバイパスします (メンションゲートは引き続き適用されます)。          |
| `disabled`               | すべてのグループ/ルーム メッセージをブロックする                                       |

<Note>
`channels.defaults.groupPolicy` は、プロバイダーの `groupPolicy` が設定されていない場合のデフォルトを設定します。
ペアリング コードは 1 時間後に期限切れになります。保留中の DM ペアリング要求の上限は、**チャネルあたり 3** です。
プロバイダー ブロックが完全に欠落している (`channels.<provider>` が欠落している) 場合、ランタイム グループ ポリシーは起動警告とともに `allowlist` (フェールクローズ) にフォールバックします。
</Note>

### チャネルモデルのオーバーライド

`channels.modelByChannel` を使用して、特定のチャネル ID をモデルに固定します。値は `provider/model` または構成されたモデルのエイリアスを受け入れます。チャネル マッピングは、セッションにモデル オーバーライドがまだない場合 (たとえば、`/model` によって設定されている場合) に適用されます。

```json5
{
  channels: {
    modelByChannel: {
      discord: {
        "123456789012345678": "anthropic/claude-opus-4-6",
      },
      slack: {
        C1234567890: "openai/gpt-4.1",
      },
      telegram: {
        "-1001234567890": "openai/gpt-4.1-mini",
        "-1001234567890:topic:99": "anthropic/claude-sonnet-4-6",
      },
    },
  },
}
```

### チャネルのデフォルトとハートビート

プロバイダー間で共有されるグループ ポリシーとハートビートの動作には、`channels.defaults` を使用します。

````json5
{
  channels: {
    defaults: {
      groupPolicy: "allowlist", // open | allowlist | disabled
      heartbeat: {
        showOk: false,
        showAlerts: true,
        useIndicator: true,
      },
    },
  },
}
```- `channels.defaults.groupPolicy`: プロバイダーレベルの `groupPolicy` が設定されていない場合のフォールバック グループ ポリシー。
- `channels.defaults.heartbeat.showOk`: ハートビート出力に正常なチャネルのステータスを含めます。
- `channels.defaults.heartbeat.showAlerts`: ハートビート出力に劣化/エラーステータスを含めます。
- `channels.defaults.heartbeat.useIndicator`: コンパクトなインジケーター スタイルのハートビート出力をレンダリングします。

### WhatsApp

WhatsApp は、ゲートウェイの Web チャネル (Baileys Web) を通じて実行されます。リンクされたセッションが存在する場合、自動的に開始されます。

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      chunkMode: "length", // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // blue ticks (false in self-chat mode)
      groups: {
        "*": { requireMention: true },
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
  web: {
    enabled: true,
    heartbeatSeconds: 60,
    reconnect: {
      initialMs: 2000,
      maxMs: 120000,
      factor: 1.4,
      jitter: 0.2,
      maxAttempts: 0,
    },
  },
}
````

<Accordion title="マルチアカウント WhatsApp">

```json5
{
  channels: {
    whatsapp: {
      accounts: {
        default: {},
        personal: {},
        biz: {
          // authDir: "~/.openclaw/credentials/whatsapp/biz",
        },
      },
    },
  },
}
```

- アウトバウンド コマンドは、デフォルトでアカウント `default` が存在する場合に使用されます。それ以外の場合は、最初に設定されたアカウント ID (ソート済み)。
- オプションの `channels.whatsapp.defaultAccount` は、構成されたアカウント ID と一致する場合にフォールバックのデフォルトのアカウント選択をオーバーライドします。
- 従来の単一アカウントの Baileys 認証ディレクトリは、`openclaw doctor` によって `whatsapp/default` に移行されます。
- アカウントごとの上書き: `channels.whatsapp.accounts.<id>.sendReadReceipts`、`channels.whatsapp.accounts.<id>.dmPolicy`、`channels.whatsapp.accounts.<id>.allowFrom`。

</Accordion>

### 電報

````json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "your-bot-token",
      dmPolicy: "pairing",
      allowFrom: ["tg:123456789"],
      groups: {
        "*": { requireMention: true },
        "-1001234567890": {
          allowFrom: ["@admin"],
          systemPrompt: "Keep answers brief.",
          topics: {
            "99": {
              requireMention: false,
              skills: ["search"],
              systemPrompt: "Stay on topic.",
            },
          },
        },
      },
      customCommands: [
        { command: "backup", description: "Git backup" },
        { command: "generate", description: "Create an image" },
      ],
      historyLimit: 50,
      replyToMode: "first", // off | first | all
      linkPreview: true,
      streaming: "partial", // off | partial | block | progress (default: off)
      actions: { reactions: true, sendMessage: true },
      reactionNotifications: "own", // off | own | all
      mediaMaxMb: 100,
      retry: {
        attempts: 3,
        minDelayMs: 400,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
      network: {
        autoSelectFamily: true,
        dnsResultOrder: "ipv4first",
      },
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook",
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook",
    },
  },
}
```- ボット トークン: `channels.telegram.botToken` または `channels.telegram.tokenFile`、`TELEGRAM_BOT_TOKEN` はデフォルト アカウントのフォールバックとして使用されます。
- オプションの `channels.telegram.defaultAccount` は、構成されたアカウント ID と一致する場合、デフォルトのアカウント選択をオーバーライドします。
- マルチアカウント設定 (2 つ以上のアカウント ID) では、明示的なデフォルト (`channels.telegram.defaultAccount` または `channels.telegram.accounts.default`) を設定して、フォールバック ルーティングを回避します。 `openclaw doctor` は、これが欠落しているか無効な場合に警告します。
- `configWrites: false` は、Telegram が開始する設定の書き込みをブロックします (スーパーグループ ID の移行、`/config set|unset`)。
- `type: "acp"` を含むトップレベルの `bindings[]` エントリは、フォーラム トピックの永続的な ACP バインディングを構成します (`match.peer.id` の正規の `chatId:topic:topicId` を使用します)。フィールド セマンティクスは [ACP エージェント](/tools/acp-agents#channel-specific-settings) で共有されます。
- Telegram ストリーム プレビューは `sendMessage` + `editMessageText` を使用します (ダイレクト チャットおよびグループ チャットで機能します)。
- 再試行ポリシー: [再試行ポリシー](/concepts/retry) を参照してください。

### 不和

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: "your-bot-token",
      mediaMaxMb: 8,
      allowBots: false,
      actions: {
        reactions: true,
        stickers: true,
        polls: true,
        permissions: true,
        messages: true,
        threads: true,
        pins: true,
        search: true,
        memberInfo: true,
        roleInfo: true,
        roles: false,
        channelInfo: true,
        voiceStatus: true,
        events: true,
        moderation: false,
      },
      replyToMode: "off", // off | first | all
      dmPolicy: "pairing",
      allowFrom: ["1234567890", "123456789012345678"],
      dm: { enabled: true, groupEnabled: false, groupChannels: ["openclaw-dm"] },
      guilds: {
        "123456789012345678": {
          slug: "friends-of-openclaw",
          requireMention: false,
          ignoreOtherMentions: true,
          reactionNotifications: "own",
          users: ["987654321098765432"],
          channels: {
            general: { allow: true },
            help: {
              allow: true,
              requireMention: true,
              users: ["987654321098765432"],
              skills: ["docs"],
              systemPrompt: "Short answers only.",
            },
          },
        },
      },
      historyLimit: 20,
      textChunkLimit: 2000,
      chunkMode: "length", // length | newline
      streaming: "off", // off | partial | block | progress (progress maps to partial on Discord)
      maxLinesPerMessage: 17,
      ui: {
        components: {
          accentColor: "#5865F2",
        },
      },
      threadBindings: {
        enabled: true,
        idleHours: 24,
        maxAgeHours: 0,
        spawnSubagentSessions: false, // opt-in for sessions_spawn({ thread: true })
      },
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
      retry: {
        attempts: 3,
        minDelayMs: 500,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
  },
}
```- トークン: `channels.discord.token`、デフォルト アカウントのフォールバックとして `DISCORD_BOT_TOKEN`。
- オプションの `channels.discord.defaultAccount` は、設定されたアカウント ID と一致する場合、デフォルトのアカウント選択をオーバーライドします。
- 配信ターゲットには `user:<id>` (DM) または `channel:<id>` (ギルド チャネル) を使用します。裸の数値 ID は拒否されます。
- ギルド スラッグは小文字でスペースが `-` に置き換えられます。チャンネルキーはスラッグ名 (`#` ではありません) を使用します。ギルドIDを優先します。
- ボットが作成したメッセージはデフォルトでは無視されます。 `allowBots: true` はそれらを有効にします。 `allowBots: "mentions"` を使用して、ボットに言及するボット メッセージのみを受け入れます (独自のメッセージはまだフィルターされています)。
- `channels.discord.guilds.<id>.ignoreOtherMentions` (およびチャネル オーバーライド) は、別のユーザーまたはロールに言及するメッセージを削除しますが、ボットには言及しません (@everyone/@here を除く)。
- `maxLinesPerMessage` (デフォルトは 17) は、2000 文字未満の場合でも長いメッセージを分割します。
- `channels.discord.threadBindings` は、Discord のスレッドバインドされたルーティングを制御します。
  - `enabled`: スレッドバインドされたセッション機能の Discord オーバーライド (`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`、バインド配信/ルーティング)
  - `idleHours`: 非アクティブ状態が数時間で自動フォーカス解除されるための Discord オーバーライド (`0` は無効になります)
  - `maxAgeHours`: 時間単位のハードマックス年齢の Discord オーバーライド (`0` は無効になります)
  - `spawnSubagentSessions`: `sessions_spawn({ thread: true })` 自動スレッド作成/バインドのオプトイン スイッチ- `type: "acp"` を含むトップレベルの `bindings[]` エントリは、チャネルとスレッドの永続的な ACP バインディングを構成します (`match.peer.id` のチャネル/スレッド ID を使用します)。フィールド セマンティクスは [ACP エージェント](/tools/acp-agents#channel-specific-settings) で共有されます。
- `channels.discord.ui.components.accentColor` は、Discord コンポーネント v2 コンテナのアクセント カラーを設定します。
- `channels.discord.voice` は、Discord 音声チャネル会話とオプションの自動参加 + TTS オーバーライドを有効にします。
- `channels.discord.voice.daveEncryption` および `channels.discord.voice.decryptionFailureTolerance` は `@discordjs/voice` DAVE オプションに渡されます (デフォルトでは `true` および `24`)。
- OpenClaw はさらに、繰り返し復号化に失敗した後、音声セッションから離脱/再参加することで音声受信の回復を試みます。
- `channels.discord.streaming` は正規ストリーム モード キーです。従来の `streamMode` およびブール値 `streaming` 値は自動移行されます。
- `channels.discord.autoPresence` は、実行時の可用性をボットの存在にマップし (正常 => オンライン、劣化 => アイドル、消耗 => 停止)、オプションでステータス テキストの上書きを許可します。
- `channels.discord.dangerouslyAllowNameMatching` は、変更可能な名前/タグの一致を再度有効にします (ブレークグラス互換モード)。

**反応通知モード:** `off` (なし)、`own` (ボットのメッセージ、デフォルト)、`all` (すべてのメッセージ)、`allowlist` (すべてのメッセージの `guilds.<id>.users` から)。

### Google チャット

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      audienceType: "app-url", // app-url | project-number
      audience: "https://gateway.example.com/googlechat",
      webhookPath: "/googlechat",
      botUser: "users/1234567890",
      dm: {
        enabled: true,
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": { allow: true, requireMention: true },
      },
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```- サービス アカウント JSON: インライン (`serviceAccount`) またはファイルベース (`serviceAccountFile`)。
- サービス アカウント SecretRef もサポートされています (`serviceAccountRef`)。
- 環境フォールバック: `GOOGLE_CHAT_SERVICE_ACCOUNT` または `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`。
- 配信ターゲットには `spaces/<spaceId>` または `users/<userId>` を使用します。
- `channels.googlechat.dangerouslyAllowNameMatching` は、変更可能な電子メール プリンシパルの一致を再度有効にします (ブレークグラス互換モード)。

### スラック

```json5
{
  channels: {
    slack: {
      enabled: true,
      botToken: "xoxb-...",
      appToken: "xapp-...",
      dmPolicy: "pairing",
      allowFrom: ["U123", "U456", "*"],
      dm: { enabled: true, groupEnabled: false, groupChannels: ["G123"] },
      channels: {
        C123: { allow: true, requireMention: true, allowBots: false },
        "#general": {
          allow: true,
          requireMention: true,
          allowBots: false,
          users: ["U123"],
          skills: ["docs"],
          systemPrompt: "Short answers only.",
        },
      },
      historyLimit: 50,
      allowBots: false,
      reactionNotifications: "own",
      reactionAllowlist: ["U123"],
      replyToMode: "off", // off | first | all
      thread: {
        historyScope: "thread", // thread | channel
        inheritParent: false,
      },
      actions: {
        reactions: true,
        messages: true,
        pins: true,
        memberInfo: true,
        emojiList: true,
      },
      slashCommand: {
        enabled: true,
        name: "openclaw",
        sessionPrefix: "slack:slash",
        ephemeral: true,
      },
      typingReaction: "hourglass_flowing_sand",
      textChunkLimit: 4000,
      chunkMode: "length",
      streaming: "partial", // off | partial | block | progress (preview mode)
      nativeStreaming: true, // use Slack native streaming API when streaming=partial
      mediaMaxMb: 20,
    },
  },
}
````

- **ソケット モード**には、`botToken` と `appToken` の両方が必要です (デフォルトのアカウント環境フォールバックの場合は `SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN`)。
- **HTTP モード** には、`botToken` と `signingSecret` (ルートまたはアカウントごと) が必要です。
- `configWrites: false` は、Slack によって開始される設定の書き込みをブロックします。
- オプションの `channels.slack.defaultAccount` は、設定されたアカウント ID と一致する場合、デフォルトのアカウント選択をオーバーライドします。
- `channels.slack.streaming` は正規ストリーム モード キーです。従来の `streamMode` 値とブール値 `streaming` 値は自動移行されます。
- 配信ターゲットには `user:<id>` (DM) または `channel:<id>` を使用します。

**反応通知モード:** `off`、`own` (デフォルト)、`all`、`allowlist` (`reactionAllowlist` から)。

**スレッド セッションの分離:** `thread.historyScope` はスレッドごと (デフォルト)、またはチャネル全体で共有されます。 `thread.inheritParent` は、親チャネルのトランスクリプトを新しいスレッドにコピーします。- `typingReaction` は、返信の実行中に受信 Slack メッセージに一時的な反応を追加し、完了時に削除します。 `"hourglass_flowing_sand"` などの Slack 絵文字ショートコードを使用します。

| アクショングループ | デフォルト | メモ                    |
| ------------------ | ---------- | ----------------------- |
| 反応               | 有効       | 反応 + 反応のリスト     |
| メッセージ         | 有効       | 読み取り/送信/編集/削除 |
| ピン               | 有効       | 固定/固定解除/リスト    |
| メンバー情報       | 有効       | 会員情報                |
| 絵文字リスト       | 有効       | カスタム絵文字リスト    |

### 最も重要なこと

Mattermost はプラグインとして出荷されます: `openclaw plugins install @openclaw/mattermost`。

```json5
{
  channels: {
    mattermost: {
      enabled: true,
      botToken: "mm-token",
      baseUrl: "https://chat.example.com",
      dmPolicy: "pairing",
      chatmode: "oncall", // oncall | onmessage | onchar
      oncharPrefixes: [">", "!"],
      commands: {
        native: true, // opt-in
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Optional explicit URL for reverse-proxy/public deployments
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

チャット モード: `oncall` (@ メンションで応答、デフォルト)、`onmessage` (すべてのメッセージ)、`onchar` (トリガー プレフィックスで始まるメッセージ)。

Mattermost ネイティブ コマンドが有効な場合:- `commands.callbackPath` は、完全な URL ではなく、パス (`/api/channels/mattermost/command` など) である必要があります。

- `commands.callbackUrl` は OpenClaw ゲートウェイ エンドポイントに解決され、Mattermost サーバーから到達可能である必要があります。
- プライベート/テールネット/内部コールバック ホストの場合、Mattermost は必要な場合があります
  `ServiceSettings.AllowedUntrustedInternalConnections` には、コールバック ホスト/ドメインが含まれます。
  完全な URL ではなく、ホスト/ドメインの値を使用します。
- `channels.mattermost.configWrites`: Mattermost が開始する構成書き込みを許可または拒否します。
- `channels.mattermost.requireMention`: チャネルで返信する前に `@mention` が必要です。
- オプションの `channels.mattermost.defaultAccount` は、構成されたアカウント ID と一致する場合、デフォルトのアカウント選択をオーバーライドします。

### 信号

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // optional account binding
      dmPolicy: "pairing",
      allowFrom: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      configWrites: true,
      reactionNotifications: "own", // off | own | all | allowlist
      reactionAllowlist: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      historyLimit: 50,
    },
  },
}
```

**反応通知モード:** `off`、`own` (デフォルト)、`all`、`allowlist` (`reactionAllowlist` から)。

- `channels.signal.account`: チャネルの起動を特定の Signal アカウント ID に固定します。
- `channels.signal.configWrites`: Signal によって開始される構成書き込みを許可または拒否します。
- オプションの `channels.signal.defaultAccount` は、設定されたアカウント ID と一致する場合、デフォルトのアカウント選択をオーバーライドします。

### ブルーバブルズ

BlueBubbles が推奨される iMessage パスです (プラグインベース、`channels.bluebubbles` で構成)。

````json5
{
  channels: {
    bluebubbles: {
      enabled: true,
      dmPolicy: "pairing",
      // serverUrl, password, webhookPath, group controls, and advanced actions:
      // see /channels/bluebubbles
    },
  },
}
```- ここで取り上げるコアキーのパス: `channels.bluebubbles`、`channels.bluebubbles.dmPolicy`。
- オプションの `channels.bluebubbles.defaultAccount` は、構成されたアカウント ID と一致する場合、デフォルトのアカウント選択をオーバーライドします。
- 完全な BlueBubbles チャネル構成は [BlueBubbles](/channels/bluebubbles) に文書化されています。

### iメッセージ

OpenClaw は `imsg rpc` (標準入出力上の JSON-RPC) を生成します。デーモンやポートは必要ありません。

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "imsg",
      dbPath: "~/Library/Messages/chat.db",
      remoteHost: "user@gateway-host",
      dmPolicy: "pairing",
      allowFrom: ["+15555550123", "user@example.com", "chat_id:123"],
      historyLimit: 50,
      includeAttachments: false,
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      mediaMaxMb: 16,
      service: "auto",
      region: "US",
    },
  },
}
````

- オプションの `channels.imessage.defaultAccount` は、設定されたアカウント ID と一致する場合、デフォルトのアカウント選択をオーバーライドします。

- メッセージ DB へのフルディスク アクセスが必要です。
- `chat_id:<id>` ターゲットを優先します。チャットを一覧表示するには、`imsg chats --limit 20` を使用します。
- `cliPath` は SSH ラッパーを指すことができます。 SCP 添付ファイルを取得するために `remoteHost` (`host` または `user@host`) を設定します。
- `attachmentRoots` および `remoteAttachmentRoots` は、受信添付ファイル パスを制限します (デフォルト: `/Users/*/Library/Messages/Attachments`)。
- SCP は厳密なホスト キー チェックを使用するため、リレー ホスト キーが `~/.ssh/known_hosts` にすでに存在していることを確認してください。
- `channels.imessage.configWrites`: iMessage によって開始される設定の書き込みを許可または拒否します。

<Accordion title="iMessage SSH ラッパーの例">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Microsoft Teams

Microsoft Teams は拡張機能をサポートしており、`channels.msteams` で構成されています。

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, team/channel policies:
      // see /channels/msteams
    },
  },
}
```

- ここで取り上げるコアキーのパス: `channels.msteams`、`channels.msteams.configWrites`。
- 完全な Teams 構成 (資格情報、Webhook、DM/グループ ポリシー、チームごと/チャネルごとのオーバーライド) は、[Microsoft Teams](/channels/msteams) に文書化されています。### IRC

IRC は拡張機能をサポートしており、`channels.irc` で構成されています。

```json5
{
  channels: {
    irc: {
      enabled: true,
      dmPolicy: "pairing",
      configWrites: true,
      nickserv: {
        enabled: true,
        service: "NickServ",
        password: "${IRC_NICKSERV_PASSWORD}",
        register: false,
        registerEmail: "bot@example.com",
      },
    },
  },
}
```

- ここで説明するコアキーのパス: `channels.irc`、`channels.irc.dmPolicy`、`channels.irc.configWrites`、`channels.irc.nickserv.*`。
- オプションの `channels.irc.defaultAccount` は、構成されたアカウント ID と一致する場合、デフォルトのアカウント選択をオーバーライドします。
- 完全な IRC チャネル設定 (ホスト/ポート/TLS/チャネル/許可リスト/メンション ゲーティング) は [IRC](/channels/irc) に文書化されています。

### マルチアカウント (すべてのチャネル)

チャネルごとに複数のアカウントを実行します (それぞれに独自の `accountId` があります)。

````json5
{
  channels: {
    telegram: {
      accounts: {
        default: {
          name: "Primary bot",
          botToken: "123456:ABC...",
        },
        alerts: {
          name: "Alerts bot",
          botToken: "987654:XYZ...",
        },
      },
    },
  },
}
```- `default` は、`accountId` が省略された場合に使用されます (CLI + ルーティング)。
- 環境トークンは **デフォルト** アカウントにのみ適用されます。
- 基本チャネル設定は、アカウントごとに上書きされない限り、すべてのアカウントに適用されます。
- `bindings[].match.accountId` を使用して、各アカウントを別のエージェントにルーティングします。
- 単一アカウントのトップレベルのチャネル設定を使用しているときに、`openclaw channels add` (またはチャネルのオンボーディング) 経由でデフォルト以外のアカウントを追加すると、OpenClaw は最初にアカウントスコープのトップレベルの単一アカウントの値を `channels.<channel>.accounts.default` に移動し、元のアカウントが機能し続けるようにします。
- 既存のチャネルのみのバインディング (`accountId` なし) はデフォルトのアカウントと一致し続けます。アカウント スコープのバインディングはオプションのままです。
- `openclaw doctor --fix` は、名前付きアカウントが存在するが `default` が欠落している場合、アカウントをスコープとする最上位の単一アカウントの値を `accounts.default` に移動することにより、混合シェイプも修復します。

### その他の拡張チャネル

多くの拡張チャネルは `channels.<id>` として構成され、専用チャネル ページ (Feishu、Matrix、LINE、Nostr、Zalo、Nextcloud Talk、Synology Chat、Twitch など) に文書化されています。
完全なチャネル インデックスを参照してください: [チャネル](/channels)。

### グループチャットのメンションゲート

グループ メッセージはデフォルトで **メンションが必要** (メタデータのメンションまたは正規表現パターン) です。 WhatsApp、Telegram、Discord、Google Chat、および iMessage のグループ チャットに適用されます。

**メンションの種類:**- **メタデータのメンション**: ネイティブ プラットフォームの @-メンション。 WhatsApp セルフチャット モードでは無視されます。
- **テキスト パターン**: `agents.list[].groupChat.mentionPatterns` の正規表現パターン。常にチェックされています。
- メンション ゲートは、検出が可能な場合 (ネイティブ メンションまたは少なくとも 1 つのパターン) にのみ適用されます。

```json5
{
  messages: {
    groupChat: { historyLimit: 50 },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
````

`messages.groupChat.historyLimit` はグローバルなデフォルトを設定します。チャネルは `channels.<channel>.historyLimit` (またはアカウントごと) でオーバーライドできます。 `0` を無効に設定します。

#### DM 履歴の制限

```json5
{
  channels: {
    telegram: {
      dmHistoryLimit: 30,
      dms: {
        "123456789": { historyLimit: 50 },
      },
    },
  },
}
```

解決策: DM ごとのオーバーライド → プロバイダーのデフォルト → 制限なし (すべて保持)。

サポートされている: `telegram`、`whatsapp`、`discord`、`slack`、`signal`、`imessage`、`msteams`。

#### セルフチャットモード

セルフチャット モードを有効にするには、`allowFrom` に独自の番号を含めます (ネイティブの @-メンションを無視し、テキスト パターンにのみ応答します)。

```json5
{
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: { "*": { requireMention: true } },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: { mentionPatterns: ["reisponde", "@openclaw"] },
      },
    ],
  },
}
```

### コマンド (チャット コマンドの処理)

```json5
{
  commands: {
    native: "auto", // register native commands when supported
    text: true, // parse /commands in chat messages
    bash: false, // allow ! (alias: /bash)
    bashForegroundMs: 2000,
    config: false, // allow /config
    debug: false, // allow /debug
    restart: false, // allow /restart + gateway restart tool
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

<Accordion title="コマンド詳細">- テキスト コマンドは、先頭に `/` が付いた **スタンドアロン** メッセージである必要があります。

- `native: "auto"` は、Discord/Telegram のネイティブ コマンドをオンにし、Slack をオフのままにします。
- チャネルごとのオーバーライド: `channels.discord.commands.native` (ブール値または `"auto"`)。 `false` は、以前に登録されたコマンドをクリアします。
- `channels.telegram.customCommands` は、Telegram ボット メニュー エントリを追加します。
- `bash: true` は、ホスト シェルの `! <cmd>` を有効にします。 `tools.elevated.enabled` と `tools.elevated.allowFrom.<channel>` の送信者が必要です。
- `config: true` は `/config` を有効にします (`openclaw.json` の読み取り/書き込み)。ゲートウェイ `chat.send` クライアントの場合、永続的な `/config set|unset` 書き込みには `operator.admin` も必要です。読み取り専用 `/config show` は、通常の書き込みスコープのオペレーター クライアントで引き続き使用できます。
- `channels.<provider>.configWrites` はチャネルごとに構成の変更をゲートします (デフォルト: true)。
- `allowFrom` はプロバイダーごとです。設定すると、**唯一**の認証ソースになります (チャネル許可リスト/ペアリングと `useAccessGroups` は無視されます)。
- `useAccessGroups: false` を使用すると、`allowFrom` が設定されていない場合に、コマンドがアクセス グループ ポリシーをバイパスできます。

</Accordion>

---

## エージェントのデフォルト

### `agents.defaults.workspace`

デフォルト: `~/.openclaw/workspace`。

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

システム プロンプトのランタイム行に表示されるオプションのリポジトリ ルート。設定されていない場合、OpenClaw はワークスペースから上に向かって歩くことによって自動検出します。

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skipBootstrap`ワークスペース ブートストラップ ファイル (`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、 `BOOTSTRAP.md`)

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.bootstrapMaxChars`

切り詰められる前のワークスペース ブートストラップ ファイルあたりの最大文字数。デフォルト: `20000`。

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

すべてのワークスペース ブートストラップ ファイルに挿入される最大合計文字数。デフォルト: `150000`。

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 150000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

ブートストラップ コンテキストが切り詰められた場合に、エージェントに表示される警告テキストを制御します。
デフォルト: `"once"`。

- `"off"`: システム プロンプトに警告テキストを挿入しないでください。
- `"once"`: 一意の切り捨て署名ごとに 1 回警告を挿入します (推奨)。
- `"always"`: 切り捨てが存在する場合、実行ごとに警告を挿入します。

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### `agents.defaults.imageMaxDimensionPx`

プロバイダー呼び出し前のトランスクリプト/ツール画像ブロック内の最長画像側の最大ピクセル サイズ。
デフォルト: `1200`。

通常、値を低くすると、ビジョン トークンの使用量が減り、スクリーンショットを大量に使用する実行の場合に要求されるペイロード サイズが減ります。
値を大きくすると、視覚的な詳細がより多く保持されます。

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

システム プロンプト コンテキストのタイムゾーン (メッセージ タイムスタンプではありません)。ホストのタイムゾーンにフォールバックします。

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

システムプロンプトの時刻形式。デフォルト: `auto` (OS 設定)。

````json5
{
  agents: { defaults: { timeFormat: "auto" } }, // auto | 12 | 24
}
```### `agents.defaults.model`

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "minimax/MiniMax-M2.5": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.5"],
      },
      imageModel: {
        primary: "openrouter/qwen/qwen-2.5-vl-72b-instruct:free",
        fallbacks: ["openrouter/google/gemini-2.0-flash-vision:free"],
      },
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5-mini"],
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
      elevatedDefault: "on",
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      contextTokens: 200000,
      maxConcurrent: 3,
    },
  },
}
```- `model`: 文字列 (`"provider/model"`) またはオブジェクト (`{ primary, fallbacks }`) を受け入れます。
  ・文字列形式はプライマリモデルのみ設定します。
  - オブジェクト形式は、プライマリおよび順序付けされたフェイルオーバー モデルを設定します。
- `imageModel`: 文字列 (`"provider/model"`) またはオブジェクト (`{ primary, fallbacks }`) を受け入れます。
  - `image` ツール パスによってビジョン モデル構成として使用されます。
  - 選択/デフォルトのモデルが画像入力を受け入れられない場合のフォールバック ルーティングとしても使用されます。
- `pdfModel`: 文字列 (`"provider/model"`) またはオブジェクト (`{ primary, fallbacks }`) を受け入れます。
  - モデル ルーティング用の `pdf` ツールによって使用されます。
  - 省略した場合、PDF ツールは `imageModel` にフォールバックし、その後ベストエフォート型プロバイダーのデフォルトにフォールバックします。
- `pdfMaxBytesMb`: 呼び出し時に `maxBytesMb` が渡されない場合の、`pdf` ツールのデフォルトの PDF サイズ制限。
- `pdfMaxPages`: `pdf` ツールの抽出フォールバック モードで考慮されるデフォルトの最大ページ数。
- `model.primary`: `provider/model` の形式 (例: `anthropic/claude-opus-4-6`)。プロバイダーを省略した場合、OpenClaw は `anthropic` (非推奨) を想定します。
- `models`: `/model` の構成されたモデル カタログと許可リスト。各エントリには、`alias` (ショートカット) および `params` (プロバイダー固有、たとえば、`temperature`、`maxTokens`、`cacheRetention`、`context1m`) を含めることができます。- `params` マージ優先順位 (構成): `agents.defaults.models["provider/model"].params` がベースで、その後 `agents.list[].params` (エージェント ID と一致する) がキーによってオーバーライドされます。
- これらのフィールドを変更する構成ライター (`/models set`、`/models set-image`、およびフォールバック追加/削除コマンドなど) は、可能であれば正規のオブジェクト形式を保存し、既存のフォールバック リストを保存します。
- `maxConcurrent`: 最大並列エージェントはセッション間で実行されます (各セッションはまだシリアル化されています)。デフォルト: 1。

**組み込みのエイリアスの短縮表記** (モデルが `agents.defaults.models` の場合にのみ適用されます):

|別名 |モデル |
| ------------------- | -------------------------------------- |
| `opus` | `anthropic/claude-opus-4-6` |
| `sonnet` | `anthropic/claude-sonnet-4-6` |
| `gpt` | `openai/gpt-5.4` |
| `gpt-mini` | `openai/gpt-5-mini` |
| `gemini` | `google/gemini-3.1-pro-preview` |
| `gemini-flash` | `google/gemini-3-flash-preview` |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview` |

設定したエイリアスは常にデフォルトよりも優先されます。Z.AI GLM-4.x モデルは、`--thinking off` を設定するか、`agents.defaults.models["zai/<model>"].params.thinking` を自分で定義しない限り、思考モードを自動的に有効にします。
Z.AI モデルでは、ツール呼び出しストリーミングに対してデフォルトで `tool_stream` が有効になっています。無効にするには、`agents.defaults.models["zai/<model>"].params.tool_stream` を `false` に設定します。
Anthropic Claude 4.6 モデルは、明示的思考レベルが設定されていない場合、デフォルトで `adaptive` 思考になります。

### `agents.defaults.cliBackends`

テキストのみのフォールバック実行用のオプションの CLI バックエンド (ツール呼び出しなし)。 API プロバイダーに障害が発生した場合のバックアップとして役立ちます。

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          systemPromptArg: "--system",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
````

- CLI バックエンドはテキストファーストです。ツールは常に無効になっています。
- `sessionArg` が設定されている場合にサポートされるセッション。
- `imageArg` がファイル パスを受け入れる場合、イメージ パススルーがサポートされます。

### `agents.defaults.heartbeat`

定期的なハートビートが実行されます。

````json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m disables
        model: "openai/gpt-5.2-mini",
        includeReasoning: false,
        lightContext: false, // default: false; true keeps only HEARTBEAT.md from workspace bootstrap files
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (default) | block
        target: "none", // default: none | options: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
      },
    },
  },
}
```- `every`: 期間文字列 (ms/s/m/h)。デフォルト: `30m`。
- `suppressToolErrorWarnings`: true の場合、ハートビートの実行中にツール エラー警告ペイロードが抑制されます。
- `directPolicy`: 直接/DM 配信ポリシー。 `allow` (デフォルト) は、直接ターゲット配信を許可します。 `block` は直接ターゲットの配信を抑制し、`reason=dm-blocked` を発行します。
- `lightContext`: true の場合、ハートビートの実行では軽量ブートストラップ コンテキストが使用され、ワー​​クスペース ブートストラップ ファイルから `HEARTBEAT.md` のみが保持されます。
- エージェントごと: `agents.list[].heartbeat` を設定します。いずれかのエージェントが `heartbeat` を定義すると、**それらのエージェントのみ** がハートビートを実行します。
- ハートビートはエージェント ターン全体を実行します。間隔が短いほど、より多くのトークンが消費されます。

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        reserveTokensFloor: 24000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // used when identifierPolicy=custom
        postCompactionSections: ["Session Startup", "Red Lines"], // [] disables reinjection
        model: "openrouter/anthropic/claude-sonnet-4-5", // optional compaction-only model override
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```- `mode`: `default` または `safeguard` (長い履歴のチャンク化された要約)。 [圧縮](/concepts/compaction) を参照してください。
- `identifierPolicy`: `strict` (デフォルト)、`off`、または `custom`。 `strict` は、圧縮要約中に組み込みの不透明な識別子保持ガイダンスを先頭に追加します。
- `identifierInstructions`: `identifierPolicy=custom` の場合に使用されるオプションのカスタム識別子保存テキスト。
- `postCompactionSections`: 圧縮後に再挿入するオプションの AGENTS.md H2/H3 セクション名。デフォルトは `["Session Startup", "Red Lines"]` です。 `[]` を設定して再注入を無効にします。設定を解除するか、そのデフォルトのペアに明示的に設定すると、古い `Every Session`/`Safety` 見出しもレガシー フォールバックとして受け入れられます。
- `model`: 圧縮要約のみのオプションの `provider/model-id` オーバーライド。これは、メイン セッションで 1 つのモデルを保持する必要があるが、圧縮サマリーを別のモデルで実行する必要がある場合に使用します。設定されていない場合、圧縮ではセッションのプライマリ モデルが使用されます。
- `memoryFlush`: 耐久性のあるメモリを保存するための自動圧縮前のサイレント エージェント ターン。ワークスペースが読み取り専用の場合はスキップされます。

### `agents.defaults.contextPruning`

LLM に送信する前に、メモリ内コンテキストから **古いツールの結果** を削除します。ディスク上のセッション履歴は**変更されません**。

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // duration (ms/s/m/h), default unit: minutes
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Old tool result content cleared]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
````

<Accordion title="キャッシュ TTL モードの動作">- `mode: "cache-ttl"` はプルーニング パスを有効にします。

- `ttl` は、プルーニングを再度実行できる頻度 (最後のキャッシュ タッチ後) を制御します。
- プルーニングでは、まずサイズの大きいツール結果がソフト トリムされ、次に必要に応じて古いツール結果がハードクリアされます。

**ソフトトリム**は、先頭と末尾を維持し、途中に `...` を挿入します。

**ハードクリア** は、ツールの結果全体をプレースホルダーに置き換えます。

注:

- 画像ブロックは決してトリミング/クリアされません。
- 比率は文字ベース (概算) であり、正確なトークン数ではありません。
- 存在するアシスタント メッセージが `keepLastAssistants` 未満の場合、プルーニングはスキップされます。

</Accordion>

動作の詳細については、[セッション プルーニング](/concepts/session-pruning) を参照してください。

### ストリーミングをブロックする

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (use minMs/maxMs)
    },
  },
}
```

- Telegram 以外のチャネルでは、ブロック応答を有効にするには明示的な `*.blockStreaming: true` が必要です。
- チャネル オーバーライド: `channels.<channel>.blockStreamingCoalesce` (およびアカウントごとのバリアント)。 Signal/Slack/Discord/Google Chat のデフォルト `minChars: 1500`。
- `humanDelay`: ブロック返信間のランダムな一時停止。 `natural` = 800 ～ 2500 ミリ秒。エージェントごとのオーバーライド: `agents.list[].humanDelay`。

動作とチャンク化の詳細については、[ストリーミング](/concepts/streaming) を参照してください。

### タイピングインジケーター

```json5
{
  agents: {
    defaults: {
      typingMode: "instant", // never | instant | thinking | message
      typingIntervalSeconds: 6,
    },
  },
}
```

- デフォルト: 直接チャット/メンションの場合は `instant`、言及されていないグループ チャットの場合は `message`。
- セッションごとのオーバーライド: `session.typingMode`、`session.typingIntervalSeconds`。

[タイピングインジケーター](/concepts/typing-indicators) を参照してください。

### `agents.defaults.sandbox`埋め込みエージェント用のオプションの **Docker サンドボックス**。完全なガイドについては、[サンドボックス](/gateway/sandboxing) を参照してください

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        scope: "agent", // session | agent | shared
        workspaceAccess: "none", // none | ro | rw
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          containerPrefix: "openclaw-sbx-",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
          capDrop: ["ALL"],
          env: { LANG: "C.UTF-8" },
          setupCommand: "apt-get update && apt-get install -y git curl jq",
          pidsLimit: 256,
          memory: "1g",
          memorySwap: "2g",
          cpus: 1,
          ulimits: {
            nofile: { soft: 1024, hard: 2048 },
            nproc: 256,
          },
          seccompProfile: "/path/to/seccomp.json",
          apparmorProfile: "openclaw-sandbox",
          dns: ["1.1.1.1", "8.8.8.8"],
          extraHosts: ["internal.service:10.0.0.5"],
          binds: ["/home/user/source:/source:rw"],
        },
        browser: {
          enabled: false,
          image: "openclaw-sandbox-browser:bookworm-slim",
          network: "openclaw-sandbox-browser",
          cdpPort: 9222,
          cdpSourceRange: "172.21.0.1/32",
          vncPort: 5900,
          noVncPort: 6080,
          headless: false,
          enableNoVnc: true,
          allowHostControl: false,
          autoStart: true,
          autoStartTimeoutMs: 12000,
        },
        prune: {
          idleHours: 24,
          maxAgeDays: 7,
        },
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        allow: [
          "exec",
          "process",
          "read",
          "write",
          "edit",
          "apply_patch",
          "sessions_list",
          "sessions_history",
          "sessions_send",
          "sessions_spawn",
          "session_status",
        ],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"],
      },
    },
  },
}
```

<Accordion title="サンドボックスの詳細">

**ワークスペースへのアクセス:**

- `none`: `~/.openclaw/sandboxes` の下のスコープごとのサンドボックス ワークスペース
- `ro`: サンドボックス ワークスペースは `/workspace`、エージェント ワークスペースは `/agent` に読み取り専用でマウントされています
- `rw`: エージェント ワークスペースは `/workspace` に読み取り/書き込み可能にマウントされました

**範囲:**

- `session`: セッションごとのコンテナ + ワークスペース
- `agent`: エージェントごとに 1 つのコンテナ + ワークスペース (デフォルト)
- `shared`: 共有コンテナーとワークスペース (セッション間の分離なし)

**`setupCommand`** は、コンテナーの作成後に 1 回実行されます (`sh -lc` 経由)。ネットワーク出力、書き込み可能な root、root ユーザーが必要です。

**コンテナのデフォルトは `network: "none"`** です。エージェントが送信アクセスを必要とする場合は、`"bridge"` (またはカスタム ブリッジ ネットワーク) に設定されます。
`"host"` はブロックされています。 `"container:<id>"` は、明示的に設定しない限り、デフォルトでブロックされます
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (ガラス破り)。

**受信添付ファイル**は、アクティブなワークスペースの `media/inbound/*` にステージングされます。

**`docker.binds`** は追加のホスト ディレクトリをマウントします。グローバル バインドとエージェントごとのバインドがマージされます。**サンドボックス ブラウザ** (`sandbox.browser.enabled`): コンテナ内の Chromium + CDP。 noVNC URL がシステム プロンプトに挿入されました。 `openclaw.json` に `browser.enabled` は必要ありません。
noVNC オブザーバー アクセスでは、デフォルトで VNC 認証が使用され、OpenClaw は (共有 URL でパスワードを公開する代わりに) 有効期間の短いトークン URL を発行します。- `allowHostControl: false` (デフォルト) は、サンドボックス化されたセッションがホスト ブラウザーをターゲットにすることをブロックします。

- `network` のデフォルトは `openclaw-sandbox-browser` (専用ブリッジ ネットワーク) です。明示的にグローバル ブリッジ接続が必要な場合にのみ、`bridge` に設定します。
- `cdpSourceRange` は、オプションでコンテナ エッジでの CDP イングレスを CIDR 範囲に制限します (`172.21.0.1/32` など)。
- `sandbox.browser.binds` は、追加のホスト ディレクトリをサンドボックス ブラウザ コンテナのみにマウントします。設定すると (`[]` を含む)、ブラウザー コンテナーの `docker.binds` が置き換えられます。
- 起動デフォルトは `scripts/sandbox-browser-entrypoint.sh` で定義され、コンテナー ホスト用に調整されています。
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-3d-apis`
  - `--disable-gpu`
  - `--disable-software-rasterizer`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-features=TranslateUI`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--renderer-process-limit=2`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--disable-extensions` (デフォルトで有効)
  - `--disable-3d-apis`、`--disable-software-rasterizer`、および `--disable-gpu` は
    デフォルトで有効になっており、次のコマンドで無効にできます
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` WebGL/3D の使用に必要な場合。
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` は、ワークフローが次の場合に拡張機能を再度有効にします。
    彼ら次第です。
  - `--renderer-process-limit=2` は次のように変更できます。
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; Chromium を使用するように `0` を設定します
    デフォルトのプロセス制限。- `noSandbox` が有効な場合は、`--no-sandbox` および `--disable-setuid-sandbox` が追加されます。
  - デフォルトはコンテナイメージのベースラインです。カスタムのブラウザ画像をカスタムで使用する
    コンテナのデフォルトを変更するためのエントリポイント。

</Accordion>

イメージをビルドします。

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

### `agents.list` (エージェントごとの上書き)

````json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "Main Agent",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // or { primary, fallbacks }
        params: { cacheRetention: "none" }, // overrides matching defaults.models params by key
        identity: {
          name: "Samantha",
          theme: "helpful sloth",
          emoji: "🦥",
          avatar: "avatars/samantha.png",
        },
        groupChat: { mentionPatterns: ["@openclaw"] },
        sandbox: { mode: "off" },
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
        subagents: { allowAgents: ["*"] },
        tools: {
          profile: "coding",
          allow: ["browser"],
          deny: ["canvas"],
          elevated: { enabled: true },
        },
      },
    ],
  },
}
```- `id`: 安定したエージェント ID (必須)。
- `default`: 複数が設定されている場合、最初が優先されます (警告がログに記録されます)。何も設定されていない場合は、最初のリスト エントリがデフォルトになります。
- `model`: 文字列形式は `primary` のみをオーバーライドします。オブジェクト フォーム `{ primary, fallbacks }` は両方をオーバーライドします (`[]` はグローバル フォールバックを無効にします)。 `primary` をオーバーライドするだけの Cron ジョブは、`fallbacks: []` を設定しない限り、デフォルトのフォールバックを継承します。
- `params`: `agents.defaults.models` で選択されたモデル エントリにマージされたエージェントごとのストリーム パラメーター。これは、モデル カタログ全体を複製せずに、`cacheRetention`、`temperature`、`maxTokens` などのエージェント固有のオーバーライドに使用します。
- `runtime`: オプションのエージェントごとのランタイム記述子。エージェントがデフォルトで ACP ハーネス セッションを使用する必要がある場合は、`type: "acp"` を `runtime.acp` デフォルト (`agent`、`backend`、`mode`、`cwd`) とともに使用します。
- `identity.avatar`: ワークスペース相対パス、`http(s)` URL、または `data:` URI。
- `identity` はデフォルトを派生します: `emoji` から `ackReaction`、`name`/`emoji` から `mentionPatterns`。
- `subagents.allowAgents`: `sessions_spawn` のエージェント ID の許可リスト (`["*"]` = 任意、デフォルト: 同じエージェントのみ)。
- サンドボックス継承ガード: リクエスター セッションがサンドボックス化されている場合、`sessions_spawn` はサンドボックス化されずに実行されるターゲットを拒否します。

---## マルチエージェントルーティング

1 つのゲートウェイ内で複数の分離されたエージェントを実行します。 [マルチエージェント](/concepts/multi-agent) を参照してください。

```json5
{
  agents: {
    list: [
      { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
      { id: "work", workspace: "~/.openclaw/workspace-work" },
    ],
  },
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
  ],
}
````

### 一致フィールドのバインディング

- `type` (オプション): 通常のルーティングの場合は `route` (タイプが欠落している場合はデフォルトでルーティングされます)、永続的な ACP 会話バインディングの場合は `acp`。
- `match.channel` (必須)
- `match.accountId` (オプション; `*` = 任意のアカウント; 省略 = デフォルトのアカウント)
- `match.peer` (オプション; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (オプション、チャネル固有)
- `acp` (オプション; `type: "acp"` のみ): `{ mode, label, cwd, backend }`

**決定的な一致順序:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (正確、ピア/ギルド/チームなし)
5. `match.accountId: "*"` (チャネル全体)
6. デフォルトエージェント

各層内で、最初に一致した `bindings` エントリが優先されます。

`type: "acp"` エントリの場合、OpenClaw は正確な会話 ID (`match.channel` + アカウント + `match.peer.id`) によって解決し、上記のルート バインディング層の順序は使用しません。

### エージェントごとのアクセス プロファイル

<Accordion title="フルアクセス (サンドボックスなし)">

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="読み取り専用ツール + ワークスペース">

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "ro" },
        tools: {
          allow: [
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="ファイルシステムへのアクセスなし (メッセージングのみ)">

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "none" },
        tools: {
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
            "gateway",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

</Accordion>

優先順位の詳細については、[マルチエージェント サンドボックスとツール](/tools/multi-agent-sandbox-tools) を参照してください。

---

## セッション

```json5
{
  session: {
    scope: "per-sender",
    dmScope: "main", // main | per-peer | per-channel-peer | per-account-channel-peer
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      mode: "daily", // daily | idle
      atHour: 4,
      idleMinutes: 60,
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      direct: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    parentForkMaxTokens: 100000, // skip parent-thread fork above this token count (0 disables)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // duration or false
      maxDiskBytes: "500mb", // optional hard budget
      highWaterBytes: "400mb", // optional cleanup target
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // default inactivity auto-unfocus in hours (`0` disables)
      maxAgeHours: 0, // default hard max age in hours (`0` disables)
    },
    mainKey: "main", // legacy (runtime always uses "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="セッションフィールドの詳細">- **`dmScope`**: DM がグループ化される方法。

- `main`: すべての DM がメイン セッションを共有します。
- `per-peer`: チャネル間で送信者 ID によって分離します。
- `per-channel-peer`: チャネル + 送信者ごとに分離します (マルチユーザーの受信箱に推奨)。
- `per-account-channel-peer`: アカウント + チャネル + 送信者ごとに分離します (複数のアカウントに推奨)。
- **`identityLinks`**: クロスチャネルセッション共有のために、正規 ID をプロバイダープレフィックス付きのピアにマップします。
- **`reset`**: プライマリ リセット ポリシー。 `daily` は現地時間の `atHour` にリセットされます。 `idle` は `idleMinutes` の後にリセットされます。両方が設定されている場合は、先に期限が切れた方が優先されます。
- **`resetByType`**: タイプごとのオーバーライド (`direct`、`group`、`thread`)。レガシー `dm` は `direct` のエイリアスとして受け入れられます。
- **`parentForkMaxTokens`**: フォークされたスレッド セッションの作成時に許可される最大親セッション `totalTokens` (デフォルト `100000`)。
  - 親 `totalTokens` がこの値を超えている場合、OpenClaw は親トランスクリプト履歴を継承する代わりに、新しいスレッド セッションを開始します。
  - このガードを無効にし、常に親のフォークを許可するには、`0` を設定します。
- **`mainKey`**: 従来のフィールド。ランタイムは、メインのダイレクト チャット バケットに常に `"main"` を使用するようになりました。- **`sendPolicy`**: `channel`、`chatType` (`direct|group|channel`、従来の `dm` エイリアスを使用)、`keyPrefix`、または `rawKeyPrefix` による一致。最初に拒否した方が勝ちです。
- **`maintenance`**: セッション ストアのクリーンアップ + 保持制御。
  - `mode`: `warn` は警告のみを発行します。 `enforce` はクリーンアップを適用します。
  - `pruneAfter`: 古いエントリの期限切れ (デフォルト `30d`)。
  - `maxEntries`: `sessions.json` のエントリの最大数 (デフォルトは `500`)。
  - `rotateBytes`: このサイズを超える場合、`sessions.json` を回転します (デフォルト `10mb`)。
  - `resetArchiveRetention`: `*.reset.<timestamp>` トランスクリプト アーカイブの保持。デフォルトは `pruneAfter` です。 `false` を無効に設定します。
  - `maxDiskBytes`: オプションのセッション ディレクトリのディスク バジェット。 `warn` モードでは、警告がログに記録されます。 `enforce` モードでは、最も古いアーティファクト/セッションが最初に削除されます。
  - `highWaterBytes`: 予算クリーンアップ後のオプションのターゲット。デフォルトは `80%` または `maxDiskBytes` です。
- **`threadBindings`**: スレッドバインドされたセッション機能のグローバルデフォルト。
  - `enabled`: マスターデフォルトスイッチ (プロバイダーは上書き可能; Discord は `channels.discord.threadBindings.enabled` を使用します)
  - `idleHours`: デフォルトの非アクティブ状態は時間単位で自動的にフォーカスを解除します (`0` は無効になります。プロバイダーはオーバーライドできます)- `maxAgeHours`: デフォルトのハードマックス経過時間 (`0` は無効になります。プロバイダーはオーバーライドできます)

</Accordion>

---

## メッセージ

```json5
{
  messages: {
    responsePrefix: "🦞", // or "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "collect", // steer | followup | collect | steer-backlog | steer+backlog | queue | interrupt
      debounceMs: 1000,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "collect",
        telegram: "collect",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 disables
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### 応答プレフィックス

チャネル/アカウントごとのオーバーライド: `channels.<channel>.responsePrefix`、`channels.<channel>.accounts.<id>.responsePrefix`。

解決策 (最も具体的な勝利): アカウント → チャネル → グローバル。 `""` はカスケードを無効にして停止します。 `"auto"` は `[{identity.name}]` を派生させます。

**テンプレート変数:**

| 変数              | 説明               | 例                          |
| ----------------- | ------------------ | --------------------------- |
| `{model}`         | 短いモデル名       | `claude-opus-4-6`           |
| `{modelFull}`     | 完全なモデル識別子 | `anthropic/claude-opus-4-6` |
| `{provider}`      | プロバイダー名     | `anthropic`                 |
| `{thinkingLevel}` | 現在の思考レベル   | `high`、`low`、`off`        |
| `{identity.name}` | エージェント ID 名 | (`"auto"` と同じ)           |

変数では大文字と小文字が区別されません。 `{think}` は、`{thinkingLevel}` のエイリアスです。

### ACK反応- デフォルトはアクティブなエージェントの `identity.emoji`、それ以外の場合は `"👀"` です。 `""` を無効に設定します

- チャネルごとのオーバーライド: `channels.<channel>.ackReaction`、`channels.<channel>.accounts.<id>.ackReaction`。
- 解決順序: アカウント → チャネル → `messages.ackReaction` → ID フォールバック。
- スコープ: `group-mentions` (デフォルト)、`group-all`、`direct`、`all`。
- `removeAckAfterReply`: 返信後の確認応答を削除します (Slack/Discord/Telegram/Google Chat のみ)。

### インバウンドデバウンス

同じ送信者からのテキストのみの迅速なメッセージを 1 つのエージェント ターンにバッチ処理します。メディア/添付ファイルはすぐにフラッシュされます。制御コマンドはデバウンスをバイパスします。

### TTS (テキスト読み上げ)

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      elevenlabs: {
        apiKey: "elevenlabs_api_key",
        baseUrl: "https://api.elevenlabs.io",
        voiceId: "voice_id",
        modelId: "eleven_multilingual_v2",
        seed: 42,
        applyTextNormalization: "auto",
        languageCode: "en",
        voiceSettings: {
          stability: 0.5,
          similarityBoost: 0.75,
          style: 0.0,
          useSpeakerBoost: true,
          speed: 1.0,
        },
      },
      openai: {
        apiKey: "openai_api_key",
        baseUrl: "https://api.openai.com/v1",
        model: "gpt-4o-mini-tts",
        voice: "alloy",
      },
    },
  },
}
```

- `auto` は自動 TTS を制御します。 `/tts off|always|inbound|tagged` はセッションごとにオーバーライドされます。
- `summaryModel` は、自動要約の `agents.defaults.model.primary` をオーバーライドします。
- `modelOverrides` はデフォルトで有効になっています。 `modelOverrides.allowProvider` のデフォルトは `false` (オプトイン) です。
- API キーは `ELEVENLABS_API_KEY`/`XI_API_KEY` および `OPENAI_API_KEY` にフォールバックします。
- `openai.baseUrl` は OpenAI TTS エンドポイントをオーバーライドします。解決順序は、config、次に `OPENAI_TTS_BASE_URL`、次に `https://api.openai.com/v1` です。
- `openai.baseUrl` が非 OpenAI エンドポイントを指している場合、OpenClaw はそれを OpenAI 互換の TTS サーバーとして扱い、モデル/音声の検証を緩和します。

---

## 話す

トーク モードのデフォルト (macOS/iOS/Android)。

````json5
{
  talk: {
    voiceId: "elevenlabs_voice_id",
    voiceAliases: {
      Clawd: "EXAVITQu4vr4xnSDxMaL",
      Roger: "CwhRBWXzGAHq8TQ4Fs17",
    },
    modelId: "eleven_v3",
    outputFormat: "mp3_44100_128",
    apiKey: "elevenlabs_api_key",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```- 音声 ID は `ELEVENLABS_VOICE_ID` または `SAG_VOICE_ID` にフォールバックします。
- `apiKey` および `providers.*.apiKey` は、プレーンテキスト文字列または SecretRef オブジェクトを受け入れます。
- `ELEVENLABS_API_KEY` フォールバックは、Talk API キーが設定されていない場合にのみ適用されます。
- `voiceAliases` により、Talk ディレクティブにフレンドリ名を使用できるようになります。
- `silenceTimeoutMs` は、ユーザーが沈黙した後、トランスクリプトを送信するまでトーク モードが待機する時間を制御します。設定を解除すると、プラットフォームのデフォルトの一時停止ウィンドウ (`700 ms on macOS and Android, 900 ms on iOS`) が維持されます。

---

## ツール

### 工具プロファイル

`tools.profile` は、`tools.allow`/`tools.deny` の前に基本ホワイトリストを設定します。

ローカル オンボーディングは、設定を解除すると、新しいローカル構成をデフォルトで `tools.profile: "coding"` に設定します (既存の明示的なプロファイルは保持されます)。

|プロフィール |含まれるもの |
| ----------- | ----------------------------------------------------------------------------------------- |
| `minimal` | `session_status` のみ |
| `coding` | `group:fs`、`group:runtime`、`group:sessions`、`group:memory`、`image` |
| `messaging` | `group:messaging`、`sessions_list`、`sessions_history`、`sessions_send`、`session_status` |
| `full` |制限なし（未設定と同じ） |### ツールグループ|グループ |ツール |
| ------------------ | -------------------------------------------------------------------------------------- |
| `group:runtime` | `exec`、`process` (`bash` は `exec` のエイリアスとして受け入れられます)
| `group:fs` | `read`、`write`、`edit`、`apply_patch` |
| `group:sessions` | `sessions_list`、`sessions_history`、`sessions_send`、`sessions_spawn`、`session_status` |
| `group:memory` | `memory_search`、`memory_get` |
| `group:web` | `web_search`、`web_fetch` |
| `group:ui` | `browser`、`canvas` |
| `group:automation` | `cron`、`gateway` |
| `group:messaging` | `message` || `group:nodes` | `nodes` |
| `group:openclaw` |すべての組み込みツール (プロバイダー プラグインを除く) |

### `tools.allow` / `tools.deny`

グローバル ツールの許可/拒否ポリシー (拒否の勝利)。大文字と小文字は区別されず、`*` ワイルドカードをサポートします。 Docker サンドボックスがオフの場合でも適用されます。

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
````

### `tools.byProvider`

特定のプロバイダーまたはモデル用のツールをさらに制限します。順序: 基本プロファイル → プロバイダー プロファイル → 許可/拒否。

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
      "openai/gpt-5.2": { allow: ["group:fs", "sessions_list"] },
    },
  },
}
```

### `tools.elevated`

昇格された (ホスト) 実行アクセスを制御します。

```json5
{
  tools: {
    elevated: {
      enabled: true,
      allowFrom: {
        whatsapp: ["+15555550123"],
        discord: ["1234567890123", "987654321098765432"],
      },
    },
  },
}
```

- エージェントごとのオーバーライド (`agents.list[].tools.elevated`) は、さらに制限することしかできません。
- `/elevated on|off|ask|full` はセッションごとの状態を保存します。インラインディレクティブは単一のメッセージに適用されます。
- 昇格された `exec` がホスト上で実行され、サンドボックスがバイパスされます。

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.2"],
      },
    },
  },
}
```

### `tools.loopDetection`

ツールループの安全性チェックは **デフォルトでは無効になっています**。 `enabled: true` を設定して検出を有効にします。
設定は `tools.loopDetection` でグローバルに定義でき、`agents.list[].tools.loopDetection` でエージェントごとに上書きできます。

````json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```- `historySize`: ループ解析のために保持される最大ツール呼び出し履歴。
- `warningThreshold`: 警告に対する進行なしパターンのしきい値を繰り返します。
- `criticalThreshold`: クリティカルなループをブロックするためのより高い繰り返ししきい値。
- `globalCircuitBreakerThreshold`: 進行状況のない実行に対するハードストップのしきい値。
- `detectors.genericRepeat`: 同じツール/同じ引数の繰り返し呼び出しを警告します。
- `detectors.knownPollNoProgress`: 既知の投票ツール (`process.poll`、`command_status` など) に対して警告/ブロックします。
- `detectors.pingPong`: 交互に進行しないペアのパターンを警告/ブロックします。
- `warningThreshold >= criticalThreshold` または `criticalThreshold >= globalCircuitBreakerThreshold` の場合、検証は失敗します。

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // or BRAVE_API_KEY env
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        maxChars: 50000,
        maxCharsCap: 50000,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        userAgent: "custom-ua",
      },
    },
  },
}
````

### `tools.media`

インバウンドメディア理解 (画像/音声/ビデオ) を構成します。

```json5
{
  tools: {
    media: {
      concurrency: 2,
      audio: {
        enabled: true,
        maxBytes: 20971520,
        scope: {
          default: "deny",
          rules: [{ action: "allow", match: { chatType: "direct" } }],
        },
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          { type: "cli", command: "whisper", args: ["--model", "base", "{{MediaPath}}"] },
        ],
      },
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },
}
```

<Accordion title="メディアモデル入力フィールド">

**プロバイダーエントリ** (`type: "provider"` または省略):

- `provider`: API プロバイダー ID (`openai`、`anthropic`、`google`/`gemini`、`groq` など)
- `model`: モデル ID の上書き
- `profile` / `preferredProfile`: `auth-profiles.json` プロファイルの選択

**CLI エントリ** (`type: "cli"`):

- `command`: 実行する実行可能ファイル
- `args`: テンプレート化された引数 (`{{MediaPath}}`、`{{Prompt}}`、`{{MaxChars}}` などをサポート)

**共通フィールド:**- `capabilities`: オプションのリスト (`image`、`audio`、`video`)。デフォルト: `openai`/`anthropic`/`minimax` → 画像、`google` → 画像+音声+ビデオ、`groq` → 音声。

- `prompt`、`maxChars`、`maxBytes`、`timeoutSeconds`、`language`: エントリごとの上書き。
- 失敗は次のエントリにフォールバックします。

プロバイダー認証は標準の順序に従います: `auth-profiles.json` → 環境変数 → `models.providers.*.apiKey`。

</Accordion>

### `tools.agentToAgent`

```json5
{
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },
}
```

### `tools.sessions`

セッション ツール (`sessions_list`、`sessions_history`、`sessions_send`) の対象にできるセッションを制御します。

デフォルト: `tree` (現在のセッション + それによって生成されたセッション (サブエージェントなど))。

```json5
{
  tools: {
    sessions: {
      // "self" | "tree" | "agent" | "all"
      visibility: "tree",
    },
  },
}
```

注:

- `self`: 現在のセッション キーのみ。
- `tree`: 現在のセッション + 現在のセッションによって生成されたセッション (サブエージェント)。
- `agent`: 現在のエージェント ID に属する任意のセッション (同じエージェント ID で送信者ごとのセッションを実行する場合は、他のユーザーを含めることができます)。
- `all`: 任意のセッション。クロスエージェントターゲティングには引き続き `tools.agentToAgent` が必要です。
- サンドボックス クランプ: 現在のセッションがサンドボックス化されており、`agents.defaults.sandbox.sessionToolsVisibility="spawned"` である場合、`tools.sessions.visibility="all"` であっても、可視性は強制的に `tree` に設定されます。

### `tools.sessions_spawn`

`sessions_spawn` のインライン添付ファイルのサポートを制御します。

````json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // opt-in: set true to allow inline file attachments
        maxTotalBytes: 5242880, // 5 MB total across all files
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB per file
        retainOnSessionKeep: false, // keep attachments when cleanup="keep"
      },
    },
  },
}
```注:

- 添付ファイルは `runtime: "subagent"` でのみサポートされます。 ACP ランタイムはそれらを拒否します。
- ファイルは、`.manifest.json` を使用して、`.openclaw/attachments/<uuid>/` の子ワークスペースに実体化されます。
- 添付ファイルのコンテンツは、トランスクリプトの永続性から自動的に編集されます。
- Base64 入力は、厳密なアルファベット/パディング チェックとプリデコード サイズ ガードによって検証されます。
- ファイル権限は、ディレクトリの場合は `0700`、ファイルの場合は `0600` です。
- クリーンアップは `cleanup` ポリシーに従います。 `delete` は常に添付ファイルを削除します。 `keep` は、`retainOnSessionKeep: true` の場合にのみそれらを保持します。

### `tools.subagents`

```json5
{
  agents: {
    defaults: {
      subagents: {
        model: "minimax/MiniMax-M2.5",
        maxConcurrent: 1,
        runTimeoutSeconds: 900,
        archiveAfterMinutes: 60,
      },
    },
  },
}
````

- `model`: 生成されたサブエージェントのデフォルト モデル。省略した場合、サブエージェントは呼び出し元のモデルを継承します。
- `runTimeoutSeconds`: ツール呼び出しで `runTimeoutSeconds` が省略された場合の `sessions_spawn` のデフォルトのタイムアウト (秒)。 `0` はタイムアウトがないことを意味します。
- サブエージェントごとのツール ポリシー: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`。

---

## カスタムプロバイダーとベース URL

OpenClaw は、pi-coding-agent モデル カタログを使用します。構成内の `models.providers` または `~/.openclaw/agents/<agentId>/agent/models.json` を介してカスタム プロバイダーを追加します。

````json5
{
  models: {
    mode: "merge", // merge (default) | replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai
        models: [
          {
            id: "llama-3.1-8b",
            name: "Llama 3.1 8B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```- カスタム認証が必要な場合は、`authHeader: true` + `headers` を使用します。
- エージェント設定ルートを `OPENCLAW_AGENT_DIR` (または `PI_CODING_AGENT_DIR`) でオーバーライドします。
- 一致するプロバイダー ID のマージの優先順位:
  - 空ではないエージェント `models.json` `baseUrl` 値が優先されます。
  - 空ではないエージェント `apiKey` 値は、そのプロバイダーが現在の構成/認証プロファイル コンテキストで SecretRef で管理されていない場合にのみ優先されます。
  - SecretRef 管理プロバイダーの `apiKey` 値は、解決されたシークレットを保持するのではなく、ソース マーカー (環境参照の場合は `ENV_VAR_NAME`、ファイル/実行参照の場合は `secretref-managed`) から更新されます。
  - 空または欠落しているエージェント `apiKey`/`baseUrl` は、構成内の `models.providers` にフォールバックします。
  - マッチングモデル `contextWindow`/`maxTokens` は、明示的な構成値と暗黙的なカタログ値の間の高い値を使用します。
  - 構成で `models.json` を完全に書き換える場合は、`models.mode: "replace"` を使用します。

### プロバイダーフィールドの詳細- `models.mode`: プロバイダー カタログの動作 (`merge` または `replace`)。
- `models.providers`: プロバイダー ID をキーとするカスタム プロバイダー マップ。
- `models.providers.*.api`: アダプターを要求します (`openai-completions`、`openai-responses`、`anthropic-messages`、`google-generative-ai` など)。
- `models.providers.*.apiKey`: プロバイダーの資格情報 (SecretRef/env 置換を推奨)。
- `models.providers.*.auth`: 認証戦略 (`api-key`、`token`、`oauth`、`aws-sdk`)。
- `models.providers.*.injectNumCtxForOpenAICompat`: Ollama + `openai-completions` の場合、`options.num_ctx` をリクエストに挿入します (デフォルト: `true`)。
- `models.providers.*.authHeader`: 必要に応じて、`Authorization` ヘッダーで資格情報のトランスポートを強制します。
- `models.providers.*.baseUrl`: アップストリーム API ベース URL。
- `models.providers.*.headers`: プロキシ/テナント ルーティング用の追加の静的ヘッダー。
- `models.providers.*.models`: 明示的なプロバイダー モデル カタログ エントリ。
- `models.providers.*.models.*.compat.supportsDeveloperRole`: オプションの互換性ヒント。空ではない非ネイティブ `baseUrl` (`api.openai.com` ではないホスト) を持つ `api: "openai-completions"` の場合、OpenClaw は実行時にこれを強制的に `false` に設定します。空または省略された `baseUrl` は、デフォルトの OpenAI 動作を維持します。
- `models.bedrockDiscovery`: Bedrock 自動検出設定のルート。
- `models.bedrockDiscovery.enabled`: 検出ポーリングをオン/オフにします。
- `models.bedrockDiscovery.region`: 検出用の AWS リージョン。
- `models.bedrockDiscovery.providerFilter`: ターゲットを絞った検出のためのオプションのプロバイダー ID フィルター。
- `models.bedrockDiscovery.refreshInterval`: 検出更新のポーリング間隔。- `models.bedrockDiscovery.defaultContextWindow`: 検出されたモデルのフォールバック コンテキスト ウィンドウ。
- `models.bedrockDiscovery.defaultMaxTokens`: 検出されたモデルのフォールバック最大出力トークン。

### プロバイダーの例

<Accordion title="Cerebras (GLM 4.6 / 4.7)">

```json5
{
  env: { CEREBRAS_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: {
        primary: "cerebras/zai-glm-4.7",
        fallbacks: ["cerebras/zai-glm-4.6"],
      },
      models: {
        "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
        "cerebras/zai-glm-4.6": { alias: "GLM 4.6 (Cerebras)" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      cerebras: {
        baseUrl: "https://api.cerebras.ai/v1",
        apiKey: "${CEREBRAS_API_KEY}",
        api: "openai-completions",
        models: [
          { id: "zai-glm-4.7", name: "GLM 4.7 (Cerebras)" },
          { id: "zai-glm-4.6", name: "GLM 4.6 (Cerebras)" },
        ],
      },
    },
  },
}
````

大脳には `cerebras/zai-glm-4.7` を使用します。 Z.AI ダイレクトの `zai/glm-4.7`。

</Accordion>

<Accordion title="OpenCode Zen">

```json5
{
  agents: {
    defaults: {
      model: { primary: "opencode/claude-opus-4-6" },
      models: { "opencode/claude-opus-4-6": { alias: "Opus" } },
    },
  },
}
```

`OPENCODE_API_KEY` (または `OPENCODE_ZEN_API_KEY`) を設定します。ショートカット: `openclaw onboard --auth-choice opencode-zen`。

</Accordion>

<Accordion title="Z.AI（GLM-4.7）">

```json5
{
  agents: {
    defaults: {
      model: { primary: "zai/glm-4.7" },
      models: { "zai/glm-4.7": {} },
    },
  },
}
```

`ZAI_API_KEY` を設定します。 `z.ai/*` および `z-ai/*` は別名として受け入れられます。ショートカット: `openclaw onboard --auth-choice zai-api-key`。

- 一般エンドポイント: `https://api.z.ai/api/paas/v4`
- コーディングエンドポイント (デフォルト): `https://api.z.ai/api/coding/paas/v4`
- 一般的なエンドポイントの場合、ベース URL オーバーライドを使用してカスタム プロバイダーを定義します。

</Accordion>

<Accordion title="ムーンショットAI（キミ）">

```json5
{
  env: { MOONSHOT_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "moonshot/kimi-k2.5" },
      models: { "moonshot/kimi-k2.5": { alias: "Kimi K2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "kimi-k2.5",
            name: "Kimi K2.5",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 256000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

中国エンドポイントの場合: `baseUrl: "https://api.moonshot.cn/v1"` または `openclaw onboard --auth-choice moonshot-api-key-cn`。

</Accordion>

<Accordion title="キミコーディング">

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "kimi-coding/k2p5" },
      models: { "kimi-coding/k2p5": { alias: "Kimi K2.5" } },
    },
  },
}
```

Anthropic 互換の組み込みプロバイダー。ショートカット: `openclaw onboard --auth-choice kimi-code-api-key`。

</Accordion>

<Accordion title="合成 (人為的互換性)">

```json5
{
  env: { SYNTHETIC_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
      models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "hf:MiniMaxAI/MiniMax-M2.5",
            name: "MiniMax M2.5",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 192000,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

ベース URL は `/v1` を省略する必要があります (Anthropic クライアントが追加します)。ショートカット: `openclaw onboard --auth-choice synthetic-api-key`。

</Accordion>

<Accordion title="MiniMax M2.5 (直接)">

```json5
{
  agents: {
    defaults: {
      model: { primary: "minimax/MiniMax-M2.5" },
      models: {
        "minimax/MiniMax-M2.5": { alias: "Minimax" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      minimax: {
        baseUrl: "https://api.minimax.io/anthropic",
        apiKey: "${MINIMAX_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "MiniMax-M2.5",
            name: "MiniMax M2.5",
            reasoning: false,
            input: ["text"],
            cost: { input: 15, output: 60, cacheRead: 2, cacheWrite: 10 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

`MINIMAX_API_KEY` を設定します。ショートカット: `openclaw onboard --auth-choice minimax-api`。

</Accordion>

<Accordion title="ローカルモデル (LM Studio)">[ローカル モデル](/gateway/local-models) を参照してください。 TL;DR: 本格的なハードウェアで LM Studio Response API 経由で MiniMax M2.5 を実行します。フォールバックのためにホストされたモデルをマージしたままにします。

</Accordion>

---

## スキル

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn
    },
    entries: {
      "nano-banana-pro": {
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: バンドルされたスキルのみのオプションの許可リスト (管理/ワークスペース スキルは影響を受けません)。
- `entries.<skillKey>.enabled: false` は、バンドル/インストールされている場合でもスキルを無効にします。
- `entries.<skillKey>.apiKey`: プライマリ環境変数 (プレーンテキスト文字列または SecretRef オブジェクト) を宣言するスキルの利便性。

---

## プラグイン

````json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: [],
    load: {
      paths: ["~/Projects/oss/voice-call-extension"],
    },
    entries: {
      "voice-call": {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
        config: { provider: "twilio" },
      },
    },
  },
}
```- `~/.openclaw/extensions`、`<workspace>/.openclaw/extensions`、および `plugins.load.paths` からロードされます。
- **構成を変更するにはゲートウェイの再起動が必要です。**
- `allow`: オプションの許可リスト (リストされたプラグインのみがロードされます)。 `deny` が勝ちます。
- `plugins.entries.<id>.apiKey`: プラグインレベルの API キー便利フィールド (プラグインでサポートされている場合)。
- `plugins.entries.<id>.env`: プラグインスコープの環境変数マップ。
- `plugins.entries.<id>.hooks.allowPromptInjection`: `false` の場合、コアは `before_prompt_build` をブロックし、レガシー `before_agent_start` からのプロンプト変更フィールドを無視しますが、レガシー `modelOverride` および `providerOverride` は保持します。
- `plugins.entries.<id>.config`: プラグイン定義の設定オブジェクト (プラグイン スキーマによって検証される)。
- `plugins.slots.memory`: アクティブなメモリ プラグイン ID を選択するか、メモリ プラグインを無効にする場合は `"none"` を選択します。
- `plugins.slots.contextEngine`: アクティブなコンテキスト エンジン プラグイン ID を選択します。別のエンジンをインストールして選択しない限り、デフォルトは `"legacy"` になります。
- `plugins.installs`: `openclaw plugins update` によって使用される CLI 管理のインストール メタデータ。
  - `source`、`spec`、`sourcePath`、`installPath`、`version`、`resolvedName`、`resolvedVersion`、 `resolvedSpec`、`integrity`、`shasum`、`resolvedAt`、`installedAt`。
  - `plugins.installs.*` を管理対象状態として扱います。手動編集よりも CLI コマンドを優先します。

[プラグイン](/tools/plugin) を参照してください。

---

## ブラウザ

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "chrome",
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: true, // default trusted-network mode
      // allowPrivateNetwork: true, // legacy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
    color: "#FF4500",
    // headless: false,
    // noSandbox: false,
    // extraArgs: [],
    // relayBindHost: "0.0.0.0", // only when the extension relay must be reachable across namespaces (for example WSL2)
    // executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    // attachOnly: false,
  },
}
```- `evaluateEnabled: false` は、`act:evaluate` および `wait --fn` を無効にします。
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` は、未設定の場合はデフォルトで `true` になります (信頼されたネットワーク モデル)。
- `ssrfPolicy.dangerouslyAllowPrivateNetwork: false` を設定して、厳密なパブリックのみのブラウザ ナビゲーションを実現します。
- `ssrfPolicy.allowPrivateNetwork` はレガシー エイリアスとして引き続きサポートされます。
- 厳密モードでは、明示的な例外に `ssrfPolicy.hostnameAllowlist` および `ssrfPolicy.allowedHostnames` を使用します。
- リモート プロファイルは接続専用です (開始/停止/リセットは無効)。
- 自動検出順序: Chromium ベースの場合はデフォルトのブラウザ → Chrome → Brave → Edge → Chromium → Chrome Canary。
- 制御サービス: ループバックのみ (ポートは `gateway.port` から派生、デフォルトは `18791`)。
- `extraArgs` は、ローカルの Chromium 起動に追加の起動フラグを追加します (たとえば、
  `--disable-gpu`、ウィンドウ サイズ、またはデバッグ フラグ)。
- `relayBindHost` は、Chrome 拡張機能リレーがリッスンする場所を変更します。ループバックのみのアクセスの場合は未設定のままにしておきます。 `0.0.0.0` などの明示的な非ループバック バインド アドレスは、リレーが名前空間の境界 (WSL2 など) を越える必要があり、ホスト ネットワークがすでに信頼されている場合にのみ設定します。

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, short text, image URL, or data URI
    },
  },
}
````

- `seamColor`: ネイティブ アプリ UI クロムのアクセント カラー (トーク モードのバブルの色合いなど)。
- `assistant`: UI ID オーバーライドを制御します。アクティブなエージェント ID にフォールバックします。

---

## ゲートウェイ

```json5
{
  gateway: {
    mode: "local", // local | remote
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token", // none | token | password | trusted-proxy
      token: "your-token",
      // password: "your-password", // or OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // for mode=trusted-proxy; see /gateway/trusted-proxy-auth
      allowTailscale: true,
      rateLimit: {
        maxAttempts: 10,
        windowMs: 60000,
        lockoutMs: 300000,
        exemptLoopback: true,
      },
    },
    tailscale: {
      mode: "off", // off | serve | funnel
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // allowedOrigins: ["https://control.example.com"], // required for non-loopback Control UI
      // dangerouslyAllowHostHeaderOriginFallback: false, // dangerous Host-header origin fallback mode
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    remote: {
      url: "ws://gateway.tailnet:18789",
      transport: "ssh", // ssh | direct
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // Optional. Default false.
    allowRealIpFallback: false,
    tools: {
      // Additional /tools/invoke HTTP denies
      deny: ["browser"],
      // Remove tools from the default HTTP deny list
      allow: ["gateway"],
    },
  },
}
```

<Accordion title="ゲートウェイフィールドの詳細">- `mode`: `local` (ゲートウェイを実行) または `remote` (リモート ゲートウェイに接続)。 `local` を除き、ゲートウェイは起動を拒否します。

- `port`: WS + HTTP 用の単一の多重化ポート。優先順位: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`。
- `bind`: `auto`、`loopback` (デフォルト)、`lan` (`0.0.0.0`)、`tailnet` (Tailscale IP のみ)、または`custom`。
- **レガシー バインド エイリアス**: ホスト エイリアスではなく、`gateway.bind` (`auto`、`loopback`、`lan`、`tailnet`、`custom`) のバインド モード値を使用します。 (`0.0.0.0`、`127.0.0.1`、`localhost`、`::`、`::1`)。
- **Docker 注**: デフォルトの `loopback` バインドは、コンテナー内の `127.0.0.1` をリッスンします。 Docker ブリッジ ネットワーキング (`-p 18789:18789`) では、トラフィックは `eth0` に到着するため、ゲートウェイに到達できません。すべてのインターフェイスでリッスンするには、`--network host` を使用するか、`bind: "lan"` (または `bind: "custom"` と `customBindHost: "0.0.0.0"`) を設定します。
- **認証**: デフォルトで必須。非ループバック バインドには共有トークン/パスワードが必要です。オンボーディング ウィザードはデフォルトでトークンを生成します。- `gateway.auth.token` と `gateway.auth.password` の両方が構成されている場合 (SecretRef を含む)、`gateway.auth.mode` を明示的に `token` または `password` に設定します。起動とサービスのインストール/修復フローの両方が構成され、モードが設定されていない場合、失敗します。
- `gateway.auth.mode: "none"`: 明示的な非認証モード。信頼できるローカル ループバック設定にのみ使用してください。これはオンボーディング プロンプトでは意図的に提供されません。
- `gateway.auth.mode: "trusted-proxy"`: ID 対応リバース プロキシに認証を委任し、`gateway.trustedProxies` からの ID ヘッダーを信頼します ([信頼されたプロキシ認証](/gateway/trusted-proxy-auth) を参照)。
- `gateway.auth.allowTailscale`: `true` の場合、Tailscale Serve ID ヘッダーはコントロール UI/WebSocket 認証を満たすことができます (`tailscale whois` で検証)。 HTTP API エンドポイントでは依然としてトークン/パスワード認証が必要です。このトークンレス フローは、ゲートウェイ ホストが信頼できることを前提としています。 `tailscale.mode = "serve"` の場合、デフォルトは `true` になります。
- `gateway.auth.rateLimit`: オプションの認証失敗リミッター。クライアント IP ごとおよび認証スコープごとに適用されます (共有シークレットとデバイス トークンは個別に追跡されます)。ブロックされた試行は `429` + `Retry-After` を返します。
  - `gateway.auth.rateLimit.exemptLoopback` のデフォルトは `true` です。 localhost のトラフィック レートも意図的に制限したい場合は、`false` を設定します (テスト セットアップまたは厳密なプロキシ展開の場合)。- ブラウザー オリジンの WS 認証試行は、ループバック除外が無効になっている状態で常に抑制されます (ブラウザー ベースのローカルホスト ブルート フォースに対する多層防御)。
- `tailscale.mode`: `serve` (テールネットのみ、ループバック バインド) または `funnel` (パブリック、認証が必要)。
- `controlUi.allowedOrigins`: ゲートウェイ WebSocket 接続用の明示的なブラウザー起点許可リスト。ブラウザクライアントが非ループバックオリジンからのものであることが予期される場合に必要です。
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: ホスト ヘッダー オリジン ポリシーに意図的に依存する展開でホスト ヘッダー オリジン フォールバックを有効にする危険なモード。
- `remote.transport`: `ssh` (デフォルト) または `direct` (ws/wss)。 `direct` の場合、`remote.url` は `ws://` または `wss://` である必要があります。
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: 信頼されたプライベート ネットワーク IP へのプレーンテキスト `ws://` を許可するクライアント側のブレークグラス オーバーライド。デフォルトでは平文の場合はループバックのみになります。
- `gateway.remote.token` / `.password` は、リモート クライアントの資格情報フィールドです。ゲートウェイ認証を独自に構成することはありません。
- `gateway.auth.*` が設定されていない場合、ローカル ゲートウェイの呼び出しパスはフォールバックとして `gateway.remote.*` を使用できます。
- `trustedProxies`: TLS を終了するリバース プロキシ IP。自分が制御するプロキシのみをリストします。
- `allowRealIpFallback`: `true` の場合、`X-Forwarded-For` が欠落している場合、ゲートウェイは `X-Real-IP` を受け入れます。フェールクローズ動作のデフォルト `false`。- `gateway.tools.deny`: HTTP `POST /tools/invoke` に対して追加のツール名がブロックされました (デフォルトの拒否リストを拡張します)。
- `gateway.tools.allow`: デフォルトの HTTP 拒否リストからツール名を削除します。

</Accordion>

### OpenAI 互換エンドポイント

- チャット完了: デフォルトでは無効になっています。 `gateway.http.endpoints.chatCompletions.enabled: true` で有効にします。
- 応答 API: `gateway.http.endpoints.responses.enabled`。
- 応答 URL 入力の強化:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
- オプションの応答強化ヘッダー:
  - `gateway.http.securityHeaders.strictTransportSecurity` (制御する HTTPS オリジンに対してのみ設定します。[信頼されたプロキシ認証](/gateway/trusted-proxy-auth#tls-termination-and-hsts) を参照)

### マルチインスタンスの分離

一意のポートと状態ディレクトリを使用して、1 つのホスト上で複数のゲートウェイを実行します。

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

便利なフラグ: `--dev` (`~/.openclaw-dev` + ポート `19001` を使用)、`--profile <name>` (`~/.openclaw-<name>` を使用)。

[複数のゲートウェイ](/gateway/multiple-gateways) を参照してください。

---

## フック

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    maxBodyBytes: 262144,
    defaultSessionKey: "hook:ingress",
    allowRequestSessionKey: false,
    allowedSessionKeyPrefixes: ["hook:"],
    allowedAgentIds: ["hooks", "main"],
    presets: ["gmail"],
    transformsDir: "~/.openclaw/hooks/transforms",
    mappings: [
      {
        match: { path: "gmail" },
        action: "agent",
        agentId: "hooks",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate: "From: {{messages[0].from}}\nSubject: {{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.2-mini",
      },
    ],
  },
}
```

認証: `Authorization: Bearer <token>` または `x-openclaw-token: <token>`。

**エンドポイント:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - リクエスト ペイロードの `sessionKey` は、`hooks.allowRequestSessionKey=true` (デフォルト: `false`) の場合にのみ受け入れられます。
- `POST /hooks/<name>` → `hooks.mappings` によって解決されました

<Accordion title="マッピングの詳細">- `match.path` は、`/hooks` の後のサブパスと一致します (例: `/hooks/gmail` → `gmail`)。

- `match.source` は、汎用パスのペイロード フィールドと一致します。
- `{{messages[0].subject}}` のようなテンプレートはペイロードから読み取られます。
- `transform` は、フック アクションを返す JS/TS モジュールを指すことができます。
  - `transform.module` は相対パスであり、`hooks.transformsDir` 内に収まる必要があります (絶対パスとトラバースは拒否されます)。
- `agentId` は特定のエージェントにルーティングします。不明な ID はデフォルトに戻ります。
- `allowedAgentIds`: 明示的なルーティングを制限します (`*` または省略 = すべて許可、`[]` = すべて拒否)。
- `defaultSessionKey`: フック エージェントのオプションの固定セッション キーは、明示的な `sessionKey` なしで実行されます。
- `allowRequestSessionKey`: `/hooks/agent` 呼び出し元が `sessionKey` を設定できるようにします (デフォルト: `false`)。
- `allowedSessionKeyPrefixes`: 明示的な `sessionKey` 値 (リクエスト + マッピング) のオプションのプレフィックス許可リスト。 `["hook:"]`。
- `deliver: true` はチャネルに最終応答を送信します。 `channel` のデフォルトは `last` です。
- `model` は、このフック実行の LLM をオーバーライドします (モデル カタログが設定されている場合は許可する必要があります)。

</Accordion>

### Gmail の統合

```json5
{
  hooks: {
    gmail: {
      account: "openclaw@gmail.com",
      topic: "projects/<project-id>/topics/gog-gmail-watch",
      subscription: "gog-gmail-watch-push",
      pushToken: "shared-push-token",
      hookUrl: "http://127.0.0.1:18789/hooks/gmail",
      includeBody: true,
      maxBytes: 20000,
      renewEveryMinutes: 720,
      serve: { bind: "127.0.0.1", port: 8788, path: "/" },
      tailscale: { mode: "funnel", path: "/gmail-pubsub" },
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

- 構成されている場合、ゲートウェイは起動時に `gog gmail watch serve` を自動起動します。 `OPENCLAW_SKIP_GMAIL_WATCHER=1` を無効に設定します。
- ゲートウェイと一緒に別の `gog gmail watch serve` を実行しないでください。

---

## キャンバスホスト

```json5

{
canvasHost: {
root: "~/.openclaw/workspace/canvas",
liveReload: true,
// enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
},
}

````

- エージェントが編集可能な HTML/CSS/JS および A2UI をゲートウェイ ポートで HTTP 経由で提供します。
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- ローカルのみ: `gateway.bind: "loopback"` (デフォルト) を維持します。
- 非ループバック バインド: キャンバス ルートには、他のゲートウェイ HTTP サーフェスと同様に、ゲートウェイ認証 (トークン/パスワード/信頼できるプロキシ) が必要です。
- ノード WebView は通常、認証ヘッダーを送信しません。ノードがペアリングされて接続されると、ゲートウェイはキャンバス/A2UI アクセス用にノード スコープの機能 URL をアドバタイズします。
- 機能 URL はアクティブ ノード WS セッションにバインドされており、すぐに期限切れになります。 IP ベースのフォールバックは使用されません。
- ライブリロードクライアントを提供される HTML に挿入します。
- 空の場合、スターター `index.html` を自動作成します。
- `/__openclaw__/a2ui/` で A2UI も提供します。
- 変更にはゲートウェイの再起動が必要です。
- 大きなディレクトリまたは `EMFILE` エラーのライブ リロードを無効にします。

---

## 発見

### mDNS (ボンジュール)

```json5
{
  discovery: {
    mdns: {
      mode: "minimal", // minimal | full | off
    },
  },
}
````

- `minimal` (デフォルト): TXT レコードから `cliPath` + `sshPort` を省略します。
- `full`: `cliPath` + `sshPort` を含みます。
- ホスト名のデフォルトは `openclaw` です。 `OPENCLAW_MDNS_HOSTNAME` でオーバーライドします。

### 広域 (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

ユニキャスト DNS-SD ゾーンを `~/.openclaw/dns/` に書き込みます。クロスネットワーク検出の場合は、DNS サーバー (CoreDNS 推奨) + Tailscale Split DNS とペアリングします。

セットアップ: `openclaw dns setup --apply`。

---

## 環境

### `env` (インライン環境変数)```json5

{
env: {
OPENROUTER_API_KEY: "sk-or-...",
vars: {
GROQ_API_KEY: "gsk-...",
},
shellEnv: {
enabled: true,
timeoutMs: 15000,
},
},
}

````

- インライン環境変数は、プロセス環境にキーがない場合にのみ適用されます。
- `.env` ファイル: CWD `.env` + `~/.openclaw/.env` (どちらも既存の変数をオーバーライドしません)。
- `shellEnv`: ログイン シェル プロファイルから不足している予期されたキーをインポートします。
- 完全な優先順位については、[環境](/help/environment) を参照してください。

### 環境変数の置換

`${VAR_NAME}` を使用して、構成文字列内の環境変数を参照します。

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
````

- 大文字の名前のみが一致しました: `[A-Z_][A-Z0-9_]*`。
- 変数が欠落しているか空であると、構成ロード時にエラーがスローされます。
- リテラル `${VAR}` の場合は、`${VAR}` でエスケープします。
- `$include` で動作します。

---

## 秘密

Secret ref は追加的です。プレーンテキストの値は引き続き機能します。

### `SecretRef`

1 つのオブジェクト シェイプを使用します。

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

検証:

- `provider` パターン:
- `source: "env"` ID パターン:
- `source: "file"` id: 絶対 JSON ポインター (例: `"/providers/openai/apiKey"`)
- `source: "exec"` ID パターン: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}# 構成リファレンス

`~/.openclaw/openclaw.json` で使用可能なすべてのフィールド。タスク指向の概要については、「[構成](/gateway/configuration)」を参照してください。

構成形式は **JSON5** (コメント + 末尾のカンマは許可されます) です。すべてのフィールドはオプションです。省略された場合、OpenClaw は安全なデフォルトを使用します。

---

## チャンネル

各チャネルは、その構成セクションが存在すると自動的に開始されます (`enabled: false` を除く)。

### DMとグループアクセス

すべてのチャネルは DM ポリシーとグループ ポリシーをサポートします。

| DMポリシー               | 行動                                                                                   |
| ------------------------ | -------------------------------------------------------------------------------------- | --- | ---------------- | ---- |
| `pairing` (デフォルト)   | 不明な送信者はワンタイムペアリングコードを受け取ります。所有者は承認する必要があります |
| `allowlist`              | `allowFrom` (またはペアの許可ストア) の送信者のみ                                      |
| `open`                   | すべての受信 DM を許可する (`allowFrom: ["*"]` が必要)                                 |
| `disabled`               | すべての受信 DM を無視する                                                             |     | グループポリシー | 行動 |
| ---------------------    | --------------------------------------------------------                               |
| `allowlist` (デフォルト) | 設定された許可リストに一致するグループのみ                                             |
| `open`                   | グループ許可リストをバイパスします (メンションゲートは引き続き適用されます)。          |
| `disabled`               | すべてのグループ/ルーム メッセージをブロックする                                       |

<Note>
`channels.defaults.groupPolicy` は、プロバイダーの `groupPolicy` が設定されていない場合のデフォルトを設定します。
ペアリング コードは 1 時間後に期限切れになります。保留中の DM ペアリング要求の上限は、**チャネルあたり 3** です。
プロバイダー ブロックが完全に欠落している (`channels.<provider>` が欠落している) 場合、ランタイム グループ ポリシーは起動警告とともに `allowlist` (フェールクローズ) にフォールバックします。
</Note>

### チャネルモデルのオーバーライド

`channels.modelByChannel` を使用して、特定のチャネル ID をモデルに固定します。値は `provider/model` または構成されたモデルのエイリアスを受け入れます。チャネル マッピングは、セッションにモデル オーバーライドがまだない場合 (たとえば、`/model` によって設定されている場合) に適用されます。

```json5
{
  channels: {
    modelByChannel: {
      discord: {
        "123456789012345678": "anthropic/claude-opus-4-6",
      },
      slack: {
        C1234567890: "openai/gpt-4.1",
      },
      telegram: {
        "-1001234567890": "openai/gpt-4.1-mini",
        "-1001234567890:topic:99": "anthropic/claude-sonnet-4-6",
      },
    },
  },
}
```

### チャネルのデフォルトとハートビート

プロバイダー間で共有されるグループ ポリシーとハートビートの動作には、`channels.defaults` を使用します。

````json5
{
  channels: {
    defaults: {
      groupPolicy: "allowlist", // open | allowlist | disabled
      heartbeat: {
        showOk: false,
        showAlerts: true,
        useIndicator: true,
      },
    },
  },
}
```- `channels.defaults.groupPolicy`: プロバイダーレベルの `groupPolicy` が設定されていない場合のフォールバック グループ ポリシー。
- `channels.defaults.heartbeat.showOk`: ハートビート出力に正常なチャネルのステータスを含めます。
- `channels.defaults.heartbeat.showAlerts`: ハートビート出力に劣化/エラーステータスを含めます。
- `channels.defaults.heartbeat.useIndicator`: コンパクトなインジケーター スタイルのハートビート出力をレンダリングします。

### WhatsApp

WhatsApp は、ゲートウェイの Web チャネル (Baileys Web) を通じて実行されます。リンクされたセッションが存在する場合、自動的に開始されます。

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      chunkMode: "length", // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // blue ticks (false in self-chat mode)
      groups: {
        "*": { requireMention: true },
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
  web: {
    enabled: true,
    heartbeatSeconds: 60,
    reconnect: {
      initialMs: 2000,
      maxMs: 120000,
      factor: 1.4,
      jitter: 0.2,
      maxAttempts: 0,
    },
  },
}
````

<Accordion title="マルチアカウント WhatsApp">

```json5
{
  channels: {
    whatsapp: {
      accounts: {
        default: {},
        personal: {},
        biz: {
          // authDir: "~/.openclaw/credentials/whatsapp/biz",
        },
      },
    },
  },
}
```

- アウトバウンド コマンドは、デフォルトでアカウント `default` が存在する場合に使用されます。それ以外の場合は、最初に設定されたアカウント ID (ソート済み)。
- オプションの `channels.whatsapp.defaultAccount` は、構成されたアカウント ID と一致する場合にフォールバックのデフォルトのアカウント選択をオーバーライドします。
- 従来の単一アカウントの Baileys 認証ディレクトリは、`openclaw doctor` によって `whatsapp/default` に移行されます。
- アカウントごとの上書き: `channels.whatsapp.accounts.<id>.sendReadReceipts`、`channels.whatsapp.accounts.<id>.dmPolicy`、`channels.whatsapp.accounts.<id>.allowFrom`。

</Accordion>

### 電報

````json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "your-bot-token",
      dmPolicy: "pairing",
      allowFrom: ["tg:123456789"],
      groups: {
        "*": { requireMention: true },
        "-1001234567890": {
          allowFrom: ["@admin"],
          systemPrompt: "Keep answers brief.",
          topics: {
            "99": {
              requireMention: false,
              skills: ["search"],
              systemPrompt: "Stay on topic.",
            },
          },
        },
      },
      customCommands: [
        { command: "backup", description: "Git backup" },
        { command: "generate", description: "Create an image" },
      ],
      historyLimit: 50,
      replyToMode: "first", // off | first | all
      linkPreview: true,
      streaming: "partial", // off | partial | block | progress (default: off)
      actions: { reactions: true, sendMessage: true },
      reactionNotifications: "own", // off | own | all
      mediaMaxMb: 100,
      retry: {
        attempts: 3,
        minDelayMs: 400,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
      network: {
        autoSelectFamily: true,
        dnsResultOrder: "ipv4first",
      },
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook",
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook",
    },
  },
}
```- ボット トークン: `channels.telegram.botToken` または `channels.telegram.tokenFile`、`TELEGRAM_BOT_TOKEN` はデフォルト アカウントのフォールバックとして使用されます。
- オプションの `channels.telegram.defaultAccount` は、構成されたアカウント ID と一致する場合、デフォルトのアカウント選択をオーバーライドします。
- マルチアカウント設定 (2 つ以上のアカウント ID) では、明示的なデフォルト (`channels.telegram.defaultAccount` または `channels.telegram.accounts.default`) を設定して、フォールバック ルーティングを回避します。 `openclaw doctor` は、これが欠落しているか無効な場合に警告します。
- `configWrites: false` は、Telegram が開始する設定の書き込みをブロックします (スーパーグループ ID の移行、`/config set|unset`)。
- `type: "acp"` を含むトップレベルの `bindings[]` エントリは、フォーラム トピックの永続的な ACP バインディングを構成します (`match.peer.id` の正規の `chatId:topic:topicId` を使用します)。フィールド セマンティクスは [ACP エージェント](/tools/acp-agents#channel-specific-settings) で共有されます。
- Telegram ストリーム プレビューは `sendMessage` + `editMessageText` を使用します (ダイレクト チャットおよびグループ チャットで機能します)。
- 再試行ポリシー: [再試行ポリシー](/concepts/retry) を参照してください。

### 不和

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: "your-bot-token",
      mediaMaxMb: 8,
      allowBots: false,
      actions: {
        reactions: true,
        stickers: true,
        polls: true,
        permissions: true,
        messages: true,
        threads: true,
        pins: true,
        search: true,
        memberInfo: true,
        roleInfo: true,
        roles: false,
        channelInfo: true,
        voiceStatus: true,
        events: true,
        moderation: false,
      },
      replyToMode: "off", // off | first | all
      dmPolicy: "pairing",
      allowFrom: ["1234567890", "123456789012345678"],
      dm: { enabled: true, groupEnabled: false, groupChannels: ["openclaw-dm"] },
      guilds: {
        "123456789012345678": {
          slug: "friends-of-openclaw",
          requireMention: false,
          ignoreOtherMentions: true,
          reactionNotifications: "own",
          users: ["987654321098765432"],
          channels: {
            general: { allow: true },
            help: {
              allow: true,
              requireMention: true,
              users: ["987654321098765432"],
              skills: ["docs"],
              systemPrompt: "Short answers only.",
            },
          },
        },
      },
      historyLimit: 20,
      textChunkLimit: 2000,
      chunkMode: "length", // length | newline
      streaming: "off", // off | partial | block | progress (progress maps to partial on Discord)
      maxLinesPerMessage: 17,
      ui: {
        components: {
          accentColor: "#5865F2",
        },
      },
      threadBindings: {
        enabled: true,
        idleHours: 24,
        maxAgeHours: 0,
        spawnSubagentSessions: false, // opt-in for sessions_spawn({ thread: true })
      },
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
      retry: {
        attempts: 3,
        minDelayMs: 500,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
  },
}
```- トークン: `channels.discord.token`、デフォルト アカウントのフォールバックとして `DISCORD_BOT_TOKEN`。
- オプションの `channels.discord.defaultAccount` は、設定されたアカウント ID と一致する場合、デフォルトのアカウント選択をオーバーライドします。
- 配信ターゲットには `user:<id>` (DM) または `channel:<id>` (ギルド チャネル) を使用します。裸の数値 ID は拒否されます。
- ギルド スラッグは小文字でスペースが `-` に置き換えられます。チャンネルキーはスラッグ名 (`#` ではありません) を使用します。ギルドIDを優先します。
- ボットが作成したメッセージはデフォルトでは無視されます。 `allowBots: true` はそれらを有効にします。 `allowBots: "mentions"` を使用して、ボットに言及するボット メッセージのみを受け入れます (独自のメッセージはまだフィルターされています)。
- `channels.discord.guilds.<id>.ignoreOtherMentions` (およびチャネル オーバーライド) は、別のユーザーまたはロールに言及するメッセージを削除しますが、ボットには言及しません (@everyone/@here を除く)。
- `maxLinesPerMessage` (デフォルトは 17) は、2000 文字未満の場合でも長いメッセージを分割します。
- `channels.discord.threadBindings` は、Discord のスレッドバインドされたルーティングを制御します。
  - `enabled`: スレッドバインドされたセッション機能の Discord オーバーライド (`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`、バインド配信/ルーティング)
  - `idleHours`: 非アクティブ状態が数時間で自動フォーカス解除されるための Discord オーバーライド (`0` は無効になります)
  - `maxAgeHours`: 時間単位のハードマックス年齢の Discord オーバーライド (`0` は無効になります)
  - `spawnSubagentSessions`: `sessions_spawn({ thread: true })` 自動スレッド作成/バインドのオプトイン スイッチ- `type: "acp"` を含むトップレベルの `bindings[]` エントリは、チャネルとスレッドの永続的な ACP バインディングを構成します (`match.peer.id` のチャネル/スレッド ID を使用します)。フィールド セマンティクスは [ACP エージェント](/tools/acp-agents#channel-specific-settings) で共有されます。
- `channels.discord.ui.components.accentColor` は、Discord コンポーネント v2 コンテナのアクセント カラーを設定します。
- `channels.discord.voice` は、Discord 音声チャネル会話とオプションの自動参加 + TTS オーバーライドを有効にします。
- `channels.discord.voice.daveEncryption` および `channels.discord.voice.decryptionFailureTolerance` は `@discordjs/voice` DAVE オプションに渡されます (デフォルトでは `true` および `24`)。
- OpenClaw はさらに、繰り返し復号化に失敗した後、音声セッションから離脱/再参加することで音声受信の回復を試みます。
- `channels.discord.streaming` は正規ストリーム モード キーです。従来の `streamMode` およびブール値 `streaming` 値は自動移行されます。
- `channels.discord.autoPresence` は、実行時の可用性をボットの存在にマップし (正常 => オンライン、劣化 => アイドル、消耗 => 停止)、オプションでステータス テキストの上書きを許可します。
- `channels.discord.dangerouslyAllowNameMatching` は、変更可能な名前/タグの一致を再度有効にします (ブレークグラス互換モード)。

**反応通知モード:** `off` (なし)、`own` (ボットのメッセージ、デフォルト)、`all` (すべてのメッセージ)、`allowlist` (すべてのメッセージの `guilds.<id>.users` から)。

### Google チャット

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      audienceType: "app-url", // app-url | project-number
      audience: "https://gateway.example.com/googlechat",
      webhookPath: "/googlechat",
      botUser: "users/1234567890",
      dm: {
        enabled: true,
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": { allow: true, requireMention: true },
      },
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```- サービス アカウント JSON: インライン (`serviceAccount`) またはファイルベース (`serviceAccountFile`)。
- サービス アカウント SecretRef もサポートされています (`serviceAccountRef`)。
- 環境フォールバック: `GOOGLE_CHAT_SERVICE_ACCOUNT` または `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`。
- 配信ターゲットには `spaces/<spaceId>` または `users/<userId>` を使用します。
- `channels.googlechat.dangerouslyAllowNameMatching` は、変更可能な電子メール プリンシパルの一致を再度有効にします (ブレークグラス互換モード)。

### スラック

```json5
{
  channels: {
    slack: {
      enabled: true,
      botToken: "xoxb-...",
      appToken: "xapp-...",
      dmPolicy: "pairing",
      allowFrom: ["U123", "U456", "*"],
      dm: { enabled: true, groupEnabled: false, groupChannels: ["G123"] },
      channels: {
        C123: { allow: true, requireMention: true, allowBots: false },
        "#general": {
          allow: true,
          requireMention: true,
          allowBots: false,
          users: ["U123"],
          skills: ["docs"],
          systemPrompt: "Short answers only.",
        },
      },
      historyLimit: 50,
      allowBots: false,
      reactionNotifications: "own",
      reactionAllowlist: ["U123"],
      replyToMode: "off", // off | first | all
      thread: {
        historyScope: "thread", // thread | channel
        inheritParent: false,
      },
      actions: {
        reactions: true,
        messages: true,
        pins: true,
        memberInfo: true,
        emojiList: true,
      },
      slashCommand: {
        enabled: true,
        name: "openclaw",
        sessionPrefix: "slack:slash",
        ephemeral: true,
      },
      typingReaction: "hourglass_flowing_sand",
      textChunkLimit: 4000,
      chunkMode: "length",
      streaming: "partial", // off | partial | block | progress (preview mode)
      nativeStreaming: true, // use Slack native streaming API when streaming=partial
      mediaMaxMb: 20,
    },
  },
}
````

- **ソケット モード**には、`botToken` と `appToken` の両方が必要です (デフォルトのアカウント環境フォールバックの場合は `SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN`)。
- **HTTP モード** には、`botToken` と `signingSecret` (ルートまたはアカウントごと) が必要です。
- `configWrites: false` は、Slack によって開始される設定の書き込みをブロックします。
- オプションの `channels.slack.defaultAccount` は、設定されたアカウント ID と一致する場合、デフォルトのアカウント選択をオーバーライドします。
- `channels.slack.streaming` は正規ストリーム モード キーです。従来の `streamMode` 値とブール値 `streaming` 値は自動移行されます。
- 配信ターゲットには `user:<id>` (DM) または `channel:<id>` を使用します。

**反応通知モード:** `off`、`own` (デフォルト)、`all`、`allowlist` (`reactionAllowlist` から)。

**スレッド セッションの分離:** `thread.historyScope` はスレッドごと (デフォルト)、またはチャネル全体で共有されます。 `thread.inheritParent` は、親チャネルのトランスクリプトを新しいスレッドにコピーします。- `typingReaction` は、返信の実行中に受信 Slack メッセージに一時的な反応を追加し、完了時に削除します。 `"hourglass_flowing_sand"` などの Slack 絵文字ショートコードを使用します。

| アクショングループ | デフォルト | メモ                    |
| ------------------ | ---------- | ----------------------- |
| 反応               | 有効       | 反応 + 反応のリスト     |
| メッセージ         | 有効       | 読み取り/送信/編集/削除 |
| ピン               | 有効       | 固定/固定解除/リスト    |
| メンバー情報       | 有効       | 会員情報                |
| 絵文字リスト       | 有効       | カスタム絵文字リスト    |

### 最も重要なこと

Mattermost はプラグインとして出荷されます: `openclaw plugins install @openclaw/mattermost`。

```json5
{
  channels: {
    mattermost: {
      enabled: true,
      botToken: "mm-token",
      baseUrl: "https://chat.example.com",
      dmPolicy: "pairing",
      chatmode: "oncall", // oncall | onmessage | onchar
      oncharPrefixes: [">", "!"],
      commands: {
        native: true, // opt-in
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Optional explicit URL for reverse-proxy/public deployments
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

チャット モード: `oncall` (@ メンションで応答、デフォルト)、`onmessage` (すべてのメッセージ)、`onchar` (トリガー プレフィックスで始まるメッセージ)。

Mattermost ネイティブ コマンドが有効な場合:- `commands.callbackPath` は、完全な URL ではなく、パス (`/api/channels/mattermost/command` など) である必要があります。

- `commands.callbackUrl` は OpenClaw ゲートウェイ エンドポイントに解決され、Mattermost サーバーから到達可能である必要があります。
- プライベート/テールネット/内部コールバック ホストの場合、Mattermost は必要な場合があります
  `ServiceSettings.AllowedUntrustedInternalConnections` には、コールバック ホスト/ドメインが含まれます。
  完全な URL ではなく、ホスト/ドメインの値を使用します。
- `channels.mattermost.configWrites`: Mattermost が開始する構成書き込みを許可または拒否します。
- `channels.mattermost.requireMention`: チャネルで返信する前に `@mention` が必要です。
- オプションの `channels.mattermost.defaultAccount` は、構成されたアカウント ID と一致する場合、デフォルトのアカウント選択をオーバーライドします。

### 信号

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // optional account binding
      dmPolicy: "pairing",
      allowFrom: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      configWrites: true,
      reactionNotifications: "own", // off | own | all | allowlist
      reactionAllowlist: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      historyLimit: 50,
    },
  },
}
```

**反応通知モード:** `off`、`own` (デフォルト)、`all`、`allowlist` (`reactionAllowlist` から)。

- `channels.signal.account`: チャネルの起動を特定の Signal アカウント ID に固定します。
- `channels.signal.configWrites`: Signal によって開始される構成書き込みを許可または拒否します。
- オプションの `channels.signal.defaultAccount` は、設定されたアカウント ID と一致する場合、デフォルトのアカウント選択をオーバーライドします。

### ブルーバブルズ

BlueBubbles が推奨される iMessage パスです (プラグインベース、`channels.bluebubbles` で構成)。

````json5
{
  channels: {
    bluebubbles: {
      enabled: true,
      dmPolicy: "pairing",
      // serverUrl, password, webhookPath, group controls, and advanced actions:
      // see /channels/bluebubbles
    },
  },
}
```- ここで取り上げるコアキーのパス: `channels.bluebubbles`、`channels.bluebubbles.dmPolicy`。
- オプションの `channels.bluebubbles.defaultAccount` は、構成されたアカウント ID と一致する場合、デフォルトのアカウント選択をオーバーライドします。
- 完全な BlueBubbles チャネル構成は [BlueBubbles](/channels/bluebubbles) に文書化されています。

### iメッセージ

OpenClaw は `imsg rpc` (標準入出力上の JSON-RPC) を生成します。デーモンやポートは必要ありません。

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "imsg",
      dbPath: "~/Library/Messages/chat.db",
      remoteHost: "user@gateway-host",
      dmPolicy: "pairing",
      allowFrom: ["+15555550123", "user@example.com", "chat_id:123"],
      historyLimit: 50,
      includeAttachments: false,
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      mediaMaxMb: 16,
      service: "auto",
      region: "US",
    },
  },
}
````

- オプションの `channels.imessage.defaultAccount` は、設定されたアカウント ID と一致する場合、デフォルトのアカウント選択をオーバーライドします。

- メッセージ DB へのフルディスク アクセスが必要です。
- `chat_id:<id>` ターゲットを優先します。チャットを一覧表示するには、`imsg chats --limit 20` を使用します。
- `cliPath` は SSH ラッパーを指すことができます。 SCP 添付ファイルを取得するために `remoteHost` (`host` または `user@host`) を設定します。
- `attachmentRoots` および `remoteAttachmentRoots` は、受信添付ファイル パスを制限します (デフォルト: `/Users/*/Library/Messages/Attachments`)。
- SCP は厳密なホスト キー チェックを使用するため、リレー ホスト キーが `~/.ssh/known_hosts` にすでに存在していることを確認してください。
- `channels.imessage.configWrites`: iMessage によって開始される設定の書き込みを許可または拒否します。

<Accordion title="iMessage SSH ラッパーの例">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Microsoft Teams

Microsoft Teams は拡張機能をサポートしており、`channels.msteams` で構成されています。

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, team/channel policies:
      // see /channels/msteams
    },
  },
}
```

- ここで取り上げるコアキーのパス: `channels.msteams`、`channels.msteams.configWrites`。
- 完全な Teams 構成 (資格情報、Webhook、DM/グループ ポリシー、チームごと/チャネルごとのオーバーライド) は、[Microsoft Teams](/channels/msteams) に文書化されています。### IRC

IRC は拡張機能をサポートしており、`channels.irc` で構成されています。

```json5
{
  channels: {
    irc: {
      enabled: true,
      dmPolicy: "pairing",
      configWrites: true,
      nickserv: {
        enabled: true,
        service: "NickServ",
        password: "${IRC_NICKSERV_PASSWORD}",
        register: false,
        registerEmail: "bot@example.com",
      },
    },
  },
}
```

- ここで説明するコアキーのパス: `channels.irc`、`channels.irc.dmPolicy`、`channels.irc.configWrites`、`channels.irc.nickserv.*`。
- オプションの `channels.irc.defaultAccount` は、構成されたアカウント ID と一致する場合、デフォルトのアカウント選択をオーバーライドします。
- 完全な IRC チャネル設定 (ホスト/ポート/TLS/チャネル/許可リスト/メンション ゲーティング) は [IRC](/channels/irc) に文書化されています。

### マルチアカウント (すべてのチャネル)

チャネルごとに複数のアカウントを実行します (それぞれに独自の `accountId` があります)。

````json5
{
  channels: {
    telegram: {
      accounts: {
        default: {
          name: "Primary bot",
          botToken: "123456:ABC...",
        },
        alerts: {
          name: "Alerts bot",
          botToken: "987654:XYZ...",
        },
      },
    },
  },
}
```- `default` は、`accountId` が省略された場合に使用されます (CLI + ルーティング)。
- 環境トークンは **デフォルト** アカウントにのみ適用されます。
- 基本チャネル設定は、アカウントごとに上書きされない限り、すべてのアカウントに適用されます。
- `bindings[].match.accountId` を使用して、各アカウントを別のエージェントにルーティングします。
- 単一アカウントのトップレベルのチャネル設定を使用しているときに、`openclaw channels add` (またはチャネルのオンボーディング) 経由でデフォルト以外のアカウントを追加すると、OpenClaw は最初にアカウントスコープのトップレベルの単一アカウントの値を `channels.<channel>.accounts.default` に移動し、元のアカウントが機能し続けるようにします。
- 既存のチャネルのみのバインディング (`accountId` なし) はデフォルトのアカウントと一致し続けます。アカウント スコープのバインディングはオプションのままです。
- `openclaw doctor --fix` は、名前付きアカウントが存在するが `default` が欠落している場合、アカウントをスコープとする最上位の単一アカウントの値を `accounts.default` に移動することにより、混合シェイプも修復します。

### その他の拡張チャネル

多くの拡張チャネルは `channels.<id>` として構成され、専用チャネル ページ (Feishu、Matrix、LINE、Nostr、Zalo、Nextcloud Talk、Synology Chat、Twitch など) に文書化されています。
完全なチャネル インデックスを参照してください: [チャネル](/channels)。

### グループチャットのメンションゲート

グループ メッセージはデフォルトで **メンションが必要** (メタデータのメンションまたは正規表現パターン) です。 WhatsApp、Telegram、Discord、Google Chat、および iMessage のグループ チャットに適用されます。

**メンションの種類:**- **メタデータのメンション**: ネイティブ プラットフォームの @-メンション。 WhatsApp セルフチャット モードでは無視されます。
- **テキスト パターン**: `agents.list[].groupChat.mentionPatterns` の正規表現パターン。常にチェックされています。
- メンション ゲートは、検出が可能な場合 (ネイティブ メンションまたは少なくとも 1 つのパターン) にのみ適用されます。

```json5
{
  messages: {
    groupChat: { historyLimit: 50 },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
````

`messages.groupChat.historyLimit` はグローバルなデフォルトを設定します。チャネルは `channels.<channel>.historyLimit` (またはアカウントごと) でオーバーライドできます。 `0` を無効に設定します。

#### DM 履歴の制限

```json5
{
  channels: {
    telegram: {
      dmHistoryLimit: 30,
      dms: {
        "123456789": { historyLimit: 50 },
      },
    },
  },
}
```

解決策: DM ごとのオーバーライド → プロバイダーのデフォルト → 制限なし (すべて保持)。

サポートされている: `telegram`、`whatsapp`、`discord`、`slack`、`signal`、`imessage`、`msteams`。

#### セルフチャットモード

セルフチャット モードを有効にするには、`allowFrom` に独自の番号を含めます (ネイティブの @-メンションを無視し、テキスト パターンにのみ応答します)。

```json5
{
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: { "*": { requireMention: true } },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: { mentionPatterns: ["reisponde", "@openclaw"] },
      },
    ],
  },
}
```

### コマンド (チャット コマンドの処理)

```json5
{
  commands: {
    native: "auto", // register native commands when supported
    text: true, // parse /commands in chat messages
    bash: false, // allow ! (alias: /bash)
    bashForegroundMs: 2000,
    config: false, // allow /config
    debug: false, // allow /debug
    restart: false, // allow /restart + gateway restart tool
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

<Accordion title="コマンド詳細">- テキスト コマンドは、先頭に `/` が付いた **スタンドアロン** メッセージである必要があります。

- `native: "auto"` は、Discord/Telegram のネイティブ コマンドをオンにし、Slack をオフのままにします。
- チャネルごとのオーバーライド: `channels.discord.commands.native` (ブール値または `"auto"`)。 `false` は、以前に登録されたコマンドをクリアします。
- `channels.telegram.customCommands` は、Telegram ボット メニュー エントリを追加します。
- `bash: true` は、ホスト シェルの `! <cmd>` を有効にします。 `tools.elevated.enabled` と `tools.elevated.allowFrom.<channel>` の送信者が必要です。
- `config: true` は `/config` を有効にします (`openclaw.json` の読み取り/書き込み)。ゲートウェイ `chat.send` クライアントの場合、永続的な `/config set|unset` 書き込みには `operator.admin` も必要です。読み取り専用 `/config show` は、通常の書き込みスコープのオペレーター クライアントで引き続き使用できます。
- `channels.<provider>.configWrites` はチャネルごとに構成の変更をゲートします (デフォルト: true)。
- `allowFrom` はプロバイダーごとです。設定すると、**唯一**の認証ソースになります (チャネル許可リスト/ペアリングと `useAccessGroups` は無視されます)。
- `useAccessGroups: false` を使用すると、`allowFrom` が設定されていない場合に、コマンドがアクセス グループ ポリシーをバイパスできます。

</Accordion>

---

## エージェントのデフォルト

### `agents.defaults.workspace`

デフォルト: `~/.openclaw/workspace`。

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

システム プロンプトのランタイム行に表示されるオプションのリポジトリ ルート。設定されていない場合、OpenClaw はワークスペースから上に向かって歩くことによって自動検出します。

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skipBootstrap`ワークスペース ブートストラップ ファイル (`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、 `BOOTSTRAP.md`)

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.bootstrapMaxChars`

切り詰められる前のワークスペース ブートストラップ ファイルあたりの最大文字数。デフォルト: `20000`。

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

すべてのワークスペース ブートストラップ ファイルに挿入される最大合計文字数。デフォルト: `150000`。

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 150000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

ブートストラップ コンテキストが切り詰められた場合に、エージェントに表示される警告テキストを制御します。
デフォルト: `"once"`。

- `"off"`: システム プロンプトに警告テキストを挿入しないでください。
- `"once"`: 一意の切り捨て署名ごとに 1 回警告を挿入します (推奨)。
- `"always"`: 切り捨てが存在する場合、実行ごとに警告を挿入します。

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### `agents.defaults.imageMaxDimensionPx`

プロバイダー呼び出し前のトランスクリプト/ツール画像ブロック内の最長画像側の最大ピクセル サイズ。
デフォルト: `1200`。

通常、値を低くすると、ビジョン トークンの使用量が減り、スクリーンショットを大量に使用する実行の場合に要求されるペイロード サイズが減ります。
値を大きくすると、視覚的な詳細がより多く保持されます。

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

システム プロンプト コンテキストのタイムゾーン (メッセージ タイムスタンプではありません)。ホストのタイムゾーンにフォールバックします。

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

システムプロンプトの時刻形式。デフォルト: `auto` (OS 設定)。

````json5
{
  agents: { defaults: { timeFormat: "auto" } }, // auto | 12 | 24
}
```### `agents.defaults.model`

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "minimax/MiniMax-M2.5": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.5"],
      },
      imageModel: {
        primary: "openrouter/qwen/qwen-2.5-vl-72b-instruct:free",
        fallbacks: ["openrouter/google/gemini-2.0-flash-vision:free"],
      },
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5-mini"],
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
      elevatedDefault: "on",
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      contextTokens: 200000,
      maxConcurrent: 3,
    },
  },
}
```- `model`: 文字列 (`"provider/model"`) またはオブジェクト (`{ primary, fallbacks }`) を受け入れます。
  ・文字列形式はプライマリモデルのみ設定します。
  - オブジェクト形式は、プライマリおよび順序付けされたフェイルオーバー モデルを設定します。
- `imageModel`: 文字列 (`"provider/model"`) またはオブジェクト (`{ primary, fallbacks }`) を受け入れます。
  - `image` ツール パスによってビジョン モデル構成として使用されます。
  - 選択/デフォルトのモデルが画像入力を受け入れられない場合のフォールバック ルーティングとしても使用されます。
- `pdfModel`: 文字列 (`"provider/model"`) またはオブジェクト (`{ primary, fallbacks }`) を受け入れます。
  - モデル ルーティング用の `pdf` ツールによって使用されます。
  - 省略した場合、PDF ツールは `imageModel` にフォールバックし、その後ベストエフォート型プロバイダーのデフォルトにフォールバックします。
- `pdfMaxBytesMb`: 呼び出し時に `maxBytesMb` が渡されない場合の、`pdf` ツールのデフォルトの PDF サイズ制限。
- `pdfMaxPages`: `pdf` ツールの抽出フォールバック モードで考慮されるデフォルトの最大ページ数。
- `model.primary`: `provider/model` の形式 (例: `anthropic/claude-opus-4-6`)。プロバイダーを省略した場合、OpenClaw は `anthropic` (非推奨) を想定します。
- `models`: `/model` の構成されたモデル カタログと許可リスト。各エントリには、`alias` (ショートカット) および `params` (プロバイダー固有、たとえば、`temperature`、`maxTokens`、`cacheRetention`、`context1m`) を含めることができます。- `params` マージ優先順位 (構成): `agents.defaults.models["provider/model"].params` がベースで、その後 `agents.list[].params` (エージェント ID と一致する) がキーによってオーバーライドされます。
- これらのフィールドを変更する構成ライター (`/models set`、`/models set-image`、およびフォールバック追加/削除コマンドなど) は、可能であれば正規のオブジェクト形式を保存し、既存のフォールバック リストを保存します。
- `maxConcurrent`: 最大並列エージェントはセッション間で実行されます (各セッションはまだシリアル化されています)。デフォルト: 1。

**組み込みのエイリアスの短縮表記** (モデルが `agents.defaults.models` の場合にのみ適用されます):

|別名 |モデル |
| ------------------- | -------------------------------------- |
| `opus` | `anthropic/claude-opus-4-6` |
| `sonnet` | `anthropic/claude-sonnet-4-6` |
| `gpt` | `openai/gpt-5.4` |
| `gpt-mini` | `openai/gpt-5-mini` |
| `gemini` | `google/gemini-3.1-pro-preview` |
| `gemini-flash` | `google/gemini-3-flash-preview` |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview` |

設定したエイリアスは常にデフォルトよりも優先されます。Z.AI GLM-4.x モデルは、`--thinking off` を設定するか、`agents.defaults.models["zai/<model>"].params.thinking` を自分で定義しない限り、思考モードを自動的に有効にします。
Z.AI モデルでは、ツール呼び出しストリーミングに対してデフォルトで `tool_stream` が有効になっています。無効にするには、`agents.defaults.models["zai/<model>"].params.tool_stream` を `false` に設定します。
Anthropic Claude 4.6 モデルは、明示的思考レベルが設定されていない場合、デフォルトで `adaptive` 思考になります。

### `agents.defaults.cliBackends`

テキストのみのフォールバック実行用のオプションの CLI バックエンド (ツール呼び出しなし)。 API プロバイダーに障害が発生した場合のバックアップとして役立ちます。

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          systemPromptArg: "--system",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
````

- CLI バックエンドはテキストファーストです。ツールは常に無効になっています。
- `sessionArg` が設定されている場合にサポートされるセッション。
- `imageArg` がファイル パスを受け入れる場合、イメージ パススルーがサポートされます。

### `agents.defaults.heartbeat`

定期的なハートビートが実行されます。

````json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m disables
        model: "openai/gpt-5.2-mini",
        includeReasoning: false,
        lightContext: false, // default: false; true keeps only HEARTBEAT.md from workspace bootstrap files
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (default) | block
        target: "none", // default: none | options: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
      },
    },
  },
}
```- `every`: 期間文字列 (ms/s/m/h)。デフォルト: `30m`。
- `suppressToolErrorWarnings`: true の場合、ハートビートの実行中にツール エラー警告ペイロードが抑制されます。
- `directPolicy`: 直接/DM 配信ポリシー。 `allow` (デフォルト) は、直接ターゲット配信を許可します。 `block` は直接ターゲットの配信を抑制し、`reason=dm-blocked` を発行します。
- `lightContext`: true の場合、ハートビートの実行では軽量ブートストラップ コンテキストが使用され、ワー​​クスペース ブートストラップ ファイルから `HEARTBEAT.md` のみが保持されます。
- エージェントごと: `agents.list[].heartbeat` を設定します。いずれかのエージェントが `heartbeat` を定義すると、**それらのエージェントのみ** がハートビートを実行します。
- ハートビートはエージェント ターン全体を実行します。間隔が短いほど、より多くのトークンが消費されます。

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        reserveTokensFloor: 24000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // used when identifierPolicy=custom
        postCompactionSections: ["Session Startup", "Red Lines"], // [] disables reinjection
        model: "openrouter/anthropic/claude-sonnet-4-5", // optional compaction-only model override
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```- `mode`: `default` または `safeguard` (長い履歴のチャンク化された要約)。 [圧縮](/concepts/compaction) を参照してください。
- `identifierPolicy`: `strict` (デフォルト)、`off`、または `custom`。 `strict` は、圧縮要約中に組み込みの不透明な識別子保持ガイダンスを先頭に追加します。
- `identifierInstructions`: `identifierPolicy=custom` の場合に使用されるオプションのカスタム識別子保存テキスト。
- `postCompactionSections`: 圧縮後に再挿入するオプションの AGENTS.md H2/H3 セクション名。デフォルトは `["Session Startup", "Red Lines"]` です。 `[]` を設定して再注入を無効にします。設定を解除するか、そのデフォルトのペアに明示的に設定すると、古い `Every Session`/`Safety` 見出しもレガシー フォールバックとして受け入れられます。
- `model`: 圧縮要約のみのオプションの `provider/model-id` オーバーライド。これは、メイン セッションで 1 つのモデルを保持する必要があるが、圧縮サマリーを別のモデルで実行する必要がある場合に使用します。設定されていない場合、圧縮ではセッションのプライマリ モデルが使用されます。
- `memoryFlush`: 耐久性のあるメモリを保存するための自動圧縮前のサイレント エージェント ターン。ワークスペースが読み取り専用の場合はスキップされます。

### `agents.defaults.contextPruning`

LLM に送信する前に、メモリ内コンテキストから **古いツールの結果** を削除します。ディスク上のセッション履歴は**変更されません**。

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // duration (ms/s/m/h), default unit: minutes
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Old tool result content cleared]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
````

<Accordion title="キャッシュ TTL モードの動作">- `mode: "cache-ttl"` はプルーニング パスを有効にします。

- `ttl` は、プルーニングを再度実行できる頻度 (最後のキャッシュ タッチ後) を制御します。
- プルーニングでは、まずサイズの大きいツール結果がソフト トリムされ、次に必要に応じて古いツール結果がハードクリアされます。

**ソフトトリム**は、先頭と末尾を維持し、途中に `...` を挿入します。

**ハードクリア** は、ツールの結果全体をプレースホルダーに置き換えます。

注:

- 画像ブロックは決してトリミング/クリアされません。
- 比率は文字ベース (概算) であり、正確なトークン数ではありません。
- 存在するアシスタント メッセージが `keepLastAssistants` 未満の場合、プルーニングはスキップされます。

</Accordion>

動作の詳細については、[セッション プルーニング](/concepts/session-pruning) を参照してください。

### ストリーミングをブロックする

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (use minMs/maxMs)
    },
  },
}
```

- Telegram 以外のチャネルでは、ブロック応答を有効にするには明示的な `*.blockStreaming: true` が必要です。
- チャネル オーバーライド: `channels.<channel>.blockStreamingCoalesce` (およびアカウントごとのバリアント)。 Signal/Slack/Discord/Google Chat のデフォルト `minChars: 1500`。
- `humanDelay`: ブロック返信間のランダムな一時停止。 `natural` = 800 ～ 2500 ミリ秒。エージェントごとのオーバーライド: `agents.list[].humanDelay`。

動作とチャンク化の詳細については、[ストリーミング](/concepts/streaming) を参照してください。

### タイピングインジケーター

```json5
{
  agents: {
    defaults: {
      typingMode: "instant", // never | instant | thinking | message
      typingIntervalSeconds: 6,
    },
  },
}
```

- デフォルト: 直接チャット/メンションの場合は `instant`、言及されていないグループ チャットの場合は `message`。
- セッションごとのオーバーライド: `session.typingMode`、`session.typingIntervalSeconds`。

[タイピングインジケーター](/concepts/typing-indicators) を参照してください。

### `agents.defaults.sandbox`埋め込みエージェント用のオプションの **Docker サンドボックス**。完全なガイドについては、[サンドボックス](/gateway/sandboxing) を参照してください

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        scope: "agent", // session | agent | shared
        workspaceAccess: "none", // none | ro | rw
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          containerPrefix: "openclaw-sbx-",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
          capDrop: ["ALL"],
          env: { LANG: "C.UTF-8" },
          setupCommand: "apt-get update && apt-get install -y git curl jq",
          pidsLimit: 256,
          memory: "1g",
          memorySwap: "2g",
          cpus: 1,
          ulimits: {
            nofile: { soft: 1024, hard: 2048 },
            nproc: 256,
          },
          seccompProfile: "/path/to/seccomp.json",
          apparmorProfile: "openclaw-sandbox",
          dns: ["1.1.1.1", "8.8.8.8"],
          extraHosts: ["internal.service:10.0.0.5"],
          binds: ["/home/user/source:/source:rw"],
        },
        browser: {
          enabled: false,
          image: "openclaw-sandbox-browser:bookworm-slim",
          network: "openclaw-sandbox-browser",
          cdpPort: 9222,
          cdpSourceRange: "172.21.0.1/32",
          vncPort: 5900,
          noVncPort: 6080,
          headless: false,
          enableNoVnc: true,
          allowHostControl: false,
          autoStart: true,
          autoStartTimeoutMs: 12000,
        },
        prune: {
          idleHours: 24,
          maxAgeDays: 7,
        },
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        allow: [
          "exec",
          "process",
          "read",
          "write",
          "edit",
          "apply_patch",
          "sessions_list",
          "sessions_history",
          "sessions_send",
          "sessions_spawn",
          "session_status",
        ],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"],
      },
    },
  },
}
```

<Accordion title="サンドボックスの詳細">

**ワークスペースへのアクセス:**

- `none`: `~/.openclaw/sandboxes` の下のスコープごとのサンドボックス ワークスペース
- `ro`: サンドボックス ワークスペースは `/workspace`、エージェント ワークスペースは `/agent` に読み取り専用でマウントされています
- `rw`: エージェント ワークスペースは `/workspace` に読み取り/書き込み可能にマウントされました

**範囲:**

- `session`: セッションごとのコンテナ + ワークスペース
- `agent`: エージェントごとに 1 つのコンテナ + ワークスペース (デフォルト)
- `shared`: 共有コンテナーとワークスペース (セッション間の分離なし)

**`setupCommand`** は、コンテナーの作成後に 1 回実行されます (`sh -lc` 経由)。ネットワーク出力、書き込み可能な root、root ユーザーが必要です。

**コンテナのデフォルトは `network: "none"`** です。エージェントが送信アクセスを必要とする場合は、`"bridge"` (またはカスタム ブリッジ ネットワーク) に設定されます。
`"host"` はブロックされています。 `"container:<id>"` は、明示的に設定しない限り、デフォルトでブロックされます
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (ガラス破り)。

**受信添付ファイル**は、アクティブなワークスペースの `media/inbound/*` にステージングされます。

**`docker.binds`** は追加のホスト ディレクトリをマウントします。グローバル バインドとエージェントごとのバインドがマージされます。**サンドボックス ブラウザ** (`sandbox.browser.enabled`): コンテナ内の Chromium + CDP。 noVNC URL がシステム プロンプトに挿入されました。 `openclaw.json` に `browser.enabled` は必要ありません。
noVNC オブザーバー アクセスでは、デフォルトで VNC 認証が使用され、OpenClaw は (共有 URL でパスワードを公開する代わりに) 有効期間の短いトークン URL を発行します。- `allowHostControl: false` (デフォルト) は、サンドボックス化されたセッションがホスト ブラウザーをターゲットにすることをブロックします。

- `network` のデフォルトは `openclaw-sandbox-browser` (専用ブリッジ ネットワーク) です。明示的にグローバル ブリッジ接続が必要な場合にのみ、`bridge` に設定します。
- `cdpSourceRange` は、オプションでコンテナ エッジでの CDP イングレスを CIDR 範囲に制限します (`172.21.0.1/32` など)。
- `sandbox.browser.binds` は、追加のホスト ディレクトリをサンドボックス ブラウザ コンテナのみにマウントします。設定すると (`[]` を含む)、ブラウザー コンテナーの `docker.binds` が置き換えられます。
- 起動デフォルトは `scripts/sandbox-browser-entrypoint.sh` で定義され、コンテナー ホスト用に調整されています。
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-3d-apis`
  - `--disable-gpu`
  - `--disable-software-rasterizer`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-features=TranslateUI`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--renderer-process-limit=2`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--disable-extensions` (デフォルトで有効)
  - `--disable-3d-apis`、`--disable-software-rasterizer`、および `--disable-gpu` は
    デフォルトで有効になっており、次のコマンドで無効にできます
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` WebGL/3D の使用に必要な場合。
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` は、ワークフローが次の場合に拡張機能を再度有効にします。
    彼ら次第です。
  - `--renderer-process-limit=2` は次のように変更できます。
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; Chromium を使用するように `0` を設定します
    デフォルトのプロセス制限。- `noSandbox` が有効な場合は、`--no-sandbox` および `--disable-setuid-sandbox` が追加されます。
  - デフォルトはコンテナイメージのベースラインです。カスタムのブラウザ画像をカスタムで使用する
    コンテナのデフォルトを変更するためのエントリポイント。

</Accordion>

イメージをビルドします。

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

### `agents.list` (エージェントごとの上書き)

````json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "Main Agent",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // or { primary, fallbacks }
        params: { cacheRetention: "none" }, // overrides matching defaults.models params by key
        identity: {
          name: "Samantha",
          theme: "helpful sloth",
          emoji: "🦥",
          avatar: "avatars/samantha.png",
        },
        groupChat: { mentionPatterns: ["@openclaw"] },
        sandbox: { mode: "off" },
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
        subagents: { allowAgents: ["*"] },
        tools: {
          profile: "coding",
          allow: ["browser"],
          deny: ["canvas"],
          elevated: { enabled: true },
        },
      },
    ],
  },
}
```- `id`: 安定したエージェント ID (必須)。
- `default`: 複数が設定されている場合、最初が優先されます (警告がログに記録されます)。何も設定されていない場合は、最初のリスト エントリがデフォルトになります。
- `model`: 文字列形式は `primary` のみをオーバーライドします。オブジェクト フォーム `{ primary, fallbacks }` は両方をオーバーライドします (`[]` はグローバル フォールバックを無効にします)。 `primary` をオーバーライドするだけの Cron ジョブは、`fallbacks: []` を設定しない限り、デフォルトのフォールバックを継承します。
- `params`: `agents.defaults.models` で選択されたモデル エントリにマージされたエージェントごとのストリーム パラメーター。これは、モデル カタログ全体を複製せずに、`cacheRetention`、`temperature`、`maxTokens` などのエージェント固有のオーバーライドに使用します。
- `runtime`: オプションのエージェントごとのランタイム記述子。エージェントがデフォルトで ACP ハーネス セッションを使用する必要がある場合は、`type: "acp"` を `runtime.acp` デフォルト (`agent`、`backend`、`mode`、`cwd`) とともに使用します。
- `identity.avatar`: ワークスペース相対パス、`http(s)` URL、または `data:` URI。
- `identity` はデフォルトを派生します: `emoji` から `ackReaction`、`name`/`emoji` から `mentionPatterns`。
- `subagents.allowAgents`: `sessions_spawn` のエージェント ID の許可リスト (`["*"]` = 任意、デフォルト: 同じエージェントのみ)。
- サンドボックス継承ガード: リクエスター セッションがサンドボックス化されている場合、`sessions_spawn` はサンドボックス化されずに実行されるターゲットを拒否します。

---## マルチエージェントルーティング

1 つのゲートウェイ内で複数の分離されたエージェントを実行します。 [マルチエージェント](/concepts/multi-agent) を参照してください。

```json5
{
  agents: {
    list: [
      { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
      { id: "work", workspace: "~/.openclaw/workspace-work" },
    ],
  },
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
  ],
}
````

### 一致フィールドのバインディング

- `type` (オプション): 通常のルーティングの場合は `route` (タイプが欠落している場合はデフォルトでルーティングされます)、永続的な ACP 会話バインディングの場合は `acp`。
- `match.channel` (必須)
- `match.accountId` (オプション; `*` = 任意のアカウント; 省略 = デフォルトのアカウント)
- `match.peer` (オプション; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (オプション、チャネル固有)
- `acp` (オプション; `type: "acp"` のみ): `{ mode, label, cwd, backend }`

**決定的な一致順序:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (正確、ピア/ギルド/チームなし)
5. `match.accountId: "*"` (チャネル全体)
6. デフォルトエージェント

各層内で、最初に一致した `bindings` エントリが優先されます。

`type: "acp"` エントリの場合、OpenClaw は正確な会話 ID (`match.channel` + アカウント + `match.peer.id`) によって解決し、上記のルート バインディング層の順序は使用しません。

### エージェントごとのアクセス プロファイル

<Accordion title="フルアクセス (サンドボックスなし)">

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="読み取り専用ツール + ワークスペース">

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "ro" },
        tools: {
          allow: [
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="ファイルシステムへのアクセスなし (メッセージングのみ)">

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "none" },
        tools: {
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
            "gateway",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

</Accordion>

優先順位の詳細については、[マルチエージェント サンドボックスとツール](/tools/multi-agent-sandbox-tools) を参照してください。

---

## セッション

```json5
{
  session: {
    scope: "per-sender",
    dmScope: "main", // main | per-peer | per-channel-peer | per-account-channel-peer
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      mode: "daily", // daily | idle
      atHour: 4,
      idleMinutes: 60,
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      direct: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    parentForkMaxTokens: 100000, // skip parent-thread fork above this token count (0 disables)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // duration or false
      maxDiskBytes: "500mb", // optional hard budget
      highWaterBytes: "400mb", // optional cleanup target
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // default inactivity auto-unfocus in hours (`0` disables)
      maxAgeHours: 0, // default hard max age in hours (`0` disables)
    },
    mainKey: "main", // legacy (runtime always uses "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="セッションフィールドの詳細">- **`dmScope`**: DM がグループ化される方法。

- `main`: すべての DM がメイン セッションを共有します。
- `per-peer`: チャネル間で送信者 ID によって分離します。
- `per-channel-peer`: チャネル + 送信者ごとに分離します (マルチユーザーの受信箱に推奨)。
- `per-account-channel-peer`: アカウント + チャネル + 送信者ごとに分離します (複数のアカウントに推奨)。
- **`identityLinks`**: クロスチャネルセッション共有のために、正規 ID をプロバイダープレフィックス付きのピアにマップします。
- **`reset`**: プライマリ リセット ポリシー。 `daily` は現地時間の `atHour` にリセットされます。 `idle` は `idleMinutes` の後にリセットされます。両方が設定されている場合は、先に期限が切れた方が優先されます。
- **`resetByType`**: タイプごとのオーバーライド (`direct`、`group`、`thread`)。レガシー `dm` は `direct` のエイリアスとして受け入れられます。
- **`parentForkMaxTokens`**: フォークされたスレッド セッションの作成時に許可される最大親セッション `totalTokens` (デフォルト `100000`)。
  - 親 `totalTokens` がこの値を超えている場合、OpenClaw は親トランスクリプト履歴を継承する代わりに、新しいスレッド セッションを開始します。
  - このガードを無効にし、常に親のフォークを許可するには、`0` を設定します。
- **`mainKey`**: 従来のフィールド。ランタイムは、メインのダイレクト チャット バケットに常に `"main"` を使用するようになりました。- **`sendPolicy`**: `channel`、`chatType` (`direct|group|channel`、従来の `dm` エイリアスを使用)、`keyPrefix`、または `rawKeyPrefix` による一致。最初に拒否した方が勝ちです。
- **`maintenance`**: セッション ストアのクリーンアップ + 保持制御。
  - `mode`: `warn` は警告のみを発行します。 `enforce` はクリーンアップを適用します。
  - `pruneAfter`: 古いエントリの期限切れ (デフォルト `30d`)。
  - `maxEntries`: `sessions.json` のエントリの最大数 (デフォルトは `500`)。
  - `rotateBytes`: このサイズを超える場合、`sessions.json` を回転します (デフォルト `10mb`)。
  - `resetArchiveRetention`: `*.reset.<timestamp>` トランスクリプト アーカイブの保持。デフォルトは `pruneAfter` です。 `false` を無効に設定します。
  - `maxDiskBytes`: オプションのセッション ディレクトリのディスク バジェット。 `warn` モードでは、警告がログに記録されます。 `enforce` モードでは、最も古いアーティファクト/セッションが最初に削除されます。
  - `highWaterBytes`: 予算クリーンアップ後のオプションのターゲット。デフォルトは `80%` または `maxDiskBytes` です。
- **`threadBindings`**: スレッドバインドされたセッション機能のグローバルデフォルト。
  - `enabled`: マスターデフォルトスイッチ (プロバイダーは上書き可能; Discord は `channels.discord.threadBindings.enabled` を使用します)
  - `idleHours`: デフォルトの非アクティブ状態は時間単位で自動的にフォーカスを解除します (`0` は無効になります。プロバイダーはオーバーライドできます)- `maxAgeHours`: デフォルトのハードマックス経過時間 (`0` は無効になります。プロバイダーはオーバーライドできます)

</Accordion>

---

## メッセージ

```json5
{
  messages: {
    responsePrefix: "🦞", // or "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "collect", // steer | followup | collect | steer-backlog | steer+backlog | queue | interrupt
      debounceMs: 1000,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "collect",
        telegram: "collect",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 disables
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### 応答プレフィックス

チャネル/アカウントごとのオーバーライド: `channels.<channel>.responsePrefix`、`channels.<channel>.accounts.<id>.responsePrefix`。

解決策 (最も具体的な勝利): アカウント → チャネル → グローバル。 `""` はカスケードを無効にして停止します。 `"auto"` は `[{identity.name}]` を派生させます。

**テンプレート変数:**

| 変数              | 説明               | 例                          |
| ----------------- | ------------------ | --------------------------- |
| `{model}`         | 短いモデル名       | `claude-opus-4-6`           |
| `{modelFull}`     | 完全なモデル識別子 | `anthropic/claude-opus-4-6` |
| `{provider}`      | プロバイダー名     | `anthropic`                 |
| `{thinkingLevel}` | 現在の思考レベル   | `high`、`low`、`off`        |
| `{identity.name}` | エージェント ID 名 | (`"auto"` と同じ)           |

変数では大文字と小文字が区別されません。 `{think}` は、`{thinkingLevel}` のエイリアスです。

### ACK反応- デフォルトはアクティブなエージェントの `identity.emoji`、それ以外の場合は `"👀"` です。 `""` を無効に設定します

- チャネルごとのオーバーライド: `channels.<channel>.ackReaction`、`channels.<channel>.accounts.<id>.ackReaction`。
- 解決順序: アカウント → チャネル → `messages.ackReaction` → ID フォールバック。
- スコープ: `group-mentions` (デフォルト)、`group-all`、`direct`、`all`。
- `removeAckAfterReply`: 返信後の確認応答を削除します (Slack/Discord/Telegram/Google Chat のみ)。

### インバウンドデバウンス

同じ送信者からのテキストのみの迅速なメッセージを 1 つのエージェント ターンにバッチ処理します。メディア/添付ファイルはすぐにフラッシュされます。制御コマンドはデバウンスをバイパスします。

### TTS (テキスト読み上げ)

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      elevenlabs: {
        apiKey: "elevenlabs_api_key",
        baseUrl: "https://api.elevenlabs.io",
        voiceId: "voice_id",
        modelId: "eleven_multilingual_v2",
        seed: 42,
        applyTextNormalization: "auto",
        languageCode: "en",
        voiceSettings: {
          stability: 0.5,
          similarityBoost: 0.75,
          style: 0.0,
          useSpeakerBoost: true,
          speed: 1.0,
        },
      },
      openai: {
        apiKey: "openai_api_key",
        baseUrl: "https://api.openai.com/v1",
        model: "gpt-4o-mini-tts",
        voice: "alloy",
      },
    },
  },
}
```

- `auto` は自動 TTS を制御します。 `/tts off|always|inbound|tagged` はセッションごとにオーバーライドされます。
- `summaryModel` は、自動要約の `agents.defaults.model.primary` をオーバーライドします。
- `modelOverrides` はデフォルトで有効になっています。 `modelOverrides.allowProvider` のデフォルトは `false` (オプトイン) です。
- API キーは `ELEVENLABS_API_KEY`/`XI_API_KEY` および `OPENAI_API_KEY` にフォールバックします。
- `openai.baseUrl` は OpenAI TTS エンドポイントをオーバーライドします。解決順序は、config、次に `OPENAI_TTS_BASE_URL`、次に `https://api.openai.com/v1` です。
- `openai.baseUrl` が非 OpenAI エンドポイントを指している場合、OpenClaw はそれを OpenAI 互換の TTS サーバーとして扱い、モデル/音声の検証を緩和します。

---

## 話す

トーク モードのデフォルト (macOS/iOS/Android)。

````json5
{
  talk: {
    voiceId: "elevenlabs_voice_id",
    voiceAliases: {
      Clawd: "EXAVITQu4vr4xnSDxMaL",
      Roger: "CwhRBWXzGAHq8TQ4Fs17",
    },
    modelId: "eleven_v3",
    outputFormat: "mp3_44100_128",
    apiKey: "elevenlabs_api_key",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```- 音声 ID は `ELEVENLABS_VOICE_ID` または `SAG_VOICE_ID` にフォールバックします。
- `apiKey` および `providers.*.apiKey` は、プレーンテキスト文字列または SecretRef オブジェクトを受け入れます。
- `ELEVENLABS_API_KEY` フォールバックは、Talk API キーが設定されていない場合にのみ適用されます。
- `voiceAliases` により、Talk ディレクティブにフレンドリ名を使用できるようになります。
- `silenceTimeoutMs` は、ユーザーが沈黙した後、トランスクリプトを送信するまでトーク モードが待機する時間を制御します。設定を解除すると、プラットフォームのデフォルトの一時停止ウィンドウ (`700 ms on macOS and Android, 900 ms on iOS`) が維持されます。

---

## ツール

### 工具プロファイル

`tools.profile` は、`tools.allow`/`tools.deny` の前に基本ホワイトリストを設定します。

ローカル オンボーディングは、設定を解除すると、新しいローカル構成をデフォルトで `tools.profile: "coding"` に設定します (既存の明示的なプロファイルは保持されます)。

|プロフィール |含まれるもの |
| ----------- | ----------------------------------------------------------------------------------------- |
| `minimal` | `session_status` のみ |
| `coding` | `group:fs`、`group:runtime`、`group:sessions`、`group:memory`、`image` |
| `messaging` | `group:messaging`、`sessions_list`、`sessions_history`、`sessions_send`、`session_status` |
| `full` |制限なし（未設定と同じ） |### ツールグループ|グループ |ツール |
| ------------------ | -------------------------------------------------------------------------------------- |
| `group:runtime` | `exec`、`process` (`bash` は `exec` のエイリアスとして受け入れられます)
| `group:fs` | `read`、`write`、`edit`、`apply_patch` |
| `group:sessions` | `sessions_list`、`sessions_history`、`sessions_send`、`sessions_spawn`、`session_status` |
| `group:memory` | `memory_search`、`memory_get` |
| `group:web` | `web_search`、`web_fetch` |
| `group:ui` | `browser`、`canvas` |
| `group:automation` | `cron`、`gateway` |
| `group:messaging` | `message` || `group:nodes` | `nodes` |
| `group:openclaw` |すべての組み込みツール (プロバイダー プラグインを除く) |

### `tools.allow` / `tools.deny`

グローバル ツールの許可/拒否ポリシー (拒否の勝利)。大文字と小文字は区別されず、`*` ワイルドカードをサポートします。 Docker サンドボックスがオフの場合でも適用されます。

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
````

### `tools.byProvider`

特定のプロバイダーまたはモデル用のツールをさらに制限します。順序: 基本プロファイル → プロバイダー プロファイル → 許可/拒否。

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
      "openai/gpt-5.2": { allow: ["group:fs", "sessions_list"] },
    },
  },
}
```

### `tools.elevated`

昇格された (ホスト) 実行アクセスを制御します。

```json5
{
  tools: {
    elevated: {
      enabled: true,
      allowFrom: {
        whatsapp: ["+15555550123"],
        discord: ["1234567890123", "987654321098765432"],
      },
    },
  },
}
```

- エージェントごとのオーバーライド (`agents.list[].tools.elevated`) は、さらに制限することしかできません。
- `/elevated on|off|ask|full` はセッションごとの状態を保存します。インラインディレクティブは単一のメッセージに適用されます。
- 昇格された `exec` がホスト上で実行され、サンドボックスがバイパスされます。

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.2"],
      },
    },
  },
}
```

### `tools.loopDetection`

ツールループの安全性チェックは **デフォルトでは無効になっています**。 `enabled: true` を設定して検出を有効にします。
設定は `tools.loopDetection` でグローバルに定義でき、`agents.list[].tools.loopDetection` でエージェントごとに上書きできます。

````json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```- `historySize`: ループ解析のために保持される最大ツール呼び出し履歴。
- `warningThreshold`: 警告に対する進行なしパターンのしきい値を繰り返します。
- `criticalThreshold`: クリティカルなループをブロックするためのより高い繰り返ししきい値。
- `globalCircuitBreakerThreshold`: 進行状況のない実行に対するハードストップのしきい値。
- `detectors.genericRepeat`: 同じツール/同じ引数の繰り返し呼び出しを警告します。
- `detectors.knownPollNoProgress`: 既知の投票ツール (`process.poll`、`command_status` など) に対して警告/ブロックします。
- `detectors.pingPong`: 交互に進行しないペアのパターンを警告/ブロックします。
- `warningThreshold >= criticalThreshold` または `criticalThreshold >= globalCircuitBreakerThreshold` の場合、検証は失敗します。

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // or BRAVE_API_KEY env
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        maxChars: 50000,
        maxCharsCap: 50000,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        userAgent: "custom-ua",
      },
    },
  },
}
````

### `tools.media`

インバウンドメディア理解 (画像/音声/ビデオ) を構成します。

```json5
{
  tools: {
    media: {
      concurrency: 2,
      audio: {
        enabled: true,
        maxBytes: 20971520,
        scope: {
          default: "deny",
          rules: [{ action: "allow", match: { chatType: "direct" } }],
        },
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          { type: "cli", command: "whisper", args: ["--model", "base", "{{MediaPath}}"] },
        ],
      },
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },
}
```

<Accordion title="メディアモデル入力フィールド">

**プロバイダーエントリ** (`type: "provider"` または省略):

- `provider`: API プロバイダー ID (`openai`、`anthropic`、`google`/`gemini`、`groq` など)
- `model`: モデル ID の上書き
- `profile` / `preferredProfile`: `auth-profiles.json` プロファイルの選択

**CLI エントリ** (`type: "cli"`):

- `command`: 実行する実行可能ファイル
- `args`: テンプレート化された引数 (`{{MediaPath}}`、`{{Prompt}}`、`{{MaxChars}}` などをサポート)

**共通フィールド:**- `capabilities`: オプションのリスト (`image`、`audio`、`video`)。デフォルト: `openai`/`anthropic`/`minimax` → 画像、`google` → 画像+音声+ビデオ、`groq` → 音声。

- `prompt`、`maxChars`、`maxBytes`、`timeoutSeconds`、`language`: エントリごとの上書き。
- 失敗は次のエントリにフォールバックします。

プロバイダー認証は標準の順序に従います: `auth-profiles.json` → 環境変数 → `models.providers.*.apiKey`。

</Accordion>

### `tools.agentToAgent`

```json5
{
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },
}
```

### `tools.sessions`

セッション ツール (`sessions_list`、`sessions_history`、`sessions_send`) の対象にできるセッションを制御します。

デフォルト: `tree` (現在のセッション + それによって生成されたセッション (サブエージェントなど))。

```json5
{
  tools: {
    sessions: {
      // "self" | "tree" | "agent" | "all"
      visibility: "tree",
    },
  },
}
```

注:

- `self`: 現在のセッション キーのみ。
- `tree`: 現在のセッション + 現在のセッションによって生成されたセッション (サブエージェント)。
- `agent`: 現在のエージェント ID に属する任意のセッション (同じエージェント ID で送信者ごとのセッションを実行する場合は、他のユーザーを含めることができます)。
- `all`: 任意のセッション。クロスエージェントターゲティングには引き続き `tools.agentToAgent` が必要です。
- サンドボックス クランプ: 現在のセッションがサンドボックス化されており、`agents.defaults.sandbox.sessionToolsVisibility="spawned"` である場合、`tools.sessions.visibility="all"` であっても、可視性は強制的に `tree` に設定されます。

### `tools.sessions_spawn`

`sessions_spawn` のインライン添付ファイルのサポートを制御します。

````json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // opt-in: set true to allow inline file attachments
        maxTotalBytes: 5242880, // 5 MB total across all files
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB per file
        retainOnSessionKeep: false, // keep attachments when cleanup="keep"
      },
    },
  },
}
```注:

- 添付ファイルは `runtime: "subagent"` でのみサポートされます。 ACP ランタイムはそれらを拒否します。
- ファイルは、`.manifest.json` を使用して、`.openclaw/attachments/<uuid>/` の子ワークスペースに実体化されます。
- 添付ファイルのコンテンツは、トランスクリプトの永続性から自動的に編集されます。
- Base64 入力は、厳密なアルファベット/パディング チェックとプリデコード サイズ ガードによって検証されます。
- ファイル権限は、ディレクトリの場合は `0700`、ファイルの場合は `0600` です。
- クリーンアップは `cleanup` ポリシーに従います。 `delete` は常に添付ファイルを削除します。 `keep` は、`retainOnSessionKeep: true` の場合にのみそれらを保持します。

### `tools.subagents`

```json5
{
  agents: {
    defaults: {
      subagents: {
        model: "minimax/MiniMax-M2.5",
        maxConcurrent: 1,
        runTimeoutSeconds: 900,
        archiveAfterMinutes: 60,
      },
    },
  },
}
````

- `model`: 生成されたサブエージェントのデフォルト モデル。省略した場合、サブエージェントは呼び出し元のモデルを継承します。
- `runTimeoutSeconds`: ツール呼び出しで `runTimeoutSeconds` が省略された場合の `sessions_spawn` のデフォルトのタイムアウト (秒)。 `0` はタイムアウトがないことを意味します。
- サブエージェントごとのツール ポリシー: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`。

---

## カスタムプロバイダーとベース URL

OpenClaw は、pi-coding-agent モデル カタログを使用します。構成内の `models.providers` または `~/.openclaw/agents/<agentId>/agent/models.json` を介してカスタム プロバイダーを追加します。

````json5
{
  models: {
    mode: "merge", // merge (default) | replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai
        models: [
          {
            id: "llama-3.1-8b",
            name: "Llama 3.1 8B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```- カスタム認証が必要な場合は、`authHeader: true` + `headers` を使用します。
- エージェント設定ルートを `OPENCLAW_AGENT_DIR` (または `PI_CODING_AGENT_DIR`) でオーバーライドします。
- 一致するプロバイダー ID のマージの優先順位:
  - 空ではないエージェント `models.json` `baseUrl` 値が優先されます。
  - 空ではないエージェント `apiKey` 値は、そのプロバイダーが現在の構成/認証プロファイル コンテキストで SecretRef で管理されていない場合にのみ優先されます。
  - SecretRef 管理プロバイダーの `apiKey` 値は、解決されたシークレットを保持するのではなく、ソース マーカー (環境参照の場合は `ENV_VAR_NAME`、ファイル/実行参照の場合は `secretref-managed`) から更新されます。
  - 空または欠落しているエージェント `apiKey`/`baseUrl` は、構成内の `models.providers` にフォールバックします。
  - マッチングモデル `contextWindow`/`maxTokens` は、明示的な構成値と暗黙的なカタログ値の間の高い値を使用します。
  - 構成で `models.json` を完全に書き換える場合は、`models.mode: "replace"` を使用します。

### プロバイダーフィールドの詳細- `models.mode`: プロバイダー カタログの動作 (`merge` または `replace`)。
- `models.providers`: プロバイダー ID をキーとするカスタム プロバイダー マップ。
- `models.providers.*.api`: アダプターを要求します (`openai-completions`、`openai-responses`、`anthropic-messages`、`google-generative-ai` など)。
- `models.providers.*.apiKey`: プロバイダーの資格情報 (SecretRef/env 置換を推奨)。
- `models.providers.*.auth`: 認証戦略 (`api-key`、`token`、`oauth`、`aws-sdk`)。
- `models.providers.*.injectNumCtxForOpenAICompat`: Ollama + `openai-completions` の場合、`options.num_ctx` をリクエストに挿入します (デフォルト: `true`)。
- `models.providers.*.authHeader`: 必要に応じて、`Authorization` ヘッダーで資格情報のトランスポートを強制します。
- `models.providers.*.baseUrl`: アップストリーム API ベース URL。
- `models.providers.*.headers`: プロキシ/テナント ルーティング用の追加の静的ヘッダー。
- `models.providers.*.models`: 明示的なプロバイダー モデル カタログ エントリ。
- `models.providers.*.models.*.compat.supportsDeveloperRole`: オプションの互換性ヒント。空ではない非ネイティブ `baseUrl` (`api.openai.com` ではないホスト) を持つ `api: "openai-completions"` の場合、OpenClaw は実行時にこれを強制的に `false` に設定します。空または省略された `baseUrl` は、デフォルトの OpenAI 動作を維持します。
- `models.bedrockDiscovery`: Bedrock 自動検出設定のルート。
- `models.bedrockDiscovery.enabled`: 検出ポーリングをオン/オフにします。
- `models.bedrockDiscovery.region`: 検出用の AWS リージョン。
- `models.bedrockDiscovery.providerFilter`: ターゲットを絞った検出のためのオプションのプロバイダー ID フィルター。
- `models.bedrockDiscovery.refreshInterval`: 検出更新のポーリング間隔。- `models.bedrockDiscovery.defaultContextWindow`: 検出されたモデルのフォールバック コンテキスト ウィンドウ。
- `models.bedrockDiscovery.defaultMaxTokens`: 検出されたモデルのフォールバック最大出力トークン。

### プロバイダーの例

<Accordion title="Cerebras (GLM 4.6 / 4.7)">

```json5
{
  env: { CEREBRAS_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: {
        primary: "cerebras/zai-glm-4.7",
        fallbacks: ["cerebras/zai-glm-4.6"],
      },
      models: {
        "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
        "cerebras/zai-glm-4.6": { alias: "GLM 4.6 (Cerebras)" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      cerebras: {
        baseUrl: "https://api.cerebras.ai/v1",
        apiKey: "${CEREBRAS_API_KEY}",
        api: "openai-completions",
        models: [
          { id: "zai-glm-4.7", name: "GLM 4.7 (Cerebras)" },
          { id: "zai-glm-4.6", name: "GLM 4.6 (Cerebras)" },
        ],
      },
    },
  },
}
````

大脳には `cerebras/zai-glm-4.7` を使用します。 Z.AI ダイレクトの `zai/glm-4.7`。

</Accordion>

<Accordion title="OpenCode Zen">

```json5
{
  agents: {
    defaults: {
      model: { primary: "opencode/claude-opus-4-6" },
      models: { "opencode/claude-opus-4-6": { alias: "Opus" } },
    },
  },
}
```

`OPENCODE_API_KEY` (または `OPENCODE_ZEN_API_KEY`) を設定します。ショートカット: `openclaw onboard --auth-choice opencode-zen`。

</Accordion>

<Accordion title="Z.AI（GLM-4.7）">

```json5
{
  agents: {
    defaults: {
      model: { primary: "zai/glm-4.7" },
      models: { "zai/glm-4.7": {} },
    },
  },
}
```

`ZAI_API_KEY` を設定します。 `z.ai/*` および `z-ai/*` は別名として受け入れられます。ショートカット: `openclaw onboard --auth-choice zai-api-key`。

- 一般エンドポイント: `https://api.z.ai/api/paas/v4`
- コーディングエンドポイント (デフォルト): `https://api.z.ai/api/coding/paas/v4`
- 一般的なエンドポイントの場合、ベース URL オーバーライドを使用してカスタム プロバイダーを定義します。

</Accordion>

<Accordion title="ムーンショットAI（キミ）">

```json5
{
  env: { MOONSHOT_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "moonshot/kimi-k2.5" },
      models: { "moonshot/kimi-k2.5": { alias: "Kimi K2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "kimi-k2.5",
            name: "Kimi K2.5",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 256000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

中国エンドポイントの場合: `baseUrl: "https://api.moonshot.cn/v1"` または `openclaw onboard --auth-choice moonshot-api-key-cn`。

</Accordion>

<Accordion title="キミコーディング">

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "kimi-coding/k2p5" },
      models: { "kimi-coding/k2p5": { alias: "Kimi K2.5" } },
    },
  },
}
```

Anthropic 互換の組み込みプロバイダー。ショートカット: `openclaw onboard --auth-choice kimi-code-api-key`。

</Accordion>

<Accordion title="合成 (人為的互換性)">

```json5
{
  env: { SYNTHETIC_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
      models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "hf:MiniMaxAI/MiniMax-M2.5",
            name: "MiniMax M2.5",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 192000,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

ベース URL は `/v1` を省略する必要があります (Anthropic クライアントが追加します)。ショートカット: `openclaw onboard --auth-choice synthetic-api-key`。

</Accordion>

<Accordion title="MiniMax M2.5 (直接)">

```json5
{
  agents: {
    defaults: {
      model: { primary: "minimax/MiniMax-M2.5" },
      models: {
        "minimax/MiniMax-M2.5": { alias: "Minimax" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      minimax: {
        baseUrl: "https://api.minimax.io/anthropic",
        apiKey: "${MINIMAX_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "MiniMax-M2.5",
            name: "MiniMax M2.5",
            reasoning: false,
            input: ["text"],
            cost: { input: 15, output: 60, cacheRead: 2, cacheWrite: 10 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

`MINIMAX_API_KEY` を設定します。ショートカット: `openclaw onboard --auth-choice minimax-api`。

</Accordion>

<Accordion title="ローカルモデル (LM Studio)">[ローカル モデル](/gateway/local-models) を参照してください。 TL;DR: 本格的なハードウェアで LM Studio Response API 経由で MiniMax M2.5 を実行します。フォールバックのためにホストされたモデルをマージしたままにします。

</Accordion>

---

## スキル

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn
    },
    entries: {
      "nano-banana-pro": {
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: バンドルされたスキルのみのオプションの許可リスト (管理/ワークスペース スキルは影響を受けません)。
- `entries.<skillKey>.enabled: false` は、バンドル/インストールされている場合でもスキルを無効にします。
- `entries.<skillKey>.apiKey`: プライマリ環境変数 (プレーンテキスト文字列または SecretRef オブジェクト) を宣言するスキルの利便性。

---

## プラグイン

````json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: [],
    load: {
      paths: ["~/Projects/oss/voice-call-extension"],
    },
    entries: {
      "voice-call": {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
        config: { provider: "twilio" },
      },
    },
  },
}
```- `~/.openclaw/extensions`、`<workspace>/.openclaw/extensions`、および `plugins.load.paths` からロードされます。
- **構成を変更するにはゲートウェイの再起動が必要です。**
- `allow`: オプションの許可リスト (リストされたプラグインのみがロードされます)。 `deny` が勝ちます。
- `plugins.entries.<id>.apiKey`: プラグインレベルの API キー便利フィールド (プラグインでサポートされている場合)。
- `plugins.entries.<id>.env`: プラグインスコープの環境変数マップ。
- `plugins.entries.<id>.hooks.allowPromptInjection`: `false` の場合、コアは `before_prompt_build` をブロックし、レガシー `before_agent_start` からのプロンプト変更フィールドを無視しますが、レガシー `modelOverride` および `providerOverride` は保持します。
- `plugins.entries.<id>.config`: プラグイン定義の設定オブジェクト (プラグイン スキーマによって検証される)。
- `plugins.slots.memory`: アクティブなメモリ プラグイン ID を選択するか、メモリ プラグインを無効にする場合は `"none"` を選択します。
- `plugins.slots.contextEngine`: アクティブなコンテキスト エンジン プラグイン ID を選択します。別のエンジンをインストールして選択しない限り、デフォルトは `"legacy"` になります。
- `plugins.installs`: `openclaw plugins update` によって使用される CLI 管理のインストール メタデータ。
  - `source`、`spec`、`sourcePath`、`installPath`、`version`、`resolvedName`、`resolvedVersion`、 `resolvedSpec`、`integrity`、`shasum`、`resolvedAt`、`installedAt`。
  - `plugins.installs.*` を管理対象状態として扱います。手動編集よりも CLI コマンドを優先します。

[プラグイン](/tools/plugin) を参照してください。

---

## ブラウザ

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "chrome",
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: true, // default trusted-network mode
      // allowPrivateNetwork: true, // legacy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
    color: "#FF4500",
    // headless: false,
    // noSandbox: false,
    // extraArgs: [],
    // relayBindHost: "0.0.0.0", // only when the extension relay must be reachable across namespaces (for example WSL2)
    // executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    // attachOnly: false,
  },
}
```- `evaluateEnabled: false` は、`act:evaluate` および `wait --fn` を無効にします。
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` は、未設定の場合はデフォルトで `true` になります (信頼されたネットワーク モデル)。
- `ssrfPolicy.dangerouslyAllowPrivateNetwork: false` を設定して、厳密なパブリックのみのブラウザ ナビゲーションを実現します。
- `ssrfPolicy.allowPrivateNetwork` はレガシー エイリアスとして引き続きサポートされます。
- 厳密モードでは、明示的な例外に `ssrfPolicy.hostnameAllowlist` および `ssrfPolicy.allowedHostnames` を使用します。
- リモート プロファイルは接続専用です (開始/停止/リセットは無効)。
- 自動検出順序: Chromium ベースの場合はデフォルトのブラウザ → Chrome → Brave → Edge → Chromium → Chrome Canary。
- 制御サービス: ループバックのみ (ポートは `gateway.port` から派生、デフォルトは `18791`)。
- `extraArgs` は、ローカルの Chromium 起動に追加の起動フラグを追加します (たとえば、
  `--disable-gpu`、ウィンドウ サイズ、またはデバッグ フラグ)。
- `relayBindHost` は、Chrome 拡張機能リレーがリッスンする場所を変更します。ループバックのみのアクセスの場合は未設定のままにしておきます。 `0.0.0.0` などの明示的な非ループバック バインド アドレスは、リレーが名前空間の境界 (WSL2 など) を越える必要があり、ホスト ネットワークがすでに信頼されている場合にのみ設定します。

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, short text, image URL, or data URI
    },
  },
}
````

- `seamColor`: ネイティブ アプリ UI クロムのアクセント カラー (トーク モードのバブルの色合いなど)。
- `assistant`: UI ID オーバーライドを制御します。アクティブなエージェント ID にフォールバックします。

---

## ゲートウェイ

```json5
{
  gateway: {
    mode: "local", // local | remote
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token", // none | token | password | trusted-proxy
      token: "your-token",
      // password: "your-password", // or OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // for mode=trusted-proxy; see /gateway/trusted-proxy-auth
      allowTailscale: true,
      rateLimit: {
        maxAttempts: 10,
        windowMs: 60000,
        lockoutMs: 300000,
        exemptLoopback: true,
      },
    },
    tailscale: {
      mode: "off", // off | serve | funnel
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // allowedOrigins: ["https://control.example.com"], // required for non-loopback Control UI
      // dangerouslyAllowHostHeaderOriginFallback: false, // dangerous Host-header origin fallback mode
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    remote: {
      url: "ws://gateway.tailnet:18789",
      transport: "ssh", // ssh | direct
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // Optional. Default false.
    allowRealIpFallback: false,
    tools: {
      // Additional /tools/invoke HTTP denies
      deny: ["browser"],
      // Remove tools from the default HTTP deny list
      allow: ["gateway"],
    },
  },
}
```

<Accordion title="ゲートウェイフィールドの詳細">- `mode`: `local` (ゲートウェイを実行) または `remote` (リモート ゲートウェイに接続)。 `local` を除き、ゲートウェイは起動を拒否します。

- `port`: WS + HTTP 用の単一の多重化ポート。優先順位: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`。
- `bind`: `auto`、`loopback` (デフォルト)、`lan` (`0.0.0.0`)、`tailnet` (Tailscale IP のみ)、または`custom`。
- **レガシー バインド エイリアス**: ホスト エイリアスではなく、`gateway.bind` (`auto`、`loopback`、`lan`、`tailnet`、`custom`) のバインド モード値を使用します。 (`0.0.0.0`、`127.0.0.1`、`localhost`、`::`、`::1`)。
- **Docker 注**: デフォルトの `loopback` バインドは、コンテナー内の `127.0.0.1` をリッスンします。 Docker ブリッジ ネットワーキング (`-p 18789:18789`) では、トラフィックは `eth0` に到着するため、ゲートウェイに到達できません。すべてのインターフェイスでリッスンするには、`--network host` を使用するか、`bind: "lan"` (または `bind: "custom"` と `customBindHost: "0.0.0.0"`) を設定します。
- **認証**: デフォルトで必須。非ループバック バインドには共有トークン/パスワードが必要です。オンボーディング ウィザードはデフォルトでトークンを生成します。- `gateway.auth.token` と `gateway.auth.password` の両方が構成されている場合 (SecretRef を含む)、`gateway.auth.mode` を明示的に `token` または `password` に設定します。起動とサービスのインストール/修復フローの両方が構成され、モードが設定されていない場合、失敗します。
- `gateway.auth.mode: "none"`: 明示的な非認証モード。信頼できるローカル ループバック設定にのみ使用してください。これはオンボーディング プロンプトでは意図的に提供されません。
- `gateway.auth.mode: "trusted-proxy"`: ID 対応リバース プロキシに認証を委任し、`gateway.trustedProxies` からの ID ヘッダーを信頼します ([信頼されたプロキシ認証](/gateway/trusted-proxy-auth) を参照)。
- `gateway.auth.allowTailscale`: `true` の場合、Tailscale Serve ID ヘッダーはコントロール UI/WebSocket 認証を満たすことができます (`tailscale whois` で検証)。 HTTP API エンドポイントでは依然としてトークン/パスワード認証が必要です。このトークンレス フローは、ゲートウェイ ホストが信頼できることを前提としています。 `tailscale.mode = "serve"` の場合、デフォルトは `true` になります。
- `gateway.auth.rateLimit`: オプションの認証失敗リミッター。クライアント IP ごとおよび認証スコープごとに適用されます (共有シークレットとデバイス トークンは個別に追跡されます)。ブロックされた試行は `429` + `Retry-After` を返します。
  - `gateway.auth.rateLimit.exemptLoopback` のデフォルトは `true` です。 localhost のトラフィック レートも意図的に制限したい場合は、`false` を設定します (テスト セットアップまたは厳密なプロキシ展開の場合)。- ブラウザー オリジンの WS 認証試行は、ループバック除外が無効になっている状態で常に抑制されます (ブラウザー ベースのローカルホスト ブルート フォースに対する多層防御)。
- `tailscale.mode`: `serve` (テールネットのみ、ループバック バインド) または `funnel` (パブリック、認証が必要)。
- `controlUi.allowedOrigins`: ゲートウェイ WebSocket 接続用の明示的なブラウザー起点許可リスト。ブラウザクライアントが非ループバックオリジンからのものであることが予期される場合に必要です。
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: ホスト ヘッダー オリジン ポリシーに意図的に依存する展開でホスト ヘッダー オリジン フォールバックを有効にする危険なモード。
- `remote.transport`: `ssh` (デフォルト) または `direct` (ws/wss)。 `direct` の場合、`remote.url` は `ws://` または `wss://` である必要があります。
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: 信頼されたプライベート ネットワーク IP へのプレーンテキスト `ws://` を許可するクライアント側のブレークグラス オーバーライド。デフォルトでは平文の場合はループバックのみになります。
- `gateway.remote.token` / `.password` は、リモート クライアントの資格情報フィールドです。ゲートウェイ認証を独自に構成することはありません。
- `gateway.auth.*` が設定されていない場合、ローカル ゲートウェイの呼び出しパスはフォールバックとして `gateway.remote.*` を使用できます。
- `trustedProxies`: TLS を終了するリバース プロキシ IP。自分が制御するプロキシのみをリストします。
- `allowRealIpFallback`: `true` の場合、`X-Forwarded-For` が欠落している場合、ゲートウェイは `X-Real-IP` を受け入れます。フェールクローズ動作のデフォルト `false`。- `gateway.tools.deny`: HTTP `POST /tools/invoke` に対して追加のツール名がブロックされました (デフォルトの拒否リストを拡張します)。
- `gateway.tools.allow`: デフォルトの HTTP 拒否リストからツール名を削除します。

</Accordion>

### OpenAI 互換エンドポイント

- チャット完了: デフォルトでは無効になっています。 `gateway.http.endpoints.chatCompletions.enabled: true` で有効にします。
- 応答 API: `gateway.http.endpoints.responses.enabled`。
- 応答 URL 入力の強化:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
- オプションの応答強化ヘッダー:
  - `gateway.http.securityHeaders.strictTransportSecurity` (制御する HTTPS オリジンに対してのみ設定します。[信頼されたプロキシ認証](/gateway/trusted-proxy-auth#tls-termination-and-hsts) を参照)

### マルチインスタンスの分離

一意のポートと状態ディレクトリを使用して、1 つのホスト上で複数のゲートウェイを実行します。

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

便利なフラグ: `--dev` (`~/.openclaw-dev` + ポート `19001` を使用)、`--profile <name>` (`~/.openclaw-<name>` を使用)。

[複数のゲートウェイ](/gateway/multiple-gateways) を参照してください。

---

## フック

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    maxBodyBytes: 262144,
    defaultSessionKey: "hook:ingress",
    allowRequestSessionKey: false,
    allowedSessionKeyPrefixes: ["hook:"],
    allowedAgentIds: ["hooks", "main"],
    presets: ["gmail"],
    transformsDir: "~/.openclaw/hooks/transforms",
    mappings: [
      {
        match: { path: "gmail" },
        action: "agent",
        agentId: "hooks",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate: "From: {{messages[0].from}}\nSubject: {{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.2-mini",
      },
    ],
  },
}
```

認証: `Authorization: Bearer <token>` または `x-openclaw-token: <token>`。

**エンドポイント:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - リクエスト ペイロードの `sessionKey` は、`hooks.allowRequestSessionKey=true` (デフォルト: `false`) の場合にのみ受け入れられます。
- `POST /hooks/<name>` → `hooks.mappings` によって解決されました

<Accordion title="マッピングの詳細">- `match.path` は、`/hooks` の後のサブパスと一致します (例: `/hooks/gmail` → `gmail`)。

- `match.source` は、汎用パスのペイロード フィールドと一致します。
- `{{messages[0].subject}}` のようなテンプレートはペイロードから読み取られます。
- `transform` は、フック アクションを返す JS/TS モジュールを指すことができます。
  - `transform.module` は相対パスであり、`hooks.transformsDir` 内に収まる必要があります (絶対パスとトラバースは拒否されます)。
- `agentId` は特定のエージェントにルーティングします。不明な ID はデフォルトに戻ります。
- `allowedAgentIds`: 明示的なルーティングを制限します (`*` または省略 = すべて許可、`[]` = すべて拒否)。
- `defaultSessionKey`: フック エージェントのオプションの固定セッション キーは、明示的な `sessionKey` なしで実行されます。
- `allowRequestSessionKey`: `/hooks/agent` 呼び出し元が `sessionKey` を設定できるようにします (デフォルト: `false`)。
- `allowedSessionKeyPrefixes`: 明示的な `sessionKey` 値 (リクエスト + マッピング) のオプションのプレフィックス許可リスト。 `["hook:"]`。
- `deliver: true` はチャネルに最終応答を送信します。 `channel` のデフォルトは `last` です。
- `model` は、このフック実行の LLM をオーバーライドします (モデル カタログが設定されている場合は許可する必要があります)。

</Accordion>

### Gmail の統合

```json5
{
  hooks: {
    gmail: {
      account: "openclaw@gmail.com",
      topic: "projects/<project-id>/topics/gog-gmail-watch",
      subscription: "gog-gmail-watch-push",
      pushToken: "shared-push-token",
      hookUrl: "http://127.0.0.1:18789/hooks/gmail",
      includeBody: true,
      maxBytes: 20000,
      renewEveryMinutes: 720,
      serve: { bind: "127.0.0.1", port: 8788, path: "/" },
      tailscale: { mode: "funnel", path: "/gmail-pubsub" },
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

- 構成されている場合、ゲートウェイは起動時に `gog gmail watch serve` を自動起動します。 `OPENCLAW_SKIP_GMAIL_WATCHER=1` を無効に設定します。
- ゲートウェイと一緒に別の `gog gmail watch serve` を実行しないでください。

---

## キャンバスホスト

```json5

{
canvasHost: {
root: "~/.openclaw/workspace/canvas",
liveReload: true,
// enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
},
}

````

- エージェントが編集可能な HTML/CSS/JS および A2UI をゲートウェイ ポートで HTTP 経由で提供します。
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- ローカルのみ: `gateway.bind: "loopback"` (デフォルト) を維持します。
- 非ループバック バインド: キャンバス ルートには、他のゲートウェイ HTTP サーフェスと同様に、ゲートウェイ認証 (トークン/パスワード/信頼できるプロキシ) が必要です。
- ノード WebView は通常、認証ヘッダーを送信しません。ノードがペアリングされて接続されると、ゲートウェイはキャンバス/A2UI アクセス用にノード スコープの機能 URL をアドバタイズします。
- 機能 URL はアクティブ ノード WS セッションにバインドされており、すぐに期限切れになります。 IP ベースのフォールバックは使用されません。
- ライブリロードクライアントを提供される HTML に挿入します。
- 空の場合、スターター `index.html` を自動作成します。
- `/__openclaw__/a2ui/` で A2UI も提供します。
- 変更にはゲートウェイの再起動が必要です。
- 大きなディレクトリまたは `EMFILE` エラーのライブ リロードを無効にします。

---

## 発見

### mDNS (ボンジュール)

```json5
{
  discovery: {
    mdns: {
      mode: "minimal", // minimal | full | off
    },
  },
}
````

- `minimal` (デフォルト): TXT レコードから `cliPath` + `sshPort` を省略します。
- `full`: `cliPath` + `sshPort` を含みます。
- ホスト名のデフォルトは `openclaw` です。 `OPENCLAW_MDNS_HOSTNAME` でオーバーライドします。

### 広域 (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

ユニキャスト DNS-SD ゾーンを `~/.openclaw/dns/` に書き込みます。クロスネットワーク検出の場合は、DNS サーバー (CoreDNS 推奨) + Tailscale Split DNS とペアリングします。

セットアップ: `openclaw dns setup --apply`。

---

## 環境

### `env` (インライン環境変数)```json5

{
env: {
OPENROUTER_API_KEY: "sk-or-...",
vars: {
GROQ_API_KEY: "gsk-...",
},
shellEnv: {
enabled: true,
timeoutMs: 15000,
},
},
}

````

- インライン環境変数は、プロセス環境にキーがない場合にのみ適用されます。
- `.env` ファイル: CWD `.env` + `~/.openclaw/.env` (どちらも既存の変数をオーバーライドしません)。
- `shellEnv`: ログイン シェル プロファイルから不足している予期されたキーをインポートします。
- 完全な優先順位については、[環境](/help/environment) を参照してください。

### 環境変数の置換

`${VAR_NAME}` を使用して、構成文字列内の環境変数を参照します。

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
````

- 大文字の名前のみが一致しました: `[A-Z_][A-Z0-9_]*`。
- 変数が欠落しているか空であると、構成ロード時にエラーがスローされます。
- リテラル `${VAR}` の場合は、`${VAR}` でエスケープします。
- `$include` で動作します。

---

## 秘密

Secret ref は追加的です。プレーンテキストの値は引き続き機能します。

### `SecretRef`

1 つのオブジェクト シェイプを使用します。

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

検証:

- `provider` パターン: `^[a-z][a-z0-9_-]{0,63}# 構成リファレンス

`~/.openclaw/openclaw.json` で使用可能なすべてのフィールド。タスク指向の概要については、「[構成](/gateway/configuration)」を参照してください。

構成形式は **JSON5** (コメント + 末尾のカンマは許可されます) です。すべてのフィールドはオプションです。省略された場合、OpenClaw は安全なデフォルトを使用します。

---

## チャンネル

各チャネルは、その構成セクションが存在すると自動的に開始されます (`enabled: false` を除く)。

### DMとグループアクセス

すべてのチャネルは DM ポリシーとグループ ポリシーをサポートします。

| DMポリシー               | 行動                                                                                   |
| ------------------------ | -------------------------------------------------------------------------------------- | --- | ---------------- | ---- |
| `pairing` (デフォルト)   | 不明な送信者はワンタイムペアリングコードを受け取ります。所有者は承認する必要があります |
| `allowlist`              | `allowFrom` (またはペアの許可ストア) の送信者のみ                                      |
| `open`                   | すべての受信 DM を許可する (`allowFrom: ["*"]` が必要)                                 |
| `disabled`               | すべての受信 DM を無視する                                                             |     | グループポリシー | 行動 |
| ---------------------    | --------------------------------------------------------                               |
| `allowlist` (デフォルト) | 設定された許可リストに一致するグループのみ                                             |
| `open`                   | グループ許可リストをバイパスします (メンションゲートは引き続き適用されます)。          |
| `disabled`               | すべてのグループ/ルーム メッセージをブロックする                                       |

<Note>
`channels.defaults.groupPolicy` は、プロバイダーの `groupPolicy` が設定されていない場合のデフォルトを設定します。
ペアリング コードは 1 時間後に期限切れになります。保留中の DM ペアリング要求の上限は、**チャネルあたり 3** です。
プロバイダー ブロックが完全に欠落している (`channels.<provider>` が欠落している) 場合、ランタイム グループ ポリシーは起動警告とともに `allowlist` (フェールクローズ) にフォールバックします。
</Note>

### チャネルモデルのオーバーライド

`channels.modelByChannel` を使用して、特定のチャネル ID をモデルに固定します。値は `provider/model` または構成されたモデルのエイリアスを受け入れます。チャネル マッピングは、セッションにモデル オーバーライドがまだない場合 (たとえば、`/model` によって設定されている場合) に適用されます。

```json5
{
  channels: {
    modelByChannel: {
      discord: {
        "123456789012345678": "anthropic/claude-opus-4-6",
      },
      slack: {
        C1234567890: "openai/gpt-4.1",
      },
      telegram: {
        "-1001234567890": "openai/gpt-4.1-mini",
        "-1001234567890:topic:99": "anthropic/claude-sonnet-4-6",
      },
    },
  },
}
```

### チャネルのデフォルトとハートビート

プロバイダー間で共有されるグループ ポリシーとハートビートの動作には、`channels.defaults` を使用します。

````json5
{
  channels: {
    defaults: {
      groupPolicy: "allowlist", // open | allowlist | disabled
      heartbeat: {
        showOk: false,
        showAlerts: true,
        useIndicator: true,
      },
    },
  },
}
```- `channels.defaults.groupPolicy`: プロバイダーレベルの `groupPolicy` が設定されていない場合のフォールバック グループ ポリシー。
- `channels.defaults.heartbeat.showOk`: ハートビート出力に正常なチャネルのステータスを含めます。
- `channels.defaults.heartbeat.showAlerts`: ハートビート出力に劣化/エラーステータスを含めます。
- `channels.defaults.heartbeat.useIndicator`: コンパクトなインジケーター スタイルのハートビート出力をレンダリングします。

### WhatsApp

WhatsApp は、ゲートウェイの Web チャネル (Baileys Web) を通じて実行されます。リンクされたセッションが存在する場合、自動的に開始されます。

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      chunkMode: "length", // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // blue ticks (false in self-chat mode)
      groups: {
        "*": { requireMention: true },
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
  web: {
    enabled: true,
    heartbeatSeconds: 60,
    reconnect: {
      initialMs: 2000,
      maxMs: 120000,
      factor: 1.4,
      jitter: 0.2,
      maxAttempts: 0,
    },
  },
}
````

<Accordion title="マルチアカウント WhatsApp">

```json5
{
  channels: {
    whatsapp: {
      accounts: {
        default: {},
        personal: {},
        biz: {
          // authDir: "~/.openclaw/credentials/whatsapp/biz",
        },
      },
    },
  },
}
```

- アウトバウンド コマンドは、デフォルトでアカウント `default` が存在する場合に使用されます。それ以外の場合は、最初に設定されたアカウント ID (ソート済み)。
- オプションの `channels.whatsapp.defaultAccount` は、構成されたアカウント ID と一致する場合にフォールバックのデフォルトのアカウント選択をオーバーライドします。
- 従来の単一アカウントの Baileys 認証ディレクトリは、`openclaw doctor` によって `whatsapp/default` に移行されます。
- アカウントごとの上書き: `channels.whatsapp.accounts.<id>.sendReadReceipts`、`channels.whatsapp.accounts.<id>.dmPolicy`、`channels.whatsapp.accounts.<id>.allowFrom`。

</Accordion>

### 電報

````json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "your-bot-token",
      dmPolicy: "pairing",
      allowFrom: ["tg:123456789"],
      groups: {
        "*": { requireMention: true },
        "-1001234567890": {
          allowFrom: ["@admin"],
          systemPrompt: "Keep answers brief.",
          topics: {
            "99": {
              requireMention: false,
              skills: ["search"],
              systemPrompt: "Stay on topic.",
            },
          },
        },
      },
      customCommands: [
        { command: "backup", description: "Git backup" },
        { command: "generate", description: "Create an image" },
      ],
      historyLimit: 50,
      replyToMode: "first", // off | first | all
      linkPreview: true,
      streaming: "partial", // off | partial | block | progress (default: off)
      actions: { reactions: true, sendMessage: true },
      reactionNotifications: "own", // off | own | all
      mediaMaxMb: 100,
      retry: {
        attempts: 3,
        minDelayMs: 400,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
      network: {
        autoSelectFamily: true,
        dnsResultOrder: "ipv4first",
      },
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook",
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook",
    },
  },
}
```- ボット トークン: `channels.telegram.botToken` または `channels.telegram.tokenFile`、`TELEGRAM_BOT_TOKEN` はデフォルト アカウントのフォールバックとして使用されます。
- オプションの `channels.telegram.defaultAccount` は、構成されたアカウント ID と一致する場合、デフォルトのアカウント選択をオーバーライドします。
- マルチアカウント設定 (2 つ以上のアカウント ID) では、明示的なデフォルト (`channels.telegram.defaultAccount` または `channels.telegram.accounts.default`) を設定して、フォールバック ルーティングを回避します。 `openclaw doctor` は、これが欠落しているか無効な場合に警告します。
- `configWrites: false` は、Telegram が開始する設定の書き込みをブロックします (スーパーグループ ID の移行、`/config set|unset`)。
- `type: "acp"` を含むトップレベルの `bindings[]` エントリは、フォーラム トピックの永続的な ACP バインディングを構成します (`match.peer.id` の正規の `chatId:topic:topicId` を使用します)。フィールド セマンティクスは [ACP エージェント](/tools/acp-agents#channel-specific-settings) で共有されます。
- Telegram ストリーム プレビューは `sendMessage` + `editMessageText` を使用します (ダイレクト チャットおよびグループ チャットで機能します)。
- 再試行ポリシー: [再試行ポリシー](/concepts/retry) を参照してください。

### 不和

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: "your-bot-token",
      mediaMaxMb: 8,
      allowBots: false,
      actions: {
        reactions: true,
        stickers: true,
        polls: true,
        permissions: true,
        messages: true,
        threads: true,
        pins: true,
        search: true,
        memberInfo: true,
        roleInfo: true,
        roles: false,
        channelInfo: true,
        voiceStatus: true,
        events: true,
        moderation: false,
      },
      replyToMode: "off", // off | first | all
      dmPolicy: "pairing",
      allowFrom: ["1234567890", "123456789012345678"],
      dm: { enabled: true, groupEnabled: false, groupChannels: ["openclaw-dm"] },
      guilds: {
        "123456789012345678": {
          slug: "friends-of-openclaw",
          requireMention: false,
          ignoreOtherMentions: true,
          reactionNotifications: "own",
          users: ["987654321098765432"],
          channels: {
            general: { allow: true },
            help: {
              allow: true,
              requireMention: true,
              users: ["987654321098765432"],
              skills: ["docs"],
              systemPrompt: "Short answers only.",
            },
          },
        },
      },
      historyLimit: 20,
      textChunkLimit: 2000,
      chunkMode: "length", // length | newline
      streaming: "off", // off | partial | block | progress (progress maps to partial on Discord)
      maxLinesPerMessage: 17,
      ui: {
        components: {
          accentColor: "#5865F2",
        },
      },
      threadBindings: {
        enabled: true,
        idleHours: 24,
        maxAgeHours: 0,
        spawnSubagentSessions: false, // opt-in for sessions_spawn({ thread: true })
      },
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
      retry: {
        attempts: 3,
        minDelayMs: 500,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
  },
}
```- トークン: `channels.discord.token`、デフォルト アカウントのフォールバックとして `DISCORD_BOT_TOKEN`。
- オプションの `channels.discord.defaultAccount` は、設定されたアカウント ID と一致する場合、デフォルトのアカウント選択をオーバーライドします。
- 配信ターゲットには `user:<id>` (DM) または `channel:<id>` (ギルド チャネル) を使用します。裸の数値 ID は拒否されます。
- ギルド スラッグは小文字でスペースが `-` に置き換えられます。チャンネルキーはスラッグ名 (`#` ではありません) を使用します。ギルドIDを優先します。
- ボットが作成したメッセージはデフォルトでは無視されます。 `allowBots: true` はそれらを有効にします。 `allowBots: "mentions"` を使用して、ボットに言及するボット メッセージのみを受け入れます (独自のメッセージはまだフィルターされています)。
- `channels.discord.guilds.<id>.ignoreOtherMentions` (およびチャネル オーバーライド) は、別のユーザーまたはロールに言及するメッセージを削除しますが、ボットには言及しません (@everyone/@here を除く)。
- `maxLinesPerMessage` (デフォルトは 17) は、2000 文字未満の場合でも長いメッセージを分割します。
- `channels.discord.threadBindings` は、Discord のスレッドバインドされたルーティングを制御します。
  - `enabled`: スレッドバインドされたセッション機能の Discord オーバーライド (`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`、バインド配信/ルーティング)
  - `idleHours`: 非アクティブ状態が数時間で自動フォーカス解除されるための Discord オーバーライド (`0` は無効になります)
  - `maxAgeHours`: 時間単位のハードマックス年齢の Discord オーバーライド (`0` は無効になります)
  - `spawnSubagentSessions`: `sessions_spawn({ thread: true })` 自動スレッド作成/バインドのオプトイン スイッチ- `type: "acp"` を含むトップレベルの `bindings[]` エントリは、チャネルとスレッドの永続的な ACP バインディングを構成します (`match.peer.id` のチャネル/スレッド ID を使用します)。フィールド セマンティクスは [ACP エージェント](/tools/acp-agents#channel-specific-settings) で共有されます。
- `channels.discord.ui.components.accentColor` は、Discord コンポーネント v2 コンテナのアクセント カラーを設定します。
- `channels.discord.voice` は、Discord 音声チャネル会話とオプションの自動参加 + TTS オーバーライドを有効にします。
- `channels.discord.voice.daveEncryption` および `channels.discord.voice.decryptionFailureTolerance` は `@discordjs/voice` DAVE オプションに渡されます (デフォルトでは `true` および `24`)。
- OpenClaw はさらに、繰り返し復号化に失敗した後、音声セッションから離脱/再参加することで音声受信の回復を試みます。
- `channels.discord.streaming` は正規ストリーム モード キーです。従来の `streamMode` およびブール値 `streaming` 値は自動移行されます。
- `channels.discord.autoPresence` は、実行時の可用性をボットの存在にマップし (正常 => オンライン、劣化 => アイドル、消耗 => 停止)、オプションでステータス テキストの上書きを許可します。
- `channels.discord.dangerouslyAllowNameMatching` は、変更可能な名前/タグの一致を再度有効にします (ブレークグラス互換モード)。

**反応通知モード:** `off` (なし)、`own` (ボットのメッセージ、デフォルト)、`all` (すべてのメッセージ)、`allowlist` (すべてのメッセージの `guilds.<id>.users` から)。

### Google チャット

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      audienceType: "app-url", // app-url | project-number
      audience: "https://gateway.example.com/googlechat",
      webhookPath: "/googlechat",
      botUser: "users/1234567890",
      dm: {
        enabled: true,
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": { allow: true, requireMention: true },
      },
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```- サービス アカウント JSON: インライン (`serviceAccount`) またはファイルベース (`serviceAccountFile`)。
- サービス アカウント SecretRef もサポートされています (`serviceAccountRef`)。
- 環境フォールバック: `GOOGLE_CHAT_SERVICE_ACCOUNT` または `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`。
- 配信ターゲットには `spaces/<spaceId>` または `users/<userId>` を使用します。
- `channels.googlechat.dangerouslyAllowNameMatching` は、変更可能な電子メール プリンシパルの一致を再度有効にします (ブレークグラス互換モード)。

### スラック

```json5
{
  channels: {
    slack: {
      enabled: true,
      botToken: "xoxb-...",
      appToken: "xapp-...",
      dmPolicy: "pairing",
      allowFrom: ["U123", "U456", "*"],
      dm: { enabled: true, groupEnabled: false, groupChannels: ["G123"] },
      channels: {
        C123: { allow: true, requireMention: true, allowBots: false },
        "#general": {
          allow: true,
          requireMention: true,
          allowBots: false,
          users: ["U123"],
          skills: ["docs"],
          systemPrompt: "Short answers only.",
        },
      },
      historyLimit: 50,
      allowBots: false,
      reactionNotifications: "own",
      reactionAllowlist: ["U123"],
      replyToMode: "off", // off | first | all
      thread: {
        historyScope: "thread", // thread | channel
        inheritParent: false,
      },
      actions: {
        reactions: true,
        messages: true,
        pins: true,
        memberInfo: true,
        emojiList: true,
      },
      slashCommand: {
        enabled: true,
        name: "openclaw",
        sessionPrefix: "slack:slash",
        ephemeral: true,
      },
      typingReaction: "hourglass_flowing_sand",
      textChunkLimit: 4000,
      chunkMode: "length",
      streaming: "partial", // off | partial | block | progress (preview mode)
      nativeStreaming: true, // use Slack native streaming API when streaming=partial
      mediaMaxMb: 20,
    },
  },
}
````

- **ソケット モード**には、`botToken` と `appToken` の両方が必要です (デフォルトのアカウント環境フォールバックの場合は `SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN`)。
- **HTTP モード** には、`botToken` と `signingSecret` (ルートまたはアカウントごと) が必要です。
- `configWrites: false` は、Slack によって開始される設定の書き込みをブロックします。
- オプションの `channels.slack.defaultAccount` は、設定されたアカウント ID と一致する場合、デフォルトのアカウント選択をオーバーライドします。
- `channels.slack.streaming` は正規ストリーム モード キーです。従来の `streamMode` 値とブール値 `streaming` 値は自動移行されます。
- 配信ターゲットには `user:<id>` (DM) または `channel:<id>` を使用します。

**反応通知モード:** `off`、`own` (デフォルト)、`all`、`allowlist` (`reactionAllowlist` から)。

**スレッド セッションの分離:** `thread.historyScope` はスレッドごと (デフォルト)、またはチャネル全体で共有されます。 `thread.inheritParent` は、親チャネルのトランスクリプトを新しいスレッドにコピーします。- `typingReaction` は、返信の実行中に受信 Slack メッセージに一時的な反応を追加し、完了時に削除します。 `"hourglass_flowing_sand"` などの Slack 絵文字ショートコードを使用します。

| アクショングループ | デフォルト | メモ                    |
| ------------------ | ---------- | ----------------------- |
| 反応               | 有効       | 反応 + 反応のリスト     |
| メッセージ         | 有効       | 読み取り/送信/編集/削除 |
| ピン               | 有効       | 固定/固定解除/リスト    |
| メンバー情報       | 有効       | 会員情報                |
| 絵文字リスト       | 有効       | カスタム絵文字リスト    |

### 最も重要なこと

Mattermost はプラグインとして出荷されます: `openclaw plugins install @openclaw/mattermost`。

```json5
{
  channels: {
    mattermost: {
      enabled: true,
      botToken: "mm-token",
      baseUrl: "https://chat.example.com",
      dmPolicy: "pairing",
      chatmode: "oncall", // oncall | onmessage | onchar
      oncharPrefixes: [">", "!"],
      commands: {
        native: true, // opt-in
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Optional explicit URL for reverse-proxy/public deployments
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

チャット モード: `oncall` (@ メンションで応答、デフォルト)、`onmessage` (すべてのメッセージ)、`onchar` (トリガー プレフィックスで始まるメッセージ)。

Mattermost ネイティブ コマンドが有効な場合:- `commands.callbackPath` は、完全な URL ではなく、パス (`/api/channels/mattermost/command` など) である必要があります。

- `commands.callbackUrl` は OpenClaw ゲートウェイ エンドポイントに解決され、Mattermost サーバーから到達可能である必要があります。
- プライベート/テールネット/内部コールバック ホストの場合、Mattermost は必要な場合があります
  `ServiceSettings.AllowedUntrustedInternalConnections` には、コールバック ホスト/ドメインが含まれます。
  完全な URL ではなく、ホスト/ドメインの値を使用します。
- `channels.mattermost.configWrites`: Mattermost が開始する構成書き込みを許可または拒否します。
- `channels.mattermost.requireMention`: チャネルで返信する前に `@mention` が必要です。
- オプションの `channels.mattermost.defaultAccount` は、構成されたアカウント ID と一致する場合、デフォルトのアカウント選択をオーバーライドします。

### 信号

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // optional account binding
      dmPolicy: "pairing",
      allowFrom: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      configWrites: true,
      reactionNotifications: "own", // off | own | all | allowlist
      reactionAllowlist: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      historyLimit: 50,
    },
  },
}
```

**反応通知モード:** `off`、`own` (デフォルト)、`all`、`allowlist` (`reactionAllowlist` から)。

- `channels.signal.account`: チャネルの起動を特定の Signal アカウント ID に固定します。
- `channels.signal.configWrites`: Signal によって開始される構成書き込みを許可または拒否します。
- オプションの `channels.signal.defaultAccount` は、設定されたアカウント ID と一致する場合、デフォルトのアカウント選択をオーバーライドします。

### ブルーバブルズ

BlueBubbles が推奨される iMessage パスです (プラグインベース、`channels.bluebubbles` で構成)。

````json5
{
  channels: {
    bluebubbles: {
      enabled: true,
      dmPolicy: "pairing",
      // serverUrl, password, webhookPath, group controls, and advanced actions:
      // see /channels/bluebubbles
    },
  },
}
```- ここで取り上げるコアキーのパス: `channels.bluebubbles`、`channels.bluebubbles.dmPolicy`。
- オプションの `channels.bluebubbles.defaultAccount` は、構成されたアカウント ID と一致する場合、デフォルトのアカウント選択をオーバーライドします。
- 完全な BlueBubbles チャネル構成は [BlueBubbles](/channels/bluebubbles) に文書化されています。

### iメッセージ

OpenClaw は `imsg rpc` (標準入出力上の JSON-RPC) を生成します。デーモンやポートは必要ありません。

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "imsg",
      dbPath: "~/Library/Messages/chat.db",
      remoteHost: "user@gateway-host",
      dmPolicy: "pairing",
      allowFrom: ["+15555550123", "user@example.com", "chat_id:123"],
      historyLimit: 50,
      includeAttachments: false,
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      mediaMaxMb: 16,
      service: "auto",
      region: "US",
    },
  },
}
````

- オプションの `channels.imessage.defaultAccount` は、設定されたアカウント ID と一致する場合、デフォルトのアカウント選択をオーバーライドします。

- メッセージ DB へのフルディスク アクセスが必要です。
- `chat_id:<id>` ターゲットを優先します。チャットを一覧表示するには、`imsg chats --limit 20` を使用します。
- `cliPath` は SSH ラッパーを指すことができます。 SCP 添付ファイルを取得するために `remoteHost` (`host` または `user@host`) を設定します。
- `attachmentRoots` および `remoteAttachmentRoots` は、受信添付ファイル パスを制限します (デフォルト: `/Users/*/Library/Messages/Attachments`)。
- SCP は厳密なホスト キー チェックを使用するため、リレー ホスト キーが `~/.ssh/known_hosts` にすでに存在していることを確認してください。
- `channels.imessage.configWrites`: iMessage によって開始される設定の書き込みを許可または拒否します。

<Accordion title="iMessage SSH ラッパーの例">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Microsoft Teams

Microsoft Teams は拡張機能をサポートしており、`channels.msteams` で構成されています。

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, team/channel policies:
      // see /channels/msteams
    },
  },
}
```

- ここで取り上げるコアキーのパス: `channels.msteams`、`channels.msteams.configWrites`。
- 完全な Teams 構成 (資格情報、Webhook、DM/グループ ポリシー、チームごと/チャネルごとのオーバーライド) は、[Microsoft Teams](/channels/msteams) に文書化されています。### IRC

IRC は拡張機能をサポートしており、`channels.irc` で構成されています。

```json5
{
  channels: {
    irc: {
      enabled: true,
      dmPolicy: "pairing",
      configWrites: true,
      nickserv: {
        enabled: true,
        service: "NickServ",
        password: "${IRC_NICKSERV_PASSWORD}",
        register: false,
        registerEmail: "bot@example.com",
      },
    },
  },
}
```

- ここで説明するコアキーのパス: `channels.irc`、`channels.irc.dmPolicy`、`channels.irc.configWrites`、`channels.irc.nickserv.*`。
- オプションの `channels.irc.defaultAccount` は、構成されたアカウント ID と一致する場合、デフォルトのアカウント選択をオーバーライドします。
- 完全な IRC チャネル設定 (ホスト/ポート/TLS/チャネル/許可リスト/メンション ゲーティング) は [IRC](/channels/irc) に文書化されています。

### マルチアカウント (すべてのチャネル)

チャネルごとに複数のアカウントを実行します (それぞれに独自の `accountId` があります)。

````json5
{
  channels: {
    telegram: {
      accounts: {
        default: {
          name: "Primary bot",
          botToken: "123456:ABC...",
        },
        alerts: {
          name: "Alerts bot",
          botToken: "987654:XYZ...",
        },
      },
    },
  },
}
```- `default` は、`accountId` が省略された場合に使用されます (CLI + ルーティング)。
- 環境トークンは **デフォルト** アカウントにのみ適用されます。
- 基本チャネル設定は、アカウントごとに上書きされない限り、すべてのアカウントに適用されます。
- `bindings[].match.accountId` を使用して、各アカウントを別のエージェントにルーティングします。
- 単一アカウントのトップレベルのチャネル設定を使用しているときに、`openclaw channels add` (またはチャネルのオンボーディング) 経由でデフォルト以外のアカウントを追加すると、OpenClaw は最初にアカウントスコープのトップレベルの単一アカウントの値を `channels.<channel>.accounts.default` に移動し、元のアカウントが機能し続けるようにします。
- 既存のチャネルのみのバインディング (`accountId` なし) はデフォルトのアカウントと一致し続けます。アカウント スコープのバインディングはオプションのままです。
- `openclaw doctor --fix` は、名前付きアカウントが存在するが `default` が欠落している場合、アカウントをスコープとする最上位の単一アカウントの値を `accounts.default` に移動することにより、混合シェイプも修復します。

### その他の拡張チャネル

多くの拡張チャネルは `channels.<id>` として構成され、専用チャネル ページ (Feishu、Matrix、LINE、Nostr、Zalo、Nextcloud Talk、Synology Chat、Twitch など) に文書化されています。
完全なチャネル インデックスを参照してください: [チャネル](/channels)。

### グループチャットのメンションゲート

グループ メッセージはデフォルトで **メンションが必要** (メタデータのメンションまたは正規表現パターン) です。 WhatsApp、Telegram、Discord、Google Chat、および iMessage のグループ チャットに適用されます。

**メンションの種類:**- **メタデータのメンション**: ネイティブ プラットフォームの @-メンション。 WhatsApp セルフチャット モードでは無視されます。
- **テキスト パターン**: `agents.list[].groupChat.mentionPatterns` の正規表現パターン。常にチェックされています。
- メンション ゲートは、検出が可能な場合 (ネイティブ メンションまたは少なくとも 1 つのパターン) にのみ適用されます。

```json5
{
  messages: {
    groupChat: { historyLimit: 50 },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
````

`messages.groupChat.historyLimit` はグローバルなデフォルトを設定します。チャネルは `channels.<channel>.historyLimit` (またはアカウントごと) でオーバーライドできます。 `0` を無効に設定します。

#### DM 履歴の制限

```json5
{
  channels: {
    telegram: {
      dmHistoryLimit: 30,
      dms: {
        "123456789": { historyLimit: 50 },
      },
    },
  },
}
```

解決策: DM ごとのオーバーライド → プロバイダーのデフォルト → 制限なし (すべて保持)。

サポートされている: `telegram`、`whatsapp`、`discord`、`slack`、`signal`、`imessage`、`msteams`。

#### セルフチャットモード

セルフチャット モードを有効にするには、`allowFrom` に独自の番号を含めます (ネイティブの @-メンションを無視し、テキスト パターンにのみ応答します)。

```json5
{
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: { "*": { requireMention: true } },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: { mentionPatterns: ["reisponde", "@openclaw"] },
      },
    ],
  },
}
```

### コマンド (チャット コマンドの処理)

```json5
{
  commands: {
    native: "auto", // register native commands when supported
    text: true, // parse /commands in chat messages
    bash: false, // allow ! (alias: /bash)
    bashForegroundMs: 2000,
    config: false, // allow /config
    debug: false, // allow /debug
    restart: false, // allow /restart + gateway restart tool
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

<Accordion title="コマンド詳細">- テキスト コマンドは、先頭に `/` が付いた **スタンドアロン** メッセージである必要があります。

- `native: "auto"` は、Discord/Telegram のネイティブ コマンドをオンにし、Slack をオフのままにします。
- チャネルごとのオーバーライド: `channels.discord.commands.native` (ブール値または `"auto"`)。 `false` は、以前に登録されたコマンドをクリアします。
- `channels.telegram.customCommands` は、Telegram ボット メニュー エントリを追加します。
- `bash: true` は、ホスト シェルの `! <cmd>` を有効にします。 `tools.elevated.enabled` と `tools.elevated.allowFrom.<channel>` の送信者が必要です。
- `config: true` は `/config` を有効にします (`openclaw.json` の読み取り/書き込み)。ゲートウェイ `chat.send` クライアントの場合、永続的な `/config set|unset` 書き込みには `operator.admin` も必要です。読み取り専用 `/config show` は、通常の書き込みスコープのオペレーター クライアントで引き続き使用できます。
- `channels.<provider>.configWrites` はチャネルごとに構成の変更をゲートします (デフォルト: true)。
- `allowFrom` はプロバイダーごとです。設定すると、**唯一**の認証ソースになります (チャネル許可リスト/ペアリングと `useAccessGroups` は無視されます)。
- `useAccessGroups: false` を使用すると、`allowFrom` が設定されていない場合に、コマンドがアクセス グループ ポリシーをバイパスできます。

</Accordion>

---

## エージェントのデフォルト

### `agents.defaults.workspace`

デフォルト: `~/.openclaw/workspace`。

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

システム プロンプトのランタイム行に表示されるオプションのリポジトリ ルート。設定されていない場合、OpenClaw はワークスペースから上に向かって歩くことによって自動検出します。

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skipBootstrap`ワークスペース ブートストラップ ファイル (`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、 `BOOTSTRAP.md`)

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.bootstrapMaxChars`

切り詰められる前のワークスペース ブートストラップ ファイルあたりの最大文字数。デフォルト: `20000`。

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

すべてのワークスペース ブートストラップ ファイルに挿入される最大合計文字数。デフォルト: `150000`。

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 150000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

ブートストラップ コンテキストが切り詰められた場合に、エージェントに表示される警告テキストを制御します。
デフォルト: `"once"`。

- `"off"`: システム プロンプトに警告テキストを挿入しないでください。
- `"once"`: 一意の切り捨て署名ごとに 1 回警告を挿入します (推奨)。
- `"always"`: 切り捨てが存在する場合、実行ごとに警告を挿入します。

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### `agents.defaults.imageMaxDimensionPx`

プロバイダー呼び出し前のトランスクリプト/ツール画像ブロック内の最長画像側の最大ピクセル サイズ。
デフォルト: `1200`。

通常、値を低くすると、ビジョン トークンの使用量が減り、スクリーンショットを大量に使用する実行の場合に要求されるペイロード サイズが減ります。
値を大きくすると、視覚的な詳細がより多く保持されます。

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

システム プロンプト コンテキストのタイムゾーン (メッセージ タイムスタンプではありません)。ホストのタイムゾーンにフォールバックします。

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

システムプロンプトの時刻形式。デフォルト: `auto` (OS 設定)。

````json5
{
  agents: { defaults: { timeFormat: "auto" } }, // auto | 12 | 24
}
```### `agents.defaults.model`

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "minimax/MiniMax-M2.5": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.5"],
      },
      imageModel: {
        primary: "openrouter/qwen/qwen-2.5-vl-72b-instruct:free",
        fallbacks: ["openrouter/google/gemini-2.0-flash-vision:free"],
      },
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5-mini"],
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
      elevatedDefault: "on",
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      contextTokens: 200000,
      maxConcurrent: 3,
    },
  },
}
```- `model`: 文字列 (`"provider/model"`) またはオブジェクト (`{ primary, fallbacks }`) を受け入れます。
  ・文字列形式はプライマリモデルのみ設定します。
  - オブジェクト形式は、プライマリおよび順序付けされたフェイルオーバー モデルを設定します。
- `imageModel`: 文字列 (`"provider/model"`) またはオブジェクト (`{ primary, fallbacks }`) を受け入れます。
  - `image` ツール パスによってビジョン モデル構成として使用されます。
  - 選択/デフォルトのモデルが画像入力を受け入れられない場合のフォールバック ルーティングとしても使用されます。
- `pdfModel`: 文字列 (`"provider/model"`) またはオブジェクト (`{ primary, fallbacks }`) を受け入れます。
  - モデル ルーティング用の `pdf` ツールによって使用されます。
  - 省略した場合、PDF ツールは `imageModel` にフォールバックし、その後ベストエフォート型プロバイダーのデフォルトにフォールバックします。
- `pdfMaxBytesMb`: 呼び出し時に `maxBytesMb` が渡されない場合の、`pdf` ツールのデフォルトの PDF サイズ制限。
- `pdfMaxPages`: `pdf` ツールの抽出フォールバック モードで考慮されるデフォルトの最大ページ数。
- `model.primary`: `provider/model` の形式 (例: `anthropic/claude-opus-4-6`)。プロバイダーを省略した場合、OpenClaw は `anthropic` (非推奨) を想定します。
- `models`: `/model` の構成されたモデル カタログと許可リスト。各エントリには、`alias` (ショートカット) および `params` (プロバイダー固有、たとえば、`temperature`、`maxTokens`、`cacheRetention`、`context1m`) を含めることができます。- `params` マージ優先順位 (構成): `agents.defaults.models["provider/model"].params` がベースで、その後 `agents.list[].params` (エージェント ID と一致する) がキーによってオーバーライドされます。
- これらのフィールドを変更する構成ライター (`/models set`、`/models set-image`、およびフォールバック追加/削除コマンドなど) は、可能であれば正規のオブジェクト形式を保存し、既存のフォールバック リストを保存します。
- `maxConcurrent`: 最大並列エージェントはセッション間で実行されます (各セッションはまだシリアル化されています)。デフォルト: 1。

**組み込みのエイリアスの短縮表記** (モデルが `agents.defaults.models` の場合にのみ適用されます):

|別名 |モデル |
| ------------------- | -------------------------------------- |
| `opus` | `anthropic/claude-opus-4-6` |
| `sonnet` | `anthropic/claude-sonnet-4-6` |
| `gpt` | `openai/gpt-5.4` |
| `gpt-mini` | `openai/gpt-5-mini` |
| `gemini` | `google/gemini-3.1-pro-preview` |
| `gemini-flash` | `google/gemini-3-flash-preview` |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview` |

設定したエイリアスは常にデフォルトよりも優先されます。Z.AI GLM-4.x モデルは、`--thinking off` を設定するか、`agents.defaults.models["zai/<model>"].params.thinking` を自分で定義しない限り、思考モードを自動的に有効にします。
Z.AI モデルでは、ツール呼び出しストリーミングに対してデフォルトで `tool_stream` が有効になっています。無効にするには、`agents.defaults.models["zai/<model>"].params.tool_stream` を `false` に設定します。
Anthropic Claude 4.6 モデルは、明示的思考レベルが設定されていない場合、デフォルトで `adaptive` 思考になります。

### `agents.defaults.cliBackends`

テキストのみのフォールバック実行用のオプションの CLI バックエンド (ツール呼び出しなし)。 API プロバイダーに障害が発生した場合のバックアップとして役立ちます。

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          systemPromptArg: "--system",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
````

- CLI バックエンドはテキストファーストです。ツールは常に無効になっています。
- `sessionArg` が設定されている場合にサポートされるセッション。
- `imageArg` がファイル パスを受け入れる場合、イメージ パススルーがサポートされます。

### `agents.defaults.heartbeat`

定期的なハートビートが実行されます。

````json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m disables
        model: "openai/gpt-5.2-mini",
        includeReasoning: false,
        lightContext: false, // default: false; true keeps only HEARTBEAT.md from workspace bootstrap files
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (default) | block
        target: "none", // default: none | options: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
      },
    },
  },
}
```- `every`: 期間文字列 (ms/s/m/h)。デフォルト: `30m`。
- `suppressToolErrorWarnings`: true の場合、ハートビートの実行中にツール エラー警告ペイロードが抑制されます。
- `directPolicy`: 直接/DM 配信ポリシー。 `allow` (デフォルト) は、直接ターゲット配信を許可します。 `block` は直接ターゲットの配信を抑制し、`reason=dm-blocked` を発行します。
- `lightContext`: true の場合、ハートビートの実行では軽量ブートストラップ コンテキストが使用され、ワー​​クスペース ブートストラップ ファイルから `HEARTBEAT.md` のみが保持されます。
- エージェントごと: `agents.list[].heartbeat` を設定します。いずれかのエージェントが `heartbeat` を定義すると、**それらのエージェントのみ** がハートビートを実行します。
- ハートビートはエージェント ターン全体を実行します。間隔が短いほど、より多くのトークンが消費されます。

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        reserveTokensFloor: 24000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // used when identifierPolicy=custom
        postCompactionSections: ["Session Startup", "Red Lines"], // [] disables reinjection
        model: "openrouter/anthropic/claude-sonnet-4-5", // optional compaction-only model override
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```- `mode`: `default` または `safeguard` (長い履歴のチャンク化された要約)。 [圧縮](/concepts/compaction) を参照してください。
- `identifierPolicy`: `strict` (デフォルト)、`off`、または `custom`。 `strict` は、圧縮要約中に組み込みの不透明な識別子保持ガイダンスを先頭に追加します。
- `identifierInstructions`: `identifierPolicy=custom` の場合に使用されるオプションのカスタム識別子保存テキスト。
- `postCompactionSections`: 圧縮後に再挿入するオプションの AGENTS.md H2/H3 セクション名。デフォルトは `["Session Startup", "Red Lines"]` です。 `[]` を設定して再注入を無効にします。設定を解除するか、そのデフォルトのペアに明示的に設定すると、古い `Every Session`/`Safety` 見出しもレガシー フォールバックとして受け入れられます。
- `model`: 圧縮要約のみのオプションの `provider/model-id` オーバーライド。これは、メイン セッションで 1 つのモデルを保持する必要があるが、圧縮サマリーを別のモデルで実行する必要がある場合に使用します。設定されていない場合、圧縮ではセッションのプライマリ モデルが使用されます。
- `memoryFlush`: 耐久性のあるメモリを保存するための自動圧縮前のサイレント エージェント ターン。ワークスペースが読み取り専用の場合はスキップされます。

### `agents.defaults.contextPruning`

LLM に送信する前に、メモリ内コンテキストから **古いツールの結果** を削除します。ディスク上のセッション履歴は**変更されません**。

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // duration (ms/s/m/h), default unit: minutes
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Old tool result content cleared]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
````

<Accordion title="キャッシュ TTL モードの動作">- `mode: "cache-ttl"` はプルーニング パスを有効にします。

- `ttl` は、プルーニングを再度実行できる頻度 (最後のキャッシュ タッチ後) を制御します。
- プルーニングでは、まずサイズの大きいツール結果がソフト トリムされ、次に必要に応じて古いツール結果がハードクリアされます。

**ソフトトリム**は、先頭と末尾を維持し、途中に `...` を挿入します。

**ハードクリア** は、ツールの結果全体をプレースホルダーに置き換えます。

注:

- 画像ブロックは決してトリミング/クリアされません。
- 比率は文字ベース (概算) であり、正確なトークン数ではありません。
- 存在するアシスタント メッセージが `keepLastAssistants` 未満の場合、プルーニングはスキップされます。

</Accordion>

動作の詳細については、[セッション プルーニング](/concepts/session-pruning) を参照してください。

### ストリーミングをブロックする

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (use minMs/maxMs)
    },
  },
}
```

- Telegram 以外のチャネルでは、ブロック応答を有効にするには明示的な `*.blockStreaming: true` が必要です。
- チャネル オーバーライド: `channels.<channel>.blockStreamingCoalesce` (およびアカウントごとのバリアント)。 Signal/Slack/Discord/Google Chat のデフォルト `minChars: 1500`。
- `humanDelay`: ブロック返信間のランダムな一時停止。 `natural` = 800 ～ 2500 ミリ秒。エージェントごとのオーバーライド: `agents.list[].humanDelay`。

動作とチャンク化の詳細については、[ストリーミング](/concepts/streaming) を参照してください。

### タイピングインジケーター

```json5
{
  agents: {
    defaults: {
      typingMode: "instant", // never | instant | thinking | message
      typingIntervalSeconds: 6,
    },
  },
}
```

- デフォルト: 直接チャット/メンションの場合は `instant`、言及されていないグループ チャットの場合は `message`。
- セッションごとのオーバーライド: `session.typingMode`、`session.typingIntervalSeconds`。

[タイピングインジケーター](/concepts/typing-indicators) を参照してください。

### `agents.defaults.sandbox`埋め込みエージェント用のオプションの **Docker サンドボックス**。完全なガイドについては、[サンドボックス](/gateway/sandboxing) を参照してください

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        scope: "agent", // session | agent | shared
        workspaceAccess: "none", // none | ro | rw
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          containerPrefix: "openclaw-sbx-",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
          capDrop: ["ALL"],
          env: { LANG: "C.UTF-8" },
          setupCommand: "apt-get update && apt-get install -y git curl jq",
          pidsLimit: 256,
          memory: "1g",
          memorySwap: "2g",
          cpus: 1,
          ulimits: {
            nofile: { soft: 1024, hard: 2048 },
            nproc: 256,
          },
          seccompProfile: "/path/to/seccomp.json",
          apparmorProfile: "openclaw-sandbox",
          dns: ["1.1.1.1", "8.8.8.8"],
          extraHosts: ["internal.service:10.0.0.5"],
          binds: ["/home/user/source:/source:rw"],
        },
        browser: {
          enabled: false,
          image: "openclaw-sandbox-browser:bookworm-slim",
          network: "openclaw-sandbox-browser",
          cdpPort: 9222,
          cdpSourceRange: "172.21.0.1/32",
          vncPort: 5900,
          noVncPort: 6080,
          headless: false,
          enableNoVnc: true,
          allowHostControl: false,
          autoStart: true,
          autoStartTimeoutMs: 12000,
        },
        prune: {
          idleHours: 24,
          maxAgeDays: 7,
        },
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        allow: [
          "exec",
          "process",
          "read",
          "write",
          "edit",
          "apply_patch",
          "sessions_list",
          "sessions_history",
          "sessions_send",
          "sessions_spawn",
          "session_status",
        ],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"],
      },
    },
  },
}
```

<Accordion title="サンドボックスの詳細">

**ワークスペースへのアクセス:**

- `none`: `~/.openclaw/sandboxes` の下のスコープごとのサンドボックス ワークスペース
- `ro`: サンドボックス ワークスペースは `/workspace`、エージェント ワークスペースは `/agent` に読み取り専用でマウントされています
- `rw`: エージェント ワークスペースは `/workspace` に読み取り/書き込み可能にマウントされました

**範囲:**

- `session`: セッションごとのコンテナ + ワークスペース
- `agent`: エージェントごとに 1 つのコンテナ + ワークスペース (デフォルト)
- `shared`: 共有コンテナーとワークスペース (セッション間の分離なし)

**`setupCommand`** は、コンテナーの作成後に 1 回実行されます (`sh -lc` 経由)。ネットワーク出力、書き込み可能な root、root ユーザーが必要です。

**コンテナのデフォルトは `network: "none"`** です。エージェントが送信アクセスを必要とする場合は、`"bridge"` (またはカスタム ブリッジ ネットワーク) に設定されます。
`"host"` はブロックされています。 `"container:<id>"` は、明示的に設定しない限り、デフォルトでブロックされます
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (ガラス破り)。

**受信添付ファイル**は、アクティブなワークスペースの `media/inbound/*` にステージングされます。

**`docker.binds`** は追加のホスト ディレクトリをマウントします。グローバル バインドとエージェントごとのバインドがマージされます。**サンドボックス ブラウザ** (`sandbox.browser.enabled`): コンテナ内の Chromium + CDP。 noVNC URL がシステム プロンプトに挿入されました。 `openclaw.json` に `browser.enabled` は必要ありません。
noVNC オブザーバー アクセスでは、デフォルトで VNC 認証が使用され、OpenClaw は (共有 URL でパスワードを公開する代わりに) 有効期間の短いトークン URL を発行します。- `allowHostControl: false` (デフォルト) は、サンドボックス化されたセッションがホスト ブラウザーをターゲットにすることをブロックします。

- `network` のデフォルトは `openclaw-sandbox-browser` (専用ブリッジ ネットワーク) です。明示的にグローバル ブリッジ接続が必要な場合にのみ、`bridge` に設定します。
- `cdpSourceRange` は、オプションでコンテナ エッジでの CDP イングレスを CIDR 範囲に制限します (`172.21.0.1/32` など)。
- `sandbox.browser.binds` は、追加のホスト ディレクトリをサンドボックス ブラウザ コンテナのみにマウントします。設定すると (`[]` を含む)、ブラウザー コンテナーの `docker.binds` が置き換えられます。
- 起動デフォルトは `scripts/sandbox-browser-entrypoint.sh` で定義され、コンテナー ホスト用に調整されています。
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-3d-apis`
  - `--disable-gpu`
  - `--disable-software-rasterizer`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-features=TranslateUI`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--renderer-process-limit=2`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--disable-extensions` (デフォルトで有効)
  - `--disable-3d-apis`、`--disable-software-rasterizer`、および `--disable-gpu` は
    デフォルトで有効になっており、次のコマンドで無効にできます
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` WebGL/3D の使用に必要な場合。
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` は、ワークフローが次の場合に拡張機能を再度有効にします。
    彼ら次第です。
  - `--renderer-process-limit=2` は次のように変更できます。
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; Chromium を使用するように `0` を設定します
    デフォルトのプロセス制限。- `noSandbox` が有効な場合は、`--no-sandbox` および `--disable-setuid-sandbox` が追加されます。
  - デフォルトはコンテナイメージのベースラインです。カスタムのブラウザ画像をカスタムで使用する
    コンテナのデフォルトを変更するためのエントリポイント。

</Accordion>

イメージをビルドします。

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

### `agents.list` (エージェントごとの上書き)

````json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "Main Agent",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // or { primary, fallbacks }
        params: { cacheRetention: "none" }, // overrides matching defaults.models params by key
        identity: {
          name: "Samantha",
          theme: "helpful sloth",
          emoji: "🦥",
          avatar: "avatars/samantha.png",
        },
        groupChat: { mentionPatterns: ["@openclaw"] },
        sandbox: { mode: "off" },
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
        subagents: { allowAgents: ["*"] },
        tools: {
          profile: "coding",
          allow: ["browser"],
          deny: ["canvas"],
          elevated: { enabled: true },
        },
      },
    ],
  },
}
```- `id`: 安定したエージェント ID (必須)。
- `default`: 複数が設定されている場合、最初が優先されます (警告がログに記録されます)。何も設定されていない場合は、最初のリスト エントリがデフォルトになります。
- `model`: 文字列形式は `primary` のみをオーバーライドします。オブジェクト フォーム `{ primary, fallbacks }` は両方をオーバーライドします (`[]` はグローバル フォールバックを無効にします)。 `primary` をオーバーライドするだけの Cron ジョブは、`fallbacks: []` を設定しない限り、デフォルトのフォールバックを継承します。
- `params`: `agents.defaults.models` で選択されたモデル エントリにマージされたエージェントごとのストリーム パラメーター。これは、モデル カタログ全体を複製せずに、`cacheRetention`、`temperature`、`maxTokens` などのエージェント固有のオーバーライドに使用します。
- `runtime`: オプションのエージェントごとのランタイム記述子。エージェントがデフォルトで ACP ハーネス セッションを使用する必要がある場合は、`type: "acp"` を `runtime.acp` デフォルト (`agent`、`backend`、`mode`、`cwd`) とともに使用します。
- `identity.avatar`: ワークスペース相対パス、`http(s)` URL、または `data:` URI。
- `identity` はデフォルトを派生します: `emoji` から `ackReaction`、`name`/`emoji` から `mentionPatterns`。
- `subagents.allowAgents`: `sessions_spawn` のエージェント ID の許可リスト (`["*"]` = 任意、デフォルト: 同じエージェントのみ)。
- サンドボックス継承ガード: リクエスター セッションがサンドボックス化されている場合、`sessions_spawn` はサンドボックス化されずに実行されるターゲットを拒否します。

---## マルチエージェントルーティング

1 つのゲートウェイ内で複数の分離されたエージェントを実行します。 [マルチエージェント](/concepts/multi-agent) を参照してください。

```json5
{
  agents: {
    list: [
      { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
      { id: "work", workspace: "~/.openclaw/workspace-work" },
    ],
  },
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
  ],
}
````

### 一致フィールドのバインディング

- `type` (オプション): 通常のルーティングの場合は `route` (タイプが欠落している場合はデフォルトでルーティングされます)、永続的な ACP 会話バインディングの場合は `acp`。
- `match.channel` (必須)
- `match.accountId` (オプション; `*` = 任意のアカウント; 省略 = デフォルトのアカウント)
- `match.peer` (オプション; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (オプション、チャネル固有)
- `acp` (オプション; `type: "acp"` のみ): `{ mode, label, cwd, backend }`

**決定的な一致順序:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (正確、ピア/ギルド/チームなし)
5. `match.accountId: "*"` (チャネル全体)
6. デフォルトエージェント

各層内で、最初に一致した `bindings` エントリが優先されます。

`type: "acp"` エントリの場合、OpenClaw は正確な会話 ID (`match.channel` + アカウント + `match.peer.id`) によって解決し、上記のルート バインディング層の順序は使用しません。

### エージェントごとのアクセス プロファイル

<Accordion title="フルアクセス (サンドボックスなし)">

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="読み取り専用ツール + ワークスペース">

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "ro" },
        tools: {
          allow: [
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="ファイルシステムへのアクセスなし (メッセージングのみ)">

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "none" },
        tools: {
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
            "gateway",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

</Accordion>

優先順位の詳細については、[マルチエージェント サンドボックスとツール](/tools/multi-agent-sandbox-tools) を参照してください。

---

## セッション

```json5
{
  session: {
    scope: "per-sender",
    dmScope: "main", // main | per-peer | per-channel-peer | per-account-channel-peer
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      mode: "daily", // daily | idle
      atHour: 4,
      idleMinutes: 60,
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      direct: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    parentForkMaxTokens: 100000, // skip parent-thread fork above this token count (0 disables)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // duration or false
      maxDiskBytes: "500mb", // optional hard budget
      highWaterBytes: "400mb", // optional cleanup target
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // default inactivity auto-unfocus in hours (`0` disables)
      maxAgeHours: 0, // default hard max age in hours (`0` disables)
    },
    mainKey: "main", // legacy (runtime always uses "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="セッションフィールドの詳細">- **`dmScope`**: DM がグループ化される方法。

- `main`: すべての DM がメイン セッションを共有します。
- `per-peer`: チャネル間で送信者 ID によって分離します。
- `per-channel-peer`: チャネル + 送信者ごとに分離します (マルチユーザーの受信箱に推奨)。
- `per-account-channel-peer`: アカウント + チャネル + 送信者ごとに分離します (複数のアカウントに推奨)。
- **`identityLinks`**: クロスチャネルセッション共有のために、正規 ID をプロバイダープレフィックス付きのピアにマップします。
- **`reset`**: プライマリ リセット ポリシー。 `daily` は現地時間の `atHour` にリセットされます。 `idle` は `idleMinutes` の後にリセットされます。両方が設定されている場合は、先に期限が切れた方が優先されます。
- **`resetByType`**: タイプごとのオーバーライド (`direct`、`group`、`thread`)。レガシー `dm` は `direct` のエイリアスとして受け入れられます。
- **`parentForkMaxTokens`**: フォークされたスレッド セッションの作成時に許可される最大親セッション `totalTokens` (デフォルト `100000`)。
  - 親 `totalTokens` がこの値を超えている場合、OpenClaw は親トランスクリプト履歴を継承する代わりに、新しいスレッド セッションを開始します。
  - このガードを無効にし、常に親のフォークを許可するには、`0` を設定します。
- **`mainKey`**: 従来のフィールド。ランタイムは、メインのダイレクト チャット バケットに常に `"main"` を使用するようになりました。- **`sendPolicy`**: `channel`、`chatType` (`direct|group|channel`、従来の `dm` エイリアスを使用)、`keyPrefix`、または `rawKeyPrefix` による一致。最初に拒否した方が勝ちです。
- **`maintenance`**: セッション ストアのクリーンアップ + 保持制御。
  - `mode`: `warn` は警告のみを発行します。 `enforce` はクリーンアップを適用します。
  - `pruneAfter`: 古いエントリの期限切れ (デフォルト `30d`)。
  - `maxEntries`: `sessions.json` のエントリの最大数 (デフォルトは `500`)。
  - `rotateBytes`: このサイズを超える場合、`sessions.json` を回転します (デフォルト `10mb`)。
  - `resetArchiveRetention`: `*.reset.<timestamp>` トランスクリプト アーカイブの保持。デフォルトは `pruneAfter` です。 `false` を無効に設定します。
  - `maxDiskBytes`: オプションのセッション ディレクトリのディスク バジェット。 `warn` モードでは、警告がログに記録されます。 `enforce` モードでは、最も古いアーティファクト/セッションが最初に削除されます。
  - `highWaterBytes`: 予算クリーンアップ後のオプションのターゲット。デフォルトは `80%` または `maxDiskBytes` です。
- **`threadBindings`**: スレッドバインドされたセッション機能のグローバルデフォルト。
  - `enabled`: マスターデフォルトスイッチ (プロバイダーは上書き可能; Discord は `channels.discord.threadBindings.enabled` を使用します)
  - `idleHours`: デフォルトの非アクティブ状態は時間単位で自動的にフォーカスを解除します (`0` は無効になります。プロバイダーはオーバーライドできます)- `maxAgeHours`: デフォルトのハードマックス経過時間 (`0` は無効になります。プロバイダーはオーバーライドできます)

</Accordion>

---

## メッセージ

```json5
{
  messages: {
    responsePrefix: "🦞", // or "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "collect", // steer | followup | collect | steer-backlog | steer+backlog | queue | interrupt
      debounceMs: 1000,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "collect",
        telegram: "collect",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 disables
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### 応答プレフィックス

チャネル/アカウントごとのオーバーライド: `channels.<channel>.responsePrefix`、`channels.<channel>.accounts.<id>.responsePrefix`。

解決策 (最も具体的な勝利): アカウント → チャネル → グローバル。 `""` はカスケードを無効にして停止します。 `"auto"` は `[{identity.name}]` を派生させます。

**テンプレート変数:**

| 変数              | 説明               | 例                          |
| ----------------- | ------------------ | --------------------------- |
| `{model}`         | 短いモデル名       | `claude-opus-4-6`           |
| `{modelFull}`     | 完全なモデル識別子 | `anthropic/claude-opus-4-6` |
| `{provider}`      | プロバイダー名     | `anthropic`                 |
| `{thinkingLevel}` | 現在の思考レベル   | `high`、`low`、`off`        |
| `{identity.name}` | エージェント ID 名 | (`"auto"` と同じ)           |

変数では大文字と小文字が区別されません。 `{think}` は、`{thinkingLevel}` のエイリアスです。

### ACK反応- デフォルトはアクティブなエージェントの `identity.emoji`、それ以外の場合は `"👀"` です。 `""` を無効に設定します

- チャネルごとのオーバーライド: `channels.<channel>.ackReaction`、`channels.<channel>.accounts.<id>.ackReaction`。
- 解決順序: アカウント → チャネル → `messages.ackReaction` → ID フォールバック。
- スコープ: `group-mentions` (デフォルト)、`group-all`、`direct`、`all`。
- `removeAckAfterReply`: 返信後の確認応答を削除します (Slack/Discord/Telegram/Google Chat のみ)。

### インバウンドデバウンス

同じ送信者からのテキストのみの迅速なメッセージを 1 つのエージェント ターンにバッチ処理します。メディア/添付ファイルはすぐにフラッシュされます。制御コマンドはデバウンスをバイパスします。

### TTS (テキスト読み上げ)

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      elevenlabs: {
        apiKey: "elevenlabs_api_key",
        baseUrl: "https://api.elevenlabs.io",
        voiceId: "voice_id",
        modelId: "eleven_multilingual_v2",
        seed: 42,
        applyTextNormalization: "auto",
        languageCode: "en",
        voiceSettings: {
          stability: 0.5,
          similarityBoost: 0.75,
          style: 0.0,
          useSpeakerBoost: true,
          speed: 1.0,
        },
      },
      openai: {
        apiKey: "openai_api_key",
        baseUrl: "https://api.openai.com/v1",
        model: "gpt-4o-mini-tts",
        voice: "alloy",
      },
    },
  },
}
```

- `auto` は自動 TTS を制御します。 `/tts off|always|inbound|tagged` はセッションごとにオーバーライドされます。
- `summaryModel` は、自動要約の `agents.defaults.model.primary` をオーバーライドします。
- `modelOverrides` はデフォルトで有効になっています。 `modelOverrides.allowProvider` のデフォルトは `false` (オプトイン) です。
- API キーは `ELEVENLABS_API_KEY`/`XI_API_KEY` および `OPENAI_API_KEY` にフォールバックします。
- `openai.baseUrl` は OpenAI TTS エンドポイントをオーバーライドします。解決順序は、config、次に `OPENAI_TTS_BASE_URL`、次に `https://api.openai.com/v1` です。
- `openai.baseUrl` が非 OpenAI エンドポイントを指している場合、OpenClaw はそれを OpenAI 互換の TTS サーバーとして扱い、モデル/音声の検証を緩和します。

---

## 話す

トーク モードのデフォルト (macOS/iOS/Android)。

````json5
{
  talk: {
    voiceId: "elevenlabs_voice_id",
    voiceAliases: {
      Clawd: "EXAVITQu4vr4xnSDxMaL",
      Roger: "CwhRBWXzGAHq8TQ4Fs17",
    },
    modelId: "eleven_v3",
    outputFormat: "mp3_44100_128",
    apiKey: "elevenlabs_api_key",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```- 音声 ID は `ELEVENLABS_VOICE_ID` または `SAG_VOICE_ID` にフォールバックします。
- `apiKey` および `providers.*.apiKey` は、プレーンテキスト文字列または SecretRef オブジェクトを受け入れます。
- `ELEVENLABS_API_KEY` フォールバックは、Talk API キーが設定されていない場合にのみ適用されます。
- `voiceAliases` により、Talk ディレクティブにフレンドリ名を使用できるようになります。
- `silenceTimeoutMs` は、ユーザーが沈黙した後、トランスクリプトを送信するまでトーク モードが待機する時間を制御します。設定を解除すると、プラットフォームのデフォルトの一時停止ウィンドウ (`700 ms on macOS and Android, 900 ms on iOS`) が維持されます。

---

## ツール

### 工具プロファイル

`tools.profile` は、`tools.allow`/`tools.deny` の前に基本ホワイトリストを設定します。

ローカル オンボーディングは、設定を解除すると、新しいローカル構成をデフォルトで `tools.profile: "coding"` に設定します (既存の明示的なプロファイルは保持されます)。

|プロフィール |含まれるもの |
| ----------- | ----------------------------------------------------------------------------------------- |
| `minimal` | `session_status` のみ |
| `coding` | `group:fs`、`group:runtime`、`group:sessions`、`group:memory`、`image` |
| `messaging` | `group:messaging`、`sessions_list`、`sessions_history`、`sessions_send`、`session_status` |
| `full` |制限なし（未設定と同じ） |### ツールグループ|グループ |ツール |
| ------------------ | -------------------------------------------------------------------------------------- |
| `group:runtime` | `exec`、`process` (`bash` は `exec` のエイリアスとして受け入れられます)
| `group:fs` | `read`、`write`、`edit`、`apply_patch` |
| `group:sessions` | `sessions_list`、`sessions_history`、`sessions_send`、`sessions_spawn`、`session_status` |
| `group:memory` | `memory_search`、`memory_get` |
| `group:web` | `web_search`、`web_fetch` |
| `group:ui` | `browser`、`canvas` |
| `group:automation` | `cron`、`gateway` |
| `group:messaging` | `message` || `group:nodes` | `nodes` |
| `group:openclaw` |すべての組み込みツール (プロバイダー プラグインを除く) |

### `tools.allow` / `tools.deny`

グローバル ツールの許可/拒否ポリシー (拒否の勝利)。大文字と小文字は区別されず、`*` ワイルドカードをサポートします。 Docker サンドボックスがオフの場合でも適用されます。

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
````

### `tools.byProvider`

特定のプロバイダーまたはモデル用のツールをさらに制限します。順序: 基本プロファイル → プロバイダー プロファイル → 許可/拒否。

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
      "openai/gpt-5.2": { allow: ["group:fs", "sessions_list"] },
    },
  },
}
```

### `tools.elevated`

昇格された (ホスト) 実行アクセスを制御します。

```json5
{
  tools: {
    elevated: {
      enabled: true,
      allowFrom: {
        whatsapp: ["+15555550123"],
        discord: ["1234567890123", "987654321098765432"],
      },
    },
  },
}
```

- エージェントごとのオーバーライド (`agents.list[].tools.elevated`) は、さらに制限することしかできません。
- `/elevated on|off|ask|full` はセッションごとの状態を保存します。インラインディレクティブは単一のメッセージに適用されます。
- 昇格された `exec` がホスト上で実行され、サンドボックスがバイパスされます。

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.2"],
      },
    },
  },
}
```

### `tools.loopDetection`

ツールループの安全性チェックは **デフォルトでは無効になっています**。 `enabled: true` を設定して検出を有効にします。
設定は `tools.loopDetection` でグローバルに定義でき、`agents.list[].tools.loopDetection` でエージェントごとに上書きできます。

````json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```- `historySize`: ループ解析のために保持される最大ツール呼び出し履歴。
- `warningThreshold`: 警告に対する進行なしパターンのしきい値を繰り返します。
- `criticalThreshold`: クリティカルなループをブロックするためのより高い繰り返ししきい値。
- `globalCircuitBreakerThreshold`: 進行状況のない実行に対するハードストップのしきい値。
- `detectors.genericRepeat`: 同じツール/同じ引数の繰り返し呼び出しを警告します。
- `detectors.knownPollNoProgress`: 既知の投票ツール (`process.poll`、`command_status` など) に対して警告/ブロックします。
- `detectors.pingPong`: 交互に進行しないペアのパターンを警告/ブロックします。
- `warningThreshold >= criticalThreshold` または `criticalThreshold >= globalCircuitBreakerThreshold` の場合、検証は失敗します。

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // or BRAVE_API_KEY env
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        maxChars: 50000,
        maxCharsCap: 50000,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        userAgent: "custom-ua",
      },
    },
  },
}
````

### `tools.media`

インバウンドメディア理解 (画像/音声/ビデオ) を構成します。

```json5
{
  tools: {
    media: {
      concurrency: 2,
      audio: {
        enabled: true,
        maxBytes: 20971520,
        scope: {
          default: "deny",
          rules: [{ action: "allow", match: { chatType: "direct" } }],
        },
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          { type: "cli", command: "whisper", args: ["--model", "base", "{{MediaPath}}"] },
        ],
      },
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },
}
```

<Accordion title="メディアモデル入力フィールド">

**プロバイダーエントリ** (`type: "provider"` または省略):

- `provider`: API プロバイダー ID (`openai`、`anthropic`、`google`/`gemini`、`groq` など)
- `model`: モデル ID の上書き
- `profile` / `preferredProfile`: `auth-profiles.json` プロファイルの選択

**CLI エントリ** (`type: "cli"`):

- `command`: 実行する実行可能ファイル
- `args`: テンプレート化された引数 (`{{MediaPath}}`、`{{Prompt}}`、`{{MaxChars}}` などをサポート)

**共通フィールド:**- `capabilities`: オプションのリスト (`image`、`audio`、`video`)。デフォルト: `openai`/`anthropic`/`minimax` → 画像、`google` → 画像+音声+ビデオ、`groq` → 音声。

- `prompt`、`maxChars`、`maxBytes`、`timeoutSeconds`、`language`: エントリごとの上書き。
- 失敗は次のエントリにフォールバックします。

プロバイダー認証は標準の順序に従います: `auth-profiles.json` → 環境変数 → `models.providers.*.apiKey`。

</Accordion>

### `tools.agentToAgent`

```json5
{
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },
}
```

### `tools.sessions`

セッション ツール (`sessions_list`、`sessions_history`、`sessions_send`) の対象にできるセッションを制御します。

デフォルト: `tree` (現在のセッション + それによって生成されたセッション (サブエージェントなど))。

```json5
{
  tools: {
    sessions: {
      // "self" | "tree" | "agent" | "all"
      visibility: "tree",
    },
  },
}
```

注:

- `self`: 現在のセッション キーのみ。
- `tree`: 現在のセッション + 現在のセッションによって生成されたセッション (サブエージェント)。
- `agent`: 現在のエージェント ID に属する任意のセッション (同じエージェント ID で送信者ごとのセッションを実行する場合は、他のユーザーを含めることができます)。
- `all`: 任意のセッション。クロスエージェントターゲティングには引き続き `tools.agentToAgent` が必要です。
- サンドボックス クランプ: 現在のセッションがサンドボックス化されており、`agents.defaults.sandbox.sessionToolsVisibility="spawned"` である場合、`tools.sessions.visibility="all"` であっても、可視性は強制的に `tree` に設定されます。

### `tools.sessions_spawn`

`sessions_spawn` のインライン添付ファイルのサポートを制御します。

````json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // opt-in: set true to allow inline file attachments
        maxTotalBytes: 5242880, // 5 MB total across all files
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB per file
        retainOnSessionKeep: false, // keep attachments when cleanup="keep"
      },
    },
  },
}
```注:

- 添付ファイルは `runtime: "subagent"` でのみサポートされます。 ACP ランタイムはそれらを拒否します。
- ファイルは、`.manifest.json` を使用して、`.openclaw/attachments/<uuid>/` の子ワークスペースに実体化されます。
- 添付ファイルのコンテンツは、トランスクリプトの永続性から自動的に編集されます。
- Base64 入力は、厳密なアルファベット/パディング チェックとプリデコード サイズ ガードによって検証されます。
- ファイル権限は、ディレクトリの場合は `0700`、ファイルの場合は `0600` です。
- クリーンアップは `cleanup` ポリシーに従います。 `delete` は常に添付ファイルを削除します。 `keep` は、`retainOnSessionKeep: true` の場合にのみそれらを保持します。

### `tools.subagents`

```json5
{
  agents: {
    defaults: {
      subagents: {
        model: "minimax/MiniMax-M2.5",
        maxConcurrent: 1,
        runTimeoutSeconds: 900,
        archiveAfterMinutes: 60,
      },
    },
  },
}
````

- `model`: 生成されたサブエージェントのデフォルト モデル。省略した場合、サブエージェントは呼び出し元のモデルを継承します。
- `runTimeoutSeconds`: ツール呼び出しで `runTimeoutSeconds` が省略された場合の `sessions_spawn` のデフォルトのタイムアウト (秒)。 `0` はタイムアウトがないことを意味します。
- サブエージェントごとのツール ポリシー: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`。

---

## カスタムプロバイダーとベース URL

OpenClaw は、pi-coding-agent モデル カタログを使用します。構成内の `models.providers` または `~/.openclaw/agents/<agentId>/agent/models.json` を介してカスタム プロバイダーを追加します。

````json5
{
  models: {
    mode: "merge", // merge (default) | replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai
        models: [
          {
            id: "llama-3.1-8b",
            name: "Llama 3.1 8B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```- カスタム認証が必要な場合は、`authHeader: true` + `headers` を使用します。
- エージェント設定ルートを `OPENCLAW_AGENT_DIR` (または `PI_CODING_AGENT_DIR`) でオーバーライドします。
- 一致するプロバイダー ID のマージの優先順位:
  - 空ではないエージェント `models.json` `baseUrl` 値が優先されます。
  - 空ではないエージェント `apiKey` 値は、そのプロバイダーが現在の構成/認証プロファイル コンテキストで SecretRef で管理されていない場合にのみ優先されます。
  - SecretRef 管理プロバイダーの `apiKey` 値は、解決されたシークレットを保持するのではなく、ソース マーカー (環境参照の場合は `ENV_VAR_NAME`、ファイル/実行参照の場合は `secretref-managed`) から更新されます。
  - 空または欠落しているエージェント `apiKey`/`baseUrl` は、構成内の `models.providers` にフォールバックします。
  - マッチングモデル `contextWindow`/`maxTokens` は、明示的な構成値と暗黙的なカタログ値の間の高い値を使用します。
  - 構成で `models.json` を完全に書き換える場合は、`models.mode: "replace"` を使用します。

### プロバイダーフィールドの詳細- `models.mode`: プロバイダー カタログの動作 (`merge` または `replace`)。
- `models.providers`: プロバイダー ID をキーとするカスタム プロバイダー マップ。
- `models.providers.*.api`: アダプターを要求します (`openai-completions`、`openai-responses`、`anthropic-messages`、`google-generative-ai` など)。
- `models.providers.*.apiKey`: プロバイダーの資格情報 (SecretRef/env 置換を推奨)。
- `models.providers.*.auth`: 認証戦略 (`api-key`、`token`、`oauth`、`aws-sdk`)。
- `models.providers.*.injectNumCtxForOpenAICompat`: Ollama + `openai-completions` の場合、`options.num_ctx` をリクエストに挿入します (デフォルト: `true`)。
- `models.providers.*.authHeader`: 必要に応じて、`Authorization` ヘッダーで資格情報のトランスポートを強制します。
- `models.providers.*.baseUrl`: アップストリーム API ベース URL。
- `models.providers.*.headers`: プロキシ/テナント ルーティング用の追加の静的ヘッダー。
- `models.providers.*.models`: 明示的なプロバイダー モデル カタログ エントリ。
- `models.providers.*.models.*.compat.supportsDeveloperRole`: オプションの互換性ヒント。空ではない非ネイティブ `baseUrl` (`api.openai.com` ではないホスト) を持つ `api: "openai-completions"` の場合、OpenClaw は実行時にこれを強制的に `false` に設定します。空または省略された `baseUrl` は、デフォルトの OpenAI 動作を維持します。
- `models.bedrockDiscovery`: Bedrock 自動検出設定のルート。
- `models.bedrockDiscovery.enabled`: 検出ポーリングをオン/オフにします。
- `models.bedrockDiscovery.region`: 検出用の AWS リージョン。
- `models.bedrockDiscovery.providerFilter`: ターゲットを絞った検出のためのオプションのプロバイダー ID フィルター。
- `models.bedrockDiscovery.refreshInterval`: 検出更新のポーリング間隔。- `models.bedrockDiscovery.defaultContextWindow`: 検出されたモデルのフォールバック コンテキスト ウィンドウ。
- `models.bedrockDiscovery.defaultMaxTokens`: 検出されたモデルのフォールバック最大出力トークン。

### プロバイダーの例

<Accordion title="Cerebras (GLM 4.6 / 4.7)">

```json5
{
  env: { CEREBRAS_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: {
        primary: "cerebras/zai-glm-4.7",
        fallbacks: ["cerebras/zai-glm-4.6"],
      },
      models: {
        "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
        "cerebras/zai-glm-4.6": { alias: "GLM 4.6 (Cerebras)" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      cerebras: {
        baseUrl: "https://api.cerebras.ai/v1",
        apiKey: "${CEREBRAS_API_KEY}",
        api: "openai-completions",
        models: [
          { id: "zai-glm-4.7", name: "GLM 4.7 (Cerebras)" },
          { id: "zai-glm-4.6", name: "GLM 4.6 (Cerebras)" },
        ],
      },
    },
  },
}
````

大脳には `cerebras/zai-glm-4.7` を使用します。 Z.AI ダイレクトの `zai/glm-4.7`。

</Accordion>

<Accordion title="OpenCode Zen">

```json5
{
  agents: {
    defaults: {
      model: { primary: "opencode/claude-opus-4-6" },
      models: { "opencode/claude-opus-4-6": { alias: "Opus" } },
    },
  },
}
```

`OPENCODE_API_KEY` (または `OPENCODE_ZEN_API_KEY`) を設定します。ショートカット: `openclaw onboard --auth-choice opencode-zen`。

</Accordion>

<Accordion title="Z.AI（GLM-4.7）">

```json5
{
  agents: {
    defaults: {
      model: { primary: "zai/glm-4.7" },
      models: { "zai/glm-4.7": {} },
    },
  },
}
```

`ZAI_API_KEY` を設定します。 `z.ai/*` および `z-ai/*` は別名として受け入れられます。ショートカット: `openclaw onboard --auth-choice zai-api-key`。

- 一般エンドポイント: `https://api.z.ai/api/paas/v4`
- コーディングエンドポイント (デフォルト): `https://api.z.ai/api/coding/paas/v4`
- 一般的なエンドポイントの場合、ベース URL オーバーライドを使用してカスタム プロバイダーを定義します。

</Accordion>

<Accordion title="ムーンショットAI（キミ）">

```json5
{
  env: { MOONSHOT_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "moonshot/kimi-k2.5" },
      models: { "moonshot/kimi-k2.5": { alias: "Kimi K2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "kimi-k2.5",
            name: "Kimi K2.5",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 256000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

中国エンドポイントの場合: `baseUrl: "https://api.moonshot.cn/v1"` または `openclaw onboard --auth-choice moonshot-api-key-cn`。

</Accordion>

<Accordion title="キミコーディング">

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "kimi-coding/k2p5" },
      models: { "kimi-coding/k2p5": { alias: "Kimi K2.5" } },
    },
  },
}
```

Anthropic 互換の組み込みプロバイダー。ショートカット: `openclaw onboard --auth-choice kimi-code-api-key`。

</Accordion>

<Accordion title="合成 (人為的互換性)">

```json5
{
  env: { SYNTHETIC_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
      models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "hf:MiniMaxAI/MiniMax-M2.5",
            name: "MiniMax M2.5",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 192000,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

ベース URL は `/v1` を省略する必要があります (Anthropic クライアントが追加します)。ショートカット: `openclaw onboard --auth-choice synthetic-api-key`。

</Accordion>

<Accordion title="MiniMax M2.5 (直接)">

```json5
{
  agents: {
    defaults: {
      model: { primary: "minimax/MiniMax-M2.5" },
      models: {
        "minimax/MiniMax-M2.5": { alias: "Minimax" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      minimax: {
        baseUrl: "https://api.minimax.io/anthropic",
        apiKey: "${MINIMAX_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "MiniMax-M2.5",
            name: "MiniMax M2.5",
            reasoning: false,
            input: ["text"],
            cost: { input: 15, output: 60, cacheRead: 2, cacheWrite: 10 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

`MINIMAX_API_KEY` を設定します。ショートカット: `openclaw onboard --auth-choice minimax-api`。

</Accordion>

<Accordion title="ローカルモデル (LM Studio)">[ローカル モデル](/gateway/local-models) を参照してください。 TL;DR: 本格的なハードウェアで LM Studio Response API 経由で MiniMax M2.5 を実行します。フォールバックのためにホストされたモデルをマージしたままにします。

</Accordion>

---

## スキル

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn
    },
    entries: {
      "nano-banana-pro": {
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: バンドルされたスキルのみのオプションの許可リスト (管理/ワークスペース スキルは影響を受けません)。
- `entries.<skillKey>.enabled: false` は、バンドル/インストールされている場合でもスキルを無効にします。
- `entries.<skillKey>.apiKey`: プライマリ環境変数 (プレーンテキスト文字列または SecretRef オブジェクト) を宣言するスキルの利便性。

---

## プラグイン

````json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: [],
    load: {
      paths: ["~/Projects/oss/voice-call-extension"],
    },
    entries: {
      "voice-call": {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
        config: { provider: "twilio" },
      },
    },
  },
}
```- `~/.openclaw/extensions`、`<workspace>/.openclaw/extensions`、および `plugins.load.paths` からロードされます。
- **構成を変更するにはゲートウェイの再起動が必要です。**
- `allow`: オプションの許可リスト (リストされたプラグインのみがロードされます)。 `deny` が勝ちます。
- `plugins.entries.<id>.apiKey`: プラグインレベルの API キー便利フィールド (プラグインでサポートされている場合)。
- `plugins.entries.<id>.env`: プラグインスコープの環境変数マップ。
- `plugins.entries.<id>.hooks.allowPromptInjection`: `false` の場合、コアは `before_prompt_build` をブロックし、レガシー `before_agent_start` からのプロンプト変更フィールドを無視しますが、レガシー `modelOverride` および `providerOverride` は保持します。
- `plugins.entries.<id>.config`: プラグイン定義の設定オブジェクト (プラグイン スキーマによって検証される)。
- `plugins.slots.memory`: アクティブなメモリ プラグイン ID を選択するか、メモリ プラグインを無効にする場合は `"none"` を選択します。
- `plugins.slots.contextEngine`: アクティブなコンテキスト エンジン プラグイン ID を選択します。別のエンジンをインストールして選択しない限り、デフォルトは `"legacy"` になります。
- `plugins.installs`: `openclaw plugins update` によって使用される CLI 管理のインストール メタデータ。
  - `source`、`spec`、`sourcePath`、`installPath`、`version`、`resolvedName`、`resolvedVersion`、 `resolvedSpec`、`integrity`、`shasum`、`resolvedAt`、`installedAt`。
  - `plugins.installs.*` を管理対象状態として扱います。手動編集よりも CLI コマンドを優先します。

[プラグイン](/tools/plugin) を参照してください。

---

## ブラウザ

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "chrome",
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: true, // default trusted-network mode
      // allowPrivateNetwork: true, // legacy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
    color: "#FF4500",
    // headless: false,
    // noSandbox: false,
    // extraArgs: [],
    // relayBindHost: "0.0.0.0", // only when the extension relay must be reachable across namespaces (for example WSL2)
    // executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    // attachOnly: false,
  },
}
```- `evaluateEnabled: false` は、`act:evaluate` および `wait --fn` を無効にします。
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` は、未設定の場合はデフォルトで `true` になります (信頼されたネットワーク モデル)。
- `ssrfPolicy.dangerouslyAllowPrivateNetwork: false` を設定して、厳密なパブリックのみのブラウザ ナビゲーションを実現します。
- `ssrfPolicy.allowPrivateNetwork` はレガシー エイリアスとして引き続きサポートされます。
- 厳密モードでは、明示的な例外に `ssrfPolicy.hostnameAllowlist` および `ssrfPolicy.allowedHostnames` を使用します。
- リモート プロファイルは接続専用です (開始/停止/リセットは無効)。
- 自動検出順序: Chromium ベースの場合はデフォルトのブラウザ → Chrome → Brave → Edge → Chromium → Chrome Canary。
- 制御サービス: ループバックのみ (ポートは `gateway.port` から派生、デフォルトは `18791`)。
- `extraArgs` は、ローカルの Chromium 起動に追加の起動フラグを追加します (たとえば、
  `--disable-gpu`、ウィンドウ サイズ、またはデバッグ フラグ)。
- `relayBindHost` は、Chrome 拡張機能リレーがリッスンする場所を変更します。ループバックのみのアクセスの場合は未設定のままにしておきます。 `0.0.0.0` などの明示的な非ループバック バインド アドレスは、リレーが名前空間の境界 (WSL2 など) を越える必要があり、ホスト ネットワークがすでに信頼されている場合にのみ設定します。

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, short text, image URL, or data URI
    },
  },
}
````

- `seamColor`: ネイティブ アプリ UI クロムのアクセント カラー (トーク モードのバブルの色合いなど)。
- `assistant`: UI ID オーバーライドを制御します。アクティブなエージェント ID にフォールバックします。

---

## ゲートウェイ

```json5
{
  gateway: {
    mode: "local", // local | remote
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token", // none | token | password | trusted-proxy
      token: "your-token",
      // password: "your-password", // or OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // for mode=trusted-proxy; see /gateway/trusted-proxy-auth
      allowTailscale: true,
      rateLimit: {
        maxAttempts: 10,
        windowMs: 60000,
        lockoutMs: 300000,
        exemptLoopback: true,
      },
    },
    tailscale: {
      mode: "off", // off | serve | funnel
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // allowedOrigins: ["https://control.example.com"], // required for non-loopback Control UI
      // dangerouslyAllowHostHeaderOriginFallback: false, // dangerous Host-header origin fallback mode
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    remote: {
      url: "ws://gateway.tailnet:18789",
      transport: "ssh", // ssh | direct
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // Optional. Default false.
    allowRealIpFallback: false,
    tools: {
      // Additional /tools/invoke HTTP denies
      deny: ["browser"],
      // Remove tools from the default HTTP deny list
      allow: ["gateway"],
    },
  },
}
```

<Accordion title="ゲートウェイフィールドの詳細">- `mode`: `local` (ゲートウェイを実行) または `remote` (リモート ゲートウェイに接続)。 `local` を除き、ゲートウェイは起動を拒否します。

- `port`: WS + HTTP 用の単一の多重化ポート。優先順位: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`。
- `bind`: `auto`、`loopback` (デフォルト)、`lan` (`0.0.0.0`)、`tailnet` (Tailscale IP のみ)、または`custom`。
- **レガシー バインド エイリアス**: ホスト エイリアスではなく、`gateway.bind` (`auto`、`loopback`、`lan`、`tailnet`、`custom`) のバインド モード値を使用します。 (`0.0.0.0`、`127.0.0.1`、`localhost`、`::`、`::1`)。
- **Docker 注**: デフォルトの `loopback` バインドは、コンテナー内の `127.0.0.1` をリッスンします。 Docker ブリッジ ネットワーキング (`-p 18789:18789`) では、トラフィックは `eth0` に到着するため、ゲートウェイに到達できません。すべてのインターフェイスでリッスンするには、`--network host` を使用するか、`bind: "lan"` (または `bind: "custom"` と `customBindHost: "0.0.0.0"`) を設定します。
- **認証**: デフォルトで必須。非ループバック バインドには共有トークン/パスワードが必要です。オンボーディング ウィザードはデフォルトでトークンを生成します。- `gateway.auth.token` と `gateway.auth.password` の両方が構成されている場合 (SecretRef を含む)、`gateway.auth.mode` を明示的に `token` または `password` に設定します。起動とサービスのインストール/修復フローの両方が構成され、モードが設定されていない場合、失敗します。
- `gateway.auth.mode: "none"`: 明示的な非認証モード。信頼できるローカル ループバック設定にのみ使用してください。これはオンボーディング プロンプトでは意図的に提供されません。
- `gateway.auth.mode: "trusted-proxy"`: ID 対応リバース プロキシに認証を委任し、`gateway.trustedProxies` からの ID ヘッダーを信頼します ([信頼されたプロキシ認証](/gateway/trusted-proxy-auth) を参照)。
- `gateway.auth.allowTailscale`: `true` の場合、Tailscale Serve ID ヘッダーはコントロール UI/WebSocket 認証を満たすことができます (`tailscale whois` で検証)。 HTTP API エンドポイントでは依然としてトークン/パスワード認証が必要です。このトークンレス フローは、ゲートウェイ ホストが信頼できることを前提としています。 `tailscale.mode = "serve"` の場合、デフォルトは `true` になります。
- `gateway.auth.rateLimit`: オプションの認証失敗リミッター。クライアント IP ごとおよび認証スコープごとに適用されます (共有シークレットとデバイス トークンは個別に追跡されます)。ブロックされた試行は `429` + `Retry-After` を返します。
  - `gateway.auth.rateLimit.exemptLoopback` のデフォルトは `true` です。 localhost のトラフィック レートも意図的に制限したい場合は、`false` を設定します (テスト セットアップまたは厳密なプロキシ展開の場合)。- ブラウザー オリジンの WS 認証試行は、ループバック除外が無効になっている状態で常に抑制されます (ブラウザー ベースのローカルホスト ブルート フォースに対する多層防御)。
- `tailscale.mode`: `serve` (テールネットのみ、ループバック バインド) または `funnel` (パブリック、認証が必要)。
- `controlUi.allowedOrigins`: ゲートウェイ WebSocket 接続用の明示的なブラウザー起点許可リスト。ブラウザクライアントが非ループバックオリジンからのものであることが予期される場合に必要です。
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: ホスト ヘッダー オリジン ポリシーに意図的に依存する展開でホスト ヘッダー オリジン フォールバックを有効にする危険なモード。
- `remote.transport`: `ssh` (デフォルト) または `direct` (ws/wss)。 `direct` の場合、`remote.url` は `ws://` または `wss://` である必要があります。
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: 信頼されたプライベート ネットワーク IP へのプレーンテキスト `ws://` を許可するクライアント側のブレークグラス オーバーライド。デフォルトでは平文の場合はループバックのみになります。
- `gateway.remote.token` / `.password` は、リモート クライアントの資格情報フィールドです。ゲートウェイ認証を独自に構成することはありません。
- `gateway.auth.*` が設定されていない場合、ローカル ゲートウェイの呼び出しパスはフォールバックとして `gateway.remote.*` を使用できます。
- `trustedProxies`: TLS を終了するリバース プロキシ IP。自分が制御するプロキシのみをリストします。
- `allowRealIpFallback`: `true` の場合、`X-Forwarded-For` が欠落している場合、ゲートウェイは `X-Real-IP` を受け入れます。フェールクローズ動作のデフォルト `false`。- `gateway.tools.deny`: HTTP `POST /tools/invoke` に対して追加のツール名がブロックされました (デフォルトの拒否リストを拡張します)。
- `gateway.tools.allow`: デフォルトの HTTP 拒否リストからツール名を削除します。

</Accordion>

### OpenAI 互換エンドポイント

- チャット完了: デフォルトでは無効になっています。 `gateway.http.endpoints.chatCompletions.enabled: true` で有効にします。
- 応答 API: `gateway.http.endpoints.responses.enabled`。
- 応答 URL 入力の強化:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
- オプションの応答強化ヘッダー:
  - `gateway.http.securityHeaders.strictTransportSecurity` (制御する HTTPS オリジンに対してのみ設定します。[信頼されたプロキシ認証](/gateway/trusted-proxy-auth#tls-termination-and-hsts) を参照)

### マルチインスタンスの分離

一意のポートと状態ディレクトリを使用して、1 つのホスト上で複数のゲートウェイを実行します。

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

便利なフラグ: `--dev` (`~/.openclaw-dev` + ポート `19001` を使用)、`--profile <name>` (`~/.openclaw-<name>` を使用)。

[複数のゲートウェイ](/gateway/multiple-gateways) を参照してください。

---

## フック

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    maxBodyBytes: 262144,
    defaultSessionKey: "hook:ingress",
    allowRequestSessionKey: false,
    allowedSessionKeyPrefixes: ["hook:"],
    allowedAgentIds: ["hooks", "main"],
    presets: ["gmail"],
    transformsDir: "~/.openclaw/hooks/transforms",
    mappings: [
      {
        match: { path: "gmail" },
        action: "agent",
        agentId: "hooks",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate: "From: {{messages[0].from}}\nSubject: {{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.2-mini",
      },
    ],
  },
}
```

認証: `Authorization: Bearer <token>` または `x-openclaw-token: <token>`。

**エンドポイント:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - リクエスト ペイロードの `sessionKey` は、`hooks.allowRequestSessionKey=true` (デフォルト: `false`) の場合にのみ受け入れられます。
- `POST /hooks/<name>` → `hooks.mappings` によって解決されました

<Accordion title="マッピングの詳細">- `match.path` は、`/hooks` の後のサブパスと一致します (例: `/hooks/gmail` → `gmail`)。

- `match.source` は、汎用パスのペイロード フィールドと一致します。
- `{{messages[0].subject}}` のようなテンプレートはペイロードから読み取られます。
- `transform` は、フック アクションを返す JS/TS モジュールを指すことができます。
  - `transform.module` は相対パスであり、`hooks.transformsDir` 内に収まる必要があります (絶対パスとトラバースは拒否されます)。
- `agentId` は特定のエージェントにルーティングします。不明な ID はデフォルトに戻ります。
- `allowedAgentIds`: 明示的なルーティングを制限します (`*` または省略 = すべて許可、`[]` = すべて拒否)。
- `defaultSessionKey`: フック エージェントのオプションの固定セッション キーは、明示的な `sessionKey` なしで実行されます。
- `allowRequestSessionKey`: `/hooks/agent` 呼び出し元が `sessionKey` を設定できるようにします (デフォルト: `false`)。
- `allowedSessionKeyPrefixes`: 明示的な `sessionKey` 値 (リクエスト + マッピング) のオプションのプレフィックス許可リスト。 `["hook:"]`。
- `deliver: true` はチャネルに最終応答を送信します。 `channel` のデフォルトは `last` です。
- `model` は、このフック実行の LLM をオーバーライドします (モデル カタログが設定されている場合は許可する必要があります)。

</Accordion>

### Gmail の統合

```json5
{
  hooks: {
    gmail: {
      account: "openclaw@gmail.com",
      topic: "projects/<project-id>/topics/gog-gmail-watch",
      subscription: "gog-gmail-watch-push",
      pushToken: "shared-push-token",
      hookUrl: "http://127.0.0.1:18789/hooks/gmail",
      includeBody: true,
      maxBytes: 20000,
      renewEveryMinutes: 720,
      serve: { bind: "127.0.0.1", port: 8788, path: "/" },
      tailscale: { mode: "funnel", path: "/gmail-pubsub" },
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

- 構成されている場合、ゲートウェイは起動時に `gog gmail watch serve` を自動起動します。 `OPENCLAW_SKIP_GMAIL_WATCHER=1` を無効に設定します。
- ゲートウェイと一緒に別の `gog gmail watch serve` を実行しないでください。

---

## キャンバスホスト

```json5

{
canvasHost: {
root: "~/.openclaw/workspace/canvas",
liveReload: true,
// enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
},
}

````

- エージェントが編集可能な HTML/CSS/JS および A2UI をゲートウェイ ポートで HTTP 経由で提供します。
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- ローカルのみ: `gateway.bind: "loopback"` (デフォルト) を維持します。
- 非ループバック バインド: キャンバス ルートには、他のゲートウェイ HTTP サーフェスと同様に、ゲートウェイ認証 (トークン/パスワード/信頼できるプロキシ) が必要です。
- ノード WebView は通常、認証ヘッダーを送信しません。ノードがペアリングされて接続されると、ゲートウェイはキャンバス/A2UI アクセス用にノード スコープの機能 URL をアドバタイズします。
- 機能 URL はアクティブ ノード WS セッションにバインドされており、すぐに期限切れになります。 IP ベースのフォールバックは使用されません。
- ライブリロードクライアントを提供される HTML に挿入します。
- 空の場合、スターター `index.html` を自動作成します。
- `/__openclaw__/a2ui/` で A2UI も提供します。
- 変更にはゲートウェイの再起動が必要です。
- 大きなディレクトリまたは `EMFILE` エラーのライブ リロードを無効にします。

---

## 発見

### mDNS (ボンジュール)

```json5
{
  discovery: {
    mdns: {
      mode: "minimal", // minimal | full | off
    },
  },
}
````

- `minimal` (デフォルト): TXT レコードから `cliPath` + `sshPort` を省略します。
- `full`: `cliPath` + `sshPort` を含みます。
- ホスト名のデフォルトは `openclaw` です。 `OPENCLAW_MDNS_HOSTNAME` でオーバーライドします。

### 広域 (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

ユニキャスト DNS-SD ゾーンを `~/.openclaw/dns/` に書き込みます。クロスネットワーク検出の場合は、DNS サーバー (CoreDNS 推奨) + Tailscale Split DNS とペアリングします。

セットアップ: `openclaw dns setup --apply`。

---

## 環境

### `env` (インライン環境変数)```json5

{
env: {
OPENROUTER_API_KEY: "sk-or-...",
vars: {
GROQ_API_KEY: "gsk-...",
},
shellEnv: {
enabled: true,
timeoutMs: 15000,
},
},
}

````

- インライン環境変数は、プロセス環境にキーがない場合にのみ適用されます。
- `.env` ファイル: CWD `.env` + `~/.openclaw/.env` (どちらも既存の変数をオーバーライドしません)。
- `shellEnv`: ログイン シェル プロファイルから不足している予期されたキーをインポートします。
- 完全な優先順位については、[環境](/help/environment) を参照してください。

### 環境変数の置換

`${VAR_NAME}` を使用して、構成文字列内の環境変数を参照します。

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
````

- 大文字の名前のみが一致しました: `[A-Z_][A-Z0-9_]*`。
- 変数が欠落しているか空であると、構成ロード時にエラーがスローされます。
- リテラル `${VAR}` の場合は、`${VAR}` でエスケープします。
- `$include` で動作します。

---

## 秘密

Secret ref は追加的です。プレーンテキストの値は引き続き機能します。

### `SecretRef`

1 つのオブジェクト シェイプを使用します。

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

検証:

- `provider` パターン:
- `source: "env"` ID パターン: `^[A-Z][A-Z0-9_]{0,127}# 構成リファレンス

`~/.openclaw/openclaw.json` で使用可能なすべてのフィールド。タスク指向の概要については、「[構成](/gateway/configuration)」を参照してください。

構成形式は **JSON5** (コメント + 末尾のカンマは許可されます) です。すべてのフィールドはオプションです。省略された場合、OpenClaw は安全なデフォルトを使用します。

---

## チャンネル

各チャネルは、その構成セクションが存在すると自動的に開始されます (`enabled: false` を除く)。

### DMとグループアクセス

すべてのチャネルは DM ポリシーとグループ ポリシーをサポートします。

| DMポリシー               | 行動                                                                                   |
| ------------------------ | -------------------------------------------------------------------------------------- | --- | ---------------- | ---- |
| `pairing` (デフォルト)   | 不明な送信者はワンタイムペアリングコードを受け取ります。所有者は承認する必要があります |
| `allowlist`              | `allowFrom` (またはペアの許可ストア) の送信者のみ                                      |
| `open`                   | すべての受信 DM を許可する (`allowFrom: ["*"]` が必要)                                 |
| `disabled`               | すべての受信 DM を無視する                                                             |     | グループポリシー | 行動 |
| ---------------------    | --------------------------------------------------------                               |
| `allowlist` (デフォルト) | 設定された許可リストに一致するグループのみ                                             |
| `open`                   | グループ許可リストをバイパスします (メンションゲートは引き続き適用されます)。          |
| `disabled`               | すべてのグループ/ルーム メッセージをブロックする                                       |

<Note>
`channels.defaults.groupPolicy` は、プロバイダーの `groupPolicy` が設定されていない場合のデフォルトを設定します。
ペアリング コードは 1 時間後に期限切れになります。保留中の DM ペアリング要求の上限は、**チャネルあたり 3** です。
プロバイダー ブロックが完全に欠落している (`channels.<provider>` が欠落している) 場合、ランタイム グループ ポリシーは起動警告とともに `allowlist` (フェールクローズ) にフォールバックします。
</Note>

### チャネルモデルのオーバーライド

`channels.modelByChannel` を使用して、特定のチャネル ID をモデルに固定します。値は `provider/model` または構成されたモデルのエイリアスを受け入れます。チャネル マッピングは、セッションにモデル オーバーライドがまだない場合 (たとえば、`/model` によって設定されている場合) に適用されます。

```json5
{
  channels: {
    modelByChannel: {
      discord: {
        "123456789012345678": "anthropic/claude-opus-4-6",
      },
      slack: {
        C1234567890: "openai/gpt-4.1",
      },
      telegram: {
        "-1001234567890": "openai/gpt-4.1-mini",
        "-1001234567890:topic:99": "anthropic/claude-sonnet-4-6",
      },
    },
  },
}
```

### チャネルのデフォルトとハートビート

プロバイダー間で共有されるグループ ポリシーとハートビートの動作には、`channels.defaults` を使用します。

````json5
{
  channels: {
    defaults: {
      groupPolicy: "allowlist", // open | allowlist | disabled
      heartbeat: {
        showOk: false,
        showAlerts: true,
        useIndicator: true,
      },
    },
  },
}
```- `channels.defaults.groupPolicy`: プロバイダーレベルの `groupPolicy` が設定されていない場合のフォールバック グループ ポリシー。
- `channels.defaults.heartbeat.showOk`: ハートビート出力に正常なチャネルのステータスを含めます。
- `channels.defaults.heartbeat.showAlerts`: ハートビート出力に劣化/エラーステータスを含めます。
- `channels.defaults.heartbeat.useIndicator`: コンパクトなインジケーター スタイルのハートビート出力をレンダリングします。

### WhatsApp

WhatsApp は、ゲートウェイの Web チャネル (Baileys Web) を通じて実行されます。リンクされたセッションが存在する場合、自動的に開始されます。

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      chunkMode: "length", // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // blue ticks (false in self-chat mode)
      groups: {
        "*": { requireMention: true },
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
  web: {
    enabled: true,
    heartbeatSeconds: 60,
    reconnect: {
      initialMs: 2000,
      maxMs: 120000,
      factor: 1.4,
      jitter: 0.2,
      maxAttempts: 0,
    },
  },
}
````

<Accordion title="マルチアカウント WhatsApp">

```json5
{
  channels: {
    whatsapp: {
      accounts: {
        default: {},
        personal: {},
        biz: {
          // authDir: "~/.openclaw/credentials/whatsapp/biz",
        },
      },
    },
  },
}
```

- アウトバウンド コマンドは、デフォルトでアカウント `default` が存在する場合に使用されます。それ以外の場合は、最初に設定されたアカウント ID (ソート済み)。
- オプションの `channels.whatsapp.defaultAccount` は、構成されたアカウント ID と一致する場合にフォールバックのデフォルトのアカウント選択をオーバーライドします。
- 従来の単一アカウントの Baileys 認証ディレクトリは、`openclaw doctor` によって `whatsapp/default` に移行されます。
- アカウントごとの上書き: `channels.whatsapp.accounts.<id>.sendReadReceipts`、`channels.whatsapp.accounts.<id>.dmPolicy`、`channels.whatsapp.accounts.<id>.allowFrom`。

</Accordion>

### 電報

````json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "your-bot-token",
      dmPolicy: "pairing",
      allowFrom: ["tg:123456789"],
      groups: {
        "*": { requireMention: true },
        "-1001234567890": {
          allowFrom: ["@admin"],
          systemPrompt: "Keep answers brief.",
          topics: {
            "99": {
              requireMention: false,
              skills: ["search"],
              systemPrompt: "Stay on topic.",
            },
          },
        },
      },
      customCommands: [
        { command: "backup", description: "Git backup" },
        { command: "generate", description: "Create an image" },
      ],
      historyLimit: 50,
      replyToMode: "first", // off | first | all
      linkPreview: true,
      streaming: "partial", // off | partial | block | progress (default: off)
      actions: { reactions: true, sendMessage: true },
      reactionNotifications: "own", // off | own | all
      mediaMaxMb: 100,
      retry: {
        attempts: 3,
        minDelayMs: 400,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
      network: {
        autoSelectFamily: true,
        dnsResultOrder: "ipv4first",
      },
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook",
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook",
    },
  },
}
```- ボット トークン: `channels.telegram.botToken` または `channels.telegram.tokenFile`、`TELEGRAM_BOT_TOKEN` はデフォルト アカウントのフォールバックとして使用されます。
- オプションの `channels.telegram.defaultAccount` は、構成されたアカウント ID と一致する場合、デフォルトのアカウント選択をオーバーライドします。
- マルチアカウント設定 (2 つ以上のアカウント ID) では、明示的なデフォルト (`channels.telegram.defaultAccount` または `channels.telegram.accounts.default`) を設定して、フォールバック ルーティングを回避します。 `openclaw doctor` は、これが欠落しているか無効な場合に警告します。
- `configWrites: false` は、Telegram が開始する設定の書き込みをブロックします (スーパーグループ ID の移行、`/config set|unset`)。
- `type: "acp"` を含むトップレベルの `bindings[]` エントリは、フォーラム トピックの永続的な ACP バインディングを構成します (`match.peer.id` の正規の `chatId:topic:topicId` を使用します)。フィールド セマンティクスは [ACP エージェント](/tools/acp-agents#channel-specific-settings) で共有されます。
- Telegram ストリーム プレビューは `sendMessage` + `editMessageText` を使用します (ダイレクト チャットおよびグループ チャットで機能します)。
- 再試行ポリシー: [再試行ポリシー](/concepts/retry) を参照してください。

### 不和

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: "your-bot-token",
      mediaMaxMb: 8,
      allowBots: false,
      actions: {
        reactions: true,
        stickers: true,
        polls: true,
        permissions: true,
        messages: true,
        threads: true,
        pins: true,
        search: true,
        memberInfo: true,
        roleInfo: true,
        roles: false,
        channelInfo: true,
        voiceStatus: true,
        events: true,
        moderation: false,
      },
      replyToMode: "off", // off | first | all
      dmPolicy: "pairing",
      allowFrom: ["1234567890", "123456789012345678"],
      dm: { enabled: true, groupEnabled: false, groupChannels: ["openclaw-dm"] },
      guilds: {
        "123456789012345678": {
          slug: "friends-of-openclaw",
          requireMention: false,
          ignoreOtherMentions: true,
          reactionNotifications: "own",
          users: ["987654321098765432"],
          channels: {
            general: { allow: true },
            help: {
              allow: true,
              requireMention: true,
              users: ["987654321098765432"],
              skills: ["docs"],
              systemPrompt: "Short answers only.",
            },
          },
        },
      },
      historyLimit: 20,
      textChunkLimit: 2000,
      chunkMode: "length", // length | newline
      streaming: "off", // off | partial | block | progress (progress maps to partial on Discord)
      maxLinesPerMessage: 17,
      ui: {
        components: {
          accentColor: "#5865F2",
        },
      },
      threadBindings: {
        enabled: true,
        idleHours: 24,
        maxAgeHours: 0,
        spawnSubagentSessions: false, // opt-in for sessions_spawn({ thread: true })
      },
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
      retry: {
        attempts: 3,
        minDelayMs: 500,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
  },
}
```- トークン: `channels.discord.token`、デフォルト アカウントのフォールバックとして `DISCORD_BOT_TOKEN`。
- オプションの `channels.discord.defaultAccount` は、設定されたアカウント ID と一致する場合、デフォルトのアカウント選択をオーバーライドします。
- 配信ターゲットには `user:<id>` (DM) または `channel:<id>` (ギルド チャネル) を使用します。裸の数値 ID は拒否されます。
- ギルド スラッグは小文字でスペースが `-` に置き換えられます。チャンネルキーはスラッグ名 (`#` ではありません) を使用します。ギルドIDを優先します。
- ボットが作成したメッセージはデフォルトでは無視されます。 `allowBots: true` はそれらを有効にします。 `allowBots: "mentions"` を使用して、ボットに言及するボット メッセージのみを受け入れます (独自のメッセージはまだフィルターされています)。
- `channels.discord.guilds.<id>.ignoreOtherMentions` (およびチャネル オーバーライド) は、別のユーザーまたはロールに言及するメッセージを削除しますが、ボットには言及しません (@everyone/@here を除く)。
- `maxLinesPerMessage` (デフォルトは 17) は、2000 文字未満の場合でも長いメッセージを分割します。
- `channels.discord.threadBindings` は、Discord のスレッドバインドされたルーティングを制御します。
  - `enabled`: スレッドバインドされたセッション機能の Discord オーバーライド (`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`、バインド配信/ルーティング)
  - `idleHours`: 非アクティブ状態が数時間で自動フォーカス解除されるための Discord オーバーライド (`0` は無効になります)
  - `maxAgeHours`: 時間単位のハードマックス年齢の Discord オーバーライド (`0` は無効になります)
  - `spawnSubagentSessions`: `sessions_spawn({ thread: true })` 自動スレッド作成/バインドのオプトイン スイッチ- `type: "acp"` を含むトップレベルの `bindings[]` エントリは、チャネルとスレッドの永続的な ACP バインディングを構成します (`match.peer.id` のチャネル/スレッド ID を使用します)。フィールド セマンティクスは [ACP エージェント](/tools/acp-agents#channel-specific-settings) で共有されます。
- `channels.discord.ui.components.accentColor` は、Discord コンポーネント v2 コンテナのアクセント カラーを設定します。
- `channels.discord.voice` は、Discord 音声チャネル会話とオプションの自動参加 + TTS オーバーライドを有効にします。
- `channels.discord.voice.daveEncryption` および `channels.discord.voice.decryptionFailureTolerance` は `@discordjs/voice` DAVE オプションに渡されます (デフォルトでは `true` および `24`)。
- OpenClaw はさらに、繰り返し復号化に失敗した後、音声セッションから離脱/再参加することで音声受信の回復を試みます。
- `channels.discord.streaming` は正規ストリーム モード キーです。従来の `streamMode` およびブール値 `streaming` 値は自動移行されます。
- `channels.discord.autoPresence` は、実行時の可用性をボットの存在にマップし (正常 => オンライン、劣化 => アイドル、消耗 => 停止)、オプションでステータス テキストの上書きを許可します。
- `channels.discord.dangerouslyAllowNameMatching` は、変更可能な名前/タグの一致を再度有効にします (ブレークグラス互換モード)。

**反応通知モード:** `off` (なし)、`own` (ボットのメッセージ、デフォルト)、`all` (すべてのメッセージ)、`allowlist` (すべてのメッセージの `guilds.<id>.users` から)。

### Google チャット

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      audienceType: "app-url", // app-url | project-number
      audience: "https://gateway.example.com/googlechat",
      webhookPath: "/googlechat",
      botUser: "users/1234567890",
      dm: {
        enabled: true,
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": { allow: true, requireMention: true },
      },
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```- サービス アカウント JSON: インライン (`serviceAccount`) またはファイルベース (`serviceAccountFile`)。
- サービス アカウント SecretRef もサポートされています (`serviceAccountRef`)。
- 環境フォールバック: `GOOGLE_CHAT_SERVICE_ACCOUNT` または `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`。
- 配信ターゲットには `spaces/<spaceId>` または `users/<userId>` を使用します。
- `channels.googlechat.dangerouslyAllowNameMatching` は、変更可能な電子メール プリンシパルの一致を再度有効にします (ブレークグラス互換モード)。

### スラック

```json5
{
  channels: {
    slack: {
      enabled: true,
      botToken: "xoxb-...",
      appToken: "xapp-...",
      dmPolicy: "pairing",
      allowFrom: ["U123", "U456", "*"],
      dm: { enabled: true, groupEnabled: false, groupChannels: ["G123"] },
      channels: {
        C123: { allow: true, requireMention: true, allowBots: false },
        "#general": {
          allow: true,
          requireMention: true,
          allowBots: false,
          users: ["U123"],
          skills: ["docs"],
          systemPrompt: "Short answers only.",
        },
      },
      historyLimit: 50,
      allowBots: false,
      reactionNotifications: "own",
      reactionAllowlist: ["U123"],
      replyToMode: "off", // off | first | all
      thread: {
        historyScope: "thread", // thread | channel
        inheritParent: false,
      },
      actions: {
        reactions: true,
        messages: true,
        pins: true,
        memberInfo: true,
        emojiList: true,
      },
      slashCommand: {
        enabled: true,
        name: "openclaw",
        sessionPrefix: "slack:slash",
        ephemeral: true,
      },
      typingReaction: "hourglass_flowing_sand",
      textChunkLimit: 4000,
      chunkMode: "length",
      streaming: "partial", // off | partial | block | progress (preview mode)
      nativeStreaming: true, // use Slack native streaming API when streaming=partial
      mediaMaxMb: 20,
    },
  },
}
````

- **ソケット モード**には、`botToken` と `appToken` の両方が必要です (デフォルトのアカウント環境フォールバックの場合は `SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN`)。
- **HTTP モード** には、`botToken` と `signingSecret` (ルートまたはアカウントごと) が必要です。
- `configWrites: false` は、Slack によって開始される設定の書き込みをブロックします。
- オプションの `channels.slack.defaultAccount` は、設定されたアカウント ID と一致する場合、デフォルトのアカウント選択をオーバーライドします。
- `channels.slack.streaming` は正規ストリーム モード キーです。従来の `streamMode` 値とブール値 `streaming` 値は自動移行されます。
- 配信ターゲットには `user:<id>` (DM) または `channel:<id>` を使用します。

**反応通知モード:** `off`、`own` (デフォルト)、`all`、`allowlist` (`reactionAllowlist` から)。

**スレッド セッションの分離:** `thread.historyScope` はスレッドごと (デフォルト)、またはチャネル全体で共有されます。 `thread.inheritParent` は、親チャネルのトランスクリプトを新しいスレッドにコピーします。- `typingReaction` は、返信の実行中に受信 Slack メッセージに一時的な反応を追加し、完了時に削除します。 `"hourglass_flowing_sand"` などの Slack 絵文字ショートコードを使用します。

| アクショングループ | デフォルト | メモ                    |
| ------------------ | ---------- | ----------------------- |
| 反応               | 有効       | 反応 + 反応のリスト     |
| メッセージ         | 有効       | 読み取り/送信/編集/削除 |
| ピン               | 有効       | 固定/固定解除/リスト    |
| メンバー情報       | 有効       | 会員情報                |
| 絵文字リスト       | 有効       | カスタム絵文字リスト    |

### 最も重要なこと

Mattermost はプラグインとして出荷されます: `openclaw plugins install @openclaw/mattermost`。

```json5
{
  channels: {
    mattermost: {
      enabled: true,
      botToken: "mm-token",
      baseUrl: "https://chat.example.com",
      dmPolicy: "pairing",
      chatmode: "oncall", // oncall | onmessage | onchar
      oncharPrefixes: [">", "!"],
      commands: {
        native: true, // opt-in
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Optional explicit URL for reverse-proxy/public deployments
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

チャット モード: `oncall` (@ メンションで応答、デフォルト)、`onmessage` (すべてのメッセージ)、`onchar` (トリガー プレフィックスで始まるメッセージ)。

Mattermost ネイティブ コマンドが有効な場合:- `commands.callbackPath` は、完全な URL ではなく、パス (`/api/channels/mattermost/command` など) である必要があります。

- `commands.callbackUrl` は OpenClaw ゲートウェイ エンドポイントに解決され、Mattermost サーバーから到達可能である必要があります。
- プライベート/テールネット/内部コールバック ホストの場合、Mattermost は必要な場合があります
  `ServiceSettings.AllowedUntrustedInternalConnections` には、コールバック ホスト/ドメインが含まれます。
  完全な URL ではなく、ホスト/ドメインの値を使用します。
- `channels.mattermost.configWrites`: Mattermost が開始する構成書き込みを許可または拒否します。
- `channels.mattermost.requireMention`: チャネルで返信する前に `@mention` が必要です。
- オプションの `channels.mattermost.defaultAccount` は、構成されたアカウント ID と一致する場合、デフォルトのアカウント選択をオーバーライドします。

### 信号

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // optional account binding
      dmPolicy: "pairing",
      allowFrom: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      configWrites: true,
      reactionNotifications: "own", // off | own | all | allowlist
      reactionAllowlist: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      historyLimit: 50,
    },
  },
}
```

**反応通知モード:** `off`、`own` (デフォルト)、`all`、`allowlist` (`reactionAllowlist` から)。

- `channels.signal.account`: チャネルの起動を特定の Signal アカウント ID に固定します。
- `channels.signal.configWrites`: Signal によって開始される構成書き込みを許可または拒否します。
- オプションの `channels.signal.defaultAccount` は、設定されたアカウント ID と一致する場合、デフォルトのアカウント選択をオーバーライドします。

### ブルーバブルズ

BlueBubbles が推奨される iMessage パスです (プラグインベース、`channels.bluebubbles` で構成)。

````json5
{
  channels: {
    bluebubbles: {
      enabled: true,
      dmPolicy: "pairing",
      // serverUrl, password, webhookPath, group controls, and advanced actions:
      // see /channels/bluebubbles
    },
  },
}
```- ここで取り上げるコアキーのパス: `channels.bluebubbles`、`channels.bluebubbles.dmPolicy`。
- オプションの `channels.bluebubbles.defaultAccount` は、構成されたアカウント ID と一致する場合、デフォルトのアカウント選択をオーバーライドします。
- 完全な BlueBubbles チャネル構成は [BlueBubbles](/channels/bluebubbles) に文書化されています。

### iメッセージ

OpenClaw は `imsg rpc` (標準入出力上の JSON-RPC) を生成します。デーモンやポートは必要ありません。

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "imsg",
      dbPath: "~/Library/Messages/chat.db",
      remoteHost: "user@gateway-host",
      dmPolicy: "pairing",
      allowFrom: ["+15555550123", "user@example.com", "chat_id:123"],
      historyLimit: 50,
      includeAttachments: false,
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      mediaMaxMb: 16,
      service: "auto",
      region: "US",
    },
  },
}
````

- オプションの `channels.imessage.defaultAccount` は、設定されたアカウント ID と一致する場合、デフォルトのアカウント選択をオーバーライドします。

- メッセージ DB へのフルディスク アクセスが必要です。
- `chat_id:<id>` ターゲットを優先します。チャットを一覧表示するには、`imsg chats --limit 20` を使用します。
- `cliPath` は SSH ラッパーを指すことができます。 SCP 添付ファイルを取得するために `remoteHost` (`host` または `user@host`) を設定します。
- `attachmentRoots` および `remoteAttachmentRoots` は、受信添付ファイル パスを制限します (デフォルト: `/Users/*/Library/Messages/Attachments`)。
- SCP は厳密なホスト キー チェックを使用するため、リレー ホスト キーが `~/.ssh/known_hosts` にすでに存在していることを確認してください。
- `channels.imessage.configWrites`: iMessage によって開始される設定の書き込みを許可または拒否します。

<Accordion title="iMessage SSH ラッパーの例">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Microsoft Teams

Microsoft Teams は拡張機能をサポートしており、`channels.msteams` で構成されています。

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, team/channel policies:
      // see /channels/msteams
    },
  },
}
```

- ここで取り上げるコアキーのパス: `channels.msteams`、`channels.msteams.configWrites`。
- 完全な Teams 構成 (資格情報、Webhook、DM/グループ ポリシー、チームごと/チャネルごとのオーバーライド) は、[Microsoft Teams](/channels/msteams) に文書化されています。### IRC

IRC は拡張機能をサポートしており、`channels.irc` で構成されています。

```json5
{
  channels: {
    irc: {
      enabled: true,
      dmPolicy: "pairing",
      configWrites: true,
      nickserv: {
        enabled: true,
        service: "NickServ",
        password: "${IRC_NICKSERV_PASSWORD}",
        register: false,
        registerEmail: "bot@example.com",
      },
    },
  },
}
```

- ここで説明するコアキーのパス: `channels.irc`、`channels.irc.dmPolicy`、`channels.irc.configWrites`、`channels.irc.nickserv.*`。
- オプションの `channels.irc.defaultAccount` は、構成されたアカウント ID と一致する場合、デフォルトのアカウント選択をオーバーライドします。
- 完全な IRC チャネル設定 (ホスト/ポート/TLS/チャネル/許可リスト/メンション ゲーティング) は [IRC](/channels/irc) に文書化されています。

### マルチアカウント (すべてのチャネル)

チャネルごとに複数のアカウントを実行します (それぞれに独自の `accountId` があります)。

````json5
{
  channels: {
    telegram: {
      accounts: {
        default: {
          name: "Primary bot",
          botToken: "123456:ABC...",
        },
        alerts: {
          name: "Alerts bot",
          botToken: "987654:XYZ...",
        },
      },
    },
  },
}
```- `default` は、`accountId` が省略された場合に使用されます (CLI + ルーティング)。
- 環境トークンは **デフォルト** アカウントにのみ適用されます。
- 基本チャネル設定は、アカウントごとに上書きされない限り、すべてのアカウントに適用されます。
- `bindings[].match.accountId` を使用して、各アカウントを別のエージェントにルーティングします。
- 単一アカウントのトップレベルのチャネル設定を使用しているときに、`openclaw channels add` (またはチャネルのオンボーディング) 経由でデフォルト以外のアカウントを追加すると、OpenClaw は最初にアカウントスコープのトップレベルの単一アカウントの値を `channels.<channel>.accounts.default` に移動し、元のアカウントが機能し続けるようにします。
- 既存のチャネルのみのバインディング (`accountId` なし) はデフォルトのアカウントと一致し続けます。アカウント スコープのバインディングはオプションのままです。
- `openclaw doctor --fix` は、名前付きアカウントが存在するが `default` が欠落している場合、アカウントをスコープとする最上位の単一アカウントの値を `accounts.default` に移動することにより、混合シェイプも修復します。

### その他の拡張チャネル

多くの拡張チャネルは `channels.<id>` として構成され、専用チャネル ページ (Feishu、Matrix、LINE、Nostr、Zalo、Nextcloud Talk、Synology Chat、Twitch など) に文書化されています。
完全なチャネル インデックスを参照してください: [チャネル](/channels)。

### グループチャットのメンションゲート

グループ メッセージはデフォルトで **メンションが必要** (メタデータのメンションまたは正規表現パターン) です。 WhatsApp、Telegram、Discord、Google Chat、および iMessage のグループ チャットに適用されます。

**メンションの種類:**- **メタデータのメンション**: ネイティブ プラットフォームの @-メンション。 WhatsApp セルフチャット モードでは無視されます。
- **テキスト パターン**: `agents.list[].groupChat.mentionPatterns` の正規表現パターン。常にチェックされています。
- メンション ゲートは、検出が可能な場合 (ネイティブ メンションまたは少なくとも 1 つのパターン) にのみ適用されます。

```json5
{
  messages: {
    groupChat: { historyLimit: 50 },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
````

`messages.groupChat.historyLimit` はグローバルなデフォルトを設定します。チャネルは `channels.<channel>.historyLimit` (またはアカウントごと) でオーバーライドできます。 `0` を無効に設定します。

#### DM 履歴の制限

```json5
{
  channels: {
    telegram: {
      dmHistoryLimit: 30,
      dms: {
        "123456789": { historyLimit: 50 },
      },
    },
  },
}
```

解決策: DM ごとのオーバーライド → プロバイダーのデフォルト → 制限なし (すべて保持)。

サポートされている: `telegram`、`whatsapp`、`discord`、`slack`、`signal`、`imessage`、`msteams`。

#### セルフチャットモード

セルフチャット モードを有効にするには、`allowFrom` に独自の番号を含めます (ネイティブの @-メンションを無視し、テキスト パターンにのみ応答します)。

```json5
{
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: { "*": { requireMention: true } },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: { mentionPatterns: ["reisponde", "@openclaw"] },
      },
    ],
  },
}
```

### コマンド (チャット コマンドの処理)

```json5
{
  commands: {
    native: "auto", // register native commands when supported
    text: true, // parse /commands in chat messages
    bash: false, // allow ! (alias: /bash)
    bashForegroundMs: 2000,
    config: false, // allow /config
    debug: false, // allow /debug
    restart: false, // allow /restart + gateway restart tool
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

<Accordion title="コマンド詳細">- テキスト コマンドは、先頭に `/` が付いた **スタンドアロン** メッセージである必要があります。

- `native: "auto"` は、Discord/Telegram のネイティブ コマンドをオンにし、Slack をオフのままにします。
- チャネルごとのオーバーライド: `channels.discord.commands.native` (ブール値または `"auto"`)。 `false` は、以前に登録されたコマンドをクリアします。
- `channels.telegram.customCommands` は、Telegram ボット メニュー エントリを追加します。
- `bash: true` は、ホスト シェルの `! <cmd>` を有効にします。 `tools.elevated.enabled` と `tools.elevated.allowFrom.<channel>` の送信者が必要です。
- `config: true` は `/config` を有効にします (`openclaw.json` の読み取り/書き込み)。ゲートウェイ `chat.send` クライアントの場合、永続的な `/config set|unset` 書き込みには `operator.admin` も必要です。読み取り専用 `/config show` は、通常の書き込みスコープのオペレーター クライアントで引き続き使用できます。
- `channels.<provider>.configWrites` はチャネルごとに構成の変更をゲートします (デフォルト: true)。
- `allowFrom` はプロバイダーごとです。設定すると、**唯一**の認証ソースになります (チャネル許可リスト/ペアリングと `useAccessGroups` は無視されます)。
- `useAccessGroups: false` を使用すると、`allowFrom` が設定されていない場合に、コマンドがアクセス グループ ポリシーをバイパスできます。

</Accordion>

---

## エージェントのデフォルト

### `agents.defaults.workspace`

デフォルト: `~/.openclaw/workspace`。

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

システム プロンプトのランタイム行に表示されるオプションのリポジトリ ルート。設定されていない場合、OpenClaw はワークスペースから上に向かって歩くことによって自動検出します。

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skipBootstrap`ワークスペース ブートストラップ ファイル (`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、 `BOOTSTRAP.md`)

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.bootstrapMaxChars`

切り詰められる前のワークスペース ブートストラップ ファイルあたりの最大文字数。デフォルト: `20000`。

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

すべてのワークスペース ブートストラップ ファイルに挿入される最大合計文字数。デフォルト: `150000`。

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 150000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

ブートストラップ コンテキストが切り詰められた場合に、エージェントに表示される警告テキストを制御します。
デフォルト: `"once"`。

- `"off"`: システム プロンプトに警告テキストを挿入しないでください。
- `"once"`: 一意の切り捨て署名ごとに 1 回警告を挿入します (推奨)。
- `"always"`: 切り捨てが存在する場合、実行ごとに警告を挿入します。

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### `agents.defaults.imageMaxDimensionPx`

プロバイダー呼び出し前のトランスクリプト/ツール画像ブロック内の最長画像側の最大ピクセル サイズ。
デフォルト: `1200`。

通常、値を低くすると、ビジョン トークンの使用量が減り、スクリーンショットを大量に使用する実行の場合に要求されるペイロード サイズが減ります。
値を大きくすると、視覚的な詳細がより多く保持されます。

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

システム プロンプト コンテキストのタイムゾーン (メッセージ タイムスタンプではありません)。ホストのタイムゾーンにフォールバックします。

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

システムプロンプトの時刻形式。デフォルト: `auto` (OS 設定)。

````json5
{
  agents: { defaults: { timeFormat: "auto" } }, // auto | 12 | 24
}
```### `agents.defaults.model`

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "minimax/MiniMax-M2.5": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.5"],
      },
      imageModel: {
        primary: "openrouter/qwen/qwen-2.5-vl-72b-instruct:free",
        fallbacks: ["openrouter/google/gemini-2.0-flash-vision:free"],
      },
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5-mini"],
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
      elevatedDefault: "on",
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      contextTokens: 200000,
      maxConcurrent: 3,
    },
  },
}
```- `model`: 文字列 (`"provider/model"`) またはオブジェクト (`{ primary, fallbacks }`) を受け入れます。
  ・文字列形式はプライマリモデルのみ設定します。
  - オブジェクト形式は、プライマリおよび順序付けされたフェイルオーバー モデルを設定します。
- `imageModel`: 文字列 (`"provider/model"`) またはオブジェクト (`{ primary, fallbacks }`) を受け入れます。
  - `image` ツール パスによってビジョン モデル構成として使用されます。
  - 選択/デフォルトのモデルが画像入力を受け入れられない場合のフォールバック ルーティングとしても使用されます。
- `pdfModel`: 文字列 (`"provider/model"`) またはオブジェクト (`{ primary, fallbacks }`) を受け入れます。
  - モデル ルーティング用の `pdf` ツールによって使用されます。
  - 省略した場合、PDF ツールは `imageModel` にフォールバックし、その後ベストエフォート型プロバイダーのデフォルトにフォールバックします。
- `pdfMaxBytesMb`: 呼び出し時に `maxBytesMb` が渡されない場合の、`pdf` ツールのデフォルトの PDF サイズ制限。
- `pdfMaxPages`: `pdf` ツールの抽出フォールバック モードで考慮されるデフォルトの最大ページ数。
- `model.primary`: `provider/model` の形式 (例: `anthropic/claude-opus-4-6`)。プロバイダーを省略した場合、OpenClaw は `anthropic` (非推奨) を想定します。
- `models`: `/model` の構成されたモデル カタログと許可リスト。各エントリには、`alias` (ショートカット) および `params` (プロバイダー固有、たとえば、`temperature`、`maxTokens`、`cacheRetention`、`context1m`) を含めることができます。- `params` マージ優先順位 (構成): `agents.defaults.models["provider/model"].params` がベースで、その後 `agents.list[].params` (エージェント ID と一致する) がキーによってオーバーライドされます。
- これらのフィールドを変更する構成ライター (`/models set`、`/models set-image`、およびフォールバック追加/削除コマンドなど) は、可能であれば正規のオブジェクト形式を保存し、既存のフォールバック リストを保存します。
- `maxConcurrent`: 最大並列エージェントはセッション間で実行されます (各セッションはまだシリアル化されています)。デフォルト: 1。

**組み込みのエイリアスの短縮表記** (モデルが `agents.defaults.models` の場合にのみ適用されます):

|別名 |モデル |
| ------------------- | -------------------------------------- |
| `opus` | `anthropic/claude-opus-4-6` |
| `sonnet` | `anthropic/claude-sonnet-4-6` |
| `gpt` | `openai/gpt-5.4` |
| `gpt-mini` | `openai/gpt-5-mini` |
| `gemini` | `google/gemini-3.1-pro-preview` |
| `gemini-flash` | `google/gemini-3-flash-preview` |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview` |

設定したエイリアスは常にデフォルトよりも優先されます。Z.AI GLM-4.x モデルは、`--thinking off` を設定するか、`agents.defaults.models["zai/<model>"].params.thinking` を自分で定義しない限り、思考モードを自動的に有効にします。
Z.AI モデルでは、ツール呼び出しストリーミングに対してデフォルトで `tool_stream` が有効になっています。無効にするには、`agents.defaults.models["zai/<model>"].params.tool_stream` を `false` に設定します。
Anthropic Claude 4.6 モデルは、明示的思考レベルが設定されていない場合、デフォルトで `adaptive` 思考になります。

### `agents.defaults.cliBackends`

テキストのみのフォールバック実行用のオプションの CLI バックエンド (ツール呼び出しなし)。 API プロバイダーに障害が発生した場合のバックアップとして役立ちます。

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          systemPromptArg: "--system",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
````

- CLI バックエンドはテキストファーストです。ツールは常に無効になっています。
- `sessionArg` が設定されている場合にサポートされるセッション。
- `imageArg` がファイル パスを受け入れる場合、イメージ パススルーがサポートされます。

### `agents.defaults.heartbeat`

定期的なハートビートが実行されます。

````json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m disables
        model: "openai/gpt-5.2-mini",
        includeReasoning: false,
        lightContext: false, // default: false; true keeps only HEARTBEAT.md from workspace bootstrap files
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (default) | block
        target: "none", // default: none | options: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
      },
    },
  },
}
```- `every`: 期間文字列 (ms/s/m/h)。デフォルト: `30m`。
- `suppressToolErrorWarnings`: true の場合、ハートビートの実行中にツール エラー警告ペイロードが抑制されます。
- `directPolicy`: 直接/DM 配信ポリシー。 `allow` (デフォルト) は、直接ターゲット配信を許可します。 `block` は直接ターゲットの配信を抑制し、`reason=dm-blocked` を発行します。
- `lightContext`: true の場合、ハートビートの実行では軽量ブートストラップ コンテキストが使用され、ワー​​クスペース ブートストラップ ファイルから `HEARTBEAT.md` のみが保持されます。
- エージェントごと: `agents.list[].heartbeat` を設定します。いずれかのエージェントが `heartbeat` を定義すると、**それらのエージェントのみ** がハートビートを実行します。
- ハートビートはエージェント ターン全体を実行します。間隔が短いほど、より多くのトークンが消費されます。

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        reserveTokensFloor: 24000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // used when identifierPolicy=custom
        postCompactionSections: ["Session Startup", "Red Lines"], // [] disables reinjection
        model: "openrouter/anthropic/claude-sonnet-4-5", // optional compaction-only model override
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```- `mode`: `default` または `safeguard` (長い履歴のチャンク化された要約)。 [圧縮](/concepts/compaction) を参照してください。
- `identifierPolicy`: `strict` (デフォルト)、`off`、または `custom`。 `strict` は、圧縮要約中に組み込みの不透明な識別子保持ガイダンスを先頭に追加します。
- `identifierInstructions`: `identifierPolicy=custom` の場合に使用されるオプションのカスタム識別子保存テキスト。
- `postCompactionSections`: 圧縮後に再挿入するオプションの AGENTS.md H2/H3 セクション名。デフォルトは `["Session Startup", "Red Lines"]` です。 `[]` を設定して再注入を無効にします。設定を解除するか、そのデフォルトのペアに明示的に設定すると、古い `Every Session`/`Safety` 見出しもレガシー フォールバックとして受け入れられます。
- `model`: 圧縮要約のみのオプションの `provider/model-id` オーバーライド。これは、メイン セッションで 1 つのモデルを保持する必要があるが、圧縮サマリーを別のモデルで実行する必要がある場合に使用します。設定されていない場合、圧縮ではセッションのプライマリ モデルが使用されます。
- `memoryFlush`: 耐久性のあるメモリを保存するための自動圧縮前のサイレント エージェント ターン。ワークスペースが読み取り専用の場合はスキップされます。

### `agents.defaults.contextPruning`

LLM に送信する前に、メモリ内コンテキストから **古いツールの結果** を削除します。ディスク上のセッション履歴は**変更されません**。

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // duration (ms/s/m/h), default unit: minutes
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Old tool result content cleared]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
````

<Accordion title="キャッシュ TTL モードの動作">- `mode: "cache-ttl"` はプルーニング パスを有効にします。

- `ttl` は、プルーニングを再度実行できる頻度 (最後のキャッシュ タッチ後) を制御します。
- プルーニングでは、まずサイズの大きいツール結果がソフト トリムされ、次に必要に応じて古いツール結果がハードクリアされます。

**ソフトトリム**は、先頭と末尾を維持し、途中に `...` を挿入します。

**ハードクリア** は、ツールの結果全体をプレースホルダーに置き換えます。

注:

- 画像ブロックは決してトリミング/クリアされません。
- 比率は文字ベース (概算) であり、正確なトークン数ではありません。
- 存在するアシスタント メッセージが `keepLastAssistants` 未満の場合、プルーニングはスキップされます。

</Accordion>

動作の詳細については、[セッション プルーニング](/concepts/session-pruning) を参照してください。

### ストリーミングをブロックする

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (use minMs/maxMs)
    },
  },
}
```

- Telegram 以外のチャネルでは、ブロック応答を有効にするには明示的な `*.blockStreaming: true` が必要です。
- チャネル オーバーライド: `channels.<channel>.blockStreamingCoalesce` (およびアカウントごとのバリアント)。 Signal/Slack/Discord/Google Chat のデフォルト `minChars: 1500`。
- `humanDelay`: ブロック返信間のランダムな一時停止。 `natural` = 800 ～ 2500 ミリ秒。エージェントごとのオーバーライド: `agents.list[].humanDelay`。

動作とチャンク化の詳細については、[ストリーミング](/concepts/streaming) を参照してください。

### タイピングインジケーター

```json5
{
  agents: {
    defaults: {
      typingMode: "instant", // never | instant | thinking | message
      typingIntervalSeconds: 6,
    },
  },
}
```

- デフォルト: 直接チャット/メンションの場合は `instant`、言及されていないグループ チャットの場合は `message`。
- セッションごとのオーバーライド: `session.typingMode`、`session.typingIntervalSeconds`。

[タイピングインジケーター](/concepts/typing-indicators) を参照してください。

### `agents.defaults.sandbox`埋め込みエージェント用のオプションの **Docker サンドボックス**。完全なガイドについては、[サンドボックス](/gateway/sandboxing) を参照してください

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        scope: "agent", // session | agent | shared
        workspaceAccess: "none", // none | ro | rw
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          containerPrefix: "openclaw-sbx-",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
          capDrop: ["ALL"],
          env: { LANG: "C.UTF-8" },
          setupCommand: "apt-get update && apt-get install -y git curl jq",
          pidsLimit: 256,
          memory: "1g",
          memorySwap: "2g",
          cpus: 1,
          ulimits: {
            nofile: { soft: 1024, hard: 2048 },
            nproc: 256,
          },
          seccompProfile: "/path/to/seccomp.json",
          apparmorProfile: "openclaw-sandbox",
          dns: ["1.1.1.1", "8.8.8.8"],
          extraHosts: ["internal.service:10.0.0.5"],
          binds: ["/home/user/source:/source:rw"],
        },
        browser: {
          enabled: false,
          image: "openclaw-sandbox-browser:bookworm-slim",
          network: "openclaw-sandbox-browser",
          cdpPort: 9222,
          cdpSourceRange: "172.21.0.1/32",
          vncPort: 5900,
          noVncPort: 6080,
          headless: false,
          enableNoVnc: true,
          allowHostControl: false,
          autoStart: true,
          autoStartTimeoutMs: 12000,
        },
        prune: {
          idleHours: 24,
          maxAgeDays: 7,
        },
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        allow: [
          "exec",
          "process",
          "read",
          "write",
          "edit",
          "apply_patch",
          "sessions_list",
          "sessions_history",
          "sessions_send",
          "sessions_spawn",
          "session_status",
        ],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"],
      },
    },
  },
}
```

<Accordion title="サンドボックスの詳細">

**ワークスペースへのアクセス:**

- `none`: `~/.openclaw/sandboxes` の下のスコープごとのサンドボックス ワークスペース
- `ro`: サンドボックス ワークスペースは `/workspace`、エージェント ワークスペースは `/agent` に読み取り専用でマウントされています
- `rw`: エージェント ワークスペースは `/workspace` に読み取り/書き込み可能にマウントされました

**範囲:**

- `session`: セッションごとのコンテナ + ワークスペース
- `agent`: エージェントごとに 1 つのコンテナ + ワークスペース (デフォルト)
- `shared`: 共有コンテナーとワークスペース (セッション間の分離なし)

**`setupCommand`** は、コンテナーの作成後に 1 回実行されます (`sh -lc` 経由)。ネットワーク出力、書き込み可能な root、root ユーザーが必要です。

**コンテナのデフォルトは `network: "none"`** です。エージェントが送信アクセスを必要とする場合は、`"bridge"` (またはカスタム ブリッジ ネットワーク) に設定されます。
`"host"` はブロックされています。 `"container:<id>"` は、明示的に設定しない限り、デフォルトでブロックされます
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (ガラス破り)。

**受信添付ファイル**は、アクティブなワークスペースの `media/inbound/*` にステージングされます。

**`docker.binds`** は追加のホスト ディレクトリをマウントします。グローバル バインドとエージェントごとのバインドがマージされます。**サンドボックス ブラウザ** (`sandbox.browser.enabled`): コンテナ内の Chromium + CDP。 noVNC URL がシステム プロンプトに挿入されました。 `openclaw.json` に `browser.enabled` は必要ありません。
noVNC オブザーバー アクセスでは、デフォルトで VNC 認証が使用され、OpenClaw は (共有 URL でパスワードを公開する代わりに) 有効期間の短いトークン URL を発行します。- `allowHostControl: false` (デフォルト) は、サンドボックス化されたセッションがホスト ブラウザーをターゲットにすることをブロックします。

- `network` のデフォルトは `openclaw-sandbox-browser` (専用ブリッジ ネットワーク) です。明示的にグローバル ブリッジ接続が必要な場合にのみ、`bridge` に設定します。
- `cdpSourceRange` は、オプションでコンテナ エッジでの CDP イングレスを CIDR 範囲に制限します (`172.21.0.1/32` など)。
- `sandbox.browser.binds` は、追加のホスト ディレクトリをサンドボックス ブラウザ コンテナのみにマウントします。設定すると (`[]` を含む)、ブラウザー コンテナーの `docker.binds` が置き換えられます。
- 起動デフォルトは `scripts/sandbox-browser-entrypoint.sh` で定義され、コンテナー ホスト用に調整されています。
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-3d-apis`
  - `--disable-gpu`
  - `--disable-software-rasterizer`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-features=TranslateUI`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--renderer-process-limit=2`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--disable-extensions` (デフォルトで有効)
  - `--disable-3d-apis`、`--disable-software-rasterizer`、および `--disable-gpu` は
    デフォルトで有効になっており、次のコマンドで無効にできます
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` WebGL/3D の使用に必要な場合。
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` は、ワークフローが次の場合に拡張機能を再度有効にします。
    彼ら次第です。
  - `--renderer-process-limit=2` は次のように変更できます。
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; Chromium を使用するように `0` を設定します
    デフォルトのプロセス制限。- `noSandbox` が有効な場合は、`--no-sandbox` および `--disable-setuid-sandbox` が追加されます。
  - デフォルトはコンテナイメージのベースラインです。カスタムのブラウザ画像をカスタムで使用する
    コンテナのデフォルトを変更するためのエントリポイント。

</Accordion>

イメージをビルドします。

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

### `agents.list` (エージェントごとの上書き)

````json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "Main Agent",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // or { primary, fallbacks }
        params: { cacheRetention: "none" }, // overrides matching defaults.models params by key
        identity: {
          name: "Samantha",
          theme: "helpful sloth",
          emoji: "🦥",
          avatar: "avatars/samantha.png",
        },
        groupChat: { mentionPatterns: ["@openclaw"] },
        sandbox: { mode: "off" },
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
        subagents: { allowAgents: ["*"] },
        tools: {
          profile: "coding",
          allow: ["browser"],
          deny: ["canvas"],
          elevated: { enabled: true },
        },
      },
    ],
  },
}
```- `id`: 安定したエージェント ID (必須)。
- `default`: 複数が設定されている場合、最初が優先されます (警告がログに記録されます)。何も設定されていない場合は、最初のリスト エントリがデフォルトになります。
- `model`: 文字列形式は `primary` のみをオーバーライドします。オブジェクト フォーム `{ primary, fallbacks }` は両方をオーバーライドします (`[]` はグローバル フォールバックを無効にします)。 `primary` をオーバーライドするだけの Cron ジョブは、`fallbacks: []` を設定しない限り、デフォルトのフォールバックを継承します。
- `params`: `agents.defaults.models` で選択されたモデル エントリにマージされたエージェントごとのストリーム パラメーター。これは、モデル カタログ全体を複製せずに、`cacheRetention`、`temperature`、`maxTokens` などのエージェント固有のオーバーライドに使用します。
- `runtime`: オプションのエージェントごとのランタイム記述子。エージェントがデフォルトで ACP ハーネス セッションを使用する必要がある場合は、`type: "acp"` を `runtime.acp` デフォルト (`agent`、`backend`、`mode`、`cwd`) とともに使用します。
- `identity.avatar`: ワークスペース相対パス、`http(s)` URL、または `data:` URI。
- `identity` はデフォルトを派生します: `emoji` から `ackReaction`、`name`/`emoji` から `mentionPatterns`。
- `subagents.allowAgents`: `sessions_spawn` のエージェント ID の許可リスト (`["*"]` = 任意、デフォルト: 同じエージェントのみ)。
- サンドボックス継承ガード: リクエスター セッションがサンドボックス化されている場合、`sessions_spawn` はサンドボックス化されずに実行されるターゲットを拒否します。

---## マルチエージェントルーティング

1 つのゲートウェイ内で複数の分離されたエージェントを実行します。 [マルチエージェント](/concepts/multi-agent) を参照してください。

```json5
{
  agents: {
    list: [
      { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
      { id: "work", workspace: "~/.openclaw/workspace-work" },
    ],
  },
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
  ],
}
````

### 一致フィールドのバインディング

- `type` (オプション): 通常のルーティングの場合は `route` (タイプが欠落している場合はデフォルトでルーティングされます)、永続的な ACP 会話バインディングの場合は `acp`。
- `match.channel` (必須)
- `match.accountId` (オプション; `*` = 任意のアカウント; 省略 = デフォルトのアカウント)
- `match.peer` (オプション; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (オプション、チャネル固有)
- `acp` (オプション; `type: "acp"` のみ): `{ mode, label, cwd, backend }`

**決定的な一致順序:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (正確、ピア/ギルド/チームなし)
5. `match.accountId: "*"` (チャネル全体)
6. デフォルトエージェント

各層内で、最初に一致した `bindings` エントリが優先されます。

`type: "acp"` エントリの場合、OpenClaw は正確な会話 ID (`match.channel` + アカウント + `match.peer.id`) によって解決し、上記のルート バインディング層の順序は使用しません。

### エージェントごとのアクセス プロファイル

<Accordion title="フルアクセス (サンドボックスなし)">

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="読み取り専用ツール + ワークスペース">

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "ro" },
        tools: {
          allow: [
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="ファイルシステムへのアクセスなし (メッセージングのみ)">

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "none" },
        tools: {
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
            "gateway",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

</Accordion>

優先順位の詳細については、[マルチエージェント サンドボックスとツール](/tools/multi-agent-sandbox-tools) を参照してください。

---

## セッション

```json5
{
  session: {
    scope: "per-sender",
    dmScope: "main", // main | per-peer | per-channel-peer | per-account-channel-peer
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      mode: "daily", // daily | idle
      atHour: 4,
      idleMinutes: 60,
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      direct: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    parentForkMaxTokens: 100000, // skip parent-thread fork above this token count (0 disables)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // duration or false
      maxDiskBytes: "500mb", // optional hard budget
      highWaterBytes: "400mb", // optional cleanup target
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // default inactivity auto-unfocus in hours (`0` disables)
      maxAgeHours: 0, // default hard max age in hours (`0` disables)
    },
    mainKey: "main", // legacy (runtime always uses "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="セッションフィールドの詳細">- **`dmScope`**: DM がグループ化される方法。

- `main`: すべての DM がメイン セッションを共有します。
- `per-peer`: チャネル間で送信者 ID によって分離します。
- `per-channel-peer`: チャネル + 送信者ごとに分離します (マルチユーザーの受信箱に推奨)。
- `per-account-channel-peer`: アカウント + チャネル + 送信者ごとに分離します (複数のアカウントに推奨)。
- **`identityLinks`**: クロスチャネルセッション共有のために、正規 ID をプロバイダープレフィックス付きのピアにマップします。
- **`reset`**: プライマリ リセット ポリシー。 `daily` は現地時間の `atHour` にリセットされます。 `idle` は `idleMinutes` の後にリセットされます。両方が設定されている場合は、先に期限が切れた方が優先されます。
- **`resetByType`**: タイプごとのオーバーライド (`direct`、`group`、`thread`)。レガシー `dm` は `direct` のエイリアスとして受け入れられます。
- **`parentForkMaxTokens`**: フォークされたスレッド セッションの作成時に許可される最大親セッション `totalTokens` (デフォルト `100000`)。
  - 親 `totalTokens` がこの値を超えている場合、OpenClaw は親トランスクリプト履歴を継承する代わりに、新しいスレッド セッションを開始します。
  - このガードを無効にし、常に親のフォークを許可するには、`0` を設定します。
- **`mainKey`**: 従来のフィールド。ランタイムは、メインのダイレクト チャット バケットに常に `"main"` を使用するようになりました。- **`sendPolicy`**: `channel`、`chatType` (`direct|group|channel`、従来の `dm` エイリアスを使用)、`keyPrefix`、または `rawKeyPrefix` による一致。最初に拒否した方が勝ちです。
- **`maintenance`**: セッション ストアのクリーンアップ + 保持制御。
  - `mode`: `warn` は警告のみを発行します。 `enforce` はクリーンアップを適用します。
  - `pruneAfter`: 古いエントリの期限切れ (デフォルト `30d`)。
  - `maxEntries`: `sessions.json` のエントリの最大数 (デフォルトは `500`)。
  - `rotateBytes`: このサイズを超える場合、`sessions.json` を回転します (デフォルト `10mb`)。
  - `resetArchiveRetention`: `*.reset.<timestamp>` トランスクリプト アーカイブの保持。デフォルトは `pruneAfter` です。 `false` を無効に設定します。
  - `maxDiskBytes`: オプションのセッション ディレクトリのディスク バジェット。 `warn` モードでは、警告がログに記録されます。 `enforce` モードでは、最も古いアーティファクト/セッションが最初に削除されます。
  - `highWaterBytes`: 予算クリーンアップ後のオプションのターゲット。デフォルトは `80%` または `maxDiskBytes` です。
- **`threadBindings`**: スレッドバインドされたセッション機能のグローバルデフォルト。
  - `enabled`: マスターデフォルトスイッチ (プロバイダーは上書き可能; Discord は `channels.discord.threadBindings.enabled` を使用します)
  - `idleHours`: デフォルトの非アクティブ状態は時間単位で自動的にフォーカスを解除します (`0` は無効になります。プロバイダーはオーバーライドできます)- `maxAgeHours`: デフォルトのハードマックス経過時間 (`0` は無効になります。プロバイダーはオーバーライドできます)

</Accordion>

---

## メッセージ

```json5
{
  messages: {
    responsePrefix: "🦞", // or "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "collect", // steer | followup | collect | steer-backlog | steer+backlog | queue | interrupt
      debounceMs: 1000,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "collect",
        telegram: "collect",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 disables
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### 応答プレフィックス

チャネル/アカウントごとのオーバーライド: `channels.<channel>.responsePrefix`、`channels.<channel>.accounts.<id>.responsePrefix`。

解決策 (最も具体的な勝利): アカウント → チャネル → グローバル。 `""` はカスケードを無効にして停止します。 `"auto"` は `[{identity.name}]` を派生させます。

**テンプレート変数:**

| 変数              | 説明               | 例                          |
| ----------------- | ------------------ | --------------------------- |
| `{model}`         | 短いモデル名       | `claude-opus-4-6`           |
| `{modelFull}`     | 完全なモデル識別子 | `anthropic/claude-opus-4-6` |
| `{provider}`      | プロバイダー名     | `anthropic`                 |
| `{thinkingLevel}` | 現在の思考レベル   | `high`、`low`、`off`        |
| `{identity.name}` | エージェント ID 名 | (`"auto"` と同じ)           |

変数では大文字と小文字が区別されません。 `{think}` は、`{thinkingLevel}` のエイリアスです。

### ACK反応- デフォルトはアクティブなエージェントの `identity.emoji`、それ以外の場合は `"👀"` です。 `""` を無効に設定します

- チャネルごとのオーバーライド: `channels.<channel>.ackReaction`、`channels.<channel>.accounts.<id>.ackReaction`。
- 解決順序: アカウント → チャネル → `messages.ackReaction` → ID フォールバック。
- スコープ: `group-mentions` (デフォルト)、`group-all`、`direct`、`all`。
- `removeAckAfterReply`: 返信後の確認応答を削除します (Slack/Discord/Telegram/Google Chat のみ)。

### インバウンドデバウンス

同じ送信者からのテキストのみの迅速なメッセージを 1 つのエージェント ターンにバッチ処理します。メディア/添付ファイルはすぐにフラッシュされます。制御コマンドはデバウンスをバイパスします。

### TTS (テキスト読み上げ)

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      elevenlabs: {
        apiKey: "elevenlabs_api_key",
        baseUrl: "https://api.elevenlabs.io",
        voiceId: "voice_id",
        modelId: "eleven_multilingual_v2",
        seed: 42,
        applyTextNormalization: "auto",
        languageCode: "en",
        voiceSettings: {
          stability: 0.5,
          similarityBoost: 0.75,
          style: 0.0,
          useSpeakerBoost: true,
          speed: 1.0,
        },
      },
      openai: {
        apiKey: "openai_api_key",
        baseUrl: "https://api.openai.com/v1",
        model: "gpt-4o-mini-tts",
        voice: "alloy",
      },
    },
  },
}
```

- `auto` は自動 TTS を制御します。 `/tts off|always|inbound|tagged` はセッションごとにオーバーライドされます。
- `summaryModel` は、自動要約の `agents.defaults.model.primary` をオーバーライドします。
- `modelOverrides` はデフォルトで有効になっています。 `modelOverrides.allowProvider` のデフォルトは `false` (オプトイン) です。
- API キーは `ELEVENLABS_API_KEY`/`XI_API_KEY` および `OPENAI_API_KEY` にフォールバックします。
- `openai.baseUrl` は OpenAI TTS エンドポイントをオーバーライドします。解決順序は、config、次に `OPENAI_TTS_BASE_URL`、次に `https://api.openai.com/v1` です。
- `openai.baseUrl` が非 OpenAI エンドポイントを指している場合、OpenClaw はそれを OpenAI 互換の TTS サーバーとして扱い、モデル/音声の検証を緩和します。

---

## 話す

トーク モードのデフォルト (macOS/iOS/Android)。

````json5
{
  talk: {
    voiceId: "elevenlabs_voice_id",
    voiceAliases: {
      Clawd: "EXAVITQu4vr4xnSDxMaL",
      Roger: "CwhRBWXzGAHq8TQ4Fs17",
    },
    modelId: "eleven_v3",
    outputFormat: "mp3_44100_128",
    apiKey: "elevenlabs_api_key",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```- 音声 ID は `ELEVENLABS_VOICE_ID` または `SAG_VOICE_ID` にフォールバックします。
- `apiKey` および `providers.*.apiKey` は、プレーンテキスト文字列または SecretRef オブジェクトを受け入れます。
- `ELEVENLABS_API_KEY` フォールバックは、Talk API キーが設定されていない場合にのみ適用されます。
- `voiceAliases` により、Talk ディレクティブにフレンドリ名を使用できるようになります。
- `silenceTimeoutMs` は、ユーザーが沈黙した後、トランスクリプトを送信するまでトーク モードが待機する時間を制御します。設定を解除すると、プラットフォームのデフォルトの一時停止ウィンドウ (`700 ms on macOS and Android, 900 ms on iOS`) が維持されます。

---

## ツール

### 工具プロファイル

`tools.profile` は、`tools.allow`/`tools.deny` の前に基本ホワイトリストを設定します。

ローカル オンボーディングは、設定を解除すると、新しいローカル構成をデフォルトで `tools.profile: "coding"` に設定します (既存の明示的なプロファイルは保持されます)。

|プロフィール |含まれるもの |
| ----------- | ----------------------------------------------------------------------------------------- |
| `minimal` | `session_status` のみ |
| `coding` | `group:fs`、`group:runtime`、`group:sessions`、`group:memory`、`image` |
| `messaging` | `group:messaging`、`sessions_list`、`sessions_history`、`sessions_send`、`session_status` |
| `full` |制限なし（未設定と同じ） |### ツールグループ|グループ |ツール |
| ------------------ | -------------------------------------------------------------------------------------- |
| `group:runtime` | `exec`、`process` (`bash` は `exec` のエイリアスとして受け入れられます)
| `group:fs` | `read`、`write`、`edit`、`apply_patch` |
| `group:sessions` | `sessions_list`、`sessions_history`、`sessions_send`、`sessions_spawn`、`session_status` |
| `group:memory` | `memory_search`、`memory_get` |
| `group:web` | `web_search`、`web_fetch` |
| `group:ui` | `browser`、`canvas` |
| `group:automation` | `cron`、`gateway` |
| `group:messaging` | `message` || `group:nodes` | `nodes` |
| `group:openclaw` |すべての組み込みツール (プロバイダー プラグインを除く) |

### `tools.allow` / `tools.deny`

グローバル ツールの許可/拒否ポリシー (拒否の勝利)。大文字と小文字は区別されず、`*` ワイルドカードをサポートします。 Docker サンドボックスがオフの場合でも適用されます。

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
````

### `tools.byProvider`

特定のプロバイダーまたはモデル用のツールをさらに制限します。順序: 基本プロファイル → プロバイダー プロファイル → 許可/拒否。

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
      "openai/gpt-5.2": { allow: ["group:fs", "sessions_list"] },
    },
  },
}
```

### `tools.elevated`

昇格された (ホスト) 実行アクセスを制御します。

```json5
{
  tools: {
    elevated: {
      enabled: true,
      allowFrom: {
        whatsapp: ["+15555550123"],
        discord: ["1234567890123", "987654321098765432"],
      },
    },
  },
}
```

- エージェントごとのオーバーライド (`agents.list[].tools.elevated`) は、さらに制限することしかできません。
- `/elevated on|off|ask|full` はセッションごとの状態を保存します。インラインディレクティブは単一のメッセージに適用されます。
- 昇格された `exec` がホスト上で実行され、サンドボックスがバイパスされます。

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.2"],
      },
    },
  },
}
```

### `tools.loopDetection`

ツールループの安全性チェックは **デフォルトでは無効になっています**。 `enabled: true` を設定して検出を有効にします。
設定は `tools.loopDetection` でグローバルに定義でき、`agents.list[].tools.loopDetection` でエージェントごとに上書きできます。

````json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```- `historySize`: ループ解析のために保持される最大ツール呼び出し履歴。
- `warningThreshold`: 警告に対する進行なしパターンのしきい値を繰り返します。
- `criticalThreshold`: クリティカルなループをブロックするためのより高い繰り返ししきい値。
- `globalCircuitBreakerThreshold`: 進行状況のない実行に対するハードストップのしきい値。
- `detectors.genericRepeat`: 同じツール/同じ引数の繰り返し呼び出しを警告します。
- `detectors.knownPollNoProgress`: 既知の投票ツール (`process.poll`、`command_status` など) に対して警告/ブロックします。
- `detectors.pingPong`: 交互に進行しないペアのパターンを警告/ブロックします。
- `warningThreshold >= criticalThreshold` または `criticalThreshold >= globalCircuitBreakerThreshold` の場合、検証は失敗します。

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // or BRAVE_API_KEY env
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        maxChars: 50000,
        maxCharsCap: 50000,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        userAgent: "custom-ua",
      },
    },
  },
}
````

### `tools.media`

インバウンドメディア理解 (画像/音声/ビデオ) を構成します。

```json5
{
  tools: {
    media: {
      concurrency: 2,
      audio: {
        enabled: true,
        maxBytes: 20971520,
        scope: {
          default: "deny",
          rules: [{ action: "allow", match: { chatType: "direct" } }],
        },
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          { type: "cli", command: "whisper", args: ["--model", "base", "{{MediaPath}}"] },
        ],
      },
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },
}
```

<Accordion title="メディアモデル入力フィールド">

**プロバイダーエントリ** (`type: "provider"` または省略):

- `provider`: API プロバイダー ID (`openai`、`anthropic`、`google`/`gemini`、`groq` など)
- `model`: モデル ID の上書き
- `profile` / `preferredProfile`: `auth-profiles.json` プロファイルの選択

**CLI エントリ** (`type: "cli"`):

- `command`: 実行する実行可能ファイル
- `args`: テンプレート化された引数 (`{{MediaPath}}`、`{{Prompt}}`、`{{MaxChars}}` などをサポート)

**共通フィールド:**- `capabilities`: オプションのリスト (`image`、`audio`、`video`)。デフォルト: `openai`/`anthropic`/`minimax` → 画像、`google` → 画像+音声+ビデオ、`groq` → 音声。

- `prompt`、`maxChars`、`maxBytes`、`timeoutSeconds`、`language`: エントリごとの上書き。
- 失敗は次のエントリにフォールバックします。

プロバイダー認証は標準の順序に従います: `auth-profiles.json` → 環境変数 → `models.providers.*.apiKey`。

</Accordion>

### `tools.agentToAgent`

```json5
{
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },
}
```

### `tools.sessions`

セッション ツール (`sessions_list`、`sessions_history`、`sessions_send`) の対象にできるセッションを制御します。

デフォルト: `tree` (現在のセッション + それによって生成されたセッション (サブエージェントなど))。

```json5
{
  tools: {
    sessions: {
      // "self" | "tree" | "agent" | "all"
      visibility: "tree",
    },
  },
}
```

注:

- `self`: 現在のセッション キーのみ。
- `tree`: 現在のセッション + 現在のセッションによって生成されたセッション (サブエージェント)。
- `agent`: 現在のエージェント ID に属する任意のセッション (同じエージェント ID で送信者ごとのセッションを実行する場合は、他のユーザーを含めることができます)。
- `all`: 任意のセッション。クロスエージェントターゲティングには引き続き `tools.agentToAgent` が必要です。
- サンドボックス クランプ: 現在のセッションがサンドボックス化されており、`agents.defaults.sandbox.sessionToolsVisibility="spawned"` である場合、`tools.sessions.visibility="all"` であっても、可視性は強制的に `tree` に設定されます。

### `tools.sessions_spawn`

`sessions_spawn` のインライン添付ファイルのサポートを制御します。

````json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // opt-in: set true to allow inline file attachments
        maxTotalBytes: 5242880, // 5 MB total across all files
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB per file
        retainOnSessionKeep: false, // keep attachments when cleanup="keep"
      },
    },
  },
}
```注:

- 添付ファイルは `runtime: "subagent"` でのみサポートされます。 ACP ランタイムはそれらを拒否します。
- ファイルは、`.manifest.json` を使用して、`.openclaw/attachments/<uuid>/` の子ワークスペースに実体化されます。
- 添付ファイルのコンテンツは、トランスクリプトの永続性から自動的に編集されます。
- Base64 入力は、厳密なアルファベット/パディング チェックとプリデコード サイズ ガードによって検証されます。
- ファイル権限は、ディレクトリの場合は `0700`、ファイルの場合は `0600` です。
- クリーンアップは `cleanup` ポリシーに従います。 `delete` は常に添付ファイルを削除します。 `keep` は、`retainOnSessionKeep: true` の場合にのみそれらを保持します。

### `tools.subagents`

```json5
{
  agents: {
    defaults: {
      subagents: {
        model: "minimax/MiniMax-M2.5",
        maxConcurrent: 1,
        runTimeoutSeconds: 900,
        archiveAfterMinutes: 60,
      },
    },
  },
}
````

- `model`: 生成されたサブエージェントのデフォルト モデル。省略した場合、サブエージェントは呼び出し元のモデルを継承します。
- `runTimeoutSeconds`: ツール呼び出しで `runTimeoutSeconds` が省略された場合の `sessions_spawn` のデフォルトのタイムアウト (秒)。 `0` はタイムアウトがないことを意味します。
- サブエージェントごとのツール ポリシー: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`。

---

## カスタムプロバイダーとベース URL

OpenClaw は、pi-coding-agent モデル カタログを使用します。構成内の `models.providers` または `~/.openclaw/agents/<agentId>/agent/models.json` を介してカスタム プロバイダーを追加します。

````json5
{
  models: {
    mode: "merge", // merge (default) | replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai
        models: [
          {
            id: "llama-3.1-8b",
            name: "Llama 3.1 8B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```- カスタム認証が必要な場合は、`authHeader: true` + `headers` を使用します。
- エージェント設定ルートを `OPENCLAW_AGENT_DIR` (または `PI_CODING_AGENT_DIR`) でオーバーライドします。
- 一致するプロバイダー ID のマージの優先順位:
  - 空ではないエージェント `models.json` `baseUrl` 値が優先されます。
  - 空ではないエージェント `apiKey` 値は、そのプロバイダーが現在の構成/認証プロファイル コンテキストで SecretRef で管理されていない場合にのみ優先されます。
  - SecretRef 管理プロバイダーの `apiKey` 値は、解決されたシークレットを保持するのではなく、ソース マーカー (環境参照の場合は `ENV_VAR_NAME`、ファイル/実行参照の場合は `secretref-managed`) から更新されます。
  - 空または欠落しているエージェント `apiKey`/`baseUrl` は、構成内の `models.providers` にフォールバックします。
  - マッチングモデル `contextWindow`/`maxTokens` は、明示的な構成値と暗黙的なカタログ値の間の高い値を使用します。
  - 構成で `models.json` を完全に書き換える場合は、`models.mode: "replace"` を使用します。

### プロバイダーフィールドの詳細- `models.mode`: プロバイダー カタログの動作 (`merge` または `replace`)。
- `models.providers`: プロバイダー ID をキーとするカスタム プロバイダー マップ。
- `models.providers.*.api`: アダプターを要求します (`openai-completions`、`openai-responses`、`anthropic-messages`、`google-generative-ai` など)。
- `models.providers.*.apiKey`: プロバイダーの資格情報 (SecretRef/env 置換を推奨)。
- `models.providers.*.auth`: 認証戦略 (`api-key`、`token`、`oauth`、`aws-sdk`)。
- `models.providers.*.injectNumCtxForOpenAICompat`: Ollama + `openai-completions` の場合、`options.num_ctx` をリクエストに挿入します (デフォルト: `true`)。
- `models.providers.*.authHeader`: 必要に応じて、`Authorization` ヘッダーで資格情報のトランスポートを強制します。
- `models.providers.*.baseUrl`: アップストリーム API ベース URL。
- `models.providers.*.headers`: プロキシ/テナント ルーティング用の追加の静的ヘッダー。
- `models.providers.*.models`: 明示的なプロバイダー モデル カタログ エントリ。
- `models.providers.*.models.*.compat.supportsDeveloperRole`: オプションの互換性ヒント。空ではない非ネイティブ `baseUrl` (`api.openai.com` ではないホスト) を持つ `api: "openai-completions"` の場合、OpenClaw は実行時にこれを強制的に `false` に設定します。空または省略された `baseUrl` は、デフォルトの OpenAI 動作を維持します。
- `models.bedrockDiscovery`: Bedrock 自動検出設定のルート。
- `models.bedrockDiscovery.enabled`: 検出ポーリングをオン/オフにします。
- `models.bedrockDiscovery.region`: 検出用の AWS リージョン。
- `models.bedrockDiscovery.providerFilter`: ターゲットを絞った検出のためのオプションのプロバイダー ID フィルター。
- `models.bedrockDiscovery.refreshInterval`: 検出更新のポーリング間隔。- `models.bedrockDiscovery.defaultContextWindow`: 検出されたモデルのフォールバック コンテキスト ウィンドウ。
- `models.bedrockDiscovery.defaultMaxTokens`: 検出されたモデルのフォールバック最大出力トークン。

### プロバイダーの例

<Accordion title="Cerebras (GLM 4.6 / 4.7)">

```json5
{
  env: { CEREBRAS_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: {
        primary: "cerebras/zai-glm-4.7",
        fallbacks: ["cerebras/zai-glm-4.6"],
      },
      models: {
        "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
        "cerebras/zai-glm-4.6": { alias: "GLM 4.6 (Cerebras)" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      cerebras: {
        baseUrl: "https://api.cerebras.ai/v1",
        apiKey: "${CEREBRAS_API_KEY}",
        api: "openai-completions",
        models: [
          { id: "zai-glm-4.7", name: "GLM 4.7 (Cerebras)" },
          { id: "zai-glm-4.6", name: "GLM 4.6 (Cerebras)" },
        ],
      },
    },
  },
}
````

大脳には `cerebras/zai-glm-4.7` を使用します。 Z.AI ダイレクトの `zai/glm-4.7`。

</Accordion>

<Accordion title="OpenCode Zen">

```json5
{
  agents: {
    defaults: {
      model: { primary: "opencode/claude-opus-4-6" },
      models: { "opencode/claude-opus-4-6": { alias: "Opus" } },
    },
  },
}
```

`OPENCODE_API_KEY` (または `OPENCODE_ZEN_API_KEY`) を設定します。ショートカット: `openclaw onboard --auth-choice opencode-zen`。

</Accordion>

<Accordion title="Z.AI（GLM-4.7）">

```json5
{
  agents: {
    defaults: {
      model: { primary: "zai/glm-4.7" },
      models: { "zai/glm-4.7": {} },
    },
  },
}
```

`ZAI_API_KEY` を設定します。 `z.ai/*` および `z-ai/*` は別名として受け入れられます。ショートカット: `openclaw onboard --auth-choice zai-api-key`。

- 一般エンドポイント: `https://api.z.ai/api/paas/v4`
- コーディングエンドポイント (デフォルト): `https://api.z.ai/api/coding/paas/v4`
- 一般的なエンドポイントの場合、ベース URL オーバーライドを使用してカスタム プロバイダーを定義します。

</Accordion>

<Accordion title="ムーンショットAI（キミ）">

```json5
{
  env: { MOONSHOT_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "moonshot/kimi-k2.5" },
      models: { "moonshot/kimi-k2.5": { alias: "Kimi K2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "kimi-k2.5",
            name: "Kimi K2.5",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 256000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

中国エンドポイントの場合: `baseUrl: "https://api.moonshot.cn/v1"` または `openclaw onboard --auth-choice moonshot-api-key-cn`。

</Accordion>

<Accordion title="キミコーディング">

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "kimi-coding/k2p5" },
      models: { "kimi-coding/k2p5": { alias: "Kimi K2.5" } },
    },
  },
}
```

Anthropic 互換の組み込みプロバイダー。ショートカット: `openclaw onboard --auth-choice kimi-code-api-key`。

</Accordion>

<Accordion title="合成 (人為的互換性)">

```json5
{
  env: { SYNTHETIC_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
      models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "hf:MiniMaxAI/MiniMax-M2.5",
            name: "MiniMax M2.5",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 192000,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

ベース URL は `/v1` を省略する必要があります (Anthropic クライアントが追加します)。ショートカット: `openclaw onboard --auth-choice synthetic-api-key`。

</Accordion>

<Accordion title="MiniMax M2.5 (直接)">

```json5
{
  agents: {
    defaults: {
      model: { primary: "minimax/MiniMax-M2.5" },
      models: {
        "minimax/MiniMax-M2.5": { alias: "Minimax" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      minimax: {
        baseUrl: "https://api.minimax.io/anthropic",
        apiKey: "${MINIMAX_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "MiniMax-M2.5",
            name: "MiniMax M2.5",
            reasoning: false,
            input: ["text"],
            cost: { input: 15, output: 60, cacheRead: 2, cacheWrite: 10 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

`MINIMAX_API_KEY` を設定します。ショートカット: `openclaw onboard --auth-choice minimax-api`。

</Accordion>

<Accordion title="ローカルモデル (LM Studio)">[ローカル モデル](/gateway/local-models) を参照してください。 TL;DR: 本格的なハードウェアで LM Studio Response API 経由で MiniMax M2.5 を実行します。フォールバックのためにホストされたモデルをマージしたままにします。

</Accordion>

---

## スキル

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn
    },
    entries: {
      "nano-banana-pro": {
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: バンドルされたスキルのみのオプションの許可リスト (管理/ワークスペース スキルは影響を受けません)。
- `entries.<skillKey>.enabled: false` は、バンドル/インストールされている場合でもスキルを無効にします。
- `entries.<skillKey>.apiKey`: プライマリ環境変数 (プレーンテキスト文字列または SecretRef オブジェクト) を宣言するスキルの利便性。

---

## プラグイン

````json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: [],
    load: {
      paths: ["~/Projects/oss/voice-call-extension"],
    },
    entries: {
      "voice-call": {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
        config: { provider: "twilio" },
      },
    },
  },
}
```- `~/.openclaw/extensions`、`<workspace>/.openclaw/extensions`、および `plugins.load.paths` からロードされます。
- **構成を変更するにはゲートウェイの再起動が必要です。**
- `allow`: オプションの許可リスト (リストされたプラグインのみがロードされます)。 `deny` が勝ちます。
- `plugins.entries.<id>.apiKey`: プラグインレベルの API キー便利フィールド (プラグインでサポートされている場合)。
- `plugins.entries.<id>.env`: プラグインスコープの環境変数マップ。
- `plugins.entries.<id>.hooks.allowPromptInjection`: `false` の場合、コアは `before_prompt_build` をブロックし、レガシー `before_agent_start` からのプロンプト変更フィールドを無視しますが、レガシー `modelOverride` および `providerOverride` は保持します。
- `plugins.entries.<id>.config`: プラグイン定義の設定オブジェクト (プラグイン スキーマによって検証される)。
- `plugins.slots.memory`: アクティブなメモリ プラグイン ID を選択するか、メモリ プラグインを無効にする場合は `"none"` を選択します。
- `plugins.slots.contextEngine`: アクティブなコンテキスト エンジン プラグイン ID を選択します。別のエンジンをインストールして選択しない限り、デフォルトは `"legacy"` になります。
- `plugins.installs`: `openclaw plugins update` によって使用される CLI 管理のインストール メタデータ。
  - `source`、`spec`、`sourcePath`、`installPath`、`version`、`resolvedName`、`resolvedVersion`、 `resolvedSpec`、`integrity`、`shasum`、`resolvedAt`、`installedAt`。
  - `plugins.installs.*` を管理対象状態として扱います。手動編集よりも CLI コマンドを優先します。

[プラグイン](/tools/plugin) を参照してください。

---

## ブラウザ

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "chrome",
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: true, // default trusted-network mode
      // allowPrivateNetwork: true, // legacy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
    color: "#FF4500",
    // headless: false,
    // noSandbox: false,
    // extraArgs: [],
    // relayBindHost: "0.0.0.0", // only when the extension relay must be reachable across namespaces (for example WSL2)
    // executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    // attachOnly: false,
  },
}
```- `evaluateEnabled: false` は、`act:evaluate` および `wait --fn` を無効にします。
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` は、未設定の場合はデフォルトで `true` になります (信頼されたネットワーク モデル)。
- `ssrfPolicy.dangerouslyAllowPrivateNetwork: false` を設定して、厳密なパブリックのみのブラウザ ナビゲーションを実現します。
- `ssrfPolicy.allowPrivateNetwork` はレガシー エイリアスとして引き続きサポートされます。
- 厳密モードでは、明示的な例外に `ssrfPolicy.hostnameAllowlist` および `ssrfPolicy.allowedHostnames` を使用します。
- リモート プロファイルは接続専用です (開始/停止/リセットは無効)。
- 自動検出順序: Chromium ベースの場合はデフォルトのブラウザ → Chrome → Brave → Edge → Chromium → Chrome Canary。
- 制御サービス: ループバックのみ (ポートは `gateway.port` から派生、デフォルトは `18791`)。
- `extraArgs` は、ローカルの Chromium 起動に追加の起動フラグを追加します (たとえば、
  `--disable-gpu`、ウィンドウ サイズ、またはデバッグ フラグ)。
- `relayBindHost` は、Chrome 拡張機能リレーがリッスンする場所を変更します。ループバックのみのアクセスの場合は未設定のままにしておきます。 `0.0.0.0` などの明示的な非ループバック バインド アドレスは、リレーが名前空間の境界 (WSL2 など) を越える必要があり、ホスト ネットワークがすでに信頼されている場合にのみ設定します。

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, short text, image URL, or data URI
    },
  },
}
````

- `seamColor`: ネイティブ アプリ UI クロムのアクセント カラー (トーク モードのバブルの色合いなど)。
- `assistant`: UI ID オーバーライドを制御します。アクティブなエージェント ID にフォールバックします。

---

## ゲートウェイ

```json5
{
  gateway: {
    mode: "local", // local | remote
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token", // none | token | password | trusted-proxy
      token: "your-token",
      // password: "your-password", // or OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // for mode=trusted-proxy; see /gateway/trusted-proxy-auth
      allowTailscale: true,
      rateLimit: {
        maxAttempts: 10,
        windowMs: 60000,
        lockoutMs: 300000,
        exemptLoopback: true,
      },
    },
    tailscale: {
      mode: "off", // off | serve | funnel
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // allowedOrigins: ["https://control.example.com"], // required for non-loopback Control UI
      // dangerouslyAllowHostHeaderOriginFallback: false, // dangerous Host-header origin fallback mode
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    remote: {
      url: "ws://gateway.tailnet:18789",
      transport: "ssh", // ssh | direct
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // Optional. Default false.
    allowRealIpFallback: false,
    tools: {
      // Additional /tools/invoke HTTP denies
      deny: ["browser"],
      // Remove tools from the default HTTP deny list
      allow: ["gateway"],
    },
  },
}
```

<Accordion title="ゲートウェイフィールドの詳細">- `mode`: `local` (ゲートウェイを実行) または `remote` (リモート ゲートウェイに接続)。 `local` を除き、ゲートウェイは起動を拒否します。

- `port`: WS + HTTP 用の単一の多重化ポート。優先順位: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`。
- `bind`: `auto`、`loopback` (デフォルト)、`lan` (`0.0.0.0`)、`tailnet` (Tailscale IP のみ)、または`custom`。
- **レガシー バインド エイリアス**: ホスト エイリアスではなく、`gateway.bind` (`auto`、`loopback`、`lan`、`tailnet`、`custom`) のバインド モード値を使用します。 (`0.0.0.0`、`127.0.0.1`、`localhost`、`::`、`::1`)。
- **Docker 注**: デフォルトの `loopback` バインドは、コンテナー内の `127.0.0.1` をリッスンします。 Docker ブリッジ ネットワーキング (`-p 18789:18789`) では、トラフィックは `eth0` に到着するため、ゲートウェイに到達できません。すべてのインターフェイスでリッスンするには、`--network host` を使用するか、`bind: "lan"` (または `bind: "custom"` と `customBindHost: "0.0.0.0"`) を設定します。
- **認証**: デフォルトで必須。非ループバック バインドには共有トークン/パスワードが必要です。オンボーディング ウィザードはデフォルトでトークンを生成します。- `gateway.auth.token` と `gateway.auth.password` の両方が構成されている場合 (SecretRef を含む)、`gateway.auth.mode` を明示的に `token` または `password` に設定します。起動とサービスのインストール/修復フローの両方が構成され、モードが設定されていない場合、失敗します。
- `gateway.auth.mode: "none"`: 明示的な非認証モード。信頼できるローカル ループバック設定にのみ使用してください。これはオンボーディング プロンプトでは意図的に提供されません。
- `gateway.auth.mode: "trusted-proxy"`: ID 対応リバース プロキシに認証を委任し、`gateway.trustedProxies` からの ID ヘッダーを信頼します ([信頼されたプロキシ認証](/gateway/trusted-proxy-auth) を参照)。
- `gateway.auth.allowTailscale`: `true` の場合、Tailscale Serve ID ヘッダーはコントロール UI/WebSocket 認証を満たすことができます (`tailscale whois` で検証)。 HTTP API エンドポイントでは依然としてトークン/パスワード認証が必要です。このトークンレス フローは、ゲートウェイ ホストが信頼できることを前提としています。 `tailscale.mode = "serve"` の場合、デフォルトは `true` になります。
- `gateway.auth.rateLimit`: オプションの認証失敗リミッター。クライアント IP ごとおよび認証スコープごとに適用されます (共有シークレットとデバイス トークンは個別に追跡されます)。ブロックされた試行は `429` + `Retry-After` を返します。
  - `gateway.auth.rateLimit.exemptLoopback` のデフォルトは `true` です。 localhost のトラフィック レートも意図的に制限したい場合は、`false` を設定します (テスト セットアップまたは厳密なプロキシ展開の場合)。- ブラウザー オリジンの WS 認証試行は、ループバック除外が無効になっている状態で常に抑制されます (ブラウザー ベースのローカルホスト ブルート フォースに対する多層防御)。
- `tailscale.mode`: `serve` (テールネットのみ、ループバック バインド) または `funnel` (パブリック、認証が必要)。
- `controlUi.allowedOrigins`: ゲートウェイ WebSocket 接続用の明示的なブラウザー起点許可リスト。ブラウザクライアントが非ループバックオリジンからのものであることが予期される場合に必要です。
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: ホスト ヘッダー オリジン ポリシーに意図的に依存する展開でホスト ヘッダー オリジン フォールバックを有効にする危険なモード。
- `remote.transport`: `ssh` (デフォルト) または `direct` (ws/wss)。 `direct` の場合、`remote.url` は `ws://` または `wss://` である必要があります。
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: 信頼されたプライベート ネットワーク IP へのプレーンテキスト `ws://` を許可するクライアント側のブレークグラス オーバーライド。デフォルトでは平文の場合はループバックのみになります。
- `gateway.remote.token` / `.password` は、リモート クライアントの資格情報フィールドです。ゲートウェイ認証を独自に構成することはありません。
- `gateway.auth.*` が設定されていない場合、ローカル ゲートウェイの呼び出しパスはフォールバックとして `gateway.remote.*` を使用できます。
- `trustedProxies`: TLS を終了するリバース プロキシ IP。自分が制御するプロキシのみをリストします。
- `allowRealIpFallback`: `true` の場合、`X-Forwarded-For` が欠落している場合、ゲートウェイは `X-Real-IP` を受け入れます。フェールクローズ動作のデフォルト `false`。- `gateway.tools.deny`: HTTP `POST /tools/invoke` に対して追加のツール名がブロックされました (デフォルトの拒否リストを拡張します)。
- `gateway.tools.allow`: デフォルトの HTTP 拒否リストからツール名を削除します。

</Accordion>

### OpenAI 互換エンドポイント

- チャット完了: デフォルトでは無効になっています。 `gateway.http.endpoints.chatCompletions.enabled: true` で有効にします。
- 応答 API: `gateway.http.endpoints.responses.enabled`。
- 応答 URL 入力の強化:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
- オプションの応答強化ヘッダー:
  - `gateway.http.securityHeaders.strictTransportSecurity` (制御する HTTPS オリジンに対してのみ設定します。[信頼されたプロキシ認証](/gateway/trusted-proxy-auth#tls-termination-and-hsts) を参照)

### マルチインスタンスの分離

一意のポートと状態ディレクトリを使用して、1 つのホスト上で複数のゲートウェイを実行します。

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

便利なフラグ: `--dev` (`~/.openclaw-dev` + ポート `19001` を使用)、`--profile <name>` (`~/.openclaw-<name>` を使用)。

[複数のゲートウェイ](/gateway/multiple-gateways) を参照してください。

---

## フック

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    maxBodyBytes: 262144,
    defaultSessionKey: "hook:ingress",
    allowRequestSessionKey: false,
    allowedSessionKeyPrefixes: ["hook:"],
    allowedAgentIds: ["hooks", "main"],
    presets: ["gmail"],
    transformsDir: "~/.openclaw/hooks/transforms",
    mappings: [
      {
        match: { path: "gmail" },
        action: "agent",
        agentId: "hooks",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate: "From: {{messages[0].from}}\nSubject: {{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.2-mini",
      },
    ],
  },
}
```

認証: `Authorization: Bearer <token>` または `x-openclaw-token: <token>`。

**エンドポイント:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - リクエスト ペイロードの `sessionKey` は、`hooks.allowRequestSessionKey=true` (デフォルト: `false`) の場合にのみ受け入れられます。
- `POST /hooks/<name>` → `hooks.mappings` によって解決されました

<Accordion title="マッピングの詳細">- `match.path` は、`/hooks` の後のサブパスと一致します (例: `/hooks/gmail` → `gmail`)。

- `match.source` は、汎用パスのペイロード フィールドと一致します。
- `{{messages[0].subject}}` のようなテンプレートはペイロードから読み取られます。
- `transform` は、フック アクションを返す JS/TS モジュールを指すことができます。
  - `transform.module` は相対パスであり、`hooks.transformsDir` 内に収まる必要があります (絶対パスとトラバースは拒否されます)。
- `agentId` は特定のエージェントにルーティングします。不明な ID はデフォルトに戻ります。
- `allowedAgentIds`: 明示的なルーティングを制限します (`*` または省略 = すべて許可、`[]` = すべて拒否)。
- `defaultSessionKey`: フック エージェントのオプションの固定セッション キーは、明示的な `sessionKey` なしで実行されます。
- `allowRequestSessionKey`: `/hooks/agent` 呼び出し元が `sessionKey` を設定できるようにします (デフォルト: `false`)。
- `allowedSessionKeyPrefixes`: 明示的な `sessionKey` 値 (リクエスト + マッピング) のオプションのプレフィックス許可リスト。 `["hook:"]`。
- `deliver: true` はチャネルに最終応答を送信します。 `channel` のデフォルトは `last` です。
- `model` は、このフック実行の LLM をオーバーライドします (モデル カタログが設定されている場合は許可する必要があります)。

</Accordion>

### Gmail の統合

```json5
{
  hooks: {
    gmail: {
      account: "openclaw@gmail.com",
      topic: "projects/<project-id>/topics/gog-gmail-watch",
      subscription: "gog-gmail-watch-push",
      pushToken: "shared-push-token",
      hookUrl: "http://127.0.0.1:18789/hooks/gmail",
      includeBody: true,
      maxBytes: 20000,
      renewEveryMinutes: 720,
      serve: { bind: "127.0.0.1", port: 8788, path: "/" },
      tailscale: { mode: "funnel", path: "/gmail-pubsub" },
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

- 構成されている場合、ゲートウェイは起動時に `gog gmail watch serve` を自動起動します。 `OPENCLAW_SKIP_GMAIL_WATCHER=1` を無効に設定します。
- ゲートウェイと一緒に別の `gog gmail watch serve` を実行しないでください。

---

## キャンバスホスト

```json5

{
canvasHost: {
root: "~/.openclaw/workspace/canvas",
liveReload: true,
// enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
},
}

````

- エージェントが編集可能な HTML/CSS/JS および A2UI をゲートウェイ ポートで HTTP 経由で提供します。
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- ローカルのみ: `gateway.bind: "loopback"` (デフォルト) を維持します。
- 非ループバック バインド: キャンバス ルートには、他のゲートウェイ HTTP サーフェスと同様に、ゲートウェイ認証 (トークン/パスワード/信頼できるプロキシ) が必要です。
- ノード WebView は通常、認証ヘッダーを送信しません。ノードがペアリングされて接続されると、ゲートウェイはキャンバス/A2UI アクセス用にノード スコープの機能 URL をアドバタイズします。
- 機能 URL はアクティブ ノード WS セッションにバインドされており、すぐに期限切れになります。 IP ベースのフォールバックは使用されません。
- ライブリロードクライアントを提供される HTML に挿入します。
- 空の場合、スターター `index.html` を自動作成します。
- `/__openclaw__/a2ui/` で A2UI も提供します。
- 変更にはゲートウェイの再起動が必要です。
- 大きなディレクトリまたは `EMFILE` エラーのライブ リロードを無効にします。

---

## 発見

### mDNS (ボンジュール)

```json5
{
  discovery: {
    mdns: {
      mode: "minimal", // minimal | full | off
    },
  },
}
````

- `minimal` (デフォルト): TXT レコードから `cliPath` + `sshPort` を省略します。
- `full`: `cliPath` + `sshPort` を含みます。
- ホスト名のデフォルトは `openclaw` です。 `OPENCLAW_MDNS_HOSTNAME` でオーバーライドします。

### 広域 (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

ユニキャスト DNS-SD ゾーンを `~/.openclaw/dns/` に書き込みます。クロスネットワーク検出の場合は、DNS サーバー (CoreDNS 推奨) + Tailscale Split DNS とペアリングします。

セットアップ: `openclaw dns setup --apply`。

---

## 環境

### `env` (インライン環境変数)```json5

{
env: {
OPENROUTER_API_KEY: "sk-or-...",
vars: {
GROQ_API_KEY: "gsk-...",
},
shellEnv: {
enabled: true,
timeoutMs: 15000,
},
},
}

````

- インライン環境変数は、プロセス環境にキーがない場合にのみ適用されます。
- `.env` ファイル: CWD `.env` + `~/.openclaw/.env` (どちらも既存の変数をオーバーライドしません)。
- `shellEnv`: ログイン シェル プロファイルから不足している予期されたキーをインポートします。
- 完全な優先順位については、[環境](/help/environment) を参照してください。

### 環境変数の置換

`${VAR_NAME}` を使用して、構成文字列内の環境変数を参照します。

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
````

- 大文字の名前のみが一致しました: `[A-Z_][A-Z0-9_]*`。
- 変数が欠落しているか空であると、構成ロード時にエラーがスローされます。
- リテラル `${VAR}` の場合は、`${VAR}` でエスケープします。
- `$include` で動作します。

---

## 秘密

Secret ref は追加的です。プレーンテキストの値は引き続き機能します。

### `SecretRef`

1 つのオブジェクト シェイプを使用します。

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

検証:

- `provider` パターン: `^[a-z][a-z0-9_-]{0,63}# 構成リファレンス

`~/.openclaw/openclaw.json` で使用可能なすべてのフィールド。タスク指向の概要については、「[構成](/gateway/configuration)」を参照してください。

構成形式は **JSON5** (コメント + 末尾のカンマは許可されます) です。すべてのフィールドはオプションです。省略された場合、OpenClaw は安全なデフォルトを使用します。

---

## チャンネル

各チャネルは、その構成セクションが存在すると自動的に開始されます (`enabled: false` を除く)。

### DMとグループアクセス

すべてのチャネルは DM ポリシーとグループ ポリシーをサポートします。

| DMポリシー               | 行動                                                                                   |
| ------------------------ | -------------------------------------------------------------------------------------- | --- | ---------------- | ---- |
| `pairing` (デフォルト)   | 不明な送信者はワンタイムペアリングコードを受け取ります。所有者は承認する必要があります |
| `allowlist`              | `allowFrom` (またはペアの許可ストア) の送信者のみ                                      |
| `open`                   | すべての受信 DM を許可する (`allowFrom: ["*"]` が必要)                                 |
| `disabled`               | すべての受信 DM を無視する                                                             |     | グループポリシー | 行動 |
| ---------------------    | --------------------------------------------------------                               |
| `allowlist` (デフォルト) | 設定された許可リストに一致するグループのみ                                             |
| `open`                   | グループ許可リストをバイパスします (メンションゲートは引き続き適用されます)。          |
| `disabled`               | すべてのグループ/ルーム メッセージをブロックする                                       |

<Note>
`channels.defaults.groupPolicy` は、プロバイダーの `groupPolicy` が設定されていない場合のデフォルトを設定します。
ペアリング コードは 1 時間後に期限切れになります。保留中の DM ペアリング要求の上限は、**チャネルあたり 3** です。
プロバイダー ブロックが完全に欠落している (`channels.<provider>` が欠落している) 場合、ランタイム グループ ポリシーは起動警告とともに `allowlist` (フェールクローズ) にフォールバックします。
</Note>

### チャネルモデルのオーバーライド

`channels.modelByChannel` を使用して、特定のチャネル ID をモデルに固定します。値は `provider/model` または構成されたモデルのエイリアスを受け入れます。チャネル マッピングは、セッションにモデル オーバーライドがまだない場合 (たとえば、`/model` によって設定されている場合) に適用されます。

```json5
{
  channels: {
    modelByChannel: {
      discord: {
        "123456789012345678": "anthropic/claude-opus-4-6",
      },
      slack: {
        C1234567890: "openai/gpt-4.1",
      },
      telegram: {
        "-1001234567890": "openai/gpt-4.1-mini",
        "-1001234567890:topic:99": "anthropic/claude-sonnet-4-6",
      },
    },
  },
}
```

### チャネルのデフォルトとハートビート

プロバイダー間で共有されるグループ ポリシーとハートビートの動作には、`channels.defaults` を使用します。

````json5
{
  channels: {
    defaults: {
      groupPolicy: "allowlist", // open | allowlist | disabled
      heartbeat: {
        showOk: false,
        showAlerts: true,
        useIndicator: true,
      },
    },
  },
}
```- `channels.defaults.groupPolicy`: プロバイダーレベルの `groupPolicy` が設定されていない場合のフォールバック グループ ポリシー。
- `channels.defaults.heartbeat.showOk`: ハートビート出力に正常なチャネルのステータスを含めます。
- `channels.defaults.heartbeat.showAlerts`: ハートビート出力に劣化/エラーステータスを含めます。
- `channels.defaults.heartbeat.useIndicator`: コンパクトなインジケーター スタイルのハートビート出力をレンダリングします。

### WhatsApp

WhatsApp は、ゲートウェイの Web チャネル (Baileys Web) を通じて実行されます。リンクされたセッションが存在する場合、自動的に開始されます。

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      chunkMode: "length", // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // blue ticks (false in self-chat mode)
      groups: {
        "*": { requireMention: true },
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
  web: {
    enabled: true,
    heartbeatSeconds: 60,
    reconnect: {
      initialMs: 2000,
      maxMs: 120000,
      factor: 1.4,
      jitter: 0.2,
      maxAttempts: 0,
    },
  },
}
````

<Accordion title="マルチアカウント WhatsApp">

```json5
{
  channels: {
    whatsapp: {
      accounts: {
        default: {},
        personal: {},
        biz: {
          // authDir: "~/.openclaw/credentials/whatsapp/biz",
        },
      },
    },
  },
}
```

- アウトバウンド コマンドは、デフォルトでアカウント `default` が存在する場合に使用されます。それ以外の場合は、最初に設定されたアカウント ID (ソート済み)。
- オプションの `channels.whatsapp.defaultAccount` は、構成されたアカウント ID と一致する場合にフォールバックのデフォルトのアカウント選択をオーバーライドします。
- 従来の単一アカウントの Baileys 認証ディレクトリは、`openclaw doctor` によって `whatsapp/default` に移行されます。
- アカウントごとの上書き: `channels.whatsapp.accounts.<id>.sendReadReceipts`、`channels.whatsapp.accounts.<id>.dmPolicy`、`channels.whatsapp.accounts.<id>.allowFrom`。

</Accordion>

### 電報

````json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "your-bot-token",
      dmPolicy: "pairing",
      allowFrom: ["tg:123456789"],
      groups: {
        "*": { requireMention: true },
        "-1001234567890": {
          allowFrom: ["@admin"],
          systemPrompt: "Keep answers brief.",
          topics: {
            "99": {
              requireMention: false,
              skills: ["search"],
              systemPrompt: "Stay on topic.",
            },
          },
        },
      },
      customCommands: [
        { command: "backup", description: "Git backup" },
        { command: "generate", description: "Create an image" },
      ],
      historyLimit: 50,
      replyToMode: "first", // off | first | all
      linkPreview: true,
      streaming: "partial", // off | partial | block | progress (default: off)
      actions: { reactions: true, sendMessage: true },
      reactionNotifications: "own", // off | own | all
      mediaMaxMb: 100,
      retry: {
        attempts: 3,
        minDelayMs: 400,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
      network: {
        autoSelectFamily: true,
        dnsResultOrder: "ipv4first",
      },
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook",
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook",
    },
  },
}
```- ボット トークン: `channels.telegram.botToken` または `channels.telegram.tokenFile`、`TELEGRAM_BOT_TOKEN` はデフォルト アカウントのフォールバックとして使用されます。
- オプションの `channels.telegram.defaultAccount` は、構成されたアカウント ID と一致する場合、デフォルトのアカウント選択をオーバーライドします。
- マルチアカウント設定 (2 つ以上のアカウント ID) では、明示的なデフォルト (`channels.telegram.defaultAccount` または `channels.telegram.accounts.default`) を設定して、フォールバック ルーティングを回避します。 `openclaw doctor` は、これが欠落しているか無効な場合に警告します。
- `configWrites: false` は、Telegram が開始する設定の書き込みをブロックします (スーパーグループ ID の移行、`/config set|unset`)。
- `type: "acp"` を含むトップレベルの `bindings[]` エントリは、フォーラム トピックの永続的な ACP バインディングを構成します (`match.peer.id` の正規の `chatId:topic:topicId` を使用します)。フィールド セマンティクスは [ACP エージェント](/tools/acp-agents#channel-specific-settings) で共有されます。
- Telegram ストリーム プレビューは `sendMessage` + `editMessageText` を使用します (ダイレクト チャットおよびグループ チャットで機能します)。
- 再試行ポリシー: [再試行ポリシー](/concepts/retry) を参照してください。

### 不和

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: "your-bot-token",
      mediaMaxMb: 8,
      allowBots: false,
      actions: {
        reactions: true,
        stickers: true,
        polls: true,
        permissions: true,
        messages: true,
        threads: true,
        pins: true,
        search: true,
        memberInfo: true,
        roleInfo: true,
        roles: false,
        channelInfo: true,
        voiceStatus: true,
        events: true,
        moderation: false,
      },
      replyToMode: "off", // off | first | all
      dmPolicy: "pairing",
      allowFrom: ["1234567890", "123456789012345678"],
      dm: { enabled: true, groupEnabled: false, groupChannels: ["openclaw-dm"] },
      guilds: {
        "123456789012345678": {
          slug: "friends-of-openclaw",
          requireMention: false,
          ignoreOtherMentions: true,
          reactionNotifications: "own",
          users: ["987654321098765432"],
          channels: {
            general: { allow: true },
            help: {
              allow: true,
              requireMention: true,
              users: ["987654321098765432"],
              skills: ["docs"],
              systemPrompt: "Short answers only.",
            },
          },
        },
      },
      historyLimit: 20,
      textChunkLimit: 2000,
      chunkMode: "length", // length | newline
      streaming: "off", // off | partial | block | progress (progress maps to partial on Discord)
      maxLinesPerMessage: 17,
      ui: {
        components: {
          accentColor: "#5865F2",
        },
      },
      threadBindings: {
        enabled: true,
        idleHours: 24,
        maxAgeHours: 0,
        spawnSubagentSessions: false, // opt-in for sessions_spawn({ thread: true })
      },
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
      retry: {
        attempts: 3,
        minDelayMs: 500,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
  },
}
```- トークン: `channels.discord.token`、デフォルト アカウントのフォールバックとして `DISCORD_BOT_TOKEN`。
- オプションの `channels.discord.defaultAccount` は、設定されたアカウント ID と一致する場合、デフォルトのアカウント選択をオーバーライドします。
- 配信ターゲットには `user:<id>` (DM) または `channel:<id>` (ギルド チャネル) を使用します。裸の数値 ID は拒否されます。
- ギルド スラッグは小文字でスペースが `-` に置き換えられます。チャンネルキーはスラッグ名 (`#` ではありません) を使用します。ギルドIDを優先します。
- ボットが作成したメッセージはデフォルトでは無視されます。 `allowBots: true` はそれらを有効にします。 `allowBots: "mentions"` を使用して、ボットに言及するボット メッセージのみを受け入れます (独自のメッセージはまだフィルターされています)。
- `channels.discord.guilds.<id>.ignoreOtherMentions` (およびチャネル オーバーライド) は、別のユーザーまたはロールに言及するメッセージを削除しますが、ボットには言及しません (@everyone/@here を除く)。
- `maxLinesPerMessage` (デフォルトは 17) は、2000 文字未満の場合でも長いメッセージを分割します。
- `channels.discord.threadBindings` は、Discord のスレッドバインドされたルーティングを制御します。
  - `enabled`: スレッドバインドされたセッション機能の Discord オーバーライド (`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`、バインド配信/ルーティング)
  - `idleHours`: 非アクティブ状態が数時間で自動フォーカス解除されるための Discord オーバーライド (`0` は無効になります)
  - `maxAgeHours`: 時間単位のハードマックス年齢の Discord オーバーライド (`0` は無効になります)
  - `spawnSubagentSessions`: `sessions_spawn({ thread: true })` 自動スレッド作成/バインドのオプトイン スイッチ- `type: "acp"` を含むトップレベルの `bindings[]` エントリは、チャネルとスレッドの永続的な ACP バインディングを構成します (`match.peer.id` のチャネル/スレッド ID を使用します)。フィールド セマンティクスは [ACP エージェント](/tools/acp-agents#channel-specific-settings) で共有されます。
- `channels.discord.ui.components.accentColor` は、Discord コンポーネント v2 コンテナのアクセント カラーを設定します。
- `channels.discord.voice` は、Discord 音声チャネル会話とオプションの自動参加 + TTS オーバーライドを有効にします。
- `channels.discord.voice.daveEncryption` および `channels.discord.voice.decryptionFailureTolerance` は `@discordjs/voice` DAVE オプションに渡されます (デフォルトでは `true` および `24`)。
- OpenClaw はさらに、繰り返し復号化に失敗した後、音声セッションから離脱/再参加することで音声受信の回復を試みます。
- `channels.discord.streaming` は正規ストリーム モード キーです。従来の `streamMode` およびブール値 `streaming` 値は自動移行されます。
- `channels.discord.autoPresence` は、実行時の可用性をボットの存在にマップし (正常 => オンライン、劣化 => アイドル、消耗 => 停止)、オプションでステータス テキストの上書きを許可します。
- `channels.discord.dangerouslyAllowNameMatching` は、変更可能な名前/タグの一致を再度有効にします (ブレークグラス互換モード)。

**反応通知モード:** `off` (なし)、`own` (ボットのメッセージ、デフォルト)、`all` (すべてのメッセージ)、`allowlist` (すべてのメッセージの `guilds.<id>.users` から)。

### Google チャット

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      audienceType: "app-url", // app-url | project-number
      audience: "https://gateway.example.com/googlechat",
      webhookPath: "/googlechat",
      botUser: "users/1234567890",
      dm: {
        enabled: true,
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": { allow: true, requireMention: true },
      },
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```- サービス アカウント JSON: インライン (`serviceAccount`) またはファイルベース (`serviceAccountFile`)。
- サービス アカウント SecretRef もサポートされています (`serviceAccountRef`)。
- 環境フォールバック: `GOOGLE_CHAT_SERVICE_ACCOUNT` または `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`。
- 配信ターゲットには `spaces/<spaceId>` または `users/<userId>` を使用します。
- `channels.googlechat.dangerouslyAllowNameMatching` は、変更可能な電子メール プリンシパルの一致を再度有効にします (ブレークグラス互換モード)。

### スラック

```json5
{
  channels: {
    slack: {
      enabled: true,
      botToken: "xoxb-...",
      appToken: "xapp-...",
      dmPolicy: "pairing",
      allowFrom: ["U123", "U456", "*"],
      dm: { enabled: true, groupEnabled: false, groupChannels: ["G123"] },
      channels: {
        C123: { allow: true, requireMention: true, allowBots: false },
        "#general": {
          allow: true,
          requireMention: true,
          allowBots: false,
          users: ["U123"],
          skills: ["docs"],
          systemPrompt: "Short answers only.",
        },
      },
      historyLimit: 50,
      allowBots: false,
      reactionNotifications: "own",
      reactionAllowlist: ["U123"],
      replyToMode: "off", // off | first | all
      thread: {
        historyScope: "thread", // thread | channel
        inheritParent: false,
      },
      actions: {
        reactions: true,
        messages: true,
        pins: true,
        memberInfo: true,
        emojiList: true,
      },
      slashCommand: {
        enabled: true,
        name: "openclaw",
        sessionPrefix: "slack:slash",
        ephemeral: true,
      },
      typingReaction: "hourglass_flowing_sand",
      textChunkLimit: 4000,
      chunkMode: "length",
      streaming: "partial", // off | partial | block | progress (preview mode)
      nativeStreaming: true, // use Slack native streaming API when streaming=partial
      mediaMaxMb: 20,
    },
  },
}
````

- **ソケット モード**には、`botToken` と `appToken` の両方が必要です (デフォルトのアカウント環境フォールバックの場合は `SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN`)。
- **HTTP モード** には、`botToken` と `signingSecret` (ルートまたはアカウントごと) が必要です。
- `configWrites: false` は、Slack によって開始される設定の書き込みをブロックします。
- オプションの `channels.slack.defaultAccount` は、設定されたアカウント ID と一致する場合、デフォルトのアカウント選択をオーバーライドします。
- `channels.slack.streaming` は正規ストリーム モード キーです。従来の `streamMode` 値とブール値 `streaming` 値は自動移行されます。
- 配信ターゲットには `user:<id>` (DM) または `channel:<id>` を使用します。

**反応通知モード:** `off`、`own` (デフォルト)、`all`、`allowlist` (`reactionAllowlist` から)。

**スレッド セッションの分離:** `thread.historyScope` はスレッドごと (デフォルト)、またはチャネル全体で共有されます。 `thread.inheritParent` は、親チャネルのトランスクリプトを新しいスレッドにコピーします。- `typingReaction` は、返信の実行中に受信 Slack メッセージに一時的な反応を追加し、完了時に削除します。 `"hourglass_flowing_sand"` などの Slack 絵文字ショートコードを使用します。

| アクショングループ | デフォルト | メモ                    |
| ------------------ | ---------- | ----------------------- |
| 反応               | 有効       | 反応 + 反応のリスト     |
| メッセージ         | 有効       | 読み取り/送信/編集/削除 |
| ピン               | 有効       | 固定/固定解除/リスト    |
| メンバー情報       | 有効       | 会員情報                |
| 絵文字リスト       | 有効       | カスタム絵文字リスト    |

### 最も重要なこと

Mattermost はプラグインとして出荷されます: `openclaw plugins install @openclaw/mattermost`。

```json5
{
  channels: {
    mattermost: {
      enabled: true,
      botToken: "mm-token",
      baseUrl: "https://chat.example.com",
      dmPolicy: "pairing",
      chatmode: "oncall", // oncall | onmessage | onchar
      oncharPrefixes: [">", "!"],
      commands: {
        native: true, // opt-in
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Optional explicit URL for reverse-proxy/public deployments
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

チャット モード: `oncall` (@ メンションで応答、デフォルト)、`onmessage` (すべてのメッセージ)、`onchar` (トリガー プレフィックスで始まるメッセージ)。

Mattermost ネイティブ コマンドが有効な場合:- `commands.callbackPath` は、完全な URL ではなく、パス (`/api/channels/mattermost/command` など) である必要があります。

- `commands.callbackUrl` は OpenClaw ゲートウェイ エンドポイントに解決され、Mattermost サーバーから到達可能である必要があります。
- プライベート/テールネット/内部コールバック ホストの場合、Mattermost は必要な場合があります
  `ServiceSettings.AllowedUntrustedInternalConnections` には、コールバック ホスト/ドメインが含まれます。
  完全な URL ではなく、ホスト/ドメインの値を使用します。
- `channels.mattermost.configWrites`: Mattermost が開始する構成書き込みを許可または拒否します。
- `channels.mattermost.requireMention`: チャネルで返信する前に `@mention` が必要です。
- オプションの `channels.mattermost.defaultAccount` は、構成されたアカウント ID と一致する場合、デフォルトのアカウント選択をオーバーライドします。

### 信号

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // optional account binding
      dmPolicy: "pairing",
      allowFrom: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      configWrites: true,
      reactionNotifications: "own", // off | own | all | allowlist
      reactionAllowlist: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      historyLimit: 50,
    },
  },
}
```

**反応通知モード:** `off`、`own` (デフォルト)、`all`、`allowlist` (`reactionAllowlist` から)。

- `channels.signal.account`: チャネルの起動を特定の Signal アカウント ID に固定します。
- `channels.signal.configWrites`: Signal によって開始される構成書き込みを許可または拒否します。
- オプションの `channels.signal.defaultAccount` は、設定されたアカウント ID と一致する場合、デフォルトのアカウント選択をオーバーライドします。

### ブルーバブルズ

BlueBubbles が推奨される iMessage パスです (プラグインベース、`channels.bluebubbles` で構成)。

````json5
{
  channels: {
    bluebubbles: {
      enabled: true,
      dmPolicy: "pairing",
      // serverUrl, password, webhookPath, group controls, and advanced actions:
      // see /channels/bluebubbles
    },
  },
}
```- ここで取り上げるコアキーのパス: `channels.bluebubbles`、`channels.bluebubbles.dmPolicy`。
- オプションの `channels.bluebubbles.defaultAccount` は、構成されたアカウント ID と一致する場合、デフォルトのアカウント選択をオーバーライドします。
- 完全な BlueBubbles チャネル構成は [BlueBubbles](/channels/bluebubbles) に文書化されています。

### iメッセージ

OpenClaw は `imsg rpc` (標準入出力上の JSON-RPC) を生成します。デーモンやポートは必要ありません。

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "imsg",
      dbPath: "~/Library/Messages/chat.db",
      remoteHost: "user@gateway-host",
      dmPolicy: "pairing",
      allowFrom: ["+15555550123", "user@example.com", "chat_id:123"],
      historyLimit: 50,
      includeAttachments: false,
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      mediaMaxMb: 16,
      service: "auto",
      region: "US",
    },
  },
}
````

- オプションの `channels.imessage.defaultAccount` は、設定されたアカウント ID と一致する場合、デフォルトのアカウント選択をオーバーライドします。

- メッセージ DB へのフルディスク アクセスが必要です。
- `chat_id:<id>` ターゲットを優先します。チャットを一覧表示するには、`imsg chats --limit 20` を使用します。
- `cliPath` は SSH ラッパーを指すことができます。 SCP 添付ファイルを取得するために `remoteHost` (`host` または `user@host`) を設定します。
- `attachmentRoots` および `remoteAttachmentRoots` は、受信添付ファイル パスを制限します (デフォルト: `/Users/*/Library/Messages/Attachments`)。
- SCP は厳密なホスト キー チェックを使用するため、リレー ホスト キーが `~/.ssh/known_hosts` にすでに存在していることを確認してください。
- `channels.imessage.configWrites`: iMessage によって開始される設定の書き込みを許可または拒否します。

<Accordion title="iMessage SSH ラッパーの例">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Microsoft Teams

Microsoft Teams は拡張機能をサポートしており、`channels.msteams` で構成されています。

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, team/channel policies:
      // see /channels/msteams
    },
  },
}
```

- ここで取り上げるコアキーのパス: `channels.msteams`、`channels.msteams.configWrites`。
- 完全な Teams 構成 (資格情報、Webhook、DM/グループ ポリシー、チームごと/チャネルごとのオーバーライド) は、[Microsoft Teams](/channels/msteams) に文書化されています。### IRC

IRC は拡張機能をサポートしており、`channels.irc` で構成されています。

```json5
{
  channels: {
    irc: {
      enabled: true,
      dmPolicy: "pairing",
      configWrites: true,
      nickserv: {
        enabled: true,
        service: "NickServ",
        password: "${IRC_NICKSERV_PASSWORD}",
        register: false,
        registerEmail: "bot@example.com",
      },
    },
  },
}
```

- ここで説明するコアキーのパス: `channels.irc`、`channels.irc.dmPolicy`、`channels.irc.configWrites`、`channels.irc.nickserv.*`。
- オプションの `channels.irc.defaultAccount` は、構成されたアカウント ID と一致する場合、デフォルトのアカウント選択をオーバーライドします。
- 完全な IRC チャネル設定 (ホスト/ポート/TLS/チャネル/許可リスト/メンション ゲーティング) は [IRC](/channels/irc) に文書化されています。

### マルチアカウント (すべてのチャネル)

チャネルごとに複数のアカウントを実行します (それぞれに独自の `accountId` があります)。

````json5
{
  channels: {
    telegram: {
      accounts: {
        default: {
          name: "Primary bot",
          botToken: "123456:ABC...",
        },
        alerts: {
          name: "Alerts bot",
          botToken: "987654:XYZ...",
        },
      },
    },
  },
}
```- `default` は、`accountId` が省略された場合に使用されます (CLI + ルーティング)。
- 環境トークンは **デフォルト** アカウントにのみ適用されます。
- 基本チャネル設定は、アカウントごとに上書きされない限り、すべてのアカウントに適用されます。
- `bindings[].match.accountId` を使用して、各アカウントを別のエージェントにルーティングします。
- 単一アカウントのトップレベルのチャネル設定を使用しているときに、`openclaw channels add` (またはチャネルのオンボーディング) 経由でデフォルト以外のアカウントを追加すると、OpenClaw は最初にアカウントスコープのトップレベルの単一アカウントの値を `channels.<channel>.accounts.default` に移動し、元のアカウントが機能し続けるようにします。
- 既存のチャネルのみのバインディング (`accountId` なし) はデフォルトのアカウントと一致し続けます。アカウント スコープのバインディングはオプションのままです。
- `openclaw doctor --fix` は、名前付きアカウントが存在するが `default` が欠落している場合、アカウントをスコープとする最上位の単一アカウントの値を `accounts.default` に移動することにより、混合シェイプも修復します。

### その他の拡張チャネル

多くの拡張チャネルは `channels.<id>` として構成され、専用チャネル ページ (Feishu、Matrix、LINE、Nostr、Zalo、Nextcloud Talk、Synology Chat、Twitch など) に文書化されています。
完全なチャネル インデックスを参照してください: [チャネル](/channels)。

### グループチャットのメンションゲート

グループ メッセージはデフォルトで **メンションが必要** (メタデータのメンションまたは正規表現パターン) です。 WhatsApp、Telegram、Discord、Google Chat、および iMessage のグループ チャットに適用されます。

**メンションの種類:**- **メタデータのメンション**: ネイティブ プラットフォームの @-メンション。 WhatsApp セルフチャット モードでは無視されます。
- **テキスト パターン**: `agents.list[].groupChat.mentionPatterns` の正規表現パターン。常にチェックされています。
- メンション ゲートは、検出が可能な場合 (ネイティブ メンションまたは少なくとも 1 つのパターン) にのみ適用されます。

```json5
{
  messages: {
    groupChat: { historyLimit: 50 },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
````

`messages.groupChat.historyLimit` はグローバルなデフォルトを設定します。チャネルは `channels.<channel>.historyLimit` (またはアカウントごと) でオーバーライドできます。 `0` を無効に設定します。

#### DM 履歴の制限

```json5
{
  channels: {
    telegram: {
      dmHistoryLimit: 30,
      dms: {
        "123456789": { historyLimit: 50 },
      },
    },
  },
}
```

解決策: DM ごとのオーバーライド → プロバイダーのデフォルト → 制限なし (すべて保持)。

サポートされている: `telegram`、`whatsapp`、`discord`、`slack`、`signal`、`imessage`、`msteams`。

#### セルフチャットモード

セルフチャット モードを有効にするには、`allowFrom` に独自の番号を含めます (ネイティブの @-メンションを無視し、テキスト パターンにのみ応答します)。

```json5
{
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: { "*": { requireMention: true } },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: { mentionPatterns: ["reisponde", "@openclaw"] },
      },
    ],
  },
}
```

### コマンド (チャット コマンドの処理)

```json5
{
  commands: {
    native: "auto", // register native commands when supported
    text: true, // parse /commands in chat messages
    bash: false, // allow ! (alias: /bash)
    bashForegroundMs: 2000,
    config: false, // allow /config
    debug: false, // allow /debug
    restart: false, // allow /restart + gateway restart tool
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

<Accordion title="コマンド詳細">- テキスト コマンドは、先頭に `/` が付いた **スタンドアロン** メッセージである必要があります。

- `native: "auto"` は、Discord/Telegram のネイティブ コマンドをオンにし、Slack をオフのままにします。
- チャネルごとのオーバーライド: `channels.discord.commands.native` (ブール値または `"auto"`)。 `false` は、以前に登録されたコマンドをクリアします。
- `channels.telegram.customCommands` は、Telegram ボット メニュー エントリを追加します。
- `bash: true` は、ホスト シェルの `! <cmd>` を有効にします。 `tools.elevated.enabled` と `tools.elevated.allowFrom.<channel>` の送信者が必要です。
- `config: true` は `/config` を有効にします (`openclaw.json` の読み取り/書き込み)。ゲートウェイ `chat.send` クライアントの場合、永続的な `/config set|unset` 書き込みには `operator.admin` も必要です。読み取り専用 `/config show` は、通常の書き込みスコープのオペレーター クライアントで引き続き使用できます。
- `channels.<provider>.configWrites` はチャネルごとに構成の変更をゲートします (デフォルト: true)。
- `allowFrom` はプロバイダーごとです。設定すると、**唯一**の認証ソースになります (チャネル許可リスト/ペアリングと `useAccessGroups` は無視されます)。
- `useAccessGroups: false` を使用すると、`allowFrom` が設定されていない場合に、コマンドがアクセス グループ ポリシーをバイパスできます。

</Accordion>

---

## エージェントのデフォルト

### `agents.defaults.workspace`

デフォルト: `~/.openclaw/workspace`。

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

システム プロンプトのランタイム行に表示されるオプションのリポジトリ ルート。設定されていない場合、OpenClaw はワークスペースから上に向かって歩くことによって自動検出します。

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skipBootstrap`ワークスペース ブートストラップ ファイル (`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、 `BOOTSTRAP.md`)

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.bootstrapMaxChars`

切り詰められる前のワークスペース ブートストラップ ファイルあたりの最大文字数。デフォルト: `20000`。

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

すべてのワークスペース ブートストラップ ファイルに挿入される最大合計文字数。デフォルト: `150000`。

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 150000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

ブートストラップ コンテキストが切り詰められた場合に、エージェントに表示される警告テキストを制御します。
デフォルト: `"once"`。

- `"off"`: システム プロンプトに警告テキストを挿入しないでください。
- `"once"`: 一意の切り捨て署名ごとに 1 回警告を挿入します (推奨)。
- `"always"`: 切り捨てが存在する場合、実行ごとに警告を挿入します。

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### `agents.defaults.imageMaxDimensionPx`

プロバイダー呼び出し前のトランスクリプト/ツール画像ブロック内の最長画像側の最大ピクセル サイズ。
デフォルト: `1200`。

通常、値を低くすると、ビジョン トークンの使用量が減り、スクリーンショットを大量に使用する実行の場合に要求されるペイロード サイズが減ります。
値を大きくすると、視覚的な詳細がより多く保持されます。

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

システム プロンプト コンテキストのタイムゾーン (メッセージ タイムスタンプではありません)。ホストのタイムゾーンにフォールバックします。

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

システムプロンプトの時刻形式。デフォルト: `auto` (OS 設定)。

````json5
{
  agents: { defaults: { timeFormat: "auto" } }, // auto | 12 | 24
}
```### `agents.defaults.model`

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "minimax/MiniMax-M2.5": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.5"],
      },
      imageModel: {
        primary: "openrouter/qwen/qwen-2.5-vl-72b-instruct:free",
        fallbacks: ["openrouter/google/gemini-2.0-flash-vision:free"],
      },
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5-mini"],
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
      elevatedDefault: "on",
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      contextTokens: 200000,
      maxConcurrent: 3,
    },
  },
}
```- `model`: 文字列 (`"provider/model"`) またはオブジェクト (`{ primary, fallbacks }`) を受け入れます。
  ・文字列形式はプライマリモデルのみ設定します。
  - オブジェクト形式は、プライマリおよび順序付けされたフェイルオーバー モデルを設定します。
- `imageModel`: 文字列 (`"provider/model"`) またはオブジェクト (`{ primary, fallbacks }`) を受け入れます。
  - `image` ツール パスによってビジョン モデル構成として使用されます。
  - 選択/デフォルトのモデルが画像入力を受け入れられない場合のフォールバック ルーティングとしても使用されます。
- `pdfModel`: 文字列 (`"provider/model"`) またはオブジェクト (`{ primary, fallbacks }`) を受け入れます。
  - モデル ルーティング用の `pdf` ツールによって使用されます。
  - 省略した場合、PDF ツールは `imageModel` にフォールバックし、その後ベストエフォート型プロバイダーのデフォルトにフォールバックします。
- `pdfMaxBytesMb`: 呼び出し時に `maxBytesMb` が渡されない場合の、`pdf` ツールのデフォルトの PDF サイズ制限。
- `pdfMaxPages`: `pdf` ツールの抽出フォールバック モードで考慮されるデフォルトの最大ページ数。
- `model.primary`: `provider/model` の形式 (例: `anthropic/claude-opus-4-6`)。プロバイダーを省略した場合、OpenClaw は `anthropic` (非推奨) を想定します。
- `models`: `/model` の構成されたモデル カタログと許可リスト。各エントリには、`alias` (ショートカット) および `params` (プロバイダー固有、たとえば、`temperature`、`maxTokens`、`cacheRetention`、`context1m`) を含めることができます。- `params` マージ優先順位 (構成): `agents.defaults.models["provider/model"].params` がベースで、その後 `agents.list[].params` (エージェント ID と一致する) がキーによってオーバーライドされます。
- これらのフィールドを変更する構成ライター (`/models set`、`/models set-image`、およびフォールバック追加/削除コマンドなど) は、可能であれば正規のオブジェクト形式を保存し、既存のフォールバック リストを保存します。
- `maxConcurrent`: 最大並列エージェントはセッション間で実行されます (各セッションはまだシリアル化されています)。デフォルト: 1。

**組み込みのエイリアスの短縮表記** (モデルが `agents.defaults.models` の場合にのみ適用されます):

|別名 |モデル |
| ------------------- | -------------------------------------- |
| `opus` | `anthropic/claude-opus-4-6` |
| `sonnet` | `anthropic/claude-sonnet-4-6` |
| `gpt` | `openai/gpt-5.4` |
| `gpt-mini` | `openai/gpt-5-mini` |
| `gemini` | `google/gemini-3.1-pro-preview` |
| `gemini-flash` | `google/gemini-3-flash-preview` |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview` |

設定したエイリアスは常にデフォルトよりも優先されます。Z.AI GLM-4.x モデルは、`--thinking off` を設定するか、`agents.defaults.models["zai/<model>"].params.thinking` を自分で定義しない限り、思考モードを自動的に有効にします。
Z.AI モデルでは、ツール呼び出しストリーミングに対してデフォルトで `tool_stream` が有効になっています。無効にするには、`agents.defaults.models["zai/<model>"].params.tool_stream` を `false` に設定します。
Anthropic Claude 4.6 モデルは、明示的思考レベルが設定されていない場合、デフォルトで `adaptive` 思考になります。

### `agents.defaults.cliBackends`

テキストのみのフォールバック実行用のオプションの CLI バックエンド (ツール呼び出しなし)。 API プロバイダーに障害が発生した場合のバックアップとして役立ちます。

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          systemPromptArg: "--system",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
````

- CLI バックエンドはテキストファーストです。ツールは常に無効になっています。
- `sessionArg` が設定されている場合にサポートされるセッション。
- `imageArg` がファイル パスを受け入れる場合、イメージ パススルーがサポートされます。

### `agents.defaults.heartbeat`

定期的なハートビートが実行されます。

````json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m disables
        model: "openai/gpt-5.2-mini",
        includeReasoning: false,
        lightContext: false, // default: false; true keeps only HEARTBEAT.md from workspace bootstrap files
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (default) | block
        target: "none", // default: none | options: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
      },
    },
  },
}
```- `every`: 期間文字列 (ms/s/m/h)。デフォルト: `30m`。
- `suppressToolErrorWarnings`: true の場合、ハートビートの実行中にツール エラー警告ペイロードが抑制されます。
- `directPolicy`: 直接/DM 配信ポリシー。 `allow` (デフォルト) は、直接ターゲット配信を許可します。 `block` は直接ターゲットの配信を抑制し、`reason=dm-blocked` を発行します。
- `lightContext`: true の場合、ハートビートの実行では軽量ブートストラップ コンテキストが使用され、ワー​​クスペース ブートストラップ ファイルから `HEARTBEAT.md` のみが保持されます。
- エージェントごと: `agents.list[].heartbeat` を設定します。いずれかのエージェントが `heartbeat` を定義すると、**それらのエージェントのみ** がハートビートを実行します。
- ハートビートはエージェント ターン全体を実行します。間隔が短いほど、より多くのトークンが消費されます。

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        reserveTokensFloor: 24000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // used when identifierPolicy=custom
        postCompactionSections: ["Session Startup", "Red Lines"], // [] disables reinjection
        model: "openrouter/anthropic/claude-sonnet-4-5", // optional compaction-only model override
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```- `mode`: `default` または `safeguard` (長い履歴のチャンク化された要約)。 [圧縮](/concepts/compaction) を参照してください。
- `identifierPolicy`: `strict` (デフォルト)、`off`、または `custom`。 `strict` は、圧縮要約中に組み込みの不透明な識別子保持ガイダンスを先頭に追加します。
- `identifierInstructions`: `identifierPolicy=custom` の場合に使用されるオプションのカスタム識別子保存テキスト。
- `postCompactionSections`: 圧縮後に再挿入するオプションの AGENTS.md H2/H3 セクション名。デフォルトは `["Session Startup", "Red Lines"]` です。 `[]` を設定して再注入を無効にします。設定を解除するか、そのデフォルトのペアに明示的に設定すると、古い `Every Session`/`Safety` 見出しもレガシー フォールバックとして受け入れられます。
- `model`: 圧縮要約のみのオプションの `provider/model-id` オーバーライド。これは、メイン セッションで 1 つのモデルを保持する必要があるが、圧縮サマリーを別のモデルで実行する必要がある場合に使用します。設定されていない場合、圧縮ではセッションのプライマリ モデルが使用されます。
- `memoryFlush`: 耐久性のあるメモリを保存するための自動圧縮前のサイレント エージェント ターン。ワークスペースが読み取り専用の場合はスキップされます。

### `agents.defaults.contextPruning`

LLM に送信する前に、メモリ内コンテキストから **古いツールの結果** を削除します。ディスク上のセッション履歴は**変更されません**。

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // duration (ms/s/m/h), default unit: minutes
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Old tool result content cleared]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
````

<Accordion title="キャッシュ TTL モードの動作">- `mode: "cache-ttl"` はプルーニング パスを有効にします。

- `ttl` は、プルーニングを再度実行できる頻度 (最後のキャッシュ タッチ後) を制御します。
- プルーニングでは、まずサイズの大きいツール結果がソフト トリムされ、次に必要に応じて古いツール結果がハードクリアされます。

**ソフトトリム**は、先頭と末尾を維持し、途中に `...` を挿入します。

**ハードクリア** は、ツールの結果全体をプレースホルダーに置き換えます。

注:

- 画像ブロックは決してトリミング/クリアされません。
- 比率は文字ベース (概算) であり、正確なトークン数ではありません。
- 存在するアシスタント メッセージが `keepLastAssistants` 未満の場合、プルーニングはスキップされます。

</Accordion>

動作の詳細については、[セッション プルーニング](/concepts/session-pruning) を参照してください。

### ストリーミングをブロックする

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (use minMs/maxMs)
    },
  },
}
```

- Telegram 以外のチャネルでは、ブロック応答を有効にするには明示的な `*.blockStreaming: true` が必要です。
- チャネル オーバーライド: `channels.<channel>.blockStreamingCoalesce` (およびアカウントごとのバリアント)。 Signal/Slack/Discord/Google Chat のデフォルト `minChars: 1500`。
- `humanDelay`: ブロック返信間のランダムな一時停止。 `natural` = 800 ～ 2500 ミリ秒。エージェントごとのオーバーライド: `agents.list[].humanDelay`。

動作とチャンク化の詳細については、[ストリーミング](/concepts/streaming) を参照してください。

### タイピングインジケーター

```json5
{
  agents: {
    defaults: {
      typingMode: "instant", // never | instant | thinking | message
      typingIntervalSeconds: 6,
    },
  },
}
```

- デフォルト: 直接チャット/メンションの場合は `instant`、言及されていないグループ チャットの場合は `message`。
- セッションごとのオーバーライド: `session.typingMode`、`session.typingIntervalSeconds`。

[タイピングインジケーター](/concepts/typing-indicators) を参照してください。

### `agents.defaults.sandbox`埋め込みエージェント用のオプションの **Docker サンドボックス**。完全なガイドについては、[サンドボックス](/gateway/sandboxing) を参照してください

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        scope: "agent", // session | agent | shared
        workspaceAccess: "none", // none | ro | rw
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          containerPrefix: "openclaw-sbx-",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
          capDrop: ["ALL"],
          env: { LANG: "C.UTF-8" },
          setupCommand: "apt-get update && apt-get install -y git curl jq",
          pidsLimit: 256,
          memory: "1g",
          memorySwap: "2g",
          cpus: 1,
          ulimits: {
            nofile: { soft: 1024, hard: 2048 },
            nproc: 256,
          },
          seccompProfile: "/path/to/seccomp.json",
          apparmorProfile: "openclaw-sandbox",
          dns: ["1.1.1.1", "8.8.8.8"],
          extraHosts: ["internal.service:10.0.0.5"],
          binds: ["/home/user/source:/source:rw"],
        },
        browser: {
          enabled: false,
          image: "openclaw-sandbox-browser:bookworm-slim",
          network: "openclaw-sandbox-browser",
          cdpPort: 9222,
          cdpSourceRange: "172.21.0.1/32",
          vncPort: 5900,
          noVncPort: 6080,
          headless: false,
          enableNoVnc: true,
          allowHostControl: false,
          autoStart: true,
          autoStartTimeoutMs: 12000,
        },
        prune: {
          idleHours: 24,
          maxAgeDays: 7,
        },
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        allow: [
          "exec",
          "process",
          "read",
          "write",
          "edit",
          "apply_patch",
          "sessions_list",
          "sessions_history",
          "sessions_send",
          "sessions_spawn",
          "session_status",
        ],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"],
      },
    },
  },
}
```

<Accordion title="サンドボックスの詳細">

**ワークスペースへのアクセス:**

- `none`: `~/.openclaw/sandboxes` の下のスコープごとのサンドボックス ワークスペース
- `ro`: サンドボックス ワークスペースは `/workspace`、エージェント ワークスペースは `/agent` に読み取り専用でマウントされています
- `rw`: エージェント ワークスペースは `/workspace` に読み取り/書き込み可能にマウントされました

**範囲:**

- `session`: セッションごとのコンテナ + ワークスペース
- `agent`: エージェントごとに 1 つのコンテナ + ワークスペース (デフォルト)
- `shared`: 共有コンテナーとワークスペース (セッション間の分離なし)

**`setupCommand`** は、コンテナーの作成後に 1 回実行されます (`sh -lc` 経由)。ネットワーク出力、書き込み可能な root、root ユーザーが必要です。

**コンテナのデフォルトは `network: "none"`** です。エージェントが送信アクセスを必要とする場合は、`"bridge"` (またはカスタム ブリッジ ネットワーク) に設定されます。
`"host"` はブロックされています。 `"container:<id>"` は、明示的に設定しない限り、デフォルトでブロックされます
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (ガラス破り)。

**受信添付ファイル**は、アクティブなワークスペースの `media/inbound/*` にステージングされます。

**`docker.binds`** は追加のホスト ディレクトリをマウントします。グローバル バインドとエージェントごとのバインドがマージされます。**サンドボックス ブラウザ** (`sandbox.browser.enabled`): コンテナ内の Chromium + CDP。 noVNC URL がシステム プロンプトに挿入されました。 `openclaw.json` に `browser.enabled` は必要ありません。
noVNC オブザーバー アクセスでは、デフォルトで VNC 認証が使用され、OpenClaw は (共有 URL でパスワードを公開する代わりに) 有効期間の短いトークン URL を発行します。- `allowHostControl: false` (デフォルト) は、サンドボックス化されたセッションがホスト ブラウザーをターゲットにすることをブロックします。

- `network` のデフォルトは `openclaw-sandbox-browser` (専用ブリッジ ネットワーク) です。明示的にグローバル ブリッジ接続が必要な場合にのみ、`bridge` に設定します。
- `cdpSourceRange` は、オプションでコンテナ エッジでの CDP イングレスを CIDR 範囲に制限します (`172.21.0.1/32` など)。
- `sandbox.browser.binds` は、追加のホスト ディレクトリをサンドボックス ブラウザ コンテナのみにマウントします。設定すると (`[]` を含む)、ブラウザー コンテナーの `docker.binds` が置き換えられます。
- 起動デフォルトは `scripts/sandbox-browser-entrypoint.sh` で定義され、コンテナー ホスト用に調整されています。
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-3d-apis`
  - `--disable-gpu`
  - `--disable-software-rasterizer`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-features=TranslateUI`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--renderer-process-limit=2`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--disable-extensions` (デフォルトで有効)
  - `--disable-3d-apis`、`--disable-software-rasterizer`、および `--disable-gpu` は
    デフォルトで有効になっており、次のコマンドで無効にできます
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` WebGL/3D の使用に必要な場合。
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` は、ワークフローが次の場合に拡張機能を再度有効にします。
    彼ら次第です。
  - `--renderer-process-limit=2` は次のように変更できます。
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; Chromium を使用するように `0` を設定します
    デフォルトのプロセス制限。- `noSandbox` が有効な場合は、`--no-sandbox` および `--disable-setuid-sandbox` が追加されます。
  - デフォルトはコンテナイメージのベースラインです。カスタムのブラウザ画像をカスタムで使用する
    コンテナのデフォルトを変更するためのエントリポイント。

</Accordion>

イメージをビルドします。

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

### `agents.list` (エージェントごとの上書き)

````json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "Main Agent",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // or { primary, fallbacks }
        params: { cacheRetention: "none" }, // overrides matching defaults.models params by key
        identity: {
          name: "Samantha",
          theme: "helpful sloth",
          emoji: "🦥",
          avatar: "avatars/samantha.png",
        },
        groupChat: { mentionPatterns: ["@openclaw"] },
        sandbox: { mode: "off" },
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
        subagents: { allowAgents: ["*"] },
        tools: {
          profile: "coding",
          allow: ["browser"],
          deny: ["canvas"],
          elevated: { enabled: true },
        },
      },
    ],
  },
}
```- `id`: 安定したエージェント ID (必須)。
- `default`: 複数が設定されている場合、最初が優先されます (警告がログに記録されます)。何も設定されていない場合は、最初のリスト エントリがデフォルトになります。
- `model`: 文字列形式は `primary` のみをオーバーライドします。オブジェクト フォーム `{ primary, fallbacks }` は両方をオーバーライドします (`[]` はグローバル フォールバックを無効にします)。 `primary` をオーバーライドするだけの Cron ジョブは、`fallbacks: []` を設定しない限り、デフォルトのフォールバックを継承します。
- `params`: `agents.defaults.models` で選択されたモデル エントリにマージされたエージェントごとのストリーム パラメーター。これは、モデル カタログ全体を複製せずに、`cacheRetention`、`temperature`、`maxTokens` などのエージェント固有のオーバーライドに使用します。
- `runtime`: オプションのエージェントごとのランタイム記述子。エージェントがデフォルトで ACP ハーネス セッションを使用する必要がある場合は、`type: "acp"` を `runtime.acp` デフォルト (`agent`、`backend`、`mode`、`cwd`) とともに使用します。
- `identity.avatar`: ワークスペース相対パス、`http(s)` URL、または `data:` URI。
- `identity` はデフォルトを派生します: `emoji` から `ackReaction`、`name`/`emoji` から `mentionPatterns`。
- `subagents.allowAgents`: `sessions_spawn` のエージェント ID の許可リスト (`["*"]` = 任意、デフォルト: 同じエージェントのみ)。
- サンドボックス継承ガード: リクエスター セッションがサンドボックス化されている場合、`sessions_spawn` はサンドボックス化されずに実行されるターゲットを拒否します。

---## マルチエージェントルーティング

1 つのゲートウェイ内で複数の分離されたエージェントを実行します。 [マルチエージェント](/concepts/multi-agent) を参照してください。

```json5
{
  agents: {
    list: [
      { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
      { id: "work", workspace: "~/.openclaw/workspace-work" },
    ],
  },
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
  ],
}
````

### 一致フィールドのバインディング

- `type` (オプション): 通常のルーティングの場合は `route` (タイプが欠落している場合はデフォルトでルーティングされます)、永続的な ACP 会話バインディングの場合は `acp`。
- `match.channel` (必須)
- `match.accountId` (オプション; `*` = 任意のアカウント; 省略 = デフォルトのアカウント)
- `match.peer` (オプション; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (オプション、チャネル固有)
- `acp` (オプション; `type: "acp"` のみ): `{ mode, label, cwd, backend }`

**決定的な一致順序:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (正確、ピア/ギルド/チームなし)
5. `match.accountId: "*"` (チャネル全体)
6. デフォルトエージェント

各層内で、最初に一致した `bindings` エントリが優先されます。

`type: "acp"` エントリの場合、OpenClaw は正確な会話 ID (`match.channel` + アカウント + `match.peer.id`) によって解決し、上記のルート バインディング層の順序は使用しません。

### エージェントごとのアクセス プロファイル

<Accordion title="フルアクセス (サンドボックスなし)">

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="読み取り専用ツール + ワークスペース">

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "ro" },
        tools: {
          allow: [
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="ファイルシステムへのアクセスなし (メッセージングのみ)">

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "none" },
        tools: {
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
            "gateway",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

</Accordion>

優先順位の詳細については、[マルチエージェント サンドボックスとツール](/tools/multi-agent-sandbox-tools) を参照してください。

---

## セッション

```json5
{
  session: {
    scope: "per-sender",
    dmScope: "main", // main | per-peer | per-channel-peer | per-account-channel-peer
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      mode: "daily", // daily | idle
      atHour: 4,
      idleMinutes: 60,
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      direct: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    parentForkMaxTokens: 100000, // skip parent-thread fork above this token count (0 disables)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // duration or false
      maxDiskBytes: "500mb", // optional hard budget
      highWaterBytes: "400mb", // optional cleanup target
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // default inactivity auto-unfocus in hours (`0` disables)
      maxAgeHours: 0, // default hard max age in hours (`0` disables)
    },
    mainKey: "main", // legacy (runtime always uses "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="セッションフィールドの詳細">- **`dmScope`**: DM がグループ化される方法。

- `main`: すべての DM がメイン セッションを共有します。
- `per-peer`: チャネル間で送信者 ID によって分離します。
- `per-channel-peer`: チャネル + 送信者ごとに分離します (マルチユーザーの受信箱に推奨)。
- `per-account-channel-peer`: アカウント + チャネル + 送信者ごとに分離します (複数のアカウントに推奨)。
- **`identityLinks`**: クロスチャネルセッション共有のために、正規 ID をプロバイダープレフィックス付きのピアにマップします。
- **`reset`**: プライマリ リセット ポリシー。 `daily` は現地時間の `atHour` にリセットされます。 `idle` は `idleMinutes` の後にリセットされます。両方が設定されている場合は、先に期限が切れた方が優先されます。
- **`resetByType`**: タイプごとのオーバーライド (`direct`、`group`、`thread`)。レガシー `dm` は `direct` のエイリアスとして受け入れられます。
- **`parentForkMaxTokens`**: フォークされたスレッド セッションの作成時に許可される最大親セッション `totalTokens` (デフォルト `100000`)。
  - 親 `totalTokens` がこの値を超えている場合、OpenClaw は親トランスクリプト履歴を継承する代わりに、新しいスレッド セッションを開始します。
  - このガードを無効にし、常に親のフォークを許可するには、`0` を設定します。
- **`mainKey`**: 従来のフィールド。ランタイムは、メインのダイレクト チャット バケットに常に `"main"` を使用するようになりました。- **`sendPolicy`**: `channel`、`chatType` (`direct|group|channel`、従来の `dm` エイリアスを使用)、`keyPrefix`、または `rawKeyPrefix` による一致。最初に拒否した方が勝ちです。
- **`maintenance`**: セッション ストアのクリーンアップ + 保持制御。
  - `mode`: `warn` は警告のみを発行します。 `enforce` はクリーンアップを適用します。
  - `pruneAfter`: 古いエントリの期限切れ (デフォルト `30d`)。
  - `maxEntries`: `sessions.json` のエントリの最大数 (デフォルトは `500`)。
  - `rotateBytes`: このサイズを超える場合、`sessions.json` を回転します (デフォルト `10mb`)。
  - `resetArchiveRetention`: `*.reset.<timestamp>` トランスクリプト アーカイブの保持。デフォルトは `pruneAfter` です。 `false` を無効に設定します。
  - `maxDiskBytes`: オプションのセッション ディレクトリのディスク バジェット。 `warn` モードでは、警告がログに記録されます。 `enforce` モードでは、最も古いアーティファクト/セッションが最初に削除されます。
  - `highWaterBytes`: 予算クリーンアップ後のオプションのターゲット。デフォルトは `80%` または `maxDiskBytes` です。
- **`threadBindings`**: スレッドバインドされたセッション機能のグローバルデフォルト。
  - `enabled`: マスターデフォルトスイッチ (プロバイダーは上書き可能; Discord は `channels.discord.threadBindings.enabled` を使用します)
  - `idleHours`: デフォルトの非アクティブ状態は時間単位で自動的にフォーカスを解除します (`0` は無効になります。プロバイダーはオーバーライドできます)- `maxAgeHours`: デフォルトのハードマックス経過時間 (`0` は無効になります。プロバイダーはオーバーライドできます)

</Accordion>

---

## メッセージ

```json5
{
  messages: {
    responsePrefix: "🦞", // or "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "collect", // steer | followup | collect | steer-backlog | steer+backlog | queue | interrupt
      debounceMs: 1000,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "collect",
        telegram: "collect",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 disables
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### 応答プレフィックス

チャネル/アカウントごとのオーバーライド: `channels.<channel>.responsePrefix`、`channels.<channel>.accounts.<id>.responsePrefix`。

解決策 (最も具体的な勝利): アカウント → チャネル → グローバル。 `""` はカスケードを無効にして停止します。 `"auto"` は `[{identity.name}]` を派生させます。

**テンプレート変数:**

| 変数              | 説明               | 例                          |
| ----------------- | ------------------ | --------------------------- |
| `{model}`         | 短いモデル名       | `claude-opus-4-6`           |
| `{modelFull}`     | 完全なモデル識別子 | `anthropic/claude-opus-4-6` |
| `{provider}`      | プロバイダー名     | `anthropic`                 |
| `{thinkingLevel}` | 現在の思考レベル   | `high`、`low`、`off`        |
| `{identity.name}` | エージェント ID 名 | (`"auto"` と同じ)           |

変数では大文字と小文字が区別されません。 `{think}` は、`{thinkingLevel}` のエイリアスです。

### ACK反応- デフォルトはアクティブなエージェントの `identity.emoji`、それ以外の場合は `"👀"` です。 `""` を無効に設定します

- チャネルごとのオーバーライド: `channels.<channel>.ackReaction`、`channels.<channel>.accounts.<id>.ackReaction`。
- 解決順序: アカウント → チャネル → `messages.ackReaction` → ID フォールバック。
- スコープ: `group-mentions` (デフォルト)、`group-all`、`direct`、`all`。
- `removeAckAfterReply`: 返信後の確認応答を削除します (Slack/Discord/Telegram/Google Chat のみ)。

### インバウンドデバウンス

同じ送信者からのテキストのみの迅速なメッセージを 1 つのエージェント ターンにバッチ処理します。メディア/添付ファイルはすぐにフラッシュされます。制御コマンドはデバウンスをバイパスします。

### TTS (テキスト読み上げ)

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      elevenlabs: {
        apiKey: "elevenlabs_api_key",
        baseUrl: "https://api.elevenlabs.io",
        voiceId: "voice_id",
        modelId: "eleven_multilingual_v2",
        seed: 42,
        applyTextNormalization: "auto",
        languageCode: "en",
        voiceSettings: {
          stability: 0.5,
          similarityBoost: 0.75,
          style: 0.0,
          useSpeakerBoost: true,
          speed: 1.0,
        },
      },
      openai: {
        apiKey: "openai_api_key",
        baseUrl: "https://api.openai.com/v1",
        model: "gpt-4o-mini-tts",
        voice: "alloy",
      },
    },
  },
}
```

- `auto` は自動 TTS を制御します。 `/tts off|always|inbound|tagged` はセッションごとにオーバーライドされます。
- `summaryModel` は、自動要約の `agents.defaults.model.primary` をオーバーライドします。
- `modelOverrides` はデフォルトで有効になっています。 `modelOverrides.allowProvider` のデフォルトは `false` (オプトイン) です。
- API キーは `ELEVENLABS_API_KEY`/`XI_API_KEY` および `OPENAI_API_KEY` にフォールバックします。
- `openai.baseUrl` は OpenAI TTS エンドポイントをオーバーライドします。解決順序は、config、次に `OPENAI_TTS_BASE_URL`、次に `https://api.openai.com/v1` です。
- `openai.baseUrl` が非 OpenAI エンドポイントを指している場合、OpenClaw はそれを OpenAI 互換の TTS サーバーとして扱い、モデル/音声の検証を緩和します。

---

## 話す

トーク モードのデフォルト (macOS/iOS/Android)。

````json5
{
  talk: {
    voiceId: "elevenlabs_voice_id",
    voiceAliases: {
      Clawd: "EXAVITQu4vr4xnSDxMaL",
      Roger: "CwhRBWXzGAHq8TQ4Fs17",
    },
    modelId: "eleven_v3",
    outputFormat: "mp3_44100_128",
    apiKey: "elevenlabs_api_key",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```- 音声 ID は `ELEVENLABS_VOICE_ID` または `SAG_VOICE_ID` にフォールバックします。
- `apiKey` および `providers.*.apiKey` は、プレーンテキスト文字列または SecretRef オブジェクトを受け入れます。
- `ELEVENLABS_API_KEY` フォールバックは、Talk API キーが設定されていない場合にのみ適用されます。
- `voiceAliases` により、Talk ディレクティブにフレンドリ名を使用できるようになります。
- `silenceTimeoutMs` は、ユーザーが沈黙した後、トランスクリプトを送信するまでトーク モードが待機する時間を制御します。設定を解除すると、プラットフォームのデフォルトの一時停止ウィンドウ (`700 ms on macOS and Android, 900 ms on iOS`) が維持されます。

---

## ツール

### 工具プロファイル

`tools.profile` は、`tools.allow`/`tools.deny` の前に基本ホワイトリストを設定します。

ローカル オンボーディングは、設定を解除すると、新しいローカル構成をデフォルトで `tools.profile: "coding"` に設定します (既存の明示的なプロファイルは保持されます)。

|プロフィール |含まれるもの |
| ----------- | ----------------------------------------------------------------------------------------- |
| `minimal` | `session_status` のみ |
| `coding` | `group:fs`、`group:runtime`、`group:sessions`、`group:memory`、`image` |
| `messaging` | `group:messaging`、`sessions_list`、`sessions_history`、`sessions_send`、`session_status` |
| `full` |制限なし（未設定と同じ） |### ツールグループ|グループ |ツール |
| ------------------ | -------------------------------------------------------------------------------------- |
| `group:runtime` | `exec`、`process` (`bash` は `exec` のエイリアスとして受け入れられます)
| `group:fs` | `read`、`write`、`edit`、`apply_patch` |
| `group:sessions` | `sessions_list`、`sessions_history`、`sessions_send`、`sessions_spawn`、`session_status` |
| `group:memory` | `memory_search`、`memory_get` |
| `group:web` | `web_search`、`web_fetch` |
| `group:ui` | `browser`、`canvas` |
| `group:automation` | `cron`、`gateway` |
| `group:messaging` | `message` || `group:nodes` | `nodes` |
| `group:openclaw` |すべての組み込みツール (プロバイダー プラグインを除く) |

### `tools.allow` / `tools.deny`

グローバル ツールの許可/拒否ポリシー (拒否の勝利)。大文字と小文字は区別されず、`*` ワイルドカードをサポートします。 Docker サンドボックスがオフの場合でも適用されます。

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
````

### `tools.byProvider`

特定のプロバイダーまたはモデル用のツールをさらに制限します。順序: 基本プロファイル → プロバイダー プロファイル → 許可/拒否。

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
      "openai/gpt-5.2": { allow: ["group:fs", "sessions_list"] },
    },
  },
}
```

### `tools.elevated`

昇格された (ホスト) 実行アクセスを制御します。

```json5
{
  tools: {
    elevated: {
      enabled: true,
      allowFrom: {
        whatsapp: ["+15555550123"],
        discord: ["1234567890123", "987654321098765432"],
      },
    },
  },
}
```

- エージェントごとのオーバーライド (`agents.list[].tools.elevated`) は、さらに制限することしかできません。
- `/elevated on|off|ask|full` はセッションごとの状態を保存します。インラインディレクティブは単一のメッセージに適用されます。
- 昇格された `exec` がホスト上で実行され、サンドボックスがバイパスされます。

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.2"],
      },
    },
  },
}
```

### `tools.loopDetection`

ツールループの安全性チェックは **デフォルトでは無効になっています**。 `enabled: true` を設定して検出を有効にします。
設定は `tools.loopDetection` でグローバルに定義でき、`agents.list[].tools.loopDetection` でエージェントごとに上書きできます。

````json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```- `historySize`: ループ解析のために保持される最大ツール呼び出し履歴。
- `warningThreshold`: 警告に対する進行なしパターンのしきい値を繰り返します。
- `criticalThreshold`: クリティカルなループをブロックするためのより高い繰り返ししきい値。
- `globalCircuitBreakerThreshold`: 進行状況のない実行に対するハードストップのしきい値。
- `detectors.genericRepeat`: 同じツール/同じ引数の繰り返し呼び出しを警告します。
- `detectors.knownPollNoProgress`: 既知の投票ツール (`process.poll`、`command_status` など) に対して警告/ブロックします。
- `detectors.pingPong`: 交互に進行しないペアのパターンを警告/ブロックします。
- `warningThreshold >= criticalThreshold` または `criticalThreshold >= globalCircuitBreakerThreshold` の場合、検証は失敗します。

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // or BRAVE_API_KEY env
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        maxChars: 50000,
        maxCharsCap: 50000,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        userAgent: "custom-ua",
      },
    },
  },
}
````

### `tools.media`

インバウンドメディア理解 (画像/音声/ビデオ) を構成します。

```json5
{
  tools: {
    media: {
      concurrency: 2,
      audio: {
        enabled: true,
        maxBytes: 20971520,
        scope: {
          default: "deny",
          rules: [{ action: "allow", match: { chatType: "direct" } }],
        },
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          { type: "cli", command: "whisper", args: ["--model", "base", "{{MediaPath}}"] },
        ],
      },
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },
}
```

<Accordion title="メディアモデル入力フィールド">

**プロバイダーエントリ** (`type: "provider"` または省略):

- `provider`: API プロバイダー ID (`openai`、`anthropic`、`google`/`gemini`、`groq` など)
- `model`: モデル ID の上書き
- `profile` / `preferredProfile`: `auth-profiles.json` プロファイルの選択

**CLI エントリ** (`type: "cli"`):

- `command`: 実行する実行可能ファイル
- `args`: テンプレート化された引数 (`{{MediaPath}}`、`{{Prompt}}`、`{{MaxChars}}` などをサポート)

**共通フィールド:**- `capabilities`: オプションのリスト (`image`、`audio`、`video`)。デフォルト: `openai`/`anthropic`/`minimax` → 画像、`google` → 画像+音声+ビデオ、`groq` → 音声。

- `prompt`、`maxChars`、`maxBytes`、`timeoutSeconds`、`language`: エントリごとの上書き。
- 失敗は次のエントリにフォールバックします。

プロバイダー認証は標準の順序に従います: `auth-profiles.json` → 環境変数 → `models.providers.*.apiKey`。

</Accordion>

### `tools.agentToAgent`

```json5
{
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },
}
```

### `tools.sessions`

セッション ツール (`sessions_list`、`sessions_history`、`sessions_send`) の対象にできるセッションを制御します。

デフォルト: `tree` (現在のセッション + それによって生成されたセッション (サブエージェントなど))。

```json5
{
  tools: {
    sessions: {
      // "self" | "tree" | "agent" | "all"
      visibility: "tree",
    },
  },
}
```

注:

- `self`: 現在のセッション キーのみ。
- `tree`: 現在のセッション + 現在のセッションによって生成されたセッション (サブエージェント)。
- `agent`: 現在のエージェント ID に属する任意のセッション (同じエージェント ID で送信者ごとのセッションを実行する場合は、他のユーザーを含めることができます)。
- `all`: 任意のセッション。クロスエージェントターゲティングには引き続き `tools.agentToAgent` が必要です。
- サンドボックス クランプ: 現在のセッションがサンドボックス化されており、`agents.defaults.sandbox.sessionToolsVisibility="spawned"` である場合、`tools.sessions.visibility="all"` であっても、可視性は強制的に `tree` に設定されます。

### `tools.sessions_spawn`

`sessions_spawn` のインライン添付ファイルのサポートを制御します。

````json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // opt-in: set true to allow inline file attachments
        maxTotalBytes: 5242880, // 5 MB total across all files
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB per file
        retainOnSessionKeep: false, // keep attachments when cleanup="keep"
      },
    },
  },
}
```注:

- 添付ファイルは `runtime: "subagent"` でのみサポートされます。 ACP ランタイムはそれらを拒否します。
- ファイルは、`.manifest.json` を使用して、`.openclaw/attachments/<uuid>/` の子ワークスペースに実体化されます。
- 添付ファイルのコンテンツは、トランスクリプトの永続性から自動的に編集されます。
- Base64 入力は、厳密なアルファベット/パディング チェックとプリデコード サイズ ガードによって検証されます。
- ファイル権限は、ディレクトリの場合は `0700`、ファイルの場合は `0600` です。
- クリーンアップは `cleanup` ポリシーに従います。 `delete` は常に添付ファイルを削除します。 `keep` は、`retainOnSessionKeep: true` の場合にのみそれらを保持します。

### `tools.subagents`

```json5
{
  agents: {
    defaults: {
      subagents: {
        model: "minimax/MiniMax-M2.5",
        maxConcurrent: 1,
        runTimeoutSeconds: 900,
        archiveAfterMinutes: 60,
      },
    },
  },
}
````

- `model`: 生成されたサブエージェントのデフォルト モデル。省略した場合、サブエージェントは呼び出し元のモデルを継承します。
- `runTimeoutSeconds`: ツール呼び出しで `runTimeoutSeconds` が省略された場合の `sessions_spawn` のデフォルトのタイムアウト (秒)。 `0` はタイムアウトがないことを意味します。
- サブエージェントごとのツール ポリシー: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`。

---

## カスタムプロバイダーとベース URL

OpenClaw は、pi-coding-agent モデル カタログを使用します。構成内の `models.providers` または `~/.openclaw/agents/<agentId>/agent/models.json` を介してカスタム プロバイダーを追加します。

````json5
{
  models: {
    mode: "merge", // merge (default) | replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai
        models: [
          {
            id: "llama-3.1-8b",
            name: "Llama 3.1 8B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```- カスタム認証が必要な場合は、`authHeader: true` + `headers` を使用します。
- エージェント設定ルートを `OPENCLAW_AGENT_DIR` (または `PI_CODING_AGENT_DIR`) でオーバーライドします。
- 一致するプロバイダー ID のマージの優先順位:
  - 空ではないエージェント `models.json` `baseUrl` 値が優先されます。
  - 空ではないエージェント `apiKey` 値は、そのプロバイダーが現在の構成/認証プロファイル コンテキストで SecretRef で管理されていない場合にのみ優先されます。
  - SecretRef 管理プロバイダーの `apiKey` 値は、解決されたシークレットを保持するのではなく、ソース マーカー (環境参照の場合は `ENV_VAR_NAME`、ファイル/実行参照の場合は `secretref-managed`) から更新されます。
  - 空または欠落しているエージェント `apiKey`/`baseUrl` は、構成内の `models.providers` にフォールバックします。
  - マッチングモデル `contextWindow`/`maxTokens` は、明示的な構成値と暗黙的なカタログ値の間の高い値を使用します。
  - 構成で `models.json` を完全に書き換える場合は、`models.mode: "replace"` を使用します。

### プロバイダーフィールドの詳細- `models.mode`: プロバイダー カタログの動作 (`merge` または `replace`)。
- `models.providers`: プロバイダー ID をキーとするカスタム プロバイダー マップ。
- `models.providers.*.api`: アダプターを要求します (`openai-completions`、`openai-responses`、`anthropic-messages`、`google-generative-ai` など)。
- `models.providers.*.apiKey`: プロバイダーの資格情報 (SecretRef/env 置換を推奨)。
- `models.providers.*.auth`: 認証戦略 (`api-key`、`token`、`oauth`、`aws-sdk`)。
- `models.providers.*.injectNumCtxForOpenAICompat`: Ollama + `openai-completions` の場合、`options.num_ctx` をリクエストに挿入します (デフォルト: `true`)。
- `models.providers.*.authHeader`: 必要に応じて、`Authorization` ヘッダーで資格情報のトランスポートを強制します。
- `models.providers.*.baseUrl`: アップストリーム API ベース URL。
- `models.providers.*.headers`: プロキシ/テナント ルーティング用の追加の静的ヘッダー。
- `models.providers.*.models`: 明示的なプロバイダー モデル カタログ エントリ。
- `models.providers.*.models.*.compat.supportsDeveloperRole`: オプションの互換性ヒント。空ではない非ネイティブ `baseUrl` (`api.openai.com` ではないホスト) を持つ `api: "openai-completions"` の場合、OpenClaw は実行時にこれを強制的に `false` に設定します。空または省略された `baseUrl` は、デフォルトの OpenAI 動作を維持します。
- `models.bedrockDiscovery`: Bedrock 自動検出設定のルート。
- `models.bedrockDiscovery.enabled`: 検出ポーリングをオン/オフにします。
- `models.bedrockDiscovery.region`: 検出用の AWS リージョン。
- `models.bedrockDiscovery.providerFilter`: ターゲットを絞った検出のためのオプションのプロバイダー ID フィルター。
- `models.bedrockDiscovery.refreshInterval`: 検出更新のポーリング間隔。- `models.bedrockDiscovery.defaultContextWindow`: 検出されたモデルのフォールバック コンテキスト ウィンドウ。
- `models.bedrockDiscovery.defaultMaxTokens`: 検出されたモデルのフォールバック最大出力トークン。

### プロバイダーの例

<Accordion title="Cerebras (GLM 4.6 / 4.7)">

```json5
{
  env: { CEREBRAS_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: {
        primary: "cerebras/zai-glm-4.7",
        fallbacks: ["cerebras/zai-glm-4.6"],
      },
      models: {
        "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
        "cerebras/zai-glm-4.6": { alias: "GLM 4.6 (Cerebras)" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      cerebras: {
        baseUrl: "https://api.cerebras.ai/v1",
        apiKey: "${CEREBRAS_API_KEY}",
        api: "openai-completions",
        models: [
          { id: "zai-glm-4.7", name: "GLM 4.7 (Cerebras)" },
          { id: "zai-glm-4.6", name: "GLM 4.6 (Cerebras)" },
        ],
      },
    },
  },
}
````

大脳には `cerebras/zai-glm-4.7` を使用します。 Z.AI ダイレクトの `zai/glm-4.7`。

</Accordion>

<Accordion title="OpenCode Zen">

```json5
{
  agents: {
    defaults: {
      model: { primary: "opencode/claude-opus-4-6" },
      models: { "opencode/claude-opus-4-6": { alias: "Opus" } },
    },
  },
}
```

`OPENCODE_API_KEY` (または `OPENCODE_ZEN_API_KEY`) を設定します。ショートカット: `openclaw onboard --auth-choice opencode-zen`。

</Accordion>

<Accordion title="Z.AI（GLM-4.7）">

```json5
{
  agents: {
    defaults: {
      model: { primary: "zai/glm-4.7" },
      models: { "zai/glm-4.7": {} },
    },
  },
}
```

`ZAI_API_KEY` を設定します。 `z.ai/*` および `z-ai/*` は別名として受け入れられます。ショートカット: `openclaw onboard --auth-choice zai-api-key`。

- 一般エンドポイント: `https://api.z.ai/api/paas/v4`
- コーディングエンドポイント (デフォルト): `https://api.z.ai/api/coding/paas/v4`
- 一般的なエンドポイントの場合、ベース URL オーバーライドを使用してカスタム プロバイダーを定義します。

</Accordion>

<Accordion title="ムーンショットAI（キミ）">

```json5
{
  env: { MOONSHOT_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "moonshot/kimi-k2.5" },
      models: { "moonshot/kimi-k2.5": { alias: "Kimi K2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "kimi-k2.5",
            name: "Kimi K2.5",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 256000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

中国エンドポイントの場合: `baseUrl: "https://api.moonshot.cn/v1"` または `openclaw onboard --auth-choice moonshot-api-key-cn`。

</Accordion>

<Accordion title="キミコーディング">

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "kimi-coding/k2p5" },
      models: { "kimi-coding/k2p5": { alias: "Kimi K2.5" } },
    },
  },
}
```

Anthropic 互換の組み込みプロバイダー。ショートカット: `openclaw onboard --auth-choice kimi-code-api-key`。

</Accordion>

<Accordion title="合成 (人為的互換性)">

```json5
{
  env: { SYNTHETIC_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
      models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "hf:MiniMaxAI/MiniMax-M2.5",
            name: "MiniMax M2.5",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 192000,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

ベース URL は `/v1` を省略する必要があります (Anthropic クライアントが追加します)。ショートカット: `openclaw onboard --auth-choice synthetic-api-key`。

</Accordion>

<Accordion title="MiniMax M2.5 (直接)">

```json5
{
  agents: {
    defaults: {
      model: { primary: "minimax/MiniMax-M2.5" },
      models: {
        "minimax/MiniMax-M2.5": { alias: "Minimax" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      minimax: {
        baseUrl: "https://api.minimax.io/anthropic",
        apiKey: "${MINIMAX_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "MiniMax-M2.5",
            name: "MiniMax M2.5",
            reasoning: false,
            input: ["text"],
            cost: { input: 15, output: 60, cacheRead: 2, cacheWrite: 10 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

`MINIMAX_API_KEY` を設定します。ショートカット: `openclaw onboard --auth-choice minimax-api`。

</Accordion>

<Accordion title="ローカルモデル (LM Studio)">[ローカル モデル](/gateway/local-models) を参照してください。 TL;DR: 本格的なハードウェアで LM Studio Response API 経由で MiniMax M2.5 を実行します。フォールバックのためにホストされたモデルをマージしたままにします。

</Accordion>

---

## スキル

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn
    },
    entries: {
      "nano-banana-pro": {
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: バンドルされたスキルのみのオプションの許可リスト (管理/ワークスペース スキルは影響を受けません)。
- `entries.<skillKey>.enabled: false` は、バンドル/インストールされている場合でもスキルを無効にします。
- `entries.<skillKey>.apiKey`: プライマリ環境変数 (プレーンテキスト文字列または SecretRef オブジェクト) を宣言するスキルの利便性。

---

## プラグイン

````json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: [],
    load: {
      paths: ["~/Projects/oss/voice-call-extension"],
    },
    entries: {
      "voice-call": {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
        config: { provider: "twilio" },
      },
    },
  },
}
```- `~/.openclaw/extensions`、`<workspace>/.openclaw/extensions`、および `plugins.load.paths` からロードされます。
- **構成を変更するにはゲートウェイの再起動が必要です。**
- `allow`: オプションの許可リスト (リストされたプラグインのみがロードされます)。 `deny` が勝ちます。
- `plugins.entries.<id>.apiKey`: プラグインレベルの API キー便利フィールド (プラグインでサポートされている場合)。
- `plugins.entries.<id>.env`: プラグインスコープの環境変数マップ。
- `plugins.entries.<id>.hooks.allowPromptInjection`: `false` の場合、コアは `before_prompt_build` をブロックし、レガシー `before_agent_start` からのプロンプト変更フィールドを無視しますが、レガシー `modelOverride` および `providerOverride` は保持します。
- `plugins.entries.<id>.config`: プラグイン定義の設定オブジェクト (プラグイン スキーマによって検証される)。
- `plugins.slots.memory`: アクティブなメモリ プラグイン ID を選択するか、メモリ プラグインを無効にする場合は `"none"` を選択します。
- `plugins.slots.contextEngine`: アクティブなコンテキスト エンジン プラグイン ID を選択します。別のエンジンをインストールして選択しない限り、デフォルトは `"legacy"` になります。
- `plugins.installs`: `openclaw plugins update` によって使用される CLI 管理のインストール メタデータ。
  - `source`、`spec`、`sourcePath`、`installPath`、`version`、`resolvedName`、`resolvedVersion`、 `resolvedSpec`、`integrity`、`shasum`、`resolvedAt`、`installedAt`。
  - `plugins.installs.*` を管理対象状態として扱います。手動編集よりも CLI コマンドを優先します。

[プラグイン](/tools/plugin) を参照してください。

---

## ブラウザ

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "chrome",
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: true, // default trusted-network mode
      // allowPrivateNetwork: true, // legacy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
    color: "#FF4500",
    // headless: false,
    // noSandbox: false,
    // extraArgs: [],
    // relayBindHost: "0.0.0.0", // only when the extension relay must be reachable across namespaces (for example WSL2)
    // executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    // attachOnly: false,
  },
}
```- `evaluateEnabled: false` は、`act:evaluate` および `wait --fn` を無効にします。
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` は、未設定の場合はデフォルトで `true` になります (信頼されたネットワーク モデル)。
- `ssrfPolicy.dangerouslyAllowPrivateNetwork: false` を設定して、厳密なパブリックのみのブラウザ ナビゲーションを実現します。
- `ssrfPolicy.allowPrivateNetwork` はレガシー エイリアスとして引き続きサポートされます。
- 厳密モードでは、明示的な例外に `ssrfPolicy.hostnameAllowlist` および `ssrfPolicy.allowedHostnames` を使用します。
- リモート プロファイルは接続専用です (開始/停止/リセットは無効)。
- 自動検出順序: Chromium ベースの場合はデフォルトのブラウザ → Chrome → Brave → Edge → Chromium → Chrome Canary。
- 制御サービス: ループバックのみ (ポートは `gateway.port` から派生、デフォルトは `18791`)。
- `extraArgs` は、ローカルの Chromium 起動に追加の起動フラグを追加します (たとえば、
  `--disable-gpu`、ウィンドウ サイズ、またはデバッグ フラグ)。
- `relayBindHost` は、Chrome 拡張機能リレーがリッスンする場所を変更します。ループバックのみのアクセスの場合は未設定のままにしておきます。 `0.0.0.0` などの明示的な非ループバック バインド アドレスは、リレーが名前空間の境界 (WSL2 など) を越える必要があり、ホスト ネットワークがすでに信頼されている場合にのみ設定します。

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, short text, image URL, or data URI
    },
  },
}
````

- `seamColor`: ネイティブ アプリ UI クロムのアクセント カラー (トーク モードのバブルの色合いなど)。
- `assistant`: UI ID オーバーライドを制御します。アクティブなエージェント ID にフォールバックします。

---

## ゲートウェイ

```json5
{
  gateway: {
    mode: "local", // local | remote
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token", // none | token | password | trusted-proxy
      token: "your-token",
      // password: "your-password", // or OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // for mode=trusted-proxy; see /gateway/trusted-proxy-auth
      allowTailscale: true,
      rateLimit: {
        maxAttempts: 10,
        windowMs: 60000,
        lockoutMs: 300000,
        exemptLoopback: true,
      },
    },
    tailscale: {
      mode: "off", // off | serve | funnel
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // allowedOrigins: ["https://control.example.com"], // required for non-loopback Control UI
      // dangerouslyAllowHostHeaderOriginFallback: false, // dangerous Host-header origin fallback mode
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    remote: {
      url: "ws://gateway.tailnet:18789",
      transport: "ssh", // ssh | direct
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // Optional. Default false.
    allowRealIpFallback: false,
    tools: {
      // Additional /tools/invoke HTTP denies
      deny: ["browser"],
      // Remove tools from the default HTTP deny list
      allow: ["gateway"],
    },
  },
}
```

<Accordion title="ゲートウェイフィールドの詳細">- `mode`: `local` (ゲートウェイを実行) または `remote` (リモート ゲートウェイに接続)。 `local` を除き、ゲートウェイは起動を拒否します。

- `port`: WS + HTTP 用の単一の多重化ポート。優先順位: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`。
- `bind`: `auto`、`loopback` (デフォルト)、`lan` (`0.0.0.0`)、`tailnet` (Tailscale IP のみ)、または`custom`。
- **レガシー バインド エイリアス**: ホスト エイリアスではなく、`gateway.bind` (`auto`、`loopback`、`lan`、`tailnet`、`custom`) のバインド モード値を使用します。 (`0.0.0.0`、`127.0.0.1`、`localhost`、`::`、`::1`)。
- **Docker 注**: デフォルトの `loopback` バインドは、コンテナー内の `127.0.0.1` をリッスンします。 Docker ブリッジ ネットワーキング (`-p 18789:18789`) では、トラフィックは `eth0` に到着するため、ゲートウェイに到達できません。すべてのインターフェイスでリッスンするには、`--network host` を使用するか、`bind: "lan"` (または `bind: "custom"` と `customBindHost: "0.0.0.0"`) を設定します。
- **認証**: デフォルトで必須。非ループバック バインドには共有トークン/パスワードが必要です。オンボーディング ウィザードはデフォルトでトークンを生成します。- `gateway.auth.token` と `gateway.auth.password` の両方が構成されている場合 (SecretRef を含む)、`gateway.auth.mode` を明示的に `token` または `password` に設定します。起動とサービスのインストール/修復フローの両方が構成され、モードが設定されていない場合、失敗します。
- `gateway.auth.mode: "none"`: 明示的な非認証モード。信頼できるローカル ループバック設定にのみ使用してください。これはオンボーディング プロンプトでは意図的に提供されません。
- `gateway.auth.mode: "trusted-proxy"`: ID 対応リバース プロキシに認証を委任し、`gateway.trustedProxies` からの ID ヘッダーを信頼します ([信頼されたプロキシ認証](/gateway/trusted-proxy-auth) を参照)。
- `gateway.auth.allowTailscale`: `true` の場合、Tailscale Serve ID ヘッダーはコントロール UI/WebSocket 認証を満たすことができます (`tailscale whois` で検証)。 HTTP API エンドポイントでは依然としてトークン/パスワード認証が必要です。このトークンレス フローは、ゲートウェイ ホストが信頼できることを前提としています。 `tailscale.mode = "serve"` の場合、デフォルトは `true` になります。
- `gateway.auth.rateLimit`: オプションの認証失敗リミッター。クライアント IP ごとおよび認証スコープごとに適用されます (共有シークレットとデバイス トークンは個別に追跡されます)。ブロックされた試行は `429` + `Retry-After` を返します。
  - `gateway.auth.rateLimit.exemptLoopback` のデフォルトは `true` です。 localhost のトラフィック レートも意図的に制限したい場合は、`false` を設定します (テスト セットアップまたは厳密なプロキシ展開の場合)。- ブラウザー オリジンの WS 認証試行は、ループバック除外が無効になっている状態で常に抑制されます (ブラウザー ベースのローカルホスト ブルート フォースに対する多層防御)。
- `tailscale.mode`: `serve` (テールネットのみ、ループバック バインド) または `funnel` (パブリック、認証が必要)。
- `controlUi.allowedOrigins`: ゲートウェイ WebSocket 接続用の明示的なブラウザー起点許可リスト。ブラウザクライアントが非ループバックオリジンからのものであることが予期される場合に必要です。
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: ホスト ヘッダー オリジン ポリシーに意図的に依存する展開でホスト ヘッダー オリジン フォールバックを有効にする危険なモード。
- `remote.transport`: `ssh` (デフォルト) または `direct` (ws/wss)。 `direct` の場合、`remote.url` は `ws://` または `wss://` である必要があります。
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: 信頼されたプライベート ネットワーク IP へのプレーンテキスト `ws://` を許可するクライアント側のブレークグラス オーバーライド。デフォルトでは平文の場合はループバックのみになります。
- `gateway.remote.token` / `.password` は、リモート クライアントの資格情報フィールドです。ゲートウェイ認証を独自に構成することはありません。
- `gateway.auth.*` が設定されていない場合、ローカル ゲートウェイの呼び出しパスはフォールバックとして `gateway.remote.*` を使用できます。
- `trustedProxies`: TLS を終了するリバース プロキシ IP。自分が制御するプロキシのみをリストします。
- `allowRealIpFallback`: `true` の場合、`X-Forwarded-For` が欠落している場合、ゲートウェイは `X-Real-IP` を受け入れます。フェールクローズ動作のデフォルト `false`。- `gateway.tools.deny`: HTTP `POST /tools/invoke` に対して追加のツール名がブロックされました (デフォルトの拒否リストを拡張します)。
- `gateway.tools.allow`: デフォルトの HTTP 拒否リストからツール名を削除します。

</Accordion>

### OpenAI 互換エンドポイント

- チャット完了: デフォルトでは無効になっています。 `gateway.http.endpoints.chatCompletions.enabled: true` で有効にします。
- 応答 API: `gateway.http.endpoints.responses.enabled`。
- 応答 URL 入力の強化:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
- オプションの応答強化ヘッダー:
  - `gateway.http.securityHeaders.strictTransportSecurity` (制御する HTTPS オリジンに対してのみ設定します。[信頼されたプロキシ認証](/gateway/trusted-proxy-auth#tls-termination-and-hsts) を参照)

### マルチインスタンスの分離

一意のポートと状態ディレクトリを使用して、1 つのホスト上で複数のゲートウェイを実行します。

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

便利なフラグ: `--dev` (`~/.openclaw-dev` + ポート `19001` を使用)、`--profile <name>` (`~/.openclaw-<name>` を使用)。

[複数のゲートウェイ](/gateway/multiple-gateways) を参照してください。

---

## フック

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    maxBodyBytes: 262144,
    defaultSessionKey: "hook:ingress",
    allowRequestSessionKey: false,
    allowedSessionKeyPrefixes: ["hook:"],
    allowedAgentIds: ["hooks", "main"],
    presets: ["gmail"],
    transformsDir: "~/.openclaw/hooks/transforms",
    mappings: [
      {
        match: { path: "gmail" },
        action: "agent",
        agentId: "hooks",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate: "From: {{messages[0].from}}\nSubject: {{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.2-mini",
      },
    ],
  },
}
```

認証: `Authorization: Bearer <token>` または `x-openclaw-token: <token>`。

**エンドポイント:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - リクエスト ペイロードの `sessionKey` は、`hooks.allowRequestSessionKey=true` (デフォルト: `false`) の場合にのみ受け入れられます。
- `POST /hooks/<name>` → `hooks.mappings` によって解決されました

<Accordion title="マッピングの詳細">- `match.path` は、`/hooks` の後のサブパスと一致します (例: `/hooks/gmail` → `gmail`)。

- `match.source` は、汎用パスのペイロード フィールドと一致します。
- `{{messages[0].subject}}` のようなテンプレートはペイロードから読み取られます。
- `transform` は、フック アクションを返す JS/TS モジュールを指すことができます。
  - `transform.module` は相対パスであり、`hooks.transformsDir` 内に収まる必要があります (絶対パスとトラバースは拒否されます)。
- `agentId` は特定のエージェントにルーティングします。不明な ID はデフォルトに戻ります。
- `allowedAgentIds`: 明示的なルーティングを制限します (`*` または省略 = すべて許可、`[]` = すべて拒否)。
- `defaultSessionKey`: フック エージェントのオプションの固定セッション キーは、明示的な `sessionKey` なしで実行されます。
- `allowRequestSessionKey`: `/hooks/agent` 呼び出し元が `sessionKey` を設定できるようにします (デフォルト: `false`)。
- `allowedSessionKeyPrefixes`: 明示的な `sessionKey` 値 (リクエスト + マッピング) のオプションのプレフィックス許可リスト。 `["hook:"]`。
- `deliver: true` はチャネルに最終応答を送信します。 `channel` のデフォルトは `last` です。
- `model` は、このフック実行の LLM をオーバーライドします (モデル カタログが設定されている場合は許可する必要があります)。

</Accordion>

### Gmail の統合

```json5
{
  hooks: {
    gmail: {
      account: "openclaw@gmail.com",
      topic: "projects/<project-id>/topics/gog-gmail-watch",
      subscription: "gog-gmail-watch-push",
      pushToken: "shared-push-token",
      hookUrl: "http://127.0.0.1:18789/hooks/gmail",
      includeBody: true,
      maxBytes: 20000,
      renewEveryMinutes: 720,
      serve: { bind: "127.0.0.1", port: 8788, path: "/" },
      tailscale: { mode: "funnel", path: "/gmail-pubsub" },
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

- 構成されている場合、ゲートウェイは起動時に `gog gmail watch serve` を自動起動します。 `OPENCLAW_SKIP_GMAIL_WATCHER=1` を無効に設定します。
- ゲートウェイと一緒に別の `gog gmail watch serve` を実行しないでください。

---

## キャンバスホスト

```json5

{
canvasHost: {
root: "~/.openclaw/workspace/canvas",
liveReload: true,
// enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
},
}

````

- エージェントが編集可能な HTML/CSS/JS および A2UI をゲートウェイ ポートで HTTP 経由で提供します。
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- ローカルのみ: `gateway.bind: "loopback"` (デフォルト) を維持します。
- 非ループバック バインド: キャンバス ルートには、他のゲートウェイ HTTP サーフェスと同様に、ゲートウェイ認証 (トークン/パスワード/信頼できるプロキシ) が必要です。
- ノード WebView は通常、認証ヘッダーを送信しません。ノードがペアリングされて接続されると、ゲートウェイはキャンバス/A2UI アクセス用にノード スコープの機能 URL をアドバタイズします。
- 機能 URL はアクティブ ノード WS セッションにバインドされており、すぐに期限切れになります。 IP ベースのフォールバックは使用されません。
- ライブリロードクライアントを提供される HTML に挿入します。
- 空の場合、スターター `index.html` を自動作成します。
- `/__openclaw__/a2ui/` で A2UI も提供します。
- 変更にはゲートウェイの再起動が必要です。
- 大きなディレクトリまたは `EMFILE` エラーのライブ リロードを無効にします。

---

## 発見

### mDNS (ボンジュール)

```json5
{
  discovery: {
    mdns: {
      mode: "minimal", // minimal | full | off
    },
  },
}
````

- `minimal` (デフォルト): TXT レコードから `cliPath` + `sshPort` を省略します。
- `full`: `cliPath` + `sshPort` を含みます。
- ホスト名のデフォルトは `openclaw` です。 `OPENCLAW_MDNS_HOSTNAME` でオーバーライドします。

### 広域 (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

ユニキャスト DNS-SD ゾーンを `~/.openclaw/dns/` に書き込みます。クロスネットワーク検出の場合は、DNS サーバー (CoreDNS 推奨) + Tailscale Split DNS とペアリングします。

セットアップ: `openclaw dns setup --apply`。

---

## 環境

### `env` (インライン環境変数)```json5

{
env: {
OPENROUTER_API_KEY: "sk-or-...",
vars: {
GROQ_API_KEY: "gsk-...",
},
shellEnv: {
enabled: true,
timeoutMs: 15000,
},
},
}

````

- インライン環境変数は、プロセス環境にキーがない場合にのみ適用されます。
- `.env` ファイル: CWD `.env` + `~/.openclaw/.env` (どちらも既存の変数をオーバーライドしません)。
- `shellEnv`: ログイン シェル プロファイルから不足している予期されたキーをインポートします。
- 完全な優先順位については、[環境](/help/environment) を参照してください。

### 環境変数の置換

`${VAR_NAME}` を使用して、構成文字列内の環境変数を参照します。

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
````

- 大文字の名前のみが一致しました: `[A-Z_][A-Z0-9_]*`。
- 変数が欠落しているか空であると、構成ロード時にエラーがスローされます。
- リテラル `${VAR}` の場合は、`${VAR}` でエスケープします。
- `$include` で動作します。

---

## 秘密

Secret ref は追加的です。プレーンテキストの値は引き続き機能します。

### `SecretRef`

1 つのオブジェクト シェイプを使用します。

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

検証:

- `provider` パターン:
- `source: "env"` ID パターン:
- `source: "file"` id: 絶対 JSON ポインター (例: `"/providers/openai/apiKey"`)
- `source: "exec"` ID パターン:

### サポートされている認証情報の表面

- 正準行列: [SecretRef Credential Surface](/reference/secretref-credential-surface)
- `secrets apply` は、サポートされている `openclaw.json` 資格情報パスをターゲットとします。
- `auth-profiles.json` 参照は、実行時解決と監査カバレッジに含まれます。

### シークレットプロバイダーの構成

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // optional explicit env provider
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json",
        timeoutMs: 5000,
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        passEnv: ["PATH", "VAULT_ADDR"],
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
  },
}
```

注:- `file` プロバイダーは、`mode: "json"` および `mode: "singleValue"` をサポートします (`id` は、singleValue モードでは `"value"` である必要があります)。

- `exec` プロバイダーには絶対 `command` パスが必要で、stdin/stdout のプロトコル ペイロードを使用します。
- デフォルトでは、シンボリックリンク コマンド パスは拒否されます。解決されたターゲット パスを検証する際にシンボリックリンク パスを許可するには、`allowSymlinkCommand: true` を設定します。
- `trustedDirs` が構成されている場合、trusted-dir チェックは解決されたターゲット パスに適用されます。
- `exec` 子環境はデフォルトで最小限です。 `passEnv` を使用して、必要な変数を明示的に渡します。
- シークレット参照はアクティブ化時にメモリ内のスナップショットに解決され、リクエスト パスはスナップショットのみを読み取ります。
- アクティブ サーフェスのフィルタリングはアクティブ化中に適用されます。有効なサーフェス上の未解決の参照は起動/リロードに失敗しますが、非アクティブなサーフェスは診断でスキップされます。

---

## 認証ストレージ

````json5
{
  auth: {
    profiles: {
      "anthropic:me@example.com": { provider: "anthropic", mode: "oauth", email: "me@example.com" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
    },
    order: {
      anthropic: ["anthropic:me@example.com", "anthropic:work"],
    },
  },
}
```- エージェントごとのプロファイルは `<agentDir>/auth-profiles.json` に保存されます。
- `auth-profiles.json` は値レベルの参照をサポートします (`api_key` の場合は `keyRef`、`token` の場合は `tokenRef`)。
- 静的ランタイム資格情報は、メモリ内で解決されたスナップショットから取得されます。従来の静的 `auth.json` エントリは、検出されるとスクラブされます。
- レガシー OAuth は `~/.openclaw/credentials/oauth.json` からインポートします。
- [OAuth](/concepts/oauth) を参照してください。
- Secret のランタイム動作と `audit/configure/apply` ツール: [Secrets Management](/gateway/secrets)。

---

## ロギング

```json5
{
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty", // pretty | compact | json
    redactSensitive: "tools", // off | tools
    redactPatterns: ["\\bTOKEN\\b\\s*[=:]\\s*([\"']?)([^\\s\"']+)\\1"],
  },
}
````

- デフォルトのログ ファイル: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`。
- 安定したパスには `logging.file` を設定します。
- `--verbose` の場合、`consoleLevel` は `debug` に変わります。

---

## CLI

```json5
{
  cli: {
    banner: {
      taglineMode: "off", // random | default | off
    },
  },
}
```

- `cli.banner.taglineMode` は、バナーのキャッチフレーズのスタイルを制御します。
  - `"random"` (デフォルト): 面白い/季節のキャッチフレーズをローテーションします。
  - `"default"`: 中立的なタグラインを修正しました (`All your chats, one OpenClaw.`)。
  - `"off"`: タグライン テキストなし (バナー タイトル/バージョンは表示されたままです)。
- バナー全体 (キャッチフレーズだけでなく) を非表示にするには、env `OPENCLAW_HIDE_BANNER=1` を設定します。

---

## ウィザード

CLI ウィザードによって書き込まれたメタデータ (`onboard`、`configure`、`doctor`):

```json5
{
  wizard: {
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
  },
}
```

---

## アイデンティティ

```json5
{
  agents: {
    list: [
      {
        id: "main",
        identity: {
          name: "Samantha",
          theme: "helpful sloth",
          emoji: "🦥",
          avatar: "avatars/samantha.png",
        },
      },
    ],
  },
}
```

macOS オンボーディング アシスタントによって作成されました。デフォルトを導出します:- `identity.emoji` からの `messages.ackReaction` (👀 にフォールバック)

- `mentionPatterns` から `identity.name`/`identity.emoji`
- `avatar` は、ワークスペース相対パス、`http(s)` URL、または `data:` URI を受け入れます。

---

## ブリッジ (レガシー、削除)

現在のビルドには TCP ブリッジが含まれなくなりました。ノードはゲートウェイ WebSocket 経由で接続します。 `bridge.*` キーは構成スキーマの一部ではなくなりました (削除されるまで検証は失敗します。`openclaw doctor --fix` は不明なキーを削除できます)。

<Accordion title="レガシーブリッジ構成 (履歴参照)">

```json
{
  "bridge": {
    "enabled": true,
    "port": 18790,
    "bind": "tailnet",
    "tls": {
      "enabled": true,
      "autoGenerate": true
    }
  }
}
```

</Accordion>

---

## クロン

```json5
{
  cron: {
    enabled: true,
    maxConcurrentRuns: 2,
    webhook: "https://example.invalid/legacy", // deprecated fallback for stored notify:true jobs
    webhookToken: "replace-with-dedicated-token", // optional bearer token for outbound webhook auth
    sessionRetention: "24h", // duration string or false
    runLog: {
      maxBytes: "2mb", // default 2_000_000 bytes
      keepLines: 2000, // default 2000
    },
  },
}
```

- `sessionRetention`: `sessions.json` から削除する前に、完了した分離 cron 実行セッションを保持する期間。アーカイブされた削除された cron トランスクリプトのクリーンアップも制御します。デフォルト: `24h`; `false` を無効に設定します。
- `runLog.maxBytes`: プルーニング前の実行ログ ファイルごとの最大サイズ (`cron/runs/<jobId>.jsonl`)。デフォルト: `2_000_000` バイト。
- `runLog.keepLines`: 実行ログのプルーニングがトリガーされたときに保持される最新の行。デフォルト: `2000`。
- `webhookToken`: cron Webhook POST 配信に使用されるベアラー トークン (`delivery.mode = "webhook"`)。省略された場合、認証ヘッダーは送信されません。
- `webhook`: `notify: true` がまだある保存されたジョブにのみ使用される、非推奨のレガシー フォールバック Webhook URL (http/https)。

[Cron ジョブ](/automation/cron-jobs) を参照してください。

---

## メディア モデル テンプレート変数`tools.media.models[].args` で展開されたテンプレート プレースホルダー:|変数 |説明 |

| ------------------ | -------------------------------------------------- |
| `{{Body}}` |受信メッセージの完全な本文 |
| `{{RawBody}}` |生の本体 (履歴/送信者ラッパーなし) |
| `{{BodyStripped}}` |グループへの言及が削除された本文 |
| `{{From}}` |送信者識別子 |
| `{{To}}` |宛先識別子 |
| `{{MessageSid}}` |チャンネルメッセージID |
| `{{SessionId}}` |現在のセッションの UUID |
| `{{IsNewSession}}` | `"true"` 新しいセッションが作成されたとき |
| `{{MediaUrl}}` |受信メディアの疑似 URL |
| `{{MediaPath}}` |ローカルメディアパス |
| `{{MediaType}}` |メディアタイプ (画像/音声/ドキュメント/…) |
| `{{Transcript}}` |音声トランスクリプト |
| `{{Prompt}}` | CLI エントリのメディア プロンプトが解決されました |
| `{{MaxChars}}` | CLI エントリの解決された最大出力文字数 |
| `{{ChatType}}` | `"direct"` または `"group"` |
| `{{GroupSubject}}` |グループ主題 (ベストエフォート) || `{{GroupMembers}}` |グループメンバーのプレビュー (ベストエフォート) |
| `{{SenderName}}` |送信者の表示名 (ベストエフォート) |
| `{{SenderE164}}` |送信者の電話番号 (ベストエフォート) |
| `{{Provider}}` |プロバイダーのヒント (whatsapp、電報、discord など) |

---

## 構成には (`$include`) が含まれます

構成を複数のファイルに分割します。

```json5
// ~/.openclaw/openclaw.json
{
  gateway: { port: 18789 },
  agents: { $include: "./agents.json5" },
  broadcast: {
    $include: ["./clients/mueller.json5", "./clients/schmidt.json5"],
  },
}
```

**マージ動作:**

- 単一ファイル: 含まれているオブジェクトを置き換えます。
- ファイルの配列: 順番にディープマージされます (後で上書きされます)。
- 兄弟キー: インクルード後にマージされます (インクルードされた値をオーバーライドします)。
- ネストされた内容: 最大 10 レベルの深さ。
- パス: インクルード ファイルを基準にして解決されますが、最上位の構成ディレクトリ (`openclaw.json` の `dirname`) 内に存在する必要があります。絶対/`../` 形式は、その境界内で解決される場合にのみ許可されます。
- エラー: 欠落しているファイル、解析エラー、循環インクルードに関するメッセージをクリアします。

---

_関連: [構成](/gateway/configuration) · [構成例](/gateway/configuration-examples) · [ドクター](/gateway/doctor)_
