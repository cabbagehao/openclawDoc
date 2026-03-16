---
summary: "백그라운드 명령어 실행(exec) 및 프로세스 관리 도구 안내"
description: "`exec` 도구의 background 실행, in-memory session 유지, `process` 도구의 poll/log/write/kill 흐름을 설명합니다."
read_when:
  - "백그라운드 exec 동작을 추가하거나 수정할 때"
  - "장시간 실행되는 exec 작업을 디버깅할 때"
title: "백그라운드 실행 및 프로세스 도구"
x-i18n:
  source_path: "gateway/background-process.md"
---

# 백그라운드 실행 및 프로세스 도구

OpenClaw는 `exec` 도구를 통해 shell commands를 실행하며, 장시간 실행되는 tasks는 memory에 유지합니다. `process` 도구는 이 background sessions를 관리합니다.

## exec tool

Key parameters:

- `command` (필수)
- `yieldMs` (기본값 10000): 이 지연 이후 자동으로 background 전환
- `background` (bool): 즉시 background 실행
- `timeout` (seconds, 기본값 1800): 이 시간이 지나면 process 종료
- `elevated` (bool): elevated mode가 활성화되고 허용되면 host에서 실행
- 실제 TTY가 필요하면 `pty: true`
- `workdir`, `env`

Behavior:

- foreground runs는 출력을 바로 반환합니다.
- background로 전환되면(명시적 설정 또는 timeout), 도구는 `status: "running"` + `sessionId`와 짧은 tail을 반환합니다.
- 출력은 session이 poll되거나 clear될 때까지 memory에 유지됩니다.
- `process` 도구가 disallow되면 `exec`는 동기식으로만 실행되고 `yieldMs`/`background`를 무시합니다.
- spawned exec commands는 context-aware shell/profile rules를 위해 `OPENCLAW_SHELL=exec`를 받습니다.

## Child process bridging

`exec`/`process` 밖에서 장시간 실행되는 child processes(예: CLI respawns, gateway helpers)를 띄울 때는 child-process bridge helper를 연결해 termination signals를 전달하고 exit/error 시 listeners가 해제되도록 하세요. 이렇게 하면 systemd에서 orphaned processes를 막고 플랫폼 간 shutdown behavior를 일관되게 유지할 수 있습니다.

Environment overrides:

- `PI_BASH_YIELD_MS`: 기본 yield (ms)
- `PI_BASH_MAX_OUTPUT_CHARS`: in-memory output cap (chars)
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS`: stream별 pending stdout/stderr cap (chars)
- `PI_BASH_JOB_TTL_MS`: finished sessions의 TTL (1분~3시간 제한)

Config (preferred):

- `tools.exec.backgroundMs` (기본값: 10000)
- `tools.exec.timeoutSec` (기본값: 1800)
- `tools.exec.cleanupMs` (기본값: 1800000)
- `tools.exec.notifyOnExit` (기본값 `true`): backgrounded exec가 종료되면 system event를 enqueue하고 heartbeat를 요청
- `tools.exec.notifyOnExitEmptySuccess` (기본값 `false`): 출력 없는 성공 종료도 completion event로 enqueue

## process tool

Actions:

- `list`: running + finished sessions
- `poll`: 특정 session의 새 output 조회 (exit status 포함)
- `log`: aggregated output 읽기 (`offset` + `limit` 지원)
- `write`: stdin으로 데이터 전송 (`data`, optional `eof`)
- `kill`: background session 종료
- `clear`: finished session을 memory에서 제거
- `remove`: running이면 kill, 아니면 clear

Notes:

- backgrounded sessions만 list되고 memory에 유지됩니다.
- process restart 시 sessions는 사라집니다. disk persistence는 없습니다.
- session logs는 `process poll/log`를 실행해 tool result가 기록될 때만 chat history에 저장됩니다.
- `process`는 agent별 scope입니다. 현재 agent가 시작한 sessions만 볼 수 있습니다.
- `process list`에는 빠른 스캔을 위한 derived `name`이 포함됩니다.
- `process log`에서 `offset`과 `limit`를 모두 생략하면 마지막 200줄과 paging hint를 반환합니다. `offset`만 주면 거기서 끝까지 반환합니다.

## 사용 예시

장시간 작업을 실행하고 나중에 poll:

```json
{ "tool": "exec", "command": "sleep 5 && echo done", "yieldMs": 1000 }
```

```json
{ "tool": "process", "action": "poll", "sessionId": "<id>" }
```

처음부터 background 실행:

```json
{ "tool": "exec", "command": "npm run build", "background": true }
```

stdin 전달:

```json
{ "tool": "process", "action": "write", "sessionId": "<id>", "data": "y\n" }
```
