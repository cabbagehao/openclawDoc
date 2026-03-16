---
summary: "CLI reference for `openclaw backup` (create local backup archives)"
description: "OpenClaw state, config, credentials, workspace를 local backup archive로 만드는 `openclaw backup` 명령과 검증 옵션을 정리합니다."
read_when:
  - local OpenClaw state를 first-class backup archive로 보관하고 싶을 때
  - reset 또는 uninstall 전에 포함 경로를 미리 확인하고 싶을 때
title: "backup"
x-i18n:
  source_path: "cli/backup.md"
---

# `openclaw backup`

OpenClaw state, config, credentials, session, 그리고 선택적으로 workspace까지 포함하는 local backup archive를 생성합니다.

```bash
openclaw backup create
openclaw backup create --output ~/Backups
openclaw backup create --dry-run --json
openclaw backup create --verify
openclaw backup create --no-include-workspace
openclaw backup create --only-config
openclaw backup verify ./2026-03-09T00-00-00.000Z-openclaw-backup.tar.gz
```

## Notes

- archive에는 resolved source path와 archive layout을 기록한 `manifest.json`이 포함됩니다.
- 기본 output은 현재 working directory에 생성되는 timestamped `.tar.gz` archive입니다.
- 현재 working directory가 backup 대상 source tree 안에 있으면, OpenClaw는 기본 archive location을 home directory로 fallback합니다.
- 기존 archive file은 절대 overwrite하지 않습니다.
- self-inclusion을 막기 위해 source state/workspace tree 내부의 output path는 거부됩니다.
- `openclaw backup verify <archive>`는 archive 안에 정확히 하나의 root manifest가 있는지, traversal-style archive path가 없는지, manifest에 선언된 payload가 tarball에 모두 있는지를 검사합니다.
- `openclaw backup create --verify`는 archive를 쓴 직후 이 검사를 바로 실행합니다.
- `openclaw backup create --only-config`는 active JSON config file만 backup합니다.

## What gets backed up

`openclaw backup create`는 local OpenClaw install에서 다음 backup source를 계획합니다.

- OpenClaw local state resolver가 반환하는 state directory. 보통 `~/.openclaw`
- active config file path
- OAuth / credentials directory
- 현재 config에서 발견된 workspace directory. 단, `--no-include-workspace`를 사용하면 제외

`--only-config`를 쓰면 OpenClaw는 state, credentials, workspace discovery를 건너뛰고 active config file path만 archive에 넣습니다.

OpenClaw는 archive를 만들기 전에 path를 canonicalize합니다. config, credentials, workspace가 이미 state directory 안에 있으면 별도의 top-level backup source로 중복 추가되지 않습니다. 없는 path는 건너뜁니다.

archive payload는 해당 source tree의 file content를 저장하며, 내부 `manifest.json`은 resolved absolute source path와 asset별 archive layout을 기록합니다.

## Invalid config behavior

`openclaw backup`은 recovery 상황에서도 도움이 되도록 normal config preflight를 의도적으로 우회합니다. 다만 workspace discovery는 valid config에 의존하므로, config file이 존재하지만 invalid하고 workspace backup이 활성화된 상태라면 `openclaw backup create`는 즉시 실패합니다.

이 경우 partial backup이 필요하면 다음처럼 다시 실행하세요.

```bash
openclaw backup create --no-include-workspace
```

이렇게 하면 workspace discovery만 완전히 건너뛰고 state, config, credentials는 계속 포함됩니다.

config file 자체만 필요하다면 `--only-config`도 사용할 수 있습니다. 이 옵션은 workspace discovery를 위해 config를 parsing하지 않으므로 malformed config에서도 동작합니다.

## Size and performance

OpenClaw는 built-in 최대 backup size나 per-file size limit를 강제하지 않습니다.

실제 한계는 local machine과 destination filesystem에서 결정됩니다.

- temporary archive write와 final archive를 저장할 수 있는 available space
- 큰 workspace tree를 순회하고 `.tar.gz`로 압축하는 데 걸리는 시간
- `openclaw backup create --verify` 또는 `openclaw backup verify`를 사용할 때 archive를 다시 스캔하는 시간
- destination path의 filesystem 동작. OpenClaw는 no-overwrite hard-link publish를 우선 시도하고, hard link가 지원되지 않으면 exclusive copy로 fallback합니다.

대부분 archive size를 크게 만드는 주된 원인은 large workspace입니다. 더 작고 빠른 backup이 필요하면 `--no-include-workspace`를 사용하세요.

가장 작은 archive가 필요하면 `--only-config`를 사용하면 됩니다.
