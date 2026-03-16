---
summary: "CLI reference for `openclaw uninstall` (remove gateway service + local data)"
description: "Gateway service와 local data를 제거하되 CLI binary는 남겨 두는 `openclaw uninstall` 사용법과 dry-run 예시를 정리합니다."
read_when:
  - gateway service와 local state를 제거하고 싶을 때
  - 먼저 dry-run으로 확인하고 싶을 때
title: "uninstall"
x-i18n:
  source_path: "cli/uninstall.md"
---

# `openclaw uninstall`

gateway service와 local data를 제거합니다. (CLI는 유지)

```bash
openclaw backup create
openclaw uninstall
openclaw uninstall --all --yes
openclaw uninstall --dry-run
```

state나 workspace를 제거하기 전에 복원 가능한 snapshot이 필요하다면 먼저 `openclaw backup create`를 실행하세요.
