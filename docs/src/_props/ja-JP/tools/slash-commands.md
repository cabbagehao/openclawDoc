---
summary: "スラッシュ コマンド: テキスト vs ネイティブ、config、およびサポートされているコマンド"
read_when:
  - チャットコマンドの使用または設定
  - コマンドのルーティングまたは権限のデバッグ
title: "スラッシュコマンド"
x-i18n:
  source_hash: "8984ad71f46812ed87708e8ff3b6fbfe0d09d74e052af8d7591c4f02505f7700"
---

# スラッシュコマンド

コマンドはゲートウェイによって処理されます。ほとんどのコマンドは、`/` で始まる **スタンドアロン** メッセージとして送信する必要があります。
ホスト専用 bash チャット コマンドは、`! <cmd>` (エイリアスとして `/bash <cmd>` を使用) を使用します。

関連するシステムが 2 つあります。

* **コマンド**: スタンドアロン `/...` メッセージ。
* **ディレクティブ**: `/think`、`/verbose`、`/reasoning`、`/elevated`、`/exec`、`/model`、`/queue`。
  * ディレクティブは、モデルがメッセージを認識する前にメッセージから削除されます。
  * 通常のチャット メッセージ (ディレクティブのみではない) では、「インライン ヒント」として扱われ、セッション設定は**永続されません**。
  * ディレクティブのみのメッセージ (メッセージにディレクティブのみが含まれる) では、メッセージはセッションに存続し、確認応答で応答します。
  * ディレクティブは **承認された送信者** にのみ適用されます。 `commands.allowFrom` が設定されている場合、それが唯一の
    ホワイトリストが使用されました。それ以外の場合、承認はチャネル許可リスト/ペアリングに加えて `commands.useAccessGroups` から取得されます。
    許可されていない送信者には、ディレクティブがプレーン テキストとして扱われるのが見えます。

また、**インライン ショートカット** (許可リストに登録されている/承認された送信者のみ) もいくつかあります: `/help`、`/commands`、`/status`、`/whoami` (`/id`)。
これらはすぐに実行され、モデルがメッセージを認識する前に削除され、残りのテキストは通常​​のフローを継続します。

## 構成

```json5
{
  commands: {
    native: "auto",
    nativeSkills: "auto",
    text: true,
    bash: false,
    bashForegroundMs: 2000,
    config: false,
    debug: false,
    restart: false,
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

* `commands.text` (デフォルト `true`) は、チャット メッセージ内の `/...` の解析を有効にします。
  * ネイティブ コマンドのないサーフェス (WhatsApp/WebChat/Signal/iMessage/Google Chat/MS Teams) では、これを `false` に設定した場合でも、テキスト コマンドは引き続き機能します。
* `commands.native` (デフォルト `"auto"`) はネイティブ コマンドを登録します。
  * 自動: Discord/Telegram の場合はオン。 Slack ではオフ (スラッシュ コマンドを追加するまで)。ネイティブサポートのないプロバイダーの場合は無視されます。
  * プロバイダーごとにオーバーライドするように `channels.discord.commands.native`、`channels.telegram.commands.native`、または `channels.slack.commands.native` を設定します (ブール値または `"auto"`)。
  * `false` は、起動時に Discord/Telegram に以前に登録されたコマンドをクリアします。 Slack コマンドは Slack アプリで管理され、自動的には削除されません。
* `commands.nativeSkills` (デフォルト `"auto"`) は、サポートされている場合、**skill** コマンドをネイティブに登録します。
  * 自動: Discord/Telegram の場合はオン。 Slack ではオフ (Slack ではスキルごとにスラッシュ コマンドを作成する必要があります)。
  * プロバイダーごとにオーバーライドするように `channels.discord.commands.nativeSkills`、`channels.telegram.commands.nativeSkills`、または `channels.slack.commands.nativeSkills` を設定します (ブール値または `"auto"`)。
* `commands.bash` (デフォルト `false`) により、`! <cmd>` がホスト シェル コマンドを実行できるようになります (`/bash <cmd>` はエイリアスであり、`tools.elevated` ホワイトリストが必要です)。
* `commands.bashForegroundMs` (デフォルト `2000`) は、bash がバックグラウンド モードに切り替わるまでの待機時間を制御します (`0` はすぐにバックグラウンドになります)。- `commands.config` (デフォルト `false`) は、`/config` (`openclaw.json` の読み取り/書き込み) を有効にします。
* `commands.debug` (デフォルト `false`) は、`/debug` (ランタイムのみの上書き) を有効にします。
* `commands.allowFrom` (オプション) コマンド認可のためのプロバイダーごとの許可リストを設定します。設定すると、
  コマンドおよびディレクティブの唯一の認可ソース (チャネル許可リスト/ペアリングおよび `commands.useAccessGroups`)
  無視されます)。グローバルなデフォルトには `"*"` を使用します。プロバイダー固有のキーはそれをオーバーライドします。
* `commands.useAccessGroups` (デフォルト `true`) は、`commands.allowFrom` が設定されていない場合にコマンドの許可リスト/ポリシーを強制します。

## コマンドリスト

テキスト + ネイティブ (有効な場合):- `/help`

* `/commands`
* `/skill <name> [input]` (名前でスキルを実行)
* `/status` (現在のステータスを表示します。利用可能な場合は、現在のモデル プロバイダーのプロバイダーの使用状況/割り当てが含まれます)
* `/allowlist` (許可リスト エントリの一覧表示/追加/削除)
* `/approve <id> allow-once|allow-always|deny` (実行承認プロンプトを解決)
* `/context [list|detail|json]` (「コンテキスト」について説明します。`detail` はファイルごと + ツールごと + スキルごと + システム プロンプト サイズを示します)
* `/export-session [path]` (エイリアス: `/export`) (完全なシステム プロンプトを使用して現在のセッションを HTML にエクスポートします)
* `/whoami` (送信者 ID を表示します。エイリアス: `/id`)
* `/session idle <duration|off>` (フォーカスされたスレッド バインディングの非アクティブな自動フォーカス解除を管理)
* `/session max-age <duration|off>` (フォーカスされたスレッド バインディングのハード マックスエイジ自動フォーカス解除を管理)
* `/subagents list|kill|log|info|send|steer|spawn` (現在のセッションのサブエージェント実行を検査、制御、または生成)
* `/acp spawn|cancel|steer|close|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|sessions` (ACP ランタイム セッションの検査と制御)
* `/agents` (このセッションのスレッドバインドされたエージェントのリスト)
* `/focus <target>` (Discord: このスレッドまたは新しいスレッドをセッション/サブエージェント ターゲットにバインドします)
* `/unfocus` (Discord: 現在のスレッド バインディングを削除します)
* `/kill <id|#|all>` (このセッションで実行中の 1 つまたはすべてのサブエージェントを即時に中止します。確認メッセージは表示されません)
* `/steer <id|#> <message>` (実行中のサブエージェントを直ちに操作します。可能な場合は実行中、それ以外の場合は現在の作業を中止し、操作メッセージで再開します)- `/tell <id|#> <message>` (`/steer` のエイリアス)
* `/config show|get|set|unset` (設定をディスクに保存、所有者のみ。`commands.config: true` が必要)
* `/debug show|set|unset|reset` (実行時オーバーライド、所有者のみ。`commands.debug: true` が必要)
* `/usage off|tokens|full|cost` (応答ごとの使用量フッターまたはローカルコスト概要)
* `/tts off|always|inbound|tagged|status|provider|limit|summary|audio` (TTS の制御。[/tts](/tts) を参照)
  * Discord: ネイティブ コマンドは `/voice` です (Discord は `/tts` を予約しています)。テキスト `/tts` は引き続き機能します。
* `/stop`
* `/restart`
* `/dock-telegram` (エイリアス: `/dock_telegram`) (返信をテレグラムに切り替える)
* `/dock-discord` (エイリアス: `/dock_discord`) (返信を Discord に切り替えます)
* `/dock-slack` (エイリアス: `/dock_slack`) (返信を Slack に切り替える)
* `/activation mention|always` (グループのみ)
* `/send on|off|inherit` (所有者のみ)
* `/reset` または `/new [model]` (オプションのモデル ヒント。残りはパススルーされます)
* `/think <off|minimal|low|medium|high|xhigh>` (モデル/プロバイダーによる動的選択、エイリアス: `/thinking`、`/t`)
* `/verbose on|full|off` (別名: `/v`)
* `/reasoning on|off|stream` (エイリアス: `/reason`; オンの場合、`Reasoning:` というプレフィックスが付いた別のメッセージを送信します。 `stream` = Telegramドラフトのみ)
* `/elevated on|off|ask|full` (エイリアス: `/elev`; `full` は幹部の承認をスキップします)
* `/exec host=<sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` (電流を表示するには `/exec` を送信)
* `/model <name>` (エイリアス: `/models`、または `agents.defaults.models.*.alias` からの `/<alias>`)- `/queue <mode>` (さらに `debounce:2s cap:25 drop:summarize` のようなオプション。現在の設定を確認するには `/queue` を送信してください)
* `/bash <command>` (ホストのみ。`! <command>` のエイリアス。`commands.bash: true` + `tools.elevated` 許可リストが必要)

テキストのみ:

* `/compact [instructions]` ([/concepts/compaction](/concepts/compaction) を参照)
* `! <command>` (ホストのみ。一度に 1 つずつ。長時間実行されるジョブには `!poll` + `!stop` を使用)
* `!poll` (出力/ステータスを確認します。オプションの `sessionId` を受け入れます。`/bash poll` も機能します)
* `!stop` (実行中の bash ジョブを停止します。オプションの `sessionId` を受け入れます。`/bash stop` も機能します)

注:- コマンドは、コマンドと引数の間にオプションの `:` を受け入れます (例: `/think: high`、`/send: on`、`/help:`)。

* `/new <model>` は、モデルの別名 `provider/model` またはプロバイダー名 (あいまい一致) を受け入れます。一致しない場合、テキストはメッセージ本文として扱われます。
* プロバイダーの使用状況の完全な内訳については、`openclaw status --usage` を使用してください。
* `/allowlist add|remove` は `commands.config=true` を必要とし、チャネル `configWrites` を優先します。
* `/usage` は、応答ごとの使用法フッターを制御します。 `/usage cost` は、OpenClaw セッション ログからローカル コストの概要を出力します。
* `/restart` はデフォルトで有効になっています。 `commands.restart: false` を設定して無効にします。
* Discord 専用のネイティブ コマンド: `/vc join|leave|status` は音声チャネルを制御します (`channels.discord.voice` とネイティブ コマンドが必要です。テキストとしては使用できません)。
* Discord スレッド バインディング コマンド (`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`) では、有効なスレッド バインディング (`session.threadBindings.enabled` および/または) が必要です。 `channels.discord.threadBindings.enabled`)。
* ACP コマンドのリファレンスと実行時の動作: [ACP エージェント](/tools/acp-agents)。
* `/verbose` は、デバッグと追加の可視性を目的としています。通常の使用では**オフ**にしてください。
* ツール障害の概要は関連する場合に引き続き表示されますが、詳細な障害テキストは、`/verbose` が `on` または `full` の場合にのみ含まれます。- `/reasoning` (および `/verbose`) はグループ設定では危険です。公開するつもりのなかった内部推論やツールの出力が明らかになる可能性があります。特にグループチャットでは、それらをオフのままにすることを好みます。
* **高速パス:** 許可リストに登録された送信者からのコマンドのみのメッセージはすぐに処理されます (バイパス キュー + モデル)。
* **グループ メンション ゲーティング:** 許可リストに登録された送信者からのコマンドのみのメッセージは、メンション要件をバイパスします。
* **インライン ショートカット (許可リストに登録された送信者のみ):** 特定のコマンドは、通常のメッセージに埋め込まれた場合にも機能し、モデルが残りのテキストを確認する前に削除されます。
  * 例: `hey /status` はステータス応答をトリガーし、残りのテキストは通常​​のフローを継続します。
* 現在: `/help`、`/commands`、`/status`、`/whoami` (`/id`)。
* 許可されていないコマンドのみのメッセージは警告なしに無視され、インライン `/...` トークンはプレーン テキストとして扱われます。
* **スキル コマンド:** `user-invocable` スキルはスラッシュ コマンドとして公開されます。名前は `a-z0-9_` (最大 32 文字) にサニタイズされます。衝突には数値サフィックスが付けられます (例: `_2`)。
  * `/skill <name> [input]` は名前でスキルを実行します (ネイティブ コマンドの制限によりスキルごとのコマンドが妨げられる場合に便利です)。
  * デフォルトでは、スキル コマンドは通常のリクエストとしてモデルに転送されます。- スキルはオプションで `command-dispatch: tool` を宣言して、コマンドをツールに直接ルーティングできます (決定的、モデルなし)。
  * 例: `/prose` (OpenProse プラグイン) — [OpenProse](/prose) を参照してください。
* **ネイティブ コマンド引数:** Discord は動的オプション (および必須の引数を省略した場合のボタン メニュー) にオートコンプリートを使用します。 Telegram と Slack では、コマンドが選択肢をサポートしていて引数を省略した場合、ボタン メニューが表示されます。

## 使用状況 (何がどこに表示されるか)

* **プロバイダーの使用状況/割り当て** (例: 「クロード 80% が残っています」) は、使用状況の追跡が有効になっている場合、現在のモデル プロバイダーの `/status` に表示されます。
* **応答ごとのトークン/コスト**は、`/usage off|tokens|full` (通常の応答に追加される) によって制御されます。
* `/model status` は、使用法ではなく、**モデル/認証/エンドポイント**に関するものです。

## モデルの選択 (`/model`)

`/model` はディレクティブとして実装されます。

例:

```
/model
/model list
/model 3
/model openai/gpt-5.2
/model opus@anthropic:default
/model status
```

注:

* `/model` および `/model list` は、コンパクトな番号付きピッカー (モデル ファミリ + 利用可能なプロバイダー) を示します。
* Discord では、`/model` と `/models` は、プロバイダーとモデルのドロップダウンと送信ステップを備えた対話型ピッカーを開きます。
* `/model <#>` はそのピッカーから選択します (可能な場合は現在のプロバイダーを優先します)。
* `/model status` には、構成されたプロバイダー エンドポイント (`baseUrl`) と API モード (`api`) (使用可能な場合) を含む詳細ビューが表示されます。## デバッグのオーバーライド

`/debug` を使用すると、**ランタイムのみ** 構成の上書き (ディスクではなくメモリ) を設定できます。所有者限定。デフォルトでは無効になっています。 `commands.debug: true` で有効にします。

例:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

注:

* オーバーライドは新しい構成の読み取りにすぐに適用されますが、`openclaw.json` への書き込みは**行われません**。
* `/debug reset` を使用してすべての上書きをクリアし、ディスク上の構成に戻します。

## 構成の更新

`/config` は、ディスク上の構成 (`openclaw.json`) に書き込みます。所有者限定。デフォルトでは無効になっています。 `commands.config: true` で有効にします。

例:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

注:

* 構成は書き込み前に検証されます。無効な変更は拒否されます。
* `/config` 更新は再起動後も維持されます。

## 表面のメモ- **テキスト コマンド**は通常のチャット セッションで実行されます (DM は `main` を共有し、グループは独自のセッションを持ちます)

* **ネイティブ コマンド**は分離セッションを使用します。
  * ディスコード: `agent:<agentId>:discord:slash:<userId>`
  * Slack: `agent:<agentId>:slack:slash:<userId>` (プレフィックスは `channels.slack.slashCommand.sessionPrefix` 経由で構成可能)
  * テレグラム: `telegram:slash:<userId>` (`CommandTargetSessionKey` 経由のチャット セッションをターゲットとします)
* **`/stop`** はアクティブなチャット セッションをターゲットにするため、現在の実行を中止できます。
* **Slack:** `channels.slack.slashCommand` は、単一の `/openclaw` スタイルのコマンドに対して引き続きサポートされています。 `commands.native` を有効にする場合は、組み込みコマンドごとに 1 つの Slack スラッシュ コマンド (`/help` と同じ名前) を作成する必要があります。 Slack のコマンド引数メニューは、一時的な Block Kit ボタンとして提供されます。
  * Slack ネイティブ例外: Slack は `/status` を予約しているため、`/agentstatus` (`/status` ではありません) を登録します。テキスト `/status` は Slack メッセージで引き続き機能します。
