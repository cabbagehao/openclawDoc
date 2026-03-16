---
summary: "Tlon/Urbit 지원 상태, 주요 기능, 설정 방법 요약"
description: "OpenClaw를 Tlon 및 Urbit ship에 연결하는 방법, DM 및 그룹 권한 제어, ownerShip 승인 흐름, 사설 네트워크 설정을 간단히 안내합니다."
read_when:
  - Tlon/Urbit 채널 기능을 작업할 때
title: "Tlon"
x-i18n:
  source_path: "channels/tlon.md"
---

# Tlon (플러그인)

Tlon은 Urbit 위에서 동작하는 탈중앙 메시징 서비스입니다. OpenClaw는 사용자의 Urbit ship에 연결되어 DM과 그룹 채팅 메시지에 응답할 수 있습니다. 그룹 답장은 기본적으로 @멘션이 필요하며 allowlist로 추가 제한을 걸 수 있습니다.

상태: 플러그인으로 지원됩니다. DM, 그룹 멘션, 스레드 답장, 리치 텍스트 포맷, 이미지 업로드를 지원합니다. reactions와 polls는 아직 지원하지 않습니다.

## 플러그인 필요

Tlon은 플러그인으로 제공되며 코어 설치에 번들되지 않습니다.

CLI 설치 (npm registry):

```bash
openclaw plugins install @openclaw/tlon
```

로컬 체크아웃에서 설치 (git repo에서 실행 중일 때):

```bash
openclaw plugins install ./extensions/tlon
```

세부 내용: [Plugins](/tools/plugin)

## 설정

1. Tlon 플러그인을 설치합니다.
2. ship URL과 login code를 준비합니다.
3. `channels.tlon`을 설정합니다.
4. gateway를 재시작합니다.
5. 봇에 DM을 보내거나 그룹 채널에서 멘션합니다.

최소 설정 예시 (single account):

```json5
{
  channels: {
    tlon: {
      enabled: true,
      ship: "~sampel-palnet",
      url: "https://your-ship-host",
      code: "lidlut-tabwed-pillex-ridrup",
      ownerShip: "~your-main-ship", // recommended: your ship, always allowed
    },
  },
}
```

## 사설/LAN ship

기본적으로 OpenClaw는 SSRF 보호를 위해 private/internal hostname과 IP 대역을 차단합니다. ship이 private network(localhost, LAN IP, internal hostname)에서 실행 중이라면 명시적으로 허용해야 합니다.

```json5
{
  channels: {
    tlon: {
      url: "http://localhost:8080",
      allowPrivateNetwork: true,
    },
  },
}
```

적용 대상 예시:

- `http://localhost:8080`
- `http://192.168.x.x:8080`
- `http://my-ship.local:8080`

<Warning>
신뢰할 수 있는 로컬 네트워크에서만 이 설정을 사용하세요. 이 옵션은 ship URL로 향하는 요청에 대한 SSRF 보호를 해제합니다.
</Warning>

## 그룹 채널

자동 탐색은 기본적으로 활성화되어 있습니다. 채널을 수동으로 고정할 수도 있습니다.

```json5
{
  channels: {
    tlon: {
      groupChannels: ["chat/~host-ship/general", "chat/~host-ship/support"],
    },
  },
}
```

자동 탐색을 끄려면:

```json5
{
  channels: {
    tlon: {
      autoDiscoverChannels: false,
    },
  },
}
```

## 접근 제어

DM allowlist (비어 있으면 DM 전체 차단, 승인 흐름에는 `ownerShip` 사용 권장):

```json5
{
  channels: {
    tlon: {
      dmAllowlist: ["~zod", "~nec"],
    },
  },
}
```

그룹 권한 설정 (기본은 restricted):

```json5
{
  channels: {
    tlon: {
      defaultAuthorizedShips: ["~zod"],
      authorization: {
        channelRules: {
          "chat/~host-ship/general": {
            mode: "restricted",
            allowedShips: ["~zod", "~nec"],
          },
          "chat/~host-ship/announcements": {
            mode: "open",
          },
        },
      },
    },
  },
}
```

## owner와 승인 시스템

권한이 없는 사용자가 상호작용할 때 승인 요청을 받을 owner ship을 지정할 수 있습니다.

```json5
{
  channels: {
    tlon: {
      ownerShip: "~your-main-ship",
    },
  },
}
```

owner ship은 **모든 위치에서 자동으로 권한이 부여**됩니다. DM 초대는 자동 수락되고, 채널 메시지는 항상 허용됩니다. `dmAllowlist`나 `defaultAuthorizedShips`에 owner를 따로 추가할 필요는 없습니다.

설정하면 owner는 다음 상황에서 DM 알림을 받습니다.

- allowlist에 없는 ship의 DM 요청
- 권한 없는 채널의 멘션
- 그룹 초대 요청

## 자동 수락 설정

DM 초대 자동 수락 (`dmAllowlist`에 있는 ship 대상):

```json5
{
  channels: {
    tlon: {
      autoAcceptDmInvites: true,
    },
  },
}
```

그룹 초대 자동 수락:

```json5
{
  channels: {
    tlon: {
      autoAcceptGroupInvites: true,
    },
  },
}
```

## 전달 대상 (CLI/cron)

`openclaw message send` 또는 cron delivery에서 다음 형식을 사용할 수 있습니다.

- DM: `~sampel-palnet` 또는 `dm/~sampel-palnet`
- Group: `chat/~host-ship/channel` 또는 `group:~host-ship/channel`

## 번들 Skill

Tlon 플러그인에는 CLI에서 Tlon 작업을 수행할 수 있는 번들 Skill([`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill))이 포함됩니다.

- **Contacts**: 프로필 조회/수정, 연락처 목록 조회
- **Channels**: 목록 조회, 생성, 메시지 게시, 히스토리 조회
- **Groups**: 목록 조회, 생성, 멤버 관리
- **DMs**: 메시지 전송, 메시지 반응 처리
- **Reactions**: 게시물과 DM에 emoji reaction 추가/삭제
- **Settings**: slash commands로 플러그인 권한 관리

플러그인이 설치되면 이 Skill도 자동으로 사용할 수 있습니다.

## 지원 기능

| Feature         | Status                                  |
| --------------- | --------------------------------------- |
| Direct messages | ✅ 지원                                 |
| Groups/channels | ✅ 지원 (기본적으로 mention-gated)      |
| Threads         | ✅ 지원 (스레드에 자동 답장)            |
| Rich text       | ✅ Markdown을 Tlon 형식으로 변환        |
| Images          | ✅ Tlon storage에 업로드                |
| Reactions       | ✅ [bundled skill](#번들-skill)로 지원  |
| Polls           | ❌ 아직 미지원                          |
| Native commands | ✅ 지원 (기본적으로 owner 전용)         |

## 문제 해결

먼저 아래 순서대로 확인하세요.

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

자주 발생하는 문제:

- **DM이 무시됨**: 발신자가 `dmAllowlist`에 없고 승인용 `ownerShip`도 설정되지 않음
- **그룹 메시지가 무시됨**: 채널이 탐지되지 않았거나 발신자에게 권한이 없음
- **연결 오류**: ship URL 접근 가능 여부 확인, local ship이면 `allowPrivateNetwork` 활성화
- **인증 오류**: login code가 최신인지 확인 (code는 교체될 수 있음)

## 설정 레퍼런스

전체 설정: [Configuration](/gateway/configuration)

주요 provider 옵션:

- `channels.tlon.enabled`: 채널 시작 여부
- `channels.tlon.ship`: 봇의 Urbit ship 이름 (예: `~sampel-palnet`)
- `channels.tlon.url`: ship URL (예: `https://sampel-palnet.tlon.network`)
- `channels.tlon.code`: ship login code
- `channels.tlon.allowPrivateNetwork`: localhost/LAN URL 허용 (SSRF 우회)
- `channels.tlon.ownerShip`: 승인 시스템용 owner ship (항상 권한 부여)
- `channels.tlon.dmAllowlist`: DM 허용 ship 목록 (비어 있으면 허용 안 함)
- `channels.tlon.autoAcceptDmInvites`: allowlisted ship의 DM 자동 수락
- `channels.tlon.autoAcceptGroupInvites`: 그룹 초대 자동 수락
- `channels.tlon.autoDiscoverChannels`: 그룹 채널 자동 탐색 여부 (기본 `true`)
- `channels.tlon.groupChannels`: 수동으로 고정한 channel nest 목록
- `channels.tlon.defaultAuthorizedShips`: 모든 채널에서 허용되는 ship 목록
- `channels.tlon.authorization.channelRules`: 채널별 권한 규칙
- `channels.tlon.showModelSignature`: 메시지에 model 이름 추가

## 참고

- 그룹 답장은 멘션(예: `~your-bot-ship`)이 있어야 합니다.
- 스레드 안에서 받은 메시지는 같은 스레드로 답장합니다.
- Markdown 서식(굵게, 기울임, 코드, 헤더, 리스트)은 Tlon 네이티브 형식으로 변환됩니다.
- 이미지 URL은 Tlon storage에 업로드된 뒤 image block으로 임베드됩니다.
