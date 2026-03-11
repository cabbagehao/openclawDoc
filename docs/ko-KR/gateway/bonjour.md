---
summary: "Bonjour/mDNS 탐색 가이드: Gateway 비컨 설정, 클라이언트 연결 및 문제 해결 방법 안내"
read_when:
  - macOS/iOS 환경에서 Bonjour 탐색 관련 문제를 디버깅할 때
  - mDNS 서비스 유형, TXT 레코드 또는 탐색 UX 설정을 변경하고자 할 때
title: "Bonjour 탐색"
x-i18n:
  source_path: "gateway/bonjour.md"
---

# Bonjour / mDNS 탐색 (Discovery)

OpenClaw는 활성화된 Gateway(WebSocket 엔드포인트)를 찾기 위한 **LAN 전용 편의 기능**으로 Bonjour(mDNS / DNS-SD)를 사용함. 이는 최선 노력(Best-effort) 방식의 기능이며, SSH 터널링이나 Tailnet 기반의 직접 연결을 완전히 대체하지는 않음.

## Tailscale 기반 광역 Bonjour (Unicast DNS-SD)

노드와 Gateway가 서로 다른 네트워크에 위치한 경우 멀티캐스트 mDNS는 네트워크 경계를 넘을 수 없음. 이때 Tailscale 망 위에서 **유니캐스트 DNS-SD**("Wide-Area Bonjour")로 전환하면 동일한 탐색 경험을 유지할 수 있음.

**핵심 구축 단계:**

1. **DNS 서버 가동**: Gateway 호스트에서 DNS 서버를 실행함 (Tailnet 주소를 통해 접근 가능해야 함).
2. **레코드 게시**: 전용 존(Zone, 예: `openclaw.internal.`) 하위에 `_openclaw-gw._tcp`용 DNS-SD 레코드를 게시함.
3. **분할 DNS(Split DNS) 설정**: 클라이언트(iOS 포함)가 해당 DNS 서버를 통해 도메인을 해석하도록 Tailscale 관리 콘솔에서 설정함.

OpenClaw는 모든 탐색 도메인을 지원함. `openclaw.internal.`은 예시이며, iOS/Android 노드는 `local.` 존과 사용자가 설정한 광역 도메인을 모두 스캔함.

### Gateway 설정 (권장)

```json5
{
  gateway: { bind: "tailnet" }, // Tailnet 전용 바인딩 (권장)
  discovery: { wideArea: { enabled: true } }, // 광역 DNS-SD 게시 활성화
}
```

### DNS 서버 초기 설정 (Gateway 호스트)

```bash
openclaw dns setup --apply
```

이 명령어는 CoreDNS를 설치하고 다음과 같이 구성함:
- Gateway의 Tailscale 인터페이스 포트 53에서만 수신 대기.
- 지정된 도메인(예: `openclaw.internal.`) 정보를 `~/.openclaw/dns/<domain>.db` 파일로부터 서비스함.

**Tailnet 연결 기기에서의 검증 방법:**
```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Tailscale DNS 설정

Tailscale 관리자 콘솔(Admin Console)에서:
- Gateway의 Tailnet IP를 가리키는 네임서버(Nameserver)를 추가함 (UDP/TCP 53).
- 설정한 탐색 도메인이 해당 네임서버를 사용하도록 **Split DNS**를 구성함.

클라이언트가 Tailnet DNS 설정을 수용하면, iOS 노드는 멀티캐스트 없이도 지정된 도메인 내에서 `_openclaw-gw._tcp` 서비스를 찾을 수 있게 됨.

### Gateway 리스너 보안 (권장)

Gateway WebSocket 포트(기본값: `18789`)는 기본적으로 루프백(`127.0.0.1`)에 바인딩됨. LAN이나 Tailnet 접근을 허용하려면 명시적인 바인딩 설정과 함께 인증 기능을 반드시 유지해야 함.

**Tailnet 전용 구성 예시:**
- `~/.openclaw/openclaw.json` 파일에 `gateway.bind: "tailnet"` 설정 적용.
- Gateway 서버 또는 macOS 메뉴 막대 앱을 재시작함.

## 광고 주체 (Advertising)

시스템 내에서 `_openclaw-gw._tcp` 서비스를 광고하는 주체는 **Gateway** 서버가 유일함.

## 서비스 유형 (Service Types)

- **`_openclaw-gw._tcp`**: Gateway 전송 비컨. macOS, iOS, Android 노드 기기에서 서버를 찾는 데 사용됨.

## TXT 레코드 키 (비밀 정보가 아닌 힌트)

Gateway는 사용자 편의를 위해 다음과 같은 메타데이터를 TXT 레코드에 포함하여 광고함:

- `role=gateway`: 서비스 역할.
- `displayName=<이름>`: UI에 표시될 서버 이름.
- `lanHost=<호스트명>.local`: 로컬 호스트 주소.
- `gatewayPort=<포트>`: Gateway WebSocket 및 HTTP 포트.
- `gatewayTls=1`: TLS 활성화 여부.
- `gatewayTlsSha256=<sha256>`: TLS 인증서 지문 (사용 가능한 경우).
- `canvasPort=<포트>`: 캔버스 호스트 포트 (현재 Gateway 포트와 동일).
- `sshPort=<포트>`: SSH 포트 (기본값: 22).
- `transport=gateway`: 전송 방식 정보.
- `cliPath=<경로>`: (선택 사항) 실행 가능한 `openclaw` 엔트리포인트의 절대 경로.
- `tailnetDns=<magicdns>`: (선택 사항) Tailnet 사용 시의 매직 DNS 정보.

**보안 주의 사항:**
- Bonjour/mDNS TXT 레코드는 **인증되지 않은** 정보임. 클라이언트는 TXT 정보를 신뢰할 수 있는 최종 라우팅 정보로 취급해서는 안 됨.
- 클라이언트는 반드시 해석된 서비스 엔드포인트(SRV + A/AAAA) 주소를 기준으로 연결해야 함. `lanHost`, `tailnetDns` 등은 단순 힌트로만 활용함.
- TLS 핀고정(Pinning) 시, 광고된 지문(`gatewayTlsSha256`)이 기존에 저장된 핀 정보를 자동으로 덮어쓰게 해서는 안 됨.
- iOS/Android 노드는 탐색 기반의 직접 연결을 항상 **TLS 전용**으로 취급해야 하며, 최초 연결 시 지문에 대한 명시적인 사용자 승인을 받아야 함.

## macOS에서의 디버깅

터미널 내장 도구 활용:

- **인스턴스 탐색 (Browse)**:
  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- **특정 인스턴스 해석 (Resolve)**:
  ```bash
  dns-sd -L "<인스턴스명>" _openclaw-gw._tcp local.
  ```

탐색은 되지만 해석(Resolve)이 실패하는 경우, 대개 네트워크 정책에 의해 차단되었거나 mDNS 해석기(Resolver) 문제일 가능성이 높음.

## Gateway 로그 확인

Gateway는 순환 로그 파일(`gateway log file: ...`)을 기록함. `bonjour:` 키워드가 포함된 라인을 추적함:

- `bonjour: advertise failed ...`: 광고 실행 실패.
- `bonjour: ... name conflict resolved`: 이름 충돌 해결 내역.
- `bonjour: watchdog detected non-announced service ...`: 감시 도구가 미공고 서비스를 감지함.

## iOS 노드 디버깅

iOS 노드는 `NWBrowser` 프레임워크를 사용하여 서비스를 탐색함.

**로그 수집 절차:**
1. **Settings** → **Gateway** → **Advanced** → **Discovery Debug Logs** 활성화.
2. 동일 메뉴의 **Discovery Logs** 진입 → 문제 재현 → **Copy** 클릭 후 전송.

로그에는 브라우저 상태 전이 및 검색 결과 변화 내역이 포함됨.

## 일반적인 실패 원인

- **네트워크 경계 문제**: Bonjour는 기본적으로 서브넷을 넘지 못함. Tailnet이나 SSH 터널을 사용함.
- **멀티캐스트 차단**: 일부 공용 Wi-Fi 환경은 보안을 위해 mDNS 통신을 차단함.
- **잠자기 모드 및 인터페이스 변경**: macOS가 일시적으로 mDNS 정보를 놓칠 수 있음. 잠시 후 다시 시도함.
- **해석 실패 (Resolve failure)**: 기기 이름에 이모지나 특수문자가 포함된 경우 일부 해석기가 혼란을 겪을 수 있음. 이름을 단순하게 수정하고 Gateway를 재시작함.

## 이스케이프된 인스턴스 이름 (`\032`)

Bonjour/DNS-SD 명세에 따라 서비스 이름 내의 공백 등은 `\032`와 같은 10진수 이스케이프 시퀀스로 표현될 수 있음. 이는 프로토콜 레벨의 정상적인 동작이며, UI 표시 시에는 이를 디코딩하여 보여주어야 함.

## 비활성화 및 상세 설정

- **`OPENCLAW_DISABLE_BONJOUR=1`**: 서비스 공고 기능을 완전히 비활성화함.
- **`gateway.bind`**: Gateway의 네트워크 바인딩 모드 제어.
- **`OPENCLAW_SSH_PORT`**: TXT 레코드에 공고할 SSH 포트 번호 오버라이드.
- **`OPENCLAW_TAILNET_DNS`**: TXT 레코드에 매직 DNS 힌트 주입.
- **`OPENCLAW_CLI_PATH`**: 공고되는 CLI 실행 경로 오버라이드.

## 관련 문서 목록

- 탐색 정책 및 전송 계층 선택: [Discovery](/gateway/discovery)
- 노드 페어링 및 승인 절차: [Gateway pairing](/gateway/pairing)
