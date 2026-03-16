---
summary: "plugin manifest와 JSON Schema 요구사항을 설명합니다."
description: "OpenClaw plugin이 `openclaw.plugin.json`에 어떤 필드와 config schema를 포함해야 하고 검증이 어떻게 동작하는지 설명합니다."
read_when:
  - OpenClaw plugin을 만들고 있을 때
  - plugin config schema를 배포하거나 검증 오류를 디버깅할 때
title: "플러그인 Manifest"
x-i18n:
  source_path: "plugins/manifest.md"
---

# 플러그인 manifest (`openclaw.plugin.json`)

모든 plugin은 **plugin root**에 `openclaw.plugin.json` 파일을 반드시 포함해야 합니다.
OpenClaw는 이 manifest를 사용해 plugin 코드를 **실행하지 않고도** 설정을 검증합니다. manifest가 없거나 잘못되면 plugin 오류로 간주되어 config 검증이 차단됩니다.

전체 plugin 시스템 가이드는 [Plugins](/tools/plugin)를 참고하세요.

## 필수 필드

```json
{
  "id": "voice-call",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

필수 키:

- `id` (string): 정식 plugin id
- `configSchema` (object): plugin config용 JSON Schema(인라인)

선택 키:

- `kind` (string): plugin kind(예: `"memory"`, `"context-engine"`)
- `channels` (array): 이 plugin이 등록하는 channel id(예: `["matrix"]`)
- `providers` (array): 이 plugin이 등록하는 provider id
- `skills` (array): 로드할 skill 디렉터리(plugin root 기준 상대 경로)
- `name` (string): plugin 표시 이름
- `description` (string): 짧은 plugin 설명
- `uiHints` (object): UI 렌더링용 config 필드 라벨/placeholder/민감 정보 플래그
- `version` (string): 플러그인 버전(정보용)

## JSON Schema 요구사항

- **모든 plugin은 JSON Schema를 반드시 포함**해야 하며, config를 받지 않더라도 예외가 아닙니다.
- 빈 스키마도 허용됩니다(예: `{ "type": "object", "additionalProperties": false }`).
- 스키마는 런타임이 아니라 config 읽기/쓰기 시점에 검증됩니다.

## 검증 동작

- plugin manifest가 해당 channel id를 선언하지 않았다면, 알 수 없는 `channels.*` 키는 **오류**입니다.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny`, `plugins.slots.*`는 **발견 가능한** plugin id를 참조해야 합니다. 알 수 없는 id는 **오류**입니다.
- plugin이 설치되어 있지만 manifest나 schema가 깨져 있거나 누락되어 있다면 검증은 실패하고 Doctor가 plugin 오류를 보고합니다.
- plugin config가 존재하지만 plugin이 **비활성화**되어 있으면 config는 유지되며, Doctor와 log에서 **경고**가 표시됩니다.

## 참고

- manifest는 **모든 plugin에 필수**이며, 로컬 filesystem load도 예외가 아닙니다.
- runtime은 plugin module을 별도로 로드합니다. manifest는 discovery와 validation에만 사용됩니다.
- 배타적인 plugin kind는 `plugins.slots.*`를 통해 선택됩니다.
  - `kind: "memory"`는 `plugins.slots.memory`로 선택
  - `kind: "context-engine"`는 `plugins.slots.contextEngine`로 선택(기본값: 내장 `legacy`)
- plugin이 native module에 의존한다면, build 단계와 package manager allowlist 요구사항(예: pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`)을 문서화하세요.
