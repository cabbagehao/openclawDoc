---
summary: "`openclaw update`용 CLI 레퍼런스(상대적으로 안전한 소스 업데이트 + gateway 자동 재시작)"
read_when:
  - 소스 체크아웃을 안전하게 업데이트하려고 할 때
  - `--update` 축약 동작을 이해해야 할 때
title: "update"
---

# `openclaw update`

OpenClaw를 안전하게 업데이트하고 stable/beta/dev 채널 간에 전환합니다.

**npm/pnpm**으로 설치했다면(전역 설치, git 메타데이터 없음), 업데이트는 [Updating](/install/updating)의 패키지 매니저 흐름을 통해 수행됩니다.

## 사용법

```bash
openclaw update
openclaw update status
openclaw update wizard
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag beta
openclaw update --dry-run
openclaw update --no-restart
openclaw update --json
openclaw --update
```

## 옵션

- `--no-restart`: 업데이트가 성공한 뒤 Gateway 서비스를 재시작하지 않습니다.
- `--channel <stable|beta|dev>`: 업데이트 채널을 설정합니다(git + npm, 설정에 유지됨).
- `--tag <dist-tag|version>`: 이번 업데이트에 한해 npm dist-tag 또는 버전을 덮어씁니다.
- `--dry-run`: 설정 기록, 설치, 플러그인 동기화, 재시작 없이 계획된 업데이트 작업(channel/tag/target/restart 흐름)을 미리 봅니다.
- `--json`: 기계 판독용 `UpdateRunResult` JSON을 출력합니다.
- `--timeout <seconds>`: 단계별 타임아웃(기본값 `1200s`).

참고: 다운그레이드는 이전 버전이 설정을 깨뜨릴 수 있으므로 확인이 필요합니다.

## `update status`

활성 업데이트 채널과 git tag/branch/SHA(소스 체크아웃인 경우), 그리고 업데이트 가능 여부를 표시합니다.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

옵션:

- `--json`: 기계 판독용 상태 JSON을 출력합니다.
- `--timeout <seconds>`: 검사 타임아웃(기본값 `3s`).

## `update wizard`

업데이트 채널을 고르고 업데이트 후 Gateway를 재시작할지 확인하는 대화형 흐름입니다(기본값은 재시작). git 체크아웃 없이 `dev`를 선택하면 체크아웃을 생성할지 제안합니다.

## 수행 내용

채널을 명시적으로 전환하면(`--channel ...`), OpenClaw는 설치 방식도 함께 맞춥니다.

- `dev` → git 체크아웃을 보장하고(기본값 `~/openclaw`, `OPENCLAW_GIT_DIR`로 재정의 가능), 이를 업데이트한 뒤 그 체크아웃에서 전역 CLI를 설치합니다.
- `stable`/`beta` → 해당 dist-tag에 맞춰 npm에서 설치합니다.

Gateway 코어 자동 업데이터(설정에서 활성화된 경우)도 같은 업데이트 경로를 재사용합니다.

## Git 체크아웃 흐름

채널:

- `stable`: 최신 비베타 태그를 체크아웃한 뒤 build + doctor를 실행합니다.
- `beta`: 최신 `-beta` 태그를 체크아웃한 뒤 build + doctor를 실행합니다.
- `dev`: `main`을 체크아웃한 뒤 fetch + rebase를 수행합니다.

상위 수준 흐름:

1. 깨끗한 worktree(커밋되지 않은 변경 없음)가 필요합니다.
2. 선택한 채널(tag 또는 branch)로 전환합니다.
3. upstream을 fetch합니다(`dev`만).
4. `dev`만: 임시 worktree에서 preflight lint + TypeScript build를 실행하고, 최신 커밋이 실패하면 최대 10개 커밋 전까지 거슬러 올라가 가장 최근에 깔끔하게 빌드되는 지점을 찾습니다.
5. 선택한 커밋 위로 rebase합니다(`dev`만).
6. 의존성을 설치합니다(`pnpm` 우선, `npm` 폴백).
7. 빌드와 Control UI 빌드를 수행합니다.
8. 마지막 “안전한 업데이트” 검사로 `openclaw doctor`를 실행합니다.
9. 활성 채널에 맞춰 플러그인을 동기화하고(`dev`는 번들 확장, `stable`/`beta`는 npm 사용), npm으로 설치된 플러그인도 업데이트합니다.

## `--update` 축약

`openclaw --update`는 `openclaw update`로 다시 작성됩니다(셸과 런처 스크립트에서 유용).

## 함께 보기

- `openclaw doctor`(git 체크아웃에서는 먼저 update 실행을 제안함)
- [Development channels](/install/development-channels)
- [Updating](/install/updating)
- [CLI reference](/cli)
