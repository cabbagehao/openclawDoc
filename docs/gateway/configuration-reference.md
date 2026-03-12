---
title: "OpenClaw設定リファレンス: openclaw.json 全項目と既定値一覧"
description: "チャネル、エージェント、セッション、ツール、サンドボックスなど、openclaw.json の各フィールドと既定値を項目別に参照できます。"
summary: "OpenClaw のすべての構成キー、デフォルト、およびチャネル設定の完全なリファレンス"
read_when:
  - フィールドレベルの正確な構成セマンティクスやデフォルトを確認したい場合
  - チャネル、モデル、ゲートウェイ、またはツールの構成ブロックを検証する場合
---
`~/.openclaw/openclaw.json` で使用可能なすべてのフィールドについて説明します。タスク指向の概要については、[構成](/gateway/configuration) を参照してください。

構成形式は **JSON5** です（コメントや末尾のカンマが許可されます）。すべてのフィールドはオプションです。省略された場合、OpenClaw は安全なデフォルト値を使用します。

---

## チャネル

各チャネルは、その構成セクションが存在すると自動的に開始されます（`enabled: false` を指定した場合を除く）。

### DM とグループへのアクセス

すべてのチャネルは DM ポリシーとグループポリシーをサポートしています。

| DM ポリシー | 動作 |
| :--- | :--- |
| `pairing` (デフォルト) | 未知の送信者にはワンタイムペアリングコードが送信されます。所有者が承認する必要があります。 |
| `allowlist` | `allowFrom`（またはペアリング済みの許可ストア）に含まれる送信者のみを許可します。 |
| `open` | すべての受信 DM を許可します（`allowFrom: ["*"]` が必要）。 |
| `disabled` | すべての受信 DM を無視します。 |

| グループポリシー | 動作 |
| :--- | :--- |
| `allowlist` (デフォルト) | 構成された許可リストに一致するグループのみを許可します。 |
| `open` | グループの許可リストをバイパスします（メンションによる制限は引き続き適用されます）。 |
| `disabled` | すべてのグループ/ルームメッセージをブロックします。 |

<Note>
`channels.defaults.groupPolicy` は、プロバイダーの `groupPolicy` が設定されていない場合のデフォルト値を設定します。
ペアリングコードは 1 時間で期限切れになります。保留中の DM ペアリングリクエストは、**1 チャネルあたり 3 つ** までに制限されます。
プロバイダーのブロックが完全に欠落している（`channels.<provider>` が存在しない）場合、実行時のグループポリシーは起動時の警告とともに `allowlist`（フェールクローズ）にフォールバックします。
</Note>

### チャネルごとのモデルオーバーライド

`channels.modelByChannel` を使用して、特定のチャネル ID を特定のモデルに固定します。値には `provider/model` または構成済みのモデルエイリアスを指定できます。このチャネルマッピングは、セッションにモデルオーバーライド（例：`/model` で設定されたもの）がまだ存在しない場合に適用されます。

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

`channels.defaults` を使用して、プロバイダー間で共通のグループポリシーやハートビートの動作を設定します。

```json5
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
```

- `channels.defaults.groupPolicy`: プロバイダーレベルの `groupPolicy` が未設定の場合のフォールバックポリシー。
- `channels.defaults.heartbeat.showOk`: ハートビート出力に正常なチャネルのステータスを含めます。
- `channels.defaults.heartbeat.showAlerts`: ハートビート出力に劣化/エラーステータスを含めます。
- `channels.defaults.heartbeat.useIndicator`: コンパクトなインジケーター形式でハートビート出力を表示します。

### WhatsApp

WhatsApp はゲートウェイの Web チャネル（Baileys Web）経由で実行されます。リンクされたセッションが存在する場合、自動的に開始されます。

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      chunkMode: "length", // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // 既読（青いチェックマーク）。セルフチャットモードでは false。
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
```

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

- アウトバウンドコマンドは、`default` アカウントが存在すればそれをデフォルトとして使用し、存在しなければ最初に構成されたアカウント ID（ソート順）を使用します。
- オプションの `channels.whatsapp.defaultAccount` を使用すると、構成済みの ID と一致する場合に、上記のフォールバック動作をオーバーライドできます。
- 従来のシングルアカウント形式の Baileys 認証ディレクトリは、`openclaw doctor` によって `whatsapp/default` に移行されます。
- アカウントごとのオーバーライド: `channels.whatsapp.accounts.<id>.sendReadReceipts`, `channels.whatsapp.accounts.<id>.dmPolicy`, `channels.whatsapp.accounts.<id>.allowFrom`。

</Accordion>

### Telegram

```json5
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
          systemPrompt: "回答は簡潔にしてください。",
          topics: {
            "99": {
              requireMention: false,
              skills: ["search"],
              systemPrompt: "トピックから逸れないでください。",
            },
          },
        },
      },
      customCommands: [
        { command: "backup", description: "Git バックアップ" },
        { command: "generate", description: "画像を生成" },
      ],
      historyLimit: 50,
      replyToMode: "first", // off | first | all
      linkPreview: true,
      streaming: "partial", // off | partial | block | progress (デフォルトは off)
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
```

- ボットトークン: `channels.telegram.botToken` または `channels.telegram.tokenFile`。デフォルトアカウントのフォールバックとして `TELEGRAM_BOT_TOKEN` 環境変数が使用されます。
- オプションの `channels.telegram.defaultAccount` は、構成済みの ID と一致する場合にデフォルトのアカウント選択をオーバーライドします。
- マルチアカウント設定（2 つ以上のアカウント ID）では、フォールバックルーティングを避けるために、明示的なデフォルト（`channels.telegram.defaultAccount` または `channels.telegram.accounts.default`）を設定してください。設定が欠落していたり無効な場合、`openclaw doctor` が警告を表示します。
- `configWrites: false` は、Telegram 主導の構成書き込み（スーパーグループ ID の移行や `/config set|unset`）をブロックします。
- `type: "acp"` を持つトップレベルの `bindings[]` エントリは、フォーラムトピック用の永続的な ACP バインディングを構成します（`match.peer.id` に正規の `chatId:topic:topicId` を使用）。フィールドのセマンティクスは [ACP エージェント](/tools/acp-agents#channel-specific-settings) と共通です。
- Telegram のストリームプレビューは `sendMessage` + `editMessageText` を使用します（ダイレクトチャットおよびグループチャットで機能します）。
- 再試行ポリシーについては、[再試行ポリシー](/concepts/retry) を参照してください。

### Discord

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
              systemPrompt: "回答は簡潔にしてください。",
            },
          },
        },
      },
      historyLimit: 20,
      textChunkLimit: 2000,
      chunkMode: "length", // length | newline
      streaming: "off", // off | partial | block | progress (Discord では progress は partial にマップされます)
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
        spawnSubagentSessions: false, // sessions_spawn({ thread: true }) による自動スレッド作成を有効にする
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
```

- トークン: `channels.discord.token`。デフォルトアカウントのフォールバックとして `DISCORD_BOT_TOKEN` 環境変数が使用されます。
- オプションの `channels.discord.defaultAccount` は、構成済みの ID と一致する場合にデフォルトのアカウント選択をオーバーライドします。
- 配信ターゲットには `user:<id>` (DM) または `channel:<id>` (サーバーチャネル) を使用してください。数値のみの ID は拒否されます。
- ギルドスラッグ（Slug）は小文字で、スペースは `-` に置き換えられます。チャネルキーはスラッグ名を使用します（`#` は不要）。ギルド ID の使用を推奨します。
- ボットが作成したメッセージはデフォルトで無視されます。`allowBots: true` で有効化できます。`allowBots: "mentions"` を使用すると、ボットに言及しているボットメッセージのみを受け入れます（自分自身のメッセージは引き続き除外されます）。
- `channels.discord.guilds.<id>.ignoreOtherMentions`（およびチャネルごとのオーバーライド）は、ボット以外（@everyone/@here を除く）のユーザーやロールに言及しているメッセージを無視します。
- `maxLinesPerMessage`（デフォルト 17）は、2000 文字未満であっても、行数の多いメッセージを分割します。
- `channels.discord.threadBindings` は Discord のスレッドバインドルーティングを制御します。
  - `enabled`: スレッドバインドセッション機能（`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, バインドされた配信/ルーティング）の Discord 用オーバーライド。
  - `idleHours`: 非アクティブによる自動フォーカス解除までの時間（時間単位）の Discord 用オーバーライド（`0` で無効）。
  - `maxAgeHours`: セッションの最大存続時間（時間単位）の Discord 用オーバーライド（`0` で無効）。
  - `spawnSubagentSessions`: `sessions_spawn({ thread: true })` による自動スレッド作成/バインドを有効にするスイッチ。
- `type: "acp"` を持つトップレベルの `bindings[]` エントリは、チャネルとスレッド用の永続的な ACP バインディングを構成します（`match.peer.id` にチャネル/スレッド ID を使用）。フィールドのセマンティクスは [ACP エージェント](/tools/acp-agents#channel-specific-settings) と共通です。
- `channels.discord.ui.components.accentColor` は、Discord コンポーネント v2 コンテナのアクセントカラーを設定します。
- `channels.discord.voice` は、Discord ボイスチャネルでの会話、オプションの自動参加、および TTS オーバーライドを有効にします。
- `channels.discord.voice.daveEncryption` および `channels.discord.voice.decryptionFailureTolerance` は、`@discordjs/voice` の DAVE オプションに渡されます（デフォルトはそれぞれ `true` と `24`）。
- OpenClaw は、復号エラーが繰り返された場合にボイスセッションを一度退出して再参加することで、音声受信の回復を試みます。
- `channels.discord.streaming` は標準のストリームモードキーです。従来の `streamMode` やブール値の `streaming` は自動的に移行されます。
- `channels.discord.autoPresence` は、実行時の可用性をボットのプレゼンス状態にマップします（正常 => オンライン、劣化 => アイドル、枯渇 => 取り込み中）。オプションでステータステキストのオーバーライドも可能です。
- `channels.dangerouslyAllowNameMatching` は、名前やタグによる一致を再度有効にします（互換性のための非推奨モード）。

**反応通知モード:** `off`（なし）、`own`（ボット自身のメッセージ、デフォルト）、`all`（すべてのメッセージ）、`allowlist`（すべてのメッセージのうち `guilds.<id>.users` に含まれるユーザーによるもの）。

### Google Chat

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
```

- サービスアカウント JSON: インライン（`serviceAccount`）またはファイルベース（`serviceAccountFile`）。
- サービスアカウントの SecretRef もサポートされています（`serviceAccountRef`）。
- 環境変数のフォールバック: `GOOGLE_CHAT_SERVICE_ACCOUNT` または `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`。
- 配信ターゲットには `spaces/<spaceId>` または `users/<userId>` を使用してください。
- `channels.googlechat.dangerouslyAllowNameMatching` は、変更可能なメールアドレスによる一致を再度有効にします（互換性のための非推奨モード）。

### Slack

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
          systemPrompt: "回答は簡潔にしてください。",
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
      streaming: "partial", // off | partial | block | progress (プレビューモード)
      nativeStreaming: true, // streaming=partial の場合に Slack ネイティブのストリーミング API を使用する
      mediaMaxMb: 20,
    },
  },
}
```

- **ソケットモード（Socket mode）**: `botToken` と `appToken` の両方が必要です（デフォルトアカウントのフォールバックとして `SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN`）。
- **HTTP モード**: `botToken` と `signingSecret`（ルートまたはアカウントごと）が必要です。
- `configWrites: false` は、Slack 主導の構成書き込みをブロックします。
- オプションの `channels.slack.defaultAccount` は、構成済みの ID と一致する場合にデフォルトのアカウント選択をオーバーライドします。
- `channels.slack.streaming` は標準のストリームモードキーです。従来の `streamMode` やブール値の `streaming` は自動的に移行されます。
- 配信ターゲットには `user:<id>` (DM) または `channel:<id>` を使用してください。

**反応通知モード:** `off`, `own`（デフォルト）, `all`, `allowlist`（`reactionAllowlist` に基づく）。

**スレッドセッションの分離:** `thread.historyScope` は、スレッドごと（デフォルト）かチャネル全体で共有するかを選択します。`thread.inheritParent` を true にすると、親チャネルのログが新しいスレッドにコピーされます。

- `typingReaction`: 返信の実行中に、受信した Slack メッセージに一時的なリアクションを追加し、完了時に削除します。`"hourglass_flowing_sand"` などの Slack 絵文字ショートコードを使用します。

| アクショングループ | デフォルト | 備考 |
| :--- | :--- | :--- |
| `reactions` | 有効 | リアクションの追加と一覧取得 |
| `messages` | 有効 | 読み取り/送信/編集/削除 |
| `pins` | 有効 | ピン留め/解除/一覧取得 |
| `memberInfo` | 有効 | メンバー情報 |
| `emojiList` | 有効 | カスタム絵文字リスト |

### Mattermost

Mattermost はプラグインとして提供されます: `openclaw plugins install @openclaw/mattermost`。

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
        native: true, // オプトイン
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // リバースプロキシや公開デプロイ用のオプションの明示的な URL
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

チャットモード: `oncall`（@メンションで応答、デフォルト）、`onmessage`（すべてのメッセージに応答）、`onchar`（特定のプレフィックスで始まるメッセージに応答）。

Mattermost ネイティブコマンドが有効な場合:

- `commands.callbackPath` は、完全な URL ではなく `/api/channels/mattermost/command` のようなパスである必要があります。
- `commands.callbackUrl` は OpenClaw ゲートウェイのエンドポイントに解決され、Mattermost サーバーからアクセス可能である必要があります。
- プライベートネットワークや Tailscale 内のコールバックホストの場合、Mattermost の `ServiceSettings.AllowedUntrustedInternalConnections` にコールバックホスト/ドメインを含める必要がある場合があります。完全な URL ではなく、ホスト/ドメインの値のみを使用してください。
- `channels.mattermost.configWrites`: Mattermost 主導の構成書き込みを許可または拒否します。
- `channels.mattermost.requireMention`: チャネルで返信する前に `@mention` を必須にします。
- オプションの `channels.mattermost.defaultAccount` は、構成済みの ID と一致する場合にデフォルトのアカウント選択をオーバーライドします。

### Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // オプションのアカウントバインディング
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

**リアクション通知モード:** `off`, `own` (デフォルト), `all`, `allowlist` (`reactionAllowlist` に基づく)。

- `channels.signal.account`: チャネルの開始を特定の Signal アカウント ID に固定します。
- `channels.signal.configWrites`: Signal 主導の構成書き込みを許可または拒否します。
- オプションの `channels.signal.defaultAccount` は、構成済みの ID と一致する場合にデフォルトのアカウント選択をオーバーライドします。

### BlueBubbles

BlueBubbles は、推奨される iMessage の利用方法です（プラグインを利用し、`channels.bluebubbles` で構成されます）。

```json5
{
  channels: {
    bluebubbles: {
      enabled: true,
      dmPolicy: "pairing",
      // serverUrl, password, webhookPath, グループ制御、高度なアクションなど
      // 詳細は /channels/bluebubbles を参照
    },
  },
}
```

- ここで扱う主要なキー: `channels.bluebubbles`, `channels.bluebubbles.dmPolicy`。
- オプションの `channels.bluebubbles.defaultAccount` は、構成済みの ID と一致する場合にデフォルトのアカウント選択をオーバーライドします。
- BlueBubbles チャネルの完全な構成については、[BlueBubbles](/channels/bluebubbles) を参照してください。

### iMessage

OpenClaw は `imsg rpc` (stdio 経由の JSON-RPC) を起動します。デーモンやポートは不要です。

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
```

- オプションの `channels.imessage.defaultAccount` は、構成済みの ID と一致する場合にデフォルトのアカウント選択をオーバーライドします。
- メッセージ DB への「フルディスクアクセス」権限が必要です。
- ターゲットには `chat_id:<id>` を推奨します。チャット一覧を取得するには `imsg chats --limit 20` を実行してください。
- `cliPath` には SSH ラッパーを指定できます。添付ファイルを SCP で取得するには `remoteHost` (`host` または `user@host`) を設定してください。
- `attachmentRoots` と `remoteAttachmentRoots` は、受信した添付ファイルのパスを制限します（デフォルト: `/Users/*/Library/Messages/Attachments`）。
- SCP は厳密なホストキーチェックを行うため、リレーホストのキーが `~/.ssh/known_hosts` に存在することを確認してください。
- `channels.imessage.configWrites`: iMessage 主導の構成書き込みを許可または拒否します。

<Accordion title="iMessage SSH ラッパーの例">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Microsoft Teams

Microsoft Teams はプラグイン経由で動作し、`channels.msteams` で構成されます。

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, チーム/チャネルポリシーなど
      // 詳細は /channels/msteams を参照
    },
  },
}
```

- ここで扱う主要なキー: `channels.msteams`, `channels.msteams.configWrites`。
- 完全な Teams 構成（認証情報、Webhook、DM/グループポリシー、チーム/チャネルごとのオーバーライド）については、[Microsoft Teams](/channels/msteams) を参照してください。

### IRC

IRC はプラグイン経由で動作し、`channels.irc` で構成されます。

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

- ここで扱う主要なキー: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`。
- オプションの `channels.irc.defaultAccount` は、構成済みの ID と一致する場合にデフォルトのアカウント選択をオーバーライドします。
- IRC チャネルの完全な構成（ホスト/ポート/TLS/チャネル/許可リスト/メンション制限）については、[IRC](/channels/irc) を参照してください。

### マルチアカウント (すべてのチャネル共通)

各チャネルで、独自の一意な `accountId` を持つ複数のアカウントを実行できます。

```json5
{
  channels: {
    telegram: {
      accounts: {
        default: {
          name: "メインボット",
          botToken: "123456:ABC...",
        },
        alerts: {
          name: "アラートボット",
          botToken: "987654:XYZ...",
        },
      },
    },
  },
}
```

- `accountId` が省略された場合、`default` アカウントが使用されます（CLI およびルーティング）。
- 環境変数によるトークン指定は、**デフォルト**アカウントにのみ適用されます。
- 基本的なチャネル設定は、アカウントごとにオーバーライドされない限り、すべてのアカウントに適用されます。
- `bindings[].match.accountId` を使用して、各アカウントを異なるエージェントにルーティングできます。
- シングルアカウント形式の構成から、`openclaw channels add` 等で別のアカウントを追加した場合、OpenClaw は既存のアカウントが動作し続けるよう、トップレベルの設定値を自動的に `channels.<channel>.accounts.default` に移動します。
- 既存のチャネルのみを指定したバインディング（`accountId` なし）は、引き続きデフォルトアカウントと一致します。
- `openclaw doctor --fix` は、名前付きアカウントが存在するのに `default` が欠落している場合などの混在した構成を修復します。

### その他の拡張チャネル

多くの拡張チャネルは `channels.<id>` として構成され、各専用ページ（Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat, Twitch など）にドキュメントがあります。
詳細はチャネルインデックス [チャネル](/channels) を参照してください。

### グループチャットのメンション制限

グループメッセージはデフォルトで **メンションを必須** とします（メタデータのメンションまたは正規表現パターン）。これは WhatsApp, Telegram, Discord, Google Chat, iMessage のグループチャットに適用されます。

**メンションの種類:**

- **メタデータのメンション**: プラットフォーム固有の @メンション。WhatsApp のセルフチャットモードでは無視されます。
- **テキストパターン**: `agents.list[].groupChat.mentionPatterns` で定義された正規表現パターン。常にチェックされます。
- メンション制限は、検出が可能な場合（ネイティブメンションまたは少なくとも 1 つのテキストパターンが存在する場合）にのみ適用されます。

```json5
{
  messages: {
    groupChat: { historyLimit: 50 },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` はグローバルなデフォルトを設定します。チャネルごとに `channels.<channel>.historyLimit`（またはアカウントごと）でオーバーライド可能です。`0` に設定すると履歴は保持されません。

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

解決順序: DM ごとのオーバーライド → プロバイダーのデフォルト → 制限なし（すべて保持）。

サポート対象: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`。

#### セルフチャットモード

`allowFrom` に自身の番号を含めることで、セルフチャットモードを有効にできます（ネイティブの @メンションを無視し、テキストパターンにのみ応答します）。

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

### コマンド (チャット内のコマンド処理)

```json5
{
  commands: {
    native: "auto", // サポートされている場合にネイティブコマンドを登録
    text: true, // チャットメッセージ内の /commands を解析
    bash: false, // ! によるコマンド実行を許可 (別名: /bash)
    bashForegroundMs: 2000,
    config: false, // /config を許可
    debug: false, // /debug を許可
    restart: false, // /restart およびゲートウェイ再起動ツールを許可
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

<Accordion title="コマンドの詳細">

- テキストコマンドは、先頭に `/` が付いた **単独の** メッセージである必要があります。
- `native: "auto"` は Discord/Telegram では有効、Slack では無効のままにします。
- チャネルごとのオーバーライド: `channels.discord.commands.native` (ブール値または `"auto"`)。`false` は登録済みのコマンドをクリアします。
- `channels.telegram.customCommands` は Telegram のボットメニュー項目を追加します。
- `bash: true` は、ホストシェルの `! <cmd>` を有効にします。`tools.elevated.enabled` と、チャネルごとの `tools.elevated.allowFrom.<channel>` による許可が必要です。
- `config: true` は `/config`（`openclaw.json` の読み書き）を有効にします。ゲートウェイの `chat.send` クライアントにおいて、永続的な `/config set|unset` を行うには `operator.admin` 権限も必要です。読み取り専用の `/config show` は、通常の書き込み権限を持つオペレータークライアントでも利用可能です。
- `channels.<provider>.configWrites` は、チャネル経由での構成変更をゲート（制限）します（デフォルト: true）。
- `allowFrom` はプロバイダーごとに設定可能です。これが設定されている場合、それが **唯一の** 認証ソースとなります（チャネルの許可リスト/ペアリングや `useAccessGroups` は無視されます）。
</Accordion>

---

## エージェントのデフォルト設定

### `agents.defaults.workspace`

デフォルト: `~/.openclaw/workspace`。

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

システムプロンプトの Runtime 行に表示されるオプションのリポジトリルート。未設定の場合、OpenClaw はワークスペースから上位ディレクトリに向かって自動検出します。

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skipBootstrap`

ワークスペースのブートストラップファイル（`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`）の自動作成を無効にします。

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.bootstrapMaxChars`

ワークスペースの各ブートストラップファイルが切り詰められる前の最大文字数。デフォルト: `20000`。

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

すべてのワークスペースブートストラップファイルから注入される合計最大文字数。デフォルト: `150000`。

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 150000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

ブートストラップコンテキストが切り詰められた際に、エージェントに表示される警告テキストを制御します。
デフォルト: `"once"`。

- `"off"`: システムプロンプトに警告テキストを注入しません。
- `"once"`: 切り捨てのパターン（署名）ごとに 1 回だけ警告を注入します（推奨）。
- `"always"`: 切り捨てが存在する場合、実行ごとに警告を注入します。

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### `agents.defaults.imageMaxDimensionPx`

プロバイダー呼び出し前の、ログやツール画像ブロック内の画像の長辺の最大ピクセルサイズ。
デフォルト: `1200`。

低い値を設定するとビジョントークンの消費を抑えられ、スクリーンショットを多用する実行時のペイロードサイズを削減できます。
高い値を設定すると、より多くの視覚的詳細が保持されます。

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

システムプロンプトのコンテキストに使用されるタイムゾーン（メッセージのタイムスタンプではありません）。未設定の場合はホストのタイムゾーンが使用されます。

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

システムプロンプト内の時刻形式。デフォルト: `auto` (OS の設定に従う)。

```json5
{
  agents: { defaults: { timeFormat: "auto" } }, // auto | 12 | 24
}
```

### `agents.defaults.model`

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
```

- `model`: 文字列 (`"provider/model"`) またはオブジェクト (`{ primary, fallbacks }`) を指定します。
  - 文字列形式はメインモデルのみを設定します。
  - オブジェクト形式は、メインモデルと順序付けられたフェイルオーバー用モデルを設定します。
- `imageModel`: 文字列 (`"provider/model"`) またはオブジェクト (`{ primary, fallbacks }`) を指定します。
  - `image` ツールのビジョンモデル構成として使用されます。
  - また、選択されたモデルが画像入力を受け付けない場合のフォールバックルーティングとしても使用されます。
- `pdfModel`: 文字列 (`"provider/model"`) またはオブジェクト (`{ primary, fallbacks }`) を指定します。
  - `pdf` ツールのモデルルーティングに使用されます。
  - 省略された場合、PDF ツールは `imageModel` にフォールバックし、さらにプロバイダーのデフォルトへとフォールバックします。
- `pdfMaxBytesMb`: 呼び出し時に `maxBytesMb` が渡されない場合の、`pdf` ツールのデフォルト PDF サイズ制限。
- `pdfMaxPages`: `pdf` ツールのテキスト抽出フォールバックモードで処理されるデフォルトの最大ページ数。
- `model.primary`: `provider/model` 形式（例: `anthropic/claude-opus-4-6`）。プロバイダーを省略した場合、OpenClaw は `anthropic` (非推奨) とみなします。
- `models`: `/model` コマンドで利用可能なモデルカタログと許可リスト。各エントリには `alias`（ショートカット）や `params`（`temperature`, `maxTokens`, `cacheRetention` などのプロバイダー固有パラメータ）を含めることができます。
- `params` のマージ優先順位: `agents.defaults.models["provider/model"].params` がベースとなり、`agents.list[].params` (エージェント ID が一致する場合) でキーごとに上書きされます。
- これらのフィールドを変更するコマンド（`/models set`, `/models set-image` など）は、可能な限り正規のオブジェクト形式を維持し、既存のフォールバックリストを保持します。
- `maxConcurrent`: セッションをまたいで並列実行できるエージェントの最大数（各セッション内は依然として直列実行されます）。デフォルト: 1。

**組み込みのエイリアス（短縮名）** (`agents.defaults.models` に含まれる場合に適用):

| エイリアス | モデル名 |
| :--- | :--- |
| `opus` | `anthropic/claude-opus-4-6` |
| `sonnet` | `anthropic/claude-sonnet-4-6` |
| `gpt` | `openai/gpt-5.4` |
| `gpt-mini` | `openai/gpt-5-mini` |
| `gemini` | `google/gemini-3.1-pro-preview` |
| `gemini-flash` | `google/gemini-3-flash-preview` |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview` |

ユーザーが構成したエイリアスは常にデフォルトより優先されます。

Z.AI GLM-4.x モデルは、`--thinking off` を設定するか、`agents.defaults.models["zai/<model>"].params.thinking` を明示的に定義しない限り、思考モードが自動的に有効になります。
Z.AI モデルはデフォルトでツール呼び出しのストリーミング (`tool_stream`) が有効です。無効にするには `false` を設定してください。
Anthropic Claude 4.6 モデルは、明示的な思考レベルが設定されていない場合、デフォルトで `adaptive` 思考になります。

### `agents.defaults.cliBackends`

テキストのみのフォールバック実行（ツール呼び出しなし）用のオプションの CLI バックエンド。API プロバイダーがダウンした場合のバックアップとして有用です。

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
```

- CLI バックエンドはテキスト専用であり、ツールは常に無効になります。
- `sessionArg` が設定されている場合、セッションがサポートされます。
- `imageArg` がファイルパスを受け付ける場合、画像のパススルーがサポートされます。

### `agents.defaults.heartbeat`

定期的な心跳（ハートビート）の実行設定。

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m で無効
        model: "openai/gpt-5.2-mini",
        includeReasoning: false,
        lightContext: false, // true の場合、ワークスペースのブートストラップファイルから HEARTBEAT.md のみを使用
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (デフォルト) | block
        target: "none", // デフォルト: none | オプション: last | whatsapp | telegram | discord など
        prompt: "HEARTBEAT.md が存在すれば読み込んでください...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
      },
    },
  },
}
```

- `every`: 間隔を表す文字列 (ms/s/m/h)。デフォルト: `30m`。
- `suppressToolErrorWarnings`: true の場合、ハートビート実行中のツールエラー警告を抑制します。
- `directPolicy`: 直接送信/DM のポリシー。`allow` (デフォルト) は直接ターゲットへの配信を許可します。`block` は配信を抑制し、`reason=dm-blocked` を発行します。
- `lightContext`: true の場合、軽量なブートストラップコンテキストを使用し、ワークスペースファイルから `HEARTBEAT.md` のみを保持します。
- エージェントごとの設定: `agents.list[].heartbeat` を設定します。いずれかのエージェントで `heartbeat` が定義されている場合、**そのエージェントのみ**がハートビートを実行します。
- ハートビートはエージェントのフルターンを実行するため、間隔が短いほどトークンを多く消費します。

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        reserveTokensFloor: 24000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "デプロイ ID、チケット ID、ホスト:ポートのペアを正確に保持してください。", // identifierPolicy=custom の場合に使用
        postCompactionSections: ["Session Startup", "Red Lines"], // [] で再注入を無効化
        model: "openrouter/anthropic/claude-sonnet-4-5", // 圧縮要約専用のオプションのモデルオーバーライド
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "セッションがコンパクションに近づいています。重要な記憶を保存してください。",
          prompt: "永続的なメモを memory/YYYY-MM-DD.md に書き込んでください。保存するものがない場合は NO_REPLY と返してください。",
        },
      },
    },
  },
}
```

- `mode`: `default` または `safeguard` (長い履歴向けのチャンク化された要約)。詳細は [コンパクション（圧縮）](/concepts/compaction) を参照してください。
- `identifierPolicy`: `strict` (デフォルト), `off`, または `custom`。`strict` は要約中に識別子を保持するためのガイドラインを付加します。
- `identifierInstructions`: `identifierPolicy=custom` の場合に使用されるカスタムテキスト。
- `postCompactionSections`: 圧縮後に再注入する `AGENTS.md` 内の H2/H3 セクション名のリスト。デフォルトは `["Session Startup", "Red Lines"]` です。空の配列 `[]` を指定すると再注入が無効になります。未設定またはデフォルト値の場合、古い `Every Session`/`Safety` 見出しも互換性のために受け入れられます。
- `model`: 圧縮要約のみに使用するオプションのモデル。メインセッションとは別のモデルで要約を行いたい場合に使用します。未設定の場合はセッションのメインモデルが使用されます。
- `memoryFlush`: 自動コンパクションの前に、エージェントが記憶を保存するためのサイレントなターンを実行します。ワークスペースが読み取り専用の場合はスキップされます。

### `agents.defaults.contextPruning`

LLM へ送信する前に、メモリ内のコンテキストから **古いツールの実行結果** を削除します。ディスク上のセッション履歴は **変更されません**。

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // 期間 (ms/s/m/h)、デフォルト単位は分
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[古いツールの結果が消去されました]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="cache-ttl モードの動作">

- `mode: "cache-ttl"` はプルーニング（削減）パスを有効にします。
- `ttl` は、プルーニングを再実行するまでの頻度（最後にキャッシュに触れてからの経過時間）を制御します。
- プルーニングは、まずサイズ超過したツールの結果を「ソフトトリム」し、必要に応じて古いツールの結果を「ハードクリア」します。

**ソフトトリム (Soft-trim)** は、最初と最後を保持し、中間を `...` で置き換えます。

**ハードクリア (Hard-clear)** は、ツールの結果全体をプレースホルダーテキストに置き換えます。

注意点:
- 画像ブロックはトリミングや消去の対象になりません。
- 比率はトークン数ではなく、文字数に基づいた概算値です。
- アシスタントのメッセージ数が `keepLastAssistants` 未満の場合、プルーニングはスキップされます。

</Accordion>

動作の詳細は [セッションプルーニング](/concepts/session-pruning) を参照してください。

### ブロックストリーミング (Block streaming)

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (minMs/maxMs を使用)
    },
  },
}
```

- Telegram 以外のチャネルでブロック返信を有効にするには、明示的に `*.blockStreaming: true` を設定する必要があります。
- チャネルごとのオーバーライド: `channels.<channel>.blockStreamingCoalesce`（およびアカウントごとのバリアント）。Signal/Slack/Discord/Google Chat のデフォルトは `minChars: 1500` です。
- `humanDelay`: ブロック返信の間のランダムな一時停止。`natural` = 800〜2500ms。エージェントごとのオーバーライドは `agents.list[].humanDelay` です。

動作とチャンク化の詳細は [ストリーミング](/concepts/streaming) を参照してください。

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

- デフォルト値: ダイレクトチャットやメンション時は `instant`、メンションされていないグループチャット時は `message`。
- セッションごとのオーバーライド: `session.typingMode`, `session.typingIntervalSeconds`。

詳細は [タイピングインジケーター](/concepts/typing-indicators) を参照してください。

### `agents.defaults.sandbox`

埋め込みエージェント用のオプションの **Docker サンドボックス** 設定。詳細は [サンドボックス](/gateway/sandboxing) を参照してください。

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

**ワークスペースへのアクセス (`workspaceAccess`):**

- `none`: `~/.openclaw/sandboxes` 配下のスコープごとのサンドボックス用ワークスペースを使用。
- `ro`: サンドボックス用ワークスペースを `/workspace` に、エージェントのワークスペースを `/agent` に読み取り専用でマウント。
- `rw`: エージェントのワークスペースを `/workspace` に読み書き可能でマウント。

**スコープ (`scope`):**

- `session`: セッションごとに個別のコンテナとワークスペースを作成。
- `agent`: エージェントごとに 1 つのコンテナとワークスペースを作成（デフォルト）。
- `shared`: すべてで共有のコンテナとワークスペースを使用（セッション間の分離なし）。

**`setupCommand`** は、コンテナ作成後に 1 回だけ実行されます（`sh -lc` 経由）。ネットワークへの外部アクセス権限、書き込み可能なルート、およびルートユーザー権限が必要です。

**コンテナのネットワークはデフォルトで `network: "none"`** です。エージェントが外部アクセスを必要とする場合は、`"bridge"`（またはカスタムブリッジネットワーク）に設定してください。`"host"` はブロックされます。`"container:<id>"` は、`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` を明示的に設定しない限り、デフォルトでブロックされます。

**受信した添付ファイル** は、アクティブなワークスペースの `media/inbound/*` に配置されます。

**`docker.binds`** を使用して、ホスト上の追加ディレクトリをマウントできます。グローバル設定とエージェントごとの設定はマージされます。

**サンドボックス内ブラウザ** (`sandbox.browser.enabled`): コンテナ内で Chromium と CDP を実行します。noVNC の URL がシステムプロンプトに注入されます。`openclaw.json` で別途 `browser.enabled` を設定する必要はありません。
noVNC による閲覧にはデフォルトで VNC 認証が使用されます。OpenClaw は共有 URL にパスワードを直接含める代わりに、短寿命のトークン付き URL を発行します。

- `allowHostControl: false` (デフォルト): サンドボックス化されたセッションがホスト側のブラウザを操作することを防ぎます。
- `network`: デフォルトは `openclaw-sandbox-browser` (専用ブリッジネットワーク) です。明示的にグローバルなブリッジ接続が必要な場合にのみ `bridge` に設定してください。
- `cdpSourceRange`: オプションで、コンテナ境界での CDP への流入を CIDR 範囲 (例: `172.21.0.1/32`) に制限できます。
- `sandbox.browser.binds`: 追加のホストディレクトリをサンドボックスブラウザコンテナにのみマウントします。設定されている場合（空の配列 `[]` を含む）、ブラウザコンテナについては `docker.binds` の内容を置き換えます。
- 起動時のデフォルト設定は `scripts/sandbox-browser-entrypoint.sh` で定義されており、コンテナホスト向けに最適化されています。
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<OPENCLAW_BROWSER_CDP_PORT から派生>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`, `--no-default-browser-check`
  - `--disable-3d-apis`, `--disable-gpu`, `--disable-software-rasterizer`
  - `--disable-dev-shm-usage`, `--disable-background-networking`
  - `--disable-features=TranslateUI`, `--disable-breakpad`, `--disable-crash-reporter`
  - `--renderer-process-limit=2`
  - `--no-zygote`, `--metrics-recording-only`
  - `--disable-extensions` (デフォルトで有効)
  - 3D/GPU 関連のフラグはデフォルトで有効ですが、WebGL/3D が必要な場合は `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` で無効化できます。
  - 拡張機能が必要な場合は `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` で再有効化できます。
  - プロセス制限は `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` で変更可能です。`0` を指定すると Chromium のデフォルト値になります。
  - `noSandbox` が有効な場合は、`--no-sandbox` と `--disable-setuid-sandbox` が追加されます。
  - これらの設定はコンテナイメージのベースラインに基づいています。変更したい場合は、カスタムエントリポイントを持つカスタムブラウザイメージを使用してください。

</Accordion>

イメージのビルドコマンド:

```bash
scripts/sandbox-setup.sh           # メインのサンドボックスイメージ
scripts/sandbox-browser-setup.sh   # オプションのブラウザイメージ
```

### `agents.list` (エージェントごとのオーバーライド)

```json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "メインエージェント",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // または { primary, fallbacks }
        params: { cacheRetention: "none" }, // defaults.models のパラメータをキーで上書き
        identity: {
          name: "Samantha",
          theme: "親切なナマケモノ",
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
```

- `id`: 固定のエージェント ID (必須)。
- `default`: 複数が設定されている場合、最初のものが優先されます（ログに警告が出ます）。未設定の場合、リストの最初のエントリがデフォルトになります。
- `model`: 文字列形式は `primary` のみを上書きします。オブジェクト形式 `{ primary, fallbacks }` は両方を上書きします（`[]` を指定するとグローバルフォールバックが無効になります）。メインモデルのみを上書きする Cron ジョブなどは、`fallbacks: []` を指定しない限りデフォルトのフォールバック設定を継承します。
- `params`: `agents.defaults.models` で選択されたモデルエントリにマージされる、エージェントごとのストリームパラメータ。モデルカタログ全体を複製することなく、`cacheRetention`, `temperature`, `maxTokens` などのエージェント固有の上書きを行いたい場合に使用します。
- `runtime`: オプションのエージェントごとのランタイム記述子。エージェントがデフォルトで ACP ハーネスセッションを使用する場合は、`type: "acp"` を `runtime.acp` のデフォルト値（`agent`, `backend`, `mode`, `cwd`）と共に指定します。
- `identity.avatar`: ワークスペースの相対パス、`http(s)` URL、または `data:` URI。
- `identity` はデフォルト値を導出します: `emoji` から `ackReaction`、`name`/`emoji` から `mentionPatterns`。
- `subagents.allowAgents`: `sessions_spawn` で許可するエージェント ID のリスト（`["*"]` はすべて許可。デフォルトは自身のエージェントのみ）。
- サンドボックス継承ガード: 要求元セッションがサンドボックス化されている場合、`sessions_spawn` はサンドボックスなしで実行されるターゲットを拒否します。

---

## マルチエージェントルーティング

1つのゲートウェイ内で、複数の分離されたエージェントを実行します。詳細は [マルチエージェント](/concepts/multi-agent) を参照してください。

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
```

### バインディングの一致フィールド

- `type` (オプション): 通常のルーティングは `route` (省略時のデフォルト)、永続的な ACP 会話バインディングは `acp`。
- `match.channel` (必須)
- `match.accountId` (オプション: `*` はすべてのアカウントに一致。省略時はデフォルトアカウント)
- `match.peer` (オプション: `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (オプション: チャネル固有)
- `acp` (オプション: `type: "acp"` の場合のみ): `{ mode, label, cwd, backend }`

**決定的な一致順序:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (正確な一致。ピア/ギルド/チーム指定なし)
5. `match.accountId: "*"` (チャネル全体)
6. デフォルトエージェント

各階層内では、`bindings` リストで最初に一致したエントリが優先されます。

`type: "acp"` のエントリについては、会話の ID（チャネル + アカウント + ピア ID）による正確な一致で解決され、上記のルーティング階層の順序は使用されません。

### エージェントごとのアクセスプロファイル

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
    parentForkMaxTokens: 100000, // このトークン数を超えると親スレッドのフォークをスキップ（0で無効）
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // 期間または false
      maxDiskBytes: "500mb", // オプションのハード予算
      highWaterBytes: "400mb", // オプションのクリーンアップ目標
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // デフォルトの非アクティブによる自動フォーカス解除（時間単位。0で無効）
      maxAgeHours: 0, // デフォルトの最大存続時間（時間単位。0で無効）
    },
    mainKey: "main", // レガシー（ランタイムは常に "main" を使用）
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="セッションフィールドの詳細">

- **`dmScope`**: DM をどのようにグループ化するか。
  - `main`: すべての DM がメインセッションを共有。
  - `per-peer`: チャネルをまたいで送信者 ID ごとに分離。
  - `per-channel-peer`: チャネルと送信者の組み合わせごとに分離（マルチユーザーの受信トレイに推奨）。
  - `per-account-channel-peer`: アカウント、チャネル、送信者の組み合わせごとに分離（マルチアカウント運用に推奨）。
- **`identityLinks`**: 正規の ID をプロバイダーのプレフィックス付きピアにマップし、チャネルを越えてセッションを共有。
- **`reset`**: 主要なリセットポリシー。`daily` は現地時間の `atHour` に、`idle` は `idleMinutes` 経過後にリセット。両方設定されている場合は先に到達した方が優先されます。
- **`resetByType`**: タイプごとのオーバーライド（`direct`, `group`, `thread`）。レガシーな `dm` は `direct` のエイリアスとして扱われます。
- **`parentForkMaxTokens`**: スレッドセッションをフォークする際に許可される親セッションの最大 `totalTokens`（デフォルト `100000`）。
  - 親のトークン数がこの値を超えている場合、履歴を継承せずに新しいスレッドセッションを開始します。
  - `0` を設定するとこの制限が無効になり、常にフォークを試みます。
- **`mainKey`**: レガシーフィールド。ランタイムは現在、メインのダイレクトチャットバケットに常に `"main"` を使用します。
- **`sendPolicy`**: `channel`, `chatType` (`direct|group|channel`), `keyPrefix`, `rawKeyPrefix` による一致判定。最初にマッチした `deny` ルールが適用されます。
- **`maintenance`**: セッションストアのクリーンアップと保持制御。
  - `mode`: `warn` は警告のみ、`enforce` は実際にクリーンアップを適用。
  - `pruneAfter`: 古いエントリの削除期限（デフォルト `30d`）。
  - `maxEntries`: `sessions.json` の最大エントリ数（デフォルト `500`）。
  - `rotateBytes`: このサイズを超えたら `sessions.json` をローテーション（デフォルト `10mb`）。
  - `resetArchiveRetention`: `*.reset.<timestamp>` トランスクリプトアーカイブの保持期間。デフォルトは `pruneAfter` と同じ。`false` で無効化。
  - `maxDiskBytes`: セッションディレクトリのディスク予算。`warn` モードでは警告をログ出力し、`enforce` モードでは古いセッションから順に削除。
  - `highWaterBytes`: 予算制限後のクリーンアップ目標。デフォルトは `maxDiskBytes` の 80%。
- **`threadBindings`**: スレッドバインドセッション機能のグローバルデフォルト。
  - `enabled`: 全体スイッチ（プロバイダーごとに上書き可能。Discord は `channels.discord.threadBindings.enabled` を使用）。
  - `idleHours`: 非アクティブ時の自動フォーカス解除時間（デフォルト。`0` で無効。プロバイダーごとに上書き可能）。
  - `maxAgeHours`: 最大存続時間（デフォルト。`0` で無効。プロバイダーごとに上書き可能）。

</Accordion>

---

## メッセージ

```json5
{
  messages: {
    responsePrefix: "🦞", // または "auto"
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
      debounceMs: 2000, // 0 で無効
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### 応答プレフィックス (Response prefix)

チャネル/アカウントごとのオーバーライド: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`。

解決順序（最も具体的なものが優先）: アカウント → チャネル → グローバル。`""` を設定すると継承が停止します。`"auto"` は `[{identity.name}]` を使用します。

**テンプレート変数:**

| 変数名 | 説明 | 例 |
| :--- | :--- | :--- |
| `{model}` | 短いモデル名 | `claude-opus-4-6` |
| `{modelFull}` | 完全なモデル識別子 | `anthropic/claude-opus-4-6` |
| `{provider}` | プロバイダー名 | `anthropic` |
| `{thinkingLevel}` | 現在の思考レベル | `high`, `low`, `off` |
| `{identity.name}` | エージェントの名前 | (`"auto"` と同じ) |

変数は大文字小文字を区別しません。`{think}` は `{thinkingLevel}` の短縮形です。

### 確認リアクション (Ack reaction)

- デフォルトはアクティブなエージェントの `identity.emoji`、未設定なら `"👀"`。`""` で無効化。
- チャネル/アカウントごとのオーバーライド: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`。
- 解決順序: アカウント → チャネル → `messages.ackReaction` → アイデンティティのフォールバック。
- スコープ: `group-mentions` (デフォルト), `group-all`, `direct`, `all`。
- `removeAckAfterReply`: 返信後にリアクションを削除（Slack/Discord/Telegram/Google Chat のみ）。

### インバウンドデバウンス (Inbound debounce)

同じ送信者からの連続したテキストメッセージを 1 つのエージェントターンにまとめます。メディアや添付ファイルは即座に処理されます。制御コマンドはデバウンスをバイパスします。

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

- `auto`: 自動 TTS を制御。`/tts off|always|inbound|tagged` でセッションごとに変更可能。
- `summaryModel`: 自動要約用のモデル。`agents.defaults.model.primary` を上書きします。
- `modelOverrides`: デフォルトで有効。`modelOverrides.allowProvider` のデフォルトは `false`（オプトイン）です。
- API キーは `ELEVENLABS_API_KEY`/`XI_API_KEY` または `OPENAI_API_KEY` 環境変数にフォールバックします。
- `openai.baseUrl`: OpenAI TTS エンドポイントを上書き。解決順序は 構成 > `OPENAI_TTS_BASE_URL` > `https://api.openai.com/v1`。
- `openai.baseUrl` が非 OpenAI エンドポイントを指している場合、OpenClaw はそれを互換サーバーとして扱い、バリデーションを緩和します。

---

## 話す (トークモード)

macOS/iOS/Android のトークモードのデフォルト設定。

```json5
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
```

- 音声 ID は `ELEVENLABS_VOICE_ID` または `SAG_VOICE_ID` 環境変数にフォールバックします。
- `apiKey` および `providers.*.apiKey` はプレーンテキストまたは SecretRef オブジェクトを受け入れます。
- `ELEVENLABS_API_KEY` へのフォールバックは、Talk 構成にキーが設定されていない場合にのみ適用されます。
- `voiceAliases`: トークディレクティブでフレンドリーな名称を使用できるようにします。
- `silenceTimeoutMs`: ユーザーが話をやめてから送信を開始するまでの待機時間。未設定の場合はプラットフォームのデフォルト（macOS/Android: 700ms, iOS: 900ms）が使用されます。

---

## ツール (Tools)

### ツールプロファイル

`tools.profile` は、`tools.allow`/`tools.deny` が適用される前の基本的なホワイトリストを設定します。

オンボーディング時に未設定の場合、新規のローカル構成ではデフォルトで `tools.profile: "coding"` に設定されます（既存のプロファイルは保持されます）。

| プロファイル | 含まれるツール |
| :--- | :--- |
| `minimal` | `session_status` のみ |
| `coding` | `group:fs`, `group:runtime`, `group:sessions`, `group:memory`, `image` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status` |
| `full` | 制限なし（未設定と同じ） |

### ツールグループ

| グループ名 | ツール |
| :--- | :--- |
| `group:runtime` | `exec`, `process` (`bash` は `exec` のエイリアスとして許可) |
| `group:fs` | `read`, `write`, `edit`, `apply_patch` |
| `group:sessions` | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `session_status` |
| `group:memory` | `memory_search`, `memory_get` |
| `group:web` | `web_search`, `web_fetch` |
| `group:ui` | `browser`, `canvas` |
| `group:automation` | `cron`, `gateway` |
| `group:messaging` | `message` |
| `group:nodes` | `nodes` |
| `group:openclaw` | すべての組み込みツール（プロバイダープラグインを除く） |

### `tools.allow` / `tools.deny`

ツール許可/拒否のグローバルポリシー（拒否が優先）。大文字小文字を区別せず、`*` ワイルドカードをサポートします。Docker サンドボックスが無効でも適用されます。

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

特定のプロバイダーやモデルに対して、さらにツールを制限します。適用順序: 基本プロファイル → プロバイダープロファイル → 許可/拒否設定。

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

昇格された権限（ホスト上での実行）を制御します。

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

- エージェントごとのオーバーライド（`agents.list[].tools.elevated`）は、グローバル設定をより厳しくすることのみ可能です。
- `/elevated on|off|ask|full` はセッションごとに状態を保存します。インラインディレクティブは単一のメッセージに適用されます。
- 昇格された `exec` はホスト上で直接実行され、サンドボックスをバイパスします。

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

### `tools.loopDetection` (ループ検出)

ツールループの安全性チェックは **デフォルトで無効** です。有効にするには `enabled: true` を設定してください。
設定は `tools.loopDetection` でグローバルに定義でき、`agents.list[].tools.loopDetection` でエージェントごとに上書き可能です。

```json5
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
```

- `historySize`: ループ分析のために保持されるツール呼び出し履歴の最大数。
- `warningThreshold`: 進行のないパターンの繰り返しに対する警告しきい値。
- `criticalThreshold`: クリティカルなループをブロックするための、より高い繰り返ししきい値。
- `globalCircuitBreakerThreshold`: 進行のない実行を強制停止するためのハードしきい値。
- `detectors.genericRepeat`: 同じツールや引数での繰り返し呼び出しを警告。
- `detectors.knownPollNoProgress`: 既知のポーリングツール（`process.poll`, `command_status` など）を警告/ブロック。
- `detectors.pingPong`: 交互に繰り返される進行のないペアパターンを警告/ブロック。
- `warningThreshold >= criticalThreshold` または `criticalThreshold >= globalCircuitBreakerThreshold` の場合はバリデーションエラーになります。

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // または BRAVE_API_KEY 環境変数
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
```

### `tools.media`

受信メディア（画像、音声、動画）の解析設定です。

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

<Accordion title="メディアモデルのエントリフィールド">

**プロバイダーエントリ** (`type: "provider"` または省略時):

- `provider`: API プロバイダー ID (`openai`, `anthropic`, `google`/`gemini`, `groq` など)。
- `model`: モデル ID のオーバーライド。
- `profile` / `preferredProfile`: `auth-profiles.json` 内のプロファイル選択。

**CLI エントリ** (`type: "cli"`):

- `command`: 実行するコマンド名。
- `args`: テンプレート引数（`{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}` などをサポート）。

**共通フィールド:**

- `capabilities`: 対応機能のリスト (`image`, `audio`, `video`)。デフォルト設定: `openai`/`anthropic`/`minimax` は画像、`google` は画像・音声・動画、`groq` は音声。
- `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: エントリごとのオーバーライド。
- 失敗した場合はリスト内の次のエントリへフォールバックします。

プロバイダーの認証は、`auth-profiles.json` → 環境変数 → `models.providers.*.apiKey` の順で解決されます。

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

セッション操作ツール（`sessions_list`, `sessions_history`, `sessions_send`）が対象にできる範囲を制御します。

デフォルト: `tree`（現在のセッションと、そこから生成されたサブエージェントなどのセッション）。

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

備考:
- `self`: 現在のセッションのみ。
- `tree`: 現在のセッションと、そのセッションから派生したすべてのセッション。
- `agent`: 現在のエージェント ID に属するすべてのセッション。
- `all`: すべてのセッション。エージェントをまたぐ場合は `tools.agentToAgent` の許可も必要です。
- サンドボックスの制限: セッションがサンドボックス化されており、`agents.defaults.sandbox.sessionToolsVisibility="spawned"` が設定されている場合、この設定が `all` であっても強制的に `tree` に制限されます。

### `tools.sessions_spawn`

`sessions_spawn` におけるインライン添付ファイルのサポートを制御します。

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // 有効にする場合は true に設定
        maxTotalBytes: 5242880, // 合計 5 MB まで
        maxFiles: 50,
        maxFileBytes: 1048576, // 1ファイルあたり 1 MB まで
        retainOnSessionKeep: false, // cleanup="keep" の際に添付ファイルを保持するかどうか
      },
    },
  },
}
```

備考:
- 添付ファイルは `runtime: "subagent"` でのみサポートされます。ACP ランタイムでは拒否されます。
- ファイルは子ワークスペースの `.openclaw/attachments/<uuid>/` に配置されます。
- 添付ファイルの内容は、ログの永続化時に自動的に伏せ字（redact）処理されます。
- Base64 入力は厳密にチェックされ、デコード前のサイズ制限が適用されます。
- ファイル権限はディレクトリが `0700`、ファイルが `0600` に設定されます。
- クリーンアップは `cleanup` ポリシーに従います。`delete` は常に削除し、`keep` は `retainOnSessionKeep: true` の場合のみ保持します。

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
```

- `model`: 生成されるサブエージェントのデフォルトモデル。省略時は呼び出し元のモデルを継承します。
- `runTimeoutSeconds`: ツール呼び出しで指定されなかった場合のデフォルトタイムアウト。`0` は無制限を意味します。
- サブエージェントごとのツールポリシー: `tools.subagents.tools.allow` / `tools.subagents.tools.deny` で設定します。

---

## カスタムプロバイダーとベース URL

OpenClaw は pi-coding-agent のモデルカタログを使用します。構成ファイルの `models.providers` または `~/.openclaw/agents/<agentId>/agent/models.json` を通じてカスタムプロバイダーを追加できます。

```json5
{
  models: {
    mode: "merge", // merge (デフォルト) | replace
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
```

- 特殊な認証が必要な場合は `authHeader: true` と `headers` を組み合わせて使用します。
- エージェント設定のルートディレクトリは `OPENCLAW_AGENT_DIR` 環境変数で変更可能です。
- プロバイダー ID が一致する場合のマージ優先順位:
  - エージェント個別の `models.json` 内の `baseUrl` が最優先されます。
  - `apiKey` は、そのプロバイダーが SecretRef で管理されていない場合にのみ優先されます。
  - 空または欠落している項目は、メイン構成の `models.providers` にフォールバックします。
  - `contextWindow` / `maxTokens` は、明示的な設定値とカタログ値のうち高い方が採用されます。
  - `models.mode: "replace"` を使用すると、カタログをマージせずに構成ファイルの内容で完全に置き換えます。

### プロバイダーフィールドの詳細

- `models.mode`: カタログの動作 (`merge` または `replace`)。
- `models.providers`: プロバイダー ID をキーとするカスタムプロバイダーのマップ。
- `models.providers.*.api`: リダプターの種類 (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai` など)。
- `models.providers.*.apiKey`: 認証情報（SecretRef や環境変数参照を推奨）。
- `models.providers.*.auth`: 認証戦略 (`api-key`, `token`, `oauth`, `aws-sdk`)。
- `models.providers.*.injectNumCtxForOpenAICompat`: Ollama 等で `options.num_ctx` を注入するかどうか (デフォルト: `true`)。
- `models.providers.*.baseUrl`: アップストリームの API ベース URL。
- `models.providers.*.headers`: プロキシやルーティング用の追加ヘッダー。
- `models.providers.*.models`: プロバイダーごとの明示的なモデルカタログ。
- `models.providers.*.models.*.compat.supportsDeveloperRole`: `api: "openai-completions"` で `baseUrl` が `api.openai.com` 以外の場合、OpenClaw はこれを強制的に `false` に設定して互換性を確保します。
- `models.bedrockDiscovery`: Bedrock 自動検出の設定。
  - `enabled`: 検出の有効/無効。
  - `region`: AWS リージョン。
  - `providerFilter`: 特定のプロバイダー ID で絞り込むオプション。
  - `refreshInterval`: 検出の更新間隔。
  - `defaultContextWindow` / `defaultMaxTokens`: 検出されたモデルのフォールバック値。

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
```

Cerebras を経由する場合は `cerebras/zai-glm-4.7` を、Z.AI 直販を使用する場合は `zai/glm-4.7` を使用します。

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

`OPENCODE_API_KEY` (または `OPENCODE_ZEN_API_KEY`) を設定してください。ショートカット: `openclaw onboard --auth-choice opencode-zen`。

</Accordion>

<Accordion title="Z.AI (GLM-4.7)">

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

`ZAI_API_KEY` を設定してください。`z.ai/*` や `z-ai/*` もエイリアスとして受け入れられます。ショートカット: `openclaw onboard --auth-choice zai-api-key`。

- 一般的なエンドポイント: `https://api.z.ai/api/paas/v4`
- コーディング用エンドポイント (デフォルト): `https://api.z.ai/api/coding/paas/v4`
- 一般的なエンドポイントを使用する場合は、ベース URL を上書きしてカスタムプロバイダーを定義してください。

</Accordion>

<Accordion title="Moonshot AI (Kimi)">

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

中国向けエンドポイントを使用する場合: `baseUrl: "https://api.moonshot.cn/v1"` または `openclaw onboard --auth-choice moonshot-api-key-cn`。

</Accordion>

<Accordion title="Kimi Coding">

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

Anthropic 互換の組み込みプロバイダーです。ショートカット: `openclaw onboard --auth-choice kimi-code-api-key`。

</Accordion>

<Accordion title="Synthetic (Anthropic 互換)">

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

ベース URL から `/v1` を除外する必要があります（Anthropic クライアントが自動付加します）。ショートカット: `openclaw onboard --auth-choice synthetic-api-key`。

</Accordion>

<Accordion title="MiniMax M2.5 (直接利用)">

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

`MINIMAX_API_KEY` を設定してください。ショートカット: `openclaw onboard --auth-choice minimax-api`。

</Accordion>

<Accordion title="ローカルモデル (LM Studio)">

[ローカルモデル](/gateway/local-models) を参照してください。要約: ハイスペックなハードウェア上の LM Studio Responses API 経由で MiniMax M2.5 を実行し、フォールバック用にクラウド版をマージしておきます。

</Accordion>

---

## スキル (Skills)

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
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // またはプレーンテキスト
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: 同梱されているスキルのみを許可するオプションのホワイトリスト（管理済み/ワークスペーススキルには影響しません）。
- `entries.<skillKey>.enabled: false`: 同梱またはインストールされているスキルを無効化します。
- `entries.<skillKey>.apiKey`: 主要な環境変数を宣言するための便利なフィールド（プレーンテキストまたは SecretRef）。

---

## プラグイン (Plugins)

```json5
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
```

- `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions`, および `plugins.load.paths` からロードされます。
- **構成を変更した場合はゲートウェイの再起動が必要です。**
- `allow`: 許可リスト（リストにないプラグインはロードされません）。`deny` が優先されます。
- `plugins.entries.<id>.apiKey`: プラグイン固有の API キー用フィールド（プラグインが対応している場合）。
- `plugins.entries.<id>.env`: プラグインスコープの環境変数マップ。
- `plugins.entries.<id>.hooks.allowPromptInjection`: `false` の場合、`before_prompt_build` によるプロンプト変更をブロックし、レガシーな `before_agent_start` からのプロンプト変更フィールドを無視します（`modelOverride` や `providerOverride` は維持されます）。
- `plugins.entries.<id>.config`: プラグインが定義する設定オブジェクト（プラグインのスキーマで検証されます）。
- `plugins.slots.memory`: 使用するメモリプラグインの ID を指定。無効にする場合は `"none"` を指定します。
- `plugins.slots.contextEngine`: 使用するコンテキストエンジンプラグインの ID。デフォルトは `"legacy"` です。
- `plugins.installs`: `openclaw plugins update` 等で使用される CLI 管理のインストール用メタデータ。
  - `source`, `spec`, `version`, `integrity` 等が含まれます。これらは CLI によって自動管理されるため、手動編集は避けてください。

詳細は [プラグイン](/tools/plugin) を参照してください。

---

## ブラウザ (Browser)

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "chrome",
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: true, // デフォルト: 信頼されたネットワークモード
      // allowPrivateNetwork: true, // レガシーエイリアス
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
    // relayBindHost: "0.0.0.0", // 名前空間をまたぐ必要がある場合（WSL2等）のみ
    // executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    // attachOnly: false,
  },
}
```

- `evaluateEnabled: false`: `act:evaluate` や `wait --fn` を無効化します。
- `ssrfPolicy.dangerouslyAllowPrivateNetwork`: 未設定時はデフォルトで `true`（信頼されたネットワークモデル）。パブリックな Web 閲覧のみに制限したい場合は `false` に設定してください。
- `ssrfPolicy.allowPrivateNetwork` もレガシーエイリアスとしてサポートされます。
- 制限モードでは、`hostnameAllowlist` や `allowedHostnames` で例外を定義できます。
- リモートプロファイルは接続専用です（開始/停止/リセットは不可）。
- 自動検出順序: Chromium ベースのデフォルトブラウザ → Chrome → Brave → Edge → Chromium → Chrome Canary。
- 制御サービス: ループバックのみ（ポートは `gateway.port` から派生。デフォルトは `18791`）。
- `extraArgs`: 起動時の追加フラグ（GPU 無効化、ウィンドウサイズ指定、デバッグフラグ等）。
- `relayBindHost`: Chrome 拡張機能のリレーがリッスンするアドレス。ループバックのみの場合は未設定のままにしてください。名前空間の境界（WSL2 等）を越える必要があり、かつホストネットワークが信頼できる場合のみ `0.0.0.0` 等を設定してください。

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // 絵文字、短いテキスト、画像 URL、または data URI
    },
  },
}
```

- `seamColor`: ネイティブアプリの UI アクセントカラー（トークモードのバブルの色など）。
- `assistant`: コントロール UI におけるアイデンティティのオーバーライド。未設定時はアクティブなエージェントのアイデンティティが使用されます。

---

## ゲートウェイ (Gateway)

```json5
{
  gateway: {
    mode: "local", // local | remote
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token", // none | token | password | trusted-proxy
      token: "your-token",
      // password: "your-password", // または OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // mode=trusted-proxy の場合。詳細は /gateway/trusted-proxy-auth
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
      // allowedOrigins: ["https://control.example.com"], // ループバック以外のコントロール UI で必要
      // dangerouslyAllowHostHeaderOriginFallback: false, // 危険な Host ヘッダーによる Origin フォールバックモード
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
    // オプション。デフォルトは false。
    allowRealIpFallback: false,
    tools: {
      // HTTP 経由のツール実行（/tools/invoke）に対する追加の拒否リスト
      deny: ["browser"],
      // デフォルトの HTTP 拒否リストからツールを除外
      allow: ["gateway"],
    },
  },
}
```

<Accordion title="ゲートウェイフィールドの詳細">

- `mode`: `local` (ゲートウェイを実行) または `remote` (リモートゲートウェイに接続)。`local` でない限りゲートウェイは起動しません。
- `port`: WebSocket と HTTP で共用される単一のポート。優先順位: `--port` 引数 > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`。
- `bind`: `auto`, `loopback` (デフォルト), `lan` (`0.0.0.0`), `tailnet` (Tailscale IP のみ), または `custom`。
- **レガシーなバインドエイリアス**: `gateway.bind` にはホストのエイリアス（`0.0.0.0`, `127.0.0.1` 等）ではなく、上記のバインドモード値を指定してください。
- **Docker に関する注意**: デフォルトの `loopback` はコンテナ内の `127.0.0.1` でリッスンします。Docker のブリッジネットワーク（`-p 18789:18789`）を使用する場合、トラフィックは `eth0` に到達するため、ゲートウェイにアクセスできなくなります。`--network host` を使用するか、`bind: "lan"`（または `bind: "custom"` かつ `customBindHost: "0.0.0.0"`）を設定してすべてのインターフェースでリッスンするようにしてください。
- **認証 (Auth)**: デフォルトで必須です。ループバック以外のバインドには共通のトークン/パスワードが必要です。オンボーディングウィザードはデフォルトでトークンを生成します。
- `gateway.auth.token` と `gateway.auth.password` の両方が構成されている場合（SecretRef を含む）、`gateway.auth.mode` を明示的に `token` または `password` に設定してください。モードが未設定で両方が存在する場合、起動やサービスのインストール/修復に失敗します。
- `gateway.auth.mode: "none"`: 明示的な無認証モード。信頼されたローカルループバック環境でのみ使用してください。オンボーディングのプロンプトでは意図的に提供されません。
- `gateway.auth.mode: "trusted-proxy"`: 認証を ID 認識リバースプロキシに委任し、`gateway.trustedProxies` からの ID ヘッダーを信頼します（[信頼されたプロキシ認証](/gateway/trusted-proxy-auth) を参照）。
- `gateway.auth.allowTailscale`: `true` の場合、Tailscale Serve の ID ヘッダーをコントロール UI/WebSocket の認証に使用できます（`tailscale whois` で検証）。HTTP API エンドポイントには引き続きトークン/パスワード認証が必要です。このトークンレスフローは、ゲートウェイホストが信頼されていることを前提としています。`tailscale.mode = "serve"` の場合はデフォルトで `true` になります。
- `gateway.auth.rateLimit`: オプションの認証失敗リミッター。クライアント IP ごと、および認証スコープ（共通シークレットとデバイス用トークンは個別に追跡）ごとに適用されます。ブロックされた試行は `429` (Retry-After 付き) を返します。
  - `gateway.auth.rateLimit.exemptLoopback`: デフォルトは `true` です。テスト環境や厳格なプロキシ運用のためにローカルホストからのトラフィックも制限したい場合は `false` に設定してください。
- ブラウザをオリジンとする WebSocket 認証の試行は、常にデバウンスが有効な状態でスロットル制限されます（ブラウザベースのローカルホストへのブルートフォース攻撃に対する多層防御のため）。
- `tailscale.mode`: `serve` (Tailnet 内のみ、ループバックバインド) または `funnel` (公開、認証必須)。
- `controlUi.allowedOrigins`: ゲートウェイ WebSocket 接続を許可する明示的なブラウザオリジンのリスト。ループバック以外のオリジンからブラウザクライアントが接続する場合に必要です。
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: Host ヘッダーによるオリジンポリシーに依存するデプロイ環境向けの、Host ヘッダーによる Origin フォールバックを有効にする危険なモードです。
- `remote.transport`: `ssh` (デフォルト) または `direct` (ws/wss)。`direct` の場合、`remote.url` は `ws://` または `wss://` である必要があります。
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: クライアント側の非常用オーバーライド設定で、信頼されたプライベートネットワーク IP へのプレーンテキスト `ws://` 接続を許可します。デフォルトではプレーンテキストはループバックのみに制限されています。
- `gateway.remote.token` / `.password` はリモートクライアント用の認証情報フィールドです。これら自体がゲートウェイの認証を構成するものではありません。
- ローカルからのゲートウェイ呼び出しにおいて、`gateway.auth.*` が未設定の場合、`gateway.remote.*` がフォールバックとして使用されることがあります。
- `trustedProxies`: TLS を終端するリバースプロキシの IP アドレス。自身が管理するプロキシのみをリストしてください。
- `allowRealIpFallback`: `true` の場合、`X-Forwarded-For` が存在しない場合に `X-Real-IP` を受け入れます。デフォルトは `false` です（安全側に倒す動作）。
- `gateway.tools.deny`: HTTP `POST /tools/invoke` でブロックする追加のツール名（デフォルトの拒否リストを拡張）。
- `gateway.tools.allow`: デフォルトの HTTP 拒否リストからツール名を除外します。

</Accordion>

### OpenAI 互換エンドポイント

- チャット完了 (Chat Completions): デフォルトでは無効です。`gateway.http.endpoints.chatCompletions.enabled: true` で有効にします。
- 応答 API (Responses API): `gateway.http.endpoints.responses.enabled`。
- 応答 URL 入力の強化:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
- オプションの応答強化ヘッダー:
  - `gateway.http.securityHeaders.strictTransportSecurity` (自身が管理する HTTPS オリジンに対してのみ設定してください。[信頼されたプロキシ認証](/gateway/trusted-proxy-auth#tls-termination-and-hsts) を参照)

### マルチインスタンスの分離

1つのホスト上で、一意のポートと状態ディレクトリを使用して複数のゲートウェイを実行できます。

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

便利なフラグ: `--dev` (`~/.openclaw-dev` + ポート `19001` を使用)、`--profile <name>` (`~/.openclaw-<name>` を使用)。

詳細は [マルチゲートウェイ](/gateway/multiple-gateways) を参照してください。

---

## フック (Hooks)

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

認証: `Authorization: Bearer <token>` または `x-openclaw-token: <token>` ヘッダーを使用します。

**エンドポイント:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - リクエストペイロードからの `sessionKey` は、`hooks.allowRequestSessionKey=true` (デフォルト: `false`) の場合にのみ受け入れられます。
- `POST /hooks/<name>` → `hooks.mappings` を介して解決されます。

<Accordion title="マッピングの詳細">

- `match.path`: `/hooks` 以降のサブパスに一致します（例: `/hooks/gmail` → `gmail`）。
- `match.source`: 汎用的なパスに対してペイロード内のフィールドで一致を判定します。
- `{{messages[0].subject}}` のようなテンプレートはペイロードから値を読み取ります。
- `transform`: フックアクションを返す JS/TS モジュールを指定できます。
  - `transform.module` は相対パスである必要があり、`hooks.transformsDir` 内にある必要があります（絶対パスやディレクトリトラバーサルは拒否されます）。
- `agentId`: 特定のエージェントにルーティングします。未知の ID はデフォルトにフォールバックします。
- `allowedAgentIds`: 明示的なルーティングを制限します（`*` または省略で全許可、`[]` で全拒否）。
- `defaultSessionKey`: 明示的な `sessionKey` がないフックエージェント実行用の、オプションの固定セッションキー。
- `allowRequestSessionKey`: `/hooks/agent` の呼び出し元が `sessionKey` を設定することを許可します (デフォルト: `false`)。
- `allowedSessionKeyPrefixes`: 明示的な `sessionKey` 値に対するオプションのプレフィックス許可リスト（例: `["hook:"]`）。
- `deliver: true`: 最終的な返信をチャネルに送信します。`channel` はデフォルトで `last` になります。
- `model`: このフック実行の LLM を上書きします（モデルカタログで許可されている必要があります）。

</Accordion>

### Gmail 連携

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

- ゲートウェイは、構成されている場合、起動時に `gog gmail watch serve` を自動的に開始します。無効にするには `OPENCLAW_SKIP_GMAIL_WATCHER=1` を設定してください。
- ゲートウェイと並行して個別の `gog gmail watch serve` を実行しないでください。

---

## キャンバスホスト (Canvas host)

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // または OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- エージェントが編集可能な HTML/CSS/JS および A2UI を、ゲートウェイのポート経由で HTTP 配信します。
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- ローカルのみの利用: `gateway.bind: "loopback"` (デフォルト) のままにしてください。
- ループバック以外のバインド: キャンバスのルートへのアクセスには、ゲートウェイの他の HTTP 面と同様に認証（トークン/パスワード/信頼されたプロキシ）が必要です。
- ノード上の WebView は通常、認証ヘッダーを送信しません。ノードがペアリングされ接続されると、ゲートウェイはそのノード専用のキャンバス/A2UI アクセス用「機能 URL（Capability URL）」を通知します。
- 機能 URL はアクティブなノードの WS セッションに紐付けられており、短時間で期限切れになります。IP ベースのフォールバックは使用されません。
- 配信される HTML にライブリロード用クライアントを注入します。
- ディレクトリが空の場合、スターター用の `index.html` を自動生成します。
- `/__openclaw__/a2ui/` で A2UI も配信します。
- 設定の変更にはゲートウェイの再起動が必要です。
- 大規模なディレクトリや `EMFILE` エラーが発生する場合は、ライブリロードを無効にしてください。

---

## 検出 (Discovery)

### mDNS (Bonjour)

```json5
{
  discovery: {
    mdns: {
      mode: "minimal", // minimal | full | off
    },
  },
}
```

- `minimal` (デフォルト): TXT レコードから `cliPath` と `sshPort` を除外します。
- `full`: `cliPath` と `sshPort` を含めます。
- ホスト名はデフォルトで `openclaw` になります。`OPENCLAW_MDNS_HOSTNAME` で上書き可能です。

### 広域検出 (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

`~/.openclaw/dns/` 配下にユニキャスト DNS-SD ゾーンファイルを書き出します。ネットワークを越えた検出を行うには、DNS サーバー（CoreDNS 推奨）と Tailscale の Split DNS を組み合わせてください。

セットアップ: `openclaw dns setup --apply`。

---

## 環境設定 (Environment)

### `env` (インライン環境変数)

```json5
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
```

- インライン環境変数は、プロセスの環境変数にそのキーが存在しない場合にのみ適用されます。
- `.env` ファイル: カレントディレクトリの `.env` と `~/.openclaw/.env` が読み込まれます（既存の変数は上書きしません）。
- `shellEnv`: ログインシェルのプロファイルから、不足している期待されるキーをインポートします。
- 詳細は [環境設定](/help/environment) を参照してください。

### 環境変数の置換

構成ファイル内の任意の文字列で `${VAR_NAME}` の形式で環境変数を参照できます。

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- 大文字の名前のみが一致します: `[A-Z_][A-Z0-9_]*`。
- 変数が欠落しているか空の場合、構成のロード時にエラーが発生します。
- リテラルとして `${VAR}` と記述したい場合は `$${VAR}` のようにエスケープしてください。
- `$include` 内でも動作します。

---

## シークレット (Secrets)

シークレット参照（SecretRef）は加算的です。プレーンテキストの値も引き続き動作します。

### `SecretRef`

以下のオブジェクト形式を使用します。

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

バリデーション規則:

- `provider` パターン: `^[a-z][a-z0-9_-]{0,63}$`
- `source: "env"` の ID パターン: `^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` の ID: 絶対パス形式の JSON ポインター（例: `"/providers/openai/apiKey"`）
- `source: "exec"` の ID パターン: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`

### サポートされている認証情報箇所

- 対応表: [SecretRef 対応箇所一覧](/reference/secretref-credential-surface)
- `secrets apply` コマンドは、`openclaw.json` 内のサポートされている認証情報パスを対象にします。
- `auth-profiles.json` 内の参照も、実行時の解決および監査の対象に含まれます。

### シークレットプロバイダーの構成

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // 明示的な環境変数プロバイダー（オプション）
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

備考:

- `file` プロバイダーは `mode: "json"` および `mode: "singleValue"` をサポートします（singleValue モードでは `id` を `"value"` にする必要があります）。
- `exec` プロバイダーは絶対パスによる `command` 指定が必要で、標準入出力を介したプロトコルを使用します。
- デフォルトではシンボリックリンクのコマンドパスは拒否されます。`allowSymlinkCommand: true` を設定すると、解決後のターゲットパスを検証した上で許可されます。
- `trustedDirs` が構成されている場合、解決後のターゲットパスに対してチェックが行われます。
- `exec` で起動される子プロセスの環境変数はデフォルトで最小限です。必要な変数は `passEnv` で明示的に渡してください。
- シークレットの参照はアクティベーション時にメモリ上のスナップショットへと解決され、以降のリクエストパスではそのスナップショットのみを読み取ります。
- 有効な箇所（Surface）での解決失敗は起動/リロードのエラーとなりますが、無効な箇所にある参照は診断情報と共にスキップされます。

---

## 認証情報の保存 (Auth storage)

```json5
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
```

- エージェントごとのプロファイルは `<agentDir>/auth-profiles.json` に保存されます。
- `auth-profiles.json` は値レベルでの参照（`api_key` 用の `keyRef`、`token` 用の `tokenRef`）をサポートしています。
- 実行時の静的な認証情報はメモリ上の解決済みスナップショットから取得されます。従来の静的な `auth.json` エントリは検出時に削除されます。
- 従来の OAuth インポートは `~/.openclaw/credentials/oauth.json` から行われます。
- 詳細は [OAuth](/concepts/oauth) を参照してください。
- シークレットの実行時の動作および `audit/configure/apply` ツールについては、[シークレット管理](/gateway/secrets) を参照してください。

---

## ロギング (Logging)

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
```

- デフォルトのログファイル: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`。
- 固定のパスを使用したい場合は `logging.file` を設定してください。
- `--verbose` 指定時は `consoleLevel` が `debug` に引き上げられます。

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

- `cli.banner.taglineMode` はバナーのタグライン（標語）スタイルを制御します。
  - `"random"` (デフォルト): 面白いものや季節ごとのタグラインを入れ替えて表示します。
  - `"default"`: 固定の中立的なタグライン（`All your chats, one OpenClaw.`）を表示します。
  - `"off"`: タグラインを表示しません（バナーのタイトルとバージョンは引き続き表示されます）。
- タグラインだけでなくバナー全体を非表示にするには、環境変数 `OPENCLAW_HIDE_BANNER=1` を設定してください。

---

## ウィザード (Wizard)

CLI ウィザード（`onboard`, `configure`, `doctor`）によって書き込まれるメタデータです。

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

## アイデンティティ (Identity)

```json5
{
  agents: {
    list: [
      {
        id: "main",
        identity: {
          name: "Samantha",
          theme: "親切なナマケモノ",
          emoji: "🦥",
          avatar: "avatars/samantha.png",
        },
      },
    ],
  },
}
```

macOS のオンボーディングアシスタントによって書き込まれます。以下のデフォルト値が導出されます。

- `identity.emoji` から `messages.ackReaction` (未設定なら 👀)
- `identity.name` / `identity.emoji` から `mentionPatterns`
- `avatar` にはワークスペース相対パス、`http(s)` URL、または `data:` URI を指定可能

---

## ブリッジ (Bridge - レガシー、削除済み)

現在のビルドには TCP ブリッジは含まれていません。ノードはゲートウェイの WebSocket 経由で接続します。`bridge.*` キーは構成スキーマから削除されています（削除しないと検証エラーになります。`openclaw doctor --fix` で不明なキーを削除できます）。

<Accordion title="旧ブリッジ構成 (歴史的リファレンス)">

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

## Cron

```json5
{
  cron: {
    enabled: true,
    maxConcurrentRuns: 2,
    webhook: "https://example.invalid/legacy", // notify:true が設定された古いジョブ用の非推奨フォールバック
    webhookToken: "固有のトークンに置き換え", // アウトバウンド Webhook 認証用のオプションの Bearer トークン
    sessionRetention: "24h", // 期間を表す文字列または false
    runLog: {
      maxBytes: "2mb", // デフォルト 2,000,000 バイト
      keepLines: 2000, // デフォルト 2000 行
    },
  },
}
```

- `sessionRetention`: 完了した分離 Cron 実行セッションを `sessions.json` から削除するまでの期間。アーカイブされた削除済み Cron ログのクリーンアップも制御します。デフォルトは `24h` です。無効にするには `false` を設定します。
- `runLog.maxBytes`: 各実行ログファイル (`cron/runs/<jobId>.jsonl`) がクリーンアップされる前の最大サイズ。
- `runLog.keepLines`: 実行ログのクリーンアップ時に保持される最新の行数。
- `webhookToken`: Cron Webhook の送信 (`delivery.mode = "webhook"`) に使用される Bearer トークン。省略された場合、認証ヘッダーは送信されません。
- `webhook`: `notify: true` が設定されたままの古いジョブのために残されている、非推奨のフォールバック用 Webhook URL (http/https)。

詳細は [Cron ジョブ](/automation/cron-jobs) を参照してください。

---

## メディアモデルのテンプレート変数

`tools.media.models[].args` 内で展開されるテンプレートプレースホルダーです。

| 変数 | 説明 |
| :--- | :--- |
| `{{Body}}` | 受信メッセージの全文 |
| `{{RawBody}}` | 生の本文（履歴や送信者情報を含まない） |
| `{{BodyStripped}}` | 本文からグループメンションを除去したもの |
| `{{From}}` | 送信者識別子 |
| `{{To}}` | 宛先識別子 |
| `{{MessageSid}}` | チャネルにおけるメッセージ ID |
| `{{SessionId}}` | 現在のセッション UUID |
| `{{IsNewSession}}` | 新しいセッションが作成された場合に `"true"` |
| `{{MediaUrl}}` | 受信メディアの疑似 URL |
| `{{MediaPath}}` | ローカルのメディアパス |
| `{{MediaType}}` | メディアの種類 (image/audio/document/...) |
| `{{Transcript}}` | 音声の書き起こし内容 |
| `{{Prompt}}` | CLI エントリ用に解決されたメディアプロンプト |
| `{{MaxChars}}` | CLI エントリ用に解決された最大出力文字数 |
| `{{ChatType}}` | `"direct"` または `"group"` |
| `{{GroupSubject}}` | グループの件名 (ベストエフォート) |
| `{{GroupMembers}}` | グループメンバーのプレビュー (ベストエフォート) |
| `{{SenderName}}` | 送信者の表示名 (ベストエフォート) |
| `{{SenderE164}}` | 送信者の電話番号 (ベストエフォート) |
| `{{Provider}}` | プロバイダーのヒント (whatsapp, telegram, discord など) |

---

## 構成のインクルード (`$include`)

構成を複数のファイルに分割できます。

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

- 単一ファイル: 含まれているオブジェクトで置き換えます。
- ファイルの配列: 順番にディープマージされます（後のファイルが前のファイルを上書きします）。
- 兄弟キー: インクルード後にマージされます（インクルードされた値を上書きします）。
- ネストされたインクルード: 最大 10 レベルまで。
- パス: インクルード元のファイルを基準に解決されますが、最上位の構成ディレクトリ（`openclaw.json` のディレクトリ）内にある必要があります。絶対パスや `../` は、その境界内で解決される場合にのみ許可されます。
- エラー: ファイルの欠落、解析エラー、循環参照に関する明確なメッセージを表示します。

---

_関連: [構成](/gateway/configuration) · [構成例](/gateway/configuration-examples) · [ドクター](/gateway/doctor)_







