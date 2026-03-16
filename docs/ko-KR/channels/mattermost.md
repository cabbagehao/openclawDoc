---
summary: "Mattermost bot 연동 방식과 OpenClaw 설정 개요"
description: "OpenClaw를 Mattermost와 연결하는 방법, plugin 설치, slash command, 버튼 상호작용, 전송 대상 형식과 문제 해결 절차를 안내합니다."
read_when:
  - Mattermost를 설정할 때
  - Mattermost 라우팅 문제를 디버깅할 때
title: "Mattermost"
x-i18n:
  source_path: "channels/mattermost.md"
---

# Mattermost (plugin)

Status: plugin을 통해 지원됩니다(bot token + WebSocket events). Channels, groups, DMs를 지원합니다.
Mattermost는 self-hostable team messaging platform입니다. 제품 상세와 다운로드는
[mattermost.com](https://mattermost.com)에서 확인하세요.

## Plugin required

Mattermost는 plugin으로 제공되며 core install에는 포함되지 않습니다.

CLI 설치(npm registry):

```bash
openclaw plugins install @openclaw/mattermost
```

로컬 checkout에서 설치(git repo에서 실행 중일 때):

```bash
openclaw plugins install ./extensions/mattermost
```

configure/onboarding 중 Mattermost를 선택했고 git checkout이 감지되면,
OpenClaw는 자동으로 로컬 설치 경로를 제안합니다.

상세: [Plugins](/tools/plugin)

## Quick setup

1. Mattermost plugin을 설치합니다.
2. Mattermost bot account를 만들고 **bot token**을 복사합니다.
3. Mattermost **base URL**을 복사합니다(예: `https://chat.example.com`).
4. OpenClaw를 설정하고 gateway를 시작합니다.

Minimal config:

```json5
{
  channels: {
    mattermost: {
      enabled: true,
      botToken: "mm-token",
      baseUrl: "https://chat.example.com",
      dmPolicy: "pairing",
    },
  },
}
```

## Native slash commands

Native slash commands는 opt-in입니다. 활성화하면 OpenClaw가 Mattermost API를 통해
`oc_*` slash command를 등록하고 gateway HTTP server에서 callback POST를 받습니다.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Use when Mattermost cannot reach the gateway directly (reverse proxy/public URL).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

Notes:

- `native: "auto"`는 Mattermost에서 기본적으로 disabled입니다. 활성화하려면 `native: true`를 설정하세요.
- `callbackUrl`이 없으면 OpenClaw가 gateway host/port + `callbackPath`로부터 URL을 유도합니다.
- multi-account 구성에서는 `commands`를 top level에 두거나
  `channels.mattermost.accounts.<id>.commands` 아래에 둘 수 있습니다(account 값이 top-level field를 override함).
- command callback은 per-command token으로 검증되며, token 검증 실패 시 fail closed로 동작합니다.
- reachability requirement: callback endpoint는 Mattermost server에서 도달 가능해야 합니다.
  - Mattermost가 OpenClaw와 같은 host/network namespace에서 실행되지 않는다면 `callbackUrl`을 `localhost`로 두지 마세요.
  - 해당 URL이 `/api/channels/mattermost/command`를 OpenClaw로 reverse-proxy하지 않는다면 `callbackUrl`을 Mattermost base URL로 두지 마세요.
  - 빠른 점검: `curl https://<gateway-host>/api/channels/mattermost/command`를 실행했을 때 OpenClaw의 `405 Method Not Allowed`가 나와야 하며 `404`가 나오면 안 됩니다.
- Mattermost egress allowlist requirement:
  - callback target이 private/tailnet/internal address라면 Mattermost의
    `ServiceSettings.AllowedUntrustedInternalConnections`에 callback host/domain을 포함시켜야 합니다.
  - full URL이 아니라 host/domain 항목을 사용하세요.
    - Good: `gateway.tailnet-name.ts.net`
    - Bad: `https://gateway.tailnet-name.ts.net`

## Environment variables (default account)

env var를 선호한다면 gateway host에 다음을 설정하세요.

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

env var는 **default** account(`default`)에만 적용됩니다. 다른 account는 config 값을 사용해야 합니다.

## Chat modes

Mattermost는 DMs에는 자동으로 응답합니다. Channel 동작은 `chatmode`로 제어합니다.

- `oncall` (default): channels에서는 @mention될 때만 응답
- `onmessage`: 모든 channel message에 응답
- `onchar`: message가 trigger prefix로 시작할 때 응답

Config example:

```json5
{
  channels: {
    mattermost: {
      chatmode: "onchar",
      oncharPrefixes: [">", "!"],
    },
  },
}
```

Notes:

- `onchar`는 explicit @mention에도 계속 응답합니다.
- `channels.mattermost.requireMention`은 legacy config에서는 존중되지만 `chatmode` 사용이 권장됩니다.

## Access control (DMs)

- 기본값: `channels.mattermost.dmPolicy = "pairing"`(알 수 없는 sender는 pairing code를 받음).
- 승인 명령:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- Public DMs: `channels.mattermost.dmPolicy="open"` + `channels.mattermost.allowFrom=["*"]`.

## Channels (groups)

- 기본값: `channels.mattermost.groupPolicy = "allowlist"`(mention-gated).
- `channels.mattermost.groupAllowFrom`으로 allowlist sender를 지정합니다(user ID 권장).
- `@username` matching은 mutable하며 `channels.mattermost.dangerouslyAllowNameMatching: true`일 때만 활성화됩니다.
- Open channels: `channels.mattermost.groupPolicy="open"`(mention-gated).
- runtime 참고: `channels.mattermost` 블록 전체가 없으면, `channels.defaults.groupPolicy`가 설정되어 있어도 group check는 `groupPolicy="allowlist"`로 fallback합니다.

## Targets for outbound delivery

`openclaw message send` 또는 cron/webhooks와 함께 다음 target 형식을 사용합니다.

- 채널은 `channel:<id>`
- DM은 `user:<id>`
- DM은 `@username`으로도 가능(Mattermost API로 resolve)

opaque ID만 단독으로 쓰는 것(예: `64ifufp...`)은 Mattermost에서 **ambiguous**합니다(user ID인지 channel ID인지 불분명).

OpenClaw는 이를 **user-first**로 resolve합니다.

- 해당 ID가 user로 존재하면(`GET /api/v4/users/<id>` 성공), OpenClaw는 `/api/v4/channels/direct`로 direct channel을 resolve해서 **DM**을 보냅니다.
- 그렇지 않으면 해당 ID를 **channel ID**로 처리합니다.

deterministic 동작이 필요하면 항상 explicit prefix(`user:<id>` / `channel:<id>`)를 사용하세요.

## Reactions (message tool)

- `channel=mattermost`로 `message action=react`를 사용합니다.
- `messageId`는 Mattermost post id입니다.
- `emoji`는 `thumbsup` 또는 `:+1:` 같은 이름을 받습니다(colon은 optional).
- reaction 제거는 `remove=true`(boolean)를 사용합니다.
- reaction add/remove event는 routed agent session으로 system event 형태로 전달됩니다.

Examples:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Config:

- `channels.mattermost.actions.reactions`: reaction action enable/disable(기본값 true).
- account별 override: `channels.mattermost.accounts.<id>.actions.reactions`.

## Interactive buttons (message tool)

클릭 가능한 버튼이 있는 메시지를 보낼 수 있습니다. 사용자가 버튼을 클릭하면 agent는 해당
선택을 입력으로 받아 응답할 수 있습니다.

버튼을 활성화하려면 channel capabilities에 `inlineButtons`를 추가하세요.

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

`buttons` parameter와 함께 `message action=send`를 사용합니다. Buttons는 2D array입니다(버튼 행 배열).

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

Button fields:

- `text` (required): 표시 라벨
- `callback_data` (required): 클릭 시 되돌아오는 값(action ID로 사용됨)
- `style` (optional): `"default"`, `"primary"`, `"danger"`

사용자가 버튼을 클릭하면:

1. 모든 버튼이 확인 문구로 대체됩니다(예: "✓ **Yes** selected by @user").
2. agent는 그 선택을 inbound message로 받아 응답합니다.

Notes:

- button callback은 HMAC-SHA256 검증을 사용합니다(자동, 별도 config 불필요).
- Mattermost는 API response에서 callback data를 제거하므로(보안 기능), 클릭 시 모든 버튼이 제거됩니다. 일부만 제거하는 것은 불가능합니다.
- hyphen 또는 underscore가 포함된 action ID는 자동으로 sanitize됩니다
  (Mattermost routing limitation).

Config:

- `channels.mattermost.capabilities`: capability string 배열. agent system prompt에 buttons tool 설명을 넣으려면 `"inlineButtons"`를 추가하세요.
- `channels.mattermost.interactions.callbackBaseUrl`: 버튼 callback용 optional external base URL(예: `https://gateway.example.com`). Mattermost가 bind host의 gateway에 직접 도달하지 못할 때 사용합니다.
- multi-account 구성에서는 같은 field를 `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl` 아래에도 둘 수 있습니다.
- `interactions.callbackBaseUrl`이 없으면 OpenClaw는 `gateway.customBindHost` + `gateway.port`로 callback URL을 유도하고, 그다음 `http://localhost:<port>`로 fallback합니다.
- reachability rule: button callback URL은 Mattermost server에서 도달 가능해야 합니다.
  `localhost`는 Mattermost와 OpenClaw가 같은 host/network namespace에서 실행될 때만 동작합니다.
- callback target이 private/tailnet/internal이라면 Mattermost
  `ServiceSettings.AllowedUntrustedInternalConnections`에 해당 host/domain을 추가하세요.

### Direct API integration (external scripts)

external script와 webhook은 agent의 `message` tool을 거치지 않고 Mattermost REST API로 버튼을 직접 게시할 수도 있습니다. 가능하면 extension의 `buildButtonAttachments()`를 사용하세요. raw JSON을 직접 보낼 때는 다음 규칙을 따르세요.

**Payload structure:**

```json5
{
  channel_id: "<channelId>",
  message: "Choose an option:",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // alphanumeric only — see below
            type: "button", // required, or clicks are silently ignored
            name: "Approve", // display label
            style: "primary", // optional: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // must match button id (for name lookup)
                action: "approve",
                // ... any custom fields ...
                _token: "<hmac>", // see HMAC section below
              },
            },
          },
        ],
      },
    ],
  },
}
```

**Critical rules:**

1. attachment는 top-level `attachments`가 아니라 `props.attachments`에 넣어야 합니다(그렇지 않으면 조용히 무시됨).
2. 모든 action에는 `type: "button"`이 필요합니다. 없으면 클릭이 조용히 무시됩니다.
3. 모든 action에는 `id` field가 필요합니다. Mattermost는 ID 없는 action을 무시합니다.
4. action `id`는 **영숫자만** 허용됩니다(`a-zA-Z0-9`). hyphen과 underscore는 Mattermost의 server-side action routing을 깨뜨려 `404`를 반환합니다. 사용 전에 제거하세요.
5. `context.action_id`는 button의 `id`와 일치해야 확인 메시지에 raw ID 대신 button 이름(예: "Approve")이 표시됩니다.
6. `context.action_id`는 필수입니다. 없으면 interaction handler가 `400`을 반환합니다.

**HMAC token generation:**

gateway는 HMAC-SHA256으로 button click을 검증합니다. external script는 gateway의 검증 로직과 일치하는 token을 생성해야 합니다.

1. bot token에서 secret을 유도합니다:
   `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
2. `_token`을 제외한 모든 field로 context object를 만듭니다.
3. **sorted keys**와 **공백 없는** 형태로 serialize합니다(gateway는 sorted key의 `JSON.stringify` 결과인 compact output을 사용함).
4. 서명합니다: `HMAC-SHA256(key=secret, data=serializedContext)`
5. 결과 hex digest를 context의 `_token`으로 추가합니다.

Python example:

```python
import hmac, hashlib, json

secret = hmac.new(
    b"openclaw-mattermost-interactions",
    bot_token.encode(), hashlib.sha256
).hexdigest()

ctx = {"action_id": "mybutton01", "action": "approve"}
payload = json.dumps(ctx, sort_keys=True, separators=(",", ":"))
token = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()

context = {**ctx, "_token": token}
```

Common HMAC pitfalls:

- Python의 `json.dumps`는 기본적으로 공백을 넣습니다(`{"key": "val"}`). JavaScript의 compact output(`{"key":"val"}`)과 맞추려면 `separators=(",", ":")`를 사용하세요.
- 항상 `_token`을 제외한 **모든** context field에 서명해야 합니다. gateway는 `_token`을 제거한 뒤 남은 전체 field에 서명합니다. 일부만 서명하면 조용히 검증에 실패합니다.
- `sort_keys=True`를 사용하세요. gateway는 서명 전에 key를 정렬하며, Mattermost가 payload를 저장할 때 context field 순서를 바꿀 수 있습니다.
- secret은 random bytes가 아니라 bot token으로부터 유도해야 합니다(deterministic). 버튼을 만드는 프로세스와 gateway 검증 측이 같은 secret을 써야 합니다.

## Directory adapter

Mattermost plugin에는 Mattermost API로 channel 이름과 user 이름을 resolve하는 directory adapter가 포함되어 있습니다. 이 덕분에 `openclaw message send`와 cron/webhook 전송에서 `#channel-name`과 `@username` target을 사용할 수 있습니다.

별도 설정은 필요하지 않습니다. adapter는 account config의 bot token을 사용합니다.

## Multi-account

Mattermost는 `channels.mattermost.accounts` 아래에서 여러 account를 지원합니다.

```json5
{
  channels: {
    mattermost: {
      accounts: {
        default: { name: "Primary", botToken: "mm-token", baseUrl: "https://chat.example.com" },
        alerts: { name: "Alerts", botToken: "mm-token-2", baseUrl: "https://alerts.example.com" },
      },
    },
  },
}
```

## Troubleshooting

- channel에서 reply가 없음: bot이 channel에 들어와 있는지 확인하고, mention(oncall), trigger prefix(onchar), 또는 `chatmode: "onmessage"` 설정을 점검하세요.
- auth 오류: bot token, base URL, account enable 상태를 확인하세요.
- multi-account 문제: env var는 `default` account에만 적용됩니다.
- 버튼이 하얀 상자로 보임: agent가 malformed button data를 보내고 있을 수 있습니다. 각 button에 `text`와 `callback_data`가 모두 있는지 확인하세요.
- 버튼이 렌더링되지만 클릭이 동작하지 않음: Mattermost server config의 `AllowedUntrustedInternalConnections`에 `127.0.0.1 localhost`가 포함되어 있는지, 그리고 `ServiceSettings`에서 `EnablePostActionIntegration`이 `true`인지 확인하세요.
- 버튼 클릭 시 `404`: button `id`에 hyphen이나 underscore가 들어 있을 가능성이 높습니다. Mattermost action router는 영숫자가 아닌 ID에서 깨집니다. `[a-zA-Z0-9]`만 사용하세요.
- gateway log에 `invalid _token`: HMAC mismatch입니다. 모든 context field에 서명했는지(일부만 아님), sorted key를 사용했는지, compact JSON(공백 없음)을 사용했는지 확인하세요. 위 HMAC 섹션을 참고하세요.
- gateway log에 `missing _token in context`: button의 context에 `_token` field가 없습니다. integration payload를 만들 때 포함되어 있는지 확인하세요.
- 확인 메시지에 button 이름 대신 raw ID가 보임: `context.action_id`가 button의 `id`와 일치하지 않습니다. 둘 다 같은 sanitize된 값으로 맞추세요.
- agent가 버튼을 인지하지 못함: Mattermost channel config에 `capabilities: ["inlineButtons"]`를 추가하세요.
