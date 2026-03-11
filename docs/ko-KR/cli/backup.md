---
summary: "OpenClaw 상태, 설정, 자격 증명 및 워크스페이스 데이터를 로컬 백업 아카이브로 생성하는 `openclaw backup` 명령어 레퍼런스"
read_when:
  - 로컬 OpenClaw 상태 데이터의 정식 백업 아카이브가 필요할 때
  - 시스템 초기화(Reset) 또는 삭제(Uninstall) 전 백업 대상 경로를 확인하고 싶을 때
title: "backup"
x-i18n:
  source_path: "cli/backup.md"
---

# `openclaw backup`

OpenClaw의 상태 정보, 설정 파일, 자격 증명(Credentials), 세션 이력 및 선택적으로 워크스페이스 데이터를 포함하는 로컬 백업 아카이브를 생성함.

## 주요 명령어

```bash
# 기본 백업 생성 (타임스탬프가 붙은 .tar.gz 파일 생성)
openclaw backup create

# 출력 디렉터리 지정
openclaw backup create --output ~/Backups

# 실행 전 백업 대상 및 구성을 JSON 형식으로 미리 보기
openclaw backup create --dry-run --json

# 아카이브 생성 직후 무결성 검증 수행
openclaw backup create --verify

# 워크스페이스 데이터를 제외하고 백업 생성
openclaw backup create --no-include-workspace

# 설정 파일(JSON)만 백업
openclaw backup create --only-config

# 특정 아카이브 파일의 무결성 검증
openclaw backup verify ./2026-03-09T00-00-00.000Z-openclaw-backup.tar.gz
```

## 참고 사항

- 생성된 아카이브 내부에는 원본 소스 경로와 아카이브 레이아웃 정보가 담긴 `manifest.json` 파일이 포함됨.
- 기본적으로 현재 작업 디렉터리에 아카이브가 생성되나, 현재 디렉터리가 백업 대상 폴더 내부에 있을 경우 사용자 홈 디렉터리로 위치가 자동 조정됨.
- 기존에 동일한 이름의 아카이브 파일이 존재할 경우 덮어쓰지 않음.
- 백업 대상 경로(상태 폴더나 워크스페이스) 내부를 출력 경로로 지정할 수 없음 (무한 루프 방지).
- `verify` 명령어는 아카이브 내에 유효한 루트 매니페스트가 존재하는지, 선언된 모든 파일이 실제 압축 파일 내에 포함되어 있는지, 보안상 위험한 경로(Traversal)가 없는지 등을 검증함.

## 백업 대상 항목

`openclaw backup create` 실행 시 다음 항목들이 포함됨:

- **상태 디렉터리**: 기본값 `~/.openclaw` (환경 변수 설정에 따라 달라질 수 있음).
- **설정 파일**: 현재 활성화된 `openclaw.json` 파일 경로.
- **자격 증명 저장소**: OAuth 토큰 및 API 키가 저장된 폴더.
- **워크스페이스**: 현재 설정에 등록된 워크스페이스 디렉터리 (`--no-include-workspace` 플래그로 제외 가능).

경로 정규화(Canonicalization) 과정을 거치므로, 워크스페이스나 설정 파일이 이미 상태 디렉터리 하위에 존재할 경우 중복해서 백업하지 않음. 존재하지 않는 경로는 자동으로 건너뜀.

## 설정 파일 오류 시 동작

`openclaw backup`은 시스템 복구를 돕기 위한 도구이므로, 일반적인 명령어 실행 전 수행되는 설정 파일 검증 과정을 의도적으로 건너뜀. 단, 워크스페이스 경로는 설정 파일 파싱에 의존하므로, 설정 파일이 존재하지만 형식이 잘못된 경우 워크스페이스 포함 백업은 실패함.

이런 상황에서 부분 백업을 수행하려면 다음 명령어를 사용함:

```bash
openclaw backup create --no-include-workspace
```

이 방식은 워크스페이스 탐색 과정을 생략하므로 설정 파일이 손상된 상태에서도 상태 정보와 자격 증명 데이터를 안전하게 확보할 수 있음. 설정 파일 자체만 복사하고 싶다면 `--only-config` 옵션을 사용함.

## 용량 및 성능 가이드

OpenClaw는 백업 크기에 대한 별도의 제한을 두지 않음. 실제 처리 능력은 로컬 하드웨어 사양에 의존함:

- **워크스페이스 크기**: 백업 파일 용량과 생성 속도에 가장 큰 영향을 주는 요인임. 빠른 백업을 원할 경우 `--no-include-workspace` 사용을 권장함.
- **디스크 공간**: 임시 파일 생성 및 최종 아카이브 저장을 위한 충분한 여유 공간이 필요함.
- **파일 시스템**: 가급적 하드 링크(Hard-link) 기능을 지원하는 파일 시스템 사용을 권장하며, 미지원 시 데이터 복사 방식으로 동작함.
