---
summary: "OpenClaw 상태 표시(Presence) 시스템: 정보 생성, 병합 및 인스턴스 탭 표시 방식 안내"
read_when:
  - macOS 앱의 인스턴스(Instances) 탭 정보를 디버깅할 때
  - 중복되거나 만료된 인스턴스 행이 표시되는 원인을 조사할 때
  - Gateway WebSocket 연결 또는 시스템 이벤트 비컨(Beacon) 설정을 변경할 때
title: "상태 표시 (Presence)"
x-i18n:
  source_path: "concepts/presence.md"
---

# 상태 표시 (Presence)

OpenClaw의 **상태 표시(Presence)**는 다음 대상들에 대한 가볍고 최선 노력(Best-effort) 방식의 실시간 뷰를 제공함:

- **Gateway** 서버 자체의 상태
- **Gateway에 연결된 클라이언트** (macOS 앱, WebChat, CLI 등)

이 정보는 주로 macOS 앱의 **인스턴스(Instances)** 탭을 구성하고, 운영자가 시스템 접속 현황을 빠르게 파악할 수 있도록 돕는 용도로 사용됨.

## 표시 항목 (Presence Fields)

상태 정보는 다음과 같은 필드를 포함하는 구조화된 객체임:

- `instanceId` (권장): 클라이언트를 식별하는 고유 ID. 재시작 시에도 변하지 않는 값이 권장됨.
- `host`: 사람이 읽기 쉬운 호스트 이름.
- `ip`: 클라이언트의 IP 주소 (가급적 실제 주소 판별 시도).
- `version`: 클라이언트 소프트웨어 버전.
- `deviceFamily` / `modelIdentifier`: 하드웨어 모델 정보.
- `mode`: 클라이언트 유형 (`ui`, `webchat`, `cli`, `node`, `probe`, `test` 등).
- `lastInputSeconds`: 마지막 사용자 입력 이후 경과 시간 (알 수 있는 경우).
- `reason`: 정보가 생성된 이유 (`self`, `connect`, `node-connected`, `periodic` 등).
- `ts`: 마지막 업데이트 타임스탬프 (ms 단위).

## 정보 생성원 (Producers)

상태 정보는 여러 소스에서 생성되며 하나로 **병합(Merge)**됨.

### 1. Gateway 자체 정보
Gateway는 시작 시 자신의 정보를 'self' 항목으로 등록함. 이를 통해 어떤 클라이언트도 연결되지 않은 상태에서도 UI에 Gateway 호스트 정보가 표시됨.

### 2. WebSocket 연결 (Connect)
모든 WebSocket 클라이언트는 연결 시 `connect` 요청을 보냄. 핸드쉐이크가 성공하면 Gateway는 해당 연결 정보를 상태 목록에 추가(Upsert)함.

**참고**: CLI는 일회성 명령 실행을 위해 짧게 연결되는 경우가 많음. 인스턴스 목록이 불필요하게 복잡해지는 것을 방지하기 위해 `client.mode: "cli"`인 연결은 상태 목록에 표시하지 않음.

### 3. 시스템 이벤트 비컨 (System-event Beacons)
클라이언트는 `system-event` 메서드를 통해 주기적으로 상세 정보를 포함한 비컨 데이터를 보낼 수 있음. macOS 앱은 이를 통해 호스트 이름, IP 주소, 유휴 시간(`lastInputSeconds`) 등을 보고함.

### 4. 노드 연결 (Role: Node)
노드(Nodes)가 Gateway에 `role: node`로 연결될 경우, 일반 클라이언트와 동일한 흐름을 거쳐 상태 목록에 등록됨.

## 병합 및 중복 제거 규칙

상태 정보는 메모리 내의 단일 맵(Map) 구조에 저장됨:

- **키(Key) 지정**: 안정적인 `instanceId`가 존재할 경우 이를 키로 사용함.
- **케이스 구분**: 키 값은 대소문자를 구분하지 않음.
- **주의**: 클라이언트가 고정된 `instanceId` 없이 재연결할 경우, 목록에 **중복된 행**이 나타날 수 있음.

## 데이터 수명 및 용량 제한

상태 정보는 의도적으로 휘발성 데이터로 취급됨:

- **유효 시간(TTL)**: 5분 이상 업데이트되지 않은 항목은 자동으로 삭제됨.
- **최대 개수**: 최대 200개까지만 유지하며, 초과 시 가장 오래된 항목부터 제거함.

이를 통해 목록의 최신성을 유지하고 불필요한 메모리 점유를 방지함.

## 원격/터널 접속 시 IP 처리 주의사항

클라이언트가 SSH 터널링이나 로컬 포트 포워딩을 통해 접속하는 경우, Gateway에는 원격 주소가 `127.0.0.1`로 나타날 수 있음. 이때 클라이언트가 직접 보고한 유효한 IP 주소를 덮어쓰지 않도록, 루프백(Loopback) 주소는 무시함.

## 정보 활용처 (Consumers)

### macOS 인스턴스 탭
macOS 앱은 `system-presence` 요청 결과를 기반으로 목록을 렌더링하며, 마지막 업데이트 시각에 따라 상태 표시등(Active/Idle/Stale)을 시각화하여 보여줌.

## 디버깅 팁

- Gateway에 `system-presence` RPC를 호출하여 원시(Raw) 목록 데이터를 직접 확인할 수 있음.
- 목록에 중복된 인스턴스가 보인다면 다음을 확인함:
  - 클라이언트가 핸드쉐이크 시 안정적인 `instanceId`를 전송하는가?
  - 주기적인 비컨 데이터에서도 동일한 `instanceId`를 사용하는가?
  - 연결 시 생성된 항목에 `instanceId`가 누락되어 있는가?
