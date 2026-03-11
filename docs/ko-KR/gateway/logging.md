---
summary: "로깅 표면, 파일 로그, WS 로그 스타일, 콘솔 포맷"
read_when:
  - 로깅 출력이나 포맷을 바꿀 때
  - CLI 또는 gateway 출력을 디버깅할 때
title: "로깅"
---

# 로깅

사용자 관점 개요(CLI + Control UI + config)는 [/logging](/logging) 을 참고하세요.

OpenClaw에는 두 가지 로그 "표면"이 있습니다.

- **콘솔 출력** (터미널 / Debug UI에서 보는 것)
- gateway logger가 기록하는 **파일 로그** (JSON lines)

## 파일 기반 logger

- 기본 rolling log 파일은 `/tmp/openclaw/` 아래에 있으며 하루에 파일 하나씩 생성됩니다: `openclaw-YYYY-MM-DD.log`
  - 날짜는 gateway 호스트의 로컬 시간대를 사용합니다.
- 로그 파일 경로와 레벨은 `~/.openclaw/openclaw.json` 에서 설정할 수 있습니다.
  - `logging.file`
  - `logging.level`

파일 포맷은 한 줄당 JSON 객체 하나입니다.

Control UI의 Logs 탭은 gateway를 통해 이 파일을 tail 합니다(`logs.tail`).
CLI도 같은 작업을 할 수 있습니다.

```bash
openclaw logs --follow
```

**Verbose와 로그 레벨의 차이**

- **파일 로그** 는 오직 `logging.level` 로만 제어됩니다.
- `--verbose` 는 **콘솔 verbosity**(및 WS 로그 스타일)에만 영향을 주며, 파일 로그 레벨을 올리지는 않습니다.
- verbose 전용 세부 정보를 파일 로그에 남기려면 `logging.level` 을 `debug` 또는 `trace` 로 설정하세요.

## 콘솔 캡처

CLI는 `console.log/info/warn/error/debug/trace` 를 캡처해 파일 로그에 기록하면서도 stdout/stderr 출력은 유지합니다.

콘솔 verbosity는 다음으로 별도로 조정할 수 있습니다.

- `logging.consoleLevel` (기본값 `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## 도구 요약 마스킹

verbose tool summary(예: `🛠️ Exec: ...`)는 콘솔 스트림에 찍히기 전에 민감한 토큰을 가릴 수 있습니다. 이것은 **tools 전용**이며 파일 로그는 변경하지 않습니다.

- `logging.redactSensitive`: `off` | `tools` (기본값: `tools`)
- `logging.redactPatterns`: regex 문자열 배열(기본 패턴 override)
  - raw regex 문자열(auto `gi`)을 쓰거나, 커스텀 flag가 필요하면 `/pattern/flags` 사용
  - 매치된 값은 앞 6자 + 뒤 4자만 남기고 마스킹함(길이 18 이상), 그 외에는 `***`
  - 기본값은 일반적인 key assignment, CLI flag, JSON field, bearer header, PEM block, 주요 token prefix를 포함

## Gateway WebSocket 로그

gateway는 WebSocket 프로토콜 로그를 두 가지 모드로 출력합니다.

- **일반 모드 (`--verbose` 없음)**: "흥미로운" RPC 결과만 출력
  - 오류 (`ok=false`)
  - 느린 호출(기본 임계값: `>= 50ms`)
  - parse error
- **Verbose 모드 (`--verbose`)**: 모든 WS request/response 트래픽 출력

### WS 로그 스타일

`openclaw gateway` 는 gateway별 스타일 전환을 지원합니다.

- `--ws-log auto` (기본값): 일반 모드는 최적화, verbose 모드는 compact 출력
- `--ws-log compact`: verbose일 때 compact 출력(요청/응답 페어)
- `--ws-log full`: verbose일 때 프레임별 전체 출력
- `--compact`: `--ws-log compact` 의 별칭

예시:

```bash
# optimized (only errors/slow)
openclaw gateway

# show all WS traffic (paired)
openclaw gateway --verbose --ws-log compact

# show all WS traffic (full meta)
openclaw gateway --verbose --ws-log full
```

## 콘솔 포맷(서브시스템 로깅)

콘솔 formatter는 **TTY 인지**를 감지하고 일관된 prefix를 붙여 출력합니다.
서브시스템 logger는 출력이 묶여 보이고 훑어보기 쉽게 유지합니다.

동작:

- 모든 줄에 **서브시스템 prefix** 부여(예: `[gateway]`, `[canvas]`, `[tailscale]`)
- **서브시스템 색상**(서브시스템별 고정) + 레벨 색상
- 출력이 TTY이거나 환경이 풍부한 터미널처럼 보일 때 색상 사용 (`TERM`/`COLORTERM`/`TERM_PROGRAM`), `NO_COLOR` 존중
- **짧아진 서브시스템 prefix**: 앞의 `gateway/`, `channels/` 제거 후 마지막 2개 세그먼트 유지(예: `whatsapp/outbound`)
- **서브시스템별 sub-logger** 지원(auto prefix + 구조화 필드 `{ subsystem }`)
- **`logRaw()`** 는 QR/UX 출력용(접두사/포맷 없음)
- **콘솔 스타일** 지원(예: `pretty | compact | json`)
- **콘솔 로그 레벨** 은 파일 로그 레벨과 별개(파일 로그는 `logging.level` 이 `debug`/`trace` 이면 상세 정보 유지)
- **WhatsApp 메시지 본문** 은 `debug` 에 기록됨(`--verbose` 로 확인 가능)

이 방식은 기존 파일 로그의 안정성을 유지하면서 interactive 출력은 더 읽기 쉽게 만듭니다.
