---
summary: "로컬에서 테스트(vitest)를 실행하는 방법과 force/coverage 모드를 사용해야 하는 경우"
read_when:
  - 테스트를 실행하거나 수정할 때
title: "테스트"
---

# 테스트

- 전체 테스트 키트(스위트, 라이브, Docker): [테스트](/help/testing)

- `pnpm test:force`: 기본 제어 포트를 점유하고 있는 남아 있는 gateway 프로세스를 종료한 다음, 격리된 gateway 포트로 전체 Vitest 스위트를 실행하여 서버 테스트가 실행 중인 인스턴스와 충돌하지 않도록 합니다. 이전 gateway 실행으로 포트 18789가 점유된 상태로 남았을 때 사용하세요.
- `pnpm test:coverage`: V8 커버리지와 함께 유닛 스위트를 실행합니다(`vitest.unit.config.ts` 사용). 전역 임계값은 라인/브랜치/함수/구문 70%입니다. 커버리지는 유닛 테스트가 가능한 로직에 집중할 수 있도록 통합 비중이 높은 엔트리포인트(CLI 연결, gateway/telegram 브리지, webchat 정적 서버)를 제외합니다.
- Node 24+에서 `pnpm test`: OpenClaw는 `ERR_VM_MODULE_LINK_FAILURE` / `module is already linked`를 피하기 위해 Vitest `vmForks`를 자동으로 비활성화하고 `forks`를 사용합니다. `OPENCLAW_TEST_VM_FORKS=0|1`로 동작을 강제할 수 있습니다.
- `pnpm test`: 빠른 로컬 피드백을 위해 기본적으로 핵심 빠른 유닛 레인을 실행합니다.
- `pnpm test:channels`: 채널 비중이 높은 스위트를 실행합니다.
- `pnpm test:extensions`: 확장/플러그인 스위트를 실행합니다.
- Gateway 통합: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` 또는 `pnpm test:gateway`로 옵트인합니다.
- `pnpm test:e2e`: gateway 종단간 스모크 테스트(멀티 인스턴스 WS/HTTP/node 페어링)를 실행합니다. 기본값은 `vitest.e2e.config.ts`의 `vmForks` + 적응형 워커이며, `OPENCLAW_E2E_WORKERS=<n>`으로 조정하고 자세한 로그가 필요하면 `OPENCLAW_E2E_VERBOSE=1`을 설정하세요.
- `pnpm test:live`: 제공자 라이브 테스트(minimax/zai)를 실행합니다. API 키와 `LIVE=1`(또는 제공자별 `*_LIVE_TEST=1`)이 필요해야 스킵되지 않습니다.

## 로컬 PR 게이트

로컬 PR land/gate 점검에는 다음을 실행하세요:

- `pnpm check`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

`pnpm test`가 부하가 있는 호스트에서 불안정하게 실패하면 회귀로 간주하기 전에 한 번 더 실행한 뒤, `pnpm vitest run <path/to/test>`로 분리해서 확인하세요. 메모리가 제한된 호스트에서는 다음을 사용하세요:

- `OPENCLAW_TEST_PROFILE=low OPENCLAW_TEST_SERIAL_GATEWAY=1 pnpm test`

## 모델 지연 시간 벤치마크(로컬 키)

스크립트: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

사용법:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- 선택적 환경 변수: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- 기본 프롬프트: “한 단어로만 답하세요: ok. 구두점이나 추가 텍스트는 넣지 마세요.”

마지막 실행(2025-12-31, 20회):

- minimax 중앙값 1279ms (최소 1114, 최대 2431)
- opus 중앙값 2454ms (최소 1224, 최대 3170)

## CLI 시작 벤치마크

스크립트: [`scripts/bench-cli-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-cli-startup.ts)

사용법:

- `pnpm tsx scripts/bench-cli-startup.ts`
- `pnpm tsx scripts/bench-cli-startup.ts --runs 12`
- `pnpm tsx scripts/bench-cli-startup.ts --entry dist/entry.js --timeout-ms 45000`

이 벤치마크는 다음 명령을 측정합니다:

- `--version`
- `--help`
- `health --json`
- `status --json`
- `status`

출력에는 각 명령의 avg, p50, p95, min/max, 그리고 exit-code/signal 분포가 포함됩니다.

## 온보딩 E2E (Docker)

Docker는 선택 사항이며, 이는 컨테이너화된 온보딩 스모크 테스트에만 필요합니다.

깨끗한 Linux 컨테이너에서의 전체 콜드 스타트 흐름:

```bash
scripts/e2e/onboard-docker.sh
```

이 스크립트는 pseudo-tty를 통해 대화형 마법사를 구동하고, config/workspace/session 파일을 검증한 다음, gateway를 시작하고 `openclaw health`를 실행합니다.

## QR 가져오기 스모크 (Docker)

Docker의 Node 22+에서 `qrcode-terminal`이 로드되는지 확인합니다:

```bash
pnpm test:docker:qr
```
