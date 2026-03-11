---
summary: "CLI reference for `openclaw devices` (device pairing + token rotation/revocation)"
read_when:
  - device pairing 요청을 승인하고 있을 때
  - device token 을 회전하거나 폐기해야 할 때
title: "devices"
---

# `openclaw devices`

device pairing 요청과 device-scoped token 을 관리합니다.

## Commands

### `openclaw devices list`

대기 중인 pairing 요청과 paired device 를 나열합니다.

```
openclaw devices list
openclaw devices list --json
```

### `openclaw devices remove <deviceId>`

paired device 항목 하나를 제거합니다.

```
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

### `openclaw devices clear --yes [--pending]`

paired device 를 일괄 정리합니다.

```
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

### `openclaw devices approve [requestId] [--latest]`

대기 중인 device pairing 요청을 승인합니다. `requestId` 를 생략하면 OpenClaw 가 가장 최근의 대기 요청을 자동 승인합니다.

```
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

### `openclaw devices reject <requestId>`

대기 중인 device pairing 요청을 거부합니다.

```
openclaw devices reject <requestId>
```

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

특정 role 의 device token 을 회전합니다(선택적으로 scope 업데이트).

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

### `openclaw devices revoke --device <id> --role <role>`

특정 role 의 device token 을 폐기합니다.

```
openclaw devices revoke --device <deviceId> --role node
```

## Common options

- `--url <url>`: Gateway WebSocket URL (`gateway.remote.url` 이 설정되어 있으면 기본값)
- `--token <token>`: Gateway token (필요한 경우)
- `--password <password>`: Gateway password (password auth)
- `--timeout <ms>`: RPC timeout
- `--json`: JSON 출력 (스크립트용 권장)

메모: `--url` 을 지정하면 CLI 는 config 나 environment credential 로 폴백하지 않습니다.
`--token` 또는 `--password` 를 명시적으로 전달하세요. 자격 증명을 명시하지 않으면 오류입니다.

## 메모

- token rotation 은 새 token 을 반환합니다(민감 정보). 비밀처럼 다루세요.
- 이 명령들은 `operator.pairing` (또는 `operator.admin`) scope 가 필요합니다.
- `devices clear` 는 의도적으로 `--yes` 로 보호됩니다.
- local loopback 에서 pairing scope 를 사용할 수 없고 명시적 `--url` 도 없는 경우, list/approve 는 로컬 pairing fallback 을 사용할 수 있습니다.
