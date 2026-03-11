---
summary: "サブエージェント: リクエスターのチャットに結果を通知する分離されたエージェントの実行を生成します。"
read_when:
  - エージェントを介したバックグラウンド/並行作業が必要な場合
  - session_spawn またはサブエージェント ツールのポリシーを変更しています
  - スレッドバインドされたサブエージェントセッションを実装またはトラブルシューティングしている場合
title: "サブエージェント"
x-i18n:
  source_hash: "6d1a68ac1daa18d11a802ae91af452fa697f76b8a5d7bfd88d7359b9ac51d634"
---

# サブエージェント

サブエージェントは、既存のエージェント実行から生成されたバックグラウンド エージェント実行です。これらは独自のセッション (`agent:<agentId>:subagent:<uuid>`) で実行され、終了すると、結果を要求者のチャット チャネルに**発表**します。

## スラッシュコマンド

**現在のセッション**のサブエージェントの実行を検査または制御するには、`/subagents` を使用します。

* `/subagents list`
* `/subagents kill <id|#|all>`
* `/subagents log <id|#> [limit] [tools]`
* `/subagents info <id|#>`
* `/subagents send <id|#> <message>`
* `/subagents steer <id|#> <message>`
* `/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]`

スレッド バインディング コントロール:

これらのコマンドは、永続的なスレッド バインディングをサポートするチャネルで動作します。以下の **チャンネルをサポートするスレッド**を参照してください。

* `/focus <subagent-label|session-key|session-id|session-label>`
* `/unfocus`
* `/agents`
* `/session idle <duration|off>`
* `/session max-age <duration|off>`

`/subagents info` は、実行メタデータ (ステータス、タイムスタンプ、セッション ID、トランスクリプト パス、クリーンアップ) を示します。

### スポーン動作

`/subagents spawn` は、内部リレーではなくユーザー コマンドとしてバックグラウンド サブエージェントを開始し、実行が終了すると、最後の完了更新をリクエスタ チャットに送信します。- spawn コマンドは非ブロッキングです。すぐに実行 ID を返します。

* 完了すると、サブエージェントは概要/結果メッセージを要求者のチャット チャネルにアナウンスします。
* 手動スポーンの場合、配信は復元力があります。
  * OpenClaw は、まず安定した冪等性キーを使用して直接 `agent` 配信を試みます。
  * 直接配信が失敗した場合は、キュー ルーティングにフォールバックします。
  * キュー ルーティングがまだ利用できない場合は、最終的な諦めの前に短い指数関数的バックオフを使用してアナウンスが再試行されます。
* リクエスター セッションへの完了ハンドオフは、実行時に生成される内部コンテキスト (ユーザー作成のテキストではない) であり、以下が含まれます。
  * `Result` (`assistant` 返信テキスト、またはアシスタントの返信が空の場合は最新の `toolResult`)
  * `Status` (`completed successfully` / `failed` / `timed out` / `unknown`)
  * コンパクトなランタイム/トークン統計
  * 要求側エージェントに通常のアシスタント音声で書き換えるよう指示する配信命令 (生の内部メタデータを転送しない)
* `--model` および `--thinking` は、その特定の実行のデフォルトをオーバーライドします。
* `info`/`log` を使用して詳細を検査し、完了後に出力します。
* `/subagents spawn` はワンショット モード (`mode: "run"`) です。永続的なスレッド バインド セッションの場合は、`sessions_spawn` を `thread: true` および `mode: "session"` とともに使用します。- ACP ハーネス セッション (Codex、Claude Code、Gemini CLI) の場合は、`sessions_spawn` を `runtime: "acp"` とともに使用し、[ACP エージェント](/tools/acp-agents) を参照してください。

主な目標:

* メインの実行をブロックすることなく、「リサーチ/長いタスク/遅いツール」作業を並列化します。
* デフォルトでサブエージェントを分離したままにします (セッション分離 + オプションのサンドボックス)。
* ツールの表面を悪用しにくい状態に保ちます。デフォルトでは、サブエージェントはセッション ツールを取得しません\*\*。
* オーケストレーター パターンの構成可能なネストの深さをサポートします。

コストに関する注意: 各サブエージェントには、**独自**のコンテキストとトークンの使用法があります。重いまたは繰り返しの場合
タスクに応じて、サブエージェントには安価なモデルを設定し、メイン エージェントには高品質のモデルを使用し続けます。
これは、`agents.defaults.subagents.model` またはエージェントごとのオーバーライドを介して構成できます。

## ツール

`sessions_spawn` を使用します。

* サブエージェントの実行を開始します (`deliver: false`、グローバル レーン: `subagent`)
* 次に、アナウンス ステップを実行し、アナウンス応答をリクエスタ チャット チャネルに投稿します。
* デフォルト モデル: `agents.defaults.subagents.model` (またはエージェントごとの `agents.list[].subagents.model`) を設定しない限り、呼び出し元を継承します。明示的な `sessions_spawn.model` が引き続き優先されます。
* デフォルトの考え方: `agents.defaults.subagents.thinking` (またはエージェントごとの `agents.list[].subagents.thinking`) を設定しない限り、呼び出し元を継承します。明示的な `sessions_spawn.thinking` が引き続き優先されます。
* デフォルトの実行タイムアウト: `sessions_spawn.runTimeoutSeconds` が省略された場合、OpenClaw は設定時に `agents.defaults.subagents.runTimeoutSeconds` を使用します。それ以外の場合は、`0` (タイムアウトなし) に戻ります。

ツールパラメータ:- `task` (必須)

* `label?` (オプション)
* `agentId?` (オプション; 許可されている場合は別のエージェント ID で生成されます)
* `model?` (オプション; サブエージェント モデルをオーバーライドします。無効な値はスキップされ、サブエージェントはデフォルト モデルで実行され、ツールの結果に警告が表示されます)
* `thinking?` (オプション; サブエージェント実行の思考レベルをオーバーライドします)
* `runTimeoutSeconds?` (設定されている場合はデフォルトで `agents.defaults.subagents.runTimeoutSeconds`、それ以外の場合は `0` です。設定されている場合、サブエージェントの実行は N 秒後に中止されます)
* `thread?` (デフォルト `false`; `true` の場合、このサブエージェント セッションのチャネル スレッド バインディングを要求します)
* `mode?` (`run|session`)
  * デフォルトは `run` です
  * `thread: true` および `mode` を省略した場合、デフォルトは `session` になります。
  * `mode: "session"` には `thread: true` が必要です
* `cleanup?` (`delete|keep`、デフォルト `keep`)
* `sandbox?` (`inherit|require`、デフォルトの `inherit`; `require` は、ターゲットの子ランタイムがサンドボックス化されていない限り、生成を拒否します)
* `sessions_spawn` は、チャネル配信パラメーター (`target`、`channel`、`to`、`threadId`、`replyTo`、`transport`) を受け入れません\*\*。配信には、生成された実行からの `message`/`sessions_send` を使用します。

## スレッドバインドされたセッションチャネルに対してスレッド バインディングが有効になっている場合、サブエージェントはスレッドにバインドされたままになるため、そのスレッド内のフォローアップ ユーザー メッセージは同じサブエージェント セッションにルーティングされ続けます

### スレッドサポートチャネル

* Discord (現在サポートされている唯一のチャネル): 永続的なスレッドバインドされたサブエージェント セッション (`sessions_spawn` と `thread: true`)、手動スレッド制御 (`/focus`、`/unfocus`、`/agents`、`/session idle`) をサポートします。 `/session max-age`)、アダプター キー `channels.discord.threadBindings.enabled`、`channels.discord.threadBindings.idleHours`、`channels.discord.threadBindings.maxAgeHours`、および `channels.discord.threadBindings.spawnSubagentSessions`。

簡単な流れ:

1. `thread: true` (およびオプションで `mode: "session"`) を使用して、`sessions_spawn` で生成します。
2. OpenClaw は、アクティブなチャネル内のセッション ターゲットにスレッドを作成またはバインドします。
3. そのスレッド内の応答とフォローアップ メッセージは、バインドされたセッションにルーティングされます。
4. `/session idle` を使用して非アクティブ自動フォーカス解除を検査/更新し、`/session max-age` を使用してハード キャップを制御します。
5. `/unfocus` を使用して手動で切り離します。

手動制御:

* `/focus <target>` は、現在のスレッドをサブエージェント/セッション ターゲットにバインドします (またはスレッドを作成します)。
* `/unfocus` は、現在バインドされているスレッドのバインドを削除します。
* `/agents` は、アクティブな実行とバインディング状態 (`thread:<id>` または `unbound`) をリストします。
* `/session idle` および `/session max-age` は、フォーカスされたバインドされたスレッドに対してのみ機能します。

設定スイッチ:- グローバルデフォルト: `session.threadBindings.enabled`、`session.threadBindings.idleHours`、`session.threadBindings.maxAgeHours`

* チャネル オーバーライドと自動バインド キーの生成はアダプター固有です。上記の **スレッド サポート チャネル**を参照してください。

現在のアダプターの詳細については、[構成リファレンス](/gateway/configuration-reference) および [スラッシュ コマンド](/tools/slash-commands) を参照してください。

許可リスト:

* `agents.list[].subagents.allowAgents`: `agentId` を介してターゲットにできるエージェント ID のリスト (任意の場合は `["*"]`)。デフォルト: リクエスターエージェントのみ。
* サンドボックス継承ガード: リクエスター セッションがサンドボックス化されている場合、 `sessions_spawn` はサンドボックス化されずに実行されるターゲットを拒否します。

発見:

* `agents_list` を使用して、現在 `sessions_spawn` に許可されているエージェント ID を確認します。

自動アーカイブ:

* サブエージェント セッションは、`agents.defaults.subagents.archiveAfterMinutes` (デフォルト: 60) の後に自動的にアーカイブされます。
* アーカイブは `sessions.delete` を使用し、トランスクリプトの名前を `*.deleted.<timestamp>` (同じフォルダー) に変更します。
* `cleanup: "delete"` は発表直後にアーカイブされます (名前変更によりトランスクリプトは引き続き保持されます)。
* 自動アーカイブはベストエフォート型です。ゲートウェイが再起動すると、保留中のタイマーは失われます。
* `runTimeoutSeconds` は自動アーカイブを**しません**。実行を停止するだけです。セッションは自動アーカイブされるまで残ります。
* 自動アーカイブは、深さ 1 と深さ 2 のセッションに同様に適用されます。

## ネストされたサブエージェントデフォルトでは、サブエージェントは独自のサブエージェントを生成できません (`maxSpawnDepth: 1`)。 `maxSpawnDepth: 2` を設定すると、1 レベルのネストを有効にできます。これにより、**オーケストレーター パターン**: メイン → オーケストレーター サブエージェント → ワーカー サブサブエージェントが可能になります

### 有効にする方法

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // allow sub-agents to spawn children (default: 1)
        maxChildrenPerAgent: 5, // max active children per agent session (default: 5)
        maxConcurrent: 8, // global concurrency lane cap (default: 8)
        runTimeoutSeconds: 900, // default timeout for sessions_spawn when omitted (0 = no timeout)
      },
    },
  },
}
```

### 深さレベル

| 深さ | セッションキーの形状                                   | 役割                                   | スポーンできますか？                 |
| -- | -------------------------------------------- | ------------------------------------ | -------------------------- |
| 0  | `agent:<id>:main`                            | メインエージェント                            | 常に                         |
| 1  | `agent:<id>:subagent:<uuid>`                 | サブエージェント (深さ 2 が許可されている場合はオーケストレーター) | `maxSpawnDepth >= 2` の場合のみ |
| 2  | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | サブサブエージェント（リーフワーカー）                  | 決して                        |

### チェーンをアナウンスする

結果はチェーンを遡って流れます。

1. 深さ 2 のワーカーが終了 → 親 (深さ 1 オーケストレーター) に通知します
2. Depth-1 オーケストレーターがアナウンスを受信し、結果を合成し、終了 → メインにアナウンス
3. メインエージェントはアナウンスを受信し、ユーザーに配信します

各レベルは、その直接の子からのアナウンスのみを参照します。

### 深さ別のツール ポリシー- **深さ 1 (オーケストレーター、`maxSpawnDepth >= 2` の場合)**: `sessions_spawn`、`subagents`、`sessions_list`、`sessions_history` を取得して、子を管理できるようにします。他のセッション/システム ツールは拒否されたままです

* **深さ 1 (リーフ、`maxSpawnDepth == 1` の場合)**: セッション ツールなし (現在のデフォルト動作)。
* **深さ 2 (リーフ ワーカー)**: セッション ツールなし — `sessions_spawn` は深さ 2 では常に拒否されます。それ以上の子を生成することはできません。

### エージェントごとの生成制限

各エージェント セッション (任意の深さ) は、一度に最大 `maxChildrenPerAgent` (デフォルト: 5) のアクティブな子を持つことができます。これにより、単一のオーケストレーターからの暴走ファンアウトが防止されます。

### カスケード停止

深さ 1 のオーケストレーターを停止すると、深さ 2 のすべての子が自動的に停止されます。

* メイン チャットの `/stop` は、すべての深さ 1 のエージェントを停止し、深さ 2 の子にカスケードします。
* `/subagents kill <id>` は、特定のサブエージェントを停止し、その子にカスケードします。
* `/subagents kill all` は、リクエスターとカスケードのすべてのサブエージェントを停止します。

## 認証

サブエージェント認証は、セッション タイプではなく **エージェント ID** によって解決されます。

* サブエージェントのセッション キーは `agent:<agentId>:subagent:<uuid>` です。
* 認証ストアは、そのエージェントの `agentDir` からロードされます。
* メイン エージェントの認証プロファイルは **フォールバック**としてマージされます。エージェント プロファイルは、競合が発生した場合にメイン プロファイルをオーバーライドします。注: マージは追加的なものであるため、メイン プロファイルは常にフォールバックとして使用できます。エージェントごとに完全に分離された認証はまだサポートされていません。

## 発表する

サブエージェントはアナウンス ステップを通じて報告を返します。- アナウンス ステップは、(リクエスタ セッションではなく) サブエージェント セッション内で実行されます。

* サブエージェントが `ANNOUNCE_SKIP` と正確に応答した場合、何も投稿されません。

* それ以外の場合、配信はリクエスタの深さに依存します。
  * トップレベルのリクエスタ セッションは、外部配信によるフォローアップ `agent` 呼び出し (`deliver=true`) を使用します。
  * ネストされたリクエスター サブエージェント セッションは内部フォローアップ インジェクション (`deliver=false`) を受け取るため、オーケストレーターはセッション内で子の結果を合成できます。
  * ネストされたリクエスターのサブエージェント セッションがなくなった場合、OpenClaw は、利用可能な場合はそのセッションのリクエスターにフォールバックします。

* 子完了集計は、ネストされた完了結果を構築するときに現在のリクエスター実行にスコープされ、古い実行前の子出力が現在のアナウンスに漏洩するのを防ぎます。

* チャネル アダプタで利用可能な場合、アナウンス応答はスレッド/トピック ルーティングを保持します。

* アナウンス コンテキストは安定した内部イベント ブロックに正規化されます。
  * ソース (`subagent` または `cron`)
  * 子セッションキー/ID
  * アナウンスタイプ + タスクラベル
  * 実行時の結果から派生したステータス行 (`success`、`error`、`timeout`、または `unknown`)
  * アナウンスステップからの結果コンテンツ (欠落している場合は `(no output)`)
  * いつ返信するか、沈黙し続けるかを説明するフォローアップの指示

* `Status` はモデル出力から推論されません。それは実行時の結果信号から来ます。アナウンス ペイロードには、最後に統計行が含まれます (ラップされている場合でも)。

* ランタイム (例: `runtime 5m12s`)

* トークンの使用量（入力/出力/合計）

* モデルの価格設定時の推定コスト (`models.providers.*.models[].cost`)

* `sessionKey`、`sessionId`、およびトランスクリプト パス (メイン エージェントは `sessions_history` 経由で履歴を取得したり、ディスク上のファイルを検査したりできます)

* 内部メタデータはオーケストレーションのみを目的としています。ユーザー向けの応答は、通常のアシスタントの音声で書き換える必要があります。

## ツール ポリシー (サブエージェント ツール)

デフォルトでは、サブエージェントは **セッション ツールを除くすべてのツール** とシステム ツールを取得します。

* `sessions_list`
* `sessions_history`
* `sessions_send`
* `sessions_spawn`

`maxSpawnDepth >= 2` の場合、深さ 1 オーケストレーター サブエージェントはさらに `sessions_spawn`、`subagents`、`sessions_list`、および `sessions_history` を受け取り、子を管理できるようになります。

構成によるオーバーライド:

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxConcurrent: 1,
      },
    },
  },
  tools: {
    subagents: {
      tools: {
        // deny wins
        deny: ["gateway", "cron"],
        // if allow is set, it becomes allow-only (deny still wins)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

## 同時実行性

サブエージェントは専用のインプロセス キュー レーンを使用します。

* レーン名: `subagent`
* 同時実行性: `agents.defaults.subagents.maxConcurrent` (デフォルト `8`)

## 停止中

* リクエスター チャットで `/stop` を送信すると、リクエスター セッションが中止され、そこから生成され、ネストされた子にカスケードされるアクティブなサブエージェントの実行が停止されます。
* `/subagents kill <id>` は、特定のサブエージェントを停止し、その子にカスケードします。

## 制限事項- サブエージェントのアナウンスは **ベストエフォート** です。ゲートウェイが再起動すると、保留中の「アナウンスバック」作業は失われます

* サブエージェントは引き続き同じゲートウェイ プロセス リソースを共有します。 `maxConcurrent` を安全弁として扱ってください。
* `sessions_spawn` は常に非ブロッキングです。すぐに `{ status: "accepted", runId, childSessionKey }` を返します。
* サブエージェント コンテキストは `AGENTS.md` + `TOOLS.md` のみを挿入します (`SOUL.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、または`BOOTSTRAP.md`)。
* ネストの最大の深さは 5 です (`maxSpawnDepth` 範囲: 1 ～ 5)。ほとんどの使用例では深さ 2 が推奨されます。
* `maxChildrenPerAgent` は、セッションあたりのアクティブな子の数を制限します (デフォルト: 5、範囲: 1 ～ 20)。
