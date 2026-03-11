---
summary: "로깅 인터페이스, 파일 로그 관리, WebSocket 로그 스타일 및 콘솔 포맷 가이드"
read_when:
  - 로깅 출력 방식이나 포맷을 변경하고자 할 때
  - CLI 또는 Gateway의 실행 로그를 분석하고 디버깅할 때
title: "로깅 (Logging)"
x-i18n:
  source_path: "gateway/logging.md"
---

# 로깅 (Logging)

사용자 관점의 로깅 개요(CLI, Control UI 및 설정 방법)는 [로깅 일반 가이드](/logging)를 참조함.

OpenClaw는 두 가지 로깅 인터페이스(Surface)를 제공함:

- **콘솔 출력 (Console output)**: 터미널 또는 디버그 UI에 실시간으로 표시되는 메시지.
- **파일 로그 (File logs)**: Gateway 로거가 기록하는 구조화된 JSON 라인 데이터.

## 파일 기반 로거 (File-based logger)

- **로그 파일 생성**: `/tmp/openclaw/` 경로 하위에 날짜별로 롤링(Rolling)되는 로그 파일(`openclaw-YYYY-MM-DD.log`)이 생성됨. 날짜 기준은 Gateway 호스트의 로컬 타임존을 따름.
- **상세 설정**: `~/.openclaw/openclaw.json` 파일 내 `logging.file` 및 `logging.level` 필드를 통해 경로와 로깅 레벨을 조정할 수 있음.
- **데이터 형식**: 한 줄당 하나의 JSON 객체로 기록됨.
- **로그 추적**: Control UI의 **Logs** 탭에서 실시간으로 확인할 수 있으며, CLI에서도 동일하게 추적 가능함:

```bash
openclaw logs --follow
```

**상세 출력(Verbose)과 로깅 레벨의 차이:**
- **파일 로그**는 오직 `logging.level` 설정값에 의해서만 제어됨.
- **`--verbose` 플래그**는 **콘솔의 출력 상세도**(및 WebSocket 로그 스타일)에만 영향을 주며, 파일 로그의 레벨을 강제로 높이지 않음.
- 파일 로그에 상세한 디버깅 정보를 남기려면 `logging.level`을 `debug` 또는 `trace`로 직접 설정해야 함.

## 콘솔 캡처 (Console capture)

CLI는 `console.log/info/warn/error/debug/trace` 호출을 가로채어 파일 로그에 기록함과 동시에 표준 출력(stdout) 및 표준 에러(stderr)로 내보냄.

콘솔 출력 방식은 다음 설정을 통해 독립적으로 조정 가능함:
- `logging.consoleLevel`: 콘솔 출력 레벨 (기본값 `info`).
- `logging.consoleStyle`: 출력 스타일 (`pretty` | `compact` | `json`).

## 도구 실행 요약 마스킹 (Redaction)

상세 출력 모드에서 도구 실행 요약(예: `🛠️ Exec: ...`)이 콘솔에 표시될 때, 민감한 토큰 정보가 유출되지 않도록 자동으로 가림 처리를 수행함. 이 기능은 **콘솔 출력물에만 적용**되며 실제 파일 로그에는 원본 데이터가 기록됨.

- `logging.redactSensitive`: `off` | `tools` (기본값 `tools`).
- `logging.redactPatterns`: 마스킹에 사용할 정규표현식 배열.
  - 일반 정규표현식(자동으로 `gi` 플래그 적용) 또는 커스텀 플래그가 포함된 `/pattern/flags` 형식을 지원함.
  - 매칭된 텍스트가 18자 이상인 경우 앞 6자 + 뒤 4자만 남기고 나머지는 마스킹하며, 그 미만인 경우 `***`로 전체 마스킹함.
  - 기본 패턴은 일반적인 키 할당문, CLI 플래그, JSON 필드, Bearer 헤더, PEM 블록 및 주요 토큰 접두사를 포함함.

## Gateway WebSocket 로그

Gateway는 WebSocket 프로토콜 로그를 다음 두 가지 모드로 제공함:

- **일반 모드 (`--verbose` 미사용)**: 주요 RPC 결과물(오류, 50ms 이상의 지연 호출, 파싱 오류 등)만 출력함.
- **상세 모드 (`--verbose` 사용)**: 모든 WebSocket 요청 및 응답 트래픽을 출력함.

### WebSocket 로그 스타일 (`--ws-log`)

Gateway별로 출력 스타일을 전환할 수 있음:

- `auto` (기본값): 일반 모드는 최적화된 요약본을, 상세 모드는 압축된(Compact) 형식을 사용함.
- `compact`: 상세 모드 실행 시 요청과 응답을 한 쌍으로 묶어 압축된 형태로 출력함.
- `full`: 상세 모드 실행 시 각 프레임의 전체 메타데이터를 출력함.
- `--compact`: `--ws-log compact`의 축약 플래그.

**실행 예시:**

```bash
# 최적화 모드 (오류 및 지연 호출만 표시)
openclaw gateway

# 모든 트래픽을 한 쌍으로 묶어 표시
openclaw gateway --verbose --ws-log compact

# 모든 트래픽의 전체 메타데이터 표시
openclaw gateway --verbose --ws-log full
```

## 콘솔 포맷팅 (서브시스템 로깅)

콘솔 포맷터는 **TTY 상태를 인지**하여 일관된 접두사(Prefix)가 붙은 가독성 높은 출력을 제공함. 서브시스템별로 로그를 그룹화하여 빠르게 훑어볼 수 있도록 설계됨.

**주요 특징:**
- **접두사 자동 부여**: 모든 출력 라인에 `[gateway]`, `[canvas]`, `[tailscale]` 등 서브시스템 이름이 붙음.
- **서브시스템 색상화**: 서브시스템별 고유 색상 및 로그 레벨별 색상을 적용함.
- **터미널 감지**: TTY 환경이나 풍부한 색상을 지원하는 터미널(`TERM`, `COLORTERM` 등)을 감지하여 색상을 적용하며, `NO_COLOR` 설정을 준수함.
- **접두사 간소화**: `gateway/`, `channels/` 등 공통 경로는 생략하고 마지막 두 세그먼트만 유지함 (예: `whatsapp/outbound`).
- **구조화된 로깅**: 서브시스템별 하부 로거(Sub-logger)가 구조화된 필드(`{ subsystem }`)를 포함하여 기록함.
- **`logRaw()` 지원**: QR 코드나 특수한 UI 출력 등 접두사나 포맷팅이 필요 없는 경우에 사용함.
- **별도의 레벨 관리**: 콘솔 출력 레벨은 파일 로깅 레벨과 독립적으로 작동함.
- **상세 디버깅**: WhatsApp 메시지 본문 등은 `debug` 레벨로 기록되며, `--verbose` 실행 시에만 콘솔에 표시됨.

이러한 로깅 시스템을 통해 기존 파일 로그의 안정성을 유지하면서도, 터미널을 통한 상호작용 시에는 정보를 한눈에 파악하기 쉽게 제공함.
