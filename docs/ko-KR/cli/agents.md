---
summary: "CLI reference for `openclaw agents` (list/add/delete/bindings/bind/unbind/set identity)"
description: "격리된 workspace, auth, routing을 가진 여러 OpenClaw agent를 관리하는 `openclaw agents` 명령의 바인딩과 identity 설정 방법을 정리합니다."
read_when:
  - 여러 개의 격리된 agent를 운영하려고 할 때
title: "agents"
x-i18n:
  source_path: "cli/agents.md"
---

# `openclaw agents`

격리된 agent를 관리합니다. (`workspace + auth + routing`)

Related:

- Multi-agent routing: [Multi-Agent Routing](/concepts/multi-agent)
- Agent workspace: [Agent workspace](/concepts/agent-workspace)

## Examples

```bash
openclaw agents list
openclaw agents add work --workspace ~/.openclaw/workspace-work
openclaw agents bindings
openclaw agents bind --agent work --bind telegram:ops
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
openclaw agents set-identity --agent main --avatar avatars/openclaw.png
openclaw agents delete work
```

## Routing bindings

routing binding을 사용하면 inbound channel traffic을 특정 agent에 고정할 수 있습니다.

List bindings:

```bash
openclaw agents bindings
openclaw agents bindings --agent work
openclaw agents bindings --json
```

Add bindings:

```bash
openclaw agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

`accountId`를 생략하고 `--bind <channel>`만 주면, OpenClaw는 가능할 때 channel default와 plugin setup hook을 이용해 이를 resolve합니다.

### Binding scope behavior

- `accountId`가 없는 binding은 channel default account에만 매칭됩니다.
- `accountId: "*"`는 channel-wide fallback이며, explicit account binding보다 덜 구체적입니다.
- 같은 agent에 대해 `accountId` 없는 matching channel binding이 이미 있는데, 나중에 explicit 또는 resolved `accountId`로 bind하면 OpenClaw는 duplicate를 만들지 않고 기존 binding을 그 자리에서 upgrade합니다.

Example:

```bash
# initial channel-only binding
openclaw agents bind --agent work --bind telegram

# later upgrade to account-scoped binding
openclaw agents bind --agent work --bind telegram:ops
```

upgrade 후에는 해당 binding의 routing 범위가 `telegram:ops`로 제한됩니다. default-account routing도 원한다면 `--bind telegram:default`처럼 명시적으로 추가해야 합니다.

Remove bindings:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

## Identity files

각 agent workspace는 workspace root에 `IDENTITY.md`를 둘 수 있습니다.

- 예시 path: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity`는 workspace root 또는 명시적인 `--identity-file`에서 읽습니다.

avatar path는 workspace root 기준으로 resolve됩니다.

## Set identity

`set-identity`는 `agents.list[].identity`에 다음 field를 기록합니다.

- `name`
- `theme`
- `emoji`
- `avatar` (workspace-relative path, http(s) URL, 또는 data URI)

`IDENTITY.md`에서 로드:

```bash
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
```

field를 명시적으로 override:

```bash
openclaw agents set-identity --agent main --name "OpenClaw" --emoji "🦞" --avatar avatars/openclaw.png
```

Config sample:

```json5
{
  agents: {
    list: [
      {
        id: "main",
        identity: {
          name: "OpenClaw",
          theme: "space lobster",
          emoji: "🦞",
          avatar: "avatars/openclaw.png",
        },
      },
    ],
  },
}
```
