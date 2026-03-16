---
summary: "CLI 설치는 유지한 채 로컬 설정 및 상태 데이터를 초기화하는 `openclaw reset` 명령어 레퍼런스"
description: "CLI는 남겨 둔 채 local config와 state를 지우는 `openclaw reset` 사용법과 scope 예시를 간단히 정리합니다."
read_when:
  - CLI 설치는 유지한 채 local state를 지우고 싶을 때
  - 어떤 항목이 삭제될지 dry-run으로 확인하고 싶을 때
title: "reset"
x-i18n:
  source_path: "cli/reset.md"
---

# `openclaw reset`

local config와 state를 초기화합니다. (CLI 설치는 유지)

```bash
openclaw backup create
openclaw reset
openclaw reset --dry-run
openclaw reset --scope config+creds+sessions --yes --non-interactive
```

local state를 지우기 전에 복원 가능한 snapshot이 필요하다면 먼저 `openclaw backup create`를 실행하세요.
