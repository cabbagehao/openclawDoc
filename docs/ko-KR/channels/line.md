---
summary: "LINE Messaging API plugin 설정, 구성, 사용법"
read_when:
  - OpenClaw를 LINE에 연결하고 싶을 때
  - LINE webhook + credential 설정이 필요할 때
  - LINE 전용 메시지 옵션을 쓰고 싶을 때
title: LINE
---

# LINE (plugin)

LINE은 LINE Messaging API를 통해 OpenClaw에 연결됩니다. 이 plugin은 gateway에서 webhook receiver로 동작하며, channel access token + channel secret으로 인증합니다.

상태: plugin으로 지원됩니다. direct message, group chat, media, location, Flex message, template message, quick reply를 지원합니다. reaction과 thread는 지원하지 않습니다.

## Plugin required

LINE plugin 설치:

```bash
openclaw plugins install @openclaw/line
```

로컬 체크아웃(git repo에서 실행 중일 때):

```bash
openclaw plugins install ./extensions/line
```

## Setup

1. LINE Developers 계정을 만들고 Console을 엽니다:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Provider를 만들거나 선택한 뒤 **Messaging API** channel을 추가합니다.
3. channel 설정에서 **Channel access token**과 **Channel secret**을 복사합니다.
4. Messaging API 설정에서 **Use webhook**을 활성화합니다.
5. webhook URL을 gateway endpoint로 설정합니다(HTTPS 필수).

```
https://gateway-host/line/webhook
```

gateway는 LINE의 webhook verification(GET)과 inbound event(POST)를 처리합니다.
커스텀 경로가 필요하면 `channels.line.webhookPath` 또는 `channels.line.accounts.<id>.webhookPath`를 설정하고 URL도 그에 맞게 갱신하세요.

보안 참고:

- LINE signature 검증은 body 의존적(raw body에 대한 HMAC)이므로, OpenClaw는 검증 전에 엄격한 pre-auth body limit와 timeout을 적용합니다.

## Configure

최소 설정:

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "LINE_CHANNEL_ACCESS_TOKEN",
      channelSecret: "LINE_CHANNEL_SECRET",
      dmPolicy: "pairing",
    },
  },
}
```

Env var(기본 account 전용):

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

token/secret 파일:

```json5
{
  channels: {
    line: {
      tokenFile: "/path/to/line-token.txt",
      secretFile: "/path/to/line-secret.txt",
    },
  },
}
```

여러 account:

```json5
{
  channels: {
    line: {
      accounts: {
        marketing: {
          channelAccessToken: "...",
          channelSecret: "...",
          webhookPath: "/line/marketing",
        },
      },
    },
  },
}
```

## Access control

DM 기본 정책은 pairing입니다. 알 수 없는 발신자는 pairing code를 받고, 승인되기 전까지 메시지는 무시됩니다.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Allowlist와 정책:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: DM용 allowlist LINE user ID
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: group용 allowlist LINE user ID
- group별 override: `channels.line.groups.<groupId>.allowFrom`
- 런타임 참고: `channels.line`이 완전히 비어 있으면, `channels.defaults.groupPolicy`가 설정되어 있어도 group 검사에는 `groupPolicy="allowlist"`가 fallback 됩니다.

LINE ID는 대소문자를 구분합니다. 유효한 형식:

- User: `U` + 32 hex chars
- Group: `C` + 32 hex chars
- Room: `R` + 32 hex chars

## Message behavior

- 텍스트는 5000자로 chunking됩니다.
- Markdown formatting은 제거되며, 가능할 경우 code block과 table은 Flex card로 변환됩니다.
- streaming 응답은 버퍼링됩니다. agent가 작업하는 동안 LINE에는 loading animation과 함께 완성된 chunk만 전송됩니다.
- media download는 `channels.line.mediaMaxMb`(기본값 10)로 제한됩니다.

## Channel data (rich messages)

`channelData.line`을 사용하면 quick reply, location, Flex card, template message를 보낼 수 있습니다.

```json5
{
  text: "Here you go",
  channelData: {
    line: {
      quickReplies: ["Status", "Help"],
      location: {
        title: "Office",
        address: "123 Main St",
        latitude: 35.681236,
        longitude: 139.767125,
      },
      flexMessage: {
        altText: "Status card",
        contents: {
          /* Flex payload */
        },
      },
      templateMessage: {
        type: "confirm",
        text: "Proceed?",
        confirmLabel: "Yes",
        confirmData: "yes",
        cancelLabel: "No",
        cancelData: "no",
      },
    },
  },
}
```

LINE plugin에는 Flex message preset용 `/card` 명령도 포함되어 있습니다.

```
/card info "Welcome" "Thanks for joining!"
```

## Troubleshooting

- **Webhook verification fails:** webhook URL이 HTTPS인지, `channelSecret`이 LINE console 값과 일치하는지 확인하세요.
- **No inbound events:** webhook path가 `channels.line.webhookPath`와 일치하는지, gateway가 LINE에서 접근 가능한지 확인하세요.
- **Media download errors:** media가 기본 한도를 넘는다면 `channels.line.mediaMaxMb`를 올리세요.
