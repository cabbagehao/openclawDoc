---
summary: "CLI reference for `openclaw sessions` (list stored sessions + usage)"
description: "저장된 conversation session을 조회하고 cleanup 유지보수를 실행하는 `openclaw sessions` 사용법과 scope 옵션을 설명합니다."
read_when:
  - 저장된 session 목록과 최근 활동을 확인하고 싶을 때
title: "sessions"
x-i18n:
  source_path: "cli/sessions.md"
---

# `openclaw sessions`

저장된 conversation session 목록을 조회합니다.

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --json
```

Scope selection:

- default: configured default agent store
- `--agent <id>`: 하나의 configured agent store
- `--all-agents`: 모든 configured agent store를 집계
- `--store <path>`: 명시적 store path (`--agent`, `--all-agents`와 함께 사용 불가)

JSON example:

`openclaw sessions --all-agents --json`:

```json
{
  "path": null,
  "stores": [
    { "agentId": "main", "path": "/home/user/.openclaw/agents/main/sessions/sessions.json" },
    { "agentId": "work", "path": "/home/user/.openclaw/agents/work/sessions/sessions.json" }
  ],
  "allAgents": true,
  "count": 2,
  "activeMinutes": null,
  "sessions": [
    { "agentId": "main", "key": "agent:main:main", "model": "gpt-5" },
    { "agentId": "work", "key": "agent:work:main", "model": "claude-opus-4-5" }
  ]
}
```

## Cleanup maintenance

다음 write cycle을 기다리지 않고 바로 maintenance를 실행할 수 있습니다.

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:dm:123"
openclaw sessions cleanup --json
```

`openclaw sessions cleanup`은 config의 `session.maintenance` 설정을 사용합니다.

- Scope 참고: `openclaw sessions cleanup`은 session store와 transcript만 관리합니다. `cron/runs/<jobId>.jsonl` 같은 cron run log는 정리하지 않으며, 이는 [Cron configuration](/automation/cron-jobs#configuration)의 `cron.runLog.maxBytes`, `cron.runLog.keepLines`로 관리됩니다. 자세한 내용은 [Cron maintenance](/automation/cron-jobs#maintenance)를 참고하세요.
- `--dry-run`: 실제 write 없이 얼마나 prune/cap될지 미리 봅니다.
  - text mode에서는 `Action`, `Key`, `Age`, `Model`, `Flags` 컬럼의 per-session action table을 출력합니다.
- `--enforce`: `session.maintenance.mode`가 `warn`이어도 maintenance를 적용합니다.
- `--active-key <key>`: 특정 active key를 disk-budget eviction에서 보호합니다.
- `--agent <id>`: 하나의 configured agent store만 cleanup합니다.
- `--all-agents`: 모든 configured agent store를 cleanup합니다.
- `--store <path>`: 특정 `sessions.json` 파일에 대해 실행합니다.
- `--json`: JSON summary를 출력합니다. `--all-agents`와 함께 쓰면 store별 summary가 포함됩니다.

`openclaw sessions cleanup --all-agents --dry-run --json`:

```json
{
  "allAgents": true,
  "mode": "warn",
  "dryRun": true,
  "stores": [
    {
      "agentId": "main",
      "storePath": "/home/user/.openclaw/agents/main/sessions/sessions.json",
      "beforeCount": 120,
      "afterCount": 80,
      "pruned": 40,
      "capped": 0
    },
    {
      "agentId": "work",
      "storePath": "/home/user/.openclaw/agents/work/sessions/sessions.json",
      "beforeCount": 18,
      "afterCount": 18,
      "pruned": 0,
      "capped": 0
    }
  ]
}
```

Related:

- Session config: [Configuration reference](/gateway/configuration-reference#session)
