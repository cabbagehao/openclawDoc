---
summary: "CLI reference for `openclaw sessions` (저장된 세션 목록 + usage)"
read_when:
  - 저장된 세션을 나열하고 최근 활동을 보고 싶을 때
title: "sessions"
---

# `openclaw sessions`

저장된 대화 세션을 나열합니다.

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --json
```

범위 선택:

- 기본값: 구성된 default agent store
- `--agent <id>`: 특정 configured agent store 하나
- `--all-agents`: 모든 configured agent store 집계
- `--store <path>`: 명시적 store path (`--agent` 또는 `--all-agents` 와 함께 사용 불가)

JSON 예시:

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

다음 write cycle 을 기다리지 않고 지금 유지보수를 실행합니다:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:dm:123"
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` 은 config 의 `session.maintenance` 설정을 사용합니다:

- 범위 메모: `openclaw sessions cleanup` 은 session store/transcript 만 유지보수합니다. `cron/runs/<jobId>.jsonl` 같은 cron run log 는 정리하지 않으며, 이는 [Cron configuration](/automation/cron-jobs#configuration) 의 `cron.runLog.maxBytes` 와 `cron.runLog.keepLines`, 그리고 [Cron maintenance](/automation/cron-jobs#maintenance) 에서 관리됩니다.

- `--dry-run`: 실제 쓰기 없이 얼마나 많은 항목이 prune/cap 될지 미리 봅니다.
  - 텍스트 모드에서는 dry-run 이 세션별 action table (`Action`, `Key`, `Age`, `Model`, `Flags`)을 출력해 무엇이 유지되고 제거될지 보여 줍니다.
- `--enforce`: `session.maintenance.mode` 가 `warn` 이어도 유지보수를 적용합니다.
- `--active-key <key>`: 특정 active key 를 disk-budget eviction 에서 보호합니다.
- `--agent <id>`: 하나의 configured agent store 에 대해 cleanup 수행
- `--all-agents`: 모든 configured agent store 에 대해 cleanup 수행
- `--store <path>`: 특정 `sessions.json` 파일에 대해 실행
- `--json`: JSON summary 출력. `--all-agents` 와 함께 쓰면 store 별 summary 가 포함됩니다.

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

관련:

- Session config: [Configuration reference](/gateway/configuration-reference#session)
