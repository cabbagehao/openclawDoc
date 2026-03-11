---
summary: "OpenClaw는 모든 OS에서 실행되는 AI 에이전트용 멀티 채널 게이트웨이입니다."
read_when:
  - Introducing OpenClaw to newcomers
title: "OpenClaw"
x-i18n:
  source_path: "index.md"
  source_hash: "0d167684402482da3162add3aeb4e184bb867a2578cc858a5ca27a918a985155"
  provider: "anthropic"
  model: "claude-opus-4-6"
  workflow: 1
  generated_at: "2026-03-10T08:15:18.341Z"
---

# OpenClaw 🦞

<p align="center">
  <img src="/assets/openclaw-logo-text-dark.png" alt="OpenClaw" width="500" class="dark:hidden" />

  <img src="/assets/openclaw-logo-text.png" alt="OpenClaw" width="500" class="hidden dark:block" />
</p>

> *"EXFOLIATE! EXFOLIATE!"* — 어느 우주 바닷가재의 말, 아마도

<p align="center">
  <strong>WhatsApp, Telegram, Discord, iMessage 등을 통해 AI 에이전트에 접근할 수 있는 모든 OS용 게이트웨이.</strong><br />
  메시지를 보내고, 주머니 속에서 바로 에이전트의 응답을 확인하세요. 플러그인을 통해 Mattermost 등을 추가할 수 있습니다.
</p>

<Columns>
  <Card title="시작하기" href="/start/getting-started" icon="rocket">
    OpenClaw를 설치하고 몇 분 안에 게이트웨이를 실행하세요.
  </Card>

  <Card title="마법사 실행" href="/start/wizard" icon="sparkles">
    `openclaw onboard` 및 페어링 플로우를 통한 단계별 설정 가이드.
  </Card>

  <Card title="제어 UI 열기" href="/web/control-ui" icon="layout-dashboard">
    채팅, 설정 및 세션 관리를 위한 브라우저 대시보드를 실행하세요.
  </Card>
</Columns>

## OpenClaw는 무엇인가요?

OpenClaw는 WhatsApp, Telegram, Discord, iMessage 등 평소 즐겨 사용하는 채팅 앱을 Pi와 같은 AI 코딩 에이전트에 연결해 주는 **자체 호스팅 게이트웨이**입니다. 자신의 컴퓨터(또는 서버)에서 단일 게이트웨이 프로세스를 실행하면, 메시징 앱과 언제나 사용 가능한 AI 어시스턴트를 이어주는 브리지가 됩니다.

**누구를 위한 것인가요?** 자신의 데이터를 직접 제어하면서 호스팅 서비스에 의존하지 않고 어디서나 메시지로 소통할 수 있는 개인용 AI 어시스턴트를 원하는 개발자와 파워 유저를 위해 만들어졌습니다.

**무엇이 다른가요?**

* **자체 호스팅**: 사용자의 하드웨어에서 사용자의 규칙에 따라 실행됩니다.
* **멀티 채널**: 하나의 게이트웨이로 WhatsApp, Telegram, Discord 등을 동시에 지원합니다.
* **에이전트 네이티브**: 도구 사용(Tool use), 세션, 메모리 및 멀티 에이전트 라우팅을 갖춘 코딩 에이전트 최적화 설계.
* **오픈 소스**: MIT 라이선스 기반의 커뮤니티 주도 프로젝트입니다.

**무엇이 필요한가요?** Node 22 이상, 선택한 제공업체의 API 키, 그리고 단 5분의 시간만 있으면 됩니다. 최상의 품질과 보안을 위해 사용 가능한 최신 세대의 가장 강력한 모델을 사용하는 것이 좋습니다.

## 작동 방식

```mermaid
flowchart LR
  A["채팅 앱 + 플러그인"] --> B["게이트웨이"]
  B --> C["Pi 에이전트"]
  B --> D["CLI"]
  B --> E["웹 제어 UI"]
  B --> F["macOS 앱"]
  B --> G["iOS 및 Android 노드"]
```

게이트웨이는 세션, 라우팅 및 채널 연결을 관리하는 단일 진실 공급원(Single Source of Truth) 역할을 합니다.

## 주요 기능

<Columns>
  <Card title="멀티 채널 게이트웨이" icon="network">
    단일 게이트웨이 프로세스로 WhatsApp, Telegram, Discord 및 iMessage를 지원합니다.
  </Card>

  <Card title="플러그인 채널" icon="plug">
    확장 패키지를 통해 Mattermost 등 더 많은 채널을 추가하세요.
  </Card>

  <Card title="멀티 에이전트 라우팅" icon="route">
    에이전트, 워크스페이스 또는 발신자별로 격리된 세션을 제공합니다.
  </Card>

  <Card title="미디어 지원" icon="image">
    이미지, 오디오 및 문서를 주고받을 수 있습니다.
  </Card>

  <Card title="웹 제어 UI" icon="monitor">
    채팅, 설정, 세션 및 노드 관리를 위한 브라우저 대시보드.
  </Card>

  <Card title="모바일 노드" icon="smartphone">
    Canvas, 카메라 및 음성 지원 워크플로우를 위해 iOS 및 Android 노드를 페어링하세요.
  </Card>
</Columns>

## 빠른 시작

<Steps>
  <Step title="OpenClaw 설치">
    ```bash
    npm install -g openclaw@latest
    ```
  </Step>

  <Step title="온보딩 및 서비스 설치">
    ```bash
    openclaw onboard --install-daemon
    ```
  </Step>

  <Step title="WhatsApp 페어링 및 게이트웨이 시작">
    ```bash
    openclaw channels login
    openclaw gateway --port 18789
    ```
  </Step>
</Steps>

전체 설치 및 개발 설정이 필요하신가요? [빠른 시작](/start/quickstart)을 확인하세요.

## 대시보드

게이트웨이가 시작된 후 브라우저에서 제어 UI를 여세요.

* 로컬 기본 주소: [http://127.0.0.1:18789/](http://127.0.0.1:18789/)
* 원격 액세스: [웹 서피스](/web) 및 [Tailscale](/gateway/tailscale)

<p align="center">
  <img src="/whatsapp-openclaw.jpg" alt="OpenClaw" width="420" />
</p>

## 구성 (선택 사항)

설정 파일은 `~/.openclaw/openclaw.json`에 위치합니다.

* **별도의 설정을 하지 않으면** OpenClaw는 발신자별 세션이 있는 RPC 모드에서 내장된 Pi 바이너리를 사용합니다.
* 보안을 강화하려면 `channels.whatsapp.allowFrom` 및 그룹 채팅을 위한 멘션 규칙 설정을 권장합니다.

예시:

```json5
{
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: { "*": { requireMention: true } },
    },
  },
  messages: { groupChat: { mentionPatterns: ["@openclaw"] } },
}
```

## 여기서 시작하세요

<Columns>
  <Card title="문서 허브" href="/start/hubs" icon="book-open">
    사용 사례별로 정리된 모든 문서와 가이드를 확인하세요.
  </Card>

  <Card title="구성" href="/gateway/configuration" icon="settings">
    핵심 게이트웨이 설정, 토큰 및 제공업체 구성 방법.
  </Card>

  <Card title="원격 액세스" href="/gateway/remote" icon="globe">
    SSH 및 Tailscale 액세스 패턴 가이드.
  </Card>

  <Card title="채널" href="/channels/telegram" icon="message-square">
    WhatsApp, Telegram, Discord 등을 위한 채널별 상세 설정.
  </Card>

  <Card title="노드" href="/nodes" icon="smartphone">
    페어링, Canvas, 카메라 및 장치 제어 기능이 있는 iOS 및 Android 노드.
  </Card>

  <Card title="도움말" href="/help" icon="life-buoy">
    일반적인 문제 해결 및 진입점 안내.
  </Card>
</Columns>

## 더 알아보기

<Columns>
  <Card title="전체 기능 목록" href="/concepts/features" icon="list">
    채널 지원, 라우팅 및 미디어 기능의 전체 목록.
  </Card>

  <Card title="멀티 에이전트 라우팅" href="/concepts/multi-agent" icon="route">
    워크스페이스 격리 및 에이전트별 개별 세션 관리.
  </Card>

  <Card title="보안" href="/gateway/security" icon="shield">
    토큰, 허용 목록(Allowlist) 및 안전 제어 옵션.
  </Card>

  <Card title="문제 해결" href="/gateway/troubleshooting" icon="wrench">
    게이트웨이 자가 진단 및 일반적인 오류 해결 방법.
  </Card>

  <Card title="정보 및 크레딧" href="/reference/credits" icon="info">
    프로젝트의 기원, 기여자 및 라이선스 정보.
  </Card>
</Columns>
