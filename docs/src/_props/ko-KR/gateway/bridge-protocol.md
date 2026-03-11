---
summary: "레거시 노드 전송 프로토콜인 브리지 프로토콜(TCP JSONL)의 구조, 페어링 및 역사적 배경 안내"
read_when:
  - 레거시 노드 클라이언트(구형 iOS/Android/macOS 노드)를 디버깅하거나 구조를 파악해야 할 때
  - 과거의 페어링 또는 브리지 인증 실패 사례를 조사할 때
  - 시스템에서 제거된 노드 노출 영역을 감사할 때
title: "브리지 프로토콜 (레거시)"
x-i18n:
  source_path: "gateway/bridge-protocol.md"
---

# 브리지 프로토콜 (레거시 노드 전송 계층)

브리지(Bridge) 프로토콜은 **레거시** 노드 전송 방식(TCP JSONL)임. 신규 노드 클라이언트는 이 방식 대신 통합된 [**Gateway WebSocket 프로토콜**](/gateway/protocol)을 사용해야 함.

**참고**: 최신 OpenClaw 빌드에는 TCP 브리지 리스너가 더 이상 포함되지 않음. 이 문서는 역사적 기록 및 참고 목적으로 유지됨. 설정 파일의 레거시 `bridge.*` 키 역시 현재 스키마에서 제거됨.

## 도입 배경 (역사적 관점)

과거에 WebSocket과 별도로 브리지 방식을 유지했던 이유는 다음과 같음:

* **보안 경계 설정**: 전체 Gateway API를 노출하는 대신, 노드에 필요한 최소한의 허용 목록(Allowlist)만 브리지를 통해 노출함.
* **페어링 및 노드 식별**: 노드의 접속 승인 권한은 Gateway가 가지며, 노드별 고유 토큰과 연결하여 관리함.
* **탐색 편의성(UX)**: 노드가 LAN 상에서 Bonjour를 통해 Gateway를 찾거나, Tailnet을 통해 직접 연결할 수 있는 환경 제공.
* **루프백 보호**: SSH 터널링을 사용하지 않는 한, 전체 WebSocket 제어 플레인은 로컬 호스트 내부로 격리함.

## 전송 계층 (Transport)

* **방식**: TCP 기반, 한 줄당 하나의 JSON 객체를 사용하는 JSONL 형식.
* **보안**: `bridge.tls.enabled` 설정에 따른 선택적 TLS 지원.
* **포트**: 레거시 기본 포트는 `18790`이었음 (현재 빌드에서는 사용되지 않음).

TLS 활성화 시, 탐색용 TXT 레코드에 `bridgeTls=1` 및 `bridgeTlsSha256` 정보가 포함되었음. 단, Bonjour/mDNS TXT 레코드는 인증되지 않은 정보이므로 클라이언트는 명시적인 사용자 승인 없이 광고된 지문을 신뢰해서는 안 됨.

## 핸드셰이크 및 페어링 (Handshake)

1. **Hello**: 클라이언트가 노드 메타데이터 및 토큰(이미 페어링된 경우)을 전송함.
2. **검증**: 페어링되지 않은 경우 Gateway는 `error` (`NOT_PAIRED` / `UNAUTHORIZED`)를 반환함.
3. **Pair-request**: 클라이언트가 페어링 승인을 요청함.
4. **승인 및 완료**: Gateway 관리자가 승인하면 `pair-ok` 및 `hello-ok` 프레임을 전송함.

성공 시 `serverName` 및 선택적으로 `canvasHostUrl` 정보가 반환됨.

## 데이터 프레임 구조 (Frames)

### 클라이언트 → Gateway:

* **`req` / `res`**: 범위가 제한된 Gateway RPC (채팅, 세션, 설정, 헬스, 음성 깨우기, 스킬 바이너리 등).
* **`event`**: 노드 신호 (음성 전사 데이터, 에이전트 요청, 채팅 구독, 실행 생명주기 이벤트 등).

### Gateway → 클라이언트:

* **`invoke` / `invoke-res`**: 노드 명령어 호출 (캔버스 제어, 카메라 조작, 화면 기록, 위치 정보 조회, SMS 발송 등).
* **`event`**: 구독 중인 세션의 채팅 업데이트 알림.
* **`ping` / `pong`**: 연결 유지(Keepalive) 확인.

레거시 허용 목록 강제 로직은 `src/gateway/server-bridge.ts`에 위치했으나 현재는 제거됨.

## 실행 생명주기 이벤트 (Exec Lifecycle)

노드는 `system.run` 작업 결과를 알리기 위해 `exec.finished` 또는 `exec.denied` 이벤트를 발생시킬 수 있음. 이 이벤트는 Gateway 내에서 시스템 이벤트로 매핑됨.

**페이로드 주요 필드:**

* **`sessionKey`** (필수): 이벤트를 수신할 에이전트 세션 식별자.
* **`runId`**: 그룹화를 위한 고유 실행 ID.
* **`command`**: 실행된 원시 또는 포맷된 명령어 문자열.
* **완료 상세** (`finished` 전용): `exitCode`, `timedOut`, `success`, `output`.
* **거부 사유** (`denied` 전용): `reason`.

## Tailnet 활용

* **바인딩**: `~/.openclaw/openclaw.json`의 `bridge.bind: "tailnet"` 설정을 통해 Tailnet IP에 바인딩 가능했음.
* **접속**: 클라이언트는 MagicDNS 이름이나 Tailnet IP를 통해 접속함.
* **네트워크 탐색**: Bonjour는 서브넷을 넘지 못하므로, 필요 시 수동 설정이나 광역 DNS-SD를 사용함.

## 버전 관리

브리지 프로토콜은 현재 **암묵적인 v1** 단계임 (최소/최대 버전 협상 없음). 하위 호환성 유지가 원칙이며, 중대한 변경(Breaking changes) 발생 전 프로토콜 버전 필드 도입이 필요함.
