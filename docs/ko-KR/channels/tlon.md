---
summary: "Tlon/Urbit 지원 상태, 기능, 구성"
read_when:
  - Tlon/Urbit 채널 기능 작업 시
title: "Tlon"
---

# Tlon (plugin)

Tlon은 Urbit 기반의 탈중앙화 메신저입니다. OpenClaw는 당신의 Urbit ship에 연결되어
DM과 그룹 채팅 메시지에 응답할 수 있습니다. 그룹 응답은 기본적으로 @ 멘션이 필요하며,
allowlist를 통해 추가로 제한할 수 있습니다.

상태: 플러그인을 통해 지원됩니다. DM, 그룹 멘션, 스레드 답글, 리치 텍스트 포맷팅,
이미지 업로드를 지원합니다. 리액션과 투표는 아직 지원되지 않습니다.

## Plugin required

Tlon은 플러그인으로 제공되며 코어 설치에 번들되어 있지 않습니다.

CLI로 설치(npm 레지스트리):

```bash
openclaw plugins install @openclaw/tlon
```

로컬 체크아웃 사용 시(git 저장소에서 실행하는 경우):

```bash
openclaw plugins install ./extensions/tlon
```

자세한 내용: [Plugins](/tools/plugin)

## Setup

1. Tlon 플러그인을 설치합니다.
2. ship URL과 로그인 코드를 준비합니다.
3. `channels.tlon`을 구성합니다.
4. 게이트웨이를 재시작합니다.
5. 봇에게 DM을 보내거나 그룹 채널에서 멘션합니다.

최소 구성(단일 계정):

```json5
{
  channels: {
    tlon: {
      enabled: true,
      ship: "~sampel-palnet",
      url: "https://your-ship-host",
      code: "lidlut-tabwed-pillex-ridrup",
      ownerShip: "~your-main-ship", // 권장: 당신의 ship, 항상 허용됨
    },
  },
}
```

## Private/LAN ships

기본적으로 OpenClaw는 SSRF 보호를 위해 private/internal hostname과 IP 범위를 차단합니다.
당신의 ship이 private network(localhost, LAN IP 또는 internal hostname)에서 실행 중이라면,
명시적으로 opt in 해야 합니다:

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

이는 다음과 같은 URL에 적용됩니다:

- `http://localhost:8080`
- `http://192.168.x.x:8080`
- `http://my-ship.local:8080`

⚠️ 로컬 네트워크를 신뢰하는 경우에만 이 설정을 활성화하세요. 이 설정은
당신의 ship URL로 향하는 요청에 대한 SSRF 보호를 비활성화합니다.

## Group channels

자동 발견은 기본적으로 활성화되어 있습니다. 채널을 수동으로 고정할 수도 있습니다:

```json5
{
  channels: {
    tlon: {
      groupChannels: ["chat/~host-ship/general", "chat/~host-ship/support"],
    },
  },
}
```

자동 발견 비활성화:

```json5
{
  channels: {
    tlon: {
      autoDiscoverChannels: false,
    },
  },
}
```

## Access control

DM allowlist(비어 있으면 DM 허용 없음, 승인 흐름에는 `ownerShip` 사용):

```json5
{
  channels: {
    tlon: {
      dmAllowlist: ["~zod", "~nec"],
    },
  },
}
```

그룹 권한 부여(기본적으로 제한됨):

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

## Owner and approval system

승인되지 않은 사용자가 상호작용을 시도할 때 승인 요청을 받을 owner ship을 설정합니다:

```json5
{
  channels: {
    tlon: {
      ownerShip: "~your-main-ship",
    },
  },
}
```

owner ship은 **모든 곳에서 자동으로 승인됨** 상태입니다. DM 초대는 자동 수락되고,
채널 메시지는 항상 허용됩니다. owner를 `dmAllowlist`나
`defaultAuthorizedShips`에 추가할 필요가 없습니다.

설정되면 owner는 다음 상황에 대해 DM 알림을 받습니다:

- allowlist에 없는 ship으로부터 온 DM 요청
- 권한이 없는 채널에서의 멘션
- 그룹 초대 요청

## Auto-accept settings

DM 초대 자동 수락(`dmAllowlist`에 있는 ship에 대해):

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

## Delivery targets (CLI/cron)

`openclaw message send` 또는 cron delivery와 함께 다음을 사용하세요:

- DM: `~sampel-palnet` 또는 `dm/~sampel-palnet`
- Group: `chat/~host-ship/channel` 또는 `group:~host-ship/channel`

## Bundled skill

Tlon 플러그인에는 Tlon 작업에 대한 CLI 접근을 제공하는 번들 skill
([`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill))이 포함되어 있습니다:

- **Contacts**: 프로필 조회/업데이트, 연락처 목록 조회
- **Channels**: 목록 조회, 생성, 메시지 게시, 기록 가져오기
- **Groups**: 목록 조회, 생성, 멤버 관리
- **DMs**: 메시지 전송, 메시지에 리액션 추가
- **Reactions**: 게시물과 DM에 emoji 리액션 추가/제거
- **Settings**: slash command를 통한 플러그인 권한 관리

플러그인을 설치하면 이 skill을 자동으로 사용할 수 있습니다.

## Capabilities

| Feature         | Status                                    |
| --------------- | ----------------------------------------- |
| Direct messages | ✅ 지원됨                                 |
| Groups/channels | ✅ 지원됨(기본적으로 mention 게이트 적용) |
| Threads         | ✅ 지원됨(스레드 내 자동 응답)            |
| Rich text       | ✅ Markdown이 Tlon 형식으로 변환됨        |
| Images          | ✅ Tlon storage에 업로드됨                |
| Reactions       | ✅ [bundled skill](#bundled-skill) 경유   |
| Polls           | ❌ 아직 지원되지 않음                     |
| Native commands | ✅ 지원됨(기본적으로 owner 전용)          |

## Troubleshooting

먼저 이 순서대로 실행하세요:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

일반적인 실패 사례:

- **DM이 무시됨**: 발신자가 `dmAllowlist`에 없고 승인 흐름을 위한 `ownerShip`도 구성되지 않음.
- **그룹 메시지가 무시됨**: 채널이 발견되지 않았거나 발신자에게 권한이 없음.
- **연결 오류**: ship URL에 접근 가능한지 확인하고, 로컬 ship이면 `allowPrivateNetwork`를 활성화하세요.
- **인증 오류**: 로그인 코드가 현재 유효한지 확인하세요(코드는 순환 갱신됨).

## Configuration reference

전체 구성: [Configuration](/gateway/configuration)

Provider options:

- `channels.tlon.enabled`: 채널 시작 활성화/비활성화.
- `channels.tlon.ship`: 봇의 Urbit ship 이름(예: `~sampel-palnet`).
- `channels.tlon.url`: ship URL(예: `https://sampel-palnet.tlon.network`).
- `channels.tlon.code`: ship 로그인 코드.
- `channels.tlon.allowPrivateNetwork`: localhost/LAN URL 허용(SSRF 우회).
- `channels.tlon.ownerShip`: 승인 시스템용 owner ship(항상 승인됨).
- `channels.tlon.dmAllowlist`: DM을 보낼 수 있는 ship 목록(비어 있으면 none).
- `channels.tlon.autoAcceptDmInvites`: allowlist에 있는 ship의 DM을 자동 수락.
- `channels.tlon.autoAcceptGroupInvites`: 모든 그룹 초대를 자동 수락.
- `channels.tlon.autoDiscoverChannels`: 그룹 채널 자동 발견(기본값: true).
- `channels.tlon.groupChannels`: 수동으로 고정한 channel nest.
- `channels.tlon.defaultAuthorizedShips`: 모든 채널에서 승인된 ship.
- `channels.tlon.authorization.channelRules`: 채널별 auth 규칙.
- `channels.tlon.showModelSignature`: 메시지에 모델 이름을 덧붙임.

## Notes

- 그룹 응답은 응답하려면 멘션(예: `~your-bot-ship`)이 필요합니다.
- 스레드 답글: 인바운드 메시지가 스레드 안에 있으면 OpenClaw도 스레드 안에서 응답합니다.
- 리치 텍스트: Markdown 포맷팅(굵게, 기울임, 코드, 헤더, 리스트)이 Tlon의 네이티브 형식으로 변환됩니다.
- 이미지: URL은 Tlon storage에 업로드되고 이미지 블록으로 임베드됩니다.
