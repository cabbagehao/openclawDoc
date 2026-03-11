---
summary: "`openclaw cron`용 CLI 레퍼런스(백그라운드 작업 예약 및 실행)"
read_when:
  - 예약 작업과 wakeup이 필요할 때
  - cron 실행과 로그를 디버깅할 때
title: "cron"
---

# `openclaw cron`

Gateway scheduler의 cron 작업을 관리합니다.

관련:

- Cron jobs: [Cron jobs](/automation/cron-jobs)

팁: 전체 명령 표면을 보려면 `openclaw cron --help`를 실행하세요.

참고: isolated `cron add` 작업은 기본적으로 `--announce` 전송을 사용합니다. 출력을 내부에만
유지하려면 `--no-deliver`를 사용하세요. `--deliver`는 계속 `--announce`의 deprecated alias로 남아 있습니다.

참고: 1회성(`--at`) 작업은 기본적으로 성공 후 삭제됩니다. 유지하려면 `--keep-after-run`을 사용하세요.

참고: 반복 작업은 이제 연속 오류 후 exponential retry backoff(30s → 1m → 5m → 15m → 60m)를 사용하며, 다음 성공 실행 후에는 정상 스케줄로 돌아갑니다.

참고: `openclaw cron run`은 이제 수동 실행이 실행 큐에 들어가자마자 반환됩니다. 성공 응답에는 `{ ok: true, enqueued: true, runId }`가 포함됩니다. 최종 결과는 `openclaw cron runs --id <job-id>`로 추적하세요.

참고: retention/pruning은 config에서 제어합니다.

- `cron.sessionRetention`(기본값 `24h`)은 완료된 isolated run session을 정리합니다.
- `cron.runLog.maxBytes` + `cron.runLog.keepLines`는 `~/.openclaw/cron/runs/<jobId>.jsonl`를 정리합니다.

업그레이드 참고: 현재 delivery/store 형식 이전의 오래된 cron 작업이 있다면 `openclaw doctor --fix`를
실행하세요. Doctor는 이제 레거시 cron 필드(`jobId`, `schedule.cron`, top-level delivery fields,
payload `provider` delivery aliases)를 정규화하고, `cron.webhook`이 구성된 경우 단순한
`notify: true` webhook fallback 작업을 명시적 webhook delivery로 마이그레이션합니다.

## 일반적인 수정

메시지는 바꾸지 않고 전송 설정만 업데이트:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

isolated 작업의 전송 비활성화:

```bash
openclaw cron edit <job-id> --no-deliver
```

isolated 작업에 lightweight bootstrap context 활성화:

```bash
openclaw cron edit <job-id> --light-context
```

특정 채널로 announce:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

lightweight bootstrap context를 사용하는 isolated 작업 생성:

```bash
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context`는 isolated agent-turn 작업에만 적용됩니다. cron 실행에서는 lightweight 모드가 전체 workspace bootstrap 세트를 주입하는 대신 bootstrap context를 비워 둡니다.
