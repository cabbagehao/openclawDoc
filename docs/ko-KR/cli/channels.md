---
summary: "CLI reference for `openclaw channels` (accounts, status, login/logout, logs)"
description: "채팅 채널 계정을 추가·삭제·로그인하고, status·capabilities·resolve·logs를 점검하는 `openclaw channels` 명령의 핵심 흐름을 정리합니다."
read_when:
  - WhatsApp, Telegram, Discord, Google Chat, Slack, Mattermost, Signal, iMessage 계정을 추가하거나 제거할 때
  - 채널 상태를 확인하거나 채널 로그를 따라가야 할 때
title: "channels"
x-i18n:
  source_path: "cli/channels.md"
---

# `openclaw channels`

Gateway에서 chat channel account와 해당 runtime status를 관리합니다.

Related docs:

- Channel guides: [Channels](/channels/index)
- Gateway configuration: [Configuration](/gateway/configuration)

## Common commands

```bash
openclaw channels list
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

## Add / remove accounts

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels remove --channel telegram --delete
```

Tip: `openclaw channels add --help`는 channel별 flag(token, app token, signal-cli path 등)를 보여줍니다.

flag 없이 `openclaw channels add`를 실행하면 interactive wizard가 다음을 물어볼 수 있습니다.

- 선택한 channel별 account id
- 해당 account의 optional display name
- `Bind configured channel accounts to agents now?`

bind now를 확인하면 wizard는 각 configured channel account를 어떤 agent가 소유할지 묻고, account-scoped routing binding을 기록합니다.

같은 routing rule은 나중에 `openclaw agents bindings`, `openclaw agents bind`, `openclaw agents unbind`로도 관리할 수 있습니다. ([agents](/cli/agents) 참고)

single-account top-level setting만 쓰고 있던 channel에 non-default account를 추가하면, OpenClaw는 기존 single-account top-level value를 `channels.<channel>.accounts.default`로 옮긴 뒤 새 account를 기록합니다. 이렇게 하면 multi-account shape로 전환하면서 기존 account 동작이 유지됩니다.

routing behavior는 일관되게 유지됩니다.

- 기존 channel-only binding (`accountId` 없음)은 계속 default account와 매칭됩니다.
- `channels add`는 non-interactive mode에서 binding을 자동 생성하거나 수정하지 않습니다.
- interactive setup은 account-scoped binding을 선택적으로 추가할 수 있습니다.

config가 이미 혼합 상태였다면(예: named account는 있는데 `default`는 없고 top-level single-account value는 남아 있음), account-scoped value를 `accounts.default`로 옮기기 위해 `openclaw doctor --fix`를 실행하세요.

## Login / logout (interactive)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

## Troubleshooting

- 넓은 범위의 probe는 `openclaw status --deep`를 사용하세요.
- guided fix는 `openclaw doctor`를 사용하세요.
- `openclaw channels list`가 `Claude: HTTP 403 ... user:profile`를 출력하면, usage snapshot에 `user:profile` scope가 필요하다는 뜻입니다. `--no-usage`를 쓰거나, claude.ai session key (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`)를 제공하거나, Claude Code CLI로 다시 auth하세요.
- `openclaw channels status`는 gateway에 도달할 수 없으면 config-only summary로 fallback합니다. 지원되는 channel credential이 SecretRef로 구성되어 있지만 현재 command path에서 사용할 수 없는 경우, account는 not configured로 보이지 않고 configured 상태에 degraded note를 붙여 표시됩니다.

## Capabilities probe

provider capability hint(intents/scopes, 가능한 경우)와 static feature support를 가져옵니다.

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Notes:

- `--channel`은 optional입니다. 생략하면 extension을 포함한 모든 channel을 나열합니다.
- `--target`은 `channel:<id>` 또는 raw numeric channel id를 받으며 Discord에만 적용됩니다.
- probe는 provider-specific입니다. Discord intents + optional channel permission, Slack bot + user scope, Telegram bot flag + webhook, Signal daemon version, MS Teams app token + Graph role/scope(알 수 있는 경우 annotation 포함)를 보여줍니다. probe가 없는 channel은 `Probe: unavailable`로 표시됩니다.

## Resolve names to IDs

provider directory를 사용해 channel/user name을 ID로 resolve합니다.

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Notes:

- `--kind user|group|auto`로 target type을 강제할 수 있습니다.
- 같은 이름이 여러 개일 경우 active match를 우선합니다.
- `channels resolve`는 read-only입니다. 선택된 account가 SecretRef 기반이고 현재 command path에서 그 credential을 사용할 수 없더라도, command 전체를 abort하지 않고 degraded unresolved result와 note를 반환합니다.
