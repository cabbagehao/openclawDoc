---
summary: "CLI reference for `openclaw tui` (terminal UI connected to the Gateway)"
description: "Gateway에 연결되는 terminal UI를 실행하고 URL, token, session을 script에서 넘기는 `openclaw tui` 사용 흐름을 설명합니다."
read_when:
  - Gateway용 terminal UI가 필요할 때
  - script에서 url, token, session을 넘기고 싶을 때
title: "tui"
x-i18n:
  source_path: "cli/tui.md"
---

# `openclaw tui`

Gateway에 연결되는 terminal UI를 엽니다.

Related:

- TUI guide: [TUI](/web/tui)

Notes:

- `tui`는 가능한 경우 token/password auth에 대해 configured gateway auth SecretRef를 resolve합니다. (`env`/`file`/`exec` provider)
- configured agent workspace directory 안에서 실행되면, TUI는 session key 기본값으로 그 agent를 자동 선택합니다. (`--session`이 명시적으로 `agent:<id>:...`인 경우 제외)

## Examples

```bash
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
# when run inside an agent workspace, infers that agent automatically
openclaw tui --session bugfix
```
