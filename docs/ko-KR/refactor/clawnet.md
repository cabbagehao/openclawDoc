---
summary: "Clawnet 리팩터링: 네트워크 프로토콜, 역할, 인증, 승인, 아이덴티티 통합"
read_when:
  - 노드 + 운영자 클라이언트를 위한 통합 네트워크 프로토콜을 설계할 때
  - 디바이스 전반의 승인, pairing, TLS, presence를 다시 설계할 때
title: "Clawnet 리팩터링"
x-i18n:
  source_path: "refactor/clawnet.md"
---

# Clawnet 리팩터링 (프로토콜 + 인증 통합)

## 안녕하세요

안녕하세요 Peter, 훌륭한 방향입니다. 더 단순한 UX와 더 강한 보안을 함께 열어 줍니다.

## 목적

다음을 위한 단일하고 엄밀한 문서입니다.

- 현재 상태: 프로토콜, 흐름, 신뢰 경계.
- 문제점: 승인, multi-hop 라우팅, UI 중복.
- 제안하는 새 상태: 하나의 프로토콜, 범위가 지정된 역할, 통합 인증/pairing, TLS pinning.
- 아이덴티티 모델: 안정적인 ID + 귀여운 slug.
- 마이그레이션 계획, 리스크, 열린 질문.

## 목표 (논의에서 도출)

- 모든 클라이언트(mac app, CLI, iOS, Android, headless node)에 하나의 프로토콜 사용.
- 모든 네트워크 참여자는 인증되고 pair 되어야 함.
- 역할 명확화: node vs operator.
- 중앙 승인 로직을 사용자가 있는 위치로 라우팅.
- 모든 원격 트래픽에 TLS 암호화 + 선택적 pinning 적용.
- 코드 중복 최소화.
- 단일 머신은 한 번만 나타나야 함(UI/node 중복 항목 없음).

## 비목표 (명시적)

- capability 분리를 제거하지 않음(최소 권한은 계속 필요).
- scope 검사 없이 gateway 전체 control plane을 노출하지 않음.
- 사람 친화 라벨에 인증을 의존하게 만들지 않음(slug는 보안 요소가 아님).

---

# 현재 상태 (as-is)

## 두 가지 프로토콜

### 1) Gateway WebSocket (control plane)

- 전체 API 표면: config, channel, model, session, agent run, log, node 등.
- 기본 bind: loopback. 원격 접근은 SSH/Tailscale 사용.
- 인증: `connect`를 통한 token/password.
- TLS pinning 없음(loopback/tunnel에 의존).
- 코드:
  - `src/gateway/server/ws-connection/message-handler.ts`
  - `src/gateway/client.ts`
  - `docs/gateway/protocol.md`

### 2) Bridge (node transport)

- 좁은 allowlist 표면, node 아이덴티티 + pairing 제공.
- TCP 위 JSONL, 선택적 TLS + 인증서 fingerprint pinning.
- TLS는 discovery TXT에 fingerprint를 광고.
- 코드:
  - `src/infra/bridge/server/connection.ts`
  - `src/gateway/server-bridge.ts`
  - `src/node-host/bridge-client.ts`
  - `docs/gateway/bridge-protocol.md`

## 현재 control plane 클라이언트

- CLI -> `callGateway`를 통해 Gateway WS 사용 (`src/gateway/call.ts`).
- macOS app UI -> Gateway WS (`GatewayConnection`).
- Web Control UI -> Gateway WS.
- ACP -> Gateway WS.
- 브라우저 제어는 자체 HTTP control server 사용.

## 현재 node

- node 모드의 macOS app이 Gateway bridge에 연결 (`MacNodeBridgeSession`).
- iOS/Android app이 Gateway bridge에 연결.
- pairing + node별 token은 gateway에 저장.

## 현재 승인 흐름 (exec)

- Agent가 Gateway를 통해 `system.run` 사용.
- Gateway가 bridge를 통해 node를 호출.
- Node runtime이 승인 여부를 결정.
- UI 프롬프트는 mac app이 표시(node == mac app일 때).
- Node가 `invoke-res`를 Gateway에 반환.
- multi-hop 구조이며 UI가 node host에 묶여 있음.

## 현재 presence + 아이덴티티

- Gateway presence 항목은 WS 클라이언트에서 생성.
- Node presence 항목은 bridge에서 생성.
- mac app은 같은 머신에 대해 두 개의 항목(UI + node)을 표시할 수 있음.
- Node 아이덴티티는 pairing store에 저장되고, UI 아이덴티티는 별도 관리.

---

# 문제점 / pain point

- 유지해야 할 프로토콜 스택이 두 개임(WS + Bridge).
- 원격 node 승인: 프롬프트가 사용자가 있는 곳이 아니라 node host에 표시됨.
- TLS pinning은 bridge에만 존재하며, WS는 SSH/Tailscale에 의존.
- 아이덴티티 중복: 같은 머신이 여러 인스턴스로 표시됨.
- 역할이 모호함: UI + node + CLI capability가 명확히 분리되지 않음.

---

# 제안하는 새 상태 (Clawnet)

## 하나의 프로토콜, 두 개의 역할

역할 + scope를 가진 단일 WS 프로토콜.

- **Role: node** (capability host)
- **Role: operator** (control plane)
- 선택적 **scope** for operator:
  - `operator.read` (상태 + 조회)
  - `operator.write` (agent run, send)
  - `operator.admin` (config, channel, model)

### 역할별 동작

**Node**

- capability(`caps`, `commands`, permissions)를 등록할 수 있음.
- `invoke` 명령(`system.run`, `camera.*`, `canvas.*`, `screen.record` 등)을 받을 수 있음.
- `voice.transcript`, `agent.request`, `chat.subscribe` 같은 이벤트를 보낼 수 있음.
- config/model/channel/session/agent control plane API는 호출할 수 없음.

**Operator**

- scope로 게이트되는 전체 control plane API.
- 모든 승인을 수신.
- OS 작업을 직접 실행하지 않고 node로 라우팅.

### 핵심 규칙

역할은 디바이스 단위가 아니라 연결 단위입니다. 하나의 디바이스가 두 역할을 각각 별도 연결로 열 수 있습니다.

---

# 통합 인증 + pairing

## 클라이언트 아이덴티티

모든 클라이언트는 다음을 제공합니다.

- `deviceId` (device key에서 파생된 안정적 ID).
- `displayName` (사람이 읽는 이름).
- `role` + `scope` + `caps` + `commands`.

## Pairing 흐름 (통합)

- 클라이언트가 인증되지 않은 상태로 연결.
- Gateway가 해당 `deviceId`에 대한 **pairing request**를 생성.
- Operator가 프롬프트를 받아 승인/거부.
- Gateway가 다음에 바인딩된 자격 증명을 발급:
  - device public key
  - role
  - scope
  - capability/command
- 클라이언트는 token을 저장하고 인증 상태로 재연결.

## 디바이스 바인딩 인증 (bearer token 재사용 방지)

권장: device keypair.

- 디바이스가 한 번 keypair를 생성.
- `deviceId = fingerprint(publicKey)`.
- Gateway가 nonce를 보내고, 디바이스가 서명하며, gateway가 검증.
- Token은 문자열이 아니라 public key(소유 증명)에 발급됨.

대안:

- mTLS(client cert): 가장 강하지만 운영 복잡도가 큼.
- 짧은 수명의 bearer token은 임시 단계에서만 사용(빠른 rotation + revoke).

## 무음 승인 (SSH heuristic)

약한 고리가 되지 않도록 정확히 정의해야 합니다. 아래 중 하나를 선호합니다.

- **로컬 전용**: 클라이언트가 loopback/Unix socket으로 연결할 때 auto-pair.
- **SSH를 통한 challenge**: gateway가 nonce를 발급하고, 클라이언트가 이를 가져와 SSH를 증명.
- **물리적 존재 window**: gateway host UI에서 로컬 승인이 있은 뒤 짧은 시간(예: 10분) 동안 auto-pair 허용.

항상 auto-approval을 로그와 기록으로 남깁니다.

---

# 모든 곳에 TLS 적용 (dev + prod)

## 기존 bridge TLS 재사용

현재 TLS runtime + fingerprint pinning 사용:

- `src/infra/bridge/server/tls.ts`
- `src/node-host/bridge-client.ts`의 fingerprint 검증 로직

## WS에 적용

- WS server가 동일한 cert/key + fingerprint로 TLS를 지원.
- WS 클라이언트는 fingerprint를 pinning할 수 있음(선택적).
- Discovery가 모든 endpoint에 대해 TLS + fingerprint를 광고.
  - Discovery는 위치 힌트일 뿐이며, 신뢰 anchor가 아님.

## 이유

- 기밀성을 위해 SSH/Tailscale에만 의존하는 구조를 줄임.
- 원격 모바일 연결을 기본적으로 안전하게 만듦.

---

# 승인 재설계 (중앙화)

## 현재

승인은 node host(mac app node runtime)에서 처리됩니다. 프롬프트는 node가 실행되는 곳에 표시됩니다.

## 제안

승인을 **gateway에서 호스팅**하고, UI는 operator 클라이언트에 전달합니다.

### 새로운 흐름

1. Gateway가 `system.run` intent(agent)를 수신.
2. Gateway가 승인 레코드 `approval.requested`를 생성.
3. Operator UI가 프롬프트를 표시.
4. 승인 결정이 gateway로 전송됨: `approval.resolve`.
5. 승인되면 Gateway가 node command를 호출.
6. Node가 실행 후 `invoke-res` 반환.

### 승인 의미론 (강화)

- 모든 operator에게 브로드캐스트하되, active UI만 modal을 표시(다른 UI는 toast).
- 첫 번째 resolve가 승리하며, gateway는 이후 resolve를 이미 처리됨으로 거부.
- 기본 timeout: N초 후 거부(예: 60초), 이유를 로그에 기록.
- resolve에는 `operator.approvals` scope 필요.

## 이점

- 프롬프트가 사용자 위치(mac/phone)에 나타남.
- 원격 node에 대해 일관된 승인 경험 제공.
- Node runtime은 headless 상태를 유지하며 UI 의존성이 없어짐.

---

# 역할 명확성 예시

## iPhone app

- 다음을 위한 **Node role**: 마이크, 카메라, voice chat, 위치, push-to-talk.
- 상태와 채팅 보기를 위한 선택적 **operator.read**.
- 명시적으로 켠 경우에만 선택적 **operator.write/admin**.

## macOS app

- 기본은 operator role(control UI).
- "Mac node"가 활성화되면 node role(`system.run`, screen, camera).
- 두 연결 모두 같은 `deviceId` 사용 -> UI 항목 하나로 병합.

## CLI

- 항상 operator role.
- scope는 subcommand에서 파생:
  - `status`, `logs` -> read
  - `agent`, `message` -> write
  - `config`, `channels` -> admin
  - 승인 + pairing -> `operator.approvals` / `operator.pairing`

---

# 아이덴티티 + slug

## 안정적 ID

인증에 필수이며, 절대 바뀌지 않음.
권장:

- keypair fingerprint(public key hash).

## 귀여운 slug (lobster 테마)

사람 친화 레이블일 뿐입니다.

- 예: `scarlet-claw`, `saltwave`, `mantis-pinch`.
- gateway registry에 저장되며 수정 가능.
- 충돌 처리: `-2`, `-3`.

## UI 그룹화

역할이 달라도 같은 `deviceId`이면 하나의 "Instance" 행으로 표시:

- 배지: `operator`, `node`.
- capability + last seen 표시.

---

# 마이그레이션 전략

## Phase 0: 문서화 + 정렬

- 이 문서를 게시.
- 모든 프로토콜 호출 + 승인 흐름 inventory 작성.

## Phase 1: WS에 역할/scope 추가

- `connect` 파라미터를 `role`, `scope`, `deviceId`로 확장.
- node role에 대한 allowlist gating 추가.

## Phase 2: Bridge 호환성

- bridge를 계속 실행.
- 병렬로 WS node 지원 추가.
- 기능을 config flag 뒤에 배치.

## Phase 3: 중앙 승인

- WS에 approval request + resolve 이벤트 추가.
- mac app UI를 프롬프트 + 응답하도록 업데이트.
- Node runtime은 더 이상 UI 프롬프트를 띄우지 않음.

## Phase 4: TLS 통합

- bridge TLS runtime을 사용해 WS용 TLS config 추가.
- 클라이언트에 pinning 추가.

## Phase 5: bridge 폐기

- iOS/Android/mac node를 WS로 마이그레이션.
- bridge는 fallback으로 유지하고, 안정화되면 제거.

## Phase 6: 디바이스 바인딩 인증

- 로컬이 아닌 모든 연결에 key 기반 아이덴티티 요구.
- revoke + rotation UI 추가.

---

# 보안 메모

- 역할/allowlist는 gateway 경계에서 강제.
- operator scope 없이는 어떤 클라이언트도 "전체" API를 얻지 못함.
- _모든_ 연결에 pairing 필요.
- TLS + pinning은 모바일의 MITM 리스크를 줄임.
- SSH silent approval은 편의 기능일 뿐이며, 여전히 기록되고 revoke 가능해야 함.
- Discovery는 신뢰 anchor가 아님.
- capability claim은 플랫폼/타입별 server allowlist와 대조해 검증.

# 스트리밍 + 대형 payload (node media)

WS control plane은 작은 메시지에는 충분하지만, node는 다음도 처리합니다.

- camera clip
- screen recording
- audio stream

선택지:

1. WS binary frame + chunking + backpressure 규칙.
2. 별도 streaming endpoint(여전히 TLS + auth 사용).
3. media-heavy command에 대해서는 bridge를 더 오래 유지하고 마지막에 마이그레이션.

구현 전에 하나를 선택해 drift를 피해야 합니다.

# Capability + command 정책

- node가 보고한 caps/commands는 **claim**으로 취급.
- Gateway가 플랫폼별 allowlist를 강제.
- 새로운 command는 operator 승인 또는 명시적 allowlist 변경이 필요.
- 변경 사항을 timestamp와 함께 감사 로그에 남김.

# 감사 + rate limiting

- 다음을 로그로 남김: pairing request, 승인/거부, token 발급/rotation/revoke.
- pairing spam과 승인 프롬프트에 rate limit 적용.

# 프로토콜 hygiene

- 명시적인 protocol version + error code.
- 재연결 규칙 + heartbeat 정책.
- presence TTL 및 last-seen 의미론.

---

# 열린 질문

1. 두 역할을 모두 실행하는 단일 디바이스의 token 모델
   - 역할별(node vs operator)로 별도 token을 권장.
   - 같은 deviceId를 쓰되 scope를 분리하면 revoke가 더 명확함.

2. Operator scope 세분화
   - read/write/admin + approvals + pairing이 최소 구현 범위.
   - 이후 기능별 scope를 검토.

3. Token rotation + revoke UX
   - 역할 변경 시 자동 rotation.
   - deviceId + role 기준 revoke UI 제공.

4. Discovery
   - 현재 Bonjour TXT를 확장해 WS TLS fingerprint + role hint 포함.
   - 위치 힌트로만 취급.

5. 네트워크 간 승인
   - 모든 operator client에 브로드캐스트하고, active UI만 modal 표시.
   - 첫 응답이 승리하며, gateway가 원자성을 강제.

---

# 요약 (TL;DR)

- 현재: WS control plane + Bridge node transport.
- 문제: 승인 + 중복 + 두 개의 스택.
- 제안: 명시적 역할 + scope를 가진 하나의 WS 프로토콜, 통합 pairing + TLS pinning, gateway-hosted 승인, 안정적 device ID + 귀여운 slug.
- 결과: 더 단순한 UX, 더 강한 보안, 더 적은 중복, 더 나은 모바일 라우팅.
