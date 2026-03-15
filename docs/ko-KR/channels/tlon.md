---
summary: "Tlon/Urbit 연동 상태, 지원 기능 및 세부 설정 가이드"
read_when:
  - Tlon 또는 Urbit 채널 기능을 구현하고자 할 때
title: "Tlon"
x-i18n:
  source_path: "channels/tlon.md"
---

# Tlon (플러그인)

Tlon은 Urbit 기반의 탈중앙화 메시징 플랫폼임. OpenClaw는 사용자의 Urbit 쉽(Ship)에 연결하여 개인 대화(DM) 및 그룹 채팅 메시지에 응답할 수 있음. 그룹 응답은 기본적으로 @멘션이 필요하며, 허용 목록(Allowlist)을 통해 추가적인 제한이 가능함.

**상태**: 플러그인을 통해 지원됨. 개인 대화(DM), 그룹 멘션, 스레드 답장, 리치 텍스트 포맷팅 및 이미지 업로드 기능을 제공함. 리액션과 투표 기능은 아직 지원하지 않음.

## 플러그인 설치 안내

Tlon 연동 기능은 플러그인 형태로 제공되며 코어 패키지에 포함되어 있지 않음.

**CLI를 통한 설치 (npm):**
```bash
openclaw plugins install @openclaw/tlon
```

**로컬 소스 환경 설치:**
```bash
openclaw plugins install ./extensions/tlon
```

상세 내용은 [플러그인 가이드](/tools/plugin) 참조.

## 설정 가이드

1. **플러그인 설치**: 위 안내에 따라 Tlon 플러그인을 설치함.
2. **연동 정보 준비**: 본인의 쉽(Ship) URL과 로그인 코드를 확인함.
3. **OpenClaw 구성**: `openclaw.json` 설정 파일에 정보를 입력함.
4. **Gateway 시작**: 서버를 재시작함.
5. **테스트**: 봇에게 DM을 보내거나 그룹 채널에서 멘션하여 동작을 확인함.

### 최소 설정 예시 (단일 계정)
```json5
{
  channels: {
    tlon: {
      enabled: true,
      ship: "~sampel-palnet",
      url: "https://your-ship-host",
      code: "lidlut-tabwed-pillex-ridrup",
      ownerShip: "~your-main-ship", // 권장: 본인의 메인 쉽 지정 (항상 승인됨)
    },
  },
}
```

## 사설 네트워크/LAN 내 쉽(Ship) 연동

OpenClaw는 보안(SSRF 보호)을 위해 기본적으로 내부 호스트명 및 사설 IP 대역으로의 접근을 차단함. 만약 쉽이 로컬 네트워크(localhost, LAN IP 등)에서 실행 중이라면 명시적인 허용 설정이 필요함:

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

<Warning>
**주의**: 이 설정은 쉽 URL로 향하는 요청에 대한 SSRF 보호를 비활성화하므로, 신뢰할 수 있는 로컬 네트워크 환경에서만 사용해야 함.
</Warning>

## 그룹 채널 관리

기본적으로 채널 자동 탐색 기능이 활성화되어 있음. 특정 채널을 수동으로 고정하려는 경우 다음과 같이 설정함:

```json5
{
  channels: {
    tlon: {
      groupChannels: ["chat/~host-ship/general", "chat/~host-ship/support"],
    },
  },
}
```

자동 탐색 기능을 비활성화하려면 `autoDiscoverChannels: false`를 설정함.

## 접근 제어 정책

### DM 허용 목록
등록되지 않은 쉽의 DM을 차단함 (승인 프로세스를 위해 `ownerShip` 설정을 권장함):

```json5
{
  channels: {
    tlon: {
      dmAllowlist: ["~zod", "~nec"],
    },
  },
}
```

### 그룹 권한 관리
기본적으로 제한된 접근 정책을 사용하며, 특정 쉽이나 채널별로 규칙을 정의할 수 있음:

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

## 소유자 및 승인 시스템 (Owner)

권한이 없는 사용자가 상호작용을 시도할 때 승인 요청을 받을 관리자 쉽(`ownerShip`)을 지정함:

```json5
{
  channels: {
    tlon: {
      ownerShip: "~your-main-ship",
    },
  },
}
```

**소유자 쉽의 특권**:
- 모든 위치에서 **자동 승인** 상태로 취급됨.
- DM 초대가 자동으로 수락되며, 모든 채널 메시지 발신이 허용됨.
- 다음 상황에 대해 DM 알림을 수신함:
  - 허용 목록에 없는 쉽의 DM 요청.
  - 권한 없는 채널에서의 멘션 발생.
  - 그룹 초대 요청 수신.

## 자동 수락 설정

특정 조건에 부합하는 초대를 자동으로 수락하도록 설정함:

- **DM 초대 자동 수락**: `autoAcceptDmInvites: true` (허용 목록에 있는 경우에만 적용).
- **그룹 초대 자동 수락**: `autoAcceptGroupInvites: true` (모든 그룹 초대 수락).

## 아웃바운드 대상 지정

`openclaw message send` 또는 크론 작업 실행 시 대상 식별자 형식임:
- **개인 대화**: `~sampel-palnet` 또는 `dm/~sampel-palnet`
- **그룹 대화**: `chat/~host-ship/channel` 또는 `group:~host-ship/channel`

## 내장 스킬 (Bundled Skill)

Tlon 플러그인은 CLI를 통해 Tlon의 기능을 직접 제어할 수 있는 내장 스킬([`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill))을 포함함:

- **연락처**: 프로필 조회 및 업데이트, 연락처 목록 관리.
- **채널**: 목록 조회, 채널 생성, 메시지 게시 및 이력 조회.
- **그룹**: 목록 조회, 그룹 생성 및 멤버 관리.
- **대화**: 메시지 전송 및 리액션 추가.
- **설정**: 슬래시 명령어를 통한 플러그인 권한 제어.

플러그인 설치 시 별도 설정 없이 바로 사용 가능함.

## 지원 기능 요약

| 기능 | 지원 상태 |
| :--- | :--- |
| 개인 대화 (DM) | ✅ 지원 |
| 그룹 및 채널 | ✅ 지원 (기본적으로 멘션 게이팅 적용) |
| 스레드 (Threads) | ✅ 지원 (스레드 내 자동 답장) |
| 리치 텍스트 | ✅ 마크다운을 Tlon 형식으로 자동 변환 |
| 이미지 전송 | ✅ Tlon 저장소 업로드 및 임베딩 지원 |
| 리액션 | ✅ [내장 스킬](#내장-스킬-bundled-skill)을 통해 지원 |
| 투표 (Polls) | ❌ 미지원 |
| 네이티브 명령어 | ✅ 지원 (기본적으로 소유자 전용) |

## 문제 해결 (Troubleshooting)

진단 단계:
1. `openclaw status` 및 `gateway status` 확인.
2. `openclaw logs --follow` 모니터링.
3. `openclaw doctor` 실행.

**일반적인 오류 사유:**
- **DM 무시**: 발신자가 `dmAllowlist`에 없고 `ownerShip` 설정도 되어 있지 않은 경우.
- **그룹 무응답**: 채널 탐색이 되지 않았거나 발신자 권한이 없는 경우.
- **연결 실패**: 쉽 URL 도달 가능 여부 및 사설망 허용(`allowPrivateNetwork`) 설정 확인.
- **인증 에러**: 로그인 코드가 만료되었는지 확인 (코드는 주기적으로 갱신될 수 있음).

상세한 설정 옵션은 [Gateway 설정 가이드](/gateway/configuration)를 참조함.
