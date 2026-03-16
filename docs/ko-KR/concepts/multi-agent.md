---
summary: "Multi-agent routing: isolated agents, channel accounts, and bindings"
description: "하나의 Gateway에서 여러 agent를 분리 운영하면서 channel account와 binding으로 메시지를 라우팅하는 방식을 설명합니다."
title: "Multi-Agent Routing"
read_when: "하나의 Gateway process에서 workspace와 auth가 분리된 여러 agent를 운영하려고 할 때"
status: active
x-i18n:
  source_path: "concepts/multi-agent.md"
---

# Multi-Agent Routing

목표는 하나의 실행 중인 Gateway 안에서 여러 개의 **isolated agent**
(서로 다른 workspace + `agentDir` + session)를 운영하고,
여러 channel account(예: WhatsApp 두 개)를 함께 붙인 뒤 binding으로 inbound message를
적절한 agent에 routing하는 것입니다.

## What is "one agent"?

하나의 **agent**는 다음 요소를 모두 가진 완전한 독립 단위입니다.

- **Workspace**
  (file, `AGENTS.md`/`SOUL.md`/`USER.md`, local note, persona rule)
- auth profile, model registry, per-agent config를 담는 **state directory**
  (`agentDir`)
- `~/.openclaw/agents/<agentId>/sessions` 아래의 **session store**
  (chat history + routing state)

auth profile은 **agent별로 분리**됩니다. 각 agent는 자신의 다음 file을 읽습니다.

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

main agent의 credential은 자동으로 공유되지 않습니다. `agentDir`를 agent끼리
재사용하면 auth/session collision이 발생하므로 절대 공유하지 마세요. credential을
공유해야 하면 다른 agent의 `agentDir`로 `auth-profiles.json`을 복사하세요.

skill은 각 workspace의 `skills/`를 통해 agent별로 둘 수 있고, shared skill은
`~/.openclaw/skills`에서 함께 사용할 수 있습니다. 자세한 내용은
[Skills: per-agent vs shared](/tools/skills#per-agent-vs-shared-skills)를 참고하세요.

Gateway는 기본적으로 **one agent**만 호스팅할 수도 있고, 여러 agent를 나란히
운영할 수도 있습니다.

**Workspace note:** 각 agent의 workspace는 **default cwd**이지 hard sandbox는
아닙니다. relative path는 workspace 안에서 해석되지만, sandbox가 꺼져 있으면
absolute path로 host의 다른 위치에 접근할 수 있습니다.
[Sandboxing](/gateway/sandboxing)을 참고하세요.

## Paths (quick map)

- Config: `~/.openclaw/openclaw.json` (또는 `OPENCLAW_CONFIG_PATH`)
- State dir: `~/.openclaw` (또는 `OPENCLAW_STATE_DIR`)
- Workspace: `~/.openclaw/workspace`
  (또는 `~/.openclaw/workspace-<agentId>`)
- Agent dir: `~/.openclaw/agents/<agentId>/agent`
  (또는 `agents.list[].agentDir`)
- Sessions: `~/.openclaw/agents/<agentId>/sessions`

### Single-agent mode (default)

아무 설정도 하지 않으면 OpenClaw는 single-agent mode로 동작합니다.

- `agentId` 기본값은 **`main`**
- session key는 `agent:main:<mainKey>`
- workspace 기본값은 `~/.openclaw/workspace`
  (`OPENCLAW_PROFILE`이 있으면 `~/.openclaw/workspace-<profile>`)
- state 기본값은 `~/.openclaw/agents/main/agent`

## Agent helper

새 isolated agent를 추가하려면 agent wizard를 사용하세요.

```bash
openclaw agents add work
```

그 다음 inbound message를 routing하도록 `bindings`를 추가합니다.
확인은 다음 명령으로 할 수 있습니다.

```bash
openclaw agents list --bindings
```

## Quick start

<Steps>
  <Step title="Create each agent workspace">

wizard를 쓰거나 workspace를 직접 만들 수 있습니다.

```bash
openclaw agents add coding
openclaw agents add social
```

각 agent는 자신만의 workspace와 `SOUL.md`, `AGENTS.md`, optional `USER.md`,
그리고 `~/.openclaw/agents/<agentId>` 아래의 dedicated `agentDir`와 session store를
갖습니다.

  </Step>

  <Step title="Create channel accounts">

사용할 channel마다 agent별 account를 만듭니다.

- Discord: agent마다 bot을 하나씩 만들고, Message Content Intent를 켠 뒤 token을 복사
- Telegram: agent마다 BotFather로 bot을 만들고 token을 복사
- WhatsApp: account마다 phone number를 연결

```bash
openclaw channels login --channel whatsapp --account work
```

channel guide:
[Discord](/channels/discord), [Telegram](/channels/telegram),
[WhatsApp](/channels/whatsapp)

  </Step>

  <Step title="Add agents, accounts, and bindings">

`agents.list`에 agent를 추가하고, `channels.<channel>.accounts`에 account를 정의한 뒤,
`bindings`로 둘을 연결합니다.

  </Step>

  <Step title="Restart and verify">

```bash
openclaw gateway restart
openclaw agents list --bindings
openclaw channels status --probe
```

  </Step>
</Steps>

## Multiple agents = multiple people, multiple personalities

여러 agent를 운영하면 각 `agentId`는 **완전히 분리된 persona**가 됩니다.

- channel마다 **다른 phone number/account**
- workspace file(`AGENTS.md`, `SOUL.md`)마다 **다른 personality**
- **분리된 auth + session**
  (명시적으로 허용하지 않는 한 서로 섞이지 않음)

이렇게 하면 여러 사람이 하나의 Gateway server를 공유하면서도 자신의 AI "brain"과
data를 분리해서 사용할 수 있습니다.

## One WhatsApp number, multiple people (DM split)

**하나의 WhatsApp account**를 유지한 채, 서로 다른 WhatsApp DM을 서로 다른 agent로
보낼 수 있습니다. `peer.kind: "direct"`와 sender E.164
(예: `+15551234567`)를 기준으로 route합니다. 단, reply는 모두 같은 WhatsApp
number에서 나갑니다. agent별 sender identity는 없습니다.

중요한 점: direct chat은 agent의 **main session key**로 합쳐지므로, 진짜로 완전히
분리하려면 **사람마다 agent 하나씩** 두는 편이 맞습니다.

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

- DM access control은 agent별이 아니라 **WhatsApp account 전체 기준**입니다
  (pairing/allowlist)
- shared group은 한 agent에 bind하거나
  [Broadcast groups](/channels/broadcast-groups)를 사용하세요

## Routing rules (how messages pick an agent)

binding은 **deterministic**하며, **더 구체적인 규칙이 우선**합니다.

1. `peer` match
   (정확한 DM/group/channel id)
2. `parentPeer` match
   (thread inheritance)
3. `guildId + roles`
   (Discord role routing)
4. `guildId` (Discord)
5. `teamId` (Slack)
6. channel의 `accountId` match
7. channel-level match (`accountId: "*"`)
8. default agent fallback
   (`agents.list[].default`, 없으면 첫 항목, 기본값은 `main`)

같은 tier에서 여러 binding이 동시에 맞으면 config에서 먼저 나온 항목이 이깁니다.
하나의 binding이 `peer` + `guildId`처럼 여러 field를 지정하면, 지정한 field는 모두
일치해야 합니다 (`AND` semantics).

중요한 account-scope detail:

- `accountId`를 생략한 binding은 default account에만 적용됩니다
- channel 전체 fallback을 원하면 `accountId: "*"`를 사용하세요
- 나중에 같은 agent에 대해 explicit `accountId` binding을 추가하면, OpenClaw는 기존의
  channel-only binding을 복제하지 않고 account-scoped binding으로 승격시킵니다

## Multiple accounts / phone numbers

**여러 account**를 지원하는 channel
(예: WhatsApp)은 `accountId`로 각 login을 식별합니다.
각 `accountId`를 서로 다른 agent에 binding할 수 있으므로, 한 server에서 여러 phone
number를 운영해도 session이 섞이지 않습니다.

`accountId`가 생략됐을 때 channel-wide default account를 두고 싶다면
`channels.<channel>.defaultAccount`를 설정하세요. 설정하지 않으면 `default`가 있으면
그것을 쓰고, 없으면 정렬 순서상 첫 configured account id를 사용합니다.

이 패턴을 지원하는 대표 channel:

- `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`
- `irc`, `line`, `googlechat`, `mattermost`, `matrix`, `nextcloud-talk`
- `bluebubbles`, `zalo`, `zalouser`, `nostr`, `feishu`

## Concepts

- `agentId`: workspace, per-agent auth, per-agent session store를 가진 하나의 "brain"
- `accountId`: channel account 인스턴스 하나
  (예: WhatsApp `"personal"` vs `"biz"`)
- `binding`: `(channel, accountId, peer)`와 필요 시 guild/team id로 inbound message를
  특정 `agentId`에 route하는 규칙
- direct chat은 `agent:<agentId>:<mainKey>`로 collapse됨
  (agent별 main session, `session.mainKey`)

## Platform examples

### Discord bots per agent

각 Discord bot account는 고유한 `accountId`에 매핑됩니다. 각 account를 하나의 agent에
bind하고 bot별 allowlist를 유지하세요.

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

- 각 bot을 guild에 초대하고 Message Content Intent를 켜세요
- token은 `channels.discord.accounts.<id>.token`에 들어갑니다
  (default account는 `DISCORD_BOT_TOKEN`도 사용 가능)

### Telegram bots per agent

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

- BotFather로 agent마다 bot을 만들고 각 token을 복사하세요
- token은 `channels.telegram.accounts.<id>.botToken`에 들어갑니다
  (default account는 `TELEGRAM_BOT_TOKEN` 사용 가능)

### WhatsApp numbers per agent

gateway를 시작하기 전에 account마다 link합니다.

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

## Example: WhatsApp daily chat + Telegram deep work

channel 기준으로 분리해, WhatsApp은 빠른 everyday agent로, Telegram은 Opus agent로
route합니다.

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

- channel에 여러 account가 있으면 binding에 `accountId`를 추가하세요
  (예: `{ channel: "whatsapp", accountId: "personal" }`)
- WhatsApp의 특정 DM/group만 Opus로 보내고 나머지는 chat에 남기려면 그 peer에 대한
  `match.peer` binding을 추가하세요. peer match는 channel-wide rule보다 항상 우선합니다

## Example: same channel, one peer to Opus

WhatsApp 전체는 빠른 agent로 유지하되, 특정 DM 하나만 Opus로 route할 수 있습니다.

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

peer binding은 항상 우선하므로 channel-wide rule보다 위에 두세요.

## Family agent bound to a WhatsApp group

전용 family agent를 하나의 WhatsApp group에 bind하고, mention gating과 더 엄격한
tool policy를 적용할 수 있습니다.

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

- tool allow/deny list는 **skill이 아니라 tool**을 제한합니다. skill이 binary 실행이
  필요하다면 `exec`가 허용돼 있고 binary가 sandbox에 존재해야 합니다
- 더 엄격하게 제한하려면 `agents.list[].groupChat.mentionPatterns`를 설정하고,
  channel의 group allowlist도 유지하세요

## Per-Agent Sandbox and Tool Configuration

v2026.1.6부터는 agent마다 sandbox와 tool restriction을 따로 둘 수 있습니다.

```js
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: {
          mode: "off",
        },
      },
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",
          scope: "agent",
          docker: {
            setupCommand: "apt-get update && apt-get install -y git curl",
          },
        },
        tools: {
          allow: ["read"],
          deny: ["exec", "write", "edit", "apply_patch"],
        },
      },
    ],
  },
}
```

참고: `setupCommand`는 `sandbox.docker` 아래에 있으며 container가 생성될 때 한 번만
실행됩니다. resolved scope가 `"shared"`이면 agent별 `sandbox.docker.*` override는
무시됩니다.

**Benefits:**

- **Security isolation**: 신뢰할 수 없는 agent의 tool을 제한
- **Resource control**: 특정 agent만 sandbox에 두고 다른 agent는 host에서 유지
- **Flexible policies**: agent마다 다른 permission 적용

참고: `tools.elevated`는 **global**하고 sender-based인 설정이므로 agent별로 나눌 수
없습니다. agent별 경계를 원한다면 `agents.list[].tools`에서 `exec` 등을 deny하세요.
group targeting에는 `agents.list[].groupChat.mentionPatterns`를 사용하면 @mention이
의도한 agent에 깔끔하게 매핑됩니다.

자세한 예시는
[Multi-Agent Sandbox & Tools](/tools/multi-agent-sandbox-tools)를 참고하세요.
