---
summary: "채널별 라우팅 규칙(WhatsApp, Telegram, Discord, Slack)과 공유 컨텍스트"
read_when:
  - 채널 라우팅이나 inbox 동작을 바꿀 때
title: "채널 라우팅"
x-i18n:
  source_path: "channels/channel-routing.md"
---

# 채널과 라우팅

OpenClaw는 **메시지가 들어온 채널로 다시 응답을 돌려보냅니다**. 모델이 채널을 고르는 것이 아니라, 라우팅은 host 설정에 의해 결정론적으로 제어됩니다.

## 핵심 용어

- **Channel**: `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`, `webchat`.
- **AccountId**: 채널별 계정 인스턴스(지원되는 경우).
- 선택적 채널 기본 계정: `channels.<channel>.defaultAccount`는 아웃바운드 경로에 `accountId`가 없을 때 어떤 계정을 쓸지 결정합니다.
  - 멀티 계정 구성에서는 두 개 이상 계정이 있을 경우 명시적인 기본값(`defaultAccount` 또는 `accounts.default`)을 설정하세요. 없으면 fallback 라우팅이 첫 번째 정규화된 account ID를 고를 수 있습니다.
- **AgentId**: 격리된 workspace + session store(“brain”).
- **SessionKey**: 컨텍스트 저장과 동시성 제어에 사용하는 버킷 키.

## Session key 형태(예시)

직접 메시지는 에이전트의 **main** 세션으로 합쳐집니다.

- `agent:<agentId>:<mainKey>` (기본값: `agent:main:main`)

그룹과 채널은 채널별로 격리된 상태를 유지합니다.

- 그룹: `agent:<agentId>:<channel>:group:<id>`
- 채널/룸: `agent:<agentId>:<channel>:channel:<id>`

스레드:

- Slack/Discord 스레드는 기본 키 뒤에 `:thread:<threadId>`가 붙습니다.
- Telegram forum topic은 그룹 키에 `:topic:<topicId>`를 포함합니다.

예시:

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## 메인 DM route pinning

`session.dmScope`가 `main`이면 직접 메시지는 하나의 main 세션을 공유할 수 있습니다.
비소유자 DM 때문에 세션의 `lastRoute`가 덮어써지지 않도록,
OpenClaw는 다음 조건이 모두 참일 때 `allowFrom`에서 pinned owner를 추론합니다.

- `allowFrom`에 와일드카드가 아닌 항목이 정확히 하나 있다.
- 그 항목을 해당 채널의 구체적 발신자 ID로 정규화할 수 있다.
- 인바운드 DM 발신자가 그 pinned owner와 일치하지 않는다.

이 불일치 상황에서는 OpenClaw가 인바운드 세션 메타데이터는 기록하지만,
main 세션의 `lastRoute`는 갱신하지 않습니다.

## 라우팅 규칙(에이전트 선택 방법)

각 인바운드 메시지에는 **하나의 에이전트**만 선택됩니다.

1. **정확한 peer 일치** (`bindings`의 `peer.kind` + `peer.id`)
2. **부모 peer 일치** (스레드 상속)
3. **guild + roles 일치** (Discord) via `guildId` + `roles`
4. **guild 일치** (Discord) via `guildId`
5. **team 일치** (Slack) via `teamId`
6. **account 일치** (채널의 `accountId`)
7. **channel 일치** (그 채널의 아무 계정이나, `accountId: "*"` )
8. **기본 에이전트** (`agents.list[].default`, 없으면 리스트 첫 항목, 마지막 fallback은 `main`)

binding에 여러 매치 필드(`peer`, `guildId`, `teamId`, `roles`)가 함께 있으면, **제공된 모든 필드가 일치해야** 해당 binding이 적용됩니다.

매치된 에이전트가 어떤 workspace와 session store를 쓸지 결정합니다.

## 브로드캐스트 그룹(여러 에이전트 실행)

브로드캐스트 그룹은 **OpenClaw가 원래 응답했을 상황에서** 같은 peer에 대해 **여러 에이전트**를 실행하게 해 줍니다(예: WhatsApp 그룹에서 mention/activation gating 이후).

설정:

```json5
{
  broadcast: {
    strategy: "parallel",
    "120363403215116621@g.us": ["alfred", "baerbel"],
    "+15555550123": ["support", "logger"],
  },
}
```

참고: [브로드캐스트 그룹](/channels/broadcast-groups)

## 설정 개요

- `agents.list`: 이름이 있는 에이전트 정의(workspace, model 등)
- `bindings`: 인바운드 채널/계정/peer를 에이전트에 매핑

예시:

```json5
{
  agents: {
    list: [{ id: "support", name: "Support", workspace: "~/.openclaw/workspace-support" }],
  },
  bindings: [
    { match: { channel: "slack", teamId: "T123" }, agentId: "support" },
    { match: { channel: "telegram", peer: { kind: "group", id: "-100123" } }, agentId: "support" },
  ],
}
```

## 세션 저장

세션 저장소는 state 디렉터리(기본값 `~/.openclaw`) 아래에 있습니다.

- `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- JSONL transcript는 저장소와 같은 위치에 생성됩니다.

`session.store`와 `{agentId}` 템플릿을 사용해 저장소 경로를 바꿀 수 있습니다.

## WebChat 동작

WebChat은 **선택된 에이전트**에 붙고, 기본적으로 그 에이전트의 main
세션을 사용합니다. 그래서 WebChat에서는 해당 에이전트의 여러 채널 컨텍스트를 한곳에서 볼 수 있습니다.

## 응답 컨텍스트

인바운드 reply에는 다음이 포함됩니다.

- 가능할 경우 `ReplyToId`, `ReplyToBody`, `ReplyToSender`
- 인용 컨텍스트는 `[Replying to ...]` 블록으로 `Body`에 추가됩니다.

이 동작은 채널 전반에서 일관됩니다.
