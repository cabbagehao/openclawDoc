---
summary: "OpenClaw의 안전한 업데이트 및 채널 전환을 지원하는 `openclaw update` 명령어 레퍼런스"
read_when:
  - 소스 체크아웃 환경을 최신 버전으로 안전하게 업데이트하고자 할 때
  - `--update` 축약어의 동작 방식을 이해해야 할 때
title: "update"
x-i18n:
  source_path: "cli/update.md"
---

# `openclaw update`

OpenClaw를 안전하게 업데이트하고 안정(Stable), 베타(Beta), 개발(Dev) 채널 간을 자유롭게 전환함.

**npm/pnpm**을 통해 전역 설치한 경우(Git 메타데이터가 없는 환경), 업데이트는 [업데이트 가이드](/install/updating)에 명시된 패키지 매니저의 표준 워크플로우를 따름.

## 사용법

```bash
# 기본 업데이트 실행
openclaw update

# 업데이트 상태 및 가용 여부 확인
openclaw update status

# 대화형 업데이트 마법사 실행
openclaw update wizard

# 베타 채널로 전환 및 업데이트
openclaw update --channel beta

# 개발 채널로 전환 및 업데이트
openclaw update --channel dev

# 실제 설치 없이 업데이트 계획만 미리 확인
openclaw update --dry-run

# 업데이트 후 서버 자동 재시작 방지
openclaw update --no-restart

# 실행 결과를 JSON 형식으로 출력
openclaw update --json

# 업데이트 축약 명령어
openclaw --update
```

## 주요 옵션

- **`--no-restart`**: 업데이트 성공 후 Gateway 서비스를 자동으로 재시작하지 않음.
- **`--channel <stable|beta|dev>`**: 업데이트 채널을 설정함 (Git 및 npm 설정에 저장됨).
- **`--tag <dist-tag|version>`**: 이번 업데이트에 한해 특정 npm 배포 태그나 버전을 강제 지정함.
- **`--dry-run`**: 실제 파일 수정이나 설치, 재시작 없이 계획된 작업 내역만 미리 출력함.
- **`--timeout <seconds>`**: 각 단계별 타임아웃 시간 지정 (기본값: 1200초).

<Note>
버전을 낮추는 다운그레이드 작업은 기존 설정을 손상시킬 위험이 있으므로 항상 사용자 확인 과정을 거침.
</Note>

## `update status`

현재 활성화된 업데이트 채널, Git 태그/브랜치/SHA 정보(소스 설치 시) 및 신규 업데이트 가능 여부를 확인함.

```bash
openclaw update status
openclaw update status --json
```

## `update wizard`

업데이트 채널을 선택하고 업데이트 후 서버 재시작 여부를 결정하는 대화형 프로세스임. Git 체크아웃이 없는 상태에서 `dev` 채널을 선택하면 자동으로 체크아웃 생성을 제안함.

## 동작 원리

채널을 명시적으로 전환(`--channel`)할 경우, OpenClaw는 해당 채널에 적합한 설치 방식을 자동으로 유지함:

- **`dev`**: Git 체크아웃을 보장함 (기본 경로: `~/openclaw`). 소스를 최신화한 후 해당 경로에서 전역 CLI를 연결함.
- **`stable` / **`beta`**: 지정된 배포 태그(dist-tag)를 사용하여 npm으로부터 최신 패키지를 설치함.

설정에서 활성화된 경우, Gateway 코어의 자동 업데이트 기능도 이와 동일한 경로를 사용함.

## Git 체크아웃 업데이트 워크플로우

1. **상태 점검**: 작업 트리(Worktree)가 깨끗한지(커밋되지 않은 변경 사항 유무) 확인함.
2. **채널 전환**: 지정된 태그나 브랜치로 전환함.
3. **업스트림 동기화**: 최신 코드를 가져오고 리베이스(Rebase)를 수행함 (`dev` 채널 전용).
4. **빌드 검증 (`dev` 전용)**: 임시 작업 트리에서 린트 및 TypeScript 빌드를 먼저 수행함. 실패 시 정상 빌드가 가능한 최근 커밋을 찾아 거슬러 올라가며 안정성을 확보함.
5. **의존성 설치**: `pnpm`(권장) 또는 `npm`을 사용하여 필요한 패키지를 설치함.
6. **빌드**: 핵심 소스 및 Control UI 리소스를 빌드함.
7. **최종 진단**: `openclaw doctor`를 실행하여 업데이트 후의 시스템 무결성을 검증함.
8. **플러그인 동기화**: 활성 채널에 맞춰 플러그인 소스를 정렬하고 업데이트를 수행함.

## `--update` 축약어

`openclaw --update` 형식은 내부적으로 `openclaw update`로 해석되어 실행됨. 셸 스크립트나 런처에서 간편하게 사용할 수 있음.

## 관련 문서

- **진단 도구**: [`openclaw doctor`](/cli/doctor) (업데이트 권장 사항 포함)
- **개발 채널 안내**: [Development channels](/install/development-channels)
- **업데이트 가이드 전체**: [Updating](/install/updating)
