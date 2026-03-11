---
summary: "CLI reference for `openclaw pairing` (pairing 요청 승인/목록)"
read_when:
  - pairing 모드 DM 을 사용 중이며 발신자 승인이 필요할 때
title: "pairing"
---

# `openclaw pairing`

DM pairing 요청을 승인하거나 조회합니다(pairing 을 지원하는 채널용).

관련 문서:

- Pairing flow: [Pairing](/channels/pairing)

## Commands

```bash
openclaw pairing list telegram
openclaw pairing list --channel telegram --account work
openclaw pairing list telegram --json

openclaw pairing approve telegram <code>
openclaw pairing approve --channel telegram --account work <code> --notify
```

## 메모

- 채널 입력: 위치 인자(`pairing list telegram`) 또는 `--channel <channel>` 로 전달할 수 있습니다.
- `pairing list` 는 멀티 계정 채널을 위해 `--account <accountId>` 를 지원합니다.
- `pairing approve` 는 `--account <accountId>` 와 `--notify` 를 지원합니다.
- pairing 가능 채널이 하나만 구성된 경우, `pairing approve <code>` 도 허용됩니다.
