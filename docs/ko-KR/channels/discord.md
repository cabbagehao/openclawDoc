---
summary: "Discord bot support status, capabilities, and configuration"
description: "OpenClaw를 Discord Bot API와 연결하는 방법, DM 및 guild 채널 정책, interactive components, voice, routing, troubleshooting 설정을 한 번에 정리합니다."
read_when:
  - "Working on Discord channel features"
title: "Discord"
x-i18n:
  source_path: "channels/discord.md"
---

# Discord (Bot API)

상태: 공식 Discord gateway를 통해 DM과 guild channel 모두 사용할 준비가 되어 있습니다.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/channels/pairing">
    Discord DM은 기본적으로 pairing mode로 동작합니다.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/tools/slash-commands">
    native command 동작 방식과 command catalog를 확인합니다.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/channels/troubleshooting">
    channel 전반의 진단 및 복구 흐름을 확인합니다.
  </Card>
</CardGroup>

## Quick setup

새 Discord application과 bot을 만든 뒤, bot을 서버에 추가하고 OpenClaw와 pair해야 합니다. bot은 본인 전용 private server에 추가하는 구성을 권장합니다. 아직 서버가 없다면 먼저 [새 서버를 생성](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server)하세요. 권장 선택은 **Create My Own > For me and my friends** 입니다.

<Steps>
  <Step title="Create a Discord application and bot">
    [Discord Developer Portal](https://discord.com/developers/applications)로 이동해 **New Application**을 클릭합니다. 이름은 "OpenClaw"처럼 정하면 됩니다.

    이어서 사이드바에서 **Bot**을 클릭하고, **Username**을 사용하는 OpenClaw agent 이름으로 설정합니다.

  </Step>

  <Step title="Enable privileged intents">
    같은 **Bot** 페이지에서 아래로 내려가 **Privileged Gateway Intents**를 활성화합니다.

    - **Message Content Intent** (필수)
    - **Server Members Intent** (권장; role allowlist와 name-to-ID matching에 필요)
    - **Presence Intent** (선택; presence update를 받을 때만 필요)

  </Step>

  <Step title="Copy your bot token">
    **Bot** 페이지 위쪽으로 돌아가 **Reset Token**을 클릭합니다.

    <Note>
    이름과 달리 첫 token을 생성할 때도 이 버튼을 사용합니다. 실제로 기존 token을 "reset"하는 것은 아닙니다.
    </Note>

    생성된 값을 복사해 안전한 곳에 저장합니다. 이것이 **Bot Token**이며 곧 필요합니다.

  </Step>

  <Step title="Generate an invite URL and add the bot to your server">
    사이드바에서 **OAuth2**를 클릭합니다. 여기서 bot을 서버에 추가할 invite URL과 필요한 권한을 설정합니다.

    아래의 **OAuth2 URL Generator**에서 다음을 활성화합니다.

    - `bot`
    - `applications.commands`

    그러면 아래에 **Bot Permissions**가 나타납니다. 다음 권한을 활성화합니다.

    - View Channels
    - Send Messages
    - Read Message History
    - Embed Links
    - Attach Files
    - Add Reactions (선택)

    맨 아래에서 생성된 URL을 복사해 브라우저에 붙여 넣고, 서버를 선택한 뒤 **Continue**를 눌러 연결합니다. 완료되면 Discord server에서 bot을 볼 수 있습니다.

  </Step>

  <Step title="Enable Developer Mode and collect your IDs">
    Discord app으로 돌아가 Developer Mode를 켜서 내부 ID를 복사할 수 있게 합니다.

    1. **User Settings**(아바타 옆 톱니바퀴) -> **Advanced** -> **Developer Mode** 활성화
    2. 사이드바에서 **server icon**을 우클릭 -> **Copy Server ID**
    3. 자신의 **avatar**를 우클릭 -> **Copy User ID**

    **Server ID**와 **User ID**를 Bot Token과 함께 저장해 둡니다. 다음 단계에서 OpenClaw에 세 값을 모두 전달하게 됩니다.

  </Step>

  <Step title="Allow DMs from server members">
    pairing이 작동하려면 Discord에서 bot이 사용자에게 DM을 보낼 수 있어야 합니다. **server icon**을 우클릭 -> **Privacy Settings** -> **Direct Messages**를 켭니다.

    이렇게 하면 server member(bot 포함)가 DM을 보낼 수 있습니다. Discord DM을 OpenClaw와 함께 사용할 계획이라면 이 설정을 유지하세요. guild channel만 사용할 계획이라면 pairing 뒤에 다시 꺼도 됩니다.

  </Step>

  <Step title="Step 0: Set your bot token securely (do not send it in chat)">
    Discord bot token은 password와 같은 secret입니다. agent에 메시지를 보내기 전에 OpenClaw가 실행되는 머신에 직접 설정하세요.

```bash
openclaw config set channels.discord.token '"YOUR_BOT_TOKEN"' --json
openclaw config set channels.discord.enabled true --json
openclaw gateway
```

    OpenClaw가 이미 background service로 실행 중이라면 `openclaw gateway restart`를 사용하세요.

  </Step>

  <Step title="Configure OpenClaw and pair">

    <Tabs>
      <Tab title="Ask your agent">
        OpenClaw agent와 이미 연결된 다른 channel(예: Telegram)이 있다면 그 channel에서 agent에게 요청하세요. Discord가 첫 channel이라면 CLI / config 탭을 사용하면 됩니다.

        > "I already set my Discord bot token in config. Please finish Discord setup with User ID `<user_id>` and Server ID `<server_id>`."
      </Tab>
      <Tab title="CLI / config">
        file-based config를 선호한다면 다음처럼 설정합니다.

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: "YOUR_BOT_TOKEN",
    },
  },
}
```

        default account에는 env fallback도 사용할 수 있습니다.

```bash
DISCORD_BOT_TOKEN=...
```

        `channels.discord.token`은 SecretRef 값(env/file/exec provider)도 지원합니다. 자세한 내용은 [Secrets Management](/gateway/secrets)를 참고하세요.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Approve first DM pairing">
    gateway가 실행 중인 상태에서 Discord에서 bot에게 DM을 보내면 pairing code가 돌아옵니다.

    <Tabs>
      <Tab title="Ask your agent">
        기존 channel에서 agent에게 pairing code를 전달합니다.

        > "Approve this Discord pairing code: `<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    pairing code는 1시간 뒤 만료됩니다.

    이제 Discord DM으로 agent와 대화할 수 있습니다.

  </Step>
</Steps>

<Note>
token resolution은 account-aware입니다. config에 넣은 token이 env fallback보다 우선합니다. `DISCORD_BOT_TOKEN`은 default account에만 사용됩니다.
고급 outbound call(message tool/channel action)에서는 per-call `token`이 해당 호출에만 사용됩니다. account policy와 retry 설정은 active runtime snapshot에서 선택된 account 기준으로 계속 적용됩니다.
</Note>

## Recommended: Set up a guild workspace

DM이 정상 동작하면 Discord server를 full workspace로 구성할 수 있습니다. 이 구성에서는 각 channel이 각자 별도의 agent session과 context를 가집니다. private server에서 본인과 bot만 사용하는 경우 특히 권장됩니다.

<Steps>
  <Step title="Add your server to the guild allowlist">
    이렇게 하면 agent가 DM뿐 아니라 server 안의 모든 channel에서 응답할 수 있습니다.

    <Tabs>
      <Tab title="Ask your agent">
        > "Add my Discord Server ID `<server_id>` to the guild allowlist"
      </Tab>
      <Tab title="Config">

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        YOUR_SERVER_ID: {
          requireMention: true,
          users: ["YOUR_USER_ID"],
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="Allow responses without @mention">
    기본적으로 guild channel에서는 agent를 @mention했을 때만 응답합니다. private server라면 모든 메시지에 바로 응답하도록 바꾸는 편이 보통 더 편리합니다.

    <Tabs>
      <Tab title="Ask your agent">
        > "Allow my agent to respond on this server without having to be @mentioned"
      </Tab>
      <Tab title="Config">
        guild config에서 `requireMention: false`로 설정합니다.

```json5
{
  channels: {
    discord: {
      guilds: {
        YOUR_SERVER_ID: {
          requireMention: false,
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="Plan for memory in guild channels">
    기본적으로 long-term memory(`MEMORY.md`)는 DM session에서만 로드됩니다. guild channel에서는 `MEMORY.md`가 자동으로 로드되지 않습니다.

    <Tabs>
      <Tab title="Ask your agent">
        > "When I ask questions in Discord channels, use memory_search or memory_get if you need long-term context from MEMORY.md."
      </Tab>
      <Tab title="Manual">
        모든 channel에 공통으로 들어가야 하는 stable instruction은 `AGENTS.md` 또는 `USER.md`에 넣으세요. 이 파일들은 모든 session에 주입됩니다. 장기 메모는 `MEMORY.md`에 유지하고, 필요할 때 memory tool로 불러오는 방식이 적합합니다.
      </Tab>
    </Tabs>

  </Step>
</Steps>

이제 Discord server에 channel을 몇 개 만들고 바로 사용하면 됩니다. agent는 channel name을 볼 수 있고, 각 channel은 서로 격리된 session을 가지므로 `#coding`, `#home`, `#research` 같은 작업별 분리가 가능합니다.

## Runtime model

- gateway가 Discord connection을 소유합니다.
- reply routing은 결정적입니다. Discord로 들어온 요청은 Discord로 다시 응답합니다.
- 기본값(`session.dmScope=main`)에서는 direct chat이 agent의 main session(`agent:main:main`)을 공유합니다.
- guild channel은 격리된 session key(`agent:<agentId>:discord:channel:<channelId>`)를 사용합니다.
- group DM은 기본적으로 무시됩니다(`channels.discord.dm.groupEnabled=false`).
- native slash command는 격리된 command session(`agent:<agentId>:discord:slash:<userId>`)에서 실행되지만, 라우팅 대상 대화 session에는 `CommandTargetSessionKey`를 계속 전달합니다.

## Forum channels

Discord forum channel과 media channel은 thread post만 받을 수 있습니다. OpenClaw는 두 가지 생성 방식을 지원합니다.

- forum parent(`channel:<forumId>`)에 메시지를 보내 thread를 자동 생성합니다. 제목은 메시지의 첫 번째 non-empty line을 사용합니다.
- `openclaw message thread create`로 thread를 직접 생성합니다. forum channel에서는 `--message-id`를 넘기지 마세요.

예시: forum parent로 보내 thread 자동 생성

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

예시: forum thread 명시적으로 생성

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

forum parent는 Discord component를 받을 수 없습니다. component가 필요하면 실제 thread(`channel:<threadId>`)로 보내세요.

## Interactive components

OpenClaw는 agent message에서 Discord components v2 container를 지원합니다. message tool에 `components` payload를 전달하면 됩니다. interaction 결과는 기존 Discord `replyToMode` 규칙을 따르는 일반 inbound message로 agent에게 다시 전달됩니다.

지원 block:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- action row는 최대 5개의 button 또는 단일 select menu를 가질 수 있음
- select type: `string`, `user`, `role`, `mentionable`, `channel`

기본적으로 component는 1회 사용입니다. 만료 전까지 button, select, form을 여러 번 재사용하려면 `components.reusable=true`를 설정하세요.

특정 사용자만 button을 누르게 하려면 해당 button에 `allowedUsers`를 지정합니다. Discord user ID, tag, 또는 `*`를 넣을 수 있습니다. 일치하지 않는 사용자는 ephemeral denial을 받습니다.

`/model`과 `/models` slash command는 provider/model dropdown과 Submit 단계를 갖는 interactive model picker를 엽니다. 이 picker의 응답은 ephemeral이며, 실행한 사용자만 사용할 수 있습니다.

파일 첨부:

- `file` block은 `attachment://<filename>` 참조를 가리켜야 함
- 첨부 파일은 `media`/`path`/`filePath`(단일 파일)로 제공
- 여러 파일은 `media-gallery` 사용
- 업로드 이름이 attachment reference와 맞아야 할 때는 `filename` 지정

modal form:

- `components.modal`에 최대 5개의 field를 추가
- field type: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw가 trigger button을 자동으로 추가

예시:

```json5
{
  channel: "discord",
  action: "send",
  to: "channel:123456789012345678",
  message: "Optional fallback text",
  components: {
    reusable: true,
    text: "Choose a path",
    blocks: [
      {
        type: "actions",
        buttons: [
          {
            label: "Approve",
            style: "success",
            allowedUsers: ["123456789012345678"],
          },
          { label: "Decline", style: "danger" },
        ],
      },
      {
        type: "actions",
        select: {
          type: "string",
          placeholder: "Pick an option",
          options: [
            { label: "Option A", value: "a" },
            { label: "Option B", value: "b" },
          ],
        },
      },
    ],
    modal: {
      title: "Details",
      triggerLabel: "Open form",
      fields: [
        { type: "text", label: "Requester" },
        {
          type: "select",
          label: "Priority",
          options: [
            { label: "Low", value: "low" },
            { label: "High", value: "high" },
          ],
        },
      ],
    },
  },
}
```

## Access control and routing

<Tabs>
  <Tab title="DM policy">
    `channels.discord.dmPolicy`가 DM 접근 정책을 제어합니다(legacy: `channels.discord.dm.policy`).

    - `pairing` (기본값)
    - `allowlist`
    - `open` (`channels.discord.allowFrom`에 `"*"`가 포함되어야 함; legacy: `channels.discord.dm.allowFrom`)
    - `disabled`

    DM policy가 open이 아니면, 알 수 없는 사용자는 차단됩니다. `pairing` 모드라면 pairing prompt를 받게 됩니다.

    multi-account precedence:

    - `channels.discord.accounts.default.allowFrom`은 `default` account에만 적용
    - named account는 자체 `allowFrom`이 없을 때 `channels.discord.allowFrom`을 상속
    - named account는 `channels.discord.accounts.default.allowFrom`을 상속하지 않음

    DM delivery target format:

    - `user:<id>`
    - `<@id>` mention

    bare numeric ID는 모호하므로 명시적인 user/channel target kind 없이 사용하면 거부됩니다.

  </Tab>

  <Tab title="Guild policy">
    guild 처리 방식은 `channels.discord.groupPolicy`로 제어합니다.

    - `open`
    - `allowlist`
    - `disabled`

    `channels.discord` block이 존재할 때의 안전한 기본값은 `allowlist`입니다.

    `allowlist` 동작:

    - guild는 `channels.discord.guilds`와 일치해야 함 (`id` 권장, slug 허용)
    - 선택적인 sender allowlist: `users`(stable ID 권장), `roles`(role ID만). 둘 중 하나라도 설정되어 있으면 sender는 `users` 또는 `roles`에 매칭될 때 허용됨
    - 직접 name/tag 매칭은 기본 비활성화이며, 호환성용 break-glass 모드로만 `channels.discord.dangerouslyAllowNameMatching: true`를 켜야 함
    - `users`에 name/tag도 넣을 수는 있지만 ID가 더 안전함. `openclaw security audit`는 name/tag 사용 시 경고를 냄
    - guild에 `channels`가 설정되면 목록에 없는 channel은 거부됨
    - guild에 `channels` block이 없으면 allowlist된 해당 guild의 모든 channel이 허용됨

    예시:

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "123456789012345678": {
          requireMention: true,
          ignoreOtherMentions: true,
          users: ["987654321098765432"],
          roles: ["123456789012345678"],
          channels: {
            general: { allow: true },
            help: { allow: true, requireMention: true },
          },
        },
      },
    },
  },
}
```

    `DISCORD_BOT_TOKEN`만 설정하고 `channels.discord` block을 만들지 않은 경우에도, runtime fallback은 `groupPolicy="allowlist"`입니다. 이때 `channels.defaults.groupPolicy`가 `open`이어도 log에 warning과 함께 allowlist로 동작합니다.

  </Tab>

  <Tab title="Mentions and group DMs">
    guild message는 기본적으로 mention이 있어야 처리됩니다.

    mention detection은 다음을 포함합니다.

    - bot에 대한 명시적 mention
    - 설정된 mention pattern(`agents.list[].groupChat.mentionPatterns`, fallback: `messages.groupChat.mentionPatterns`)
    - 지원되는 경우의 implicit reply-to-bot 동작

    `requireMention`은 guild/channel 단위(`channels.discord.guilds...`)로 설정합니다.
    `ignoreOtherMentions`를 켜면 bot을 mention하지 않고 다른 user/role만 mention한 메시지(@everyone/@here 제외)는 버릴 수 있습니다.

    group DM:

    - 기본값: 무시(`dm.groupEnabled=false`)
    - 선택적으로 `dm.groupChannels`(channel ID 또는 slug) allowlist 지원

  </Tab>
</Tabs>

### Role-based agent routing

Discord guild member를 role ID로 서로 다른 agent에 라우팅하려면 `bindings[].match.roles`를 사용합니다. role-based binding은 role ID만 허용하며, peer 또는 parent-peer binding 뒤, guild-only binding 앞에서 평가됩니다. binding이 `peer + guildId + roles`처럼 다른 match field도 함께 설정하면, 설정된 필드가 모두 일치해야 합니다.

```json5
{
  bindings: [
    {
      agentId: "opus",
      match: {
        channel: "discord",
        guildId: "123456789012345678",
        roles: ["111111111111111111"],
      },
    },
    {
      agentId: "sonnet",
      match: {
        channel: "discord",
        guildId: "123456789012345678",
      },
    },
  ],
}
```

## Developer Portal setup

<AccordionGroup>
  <Accordion title="Create app and bot">

    1. Discord Developer Portal -> **Applications** -> **New Application**
    2. **Bot** -> **Add Bot**
    3. bot token 복사

  </Accordion>

  <Accordion title="Privileged intents">
    **Bot -> Privileged Gateway Intents**에서 다음을 활성화합니다.

    - Message Content Intent
    - Server Members Intent (권장)

    Presence intent는 선택 사항이며, member presence update를 받고 싶을 때만 필요합니다. bot presence를 설정하는 `setPresence` 자체는 member presence update 권한이 없어도 됩니다.

  </Accordion>

  <Accordion title="OAuth scopes and baseline permissions">
    OAuth URL generator에서 다음을 설정합니다.

    - scopes: `bot`, `applications.commands`

    일반적인 baseline permission:

    - View Channels
    - Send Messages
    - Read Message History
    - Embed Links
    - Attach Files
    - Add Reactions (선택)

    명시적으로 필요한 경우가 아니라면 `Administrator`는 피하세요.

  </Accordion>

  <Accordion title="Copy IDs">
    Discord Developer Mode를 켠 뒤 다음 ID를 복사합니다.

    - server ID
    - channel ID
    - user ID

    안정적인 audit 및 probe를 위해 OpenClaw config에는 numeric ID를 권장합니다.

  </Accordion>
</AccordionGroup>

## Native commands and command auth

- `commands.native`의 기본값은 `"auto"`이며 Discord에서 활성화됩니다.
- channel 단위 override는 `channels.discord.commands.native`를 사용합니다.
- `commands.native=false`는 이전에 등록된 Discord native command를 명시적으로 제거합니다.
- native command 인증은 일반 메시지 처리와 동일한 Discord allowlist/policy를 사용합니다.
- 권한이 없는 사용자에게도 Discord UI에서 command가 보일 수는 있지만, 실제 실행 시에는 OpenClaw auth가 적용되어 "not authorized"가 반환됩니다.

command 목록과 동작은 [Slash commands](/tools/slash-commands)를 참고하세요.

기본 slash command 설정:

- `ephemeral: true`

## Feature details

<AccordionGroup>
  <Accordion title="Reply tags and native replies">
    Discord는 agent output의 reply tag를 지원합니다.

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    제어 옵션은 `channels.discord.replyToMode`입니다.

    - `off` (기본값)
    - `first`
    - `all`

    참고: `off`는 implicit reply threading만 끕니다. 명시적인 `[[reply_to_*]]` tag는 계속 적용됩니다.

    message ID는 context/history에 노출되므로 agent가 특정 메시지를 정확히 지정할 수 있습니다.

  </Accordion>

  <Accordion title="Live stream preview">
    OpenClaw는 임시 메시지를 보내고 token이 도착할 때마다 수정하는 방식으로 draft reply를 streaming할 수 있습니다.

    - `channels.discord.streaming`이 preview streaming을 제어합니다(`off` | `partial` | `block` | `progress`, 기본값: `off`).
    - `progress`는 cross-channel consistency를 위해 허용되며 Discord에서는 `partial`로 매핑됩니다.
    - `channels.discord.streamMode`는 legacy alias이며 자동 마이그레이션됩니다.
    - `partial`은 token이 도착할 때 하나의 preview message를 계속 수정합니다.
    - `block`은 draft 크기의 chunk를 순서대로 보냅니다. 세부 크기와 분할 기준은 `draftChunk`로 조정합니다.

    예시:

```json5
{
  channels: {
    discord: {
      streaming: "partial",
    },
  },
}
```

    `block` mode chunking 기본값(`channels.discord.textChunkLimit` 범위 내로 clamp):

```json5
{
  channels: {
    discord: {
      streaming: "block",
      draftChunk: {
        minChars: 200,
        maxChars: 800,
        breakPreference: "paragraph",
      },
    },
  },
}
```

    preview streaming은 text 전용입니다. media reply는 일반 전송으로 fallback됩니다.

    참고: preview streaming과 block streaming은 별개입니다. Discord에서 block streaming을 명시적으로 켜면, OpenClaw는 중복 streaming을 피하기 위해 preview stream을 건너뜁니다.

  </Accordion>

  <Accordion title="History, context, and thread behavior">
    guild history context:

    - `channels.discord.historyLimit` 기본값 `20`
    - fallback: `messages.groupChat.historyLimit`
    - `0`이면 비활성화

    DM history 제어:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    thread 동작:

    - Discord thread는 channel session으로 라우팅됨
    - parent thread metadata를 parent-session linkage에 활용할 수 있음
    - thread-specific entry가 없으면 parent channel config를 상속

    channel topic은 system prompt가 아니라 **untrusted** context로 주입됩니다.

  </Accordion>

  <Accordion title="Thread-bound sessions for subagents">
    Discord는 thread를 특정 session target에 binding해서, 해당 thread의 후속 메시지가 계속 같은 session으로 라우팅되게 할 수 있습니다. 여기에는 subagent session도 포함됩니다.

    command:

    - `/focus <target>` 현재 또는 새 thread를 subagent/session target에 bind
    - `/unfocus` 현재 thread binding 제거
    - `/agents` 활성 run과 binding 상태 표시
    - `/session idle <duration|off>` focused binding의 inactivity auto-unfocus 조회/변경
    - `/session max-age <duration|off>` focused binding의 hard max age 조회/변경

    config:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        idleHours: 24,
        maxAgeHours: 0,
        spawnSubagentSessions: false, // opt-in
      },
    },
  },
}
```

    참고:

    - `session.threadBindings.*`는 global default를 설정
    - `channels.discord.threadBindings.*`는 Discord 동작을 override
    - `spawnSubagentSessions`를 `true`로 해야 `sessions_spawn({ thread: true })`에 대해 thread를 자동 생성하고 bind함
    - `spawnAcpSessions`를 `true`로 해야 ACP(` /acp spawn ... --thread ...` 또는 `sessions_spawn({ runtime: "acp", thread: true })`)에 대해 thread를 자동 생성하고 bind함
    - account에서 thread binding이 비활성화되면 `/focus`와 관련 작업을 사용할 수 없음

    자세한 내용은 [Sub-agents](/tools/subagents), [ACP Agents](/tools/acp-agents), [Configuration Reference](/gateway/configuration-reference)를 참고하세요.

  </Accordion>

  <Accordion title="Persistent ACP channel bindings">
    안정적인 "always-on" ACP workspace를 위해, Discord conversation을 대상으로 하는 top-level typed ACP binding을 설정할 수 있습니다.

    config path:

    - `bindings[]` with `type: "acp"` and `match.channel: "discord"`

    예시:

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
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": {
              requireMention: false,
            },
          },
        },
      },
    },
  },
}
```

    참고:

    - thread message는 parent channel ACP binding을 상속할 수 있음
    - binding된 channel 또는 thread에서 `/new`와 `/reset`은 같은 ACP session을 제자리에서 reset함
    - 임시 thread binding도 계속 사용할 수 있으며, 활성 상태에서는 target resolution을 override할 수 있음

    ACP binding 동작은 [ACP Agents](/tools/acp-agents)를 참고하세요.

  </Accordion>

  <Accordion title="Reaction notifications">
    guild 단위 reaction notification mode:

    - `off`
    - `own` (기본값)
    - `all`
    - `allowlist` (`guilds.<id>.users` 사용)

    reaction event는 system event로 변환되어 라우팅된 Discord session에 첨부됩니다.

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction`은 OpenClaw가 inbound message를 처리하는 동안 acknowledgement emoji를 보냅니다.

    resolution 순서:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - agent identity emoji fallback(`agents.list[].identity.emoji`, 없으면 `"👀"`)

    참고:

    - Discord는 unicode emoji와 custom emoji name을 모두 허용함
    - channel 또는 account에서 reaction을 끄려면 `""` 사용

  </Accordion>

  <Accordion title="Config writes">
    channel에서 시작한 config write는 기본적으로 허용됩니다.

    이는 command 기능이 활성화되어 있을 때 `/config set|unset` 흐름에 영향을 줍니다.

    비활성화:

```json5
{
  channels: {
    discord: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="Gateway proxy">
    `channels.discord.proxy`를 사용하면 Discord gateway WebSocket traffic과 startup REST lookup(application ID + allowlist resolution)을 HTTP(S) proxy로 라우팅할 수 있습니다.

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    per-account override:

```json5
{
  channels: {
    discord: {
      accounts: {
        primary: {
          proxy: "http://proxy.example:8080",
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="PluralKit support">
    proxied message를 system member identity에 매핑하려면 PluralKit resolution을 활성화합니다.

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // optional; needed for private systems
      },
    },
  },
}
```

    참고:

    - allowlist에는 `pk:<memberId>` 사용 가능
    - member display name은 `channels.discord.dangerouslyAllowNameMatching: true`일 때만 name/slug로 매칭
    - lookup은 원본 message ID를 사용하며 time window 제약이 있음
    - lookup이 실패하면 proxied message는 bot message로 취급되어 `allowBots=true`가 아니면 drop됨

  </Accordion>

  <Accordion title="Presence configuration">
    status 또는 activity field를 설정하거나 auto presence를 켜면 presence update가 적용됩니다.

    status만 설정하는 예시:

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    activity 예시(custom status가 기본 activity type):

```json5
{
  channels: {
    discord: {
      activity: "Focus time",
      activityType: 4,
    },
  },
}
```

    streaming 예시:

```json5
{
  channels: {
    discord: {
      activity: "Live coding",
      activityType: 1,
      activityUrl: "https://twitch.tv/openclaw",
    },
  },
}
```

    activity type map:

    - 0: Playing
    - 1: Streaming (`activityUrl` 필요)
    - 2: Listening
    - 3: Watching
    - 4: Custom (activity text를 status state로 사용하며 emoji는 선택)
    - 5: Competing

    auto presence 예시(runtime health signal):

```json5
{
  channels: {
    discord: {
      autoPresence: {
        enabled: true,
        intervalMs: 30000,
        minUpdateIntervalMs: 15000,
        exhaustedText: "token exhausted",
      },
    },
  },
}
```

    auto presence는 runtime availability를 Discord status로 매핑합니다. healthy는 online, degraded 또는 unknown은 idle, exhausted 또는 unavailable은 dnd로 표시됩니다. 선택적으로 다음 텍스트를 override할 수 있습니다.

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (`{reason}` placeholder 지원)

  </Accordion>

  <Accordion title="Exec approvals in Discord">
    Discord는 DM에서 button 기반 exec approval을 지원하며, 선택적으로 원래 channel에도 approval prompt를 게시할 수 있습니다.

    config path:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers`
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, 기본값: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    `target`이 `channel` 또는 `both`이면 approval prompt가 channel에 표시됩니다. button은 approver로 설정된 사용자만 사용할 수 있으며, 다른 사용자는 ephemeral denial을 받습니다. prompt에는 command text가 포함되므로, trusted channel에서만 channel delivery를 켜는 것이 안전합니다. session key에서 channel ID를 파생할 수 없으면 OpenClaw는 DM delivery로 fallback합니다.

    이 handler의 gateway auth는 다른 gateway client와 같은 shared credential resolution contract를 사용합니다.

    - env-first local auth (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`, 그다음 `gateway.auth.*`)
    - local mode에서는 `gateway.auth.*`가 unset일 때만 `gateway.remote.*`를 fallback으로 사용하며, 설정은 되었지만 resolve되지 않은 local SecretRef는 fail closed
    - applicable한 경우 `gateway.remote.*` 기반 remote-mode 지원
    - URL override는 override-safe하며, CLI override는 implicit credential을 재사용하지 않고 env override는 env credential만 사용

    approval이 unknown approval ID로 실패한다면 approver list와 feature enablement를 먼저 확인하세요.

    관련 문서: [Exec approvals](/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## Tools and action gates

Discord message action에는 messaging, channel admin, moderation, presence, metadata action이 포함됩니다.

핵심 예시:

- messaging: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- reactions: `react`, `reactions`, `emojiList`
- moderation: `timeout`, `kick`, `ban`
- presence: `setPresence`

action gate는 `channels.discord.actions.*` 아래에 있습니다.

기본 gate 동작:

| Action group                                                                                                                                                             | Default  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | enabled  |
| roles                                                                                                                                                                    | disabled |
| moderation                                                                                                                                                               | disabled |
| presence                                                                                                                                                                 | disabled |

## Components v2 UI

OpenClaw는 Discord components v2를 exec approval과 cross-context marker에 사용합니다. Discord message action도 custom UI를 위해 `components`를 받을 수 있습니다. 이 기능은 고급 사용 사례이며 Carbon component instance가 필요합니다. legacy `embeds`도 계속 쓸 수 있지만 권장하지는 않습니다.

- `channels.discord.ui.components.accentColor`는 Discord component container의 accent color(hex)를 설정합니다.
- account별로는 `channels.discord.accounts.<id>.ui.components.accentColor`를 사용합니다.
- components v2가 존재하면 `embeds`는 무시됩니다.

예시:

```json5
{
  channels: {
    discord: {
      ui: {
        components: {
          accentColor: "#5865F2",
        },
      },
    },
  },
}
```

## Voice channels

OpenClaw는 Discord voice channel에 참가해 realtime, continuous conversation을 수행할 수 있습니다. 이는 voice message attachment와는 별도 기능입니다.

요구 사항:

- native command를 활성화해야 함(`commands.native` 또는 `channels.discord.commands.native`)
- `channels.discord.voice`를 설정해야 함
- target voice channel에서 bot에 Connect + Speak 권한이 있어야 함

세션 제어는 Discord 전용 native command `/vc join|leave|status`를 사용합니다. 이 command는 account default agent를 사용하며, 다른 Discord command와 같은 allowlist와 group policy를 따릅니다.

auto-join 예시:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        tts: {
          provider: "openai",
          openai: { voice: "alloy" },
        },
      },
    },
  },
}
```

참고:

- `voice.tts`는 voice playback에 대해서만 `messages.tts`를 override함
- voice transcript turn은 Discord `allowFrom`(또는 `dm.allowFrom`) 기준으로 owner status를 파생하며, non-owner speaker는 owner-only tool(예: `gateway`, `cron`)에 접근할 수 없음
- voice는 기본 활성화 상태이며, 비활성화하려면 `channels.discord.voice.enabled=false`
- `voice.daveEncryption`과 `voice.decryptionFailureTolerance`는 `@discordjs/voice` join option으로 그대로 전달됨
- `@discordjs/voice` 기본값은 각각 `daveEncryption=true`, `decryptionFailureTolerance=24`
- OpenClaw는 receive decrypt failure를 감시하고, 짧은 시간 동안 반복 실패가 발생하면 voice channel을 leave/rejoin하여 자동 복구를 시도함
- receive log에 `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`가 반복되면, upstream `@discordjs/voice` receive bug인 [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419)와 비교해 보세요

## Voice messages

Discord voice message는 waveform preview와 함께 표시되며 OGG/Opus audio와 metadata가 필요합니다. OpenClaw는 waveform을 자동 생성하지만, gateway host에 `ffmpeg`와 `ffprobe`가 있어야 audio file을 검사하고 변환할 수 있습니다.

요구 사항 및 제약:

- **local file path**를 제공해야 함(URL은 거부됨)
- text content는 생략해야 함(Discord는 같은 payload에서 text + voice message를 허용하지 않음)
- 어떤 audio format이든 입력 가능하며, 필요하면 OpenClaw가 OGG/Opus로 변환

예시:

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Troubleshooting

<AccordionGroup>
  <Accordion title="Used disallowed intents or bot sees no guild messages">

    - Message Content Intent 활성화
    - user/member resolution이 필요하면 Server Members Intent도 활성화
    - intent를 바꾼 뒤 gateway 재시작

  </Accordion>

  <Accordion title="Guild messages blocked unexpectedly">

    - `groupPolicy` 확인
    - `channels.discord.guilds`의 guild allowlist 확인
    - guild에 `channels` map이 있으면 listed channel만 허용됨
    - `requireMention` 동작과 mention pattern 확인

    유용한 점검 명령:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false but still blocked">
    흔한 원인:

    - `groupPolicy="allowlist"`인데 일치하는 guild/channel allowlist가 없음
    - `requireMention`을 잘못된 위치에 설정함(`channels.discord.guilds` 또는 channel entry 아래여야 함)
    - sender가 guild/channel `users` allowlist에서 차단됨

  </Accordion>

  <Accordion title="Long-running handlers time out or duplicate replies">

    흔한 log 예시:

    - `Listener DiscordMessageListener timed out after 30000ms for event MESSAGE_CREATE`
    - `Slow listener detected ...`
    - `discord inbound worker timed out after ...`

    listener budget 조절:

    - single-account: `channels.discord.eventQueue.listenerTimeout`
    - multi-account: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`

    worker run timeout 조절:

    - single-account: `channels.discord.inboundWorker.runTimeoutMs`
    - multi-account: `channels.discord.accounts.<accountId>.inboundWorker.runTimeoutMs`
    - 기본값: `1800000` (30 minutes), `0`이면 비활성화

    권장 baseline:

```json5
{
  channels: {
    discord: {
      accounts: {
        default: {
          eventQueue: {
            listenerTimeout: 120000,
          },
          inboundWorker: {
            runTimeoutMs: 1800000,
          },
        },
      },
    },
  },
}
```

    느린 listener 초기화에는 `eventQueue.listenerTimeout`을 사용하고, queued agent turn에 별도 safety valve가 필요할 때만 `inboundWorker.runTimeoutMs`를 조정하세요.

  </Accordion>

  <Accordion title="Permissions audit mismatches">
    `channels status --probe`의 permission check는 numeric channel ID에서만 완전하게 동작합니다.

    slug key를 사용해도 runtime matching은 작동할 수 있지만, probe는 권한을 완전히 검증할 수 없습니다.

  </Accordion>

  <Accordion title="DM and pairing issues">

    - DM 비활성화: `channels.discord.dm.enabled=false`
    - DM policy 비활성화: `channels.discord.dmPolicy="disabled"` (legacy: `channels.discord.dm.policy`)
    - `pairing` mode에서 pairing approval 대기 중

  </Accordion>

  <Accordion title="Bot to bot loops">
    기본적으로 bot이 작성한 메시지는 무시됩니다.

    `channels.discord.allowBots=true`를 사용하는 경우에는 loop를 피할 수 있도록 strict mention과 allowlist 규칙을 함께 사용하세요.
    bot mention이 있는 메시지만 허용하려면 `channels.discord.allowBots="mentions"`가 더 안전합니다.

  </Accordion>

  <Accordion title="Voice STT drops with DecryptionFailed(...)">

    - Discord voice receive recovery logic가 포함되도록 OpenClaw를 최신 상태로 유지(`openclaw update`)
    - `channels.discord.voice.daveEncryption=true` 확인(기본값)
    - 우선 `channels.discord.voice.decryptionFailureTolerance=24`(upstream 기본값)로 시작하고 필요할 때만 조정
    - 다음 log를 확인:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - automatic rejoin 이후에도 실패가 계속되면 log를 수집해 [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419)와 비교

  </Accordion>
</AccordionGroup>

## Configuration reference pointers

주요 reference:

- [Configuration reference - Discord](/gateway/configuration-reference#discord)

중요한 Discord field:

- startup/auth: `enabled`, `token`, `accounts.*`, `allowBots`
- policy: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- command: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- event queue: `eventQueue.listenerTimeout`(listener budget), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- inbound worker: `inboundWorker.runTimeoutMs`
- reply/history: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- delivery: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming`(legacy alias: `streamMode`), `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- media/retry: `mediaMaxMb`, `retry`
  - `mediaMaxMb`는 outbound Discord upload 상한(default: `8MB`)
- actions: `actions.*`
- presence: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- features: `threadBindings`, top-level `bindings[]`(`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

## Safety and operations

- bot token은 secret으로 취급하세요. supervised environment에서는 `DISCORD_BOT_TOKEN` 사용을 권장합니다.
- Discord permission은 최소 권한 원칙으로 부여하세요.
- command 배포 상태가 stale해 보이면 gateway를 재시작하고 `openclaw channels status --probe`로 다시 확인하세요.

## Related

- [Pairing](/channels/pairing)
- [Channel routing](/channels/channel-routing)
- [Multi-agent routing](/concepts/multi-agent)
- [Troubleshooting](/channels/troubleshooting)
- [Slash commands](/tools/slash-commands)
