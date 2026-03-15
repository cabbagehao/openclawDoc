---
summary: "에이전트 루프의 수명주기(Lifecycle), 이벤트 스트림 및 대기(Wait) 시맨틱 안내"
read_when:
  - 에이전트 루프의 동작 과정이나 수명주기 이벤트를 상세히 파악해야 할 때
  - 시스템 내부의 메시지 처리 흐름을 이해하고자 할 때
title: "에이전트 루프"
x-i18n:
  source_path: "concepts/agent-loop.md"
---

# 에이전트 루프 (Agent Loop)

에이전트 루프는 에이전트가 실행되는 전체 과정을 의미함: 입력 수집 → 컨텍스트 구성 → 모델 추론 → 도구 실행 → 응답 스트리밍 → 데이터 영속화. 이는 메시지를 분석하여 실제 행동을 취하고 최종 응답을 생성하는 결정적인 경로이며, 동시에 세션 상태의 일관성을 유지하는 핵심 메커니즘임.

OpenClaw에서 루프는 세션당 하나의 직렬화된 실행 단위로 작동하며, 모델이 사고하고 도구를 호출하며 결과를 출력하는 과정에서 수명주기 및 스트림 이벤트를 발생시킴. 이 문서는 이러한 루프가 엔드투엔드로 어떻게 연결되어 작동하는지 설명함.

## 주요 진입점 (Entry Points)

- **Gateway RPC**: `agent` 및 `agent.wait` 메서드.
- **CLI**: `openclaw agent` 명령어.

## 동작 방식 (상위 수준 개요)

1. **요청 접수**: `agent` RPC가 파라미터를 검증하고 세션(sessionKey/sessionId)을 해석함. 세션 메타데이터를 저장한 후 `{ runId, acceptedAt }` 정보를 즉시 반환함.
2. **에이전트 실행**: `agentCommand`가 에이전트 로직을 수행함.
   - 모델 정보 및 사고(Thinking)/상세 출력(Verbose) 설정값 해석.
   - 스킬(Skills) 스냅샷 로드.
   - `runEmbeddedPiAgent` (pi-agent-core 런타임) 호출.
   - 내장 루프가 이벤트를 발생시키지 않을 경우를 대비해 **수명주기 종료/오류** 이벤트를 보장함.
3. **런타임 처리 (`runEmbeddedPiAgent`)**:
   - 세션별 및 전역 큐를 통한 실행 직렬화.
   - 모델 및 인증 프로필 해석 후 Pi 세션 구축.
   - Pi 이벤트를 구독하여 어시스턴트 및 도구의 변화량(Delta)을 스트리밍함.
   - 타임아웃을 감시하고 초과 시 실행을 강제 중단(Abort)함.
   - 최종 페이로드 및 사용량 메타데이터 반환.
4. **이벤트 브리지**: `subscribeEmbeddedPiSession` 함수가 `pi-agent-core` 이벤트를 OpenClaw `agent` 스트림으로 연결함.
   - 도구 관련 이벤트 => `stream: "tool"`
   - 어시스턴트 변화량 => `stream: "assistant"`
   - 수명주기 이벤트 => `stream: "lifecycle"` (단계: `start` | `end` | `error`)
5. **결과 대기**: `agent.wait` 메서드는 `waitForAgentJob`을 호출함.
   - 특정 `runId`의 **수명주기 종료/오류** 시점까지 대기함.
   - `{ status: ok|error|timeout, startedAt, endedAt, error? }` 구조의 결과를 반환함.

## 큐잉 및 동시성 제어 (Queueing)

- 모든 실행은 세션 키(Session Lane) 단위로 직렬화되며, 필요한 경우 전역 레인(Global Lane)을 거침.
- 이는 도구 실행이나 세션 데이터의 경쟁 상태(Race condition)를 방지하고 이력의 일관성을 보장하기 위함임.
- 메시징 채널은 상황에 따라 적절한 큐 모드(collect, steer, followup)를 선택하여 이 시스템에 요청을 전달함. 상세 내용은 [명령어 대기열(Queue)](/concepts/queue) 참조.

## 세션 및 워크스페이스 준비

- 워크스페이스 경로를 해석하고 필요 시 생성함. 샌드박스 실행 시 별도의 격리된 워크스페이스 루트로 리디렉션될 수 있음.
- 스킬 데이터를 로드(또는 스냅샷 재사용)하여 환경 변수 및 프롬프트에 주입함.
- 부트스트랩 및 컨텍스트 파일을 확인하여 시스템 프롬프트에 포함시킴.
- 세션 쓰기 잠금(Lock)을 획득하고, 스트리밍 시작 전 `SessionManager`를 초기화함.

## 프롬프트 조립 및 시스템 프롬프트

- 시스템 프롬프트는 OpenClaw 기본 프롬프트, 스킬별 지침, 부트스트랩 컨텍스트, 그리고 실행 시점의 오버라이드 정보를 합쳐서 생성됨.
- 모델별 토큰 제한 및 압축을 위한 예약 토큰(Compaction reserve) 규정이 적용됨.
- 상세 내용은 [시스템 프롬프트 구성](/concepts/system-prompt) 참조.

## 훅(Hook) 포인트: 동작 가로채기

OpenClaw는 두 가지 형태의 확장 포인트를 제공함:

- **내부 훅 (Gateway Hooks)**: 명령어 및 수명주기 이벤트에 반응하는 이벤트 기반 스크립트.
- **플러그인 훅 (Plugin Hooks)**: 에이전트/도구 수명주기 및 Gateway 파이프라인 내부의 세밀한 제어 지점.

### 내부 훅 (Gateway Hooks)

- **`agent:bootstrap`**: 시스템 프롬프트가 확정되기 전, 부트스트랩 파일을 구성하는 단계에서 실행됨. 컨텍스트 파일을 동적으로 추가하거나 제거할 때 사용함.
- **명령어 훅**: `/new`, `/reset`, `/stop` 등 슬래시 명령어 발생 시 실행됨.

상세 설정 및 예시는 [훅(Hooks) 가이드](/automation/hooks) 참조.

### 플러그인 훅 (수명주기 확장)

- **`before_model_resolve`**: 세션 로드 전 실행됨. 모델 해석 전 공급자나 모델 ID를 결정론적으로 변경 가능함.
- **`before_prompt_build`**: 세션 로드 후, 프롬프트 제출 직전에 실행됨. `prependContext` 등을 통해 동적 텍스트를 주입할 수 있음.
- **`agent_end`**: 실행 완료 후 최종 메시지 목록과 메타데이터를 확인하는 시점임.
- **`before_compaction` / `after_compaction`**: 대화 압축 주기를 모니터링하거나 개입함.
- **`before_tool_call` / `after_tool_call`**: 도구의 파라미터나 실행 결과를 가로채어 수정 가능함.
- **`tool_result_persist`**: 도구 결과가 세션 이력에 기록되기 직전에 동기적으로 변환함.
- **`message_received` / `message_sending` / `message_sent`**: 메시지의 수발신 전후 시점 제어.

상세 API 명세는 [플러그인 훅 레퍼런스](/tools/plugin#plugin-hooks) 참조.

## 스트리밍 및 부분 응답 (Streaming)

- 어시스턴트의 생성 결과가 실시간으로 스트리밍되어 `assistant` 이벤트로 전달됨.
- 블록 스트리밍 모드에서는 텍스트 종료(`text_end`) 또는 메시지 종료(`message_end`) 시점에 부분 응답을 내보낼 수 있음.
- 모델의 사고 과정(Reasoning)은 별도의 스트림이나 블록 응답 형태로 전송 가능함.
- 상세 동작은 [스트리밍 가이드](/concepts/streaming) 참조.

## 도구 실행 및 메시징 도구 처리

- 도구의 시작, 업데이트, 종료 이벤트는 `tool` 스트림을 통해 전달됨.
- 결과 데이터는 보안 및 가독성을 위해 크기 제한 및 이미지 데이터 정제 과정을 거친 후 로그에 기록되거나 출력됨.
- 메시징 도구를 통한 중복 전송을 방지하기 위해 별도의 추적 로직이 작동함.

## 응답 정제 및 억제 (Reply Shaping)

- 최종 결과물은 어시스턴트 텍스트, 사고 과정, 도구 실행 요약(활성화 시), 오류 메시지 등을 조합하여 구성됨.
- `NO_REPLY` 토큰은 무음 응답으로 간주되어 발신 목록에서 제외됨.
- 메시징 도구가 이미 결과를 전송한 경우, 어시스턴트의 중복 확인 텍스트를 제거함.
- 표시할 내용이 없고 도구 실행 중 오류가 발생한 경우, 폴백(Fallback) 오류 메시지를 생성하여 사용자에게 알림.

## 압축 및 재시도 (Compaction)

- 자동 압축 수행 시 `compaction` 이벤트를 발생시키며, 필요에 따라 실행을 재시도할 수 있음.
- 재시도 시에는 중복 출력을 방지하기 위해 메모리 버퍼와 요약 정보를 초기화함.
- 상세 파이프라인은 [데이터 압축(Compaction)](/concepts/compaction) 참조.

## 현재 지원되는 이벤트 스트림

- `lifecycle`: 전체적인 진행 단계 및 성공/실패 여부.
- `assistant`: 에이전트가 생성한 실시간 응답 조각.
- `tool`: 실행 중인 도구의 상태 및 결과 정보.

## 채팅 채널 처리 로직

- 실시간 변화량(Delta)은 채팅 창에서 `delta` 메시지로 누적되어 표시됨.
- **수명주기 종료 또는 오류** 시점에 최종(`final`) 메시지로 확정되어 전송됨.

## 타임아웃 (Timeouts)

- **`agent.wait` 기본값**: 30초 (대기 작업 자체에 대한 시간 제한).
- **에이전트 런타임**: `agents.defaults.timeoutSeconds` (기본 600초). `runEmbeddedPiAgent` 내부의 중단 타이머에 의해 강제됨.

## 중도 종료 시나리오

- 에이전트 실행 시간 초과 (Abort).
- 명시적인 중단 신호 수신 (Cancel/AbortSignal).
- Gateway 서버 연결 끊김 또는 RPC 타임아웃 발생.
- `agent.wait` 대기 시간 만료 (대기만 중단되며 에이전트 실행은 계속될 수 있음).
