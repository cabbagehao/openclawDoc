---
title: "Pi 개발 워크플로우"
summary: "Pi 통합을 위한 개발 워크플로우: 빌드, 테스트, 실사용 검증"
read_when:
  - Pi 통합 코드나 테스트를 작업할 때
  - Pi 관련 lint, typecheck, 라이브 테스트 흐름을 실행할 때
x-i18n:
  source_path: "pi-dev.md"
---

# Pi 개발 워크플로우

이 가이드는 OpenClaw에서 pi 통합 작업을 할 때 따르기 좋은 기본 워크플로우를 요약합니다.

## 타입 체크와 린트

- 타입 체크 및 빌드: `pnpm build`
- 린트: `pnpm lint`
- 포맷 검사: `pnpm format`
- 푸시 전 전체 게이트: `pnpm lint && pnpm build && pnpm test`

## Pi 테스트 실행

Vitest로 Pi 중심 테스트 세트를 직접 실행합니다.

```bash
pnpm test -- \
  "src/agents/pi-*.test.ts" \
  "src/agents/pi-embedded-*.test.ts" \
  "src/agents/pi-tools*.test.ts" \
  "src/agents/pi-settings.test.ts" \
  "src/agents/pi-tool-definition-adapter*.test.ts" \
  "src/agents/pi-extensions/**/*.test.ts"
```

실제 제공업체 연동 테스트도 포함하려면 다음을 실행합니다.

```bash
OPENCLAW_LIVE_TEST=1 pnpm test -- src/agents/pi-embedded-runner-extraparams.live.test.ts
```

이 명령은 다음 주요 Pi 단위 테스트 묶음을 포함합니다.

- `src/agents/pi-*.test.ts`
- `src/agents/pi-embedded-*.test.ts`
- `src/agents/pi-tools*.test.ts`
- `src/agents/pi-settings.test.ts`
- `src/agents/pi-tool-definition-adapter.test.ts`
- `src/agents/pi-extensions/*.test.ts`

## 수동 테스트

권장 흐름:

- 개발 모드로 Gateway 실행:
  - `pnpm gateway:dev`
- 에이전트를 직접 트리거:
  - `pnpm openclaw agent --message "Hello" --thinking low`
- 상호작용 디버깅용 TUI 사용:
  - `pnpm tui`

도구 호출 동작을 보려면 `read` 또는 `exec` 작업을 유도하는 프롬프트를 사용하세요. 그러면 도구 스트리밍과 payload 처리 방식을 확인할 수 있습니다.

## 초기 상태로 리셋하기

상태 데이터는 OpenClaw 상태 디렉터리 아래에 있습니다. 기본값은 `~/.openclaw`이며, `OPENCLAW_STATE_DIR`이 설정돼 있다면 그 디렉터리를 사용합니다.

전체를 리셋하려면 다음을 정리하세요.

- 설정용 `openclaw.json`
- 인증 프로필과 토큰용 `credentials/`
- 에이전트 세션 이력용 `agents/<agentId>/sessions/`
- 세션 인덱스용 `agents/<agentId>/sessions.json`
- 레거시 경로가 있으면 `sessions/`
- 빈 워크스페이스가 필요하면 `workspace/`

세션만 리셋하고 싶다면 해당 에이전트의 `agents/<agentId>/sessions/`와 `agents/<agentId>/sessions.json`만 삭제하세요. 재인증을 원하지 않으면 `credentials/`는 유지하면 됩니다.

## 참고 자료

- [https://docs.openclaw.ai/testing](https://docs.openclaw.ai/testing)
- [https://docs.openclaw.ai/start/getting-started](https://docs.openclaw.ai/start/getting-started)
