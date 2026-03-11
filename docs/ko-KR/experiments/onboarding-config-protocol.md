---
summary: "온보딩 위저드와 설정 스키마를 위한 RPC 프로토콜 메모"
read_when: "온보딩 위저드 단계나 설정 스키마 엔드포인트를 변경할 때"
title: "온보딩 및 설정 프로토콜"
---

# 온보딩 + 설정 프로토콜

목적: CLI, macOS 앱, Web UI 전반에서 공유되는 온보딩 및 설정 표면을 정의한다.

## 구성 요소

- 위저드 엔진(공유 세션 + 프롬프트 + 온보딩 상태)
- CLI 온보딩은 UI 클라이언트와 동일한 위저드 흐름을 사용한다.
- Gateway RPC 는 위저드 및 설정 스키마 엔드포인트를 노출한다.
- macOS 온보딩은 위저드 단계 모델을 사용한다.
- Web UI 는 JSON Schema + UI 힌트로부터 설정 폼을 렌더링한다.

## Gateway RPC

- `wizard.start` params: `{ mode?: "local"|"remote", workspace?: string }`
- `wizard.next` params: `{ sessionId, answer?: { stepId, value? } }`
- `wizard.cancel` params: `{ sessionId }`
- `wizard.status` params: `{ sessionId }`
- `config.schema` params: `{}`
- `config.schema.lookup` params: `{ path }`
  - `path` 는 표준 설정 세그먼트와 슬래시로 구분한 플러그인 id 를 받는다. 예: `plugins.entries.pack/one.config`

응답 형태:

- Wizard: `{ sessionId, done, step?, status?, error? }`
- Config schema: `{ schema, uiHints, version, generatedAt }`
- Config schema lookup: `{ path, schema, hint?, hintPath?, children[] }`

## UI 힌트

- `uiHints` 는 경로별로 키가 지정되며, 선택적 메타데이터(label/help/group/order/advanced/sensitive/placeholder)를 담는다.
- 민감한 필드는 비밀번호 입력으로 렌더링되며 별도 redaction 계층은 없다.
- 지원되지 않는 스키마 노드는 원시 JSON 편집기로 폴백한다.

## 메모

- 이 문서는 온보딩/설정 프로토콜 리팩터를 추적하는 단일 기준 문서다.
