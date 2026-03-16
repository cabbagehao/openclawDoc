---
title: "CI 파이프라인"
description: "OpenClaw CI 파이프라인이 언제 어떤 작업을 실행하는지, 범위 기반 게이팅과 로컬 대응 명령어를 함께 설명합니다."
summary: "CI job graph, scope gates, and local command equivalents"
read_when:
  - 어떤 CI job이 왜 실행되었는지 또는 실행되지 않았는지 파악해야 할 때
  - GitHub Actions check 실패를 디버깅할 때
x-i18n:
  source_path: "ci.md"
---

# CI 파이프라인

CI는 `main`에 대한 모든 push와 모든 pull request에서 실행됩니다. 문서만
변경되었거나 native code만 변경되었을 때 비용이 큰 job을 건너뛰기 위해 smart
scoping을 사용합니다.

## Job 개요

| Job               | 목적                                                    | 실행 시점                                        |
| ----------------- | ------------------------------------------------------- | ------------------------------------------------ |
| `docs-scope`      | docs-only 변경 감지                                     | 항상                                             |
| `changed-scope`   | 어떤 영역이 바뀌었는지 감지(node/macos/android/windows) | docs가 아닌 PR                                   |
| `check`           | TypeScript types, lint, format                          | `main` push, 또는 Node 관련 변경이 있는 PR       |
| `check-docs`      | Markdown lint + broken link check                       | Docs 변경 시                                     |
| `code-analysis`   | LOC threshold check (1000 lines)                        | PR 전용                                          |
| `secrets`         | leaked secrets 감지                                     | 항상                                             |
| `build-artifacts` | dist를 한 번 빌드해 다른 jobs와 공유                    | docs가 아니고 node 변경이 있을 때                |
| `release-check`   | npm pack contents 검증                                  | build 후                                         |
| `checks`          | Node/Bun tests + protocol check                         | docs가 아니고 node 변경이 있을 때                |
| `checks-windows`  | Windows 전용 tests                                      | docs가 아니고 windows 관련 변경이 있을 때        |
| `macos`           | Swift lint/build/test + TS tests                        | macos 변경이 있는 PR                             |
| `android`         | Gradle build + tests                                    | docs가 아니고 android 변경이 있을 때             |

## Fail-Fast 순서

Job은 비용이 큰 작업이 실행되기 전에 비용이 낮은 검사가 먼저 실패하도록 순서가
정해져 있습니다.

1. `docs-scope` + `code-analysis` + `check` (병렬, 약 1-2분)
2. `build-artifacts` (위 단계가 끝난 뒤)
3. `checks`, `checks-windows`, `macos`, `android` (build가 끝난 뒤)

범위 판별 로직은 `scripts/ci-changed-scope.mjs`에 있고, 단위 테스트는
`src/scripts/ci-changed-scope.test.ts`에 있습니다.

## Runners

| Runner                           | Jobs                                       |
| -------------------------------- | ------------------------------------------ |
| `blacksmith-16vcpu-ubuntu-2404`  | 대부분의 Linux jobs, scope detection 포함  |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                           |
| `macos-latest`                   | `macos`, `ios`                             |

## 로컬 대응 명령

```bash
pnpm check          # types + lint + format
pnpm test           # vitest tests
pnpm check:docs     # docs format + lint + broken links
pnpm release:check  # validate npm pack
```
