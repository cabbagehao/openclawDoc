---
summary: "CLI reference for `openclaw reset` (로컬 상태/설정 초기화)"
read_when:
  - CLI 는 유지한 채 로컬 상태를 지우고 싶을 때
  - 무엇이 제거될지 dry-run 으로 보고 싶을 때
title: "reset"
---

# `openclaw reset`

로컬 설정/상태를 초기화합니다(CLI 는 유지됨).

```bash
openclaw backup create
openclaw reset
openclaw reset --dry-run
openclaw reset --scope config+creds+sessions --yes --non-interactive
```

로컬 상태를 제거하기 전에 복원 가능한 스냅샷이 필요하면 먼저 `openclaw backup create` 를 실행하세요.
