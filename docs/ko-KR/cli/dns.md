---
summary: "CLI reference for `openclaw dns` (wide-area discovery helpers)"
description: "Tailscale과 CoreDNS를 사용하는 wide-area discovery 환경에서 DNS-SD를 준비할 때 쓰는 `openclaw dns` 설정 도우미를 소개합니다."
read_when:
  - Tailscale + CoreDNS 기반 wide-area discovery를 설정할 때
  - custom discovery domain용 split DNS를 준비할 때
title: "dns"
x-i18n:
  source_path: "cli/dns.md"
---

# `openclaw dns`

wide-area discovery (Tailscale + CoreDNS)를 위한 DNS helper입니다. 현재는 macOS + Homebrew CoreDNS 환경에 초점을 맞춥니다.

Related:

- Gateway discovery: [Discovery](/gateway/discovery)
- Wide-area discovery config: [Configuration](/gateway/configuration)

## Setup

```bash
openclaw dns setup
openclaw dns setup --apply
```
