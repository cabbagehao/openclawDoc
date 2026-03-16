---
summary: "LINE Messaging API 플러그인 설정, 구성, 사용 방법"
read_when:
  - OpenClaw를 LINE에 연결하려고 할 때
  - LINE webhook과 credential 설정이 필요할 때
  - LINE 전용 메시지 옵션을 사용하려고 할 때
title: LINE
description: "LINE Messaging API plugin 설치, webhook 설정, 접근 제어, rich message 전송, troubleshooting 절차를 정리한 가이드입니다."
x-i18n:
  source_path: "channels/line.md"
---

# LINE (plugin)

LINE은 LINE Messaging API를 통해 OpenClaw에 연결됩니다. 이 plugin은 gateway에서
webhook receiver로 실행되며, authentication에는 channel access token과
channel secret을 사용합니다.

상태: plugin을 통해 지원됩니다. direct messages, group chats, media,
locations, Flex messages, template messages, quick replies를 지원합니다.
reactions와 threads는 지원하지 않습니다.

## Plugin 필요

LINE plugin을 설치하세요.

```bash
openclaw plugins install @openclaw/line
```

로컬 checkout으로 실행 중이라면:

```bash
openclaw plugins install ./extensions/line
```

## 설정

1. LINE Developers 계정을 만들고 Console을 엽니다:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Provider를 만들거나 선택한 뒤 **Messaging API** channel을 추가합니다.
3. channel settings에서 **Channel access token**과 **Channel secret**을 복사합니다.
4. Messaging API settings에서 **Use webhook**을 활성화합니다.
5. webhook URL을 gateway endpoint로 설정합니다(HTTPS 필수).

```text
https://gateway-host/line/webhook
```

gateway는 LINE의 webhook verification(GET)과 inbound events(POST)에 응답합니다.
custom path가 필요하면 `channels.line.webhookPath` 또는
`channels.line.accounts.<id>.webhookPath`를 설정하고 URL도 맞춰 변경하세요.

보안 참고:

- LINE signature verification은 raw body에 대한 body-dependent HMAC이므로,
  OpenClaw는 검증 전에 엄격한 pre-auth body limit와 timeout을 적용합니다.

## 구성

최소 구성:

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

환경 변수(기본 account만):

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

token/secret file:

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

`tokenFile`과 `secretFile`은 regular file이어야 합니다. symlink는 거부됩니다.

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

## 접근 제어

DM은 기본적으로 pairing을 사용합니다. 알 수 없는 sender는 pairing code를 받고,
승인 전까지 메시지는 무시됩니다.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Allowlist와 policy:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: DM용 allowlisted LINE user ID
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: group용 allowlisted LINE user ID
- 그룹별 override: `channels.line.groups.<groupId>.allowFrom`
- runtime 참고: `channels.line` 자체가 완전히 없으면, group check는
  `channels.defaults.groupPolicy`가 있더라도 `groupPolicy="allowlist"`로
  fallback합니다.

LINE ID는 대소문자를 구분합니다. 유효한 ID 예:

- User: `U` + 32 hex chars
- Group: `C` + 32 hex chars
- Room: `R` + 32 hex chars

## 메시지 동작

- 텍스트는 5000자 단위로 chunking됩니다.
- Markdown formatting은 제거됩니다. code block과 table은 가능하면 Flex card로
  변환됩니다.
- streaming response는 버퍼링되며, agent가 작업하는 동안 LINE은 loading
  animation과 함께 완성된 chunk를 받습니다.
- media download는 `channels.line.mediaMaxMb`(기본 10)로 제한됩니다.

## 채널 데이터(rich messages)

`channelData.line`을 사용해 quick replies, locations, Flex cards, template
messages를 보낼 수 있습니다.

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

```text
/card info "Welcome" "Thanks for joining!"
```

## 문제 해결

- **Webhook verification fails:** webhook URL이 HTTPS인지, `channelSecret`이
  LINE console과 일치하는지 확인하세요.
- **No inbound events:** webhook path가 `channels.line.webhookPath`와
  일치하는지, 그리고 gateway가 LINE에서 도달 가능한지 확인하세요.
- **Media download errors:** media가 기본 제한을 넘는다면
  `channels.line.mediaMaxMb`를 높이세요.
