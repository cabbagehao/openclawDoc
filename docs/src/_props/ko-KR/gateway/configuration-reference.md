---
title: "구성 참조"
description: "~/.openclaw/openclaw.json의 전체 필드별 참조"
summary: "모든 OpenClaw 구성 키, 기본값, 채널 설정에 대한 전체 참조"
read_when:
  - 정확한 필드 수준의 구성 의미론이나 기본값이 필요할 때
  - 채널, 모델, gateway, 또는 도구 구성 블록을 검증할 때
---

# 구성 참조

`~/.openclaw/openclaw.json`에서 사용할 수 있는 모든 필드입니다. 작업 중심 개요는 [Configuration](/gateway/configuration)을 참고하세요.

구성 형식은 **JSON5**입니다(주석 + trailing comma 허용). 모든 필드는 선택 사항이며, 생략하면 OpenClaw가 안전한 기본값을 사용합니다.

***

## 채널

각 채널은 해당 구성 섹션이 존재하면 자동으로 시작됩니다(`enabled: false`가 아닌 한).

### DM 및 그룹 접근

모든 채널은 DM 정책과 그룹 정책을 지원합니다.

| DM policy           | 동작                                             |
| ------------------- | ---------------------------------------------- |
| `pairing` (default) | 알 수 없는 발신자는 일회성 pairing code를 받고, 소유자가 승인해야 함  |
| `allowlist`         | `allowFrom`(또는 paired allow store)에 있는 발신자만 허용 |
| `open`              | 모든 수신 DM 허용(`allowFrom: ["*"]` 필요)             |
| `disabled`          | 모든 수신 DM 무시                                    |

| Group policy          | 동작                                        |
| --------------------- | ----------------------------------------- |
| `allowlist` (default) | 구성된 allowlist와 일치하는 그룹만 허용                |
| `open`                | 그룹 allowlist를 우회함(mention gating은 계속 적용됨) |
| `disabled`            | 모든 그룹/룸 메시지를 차단                           |

<Note>
  `channels.defaults.groupPolicy`는 provider의 `groupPolicy`가 설정되지 않았을 때 사용할 기본값을 설정합니다.
  Pairing code는 1시간 후 만료됩니다. 대기 중인 DM pairing 요청은 **채널당 3개**로 제한됩니다.
  provider 블록이 아예 없으면(`channels.<provider>`가 없음), 런타임 그룹 정책은 시작 시 경고와 함께 `allowlist`(fail-closed)로 fallback됩니다.
</Note>

### 채널별 모델 override

특정 채널 ID를 특정 모델에 고정하려면 `channels.modelByChannel`을 사용하세요. 값은 `provider/model` 또는 구성된 모델 alias를 받을 수 있습니다. 이 채널 매핑은 세션에 이미 모델 override가 없는 경우에만 적용됩니다(예: `/model`로 설정된 경우 제외).

```json5
{
  channels: {
    modelByChannel: {
      discord: {
        "123456789012345678": "anthropic/claude-opus-4-6",
      },
      slack: {
        C1234567890: "openai/gpt-4.1",
      },
      telegram: {
        "-1001234567890": "openai/gpt-4.1-mini",
        "-1001234567890:topic:99": "anthropic/claude-sonnet-4-6",
      },
    },
  },
}
```

### 채널 기본값과 heartbeat

provider 전반에 걸쳐 공유되는 그룹 정책과 heartbeat 동작에는 `channels.defaults`를 사용하세요.

```json5
{
  channels: {
    defaults: {
      groupPolicy: "allowlist", // open | allowlist | disabled
      heartbeat: {
        showOk: false,
        showAlerts: true,
        useIndicator: true,
      },
    },
  },
}
```

* `channels.defaults.groupPolicy`: provider 수준 `groupPolicy`가 설정되지 않았을 때의 fallback 그룹 정책
* `channels.defaults.heartbeat.showOk`: heartbeat 출력에 정상 채널 상태를 포함
* `channels.defaults.heartbeat.showAlerts`: heartbeat 출력에 성능 저하/오류 상태를 포함
* `channels.defaults.heartbeat.useIndicator`: 간결한 indicator 스타일 heartbeat 출력을 렌더링

### WhatsApp

WhatsApp은 gateway의 web channel(Baileys Web)을 통해 동작합니다. 연결된 세션이 있으면 자동으로 시작됩니다.

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      chunkMode: "length", // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // blue ticks (false in self-chat mode)
      groups: {
        "*": { requireMention: true },
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
  web: {
    enabled: true,
    heartbeatSeconds: 60,
    reconnect: {
      initialMs: 2000,
      maxMs: 120000,
      factor: 1.4,
      jitter: 0.2,
      maxAttempts: 0,
    },
  },
}
```

<Accordion title="다중 계정 WhatsApp">
  ```json5
  {
    channels: {
      whatsapp: {
        accounts: {
          default: {},
          personal: {},
          biz: {
            // authDir: "~/.openclaw/credentials/whatsapp/biz",
          },
        },
      },
    },
  }
  ```

  * 발신 명령은 `default` 계정이 있으면 기본적으로 그 계정을 사용하고, 없으면 구성된 첫 번째 계정 id(정렬 기준)를 사용합니다.
  * 선택 사항인 `channels.whatsapp.defaultAccount`는 구성된 계정 id와 일치할 때 이 fallback 기본 계정 선택을 override합니다.
  * 레거시 단일 계정 Baileys auth dir은 `openclaw doctor`가 `whatsapp/default`로 마이그레이션합니다.
  * 계정별 override: `channels.whatsapp.accounts.<id>.sendReadReceipts`, `channels.whatsapp.accounts.<id>.dmPolicy`, `channels.whatsapp.accounts.<id>.allowFrom`
</Accordion>

### Telegram

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "your-bot-token",
      dmPolicy: "pairing",
      allowFrom: ["tg:123456789"],
      groups: {
        "*": { requireMention: true },
        "-1001234567890": {
          allowFrom: ["@admin"],
          systemPrompt: "Keep answers brief.",
          topics: {
            "99": {
              requireMention: false,
              skills: ["search"],
              systemPrompt: "Stay on topic.",
            },
          },
        },
      },
      customCommands: [
        { command: "backup", description: "Git backup" },
        { command: "generate", description: "Create an image" },
      ],
      historyLimit: 50,
      replyToMode: "first", // off | first | all
      linkPreview: true,
      streaming: "partial", // off | partial | block | progress (default: off)
      actions: { reactions: true, sendMessage: true },
      reactionNotifications: "own", // off | own | all
      mediaMaxMb: 100,
      retry: {
        attempts: 3,
        minDelayMs: 400,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
      network: {
        autoSelectFamily: true,
        dnsResultOrder: "ipv4first",
      },
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook",
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook",
    },
  },
}
```

* Bot token: `channels.telegram.botToken` 또는 `channels.telegram.tokenFile`, 기본 계정에 대해서는 `TELEGRAM_BOT_TOKEN`이 fallback입니다.
* 선택 사항인 `channels.telegram.defaultAccount`는 구성된 계정 id와 일치할 때 기본 계정 선택을 override합니다.
* 다중 계정 설정(계정 id 2개 이상)에서는 fallback 라우팅을 피하려면 명시적 기본값(`channels.telegram.defaultAccount` 또는 `channels.telegram.accounts.default`)을 설정하세요. 이것이 없거나 잘못되면 `openclaw doctor`가 경고합니다.
* `configWrites: false`는 Telegram이 시작한 config 쓰기(supergroup ID migration, `/config set|unset`)를 차단합니다.
* `type: "acp"`인 최상위 `bindings[]` 항목은 forum topic에 대한 지속적 ACP binding을 구성합니다(`match.peer.id`에는 정규 `chatId:topic:topicId` 사용). 필드 의미는 [ACP Agents](/tools/acp-agents#channel-specific-settings)에서 공유됩니다.
* Telegram stream preview는 `sendMessage` + `editMessageText`를 사용합니다(직접 채팅과 그룹 채팅 모두에서 동작).
* 재시도 정책: [Retry policy](/concepts/retry) 참고

### Discord

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: "your-bot-token",
      mediaMaxMb: 8,
      allowBots: false,
      actions: {
        reactions: true,
        stickers: true,
        polls: true,
        permissions: true,
        messages: true,
        threads: true,
        pins: true,
        search: true,
        memberInfo: true,
        roleInfo: true,
        roles: false,
        channelInfo: true,
        voiceStatus: true,
        events: true,
        moderation: false,
      },
      replyToMode: "off", // off | first | all
      dmPolicy: "pairing",
      allowFrom: ["1234567890", "123456789012345678"],
      dm: { enabled: true, groupEnabled: false, groupChannels: ["openclaw-dm"] },
      guilds: {
        "123456789012345678": {
          slug: "friends-of-openclaw",
          requireMention: false,
          ignoreOtherMentions: true,
          reactionNotifications: "own",
          users: ["987654321098765432"],
          channels: {
            general: { allow: true },
            help: {
              allow: true,
              requireMention: true,
              users: ["987654321098765432"],
              skills: ["docs"],
              systemPrompt: "Short answers only.",
            },
          },
        },
      },
      historyLimit: 20,
      textChunkLimit: 2000,
      chunkMode: "length", // length | newline
      streaming: "off", // off | partial | block | progress (progress maps to partial on Discord)
      maxLinesPerMessage: 17,
      ui: {
        components: {
          accentColor: "#5865F2",
        },
      },
      threadBindings: {
        enabled: true,
        idleHours: 24,
        maxAgeHours: 0,
        spawnSubagentSessions: false, // opt-in for sessions_spawn({ thread: true })
      },
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
      retry: {
        attempts: 3,
        minDelayMs: 500,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
  },
}
```

* Token: `channels.discord.token`, 기본 계정에 대해서는 `DISCORD_BOT_TOKEN`이 fallback입니다.
* 선택 사항인 `channels.discord.defaultAccount`는 구성된 계정 id와 일치할 때 기본 계정 선택을 override합니다.
* 전달 대상에는 `user:<id>`(DM) 또는 `channel:<id>`(guild channel)를 사용하세요. 숫자 ID만 단독으로 쓰는 것은 거부됩니다.
* Guild slug는 소문자에 공백을 `-`로 바꾼 형태이며, 채널 키는 slug 처리된 이름(`#` 없음)을 사용합니다. 가능하면 guild ID를 선호하세요.
* 봇이 작성한 메시지는 기본적으로 무시됩니다. `allowBots: true`는 이를 허용하며, `allowBots: "mentions"`는 봇을 mention한 bot 메시지만 허용합니다(자기 자신의 메시지는 계속 필터링됨).
* `channels.discord.guilds.<id>.ignoreOtherMentions`(및 채널 override)는 봇을 mention하지 않고 다른 사용자나 role만 mention한 메시지를 버립니다(@everyone/@here 제외).
* `maxLinesPerMessage`(기본 17)는 2000자 이하라도 세로로 긴 메시지를 분할합니다.
* `channels.discord.threadBindings`는 Discord thread-bound 라우팅을 제어합니다.
  * `enabled`: thread-bound session 기능(`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, bound delivery/routing)에 대한 Discord override
  * `idleHours`: 비활성 auto-unfocus 시간(시간 단위)에 대한 Discord override(`0`이면 비활성화)
  * `maxAgeHours`: 하드 최대 수명 시간(시간 단위)에 대한 Discord override(`0`이면 비활성화)
  * `spawnSubagentSessions`: `sessions_spawn({ thread: true })`의 자동 thread 생성/binding에 대한 opt-in 스위치
* `type: "acp"`인 최상위 `bindings[]` 항목은 채널과 thread에 대한 지속적 ACP binding을 구성합니다(`match.peer.id`에는 channel/thread id 사용). 필드 의미는 [ACP Agents](/tools/acp-agents#channel-specific-settings)에서 공유됩니다.
* `channels.discord.ui.components.accentColor`는 Discord components v2 container의 accent color를 설정합니다.
* `channels.discord.voice`는 Discord voice channel 대화와 선택적 auto-join + TTS override를 활성화합니다.
* `channels.discord.voice.daveEncryption`과 `channels.discord.voice.decryptionFailureTolerance`는 `@discordjs/voice` DAVE 옵션에 그대로 전달됩니다(기본값은 각각 `true`, `24`).
* OpenClaw는 반복적인 decrypt 실패 후 voice session에서 나갔다가 다시 들어오는 방식으로 voice receive recovery도 시도합니다.
* `channels.discord.streaming`은 정규 stream mode 키입니다. 레거시 `streamMode`와 boolean `streaming` 값은 자동 마이그레이션됩니다.
* `channels.discord.autoPresence`는 런타임 가용성을 봇 presence에 매핑하며(healthy => online, degraded => idle, exhausted => dnd), 선택적 status text override를 허용합니다.
* `channels.discord.dangerouslyAllowNameMatching`은 변경 가능한 name/tag 매칭을 다시 활성화합니다(break-glass 호환 모드).

**Reaction notification mode:** `off`(없음), `own`(봇의 메시지, 기본값), `all`(모든 메시지), `allowlist`(모든 메시지에서 `guilds.<id>.users` 사용).

### Google Chat

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      audienceType: "app-url", // app-url | project-number
      audience: "https://gateway.example.com/googlechat",
      webhookPath: "/googlechat",
      botUser: "users/1234567890",
      dm: {
        enabled: true,
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": { allow: true, requireMention: true },
      },
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

* Service account JSON: inline(`serviceAccount`) 또는 file 기반(`serviceAccountFile`)
* Service account SecretRef도 지원됩니다(`serviceAccountRef`).
* Env fallback: `GOOGLE_CHAT_SERVICE_ACCOUNT` 또는 `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`
* 전달 대상에는 `spaces/<spaceId>` 또는 `users/<userId>`를 사용하세요.
* `channels.googlechat.dangerouslyAllowNameMatching`은 변경 가능한 email principal 매칭을 다시 활성화합니다(break-glass 호환 모드).

### Slack

```json5
{
  channels: {
    slack: {
      enabled: true,
      botToken: "xoxb-...",
      appToken: "xapp-...",
      dmPolicy: "pairing",
      allowFrom: ["U123", "U456", "*"],
      dm: { enabled: true, groupEnabled: false, groupChannels: ["G123"] },
      channels: {
        C123: { allow: true, requireMention: true, allowBots: false },
        "#general": {
          allow: true,
          requireMention: true,
          allowBots: false,
          users: ["U123"],
          skills: ["docs"],
          systemPrompt: "Short answers only.",
        },
      },
      historyLimit: 50,
      allowBots: false,
      reactionNotifications: "own",
      reactionAllowlist: ["U123"],
      replyToMode: "off", // off | first | all
      thread: {
        historyScope: "thread", // thread | channel
        inheritParent: false,
      },
      actions: {
        reactions: true,
        messages: true,
        pins: true,
        memberInfo: true,
        emojiList: true,
      },
      slashCommand: {
        enabled: true,
        name: "openclaw",
        sessionPrefix: "slack:slash",
        ephemeral: true,
      },
      typingReaction: "hourglass_flowing_sand",
      textChunkLimit: 4000,
      chunkMode: "length",
      streaming: "partial", // off | partial | block | progress (preview mode)
      nativeStreaming: true, // use Slack native streaming API when streaming=partial
      mediaMaxMb: 20,
    },
  },
}
```

* **Socket mode**는 `botToken`과 `appToken`이 모두 필요합니다(기본 계정 env fallback은 `SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN`).
* **HTTP mode**는 `botToken`과 `signingSecret`(루트 또는 계정별)이 필요합니다.
* `configWrites: false`는 Slack이 시작한 config 쓰기를 차단합니다.
* 선택 사항인 `channels.slack.defaultAccount`는 구성된 계정 id와 일치할 때 기본 계정 선택을 override합니다.
* `channels.slack.streaming`은 정규 stream mode 키입니다. 레거시 `streamMode`와 boolean `streaming` 값은 자동 마이그레이션됩니다.
* 전달 대상에는 `user:<id>`(DM) 또는 `channel:<id>`를 사용하세요.

**Reaction notification mode:** `off`, `own`(기본값), `all`, `allowlist`(`reactionAllowlist` 사용)

**Thread session isolation:** `thread.historyScope`는 thread별(기본값) 또는 채널 전체 공유입니다. `thread.inheritParent`는 부모 채널 transcript를 새 thread에 복사합니다.

* `typingReaction`은 응답이 실행 중인 동안 수신 Slack 메시지에 임시 reaction을 추가하고 완료 시 제거합니다. `"hourglass_flowing_sand"` 같은 Slack emoji shortcode를 사용하세요.

| Action group | 기본값     | 참고              |
| ------------ | ------- | --------------- |
| reactions    | enabled | 반응 + 반응 목록      |
| messages     | enabled | 읽기/전송/수정/삭제     |
| pins         | enabled | 고정/해제/목록        |
| memberInfo   | enabled | 멤버 정보           |
| emojiList    | enabled | 사용자 정의 emoji 목록 |

### Mattermost

Mattermost는 plugin으로 제공됩니다: `openclaw plugins install @openclaw/mattermost`.

```json5
{
  channels: {
    mattermost: {
      enabled: true,
      botToken: "mm-token",
      baseUrl: "https://chat.example.com",
      dmPolicy: "pairing",
      chatmode: "oncall", // oncall | onmessage | onchar
      oncharPrefixes: [">", "!"],
      commands: {
        native: true, // opt-in
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Optional explicit URL for reverse-proxy/public deployments
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

채팅 모드: `oncall`(@-mention 시 응답, 기본값), `onmessage`(모든 메시지), `onchar`(트리거 prefix로 시작하는 메시지).

Mattermost native command가 활성화되면:

* `commands.callbackPath`는 전체 URL이 아니라 경로여야 합니다(예: `/api/channels/mattermost/command`).
* `commands.callbackUrl`은 OpenClaw gateway endpoint로 해석되어야 하며 Mattermost 서버에서 접근 가능해야 합니다.
* private/tailnet/internal callback host의 경우 Mattermost에서
  `ServiceSettings.AllowedUntrustedInternalConnections`에 callback host/domain을 포함해야 할 수 있습니다.
  전체 URL이 아니라 host/domain 값을 사용하세요.
* `channels.mattermost.configWrites`: Mattermost가 시작한 config 쓰기를 허용하거나 거부
* `channels.mattermost.requireMention`: 채널에서 응답하기 전에 `@mention`을 요구
* 선택 사항인 `channels.mattermost.defaultAccount`는 구성된 계정 id와 일치할 때 기본 계정 선택을 override합니다.

### Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // optional account binding
      dmPolicy: "pairing",
      allowFrom: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      configWrites: true,
      reactionNotifications: "own", // off | own | all | allowlist
      reactionAllowlist: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      historyLimit: 50,
    },
  },
}
```

**Reaction notification mode:** `off`, `own`(기본값), `all`, `allowlist`(`reactionAllowlist` 사용)

* `channels.signal.account`: 채널 시작을 특정 Signal 계정 identity에 고정
* `channels.signal.configWrites`: Signal이 시작한 config 쓰기를 허용하거나 거부
* 선택 사항인 `channels.signal.defaultAccount`는 구성된 계정 id와 일치할 때 기본 계정 선택을 override합니다.

### BlueBubbles

BlueBubbles는 권장 iMessage 경로입니다(plugin 기반, `channels.bluebubbles` 아래에서 구성).

```json5
{
  channels: {
    bluebubbles: {
      enabled: true,
      dmPolicy: "pairing",
      // serverUrl, password, webhookPath, group controls, and advanced actions:
      // see /channels/bluebubbles
    },
  },
}
```

* 여기서 다루는 핵심 키 경로: `channels.bluebubbles`, `channels.bluebubbles.dmPolicy`
* 선택 사항인 `channels.bluebubbles.defaultAccount`는 구성된 계정 id와 일치할 때 기본 계정 선택을 override합니다.
* 전체 BlueBubbles 채널 구성은 [BlueBubbles](/channels/bluebubbles)에 문서화되어 있습니다.

### iMessage

OpenClaw는 `imsg rpc`를 실행합니다(stdio 위의 JSON-RPC). daemon이나 port는 필요하지 않습니다.

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "imsg",
      dbPath: "~/Library/Messages/chat.db",
      remoteHost: "user@gateway-host",
      dmPolicy: "pairing",
      allowFrom: ["+15555550123", "user@example.com", "chat_id:123"],
      historyLimit: 50,
      includeAttachments: false,
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      mediaMaxMb: 16,
      service: "auto",
      region: "US",
    },
  },
}
```

* 선택 사항인 `channels.imessage.defaultAccount`는 구성된 계정 id와 일치할 때 기본 계정 선택을 override합니다.

* Messages DB에 대한 Full Disk Access가 필요합니다.

* 가능하면 `chat_id:<id>` 대상을 선호하세요. 채팅 목록은 `imsg chats --limit 20`으로 확인하세요.

* `cliPath`는 SSH wrapper를 가리킬 수 있으며, SCP attachment fetching을 위해 `remoteHost`(`host` 또는 `user@host`)를 설정하세요.

* `attachmentRoots`와 `remoteAttachmentRoots`는 수신 attachment 경로를 제한합니다(기본값: `/Users/*/Library/Messages/Attachments`).

* SCP는 strict host-key checking을 사용하므로 relay host key가 이미 `~/.ssh/known_hosts`에 있어야 합니다.

* `channels.imessage.configWrites`: iMessage가 시작한 config 쓰기를 허용하거나 거부

<Accordion title="iMessage SSH wrapper 예시">
  ```bash
  #!/usr/bin/env bash
  exec ssh -T gateway-host imsg "$@"
  ```
</Accordion>

### Microsoft Teams

Microsoft Teams는 extension 기반이며 `channels.msteams` 아래에서 구성합니다.

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, team/channel policies:
      // see /channels/msteams
    },
  },
}
```

* 여기서 다루는 핵심 키 경로: `channels.msteams`, `channels.msteams.configWrites`
* 전체 Teams 구성(credentials, webhook, DM/group policy, 팀별/채널별 override)은 [Microsoft Teams](/channels/msteams)에 문서화되어 있습니다.

### IRC

IRC는 extension 기반이며 `channels.irc` 아래에서 구성합니다.

```json5
{
  channels: {
    irc: {
      enabled: true,
      dmPolicy: "pairing",
      configWrites: true,
      nickserv: {
        enabled: true,
        service: "NickServ",
        password: "${IRC_NICKSERV_PASSWORD}",
        register: false,
        registerEmail: "bot@example.com",
      },
    },
  },
}
```

* 여기서 다루는 핵심 키 경로: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`
* 선택 사항인 `channels.irc.defaultAccount`는 구성된 계정 id와 일치할 때 기본 계정 선택을 override합니다.
* 전체 IRC 채널 구성(host/port/TLS/channels/allowlist/mention gating)은 [IRC](/channels/irc)에 문서화되어 있습니다.

### 다중 계정(모든 채널)

채널별로 여러 계정을 실행합니다(각 계정은 자체 `accountId`를 가짐).

```json5
{
  channels: {
    telegram: {
      accounts: {
        default: {
          name: "Primary bot",
          botToken: "123456:ABC...",
        },
        alerts: {
          name: "Alerts bot",
          botToken: "987654:XYZ...",
        },
      },
    },
  },
}
```

* `accountId`를 생략하면 `default`가 사용됩니다(CLI + routing).
* Env token은 **기본** 계정에만 적용됩니다.
* 기본 채널 설정은 계정별로 override되지 않는 한 모든 계정에 적용됩니다.
* `bindings[].match.accountId`를 사용해 각 계정을 서로 다른 agent로 라우팅하세요.
* 단일 계정 최상위 채널 구성 상태에서 `openclaw channels add`(또는 채널 onboarding)로 non-default 계정을 추가하면, OpenClaw는 먼저 계정 범위의 최상위 단일 계정 값을 `channels.<channel>.accounts.default`로 옮겨 원래 계정이 계속 동작하도록 합니다.
* 기존의 채널 전용 binding(`accountId` 없음)은 계속 기본 계정과 매칭되며, 계정 범위 binding은 선택 사항으로 유지됩니다.
* `openclaw doctor --fix`도 명명된 계정은 있는데 `default`가 없는 경우, 계정 범위의 최상위 단일 계정 값을 `accounts.default`로 옮겨 혼합 구조를 복구합니다.

### 기타 extension 채널

많은 extension 채널은 `channels.<id>` 형태로 구성되며, 전용 채널 페이지에 문서화되어 있습니다(예: Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat, Twitch).
전체 채널 색인은 [Channels](/channels)를 참고하세요.

### 그룹 채팅 mention gating

그룹 메시지는 기본적으로 **mention 필요**입니다(metadata mention 또는 regex pattern). WhatsApp, Telegram, Discord, Google Chat, iMessage 그룹 채팅에 적용됩니다.

**Mention 유형:**

* **Metadata mention**: 네이티브 플랫폼 @-mention. WhatsApp self-chat mode에서는 무시됩니다.
* **텍스트 패턴**: `agents.list[].groupChat.mentionPatterns`의 regex pattern. 항상 검사됩니다.
* Mention gating은 감지가 가능한 경우에만 적용됩니다(네이티브 mention 또는 최소 하나의 pattern).

```json5
{
  messages: {
    groupChat: { historyLimit: 50 },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit`는 전역 기본값을 설정합니다. 채널은 `channels.<channel>.historyLimit`(또는 계정별)로 override할 수 있습니다. 비활성화하려면 `0`으로 설정하세요.

#### DM history limit

```json5
{
  channels: {
    telegram: {
      dmHistoryLimit: 30,
      dms: {
        "123456789": { historyLimit: 50 },
      },
    },
  },
}
```

해결 순서: DM별 override → provider 기본값 → 제한 없음(모두 유지)

지원: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`

#### Self-chat mode

자기 번호를 `allowFrom`에 포함하면 self-chat mode가 활성화됩니다(네이티브 @-mention은 무시하고 텍스트 패턴에만 응답).

```json5
{
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: { "*": { requireMention: true } },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: { mentionPatterns: ["reisponde", "@openclaw"] },
      },
    ],
  },
}
```

### 명령(채팅 명령 처리)

```json5
{
  commands: {
    native: "auto", // register native commands when supported
    text: true, // parse /commands in chat messages
    bash: false, // allow ! (alias: /bash)
    bashForegroundMs: 2000,
    config: false, // allow /config
    debug: false, // allow /debug
    restart: false, // allow /restart + gateway restart tool
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

<Accordion title="명령 세부사항">
  * 텍스트 명령은 앞에 `/`가 있는 **독립 실행형** 메시지여야 합니다.
  * `native: "auto"`는 Discord/Telegram에서는 native command를 켜고, Slack에서는 끕니다.
  * 채널별 override: `channels.discord.commands.native`(bool 또는 `"auto"`). `false`는 이전에 등록한 명령을 제거합니다.
  * `channels.telegram.customCommands`는 Telegram bot menu에 추가 항목을 넣습니다.
  * `bash: true`는 host shell에 대한 `! <cmd>`를 활성화합니다. `tools.elevated.enabled`와 발신자가 `tools.elevated.allowFrom.<channel>`에 포함되어 있어야 합니다.
  * `config: true`는 `openclaw.json`을 읽고 쓰는 `/config`를 활성화합니다. gateway `chat.send` client의 경우, 지속적인 `/config set|unset` 쓰기에는 `operator.admin`도 필요합니다. 읽기 전용 `/config show`는 일반 write-scope operator client에도 계속 제공됩니다.
  * `channels.<provider>.configWrites`는 채널별 config mutation을 제어합니다(기본값: true).
  * `allowFrom`은 provider별입니다. 설정되면 이것이 **유일한** 권한 부여 소스가 됩니다(채널 allowlist/pairing 및 `useAccessGroups`는 무시됨).
  * `useAccessGroups: false`는 `allowFrom`이 설정되지 않았을 때 command가 access-group 정책을 우회하도록 허용합니다.
</Accordion>

***

## Agent 기본값

### `agents.defaults.workspace`

기본값: `~/.openclaw/workspace`

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

system prompt의 Runtime 줄에 표시할 선택적 repository root입니다. 설정하지 않으면 OpenClaw가 workspace에서 위로 탐색하며 자동 감지합니다.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skipBootstrap`

workspace bootstrap 파일(`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`)의 자동 생성을 비활성화합니다.

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.bootstrapMaxChars`

잘라내기 전 workspace bootstrap 파일당 최대 문자 수. 기본값: `20000`

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

모든 workspace bootstrap 파일에서 주입되는 총 문자 수의 최대값. 기본값: `150000`

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 150000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

bootstrap context가 잘릴 때 agent에게 보이는 경고 텍스트를 제어합니다.
기본값: `"once"`

* `"off"`: 시스템 프롬프트에 경고 텍스트를 주입하지 않음
* `"once"`: 고유한 잘림 시그니처당 한 번만 경고 주입(권장)
* `"always"`: 잘림이 있을 때마다 매 실행 시 경고 주입

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### `agents.defaults.imageMaxDimensionPx`

provider 호출 전에 transcript/tool image block에서 가장 긴 이미지 변의 최대 픽셀 크기.
기본값: `1200`

값이 낮을수록 보통 vision-token 사용량과 screenshot가 많은 실행의 request payload 크기가 줄어듭니다.
값이 높을수록 더 많은 시각적 디테일을 유지합니다.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

system prompt context용 timezone입니다(메시지 timestamp용이 아님). 설정하지 않으면 host timezone을 사용합니다.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

system prompt의 시간 형식. 기본값: `auto`(OS 환경설정)

```json5
{
  agents: { defaults: { timeFormat: "auto" } }, // auto | 12 | 24
}
```

### `agents.defaults.model`

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "minimax/MiniMax-M2.5": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.5"],
      },
      imageModel: {
        primary: "openrouter/qwen/qwen-2.5-vl-72b-instruct:free",
        fallbacks: ["openrouter/google/gemini-2.0-flash-vision:free"],
      },
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5-mini"],
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
      elevatedDefault: "on",
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      contextTokens: 200000,
      maxConcurrent: 3,
    },
  },
}
```

* `model`: 문자열(`"provider/model"`) 또는 객체(`{ primary, fallbacks }`)를 받을 수 있습니다.
  * 문자열 형식은 primary model만 설정합니다.
  * 객체 형식은 primary와 순서가 있는 failover model을 함께 설정합니다.
* `imageModel`: 문자열(`"provider/model"`) 또는 객체(`{ primary, fallbacks }`)를 받을 수 있습니다.
  * `image` 도구 경로의 vision-model 구성으로 사용됩니다.
  * 선택된/기본 모델이 image 입력을 받을 수 없을 때 fallback 라우팅에도 사용됩니다.
* `pdfModel`: 문자열(`"provider/model"`) 또는 객체(`{ primary, fallbacks }`)를 받을 수 있습니다.
  * `pdf` 도구의 모델 라우팅에 사용됩니다.
  * 생략하면 PDF 도구는 `imageModel`, 그다음 provider의 best-effort 기본값으로 fallback됩니다.
* `pdfMaxBytesMb`: 호출 시 `maxBytesMb`를 넘기지 않았을 때 `pdf` 도구의 기본 PDF 크기 제한
* `pdfMaxPages`: `pdf` 도구의 extraction fallback mode에서 고려할 기본 최대 페이지 수
* `model.primary`: 형식은 `provider/model`(예: `anthropic/claude-opus-4-6`)입니다. provider를 생략하면 OpenClaw는 `anthropic`으로 가정합니다(권장되지 않음).
* `models`: `/model`에 사용할 구성된 모델 catalog 및 allowlist입니다. 각 항목에는 `alias`(shortcut)와 `params`(provider별, 예: `temperature`, `maxTokens`, `cacheRetention`, `context1m`)를 포함할 수 있습니다.
* `params` 병합 우선순위(config): `agents.defaults.models["provider/model"].params`가 기반이며, 그 다음 `agents.list[].params`(일치하는 agent id)가 키별로 override합니다.
* 이 필드를 변경하는 config writer(예: `/models set`, `/models set-image`, fallback add/remove command)는 가능한 경우 정규 객체 형식으로 저장하고 기존 fallback 목록을 유지합니다.
* `maxConcurrent`: 세션 전반에서 병렬 agent 실행 최대 수(각 세션은 여전히 직렬화됨). 기본값: 1

**내장 alias shorthand** (`agents.defaults.models`에 해당 모델이 있을 때만 적용):

| Alias               | Model                                  |
| ------------------- | -------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`            |
| `sonnet`            | `anthropic/claude-sonnet-4-6`          |
| `gpt`               | `openai/gpt-5.4`                       |
| `gpt-mini`          | `openai/gpt-5-mini`                    |
| `gemini`            | `google/gemini-3.1-pro-preview`        |
| `gemini-flash`      | `google/gemini-3-flash-preview`        |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview` |

사용자가 구성한 alias는 항상 기본값보다 우선합니다.

Z.AI GLM-4.x 모델은 `--thinking off`를 설정하거나 `agents.defaults.models["zai/<model>"].params.thinking`을 직접 정의하지 않는 한 thinking mode를 자동 활성화합니다.
Z.AI 모델은 tool call streaming을 위해 기본적으로 `tool_stream`을 활성화합니다. 비활성화하려면 `agents.defaults.models["zai/<model>"].params.tool_stream`을 `false`로 설정하세요.
Anthropic Claude 4.6 모델은 명시적 thinking level이 없으면 기본적으로 `adaptive` thinking을 사용합니다.

### `agents.defaults.cliBackends`

text-only fallback 실행용 선택적 CLI backend입니다(tool call 없음). API provider가 실패할 때 백업으로 유용합니다.

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          systemPromptArg: "--system",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

* CLI backend는 text-first이며, 도구는 항상 비활성화됩니다.
* `sessionArg`가 설정되어 있으면 session을 지원합니다.
* `imageArg`가 파일 경로를 받을 수 있으면 image pass-through도 지원됩니다.

### `agents.defaults.heartbeat`

주기적인 heartbeat 실행입니다.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m disables
        model: "openai/gpt-5.2-mini",
        includeReasoning: false,
        lightContext: false, // default: false; true keeps only HEARTBEAT.md from workspace bootstrap files
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (default) | block
        target: "none", // default: none | options: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
      },
    },
  },
}
```

* `every`: duration string(ms/s/m/h). 기본값: `30m`
* `suppressToolErrorWarnings`: true이면 heartbeat 실행 중 tool error warning payload를 억제합니다.
* `directPolicy`: direct/DM 전달 정책. `allow`(기본값)은 direct-target 전달을 허용합니다. `block`은 direct-target 전달을 억제하고 `reason=dm-blocked`를 내보냅니다.
* `lightContext`: true이면 heartbeat 실행이 경량 bootstrap context를 사용하며 workspace bootstrap 파일 중 `HEARTBEAT.md`만 유지합니다.
* agent별: `agents.list[].heartbeat`를 설정하세요. 어떤 agent든 `heartbeat`를 정의하면 **그 agent들만** heartbeat를 실행합니다.
* Heartbeat는 전체 agent turn을 실행하므로 간격이 짧을수록 토큰을 더 많이 소모합니다.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        reserveTokensFloor: 24000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // used when identifierPolicy=custom
        postCompactionSections: ["Session Startup", "Red Lines"], // [] disables reinjection
        model: "openrouter/anthropic/claude-sonnet-4-5", // optional compaction-only model override
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

* `mode`: `default` 또는 `safeguard`(긴 history를 위한 chunked summarization). [Compaction](/concepts/compaction) 참고
* `identifierPolicy`: `strict`(기본값), `off`, `custom`. `strict`는 compaction summarization 시 내장된 opaque identifier 보존 가이드를 앞에 붙입니다.
* `identifierInstructions`: `identifierPolicy=custom`일 때 사용할 선택적 사용자 정의 identifier 보존 텍스트
* `postCompactionSections`: compaction 후 다시 주입할 AGENTS.md의 선택적 H2/H3 section 이름. 기본값은 `["Session Startup", "Red Lines"]`이며, 비활성화하려면 `[]`로 설정하세요. 설정하지 않았거나 이 기본 쌍으로 명시적으로 설정한 경우, 레거시 fallback으로 오래된 `Every Session`/`Safety` heading도 허용됩니다.
* `model`: compaction summarization 전용 선택적 `provider/model-id` override입니다. 메인 세션은 한 모델을 유지하면서 compaction summary는 다른 모델에서 실행하고 싶을 때 사용하세요. 설정하지 않으면 compaction은 세션의 primary model을 사용합니다.
* `memoryFlush`: auto-compaction 전에 durable memory를 저장하는 무음 agentic turn입니다. workspace가 read-only면 건너뜁니다.

### `agents.defaults.contextPruning`

LLM에 보내기 전에 메모리 내 context에서 **오래된 tool result**를 제거합니다. 디스크에 저장된 session history는 **수정하지 않습니다**.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // duration (ms/s/m/h), default unit: minutes
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Old tool result content cleared]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="cache-ttl mode 동작">
  * `mode: "cache-ttl"`은 pruning pass를 활성화합니다.
  * `ttl`은 pruning이 다시 실행될 수 있는 빈도를 제어합니다(마지막 cache touch 이후).
  * Pruning은 먼저 큰 tool result를 soft-trim하고, 필요하면 더 오래된 tool result를 hard-clear합니다.

  **Soft-trim**은 앞부분 + 뒷부분을 유지하고 가운데에 `...`를 넣습니다.

  **Hard-clear**는 전체 tool result를 placeholder로 바꿉니다.

  참고:

  * Image block은 절대 trim/clear되지 않습니다.
  * Ratio는 문자 수 기반(대략적)이지 정확한 token 수가 아닙니다.
  * `keepLastAssistants`보다 assistant 메시지가 적으면 pruning을 건너뜁니다.
</Accordion>

동작 세부사항은 [Session Pruning](/concepts/session-pruning)을 참고하세요.

### Block streaming

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (use minMs/maxMs)
    },
  },
}
```

* Telegram이 아닌 채널에서는 block reply를 활성화하려면 명시적으로 `*.blockStreaming: true`를 설정해야 합니다.
* 채널 override: `channels.<channel>.blockStreamingCoalesce`(및 계정별 변형). Signal/Slack/Discord/Google Chat의 기본 `minChars`는 `1500`입니다.
* `humanDelay`: block reply 사이의 무작위 대기. `natural` = 800–2500ms. agent별 override: `agents.list[].humanDelay`

동작과 chunking 세부사항은 [Streaming](/concepts/streaming)을 참고하세요.

### Typing indicator

```json5
{
  agents: {
    defaults: {
      typingMode: "instant", // never | instant | thinking | message
      typingIntervalSeconds: 6,
    },
  },
}
```

* 기본값: direct chat/mention은 `instant`, mention되지 않은 그룹 채팅은 `message`
* session별 override: `session.typingMode`, `session.typingIntervalSeconds`

[Typing Indicators](/concepts/typing-indicators)를 참고하세요.

### `agents.defaults.sandbox`

내장 agent를 위한 선택적 **Docker sandboxing**입니다. 전체 가이드는 [Sandboxing](/gateway/sandboxing)을 참고하세요.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        scope: "agent", // session | agent | shared
        workspaceAccess: "none", // none | ro | rw
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          containerPrefix: "openclaw-sbx-",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
          capDrop: ["ALL"],
          env: { LANG: "C.UTF-8" },
          setupCommand: "apt-get update && apt-get install -y git curl jq",
          pidsLimit: 256,
          memory: "1g",
          memorySwap: "2g",
          cpus: 1,
          ulimits: {
            nofile: { soft: 1024, hard: 2048 },
            nproc: 256,
          },
          seccompProfile: "/path/to/seccomp.json",
          apparmorProfile: "openclaw-sandbox",
          dns: ["1.1.1.1", "8.8.8.8"],
          extraHosts: ["internal.service:10.0.0.5"],
          binds: ["/home/user/source:/source:rw"],
        },
        browser: {
          enabled: false,
          image: "openclaw-sandbox-browser:bookworm-slim",
          network: "openclaw-sandbox-browser",
          cdpPort: 9222,
          cdpSourceRange: "172.21.0.1/32",
          vncPort: 5900,
          noVncPort: 6080,
          headless: false,
          enableNoVnc: true,
          allowHostControl: false,
          autoStart: true,
          autoStartTimeoutMs: 12000,
        },
        prune: {
          idleHours: 24,
          maxAgeDays: 7,
        },
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        allow: [
          "exec",
          "process",
          "read",
          "write",
          "edit",
          "apply_patch",
          "sessions_list",
          "sessions_history",
          "sessions_send",
          "sessions_spawn",
          "session_status",
        ],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"],
      },
    },
  },
}
```

<Accordion title="Sandbox 세부사항">
  **Workspace access:**

  * `none`: `~/.openclaw/sandboxes` 아래의 scope별 sandbox workspace
  * `ro`: sandbox workspace는 `/workspace`, agent workspace는 `/agent`에 read-only mount
  * `rw`: agent workspace를 `/workspace`에 read/write mount

  **Scope:**

  * `session`: 세션별 container + workspace
  * `agent`: agent별 container + workspace(기본값)
  * `shared`: container와 workspace를 공유함(세션 간 격리 없음)

  \*\*`setupCommand`\*\*는 container 생성 후 한 번 실행됩니다(`sh -lc` 사용). network egress, writable root, root user가 필요합니다.

  **Container는 기본적으로 `network: "none"`입니다**. agent가 외부 접근이 필요하면 `"bridge"`(또는 custom bridge network)로 설정하세요.
  `"host"`는 차단됩니다. `"container:<id>"`는 기본적으로 차단되며,
  명시적으로 `sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`를 설정한 경우에만 허용됩니다(break-glass).

  **수신 attachment**는 활성 workspace의 `media/inbound/*`에 staging됩니다.

  \*\*`docker.binds`\*\*는 추가 host 디렉터리를 mount합니다. 전역 및 agent별 bind는 병합됩니다.

  **Sandboxed browser**(`sandbox.browser.enabled`): container 안의 Chromium + CDP입니다. noVNC URL이 system prompt에 주입됩니다. `openclaw.json`에서 `browser.enabled`가 없어도 됩니다.
  noVNC observer access는 기본적으로 VNC auth를 사용하며, OpenClaw는 공유 URL에 비밀번호를 노출하는 대신 짧은 수명의 token URL을 발급합니다.

  * `allowHostControl: false`(기본값)는 sandboxed session이 host browser를 대상으로 삼는 것을 차단합니다.
  * `network` 기본값은 `openclaw-sandbox-browser`(전용 bridge network)입니다. 전역 bridge 연결이 명시적으로 필요한 경우에만 `bridge`로 설정하세요.
  * `cdpSourceRange`는 선택적으로 CIDR 범위(예: `172.21.0.1/32`)로 container 경계에서 CDP ingress를 제한합니다.
  * `sandbox.browser.binds`는 추가 host 디렉터리를 sandbox browser container에만 mount합니다. 설정되면(`[]` 포함) browser container에 대해 `docker.binds`를 대체합니다.
  * 실행 기본값은 `scripts/sandbox-browser-entrypoint.sh`에 정의되어 있으며 container host에 맞게 조정되어 있습니다.
    * `--remote-debugging-address=127.0.0.1`
    * `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
    * `--user-data-dir=${HOME}/.chrome`
    * `--no-first-run`
    * `--no-default-browser-check`
    * `--disable-3d-apis`
    * `--disable-gpu`
    * `--disable-software-rasterizer`
    * `--disable-dev-shm-usage`
    * `--disable-background-networking`
    * `--disable-features=TranslateUI`
    * `--disable-breakpad`
    * `--disable-crash-reporter`
    * `--renderer-process-limit=2`
    * `--no-zygote`
    * `--metrics-recording-only`
    * `--disable-extensions` (기본 활성화)
    * `--disable-3d-apis`, `--disable-software-rasterizer`, `--disable-gpu`는
      기본적으로 활성화되며, WebGL/3D 사용에 필요하면
      `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`으로 비활성화할 수 있습니다.
    * `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0`은 workflow가 extension에 의존할 때 extension을 다시 활성화합니다.
    * `--renderer-process-limit=2`는
      `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`으로 변경할 수 있습니다. `0`이면 Chromium의
      기본 process limit을 사용합니다.
    * `noSandbox`가 활성화되면 `--no-sandbox`와 `--disable-setuid-sandbox`가 추가됩니다.
    * 기본값은 container image의 baseline이며, container 기본값을 바꾸려면 사용자 정의 browser image와 custom entrypoint를 사용하세요.
</Accordion>

이미지 빌드:

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

### `agents.list` (agent별 override)

```json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "Main Agent",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // or { primary, fallbacks }
        params: { cacheRetention: "none" }, // overrides matching defaults.models params by key
        identity: {
          name: "Samantha",
          theme: "helpful sloth",
          emoji: "🦥",
          avatar: "avatars/samantha.png",
        },
        groupChat: { mentionPatterns: ["@openclaw"] },
        sandbox: { mode: "off" },
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
        subagents: { allowAgents: ["*"] },
        tools: {
          profile: "coding",
          allow: ["browser"],
          deny: ["canvas"],
          elevated: { enabled: true },
        },
      },
    ],
  },
}
```

* `id`: 안정적인 agent id(필수)
* `default`: 여러 개가 설정되면 첫 번째가 우선합니다(경고 기록). 하나도 설정되지 않으면 목록의 첫 항목이 기본값입니다.
* `model`: 문자열 형식은 `primary`만 override하고, 객체 형식 `{ primary, fallbacks }`는 둘 다 override합니다(`[]`는 전역 fallback 비활성화). `primary`만 override하는 cron job은 `fallbacks: []`를 설정하지 않는 한 여전히 기본 fallback을 상속합니다.
* `params`: `agents.defaults.models`에서 선택된 모델 항목 위에 병합되는 agent별 stream params입니다. 전체 모델 catalog를 복제하지 않고 `cacheRetention`, `temperature`, `maxTokens` 같은 agent별 override에 사용하세요.
* `runtime`: 선택적 agent별 runtime descriptor입니다. agent가 기본적으로 ACP harness session을 사용해야 할 때 `type: "acp"`와 `runtime.acp` 기본값(`agent`, `backend`, `mode`, `cwd`)을 사용하세요.
* `identity.avatar`: workspace-relative path, `http(s)` URL, 또는 `data:` URI
* `identity`는 기본값을 파생합니다. `ackReaction`은 `emoji`에서, `mentionPatterns`는 `name`/`emoji`에서 파생됩니다.
* `subagents.allowAgents`: `sessions_spawn`용 agent id allowlist(`["*"]` = 아무 agent나, 기본값: 같은 agent만)
* Sandbox inheritance guard: 요청한 session이 sandboxed 상태면 `sessions_spawn`는 unsandboxed로 실행될 target을 거부합니다.

***

## 다중 agent 라우팅

하나의 Gateway 안에서 여러 개의 격리된 agent를 실행합니다. [Multi-Agent](/concepts/multi-agent)를 참고하세요.

```json5
{
  agents: {
    list: [
      { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
      { id: "work", workspace: "~/.openclaw/workspace-work" },
    ],
  },
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
  ],
}
```

### Binding match 필드

* `type`(선택 사항): 일반 라우팅용 `route`(type이 없으면 route로 간주), 지속적 ACP 대화 binding용 `acp`
* `match.channel`(필수)
* `match.accountId`(선택 사항, `*` = 모든 계정, 생략 = 기본 계정)
* `match.peer`(선택 사항, `{ kind: direct|group|channel, id }`)
* `match.guildId` / `match.teamId`(선택 사항, 채널별)
* `acp`(선택 사항, `type: "acp"`에만 사용): `{ mode, label, cwd, backend }`

**결정적 매칭 순서:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId`(정확히 일치, peer/guild/team 없음)
5. `match.accountId: "*"`(채널 전역)
6. 기본 agent

각 단계 안에서는 먼저 일치한 `bindings` 항목이 우선합니다.

`type: "acp"` 항목의 경우 OpenClaw는 정확한 대화 identity(`match.channel` + account + `match.peer.id`)로 해석하며, 위의 route binding 단계 순서는 사용하지 않습니다.

### Agent별 access profile

<Accordion title="전체 접근(샌드박스 없음)">
  ```json5
  {
    agents: {
      list: [
        {
          id: "personal",
          workspace: "~/.openclaw/workspace-personal",
          sandbox: { mode: "off" },
        },
      ],
    },
  }
  ```
</Accordion>

<Accordion title="읽기 전용 도구 + workspace">
  ```json5
  {
    agents: {
      list: [
        {
          id: "family",
          workspace: "~/.openclaw/workspace-family",
          sandbox: { mode: "all", scope: "agent", workspaceAccess: "ro" },
          tools: {
            allow: [
              "read",
              "sessions_list",
              "sessions_history",
              "sessions_send",
              "sessions_spawn",
              "session_status",
            ],
            deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
          },
        },
      ],
    },
  }
  ```
</Accordion>

<Accordion title="파일시스템 접근 없음(메시징 전용)">
  ```json5
  {
    agents: {
      list: [
        {
          id: "public",
          workspace: "~/.openclaw/workspace-public",
          sandbox: { mode: "all", scope: "agent", workspaceAccess: "none" },
          tools: {
            allow: [
              "sessions_list",
              "sessions_history",
              "sessions_send",
              "sessions_spawn",
              "session_status",
              "whatsapp",
              "telegram",
              "slack",
              "discord",
              "gateway",
            ],
            deny: [
              "read",
              "write",
              "edit",
              "apply_patch",
              "exec",
              "process",
              "browser",
              "canvas",
              "nodes",
              "cron",
              "gateway",
              "image",
            ],
          },
        },
      ],
    },
  }
  ```
</Accordion>

우선순위 세부사항은 [Multi-Agent Sandbox & Tools](/tools/multi-agent-sandbox-tools)를 참고하세요.

***

## Session

```json5
{
  session: {
    scope: "per-sender",
    dmScope: "main", // main | per-peer | per-channel-peer | per-account-channel-peer
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      mode: "daily", // daily | idle
      atHour: 4,
      idleMinutes: 60,
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      direct: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    parentForkMaxTokens: 100000, // skip parent-thread fork above this token count (0 disables)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // duration or false
      maxDiskBytes: "500mb", // optional hard budget
      highWaterBytes: "400mb", // optional cleanup target
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // default inactivity auto-unfocus in hours (`0` disables)
      maxAgeHours: 0, // default hard max age in hours (`0` disables)
    },
    mainKey: "main", // legacy (runtime always uses "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="Session 필드 세부사항">
  * **`dmScope`**: DM을 어떻게 그룹화할지
    * `main`: 모든 DM이 main session을 공유
    * `per-peer`: 채널 전체에서 발신자 id 기준으로 격리
    * `per-channel-peer`: 채널 + 발신자별로 격리(다중 사용자 inbox에 권장)
    * `per-account-channel-peer`: 계정 + 채널 + 발신자별로 격리(다중 계정에 권장)
  * **`identityLinks`**: 채널 간 session 공유를 위해 정규 id를 provider-prefix가 붙은 peer에 매핑
  * **`reset`**: 기본 reset 정책. `daily`는 로컬 시간 기준 `atHour`에 reset하고, `idle`은 `idleMinutes` 후 reset합니다. 둘 다 설정되면 먼저 만료되는 쪽이 우선합니다.
  * **`resetByType`**: 유형별 override(`direct`, `group`, `thread`). 레거시 `dm`은 `direct`의 alias로 허용됩니다.
  * **`parentForkMaxTokens`**: forked thread session 생성 시 허용되는 부모 session `totalTokens` 최대값(기본값 `100000`)
    * 부모의 `totalTokens`가 이 값을 초과하면 OpenClaw는 부모 transcript history를 상속하는 대신 새 thread session을 시작합니다.
    * 이 guard를 비활성화하고 항상 부모 fork를 허용하려면 `0`으로 설정하세요.
  * **`mainKey`**: 레거시 필드. 런타임은 이제 main direct-chat bucket에 항상 `"main"`을 사용합니다.
  * **`sendPolicy`**: `channel`, `chatType`(`direct|group|channel`, 레거시 `dm` alias 포함), `keyPrefix`, `rawKeyPrefix`로 매칭합니다. 첫 번째 deny가 우선합니다.
  * **`maintenance`**: session store 정리 + retention 제어
    * `mode`: `warn`은 경고만 출력하고, `enforce`는 실제 정리를 적용합니다.
    * `pruneAfter`: 오래된 항목의 age cutoff(기본값 `30d`)
    * `maxEntries`: `sessions.json`의 최대 항목 수(기본값 `500`)
    * `rotateBytes`: `sessions.json`이 이 크기를 넘으면 rotate(기본값 `10mb`)
    * `resetArchiveRetention`: `*.reset.<timestamp>` transcript archive의 보관 기간. 기본값은 `pruneAfter`이며, 비활성화하려면 `false`로 설정하세요.
    * `maxDiskBytes`: session 디렉터리의 선택적 디스크 예산. `warn` 모드에서는 경고를 기록하고, `enforce` 모드에서는 가장 오래된 artifact/session부터 제거합니다.
    * `highWaterBytes`: 예산 정리 후 목표 크기(선택 사항). 기본값은 `maxDiskBytes`의 `80%`
  * **`threadBindings`**: thread-bound session 기능의 전역 기본값
    * `enabled`: master 기본 스위치(provider가 override 가능, Discord는 `channels.discord.threadBindings.enabled` 사용)
    * `idleHours`: 비활성 auto-unfocus 시간(시간 단위, `0`이면 비활성화, provider가 override 가능)
    * `maxAgeHours`: 하드 최대 수명 시간(시간 단위, `0`이면 비활성화, provider가 override 가능)
</Accordion>

***

## Messages

```json5
{
  messages: {
    responsePrefix: "🦞", // or "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "collect", // steer | followup | collect | steer-backlog | steer+backlog | queue | interrupt
      debounceMs: 1000,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "collect",
        telegram: "collect",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 disables
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### Response prefix

채널/계정별 override: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`

해결 순서(가장 구체적인 것이 우선): 계정 → 채널 → 전역. `""`는 비활성화하고 cascade를 중단합니다. `"auto"`는 `[{identity.name}]`에서 파생됩니다.

**Template 변수:**

| Variable          | 설명                | Example                     |
| ----------------- | ----------------- | --------------------------- |
| `{model}`         | 짧은 모델 이름          | `claude-opus-4-6`           |
| `{modelFull}`     | 전체 모델 식별자         | `anthropic/claude-opus-4-6` |
| `{provider}`      | Provider 이름       | `anthropic`                 |
| `{thinkingLevel}` | 현재 thinking level | `high`, `low`, `off`        |
| `{identity.name}` | Agent identity 이름 | (`"auto"`와 동일)              |

변수는 대소문자를 구분하지 않습니다. `{think}`는 `{thinkingLevel}`의 alias입니다.

### Ack reaction

* 기본값은 활성 agent의 `identity.emoji`, 없으면 `"👀"`입니다. 비활성화하려면 `""`로 설정하세요.
* 채널별 override: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`
* 해결 순서: 계정 → 채널 → `messages.ackReaction` → identity fallback
* Scope: `group-mentions`(기본값), `group-all`, `direct`, `all`
* `removeAckAfterReply`: 응답 후 ack 제거(Slack/Discord/Telegram/Google Chat만)

### Inbound debounce

같은 발신자의 빠른 text-only 메시지를 하나의 agent turn으로 묶습니다. Media/attachment는 즉시 flush됩니다. 제어 명령은 debouncing을 우회합니다.

### TTS (text-to-speech)

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      elevenlabs: {
        apiKey: "elevenlabs_api_key",
        baseUrl: "https://api.elevenlabs.io",
        voiceId: "voice_id",
        modelId: "eleven_multilingual_v2",
        seed: 42,
        applyTextNormalization: "auto",
        languageCode: "en",
        voiceSettings: {
          stability: 0.5,
          similarityBoost: 0.75,
          style: 0.0,
          useSpeakerBoost: true,
          speed: 1.0,
        },
      },
      openai: {
        apiKey: "openai_api_key",
        baseUrl: "https://api.openai.com/v1",
        model: "gpt-4o-mini-tts",
        voice: "alloy",
      },
    },
  },
}
```

* `auto`는 auto-TTS를 제어합니다. `/tts off|always|inbound|tagged`는 세션별 override입니다.
* `summaryModel`은 auto-summary에 대해 `agents.defaults.model.primary`를 override합니다.
* `modelOverrides`는 기본적으로 활성화되어 있으며, `modelOverrides.allowProvider`의 기본값은 `false`(opt-in)입니다.
* API key fallback: `ELEVENLABS_API_KEY`/`XI_API_KEY`, `OPENAI_API_KEY`
* `openai.baseUrl`은 OpenAI TTS endpoint를 override합니다. 해결 순서는 config, 그다음 `OPENAI_TTS_BASE_URL`, 그다음 `https://api.openai.com/v1`입니다.
* `openai.baseUrl`이 OpenAI가 아닌 endpoint를 가리키면 OpenClaw는 이를 OpenAI-compatible TTS server로 간주하고 model/voice validation을 완화합니다.

***

## Talk

Talk mode(macOS/iOS/Android)의 기본값입니다.

```json5
{
  talk: {
    voiceId: "elevenlabs_voice_id",
    voiceAliases: {
      Clawd: "EXAVITQu4vr4xnSDxMaL",
      Roger: "CwhRBWXzGAHq8TQ4Fs17",
    },
    modelId: "eleven_v3",
    outputFormat: "mp3_44100_128",
    apiKey: "elevenlabs_api_key",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

* Voice ID fallback: `ELEVENLABS_VOICE_ID` 또는 `SAG_VOICE_ID`
* `apiKey`와 `providers.*.apiKey`는 평문 문자열 또는 SecretRef 객체를 받을 수 있습니다.
* Talk API key가 구성되지 않았을 때만 `ELEVENLABS_API_KEY` fallback이 적용됩니다.
* `voiceAliases`를 사용하면 Talk directive에서 친숙한 이름을 사용할 수 있습니다.
* `silenceTimeoutMs`는 사용자가 조용해진 뒤 transcript를 보내기까지 Talk mode가 기다리는 시간을 제어합니다. 설정하지 않으면 플랫폼 기본 pause window를 유지합니다(`macOS와 Android는 700 ms, iOS는 900 ms`).

***

## 도구

### Tool profile

`tools.profile`은 `tools.allow`/`tools.deny` 이전에 기본 allowlist를 설정합니다.

Local onboarding은 설정되지 않은 새 local config에 기본적으로 `tools.profile: "coding"`을 넣습니다(기존의 명시적 profile은 유지).

| Profile     | 포함 내용                                                                                     |
| ----------- | ----------------------------------------------------------------------------------------- |
| `minimal`   | `session_status`만                                                                         |
| `coding`    | `group:fs`, `group:runtime`, `group:sessions`, `group:memory`, `image`                    |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status` |
| `full`      | 제한 없음(설정하지 않은 경우와 동일)                                                                     |

### Tool group

| Group              | 도구                                                                                       |
| ------------------ | ---------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process` (`bash`는 `exec`의 alias로 허용됨)                                           |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                   |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                            |
| `group:web`        | `web_search`, `web_fetch`                                                                |
| `group:ui`         | `browser`, `canvas`                                                                      |
| `group:automation` | `cron`, `gateway`                                                                        |
| `group:messaging`  | `message`                                                                                |
| `group:nodes`      | `nodes`                                                                                  |
| `group:openclaw`   | 모든 내장 도구(provider plugin 제외)                                                             |

### `tools.allow` / `tools.deny`

전역 tool allow/deny 정책입니다(deny가 우선). 대소문자를 구분하지 않으며 `*` wildcard를 지원합니다. Docker sandbox가 꺼져 있어도 적용됩니다.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

특정 provider나 model에 대해 도구를 추가로 제한합니다. 순서: base profile → provider profile → allow/deny

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
      "openai/gpt-5.2": { allow: ["group:fs", "sessions_list"] },
    },
  },
}
```

### `tools.elevated`

elevated(host) exec 접근을 제어합니다.

```json5
{
  tools: {
    elevated: {
      enabled: true,
      allowFrom: {
        whatsapp: ["+15555550123"],
        discord: ["1234567890123", "987654321098765432"],
      },
    },
  },
}
```

* Agent별 override(`agents.list[].tools.elevated`)는 추가로 제한만 할 수 있습니다.
* `/elevated on|off|ask|full`은 상태를 세션별로 저장하고, inline directive는 단일 메시지에만 적용됩니다.
* Elevated `exec`는 host에서 실행되며 sandboxing을 우회합니다.

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.2"],
      },
    },
  },
}
```

### `tools.loopDetection`

Tool-loop 안전 검사는 기본적으로 **비활성화**되어 있습니다. 감지를 활성화하려면 `enabled: true`를 설정하세요.
설정은 전역 `tools.loopDetection`에 정의하고, agent별 `agents.list[].tools.loopDetection`에서 override할 수 있습니다.

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

* `historySize`: loop 분석용으로 유지할 최대 tool-call history
* `warningThreshold`: 경고를 띄우는 반복 no-progress pattern 임계값
* `criticalThreshold`: 치명적 loop를 차단하는 더 높은 반복 임계값
* `globalCircuitBreakerThreshold`: 모든 no-progress 실행에 대한 하드 중단 임계값
* `detectors.genericRepeat`: 같은 도구/같은 인수 호출 반복 시 경고
* `detectors.knownPollNoProgress`: 알려진 poll 도구(`process.poll`, `command_status` 등)의 no-progress를 경고/차단
* `detectors.pingPong`: 번갈아 나타나는 no-progress pair pattern을 경고/차단
* `warningThreshold >= criticalThreshold` 또는 `criticalThreshold >= globalCircuitBreakerThreshold`이면 validation이 실패합니다.

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // or BRAVE_API_KEY env
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        maxChars: 50000,
        maxCharsCap: 50000,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        userAgent: "custom-ua",
      },
    },
  },
}
```

### `tools.media`

수신 media 이해(image/audio/video)를 구성합니다.

```json5
{
  tools: {
    media: {
      concurrency: 2,
      audio: {
        enabled: true,
        maxBytes: 20971520,
        scope: {
          default: "deny",
          rules: [{ action: "allow", match: { chatType: "direct" } }],
        },
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          { type: "cli", command: "whisper", args: ["--model", "base", "{{MediaPath}}"] },
        ],
      },
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },
}
```

<Accordion title="Media model entry 필드">
  **Provider entry** (`type: "provider"` 또는 생략):

  * `provider`: API provider id(`openai`, `anthropic`, `google`/`gemini`, `groq` 등)
  * `model`: model id override
  * `profile` / `preferredProfile`: `auth-profiles.json` profile 선택

  **CLI entry** (`type: "cli"`):

  * `command`: 실행할 executable
  * `args`: 템플릿화된 인수(`{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}` 등 지원)

  **공통 필드:**

  * `capabilities`: 선택적 목록(`image`, `audio`, `video`). 기본값: `openai`/`anthropic`/`minimax` → image, `google` → image+audio+video, `groq` → audio
  * `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: entry별 override
  * 실패하면 다음 entry로 fallback

  Provider auth는 표준 순서를 따릅니다: `auth-profiles.json` → env vars → `models.providers.*.apiKey`
</Accordion>

### `tools.agentToAgent`

```json5
{
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },
}
```

### `tools.sessions`

세션 도구(`sessions_list`, `sessions_history`, `sessions_send`)가 어떤 세션을 대상으로 할 수 있는지 제어합니다.

기본값: `tree`(현재 session + 그 세션이 spawn한 session, 예: subagent)

```json5
{
  tools: {
    sessions: {
      // "self" | "tree" | "agent" | "all"
      visibility: "tree",
    },
  },
}
```

참고:

* `self`: 현재 session key만
* `tree`: 현재 session + 현재 session이 spawn한 session(subagent)
* `agent`: 현재 agent id에 속한 모든 session(같은 agent id 아래에서 per-sender session을 돌리면 다른 사용자도 포함될 수 있음)
* `all`: 모든 session. 단, agent 간 대상 지정에는 여전히 `tools.agentToAgent`가 필요합니다.
* Sandbox clamp: 현재 session이 sandboxed 상태이고 `agents.defaults.sandbox.sessionToolsVisibility="spawned"`이면, `tools.sessions.visibility="all"`이어도 visibility는 강제로 `tree`가 됩니다.

### `tools.sessions_spawn`

`sessions_spawn`의 inline attachment 지원을 제어합니다.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // opt-in: set true to allow inline file attachments
        maxTotalBytes: 5242880, // 5 MB total across all files
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB per file
        retainOnSessionKeep: false, // keep attachments when cleanup="keep"
      },
    },
  },
}
```

참고:

* Attachment는 `runtime: "subagent"`에서만 지원됩니다. ACP runtime은 이를 거부합니다.
* 파일은 `.manifest.json`과 함께 child workspace의 `.openclaw/attachments/<uuid>/`에 materialize됩니다.
* Attachment 내용은 transcript persistence에서 자동으로 redaction됩니다.
* Base64 입력은 엄격한 alphabet/padding 검사와 decode 전 size guard로 검증됩니다.
* 파일 권한은 디렉터리 `0700`, 파일 `0600`입니다.
* 정리는 `cleanup` 정책을 따릅니다. `delete`는 항상 attachment를 제거하고, `keep`은 `retainOnSessionKeep: true`일 때만 유지합니다.

### `tools.subagents`

```json5
{
  agents: {
    defaults: {
      subagents: {
        model: "minimax/MiniMax-M2.5",
        maxConcurrent: 1,
        runTimeoutSeconds: 900,
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

* `model`: spawn된 sub-agent의 기본 모델. 생략하면 sub-agent는 호출자의 모델을 상속합니다.
* `runTimeoutSeconds`: tool call에서 `runTimeoutSeconds`를 생략했을 때 `sessions_spawn`의 기본 timeout(초). `0`은 timeout 없음.
* Subagent별 도구 정책: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`

***

## Custom provider와 base URL

OpenClaw는 pi-coding-agent model catalog를 사용합니다. config의 `models.providers` 또는 `~/.openclaw/agents/<agentId>/agent/models.json`을 통해 custom provider를 추가하세요.

```json5
{
  models: {
    mode: "merge", // merge (default) | replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai
        models: [
          {
            id: "llama-3.1-8b",
            name: "Llama 3.1 8B",
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
}
```

* Custom auth가 필요하면 `authHeader: true` + `headers`를 사용하세요.
* Agent config root는 `OPENCLAW_AGENT_DIR`(또는 `PI_CODING_AGENT_DIR`)로 override할 수 있습니다.
* 일치하는 provider ID에 대한 병합 우선순위:
  * agent `models.json`의 비어 있지 않은 `baseUrl` 값이 우선
  * agent의 비어 있지 않은 `apiKey` 값은 현재 config/auth-profile context에서 해당 provider가 SecretRef로 관리되지 않을 때만 우선
  * SecretRef로 관리되는 provider `apiKey` 값은 해석된 secret을 저장하는 대신 source marker(`env` ref는 `ENV_VAR_NAME`, `file`/`exec` ref는 `secretref-managed`)에서 새로 고칩니다.
  * agent의 `apiKey`/`baseUrl`이 비어 있거나 없으면 config의 `models.providers`로 fallback
  * 일치하는 모델의 `contextWindow`/`maxTokens`는 명시적 config와 암묵적 catalog 값 중 더 높은 값을 사용
  * config가 `models.json`을 완전히 다시 쓰게 하려면 `models.mode: "replace"`를 사용하세요.

### Provider 필드 세부사항

* `models.mode`: provider catalog 동작(`merge` 또는 `replace`)
* `models.providers`: provider id를 키로 하는 custom provider map
* `models.providers.*.api`: request adapter(`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai` 등)
* `models.providers.*.apiKey`: provider credential(SecretRef/env 치환 권장)
* `models.providers.*.auth`: auth 전략(`api-key`, `token`, `oauth`, `aws-sdk`)
* `models.providers.*.injectNumCtxForOpenAICompat`: Ollama + `openai-completions`에 대해 request에 `options.num_ctx`를 주입(기본값: `true`)
* `models.providers.*.authHeader`: 필요할 때 credential을 `Authorization` header로 강제 전달
* `models.providers.*.baseUrl`: 상위 API base URL
* `models.providers.*.headers`: proxy/tenant 라우팅용 추가 정적 header
* `models.providers.*.models`: 명시적 provider model catalog 항목
* `models.providers.*.models.*.compat.supportsDeveloperRole`: 선택적 호환성 힌트. `api: "openai-completions"`에서 비어 있지 않은 non-native `baseUrl`(`api.openai.com`이 아닌 host)을 쓰면, OpenClaw는 런타임에 이를 강제로 `false`로 설정합니다. `baseUrl`이 비어 있거나 생략되면 기본 OpenAI 동작을 유지합니다.
* `models.bedrockDiscovery`: Bedrock auto-discovery 설정의 루트
* `models.bedrockDiscovery.enabled`: discovery polling on/off
* `models.bedrockDiscovery.region`: discovery용 AWS region
* `models.bedrockDiscovery.providerFilter`: 대상 discovery용 선택적 provider-id filter
* `models.bedrockDiscovery.refreshInterval`: discovery refresh polling 간격
* `models.bedrockDiscovery.defaultContextWindow`: 발견된 model의 fallback context window
* `models.bedrockDiscovery.defaultMaxTokens`: 발견된 model의 fallback max output token

### Provider 예시

<Accordion title="Cerebras (GLM 4.6 / 4.7)">
  ```json5
  {
    env: { CEREBRAS_API_KEY: "sk-..." },
    agents: {
      defaults: {
        model: {
          primary: "cerebras/zai-glm-4.7",
          fallbacks: ["cerebras/zai-glm-4.6"],
        },
        models: {
          "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
          "cerebras/zai-glm-4.6": { alias: "GLM 4.6 (Cerebras)" },
        },
      },
    },
    models: {
      mode: "merge",
      providers: {
        cerebras: {
          baseUrl: "https://api.cerebras.ai/v1",
          apiKey: "${CEREBRAS_API_KEY}",
          api: "openai-completions",
          models: [
            { id: "zai-glm-4.7", name: "GLM 4.7 (Cerebras)" },
            { id: "zai-glm-4.6", name: "GLM 4.6 (Cerebras)" },
          ],
        },
      },
    },
  }
  ```

  Cerebras에는 `cerebras/zai-glm-4.7`을, Z.AI direct에는 `zai/glm-4.7`을 사용하세요.
</Accordion>

<Accordion title="OpenCode Zen">
  ```json5
  {
    agents: {
      defaults: {
        model: { primary: "opencode/claude-opus-4-6" },
        models: { "opencode/claude-opus-4-6": { alias: "Opus" } },
      },
    },
  }
  ```

  `OPENCODE_API_KEY`(또는 `OPENCODE_ZEN_API_KEY`)를 설정하세요. shortcut: `openclaw onboard --auth-choice opencode-zen`
</Accordion>

<Accordion title="Z.AI (GLM-4.7)">
  ```json5
  {
    agents: {
      defaults: {
        model: { primary: "zai/glm-4.7" },
        models: { "zai/glm-4.7": {} },
      },
    },
  }
  ```

  `ZAI_API_KEY`를 설정하세요. `z.ai/*`와 `z-ai/*`는 허용되는 alias입니다. shortcut: `openclaw onboard --auth-choice zai-api-key`

  * 일반 endpoint: `https://api.z.ai/api/paas/v4`
  * 코딩 endpoint(기본값): `https://api.z.ai/api/coding/paas/v4`
  * 일반 endpoint를 쓰려면 base URL override가 있는 custom provider를 정의하세요.
</Accordion>

<Accordion title="Moonshot AI (Kimi)">
  ```json5
  {
    env: { MOONSHOT_API_KEY: "sk-..." },
    agents: {
      defaults: {
        model: { primary: "moonshot/kimi-k2.5" },
        models: { "moonshot/kimi-k2.5": { alias: "Kimi K2.5" } },
      },
    },
    models: {
      mode: "merge",
      providers: {
        moonshot: {
          baseUrl: "https://api.moonshot.ai/v1",
          apiKey: "${MOONSHOT_API_KEY}",
          api: "openai-completions",
          models: [
            {
              id: "kimi-k2.5",
              name: "Kimi K2.5",
              reasoning: false,
              input: ["text"],
              cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
              contextWindow: 256000,
              maxTokens: 8192,
            },
          ],
        },
      },
    },
  }
  ```

  중국 endpoint의 경우: `baseUrl: "https://api.moonshot.cn/v1"` 또는 `openclaw onboard --auth-choice moonshot-api-key-cn`
</Accordion>

<Accordion title="Kimi Coding">
  ```json5
  {
    env: { KIMI_API_KEY: "sk-..." },
    agents: {
      defaults: {
        model: { primary: "kimi-coding/k2p5" },
        models: { "kimi-coding/k2p5": { alias: "Kimi K2.5" } },
      },
    },
  }
  ```

  Anthropic-compatible 내장 provider입니다. shortcut: `openclaw onboard --auth-choice kimi-code-api-key`
</Accordion>

<Accordion title="Synthetic (Anthropic-compatible)">
  ```json5
  {
    env: { SYNTHETIC_API_KEY: "sk-..." },
    agents: {
      defaults: {
        model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
        models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
      },
    },
    models: {
      mode: "merge",
      providers: {
        synthetic: {
          baseUrl: "https://api.synthetic.new/anthropic",
          apiKey: "${SYNTHETIC_API_KEY}",
          api: "anthropic-messages",
          models: [
            {
              id: "hf:MiniMaxAI/MiniMax-M2.5",
              name: "MiniMax M2.5",
              reasoning: false,
              input: ["text"],
              cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
              contextWindow: 192000,
              maxTokens: 65536,
            },
          ],
        },
      },
    },
  }
  ```

  Base URL에는 `/v1`를 포함하지 않아야 합니다(Anthropic client가 이를 추가함). shortcut: `openclaw onboard --auth-choice synthetic-api-key`
</Accordion>

<Accordion title="MiniMax M2.5 (direct)">
  ```json5
  {
    agents: {
      defaults: {
        model: { primary: "minimax/MiniMax-M2.5" },
        models: {
          "minimax/MiniMax-M2.5": { alias: "Minimax" },
        },
      },
    },
    models: {
      mode: "merge",
      providers: {
        minimax: {
          baseUrl: "https://api.minimax.io/anthropic",
          apiKey: "${MINIMAX_API_KEY}",
          api: "anthropic-messages",
          models: [
            {
              id: "MiniMax-M2.5",
              name: "MiniMax M2.5",
              reasoning: false,
              input: ["text"],
              cost: { input: 15, output: 60, cacheRead: 2, cacheWrite: 10 },
              contextWindow: 200000,
              maxTokens: 8192,
            },
          ],
        },
      },
    },
  }
  ```

  `MINIMAX_API_KEY`를 설정하세요. shortcut: `openclaw onboard --auth-choice minimax-api`
</Accordion>

<Accordion title="로컬 모델 (LM Studio)">
  [Local Models](/gateway/local-models)를 참고하세요. 요약하면, 제대로 된 하드웨어에서는 LM Studio Responses API를 통해 MiniMax M2.5를 실행하고, fallback을 위해 hosted model은 merge 상태로 유지하세요.
</Accordion>

***

## 스킬

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn
    },
    entries: {
      "nano-banana-pro": {
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

* `allowBundled`: 번들된 스킬만 대상으로 하는 선택적 allowlist입니다(managed/workspace skill은 영향 없음).
* `entries.<skillKey>.enabled: false`는 번들되었거나 설치된 스킬이라도 비활성화합니다.
* `entries.<skillKey>.apiKey`: primary env var를 선언하는 스킬을 위한 편의 필드입니다(평문 문자열 또는 SecretRef 객체).

***

## Plugin

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: [],
    load: {
      paths: ["~/Projects/oss/voice-call-extension"],
    },
    entries: {
      "voice-call": {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
        config: { provider: "twilio" },
      },
    },
  },
}
```

* `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions`, `plugins.load.paths`에서 로드됩니다.
* **Config 변경에는 gateway 재시작이 필요합니다.**
* `allow`: 선택적 allowlist(목록에 있는 plugin만 로드). `deny`가 우선합니다.
* `plugins.entries.<id>.apiKey`: plugin 수준 API key 편의 필드(plugin이 지원하는 경우)
* `plugins.entries.<id>.env`: plugin 범위 env var map
* `plugins.entries.<id>.hooks.allowPromptInjection`: `false`이면 core가 `before_prompt_build`를 차단하고, legacy `before_agent_start`의 prompt 변경 필드를 무시합니다. 단, legacy `modelOverride`와 `providerOverride`는 유지합니다.
* `plugins.entries.<id>.config`: plugin이 정의한 config 객체(plugin schema로 검증됨)
* `plugins.slots.memory`: 활성 memory plugin id를 선택하거나, memory plugin을 비활성화하려면 `"none"`
* `plugins.slots.contextEngine`: 활성 context engine plugin id를 선택합니다. 다른 engine을 설치하고 선택하지 않으면 기본값은 `"legacy"`입니다.
* `plugins.installs`: `openclaw plugins update`가 사용하는 CLI 관리 설치 메타데이터
  * `source`, `spec`, `sourcePath`, `installPath`, `version`, `resolvedName`, `resolvedVersion`, `resolvedSpec`, `integrity`, `shasum`, `resolvedAt`, `installedAt`를 포함합니다.
  * `plugins.installs.*`는 관리되는 상태로 취급하고, 수동 편집보다 CLI 명령을 선호하세요.

[Plugins](/tools/plugin)를 참고하세요.

***

## Browser

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "chrome",
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: true, // default trusted-network mode
      // allowPrivateNetwork: true, // legacy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
    color: "#FF4500",
    // headless: false,
    // noSandbox: false,
    // extraArgs: [],
    // relayBindHost: "0.0.0.0", // only when the extension relay must be reachable across namespaces (for example WSL2)
    // executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    // attachOnly: false,
  },
}
```

* `evaluateEnabled: false`는 `act:evaluate`와 `wait --fn`을 비활성화합니다.
* `ssrfPolicy.dangerouslyAllowPrivateNetwork`는 설정하지 않았을 때 기본적으로 `true`입니다(trusted-network model).
* 엄격한 public-only browser navigation이 필요하면 `ssrfPolicy.dangerouslyAllowPrivateNetwork: false`로 설정하세요.
* `ssrfPolicy.allowPrivateNetwork`도 레거시 alias로 계속 지원됩니다.
* strict mode에서는 명시적 예외를 위해 `ssrfPolicy.hostnameAllowlist`와 `ssrfPolicy.allowedHostnames`를 사용하세요.
* Remote profile은 attach-only입니다(start/stop/reset 비활성).
* Auto-detect 순서: 기본 browser가 Chromium 기반이면 그 browser → Chrome → Brave → Edge → Chromium → Chrome Canary
* Control service: loopback 전용(port는 `gateway.port`에서 파생, 기본값 `18791`)
* `extraArgs`는 local Chromium 시작 시 추가 launch flag를 붙입니다(예:
  `--disable-gpu`, window 크기 조정, debug flag 등).
* `relayBindHost`는 Chrome extension relay가 어디에서 listen할지 변경합니다. loopback 전용 접근이라면 설정하지 마세요. relay가 namespace 경계를 넘어야 하는 경우(예: WSL2)이고 host network가 이미 신뢰되는 경우에만 `0.0.0.0` 같은 명시적 non-loopback bind address를 설정하세요.

***

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, short text, image URL, or data URI
    },
  },
}
```

* `seamColor`: native app UI chrome(Talk Mode bubble tint 등)의 accent color
* `assistant`: Control UI identity override. 활성 agent identity로 fallback됩니다.

***

## Gateway

```json5
{
  gateway: {
    mode: "local", // local | remote
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token", // none | token | password | trusted-proxy
      token: "your-token",
      // password: "your-password", // or OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // for mode=trusted-proxy; see /gateway/trusted-proxy-auth
      allowTailscale: true,
      rateLimit: {
        maxAttempts: 10,
        windowMs: 60000,
        lockoutMs: 300000,
        exemptLoopback: true,
      },
    },
    tailscale: {
      mode: "off", // off | serve | funnel
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // allowedOrigins: ["https://control.example.com"], // required for non-loopback Control UI
      // dangerouslyAllowHostHeaderOriginFallback: false, // dangerous Host-header origin fallback mode
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    remote: {
      url: "ws://gateway.tailnet:18789",
      transport: "ssh", // ssh | direct
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // Optional. Default false.
    allowRealIpFallback: false,
    tools: {
      // Additional /tools/invoke HTTP denies
      deny: ["browser"],
      // Remove tools from the default HTTP deny list
      allow: ["gateway"],
    },
  },
}
```

<Accordion title="Gateway 필드 세부사항">
  * `mode`: `local`(gateway 실행) 또는 `remote`(remote gateway에 연결). Gateway는 `local`이 아니면 시작을 거부합니다.
  * `port`: WS + HTTP를 위한 단일 multiplexed port. 우선순위: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`
  * `bind`: `auto`, `loopback`(기본값), `lan`(`0.0.0.0`), `tailnet`(Tailscale IP만), `custom`
  * **레거시 bind alias**: `gateway.bind`에는 host alias(`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`)가 아니라 bind mode 값(`auto`, `loopback`, `lan`, `tailnet`, `custom`)을 사용하세요.
  * **Docker 참고**: 기본 `loopback` bind는 container 내부의 `127.0.0.1`에서 listen합니다. Docker bridge networking(`-p 18789:18789`)에서는 트래픽이 `eth0`로 들어오므로 gateway에 도달할 수 없습니다. `--network host`를 사용하거나, 모든 인터페이스에서 listen하도록 `bind: "lan"`(또는 `bind: "custom"` + `customBindHost: "0.0.0.0"`)을 설정하세요.
  * **Auth**: 기본적으로 필요합니다. loopback이 아닌 bind에는 공유 token/password가 필요합니다. onboarding wizard는 기본적으로 token을 생성합니다.
  * `gateway.auth.token`과 `gateway.auth.password`가 모두 구성되어 있으면(SecretRef 포함), `gateway.auth.mode`를 `token` 또는 `password`로 명시적으로 설정하세요. 둘 다 구성되어 있고 mode가 설정되지 않으면 startup과 service install/repair 흐름이 실패합니다.
  * `gateway.auth.mode: "none"`: 명시적 no-auth mode입니다. 신뢰할 수 있는 local loopback 환경에서만 사용하세요. onboarding prompt에서는 의도적으로 제공되지 않습니다.
  * `gateway.auth.mode: "trusted-proxy"`: identity-aware reverse proxy에 auth를 위임하고 `gateway.trustedProxies`의 identity header를 신뢰합니다([Trusted Proxy Auth](/gateway/trusted-proxy-auth) 참고).
  * `gateway.auth.allowTailscale`: `true`이면 Tailscale Serve identity header가 Control UI/WebSocket auth를 만족할 수 있습니다(`tailscale whois`로 검증). HTTP API endpoint는 여전히 token/password auth가 필요합니다. 이 token 없는 흐름은 gateway host가 신뢰된다고 가정합니다. `tailscale.mode = "serve"`이면 기본값은 `true`입니다.
  * `gateway.auth.rateLimit`: 선택적 failed-auth limiter입니다. client IP별, auth scope별(shared-secret와 device-token은 독립 추적)로 적용됩니다. 차단된 시도에는 `429` + `Retry-After`가 반환됩니다.
    * `gateway.auth.rateLimit.exemptLoopback`의 기본값은 `true`입니다. 테스트 환경이나 엄격한 proxy 배포처럼 localhost 트래픽도 rate-limit하고 싶다면 `false`로 설정하세요.
  * Browser-origin WS auth 시도는 loopback exemption을 비활성화한 상태로 항상 throttling됩니다(browser 기반 localhost brute force에 대한 defense-in-depth).
  * `tailscale.mode`: `serve`(tailnet 전용, loopback bind) 또는 `funnel`(공개, auth 필요)
  * `controlUi.allowedOrigins`: Gateway WebSocket 연결을 위한 명시적 browser-origin allowlist입니다. browser client가 non-loopback origin에서 들어오는 경우 필요합니다.
  * `controlUi.dangerouslyAllowHostHeaderOriginFallback`: Host-header origin 정책에 의도적으로 의존하는 배포를 위해 Host-header origin fallback을 활성화하는 위험한 mode입니다.
  * `remote.transport`: `ssh`(기본값) 또는 `direct`(ws/wss). `direct`의 경우 `remote.url`은 `ws://` 또는 `wss://`여야 합니다.
  * `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: 신뢰되는 private-network IP에 대해 평문 `ws://`를 허용하는 client 측 break-glass override입니다. 기본값은 여전히 loopback 전용 평문 허용입니다.
  * `gateway.remote.token` / `.password`는 remote-client credential 필드입니다. 이것만으로 gateway auth를 구성하지는 않습니다.
  * Local gateway call path는 `gateway.auth.*`가 설정되지 않았을 때 `gateway.remote.*`를 fallback으로 사용할 수 있습니다.
  * `trustedProxies`: TLS를 종료하는 reverse proxy의 IP입니다. 자신이 제어하는 proxy만 나열하세요.
  * `allowRealIpFallback`: `true`이면 `X-Forwarded-For`가 없을 때 `X-Real-IP`를 허용합니다. fail-closed 동작을 위해 기본값은 `false`입니다.
  * `gateway.tools.deny`: HTTP `POST /tools/invoke`에 대해 추가로 차단할 tool 이름(기본 deny 목록 확장)
  * `gateway.tools.allow`: 기본 HTTP deny 목록에서 tool 이름 제거
</Accordion>

### OpenAI-compatible endpoint

* Chat Completions: 기본적으로 비활성화되어 있습니다. `gateway.http.endpoints.chatCompletions.enabled: true`로 활성화하세요.
* Responses API: `gateway.http.endpoints.responses.enabled`
* Responses URL-input hardening:
  * `gateway.http.endpoints.responses.maxUrlParts`
  * `gateway.http.endpoints.responses.files.urlAllowlist`
  * `gateway.http.endpoints.responses.images.urlAllowlist`
* 선택적 응답 hardening header:
  * `gateway.http.securityHeaders.strictTransportSecurity`(사용자가 제어하는 HTTPS origin에만 설정, [Trusted Proxy Auth](/gateway/trusted-proxy-auth#tls-termination-and-hsts) 참고)

### 다중 인스턴스 격리

서로 다른 port와 state dir로 한 host에서 여러 gateway를 실행합니다.

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

편의 flag: `--dev`(`~/.openclaw-dev` + port `19001` 사용), `--profile <name>`(`~/.openclaw-<name>` 사용)

[Multiple Gateways](/gateway/multiple-gateways)를 참고하세요.

***

## Hook

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    maxBodyBytes: 262144,
    defaultSessionKey: "hook:ingress",
    allowRequestSessionKey: false,
    allowedSessionKeyPrefixes: ["hook:"],
    allowedAgentIds: ["hooks", "main"],
    presets: ["gmail"],
    transformsDir: "~/.openclaw/hooks/transforms",
    mappings: [
      {
        match: { path: "gmail" },
        action: "agent",
        agentId: "hooks",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate: "From: {{messages[0].from}}\nSubject: {{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.2-mini",
      },
    ],
  },
}
```

인증: `Authorization: Bearer <token>` 또는 `x-openclaw-token: <token>`

**Endpoint:**

* `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
* `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  * request payload의 `sessionKey`는 `hooks.allowRequestSessionKey=true`일 때만 허용됩니다(기본값: `false`).
* `POST /hooks/<name>` → `hooks.mappings`를 통해 해석됨

<Accordion title="Mapping 세부사항">
  - `match.path`는 `/hooks` 뒤의 하위 경로와 매칭됩니다(예: `/hooks/gmail` → `gmail`).
  - `match.source`는 generic path를 위한 payload field와 매칭됩니다.
  - `{{messages[0].subject}}` 같은 template는 payload에서 읽습니다.
  - `transform`은 hook action을 반환하는 JS/TS module을 가리킬 수 있습니다.
    * `transform.module`은 상대 경로여야 하며 `hooks.transformsDir` 안에 머물러야 합니다(절대 경로와 traversal은 거부됨).
  - `agentId`는 특정 agent로 라우팅하며, 알 수 없는 ID는 기본값으로 fallback됩니다.
  - `allowedAgentIds`: 명시적 라우팅을 제한합니다(`*` 또는 생략 = 모두 허용, `[]` = 모두 거부).
  - `defaultSessionKey`: 명시적 `sessionKey`가 없는 hook agent 실행에 대한 선택적 고정 session key
  - `allowRequestSessionKey`: `/hooks/agent` 호출자가 `sessionKey`를 설정하도록 허용(기본값: `false`)
  - `allowedSessionKeyPrefixes`: 명시적 `sessionKey` 값(request + mapping)에 대한 선택적 prefix allowlist, 예: `["hook:"]`
  - `deliver: true`는 최종 응답을 채널로 전송하며, `channel`의 기본값은 `last`입니다.
  - `model`은 이 hook 실행의 LLM을 override합니다(모델 catalog가 설정되어 있으면 허용된 모델이어야 함).
</Accordion>

### Gmail 통합

```json5
{
  hooks: {
    gmail: {
      account: "openclaw@gmail.com",
      topic: "projects/<project-id>/topics/gog-gmail-watch",
      subscription: "gog-gmail-watch-push",
      pushToken: "shared-push-token",
      hookUrl: "http://127.0.0.1:18789/hooks/gmail",
      includeBody: true,
      maxBytes: 20000,
      renewEveryMinutes: 720,
      serve: { bind: "127.0.0.1", port: 8788, path: "/" },
      tailscale: { mode: "funnel", path: "/gmail-pubsub" },
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

* 구성되면 Gateway는 부팅 시 `gog gmail watch serve`를 자동 시작합니다. 비활성화하려면 `OPENCLAW_SKIP_GMAIL_WATCHER=1`을 설정하세요.
* Gateway와 별도로 `gog gmail watch serve`를 함께 실행하지 마세요.

***

## Canvas host

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

* Agent가 수정 가능한 HTML/CSS/JS와 A2UI를 Gateway port 아래 HTTP로 제공합니다.
  * `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  * `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
* Local-only: `gateway.bind: "loopback"`(기본값)을 유지하세요.
* Non-loopback bind: canvas route는 다른 Gateway HTTP surface와 동일하게 Gateway auth(token/password/trusted-proxy)가 필요합니다.
* Node WebView는 일반적으로 auth header를 보내지 않습니다. node가 pairing되고 연결되면 Gateway는 canvas/A2UI 접근을 위한 node 범위 capability URL을 광고합니다.
* Capability URL은 활성 node WS session에 바인딩되며 빠르게 만료됩니다. IP 기반 fallback은 사용되지 않습니다.
* 제공되는 HTML에 live-reload client를 주입합니다.
* 비어 있으면 시작용 `index.html`을 자동 생성합니다.
* A2UI도 `/__openclaw__/a2ui/`에서 제공합니다.
* 변경 사항에는 gateway 재시작이 필요합니다.
* 디렉터리가 크거나 `EMFILE` 오류가 발생하면 live reload를 비활성화하세요.

***

## Discovery

### mDNS (Bonjour)

```json5
{
  discovery: {
    mdns: {
      mode: "minimal", // minimal | full | off
    },
  },
}
```

* `minimal`(기본값): TXT record에서 `cliPath` + `sshPort`를 생략
* `full`: `cliPath` + `sshPort` 포함
* Hostname 기본값은 `openclaw`입니다. `OPENCLAW_MDNS_HOSTNAME`으로 override하세요.

### Wide-area (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

`~/.openclaw/dns/` 아래에 unicast DNS-SD zone을 씁니다. 네트워크 간 discovery를 위해 DNS server(CoreDNS 권장) + Tailscale split DNS와 함께 사용하세요.

설정: `openclaw dns setup --apply`

***

## Environment

### `env` (inline env var)

```json5
{
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
}
```

* Inline env var는 process env에 해당 키가 없을 때만 적용됩니다.
* `.env` 파일: CWD `.env` + `~/.openclaw/.env`(둘 다 기존 var를 override하지 않음)
* `shellEnv`: login shell profile에서 누락된 예상 키를 가져옵니다.
* 전체 우선순위는 [Environment](/help/environment)를 참고하세요.

### Env var 치환

모든 config 문자열에서 `${VAR_NAME}`으로 env var를 참조할 수 있습니다.

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

* 일치하는 것은 대문자 이름만입니다: `[A-Z_][A-Z0-9_]*`
* var가 없거나 비어 있으면 config load 시 오류가 발생합니다.
* 리터럴 `${VAR}`가 필요하면 `$${VAR}`로 escape하세요.
* `$include`와 함께 사용할 수 있습니다.

***

## Secret

Secret ref는 additive입니다. 평문 값도 계속 동작합니다.

### `SecretRef`

다음 객체 형태 중 하나를 사용하세요.

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

검증:

* `provider` 패턴: `^[a-z][a-z0-9_-]{0,63}$`
* `source: "env"` id 패턴: `^[A-Z][A-Z0-9_]{0,127}$`
* `source: "file"` id: 절대 JSON pointer(예: `"/providers/openai/apiKey"`)
* `source: "exec"` id 패턴: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`

### 지원되는 credential surface

* 정규 매트릭스: [SecretRef Credential Surface](/reference/secretref-credential-surface)
* `secrets apply`는 지원되는 `openclaw.json` credential path를 대상으로 합니다.
* `auth-profiles.json` ref도 런타임 해석과 audit 범위에 포함됩니다.

### Secret provider 구성

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // optional explicit env provider
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json",
        timeoutMs: 5000,
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        passEnv: ["PATH", "VAULT_ADDR"],
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
  },
}
```

참고:

* `file` provider는 `mode: "json"`과 `mode: "singleValue"`를 지원합니다(`singleValue` mode에서는 `id`가 `"value"`여야 함).
* `exec` provider는 절대 `command` 경로가 필요하며 stdin/stdout의 protocol payload를 사용합니다.
* 기본적으로 symlink command path는 거부됩니다. symlink path를 허용하면서 해석된 target path를 검증하려면 `allowSymlinkCommand: true`를 설정하세요.
* `trustedDirs`가 구성된 경우 trusted-dir 검사는 해석된 target path에 적용됩니다.
* `exec` child environment는 기본적으로 최소 구성입니다. 필요한 변수는 `passEnv`로 명시적으로 전달하세요.
* Secret ref는 activation 시 메모리 내 snapshot으로 해석되며, 이후 request path는 그 snapshot만 읽습니다.
* Active-surface filtering은 activation 중에 적용됩니다. 활성 surface의 해석되지 않은 ref는 startup/reload를 실패시키고, 비활성 surface는 diagnostic과 함께 건너뜁니다.

***

## Auth 저장소

```json5
{
  auth: {
    profiles: {
      "anthropic:me@example.com": { provider: "anthropic", mode: "oauth", email: "me@example.com" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
    },
    order: {
      anthropic: ["anthropic:me@example.com", "anthropic:work"],
    },
  },
}
```

* Agent별 profile은 `<agentDir>/auth-profiles.json`에 저장됩니다.
* `auth-profiles.json`은 값 수준 ref(`api_key`용 `keyRef`, `token`용 `tokenRef`)를 지원합니다.
* 정적 런타임 credential은 메모리 내 해석 snapshot에서 오며, 레거시 정적 `auth.json` 항목은 발견되면 제거됩니다.
* 레거시 OAuth는 `~/.openclaw/credentials/oauth.json`에서 import합니다.
* [OAuth](/concepts/oauth) 참고
* Secret 런타임 동작과 `audit/configure/apply` 도구: [Secrets Management](/gateway/secrets)

***

## Logging

```json5
{
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty", // pretty | compact | json
    redactSensitive: "tools", // off | tools
    redactPatterns: ["\\bTOKEN\\b\\s*[=:]\\s*([\"']?)([^\\s\"']+)\\1"],
  },
}
```

* 기본 log file: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`
* 안정적인 path를 원하면 `logging.file`을 설정하세요.
* `consoleLevel`은 `--verbose`일 때 `debug`로 올라갑니다.

***

## CLI

```json5
{
  cli: {
    banner: {
      taglineMode: "off", // random | default | off
    },
  },
}
```

* `cli.banner.taglineMode`는 banner tagline 스타일을 제어합니다.
  * `"random"`(기본값): 순환하는 재미있는/계절성 tagline
  * `"default"`: 고정된 중립 tagline(`All your chats, one OpenClaw.`)
  * `"off"`: tagline 텍스트 없음(banner title/version은 계속 표시)
* 전체 banner를 숨기려면(tagline만이 아니라) env `OPENCLAW_HIDE_BANNER=1`을 설정하세요.

***

## Wizard

CLI wizard(`onboard`, `configure`, `doctor`)가 쓰는 메타데이터:

```json5
{
  wizard: {
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
  },
}
```

***

## Identity

```json5
{
  agents: {
    list: [
      {
        id: "main",
        identity: {
          name: "Samantha",
          theme: "helpful sloth",
          emoji: "🦥",
          avatar: "avatars/samantha.png",
        },
      },
    ],
  },
}
```

macOS onboarding assistant가 씁니다. 다음 기본값을 파생합니다.

* `messages.ackReaction`은 `identity.emoji`에서 파생(없으면 👀)
* `mentionPatterns`는 `identity.name`/`identity.emoji`에서 파생
* `avatar`는 다음을 받을 수 있습니다: workspace-relative path, `http(s)` URL, `data:` URI

***

## Bridge (legacy, 제거됨)

현재 빌드에는 TCP bridge가 더 이상 포함되지 않습니다. Node는 Gateway WebSocket을 통해 연결됩니다. `bridge.*` 키는 더 이상 config schema의 일부가 아니며(제거 전까지 validation 실패), `openclaw doctor --fix`가 알 수 없는 키를 제거할 수 있습니다.

<Accordion title="레거시 bridge config(역사적 참고)">
  ```json
  {
    "bridge": {
      "enabled": true,
      "port": 18790,
      "bind": "tailnet",
      "tls": {
        "enabled": true,
        "autoGenerate": true
      }
    }
  }
  ```
</Accordion>

***

## Cron

```json5
{
  cron: {
    enabled: true,
    maxConcurrentRuns: 2,
    webhook: "https://example.invalid/legacy", // deprecated fallback for stored notify:true jobs
    webhookToken: "replace-with-dedicated-token", // optional bearer token for outbound webhook auth
    sessionRetention: "24h", // duration string or false
    runLog: {
      maxBytes: "2mb", // default 2_000_000 bytes
      keepLines: 2000, // default 2000
    },
  },
}
```

* `sessionRetention`: 완료된 격리 cron 실행 세션을 `sessions.json`에서 제거하기 전까지 유지하는 시간입니다. 보관된 삭제 cron transcript 정리도 함께 제어합니다. 기본값: `24h`; 비활성화하려면 `false`
* `runLog.maxBytes`: pruning 전 실행 log file(`cron/runs/<jobId>.jsonl`)당 최대 크기. 기본값: `2_000_000` bytes
* `runLog.keepLines`: run-log pruning이 트리거될 때 유지할 최신 줄 수. 기본값: `2000`
* `webhookToken`: cron webhook POST 전달(`delivery.mode = "webhook"`)에 사용할 bearer token입니다. 생략하면 auth header를 보내지 않습니다.
* `webhook`: 저장된 job 중 여전히 `notify: true`인 항목에만 사용하는 deprecated legacy fallback webhook URL(http/https)

[Cron Jobs](/automation/cron-jobs)를 참고하세요.

***

## Media model template 변수

`tools.media.models[].args`에서 확장되는 template placeholder:

| Variable           | 설명                                         |
| ------------------ | ------------------------------------------ |
| `{{Body}}`         | 전체 수신 메시지 본문                               |
| `{{RawBody}}`      | 원시 본문(history/sender wrapper 없음)           |
| `{{BodyStripped}}` | 그룹 mention을 제거한 본문                         |
| `{{From}}`         | 발신자 식별자                                    |
| `{{To}}`           | 수신 대상 식별자                                  |
| `{{MessageSid}}`   | 채널 메시지 id                                  |
| `{{SessionId}}`    | 현재 session UUID                            |
| `{{IsNewSession}}` | 새 session이 생성되면 `"true"`                   |
| `{{MediaUrl}}`     | 수신 media pseudo-URL                        |
| `{{MediaPath}}`    | 로컬 media path                              |
| `{{MediaType}}`    | Media type(image/audio/document/…)         |
| `{{Transcript}}`   | Audio transcript                           |
| `{{Prompt}}`       | CLI entry에 대해 해석된 media prompt             |
| `{{MaxChars}}`     | CLI entry에 대해 해석된 최대 출력 문자 수               |
| `{{ChatType}}`     | `"direct"` 또는 `"group"`                    |
| `{{GroupSubject}}` | 그룹 제목(best effort)                         |
| `{{GroupMembers}}` | 그룹 멤버 미리보기(best effort)                    |
| `{{SenderName}}`   | 발신자 표시 이름(best effort)                     |
| `{{SenderE164}}`   | 발신자 전화번호(best effort)                      |
| `{{Provider}}`     | Provider 힌트(whatsapp, telegram, discord 등) |

***

## Config include (`$include`)

config를 여러 파일로 분할합니다.

```json5
// ~/.openclaw/openclaw.json
{
  gateway: { port: 18789 },
  agents: { $include: "./agents.json5" },
  broadcast: {
    $include: ["./clients/mueller.json5", "./clients/schmidt.json5"],
  },
}
```

**병합 동작:**

* 단일 파일: 포함하는 객체를 대체합니다.
* 파일 배열: 순서대로 deep-merge됩니다(뒤에 오는 값이 앞 값을 override).
* 형제 키: include 뒤에 병합되며(include된 값을 override)
* 중첩 include: 최대 10단계까지
* 경로: 포함하는 파일 기준으로 해석되지만, 최상위 config 디렉터리(`openclaw.json`의 `dirname`) 안에 머물러야 합니다. 절대 경로나 `../` 형태도 최종적으로 그 경계 안에 해석되면 허용됩니다.
* 오류: 누락된 파일, parse 오류, 순환 include에 대해 명확한 메시지를 제공합니다.

***

*관련 문서: [Configuration](/gateway/configuration) · [Configuration Examples](/gateway/configuration-examples) · [Doctor](/gateway/doctor)*
