---
summary: "CLI reference for `openclaw cron` (schedule and run background jobs)"
description: "Gateway scheduler에서 cron job을 추가·수정·실행할 때 알아야 할 delivery, retry backoff, retention, `--light-context` 동작을 정리합니다."
read_when:
  - scheduled job과 wakeup을 설정하려고 할 때
  - cron 실행과 log를 디버깅할 때
title: "cron"
x-i18n:
  source_path: "cli/cron.md"
---

# `openclaw cron`

Gateway scheduler용 cron job을 관리합니다.

Related:

- Cron jobs: [Cron jobs](/automation/cron-jobs)

Tip: 전체 command surface는 `openclaw cron --help`로 확인하세요.

참고: isolated `cron add` job은 기본적으로 `--announce` delivery를 사용합니다. 결과를 내부에만 남기려면 `--no-deliver`를 사용하세요. `--deliver`는 deprecated alias로 유지됩니다.

참고: one-shot (`--at`) job은 기본적으로 성공 후 삭제됩니다. 유지하려면 `--keep-after-run`을 사용하세요.

참고: recurring job은 연속 오류가 발생하면 exponential retry backoff를 사용합니다. (`30s → 1m → 5m → 15m → 60m`) 다음 성공 실행이 끝나면 다시 정상 schedule로 돌아갑니다.

참고: `openclaw cron run`은 수동 실행이 queue에 들어가면 즉시 반환합니다. 성공 응답에는 `{ ok: true, enqueued: true, runId }`가 포함되며, 실제 결과는 `openclaw cron runs --id <job-id>`로 추적할 수 있습니다.

참고: retention/pruning은 config로 제어합니다.

- `cron.sessionRetention` (default `24h`)은 완료된 isolated run session을 정리
- `cron.runLog.maxBytes` + `cron.runLog.keepLines`는 `~/.openclaw/cron/runs/<jobId>.jsonl`을 정리

Upgrade note: 현재 delivery/store format 이전의 오래된 cron job이 있으면 `openclaw doctor --fix`를 실행하세요. doctor는 legacy cron field (`jobId`, `schedule.cron`, top-level delivery field, payload `provider` delivery alias)를 normalize하고, `cron.webhook`이 설정된 경우 단순 `notify: true` webhook fallback job을 명시적 webhook delivery로 migrate합니다.

## Common edits

메시지는 그대로 두고 delivery setting만 바꾸기:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

isolated job의 delivery 비활성화:

```bash
openclaw cron edit <job-id> --no-deliver
```

isolated job에 lightweight bootstrap context 활성화:

```bash
openclaw cron edit <job-id> --light-context
```

특정 channel로 announce:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

lightweight bootstrap context를 사용하는 isolated job 생성:

```bash
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context`는 isolated agent-turn job에만 적용됩니다. cron run에서 lightweight mode는 전체 workspace bootstrap set을 주입하지 않고 bootstrap context를 비워 둡니다.
