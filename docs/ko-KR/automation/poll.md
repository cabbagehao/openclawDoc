---
summary: "Gateway 및 CLI를 활용한 채팅 채널 내 투표(Polls) 생성 및 관리 가이드"
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
# Telegram: 기본 투표 생성
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "오늘 배포할까요?" --poll-option "예" --poll-option "아니요"

# Telegram: 특정 주제(Topic)에 시간 제한이 있는 투표 생성
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "회의 시간 선택" --poll-option "오전 10시" --poll-option "오후 2시" \
  --poll-duration-seconds 300

# WhatsApp: 개인 대화방에 투표 생성
openclaw message poll --target +821012345678 \
  --poll-question "오늘 점심 메뉴?" --poll-option "한식" --poll-option "중식" --poll-option "일식"

# WhatsApp: 그룹 대화방에 다중 선택 투표 생성
openclaw message poll --target 123456789@g.us \
  --poll-question "미팅 가능 시간?" --poll-option "오전" --poll-option "오후" --poll-multi

# Discord: 48시간 동안 유지되는 투표 생성
openclaw message poll --channel discord --target channel:123456789 \
  --poll-question "주말 계획?" --poll-option "휴식" --poll-option "공부" --poll-duration-hours 48

# MS Teams: 어댑티브 카드 기반 투표 전송
openclaw message poll --channel msteams --target conversation:19:abc@thread.tacv2 \
  --poll-question "점심 메뉴 선택" --poll-option "피자" --poll-option "초밥"
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

## 에이전트 도구 (Message Tool)

에이전트가 투표를 생성하려면 `message` 도구 호출 시 `action: "poll"`을 사용해야 함. 

**지원 파라미터:** `to`, `pollQuestion`, `pollOption`, `pollMulti` (선택), `pollDurationHours`, `channel`.
(Telegram 전용: `pollDurationSeconds`, `pollAnonymous`, `pollPublic`)

<Note>
**주의**: `action: "send"`와 함께 투표 관련 필드를 전달할 경우 오류가 발생하며 거부됨. 반드시 전용 액션을 사용해야 함.
</Note>

**특이 사항:**
- **Discord**: "정확히 N개 선택" 모드를 지원하지 않으므로 `pollMulti` 설정 시 일반 다중 선택 모드로 동작함.
- **MS Teams**: 투표 데이터는 Gateway 서버의 `~/.openclaw/msteams-polls.json` 파일에 실시간으로 기록됨. 따라서 투표가 진행되는 동안 Gateway 서버가 상시 가동 중이어야 함.
