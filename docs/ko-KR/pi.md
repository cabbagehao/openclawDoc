---
title: "Pi Integration Architecture"
summary: "Architecture of OpenClaw's embedded Pi agent integration and session lifecycle"
description: "OpenClaw가 Pi SDK를 subprocess 없이 내장 방식으로 통합하는 구조, session lifecycle, tool pipeline, auth·model failover 설계를 설명합니다."
read_when:
  - OpenClaw에서 Pi SDK 통합 구조를 이해할 때
  - Pi 기반 agent session lifecycle, tooling, provider wiring을 수정할 때
x-i18n:
  source_path: "pi.md"
---

# Pi Integration Architecture

이 문서는 OpenClaw가 [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent)와 관련 sibling package들(`pi-ai`, `pi-agent-core`, `pi-tui`)을 어떻게 통합해 AI agent capability를 제공하는지 설명합니다.

## Overview

OpenClaw는 pi SDK를 사용해 AI coding agent를 messaging gateway architecture 안에 직접 embed합니다. pi를 subprocess로 띄우거나 RPC mode를 쓰는 대신, OpenClaw는 `createAgentSession()`을 통해 pi의 `AgentSession`을 직접 import하고 instantiate합니다. 이 embedded 방식은 다음을 제공합니다.

- session lifecycle과 event handling에 대한 완전한 제어
- custom tool injection (messaging, sandbox, channel-specific actions)
- channel/context별 system prompt customization
- branching/compaction을 지원하는 session persistence
- failover를 포함한 multi-account auth profile rotation
- provider-agnostic model switching

## Package Dependencies

```json
{
  "@mariozechner/pi-agent-core": "0.49.3",
  "@mariozechner/pi-ai": "0.49.3",
  "@mariozechner/pi-coding-agent": "0.49.3",
  "@mariozechner/pi-tui": "0.49.3"
}
```

| Package           | Purpose                                                                                                |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| `pi-ai`           | 핵심 LLM abstraction: `Model`, `streamSimple`, message type, provider API                              |
| `pi-agent-core`   | agent loop, tool execution, `AgentMessage` type                                                        |
| `pi-coding-agent` | 상위 SDK: `createAgentSession`, `SessionManager`, `AuthStorage`, `ModelRegistry`, built-in tool 제공 |
| `pi-tui`          | terminal UI component (OpenClaw의 local TUI mode에서 사용)                                             |

## File Structure

```text
src/agents/
├── pi-embedded-runner.ts          # Re-exports from pi-embedded-runner/
├── pi-embedded-runner/
│   ├── run.ts                     # Main entry: runEmbeddedPiAgent()
│   ├── run/
│   │   ├── attempt.ts             # Single attempt logic with session setup
│   │   ├── params.ts              # RunEmbeddedPiAgentParams type
│   │   ├── payloads.ts            # Build response payloads from run results
│   │   ├── images.ts              # Vision model image injection
│   │   └── types.ts               # EmbeddedRunAttemptResult
│   ├── abort.ts                   # Abort error detection
│   ├── cache-ttl.ts               # Cache TTL tracking for context pruning
│   ├── compact.ts                 # Manual/auto compaction logic
│   ├── extensions.ts              # Load pi extensions for embedded runs
│   ├── extra-params.ts            # Provider-specific stream params
│   ├── google.ts                  # Google/Gemini turn ordering fixes
│   ├── history.ts                 # History limiting (DM vs group)
│   ├── lanes.ts                   # Session/global command lanes
│   ├── logger.ts                  # Subsystem logger
│   ├── model.ts                   # Model resolution via ModelRegistry
│   ├── runs.ts                    # Active run tracking, abort, queue
│   ├── sandbox-info.ts            # Sandbox info for system prompt
│   ├── session-manager-cache.ts   # SessionManager instance caching
│   ├── session-manager-init.ts    # Session file initialization
│   ├── system-prompt.ts           # System prompt builder
│   ├── tool-split.ts              # Split tools into builtIn vs custom
│   ├── types.ts                   # EmbeddedPiAgentMeta, EmbeddedPiRunResult
│   └── utils.ts                   # ThinkLevel mapping, error description
├── pi-embedded-subscribe.ts       # Session event subscription/dispatch
├── pi-embedded-subscribe.types.ts # SubscribeEmbeddedPiSessionParams
├── pi-embedded-subscribe.handlers.ts # Event handler factory
├── pi-embedded-subscribe.handlers.lifecycle.ts
├── pi-embedded-subscribe.handlers.types.ts
├── pi-embedded-block-chunker.ts   # Streaming block reply chunking
├── pi-embedded-messaging.ts       # Messaging tool sent tracking
├── pi-embedded-helpers.ts         # Error classification, turn validation
├── pi-embedded-helpers/           # Helper modules
├── pi-embedded-utils.ts           # Formatting utilities
├── pi-tools.ts                    # createOpenClawCodingTools()
├── pi-tools.abort.ts              # AbortSignal wrapping for tools
├── pi-tools.policy.ts             # Tool allowlist/denylist policy
├── pi-tools.read.ts               # Read tool customizations
├── pi-tools.schema.ts             # Tool schema normalization
├── pi-tools.types.ts              # AnyAgentTool type alias
├── pi-tool-definition-adapter.ts  # AgentTool -> ToolDefinition adapter
├── pi-settings.ts                 # Settings overrides
├── pi-extensions/                 # Custom pi extensions
│   ├── compaction-safeguard.ts    # Safeguard extension
│   ├── compaction-safeguard-runtime.ts
│   ├── context-pruning.ts         # Cache-TTL context pruning extension
│   └── context-pruning/
├── model-auth.ts                  # Auth profile resolution
├── auth-profiles.ts               # Profile store, cooldown, failover
├── model-selection.ts             # Default model resolution
├── models-config.ts               # models.json generation
├── model-catalog.ts               # Model catalog cache
├── context-window-guard.ts        # Context window validation
├── failover-error.ts              # FailoverError class
├── defaults.ts                    # DEFAULT_PROVIDER, DEFAULT_MODEL
├── system-prompt.ts               # buildAgentSystemPrompt()
├── system-prompt-params.ts        # System prompt parameter resolution
├── system-prompt-report.ts        # Debug report generation
├── tool-summaries.ts              # Tool description summaries
├── tool-policy.ts                 # Tool policy resolution
├── transcript-policy.ts           # Transcript validation policy
├── skills.ts                      # Skill snapshot/prompt building
├── skills/                        # Skill subsystem
├── sandbox.ts                     # Sandbox context resolution
├── sandbox/                       # Sandbox subsystem
├── channel-tools.ts               # Channel-specific tool injection
├── openclaw-tools.ts              # OpenClaw-specific tools
├── bash-tools.ts                  # exec/process tools
├── apply-patch.ts                 # apply_patch tool (OpenAI)
├── tools/                         # Individual tool implementations
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

## Core Integration Flow

### 1. Running an Embedded Agent

주요 진입점은 `pi-embedded-runner/run.ts`의 `runEmbeddedPiAgent()`입니다.

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

### 2. Session Creation

`runEmbeddedAttempt()` 내부에서 pi SDK로 session을 생성합니다.

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

### 3. Event Subscription

`subscribeEmbeddedPiSession()`은 pi의 `AgentSession` event를 구독합니다.

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

처리하는 event는 다음을 포함합니다.

- `message_start` / `message_end` / `message_update`
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `auto_compaction_start` / `auto_compaction_end`

### 4. Prompting

setup이 끝나면 session에 prompt를 보냅니다.

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

SDK는 이후 LLM 호출, tool execution, streaming response까지 전체 agent loop를 처리합니다.

image injection은 prompt-local 동작입니다. OpenClaw는 현재 prompt에 포함된 image ref만 읽어서 그 turn의 `images`에 전달하며, 오래된 history turn을 다시 훑어 image payload를 재주입하지는 않습니다.

## Tool Architecture

### Tool Pipeline

1. **Base Tools**: pi의 `codingTools` (read, bash, edit, write)
2. **Custom Replacements**: OpenClaw는 bash를 `exec`/`process`로 대체하고, sandbox에 맞게 read/edit/write를 조정
3. **OpenClaw Tools**: messaging, browser, canvas, sessions, cron, gateway 등
4. **Channel Tools**: Discord/Telegram/Slack/WhatsApp-specific action tools
5. **Policy Filtering**: profile/provider/agent/group/sandbox policy에 따라 tool 필터링
6. **Schema Normalization**: Gemini/OpenAI 특이점에 맞춰 schema 정리
7. **AbortSignal Wrapping**: abort signal을 존중하도록 tool wrapping

### Tool Definition Adapter

pi-agent-core의 `AgentTool`은 pi-coding-agent의 `ToolDefinition`과 `execute` signature가 다릅니다. `pi-tool-definition-adapter.ts`가 이를 연결합니다.

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

### Tool Split Strategy

`splitSdkTools()`는 모든 tool을 `customTools`로 넘깁니다.

```typescript
export function splitSdkTools(options: { tools: AnyAgentTool[]; sandboxEnabled: boolean }) {
  return {
    builtInTools: [], // Empty. We override everything
    customTools: toToolDefinitions(options.tools),
  };
}
```

이렇게 해야 OpenClaw의 policy filtering, sandbox integration, 확장 toolset이 provider에 상관없이 일관되게 유지됩니다.

## System Prompt Construction

system prompt는 `buildAgentSystemPrompt()` (`system-prompt.ts`)에서 구성됩니다. Tooling, Tool Call Style, Safety guardrail, OpenClaw CLI reference, Skills, Docs, Workspace, Sandbox, Messaging, Reply Tags, Voice, Silent Replies, Heartbeats, Runtime metadata 같은 section을 조합합니다. 필요하면 Memory, Reactions, context file, extra system prompt content도 추가됩니다. subagent에서 쓰는 minimal prompt mode에서는 section이 더 줄어듭니다.

session 생성 뒤에는 `applySystemPromptOverrideToSession()`으로 적용합니다.

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## Session Management

### Session Files

session은 tree 구조를 갖는 JSONL file입니다. (`id`/`parentId`로 연결) persistence는 pi의 `SessionManager`가 담당합니다.

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

OpenClaw는 tool result 안전성을 위해 `guardSessionManager()`로 이를 감쌉니다.

### Session Caching

`session-manager-cache.ts`는 반복 파일 파싱을 피하기 위해 `SessionManager` instance를 cache합니다.

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### History Limiting

`limitHistoryTurns()`는 channel type(DM vs group)에 따라 conversation history를 잘라냅니다.

### Compaction

context overflow가 발생하면 auto-compaction이 실행됩니다. 수동 compaction은 `compactEmbeddedPiSessionDirect()`가 처리합니다.

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## Authentication & Model Resolution

### Auth Profiles

OpenClaw는 provider마다 여러 API key를 가질 수 있는 auth profile store를 유지합니다.

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

failure가 발생하면 cooldown을 기록하면서 profile을 rotate합니다.

```typescript
await markAuthProfileFailure({ store, profileId, reason, cfg, agentDir });
const rotated = await advanceAuthProfile();
```

### Model Resolution

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

### Failover

설정에 fallback이 있으면 `FailoverError`가 model fallback을 트리거합니다.

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

## Pi Extensions

OpenClaw는 특수 동작을 위해 custom pi extension을 로드합니다.

### Compaction Safeguard

`src/agents/pi-extensions/compaction-safeguard.ts`는 adaptive token budgeting, tool failure summary, file operation summary 등을 포함해 compaction guardrail을 추가합니다.

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### Context Pruning

`src/agents/pi-extensions/context-pruning.ts`는 cache-TTL 기반 context pruning을 구현합니다.

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

## Streaming & Block Replies

### Block Chunking

`EmbeddedBlockChunker`는 streaming text를 discrete reply block으로 나눠 관리합니다.

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### Thinking/Final Tag Stripping

streaming output은 `<think>`/`<thinking>` block을 제거하고 `<final>` 내용만 추출하도록 가공됩니다.

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // Strip <think>...</think> content
  // If enforceFinalTag, only return <final>...</final> content
};
```

### Reply Directives

`[[media:url]]`, `[[voice]]`, `[[reply:id]]` 같은 reply directive도 파싱해서 분리합니다.

```typescript
const { text: cleanedText, mediaUrls, audioAsVoice, replyToId } = consumeReplyDirectives(chunk);
```

## Error Handling

### Error Classification

`pi-embedded-helpers.ts`는 error를 분류해 알맞게 처리합니다.

```typescript
isContextOverflowError(errorText)     // Context too large
isCompactionFailureError(errorText)   // Compaction failed
isAuthAssistantError(lastAssistant)   // Auth failure
isRateLimitAssistantError(...)        // Rate limited
isFailoverAssistantError(...)         // Should failover
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### Thinking Level Fallback

thinking level이 지원되지 않으면 fallback level로 내립니다.

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

## Sandbox Integration

sandbox mode가 켜져 있으면 tool과 path가 sandbox 범위로 제한됩니다.

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

## Provider-Specific Handling

### Anthropic

- refusal magic string scrubbing
- consecutive role에 대한 turn validation
- Claude Code parameter compatibility

### Google/Gemini

- turn ordering fix (`applyGoogleTurnOrderingFix`)
- tool schema sanitization (`sanitizeToolsForGoogle`)
- session history sanitization (`sanitizeSessionHistory`)

### OpenAI

- Codex model용 `apply_patch` tool
- thinking level downgrade handling

## TUI Integration

OpenClaw는 local TUI mode에서도 pi-tui component를 직접 사용합니다.

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

이 덕분에 pi native mode와 유사한 interactive terminal experience를 제공합니다.

## Key Differences from Pi CLI

| Aspect          | Pi CLI                  | OpenClaw Embedded                                                                              |
| --------------- | ----------------------- | ---------------------------------------------------------------------------------------------- |
| Invocation      | `pi` command / RPC      | `createAgentSession()` 기반 SDK integration                                                    |
| Tools           | Default coding tools    | OpenClaw custom tool suite                                                                     |
| System prompt   | AGENTS.md + prompts     | channel/context별 dynamic prompt                                                               |
| Session storage | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` 또는 `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/` |
| Auth            | Single credential       | rotation을 포함한 multi-profile                                                                |
| Extensions      | Loaded from disk        | programmatic + disk path                                                                       |
| Event handling  | TUI rendering           | callback 기반 (`onBlockReply` 등)                                                              |

## Future Considerations

향후 재작업을 고려할 수 있는 영역:

1. **Tool signature alignment**: 현재는 pi-agent-core와 pi-coding-agent의 signature 차이를 adapter로 메움
2. **Session manager wrapping**: `guardSessionManager`는 안전성을 주지만 복잡도도 높임
3. **Extension loading**: pi의 `ResourceLoader`를 더 직접 활용할 여지
4. **Streaming handler complexity**: `subscribeEmbeddedPiSession`가 점점 커지고 있음
5. **Provider quirks**: 여러 provider-specific codepath가 있고, 장기적으로는 pi 쪽에서 더 흡수할 수도 있음

## Tests

Pi integration coverage는 다음 suite에 걸쳐 있습니다.

- `src/agents/pi-*.test.ts`
- `src/agents/pi-auth-json.test.ts`
- `src/agents/pi-embedded-*.test.ts`
- `src/agents/pi-embedded-helpers*.test.ts`
- `src/agents/pi-embedded-runner*.test.ts`
- `src/agents/pi-embedded-runner/**/*.test.ts`
- `src/agents/pi-embedded-subscribe*.test.ts`
- `src/agents/pi-tools*.test.ts`
- `src/agents/pi-tool-definition-adapter*.test.ts`
- `src/agents/pi-settings.test.ts`
- `src/agents/pi-extensions/**/*.test.ts`

Live/opt-in:

- `src/agents/pi-embedded-runner-extraparams.live.test.ts` (`OPENCLAW_LIVE_TEST=1` 필요)

현재 실행 명령은 [Pi Development Workflow](/pi-dev)를 참고하세요.
