---
summary: "OpenClaw Gateway, 노드 기기 및 캔버스 호스트 간의 연결 구조 안내"
read_when:
  - Gateway의 전체적인 네트워크 모델을 간결하게 파악하고자 할 때
title: "네트워크 모델"
x-i18n:
  source_path: "gateway/network-model.md"
---

OpenClaw의 대부분의 작업은 통신 채널 연결과 WebSocket 제어 플레인을 관리하는 단일 장기 실행 프로세스인 **Gateway** (`openclaw gateway`)를 통해 처리됨.

## 핵심 규칙

* **호스트당 단일 인스턴스 권장**: Gateway는 WhatsApp Web 세션을 소유할 수 있는 유일한 프로세스임. 장애 대비용 레스큐 봇(Rescue bot)이나 엄격한 데이터 격리가 필요한 경우에만 프로필과 포트를 분리하여 여러 인스턴스를 실행함 ([멀티 Gateway 운영](/gateway/multiple-gateways) 참조).
* **루프백(Loopback) 우선 정책**: Gateway WebSocket은 기본적으로 `ws://127.0.0.1:18789`에서 대기함. 초기 설정 마법사는 루프백 환경에서도 보안을 위해 기본적으로 인증 토큰을 생성함. Tailnet 접근 시에는 비루프백 바인딩이 필수이므로 `openclaw gateway --bind tailnet --token ...` 형식을 사용함.
* **노드 연결 방식**: 노드 기기는 환경에 따라 LAN, Tailnet 또는 SSH 터널링을 통해 Gateway WebSocket에 접속함. 레거시 TCP 브리지 방식은 사용이 권장되지 않음.
* **캔버스(Canvas) 호스트 서비스**: Gateway HTTP 서버는 Gateway와 **동일한 포트**(기본값 `18789`)를 통해 다음 경로를 제공함:
  * `/__openclaw__/canvas/`
  * `/__openclaw__/a2ui/`
  * `gateway.auth`가 설정되어 있고 루프백 외부로 바인딩된 경우, 위 경로들은 Gateway 인증에 의해 보호됨. 노드 클라이언트는 활성 WebSocket 세션에 결합된 노드 전용 역량 URL(Capability URL)을 사용하여 접근함 ([Gateway 설정 가이드](/gateway/configuration)의 `canvasHost`, `gateway` 섹션 참조).
* **원격 접속**: 주로 SSH 터널링이나 Tailnet VPN을 활용함 ([원격 액세스](/gateway/remote) 및 [탐색](/gateway/discovery) 참조).
