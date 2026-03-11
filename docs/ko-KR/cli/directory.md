---
summary: "`openclaw directory`용 CLI 레퍼런스(self, peers, groups)"
read_when:
  - 채널의 연락처/그룹/self id를 조회하려고 할 때
  - 채널 디렉터리 어댑터를 개발 중일 때
title: "directory"
---

# `openclaw directory`

이를 지원하는 채널에서 디렉터리 조회를 수행합니다(연락처/peer, 그룹, 그리고 "me").

## 공통 플래그

- `--channel <name>`: 채널 id/별칭(여러 채널이 설정된 경우 필수, 하나만 설정된 경우 자동 선택)
- `--account <id>`: 계정 id(기본값: 채널 기본 계정)
- `--json`: JSON으로 출력

## 참고

- `directory`는 다른 명령에 붙여 넣을 수 있는 ID를 찾는 데 도움이 되도록 설계되었습니다(특히 `openclaw message send --target ...`).
- 많은 채널에서 결과는 라이브 제공자 디렉터리가 아니라 설정 기반(allowlist / configured groups)입니다.
- 기본 출력은 탭으로 구분된 `id`(때로는 `name`)이며, 스크립팅에는 `--json`을 사용하세요.

## `message send`와 함께 결과 사용하기

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## ID 형식(채널별)

- WhatsApp: `+15551234567` (DM), `1234567890-1234567890@g.us` (group)
- Telegram: `@username` 또는 숫자 chat id, 그룹은 숫자 id 사용
- Slack: `user:U…` 및 `channel:C…`
- Discord: `user:<id>` 및 `channel:<id>`
- Matrix (plugin): `user:@user:server`, `room:!roomId:server`, 또는 `#alias:server`
- Microsoft Teams (plugin): `user:<id>` 및 `conversation:<id>`
- Zalo (plugin): 사용자 id (Bot API)
- Zalo Personal / `zalouser` (plugin): `zca`의 thread id (DM/group) (`me`, `friend list`, `group list`)

## 자기 자신("me")

```bash
openclaw directory self --channel zalouser
```

## 피어(연락처/사용자)

```bash
openclaw directory peers list --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory peers list --channel zalouser --limit 50
```

## 그룹

```bash
openclaw directory groups list --channel zalouser
openclaw directory groups list --channel zalouser --query "work"
openclaw directory groups members --channel zalouser --group-id <id>
```
