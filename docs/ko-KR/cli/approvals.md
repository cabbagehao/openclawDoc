---
summary: "`openclaw approvals`용 CLI 레퍼런스(gateway 또는 node host용 exec approvals)"
read_when:
  - CLI에서 exec approvals를 수정하려고 할 때
  - gateway 또는 node host의 allowlist를 관리해야 할 때
title: "approvals"
---

# `openclaw approvals`

**로컬 host**, **gateway host**, 또는 **node host**의 exec approvals를 관리합니다.
기본적으로 명령은 디스크에 있는 로컬 approvals 파일을 대상으로 합니다. gateway를 대상으로 하려면 `--gateway`를, 특정 node를 대상으로 하려면 `--node`를 사용하세요.

관련:

- Exec approvals: [Exec approvals](/tools/exec-approvals)
- Nodes: [Nodes](/nodes)

## 자주 쓰는 명령

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

## 파일로 approvals 교체

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

## allowlist helper 명령

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## 참고

- `--node`는 `openclaw nodes`와 같은 resolver를 사용합니다(id, name, ip 또는 id prefix).
- `--agent`의 기본값은 `"*"`이며, 모든 agent에 적용됩니다.
- node host는 `system.execApprovals.get/set`을 advertise해야 합니다(macOS app 또는 headless node host).
- approvals 파일은 host별로 `~/.openclaw/exec-approvals.json`에 저장됩니다.
