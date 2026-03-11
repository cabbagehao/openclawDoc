---
title: "CI 파이프라인"
description: "OpenClaw CI 파이프라인 동작 방식"
summary: "CI 잡 그래프, 스코프 게이트, 로컬 명령 대응"
read_when:
  - CI 잡이 왜 실행되거나 실행되지 않았는지 이해해야 할 때
  - 실패한 GitHub Actions 체크를 디버깅할 때
x-i18n:
  source_path: "ci.md"
---

# CI 파이프라인

CI는 `main` 브랜치에 대한 모든 push와 모든 pull request에서 실행됩니다. 문서만 바뀌었거나 네이티브 코드만 바뀐 경우, 비용이 큰 잡을 건너뛰기 위해 스마트 스코프 로직을 사용합니다.

## 잡 개요

| Job               | Purpose                                                 | When it runs                                      |
| ----------------- | ------------------------------------------------------- | ------------------------------------------------- |
| `docs-scope`      | 문서만 변경되었는지 감지                                | 항상                                              |
| `changed-scope`   | 어떤 영역이 바뀌었는지 감지(node/macos/android/windows) | 문서 전용이 아닌 PR                               |
| `check`           | TypeScript 타입, 린트, 포맷                             | `main`에 push할 때, 또는 Node 관련 변경이 있는 PR |
| `check-docs`      | Markdown 린트 + 깨진 링크 검사                          | 문서가 바뀌었을 때                                |
| `code-analysis`   | LOC 임계값 검사(1000줄)                                 | PR에서만                                          |
| `secrets`         | 유출된 비밀 감지                                        | 항상                                              |
| `build-artifacts` | dist를 한 번만 빌드해 다른 잡과 공유                    | 문서 전용이 아니고 node 관련 변경이 있을 때       |
| `release-check`   | npm pack 내용 검증                                      | 빌드 후                                           |
| `checks`          | Node/Bun 테스트 + 프로토콜 검사                         | 문서 전용이 아니고 node 관련 변경이 있을 때       |
| `checks-windows`  | Windows 전용 테스트                                     | 문서 전용이 아니고 windows 관련 변경이 있을 때    |
| `macos`           | Swift lint/build/test + TS tests                        | macOS 변경이 있는 PR                              |
| `android`         | Gradle build + tests                                    | 문서 전용이 아니고 android 관련 변경이 있을 때    |

## Fail-Fast 순서

비싼 잡이 돌기 전에 저렴한 검사가 먼저 실패하도록 순서를 구성합니다.

1. `docs-scope` + `code-analysis` + `check` (병렬, 약 1~2분)
2. `build-artifacts` (위 잡들이 끝나야 시작)
3. `checks`, `checks-windows`, `macos`, `android` (빌드 후 시작)

스코프 로직은 `scripts/ci-changed-scope.mjs`에 있고, 단위 테스트는 `src/scripts/ci-changed-scope.test.ts`에 있습니다.

## 러너

| Runner                           | Jobs                                |
| -------------------------------- | ----------------------------------- |
| `blacksmith-16vcpu-ubuntu-2404`  | 대부분의 Linux 잡, 스코프 감지 포함 |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                    |
| `macos-latest`                   | `macos`, `ios`                      |

## 로컬 대응 명령

```bash
pnpm check          # types + lint + format
pnpm test           # vitest tests
pnpm check:docs     # docs format + lint + broken links
pnpm release:check  # npm pack 내용 검증
```
