---
summary: "OpenClaw용 macOS 앱의 최초 실행 온보딩 흐름"
read_when:
  - macOS 온보딩 어시스턴트를 설계할 때
  - 인증 또는 신원 설정을 구현할 때
title: "온보딩 (macOS 앱)"
description: "macOS 앱에서 Gateway 위치 선택, 권한 승인, auth 설정, onboarding chat 시작까지의 첫 실행 흐름을 설명합니다."
sidebarTitle: "온보딩: macOS 앱"
x-i18n:
  source_path: "start/onboarding.md"
---

# 온보딩 (macOS 앱)

이 문서는 **현재**의 최초 실행 onboarding flow를 설명합니다. 목표는 매끄러운 "day 0" 경험입니다. 즉, Gateway가 어디에서 실행되는지 선택하고, auth를 연결하고, wizard를 실행한 뒤, agent가 스스로 bootstrap하도록 돕는 흐름입니다.
온보딩 경로 전반의 개요는 [Onboarding Overview](/start/onboarding-overview)를 참고하세요.

<Steps>
<Step title="macOS 경고 승인">
<Frame>
<img src="/assets/macos-onboarding/01-macos-warning.jpeg" alt="" />
</Frame>
</Step>
<Step title="로컬 네트워크 찾기 권한 승인">
<Frame>
<img src="/assets/macos-onboarding/02-local-networks.jpeg" alt="" />
</Frame>
</Step>
<Step title="환영 및 보안 고지">
<Frame caption="표시된 보안 고지를 읽고 적절히 판단하세요">
<img src="/assets/macos-onboarding/03-security-notice.png" alt="" />
</Frame>

보안 신뢰 모델:

- 기본적으로 OpenClaw는 개인용 agent입니다. 신뢰된 operator boundary가 하나라고 가정합니다.
- shared/multi-user 환경은 더 엄격하게 잠가야 합니다. 신뢰 경계를 분리하고, tool access를 최소화하며, [Security](/gateway/security)를 따르세요.
- local onboarding은 이제 새 config의 기본값을 `tools.profile: "coding"`으로 설정합니다. fresh local setups에서 제한 없는 `full` profile을 강요하지 않고 filesystem/runtime tools를 유지하기 위함입니다.
- hooks/webhooks 또는 기타 신뢰할 수 없는 content feeds가 활성화되어 있다면, 강력한 최신 model tier를 사용하고 tool policy/sandboxing을 엄격하게 유지하세요.

</Step>
<Step title="Local vs Remote">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

**Gateway**는 어디에서 실행되나요?

- **This Mac (Local only):** onboarding이 로컬에서 auth를 구성하고 credentials를 기록할 수 있습니다.
- **Remote (over SSH/Tailnet):** onboarding은 로컬 auth를 구성하지 않습니다. credentials는 gateway host에 이미 있어야 합니다.
- **Configure later:** 설정을 건너뛰고 앱을 미구성 상태로 남깁니다.

<Tip>
**Gateway auth 팁:**

- 이제 wizard는 loopback에서도 **token**을 생성하므로, 로컬 WS clients도 인증해야 합니다.
- auth를 끄면 로컬의 어떤 process든 연결할 수 있으므로, 완전히 신뢰되는 머신에서만 그렇게 하세요.
- 여러 머신에서 접근하거나 non-loopback bind를 사용할 때는 **token**을 쓰세요.

</Tip>
</Step>
<Step title="권한">
<Frame caption="OpenClaw에 어떤 권한을 줄지 선택하세요">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

onboarding은 다음에 필요한 TCC permissions를 요청합니다.

- Automation (AppleScript)
- Notifications
- Accessibility
- Screen Recording
- Microphone
- Speech Recognition
- Camera
- Location

</Step>
<Step title="CLI">
  <Info>이 단계는 선택 사항입니다</Info>
  앱은 npm/pnpm을 통해 전역 `openclaw` CLI를 설치할 수 있으므로, terminal workflows와 launchd tasks를 바로 사용할 수 있습니다.
</Step>
<Step title="Onboarding Chat (전용 세션)">
  설정이 끝나면 앱은 전용 onboarding chat session을 엽니다. 여기서 agent가 자신을 소개하고 다음 단계를 안내합니다. 이렇게 하면 first-run guidance를 일반 대화와 분리할 수 있습니다. 첫 agent run 동안 gateway host에서 어떤 일이 일어나는지는 [Bootstrapping](/start/bootstrapping)을 참고하세요.
</Step>
</Steps>
