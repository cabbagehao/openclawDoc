---
summary: "OpenClaw 훅 시스템과 명령어 및 라이프사이클 자동화"
description: "OpenClaw 훅의 탐색 순서, 설치와 활성화 방법, 지원 이벤트, 훅 작성 방식, 디버깅과 마이그레이션 절차를 설명합니다."
read_when:
  - /new, /reset, /stop 및 에이전트 라이프사이클 이벤트 자동화를 구성할 때
  - 훅을 작성, 설치, 활성화하거나 디버깅해야 할 때
title: "Hooks"
x-i18n:
  source_path: "automation/hooks.md"
---

# 훅 (Hooks)

훅은 에이전트 명령과 이벤트에 반응해 작업을 자동화할 수 있는 확장 가능한 이벤트 기반 시스템입니다. 훅은 디렉터리에서 자동으로 탐색되며, OpenClaw에서 스킬을 다루는 방식과 비슷하게 CLI 명령으로 관리할 수 있습니다.

## 빠르게 이해하기

훅은 어떤 일이 발생했을 때 실행되는 작은 스크립트입니다. 종류는 두 가지입니다.

- **Hooks**(이 페이지): `/new`, `/reset`, `/stop` 같은 명령이나 라이프사이클 이벤트가 발생할 때 Gateway 내부에서 실행됩니다.
- **Webhooks**: 다른 시스템이 OpenClaw에서 작업을 트리거할 수 있도록 하는 외부 HTTP webhook입니다. [Webhook Hooks](/automation/webhook)을 참고하거나 Gmail helper 명령을 위해 `openclaw webhooks`를 사용하세요.

훅은 플러그인 내부에 번들로 포함될 수도 있습니다. 자세한 내용은 [Plugins](/tools/plugin#plugin-hooks)를 참고하세요.

자주 쓰는 용도:

- 세션을 리셋할 때 메모리 스냅샷 저장
- 문제 해결이나 컴플라이언스를 위한 명령 감사 로그 유지
- 세션 시작 또는 종료 시 후속 자동화 실행
- 이벤트 발생 시 에이전트 워크스페이스에 파일을 쓰거나 외부 API 호출

작은 TypeScript 함수를 작성할 수 있다면 훅도 작성할 수 있습니다. 훅은 자동으로 탐색되며, CLI로 활성화하거나 비활성화합니다.

## 개요

훅 시스템으로 할 수 있는 일:

- `/new`가 실행될 때 세션 컨텍스트를 메모리에 저장
- 모든 명령을 감사용으로 기록
- 에이전트 라이프사이클 이벤트에 맞춰 커스텀 자동화 실행
- 코어 코드를 수정하지 않고 OpenClaw 동작 확장

## 시작하기

### 번들된 훅

OpenClaw에는 자동으로 탐색되는 네 가지 번들 훅이 포함되어 있습니다.

- **💾 session-memory**: `/new`를 실행하면 세션 컨텍스트를 에이전트 워크스페이스(기본값 `~/.openclaw/workspace/memory/`)에 저장합니다.
- **📎 bootstrap-extra-files**: `agent:bootstrap` 동안 설정된 glob/path 패턴에서 추가 워크스페이스 bootstrap 파일을 주입합니다.
- **📝 command-logger**: 모든 명령 이벤트를 `~/.openclaw/logs/commands.log`에 기록합니다.
- **🚀 boot-md**: gateway가 시작될 때 `BOOT.md`를 실행합니다. 내부 훅이 활성화되어 있어야 합니다.

사용 가능한 훅 목록 보기:

```bash
openclaw hooks list
```

훅 활성화:

```bash
openclaw hooks enable session-memory
```

훅 상태 확인:

```bash
openclaw hooks check
```

상세 정보 보기:

```bash
openclaw hooks info session-memory
```

### 온보딩

온보딩(`openclaw onboard`) 중에 권장 훅을 활성화할지 묻는 단계가 나옵니다. 이 마법사는 대상 훅을 자동으로 탐색해 선택할 수 있게 보여줍니다.

## 훅 탐색

훅은 세 개의 디렉터리에서 자동으로 탐색되며, 우선순위는 다음과 같습니다.

1. **Workspace hooks**: `<workspace>/hooks/` (에이전트별, 가장 높은 우선순위)
2. **Managed hooks**: `~/.openclaw/hooks/` (사용자 설치, 여러 워크스페이스에서 공유)
3. **Bundled hooks**: `<openclaw>/dist/hooks/bundled/` (OpenClaw와 함께 제공)

Managed hook 디렉터리는 **single hook**일 수도 있고 **hook pack**(패키지 디렉터리)일 수도 있습니다.

각 훅은 다음과 같은 디렉터리 구조를 가집니다.

```
my-hook/
├── HOOK.md          # Metadata + documentation
└── handler.ts       # Handler implementation
```

## Hook Packs (npm/archives)

Hook pack은 `package.json`의 `openclaw.hooks`를 통해 하나 이상의 훅을 내보내는 표준 npm 패키지입니다. 설치 명령:

```bash
openclaw hooks install <path-or-spec>
```

npm spec은 레지스트리 전용입니다. 패키지 이름과 선택적인 정확한 버전 또는 dist-tag만 허용됩니다.
Git/URL/file spec과 semver range는 거부됩니다.

bare spec과 `@latest`는 stable 트랙에 머뭅니다. npm이 둘 중 하나를 prerelease로 해석하면, OpenClaw는 중단하고 `@beta`/`@rc` 같은 prerelease tag 또는 정확한 prerelease 버전으로 명시적으로 opt in 하라고 요청합니다.

예시 `package.json`:

```json
{
  "name": "@acme/my-hooks",
  "version": "0.1.0",
  "openclaw": {
    "hooks": ["./hooks/my-hook", "./hooks/other-hook"]
  }
}
```

각 항목은 `HOOK.md`와 `handler.ts`(또는 `index.ts`)를 포함하는 hook 디렉터리를 가리킵니다.
Hook pack은 의존성을 포함할 수 있으며, 의존성은 `~/.openclaw/hooks/<id>` 아래에 설치됩니다.
각 `openclaw.hooks` 항목은 symlink 해석 이후에도 패키지 디렉터리 내부에 남아 있어야 하며, 밖으로 벗어나는 항목은 거부됩니다.

보안 참고: `openclaw hooks install`은 `npm install --ignore-scripts`로 의존성을 설치합니다.
즉 lifecycle script는 실행되지 않습니다. hook pack 의존성 트리는 "pure JS/TS"로 유지하고 `postinstall` 빌드가 필요한 패키지는 피하세요.

## 훅 구조

### HOOK.md 형식

`HOOK.md` 파일은 YAML frontmatter와 Markdown 문서로 이루어집니다.

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

### 메타데이터 필드

`metadata.openclaw` 객체는 다음을 지원합니다.

- **`emoji`**: CLI에 표시할 emoji (예: `"💾"`)
- **`events`**: 수신할 이벤트 배열 (예: `["command:new", "command:reset"]`)
- **`export`**: 사용할 named export (기본값 `"default"`)
- **`homepage`**: 문서 URL
- **`requires`**: 선택적 요구 사항
  - **`bins`**: PATH에 있어야 하는 바이너리 (예: `["git", "node"]`)
  - **`anyBins`**: 이 목록 중 최소 하나의 바이너리가 존재해야 함
  - **`env`**: 필요한 환경 변수
  - **`config`**: 필요한 config path (예: `["workspace.dir"]`)
  - **`os`**: 필요한 플랫폼 (예: `["darwin", "linux"]`)
- **`always`**: eligibility 검사 우회 여부 (boolean)
- **`install`**: 설치 방식 (번들 훅의 경우: `[{"id":"bundled","kind":"bundled"}]`)

### 핸들러 구현

`handler.ts` 파일은 `HookHandler` 함수를 export합니다.

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

#### 이벤트 컨텍스트

각 이벤트는 다음을 포함합니다.

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

## 이벤트 유형

### Command Events

에이전트 명령이 실행될 때 트리거됩니다.

- **`command`**: 모든 command 이벤트(일반 리스너)
- **`command:new`**: `/new` 명령이 실행될 때
- **`command:reset`**: `/reset` 명령이 실행될 때
- **`command:stop`**: `/stop` 명령이 실행될 때

### Session Events

- **`session:compact:before`**: compaction이 히스토리를 요약하기 직전
- **`session:compact:after`**: compaction이 summary metadata와 함께 완료된 뒤

내부 hook payload는 이 이벤트들을 `type: "session"`과 `action: "compact:before"` / `action: "compact:after"` 형태로 내보냅니다. 리스너는 위의 결합된 키로 구독합니다.
구체적인 handler 등록은 `${type}:${action}`라는 literal key 형식을 사용합니다. 이 이벤트의 경우 `session:compact:before`와 `session:compact:after`를 등록하세요.

### Agent Events

- **`agent:bootstrap`**: workspace bootstrap 파일이 주입되기 전 (`context.bootstrapFiles`를 hook이 수정할 수 있음)

### Gateway Events

gateway가 시작될 때 트리거됩니다.

- **`gateway:startup`**: 채널이 시작되고 hook이 로드된 뒤

### Message Events

메시지를 수신하거나 전송할 때 트리거됩니다.

- **`message`**: 모든 message 이벤트(일반 리스너)
- **`message:received`**: 어느 채널에서든 inbound message를 수신했을 때. media understanding 이전의 이른 처리 단계에서 발생합니다. 아직 처리되지 않은 미디어 첨부는 content에 `<media:audio>` 같은 raw placeholder로 들어 있을 수 있습니다.
- **`message:transcribed`**: 오디오 전사와 링크 이해를 포함해 메시지 처리가 완전히 끝났을 때. 이 시점에는 오디오 메시지의 전체 전사 텍스트가 `transcript`에 들어 있습니다. 전사된 오디오 콘텐츠가 필요하면 이 hook을 사용하세요.
- **`message:preprocessed`**: 모든 media + link understanding이 끝난 뒤 모든 메시지에 대해 발생합니다. 에이전트가 보기 전에, transcript와 이미지 설명, 링크 요약이 반영된 fully enriched body에 hook이 접근할 수 있습니다.
- **`message:sent`**: outbound message가 성공적으로 전송되었을 때

#### Message Event Context

message 이벤트에는 풍부한 message context가 포함됩니다.

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

#### 예시: Message Logger Hook

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

### Tool Result Hooks (Plugin API)

이 훅은 event-stream listener가 아닙니다. 플러그인이 OpenClaw가 tool result를 저장하기 전에 동기적으로 결과를 조정할 수 있게 해줍니다.

- **`tool_result_persist`**: tool result가 세션 transcript에 기록되기 전에 변환합니다. 반드시 동기식이어야 하며, 업데이트된 tool result payload를 반환하거나 그대로 유지하려면 `undefined`를 반환합니다. [Agent Loop](/concepts/agent-loop)를 참고하세요.

### Plugin Hook Events

plugin hook runner를 통해 노출되는 compaction 라이프사이클 훅입니다.

- **`before_compaction`**: count/token metadata와 함께 compaction 전에 실행
- **`after_compaction`**: compaction summary metadata와 함께 compaction 후에 실행

### Future Events

계획 중인 이벤트 유형:

- **`session:start`**: 새 세션이 시작될 때
- **`session:end`**: 세션이 종료될 때
- **`agent:error`**: 에이전트에서 오류가 발생할 때

## 커스텀 훅 만들기

### 1. 위치 선택

- **Workspace hooks** (`<workspace>/hooks/`): 에이전트별, 가장 높은 우선순위
- **Managed hooks** (`~/.openclaw/hooks/`): 여러 워크스페이스에서 공유

### 2. 디렉터리 구조 만들기

```bash
mkdir -p ~/.openclaw/hooks/my-hook
cd ~/.openclaw/hooks/my-hook
```

### 3. HOOK.md 만들기

```markdown
---
name: my-hook
description: "Does something useful"
metadata: { "openclaw": { "emoji": "🎯", "events": ["command:new"] } }
---

# My Custom Hook

This hook does something useful when you issue `/new`.
```

### 4. handler.ts 만들기

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

### 5. 활성화하고 테스트하기

```bash
# Verify hook is discovered
openclaw hooks list

# Enable it
openclaw hooks enable my-hook

# Restart your gateway process (menu bar app restart on macOS, or restart your dev process)

# Trigger the event
# Send /new via your messaging channel
```

## 설정

### 새 설정 형식 (권장)

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

### 훅별 설정

훅은 커스텀 설정을 가질 수 있습니다.

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

### 추가 디렉터리

추가 디렉터리에서 훅을 로드합니다.

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

### 레거시 설정 형식 (계속 지원됨)

이전 설정 형식도 하위 호환성을 위해 계속 동작합니다.

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

참고: `module`은 workspace-relative path여야 합니다. absolute path와 workspace 밖으로의 traversal은 거부됩니다.

**Migration**: 새 훅은 discovery 기반 시스템을 사용하세요. legacy handler는 디렉터리 기반 훅 다음에 로드됩니다.

## CLI 명령

### 훅 목록 보기

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

### 훅 정보

```bash
# Show detailed info about a hook
openclaw hooks info session-memory

# JSON output
openclaw hooks info session-memory --json
```

### Eligibility 확인

```bash
# Show eligibility summary
openclaw hooks check

# JSON output
openclaw hooks check --json
```

### 활성화/비활성화

```bash
# Enable a hook
openclaw hooks enable session-memory

# Disable a hook
openclaw hooks disable command-logger
```

## 번들 훅 참조

### session-memory

`/new`를 실행할 때 세션 컨텍스트를 메모리에 저장합니다.

**Events**: `command:new`

**Requirements**: `workspace.dir`이 설정되어 있어야 함

**Output**: `<workspace>/memory/YYYY-MM-DD-slug.md` (기본값 `~/.openclaw/workspace`)

**What it does**:

1. pre-reset session entry를 사용해 올바른 transcript를 찾습니다.
2. 대화의 마지막 15줄을 추출합니다.
3. LLM을 사용해 설명적인 filename slug를 생성합니다.
4. 세션 metadata를 날짜가 포함된 memory 파일에 저장합니다.

**Example output**:

```markdown
# Session: 2026-01-16 14:30:00 UTC

- **Session Key**: agent:main:main
- **Session ID**: abc123def456
- **Source**: telegram
```

**Filename examples**:

- `2026-01-16-vendor-pitch.md`
- `2026-01-16-api-design.md`
- `2026-01-16-1430.md` (slug 생성이 실패하면 fallback timestamp 사용)

**Enable**:

```bash
openclaw hooks enable session-memory
```

### bootstrap-extra-files

`agent:bootstrap` 동안 추가 bootstrap 파일(예: monorepo-local `AGENTS.md` / `TOOLS.md`)을 주입합니다.

**Events**: `agent:bootstrap`

**Requirements**: `workspace.dir`이 설정되어 있어야 함

**Output**: 파일은 쓰지 않으며 bootstrap context만 메모리에서 수정됩니다.

**Config**:

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

**Notes**:

- 경로는 workspace를 기준으로 해석됩니다.
- 파일은 workspace 내부에 머물러야 합니다(realpath 검사).
- 인식된 bootstrap basename만 로드됩니다.
- subagent allowlist는 유지됩니다(`AGENTS.md`와 `TOOLS.md`만).

**Enable**:

```bash
openclaw hooks enable bootstrap-extra-files
```

### command-logger

모든 command 이벤트를 중앙 audit 파일에 기록합니다.

**Events**: `command`

**Requirements**: 없음

**Output**: `~/.openclaw/logs/commands.log`

**What it does**:

1. 이벤트 세부 정보(command action, timestamp, session key, sender ID, source)를 수집합니다.
2. JSONL 형식으로 로그 파일에 append합니다.
3. 백그라운드에서 조용히 실행됩니다.

**Example log entries**:

```jsonl
{"timestamp":"2026-01-16T14:30:00.000Z","action":"new","sessionKey":"agent:main:main","senderId":"+1234567890","source":"telegram"}
{"timestamp":"2026-01-16T15:45:22.000Z","action":"stop","sessionKey":"agent:main:main","senderId":"user@example.com","source":"whatsapp"}
```

**View logs**:

```bash
# View recent commands
tail -n 20 ~/.openclaw/logs/commands.log

# Pretty-print with jq
cat ~/.openclaw/logs/commands.log | jq .

# Filter by action
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**Enable**:

```bash
openclaw hooks enable command-logger
```

### boot-md

gateway가 시작될 때(채널이 시작된 후) `BOOT.md`를 실행합니다.
이 훅을 실행하려면 internal hooks가 활성화되어 있어야 합니다.

**Events**: `gateway:startup`

**Requirements**: `workspace.dir`이 설정되어 있어야 함

**What it does**:

1. workspace에서 `BOOT.md`를 읽습니다.
2. agent runner를 통해 지시를 실행합니다.
3. message tool로 요청된 outbound message를 전송합니다.

**Enable**:

```bash
openclaw hooks enable boot-md
```

## 모범 사례

### 핸들러는 빠르게 유지하기

훅은 명령 처리 중에 실행됩니다. 가볍게 유지하세요.

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

### 오류를 우아하게 처리하기

위험한 작업은 항상 감싸세요.

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

### 이벤트를 일찍 필터링하기

관련 없는 이벤트라면 바로 반환하세요.

```typescript
const handler: HookHandler = async (event) => {
  // Only handle 'new' commands
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  // Your logic here
};
```

### 구체적인 이벤트 키 사용

가능하면 metadata에 정확한 이벤트를 지정하세요.

```yaml
metadata: { "openclaw": { "events": ["command:new"] } } # Specific
```

다음처럼 일반 키를 쓰기보다는:

```yaml
metadata: { "openclaw": { "events": ["command"] } } # General - more overhead
```

## 디버깅

### 훅 로깅 활성화

gateway는 시작 시 훅 로딩을 로그에 남깁니다.

```
Registered hook: session-memory -> command:new
Registered hook: bootstrap-extra-files -> agent:bootstrap
Registered hook: command-logger -> command
Registered hook: boot-md -> gateway:startup
```

### 탐색 확인

탐색된 모든 훅을 나열합니다.

```bash
openclaw hooks list --verbose
```

### 등록 확인

handler 안에서 호출 시점을 로그로 남깁니다.

```typescript
const handler: HookHandler = async (event) => {
  console.log("[my-handler] Triggered:", event.type, event.action);
  // Your logic
};
```

### Eligibility 검증

훅이 왜 eligible하지 않은지 확인합니다.

```bash
openclaw hooks info my-hook
```

출력에서 누락된 요구 사항을 확인하세요.

## 테스트

### Gateway 로그

훅 실행을 보려면 gateway 로그를 모니터링하세요.

```bash
# macOS
./scripts/clawlog.sh -f

# Other platforms
tail -f ~/.openclaw/gateway.log
```

### 훅 직접 테스트

handler를 격리해서 테스트할 수 있습니다.

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

## 아키텍처

### 핵심 구성 요소

- **`src/hooks/types.ts`**: 타입 정의
- **`src/hooks/workspace.ts`**: 디렉터리 스캔과 로딩
- **`src/hooks/frontmatter.ts`**: `HOOK.md` metadata 파싱
- **`src/hooks/config.ts`**: eligibility 검사
- **`src/hooks/hooks-status.ts`**: 상태 리포팅
- **`src/hooks/loader.ts`**: 동적 모듈 로더
- **`src/cli/hooks-cli.ts`**: CLI 명령
- **`src/gateway/server-startup.ts`**: gateway 시작 시 훅 로드
- **`src/auto-reply/reply/commands-core.ts`**: command 이벤트 트리거

### 탐색 흐름

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

### 이벤트 흐름

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

## 문제 해결

### 훅이 탐색되지 않음

1. 디렉터리 구조를 확인합니다.

   ```bash
   ls -la ~/.openclaw/hooks/my-hook/
   # Should show: HOOK.md, handler.ts
   ```

2. `HOOK.md` 형식을 검증합니다.

   ```bash
   cat ~/.openclaw/hooks/my-hook/HOOK.md
   # Should have YAML frontmatter with name and metadata
   ```

3. 탐색된 모든 훅을 나열합니다.

   ```bash
   openclaw hooks list
   ```

### 훅이 eligible하지 않음

요구 사항을 확인합니다.

```bash
openclaw hooks info my-hook
```

다음 항목 누락 여부를 확인하세요.

- 바이너리(PATH 확인)
- 환경 변수
- config 값
- OS 호환성

### 훅이 실행되지 않음

1. 훅이 활성화되어 있는지 확인합니다.

   ```bash
   openclaw hooks list
   # Should show ✓ next to enabled hooks
   ```

2. gateway 프로세스를 재시작해 훅을 다시 로드합니다.

3. 오류가 있는지 gateway 로그를 확인합니다.

   ```bash
   ./scripts/clawlog.sh | grep hook
   ```

### 핸들러 오류

TypeScript/import 오류를 확인합니다.

```bash
# Test import directly
node -e "import('./path/to/handler.ts').then(console.log)"
```

## 마이그레이션 가이드

### Legacy Config에서 Discovery로

**Before**:

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

**After**:

1. 훅 디렉터리를 만듭니다.

   ```bash
   mkdir -p ~/.openclaw/hooks/my-hook
   mv ./hooks/handlers/my-handler.ts ~/.openclaw/hooks/my-hook/handler.ts
   ```

2. `HOOK.md`를 만듭니다.

   ```markdown
   ---
   name: my-hook
   description: "My custom hook"
   metadata: { "openclaw": { "emoji": "🎯", "events": ["command:new"] } }
   ---

   # My Hook

   Does something useful.
   ```

3. config를 업데이트합니다.

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

4. 검증 후 gateway 프로세스를 재시작합니다.

   ```bash
   openclaw hooks list
   # Should show: 🎯 my-hook ✓
   ```

**Benefits of migration**:

- 자동 탐색
- CLI 관리
- eligibility 검사
