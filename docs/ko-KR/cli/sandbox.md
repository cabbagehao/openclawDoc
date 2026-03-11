---
title: Sandbox CLI
summary: "sandbox container를 관리하고 실제 sandbox policy를 점검합니다"
read_when: "sandbox container를 관리하거나 sandbox/tool-policy 동작을 디버깅할 때"
status: active
---

# Sandbox CLI

격리된 agent 실행을 위한 Docker 기반 sandbox container를 관리합니다.

## Overview

OpenClaw는 보안을 위해 agent를 격리된 Docker container에서 실행할 수 있습니다. `sandbox` 명령은 특히 업데이트나 설정 변경 이후 이러한 container를 관리하는 데 사용됩니다.

## Commands

### `openclaw sandbox explain`

실제 적용되는 sandbox mode/scope/workspace access, sandbox tool policy, elevated gate를 점검합니다. fix-it용 config key path도 함께 보여줍니다.

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

### `openclaw sandbox list`

모든 sandbox container와 그 상태 및 설정을 나열합니다.

```bash
openclaw sandbox list
openclaw sandbox list --browser  # browser container만 나열
openclaw sandbox list --json     # JSON 출력
```

**출력에는 다음이 포함됩니다.**

- container 이름과 상태(running/stopped)
- Docker image와 config와의 일치 여부
- age(생성 이후 경과 시간)
- idle time(마지막 사용 이후 경과 시간)
- 연결된 session/agent

### `openclaw sandbox recreate`

업데이트된 image/config로 다시 만들 수 있도록 sandbox container를 제거합니다.

```bash
openclaw sandbox recreate --all                # 모든 container 재생성
openclaw sandbox recreate --session main       # 특정 session
openclaw sandbox recreate --agent mybot        # 특정 agent
openclaw sandbox recreate --browser            # browser container만
openclaw sandbox recreate --all --force        # 확인 프롬프트 생략
```

**옵션:**

- `--all`: 모든 sandbox container 재생성
- `--session <key>`: 특정 session용 container 재생성
- `--agent <id>`: 특정 agent용 container 재생성
- `--browser`: browser container만 재생성
- `--force`: 확인 프롬프트 생략

**중요:** container는 agent가 다음에 사용될 때 자동으로 다시 생성됩니다.

## Use Cases

### After updating Docker images

```bash
# 새 image pull
docker pull openclaw-sandbox:latest
docker tag openclaw-sandbox:latest openclaw-sandbox:bookworm-slim

# 새 image를 쓰도록 config 갱신
# config 수정: agents.defaults.sandbox.docker.image (또는 agents.list[].sandbox.docker.image)

# container 재생성
openclaw sandbox recreate --all
```

### After changing sandbox configuration

```bash
# config 수정: agents.defaults.sandbox.* (또는 agents.list[].sandbox.*)

# 새 설정 반영을 위해 재생성
openclaw sandbox recreate --all
```

### After changing setupCommand

```bash
openclaw sandbox recreate --all
# 또는 agent 하나만:
openclaw sandbox recreate --agent family
```

### For a specific agent only

```bash
# 한 agent의 container만 갱신
openclaw sandbox recreate --agent alfred
```

## Why is this needed?

**문제:** sandbox Docker image나 설정을 바꿔도:

- 기존 container는 예전 설정으로 계속 실행됩니다.
- container는 24시간 동안 유휴 상태일 때만 prune됩니다.
- 자주 쓰는 agent는 오래된 container를 사실상 무기한 유지하게 됩니다.

**해결책:** `openclaw sandbox recreate`를 사용해 오래된 container를 강제로 제거하세요. 다음에 필요할 때 현재 설정으로 자동 재생성됩니다.

팁: 수동 `docker rm`보다 `openclaw sandbox recreate`를 쓰는 편이 낫습니다. Gateway의 container naming을 따르므로 scope/session key가 바뀌었을 때 이름 불일치를 피할 수 있습니다.

## Configuration

sandbox 설정은 `~/.openclaw/openclaw.json`의 `agents.defaults.sandbox` 아래에 있습니다. agent별 override는 `agents.list[].sandbox`에 둡니다.

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
          "idleHours": 24, // 24시간 유휴 시 자동 prune
          "maxAgeDays": 7, // 7일 후 자동 prune
        },
      },
    },
  },
}
```

## See Also

- [Sandbox Documentation](/gateway/sandboxing)
- [Agent Configuration](/concepts/agent-workspace)
- [Doctor Command](/gateway/doctor) - sandbox setup 점검
