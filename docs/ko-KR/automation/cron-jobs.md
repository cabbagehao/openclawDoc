---
summary: "Gateway 스케줄러를 활용한 백그라운드 크론 작업 예약 및 에이전트 깨우기(Wakeup) 가이드"
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
  --name "리마인더" \
  --at "2026-02-01T16:00:00Z" \
  --session main \
  --system-event "리마인더: 크론 문서 초안 검토" \
  --wake now \
  --delete-after-run

# 상태 확인 및 실행
openclaw cron list
openclaw cron run <job-id>
openclaw cron runs --id <job-id>
```

주기적으로 실행되는 격리된 작업 및 결과 공지 설정:

```bash
openclaw cron add \
  --name "아침 브리핑" \
  --cron "0 7 * * *" \
  --tz "Asia/Seoul" \
  --session isolated \
  --message "어제 밤새 업데이트된 내용을 요약해줘." \
  --announce \
  --channel slack \
  --to "channel:C1234567890"
```

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

여러 Gateway가 정시에 동시에 부하를 일으키는 것을 방지하기 위해, OpenClaw는 정시 반복 작업(예: `0 * * * *`)에 대해 최대 5분의 **결정적 스태거(Stagger)**를 자동으로 적용함. 정확한 시각 실행이 필요한 경우 `--exact` 플래그를 사용함.

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

---

## 저장소 및 이력 관리

- **작업 저장소**: `~/.openclaw/cron/jobs.json`
- **실행 이력**: `~/.openclaw/cron/runs/<jobId>.jsonl`
- **정리 정책**:
  - `cron.sessionRetention`: 완료된 격리 세션의 보관 기간 (기본값: `24h`).
  - `cron.runLog.maxBytes`: 로그 파일의 최대 용량.
  - `cron.runLog.keepLines`: 로그 정리 시 유지할 최신 라인 수.

---

## 재시도 정책 (Retry Policy)

작업 실패 시 오류를 분석하여 대응함:
- **일시적 오류 (재시도)**: 속도 제한(429), 공급자 과부하(529), 네트워크 타임아웃, 서버 오류(5xx).
  - 1회성 작업: 최대 3회 지수 백오프 적용 (30초 → 1분 → 5분).
  - 반복 작업: 다음 예약 시점 전까지 백오프 적용 (최대 60분).
- **영구적 오류 (중단)**: 인증 실패(Invalid API Key), 설정 오류 등. 즉시 작업을 비활성화함.

---

## 문제 해결 (Troubleshooting)

- **작업이 실행되지 않음**: `cron.enabled` 설정 및 `OPENCLAW_SKIP_CRON` 환경 변수를 확인함. Gateway 프로세스가 상시 가동 중인지 점검함.
- **실행 시각 불일치**: 스케줄 설정 시의 시간대(`--tz`)와 Gateway 호스트의 실제 시간대를 대조함.
- **Telegram 전송 오류**: 포럼 주제(Topic)로 전송 시 반드시 `-100...:topic:<ID>` 형식을 사용하여 대상을 명확히 지정함.
