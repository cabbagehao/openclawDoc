---
summary: "Gateway 스케줄러를 활용한 백그라운드 크론 작업 예약 및 에이전트 깨우기(Wakeup) 가이드"
description: "OpenClaw Gateway의 cron scheduler로 one-shot reminder, recurring isolated run, webhook delivery를 설정하고 운영하는 방법을 설명합니다."
read_when:
  - 백그라운드 작업이나 에이전트 자동 활성화를 예약하고자 할 때
  - 하트비트와 연동되거나 독립적으로 실행되는 자동화 기능을 구축할 때
  - 특정 작업에 하트비트와 크론 중 적합한 방식을 결정해야 할 때
title: "크론 작업"
x-i18n:
  source_path: "automation/cron-jobs.md"
---

# 크론 작업 (Gateway 스케줄러)

> **크론(Cron) vs 하트비트(Heartbeat)?** 각 기능의 용도와 차이점은 [크론 vs 하트비트 비교 가이드](/automation/cron-vs-heartbeat)를 참조함.

크론은 Gateway에 내장된 작업 스케줄러임. 예약된 작업을 저장하고 적절한 시점에 에이전트를 깨우며, 선택적으로 실행 결과를 채팅 채널로 전달함.

_"매일 아침 특정 작업을 실행"_ 하거나 _"20분 뒤에 에이전트에게 알림을 전송"_ 하는 등의 요구 사항은 크론 시스템을 통해 구현함.

문제 해결 가이드: [/automation/troubleshooting](/automation/troubleshooting)

## 핵심 요약 (TL;DR)

- **실행 환경**: 크론은 모델 내부가 아닌 **Gateway 프로세스 내**에서 실행됨.
- **데이터 영속성**: 작업 정보는 `~/.openclaw/cron/` 경로에 저장되어 서버 재시작 후에도 스케줄이 유지됨.
- **두 가지 실행 방식**:
  - **메인 세션 (Main session)**: 시스템 이벤트를 대기열에 추가하고 다음 하트비트 시점에 메인 맥락에서 실행함.
  - **격리 세션 (Isolated)**: `cron:<jobId>`라는 별도의 세션에서 독립적인 에이전트 턴을 실행하며, 결과를 외부 채널(공지 또는 웹훅)로 전달 가능함.
- **깨우기 제어**: 작업 실행 시 "즉시 에이전트 깨우기" 또는 "다음 하트비트 대기" 중 선택 가능함.
- **웹훅 연동**: 작업별로 `delivery.mode = "webhook"` 및 `delivery.to = "<URL>"` 설정을 통해 외부 시스템으로 결과를 전송함.
- **하위 호환성**: `openclaw doctor --fix` 명령어를 통해 레거시 크론 데이터를 최신 규격으로 자동 마이그레이션할 수 있음.

## 빠른 시작 (CLI 활용)

1회성 리마인더를 생성하고 즉시 실행함:

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

주기적으로 실행되는 격리된 작업 및 결과 공지 설정:

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

## 도구 호출 대응 형태 (Gateway cron tool)

정식 JSON 형태와 예시는 [JSON schema for tool calls](/automation/cron-jobs#json-schema-for-tool-calls)
를 참고하세요.

## 저장 위치 및 관리

크론 작업 데이터는 기본적으로 Gateway 호스트의 `~/.openclaw/cron/jobs.json` 파일에 저장됨. 서버는 시작 시 이 파일을 메모리로 로드하고 변경 시 다시 기록함. 수동 파일 편집은 데이터 유실 위험이 있으므로 반드시 Gateway 서버를 중단한 상태에서 수행하거나, `openclaw cron add/edit` 명령어 또는 RPC API 사용을 권장함.

---

## 핵심 개념

### 작업 (Jobs)

하나의 크론 작업은 다음 정보를 포함함:
- **스케줄 (Schedule)**: 실행 시점.
- **페이로드 (Payload)**: 수행할 작업 내용.
- **전달 모드 (Delivery)**: 실행 결과 처리 방식 (`announce`, `webhook`, `none`).
- **에이전트 바인딩**: 특정 에이전트 ID 지정.

각 작업은 고유한 `jobId`로 식별됨. 1회성 작업은 기본적으로 성공 후 자동 삭제되나, `deleteAfterRun: false` 설정을 통해 기록을 유지하고 비활성 상태로 전환할 수 있음.

### 스케줄 (Schedules)

- **`at`**: ISO 8601 형식의 1회성 타임스탬프. (시간대 미지정 시 UTC로 간주)
- **`every`**: 밀리초(ms) 단위의 고정 간격 반복.
- **`cron`**: 5개(또는 초를 포함한 6개) 필드로 구성된 크론 표현식.

cron 표현식은 `croner`를 사용합니다. 시간대를 생략하면 Gateway 호스트의
로컬 시간대를 사용합니다.

여러 Gateway가 정시에 동시에 부하를 일으키는 것을 방지하기 위해, OpenClaw는
정시 반복 작업(예: `0 * * * *`, `0 */2 * * *`)에 대해 작업별로 최대 5분의
결정적 stagger를 자동으로 적용합니다. `0 7 * * *` 같은 고정 시각 스케줄은
정확한 시각을 유지합니다.

임의의 cron 스케줄에는 `schedule.staggerMs`를 직접 설정할 수 있습니다.

- `--stagger 30s` (`1m`, `5m` 등)로 명시적 stagger window를 설정
- `--exact`로 `staggerMs = 0` 강제

### 실행 방식: 메인 vs 격리

#### 메인 세션 작업 (시스템 이벤트)
사용자와의 기본 대화 맥락을 유지하면서 작업을 수행함. `payload.kind = "systemEvent"`를 사용해야 함.
- **`wakeMode: "now"`**: 즉시 하트비트를 가동하여 이벤트를 처리함.
- **`wakeMode: "next-heartbeat"`**: 다음 예약된 하트비트 시점까지 대기함.

#### 격리 세션 작업 (독립 실행)
`cron:<jobId>`라는 별도의 세션에서 에이전트가 실행됨. 메인 대화 이력을 방해하지 않아야 하는 백그라운드 업무에 적합함.
- **특징**: 매 실행마다 새로운 세션 ID로 시작함.
- **결과 전달**: 기본값으로 실행 요약을 지정된 채널이나 메인 세션에 공지함 (`delivery.mode = "announce"`).

---

## 페이로드 및 결과 전달

### 페이로드 종류
- **`systemEvent`**: 하트비트 프롬프트를 통해 메인 세션으로 전달됨.
- **`agentTurn`**: 격리된 세션에서 독립적으로 실행됨. (`message`, `model`, `thinking`, `timeoutSeconds` 등 오버라이드 지원)

### 결과 전달 모드 (Delivery)
- **`announce`**: 대상 채널로 응답 전문(텍스트/미디어)을 전송하고, 메인 세션에 짧은 요약을 게시함.
- **`webhook`**: 작업 완료 이벤트를 지정된 URL로 HTTP POST함.
- **`none`**: 외부 전송 없이 내부적으로만 실행 기록을 남김.

## 대상 형식 참고

- Slack/Discord/Mattermost (plugin) 대상은 모호성을 피하려면
  `channel:<id>`, `user:<id>` 같은 명시적 prefix를 사용하는 편이 안전합니다.
- Mattermost의 bare 26자 ID는 기본적으로 user 우선으로 해석됩니다. 결정적인
  라우팅이 필요하면 `user:<id>` 또는 `channel:<id>`를 사용하세요.
- Telegram topic 전송은 아래의 `:topic:` 형식을 권장합니다.

### Telegram 전달 대상 (topics / forum threads)

Telegram은 `message_thread_id` 기반 forum topic을 지원합니다. cron delivery에서는
`to` 필드에 다음 형식을 사용할 수 있습니다.

- `-1001234567890`
- `-1001234567890:topic:123`
- `-1001234567890:123`

다음과 같은 prefix 형식도 허용됩니다.

- `telegram:group:-1001234567890:topic:123`

## JSON schema for tool calls

Gateway `cron.*` 도구를 직접 호출할 때는 아래 형태를 사용하세요. CLI는 `20m`
같은 human duration을 허용하지만, tool call에서는 `schedule.at`에 ISO 8601
문자열, `schedule.everyMs`에는 밀리초를 써야 합니다.

### cron.add params

One-shot main session job:

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

Recurring isolated job with delivery:

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

- `schedule.kind`: `at`, `every`, `cron`
- `schedule.at`: ISO 8601, 시간대 생략 시 UTC
- `everyMs`: 밀리초
- `sessionTarget`은 `"main"` 또는 `"isolated"`이며 `payload.kind`와 일치해야 함
- 선택 필드: `agentId`, `description`, `enabled`, `deleteAfterRun`, `delivery`
- `wakeMode`를 생략하면 기본값은 `"now"`

### cron.update params

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

- `jobId`가 canonical이며 호환성 때문에 `id`도 허용됨
- 에이전트 바인딩을 해제하려면 patch에서 `agentId: null` 사용

### cron.run and cron.remove params

```json
{ "jobId": "job-123", "mode": "force" }
```

```json
{ "jobId": "job-123" }
```

---

## 저장소 및 이력 관리

- **작업 저장소**: `~/.openclaw/cron/jobs.json`
- **실행 이력**: `~/.openclaw/cron/runs/<jobId>.jsonl`
- **정리 정책**:
  - `cron.sessionRetention`: 완료된 격리 세션의 보관 기간 (기본값: `24h`).
  - `cron.runLog.maxBytes`: 로그 파일의 최대 용량.
  - `cron.runLog.keepLines`: 로그 정리 시 유지할 최신 라인 수.
- **store path override**: config의 `cron.store`

---

## 재시도 정책 (Retry Policy)

작업 실패 시 오류를 분석하여 대응함:
- **일시적 오류 (재시도)**: 속도 제한(429), 공급자 과부하(529), 네트워크 타임아웃, 서버 오류(5xx).
  - 1회성 작업: 최대 3회 지수 백오프 적용 (30초 → 1분 → 5분).
  - 반복 작업: 다음 예약 시점 전까지 백오프 적용 (최대 60분).
- **영구적 오류 (중단)**: 인증 실패(Invalid API Key), 설정 오류 등. 즉시 작업을 비활성화함.

### 일시적 오류 (재시도됨)

- rate limit (`429`, too many requests, resource exhausted)
- provider overload (예: Anthropic `529 overloaded_error`)
- network error (timeout, ECONNRESET, fetch failed, socket)
- server error (`5xx`)
- Cloudflare 관련 오류

### 영구적 오류 (재시도 안 함)

- auth failure (invalid API key, unauthorized)
- config / validation error
- 기타 비일시적 오류

### 기본 동작

**One-shot job (`schedule.kind: "at"`):**

- 일시적 오류 시 최대 3회 재시도 (30s → 1m → 5m)
- 영구적 오류 시 즉시 비활성화
- 성공 또는 skip 시 비활성화 (`deleteAfterRun: true`면 삭제)

**Recurring job (`cron` / `every`):**

- 오류 발생 시 다음 예약 실행 전에 지수 백오프 적용
- 성공하면 backoff reset

`cron.retry`로 기본값을 override할 수 있습니다.

## Configuration

```json5
{
  cron: {
    enabled: true, // default true
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 1, // default 1
    retry: {
      maxAttempts: 3,
      backoffMs: [60000, 120000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "server_error"],
    },
    webhook: "https://example.invalid/legacy", // deprecated fallback for stored notify:true jobs
    webhookToken: "replace-with-dedicated-webhook-token", // optional bearer token for webhook mode
    sessionRetention: "24h", // duration string or false
    runLog: {
      maxBytes: "2mb", // default 2_000_000 bytes
      keepLines: 2000, // default 2000
    },
  },
}
```

Run-log pruning:

- `cron.runLog.maxBytes`: run-log 파일 최대 크기
- `cron.runLog.keepLines`: pruning 시 가장 최신 N줄만 유지

Webhook 동작:

- 권장: job별 `delivery.mode: "webhook"` + `delivery.to: "https://..."`
- webhook URL은 유효한 `http://` 또는 `https://` URL이어야 함
- 전송 payload는 cron finished event JSON
- `cron.webhookToken`이 있으면 `Authorization: Bearer <token>` 헤더 사용
- 레거시 `notify: true` job은 `cron.webhook` fallback을 계속 사용

Cron 완전 비활성화:

- `cron.enabled: false`
- `OPENCLAW_SKIP_CRON=1`

## Maintenance

Cron에는 두 가지 내장 maintenance 경로가 있습니다. 격리 실행 세션 retention과
run-log pruning입니다.

### Defaults

- `cron.sessionRetention`: `24h` (`false`면 run-session pruning 비활성화)
- `cron.runLog.maxBytes`: `2_000_000`
- `cron.runLog.keepLines`: `2000`

### 동작 방식

- 격리 실행은 `...:cron:<jobId>:run:<uuid>` 형태의 session entry와 transcript 파일을 생성
- reaper가 `cron.sessionRetention`보다 오래된 run session을 제거
- run append 뒤에는 `cron/runs/<jobId>.jsonl` 크기를 검사하고, `runLog.maxBytes`를
  넘으면 가장 최신 `runLog.keepLines` 줄만 유지

### 고빈도 스케줄러 주의사항

고빈도 cron 구성은 run-session과 run-log를 빠르게 늘릴 수 있습니다.

주의할 점:

- 긴 `cron.sessionRetention`
- 큰 `cron.runLog.keepLines`와 `runLog.maxBytes`
- 같은 `cron/runs/<jobId>.jsonl`에 많은 noisy recurring job이 기록되는 경우

권장:

- debugging/audit에 필요한 수준까지만 retention 유지
- run log는 적당한 `maxBytes`, `keepLines`로 제한
- noisy background job은 isolated mode + 필요한 delivery만 사용
- `openclaw cron runs`로 주기적으로 성장량 검토

### Customize examples

격리 run session을 일주일 보관하고 run log를 더 크게 유지:

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

격리 run-session pruning은 끄고 run-log pruning만 유지:

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

고빈도 cron 용도 예시:

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

---

## 문제 해결 (Troubleshooting)

- **작업이 실행되지 않음**: `cron.enabled` 설정 및 `OPENCLAW_SKIP_CRON` 환경 변수를 확인함. Gateway 프로세스가 상시 가동 중인지 점검함.
- **실행 시각 불일치**: 스케줄 설정 시의 시간대(`--tz`)와 Gateway 호스트의 실제 시간대를 대조함.
- **Telegram 전송 오류**: 포럼 주제(Topic)로 전송 시 반드시 `-100...:topic:<ID>` 형식을 사용하여 대상을 명확히 지정함.
