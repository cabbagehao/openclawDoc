---
summary: 'Node + tsx "__name is not a function" 크래시 메모와 우회책'
read_when:
  - Node 전용 dev script 또는 watch 모드 실패를 디버깅할 때
  - OpenClaw에서 tsx/esbuild loader 크래시를 조사할 때
title: "Node + tsx 크래시"
x-i18n:
  source_path: "debug/node-issue.md"
---

# Node + tsx "\_\_name is not a function" 크래시

## 요약

Node에서 `tsx`로 OpenClaw를 실행하면 시작 시 다음과 같이 실패합니다.

```
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (.../src/logging/subsystem.ts:203:25)
    at .../src/agents/auth-profiles/constants.ts:25:20
```

이 문제는 개발 스크립트를 Bun에서 `tsx`로 바꾼 뒤(commit `2871657e`, 2026-01-06) 발생하기 시작했습니다. 같은 런타임 경로는 Bun에서는 정상 동작했습니다.

## 환경

* Node: v25.x(v25.3.0에서 관측)
* tsx: 4.21.0
* OS: macOS(다른 플랫폼에서도 Node 25를 쓰면 재현될 가능성 높음)

## 재현(Node 전용)

```bash
# repo root에서
node --version
pnpm install
node --import tsx src/entry.ts status
```

## repo 안의 최소 재현

```bash
node --import tsx scripts/repro/tsx-name-repro.ts
```

## Node 버전 확인

* Node 25.3.0: 실패
* Node 22.22.0(Homebrew `node@22`): 실패
* Node 24: 아직 설치되지 않아 확인 필요

## 메모 / 가설

* `tsx`는 esbuild로 TS/ESM을 변환합니다. esbuild의 `keepNames`는 `__name` helper를 생성하고 함수 정의를 `__name(...)`으로 감쌉니다.
* 이 크래시는 런타임 시점에 `__name`이 존재하지만 함수가 아니라는 뜻이며, Node 25 loader 경로에서 이 모듈의 helper가 누락되었거나 덮어써졌음을 시사합니다.
* 비슷한 `__name` helper 문제는 다른 esbuild 사용자들 사이에서도, helper가 누락되거나 다시 써지는 경우 보고된 적이 있습니다.

## 회귀 이력

* `2871657e` (2026-01-06): Bun 의존성을 줄이기 위해 스크립트를 Bun에서 tsx로 변경
* 그 이전(Bun 경로)에는 `openclaw status`와 `gateway:watch`가 동작함

## 우회책

* 개발 스크립트에는 Bun 사용(현재 임시 복구안)

* Node + tsc watch를 사용한 뒤 컴파일된 출력 실행:

  ```bash
  pnpm exec tsc --watch --preserveWatchOutput
  node --watch openclaw.mjs status
  ```

* 로컬 확인 결과: `pnpm exec tsc -p tsconfig.json` + `node openclaw.mjs status`는 Node 25에서 동작

* 가능하다면 TS loader에서 esbuild keepNames를 비활성화(`__name` helper 삽입 방지); 다만 tsx는 현재 이를 노출하지 않음

* Node LTS(22/24) + `tsx` 조합으로도 동일한지 পরীক্ষা해 Node 25 전용 문제인지 확인

## 참고 자료

* [https://opennext.js.org/cloudflare/howtos/keep\_names](https://opennext.js.org/cloudflare/howtos/keep_names)
* [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
* [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## 다음 단계

* Node 22/24에서 재현해 Node 25 회귀인지 확인
* 알려진 회귀가 있는지 `tsx` nightly를 시험하거나 이전 버전으로 고정
* Node LTS에서도 재현된다면 `__name` 스택 트레이스와 함께 최소 재현을 upstream에 제출
