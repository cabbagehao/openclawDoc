---
summary: "CLI 설치는 유지한 채 로컬 설정 및 상태 데이터를 초기화하는 `openclaw reset` 명령어 레퍼런스"
read_when:
  - CLI 도구는 그대로 둔 상태에서 로컬의 모든 설정과 상태를 삭제하고자 할 때
  - 실제 초기화 전 삭제될 대상 목록을 미리 확인(Dry-run)하고 싶을 때
title: "reset"
x-i18n:
  source_path: "cli/reset.md"
---

# `openclaw reset`

로컬의 설정 파일 및 상태 데이터를 초기화함. (CLI 명령어 자체는 삭제되지 않고 유지됨)

## 사용법

```bash
# 로컬 상태를 지우기 전, 복원 가능한 백업 생성을 권장함
openclaw backup create

# 대화형 초기화 시작
openclaw reset

# 실제 삭제 없이 삭제될 대상 경로만 미리 확인
openclaw reset --dry-run

# 특정 범위를 지정하여 비대화형으로 즉시 초기화
openclaw reset --scope config+creds+sessions --yes --non-interactive
```

## 주요 옵션

* **`--scope <scope>`**: 초기화 범위를 지정함.
  * `config`: 설정 파일만 삭제.
  * `config+creds+sessions`: 설정, 자격 증명, 세션 이력을 모두 삭제 (기본값).
  * `full`: 워크스페이스를 포함한 모든 OpenClaw 관련 데이터를 삭제.
* **`--dry-run`**: 실제 파일을 삭제하지 않고 처리될 작업 내역만 출력함.
* **`--yes`**: 사용자 확인 프롬프트를 건너뜀.

<Tip>
  로컬 상태를 완전히 제거하기 전에 만약의 상황을 대비해 반드시 **`openclaw backup create`** 명령어로 백업 아카이브를 생성해 둘 것을 강력히 권장함.
</Tip>
