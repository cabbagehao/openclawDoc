---
title: "Pi 統合アーキテクチャ"
summary: "OpenClaw における組み込み Pi エージェント統合とセッションライフサイクルのアーキテクチャ"
read_when:
  - OpenClaw における Pi SDK 統合設計を理解したいとき
  - Pi 向けのエージェントのセッションライフサイクル、ツール、またはプロバイダー接続を変更するとき
---

# Pi 統合アーキテクチャ

このドキュメントでは、OpenClaw が [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) と、その関連パッケージである `pi-ai`、`pi-agent-core`、`pi-tui` をどのように統合し、AI エージェント機能を実装しているかを説明します。

## 概要

OpenClaw は pi SDK を使って、AI コーディングエージェントをメッセージング Gateway アーキテクチャへ組み込みます。pi をサブプロセスとして起動したり、RPC モードを使ったりするのではなく、`createAgentSession()` を通じて pi の `AgentSession` を直接 import し、インスタンス化します。この組み込み方式には、次の利点があります。

* セッションのライフサイクルとイベント処理を完全に制御できる
* カスタムツールを注入できる（メッセージング、サンドボックス、チャンネル固有のアクションなど）
* チャンネルやコンテキストごとにシステムプロンプトをカスタマイズできる
* 分岐や compaction を含むセッション永続化をサポートできる
* フェイルオーバー付きのマルチアカウント認証プロファイルローテーションを使える
* プロバイダーに依存しないモデル切り替えができる

## パッケージ依存関係

```json
{
  "@mariozechner/pi-agent-core": "0.49.3",
  "@mariozechner/pi-ai": "0.49.3",
  "@mariozechner/pi-coding-agent": "0.49.3",
  "@mariozechner/pi-tui": "0.49.3"
}
```

| Package           | Purpose                                                                               |
| ----------------- | ------------------------------------------------------------------------------------- |
| `pi-ai`           | コア LLM 抽象化: `Model`、`streamSimple`、メッセージ型、プロバイダー API                                  |
| `pi-agent-core`   | エージェントループ、ツール実行、`AgentMessage` 型                                                      |
| `pi-coding-agent` | 高レベル SDK: `createAgentSession`、`SessionManager`、`AuthStorage`、`ModelRegistry`、組み込みツール |
| `pi-tui`          | ターミナル UI コンポーネント（OpenClaw のローカル TUI モードで使用）                                           |

## ファイル構成

```
src/agents/
├── pi-embedded-runner.ts          # pi-embedded-runner/ から再エクスポート
├── pi-embedded-runner/
│   ├── run.ts                     # メインエントリ: runEmbeddedPiAgent()
│   ├── run/
│   │   ├── attempt.ts             # セッションセットアップを含む単一試行のロジック
│   │   ├── params.ts              # RunEmbeddedPiAgentParams 型
│   │   ├── payloads.ts            # 実行結果から応答ペイロードを構築
│   │   ├── images.ts              # Vision モデル向け画像注入
│   │   └── types.ts               # EmbeddedRunAttemptResult
│   ├── abort.ts                   # 中断エラーの検出
│   ├── cache-ttl.ts               # コンテキスト刈り込み用の Cache TTL 追跡
│   ├── compact.ts                 # 手動/自動 compaction ロジック
│   ├── extensions.ts              # 組み込み実行向けの pi 拡張を読み込む
│   ├── extra-params.ts            # プロバイダー固有の stream パラメーター
│   ├── google.ts                  # Google/Gemini のターン順序修正
│   ├── history.ts                 # 履歴制限（DM 対グループ）
│   ├── lanes.ts                   # セッション/グローバルのコマンドレーン
│   ├── logger.ts                  # サブシステムロガー
│   ├── model.ts                   # ModelRegistry 経由のモデル解決
│   ├── runs.ts                    # アクティブ実行の追跡、中断、キュー
│   ├── sandbox-info.ts            # システムプロンプト向けのサンドボックス情報
│   ├── session-manager-cache.ts   # SessionManager インスタンスのキャッシュ
│   ├── session-manager-init.ts    # セッションファイルの初期化
│   ├── system-prompt.ts           # システムプロンプトビルダー
│   ├── tool-split.ts              # ツールを builtIn と custom に分割
│   ├── types.ts                   # EmbeddedPiAgentMeta、EmbeddedPiRunResult
│   └── utils.ts                   # ThinkLevel マッピング、エラー説明
├── pi-embedded-subscribe.ts       # セッションイベントの購読/ディスパッチ
├── pi-embedded-subscribe.types.ts # SubscribeEmbeddedPiSessionParams
├── pi-embedded-subscribe.handlers.ts # イベントハンドラーファクトリー
├── pi-embedded-subscribe.handlers.lifecycle.ts
├── pi-embedded-subscribe.handlers.types.ts
├── pi-embedded-block-chunker.ts   # ストリーミングブロック返信のチャンク化
├── pi-embedded-messaging.ts       # メッセージングツールの送信追跡
├── pi-embedded-helpers.ts         # エラー分類、ターン検証
├── pi-embedded-helpers/           # ヘルパーモジュール
├── pi-embedded-utils.ts           # フォーマットユーティリティ
├── pi-tools.ts                    # createOpenClawCodingTools()
├── pi-tools.abort.ts              # ツール向け AbortSignal ラップ
├── pi-tools.policy.ts             # ツール allowlist/denylist ポリシー
├── pi-tools.read.ts               # read ツールのカスタマイズ
├── pi-tools.schema.ts             # ツールスキーマの正規化
├── pi-tools.types.ts              # AnyAgentTool 型エイリアス
├── pi-tool-definition-adapter.ts  # AgentTool -> ToolDefinition アダプター
├── pi-settings.ts                 # 設定のオーバーライド
├── pi-extensions/                 # カスタム pi 拡張
│   ├── compaction-safeguard.ts    # 保護拡張
│   ├── compaction-safeguard-runtime.ts
│   ├── context-pruning.ts         # Cache-TTL ベースのコンテキスト刈り込み拡張
│   └── context-pruning/
├── model-auth.ts                  # 認証プロファイル解決
├── auth-profiles.ts               # プロファイルストア、クールダウン、フェイルオーバー
├── model-selection.ts             # デフォルトモデル解決
├── models-config.ts               # models.json の生成
├── model-catalog.ts               # モデルカタログキャッシュ
├── context-window-guard.ts        # コンテキストウィンドウ検証
├── failover-error.ts              # FailoverError クラス
├── defaults.ts                    # DEFAULT_PROVIDER、DEFAULT_MODEL
├── system-prompt.ts               # buildAgentSystemPrompt()
├── system-prompt-params.ts        # システムプロンプトパラメーターの解決
├── system-prompt-report.ts        # デバッグレポートの生成
├── tool-summaries.ts              # ツール説明の要約
├── tool-policy.ts                 # ツールポリシー解決
├── transcript-policy.ts           # Transcript 検証ポリシー
├── skills.ts                      # Skills のスナップショット/プロンプト構築
├── skills/                        # Skills サブシステム
├── sandbox.ts                     # サンドボックスコンテキスト解決
├── sandbox/                       # サンドボックスサブシステム
├── channel-tools.ts               # チャンネル固有ツールの注入
├── openclaw-tools.ts              # OpenClaw 固有ツール
├── bash-tools.ts                  # exec/process ツール
├── apply-patch.ts                 # apply_patch ツール（OpenAI）
├── tools/                         # 個別ツール実装
│   ├── browser-tool.ts
│   ├── canvas-tool.ts
│   ├── cron-tool.ts
│   ├── discord-actions*.ts
│   ├── gateway-tool.ts
│   ├── image-tool.ts
│   ├── message-tool.ts
│   ├── nodes-tool.ts
│   ├── session*.ts
│   ├── slack-actions.ts
│   ├── telegram-actions.ts
│   ├── web-*.ts
│   └── whatsapp-actions.ts
└── ...
```

## コア統合フロー

### 1. 組み込みエージェントの実行

メインエントリポイントは `pi-embedded-runner/run.ts` の `runEmbeddedPiAgent()` です。

```typescript
import { runEmbeddedPiAgent } from "./agents/pi-embedded-runner.js";

const result = await runEmbeddedPiAgent({
  sessionId: "user-123",
  sessionKey: "main:whatsapp:+1234567890",
  sessionFile: "/path/to/session.jsonl",
  workspaceDir: "/path/to/workspace",
  config: openclawConfig,
  prompt: "Hello, how are you?",
  provider: "anthropic",
  model: "claude-sonnet-4-20250514",
  timeoutMs: 120_000,
  runId: "run-abc",
  onBlockReply: async (payload) => {
    await sendToChannel(payload.text, payload.mediaUrls);
  },
});
```

### 2. セッション作成

`runEmbeddedAttempt()`（`runEmbeddedPiAgent()` から呼び出される）の内部では、pi SDK を使用します。

```typescript
import {
  createAgentSession,
  DefaultResourceLoader,
  SessionManager,
  SettingsManager,
} from "@mariozechner/pi-coding-agent";

const resourceLoader = new DefaultResourceLoader({
  cwd: resolvedWorkspace,
  agentDir,
  settingsManager,
  additionalExtensionPaths,
});
await resourceLoader.reload();

const { session } = await createAgentSession({
  cwd: resolvedWorkspace,
  agentDir,
  authStorage: params.authStorage,
  modelRegistry: params.modelRegistry,
  model: params.model,
  thinkingLevel: mapThinkingLevel(params.thinkLevel),
  tools: builtInTools,
  customTools: allCustomTools,
  sessionManager,
  settingsManager,
  resourceLoader,
});

applySystemPromptOverrideToSession(session, systemPromptOverride);
```

### 3. イベント購読

`subscribeEmbeddedPiSession()` は pi の `AgentSession` イベントを購読します。

```typescript
const subscription = subscribeEmbeddedPiSession({
  session: activeSession,
  runId: params.runId,
  verboseLevel: params.verboseLevel,
  reasoningMode: params.reasoningLevel,
  toolResultFormat: params.toolResultFormat,
  onToolResult: params.onToolResult,
  onReasoningStream: params.onReasoningStream,
  onBlockReply: params.onBlockReply,
  onPartialReply: params.onPartialReply,
  onAgentEvent: params.onAgentEvent,
});
```

主に次のイベントを処理します。

* `message_start` / `message_end` / `message_update`（ストリーミング中のテキスト/思考）
* `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
* `turn_start` / `turn_end`
* `agent_start` / `agent_end`
* `auto_compaction_start` / `auto_compaction_end`

### 4. プロンプト送信

セットアップ後、セッションに対してプロンプトを送ります。

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

SDK 側で、LLM への送信、tool call の実行、応答のストリーミングを含むエージェントループ全体を処理します。

画像注入はプロンプトローカルです。OpenClaw は現在のプロンプトから画像参照を読み取り、そのターンに限って `images` 経由で渡します。過去の履歴ターンを再走査して、画像ペイロードを再注入することはありません。

## ツールアーキテクチャ

### ツールパイプライン

1. **ベースツール**: pi の `codingTools`（read、bash、edit、write）
2. **カスタム置き換え**: OpenClaw は bash を `exec` / `process` に置き換え、sandbox 向けに read / edit / write をカスタマイズ
3. **OpenClaw ツール**: messaging、browser、canvas、sessions、cron、gateway など
4. **チャンネルツール**: Discord / Telegram / Slack / WhatsApp 固有のアクションツール
5. **ポリシーフィルタリング**: profile、provider、agent、group、sandbox のポリシーでツールを絞り込む
6. **スキーマ正規化**: Gemini / OpenAI の実装上の癖に合わせてスキーマを調整
7. **AbortSignal ラップ**: 中断シグナルを尊重するようにツールをラップ

### ツール定義アダプター

pi-agent-core の `AgentTool` は、pi-coding-agent の `ToolDefinition` とは異なる `execute` シグネチャを持ちます。`pi-tool-definition-adapter.ts` の adapter が、その差分を吸収します。

```typescript
export function toToolDefinitions(tools: AnyAgentTool[]): ToolDefinition[] {
  return tools.map((tool) => ({
    name: tool.name,
    label: tool.label ?? name,
    description: tool.description ?? "",
    parameters: tool.parameters,
    execute: async (toolCallId, params, onUpdate, _ctx, signal) => {
      // pi-coding-agent signature differs from pi-agent-core
      return await tool.execute(toolCallId, params, signal, onUpdate);
    },
  }));
}
```

### ツール分割戦略

`splitSdkTools()` はすべてのツールを `customTools` 経由で渡します。

```typescript
export function splitSdkTools(options: { tools: AnyAgentTool[]; sandboxEnabled: boolean }) {
  return {
    builtInTools: [], // Empty. We override everything
    customTools: toToolDefinitions(options.tools),
  };
}
```

これにより、OpenClaw の policy filtering、サンドボックス統合、拡張 toolset を provider ごとにぶらさず適用できます。

## システムプロンプトの構築

システムプロンプトは `buildAgentSystemPrompt()`（`system-prompt.ts`）で構築されます。Tooling、Tool Call Style、安全ガードレール、OpenClaw CLI リファレンス、Skills、Docs、Workspace、Sandbox、Messaging、Reply Tags、Voice、Silent Replies、Heartbeats、ランタイムメタデータに加え、有効時には Memory と Reactions、さらに任意の context file や追加 system prompt も含めて、完全なプロンプトを組み立てます。subagent 用の minimal prompt mode では、各セクションを短縮します。

プロンプトは、セッション作成後に `applySystemPromptOverrideToSession()` を通じて適用されます。

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## セッション管理

### セッションファイル

セッションは、ツリー構造（`id` / `parentId` のリンク）を持つ JSONL ファイルです。pi の `SessionManager` が永続化を処理します。

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

OpenClaw はこれを `guardSessionManager()` でラップし、tool result の取り扱いを安全側に寄せています。

### セッションキャッシュ

`session-manager-cache.ts` は `SessionManager` instance をキャッシュし、同じファイルの再解析を避けます。

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### 履歴制限

`limitHistoryTurns()` は、チャンネル種別（DM 対グループ）に応じて会話履歴を切り詰めます。

### Compaction

自動 compaction はコンテキストオーバーフロー時に発動します。`compactEmbeddedPiSessionDirect()` が手動 compaction を処理します。

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## 認証とモデル解決

### 認証プロファイル

OpenClaw は、provider ごとに複数の API key を持てる認証 profile store を維持します。

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

profile は、cooldown を追跡しながら失敗時にローテーションされます。

```typescript
await markAuthProfileFailure({ store, profileId, reason, cfg, agentDir });
const rotated = await advanceAuthProfile();
```

### モデル解決

```typescript
import { resolveModel } from "./pi-embedded-runner/model.js";

const { model, error, authStorage, modelRegistry } = resolveModel(
  provider,
  modelId,
  agentDir,
  config,
);

// Uses pi's ModelRegistry and AuthStorage
authStorage.setRuntimeApiKey(model.provider, apiKeyInfo.apiKey);
```

### フェイルオーバー

`FailoverError` は、設定されている場合に model fallback を発動します。

```typescript
if (fallbackConfigured && isFailoverErrorMessage(errorText)) {
  throw new FailoverError(errorText, {
    reason: promptFailoverReason ?? "unknown",
    provider,
    model: modelId,
    profileId,
    status: resolveFailoverStatus(promptFailoverReason),
  });
}
```

## Pi 拡張

OpenClaw は、特化した挙動を実現するためにカスタムの pi extension を読み込みます。

### Compaction Safeguard

`src/agents/pi-extensions/compaction-safeguard.ts` は、適応的な token budget に加えて、tool failure と file operation の要約を含む compaction の guardrail を追加します。

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### Context Pruning

`src/agents/pi-extensions/context-pruning.ts` は、Cache-TTL ベースの context pruning を実装します。

```typescript
if (cfg?.agents?.defaults?.contextPruning?.mode === "cache-ttl") {
  setContextPruningRuntime(params.sessionManager, {
    settings,
    contextWindowTokens,
    isToolPrunable,
    lastCacheTouchAt,
  });
  paths.push(resolvePiExtensionPath("context-pruning"));
}
```

## ストリーミングとブロック返信

### ブロックチャンク化

`EmbeddedBlockChunker` は、ストリーミングテキストを個別の返信ブロックへ分割して管理します。

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### Thinking / Final タグの除去

ストリーミング出力は、`<think>` / `<thinking>` ブロックを除去し、`<final>` の内容を抽出するよう処理されます。

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // Strip <think>...</think> content
  // If enforceFinalTag, only return <final>...</final> content
};
```

### 返信ディレクティブ

`[[media:url]]`、`[[voice]]`、`[[reply:id]]` のような返信ディレクティブは、解析されて抽出されます。

```typescript
const { text: cleanedText, mediaUrls, audioAsVoice, replyToId } = consumeReplyDirectives(chunk);
```

## エラー処理

### エラー分類

`pi-embedded-helpers.ts` は、後続処理を分岐させるために error を分類します。

```typescript
isContextOverflowError(errorText)     // Context too large
isCompactionFailureError(errorText)   // Compaction failed
isAuthAssistantError(lastAssistant)   // Auth failure
isRateLimitAssistantError(...)        // Rate limited
isFailoverAssistantError(...)         // Should failover
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### Thinking レベルのフォールバック

Thinking level がサポートされていない場合は、fallback します。

```typescript
const fallbackThinking = pickFallbackThinkingLevel({
  message: errorText,
  attempted: attemptedThinking,
});
if (fallbackThinking) {
  thinkLevel = fallbackThinking;
  continue;
}
```

## サンドボックス統合

サンドボックスモードが有効な場合、tool と path には制約が適用されます。

```typescript
const sandbox = await resolveSandboxContext({
  config: params.config,
  sessionKey: sandboxSessionKey,
  workspaceDir: resolvedWorkspace,
});

if (sandboxRoot) {
  // Use sandboxed read/edit/write tools
  // Exec runs in container
  // Browser uses bridge URL
}
```

## プロバイダー別の処理

### Anthropic

* Refusal の magic string 除去
* 連続する role に対するターン検証
* Claude Code のパラメーター互換性

### Google/Gemini

* ターン順序の修正（`applyGoogleTurnOrderingFix`）
* ツールスキーマのサニタイズ（`sanitizeToolsForGoogle`）
* セッション履歴のサニタイズ（`sanitizeSessionHistory`）

### OpenAI

* Codex モデル向けの `apply_patch` ツール
* Thinking レベルのダウングレード処理

## TUI 統合

OpenClaw には、`pi-tui` の component を直接使うローカル TUI mode もあります。

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

これにより、pi の native mode に近い対話型 terminal 体験を提供します。

## Pi CLI との主な違い

| Aspect          | Pi CLI                  | OpenClaw Embedded                                                                              |
| --------------- | ----------------------- | ---------------------------------------------------------------------------------------------- |
| Invocation      | `pi` command / RPC      | `createAgentSession()` 経由の SDK                                                                 |
| Tools           | Default coding tools    | カスタム OpenClaw ツールスイート                                                                          |
| System prompt   | AGENTS.md + prompts     | チャンネル/コンテキストごとに動的                                                                              |
| Session storage | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/`（または `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`） |
| Auth            | Single credential       | ローテーション付きマルチプロファイル                                                                             |
| Extensions      | Loaded from disk        | プログラム経由 + ディスクパス                                                                               |
| Event handling  | TUI rendering           | コールバックベース（onBlockReply など）                                                                     |

## 今後の検討事項

今後の再設計候補として、次の領域があります。

1. **ツールシグネチャの整合**: 現在は pi-agent-core と pi-coding-agent のシグネチャ差分を吸収している
2. **セッションマネージャーのラップ**: `guardSessionManager` は安全性を高める一方で複雑さも増やす
3. **拡張の読み込み**: pi の `ResourceLoader` をより直接的に使える可能性がある
4. **ストリーミングハンドラーの複雑化**: `subscribeEmbeddedPiSession` が大きくなってきている
5. **プロバイダー固有の癖**: pi 側で吸収できる可能性のあるプロバイダー別コードパスが多い

## テスト

Pi 統合のカバレッジは、次の test suite にまたがっています。

* `src/agents/pi-*.test.ts`
* `src/agents/pi-auth-json.test.ts`
* `src/agents/pi-embedded-*.test.ts`
* `src/agents/pi-embedded-helpers*.test.ts`
* `src/agents/pi-embedded-runner*.test.ts`
* `src/agents/pi-embedded-runner/**/*.test.ts`
* `src/agents/pi-embedded-subscribe*.test.ts`
* `src/agents/pi-tools*.test.ts`
* `src/agents/pi-tool-definition-adapter*.test.ts`
* `src/agents/pi-settings.test.ts`
* `src/agents/pi-extensions/**/*.test.ts`

ライブ/オプトイン:

* `src/agents/pi-embedded-runner-extraparams.live.test.ts`（`OPENCLAW_LIVE_TEST=1` を有効化）

現在の実行コマンドについては、[Pi 開発ワークフロー](/pi-dev)を参照してください。
