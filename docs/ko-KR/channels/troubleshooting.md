---
summary: "채널 수준에서 빠르게 점검하는 문제 해결 가이드와 채널별 대표 증상/수정 방법"
read_when:
  - 채널 transport는 연결됐는데 응답 동작이 이상할 때
  - 깊은 provider 문서로 들어가기 전에 채널별 점검이 필요할 때
title: "채널 문제 해결"
x-i18n:
  source_path: "channels/troubleshooting.md"
---

# 채널 문제 해결

채널은 연결되지만 동작이 잘못될 때 이 페이지를 사용하세요.

## 명령 사다리

먼저 아래 순서대로 실행하세요.

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

정상 기준선:

- `Runtime: running`
- `RPC probe: ok`
- 채널 probe가 connected/ready를 보여 줌

## WhatsApp

### WhatsApp 대표 증상

| 증상                          | 가장 빠른 점검                                   | 해결책                                                  |
| ----------------------------- | ------------------------------------------------ | ------------------------------------------------------- |
| 연결됐지만 DM 응답이 없음     | `openclaw pairing list whatsapp`                 | 발신자를 승인하거나 DM 정책/allowlist를 바꾸세요.       |
| 그룹 메시지를 무시함          | config의 `requireMention` + mention pattern 확인 | 봇을 멘션하거나 해당 그룹의 mention 정책을 완화하세요.  |
| 랜덤하게 끊기고 재로그인 반복 | `openclaw channels status --probe` + 로그        | 다시 로그인하고 credentials 디렉터리 상태를 확인하세요. |

전체 문제 해결: [/channels/whatsapp#troubleshooting-quick](/channels/whatsapp#troubleshooting-quick)

## Telegram

### Telegram 대표 증상

| 증상                                       | 가장 빠른 점검                                    | 해결책                                                                        |
| ------------------------------------------ | ------------------------------------------------- | ----------------------------------------------------------------------------- |
| `/start`는 되지만 usable reply 흐름이 없음 | `openclaw pairing list telegram`                  | pairing을 승인하거나 DM 정책을 바꾸세요.                                      |
| 봇은 온라인인데 그룹에서 조용함            | mention requirement와 bot privacy mode 확인       | 그룹 가시성을 위해 privacy mode를 끄거나 봇을 멘션하세요.                     |
| 전송이 network error와 함께 실패           | Telegram API 호출 실패 로그 확인                  | `api.telegram.org`로 가는 DNS/IPv6/proxy 라우팅을 고치세요.                   |
| 업그레이드 후 allowlist가 나를 막음        | `openclaw security audit`와 config allowlist 확인 | `openclaw doctor --fix`를 실행하거나 `@username`을 숫자 sender ID로 바꾸세요. |

전체 문제 해결: [/channels/telegram#troubleshooting](/channels/telegram#troubleshooting)

## Discord

### Discord 대표 증상

| 증상                              | 가장 빠른 점검                     | 해결책                                                                |
| --------------------------------- | ---------------------------------- | --------------------------------------------------------------------- |
| 봇은 온라인인데 guild 응답이 없음 | `openclaw channels status --probe` | guild/channel을 허용하고 message content intent를 확인하세요.         |
| 그룹 메시지를 무시함              | mention gating drop 로그 확인      | 봇을 멘션하거나 guild/channel에 `requireMention: false`를 설정하세요. |
| DM 응답이 없음                    | `openclaw pairing list discord`    | DM pairing을 승인하거나 DM 정책을 조정하세요.                         |

전체 문제 해결: [/channels/discord#troubleshooting](/channels/discord#troubleshooting)

## Slack

### Slack 대표 증상

| 증상                                 | 가장 빠른 점검                         | 해결책                                             |
| ------------------------------------ | -------------------------------------- | -------------------------------------------------- |
| Socket mode는 연결됐지만 응답이 없음 | `openclaw channels status --probe`     | app token + bot token과 필요한 scope를 확인하세요. |
| DM이 차단됨                          | `openclaw pairing list slack`          | pairing을 승인하거나 DM 정책을 완화하세요.         |
| 채널 메시지가 무시됨                 | `groupPolicy`와 channel allowlist 확인 | 채널을 허용하거나 정책을 `open`으로 바꾸세요.      |

전체 문제 해결: [/channels/slack#troubleshooting](/channels/slack#troubleshooting)

## iMessage와 BlueBubbles

### iMessage와 BlueBubbles 대표 증상

| 증상                                  | 가장 빠른 점검                                                            | 해결책                                                 |
| ------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------ |
| 인바운드 이벤트가 없음                | webhook/server 도달 가능성과 앱 권한 확인                                 | webhook URL 또는 BlueBubbles 서버 상태를 수정하세요.   |
| macOS에서 보낼 수는 있지만 수신 안 됨 | Messages automation용 macOS privacy permission 확인                       | TCC 권한을 다시 부여하고 채널 프로세스를 재시작하세요. |
| DM 발신자가 차단됨                    | `openclaw pairing list imessage` 또는 `openclaw pairing list bluebubbles` | pairing을 승인하거나 allowlist를 업데이트하세요.       |

전체 문제 해결:

- [/channels/imessage#troubleshooting-macos-privacy-and-security-tcc](/channels/imessage#troubleshooting-macos-privacy-and-security-tcc)
- [/channels/bluebubbles#troubleshooting](/channels/bluebubbles#troubleshooting)

## Signal

### Signal 대표 증상

| 증상                              | 가장 빠른 점검                         | 해결책                                                       |
| --------------------------------- | -------------------------------------- | ------------------------------------------------------------ |
| daemon에는 도달하지만 봇이 조용함 | `openclaw channels status --probe`     | `signal-cli` daemon URL/account와 receive mode를 확인하세요. |
| DM이 차단됨                       | `openclaw pairing list signal`         | 발신자를 승인하거나 DM 정책을 조정하세요.                    |
| 그룹 응답이 트리거되지 않음       | group allowlist와 mention pattern 확인 | 발신자/그룹을 추가하거나 gating을 완화하세요.                |

전체 문제 해결: [/channels/signal#troubleshooting](/channels/signal#troubleshooting)

## Matrix

### Matrix 대표 증상

| 증상                              | 가장 빠른 점검                       | 해결책                                                 |
| --------------------------------- | ------------------------------------ | ------------------------------------------------------ |
| 로그인됐지만 room 메시지를 무시함 | `openclaw channels status --probe`   | `groupPolicy`와 room allowlist를 확인하세요.           |
| DM이 처리되지 않음                | `openclaw pairing list matrix`       | 발신자를 승인하거나 DM 정책을 조정하세요.              |
| 암호화된 room이 실패함            | crypto module과 encryption 설정 확인 | encryption support를 켜고 room을 다시 join/sync하세요. |

전체 문제 해결: [/channels/matrix#troubleshooting](/channels/matrix#troubleshooting)
