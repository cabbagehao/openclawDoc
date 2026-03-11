---
summary: "OpenClaw 최초 실행 시 macOS 앱 온보딩 절차 가이드"
read_when:
  - macOS용 온보딩 어시스턴트 설계 및 동작을 이해하고자 할 때
  - 인증 방식 및 신원 정보 설정 과정을 확인해야 할 때
title: "온보딩 (macOS 앱)"
sidebarTitle: "온보딩: macOS 앱"
x-i18n:
  source_path: "start/onboarding.md"
---

# 온보딩 (macOS 앱)

이 문서는 OpenClaw macOS 앱의 **현재** 최초 실행 온보딩 워크플로우를 설명함. 본 과정의 목표는 Gateway 위치 선택, 인증 연결, 설정 마법사 실행으로 이어지는 원활한 사용자 경험을 제공하여 에이전트가 스스로 초기화를 마칠 수 있도록 돕는 것임.
다양한 온보딩 경로에 대한 전반적인 개요는 [온보딩 개요](/start/onboarding-overview)를 참조함.

<Steps>
  <Step title="macOS 시스템 경고 승인">
    <Frame>
      <img src="/assets/macos-onboarding/01-macos-warning.jpeg" alt="" />
    </Frame>
  </Step>

  <Step title="로컬 네트워크 검색 권한 승인">
    <Frame>
      <img src="/assets/macos-onboarding/02-local-networks.jpeg" alt="" />
    </Frame>
  </Step>

  <Step title="환영 메시지 및 보안 고지 확인">
    <Frame caption="화면에 표시된 보안 고지 사항을 주의 깊게 읽고 진행함">
      <img src="/assets/macos-onboarding/03-security-notice.png" alt="" />
    </Frame>

    ### 보안 및 신뢰 모델(Security Trust Model)

    * **개인용 에이전트 기본 설정**: 기본적으로 OpenClaw는 단일 사용자가 운영하는 신뢰 경계 내에서 작동하는 개인용 에이전트임.
    * **다중 사용자 환경**: 공유 환경이나 다중 사용자 설정에서는 신뢰 경계를 명확히 분리하고, 도구 접근 권한을 최소화해야 함 ([보안 가이드](/gateway/security) 참조).
    * **기본 도구 프로필**: 로컬 온보딩 시 신규 설정의 기본 도구 프로필은 `coding`으로 지정됨. 이는 무제한 권한인 `full` 프로필 대신 파일 시스템 및 런타임 도구만 포함하여 안전한 초기 환경을 구축하기 위함임.
    * **외부 데이터 소스 연동**: 훅(Hooks), 웹훅 또는 기타 외부 콘텐츠 피드를 연동할 경우, 성능이 우수한 모델 사용과 엄격한 도구 정책 및 샌드박싱 적용을 권장함.
  </Step>

  <Step title="Gateway 실행 위치 선택">
    <Frame>
      <img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
    </Frame>

    **Gateway**를 어디에서 실행할지 선택함:

    * **로컬 (이 Mac에서 실행):** 온보딩 과정에서 직접 인증을 구성하고 자격 증명(Credentials)을 로컬에 저장함.
    * **원격 (SSH/Tailnet 연동):** 온보딩 과정에서 로컬 인증 정보를 별도로 구성하지 않음. 자격 증명은 해당 원격 게이트웨이 호스트에 이미 존재해야 함.
    * **나중에 구성:** 초기 설정을 건너뛰며, 앱은 구성되지 않은 상태로 유지됨.

    <Tip>
      **Gateway 인증 팁:**

      * 설정 마법사는 보안을 위해 루프백(Loopback) 연결 시에도 \*\*토큰(Token)\*\*을 자동으로 생성함. 따라서 로컬 WebSocket 클라이언트도 인증이 필요함.
      * 인증 기능을 비활성화하면 모든 로컬 프로세스가 제한 없이 연결 가능하므로, 충분히 신뢰할 수 있는 전용 기기에서만 사용해야 함.
      * 외부 기기에서 접근하거나 루프백 이외의 주소에 바인딩할 경우 반드시 **토큰** 인증을 사용함.
    </Tip>
  </Step>

  <Step title="시스템 권한 설정">
    <Frame caption="OpenClaw에 부여할 시스템 권한을 선택함">
      <img src="/assets/macos-onboarding/05-permissions.png" alt="" />
    </Frame>

    원활한 작동을 위해 다음 항목에 대한 TCC 권한을 요청함:

    * 자동화 (AppleScript)
    * 알림 표시
    * 접근성(Accessibility) 지원
    * 화면 기록
    * 마이크 접근
    * 음성 인식
    * 카메라 접근
    * 위치 정보
  </Step>

  <Step title="CLI 설치">
    <Info>이 단계는 선택 사항임</Info>
    npm 또는 pnpm을 통해 전역 `openclaw` CLI 명령어를 설치할 수 있음. 설치 시 터미널 워크플로우와 launchd 작업을 즉시 사용할 수 있음.
  </Step>

  <Step title="온보딩 전용 채팅">
    모든 설정이 완료되면 에이전트가 자신을 소개하고 다음 단계를 안내하는 전용 온보딩 채팅 세션이 열림. 이는 초기 안내 메시지가 일반 대화 이력과 섞이지 않도록 격리된 공간에서 진행됨. 최초 실행 시 게이트웨이 호스트 내부에서 수행되는 작업은 [부트스트래핑 가이드](/start/bootstrapping)를 참조함.
  </Step>
</Steps>
