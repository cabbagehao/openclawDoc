---
summary: "Cron 및 heartbeat 스케줄링과 전달 문제 해결"
read_when:
  - Cron이 실행되지 않았을 때
  - Cron은 실행됐지만 메시지가 전달되지 않았을 때
  - Heartbeat가 조용하거나 건너뛰어진 것처럼 보일 때
title: "자동화 문제 해결"
x-i18n:
  source_path: "automation/troubleshooting.md"
---

# 자동화 문제 해결

이 페이지는 스케줄러 및 전달 관련 문제(`cron` + `heartbeat`)를 다룹니다.

## 명령 점검 순서

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

그다음 자동화 관련 점검을 실행합니다.

```bash
openclaw cron status
openclaw cron list
openclaw system heartbeat last
```

## Cron이 실행되지 않을 때

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw logs --follow
```

정상 출력 예시:

- `cron status`가 enabled 상태와 미래 시점의 `nextWakeAtMs`를 보고함
- 작업이 enabled 상태이고 유효한 schedule/timezone을 가짐
- `cron runs`가 `ok` 또는 명시적인 skip reason을 보여 줌

자주 보이는 패턴:

- `cron: scheduler disabled; jobs will not run automatically` → config/env에서 cron이 비활성화됨
- `cron: timer tick failed` → scheduler tick이 크래시함. 주변 stack/log 문맥을 확인
- run 출력에 `reason: not-due` → `--force` 없이 수동 실행했고 작업 실행 시점이 아직 오지 않음

## Cron은 실행됐지만 전달이 안 될 때

```bash
openclaw cron runs --id <jobId> --limit 20
openclaw cron list
openclaw channels status --probe
openclaw logs --follow
```

정상 출력 예시:

- 실행 상태가 `ok`
- isolated 작업의 경우 delivery mode/target이 설정돼 있음
- channel probe가 대상 채널이 연결됐다고 보고함

자주 보이는 패턴:

- 실행은 성공했지만 delivery mode가 `none` → 외부 메시지가 안 가는 것이 정상
- 전달 대상 누락/잘못됨(`channel`/`to`) → 내부 실행은 성공해도 outbound 전달은 건너뛸 수 있음
- 채널 auth 오류(`unauthorized`, `missing_scope`, `Forbidden`) → 채널 자격 증명/권한 때문에 전달 차단

## Heartbeat가 억제되거나 건너뛰어질 때

```bash
openclaw system heartbeat last
openclaw logs --follow
openclaw config get agents.defaults.heartbeat
openclaw channels status --probe
```

정상 출력 예시:

- Heartbeat가 0이 아닌 간격으로 활성화돼 있음
- 마지막 heartbeat 결과가 `ran`임(또는 skip reason을 이해할 수 있음)

자주 보이는 패턴:

- `heartbeat skipped`와 함께 `reason=quiet-hours` → `activeHours` 범위 밖
- `requests-in-flight` → 메인 lane이 바빠 heartbeat가 지연됨
- `empty-heartbeat-file` → `HEARTBEAT.md`에 실행할 내용이 없고 태그된 cron 이벤트도 없어 interval heartbeat가 건너뛰어짐
- `alerts-disabled` → 가시성 설정 때문에 outbound heartbeat 메시지가 억제됨

## Timezone 및 activeHours 관련 함정

```bash
openclaw config get agents.defaults.heartbeat.activeHours
openclaw config get agents.defaults.heartbeat.activeHours.timezone
openclaw config get agents.defaults.userTimezone || echo "agents.defaults.userTimezone not set"
openclaw cron list
openclaw logs --follow
```

빠른 규칙:

- `Config path not found: agents.defaults.userTimezone`는 해당 키가 설정되지 않았다는 뜻이며, heartbeat는 호스트 시간대(또는 설정된 `activeHours.timezone`)로 폴백합니다.
- `--tz` 없이 설정한 cron은 게이트웨이 호스트 시간대를 사용합니다.
- Heartbeat `activeHours`는 설정된 시간대 해석(`user`, `local`, 또는 명시적 IANA tz)을 사용합니다.
- 시간대가 없는 ISO 타임스탬프는 cron `at` 스케줄에서 UTC로 해석됩니다.

자주 보이는 패턴:

- 호스트 시간대가 바뀐 뒤 작업이 예상과 다른 실제 시각에 실행됨
- `activeHours.timezone`이 잘못돼 낮 시간에도 heartbeat가 계속 건너뛰어짐

관련 문서:

- [/automation/cron-jobs](/automation/cron-jobs)
- [/gateway/heartbeat](/gateway/heartbeat)
- [/automation/cron-vs-heartbeat](/automation/cron-vs-heartbeat)
- [/concepts/timezone](/concepts/timezone)
