---
title: IRC
description: OpenClaw를 IRC 채널과 direct message에 연결합니다.
summary: "IRC plugin 설정, 접근 제어, 문제 해결"
read_when:
  - OpenClaw를 IRC 채널이나 DM에 연결하려고 할 때
  - IRC allowlist, group policy, mention gating을 설정할 때
x-i18n:
  source_path: "channels/irc.md"
---

IRC는 OpenClaw를 전통적인 채널(`#room`)과 direct messages에 연결할 때
사용합니다. IRC는 extension plugin으로 제공되지만, 구성은 메인 config의
`channels.irc` 아래에서 관리됩니다.

## 빠른 시작

1. `~/.openclaw/openclaw.json`에서 IRC config를 활성화합니다.
2. 최소한 다음을 설정합니다.

```json
{
  "channels": {
    "irc": {
      "enabled": true,
      "host": "irc.libera.chat",
      "port": 6697,
      "tls": true,
      "nick": "openclaw-bot",
      "channels": ["#openclaw"]
    }
  }
}
```

3. gateway를 시작하거나 재시작합니다.

```bash
openclaw gateway run
```

## 보안 기본값

- `channels.irc.dmPolicy` 기본값은 `"pairing"`입니다.
- `channels.irc.groupPolicy` 기본값은 `"allowlist"`입니다.
- `groupPolicy="allowlist"`이면 `channels.irc.groups`로 허용된 채널을
  정의해야 합니다.
- 평문 전송을 의도적으로 허용하는 경우가 아니라면 TLS(`channels.irc.tls=true`)를
  사용하세요.

## 접근 제어

IRC 채널에는 두 개의 별도 "gate"가 있습니다.

1. **Channel access** (`groupPolicy` + `groups`): bot이 해당 채널의 메시지를
   아예 받을지 여부
2. **Sender access** (`groupAllowFrom` / 채널별 `groups["#channel"].allowFrom`):
   그 채널 안에서 누가 bot을 트리거할 수 있는지

Config key:

- DM allowlist (DM sender access): `channels.irc.allowFrom`
- Group sender allowlist (channel sender access): `channels.irc.groupAllowFrom`
- Per-channel controls (channel + sender + mention rules): `channels.irc.groups["#channel"]`
- `channels.irc.groupPolicy="open"`은 미구성 채널도 허용합니다
  (**기본적으로 여전히 mention-gated**)

Allowlist 항목에는 안정적인 sender identity(`nick!user@host`)를 사용하는 것이
좋습니다. bare nick matching은 mutable하며
`channels.irc.dangerouslyAllowNameMatching: true`일 때만 활성화됩니다.

### 흔한 함정: `allowFrom`은 DM용이지 채널용이 아님

이런 로그가 보인다면:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

이는 **group/channel** 메시지에서 sender가 허용되지 않았다는 뜻입니다.
다음 중 하나로 수정하세요.

- `channels.irc.groupAllowFrom` 설정(모든 채널 공통)
- 채널별 sender allowlist 설정:
  `channels.irc.groups["#channel"].allowFrom`

예시(`#tuirc-dev`에서 누구나 bot과 대화 허용):

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#tuirc-dev": { allowFrom: ["*"] },
      },
    },
  },
}
```

## 응답 트리거(mentions)

채널이 허용되어 있고(`groupPolicy` + `groups`) sender도 허용되어 있어도,
OpenClaw는 group context에서 기본적으로 **mention-gating**을 사용합니다.

즉, 메시지에 bot과 일치하는 mention pattern이 없으면
`drop channel … (missing-mention)` 같은 로그가 나타날 수 있습니다.

IRC 채널에서 **mention 없이도** bot이 답하게 하려면 해당 채널의 mention gating을
끄세요.

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#tuirc-dev": {
          requireMention: false,
          allowFrom: ["*"],
        },
      },
    },
  },
}
```

또는 **모든** IRC 채널을 허용하면서(채널별 allowlist 없이) mention 없이도
응답하게 하려면:

```json5
{
  channels: {
    irc: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: false, allowFrom: ["*"] },
      },
    },
  },
}
```

## 보안 참고(공개 채널 권장)

공개 채널에서 `allowFrom: ["*"]`를 허용하면 누구나 bot을 프롬프트할 수
있습니다. 위험을 줄이려면 그 채널의 tools를 제한하세요.

### 채널의 모든 사용자에게 같은 tools 적용

```json5
{
  channels: {
    irc: {
      groups: {
        "#tuirc-dev": {
          allowFrom: ["*"],
          tools: {
            deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
          },
        },
      },
    },
  },
}
```

### sender별로 다른 tools 적용(owner는 더 많은 권한)

`toolsBySender`를 사용해 `"*"`에는 더 엄격한 정책을, 본인 nick에는 더 완화된
정책을 적용할 수 있습니다.

```json5
{
  channels: {
    irc: {
      groups: {
        "#tuirc-dev": {
          allowFrom: ["*"],
          toolsBySender: {
            "*": {
              deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
            },
            "id:eigen": {
              deny: ["gateway", "nodes", "cron"],
            },
          },
        },
      },
    },
  },
}
```

참고:

- `toolsBySender` key는 IRC sender identity 값에 `id:`를 사용하는 것이
  좋습니다. 더 강한 매칭이 필요하면 `id:eigen` 또는
  `id:eigen!~eigen@174.127.248.171`처럼 사용하세요.
- 레거시 unprefixed key도 여전히 허용되며 `id:`로만 매칭됩니다.
- 가장 먼저 일치한 sender policy가 적용되며, `"*"`는 wildcard fallback입니다.

group access와 mention-gating의 상호작용은 여기 참고:
[/channels/groups](/channels/groups)

## NickServ

연결 후 NickServ로 identify하려면:

```json
{
  "channels": {
    "irc": {
      "nickserv": {
        "enabled": true,
        "service": "NickServ",
        "password": "your-nickserv-password"
      }
    }
  }
}
```

선택적으로 연결 시 1회 등록:

```json
{
  "channels": {
    "irc": {
      "nickserv": {
        "register": true,
        "registerEmail": "bot@example.com"
      }
    }
  }
}
```

nick 등록이 끝났다면 반복 REGISTER를 막기 위해 `register`를 비활성화하세요.

## 환경 변수

기본 account는 다음을 지원합니다.

- `IRC_HOST`
- `IRC_PORT`
- `IRC_TLS`
- `IRC_NICK`
- `IRC_USERNAME`
- `IRC_REALNAME`
- `IRC_PASSWORD`
- `IRC_CHANNELS` (comma-separated)
- `IRC_NICKSERV_PASSWORD`
- `IRC_NICKSERV_REGISTER_EMAIL`

## 문제 해결

- bot이 연결되지만 채널에서 전혀 응답하지 않으면, `channels.irc.groups`와
  mention-gating이 메시지를 드롭하는지(`missing-mention`)를 확인하세요.
  ping 없이도 응답하게 하려면 채널에 `requireMention:false`를 설정하세요.
- 로그인 실패 시 nick 사용 가능 여부와 server password를 확인하세요.
- custom network에서 TLS가 실패하면 host/port와 certificate 구성을 확인하세요.
