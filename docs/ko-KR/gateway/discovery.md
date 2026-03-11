---
summary: "gateway를 찾기 위한 노드 디스커버리와 전송 계층(Bonjour, Tailscale, SSH)"
read_when:
  - Bonjour discovery/advertising을 구현하거나 변경할 때
  - 원격 연결 방식(direct vs SSH)을 조정할 때
  - 원격 노드용 discovery + pairing을 설계할 때
title: "디스커버리와 전송 계층"
---

# 디스커버리와 전송 계층

OpenClaw에는 겉으로 비슷해 보여도 실제로는 다른 두 가지 문제가 있습니다.

1. **운영자 원격 제어**: macOS 메뉴 막대 앱이 다른 곳에서 실행 중인 gateway를 제어하는 문제
2. **노드 페어링**: iOS/Android(및 향후 노드)가 gateway를 찾아 안전하게 페어링하는 문제

설계 목표는 네트워크 discovery/advertising을 모두 **Node Gateway** (`openclaw gateway`) 에 두고, 클라이언트(mac 앱, iOS)는 이를 소비하는 역할만 하게 하는 것입니다.

## 용어

- **Gateway**: 상태(세션, 페어링, 노드 레지스트리)를 소유하고 채널을 실행하는 단일 장기 실행 gateway 프로세스. 대부분의 환경은 호스트당 하나를 사용하지만, 격리된 multi-gateway 구성도 가능
- **Gateway WS (control plane)**: 기본적으로 `127.0.0.1:18789` 의 WebSocket endpoint; `gateway.bind` 로 LAN/tailnet에 bind 가능
- **Direct WS transport**: LAN/tailnet을 향하는 Gateway WS endpoint(SSH 없음)
- **SSH transport (fallback)**: SSH를 통해 `127.0.0.1:18789` 를 포워딩해 원격 제어
- **Legacy TCP bridge (deprecated/removed)**: 이전 노드 전송 방식([Bridge protocol](/gateway/bridge-protocol) 참고); 더 이상 discovery에 광고되지 않음

프로토콜 세부 사항:

- [Gateway protocol](/gateway/protocol)
- [Bridge protocol (legacy)](/gateway/bridge-protocol)

## “direct”와 SSH를 둘 다 유지하는 이유

- **Direct WS** 는 같은 네트워크와 tailnet 안에서 UX가 가장 좋습니다.
  - Bonjour를 통한 LAN 자동 discovery
  - gateway가 pairing token과 ACL을 소유
  - shell 접근이 필요 없고, 프로토콜 표면을 더 좁고 감사 가능하게 유지 가능
- **SSH** 는 보편적인 fallback입니다.
  - SSH 접근만 있으면 어디서든 동작(서로 다른 네트워크를 넘어도 가능)
  - multicast/mDNS 문제가 있어도 버팀
  - SSH 외에 새로운 inbound port가 필요 없음

## 디스커버리 입력(클라이언트가 gateway 위치를 아는 방법)

### 1) Bonjour / mDNS (LAN 전용)

Bonjour는 best-effort이며 네트워크를 넘지 않습니다. "같은 LAN" 편의를 위해서만 사용됩니다.

목표 방향:

- **gateway** 가 Bonjour로 자신의 WS endpoint를 광고
- 클라이언트는 browse해서 "gateway 선택" 목록을 보여주고, 선택된 endpoint를 저장

문제 해결과 beacon 세부 사항: [Bonjour](/gateway/bonjour)

#### 서비스 beacon 세부 사항

- 서비스 타입:
  - `_openclaw-gw._tcp` (gateway transport beacon)
- TXT 키(비밀 아님):
  - `role=gateway`
  - `lanHost=<hostname>.local`
  - `sshPort=22` (또는 광고된 값)
  - `gatewayPort=18789` (Gateway WS + HTTP)
  - `gatewayTls=1` (TLS가 켜진 경우만)
  - `gatewayTlsSha256=<sha256>` (TLS가 켜져 있고 fingerprint를 알 수 있을 때만)
  - `canvasPort=<port>` (canvas host 포트; 현재 canvas host가 켜져 있으면 `gatewayPort` 와 동일)
  - `cliPath=<path>` (선택 사항; 실행 가능한 `openclaw` entrypoint 또는 binary의 절대 경로)
  - `tailnetDns=<magicdns>` (선택 사항; Tailscale 사용 가능 시 자동 감지)

보안 메모:

- Bonjour/mDNS TXT record는 **인증되지 않습니다**. 클라이언트는 TXT 값을 UX 힌트로만 취급해야 합니다.
- 라우팅(host/port)은 TXT의 `lanHost`, `tailnetDns`, `gatewayPort` 보다 **해석된 서비스 endpoint**(SRV + A/AAAA)를 우선해야 합니다.
- TLS pinning에서는 광고된 `gatewayTlsSha256` 이 기존에 저장된 pin을 절대로 덮어쓰면 안 됩니다.
- iOS/Android 노드는 discovery 기반 direct connect를 **TLS 전용**으로 취급하고, 최초 pin 저장 전 "이 fingerprint를 신뢰할지"를 명시적으로 확인해야 합니다(out-of-band 검증).

비활성화/override:

- `OPENCLAW_DISABLE_BONJOUR=1` 은 advertising을 비활성화
- `~/.openclaw/openclaw.json` 의 `gateway.bind` 가 Gateway bind 모드를 제어
- `OPENCLAW_SSH_PORT` 는 TXT에 광고되는 SSH 포트를 override(기본값 22)
- `OPENCLAW_TAILNET_DNS` 는 `tailnetDns` 힌트를 publish(MagicDNS)
- `OPENCLAW_CLI_PATH` 는 광고되는 CLI 경로를 override

### 2) Tailnet (네트워크 간)

London/Vienna 스타일 환경에서는 Bonjour가 도움이 되지 않습니다. 권장되는 "direct" 대상은:

- Tailscale MagicDNS 이름(권장) 또는 안정적인 tailnet IP

gateway가 Tailscale 아래에서 동작 중임을 감지할 수 있으면, 클라이언트용 선택적 힌트(광역 beacon 포함)로 `tailnetDns` 를 publish합니다.

### 3) 수동 / SSH 대상

direct 경로가 없거나(direct 비활성화 포함) 사용할 수 없으면, 클라이언트는 언제든 loopback gateway 포트를 SSH로 포워딩해 연결할 수 있습니다.

[원격 액세스](/gateway/remote) 를 참고하세요.

## 전송 선택(클라이언트 정책)

권장 클라이언트 동작:

1. 페어링된 direct endpoint가 구성되어 있고 도달 가능하면 그것을 사용
2. 아니면 Bonjour가 LAN에서 gateway를 찾을 때 "이 gateway 사용" 원탭 선택지를 제공하고 direct endpoint로 저장
3. 아니면 tailnet DNS/IP가 구성되어 있으면 direct 시도
4. 아니면 SSH로 fallback

## 페어링 + 인증 (direct transport)

gateway가 node/client admission의 진실 소스입니다.

- 페어링 요청은 gateway에서 생성/승인/거부됩니다([Gateway pairing](/gateway/pairing) 참고).
- gateway는 다음을 강제합니다.
  - 인증(token / keypair)
  - scope/ACL(gateway는 모든 메서드에 대한 raw proxy가 아님)
  - rate limit

## 컴포넌트별 책임

- **Gateway**: discovery beacon 광고, pairing 결정 소유, WS endpoint 호스팅
- **macOS app**: gateway 선택을 돕고 pairing prompt를 보여주며 SSH는 fallback으로만 사용
- **iOS/Android nodes**: 편의를 위해 Bonjour를 browse하고, 페어링된 Gateway WS에 연결
