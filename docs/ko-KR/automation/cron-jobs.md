---
summary: "Gateway 스케줄러용 Cron 작업과 wakeup"
read_when:
  - 백그라운드 작업이나 wakeup을 예약할 때
  - heartbeat와 함께 또는 heartbeat와 별도로 동작해야 하는 자동화를 연결할 때
  - 예약 작업에 heartbeat와 cron 중 무엇을 쓸지 결정할 때
title: "Cron Jobs"
x-i18n:
  source_path: "automation/cron-jobs.md"
---

# Cron jobs (Gateway scheduler)

> **Cron vs Heartbeat?** 어떤 상황에서 무엇을 써야 하는지는 [Cron vs Heartbeat](/automation/cron-vs-heartbeat)를 참고하세요.

Cron은 Gateway에 내장된 스케줄러입니다. 작업을 저장하고, 적절한 시점에 에이전트를 깨우며, 필요하면 결과를 채팅으로 다시 전달할 수도 있습니다.

_“이걸 매일 아침 실행해”_ 또는 _“20분 뒤에 에이전트를 깨워”_ 같은 요구라면 cron이 맞는 메커니즘입니다.

문제 해결: [/automation/troubleshooting](/automation/troubleshooting)

## TL;DR

- Cron은 **Gateway 내부에서 실행**됩니다(모델 내부가 아님).
- 작업은 `~/.openclaw/cron/` 아래에 저장되므로 재시작해도 스케줄이 사라지지 않습니다.
- 두 가지 실행 방식:
  - **Main session**: system event를 enqueue한 뒤 다음 heartbeat에서 실행
  - **Isolated**: `cron:<jobId>`에서 전용 agent turn 실행, 필요하면 전달(기본값은 announce 또는 none)
- Wakeup은 일급 기능입니다. 작업마다 "즉시 깨우기"와 "다음 heartbeat까지 대기"를 선택할 수 있습니다.
- Webhook 전송은 작업별로 `delivery.mode = "webhook"` + `delivery.to = "<url>"` 조합으로 설정합니다.
- `notify: true`가 저장된 레거시 작업을 위해 fallback 경로가 남아 있지만, 그런 작업은 webhook delivery mode로 마이그레이션하는 것이 좋습니다.
- 업그레이드 시 `openclaw doctor --fix`로 레거시 cron 저장 필드를 정규화한 뒤 스케줄러가 읽도록 만들 수 있습니다.

## 빠른 시작(바로 써먹기)

1회성 reminder를 만들고, 생성 여부를 확인한 뒤, 즉시 실행합니다.

```bash
openclaw cron add \
  --name "Reminder" \
  --at "2026-02-01T16:00:00Z" \
  --session main \
  --system-event "Reminder: check the cron docs draft" \
  --wake now \
  --delete-after-run

openclaw cron list
openclaw cron run <job-id>
openclaw cron runs --id <job-id>
```

전달 기능이 있는 반복 isolated 작업을 예약:

```bash
openclaw cron add \
  --name "Morning brief" \
  --cron "0 7 * * *" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "Summarize overnight updates." \
  --announce \
  --channel slack \
  --to "channel:C1234567890"
```

## 도구 호출에 대응하는 형태(Gateway cron tool)

정식 JSON 구조와 예시는 [JSON schema for tool calls](/automation/cron-jobs#json-schema-for-tool-calls)를 참고하세요.

## cron 작업이 저장되는 위치

Cron 작업은 기본적으로 Gateway 호스트의 `~/.openclaw/cron/jobs.json`에 저장됩니다.
Gateway는 이 파일을 메모리로 읽고 변경 시 다시 기록하므로, 수동 편집은 Gateway가 멈춘 상태에서만 안전합니다. 변경은 `openclaw cron add/edit` 또는 cron tool call API를 사용하는 것이 좋습니다.

## 초보자용 개념 설명

Cron 작업은 다음 두 요소의 조합이라고 보면 됩니다. **언제 실행할지** + **무엇을 할지**

1. **스케줄 선택**
   - 1회성 reminder → `schedule.kind = "at"` (CLI: `--at`)
   - 반복 작업 → `schedule.kind = "every"` 또는 `schedule.kind = "cron"`
   - ISO timestamp에 시간대가 없으면 **UTC**로 간주됩니다.

2. **어디서 실행할지 선택**
   - `sessionTarget: "main"` → main context를 유지한 채 다음 heartbeat에서 실행
   - `sessionTarget: "isolated"` → `cron:<jobId>`에서 전용 agent turn 실행

3. **payload 선택**
   - Main session → `payload.kind = "systemEvent"`
   - Isolated session → `payload.kind = "agentTurn"`

선택 사항: 1회성 작업(`schedule.kind = "at"`)은 기본적으로 성공 후 삭제됩니다. 보존하려면 `deleteAfterRun: false`로 설정하세요(이 경우 성공 후 비활성화됨).

## 개념

### Jobs

Cron 작업은 다음을 담은 저장 레코드입니다.

- **schedule**(언제 실행할지)
- **payload**(무엇을 할지)
- 선택적 **delivery mode** (`announce`, `webhook`, `none`)
- 선택적 **agent binding** (`agentId`): 특정 agent 아래에서 작업 실행. 비어 있거나 알 수 없는 ID면 default agent로 폴백

작업은 안정적인 `jobId`로 식별됩니다(CLI/Gateway API에서 사용).
Agent tool call에서는 `jobId`가 정식이며, 레거시 호환을 위해 `id`도 허용됩니다.
1회성 작업은 기본적으로 성공 후 자동 삭제되며, 유지하려면 `deleteAfterRun: false`를 설정합니다.

### Schedules

Cron은 세 가지 스케줄 종류를 지원합니다.

- `at`: `schedule.at`에 ISO 8601 timestamp로 지정하는 1회성 실행
- `every`: 고정 간격(ms)
- `cron`: 선택적 IANA timezone과 함께 쓰는 5필드 cron expression(또는 초를 포함한 6필드)

Cron expression은 `croner`를 사용합니다. 시간대를 생략하면 Gateway 호스트의 로컬 시간대를 사용합니다.

여러 Gateway가 동시에 정시 부하를 만들지 않도록, OpenClaw는 정시형 반복 표현식(예: `0 * * * *`, `0 */2 * * *`)에 대해 작업별로 최대 5분의 결정적 stagger window를 적용합니다. 반면 `0 7 * * *`처럼 고정 시각 표현식은 정확한 시각에 맞춰 실행됩니다.

모든 cron schedule에는 `schedule.staggerMs`로 명시적 stagger window를 줄 수 있습니다(`0`이면 정확한 시각 유지). CLI 단축 옵션:

- `--stagger 30s` (또는 `1m`, `5m`)로 명시적 stagger window 설정
- `--exact`로 `staggerMs = 0` 강제

### Main vs isolated 실행

#### Main session 작업(system events)

Main 작업은 system event를 enqueue하고 필요하면 heartbeat runner를 깨웁니다.
반드시 `payload.kind = "systemEvent"`를 사용해야 합니다.

- `wakeMode: "now"` (기본값): event가 즉시 heartbeat 실행을 유발
- `wakeMode: "next-heartbeat"`: 다음 예정 heartbeat까지 event 대기

이 방식은 일반적인 heartbeat 프롬프트 + main-session context가 필요할 때 가장 적합합니다.
[Heartbeat](/gateway/heartbeat)를 참고하세요.

#### Isolated 작업(전용 cron 세션)

Isolated 작업은 `cron:<jobId>` 세션에서 전용 agent turn을 실행합니다.

핵심 동작:

- 추적을 위해 프롬프트 앞에 `[cron:<jobId> <job name>]` 접두사가 붙습니다.
- 각 실행은 **새로운 session id**로 시작합니다(이전 대화 문맥 불러오지 않음).
- 기본 동작: isolated 작업에서 `delivery`를 생략하면 요약을 announce합니다(`delivery.mode = "announce"`).
- `delivery.mode`로 동작을 정합니다.
  - `announce`: 대상 채널로 요약 전달 + main session에 짧은 요약 게시
  - `webhook`: finished event payload에 summary가 있을 때 `delivery.to`로 POST
  - `none`: 내부 전용(전달 없음, main-session summary 없음)
- `wakeMode`는 main-session summary가 언제 게시될지 제어합니다.
  - `now`: 즉시 heartbeat
  - `next-heartbeat`: 다음 예정 heartbeat까지 대기

시끄럽거나 빈번한 작업, 또는 main chat history를 어지럽히고 싶지 않은 "백그라운드 작업"에 적합합니다.

### Payload 형태(무엇을 실행하는가)

지원되는 payload 종류는 두 가지입니다.

- `systemEvent`: main-session 전용, heartbeat 프롬프트를 통해 라우팅
- `agentTurn`: isolated-session 전용, 별도 agent turn 실행

공통 `agentTurn` 필드:

- `message`: 필수 텍스트 프롬프트
- `model` / `thinking`: 선택적 override
- `timeoutSeconds`: 선택적 timeout override
- `lightContext`: workspace bootstrap file injection이 필요 없는 작업용 lightweight bootstrap mode

Delivery 설정:

- `delivery.mode`: `none` | `announce` | `webhook`
- `delivery.channel`: `last` 또는 특정 채널
- `delivery.to`: 채널 대상(`announce`) 또는 webhook URL(`webhook`)
- `delivery.bestEffort`: announce 전달 실패 시 작업 자체를 실패 처리하지 않음

Announce 전달은 해당 실행 중 message tool 전송을 억제합니다. 채팅 대상으로 전달하려면 `delivery.channel`/`delivery.to`를 사용하세요. `delivery.mode = "none"`이면 main session에도 summary가 게시되지 않습니다.

Isolated 작업에서 `delivery`를 생략하면 OpenClaw는 기본적으로 `announce`를 사용합니다.

#### Announce 전달 흐름

`delivery.mode = "announce"`일 때 cron은 outbound channel adapter를 통해 직접 전달합니다.
메인 agent를 다시 띄워 메시지를 만들거나 전달하지 않습니다.

동작 상세:

- 콘텐츠: isolated run의 outbound payload(텍스트/미디어)를 일반적인 chunking 및 채널 포맷팅과 함께 사용
- Heartbeat 전용 응답(`HEARTBEAT_OK` + 실제 콘텐츠 없음)은 전달하지 않음
- 같은 대상에 대해 isolated run이 이미 message tool로 메시지를 보냈다면 중복 방지를 위해 전달 생략
- 전달 대상이 없거나 잘못되면 `delivery.bestEffort = true`가 아닌 한 작업 실패
- `delivery.mode = "announce"`일 때만 main session에 짧은 summary 게시
- `wakeMode`에 따라 main-session summary 타이밍 제어
  - `now`: 즉시 heartbeat
  - `next-heartbeat`: 다음 예정 heartbeat까지 대기

#### Webhook 전달 흐름

`delivery.mode = "webhook"`이면, finished event에 summary가 포함된 경우 `delivery.to`로 해당 payload를 POST합니다.

동작 상세:

- 엔드포인트는 유효한 HTTP(S) URL이어야 함
- webhook 모드에서는 채널 전달을 시도하지 않음
- webhook 모드에서는 main-session summary를 게시하지 않음
- `cron.webhookToken`이 설정돼 있으면 인증 헤더는 `Authorization: Bearer <cron.webhookToken>`
- 레거시 fallback: `notify: true`가 저장된 작업은 여전히 `cron.webhook`(있을 경우)에 POST하지만, webhook delivery mode로의 마이그레이션 경고를 함께 출력

### Model과 thinking override

Isolated 작업(`agentTurn`)은 model과 thinking level을 override할 수 있습니다.

- `model`: provider/model 문자열(예: `anthropic/claude-sonnet-4-20250514`) 또는 alias(예: `opus`)
- `thinking`: thinking level(`off`, `minimal`, `low`, `medium`, `high`, `xhigh`; GPT-5.2 + Codex 모델 전용)

참고: main-session 작업에도 `model`을 설정할 수는 있지만, shared main session model이 바뀝니다. 예기치 않은 문맥 전환을 피하려면 model override는 isolated 작업에서만 쓰는 것이 좋습니다.

해결 우선순위:

1. 작업 payload override(최우선)
2. hook별 기본값(예: `hooks.gmail.model`)
3. agent config 기본값

### Lightweight bootstrap context

Isolated 작업(`agentTurn`)은 `lightContext: true`를 설정해 lightweight bootstrap context로 실행할 수 있습니다.

- workspace bootstrap file injection이 필요 없는 예약 작업에 사용
- 실제 런타임에서는 `bootstrapContextMode: "lightweight"`로 실행되어 cron bootstrap context를 의도적으로 비워 둠
- CLI 대응: `openclaw cron add --light-context ...` 및 `openclaw cron edit --light-context`

### Delivery(채널 + 대상)

Isolated 작업은 최상위 `delivery` 설정으로 특정 채널에 결과를 전달할 수 있습니다.

- `delivery.mode`: `announce`(채널 전달), `webhook`(HTTP POST), `none`
- `delivery.channel`: `whatsapp` / `telegram` / `discord` / `slack` / `mattermost`(plugin) / `signal` / `imessage` / `last`
- `delivery.to`: 채널별 수신 대상

`announce` 전달은 isolated 작업(`sessionTarget: "isolated"`)에서만 유효합니다.
`webhook` 전달은 main과 isolated 모두에서 유효합니다.

`delivery.channel` 또는 `delivery.to`를 생략하면 cron은 main session의 "last route"(에이전트가 마지막으로 응답한 위치)로 폴백할 수 있습니다.

대상 형식 참고:

- Slack/Discord/Mattermost(plugin) 대상은 모호성을 피하기 위해 명시적 접두사(예: `channel:<id>`, `user:<id>`)를 쓰는 것이 좋습니다.
- Telegram topic은 아래의 `:topic:` 형식을 사용해야 합니다.

#### Telegram 전달 대상(topics / forum threads)

Telegram은 `message_thread_id`를 통해 forum topic을 지원합니다. cron 전달에서는 topic/thread를 `to` 필드에 다음과 같이 인코딩할 수 있습니다.

- `-1001234567890` (chat id만)
- `-1001234567890:topic:123` (권장: 명시적 topic marker)
- `-1001234567890:123` (축약형: 숫자 접미사)

`telegram:...` / `telegram:group:...` 같은 접두사 대상도 허용됩니다.

- `telegram:group:-1001234567890:topic:123`

## Tool calls용 JSON schema

Gateway `cron.*` 도구를 직접 호출할 때(agent tool calls 또는 RPC) 다음 형태를 사용하세요.
CLI 플래그는 `20m` 같은 사람이 읽는 duration을 받지만, tool call에서는 `schedule.at`에 ISO 8601 문자열을, `schedule.everyMs`에는 밀리초를 사용해야 합니다.

### cron.add params

1회성 main session 작업(system event):

```json
{
  "name": "Reminder",
  "schedule": { "kind": "at", "at": "2026-02-01T16:00:00Z" },
  "sessionTarget": "main",
  "wakeMode": "now",
  "payload": { "kind": "systemEvent", "text": "Reminder text" },
  "deleteAfterRun": true
}
```

전달 기능이 있는 반복 isolated 작업:

```json
{
  "name": "Morning brief",
  "schedule": { "kind": "cron", "expr": "0 7 * * *", "tz": "America/Los_Angeles" },
  "sessionTarget": "isolated",
  "wakeMode": "next-heartbeat",
  "payload": {
    "kind": "agentTurn",
    "message": "Summarize overnight updates.",
    "lightContext": true
  },
  "delivery": {
    "mode": "announce",
    "channel": "slack",
    "to": "channel:C1234567890",
    "bestEffort": true
  }
}
```

참고:

- `schedule.kind`: `at`(`at`), `every`(`everyMs`), `cron`(`expr`, 선택적 `tz`)
- `schedule.at`은 ISO 8601 사용(시간대가 없으면 UTC로 처리)
- `everyMs`는 밀리초
- `sessionTarget`은 반드시 `"main"` 또는 `"isolated"`이며 `payload.kind`와 일치해야 함
- 선택적 필드: `agentId`, `description`, `enabled`, `deleteAfterRun`(`at`의 기본값은 true), `delivery`
- `wakeMode`는 생략 시 `"now"`가 기본값

### cron.update 파라미터

```json
{
  "jobId": "job-123",
  "patch": {
    "enabled": false,
    "schedule": { "kind": "every", "everyMs": 3600000 }
  }
}
```

참고:

- `jobId`가 정식이며, 호환성용으로 `id`도 허용
- patch에서 `agentId: null`을 사용하면 agent binding을 해제

### cron.run 과 cron.remove 파라미터

```json
{ "jobId": "job-123", "mode": "force" }
```

```json
{ "jobId": "job-123" }
```

## 저장소와 이력

- 작업 저장소: `~/.openclaw/cron/jobs.json` (Gateway가 관리하는 JSON)
- 실행 이력: `~/.openclaw/cron/runs/<jobId>.jsonl` (JSONL, 크기와 줄 수 기준 자동 정리)
- `sessions.json` 내 isolated cron run 세션은 `cron.sessionRetention`(기본값 `24h`; `false`면 비활성화)에 따라 정리
- 저장 경로 override: config의 `cron.store`

## 재시도 정책

작업이 실패하면 OpenClaw는 오류를 **일시적(transient, 재시도 가능)** 또는 **영구적(permanent, 즉시 비활성화)** 으로 분류합니다.

### 일시적 오류(재시도)

- Rate limit (429, too many requests, resource exhausted)
- Provider overload (예: Anthropic `529 overloaded_error`, overload fallback summaries)
- 네트워크 오류(timeout, ECONNRESET, fetch failed, socket)
- 서버 오류(5xx)
- Cloudflare 관련 오류

### 영구적 오류(재시도 없음)

- 인증 실패(invalid API key, unauthorized)
- config 또는 validation 오류
- 그 외 비일시적 오류

### 기본 동작(config 없음)

**1회성 작업(`schedule.kind: "at"`):**

- 일시적 오류 시: exponential backoff(30초 → 1분 → 5분)로 최대 3회 재시도
- 영구적 오류 시: 즉시 비활성화
- 성공 또는 skip 시: 비활성화(또는 `deleteAfterRun: true`이면 삭제)

**반복 작업(`cron` / `every`):**

- 어떤 오류든 다음 예정 실행 전 exponential backoff(30초 → 1분 → 5분 → 15분 → 60분) 적용
- 작업은 활성 상태를 유지하며, 다음 성공 실행 후 backoff가 초기화됨

이 기본값을 바꾸려면 `cron.retry`를 설정하세요([Configuration](/automation/cron-jobs#configuration) 참고).

## 설정

```json5
{
  cron: {
    enabled: true, // 기본값 true
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 1, // 기본값 1
    retry: {
      maxAttempts: 3,
      backoffMs: [60000, 120000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "server_error"],
    },
    webhook: "https://example.invalid/legacy", // notify:true 레거시 작업용 deprecated fallback
    webhookToken: "replace-with-dedicated-webhook-token", // webhook mode용 선택적 bearer token
    sessionRetention: "24h",
    runLog: {
      maxBytes: "2mb",
      keepLines: 2000,
    },
  },
}
```

실행 로그 정리 동작:

- `cron.runLog.maxBytes`: pruning 전까지 허용되는 run-log 파일 최대 크기
- `cron.runLog.keepLines`: pruning 시 최신 N줄만 유지
- 둘 다 `cron/runs/<jobId>.jsonl` 파일에 적용

Webhook 동작:

- 권장 방식: 작업별로 `delivery.mode: "webhook"` + `delivery.to: "https://..."` 설정
- Webhook URL은 유효한 `http://` 또는 `https://` URL이어야 함
- 전송 시 payload는 cron finished event JSON
- `cron.webhookToken`이 있으면 인증 헤더는 `Authorization: Bearer <cron.webhookToken>`
- `cron.webhookToken`이 없으면 `Authorization` 헤더 없음
- Deprecated fallback: `notify: true`가 저장된 레거시 작업은 `cron.webhook`이 있으면 계속 사용

Cron 전체 비활성화:

- `cron.enabled: false` (config)
- `OPENCLAW_SKIP_CRON=1` (env)

## 유지보수

Cron에는 두 가지 내장 유지보수 경로가 있습니다. isolated run-session retention과 run-log pruning입니다.

### 기본값

- `cron.sessionRetention`: `24h` (`false`로 설정하면 run-session pruning 비활성화)
- `cron.runLog.maxBytes`: `2_000_000` bytes
- `cron.runLog.keepLines`: `2000`

### 동작 방식

- Isolated 실행은 session 항목(`...:cron:<jobId>:run:<uuid>`)과 transcript 파일을 생성
- reaper는 `cron.sessionRetention`보다 오래된 만료 run-session 항목 제거
- 세션 저장소에서 더 이상 참조되지 않는 제거 대상 run session에 대해 OpenClaw는 transcript 파일을 archive하고, 같은 retention window 기준으로 오래된 deleted archive도 정리
- 각 실행 append 후 `cron/runs/<jobId>.jsonl` 크기를 검사
  - 파일 크기가 `runLog.maxBytes`를 넘으면 최신 `runLog.keepLines` 줄만 남기고 trim

### 대량 스케줄 환경의 성능 주의점

고빈도 cron 환경에서는 run-session과 run-log가 크게 늘어날 수 있습니다. 유지보수는 내장돼 있지만, 제한을 느슨하게 두면 불필요한 IO와 정리 작업이 생길 수 있습니다.

주의할 점:

- 많은 isolated run이 있는 상태에서 긴 `cron.sessionRetention`
- 큰 `runLog.maxBytes`와 높은 `cron.runLog.keepLines` 조합
- 같은 `cron/runs/<jobId>.jsonl`에 기록하는 시끄러운 반복 작업이 많을 때

대응 방법:

- 디버깅/감사 요구사항이 허용하는 한 `cron.sessionRetention`을 짧게 유지
- 적당한 `runLog.maxBytes`와 `runLog.keepLines`로 run log를 제한
- 필요 없는 chatter를 줄이는 delivery 규칙과 함께 noisy background job은 isolated mode로 이동
- `openclaw cron runs`로 증감 추이를 주기적으로 확인하고, 로그가 커지기 전에 retention 조정

### 커스터마이즈 예시

run session을 1주일 보관하고 더 큰 run log 허용:

```json5
{
  cron: {
    sessionRetention: "7d",
    runLog: {
      maxBytes: "10mb",
      keepLines: 5000,
    },
  },
}
```

Isolated run-session pruning은 끄고 run-log pruning만 유지:

```json5
{
  cron: {
    sessionRetention: false,
    runLog: {
      maxBytes: "5mb",
      keepLines: 3000,
    },
  },
}
```

고빈도 cron 환경용 튜닝 예시:

```json5
{
  cron: {
    sessionRetention: "12h",
    runLog: {
      maxBytes: "3mb",
      keepLines: 1500,
    },
  },
}
```

## CLI 빠른 시작

1회성 reminder(UTC ISO, 성공 후 자동 삭제):

```bash
openclaw cron add \
  --name "Send reminder" \
  --at "2026-01-12T18:00:00Z" \
  --session main \
  --system-event "Reminder: submit expense report." \
  --wake now \
  --delete-after-run
```

1회성 reminder(main session, 즉시 wake):

```bash
openclaw cron add \
  --name "Calendar check" \
  --at "20m" \
  --session main \
  --system-event "Next heartbeat: check calendar." \
  --wake now
```

반복 isolated 작업(WhatsApp에 announce):

```bash
openclaw cron add \
  --name "Morning status" \
  --cron "0 7 * * *" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "Summarize inbox + calendar for today." \
  --announce \
  --channel whatsapp \
  --to "+15551234567"
```

명시적 30초 stagger가 있는 반복 cron 작업:

```bash
openclaw cron add \
  --name "Minute watcher" \
  --cron "0 * * * * *" \
  --tz "UTC" \
  --stagger 30s \
  --session isolated \
  --message "Run minute watcher checks." \
  --announce
```

Telegram topic으로 전달하는 반복 isolated 작업:

```bash
openclaw cron add \
  --name "Nightly summary (topic)" \
  --cron "0 22 * * *" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "Summarize today; send to the nightly topic." \
  --announce \
  --channel telegram \
  --to "-1001234567890:topic:123"
```

Model과 thinking override가 있는 isolated 작업:

```bash
openclaw cron add \
  --name "Deep analysis" \
  --cron "0 6 * * 1" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "Weekly deep analysis of project progress." \
  --model "opus" \
  --thinking high \
  --announce \
  --channel whatsapp \
  --to "+15551234567"
```

Agent 선택(multi-agent 환경):

```bash
# 작업을 agent "ops"에 고정(해당 agent가 없으면 default로 폴백)
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops

# 기존 작업의 agent 변경 또는 해제
openclaw cron edit <jobId> --agent ops
openclaw cron edit <jobId> --clear-agent
```

수동 실행(force가 기본, due일 때만 실행하려면 `--due`):

```bash
openclaw cron run <jobId>
openclaw cron run <jobId> --due
```

`cron.run`은 이제 작업이 끝난 뒤가 아니라 수동 실행이 큐에 들어가면 확인 응답을 반환합니다.
성공적으로 큐에 들어간 응답은 `{ ok: true, enqueued: true, runId }` 형태입니다.
이미 실행 중이거나 `--due`에서 due 작업이 없으면 응답은 `{ ok: true, ran: false, reason }` 형태로 남습니다.
실제 완료 항목은 `openclaw cron runs --id <jobId>` 또는 `cron.runs` gateway method로 확인하세요.

기존 작업 편집(patch 필드):

```bash
openclaw cron edit <jobId> \
  --message "Updated prompt" \
  --model "opus" \
  --thinking low
```

기존 cron 작업을 정확한 시각으로 강제(stagger 없이):

```bash
openclaw cron edit <jobId> --exact
```

실행 이력:

```bash
openclaw cron runs --id <jobId> --limit 50
```

작업 생성 없이 즉시 system event 보내기:

```bash
openclaw system event --mode now --text "Next heartbeat: check battery."
```

## Gateway API

- `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`
- `cron.run` (force 또는 due), `cron.runs`
  작업 없이 즉시 system event를 보내려면 [`openclaw system event`](/cli/system)를 사용

## 문제 해결

### “아무것도 실행되지 않음”

- cron이 활성화됐는지 확인: `cron.enabled`와 `OPENCLAW_SKIP_CRON`
- Gateway가 계속 실행 중인지 확인(cron은 Gateway 프로세스 내부에서 실행)
- `cron` 스케줄이라면 `--tz`와 호스트 시간대가 맞는지 확인

### 반복 작업이 실패 후 계속 지연됨

- OpenClaw는 연속 오류 후 반복 작업에 exponential retry backoff를 적용합니다: 30초, 1분, 5분, 15분, 60분
- 다음 성공 실행 후 backoff는 자동으로 초기화됩니다.
- 1회성(`at`) 작업은 일시적 오류(rate limit, overloaded, network, server_error)를 backoff와 함께 최대 3회 재시도하며, 영구적 오류는 즉시 비활성화됩니다. [Retry policy](/automation/cron-jobs#retry-policy)를 참고하세요.

### Telegram이 잘못된 위치로 전달됨

- Forum topic은 `-100…:topic:<id>` 형식을 써서 명시적으로 지정하세요.
- 로그나 저장된 "last route" 대상에 `telegram:...` 접두사가 보여도 정상입니다.
  cron 전달은 이를 받아 topic ID를 올바르게 해석합니다.

### Subagent announce 전달 재시도

- subagent 실행이 끝나면 gateway는 requester session에 결과를 announce합니다.
- announce 흐름이 `false`를 반환하면(예: requester session이 바쁠 때), gateway는 `announceRetryCount`를 추적하며 최대 3회 재시도합니다.
- `endedAt` 기준 5분이 지난 announce는 강제로 만료되어 오래된 항목이 무한히 반복되지 않도록 합니다.
- 로그에 announce 전달이 반복된다면 subagent registry에서 `announceRetryCount`가 높은 항목이 있는지 확인하세요.
