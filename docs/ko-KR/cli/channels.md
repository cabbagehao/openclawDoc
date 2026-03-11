---
summary: "CLI reference for `openclaw channels` (accounts, status, login/logout, logs)"
read_when:
  - 채널 계정(WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (plugin)/Signal/iMessage)을 추가/제거하고 싶을 때
  - 채널 상태를 확인하거나 채널 로그를 tail 하고 싶을 때
title: "channels"
---

# `openclaw channels`

Gateway 의 채팅 채널 계정과 그 런타임 상태를 관리합니다.

관련 문서:

- Channel guides: [Channels](/channels/index)
- Gateway configuration: [Configuration](/gateway/configuration)

## 자주 쓰는 명령

```bash
openclaw channels list
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

## 계정 추가 / 제거

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels remove --channel telegram --delete
```

팁: `openclaw channels add --help` 는 채널별 플래그(token, app token, signal-cli paths 등)를 보여 줍니다.

플래그 없이 `openclaw channels add` 를 실행하면, interactive wizard 가 다음을 물어볼 수 있습니다:

- 선택한 채널별 account id
- 그 account 의 선택적 display name
- `Bind configured channel accounts to agents now?`

즉시 bind 를 확인하면, wizard 는 각 configured channel account 를 어느 agent 가 소유할지 묻고 account-scoped routing binding 을 기록합니다.

같은 routing 규칙은 나중에 `openclaw agents bindings`, `openclaw agents bind`, `openclaw agents unbind` 로도 관리할 수 있습니다([agents](/cli/agents) 참고).

채널에 non-default account 를 추가할 때, 해당 채널이 여전히 single-account top-level 설정을 사용 중이라면(`channels.<channel>.accounts` 항목이 아직 없음), OpenClaw 는 account-scoped single-account top-level 값을 `channels.<channel>.accounts.default` 로 옮긴 뒤 새 account 를 기록합니다. 이렇게 하면 multi-account 형태로 넘어가도 원래 account 동작이 유지됩니다.

Routing 동작은 일관되게 유지됩니다:

- 기존 channel-only binding (`accountId` 없음)은 계속 default account 와 일치합니다.
- `channels add` 는 non-interactive mode 에서 binding 을 자동 생성하거나 다시 쓰지 않습니다.
- interactive setup 에서는 선택적으로 account-scoped binding 을 추가할 수 있습니다.

이미 config 가 혼합 상태였다면(이름 있는 accounts 는 있는데 `default` 가 없고 top-level single-account 값이 남아 있는 경우), `openclaw doctor --fix` 를 실행해 account-scoped 값을 `accounts.default` 로 옮기세요.

## Login / logout (interactive)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

## 문제 해결

- 폭넓은 probe 는 `openclaw status --deep` 를 실행하세요.
- 가이드형 수정은 `openclaw doctor` 를 사용하세요.
- `openclaw channels list` 에 `Claude: HTTP 403 ... user:profile` 이 출력되면 usage snapshot 에 `user:profile` scope 가 필요하다는 뜻입니다. `--no-usage` 를 쓰거나, claude.ai session key (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`)를 제공하거나, Claude Code CLI 로 다시 인증하세요.
- `openclaw channels status` 는 gateway 에 접근할 수 없을 때 config-only summary 로 폴백합니다. 지원되는 채널 credential 이 SecretRef 로 구성되어 있지만 현재 명령 경로에서 사용할 수 없는 경우, 해당 account 를 미구성으로 보이지 않고 degraded notes 와 함께 configured 상태로 보고합니다.

## Capabilities probe

provider capability 힌트(가능한 경우 intents/scopes)와 정적 feature support 를 가져옵니다:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

메모:

- `--channel` 은 선택 사항입니다. 생략하면 모든 채널(extensions 포함)을 나열합니다.
- `--target` 은 `channel:<id>` 또는 raw numeric channel id 를 받으며 Discord 에만 적용됩니다.
- probe 는 provider 별로 다릅니다: Discord intents + 선택적 channel permissions, Slack bot + user scopes, Telegram bot flags + webhook, Signal daemon version, MS Teams app token + Graph roles/scopes (알려진 경우 주석 포함). probe 가 없는 채널은 `Probe: unavailable` 을 보고합니다.

## 이름을 ID 로 해석

provider directory 를 사용해 channel/user 이름을 ID 로 해석합니다:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

메모:

- `--kind user|group|auto` 로 대상 타입을 강제할 수 있습니다.
- 여러 항목이 같은 이름을 가질 경우 활성 match 를 우선합니다.
- `channels resolve` 는 read-only 입니다. 선택한 account 가 SecretRef 로 구성되어 있지만 현재 명령 경로에서 자격 증명을 사용할 수 없으면, 명령 전체를 중단하는 대신 degraded unresolved 결과와 notes 를 반환합니다.
