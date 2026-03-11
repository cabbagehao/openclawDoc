---
summary: "iOS 앱 페어링을 위한 QR 코드 및 설정 코드(Setup Code)를 생성하는 `openclaw qr` 명령어 레퍼런스"
read_when:
  - iOS 앱과 Gateway 서버를 간편하게 페어링하고자 할 때
  - 원격 접속 또는 수동 설정을 위한 설정 코드가 필요할 때
title: "qr"
x-i18n:
  source_path: "cli/qr.md"
---

# `openclaw qr`

현재의 Gateway 설정을 기반으로 iOS 페어링용 QR 코드 및 설정 코드(Setup Code)를 생성함.

## 사용법

```bash
# 로컬 설정 기준 QR 코드 생성
openclaw qr

# 설정 코드만 텍스트로 출력
openclaw qr --setup-code-only

# 모든 정보를 JSON 형식으로 출력
openclaw qr --json

# 원격 서버 설정 기준 QR 코드 생성
openclaw qr --remote

# 특정 URL 및 토큰을 지정하여 생성
openclaw qr --url wss://gateway.example/ws --token '<token>'
```

## 주요 옵션

* **`--remote`**: 설정 파일의 `gateway.remote.url` 및 원격 인증 정보(토큰/비밀번호)를 사용함.
* **`--url <url>`**: 페어링 정보에 포함될 Gateway WebSocket 주소를 오버라이드함.
* **`--public-url <url>`**: 페어링 정보에 포함될 공개(Public) URL 주소를 오버라이드함.
* **`--token <token>`**: 페어링용 토큰 지정.
* **`--password <password>`**: 페어링용 비밀번호 지정.
* **`--setup-code-only`**: QR 코드를 제외하고 설정 코드 문자열만 출력함.
* **`--no-ascii`**: 터미널에 ASCII QR 코드를 렌더링하지 않음.
* **`--json`**: `setupCode`, `gatewayUrl`, `auth`, `urlSource` 등이 포함된 JSON 데이터를 출력함.

## 참고 사항

* **인증 상호 배타성**: `--token`과 `--password` 옵션은 동시에 사용할 수 없음.
* **시크릿 관리 (SecretRef)**:
  * `--remote` 모드에서 인증 정보가 시크릿 참조(SecretRef)로 설정되어 있고 직접 값을 전달하지 않은 경우, CLI는 실행 중인 Gateway로부터 실제 값을 안전하게 가져옴. Gateway 서버에 연결할 수 없는 경우 실행이 중단됨.
  * 로컬 모드에서도 별도의 오버라이드가 없으면 인증 모드(`gateway.auth.mode`)에 따라 적절한 SecretRef 값을 자동으로 해석하여 사용함.
* **모드 설정 필수**: 토큰과 비밀번호가 모두 설정되어 있으나 인증 모드가 지정되지 않은 경우, 모드가 확실히 지정될 때까지 설정 코드 생성이 차단됨.
* **버전 호환성**: 이 기능은 `secrets.resolve` 메서드를 지원하는 최신 버전의 Gateway 서버를 필요로 함. 이전 버전의 서버는 오류를 반환할 수 있음.
* **페어링 완료 절차**: 모바일 앱에서 QR 코드를 스캔한 후, Gateway에서 최종 승인이 필요함:
  1. `openclaw devices list` 명령어로 대기 중인 요청 확인.
  2. `openclaw devices approve <requestId>` 명령어로 승인 완료.
