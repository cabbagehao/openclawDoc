---
summary: "CLI reference for `openclaw devices` (device pairing + token rotation/revocation)"
description: "device pairing 요청을 승인·거부하고, device-scoped token을 rotate 또는 revoke하는 `openclaw devices` 명령의 흐름과 복구 절차를 정리합니다."
read_when:
  - device pairing 요청을 승인할 때
  - device token을 rotate 또는 revoke해야 할 때
title: "devices"
x-i18n:
  source_path: "cli/devices.md"
---

# `openclaw devices`

device pairing request와 device-scoped token을 관리합니다.

## Commands

### `openclaw devices list`

pending pairing request와 paired device를 나열합니다.

```bash
openclaw devices list
openclaw devices list --json
```

### `openclaw devices remove <deviceId>`

paired device entry 하나를 제거합니다.

```bash
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

### `openclaw devices clear --yes [--pending]`

paired device를 일괄 정리합니다.

```bash
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

### `openclaw devices approve [requestId] [--latest]`

pending device pairing request를 승인합니다. `requestId`를 생략하면 OpenClaw가 가장 최근 pending request를 자동 승인합니다.

```bash
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

### `openclaw devices reject <requestId>`

pending device pairing request를 거부합니다.

```bash
openclaw devices reject <requestId>
```

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

특정 role의 device token을 rotate합니다. 필요하면 scope도 함께 갱신할 수 있습니다.

```bash
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

### `openclaw devices revoke --device <id> --role <role>`

특정 role의 device token을 revoke합니다.

```bash
openclaw devices revoke --device <deviceId> --role node
```

## Common options

- `--url <url>`: Gateway WebSocket URL (`gateway.remote.url`이 설정되어 있으면 기본값으로 사용)
- `--token <token>`: Gateway token (필요한 경우)
- `--password <password>`: Gateway password (password auth)
- `--timeout <ms>`: RPC timeout
- `--json`: JSON output (스크립트 용도로 권장)

참고: `--url`을 지정하면 CLI는 config나 environment credential로 fallback하지 않습니다.
`--token` 또는 `--password`를 명시적으로 넘겨야 하며, 없으면 오류입니다.

## Notes

- token rotation은 새 token을 반환합니다. 민감 정보로 취급하세요.
- 이 명령들은 `operator.pairing` 또는 `operator.admin` scope가 필요합니다.
- `devices clear`는 의도적으로 `--yes`로 보호됩니다.
- local loopback에서 pairing scope를 사용할 수 없고 `--url`도 명시하지 않았다면, list/approve는 local pairing fallback을 사용할 수 있습니다.

## Token drift recovery checklist

Control UI나 다른 client가 계속 `AUTH_TOKEN_MISMATCH` 또는 `AUTH_DEVICE_TOKEN_MISMATCH`로 실패할 때 사용하세요.

1. 현재 gateway token source를 확인:

```bash
openclaw config get gateway.auth.token
```

2. paired device를 나열하고 영향받은 device id를 확인:

```bash
openclaw devices list
```

3. 해당 device의 operator token rotate:

```bash
openclaw devices rotate --device <deviceId> --role operator
```

4. rotation만으로 부족하면 stale pairing을 제거하고 다시 승인:

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. 현재 shared token/password로 client connection을 다시 시도합니다.

Related:

- [Dashboard auth troubleshooting](/web/dashboard#if-you-see-unauthorized-1008)
- [Gateway troubleshooting](/gateway/troubleshooting#dashboard-control-ui-connectivity)
