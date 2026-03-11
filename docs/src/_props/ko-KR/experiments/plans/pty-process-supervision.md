---
summary: "명시적 소유권, 통합 lifecycle, 결정적 cleanup을 갖춘 안정적인 interactive process supervision(PTY + non-PTY)용 운영 계획"
read_when:
  - exec/process lifecycle ownership과 cleanup을 다룰 때
  - PTY 및 non-PTY supervision 동작을 디버깅할 때
owner: "openclaw"
status: "in-progress"
last_updated: "2026-02-15"
title: "PTY and Process Supervision Plan"
---

# PTY and Process Supervision Plan

## 1. Problem and goal

다음 전반에 걸쳐 장시간 실행되는 명령에 대해 하나의 신뢰할 수 있는 lifecycle이 필요합니다.

* `exec` foreground run
* `exec` background run
* `process` 후속 action (`poll`, `log`, `send-keys`, `paste`, `submit`, `kill`, `remove`)
* CLI agent runner subprocess

목표는 단순히 PTY를 지원하는 것이 아닙니다. 목표는 안전하지 않은 process matching heuristic 없이, 예측 가능한 ownership, cancellation, timeout, cleanup을 제공하는 것입니다.

## 2. Scope and boundaries

* 구현은 `src/process/supervisor` 내부에 유지
* 이를 위한 새 package는 만들지 않음
* 가능하면 현재 동작 호환성 유지
* terminal replay나 tmux 스타일 session persistence로 범위를 넓히지 않음

## 3. Implemented in this branch

### Supervisor baseline already present

* supervisor module은 이미 `src/process/supervisor/*` 아래에 존재
* exec runtime과 CLI runner는 이미 supervisor spawn/wait를 경유
* registry finalization은 idempotent

### This pass completed

1. Explicit PTY command contract

* `SpawnInput`은 이제 `src/process/supervisor/types.ts`에서 discriminated union
* PTY run은 generic `argv` 재사용 대신 `ptyCommand`를 요구
* supervisor는 더 이상 `src/process/supervisor/supervisor.ts`에서 argv join으로 PTY command string을 재구성하지 않음
* exec runtime은 이제 `src/agents/bash-tools.exec-runtime.ts`에서 `ptyCommand`를 직접 전달

2. Process layer type decoupling

* supervisor type은 더 이상 agents의 `SessionStdin`을 import하지 않음
* process 전용 stdin contract는 `src/process/supervisor/types.ts`의 `ManagedRunStdin`에 위치
* adapter는 이제 process 레벨 type에만 의존:
  * `src/process/supervisor/adapters/child.ts`
  * `src/process/supervisor/adapters/pty.ts`

3. Process tool lifecycle ownership improvement

* `src/agents/bash-tools.process.ts`는 이제 supervisor를 먼저 통해 cancellation 요청
* `process kill/remove`는 supervisor lookup이 실패하면 process-tree fallback termination 사용
* `remove`는 termination 요청 직후 실행 중인 session entry를 바로 제거해 deterministic remove behavior 유지

4. Single source watchdog defaults

* 공유 기본값을 `src/agents/cli-watchdog-defaults.ts`에 추가
* `src/agents/cli-backends.ts`가 이 공유 기본값 사용
* `src/agents/cli-runner/reliability.ts`도 같은 기본값 사용

5. Dead helper cleanup

* `src/agents/bash-tools.shared.ts`에서 미사용 `killSession` helper path 제거

6. Direct supervisor path tests added

* kill과 remove가 supervisor cancellation을 경유하는지 검증하는 `src/agents/bash-tools.process.supervisor.test.ts` 추가

7. Reliability gap fixes completed

* `src/agents/bash-tools.process.ts`는 이제 supervisor lookup이 실패하면 실제 OS 수준 process termination으로 fallback
* `src/process/supervisor/adapters/child.ts`는 기본 cancel/timeout kill path에서 process-tree termination semantics 사용
* 공유 process-tree utility를 `src/process/kill-tree.ts`에 추가

8. PTY contract edge-case coverage added

* verbatim PTY command forwarding과 empty-command rejection을 검증하는 `src/process/supervisor/supervisor.pty-command.test.ts` 추가
* child adapter cancellation에서 process-tree kill behavior를 검증하는 `src/process/supervisor/adapters/child.test.ts` 추가

## 4. Remaining gaps and decisions

### Reliability status

이번 패스에서 요구된 두 가지 reliability gap은 이제 해소되었습니다.

* `process kill/remove`는 supervisor lookup이 실패해도 실제 OS termination fallback을 가짐
* child cancel/timeout은 이제 default kill path에서 process-tree kill semantics 사용
* 두 동작 모두에 대한 regression test 추가 완료

### Durability and startup reconciliation

restart 동작은 이제 in-memory lifecycle only로 명시적으로 정의됩니다.

* `reconcileOrphans()`는 의도적으로 `src/process/supervisor/supervisor.ts`에서 no-op으로 유지
* process restart 후 active run은 복구되지 않음
* 부분 persistence 위험을 피하기 위해 이번 구현 패스에서 의도적으로 이 경계를 유지함

### Maintainability follow-ups

1. `src/agents/bash-tools.exec-runtime.ts`의 `runExecProcess`는 여전히 여러 책임을 동시에 가지므로, 후속 패스에서 behavior drift 없이 helper로 분리 가능

## 5. Implementation plan

필수 reliability 및 contract 항목에 대한 이번 구현 패스는 완료되었습니다.

Completed:

* `process kill/remove` fallback real termination
* child adapter default kill path의 process-tree cancellation
* fallback kill 및 child adapter kill path에 대한 regression test
* 명시적 `ptyCommand` 기준의 PTY command edge-case test
* `reconcileOrphans()`를 no-op으로 둔 명시적 in-memory restart boundary

Optional follow-up:

* behavior drift 없이 `runExecProcess`를 더 집중된 helper로 분리

## 6. File map

### Process supervisor

* `src/process/supervisor/types.ts`: discriminated spawn input과 process 전용 stdin contract로 갱신
* `src/process/supervisor/supervisor.ts`: 명시적 `ptyCommand` 사용으로 갱신
* `src/process/supervisor/adapters/child.ts`, `src/process/supervisor/adapters/pty.ts`: agent type 의존 제거
* `src/process/supervisor/registry.ts`: idempotent finalize는 유지, 변경 없음

### Exec and process integration

* `src/agents/bash-tools.exec-runtime.ts`: PTY command를 명시적으로 전달하고 fallback path 유지
* `src/agents/bash-tools.process.ts`: supervisor를 통한 cancel과 실제 process-tree fallback termination 지원
* `src/agents/bash-tools.shared.ts`: 직접 kill helper path 제거

### CLI reliability

* `src/agents/cli-watchdog-defaults.ts`: 공유 baseline 추가
* `src/agents/cli-backends.ts`, `src/agents/cli-runner/reliability.ts`: 같은 기본값 사용

## 7. Validation run in this pass

Unit test:

* `pnpm vitest src/process/supervisor/registry.test.ts`
* `pnpm vitest src/process/supervisor/supervisor.test.ts`
* `pnpm vitest src/process/supervisor/supervisor.pty-command.test.ts`
* `pnpm vitest src/process/supervisor/adapters/child.test.ts`
* `pnpm vitest src/agents/cli-backends.test.ts`
* `pnpm vitest src/agents/bash-tools.exec.pty-cleanup.test.ts`
* `pnpm vitest src/agents/bash-tools.process.poll-timeout.test.ts`
* `pnpm vitest src/agents/bash-tools.process.supervisor.test.ts`
* `pnpm vitest src/process/exec.test.ts`

E2E 대상:

* `pnpm vitest src/agents/cli-runner.test.ts`
* `pnpm vitest run src/agents/bash-tools.exec.pty-fallback.test.ts src/agents/bash-tools.exec.background-abort.test.ts src/agents/bash-tools.process.send-keys.test.ts`

Typecheck 참고:

* 이 저장소에서는 `pnpm build`(전체 lint/docs gate는 `pnpm check`)를 사용하세요. `pnpm tsgo`를 언급한 오래된 노트는 더 이상 유효하지 않습니다.

## 8. Operational guarantees preserved

* Exec env hardening 동작은 변하지 않음
* Approval 및 allowlist flow는 변하지 않음
* Output sanitization과 output cap은 변하지 않음
* PTY adapter는 강제 kill 후에도 wait settlement와 listener disposal을 계속 보장

## 9. Definition of done

1. supervisor가 managed run의 lifecycle owner여야 한다
2. PTY spawn은 argv 재구성 없이 명시적 command contract를 사용해야 한다
3. supervisor stdin contract에서 process layer는 agent layer type에 의존하지 않아야 한다
4. watchdog defaults는 single source여야 한다
5. 대상 unit/e2e test가 녹색 상태여야 한다
6. restart durability boundary가 명시적으로 문서화되었거나 완전히 구현되어야 한다

## 10. Summary

이 브랜치는 이제 더 일관되고 안전한 supervision 구조를 갖습니다.

* 명시적 PTY contract
* 더 깔끔한 process layering
* process operation에 대한 supervisor 중심 cancellation path
* supervisor lookup miss 시 실제 fallback termination
* child-run default kill path의 process-tree cancellation
* 통합된 watchdog defaults
* 명시적인 in-memory restart boundary(이번 패스에서는 restart 간 orphan reconciliation 없음)
