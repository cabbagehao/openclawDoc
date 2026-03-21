---
summary: "채널별 라우팅 규칙(WhatsApp, Telegram, Discord, Slack)과 공유 컨텍스트"
read_when:
  - 채널 라우팅이나 받은편지함 동작을 변경할 때
title: "Channel Routing"
description: "OpenClaw가 채널별 메시지를 어떤 에이전트와 세션으로 라우팅하는지, DM·그룹·스레드의 컨텍스트가 어떻게 분리되는지 설명합니다."
x-i18n:
  source_path: "channels/channel-routing.md"
---

# 채널 및 라우팅

OpenClaw는 응답을 **메시지가 들어온 채널로 다시 보냅니다**. 모델이 채널을
선택하는 것은 아니며, 라우팅은 호스트 설정으로 결정되고 결정론적으로
동작합니다.

## 핵심 용어

- **Channel**: `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`, `webchat`.
- **AccountId**: 채널별 계정 인스턴스(지원되는 경우).
- 선택적 채널 기본 계정: `channels.<channel>.defaultAccount`는 아웃바운드 경로에
  `accountId`가 지정되지 않았을 때 사용할 계정을 선택합니다.
  - 다중 계정 구성에서는 두 개 이상의 계정이 설정되어 있을 때 명시적인 기본값
    (`defaultAccount` 또는 `accounts.default`)을 지정하세요. 그렇지 않으면
    fallback 라우팅이 첫 번째로 정규화된 account ID를 선택할 수 있습니다.
- **AgentId**: 격리된 workspace + session store("brain").
- **SessionKey**: 컨텍스트를 저장하고 동시성을 제어하는 데 사용하는 버킷 키.

## SessionKey 형태(예시)

다이렉트 메시지는 에이전트의 **main** 세션으로 합쳐집니다.

- `agent:<agentId>:<mainKey>` (기본값: `agent:main:main`)

그룹과 채널은 채널별로 분리된 상태를 유지합니다.

- Groups: `agent:<agentId>:<channel>:group:<id>`
- Channels/rooms: `agent:<agentId>:<channel>:channel:<id>`

Threads:

- Slack/Discord threads는 기본 키 뒤에 `:thread:<threadId>`를 붙입니다.
- Telegram forum topics는 그룹 키에 `:topic:<topicId>`를 포함합니다.

예시:

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## Main DM route pinning

`session.dmScope`가 `main`이면 다이렉트 메시지가 하나의 main 세션을 공유할 수
있습니다. 비소유자 DM이 세션의 `lastRoute`를 덮어쓰지 않도록, OpenClaw는 다음
조건이 모두 참일 때 `allowFrom`에서 고정된 소유자를 추론합니다.

- `allowFrom`에 와일드카드가 아닌 항목이 정확히 하나 있다.
- 그 항목을 해당 채널의 구체적인 sender ID로 정규화할 수 있다.
- 들어온 DM의 sender가 그 고정 소유자와 일치하지 않는다.

이 불일치 상황에서 OpenClaw는 들어온 세션 메타데이터는 기록하지만, main 세션의
`lastRoute`는 업데이트하지 않습니다.

## 라우팅 규칙(에이전트 선택 방식)

라우팅은 각 inbound message에 대해 **하나의 에이전트**를 선택합니다.

1. **정확한 peer 일치** (`bindings`에서 `peer.kind` + `peer.id`).
2. **상위 peer 일치** (thread inheritance).
3. **guild + roles 일치** (Discord) via `guildId` + `roles`.
4. **guild 일치** (Discord) via `guildId`.
5. **team 일치** (Slack) via `teamId`.
6. **account 일치** (`accountId` on the channel).
7. **channel 일치** (해당 채널의 모든 account, `accountId: "*"`).
8. **기본 에이전트** (`agents.list[].default`, 없으면 첫 번째 list entry, fallback은 `main`).

바인딩에 여러 매치 필드(`peer`, `guildId`, `teamId`, `roles`)가 포함되면,
해당 바인딩이 적용되려면 **제공된 모든 필드가 일치해야 합니다**.

일치한 에이전트가 어떤 workspace와 session store를 사용할지 결정합니다.

## Broadcast groups(여러 에이전트 실행)

Broadcast groups를 사용하면 동일한 peer에 대해 **여러 에이전트**를 실행할 수
있습니다. 단, 이는 OpenClaw가 일반적으로 응답하는 경우에만 적용됩니다
(예: WhatsApp groups에서 mention/activation gating을 통과한 뒤).

Config:

```json5
{
  broadcast: {
    strategy: "parallel",
    "120363403215116621@g.us": ["alfred", "baerbel"],
    "+15555550123": ["support", "logger"],
  },
}
```

See: [Broadcast Groups](/channels/broadcast-groups).

## Config 개요

- `agents.list`: 이름 있는 에이전트 정의(workspace, model 등).
- `bindings`: inbound channels/accounts/peers를 에이전트에 매핑합니다.

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

## Session storage

Session store는 state directory(기본값 `~/.openclaw`) 아래에 있습니다.

- `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- JSONL transcripts는 store 옆에 저장됩니다.

`session.store`와 `{agentId}` 템플릿으로 store 경로를 재정의할 수 있습니다.

## WebChat 동작

WebChat은 **선택된 에이전트**에 연결되며, 기본적으로 해당 에이전트의 main
session을 사용합니다. 이 때문에 WebChat에서는 해당 에이전트의 채널 간
컨텍스트를 한곳에서 볼 수 있습니다.

## 답장 컨텍스트

들어오는 답장에는 다음 정보가 포함됩니다.

- `ReplyToId`, `ReplyToBody`, `ReplyToSender` (사용 가능한 경우).
- 인용 컨텍스트는 `[Replying to ...]` 블록으로 `Body`에 추가됩니다.

이 동작은 모든 채널에서 일관됩니다.
