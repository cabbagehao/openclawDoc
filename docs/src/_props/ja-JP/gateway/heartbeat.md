---
summary: "ハートビートによる定期メッセージと通知のルール"
read_when:
  - ハートビートの頻度やメッセージ内容を調整したい場合
  - 定期実行タスクにおいて、ハートビートと Cron のどちらを使うべきか判断したい場合
title: "ハートビート"
x-i18n:
  source_hash: "29de61b55ca96a6fd475be46a8e34022383d3622cfed749ade7a4e07d967149f"
---

# ハートビート (ゲートウェイ)

> **ハートビートと Cron の違いは？** 使い分けのガイドについては、[Cron vs ハートビート](/automation/cron-vs-heartbeat) を参照してください。

ハートビートは、メインセッションにおいて **定期的なエージェントのターン** を実行する機能です。これにより、モデルはユーザーに頻繁に通知を送りすぎることなく、注意が必要な事項を自発的に表面化させることができます。

トラブルシューティング: [/automation/troubleshooting](/automation/troubleshooting)

## クイックスタート (初心者向け)

1. ハートビートを有効のままにする（デフォルトは `30m`、Anthropic OAuth/setup-token 利用時は `1h`）か、独自の頻度を設定します。
2. エージェントのワークスペースに、小さな `HEARTBEAT.md` チェックリストを作成します（オプションですが推奨）。
3. ハートビートメッセージの送信先を決定します（デフォルトは `target: "none"` です。最後に通信した相手に送る場合は `target: "last"` を設定します）。
4. オプション: 透明性を高めるため、ハートビート時の推論プロセス（Reasoning）の配信を有効にします。
5. オプション: ハートビートの実行に `HEARTBEAT.md` さえあれば十分な場合は、軽量なブートストラップコンテキストを使用します。
6. オプション: ハートビートの実行時間を、特定のアクティブな時間帯（現地時間）に制限します。

設定例:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // 最後に通信した相手にのみ配信 (デフォルトは "none")
        directPolicy: "allow", // デフォルト。直接の宛先への送信を許可。抑制する場合は "block"
        lightContext: true, // オプション。ブートストラップファイルのうち HEARTBEAT.md のみを注入
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // オプション。個別の `Reasoning:` メッセージも送信
      },
    },
  },
}
```

## デフォルト設定

* **間隔**: `30m` (Anthropic OAuth/setup-token が検知された場合は `1h`)。`agents.defaults.heartbeat.every` またはエージェントごとの `agents.list[].heartbeat.every` で設定します。無効にするには `0m` を指定します。
* **プロンプト本文** (`agents.defaults.heartbeat.prompt` で変更可能):
  `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
* ハートビートのプロンプトは、ユーザーメッセージとして **そのまま** 送信されます。システムプロンプトには「Heartbeat」セクションが含まれ、実行時には内部的にフラグが立てられます。
* **アクティブ時間** (`heartbeat.activeHours`) は、構成されたタイムゾーンでチェックされます。時間外の場合、ハートビートはスキップされ、時間内に入った後の最初のタイミングで実行されます。

## ハートビートプロンプトの目的

デフォルトのプロンプトは、意図的に幅広く定義されています:

* **バックグラウンドタスク**: 「未処理のタスクを検討してください」という指示により、エージェントにフォローアップ（受信トレイ、カレンダー、リマインダー、キューにある仕事）を確認させ、緊急性の高いものを報告させます。
* **人間への声掛け**: 「日中、時々ユーザーの様子を確認してください」という指示により、たまに「何か手伝うことはありますか？」といった軽い声掛けを行わせます。ただし、設定されたローカルタイムゾーンに基づき、夜間の通知連打を避けます（詳細は [/concepts/timezone](/concepts/timezone) を参照）。

特定のタスク（例: 「Gmail PubSub の統計をチェックする」「ゲートウェイの健全性を検証する」など）に特化させたい場合は、`agents.defaults.heartbeat.prompt` (またはエージェントごとの設定) にカスタムの本文を記述してください（そのまま送信されます）。

## 応答に関するルール

* 特に報告すべきことがない場合、モデルは **`HEARTBEAT_OK`** と返信します。
* ハートビート実行中、返信の **先頭または末尾** に `HEARTBEAT_OK` が含まれている場合、OpenClaw はそれを確認（ack）として扱います。トークンは除去され、残りの内容が **`ackMaxChars` 以下** (デフォルト 300 文字) であれば、その返信は配信されません。
* 返信の **途中** に `HEARTBEAT_OK` がある場合は、特別な処理は行われません。
* 通知（アラート）を送りたい場合は、`HEARTBEAT_OK` を **含めず**、通知内容のみを返してください。

ハートビート以外の通常の実行において、メッセージの先頭や末尾に浮遊している `HEARTBEAT_OK` は除去され、ログに記録されます。`HEARTBEAT_OK` のみのメッセージは破棄されます。

## 構成設定

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // デフォルト 30m (0m で無効)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // デフォルト false。有効なら Reasoning: メッセージを分離して配信
        lightContext: false, // デフォルト false。true なら HEARTBEAT.md のみを注入
        target: "last", // デフォルト none。last | none | <channel id>
        to: "+15551234567", // オプション。チャネル固有の宛先 ID
        accountId: "ops-bot", // オプション。マルチアカウント時のアカウント ID
        prompt: "...", // デフォルトプロンプトを上書き
        ackMaxChars: 300, // HEARTBEAT_OK 以外に許容される最大文字数
      },
    },
  },
}
```

### 適用範囲と優先順位

* `agents.defaults.heartbeat`: グローバルなハートビート動作を設定します。
* `agents.list[].heartbeat`: 上書き・マージされます。いずれかのエージェントに `heartbeat` ブロックがある場合、**それらのエージェントのみ** がハートビートを実行します。
* `channels.defaults.heartbeat`: すべてのチャネルにおける可視性のデフォルトを設定します。
* `channels.<channel>.heartbeat`: チャネルごとのデフォルトを上書きします。
* `channels.<channel>.accounts.<id>.heartbeat`: 特定のアカウントの設定を上書きします。

### エージェントごとのハートビート

`agents.list[]` のエントリに `heartbeat` ブロックが含まれている場合、**そのエージェントだけ** がハートビートを実行するようになります。エージェントごとのブロックは `agents.defaults.heartbeat` の上にマージされます（共通のデフォルトを一度設定し、エージェントごとに微調整することが可能です）。

例: 2 つのエージェントがあり、2 番目のエージェントのみがハートビートを実行する設定。

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last",
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
          prompt: "...",
        },
      },
    ],
  },
}
```

### アクティブ時間（Active Hours）の例

特定のタイムゾーンの営業時間内にのみハートビートを制限します:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last",
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "Asia/Tokyo", // オプション。userTimezone があればそれを使用、なければホスト tz
        },
      },
    },
  },
}
```

この時間外（午前 9 時前、または午後 10 時以降）では、ハートビートはスキップされます。時間内に入った後の最初のスケジュールタイミングで通常通り実行されます。

### 24時間 365日の設定

常にハートビートを実行したい場合は、以下のいずれかのパターンを使用してください:

* `activeHours` を完全に省略する（デフォルトの挙動。時間制限なし）。
* 終日のウィンドウを設定する: `activeHours: { start: "00:00", end: "24:00" }`。

開始と終了に同じ時刻を設定しないでください（例: `08:00` から `08:00`）。これは幅ゼロのウィンドウとみなされ、常に時間外として扱われます。

### マルチアカウントの例

Telegram などのマルチアカウント対応チャネルで、特定のアカウントを対象にする場合:

```json5
{
  agents: {
    list: [
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "telegram",
          to: "12345678:topic:42", // オプション。特定のトピック/スレッドへルーティング
          accountId: "ops-bot",
        },
      },
    ],
  },
  channels: {
    telegram: {
      accounts: {
        "ops-bot": { botToken: "YOUR_TOKEN" },
      },
    },
  },
}
```

### フィールドに関する補足

* `every`: ハートビートの間隔（期間を表す文字列。デフォルトの単位は分）。
* `model`: ハートビート実行時に使用するモデルの上書き (`provider/model`)。
* `includeReasoning`: 有効な場合、推論プロセスがあれば個別の `Reasoning:` メッセージとして配信します (`/reasoning on` と同様の形式)。
* `lightContext`: true の場合、ブートストラップコンテキストから `HEARTBEAT.md` のみを保持し、軽量なプロンプトで実行します。
* `session`: ハートビート実行に使用するセッションキー。
  * `main` (デフォルト): エージェントのメインセッション。
  * 明示的なセッションキー（`openclaw sessions --json` 等からコピー）。形式の詳細は [セッション](/concepts/session) を参照。
* `target`:
  * `last`: 最後に使用された外部チャネルに配信。
  * 明示的なチャネル指定: `whatsapp | telegram | discord | googlechat | slack | msteams | signal | imessage`。
  * `none` (デフォルト): ハートビートは実行するが、外部への **配信は行わない**。
* `directPolicy`: 直接/DM 宛の配信挙動を制御します:
  * `allow` (デフォルト): 直接宛先への配信を許可。
  * `block`: 直接宛先への配信を抑制 (`reason=dm-blocked`)。
* `to`: 宛先の上書き（チャネル固有の ID。WhatsApp なら E.164、Telegram ならチャット ID など）。Telegram のトピック/スレッドの場合は `<chatId>:topic:<messageThreadId>` を使用。
* `accountId`: マルチアカウントチャネルにおけるアカウント ID。`target: "last"` の場合、解決された最後のチャネルがアカウントに対応していれば適用されます。一致するアカウントがない場合、配信はスキップされます。
* `prompt`: デフォルトのプロンプト本文を上書きします（マージされません）。
* `ackMaxChars`: `HEARTBEAT_OK` が返された際、配信を許可する最大文字数。
* `suppressToolErrorWarnings`: true の場合、ハートビート実行中のツールエラーの警告を抑制します。
* `activeHours`: ハートビートを実行する時間枠を制限します。`start` (HH:MM, 指定時刻を含む。1日の始まりは `00:00`), `end` (HH:MM, 指定時刻を含まない。1日の終わりは `24:00` が指定可能), およびオプションの `timezone` を持つオブジェクト。
  * 未設定または `"user"`: `agents.defaults.userTimezone` があればそれを使用し、なければホストのタイムゾーンを使用。
  * `"local"`: 常にホストのタイムゾーンを使用。
  * IANA タイムゾーン識別子（例: `Asia/Tokyo`）: 直接使用されます。無効な場合は上記の `"user"` の挙動にフォールバックします。
  * アクティブなウィンドウとするには、`start` と `end` が異なる必要があります。同じ値は幅ゼロ（常に時間外）とみなされます。

## 配信の挙動

* ハートビートは、デフォルトでエージェントのメインセッション (`agent:<id>:<mainKey>`)、あるいは `session.scope = "global"` の場合は `global` で実行されます。特定のチャネルセッション（Discord/WhatsApp など）で実行したい場合は `session` を設定してください。
* `session` は実行コンテキスト（履歴など）にのみ影響し、どこに配信するかは `target` と `to` で制御されます。
* `target: "last"` の場合、そのセッションで最後に使われた外部チャネルが配信先となります。
* ハートビートの配信は、デフォルトで直接/DM ターゲットを許可しています。ハートビートを実行しつつも直接ターゲットへの送信だけを控えたい場合は、`directPolicy: "block"` を設定してください。
* メインキューが混雑している場合、ハートビートはスキップされ、後で再試行されます。
* `target` が外部の宛先に解決されない場合、実行は行われますが、外部へのメッセージ送信は行われません。
* ハートビートのみの返信（OK 応答など）によって **セッションが「アクティブ」に維持されることはありません**。最終更新日時 (`updatedAt`) が復元されるため、アイドルの期限切れ判定は通常通り機能します。

## 可視性の制御

デフォルトでは、異常（Alert）がある場合には配信され、`HEARTBEAT_OK` のみの場合は配信が抑制されます。これはチャネルごと、あるいはアカウントごとに調整可能です:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # HEARTBEAT_OK を隠す (デフォルト)
      showAlerts: true # アラート内容を表示する (デフォルト)
      useIndicator: true # UI 上のインジケーターイベントを発行する (デフォルト)
  telegram:
    heartbeat:
      showOk: true # Telegram では OK 時も通知する
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # このアカウントではアラート配信を抑制する
```

優先順位: アカウント設定 → チャネル設定 → チャネル既定値 → 組み込みの既定値。

### 各フラグの役割

* `showOk`: モデルが OK 応答のみを返した場合に、`HEARTBEAT_OK` の確認通知を送ります。
* `showAlerts`: モデルが OK 以外の応答を返した場合に、その通知内容を送ります。
* `useIndicator`: UI 上のステータス表示用のインジケーターイベントを発行します。

**3つすべて** が false の場合、OpenClaw はハートビートの実行自体をスキップします（モデルの呼び出しは行われません）。

### 一般的なパターン

| 目標                           | 設定                                                                                       |
| :--------------------------- | :--------------------------------------------------------------------------------------- |
| デフォルトの挙動 (OK は黙殺、アラートは通知)    | (設定不要)                                                                                   |
| 完全に静かにする (メッセージなし、インジケーターなし) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| インジケーターのみ (メッセージは送らない)       | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| 特定のチャネルでのみ OK 通知も出す          | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (オプション)

ワークスペースに `HEARTBEAT.md` ファイルが存在する場合、デフォルトのプロンプトはその内容を読むようモデルに指示します。これを 30 分おきにチェックされる「ハートビート用チェックリスト」として活用してください。

`HEARTBEAT.md` が存在していても、実質的に空（空行や Markdown のヘッダー `# Heading` のみ）である場合、OpenClaw は API 呼び出しを節約するためにハートビートの実行をスキップします。ファイルが存在しない場合は実行が継続され、モデルが自身で判断して行動します。

プロンプトの肥大化を避けるため、内容は最小限（短いチェックリストやリマインダー）に留めてください。

例 `HEARTBEAT.md`:

```md
# ハートビート・チェックリスト

- クイックスキャン: 受信トレイに緊急の件はありませんか？
- 日中であれば、特に予定がなくても軽い生存確認を行ってください。
- タスクが停滞している場合は「何が足りないか」を書き留め、次回ピーターに確認してください。
```

### エージェントは HEARTBEAT.md を更新できますか？

はい、指示すれば可能です。

`HEARTBEAT.md` はワークスペース内の通常のファイルであるため、通常のチャットで以下のように指示できます:

* 「毎日のカレンダーチェックを行うように `HEARTBEAT.md` を更新して。」
* 「`HEARTBEAT.md` を、受信トレイのフォローアップに重点を置いた短い内容に書き換えて。」

また、ハートビートプロンプト自体に「チェックリストが古くなっていたら、より良い内容に `HEARTBEAT.md` を更新してください」といった指示を含めることで、自発的な更新を促すことも可能です。

安全上の注意: `HEARTBEAT.md` にシークレット（API キー、電話番号、プライベートトークンなど）を記述しないでください。これらはプロンプトの一部としてモデルに送信されます。

## 手動ウェイクアップ (オンデマンド実行)

システムイベントを投入することで、即座にハートビートをトリガーできます:

```bash
openclaw system event --text "緊急のフォローアップをチェックして" --mode now
```

複数のエージェントにハートビートが設定されている場合、手動ウェイクアップはそれぞれのエージェントのハートビートを即座に実行します。

次の定期スケジュールまで待ちたい場合は `--mode next-heartbeat` を使用してください。

## 推論プロセス（Reasoning）の配信 (オプション)

デフォルトでは、ハートビートは最終的な「回答」のみを配信します。

動作の透明性を高めたい場合は、以下を有効にしてください:

* `agents.defaults.heartbeat.includeReasoning: true`

これを有効にすると、ハートビート実行時に `Reasoning:` 接頭辞が付いた個別のメッセージも配信されます（`/reasoning on` と同様の形式）。エージェントが複数のセッションやタスクを管理している際に、なぜあなたに通知を送る決断をしたのかを確認するのに役立ちます。ただし、内部の詳細が意図せず漏れる可能性もあるため、グループチャットなどではオフにしておくことを推奨します。

## コストに関する注意

ハートビートはエージェントのフルターン（1回の実行）を消費します。間隔を短くするほどトークンの消費量が増えます。`HEARTBEAT.md` は小さく保ち、内部状態の更新のみが必要な場合は安価な `model` を指定するか、`target: "none"` を検討してください。
