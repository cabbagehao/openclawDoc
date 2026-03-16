---
summary: "OpenClaw가 연결할 수 있는 메시징 플랫폼"
description: "OpenClaw에서 사용할 수 있는 채팅 채널과 각 채널의 연결 방식, 지원 범위를 간단히 안내합니다."
read_when:
  - OpenClaw용 채팅 채널을 선택하려고 할 때
  - 지원되는 메시징 플랫폼을 빠르게 개요 수준에서 확인해야 할 때
title: "채팅 채널"
x-i18n:
  source_path: "channels/index.md"
---

# 채팅 채널

OpenClaw는 사용자가 이미 사용하는 채팅 앱 어디에서나 대화할 수 있습니다. 각 채널은 Gateway를 통해 연결됩니다.
텍스트는 모든 채널에서 지원되며, 미디어와 리액션 지원 범위는 채널마다 다릅니다.

## 지원 채널

- [BlueBubbles](/channels/bluebubbles) — **iMessage에 권장**. BlueBubbles macOS server REST API를 사용하며 전체 기능을 지원합니다(편집, 전송 취소, 효과, 리액션, 그룹 관리. 단, 편집은 현재 macOS 26 Tahoe에서 작동하지 않음).
- [Discord](/channels/discord) — Discord Bot API + Gateway, 서버, 채널, DM 지원.
- [Feishu](/channels/feishu) — WebSocket을 통한 Feishu/Lark 봇(플러그인, 별도 설치 필요).
- [Google Chat](/channels/googlechat) — HTTP webhook을 통한 Google Chat API 앱.
- [iMessage (legacy)](/channels/imessage) — imsg CLI를 통한 기존 macOS 통합(지원 중단 예정, 새 설정에는 BlueBubbles 사용 권장).
- [IRC](/channels/irc) — 전통적인 IRC 서버, 채널 + DM, pairing/allowlist 제어 지원.
- [LINE](/channels/line) — LINE Messaging API 봇(플러그인, 별도 설치 필요).
- [Matrix](/channels/matrix) — Matrix protocol(플러그인, 별도 설치).
- [Mattermost](/channels/mattermost) — Bot API + WebSocket, 채널, 그룹, DM(플러그인, 별도 설치 필요).
- [Microsoft Teams](/channels/msteams) — Bot Framework, 엔터프라이즈 지원(플러그인, 별도 설치 필요).
- [Nextcloud Talk](/channels/nextcloud-talk) — Nextcloud Talk를 통한 셀프 호스팅 채팅(플러그인, 별도 설치 필요).
- [Nostr](/channels/nostr) — NIP-04를 통한 분산형 DM(플러그인, 별도 설치 필요).
- [Signal](/channels/signal) — signal-cli, 프라이버시 중심.
- [Synology Chat](/channels/synology-chat) — outgoing+incoming webhooks를 통한 Synology NAS Chat(플러그인, 별도 설치 필요).
- [Slack](/channels/slack) — Bolt SDK, workspace 앱.
- [Telegram](/channels/telegram) — grammY를 통한 Bot API, 그룹 지원.
- [Tlon](/channels/tlon) — Urbit 기반 메신저(플러그인, 별도 설치 필요).
- [Twitch](/channels/twitch) — IRC 연결을 통한 Twitch 채팅(플러그인, 별도 설치 필요).
- [WebChat](/web/webchat) — WebSocket 기반 Gateway WebChat UI.
- [WhatsApp](/channels/whatsapp) — 가장 대중적이며 Baileys를 사용하고 QR pairing이 필요함.
- [Zalo](/channels/zalo) — Zalo Bot API, 베트남에서 인기 있는 메신저(플러그인, 별도 설치 필요).
- [Zalo Personal](/channels/zalouser) — QR 로그인 기반 Zalo 개인 계정(플러그인, 별도 설치 필요).

## 참고 사항

- 채널은 동시에 실행할 수 있으며, 여러 채널을 구성하면 OpenClaw가 채팅별로 라우팅합니다.
- 가장 빠르게 설정할 수 있는 채널은 보통 **Telegram**입니다(간단한 bot token). WhatsApp은 QR pairing이 필요하고 디스크에 더 많은 상태를 저장합니다.
- 그룹 동작은 채널마다 다릅니다. [Groups](/channels/groups)를 참고하세요.
- DM pairing과 allowlists는 안전을 위해 강제됩니다. [Security](/gateway/security)를 참고하세요.
- 문제 해결: [Channel troubleshooting](/channels/troubleshooting).
- 모델 provider 문서는 별도로 제공합니다. [Model Providers](/providers/models)를 참고하세요.
