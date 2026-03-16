---
summary: "Gateway, node, canvas host 사이의 연결 구조를 짧게 설명합니다."
description: "OpenClaw Gateway가 channel 연결, WebSocket control plane, node 연결, canvas host를 어떤 네트워크 모델로 묶는지 빠르게 파악합니다."
read_when:
  - Gateway networking model을 짧게 확인하고 싶을 때
title: "네트워크 모델"
x-i18n:
  source_path: "gateway/network-model.md"
---

대부분의 동작은 Gateway(`openclaw gateway`)를 통해 흐릅니다. Gateway는 channel 연결과 WebSocket control plane을 소유하는 단일 장기 실행 프로세스입니다.

## 핵심 규칙

- 호스트당 Gateway는 하나를 권장합니다. WhatsApp Web session을 소유할 수 있는 프로세스는 이 Gateway뿐입니다. rescue bot이나 엄격한 격리가 필요할 때만 profile과 port를 분리해 여러 gateway를 실행하세요. 자세한 내용은 [Multiple gateways](/gateway/multiple-gateways)를 참고하세요.
- loopback 우선이 기본입니다. Gateway WS 기본값은 `ws://127.0.0.1:18789`입니다. wizard는 loopback 환경에서도 기본적으로 gateway token을 생성합니다. tailnet 접근이 필요하면 non-loopback bind에는 token이 필요하므로 `openclaw gateway --bind tailnet --token ...`을 사용하세요.
- node는 필요에 따라 LAN, tailnet, SSH를 통해 Gateway WS에 연결합니다. legacy TCP bridge는 deprecated 상태입니다.
- canvas host는 Gateway와 **같은 port**(기본값 `18789`)를 쓰는 Gateway HTTP server에서 제공됩니다.
  - `/__openclaw__/canvas/`
  - `/__openclaw__/a2ui/`
    `gateway.auth`가 설정되어 있고 Gateway가 loopback 바깥으로 bind되어 있으면 이 route들은 Gateway auth로 보호됩니다. node client는 현재 WS session에 연결된 node-scoped capability URL을 사용합니다. 자세한 내용은 [Gateway configuration](/gateway/configuration)의 `canvasHost`, `gateway` 항목을 보세요.
- 원격 사용은 보통 SSH tunnel 또는 tailnet VPN으로 구성합니다. [Remote access](/gateway/remote)와 [Discovery](/gateway/discovery)를 함께 보면 됩니다.
