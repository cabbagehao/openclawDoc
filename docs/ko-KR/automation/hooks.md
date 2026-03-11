---
summary: "명령과 라이프사이클 이벤트를 위한 이벤트 기반 자동화 Hooks"
read_when:
  - `/new`, `/reset`, `/stop`, 에이전트 라이프사이클 이벤트용 자동화가 필요할 때
  - hooks를 만들거나 설치하거나 디버깅할 때
title: "Hooks"
x-i18n:
  source_path: "automation/hooks.md"
---

# Hooks

Hooks는 에이전트 명령과 이벤트에 반응해 작업을 자동화할 수 있도록 해 주는 확장 가능한 이벤트 기반 시스템입니다. OpenClaw에서 skills가 동작하는 방식과 유사하게, hook은 디렉터리에서 자동으로 발견되며 CLI 명령으로 관리할 수 있습니다.

## 빠르게 감 잡기

Hooks는 무언가가 일어났을 때 실행되는 작은 스크립트입니다. 두 종류가 있습니다.

- **Hooks**(이 페이지): `/new`, `/reset`, `/stop`, 또는 라이프사이클 이벤트처럼 에이전트 이벤트가 발생할 때 Gateway 내부에서 실행됩니다.
- **Webhooks**: 외부 시스템이 OpenClaw에 작업을 트리거할 수 있게 해 주는 외부 HTTP webhook입니다. [Webhook Hooks](/automation/webhook)을 참고하거나 Gmail helper 명령에는 `openclaw webhooks`를 사용하세요.

Hooks는 plugin 안에 번들로 포함될 수도 있습니다. [Plugins](/tools/plugin#plugin-hooks)를 참고하세요.

대표적인 사용 사례:

- 세션을 초기화할 때 memory snapshot 저장
- 문제 해결이나 컴플라이언스를 위한 명령 감사 로그 유지
- 세션 시작/종료 시 후속 자동화 트리거
- 이벤트 발생 시 에이전트 워크스페이스에 파일 쓰기 또는 외부 API 호출

작은 TypeScript 함수를 쓸 수 있다면 hook도 작성할 수 있습니다. Hooks는 자동으로 발견되며, CLI로 활성화 또는 비활성화합니다.

## 개요

hooks 시스템으로 할 수 있는 것:

- `/new`가 실행될 때 세션 컨텍스트를 memory에 저장
- 모든 명령을 감사 로그에 기록
- 에이전트 라이프사이클 이벤트에 커스텀 자동화 연결
- 코어 코드를 수정하지 않고 OpenClaw 동작 확장

## 시작하기

### 번들된 Hooks

OpenClaw는 자동으로 발견되는 4개의 번들 hook을 기본 제공합니다.

- **💾 session-memory**: `/new` 실행 시 에이전트 워크스페이스(기본값 `~/.openclaw/workspace/memory/`)에 세션 컨텍스트 저장
- **📎 bootstrap-extra-files**: `agent:bootstrap` 동안 설정된 glob/path 패턴에서 추가 워크스페이스 부트스트랩 파일 주입
- **📝 command-logger**: 모든 command 이벤트를 `~/.openclaw/logs/commands.log`에 기록
- **🚀 boot-md**: gateway 시작 시 `BOOT.md` 실행(내부 hooks 활성화 필요)

사용 가능한 hook 목록:

```bash
openclaw hooks list
```

hook 활성화:

```bash
openclaw hooks enable session-memory
```

hook 상태 확인:

```bash
openclaw hooks check
```

상세 정보 확인:

```bash
openclaw hooks info session-memory
```

### 온보딩

온보딩(`openclaw onboard`) 중에 권장 hooks를 활성화할지 묻게 됩니다. 마법사는 사용 가능한 hooks를 자동으로 발견해 선택할 수 있도록 보여줍니다.

## Hook 탐색

Hooks는 자동으로 다음 3개 디렉터리에서 발견됩니다(우선순위 순).

1. **워크스페이스 hooks**: `<workspace>/hooks/` (에이전트별, 우선순위 가장 높음)
2. **관리형 hooks**: `~/.openclaw/hooks/` (사용자 설치, 워크스페이스 간 공유)
3. **번들 hooks**: `<openclaw>/dist/hooks/bundled/` (OpenClaw와 함께 제공)

관리형 hook 디렉터리는 **단일 hook**일 수도 있고 **hook pack**(package directory)일 수도 있습니다.

각 hook은 다음 구조의 디렉터리입니다.

```
my-hook/
├── HOOK.md          # 메타데이터 + 문서
└── handler.ts       # 핸들러 구현
```

## Hook Pack (npm/archives)

Hook pack은 `package.json`의 `openclaw.hooks`를 통해 하나 이상의 hook을 export하는 표준 npm 패키지입니다. 다음 명령으로 설치합니다.

```bash
openclaw hooks install <path-or-spec>
```

npm spec은 registry 전용입니다(패키지 이름 + 선택적 정확한 버전 또는 dist-tag).
Git/URL/file spec과 semver range는 허용되지 않습니다.

bare spec과 `@latest`는 안정 버전 트랙에 머뭅니다. npm이 이 둘을 prerelease로 해석하면 OpenClaw는 이를 중단하고 `@beta` / `@rc` 같은 prerelease tag 또는 정확한 prerelease 버전으로 명시적 opt-in을 요구합니다.

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

각 항목은 `HOOK.md`와 `handler.ts`(또는 `index.ts`)를 포함한 hook 디렉터리를 가리킵니다.
Hook pack은 의존성을 포함할 수 있으며, `~/.openclaw/hooks/<id>` 아래에 설치됩니다.
각 `openclaw.hooks` 항목은 symlink 해석 후에도 패키지 디렉터리 내부에 있어야 하며, 탈출하는 항목은 거부됩니다.

보안 참고: `openclaw hooks install`은 의존성을 `npm install --ignore-scripts`로 설치합니다(lifecycle scripts 없음). hook pack 의존성 트리는 "순수 JS/TS" 위주로 유지하고, `postinstall` 빌드에 의존하는 패키지는 피하세요.

## Hook 구조

### HOOK.md 형식

`HOOK.md` 파일은 YAML frontmatter의 메타데이터와 Markdown 문서를 포함합니다.

```markdown
---
name: my-hook
description: "이 hook이 하는 일을 짧게 설명"
homepage: https://docs.openclaw.ai/automation/hooks#my-hook
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# My Hook

상세 문서는 여기에 적습니다...

## What It Does

- `/new` 명령을 감지
- 특정 작업 수행
- 결과 기록

## Requirements

- Node.js 설치 필요

## Configuration

추가 설정 없음.
```

### Metadata 필드

`metadata.openclaw` 객체가 지원하는 항목:

- **`emoji`**: CLI 표시용 이모지(예: `"💾"`)
- **`events`**: 감시할 이벤트 배열(예: `["command:new", "command:reset"]`)
- **`export`**: 사용할 named export(기본값 `"default"`)
- **`homepage`**: 문서 URL
- **`requires`**: 선택적 요구사항
  - **`bins`**: PATH에 있어야 하는 바이너리(예: `["git", "node"]`)
  - **`anyBins`**: 이 중 하나 이상이 존재해야 함
  - **`env`**: 필요한 환경 변수
  - **`config`**: 필요한 config 경로(예: `["workspace.dir"]`)
  - **`os`**: 필요한 플랫폼(예: `["darwin", "linux"]`)
- **`always`**: 적격성 검사 우회(boolean)
- **`install`**: 설치 방식(번들 hooks의 경우 `[{"id":"bundled","kind":"bundled"}]`)

### Handler 구현

`handler.ts` 파일은 `HookHandler` 함수를 export합니다.

```typescript
const myHandler = async (event) => {
  // 'new' 명령에서만 동작
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] New command triggered`);
  console.log(`  Session: ${event.sessionKey}`);
  console.log(`  Timestamp: ${event.timestamp.toISOString()}`);

  // 커스텀 로직

  // 필요하면 사용자에게 메시지 전송
  event.messages.push("✨ My hook executed!");
};

export default myHandler;
```

#### 이벤트 컨텍스트

각 이벤트에는 다음과 같은 컨텍스트가 포함됩니다.

```typescript
{
  type: 'command' | 'session' | 'agent' | 'gateway' | 'message',
  action: string,
  sessionKey: string,
  timestamp: Date,
  messages: string[],
  context: {
    sessionEntry?: SessionEntry,
    sessionId?: string,
    sessionFile?: string,
    commandSource?: string,
    senderId?: string,
    workspaceDir?: string,
    bootstrapFiles?: WorkspaceBootstrapFile[],
    cfg?: OpenClawConfig,
    from?: string,
    to?: string,
    content?: string,
    channelId?: string,
    success?: boolean,
  }
}
```

## 이벤트 유형

### Command 이벤트

에이전트 명령이 실행될 때 트리거됩니다.

- **`command`**: 모든 command 이벤트(일반 리스너)
- **`command:new`**: `/new` 명령 실행 시
- **`command:reset`**: `/reset` 명령 실행 시
- **`command:stop`**: `/stop` 명령 실행 시

### Session 이벤트

- **`session:compact:before`**: compaction이 history를 요약하기 직전
- **`session:compact:after`**: compaction 완료 후 요약 메타데이터와 함께

내부 hook payload는 이를 `type: "session"`과 `action: "compact:before"` / `action: "compact:after"`로 내보냅니다. 리스너는 위와 같은 결합 키로 등록합니다.
구체적 핸들러 등록은 `${type}:${action}` 형식을 사용하므로, `session:compact:before`와 `session:compact:after`로 등록해야 합니다.

### Agent 이벤트

- **`agent:bootstrap`**: 워크스페이스 부트스트랩 파일이 주입되기 전(hooks는 `context.bootstrapFiles`를 수정할 수 있음)

### Gateway 이벤트

gateway가 시작될 때 트리거됩니다.

- **`gateway:startup`**: 채널 시작 및 hooks 로딩 완료 후

### Message 이벤트

메시지를 수신하거나 전송할 때 트리거됩니다.

- **`message`**: 모든 message 이벤트(일반 리스너)
- **`message:received`**: 어떤 채널이든 인바운드 메시지를 받았을 때. 미디어 이해 전에 비교적 이른 시점에 실행되므로, 아직 처리되지 않은 미디어 첨부는 `<media:audio>` 같은 raw placeholder를 포함할 수 있습니다.
- **`message:transcribed`**: 오디오 전사와 링크 이해를 포함해 메시지가 완전히 처리된 뒤. 이 시점에는 오디오 메시지의 전체 전사 텍스트가 `transcript`에 들어 있습니다.
- **`message:preprocessed`**: 모든 메시지에 대해 미디어 + 링크 이해가 끝난 뒤 실행됩니다. 에이전트가 보기 전에 transcript, 이미지 설명, 링크 요약이 반영된 최종 body에 접근할 수 있습니다.
- **`message:sent`**: 아웃바운드 메시지가 성공적으로 전송됐을 때

#### Message 이벤트 컨텍스트

message 이벤트에는 메시지에 대한 풍부한 컨텍스트가 포함됩니다.

```typescript
// message:received context
{
  from: string,
  content: string,
  timestamp?: number,
  channelId: string,
  accountId?: string,
  conversationId?: string,
  messageId?: string,
  metadata?: {
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
  to: string,
  content: string,
  success: boolean,
  error?: string,
  channelId: string,
  accountId?: string,
  conversationId?: string,
  messageId?: string,
  isGroup?: boolean,
  groupId?: string,
}

// message:transcribed context
{
  body?: string,
  bodyForAgent?: string,
  transcript: string,
  channelId: string,
  conversationId?: string,
  messageId?: string,
}

// message:preprocessed context
{
  body?: string,
  bodyForAgent?: string,
  transcript?: string,
  channelId: string,
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

이 hooks는 이벤트 스트림 리스너가 아니라, OpenClaw가 tool result를 저장하기 전에 plugin이 동기식으로 조정할 수 있게 해 줍니다.

- **`tool_result_persist`**: tool result가 session transcript에 기록되기 전에 변환합니다. 동기식이어야 하며, 갱신된 tool result payload를 반환하거나 그대로 둘 경우 `undefined`를 반환합니다. [Agent Loop](/concepts/agent-loop)를 참고하세요.

### Plugin Hook Events

plugin hook runner를 통해 노출되는 compaction lifecycle hooks:

- **`before_compaction`**: compaction 전 count/token 메타데이터와 함께 실행
- **`after_compaction`**: compaction 후 summary 메타데이터와 함께 실행

### 향후 이벤트

계획 중인 이벤트 유형:

- **`session:start`**: 새 세션 시작 시
- **`session:end`**: 세션 종료 시
- **`agent:error`**: 에이전트 오류 발생 시

## 커스텀 Hooks 만들기

### 1. 위치 선택

- **Workspace hooks** (`<workspace>/hooks/`): 에이전트별, 우선순위 가장 높음
- **Managed hooks** (`~/.openclaw/hooks/`): 워크스페이스 간 공유

### 2. 디렉터리 구조 만들기

```bash
mkdir -p ~/.openclaw/hooks/my-hook
cd ~/.openclaw/hooks/my-hook
```

### 3. HOOK.md 작성

```markdown
---
name: my-hook
description: "유용한 일을 합니다"
metadata: { "openclaw": { "emoji": "🎯", "events": ["command:new"] } }
---

# My Custom Hook

`/new`를 실행하면 유용한 작업을 수행합니다.
```

### 4. handler.ts 작성

```typescript
const handler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log("[my-hook] Running!");
  // 로직 작성
};

export default handler;
```

### 5. 활성화 및 테스트

```bash
# hook이 발견되는지 확인
openclaw hooks list

# 활성화
openclaw hooks enable my-hook

# gateway 프로세스 재시작(macOS는 메뉴 바 앱 재시작, 개발 환경은 dev process 재시작)

# 이벤트 트리거
# 메시징 채널에서 /new 전송
```

## 설정

### 새 설정 형식(권장)

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

### hook별 설정

Hooks에는 커스텀 설정을 붙일 수 있습니다.

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

추가 디렉터리에서 hooks를 로드합니다.

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

### 레거시 설정 형식(여전히 지원)

기존 설정 형식도 하위 호환을 위해 계속 동작합니다.

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

참고: `module`은 워크스페이스 상대 경로여야 합니다. 절대 경로나 워크스페이스 밖으로 빠지는 traversal 경로는 거부됩니다.

**마이그레이션**: 새 hook은 discovery 기반 시스템을 사용하세요. 레거시 handlers는 디렉터리 기반 hooks 뒤에 로드됩니다.

## CLI 명령

### Hooks 목록

```bash
# 모든 hook 나열
openclaw hooks list

# 적격 hook만 보기
openclaw hooks list --eligible

# 자세한 출력(누락된 요구사항 표시)
openclaw hooks list --verbose

# JSON 출력
openclaw hooks list --json
```

### Hook 정보

```bash
# hook 상세 정보 보기
openclaw hooks info session-memory

# JSON 출력
openclaw hooks info session-memory --json
```

### 적격성 확인

```bash
# 적격성 요약
openclaw hooks check

# JSON 출력
openclaw hooks check --json
```

### 활성화/비활성화

```bash
# hook 활성화
openclaw hooks enable session-memory

# hook 비활성화
openclaw hooks disable command-logger
```

## 번들 hook 레퍼런스

### session-memory

`/new`를 실행할 때 세션 컨텍스트를 memory에 저장합니다.

**Events**: `command:new`

**Requirements**: `workspace.dir`가 설정돼 있어야 함

**Output**: `<workspace>/memory/YYYY-MM-DD-slug.md` (기본값 `~/.openclaw/workspace`)

**동작 방식**:

1. reset 전 세션 항목을 사용해 올바른 transcript 찾기
2. 최근 15줄 대화 추출
3. LLM으로 설명적인 파일명 slug 생성
4. 세션 메타데이터를 날짜 기반 memory 파일에 저장

**예시 출력**:

```markdown
# Session: 2026-01-16 14:30:00 UTC

- **Session Key**: agent:main:main
- **Session ID**: abc123def456
- **Source**: telegram
```

**파일명 예시**:

- `2026-01-16-vendor-pitch.md`
- `2026-01-16-api-design.md`
- `2026-01-16-1430.md` (slug 생성 실패 시 timestamp 폴백)

**활성화**:

```bash
openclaw hooks enable session-memory
```

### bootstrap-extra-files

`agent:bootstrap` 동안 추가 bootstrap 파일(예: monorepo 로컬 `AGENTS.md` / `TOOLS.md`)을 주입합니다.

**Events**: `agent:bootstrap`

**Requirements**: `workspace.dir`가 설정돼 있어야 함

**Output**: 파일을 쓰지 않으며, bootstrap context만 메모리상에서 수정

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

**참고**:

- 경로는 workspace 기준으로 해석됩니다.
- 파일은 workspace 내부에 있어야 합니다(realpath 검증).
- 인식된 bootstrap basename만 로드됩니다.
- subagent allowlist는 유지됩니다(`AGENTS.md`, `TOOLS.md`만).

**활성화**:

```bash
openclaw hooks enable bootstrap-extra-files
```

### command-logger

모든 command 이벤트를 중앙 감사 파일에 기록합니다.

**Events**: `command`

**Requirements**: 없음

**Output**: `~/.openclaw/logs/commands.log`

**동작 방식**:

1. command action, timestamp, session key, sender ID, source 등 이벤트 상세 수집
2. JSONL 형식 로그 파일에 추가
3. 백그라운드에서 조용히 실행

**예시 로그**:

```jsonl
{"timestamp":"2026-01-16T14:30:00.000Z","action":"new","sessionKey":"agent:main:main","senderId":"+1234567890","source":"telegram"}
{"timestamp":"2026-01-16T15:45:22.000Z","action":"stop","sessionKey":"agent:main:main","senderId":"user@example.com","source":"whatsapp"}
```

**로그 보기**:

```bash
# 최근 명령 보기
tail -n 20 ~/.openclaw/logs/commands.log

# jq로 보기 좋게 출력
cat ~/.openclaw/logs/commands.log | jq .

# action별 필터링
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**활성화**:

```bash
openclaw hooks enable command-logger
```

### boot-md

gateway 시작 후(`channels` 시작 뒤) `BOOT.md`를 실행합니다.
이 hook이 동작하려면 내부 hooks가 활성화돼 있어야 합니다.

**Events**: `gateway:startup`

**Requirements**: `workspace.dir`가 설정돼 있어야 함

**동작 방식**:

1. workspace의 `BOOT.md` 읽기
2. 에이전트 runner로 지시 실행
3. 필요하면 message tool로 outbound 메시지 전송

**활성화**:

```bash
openclaw hooks enable boot-md
```

## 모범 사례

### Handler는 빠르게 유지

hooks는 command 처리 중에 실행됩니다. 가볍게 유지하세요.

```typescript
// ✓ 좋음 - 비동기 작업, 즉시 반환
const handler: HookHandler = async (event) => {
  void processInBackground(event); // fire and forget
};

// ✗ 나쁨 - command 처리를 블로킹
const handler: HookHandler = async (event) => {
  await slowDatabaseQuery(event);
  await evenSlowerAPICall(event);
};
```

### 오류는 우아하게 처리

위험한 작업은 항상 감싸세요.

```typescript
const handler: HookHandler = async (event) => {
  try {
    await riskyOperation(event);
  } catch (err) {
    console.error("[my-handler] Failed:", err instanceof Error ? err.message : String(err));
    // throw하지 말고 다른 handler가 계속 실행되게 둠
  }
};
```

### 이벤트를 일찍 필터링

관련 없는 이벤트라면 빨리 반환하세요.

```typescript
const handler: HookHandler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  // 로직
};
```

### 구체적인 이벤트 키 사용

가능하면 metadata에 정확한 이벤트를 지정하세요.

```yaml
metadata: { "openclaw": { "events": ["command:new"] } } # 구체적
```

다음보다 낫습니다:

```yaml
metadata: { "openclaw": { "events": ["command"] } } # 일반적 - 오버헤드 큼
```

## 디버깅

### Hook 로깅 활성화

gateway는 시작 시 hook 로딩을 기록합니다.

```
Registered hook: session-memory -> command:new
Registered hook: bootstrap-extra-files -> agent:bootstrap
Registered hook: command-logger -> command
Registered hook: boot-md -> gateway:startup
```

### 탐색 상태 확인

발견된 hook 전체 목록:

```bash
openclaw hooks list --verbose
```

### 등록 확인

handler 안에 호출 로그를 넣어 확인할 수 있습니다.

```typescript
const handler: HookHandler = async (event) => {
  console.log("[my-handler] Triggered:", event.type, event.action);
  // 로직
};
```

### 적격성 확인

hook이 왜 적격하지 않은지 확인:

```bash
openclaw hooks info my-hook
```

출력에서 누락된 요구사항을 확인하세요.

## 테스트

### Gateway 로그

gateway 로그로 hook 실행을 확인합니다.

```bash
# macOS
./scripts/clawlog.sh -f

# 기타 플랫폼
tail -f ~/.openclaw/gateway.log
```

### Hooks 직접 테스트

handler를 분리해서 테스트할 수 있습니다.

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

  // 부수효과 검증
});
```

## 아키텍처

### 핵심 구성 요소

- **`src/hooks/types.ts`**: 타입 정의
- **`src/hooks/workspace.ts`**: 디렉터리 스캔 및 로딩
- **`src/hooks/frontmatter.ts`**: HOOK.md 메타데이터 파싱
- **`src/hooks/config.ts`**: 적격성 검사
- **`src/hooks/hooks-status.ts`**: 상태 보고
- **`src/hooks/loader.ts`**: 동적 모듈 로더
- **`src/cli/hooks-cli.ts`**: CLI 명령
- **`src/gateway/server-startup.ts`**: gateway 시작 시 hooks 로드
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

### Hook이 발견되지 않음

1. 디렉터리 구조 확인:

   ```bash
   ls -la ~/.openclaw/hooks/my-hook/
   # Should show: HOOK.md, handler.ts
   ```

2. HOOK.md 형식 확인:

   ```bash
   cat ~/.openclaw/hooks/my-hook/HOOK.md
   # name과 metadata가 있는 YAML frontmatter가 있어야 함
   ```

3. 발견된 hook 목록 확인:

   ```bash
   openclaw hooks list
   ```

### Hook이 적격하지 않음

요구사항 확인:

```bash
openclaw hooks info my-hook
```

다음 항목이 빠졌는지 확인하세요.

- 바이너리(PATH 확인)
- 환경 변수
- config 값
- OS 호환성

### Hook이 실행되지 않음

1. hook이 활성화돼 있는지 확인:

   ```bash
   openclaw hooks list
   # enabled hook 옆에 ✓ 표시
   ```

2. hooks를 다시 로드할 수 있도록 gateway 프로세스를 재시작합니다.

3. gateway 로그에서 오류 확인:

   ```bash
   ./scripts/clawlog.sh | grep hook
   ```

### Handler 오류

TypeScript/import 오류 확인:

```bash
# import 직접 테스트
node -e "import('./path/to/handler.ts').then(console.log)"
```

## 마이그레이션 가이드

### 레거시 설정에서 탐색 기반 방식으로

**기존 방식**:

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

**새 방식**:

1. hook 디렉터리 생성:

   ```bash
   mkdir -p ~/.openclaw/hooks/my-hook
   mv ./hooks/handlers/my-handler.ts ~/.openclaw/hooks/my-hook/handler.ts
   ```

2. HOOK.md 생성:

   ```markdown
   ---
   name: my-hook
   description: "My custom hook"
   metadata: { "openclaw": { "emoji": "🎯", "events": ["command:new"] } }
   ---

   # My Hook

   유용한 작업을 수행합니다.
   ```

3. config 업데이트:

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

4. 확인 후 gateway 프로세스 재시작:

   ```bash
   openclaw hooks list
   # Should show: 🎯 my-hook ✓
   ```

**마이그레이션 장점**:

- 자동 탐색
- CLI 관리
- 적격성 검사
- 더 나은 문서화
- 일관된 구조

## 함께 보기

- [CLI Reference: hooks](/cli/hooks)
- [Bundled Hooks README](https://github.com/openclaw/openclaw/tree/main/src/hooks/bundled)
- [Webhook Hooks](/automation/webhook)
- [Configuration](/gateway/configuration#hooks)
