---
summary: "mac 앱이 gateway WebChat을 임베드하는 방식과 디버그 방법"
read_when:
  - mac WebChat 뷰 또는 루프백 포트를 디버깅할 때
title: "WebChat"
---

# WebChat (macOS 앱)

macOS 메뉴 막대 앱은 WebChat UI를 네이티브 SwiftUI 뷰로 임베드합니다. 이
뷰는 Gateway에 연결되며, 선택한 에이전트의 **메인 세션**을 기본값으로
사용합니다(다른 세션을 위한 세션 전환기 포함).

- **로컬 모드**: 로컬 Gateway WebSocket에 직접 연결합니다.
- **원격 모드**: SSH를 통해 Gateway 제어 포트를 포워딩하고 그 터널을 데이터
  플레인으로 사용합니다.

## Launch & debugging

- 수동: Lobster 메뉴 → “Open Chat”.
- 테스트용 자동 열기:

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --webchat
  ```

- 로그: `./scripts/clawlog.sh` (subsystem `ai.openclaw`, category `WebChatSwiftUI`).

## How it’s wired

- 데이터 플레인: Gateway WS 메서드 `chat.history`, `chat.send`, `chat.abort`,
  `chat.inject` 및 이벤트 `chat`, `agent`, `presence`, `tick`, `health`.
- 세션: 기본적으로 기본 세션(`main`, 또는 범위가 전역일 때는 `global`)을
  사용합니다. UI에서 세션 간 전환이 가능합니다.
- 온보딩은 전용 세션을 사용하여 첫 실행 설정을 분리해 둡니다.

## Security surface

- 원격 모드는 SSH를 통해 Gateway WebSocket 제어 포트만 포워딩합니다.

## Known limitations

- UI는 채팅 세션에 최적화되어 있습니다(완전한 브라우저 샌드박스는 아님).
