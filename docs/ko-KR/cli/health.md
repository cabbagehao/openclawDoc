---
summary: "CLI reference for `openclaw health` (gateway health endpoint via RPC)"
description: "실행 중인 Gateway의 health 정보를 빠르게 조회하는 `openclaw health` 명령과 `--verbose` 출력 차이를 안내합니다."
read_when:
  - 실행 중인 Gateway의 health를 빠르게 확인하고 싶을 때
title: "health"
x-i18n:
  source_path: "cli/health.md"
---

# `openclaw health`

실행 중인 Gateway에서 health 정보를 가져옵니다.

```bash
openclaw health
openclaw health --json
openclaw health --verbose
```

Notes:

- `--verbose`는 live probe를 실행하며, 여러 account가 설정된 경우 per-account timing을 출력합니다.
- 여러 agent가 설정된 경우 output에는 per-agent session store 정보도 포함됩니다.
