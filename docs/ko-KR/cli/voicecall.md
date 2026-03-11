---
summary: "CLI reference for `openclaw voicecall` (voice-call 플러그인 명령 표면)"
read_when:
  - voice-call 플러그인을 사용 중이며 CLI 진입점을 보고 싶을 때
  - `voicecall call|continue|status|tail|expose` 에 대한 빠른 예시가 필요할 때
title: "voicecall"
---

# `openclaw voicecall`

`voicecall` 은 플러그인이 제공하는 명령입니다. voice-call 플러그인이 설치되고 활성화된 경우에만 나타납니다.

주요 문서:

- Voice-call plugin: [Voice Call](/plugins/voice-call)

## 자주 쓰는 명령

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall call --to "+15555550123" --message "Hello" --mode notify
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall end --call-id <id>
```

## Webhook 노출(Tailscale)

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

보안 메모: webhook 엔드포인트는 신뢰하는 네트워크에만 노출하세요. 가능하면 Funnel 보다 Tailscale Serve 를 우선하세요.
