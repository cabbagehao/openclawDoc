---
summary: "백그라운드 명령어 실행(exec) 및 프로세스 관리 도구 안내"
read_when:
  - 백그라운드 exec 동작을 추가하거나 수정하고자 할 때
  - 장시간 실행되는 exec 작업의 상태를 디버깅할 때
title: "백그라운드 실행 및 프로세스 도구"
x-i18n:
  source_path: "gateway/background-process.md"
---

# 백그라운드 실행 및 프로세스 도구

OpenClaw는 `exec` 도구를 통해 셸 명령어를 실행하며, 장시간 실행되는 작업은 메모리 상에 유지함. `process` 도구는 이러한 백그라운드 세션들을 관리하는 역할을 수행함.

## `exec` 도구 (exec tool)

**주요 파라미터:**

* **`command`** (필수): 실행할 명령어.
* **`yieldMs`** (기본값: 10000): 설정된 지연 시간이 지나면 자동으로 백그라운드로 전환함.
* **`background`** (불리언): 활성화 시 즉시 백그라운드에서 실행함.
* **`timeout`** (초 단위, 기본값: 1800): 지정된 시간 이후 프로세스를 강제 종료함.
* **`elevated`** (불리언): 권한 상승 모드가 활성화되어 있고 허용된 경우 호스트 시스템에서 직접 실행함.
* **`pty`**: 실제 TTY 환경이 필요한 경우 `true`로 설정함.
* **`workdir`**, **`env`**: 작업 디렉터리 및 환경 변수 설정.

**동작 특징:**

* 포그라운드(Foreground) 실행 시 출력 결과(stdout/stderr)를 즉시 반환함.
* 백그라운드로 전환될 경우(명시적 설정 또는 타임아웃 발생 시), 도구는 `status: "running"`, `sessionId` 정보와 함께 출력의 마지막 일부(Tail)를 반환함.
* 출력 데이터는 해당 세션이 조회(Poll)되거나 삭제(Clear)될 때까지 메모리에 유지됨.
* `process` 도구 사용이 금지된 경우, `exec`는 항상 동기 방식으로만 실행되며 `yieldMs`나 `background` 설정을 무시함.
* 생성된 모든 `exec` 명령어는 컨텍스트 인식을 위해 `OPENCLAW_SHELL=exec` 환경 변수를 주입받음.

## 자식 프로세스 브리징 (Child process bridging)

`exec`/`process` 도구 외부에서 장시간 실행되는 자식 프로세스(예: CLI 재시작 또는 Gateway 헬퍼 프로세스)를 생성할 때, 자식 프로세스 브리지 헬퍼를 연결하여 종료 신호를 전달하고 프로세스 종료/오류 시 리스너가 정상적으로 해제되도록 함. 이는 systemd 환경에서 고아 프로세스(Orphaned process) 발생을 방지하고 플랫폼 간 종료 동작의 일관성을 유지하기 위함임.

**환경 변수 오버라이드:**

* **`PI_BASH_YIELD_MS`**: 기본 백그라운드 전환 지연 시간(ms).
* **`PI_BASH_MAX_OUTPUT_CHARS`**: 메모리에 저장할 최대 출력 글자 수.
* **`OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS`**: 스트림별 대기 중인 출력의 최대 글자 수.
* **`PI_BASH_JOB_TTL_MS`**: 완료된 세션의 유지 시간 (1분\~3시간 사이로 제한).

**권장 설정 (Config):**

* `tools.exec.backgroundMs` (기본값: 10000)
* `tools.exec.timeoutSec` (기본값: 1800)
* `tools.exec.cleanupMs` (기본값: 1800000)
* `tools.exec.notifyOnExit` (기본값: `true`): 백그라운드 작업 종료 시 시스템 이벤트를 생성하고 하트비트를 요청함.
* `tools.exec.notifyOnExitEmptySuccess` (기본값: `false`): 활성화 시 출력이 없는 성공적인 종료에 대해서도 완료 이벤트를 생성함.

## `process` 도구 (process tool)

**지원 액션(Actions):**

* **`list`**: 현재 실행 중이거나 완료된 모든 세션 목록을 조회함.
* **`poll`**: 특정 세션의 새로운 출력을 가져옴 (종료 상태 포함).
* **`log`**: 누적된 전체 출력을 읽어옴 (`offset` 및 `limit` 지원).
* **`write`**: 표준 입력(stdin)으로 데이터를 전송함 (`data`, 선택적 `eof`).
* **`kill`**: 실행 중인 백그라운드 세션을 강제 종료함.
* **`clear`**: 완료된 세션을 메모리에서 제거함.
* **`remove`**: 실행 중이면 종료하고, 완료 상태면 메모리에서 제거함.

**참고 사항:**

* 백그라운드에서 실행된 세션만 목록에 나타나며 메모리에 유지됨.
* 프로세스 재시작 시 모든 세션 정보는 소실됨 (디스크 영속성 없음).
* 세션 로그는 `process poll` 또는 `log`를 실행하여 도구 결과로 기록되었을 때만 채팅 이력에 저장됨.
* `process` 도구의 범위는 에이전트별로 제한됨. 즉, 현재 에이전트가 시작한 세션만 제어할 수 있음.
* `process list` 결과에는 빠른 식별을 위해 명령어 기반의 `name` 필드가 포함됨.
* `process log` 조회 시 `offset`과 `limit`를 모두 생략하면 마지막 200줄과 함께 페이징 힌트를 반환함. `offset`만 지정할 경우 해당 시점부터 끝까지 모든 라인을 반환함.

## 사용 예시

장시간 작업을 실행하고 나중에 상태 조회:

```json
{ "tool": "exec", "command": "sleep 5 && echo 완료", "yieldMs": 1000 }
```

```json
{ "tool": "process", "action": "poll", "sessionId": "<id>" }
```

처음부터 백그라운드에서 실행:

```json
{ "tool": "exec", "command": "npm run build", "background": true }
```

표준 입력값 전달:

```json
{ "tool": "process", "action": "write", "sessionId": "<id>", "data": "y\n" }
```
