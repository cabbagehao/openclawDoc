---
summary: "CLI reference for `openclaw system` (system events, heartbeat, presence)"
description: "system event를 queue에 넣고 heartbeat를 제어하고 presence를 확인하는 `openclaw system` helper 명령을 정리합니다."
read_when:
  - cron job을 만들지 않고 system event를 enqueue하고 싶을 때
  - heartbeat를 켜거나 끄고 싶을 때
  - system presence entry를 확인하고 싶을 때
title: "system"
x-i18n:
  source_path: "cli/system.md"
---

# `openclaw system`

Gateway를 위한 system-level helper입니다. system event를 queue에 넣고, heartbeat를 제어하고,
presence를 확인할 수 있습니다.

## Common commands

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
openclaw system heartbeat enable
openclaw system heartbeat last
openclaw system presence
```

## `system event`

**main** session에 system event를 enqueue합니다. 다음 heartbeat가 이를 prompt 안의 `System:` line으로 주입합니다.
`--mode now`를 사용하면 heartbeat를 즉시 트리거하고, `next-heartbeat`는 다음 scheduled tick까지 기다립니다.

Flags:

- `--text <text>`: 필수 system event text
- `--mode <mode>`: `now` 또는 `next-heartbeat` (기본값)
- `--json`: machine-readable output

## `system heartbeat last|enable|disable`

heartbeat 제어:

- `last`: 마지막 heartbeat event 표시
- `enable`: heartbeat를 다시 켭니다. (비활성화되어 있던 경우)
- `disable`: heartbeat를 일시 중지합니다.

Flags:

- `--json`: machine-readable output

## `system presence`

Gateway가 알고 있는 현재 system presence entry(node, instance, 기타 status line)를 나열합니다.

Flags:

- `--json`: machine-readable output

## Notes

- 현재 config(local 또는 remote)로 접근 가능한 실행 중인 Gateway가 필요합니다.
- system event는 ephemeral하며 restart 이후에는 유지되지 않습니다.
