---
summary: "CLI reference for `openclaw dashboard` (open the Control UI)"
description: "현재 auth 설정으로 OpenClaw Control UI를 열거나, browser를 띄우지 않고 URL만 확인하는 `openclaw dashboard` 명령의 동작을 설명합니다."
read_when:
  - 현재 token으로 Control UI를 열고 싶을 때
  - browser launch 없이 URL만 출력하고 싶을 때
title: "dashboard"
x-i18n:
  source_path: "cli/dashboard.md"
---

# `openclaw dashboard`

현재 auth를 사용해 Control UI를 엽니다.

```bash
openclaw dashboard
openclaw dashboard --no-open
```

Notes:

- `dashboard`는 가능하면 configured `gateway.auth.token` SecretRef를 resolve합니다.
- SecretRef-managed token이 있는 경우(resolve 가능 여부와 무관하게), `dashboard`는 terminal output, clipboard history, browser-launch argument에 외부 secret이 노출되지 않도록 non-tokenized URL을 출력/복사/오픈합니다.
- `gateway.auth.token`이 SecretRef-managed이지만 현재 command path에서 unresolved 상태면, command는 invalid token placeholder를 넣는 대신 non-tokenized URL과 명시적인 remediation guidance를 출력합니다.
