---
summary: "온보딩 위저드와 설정 스키마를 위한 RPC 프로토콜 메모"
description: "CLI, macOS app, Web UI가 공유하는 onboarding wizard와 config schema RPC 표면을 정리한 프로토콜 메모입니다."
read_when: "온보딩 위저드 단계나 설정 스키마 엔드포인트를 변경할 때"
title: "온보딩 및 설정 프로토콜"
x-i18n:
  source_path: "experiments/onboarding-config-protocol.md"
---

# 온보딩 + 설정 프로토콜

목적: CLI, macOS app, Web UI 전반에서 공유되는 onboarding 및 config 표면을 정의합니다.

## 구성 요소

- wizard engine (공유 session + prompts + onboarding state)
- CLI onboarding은 UI clients와 동일한 wizard flow를 사용합니다.
- Gateway RPC는 wizard와 config schema endpoints를 노출합니다.
- macOS onboarding은 wizard step model을 사용합니다.
- Web UI는 JSON Schema + UI hints에서 config forms를 렌더링합니다.

## Gateway RPC

- `wizard.start` params: `{ mode?: "local"|"remote", workspace?: string }`
- `wizard.next` params: `{ sessionId, answer?: { stepId, value? } }`
- `wizard.cancel` params: `{ sessionId }`
- `wizard.status` params: `{ sessionId }`
- `config.schema` params: `{}`
- `config.schema.lookup` params: `{ path }`
  - `path`는 표준 config segments와 slash-delimited plugin ids를 받습니다. 예: `plugins.entries.pack/one.config`

Responses (shape)

- Wizard: `{ sessionId, done, step?, status?, error? }`
- Config schema: `{ schema, uiHints, version, generatedAt }`
- Config schema lookup: `{ path, schema, hint?, hintPath?, children[] }`

## UI Hints

- `uiHints`는 path를 key로 하며, 선택적 metadata(label/help/group/order/advanced/sensitive/placeholder)를 담습니다.
- sensitive fields는 password inputs로 렌더링되며 별도의 redaction layer는 없습니다.
- 지원되지 않는 schema nodes는 raw JSON editor로 fallback합니다.

## 메모

- 이 문서는 onboarding/config protocol refactors를 추적하는 단일 기준 문서입니다.
