---
summary: "OpenClaw가 연결할 수 있는 메시징 플랫폼"
read_when:
  - OpenClaw용 채팅 채널을 고를 때
  - 지원되는 메시징 플랫폼을 빠르게 훑어보고 싶을 때
title: "채팅 채널"
x-i18n:
  source_path: "channels/index.md"
---

# 채팅 채널

OpenClaw는 이미 쓰고 있는 거의 모든 채팅 앱에서 여러분과 대화할 수 있습니다. 각 채널은 Gateway를 통해 연결됩니다.
텍스트는 모든 곳에서 지원되며, 미디어와 리액션 지원 여부는 채널마다 다릅니다.

## 지원 채널

- [BlueBubbles](/channels/bluebubbles) — **iMessage에 권장**; BlueBubbles macOS 서버 REST API를 사용하며 전체 기능(edit, unsend, effects, reactions, group management)을 지원합니다. 단, edit는 현재 macOS 26 Tahoe에서 깨져 있습니다.
- [Discord](/channels/discord) — Discord Bot API + Gateway; 서버, 채널, DM을 지원합니다.
- [Feishu](/channels/feishu) — Feishu/Lark bot via WebSocket (plugin, installed separately).
- [Google Chat](/channels/googlechat) — Google Chat API app via HTTP webhook.
- [iMessage (legacy)](/channels/imessage) — imsg CLI를 통한 레거시 macOS 통합(deprecated, 새 구성에서는 BlueBubbles 사용 권장).
- [IRC](/channels/irc) — 고전 IRC 서버; pairing/allowlist 제어가 있는 채널 + DM.
- [LINE](/channels/line) — LINE Messaging API bot (plugin, installed separately).
- [Matrix](/channels/matrix) — Matrix protocol (plugin, installed separately).
- [Mattermost](/channels/mattermost) — Bot API + WebSocket; channels, groups, DMs (plugin, installed separately).
- [Microsoft Teams](/channels/msteams) — Bot Framework; 엔터프라이즈 지원 (plugin, installed separately).
- [Nextcloud Talk](/channels/nextcloud-talk) — Nextcloud Talk를 통한 셀프 호스팅 채팅 (plugin, installed separately).
- [Nostr](/channels/nostr) — NIP-04를 통한 분산형 DM (plugin, installed separately).
- [Signal](/channels/signal) — signal-cli; privacy-focused.
- [Synology Chat](/channels/synology-chat) — Synology NAS Chat via outgoing+incoming webhooks (plugin, installed separately).
- [Slack](/channels/slack) — Bolt SDK; 워크스페이스 앱.
- [Telegram](/channels/telegram) — grammY 기반 Bot API; 그룹 지원.
- [Tlon](/channels/tlon) — Urbit 기반 메신저 (plugin, installed separately).
- [Twitch](/channels/twitch) — IRC 연결을 통한 Twitch chat (plugin, installed separately).
- [WebChat](/web/webchat) — Gateway WebChat UI over WebSocket.
- [WhatsApp](/channels/whatsapp) — 가장 대중적; Baileys를 사용하며 QR pairing이 필요합니다.
- [Zalo](/channels/zalo) — Zalo Bot API; 베트남에서 널리 쓰이는 메신저 (plugin, installed separately).
- [Zalo Personal](/channels/zalouser) — QR 로그인 기반 Zalo 개인 계정 (plugin, installed separately).

## 참고

- 채널은 동시에 여러 개 실행할 수 있으며, OpenClaw는 채팅별로 적절한 채널로 라우팅합니다.
- 가장 빠른 설정은 보통 **Telegram**입니다(간단한 bot token). WhatsApp은 QR pairing이 필요하고
  디스크에 더 많은 상태를 저장합니다.
- 그룹 동작은 채널마다 다릅니다. [그룹](/channels/groups)을 참고하세요.
- DM pairing과 allowlist는 안전을 위해 강제됩니다. [보안](/gateway/security)을 참고하세요.
- 문제 해결: [채널 문제 해결](/channels/troubleshooting)
- 모델 provider 문서는 별도로 정리되어 있습니다. [Model Providers](/providers/models)를 참고하세요.
