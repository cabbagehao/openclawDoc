---
summary: "Slack 앱 설정 방법 및 운영 방식 안내 (소켓 모드 및 HTTP 이벤트 API 지원)"
read_when:
  - Slack 채널을 초기 설정하거나 소켓/HTTP 모드 관련 문제를 디버깅할 때
title: "Slack"
x-i18n:
  source_path: "channels/slack.md"
---

# Slack

**상태**: Slack 앱 통합을 통해 개인 대화(DM) 및 채널 연동이 가능한 운영 준비 단계임. 기본값으로 **소켓 모드(Socket Mode)**를 사용하며, **HTTP 이벤트 API** 모드도 지원함.

<CardGroup cols={3}>
  <Card title="페어링" icon="link" href="/channels/pairing">
    Slack DM은 기본적으로 페어링 모드로 작동함.
  </Card>
  <Card title="슬래시 명령어" icon="terminal" href="/tools/slash-commands">
    네이티브 명령어 동작 방식 및 목록 안내.
  </Card>
  <Card title="채널 문제 해결" icon="wrench" href="/channels/troubleshooting">
    채널 전반의 진단 및 복구 가이드.
  </Card>
</CardGroup>

## 빠른 설정 가이드

<Tabs>
  <Tab title="소켓 모드 (권장 기본값)">
    <Steps>
      <Step title="Slack 앱 및 토큰 생성">
        Slack 앱 설정 페이지에서:
        - **Socket Mode** 기능을 활성화함.
        - `connections:write` 권한이 포함된 **앱 토큰(App Token)** (`xapp-...`)을 생성함.
        - 앱을 설치한 후 **봇 토큰(Bot Token)** (`xoxb-...`)을 복사함.
      </Step>

      <Step title="OpenClaw 구성">
```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      appToken: "xapp-...",
      botToken: "xoxb-...",
    },
  },
}
```
환경 변수 사용 (기본 계정 전용):
```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```
      </Step>

      <Step title="앱 이벤트 구독">
        봇 이벤트 항목에서 다음을 구독함:
        - `app_mention`
        - `message.channels`, `message.groups`, `message.im`, `message.mpim`
        - `reaction_added`, `reaction_removed`
        - `member_joined_channel`, `member_left_channel`
        - `channel_rename`
        - `pin_added`, `pin_removed`

        또한 DM 수신을 위해 **App Home** 설정에서 **Messages Tab**을 활성화함.
      </Step>

      <Step title="Gateway 시작">
```bash
openclaw gateway
```
      </Step>
    </Steps>
  </Tab>

  <Tab title="HTTP 이벤트 API 모드">
    <Steps>
      <Step title="Slack 앱을 HTTP 모드로 전환">
        - 설정을 HTTP 모드로 지정함 (`channels.slack.mode="http"`).
        - Slack **서명 시크릿(Signing Secret)**을 복사함.
        - Event Subscriptions, Interactivity, Slash command의 Request URL을 모두 동일한 웹훅 경로(기본값 `/slack/events`)로 설정함.
      </Step>

      <Step title="OpenClaw HTTP 모드 설정">
```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      botToken: "xoxb-...",
      signingSecret: "your-signing-secret",
      webhookPath: "/slack/events",
    },
  },
}
```
      </Step>

      <Step title="다중 계정 웹훅 경로">
        각 계정마다 고유한 `webhookPath`를 지정하여 등록 정보가 충돌하지 않도록 관리함.
      </Step>
    </Steps>
  </Tab>
</Tabs>

## 토큰 모델 및 권한

- 소켓 모드: `botToken` + `appToken` 필수.
- HTTP 모드: `botToken` + `signingSecret` 필수.
- 설정 파일의 토큰은 환경 변수 설정보다 우선함.
- `userToken` (`xoxp-...`)은 설정 파일에서만 지정 가능하며, 기본적으로 읽기 전용(`userTokenReadOnly: true`)임.
- **아이덴티티 커스터마이징**: 발신 메시지에 에이전트 고유의 이름과 아이콘을 사용하려면 `chat:write.customize` 권한을 추가함.

<Tip>
액션 실행이나 디렉터리 조회 시 사용자 토큰이 설정되어 있다면 이를 우선 사용함. 메시지 발신(쓰기)은 여전히 봇 토큰을 우선하며, 사용자 토큰 기반 쓰기는 봇 토큰을 사용할 수 없고 `userTokenReadOnly: false`인 경우에만 허용됨.
</Tip>

## 접근 제어 및 라우팅

### DM 정책
`channels.slack.dmPolicy` 설정을 통해 제어함:
- **`pairing`** (기본값): 승인 전까지 메시지 무시.
- **`allowlist`**: 지정된 사용자만 허용.
- **`open`**: 모든 사용자 허용 (`allowFrom: ["*"]` 필요).
- **`disabled`**: DM 기능 비활성화.

### 채널 정책
`channels.slack.groupPolicy` 설정을 통해 제어함:
- **`open`**: 모든 채널 메시지 수락. (멘션 게이팅은 유지됨)
- **`allowlist`**: `channels.slack.channels`에 등록된 채널만 허용.
- **이름 해석**: 시작 시 채널명이나 사용자명을 실제 ID로 자동 변환함. 정확한 매칭이 필요할 경우 `dangerouslyAllowNameMatching: true` 설정이 필요함.

### 멘션 및 사용자 필터링
채널 메시지는 기본적으로 **멘션 게이팅(Mention-gated)**이 적용됨:
- 앱 직접 멘션 (`<@봇ID>`)
- 정규표현식 패턴 매칭 (`mentionPatterns`)
- 봇의 답변에 대한 스레드 답장

## 스레딩 및 세션 관리

- **DM**: 에이전트 메인 세션으로 통합 (`session.dmScope=main` 기준).
- **채널**: 각 채널별로 고유 세션 키 할당 (`agent:<agentId>:slack:channel:<channelId>`).
- **스레드**: 필요한 경우 스레드별 세션 접미사(`:thread:<ts>`)를 생성하여 맥락을 격리함.
- **이력 관리**: 새 스레드 세션 시작 시 기존 스레드 메시지 20개를 자동으로 가져옴 (`initialHistoryLimit`).

### 답장 스레드 설정
`replyToMode` 옵션(`off`, `first`, `all`)을 통해 제어함.
<Note>
Slack에서 `replyToMode="off"` 설정 시 명시적인 `[[reply_to_*]]` 태그를 사용하더라도 모든 스레딩 처리가 중단됨. 이는 스레드가 메시지를 채널 흐름에서 숨기는 Slack 특유의 구조를 고려한 동작임.
</Note>

## 미디어 처리 및 전달

- **수신 첨부 파일**: 토큰 인증 과정을 거쳐 Slack 전용 URL에서 파일을 다운로드함. 최대 용량 제한은 `mediaMaxMb` (기본 20MB) 설정을 따름.
- **발신 메시지**: 최대 4,000자 단위로 자동 청킹(Chunking)됨. `chunkMode="newline"` 설정 시 문단 단위 분할을 우선함.
- **대상 지정**: `user:<id>` (DM), `channel:<id>` (채널) 형식을 권장함.

## 이벤트 및 인터랙션

- 메시지 수정/삭제 및 리액션 추가/제거 이벤트를 시스템 이벤트로 수신함.
- **입력 중 표시**: 스레드 내 실시간 상태 업데이트를 위해 `assistant:write` 권한이 필요함.
- **대화형 컴포넌트**: 블록 액션 및 모달 상호작용 결과를 구조화된 시스템 이벤트로 에이전트에게 전달함.

## 확인 및 상태 리액션 (Ack/Typing)

- **확인 리액션 (`ackReaction`)**: 메시지 수신 시 즉시 표시할 이모지 지정 (예: `"eyes"`).
- **입력 중 리액션 (`typingReaction`)**: 답변 생성 중 임시로 표시할 이모지 지정 (예: `"hourglass_flowing_sand"`). 완료 후 자동 삭제됨.

---

## 텍스트 스트리밍 (Text Streaming)

OpenClaw는 Slack의 네이티브 **Agents and AI Apps API**를 통한 실시간 텍스트 스트리밍을 지원함.

**활성화 조건:**
1. Slack 앱 설정에서 **Agents and AI Apps** 기능 활성화.
2. 앱에 `assistant:write` 권한 부여.
3. 스레드 답장 환경 보장.

**동작 방식 (`streaming: "partial"`):**
- 첫 번째 조각 수신 시 스트림 시작 (`chat.startStream`).
- 후속 조각들을 기존 스트림에 덧붙임 (`chat.appendStream`).
- 답변 종료 시 스트림 확정 (`chat.stopStream`).
- 미디어나 비텍스트 데이터는 일반 전송 방식으로 폴백됨.

상세 설정 스키마 및 전체 옵션은 [Gateway 설정 가이드](/gateway/configuration)를 참조함.
