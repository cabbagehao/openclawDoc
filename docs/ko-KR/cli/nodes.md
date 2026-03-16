---
summary: "페어링된 노드(카메라, 화면, 캔버스 등) 관리 및 명령어 실행을 위한 `openclaw nodes` 명령어 레퍼런스"
description: "paired node의 상태를 확인하고, 승인 요청을 처리하고, `system.run` 기반 명령을 실행하는 `openclaw nodes` CLI 작업을 정리합니다."
read_when:
  - paired node를 관리하고 상태를 확인할 때
  - 승인 요청을 처리하거나 node command를 invoke할 때
title: "nodes"
x-i18n:
  source_path: "cli/nodes.md"
---

# `openclaw nodes`

paired node(device)를 관리하고 node capability를 invoke합니다.

Related:

- Nodes overview: [Nodes](/nodes)
- Camera: [Camera nodes](/nodes/camera)
- Images: [Image nodes](/nodes/images)

Common options:

- `--url`, `--token`, `--timeout`, `--json`

## Common commands

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

`nodes list`는 pending/paired table을 출력합니다. paired row에는 가장 최근 연결 시점 경과 시간(Last Connect)이 포함됩니다.
현재 연결된 node만 보려면 `--connected`를 사용하고, `--last-connected <duration>`으로 최근 연결 시점 기준 필터링할 수 있습니다. 예: `24h`, `7d`

## Invoke / run

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
openclaw nodes run --node <id|name|ip> <command...>
openclaw nodes run --raw "git status"
openclaw nodes run --agent main --node <id|name|ip> --raw "git status"
```

Invoke flags:

- `--params <json>`: JSON object 문자열 (기본값 `{}`)
- `--invoke-timeout <ms>`: node invoke timeout (기본값 `15000`)
- `--idempotency-key <key>`: 선택적 idempotency key

### Exec-style defaults

`nodes run`은 model의 exec 동작(default + approval)을 그대로 따릅니다.

- `tools.exec.*`와 `agents.list[].tools.exec.*` override를 읽습니다.
- `system.run`을 invoke하기 전에 exec approval(`exec.approval.request`)을 사용합니다.
- `tools.exec.node`가 설정되어 있으면 `--node`를 생략할 수 있습니다.
- `system.run`을 advertise하는 node(macOS companion app 또는 headless node host)가 필요합니다.

Flags:

- `--cwd <path>`: working directory
- `--env <key=val>`: env override (repeat 가능). 참고: node host는 `PATH` override를 무시하며, `tools.exec.pathPrepend`도 node host에는 적용되지 않습니다.
- `--command-timeout <ms>`: command timeout
- `--invoke-timeout <ms>`: node invoke timeout (기본값 `30000`)
- `--needs-screen-recording`: screen recording permission 요구
- `--raw <command>`: shell 문자열 실행 (`/bin/sh -lc` 또는 `cmd.exe /c`)
  allowlist mode의 Windows node host에서는 `cmd.exe /c` shell wrapper 실행도 approval이 필요합니다. allowlist entry만으로 자동 허용되지 않습니다.
- `--agent <id>`: agent 범위 approvals/allowlists 적용 (기본값은 configured agent)
- `--ask <off|on-miss|always>`, `--security <deny|allowlist|full>`: override
