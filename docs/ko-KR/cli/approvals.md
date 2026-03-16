---
summary: "CLI reference for `openclaw approvals` (exec approvals for gateway or node hosts)"
description: "`openclaw approvals` 명령으로 local host, gateway host, node host의 exec approval allowlist를 조회하고 교체하는 방법을 설명합니다."
read_when:
  - CLI에서 exec approval을 수정하려고 할 때
  - gateway 또는 node host의 allowlist를 관리해야 할 때
title: "approvals"
x-i18n:
  source_path: "cli/approvals.md"
---

# `openclaw approvals`

**local host**, **gateway host**, 또는 **node host**의 exec approval을 관리합니다.
기본적으로 명령은 디스크의 local approvals file을 대상으로 합니다. Gateway를 대상으로 하려면 `--gateway`, 특정 node를 대상으로 하려면 `--node`를 사용하세요.

Related:

- Exec approvals: [Exec approvals](/tools/exec-approvals)
- Nodes: [Nodes](/nodes)

## Common commands

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

## Replace approvals from a file

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

## Allowlist helpers

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## Notes

- `--node`는 `openclaw nodes`와 같은 resolver를 사용합니다. (`id`, `name`, `ip`, 또는 id prefix)
- `--agent` 기본값은 `"*"`이며, 모든 agent에 적용됩니다.
- node host는 `system.execApprovals.get/set`를 advertise해야 합니다. (macOS app 또는 headless node host)
- approvals file은 host별로 `~/.openclaw/exec-approvals.json`에 저장됩니다.
