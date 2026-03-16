---
summary: "CLI reference for `openclaw status` (diagnostics, probes, usage snapshots)"
description: "channel health, session store, usage snapshot을 빠르게 진단하는 `openclaw status`의 주요 옵션과 출력 특성을 설명합니다."
read_when:
  - channel health와 최근 session recipient를 빠르게 진단하고 싶을 때
  - 붙여 넣기 쉬운 전체 상태 요약이 필요할 때
title: "status"
x-i18n:
  source_path: "cli/status.md"
---

# `openclaw status`

channel과 session을 위한 진단 명령입니다.

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

Notes:

- `--deep`는 live probe를 실행합니다. (WhatsApp Web + Telegram + Discord + Google Chat + Slack + Signal)
- 여러 agent가 configured되어 있으면 output에 agent별 session store가 포함됩니다.
- 가능하면 overview에 Gateway + node host service의 install/runtime 상태가 포함됩니다.
- overview에는 update channel과 git SHA(source checkout일 때)도 포함됩니다.
- update 정보는 Overview에 노출되며, update가 available하면 `openclaw update`를 실행하라는 힌트를 출력합니다. ([Updating](/install/updating) 참고)
- read-only status surface(`status`, `status --json`, `status --all`)는 가능한 경우 대상 config path의 supported SecretRef를 resolve합니다.
- supported channel SecretRef가 configured되어 있지만 현재 command path에서 사용할 수 없으면, status는 crash하지 않고 read-only 상태를 유지한 채 degraded output을 보고합니다. human output에는 “configured token unavailable in this command path” 같은 경고가 나타나고, JSON output에는 `secretDiagnostics`가 포함됩니다.
