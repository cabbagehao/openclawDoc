---
summary: "macOS UI automation용 PeekabooBridge 통합 방식을 설명합니다."
description: "OpenClaw.app이 PeekabooBridge host로 동작할 때 socket discovery, TeamID 검증, permission 재사용 방식을 정리합니다."
read_when:
  - OpenClaw.app에서 PeekabooBridge를 host할 때
  - Swift Package Manager로 Peekaboo를 통합할 때
  - PeekabooBridge protocol/path를 바꿀 때
title: "Peekaboo Bridge"
x-i18n:
  source_path: "platforms/mac/peekaboo.md"
---

# Peekaboo Bridge (macOS UI automation)

OpenClaw는 **PeekabooBridge**를 local의 permission-aware UI automation broker로 host할 수 있습니다. 이를 통해 `peekaboo` CLI가 macOS app의 TCC permission을 재사용하면서 UI automation을 수행할 수 있습니다.

## 이것이 하는 일(그리고 하지 않는 일)

- **Host**: OpenClaw.app은 PeekabooBridge host로 동작할 수 있습니다.
- **Client**: `peekaboo` CLI를 사용합니다. 별도의 `openclaw ui ...` surface는 없습니다.
- **UI**: visual overlay는 계속 Peekaboo.app에 남고, OpenClaw는 thin broker host 역할만 합니다.

## 브리지 활성화

macOS 앱에서:

- 설정 → **Enable Peekaboo Bridge**

활성화하면 OpenClaw가 local UNIX socket server를 시작합니다. 비활성화하면 host가 중지되고 `peekaboo`는 다른 사용 가능한 host로 fallback합니다.

## 클라이언트 탐색 순서

Peekaboo client는 일반적으로 다음 순서로 host를 시도합니다.

1. Peekaboo.app (full UX)
2. Claude.app (설치된 경우)
3. OpenClaw.app (thin broker)

어떤 host가 active인지와 어떤 socket path가 사용 중인지 확인하려면 `peekaboo bridge status --verbose`를 사용하세요. 다음처럼 override할 수도 있습니다.

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## 보안 및 권한

- bridge는 **caller code signature**를 검증합니다. TeamID allowlist가 적용되며, Peekaboo host TeamID와 OpenClaw app TeamID만 허용됩니다.
- 요청은 약 10초 후에 시간 초과됩니다.
- 필요한 permission이 없으면 bridge는 System Settings를 여는 대신 명확한 오류 메시지를 반환합니다.

## 스냅샷 동작(자동화)

snapshot은 메모리에 저장되며 짧은 시간 창 뒤 자동 만료됩니다. 더 오래 유지해야 하면 client에서 다시 capture하세요.

## 문제 해결

- `peekaboo`가 “bridge client is not authorized”를 보고하면 client가 올바르게 sign되었는지 확인하거나, **debug** 모드에서만 `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1`로 host를 실행하세요.
- host를 찾지 못하면 host app(Peekaboo.app 또는 OpenClaw.app) 중 하나를 열고 permission이 부여되었는지 확인하세요.
