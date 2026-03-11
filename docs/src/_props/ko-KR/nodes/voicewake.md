---
summary: "전역 voice wake words(Gateway 소유)와 노드 간 동기화 방식"
read_when:
  - voice wake word 동작이나 기본값을 변경할 때
  - wake word sync가 필요한 새 노드 플랫폼을 추가할 때
title: "음성 깨우기"
x-i18n:
  source_path: "nodes/voicewake.md"
---

# Voice Wake (전역 Wake Words)

OpenClaw는 **wake words를 Gateway가 소유하는 단일 전역 목록**으로 취급합니다.

* **노드별 커스텀 wake word는 없습니다.**
* **어느 노드/앱 UI에서든** 목록을 수정할 수 있으며, 변경 사항은 Gateway가 저장하고 모두에게 브로드캐스트합니다.
* macOS와 iOS는 로컬 **Voice Wake enabled/disabled** 토글을 유지합니다(로컬 UX와 권한이 다름).
* Android는 현재 Voice Wake를 끄고 Voice 탭의 수동 마이크 흐름을 사용합니다.

## 저장 위치(Gateway host)

Wake words는 gateway 머신의 다음 위치에 저장됩니다.

* `~/.openclaw/settings/voicewake.json`

형식:

```json
{ "triggers": ["openclaw", "claude", "computer"], "updatedAtMs": 1730000000000 }
```

## 프로토콜

### 메서드

* `voicewake.get` → `{ triggers: string[] }`
* `voicewake.set` with params `{ triggers: string[] }` → `{ triggers: string[] }`

참고:

* Triggers는 정규화됩니다(trim, 빈 항목 제거). 빈 목록이면 기본값으로 fallback합니다.
* 안전을 위해 개수/길이 제한이 적용됩니다.

### 이벤트

* `voicewake.changed` payload `{ triggers: string[] }`

수신 대상:

* 모든 WebSocket client(macOS app, WebChat 등)
* 모든 연결된 node(iOS/Android), 그리고 node connect 시 초기 “현재 상태” push

## 클라이언트 동작

### macOS app

* 전역 목록을 사용해 `VoiceWakeRuntime` trigger를 제어합니다.
* Voice Wake settings의 “Trigger words”를 수정하면 `voicewake.set`을 호출하고, 이후 브로드캐스트를 통해 다른 client와 동기화합니다.

### iOS node

* 전역 목록을 사용해 `VoiceWakeManager` trigger detection을 수행합니다.
* Settings에서 Wake Words를 수정하면(Gateway WS 경유) `voicewake.set`을 호출하고, 로컬 wake-word detection도 계속 반응성을 유지합니다.

### Android node

* 현재 Android runtime / Settings에서는 Voice Wake가 비활성화되어 있습니다.
* Android 음성은 wake-word trigger 대신 Voice 탭의 수동 마이크 캡처를 사용합니다.
