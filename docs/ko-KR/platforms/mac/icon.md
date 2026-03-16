---
summary: "macOS용 OpenClaw menu bar icon의 상태와 animation 규칙을 설명합니다."
description: "Idle, paused, voice trigger, working 상태에서 macOS menu bar icon이 어떻게 바뀌는지와 연결 지점을 정리합니다."
read_when:
  - menu bar icon 동작을 바꿀 때
title: "Menu Bar Icon"
x-i18n:
  source_path: "platforms/mac/icon.md"
---

# 메뉴 바 아이콘 상태

작성자: steipete · 업데이트: 2025-12-06 · 범위: macOS app (`apps/macos`)

- **Idle:** 기본 icon animation을 사용합니다. 눈을 깜빡이고 가끔 가볍게 흔들립니다.
- **Paused:** status item이 `appearsDisabled`를 사용하며 움직임이 없습니다.
- **Voice trigger (big ears):** voice wake detector가 wake word를 들으면 `AppState.triggerVoiceEars(ttl: nil)`를 호출하고, 발화 캡처가 끝날 때까지 `earBoostActive=true`를 유지합니다. 귀는 1.9배까지 커지고, 가독성을 위해 둥근 ear hole이 생깁니다. 이후 1초간 silence가 지나면 `stopVoiceEars()`로 원래 상태로 돌아갑니다. 이 동작은 app 내부 voice pipeline에서만 발생합니다.
- **Working (agent running):** `AppState.isWorking=true`가 "tail/leg scurry" micro-motion을 켭니다. 작업 중에는 leg wiggle이 더 빨라지고 약간의 offset이 추가됩니다. 현재는 WebChat agent run 전후에서 토글되며, 다른 긴 작업에도 같은 토글을 연결하면 됩니다.

## 연결 지점

- Voice wake: runtime/tester는 trigger 시 `AppState.triggerVoiceEars(ttl: nil)`를 호출하고, capture window에 맞춰 1초 침묵 뒤 `stopVoiceEars()`를 호출합니다.
- Agent activity: 작업 span 전후에 `AppStateStore.shared.setWorking(true/false)`를 설정합니다. WebChat agent 호출에는 이미 적용되어 있습니다. stuck animation을 막기 위해 span은 짧게 유지하고 `defer` block에서 반드시 reset하세요.

## 도형과 크기

- 기본 icon은 `CritterIconRenderer.makeIcon(blink:legWiggle:earWiggle:earScale:earHoles:)`에서 렌더링합니다.
- ear scale 기본값은 `1.0`입니다. voice boost는 전체 frame은 유지한 채 `earScale=1.9`, `earHoles=true`를 적용합니다. 템플릿 이미지는 `18×18 pt`에서 그리고, Retina backing store에서는 `36×36 px`로 렌더링합니다.
- scurry는 작은 수평 jiggle과 함께 최대 약 `1.0`의 leg wiggle을 사용하며, 기존 idle wiggle에 더해집니다.

## 동작 메모

- ear/working 상태를 바꾸는 외부 CLI 또는 broker toggle은 두지 마세요. 의도치 않은 flapping을 막기 위해 app 내부 signal에만 연결해야 합니다.
- TTL은 짧게 유지하세요(`&lt;10s`). job이 hang되더라도 icon이 빠르게 baseline으로 돌아와야 합니다.
