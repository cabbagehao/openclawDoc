---
summary: "CLI reference for `openclaw qr` (iOS 페어링 QR + setup code 생성)"
read_when:
  - iOS 앱을 gateway 와 빠르게 페어링하고 싶을 때
  - 원격/수동 공유용 setup-code 출력이 필요할 때
title: "qr"
---

# `openclaw qr`

현재 Gateway 설정에서 iOS pairing QR 과 setup code 를 생성합니다.

## Usage

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws --token '<token>'
```

## Options

- `--remote`: 설정의 `gateway.remote.url` 과 원격 token/password 사용
- `--url <url>`: payload 에 사용할 gateway URL 재정의
- `--public-url <url>`: payload 에 사용할 public URL 재정의
- `--token <token>`: payload 용 gateway token 재정의
- `--password <password>`: payload 용 gateway password 재정의
- `--setup-code-only`: setup code 만 출력
- `--no-ascii`: ASCII QR 렌더링 생략
- `--json`: JSON 출력 (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## 메모

- `--token` 과 `--password` 는 함께 사용할 수 없습니다.
- `--remote` 사용 시, 실질적으로 활성화된 원격 자격 증명이 SecretRef 로 구성되어 있고 `--token` 또는 `--password` 를 넘기지 않으면, 명령은 활성 gateway 스냅샷에서 값을 해석합니다. gateway 를 사용할 수 없으면 즉시 실패합니다.
- `--remote` 없이 실행하면, CLI 인증 재정의를 주지 않은 경우 로컬 gateway auth SecretRef 가 해석됩니다:
  - `gateway.auth.token` 은 token auth 가 이길 수 있을 때 해석됩니다(명시적 `gateway.auth.mode="token"` 또는 비밀번호 소스가 우세하지 않은 추론 모드).
  - `gateway.auth.password` 는 password auth 가 이길 수 있을 때 해석됩니다(명시적 `gateway.auth.mode="password"` 또는 auth/env 에서 token 이 우세하지 않은 추론 모드).
- `gateway.auth.token` 과 `gateway.auth.password` 가 모두 구성되어 있는데(SecretRef 포함) `gateway.auth.mode` 가 설정되지 않으면, mode 를 명시적으로 설정할 때까지 setup-code 해석이 실패합니다.
- Gateway 버전 차이 메모: 이 명령 경로는 `secrets.resolve` 를 지원하는 gateway 가 필요합니다. 오래된 gateway 는 unknown-method 오류를 반환합니다.
- 스캔 후 device pairing 을 승인하려면:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`
