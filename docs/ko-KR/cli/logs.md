---
summary: "CLI reference for `openclaw logs` (tail gateway logs via RPC)"
description: "SSH 없이 RPC로 Gateway 로그를 tail하고, JSON 출력이나 local timezone 표시를 사용할 때 필요한 `openclaw logs` 명령을 설명합니다."
read_when:
  - SSH 없이 원격 Gateway log를 tail해야 할 때
  - tooling용 JSON log line이 필요할 때
title: "logs"
x-i18n:
  source_path: "cli/logs.md"
---

# `openclaw logs`

RPC를 통해 Gateway file log를 tail합니다. remote mode에서도 동작합니다.

Related:

- Logging overview: [Logging](/logging)

## Examples

```bash
openclaw logs
openclaw logs --follow
openclaw logs --json
openclaw logs --limit 500
openclaw logs --local-time
openclaw logs --follow --local-time
```

timestamp를 local timezone으로 렌더링하려면 `--local-time`을 사용하세요.
