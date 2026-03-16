---
description: "채널 비종속 세션 바인딩, 라우팅, 전달 불변식의 다음 구현 범위를 정리한 계획입니다"
summary: "채널 비종속 session binding 아키텍처와 iteration 1 전달 범위"
read_when:
  - channel-agnostic session routing과 binding을 리팩터링할 때
  - 채널 간 duplicate, stale, missing session delivery를 조사할 때
owner: "onutc"
status: "in-progress"
last_updated: "2026-02-21"
title: "Session Binding Channel Agnostic Plan"
x-i18n:
  source_path: "experiments/plans/session-binding-channel-agnostic.md"
---

# Session Binding Channel Agnostic Plan

## Overview

이 문서는 장기적인 channel-agnostic session binding 모델과, 다음 구현 iteration의 구체적인 범위를 정의합니다.

Goal:

- subagent bound session routing을 핵심 기능으로 만들기
- channel별 동작은 adapter에 유지하기
- 일반적인 Discord 동작에 회귀를 만들지 않기

## Why this exists

현재 동작은 다음을 섞고 있습니다.

- completion content policy
- destination routing policy
- Discord-specific details

이 때문에 다음 edge case가 발생했습니다.

- concurrent run에서 main 및 thread delivery 중복
- binding manager 재사용 시 stale token usage
- webhook send의 activity accounting 누락

## Iteration 1 scope

이번 iteration은 의도적으로 범위를 제한합니다.

### 1. Add channel agnostic core interfaces

binding과 routing을 위한 core type 및 service interface를 추가합니다.

제안된 core type:

```ts
export type BindingTargetKind = "subagent" | "session";
export type BindingStatus = "active" | "ending" | "ended";

export type ConversationRef = {
  channel: string;
  accountId: string;
  conversationId: string;
  parentConversationId?: string;
};

export type SessionBindingRecord = {
  bindingId: string;
  targetSessionKey: string;
  targetKind: BindingTargetKind;
  conversation: ConversationRef;
  status: BindingStatus;
  boundAt: number;
  expiresAt?: number;
  metadata?: Record<string, unknown>;
};
```

Core service contract:

```ts
export interface SessionBindingService {
  bind(input: {
    targetSessionKey: string;
    targetKind: BindingTargetKind;
    conversation: ConversationRef;
    metadata?: Record<string, unknown>;
    ttlMs?: number;
  }): Promise<SessionBindingRecord>;

  listBySession(targetSessionKey: string): SessionBindingRecord[];
  resolveByConversation(ref: ConversationRef): SessionBindingRecord | null;
  touch(bindingId: string, at?: number): void;
  unbind(input: {
    bindingId?: string;
    targetSessionKey?: string;
    reason: string;
  }): Promise<SessionBindingRecord[]>;
}
```

### 2. Add one core delivery router for subagent completions

completion event를 위한 단일 destination resolution 경로를 추가합니다.

Router contract:

```ts
export interface BoundDeliveryRouter {
  resolveDestination(input: {
    eventKind: "task_completion";
    targetSessionKey: string;
    requester?: ConversationRef;
    failClosed: boolean;
  }): {
    binding: SessionBindingRecord | null;
    mode: "bound" | "fallback";
    reason: string;
  };
}
```

이번 iteration에서는:

- `task_completion`만 이 새 경로를 통해 라우팅
- 다른 event kind의 기존 경로는 그대로 유지

### 3. Keep Discord as adapter

Discord는 첫 번째 adapter 구현으로 유지합니다.

Adapter 책임:

- thread conversation 생성/재사용
- webhook 또는 channel send로 bound message 전송
- thread state 검증(archived/deleted)
- adapter metadata 매핑(webhook identity, thread id)

### 4. Fix currently known correctness issues

이번 iteration에서 필수:

- 기존 thread binding manager 재사용 시 token usage refresh
- Discord webhook send의 outbound activity 기록
- session mode completion에서 bound thread destination이 선택된 경우 implicit main channel fallback 중단

### 5. Preserve current runtime safety defaults

thread bound spawn이 비활성화된 사용자에게는 동작 변화가 없습니다.

기본값 유지:

- `channels.discord.threadBindings.spawnSubagentSessions = false`

결과:

- 일반 Discord 사용자는 현재 동작을 유지
- 새 core path는 활성화된 bound session completion routing에만 영향

## Not in iteration 1

명시적으로 보류:

- ACP binding target (`targetKind: "acp"`)
- Discord 외 새로운 channel adapter
- 모든 delivery path의 전면 대체(`spawn_ack`, 미래의 `subagent_message`)
- protocol 수준 변경
- binding persistence 전체에 대한 store migration/versioning 재설계

ACP 관련 참고:

- interface 설계는 ACP 확장 여지를 남겨 둠
- ACP 구현은 이번 iteration에서 시작하지 않음

## Routing invariants

iteration 1에서 다음 invariant는 필수입니다.

- destination selection과 content generation은 분리된 단계이다
- session mode completion이 active bound destination으로 해석되면, delivery는 반드시 그 destination으로 가야 한다
- bound destination에서 main channel로의 숨겨진 reroute는 없어야 한다
- fallback 동작은 명시적이고 관찰 가능해야 한다

## Compatibility and rollout

Compatibility target:

- thread bound spawning이 꺼진 사용자에게 회귀 없음
- 이번 iteration에서 non-Discord channel은 동작 변화 없음

Rollout:

1. 현재 feature gate 뒤에 interface와 router를 넣습니다.
2. Discord completion mode의 bound delivery를 router 경로로 보냅니다.
3. non-bound flow에는 legacy path를 유지합니다.
4. 대상 test와 canary runtime log로 검증합니다.

## Tests required in iteration 1

필수 unit 및 integration coverage:

- manager token rotation이 manager reuse 이후 최신 token을 사용
- webhook send가 channel activity timestamp를 업데이트
- 같은 requester channel 안의 두 active bound session이 main channel로 중복 전송되지 않음
- bound session mode run의 completion이 thread destination만으로 해석됨
- spawn flag가 꺼져 있으면 legacy behavior 유지

## Proposed implementation files

Core:

- `src/infra/outbound/session-binding-service.ts` (new)
- `src/infra/outbound/bound-delivery-router.ts` (new)
- `src/agents/subagent-announce.ts` (completion destination resolution integration)

Discord adapter and runtime:

- `src/discord/monitor/thread-bindings.manager.ts`
- `src/discord/monitor/reply-delivery.ts`
- `src/discord/send.outbound.ts`

Tests:

- `src/discord/monitor/provider*.test.ts`
- `src/discord/monitor/reply-delivery.test.ts`
- `src/agents/subagent-announce.format.test.ts`

## Done criteria for iteration 1

- core interface가 존재하고 completion routing에 연결되어 있음
- 위 correctness fix가 test와 함께 병합됨
- session mode bound run에서 main/thread duplicate completion delivery가 없음
- disabled bound spawn deployment에서는 behavior change 없음
- ACP는 명시적으로 defer 상태 유지
