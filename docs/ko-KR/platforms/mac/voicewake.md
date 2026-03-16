---
summary: "mac app의 voice wake와 push-to-talk 모드, runtime 동작, routing 세부 사항을 설명합니다."
description: "macOS Voice Wake에서 wake-word, push-to-talk, overlay, runtime restart, forwarding 동작이 어떻게 이어지는지 정리합니다."
read_when:
  - voice wake 또는 PTT 경로를 작업할 때
title: "Voice Wake"
x-i18n:
  source_path: "platforms/mac/voicewake.md"
---

# Voice Wake & Push-to-Talk

## 모드

- **Wake-word 모드**(기본값): 항상 켜져 있는 Speech recognizer가 trigger token(`swabbleTriggerWords`)을 기다립니다. 일치하면 capture를 시작하고, partial text와 함께 overlay를 표시하며, silence 뒤 자동 전송합니다.
- **Push-to-talk(오른쪽 Option 길게 누르기)**: 오른쪽 Option 키를 길게 누르면 trigger 없이 즉시 capture합니다. 누르는 동안 overlay가 표시되며, key release 뒤 짧은 지연 후 finalize되어 전달되므로 text를 약간 수정할 수 있습니다.

## 런타임 동작(wake-word)

- Speech recognizer는 `VoiceWakeRuntime`에서 동작합니다.
- trigger는 wake word와 다음 단어 사이에 **의미 있는 pause**가 있을 때만 발동합니다(약 0.55초 간격). overlay/chime은 명령이 시작되기 전이라도 그 pause 시점에 시작될 수 있습니다.
- silence window: 음성이 계속 흐를 때 2.0초, trigger만 들렸다면 5.0초
- hard stop: runaway session 방지를 위해 120초
- session 간 debounce: 350ms
- overlay는 committed/volatile coloring과 함께 `VoiceWakeOverlayController`로 구동
- 전송 후 recognizer는 깔끔하게 다시 시작되어 다음 trigger를 기다림

## 라이프사이클 불변 조건

- Voice Wake가 활성화되어 있고 permission이 부여되어 있다면 wake-word recognizer는 항상 listening 상태여야 합니다(명시적인 push-to-talk capture 중인 경우 제외).
- overlay visibility(X 버튼을 통한 수동 dismiss 포함)는 recognizer restart를 절대 막아서는 안 됩니다.

## Sticky overlay 실패 모드(이전)

이전에는 overlay가 보이는 상태로 멈춘 뒤 수동으로 닫으면 runtime의 restart 시도가 overlay visibility에 막히고 이후 restart도 예약되지 않을 수 있어 Voice Wake가 "죽은" 것처럼 보일 수 있었습니다.

강화 사항:

- wake runtime restart는 더 이상 overlay visibility에 막히지 않습니다.
- overlay dismiss 완료 시 `VoiceSessionCoordinator`를 통해 `VoiceWakeRuntime.refresh(...)`가 trigger되므로, X 버튼으로 수동 dismiss해도 항상 다시 listening 상태로 복귀합니다.

## Push-to-talk 세부 사항

- hotkey 감지는 **오른쪽 Option**(`keyCode 61` + `.option`)용 전역 `.flagsChanged` monitor를 사용합니다. event를 삼키지 않고 관찰만 합니다.
- capture pipeline은 `VoicePushToTalk`에 있으며, Speech를 즉시 시작하고 overlay로 partial을 stream한 뒤 key release 시 `VoiceWakeForwarder`를 호출합니다.
- push-to-talk가 시작되면 충돌하는 audio tap을 피하기 위해 wake-word runtime을 일시 중지하고, release 뒤 자동으로 다시 시작합니다.
- permission: Microphone + Speech가 필요하며, event를 보려면 Accessibility/Input Monitoring 승인이 필요합니다.
- 외장 키보드: 일부는 오른쪽 Option을 예상대로 노출하지 않을 수 있으므로, 사용자가 놓친다고 보고하면 fallback shortcut을 제공하세요.

## 사용자 설정

- **Voice Wake** toggle: wake-word runtime을 활성화합니다.
- **Hold Cmd+Fn to talk**: push-to-talk monitor를 활성화합니다. macOS < 26에서는 비활성화됩니다.
- language 및 mic picker, live level meter, trigger-word table, tester(로컬 전용, 전달하지 않음)
- mic picker는 장치가 분리되어도 마지막 선택을 유지하고, disconnected hint를 표시하며, 장치가 돌아올 때까지 일시적으로 시스템 기본값으로 fallback합니다.
- **Sounds**: trigger detect 시와 send 시 chime을 재생하며, 기본값은 macOS "Glass" 시스템 사운드입니다. 각 event마다 `NSSound`로 로드 가능한 파일(예: MP3/WAV/AIFF)을 선택하거나 **No Sound**를 고를 수 있습니다.

## 전달 동작

- Voice Wake가 활성화되면 transcript는 active gateway/agent로 전달됩니다. local/remote mode는 mac app 나머지 부분과 동일합니다.
- 응답은 **마지막으로 사용한 main provider**(WhatsApp/Telegram/Discord/WebChat)로 전달됩니다. delivery가 실패하면 error를 log하고, run은 여전히 WebChat/session log에서 확인할 수 있습니다.

## 전달 payload

- `VoiceWakeForwarder.prefixedTranscript(_:)`는 전송 전에 machine hint를 앞에 붙입니다. wake-word와 push-to-talk 경로가 이를 공유합니다.

## 빠른 검증

- push-to-talk를 켜고 Cmd+Fn을 누른 채 말한 뒤 놓습니다. overlay에 partial이 표시된 다음 전송되어야 합니다.
- 누르는 동안 menu-bar ears는 계속 커진 상태여야 합니다(`triggerVoiceEars(ttl:nil)` 사용). 키를 놓으면 다시 내려갑니다.
