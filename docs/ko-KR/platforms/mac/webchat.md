---
summary: "macOS app이 gateway WebChat을 임베드하는 방식과 디버깅 포인트를 설명합니다."
description: "macOS menu bar app에서 WebChat이 어떤 session과 data plane을 사용하고, remote mode에서 어떻게 SSH tunnel을 거치는지 정리합니다."
read_when:
  - mac WebChat view 또는 loopback port를 디버깅할 때
title: "WebChat"
x-i18n:
  source_path: "platforms/mac/webchat.md"
---

# WebChat (macOS app)

macOS menu bar app은 WebChat UI를 native SwiftUI view로 임베드합니다. 이 view는 Gateway에 연결되며, 선택한 agent의 **main session**을 기본값으로 사용합니다. 다른 session으로 바꾸는 session switcher도 함께 제공합니다.

- **Local mode**: local Gateway WebSocket에 직접 연결합니다.
- **Remote mode**: SSH로 Gateway control port를 forward하고, 그 tunnel을 data plane으로 사용합니다.

## Launch & debugging

- 수동 실행: Lobster menu -> `"Open Chat"`
- 테스트용 자동 열기:

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --webchat
  ```

- log 확인: `./scripts/clawlog.sh` (subsystem `ai.openclaw`, category `WebChatSwiftUI`)

## How it’s wired

- data plane: Gateway WS method `chat.history`, `chat.send`, `chat.abort`, `chat.inject`와 event `chat`, `agent`, `presence`, `tick`, `health`
- session: 기본값은 primary session(`main`, scope가 global이면 `global`)이며 UI에서 session 전환 가능
- onboarding은 first-run setup을 분리하기 위해 dedicated session을 사용

## Security surface

- remote mode는 SSH를 통해 Gateway WebSocket control port만 forward합니다.

## Known limitations

- UI는 chat session에 최적화되어 있으며, full browser sandbox는 아닙니다.
