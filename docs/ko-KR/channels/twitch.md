---
summary: "Twitch 채팅 봇 구성 및 설정"
read_when:
  - OpenClaw용 Twitch 채팅 통합을 설정할 때
title: "Twitch"
---

# Twitch (plugin)

IRC 연결을 통한 Twitch 채팅 지원입니다. OpenClaw는 Twitch 사용자(봇 계정)로 연결되어 채널에서 메시지를 수신하고 전송합니다.

## Plugin required

Twitch는 플러그인으로 제공되며 코어 설치에 번들되어 있지 않습니다.

CLI로 설치(npm 레지스트리):

```bash
openclaw plugins install @openclaw/twitch
```

로컬 체크아웃 사용 시(git 저장소에서 실행하는 경우):

```bash
openclaw plugins install ./extensions/twitch
```

자세한 내용: [Plugins](/tools/plugin)

## Quick setup (beginner)

1. 봇 전용 Twitch 계정을 만들거나(또는 기존 계정을 사용합니다).
2. 자격 증명을 생성합니다: [Twitch Token Generator](https://twitchtokengenerator.com/)
   - **Bot Token**을 선택합니다
   - `chat:read` 및 `chat:write` 스코프가 선택되어 있는지 확인합니다
   - **Client ID**와 **Access Token**을 복사합니다
3. Twitch 사용자 ID를 찾습니다: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/)
4. 토큰을 구성합니다:
   - Env: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (기본 계정만 해당)
   - 또는 config: `channels.twitch.accessToken`
   - 둘 다 설정되어 있으면 config가 우선하며(env는 기본 계정용 폴백임), config가 우선합니다.
5. 게이트웨이를 시작합니다.

**⚠️ 중요:** 승인되지 않은 사용자가 봇을 트리거하지 못하도록 접근 제어(`allowFrom` 또는 `allowedRoles`)를 추가하세요. `requireMention`의 기본값은 `true`입니다.

최소 구성:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // 봇의 Twitch 계정
      accessToken: "oauth:abc123...", // OAuth Access Token(또는 OPENCLAW_TWITCH_ACCESS_TOKEN env var 사용)
      clientId: "xyz789...", // Token Generator에서 받은 Client ID
      channel: "vevisk", // 참여할 Twitch 채널의 채팅(필수)
      allowFrom: ["123456789"], // (권장) 본인 Twitch 사용자 ID만 허용 - https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/ 에서 확인
    },
  },
}
```

## What it is

- Gateway가 소유하는 Twitch 채널입니다.
- 결정적 라우팅: 응답은 항상 Twitch로 돌아갑니다.
- 각 계정은 격리된 세션 키 `agent:<agentId>:twitch:<accountName>`에 매핑됩니다.
- `username`은 봇의 계정(인증에 사용됨)이고, `channel`은 참여할 채팅방입니다.

## Setup (detailed)

### Generate credentials

[Twitch Token Generator](https://twitchtokengenerator.com/)를 사용합니다:

- **Bot Token**을 선택합니다
- `chat:read` 및 `chat:write` 스코프가 선택되어 있는지 확인합니다
- **Client ID**와 **Access Token**을 복사합니다

수동 앱 등록은 필요하지 않습니다. 토큰은 몇 시간 후 만료됩니다.

### Configure the bot

**Env var (기본 계정만 해당):**

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

env와 config가 모두 설정되어 있으면 config가 우선합니다.

### Access control (recommended)

```json5
{
  channels: {
    twitch: {
      allowFrom: ["123456789"], // (권장) 본인 Twitch 사용자 ID만 허용
    },
  },
}
```

강한 허용 목록이 필요하면 `allowFrom`을 권장합니다. 역할 기반 접근이 필요하면 대신 `allowedRoles`를 사용하세요.

**사용 가능한 역할:** `"moderator"`, `"owner"`, `"vip"`, `"subscriber"`, `"all"`.

**왜 사용자 ID인가요?** 사용자명은 바뀔 수 있어 사칭을 허용할 수 있습니다. 사용자 ID는 영구적입니다.

Twitch 사용자 ID 찾기: [https://www.streamweasels.com/tools/convert-twitch-username-%20to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-%20to-user-id/) (Twitch 사용자명을 ID로 변환)

## Token refresh (optional)

[Twitch Token Generator](https://twitchtokengenerator.com/)에서 만든 토큰은 자동 갱신할 수 없습니다. 만료되면 다시 생성하세요.

자동 토큰 갱신이 필요하면 [Twitch Developer Console](https://dev.twitch.tv/console)에서 직접 Twitch 애플리케이션을 만들고 다음을 config에 추가하세요:

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

봇은 만료 전에 토큰을 자동 갱신하고, 갱신 이벤트를 로그에 남깁니다.

## Multi-account support

계정별 토큰을 사용하려면 `channels.twitch.accounts`를 사용하세요. 공통 패턴은 [`gateway/configuration`](/gateway/configuration)을 참고하세요.

예시(하나의 봇 계정이 두 채널에 참여):

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

**참고:** 각 계정에는 자체 토큰이 필요합니다(채널당 토큰 1개).

## Access control

### Role-based restrictions

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

### Allowlist by User ID (most secure)

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

### Role-based access (alternative)

`allowFrom`은 강한 허용 목록입니다. 설정되면 해당 사용자 ID만 허용됩니다.
역할 기반 접근을 원하면 `allowFrom`은 설정하지 말고 대신 `allowedRoles`를 구성하세요:

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

### Disable @mention requirement

기본적으로 `requireMention`은 `true`입니다. 이를 비활성화해 모든 메시지에 응답하려면:

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

## Troubleshooting

먼저 진단 명령을 실행하세요:

```bash
openclaw doctor
openclaw channels status --probe
```

### Bot doesn't respond to messages

**접근 제어 확인:** 사용자 ID가 `allowFrom`에 들어 있는지 확인하거나, 테스트를 위해
`allowFrom`을 제거하고 `allowedRoles: ["all"]`로 설정하세요.

**봇이 채널에 들어와 있는지 확인:** 봇은 `channel`에 지정한 채널에 참여해야 합니다.

### Token issues

**"Failed to connect" 또는 인증 오류:**

- `accessToken`이 OAuth access token 값인지 확인합니다(보통 `oauth:` 접두사로 시작함)
- 토큰에 `chat:read` 및 `chat:write` 스코프가 있는지 확인합니다
- 토큰 갱신을 사용 중이라면 `clientSecret`과 `refreshToken`이 설정되어 있는지 확인합니다

### Token refresh not working

**갱신 이벤트 로그 확인:**

```
Using env token source for mybot
Access token refreshed for user 123456 (expires in 14400s)
```

"token refresh disabled (no refresh token)"가 보인다면:

- `clientSecret`이 제공되었는지 확인합니다
- `refreshToken`이 제공되었는지 확인합니다

## Config

**Account config:**

- `username` - 봇 사용자명
- `accessToken` - `chat:read` 및 `chat:write` 권한이 있는 OAuth access token
- `clientId` - Twitch Client ID(Token Generator 또는 자체 앱에서 획득)
- `channel` - 참여할 채널(필수)
- `enabled` - 이 계정 활성화 여부(기본값: `true`)
- `clientSecret` - 선택 사항: 자동 토큰 갱신용
- `refreshToken` - 선택 사항: 자동 토큰 갱신용
- `expiresIn` - 토큰 만료까지의 초
- `obtainmentTimestamp` - 토큰 획득 시각 타임스탬프
- `allowFrom` - 사용자 ID 허용 목록
- `allowedRoles` - 역할 기반 접근 제어(`"moderator" | "owner" | "vip" | "subscriber" | "all"`)
- `requireMention` - @mention 필요 여부(기본값: `true`)

**Provider options:**

- `channels.twitch.enabled` - 채널 시작 활성화/비활성화
- `channels.twitch.username` - 봇 사용자명(단순화된 단일 계정 구성)
- `channels.twitch.accessToken` - OAuth access token(단순화된 단일 계정 구성)
- `channels.twitch.clientId` - Twitch Client ID(단순화된 단일 계정 구성)
- `channels.twitch.channel` - 참여할 채널(단순화된 단일 계정 구성)
- `channels.twitch.accounts.<accountName>` - 다중 계정 구성(위의 모든 계정 필드 포함)

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

에이전트는 다음 action으로 `twitch`를 호출할 수 있습니다:

- `send` - 채널에 메시지 전송

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

- **토큰은 비밀번호처럼 취급** - 토큰을 절대 git에 커밋하지 마세요
- **자동 토큰 갱신 사용** - 장시간 실행되는 봇에 권장됩니다
- **사용자 ID 허용 목록 사용** - 접근 제어에는 사용자명 대신 사용자 ID를 사용하세요
- **로그 모니터링** - 토큰 갱신 이벤트와 연결 상태를 확인하세요
- **최소 권한 토큰 사용** - `chat:read`와 `chat:write`만 요청하세요
- **문제가 계속되면**: 다른 프로세스가 세션을 점유하고 있지 않은지 확인한 뒤 게이트웨이를 재시작하세요

## Limits

- 메시지당 **500자**(단어 경계 기준 자동 분할)
- 청크 분할 전에 Markdown이 제거됩니다
- 별도 rate limiting 없음(Twitch 내장 제한 사용)
