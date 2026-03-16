---
summary: "Feishu bot overview, features, and configuration"
description: "OpenClaw를 Feishu 또는 Lark bot과 연결하는 방법, 앱 권한 설정, DM 및 그룹 접근 제어, streaming 구성까지 한 번에 안내합니다."
read_when:
  - Feishu/Lark bot을 연결하려고 할 때
  - Feishu 채널 구성을 조정할 때
title: "Feishu"
x-i18n:
  source_path: "channels/feishu.md"
---

# Feishu bot

Feishu(Lark)는 기업용 메시징 및 협업 플랫폼입니다. 이 플러그인은 플랫폼의 WebSocket event subscription을 사용해 공개 webhook URL을 노출하지 않고도 OpenClaw가 Feishu/Lark bot 메시지를 수신하도록 연결합니다.

---

## Bundled plugin

Feishu는 현재 OpenClaw 릴리스에 기본 포함되므로 별도 plugin 설치가 필요하지 않습니다.

현재 번들되지 않은 구버전 빌드나 커스텀 설치를 사용 중이라면 수동으로 설치하세요.

```bash
openclaw plugins install @openclaw/feishu
```

---

## Quickstart

Feishu 채널을 추가하는 방법은 두 가지입니다.

### Method 1: onboarding wizard (recommended)

OpenClaw를 방금 설치했다면 wizard를 실행하세요.

```bash
openclaw onboard
```

wizard는 다음 과정을 안내합니다.

1. Feishu 앱 생성 및 credentials 수집
2. OpenClaw에 app credentials 구성
3. gateway 시작

구성이 끝나면 gateway 상태를 확인하세요.

- `openclaw gateway status`
- `openclaw logs --follow`

### Method 2: CLI setup

초기 설치를 이미 마쳤다면 CLI로 채널을 추가할 수 있습니다.

```bash
openclaw channels add
```

**Feishu**를 선택한 뒤 App ID와 App Secret을 입력하세요.

구성이 끝난 뒤 자주 쓰는 명령은 다음과 같습니다.

- `openclaw gateway status`
- `openclaw gateway restart`
- `openclaw logs --follow`

---

## Step 1: Create a Feishu app

### 1. Open Feishu Open Platform

[Feishu Open Platform](https://open.feishu.cn/app)에 접속해 로그인합니다.

Lark(global) tenant는 [https://open.larksuite.com/app](https://open.larksuite.com/app)을 사용하고, Feishu config에서 `domain: "lark"`를 설정해야 합니다.

### 2. Create an app

1. **Create enterprise app**를 클릭합니다.
2. 앱 이름과 설명을 입력합니다.
3. 앱 아이콘을 선택합니다.

![Create enterprise app](../images/feishu-step2-create-app.png)

### 3. Copy credentials

**Credentials & Basic Info**에서 다음 값을 복사합니다.

- **App ID** (형식: `cli_xxx`)
- **App Secret**

**중요:** App Secret은 외부에 노출하지 마세요.

![Get credentials](../images/feishu-step3-credentials.png)

### 4. Configure permissions

**Permissions**에서 **Batch import**를 클릭한 뒤 아래 JSON을 붙여넣습니다.

```json
{
  "scopes": {
    "tenant": [
      "aily:file:read",
      "aily:file:write",
      "application:application.app_message_stats.overview:readonly",
      "application:application:self_manage",
      "application:bot.menu:write",
      "cardkit:card:read",
      "cardkit:card:write",
      "contact:user.employee_id:readonly",
      "corehr:file:download",
      "event:ip_list",
      "im:chat.access_event.bot_p2p_chat:read",
      "im:chat.members:bot_access",
      "im:message",
      "im:message.group_at_msg:readonly",
      "im:message.p2p_msg:readonly",
      "im:message:readonly",
      "im:message:send_as_bot",
      "im:resource"
    ],
    "user": ["aily:file:read", "aily:file:write", "im:chat.access_event.bot_p2p_chat:read"]
  }
}
```

![Configure permissions](../images/feishu-step4-permissions.png)

### 5. Enable bot capability

**App Capability** > **Bot**에서 다음을 수행합니다.

1. bot capability 활성화
2. bot 이름 설정

![Enable bot capability](../images/feishu-step5-bot-capability.png)

### 6. Configure event subscription

**중요:** event subscription을 설정하기 전에 다음 조건을 만족해야 합니다.

1. Feishu용 `openclaw channels add`를 이미 실행함
2. gateway가 실행 중임 (`openclaw gateway status`)

**Event Subscription**에서:

1. **Use long connection to receive events** (WebSocket)를 선택합니다.
2. `im.message.receive_v1` 이벤트를 추가합니다.

gateway가 실행 중이 아니면 long-connection 설정이 저장되지 않을 수 있습니다.

![Configure event subscription](../images/feishu-step6-event-subscription.png)

### 7. Publish the app

1. **Version Management & Release**에서 버전을 생성합니다.
2. 리뷰 제출 후 publish합니다.
3. 관리자 승인을 기다립니다. 엔터프라이즈 앱은 자동 승인되는 경우가 많습니다.

---

## Step 2: Configure OpenClaw

### Configure with the wizard (recommended)

```bash
openclaw channels add
```

**Feishu**를 선택하고 App ID와 App Secret을 붙여넣으세요.

### Configure via config file

`~/.openclaw/openclaw.json`을 수정합니다.

```json5
{
  channels: {
    feishu: {
      enabled: true,
      dmPolicy: "pairing",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          botName: "My AI assistant",
        },
      },
    },
  },
}
```

`connectionMode: "webhook"`를 사용할 경우 `verificationToken`도 설정해야 합니다. Feishu webhook server는 기본적으로 `127.0.0.1`에 bind되므로, 의도적으로 바인드 주소를 바꾸는 경우에만 `webhookHost`를 지정하세요.

#### Verification Token (webhook mode)

webhook mode를 사용할 때는 config에 `channels.feishu.verificationToken`을 설정해야 합니다. 값은 다음 위치에서 가져올 수 있습니다.

1. Feishu Open Platform에서 앱을 엽니다.
2. **Development** → **Events & Callbacks**로 이동합니다.
3. **Encryption** 탭을 엽니다.
4. **Verification Token**을 복사합니다.

![Verification Token location](../images/feishu-verification-token.png)

### Configure via environment variables

```bash
export FEISHU_APP_ID="cli_xxx"
export FEISHU_APP_SECRET="xxx"
```

### Lark (global) domain

tenant가 Lark(international)에 있다면 domain을 `lark`로 설정하세요. `channels.feishu.domain` 또는 계정별 `channels.feishu.accounts.<id>.domain`에 지정할 수 있습니다.

```json5
{
  channels: {
    feishu: {
      domain: "lark",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
        },
      },
    },
  },
}
```

### Quota optimization flags

Feishu API 사용량을 줄이려면 두 가지 선택 플래그를 사용할 수 있습니다.

- `typingIndicator` (default `true`): `false`이면 typing reaction 호출을 건너뜁니다.
- `resolveSenderNames` (default `true`): `false`이면 발신자 profile lookup을 건너뜁니다.

top-level 또는 account별로 설정할 수 있습니다.

```json5
{
  channels: {
    feishu: {
      typingIndicator: false,
      resolveSenderNames: false,
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          typingIndicator: true,
          resolveSenderNames: false,
        },
      },
    },
  },
}
```

---

## Step 3: Start + test

### 1. Start the gateway

```bash
openclaw gateway
```

### 2. Send a test message

Feishu에서 bot을 찾아 테스트 메시지를 보냅니다.

### 3. Approve pairing

기본값에서는 bot이 pairing code를 반환합니다. 아래 명령으로 승인하세요.

```bash
openclaw pairing approve feishu <CODE>
```

승인 후에는 일반 대화처럼 사용할 수 있습니다.

---

## Overview

- **Feishu bot channel**: gateway가 관리하는 Feishu bot 채널
- **Deterministic routing**: 응답은 항상 Feishu로 다시 전달됨
- **Session isolation**: DM은 main session을 공유하고, 그룹은 별도로 격리됨
- **WebSocket connection**: Feishu SDK의 long connection 사용, 공개 URL 불필요

---

## Access control

### Direct messages

- **기본값**: `dmPolicy: "pairing"`. 알 수 없는 사용자는 pairing code를 받습니다.
- **Approve pairing**:

  ```bash
  openclaw pairing list feishu
  openclaw pairing approve feishu <CODE>
  ```

- **Allowlist mode**: 허용할 Open ID를 `channels.feishu.allowFrom`에 설정합니다.

### Group chats

**1. Group policy** (`channels.feishu.groupPolicy`)

- `"open"` = 그룹에서 모두 허용 (default)
- `"allowlist"` = `groupAllowFrom`에 포함된 그룹만 허용
- `"disabled"` = 그룹 메시지 비활성화

**2. Mention requirement** (`channels.feishu.groups.<chat_id>.requireMention`)

- `true` = `@mention`이 있어야 응답 (default)
- `false` = mention 없이 응답

---

## Group configuration examples

### Allow all groups, require @mention (default)

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
      // Default requireMention: true
    },
  },
}
```

### Allow all groups, no @mention required

```json5
{
  channels: {
    feishu: {
      groups: {
        oc_xxx: { requireMention: false },
      },
    },
  },
}
```

### Allow specific groups only

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      // Feishu group IDs (chat_id) look like: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

### Restrict which senders can message in a group (sender allowlist)

그룹 자체를 허용하는 것과 별개로, 해당 그룹의 **모든 메시지**는 sender `open_id` 기준으로도 검증됩니다. `groups.<chat_id>.allowFrom`에 포함된 사용자만 메시지가 처리되며, 나머지 멤버의 메시지는 무시됩니다. 이는 `/reset`이나 `/new` 같은 control command에만 적용되는 제한이 아니라 전체 메시지 처리 게이트입니다.

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["oc_xxx"],
      groups: {
        oc_xxx: {
          // Feishu user IDs (open_id) look like: ou_xxx
          allowFrom: ["ou_user1", "ou_user2"],
        },
      },
    },
  },
}
```

---

## Get group/user IDs

### Group IDs (chat_id)

그룹 ID는 `oc_xxx` 형식입니다.

**Method 1 (recommended)**

1. gateway를 시작하고 그룹에서 bot을 `@mention`합니다.
2. `openclaw logs --follow`를 실행하고 `chat_id`를 찾습니다.

**Method 2**

Feishu API debugger를 사용해 group chats를 조회합니다.

### User IDs (open_id)

사용자 ID는 `ou_xxx` 형식입니다.

**Method 1 (recommended)**

1. gateway를 시작하고 bot에 DM을 보냅니다.
2. `openclaw logs --follow`를 실행하고 `open_id`를 찾습니다.

**Method 2**

대기 중인 pairing request에서 user Open ID를 확인합니다.

```bash
openclaw pairing list feishu
```

---

## Common commands

| Command   | Description       |
| --------- | ----------------- |
| `/status` | Bot 상태 표시     |
| `/reset`  | 세션 초기화       |
| `/model`  | 모델 보기/전환    |

> 참고: Feishu는 아직 native command menu를 지원하지 않으므로 명령은 텍스트로 직접 전송해야 합니다.

## Gateway management commands

| Command                    | Description                   |
| -------------------------- | ----------------------------- |
| `openclaw gateway status`  | gateway 상태 표시             |
| `openclaw gateway install` | gateway service 설치/시작     |
| `openclaw gateway stop`    | gateway service 중지          |
| `openclaw gateway restart` | gateway service 재시작        |
| `openclaw logs --follow`   | gateway 로그 실시간 확인      |

---

## Troubleshooting

### Bot does not respond in group chats

1. bot이 그룹에 추가되어 있는지 확인합니다.
2. 기본 동작대로 `@mention`했는지 확인합니다.
3. `groupPolicy`가 `"disabled"`로 설정되지 않았는지 확인합니다.
4. `openclaw logs --follow`로 로그를 확인합니다.

### Bot does not receive messages

1. 앱이 publish 및 승인되었는지 확인합니다.
2. event subscription에 `im.message.receive_v1`이 포함되어 있는지 확인합니다.
3. **long connection**이 활성화되어 있는지 확인합니다.
4. 앱 권한이 빠짐없이 설정되었는지 확인합니다.
5. gateway가 실행 중인지 확인합니다: `openclaw gateway status`
6. `openclaw logs --follow`로 로그를 확인합니다.

### App Secret leak

1. Feishu Open Platform에서 App Secret을 재발급합니다.
2. config의 App Secret을 갱신합니다.
3. gateway를 재시작합니다.

### Message send failures

1. 앱에 `im:message:send_as_bot` 권한이 있는지 확인합니다.
2. 앱이 publish되었는지 확인합니다.
3. 로그에서 상세 오류를 확인합니다.

---

## Advanced configuration

### Multiple accounts

```json5
{
  channels: {
    feishu: {
      defaultAccount: "main",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          botName: "Primary bot",
        },
        backup: {
          appId: "cli_yyy",
          appSecret: "yyy",
          botName: "Backup bot",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount`는 outbound API가 `accountId`를 명시하지 않을 때 어떤 Feishu account를 사용할지 결정합니다.

### Message limits

- `textChunkLimit`: outbound text chunk size (default: `2000` chars)
- `mediaMaxMb`: media upload/download limit (default: `30MB`)

### Streaming

Feishu는 interactive cards를 사용한 streaming replies를 지원합니다. 활성화되면 bot은 텍스트를 생성하는 동안 카드를 계속 업데이트합니다.

```json5
{
  channels: {
    feishu: {
      streaming: true, // enable streaming card output (default true)
      blockStreaming: true, // enable block-level streaming (default true)
    },
  },
}
```

전체 응답을 모두 생성한 뒤 전송하려면 `streaming: false`로 설정합니다.

### Multi-agent routing

`bindings`를 사용하면 Feishu DM이나 group을 서로 다른 agent로 라우팅할 수 있습니다.

```json5
{
  agents: {
    list: [
      { id: "main" },
      {
        id: "clawd-fan",
        workspace: "/home/user/clawd-fan",
        agentDir: "/home/user/.openclaw/agents/clawd-fan/agent",
      },
      {
        id: "clawd-xi",
        workspace: "/home/user/clawd-xi",
        agentDir: "/home/user/.openclaw/agents/clawd-xi/agent",
      },
    ],
  },
  bindings: [
    {
      agentId: "main",
      match: {
        channel: "feishu",
        peer: { kind: "direct", id: "ou_xxx" },
      },
    },
    {
      agentId: "clawd-fan",
      match: {
        channel: "feishu",
        peer: { kind: "direct", id: "ou_yyy" },
      },
    },
    {
      agentId: "clawd-xi",
      match: {
        channel: "feishu",
        peer: { kind: "group", id: "oc_zzz" },
      },
    },
  ],
}
```

Routing fields:

- `match.channel`: `"feishu"`
- `match.peer.kind`: `"direct"` 또는 `"group"`
- `match.peer.id`: user Open ID (`ou_xxx`) 또는 group ID (`oc_xxx`)

조회 방법은 [Get group/user IDs](#get-groupuser-ids)를 참고하세요.

---

## Configuration reference

전체 설정은 [Gateway configuration](/gateway/configuration)을 참고하세요.

주요 옵션:

| Setting                                           | Description                             | Default          |
| ------------------------------------------------- | --------------------------------------- | ---------------- |
| `channels.feishu.enabled`                         | 채널 활성화 여부                        | `true`           |
| `channels.feishu.domain`                          | API domain (`feishu` 또는 `lark`)       | `feishu`         |
| `channels.feishu.connectionMode`                  | event transport mode                    | `websocket`      |
| `channels.feishu.defaultAccount`                  | outbound routing 기본 account ID        | `default`        |
| `channels.feishu.verificationToken`               | webhook mode에 필요                     | -                |
| `channels.feishu.webhookPath`                     | webhook route path                      | `/feishu/events` |
| `channels.feishu.webhookHost`                     | webhook bind host                       | `127.0.0.1`      |
| `channels.feishu.webhookPort`                     | webhook bind port                       | `3000`           |
| `channels.feishu.accounts.<id>.appId`             | App ID                                  | -                |
| `channels.feishu.accounts.<id>.appSecret`         | App Secret                              | -                |
| `channels.feishu.accounts.<id>.domain`            | account별 API domain override           | `feishu`         |
| `channels.feishu.dmPolicy`                        | DM policy                               | `pairing`        |
| `channels.feishu.allowFrom`                       | DM allowlist (open_id list)             | -                |
| `channels.feishu.groupPolicy`                     | Group policy                            | `open`           |
| `channels.feishu.groupAllowFrom`                  | Group allowlist                         | -                |
| `channels.feishu.groups.<chat_id>.requireMention` | `@mention` 필요 여부                    | `true`           |
| `channels.feishu.groups.<chat_id>.enabled`        | 그룹 활성화 여부                        | `true`           |
| `channels.feishu.textChunkLimit`                  | 메시지 chunk 크기                       | `2000`           |
| `channels.feishu.mediaMaxMb`                      | media 크기 제한                         | `30`             |
| `channels.feishu.streaming`                       | streaming card output 활성화            | `true`           |
| `channels.feishu.blockStreaming`                  | block streaming 활성화                  | `true`           |

---

## dmPolicy reference

| Value         | Behavior                                                        |
| ------------- | --------------------------------------------------------------- |
| `"pairing"`   | **기본값.** 알 수 없는 사용자는 pairing code를 받고 승인이 필요함 |
| `"allowlist"` | `allowFrom`에 있는 사용자만 대화 가능                           |
| `"open"`      | 모든 사용자 허용 (`allowFrom`에 `"*"` 필요)                     |
| `"disabled"`  | DM 비활성화                                                     |

---

## Supported message types

### Receive

- ✅ Text
- ✅ Rich text (post)
- ✅ Images
- ✅ Files
- ✅ Audio
- ✅ Video
- ✅ Stickers

### Send

- ✅ Text
- ✅ Images
- ✅ Files
- ✅ Audio
- ⚠️ Rich text (partial support)
