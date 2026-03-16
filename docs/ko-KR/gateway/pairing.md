---
summary: "iOS 및 원격 노드 기기를 위한 Gateway 주도 페어링 프로세스 및 승인 흐름 안내"
description: "Gateway가 source of truth가 되는 node pairing 흐름, CLI 승인 절차, `node.pair.*` API surface를 설명합니다."
read_when:
  - "macOS UI 없이 node pairing approval 흐름을 구현할 때"
  - "원격 node 승인을 위한 CLI workflow를 확인할 때"
  - "Gateway protocol의 node management 기능을 확장할 때"
title: "Gateway 주도 페어링"
x-i18n:
  source_path: "gateway/pairing.md"
---

# Gateway 주도 페어링 (Option B)

Gateway 주도 페어링에서는 **Gateway**가 어떤 nodes의 join을 허용할지에 대한 source of truth입니다. UIs(macOS app, 향후 clients)는 pending requests를 승인하거나 거부하는 frontend 역할만 합니다.

**중요:** WS nodes는 `connect` 동안 role `node`를 사용하는 **device pairing**을 사용합니다. `node.pair.*`는 별도의 pairing store이며 WS handshake를 막지 않습니다. 명시적으로 `node.pair.*`를 호출하는 clients만 이 흐름을 사용합니다.

## 주요 개념

- **Pending request**: node가 join을 요청했고 승인이 필요한 상태
- **Paired node**: 승인되어 auth token이 발급된 node
- **Transport**: Gateway WS endpoint는 요청을 전달하지만 membership은 결정하지 않습니다. 레거시 TCP bridge 지원은 deprecated/removed 상태입니다.

## 페어링 동작 원리

1. node가 Gateway WS에 연결해 pairing을 요청합니다.
2. Gateway는 **pending request**를 저장하고 `node.pair.requested`를 emit합니다.
3. CLI 또는 UI에서 요청을 승인하거나 거부합니다.
4. 승인되면 Gateway는 **새 token**을 발급합니다. re-pair 시 token은 회전됩니다.
5. node는 token으로 다시 연결하고, 이제 “paired” 상태가 됩니다.

pending requests는 **5분** 후 자동으로 만료됩니다.

## CLI workflow (headless friendly)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status`는 paired/connected nodes와 their capabilities를 보여 줍니다.

## API surface (gateway protocol)

Events:
- `node.pair.requested` — 새로운 pending request가 만들어질 때 emit
- `node.pair.resolved` — 요청이 승인, 거부, 만료될 때 emit

Methods:
- `node.pair.request` — pending request를 생성하거나 재사용
- `node.pair.list` — pending + paired nodes 조회
- `node.pair.approve` — pending request 승인 후 token 발급
- `node.pair.reject` — pending request 거부
- `node.pair.verify` — `{ nodeId, token }` 검증

Notes:
- `node.pair.request`는 node 단위로 idempotent합니다. 반복 호출해도 같은 pending request를 반환합니다.
- 승인 시에는 **항상 새 token**이 생성됩니다. `node.pair.request`는 token을 반환하지 않습니다.
- 요청은 auto-approval 흐름용 힌트로 `silent: true`를 포함할 수 있습니다.

## Auto-approval (macOS app)

macOS app은 다음 조건이 맞으면 **silent approval**을 시도할 수 있습니다.

- 요청이 `silent`로 표시된 경우
- 앱이 같은 사용자로 gateway host에 SSH 연결할 수 있음을 검증한 경우

silent approval이 실패하면 일반적인 “Approve/Reject” 프롬프트로 돌아갑니다.

## Storage (local, private)

pairing state는 Gateway state directory(기본값 `~/.openclaw`) 아래에 저장됩니다.

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

`OPENCLAW_STATE_DIR`를 override하면 `nodes/` 폴더도 함께 이동합니다.

Security notes:
- tokens는 비밀 정보이므로 `paired.json`은 민감하게 다뤄야 합니다.
- token을 회전하려면 재승인하거나 node entry를 삭제해야 합니다.

## 전송 동작 특징

- transport는 **stateless**이며 membership을 저장하지 않습니다.
- Gateway가 offline이거나 pairing이 비활성화되면 nodes는 pair할 수 없습니다.
- Gateway가 remote mode여도 pairing은 실제 remote Gateway의 store를 대상으로 진행됩니다.
