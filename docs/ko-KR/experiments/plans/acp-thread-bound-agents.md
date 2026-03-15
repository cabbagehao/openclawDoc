---
summary: "core의 1급 ACP 제어 평면과 플러그인 기반 런타임(acpx 우선)을 통해 ACP 코딩 에이전트를 통합한다"
owner: "onutc"
status: "draft"
last_updated: "2026-02-25"
title: "ACP 스레드 바운드 에이전트"
---

# ACP 스레드 바운드 에이전트

## 개요

이 계획은 OpenClaw가 스레드를 지원하는 채널(우선 Discord)에서 ACP 코딩 에이전트를 프로덕션 수준의 라이프사이클 및 복구와 함께 지원하는 방식을 정의합니다.

관련 문서:

- [Unified Runtime Streaming Refactor Plan](/experiments/plans/acp-unified-streaming-refactor)

목표 사용자 경험:

- 사용자가 ACP 세션을 스레드에 spawn하거나 해당 스레드로 focus한다
- 그 스레드의 사용자 메시지는 바인딩된 ACP 세션으로 라우팅된다
- 에이전트 출력은 동일한 스레드 persona로 다시 스트리밍된다
- 세션은 영속적일 수도 있고 one shot일 수도 있으며, 명시적인 cleanup 제어를 제공한다

## 결정 요약

장기 권장안은 하이브리드 아키텍처입니다.

- OpenClaw core가 ACP 제어 평면 관련 사항을 소유한다
  - 세션 식별자와 메타데이터
  - 스레드 바인딩 및 라우팅 결정
  - 전달 불변식과 중복 억제
  - 라이프사이클 cleanup 및 복구 의미론
- ACP 런타임 백엔드는 플러그형이다
  - 첫 번째 백엔드는 acpx 기반 플러그인 서비스다
  - 런타임은 ACP transport, queueing, cancel, reconnect를 담당한다

OpenClaw는 core 내부에서 ACP transport 내부 구현을 재구현해서는 안 됩니다.
OpenClaw는 라우팅을 위해 순수한 plugin-only interception 경로에 의존해서도 안 됩니다.

## North-star 아키텍처 (holy grail)

ACP를 플러그형 런타임 어댑터와 함께 OpenClaw의 1급 제어 평면으로 취급합니다.

협상 불가한 불변식:

- 모든 ACP 스레드 바인딩은 유효한 ACP 세션 레코드를 참조한다
- 모든 ACP 세션에는 명시적인 라이프사이클 상태가 있다 (`creating`, `idle`, `running`, `cancelling`, `closed`, `error`)
- 모든 ACP run에는 명시적인 run 상태가 있다 (`queued`, `running`, `completed`, `failed`, `cancelled`)
- spawn, bind, 초기 enqueue는 원자적이다
- 명령 재시는 idempotent하다 (중복 run 또는 중복 Discord 출력이 없어야 한다)
- 바인딩된 스레드 채널 출력은 ACP run 이벤트의 projection이며, ad-hoc side effect가 아니다

장기 소유 모델:

- `AcpSessionManager`는 ACP에 대한 유일한 writer이자 orchestrator다
- manager는 우선 gateway 프로세스에 위치하고, 이후 동일한 인터페이스 뒤의 전용 sidecar로 이동할 수 있다
- ACP 세션 키마다 manager는 하나의 in-memory actor(직렬화된 명령 실행)를 소유한다
- 어댑터(`acpx`, 향후 백엔드)는 transport/runtime 구현만 담당한다

장기 영속성 모델:

- ACP 제어 평면 상태를 OpenClaw 상태 디렉터리 아래 전용 SQLite 저장소(WAL 모드)로 옮긴다
- 마이그레이션 동안 `SessionEntry.acp`는 호환성 projection으로 유지하고 source-of-truth로 사용하지 않는다
- ACP 이벤트는 append-only로 저장해 replay, crash recovery, 결정적 전달을 지원한다

### 전달 전략 (holy-grail로 가는 브리지)

- 단기 브리지
  - 현재의 스레드 바인딩 메커니즘과 기존 ACP 설정 surface를 유지한다
  - metadata-gap 버그를 수정하고 ACP turn을 단일 core ACP branch로 라우팅한다
  - idempotency key와 fail-closed 라우팅 검사를 즉시 추가한다
- 장기 cutover
  - ACP source-of-truth를 제어 평면 DB + actor로 옮긴다
  - 바인딩된 스레드 전달을 순수한 event-projection 기반으로 만든다
  - 기회적으로 채워진 session-entry metadata에 의존하는 legacy fallback 동작을 제거한다

## pure plugin only가 아닌 이유

현재 plugin hook만으로는 core 변경 없이 종단간 ACP 세션 라우팅을 구현하기에 충분하지 않습니다.

- 스레드 바인딩에서 들어오는 inbound 라우팅은 먼저 core dispatch에서 세션 키로 해석된다
- message hook은 fire-and-forget이며 주 reply path를 short-circuit할 수 없다
- plugin command는 제어 작업에는 적합하지만 core의 per-turn dispatch 흐름 전체를 대체하기에는 적합하지 않다

결론:

- ACP 런타임은 plugin화할 수 있다
- ACP 라우팅 branch는 core에 존재해야 한다

## 재사용할 기존 기반

이미 구현되었으며 계속 표준으로 유지해야 하는 것:

- 스레드 바인딩 대상은 `subagent`와 `acp`를 지원한다
- inbound 스레드 라우팅 override는 일반 dispatch 이전에 바인딩으로 해석된다
- reply 전달에서 webhook을 통한 outbound 스레드 identity
- ACP 대상과 호환되는 `/focus` 및 `/unfocus` 흐름
- 시작 시 복원되는 영속 바인딩 저장소
- archive, delete, unfocus, reset, delete 시 unbind 라이프사이클

이 계획은 그 기반을 대체하는 대신 확장합니다.

## 아키텍처

### 경계 모델

Core (반드시 OpenClaw core에 있어야 함):

- reply 파이프라인의 ACP session-mode dispatch branch
- parent와 스레드의 중복 전달을 피하기 위한 delivery arbitration
- ACP 제어 평면 영속성(마이그레이션 중에는 `SessionEntry.acp` 호환성 projection 유지)
- session reset/delete에 묶인 lifecycle unbind 및 runtime detach 의미론

Plugin 백엔드(acpx 구현):

- ACP 런타임 worker supervision
- acpx 프로세스 실행 및 이벤트 파싱
- ACP 명령 핸들러(`/acp ...`) 및 운영자 UX
- 백엔드별 config 기본값과 diagnostics

### 런타임 소유 모델

- 하나의 gateway 프로세스가 ACP orchestration 상태를 소유한다
- ACP 실행은 acpx 백엔드를 통해 supervision되는 child process에서 수행된다
- 프로세스 전략은 메시지마다가 아니라 활성 ACP 세션 키마다 long lived로 유지된다

이렇게 하면 프롬프트마다 발생하는 startup 비용을 피하고 cancel 및 reconnect 의미론을 안정적으로 유지할 수 있습니다.

### Core 런타임 계약

라우팅 코드가 CLI 세부사항에 의존하지 않고 dispatch 로직 변경 없이 백엔드를 교체할 수 있도록 core ACP 런타임 계약을 추가합니다.

```ts
export type AcpRuntimePromptMode = "prompt" | "steer";

export type AcpRuntimeHandle = {
  sessionKey: string;
  backend: string;
  runtimeSessionName: string;
};

export type AcpRuntimeEvent =
  | { type: "text_delta"; stream: "output" | "thought"; text: string }
  | { type: "tool_call"; name: string; argumentsText: string }
  | { type: "done"; usage?: Record<string, number> }
  | { type: "error"; code: string; message: string; retryable?: boolean };

export interface AcpRuntime {
  ensureSession(input: {
    sessionKey: string;
    agent: string;
    mode: "persistent" | "oneshot";
    cwd?: string;
    env?: Record<string, string>;
    idempotencyKey: string;
  }): Promise<AcpRuntimeHandle>;

  submit(input: {
    handle: AcpRuntimeHandle;
    text: string;
    mode: AcpRuntimePromptMode;
    idempotencyKey: string;
  }): Promise<{ runtimeRunId: string }>;

  stream(input: {
    handle: AcpRuntimeHandle;
    runtimeRunId: string;
    onEvent: (event: AcpRuntimeEvent) => Promise<void> | void;
    signal?: AbortSignal;
  }): Promise<void>;

  cancel(input: {
    handle: AcpRuntimeHandle;
    runtimeRunId?: string;
    reason?: string;
    idempotencyKey: string;
  }): Promise<void>;

  close(input: { handle: AcpRuntimeHandle; reason: string; idempotencyKey: string }): Promise<void>;

  health?(): Promise<{ ok: boolean; details?: string }>;
}
```

구현 세부사항:

- 첫 번째 백엔드: plugin 서비스로 제공되는 `AcpxRuntime`
- core는 registry를 통해 런타임을 해석하고, 사용 가능한 ACP 런타임 백엔드가 없으면 명시적인 운영자 오류와 함께 실패한다

### 제어 평면 데이터 모델과 영속성

장기 source-of-truth는 트랜잭션 업데이트와 crash-safe recovery를 위한 전용 ACP SQLite 데이터베이스(WAL 모드)입니다.

- `acp_sessions`
  - `session_key` (pk), `backend`, `agent`, `mode`, `cwd`, `state`, `created_at`, `updated_at`, `last_error`
- `acp_runs`
  - `run_id` (pk), `session_key` (fk), `state`, `requester_message_id`, `idempotency_key`, `started_at`, `ended_at`, `error_code`, `error_message`
- `acp_bindings`
  - `binding_key` (pk), `thread_id`, `channel_id`, `account_id`, `session_key` (fk), `expires_at`, `bound_at`
- `acp_events`
  - `event_id` (pk), `run_id` (fk), `seq`, `kind`, `payload_json`, `created_at`
- `acp_delivery_checkpoint`
  - `run_id` (pk/fk), `last_event_seq`, `last_discord_message_id`, `updated_at`
- `acp_idempotency`
  - `scope`, `idempotency_key`, `result_json`, `created_at`, unique `(scope, idempotency_key)`

```ts
export type AcpSessionMeta = {
  backend: string;
  agent: string;
  runtimeSessionName: string;
  mode: "persistent" | "oneshot";
  cwd?: string;
  state: "idle" | "running" | "error";
  lastActivityAt: number;
  lastError?: string;
};
```

저장 규칙:

- 마이그레이션 동안 `SessionEntry.acp`는 호환성 projection으로 유지한다
- process id와 socket은 메모리에만 유지한다
- 내구성 있는 lifecycle과 run 상태는 일반 session JSON이 아니라 ACP DB에 저장한다
- 런타임 소유자가 죽으면 gateway는 ACP DB에서 재수화하고 checkpoint에서 재개한다

### 라우팅 및 전달

Inbound:

- 현재 스레드 바인딩 lookup을 첫 번째 라우팅 단계로 유지한다
- 바인딩 대상이 ACP 세션이면 `getReplyFromConfig` 대신 ACP 런타임 branch로 라우팅한다
- 명시적 `/acp steer` 명령은 `mode: "steer"`를 사용한다

Outbound:

- ACP 이벤트 스트림은 OpenClaw reply chunk로 정규화된다
- 전달 대상은 기존 바인딩 destination path를 통해 해석된다
- 해당 세션 turn에 대해 바인딩된 스레드가 활성 상태면 parent 채널 완료 메시지는 억제된다

스트리밍 정책:

- coalescing window와 함께 부분 출력을 스트리밍한다
- Discord rate limit 아래를 유지하도록 최소 간격과 최대 chunk 바이트 수를 설정 가능하게 한다
- 완료 또는 실패 시 최종 메시지는 항상 출력한다

### 상태 머신과 트랜잭션 경계

세션 상태 머신:

- `creating -> idle -> running -> idle`
- `running -> cancelling -> idle | error`
- `idle -> closed`
- `error -> idle | closed`

Run 상태 머신:

- `queued -> running -> completed`
- `running -> failed | cancelled`
- `queued -> cancelled`

필수 트랜잭션 경계:

- spawn 트랜잭션
  - ACP 세션 row 생성
  - ACP 스레드 바인딩 row 생성/업데이트
  - 초기 run row enqueue
- close 트랜잭션
  - 세션을 closed로 표시
  - 바인딩 row 삭제/만료
  - 최종 close 이벤트 기록
- cancel 트랜잭션
  - 대상 run을 idempotency key와 함께 cancelling/cancelled로 표시

이 경계들 사이에서는 부분 성공이 허용되지 않습니다.

### 세션별 actor 모델

`AcpSessionManager`는 ACP 세션 키마다 하나의 actor를 실행합니다.

- actor mailbox는 `submit`, `cancel`, `close`, `stream` side effect를 직렬화한다
- actor는 해당 세션의 runtime handle 재수화와 runtime adapter process 라이프사이클을 소유한다
- actor는 Discord 전달 전에 run 이벤트를 순서대로(`seq`) 기록한다
- actor는 outbound send가 성공한 후 delivery checkpoint를 갱신한다

이렇게 하면 turn 간 경쟁 상태를 제거하고 중복 또는 out-of-order 스레드 출력을 방지할 수 있습니다.

### Idempotency 및 delivery projection

모든 외부 ACP 동작은 idempotency key를 가져야 합니다.

- spawn idempotency key
- prompt/steer idempotency key
- cancel idempotency key
- close idempotency key

전달 규칙:

- Discord 메시지는 `acp_events`와 `acp_delivery_checkpoint`에서 파생된다
- 재시도는 이미 전달된 chunk를 다시 보내지 않고 checkpoint에서 재개한다
- 최종 reply 출력은 projection 로직에서 run마다 정확히 한 번만 수행된다

### 복구 및 self-healing

Gateway 시작 시:

- 종료 상태가 아닌 ACP 세션(`creating`, `idle`, `running`, `cancelling`, `error`)을 로드한다
- 첫 inbound 이벤트 시 지연 생성하거나, 설정된 상한 내에서는 eager하게 actor를 재생성한다
- heartbeat가 누락된 `running` run을 조정하여 `failed`로 표시하거나 adapter를 통해 복구한다

들어오는 Discord 스레드 메시지에서:

- 바인딩은 존재하지만 ACP 세션이 없으면, 명시적인 stale-binding 메시지와 함께 fail closed한다
- 운영자에게 안전한 검증 후 stale binding을 자동 해제하는 옵션을 둘 수 있다
- 오래된 ACP 바인딩을 일반 LLM 경로로 조용히 라우팅해서는 안 된다

### 라이프사이클 및 안전성

지원되는 작업:

- 현재 run 취소: `/acp cancel`
- 스레드 unbind: `/unfocus`
- ACP 세션 닫기: `/acp close`
- 유효 TTL 기준으로 idle 세션 자동 종료

TTL 정책:

- 유효 TTL은 다음의 최소값이다
  - global/session TTL
  - Discord thread binding TTL
  - ACP runtime owner TTL

안전성 제어:

- 이름 기반 ACP 에이전트 allowlist
- ACP 세션의 workspace root 제한
- env allowlist passthrough
- 계정별 및 전역 ACP 동시 세션 수 상한
- 런타임 크래시를 위한 bounded restart backoff

## Config surface

Core 키:

- `acp.enabled`
- `acp.dispatch.enabled` (독립적인 ACP 라우팅 kill switch)
- `acp.backend` (기본값 `acpx`)
- `acp.defaultAgent`
- `acp.allowedAgents[]`
- `acp.maxConcurrentSessions`
- `acp.stream.coalesceIdleMs`
- `acp.stream.maxChunkChars`
- `acp.runtime.ttlMinutes`
- `acp.controlPlane.store` (`sqlite` 기본값)
- `acp.controlPlane.storePath`
- `acp.controlPlane.recovery.eagerActors`
- `acp.controlPlane.recovery.reconcileRunningAfterMs`
- `acp.controlPlane.checkpoint.flushEveryEvents`
- `acp.controlPlane.checkpoint.flushEveryMs`
- `acp.idempotency.ttlHours`
- `channels.discord.threadBindings.spawnAcpSessions`

Plugin/백엔드 키(acpx plugin 섹션):

- 백엔드 command/path override
- 백엔드 env allowlist
- 백엔드별 agent preset
- 백엔드 startup/stop timeout
- 세션당 백엔드 최대 inflight run 수

## 구현 명세

### 제어 평면 모듈 (신규)

core에 전용 ACP 제어 평면 모듈을 추가합니다.

- `src/acp/control-plane/manager.ts`
  - ACP actor, lifecycle transition, command serialization을 소유
- `src/acp/control-plane/store.ts`
  - SQLite 스키마 관리, 트랜잭션, query helper
- `src/acp/control-plane/events.ts`
  - 타입이 있는 ACP 이벤트 정의 및 직렬화
- `src/acp/control-plane/checkpoint.ts`
  - 내구성 있는 delivery checkpoint와 replay cursor
- `src/acp/control-plane/idempotency.ts`
  - idempotency key 예약과 응답 replay
- `src/acp/control-plane/recovery.ts`
  - 부팅 시 reconciliation 및 actor 재수화 계획

호환성 브리지 모듈:

- `src/acp/runtime/session-meta.ts`
  - 일시적으로 `SessionEntry.acp` projection을 위해 유지된다
  - 마이그레이션 cutover 이후에는 source-of-truth 역할을 중단해야 한다

### 필수 불변식 (코드에서 강제해야 함)

- ACP 세션 생성과 스레드 bind는 원자적이다 (단일 트랜잭션)
- ACP 세션 actor마다 동시에 활성 run은 최대 하나다
- 이벤트 `seq`는 run마다 엄격히 증가한다
- delivery checkpoint는 마지막으로 커밋된 이벤트를 넘어 진행해서는 안 된다
- idempotency replay는 중복 명령 키에 대해 이전 성공 payload를 반환한다
- 오래되었거나 누락된 ACP metadata는 일반 non-ACP reply path로 라우팅될 수 없다

### Core touchpoint

변경할 core 파일:

- `src/auto-reply/reply/dispatch-from-config.ts`
  - ACP branch는 `AcpSessionManager.submit`과 event-projection delivery를 호출한다
  - 제어 평면 불변식을 우회하는 직접 ACP fallback을 제거한다
- `src/auto-reply/reply/inbound-context.ts` (또는 가장 가까운 정규화된 context 경계)
  - ACP 제어 평면을 위한 정규화된 라우팅 키와 idempotency seed를 노출한다
- `src/config/sessions/types.ts`
  - `SessionEntry.acp`를 projection 전용 호환성 필드로 유지한다
- `src/gateway/server-methods/sessions.ts`
  - reset/delete/archive는 ACP manager close/unbind 트랜잭션 경로를 호출해야 한다
- `src/infra/outbound/bound-delivery-router.ts`
  - ACP 바인딩 세션 turn에 대해 fail-closed destination 동작을 강제한다
- `src/discord/monitor/thread-bindings.ts`
  - 제어 평면 lookup에 연결된 ACP stale-binding 검증 helper를 추가한다
- `src/auto-reply/reply/commands-acp.ts`
  - spawn/cancel/close/steer를 ACP manager API를 통해 라우팅한다
- `src/agents/acp-spawn.ts`
  - ad-hoc metadata 쓰기를 중단하고 ACP manager spawn 트랜잭션을 호출한다
- `src/plugin-sdk/**` 및 plugin runtime bridge
  - ACP 백엔드 등록과 health 의미론을 깔끔하게 노출한다

명시적으로 교체하지 않는 core 파일:

- `src/discord/monitor/message-handler.preflight.ts`
  - 스레드 바인딩 override 동작을 표준 session-key resolver로 유지한다

### ACP 런타임 registry API

core registry 모듈을 추가합니다.

- `src/acp/runtime/registry.ts`

필수 API:

```ts
export type AcpRuntimeBackend = {
  id: string;
  runtime: AcpRuntime;
  healthy?: () => boolean;
};

export function registerAcpRuntimeBackend(backend: AcpRuntimeBackend): void;
export function unregisterAcpRuntimeBackend(id: string): void;
export function getAcpRuntimeBackend(id?: string): AcpRuntimeBackend | null;
export function requireAcpRuntimeBackend(id?: string): AcpRuntimeBackend;
```

동작:

- `requireAcpRuntimeBackend`는 사용할 수 없을 때 타입이 지정된 ACP backend missing 오류를 던진다
- plugin 서비스는 `start`에서 백엔드를 등록하고 `stop`에서 해제한다
- runtime lookup은 읽기 전용이며 프로세스 로컬이다

### acpx 런타임 plugin 계약 (구현 세부사항)

첫 번째 프로덕션 백엔드(`extensions/acpx`)에서는 OpenClaw와 acpx가 엄격한 명령 계약으로 연결됩니다.

- backend id: `acpx`
- plugin service id: `acpx-runtime`
- runtime handle 인코딩: `runtimeSessionName = acpx:v1:<base64url(json)>`
- 인코딩된 payload 필드:
  - `name` (acpx named session; OpenClaw `sessionKey` 사용)
  - `agent` (acpx agent command)
  - `cwd` (세션 workspace root)
  - `mode` (`persistent | oneshot`)

명령 매핑:

- ensure session:
  - `acpx --format json --json-strict --cwd <cwd> <agent> sessions ensure --name <name>`
- prompt turn:
  - `acpx --format json --json-strict --cwd <cwd> <agent> prompt --session <name> --file -`
- cancel:
  - `acpx --format json --json-strict --cwd <cwd> <agent> cancel --session <name>`
- close:
  - `acpx --format json --json-strict --cwd <cwd> <agent> sessions close <name>`

스트리밍:

- OpenClaw는 `acpx --format json --json-strict`의 ndjson 이벤트를 소비한다
- `text` => `text_delta/output`
- `thought` => `text_delta/thought`
- `tool_call` => `tool_call`
- `done` => `done`
- `error` => `error`

### 세션 스키마 패치

`src/config/sessions/types.ts`의 `SessionEntry`를 패치합니다.

```ts
type SessionAcpMeta = {
  backend: string;
  agent: string;
  runtimeSessionName: string;
  mode: "persistent" | "oneshot";
  cwd?: string;
  state: "idle" | "running" | "error";
  lastActivityAt: number;
  lastError?: string;
};
```

영속 필드:

- `SessionEntry.acp?: SessionAcpMeta`

마이그레이션 규칙:

- phase A: dual-write (`acp` projection + ACP SQLite source-of-truth)
- phase B: ACP SQLite를 primary로 읽고, legacy `SessionEntry.acp`는 fallback-read로 사용
- phase C: 유효한 legacy 엔트리에서 누락된 ACP row를 backfill하는 migration 명령 추가
- phase D: fallback-read를 제거하고 projection은 UX용 선택 항목으로만 유지
- legacy 필드(`cliSessionIds`, `claudeCliSessionId`)는 건드리지 않는다

### 오류 계약

안정적인 ACP 오류 코드와 사용자 대상 메시지를 추가합니다.

- `ACP_BACKEND_MISSING`
  - message: `ACP runtime backend is not configured. Install and enable the acpx runtime plugin.`
- `ACP_BACKEND_UNAVAILABLE`
  - message: `ACP runtime backend is currently unavailable. Try again in a moment.`
- `ACP_SESSION_INIT_FAILED`
  - message: `Could not initialize ACP session runtime.`
- `ACP_TURN_FAILED`
  - message: `ACP turn failed before completion.`

규칙:

- 스레드 안에서는 실행 가능한 user-safe 메시지를 반환한다
- 자세한 backend/system 오류는 runtime log에만 기록한다
- ACP 라우팅이 명시적으로 선택된 경우 일반 LLM 경로로 조용히 fallback해서는 안 된다

### 중복 전달 arbitration

ACP 바인딩 turn에 대한 단일 라우팅 규칙:

- 대상 ACP 세션과 요청자 context에 대해 활성 스레드 바인딩이 있으면, 해당 바인딩 스레드에만 전달한다
- 같은 turn에 대해 parent 채널로도 함께 보내지 않는다
- 바인딩 destination 선택이 모호하면 명시적 오류와 함께 fail closed한다 (암묵적 parent fallback 금지)
- 활성 바인딩이 없으면 일반 session destination 동작을 사용한다

### 가시성과 운영 준비

필수 메트릭:

- 백엔드 및 오류 코드별 ACP spawn 성공/실패 수
- ACP run latency percentile (queue wait, runtime turn time, delivery projection time)
- ACP actor 재시작 수 및 재시작 사유
- stale-binding 감지 수
- idempotency replay 적중률
- Discord 전달 재시도 및 rate-limit 카운터

필수 로그:

- `sessionKey`, `runId`, `backend`, `threadId`, `idempotencyKey`로 키 지정된 구조화 로그
- 세션 및 run 상태 머신에 대한 명시적인 상태 전이 로그
- redaction-safe argument와 종료 요약을 포함한 adapter command 로그

필수 diagnostics:

- `/acp sessions`는 상태, 활성 run, 마지막 오류, 바인딩 상태를 포함한다
- `/acp doctor` (또는 동등 기능)는 백엔드 등록, 저장소 상태, stale binding을 검증한다

### Config 우선순위와 유효 값

ACP 활성화 우선순위:

- 계정 override: `channels.discord.accounts.<id>.threadBindings.spawnAcpSessions`
- 채널 override: `channels.discord.threadBindings.spawnAcpSessions`
- 전역 ACP gate: `acp.enabled`
- dispatch gate: `acp.dispatch.enabled`
- 백엔드 가용성: `acp.backend`에 대해 등록된 백엔드

자동 활성화 동작:

- ACP가 설정되면 (`acp.enabled=true`, `acp.dispatch.enabled=true`, 또는
  `acp.backend=acpx`), plugin auto-enable은 denylist에 있거나 명시적으로 비활성화되지 않은 한
  `plugins.entries.acpx.enabled=true`로 표시한다

TTL 유효 값:

- `min(session ttl, discord thread binding ttl, acp runtime ttl)`

### 테스트 맵

단위 테스트:

- `src/acp/runtime/registry.test.ts` (신규)
- `src/auto-reply/reply/dispatch-from-config.acp.test.ts` (신규)
- `src/infra/outbound/bound-delivery-router.test.ts` (ACP fail-closed 케이스 확장)
- `src/config/sessions/types.test.ts` 또는 가장 가까운 session-store 테스트 (ACP metadata 영속성)

통합 테스트:

- `src/discord/monitor/reply-delivery.test.ts` (바인딩된 ACP 전달 대상 동작)
- `src/discord/monitor/message-handler.preflight*.test.ts` (바인딩된 ACP session-key 라우팅 연속성)
- 백엔드 패키지의 acpx plugin 런타임 테스트 (service register/start/stop + 이벤트 정규화)

Gateway e2e 테스트:

- `src/gateway/server.sessions.gateway-server-sessions-a.e2e.test.ts` (ACP reset/delete 라이프사이클 커버리지 확장)
- spawn, message, stream, cancel, unfocus, restart recovery를 포함한 ACP 스레드 turn roundtrip e2e

### 롤아웃 가드

독립적인 ACP dispatch kill switch를 추가합니다.

- `acp.dispatch.enabled` 기본값은 첫 릴리스에서 `false`
- 비활성화된 경우:
  - ACP spawn/focus 제어 명령은 여전히 세션을 bind할 수 있다
  - ACP dispatch 경로는 활성화되지 않는다
  - 사용자에게 ACP dispatch가 정책에 의해 비활성화되었다는 명시적 메시지를 제공한다
- canary 검증 후 후속 릴리스에서 기본값을 `true`로 바꿀 수 있다

## 명령 및 UX 계획

### 새 명령

- `/acp spawn <agent-id> [--mode persistent|oneshot] [--thread auto|here|off]`
- `/acp cancel [session]`
- `/acp steer <instruction>`
- `/acp close [session]`
- `/acp sessions`

### 기존 명령 호환성

- `/focus <sessionKey>`는 계속 ACP 대상을 지원한다
- `/unfocus`는 현재 의미론을 유지한다
- `/session idle` 및 `/session max-age`가 기존 TTL override를 대체한다

## 단계별 롤아웃

### Phase 0 ADR 및 스키마 동결

- ACP 제어 평면 소유권과 adapter 경계에 대한 ADR을 배포한다
- DB 스키마를 동결한다 (`acp_sessions`, `acp_runs`, `acp_bindings`, `acp_events`, `acp_delivery_checkpoint`, `acp_idempotency`)
- 안정적인 ACP 오류 코드, 이벤트 계약, 상태 전이 가드를 정의한다

### Phase 1 Core의 제어 평면 기반

- `AcpSessionManager` 및 세션별 actor 런타임을 구현한다
- ACP SQLite 저장소와 트랜잭션 helper를 구현한다
- idempotency 저장소와 replay helper를 구현한다
- 이벤트 append + delivery checkpoint 모듈을 구현한다
- 트랜잭션 보장을 갖춘 manager에 spawn/cancel/close API를 연결한다

### Phase 2 Core 라우팅 및 라이프사이클 통합

- dispatch 파이프라인에서 스레드 바인딩된 ACP turn을 ACP manager로 라우팅한다
- ACP 바인딩/세션 불변식이 깨지면 fail-closed 라우팅을 강제한다
- reset/delete/archive/unfocus 라이프사이클을 ACP close/unbind 트랜잭션과 통합한다
- stale-binding 감지와 선택적 auto-unbind 정책을 추가한다

### Phase 3 acpx 백엔드 adapter/plugin

- 런타임 계약(`ensureSession`, `submit`, `stream`, `cancel`, `close`)에 맞춘 `acpx` adapter를 구현한다
- 백엔드 health check와 startup/teardown 등록을 추가한다
- acpx ndjson 이벤트를 ACP 런타임 이벤트로 정규화한다
- 백엔드 timeout, process supervision, restart/backoff 정책을 강제한다

### Phase 4 Delivery projection 및 채널 UX (우선 Discord)

- checkpoint resume이 가능한 이벤트 기반 채널 projection을 구현한다 (우선 Discord)
- rate-limit 인지 flush 정책으로 streaming chunk를 coalesce한다
- run마다 정확히 한 번의 최종 완료 메시지를 보장한다
- `/acp spawn`, `/acp cancel`, `/acp steer`, `/acp close`, `/acp sessions`를 배포한다

### Phase 5 마이그레이션 및 cutover

- `SessionEntry.acp` projection과 ACP SQLite source-of-truth에 대한 dual-write를 도입한다
- legacy ACP metadata row를 위한 migration 유틸리티를 추가한다
- 읽기 경로를 ACP SQLite primary로 전환한다
- 누락된 `SessionEntry.acp`에 의존하는 legacy fallback 라우팅을 제거한다

### Phase 6 하드닝, SLO, 확장 한계

- 동시성 한계(전역/계정/세션), queue 정책, timeout budget을 강제한다
- 전체 telemetry, 대시보드, alert 임계값을 추가한다
- crash recovery와 duplicate-delivery suppression에 대해 chaos 테스트를 수행한다
- 백엔드 장애, DB 손상, stale-binding remediation을 위한 runbook을 공개한다

### 전체 구현 체크리스트

- core 제어 평면 모듈 및 테스트
- DB migration 및 rollback 계획
- dispatch와 명령 전반의 ACP manager API 통합
- plugin runtime bridge의 adapter 등록 인터페이스
- acpx adapter 구현 및 테스트
- checkpoint replay를 갖춘 스레드 지원 채널 전달 projection 로직 (우선 Discord)
- reset/delete/archive/unfocus용 라이프사이클 hook
- stale-binding 감지기 및 운영자용 diagnostics
- 모든 새 ACP 키에 대한 config validation 및 우선순위 테스트
- 운영 문서 및 troubleshooting runbook

## 테스트 계획

단위 테스트:

- ACP DB 트랜잭션 경계 (spawn/bind/enqueue 원자성, cancel, close)
- 세션 및 run에 대한 ACP 상태 머신 전이 가드
- 모든 ACP 명령에서의 idempotency 예약/replay 의미론
- 세션별 actor 직렬화 및 queue 순서
- acpx 이벤트 parser 및 chunk coalescer
- 런타임 supervisor 재시작 및 backoff 정책
- config 우선순위 및 유효 TTL 계산
- backend/session이 유효하지 않을 때의 core ACP 라우팅 branch 선택 및 fail-closed 동작

통합 테스트:

- 결정적인 streaming 및 cancel 동작을 위한 fake ACP adapter process
- 트랜잭션 영속성을 갖춘 ACP manager + dispatch 통합
- ACP 세션 키로의 스레드 바인딩 inbound 라우팅
- 스레드 바인딩 outbound 전달이 parent 채널 중복을 억제하는지
- checkpoint replay가 전달 실패 후 복구되어 마지막 이벤트부터 재개하는지
- ACP 런타임 백엔드의 plugin 서비스 등록 및 teardown

Gateway e2e 테스트:

- 스레드와 함께 ACP를 spawn하고, 여러 turn의 프롬프트를 교환한 뒤 unfocus한다
- 영속 ACP DB와 바인딩을 가진 상태에서 gateway를 재시작한 뒤 동일 세션을 계속한다
- 여러 스레드의 동시 ACP 세션이 상호 간섭 없이 동작한다
- 중복 명령 재시도(같은 idempotency key)가 중복 run이나 reply를 생성하지 않는다
- stale-binding 시나리오에서 명시적 오류와 선택적 auto-clean 동작이 제공된다

## 위험 및 완화책

- 전환 중 중복 전달
  - 완화책: 단일 destination resolver와 idempotent 이벤트 checkpoint
- 부하 시 런타임 프로세스 churn
  - 완화책: 세션별 long lived owner + 동시성 상한 + backoff
- plugin 부재 또는 오구성
  - 완화책: 명시적인 운영자 대상 오류와 fail-closed ACP 라우팅 (일반 세션 경로로 암묵적 fallback 금지)
- subagent와 ACP gate 사이의 설정 혼란
  - 완화책: 명시적인 ACP 키와 유효 정책 출처를 포함한 명령 피드백
- 제어 평면 저장소 손상 또는 migration 버그
  - 완화책: WAL 모드, backup/restore hook, migration smoke test, 읽기 전용 fallback diagnostics
- actor deadlock 또는 mailbox starvation
  - 완화책: watchdog timer, actor health probe, rejection telemetry를 갖춘 bounded mailbox depth

## 승인 체크리스트

- ACP 세션 spawn이 지원되는 채널 adapter(현재 Discord)에서 스레드를 생성하거나 bind할 수 있다
- 모든 스레드 메시지는 바인딩된 ACP 세션으로만 라우팅된다
- ACP 출력은 streaming 또는 batch로 동일한 스레드 identity에 나타난다
- 바인딩된 turn에서 parent 채널에 중복 출력이 없다
- spawn+bind+initial enqueue는 영속 저장소에서 원자적이다
- ACP 명령 재시는 idempotent하며 run 또는 출력이 중복되지 않는다
- cancel, close, unfocus, archive, reset, delete가 결정적인 cleanup을 수행한다
- 크래시 후 재시작해도 매핑이 유지되고 여러 turn에 걸친 연속성이 재개된다
- 여러 스레드에 바인딩된 동시 ACP 세션이 독립적으로 작동한다
- ACP 백엔드 누락 상태가 명확하고 실행 가능한 오류를 생성한다
- stale binding이 감지되어 명시적으로 표면화된다 (선택적 안전 auto-clean 포함)
- 제어 평면 메트릭과 diagnostics를 운영자가 사용할 수 있다
- 새로운 단위, 통합, e2e 커버리지가 통과한다

## 부록: 현재 구현을 위한 타깃 리팩터링 (상태)

이 항목들은 현재 기능 세트가 적용된 뒤 ACP 경로의 유지보수성을 높이기 위한 비차단 후속 작업입니다.

### 1) ACP dispatch 정책 평가 중앙화 (완료)

- `src/acp/policy.ts`의 공유 ACP 정책 helper로 구현됨
- dispatch, ACP 명령 라이프사이클 핸들러, ACP spawn 경로가 이제 공유 정책 로직을 소비한다

### 2) ACP 명령 핸들러를 subcommand 도메인별로 분리 (완료)

- `src/auto-reply/reply/commands-acp.ts`는 이제 얇은 router다
- subcommand 동작은 다음으로 분리된다:
  - `src/auto-reply/reply/commands-acp/lifecycle.ts`
  - `src/auto-reply/reply/commands-acp/runtime-options.ts`
  - `src/auto-reply/reply/commands-acp/diagnostics.ts`
  - 공유 helper는 `src/auto-reply/reply/commands-acp/shared.ts`

### 3) ACP 세션 manager를 책임별로 분리 (완료)

- manager는 다음으로 분리된다:
  - `src/acp/control-plane/manager.ts` (public facade + singleton)
  - `src/acp/control-plane/manager.core.ts` (manager 구현)
  - `src/acp/control-plane/manager.types.ts` (manager types/deps)
  - `src/acp/control-plane/manager.utils.ts` (정규화 + helper 함수)

### 4) 선택적 acpx 런타임 adapter 정리

- `extensions/acpx/src/runtime.ts`는 다음처럼 분리할 수 있다:
- process 실행/supervision
- ndjson 이벤트 파싱/정규화
- runtime API surface (`submit`, `cancel`, `close` 등)
- 테스트 용이성이 향상되고 백엔드 동작을 더 쉽게 감사할 수 있다
