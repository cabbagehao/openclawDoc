---
summary: "native zca-js 기반 Zalo Personal 지원 상태, 기능, 설정 방법 요약"
description: "OpenClaw에서 비공식 Zalo 개인 계정을 연결하는 방법, QR 로그인 흐름, DM 및 그룹 접근 제어, 운영 시 주의할 제한 사항을 정리합니다."
read_when:
  - OpenClaw용 Zalo Personal을 설정할 때
  - Zalo Personal 로그인이나 메시지 흐름을 디버깅할 때
title: "Zalo Personal"
x-i18n:
  source_path: "channels/zalouser.md"
---

# Zalo Personal (비공식)

상태: experimental. 이 통합은 OpenClaw 내부에서 native `zca-js`를 사용해 **개인 Zalo account**를 자동화합니다.

> **Warning:** 이 통합은 비공식 방식이며 account suspension 또는 ban으로 이어질 수 있습니다. 사용 책임은 본인에게 있습니다.

## 플러그인 필요

Zalo Personal은 플러그인으로 제공되며 코어 설치에는 번들되지 않습니다.

- CLI 설치: `openclaw plugins install @openclaw/zalouser`
- source checkout에서 설치: `openclaw plugins install ./extensions/zalouser`
- 세부 내용: [Plugins](/tools/plugin)

외부 `zca`/`openzca` CLI binary는 필요하지 않습니다.

## 빠른 설정 (입문자용)

1. 플러그인을 설치합니다. (위 참고)
2. Gateway가 실행되는 장비에서 로그인합니다. (QR)
   - `openclaw channels login --channel zalouser`
   - Zalo mobile app으로 QR code를 스캔합니다.
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

4. Gateway를 재시작합니다. 또는 onboarding을 마무리합니다.
5. DM access 기본값은 pairing이며, 첫 접촉 시 pairing code를 승인해야 합니다.

## 이 통합의 성격

- 전체가 `zca-js`를 통해 in-process로 동작합니다.
- native event listener로 inbound message를 수신합니다.
- JS API를 통해 text, media, link를 직접 전송합니다.
- 공식 Zalo Bot API를 사용할 수 없는 개인 account 시나리오를 위한 설계입니다.

## 이름

channel id를 `zalouser`로 둔 이유는, 이것이 **개인 Zalo user account**를 자동화하는 비공식 통합임을 명확히 하기 위해서입니다. `zalo`는 향후 공식 Zalo API 통합을 위해 예약해 둡니다.

## ID 찾기 (directory)

directory CLI를 사용해 peer/group과 해당 ID를 찾을 수 있습니다.

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## 제한 사항

- outbound text는 Zalo client 제한 때문에 약 2000자 단위로 chunking됩니다.
- streaming은 기본적으로 차단됩니다.

## 접근 제어 (DMs)

`channels.zalouser.dmPolicy`는 `pairing | allowlist | open | disabled`를 지원합니다. 기본값은 `pairing`입니다.

`channels.zalouser.allowFrom`은 user ID 또는 이름을 받을 수 있습니다. onboarding 중에는 플러그인의 in-process contact lookup을 이용해 이름을 ID로 resolve합니다.

승인 명령:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## 그룹 접근 (선택 사항)

- 기본값: `channels.zalouser.groupPolicy = "open"` 입니다. 그룹이 허용됩니다. unset일 때 기본값을 바꾸려면 `channels.defaults.groupPolicy`를 사용하세요.
- allowlist로 제한하려면:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (key는 group ID 또는 이름이며, 어떤 그룹을 허용할지 제어)
  - `channels.zalouser.groupAllowFrom` (허용된 그룹 안에서 어떤 sender가 bot을 트리거할지 제어)
- 모든 그룹을 막으려면: `channels.zalouser.groupPolicy = "disabled"`
- configure wizard는 group allowlist 입력을 물어볼 수 있습니다.
- startup 시 OpenClaw는 allowlist의 group/user 이름을 ID로 resolve하고 매핑을 로그에 남깁니다. resolve되지 않은 항목은 입력값 그대로 유지됩니다.
- `groupAllowFrom`이 unset이면, runtime은 group sender check에서 `allowFrom`으로 fallback합니다.
- sender check는 일반 group message와 control command(예: `/new`, `/reset`) 모두에 적용됩니다.

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

### 그룹 mention gating

- `channels.zalouser.groups.<group>.requireMention`은 그룹 답장에 mention이 필요한지 제어합니다.
- resolution order: exact group id/name -> normalized group slug -> `*` -> default (`true`)
- 이 규칙은 allowlisted group과 open group mode 모두에 적용됩니다.
- 권한이 있는 control command(예: `/new`)는 mention gating을 우회할 수 있습니다.
- mention이 필요해서 group message가 건너뛰어지면, OpenClaw는 이를 pending group history로 저장하고 다음에 처리되는 group message에 포함합니다.
- group history limit 기본값은 `messages.groupChat.historyLimit`이며, fallback은 `50`입니다. account별 override는 `channels.zalouser.historyLimit`를 사용합니다.

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

## 멀티 계정

accounts는 OpenClaw state 안의 `zalouser` profile과 매핑됩니다. 예시:

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

## typing, reactions, delivery acknowledgements

- OpenClaw는 reply를 보내기 전에 typing event를 best-effort로 전송합니다.
- channel actions에서 `zalouser`용 message reaction action `react`를 지원합니다.
  - 특정 reaction emoji를 제거하려면 `remove: true`를 사용합니다.
  - reaction 의미는 [Reactions](/tools/reactions)를 참고하세요.
- event metadata가 포함된 inbound message의 경우, OpenClaw는 delivered + seen acknowledgement를 best-effort로 전송합니다.

## 문제 해결

**로그인이 유지되지 않음:**

- `openclaw channels status --probe`
- 다시 로그인: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**Allowlist/group name이 resolve되지 않음:**

- `allowFrom` / `groupAllowFrom` / `groups`에는 numeric ID 또는 정확한 friend/group 이름을 사용하세요.

**오래된 CLI 기반 설정에서 업그레이드한 경우:**

- 외부 `zca` process를 전제로 한 설정은 제거하세요.
- 이제 이 채널은 외부 CLI binary 없이 OpenClaw 내부에서 완전히 동작합니다.
