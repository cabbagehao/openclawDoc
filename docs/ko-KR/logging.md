---
summary: "로깅 개요: 파일 로그, 콘솔 출력, CLI tail, Control UI"
read_when:
  - 로깅에 대한 입문자 친화적인 개요가 필요할 때
  - 로그 레벨이나 포맷을 설정하고 싶을 때
  - 문제를 해결하면서 로그를 빠르게 찾아야 할 때
title: "로깅"
x-i18n:
  source_path: "logging.md"
---

# 로깅

OpenClaw는 두 곳에 로그를 남깁니다.

- Gateway가 기록하는 **파일 로그**(JSON lines)
- 터미널과 Control UI에 표시되는 **콘솔 출력**

이 페이지에서는 로그가 저장되는 위치, 읽는 방법, 그리고 로그 레벨 및 포맷을 설정하는 방법을 설명합니다.

## 로그 위치

기본적으로 Gateway는 다음 위치 아래에 롤링 로그 파일을 기록합니다.

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

날짜는 gateway 호스트의 로컬 타임존을 사용합니다.

`~/.openclaw/openclaw.json`에서 이를 재정의할 수 있습니다.

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## 로그 읽는 방법

### CLI: 실시간 tail 권장

CLI를 사용해 RPC를 통해 gateway 로그 파일을 tail 하세요.

```bash
openclaw logs --follow
```

출력 모드:

- **TTY 세션**: 보기 좋게 정리되고 색상이 적용된 구조화 로그 라인
- **Non-TTY 세션**: 일반 텍스트
- `--json`: 줄 구분 JSON(한 줄에 하나의 로그 이벤트)
- `--plain`: TTY 세션에서도 일반 텍스트 강제
- `--no-color`: ANSI 색상 비활성화

JSON 모드에서는 CLI가 `type` 태그가 붙은 객체를 출력합니다.

- `meta`: 스트림 메타데이터(파일, 커서, 크기)
- `log`: 파싱된 로그 항목
- `notice`: 잘림/로테이션 힌트
- `raw`: 파싱되지 않은 로그 라인

Gateway에 연결할 수 없으면 CLI는 다음을 실행하라는 짧은 힌트를 출력합니다.

```bash
openclaw doctor
```

### Control UI 웹

Control UI의 **Logs** 탭은 `logs.tail`을 사용해 같은 파일을 tail 합니다.
여는 방법은 [/web/control-ui](/web/control-ui)를 참고하세요.

### 채널 전용 로그

채널 활동만 필터링하려면(WhatsApp/Telegram 등) 다음을 사용하세요.

```bash
openclaw channels logs --channel whatsapp
```

## 로그 포맷

### 파일 로그 JSONL

로그 파일의 각 줄은 JSON 객체입니다. CLI와 Control UI는 이 항목들을 파싱해 구조화된 출력(시간, 레벨, 서브시스템, 메시지)을 렌더링합니다.

### 콘솔 출력

콘솔 로그는 **TTY 인식형**이며 가독성을 위해 포맷됩니다.

- 서브시스템 접두사(예: `gateway/channels/whatsapp`)
- 레벨별 색상(info/warn/error)
- 선택 가능한 compact 또는 JSON 모드

콘솔 포맷은 `logging.consoleStyle`로 제어합니다.

## 로깅 설정

모든 로깅 설정은 `~/.openclaw/openclaw.json`의 `logging` 아래에 있습니다.

```json
{
  "logging": {
    "level": "info",
    "file": "/tmp/openclaw/openclaw-YYYY-MM-DD.log",
    "consoleLevel": "info",
    "consoleStyle": "pretty",
    "redactSensitive": "tools",
    "redactPatterns": ["sk-.*"]
  }
}
```

### 로그 레벨

- `logging.level`: **파일 로그**(JSONL) 레벨
- `logging.consoleLevel`: **콘솔** 상세도 레벨

**`OPENCLAW_LOG_LEVEL`** 환경 변수로 두 값을 모두 재정의할 수 있습니다(예: `OPENCLAW_LOG_LEVEL=debug`). 이 환경 변수는 설정 파일보다 우선하므로 `openclaw.json`을 수정하지 않고도 한 번의 실행에 한해 상세도를 높일 수 있습니다. 전역 CLI 옵션 **`--log-level <level>`**(예: `openclaw --log-level debug gateway run`)을 전달하면 해당 명령에서는 환경 변수보다도 우선합니다.

`--verbose`는 콘솔 출력에만 영향을 주며 파일 로그 레벨은 변경하지 않습니다.

### 콘솔 스타일

`logging.consoleStyle`:

- `pretty`: 사람이 읽기 쉬운 형태, 색상 및 타임스탬프 포함
- `compact`: 더 촘촘한 출력(긴 세션에 적합)
- `json`: 한 줄당 하나의 JSON(로그 처리기용)

### 리다크션

도구 요약은 콘솔에 찍히기 전에 민감한 토큰을 마스킹할 수 있습니다.

- `logging.redactSensitive`: `off` | `tools` (기본값: `tools`)
- `logging.redactPatterns`: 기본 집합을 덮어쓸 정규식 문자열 목록

리다크션은 **콘솔 출력에만** 적용되며 파일 로그는 변경하지 않습니다.

## 진단 + OpenTelemetry

진단은 모델 실행 **및** 메시지 흐름 텔레메트리(웹훅, 큐잉, 세션 상태)를 위한 구조화된 기계 판독 가능 이벤트입니다. 로그를 대체하지 않으며, 메트릭, 트레이스, 기타 익스포터로 전달하기 위해 존재합니다.

진단 이벤트는 프로세스 내부에서 발생하지만, 익스포터는 diagnostics와 익스포터 플러그인이 둘 다 활성화된 경우에만 연결됩니다.

### OpenTelemetry와 OTLP의 차이

- **OpenTelemetry(OTel)**: 트레이스, 메트릭, 로그를 위한 데이터 모델 + SDK
- **OTLP**: OTel 데이터를 collector/backend로 내보낼 때 사용하는 wire protocol
- OpenClaw는 현재 **OTLP/HTTP (protobuf)**로 내보냅니다.

### 내보내는 시그널

- **Metrics**: counter + histogram(토큰 사용량, 메시지 흐름, 큐잉)
- **Traces**: 모델 사용 + webhook/message 처리용 span
- **Logs**: `diagnostics.otel.logs`가 활성화된 경우 OTLP로 내보냄. 로그 양이 많을 수 있으니 `logging.level`과 익스포터 필터를 함께 고려하세요.

### 진단 이벤트 카탈로그

모델 사용:

- `model.usage`: 토큰, 비용, 소요 시간, 컨텍스트, provider/model/channel, session id

메시지 흐름:

- `webhook.received`: 채널별 webhook 유입
- `webhook.processed`: webhook 처리 완료 + 소요 시간
- `webhook.error`: webhook 핸들러 오류
- `message.queued`: 처리 대기열에 들어간 메시지
- `message.processed`: 결과 + 소요 시간 + 선택적 오류

큐 + 세션:

- `queue.lane.enqueue`: 명령 큐 레인 enqueue + depth
- `queue.lane.dequeue`: 명령 큐 레인 dequeue + 대기 시간
- `session.state`: 세션 상태 전이 + 이유
- `session.stuck`: 세션 정체 경고 + 경과 시간
- `run.attempt`: 실행 재시도/시도 메타데이터
- `diagnostic.heartbeat`: 집계 카운터(webhooks/queue/session)

### 진단 활성화 익스포터 없음

플러그인이나 커스텀 sink에서 진단 이벤트를 사용하려면 다음을 설정하세요.

```json
{
  "diagnostics": {
    "enabled": true
  }
}
```

### 진단 플래그 대상 로그

`logging.level`을 올리지 않고도 추가적인 표적 디버그 로그를 활성화하려면 플래그를 사용하세요.
플래그는 대소문자를 구분하지 않으며 와일드카드(예: `telegram.*`, `*`)를 지원합니다.

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

환경 변수로 일회성 재정의:

```
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

참고:

- 플래그 로그는 표준 로그 파일(`logging.file`과 동일)로 기록됩니다.
- 출력은 여전히 `logging.redactSensitive`에 따라 마스킹됩니다.
- 전체 가이드는 [/diagnostics/flags](/diagnostics/flags)를 참고하세요.

### OpenTelemetry로 내보내기

진단은 `diagnostics-otel` 플러그인(OTLP/HTTP)을 통해 내보낼 수 있습니다. OTLP/HTTP를 받는 모든 OpenTelemetry collector/backend에서 동작합니다.

```json
{
  "plugins": {
    "allow": ["diagnostics-otel"],
    "entries": {
      "diagnostics-otel": {
        "enabled": true
      }
    }
  },
  "diagnostics": {
    "enabled": true,
    "otel": {
      "enabled": true,
      "endpoint": "http://otel-collector:4318",
      "protocol": "http/protobuf",
      "serviceName": "openclaw-gateway",
      "traces": true,
      "metrics": true,
      "logs": true,
      "sampleRate": 0.2,
      "flushIntervalMs": 60000
    }
  }
}
```

참고:

- `openclaw plugins enable diagnostics-otel`로도 플러그인을 활성화할 수 있습니다.
- `protocol`은 현재 `http/protobuf`만 지원합니다. `grpc`는 무시됩니다.
- 메트릭에는 토큰 사용량, 비용, 컨텍스트 크기, 실행 시간, 그리고 메시지 흐름 counter/histogram(webhooks, queueing, session state, queue depth/wait)이 포함됩니다.
- `traces` / `metrics`로 trace/metric을 토글할 수 있으며(기본값: 활성화), 활성화되면 모델 사용 span과 webhook/message 처리 span이 포함됩니다.
- collector에서 인증이 필요하면 `headers`를 설정하세요.
- 지원하는 환경 변수: `OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_SERVICE_NAME`, `OTEL_EXPORTER_OTLP_PROTOCOL`

### 내보내는 메트릭 이름 + 타입

모델 사용:

- `openclaw.tokens` (counter, attrs: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.cost.usd` (counter, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogram, attrs: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)

메시지 흐름:

- `openclaw.webhook.received` (counter, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.error` (counter, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.message.queued` (counter, attrs: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.processed` (counter, attrs: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.outcome`)

큐 + 세션:

- `openclaw.queue.lane.enqueue` (counter, attrs: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (counter, attrs: `openclaw.lane`)
- `openclaw.queue.depth` (histogram, attrs: `openclaw.lane` 또는 `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histogram, attrs: `openclaw.lane`)
- `openclaw.session.state` (counter, attrs: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (counter, attrs: `openclaw.state`)
- `openclaw.session.stuck_age_ms` (histogram, attrs: `openclaw.state`)
- `openclaw.run.attempt` (counter, attrs: `openclaw.attempt`)

### 내보내는 span 이름 + 주요 속성

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.sessionKey`, `openclaw.sessionId`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
- `openclaw.webhook.processed`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`
- `openclaw.webhook.error`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`, `openclaw.error`
- `openclaw.message.processed`
  - `openclaw.channel`, `openclaw.outcome`, `openclaw.chatId`, `openclaw.messageId`, `openclaw.sessionKey`, `openclaw.sessionId`, `openclaw.reason`
- `openclaw.session.stuck`
  - `openclaw.state`, `openclaw.ageMs`, `openclaw.queueDepth`, `openclaw.sessionKey`, `openclaw.sessionId`

### 샘플링 + 플러시

- Trace 샘플링: `diagnostics.otel.sampleRate` (0.0–1.0, 루트 span만)
- 메트릭 내보내기 간격: `diagnostics.otel.flushIntervalMs` (최소 1000ms)

### 프로토콜 참고

- OTLP/HTTP endpoint는 `diagnostics.otel.endpoint` 또는 `OTEL_EXPORTER_OTLP_ENDPOINT`로 설정할 수 있습니다.
- endpoint에 이미 `/v1/traces` 또는 `/v1/metrics`가 포함돼 있으면 그대로 사용합니다.
- endpoint에 이미 `/v1/logs`가 포함돼 있으면 로그용으로 그대로 사용합니다.
- `diagnostics.otel.logs`는 기본 로거 출력을 OTLP 로그로 내보내도록 활성화합니다.

### 로그 내보내기 동작

- OTLP 로그는 `logging.file`에 기록되는 것과 같은 구조화 레코드를 사용합니다.
- `logging.level`(파일 로그 레벨)을 따릅니다. 콘솔 리다크션은 OTLP 로그에 **적용되지 않습니다**.
- 대량 트래픽 환경에서는 OTLP collector 측 샘플링/필터링을 선호하세요.

## 문제 해결 팁

- **Gateway에 연결할 수 없나요?** 먼저 `openclaw doctor`를 실행하세요.
- **로그가 비어 있나요?** Gateway가 실행 중이고 `logging.file` 경로에 실제로 기록 중인지 확인하세요.
- **더 자세한 정보가 필요하나요?** `logging.level`을 `debug` 또는 `trace`로 올리고 다시 시도하세요.
