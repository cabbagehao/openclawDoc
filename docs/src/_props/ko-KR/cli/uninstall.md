---
summary: "Gateway 서버 서비스 및 로컬 데이터를 삭제하는 `openclaw uninstall` 명령어 레퍼런스"
read_when:
  - Gateway 서비스를 중단하고 로컬 상태 데이터를 제거하고자 할 때
  - 실제 삭제 전 수행될 작업 내역을 미리 확인(Dry-run)하고 싶을 때
title: "uninstall"
x-i18n:
  source_path: "cli/uninstall.md"
---

# `openclaw uninstall`

시스템에 등록된 Gateway 서비스(Daemon)를 제거하고 로컬 상태 데이터를 삭제함. (CLI 명령어 자체는 삭제되지 않고 유지됨)

## 사용법

```bash
# 데이터 삭제 전, 복원 가능한 백업 생성을 권장함
openclaw backup create

# 대화형 삭제 프로세스 시작
openclaw uninstall

# 모든 구성 요소(서비스, 설정, 세션, 워크스페이스)를 확인 없이 즉시 삭제
openclaw uninstall --all --yes

# 실제 삭제 없이 삭제될 대상 및 경로만 미리 확인
openclaw uninstall --dry-run
```

## 참고 사항

* **백업 권장**: 상태 데이터나 워크스페이스를 완전히 제거하기 전에 만약의 상황을 대비해 반드시 **`openclaw backup create`** 명령어로 백업 아카이브를 생성해 둘 것을 강력히 권장함.
* **삭제 범위**: 기본적으로 서비스 언인스톨을 수행하며, 선택에 따라 설정 파일, 자격 증명, 세션 이력 및 워크스페이스 디렉터리까지 삭제 범위를 확장할 수 있음.
* **CLI 유지**: 이 명령어는 로컬 데이터를 관리하는 도구이므로, `openclaw` 명령어 자체나 npm/pnpm을 통해 설치된 실행 바이너리는 제거하지 않음.
