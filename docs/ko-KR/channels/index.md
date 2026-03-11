---
summary: "OpenClaw가 연결 가능한 메시징 플랫폼 목록"
read_when:
  - OpenClaw용 채팅 채널을 선택할 때
  - 지원되는 메시징 플랫폼을 빠르게 확인하고 싶을 때
title: "채팅 채널"
x-i18n:
  source_path: "channels/index.md"
---

# 채팅 채널

OpenClaw는 사용자가 이미 사용 중인 대부분의 채팅 앱을 통해 상호작용할 수 있습니다. 각 채널은 Gateway를 통해 연결됩니다.
모든 채널에서 텍스트 메시지를 지원하며, 미디어 및 리액션 지원 여부는 플랫폼별로 상이합니다.

## 지원 채널

- [BlueBubbles](/channels/bluebubbles) — **iMessage 사용 시 권장됨**. BlueBubbles macOS 서버 REST API를 사용하며 편집, 전송 취소, 효과, 리액션, 그룹 관리 등 전체 기능을 지원함. (단, 메시지 편집 기능은 현재 macOS 15 Sequoia 이상에서 일부 호환성 이슈가 있을 수 있음).
- [Discord](/channels/discord) — Discord Bot API 및 Gateway를 사용함. 서버, 채널, DM을 지원함.
- [Feishu](/channels/feishu) — WebSocket을 통한 Feishu/Lark 봇 연동 (플러그인, 별도 설치 필요).
- [Google Chat](/channels/googlechat) — HTTP 웹훅을 통한 Google Chat API 앱 연동.
- [iMessage (Legacy)](/channels/imessage) — imsg CLI를 통한 레거시 macOS 통합. (현재는 권장되지 않으며, 신규 설정 시 BlueBubbles 사용을 권장함).
- [IRC](/channels/irc) — 전통적인 IRC 서버 지원. 페어링/허용 목록(Allowlist) 제어가 포함된 채널 및 DM 지원.
- [LINE](/channels/line) — LINE Messaging API 봇 연동 (플러그인, 별도 설치 필요).
- [Matrix](/channels/matrix) — Matrix 프로토콜 지원 (플러그인, 별도 설치 필요).
- [Mattermost](/channels/mattermost) — Bot API 및 WebSocket 사용. 채널, 그룹, DM 지원 (플러그인, 별도 설치 필요).
- [Microsoft Teams](/channels/msteams) — Bot Framework를 통한 엔터프라이즈 환경 지원 (플러그인, 별도 설치 필요).
- [Nextcloud Talk](/channels/nextcloud-talk) — Nextcloud Talk를 통한 셀프 호스팅 채팅 지원 (플러그인, 별도 설치 필요).
- [Nostr](/channels/nostr) — NIP-04를 통한 탈중앙화 DM 지원 (플러그인, 별도 설치 필요).
- [Signal](/channels/signal) — signal-cli 기반의 프라이버시 중심 통합.
- [Synology Chat](/channels/synology-chat) — 송수신 웹훅을 통한 Synology NAS Chat 연동 (플러그인, 별도 설치 필요).
- [Slack](/channels/slack) — Bolt SDK 기반의 워크스페이스 앱 연동.
- [Telegram](/channels/telegram) — grammY 기반 Bot API 사용. 그룹 메시지 지원.
- [Tlon](/channels/tlon) — Urbit 기반 메신저 연동 (플러그인, 별도 설치 필요).
- [Twitch](/channels/twitch) — IRC 연결을 통한 Twitch 채팅 지원 (플러그인, 별도 설치 필요).
- [WebChat](/web/webchat) — WebSocket 기반의 Gateway WebChat UI 지원.
- [WhatsApp](/channels/whatsapp) — 가장 널리 사용되는 채널 중 하나로, Baileys 라이브러리를 사용하며 QR 페어링이 필요함.
- [Zalo](/channels/zalo) — Zalo Bot API 연동. 베트남에서 주로 사용되는 메신저 (플러그인, 별도 설치 필요).
- [Zalo Personal](/channels/zalouser) — QR 로그인 기반의 Zalo 개인 계정 연동 (플러그인, 별도 설치 필요).

## 참고 사항

- 여러 채널을 동시에 실행할 수 있으며, OpenClaw는 대화별로 적절한 채널로 메시지를 라우팅함.
- **Telegram**은 봇 토큰만으로 설정이 가능하여 가장 빠르게 시작할 수 있음. WhatsApp은 QR 페어링이 필요하며 로컬 디스크에 더 많은 상태 데이터를 저장함.
- 그룹 메시지 동작 방식은 채널별로 다를 수 있음. [그룹](/channels/groups) 문서 참조.
- 보안을 위해 DM 페어링 및 허용 목록(Allowlist) 설정이 강제됨. [보안](/gateway/security) 문서 참조.
- 문제 해결: [채널 문제 해결](/channels/troubleshooting) 문서 참조.
- 모델 공급자 관련 문서는 별도로 제공됨. [모델 공급자](/providers/models) 문서 참조.
