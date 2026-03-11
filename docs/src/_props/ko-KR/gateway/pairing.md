---
summary: "iOS 및 원격 노드 기기를 위한 Gateway 주도 페어링 프로세스 및 승인 흐름 안내"
read_when:
  - macOS UI 없이 노드 페어링 승인 프로세스를 구현해야 할 때
  - 원격 노드 승인을 위한 CLI 작업 절차를 확인하고자 할 때
  - Gateway 프로토콜을 통한 노드 관리 기능을 확장할 때
title: "Gateway 주도 페어링"
x-i18n:
  source_path: "gateway/pairing.md"
---

# Gateway 주도 페어링 (Gateway-Owned Pairing)

Gateway 주도 페어링 방식에서는 **Gateway**가 어떤 노드 기기의 접속을 허용할지 결정하는 최종 권한(Source of Truth)을 가짐. macOS 앱이나 기타 클라이언트 UI는 보류 중인 요청을 승인하거나 거부하는 프런트엔드 역할만 수행함.

**중요 사항:** WebSocket 노드는 연결(`connect`) 시 `node` 역할을 사용한 **기기 페어링(Device pairing)** 방식을 따름. `node.pair.*`는 별도의 페어링 저장소를 사용하며 WebSocket 핸드셰이크 자체를 차단하지는 않음. 이 흐름은 명시적으로 `node.pair.*` 메서드를 호출하는 클라이언트에게만 적용됨.

## 주요 개념

* **보류 중인 요청 (Pending request)**: 노드가 접속을 요청하여 관리자의 승인을 기다리는 상태.
* **페어링된 노드 (Paired node)**: 승인이 완료되어 인증 토큰이 발급된 노드 기기.
* **전송 계층 (Transport)**: Gateway WebSocket 엔드포인트는 요청을 단순히 전달할 뿐, 멤버십 자격 여부를 직접 결정하지는 않음 (레거시 TCP 브리지 지원은 제거됨).

## 페어링 동작 원리

1. 노드 기기가 Gateway WebSocket에 접속하여 페어링을 요청함.
2. Gateway는 **보류 중인 요청**으로 저장하고 `node.pair.requested` 이벤트를 발생시킴.
3. 관리자가 CLI 또는 UI를 통해 해당 요청을 승인하거나 거부함.
4. 승인 시 Gateway는 **새로운 토큰**을 발급함 (재페어링 시 토큰은 자동으로 회전됨).
5. 노드 기기는 발급받은 토큰을 사용하여 재접속하며, 이 시점부터 "페어링됨" 상태가 됨.

보류 중인 요청은 생성 후 **5분**이 지나면 자동으로 만료됨.

## CLI 워크플로 (자동화 및 헤드리스 환경)

```bash
openclaw nodes pending                      # 보류 중인 요청 목록 확인
openclaw nodes approve <requestId>          # 요청 승인
openclaw nodes reject <requestId>           # 요청 거부
openclaw nodes status                       # 페어링된 노드 및 상태 확인
openclaw nodes rename --node <ID> --name "거실 아이패드" # 노드 이름 변경
```

`nodes status` 명령을 통해 페어링된 기기 목록과 각 기기의 지원 기능(Capabilities)을 파악할 수 있음.

## API 명세 (Gateway 프로토콜)

**이벤트 (Events):**

* `node.pair.requested`: 새로운 보류 요청 생성 시 발생.
* `node.pair.resolved`: 요청이 승인, 거부 또는 만료되었을 때 발생.

**메서드 (Methods):**

* `node.pair.request`: 보류 요청을 생성하거나 기존 요청을 재사용함.
* `node.pair.list`: 보류 중 및 페어링된 노드 목록 조회.
* `node.pair.approve`: 보류 요청을 승인하고 인증 토큰을 발급함.
* `node.pair.reject`: 보류 요청을 거부함.
* `node.pair.verify`: `{ nodeId, token }` 쌍의 유효성을 검증함.

**참고 사항:**

* `node.pair.request`는 멱등성(Idempotent)을 가짐. 동일한 노드가 반복 호출해도 기존 보류 요청 정보를 반환함.
* 승인 시에는 **항상 새로운 토큰**이 생성됨. 보안을 위해 `node.pair.request` 단계에서는 토큰을 반환하지 않음.
* 요청 시 `silent: true` 힌트를 포함하여 자동 승인 흐름을 유도할 수 있음.

## 자동 승인 (Auto-approval: macOS 앱 전용)

macOS 메뉴 막대 앱은 다음 조건이 충족될 경우 \*\*자동 승인(Silent approval)\*\*을 시도함:

* 요청에 `silent` 마킹이 되어 있는 경우.
* 앱이 동일한 사용자 계정으로 Gateway 호스트에 SSH 연결이 가능함을 확인한 경우.

자동 승인 조건에 부합하지 않으면 일반적인 "승인/거부" 팝업을 사용자에게 표시함.

## 데이터 저장소 (로컬 및 보안)

페어링 상태 정보는 Gateway 상태 디렉터리(기본값 `~/.openclaw`) 하위에 저장됨:

* `~/.openclaw/nodes/paired.json` (승인된 노드 정보)
* `~/.openclaw/nodes/pending.json` (보류 중인 요청 정보)

`OPENCLAW_STATE_DIR` 환경 변수를 사용하여 상태 디렉터리 경로를 변경하면 해당 폴더도 함께 이동함.

**보안 주의 사항:**

* 인증 토큰은 비밀 정보이므로 `paired.json` 파일의 접근 권한을 엄격히 관리해야 함.
* 토큰을 갱신(회전)하려면 기존 노드 항목을 삭제한 후 재승인 절차를 거쳐야 함.

## 전송 동작 특징

* 전송 계층은 **무상태(Stateless)** 방식으로 작동하며 멤버십 정보를 별도로 저장하지 않음.
* Gateway 서버가 오프라인이거나 페어링 기능이 비활성화된 경우 노드는 페어링할 수 없음.
* Gateway가 원격(Remote) 모드로 동작하더라도 페어링 작업은 실제 데이터가 저장된 원격 Gateway 서버의 저장소를 대상으로 수행됨.
