---
summary: "`openclaw nodes`용 CLI 레퍼런스(list/status/approve/invoke, camera/canvas/screen)"
read_when:
  - 페어링된 노드(카메라, screen, canvas)를 관리할 때
  - 요청을 승인하거나 노드 명령을 invoke해야 할 때
title: "nodes"
---

# `openclaw nodes`

페어링된 노드(디바이스)를 관리하고 노드 기능을 invoke합니다.

관련 문서:

- 노드 개요: [Nodes](/nodes)
- 카메라: [Camera nodes](/nodes/camera)
- 이미지: [Image nodes](/nodes/images)

공통 옵션:

- `--url`, `--token`, `--timeout`, `--json`

## 공통 명령

```bash
openclaw nodes list
openclaw nodes list --connected
openclaw nodes list --last-connected 24h
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
```

`nodes list`는 pending/paired 테이블을 출력합니다. Paired 행에는 가장 최근 연결 시점 경과 시간(Last Connect)이 포함됩니다.
`--connected`를 사용하면 현재 연결된 노드만 표시합니다. `--last-connected <duration>`을 사용하면
지정한 기간 내에 연결된 노드만 필터링합니다(예: `24h`, `7d`).

## Invoke / run

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
openclaw nodes run --node <id|name|ip> <command...>
openclaw nodes run --raw "git status"
openclaw nodes run --agent main --node <id|name|ip> --raw "git status"
```

Invoke 플래그:

- `--params <json>`: JSON object 문자열(기본값 `{}`).
- `--invoke-timeout <ms>`: 노드 invoke timeout(기본값 `15000`).
- `--idempotency-key <key>`: 선택적 idempotency key.

### Exec 스타일 기본값

`nodes run`은 모델의 exec 동작(기본값 + approvals)을 반영합니다.

- `tools.exec.*`를 읽습니다(`agents.list[].tools.exec.*` override 포함).
- `system.run`을 invoke하기 전에 exec approvals(`exec.approval.request`)를 사용합니다.
- `tools.exec.node`가 설정되어 있으면 `--node`는 생략할 수 있습니다.
- `system.run`을 광고하는 노드가 필요합니다(macOS companion app 또는 headless node host).

플래그:

- `--cwd <path>`: 작업 디렉터리.
- `--env <key=val>`: env override(반복 가능). 참고: node host는 `PATH` override를 무시하며(`tools.exec.pathPrepend`도 node host에는 적용되지 않음).
- `--command-timeout <ms>`: 명령 timeout.
- `--invoke-timeout <ms>`: 노드 invoke timeout(기본값 `30000`).
- `--needs-screen-recording`: 화면 녹화 권한이 필요함을 요구합니다.
- `--raw <command>`: shell 문자열을 실행합니다(`/bin/sh -lc` 또는 `cmd.exe /c`).
  Windows node host의 allowlist 모드에서는 `cmd.exe /c` shell-wrapper 실행에 승인이 필요합니다
  (allowlist 항목만으로는 wrapper 형식이 자동 허용되지 않음).
- `--agent <id>`: agent 범위 approvals/allowlists(기본값은 설정된 agent).
- `--ask <off|on-miss|always>`, `--security <deny|allowlist|full>`: override.
