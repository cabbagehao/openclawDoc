---
summary: "CLI reference for `openclaw update` (safe-ish source update + gateway auto-restart)"
description: "source checkout 업데이트와 stable, beta, dev 채널 전환 절차를 설명합니다."
read_when:
  - source checkout을 안전하게 업데이트하고 싶을 때
  - update 축약 동작을 이해해야 할 때
title: "update"
x-i18n:
  source_path: "cli/update.md"
---

# `openclaw update`

OpenClaw를 비교적 안전하게 업데이트하고 stable, beta, dev 채널 사이를 전환합니다.

**npm/pnpm**으로 설치했다면(global install, git metadata 없음), 업데이트는 [Updating](/install/updating)의 package manager 흐름으로 진행됩니다.

## Usage

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

## Options

- `--no-restart`: 성공적인 update 뒤 Gateway service restart를 건너뜁니다.
- `--channel <stable|beta|dev>`: update channel을 설정합니다. (git + npm, config에 저장)
- `--tag <dist-tag|version>`: 이번 update에만 npm dist-tag 또는 version을 override합니다.
- `--dry-run`: config write, install, plugin sync, restart 없이 계획된 update action(channel/tag/target/restart flow)을 미리 봅니다.
- `--json`: machine-readable `UpdateRunResult` JSON을 출력합니다.
- `--timeout <seconds>`: 단계별 timeout (기본값 1200초)

참고: downgrade는 구버전이 config를 깨뜨릴 수 있으므로 사용자 확인이 필요합니다.

## `update status`

현재 active update channel과 git tag/branch/SHA(source checkout일 때), 그리고 update availability를 보여 줍니다.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Options:

- `--json`: machine-readable status JSON을 출력합니다.
- `--timeout <seconds>`: check용 timeout (기본값 3초)

## `update wizard`

interactive flow로 update channel을 선택하고, update 후 Gateway를 restart할지(default는 restart)를 확인합니다.
git checkout 없이 `dev`를 선택하면, checkout 생성도 제안합니다.

## What it does

`--channel ...`로 channel을 명시적으로 전환하면, OpenClaw는 install method도 함께 맞춥니다.

- `dev` → git checkout을 보장합니다. (기본값 `~/openclaw`, `OPENCLAW_GIT_DIR`로 override 가능)
  update 후 그 checkout에서 global CLI를 설치합니다.
- `stable`/`beta` → 일치하는 dist-tag로 npm에서 설치합니다.

config로 활성화된 Gateway core auto-updater도 같은 update path를 재사용합니다.

## Git checkout flow

Channels:

- `stable`: 최신 non-beta tag를 checkout한 뒤 build + doctor
- `beta`: 최신 `-beta` tag를 checkout한 뒤 build + doctor
- `dev`: `main`을 checkout한 뒤 fetch + rebase

High-level:

1. clean worktree가 필요합니다. (uncommitted change 없음)
2. 선택한 channel(tag 또는 branch)로 전환합니다.
3. upstream을 fetch합니다. (`dev`만)
4. `dev` 전용: temp worktree에서 preflight lint + TypeScript build를 실행하고, tip이 실패하면 최대 10개 commit까지 되짚어 가장 최신의 clean build를 찾습니다.
5. 선택된 commit 위로 rebase합니다. (`dev`만)
6. dependency를 설치합니다. (pnpm 선호, npm fallback)
7. build와 Control UI build를 실행합니다.
8. 마지막 “safe update” 확인으로 `openclaw doctor`를 실행합니다.
9. active channel에 맞춰 plugin을 sync하고 npm-installed plugin도 update합니다.

## `--update` shorthand

`openclaw --update`는 `openclaw update`로 rewrite됩니다. shell과 launcher script에서 유용합니다.

## See also

- `openclaw doctor` (git checkout에서는 먼저 update를 제안할 수 있음)
- [Development channels](/install/development-channels)
- [Updating](/install/updating)
- [CLI reference](/cli)
