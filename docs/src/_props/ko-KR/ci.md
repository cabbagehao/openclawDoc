---
title: "CI 파이프라인"
description: "OpenClaw CI 파이프라인의 구성 및 동작 방식"
summary: "CI 작업 그래프, 실행 범위 필터링, 로컬 명령어 대응 가이드"
read_when:
  - CI 작업의 실행 또는 건너뛰기 로직을 이해하고자 할 때
  - GitHub Actions의 작업 실패를 디버깅할 때
x-i18n:
  source_path: "ci.md"
---

# CI 파이프라인

CI는 `main` 브랜치에 대한 모든 푸시(Push)와 풀 리퀘스트(PR) 발생 시 실행됨. 문서 수정 또는 네이티브 코드 수정 시 불필요한 고비용 작업을 건너뛰기 위해 스마트 스코프(Smart Scope) 로직을 적용함.

## 작업(Job) 개요

| 작업 이름             | 목적                                          | 실행 시점                             |
| ----------------- | ------------------------------------------- | --------------------------------- |
| `docs-scope`      | 문서 파일의 변경 여부 감지                             | 항상 실행                             |
| `changed-scope`   | 변경된 기술 영역 감지(node, macos, android, windows) | 문서 전용 수정이 아닌 PR                   |
| `check`           | TypeScript 타입 검사, 린트(Lint), 포맷(Format) 확인   | `main` 푸시 또는 Node 관련 변경이 포함된 PR   |
| `check-docs`      | Markdown 린트 및 깨진 링크 검사                      | 문서 변경 시                           |
| `code-analysis`   | 코드 라인 수(LOC) 임계값 검사 (최대 1000줄)              | PR에서만 실행                          |
| `secrets`         | 민감 정보(Secrets) 유출 감지                        | 항상 실행                             |
| `build-artifacts` | 빌드 결과물을 생성하여 다른 작업과 공유                      | 문서 전용 수정이 아니며 Node 관련 변경이 있을 때    |
| `release-check`   | `npm pack` 패키지 내용 검증                        | 빌드 완료 후 실행                        |
| `checks`          | Node/Bun 테스트 및 프로토콜 검사                      | 문서 전용 수정이 아니며 Node 관련 변경이 있을 때    |
| `checks-windows`  | Windows 전용 테스트                              | 문서 전용 수정이 아니며 Windows 관련 변경이 있을 때 |
| `macos`           | Swift 린트/빌드/테스트 및 TS 테스트                    | macOS 변경 사항이 포함된 PR               |
| `android`         | Gradle 빌드 및 테스트                             | 문서 전용 수정이 아니며 Android 관련 변경이 있을 때 |

## 장애 조기 발견(Fail-Fast) 순서

비용이 높은 작업이 시작되기 전에 비용이 낮은 검사들을 먼저 수행하도록 구성됨.

1. `docs-scope` + `code-analysis` + `check` (병렬 실행, 약 1\~2분 소요)
2. `build-artifacts` (1단계 작업 완료 후 시작)
3. `checks`, `checks-windows`, `macos`, `android` (빌드 단계 완료 후 시작)

범위 필터링 로직은 `scripts/ci-changed-scope.mjs`에 정의되어 있으며, 단위 테스트는 `src/scripts/ci-changed-scope.test.ts`를 참조함.

## 실행 환경(Runner)

| 환경 이름                            | 수행 작업                      |
| -------------------------------- | -------------------------- |
| `blacksmith-16vcpu-ubuntu-2404`  | 대부분의 Linux 기반 작업(범위 감지 포함) |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`           |
| `macos-latest`                   | `macos`, `ios`             |

## 로컬 대응 명령어

```bash
pnpm check          # 타입 + 린트 + 포맷 검사
pnpm test           # Vitest를 사용한 유닛 테스트
pnpm check:docs     # 문서 포맷 + 린트 + 링크 검사
pnpm release:check  # npm pack 패키징 내용 검증
```
