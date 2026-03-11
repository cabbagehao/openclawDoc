---
summary: "iOS 및 기타 원격 노드를 위한 Gateway 소유 노드 페어링(Option B)"
read_when:
  - macOS UI 없이 노드 페어링 승인 흐름을 구현할 때
  - 원격 노드 승인용 CLI 흐름을 추가할 때
  - gateway 프로토콜을 노드 관리로 확장할 때
title: "Gateway 소유 페어링"
---

# Gateway 소유 페어링 (Option B)

Gateway 소유 페어링에서는 **Gateway** 가 어떤 노드가 참여할 수 있는지에 대한 진실 소스입니다. UI(macOS app, 향후 클라이언트)는 보류 중 요청을 승인하거나 거부하는 프런트엔드일 뿐입니다.

**중요:** WS node는 `connect` 중 role `node` 로 **device pairing** 을 사용합니다. `node.pair.*` 는 별도의 pairing store이며 WS 핸드셰이크를 제어하지 **않습니다**. 이 흐름은 명시적으로 `node.pair.*` 를 호출하는 클라이언트만 사용합니다.

## 개념

- **보류 중 요청**: 노드가 참여를 요청했으며 승인이 필요함
- **페어링된 노드**: 승인되었고 auth token이 발급된 노드
- **Transport**: Gateway WS endpoint는 요청을 전달하지만 멤버십을 결정하지 않음
  (레거시 TCP bridge 지원은 deprecated/removed 상태)

## 페어링 동작 방식

1. 노드가 Gateway WS에 연결해 페어링을 요청합니다.
2. Gateway가 **보류 중 요청** 을 저장하고 `node.pair.requested` 를 발생시킵니다.
3. 요청을 승인하거나 거부합니다(CLI 또는 UI).
4. 승인되면 Gateway가 **새 토큰** 을 발급합니다(재페어링 시 토큰 회전).
5. 노드는 해당 토큰으로 다시 연결하고 이제 "paired" 상태가 됩니다.

보류 중 요청은 **5분** 후 자동 만료됩니다.

## CLI 워크플로(헤드리스 친화적)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` 는 페어링된/연결된 노드와 해당 capability를 보여줍니다.

## API 표면 (gateway 프로토콜)

이벤트:

- `node.pair.requested` — 새 보류 요청이 생성되면 발생
- `node.pair.resolved` — 요청이 승인/거부/만료되면 발생

메서드:

- `node.pair.request` — 보류 요청 생성 또는 재사용
- `node.pair.list` — 보류 중 + 페어링된 노드 목록
- `node.pair.approve` — 보류 요청 승인(토큰 발급)
- `node.pair.reject` — 보류 요청 거부
- `node.pair.verify` — `{ nodeId, token }` 검증

메모:

- `node.pair.request` 는 노드 단위로 idempotent합니다. 같은 노드가 반복 호출하면 동일한 보류 요청을 반환합니다.
- 승인 시에는 **항상** 새 토큰을 생성하며, `node.pair.request` 에서는 토큰을 절대 반환하지 않습니다.
- 요청에는 auto-approval 흐름을 위한 힌트로 `silent: true` 를 포함할 수 있습니다.

## Auto-approval (macOS app)

macOS app은 다음 조건일 때 선택적으로 **silent approval** 을 시도할 수 있습니다.

- 요청이 `silent` 로 표시되어 있고
- 앱이 같은 사용자로 gateway 호스트에 SSH 연결 가능함을 검증할 수 있을 때

silent approval에 실패하면 일반적인 "Approve/Reject" 프롬프트로 fallback합니다.

## 저장소(로컬, 비공개)

페어링 상태는 Gateway state 디렉터리(기본값 `~/.openclaw`) 아래에 저장됩니다.

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

`OPENCLAW_STATE_DIR` 을 override하면 `nodes/` 폴더도 함께 이동합니다.

보안 메모:

- 토큰은 비밀입니다. `paired.json` 은 민감 정보로 취급하세요.
- 토큰을 회전하려면 재승인(또는 노드 항목 삭제)이 필요합니다.

## 전송 동작

- transport는 **stateless** 이며 멤버십을 저장하지 않습니다.
- Gateway가 offline이거나 pairing이 비활성화되어 있으면 노드는 페어링할 수 없습니다.
- Gateway가 remote 모드여도 pairing은 여전히 원격 Gateway의 store를 대상으로 수행됩니다.
