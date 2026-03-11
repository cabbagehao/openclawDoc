---
summary: "Synology Chat webhook 설정과 OpenClaw 구성"
read_when:
  - OpenClaw 와 함께 Synology Chat 을 설정할 때
  - Synology Chat webhook 라우팅을 디버깅할 때
title: "Synology Chat"
---

# Synology Chat (plugin)

상태: Synology Chat webhook 을 사용하는 direct-message 채널용 plugin 으로 지원됩니다.
이 plugin 은 Synology Chat outgoing webhook 의 인바운드 메시지를 받고,
Synology Chat incoming webhook 을 통해 답장을 전송합니다.

## Plugin required

Synology Chat 은 plugin 기반이며 기본 core channel 설치에는 포함되지 않습니다.

로컬 checkout 에서 설치:

```bash
openclaw plugins install ./extensions/synology-chat
```

자세한 내용: [Plugins](/tools/plugin)

## Quick setup

1. Synology Chat plugin 을 설치하고 활성화합니다.
2. Synology Chat integration 에서:
   - incoming webhook 을 만들고 URL 을 복사합니다.
   - secret token 이 있는 outgoing webhook 을 만듭니다.
3. outgoing webhook URL 을 OpenClaw gateway 로 지정합니다:
   - 기본값: `https://gateway-host/webhook/synology`
   - 또는 사용자 정의 `channels.synology-chat.webhookPath`
4. OpenClaw 의 `channels.synology-chat` 를 구성합니다.
5. gateway 를 재시작하고 Synology Chat bot 에 DM 을 보내세요.

최소 구성:

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      token: "synology-outgoing-token",
      incomingUrl: "https://nas.example.com/webapi/entry.cgi?api=SYNO.Chat.External&method=incoming&version=2&token=...",
      webhookPath: "/webhook/synology",
      dmPolicy: "allowlist",
      allowedUserIds: ["123456"],
      rateLimitPerMinute: 30,
      allowInsecureSsl: false,
    },
  },
}
```

## Environment variables

default account 의 경우 다음 env var 를 사용할 수 있습니다:

- `SYNOLOGY_CHAT_TOKEN`
- `SYNOLOGY_CHAT_INCOMING_URL`
- `SYNOLOGY_NAS_HOST`
- `SYNOLOGY_ALLOWED_USER_IDS` (comma-separated)
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

config 값이 env var 를 override 합니다.

## DM policy and access control

- `dmPolicy: "allowlist"` 가 권장 기본값입니다.
- `allowedUserIds` 는 Synology 사용자 ID 목록(또는 comma-separated string)을 받습니다.
- `allowlist` 모드에서 빈 `allowedUserIds` 목록은 misconfiguration 으로 간주되며 webhook route 가 시작되지 않습니다(모두 허용하려면 `dmPolicy: "open"` 사용).
- `dmPolicy: "open"` 은 모든 발신자를 허용합니다.
- `dmPolicy: "disabled"` 는 DM 을 차단합니다.
- pairing approval 은 다음과 함께 동작합니다:
  - `openclaw pairing list synology-chat`
  - `openclaw pairing approve synology-chat <CODE>`

## Outbound delivery

대상에는 숫자형 Synology Chat 사용자 ID 를 사용하세요.

예시:

```bash
openclaw message send --channel synology-chat --target 123456 --text "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --text "Hello again"
```

미디어 전송은 URL 기반 파일 전달로 지원됩니다.

## Multi-account

여러 Synology Chat account 는 `channels.synology-chat.accounts` 아래에서 지원됩니다.
각 account 는 token, incoming URL, webhook path, DM policy, limits 를 override 할 수 있습니다.

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      accounts: {
        default: {
          token: "token-a",
          incomingUrl: "https://nas-a.example.com/...token=...",
        },
        alerts: {
          token: "token-b",
          incomingUrl: "https://nas-b.example.com/...token=...",
          webhookPath: "/webhook/synology-alerts",
          dmPolicy: "allowlist",
          allowedUserIds: ["987654"],
        },
      },
    },
  },
}
```

## Security notes

- `token` 은 비밀로 유지하고 유출 시 회전하세요.
- self-signed local NAS cert 를 명시적으로 신뢰하는 경우가 아니라면 `allowInsecureSsl: false` 를 유지하세요.
- 인바운드 webhook 요청은 token 검증과 sender 별 rate limit 이 적용됩니다.
- 운영 환경에서는 `dmPolicy: "allowlist"` 를 권장합니다.
