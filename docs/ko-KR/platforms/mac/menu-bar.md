---
summary: "메뉴 바 상태 로직과 사용자에게 표시되는 내용"
read_when:
  - mac 메뉴 UI 또는 상태 로직을 조정할 때
title: "Menu Bar"
---

# 메뉴 바 상태 로직

## 표시되는 내용

- 현재 에이전트 작업 상태를 메뉴 바 아이콘과 메뉴의 첫 번째 상태 행에 표시합니다.
- 작업이 활성화되어 있는 동안에는 상태 정보가 숨겨지며, 모든 세션이 idle 상태가 되면 다시 나타납니다.
- 메뉴의 “Nodes” 블록에는 클라이언트/프레즌스 항목이 아니라 **devices** 만 나열됩니다(`node.list` 를 통해 페어링된 노드).
- provider 사용량 스냅샷을 사용할 수 있으면 Context 아래에 “Usage” 섹션이 나타납니다.

## 상태 모델

- Sessions: 이벤트는 `runId` (실행별)와 payload 안의 `sessionKey` 를 함께 전달합니다. “main” 세션은 키 `main` 이며, 없으면 가장 최근에 업데이트된 세션으로 폴백합니다.
- Priority: main 이 항상 우선합니다. main 이 활성 상태이면 그 상태를 즉시 표시합니다. main 이 idle 상태이면 가장 최근에 활성화된 non-main 세션을 표시합니다. 활동 중간에 이리저리 바꾸지 않으며, 현재 세션이 idle 상태가 되거나 main 이 활성화될 때만 전환합니다.
- Activity kinds:
  - `job`: 상위 수준 명령 실행 (`state: started|streaming|done|error`).
  - `tool`: `toolName` 및 `meta/args` 와 함께 전달되는 `phase: start|result`.

## IconState enum (Swift)

- `idle`
- `workingMain(ActivityKind)`
- `workingOther(ActivityKind)`
- `overridden(ActivityKind)` (디버그 override)

### ActivityKind → glyph

- `exec` → 💻
- `read` → 📄
- `write` → ✍️
- `edit` → 📝
- `attach` → 📎
- default → 🛠️

### 시각적 매핑

- `idle`: 일반 critter.
- `workingMain`: glyph 가 있는 badge, 전체 tint, 다리 “working” 애니메이션.
- `workingOther`: glyph 가 있는 badge, 약한 tint, 빠른 움직임 없음.
- `overridden`: 활동과 관계없이 선택된 glyph/tint 를 사용합니다.

## 상태 행 텍스트 (메뉴)

- 작업이 활성화된 동안: `<Session role> · <activity label>`
  - 예시: `Main · exec: pnpm test`, `Other · read: apps/macos/Sources/OpenClaw/AppState.swift`.
- idle 상태일 때: 상태 요약으로 폴백합니다.

## 이벤트 수집

- Source: control-channel `agent` 이벤트 (`ControlChannel.handleAgentEvent`).
- Parsed fields:
  - `stream: "job"` 와 시작/중지를 나타내는 `data.state`.
  - `stream: "tool"` 와 `data.phase`, `name`, 선택적 `meta`/`args`.
- Labels:
  - `exec`: `args.command` 의 첫 번째 줄.
  - `read`/`write`: 짧게 줄인 경로.
  - `edit`: 경로와 `meta`/diff 개수에서 추론한 변경 종류.
  - fallback: tool 이름.

## 디버그 override

- Settings ▸ Debug ▸ “Icon override” picker:
  - `System (auto)` (기본값)
  - `Working: main` (도구 종류별)
  - `Working: other` (도구 종류별)
  - `Idle`
- `@AppStorage("iconOverride")` 를 통해 저장되며 `IconState.overridden` 에 매핑됩니다.

## 테스트 체크리스트

- main 세션 job 을 트리거: 아이콘이 즉시 전환되고 상태 행에 main 라벨이 표시되는지 확인합니다.
- main 이 idle 상태일 때 non-main 세션 job 을 트리거: 아이콘/상태가 non-main 을 표시하고, 완료될 때까지 안정적으로 유지되는지 확인합니다.
- 다른 세션이 활성 상태일 때 main 시작: 아이콘이 즉시 main 으로 전환되는지 확인합니다.
- 빠른 tool burst: badge 가 깜빡이지 않는지 확인합니다(tool result 에 대한 TTL 유예).
- 모든 세션이 idle 상태가 되면 Health 행이 다시 나타나는지 확인합니다.
