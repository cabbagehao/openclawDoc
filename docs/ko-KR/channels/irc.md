---
title: IRC
description: OpenClaw를 IRC 채널과 direct message에 연결합니다.
summary: "IRC plugin 설정, 접근 제어, 문제 해결"
read_when:
  - OpenClaw를 IRC 채널 또는 DM에 연결하고 싶을 때
  - IRC allowlist, group policy, mention gating을 설정할 때
---

OpenClaw를 클래식 채널(`#room`)과 direct message에 넣고 싶다면 IRC를 사용하세요.
IRC는 extension plugin으로 제공되지만, 설정은 메인 config의 `channels.irc` 아래에서 합니다.

## Quick start

1. `~/.openclaw/openclaw.json`에서 IRC config를 활성화합니다.
2. 최소한 다음 값을 설정합니다.

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

3. gateway를 시작/재시작합니다.

```bash
openclaw gateway run
```

## Security defaults

- `channels.irc.dmPolicy` 기본값은 `"pairing"`
- `channels.irc.groupPolicy` 기본값은 `"allowlist"`
- `groupPolicy="allowlist"`일 때 허용 채널은 `channels.irc.groups`로 정의해야 합니다.
- 평문 전송을 의도적으로 허용하는 경우가 아니라면 TLS(`channels.irc.tls=true`)를 사용하세요.

## Access control

IRC 채널에는 두 개의 별도 “gate”가 있습니다.

1. **Channel access** (`groupPolicy` + `groups`): bot이 특정 채널의 메시지를 아예 받을지 여부
2. **Sender access** (`groupAllowFrom` / 채널별 `groups["#channel"].allowFrom`): 채널 안에서 누가 bot을 트리거할 수 있는지

Config key:

- DM allowlist(DM 발신자 접근): `channels.irc.allowFrom`
- Group sender allowlist(채널 발신자 접근): `channels.irc.groupAllowFrom`
- 채널별 제어(채널 + 발신자 + mention 규칙): `channels.irc.groups["#channel"]`
- `channels.irc.groupPolicy="open"`은 설정되지 않은 채널도 허용합니다(**기본적으로 여전히 mention-gated**)

allowlist 항목은 안정적인 발신자 식별자(`nick!user@host`)를 사용하는 편이 좋습니다.
bare nick 매칭은 변경 가능성이 있으므로, `channels.irc.dangerouslyAllowNameMatching: true`일 때만 활성화됩니다.

### Common gotcha: `allowFrom` is for DMs, not channels

다음과 같은 로그가 보인다면:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

이는 **group/channel** 메시지용 sender가 허용되지 않았다는 뜻입니다. 해결 방법:

- `channels.irc.groupAllowFrom` 설정(모든 채널 공통), 또는
- 채널별 sender allowlist 설정: `channels.irc.groups["#channel"].allowFrom`

예시(`#tuirc-dev`에서 누구나 bot에게 말할 수 있게 허용):

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

## Reply triggering (mentions)

채널이 허용되었고(`groupPolicy` + `groups`), sender도 허용되었더라도, OpenClaw는 group context에서 기본적으로 **mention-gating**을 적용합니다.

따라서 메시지에 bot mention 패턴이 없으면 `drop channel … (missing-mention)` 같은 로그가 보일 수 있습니다.

IRC 채널에서 **mention 없이도** bot이 답하게 하려면 해당 채널의 mention gating을 끄세요.

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

또는 **모든** IRC 채널을 허용하면서 mention 없이도 답하게 하려면:

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

## Security note (recommended for public channels)

공개 채널에서 `allowFrom: ["*"]`를 허용하면 누구나 bot을 프롬프트할 수 있습니다.
위험을 줄이려면 해당 채널에서 사용할 tool을 제한하세요.

### Same tools for everyone in the channel

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

### Different tools per sender (owner gets more power)

`toolsBySender`를 사용하면 `"*"`에는 더 엄격한 정책을, 자신의 nick에는 더 느슨한 정책을 적용할 수 있습니다.

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

- `toolsBySender` key는 IRC sender identity 값에 `id:` 접두사를 쓰는 편이 좋습니다.
  예: `id:eigen`, 더 강한 매칭을 원하면 `id:eigen!~eigen@174.127.248.171`
- 레거시 unprefixed key도 여전히 허용되며 `id:`로만 매칭됩니다.
- 가장 먼저 일치하는 sender policy가 적용되고, `"*"`가 wildcard fallback입니다.

group access와 mention-gating의 관계는 [/channels/groups](/channels/groups)를 참고하세요.

## NickServ

연결 후 NickServ로 identify 하려면:

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

연결 시 한 번만 등록하려면:

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

nick이 등록된 뒤에는 반복 REGISTER 시도를 막기 위해 `register`를 끄세요.

## Environment variables

기본 account에서 지원:

- `IRC_HOST`
- `IRC_PORT`
- `IRC_TLS`
- `IRC_NICK`
- `IRC_USERNAME`
- `IRC_REALNAME`
- `IRC_PASSWORD`
- `IRC_CHANNELS` (쉼표 구분)
- `IRC_NICKSERV_PASSWORD`
- `IRC_NICKSERV_REGISTER_EMAIL`

## Troubleshooting

- bot이 연결되었는데 채널에서 절대 응답하지 않으면, `channels.irc.groups`와 mention-gating이 메시지를 떨어뜨리는지(`missing-mention`) 확인하세요. ping 없이도 답하게 하려면 해당 채널에 `requireMention:false`를 설정하세요.
- 로그인 실패 시 nick 사용 가능 여부와 server password를 확인하세요.
- 커스텀 네트워크에서 TLS가 실패하면 host/port와 certificate 구성을 점검하세요.
