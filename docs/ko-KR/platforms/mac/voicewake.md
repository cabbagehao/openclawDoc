---
summary: "mac 앱의 Voice wake 및 push-to-talk 모드와 라우팅 세부 사항"
read_when:
  - voice wake 또는 PTT 경로 작업 시
title: "Voice Wake"
---

# Voice Wake & Push-to-Talk

## 모드

- **Wake-word 모드**(기본값): 항상 켜져 있는 Speech 인식기가 트리거 토큰(`swabbleTriggerWords`)을 기다립니다. 일치하면 캡처를 시작하고, partial text 와 함께 overlay 를 표시하며, 침묵 후 자동으로 전송합니다.
- **Push-to-talk(오른쪽 Option 길게 누르기)**: 오른쪽 Option 키를 길게 누르면 트리거 없이 즉시 캡처합니다. 누르고 있는 동안 overlay 가 표시되며, 키를 놓으면 짧은 지연 후 완료되어 전달되므로 텍스트를 약간 수정할 수 있습니다.

## 런타임 동작(wake-word)

- Speech 인식기는 `VoiceWakeRuntime` 에서 동작합니다.
- 트리거는 웨이크 워드와 다음 단어 사이에 **의미 있는 pause** 가 있을 때만 발동합니다(약 0.55초 간격). overlay/chime 은 명령이 시작되기 전이라도 그 pause 시점에 시작될 수 있습니다.
- Silence window: 음성이 계속 흐를 때는 2.0초, 트리거만 들렸다면 5.0초입니다.
- Hard stop: runaway session 방지를 위해 120초입니다.
- 세션 간 debounce: 350ms입니다.
- Overlay 는 committed/volatile coloring 과 함께 `VoiceWakeOverlayController` 로 구동됩니다.
- 전송 후 인식기는 깔끔하게 다시 시작되어 다음 트리거를 기다립니다.

## 라이프사이클 불변 조건

- Voice Wake 가 활성화되어 있고 권한이 부여되어 있다면, wake-word 인식기는 항상 듣고 있어야 합니다(명시적인 push-to-talk 캡처 중인 경우 제외).
- Overlay 표시 상태(X 버튼을 통한 수동 dismiss 포함)는 인식기 재시작을 절대 막아서는 안 됩니다.

## Sticky overlay 실패 모드(이전)

이전에는 overlay 가 보이는 상태로 멈춘 뒤 수동으로 닫으면, 런타임의 재시작 시도가 overlay 표시 상태에 막히고 이후 재시작도 예약되지 않을 수 있어 Voice Wake 가 "죽은" 것처럼 보일 수 있었습니다.

강화 사항:

- Wake runtime 재시작은 더 이상 overlay 표시 상태에 막히지 않습니다.
- Overlay dismiss 완료 시 `VoiceSessionCoordinator` 를 통해 `VoiceWakeRuntime.refresh(...)` 가 트리거되므로, X 버튼으로 수동 dismiss 해도 항상 다시 listening 상태로 복귀합니다.

## Push-to-talk 세부 사항

- Hotkey 감지는 **오른쪽 Option**(`keyCode 61` + `.option`)용 전역 `.flagsChanged` monitor 를 사용합니다. 이벤트를 삼키지 않고 관찰만 합니다.
- Capture pipeline 은 `VoicePushToTalk` 에 있으며, Speech 를 즉시 시작하고 overlay 로 partial 을 스트리밍한 뒤, 키를 놓으면 `VoiceWakeForwarder` 를 호출합니다.
- Push-to-talk 가 시작되면 충돌하는 audio tap 을 피하기 위해 wake-word runtime 을 일시 중지하고, 키를 놓은 뒤 자동으로 다시 시작합니다.
- 권한: Microphone + Speech 가 필요하며, 이벤트를 보려면 Accessibility/Input Monitoring 승인이 필요합니다.
- 외장 키보드: 일부는 오른쪽 Option 을 예상대로 노출하지 않을 수 있으므로, 사용자가 누락을 보고하면 대체 shortcut 을 제공하세요.

## 사용자 설정

- **Voice Wake** 토글: wake-word runtime 을 활성화합니다.
- **Hold Cmd+Fn to talk**: push-to-talk monitor 를 활성화합니다. macOS < 26 에서는 비활성화됩니다.
- Language 및 mic picker, live level meter, trigger-word table, tester(로컬 전용, 전달하지 않음).
- Mic picker 는 장치가 분리되어도 마지막 선택을 유지하고, disconnected 힌트를 표시하며, 장치가 돌아올 때까지 일시적으로 시스템 기본값으로 fallback 합니다.
- **Sounds**: 트리거 감지 시와 전송 시 chime 을 재생하며, 기본값은 macOS "Glass" 시스템 사운드입니다. 각 이벤트마다 `NSSound` 로 로드 가능한 파일(예: MP3/WAV/AIFF)을 선택하거나 **No Sound** 를 고를 수 있습니다.

## 전달 동작

- Voice Wake 가 활성화되면 transcript 는 활성 gateway/agent 로 전달됩니다(mac 앱 나머지 부분과 동일한 로컬/원격 모드 사용).
- 응답은 **마지막으로 사용한 메인 provider**(WhatsApp/Telegram/Discord/WebChat)로 전달됩니다. 전달에 실패하면 오류를 기록하고, 실행 내역은 여전히 WebChat/session log 에서 확인할 수 있습니다.

## 전달 payload

- `VoiceWakeForwarder.prefixedTranscript(_:)` 는 전송 전에 machine hint 를 앞에 붙입니다. wake-word 와 push-to-talk 경로가 이를 공유합니다.

## 빠른 검증

- push-to-talk 를 켜고 Cmd+Fn 을 누른 채 말한 뒤 놓습니다. overlay 에 partial 이 표시된 다음 전송되어야 합니다.
- 누르고 있는 동안 menu-bar ears 는 계속 커진 상태여야 합니다(`triggerVoiceEars(ttl:nil)` 사용). 키를 놓으면 다시 내려갑니다.
