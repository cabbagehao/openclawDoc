---
summary: "Mattermost 봇 설정 및 OpenClaw 구성"
read_when:
  - Mattermost 설정 중
  - Mattermost 라우팅 디버깅 중
title: "Mattermost"
---

# Mattermost (plugin)

상태: 플러그인으로 지원됨(봇 토큰 + WebSocket 이벤트). 채널, 그룹, DM을 지원합니다.
Mattermost는 자체 호스팅 가능한 팀 메시징 플랫폼입니다. 제품 세부 정보와 다운로드는
[mattermost.com](https://mattermost.com) 공식 사이트를 참고하세요.

## Plugin required

Mattermost는 플러그인 형태로 제공되며 코어 설치에 번들되어 있지 않습니다.

CLI로 설치(npm 레지스트리):

```bash
openclaw plugins install @openclaw/mattermost
```

로컬 체크아웃 사용 시(git 리포지토리에서 실행하는 경우):

```bash
openclaw plugins install ./extensions/mattermost
```

configure/onboarding 중 Mattermost를 선택했고 git 체크아웃이 감지되면,
OpenClaw가 로컬 설치 경로를 자동으로 제안합니다.

자세한 내용: [Plugins](/tools/plugin)

## Quick setup

1. Mattermost 플러그인을 설치합니다.
2. Mattermost 봇 계정을 만들고 **bot token**을 복사합니다.
3. Mattermost **base URL**을 복사합니다(예: `https://chat.example.com`).
4. OpenClaw를 구성하고 gateway를 시작합니다.

최소 구성:

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

네이티브 슬래시 명령은 opt-in 방식입니다. 활성화하면 OpenClaw가 Mattermost API를 통해
`oc_*` 슬래시 명령을 등록하고 gateway HTTP 서버에서 콜백 POST를 수신합니다.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Mattermost가 gateway에 직접 도달할 수 없을 때 사용합니다(리버스 프록시/공개 URL).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

참고:

- `native: "auto"`는 Mattermost에서 기본적으로 비활성화됩니다. 활성화하려면 `native: true`를 설정하세요.
- `callbackUrl`을 생략하면 OpenClaw가 gateway host/port + `callbackPath`에서 자동으로 유도합니다.
- 멀티 계정 구성에서는 `commands`를 최상위에 두거나
  `channels.mattermost.accounts.<id>.commands` 아래에 둘 수 있습니다(계정 값이 최상위 필드를 override함).
- 명령 콜백은 명령별 토큰으로 검증되며, 토큰 검사가 실패하면 fail closed 방식으로 거부됩니다.
- 도달 가능성 요구 사항: 콜백 엔드포인트는 Mattermost 서버에서 접근 가능해야 합니다.
  - Mattermost가 OpenClaw와 동일한 호스트/네트워크 네임스페이스에서 실행되지 않는 한 `callbackUrl`에 `localhost`를 설정하지 마세요.
  - 해당 URL이 `/api/channels/mattermost/command`를 OpenClaw로 reverse proxy하지 않는 한 `callbackUrl`을 Mattermost base URL로 설정하지 마세요.
  - 빠른 확인 방법은 `curl https://<gateway-host>/api/channels/mattermost/command`입니다. GET 요청은 `404`가 아니라 OpenClaw의 `405 Method Not Allowed`를 반환해야 합니다.
- Mattermost egress allowlist 요구 사항:
  - 콜백 대상이 private/tailnet/internal 주소라면 Mattermost의
    `ServiceSettings.AllowedUntrustedInternalConnections`에 콜백 host/domain을 포함하도록 설정하세요.
  - 전체 URL이 아니라 host/domain 항목을 사용하세요.
    - 올바름: `gateway.tailnet-name.ts.net`
    - 잘못됨: `https://gateway.tailnet-name.ts.net`

## Environment variables (default account)

환경 변수를 선호한다면 gateway 호스트에 다음을 설정하세요:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

환경 변수는 **default** 계정(`default`)에만 적용됩니다. 다른 계정은 반드시 config 값을 사용해야 합니다.

## Chat modes

Mattermost는 DM에는 자동으로 응답합니다. 채널 동작은 `chatmode`로 제어합니다:

- `oncall`(기본값): 채널에서는 @mention 되었을 때만 응답합니다.
- `onmessage`: 모든 채널 메시지에 응답합니다.
- `onchar`: 메시지가 트리거 prefix로 시작할 때 응답합니다.

구성 예시:

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

참고:

- `onchar`는 명시적인 @mention에도 계속 응답합니다.
- `channels.mattermost.requireMention`은 레거시 구성에서 존중되지만 `chatmode` 사용이 권장됩니다.

## Access control (DMs)

- 기본값: `channels.mattermost.dmPolicy = "pairing"`(알 수 없는 발신자는 pairing code를 받음).
- 승인 방법:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- 공개 DM: `channels.mattermost.dmPolicy="open"`과 `channels.mattermost.allowFrom=["*"]`를 함께 설정합니다.

## Channels (groups)

- 기본값: `channels.mattermost.groupPolicy = "allowlist"`(mention-gated).
- `channels.mattermost.groupAllowFrom`으로 허용 목록 발신자를 지정하세요(사용자 ID 권장).
- `@username` 매칭은 변경 가능성이 있으며 `channels.mattermost.dangerouslyAllowNameMatching: true`일 때만 활성화됩니다.
- 공개 채널: `channels.mattermost.groupPolicy="open"`(mention-gated).
- 런타임 참고: `channels.mattermost`가 완전히 누락되면, 런타임은 그룹 검사에서 `groupPolicy="allowlist"`로 fallback합니다(`channels.defaults.groupPolicy`가 설정되어 있어도 동일).

## Targets for outbound delivery

`openclaw message send` 또는 cron/webhooks와 함께 다음 target 형식을 사용하세요:

- 채널용 `channel:<id>`
- DM용 `user:<id>`
- DM용 `@username`(Mattermost API를 통해 resolve됨)

ID만 단독으로 쓰면 채널로 처리됩니다.

## Reactions (message tool)

- `channel=mattermost`와 함께 `message action=react`를 사용합니다.
- `messageId`는 Mattermost post id입니다.
- `emoji`에는 `thumbsup` 또는 `:+1:` 같은 이름을 사용할 수 있습니다(콜론은 선택 사항).
- 반응을 제거하려면 `remove=true`(boolean)를 설정합니다.
- 반응 추가/제거 이벤트는 라우팅된 agent session으로 시스템 이벤트 형태로 전달됩니다.

예시:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

구성:

- `channels.mattermost.actions.reactions`: reaction action 활성화/비활성화(기본값 true).
- 계정별 override: `channels.mattermost.accounts.<id>.actions.reactions`.

## Interactive buttons (message tool)

클릭 가능한 버튼이 포함된 메시지를 보낼 수 있습니다. 사용자가 버튼을 클릭하면 agent가
선택 내용을 받아 응답할 수 있습니다.

채널 capabilities에 `inlineButtons`를 추가해 버튼을 활성화하세요:

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

`buttons` 파라미터와 함께 `message action=send`를 사용합니다. 버튼은 2차원 배열입니다(버튼 행 배열):

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

버튼 필드:

- `text`(필수): 표시 라벨.
- `callback_data`(필수): 클릭 시 다시 전송되는 값(action ID로 사용).
- `style`(선택): `"default"`, `"primary"`, 또는 `"danger"`.

사용자가 버튼을 클릭하면:

1. 모든 버튼이 확인 줄로 대체됩니다(예: "✓ **Yes** selected by @user").
2. agent는 선택 내용을 inbound message로 받아 응답합니다.

참고:

- 버튼 콜백은 HMAC-SHA256 검증을 사용합니다(자동, 추가 설정 불필요).
- Mattermost는 API 응답에서 callback data를 제거합니다(보안 기능). 따라서 클릭 시 모든 버튼이 제거되며 일부만 제거하는 것은 불가능합니다.
- 하이픈 또는 밑줄이 포함된 action ID는 자동으로 sanitize됩니다
  (Mattermost 라우팅 제한).

구성:

- `channels.mattermost.capabilities`: capability 문자열 배열. agent system prompt에서
  버튼 도구 설명을 활성화하려면 `"inlineButtons"`를 추가하세요.
- `channels.mattermost.interactions.callbackBaseUrl`: 버튼 콜백용 선택적 외부 base URL
  (예: `https://gateway.example.com`). Mattermost가 bind host의 gateway에 직접 도달할 수 없을 때 사용합니다.
- 멀티 계정 구성에서는 동일한 필드를
  `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl` 아래에도 설정할 수 있습니다.
- `interactions.callbackBaseUrl`을 생략하면 OpenClaw는
  `gateway.customBindHost` + `gateway.port`에서 콜백 URL을 유도한 뒤, `http://localhost:<port>`로 fallback합니다.
- 도달 가능성 규칙: 버튼 콜백 URL은 Mattermost 서버에서 접근 가능해야 합니다.
  `localhost`는 Mattermost와 OpenClaw가 동일한 호스트/네트워크 네임스페이스에서 실행될 때만 동작합니다.
- 콜백 대상이 private/tailnet/internal이면 해당 host/domain을 Mattermost의
  `ServiceSettings.AllowedUntrustedInternalConnections`에 추가하세요.

### Direct API integration (external scripts)

외부 스크립트와 webhook은 agent의 `message` tool을 거치지 않고 Mattermost REST API로
직접 버튼을 게시할 수 있습니다. 가능하면 extension의 `buildButtonAttachments()`를 사용하고,
raw JSON을 게시한다면 다음 규칙을 따르세요:

**페이로드 구조:**

```json5
{
  channel_id: "<channelId>",
  message: "Choose an option:",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // 영숫자만 허용 — 아래 참고
            type: "button", // 필수, 없으면 클릭이 조용히 무시됨
            name: "Approve", // 표시 라벨
            style: "primary", // 선택: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // 버튼 id와 일치해야 이름 조회 가능
                action: "approve",
                // ... any custom fields ...
                _token: "<hmac>", // 아래 HMAC 섹션 참고
              },
            },
          },
        ],
      },
    ],
  },
}
```

**중요 규칙:**

1. attachments는 최상위 `attachments`가 아니라 `props.attachments`에 넣어야 합니다(그렇지 않으면 조용히 무시됨).
2. 모든 action에는 `type: "button"`이 필요합니다. 없으면 클릭이 조용히 삼켜집니다.
3. 모든 action에는 `id` 필드가 필요합니다. Mattermost는 ID 없는 action을 무시합니다.
4. action `id`는 반드시 **영숫자만** 허용됩니다(`[a-zA-Z0-9]`). 하이픈과 밑줄은 Mattermost의 서버 측 action routing을 깨뜨려 404를 반환합니다. 사용 전에 제거하세요.
5. 확인 메시지에 원시 ID가 아닌 버튼 이름(예: "Approve")이 표시되도록 `context.action_id`는 버튼의 `id`와 일치해야 합니다.
6. `context.action_id`는 필수입니다. 없으면 interaction handler가 400을 반환합니다.

**HMAC token generation:**

gateway는 HMAC-SHA256으로 버튼 클릭을 검증합니다. 외부 스크립트는 gateway의 검증 로직과
일치하는 토큰을 생성해야 합니다:

1. 봇 토큰에서 secret을 유도합니다:
   `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
2. `_token`을 제외한 모든 필드를 포함해 context object를 만듭니다.
3. **정렬된 키**와 **공백 없는 형식**으로 serialize합니다(gateway는 정렬된 키에 대해 `JSON.stringify`를 사용하며 compact output을 생성함).
4. 서명합니다: `HMAC-SHA256(key=secret, data=serializedContext)`
5. 결과 hex digest를 context의 `_token`으로 추가합니다.

Python 예시:

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

일반적인 HMAC 함정:

- Python의 `json.dumps`는 기본적으로 공백을 추가합니다(`{"key": "val"}`). JavaScript의 compact output(`{"key":"val"}`)에 맞추려면 `separators=(",", ":")`를 사용하세요.
- 항상 **모든** context 필드(`_token` 제외)에 서명해야 합니다. gateway는 `_token`을 제거한 뒤 나머지 전체에 서명합니다. 일부만 서명하면 조용히 검증이 실패합니다.
- `sort_keys=True`를 사용하세요. gateway는 서명 전에 키를 정렬하며, Mattermost가 payload 저장 시 context 필드 순서를 바꿀 수 있습니다.
- 무작위 바이트가 아니라 봇 토큰에서 secret을 유도하세요(결정적). 버튼을 생성하는 프로세스와 검증하는 gateway에서 동일한 secret이어야 합니다.

## Directory adapter

Mattermost 플러그인에는 Mattermost API를 통해 채널명과 사용자명을 resolve하는 directory adapter가 포함되어 있습니다.
이를 통해 `openclaw message send`와 cron/webhook 전달에서 `#channel-name` 및 `@username`
target을 사용할 수 있습니다.

추가 설정은 필요 없습니다. adapter는 계정 config의 봇 토큰을 사용합니다.

## Multi-account

Mattermost는 `channels.mattermost.accounts` 아래에서 여러 계정을 지원합니다:

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

- 채널에서 응답이 없음: 봇이 채널에 들어와 있는지 확인하고, mention(oncall)하거나 트리거 prefix(onchar)를 사용하거나 `chatmode: "onmessage"`를 설정하세요.
- 인증 오류: 봇 토큰, base URL, 계정 활성화 여부를 확인하세요.
- 멀티 계정 문제: 환경 변수는 `default` 계정에만 적용됩니다.
- 버튼이 흰 상자로 표시됨: agent가 잘못된 버튼 데이터를 보내고 있을 수 있습니다. 각 버튼에 `text`와 `callback_data` 필드가 모두 있는지 확인하세요.
- 버튼은 렌더링되지만 클릭해도 아무 동작이 없음: Mattermost 서버 구성의 `AllowedUntrustedInternalConnections`에 `127.0.0.1 localhost`가 포함되어 있는지, `ServiceSettings`에서 `EnablePostActionIntegration`이 `true`인지 확인하세요.
- 버튼 클릭 시 404 반환: 버튼 `id`에 하이픈 또는 밑줄이 포함되었을 가능성이 큽니다. Mattermost의 action router는 영숫자가 아닌 ID에서 깨집니다. `[a-zA-Z0-9]`만 사용하세요.
- Gateway 로그에 `invalid _token`: HMAC 불일치입니다. 모든 context 필드(일부가 아니라 전체)에 서명하는지, 키를 정렬하는지, compact JSON(공백 없음)을 사용하는지 확인하세요. 위의 HMAC 섹션을 참고하세요.
- Gateway 로그에 `missing _token in context`: `_token` 필드가 버튼의 context에 없습니다. integration payload를 만들 때 포함했는지 확인하세요.
- 확인 메시지에 버튼 이름 대신 원시 ID가 표시됨: `context.action_id`가 버튼의 `id`와 일치하지 않습니다. 둘 다 동일한 sanitize된 값으로 설정하세요.
- agent가 버튼을 인지하지 못함: Mattermost 채널 config에 `capabilities: ["inlineButtons"]`를 추가하세요.
