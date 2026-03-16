---
summary: "Telegram bot 지원 상태, 핵심 기능, 설정 흐름 요약"
description: "OpenClaw를 Telegram bot과 연결하는 방법, DM 및 그룹 접근 제어, streaming, webhook, buttons, reactions 설정을 간단히 안내합니다."
read_when:
  - Telegram 기능이나 webhook 설정을 작업할 때
title: "Telegram"
x-i18n:
  source_path: "channels/telegram.md"
---

# Telegram (Bot API)

Status: grammY를 통한 bot DMs + groups에 대해 production-ready 상태입니다. Long polling이 기본 모드이며 webhook 모드는 선택 사항입니다.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/channels/pairing">
    Telegram의 기본 DM 정책은 pairing입니다.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/channels/troubleshooting">
    채널 전반의 진단 및 복구 플레이북.
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/gateway/configuration">
    전체 채널 config 패턴과 예시.
  </Card>
</CardGroup>

## Quick setup

<Steps>
  <Step title="Create the bot token in BotFather">
    Telegram에서 **@BotFather**와 대화를 시작합니다(handle이 정확히 `@BotFather`인지 확인).

    `/newbot`을 실행하고, 안내에 따라 진행한 뒤 token을 저장합니다.

  </Step>

  <Step title="Configure token and DM policy">

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "123:abc",
      dmPolicy: "pairing",
      groups: { "*": { requireMention: true } },
    },
  },
}
```

    Env fallback: `TELEGRAM_BOT_TOKEN=...` (default account only).
    Telegram은 `openclaw channels login telegram`을 사용하지 않습니다. config/env에 token을 설정한 뒤 gateway를 시작하세요.

  </Step>

  <Step title="Start gateway and approve first DM">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Pairing code는 1시간 후 만료됩니다.

  </Step>

  <Step title="Add the bot to a group">
    bot을 그룹에 추가한 뒤, 접근 모델에 맞게 `channels.telegram.groups`와 `groupPolicy`를 설정합니다.
  </Step>
</Steps>

<Note>
Token resolution order는 account-aware입니다. 실제로는 config 값이 env fallback보다 우선하며, `TELEGRAM_BOT_TOKEN`은 default account에만 적용됩니다.
</Note>

## Telegram side settings

<AccordionGroup>
  <Accordion title="Privacy mode and group visibility">
    Telegram bot은 기본적으로 **Privacy Mode**가 켜져 있으므로, 받을 수 있는 그룹 메시지가 제한됩니다.

    bot이 모든 그룹 메시지를 봐야 한다면 다음 중 하나를 수행하세요.

    - `/setprivacy`로 privacy mode 비활성화
    - bot을 그룹 admin으로 지정

    privacy mode를 바꾼 뒤에는, Telegram이 변경 사항을 적용하도록 각 그룹에서 bot을 제거했다가 다시 추가하세요.

  </Accordion>

  <Accordion title="Group permissions">
    admin 권한은 Telegram 그룹 설정에서 제어합니다.

    admin bot은 모든 그룹 메시지를 받을 수 있으므로, 항상 동작하는 그룹 동작에 유용합니다.

  </Accordion>

  <Accordion title="Helpful BotFather toggles">

    - `/setjoingroups` 로 그룹 추가 허용/차단
    - `/setprivacy` 로 그룹 가시성 동작 제어

  </Accordion>
</AccordionGroup>

## Access control and activation

<Tabs>
  <Tab title="DM policy">
    `channels.telegram.dmPolicy`는 direct message 접근을 제어합니다.

    - `pairing` (default)
    - `allowlist` (`allowFrom`에 sender ID가 최소 하나 필요)
    - `open` (`allowFrom`에 `"*"` 필요)
    - `disabled`

    `channels.telegram.allowFrom`은 숫자형 Telegram user ID를 받습니다. `telegram:` / `tg:` prefix도 허용되고 정규화됩니다.
    `allowFrom`이 비어 있는 `dmPolicy: "allowlist"`는 모든 DM을 차단하며 config validation에서 거부됩니다.
    onboarding wizard는 `@username` 입력을 받아 숫자 ID로 resolve합니다.
    업그레이드 후 config에 `@username` allowlist 항목이 남아 있다면 `openclaw doctor --fix`를 실행해 resolve하세요(best-effort이며 Telegram bot token 필요).
    이전에 pairing-store allowlist 파일에 의존했다면, `openclaw doctor --fix`가 allowlist 흐름에서 해당 항목을 `channels.telegram.allowFrom`으로 복구할 수 있습니다(예: `dmPolicy: "allowlist"`인데 아직 explicit ID가 없는 경우).

    한 명의 owner만 사용하는 bot이라면, 이전 pairing approval에 의존하지 말고 durable한 config policy 유지를 위해 explicit numeric `allowFrom` ID와 함께 `dmPolicy: "allowlist"`를 사용하는 편이 좋습니다.

    ### Finding your Telegram user ID

    더 안전한 방법(third-party bot 없음):

    1. bot에 DM을 보냅니다.
    2. `openclaw logs --follow`를 실행합니다.
    3. `from.id`를 읽습니다.

    Official Bot API method:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Third-party method (덜 private함): `@userinfobot` 또는 `@getidsbot`.

  </Tab>

  <Tab title="Group policy and allowlists">
    두 가지 제어가 함께 적용됩니다.

    1. **어떤 그룹을 허용할지** (`channels.telegram.groups`)
       - `groups` config가 없을 때:
         - `groupPolicy: "open"` 이면: 어떤 그룹이든 group-ID check를 통과할 수 있음
         - `groupPolicy: "allowlist"` (default) 이면: `groups` 항목 또는 `"*"`를 추가하기 전까지 그룹 차단
       - `groups`가 설정되면: allowlist로 동작(explicit ID 또는 `"*"`)

    2. **그룹에서 어떤 sender를 허용할지** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (default)
       - `disabled`

    `groupAllowFrom`은 그룹 sender 필터링에 사용됩니다. 설정하지 않으면 Telegram은 `allowFrom`으로 fallback합니다.
    `groupAllowFrom` 항목은 숫자형 Telegram user ID여야 합니다(`telegram:` / `tg:` prefix는 정규화됨).
    Telegram group/supergroup chat ID를 `groupAllowFrom`에 넣지 마세요. 음수 chat ID는 `channels.telegram.groups` 아래에 있어야 합니다.
    숫자가 아닌 항목은 sender authorization에서 무시됩니다.
    Security boundary (`2026.2.25+`): group sender auth는 DM pairing-store approval을 상속하지 않습니다.
    pairing은 DM 전용입니다. 그룹에서는 `groupAllowFrom` 또는 group/topic별 `allowFrom`을 설정하세요.
    runtime 참고: `channels.telegram` 블록 전체가 없으면, `channels.defaults.groupPolicy`가 명시적으로 설정되어 있지 않은 한 runtime은 fail-closed `groupPolicy="allowlist"`를 기본으로 사용합니다.

    Example: 한 특정 그룹에서 어떤 멤버든 허용:

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          groupPolicy: "open",
          requireMention: false,
        },
      },
    },
  },
}
```

    Example: 한 특정 그룹 안에서 특정 사용자만 허용:

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          requireMention: true,
          allowFrom: ["8734062810", "745123456"],
        },
      },
    },
  },
}
```

    <Warning>
      흔한 실수: `groupAllowFrom`은 Telegram group allowlist가 아닙니다.

      - `-1001234567890` 같은 음수 Telegram group/supergroup chat ID는 `channels.telegram.groups` 아래에 두세요.
      - 허용된 그룹 안에서 어떤 사람이 bot을 트리거할 수 있는지 제한하려면 `8734062810` 같은 Telegram user ID를 `groupAllowFrom` 아래에 두세요.
      - 허용된 그룹의 어떤 멤버든 bot과 대화할 수 있게 하려면 `groupAllowFrom: ["*"]`를 사용하세요.
    </Warning>

  </Tab>

  <Tab title="Mention behavior">
    그룹 reply는 기본적으로 mention이 필요합니다.

    mention은 다음 중 하나로 감지될 수 있습니다.

    - native `@botusername` mention
    - 다음 위치의 mention pattern:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Session-level command toggle:

    - `/activation always`
    - `/activation mention`

    이 명령은 session state만 갱신합니다. 영구 설정은 config를 사용하세요.

    Persistent config example:

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { requireMention: false },
      },
    },
  },
}
```

    그룹 chat ID를 얻는 방법:

    - 그룹 메시지를 `@userinfobot` / `@getidsbot`으로 전달
    - 또는 `openclaw logs --follow`에서 `chat.id` 확인
    - 또는 Bot API `getUpdates` 확인

  </Tab>
</Tabs>

## Runtime behavior

- Telegram은 gateway process가 직접 소유합니다.
- routing은 deterministic합니다. Telegram inbound는 다시 Telegram으로 reply됩니다(model이 channel을 선택하지 않음).
- inbound message는 reply metadata와 media placeholder를 포함한 공통 channel envelope로 정규화됩니다.
- group session은 group ID별로 격리됩니다. forum topic은 `:topic:<threadId>`를 덧붙여 topic 단위로 격리합니다.
- DM message는 `message_thread_id`를 포함할 수 있습니다. OpenClaw는 thread-aware session key로 라우팅하고 reply 시 thread ID를 보존합니다.
- Long polling은 grammY runner를 사용하며, chat/thread별 sequencing을 유지합니다. 전체 runner sink concurrency는 `agents.defaults.maxConcurrent`를 사용합니다.
- Telegram Bot API는 read-receipt를 지원하지 않습니다(`sendReadReceipts`는 적용되지 않음).

## Feature reference

<AccordionGroup>
  <Accordion title="Live stream preview (message edits)">
    OpenClaw는 partial reply를 실시간으로 streaming할 수 있습니다.

    - direct chats: preview message + `editMessageText`
    - groups/topics: preview message + `editMessageText`

    Requirement:

    - `channels.telegram.streaming` 은 `off | partial | block | progress` (default: `partial`)
    - `progress` 는 Telegram에서 `partial`로 매핑됨(cross-channel naming 호환성)
    - legacy `channels.telegram.streamMode` 와 boolean `streaming` 값은 자동 매핑됨

    텍스트만 있는 reply의 경우:

    - DM: 같은 preview message를 유지하고 마지막에 그 자리에서 final edit 수행(두 번째 message 없음)
    - group/topic: 같은 preview message를 유지하고 마지막에 그 자리에서 final edit 수행(두 번째 message 없음)

    복합 reply(예: media payload)에서는 OpenClaw가 일반적인 final delivery로 fallback한 뒤 preview message를 정리합니다.

    preview streaming은 block streaming과 별개입니다. Telegram에 block streaming을 명시적으로 켜면, OpenClaw는 double-streaming을 피하기 위해 preview stream을 건너뜁니다.

    native draft transport를 사용할 수 없거나 거부되면 OpenClaw는 자동으로 `sendMessage` + `editMessageText`로 fallback합니다.

    Telegram-only reasoning stream:

    - `/reasoning stream` 은 생성 중 reasoning을 live preview로 보냄
    - final answer에는 reasoning text를 포함하지 않음

  </Accordion>

  <Accordion title="Formatting and HTML fallback">
    outbound text는 Telegram `parse_mode: "HTML"`을 사용합니다.

    - Markdown 비슷한 텍스트는 Telegram-safe HTML로 렌더링됩니다.
    - raw model HTML은 Telegram parse failure를 줄이기 위해 escape됩니다.
    - Telegram이 parsed HTML을 거부하면 OpenClaw는 plain text로 재시도합니다.

    Link preview는 기본적으로 켜져 있으며 `channels.telegram.linkPreview: false`로 끌 수 있습니다.

  </Accordion>

  <Accordion title="Native commands and custom commands">
    Telegram command menu registration은 startup 시 `setMyCommands`로 처리됩니다.

    Native command 기본값:

    - `commands.native: "auto"` 가 Telegram에서 native command를 활성화

    custom command menu entry 추가:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Git backup" },
        { command: "generate", description: "Create an image" },
      ],
    },
  },
}
```

    Rules:

    - 이름은 정규화됩니다(앞의 `/` 제거, lowercase)
    - 유효 패턴: `a-z`, `0-9`, `_`, 길이 `1..32`
    - custom command는 native command를 override할 수 없음
    - conflict/duplicate는 skip되고 log에 기록됨

    Notes:

    - custom command는 menu entry만 추가합니다. 동작을 자동 구현하지는 않습니다.
    - plugin/skill command는 Telegram menu에 보이지 않아도 직접 입력하면 동작할 수 있습니다.

    native command를 끄면 built-in command는 제거됩니다. custom/plugin command는 설정에 따라 계속 등록될 수 있습니다.

    흔한 설정 실패:

    - `setMyCommands failed`는 보통 `api.telegram.org`로의 outbound DNS/HTTPS가 막혀 있음을 의미합니다.

    ### Device pairing commands (`device-pair` plugin)

    `device-pair` plugin이 설치되어 있으면:

    1. `/pair` 로 setup code 생성
    2. iOS app에 code 붙여넣기
    3. `/pair approve` 로 최신 pending request 승인

    자세한 내용: [Pairing](/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="Inline buttons">
    inline keyboard scope 설정:

```json5
{
  channels: {
    telegram: {
      capabilities: {
        inlineButtons: "allowlist",
      },
    },
  },
}
```

    account별 override:

```json5
{
  channels: {
    telegram: {
      accounts: {
        main: {
          capabilities: {
            inlineButtons: "allowlist",
          },
        },
      },
    },
  },
}
```

    Scope:

    - `off`
    - `dm`
    - `group`
    - `all`
    - `allowlist` (default)

    legacy `capabilities: ["inlineButtons"]`는 `inlineButtons: "all"`로 매핑됩니다.

    Message action example:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Choose an option:",
  buttons: [
    [
      { text: "Yes", callback_data: "yes" },
      { text: "No", callback_data: "no" },
    ],
    [{ text: "Cancel", callback_data: "cancel" }],
  ],
}
```

    callback click은 agent에 다음과 같은 텍스트로 전달됩니다:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Telegram message actions for agents and automation">
    Telegram tool action에는 다음이 포함됩니다.

    - `sendMessage` (`to`, `content`, optional `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, optional `iconColor`, `iconCustomEmojiId`)

    Channel message action은 더 쓰기 쉬운 alias를 제공합니다(`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Gating control:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (default: disabled)

    참고: `edit` 와 `topic-create` 는 현재 기본적으로 활성화되어 있으며 별도의 `channels.telegram.actions.*` toggle이 없습니다.
    runtime send는 active config/secrets snapshot(startup/reload 시점)을 사용하므로, action path는 send마다 ad-hoc SecretRef 재해석을 하지 않습니다.

    Reaction removal semantics: [/tools/reactions](/tools/reactions)

  </Accordion>

  <Accordion title="Reply threading tags">
    Telegram은 생성된 출력 안에서 explicit reply threading tag를 지원합니다.

    - `[[reply_to_current]]` 는 trigger가 된 메시지에 reply
    - `[[reply_to:<id>]]` 는 특정 Telegram message ID에 reply

    `channels.telegram.replyToMode` 가 처리 방식을 제어합니다.

    - `off` (default)
    - `first`
    - `all`

    참고: `off`는 implicit reply threading을 비활성화합니다. explicit `[[reply_to_*]]` tag는 계속 존중됩니다.

  </Accordion>

  <Accordion title="Forum topics and thread behavior">
    forum supergroup:

    - topic session key는 `:topic:<threadId>`를 덧붙임
    - reply와 typing은 해당 topic thread를 대상으로 함
    - topic config path:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    General topic (`threadId=1`) special-case:

    - message send에서는 `message_thread_id`를 생략함(Telegram이 `sendMessage(...thread_id=1)`을 거부함)
    - typing action에는 계속 `message_thread_id`를 포함

    Topic inheritance: topic entry는 group setting을 override가 없는 한 상속합니다(`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId`는 topic 전용이며 group default에서 상속되지 않습니다.

    **Per-topic agent routing**: 각 topic은 topic config의 `agentId`를 설정해 다른 agent로 라우팅할 수 있습니다. 이로써 각 topic은 자신의 isolated workspace, memory, session을 갖습니다. 예:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // General topic -> main agent
                "3": { agentId: "zu" },        // Dev topic -> zu agent
                "5": { agentId: "coder" }      // Code review -> coder agent
              }
            }
          }
        }
      }
    }
    ```

    각 topic은 고유 session key를 갖습니다: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Persistent ACP topic binding**: forum topic은 top-level typed ACP binding을 통해 ACP harness session을 pin할 수 있습니다.

    - `bindings[]` 와 `type: "acp"` 그리고 `match.channel: "telegram"`

    Example:

    ```json5
    {
      agents: {
        list: [
          {
            id: "codex",
            runtime: {
              type: "acp",
              acp: {
                agent: "codex",
                backend: "acpx",
                mode: "persistent",
                cwd: "/workspace/openclaw",
              },
            },
          },
        ],
      },
      bindings: [
        {
          type: "acp",
          agentId: "codex",
          match: {
            channel: "telegram",
            accountId: "default",
            peer: { kind: "group", id: "-1001234567890:topic:42" },
          },
        },
      ],
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "42": {
                  requireMention: false,
                },
              },
            },
          },
        },
      },
    }
    ```

    현재 이 기능은 group과 supergroup의 forum topic에만 적용됩니다.

    **Thread-bound ACP spawn from chat**:

    - `/acp spawn <agent> --thread here|auto` 로 현재 Telegram topic을 새 ACP session에 bind할 수 있습니다.
    - 이후 같은 topic의 메시지는 bound된 ACP session으로 직접 라우팅됩니다(`/acp steer` 불필요).
    - OpenClaw는 bind가 성공하면 spawn confirmation message를 해당 topic에 pin합니다.
    - `channels.telegram.threadBindings.spawnAcpSessions=true` 가 필요합니다.

    Template context에 포함되는 값:

    - `MessageThreadId`
    - `IsForum`

    DM thread behavior:

    - `message_thread_id`가 있는 private chat은 DM routing을 유지하지만 thread-aware session key/reply target을 사용합니다.

  </Accordion>

  <Accordion title="Audio, video, and stickers">
    ### Audio messages

    Telegram은 voice note와 audio file을 구분합니다.

    - default: audio file 동작
    - agent reply에 `[[audio_as_voice]]` tag를 넣으면 voice-note send 강제

    Message action example:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/voice.ogg",
  asVoice: true,
}
```

    ### Video messages

    Telegram은 video file과 video note를 구분합니다.

    Message action example:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    video note는 caption을 지원하지 않으므로, 제공된 message text는 별도로 전송됩니다.

    ### Stickers

    inbound sticker 처리:

    - static WEBP: 다운로드 후 처리(placeholder `<media:sticker>`)
    - animated TGS: 건너뜀
    - video WEBM: 건너뜀

    Sticker context field:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    Sticker cache file:

    - `~/.openclaw/telegram/sticker-cache.json`

    sticker는 가능할 때 한 번만 설명을 생성하고 cache해 반복적인 vision 호출을 줄입니다.

    sticker action 활성화:

```json5
{
  channels: {
    telegram: {
      actions: {
        sticker: true,
      },
    },
  },
}
```

    sticker send action:

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    cached sticker 검색:

```json5
{
  action: "sticker-search",
  channel: "telegram",
  query: "cat waving",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="Reaction notifications">
    Telegram reaction은 `message_reaction` update로 도착합니다(message payload와 분리됨).

    활성화되면 OpenClaw는 다음과 같은 system event를 queue에 넣습니다.

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Config:

    - `channels.telegram.reactionNotifications`: `off | own | all` (default: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (default: `minimal`)

    Notes:

    - `own`은 bot이 보낸 message에 대한 user reaction만 의미합니다(best-effort, sent-message cache 기반).
    - reaction event는 Telegram access control(`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`)을 그대로 따르며, 권한 없는 sender는 drop됩니다.
    - Telegram은 reaction update에 thread ID를 제공하지 않습니다.
      - non-forum group은 group chat session으로 라우팅
      - forum group은 정확한 originating topic이 아니라 group general-topic session(`:topic:1`)으로 라우팅

    polling/webhook의 `allowed_updates`에는 `message_reaction`이 자동으로 포함됩니다.

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction`은 inbound message를 처리하는 동안 acknowledgement emoji를 보냅니다.

    Resolution order:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - agent identity emoji fallback (`agents.list[].identity.emoji`, 없으면 `"👀"`)

    Notes:

    - Telegram은 unicode emoji를 기대합니다(예: `"👀"`).
    - channel이나 account에서 reaction을 끄려면 `""`를 사용하세요.

  </Accordion>

  <Accordion title="Config writes from Telegram events and commands">
    channel config write는 기본적으로 활성화되어 있습니다(`configWrites !== false`).

    Telegram-triggered write에는 다음이 포함됩니다.

    - `channels.telegram.groups`를 갱신하기 위한 group migration event(`migrate_to_chat_id`)
    - `/config set` 과 `/config unset` (command enablement 필요)

    비활성화:

```json5
{
  channels: {
    telegram: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="Long polling vs webhook">
    기본값은 long polling입니다.

    Webhook mode:

    - `channels.telegram.webhookUrl` 설정
    - `channels.telegram.webhookSecret` 설정(`webhookUrl`이 있으면 필수)
    - optional `channels.telegram.webhookPath` (default `/telegram-webhook`)
    - optional `channels.telegram.webhookHost` (default `127.0.0.1`)
    - optional `channels.telegram.webhookPort` (default `8787`)

    webhook mode의 기본 local listener는 `127.0.0.1:8787`에 bind됩니다.

    public endpoint가 다르다면 앞단에 reverse proxy를 두고 `webhookUrl`을 public URL로 지정하세요.
    의도적으로 external ingress가 필요할 때는 `webhookHost`(예: `0.0.0.0`)를 설정하세요.

  </Accordion>

  <Accordion title="Limits, retry, and CLI targets">
    - `channels.telegram.textChunkLimit` 기본값은 4000
    - `channels.telegram.chunkMode="newline"` 은 길이 기준 분할 전에 paragraph boundary(빈 줄)를 우선 고려
    - `channels.telegram.mediaMaxMb` (default 100) 는 inbound/outbound Telegram media 크기를 제한
    - `channels.telegram.timeoutSeconds` 는 Telegram API client timeout을 override함(없으면 grammY 기본값 사용)
    - group context history는 `channels.telegram.historyLimit` 또는 `messages.groupChat.historyLimit`을 사용(default 50), `0`이면 비활성화
    - DM history 제어:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry` config는 recoverable outbound API error에 대한 Telegram send helper(CLI/tools/actions)에 적용

    CLI send target은 숫자 chat ID 또는 username을 사용할 수 있습니다.

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    Telegram poll은 `openclaw message poll`을 사용하며 forum topic도 지원합니다.

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Telegram 전용 poll flag:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - forum topic용 `--thread-id` (또는 `:topic:` target 사용)

    Action gating:

    - `channels.telegram.actions.sendMessage=false` 는 poll을 포함한 outbound Telegram message를 비활성화
    - `channels.telegram.actions.poll=false` 는 일반 send는 유지한 채 Telegram poll 생성만 비활성화

  </Accordion>

  <Accordion title="Exec approvals in Telegram">
    Telegram은 approver DM에서 exec approval을 지원하며, 선택적으로 원래 chat이나 topic에도 approval prompt를 게시할 수 있습니다.

    Config path:

    - `channels.telegram.execApprovals.enabled`
    - `channels.telegram.execApprovals.approvers`
    - `channels.telegram.execApprovals.target` (`dm` | `channel` | `both`, default: `dm`)
    - `agentFilter`, `sessionFilter`

    approver는 숫자형 Telegram user ID여야 합니다. `enabled`가 false이거나 `approvers`가 비어 있으면 Telegram은 exec approval client로 동작하지 않습니다. approval request는 다른 configured approval route 또는 exec approval fallback policy로 넘어갑니다.

    Delivery rule:

    - `target: "dm"` 은 configured approver DM에만 approval prompt 전송
    - `target: "channel"` 은 originating Telegram chat/topic으로 prompt를 다시 보냄
    - `target: "both"` 은 approver DM과 originating chat/topic 모두에 전송

    승인 또는 거부는 configured approver만 할 수 있습니다. non-approver는 `/approve`도, Telegram approval button도 사용할 수 없습니다.

    channel delivery는 chat에 command text를 그대로 보여주므로, `channel` 또는 `both`는 trusted group/topic에서만 사용하세요. prompt가 forum topic에 도착하면 OpenClaw는 approval prompt와 post-approval follow-up 모두에 동일한 topic을 유지합니다.

    inline approval button은 `channels.telegram.capabilities.inlineButtons`가 target surface(`dm`, `group`, `all`)를 허용해야만 동작합니다.

    관련 문서: [Exec approvals](/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## Troubleshooting

<AccordionGroup>
  <Accordion title="Bot does not respond to non mention group messages">

    - `requireMention=false`라면 Telegram privacy mode가 전체 가시성을 허용해야 합니다.
      - BotFather: `/setprivacy` -> Disable
      - 이후 bot을 그룹에서 제거했다가 다시 추가
    - `openclaw channels status`는 config가 non-mention group message를 기대할 때 경고를 표시합니다.
    - `openclaw channels status --probe`는 explicit numeric group ID를 검사할 수 있습니다. wildcard `"*"`는 membership probe가 불가합니다.
    - 빠른 session test: `/activation always`.

  </Accordion>

  <Accordion title="Bot not seeing group messages at all">

    - `channels.telegram.groups`가 존재한다면, 해당 그룹이 목록에 있어야 합니다(또는 `"*"` 포함)
    - bot이 그룹 멤버인지 확인
    - skip reason 확인용 로그: `openclaw logs --follow`

  </Accordion>

  <Accordion title="Commands work partially or not at all">

    - sender identity를 authorize하세요(pairing 및/또는 numeric `allowFrom`)
    - group policy가 `open`이어도 command authorization은 계속 적용됩니다
    - `setMyCommands failed`는 보통 `api.telegram.org`에 대한 DNS/HTTPS reachability 문제입니다

  </Accordion>

  <Accordion title="Polling or network instability">

    - Node 22+ + custom fetch/proxy 환경에서는 AbortSignal type mismatch로 즉시 abort가 발생할 수 있습니다.
    - 일부 host는 `api.telegram.org`를 먼저 IPv6로 resolve하며, IPv6 egress가 불안정하면 Telegram API 실패가 간헐적으로 발생할 수 있습니다.
    - 로그에 `TypeError: fetch failed` 또는 `Network request for 'getUpdates' failed!`가 보이면, OpenClaw는 현재 이를 recoverable network error로 retry합니다.
    - direct egress/TLS가 불안정한 VPS host에서는 `channels.telegram.proxy`를 통해 Telegram API 호출을 우회하세요.

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ 기본값은 `autoSelectFamily=true`(WSL2 제외)와 `dnsResultOrder=ipv4first`
    - host가 WSL2이거나 IPv4-only 동작이 더 안정적이라면 family selection을 강제로 설정하세요.

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Environment override(임시):
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - DNS answer 확인:

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

More help: [Channel troubleshooting](/channels/troubleshooting).

## Telegram config reference pointers

Primary reference:

- `channels.telegram.enabled`: 채널 startup enable/disable
- `channels.telegram.botToken`: bot token (BotFather)
- `channels.telegram.tokenFile`: 일반 파일 경로에서 token 읽기. symlink는 거부됨
- `channels.telegram.dmPolicy`: `pairing | allowlist | open | disabled` (default: pairing)
- `channels.telegram.allowFrom`: DM allowlist (숫자형 Telegram user ID). `allowlist`는 최소 하나의 sender ID가 필요하고, `open`은 `"*"`가 필요합니다. `openclaw doctor --fix`는 legacy `@username` 항목을 ID로 resolve할 수 있고, allowlist migration 흐름에서 pairing-store 파일의 항목을 복구할 수 있습니다.
- `channels.telegram.actions.poll`: Telegram poll 생성 enable/disable (default: enabled, 여전히 `sendMessage` 필요)
- `channels.telegram.defaultTo`: CLI `--deliver`가 explicit `--reply-to` 없이 동작할 때 사용할 기본 Telegram target
- `channels.telegram.groupPolicy`: `open | allowlist | disabled` (default: allowlist)
- `channels.telegram.groupAllowFrom`: group sender allowlist (숫자형 Telegram user ID). `openclaw doctor --fix`는 legacy `@username`을 ID로 resolve할 수 있습니다. 숫자가 아닌 항목은 auth 시 무시됩니다. group auth는 DM pairing-store fallback을 사용하지 않습니다(`2026.2.25+`).
- Multi-account precedence:
  - 두 개 이상의 account ID가 구성되어 있다면 default routing을 명확히 하기 위해 `channels.telegram.defaultAccount`를 설정하거나 `channels.telegram.accounts.default`를 포함하세요.
  - 둘 다 없으면 OpenClaw는 첫 normalized account ID로 fallback하고 `openclaw doctor`가 경고합니다.
  - `channels.telegram.accounts.default.allowFrom` 과 `channels.telegram.accounts.default.groupAllowFrom` 은 `default` account에만 적용됩니다.
  - named account는 account-level 값이 없으면 `channels.telegram.allowFrom` 과 `channels.telegram.groupAllowFrom` 을 상속합니다.
  - named account는 `channels.telegram.accounts.default.allowFrom` / `groupAllowFrom` 을 상속하지 않습니다.
- `channels.telegram.groups`: 그룹별 기본값 + allowlist (`"*"`로 전역 기본값 설정 가능)
  - `channels.telegram.groups.<id>.groupPolicy`: groupPolicy의 그룹별 override (`open | allowlist | disabled`)
  - `channels.telegram.groups.<id>.requireMention`: mention gating 기본값
  - `channels.telegram.groups.<id>.skills`: skill filter (omit = 모든 skill, empty = 없음)
  - `channels.telegram.groups.<id>.allowFrom`: 그룹별 sender allowlist override
  - `channels.telegram.groups.<id>.systemPrompt`: 그룹용 추가 system prompt
  - `channels.telegram.groups.<id>.enabled`: `false`일 때 그룹 비활성화
  - `channels.telegram.groups.<id>.topics.<threadId>.*`: topic별 override (group field + topic 전용 `agentId`)
  - `channels.telegram.groups.<id>.topics.<threadId>.agentId`: 이 topic을 특정 agent로 라우팅 (group-level 및 binding routing보다 우선)
- `channels.telegram.groups.<id>.topics.<threadId>.groupPolicy`: groupPolicy의 topic별 override (`open | allowlist | disabled`)
- `channels.telegram.groups.<id>.topics.<threadId>.requireMention`: topic별 mention gating override
- top-level `bindings[]` 와 `type: "acp"`, 그리고 `match.peer.id`에 canonical topic id `chatId:topic:topicId`: persistent ACP topic binding field ([ACP Agents](/tools/acp-agents#channel-specific-settings) 참고)
- `channels.telegram.direct.<id>.topics.<threadId>.agentId`: DM topic을 특정 agent로 라우팅 (forum topic과 동일 동작)
- `channels.telegram.execApprovals.enabled`: 이 account에서 Telegram을 chat-based exec approval client로 활성화
- `channels.telegram.execApprovals.approvers`: exec request approve/deny 권한이 있는 Telegram user ID. exec approval이 활성화되면 필수
- `channels.telegram.execApprovals.target`: `dm | channel | both` (default: `dm`). `channel` 과 `both` 는 originating Telegram topic이 있으면 이를 유지
- `channels.telegram.execApprovals.agentFilter`: forwarded approval prompt용 optional agent ID filter
- `channels.telegram.execApprovals.sessionFilter`: forwarded approval prompt용 optional session key filter (substring 또는 regex)
- `channels.telegram.accounts.<account>.execApprovals`: Telegram exec approval routing과 approver authorization의 account별 override
- `channels.telegram.capabilities.inlineButtons`: `off | dm | group | all | allowlist` (default: allowlist)
- `channels.telegram.accounts.<account>.capabilities.inlineButtons`: account별 override
- `channels.telegram.commands.nativeSkills`: Telegram native skills command enable/disable
- `channels.telegram.replyToMode`: `off | first | all` (default: `off`)
- `channels.telegram.textChunkLimit`: outbound chunk 크기(chars)
- `channels.telegram.chunkMode`: `length` (default) 또는 `newline`, 길이 기준 chunking 전에 빈 줄(문단 경계)에서 나눔
- `channels.telegram.linkPreview`: outbound message의 link preview 토글 (default: true)
- `channels.telegram.streaming`: `off | partial | block | progress` (live stream preview, default: `partial`; `progress`는 `partial`로 매핑; `block`은 legacy preview mode compatibility). Telegram preview streaming은 하나의 preview message를 같은 자리에서 edit하는 방식입니다.
- `channels.telegram.mediaMaxMb`: inbound/outbound Telegram media cap (MB, default: 100)
- `channels.telegram.retry`: recoverable outbound API error에 대한 Telegram send helper(CLI/tools/actions)의 retry policy (attempts, minDelayMs, maxDelayMs, jitter)
- `channels.telegram.network.autoSelectFamily`: Node autoSelectFamily override (true=enable, false=disable). Node 22+에서는 기본 활성, WSL2에서는 기본 비활성
- `channels.telegram.network.dnsResultOrder`: DNS result order override (`ipv4first` 또는 `verbatim`). Node 22+ 기본값은 `ipv4first`
- `channels.telegram.proxy`: Bot API 호출용 proxy URL (SOCKS/HTTP)
- `channels.telegram.webhookUrl`: webhook mode 활성화 (`channels.telegram.webhookSecret` 필요)
- `channels.telegram.webhookSecret`: webhook secret (`webhookUrl`이 있으면 필수)
- `channels.telegram.webhookPath`: local webhook path (default `/telegram-webhook`)
- `channels.telegram.webhookHost`: local webhook bind host (default `127.0.0.1`)
- `channels.telegram.webhookPort`: local webhook bind port (default `8787`)
- `channels.telegram.actions.reactions`: Telegram tool reaction gating
- `channels.telegram.actions.sendMessage`: Telegram tool message send gating
- `channels.telegram.actions.deleteMessage`: Telegram tool message delete gating
- `channels.telegram.actions.sticker`: Telegram sticker action gating - send와 search (default: false)
- `channels.telegram.reactionNotifications`: `off | own | all` - 어떤 reaction이 system event를 발생시킬지 제어 (설정되지 않으면 default `own`)
- `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` - agent의 reaction capability 제어 (설정되지 않으면 default `minimal`)

- [Configuration reference - Telegram](/gateway/configuration-reference#telegram)

Telegram-specific high-signal field:

- startup/auth: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile`은 일반 파일이어야 하며 symlink는 거부됨)
- access control: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, top-level `bindings[]` (`type: "acp"`)
- exec approvals: `execApprovals`, `accounts.*.execApprovals`
- command/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- threading/replies: `replyToMode`
- streaming: `streaming` (preview), `blockStreaming`
- formatting/delivery: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- media/network: `mediaMaxMb`, `timeoutSeconds`, `retry`, `network.autoSelectFamily`, `proxy`
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- actions/capabilities: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reactions: `reactionNotifications`, `reactionLevel`
- writes/history: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

## Related

- [Pairing](/channels/pairing)
- [Channel routing](/channels/channel-routing)
- [Multi-agent routing](/concepts/multi-agent)
- [Troubleshooting](/channels/troubleshooting)
