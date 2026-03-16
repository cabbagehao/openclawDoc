---
summary: "Gateway 및 CLI를 활용한 채팅 채널 내 투표(Polls) 생성 및 관리 가이드"
description: "OpenClaw에서 Telegram, WhatsApp, Discord, MS Teams로 투표를 보내는 방법과 CLI 옵션, RPC 파라미터, 채널별 차이를 정리합니다."
read_when:
  - 투표 기능을 추가하거나 관련 설정을 수정하고자 할 때
  - CLI 또는 Gateway를 통한 투표 전송 과정의 문제를 디버깅할 때
title: "투표 (Polls)"
x-i18n:
  source_path: "automation/poll.md"
---

# 투표 (Polls)

OpenClaw는 다양한 채팅 채널에서 네이티브 투표 기능을 생성하고 관리할 수 있도록 지원함.

## 지원 채널

- **Telegram**: 네이티브 투표 기능 지원.
- **WhatsApp**: 웹 채널 기반 네이티브 투표 기능 지원.
- **Discord**: 명령어 기반 투표 생성 지원.
- **MS Teams**: 어댑티브 카드(Adaptive Cards)를 활용한 투표 구현.

## CLI 사용법

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

### 주요 옵션

- **`--channel`**: `whatsapp` (기본값), `telegram`, `discord`, `msteams` 중 선택.
- **`--poll-multi`**: 사용자가 여러 보기를 동시에 선택할 수 있도록 허용함.
- **`--poll-duration-hours`**: (Discord 전용) 투표 유지 시간 지정 (기본값: 24시간).
- **`--poll-duration-seconds`**: (Telegram 전용) 투표 유지 시간 지정 (5~600초 사이).
- **`--poll-anonymous` / `--poll-public`**: (Telegram 전용) 투표 결과 공개 여부 설정.

## Gateway RPC 명세

메서드 이름: `poll`

**파라미터:**
- `to`: (문자열, 필수) 수신 대상 ID.
- `question`: (문자열, 필수) 투표 질문 내용.
- `options`: (문자열 배열, 필수) 투표 보기 목록.
- `maxSelections`: (숫자, 선택) 최대 선택 가능 개수.
- `durationHours`: (숫자, 선택) 유지 시간 (시간).
- `durationSeconds`: (숫자, 선택, Telegram 전용) 유지 시간 (초).
- `isAnonymous`: (불리언, 선택, Telegram 전용) 익명 투표 여부.
- `channel`: (문자열, 선택, 기본값: `whatsapp`) 대상 채널.
- `idempotencyKey`: (문자열, 필수) 중복 생성 방지를 위한 멱등성 키.

## 채널별 동작 차이점

- **Telegram**: 보기(Options)는 2~10개까지 가능함. `threadId` 또는 `:topic:` 형식을 통해 포럼 주제를 지원함. 유지 시간은 초 단위(`durationSeconds`)로만 설정 가능하며 5~600초 사이로 제한됨. 익명 및 공개 투표 모드를 모두 지원함.
- **WhatsApp**: 보기는 2~12개까지 가능함. `maxSelections` 값은 보기 총합 이내여야 함. 유지 시간 설정은 무시됨.
- **Discord**: 보기는 2~10개까지 가능함. 유지 시간은 1~768시간 사이로 자동 조정(Clamp)되며 기본값은 24시간임. `maxSelections > 1` 설정 시 다중 선택이 활성화되나, 정확한 개수 제한 기능은 지원하지 않음.
- **MS Teams**: OpenClaw가 직접 관리하는 어댑티브 카드(Adaptive Card) 형태로 렌더링됨. 네이티브 투표 API를 사용하지 않으므로 유지 시간 설정은 적용되지 않음.

## 에이전트 도구 (Message)

에이전트가 투표를 생성하려면 `message` 도구 호출 시 `action: "poll"`을 사용해야 함. 

**지원 파라미터:** `to`, `pollQuestion`, `pollOption`, `pollMulti` (선택), `pollDurationHours`, `channel`.
(Telegram 전용: `pollDurationSeconds`, `pollAnonymous`, `pollPublic`)

<Note>
`action: "send"`와 함께 poll 필드를 전달하면 거부됩니다. 투표를 만들 때는
반드시 `action: "poll"`을 사용하세요.
</Note>

**특이 사항:**
- **Discord**: "정확히 N개 선택" 모드를 지원하지 않으므로 `pollMulti` 설정 시 일반 다중 선택 모드로 동작함.
- **MS Teams**: 투표 데이터는 Gateway 서버의 `~/.openclaw/msteams-polls.json` 파일에 실시간으로 기록됨. 따라서 투표가 진행되는 동안 Gateway 서버가 상시 가동 중이어야 함.
