---
summary: "페어링(Pairing) 개요: DM 발신자 승인 및 신규 노드 기기 연동 방법 안내"
read_when:
  - DM 접근 제어 정책을 설정하고자 할 때
  - 새로운 iOS/Android 노드를 페어링할 때
  - OpenClaw의 전반적인 보안 체계를 검토할 때
title: "페어링"
x-i18n:
  source_path: "channels/pairing.md"
---

# 페어링 (Pairing)

\*\*페어링(Pairing)\*\*은 OpenClaw의 핵심적인 **소유자 명시적 승인** 단계임. 시스템은 다음 두 가지 상황에서 페어링 절차를 요구함:

1. **DM 페어링**: 에이전트와 대화할 수 있는 권한을 특정 사용자에게 부여.
2. **노드 페어링**: Gateway 네트워크에 참여할 수 있는 기기(노드)를 승인.

상세 보안 모델: [Security](/gateway/security)

***

## 1) DM 페어링 (수신 채팅 접근 제어)

채널의 DM 정책이 `pairing`으로 설정된 경우, 등록되지 않은 새로운 발신자가 메시지를 보내면 8자리의 인증 코드가 전송됨. 사용자가 이 코드를 통해 승인하기 전까지 에이전트는 해당 메시지를 **처리하지 않음**.

채널별 기본 DM 정책은 [보안 가이드](/gateway/security)를 참조함.

**인증 코드 규칙:**

* 구성: 8자리 영문 대문자, 모호한 문자(`0O1I`) 제외.
* **유효 기간**: 1시간. 새로운 요청이 생성될 때만 코드가 발송됨 (발신자당 약 1시간에 1회 제한).
* **요청 제한**: 채널당 대기 중인 요청은 최대 **3개**까지만 유지됨. 초과 시 기존 요청이 만료되거나 승인될 때까지 추가 요청은 무시됨.

### 발신자 승인 방법

```bash
# Telegram 채널의 대기 목록 확인
openclaw pairing list telegram

# 특정 코드를 사용하여 승인
openclaw pairing approve telegram <CODE>
```

**지원 채널**: `telegram`, `whatsapp`, `signal`, `imessage`, `discord`, `slack`, `feishu`.

### 데이터 저장 위치

모든 상태 정보는 `~/.openclaw/credentials/` 디렉터리에 저장됨:

* **대기 중인 요청**: `<channel>-pairing.json`
* **승인된 허용 목록**:
  * 기본 계정: `<channel>-allowFrom.json`
  * 부계정: `<channel>-<accountId>-allowFrom.json`

이 파일들은 에이전트에 대한 접근 권한을 직접적으로 제어하므로 보안에 유의해야 함.

***

## 2) 노드 기기 페어링 (iOS/Android/macOS/헤드리스 노드)

노드(Nodes)는 `role: node`를 가진 **기기**로서 Gateway에 접속함. 보안을 위해 Gateway는 수신된 모든 노드 연결 시도에 대해 페어링 요청을 생성하며, 관리자의 최종 승인이 필요함.

### Telegram을 통한 간편 페어링 (iOS 권장)

`device-pair` 플러그인이 활성화된 경우, Telegram 채팅창에서 즉시 페어링을 진행할 수 있음:

1. Telegram에서 봇에게 `/pair` 메시지를 보냄.
2. 봇이 안내 문구와 함께 \*\*설정 코드(Setup code)\*\*를 전송함. (복사하기 쉬운 개별 메시지 형태)
3. 휴대폰의 OpenClaw iOS 앱 실행 → **Settings** → **Gateway** 메뉴 진입.
4. 전송받은 설정 코드를 붙여넣고 연결(Connect) 클릭.
5. 다시 Telegram 창으로 돌아와 `/pair approve`를 입력하여 최종 승인.

**설정 코드 구성**: Base64 인코딩된 JSON 데이터로, Gateway 주소(`url`)와 수명이 짧은 일회성 토큰(`token`) 정보를 포함함. 유효 기간 동안에는 비밀번호와 동일하게 취급해야 함.

### 노드 승인 및 거부 명령어

```bash
# 대기 중인 기기 요청 목록 확인
openclaw devices list

# 특정 요청 ID 승인
openclaw devices approve <requestId>

# 특정 요청 ID 거부
openclaw devices reject <requestId>
```

### 노드 페어링 상태 저장소

`~/.openclaw/devices/` 디렉터리에서 관리됨:

* `pending.json`: 대기 중인 일시적 요청 정보.
* `paired.json`: 승인 완료된 기기 정보 및 토큰 목록.

### 참고 사항

* 레거시 `node.pair.*` API (CLI: `openclaw nodes pending/approve`)는 Gateway 자체에서 관리하는 구형 저장소임. 최신 WebSocket 노드는 반드시 `openclaw devices` 명령어를 통한 기기 페어링 과정을 거쳐야 함.

## 관련 문서 목록

* **보안 모델 및 프롬프트 주입 방지**: [Security](/gateway/security)
* **안전한 업데이트 (Doctor 실행)**: [Updating](/install/updating)
* **채널별 설정 가이드**:
  * [Telegram](/channels/telegram)
  * [WhatsApp](/channels/whatsapp)
  * [Signal](/channels/signal)
  * [BlueBubbles (iMessage)](/channels/bluebubbles)
  * [iMessage (레거시)](/channels/imessage)
  * [Discord](/channels/discord)
  * [Slack](/channels/slack)
