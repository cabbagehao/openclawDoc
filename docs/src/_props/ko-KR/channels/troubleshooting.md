---
summary: "채널별 주요 오류 패턴과 즉각적인 해결 방법을 담은 빠른 문제 해결 가이드"
read_when:
  - 채널 연결은 성공했으나 응답이나 수신 동작이 비정상적일 때
  - 상세한 공급자 문서를 확인하기 전 채널 레벨의 기본 점검이 필요할 때
title: "채널 문제 해결"
x-i18n:
  source_path: "channels/troubleshooting.md"
---

# 채널 문제 해결 (Channel Troubleshooting)

채널 연결은 유지되고 있으나 의도한 대로 동작하지 않을 때 이 가이드를 참조함.

## 단계별 점검 명령어 (Command Ladder)

문제가 발생하면 다음 명령어들을 순서대로 실행하여 상태를 확인함:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

**정상 상태 기준:**

* **Runtime**: `running`
* **RPC probe**: `ok`
* **Channel probe**: 연결됨(Connected) 또는 준비됨(Ready) 상태 표시.

***

## WhatsApp

### 주요 오류 패턴 및 해결책

| 증상                  | 즉시 점검 항목                                   | 해결 방법                                         |
| :------------------ | :----------------------------------------- | :-------------------------------------------- |
| 연결되었으나 DM 응답 없음     | `openclaw pairing list whatsapp`           | 발신자를 승인하거나 DM 정책 및 허용 목록을 수정함.                |
| 그룹 메시지 무시 현상        | 설정 내 `requireMention` 및 멘션 패턴 확인           | 봇을 명시적으로 @멘션하거나 해당 그룹의 멘션 필수 설정을 해제함.         |
| 잦은 연결 끊김 또는 재로그인 반복 | `openclaw channels status --probe` 및 로그 분석 | 다시 로그인을 수행하고 자격 증명(Credentials) 디렉터리 권한을 확인함. |

상세 가이드: [/channels/whatsapp#troubleshooting-quick](/channels/whatsapp#troubleshooting-quick)

***

## Telegram

### 주요 오류 패턴 및 해결책

| 증상                     | 즉시 점검 항목                             | 해결 방법                                               |
| :--------------------- | :----------------------------------- | :-------------------------------------------------- |
| `/start` 입력 후 응답 흐름 없음 | `openclaw pairing list telegram`     | 페어링을 승인하거나 DM 정책 설정을 변경함.                           |
| 온라인 상태이나 그룹에서 무응답      | 멘션 필수 설정 및 봇 **Privacy Mode** 확인     | 그룹 메시지 수신을 위해 개인정보 보호 모드를 끄거나 봇을 멘션함.               |
| 네트워크 에러와 함께 발신 실패      | Telegram API 호출 실패 로그 확인             | `api.telegram.org`로의 DNS, IPv6 또는 프록시 라우팅 설정을 수정함.  |
| 업데이트 후 허용 목록 차단 발생     | `openclaw security audit` 및 허용 목록 점검 | `openclaw doctor --fix`를 실행하거나 `@사용자명`을 숫자 ID로 교체함. |

상세 가이드: [/channels/telegram#troubleshooting](/channels/telegram#troubleshooting)

***

## Discord

### 주요 오류 패턴 및 해결책

| 증상                | 즉시 점검 항목                           | 해결 방법                                              |
| :---------------- | :--------------------------------- | :------------------------------------------------- |
| 온라인 상태이나 서버 응답 없음 | `openclaw channels status --probe` | 서버/채널 허용 여부 및 **Message Content Intent** 활성화를 확인함. |
| 그룹 메시지 무시 현상      | 로그에서 멘션 게이팅 필터링 기록 확인              | 봇을 멘션하거나 해당 채널에 `requireMention: false`를 설정함.      |
| DM 응답 누락          | `openclaw pairing list discord`    | DM 페어링을 승인하거나 DM 정책 설정을 조정함.                       |

상세 가이드: [/channels/discord#troubleshooting](/channels/discord#troubleshooting)

***

## Slack

### 주요 오류 패턴 및 해결책

| 증상               | 즉시 점검 항목                           | 해결 방법                                  |
| :--------------- | :--------------------------------- | :------------------------------------- |
| 소켓 모드 연결 후 응답 없음 | `openclaw channels status --probe` | 앱 토큰, 봇 토큰 및 필수 권한 범위(Scopes) 설정을 확인함. |
| DM 차단 현상         | `openclaw pairing list slack`      | 페어링을 승인하거나 DM 정책 제한을 완화함.              |
| 채널 메시지 무시 현상     | `groupPolicy` 및 채널 허용 목록 확인        | 채널을 허용 목록에 추가하거나 정책을 `"open"`으로 변경함.   |

상세 가이드: [/channels/slack#troubleshooting](/channels/slack#troubleshooting)

***

## iMessage 및 BlueBubbles

### 주요 오류 패턴 및 해결책

| 증상                 | 즉시 점검 항목                                    | 해결 방법                                   |
| :----------------- | :------------------------------------------ | :-------------------------------------- |
| 수신 이벤트 발생 안 함      | 웹훅 및 서버 도달 가능성, 앱 권한 확인                     | 웹훅 URL 주소 또는 BlueBubbles 서버 가동 상태를 수정함. |
| 발신은 되나 macOS 수신 불가 | **Messages** 자동화 관련 macOS 개인정보 보호 권한 확인     | TCC 권한을 다시 부여하고 채널 프로세스를 재시작함.          |
| DM 발신자 차단 현상       | `pairing list imessage` 또는 `bluebubbles` 확인 | 페어링 요청을 승인하거나 허용 목록을 업데이트함.             |

상세 가이드:

* [/channels/imessage#troubleshooting-macos-privacy-and-security-tcc](/channels/imessage#troubleshooting-macos-privacy-and-security-tcc)
* [/channels/bluebubbles#troubleshooting](/channels/bluebubbles#troubleshooting)

***

## Signal

### 주요 오류 패턴 및 해결책

| 증상               | 즉시 점검 항목                           | 해결 방법                                    |
| :--------------- | :--------------------------------- | :--------------------------------------- |
| 데몬 접속은 되나 봇이 무응답 | `openclaw channels status --probe` | `signal-cli` 데몬 URL, 계정 설정 및 수신 모드를 확인함. |
| DM 차단 현상         | `openclaw pairing list signal`     | 발신자 페어링을 승인하거나 DM 정책을 조정함.               |
| 그룹 응답 트리거 안 됨    | 그룹 허용 목록 및 멘션 패턴 확인                | 발신자/그룹을 허용 목록에 추가하거나 게이팅 설정을 완화함.        |

상세 가이드: [/channels/signal#troubleshooting](/channels/signal#troubleshooting)

***

## Matrix

### 주요 오류 패턴 및 해결책

| 증상                | 즉시 점검 항목                           | 해결 방법                                  |
| :---------------- | :--------------------------------- | :------------------------------------- |
| 로그인 상태이나 룸 메시지 무시 | `openclaw channels status --probe` | `groupPolicy` 및 룸(Room) 허용 목록 설정을 확인함. |
| DM 처리 불가          | `openclaw pairing list matrix`     | 발신자 페어링을 승인하거나 DM 정책을 조정함.             |
| 암호화된 룸 연동 실패      | 크립토 모듈 및 암호화 설정 확인                 | 암호화 지원 기능을 활성화하고 해당 룸에 다시 참여하거나 동기화함.  |

상세 가이드: [/channels/matrix#troubleshooting](/channels/matrix#troubleshooting)
