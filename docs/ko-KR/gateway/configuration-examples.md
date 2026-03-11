---
summary: "OpenClaw의 주요 사용 사례별 스키마 기반 설정 예시 모음"
read_when:
  - OpenClaw 설정 방법을 익히고자 할 때
  - 특정 환경에 맞는 구성 예시를 찾고 있을 때
  - 시스템을 처음으로 구축하고 설정할 때
title: "설정 예시"
x-i18n:
  source_path: "gateway/configuration-examples.md"
---

# 설정 예시 (Configuration Examples)

아래 예시들은 현재의 OpenClaw 설정 스키마를 준수함. 각 필드에 대한 상세 설명 및 전체 레퍼런스는 [Gateway 설정 가이드](/gateway/configuration)를 참조함.

## 빠른 시작 (Quick Start)

### 최소 요구 사양 구성

```json5
{
  agent: { workspace: "~/.openclaw/workspace" },
  channels: { whatsapp: { allowFrom: ["+821012345678"] } },
}
```

이 내용을 `~/.openclaw/openclaw.json` 파일에 저장하면, 등록된 번호를 통해 즉시 에이전트와 대화를 시작할 수 있음.

### 권장 초기 구성

```json5
{
  identity: {
    name: "Clawd",
    theme: "친절한 비서",
    emoji: "🦞",
  },
  agent: {
    workspace: "~/.openclaw/workspace",
    model: { primary: "anthropic/claude-3-5-sonnet-latest" },
  },
  channels: {
    whatsapp: {
      allowFrom: ["+821012345678"],
      groups: { "*": { requireMention: true } },
    },
  },
}
```

## 확장 구성 예시 (주요 옵션 포함)

> **팁**: JSON5 형식을 사용하면 주석을 달거나 마지막 항목 뒤에 쉼표를 붙일 수 있어 편리함. 물론 표준 JSON 형식도 완벽하게 지원함.

```json5
{
  // 환경 변수 및 셸 설정
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },

  // 인증 프로필 메타데이터 (비밀 정보는 auth-profiles.json에 별도 저장)
  auth: {
    profiles: {
      "anthropic:me@example.com": {
        provider: "anthropic",
        mode: "oauth",
        email: "me@example.com",
      },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai:default": { provider: "openai", mode: "api_key" },
      "openai-codex:default": { provider: "openai-codex", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:me@example.com", "anthropic:work"],
      openai: ["openai:default"],
      "openai-codex": ["openai-codex:default"],
    },
  },

  // 에이전트 정체성 (Identity)
  identity: {
    name: "Samantha",
    theme: "여유로운 나무늘보",
    emoji: "🦥",
  },

  // 로깅 설정
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty",
    redactSensitive: "tools",
  },

  // 메시지 포맷 및 상호작용
  messages: {
    messagePrefix: "[openclaw]",
    responsePrefix: ">",
    ackReaction: "👀",
    ackReactionScope: "group-mentions",
  },

  // 라우팅 및 대기열 제어
  routing: {
    groupChat: {
      mentionPatterns: ["@openclaw", "openclaw"],
      historyLimit: 50,
    },
    queue: {
      mode: "collect",
      debounceMs: 1000,
      cap: 20,
      drop: "summarize",
      byChannel: {
        whatsapp: "collect",
        telegram: "collect",
        discord: "collect",
        slack: "collect",
        signal: "collect",
        imessage: "collect",
        webchat: "collect",
      },
    },
  },

  // 도구 및 미디어 처리
  tools: {
    media: {
      audio: {
        enabled: true,
        maxBytes: 20971520,
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          // 선택 사항: 로컬 Whisper 바이너리 사용 시
          // { type: "cli", command: "whisper", args: ["--model", "base", "{{MediaPath}}"] }
        ],
        timeoutSeconds: 120,
      },
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-1.5-flash-preview" }],
      },
    },
  },

  // 세션 동작 정책
  session: {
    scope: "per-sender",
    reset: {
      mode: "daily",
      atHour: 4,
      idleMinutes: 60,
    },
    resetByChannel: {
      discord: { mode: "idle", idleMinutes: 10080 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/default/sessions/sessions.json",
    maintenance: {
      mode: "warn",
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d",
      maxDiskBytes: "500mb",
      highWaterBytes: "400mb",
    },
    typingIntervalSeconds: 5,
    sendPolicy: {
      default: "allow",
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
    },
  },

  // 채널별 상세 설정
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      allowFrom: ["+821012345678"],
      groupPolicy: "allowlist",
      groupAllowFrom: ["+821012345678"],
      groups: { "*": { requireMention: true } },
    },

    telegram: {
      enabled: true,
      botToken: "YOUR_TELEGRAM_BOT_TOKEN",
      allowFrom: ["123456789"],
      groupPolicy: "allowlist",
      groupAllowFrom: ["123456789"],
      groups: { "*": { requireMention: true } },
    },

    discord: {
      enabled: true,
      token: "YOUR_DISCORD_BOT_TOKEN",
      dm: { enabled: true, allowFrom: ["123456789012345678"] },
      guilds: {
        "123456789012345678": {
          slug: "openclaw-friends",
          requireMention: false,
          channels: {
            general: { allow: true },
            help: { allow: true, requireMention: true },
          },
        },
      },
    },

    slack: {
      enabled: true,
      botToken: "xoxb-REPLACE_ME",
      appToken: "xapp-REPLACE_ME",
      channels: {
        "#general": { allow: true, requireMention: true },
      },
      dm: { enabled: true, allowFrom: ["U12345"] },
      slashCommand: {
        enabled: true,
        name: "openclaw",
        sessionPrefix: "slack:slash",
        ephemeral: true,
      },
    },
  },

  // 에이전트 런타임 기본값
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
      userTimezone: "Asia/Seoul",
      model: {
        primary: "anthropic/claude-3-5-sonnet-latest",
        fallbacks: ["anthropic/claude-3-opus-latest", "openai/gpt-4o"],
      },
      imageModel: {
        primary: "openrouter/anthropic/claude-3-5-sonnet-latest",
      },
      models: {
        "anthropic/claude-3-opus-latest": { alias: "opus" },
        "anthropic/claude-3-5-sonnet-latest": { alias: "sonnet" },
        "openai/gpt-4o": { alias: "gpt" },
      },
      thinkingDefault: "low",
      verboseDefault: "off",
      elevatedDefault: "on",
      blockStreamingDefault: "off",
      blockStreamingBreak: "text_end",
      blockStreamingChunk: {
        minChars: 800,
        maxChars: 1200,
        breakPreference: "paragraph",
      },
      blockStreamingCoalesce: {
        idleMs: 1000,
      },
      humanDelay: {
        mode: "natural",
      },
      timeoutSeconds: 600,
      mediaMaxMb: 10,
      typingIntervalSeconds: 5,
      maxConcurrent: 3,
      heartbeat: {
        every: "30m",
        model: "anthropic/claude-3-5-sonnet-latest",
        target: "last",
        directPolicy: "allow",
        to: "+821012345678",
        prompt: "HEARTBEAT",
        ackMaxChars: 300,
      },
      memorySearch: {
        provider: "gemini",
        model: "gemini-embedding-001",
        remote: {
          apiKey: "${GEMINI_API_KEY}",
        },
        extraPaths: ["../team-docs", "/srv/shared-notes"],
      },
      sandbox: {
        mode: "non-main",
        perSession: true,
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
        },
        browser: {
          enabled: false,
        },
      },
    },
  },

  // 도구 권한 설정
  tools: {
    allow: ["exec", "process", "read", "write", "edit", "apply_patch"],
    deny: ["browser", "canvas"],
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
    },
    elevated: {
      enabled: true,
      allowFrom: {
        whatsapp: ["+821012345678"],
        telegram: ["123456789"],
        discord: ["123456789012345678"],
        slack: ["U12345"],
        signal: ["+821012345678"],
        imessage: ["user@example.com"],
        webchat: ["session:demo"],
      },
    },
  },

  // 커스텀 모델 공급자 등록
  models: {
    mode: "merge",
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-responses",
        authHeader: true,
        headers: { "X-Proxy-Region": "us-west" },
        models: [
          {
            id: "llama-3.1-8b",
            name: "Llama 3.1 8B",
            api: "openai-responses",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },

  // 크론(Cron) 예약 작업
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/cron.json",
    maxConcurrentRuns: 2,
    sessionRetention: "24h",
    runLog: {
      maxBytes: "2mb",
      keepLines: 2000,
    },
  },

  // 훅(Hooks) 및 외부 연동
  hooks: {
    enabled: true,
    path: "/hooks",
    token: "shared-secret",
    presets: ["gmail"],
    transformsDir: "~/.openclaw/hooks/transforms",
    mappings: [
      {
        id: "gmail-hook",
        match: { path: "gmail" },
        action: "agent",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate: "발신: {{messages[0].from}}\n제목: {{messages[0].subject}}",
        textTemplate: "{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        to: "+821012345678",
        thinking: "low",
        timeoutSeconds: 300,
        transform: {
          module: "gmail.js",
          export: "transformGmail",
        },
      },
    ],
    gmail: {
      account: "openclaw@gmail.com",
      label: "INBOX",
      topic: "projects/<project-id>/topics/gog-gmail-watch",
      subscription: "gog-gmail-watch-push",
      pushToken: "shared-push-token",
      hookUrl: "http://127.0.0.1:18789/hooks/gmail",
      includeBody: true,
      maxBytes: 20000,
      renewEveryMinutes: 720,
      serve: { bind: "127.0.0.1", port: 8788, path: "/" },
      tailscale: { mode: "funnel", path: "/gmail-pubsub" },
    },
  },

  // Gateway 서버 및 네트워크 설정
  gateway: {
    mode: "local",
    port: 18789,
    bind: "loopback",
    controlUi: { enabled: true, basePath: "/openclaw" },
    auth: {
      mode: "token",
      token: "gateway-token",
      allowTailscale: true,
    },
    tailscale: { mode: "serve", resetOnExit: false },
    remote: { url: "ws://gateway.tailnet:18789", token: "remote-token" },
    reload: { mode: "hybrid", debounceMs: 300 },
  },

  // 에이전트 스킬 관리
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm",
    },
    entries: {
      "nano-banana-pro": {
        enabled: true,
        apiKey: "GEMINI_KEY_HERE",
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
    },
  },
}
```

## 일반적인 설정 패턴

### 멀티 플랫폼 통합 환경

```json5
{
  agent: { workspace: "~/.openclaw/workspace" },
  channels: {
    whatsapp: { allowFrom: ["+821012345678"] },
    telegram: {
      enabled: true,
      botToken: "YOUR_TOKEN",
      allowFrom: ["123456789"],
    },
    discord: {
      enabled: true,
      token: "YOUR_TOKEN",
      dm: { allowFrom: ["123456789012345678"] },
    },
  },
}
```

### 보안 DM 모드 (공유 인박스 / 다중 사용자 환경)

봇에 접근할 수 있는 사용자가 여러 명인 경우(예: `allowFrom` 목록에 다수 등록, 다수의 페어링 승인 또는 `dmPolicy: "open"` 설정 시), 서로 다른 사용자의 대화 맥락이 섞이지 않도록 **보안 DM 모드**를 활성화함:

```json5
{
  // 보안 DM 모드 (다중 사용자 또는 민감한 대화 에이전트에게 강력 권장)
  session: { dmScope: "per-channel-peer" },

  channels: {
    // 예시: WhatsApp 다중 사용자 수신함
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+821012345678", "+821087654321"],
    },

    // 예시: Discord 다중 사용자 수신함
    discord: {
      enabled: true,
      token: "YOUR_DISCORD_BOT_TOKEN",
      dm: { enabled: true, allowFrom: ["123456789012345678", "987654321098765432"] },
    },
  },
}
```

Discord, Slack, Google Chat 등 대다수 채널의 발신자 인증은 ID 기반 매칭을 기본으로 함. 채널별 `dangerouslyAllowNameMatching: true` 설정은 이름이나 이메일이 도용될 위험을 충분히 인지한 경우에만 사용함.

### OAuth 및 API 키 장애 조치 (Failover)

```json5
{
  auth: {
    profiles: {
      "anthropic:subscription": {
        provider: "anthropic",
        mode: "oauth",
        email: "me@example.com",
      },
      "anthropic:api": {
        provider: "anthropic",
        mode: "api_key",
      },
    },
    order: {
      anthropic: ["anthropic:subscription", "anthropic:api"],
    },
  },
  agent: {
    workspace: "~/.openclaw/workspace",
    model: {
      primary: "anthropic/claude-3-5-sonnet-latest",
      fallbacks: ["anthropic/claude-3-opus-latest"],
    },
  },
}
```

### Anthropic 유료 구독 + API 키, MiniMax 폴백 구성

<Warning>
Anthropic 설정 토큰(setup-token)의 Claude Code 외부 사용은 과거 일부 사용자에게 제약이 발생한 사례가 있음. 사용 시 이 점을 유의하고 공급자의 최신 서비스 약관을 직접 확인하기 바람.
</Warning>

```json5
{
  auth: {
    profiles: {
      "anthropic:subscription": {
        provider: "anthropic",
        mode: "oauth",
        email: "user@example.com",
      },
      "anthropic:api": {
        provider: "anthropic",
        mode: "api_key",
      },
    },
    order: {
      anthropic: ["anthropic:subscription", "anthropic:api"],
    },
  },
  models: {
    providers: {
      minimax: {
        baseUrl: "https://api.minimax.io/anthropic",
        api: "anthropic-messages",
        apiKey: "${MINIMAX_API_KEY}",
      },
    },
  },
  agent: {
    workspace: "~/.openclaw/workspace",
    model: {
      primary: "anthropic/claude-3-5-sonnet-latest",
      fallbacks: ["minimax/MiniMax-M2.5"],
    },
  },
}
```

### 업무용 봇 (제한된 접근 권한)

```json5
{
  identity: {
    name: "WorkBot",
    theme: "전문적인 비서",
  },
  agent: {
    workspace: "~/work-openclaw",
    elevated: { enabled: false }, // 권한 상승 차단
  },
  channels: {
    slack: {
      enabled: true,
      botToken: "xoxb-...",
      channels: {
        "#engineering": { allow: true, requireMention: true },
        "#general": { allow: true, requireMention: true },
      },
    },
  },
}
```

### 로컬 모델 전용 구성

```json5
{
  agent: {
    workspace: "~/.openclaw/workspace",
    model: { primary: "lmstudio/minimax-m2.5-gs32" },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "minimax-m2.5-gs32",
            name: "MiniMax M2.5 GS32",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## 운영 팁

- `dmPolicy: "open"` 설정 시, 대응하는 `allowFrom` 목록에 반드시 `"*"` 항목이 포함되어 있어야 함.
- 공급자별 ID 형식(전화번호, 사용자 ID, 채널 ID 등)이 상이하므로, 각 채널별 문서를 통해 정확한 형식을 확인해야 함.
- 초기 구축 후 필요에 따라 `web`, `browser`, `ui`, `discovery`, `canvasHost`, `talk`, `signal`, `imessage` 등의 섹션을 점진적으로 추가할 수 있음.
- 심화 설정 노하우는 [공급자 허브](/providers) 및 [문제 해결 가이드](/gateway/troubleshooting)를 참조함.
