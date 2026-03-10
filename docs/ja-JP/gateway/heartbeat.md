---
summary: "ハートビートポーリングメッセージと通知ルール"
read_when:
  - ハートビートのリズムまたはメッセージングの調整
  - スケジュールされたタスクのハートビートと cron のどちらを選択するかを決定する
title: "ハートビート"
x-i18n:
  source_hash: "29de61b55ca96a6fd475be46a8e34022383d3622cfed749ade7a4e07d967149f"
---

# ハートビート (ゲートウェイ)

> **ハートビートと Cron?** それぞれをいつ使用するかに関するガイダンスについては、[Cron vs ハートビート](/automation/cron-vs-heartbeat) を参照してください。

ハートビートはメイン セッションで **定期的なエージェント ターン**を実行するため、モデルは
スパムを送信することなく、注意が必要なものを表面化します。

トラブルシューティング: [/automation/troubleshooting](/automation/troubleshooting)

## クイックスタート (初心者向け)

1. ハートビートを有効のままにするか (デフォルトは `30m`、または Anthropic OAuth/setup-token の場合は `1h`)、独自の頻度を設定します。
2. エージェント ワークスペースに小さな `HEARTBEAT.md` チェックリストを作成します (オプションですが推奨)。
3. ハートビート メッセージの送信先を決定します (`target: "none"` がデフォルトです。最後の連絡先にルーティングするように `target: "last"` を設定します)。
4. オプション: 透明性を確保するためにハートビート推論配信を有効にします。
5. オプション: ハートビートの実行に `HEARTBEAT.md` のみが必要な場合は、軽量ブートストラップ コンテキストを使用します。
6. オプション: ハートビートをアクティブな時間 (現地時間) に制限します。

設定例:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // explicit delivery to last contact (default is "none")
        directPolicy: "allow", // default: allow direct/DM targets; set "block" to suppress
        lightContext: true, // optional: only inject HEARTBEAT.md from bootstrap files
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // optional: send separate `Reasoning:` message too
      },
    },
  },
}
```

## デフォルト- 間隔: `30m` (または Anthropic OAuth/setup-token が検出された認証モードの場合は `1h`)。 `agents.defaults.heartbeat.every` またはエージェントごとの `agents.list[].heartbeat.every` を設定します。無効にするには `0m` を使用してください

- プロンプト本文 (`agents.defaults.heartbeat.prompt` 経由で構成可能):
  `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- ハートビート プロンプトはユーザー メッセージとして**そのまま**送信されます。システム
  プロンプトには「ハートビート」セクションが含まれており、実行には内部的にフラグが立てられます。
- アクティブ時間 (`heartbeat.activeHours`) は、構成されたタイムゾーンでチェックされます。
  ウィンドウの外側では、ウィンドウ内の次のティックまでハートビートがスキップされます。

## ハートビート プロンプトの目的

デフォルトのプロンプトは意図的に幅広くなっています。

- **バックグラウンド タスク**: 「未処理のタスクを検討する」は、エージェントにレビューを促します。
  フォローアップ (受信箱、カレンダー、リマインダー、キューにある仕事) を行い、緊急なものを明らかにします。
- **人間のチェックイン**: 「日中、時々人間をチェックしてください」
  時々軽い「何か必要なものはありますか？」メッセージを送信しますが、夜間のスパムを回避します
  構成されたローカル タイムゾーンを使用します ([/concepts/timezone](/concepts/timezone) を参照)。

ハートビートに非常に具体的なことを実行させたい場合 (例: 「Gmail PubSub をチェックする」)
統計」または「ゲートウェイの健全性の確認」)、`agents.defaults.heartbeat.prompt` (または
`agents.list[].heartbeat.prompt`) をカスタム本文に送信します (そのまま送信)。

## 応答コントラクト- 特に注意する必要がない場合は、**`HEARTBEAT_OK`** と返信してください

- ハートビートの実行中、OpenClaw は `HEARTBEAT_OK` が表示されたときにそれを ack として扱います。
  返信の**開始または終了**。トークンが取り除かれ、応答は次のようになります。
  残りのコンテンツが **≤ `ackMaxChars`** (デフォルト: 300) の場合は削除されます。
- `HEARTBEAT_OK` が応答の**途中**にある場合、それは処理されません
  特に。
- アラートの場合は、**`HEARTBEAT_OK` を含めないでください**。警告テキストのみを返します。

ハートビート外では、メッセージの開始/終了にある浮遊 `HEARTBEAT_OK` が削除されます。
そしてログに記録されました。 `HEARTBEAT_OK` のみのメッセージは削除されます。

## 構成

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // default: 30m (0m disables)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // default: false (deliver separate Reasoning: message when available)
        lightContext: false, // default: false; true keeps only HEARTBEAT.md from workspace bootstrap files
        target: "last", // default: none | options: last | none | <channel id> (core or plugin, e.g. "bluebubbles")
        to: "+15551234567", // optional channel-specific override
        accountId: "ops-bot", // optional multi-account channel id
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // max chars allowed after HEARTBEAT_OK
      },
    },
  },
}
```

### 範囲と優先順位

- `agents.defaults.heartbeat` は、グローバルなハートビート動作を設定します。
- `agents.list[].heartbeat` が上にマージされます。いずれかのエージェントに `heartbeat` ブロックがある場合、**それらのエージェントのみ** がハートビートを実行します。
- `channels.defaults.heartbeat` は、すべてのチャネルの可視性のデフォルトを設定します。
- `channels.<channel>.heartbeat` はチャネルのデフォルトをオーバーライドします。
- `channels.<channel>.accounts.<id>.heartbeat` (マルチアカウント チャネル) はチャネルごとの設定をオーバーライドします。

### エージェントごとのハートビート

`agents.list[]` エントリに `heartbeat` ブロックが含まれる場合、**それらのエージェントのみ**
心拍数を動かします。エージェントごとのブロックは `agents.defaults.heartbeat` の上にマージされます
(そのため、共有デフォルトを一度設定すれば、エージェントごとに上書きできます)。

例: 2 つのエージェントがあり、2 番目のエージェントのみがハートビートを実行します。

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // explicit delivery to last contact (default is "none")
      },
    },
    list: [
      { id: "main", default: true },
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "whatsapp",
          to: "+15551234567",
          prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        },
      },
    ],
  },
}
```

### アクティブ時間の例ハートビートを特定のタイムゾーンの営業時間に制限します

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // explicit delivery to last contact (default is "none")
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "America/New_York", // optional; uses your userTimezone if set, otherwise host tz
        },
      },
    },
  },
}
```

この時間帯の外（東部時間の午前 9 時前または午後 10 時以降）では、心拍はスキップされます。ウィンドウ内で次にスケジュールされたティックは通常どおり実行されます。

### 年中無休のセットアップ

ハートビートを 1 日中実行したい場合は、次のいずれかのパターンを使用します。

- `activeHours` を完全に省略します (時間枠の制限はありません。これがデフォルトの動作です)。
- 終日ウィンドウを設定します: `activeHours: { start: "00:00", end: "24:00" }`。

同じ `start` と `end` 時間を設定しないでください (たとえば、`08:00` から `08:00`)。
これは幅ゼロのウィンドウとして扱われるため、ハートビートは常にスキップされます。

### マルチアカウントの例

Telegram などのマルチアカウント チャネルで特定のアカウントをターゲットにするには、`accountId` を使用します。

```json5
{
  agents: {
    list: [
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "telegram",
          to: "12345678:topic:42", // optional: route to a specific topic/thread
          accountId: "ops-bot",
        },
      },
    ],
  },
  channels: {
    telegram: {
      accounts: {
        "ops-bot": { botToken: "YOUR_TELEGRAM_BOT_TOKEN" },
      },
    },
  },
}
```

### フィールドノート- `every`: ハートビート間隔 (期間文字列、デフォルト単位 = 分)

- `model`: ハートビート実行用のオプションのモデル オーバーライド (`provider/model`)。
- `includeReasoning`: 有効にすると、利用可能な場合は別の `Reasoning:` メッセージも配信されます (`/reasoning on` と同じ形式)。
- `lightContext`: true の場合、ハートビートの実行では軽量ブートストラップ コンテキストが使用され、ワー​​クスペース ブートストラップ ファイルから `HEARTBEAT.md` のみが保持されます。
- `session`: ハートビート実行用のオプションのセッション キー。
  - `main` (デフォルト): エージェントのメインセッション。
  - 明示的なセッション キー (`openclaw sessions --json` または [セッション CLI](/cli/sessions) からコピー)。
  - セッションキーの形式: [セッション](/concepts/session) および [グループ](/channels/groups) を参照してください。
- `target`:
  - `last`: 最後に使用された外部チャネルに配信します。
  - 明示的チャネル: `whatsapp` / `telegram` / `discord` / `googlechat` / `slack` / `msteams` / `signal` / `imessage`。
  - `none` (デフォルト): ハートビートを実行しますが、**外部には配信しません**。
- `directPolicy`: 直接/DM 配信動作を制御します。
  - `allow` (デフォルト): 直接/DM ハートビート配信を許可します。
  - `block`: 直接/DM 配信を抑制します (`reason=dm-blocked`)。- `to`: オプションの受信者オーバーライド (チャネル固有の ID、例: WhatsApp の E.164 または Telegram チャット ID)。 Telegram トピック/スレッドの場合は、`<chatId>:topic:<messageThreadId>` を使用します。
- `accountId`: マルチアカウント チャネルのオプションのアカウント ID。 `target: "last"` の場合、アカウントがサポートされている場合、アカウント ID は解決された最後のチャネルに適用されます。それ以外の場合は無視されます。アカウント ID が解決されたチャネルの設定済みアカウントと一致しない場合、配信はスキップされます。
- `prompt`: デフォルトのプロンプト本文をオーバーライドします (マージされていません)。
- `ackMaxChars`: `HEARTBEAT_OK` 以降、配信前に許可される最大文字数。
- `suppressToolErrorWarnings`: true の場合、ハートビートの実行中にツール エラー警告ペイロードが抑制されます。
- `activeHours`: ハートビートの実行を時間枠に制限します。 `start` (HH:MM を含む。一日の始まりには `00:00` を使用)、`end` (HH:MM のみ。一日の終わりには `24:00` を使用可能)、およびオプションの `timezone` を含むオブジェクト。
  - 省略または `"user"`: 設定されている場合は `agents.defaults.userTimezone` を使用し、設定されていない場合はホスト システムのタイムゾーンに戻ります。
  - `"local"`: 常にホスト システムのタイムゾーンを使用します。
  - 任意の IANA 識別子 (例: `America/New_York`): 直接使用されます。無効な場合は、上記の `"user"` の動作に戻ります。- `start` と `end` は、アクティブなウィンドウでは等しくない必要があります。等しい値はゼロ幅として扱われます (常にウィンドウの外側にあります)。
  - アクティブなウィンドウの外側では、ハートビートはウィンドウ内の次のティックまでスキップされます。

## 配信動作

- ハートビートはデフォルトでエージェントのメインセッションで実行されます (`agent:<id>:<mainKey>`)。
  または `session.scope = "global"` の場合は `global`。 `session` を設定して、
  特定のチャネルセッション (Discord/WhatsApp/など)。
- `session` は実行コンテキストにのみ影響します。配信は `target` および `to` によって制御されます。
- 特定のチャネル/受信者に配信するには、`target` + `to` を設定します。と
  `target: "last"`、配信にはそのセッションの最後の外部チャネルが使用されます。
- ハートビート配信では、デフォルトで直接/DM ターゲットが許可されます。 `directPolicy: "block"` を設定すると、ハートビート ターンの実行中に直接ターゲットの送信が抑制されます。
- メインキューがビジーの場合、ハートビートはスキップされ、後で再試行されます。
- `target` が外部宛先に解決されない場合でも、実行は行われますが、
  アウトバウンドメッセージが送信されます。
- ハートビートのみの応答はセッションを維持しません\*\*。最後の `updatedAt`
  が復元されるため、アイドル状態の有効期限は正常に動作します。

## 可視性コントロールデフォルトでは、アラートの内容が表示されている間、`HEARTBEAT_OK` 確認応答は抑制されます

届けられた。これはチャンネルごとまたはアカウントごとに調整できます。

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # Hide HEARTBEAT_OK (default)
      showAlerts: true # Show alert messages (default)
      useIndicator: true # Emit indicator events (default)
  telegram:
    heartbeat:
      showOk: true # Show OK acknowledgments on Telegram
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # Suppress alert delivery for this account
```

優先順位: アカウントごと → チャネルごと → チャネルのデフォルト → 組み込みのデフォルト。

### 各フラグの機能

- `showOk`: モデルが OK のみの応答を返した場合、`HEARTBEAT_OK` 確認応答を送信します。
- `showAlerts`: モデルが非 OK 応答を返したときにアラート コンテンツを送信します。
- `useIndicator`: UI ステータス サーフェスのインジケーター イベントを発行します。

**3 つ**すべてが false の場合、OpenClaw はハートビートの実行を完全にスキップします (モデル呼び出しなし)。

### チャネルごととアカウントごとの例

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false
      showAlerts: true
      useIndicator: true
  slack:
    heartbeat:
      showOk: true # all Slack accounts
    accounts:
      ops:
        heartbeat:
          showAlerts: false # suppress alerts for the ops account only
  telegram:
    heartbeat:
      showOk: true
```

### 一般的なパターン

| 目標                                                | 構成                                                                                     |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| デフォルトの動作 (サイレント OK、アラート オン)     | _(構成は必要ありません)_                                                                 |
| 完全にサイレント (メッセージなし、インジケータなし) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| インジケーターのみ (メッセージなし)                 | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| 1 つのチャンネルのみで OK                           | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (オプション)`HEARTBEAT.md` ファイルがワークスペースに存在する場合、デフォルトのプロンプトによって次のメッセージが表示されます

エージェントがそれを読んでくれます。これを「心拍チェックリスト」と考えてください。小さく、安定しており、
30 分ごとに含めるのが安全です。

`HEARTBEAT.md` は存在するが、事実上空である場合 (空行とマークダウンのみ)
`# Heading` のようなヘッダー）、OpenClaw は API 呼び出しを保存するためにハートビートの実行をスキップします。
ファイルが見つからない場合でも、ハートビートは実行され、モデルが何をすべきかを決定します。

すぐに肥大化してしまわないように、小さなもの (短いチェックリストやリマインダー) に保ちます。

例 `HEARTBEAT.md`:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it’s daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### エージェントは HEARTBEAT.md を更新できますか?

はい、あなたがそうするように求めれば。

`HEARTBEAT.md` はエージェント ワークスペース内の通常のファイルであるため、
エージェント (通常のチャットで) 次のようなもの:

- 「`HEARTBEAT.md` を更新して、毎日のカレンダー チェックを追加します。」
- 「`HEARTBEAT.md` を書き直して、より短く、受信トレイのフォローアップに重点を置きます。」

これを積極的に実行したい場合は、次の行を明示的に含めることもできます。
ハートビートプロンプトは次のようになります。「チェックリストが古くなった場合は、HEARTBEAT.md を更新してください」
より良いものを。」

安全上の注意: シークレット (API キー、電話番号、プライベート トークン) を入力しないでください。
`HEARTBEAT.md` — プロンプト コンテキストの一部になります。

## 手動ウェイクアップ (オンデマンド)

次のコマンドを使用して、システム イベントをキューに入れ、即時ハートビートをトリガーできます。

````bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```複数のエージェントに `heartbeat` が構成されている場合、手動ウェイクアップはそれぞれのエージェントで実行されます。
エージェントのハートビートがすぐに発生します。

`--mode next-heartbeat` を使用して、次にスケジュールされたティックを待ちます。

## 推論の配信 (オプション)

デフォルトでは、ハートビートは最終的な「応答」ペイロードのみを配信します。

透明性が必要な場合は、次を有効にします。

- `agents.defaults.heartbeat.includeReasoning: true`

有効にすると、ハートビートはプレフィックスが付いた別のメッセージも配信します。
`Reasoning:` (`/reasoning on` と同じ形状)。これは、エージェントが
複数のセッション/コーデックスを管理しており、なぜ ping を実行することになったのかを確認したいと考えています。
しかし、必要以上に内部の詳細が漏洩する可能性もあります。そのままにしておきたい
グループチャットではオフです。

## コスト意識

ハートビートはエージェントのフル ターンを実行します。間隔が短いほど、より多くのトークンが消費されます。キープする
`HEARTBEAT.md` が小さいため、次の場合はより安価な `model` または `target: "none"` を検討してください。
内部状態の更新のみが必要です。
````
