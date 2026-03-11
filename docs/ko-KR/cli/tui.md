---
summary: "CLI reference for `openclaw tui` (Gateway 에 연결된 터미널 UI)"
read_when:
  - Gateway 용 터미널 UI 를 사용하고 싶을 때(원격 친화적)
  - 스크립트에서 url/token/session 을 전달하고 싶을 때
title: "tui"
---

# `openclaw tui`

Gateway 에 연결된 터미널 UI 를 엽니다.

관련 문서:

- TUI 가이드: [TUI](/web/tui)

메모:

- `tui` 는 가능한 경우 토큰/비밀번호 인증을 위한 gateway auth SecretRef(`env`/`file`/`exec` provider)를 해석합니다.
- 구성된 agent 워크스페이스 디렉터리 안에서 실행하면, TUI 는 세션 키 기본값으로 해당 agent 를 자동 선택합니다(`--session` 이 명시적으로 `agent:<id>:...` 로 지정되지 않은 경우).

## 예시

```bash
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
# agent workspace 안에서 실행하면 해당 agent 를 자동 추론
openclaw tui --session bugfix
```
