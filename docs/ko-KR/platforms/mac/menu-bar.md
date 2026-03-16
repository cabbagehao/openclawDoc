---
summary: "메뉴 바 상태 로직과 사용자에게 표시되는 내용"
description: "macOS 메뉴 바 아이콘이 main/non-main 세션 활동, health, usage, debug override를 어떻게 반영하는지 설명합니다."
read_when:
  - "mac 메뉴 UI 또는 상태 로직을 조정할 때"
title: "Menu Bar"
x-i18n:
  source_path: "platforms/mac/menu-bar.md"
---

# 메뉴 바 상태 로직

## 표시되는 내용

- 현재 agent work state를 menu bar icon과 메뉴의 첫 번째 status row에 표시합니다.
- 작업이 활성화된 동안에는 health status가 숨겨지며, 모든 sessions가 idle 상태가 되면 다시 나타납니다.
- 메뉴의 “Nodes” 블록에는 client/presence entries가 아니라 **devices**만 나열됩니다 (`node.list`를 통해 paired된 nodes).
- provider usage snapshots를 사용할 수 있으면 Context 아래에 “Usage” section이 나타납니다.

## 상태 모델

- Sessions: events는 `runId`(per-run)와 payload 안의 `sessionKey`를 함께 전달합니다. “main” session은 key `main`이며, 없으면 가장 최근에 업데이트된 session으로 fallback합니다.
- Priority: main이 항상 우선합니다. main이 활성 상태이면 그 상태를 즉시 표시합니다. main이 idle이면 가장 최근에 활성화된 non-main session을 표시합니다. mid-activity에서 왔다 갔다 하지 않으며, 현재 session이 idle이 되거나 main이 활성화될 때만 전환합니다.
- Activity kinds:
  - `job`: 상위 수준 명령 실행 (`state: started|streaming|done|error`).
- `tool`: `toolName`과 `meta/args`를 포함하는 `phase: start|result`.

## IconState enum (Swift)

- `idle`
- `workingMain(ActivityKind)`
- `workingOther(ActivityKind)`
- `overridden(ActivityKind)` (debug override)

### ActivityKind → glyph

- `exec` → 💻
- `read` → 📄
- `write` → ✍️
- `edit` → 📝
- `attach` → 📎
- default → 🛠️

### 시각적 매핑

- `idle`: normal critter
- `workingMain`: glyph가 있는 badge, full tint, 다리 “working” animation
- `workingOther`: glyph가 있는 badge, muted tint, scurry 없음
- `overridden`: 활동과 관계없이 선택한 glyph/tint를 사용

## 상태 행 텍스트 (메뉴)

- 작업이 활성화된 동안: `<Session role> · <activity label>`
  - 예시: `Main · exec: pnpm test`, `Other · read: apps/macos/Sources/OpenClaw/AppState.swift`.
- idle일 때는 health summary로 fallback합니다.

## 이벤트 수집

- Source: control-channel `agent` events (`ControlChannel.handleAgentEvent`)
- Parsed fields:
  - `stream: "job"` with `data.state` for start/stop
  - `stream: "tool"` with `data.phase`, `name`, optional `meta`/`args`
- Labels:
  - `exec`: `args.command`의 첫 줄
  - `read`/`write`: 짧게 줄인 path
  - `edit`: path와 `meta`/diff counts에서 추론한 change kind
  - fallback: tool name

## 디버그 override

- Settings ▸ Debug ▸ “Icon override” picker:
  - `System (auto)` (기본값)
  - `Working: main` (도구 종류별)
  - `Working: other` (도구 종류별)
  - `Idle`
- `@AppStorage("iconOverride")`로 저장되며 `IconState.overridden`에 매핑됩니다.

## 테스트 체크리스트

- main session job을 트리거해 아이콘이 즉시 전환되고 status row에 main label이 표시되는지 확인합니다.
- main이 idle일 때 non-main session job을 트리거해 아이콘/상태가 non-main을 표시하고 완료될 때까지 안정적으로 유지되는지 확인합니다.
- 다른 session이 활성 상태일 때 main을 시작해 아이콘이 즉시 main으로 전환되는지 확인합니다.
- 빠른 tool bursts에서도 badge가 깜빡이지 않는지 확인합니다. tool results에는 TTL grace가 적용됩니다.
- 모든 sessions가 idle이 되면 Health row가 다시 나타나는지 확인합니다.
