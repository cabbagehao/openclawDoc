---
summary: "Tailscale 및 CoreDNS 기반의 광역 탐색(Wide-area Discovery) 지원을 위한 `openclaw dns` 명령어 레퍼런스"
read_when:
  - Tailscale과 CoreDNS를 활용하여 네트워크 전반의 기기 탐색(DNS-SD)을 설정하고자 할 때
  - 커스텀 탐색 도메인(예: openclaw.internal)을 위한 분할 DNS(Split DNS)를 구축할 때
title: "dns"
x-i18n:
  source_path: "cli/dns.md"
---

# `openclaw dns`

광역 탐색(Wide-area Discovery, Tailscale + CoreDNS) 환경 구축을 위한 DNS 헬퍼 도구임. 현재 macOS 및 Homebrew 기반의 CoreDNS 설정을 중점적으로 지원함.

**관련 문서:**
- Gateway 탐색 가이드: [Discovery](/gateway/discovery)
- 광역 탐색 설정 레퍼런스: [Configuration](/gateway/configuration)

## 설정 방법 (Setup)

```bash
# DNS 설정 상태 확인 및 가이드 출력
openclaw dns setup

# 실제 설정 변경 사항 적용
openclaw dns setup --apply
```
