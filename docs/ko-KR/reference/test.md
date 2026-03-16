---
summary: "로컬에서 테스트(vitest)를 실행하는 방법과 force/coverage 모드를 사용해야 하는 경우"
description: "로컬에서 `pnpm test` 계열 명령, coverage, e2e, live tests, Docker smoke tests를 언제 쓰는지 안내합니다."
read_when:
  - "테스트를 실행하거나 수정할 때"
title: "테스트"
x-i18n:
  source_path: "reference/test.md"
---

# 테스트

- 전체 테스트 키트(suites, live, Docker)는 [테스트](/help/testing)를 참고하세요.

- `pnpm test:force`: 기본 control port를 점유한 남아 있는 gateway process를 종료한 뒤, 격리된 gateway port로 전체 Vitest suite를 실행합니다. 이전 gateway run 때문에 port 18789가 점유된 경우에 사용하세요.
- `pnpm test:coverage`: V8 coverage와 함께 unit suite를 실행합니다 (`vitest.unit.config.ts` 사용). 전역 threshold는 lines/branches/functions/statements 70%입니다. coverage는 unit-testable logic에 집중할 수 있도록 integration-heavy entrypoints(CLI wiring, gateway/telegram bridges, webchat static server)를 제외합니다.
- Node 24+에서 `pnpm test`: OpenClaw는 `ERR_VM_MODULE_LINK_FAILURE` / `module is already linked`를 피하기 위해 Vitest `vmForks`를 자동으로 비활성화하고 `forks`를 사용합니다. `OPENCLAW_TEST_VM_FORKS=0|1`로 동작을 강제할 수 있습니다.
- `pnpm test`: 빠른 로컬 피드백을 위해 fast core unit lane을 기본으로 실행합니다.
- `pnpm test:channels`: channel-heavy suites를 실행합니다.
- `pnpm test:extensions`: extension/plugin suites를 실행합니다.
- Gateway integration: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` 또는 `pnpm test:gateway`로 opt-in합니다.
- `pnpm test:e2e`: gateway end-to-end smoke tests(multi-instance WS/HTTP/node pairing)를 실행합니다. 기본값은 `vitest.e2e.config.ts`의 `vmForks` + adaptive workers이며, `OPENCLAW_E2E_WORKERS=<n>`으로 조정하고 자세한 로그가 필요하면 `OPENCLAW_E2E_VERBOSE=1`을 설정하세요.
- `pnpm test:live`: provider live tests(minimax/zai)를 실행합니다. API keys와 `LIVE=1`(또는 provider별 `*_LIVE_TEST=1`)이 있어야 skip되지 않습니다.

## 로컬 PR 게이트

로컬 PR gate 점검에는 다음을 실행하세요.

- `pnpm check`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

`pnpm test`가 부하가 큰 host에서 flaky하게 실패하면 회귀로 간주하기 전에 한 번 더 실행한 뒤, `pnpm vitest run <path/to/test>`로 분리해서 확인하세요. 메모리가 제한된 host에서는 다음을 사용하세요.

- `OPENCLAW_TEST_PROFILE=low OPENCLAW_TEST_SERIAL_GATEWAY=1 pnpm test`

## 모델 지연 시간 벤치마크 (로컬 키)

스크립트: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

사용법:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- 선택적 environment variables: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- 기본 프롬프트: “한 단어로만 답하세요: ok. 구두점이나 추가 텍스트는 넣지 마세요.”

마지막 실행(2025-12-31, 20회):

- minimax median 1279ms (최소 1114, 최대 2431)
- opus median 2454ms (최소 1224, 최대 3170)

## CLI 시작 벤치마크

스크립트: [`scripts/bench-cli-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-cli-startup.ts)

사용법:

- `pnpm tsx scripts/bench-cli-startup.ts`
- `pnpm tsx scripts/bench-cli-startup.ts --runs 12`
- `pnpm tsx scripts/bench-cli-startup.ts --entry dist/entry.js --timeout-ms 45000`

이 벤치마크는 다음 commands를 측정합니다.

- `--version`
- `--help`
- `health --json`
- `status --json`
- `status`

출력에는 각 command의 avg, p50, p95, min/max, 그리고 exit-code/signal distribution이 포함됩니다.

## 온보딩 E2E (Docker)

Docker는 선택 사항이며, containerized onboarding smoke tests에만 필요합니다.

깨끗한 Linux 컨테이너에서의 전체 콜드 스타트 흐름:

```bash
scripts/e2e/onboard-docker.sh
```

이 스크립트는 pseudo-tty를 통해 interactive wizard를 구동하고, config/workspace/session files를 검증한 다음, gateway를 시작하고 `openclaw health`를 실행합니다.

## QR import smoke (Docker)

Docker의 Node 22+에서 `qrcode-terminal`이 로드되는지 확인합니다.

```bash
pnpm test:docker:qr
```
