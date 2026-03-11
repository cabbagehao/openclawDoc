---
summary: "OpenClaw Control UI(웹 인터페이스) 접속 및 관리를 위한 `openclaw dashboard` 명령어 레퍼런스"
read_when:
  - 현재 인증 정보를 사용하여 Control UI에 접속하고자 할 때
  - 브라우저를 실행하지 않고 접속 URL 정보만 확인하고 싶을 때
title: "dashboard"
x-i18n:
  source_path: "cli/dashboard.md"
---

# `openclaw dashboard`

현재 설정된 인증 정보를 사용하여 웹 기반의 Control UI를 실행하거나 접속 정보를 확인함.

## 사용법

```bash
# 기본 브라우저에서 대시보드 자동 열기
openclaw dashboard

# 브라우저를 열지 않고 접속 URL만 출력
openclaw dashboard --no-open
```

## 참고 사항

- **인증 연동**: `dashboard` 명령어는 가능한 경우 설정된 `gateway.auth.token` 시크릿 참조(SecretRef)를 자동으로 해석함.
- **보안 강화**: 시크릿 참조로 관리되는 토큰의 경우, 터미널 출력물, 클립보드 이력 또는 브라우저 실행 인자에 비밀 정보가 노출되지 않도록 토큰 정보가 제거된 URL을 생성하여 제공함.
- **오류 처리**: 만약 `gateway.auth.token`이 시크릿 참조로 설정되어 있으나 현재 환경에서 해석할 수 없는 경우, 시스템은 유효하지 않은 토큰 값을 끼워넣는 대신 토큰이 포함되지 않은 URL과 함께 구체적인 해결 방법을 안내함.
