---
title: "Pi 개발 워크플로우"
summary: "Pi integration 개발 워크플로우: build, test, live validation"
read_when:
  - Pi integration 코드나 테스트를 작업할 때
  - Pi 전용 lint, typecheck, live test 흐름을 실행할 때
description: "OpenClaw의 Pi integration을 개발할 때 필요한 build, test, manual validation, state reset 절차를 정리한 가이드입니다."
x-i18n:
  source_path: "pi-dev.md"
---

# Pi 개발 워크플로우

이 가이드는 OpenClaw에서 pi integration 작업을 할 때 무난하게 따라갈 수 있는
워크플로우를 요약합니다.

## 타입 체크와 lint

- 타입 체크와 build: `pnpm build`
- Lint: `pnpm lint`
- Format check: `pnpm format`
- push 전 전체 gate: `pnpm lint && pnpm build && pnpm test`

## Pi 테스트 실행

Pi 중심 테스트 세트는 Vitest로 직접 실행할 수 있습니다.

```bash
pnpm test -- \
  "src/agents/pi-*.test.ts" \
  "src/agents/pi-embedded-*.test.ts" \
  "src/agents/pi-tools*.test.ts" \
  "src/agents/pi-settings.test.ts" \
  "src/agents/pi-tool-definition-adapter*.test.ts" \
  "src/agents/pi-extensions/**/*.test.ts"
```

live provider exercise까지 포함하려면 다음을 실행합니다.

```bash
OPENCLAW_LIVE_TEST=1 pnpm test -- src/agents/pi-embedded-runner-extraparams.live.test.ts
```

이 명령은 주요 Pi unit suite를 다룹니다.

- `src/agents/pi-*.test.ts`
- `src/agents/pi-embedded-*.test.ts`
- `src/agents/pi-tools*.test.ts`
- `src/agents/pi-settings.test.ts`
- `src/agents/pi-tool-definition-adapter.test.ts`
- `src/agents/pi-extensions/*.test.ts`

## 수동 테스트

권장 흐름:

- gateway를 dev mode로 실행:
  - `pnpm gateway:dev`
- 에이전트를 직접 트리거:
  - `pnpm openclaw agent --message "Hello" --thinking low`
- 대화형 디버깅에는 TUI 사용:
  - `pnpm tui`

tool call 동작을 확인하려면 `read` 또는 `exec` action을 유도해 tool streaming과
payload handling을 볼 수 있게 하세요.

## 초기 상태로 reset

상태는 OpenClaw state directory 아래에 있습니다. 기본값은 `~/.openclaw`입니다.
`OPENCLAW_STATE_DIR`가 설정되어 있으면 대신 그 디렉터리를 사용합니다.

모든 것을 초기화하려면 다음을 확인하세요.

- 설정용 `openclaw.json`
- auth profile과 token을 위한 `credentials/`
- 에이전트 세션 기록용 `agents/<agentId>/sessions/`
- session index용 `agents/<agentId>/sessions.json`
- legacy path가 남아 있으면 `sessions/`
- 빈 workspace가 필요하면 `workspace/`

세션만 초기화하려면 해당 에이전트의 `agents/<agentId>/sessions/`와
`agents/<agentId>/sessions.json`만 삭제하세요. 다시 인증하고 싶지 않다면
`credentials/`는 유지하세요.

## 참고 자료

- [https://docs.openclaw.ai/testing](https://docs.openclaw.ai/testing)
- [https://docs.openclaw.ai/start/getting-started](https://docs.openclaw.ai/start/getting-started)
