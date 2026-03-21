---
summary: "채널별 고장 징후와 빠른 해결 방법을 모은 troubleshooting 가이드"
read_when:
  - 채널 transport는 연결되지만 reply가 실패할 때
  - 더 깊은 provider 문서를 보기 전 채널별 점검이 필요할 때
title: "Channel Troubleshooting"
description: "WhatsApp, Telegram, Discord, Slack, iMessage, Signal, Matrix에서 자주 보이는 실패 징후와 가장 빠른 점검 항목, 즉각적인 대응 방법을 정리합니다."
x-i18n:
  source_path: "channels/troubleshooting.md"
---

# 채널 문제 해결

채널은 연결되지만 동작이 잘못될 때 이 페이지를 사용하세요.

## 명령 순서

먼저 이 순서대로 실행하세요.

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

정상 기준:

- `Runtime: running`
- `RPC probe: ok`
- Channel probe에 connected/ready 표시

## WhatsApp

### WhatsApp failure signatures

| Symptom                         | Fastest check                                       | Fix                                                     |
| ------------------------------- | --------------------------------------------------- | ------------------------------------------------------- |
| Connected but no DM replies     | `openclaw pairing list whatsapp`                    | 발신자를 승인하거나 DM policy/allowlist를 바꿉니다.     |
| Group messages ignored          | config의 `requireMention` + mention pattern 확인    | bot을 mention하거나 해당 그룹의 mention policy를 완화합니다. |
| Random disconnect/relogin loops | `openclaw channels status --probe` + logs           | 다시 로그인하고 credentials directory 상태를 확인합니다. |

Full troubleshooting: [/channels/whatsapp#troubleshooting-quick](/channels/whatsapp#troubleshooting-quick)

## Telegram

### Telegram failure signatures

| Symptom                           | Fastest check                                   | Fix                                                                         |
| --------------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------- |
| `/start` but no usable reply flow | `openclaw pairing list telegram`                | pairing을 승인하거나 DM policy를 변경합니다.                                |
| Bot online but group stays silent | mention requirement와 bot privacy mode 확인     | group visibility를 위해 privacy mode를 끄거나 bot을 mention합니다.         |
| Send failures with network errors | Telegram API call failure logs 확인             | `api.telegram.org`로의 DNS/IPv6/proxy routing을 수정합니다.                 |
| Upgraded and allowlist blocks you | `openclaw security audit`와 config allowlist 확인 | `openclaw doctor --fix`를 실행하거나 `@username`을 numeric sender ID로 교체합니다. |

Full troubleshooting: [/channels/telegram#troubleshooting](/channels/telegram#troubleshooting)

## Discord

### Discord failure signatures

| Symptom                         | Fastest check                      | Fix                                                       |
| ------------------------------- | ---------------------------------- | --------------------------------------------------------- |
| Bot online but no guild replies | `openclaw channels status --probe` | guild/channel을 허용하고 message content intent를 확인합니다. |
| Group messages ignored          | logs에서 mention gating drop 확인  | bot을 mention하거나 guild/channel에 `requireMention: false`를 설정합니다. |
| DM replies missing              | `openclaw pairing list discord`    | DM pairing을 승인하거나 DM policy를 조정합니다.            |

Full troubleshooting: [/channels/discord#troubleshooting](/channels/discord#troubleshooting)

## Slack

### Slack failure signatures

| Symptom                                | Fastest check                      | Fix                                               |
| -------------------------------------- | ---------------------------------- | ------------------------------------------------- |
| Socket mode connected but no responses | `openclaw channels status --probe` | app token + bot token과 필요한 scope를 확인합니다. |
| DMs blocked                            | `openclaw pairing list slack`      | pairing을 승인하거나 DM policy를 완화합니다.       |
| Channel message ignored                | `groupPolicy`와 channel allowlist 확인 | channel을 허용하거나 policy를 `open`으로 바꿉니다. |

Full troubleshooting: [/channels/slack#troubleshooting](/channels/slack#troubleshooting)

## iMessage and BlueBubbles

### iMessage and BlueBubbles failure signatures

| Symptom                          | Fastest check                                                           | Fix                                                   |
| -------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------- |
| No inbound events                | webhook/server reachability와 app permission 확인                       | webhook URL 또는 BlueBubbles server 상태를 수정합니다. |
| Can send but no receive on macOS | Messages automation용 macOS privacy permission 확인                     | TCC 권한을 다시 부여하고 channel process를 재시작합니다. |
| DM sender blocked                | `openclaw pairing list imessage` 또는 `openclaw pairing list bluebubbles` | pairing을 승인하거나 allowlist를 갱신합니다.          |

Full troubleshooting:

- [/channels/imessage#troubleshooting-macos-privacy-and-security-tcc](/channels/imessage#troubleshooting-macos-privacy-and-security-tcc)
- [/channels/bluebubbles#troubleshooting](/channels/bluebubbles#troubleshooting)

## Signal

### Signal failure signatures

| Symptom                         | Fastest check                      | Fix                                                      |
| ------------------------------- | ---------------------------------- | -------------------------------------------------------- |
| Daemon reachable but bot silent | `openclaw channels status --probe` | `signal-cli` daemon URL/account와 receive mode를 확인합니다. |
| DM blocked                      | `openclaw pairing list signal`     | 발신자를 승인하거나 DM policy를 조정합니다.               |
| Group replies do not trigger    | group allowlist와 mention pattern 확인 | sender/group을 추가하거나 gating을 완화합니다.          |

Full troubleshooting: [/channels/signal#troubleshooting](/channels/signal#troubleshooting)

## Matrix

### Matrix failure signatures

| Symptom                             | Fastest check                      | Fix                                             |
| ----------------------------------- | ---------------------------------- | ----------------------------------------------- |
| Logged in but ignores room messages | `openclaw channels status --probe` | `groupPolicy`와 room allowlist를 확인합니다.     |
| DMs do not process                  | `openclaw pairing list matrix`     | 발신자를 승인하거나 DM policy를 조정합니다.      |
| Encrypted rooms fail                | crypto module과 encryption setting 확인 | encryption 지원을 활성화하고 room을 다시 join/sync합니다. |

Full troubleshooting: [/channels/matrix#troubleshooting](/channels/matrix#troubleshooting)
