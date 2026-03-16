---
summary: "여러 channel에서 공통으로 쓰는 reaction semantics를 설명합니다."
description: "OpenClaw가 Discord, Slack, Telegram, WhatsApp, Signal 등에서 reaction 추가와 제거를 어떻게 해석하는지 빠르게 확인합니다."
read_when:
  - 어떤 channel에서든 reaction 동작을 다룰 때
title: "리액션"
x-i18n:
  source_path: "tools/reactions.md"
---

# 리액션 도구

여러 channel에서 공통으로 적용되는 reaction semantics:

- reaction을 추가할 때는 `emoji`가 반드시 필요합니다.
- 지원되는 channel에서는 `emoji=""`로 bot의 reaction을 제거할 수 있습니다.
- 지원되는 channel에서는 `remove: true`로 지정한 emoji만 제거할 수 있습니다. 이 경우에도 `emoji`는 필요합니다.

channel별 메모:

- **Discord/Slack**: 빈 `emoji`는 해당 메시지에서 bot이 남긴 모든 reaction을 제거합니다. `remove: true`는 지정한 emoji만 제거합니다.
- **Google Chat**: 빈 `emoji`는 app reaction을 제거합니다. `remove: true`는 지정한 emoji만 제거합니다.
- **Telegram**: 빈 `emoji`는 bot reaction을 제거합니다. `remove: true`도 제거 동작이지만, tool validation 때문에 비어 있지 않은 `emoji`가 여전히 필요합니다.
- **WhatsApp**: 빈 `emoji`는 bot reaction 제거를 의미합니다. `remove: true`는 내부적으로 빈 emoji로 매핑되지만, 역시 `emoji`는 필요합니다.
- **Zalo Personal (`zalouser`)**: 비어 있지 않은 `emoji`가 필요하며, `remove: true`는 해당 emoji reaction만 제거합니다.
- **Signal**: `channels.signal.reactionNotifications`가 켜져 있으면 inbound reaction notification이 system event로 발생합니다.
