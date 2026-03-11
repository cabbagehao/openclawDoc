---
summary: "Gateway + CLI를 통한 poll 전송"
read_when:
  - poll 지원을 추가하거나 수정할 때
  - CLI 또는 gateway에서 poll 전송을 디버깅할 때
title: "폴링"
x-i18n:
  source_path: "automation/poll.md"
---

# 폴링

## 지원 채널

- Telegram
- WhatsApp (web 채널)
- Discord
- MS Teams (Adaptive Cards)

## CLI

```bash
# Telegram
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300

# WhatsApp
openclaw message poll --target +15555550123 \
  --poll-question "Lunch today?" --poll-option "Yes" --poll-option "No" --poll-option "Maybe"
openclaw message poll --target 123456789@g.us \
  --poll-question "Meeting time?" --poll-option "10am" --poll-option "2pm" --poll-option "4pm" --poll-multi

# Discord
openclaw message poll --channel discord --target channel:123456789 \
  --poll-question "Snack?" --poll-option "Pizza" --poll-option "Sushi"
openclaw message poll --channel discord --target channel:123456789 \
  --poll-question "Plan?" --poll-option "A" --poll-option "B" --poll-duration-hours 48

# MS Teams
openclaw message poll --channel msteams --target conversation:19:abc@thread.tacv2 \
  --poll-question "Lunch?" --poll-option "Pizza" --poll-option "Sushi"
```

옵션:

- `--channel`: `whatsapp`(기본값), `telegram`, `discord`, `msteams`
- `--poll-multi`: 여러 옵션 선택 허용
- `--poll-duration-hours`: Discord 전용(생략 시 기본값 24)
- `--poll-duration-seconds`: Telegram 전용(5-600초)
- `--poll-anonymous` / `--poll-public`: Telegram 전용 poll 공개 범위

## Gateway RPC

메서드: `poll`

파라미터:

- `to` (string, 필수)
- `question` (string, 필수)
- `options` (string[], 필수)
- `maxSelections` (number, 선택)
- `durationHours` (number, 선택)
- `durationSeconds` (number, 선택, Telegram 전용)
- `isAnonymous` (boolean, 선택, Telegram 전용)
- `channel` (string, 선택, 기본값: `whatsapp`)
- `idempotencyKey` (string, 필수)

## 채널별 차이

- Telegram: 옵션 2-10개. `threadId` 또는 `:topic:` 대상 형식으로 forum topic을 지원합니다. `durationHours` 대신 `durationSeconds`를 쓰며 5-600초로 제한됩니다. 익명 poll과 공개 poll을 지원합니다.
- WhatsApp: 옵션 2-12개. `maxSelections`는 옵션 개수 이내여야 하며 `durationHours`는 무시됩니다.
- Discord: 옵션 2-10개. `durationHours`는 1-768시간 범위로 clamp되며 기본값은 24입니다. `maxSelections > 1`이면 다중 선택이 활성화됩니다. Discord는 정확히 N개를 선택하게 강제하는 모드를 지원하지 않습니다.
- MS Teams: Adaptive Card 기반 poll(OpenClaw 관리). 기본 poll API는 없으며 `durationHours`는 무시됩니다.

## 에이전트 도구(Message)

`message` 도구에서 `poll` 액션을 사용하세요(`to`, `pollQuestion`, `pollOption`, 선택적 `pollMulti`, `pollDurationHours`, `channel`).

Telegram의 경우 `pollDurationSeconds`, `pollAnonymous`, `pollPublic`도 받을 수 있습니다.

poll 생성에는 `action: "poll"`을 사용합니다. `action: "send"`와 함께 poll 필드를 넘기면 거부됩니다.

참고: Discord에는 “정확히 N개 선택” 모드가 없으므로 `pollMulti`는 다중 선택으로 매핑됩니다.
Teams poll은 Adaptive Card로 렌더링되며, 투표를 `~/.openclaw/msteams-polls.json`에 기록하려면 게이트웨이가 온라인 상태를 유지해야 합니다.
