---
summary: "DM 페어링 요청 승인 및 목록 조회를 위한 `openclaw pairing` 명령어 레퍼런스"
description: "DM pairing 요청을 확인하고 승인하는 `openclaw pairing` CLI 흐름과 channel, account 옵션을 정리합니다."
read_when:
  - 페어링 모드 DM을 사용 중이며 새로운 발신자의 접근을 승인해야 할 때
title: "pairing"
x-i18n:
  source_path: "cli/pairing.md"
---

# `openclaw pairing`

DM pairing 요청을 승인하거나 확인합니다. (pairing을 지원하는 channel 대상)

Related:

- Pairing flow: [Pairing](/channels/pairing)

## Commands

```bash
openclaw pairing list telegram
openclaw pairing list --channel telegram --account work
openclaw pairing list telegram --json

openclaw pairing approve telegram <code>
openclaw pairing approve --channel telegram --account work <code> --notify
```

## Notes

- Channel 입력은 위치 인자(`pairing list telegram`) 또는 `--channel <channel>`로 전달할 수 있습니다.
- `pairing list`는 multi-account channel용 `--account <accountId>`를 지원합니다.
- `pairing approve`는 `--account <accountId>`와 `--notify`를 지원합니다.
- pairing 가능한 channel이 하나만 configured되어 있으면 `pairing approve <code>`만으로도 실행할 수 있습니다.
