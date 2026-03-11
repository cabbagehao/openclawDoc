---
summary: "Gateway 서버에 연결된 터미널 사용자 인터페이스(TUI)를 실행하는 `openclaw tui` 명령어 레퍼런스"
read_when:
  - 원격 접속 환경에서도 사용 가능한 터미널 기반 채팅 UI를 실행하고자 할 때
  - 스크립트를 통해 접속 URL, 토큰 또는 세션 정보를 전달하여 TUI를 구동할 때
title: "tui"
x-i18n:
  source_path: "cli/tui.md"
---

# `openclaw tui`

Gateway 서버에 연결된 터미널 기반의 사용자 인터페이스(TUI)를 실행함.

**관련 문서:**

* TUI 상세 가이드: [TUI](/web/tui)

## 사용 예시

```bash
# 기본 설정으로 TUI 실행
openclaw tui

# 특정 URL 및 토큰을 지정하여 접속
openclaw tui --url ws://127.0.0.1:18789 --token <값>

# 메인 세션으로 즉시 연결하고 메시지 자동 전송 활성화
openclaw tui --session main --deliver

# 특정 워크스페이스 내부에서 실행 시 해당 에이전트 자동 선택
openclaw tui --session bugfix
```

## 참고 사항

* **인증 연동**: `tui` 명령어는 가능한 경우 토큰 및 비밀번호 인증을 위해 설정된 Gateway 시크릿 참조(SecretRef)를 자동으로 해석함.
* **에이전트 자동 추론**: 에이전트 워크스페이스 디렉터리 내부에서 명령어를 실행할 경우, TUI는 해당 에이전트를 세션 키의 기본 대상으로 자동 선택함 (단, `--session agent:<id>:...`와 같이 명시적으로 지정한 경우는 제외).
