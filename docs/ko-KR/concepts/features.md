---
summary: "채널, 라우팅, 미디어, UX 전반에 걸친 OpenClaw 기능."
read_when:
  - OpenClaw가 지원하는 전체 기능 목록이 필요할 때
title: "기능"
---

## 주요 하이라이트

<Columns>
  <Card title="채널" icon="message-square">
    단일 Gateway로 WhatsApp, Telegram, Discord, iMessage를 연결합니다.
  </Card>
  <Card title="플러그인" icon="plug">
    확장으로 Mattermost 등 더 많은 채널을 추가합니다.
  </Card>
  <Card title="라우팅" icon="route">
    격리된 세션을 갖는 멀티 에이전트 라우팅.
  </Card>
  <Card title="미디어" icon="image">
    이미지, 오디오, 문서를 양방향으로 처리합니다.
  </Card>
  <Card title="앱과 UI" icon="monitor">
    웹 Control UI와 macOS 컴패니언 앱.
  </Card>
  <Card title="모바일 노드" icon="smartphone">
    페어링, 음성/채팅, 풍부한 기기 명령을 제공하는 iOS 및 Android 노드.
  </Card>
</Columns>

## 전체 목록

- WhatsApp Web(Baileys)을 통한 WhatsApp 통합
- Telegram 봇 지원(grammY)
- Discord 봇 지원(channels.discord.js)
- Mattermost 봇 지원(플러그인)
- 로컬 imsg CLI(macOS)를 통한 iMessage 통합
- RPC 모드와 도구 스트리밍을 사용하는 Pi용 에이전트 브리지
- 긴 응답을 위한 스트리밍과 청킹
- 워크스페이스 또는 발신자별로 세션을 격리하는 멀티 에이전트 라우팅
- OAuth를 통한 Anthropic 및 OpenAI 구독 인증
- 세션: 직접 채팅은 공유 `main`으로 합쳐지고, 그룹은 격리됨
- 멘션 기반 활성화를 지원하는 그룹 채팅
- 이미지, 오디오, 문서용 미디어 지원
- 선택적 음성 메모 전사 훅
- WebChat과 macOS 메뉴 바 앱
- 페어링, Canvas, 카메라, 화면 녹화, 위치, 음성 기능을 갖춘 iOS 노드
- 페어링, Connect 탭, 채팅 세션, 음성 탭, Canvas/카메라, 그리고 기기, 알림, 연락처/캘린더, 모션, 사진, SMS 명령을 갖춘 Android 노드

<Note>
레거시 Claude, Codex, Gemini, Opencode 경로는 제거되었습니다. Pi만이 유일한
코딩 에이전트 경로입니다.
</Note>
