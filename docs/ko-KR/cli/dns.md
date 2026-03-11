---
summary: "CLI reference for `openclaw dns` (광역 discovery 헬퍼)"
read_when:
  - Tailscale + CoreDNS 를 통한 광역 discovery(DNS-SD)를 원할 때
  - 사용자 정의 discovery 도메인(예: openclaw.internal)을 위한 split DNS 를 설정할 때
title: "dns"
---

# `openclaw dns`

광역 discovery(Tailscale + CoreDNS)를 위한 DNS 헬퍼입니다. 현재는 macOS + Homebrew CoreDNS 중심입니다.

관련 문서:

- Gateway discovery: [Discovery](/gateway/discovery)
- 광역 discovery 설정: [Configuration](/gateway/configuration)

## 설정

```bash
openclaw dns setup
openclaw dns setup --apply
```
