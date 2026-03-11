---
summary: "macOS OpenClaw 메뉴 바 아이콘 상태와 애니메이션"
read_when:
  - 메뉴 바 아이콘 동작을 변경할 때
title: "Menu Bar Icon"
---

# 메뉴 바 아이콘 상태

작성자: steipete · 업데이트: 2025-12-06 · 범위: macOS 앱 (`apps/macos`)

- **Idle:** 일반 아이콘 애니메이션(눈 깜빡임, 가끔씩 흔들림)
- **Paused:** 상태 아이템이 `appearsDisabled` 를 사용하며 움직임이 없음
- **Voice trigger (big ears):** 음성 웨이크 감지기가 웨이크 워드를 들으면 `AppState.triggerVoiceEars(ttl: nil)` 을 호출하고, 발화 캡처 중에는 `earBoostActive=true` 를 유지합니다. 귀는 1.9배로 커지고 가독성을 위해 원형 귀 구멍이 생긴 뒤, 1초간 침묵하면 `stopVoiceEars()` 로 내려갑니다. 앱 내부 음성 파이프라인에서만 트리거됩니다.
- **Working (agent running):** `AppState.isWorking=true` 이 "tail/leg scurry" 마이크로 모션을 구동합니다. 작업 중에는 다리 흔들림이 빨라지고 약간의 위치 이동이 생깁니다. 현재는 WebChat agent 실행 주변에서 토글되며, 다른 긴 작업에도 연결할 때 같은 토글을 추가하면 됩니다.

연결 지점

- Voice wake: runtime/tester 가 트리거 시 `AppState.triggerVoiceEars(ttl: nil)` 을 호출하고, 캡처 창과 맞추기 위해 1초 침묵 후 `stopVoiceEars()` 를 호출합니다.
- Agent activity: 작업 구간 전후로 `AppStateStore.shared.setWorking(true/false)` 를 설정합니다(WebChat agent 호출에서는 이미 적용됨). 애니메이션이 멈추지 않도록 구간은 짧게 유지하고 `defer` 블록에서 반드시 초기화하세요.

도형과 크기

- 기본 아이콘은 `CritterIconRenderer.makeIcon(blink:legWiggle:earWiggle:earScale:earHoles:)` 에서 그립니다.
- 귀 크기 기본값은 `1.0`; voice boost 는 전체 프레임을 바꾸지 않고 `earScale=1.9`, `earHoles=true` 를 적용합니다(18×18 pt 템플릿 이미지를 36×36 px Retina backing store 에 렌더링).
- Scurry 는 작은 수평 흔들림과 함께 최대 약 1.0 의 leg wiggle 을 사용하며, 기존 idle wiggle 에 더해집니다.

동작 메모

- 귀/working 상태를 위한 외부 CLI/broker 토글은 두지 마세요. 실수로 요동치는 것을 막기 위해 앱 자체 신호에만 내부적으로 연결하세요.
- TTL 은 짧게 유지하세요(&lt;10s). 작업이 멈췄을 때도 아이콘이 빨리 기본 상태로 돌아와야 합니다.
