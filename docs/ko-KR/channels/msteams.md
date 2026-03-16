---
summary: "Microsoft Teams bot support status, capabilities, and configuration"
description: "OpenClaw를 Microsoft Teams bot과 연결하는 방법, Azure Bot 구성, RSC·Graph 권한, 파일 전송과 Adaptive Cards까지 실무 기준으로 안내합니다."
read_when:
  - MS Teams 채널 기능을 작업할 때
title: "Microsoft Teams"
x-i18n:
  source_path: "channels/msteams.md"
---

# Microsoft Teams (plugin)

> "Abandon all hope, ye who enter here."

Updated: 2026-01-21

Status: text와 DM attachments를 지원합니다. channel/group file sending에는 `sharePointSiteId`와 Graph permissions가 필요합니다. 자세한 내용은 [Sending files in group chats](#sending-files-in-group-chats)를 참고하세요. Poll은 Adaptive Cards로 전송됩니다.

## Plugin required

Microsoft Teams는 plugin으로 제공되며 core install에는 포함되지 않습니다.

**Breaking change (2026.1.15):** MS Teams가 core에서 분리되었습니다. 사용하려면 plugin을 별도로 설치해야 합니다.

이렇게 분리한 이유는 core install을 더 가볍게 유지하고, MS Teams 의존성을 독립적으로 업데이트할 수 있게 하기 위해서입니다.

CLI 설치 (npm registry):

```bash
openclaw plugins install @openclaw/msteams
```

local checkout에서 실행 중일 때:

```bash
openclaw plugins install ./extensions/msteams
```

configure/onboarding 중 Teams를 선택했고 git checkout이 감지되면, OpenClaw는 local install path도 자동 제안합니다.

자세한 내용: [Plugins](/tools/plugin)

## Quick setup (beginner)

1. Microsoft Teams plugin을 설치합니다.
2. **Azure Bot**를 생성합니다. App ID, client secret, tenant ID가 필요합니다.
3. 해당 credential로 OpenClaw를 구성합니다.
4. 공개 URL 또는 tunnel을 통해 `/api/messages`(기본 port `3978`)를 노출합니다.
5. Teams app package를 설치하고 gateway를 시작합니다.

Minimal config:

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      appPassword: "<APP_PASSWORD>",
      tenantId: "<TENANT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

참고: group chat은 기본적으로 차단됩니다 (`channels.msteams.groupPolicy: "allowlist"`). group reply를 허용하려면 `channels.msteams.groupAllowFrom`을 설정하거나, `groupPolicy: "open"`을 사용하세요. 후자의 경우에도 기본 mention gating은 유지됩니다.

## Goals

- Teams DM, group chat, channel에서 OpenClaw와 대화할 수 있게 합니다.
- routing은 항상 deterministic하게 유지되어, reply가 들어온 채널로 다시 돌아갑니다.
- 별도 설정이 없으면 안전한 channel behavior를 기본값으로 사용합니다. 즉, mentions가 필요합니다.

## Config writes

기본적으로 Microsoft Teams는 `/config set|unset`로 유발된 config update를 기록할 수 있습니다. (`commands.config: true` 필요)

비활성화:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## Access control (DMs + groups)

**DM access**

- 기본값: `channels.msteams.dmPolicy = "pairing"`. 승인 전까지 unknown sender는 무시됩니다.
- `channels.msteams.allowFrom`에는 안정적인 AAD object ID 사용을 권장합니다.
- UPN이나 display name은 바뀔 수 있으므로 direct matching은 기본 비활성화이며, `channels.msteams.dangerouslyAllowNameMatching: true`일 때만 켤 수 있습니다.
- credential이 허용되면 wizard가 Microsoft Graph를 통해 이름을 ID로 resolve할 수 있습니다.

**Group access**

- 기본값: `channels.msteams.groupPolicy = "allowlist"` 입니다. `groupAllowFrom`을 추가하기 전에는 차단됩니다. unset일 때 기본값을 바꾸려면 `channels.defaults.groupPolicy`를 사용하세요.
- `channels.msteams.groupAllowFrom`은 group chat/channel에서 어떤 sender가 bot을 트리거할 수 있는지 제어합니다. unset이면 `channels.msteams.allowFrom`으로 fallback합니다.
- `groupPolicy: "open"`이면 모든 member를 허용합니다. 그래도 기본적으로 mention gating은 유지됩니다.
- 아무 channel도 허용하지 않으려면 `channels.msteams.groupPolicy: "disabled"`를 사용합니다.

Example:

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["user@org.com"],
    },
  },
}
```

**Teams + channel allowlist**

- `channels.msteams.teams` 아래에 team과 channel을 나열해 group/channel reply 범위를 제한할 수 있습니다.
- key는 team ID 또는 이름, channel key는 conversation ID 또는 이름이 될 수 있습니다.
- `groupPolicy="allowlist"`이고 teams allowlist가 있으면, 나열된 team/channel만 mention-gated로 허용됩니다.
- configure wizard는 `Team/Channel` 항목을 받아 자동 저장할 수 있습니다.
- startup 시 OpenClaw는 team/channel 이름과 user allowlist 이름을 ID로 resolve하고 그 매핑을 로그에 남깁니다. resolve되지 않은 항목은 입력한 값을 유지합니다.

Example:

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      teams: {
        "My Team": {
          channels: {
            General: { requireMention: true },
          },
        },
      },
    },
  },
}
```

## How it works

1. Microsoft Teams plugin을 설치합니다.
2. **Azure Bot**를 만들고 App ID, secret, tenant ID를 확인합니다.
3. bot을 참조하고 아래 RSC permission을 포함하는 **Teams app package**를 만듭니다.
4. Teams app을 팀에 업로드하거나 personal scope에 설치합니다.
5. `~/.openclaw/openclaw.json` 또는 env vars에 `msteams`를 구성하고 gateway를 시작합니다.
6. gateway는 기본적으로 `/api/messages`에서 Bot Framework webhook traffic을 수신합니다.

## Azure Bot Setup (Prerequisites)

OpenClaw를 구성하기 전에 Azure Bot resource를 먼저 만들어야 합니다.

### Step 1: Create Azure Bot

1. [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)으로 이동합니다.
2. **Basics** 탭을 채웁니다.

   | Field              | Value                                                    |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | 봇 이름. 예: `openclaw-msteams` (고유해야 함)            |
   | **Subscription**   | 사용할 Azure subscription 선택                           |
   | **Resource group** | 새로 만들거나 기존 항목 사용                             |
   | **Pricing tier**   | 개발/테스트에는 **Free**                                 |
   | **Type of App**    | **Single Tenant** 권장                                   |
   | **Creation type**  | **Create new Microsoft App ID**                          |

> **Deprecation notice:** 새 multi-tenant bot 생성은 2025-07-31 이후 deprecated되었습니다. 새 bot은 **Single Tenant**를 사용하세요.

3. **Review + create** → **Create**를 클릭하고 1~2분 정도 기다립니다.

### Step 2: Get Credentials

1. Azure Bot resource에서 **Configuration**으로 이동합니다.
2. **Microsoft App ID**를 복사합니다. 이것이 `appId`입니다.
3. **Manage Password**를 클릭해 App Registration으로 이동합니다.
4. **Certificates & secrets**에서 **New client secret**을 만든 뒤 **Value**를 복사합니다. 이것이 `appPassword`입니다.
5. **Overview**에서 **Directory (tenant) ID**를 복사합니다. 이것이 `tenantId`입니다.

### Step 3: Configure Messaging Endpoint

1. Azure Bot → **Configuration**
2. **Messaging endpoint**를 webhook URL로 설정합니다.
   - Production: `https://your-domain.com/api/messages`
   - Local dev: 아래 [Local Development](#local-development-tunneling) 참고

### Step 4: Enable Teams Channel

1. Azure Bot → **Channels**
2. **Microsoft Teams** → Configure → Save
3. Terms of Service를 수락합니다.

## Local Development (Tunneling)

Teams는 `localhost`에 직접 접근할 수 없습니다. local development에는 tunnel이 필요합니다.

**Option A: ngrok**

```bash
ngrok http 3978
# Copy the https URL, for example: https://abc123.ngrok.io
# Set the messaging endpoint to: https://abc123.ngrok.io/api/messages
```

**Option B: Tailscale Funnel**

```bash
tailscale funnel 3978
# Use your Tailscale funnel URL as the messaging endpoint
```

## Teams Developer Portal (Alternative)

manifest ZIP을 손으로 만드는 대신 [Teams Developer Portal](https://dev.teams.microsoft.com/apps)을 사용할 수 있습니다.

1. **+ New app** 클릭
2. 기본 정보 입력 (name, description, developer info)
3. **App features** → **Bot**
4. **Enter a bot ID manually**를 선택하고 Azure Bot App ID를 붙여넣기
5. scope 체크: **Personal**, **Team**, **Group Chat**
6. **Distribute** → **Download app package**
7. Teams에서 **Apps** → **Manage your apps** → **Upload a custom app** → ZIP 선택

이 방식이 JSON manifest를 직접 편집하는 것보다 쉬운 경우가 많습니다.

## Testing the Bot

**Option A: Azure Web Chat (verify webhook first)**

1. Azure Portal의 Azure Bot resource에서 **Test in Web Chat**로 이동합니다.
2. 메시지를 보내고 응답을 확인합니다.
3. Teams 설정 전에 webhook endpoint가 정상인지 확인할 수 있습니다.

**Option B: Teams (after app installation)**

1. Teams app을 설치합니다. (sideload 또는 org catalog)
2. Teams에서 bot을 찾아 DM을 보냅니다.
3. gateway log에서 inbound activity를 확인합니다.

## Setup (minimal text-only)

1. **Install the Microsoft Teams plugin**
   - npm에서 설치: `openclaw plugins install @openclaw/msteams`
   - local checkout에서 설치: `openclaw plugins install ./extensions/msteams`

2. **Bot registration**
   - 위 설명대로 Azure Bot를 만들고 다음 정보를 확보합니다.
     - App ID
     - Client secret (App password)
     - Tenant ID (single-tenant)

3. **Teams app manifest**
   - `bot` entry에 `botId = <App ID>`를 넣습니다.
   - scope: `personal`, `team`, `groupChat`
   - `supportsFiles: true` (personal scope file handling에 필요)
   - 아래 RSC permission 추가
   - icon 생성: `outline.png` (32x32), `color.png` (192x192)
   - `manifest.json`, `outline.png`, `color.png` 세 파일을 함께 ZIP으로 묶습니다.

4. **Configure OpenClaw**

   ```json
   {
     "msteams": {
       "enabled": true,
       "appId": "<APP_ID>",
       "appPassword": "<APP_PASSWORD>",
       "tenantId": "<TENANT_ID>",
       "webhook": { "port": 3978, "path": "/api/messages" }
     }
   }
   ```

   config key 대신 env vars도 사용할 수 있습니다.
   - `MSTEAMS_APP_ID`
   - `MSTEAMS_APP_PASSWORD`
   - `MSTEAMS_TENANT_ID`

5. **Bot endpoint**
   - Azure Bot Messaging Endpoint를 다음처럼 설정합니다.
     - `https://<host>:3978/api/messages`
     - 또는 사용 중인 path/port

6. **Run the gateway**
   - plugin이 설치되어 있고 credential이 포함된 `msteams` config가 있으면 Teams channel은 자동으로 시작됩니다.

## History context

- `channels.msteams.historyLimit`은 최근 channel/group message 몇 개를 prompt에 감쌀지 제어합니다.
- `messages.groupChat.historyLimit`로 fallback합니다. `0`이면 비활성화됩니다. 기본값은 `50`입니다.
- DM history는 `channels.msteams.dmHistoryLimit`로 제한할 수 있습니다. 사용자별 override는 `channels.msteams.dms["<user_id>"].historyLimit`를 사용합니다.

## Current Teams RSC Permissions (Manifest)

아래는 현재 Teams app manifest에 있는 **resourceSpecific permissions**입니다. app이 설치된 team/chat 안에서만 적용됩니다.

**For channels (team scope):**

- `ChannelMessage.Read.Group` (Application) - `@mention` 없이도 모든 channel message 수신
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**For group chats:**

- `ChatMessage.Read.Chat` (Application) - `@mention` 없이도 모든 group chat message 수신

## Example Teams Manifest (redacted)

필수 필드를 포함한 최소한의 유효 예시입니다. ID와 URL은 실제 값으로 교체하세요.

```json
{
  "$schema": "https://developer.microsoft.com/en-us/json-schemas/teams/v1.23/MicrosoftTeams.schema.json",
  "manifestVersion": "1.23",
  "version": "1.0.0",
  "id": "00000000-0000-0000-0000-000000000000",
  "name": { "short": "OpenClaw" },
  "developer": {
    "name": "Your Org",
    "websiteUrl": "https://example.com",
    "privacyUrl": "https://example.com/privacy",
    "termsOfUseUrl": "https://example.com/terms"
  },
  "description": { "short": "OpenClaw in Teams", "full": "OpenClaw in Teams" },
  "icons": { "outline": "outline.png", "color": "color.png" },
  "accentColor": "#5B6DEF",
  "bots": [
    {
      "botId": "11111111-1111-1111-1111-111111111111",
      "scopes": ["personal", "team", "groupChat"],
      "isNotificationOnly": false,
      "supportsCalling": false,
      "supportsVideo": false,
      "supportsFiles": true
    }
  ],
  "webApplicationInfo": {
    "id": "11111111-1111-1111-1111-111111111111"
  },
  "authorization": {
    "permissions": {
      "resourceSpecific": [
        { "name": "ChannelMessage.Read.Group", "type": "Application" },
        { "name": "ChannelMessage.Send.Group", "type": "Application" },
        { "name": "Member.Read.Group", "type": "Application" },
        { "name": "Owner.Read.Group", "type": "Application" },
        { "name": "ChannelSettings.Read.Group", "type": "Application" },
        { "name": "TeamMember.Read.Group", "type": "Application" },
        { "name": "TeamSettings.Read.Group", "type": "Application" },
        { "name": "ChatMessage.Read.Chat", "type": "Application" }
      ]
    }
  }
}
```

### Manifest caveats (must-have fields)

- `bots[].botId`는 Azure Bot App ID와 **반드시** 일치해야 합니다.
- `webApplicationInfo.id`도 Azure Bot App ID와 **반드시** 일치해야 합니다.
- `bots[].scopes`에는 사용할 surface (`personal`, `team`, `groupChat`)가 포함되어야 합니다.
- `bots[].supportsFiles: true`는 personal scope file handling에 필요합니다.
- channel traffic을 원하면 `authorization.permissions.resourceSpecific`에 channel read/send 권한이 있어야 합니다.

### Updating an existing app

이미 설치된 Teams app를 업데이트하려면:

1. `manifest.json`을 새 설정으로 갱신합니다.
2. **`version` 필드를 증가**시킵니다. 예: `1.0.0` → `1.1.0`
3. `manifest.json`, `outline.png`, `color.png`를 다시 ZIP으로 묶습니다.
4. 새 ZIP을 업로드합니다.
   - **Option A (Teams Admin Center):** Teams Admin Center → Teams apps → Manage apps → 앱 선택 → Upload new version
   - **Option B (Sideload):** Teams → Apps → Manage your apps → Upload a custom app
5. **team channel의 경우** 새 permission이 반영되도록 각 team에 app을 다시 설치합니다.
6. Teams app metadata cache를 비우기 위해 **Teams를 완전히 종료한 뒤 다시 실행**합니다.

## Capabilities: RSC only vs Graph

### With **Teams RSC only** (app installed, no Graph API permissions)

동작하는 것:

- channel message **text** 내용 읽기
- channel message **text** 전송
- **personal (DM)** file attachment 수신

동작하지 않는 것:

- channel/group의 **image 또는 file contents** (payload에는 HTML stub만 포함)
- SharePoint/OneDrive에 저장된 attachment 다운로드
- live webhook event를 넘는 과거 message history 조회

### With **Teams RSC + Microsoft Graph Application permissions**

추가되는 기능:

- hosted contents 다운로드 (메시지에 붙여넣은 image 등)
- SharePoint/OneDrive의 file attachment 다운로드
- Graph를 통한 channel/chat message history 조회

### RSC vs Graph API

| Capability              | RSC Permissions   | Graph API                           |
| ----------------------- | ----------------- | ----------------------------------- |
| **Real-time messages**  | Yes (webhook)     | No (polling only)                   |
| **Historical messages** | No                | Yes (history query 가능)            |
| **Setup complexity**    | manifest만 필요   | admin consent + token flow 필요     |
| **Works offline**       | No                | Yes                                 |

**Bottom line:** RSC는 real-time listening용이고, Graph API는 historical access용입니다. offline 중 놓친 메시지를 따라잡으려면 `ChannelMessage.Read.All`이 포함된 Graph API 권한이 필요합니다. 이 권한에는 admin consent가 필요합니다.

## Graph-enabled media + history (required for channels)

channel에서 image/file이 필요하거나 message history를 가져오려면 Microsoft Graph permission을 켜고 admin consent를 부여해야 합니다.

1. Entra ID (Azure AD) **App Registration**에서 Microsoft Graph **Application permissions**를 추가합니다.
   - `ChannelMessage.Read.All` (channel attachment + history)
   - `Chat.Read.All` 또는 `ChatMessage.Read.All` (group chats)
2. tenant에 대해 **Grant admin consent**를 수행합니다.
3. Teams app **manifest version**을 올리고, 다시 업로드하고, **Teams에서 app을 재설치**합니다.
4. cached app metadata를 지우기 위해 **Teams를 완전히 종료 후 재실행**합니다.

**Additional permission for user mentions:** 현재 conversation에 없는 사용자를 동적으로 검색해 mention하려면 `User.Read.All` (Application) 권한도 추가하고 admin consent를 부여하세요. 현재 conversation에 이미 있는 사용자의 `@mention`은 기본 동작으로 처리됩니다.

## Known Limitations

### Webhook timeouts

Teams는 HTTP webhook으로 메시지를 전달합니다. 처리가 너무 오래 걸리면(예: 느린 LLM 응답):

- Gateway timeout
- Teams의 message retry로 인한 duplicate
- dropped reply

같은 문제가 생길 수 있습니다.

OpenClaw는 빠르게 응답을 반환하고 proactive reply를 보내는 방식으로 이를 줄이지만, 매우 느린 응답에서는 여전히 문제가 생길 수 있습니다.

### Formatting

Teams markdown은 Slack이나 Discord보다 제약이 큽니다.

- 기본 formatting은 동작: **bold**, _italic_, `code`, links
- 복잡한 markdown(table, nested list 등)은 올바르게 렌더링되지 않을 수 있음
- poll과 arbitrary card send에는 Adaptive Cards를 사용합니다.

## Configuration

주요 설정 항목 (`/gateway/configuration`에는 공통 채널 패턴이 정리되어 있습니다):

- `channels.msteams.enabled`: 채널 활성화/비활성화
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: bot credentials
- `channels.msteams.webhook.port` (default `3978`)
- `channels.msteams.webhook.path` (default `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (default: pairing)
- `channels.msteams.allowFrom`: DM allowlist (AAD object ID 권장). Graph access가 가능하면 wizard가 setup 중 이름을 ID로 resolve합니다.
- `channels.msteams.dangerouslyAllowNameMatching`: mutable UPN/display-name matching을 다시 켜는 break-glass toggle
- `channels.msteams.textChunkLimit`: outbound text chunk 크기
- `channels.msteams.chunkMode`: `length` (default) 또는 `newline`. 빈 줄 단위로 먼저 나눈 뒤 길이 기준 chunking으로 fallback
- `channels.msteams.mediaAllowHosts`: inbound attachment host allowlist (default는 Microsoft/Teams domain)
- `channels.msteams.mediaAuthAllowHosts`: media retry 시 Authorization header를 붙일 host allowlist (기본은 Graph + Bot Framework host)
- `channels.msteams.requireMention`: channel/group에서 `@mention` 필요 여부 (default true)
- `channels.msteams.replyStyle`: `thread | top-level` (아래 [Reply Style](#reply-style-threads-vs-posts) 참고)
- `channels.msteams.teams.<teamId>.replyStyle`: team별 override
- `channels.msteams.teams.<teamId>.requireMention`: team별 override
- `channels.msteams.teams.<teamId>.tools`: channel override가 없을 때 적용되는 team-level tool policy override (`allow`/`deny`/`alsoAllow`)
- `channels.msteams.teams.<teamId>.toolsBySender`: team-level per-sender tool policy override (`"*"` wildcard 지원)
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: channel별 override
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: channel별 override
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: channel별 tool policy override (`allow`/`deny`/`alsoAllow`)
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: channel별 per-sender tool policy override (`"*"` wildcard 지원)
- `toolsBySender` key는 명시적 prefix 사용 권장:
  `id:`, `e164:`, `username:`, `name:` (legacy unprefixed key는 `id:`로만 매핑)
- `channels.msteams.sharePointSiteId`: group chat/channel에서 file upload에 사용할 SharePoint site ID (아래 [Sending files in group chats](#sending-files-in-group-chats) 참고)

## Routing & Sessions

- session key는 표준 agent 형식을 따릅니다. 자세한 내용은 [/concepts/session](/concepts/session)을 참고하세요.
  - direct message는 main session을 공유합니다 (`agent:<agentId>:<mainKey>`)
  - channel/group message는 conversation id를 사용합니다.
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Reply Style: Threads vs Posts

Teams는 최근 동일한 data model 위에 두 가지 channel UI 스타일을 제공합니다.

| Style                    | Description                                               | Recommended `replyStyle` |
| ------------------------ | --------------------------------------------------------- | ------------------------ |
| **Posts** (classic)      | 메시지가 카드 형태로 보이고 아래에 thread reply가 붙음    | `thread` (default)       |
| **Threads** (Slack-like) | 메시지가 Slack처럼 선형 흐름으로 보임                     | `top-level`              |

**문제점:** Teams API는 channel이 어떤 UI style을 쓰는지 알려주지 않습니다. `replyStyle`을 잘못 선택하면:

- Threads-style channel에서 `thread`를 쓰면 reply가 어색하게 중첩되어 보임
- Posts-style channel에서 `top-level`을 쓰면 reply가 thread 안이 아니라 새로운 top-level post처럼 보임

**해결 방법:** channel별 설정에 맞춰 `replyStyle`을 지정합니다.

```json
{
  "msteams": {
    "replyStyle": "thread",
    "teams": {
      "19:abc...@thread.tacv2": {
        "channels": {
          "19:xyz...@thread.tacv2": {
            "replyStyle": "top-level"
          }
        }
      }
    }
  }
}
```

## Attachments & Images

**Current limitations:**

- **DMs:** Teams bot file API를 통해 image와 file attachment가 동작합니다.
- **Channels/groups:** attachment는 M365 storage(SharePoint/OneDrive)에 저장됩니다. webhook payload에는 실제 file bytes가 아니라 HTML stub만 포함됩니다. channel attachment를 다운로드하려면 **Graph API permissions가 필요합니다**.

Graph permission이 없으면 image가 포함된 channel message는 text-only로 수신됩니다. image content는 bot이 읽을 수 없습니다.

기본적으로 OpenClaw는 Microsoft/Teams hostname에서만 media를 다운로드합니다. 필요하면 `channels.msteams.mediaAllowHosts`로 override할 수 있습니다. (`["*"]`도 가능)

Authorization header는 `channels.msteams.mediaAuthAllowHosts`에 포함된 host에만 붙습니다. 기본값은 Graph + Bot Framework host이며, 이 목록은 가능한 엄격하게 유지하는 것이 좋습니다.

## Sending files in group chats

bot은 DM에서는 FileConsentCard flow를 사용해 file을 보낼 수 있습니다. 그러나 **group chat/channel에서 file을 보내려면** 추가 설정이 필요합니다.

| Context                  | How files are sent                           | Setup needed                                    |
| ------------------------ | -------------------------------------------- | ----------------------------------------------- |
| **DMs**                  | FileConsentCard → user accepts → bot uploads | 기본 동작으로 지원                              |
| **Group chats/channels** | SharePoint에 업로드 후 sharing link 전송     | `sharePointSiteId` + Graph permissions 필요     |
| **Images (any context)** | Base64-encoded inline                        | 기본 동작으로 지원                              |

### Why group chats need SharePoint

bot에는 개인 OneDrive가 없습니다. (`/me/drive` Graph API endpoint는 application identity에 동작하지 않음) 따라서 group chat/channel에 file을 보내려면 **SharePoint site**에 업로드한 뒤 sharing link를 생성해야 합니다.

### Setup

1. Entra ID (Azure AD) → App Registration에서 **Graph API permissions**를 추가합니다.
   - `Sites.ReadWrite.All` (Application) - SharePoint file upload
   - `Chat.Read.All` (Application) - 선택 사항, user별 sharing link 가능

2. tenant에 대해 **Grant admin consent**를 수행합니다.

3. **SharePoint site ID**를 가져옵니다.

   ```bash
   # Via Graph Explorer or curl with a valid token:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # Example: "contoso.sharepoint.com/sites/BotFiles"
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # Response includes: "id": "contoso.sharepoint.com,guid1,guid2"
   ```

4. **OpenClaw에 설정합니다.**

   ```json5
   {
     channels: {
       msteams: {
         // ... other config ...
         sharePointSiteId: "contoso.sharepoint.com,guid1,guid2",
       },
     },
   }
   ```

### Sharing behavior

| Permission                              | Sharing behavior                                          |
| --------------------------------------- | --------------------------------------------------------- |
| `Sites.ReadWrite.All` only              | org 전체 공유 링크 (조직 내 누구나 접근 가능)             |
| `Sites.ReadWrite.All` + `Chat.Read.All` | per-user sharing link (해당 chat member만 접근 가능)     |

per-user sharing이 더 안전합니다. `Chat.Read.All`이 없으면 bot은 org-wide sharing으로 fallback합니다.

### Fallback behavior

| Scenario                                          | Result                                             |
| ------------------------------------------------- | -------------------------------------------------- |
| Group chat + file + `sharePointSiteId` configured | SharePoint 업로드 후 sharing link 전송             |
| Group chat + file + no `sharePointSiteId`         | OneDrive upload 시도 후 실패 가능, text만 전송     |
| Personal chat + file                              | FileConsentCard flow 사용                          |
| Any context + image                               | Base64 inline 전송                                 |

### Files stored location

업로드된 파일은 설정된 SharePoint site의 기본 document library 안 `/OpenClawShared/` 폴더에 저장됩니다.

## Polls (Adaptive Cards)

OpenClaw는 Teams poll을 Adaptive Cards로 전송합니다. Teams에는 native poll API가 없습니다.

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- 투표 결과는 gateway가 `~/.openclaw/msteams-polls.json`에 기록합니다.
- 투표 기록을 남기려면 gateway가 계속 online 상태여야 합니다.
- 아직 결과 요약을 자동 게시하지는 않습니다. 필요하면 store file을 직접 확인하세요.

## Adaptive Cards (arbitrary)

`message` tool 또는 CLI를 사용해 Teams user나 conversation에 임의의 Adaptive Card JSON을 보낼 수 있습니다.

`card` parameter는 Adaptive Card JSON object를 받습니다. `card`가 있으면 message text는 선택 사항입니다.

**Agent tool:**

```json
{
  "action": "send",
  "channel": "msteams",
  "target": "user:<id>",
  "card": {
    "type": "AdaptiveCard",
    "version": "1.5",
    "body": [{ "type": "TextBlock", "text": "Hello!" }]
  }
}
```

**CLI:**

```bash
openclaw message send --channel msteams \
  --target "conversation:19:abc...@thread.tacv2" \
  --card '{"type":"AdaptiveCard","version":"1.5","body":[{"type":"TextBlock","text":"Hello!"}]}'
```

card schema와 예시는 [Adaptive Cards documentation](https://adaptivecards.io/)을 참고하세요. target format은 아래 [Target formats](#target-formats)를 참고하세요.

## Target formats

MSTeams target은 user와 conversation을 구분하기 위해 prefix를 사용합니다.

| Target type         | Format                           | Example                                             |
| ------------------- | -------------------------------- | --------------------------------------------------- |
| User (by ID)        | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| User (by name)      | `user:<display-name>`            | `user:John Smith` (Graph API 필요)                 |
| Group/channel       | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`           |
| Group/channel (raw) | `<conversation-id>`              | `19:abc123...@thread.tacv2` (if contains `@thread`) |

**CLI examples:**

```bash
# Send to a user by ID
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# Send to a user by display name (triggers Graph API lookup)
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# Send to a group chat or channel
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hello"

# Send an Adaptive Card to a conversation
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --card '{"type":"AdaptiveCard","version":"1.5","body":[{"type":"TextBlock","text":"Hello"}]}'
```

**Agent tool examples:**

```json
{
  "action": "send",
  "channel": "msteams",
  "target": "user:John Smith",
  "message": "Hello!"
}
```

```json
{
  "action": "send",
  "channel": "msteams",
  "target": "conversation:19:abc...@thread.tacv2",
  "card": {
    "type": "AdaptiveCard",
    "version": "1.5",
    "body": [{ "type": "TextBlock", "text": "Hello" }]
  }
}
```

참고: `user:` prefix 없이 이름을 쓰면 group/team 해석이 기본값이 됩니다. 사람 이름을 target으로 쓸 때는 항상 `user:`를 붙이세요.

## Proactive messaging

- proactive message는 user가 먼저 한 번 상호작용한 뒤에만 가능합니다. 그때 conversation reference를 저장하기 때문입니다.
- `dmPolicy`와 allowlist gating은 `/gateway/configuration`을 참고하세요.

## Team and Channel IDs (Common Gotcha)

Teams URL의 `groupId` query parameter는 config에 사용하는 team ID가 **아닙니다**. ID는 URL path에서 추출해야 합니다.

**Team URL:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Team ID (URL-decode this)
```

**Channel URL:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Channel ID (URL-decode this)
```

**For config:**

- Team ID = `/team/` 뒤 path segment (URL-decoded, 예: `19:Bk4j...@thread.tacv2`)
- Channel ID = `/channel/` 뒤 path segment (URL-decoded)
- `groupId` query parameter는 **무시**

## Private Channels

private channel에서 bot 지원은 제한적입니다.

| Feature                      | Standard Channels | Private Channels       |
| ---------------------------- | ----------------- | ---------------------- |
| Bot installation             | Yes               | Limited                |
| Real-time messages (webhook) | Yes               | May not work           |
| RSC permissions              | Yes               | May behave differently |
| @mentions                    | Yes               | If bot is accessible   |
| Graph API history            | Yes               | Yes (with permissions) |

**private channel이 잘 동작하지 않을 때의 우회 방법:**

1. bot interaction은 standard channel을 사용
2. DM 사용 - 사용자는 언제든 bot에게 직접 메시지 가능
3. Graph API로 historical access 사용 (`ChannelMessage.Read.All` 필요)

## Troubleshooting

### Common issues

- **채널에서 이미지가 보이지 않음:** Graph permission 또는 admin consent가 빠진 경우가 많습니다. Teams app을 재설치하고 Teams를 완전히 종료 후 다시 실행하세요.
- **채널에서 응답이 없음:** 기본값으로 mention이 필요합니다. `channels.msteams.requireMention=false` 또는 team/channel별 override를 설정하세요.
- **Version mismatch (Teams에 옛 manifest가 계속 보임):** app을 제거 후 다시 추가하고 Teams를 완전히 종료해 cache를 비우세요.
- **Webhook의 401 Unauthorized:** Azure JWT 없이 수동 테스트하면 정상적으로 보이는 현상입니다. endpoint는 도달 가능하지만 auth가 실패한 상태입니다. 검증은 Azure Web Chat으로 하세요.

### Manifest upload errors

- **"Icon file cannot be empty":** manifest가 참조하는 icon file이 0 byte입니다. 유효한 PNG icon을 생성하세요. (`outline.png` 32x32, `color.png` 192x192)
- **"webApplicationInfo.Id already in use":** app이 다른 team/chat에 아직 설치되어 있습니다. 먼저 제거하거나 5~10분 정도 propagation을 기다리세요.
- **"Something went wrong" on upload:** [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com)에서 업로드하고, 브라우저 DevTools(F12) → Network 탭에서 실제 오류 응답 본문을 확인하세요.
- **Sideload failing:** "Upload a custom app" 대신 "Upload an app to your org's app catalog"를 시도하세요. sideload 제한을 우회하는 경우가 많습니다.

### RSC permissions not working

1. `webApplicationInfo.id`가 bot의 App ID와 정확히 일치하는지 확인
2. app을 다시 업로드하고 team/chat에 재설치
3. 조직 admin이 RSC permission을 차단하지 않았는지 확인
4. scope가 맞는지 확인: team에는 `ChannelMessage.Read.Group`, group chat에는 `ChatMessage.Read.Chat`

## References

- [Create Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - Azure Bot setup guide
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - Teams app 생성/관리
- [Teams app manifest schema](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Receive channel messages with RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC permissions reference](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams bot file handling](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (channel/group에는 Graph 필요)
- [Proactive messaging](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
