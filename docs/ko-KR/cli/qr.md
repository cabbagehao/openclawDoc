---
summary: "iOS 앱 페어링을 위한 QR 코드 및 설정 코드(Setup Code)를 생성하는 `openclaw qr` 명령어 레퍼런스"
description: "현재 Gateway 설정을 바탕으로 iOS pairing용 QR 코드와 setup code를 생성하는 `openclaw qr` 사용법을 설명합니다."
read_when:
  - iOS 앱과 Gateway 서버를 빠르게 페어링하고자 할 때
  - 원격 접속 또는 수동 공유용 setup code가 필요할 때
title: "qr"
x-i18n:
  source_path: "cli/qr.md"
---

# `openclaw qr`

현재 Gateway 설정을 기반으로 iOS pairing용 QR 코드와 setup code를 생성합니다.

## Usage

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws --token '<token>'
```

## Options

- `--remote`: `gateway.remote.url`과 remote token/password를 사용합니다.
- `--url <url>`: payload에 사용할 gateway URL을 override합니다.
- `--public-url <url>`: payload에 사용할 public URL을 override합니다.
- `--token <token>`: payload에 사용할 gateway token을 override합니다.
- `--password <password>`: payload에 사용할 gateway password를 override합니다.
- `--setup-code-only`: setup code만 출력합니다.
- `--no-ascii`: ASCII QR 렌더링을 건너뜁니다.
- `--json`: JSON(`setupCode`, `gatewayUrl`, `auth`, `urlSource`)을 출력합니다.

## Notes

- `--token`과 `--password`는 함께 사용할 수 없습니다.
- `--remote`를 사용할 때 effectively active remote credential이 SecretRef로 configured되어 있고 `--token`이나 `--password`를 넘기지 않으면, 이 명령은 active gateway snapshot에서 값을 resolve합니다. gateway를 사용할 수 없으면 즉시 실패합니다.
- `--remote` 없이 실행하면, CLI auth override가 없을 때 local gateway auth SecretRef를 resolve합니다.
  - token auth가 우선할 수 있는 경우(`gateway.auth.mode="token"`이 명시되었거나, password source가 이기지 않는 inferred mode) `gateway.auth.token`을 resolve합니다.
  - password auth가 우선할 수 있는 경우(`gateway.auth.mode="password"`가 명시되었거나, auth/env에서 winning token이 없는 inferred mode) `gateway.auth.password`를 resolve합니다.
- `gateway.auth.token`과 `gateway.auth.password`가 모두 configured되어 있고(SecretRef 포함) `gateway.auth.mode`가 비어 있으면, mode를 명시할 때까지 setup-code resolution이 실패합니다.
- 이 경로는 `secrets.resolve`를 지원하는 gateway가 필요합니다. 구버전 gateway는 unknown-method 오류를 반환합니다.
- 스캔 후에는 다음 명령으로 device pairing을 승인하세요.
- `openclaw devices list`
- `openclaw devices approve <requestId>`
