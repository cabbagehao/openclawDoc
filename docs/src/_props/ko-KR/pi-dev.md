---
title: "Pi 개발 워크플로우"
summary: "Pi 통합을 위한 개발 프로세스: 빌드, 테스트 및 실시간 검증 가이드"
read_when:
  - Pi 통합 코드 또는 테스트를 수정할 때
  - Pi 전용 린트(Lint), 타입 체크, 라이브 테스트 워크플로우를 실행할 때
x-i18n:
  source_path: "pi-dev.md"
---

# Pi 개발 워크플로우

이 가이드는 OpenClaw에서 Pi 통합 작업을 수행할 때 권장되는 표준 개발 워크플로우를 요약함.

## 타입 체크 및 린트(Lint)

* 타입 체크 및 빌드: `pnpm build`
* 린트 실행: `pnpm lint`
* 포맷 검사: `pnpm format`
* 푸시(Push) 전 최종 검증: `pnpm lint && pnpm build && pnpm test`

## Pi 테스트 실행

Vitest를 사용하여 Pi 관련 테스트 세트를 직접 실행함.

```bash
pnpm test -- \
  "src/agents/pi-*.test.ts" \
  "src/agents/pi-embedded-*.test.ts" \
  "src/agents/pi-tools*.test.ts" \
  "src/agents/pi-settings.test.ts" \
  "src/agents/pi-tool-definition-adapter*.test.ts" \
  "src/agents/pi-extensions/**/*.test.ts"
```

실제 공급자 연동을 포함한 라이브 테스트를 수행하려면 다음을 실행함.

```bash
OPENCLAW_LIVE_TEST=1 pnpm test -- src/agents/pi-embedded-runner-extraparams.live.test.ts
```

이 명령어는 다음 주요 Pi 단위 테스트 스위트를 포함함.

* `src/agents/pi-*.test.ts`
* `src/agents/pi-embedded-*.test.ts`
* `src/agents/pi-tools*.test.ts`
* `src/agents/pi-settings.test.ts`
* `src/agents/pi-tool-definition-adapter.test.ts`
* `src/agents/pi-extensions/*.test.ts`

## 수동 테스트 가이드

권장되는 테스트 흐름:

* **Gateway 개발 모드 실행**:
  * `pnpm gateway:dev`
* **에이전트 직접 트리거**:
  * `pnpm openclaw agent --message "안녕" --thinking low`
* **TUI를 활용한 상호작용 디버깅**:
  * `pnpm tui`

도구 호출(Tool Call) 동작을 확인하려면 `read` 또는 `exec` 작업을 유도하는 프롬프트를 입력함. 이를 통해 도구 스트리밍 및 페이로드(Payload) 처리 방식을 검증할 수 있음.

## 상태 데이터 초기화(Reset)

상태 데이터는 OpenClaw 상태 디렉터리(`~/.openclaw`)에 저장됨. `OPENCLAW_STATE_DIR` 환경 변수가 설정된 경우 해당 경로를 사용함.

전체 초기화 시 다음 항목을 정리함:

* **설정 파일**: `openclaw.json`
* **인증 데이터**: `credentials/` (인증 프로필 및 토큰)
* **세션 이력**: `agents/<agentId>/sessions/`
* **세션 인덱스**: `agents/<agentId>/sessions.json`
* **레거시 데이터**: `sessions/` (존재하는 경우)
* **워크스페이스**: `workspace/` (완전한 초기 상태가 필요한 경우)

세션만 초기화하려면 해당 에이전트의 `sessions/` 폴더와 `sessions.json` 파일만 삭제함. 재인증 절차를 건너뛰려면 `credentials/` 폴더는 유지함.

## 관련 참조

* [OpenClaw 테스트 가이드](https://docs.openclaw.ai/testing)
* [시작하기 가이드](https://docs.openclaw.ai/start/getting-started)
