---
summary: "여러 채널에서의 그룹 채팅 동작(WhatsApp/Telegram/Discord/Slack/Signal/iMessage/Microsoft Teams/Zalo)"
read_when:
  - 그룹 채팅 동작이나 멘션 gating을 바꿀 때
title: "그룹"
x-i18n:
  source_path: "channels/groups.md"
---

# 그룹

OpenClaw는 WhatsApp, Telegram, Discord, Slack, Signal, iMessage, Microsoft Teams, Zalo 등 여러 채널에서 그룹 채팅을 일관된 방식으로 다룹니다.

## 입문 안내 (2분)

OpenClaw는 여러분 자신의 메시징 계정 안에 “살아” 있습니다. 별도의 WhatsApp 봇 사용자가 있는 것이 아닙니다.
**여러분**이 어떤 그룹에 들어가 있다면, OpenClaw도 그 그룹을 볼 수 있고 그 안에서 응답할 수 있습니다.

기본 동작:

- 그룹은 제한됩니다 (`groupPolicy: "allowlist"`).
- 명시적으로 mention gating을 끄지 않았다면, 응답에는 멘션이 필요합니다.

즉, allowlist된 발신자가 OpenClaw를 멘션해야 트리거할 수 있습니다.

> TL;DR
>
> - **DM 접근**은 `*.allowFrom`으로 제어합니다.
> - **그룹 접근**은 `*.groupPolicy` + allowlist(`*.groups`, `*.groupAllowFrom`)로 제어합니다.
> - **응답 트리거**는 mention gating(`requireMention`, `/activation`)으로 제어합니다.

빠른 흐름(그룹 메시지에 무슨 일이 일어나는가):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

![Group message flow](/images/groups-flow.svg)

원하는 것이...

| 목표                                     | 설정 값                                                    |
| ---------------------------------------- | ---------------------------------------------------------- |
| 모든 그룹을 허용하되 @mention에서만 응답 | `groups: { "*": { requireMention: true } }`                |
| 모든 그룹 응답 비활성화                  | `groupPolicy: "disabled"`                                  |
| 특정 그룹만 허용                         | `groups: { "<group-id>": { ... } }` (`"*"` 키 없음)        |
| 그룹에서 나만 트리거 가능                | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## Session key

- 그룹 세션은 `agent:<agentId>:<channel>:group:<id>` session key를 사용합니다(rooms/channels는 `agent:<agentId>:<channel>:channel:<id>` 사용).
- Telegram forum topic은 그룹 ID 뒤에 `:topic:<threadId>`를 붙여 topic마다 독립 세션을 가집니다.
- 직접 채팅은 main session을 사용합니다(또는 설정돼 있다면 발신자별 session).
- 그룹 session에서는 heartbeat를 건너뜁니다.

## 패턴: 개인 DM + 공개 그룹(단일 에이전트)

네, “개인” 트래픽이 **DM**이고 “공개” 트래픽이 **그룹**이라면 이 패턴은 잘 작동합니다.

이유: 단일 에이전트 모드에서 DM은 보통 **main** session key(`agent:main:main`)로 들어가고, 그룹은 항상 **non-main** session key(`agent:main:<channel>:group:<id>`)를 사용합니다. `mode: "non-main"`으로 sandboxing을 켜면 그룹 session은 Docker 안에서 실행되고 main DM session은 호스트에 남습니다.

이렇게 하면 하나의 에이전트 “brain”(공유 workspace + memory)을 유지하면서도 실행 자세는 둘로 나눌 수 있습니다.

- **DM**: 전체 도구(호스트)
- **그룹**: sandbox + 제한된 도구(Docker)

> 진짜로 별도 workspace/persona가 필요하다면(“개인”과 “공개”가 절대 섞이면 안 된다면) 두 번째 agent + bindings를 사용하세요. [Multi-Agent Routing](/concepts/multi-agent)을 참고하세요.

예시(DM은 host, 그룹은 sandbox + 메시징 전용 도구):

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // groups/channels are non-main -> sandboxed
        scope: "session", // 가장 강한 격리(그룹/채널당 컨테이너 하나)
        workspaceAccess: "none",
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        // allow가 비어 있지 않으면 나머지는 모두 차단됩니다(deny가 여전히 우선).
        allow: ["group:messaging", "group:sessions"],
        deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
      },
    },
  },
}
```

“호스트 접근 없음” 대신 “그룹은 폴더 X만 볼 수 있게” 하고 싶다면 `workspaceAccess: "none"`을 유지하고 허용한 경로만 sandbox에 마운트하세요.

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

관련:

- 설정 키와 기본값: [Gateway configuration](/gateway/configuration#agentsdefaultssandbox)
- 어떤 도구가 왜 차단됐는지 디버깅: [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated)
- bind mount 상세: [Sandboxing](/gateway/sandboxing#custom-bind-mounts)

## 표시 레이블

- UI 레이블은 가능하면 `displayName`을 사용하며, 형식은 `<channel>:<token>`입니다.
- `#room`은 room/channel용 예약값이고, 그룹 채팅은 `g-<slug>`를 사용합니다(소문자, 공백은 `-`, `#@+._-`는 유지).

## 그룹 정책

채널별로 그룹/룸 메시지를 어떻게 처리할지 제어합니다.

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789"], // 숫자형 Telegram user id (wizard가 @username 해석 가능)
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

| 정책          | 동작                                                            |
| ------------- | --------------------------------------------------------------- |
| `"open"`      | 그룹은 allowlist를 우회하지만 mention gating은 계속 적용됩니다. |
| `"disabled"`  | 모든 그룹 메시지를 완전히 차단합니다.                           |
| `"allowlist"` | 설정된 allowlist와 일치하는 그룹/룸만 허용합니다.               |

참고:

- `groupPolicy`는 mention-gating(@mentions 필요)과 별개입니다.
- WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo는 `groupAllowFrom`을 사용합니다(fallback: 명시적 `allowFrom`).
- DM pairing 승인(`*-allowFrom` 저장소 항목)은 DM 접근에만 적용되며, 그룹 발신자 인증은 그룹 allowlist에 명시적으로 남아야 합니다.
- Discord: allowlist는 `channels.discord.guilds.<id>.channels`를 사용합니다.
- Slack: allowlist는 `channels.slack.channels`를 사용합니다.
- Matrix: allowlist는 `channels.matrix.groups`(room ID, alias, name)를 사용합니다. 발신자 제한에는 `channels.matrix.groupAllowFrom`을 쓰며, room별 `users` allowlist도 지원합니다.
- Group DM은 별도로 제어됩니다(`channels.discord.dm.*`, `channels.slack.dm.*`).
- Telegram allowlist는 user ID(`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) 또는 username(`"@alice"` 또는 `"alice"`)과 매치될 수 있습니다. 접두사는 대소문자를 구분하지 않습니다.
- 기본값은 `groupPolicy: "allowlist"`입니다. 그룹 allowlist가 비어 있으면 그룹 메시지는 차단됩니다.
- 런타임 안전성: provider 블록 자체가 완전히 없으면(`channels.<provider>` 부재), group policy는 `channels.defaults.groupPolicy`를 상속하지 않고 fail-closed 모드(보통 `allowlist`)로 fallback합니다.

빠른 멘탈 모델(그룹 메시지 평가 순서):

1. `groupPolicy` (open/disabled/allowlist)
2. 그룹 allowlist(`*.groups`, `*.groupAllowFrom`, 채널별 allowlist)
3. mention gating(`requireMention`, `/activation`)

## Mention gating (기본값)

그룹 메시지는 그룹별 override가 없는 한 기본적으로 멘션이 필요합니다. 기본값은 각 하위 시스템의 `*.groups."*"` 아래에 있습니다.

봇 메시지에 대한 reply는 암묵적 멘션으로 간주됩니다(채널이 reply metadata를 지원하는 경우). 이는 Telegram, WhatsApp, Slack, Discord, Microsoft Teams에 적용됩니다.

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

- `mentionPatterns`는 대소문자를 구분하지 않는 regex입니다.
- 명시적 멘션을 제공하는 채널에서는 그것이 우선 통과하고, pattern은 fallback입니다.
- 에이전트별 override: `agents.list[].groupChat.mentionPatterns`(여러 agent가 하나의 그룹을 공유할 때 유용).
- mention gating은 mention 감지가 가능할 때만 강제됩니다(native mention 또는 `mentionPatterns`가 설정된 경우).
- Discord 기본값은 `channels.discord.guilds."*"`에 있으며, guild/channel별로 override할 수 있습니다.
- 그룹 history context는 채널 전반에서 동일한 형식으로 감싸지며 **pending-only**(mention gating으로 건너뛴 메시지)입니다. 전역 기본값은 `messages.groupChat.historyLimit`, override는 `channels.<channel>.historyLimit`(또는 `channels.<channel>.accounts.*.historyLimit`)를 사용하세요. `0`으로 설정하면 비활성화됩니다.

## 그룹/채널 도구 제한 (선택)

일부 채널 config는 **특정 그룹/룸/채널 안에서** 사용할 수 있는 도구를 제한할 수 있습니다.

- `tools`: 전체 그룹에 대한 도구 allow/deny
- `toolsBySender`: 그룹 내 발신자별 override
  명시적 키 prefix를 사용하세요:
  `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>`, 그리고 `"*"` wildcard.
  레거시 무접두사 키도 여전히 허용되지만 `id:`로만 매칭됩니다.

해결 순서(가장 구체적인 것이 우선):

1. 그룹/채널 `toolsBySender` 매치
2. 그룹/채널 `tools`
3. 기본값(`"*"` ) `toolsBySender` 매치
4. 기본값(`"*"` ) `tools`

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

- 그룹/채널 도구 제한은 전역/에이전트 도구 정책에 추가로 적용됩니다(deny가 여전히 우선).
- 일부 채널은 room/channel용으로 다른 중첩 구조를 사용합니다(예: Discord `guilds.*.channels.*`, Slack `channels.*`, MS Teams `teams.*.channels.*`).

## 그룹 allowlist

`channels.whatsapp.groups`, `channels.telegram.groups`, `channels.imessage.groups`가 설정되면 키가 group allowlist 역할을 합니다. `"*"`를 사용하면 모든 그룹을 허용하면서 기본 mention 동작도 설정할 수 있습니다.

흔한 의도(복사/붙여넣기):

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

3. 모든 그룹을 허용하되 멘션 필요(명시적)

```json5
{
  channels: {
    whatsapp: {
      groups: { "*": { requireMention: true } },
    },
  },
}
```

4. 그룹에서 소유자만 트리거 가능(WhatsApp)

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

## Activation (소유자 전용)

그룹 소유자는 그룹별 activation을 토글할 수 있습니다.

- `/activation mention`
- `/activation always`

소유자는 `channels.whatsapp.allowFrom`으로 결정됩니다(없으면 봇 자신의 E.164). 이 명령은 독립 메시지로 보내야 합니다. 다른 채널은 현재 `/activation`을 무시합니다.

## 컨텍스트 필드

그룹 인바운드 payload는 다음을 설정합니다.

- `ChatType=group`
- `GroupSubject` (알 수 있는 경우)
- `GroupMembers` (알 수 있는 경우)
- `WasMentioned` (mention gating 결과)
- Telegram forum topic은 `MessageThreadId`와 `IsForum`도 포함합니다.

에이전트 시스템 프롬프트에는 새 그룹 세션의 첫 턴에 그룹 소개가 포함됩니다. 모델에게 사람처럼 답하고, Markdown table을 피하고, 리터럴 `\n` 시퀀스를 쓰지 말라고 알려 줍니다.

## iMessage 관련 사항

- 라우팅/allowlist에는 `chat_id:<id>` 사용을 권장합니다.
- 채팅 목록 보기: `imsg chats --limit 20`.
- 그룹 응답은 항상 같은 `chat_id`로 돌아갑니다.

## WhatsApp 관련 사항

WhatsApp 전용 동작(history injection, mention 처리 상세)은 [그룹 메시지](/channels/group-messages)를 참고하세요.
