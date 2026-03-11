---
summary: "브라우저 act:evaluate를 Playwright queue에서 CDP로 분리하는 계획. end-to-end deadline과 더 안전한 ref resolution 포함"
read_when:
  - browser `act:evaluate` timeout, abort, queue blocking 문제를 다룰 때
  - evaluate 실행을 CDP 기반으로 분리할 계획을 세울 때
owner: "openclaw"
status: "draft"
last_updated: "2026-02-10"
title: "Browser Evaluate CDP Refactor"
---

# Browser Evaluate CDP Refactor Plan

## Context

`act:evaluate`는 페이지 안에서 사용자가 제공한 JavaScript를 실행합니다. 현재는 Playwright(`page.evaluate` 또는 `locator.evaluate`)를 통해 실행됩니다. Playwright는 페이지별로 CDP command를 직렬화하므로, 멈추거나 오래 걸리는 evaluate 하나가 해당 페이지의 command queue 전체를 막아 이후 action이 모두 “멈춘 것처럼” 보이게 할 수 있습니다.

PR #13498은 실용적인 안전망(범위 제한 evaluate, abort propagation, best-effort recovery)을 추가했습니다. 이 문서는 `act:evaluate`를 Playwright에서 본질적으로 분리해, 멈춘 evaluate가 일반 Playwright operation을 끼워 막을 수 없도록 만드는 더 큰 리팩터링을 설명합니다.

## Goals

* `act:evaluate`가 같은 탭의 이후 browser action을 영구적으로 막지 않아야 한다
* caller가 budget을 신뢰할 수 있도록 timeout이 end-to-end 단일 source of truth여야 한다
* abort와 timeout이 HTTP와 in-process dispatch 전반에서 동일하게 취급되어야 한다
* Playwright 전체를 버리지 않고도 evaluate에 대한 element targeting을 지원해야 한다
* 기존 caller와 payload에 대한 backward compatibility 유지

## Non-goals

* 모든 browser action(click, type, wait 등)을 CDP 구현으로 대체하지 않는다
* PR #13498에서 도입한 기존 safety net을 제거하지 않는다(유용한 fallback으로 유지)
* 기존 `browser.evaluateEnabled` gate를 넘는 새로운 unsafe capability를 추가하지 않는다
* evaluate에 대한 process isolation(worker process/thread)을 추가하지 않는다. 이 리팩터링 이후에도 복구가 어려운 stuck state가 남으면 그건 후속 아이디어다

## Current Architecture (Why It Gets Stuck)

현재의 높은 수준 구조:

* caller가 `act:evaluate`를 browser control service로 보낸다
* route handler가 Playwright를 호출해 JavaScript를 실행한다
* Playwright는 페이지 command를 직렬화하므로 끝나지 않는 evaluate가 queue를 막는다
* queue가 막히면 이후 click/type/wait도 해당 탭에서 멈춘 것처럼 보인다

## Proposed Architecture

### 1. Deadline Propagation

단일 budget 개념을 도입하고, 모든 timeout을 여기서 파생시킵니다.

* caller가 `timeoutMs`(또는 미래의 deadline)를 설정
* outer request timeout, route handler logic, 페이지 내부 실행 budget이 모두 같은 budget을 사용하고, 필요한 serialization overhead용 작은 여유만 둠
* abort는 어디서나 `AbortSignal`로 전파되어 cancellation 동작을 일관되게 만듦

구현 방향:

* `createBudget({ timeoutMs, signal })` 같은 작은 helper를 추가해 다음을 반환
  * `signal`: 연결된 AbortSignal
  * `deadlineAtMs`: 절대 deadline
  * `remainingMs()`: child operation에 넘길 남은 budget
* 이 helper를 다음에 사용
  * `src/browser/client-fetch.ts` (HTTP + in-process dispatch)
  * `src/node-host/runner.ts` (proxy path)
  * browser action 구현(Playwright + CDP)

### 2. Separate Evaluate Engine (CDP Path)

Playwright의 페이지별 command queue를 공유하지 않는 CDP 기반 evaluate 구현을 추가합니다. 핵심 속성은 evaluate transport가 별도 WebSocket connection과 별도 target-attached CDP session을 사용한다는 점입니다.

구현 방향:

* 새 모듈(예: `src/browser/cdp-evaluate.ts`)을 추가하여:
  * 설정된 browser-level CDP endpoint에 연결
  * `Target.attachToTarget({ targetId, flatten: true })`를 사용해 `sessionId` 획득
  * 다음 중 하나 실행:
    * 페이지 단위 evaluate는 `Runtime.evaluate`
    * element evaluate는 `DOM.resolveNode` + `Runtime.callFunctionOn`
  * timeout 또는 abort 시:
    * 해당 session에 best-effort `Runtime.terminateExecution` 전송
    * WebSocket을 닫고 명확한 오류 반환

참고:

* 이것도 페이지 안에서 JavaScript를 실행하므로 termination은 부작용을 가질 수 있습니다. 다만 Playwright queue를 막지 않고, CDP session을 끊어 transport 차원에서 취소 가능하다는 것이 핵심 이점입니다.

### 3. Ref Story (Element Targeting Without A Full Rewrite)

어려운 부분은 element targeting입니다. CDP는 DOM handle 또는 `backendDOMNodeId`가 필요하지만, 현재 대부분의 browser action은 snapshot에서 나온 ref 기반 Playwright locator를 사용합니다.

권장 접근: 기존 ref는 유지하되, 선택적으로 CDP가 해석 가능한 id를 추가합니다.

#### 3.1 Extend Stored Ref Info

저장된 role ref metadata에 선택적으로 CDP id를 포함하도록 확장:

* 현재: `{ role, name, nth }`
* 제안: `{ role, name, nth, backendDOMNodeId?: number }`

이렇게 하면 기존 Playwright 기반 action은 그대로 동작하고, `backendDOMNodeId`가 있을 때 CDP evaluate도 같은 `ref` 값을 사용할 수 있습니다.

#### 3.2 Populate backendDOMNodeId At Snapshot Time

role snapshot 생성 시:

1. 지금처럼 기존 role ref map(role, name, nth) 생성
2. CDP의 AX tree(`Accessibility.getFullAXTree`)를 가져와 같은 duplicate handling rule을 사용해 `(role, name, nth) -> backendDOMNodeId` 병렬 map 계산
3. 현재 탭의 저장된 ref info에 해당 id를 병합

mapping에 실패하면 `backendDOMNodeId`는 undefined로 둡니다. 이렇게 하면 안전한 best-effort rollout이 가능합니다.

#### 3.3 Evaluate Behavior With Ref

`act:evaluate`에서:

* `ref`가 있고 `backendDOMNodeId`가 있으면 CDP element evaluate 사용
* `ref`는 있지만 `backendDOMNodeId`가 없으면 Playwright path로 fallback(안전망 유지)

선택적 escape hatch:

* 고급 caller나 디버깅용으로 request shape에 `backendDOMNodeId`를 직접 받도록 확장할 수 있으나, 기본 인터페이스는 여전히 `ref`를 유지

### 4. Keep A Last Resort Recovery Path

CDP evaluate를 도입해도 탭이나 connection이 막히는 다른 경로는 여전히 존재합니다. 따라서 다음 용도로 기존 recovery mechanism(terminate execution + disconnect Playwright)은 마지막 수단으로 유지합니다.

* legacy caller
* CDP attach가 차단된 환경
* 예상치 못한 Playwright edge case

## Implementation Plan (Single Iteration)

### Deliverables

* Playwright의 per-page command queue 밖에서 동작하는 CDP 기반 evaluate engine
* caller와 handler가 일관되게 사용하는 단일 end-to-end timeout/abort budget
* element evaluate를 위해 선택적으로 `backendDOMNodeId`를 담을 수 있는 ref metadata
* 가능하면 `act:evaluate`는 CDP engine을 우선하고, 아니면 Playwright로 fallback
* stuck evaluate가 이후 action을 막지 않는다는 것을 증명하는 test
* failure와 fallback을 가시화하는 log/metric

### Implementation Checklist

1. `timeoutMs` + upstream `AbortSignal`을 다음으로 묶는 공유 “budget” helper 추가:
   * 단일 `AbortSignal`
   * 절대 deadline
   * downstream operation용 `remainingMs()` helper
2. 모든 caller path를 이 helper로 갱신해 `timeoutMs`의 의미를 통일:
   * `src/browser/client-fetch.ts` (HTTP + in-process dispatch)
   * `src/node-host/runner.ts` (node proxy path)
   * `/act`를 호출하는 CLI wrapper (`browser evaluate`에 `--timeout-ms` 추가)
3. `src/browser/cdp-evaluate.ts` 구현:
   * browser-level CDP socket 연결
   * `Target.attachToTarget`로 `sessionId` 획득
   * page evaluate에는 `Runtime.evaluate`
   * element evaluate에는 `DOM.resolveNode` + `Runtime.callFunctionOn`
   * timeout/abort 시 best-effort `Runtime.terminateExecution` 후 socket close
4. 저장된 role ref metadata에 `backendDOMNodeId`를 선택적으로 추가:
   * 기존 `{ role, name, nth }` 동작은 Playwright action용으로 유지
   * CDP element targeting용 `backendDOMNodeId?: number` 추가
5. snapshot 생성 시 `backendDOMNodeId`를 best-effort로 채움:
   * CDP에서 AX tree(`Accessibility.getFullAXTree`) 조회
   * `(role, name, nth) -> backendDOMNodeId` 계산 후 저장된 ref map에 병합
   * mapping이 애매하거나 실패하면 id는 undefined로 둠
6. `act:evaluate` routing 갱신:
   * `ref`가 없으면 항상 CDP evaluate 사용
   * `ref`가 `backendDOMNodeId`로 해석되면 CDP element evaluate 사용
   * 그 외에는 Playwright evaluate로 fallback(여전히 bounded + recoverable)
7. 기존 “last resort” recovery path는 기본 경로가 아니라 fallback으로 유지
8. test 추가:
   * 의도적으로 멈춘 evaluate는 budget 안에서 timeout되고 이후 click/type는 성공
   * abort는 evaluate를 취소(client disconnect 또는 timeout)하고 subsequent action을 unblock
   * mapping 실패 시 Playwright로 깨끗하게 fallback
9. observability 추가:
   * evaluate duration, timeout counter
   * terminateExecution 사용 횟수
   * fallback rate(CDP -> Playwright)와 이유

### Acceptance Criteria

* 의도적으로 멈춘 `act:evaluate`는 caller budget 안에서 반환되고, 이후 tab action을 막지 않아야 한다
* `timeoutMs`는 CLI, agent tool, node proxy, in-process call 전반에서 일관되게 동작해야 한다
* `ref`를 `backendDOMNodeId`로 매핑할 수 있으면 CDP를 사용하고, 그렇지 않으면 fallback path도 여전히 bounded/recoverable 해야 한다

## Testing Plan

* Unit test:
  * role ref와 AX tree node 사이의 `(role, name, nth)` matching logic
  * budget helper 동작(headroom, remaining time 계산)
* Integration test:
  * CDP evaluate timeout이 budget 안에서 반환되고 이후 action을 막지 않음
  * abort가 evaluate를 취소하고 best-effort termination을 트리거
* Contract test:
  * `BrowserActRequest`, `BrowserActResponse`가 계속 호환되는지 확인

## Risks And Mitigations

* mapping이 불완전할 수 있음
  * 완화: best-effort mapping, Playwright evaluate fallback, debug tooling 추가
* `Runtime.terminateExecution`은 부작용이 있을 수 있음
  * 완화: timeout/abort 시에만 사용하고 오류 메시지에 동작을 문서화
* 추가 overhead
  * 완화: snapshot이 필요할 때만 AX tree 조회, target별 cache 사용, CDP session은 짧게 유지
* extension relay 제한
  * 완화: per-page socket이 없을 때 browser-level attach API 사용, 기존 Playwright path는 fallback으로 유지

## Open Questions

* 새 engine을 `playwright`, `cdp`, `auto`로 설정 가능하게 할 것인가?
* 고급 사용자용 새 `nodeRef` 형식을 노출할 것인가, 아니면 `ref`만 유지할 것인가?
* frame snapshot과 selector-scoped snapshot은 AX mapping에 어떻게 참여해야 하는가?
