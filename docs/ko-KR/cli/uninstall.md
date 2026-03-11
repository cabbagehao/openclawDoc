---
summary: "CLI reference for `openclaw uninstall` (gateway 서비스 + 로컬 데이터 제거)"
read_when:
  - gateway 서비스와/또는 로컬 상태를 제거하고 싶을 때
  - 먼저 dry-run 을 해보고 싶을 때
title: "uninstall"
---

# `openclaw uninstall`

gateway 서비스와 로컬 데이터를 제거합니다(CLI 는 남음).

```bash
openclaw backup create
openclaw uninstall
openclaw uninstall --all --yes
openclaw uninstall --dry-run
```

상태나 워크스페이스를 제거하기 전에 복원 가능한 스냅샷이 필요하면 먼저 `openclaw backup create` 를 실행하세요.
