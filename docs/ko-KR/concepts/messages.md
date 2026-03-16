---
summary: "Message flow, sessions, queueing, and reasoning visibility"
description: "수신 message가 session key와 queue를 거쳐 agent run과 outbound reply로 바뀌는 과정, 그리고 reasoning visibility 설정을 설명합니다."
read_when:
  - inbound message가 reply가 되는 과정을 설명할 때
  - session, queue mode, streaming 동작을 정리할 때
  - reasoning visibility와 usage 영향을 문서화할 때
title: "Messages"
x-i18n:
  source_path: "concepts/messages.md"
---

# Messages

이 페이지는 OpenClaw가 inbound message, session, queueing, streaming, reasoning visibility를 어떻게 다루는지 연결해서 설명합니다.

## Message flow (high level)

```text
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

주요 knob는 config에 있습니다.

- `messages.*`는 prefix, queueing, group behavior를 담당
- `agents.defaults.*`는 block streaming과 chunking default를 담당
- channel override(`channels.whatsapp.*`, `channels.telegram.*` 등)는 cap과 streaming toggle을 담당

전체 schema는 [Configuration](/gateway/configuration)을 참고하세요.

## Inbound dedupe

channel은 reconnect 뒤 같은 message를 다시 전달할 수 있습니다.
OpenClaw는 channel/account/peer/session/message id 기반의 짧은 cache를 유지해 duplicate delivery가 agent run을 다시 트리거하지 않게 합니다.

## Inbound debouncing

**같은 sender**의 빠른 연속 message는 `messages.inbound`를 통해 하나의 agent turn으로 batch될 수 있습니다.
debouncing은 channel + conversation별로 적용되며, reply threading/ID에는 가장 최근 message를 사용합니다.

Config 예시 (global default + per-channel override):

```json5
{
  messages: {
    inbound: {
      debounceMs: 2000,
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
        discord: 1500,
      },
    },
  },
}
```

Notes:

- debounce는 **text-only** message에만 적용됩니다. media/attachment는 즉시 flush됩니다.
- control command는 debounce를 우회하여 standalone으로 유지됩니다.

## Sessions and devices

session은 client가 아니라 gateway가 소유합니다.

- direct chat은 agent main session key로 collapse됩니다.
- group/channel은 각자의 session key를 가집니다.
- session store와 transcript는 gateway host에 저장됩니다.

여러 device/channel이 같은 session에 매핑될 수 있지만, history가 모든 client로 완전히 sync되지는 않습니다.
긴 대화에서는 divergent context를 피하기 위해 하나의 primary device를 쓰는 것을 권장합니다.
Control UI와 TUI는 항상 gateway-backed session transcript를 보여 주므로 source of truth 역할을 합니다.

자세한 내용은 [Session management](/concepts/session)을 참고하세요.

## Inbound bodies and history context

OpenClaw는 **prompt body**와 **command body**를 분리합니다.

- `Body`: agent에 보내는 prompt text. channel envelope와 optional history wrapper가 포함될 수 있습니다.
- `CommandBody`: directive/command parsing용 raw user text
- `RawBody`: `CommandBody`의 legacy alias (호환성 유지용)

channel이 history를 제공할 때는 공통 wrapper를 사용합니다.

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

**non-direct chat**(group/channel/room)에서는 **current message body** 앞에 sender label을 붙입니다.
이렇게 하면 실시간 message와 queued/history message가 agent prompt 안에서 같은 스타일을 유지합니다.

history buffer는 **pending-only**입니다.
run을 트리거하지 않은 group message(예: mention-gated message)는 포함하지만,
이미 session transcript에 있는 message는 제외합니다.

directive stripping은 **current message** section에만 적용되어 history는 온전히 유지됩니다.
history를 감싸는 channel은 `CommandBody`(또는 `RawBody`)에 원래 message text를 넣고,
`Body`에는 결합된 prompt를 유지해야 합니다.
history buffer는 `messages.groupChat.historyLimit`(global default)와
`channels.slack.historyLimit` 또는 `channels.telegram.accounts.<id>.historyLimit` 같은 per-channel override로 조절합니다.
`0`으로 설정하면 비활성화됩니다.

## Queueing and followups

run이 이미 active 상태라면, inbound message는 queue에 쌓이거나 현재 run으로 steer되거나,
followup turn을 위해 수집될 수 있습니다.

- `messages.queue`와 `messages.queue.byChannel`로 구성
- mode: `interrupt`, `steer`, `followup`, `collect`와 backlog variant

자세한 내용은 [Queueing](/concepts/queue)을 참고하세요.

## Streaming, chunking, and batching

block streaming은 model이 text block을 생성하는 동안 partial reply를 보냅니다.
chunking은 channel text limit를 존중하고 fenced code가 split되지 않게 합니다.

주요 설정:

- `agents.defaults.blockStreamingDefault` (`on|off`, 기본 off)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (idle 기반 batching)
- `agents.defaults.humanDelay` (block reply 사이의 human-like pause)
- channel override: `*.blockStreaming`, `*.blockStreamingCoalesce` (Telegram이 아닌 channel은 명시적 `*.blockStreaming: true` 필요)

자세한 내용은 [Streaming + chunking](/concepts/streaming)을 참고하세요.

## Reasoning visibility and tokens

OpenClaw는 model reasoning을 보이거나 숨길 수 있습니다.

- `/reasoning on|off|stream`으로 visibility 제어
- model이 reasoning을 생성했다면 reasoning content도 token usage에 포함
- Telegram은 reasoning stream을 draft bubble에 표시할 수 있음

자세한 내용은 [Thinking + reasoning directives](/tools/thinking)와 [Token use](/reference/token-use)를 참고하세요.

## Prefixes, threading, and replies

outbound message formatting은 `messages`에서 중앙 관리됩니다.

- `messages.responsePrefix`, `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix` (outbound prefix cascade), 그리고 `channels.whatsapp.messagePrefix` (WhatsApp inbound prefix)
- `replyToMode`와 channel default를 통한 reply threading

자세한 내용은 [Configuration](/gateway/configuration#messages)와 각 channel 문서를 참고하세요.
