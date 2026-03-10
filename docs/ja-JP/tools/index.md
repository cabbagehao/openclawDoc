---
summary: "従来の `openclaw-*` スキルを置き換える OpenClaw のエージェント ツール サーフェス (ブラウザ、キャンバス、ノード、メッセージ、cron)"
read_when:
  - エージェントツールの追加または変更
  - 「openclaw-*」スキルの廃止または変更
title: "ツール"
x-i18n:
  source_hash: "b8c722652fce4dcdb54acd752cf10ae0ac9de55873715a965703c5636d74f1b8"
---

# ツール (OpenClaw)

OpenClaw は、ブラウザ、キャンバス、ノード、および cron 用の **ファーストクラス エージェント ツール**を公開します。
これらは古い `openclaw-*` スキルを置き換えるものです。ツールは入力され、シェルは使用されません。
そしてエージェントはそれらを直接信頼する必要があります。

## ツールの無効化

`openclaw.json` の `tools.allow` / `tools.deny` を介してツールをグローバルに許可/拒否できます。
（勝利を否定）。これにより、許可されていないツールがモデル プロバイダーに送信されるのを防ぎます。

```json5
{
  tools: { deny: ["browser"] },
}
```

注:

- 照合では大文字と小文字が区別されません。
- `*` ワイルドカードがサポートされています (`"*"` はすべてのツールを意味します)。
- `tools.allow` が不明なプラグイン ツール名またはアンロードされたプラグイン ツール名のみを参照する場合、OpenClaw は警告をログに記録し、ホワイトリストを無視するため、コア ツールは利用可能なままになります。

## ツール プロファイル (基本ホワイトリスト)

`tools.profile` は、`tools.allow`/`tools.deny` の前に **基本ツール許可リスト** を設定します。
エージェントごとのオーバーライド: `agents.list[].tools.profile`。

プロフィール:

- `minimal`: `session_status` のみ
- `coding`: `group:fs`、`group:runtime`、`group:sessions`、`group:memory`、`image`
- `messaging`: `group:messaging`、`sessions_list`、`sessions_history`、`sessions_send`、`session_status`
- `full`: 制限なし (未設定と同じ)

例 (デフォルトではメッセージングのみ。Slack + Discord ツールも許可):

```json5
{
  tools: {
    profile: "messaging",
    allow: ["slack", "discord"],
  },
}
```

例 (プロファイルをコーディングしますが、どこでも実行/プロセスを拒否します):

````json5
{
  tools: {
    profile: "coding",
    deny: ["group:runtime"],
  },
}
```例 (グローバルコーディングプロファイル、メッセージングのみのサポートエージェント):

```json5
{
  tools: { profile: "coding" },
  agents: {
    list: [
      {
        id: "support",
        tools: { profile: "messaging", allow: ["slack"] },
      },
    ],
  },
}
````

## プロバイダー固有のツール ポリシー

`tools.byProvider` を使用して、特定のプロバイダー用のツールを**さらに制限**します
(または単一の `provider/model`) をグローバルなデフォルトを変更せずに実行できます。
エージェントごとのオーバーライド: `agents.list[].tools.byProvider`。

これは、基本ツール プロファイルの**後**、許可/拒否リストの**前**に適用されます。
したがって、ツールセットを絞り込むことしかできません。
プロバイダー キーは `provider` (例: `google-antigravity`) または
`provider/model` (例: `openai/gpt-5.2`)。

例 (グローバルコーディングプロファイルを維持しますが、Google Antigravity 用の最小限のツールを使用します):

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
    },
  },
}
```

例 (不安定なエンドポイントのプロバイダー/モデル固有の許可リスト):

```json5
{
  tools: {
    allow: ["group:fs", "group:runtime", "sessions_list"],
    byProvider: {
      "openai/gpt-5.2": { allow: ["group:fs", "sessions_list"] },
    },
  },
}
```

例 (単一プロバイダーのエージェント固有のオーバーライド):

```json5
{
  agents: {
    list: [
      {
        id: "support",
        tools: {
          byProvider: {
            "google-antigravity": { allow: ["message", "sessions_list"] },
          },
        },
      },
    ],
  },
}
```

## ツール グループ (省略表現)

ツール ポリシー (グローバル、エージェント、サンドボックス) は、複数のツールに拡張される `group:*` エントリをサポートします。
これらは `tools.allow` / `tools.deny` で使用します。

利用可能なグループ:- `group:runtime`: `exec`、`bash`、`process`

- `group:fs`: `read`、`write`、`edit`、`apply_patch`
- `group:sessions`: `sessions_list`、`sessions_history`、`sessions_send`、`sessions_spawn`、`session_status`
- `group:memory`: `memory_search`、`memory_get`
- `group:web`: `web_search`、`web_fetch`
- `group:ui`: `browser`、`canvas`
- `group:automation`: `cron`、`gateway`
- `group:messaging`: `message`
- `group:nodes`: `nodes`
- `group:openclaw`: すべての組み込み OpenClaw ツール (プロバイダー プラグインを除く)

例 (ファイル ツール + ブラウザのみを許可):

```json5
{
  tools: {
    allow: ["group:fs", "browser"],
  },
}
```

## プラグイン + ツール

プラグインは、コア セット以外の **追加ツール** (および CLI コマンド) を登録できます。
インストールと設定については [プラグイン](/tools/plugin) を、その方法については [スキル](/tools/skills) を参照してください。
ツールの使用方法に関するガイダンスがプロンプトに挿入されます。一部のプラグインは独自のスキルを提供します
ツール (音声通話プラグインなど) と並行して使用できます。

オプションのプラグイン ツール:- [Lobster](/tools/lobster): 再開可能な承認を備えた型付きワークフロー ランタイム (ゲートウェイ ホストで Lobster CLI が必要)。

- [LLM タスク](/tools/llm-task): 構造化ワークフロー出力用の JSON のみの LLM ステップ (オプションのスキーマ検証)。
- [差分](/tools/diffs): 読み取り専用の差分ビューアと、テキストまたは統合パッチの前後の PNG または PDF ファイル レンダラー。

## ツールの在庫

### `apply_patch`

1 つ以上のファイルに構造化パッチを適用します。マルチハンク編集に使用します。
実験的: `tools.exec.applyPatch.enabled` 経由で有効にします (OpenAI モデルのみ)。
`tools.exec.applyPatch.workspaceOnly` のデフォルトは `true` (ワークスペースを含む) です。意図的に `apply_patch` をワークスペース ディレクトリの外に書き込み/削除する場合にのみ、これを `false` に設定します。

### `exec`

ワークスペースでシェル コマンドを実行します。

コアパラメータ:

- `command` (必須)
- `yieldMs` (タイムアウト後の自動バックグラウンド、デフォルトは 10000)
- `background` (直接の背景)
- `timeout` (秒、超過するとプロセスを強制終了、デフォルトは 1800)
- `elevated` (ブール値。昇格モードが有効/許可されている場合はホスト上で実行。エージェントがサンドボックス化されている場合にのみ動作が変更されます)
- `host` (`sandbox | gateway | node`)
- `security` (`deny | allowlist | full`)
- `ask` (`off | on-miss | always`)
- `node` (`host=node` のノード ID/名前)
- 本物の TTY が必要ですか? `pty: true` を設定します。

注:- バックグラウンドの場合は、`sessionId` とともに `status: "running"` を返します。

- `process` を使用して、バックグラウンド セッションをポーリング/ログ/書き込み/強制終了/クリアします。
- `process` が禁止されている場合、`exec` は同期的に実行され、`yieldMs`/`background` は無視されます。
- `elevated` は、`tools.elevated` と `agents.list[].tools.elevated` オーバーライド (両方とも許可する必要があります) によってゲートされ、`host=gateway` + `security=full` のエイリアスです。
- `elevated` は、エージェントがサンドボックス化されている場合にのみ動作を変更します (それ以外の場合は何も行われません)。
- `host=node` は、macOS コンパニオン アプリまたはヘッドレス ノード ホスト (`openclaw node run`) をターゲットにできます。
- ゲートウェイ/ノードの承認と許可リスト: [Exec 承認](/tools/exec-approvals)。

### `process`

バックグラウンド実行セッションを管理します。

主なアクション:

- `list`、`poll`、`log`、`write`、`kill`、`clear`、`remove`

注:

- `poll` は、完了時に新しい出力と終了ステータスを返します。
- `log` は行ベースの `offset`/`limit` をサポートします (最後の N 行を取得するには `offset` を省略します)。
- `process` はエージェントごとにスコープが定められています。他のエージェントからのセッションは表示されません。

### `loop-detection` (ツール呼び出しループ ガードレール)

OpenClaw は、最近のツール呼び出し履歴を追跡し、進行しないループが繰り返されることを検出するとブロックまたは警告します。
`tools.loopDetection.enabled: true` で有効にします (デフォルトは `false`)。

```json5
{
tools: {
loopDetection: {
enabled: true,
warningThreshold: 10,
criticalThreshold: 20,
globalCircuitBreakerThreshold: 30,
historySize: 30,
detectors: {
genericRepeat: true,
knownPollNoProgress: true,
pingPong: true,
},
},
},
}

````

- `genericRepeat`: 同じツール + 同じパラメータの呼び出しパターンが繰り返されました。
- `knownPollNoProgress`: 同一の出力を持つポーリングのようなツールを繰り返します。
- `pingPong`: `A/B/A/B` の進行なしパターンが交互に発生します。
- エージェントごとのオーバーライド: `agents.list[].tools.loopDetection`。

### `web_search`

Perplexity、Brave、Gemini、Grok、または Kim を使用して Web を検索します。

コアパラメータ:

- `query` (必須)
- `count` (1 ～ 10; `tools.web.search.maxResults` からのデフォルト)

注:

- 選択したプロバイダーの API キーが必要です (推奨: `openclaw configure --section web`)。
- `tools.web.search.enabled` 経由で有効にします。
- 応答はキャッシュされます (デフォルトは 15 分)。
- セットアップについては、[Web ツール](/tools/web) を参照してください。

### `web_fetch`

URL から読み取り可能なコンテンツをフェッチして抽出します (HTML → マークダウン/テキスト)。

コアパラメータ:

- `url` (必須)
- `extractMode` (`markdown` | `text`)
- `maxChars` (長いページを切り詰める)

注:

- `tools.web.fetch.enabled` 経由で有効にします。
- `maxChars` は `tools.web.fetch.maxCharsCap` (デフォルトは 50000) によってクランプされます。
- 応答はキャッシュされます (デフォルトは 15 分)。
- JS を多用するサイトの場合は、ブラウザ ツールを推奨します。
- セットアップについては、[Web ツール](/tools/web) を参照してください。
- オプションのボット対策フォールバックについては、[Firecrawl](/tools/firecrawl) を参照してください。

### `browser`

OpenClaw で管理される専用のブラウザを制御します。

主なアクション:- `status`、`start`、`stop`、`tabs`、`open`、`focus`、`close`
- `snapshot` (アリア/アイ)
- `screenshot` (画像ブロック + `MEDIA:<path>` を返します)
- `act` (UI アクション: クリック/タイプ/プレス/ホバー/ドラッグ/選択/塗りつぶし/サイズ変更/待機/評価)
- `navigate`、`console`、`pdf`、`upload`、`dialog`

プロファイル管理:

- `profiles` — すべてのブラウザ プロファイルとステータスをリストします。
- `create-profile` — 自動割り当てポート (または `cdpUrl`) を使用して新しいプロファイルを作成します。
- `delete-profile` — ブラウザを停止し、ユーザー データを削除し、構成から削除します (ローカルのみ)
- `reset-profile` — プロファイルのポート上の孤立したプロセスを強制終了します (ローカルのみ)

共通パラメータ:- `profile` (オプション; デフォルトは `browser.defaultProfile`)
- `target` (`sandbox` | `host` | `node`)
- `node` (オプション; 特定のノード ID/名前を選択します)
  注:
- `browser.enabled=true` が必要です (デフォルトは `true` です。`false` を無効に設定します)。
- すべてのアクションは、マルチインスタンスをサポートするためのオプションの `profile` パラメーターを受け入れます。
- `profile` を省略した場合は、`browser.defaultProfile` が使用されます (デフォルトは "chrome")。
- プロファイル名: 小文字の英数字 + ハイフンのみ (最大 64 文字)。
- ポート範囲: 18800 ～ 18899 (最大 100 プロファイル)。
- リモート プロファイルは接続のみです (開始/停止/リセットはありません)。
- ブラウザ対応ノードが接続されている場合、ツールはそのノードに自動ルーティングすることがあります (`target` を固定しない限り)。
- Playwright がインストールされている場合、`snapshot` はデフォルトで `ai` になります。アクセシビリティ ツリーには `aria` を使用してください。
- `snapshot` は、`e12` のような参照を返すロール スナップショット オプション (`interactive`、`compact`、`depth`、`selector`) もサポートします。
- `act` には、`snapshot` からの `ref` (AI スナップショットからの数値 `12`、またはロール スナップショットからの `e12`) が必要です。まれに CSS セレクターが必要な場合は、`evaluate` を使用してください。
- デフォルトでは `act` → `wait` を避けます。例外的な場合 (待機する信頼できる UI 状態がない場合) にのみ使用してください。- `upload` は、オプションで、準備後に自動クリックするために `ref` を渡すことができます。
- `upload` は、`<input type="file">` を直接設定するための `inputRef` (aria ref) または `element` (CSS セレクター) もサポートしています。

### `canvas`

Canvas ノードを駆動します (present、eval、snapshot、A2UI)。

主なアクション:

- `present`、`hide`、`navigate`、`eval`
- `snapshot` (画像ブロック + `MEDIA:<path>` を返します)
- `a2ui_push`、`a2ui_reset`

注:

- 内部でゲートウェイ `node.invoke` を使用します。
- `node` が指定されていない場合、ツールはデフォルト (単一の接続ノードまたはローカル Mac ノード) を選択します。
- A2UI は v0.8 のみです (`createSurface` はありません)。 CLI は行エラーで v0.9 JSONL を拒否します。
- クイックスモーク: `openclaw nodes canvas a2ui push --node <id> --text "Hello from A2UI"`。

### `nodes`

ペアになったノードを検出してターゲットにします。通知を送信します。カメラ/画面をキャプチャします。

主なアクション:

- `status`、`describe`
- `pending`、`approve`、`reject` (ペアリング)
- `notify` (macOS `system.notify`)
- `run` (macOS `system.run`)
- `camera_list`、`camera_snap`、`camera_clip`、`screen_record`
- `location_get`、`notifications_list`、`notifications_action`
- `device_status`、`device_info`、`device_permissions`、`device_health`

注:- カメラ/画面コマンドを使用するには、ノード アプリをフォアグラウンドで実行する必要があります。
- 画像は画像ブロック + `MEDIA:<path>` を返します。
- ビデオは `FILE:<path>` (mp4) を返します。
- 場所は JSON ペイロード (緯度/経度/精度/タイムスタンプ) を返します。
- `run` パラメータ: `command` argv 配列;オプションの `cwd`、`env` (`KEY=VAL`)、`commandTimeoutMs`、`invokeTimeoutMs`、`needsScreenRecording`。

例 (`run`):

```json
{
  "action": "run",
  "node": "office-mac",
  "command": ["echo", "Hello"],
  "env": ["FOO=bar"],
  "commandTimeoutMs": 12000,
  "invokeTimeoutMs": 45000,
  "needsScreenRecording": false
}
````

### `image`

構成された画像モデルを使用して画像を分析します。

コアパラメータ:

- `image` (必須のパスまたは URL)
- `prompt` (オプション。デフォルトは「画像の説明」です。)
- `model` (オプションのオーバーライド)
- `maxBytesMb` (オプションのサイズキャップ)

注:

- `agents.defaults.imageModel` が構成されている場合 (プライマリまたはフォールバック)、または暗黙的なイメージ モデルがデフォルト モデル + 構成された認証 (ベストエフォート ペアリング) から推論できる場合にのみ使用できます。
- 画像モデルを直接使用します (メインのチャット モデルから独立して)。

### `pdf`

1 つ以上の PDF ドキュメントを分析します。

完全な動作、制限、構成、および例については、[PDF ツール](/tools/pdf) を参照してください。

### `message`

Discord/Google Chat/Slack/Telegram/WhatsApp/Signal/iMessage/MS Teams 全体でメッセージとチャネル アクションを送信します。

主なアクション:- `send` (テキスト + オプションのメディア。MS Teams はアダプティブ カードの `card` もサポートしています)

- `poll` (WhatsApp/Discord/MS Teams のアンケート)
- `react` / `reactions` / `read` / `edit` / `delete`
- `pin` / `unpin` / `list-pins`
- `permissions`
- `thread-create` / `thread-list` / `thread-reply`
- `search`
- `sticker`
- `member-info` / `role-info`
- `emoji-list` / `emoji-upload` / `sticker-upload`
- `role-add` / `role-remove`
- `channel-info` / `channel-list`
- `voice-status`
- `event-list` / `event-create`
- `timeout` / `kick` / `ban`

注:

- `send` はゲートウェイ経由で WhatsApp をルーティングします。他のチャンネルは直接送信されます。
- `poll` は、WhatsApp および MS Teams のゲートウェイを使用します。 Discordの投票は直接行われます。
- メッセージ ツール呼び出しがアクティブなチャット セッションにバインドされている場合、クロスコンテキスト リークを避けるために、送信はそのセッションのターゲットに制限されます。

### `cron`

ゲートウェイの cron ジョブとウェイクアップを管理します。

主なアクション:

- `status`、`list`
- `add`、`update`、`remove`、`run`、`runs`
- `wake` (システム イベントをキューに追加 + オプションの即時ハートビート)

注:- `add` は完全な cron ジョブ オブジェクト (`cron.add` RPC と同じスキーマ) を必要とします。

- `update` は `{ jobId, patch }` を使用します (`id` は互換性のために受け入れられます)。

### `gateway`

再起動するか、実行中のゲートウェイ プロセスに更新を適用します (インプレース)。

主なアクション:

- `restart` (プロセス内再起動を許可し、`SIGUSR1` を送信します。`openclaw gateway` インプレース再起動)
- `config.schema.lookup` (完全なスキーマをプロンプト コンテキストにロードせずに、一度に 1 つの構成パスを検査します)
- `config.get`
- `config.apply` (検証 + 設定の書き込み + 再起動 + スリープ解除)
- `config.patch` (部分更新のマージ + 再起動 + ウェイク)
- `update.run` (更新の実行 + 再起動 + スリープ解除)

注:

- `config.schema.lookup` は、`gateway.auth` や `agents.list.*.heartbeat` などのターゲット設定パスを想定しています。
- `plugins.entries.<id>` をアドレス指定する場合、パスにはスラッシュで区切られたプラグイン ID が含まれる場合があります (例: `plugins.entries.pack/one.config`)。
- 送信中の応答が中断されないようにするには、`delayMs` (デフォルトは 2000) を使用します。
- `config.schema` は内部コントロール UI フローで引き続き利用可能であり、エージェント `gateway` ツールを通じて公開されません。
- `restart` はデフォルトで有効になっています。 `commands.restart: false` を設定して無効にします。

### `sessions_list` / `sessions_history` / `sessions_send` / `sessions_spawn` / `session_status`

セッションをリストしたり、トランスクリプト履歴を検査したり、別のセッションに送信したりできます。

コアパラメータ:- `sessions_list`: `kinds?`、`limit?`、`activeMinutes?`、`messageLimit?` (0 = なし)

- `sessions_history`: `sessionKey` (または `sessionId`)、`limit?`、`includeTools?`
- `sessions_send`: `sessionKey` (または `sessionId`)、`message`、`timeoutSeconds?` (0 = ファイアアンドフォーゲット)
- `sessions_spawn`: `task`、`label?`、`runtime?`、`agentId?`、`model?`、`thinking?`、 `cwd?`、`runTimeoutSeconds?`、`thread?`、`mode?`、`cleanup?`、`sandbox?`、`streamTo?`、 `attachments?`、`attachAs?`
- `session_status`: `sessionKey?` (デフォルトの電流。`sessionId` を受け入れます)、`model?` (`default` はオーバーライドをクリアします)

注:- `main` は正規のダイレクト チャット キーです。グローバル/不明は非表示になります。

- `messageLimit > 0` は、セッションごとに最後の N 個のメッセージをフェッチします (ツール メッセージはフィルタリングされます)。
- セッションのターゲット設定は `tools.sessions.visibility` (デフォルト `tree`: 現在のセッション + 生成されたサブエージェント セッション) によって制御されます。複数のユーザーに対して共有エージェントを実行する場合は、セッション間の参照を防止するために `tools.sessions.visibility: "self"` を設定することを検討してください。
- `sessions_send` は、`timeoutSeconds > 0` の場合、最終完了を待ちます。
- 配信/発表は完了後に行われ、ベストエフォート型で行われます。 `status: "ok"` は、アナウンスが配信されたことを確認するのではなく、エージェントの実行が完了したことを確認します。
- `sessions_spawn` は `runtime: "subagent" | "acp"` (`subagent` デフォルト) をサポートします。 ACP ランタイムの動作については、[ACP エージェント](/tools/acp-agents) を参照してください。
- ACP ランタイムの場合、`streamTo: "parent"` は、直接の子配信ではなく、初期実行の進行状況の概要をシステム イベントとしてリクエスター セッションに送り返します。
- `sessions_spawn` はサブエージェントの実行を開始し、アナウンス応答を要求者のチャットにポストします。
  - ワンショット モード (`mode: "run"`) と永続スレッド バインド モード (`mode: "session"` と `thread: true`) をサポートします。
  - `thread: true` および `mode` を省略した場合、モードはデフォルトで `session` になります。
  - `mode: "session"` には `thread: true` が必要です。- `runTimeoutSeconds` が省略された場合、OpenClaw は設定時に `agents.defaults.subagents.runTimeoutSeconds` を使用します。それ以外の場合、タイムアウトはデフォルトの `0` (タイムアウトなし) になります。
  - Discord のスレッド バインド フローは `session.threadBindings.*` および `channels.discord.threadBindings.*` に依存します。
  - 応答形式には、`Status`、`Result`、およびコンパクトな統計が含まれます。
  - `Result` はアシスタントの完了テキストです。見つからない場合は、最新の `toolResult` がフォールバックとして使用されます。
- 手動完了モードの生成では、最初に直接送信され、キューのフォールバックと一時的な障害の再試行が行われます (`status: "ok"` は実行が終了したことを意味し、配信されたことをアナウンスするものではありません)。
- `sessions_spawn` は、サブエージェント ランタイムのみのインライン ファイル添付をサポートします (ACP はそれらを拒否します)。各添付ファイルには、`name`、`content`、およびオプションの `encoding` (`utf8` または `base64`) および `mimeType` があります。ファイルは、`.manifest.json` メタデータ ファイルとともに `.openclaw/attachments/<uuid>/` の子ワークスペースに実体化されます。このツールは、ファイルごとに `count`、`totalBytes`、`sha256`、および `relDir` のレシートを返します。添付ファイルのコンテンツは、トランスクリプトの永続性から自動的に編集されます。
  - `tools.sessions_spawn.attachments` (`enabled`、`maxTotalBytes`、`maxFiles`、`maxFileBytes`、`retainOnSessionKeep`) を介して制限を構成します。
  - `attachAs.mountPath` は、将来のマウント実装用に予約されたヒントです。- `sessions_spawn` は非ブロッキングであり、すぐに `status: "accepted"` を返します。
- ACP `streamTo: "parent"` 応答には、進行状況履歴を追跡するための `streamLogPath` (セッション スコープの `*.acp-stream.jsonl`) が含まれる場合があります。
- `sessions_send` は返信ピンポンを実行します (停止するには `REPLY_SKIP` と返信します。最大回転数は `session.agentToAgent.maxPingPongTurns`、0 ～ 5 です)。
- ピンポンの後、ターゲット エージェントは **アナウンス ステップ**を実行します。アナウンスを抑制するには、`ANNOUNCE_SKIP` と返信してください。
- サンドボックス クランプ: 現在のセッションがサンドボックス化されており、`agents.defaults.sandbox.sessionToolsVisibility: "spawned"` の場合、OpenClaw は `tools.sessions.visibility` を `tree` にクランプします。

### `agents_list`

現在のセッションのターゲットとなるエージェント ID を `sessions_spawn` でリストします。

注:

- 結果はエージェントごとの許可リストに制限されます (`agents.list[].subagents.allowAgents`)。
- `["*"]` が構成されている場合、ツールには構成されているすべてのエージェントが含まれ、`allowAny: true` とマークされます。

## パラメータ(共通)

ゲートウェイベースのツール (`canvas`、`nodes`、`cron`):

- `gatewayUrl` (デフォルト `ws://127.0.0.1:18789`)
- `gatewayToken` (認証が有効な場合)
- `timeoutMs`

注: `gatewayUrl` が設定されている場合は、`gatewayToken` を明示的に含めます。ツールは設定を継承しません
またはオーバーライド用の環境資格情報が必要であり、明示的な資格情報が欠落している場合はエラーになります。

ブラウザツール:- `profile` (オプション; デフォルトは `browser.defaultProfile`)

- `target` (`sandbox` | `host` | `node`)
- `node` (オプション; 特定のノード ID/名前を固定)
- トラブルシューティング ガイド:
  - Linux の起動/CDP の問題: [ブラウザのトラブルシューティング (Linux)](/tools/browser-linux-troubleshooting)
  - WSL2 ゲートウェイ + Windows リモート Chrome CDP: [WSL2 + Windows + リモート Chrome CDP トラブルシューティング](/tools/browser-wsl2-windows-remote-cdp-troubleshooting)

## 推奨されるエージェント フロー

ブラウザの自動化:

1. `browser` → `status` / `start`
2. `snapshot` (アイまたはアリア)
3. `act` (クリック/入力/押し)
4. `screenshot` 目視確認が必要な場合

キャンバスのレンダリング:

1. `canvas` → `present`
2. `a2ui_push` (オプション)
3. `snapshot`

ノードのターゲティング:

1. `nodes` → `status`
2. 選択したノード上の `describe`
3. `notify` / `run` / `camera_snap` / `screen_record`

## 安全性

- 直接の `system.run` は避けてください。ユーザーの明示的な同意がある場合にのみ、`nodes` → `run` を使用してください。
- カメラ/画面キャプチャに対するユーザーの同意を尊重します。
- `status/describe` を使用して、メディア コマンドを呼び出す前にアクセス許可を確認します。

## ツールがエージェントに提示される方法

ツールは 2 つの並行チャネルで公開されます。1. **システム プロンプト テキスト**: 人間が読めるリストとガイダンス。2. **ツール スキーマ**: モデル API に送信される構造化関数定義。

つまり、エージェントは「どのようなツールが存在するか」と「そのツールを呼び出す方法」の両方を確認できます。ツールなら
システム プロンプトまたはスキーマに表示されない場合、モデルはそれを呼び出すことができません。
