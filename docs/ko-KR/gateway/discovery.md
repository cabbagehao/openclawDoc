---
description: Gateway를 찾기 위한 Bonjour, Tailscale, SSH 기반 탐색과 전송 정책, 페어링 흐름을 설명합니다
summary: "Gateway 탐색 및 전송 계층(Bonjour, Tailscale, SSH) 가이드"
read_when:
  - Bonjour 탐색/공고 기능을 구현하거나 수정할 때
  - 원격 연결 방식(Direct vs SSH)을 조정하고자 할 때
  - 원격 노드용 탐색 및 페어링 프로세스를 설계할 때
title: "탐색 및 전송"
x-i18n:
  source_path: "gateway/discovery.md"
---

# 탐색 및 전송 계층

OpenClaw에는 겉보기엔 비슷하지만 실제로는 성격이 다른 두 가지 연결 문제가 있습니다.

1. **운영자 원격 제어**: macOS 메뉴 막대 앱이 원격지에 실행 중인 Gateway를 제어하는 경우.
2. **노드 페어링**: iOS/Android(및 향후 추가될 노드) 기기가 Gateway를 찾아 안전하게 페어링하는 경우.

설계 목표는 모든 네트워크 탐색 및 공고 기능을 **Node Gateway**(`openclaw gateway`)에 두고, 클라이언트(macOS 앱, iOS 등)는 이를 소비하는 역할만 맡도록 하는 것입니다.

## 용어

- **Gateway**: 상태(세션, 페어링, node registry)를 관리하고 채널을 실행하는 단일 장기 실행 프로세스입니다. 대부분의 구성은 호스트당 하나를 사용하며, 격리된 multi-gateway 구성이 필요한 경우도 있습니다.
- **Gateway WS (제어 플레인)**: 기본값 `127.0.0.1:18789`에서 대기하는 WebSocket 엔드포인트입니다. `gateway.bind` 설정으로 LAN 또는 tailnet에 바인딩할 수 있습니다.
- **Direct WS 전송**: SSH 터널링 없이 LAN/Tailnet을 통해 직접 노출된 Gateway WebSocket 엔드포인트.
- **SSH 전송 (폴백)**: SSH 포워딩을 통해 `127.0.0.1:18789` 포트에 접속하여 원격 제어를 수행하는 방식.
- **레거시 TCP bridge (deprecated/removed)**: 과거 node transport([브리지 프로토콜](/gateway/bridge-protocol) 참조). 현재는 discovery 대상으로 advertise하지 않습니다.

프로토콜 상세:
- [Gateway 프로토콜](/gateway/protocol)
- [브리지 프로토콜(레거시)](/gateway/bridge-protocol)

## Direct 전송과 SSH를 병행하는 이유

- **Direct WS**는 같은 네트워크나 tailnet 안에서 가장 좋은 UX를 제공합니다.
  - Bonjour를 통한 LAN 내 자동 탐색 지원.
  - Gateway가 페어링 토큰 및 ACL(접근 제어 목록)을 직접 관리.
  - 셸 접근 권한이 필요 없으며, 노출되는 프로토콜 표면을 최소화하여 보안 감사에 유리함.
- **SSH**는 범용 fallback 역할을 합니다.
  - SSH 접근만 가능하다면 네트워크 경계를 넘어 어디서든 동작함.
  - 멀티캐스트(mDNS) 통신이 제한된 환경에서도 안정적임.
  - SSH 외에 별도의 인바운드 포트를 개방할 필요가 없음.

## 탐색 입력 소스 (Gateway 위치 식별 방법)

### 1) Bonjour / mDNS (LAN 전용)

Bonjour는 best-effort 방식이며 네트워크 경계를 넘지 못합니다. 오직 "같은 LAN"에서의 편의를 위해 사용됩니다.

동작 방향:
- **Gateway**는 Bonjour를 통해 자신의 WebSocket 엔드포인트를 공고합니다.
- 클라이언트는 이를 browse하여 "Gateway 선택" 목록을 보여 주고, 사용자가 선택한 엔드포인트를 저장합니다.

상세 내용 및 트러블슈팅: [Bonjour](/gateway/bonjour)

#### 서비스 비컨(Beacon) 상세 정보

- **서비스 유형**: `_openclaw-gw._tcp` (Gateway 전송 비컨)
- **TXT 레코드 키 (비밀 정보 아님)**:
  - `role=gateway`: 서비스 역할.
  - `lanHost=<호스트명>.local`: 로컬 호스트 주소.
  - `sshPort=22`: 공고된 SSH 포트.
  - `gatewayPort=18789`: Gateway WebSocket 및 HTTP 포트.
  - `gatewayTls=1`: TLS 활성화 시 포함.
  - `gatewayTlsSha256=<sha256>`: TLS 인증서 지문 (사용 가능한 경우).
  - `canvasPort=<포트>`: 캔버스 호스트 포트 (활성화 시 `gatewayPort`와 동일).
  - `cliPath=<경로>`: 실행 가능한 `openclaw` 엔트리포인트의 절대 경로 (선택 사항).
  - `tailnetDns=<magicdns>`: Tailscale 사용 시 자동 감지된 매직 DNS 힌트 (선택 사항).

보안 참고:
- Bonjour/mDNS TXT 레코드는 **인증되지 않은 정보**임. 클라이언트는 이를 단순한 UX 힌트로만 간주해야 함.
- 실제 라우팅(호스트/포트) 결정 시에는 TXT 레코드 값보다 **해석된 서비스 엔드포인트**(SRV + A/AAAA) 정보를 우선적으로 신뢰해야 함.
- TLS 핀고정(Pinning) 시, 공고된 지문(`gatewayTlsSha256`)이 기존에 저장된 정보를 자동으로 덮어쓰게 해서는 안 됨.
- iOS/Android 노드는 탐색 기반의 직접 연결을 **TLS 전용**으로 취급해야 하며, 최초 연결 시 지문에 대한 명시적인 사용자 승인 절차를 거쳐야 함.

**비활성화 및 오버라이드:**
- `OPENCLAW_DISABLE_BONJOUR=1`: 공고 기능을 비활성화함.
- `gateway.bind`: `~/.openclaw/openclaw.json` 설정 파일에서 바인딩 모드를 제어함.
- `OPENCLAW_SSH_PORT`: TXT 레코드에 공고할 SSH 포트를 변경함 (기본값 22).
- `OPENCLAW_TAILNET_DNS`: 매직 DNS 힌트(`tailnetDns`)를 게시함.
- `OPENCLAW_CLI_PATH`: 공고되는 CLI 실행 경로를 변경함.

### 2) Tailnet (광역 네트워크)

멀리 떨어진 환경에서는 Bonjour가 도움이 되지 않습니다. 이때 권장되는 직접 연결 대상은 다음과 같습니다.
- **Tailscale 매직 DNS** 이름 (권장) 또는 고정된 **Tailnet IP**.

Gateway가 Tailscale 환경임을 감지하면, 클라이언트를 위한 선택적 힌트(광역 비컨 포함)로 `tailnetDns` 정보를 게시함.

### 3) 수동 설정 및 SSH 대상

직접 연결이 불가능하거나 비활성화된 경우, 클라이언트는 언제든지 loopback Gateway 포트를 SSH 터널링으로 전달해 연결할 수 있습니다.

상세 내용: [원격 액세스](/gateway/remote)

## 전송 방식 선택 정책 (클라이언트 측)

권장되는 클라이언트 동작 순서:

1. 이미 페어링된 직접 연결 엔드포인트가 설정되어 있고 도달 가능하다면 해당 경로를 사용함.
2. 그렇지 않고 Bonjour가 LAN에서 Gateway를 발견했다면, "이 Gateway 사용" 선택지를 제공하고 이를 직접 연결 엔드포인트로 저장함.
3. 직접 연결 엔드포인트가 없지만 Tailnet DNS/IP가 설정되어 있다면 직접 연결을 시도함.
4. 모든 시도가 실패할 경우 SSH 방식으로 폴백함.

## 페어링 및 인증 (Direct 전송)

Gateway는 노드와 클라이언트의 접속 허용 여부를 판단하는 source of truth입니다.

- 페어링 요청은 Gateway에서 생성, 승인 또는 거부됨 ([Gateway 페어링](/gateway/pairing) 참조).
- Gateway는 다음 보안 정책을 강제함:
  - 인증 (토큰 또는 키 쌍).
  - 범위(Scope) 및 ACL 제어 (Gateway는 단순한 프록시가 아니며 허용된 메서드만 노출함).
  - 속도 제한 (Rate limit).

## 컴포넌트별 역할 및 책임

- **Gateway**: 탐색 비컨을 공고하고, 페어링 결정을 내리며, WebSocket 엔드포인트를 호스팅합니다.
- **macOS 앱**: Gateway 선택을 돕고 페어링 프롬프트를 표시하며, 필요할 때만 SSH를 폴백으로 사용합니다.
- **iOS/Android 노드**: 편의를 위해 Bonjour를 browse하고, 페어링된 Gateway WebSocket에 연결합니다.
