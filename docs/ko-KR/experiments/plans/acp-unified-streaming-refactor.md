---
summary: "main, subagent, acp 전반에 걸친 단일 통합 런타임 스트리밍 파이프라인을 위한 최종 형태 리팩터 계획"
description: "`main`, `subagent`, `acp` 전반에 shared streaming pipeline을 도입하기 위한 목표 아키텍처, workstreams, risks를 정리한 draft plan입니다."
owner: "onutc"
status: "draft"
last_updated: "2026-02-25"
title: "통합 런타임 스트리밍 리팩터 계획"
x-i18n:
  source_path: "experiments/plans/acp-unified-streaming-refactor.md"
---

# 통합 런타임 스트리밍 리팩터 계획

## 목표

`main`, `subagent`, `acp` 전반에 하나의 공통 스트리밍 파이프라인을 제공해 모든 런타임이 동일한 coalescing, chunking, 전달 순서, 크래시 복구 동작을 갖도록 한다.

## 왜 필요한가

- 현재 behavior가 여러 runtime-specific shaping paths로 나뉘어 있다.
- 한 경로에서 formatting/coalescing bugs를 고쳐도 다른 경로에는 그대로 남을 수 있다.
- delivery consistency, duplicate suppression, recovery semantics를 추론하기가 더 어려워진다.

## 목표 아키텍처

단일 파이프라인, 런타임별 어댑터:

1. 런타임 어댑터는 canonical 이벤트만 방출한다.
2. 공용 stream assembler 가 text/tool/status 이벤트를 coalesce 하고 finalize 한다.
3. 공용 channel projector 가 채널별 chunking/formatting 을 한 번만 적용한다.
4. 공용 delivery ledger 가 idempotent send/replay 의미론을 강제한다.
5. outbound channel adapter 가 실제 전송을 수행하고 delivery checkpoint 를 기록한다.

Canonical event contract:

- `turn_started`
- `text_delta`
- `block_final`
- `tool_started`
- `tool_finished`
- `status`
- `turn_completed`
- `turn_failed`
- `turn_cancelled`

## Workstreams

### 1) Canonical streaming contract

- core에서 strict event schema + validation을 정의한다.
- 각 runtime이 호환 이벤트를 방출하는지 보장하는 adapter contract tests를 추가한다.
- malformed runtime events는 조기에 reject하고 structured diagnostics를 노출한다.

### 2) Shared stream processor

- runtime-specific coalescer/projector logic을 하나의 processor로 대체한다.
- processor가 text delta buffering, idle flush, max-chunk splitting, completion flush를 담당한다.
- drift를 막기 위해 ACP/main/subagent config resolution을 하나의 helper로 옮긴다.

### 3) Shared channel projection

- channel adapters는 단순하게 유지한다. finalized blocks만 받아 전송한다.
- Discord-specific chunking quirks는 channel projector에만 둔다.
- projection 이전의 pipeline은 channel-agnostic하게 유지한다.

### 4) Delivery ledger + replay

- per-turn/per-chunk delivery IDs를 추가한다.
- 실제 send 전후로 checkpoints를 기록한다.
- restart 시 pending chunks를 idempotent하게 replay하고 duplicates를 피한다.

### 5) Migration and cutover

- Phase 1: shadow mode (새 pipeline이 출력을 계산하지만 old path가 send하고, 결과를 비교)
- Phase 2: runtime-by-runtime cutover (`acp`, 그다음 `subagent`, 그다음 `main`, 또는 위험도에 따라 역순)
- Phase 3: legacy runtime-specific streaming code 삭제

## 비목표

- 이번 refactor에서 ACP policy/permissions model은 변경하지 않는다.
- projection compatibility fixes 외에는 channel-specific feature expansion을 하지 않는다.
- transport/backend redesign은 하지 않는다 (`acpx` plugin contract는 event parity가 필요하지 않는 한 그대로 둔다).

## Risks and mitigations

- 위험: 기존 main/subagent paths에서 behavioral regressions
  완화: shadow mode diffing + adapter contract tests + channel e2e tests
- 위험: crash recovery 중 duplicate sends
  완화: durable delivery IDs + delivery adapter의 idempotent replay
- 위험: runtime adapters가 다시 분기됨
  완화: 모든 adapters에 shared contract test suite를 필수화

## 수용 기준

- 모든 runtimes이 shared streaming contract tests를 통과한다.
- Discord ACP/main/subagent가 작은 delta에 대해서도 동등한 spacing/chunking behavior를 보인다.
- crash/restart replay는 동일한 delivery ID에 대해 duplicate chunk를 보내지 않는다.
- legacy ACP projector/coalescer path가 제거된다.
- streaming config resolution이 shared되고 runtime-independent가 된다.
