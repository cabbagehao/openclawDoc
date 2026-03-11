---
summary: "native zca-js(QR 로그인)를 통한 Zalo 개인 계정 지원, 기능, 설정"
read_when:
  - OpenClaw용 Zalo Personal을 설정할 때
  - Zalo Personal 로그인 또는 메시지 흐름을 디버깅할 때
title: "Zalo Personal"
---

# Zalo Personal (unofficial)

상태: experimental. 이 통합은 OpenClaw 내부에서 native `zca-js`로 **개인 Zalo 계정**을 자동화합니다.

> **Warning:** 이것은 비공식 통합이며 계정 정지/차단으로 이어질 수 있습니다. 모든 책임은 사용자에게 있습니다.

## Plugin required

Zalo Personal은 plugin 형태로 제공되며 core install에는 포함되지 않습니다.

- CLI 설치: `openclaw plugins install @openclaw/zalouser`
- 소스 체크아웃에서 설치: `openclaw plugins install ./extensions/zalouser`
- 자세한 내용: [Plugins](/tools/plugin)

외부 `zca`/`openzca` CLI 바이너리는 필요하지 않습니다.

## Quick setup (beginner)

1. plugin을 설치합니다(위 참고).
2. Gateway 머신에서 QR로 로그인합니다.
   - `openclaw channels login --channel zalouser`
   - Zalo 모바일 앱으로 QR 코드를 스캔합니다.
3. 채널을 활성화합니다.

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

4. gateway를 재시작합니다(또는 onboarding을 마칩니다).
5. DM 접근은 기본적으로 pairing이며, 첫 접촉 시 pairing code를 승인해야 합니다.

## What it is

- 전부 `zca-js`로 프로세스 내부에서 실행됩니다.
- native event listener로 inbound message를 수신합니다.
- JS API를 통해 직접 응답(text/media/link)을 전송합니다.
- Zalo Bot API를 쓸 수 없는 “개인 계정” 용도에 맞춰 설계되었습니다.

## Naming

channel id를 `zalouser`로 둔 이유는 이것이 **개인 Zalo 사용자 계정** 자동화(비공식)임을 명확히 하기 위해서입니다. `zalo`는 장래의 공식 Zalo API 통합을 위해 비워 두고 있습니다.

## Finding IDs (directory)

directory CLI로 peer/group과 그 ID를 찾을 수 있습니다.

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Limits

- outbound text는 Zalo client 제한 때문에 약 2000자로 chunking됩니다.
- streaming은 기본적으로 차단됩니다.

## Access control (DMs)

`channels.zalouser.dmPolicy`는 `pairing | allowlist | open | disabled`를 지원합니다(기본값: `pairing`).

`channels.zalouser.allowFrom`은 user ID 또는 이름을 받을 수 있습니다. onboarding 중에는 plugin의 in-process contact lookup을 사용해 이름을 ID로 해석합니다.

승인 명령:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Group access (optional)

- 기본값: `channels.zalouser.groupPolicy = "open"`(group 허용). 설정하지 않으면 `channels.defaults.groupPolicy`로 기본값을 override할 수 있습니다.
- allowlist로 제한하려면:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (key는 group ID 또는 이름, 허용할 group 제어)
  - `channels.zalouser.groupAllowFrom` (허용된 group 안에서 어떤 발신자가 bot을 트리거할 수 있는지 제어)
- 모든 group 차단: `channels.zalouser.groupPolicy = "disabled"`
- configure wizard가 group allowlist 입력을 물어볼 수 있습니다.
- 시작 시 OpenClaw는 allowlist의 group/user 이름을 ID로 해석하고 매핑을 로그에 남깁니다. 해석되지 않는 항목은 입력한 그대로 둡니다.
- `groupAllowFrom`이 비어 있으면, runtime은 group 발신자 검사에 `allowFrom`을 fallback으로 사용합니다.
- 발신자 검사는 일반 group message와 control command(예: `/new`, `/reset`) 모두에 적용됩니다.

예시:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["1471383327500481391"],
      groups: {
        "123456789": { allow: true },
        "Work Chat": { allow: true },
      },
    },
  },
}
```

### Group mention gating

- `channels.zalouser.groups.<group>.requireMention`은 group 응답에 mention이 필요한지 제어합니다.
- 해석 순서: 정확한 group id/name -> 정규화된 group slug -> `*` -> 기본값(`true`)
- 이 규칙은 allowlisted group과 open group 모드 모두에 적용됩니다.
- 권한이 있는 control command(예: `/new`)는 mention gating을 우회할 수 있습니다.
- mention이 필요해서 group message를 건너뛰면, OpenClaw는 이를 pending group history로 저장하고 다음으로 처리되는 group message에 함께 포함합니다.
- group history limit 기본값은 `messages.groupChat.historyLimit`(fallback `50`)입니다. account별로 `channels.zalouser.historyLimit`에서 override할 수 있습니다.

예시:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groups: {
        "*": { allow: true, requireMention: true },
        "Work Chat": { allow: true, requireMention: false },
      },
    },
  },
}
```

## Multi-account

account는 OpenClaw state 안의 `zalouser` profile에 매핑됩니다. 예시:

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      defaultAccount: "default",
      accounts: {
        work: { enabled: true, profile: "work" },
      },
    },
  },
}
```

## Typing, reactions, and delivery acknowledgements

- OpenClaw는 응답 전송 전에 typing event를 보냅니다(best-effort).
- channel action에서 `zalouser`는 message reaction action `react`를 지원합니다.
  - 메시지에서 특정 reaction emoji를 제거하려면 `remove: true`를 사용하세요.
  - reaction 의미는 [Reactions](/tools/reactions)를 참고하세요.
- event metadata가 포함된 inbound message에 대해서는 OpenClaw가 delivered + seen acknowledgement를 보냅니다(best-effort).

## Troubleshooting

**Login doesn't stick:**

- `openclaw channels status --probe`
- 다시 로그인: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**Allowlist/group name didn't resolve:**

- `allowFrom`/`groupAllowFrom`/`groups`에 숫자 ID 또는 정확한 friend/group 이름을 사용하세요.

**Upgraded from old CLI-based setup:**

- 예전 외부 `zca` 프로세스 전제를 제거하세요.
- 이 채널은 이제 외부 CLI 바이너리 없이 OpenClaw 내부에서 완전히 동작합니다.
