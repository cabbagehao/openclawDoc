---
summary: "Hooks: コマンドとライフサイクルイベントのためのイベント駆動型自動化"
read_when:
  - /new、/reset、/stop、およびエージェントのライフサイクルイベントに対してイベント駆動型の自動化を行いたい場合
  - hooks を構築、インストール、またはデバッグしたい場合
title: "Hooks"
x-i18n:
  source_path: "automation/hooks.md"
  source_hash: "fc1370a05127d778eb685f687ee9a52062aa6f5c895e80152b9de41c3a02c592"
  provider: "openai"
  model: "gpt-5"
  workflow: 1
  generated_at: "2026-03-10T05:55:41.000Z"
---

# Hooks

Hooks は、エージェントのコマンドやイベントに応じたアクションの自動化を可能にする、拡張可能なイベント駆動システムです。Hooks はディレクトリから自動検出され、OpenClaw の Skills と同様に CLI コマンドで管理できます。

## 全体像をつかむ

Hooks は、何かが起きたときに実行される小さなスクリプトです。種類は 2 つあります。

- **Hooks**（このページ）: `/new`、`/reset`、`/stop`、またはライフサイクルイベントのようなエージェントイベント発火時に、Gateway 内で実行されます。
- **Webhooks**: 他のシステムから OpenClaw の処理をトリガーできる外部 HTTP webhook です。[Webhook Hooks](/automation/webhook) を参照するか、Gmail 用ヘルパーコマンドとして `openclaw webhooks` を使ってください。

Hooks はプラグイン内に同梱することもできます。[Plugins](/tools/plugin#plugin-hooks) を参照してください。

よくある用途:

- セッションをリセットしたときにメモリのスナップショットを保存する
- トラブルシューティングやコンプライアンスのためにコマンドの監査ログを残す
- セッション開始時または終了時に後続の自動化を起動する
- イベント発火時にエージェントのワークスペースへファイルを書き込んだり、外部 API を呼び出したりする

小さな TypeScript 関数を書けるなら、hook も書けます。Hooks は自動検出され、有効化や無効化は CLI で行います。

## 概要

hooks システムでは次のことができます。

- `/new` 発行時にセッションコンテキストをメモリへ保存する
- すべてのコマンドを監査用に記録する
- エージェントのライフサイクルイベントで独自の自動化を起動する
- コアコードを変更せずに OpenClaw の挙動を拡張する

## はじめる

### 同梱 hooks

OpenClaw には、自動的に検出される 4 つの同梱 hook があります。

- **💾 session-memory**: `/new` を実行したときに、セッションコンテキストをエージェントのワークスペース（デフォルトは `~/.openclaw/workspace/memory/`）へ保存します
- **📎 bootstrap-extra-files**: `agent:bootstrap` 中に、設定済みの glob/path パターンから追加のワークスペース bootstrap ファイルを注入します
- **📝 command-logger**: すべてのコマンドイベントを `~/.openclaw/logs/commands.log` に記録します
- **🚀 boot-md**: Gateway 起動時に `BOOT.md` を実行します（internal hooks を有効化している必要があります）

利用可能な hooks を一覧表示:

```bash
openclaw hooks list
```

hook を有効化:

```bash
openclaw hooks enable session-memory
```

hook の状態を確認:

```bash
openclaw hooks check
```

詳細情報を表示:

```bash
openclaw hooks info session-memory
```

### オンボーディング

オンボーディング（`openclaw onboard`）では、推奨 hooks を有効化するかどうかを確認されます。ウィザードは対象となる hooks を自動検出し、選択できるように表示します。

## Hook の検出

Hooks は 3 つのディレクトリから自動検出されます（優先順位順）。

1. **Workspace hooks**: `<workspace>/hooks/`（エージェント単位、最優先）
2. **Managed hooks**: `~/.openclaw/hooks/`（ユーザーがインストールし、複数ワークスペースで共有）
3. **Bundled hooks**: `<openclaw>/dist/hooks/bundled/`（OpenClaw に同梱）

Managed hook ディレクトリは、**単一 hook** にも **hook pack**（パッケージディレクトリ）にもできます。

各 hook は次のようなディレクトリで構成されます。

```
my-hook/
├── HOOK.md          # Metadata + documentation
└── handler.ts       # Handler implementation
```

## Hook Packs (npm/archives)

hook pack は標準的な npm パッケージで、`package.json` の `openclaw.hooks` を通じて 1 つ以上の hook を公開します。インストールは次のコマンドで行います。

```bash
openclaw hooks install <path-or-spec>
```

npm spec は registry のみ対応です（パッケージ名 + 任意の厳密なバージョンまたは dist-tag）。
Git/URL/file の spec や semver range は拒否されます。

素の spec と `@latest` は stable トラックのまま扱われます。npm がそれらを prerelease に解決した場合、OpenClaw は停止し、`@beta` / `@rc` のような prerelease tag や厳密な prerelease version で明示的に opt in するよう求めます。

`package.json` の例:

```json
{
  "name": "@acme/my-hooks",
  "version": "0.1.0",
  "openclaw": {
    "hooks": ["./hooks/my-hook", "./hooks/other-hook"]
  }
}
```

各エントリは `HOOK.md` と `handler.ts`（または `index.ts`）を含む hook ディレクトリを指します。
hook pack は依存関係を同梱でき、それらは `~/.openclaw/hooks/<id>` 配下にインストールされます。
各 `openclaw.hooks` エントリは、symlink 解決後もパッケージディレクトリの内側に留まっている必要があります。外へ逃げるエントリは拒否されます。

セキュリティ上の注意: `openclaw hooks install` は依存関係を `npm install --ignore-scripts` でインストールします
（ライフサイクルスクリプトは実行されません）。hook pack の依存ツリーは "pure JS/TS" に保ち、`postinstall` ビルドに依存するパッケージは避けてください。

## Hook の構造

### HOOK.md の形式

`HOOK.md` ファイルには、YAML frontmatter による metadata と Markdown ドキュメントが含まれます。

```markdown
---
name: my-hook
description: "Short description of what this hook does"
homepage: https://docs.openclaw.ai/automation/hooks#my-hook
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# My Hook

Detailed documentation goes here...

## What It Does

- Listens for `/new` commands
- Performs some action
- Logs the result

## Requirements

- Node.js must be installed

## Configuration

No configuration needed.
```

### Metadata フィールド

`metadata.openclaw` オブジェクトでは次をサポートします。

- **`emoji`**: CLI に表示する emoji（例: `"💾"`）
- **`events`**: リッスンするイベントの配列（例: `["command:new", "command:reset"]`）
- **`export`**: 使用する名前付き export（デフォルトは `"default"`）
- **`homepage`**: ドキュメント URL
- **`requires`**: 任意の要件
  - **`bins`**: PATH 上に必要なバイナリ（例: `["git", "node"]`）
  - **`anyBins`**: これらのバイナリのうち少なくとも 1 つが必要
  - **`env`**: 必要な環境変数
  - **`config`**: 必要な config パス（例: `["workspace.dir"]`）
  - **`os`**: 必要なプラットフォーム（例: `["darwin", "linux"]`）
- **`always`**: eligibility チェックをバイパスする（boolean）
- **`install`**: インストール方法（同梱 hook の場合: `[{"id":"bundled","kind":"bundled"}]`）

### Handler 実装

`handler.ts` ファイルは `HookHandler` 関数を export します。

```typescript
const myHandler = async (event) => {
  // Only trigger on 'new' command
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] New command triggered`);
  console.log(`  Session: ${event.sessionKey}`);
  console.log(`  Timestamp: ${event.timestamp.toISOString()}`);

  // Your custom logic here

  // Optionally send message to user
  event.messages.push("✨ My hook executed!");
};

export default myHandler;
```

#### イベントコンテキスト

各イベントには次の情報が含まれます。

```typescript
{
  type: 'command' | 'session' | 'agent' | 'gateway' | 'message',
  action: string,              // e.g., 'new', 'reset', 'stop', 'received', 'sent'
  sessionKey: string,          // Session identifier
  timestamp: Date,             // When the event occurred
  messages: string[],          // Push messages here to send to user
  context: {
    // Command events:
    sessionEntry?: SessionEntry,
    sessionId?: string,
    sessionFile?: string,
    commandSource?: string,    // e.g., 'whatsapp', 'telegram'
    senderId?: string,
    workspaceDir?: string,
    bootstrapFiles?: WorkspaceBootstrapFile[],
    cfg?: OpenClawConfig,
    // Message events (see Message Events section for full details):
    from?: string,             // message:received
    to?: string,               // message:sent
    content?: string,
    channelId?: string,
    success?: boolean,         // message:sent
  }
}
```

## イベントの種類

### Command イベント

エージェントコマンドが発行されたときにトリガーされます。

- **`command`**: すべてのコマンドイベント（一般リスナー）
- **`command:new`**: `/new` コマンド発行時
- **`command:reset`**: `/reset` コマンド発行時
- **`command:stop`**: `/stop` コマンド発行時

### Session イベント

- **`session:compact:before`**: compaction による履歴要約の直前
- **`session:compact:after`**: compaction 完了後、summary metadata とともに発火

internal hook payload では、これらは `type: "session"` と `action: "compact:before"` / `action: "compact:after"` として送出されます。リスナー側では上記の結合キーを購読します。
具体的な handler 登録では、`${type}:${action}` のリテラルキー形式を使います。これらのイベントでは `session:compact:before` と `session:compact:after` を登録してください。

### Agent イベント

- **`agent:bootstrap`**: ワークスペース bootstrap ファイルが注入される前（hooks は `context.bootstrapFiles` を変更できます）

### Gateway イベント

Gateway 起動時にトリガーされます。

- **`gateway:startup`**: チャンネル起動後かつ hooks 読み込み後

### Message イベント

メッセージの受信または送信時にトリガーされます。

- **`message`**: すべてのメッセージイベント（一般リスナー）
- **`message:received`**: 任意のチャンネルから受信メッセージを受け取ったとき。メディア理解より前の早い段階で発火します。内容には、未処理メディア添付を表す `<media:audio>` のような生のプレースホルダーが含まれる場合があります。
- **`message:transcribed`**: 音声の文字起こしやリンク理解を含め、メッセージが完全に処理されたとき。この時点では、音声メッセージの完全な文字起こしテキストが `transcript` に入っています。文字起こし済み音声の内容にアクセスしたい場合はこの hook を使います。
- **`message:preprocessed`**: すべてのメディア理解とリンク理解が完了した後、各メッセージごとに発火します。これにより、エージェントが見る前の fully enriched body（transcript、画像説明、リンク要約など）へ hooks がアクセスできます。
- **`message:sent`**: 送信メッセージが正常に送られたとき

#### Message イベントのコンテキスト

message event には、メッセージに関する豊富なコンテキストが含まれます。

```typescript
// message:received context
{
  from: string,           // Sender identifier (phone number, user ID, etc.)
  content: string,        // Message content
  timestamp?: number,     // Unix timestamp when received
  channelId: string,      // Channel (e.g., "whatsapp", "telegram", "discord")
  accountId?: string,     // Provider account ID for multi-account setups
  conversationId?: string, // Chat/conversation ID
  messageId?: string,     // Message ID from the provider
  metadata?: {            // Additional provider-specific data
    to?: string,
    provider?: string,
    surface?: string,
    threadId?: string,
    senderId?: string,
    senderName?: string,
    senderUsername?: string,
    senderE164?: string,
  }
}

// message:sent context
{
  to: string,             // Recipient identifier
  content: string,        // Message content that was sent
  success: boolean,       // Whether the send succeeded
  error?: string,         // Error message if sending failed
  channelId: string,      // Channel (e.g., "whatsapp", "telegram", "discord")
  accountId?: string,     // Provider account ID
  conversationId?: string, // Chat/conversation ID
  messageId?: string,     // Message ID returned by the provider
  isGroup?: boolean,      // Whether this outbound message belongs to a group/channel context
  groupId?: string,       // Group/channel identifier for correlation with message:received
}

// message:transcribed context
{
  body?: string,          // Raw inbound body before enrichment
  bodyForAgent?: string,  // Enriched body visible to the agent
  transcript: string,     // Audio transcript text
  channelId: string,      // Channel (e.g., "telegram", "whatsapp")
  conversationId?: string,
  messageId?: string,
}

// message:preprocessed context
{
  body?: string,          // Raw inbound body
  bodyForAgent?: string,  // Final enriched body after media/link understanding
  transcript?: string,    // Transcript when audio was present
  channelId: string,      // Channel (e.g., "telegram", "whatsapp")
  conversationId?: string,
  messageId?: string,
  isGroup?: boolean,
  groupId?: string,
}
```

#### 例: Message Logger Hook

```typescript
const isMessageReceivedEvent = (event: { type: string; action: string }) =>
  event.type === "message" && event.action === "received";
const isMessageSentEvent = (event: { type: string; action: string }) =>
  event.type === "message" && event.action === "sent";

const handler = async (event) => {
  if (isMessageReceivedEvent(event as { type: string; action: string })) {
    console.log(`[message-logger] Received from ${event.context.from}: ${event.context.content}`);
  } else if (isMessageSentEvent(event as { type: string; action: string })) {
    console.log(`[message-logger] Sent to ${event.context.to}: ${event.context.content}`);
  }
};

export default handler;
```

### Tool Result Hook（Plugin API）

これらの hooks はイベントストリームのリスナーではありません。OpenClaw がツール結果を永続化する前に、プラグインが同期的に結果を調整できるようにするためのものです。

- **`tool_result_persist`**: ツール結果をセッショントランスクリプトへ書き込む前に変換します。同期でなければなりません。更新済みのツール結果 payload を返すか、そのまま維持するには `undefined` を返してください。[Agent Loop](/concepts/agent-loop) を参照してください。

### Plugin Hook イベント

plugin hook runner から公開される compaction ライフサイクル hook:

- **`before_compaction`**: 件数/トークン metadata を伴って compaction 前に実行
- **`after_compaction`**: compaction summary metadata を伴って compaction 後に実行

### 今後のイベント

今後予定されているイベントの種類:

- **`session:start`**: 新しいセッション開始時
- **`session:end`**: セッション終了時
- **`agent:error`**: エージェントでエラーが発生したとき

## カスタム hooks を作成する

### 1. 配置場所を選ぶ

- **Workspace hooks**（`<workspace>/hooks/`）: エージェント単位、最優先
- **Managed hooks**（`~/.openclaw/hooks/`）: ワークスペース間で共有

### 2. ディレクトリ構造を作成する

```bash
mkdir -p ~/.openclaw/hooks/my-hook
cd ~/.openclaw/hooks/my-hook
```

### 3. HOOK.md を作成する

```markdown
---
name: my-hook
description: "Does something useful"
metadata: { "openclaw": { "emoji": "🎯", "events": ["command:new"] } }
---

# My Custom Hook

This hook does something useful when you issue `/new`.
```

### 4. handler.ts を作成する

```typescript
const handler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log("[my-hook] Running!");
  // Your logic here
};

export default handler;
```

### 5. 有効化してテストする

```bash
# Verify hook is discovered
openclaw hooks list

# Enable it
openclaw hooks enable my-hook

# Restart your gateway process (menu bar app restart on macOS, or restart your dev process)

# Trigger the event
# Send /new via your messaging channel
```

## 設定

### 新しい設定形式（推奨）

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "entries": {
        "session-memory": { "enabled": true },
        "command-logger": { "enabled": false }
      }
    }
  }
}
```

### hook ごとの設定

hooks には独自の設定を持たせられます。

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "entries": {
        "my-hook": {
          "enabled": true,
          "env": {
            "MY_CUSTOM_VAR": "value"
          }
        }
      }
    }
  }
}
```

### 追加ディレクトリ

追加ディレクトリから hooks を読み込みます。

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "load": {
        "extraDirs": ["/path/to/more/hooks"]
      }
    }
  }
}
```

### 旧設定形式（引き続きサポート）

古い設定形式も後方互換性のために引き続き動作します。

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "handlers": [
        {
          "event": "command:new",
          "module": "./hooks/handlers/my-handler.ts",
          "export": "default"
        }
      ]
    }
  }
}
```

注意: `module` はワークスペース相対パスである必要があります。絶対パスや、ワークスペース外への traversal は拒否されます。

**移行**: 新しい hook には、新しい discovery ベースのシステムを使ってください。legacy handler はディレクトリベースの hook の後に読み込まれます。

## CLI コマンド

### hooks を一覧表示する

```bash
# List all hooks
openclaw hooks list

# Show only eligible hooks
openclaw hooks list --eligible

# Verbose output (show missing requirements)
openclaw hooks list --verbose

# JSON output
openclaw hooks list --json
```

### hook 情報

```bash
# Show detailed info about a hook
openclaw hooks info session-memory

# JSON output
openclaw hooks info session-memory --json
```

### eligibility を確認する

```bash
# Show eligibility summary
openclaw hooks check

# JSON output
openclaw hooks check --json
```

### 有効化/無効化

```bash
# Enable a hook
openclaw hooks enable session-memory

# Disable a hook
openclaw hooks disable command-logger
```

## 同梱 hook リファレンス

### session-memory

`/new` 実行時にセッションコンテキストをメモリへ保存します。

**Events**: `command:new`

**Requirements**: `workspace.dir` の設定が必要

**Output**: `<workspace>/memory/YYYY-MM-DD-slug.md`（デフォルトは `~/.openclaw/workspace`）

**動作内容**:

1. reset 前のセッションエントリを使って、正しい transcript を特定する
2. 会話の最後の 15 行を抽出する
3. LLM を使って説明的なファイル名 slug を生成する
4. セッション metadata を日付付きメモリファイルに保存する

**出力例**:

```markdown
# Session: 2026-01-16 14:30:00 UTC

- **Session Key**: agent:main:main
- **Session ID**: abc123def456
- **Source**: telegram
```

**ファイル名の例**:

- `2026-01-16-vendor-pitch.md`
- `2026-01-16-api-design.md`
- `2026-01-16-1430.md` (fallback timestamp if slug generation fails)

**有効化**:

```bash
openclaw hooks enable session-memory
```

### bootstrap-extra-files

`agent:bootstrap` 中に追加の bootstrap ファイル（たとえば monorepo ローカルの `AGENTS.md` / `TOOLS.md`）を注入します。

**Events**: `agent:bootstrap`

**Requirements**: `workspace.dir` の設定が必要

**出力**: ファイルは書き込まれません。bootstrap context はメモリ上でのみ変更されます。

**設定**:

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "entries": {
        "bootstrap-extra-files": {
          "enabled": true,
          "paths": ["packages/*/AGENTS.md", "packages/*/TOOLS.md"]
        }
      }
    }
  }
}
```

**補足**:

- パスはワークスペース相対で解決されます。
- ファイルはワークスペース内に留まる必要があります（realpath で検証されます）。
- 読み込まれるのは認識済みの bootstrap basename のみです。
- subagent allowlist は維持されます（`AGENTS.md` と `TOOLS.md` のみ）。

**有効化**:

```bash
openclaw hooks enable bootstrap-extra-files
```

### command-logger

すべての command event を集中管理された監査ファイルへ記録します。

**Events**: `command`

**Requirements**: なし

**Output**: `~/.openclaw/logs/commands.log`

**動作内容**:

1. イベント詳細（command action、timestamp、session key、sender ID、source）を取得する
2. JSONL 形式でログファイルへ追記する
3. バックグラウンドで静かに実行する

**ログエントリの例**:

```jsonl
{"timestamp":"2026-01-16T14:30:00.000Z","action":"new","sessionKey":"agent:main:main","senderId":"+1234567890","source":"telegram"}
{"timestamp":"2026-01-16T15:45:22.000Z","action":"stop","sessionKey":"agent:main:main","senderId":"user@example.com","source":"whatsapp"}
```

**ログの確認**:

```bash
# View recent commands
tail -n 20 ~/.openclaw/logs/commands.log

# Pretty-print with jq
cat ~/.openclaw/logs/commands.log | jq .

# Filter by action
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**有効化**:

```bash
openclaw hooks enable command-logger
```

### boot-md

Gateway 起動時（チャンネル起動後）に `BOOT.md` を実行します。
これを動かすには internal hooks を有効化しておく必要があります。

**Events**: `gateway:startup`

**Requirements**: `workspace.dir` の設定が必要

**動作内容**:

1. ワークスペースから `BOOT.md` を読み込む
2. エージェントランナー経由でその指示を実行する
3. 必要な送信メッセージを message ツール経由で送る

**有効化**:

```bash
openclaw hooks enable boot-md
```

## ベストプラクティス

### Handler は高速に保つ

hooks はコマンド処理中に実行されます。軽量に保ってください。

```typescript
// ✓ Good - async work, returns immediately
const handler: HookHandler = async (event) => {
  void processInBackground(event); // Fire and forget
};

// ✗ Bad - blocks command processing
const handler: HookHandler = async (event) => {
  await slowDatabaseQuery(event);
  await evenSlowerAPICall(event);
};
```

### エラーは適切に処理する

危険な操作は必ずラップしてください。

```typescript
const handler: HookHandler = async (event) => {
  try {
    await riskyOperation(event);
  } catch (err) {
    console.error("[my-handler] Failed:", err instanceof Error ? err.message : String(err));
    // Don't throw - let other handlers run
  }
};
```

### イベントは早めに絞り込む

対象外のイベントなら早めに return します。

```typescript
const handler: HookHandler = async (event) => {
  // Only handle 'new' commands
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  // Your logic here
};
```

### 具体的なイベントキーを使う

可能であれば、metadata では正確なイベントを指定してください。

```yaml
metadata: { "openclaw": { "events": ["command:new"] } } # Specific
```

次のような一般指定よりも:

```yaml
metadata: { "openclaw": { "events": ["command"] } } # General - more overhead
```

## デバッグ

### Hook ログを有効にする

Gateway は起動時に hook の読み込みをログ出力します。

```
Registered hook: session-memory -> command:new
Registered hook: bootstrap-extra-files -> agent:bootstrap
Registered hook: command-logger -> command
Registered hook: boot-md -> gateway:startup
```

### 検出状態を確認する

検出された hooks をすべて一覧表示します。

```bash
openclaw hooks list --verbose
```

### 登録を確認する

handler 内で、呼び出されたときにログを出してください。

```typescript
const handler: HookHandler = async (event) => {
  console.log("[my-handler] Triggered:", event.type, event.action);
  // Your logic
};
```

### eligibility を検証する

hook が eligible でない理由を確認します。

```bash
openclaw hooks info my-hook
```

出力内の不足要件を確認してください。

## テスト

### Gateway ログ

hook の実行を見るには Gateway ログを監視します。

```bash
# macOS
./scripts/clawlog.sh -f

# Other platforms
tail -f ~/.openclaw/gateway.log
```

### hooks を直接テストする

handler を分離してテストします。

```typescript
import { test } from "vitest";
import myHandler from "./hooks/my-hook/handler.js";

test("my handler works", async () => {
  const event = {
    type: "command",
    action: "new",
    sessionKey: "test-session",
    timestamp: new Date(),
    messages: [],
    context: { foo: "bar" },
  };

  await myHandler(event);

  // Assert side effects
});
```

## アーキテクチャ

### コアコンポーネント

- **`src/hooks/types.ts`**: 型定義
- **`src/hooks/workspace.ts`**: ディレクトリのスキャンと読み込み
- **`src/hooks/frontmatter.ts`**: `HOOK.md` metadata の解析
- **`src/hooks/config.ts`**: eligibility チェック
- **`src/hooks/hooks-status.ts`**: 状態レポート
- **`src/hooks/loader.ts`**: 動的モジュールローダー
- **`src/cli/hooks-cli.ts`**: CLI コマンド
- **`src/gateway/server-startup.ts`**: Gateway 起動時に hooks を読み込む
- **`src/auto-reply/reply/commands-core.ts`**: command event をトリガーする

### 検出フロー

```
Gateway startup
    ↓
Scan directories (workspace → managed → bundled)
    ↓
Parse HOOK.md files
    ↓
Check eligibility (bins, env, config, os)
    ↓
Load handlers from eligible hooks
    ↓
Register handlers for events
```

### イベントフロー

```
User sends /new
    ↓
Command validation
    ↓
Create hook event
    ↓
Trigger hook (all registered handlers)
    ↓
Command processing continues
    ↓
Session reset
```

## トラブルシューティング

### Hook が検出されない

1. ディレクトリ構造を確認します。

   ```bash
   ls -la ~/.openclaw/hooks/my-hook/
   # Should show: HOOK.md, handler.ts
   ```

2. HOOK.md の形式を確認します。

   ```bash
   cat ~/.openclaw/hooks/my-hook/HOOK.md
   # Should have YAML frontmatter with name and metadata
   ```

3. 検出された hooks をすべて一覧表示します。

   ```bash
   openclaw hooks list
   ```

### Hook が eligible ではない

要件を確認します。

```bash
openclaw hooks info my-hook
```

不足している可能性があるもの:

- バイナリ（PATH を確認）
- 環境変数
- config 値
- OS 互換性

### Hook が実行されない

1. hook が有効か確認します。

   ```bash
   openclaw hooks list
   # Should show ✓ next to enabled hooks
   ```

2. hooks が再読み込みされるように Gateway プロセスを再起動します。

3. エラーがないか Gateway ログを確認します。

   ```bash
   ./scripts/clawlog.sh | grep hook
   ```

### Handler エラー

TypeScript/import エラーを確認します。

```bash
# Test import directly
node -e "import('./path/to/handler.ts').then(console.log)"
```

## 移行ガイド

### Legacy Config から Discovery への移行

**移行前**:

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "handlers": [
        {
          "event": "command:new",
          "module": "./hooks/handlers/my-handler.ts"
        }
      ]
    }
  }
}
```

**移行後**:

1. hook ディレクトリを作成します。

   ```bash
   mkdir -p ~/.openclaw/hooks/my-hook
   mv ./hooks/handlers/my-handler.ts ~/.openclaw/hooks/my-hook/handler.ts
   ```

2. HOOK.md を作成します。

   ```markdown
   ---
   name: my-hook
   description: "My custom hook"
   metadata: { "openclaw": { "emoji": "🎯", "events": ["command:new"] } }
   ---

   # My Hook

   Does something useful.
   ```

3. config を更新します。

   ```json
   {
     "hooks": {
       "internal": {
         "enabled": true,
         "entries": {
           "my-hook": { "enabled": true }
         }
       }
     }
   }
   ```

4. 確認して Gateway プロセスを再起動します。

   ```bash
   openclaw hooks list
   # Should show: 🎯 my-hook ✓
   ```

**移行のメリット**:

- 自動検出
- CLI 管理
- eligibility チェック
- より良いドキュメント
- 一貫した構造

## 関連項目

- [CLI リファレンス: hooks](/cli/hooks)
- [Bundled Hooks README](https://github.com/openclaw/openclaw/tree/main/src/hooks/bundled)
- [Webhook Hooks](/automation/webhook)
- [Configuration](/gateway/configuration#hooks)
