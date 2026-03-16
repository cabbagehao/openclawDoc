---
summary: "로깅 인터페이스, 파일 로그 관리, WebSocket 로그 스타일 및 콘솔 포맷 가이드"
description: "file logs, console verbosity, WS log styles, redaction, subsystem formatting을 포함한 OpenClaw 로깅 표면을 설명합니다."
read_when:
  - "로깅 출력 방식이나 포맷을 변경할 때"
  - "CLI 또는 Gateway 출력을 디버깅할 때"
title: "로깅"
x-i18n:
  source_path: "gateway/logging.md"
---

# 로깅

사용자 관점의 개요(CLI + Control UI + config)는 [/logging](/logging)을 참고하세요.

OpenClaw에는 두 가지 log surface가 있습니다.

- **Console output**: 터미널 또는 Debug UI에 보이는 출력
- **File logs**: gateway logger가 기록하는 JSON lines

## File-based logger

- 기본 rolling log file은 `/tmp/openclaw/` 아래에 있으며 하루에 하나의 파일을 씁니다: `openclaw-YYYY-MM-DD.log`
  - 날짜는 gateway host의 local timezone을 사용합니다.
- log file path와 level은 `~/.openclaw/openclaw.json`의 다음 필드로 설정할 수 있습니다.
  - `logging.file`
  - `logging.level`

file format은 한 줄당 하나의 JSON object입니다.

Control UI의 Logs 탭은 gateway를 통해 이 파일을 tail합니다 (`logs.tail`).
CLI도 동일하게 사용할 수 있습니다.

```bash
openclaw logs --follow
```

**Verbose vs. log levels**

- **File logs**는 `logging.level`로만 제어됩니다.
- `--verbose`는 **console verbosity**와 WS log style에만 영향을 주며, file log level은 올리지 않습니다.
- file logs에 verbose-only details를 남기려면 `logging.level`을 `debug` 또는 `trace`로 설정하세요.

## Console capture

CLI는 `console.log/info/warn/error/debug/trace`를 capture해 file logs에 기록하면서 stdout/stderr에도 출력합니다.

console verbosity는 다음 설정으로 독립적으로 조정할 수 있습니다.

- `logging.consoleLevel` (기본값 `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Tool summary redaction

verbose tool summaries(예: `🛠️ Exec: ...`)는 console stream에 쓰이기 전에 민감한 tokens를 가릴 수 있습니다. 이 기능은 **tools-only**이며 file logs는 바꾸지 않습니다.

- `logging.redactSensitive`: `off` | `tools` (기본값 `tools`)
- `logging.redactPatterns`: regex string 배열 (기본 패턴 override)
  - raw regex strings는 자동으로 `gi`를 사용하고, custom flags가 필요하면 `/pattern/flags`도 지원합니다.
  - 매칭 길이가 18자 이상이면 앞 6자 + 뒤 4자만 남기고, 아니면 `***`로 마스킹합니다.
  - 기본 패턴은 일반적인 key assignments, CLI flags, JSON fields, bearer headers, PEM blocks, token prefixes를 포함합니다.

## Gateway WebSocket logs

gateway는 WebSocket protocol logs를 두 가지 모드로 출력합니다.

- **Normal mode** (`--verbose` 없음): “interesting” RPC results만 출력
  - errors (`ok=false`)
  - slow calls (기본 threshold `>= 50ms`)
  - parse errors
- **Verbose mode** (`--verbose`): 모든 WS request/response traffic 출력

### WS log style

`openclaw gateway`는 per-gateway style switch를 지원합니다.

- `--ws-log auto` (기본값): normal mode는 최적화, verbose mode는 compact output
- `--ws-log compact`: verbose일 때 paired request/response output
- `--ws-log full`: verbose일 때 per-frame full output
- `--compact`: `--ws-log compact` 별칭

Examples:

```bash
# optimized (only errors/slow)
openclaw gateway

# show all WS traffic (paired)
openclaw gateway --verbose --ws-log compact

# show all WS traffic (full meta)
openclaw gateway --verbose --ws-log full
```

## Console formatting (subsystem logging)

console formatter는 **TTY-aware**이며 일관된 prefix가 붙은 출력으로 subsystem logs를 보기 쉽게 만듭니다.

- **Subsystem prefixes** on every line (예: `[gateway]`, `[canvas]`, `[tailscale]`)
- **Subsystem colors** + level coloring
- **Color when output is a TTY** or rich terminal environment (`TERM`/`COLORTERM`/`TERM_PROGRAM`), `NO_COLOR` 준수
- **Shortened subsystem prefixes**: `gateway/` + `channels/`를 제거하고 마지막 두 segment 유지 (예: `whatsapp/outbound`)
- **Sub-loggers by subsystem** (auto prefix + structured field `{ subsystem }`)
- **`logRaw()`** for QR/UX output (no prefix, no formatting)
- **Console styles** (`pretty | compact | json`)
- **Console log level**은 file log level과 분리됨
- **WhatsApp message bodies**는 `debug`로 기록되며 `--verbose`일 때만 console에 표시됨

이렇게 하면 file logs의 안정성은 유지하면서 interactive output은 더 빠르게 훑어볼 수 있습니다.
