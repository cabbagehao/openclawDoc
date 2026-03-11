---
summary: "DM 페어링 요청 승인 및 목록 조회를 위한 `openclaw pairing` 명령어 레퍼런스"
read_when:
  - 페어링 모드 DM을 사용 중이며, 새로운 발신자의 접근을 승인해야 할 때
title: "pairing"
x-i18n:
  source_path: "cli/pairing.md"
---

# `openclaw pairing`

DM 페어링(Pairing) 요청을 승인하거나 현재 대기 중인 목록을 확인함 (페어링 기능을 지원하는 채널 대상).

**관련 문서:**

* 페어링 동작 방식: [Pairing](/channels/pairing)

## 주요 명령어

```bash
# Telegram 채널의 페어링 대기 목록 조회
openclaw pairing list telegram

# 특정 계정('work')의 페어링 대기 목록 조회
openclaw pairing list --channel telegram --account work

# 페어링 대기 목록을 JSON 형식으로 출력
openclaw pairing list telegram --json

# 특정 인증 코드를 사용하여 페어링 승인
openclaw pairing approve telegram <code>

# 특정 계정의 페어링을 승인하고 사용자에게 알림 전송
openclaw pairing approve --channel telegram --account work <code> --notify
```

## 참고 사항

* **채널 지정**: 채널 이름은 위치 인자(`pairing list telegram`) 또는 `--channel <channel>` 옵션으로 입력 가능함.
* **다중 계정 지원**: `pairing list` 및 `approve` 명령어는 `--account <accountId>` 옵션을 통해 특정 계정을 지정할 수 있음.
* **알림 설정**: `pairing approve` 실행 시 `--notify` 플래그를 추가하면 승인 완료 후 대상 사용자에게 안내 메시지를 전송함.
* **자동 감지**: 페어링이 가능한 채널이 하나만 설정되어 있는 경우, 채널명 없이 `pairing approve <code>`만으로도 실행 가능함.
