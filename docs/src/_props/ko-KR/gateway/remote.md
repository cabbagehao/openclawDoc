---
summary: "SSH 터널링 및 Tailnet을 활용한 Gateway 원격 접속 및 운영 가이드"
read_when:
  - 원격 Gateway 환경을 구축하거나 관련 문제를 해결하고자 할 때
title: "원격 액세스"
x-i18n:
  source_path: "gateway/remote.md"
---

# 원격 액세스 (SSH, 터널링 및 Tailnet)

OpenClaw는 전용 호스트(데스크톱 또는 서버)에서 실행 중인 단일 Gateway(Master)에 다양한 클라이언트를 연결하는 "원격 접속" 구성을 지원함.

* **운영자 (사용자 / macOS 앱)**: SSH 터널링이 범용적인 접속 및 폴백(Fallback) 수단임.
* **노드 기기 (iOS/Android 등)**: LAN, Tailnet 또는 SSH 터널을 통해 Gateway **WebSocket**에 직접 연결함.

## 핵심 개념

* **루프백 바인딩**: Gateway WebSocket은 기본적으로 **루프백(127.0.0.1)** 주소의 지정된 포트(기본값 `18789`)에 바인딩됨.
* **포트 포워딩**: 원격지에서 접속하려면 해당 루프백 포트를 SSH 터널링으로 포워딩하거나, Tailnet/VPN 환경을 구축하여 터널 의존도를 낮출 수 있음.

## 일반적인 원격 구성 패턴 (에이전트 구동 환경)

**Gateway 호스트**는 에이전트가 실제로 상주하는 공간임. 모든 세션 이력, 인증 프로필, 통신 채널 및 상태 데이터가 이곳에서 관리됨. 사용자의 노트북이나 노드 기기는 이 호스트에 연결하여 서비스를 이용함.

### 1) Tailnet 내 상시 가동 Gateway (VPS 또는 홈 서버)

24시간 가동되는 호스트에서 Gateway를 실행하고 **Tailscale** 또는 SSH를 통해 접근함.

* **최상의 사용자 경험(UX)**: `gateway.bind: "loopback"` 설정을 유지하고, 제어 UI 접근에는 **Tailscale Serve** 기능을 활용함.
* **폴백 수단**: 루프백 바인딩 상태를 유지하면서 접속이 필요한 기기에서 SSH 터널을 생성함.
* **구축 사례**: [exe.dev](/install/exe-dev) (간편 VM) 또는 [Hetzner](/install/hetzner) (운영용 VPS).

사용자의 노트북이 자주 절전 모드(Sleep)로 전환되더라도 에이전트를 상시 가동하고 싶을 때 가장 이상적인 방식임.

### 2) 홈 데스크톱 Gateway + 노트북 원격 제어

노트북에서는 에이전트를 직접 실행하지 않고 원격으로만 제어함.

* macOS 앱의 **원격 SSH(Remote over SSH)** 모드를 사용함 (설정 → 일반 → "OpenClaw 실행 위치" 변경).
* 앱이 터널을 자동으로 생성 및 관리하므로 WebChat이나 헬스 체크 기능이 즉시 작동함.

상세 가이드: [macOS 원격 액세스 절차](/platforms/mac/remote).

### 3) 노트북 Gateway + 외부 기기 접속

노트북에서 Gateway를 실행하되 외부에서 안전하게 접근할 수 있도록 노출함.

* 다른 기기에서 노트북으로 SSH 터널을 연결하거나,
* Tailscale Serve로 제어 UI를 공유하고 Gateway 자체는 루프백 전용으로 격리함.

관련 정보: [Tailscale 가이드](/gateway/tailscale), [웹 서비스 개요](/web).

## 명령어 및 데이터 흐름 (컴포넌트 역할)

단일 Gateway 서비스가 모든 상태와 채널을 관리하며, 노드 기기는 주변 장치(Peripherals) 역할을 수행함.

**작동 예시 (Telegram → 노드 기기):**

1. Telegram 메시지가 **Gateway** 서버에 도착함.
2. Gateway가 **에이전트**를 실행하고, 작업 수행을 위해 노드 도구 호출 여부를 결정함.
3. Gateway가 WebSocket을 통해 연결된 **노드 기기**에 명령을 전달함 (`node.*` RPC).
4. 노드 기기가 작업 결과를 반환하면, Gateway가 이를 취합하여 다시 Telegram으로 응답을 전송함.

**참고 사항:**

* **노드 기기는 Gateway 서비스를 실행하지 않음.** 의도적으로 격리된 프로필을 운영하는 경우가 아니라면 호스트당 하나의 Gateway만 실행해야 함 ([멀티 Gateway 운영](/gateway/multiple-gateways) 참조).
* macOS 앱의 "노드 모드"는 Gateway WebSocket에 연결된 하나의 노드 클라이언트일 뿐임.

## SSH 터널링 설정 (CLI 및 도구)

원격 Gateway WebSocket에 접속하기 위한 로컬 터널 생성 명령어:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

**터널 연결 후:**

* `openclaw health` 및 `openclaw status --deep` 명령이 `ws://127.0.0.1:18789`를 통해 원격 Gateway에 도달함.
* `openclaw gateway` 하위의 각종 명령 실행 시 `--url` 플래그로 포워딩된 주소를 명시할 수 있음.

*주의: `18789`는 실제 설정한 포트 번호로 변경해야 함. `--url` 사용 시 설정 파일이나 환경 변수의 인증 정보를 자동으로 참조하지 않으므로, 반드시 `--token` 또는 `--password`를 명시적으로 포함해야 함.*

## CLI 원격 접속 기본값 설정

자주 사용하는 원격 대상을 설정 파일에 저장하여 기본값으로 활용 가능함:

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      url: "ws://127.0.0.1:18789",
      token: "사용자-토큰",
    },
  },
}
```

Gateway가 루프백 전용으로 바인딩된 경우, URL은 `ws://127.0.0.1:18789`로 유지하고 명령어 실행 전 SSH 터널을 먼저 활성화해야 함.

## 자격 증명(Credential) 우선순위

Gateway 인증 정보 해석은 상태 조회, 노드 연결, 승인 모니터링 등 모든 경로에서 공통된 규칙을 따름:

* **명시적 지정 우선**: 명령줄 인자(`--token`, `--password`) 또는 도구 파라미터가 항상 최우선임.
* **URL 오버라이드 보안**: CLI에서 `--url` 사용 시, 보안을 위해 설정 파일이나 환경 변수의 암묵적인 인증 정보를 재사용하지 않음. 단, `OPENCLAW_GATEWAY_URL` 환경 변수 사용 시에는 동일한 환경 변수군(`_TOKEN` / `_PASSWORD`)의 정보만 제한적으로 사용 가능함.
* **로컬 모드 기본 순서**: `OPENCLAW_GATEWAY_TOKEN` → `gateway.auth.token` → `gateway.remote.token` 순으로 탐색함.
* **원격 모드 기본 순서**: `gateway.remote.token` → `OPENCLAW_GATEWAY_TOKEN` → `gateway.auth.token` 순으로 탐색하며, 원격 상태 조회 시에는 엄격한 검증을 위해 `gateway.remote.token`만 사용함.

## SSH 환경에서의 채팅 UI (WebChat)

WebChat은 더 이상 별도의 HTTP 포트를 요구하지 않으며, SwiftUI 기반의 채팅 UI가 직접 Gateway WebSocket에 연결함.

* 위에서 안내한 SSH 터널링(`18789` 포트 포워딩) 후 클라이언트를 `ws://127.0.0.1:18789`에 연결함.
* macOS 사용자에게는 터널을 자동으로 관리해 주는 앱의 "원격 SSH" 모드 사용을 권장함.

## 원격 접속 보안 규칙 (보안 권고)

핵심 원칙: **꼭 필요한 경우가 아니라면 Gateway는 루프백 전용(Loopback-only)으로 유지함.**

* **루프백 + SSH/Tailscale Serve**: 외부 노출 없이 가장 안전하게 운영할 수 있는 기본 조합임.
* **비암호화 WebSocket (`ws://`)**: 기본적으로 루프백 환경에서만 허용됨. 신뢰할 수 있는 사설망에서 사용해야 할 경우 클라이언트 측에서 `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` 설정을 통해 제한적으로 해제 가능함.
* **비루프백 바인딩**: `lan`, `tailnet`, `custom` 등으로 바인딩하는 경우 반드시 강력한 인증 토큰이나 비밀번호를 설정해야 함.
* **`gateway.remote.*` 설정**: 이는 클라이언트 측의 자격 증명 소스일 뿐이며, 그 자체로 서버 측의 인증을 구성하지 않음.
* **TLS 핀고정**: `wss://` 연결 시 `gateway.remote.tlsFingerprint` 설정을 통해 원격 서버의 인증서 지문을 검증함.
* **Tailscale Serve 인증**: `gateway.auth.allowTailscale: true` 설정 시 Tailscale의 ID 헤더를 통해 제어 UI 및 WebSocket 인증을 대체할 수 있음 (Gateway 호스트가 신뢰된다는 가정 하에 작동).

상세 보안 분석: [보안 가이드](/gateway/security).
