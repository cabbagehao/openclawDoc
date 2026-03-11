---
summary: "에이전트 루프의 수명주기, 스트림, wait 의미"
read_when:
  - 에이전트 루프 또는 수명주기 이벤트를 정확히 이해해야 할 때
title: "Agent Loop"
---

# Agent Loop (OpenClaw)

agentic loop는 에이전트의 전체 실제 실행 경로입니다. 입력 수집 → 컨텍스트 구성 → 모델 추론 → 도구 실행 → 응답 스트리밍 → 영속화까지를 포함합니다. 이 경로는 메시지를 실제 동작과 최종 응답으로 바꾸는 authoritative path이며, 동시에 세션 상태의 일관성도 유지합니다.

OpenClaw에서 루프는 세션당 하나의 직렬화된 실행이며, 모델이 생각하고 도구를 호출하고 출력을 스트리밍하는 동안 lifecycle 이벤트와 stream 이벤트를 방출합니다. 이 문서는 그 실제 루프가 엔드투엔드로 어떻게 연결되는지 설명합니다.

## Entry points

- Gateway RPC: `agent`, `agent.wait`
- CLI: `agent` 명령

## How it works (high-level)

1. `agent` RPC가 파라미터를 검증하고, 세션(sessionKey/sessionId)을 해석하고, 세션 메타데이터를 저장한 뒤 `{ runId, acceptedAt }`를 즉시 반환합니다.
2. `agentCommand`가 agent를 실행합니다.
   - model 및 thinking/verbose 기본값 해석
   - skills snapshot 로드
   - `runEmbeddedPiAgent` 호출(pi-agent-core runtime)
   - embedded loop가 직접 내보내지 않으면 **lifecycle end/error**를 방출
3. `runEmbeddedPiAgent`는 다음을 수행합니다.
   - 세션별 큐 + 전역 큐를 통해 실행 직렬화
   - model + auth profile 해석 후 pi session 구성
   - pi 이벤트를 구독하고 assistant/tool delta를 스트리밍
   - timeout을 강제하고 초과 시 실행 중단
   - payload와 usage metadata 반환
4. `subscribeEmbeddedPiSession`이 pi-agent-core 이벤트를 OpenClaw `agent` stream으로 브리지합니다.
   - tool 이벤트 => `stream: "tool"`
   - assistant delta => `stream: "assistant"`
   - lifecycle 이벤트 => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait`는 `waitForAgentJob`을 사용합니다.
   - `runId`의 **lifecycle end/error**를 기다립니다.
   - `{ status: ok|error|timeout, startedAt, endedAt, error? }`를 반환합니다.

## Queueing + concurrency

- 실행은 세션 키(session lane) 단위로 직렬화되며, 필요하면 전역 lane도 거칩니다.
- 이 구조는 tool/session 경쟁 상태를 막고 세션 히스토리를 일관되게 유지합니다.
- 메시징 채널은 이 lane 시스템으로 흘러가는 queue mode(collect/steer/followup)를 선택할 수 있습니다.
  자세한 내용은 [Command Queue](/concepts/queue)를 참고하세요.

## Session + workspace preparation

- workspace를 해석하고 생성합니다. sandboxed run은 sandbox workspace root로 리디렉션될 수 있습니다.
- skills를 로드하거나 snapshot에서 재사용한 뒤 env와 prompt에 주입합니다.
- bootstrap/context 파일을 해석하고 system prompt report에 주입합니다.
- session write lock을 획득한 뒤 `SessionManager`를 열고 스트리밍 전에 준비합니다.

## Prompt assembly + system prompt

- system prompt는 OpenClaw base prompt, skills prompt, bootstrap context, 실행별 override로 구성됩니다.
- 모델별 제한과 compaction reserve token이 강제됩니다.
- 모델이 실제로 보는 프롬프트는 [System prompt](/concepts/system-prompt)를 참고하세요.

## Hook points (where you can intercept)

OpenClaw에는 두 가지 hook 시스템이 있습니다.

- **Internal hooks**(Gateway hooks): 명령과 lifecycle 이벤트를 위한 이벤트 기반 스크립트
- **Plugin hooks**: agent/tool lifecycle 및 gateway pipeline 내부의 확장 지점

### Internal hooks (Gateway hooks)

- **`agent:bootstrap`**: system prompt가 최종화되기 전에 bootstrap 파일을 구성하는 동안 실행됩니다.
  bootstrap context 파일을 추가/제거할 때 사용하세요.
- **Command hooks**: `/new`, `/reset`, `/stop` 및 기타 command 이벤트(Hooks 문서 참고)

설정과 예시는 [Hooks](/automation/hooks)를 참고하세요.

### Plugin hooks (agent + gateway lifecycle)

이 hook들은 agent loop 또는 gateway pipeline 내부에서 실행됩니다.

- **`before_model_resolve`**: 세션 전 단계에서 실행되며(`messages` 없음), model resolution 전에 provider/model을 결정론적으로 override할 수 있습니다.
- **`before_prompt_build`**: 세션 로드 후(`messages` 포함) 실행되며, prompt 제출 전에 `prependContext`, `systemPrompt`, `prependSystemContext`, `appendSystemContext`를 주입할 수 있습니다. 실행별 동적 텍스트에는 `prependContext`, system prompt 공간에 고정적으로 놓을 안정적인 지침에는 system-context 계열 필드를 사용하세요.
- **`before_agent_start`**: 레거시 호환 hook이며 두 단계 어느 쪽에서든 실행될 수 있습니다. 가능하면 위의 명시적 hook을 우선 사용하세요.
- **`agent_end`**: 완료 후 최종 메시지 목록과 실행 metadata를 점검합니다.
- **`before_compaction` / `after_compaction`**: compaction 주기를 관찰하거나 주석을 붙입니다.
- **`before_tool_call` / `after_tool_call`**: tool 파라미터와 결과를 가로챕니다.
- **`tool_result_persist`**: tool result를 세션 transcript에 기록하기 전에 동기적으로 변환합니다.
- **`message_received` / `message_sending` / `message_sent`**: 수신 및 발신 메시지 hook
- **`session_start` / `session_end`**: 세션 lifecycle 경계
- **`gateway_start` / `gateway_stop`**: gateway lifecycle 이벤트

hook API와 등록 방법은 [Plugins](/tools/plugin#plugin-hooks)를 참고하세요.

## Streaming + partial replies

- assistant delta는 pi-agent-core에서 스트리밍되어 `assistant` 이벤트로 방출됩니다.
- block streaming은 `text_end` 또는 `message_end`에서 partial reply를 내보낼 수 있습니다.
- reasoning streaming은 별도 stream으로 내보내거나 block reply에 포함할 수 있습니다.
- chunking 및 block reply 동작은 [Streaming](/concepts/streaming)을 참고하세요.

## Tool execution + messaging tools

- Tool 시작/업데이트/종료 이벤트는 `tool` stream에 방출됩니다.
- tool result는 로깅 및 방출 전에 크기와 이미지 payload 기준으로 정리됩니다.
- messaging tool의 전송은 추적되어 assistant의 중복 확인 메시지를 억제합니다.

## Reply shaping + suppression

- 최종 payload는 다음 요소로 조합됩니다.
  - assistant text(선택적으로 reasoning 포함)
  - inline tool summary(verbose 허용 시)
  - 모델 오류 시 assistant error text
- `NO_REPLY`는 무음 토큰처럼 처리되어 외부로 나가는 payload에서 제거됩니다.
- messaging tool 중복 전송은 최종 payload 목록에서 제거됩니다.
- 렌더링 가능한 payload가 남지 않았고 tool이 실패했다면, fallback tool error reply를 방출합니다.
  단, messaging tool이 이미 사용자에게 보이는 응답을 보낸 경우는 예외입니다.

## Compaction + retries

- auto-compaction은 `compaction` stream 이벤트를 방출하며 retry를 유발할 수 있습니다.
- retry 시 중복 출력을 피하기 위해 메모리 내 버퍼와 tool summary가 초기화됩니다.
- compaction 파이프라인은 [Compaction](/concepts/compaction)을 참고하세요.

## Event streams (today)

- `lifecycle`: `subscribeEmbeddedPiSession`에서 방출되며, 필요 시 `agentCommand`가 fallback으로도 방출
- `assistant`: pi-agent-core의 streamed delta
- `tool`: pi-agent-core의 streamed tool 이벤트

## Chat channel handling

- assistant delta는 chat `delta` 메시지로 버퍼링됩니다.
- chat `final`은 **lifecycle end/error** 시점에 방출됩니다.

## Timeouts

- `agent.wait` 기본값: 30초(대기만 해당). `timeoutMs` 파라미터로 override 가능
- Agent runtime: `agents.defaults.timeoutSeconds` 기본값 600초, `runEmbeddedPiAgent`의 abort timer에서 강제

## Where things can end early

- Agent timeout(abort)
- AbortSignal(cancel)
- Gateway disconnect 또는 RPC timeout
- `agent.wait` timeout(대기만 종료하며 agent를 멈추지는 않음)
