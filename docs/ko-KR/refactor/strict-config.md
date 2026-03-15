---
summary: "엄격한 config 검증 + doctor 전용 마이그레이션"
read_when:
  - config 검증 동작을 설계하거나 구현할 때
  - config migration 또는 doctor 워크플로우를 다룰 때
  - plugin config schema 또는 plugin load gating을 처리할 때
title: "엄격한 Config 검증"
x-i18n:
  source_path: "refactor/strict-config.md"
---

# 엄격한 Config 검증 (doctor 전용 migration)

## 목표

- 루트 `$schema` 메타데이터를 제외하고 **모든 알 수 없는 config 키를 거부**(루트 + 중첩 포함)
- **schema 없는 plugin config 거부**, 해당 plugin은 로드하지 않음
- **로드 시 레거시 자동 migration 제거**, migration은 doctor에서만 실행
- **시작 시 doctor(dry-run) 자동 실행**, config가 유효하지 않으면 진단성 명령을 제외한 나머지 차단

## 비목표

- 로드 시 하위 호환 유지(레거시 키 자동 migration 없음)
- 알 수 없는 키를 조용히 버리는 동작

## 엄격한 검증 규칙

- Config는 모든 레벨에서 schema와 정확히 일치해야 합니다.
- 루트 `$schema`가 문자열인 경우를 제외하고, 알 수 없는 키는 모두 검증 오류입니다(루트와 중첩 모두 passthrough 없음).
- `plugins.entries.<id>.config`는 plugin의 schema로 검증되어야 합니다.
  - plugin에 schema가 없으면 **plugin load를 거부**하고 명확한 오류를 표시합니다.
- plugin manifest가 해당 channel id를 선언하지 않았다면 알 수 없는 `channels.<id>` 키는 오류입니다.
- 모든 plugin에 `openclaw.plugin.json` manifest가 필요합니다.

## Plugin schema 강제

- 각 plugin은 config용 strict JSON Schema를 제공해야 합니다(manifest 안에 인라인).
- Plugin load 흐름:
  1. plugin manifest + schema 해결(`openclaw.plugin.json`)
  2. schema에 대해 config 검증
  3. schema가 없거나 config가 잘못되면 plugin load 차단 및 오류 기록
- 오류 메시지에는 다음이 포함됩니다.
  - plugin id
  - 이유(missing schema / invalid config)
  - 검증 실패 경로
- 비활성화된 plugin은 config를 유지하지만, Doctor와 로그에 경고를 남깁니다.

## Doctor 흐름

- Doctor는 config를 로드할 때마다 실행됩니다(기본은 dry-run).
- Config가 유효하지 않으면:
  - 요약과 실행 가능한 오류를 출력
  - `openclaw doctor --fix` 실행을 안내
- `openclaw doctor --fix`:
  - migration 적용
  - 알 수 없는 키 제거
  - 업데이트된 config 기록

## Config가 유효하지 않을 때의 명령 게이팅

허용되는 진단 전용 명령:

- `openclaw doctor`
- `openclaw logs`
- `openclaw health`
- `openclaw help`
- `openclaw status`
- `openclaw gateway status`

그 외의 모든 명령은 다음과 같이 hard-fail 해야 합니다. `"Config invalid. Run \`openclaw doctor --fix\`."`

## 오류 UX 형식

- 단일 요약 헤더
- 그룹별 섹션:
  - 알 수 없는 키(전체 경로)
  - 레거시 키 / 필요한 migration
  - plugin load 실패(plugin id + 이유 + 경로)

## 구현 접점

- `src/config/zod-schema.ts`: 루트 passthrough 제거, 모든 객체를 strict로
- `src/config/zod-schema.providers.ts`: strict channel schema 보장
- `src/config/validation.ts`: 알 수 없는 키에서 실패, 레거시 migration 적용 금지
- `src/config/io.ts`: 레거시 자동 migration 제거, 항상 doctor dry-run 수행
- `src/config/legacy*.ts`: doctor 전용으로만 사용
- `src/plugins/*`: schema registry + gating 추가
- `src/cli`: CLI 명령 게이팅

## 테스트

- 알 수 없는 키 거부(루트 + 중첩)
- schema 없는 plugin -> 명확한 오류와 함께 plugin load 차단
- 잘못된 config -> 진단성 명령을 제외하고 gateway 시작 차단
- doctor dry-run 자동 실행, `doctor --fix`는 수정된 config 기록
