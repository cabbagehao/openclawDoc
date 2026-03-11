---
summary: "main, subagent, acp 전반에 걸친 단일 통합 런타임 스트리밍 파이프라인을 위한 최종 형태 리팩터 계획"
owner: "onutc"
status: "draft"
last_updated: "2026-02-25"
title: "통합 런타임 스트리밍 리팩터 계획"
---

# 통합 런타임 스트리밍 리팩터 계획

## 목표

`main`, `subagent`, `acp` 전반에 하나의 공통 스트리밍 파이프라인을 제공해 모든 런타임이 동일한 coalescing, chunking, 전달 순서, 크래시 복구 동작을 갖도록 한다.

## 왜 필요한가

- 현재 동작이 여러 런타임 전용 shaping 경로로 나뉘어 있다.
- 한 경로에서 포맷팅/coalescing 버그를 고쳐도 다른 경로에는 그대로 남을 수 있다.
- 전달 일관성, 중복 억제, 복구 의미론을 추론하기가 더 어려워진다.

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

## 작업 흐름

### 1) Canonical 스트리밍 계약

- 코어에서 엄격한 이벤트 스키마 + 검증을 정의한다.
- 각 런타임이 호환 이벤트를 방출하는지 보장하는 adapter contract 테스트를 추가한다.
- 잘못된 런타임 이벤트는 조기에 거부하고 구조화된 diagnostics 를 노출한다.

### 2) 공용 stream processor

- 런타임별 coalescer/projector 로직을 하나의 processor 로 대체한다.
- processor 가 text delta buffering, idle flush, max-chunk splitting, completion flush 를 담당한다.
- 드리프트를 막기 위해 ACP/main/subagent 설정 해석을 하나의 헬퍼로 옮긴다.

### 3) 공용 channel projection

- channel adapter 는 단순하게 유지한다. finalize 된 블록만 받아 전송한다.
- Discord 전용 chunking 특이사항은 channel projector 에만 둔다.
- projection 이전의 파이프라인은 채널 비의존적으로 유지한다.

### 4) Delivery ledger + replay

- 턴별/청크별 delivery ID 를 추가한다.
- 실제 전송 전후로 checkpoint 를 기록한다.
- 재시작 시 보류 중인 청크를 idempotent 하게 재생하고 중복을 피한다.

### 5) 마이그레이션과 cutover

- Phase 1: shadow mode(새 파이프라인이 출력을 계산하지만 전송은 기존 경로가 수행하며, 결과를 비교)
- Phase 2: 런타임별 cutover(`acp`, 그다음 `subagent`, 그다음 `main`, 또는 위험도에 따라 역순)
- Phase 3: 기존 런타임별 스트리밍 코드를 삭제

## 비목표

- 이번 리팩터에서 ACP 정책/권한 모델은 변경하지 않는다.
- projection 호환성 수정 외에는 채널별 기능 확장을 하지 않는다.
- transport/backend 재설계는 하지 않는다(acpx plugin contract 는 이벤트 동등성이 필요하지 않는 한 그대로 둔다).

## 위험과 완화책

- 위험: 기존 main/subagent 경로에서 동작 회귀
  완화: shadow mode diffing + adapter contract 테스트 + channel e2e 테스트
- 위험: 크래시 복구 중 중복 전송
  완화: durable delivery ID + delivery adapter 의 idempotent replay
- 위험: 런타임 어댑터가 다시 분기됨
  완화: 모든 어댑터에 공용 contract 테스트 스위트를 필수화

## 수용 기준

- 모든 런타임이 공용 streaming contract 테스트를 통과한다.
- Discord ACP/main/subagent 가 작은 delta 에 대해서도 동등한 spacing/chunking 동작을 보인다.
- 크래시/재시작 replay 는 동일한 delivery ID 에 대해 중복 chunk 를 보내지 않는다.
- 기존 ACP projector/coalescer 경로가 제거된다.
- streaming 설정 해석이 공유되며 런타임 비의존적으로 바뀐다.
