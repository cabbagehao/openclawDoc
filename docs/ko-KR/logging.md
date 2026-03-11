---
summary: "로깅 시스템 개요: 파일 로그, 콘솔 출력, CLI 실시간 확인(Tail), Control UI 안내"
read_when:
  - 로깅 시스템에 대한 전반적인 이해가 필요할 때
  - 로그 레벨 또는 포맷을 설정하고자 할 때
  - 시스템 문제 해결을 위해 로그를 확인해야 할 때
title: "로깅 및 모니터링"
x-i18n:
  source_path: "logging.md"
---

# 로깅 및 모니터링

OpenClaw는 크게 두 가지 방식으로 로그를 기록하고 관리함.

- Gateway가 생성하는 **파일 로그**(JSONL 형식)
- 터미널 및 Control UI에 표시되는 **콘솔 출력**

이 페이지에서는 로그 저장 위치, 확인 방법, 로그 레벨 및 포맷 설정 방법을 설명함.

## 로그 파일 위치

기본적으로 Gateway는 다음 경로에 날짜별로 순환(Rolling)되는 로그 파일을 생성함.

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

파일명의 날짜는 Gateway 호스트의 로컬 시간대를 따름.

`~/.openclaw/openclaw.json` 파일에서 로그 경로를 변경할 수 있음.

```json
{
  "logging": {
    "file": "/custom/path/to/openclaw.log"
  }
}
```

## 로그 확인 방법

### CLI: 실시간 스트리밍(Tail) 권장

CLI의 RPC 기능을 통해 Gateway 로그를 실시간으로 확인할 수 있음.

```bash
openclaw logs --follow
```

**출력 모드 옵션:**

- **TTY 세션**: 가독성을 높인 구조화된 로그와 색상 적용.
- **Non-TTY 세션**: 일반 텍스트 형식으로 출력.
- `--json`: 한 줄당 하나의 JSON 객체로 출력(로그 분석 도구용).
- `--plain`: TTY 환경에서도 스타일 없는 일반 텍스트 출력 강제.
- `--no-color`: ANSI 색상 코드 비활성화.

JSON 모드 출력 시, 각 객체는 다음과 같은 `type` 태그를 포함함.

- `meta`: 스트림 메타데이터 (파일명, 커서 위치, 크기 등).
- `log`: 파싱된 개별 로그 항목.
- `notice`: 로그 잘림 또는 로테이션 관련 안내.
- `raw`: 파싱되지 않은 원시 로그 라인.

Gateway 연결에 실패할 경우, CLI는 `openclaw doctor` 명령어를 통한 진단을 제안함.

### Control UI (웹 인터페이스)

Control UI의 **Logs** 탭은 `logs.tail` 메서드를 사용하여 동일한 로그 파일을 스트리밍함. 상세 내용은 [/web/control-ui](/web/control-ui) 참조.

### 채널별 전용 로그

특정 채팅 채널(WhatsApp, Telegram 등)의 활동만 필터링하려면 다음 명령어를 사용함.

```bash
openclaw channels logs --channel whatsapp
```

## 로그 포맷 상세

### 파일 로그 (JSONL)

로그 파일의 각 라인은 독립적인 JSON 객체임. CLI 및 Control UI는 이 객체를 분석하여 시간, 레벨, 서브시스템, 메시지 등을 구조화하여 표시함.

### 콘솔 출력

콘솔 로그는 사용자의 터미널 환경(TTY)을 인식하여 최적화된 형태로 출력됨.

- 서브시스템 접두사 표시 (예: `gateway/channels/whatsapp`)
- 레벨에 따른 색상 구분 (Info: 녹색, Warn: 황색, Error: 적색)
- 설정에 따라 Compact 모드 또는 JSON 모드 선택 가능.

콘솔 출력 스타일은 `logging.consoleStyle` 옵션으로 제어함.

## 로깅 설정 상세

모든 로깅 관련 설정은 `~/.openclaw/openclaw.json`의 `logging` 섹션에서 관리함.

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

### 로그 레벨 설정

- `logging.level`: **파일 로그**(JSONL)에 기록될 최소 로그 레벨.
- `logging.consoleLevel`: **콘솔**에 출력될 로그의 상세 수준.

**`OPENCLAW_LOG_LEVEL`** 환경 변수를 사용하여 두 설정을 동시에 덮어쓸 수 있음(예: `debug`). 환경 변수는 설정 파일보다 우선순위가 높으며, 특정 실행 시에만 상세 로그를 확인하고 싶을 때 유용함. 또한, 전역 CLI 옵션인 **`--log-level <level>`**은 환경 변수보다도 우선함.

참고: `--verbose` 플래그는 콘솔 출력의 상세도에만 영향을 주며, 파일 로그 레벨은 변경하지 않음.

### 콘솔 스타일 (`consoleStyle`)

- `pretty`: 타임스탬프와 색상이 포함된 가독성 중심 스타일.
- `compact`: 더 많은 정보를 한눈에 볼 수 있는 간결한 스타일.
- `json`: 로그 수집 시스템 연동을 위한 라인별 JSON 스타일.

### 민감 정보 마스킹 (Redaction)

보안을 위해 콘솔 출력 시 API 토큰 등 민감한 정보를 자동으로 마스킹할 수 있음.

- `logging.redactSensitive`: `off` | `tools` (기본값: `tools`).
- `logging.redactPatterns`: 기본 패턴 외에 추가로 가릴 정규표현식 목록.

마스킹 처리는 **콘솔 출력에만** 적용되며, 사후 분석을 위해 파일 로그에는 원본 데이터가 기록됨.

## 진단 및 OpenTelemetry 연동

진단(Diagnostics)은 모델 실행 및 메시지 흐름(웹훅, 큐잉, 세션 상태)을 추적하기 위한 구조화된 이벤트 시스템임. 이는 일반 로그를 보완하며 메트릭(Metrics), 트레이스(Traces) 수집 도구로 데이터를 전달하는 역할을 함.

### OpenTelemetry (OTel) 및 OTLP

OpenClaw는 현재 **OTLP/HTTP (Protobuf)** 프로토콜을 사용하여 데이터를 내보냄(Export).

### 주요 수집 시그널

- **Metrics**: 토큰 사용량, 메시지 처리량, 큐 대기 시간 등 수치 데이터.
- **Traces**: 모델 호출 및 웹훅/메시지 처리 과정의 스팬(Span) 정보.
- **Logs**: `diagnostics.otel.logs` 활성화 시 OTLP를 통해 로그 전송.

### 진단 이벤트 유형

1. **모델 사용량**: 토큰 수, 비용, 소요 시간, 사용 모델/채널 정보.
2. **메시지 흐름**: 웹훅 수신/처리 결과, 메시지 큐 적재 및 처리 성공 여부.
3. **큐 및 세션**: 대기열 상태, 세션 상태 전이 정보, 세션 정체(Stuck) 경고.

### 진단 기능 활성화

외부 도구 연동 없이 내부적으로 진단 이벤트를 발생시키려면 다음 설정을 사용함.

```json
{
  "diagnostics": {
    "enabled": true
  }
}
```

### 진단 플래그 (Targeted Debugging)

로그 레벨을 전체적으로 올리지 않고 특정 서브시스템의 디버그 로그만 활성화하고 싶을 때 사용함. 대소문자를 구분하지 않으며 와일드카드(`*`) 지원함.

```json
{
  "diagnostics": {
    "flags": ["telegram.http", "whatsapp.*"]
  }
}
```

상세 가이드는 [/diagnostics/flags](/diagnostics/flags) 참조.

### OpenTelemetry 내보내기 설정

`diagnostics-otel` 플러그인을 사용하여 OTLP 호환 백엔드로 데이터를 전송함.

```json
{
  "plugins": {
    "allow": ["diagnostics-otel"],
    "entries": {
      "diagnostics-otel": { "enabled": true }
    }
  },
  "diagnostics": {
    "enabled": true,
    "otel": {
      "enabled": true,
      "endpoint": "http://otel-collector:4318",
      "serviceName": "openclaw-gateway",
      "traces": true,
      "metrics": true,
      "logs": true
    }
  }
}
```

## 문제 해결 팁

- **Gateway 연결 불가**: 가장 먼저 `openclaw doctor` 명령어를 실행하여 상태를 점검함.
- **로그 기록 없음**: Gateway 프로세스가 실행 중인지, `logging.file` 경로에 쓰기 권한이 있는지 확인함.
- **상세 분석 필요**: `logging.level`을 `debug` 또는 `trace`로 설정하여 더 많은 정보를 수집함.
