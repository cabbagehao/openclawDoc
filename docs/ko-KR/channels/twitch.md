---
summary: "Twitch chat bot 설정과 초기 구성"
read_when:
  - OpenClaw에 Twitch chat integration을 설정할 때
title: "Twitch"
description: "Twitch plugin 설치, bot 계정 토큰 발급, access control, token refresh, multi-account 설정과 troubleshooting 방법을 정리합니다."
x-i18n:
  source_path: "channels/twitch.md"
---

# Twitch (plugin)

Twitch chat은 IRC 연결을 통해 지원됩니다. OpenClaw는 Twitch user(bot account)로
연결되어 channel에서 메시지를 받고 보냅니다.

## Plugin 필요

Twitch는 plugin으로 제공되며 core install에 번들되어 있지 않습니다.

CLI 설치(npm registry):

```bash
openclaw plugins install @openclaw/twitch
```

로컬 checkout:

```bash
openclaw plugins install ./extensions/twitch
```

자세한 내용: [Plugins](/tools/plugin)

## 빠른 설정(beginner)

1. bot용 전용 Twitch 계정을 만들거나 기존 계정을 사용합니다.
2. credential 생성: [Twitch Token Generator](https://twitchtokengenerator.com/)
   - **Bot Token** 선택
   - `chat:read`, `chat:write` scope가 선택됐는지 확인
   - **Client ID**와 **Access Token** 복사
3. Twitch user ID 찾기:
   [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/)
4. token 설정:
   - Env: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (default account only)
   - 또는 config: `channels.twitch.accessToken`
   - 둘 다 있으면 config가 우선합니다(env fallback은 default account 전용).
5. gateway 시작

**⚠️ 중요:** 승인되지 않은 사용자가 bot을 트리거하지 못하게 access control
(`allowFrom` 또는 `allowedRoles`)을 설정하세요. `requireMention` 기본값은
`true`입니다.

최소 구성:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // Bot's Twitch account
      accessToken: "oauth:abc123...", // OAuth Access Token (or use OPENCLAW_TWITCH_ACCESS_TOKEN env var)
      clientId: "xyz789...", // Client ID from Token Generator
      channel: "vevisk", // Which Twitch channel's chat to join (required)
      allowFrom: ["123456789"], // (recommended) Your Twitch user ID only - get it from https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/
    },
  },
}
```

## 이것이 의미하는 것

- Gateway가 소유하는 Twitch channel integration
- 결정론적 라우팅: reply는 항상 Twitch로 돌아감
- 각 account는 격리된 session key `agent:<agentId>:twitch:<accountName>`에 매핑
- `username`은 인증하는 bot account, `channel`은 join할 chat room

## 설정(상세)

### Credential 생성

[Twitch Token Generator](https://twitchtokengenerator.com/) 사용:

- **Bot Token** 선택
- `chat:read`, `chat:write` scope 확인
- **Client ID**와 **Access Token** 복사

수동 app 등록은 필요 없습니다. token은 몇 시간 후 만료됩니다.

### bot 구성

**Env var (default account only):**

```bash
OPENCLAW_TWITCH_ACCESS_TOKEN=oauth:abc123...
```

**또는 config:**

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw",
      accessToken: "oauth:abc123...",
      clientId: "xyz789...",
      channel: "vevisk",
    },
  },
}
```

env와 config가 모두 있으면 config가 우선합니다.

### 접근 제어(권장)

```json5
{
  channels: {
    twitch: {
      allowFrom: ["123456789"], // (recommended) Your Twitch user ID only
    },
  },
}
```

강한 allowlist가 필요하면 `allowFrom`을 권장합니다. role 기반 access가
필요하면 대신 `allowedRoles`를 사용하세요.

**가능한 역할:** `"moderator"`, `"owner"`, `"vip"`, `"subscriber"`, `"all"`.

**왜 user ID인가?** username은 바뀔 수 있어 impersonation 위험이 있습니다.
user ID는 영구적입니다.

Twitch user ID 찾기:
[https://www.streamweasels.com/tools/convert-twitch-username-%20to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-%20to-user-id/)

## Token refresh (선택)

[Twitch Token Generator](https://twitchtokengenerator.com/)에서 만든 token은
자동 갱신할 수 없습니다. 만료되면 다시 생성하세요.

자동 token refresh가 필요하면
[Twitch Developer Console](https://dev.twitch.tv/console)에서 직접 app을 만들고
config에 추가하세요.

```json5
{
  channels: {
    twitch: {
      clientSecret: "your_client_secret",
      refreshToken: "your_refresh_token",
    },
  },
}
```

bot은 만료 전에 token을 자동 갱신하고 refresh event를 로그에 남깁니다.

## Multi-account 지원

`channels.twitch.accounts`를 사용하면 account별 token을 설정할 수 있습니다.
공통 패턴은 [`gateway/configuration`](/gateway/configuration)을 참고하세요.

예시(하나의 bot account로 두 channel 참가):

```json5
{
  channels: {
    twitch: {
      accounts: {
        channel1: {
          username: "openclaw",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "vevisk",
        },
        channel2: {
          username: "openclaw",
          accessToken: "oauth:def456...",
          clientId: "uvw012...",
          channel: "secondchannel",
        },
      },
    },
  },
}
```

**참고:** 각 account는 자기 channel용 token이 필요합니다.

## 접근 제어

### Role-based restriction

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          allowedRoles: ["moderator", "vip"],
        },
      },
    },
  },
}
```

### User ID allowlist (가장 안전)

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          allowFrom: ["123456789", "987654321"],
        },
      },
    },
  },
}
```

### Role-based access (대안)

`allowFrom`은 강한 allowlist입니다. 설정되면 그 user ID만 허용됩니다.
role 기반 access가 필요하면 `allowFrom`을 비워 두고 `allowedRoles`만
설정하세요.

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          allowedRoles: ["moderator"],
        },
      },
    },
  },
}
```

### @mention 요구 비활성화

기본적으로 `requireMention`은 `true`입니다. 모든 메시지에 응답하게 하려면:

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          requireMention: false,
        },
      },
    },
  },
}
```

## 문제 해결

먼저 진단 명령을 실행하세요.

```bash
openclaw doctor
openclaw channels status --probe
```

### bot이 메시지에 응답하지 않을 때

**접근 제어 확인:** user ID가 `allowFrom`에 있는지 확인하거나, 테스트를 위해
일시적으로 `allowFrom`을 제거하고 `allowedRoles: ["all"]`을 설정하세요.

**bot이 channel에 있는지 확인:** bot은 `channel`에 지정된 chat room에 join되어
있어야 합니다.

### Token 문제

**"Failed to connect" 또는 authentication error:**

- `accessToken`이 OAuth access token 값인지 확인
  (보통 `oauth:` prefix 포함)
- token에 `chat:read`, `chat:write` scope가 있는지 확인
- token refresh를 쓴다면 `clientSecret`, `refreshToken`이 설정됐는지 확인

### Token refresh가 동작하지 않을 때

**refresh event 로그 확인:**

```
Using env token source for mybot
Access token refreshed for user 123456 (expires in 14400s)
```

"token refresh disabled (no refresh token)"가 보인다면:

- `clientSecret` 제공 여부 확인
- `refreshToken` 제공 여부 확인

## Config

**Account config:**

- `username` - Bot username
- `accessToken` - `chat:read`, `chat:write`를 가진 OAuth access token
- `clientId` - Twitch Client ID
- `channel` - join할 channel (필수)
- `enabled` - account 활성화 (기본 `true`)
- `clientSecret` - 선택: 자동 token refresh
- `refreshToken` - 선택: 자동 token refresh
- `expiresIn` - token 만료까지 남은 초
- `obtainmentTimestamp` - token 발급 시각
- `allowFrom` - user ID allowlist
- `allowedRoles` - role 기반 접근 제어
  (`"moderator" | "owner" | "vip" | "subscriber" | "all"`)
- `requireMention` - @mention 요구 (기본 `true`)

**Provider option:**

- `channels.twitch.enabled` - 채널 시작 활성화/비활성화
- `channels.twitch.username` - Bot username (single-account 간소 구성)
- `channels.twitch.accessToken` - OAuth access token
- `channels.twitch.clientId` - Twitch Client ID
- `channels.twitch.channel` - join할 channel
- `channels.twitch.accounts.<accountName>` - multi-account 구성

전체 예시:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw",
      accessToken: "oauth:abc123...",
      clientId: "xyz789...",
      channel: "vevisk",
      clientSecret: "secret123...",
      refreshToken: "refresh456...",
      allowFrom: ["123456789"],
      allowedRoles: ["moderator", "vip"],
      accounts: {
        default: {
          username: "mybot",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "your_channel",
          enabled: true,
          clientSecret: "secret123...",
          refreshToken: "refresh456...",
          expiresIn: 14400,
          obtainmentTimestamp: 1706092800000,
          allowFrom: ["123456789", "987654321"],
          allowedRoles: ["moderator"],
        },
      },
    },
  },
}
```

## Tool actions

agent는 `twitch` action을 호출할 수 있습니다.

- `send` - channel에 메시지 전송

예시:

```json5
{
  action: "twitch",
  params: {
    message: "Hello Twitch!",
    to: "#mychannel",
  },
}
```

## Safety & ops

- **token은 비밀번호처럼 취급** - git에 커밋하지 마세요
- **장기 실행 bot에는 자동 token refresh 사용**
- **접근 제어는 username보다 user ID allowlist 권장**
- **token refresh event와 connection status를 logs로 모니터링**
- **token scope 최소화** - `chat:read`, `chat:write`만 요청
- **막혔을 때:** 다른 process가 session을 잡고 있지 않은지 확인한 뒤 gateway 재시작

## Limits

- 메시지당 **500자** (단어 경계에서 자동 chunking)
- Markdown은 chunking 전에 제거
- 별도 rate limiting 없음(Twitch 기본 rate limit 사용)
