---
summary: "CLI 참고: `openclaw message` (send + channel actions)"
read_when:
  - message CLI action을 추가하거나 수정할 때
  - outbound channel 동작을 변경할 때
title: "message"
---

# `openclaw message`

메시지 전송과 channel action을 위한 단일 outbound 명령입니다.
(Discord/Google Chat/Slack/Mattermost(plugin)/Telegram/WhatsApp/Signal/iMessage/MS Teams 지원)

## Usage

```
openclaw message <subcommand> [flags]
```

채널 선택:

- channel이 둘 이상 설정된 경우 `--channel`이 필요합니다.
- 정확히 하나만 설정된 경우 그 채널이 기본값이 됩니다.
- 값: `whatsapp|telegram|discord|googlechat|slack|mattermost|signal|imessage|msteams` (Mattermost는 plugin 필요)

대상 형식(`--target`):

- WhatsApp: E.164 또는 group JID
- Telegram: chat id 또는 `@username`
- Discord: `channel:<id>` 또는 `user:<id>` (`<@id>` mention도 가능, 순수 숫자 id는 channel로 처리)
- Google Chat: `spaces/<spaceId>` 또는 `users/<userId>`
- Slack: `channel:<id>` 또는 `user:<id>` (raw channel id 허용)
- Mattermost(plugin): `channel:<id>`, `user:<id>`, 또는 `@username` (bare id는 channel로 처리)
- Signal: `+E.164`, `group:<id>`, `signal:+E.164`, `signal:group:<id>`, 또는 `username:<name>`/`u:<name>`
- iMessage: handle, `chat_id:<id>`, `chat_guid:<guid>`, 또는 `chat_identifier:<id>`
- MS Teams: conversation id(`19:...@thread.tacv2`) 또는 `conversation:<id>` 또는 `user:<aad-object-id>`

이름 lookup:

- 지원되는 provider(Discord/Slack 등)에서는 `Help`, `#help` 같은 channel 이름을 directory cache로 해석합니다.
- cache miss 시 provider가 지원하면 live directory lookup을 시도합니다.

## Common flags

- `--channel <name>`
- `--account <id>`
- `--target <dest>` (send/poll/read 등에 사용할 target channel 또는 user)
- `--targets <name>` (반복 가능, broadcast 전용)
- `--json`
- `--dry-run`
- `--verbose`

## Actions

### Core

- `send`
  - 채널: WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost(plugin)/Signal/iMessage/MS Teams
  - 필수: `--target`, 그리고 `--message` 또는 `--media`
  - 선택: `--media`, `--reply-to`, `--thread-id`, `--gif-playback`
  - Telegram 전용: `--buttons` (`channels.telegram.capabilities.inlineButtons` 허용 필요)
  - Telegram 전용: `--thread-id` (forum topic id)
  - Slack 전용: `--thread-id` (thread timestamp, `--reply-to`도 동일 필드 사용)
  - WhatsApp 전용: `--gif-playback`

- `poll`
  - 채널: WhatsApp/Telegram/Discord/Matrix/MS Teams
  - 필수: `--target`, `--poll-question`, `--poll-option` (반복)
  - 선택: `--poll-multi`
  - Discord 전용: `--poll-duration-hours`, `--silent`, `--message`
  - Telegram 전용: `--poll-duration-seconds` (5-600), `--silent`, `--poll-anonymous` / `--poll-public`, `--thread-id`

- `react`
  - 채널: Discord/Google Chat/Slack/Telegram/WhatsApp/Signal
  - 필수: `--message-id`, `--target`
  - 선택: `--emoji`, `--remove`, `--participant`, `--from-me`, `--target-author`, `--target-author-uuid`
  - 참고: `--remove`는 `--emoji`가 필요합니다. 지원되는 곳에서는 `--emoji` 없이 자신의 reaction만 지울 수 있습니다. 자세한 내용은 /tools/reactions 참고
  - WhatsApp 전용: `--participant`, `--from-me`
  - Signal group reaction: `--target-author` 또는 `--target-author-uuid` 필요

- `reactions`
  - 채널: Discord/Google Chat/Slack
  - 필수: `--message-id`, `--target`
  - 선택: `--limit`

- `read`
  - 채널: Discord/Slack
  - 필수: `--target`
  - 선택: `--limit`, `--before`, `--after`
  - Discord 전용: `--around`

- `edit`
  - 채널: Discord/Slack
  - 필수: `--message-id`, `--message`, `--target`

- `delete`
  - 채널: Discord/Slack/Telegram
  - 필수: `--message-id`, `--target`

- `pin` / `unpin`
  - 채널: Discord/Slack
  - 필수: `--message-id`, `--target`

- `pins` (list)
  - 채널: Discord/Slack
  - 필수: `--target`

- `permissions`
  - 채널: Discord
  - 필수: `--target`

- `search`
  - 채널: Discord
  - 필수: `--guild-id`, `--query`
  - 선택: `--channel-id`, `--channel-ids`(반복), `--author-id`, `--author-ids`(반복), `--limit`

### Threads

- `thread create`
  - 채널: Discord
  - 필수: `--thread-name`, `--target` (channel id)
  - 선택: `--message-id`, `--message`, `--auto-archive-min`

- `thread list`
  - 채널: Discord
  - 필수: `--guild-id`
  - 선택: `--channel-id`, `--include-archived`, `--before`, `--limit`

- `thread reply`
  - 채널: Discord
  - 필수: `--target` (thread id), `--message`
  - 선택: `--media`, `--reply-to`

### Emojis

- `emoji list`
  - Discord: `--guild-id`
  - Slack: 추가 flag 없음

- `emoji upload`
  - 채널: Discord
  - 필수: `--guild-id`, `--emoji-name`, `--media`
  - 선택: `--role-ids` (반복)

### Stickers

- `sticker send`
  - 채널: Discord
  - 필수: `--target`, `--sticker-id` (반복)
  - 선택: `--message`

- `sticker upload`
  - 채널: Discord
  - 필수: `--guild-id`, `--sticker-name`, `--sticker-desc`, `--sticker-tags`, `--media`

### Roles / Channels / Members / Voice

- `role info` (Discord): `--guild-id`
- `role add` / `role remove` (Discord): `--guild-id`, `--user-id`, `--role-id`
- `channel info` (Discord): `--target`
- `channel list` (Discord): `--guild-id`
- `member info` (Discord/Slack): `--user-id` (Discord는 `--guild-id`도 필요)
- `voice status` (Discord): `--guild-id`, `--user-id`

### Events

- `event list` (Discord): `--guild-id`
- `event create` (Discord): `--guild-id`, `--event-name`, `--start-time`
  - 선택: `--end-time`, `--desc`, `--channel-id`, `--location`, `--event-type`

### Moderation (Discord)

- `timeout`: `--guild-id`, `--user-id` (선택: `--duration-min` 또는 `--until`, 둘 다 없으면 timeout 해제)
- `kick`: `--guild-id`, `--user-id` (`--reason` 선택)
- `ban`: `--guild-id`, `--user-id` (`--delete-days`, `--reason` 선택)
  - `timeout`도 `--reason` 지원

### Broadcast

- `broadcast`
  - 채널: 설정된 모든 채널. 모든 provider를 대상으로 하려면 `--channel all`
  - 필수: `--targets` (반복)
  - 선택: `--message`, `--media`, `--dry-run`

## Examples

Discord에 답장 보내기:

```
openclaw message send --channel discord \
  --target channel:123 --message "hi" --reply-to 456
```

컴포넌트를 포함한 Discord 메시지 보내기:

```
openclaw message send --channel discord \
  --target channel:123 --message "Choose:" \
  --components '{"text":"Choose a path","blocks":[{"type":"actions","buttons":[{"label":"Approve","style":"success"},{"label":"Decline","style":"danger"}]}]}'
```

전체 스키마는 [Discord components](/channels/discord#interactive-components)를 참고하세요.

Discord poll 생성:

```
openclaw message poll --channel discord \
  --target channel:123 \
  --poll-question "Snack?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-multi --poll-duration-hours 48
```

Telegram poll 생성(2분 후 자동 종료):

```
openclaw message poll --channel telegram \
  --target @mychat \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-duration-seconds 120 --silent
```

Teams proactive message 보내기:

```
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 --message "hi"
```

Teams poll 생성:

```
openclaw message poll --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi
```

Slack에서 reaction 달기:

```
openclaw message react --channel slack \
  --target C123 --message-id 456 --emoji "✅"
```

Signal group에서 reaction 달기:

```
openclaw message react --channel signal \
  --target signal:group:abc123 --message-id 1737630212345 \
  --emoji "✅" --target-author-uuid 123e4567-e89b-12d3-a456-426614174000
```

Telegram inline button 보내기:

```
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --buttons '[ [{"text":"Yes","callback_data":"cmd:yes"}], [{"text":"No","callback_data":"cmd:no"}] ]'
```
