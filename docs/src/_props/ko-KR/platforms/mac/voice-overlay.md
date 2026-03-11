---
summary: "웨이크 워드와 push-to-talk 가 겹칠 때의 voice overlay 라이프사이클"
read_when:
  - voice overlay 동작을 조정할 때
title: "Voice Overlay"
---

# Voice Overlay 라이프사이클 (macOS)

대상: macOS 앱 기여자. 목표: 웨이크 워드와 push-to-talk 가 겹칠 때 voice overlay 동작을 예측 가능하게 유지한다.

## 현재 의도

* overlay 가 이미 웨이크 워드로 표시된 상태에서 사용자가 hotkey 를 누르면, hotkey 세션은 텍스트를 리셋하지 않고 기존 텍스트를 *인계받습니다*. hotkey 를 누르고 있는 동안 overlay 는 계속 표시됩니다. 사용자가 키를 놓으면: 트리밍된 텍스트가 있으면 전송하고, 없으면 닫습니다.
* 웨이크 워드만 사용하는 경우에는 여전히 침묵 시 자동 전송되며, push-to-talk 는 키를 놓는 즉시 전송됩니다.

## 구현됨 (2025-12-09)

* Overlay 세션은 이제 각 캡처(웨이크 워드 또는 push-to-talk)마다 토큰을 가집니다. 토큰이 일치하지 않으면 partial/final/send/dismiss/level 업데이트를 버려, 오래된 callback 을 막습니다.
* Push-to-talk 는 표시 중인 overlay 텍스트를 prefix 로 인계받습니다(즉, wake overlay 가 떠 있는 동안 hotkey 를 누르면 기존 텍스트를 유지하고 새로운 음성을 뒤에 붙입니다). 최종 transcript 를 최대 1.5초 기다리고, 없으면 현재 텍스트로 폴백합니다.
* Chime/overlay 로깅은 `voicewake.overlay`, `voicewake.ptt`, `voicewake.chime` 카테고리에서 `info` 레벨로 출력됩니다(세션 시작, partial, final, send, dismiss, chime reason).

## 다음 단계

1. **VoiceSessionCoordinator (actor)**
   * 한 번에 정확히 하나의 `VoiceSession` 만 소유
   * API (토큰 기반): `beginWakeCapture`, `beginPushToTalk`, `updatePartial`, `endCapture`, `cancel`, `applyCooldown`
   * 오래된 토큰을 가진 callback 을 버림(오래된 recognizer 가 overlay 를 다시 열지 못하게 함)
2. **VoiceSession (모델)**
   * 필드: `token`, `source` (wakeWord|pushToTalk), committed/volatile text, chime flags, timers (auto-send, idle), `overlayMode` (display|editing|sending), cooldown deadline
3. **Overlay binding**
   * `VoiceSessionPublisher` (`ObservableObject`) 가 활성 세션을 SwiftUI 로 반영
   * `VoiceWakeOverlayView` 는 publisher 를 통해서만 렌더링하며, 전역 singleton 을 직접 수정하지 않음
   * Overlay 사용자 동작(`sendNow`, `dismiss`, `edit`)은 세션 토큰과 함께 coordinator 로 다시 전달
4. **통합 전송 경로**
   * `endCapture` 시: 트리밍된 텍스트가 비었으면 dismiss, 그렇지 않으면 `performSend(session:)` (send chime 한 번 재생, 전달, dismiss)
   * Push-to-talk: 지연 없음. wake-word: auto-send 용 선택적 지연 가능
   * Push-to-talk 종료 후 wake runtime 에 짧은 cooldown 을 적용해 웨이크 워드가 즉시 다시 트리거되지 않게 함
5. **로깅**
   * Coordinator 는 subsystem `ai.openclaw`, categories `voicewake.overlay` 및 `voicewake.chime` 에 `.info` 로그를 출력
   * 핵심 이벤트: `session_started`, `adopted_by_push_to_talk`, `partial`, `finalized`, `send`, `dismiss`, `cancel`, `cooldown`

## 디버깅 체크리스트

* sticky overlay 를 재현하면서 로그를 스트리밍합니다:

  ```bash
  sudo log stream --predicate 'subsystem == "ai.openclaw" AND category CONTAINS "voicewake"' --level info --style compact
  ```

* 활성 세션 토큰이 하나뿐인지 확인합니다. 오래된 callback 은 coordinator 에 의해 버려져야 합니다.

* push-to-talk release 가 항상 활성 토큰으로 `endCapture` 를 호출하는지 확인합니다. 텍스트가 비어 있으면 chime 이나 send 없이 `dismiss` 가 나와야 합니다.

## 마이그레이션 단계(권장)

1. `VoiceSessionCoordinator`, `VoiceSession`, `VoiceSessionPublisher` 추가
2. `VoiceWakeRuntime` 이 `VoiceWakeOverlayController` 를 직접 건드리지 않고 세션을 생성/업데이트/종료하도록 리팩터
3. `VoicePushToTalk` 가 기존 세션을 인계받고 release 시 `endCapture` 를 호출하도록 리팩터; runtime cooldown 적용
4. `VoiceWakeOverlayController` 를 publisher 에 연결하고 runtime/PTT 에서의 직접 호출 제거
5. 세션 인계, cooldown, 빈 텍스트 dismiss 에 대한 통합 테스트 추가
