---
summary: "자동화 작업에 Heartbeat와 Cron 중 무엇을 쓸지 결정하는 가이드"
read_when:
  - 반복 작업을 어떤 방식으로 스케줄링할지 결정할 때
  - 백그라운드 모니터링이나 알림을 설정할 때
  - 주기적 점검의 토큰 사용량을 최적화할 때
title: "Cron vs Heartbeat"
x-i18n:
  source_path: "automation/cron-vs-heartbeat.md"
---

# Cron vs Heartbeat: 각각 언제 써야 하나

Heartbeat와 cron job은 모두 일정에 맞춰 작업을 실행할 수 있습니다. 이 가이드는 사용 사례에 맞는 메커니즘을 고르는 데 도움을 줍니다.

## 빠른 선택 가이드

| 사용 사례                          | 권장 방식           | 이유                                          |
| ---------------------------------- | ------------------- | --------------------------------------------- |
| 30분마다 받은편지함 점검           | Heartbeat           | 다른 점검과 묶을 수 있고 컨텍스트를 활용 가능 |
| 매일 오전 9시에 정확히 보고서 전송 | Cron (isolated)     | 정확한 시각 보장이 필요                       |
| 다가오는 일정 모니터링             | Heartbeat           | 주기적 인지 작업에 자연스럽게 맞음            |
| 주간 심층 분석 실행                | Cron (isolated)     | 독립 작업이고 다른 모델 사용 가능             |
| 20분 뒤에 알림 보내기              | Cron (main, `--at`) | 정밀한 1회성 실행                             |
| 백그라운드 프로젝트 상태 점검      | Heartbeat           | 기존 주기에 자연스럽게 편승                   |

## Heartbeat: 주기적 인지

Heartbeat는 정해진 간격(기본값: 30분)으로 **main session**에서 실행됩니다. 에이전트가 상황을 점검하고, 중요한 것이 있을 때만 표면화하도록 설계돼 있습니다.

### Heartbeat를 써야 할 때

- **여러 주기 점검이 있을 때**: 받은편지함, 일정, 날씨, 알림, 프로젝트 상태를 각각 cron job 5개로 돌리는 대신 heartbeat 하나로 묶을 수 있습니다.
- **컨텍스트 인식 판단이 필요할 때**: 에이전트가 main session 전체 문맥을 알고 있으므로, 무엇이 급한지 무엇이 기다려도 되는지 더 똑똑하게 판단할 수 있습니다.
- **대화 연속성이 중요할 때**: heartbeat 실행은 같은 session을 공유하므로 최근 대화를 기억하고 자연스럽게 후속 반응을 이어갈 수 있습니다.
- **가벼운 모니터링이 필요할 때**: heartbeat 하나가 여러 개의 작은 polling 작업을 대체합니다.

### Heartbeat의 장점

- **여러 점검을 한 번에 묶음**: 하나의 agent turn에서 받은편지함, 일정, 알림을 함께 검토할 수 있습니다.
- **API 호출 감소**: heartbeat 하나가 isolated cron job 5개보다 비용이 적습니다.
- **컨텍스트 인식**: 사용자가 최근 무엇을 하고 있었는지 알고 우선순위를 조절할 수 있습니다.
- **똑똑한 억제**: 주목할 것이 없으면 에이전트는 `HEARTBEAT_OK`를 반환하고 메시지는 전달되지 않습니다.
- **자연스러운 타이밍**: 큐 부하에 따라 약간씩 밀릴 수 있지만 대부분의 모니터링에는 문제가 되지 않습니다.

### Heartbeat 예시: HEARTBEAT.md 체크리스트

```md
# Heartbeat checklist

- Check email for urgent messages
- Review calendar for events in next 2 hours
- If a background task finished, summarize results
- If idle for 8+ hours, send a brief check-in
```

에이전트는 각 heartbeat마다 이 내용을 읽고 한 번의 turn에서 모두 처리합니다.

### Heartbeat 설정

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

## Cron: 정밀한 스케줄링

Cron job은 정확한 시각에 실행되며, main context를 오염시키지 않고 isolated session에서 실행할 수도 있습니다. 매 정시 반복되는 스케줄은 기본적으로 작업별 결정적 offset을 적용해 0-5분 창으로 분산됩니다.

### Cron을 써야 할 때

- **정확한 시각이 필요할 때**: "매주 월요일 오전 9시 정각에 보내기"처럼 "대략 9시쯤"이 아니라 정확한 시각이 필요함
- **독립적인 작업일 때**: 대화 문맥이 필요 없는 작업
- **다른 모델/thinking이 필요할 때**: 더 강한 모델을 쓰고 싶은 무거운 분석 작업
- **1회성 알림일 때**: `--at`로 "20분 뒤에 알려 줘"
- **시끄럽거나 잦은 작업일 때**: main session 이력을 어지럽히고 싶지 않은 작업
- **외부 트리거형 작업일 때**: 에이전트가 다른 일을 하지 않아도 독립적으로 실행돼야 하는 작업

### Cron의 장점

- **정확한 시각**: timezone을 지원하는 5필드 또는 6필드(초 포함) cron 표현식
- **기본 부하 분산**: 매 정시 반복 스케줄은 기본적으로 최대 5분까지 분산
- **작업별 제어**: `--stagger <duration>`으로 분산 override, `--exact`로 정확한 시각 강제
- **session 격리**: main history를 오염시키지 않고 `cron:<jobId>`에서 실행
- **모델 override**: 작업별로 더 저렴하거나 더 강한 모델 선택 가능
- **전달 제어**: isolated 작업은 기본값이 `announce`(요약), 필요하면 `none` 선택
- **즉시 전달**: announce 모드는 heartbeat를 기다리지 않고 바로 게시
- **agent 문맥 불필요**: main session이 idle이거나 compacted 상태여도 실행 가능
- **1회성 실행 지원**: 정밀한 미래 시각용 `--at`

### Cron 예시: 매일 아침 브리핑

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

이 작업은 뉴욕 시간 오전 7시에 정확히 실행되고, 품질을 위해 Opus를 사용하며, 요약을 WhatsApp으로 직접 전송합니다.

### Cron 예시: 1회성 알림

```bash
openclaw cron add \
  --name "Meeting reminder" \
  --at "20m" \
  --session main \
  --system-event "Reminder: standup meeting starts in 10 minutes." \
  --wake now \
  --delete-after-run
```

전체 CLI 참조는 [Cron jobs](/automation/cron-jobs)를 참고하세요.

## 결정 흐름도

```text
작업이 정확한 시각에 실행되어야 하나?
  YES -> cron 사용
  NO  -> 계속...

main session과 격리되어야 하나?
  YES -> cron (isolated) 사용
  NO  -> 계속...

다른 주기 점검과 묶을 수 있나?
  YES -> heartbeat 사용(HEARTBEAT.md에 추가)
  NO  -> cron 사용

1회성 알림인가?
  YES -> --at과 함께 cron 사용
  NO  -> 계속...

다른 모델이나 thinking level이 필요한가?
  YES -> --model/--thinking과 함께 cron (isolated) 사용
  NO  -> heartbeat 사용
```

## 둘을 함께 쓰기

가장 효율적인 구성은 **둘 다 함께** 쓰는 것입니다.

1. **Heartbeat**는 30분마다 받은편지함, 일정, 알림 같은 루틴 점검을 한 번에 처리합니다.
2. **Cron**은 정밀한 스케줄(일일 보고서, 주간 리뷰)과 1회성 알림을 담당합니다.

### 예시: 효율적인 자동화 구성

**HEARTBEAT.md** (30분마다 점검):

```md
# Heartbeat checklist

- Scan inbox for urgent emails
- Check calendar for events in next 2h
- Review any pending tasks
- Light check-in if quiet for 8+ hours
```

**Cron jobs** (정밀한 시각):

```bash
# Daily morning briefing at 7am
openclaw cron add --name "Morning brief" --cron "0 7 * * *" --session isolated --message "..." --announce

# Weekly project review on Mondays at 9am
openclaw cron add --name "Weekly review" --cron "0 9 * * 1" --session isolated --message "..." --model opus

# One-shot reminder
openclaw cron add --name "Call back" --at "2h" --session main --system-event "Call back the client" --wake now
```

## Lobster: 승인이 있는 결정적 워크플로우

Lobster는 **여러 단계의 도구 파이프라인**을 결정적으로 실행하고 명시적 승인 단계를 두기 위한 워크플로우 런타임입니다. 단일 agent turn보다 긴 작업이고, 사람 승인 지점을 포함한 재개 가능한 워크플로우가 필요할 때 사용하세요.

### Lobster가 잘 맞는 경우

- **다단계 자동화**: 일회성 프롬프트가 아니라 고정된 도구 호출 파이프라인이 필요함
- **승인 게이트**: 부작용이 발생하기 전에 멈췄다가 승인 후 재개해야 함
- **재개 가능한 실행**: 앞단계를 다시 실행하지 않고 중단된 워크플로우를 이어가고 싶음

### Heartbeat 및 Cron과의 관계

- **Heartbeat/Cron**은 _언제_ 실행할지를 결정합니다.
- **Lobster**는 실행이 시작된 뒤 *어떤 단계*를 밟을지를 정의합니다.

스케줄된 워크플로우라면 cron 또는 heartbeat가 Lobster를 호출하는 agent turn을 트리거하게 하면 됩니다.
즉석 워크플로우라면 Lobster를 직접 호출하세요.

### 운영 메모(코드 기준)

- Lobster는 tool 모드에서 로컬 서브프로세스(`lobster` CLI)로 실행되며 **JSON envelope**을 반환합니다.
- 도구가 `needs_approval`을 반환하면 `resumeToken`과 `approve` 플래그로 재개합니다.
- 이 도구는 **선택적 플러그인**입니다. `tools.alsoAllow: ["lobster"]`로 점진적으로 활성화하는 방식을 권장합니다.
- Lobster를 사용하려면 `lobster` CLI가 `PATH`에 있어야 합니다.

전체 사용법과 예시는 [Lobster](/tools/lobster)를 참고하세요.

## Main Session vs Isolated Session

Heartbeat와 cron 모두 main session과 상호작용할 수 있지만 방식은 다릅니다.

| 구분    | Heartbeat                    | Cron (main)                | Cron (isolated)           |
| ------- | ---------------------------- | -------------------------- | ------------------------- |
| Session | Main                         | Main (system event를 통해) | `cron:<jobId>`            |
| History | 공유                         | 공유                       | 실행마다 새로 시작        |
| Context | 전체                         | 전체                       | 없음(깨끗한 상태)         |
| Model   | main session model           | main session model         | override 가능             |
| Output  | `HEARTBEAT_OK`가 아니면 전달 | heartbeat prompt + event   | 기본값은 announce summary |

### main session cron을 써야 할 때

`--session main`과 `--system-event`를 함께 쓰는 경우:

- 알림/이벤트가 main session 문맥에 나타나길 원할 때
- 에이전트가 다음 heartbeat에서 전체 문맥과 함께 이를 처리하길 원할 때
- 별도의 isolated 실행이 필요 없을 때

```bash
openclaw cron add \
  --name "Check project" \
  --every "4h" \
  --session main \
  --system-event "Time for a project health check" \
  --wake now
```

### isolated cron을 써야 할 때

`--session isolated`를 쓰는 경우:

- 이전 문맥 없이 깨끗한 상태에서 시작하고 싶을 때
- 다른 model 또는 thinking 설정이 필요할 때
- 채널로 요약을 직접 전달하고 싶을 때
- main session을 지저분하게 만들고 싶지 않을 때

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

## 비용 고려 사항

| 메커니즘        | 비용 특성                                               |
| --------------- | ------------------------------------------------------- |
| Heartbeat       | N분마다 한 번 실행, `HEARTBEAT.md` 크기에 비례          |
| Cron (main)     | 다음 heartbeat에 event를 추가(별도 isolated turn 없음)  |
| Cron (isolated) | 작업마다 전체 agent turn 실행, 더 저렴한 모델 사용 가능 |

**팁:**

- 토큰 오버헤드를 줄이려면 `HEARTBEAT.md`를 작게 유지하세요.
- 여러 cron job 대신 비슷한 점검은 heartbeat로 묶으세요.
- 내부 처리만 원한다면 heartbeat에서 `target: "none"`을 사용하세요.
- 루틴 작업에는 더 저렴한 모델로 isolated cron을 쓰는 것이 좋습니다.

## 관련 문서

- [Heartbeat](/gateway/heartbeat) - heartbeat 전체 설정
- [Cron jobs](/automation/cron-jobs) - cron CLI 및 API 전체 참조
- [System](/cli/system) - system event + heartbeat 제어
