---
summary: "엄격한 config 검증 + doctor 전용 마이그레이션"
description: "unknown keys 거부, plugin schema 강제, doctor-only migrations, invalid config command gating을 정의한 리팩터 문서입니다."
read_when:
  - "config validation behavior를 설계하거나 구현할 때"
  - "config migrations 또는 doctor workflows를 다룰 때"
  - "plugin config schemas 또는 plugin load gating을 처리할 때"
title: "엄격한 Config 검증"
x-i18n:
  source_path: "refactor/strict-config.md"
---

# 엄격한 Config 검증 (doctor-only migrations)

## 목표

- 루트 `$schema` metadata를 제외하고 **모든 unknown config keys를 거부** (루트 + nested 포함)
- **schema 없는 plugin config 거부**, 해당 plugin은 로드하지 않음
- **load 시 legacy auto-migration 제거**, migrations는 doctor에서만 실행
- **startup 시 doctor(dry-run) 자동 실행**, config가 invalid면 diagnostic commands 외에는 차단

## 비목표

- load 시 backward compatibility 유지 (legacy keys 자동 migration 없음)
- unrecognized keys를 조용히 버리는 동작

## 엄격한 검증 규칙

- config는 모든 레벨에서 schema와 정확히 일치해야 합니다.
- 루트 `$schema`가 string인 경우를 제외하고, unknown keys는 모두 validation errors입니다 (루트와 nested 모두 passthrough 없음).
- `plugins.entries.<id>.config`는 plugin schema로 검증되어야 합니다.
  - plugin에 schema가 없으면 **plugin load를 거부**하고 명확한 error를 표시합니다.
- plugin manifest가 해당 channel id를 선언하지 않았다면 unknown `channels.<id>` keys는 오류입니다.
- 모든 plugins에 `openclaw.plugin.json` manifest가 필요합니다.

## Plugin schema enforcement

- 각 plugin은 config용 strict JSON Schema를 제공해야 합니다 (manifest 안에 인라인).
- plugin load flow:
  1. plugin manifest + schema 해결 (`openclaw.plugin.json`)
  2. schema에 대해 config 검증
  3. schema가 없거나 config가 invalid면 plugin load 차단 및 오류 기록
- 오류 메시지에는 다음이 포함됩니다.
  - plugin id
  - 이유 (missing schema / invalid config)
  - validation failure path
- disabled plugins는 config를 유지하지만 Doctor와 logs에 warning을 남깁니다.

## Doctor 흐름

- Doctor는 config를 로드할 때마다 실행됩니다 (기본은 dry-run).
- config가 invalid면:
  - 요약과 actionable errors를 출력
  - `openclaw doctor --fix` 실행을 안내
- `openclaw doctor --fix`:
  - migrations 적용
  - unknown keys 제거
  - 업데이트된 config 기록

## Command gating (when config is invalid)

허용되는 diagnostic-only commands:

- `openclaw doctor`
- `openclaw logs`
- `openclaw health`
- `openclaw help`
- `openclaw status`
- `openclaw gateway status`

그 외의 모든 commands는 다음과 같이 hard-fail해야 합니다. `"Config invalid. Run \`openclaw doctor --fix\`."`

## Error UX format

- 단일 summary header
- grouped sections:
  - unknown keys (full paths)
  - legacy keys / required migrations
  - plugin load failures (plugin id + reason + path)

## 구현 접점

- `src/config/zod-schema.ts`: 루트 passthrough 제거, 모든 objects를 strict로
- `src/config/zod-schema.providers.ts`: strict channel schemas 보장
- `src/config/validation.ts`: unknown keys에서 fail, legacy migrations 적용 금지
- `src/config/io.ts`: legacy auto-migrations 제거, 항상 doctor dry-run 수행
- `src/config/legacy*.ts`: doctor 전용으로만 사용
- `src/plugins/*`: schema registry + gating 추가
- `src/cli`: CLI command gating

## 테스트

- unknown key rejection (root + nested)
- plugin missing schema → 명확한 error와 함께 plugin load 차단
- invalid config → diagnostic commands를 제외하고 gateway startup 차단
- doctor dry-run auto, `doctor --fix`는 수정된 config 기록
