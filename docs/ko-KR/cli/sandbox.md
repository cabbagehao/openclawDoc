---
title: Sandbox CLI
summary: "Manage sandbox containers and inspect effective sandbox policy"
description: "Docker 기반 sandbox container를 나열하고 재생성하며 현재 적용되는 sandbox 정책을 확인하는 CLI 명령을 설명합니다."
read_when: "Sandbox container를 관리하거나 sandbox와 tool-policy 동작을 디버깅할 때"
status: active
x-i18n:
  source_path: "cli/sandbox.md"
---

# Sandbox CLI

격리된 agent 실행을 위한 Docker 기반 sandbox container를 관리합니다.

## Overview

OpenClaw는 보안을 위해 agent를 격리된 Docker container에서 실행할 수 있습니다.
`sandbox` 명령은 특히 update나 config 변경 뒤 이 container를 관리할 때 유용합니다.

## Commands

### `openclaw sandbox explain`

실제로 적용되는 **effective** sandbox mode, scope, workspace access, sandbox tool policy,
그리고 elevated gate를 fix-it config key path와 함께 확인합니다.

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

### `openclaw sandbox list`

모든 sandbox container와 그 상태 및 구성을 나열합니다.

```bash
openclaw sandbox list
openclaw sandbox list --browser  # List only browser containers
openclaw sandbox list --json     # JSON output
```

Output includes:

- container name과 status (running/stopped)
- Docker image와 config 일치 여부
- age (생성 이후 경과 시간)
- idle time (마지막 사용 이후 경과 시간)
- 연결된 session 또는 agent

### `openclaw sandbox recreate`

업데이트된 image나 config로 다시 만들 수 있도록 sandbox container를 제거합니다.

```bash
openclaw sandbox recreate --all                # Recreate all containers
openclaw sandbox recreate --session main       # Specific session
openclaw sandbox recreate --agent mybot        # Specific agent
openclaw sandbox recreate --browser            # Only browser containers
openclaw sandbox recreate --all --force        # Skip confirmation
```

Options:

- `--all`: 모든 sandbox container 재생성
- `--session <key>`: 특정 session용 container 재생성
- `--agent <id>`: 특정 agent용 container 재생성
- `--browser`: browser container만 재생성
- `--force`: 확인 prompt 건너뜀

중요: container는 agent가 다음에 사용될 때 자동으로 다시 생성됩니다.

## Use cases

### After updating Docker images

```bash
# Pull new image
docker pull openclaw-sandbox:latest
docker tag openclaw-sandbox:latest openclaw-sandbox:bookworm-slim

# Update config to use new image
# Edit config: agents.defaults.sandbox.docker.image (or agents.list[].sandbox.docker.image)

# Recreate containers
openclaw sandbox recreate --all
```

### After changing sandbox configuration

```bash
# Edit config: agents.defaults.sandbox.* (or agents.list[].sandbox.*)

# Recreate to apply new config
openclaw sandbox recreate --all
```

### After changing setupCommand

```bash
openclaw sandbox recreate --all
# or just one agent:
openclaw sandbox recreate --agent family
```

### For a specific agent only

```bash
# Update only one agent's containers
openclaw sandbox recreate --agent alfred
```

## Why is this needed?

**문제:** sandbox Docker image나 config를 바꿔도:

- 기존 container는 오래된 설정으로 계속 실행됩니다.
- container는 비활성 24시간 후에야 prune됩니다.
- 자주 쓰는 agent는 오래된 container를 사실상 무기한 유지할 수 있습니다.

**해결:** `openclaw sandbox recreate`로 오래된 container를 강제로 제거하세요.
다음 사용 시 현재 설정으로 자동 재생성됩니다.

팁: 수동 `docker rm`보다 `openclaw sandbox recreate`를 우선하세요.
Gateway의 container naming을 사용하므로 scope나 session key가 바뀌었을 때 mismatch를 줄여 줍니다.

## Configuration

sandbox 설정은 `~/.openclaw/openclaw.json`의 `agents.defaults.sandbox` 아래에 있습니다.
(agent별 override는 `agents.list[].sandbox`)

```jsonc
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "all", // off, non-main, all
        "scope": "agent", // session, agent, shared
        "docker": {
          "image": "openclaw-sandbox:bookworm-slim",
          "containerPrefix": "openclaw-sbx-",
          // ... more Docker options
        },
        "prune": {
          "idleHours": 24, // Auto-prune after 24h idle
          "maxAgeDays": 7, // Auto-prune after 7 days
        },
      },
    },
  },
}
```

## See also

- [Sandbox Documentation](/gateway/sandboxing)
- [Agent Configuration](/concepts/agent-workspace)
- [Doctor Command](/gateway/doctor) - Check sandbox setup
