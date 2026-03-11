---
summary: "메시지 발신 및 채널별 액션(리액션, 설문, 스레드 등)을 수행하는 `openclaw message` 명령어 레퍼런스"
read_when:
  - CLI를 통해 메시지를 전송하거나 채널별 특정 기능을 수행하고자 할 때
  - 아웃바운드 채널의 동작 방식을 변경하거나 테스트할 때
title: "message"
x-i18n:
  source_path: "cli/message.md"
---

# `openclaw message`

통합된 아웃바운드 명령어로 메시지 전송 및 채널별 액션을 수행함. (WhatsApp, Telegram, Discord, Slack, Google Chat, Mattermost, Signal, iMessage, MS Teams 지원)

## 사용법

```bash
openclaw message <subcommand> [flags]
```

**채널 선택 규칙:**
- 둘 이상의 채널이 설정된 경우 `--channel` 플래그가 필수임.
- 하나의 채널만 설정된 경우 해당 채널이 기본값으로 자동 선택됨.
- 지원 값: `whatsapp`, `telegram`, `discord`, `googlechat`, `slack`, `mattermost`, `signal`, `imessage`, `msteams`. (Mattermost는 별도 플러그인 필요)

**대상 지정 형식 (`--target`):**
- **WhatsApp**: E.164 번호 또는 그룹 JID.
- **Telegram**: 숫자 채팅 ID 또는 `@사용자명`.
- **Discord**: `channel:<id>`, `user:<id>` 또는 `<@id>` 멘션. (순수 숫자는 채널 ID로 간주)
- **Google Chat**: `spaces/<spaceId>` 또는 `users/<userId>`.
- **Slack**: `channel:<id>` 또는 `user:<id>`. (순수 채널 ID 허용)
- **Mattermost**: `channel:<id>`, `user:<id>` 또는 `@사용자명`.
- **Signal**: `+E.164`, `group:<id>`, `signal:+E.164`, `username:<name>`.
- **iMessage**: 핸들(Handle), `chat_id:<id>`, `chat_guid:<guid>`.
- **MS Teams**: 대화 ID (`19:...@thread.tacv2`) 또는 `user:<aad-object-id>`.

**이름 해석 (Name Lookup):**
- Discord, Slack 등 지원 채널에서는 `#help`와 같은 채널명을 디렉터리 캐시를 통해 실제 ID로 자동 변환함. 캐시에 없을 경우 실시간 조회를 시도함.

## 공통 플래그

- `--channel <name>`: 채널 지정.
- `--account <id>`: 계정 지정 (기본값 사용 가능).
- `--target <dest>`: 전송 대상 채널 또는 사용자 ID.
- `--targets <name>`: 다중 대상 지정 (브로드캐스트 전용, 반복 가능).
- `--json`: JSON 형식 출력.
- `--dry-run`: 실제 전송 없이 실행 결과만 확인.
- `--verbose`: 상세 로그 출력.

---

## 주요 액션 (Actions)

### 코어 기능 (Core)

- **`send`** (메시지 전송)
  - 필수: `--target`, `--message` 또는 `--media`.
  - 선택: `--reply-to` (답장), `--thread-id` (스레드), `--gif-playback` (GIF 재생 여부).
- **`poll`** (설문 조사)
  - 필수: `--target`, `--poll-question` (질문), `--poll-option` (보기, 반복 가능).
  - 선택: `--poll-multi` (복수 응답 허용).
- **`react`** (리액션 추가/제거)
  - 필수: `--message-id`, `--target`.
  - 선택: `--emoji`, `--remove` (제거).
- **`read`** (메시지 읽기)
  - 지원: Discord, Slack.
  - 선택: `--limit` (개수), `--before`, `--after` (시점).
- **`edit`** / **`delete`** (수정/삭제)
  - 필수: `--message-id`, `--target`, (`edit`의 경우 `--message`).

### 스레드 관리 (Threads)

- **`thread create`**: 새 스레드 생성 (Discord 전용).
- **`thread reply`**: 특정 스레드에 답장 전송.

### 미디어 및 기타 (Discord 전용)

- **`emoji list`** / **`upload`**: 커스텀 이모지 관리.
- **`sticker send`** / **`upload`**: 스티커 관리.
- **`event create`** / **`list`**: 서버 이벤트 관리.
- **`timeout`** / **`kick`** / **`ban`**: 커뮤니티 관리 및 제재 도구.

### 브로드캐스트 (Broadcast)

- **`broadcast`**: 설정된 모든 채널 또는 특정 공급자 전체에 메시지 전송.
  - `--channel all` 지정 시 모든 활성 공급자에게 전송됨.

---

## 사용 예시

**Discord 답장 보내기:**
```bash
openclaw message send --channel discord \
  --target channel:123 --message "안녕하세요" --reply-to 456
```

**Discord 대화형 컴포넌트 포함 메시지:**
```bash
openclaw message send --channel discord \
  --target channel:123 --message "선택해 주세요:" \
  --components '{"text":"진행 경로 선택","blocks":[{"type":"actions","buttons":[{"label":"승인","style":"success"},{"label":"거부","style":"danger"}]}]}'
```

**Telegram 설문 조사 생성 (2분 후 자동 종료):**
```bash
openclaw message poll --channel telegram \
  --target @mychat \
  --poll-question "오늘 점심 메뉴는?" \
  --poll-option "피자" --poll-option "초밥" \
  --poll-duration-seconds 120 --silent
```

**Slack 리액션 추가:**
```bash
openclaw message react --channel slack \
  --target C123 --message-id 456 --emoji "✅"
```

**Signal 그룹 대화 리액션:**
```bash
openclaw message react --channel signal \
  --target signal:group:abc123 --message-id 1737630212345 \
  --emoji "👍" --target-author-uuid 123e4567-e89b-12d3-a456-426614174000
```

**Telegram 인라인 버튼 전송:**
```bash
openclaw message send --channel telegram --target @mychat --message "선택:" \
  --buttons '[ [{"text":"예","callback_data":"cmd:yes"}], [{"text":"아니요","callback_data":"cmd:no"}] ]'
```
