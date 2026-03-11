---
summary: "크론(Cron) 및 하트비트(Heartbeat) 예약 실행과 메시지 전달 관련 문제 해결 가이드"
read_when:
  - 예약된 크론 작업이 실행되지 않았을 때
  - 크론은 실행되었으나 메시지가 전달되지 않았을 때
  - 하트비트가 무음 상태이거나 건너뛰어진 것으로 보일 때
title: "자동화 문제 해결"
x-i18n:
  source_path: "automation/troubleshooting.md"
---

# 자동화 문제 해결 (Automation Troubleshooting)

이 페이지는 스케줄러 및 메시지 전달 시스템(`cron` + `heartbeat`)에서 발생하는 문제 해결 방법을 다룸.

## 단계별 점검 명령어

문제가 발생하면 먼저 시스템의 전반적인 상태를 확인함:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

그다음 자동화 관련 세부 상태를 점검함:

```bash
openclaw cron status
openclaw cron list
openclaw system heartbeat last
```

## 크론(Cron) 작업이 실행되지 않는 경우

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw logs --follow
```

**정상적인 출력 상태:**
- `cron status`: 'Enabled' 상태이며 미래 시점의 `nextWakeAtMs` 정보가 표시됨.
- `cron list`: 대상 작업이 활성화되어 있고 유효한 스케줄 및 시간대가 설정되어 있음.
- `cron runs`: 실행 이력에 `ok` 상태가 기록되어 있거나 명확한 건너뜀 사유(Skip reason)가 표시됨.

**주요 오류 패턴 및 의미:**
- **`cron: scheduler disabled; jobs will not run automatically`**: 설정 파일이나 환경 변수에서 크론 기능이 비활성화되어 있음.
- **`cron: timer tick failed`**: 스케줄러 엔진에서 크래시가 발생함. 로그에서 스택 트레이스(Stack trace)를 분석해야 함.
- **`reason: not-due`**: 수동 실행(`run`) 시 `--force` 플래그 없이 실행했으며, 아직 정해진 실행 시각이 되지 않음.

## 크론은 실행되었으나 메시지가 전달되지 않는 경우

```bash
openclaw cron runs --id <jobId> --limit 20
openclaw cron list
openclaw channels status --probe
openclaw logs --follow
```

**정상적인 출력 상태:**
- 실행 상태가 `ok`임.
- 격리된 작업의 경우 전달 모드(`delivery.mode`)와 대상(`to`)이 올바르게 설정되어 있음.
- 채널 프로브(`channels status --probe`) 결과 대상 채널이 정상 연결되어 있음.

**주요 오류 패턴 및 의미:**
- **실행은 성공했으나 전달 모드가 `none`**: 외부 메시지 발송이 의도적으로 차단된 상태임.
- **전달 대상(`channel`/`to`) 누락 또는 유효하지 않음**: 내부 작업은 성공하더라도 아웃바운드 발송 단계에서 건너뜀.
- **채널 인증 오류 (`unauthorized`, `missing_scope`, `Forbidden`)**: 채널 자격 증명이나 권한 문제로 인해 메시지 발송이 거부됨.

## 하트비트(Heartbeat)가 억제되거나 건너뛰어지는 경우

```bash
openclaw system heartbeat last
openclaw logs --follow
openclaw config get agents.defaults.heartbeat
openclaw channels status --probe
```

**정상적인 출력 상태:**
- 하트비트가 활성화되어 있고 주기가 0보다 크게 설정됨.
- 마지막 실행 결과가 `ran`이거나, 납득 가능한 건너뜀 사유가 명시됨.

**주요 오류 패턴 및 의미:**
- **`heartbeat skipped` (사유: `quiet-hours`)**: 설정된 활동 시간대(`activeHours`) 범위를 벗어남.
- **`requests-in-flight`**: 메인 레인이 다른 작업으로 바빠서 하트비트 실행이 다음 틱으로 연기됨.
- **`empty-heartbeat-file`**: `HEARTBEAT.md` 파일에 수행할 내용이 없고 대기 중인 예약 이벤트도 없어서 실행을 건너뜀.
- **`alerts-disabled`**: 가시성 설정에 의해 하트비트 결과의 아웃바운드 발신이 억제됨.

## 시간대(Timezone) 및 활동 시간대 설정 주의사항

```bash
openclaw config get agents.defaults.heartbeat.activeHours
openclaw config get agents.defaults.heartbeat.activeHours.timezone
openclaw config get agents.defaults.userTimezone || echo "userTimezone 미설정"
openclaw cron list
openclaw logs --follow
```

**주요 규칙:**
- **`userTimezone` 미설정 시**: 하트비트는 호스트 시스템의 시간대(또는 `activeHours.timezone` 설정값)를 기준으로 동작함.
- **크론 작업**: `--tz` 옵션 없이 생성된 작업은 Gateway 호스트의 로컬 시간대를 사용함.
- **ISO 타임스탬프**: 시간대 정보가 없는 ISO 문자열은 크론 `at` 스케줄에서 **UTC**로 해석됨.

**주요 문제 징후:**
- 호스트의 시스템 시간대를 변경한 후 작업이 엉뚱한 시각에 실행됨.
- `activeHours.timezone` 설정 오류로 인해 실제 낮 시간임에도 하트비트가 계속 건너뛰어짐.

**관련 문서:**
- [크론 작업 가이드](/automation/cron-jobs)
- [하트비트 설정 상세](/gateway/heartbeat)
- [크론 vs 하트비트 비교](/automation/cron-vs-heartbeat)
- [시간대 처리 원리](/concepts/timezone)
