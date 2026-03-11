---
summary: "OpenClaw presence 항목이 생성, 병합, 표시되는 방식"
read_when:
  - Instances 탭을 디버깅할 때
  - 중복되거나 오래된 instance row 를 조사할 때
  - gateway WS connect 또는 system-event beacon 을 변경할 때
title: "Presence"
---

# Presence

OpenClaw 의 “presence” 는 다음에 대한 가볍고 best-effort 한 뷰입니다:

- **Gateway** 자체
- **Gateway 에 연결된 client** (mac app, WebChat, CLI 등)

Presence 는 주로 macOS 앱의 **Instances** 탭을 렌더링하고, 운영자가 빠르게 상황을 볼 수 있도록 하기 위해 사용됩니다.

## Presence fields (보여지는 항목)

presence 항목은 다음과 같은 필드를 가진 구조화 객체입니다:

- `instanceId` (선택 사항이지만 강하게 권장): 안정적인 client identity (보통 `connect.client.instanceId`)
- `host`: 사람이 읽기 쉬운 host name
- `ip`: best-effort IP address
- `version`: client version string
- `deviceFamily` / `modelIdentifier`: 하드웨어 힌트
- `mode`: `ui`, `webchat`, `cli`, `backend`, `probe`, `test`, `node`, ...
- `lastInputSeconds`: “마지막 사용자 입력 이후 경과 초” (알 수 있는 경우)
- `reason`: `self`, `connect`, `node-connected`, `periodic`, ...
- `ts`: 마지막 업데이트 timestamp (epoch ms)

## Producers (presence 가 오는 곳)

presence 항목은 여러 소스에서 생성되고 **병합** 됩니다.

### 1) Gateway self entry

Gateway 는 시작 시 항상 “self” 항목을 시드해서, 아직 어떤 client 도 연결되지 않았더라도 UI 가 gateway host 를 보여 줄 수 있게 합니다.

### 2) WebSocket connect

모든 WS client 는 `connect` 요청으로 시작합니다. handshake 가 성공하면 Gateway 는 해당 연결에 대한 presence 항목을 upsert 합니다.

#### 일회성 CLI 명령이 표시되지 않는 이유

CLI 는 짧은 일회성 명령을 위해 연결되는 경우가 많습니다. Instances 목록이 넘쳐나는 것을 막기 위해 `client.mode === "cli"` 는 **presence 항목으로 전환되지 않습니다**.

### 3) `system-event` beacons

client 는 `system-event` 메서드를 통해 더 풍부한 주기적 beacon 을 보낼 수 있습니다. mac 앱은 이를 사용해 host name, IP, `lastInputSeconds` 를 보고합니다.

### 4) Node connects (role: node)

node 가 Gateway WebSocket 으로 `role: node` 로 연결되면, Gateway 는 그 node 에 대한 presence 항목을 upsert 합니다(다른 WS client 와 동일한 흐름).

## Merge + dedupe rules (`instanceId` 가 중요한 이유)

presence 항목은 하나의 메모리 내 맵에 저장됩니다:

- 항목은 **presence key** 로 키잉됩니다.
- 가장 좋은 키는 재시작을 견디는 안정적인 `instanceId` (`connect.client.instanceId`)입니다.
- 키는 대소문자를 구분하지 않습니다.

client 가 안정적인 `instanceId` 없이 재연결되면 **중복** row 로 보일 수 있습니다.

## TTL 과 크기 제한

presence 는 의도적으로 일시적입니다:

- **TTL:** 5분보다 오래된 항목은 정리됩니다
- **최대 항목 수:** 200 (가장 오래된 것부터 제거)

이렇게 하면 목록이 신선하게 유지되고 메모리 성장이 무한정 커지는 것을 막을 수 있습니다.

## Remote/tunnel 주의점 (loopback IP)

client 가 SSH tunnel / 로컬 포트 포워드를 통해 연결되면, Gateway 는 원격 주소를 `127.0.0.1` 로 볼 수 있습니다. 이 경우 더 나은 client-reported IP 를 덮어쓰지 않도록 loopback 원격 주소는 무시됩니다.

## Consumers

### macOS Instances 탭

macOS 앱은 `system-presence` 출력을 렌더링하고, 마지막 업데이트의 나이를 바탕으로 작은 상태 표시기(Active/Idle/Stale)를 적용합니다.

## 디버깅 팁

- raw 목록을 보려면 Gateway 에 `system-presence` 를 호출하세요.
- 중복이 보인다면:
  - client 가 handshake 에서 안정적인 `client.instanceId` 를 보내는지 확인
  - 주기적인 beacon 도 같은 `instanceId` 를 사용하는지 확인
  - 연결 기반 항목에 `instanceId` 가 누락되어 있는지 확인(중복은 예상되는 결과)
