---
summary: "OpenClaw의 첫 실행 온보딩 플로우 (macOS 앱)"
read_when:
  - macOS 온보딩 어시스턴트 설계 시
  - 인증 또는 신원 설정 구현 시
title: "온보딩 (macOS 앱)"
sidebarTitle: "온보딩: macOS 앱"
x-i18n:
  source_path: "start/onboarding.md"
  source_hash: "6c40aa1074afbf1b1ef896c737cd505884293d3ca620d8469ff6478aa5a96d35"
  provider: "anthropic"
  model: "claude-opus-4-6"
  workflow: 1
  generated_at: "2026-03-10T08:15:41.067Z"
---


# 온보딩 (macOS 앱)

이 문서는 **현재** 첫 실행 온보딩 플로우를 설명합니다. 목표는 원활한 "첫날" 경험입니다: Gateway가 실행될 위치를 선택하고, 인증을 연결하고, 마법사를 실행하여 에이전트가 스스로 부트스트랩하도록 합니다.
온보딩 경로의 일반적인 개요는 [온보딩 개요](/start/onboarding-overview)를 참조하세요.

<Steps>
<Step title="macOS 경고 승인">
<Frame>
<img src="/assets/macos-onboarding/01-macos-warning.jpeg" alt="" />
</Frame>
</Step>
<Step title="로컬 네트워크 찾기 승인">
<Frame>
<img src="/assets/macos-onboarding/02-local-networks.jpeg" alt="" />
</Frame>
</Step>
<Step title="환영 및 보안 안내">
<Frame caption="표시된 보안 안내를 읽고 결정하세요">
<img src="/assets/macos-onboarding/03-security-notice.png" alt="" />
</Frame>

보안 신뢰 모델:

- 기본적으로 OpenClaw는 개인 에이전트입니다: 하나의 신뢰할 수 있는 운영자 경계.
- 공유/다중 사용자 설정은 잠금이 필요합니다 (신뢰 경계 분리, 도구 액세스 최소화 유지, [보안](/gateway/security) 준수).
- 로컬 온보딩은 이제 새 구성을 `tools.profile: "coding"`으로 기본 설정하므로 새로운 로컬 설정은 제한 없는 `full` 프로필을 강제하지 않고 파일시스템/런타임 도구를 유지합니다.
- 훅/웹훅 또는 기타 신뢰할 수 없는 콘텐츠 피드가 활성화된 경우, 강력한 최신 모델 계층을 사용하고 엄격한 도구 정책/샌드박싱을 유지하세요.

</Step>
<Step title="로컬 vs 원격">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

**Gateway**가 어디에서 실행됩니까?

- **이 Mac (로컬 전용):** 온보딩이 인증을 구성하고 자격 증명을 로컬에 작성할 수 있습니다.
- **원격 (SSH/Tailnet을 통해):** 온보딩이 로컬 인증을 구성하지 **않습니다**; 자격 증명은 게이트웨이 호스트에 존재해야 합니다.
- **나중에 구성:** 설정을 건너뛰고 앱을 구성되지 않은 상태로 둡니다.

<Tip>
**Gateway 인증 팁:**

- 마법사는 이제 local loopback에 대해서도 **토큰**을 생성하므로 로컬 WS 클라이언트는 인증해야 합니다.
- 인증을 비활성화하면 모든 로컬 프로세스가 연결할 수 있습니다; 완전히 신뢰할 수 있는 머신에서만 사용하세요.
- 다중 머신 액세스 또는 non-loopback 바인딩에는 **토큰**을 사용하세요.

</Tip>
</Step>
<Step title="권한">
<Frame caption="OpenClaw에 부여할 권한을 선택하세요">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

온보딩은 다음에 필요한 TCC 권한을 요청합니다:

- 자동화 (AppleScript)
- 알림
- 접근성
- 화면 녹화
- 마이크
- 음성 인식
- 카메라
- 위치

</Step>
<Step title="CLI">
  <Info>이 단계는 선택 사항입니다</Info>
  앱은 npm/pnpm을 통해 전역 `openclaw` CLI를 설치할 수 있으므로 터미널 워크플로우와 launchd 작업이 즉시 작동합니다.
</Step>
<Step title="온보딩 채팅 (전용 세션)">
  설정 후 앱은 전용 온보딩 채팅 세션을 열어 에이전트가 자신을 소개하고 다음 단계를 안내할 수 있도록 합니다. 이렇게 하면 첫 실행 안내가 일반 대화와 분리됩니다. 첫 에이전트 실행 중 게이트웨이 호스트에서 발생하는 작업은 [부트스트래핑](/start/bootstrapping)을 참조하세요.
</Step>
</Steps>
