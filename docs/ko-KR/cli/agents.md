---
summary: "`openclaw agents`를 위한 CLI 레퍼런스 (list/add/delete/bindings/bind/unbind/set identity)"
read_when:
  - 여러 개의 격리된 에이전트(워크스페이스 + 라우팅 + 인증)가 필요할 때
title: "agents"
---

# `openclaw agents`

격리된 에이전트(워크스페이스 + 인증 + 라우팅)를 관리합니다.

관련 항목:

- 멀티 에이전트 라우팅: [Multi-Agent Routing](/concepts/multi-agent)
- 에이전트 워크스페이스: [Agent workspace](/concepts/agent-workspace)

## 예시

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

## 라우팅 바인딩

라우팅 바인딩을 사용하면 인바운드 채널 트래픽을 특정 에이전트에 고정할 수 있습니다.

바인딩 나열:

```bash
openclaw agents bindings
openclaw agents bindings --agent work
openclaw agents bindings --json
```

바인딩 추가:

```bash
openclaw agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

`accountId`(`--bind <channel>`)를 생략하면, OpenClaw는 가능할 때 채널 기본값과 플러그인 설정 훅에서 이를 해석합니다.

### 바인딩 범위 동작

- `accountId`가 없는 바인딩은 채널 기본 계정에만 일치합니다.
- `accountId: "*"`는 채널 전체에 대한 폴백(모든 계정)이며, 명시적 계정 바인딩보다 덜 구체적입니다.
- 같은 에이전트에 이미 `accountId` 없는 일치하는 채널 바인딩이 있고, 나중에 명시적이거나 해석된 `accountId`로 바인딩하면 OpenClaw는 중복을 추가하는 대신 기존 바인딩을 제자리에서 업그레이드합니다.

예시:

```bash
# initial channel-only binding
openclaw agents bind --agent work --bind telegram

# later upgrade to account-scoped binding
openclaw agents bind --agent work --bind telegram:ops
```

업그레이드 후 해당 바인딩의 라우팅 범위는 `telegram:ops`로 지정됩니다. 기본 계정 라우팅도 원한다면 명시적으로 추가하세요(예: `--bind telegram:default`).

바인딩 제거:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

## IDENTITY 파일

각 에이전트 워크스페이스는 워크스페이스 루트에 `IDENTITY.md`를 포함할 수 있습니다:

- 예시 경로: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity`는 워크스페이스 루트(또는 명시적인 `--identity-file`)에서 읽습니다

아바타 경로는 워크스페이스 루트를 기준으로 해석됩니다.

## identity 설정

`set-identity`는 필드를 `agents.list[].identity`에 기록합니다:

- `name`
- `theme`
- `emoji`
- `avatar`(워크스페이스 상대 경로, http(s) URL 또는 data URI)

`IDENTITY.md`에서 로드:

```bash
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
```

필드를 명시적으로 덮어쓰기:

```bash
openclaw agents set-identity --agent main --name "OpenClaw" --emoji "🦞" --avatar avatars/openclaw.png
```

설정 예시:

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
