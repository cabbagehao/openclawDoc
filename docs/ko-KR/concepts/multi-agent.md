---
summary: "멀티 에이전트 라우팅: 격리된 에이전트, 채널 계정, 바인딩"
title: Multi-Agent Routing
read_when: "하나의 gateway 프로세스에서 여러 개의 격리된 에이전트(워크스페이스 + auth)를 원할 때."
status: active
---

# Multi-Agent Routing

목표: 하나의 실행 중인 Gateway 안에서 여러 개의 _격리된_ 에이전트(서로 다른
workspace + `agentDir` + sessions), 그리고 여러 채널 계정(예: WhatsApp 두
개)을 함께 운영하는 것입니다. 인바운드 메시지는 bindings를 통해 특정 에이전트로
라우팅됩니다.

## “하나의 에이전트”란?

**에이전트**는 다음을 각각 독립적으로 가지는 완전히 범위가 정해진 brain입니다.

- **Workspace** (파일, AGENTS.md/SOUL.md/USER.md, 로컬 메모, persona 규칙)
- auth profile, model registry, 에이전트별 config를 위한 **State directory** (`agentDir`)
- `~/.openclaw/agents/<agentId>/sessions` 아래의 **Session store** (채팅 기록 + 라우팅 상태)

Auth profile은 **에이전트별**입니다. 각 에이전트는 자신의 다음 경로에서만 읽습니다.

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

메인 에이전트 자격 증명은 자동으로 공유되지 않습니다. 에이전트 간에 `agentDir`를
절대로 재사용하지 마세요(auth/session 충돌이 발생합니다). 자격 증명을 공유하려면
다른 에이전트의 `agentDir`로 `auth-profiles.json`을 복사하세요.

Skills는 각 workspace의 `skills/` 폴더를 통해 에이전트별로 적용되며, 공용
skills는 `~/.openclaw/skills`에서 사용할 수 있습니다.
[Skills: per-agent vs shared](/tools/skills#per-agent-vs-shared-skills)를 참고하세요.

Gateway는 **하나의 에이전트**(기본값)만 호스팅할 수도 있고, 여러 에이전트를
나란히 호스팅할 수도 있습니다.

**Workspace 참고:** 각 에이전트의 workspace는 하드 샌드박스가 아니라 **기본 cwd**입니다.
상대 경로는 workspace 안에서 해석되지만, 샌드박싱이 활성화되지 않으면 절대 경로는
호스트의 다른 위치에 접근할 수 있습니다. [Sandboxing](/gateway/sandboxing)을
참고하세요.

## 경로 (빠른 맵)

- Config: `~/.openclaw/openclaw.json` (또는 `OPENCLAW_CONFIG_PATH`)
- State dir: `~/.openclaw` (또는 `OPENCLAW_STATE_DIR`)
- Workspace: `~/.openclaw/workspace` (또는 `~/.openclaw/workspace-<agentId>`)
- Agent dir: `~/.openclaw/agents/<agentId>/agent` (또는 `agents.list[].agentDir`)
- Sessions: `~/.openclaw/agents/<agentId>/sessions`

### 싱글 에이전트 모드 (기본값)

아무 설정도 하지 않으면 OpenClaw는 단일 에이전트로 실행됩니다.

- `agentId` 기본값은 **`main`**입니다.
- Sessions 키는 `agent:main:<mainKey>` 형식입니다.
- Workspace 기본값은 `~/.openclaw/workspace`입니다(`OPENCLAW_PROFILE`이 설정된 경우 `~/.openclaw/workspace-<profile>`).
- State 기본값은 `~/.openclaw/agents/main/agent`입니다.

## Agent helper

새로운 격리 에이전트를 추가하려면 agent wizard를 사용하세요.

```bash
openclaw agents add work
```

그런 다음 bindings를 추가해 인바운드 메시지를 라우팅하세요(또는 wizard에 맡기세요).

다음으로 확인합니다.

```bash
openclaw agents list --bindings
```

## 빠른 시작

<Steps>
  <Step title="각 에이전트 workspace 만들기">

wizard를 사용하거나 workspace를 수동으로 만드세요.

```bash
openclaw agents add coding
openclaw agents add social
```

각 에이전트는 `SOUL.md`, `AGENTS.md`, 선택적인 `USER.md`가 있는 자체 workspace를
가지며, `~/.openclaw/agents/<agentId>` 아래의 전용 `agentDir`와 session store도
함께 생성됩니다.

  </Step>

  <Step title="채널 계정 만들기">

선호하는 채널에서 에이전트당 하나의 계정을 만드세요.

- Discord: 에이전트당 하나의 bot을 만들고, Message Content Intent를 활성화한 뒤 각 token을 복사합니다.
- Telegram: 에이전트당 BotFather로 하나의 bot을 만들고 각 token을 복사합니다.
- WhatsApp: 계정별로 각 전화번호를 연결합니다.

```bash
openclaw channels login --channel whatsapp --account work
```

채널 가이드:
[Discord](/channels/discord), [Telegram](/channels/telegram), [WhatsApp](/channels/whatsapp)

  </Step>

  <Step title="에이전트, 계정, bindings 추가">

`agents.list` 아래에 에이전트를, `channels.<channel>.accounts` 아래에 채널 계정을
추가하고, `bindings`로 둘을 연결하세요(예시는 아래 참고).

  </Step>

  <Step title="재시작 및 확인">

```bash
openclaw gateway restart
openclaw agents list --bindings
openclaw channels status --probe
```

  </Step>
</Steps>

## 여러 에이전트 = 여러 사람, 여러 성격

**여러 에이전트**를 사용하면 각 `agentId`가 **완전히 격리된 persona**가 됩니다.

- **서로 다른 전화번호/계정** (채널별 `accountId`)
- **서로 다른 성격** (`AGENTS.md`, `SOUL.md` 같은 에이전트별 workspace 파일)
- **분리된 auth + sessions** (명시적으로 활성화하지 않는 한 교차 간섭 없음)

이를 통해 **여러 사람**이 하나의 Gateway 서버를 공유하면서도 자신의 AI “brain”과
데이터를 서로 격리된 상태로 유지할 수 있습니다.

## 하나의 WhatsApp 번호, 여러 사람 (DM 분리)

**하나의 WhatsApp 계정**을 유지하면서도 **서로 다른 WhatsApp DM**을 서로 다른
에이전트로 라우팅할 수 있습니다. 발신자 E.164(예: `+15551234567`)와
`peer.kind: "direct"`로 매칭합니다. 응답은 여전히 같은 WhatsApp 번호에서
나갑니다(에이전트별 발신자 identity는 없음).

중요한 세부 사항: direct chat은 에이전트의 **main session key**로 합쳐지므로,
진정한 격리를 위해서는 **사람당 하나의 에이전트**가 필요합니다.

예시:

```json5
{
  agents: {
    list: [
      { id: "alex", workspace: "~/.openclaw/workspace-alex" },
      { id: "mia", workspace: "~/.openclaw/workspace-mia" },
    ],
  },
  bindings: [
    {
      agentId: "alex",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551230001" } },
    },
    {
      agentId: "mia",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551230002" } },
    },
  ],
  channels: {
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551230001", "+15551230002"],
    },
  },
}
```

참고:

- DM 접근 제어는 에이전트별이 아니라 **WhatsApp 계정 전체 단위**(pairing/allowlist)입니다.
- 공유 그룹에는 그룹을 하나의 에이전트에 바인딩하거나 [Broadcast groups](/channels/broadcast-groups)를 사용하세요.

## 라우팅 규칙 (메시지가 에이전트를 선택하는 방식)

Bindings는 **결정적**이며 **가장 구체적인 규칙이 우선**합니다.

1. `peer` match (정확한 DM/group/channel id)
2. `parentPeer` match (thread inheritance)
3. `guildId + roles` (Discord role routing)
4. `guildId` (Discord)
5. `teamId` (Slack)
6. 채널의 `accountId` match
7. 채널 레벨 match (`accountId: "*"`)
8. 기본 에이전트로 폴백 (`agents.list[].default`, 없으면 첫 번째 list entry, 기본값: `main`)

같은 tier 안에서 여러 binding이 매칭되면 config 순서상 첫 번째가 이깁니다.
하나의 binding이 여러 match 필드(예: `peer` + `guildId`)를 설정하면, 지정된 모든
필드가 필요합니다(`AND` semantics).

중요한 account scope 세부 사항:

- `accountId`를 생략한 binding은 기본 계정에만 매칭됩니다.
- 모든 계정에 대한 채널 전역 폴백에는 `accountId: "*"`를 사용하세요.
- 이후 같은 에이전트에 대해 동일한 binding을 명시적 account id와 함께 추가하면, OpenClaw는 기존의 채널 전용 binding을 중복 생성하는 대신 account-scoped binding으로 업그레이드합니다.

## 여러 계정 / 여러 전화번호

**여러 계정**을 지원하는 채널(예: WhatsApp)은 각 로그인 식별에 `accountId`를
사용합니다. 각 `accountId`는 서로 다른 에이전트로 라우팅될 수 있으므로, 하나의
서버에서 세션을 섞지 않고 여러 전화번호를 호스팅할 수 있습니다.

`accountId`가 생략되었을 때 채널 전역 기본 계정을 원한다면
`channels.<channel>.defaultAccount`(선택 사항)를 설정하세요. 설정하지 않으면
OpenClaw는 `default`가 있으면 그것으로, 없으면 구성된 첫 번째 account id(정렬 후)로 폴백합니다.

이 패턴을 지원하는 일반적인 채널:

- `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`
- `irc`, `line`, `googlechat`, `mattermost`, `matrix`, `nextcloud-talk`
- `bluebubbles`, `zalo`, `zalouser`, `nostr`, `feishu`

## 개념

- `agentId`: 하나의 “brain” (workspace, 에이전트별 auth, 에이전트별 session store)
- `accountId`: 하나의 채널 계정 인스턴스 (예: WhatsApp 계정 `"personal"` vs `"biz"`)
- `binding`: `(channel, accountId, peer)` 및 선택적인 guild/team id로 인바운드 메시지를 `agentId`로 라우팅
- Direct chat은 `agent:<agentId>:<mainKey>`(에이전트별 “main”; `session.mainKey`)로 합쳐집니다.

## 플랫폼 예시

### 에이전트별 Discord bot

각 Discord bot 계정은 고유한 `accountId`에 매핑됩니다. 각 계정을 에이전트에
바인딩하고, bot별 allowlist를 유지하세요.

```json5
{
  agents: {
    list: [
      { id: "main", workspace: "~/.openclaw/workspace-main" },
      { id: "coding", workspace: "~/.openclaw/workspace-coding" },
    ],
  },
  bindings: [
    { agentId: "main", match: { channel: "discord", accountId: "default" } },
    { agentId: "coding", match: { channel: "discord", accountId: "coding" } },
  ],
  channels: {
    discord: {
      groupPolicy: "allowlist",
      accounts: {
        default: {
          token: "DISCORD_BOT_TOKEN_MAIN",
          guilds: {
            "123456789012345678": {
              channels: {
                "222222222222222222": { allow: true, requireMention: false },
              },
            },
          },
        },
        coding: {
          token: "DISCORD_BOT_TOKEN_CODING",
          guilds: {
            "123456789012345678": {
              channels: {
                "333333333333333333": { allow: true, requireMention: false },
              },
            },
          },
        },
      },
    },
  },
}
```

참고:

- 각 bot을 guild에 초대하고 Message Content Intent를 활성화하세요.
- Token은 `channels.discord.accounts.<id>.token`에 위치합니다(기본 계정은 `DISCORD_BOT_TOKEN`을 사용할 수 있음).

### 에이전트별 Telegram bot

```json5
{
  agents: {
    list: [
      { id: "main", workspace: "~/.openclaw/workspace-main" },
      { id: "alerts", workspace: "~/.openclaw/workspace-alerts" },
    ],
  },
  bindings: [
    { agentId: "main", match: { channel: "telegram", accountId: "default" } },
    { agentId: "alerts", match: { channel: "telegram", accountId: "alerts" } },
  ],
  channels: {
    telegram: {
      accounts: {
        default: {
          botToken: "123456:ABC...",
          dmPolicy: "pairing",
        },
        alerts: {
          botToken: "987654:XYZ...",
          dmPolicy: "allowlist",
          allowFrom: ["tg:123456789"],
        },
      },
    },
  },
}
```

참고:

- BotFather로 에이전트당 하나의 bot을 만들고 각 token을 복사하세요.
- Token은 `channels.telegram.accounts.<id>.botToken`에 위치합니다(기본 계정은 `TELEGRAM_BOT_TOKEN`을 사용할 수 있음).

### 에이전트별 WhatsApp 번호

gateway를 시작하기 전에 각 계정을 연결하세요.

```bash
openclaw channels login --channel whatsapp --account personal
openclaw channels login --channel whatsapp --account biz
```

`~/.openclaw/openclaw.json` (JSON5):

```js
{
  agents: {
    list: [
      {
        id: "home",
        default: true,
        name: "Home",
        workspace: "~/.openclaw/workspace-home",
        agentDir: "~/.openclaw/agents/home/agent",
      },
      {
        id: "work",
        name: "Work",
        workspace: "~/.openclaw/workspace-work",
        agentDir: "~/.openclaw/agents/work/agent",
      },
    ],
  },

  // Deterministic routing: first match wins (most-specific first).
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },

    // Optional per-peer override (example: send a specific group to work agent).
    {
      agentId: "work",
      match: {
        channel: "whatsapp",
        accountId: "personal",
        peer: { kind: "group", id: "1203630...@g.us" },
      },
    },
  ],

  // Off by default: agent-to-agent messaging must be explicitly enabled + allowlisted.
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },

  channels: {
    whatsapp: {
      accounts: {
        personal: {
          // Optional override. Default: ~/.openclaw/credentials/whatsapp/personal
          // authDir: "~/.openclaw/credentials/whatsapp/personal",
        },
        biz: {
          // Optional override. Default: ~/.openclaw/credentials/whatsapp/biz
          // authDir: "~/.openclaw/credentials/whatsapp/biz",
        },
      },
    },
  },
}
```

## 예시: WhatsApp 일상 대화 + Telegram 딥 워크

채널별 분리: WhatsApp은 빠른 일상용 에이전트로, Telegram은 Opus 에이전트로
라우팅합니다.

```json5
{
  agents: {
    list: [
      {
        id: "chat",
        name: "Everyday",
        workspace: "~/.openclaw/workspace-chat",
        model: "anthropic/claude-sonnet-4-5",
      },
      {
        id: "opus",
        name: "Deep Work",
        workspace: "~/.openclaw/workspace-opus",
        model: "anthropic/claude-opus-4-6",
      },
    ],
  },
  bindings: [
    { agentId: "chat", match: { channel: "whatsapp" } },
    { agentId: "opus", match: { channel: "telegram" } },
  ],
}
```

참고:

- 채널에 여러 계정이 있다면 binding에 `accountId`를 추가하세요(예: `{ channel: "whatsapp", accountId: "personal" }`).
- 나머지는 chat에 두고 특정 DM/group 하나만 Opus로 라우팅하려면, 해당 peer에 대한 `match.peer` binding을 추가하세요. peer match는 항상 채널 전역 규칙보다 우선합니다.

## 예시: 같은 채널에서 하나의 peer만 Opus로

WhatsApp은 빠른 에이전트에 유지하되, 하나의 DM만 Opus로 라우팅합니다.

```json5
{
  agents: {
    list: [
      {
        id: "chat",
        name: "Everyday",
        workspace: "~/.openclaw/workspace-chat",
        model: "anthropic/claude-sonnet-4-5",
      },
      {
        id: "opus",
        name: "Deep Work",
        workspace: "~/.openclaw/workspace-opus",
        model: "anthropic/claude-opus-4-6",
      },
    ],
  },
  bindings: [
    {
      agentId: "opus",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551234567" } },
    },
    { agentId: "chat", match: { channel: "whatsapp" } },
  ],
}
```

Peer binding은 항상 우선하므로, 채널 전역 규칙보다 위에 두세요.

## WhatsApp 그룹에 바인딩된 family agent

전용 family agent를 하나의 WhatsApp 그룹에 바인딩하고, mention gating과 더
엄격한 tool policy를 적용할 수 있습니다.

```json5
{
  agents: {
    list: [
      {
        id: "family",
        name: "Family",
        workspace: "~/.openclaw/workspace-family",
        identity: { name: "Family Bot" },
        groupChat: {
          mentionPatterns: ["@family", "@familybot", "@Family Bot"],
        },
        sandbox: {
          mode: "all",
          scope: "agent",
        },
        tools: {
          allow: [
            "exec",
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "browser", "canvas", "nodes", "cron"],
        },
      },
    ],
  },
  bindings: [
    {
      agentId: "family",
      match: {
        channel: "whatsapp",
        peer: { kind: "group", id: "120363999999999999@g.us" },
      },
    },
  ],
}
```

참고:

- Tool allow/deny 목록은 **skill**이 아니라 **tool** 기준입니다. 어떤 skill이
  binary 실행이 필요하다면 `exec`가 허용되어 있고, 해당 binary가 sandbox 안에
  존재하는지 확인하세요.
- 더 엄격하게 제어하려면 `agents.list[].groupChat.mentionPatterns`를 설정하고,
  채널의 group allowlist를 활성화한 상태로 유지하세요.

## 에이전트별 Sandbox 및 Tool 설정

v2026.1.6부터 각 에이전트는 자체 sandbox와 tool 제한을 가질 수 있습니다.

```js
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: {
          mode: "off",  // No sandbox for personal agent
        },
        // No tool restrictions - all tools available
      },
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",     // Always sandboxed
          scope: "agent",  // One container per agent
          docker: {
            // Optional one-time setup after container creation
            setupCommand: "apt-get update && apt-get install -y git curl",
          },
        },
        tools: {
          allow: ["read"],                    // Only read tool
          deny: ["exec", "write", "edit", "apply_patch"],    // Deny others
        },
      },
    ],
  },
}
```

참고: `setupCommand`는 `sandbox.docker` 아래에 있으며, container 생성 시 한 번만 실행됩니다.
해석된 scope가 `"shared"`일 때는 에이전트별 `sandbox.docker.*` override가 무시됩니다.

**장점:**

- **보안 격리**: 신뢰할 수 없는 에이전트의 tool을 제한
- **리소스 제어**: 일부 에이전트만 sandbox로 격리하고 나머지는 host에 유지
- **유연한 정책**: 에이전트별로 서로 다른 권한

참고: `tools.elevated`는 **전역**이며 sender 기반입니다. 에이전트별로 구성할 수 없습니다.
에이전트별 경계를 원한다면 `agents.list[].tools`로 `exec`를 deny하세요.
그룹 타기팅에는 `agents.list[].groupChat.mentionPatterns`를 사용해 @mention이
의도한 에이전트에 깔끔하게 매핑되도록 하세요.

자세한 예시는 [Multi-Agent Sandbox & Tools](/tools/multi-agent-sandbox-tools)를 참고하세요.
