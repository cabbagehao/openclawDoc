---
summary: "자동화 작업에서 heartbeat와 cron jobs 중 어떤 방식을 선택해야 하는지 판단하는 가이드"
description: "반복 작업의 스케줄링, 백그라운드 모니터링, 정시 실행, 토큰 비용 최적화 관점에서 heartbeat와 cron jobs의 차이와 선택 기준을 설명합니다."
read_when:
  - 반복 작업을 어떤 방식으로 예약할지 결정할 때
  - 백그라운드 모니터링이나 알림 자동화를 설정할 때
  - 주기 점검 작업의 토큰 사용량을 최적화하고 싶을 때
title: "크론 vs 하트비트"
x-i18n:
  source_path: "automation/cron-vs-heartbeat.md"
---

# 크론 vs 하트비트: 각각 언제 써야 할까

heartbeat와 cron jobs는 모두 예약된 작업을 실행할 수 있게 해줍니다. 이 가이드는 사용 사례에 맞는 방식을 고르는 데 도움을 줍니다.

## 빠른 결정 가이드

| 사용 사례                             | 권장 방식           | 이유                                     |
| ------------------------------------ | ------------------- | ---------------------------------------- |
| 30분마다 inbox 확인                  | Heartbeat           | 다른 점검과 묶을 수 있고, 문맥을 인식함  |
| 매일 오전 9시에 정확히 보고서 전송   | Cron (isolated)     | 정확한 시각이 필요함                     |
| 다가오는 calendar event 모니터링     | Heartbeat           | 주기적인 상황 인지에 자연스럽게 맞음     |
| 주간 심층 분석 실행                  | Cron (isolated)     | 독립 작업이며 다른 모델을 쓸 수 있음     |
| 20분 뒤에 리마인드                   | Cron (main, `--at`) | 정확한 시각의 1회성 실행                 |
| 백그라운드 project health check      | Heartbeat           | 기존 주기에 자연스럽게 편승함            |

## Heartbeat: 주기적인 상황 인지

heartbeat는 정기 간격(기본값: 30분)으로 **main session**에서 실행됩니다. 에이전트가 상태를 점검하고 중요한 내용이 있으면 드러내도록 설계되어 있습니다.

### heartbeat를 써야 할 때

- **여러 주기 점검을 함께 처리할 때**: inbox, calendar, weather, notifications, project status를 각각 5개의 cron jobs로 돌리는 대신 heartbeat 하나로 묶을 수 있습니다.
- **문맥 인식이 중요할 때**: 에이전트가 main session 전체 문맥을 알고 있으므로 무엇이 긴급하고 무엇이 기다려도 되는지 더 똑똑하게 판단할 수 있습니다.
- **대화 연속성이 필요할 때**: heartbeat 실행은 같은 session을 공유하므로 최근 대화를 기억하고 자연스럽게 이어갈 수 있습니다.
- **오버헤드가 낮은 모니터링이 필요할 때**: heartbeat 하나가 여러 개의 작은 polling task를 대체합니다.

### heartbeat의 장점

- **여러 점검을 한 번에 처리**: 한 번의 agent turn으로 inbox, calendar, notifications를 함께 검토할 수 있습니다.
- **API 호출 감소**: heartbeat 하나가 고립된 5개의 cron jobs보다 저렴합니다.
- **문맥 인식**: 사용자가 최근 무엇을 하고 있었는지 알고 우선순위를 조정할 수 있습니다.
- **스마트 억제**: 신경 쓸 일이 없으면 에이전트가 `HEARTBEAT_OK`라고 응답하고 아무 메시지도 전달되지 않습니다.
- **자연스러운 타이밍**: 큐 부하에 따라 약간 밀릴 수 있지만 대부분의 모니터링에는 충분합니다.

### Heartbeat example: HEARTBEAT.md checklist

```md
# Heartbeat checklist

- Check email for urgent messages
- Review calendar for events in next 2 hours
- If a background task finished, summarize results
- If idle for 8+ hours, send a brief check-in
```

에이전트는 매 heartbeat 때 이 파일을 읽고 모든 항목을 한 번의 turn 안에서 처리합니다.

### heartbeat 설정하기

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // interval
        target: "last", // explicit alert delivery target (default is "none")
        activeHours: { start: "08:00", end: "22:00" }, // optional
      },
    },
  },
}
```

전체 설정은 [Heartbeat](/gateway/heartbeat)를 참고하세요.

## Cron: 정확한 스케줄링

cron jobs는 정확한 시각에 실행되며 main context에 영향을 주지 않는 isolated session에서 돌릴 수도 있습니다.
정시 반복 스케줄은 자동으로 분산되며, 각 작업에는 0~5분 범위의 결정적
job별 offset이 적용됩니다.

### cron을 써야 할 때

- **정확한 시각이 필요할 때**: "매주 월요일 오전 9:00에 보내기"처럼 "9시쯤"이 아니라 정확한 시각이 필요할 때입니다.
- **독립 작업일 때**: 대화 문맥이 필요 없는 작업입니다.
- **다른 model/thinking 설정이 필요할 때**: 더 무거운 분석에 더 강력한 모델을 쓰고 싶을 때입니다.
- **1회성 reminder가 필요할 때**: `--at`을 쓰는 "20분 뒤 알려줘" 같은 경우입니다.
- **시끄럽거나 자주 도는 작업일 때**: main session history를 어지럽힐 수 있는 작업입니다.
- **외부 트리거처럼 독립 실행되어야 할 때**: 에이전트가 다른 일을 하고 있는지와 무관하게 실행되어야 하는 작업입니다.

### cron의 장점

- **정확한 시각 제어**: timezone을 지원하는 5-field 또는 6-field(초 포함) cron expression을 사용할 수 있습니다.
- **내장 부하 분산**: 정시 반복 스케줄은 기본적으로 최대 5분까지 엇갈려 실행됩니다.
- **작업별 제어**: `--stagger <duration>`으로 분산을 덮어쓰거나 `--exact`로 정확한 시각 실행을 강제할 수 있습니다.
- **세션 격리**: `cron:<jobId>`에서 실행되어 main history를 오염시키지 않습니다.
- **모델 오버라이드**: 작업별로 더 저렴하거나 더 강력한 모델을 쓸 수 있습니다.
- **전달 제어**: isolated jobs는 기본적으로 `announce`(요약 전달)를 사용하며 필요하면 `none`을 선택할 수 있습니다.
- **즉시 전달**: announce 모드는 heartbeat를 기다리지 않고 바로 게시합니다.
- **에이전트 문맥이 없어도 실행 가능**: main session이 idle이거나 compacted되어도 실행됩니다.
- **1회성 실행 지원**: `--at`으로 미래의 정확한 시점을 지정할 수 있습니다.

### Cron example: Daily morning briefing

```bash
openclaw cron add \
  --name "Morning briefing" \
  --cron "0 7 * * *" \
  --tz "America/New_York" \
  --session isolated \
  --message "Generate today's briefing: weather, calendar, top emails, news summary." \
  --model opus \
  --announce \
  --channel whatsapp \
  --to "+15551234567"
```

이 설정은 뉴욕 시간 기준 정확히 오전 7:00에 실행되고, 품질을 위해 Opus를 사용하며, 요약을 WhatsApp으로 직접 전달합니다.

### Cron example: One-shot reminder

```bash
openclaw cron add \
  --name "Meeting reminder" \
  --at "20m" \
  --session main \
  --system-event "Reminder: standup meeting starts in 10 minutes." \
  --wake now \
  --delete-after-run
```

전체 CLI 레퍼런스는 [Cron jobs](/automation/cron-jobs)를 참고하세요.

## 결정 플로우차트

```
Does the task need to run at an EXACT time?
  YES -> Use cron
  NO  -> Continue...

Does the task need isolation from main session?
  YES -> Use cron (isolated)
  NO  -> Continue...

Can this task be batched with other periodic checks?
  YES -> Use heartbeat (add to HEARTBEAT.md)
  NO  -> Use cron

Is this a one-shot reminder?
  YES -> Use cron with --at
  NO  -> Continue...

Does it need a different model or thinking level?
  YES -> Use cron (isolated) with --model/--thinking
  NO  -> Use heartbeat
```

## 둘을 함께 쓰기

가장 효율적인 구성은 **둘 다** 사용하는 방식입니다.

1. **Heartbeat**는 inbox, calendar, notifications 같은 일상 모니터링을 30분마다 한 번의 묶음 turn으로 처리합니다.
2. **Cron**은 정시 스케줄(daily reports, weekly reviews)과 one-shot reminders를 담당합니다.

### Example: Efficient automation setup

**HEARTBEAT.md** (checked every 30 min):

```md
# Heartbeat checklist

- Scan inbox for urgent emails
- Check calendar for events in next 2h
- Review any pending tasks
- Light check-in if quiet for 8+ hours
```

**Cron jobs** (precise timing):

```bash
# Daily morning briefing at 7am
openclaw cron add --name "Morning brief" --cron "0 7 * * *" --session isolated --message "..." --announce

# Weekly project review on Mondays at 9am
openclaw cron add --name "Weekly review" --cron "0 9 * * 1" --session isolated --message "..." --model opus

# One-shot reminder
openclaw cron add --name "Call back" --at "2h" --session main --system-event "Call back the client" --wake now
```

## Lobster: approvals가 필요한 결정적 워크플로우

Lobster는 **multi-step tool pipeline**을 결정적으로 실행하고 명시적 approval을 넣을 수 있는 workflow runtime입니다.
작업이 한 번의 agent turn을 넘어서고, 사람이 중간 체크포인트에서 승인할 수 있는 재개 가능한 workflow가 필요할 때 사용합니다.

### Lobster가 맞는 경우

- **다단계 자동화**: 일회성 프롬프트가 아니라 고정된 tool call pipeline이 필요할 때입니다.
- **승인 게이트**: side effect를 바로 실행하지 말고 승인 시점까지 멈춘 뒤 다시 이어가야 할 때입니다.
- **재개 가능한 실행**: 앞 단계를 다시 실행하지 않고 일시 중단된 workflow를 계속해야 할 때입니다.

### heartbeat와 cron과의 관계

- **Heartbeat/cron**은 실행이 _언제_ 일어나는지를 결정합니다.
- **Lobster**는 실행이 시작된 뒤 _어떤 단계_를 수행할지를 정의합니다.

예약된 workflow라면 cron 또는 heartbeat가 agent turn을 트리거하고, 그 turn 안에서 Lobster를 호출하면 됩니다.
즉석 workflow라면 Lobster를 직접 호출하면 됩니다.

### 운영 메모 (코드 기준)

- Lobster는 tool mode에서 **local subprocess**(`lobster` CLI)로 실행되고 **JSON envelope**를 반환합니다.
- tool이 `needs_approval`을 반환하면 `resumeToken`과 `approve` flag를 넣어 재개합니다.
- 이 tool은 **optional plugin**이며, `tools.alsoAllow: ["lobster"]`로 추가 활성화하는 방식이 권장됩니다.
- Lobster를 쓰려면 `lobster` CLI가 `PATH`에 있어야 합니다.

전체 사용법과 예시는 [Lobster](/tools/lobster)를 참고하세요.

## Main Session vs Isolated Session

heartbeat와 cron은 둘 다 main session과 상호작용할 수 있지만 방식은 다릅니다.

|         | Heartbeat                       | Cron (main)              | Cron (isolated)            |
| ------- | ------------------------------- | ------------------------ | -------------------------- |
| Session | Main                            | Main (via system event)  | `cron:<jobId>`             |
| History | Shared                          | Shared                   | Fresh each run             |
| Context | Full                            | Full                     | None (starts clean)        |
| Model   | Main session model              | Main session model       | Can override               |
| Output  | Delivered if not `HEARTBEAT_OK` | Heartbeat prompt + event | Announce summary (default) |

### main session cron을 써야 할 때

다음이 필요하면 `--session main`과 `--system-event`를 사용합니다.

- reminder/event가 main session context에 나타나야 할 때
- 에이전트가 다음 heartbeat 때 전체 문맥을 가지고 처리해야 할 때
- 별도의 isolated run이 필요 없을 때

```bash
openclaw cron add \
  --name "Check project" \
  --every "4h" \
  --session main \
  --system-event "Time for a project health check" \
  --wake now
```

### isolated cron을 써야 할 때

다음이 필요하면 `--session isolated`를 사용합니다.

- 기존 문맥 없는 깨끗한 시작점
- 다른 model 또는 thinking 설정
- 채널로 직접 보내는 announce summary
- main session을 어지럽히지 않는 history

```bash
openclaw cron add \
  --name "Deep analysis" \
  --cron "0 6 * * 0" \
  --session isolated \
  --message "Weekly codebase analysis..." \
  --model opus \
  --thinking high \
  --announce
```

## 비용 고려사항

| Mechanism       | Cost Profile                                            |
| --------------- | ------------------------------------------------------- |
| Heartbeat       | One turn every N minutes; scales with HEARTBEAT.md size |
| Cron (main)     | Adds event to next heartbeat (no isolated turn)         |
| Cron (isolated) | Full agent turn per job; can use cheaper model          |

**팁**:

- token overhead를 줄이려면 `HEARTBEAT.md`를 작게 유지하세요.
- 비슷한 점검은 여러 cron jobs 대신 heartbeat에 묶으세요.
- 내부 처리만 원하면 heartbeat에 `target: "none"`을 사용하세요.
- 일상 작업은 더 저렴한 모델의 isolated cron으로 돌리는 것도 좋습니다.

## 관련 문서

- [Heartbeat](/gateway/heartbeat) - 전체 heartbeat 설정
- [Cron jobs](/automation/cron-jobs) - 전체 cron CLI 및 API 레퍼런스
- [System](/cli/system) - system events와 heartbeat controls
