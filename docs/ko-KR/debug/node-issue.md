---
summary: 'Node + tsx "__name is not a function" 크래시 메모와 우회 방법'
description: 'Node에서 tsx로 OpenClaw를 실행할 때 발생하는 "__name is not a function" 크래시의 증상, 원인 가설, 우회 방법을 정리합니다.'
read_when:
  - Node 전용 dev script 또는 watch 모드 실패를 디버깅할 때
  - OpenClaw에서 tsx/esbuild 로더 크래시를 조사할 때
title: "Node + tsx 크래시"
x-i18n:
  source_path: "debug/node-issue.md"
---

# Node + tsx "\_\_name is not a function" 크래시

## 요약

Node에서 `tsx`를 사용해 OpenClaw를 실행하면 시작 단계에서 다음 오류와 함께 실패합니다.

```
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (.../src/logging/subsystem.ts:203:25)
    at .../src/agents/auth-profiles/constants.ts:25:20
```

이 문제는 개발 스크립트를 Bun에서 `tsx`로 전환한 뒤(commit `2871657e`, 2026-01-06)부터 발생했습니다. 동일한 런타임 경로는 Bun에서는 정상적으로 동작했습니다.

## 환경

- Node: v25.x(v25.3.0에서 확인)
- tsx: 4.21.0
- OS: macOS(Node 25를 실행하는 다른 플랫폼에서도 재현될 가능성이 높음)

## 재현(Node 전용)

```bash
# in repo root
node --version
pnpm install
node --import tsx src/entry.ts status
```

## repo 안의 최소 재현

```bash
node --import tsx scripts/repro/tsx-name-repro.ts
```

## Node 버전 확인

- Node 25.3.0: 실패
- Node 22.22.0(Homebrew `node@22`): 실패
- Node 24: 아직 설치되지 않아 확인 필요

## 메모 / 가설

- `tsx`는 esbuild를 사용해 TS/ESM을 변환합니다. esbuild의 `keepNames` 옵션은 `__name` 헬퍼를 생성하고 함수 정의를 `__name(...)`으로 감쌉니다.
- 이 크래시는 런타임에 `__name`은 존재하지만 함수가 아니라는 의미이며, Node 25 로더 경로에서 이 모듈의 헬퍼가 누락되었거나 덮어써졌을 가능성을 시사합니다.
- 유사한 `__name` 헬퍼 문제는 다른 esbuild 사용자 환경에서도, 헬퍼가 누락되거나 재작성되는 경우 보고된 바 있습니다.

## 회귀 이력

- `2871657e` (2026-01-06): Bun을 선택 사항으로 만들기 위해 스크립트를 Bun에서 tsx로 변경
- 그 이전(Bun 경로)에는 `openclaw status`와 `gateway:watch`가 동작했습니다.

## 우회책

- 개발 스크립트에 Bun을 사용합니다(현재 임시 되돌리기 방안).
- Node + tsc watch를 사용한 뒤 컴파일된 출력을 실행합니다.

  ```bash
  pnpm exec tsc --watch --preserveWatchOutput
  node --watch openclaw.mjs status
  ```

- 로컬에서 확인한 결과, `pnpm exec tsc -p tsconfig.json` + `node openclaw.mjs status`는 Node 25에서 동작합니다.
- 가능하다면 TS 로더에서 esbuild `keepNames`를 비활성화해 `__name` 헬퍼 삽입을 막습니다. 다만 현재 tsx는 이를 노출하지 않습니다.
- Node LTS(22/24) + `tsx` 조합에서도 동일하게 재현되는지 확인해, 이 문제가 Node 25 전용인지 검증합니다.

## 참고 자료

- [https://opennext.js.org/cloudflare/howtos/keep_names](https://opennext.js.org/cloudflare/howtos/keep_names)
- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## 다음 단계

- Node 22/24에서 재현해 Node 25 회귀인지 확인합니다.
- 알려진 회귀가 있는지 `tsx` nightly를 테스트하거나 이전 버전으로 고정합니다.
- Node LTS에서도 재현된다면 `__name` 스택 트레이스와 함께 최소 재현 사례를 upstream에 제출합니다.
