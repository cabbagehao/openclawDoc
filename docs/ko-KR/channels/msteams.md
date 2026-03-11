---
summary: "Microsoft Teams bot 지원 상태, 기능, 구성"
read_when:
  - MS Teams 채널 기능을 작업할 때
title: "Microsoft Teams"
---

# Microsoft Teams (plugin)

> "이곳에 들어오는 자여, 모든 희망을 버려라."

업데이트: 2026-01-21

상태: 텍스트 + DM 첨부 파일이 지원됩니다. 채널/그룹 파일 전송에는 `sharePointSiteId` + Graph 권한이 필요합니다 ([그룹 채팅에서 파일 보내기](#sending-files-in-group-chats) 참고). Poll은 Adaptive Cards로 전송됩니다.

## Plugin required

Microsoft Teams는 plugin으로 제공되며 core install에 번들되지 않습니다.

**호환성 깨짐 변경 (2026.1.15):** MS Teams가 core에서 분리되었습니다. 사용하려면 plugin을 설치해야 합니다.

설명: core install을 더 가볍게 유지하고, MS Teams 의존성을 독립적으로 업데이트할 수 있게 하기 위함입니다.

CLI로 설치 (npm registry):

```bash
openclaw plugins install @openclaw/msteams
```

로컬 checkout에서 설치 (git repo에서 실행 중인 경우):

```bash
openclaw plugins install ./extensions/msteams
```

configure/onboarding 중 Teams를 선택했고 git checkout이 감지되면,
OpenClaw는 로컬 설치 경로를 자동으로 제안합니다.

세부 정보: [Plugins](/tools/plugin)

## Quick setup (beginner)

1. Microsoft Teams plugin을 설치합니다.
2. **Azure Bot**을 만듭니다 (App ID + client secret + tenant ID).
3. 해당 자격 증명으로 OpenClaw를 구성합니다.
4. 공개 URL 또는 터널을 통해 `/api/messages`를 노출합니다 (기본 포트 3978).
5. Teams app package를 설치하고 gateway를 시작합니다.

최소 config:

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

참고: group chat은 기본적으로 차단됩니다 (`channels.msteams.groupPolicy: "allowlist"`). group reply를 허용하려면 `channels.msteams.groupAllowFrom`을 설정하세요 (또는 모든 멤버를 허용하려면 `groupPolicy: "open"` 사용, mention-gated 유지).

## Goals

- Teams DM, group chat, channel을 통해 OpenClaw와 대화합니다.
- 라우팅을 결정적으로 유지합니다. reply는 항상 메시지가 들어온 채널로 되돌아갑니다.
- 기본적으로 안전한 채널 동작을 사용합니다 (별도 설정이 없으면 mention이 필요함).

## Config writes

기본적으로 Microsoft Teams는 `/config set|unset`으로 트리거된 config 업데이트 쓰기를 허용합니다 (`commands.config: true` 필요).

다음으로 비활성화할 수 있습니다:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## Access control (DMs + groups)

**DM access**

- 기본값: `channels.msteams.dmPolicy = "pairing"`. 알 수 없는 발신자는 승인 전까지 무시됩니다.
- `channels.msteams.allowFrom`에는 안정적인 AAD object ID를 사용하는 것이 좋습니다.
- UPN/display name은 변경 가능하므로, 직접 매칭은 기본적으로 비활성화되어 있으며 `channels.msteams.dangerouslyAllowNameMatching: true`일 때만 활성화됩니다.
- wizard는 자격 증명이 허용되면 Microsoft Graph를 통해 이름을 ID로 해석할 수 있습니다.

**Group access**

- 기본값: `channels.msteams.groupPolicy = "allowlist"` (`groupAllowFrom`을 추가하지 않으면 차단됨). 미설정 시 기본값을 바꾸려면 `channels.defaults.groupPolicy`를 사용하세요.
- `channels.msteams.groupAllowFrom`은 group chat/channel에서 어떤 발신자가 트리거할 수 있는지 제어합니다 (`channels.msteams.allowFrom`으로 fallback).
- 모든 멤버를 허용하려면 `groupPolicy: "open"`을 설정하세요 (기본적으로 여전히 mention-gated).
- **채널을 전혀 허용하지 않으려면** `channels.msteams.groupPolicy: "disabled"`를 설정하세요.

예시:

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

- `channels.msteams.teams` 아래에 team과 channel을 나열해 group/channel reply 범위를 제한합니다.
- key는 team ID 또는 이름이 될 수 있고, channel key는 conversation ID 또는 이름이 될 수 있습니다.
- `groupPolicy="allowlist"`이고 teams allowlist가 있으면, 나열된 team/channel만 허용됩니다 (mention-gated).
- configure wizard는 `Team/Channel` 항목을 받아 대신 저장해 줍니다.
- 시작 시 OpenClaw는 team/channel과 user allowlist 이름을 ID로 해석하고(Graph 권한이 허용되는 경우)
  그 매핑을 로그로 남깁니다. 해석되지 않은 항목은 입력한 그대로 유지됩니다.

예시:

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
2. **Azure Bot**을 만듭니다 (App ID + secret + tenant ID).
3. bot을 참조하고 아래 RSC 권한을 포함하는 **Teams app package**를 빌드합니다.
4. Teams app을 team에 업로드/설치합니다 (또는 DM용 personal scope).
5. `~/.openclaw/openclaw.json`(또는 env vars)에서 `msteams`를 구성하고 gateway를 시작합니다.
6. gateway는 기본적으로 `/api/messages`에서 Bot Framework webhook 트래픽을 수신합니다.

## Azure Bot Setup (Prerequisites)

OpenClaw를 구성하기 전에 Azure Bot 리소스를 만들어야 합니다.

### Step 1: Create Azure Bot

1. [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)으로 이동합니다
2. **Basics** 탭에 다음을 입력합니다:

   | Field              | Value                                          |
   | ------------------ | ---------------------------------------------- |
   | **Bot handle**     | bot 이름(예: `openclaw-msteams`) (고유해야 함) |
   | **Subscription**   | Azure subscription 선택                        |
   | **Resource group** | 새로 만들거나 기존 것을 사용                   |
   | **Pricing tier**   | 개발/테스트용으로 **Free**                     |
   | **Type of App**    | **Single Tenant** (권장 - 아래 참고)           |
   | **Creation type**  | **Create new Microsoft App ID**                |

> **Deprecation notice:** 새 multi-tenant bot 생성은 2025-07-31 이후 deprecated되었습니다. 새 bot에는 **Single Tenant**를 사용하세요.

3. **Review + create** → **Create**를 클릭합니다 (약 1~2분 대기)

### Step 2: Get Credentials

1. Azure Bot 리소스 → **Configuration**으로 이동합니다
2. **Microsoft App ID**를 복사합니다 → 이것이 `appId`입니다
3. **Manage Password**를 클릭합니다 → App Registration으로 이동합니다
4. **Certificates & secrets** 아래에서 **New client secret** → **Value**를 복사합니다 → 이것이 `appPassword`입니다
5. **Overview**로 이동해 **Directory (tenant) ID**를 복사합니다 → 이것이 `tenantId`입니다

### Step 3: Configure Messaging Endpoint

1. Azure Bot → **Configuration**으로 이동합니다
2. **Messaging endpoint**를 webhook URL로 설정합니다:
   - Production: `https://your-domain.com/api/messages`
   - Local dev: 터널을 사용합니다 (아래 [Local Development](#local-development-tunneling) 참고)

### Step 4: Enable Teams Channel

1. Azure Bot → **Channels**로 이동합니다
2. **Microsoft Teams** → Configure → Save를 클릭합니다
3. Terms of Service에 동의합니다

## Local Development (Tunneling)

Teams는 `localhost`에 접근할 수 없습니다. 로컬 개발에는 터널을 사용하세요:

**Option A: ngrok**

```bash
ngrok http 3978
# https URL을 복사합니다. 예: https://abc123.ngrok.io
# Messaging endpoint를 다음으로 설정합니다: https://abc123.ngrok.io/api/messages
```

**Option B: Tailscale Funnel**

```bash
tailscale funnel 3978
# Tailscale funnel URL을 messaging endpoint로 사용합니다
```

## Teams Developer Portal (Alternative)

manifest ZIP을 직접 만들지 않고 [Teams Developer Portal](https://dev.teams.microsoft.com/apps)을 사용할 수도 있습니다:

1. **+ New app**을 클릭합니다
2. 기본 정보(name, description, developer info)를 입력합니다
3. **App features** → **Bot**으로 이동합니다
4. **Enter a bot ID manually**를 선택하고 Azure Bot App ID를 붙여넣습니다
5. scope로 **Personal**, **Team**, **Group Chat**를 체크합니다
6. **Distribute** → **Download app package**를 클릭합니다
7. Teams에서 **Apps** → **Manage your apps** → **Upload a custom app** → ZIP을 선택합니다

이 방법이 JSON manifest를 직접 수정하는 것보다 대체로 쉽습니다.

## Testing the Bot

**Option A: Azure Web Chat (먼저 webhook 검증)**

1. Azure Portal → Azure Bot 리소스 → **Test in Web Chat**으로 이동합니다
2. 메시지를 보냅니다. 응답이 보여야 합니다
3. 이렇게 하면 Teams 설정 전에 webhook endpoint가 동작하는지 확인할 수 있습니다

**Option B: Teams (app 설치 후)**

1. Teams app을 설치합니다 (sideload 또는 org catalog)
2. Teams에서 bot을 찾아 DM을 보냅니다
3. gateway 로그에서 들어오는 activity를 확인합니다

## Setup (minimal text-only)

1. **Install the Microsoft Teams plugin**
   - npm에서: `openclaw plugins install @openclaw/msteams`
   - 로컬 checkout에서: `openclaw plugins install ./extensions/msteams`

2. **Bot registration**
   - Azure Bot을 만들고 (위 참고) 다음을 기록합니다:
     - App ID
     - Client secret (App password)
     - Tenant ID (single-tenant)

3. **Teams app manifest**
   - `bot` 항목에 `botId = <App ID>`를 포함합니다.
   - Scopes: `personal`, `team`, `groupChat`.
   - `supportsFiles: true` (`personal` scope 파일 처리를 위해 필요).
   - RSC 권한을 추가합니다 (아래 참고).
   - 아이콘을 만듭니다: `outline.png` (32x32) 및 `color.png` (192x192).
   - 세 파일을 함께 zip으로 묶습니다: `manifest.json`, `outline.png`, `color.png`.

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

   config key 대신 환경 변수를 사용할 수도 있습니다:
   - `MSTEAMS_APP_ID`
   - `MSTEAMS_APP_PASSWORD`
   - `MSTEAMS_TENANT_ID`

5. **Bot endpoint**
   - Azure Bot Messaging Endpoint를 다음으로 설정합니다:
     - `https://<host>:3978/api/messages` (또는 선택한 path/port).

6. **Run the gateway**
   - plugin이 설치되어 있고 자격 증명이 포함된 `msteams` config가 존재하면 Teams channel이 자동으로 시작됩니다.

## History context

- `channels.msteams.historyLimit`은 최근 channel/group 메시지를 몇 개 prompt에 감쌀지 제어합니다.
- `messages.groupChat.historyLimit`으로 fallback합니다. 비활성화하려면 `0`으로 설정하세요 (기본값 50).
- DM history는 `channels.msteams.dmHistoryLimit` (user turn 기준)으로 제한할 수 있습니다. 사용자별 override: `channels.msteams.dms["<user_id>"].historyLimit`.

## Current Teams RSC Permissions (Manifest)

다음은 Teams app manifest에 있는 **현재 resourceSpecific 권한**입니다. 이 권한은 app이 설치된 team/chat 내부에서만 적용됩니다.

**For channels (team scope):**

- `ChannelMessage.Read.Group` (Application) - @mention 없이 모든 channel 메시지 수신
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**For group chats:**

- `ChatMessage.Read.Chat` (Application) - @mention 없이 모든 group chat 메시지 수신

## Example Teams Manifest (redacted)

필수 필드를 포함한 최소 유효 예시입니다. ID와 URL을 교체하세요.

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

- `bots[].botId`는 Azure Bot App ID와 정확히 일치해야 합니다.
- `webApplicationInfo.id`는 Azure Bot App ID와 정확히 일치해야 합니다.
- `bots[].scopes`에는 사용할 surface(`personal`, `team`, `groupChat`)가 포함되어야 합니다.
- `bots[].supportsFiles: true`는 `personal` scope의 파일 처리를 위해 필요합니다.
- channel 트래픽을 원한다면 `authorization.permissions.resourceSpecific`에 channel read/send가 포함되어야 합니다.

### Updating an existing app

이미 설치된 Teams app을 업데이트하려면 (예: RSC 권한 추가):

1. 새 설정으로 `manifest.json`을 업데이트합니다
2. **`version` 필드를 증가**시킵니다 (예: `1.0.0` → `1.1.0`)
3. 아이콘과 함께 manifest를 **다시 zip으로 묶습니다** (`manifest.json`, `outline.png`, `color.png`)
4. 새 zip을 업로드합니다:
   - **Option A (Teams Admin Center):** Teams Admin Center → Teams apps → Manage apps → 앱 찾기 → Upload new version
   - **Option B (Sideload):** Teams → Apps → Manage your apps → Upload a custom app
5. **Team channel의 경우:** 새 권한이 적용되도록 각 team에 app을 다시 설치합니다
6. 캐시된 app metadata를 지우기 위해 **Teams를 완전히 종료한 뒤 다시 실행**합니다 (창만 닫는 것이 아님)

## Capabilities: RSC only vs Graph

### With **Teams RSC only** (app 설치됨, Graph API 권한 없음)

동작함:

- channel 메시지의 **텍스트** 내용 읽기.
- channel 메시지의 **텍스트** 내용 보내기.
- **personal (DM)** 파일 첨부 수신.

동작하지 않음:

- channel/group의 **이미지 또는 파일 내용** (payload에는 실제 파일 바이트가 아니라 HTML stub만 포함됨).
- SharePoint/OneDrive에 저장된 첨부 파일 다운로드.
- 메시지 history 읽기 (실시간 webhook event 범위 초과).

Graph 권한이 없으면 이미지가 포함된 channel 메시지는 텍스트만 있는 메시지로 수신됩니다 (이미지 내용은 bot이 접근할 수 없음).
기본적으로 OpenClaw는 Microsoft/Teams hostname의 media만 다운로드합니다. `channels.msteams.mediaAllowHosts`로 재정의할 수 있습니다 (모든 host를 허용하려면 `["*"]` 사용).
Authorization header는 `channels.msteams.mediaAuthAllowHosts`에 있는 host에만 붙습니다 (기본값은 Graph + Bot Framework host). 이 목록은 엄격하게 유지하세요 (multi-tenant suffix는 피하세요).

## Sending files in group chats

bot은 FileConsentCard 흐름(내장)을 사용해 DM에 파일을 보낼 수 있습니다. 하지만 **group chat/channel에서 파일 보내기**에는 추가 설정이 필요합니다:

| Context                  | How files are sent                           | Setup needed                                    |
| ------------------------ | -------------------------------------------- | ----------------------------------------------- |
| **DMs**                  | FileConsentCard → user accepts → bot uploads | Works out of the box                            |
| **Group chats/channels** | Upload to SharePoint → share link            | Requires `sharePointSiteId` + Graph permissions |
| **Images (any context)** | Base64-encoded inline                        | Works out of the box                            |

### Why group chats need SharePoint

bot에는 개인 OneDrive drive가 없습니다 (`/me/drive` Graph API endpoint는 application identity에서 동작하지 않음). group chat/channel에 파일을 보내려면 bot이 **SharePoint site**에 업로드하고 sharing link를 만들어야 합니다.

### Setup

1. Entra ID (Azure AD) → App Registration에서 **Graph API 권한**을 추가합니다:
   - `Sites.ReadWrite.All` (Application) - SharePoint에 파일 업로드
   - `Chat.Read.All` (Application) - 선택 사항, 사용자별 공유 링크 활성화

2. tenant에 대해 **admin consent**를 부여합니다.

3. **SharePoint site ID를 가져옵니다:**

   ```bash
   # Graph Explorer 또는 유효한 token을 사용한 curl:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # 예: "contoso.sharepoint.com/sites/BotFiles" 사이트의 경우
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # 응답에 포함됨: "id": "contoso.sharepoint.com,guid1,guid2"
   ```

4. **OpenClaw를 구성합니다:**

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
| `Sites.ReadWrite.All` only              | Organization-wide sharing link (anyone in org can access) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | Per-user sharing link (only chat members can access)      |

사용자별 공유가 더 안전합니다. chat 참여자만 파일에 접근할 수 있기 때문입니다. `Chat.Read.All` 권한이 없으면 bot은 organization-wide 공유로 fallback합니다.

### Fallback behavior

| Scenario                                          | Result                                             |
| ------------------------------------------------- | -------------------------------------------------- |
| Group chat + file + `sharePointSiteId` configured | Upload to SharePoint, send sharing link            |
| Group chat + file + no `sharePointSiteId`         | Attempt OneDrive upload (may fail), send text only |
| Personal chat + file                              | FileConsentCard flow (works without SharePoint)    |
| Any context + image                               | Base64-encoded inline (works without SharePoint)   |

### Files stored location

업로드된 파일은 구성된 SharePoint site의 기본 document library 안 `/OpenClawShared/` 폴더에 저장됩니다.

## Polls (Adaptive Cards)

OpenClaw는 Teams poll을 Adaptive Cards로 전송합니다 (네이티브 Teams poll API는 없습니다).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- 투표는 gateway가 `~/.openclaw/msteams-polls.json`에 기록합니다.
- 투표를 기록하려면 gateway가 계속 온라인 상태여야 합니다.
- poll은 아직 결과 요약을 자동 게시하지 않습니다 (필요하면 저장 파일을 직접 확인하세요).

## Adaptive Cards (arbitrary)

`message` tool 또는 CLI를 사용해 임의의 Adaptive Card JSON을 Teams 사용자나 대화에 보낼 수 있습니다.

`card` 매개변수는 Adaptive Card JSON 객체를 받습니다. `card`가 제공되면 메시지 텍스트는 선택 사항입니다.

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

card schema와 예시는 [Adaptive Cards documentation](https://adaptivecards.io/)를 참고하세요. target 형식 세부 정보는 아래 [Target formats](#target-formats)를 참고하세요.

## Target formats

MSTeams target은 사용자와 대화를 구분하기 위해 prefix를 사용합니다:

| Target type         | Format                           | Example                                             |
| ------------------- | -------------------------------- | --------------------------------------------------- |
| User (by ID)        | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| User (by name)      | `user:<display-name>`            | `user:John Smith` (requires Graph API)              |
| Group/channel       | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| Group/channel (raw) | `<conversation-id>`              | `19:abc123...@thread.tacv2` (if contains `@thread`) |

**CLI examples:**

```bash
# ID로 사용자에게 보내기
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# display name으로 사용자에게 보내기 (Graph API lookup 트리거)
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# group chat 또는 channel에 보내기
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hello"

# 대화에 Adaptive Card 보내기
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

참고: `user:` prefix가 없으면 이름은 기본적으로 group/team 해석으로 처리됩니다. display name으로 사람을 지정할 때는 항상 `user:`를 사용하세요.

## Proactive messaging

- proactive message는 사용자가 먼저 상호작용한 **이후에만** 가능합니다. 그 시점에 conversation reference를 저장하기 때문입니다.
- `dmPolicy` 및 allowlist gating은 `/gateway/configuration`을 참고하세요.

## Team and Channel IDs (Common Gotcha)

Teams URL의 `groupId` query parameter는 config에 사용하는 team ID가 **아닙니다**. 대신 URL path에서 ID를 추출해야 합니다:

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

- Team ID = `/team/` 뒤의 path segment (URL-decoded, 예: `19:Bk4j...@thread.tacv2`)
- Channel ID = `/channel/` 뒤의 path segment (URL-decoded)
- `groupId` query parameter는 **무시**하세요

## Private Channels

bot은 private channel에서 지원이 제한됩니다:

| Feature                      | Standard Channels | Private Channels       |
| ---------------------------- | ----------------- | ---------------------- |
| Bot installation             | Yes               | Limited                |
| Real-time messages (webhook) | Yes               | May not work           |
| RSC permissions              | Yes               | May behave differently |
| @mentions                    | Yes               | If bot is accessible   |
| Graph API history            | Yes               | Yes (with permissions) |

**private channel이 동작하지 않을 때의 우회 방법:**

1. bot 상호작용에는 standard channel을 사용합니다
2. DM을 사용합니다. 사용자는 언제든 bot에 직접 메시지를 보낼 수 있습니다
3. history 접근에는 Graph API를 사용합니다 (`ChannelMessage.Read.All` 필요)

## Troubleshooting

### Common issues

- **채널에서 이미지가 보이지 않음:** Graph 권한 또는 admin consent가 누락되었습니다. Teams app을 다시 설치하고 Teams를 완전히 종료했다가 다시 여세요.
- **채널에서 응답이 없음:** 기본적으로 mention이 필요합니다. `channels.msteams.requireMention=false`를 설정하거나 team/channel별로 구성하세요.
- **버전 불일치 (Teams에 여전히 이전 manifest가 보임):** app을 제거 후 다시 추가하고 Teams를 완전히 종료해 새로 고치세요.
- **webhook에서 401 Unauthorized:** Azure JWT 없이 수동 테스트할 때는 정상입니다. endpoint에 도달했지만 auth에 실패했다는 뜻입니다. Azure Web Chat으로 올바르게 테스트하세요.

### Manifest upload errors

- **"Icon file cannot be empty":** manifest가 0바이트 아이콘 파일을 참조하고 있습니다. 유효한 PNG 아이콘을 만드세요 (`outline.png`는 32x32, `color.png`는 192x192).
- **"webApplicationInfo.Id already in use":** app이 다른 team/chat에 아직 설치되어 있습니다. 먼저 찾아 제거하거나, 전파될 때까지 5~10분 기다리세요.
- **업로드 시 "Something went wrong":** 대신 [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com)에서 업로드하고, 브라우저 DevTools(F12) → Network 탭을 열어 실제 오류가 담긴 response body를 확인하세요.
- **Sideload 실패:** "Upload a custom app" 대신 "Upload an app to your org's app catalog"를 시도하세요. sideload 제한을 우회하는 경우가 많습니다.

### RSC permissions not working

1. `webApplicationInfo.id`가 bot의 App ID와 정확히 일치하는지 확인합니다
2. app을 다시 업로드하고 team/chat에 다시 설치합니다
3. 조직 admin이 RSC 권한을 차단하지 않았는지 확인합니다
4. 올바른 scope를 쓰는지 확인합니다. team에는 `ChannelMessage.Read.Group`, group chat에는 `ChatMessage.Read.Chat`

## References

- [Create Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - Azure Bot 설정 가이드
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - Teams app 생성/관리
- [Teams app manifest schema](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Receive channel messages with RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC permissions reference](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams bot file handling](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (channel/group에는 Graph 필요)
- [Proactive messaging](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
