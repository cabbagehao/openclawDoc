---
description: "Discord listener timeout을 없애기 위한 비동기 inbound worker 아키텍처의 현재 상태와 다음 단계를 정리합니다"
summary: "Discord 전용 inbound worker를 통해 Discord gateway listener와 장시간 실행되는 agent turn을 분리하기 위한 현재 상태와 다음 단계"
owner: "openclaw"
status: "in_progress"
last_updated: "2026-03-05"
title: "Discord Async Inbound Worker Plan"
x-i18n:
  source_path: "experiments/plans/discord-async-inbound-worker.md"
---

# Discord Async Inbound Worker Plan

## Objective

inbound Discord turn을 비동기화하여 Discord listener timeout이 사용자에게 보이는 실패 원인이 되지 않도록 합니다.

1. Gateway listener가 inbound event를 빠르게 수락하고 정규화합니다.
2. Discord run queue가 현재와 동일한 ordering boundary를 key로 하여 serialize된 job을 저장합니다.
3. Worker가 Carbon listener lifetime 밖에서 실제 agent turn을 실행합니다.
4. Run이 완료된 뒤 원래의 channel 또는 thread로 reply를 전달합니다.

이것은 agent run 자체는 계속 진행 중인데도 queued Discord run이 `channels.discord.eventQueue.listenerTimeout`에서 timeout되는 문제에 대한 장기적인 해결책입니다.

## Current status

이 계획은 부분적으로 구현되어 있습니다.

이미 완료된 항목:

- Discord listener timeout과 Discord run timeout은 이제 별도의 설정입니다.
- 수락된 inbound Discord turn은 이제 `src/discord/monitor/inbound-worker.ts`에 enqueue됩니다.
- 장시간 실행되는 turn은 이제 Carbon listener가 아니라 worker가 소유합니다.
- 기존의 route별 ordering은 queue key를 통해 유지됩니다.
- Discord worker path에 대한 timeout regression coverage가 존재합니다.

이를 평이하게 말하면:

- 운영 환경의 timeout 버그는 수정되었습니다.
- 장시간 실행되는 turn은 Discord listener budget이 만료되었다는 이유만으로 더 이상 죽지 않습니다.
- 다만 worker 아키텍처는 아직 완성되지 않았습니다.

아직 부족한 부분:

- `DiscordInboundJob`은 여전히 부분적으로만 정규화되어 있으며 live runtime reference를 계속 포함하고 있습니다.
- command semantics(`stop`, `new`, `reset`, 향후 session control)는 아직 완전히 worker-native가 아닙니다.
- worker observability와 operator status는 아직 매우 제한적입니다.
- restart durability도 아직 없습니다.

## Why this exists

현재 동작은 전체 agent turn을 listener lifetime에 묶어 두고 있습니다.

- `src/discord/monitor/listeners.ts`가 timeout과 abort boundary를 적용합니다.
- `src/discord/monitor/message-handler.ts`가 queued run을 그 boundary 안에 유지합니다.
- `src/discord/monitor/message-handler.process.ts`가 media loading, routing, dispatch, typing, draft streaming, final reply delivery를 모두 inline으로 처리합니다.

이 아키텍처에는 두 가지 나쁜 특성이 있습니다.

- 오래 걸리지만 정상적인 turn도 listener watchdog에 의해 중단될 수 있습니다.
- 다운스트림 runtime이 실제로는 reply를 생성할 수 있었더라도 사용자는 아무 응답도 보지 못할 수 있습니다.

timeout 값을 올리면 도움이 되지만, 실패 방식 자체는 바뀌지 않습니다.

## Non-goals

- 이번 단계에서 Discord 외 채널을 재설계하지 않습니다.
- 첫 구현에서 이것을 전 채널 공용 worker framework로 확장하지 않습니다.
- 아직 공유 cross-channel inbound worker abstraction을 추출하지 않습니다. 중복이 명확한 경우에만 low-level primitive를 공유합니다.
- 안전하게 반영하는 데 꼭 필요하지 않다면 첫 단계에서 durable crash recovery를 추가하지 않습니다.
- 이 계획에서 route selection, binding semantics, ACP policy는 변경하지 않습니다.

## Current constraints

현재 Discord 처리 경로는 아직 장기적인 job payload 안에 남아 있어서는 안 되는 일부 live runtime object에 의존합니다.

- Carbon `Client`
- raw Discord event shape
- in-memory guild history map
- thread binding manager callback
- live typing 및 draft stream state

우리는 이미 실행을 worker queue로 옮겼지만, 정규화 경계는 아직 완성되지 않았습니다. 현재 worker는 "같은 프로세스 안에서 일부 동일한 live object를 사용해 나중에 실행되는 run"일 뿐이며, 완전히 data-only인 job boundary는 아닙니다.

## Target architecture

### 1. Listener stage

`DiscordMessageListener`는 ingress point로 남지만, 역할은 다음으로 축소됩니다.

- preflight 및 policy check 수행
- 수락된 입력을 serialize 가능한 `DiscordInboundJob`으로 정규화
- job을 session별 또는 channel별 async queue에 enqueue
- enqueue가 성공하면 즉시 Carbon으로 반환

listener는 더 이상 end-to-end LLM turn lifetime을 소유해서는 안 됩니다.

### 2. Normalized job payload

나중에 turn을 실행하는 데 필요한 데이터만 담는 serialize 가능한 job descriptor를 도입합니다.

최소 형태:

- route identity
  - `agentId`
  - `sessionKey`
  - `accountId`
  - `channel`
- delivery identity
  - destination channel id
  - reply target message id
  - thread id if present
- sender identity
  - sender id, label, username, tag
- channel context
  - guild id
  - channel name or slug
  - thread metadata
  - resolved system prompt override
- normalized message body
  - base text
  - effective message text
  - attachment descriptor 또는 resolved media reference
- gating decisions
  - mention requirement outcome
  - command authorization outcome
  - 적용 가능한 경우 bound session 또는 agent metadata

job payload는 live Carbon object나 mutable closure를 포함해서는 안 됩니다.

현재 구현 상태:

- 부분적으로 완료됨
- `src/discord/monitor/inbound-job.ts`가 존재하며 worker handoff를 정의함
- payload에는 여전히 live Discord runtime context가 포함되어 있어 더 줄여야 함

### 3. Worker stage

다음을 책임지는 Discord 전용 worker runner를 추가합니다.

- `DiscordInboundJob`으로부터 turn context 재구성
- run에 필요한 media 및 추가 channel metadata 로드
- agent turn dispatch
- 최종 reply payload 전달
- status와 diagnostics 갱신

권장 위치:

- `src/discord/monitor/inbound-worker.ts`
- `src/discord/monitor/inbound-job.ts`

### 4. Ordering model

ordering은 주어진 route boundary에 대해 지금과 동일하게 유지되어야 합니다.

권장 key:

- `resolveDiscordRunQueueKey(...)`와 동일한 queue key logic 사용

이렇게 하면 기존 동작이 유지됩니다.

- 하나의 bound agent conversation이 자기 자신과 interleave되지 않음
- 서로 다른 Discord channel은 여전히 독립적으로 진행 가능

### 5. Timeout model

cutover 이후에는 두 종류의 timeout이 분리됩니다.

- listener timeout
  - 정규화와 enqueue만 포함
  - 짧아야 함
- run timeout
  - 선택 사항이며, worker가 소유하고, 명시적이며, 사용자에게 보임
  - Carbon listener 설정에서 실수로 상속되어서는 안 됨

이로써 "Discord gateway listener가 살아 있었는가"와 "agent run이 정상적인가" 사이의 현재 우발적 결합이 제거됩니다.

## Recommended implementation phases

### Phase 1: normalization boundary

- Status: partially implemented
- Done:
  - `buildDiscordInboundJob(...)` 추출
  - worker handoff test 추가
- Remaining:
  - `DiscordInboundJob`을 plain data만 포함하도록 변경
  - live runtime dependency를 job payload가 아니라 worker 소유 service로 이동
  - live listener ref를 job에 다시 꿰맞추는 방식의 process context 재구성을 중단

### Phase 2: in-memory worker queue

- Status: implemented
- Done:
  - resolved run queue key를 기준으로 하는 `DiscordInboundWorkerQueue` 추가
  - listener가 `processDiscordMessage(...)`를 직접 await하지 않고 job을 enqueue하도록 변경
  - worker가 in-process, in-memory 방식으로 job 실행

이것이 첫 번째 기능적 cutover입니다.

### Phase 3: process split

- Status: not started
- delivery, typing, draft streaming 소유권을 worker-facing adapter 뒤로 이동
- live preflight context의 직접 사용을 worker context reconstruction으로 대체
- 필요하다면 `processDiscordMessage(...)`를 일시적인 facade로 유지한 뒤 분리

### Phase 4: command semantics

- Status: not started
  queued 상태에서도 native Discord command가 올바르게 동작하는지 확인합니다.

- `stop`
- `new`
- `reset`
- 향후 추가될 모든 session-control command

worker queue는 command가 active run 또는 queued turn을 대상으로 지정할 수 있을 만큼 충분한 run state를 노출해야 합니다.

### Phase 5: observability and operator UX

- Status: not started
- monitor status에 queue depth와 active worker count를 노출
- enqueue time, start time, finish time, timeout 또는 cancellation reason 기록
- worker 소유 timeout 또는 delivery failure를 log에 명확히 표시

### Phase 6: optional durability follow-up

- Status: not started
  in-memory 버전이 안정화된 뒤에만 진행:

- queued Discord job이 gateway restart 후에도 살아남아야 하는지 결정
- 필요하다면 job descriptor와 delivery checkpoint를 영속화
- 필요 없다면 명시적으로 in-memory boundary를 문서화

restart recovery가 실제 반영에 필수인 경우가 아니라면, 이는 별도의 후속 작업이어야 합니다.

## File impact

현재 주요 파일:

- `src/discord/monitor/listeners.ts`
- `src/discord/monitor/message-handler.ts`
- `src/discord/monitor/message-handler.preflight.ts`
- `src/discord/monitor/message-handler.process.ts`
- `src/discord/monitor/status.ts`

현재 worker 파일:

- `src/discord/monitor/inbound-job.ts`
- `src/discord/monitor/inbound-worker.ts`
- `src/discord/monitor/inbound-job.test.ts`
- `src/discord/monitor/message-handler.queue.test.ts`

다음에 손댈 가능성이 높은 지점:

- `src/auto-reply/dispatch.ts`
- `src/discord/monitor/reply-delivery.ts`
- `src/discord/monitor/thread-bindings.ts`
- `src/discord/monitor/native-command.ts`

## Next step now

다음 단계는 worker boundary를 "부분적" 상태가 아니라 실제 경계로 만드는 것입니다.

다음을 우선 수행합니다.

1. live runtime dependency를 `DiscordInboundJob` 밖으로 이동
2. 그 dependency를 Discord worker instance 쪽에 유지
3. queued job을 순수한 Discord 전용 데이터로 축소:
   - route identity
   - delivery target
   - sender info
   - normalized message snapshot
   - gating 및 binding decision
4. worker 내부에서 그 plain data로부터 worker execution context를 재구성

실제로는 다음 항목들이:

- `client`
- `threadBindings`
- `guildHistories`
- `discordRestFetch`
- 그 외 mutable runtime-only handle

더 이상 개별 queued job 안에 있지 않고, worker 자체나 worker 소유 adapter 뒤에 있어야 한다는 의미입니다.

이 작업이 반영된 다음 후속 단계는 `stop`, `new`, `reset`에 대한 command-state 정리가 되어야 합니다.

## Testing plan

기존 timeout 재현 coverage는 다음 파일에 유지합니다.

- `src/discord/monitor/message-handler.queue.test.ts`

다음 신규 test를 추가합니다.

1. listener가 전체 turn을 await하지 않고 enqueue 후 반환하는지
2. route별 ordering이 유지되는지
3. 서로 다른 channel이 여전히 동시에 실행되는지
4. reply가 원래 message destination으로 전달되는지
5. `stop`이 active한 worker 소유 run을 취소하는지
6. worker failure가 이후 job을 막지 않으면서 가시적인 diagnostics를 생성하는지
7. ACP-bound Discord channel이 worker 실행 아래에서도 올바르게 routing되는지

## Risks and mitigations

- Risk: command semantics가 현재의 synchronous 동작과 어긋날 수 있음
  Mitigation: 나중이 아니라 같은 cutover 안에서 command-state plumbing을 함께 반영

- Risk: reply delivery에서 thread 또는 reply-to context가 유실될 수 있음
  Mitigation: `DiscordInboundJob`에서 delivery identity를 first-class로 취급

- Risk: retry 또는 queue restart 시 duplicate send가 발생할 수 있음
  Mitigation: 첫 단계는 in-memory only로 유지하거나, persistence 전에 명시적 delivery idempotency를 추가

- Risk: 마이그레이션 중 `message-handler.process.ts`가 더 이해하기 어려워질 수 있음
  Mitigation: worker cutover 이전 또는 도중에 normalization, execution, delivery helper로 분리

## Acceptance criteria

다음 조건이 충족되면 이 계획은 완료입니다.

1. Discord listener timeout이 더 이상 정상적인 장시간 turn을 중단시키지 않는다.
2. 코드에서 listener lifetime과 agent-turn lifetime이 별개의 개념이 된다.
3. 기존 session별 ordering이 유지된다.
4. ACP-bound Discord channel이 동일한 worker path를 통해 동작한다.
5. `stop`이 이전 listener-owned call stack이 아니라 worker-owned run을 대상으로 동작한다.
6. timeout 및 delivery failure가 조용한 listener drop이 아니라 명시적인 worker outcome이 된다.

## Remaining landing strategy

다음 후속 PR에서 마무리합니다.

1. `DiscordInboundJob`을 plain-data only로 만들고 live runtime ref를 worker로 이동
2. `stop`, `new`, `reset`에 대한 command-state ownership 정리
3. worker observability와 operator status 추가
4. durability가 필요한지 결정하거나, 아니라면 in-memory boundary를 명시적으로 문서화

계속 Discord 전용 범위로 유지하고 성급한 cross-channel worker abstraction을 피한다면, 이것은 여전히 범위가 제한된 후속 작업으로 유지할 수 있습니다.
