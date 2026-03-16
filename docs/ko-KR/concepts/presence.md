---
summary: "How OpenClaw presence entries are produced, merged, and displayed"
description: "OpenClaw presence 항목이 어디서 생성되고 어떻게 병합·정리되어 Instances 탭에 표시되는지 설명합니다."
read_when:
  - Instances tab을 디버깅할 때
  - duplicate 또는 stale instance row를 조사할 때
  - gateway WebSocket connect나 system-event beacon 동작을 바꿀 때
title: "Presence"
x-i18n:
  source_path: "concepts/presence.md"
---

# Presence

OpenClaw의 "presence"는 다음에 대한 lightweight하고 best-effort한 view입니다.

- **Gateway** 자체
- **Gateway에 연결된 client**
  (mac app, WebChat, CLI 등)

presence는 주로 macOS app의 **Instances** tab을 렌더링하고, 운영자가 연결 상태를
빠르게 확인할 수 있게 하는 데 사용됩니다.

## Presence fields (what shows up)

presence entry는 대략 다음 field를 가진 structured object입니다.

- `instanceId`
  (optional이지만 강력히 권장):
  안정적인 client identity
  (보통 `connect.client.instanceId`)
- `host`: 사람이 읽기 쉬운 host name
- `ip`: best-effort IP address
- `version`: client version string
- `deviceFamily` / `modelIdentifier`: hardware hint
- `mode`: `ui`, `webchat`, `cli`, `backend`, `probe`, `test`, `node`, ...
- `lastInputSeconds`: "마지막 user input 이후 몇 초가 지났는지"
  (알 수 있을 때)
- `reason`: `self`, `connect`, `node-connected`, `periodic`, ...
- `ts`: 마지막 update timestamp
  (epoch ms)

## Producers (where presence comes from)

presence entry는 여러 source에서 생성되고 **merge**됩니다.

### 1) Gateway self entry

Gateway는 startup 시 항상 "self" entry를 하나 seed합니다. 그래서 아직 client가
연결되지 않았더라도 UI는 gateway host를 표시할 수 있습니다.

### 2) WebSocket connect

모든 WS client는 `connect` request로 시작합니다. handshake가 성공하면 Gateway는
그 connection에 대한 presence entry를 upsert합니다.

#### Why one-off CLI commands don't show up

CLI는 짧은 일회성 command를 위해 잠깐 연결되는 경우가 많습니다. Instances list가
지저분해지는 것을 막기 위해 `client.mode === "cli"`는 **presence entry로 만들지
않습니다**.

### 3) `system-event` beacons

client는 `system-event` method를 통해 더 풍부한 periodic beacon을 보낼 수 있습니다.
mac app은 이를 이용해 host name, IP, `lastInputSeconds`를 보고합니다.

### 4) Node connects (role: node)

node가 Gateway WebSocket에 `role: node`로 연결되면, Gateway는 다른 WS client와
같은 흐름으로 해당 node의 presence entry를 upsert합니다.

## Merge + dedupe rules (why `instanceId` matters)

presence entry는 하나의 in-memory map에 저장됩니다.

- entry는 **presence key**로 식별됩니다
- 가장 좋은 key는 restart 후에도 유지되는 stable `instanceId`
  (`connect.client.instanceId`)입니다
- key는 case-insensitive입니다

client가 stable `instanceId` 없이 재연결하면 **duplicate row**가 나타날 수 있습니다.

## TTL and bounded size

presence는 의도적으로 ephemeral합니다.

- **TTL:** 5분보다 오래된 entry는 pruning
- **Max entries:** 200
  (가장 오래된 항목부터 drop)

이렇게 해서 list를 신선하게 유지하고 memory가 무한히 커지는 것을 막습니다.

## Remote/tunnel caveat (loopback IPs)

SSH tunnel이나 local port forward를 통해 client가 연결되면, Gateway는 remote address를
`127.0.0.1`로 볼 수 있습니다. client가 스스로 보고한 괜찮은 IP를 덮어쓰지 않도록,
이런 loopback remote address는 무시합니다.

## Consumers

### macOS Instances tab

macOS app은 `system-presence`의 output을 렌더링하고, 마지막 update의 age를 기준으로
작은 status indicator
(Active/Idle/Stale)를 적용합니다.

## Debugging tips

- raw list를 보려면 Gateway에 `system-presence`를 호출하세요
- duplicate가 보이면 다음을 확인하세요
  - client가 handshake에서 stable `client.instanceId`를 보내는지
  - periodic beacon이 같은 `instanceId`를 쓰는지
  - connection-derived entry에 `instanceId`가 빠져 있는지
    (이 경우 duplicate는 예상 가능한 동작)
