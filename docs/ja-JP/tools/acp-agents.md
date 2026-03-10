---
summary: "Pi、Claude Code、Codex、OpenCode、Gemini CLI、およびその他のハーネス エージェントに ACP ランタイム セッションを使用する"
read_when:
  - ACP を介したコーディング ハーネスの実行
  - スレッド対応チャネルでのスレッドバインド ACP セッションのセットアップ
  - Discord チャネルまたは Telegram フォーラムのトピックを永続的な ACP セッションにバインドする
  - ACP バックエンドとプラグインの配線のトラブルシューティング
  - チャットから /acp コマンドを操作する
title: "ACPエージェント"
x-i18n:
  source_hash: "52f8793716668a9f3a333a8787aab2a9e5d55015c505176b0add674017b07179"
---

# ACP エージェント

[エージェント クライアント プロトコル (ACP)](https://agentclientprotocol.com/) セッションにより、OpenClaw は ACP バックエンド プラグインを通じて外部コーディング ハーネス (Pi、Claude Code、Codex、OpenCode、Gemini CLI など) を実行できます。

OpenClaw に平易な言葉で「これを Codex で実行する」または「Claude Code をスレッドで開始する」ように要求した場合、OpenClaw はそのリクエストを ACP ランタイム (ネイティブ サブエージェント ランタイムではない) にルーティングする必要があります。

## 高速なオペレータ フロー

実用的な `/acp` Runbook が必要な場合は、これを使用します。

1. セッションを生成します。
   - `/acp spawn codex --mode persistent --thread auto`
2. バインドされたスレッドで作業します (または、そのセッション キーを明示的にターゲットにします)。
3. 実行時の状態を確認します。
   - `/acp status`
4. 必要に応じてランタイム オプションを調整します。
   - `/acp model <provider/model>`
   - `/acp permissions <profile>`
   - `/acp timeout <seconds>`
5. コンテキストを置き換えずにアクティブなセッションをナッジします。
   - `/acp steer tighten logging and continue`
6. 作業を停止します。
   - `/acp cancel` (現在のターンを停止)、または
   - `/acp close` (セッションを閉じてバインディングを削除)

## 人間のためのクイック スタート

自然なリクエストの例:

- 「ここのスレッドで永続的な Codex セッションを開始し、集中したままにしてください。」
- 「これをワンショットのクロード コード ACP セッションとして実行し、結果を要約します。」
- 「スレッド内のこのタスクには Gemini CLI を使用し、同じスレッドでフォローアップを続けてください。」

OpenClaw がすべきこと:1. `runtime: "acp"` を選択します。2. 要求されたハーネス ターゲットを解決します (`agentId`、たとえば `codex`)。3. スレッド バインディングが要求され、現在のチャネルがそれをサポートしている場合は、ACP セッションをスレッドにバインドします。4. フォーカスが外れる/クローズされる/期限切れになるまで、フォローアップ スレッド メッセージを同じ ACP セッションにルーティングします。

## ACP とサブエージェント

外部ハーネス ランタイムが必要な場合は、ACP を使用します。 OpenClaw ネイティブの委任された実行が必要な場合は、サブエージェントを使用します。

| エリア         | ACPセッション                          | サブエージェントの実行                          |
| -------------- | -------------------------------------- | ----------------------------------------------- |
| ランタイム     | ACP バックエンド プラグイン (例: acpx) | OpenClaw ネイティブ サブエージェント ランタイム |
| セッションキー | `agent:<agentId>:acp:<uuid>`           | `agent:<agentId>:subagent:<uuid>`               |
| 主なコマンド   | `/acp ...`                             | `/subagents ...`                                |
| スポーンツール | `sessions_spawn` と `runtime:"acp"`    | `sessions_spawn` (デフォルトのランタイム)       |

[サブエージェント](/tools/subagents) も参照してください。

## スレッドバインドされたセッション (チャネルに依存しない)

チャネル アダプタでスレッド バインディングが有効になっている場合、ACP セッションをスレッドにバインドできます。- OpenClaw は、スレッドをターゲット ACP セッションにバインドします。

- そのスレッド内のフォローアップ メッセージは、バインドされた ACP セッションにルーティングされます。
- ACP 出力は同じスレッドに返されます。
- フォーカスを解除/閉じる/アーカイブ/アイドル タイムアウトまたは最大有効期限を設定すると、バインドが削除されます。

スレッド バインディングのサポートはアダプター固有です。アクティブなチャネル アダプタがスレッド バインディングをサポートしていない場合、OpenClaw は明確なサポートされていない/使用できないメッセージを返します。

スレッドバインド ACP に必要な機能フラグ:

- `acp.enabled=true`
- `acp.dispatch.enabled` はデフォルトでオンです (ACP ディスパッチを一時停止するには `false` を設定します)
- チャネルアダプター ACP スレッド生成フラグが有効 (アダプター固有)
  - ディスコード: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### スレッドサポートチャネル

- セッション/スレッド バインディング機能を公開するチャネル アダプター。
- 現在の組み込みサポート:
  - Discordのスレッド/チャンネル
  - Telegramトピック（グループ/スーパーグループのフォーラムトピックおよびDMトピック）
- プラグイン チャネルは、同じバインディング インターフェイスを通じてサポートを追加できます。

## チャンネル固有の設定

非一時的なワークフローの場合は、最上位の `bindings[]` エントリで永続的な ACP バインディングを構成します。

### バインディングモデル- `bindings[].type="acp"` は、永続的な ACP 会話バインディングをマークします

- `bindings[].match` はターゲットの会話を識別します。
  - Discord チャンネルまたはスレッド: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Telegram フォーラムのトピック: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- `bindings[].agentId` は、所有する OpenClaw エージェント ID です。
- オプションの ACP オーバーライドは `bindings[].acp` の下にあります。
  - `mode` (`persistent` または `oneshot`)
  - `label`
  - `cwd`
  - `backend`

### エージェントごとのランタイムのデフォルト

`agents.list[].runtime` を使用して、エージェントごとに 1 回 ACP デフォルトを定義します。

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (ハーネス ID、例: `codex` または `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

ACP バインドされたセッションの優先順位をオーバーライドします。

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. グローバル ACP デフォルト (例: `acp.backend`)

例:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
      {
        id: "claude",
        runtime: {
          type: "acp",
          acp: { agent: "claude", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
    {
      type: "acp",
      agentId: "claude",
      match: {
        channel: "telegram",
        accountId: "default",
        peer: { kind: "group", id: "-1001234567890:topic:42" },
      },
      acp: { cwd: "/workspace/repo-b" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "discord", accountId: "default" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "telegram", accountId: "default" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": { requireMention: false },
          },
        },
      },
    },
    telegram: {
      groups: {
        "-1001234567890": {
          topics: { "42": { requireMention: false } },
        },
      },
    },
  },
}
```

動作:

- OpenClaw は、構成された ACP セッションが使用前に存在することを確認します。
- そのチャネルまたはトピック内のメッセージは、構成された ACP セッションにルーティングされます。
- バインドされた会話では、`/new` と `/reset` が同じ ACP セッション キーを所定の場所にリセットします。
- 一時的なランタイム バインディング (スレッド フォーカス フローによって作成されたものなど) は、存在する場合には引き続き適用されます。

## ACP セッション (インターフェイス) を開始します

### `sessions_spawn` より

`runtime: "acp"` を使用して、エージェント ターンまたはツール コールから ACP セッションを開始します。

```json
{
"task": "Open the repo and summarize failing tests",
"runtime": "acp",
"agentId": "codex",
"thread": true,
"mode": "session"
}

````

注:

- `runtime` のデフォルトは `subagent` なので、ACP セッションに対して明示的に `runtime: "acp"` を設定します。
- `agentId` が省略された場合、OpenClaw は設定時に `acp.defaultAgent` を使用します。
- `mode: "session"` では、永続的なバインドされた会話を維持するために `thread: true` が必要です。

インターフェースの詳細:- `task` (必須): ACP セッションに送信される最初のプロンプト。
- `runtime` (ACP に必須): `"acp"` である必要があります。
- `agentId` (オプション): ACP ターゲット ハーネス ID。設定されている場合は、`acp.defaultAgent` に戻ります。
- `thread` (オプション、デフォルト `false`): サポートされている場合、リクエスト スレッド バインディング フロー。
- `mode` (オプション): `run` (ワンショット) または `session` (永続)。
  - デフォルトは `run` です
  - `thread: true` とモードが省略された場合、OpenClaw はデフォルトでランタイム パスごとに永続的な動作を行う可能性があります
  - `mode: "session"` には `thread: true` が必要です
- `cwd` (オプション): 要求されたランタイム作業ディレクトリ (バックエンド/ランタイム ポリシーによって検証される)。
- `label` (オプション): セッション/バナー テキストで使用されるオペレータ向けのラベル。
- `streamTo` (オプション): `"parent"` は、最初の ACP 実行の進行状況の概要をシステム イベントとしてリクエスタ セッションにストリーミングします。
  - 利用可能な場合、受け入れられた応答にはセッション スコープの JSONL ログ (`<sessionId>.acp-stream.jsonl`) を指す `streamLogPath` が含まれており、完全なリレー履歴を追跡できます。

### オペレーターの煙テスト

ACP が生成されることを簡単にライブチェックしたい場合は、ゲートウェイのデプロイ後にこれを使用します。
単体テストに合格するだけでなく、実際にはエンドツーエンドで動作します。

推奨ゲート:1. デプロイされたゲートウェイのバージョン/ターゲット ホスト上のコミットを確認します。
2. デプロイされたソースに ACP リネージの受け入れが含まれていることを確認します。
   `src/gateway/sessions-patch.ts` (`subagent:* or acp:* sessions`)。
3. ライブ エージェントへの一時的な ACPX ブリッジ セッションを開きます (たとえば、
   `jpclawhq` の `razor(main)`)。
4. そのエージェントに、次のように `sessions_spawn` に電話するよう依頼します。
   - `runtime: "acp"`
   - `agentId: "codex"`
   - `mode: "run"`
   - タスク: `Reply with exactly LIVE-ACP-SPAWN-OK`
5. エージェントのレポートを確認します。
   - `accepted=yes`
   - 本物の `childSessionKey`
   - バリデータエラーなし
6. 一時的な ACPX ブリッジ セッションをクリーンアップします。

ライブエージェントへのプロンプトの例:

```text
Use the sessions_spawn tool now with runtime: "acp", agentId: "codex", and mode: "run".
Set the task to: "Reply with exactly LIVE-ACP-SPAWN-OK".
Then report only: accepted=<yes/no>; childSessionKey=<value or none>; error=<exact text or none>.
````

注:

- 意図的にテストする場合を除き、このスモーク テストは `mode: "run"` のままにしてください。
  スレッドバインドされた永続的な ACP セッション。
- 基本ゲートには `streamTo: "parent"` は必要ありません。その道は以下によって決まります
  リクエスター/セッション機能は個別の統合チェックです。
- スレッドバインドされた `mode: "session"` テストを 2 番目のより充実した統合として扱う
  実際の Discord スレッドまたは Telegram トピックから渡されます。

## サンドボックスの互換性

ACP セッションは現在、OpenClaw サンドボックス内ではなく、ホスト ランタイム上で実行されます。

現在の制限:- リクエスター セッションがサンドボックス化されている場合、ACP の生成は `sessions_spawn({ runtime: "acp" })` と `/acp spawn` の両方でブロックされます。

- エラー: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `sessions_spawn` と `runtime: "acp"` は、`sandbox: "require"` をサポートしません。
  - エラー: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

サンドボックス強制実行が必要な場合は、`runtime: "subagent"` を使用します。

### `/acp` コマンドより

必要に応じてチャットからオペレーターを明示的に制御するには、`/acp spawn` を使用します。

```text
/acp spawn codex --mode persistent --thread auto
/acp spawn codex --mode oneshot --thread off
/acp spawn codex --thread here
```

主要なフラグ:

- `--mode persistent|oneshot`
- `--thread auto|here|off`
- `--cwd <absolute-path>`
- `--label <name>`

[スラッシュ コマンド](/tools/slash-commands) を参照してください。

## セッションターゲットの解決

ほとんどの `/acp` アクションは、オプションのセッション ターゲット (`session-key`、`session-id`、または `session-label`) を受け入れます。

解決順序:

1. 明示的なターゲット引数 (または `/acp steer` の場合は `--session`)
   - キーを試行します
   - 次に、UUID 形式のセッション ID
   - 次にラベルを付けます
2. 現在のスレッド バインディング (この会話/スレッドが ACP セッションにバインドされている場合)
3. 現在のリクエスターセッションのフォールバック

ターゲットが解決されない場合、OpenClaw は明確なエラー (`Unable to resolve session target: ...`) を返します。

## スレッドモードを生成する

| `/acp spawn` は `--thread auto | here                                                                                                                                  | off` をサポートします。 | モード | 行動 |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | ------ | ---- |
| `auto`                         | アクティブなスレッドの場合: そのスレッドをバインドします。スレッドの外側: サポートされている場合は、子スレッドを作成/バインドします。 |
| `here`                         | 現在アクティブなスレッドが必要です。 1つでもなければ失敗します。                                                                      |
| `off`                          | 拘束力はありません。セッションはバインドされていない状態で開始されます。                                                              |

注:

- 非スレッド バインディング サーフェスでは、デフォルトの動作は実質的に `off` になります。
- スレッドバウンドのスポーンにはチャネル ポリシーのサポートが必要です。
  - ディスコード: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

## ACP コントロール

利用可能なコマンドファミリー:

- `/acp spawn`
- `/acp cancel`
- `/acp steer`
- `/acp close`
- `/acp status`
- `/acp set-mode`
- `/acp set`
- `/acp cwd`
- `/acp permissions`
- `/acp timeout`
- `/acp model`
- `/acp reset-options`
- `/acp sessions`
- `/acp doctor`
- `/acp install`

`/acp status` は、有効なランタイム オプションと、使用可能な場合はランタイム レベルとバックエンド レベルの両方のセッション ID を示します。一部のコントロールはバックエンド機能に依存します。バックエンドがコントロールをサポートしていない場合、OpenClaw は明確なサポートされていないコントロール エラーを返します。

## ACP コマンド クックブック|コマンド |何をするのか |例 |

| -------------------- | -------------------------------------------------------- | -------------------------------------------------------------- |
| `/acp spawn` | ACP セッションを作成します。オプションのスレッドバインド。 | `/acp spawn codex --mode persistent --thread auto --cwd /repo` |
| `/acp cancel` |ターゲットセッションの飛行中のターンをキャンセルします。 | `/acp cancel agent:codex:acp:<uuid>` |
| `/acp steer` |実行中のセッションに操縦指示を送信します。 | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close` |セッションを閉じて、スレッド ターゲットのバインドを解除します。 | `/acp close` |
| `/acp status` |バックエンド、モード、状態、ランタイム オプション、機能を表示します。 | `/acp status` |
| `/acp set-mode` |ターゲットセッションのランタイムモードを設定します。 | `/acp set-mode plan` |
| `/acp set` |一般的なランタイム構成オプションの書き込み。 | `/acp set model openai/gpt-5.2` |
| `/acp cwd` |実行時の作業ディレクトリのオーバーライドを設定します。 | `/acp cwd /Users/user/Projects/repo` || `/acp permissions` |承認ポリシープロファイルを設定します。 | `/acp permissions strict` |
| `/acp timeout` |実行時のタイムアウト (秒) を設定します。 | `/acp timeout 120` |
| `/acp model` |ランタイムモデルのオーバーライドを設定します。 | `/acp model anthropic/claude-opus-4-5` |
| `/acp reset-options` |セッションランタイムオプションのオーバーライドを削除します。 | `/acp reset-options` |
| `/acp sessions` |ストアからの最近の ACP セッションを一覧表示します。 | `/acp sessions` |
| `/acp doctor` |バックエンドの健全性、機能、実用的な修正。 | `/acp doctor` |
| `/acp install` |決定的なインストールと有効化の手順を出力します。 | `/acp install` |

## 実行時オプションのマッピング

`/acp` には便利なコマンドと汎用セッターがあります。

同等の操作:- `/acp model <id>` は、ランタイム構成キー `model` にマップされます。

- `/acp permissions <profile>` は、ランタイム構成キー `approval_policy` にマップされます。
- `/acp timeout <seconds>` は、ランタイム構成キー `timeout` にマップされます。
- `/acp cwd <path>` はランタイム cwd オーバーライドを直接更新します。
- `/acp set <key> <value>` は汎用パスです。
  - 特殊なケース: `key=cwd` は cwd オーバーライド パスを使用します。
- `/acp reset-options` は、ターゲット セッションのすべてのランタイム オーバーライドをクリアします。

## acpx ハーネスのサポート (現在)

現在の acpx 組み込みハーネス エイリアス:

- `pi`
- `claude`
- `codex`
- `opencode`
- `gemini`
- `kimi`

OpenClaw が acpx バックエンドを使用する場合、acpx 構成でカスタム エージェント エイリアスが定義されていない限り、`agentId` にはこれらの値を優先してください。

acpx CLI を直接使用すると、`--agent <command>` 経由で任意のアダプターをターゲットにすることもできますが、その生のエスケープ ハッチは acpx CLI 機能です (通常の OpenClaw `agentId` パスではありません)。

## 必要な構成

コア ACP ベースライン:

```json5
{
  acp: {
    enabled: true,
    // Optional. Default is true; set false to pause ACP dispatch while keeping /acp controls.
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "codex",
    allowedAgents: ["pi", "claude", "codex", "opencode", "gemini", "kimi"],
    maxConcurrentSessions: 8,
    stream: {
      coalesceIdleMs: 300,
      maxChunkChars: 1200,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

スレッド バインディング設定はチャネル アダプター固有です。 Discordの例:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        spawnAcpSessions: true,
      },
    },
  },
}
```

スレッド バインド ACP 生成が機能しない場合は、まずアダプター機能フラグを確認します。

- ディスコード: `channels.discord.threadBindings.spawnAcpSessions=true`

[構成リファレンス](/gateway/configuration-reference) を参照してください。

## acpx バックエンドのプラグインのセットアップ

プラグインをインストールして有効にします。

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

開発中にローカル ワークスペースをインストールします。

````bash
openclaw plugins install ./extensions/acpx
```次に、バックエンドの健全性を確認します。

```text
/acp doctor
````

### acpx コマンドとバージョンの構成

デフォルトでは、acpx プラグイン (`@openclaw/acpx` として公開) はプラグインローカルの固定バイナリを使用します。

1. コマンドのデフォルトは `extensions/acpx/node_modules/.bin/acpx` です。
2. 予期されるバージョンのデフォルトは拡張ピンです。
3. スタートアップは、ACP バックエンドをすぐに準備完了として登録します。
4. バックグラウンド保証ジョブが `acpx --version` を検証します。
5. プラグインのローカル バイナリが見つからないか不一致の場合は、次のように実行されます。
   `npm install --omit=dev --no-save acpx@<pinned>` を実行し、再検証します。

プラグイン設定でコマンド/バージョンをオーバーライドできます。

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "command": "../acpx/dist/cli.js",
          "expectedVersion": "any"
        }
      }
    }
  }
}
```

注:

- `command` は、絶対パス、相対パス、またはコマンド名 (`acpx`) を受け入れます。
- 相対パスは OpenClaw ワークスペース ディレクトリから解決されます。
- `expectedVersion: "any"` は厳密なバージョンの一致を無効にします。
- `command` がカスタム バイナリ/パスを指している場合、プラグインのローカル自動インストールは無効になります。
- バックエンドのヘルスチェックが実行されている間、OpenClaw の起動はノンブロッキングのままです。

[プラグイン](/tools/plugin) を参照してください。

## 権限の設定

ACP セッションは非対話的に実行されます。ファイル書き込みおよびシェル実行権限のプロンプトを承認または拒否するための TTY はありません。 acpx プラグインは、アクセス許可の処理方法を制御する 2 つの構成キーを提供します。

### `permissionMode`

| ハーネス エージェントがプロンプトを表示せずに実行できる操作を制御します。 | 値                                                                   | 行動 |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------- | ---- |
| `approve-all`                                                             | すべてのファイル書き込みとシェルコマンドを自動承認します。           |
| `approve-reads`                                                           | 自動承認は読み取りのみです。書き込みと実行にはプロンプトが必要です。 |
| `deny-all`                                                                | すべての許可プロンプトを拒否します。                                 |

### `nonInteractivePermissions`

許可プロンプトが表示されるが対話型 TTY が利用できない場合の動作を制御します (これは ACP セッションの場合に常に当てはまります)。

| 値     | 行動                                                            |
| ------ | --------------------------------------------------------------- |
| `fail` | `AcpRuntimeError` とのセッションを中止します。 **(デフォルト)** |
| `deny` | 許可を黙って拒否し、続行します (正常な機能低下)。               |

### 構成

プラグイン構成経由で設定します:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

これらの値を変更した後、ゲートウェイを再起動します。

> **重要:** 現在、OpenClaw のデフォルトは `permissionMode=approve-reads` および `nonInteractivePermissions=fail` です。非対話型 ACP セッションでは、権限プロンプトをトリガーする書き込みまたは実行が `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` で失敗する可能性があります。
>
> 権限を制限する必要がある場合は、`nonInteractivePermissions` を `deny` に設定して、セッションがクラッシュせずに正常に機能を低下させるようにします。

## トラブルシューティング|症状 |考えられる原因 |修正 |

| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured` |バックエンドプラグインが見つからないか無効になっています。 |バックエンド プラグインをインストールして有効にし、`/acp doctor` を実行します。 |
| `ACP is disabled by policy (acp.enabled=false)` | ACP がグローバルに無効になっています。 | `acp.enabled=true` を設定します。 || `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)` |通常のスレッド メッセージからのディスパッチが無効になっています。 | `acp.dispatch.enabled=true` を設定します。 |
| `ACP agent "<id>" is not allowed by policy` |エージェントが許可リストに含まれていません。 |許可されている `agentId` を使用するか、`acp.allowedAgents` を更新してください。 |
| `Unable to resolve session target: ...` |不正なキー/ID/ラベル トークン。 | `/acp sessions` を実行し、正確なキー/ラベルをコピーして、再試行してください。 |
| `--thread here requires running /acp spawn inside an active ... thread` | `--thread here` はスレッド コンテキストの外で使用されます。 |ターゲット スレッドに移動するか、`--thread auto`/`off` を使用してください。 || `Only <user-id> can rebind this thread.` |別のユーザーがスレッド バインディングを所有しています。 |所有者として再バインドするか、別のスレッドを使用します。 |
| `Thread bindings are unavailable for <channel>.` |アダプターにはスレッド バインディング機能がありません。 | `--thread off` を使用するか、サポートされているアダプター/チャネルに移動してください。 |
| `Sandboxed sessions cannot spawn ACP sessions ...` | ACP ランタイムはホスト側です。リクエスタセッションはサンドボックス化されています。 |サンドボックス セッションから `runtime="subagent"` を使用するか、非サンドボックス セッションから ACP spawn を実行します。 |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...` | `sandbox="require"` は ACP ランタイム用にリクエストされました。 |必要なサンドボックス化には `runtime="subagent"` を使用するか、非サンドボックス セッションから `sandbox="inherit"` で ACP を使用します。 ||バインドされたセッションの ACP メタデータが欠落しています |古い/削除された ACP セッション メタデータ。 | `/acp spawn` を使用して再作成し、スレッドを再バインド/フォーカスします。 |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` | `permissionMode` は、非対話型 ACP セッションでの書き込み/実行をブロックします。 | `plugins.entries.acpx.config.permissionMode` を `approve-all` に設定し、ゲートウェイを再起動します。 [権限の設定](#permission-configuration) を参照してください。 |
| ACP セッションが早期に失敗し、出力がほとんどありません。権限プロンプトは `permissionMode`/`nonInteractivePermissions` によってブロックされます。 |ゲートウェイ ログで `AcpRuntimeError` を確認してください。完全な権限を得るには、`permissionMode=approve-all` を設定します。正常に機能を低下させるには、`nonInteractivePermissions=deny` を設定します。 |
| ACP セッションが作業完了後に無期限に停止します。ハーネス プロセスは完了しましたが、ACP セッションが完了を報告しませんでした。 | `ps aux \| grep acpx` で監視します。古いプロセスを手動で強制終了します。 |
