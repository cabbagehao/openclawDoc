---
summary: "Mattermost 봇 연동 상태, 주요 기능 및 세부 설정 가이드"
read_when:
  - Mattermost 채널을 구축하거나 관련 기능을 수정할 때
  - Mattermost 메시지 라우팅 문제를 디버깅할 때
title: "Mattermost"
x-i18n:
  source_path: "channels/mattermost.md"
---

# Mattermost (플러그인)

**상태**: 플러그인(봇 토큰 + WebSocket 이벤트 방식)을 통해 지원됨. 공개 채널, 그룹 대화 및 개인 대화(DM)를 모두 지원함.
Mattermost는 자체 호스팅이 가능한 팀 메시징 플랫폼임. 제품 상세 정보 및 다운로드는 공식 사이트([mattermost.com](https://mattermost.com))를 참조함.

## 플러그인 설치 안내

Mattermost 연동 기능은 플러그인 형태로 제공되며 코어 패키지에 포함되어 있지 않음.

**CLI를 통한 설치 (npm):**

```bash
openclaw plugins install @openclaw/mattermost
```

**로컬 소스 환경 설치:**

```bash
openclaw plugins install ./extensions/mattermost
```

상세 내용은 [플러그인 가이드](/tools/plugin) 참조.

## 설정 가이드

1. **플러그인 설치**: 위 안내에 따라 Mattermost 플러그인을 설치함.
2. **봇 계정 생성**: Mattermost 관리자 콘솔에서 봇 계정을 생성하고 \*\*봇 토큰(Bot Token)\*\*을 복사함.
3. **접속 정보 확인**: Mattermost 서버의 **베이스 URL** (예: `https://chat.example.com`)을 확인함.
4. **OpenClaw 구성**: `openclaw.json` 설정을 완료하고 Gateway를 시작함.

### 최소 설정 예시

```json5
{
  channels: {
    mattermost: {
      enabled: true,
      botToken: "your-mm-token",
      baseUrl: "https://chat.example.com",
      dmPolicy: "pairing",
    },
  },
}
```

## 네이티브 슬래시 명령어 (선택 사항)

네이티브 슬래시 명령어는 사용자의 선택에 따라 활성화할 수 있음. 활성화 시 OpenClaw는 Mattermost API를 통해 `oc_*` 명령어를 등록하고, Gateway 서버에서 콜백(Callback) 요청을 수신함.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Mattermost 서버가 Gateway에 직접 도달할 수 없는 경우(프록시 등) 사용
        callbackUrl: "https://your-public-gateway.com/api/channels/mattermost/command",
      },
    },
  },
}
```

**참고 사항:**

* `native: "auto"` 설정 시 Mattermost에서는 기본적으로 비활성화됨. 명시적으로 `true`를 설정해야 함.
* **도달 가능성**: 콜백 엔드포인트는 Mattermost 서버에서 호출 가능해야 함.
  * Gateway가 루프백(`localhost`)에만 바인딩되어 있다면 Mattermost 서버와 동일한 호스트/네트워크 환경이어야 함.
  * 사설망 또는 Tailnet 주소를 사용하는 경우, Mattermost 설정(`AllowedUntrustedInternalConnections`)에 해당 호스트를 추가해야 함.
* **보안**: 각 명령어 콜백은 전용 토큰으로 검증되며, 검증 실패 시 즉시 거부(Fail-closed)됨.

## 환경 변수 지원 (기본 계정 전용)

설정 파일 대신 환경 변수를 사용할 수 있음 (기본 `default` 계정에만 적용됨):

* `MATTERMOST_BOT_TOKEN=...`
* `MATTERMOST_URL=https://chat.example.com`

## 채팅 모드 (Chat Modes)

개인 대화(DM)에는 항상 자동으로 응답함. 채널 및 그룹 대화의 동작은 `chatmode` 설정을 통해 제어함:

* **`oncall`** (기본값): 채널에서 에이전트가 @멘션되었을 때만 응답함.
* **`onmessage`**: 채널의 모든 메시지에 대해 응답을 시도함.
* **`onchar`**: 메시지가 지정된 접두사(Prefix)로 시작할 때만 응답함.

**`onchar` 설정 예시:**

```json5
{
  channels: {
    mattermost: {
      chatmode: "onchar",
      oncharPrefixes: [">", "!"],
    },
  },
}
```

## 접근 제어 정책

* **DM 정책**: `dmPolicy` 설정을 통해 `pairing` (기본값), `allowlist`, `open`, `disabled` 중 선택.
* **그룹/채널 정책**: 기본값은 `allowlist`이며 멘션 게이팅이 적용됨.
  * `groupAllowFrom` 설정을 통해 허용할 사용자 ID 목록을 관리함.
  * `dangerouslyAllowNameMatching: true` 설정 시에만 이름(`@username`) 기반 매칭이 활성화됨.

## 아웃바운드 대상 지정 형식

`openclaw message send` 또는 자동화 기능 사용 시 다음 형식을 따름:

* **채널**: `channel:<id>` (ID만 입력 시 채널로 간주)
* **개인 대화**: `user:<id>` 또는 `@이름` (API를 통해 ID로 자동 해석됨)

## 리액션 및 대화형 버튼

### 리액션 (Message Tool)

에이전트가 메시지에 리액션을 추가하거나 제거할 수 있음.

* 사용 예시: `message action=react channel=mattermost target=channel:<ID> messageId=<PostID> emoji=thumbsup`

### 대화형 버튼 (Interactive Buttons)

클릭 가능한 버튼이 포함된 메시지를 발송하고 사용자의 선택을 수신함.

* **활성화**: `capabilities: ["inlineButtons"]` 추가 필수.
* **동작**: 사용자가 버튼 클릭 시 기존 버튼들은 확인 문구(예: "✓ **예** 선택됨")로 교체되며 에이전트가 해당 입력을 처리함.

## 문제 해결 (Troubleshooting)

* **응답 없음**: 봇이 해당 채널에 초대되었는지 확인하고, 설정된 채팅 모드(`oncall`, `onchar` 등)에 부합하는 방식으로 메시지를 보냈는지 확인함.
* **버튼 클릭 무반응**: Mattermost 서버 설정의 `EnablePostActionIntegration`이 `true`인지 확인하고, Gateway의 콜백 URL 접근 가능 여부를 점검함.
* **404 오류 (버튼 클릭 시)**: 버튼 ID에 영숫자 이외의 문자(하이픈, 밑줄 등)가 포함되지 않았는지 확인함.
* **HMAC 검증 실패**: 시크릿 생성 로직이나 JSON 직렬화 시 공백 포함 여부, 키 정렬 상태 등을 재점검함.

상세 설정 스키마 및 전체 옵션은 [Gateway 설정 가이드](/gateway/configuration)를 참조함.
