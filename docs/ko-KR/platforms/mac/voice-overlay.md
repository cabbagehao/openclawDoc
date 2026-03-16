---
summary: "wake-word와 push-to-talk가 겹칠 때의 voice overlay lifecycle을 설명합니다."
description: "macOS voice overlay에서 wake-word와 push-to-talk가 겹칠 때 세션 token, send 흐름, cooldown, debugging 포인트를 정리합니다."
read_when:
  - voice overlay 동작을 조정할 때
title: "Voice Overlay"
x-i18n:
  source_path: "platforms/mac/voice-overlay.md"
---

# Voice Overlay 라이프사이클 (macOS)

대상은 macOS app contributor입니다. 목표는 wake-word와 push-to-talk가 겹칠 때도 voice overlay 동작을 예측 가능하게 유지하는 것입니다.

## 현재 의도

- overlay가 이미 wake-word 때문에 떠 있는 상태에서 사용자가 hotkey를 누르면, hotkey session은 텍스트를 reset하지 않고 기존 텍스트를 _인계받습니다_. hotkey를 누르는 동안 overlay는 계속 유지됩니다. 키를 놓았을 때 trimmed text가 있으면 전송하고, 없으면 닫습니다.
- wake-word만 사용 중일 때는 silence 이후 자동 전송이 계속 동작하고, push-to-talk는 key release 시 즉시 전송됩니다.

## 구현됨 (2025-12-09)

- overlay session은 각 capture(wake-word 또는 push-to-talk)마다 token을 가집니다. token이 일치하지 않으면 `partial`/`final`/`send`/`dismiss`/`level` update를 버려 stale callback을 막습니다.
- push-to-talk는 현재 보이는 overlay text를 prefix로 인계받습니다. 즉, wake overlay가 떠 있는 상태에서 hotkey를 누르면 기존 text를 유지하고 새 음성을 뒤에 붙입니다. final transcript는 최대 1.5초까지 기다리고, 없으면 현재 text로 fallback합니다.
- chime/overlay logging은 `voicewake.overlay`, `voicewake.ptt`, `voicewake.chime` category에서 `info` 레벨로 출력됩니다. session start, partial, final, send, dismiss, chime reason이 포함됩니다.

## 다음 단계

1. **VoiceSessionCoordinator (actor)**
   - 한 번에 정확히 하나의 `VoiceSession`만 소유
   - API(token 기반): `beginWakeCapture`, `beginPushToTalk`, `updatePartial`, `endCapture`, `cancel`, `applyCooldown`
   - 오래된 token을 가진 callback을 버려, stale recognizer가 overlay를 다시 열지 못하게 함
2. **VoiceSession (모델)**
   - field: `token`, `source` (`wakeWord|pushToTalk`), committed/volatile text, chime flags, timer(`auto-send`, `idle`), `overlayMode` (`display|editing|sending`), cooldown deadline
3. **Overlay binding**
   - `VoiceSessionPublisher`(`ObservableObject`)가 active session을 SwiftUI에 반영
   - `VoiceWakeOverlayView`는 publisher를 통해서만 렌더링하며, global singleton을 직접 수정하지 않음
   - overlay user action(`sendNow`, `dismiss`, `edit`)은 session token과 함께 coordinator로 되돌림
4. **통합 전송 경로**
   - `endCapture` 시 trimmed text가 비어 있으면 dismiss, 아니면 `performSend(session:)` 호출(send chime 1회, forward, dismiss)
   - push-to-talk는 지연 없음, wake-word는 auto-send용 선택적 지연 허용
   - push-to-talk 종료 후 wake runtime에 짧은 cooldown을 적용해 wake-word가 즉시 다시 트리거되지 않게 함
5. **로깅**
   - coordinator는 subsystem `ai.openclaw`, category `voicewake.overlay`와 `voicewake.chime`에 `.info` log를 출력
   - 핵심 event: `session_started`, `adopted_by_push_to_talk`, `partial`, `finalized`, `send`, `dismiss`, `cancel`, `cooldown`

## 디버깅 체크리스트

- sticky overlay를 재현하면서 log를 stream합니다:

  ```bash
  sudo log stream --predicate 'subsystem == "ai.openclaw" AND category CONTAINS "voicewake"' --level info --style compact
  ```

- active session token이 하나뿐인지 확인합니다. stale callback은 coordinator에 의해 버려져야 합니다.
- push-to-talk release가 항상 active token으로 `endCapture`를 호출하는지 확인합니다. text가 비어 있으면 chime이나 send 없이 `dismiss`가 나와야 합니다.

## 마이그레이션 단계(권장)

1. `VoiceSessionCoordinator`, `VoiceSession`, `VoiceSessionPublisher` 추가
2. `VoiceWakeRuntime`이 `VoiceWakeOverlayController`를 직접 건드리지 않고 session을 생성/업데이트/종료하도록 refactor
3. `VoicePushToTalk`가 기존 session을 인계받고 release 시 `endCapture`를 호출하도록 refactor, runtime cooldown 적용
4. `VoiceWakeOverlayController`를 publisher에 연결하고 runtime/PTT의 직접 호출 제거
5. session 인계, cooldown, empty-text dismiss에 대한 integration test 추가
