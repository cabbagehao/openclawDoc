---
summary: "CLI reference for `openclaw system` (system 이벤트, heartbeat, presence)"
read_when:
  - cron job을 만들지 않고 system event를 큐에 넣고 싶을 때
  - heartbeat를 활성화하거나 비활성화해야 할 때
  - system presence 항목을 확인하고 싶을 때
title: "system"
---

# `openclaw system`

Gateway용 시스템 수준 헬퍼입니다. system event를 큐에 넣고, heartbeat를 제어하고,
presence를 확인합니다.

## Common commands

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
openclaw system heartbeat enable
openclaw system heartbeat last
openclaw system presence
```

## `system event`

**main** 세션에 system event를 큐에 넣습니다. 다음 heartbeat가 이를 프롬프트에
`System:` 줄로 주입합니다. `--mode now`를 사용하면 heartbeat를 즉시 트리거하고,
`next-heartbeat`는 다음 예약 tick까지 기다립니다.

Flags:

- `--text <text>`: 필수 system event 텍스트.
- `--mode <mode>`: `now` 또는 `next-heartbeat`(기본값).
- `--json`: 기계 판독용 출력.

## `system heartbeat last|enable|disable`

Heartbeat 제어:

- `last`: 마지막 heartbeat 이벤트를 표시합니다.
- `enable`: heartbeat를 다시 켭니다(비활성화되어 있었다면 이 옵션을 사용).
- `disable`: heartbeat를 일시 중지합니다.

Flags:

- `--json`: 기계 판독용 출력.

## `system presence`

Gateway가 알고 있는 현재 system presence 항목(node, instance, 그와 비슷한 상태
줄)을 나열합니다.

Flags:

- `--json`: 기계 판독용 출력.

## Notes

- 현재 config(로컬 또는 원격)로 접근할 수 있는 실행 중인 Gateway가 필요합니다.
- System event는 일시적이며 재시작 후에는 유지되지 않습니다.
