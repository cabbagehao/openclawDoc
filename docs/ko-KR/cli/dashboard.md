---
summary: "CLI reference for `openclaw dashboard` (Control UI 열기)"
read_when:
  - 현재 토큰으로 Control UI 를 열고 싶을 때
  - 브라우저를 실행하지 않고 URL 만 출력하고 싶을 때
title: "dashboard"
---

# `openclaw dashboard`

현재 인증 정보를 사용해 Control UI 를 엽니다.

```bash
openclaw dashboard
openclaw dashboard --no-open
```

메모:

- `dashboard` 는 가능한 경우 설정된 `gateway.auth.token` SecretRef 를 해석합니다.
- SecretRef 로 관리되는 토큰(해결되었든 아니든)의 경우, `dashboard` 는 외부 비밀이 터미널 출력, 클립보드 기록, 브라우저 실행 인자에 노출되지 않도록 토큰이 없는 URL 을 출력/복사/오픈합니다.
- `gateway.auth.token` 이 SecretRef 로 관리되지만 이 명령 경로에서 해석되지 않으면, 잘못된 토큰 자리표시자를 끼워 넣는 대신 토큰 없는 URL 과 명시적인 복구 지침을 출력합니다.
