---
summary: "Agent loop lifecycle, streams, and wait semantics"
description: "수신 요청이 실제 agent run으로 이어지고 lifecycle, tool, assistant stream으로 흘러가는 OpenClaw agent loop의 end-to-end 경로를 설명합니다."
read_when:
  - agent loop와 lifecycle event를 정확히 이해해야 할 때
title: "Agent Loop"
x-i18n:
  source_path: "concepts/agent-loop.md"
---

# Agent Loop (OpenClaw)

agentic loop는 agent의 전체 “실제” 실행 경로입니다.
입력 수집 → context assembly → model inference → tool execution → streaming reply → persistence까지 포함합니다.
이 경로가 message를 action과 최종 reply로 바꾸면서 session state를 일관되게 유지합니다.

OpenClaw에서 loop는 session당 하나의 직렬화된 run이며,
모델이 생각하고 tool을 호출하고 output을 stream하는 동안 lifecycle과 stream event를 emit합니다.
이 문서는 그 authentic loop가 end-to-end로 어떻게 연결되는지 설명합니다.

## Entry points

- Gateway RPC: `agent`, `agent.wait`
- CLI: `agent` command

## How it works (high-level)

1. `agent` RPC가 param을 validate하고, session(sessionKey/sessionId)을 resolve하고, session metadata를 persist한 뒤 `{ runId, acceptedAt }`를 즉시 반환합니다.
2. `agentCommand`가 agent를 실행합니다.
   - model과 thinking/verbose default를 resolve
   - skill snapshot 로드
   - `runEmbeddedPiAgent` 호출 (pi-agent-core runtime)
   - embedded loop가 emit하지 않더라도 **lifecycle end/error**를 보장
3. `runEmbeddedPiAgent`
   - per-session queue와 global queue로 run을 직렬화
   - model + auth profile을 resolve하고 pi session 구성
   - pi event를 구독해 assistant/tool delta를 stream
   - timeout을 강제하고 초과 시 run abort
   - payload와 usage metadata 반환
4. `subscribeEmbeddedPiSession`이 pi-agent-core event를 OpenClaw `agent` stream에 bridge합니다.
   - tool event => `stream: "tool"`
   - assistant delta => `stream: "assistant"`
   - lifecycle event => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait`는 `waitForAgentJob`을 사용합니다.
   - 특정 `runId`의 **lifecycle end/error**까지 대기
   - `{ status: ok|error|timeout, startedAt, endedAt, error? }` 반환

## Queueing + concurrency

- run은 session key별(session lane)로 직렬화되며, 필요 시 global lane도 통과합니다.
- 이것은 tool/session race를 막고 session history 일관성을 유지합니다.
- messaging channel은 `collect`, `steer`, `followup` 같은 queue mode를 통해 이 lane system에 message를 넣습니다.
  자세한 내용은 [Command Queue](/concepts/queue)를 참고하세요.

## Session + workspace preparation

- workspace를 resolve하고 생성합니다. sandbox run은 sandbox workspace root로 리디렉션될 수 있습니다.
- skill을 로드하거나 snapshot에서 재사용하고, env와 prompt에 주입합니다.
- bootstrap/context file을 resolve하고 system prompt report에 포함합니다.
- session write lock을 잡고, streaming 전에 `SessionManager`를 열어 준비합니다.

## Prompt assembly + system prompt

- system prompt는 OpenClaw base prompt, skills prompt, bootstrap context, per-run override로 구성됩니다.
- model별 limit과 compaction reserve token을 적용합니다.
- 모델이 실제로 보는 내용은 [System prompt](/concepts/system-prompt)를 참고하세요.

## Hook points (where you can intercept)

OpenClaw에는 두 종류의 hook system이 있습니다.

- **Internal hook** (Gateway hook): command와 lifecycle event에 반응하는 script
- **Plugin hook**: agent/tool lifecycle과 gateway pipeline 안의 extension point

### Internal hooks (Gateway hooks)

- **`agent:bootstrap`**: system prompt가 finalize되기 전에 bootstrap file을 구성하는 동안 실행됩니다.
  bootstrap context file을 추가하거나 제거할 때 사용합니다.
- **Command hooks**: `/new`, `/reset`, `/stop` 등 command event에 반응합니다.

설정과 예시는 [Hooks](/automation/hooks)를 참고하세요.

### Plugin hooks (agent + gateway lifecycle)

이 hook은 agent loop 또는 gateway pipeline 안에서 실행됩니다.

- **`before_model_resolve`**: pre-session 단계에서 실행됩니다. (`messages` 없음) model resolution 전에 provider/model을 결정론적으로 override할 수 있습니다.
- **`before_prompt_build`**: session load 후 실행됩니다. (`messages` 있음) prompt 제출 전에 `prependContext`, `systemPrompt`, `prependSystemContext`, `appendSystemContext`를 inject할 수 있습니다. per-turn 동적 text에는 `prependContext`, system prompt 공간에 남아야 하는 안정적 guidance에는 system-context field를 사용하세요.
- **`before_agent_start`**: legacy compatibility hook으로 두 단계 중 어느 쪽에서든 실행될 수 있습니다. 명시적 hook을 우선하세요.
- **`agent_end`**: 완료 후 최종 message list와 run metadata를 검사합니다.
- **`before_compaction` / `after_compaction`**: compaction cycle을 관찰하거나 annotate합니다.
- **`before_tool_call` / `after_tool_call`**: tool param/result를 가로챕니다.
- **`tool_result_persist`**: tool result가 session transcript에 기록되기 전에 동기적으로 변환합니다.
- **`message_received` / `message_sending` / `message_sent`**: inbound와 outbound message hook
- **`session_start` / `session_end`**: session lifecycle boundary
- **`gateway_start` / `gateway_stop`**: gateway lifecycle event

hook API와 registration detail은 [Plugins](/tools/plugin#plugin-hooks)를 참고하세요.

## Streaming + partial replies

- assistant delta는 pi-agent-core에서 stream되고 `assistant` event로 emit됩니다.
- block streaming은 `text_end` 또는 `message_end` 시점에 partial reply를 보낼 수 있습니다.
- reasoning streaming은 별도 stream이나 block reply로 보낼 수 있습니다.
- chunking과 block reply 동작은 [Streaming](/concepts/streaming)을 참고하세요.

## Tool execution + messaging tools

- tool start/update/end event는 `tool` stream으로 emit됩니다.
- tool result는 log/emit 전에 size와 image payload 측면에서 sanitize됩니다.
- messaging tool send는 중복된 assistant confirmation을 막기 위해 추적됩니다.

## Reply shaping + suppression

최종 payload는 다음을 조합해 구성됩니다.

- assistant text (필요하면 reasoning 포함)
- inline tool summary (verbose + 허용된 경우)
- model error가 있을 때 assistant error text

`NO_REPLY`는 silent token으로 취급되어 outgoing payload에서 제거됩니다.
messaging tool이 만든 duplicate는 final payload list에서 제거됩니다.
표시 가능한 payload가 남지 않았고 tool error가 있었다면, fallback tool error reply를 emit합니다.
(단, messaging tool이 이미 user-visible reply를 보낸 경우는 제외)

## Compaction + retries

- auto-compaction은 `compaction` stream event를 emit하고 retry를 트리거할 수 있습니다.
- retry 시 duplicate output을 막기 위해 in-memory buffer와 tool summary를 reset합니다.
- compaction pipeline은 [Compaction](/concepts/compaction)을 참고하세요.

## Event streams (today)

- `lifecycle`: `subscribeEmbeddedPiSession`이 emit (필요 시 `agentCommand` fallback도 있음)
- `assistant`: pi-agent-core의 streamed delta
- `tool`: pi-agent-core의 streamed tool event

## Chat channel handling

- assistant delta는 chat `delta` message로 buffer됩니다.
- chat `final`은 **lifecycle end/error** 시점에 emit됩니다.

## Timeouts

- `agent.wait` 기본값: 30초 (대기만 해당). `timeoutMs`로 override 가능
- agent runtime: `agents.defaults.timeoutSeconds` 기본값 600초, `runEmbeddedPiAgent`의 abort timer에서 강제

## Where things can end early

- agent timeout (abort)
- AbortSignal (cancel)
- Gateway disconnect 또는 RPC timeout
- `agent.wait` timeout (대기만 종료하며 agent 자체는 멈추지 않음)
