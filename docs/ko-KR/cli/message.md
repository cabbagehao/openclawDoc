---
summary: "메시지 발신 및 채널별 액션(리액션, 설문, 스레드 등)을 수행하는 `openclaw message` 명령어 레퍼런스"
description: "메시지 전송, thread 작업, reaction, poll, moderation까지 `openclaw message`가 지원하는 outbound channel 작업을 한눈에 정리합니다."
read_when:
  - CLI를 통해 메시지를 전송하거나 채널별 특정 기능을 수행하고자 할 때
  - 아웃바운드 채널의 동작 방식을 변경하거나 테스트할 때
title: "message"
x-i18n:
  source_path: "cli/message.md"
---

# `openclaw message`

메시지 전송과 channel action을 처리하는 단일 outbound 명령입니다.
(Discord/Google Chat/Slack/Mattermost (plugin)/Telegram/WhatsApp/Signal/iMessage/MS Teams)

## 사용법

```bash
openclaw message <subcommand> [flags]
```

Channel selection:

- 채널이 두 개 이상 configured되어 있으면 `--channel`이 필수입니다.
- 정확히 하나만 configured되어 있으면 그 채널이 기본값이 됩니다.
- 값: `whatsapp|telegram|discord|googlechat|slack|mattermost|signal|imessage|msteams` (Mattermost는 plugin 필요)

Target formats (`--target`):

- WhatsApp: E.164 또는 group JID
- Telegram: chat id 또는 `@username`
- Discord: `channel:<id>` 또는 `user:<id>` (또는 `<@id>` mention, 숫자 id만 주면 channel로 처리)
- Google Chat: `spaces/<spaceId>` 또는 `users/<userId>`
- Slack: `channel:<id>` 또는 `user:<id>` (raw channel id 허용)
- Mattermost (plugin): `channel:<id>`, `user:<id>`, 또는 `@username` (bare id는 channel로 처리)
- Signal: `+E.164`, `group:<id>`, `signal:+E.164`, `signal:group:<id>`, 또는 `username:<name>`/`u:<name>`
- iMessage: handle, `chat_id:<id>`, `chat_guid:<guid>`, 또는 `chat_identifier:<id>`
- MS Teams: conversation id (`19:...@thread.tacv2`) 또는 `conversation:<id>` 또는 `user:<aad-object-id>`

Name lookup:

- 지원되는 provider(Discord/Slack 등)에서는 `Help` 또는 `#help` 같은 channel name을 directory cache를 통해 resolve합니다.
- cache miss가 나면 provider가 지원하는 경우 live directory lookup을 시도합니다.

## 공통 플래그

- `--channel <name>`
- `--account <id>`
- `--target <dest>` (send/poll/read 등에 사용할 대상 channel 또는 user)
- `--targets <name>` (반복 가능, broadcast 전용)
- `--json`
- `--dry-run`
- `--verbose`

## Actions

### Core

- `send`
  - Channels: WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (plugin)/Signal/iMessage/MS Teams
  - Required: `--target`, plus `--message` 또는 `--media`
  - Optional: `--media`, `--reply-to`, `--thread-id`, `--gif-playback`
  - Telegram only: `--buttons` (`channels.telegram.capabilities.inlineButtons` 허용 필요)
  - Telegram only: `--thread-id` (forum topic id)
  - Slack only: `--thread-id` (thread timestamp, `--reply-to`도 동일 필드 사용)
  - WhatsApp only: `--gif-playback`

- `poll`
  - Channels: WhatsApp/Telegram/Discord/Matrix/MS Teams
  - Required: `--target`, `--poll-question`, `--poll-option` (repeat)
  - Optional: `--poll-multi`
  - Discord only: `--poll-duration-hours`, `--silent`, `--message`
  - Telegram only: `--poll-duration-seconds` (5-600), `--silent`, `--poll-anonymous` / `--poll-public`, `--thread-id`

- `react`
  - Channels: Discord/Google Chat/Slack/Telegram/WhatsApp/Signal
  - Required: `--message-id`, `--target`
  - Optional: `--emoji`, `--remove`, `--participant`, `--from-me`, `--target-author`, `--target-author-uuid`
  - Note: `--remove`는 `--emoji`가 필요합니다. (`--emoji`를 생략하면 지원되는 provider에서는 own reaction만 제거; /tools/reactions 참고)
  - WhatsApp only: `--participant`, `--from-me`
  - Signal group reaction: `--target-author` 또는 `--target-author-uuid` 필요

- `reactions`
  - Channels: Discord/Google Chat/Slack
  - Required: `--message-id`, `--target`
  - Optional: `--limit`

- `read`
  - Channels: Discord/Slack
  - Required: `--target`
  - Optional: `--limit`, `--before`, `--after`
  - Discord only: `--around`

- `edit`
  - Channels: Discord/Slack
  - Required: `--message-id`, `--message`, `--target`

- `delete`
  - Channels: Discord/Slack/Telegram
  - Required: `--message-id`, `--target`

- `pin` / `unpin`
  - Channels: Discord/Slack
  - Required: `--message-id`, `--target`

- `pins` (list)
  - Channels: Discord/Slack
  - Required: `--target`

- `permissions`
  - Channels: Discord
  - Required: `--target`

- `search`
  - Channels: Discord
  - Required: `--guild-id`, `--query`
  - Optional: `--channel-id`, `--channel-ids` (repeat), `--author-id`, `--author-ids` (repeat), `--limit`

### Threads

- `thread create`
  - Channels: Discord
  - Required: `--thread-name`, `--target` (channel id)
  - Optional: `--message-id`, `--message`, `--auto-archive-min`

- `thread list`
  - Channels: Discord
  - Required: `--guild-id`
  - Optional: `--channel-id`, `--include-archived`, `--before`, `--limit`

- `thread reply`
  - Channels: Discord
  - Required: `--target` (thread id), `--message`
  - Optional: `--media`, `--reply-to`

### Emojis

- `emoji list`
  - Discord: `--guild-id`
  - Slack: 추가 flag 없음

- `emoji upload`
  - Channels: Discord
  - Required: `--guild-id`, `--emoji-name`, `--media`
  - Optional: `--role-ids` (repeat)

### Stickers

- `sticker send`
  - Channels: Discord
  - Required: `--target`, `--sticker-id` (repeat)
  - Optional: `--message`

- `sticker upload`
  - Channels: Discord
  - Required: `--guild-id`, `--sticker-name`, `--sticker-desc`, `--sticker-tags`, `--media`

### Roles / Channels / Members / Voice

- `role info` (Discord): `--guild-id`
- `role add` / `role remove` (Discord): `--guild-id`, `--user-id`, `--role-id`
- `channel info` (Discord): `--target`
- `channel list` (Discord): `--guild-id`
- `member info` (Discord/Slack): `--user-id` (+ Discord는 `--guild-id`)
- `voice status` (Discord): `--guild-id`, `--user-id`

### Events

- `event list` (Discord): `--guild-id`
- `event create` (Discord): `--guild-id`, `--event-name`, `--start-time`
  - Optional: `--end-time`, `--desc`, `--channel-id`, `--location`, `--event-type`

### Moderation (Discord)

- `timeout`: `--guild-id`, `--user-id` (선택: `--duration-min` 또는 `--until`, 둘 다 생략하면 timeout 해제)
- `kick`: `--guild-id`, `--user-id` (+ `--reason`)
- `ban`: `--guild-id`, `--user-id` (+ `--delete-days`, `--reason`)
  - `timeout`도 `--reason`을 지원합니다.

### Broadcast

- `broadcast`
  - Channels: configured된 아무 channel이나 가능하며, `--channel all`로 모든 provider를 대상으로 할 수 있습니다.
  - Required: `--targets` (repeat)
  - Optional: `--message`, `--media`, `--dry-run`

## 사용 예시

```bash
openclaw message send --channel discord \
  --target channel:123 --message "hi" --reply-to 456
```

Discord component가 포함된 메시지 전송:

```bash
openclaw message send --channel discord \
  --target channel:123 --message "Choose:" \
  --components '{"text":"Choose a path","blocks":[{"type":"actions","buttons":[{"label":"Approve","style":"success"},{"label":"Decline","style":"danger"}]}]}'
```

전체 schema는 [Discord components](/channels/discord#interactive-components)를 참고하세요.

Discord poll 생성:

```bash
openclaw message poll --channel discord \
  --target channel:123 \
  --poll-question "Snack?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-multi --poll-duration-hours 48
```

Telegram poll 생성 (2분 후 자동 종료):

```bash
openclaw message poll --channel telegram \
  --target @mychat \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-duration-seconds 120 --silent
```

Teams proactive message 전송:

```bash
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 --message "hi"
```

Teams poll 생성:

```bash
openclaw message poll --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi
```

Slack에서 reaction 추가:

```bash
openclaw message react --channel slack \
  --target C123 --message-id 456 --emoji "✅"
```

Signal group에서 reaction 추가:

```bash
openclaw message react --channel signal \
  --target signal:group:abc123 --message-id 1737630212345 \
  --emoji "✅" --target-author-uuid 123e4567-e89b-12d3-a456-426614174000
```

Telegram inline button 전송:

```bash
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --buttons '[ [{"text":"Yes","callback_data":"cmd:yes"}], [{"text":"No","callback_data":"cmd:no"}] ]'
```
