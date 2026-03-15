---
summary: "채널, 라우팅, 미디어, UX 전반에 걸친 OpenClaw 기능."
read_when:
  - OpenClaw가 지원하는 전체 기능 목록이 필요할 때
title: "기능"
---

## 주요 기능

<Columns>
  <Card title="채널" icon="message-square">
    단일 게이트웨이로 WhatsApp, Telegram, Discord, iMessage를 모두 연결합니다.
  </Card>
  <Card title="플러그인" icon="plug">
    확장 기능을 통해 Mattermost 등 더 많은 채널을 추가할 수 있습니다.
  </Card>
  <Card title="라우팅" icon="route">
    격리된 세션을 지원하는 멀티 에이전트 라우팅을 제공합니다.
  </Card>
  <Card title="미디어" icon="image">
    이미지, 오디오, 문서를 양방향으로 주고받을 수 있습니다.
  </Card>
  <Card title="앱 및 UI" icon="monitor">
    웹 제어 UI(Control UI)와 macOS 컴패니언 앱을 제공합니다.
  </Card>
  <Card title="모바일 노드" icon="smartphone">
    iOS 및 Android 노드와 페어링하여 음성/채팅 및 다양한 기기 명령을 사용할 수 있습니다.
  </Card>
</Columns>

## 전체 기능 목록

- WhatsApp Web(Baileys) 연동을 통한 WhatsApp 통합
- Telegram 봇 지원 (grammY 기반)
- Discord 봇 지원 (channels.discord.js 기반)
- Mattermost 봇 지원 (플러그인 방식)
- macOS 로컬 imsg CLI를 통한 iMessage 연동
- 도구 스트리밍 기능을 포함한 RPC 모드의 Pi 에이전트 브리지
- 긴 응답을 위한 스트리밍 및 청킹(Chunking) 기능
- 워크스페이스 또는 발신자별 세션 격리를 위한 멀티 에이전트 라우팅
- OAuth를 통한 Anthropic 및 OpenAI 구독 인증 지원
- 세션 관리: 개인 채팅은 공유 `main` 세션으로 통합되며, 그룹 채팅은 개별적으로 격리됩니다.
- 멘션 기반 활성화를 지원하는 그룹 채팅 기능
- 이미지, 오디오, 문서 등 미디어 파일 지원
- 선택적 음성 메모 전사(Transcription) 훅 제공
- 웹 채팅(WebChat) 및 macOS 메뉴 바 앱 제공
- iOS 노드: 페어링, Canvas, 카메라, 화면 녹화, 위치 정보 및 음성 기능 지원
- Android 노드: 페어링, Connect 탭, 채팅 세션, 음성 탭, Canvas/카메라 지원 및 기기 제어, 알림, 연락처/캘린더, 모션 센서, 사진, SMS 명령 지원

<Note>
레거시 Claude, Codex, Gemini 및 Opencode 경로는 제거되었습니다. 현재 Pi가 유일하게 지원되는 코딩 에이전트입니다.
</Note>
