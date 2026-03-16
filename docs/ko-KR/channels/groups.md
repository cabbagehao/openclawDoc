---
summary: "WhatsApp, Telegram, Discord, Slack 등에서 그룹 대화가 처리되는 방식과 접근 제어 개요"
description: "OpenClaw의 그룹 대화 정책, mention gating, allowlists, 세션 키, 채널별 차이점을 한국어로 정리한 안내 문서입니다."
read_when:
  - 그룹 대화 동작이나 mention gating을 변경할 때
title: "Groups"
x-i18n:
  source_path: "channels/groups.md"
---

# Groups

OpenClaw는 WhatsApp, Telegram, Discord, Slack, Signal, iMessage, Microsoft Teams, Zalo 등 여러 surface에서 그룹 대화를 일관된 방식으로 처리합니다.

## 초보자용 소개 (2분)

OpenClaw는 사용자의 기존 메시징 계정 위에서 동작합니다. 별도의 WhatsApp bot user가 있는 구조가 아닙니다.
**사용자 본인**이 그룹에 속해 있다면, OpenClaw도 그 그룹을 보고 այնտեղ서 응답할 수 있습니다.

기본 동작:

- 그룹은 제한된 상태로 동작합니다(`groupPolicy: "allowlist"`).
- mention gating을 명시적으로 끄지 않았다면, 응답하려면 mention이 필요합니다.

즉, allowlisted sender가 OpenClaw를 mention하면 트리거할 수 있습니다.

> TL;DR
>
> - **DM access**는 `*.allowFrom`으로 제어합니다.
> - **Group access**는 `*.groupPolicy` + allowlists(`*.groups`, `*.groupAllowFrom`)로 제어합니다.
> - **Reply triggering**은 mention gating(`requireMention`, `/activation`)으로 제어합니다.

빠른 흐름도(그룹 메시지에 무슨 일이 일어나는지):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

![Group message flow](/images/groups-flow.svg)

원하는 목표별 설정:

| Goal                                         | What to set                                                |
| -------------------------------------------- | ---------------------------------------------------------- |
| Allow all groups but only reply on @mentions | `groups: { "*": { requireMention: true } }`                |
| Disable all group replies                    | `groupPolicy: "disabled"`                                  |
| Only specific groups                         | `groups: { "<group-id>": { ... } }` (no `"*"` key)         |
| Only you can trigger in groups               | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## Session keys

- 그룹 세션은 `agent:<agentId>:<channel>:group:<id>` session key를 사용합니다(rooms/channels는 `agent:<agentId>:<channel>:channel:<id>` 사용).
- Telegram forum topics는 group id 뒤에 `:topic:<threadId>`를 추가하므로 각 topic이 자신의 세션을 가집니다.
- direct chat은 main session을 사용합니다(또는 설정에 따라 sender별 session을 사용).
- group session에는 heartbeat를 보내지 않습니다.

## Pattern: personal DMs + public groups (single agent)

가능합니다. 사용자의 "personal" 트래픽이 **DMs**이고 "public" 트래픽이 **groups**라면 잘 맞는 패턴입니다.

이유: single-agent mode에서는 DM이 보통 **main** session key(`agent:main:main`)로 들어가고, groups는 항상 **non-main** session key(`agent:main:<channel>:group:<id>`)를 사용합니다. sandboxing을 `mode: "non-main"`으로 켜면, group session은 Docker 안에서 실행되고 main DM session은 host에 남게 됩니다.

이렇게 하면 하나의 agent "brain"(shared workspace + memory)을 유지하면서도 실행 posture를 둘로 나눌 수 있습니다.

- **DMs**: full tools (host)
- **Groups**: sandbox + restricted tools (Docker)

> truly separate workspaces/personas가 필요하고 "personal"과 "public"이 절대로 섞이면 안 된다면, 두 번째 agent + bindings를 사용하세요. [Multi-Agent Routing](/concepts/multi-agent)를 참고하세요.

예시(DMs는 host, groups는 sandboxed + messaging-only tools):

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // groups/channels are non-main -> sandboxed
        scope: "session", // strongest isolation (one container per group/channel)
        workspaceAccess: "none",
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        // If allow is non-empty, everything else is blocked (deny still wins).
        allow: ["group:messaging", "group:sessions"],
        deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
      },
    },
  },
}
```

"groups가 folder X만 보게" 하고 싶고 "host access 없음"은 유지하고 싶다면, `workspaceAccess: "none"`을 유지한 채 allowlisted path만 sandbox에 mount하면 됩니다.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        scope: "session",
        workspaceAccess: "none",
        docker: {
          binds: [
            // hostPath:containerPath:mode
            "/home/user/FriendsShared:/data:ro",
          ],
        },
      },
    },
  },
}
```

관련 문서:

- configuration key와 기본값: [Gateway configuration](/gateway/configuration#agentsdefaultssandbox)
- tool이 왜 막혔는지 디버깅: [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated)
- bind mount 세부사항: [Sandboxing](/gateway/sandboxing#custom-bind-mounts)

## Display labels

- UI label은 가능하면 `displayName`을 사용하고, 형식은 `<channel>:<token>`입니다.
- `#room`은 rooms/channels 전용으로 예약되어 있고, group chat은 `g-<slug>`를 사용합니다(lowercase, spaces -> `-`, `#@+._-`는 유지).

## Group policy

채널별로 group/room message를 어떻게 처리할지 제어합니다.

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789"], // numeric Telegram user id (wizard can resolve @username)
    },
    signal: {
      groupPolicy: "disabled",
      groupAllowFrom: ["+15551234567"],
    },
    imessage: {
      groupPolicy: "disabled",
      groupAllowFrom: ["chat_id:123"],
    },
    msteams: {
      groupPolicy: "disabled",
      groupAllowFrom: ["user@org.com"],
    },
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        GUILD_ID: { channels: { help: { allow: true } } },
      },
    },
    slack: {
      groupPolicy: "allowlist",
      channels: { "#general": { allow: true } },
    },
    matrix: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["@owner:example.org"],
      groups: {
        "!roomId:example.org": { allow: true },
        "#alias:example.org": { allow: true },
      },
    },
  },
}
```

| Policy        | Behavior                                                     |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | Groups bypass allowlists; mention-gating still applies.      |
| `"disabled"`  | Block all group messages entirely.                           |
| `"allowlist"` | Only allow groups/rooms that match the configured allowlist. |

참고:

- `groupPolicy`는 mention-gating(@mention 필요 여부)과는 별개입니다.
- WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo는 `groupAllowFrom`을 사용합니다(fallback: 명시적인 `allowFrom`).
- DM pairing approvals(`*-allowFrom` store entries)은 DM access에만 적용됩니다. group sender authorization은 group allowlist에서 명시적으로 처리해야 합니다.
- Discord의 allowlist는 `channels.discord.guilds.<id>.channels`를 사용합니다.
- Slack의 allowlist는 `channels.slack.channels`를 사용합니다.
- Matrix의 allowlist는 `channels.matrix.groups`를 사용합니다(room ID, alias, name). sender 제한에는 `channels.matrix.groupAllowFrom`을 사용하며, room별 `users` allowlist도 지원합니다.
- group DM은 별도로 제어합니다(`channels.discord.dm.*`, `channels.slack.dm.*`).
- Telegram allowlist는 user ID(`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) 또는 username(`"@alice"` 또는 `"alice"`)과 매칭할 수 있습니다. prefix는 case-insensitive입니다.
- 기본값은 `groupPolicy: "allowlist"`입니다. group allowlist가 비어 있으면 group message는 차단됩니다.
- runtime safety를 위해 provider block 전체가 없을 때(`channels.<provider>` 없음), group policy는 `channels.defaults.groupPolicy`를 상속하지 않고 fail-closed mode(보통 `allowlist`)로 fallback합니다.

빠른 멘탈 모델(그룹 메시지 평가 순서):

1. `groupPolicy` (open/disabled/allowlist)
2. group allowlists(`*.groups`, `*.groupAllowFrom`, channel-specific allowlist)
3. mention gating(`requireMention`, `/activation`)

## Mention gating (default)

그룹 메시지는 group별로 override하지 않는 한 mention이 필요합니다. 기본값은 subsystem별 `*.groups."*"` 아래에 둡니다.

channel이 reply metadata를 지원한다면, bot message에 대한 reply는 암묵적인 mention으로 간주됩니다. 이 동작은 Telegram, WhatsApp, Slack, Discord, Microsoft Teams에 적용됩니다.

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
        "123@g.us": { requireMention: false },
      },
    },
    telegram: {
      groups: {
        "*": { requireMention: true },
        "123456789": { requireMention: false },
      },
    },
    imessage: {
      groups: {
        "*": { requireMention: true },
        "123": { requireMention: false },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          mentionPatterns: ["@openclaw", "openclaw", "\\+15555550123"],
          historyLimit: 50,
        },
      },
    ],
  },
}
```

참고:

- `mentionPatterns`는 case-insensitive regex입니다.
- explicit mention을 제공하는 surface는 그대로 통과하며, pattern은 fallback입니다.
- agent별 override는 `agents.list[].groupChat.mentionPatterns`를 사용합니다(여러 agent가 한 그룹을 공유할 때 유용함).
- mention gating은 mention detection이 가능한 경우에만 강제됩니다(native mention이 있거나 `mentionPatterns`가 설정된 경우).
- Discord 기본값은 `channels.discord.guilds."*"`에 두고 guild/channel별로 override할 수 있습니다.
- group history context는 채널 전반에 걸쳐 일관된 방식으로 감싸지며 **pending-only**입니다(mention gating 때문에 건너뛴 메시지). 전역 기본값은 `messages.groupChat.historyLimit`, override는 `channels.<channel>.historyLimit` 또는 `channels.<channel>.accounts.*.historyLimit`을 사용합니다. `0`으로 두면 비활성화됩니다.

## Group/channel tool restrictions (optional)

일부 channel config는 **특정 group/room/channel 안에서** 어떤 tool을 사용할 수 있는지 제한할 수 있습니다.

- `tools`: 그룹 전체에 대한 tool allow/deny
- `toolsBySender`: 그룹 안에서 sender별 override
  명시적인 key prefix를 사용합니다:
  `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>`, 그리고 `"*"` wildcard.

Legacy unprefixed key도 계속 허용되며, `id:`로만 매칭됩니다.

해결 순서(가장 구체적인 것이 우선):

1. group/channel `toolsBySender` match
2. group/channel `tools`
3. default (`"*"`) `toolsBySender` match
4. default (`"*"`) `tools`

예시(Telegram):

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { tools: { deny: ["exec"] } },
        "-1001234567890": {
          tools: { deny: ["exec", "read", "write"] },
          toolsBySender: {
            "id:123456789": { alsoAllow: ["exec"] },
          },
        },
      },
    },
  },
}
```

참고:

- group/channel tool restriction은 global/agent tool policy에 추가로 적용됩니다(deny가 여전히 우선함).
- 일부 channel은 room/channel nesting 구조가 다릅니다(예: Discord `guilds.*.channels.*`, Slack `channels.*`, MS Teams `teams.*.channels.*`).

## Group allowlists

`channels.whatsapp.groups`, `channels.telegram.groups`, `channels.imessage.groups`가 설정되어 있다면, 해당 key들이 group allowlist 역할을 합니다. `"*"`를 사용하면 모든 그룹을 허용하면서도 기본 mention 동작은 계속 설정할 수 있습니다.

자주 쓰는 의도별 예시(copy/paste):

1. 모든 그룹 응답 비활성화

```json5
{
  channels: { whatsapp: { groupPolicy: "disabled" } },
}
```

2. 특정 그룹만 허용(WhatsApp)

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "123@g.us": { requireMention: true },
        "456@g.us": { requireMention: false },
      },
    },
  },
}
```

3. 모든 그룹을 허용하되 mention 필요(명시적)

```json5
{
  channels: {
    whatsapp: {
      groups: { "*": { requireMention: true } },
    },
  },
}
```

4. 그룹에서는 owner만 트리거 가능(WhatsApp)

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
      groups: { "*": { requireMention: true } },
    },
  },
}
```

## Activation (owner-only)

group owner는 group별 activation을 전환할 수 있습니다.

- `/activation mention`
- `/activation always`

owner는 `channels.whatsapp.allowFrom`으로 판별합니다(없으면 bot 자신의 E.164를 사용). 명령은 독립된 메시지로 보내야 합니다. 현재 다른 surface는 `/activation`을 무시합니다.

## Context fields

group inbound payload는 다음 필드를 설정합니다.

- `ChatType=group`
- `GroupSubject` (알 수 있는 경우)
- `GroupMembers` (알 수 있는 경우)
- `WasMentioned` (mention gating 결과)
- Telegram forum topics는 `MessageThreadId`와 `IsForum`도 포함

agent system prompt는 새 group session의 첫 turn에 group 소개 문구를 포함합니다. 이 문구는 모델에게 사람처럼 응답하고, Markdown table을 피하고, literal `\n` 시퀀스를 그대로 입력하지 말라고 알려줍니다.

## iMessage specifics

- routing이나 allowlisting에는 `chat_id:<id>` 사용을 권장합니다.
- chat 목록 보기: `imsg chats --limit 20`.
- group reply는 항상 같은 `chat_id`로 돌아갑니다.

## WhatsApp specifics

WhatsApp 전용 동작(history injection, mention handling details)은 [Group messages](/channels/group-messages)를 참고하세요.
