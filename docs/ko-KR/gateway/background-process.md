---
summary: "백그라운드 exec 실행과 process 관리"
read_when:
  - 백그라운드 exec 동작을 추가하거나 수정할 때
  - 장시간 실행되는 exec 작업을 디버깅할 때
title: "Background Exec and Process Tool"
---

# Background Exec + Process Tool

OpenClaw 는 `exec` tool 로 셸 명령을 실행하고, 오래 걸리는 작업은 메모리에 유지합니다. `process` tool 은 이러한 백그라운드 세션을 관리합니다.

## exec tool

핵심 파라미터:

- `command` (필수)
- `yieldMs` (기본값 10000): 이 지연 이후 자동으로 백그라운드 전환
- `background` (bool): 즉시 백그라운드 실행
- `timeout` (초, 기본값 1800): 이 시간 후 프로세스 종료
- `elevated` (bool): elevated mode 가 활성/허용된 경우 host 에서 실행
- 실제 TTY 가 필요하다면 `pty: true` 설정
- `workdir`, `env`

동작:

- foreground 실행은 출력을 바로 반환합니다.
- background 처리되면(명시적 또는 timeout), tool 은 `status: "running"` + `sessionId` 와 짧은 tail 을 반환합니다.
- 출력은 세션이 poll 되거나 clear 될 때까지 메모리에 유지됩니다.
- `process` tool 이 허용되지 않으면 `exec` 는 동기 실행되며 `yieldMs`/`background` 를 무시합니다.
- spawn 된 exec 명령은 컨텍스트 인식 shell/profile 규칙을 위해 `OPENCLAW_SHELL=exec` 를 받습니다.

## Child process bridging

exec/process tools 밖에서 장시간 실행되는 child process 를 spawn 할 때(예: CLI 재기동 또는 gateway helper), child-process bridge helper 를 붙여 종료 신호가 전달되고 exit/error 시 listener 가 해제되도록 하세요. 이렇게 하면 systemd 에서 orphan process 를 막고 플랫폼 전반에서 shutdown 동작을 일관되게 유지할 수 있습니다.

환경 오버라이드:

- `PI_BASH_YIELD_MS`: 기본 yield (ms)
- `PI_BASH_MAX_OUTPUT_CHARS`: 메모리 내 출력 상한 (chars)
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS`: stream 별 pending stdout/stderr 상한 (chars)
- `PI_BASH_JOB_TTL_MS`: 완료된 세션의 TTL (ms, 1m–3h 범위로 제한)

Config (권장):

- `tools.exec.backgroundMs` (기본값 10000)
- `tools.exec.timeoutSec` (기본값 1800)
- `tools.exec.cleanupMs` (기본값 1800000)
- `tools.exec.notifyOnExit` (기본값 true): background 된 exec 이 종료될 때 system event 를 enqueue 하고 heartbeat 를 요청
- `tools.exec.notifyOnExitEmptySuccess` (기본값 false): true 면 출력이 없는 성공적인 background run 에 대해서도 completion event 를 enqueue

## process tool

동작:

- `list`: 실행 중 + 완료된 세션
- `poll`: 세션의 새 출력을 drain (exit status 도 보고)
- `log`: 집계된 출력 읽기 (`offset` + `limit` 지원)
- `write`: stdin 전송 (`data`, 선택적 `eof`)
- `kill`: 백그라운드 세션 종료
- `clear`: 완료된 세션을 메모리에서 제거
- `remove`: 실행 중이면 kill, 완료 상태면 clear

메모:

- 메모리에 나열/유지되는 것은 background 된 세션뿐입니다.
- 프로세스 재시작 시 세션은 사라집니다(디스크 영속성 없음).
- 세션 로그는 `process poll/log` 를 실행해 tool result 가 기록될 때만 채팅 기록에 저장됩니다.
- `process` 는 agent 별 범위입니다. 해당 agent 가 시작한 세션만 볼 수 있습니다.
- `process list` 는 빠른 훑어보기를 위해 파생 `name`(command verb + target)을 포함합니다.
- `process log` 는 줄 단위 `offset`/`limit` 를 사용합니다.
- `offset` 과 `limit` 가 모두 없으면 마지막 200줄을 반환하고 paging 힌트도 포함합니다.
- `offset` 만 있고 `limit` 가 없으면 `offset` 부터 끝까지 반환합니다(200줄 제한 없음).

## 예시

긴 작업을 실행하고 나중에 poll:

```json
{ "tool": "exec", "command": "sleep 5 && echo done", "yieldMs": 1000 }
```

```json
{ "tool": "process", "action": "poll", "sessionId": "<id>" }
```

즉시 백그라운드 시작:

```json
{ "tool": "exec", "command": "npm run build", "background": true }
```

stdin 전송:

```json
{ "tool": "process", "action": "write", "sessionId": "<id>", "data": "y\n" }
```
