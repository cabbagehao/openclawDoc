---
summary: "CLI reference for `openclaw voicecall` (voice-call plugin command surface)"
description: "voice-call plugin 환경에서 통화 시작, 이어가기, 상태 확인, webhook 노출 흐름을 설명합니다."
read_when:
  - voice-call plugin의 CLI entry point가 필요할 때
  - voicecall call, continue, status, tail, expose 예시가 필요할 때
title: "voicecall"
x-i18n:
  source_path: "cli/voicecall.md"
---

# `openclaw voicecall`

`voicecall`은 plugin이 제공하는 명령입니다. voice-call plugin이 설치되고 활성화된 경우에만 나타납니다.

Primary doc:

- Voice-call plugin: [Voice Call](/plugins/voice-call)

## Common commands

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall call --to "+15555550123" --message "Hello" --mode notify
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall end --call-id <id>
```

## Exposing webhooks (Tailscale)

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

보안 참고: webhook endpoint는 신뢰하는 network에만 노출하세요. 가능하면 Funnel보다 Tailscale Serve를 우선하세요.
