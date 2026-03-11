---
title: "IRC"
description: "OpenClaw를 IRC 채널 및 개인 대화(DM)에 연결하는 방법"
summary: "IRC 플러그인 설정 가이드, 접근 제어 및 문제 해결 안내"
read_when:
  - OpenClaw를 IRC 채널이나 DM에 연동하고자 할 때
  - IRC 허용 목록, 그룹 정책 또는 멘션 게이팅 설정을 구성할 때
x-i18n:
  source_path: "channels/irc.md"
---

# IRC

OpenClaw를 고전적인 채팅 채널(`#room`) 및 개인 대화(DM) 환경에서 사용하고 싶을 때 IRC를 활용할 수 있음. IRC는 확장 플러그인 형태로 제공되지만, 설정은 메인 `openclaw.json` 파일의 `channels.irc` 섹션에서 통합 관리됨.

## 빠른 시작 가이드

1. `~/.openclaw/openclaw.json` 파일에서 IRC 설정을 활성화함.
2. 최소한 다음 필수 항목들을 입력함:

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

3. Gateway 서버를 시작하거나 재시작함:

```bash
openclaw gateway run
```

## 보안 기본 설정

- `channels.irc.dmPolicy`: 기본값 `"pairing"`.
- `channels.irc.groupPolicy`: 기본값 `"allowlist"`.
- **허용 목록**: `groupPolicy="allowlist"` 사용 시, `channels.irc.groups`에 허용할 채널들을 반드시 명시해야 함.
- **보안 전송**: 평문 전송을 의도적으로 허용해야 하는 특수한 상황이 아니라면 반드시 TLS(`channels.irc.tls=true`)를 사용함.

## 접근 제어 (Access Control)

IRC 채널에는 두 가지의 독립적인 '검문소'가 존재함:

1. **채널 접근 제어** (`groupPolicy` + `groups`): 봇이 특정 채널의 메시지를 수신할지 여부 결정.
2. **발신자 접근 제어** (`groupAllowFrom` / 채널별 `groups["#channel"].allowFrom`): 해당 채널 내에서 누가 봇을 호출할 수 있는지 결정.

**주요 설정 키:**
- DM 허용 목록 (개인 대화용): `channels.irc.allowFrom`
- 그룹 발신자 허용 목록 (채널 공통): `channels.irc.groupAllowFrom`
- 채널별 세부 제어 (채널 + 발신자 + 멘션 규칙): `channels.irc.groups["#channel"]`
- **오픈 모드**: `channels.irc.groupPolicy="open"` 설정 시 등록되지 않은 채널도 허용함. (단, 기본적으로 **멘션 게이팅**은 유지됨)

허용 목록에는 변하지 않는 안정적인 발신자 신원 정보(`nick!user@host`)를 사용할 것을 권장함. 단순 닉네임(Nick) 매칭은 타인이 도용할 가능성이 있으므로 `channels.irc.dangerouslyAllowNameMatching: true` 설정 시에만 제한적으로 활성화됨.

### 주의 사항: `allowFrom` 설정의 범위
DM용 허용 목록인 `allowFrom`은 그룹 채널 메시지에는 적용되지 않음. 만약 로그에 다음과 같은 오류가 보인다면:
- `irc: drop group sender alice!ident@host (policy=allowlist)`

이는 해당 사용자가 **그룹/채널** 메시지 발신자로 허용되지 않았음을 의미함. 다음 중 하나를 수행하여 해결함:
- `channels.irc.groupAllowFrom`에 추가 (모든 채널 공통 적용).
- `channels.irc.groups["#채널명"].allowFrom`에 추가 (특정 채널 전용).

**예시 (#tuirc-dev 채널의 모든 사용자 허용):**
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

## 응답 트리거 (멘션 게이팅)

채널과 발신자가 모두 허용된 상태라 하더라도, OpenClaw는 그룹 환경에서 기본적으로 **멘션 게이팅(Mention Gating)**을 수행함.

즉, 메시지에 봇을 호출하는 멘션 패턴이 포함되지 않으면 `drop channel … (missing-mention)` 로그와 함께 응답이 생성되지 않음. 멘션 없이도 봇이 답변하게 하려면 해당 채널의 설정을 변경함:

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

## 보안 권장 사항 (공개 채널 운영 시)

공개 채널에서 모든 사용자(`allowFrom: ["*"]`)에게 봇 사용을 허용하는 경우, 시스템 보호를 위해 도구(Tools) 권한을 제한할 것을 강력히 권장함.

### 채널 전체에 일괄 제한 적용
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

### 발신자별 차등 권한 부여 (관리자 권한 부여)
`toolsBySender`를 사용하여 일반 사용자에게는 엄격한 정책을, 관리자(본인)에게는 완화된 정책을 적용함:

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
            "id:admin_nick": {
              deny: ["gateway", "nodes", "cron"],
            },
          },
        },
      },
    },
  },
}
```

**참고 사항:**
- `toolsBySender`의 키 값은 `id:닉네임` 형식을 권장하며, 더 확실한 매칭을 위해 `id:nick!~user@host` 형식을 사용할 수 있음.
- 가장 구체적인 규칙이 먼저 적용되며, `"*"`는 폴백(Fallback)으로 작동함.
- 상세 그룹 정책 동작은 [그룹 대화 가이드](/channels/groups)를 참조함.

## 닉서브 (NickServ) 인증

연결 후 닉서브(NickServ)를 통해 본인 확인을 수행하도록 설정할 수 있음:

```json
{
  "channels": {
    "irc": {
      "nickserv": {
        "enabled": true,
        "service": "NickServ",
        "password": "your-password"
      }
    }
  }
}
```

## 환경 변수 지원

기본 계정에 대해 다음 환경 변수를 통한 설정 주입이 가능함:
- `IRC_HOST`, `IRC_PORT`, `IRC_TLS`, `IRC_NICK`, `IRC_USERNAME`, `IRC_REALNAME`, `IRC_PASSWORD`, `IRC_CHANNELS` (쉼표로 구분), `IRC_NICKSERV_PASSWORD`, `IRC_NICKSERV_REGISTER_EMAIL`.

## 문제 해결 (Troubleshooting)

- **접속은 되나 응답이 없음**: `channels.irc.groups` 설정 누락 여부와 멘션 게이팅(`missing-mention`) 발생 여부를 확인함. 멘션 없이 응답을 원하면 `requireMention: false`를 설정함.
- **로그인 실패**: 닉네임 사용 가능 여부와 서버 비밀번호가 정확한지 확인함.
- **TLS 연결 실패**: 호스트/포트 정보와 인증서(Certificate) 설정이 현재 네트워크 환경에 적합한지 점검함.
