---
summary: "watch 모드, raw 모델 스트림, 추론 누출 추적을 위한 디버깅 도구"
read_when:
  - 추론 누출 여부를 확인하기 위해 raw 모델 출력을 직접 봐야 할 때
  - 반복 작업 중 Gateway를 watch 모드로 실행하고 싶을 때
  - 재현 가능한 디버깅 워크플로가 필요할 때
title: "디버깅"
x-i18n:
  source_path: "help/debugging.md"
---

# 디버깅

이 페이지는 스트리밍 출력용 디버깅 보조 기능을 다룹니다. 특히 provider가 reasoning을 일반 텍스트와 섞어 보낼 때 유용합니다.

## 런타임 디버그 오버라이드

채팅에서 `/debug`를 사용하면 **런타임 전용** config 오버라이드만 설정할 수 있습니다. 메모리에만 적용되고 디스크에는 쓰지 않습니다.
`/debug`는 기본적으로 비활성화되어 있으며, `commands.debug: true`로 켜야 합니다.
`openclaw.json`을 직접 수정하지 않고도 드문 설정을 잠깐 토글해야 할 때 유용합니다.

예시:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset`은 모든 오버라이드를 지우고 디스크에 저장된 config 상태로 되돌립니다.

## Gateway watch 모드

빠르게 반복 작업하려면 파일 watcher 아래에서 gateway를 실행하세요.

```bash
pnpm gateway:watch
```

이는 다음 명령에 매핑됩니다.

```bash
node --watch-path src --watch-path tsconfig.json --watch-path package.json --watch-preserve-output scripts/run-node.mjs gateway --force
```

`gateway:watch` 뒤에 gateway CLI 플래그를 더 붙이면 매번 재시작할 때 그대로 전달됩니다.

## Dev profile + dev gateway (`--dev`)

dev profile을 사용하면 상태를 분리하고, 디버깅용으로 안전하게 버릴 수 있는 구성을 빠르게 만들 수 있습니다.
`--dev` 플래그는 **두 종류**가 있습니다.

* **전역 `--dev`(profile)**: 상태를 `~/.openclaw-dev` 아래로 분리하고 gateway 포트를 기본적으로 `19001`로 설정합니다. 파생 포트도 함께 이동합니다.
* **`gateway --dev`**: Gateway가 config와 workspace가 없을 때 기본값으로 자동 생성하도록 합니다. `BOOTSTRAP.md`도 건너뜁니다.

권장 흐름(dev profile + dev bootstrap):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

전역 설치가 아직 없다면 `pnpm openclaw ...` 형태로 CLI를 실행하세요.

이 흐름이 하는 일:

1. **Profile 격리**(전역 `--dev`)
   * `OPENCLAW_PROFILE=dev`
   * `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   * `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   * `OPENCLAW_GATEWAY_PORT=19001`(browser/canvas 포트도 함께 이동)

2. **Dev bootstrap**(`gateway --dev`)
   * config가 없으면 최소 config를 씁니다. `gateway.mode=local`, bind는 loopback입니다.
   * `agent.workspace`를 dev workspace로 설정합니다.
   * `agent.skipBootstrap=true`를 설정합니다. `BOOTSTRAP.md`를 읽지 않습니다.
   * workspace 파일이 없으면 기본 파일을 생성합니다.
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`
   * 기본 identity는 **C3‑PO**(protocol droid)입니다.
   * dev 모드에서는 채널 provider를 건너뜁니다. `OPENCLAW_SKIP_CHANNELS=1`

리셋 흐름(완전 초기화):

```bash
pnpm gateway:dev:reset
```

주의: `--dev`는 **전역** profile 플래그라 일부 runner가 먹어버릴 수 있습니다.
직접 명시해야 한다면 환경 변수 형태를 사용하세요.

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

`--reset`은 config, credentials, sessions, dev workspace를 모두 지운 뒤(`rm`이 아니라 `trash` 사용), 기본 dev 구성을 다시 만듭니다.

팁: dev가 아닌 gateway가 이미 실행 중이면 먼저 중지하세요. 예: `launchd` 또는 `systemd`

```bash
openclaw gateway stop
```

## Raw 스트림 로깅(OpenClaw)

OpenClaw는 필터링이나 포맷팅 전에 **raw assistant stream**을 기록할 수 있습니다.
reasoning이 일반 텍스트 delta로 들어오는지, 아니면 별도의 thinking block으로 들어오는지 확인하는 가장 좋은 방법입니다.

CLI로 활성화:

```bash
pnpm gateway:watch --raw-stream
```

선택적 경로 재정의:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

동등한 환경 변수:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

기본 파일:

`~/.openclaw/logs/raw-stream.jsonl`

## Raw chunk 로깅(pi-mono)

block으로 파싱되기 전에 **raw OpenAI-compatible chunk**를 캡처하려면 pi-mono가 별도 로거를 제공합니다.

```bash
PI_RAW_STREAM=1
```

선택적 경로:

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

기본 파일:

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> 참고: 이 로그는 pi-mono의 `openai-completions` provider를 사용하는 프로세스에서만 기록됩니다.

## 안전 주의사항

* raw 스트림 로그에는 전체 프롬프트, 도구 출력, 사용자 데이터가 포함될 수 있습니다.
* 로그는 로컬에만 보관하고 디버깅이 끝나면 삭제하세요.
* 로그를 공유해야 한다면 먼저 비밀값과 PII를 제거하세요.
