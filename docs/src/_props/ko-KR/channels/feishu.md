---
summary: "Feishu(Lark) 봇 연동 방법, 지원 기능 및 세부 설정 가이드"
read_when:
  - Feishu/Lark 봇을 OpenClaw에 연결하고자 할 때
  - Feishu 채널의 세부 옵션을 구성할 때
title: "Feishu"
x-i18n:
  source_path: "channels/feishu.md"
---

# Feishu 봇 연동 가이드

Feishu(Lark)는 기업용 메시징 및 협업 플랫폼임. 이 플러그인은 Feishu의 **WebSocket 이벤트 구독** 방식을 사용하여, 공개 웹훅 URL을 노출하지 않고도 메시지를 안전하게 수신할 수 있도록 OpenClaw를 연결함.

***

## 내장 플러그인 안내

Feishu 연동 기능은 최신 OpenClaw 릴리스에 기본 포함되어 있어 별도의 설치가 필요하지 않음. 만약 구버전이나 커스텀 빌드를 사용 중이라면 다음 명령어로 수동 설치 가능함:

```bash
openclaw plugins install @openclaw/feishu
```

***

## 빠른 시작 가이드

Feishu 채널을 추가하는 두 가지 방법:

### 방법 1: 온보딩 마법사 활용 (권장)

처음 설치하는 경우 마법사를 실행함:

```bash
openclaw onboard
```

마법사가 Feishu 앱 생성, 자격 증명 수집, Gateway 서버 설정을 단계별로 안내함.

### 방법 2: CLI를 통한 수동 추가

이미 설치가 완료된 상태라면 다음 명령어를 사용함:

```bash
openclaw channels add
```

목록에서 **Feishu**를 선택하고 앱 ID(App ID)와 앱 시크릿(App Secret)을 입력함.

✅ **설정 완료 후**: `openclaw gateway restart` 명령어로 서버를 재시작하고 `openclaw logs --follow`로 로그를 확인함.

***

## 1단계: Feishu 앱 생성 및 설정

### 1. Feishu 오픈 플랫폼 접속

[Feishu Open Platform](https://open.feishu.cn/app)에 로그인함.
글로벌 테넌트(Lark) 사용자는 [open.larksuite.com/app](https://open.larksuite.com/app)을 사용하고 설정에서 `domain: "lark"`를 지정해야 함.

### 2. 애플리케이션 생성

1. **Create enterprise app** 클릭.
2. 앱 이름과 설명을 입력하고 아이콘을 설정함.

### 3. 자격 증명 복사

**Credentials & Basic Info** 메뉴에서 다음 정보를 복사함:

* **App ID** (형식: `cli_xxx`)
* **App Secret** (외부 노출 주의)

### 4. 권한(Scopes) 구성

**Permissions** 메뉴에서 **Batch import**를 클릭하고 아래 JSON 내용을 붙여넣어 필요한 권한을 일괄 부여함:

```json
{
  "scopes": {
    "tenant": [
      "aily:file:read", "aily:file:write", "application:application.app_message_stats.overview:readonly",
      "application:application:self_manage", "application:bot.menu:write", "cardkit:card:read",
      "cardkit:card:write", "contact:user.employee_id:readonly", "corehr:file:download", "event:ip_list",
      "im:chat.access_event.bot_p2p_chat:read", "im:chat.members:bot_access", "im:message",
      "im:message.group_at_msg:readonly", "im:message.p2p_msg:readonly", "im:message:readonly",
      "im:message:send_as_bot", "im:resource"
    ],
    "user": ["aily:file:read", "aily:file:write", "im:chat.access_event.bot_p2p_chat:read"]
  }
}
```

### 5. 봇(Bot) 기능 활성화

**App Capability** > **Bot** 메뉴에서 기능을 활성화하고 봇 이름을 설정함.

### 6. 이벤트 구독 설정

⚠️ **중요**: 이벤트 구독 설정 전, 반드시 `openclaw gateway`가 실행 중이어야 함.
**Event Subscription** 메뉴에서:

1. **Use long connection to receive events** (WebSocket) 선택.
2. `im.message.receive_v1` 이벤트를 추가함.

### 7. 앱 게시 및 승인

**Version Management & Release** 메뉴에서 새 버전을 생성하고 관리자 승인을 얻어 게시함.

***

## 2단계: OpenClaw 설정

### 설정 파일 직접 수정

`~/.openclaw/openclaw.json` 파일의 `channels.feishu` 섹션을 편집함:

```json5
{
  channels: {
    feishu: {
      enabled: true,
      dmPolicy: "pairing",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "your-secret",
          botName: "AI 어시스턴트",
        },
      },
    },
  },
}
```

### 주요 설정 옵션

* **도메인 설정**: 글로벌 버전인 Lark 사용 시 `domain: "lark"`를 전역 또는 계정별로 설정함.
* **할당량 최적화**: API 호출 횟수를 줄이기 위해 `typingIndicator: false` (입력 중 상태 표시 끄기), `resolveSenderNames: false` (발신자 이름 조회 끄기) 옵션을 활용할 수 있음.

***

## 3단계: 가동 및 테스트

1. **Gateway 시작**: `openclaw gateway`.
2. **테스트 메시지**: Feishu 앱에서 봇에게 메시지를 보냄.
3. **페어링 승인**: 봇이 응답으로 보낸 페어링 코드를 확인하고 승인함:
   ```bash
   openclaw pairing approve feishu <CODE>
   ```

***

## 접근 제어 (Access Control)

### 개인 대화 (DM)

* 기본값은 **페어링(Pairing)** 모드임. 승인되지 않은 사용자는 메시지를 보내도 무시됨.
* 특정 Open ID 목록만 허용하려면 `channels.feishu.allowFrom`을 설정함.

### 그룹 대화

* **그룹 정책**: `open` (모두 허용), `allowlist` (지정된 그룹만 허용), `disabled` (그룹 메시지 무시).
* **멘션 강제**: `requireMention: true` 설정 시 봇을 @멘션한 메시지에만 응답함.
* **발신자 필터링**: `groups.<chat_id>.allowFrom`에 사용자 Open ID를 등록하여 특정 인원의 메시지만 처리하도록 제한 가능.

***

## ID 정보 확인 방법

### 그룹 ID (`chat_id`) 및 사용자 ID (`open_id`)

1. Gateway를 실행한 상태에서 봇을 포함한 대화를 시도함.
2. `openclaw logs --follow` 명령어로 실시간 로그를 확인하여 유입되는 ID 정보를 수집함.
3. 또는 `openclaw pairing list feishu` 명령어를 통해 대기 중인 페어링 요청에서 사용자 Open ID를 확인 가능함.

***

## 고급 기능

### 실시간 스트리밍 (Streaming)

Feishu의 대화형 카드를 사용하여 에이전트의 답변을 실시간으로 업데이트하며 보여줌.

```json5
{
  channels: {
    feishu: {
      streaming: true, // 카드 기반 실시간 업데이트 활성화
      blockStreaming: true, // 블록 단위 스트리밍 병행
    },
  },
}
```

### 멀티 에이전트 라우팅

수신된 메시지의 발신자나 그룹 ID에 따라 서로 다른 에이전트 워크스페이스로 작업을 할당함. 상세 내용은 [채널 라우팅 가이드](/channels/channel-routing) 참조.

***

## 문제 해결 (Troubleshooting)

* **그룹 대화 무응답**: 봇이 해당 그룹에 정상적으로 추가되었는지, @멘션 규칙이 올바른지 확인함.
* **메시지 수신 불가**: 앱의 게시 상태가 '공개'인지, **장기 연결(Long connection)** 모드가 활성화되어 있는지 점검함.
* **전송 실패**: 앱 권한에 `im:message:send_as_bot` 항목이 포함되어 있는지 확인하고, 관리자 승인 여부를 재점검함.
