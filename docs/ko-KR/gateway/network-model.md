---
summary: "Gateway, 노드, 캔버스 호스트가 어떻게 연결되는지 설명합니다."
read_when:
  - Gateway 네트워킹 모델을 간단히 파악하고 싶다
title: "네트워크 모델"
---

대부분의 작업은 채널 연결과 WebSocket 제어 플레인을 소유하는 단일 장기 실행
프로세스인 Gateway(`openclaw gateway`)를 통해 흐릅니다.

## 핵심 규칙

- 호스트당 하나의 Gateway를 권장합니다. WhatsApp Web 세션을 소유할 수 있는 유일한 프로세스입니다. 복구 봇이나 엄격한 격리가 필요한 경우, 프로필과 포트를 분리한 여러 Gateway를 실행하세요. [여러 Gateway](/gateway/multiple-gateways)를 참고하세요.
- 루프백 우선: Gateway WS의 기본값은 `ws://127.0.0.1:18789`입니다. 마법사는 루프백의 경우에도 기본적으로 gateway 토큰을 생성합니다. tailnet 액세스의 경우 비루프백 바인드에는 토큰이 필요하므로 `openclaw gateway --bind tailnet --token ...`을 실행하세요.
- 필요에 따라 노드는 LAN, tailnet 또는 SSH를 통해 Gateway WS에 연결합니다. 레거시 TCP 브리지는 더 이상 사용이 권장되지 않습니다.
- 캔버스 호스트는 Gateway와 **같은 포트**(기본값 `18789`)의 Gateway HTTP 서버에서 제공됩니다.
  - `/__openclaw__/canvas/`
  - `/__openclaw__/a2ui/`
    `gateway.auth`가 구성되어 있고 Gateway가 루프백을 넘어 바인드되면, 이 경로들은 Gateway 인증으로 보호됩니다. 노드 클라이언트는 활성 WS 세션에 연결된 노드 범위 capability URL을 사용합니다. [Gateway 구성](/gateway/configuration)의 `canvasHost`, `gateway`를 참고하세요.
- 원격 사용은 보통 SSH 터널 또는 tailnet VPN을 사용합니다. [원격 액세스](/gateway/remote) 및 [디스커버리](/gateway/discovery)를 참고하세요.
