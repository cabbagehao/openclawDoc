---
summary: "BlueBubbles macOS 서버를 통한 iMessage 연동 (REST 송수신, 입력 중 상태 표시, 리액션, 페어링 및 고급 액션 지원)"
read_when:
  - BlueBubbles 채널을 설정하고자 할 때
  - 웹훅 페어링 관련 문제를 디버깅할 때
  - macOS 환경에서 iMessage 연동을 구성할 때
title: "BlueBubbles"
x-i18n:
  source_path: "channels/bluebubbles.md"
---

# BlueBubbles (macOS REST)

**상태**: BlueBubbles macOS 서버와 HTTP로 통신하는 내장 플러그인임. 레거시 `imsg` 채널보다 API가 풍부하고 설정이 간편하여 **iMessage 통합 시 가장 권장되는 방식**임.

## 주요 특징

- **실행 환경**: macOS에서 실행되는 BlueBubbles 헬퍼 앱([bluebubbles.app](https://bluebubbles.app))이 필요함.
- **지원 버전**: macOS Sequoia (15) 환경에서 최적화 및 테스트 완료. macOS Tahoe (26) 환경에서도 작동하나, 현재 Tahoe에서는 메시지 수정(Edit) 기능이 작동하지 않으며 그룹 아이콘 업데이트가 정상적으로 동기화되지 않을 수 있음.
- **통신 방식**: OpenClaw는 REST API(`GET /api/v1/ping`, `POST /message/text` 등)를 통해 서버와 대화함.
- **메시지 흐름**: 수신 메시지는 웹훅(Webhooks)을 통해 유입되며, 발신 응답, 입력 중 표시, 읽음 확인, 탭백(Tapbacks) 등은 REST 호출로 처리됨.
- **미디어 처리**: 첨부 파일 및 스티커는 인바운드 미디어로 수집되어 에이전트가 인식할 수 있음.
- **보안 제어**: 다른 채널과 동일하게 `channels.bluebubbles.allowFrom` 설정 및 페어링 코드를 통한 허용 목록 관리를 지원함.
- **고급 기능**: 메시지 수정, 전송 취소, 답장 스레드, 메시지 효과, 그룹 관리 기능을 포함함.

## 빠른 시작 가이드

1. Mac에 BlueBubbles 서버를 설치함 ([설치 가이드](https://bluebubbles.app/install) 참조).
2. BlueBubbles 설정에서 **Web API**를 활성화하고 비밀번호를 설정함.
3. `openclaw onboard` 명령어를 실행하여 BlueBubbles를 선택하거나, 아래와 같이 `openclaw.json` 파일에 수동으로 설정을 추가함:

   ```json5
   {
     channels: {
       bluebubbles: {
         enabled: true,
         serverUrl: "http://192.168.1.100:1234",
         password: "your-api-password",
         webhookPath: "/bluebubbles-webhook",
       },
     },
   }
   ```

4. BlueBubbles 웹훅 설정 페이지에서 대상 URL을 사용자 Gateway 주소로 지정함 (예: `https://your-gateway:3000/bluebubbles-webhook?password=<password>`).
5. Gateway를 시작하면 웹훅 핸들러가 등록되고 페어링 프로세스가 시작됨.

<Warning>
**보안 주의**:
- 항상 웹훅 비밀번호를 설정해야 함.
- OpenClaw는 `channels.bluebubbles.password`와 일치하는 인증 정보가 없는 웹훅 요청을 즉시 거부함.
- 비밀번호 인증은 웹훅 본문(Body) 전체를 읽기 전 단계에서 수행되어 시스템 부하를 최소화함.
</Warning>

## Messages.app 활성 상태 유지 (가상머신/헤드리스 환경)

가상머신이나 상시 가동 환경에서 Messages.app이 유휴(Idle) 상태로 전환되어 메시지 수신이 멈추는 경우가 있음. 이를 방지하기 위해 5분마다 앱을 깨우는 AppleScript와 LaunchAgent 설정을 권장함.

### 1. AppleScript 저장
`~/Scripts/poke-messages.scpt` 경로에 다음 내용을 저장함 (포커스를 뺏지 않는 비대화형 방식):

```applescript
try
  tell application "Messages"
    if not running then
      launch
    end if
    -- 스크립팅 인터페이스를 호출하여 프로세스 반응성을 유지함
    set _chatCount to (count of chats)
  end tell
on error
  -- 일시적인 오류(잠금 세션 등)는 무시함
end try
```

### 2. LaunchAgent 설치
`~/Library/LaunchAgents/com.user.poke-messages.plist` 경로에 저장함:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>Label</key>
    <string>com.user.poke-messages</string>
    <key>ProgramArguments</key>
    <array>
      <string>/bin/bash</string>
      <string>-lc</string>
      <string>/usr/bin/osascript &quot;$HOME/Scripts/poke-messages.scpt&quot;</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>StartInterval</key>
    <integer>300</integer>
  </dict>
</plist>
```

설정 후 다음 명령어로 로드함:
```bash
launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
```

## 접근 제어 (DM 및 그룹)

- **개인 대화(DM)**: 기본값은 `"pairing"` 모드임. 승인되지 않은 발신자에게는 페어링 코드가 전송되며, `openclaw pairing approve bluebubbles <code>` 명령어로 승인하기 전까지 메시지는 무시됨.
- **그룹 대화**: `groupPolicy`를 통해 `open`, `allowlist`, `disabled` 중 선택 가능함 (기본값: `allowlist`).

### 멘션 게이팅 (Mention Gating)
그룹 대화에서 에이전트가 본인의 이름이 불렸을 때만 응답하도록 설정할 수 있음:
- `requireMention` 활성화 시 멘션이 포함된 메시지에만 반응함.
- 승인된 사용자가 보내는 제어 명령어(/...)는 멘션 없이도 즉시 실행됨.

## 고급 액션 (Advanced Actions)

BlueBubbles는 다음과 같은 다양한 메시지 조작 기능을 지원함:

- **탭백(react)**: 메시지에 리액션 추가 또는 제거.
- **메시지 수정(edit)**: 이미 전송된 메시지 내용 변경 (macOS 13 이상 필요).
- **전송 취소(unsend)**: 메시지 발송 취소.
- **답장 스레드(reply)**: 특정 메시지 GUID를 지정하여 스레드 답장 생성.
- **메시지 효과(sendWithEffect)**: 슬램, 강하게 등 iMessage 전용 시각 효과 적용.
- **그룹 관리**: 그룹 이름 변경, 아이콘 설정, 참여자 추가/제거 및 퇴장 기능.

### 짧은 메시지 ID vs 전체 ID
토큰 절약을 위해 에이전트에게는 `1`, `2`와 같은 짧은 ID가 노출될 수 있음. 자동화나 장기 저장을 위해서는 `{{MessageSidFull}}`과 같은 전체 공급자 ID를 사용할 것을 권장함.

## 설정 레퍼런스

- `sendReadReceipts`: 읽음 확인(Read Receipt) 전송 여부 (기본값: `true`).
- `blockStreaming`: 응답을 의미 있는 블록 단위로 나누어 실시간 전송 (기본값: `false`).
- `textChunkLimit`: 한 번에 전송할 최대 글자 수 (기본값: 4000자).
- `mediaMaxMb`: 수발신 미디어 파일의 최대 용량 제한 (기본값: 8MB).
- `mediaLocalRoots`: 로컬 파일 전송을 허용할 디렉터리 경로 목록.

상세 설정 스키마는 [Gateway 설정 가이드](/gateway/configuration)를 참조함.

## 문제 해결 (Troubleshooting)

- **입력 중 표시가 작동하지 않음**: BlueBubbles 웹훅 로그를 확인하고 Gateway의 웹훅 경로 설정이 일치하는지 점검함.
- **리액션 실패**: 서버 설정에서 **Private API** 기능이 활성화되어 있는지 확인함.
- **Tahoe(26) 이슈**: 최신 macOS 버전에서의 비공식 API 변경으로 인해 메시지 수정 기능 등이 불안정할 수 있음. 문제가 지속될 경우 `actions.edit=false` 설정을 통해 해당 기능을 수동으로 비활성화함.
- **상태 확인**: `openclaw status --deep` 명령어로 실시간 연결 상태를 정밀 진단함.
