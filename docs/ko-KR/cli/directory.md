---
summary: "CLI reference for `openclaw directory` (self, peers, groups)"
description: "채널별 self, peer, group ID를 조회해 `message send` 같은 다른 명령에 재사용할 수 있게 해주는 `openclaw directory` 명령의 사용법을 설명합니다."
read_when:
  - 채널별 contact/group/self ID를 조회할 때
  - 채널 directory adapter를 개발할 때
title: "directory"
x-i18n:
  source_path: "cli/directory.md"
---

# `openclaw directory`

directory lookup을 지원하는 channel에서 contacts/peers, groups, 그리고 “me” 정보를 조회합니다.

## Common flags

- `--channel <name>`: channel id/alias (여러 channel이 설정되어 있으면 필수, 하나만 있으면 자동 선택)
- `--account <id>`: account id (기본값: channel default)
- `--json`: JSON 출력

## Notes

- `directory`는 다른 명령, 특히 `openclaw message send --target ...`에 붙여 넣을 ID를 찾는 데 목적이 있습니다.
- 많은 channel에서는 결과가 live provider directory가 아니라 config-backed 정보(allowlist/configured group)에서 나옵니다.
- 기본 출력은 `id`와 경우에 따라 `name`을 tab으로 구분한 형태입니다. 스크립트에는 `--json`을 사용하세요.

## Using results with `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## ID formats (by channel)

- WhatsApp: `+15551234567` (DM), `1234567890-1234567890@g.us` (group)
- Telegram: `@username` 또는 numeric chat id, group도 numeric id 사용
- Slack: `user:U…` 와 `channel:C…`
- Discord: `user:<id>` 와 `channel:<id>`
- Matrix (plugin): `user:@user:server`, `room:!roomId:server`, 또는 `#alias:server`
- Microsoft Teams (plugin): `user:<id>` 와 `conversation:<id>`
- Zalo (plugin): user id (Bot API)
- Zalo Personal / `zalouser` (plugin): `zca`의 thread id (DM/group), `me`, friend list, group list

## Self (“me”)

```bash
openclaw directory self --channel zalouser
```

## Peers (contacts/users)

```bash
openclaw directory peers list --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory peers list --channel zalouser --limit 50
```

## Groups

```bash
openclaw directory groups list --channel zalouser
openclaw directory groups list --channel zalouser --query "work"
openclaw directory groups members --channel zalouser --group-id <id>
```
