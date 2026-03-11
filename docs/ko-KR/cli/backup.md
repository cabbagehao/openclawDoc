---
summary: "CLI reference for `openclaw backup` (로컬 백업 아카이브 생성)"
read_when:
  - 로컬 OpenClaw 상태를 위한 정식 백업 아카이브가 필요할 때
  - reset 또는 uninstall 전에 포함될 경로를 미리 보고 싶을 때
title: "backup"
---

# `openclaw backup`

OpenClaw 상태, config, credentials, sessions, 그리고 선택적으로 workspaces 를 위한 로컬 백업 아카이브를 생성합니다.

```bash
openclaw backup create
openclaw backup create --output ~/Backups
openclaw backup create --dry-run --json
openclaw backup create --verify
openclaw backup create --no-include-workspace
openclaw backup create --only-config
openclaw backup verify ./2026-03-09T00-00-00.000Z-openclaw-backup.tar.gz
```

## 메모

- 아카이브에는 해석된 소스 경로와 아카이브 레이아웃을 담은 `manifest.json` 파일이 포함됩니다.
- 기본 출력은 현재 작업 디렉터리에 생성되는 타임스탬프형 `.tar.gz` 아카이브입니다.
- 현재 작업 디렉터리가 백업 대상 소스 트리 안에 있으면, OpenClaw 는 기본 아카이브 위치를 홈 디렉터리로 폴백합니다.
- 기존 아카이브 파일은 덮어쓰지 않습니다.
- 소스 state/workspace 트리 내부의 출력 경로는 self-inclusion 을 막기 위해 거부됩니다.
- `openclaw backup verify <archive>` 는 아카이브에 루트 manifest 가 정확히 하나 있는지 검증하고, traversal 스타일 경로를 거부하며, manifest 에 선언된 모든 payload 가 tarball 안에 존재하는지 확인합니다.
- `openclaw backup create --verify` 는 아카이브를 쓴 직후 이 검증을 실행합니다.
- `openclaw backup create --only-config` 는 현재 활성 JSON config 파일만 백업합니다.

## 무엇이 백업되나

`openclaw backup create` 는 로컬 OpenClaw 설치에서 다음 백업 소스를 계획합니다:

- OpenClaw 의 로컬 state resolver 가 반환하는 state 디렉터리(일반적으로 `~/.openclaw`)
- 현재 활성 config 파일 경로
- OAuth / credentials 디렉터리
- 현재 config 에서 발견되는 workspace 디렉터리(`--no-include-workspace` 를 주지 않는 한)

`--only-config` 를 사용하면 OpenClaw 는 state, credentials, workspace 탐색을 건너뛰고 활성 config 파일 경로만 아카이브합니다.

OpenClaw 는 아카이브를 만들기 전에 경로를 canonicalize 합니다. config, credentials, workspace 가 이미 state 디렉터리 안에 있으면 별도의 최상위 백업 소스로 중복되지 않습니다. 없는 경로는 건너뜁니다.

아카이브 payload 는 해당 소스 트리의 파일 내용을 저장하며, 내장된 `manifest.json` 은 해석된 절대 소스 경로와 각 자산에 사용된 아카이브 레이아웃을 기록합니다.

## 잘못된 config 동작

`openclaw backup` 은 복구 상황에서도 도움이 되도록 의도적으로 일반 config preflight 를 우회합니다. 다만 workspace 탐색은 유효한 config 에 의존하므로, config 파일이 존재하지만 잘못되었고 workspace 백업이 여전히 활성화된 경우 `openclaw backup create` 는 이제 즉시 실패합니다.

이 상황에서도 부분 백업을 원한다면 다음처럼 다시 실행하세요:

```bash
openclaw backup create --no-include-workspace
```

이렇게 하면 state, config, credentials 는 범위에 남고 workspace 탐색만 완전히 건너뜁니다.

config 파일 자체의 복사본만 필요하다면, `--only-config` 도 잘못된 config 에서 동작합니다. workspace 탐색을 위해 config 파싱에 의존하지 않기 때문입니다.

## 크기와 성능

OpenClaw 는 내장된 최대 백업 크기나 파일별 크기 제한을 강제하지 않습니다.

실질적인 한계는 로컬 머신과 대상 파일시스템에서 옵니다:

- 임시 아카이브 쓰기와 최종 아카이브를 위한 여유 공간
- 큰 workspace 트리를 순회해 `.tar.gz` 로 압축하는 데 걸리는 시간
- `openclaw backup create --verify` 또는 `openclaw backup verify` 사용 시 아카이브를 다시 스캔하는 시간
- 대상 경로의 파일시스템 동작. OpenClaw 는 덮어쓰기 없는 hard-link publish 를 우선하고, hard link 가 지원되지 않으면 exclusive copy 로 폴백합니다

큰 workspace 가 대개 아카이브 크기를 좌우합니다. 더 작고 빠른 백업을 원하면 `--no-include-workspace` 를 사용하세요.

가장 작은 아카이브를 원한다면 `--only-config` 를 사용하세요.
