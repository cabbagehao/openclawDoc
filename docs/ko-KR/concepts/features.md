---
summary: "OpenClaw capabilities across channels, routing, media, and UX."
description: "OpenClaw가 channel, plugin, routing, media, UI, mobile node 전반에서 제공하는 주요 capability를 한눈에 정리합니다."
read_when:
  - OpenClaw가 지원하는 전체 capability 목록이 필요할 때
title: "Features"
x-i18n:
  source_path: "concepts/features.md"
---

## Highlights

<Columns>
  <Card title="Channels" icon="message-square">
    단일 Gateway로 WhatsApp, Telegram, Discord, iMessage를 연결할 수 있습니다.
  </Card>
  <Card title="Plugins" icon="plug">
    extension으로 Mattermost와 더 많은 기능을 추가할 수 있습니다.
  </Card>
  <Card title="Routing" icon="route">
    격리된 session을 사용하는 multi-agent routing을 지원합니다.
  </Card>
  <Card title="Media" icon="image">
    이미지, 오디오, 문서를 양방향으로 다룹니다.
  </Card>
  <Card title="Apps and UI" icon="monitor">
    Web Control UI와 macOS companion app을 제공합니다.
  </Card>
  <Card title="Mobile nodes" icon="smartphone">
    iOS와 Android node에서 pairing, voice/chat, rich device command를 지원합니다.
  </Card>
</Columns>

## Full list

- WhatsApp Web (Baileys)를 통한 WhatsApp integration
- Telegram bot support (grammY)
- Discord bot support (`channels.discord.js`)
- Mattermost bot support (plugin)
- local imsg CLI를 통한 iMessage integration (macOS)
- tool streaming이 포함된 RPC mode의 Pi agent bridge
- 긴 응답을 위한 streaming과 chunking
- workspace 또는 sender별로 session을 격리하는 multi-agent routing
- OAuth를 통한 Anthropic 및 OpenAI subscription auth
- Session: direct chat은 공유 `main`으로 collapse되고 group은 격리됨
- mention 기반 activation을 지원하는 group chat
- image, audio, document media support
- optional voice note transcription hook
- WebChat과 macOS menu bar app
- pairing, Canvas, camera, screen recording, location, voice feature를 갖춘 iOS node
- pairing, Connect tab, chat session, voice tab, Canvas/camera, device, notification, contacts/calendar, motion, photo, SMS command를 포함한 Android node

<Note>
legacy Claude, Codex, Gemini, Opencode path는 제거되었습니다. coding agent path는 Pi만 남아 있습니다.
</Note>
