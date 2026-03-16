---
summary: "channel connectivity를 빠르게 확인하는 health check 절차를 정리합니다."
description: "OpenClaw에서 `status`, `health`, log tail, relink 흐름을 사용해 WhatsApp channel 상태를 짧게 진단하는 방법을 설명합니다."
read_when:
  - WhatsApp channel health를 진단할 때
title: "Health Checks"
x-i18n:
  source_path: "gateway/health.md"
---

# Health Checks (CLI)

추측하지 않고 channel connectivity를 확인하기 위한 짧은 가이드입니다.

## Quick checks

- `openclaw status` — gateway reachability/mode, update hint, linked channel auth age, session, recent activity를 로컬에서 빠르게 요약합니다.
- `openclaw status --all` — 전체 로컬 진단을 읽기 전용으로 출력합니다. color가 유지되고 디버깅용으로 붙여 넣기에도 안전합니다.
- `openclaw status --deep` — 실행 중인 Gateway도 함께 probe합니다. 지원되는 경우 channel별 probe까지 수행합니다.
- `openclaw health --json` — 실행 중인 Gateway에 전체 health snapshot을 요청합니다. WebSocket 전용이며 CLI가 Baileys socket에 직접 연결하지는 않습니다.
- WhatsApp/WebChat에 `/status`를 단독 메시지로 보내면 agent를 호출하지 않고 status reply를 받을 수 있습니다.
- log는 `/tmp/openclaw/openclaw-*.log`를 tail하면서 `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`를 보면 됩니다.

## Deep diagnostics

- disk 위 credential 확인: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (`mtime`이 최근이어야 함)
- session store 확인: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (config에서 경로 override 가능). session 수와 최근 recipient는 `status`에도 표시됩니다.
- relink 흐름: log에 status code `409–515` 또는 `loggedOut`이 보이면 `openclaw channels logout && openclaw channels login --verbose`로 다시 연결합니다. 참고로 QR login flow는 pairing 뒤 status `515`가 나오면 자동으로 1회 재시작합니다.

## When something fails

- `logged out` 또는 status `409–515` -> `openclaw channels logout` 후 `openclaw channels login`으로 relink
- Gateway unreachable -> `openclaw gateway --port 18789`로 시작(포트가 바쁘면 `--force`)
- inbound message가 없음 -> 연결된 phone이 online인지, sender가 `channels.whatsapp.allowFrom`에 허용되어 있는지 확인. group chat이면 `channels.whatsapp.groups`와 `agents.list[].groupChat.mentionPatterns`가 맞는지도 확인

## Dedicated `health` command

`openclaw health --json`은 실행 중인 Gateway에 health snapshot을 요청합니다. CLI가 channel socket에 직접 붙는 방식은 아닙니다.

보고 항목:

- linked credential와 auth age
- per-channel probe summary
- session-store summary
- probe duration

동작 메모:

- Gateway에 도달할 수 없거나 probe가 실패/timeout되면 non-zero로 종료합니다.
- 기본 timeout은 10초이며 `--timeout <ms>`로 override할 수 있습니다.
