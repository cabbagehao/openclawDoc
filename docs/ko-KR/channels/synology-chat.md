---
summary: "Synology Chat webhook 설정과 OpenClaw 구성"
read_when:
  - Synology Chat을 OpenClaw와 설정할 때
  - Synology Chat webhook 라우팅을 디버깅할 때
title: "Synology Chat"
description: "Synology Chat plugin의 webhook 설정, DM 접근 제어, outbound delivery, multi-account 구성과 보안 주의사항을 설명합니다."
x-i18n:
  source_path: "channels/synology-chat.md"
---

# Synology Chat (plugin)

상태: Synology Chat webhook을 사용하는 direct-message 채널 plugin으로
지원됩니다. 이 plugin은 Synology Chat outgoing webhook에서 inbound message를
받고, Synology Chat incoming webhook을 통해 reply를 보냅니다.

## Plugin 필요

Synology Chat은 plugin 기반이며 기본 core channel install에는 포함되지 않습니다.

로컬 checkout에서 설치:

```bash
openclaw plugins install ./extensions/synology-chat
```

자세한 내용: [Plugins](/tools/plugin)

## 빠른 설정

1. Synology Chat plugin을 설치하고 활성화합니다.
2. Synology Chat integrations에서:
   - incoming webhook을 만들고 URL을 복사합니다.
   - secret token이 포함된 outgoing webhook을 만듭니다.
3. outgoing webhook URL을 OpenClaw gateway로 지정합니다.
   - 기본값: `https://gateway-host/webhook/synology`
   - 또는 사용자 지정 `channels.synology-chat.webhookPath`
4. OpenClaw에서 `channels.synology-chat`을 설정합니다.
5. gateway를 재시작하고 Synology Chat bot에게 DM을 보냅니다.

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

## 환경 변수

기본 account에는 env var를 사용할 수 있습니다.

- `SYNOLOGY_CHAT_TOKEN`
- `SYNOLOGY_CHAT_INCOMING_URL`
- `SYNOLOGY_NAS_HOST`
- `SYNOLOGY_ALLOWED_USER_IDS` (comma-separated)
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

config 값이 env var보다 우선합니다.

## DM policy와 접근 제어

- `dmPolicy: "allowlist"`가 권장 기본값입니다.
- `allowedUserIds`는 Synology user ID list(또는 comma-separated string)를
  받습니다.
- `allowlist` 모드에서 비어 있는 `allowedUserIds`는 misconfiguration으로
  간주되며 webhook route가 시작되지 않습니다(모두 허용하려면
  `dmPolicy: "open"` 사용).
- `dmPolicy: "open"`은 모든 sender를 허용합니다.
- `dmPolicy: "disabled"`는 DM을 차단합니다.
- pairing approval도 동작합니다:
  - `openclaw pairing list synology-chat`
  - `openclaw pairing approve synology-chat <CODE>`

## Outbound delivery

대상에는 numeric Synology Chat user ID를 사용합니다.

예시:

```bash
openclaw message send --channel synology-chat --target 123456 --text "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --text "Hello again"
```

media send는 URL 기반 파일 전송으로 지원됩니다.

## Multi-account

여러 Synology Chat account를 `channels.synology-chat.accounts` 아래에서 지원합니다.
각 account는 token, incoming URL, webhook path, DM policy, limit를 override할 수
있습니다.

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

## 보안 참고

- `token`은 비밀로 유지하고 유출되면 교체하세요.
- self-signed local NAS cert를 명시적으로 신뢰하는 경우가 아니면
  `allowInsecureSsl: false`를 유지하세요.
- inbound webhook request는 token 검증과 sender별 rate limit가 적용됩니다.
- 운영 환경에는 `dmPolicy: "allowlist"`를 권장합니다.
