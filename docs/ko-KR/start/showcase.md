---
title: "쇼케이스"
description: "커뮤니티가 OpenClaw를 활용하여 구축한 실제 프로젝트 사례"
summary: "OpenClaw 기반의 다양한 커뮤니티 프로젝트 및 통합 활용 사례 모음"
read_when:
  - 실제 OpenClaw 활용 및 구축 사례가 궁금할 때
  - 커뮤니티의 최신 프로젝트 하이라이트를 확인하고 싶을 때
x-i18n:
  source_path: "start/showcase.md"
---

# 쇼케이스 (Showcase)

커뮤니티 사용자들이 직접 개발한 실제 프로젝트 모음임. OpenClaw를 활용해 어떤 놀라운 일들이 가능한지 확인해 보시기 바람.

<Info>
**본인의 프로젝트를 소개하고 싶으신가요?** [Discord의 #showcase 채널](https://discord.gg/clawd)에 공유하거나 [X(Twitter)에서 @openclaw를 태그](https://x.com/openclaw)해 주시기 바람.
</Info>

## 🎥 실제 작동 사례 영상

VelvetShark가 제작한 전체 설정 가이드 및 시연 영상(28분)임.

<div
  style={{
    position: "relative",
    paddingBottom: "56.25%",
    height: 0,
    overflow: "hidden",
    borderRadius: 16,
  }}
>
  <iframe
    src="https://www.youtube-nocookie.com/embed/SaWSPZoPX34"
    title="OpenClaw: The self-hosted AI that Siri should have been (Full setup)"
    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
    frameBorder="0"
    loading="lazy"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowFullScreen
  />
</div>

[YouTube에서 시청하기](https://www.youtube.com/watch?v=SaWSPZoPX34)

<div
  style={{
    position: "relative",
    paddingBottom: "56.25%",
    height: 0,
    overflow: "hidden",
    borderRadius: 16,
  }}
>
  <iframe
    src="https://www.youtube-nocookie.com/embed/mMSKQvlmFuQ"
    title="OpenClaw showcase video"
    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
    frameBorder="0"
    loading="lazy"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowFullScreen
  />
</div>

[YouTube에서 시청하기](https://www.youtube.com/watch?v=mMSKQvlmFuQ)

## 🆕 Discord 최신 프로젝트

<CardGroup cols={2}>

<Card title="PR 리뷰 결과 Telegram 알림" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

코드 수정 후 PR을 생성하면, OpenClaw가 변경 사항을 분석하여 "경미한 수정 권장" 사항과 함께 병합 가능 여부를 Telegram으로 즉시 전송함.

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="Telegram으로 전송된 PR 리뷰 결과" />
</Card>

<Card title="CSV 기반 와인 셀러 관리 스킬" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

에이전트에게 와인 셀러 관리 스킬을 요청함. CSV 파일 데이터(약 962병)를 기반으로 스킬을 즉석에서 구축 및 테스트하여 완성함.

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="CSV 데이터를 활용한 와인 관리 스킬 구축 사례" />
</Card>

<Card title="Tesco 쇼핑 완전 자동화" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

주간 식단 수립부터 배송 시간 예약, 최종 주문 확정까지 브라우저 제어만으로 처리함. 별도의 API 없이 동작함.

  <img src="/assets/showcase/tesco-shop.jpg" alt="쇼핑 프로세스 자동화 시연" />
</Card>

<Card title="SNAG: 스크린샷-마크다운 변환" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

화면의 특정 영역을 캡처하면 Gemini Vision이 이를 분석하여 즉시 마크다운(Markdown) 코드로 변환 후 클립보드에 저장함.

  <img src="/assets/showcase/snag.png" alt="SNAG 도구 활용 이미지" />
</Card>

<Card title="Bambu 3D 프린터 원격 제어" icon="print" href="https://clawhub.com/tobiasbischoff/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

BambuLab 3D 프린터의 상태 확인, 작업 관리, 카메라 스트리밍 및 AMS 설정을 채팅창에서 원격으로 제어함.

  <img src="/assets/showcase/bambu-cli.png" alt="Bambu CLI 스킬 시연" />
</Card>

<Card title="비엔나 대중교통 실시간 안내" icon="train" href="https://clawhub.com/hjanuschka/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

비엔나 시내 교통수단의 실시간 도착 예정 시간, 운행 중단 정보 및 최적 경로를 안내함.

  <img src="/assets/showcase/wienerlinien.png" alt="Wiener Linien 스킬 화면" />
</Card>

<Card title="iOS 앱 개발 및 배포 자동화" icon="mobile" href="#">
  **@coard** • `ios` `xcode` `testflight`

지도 연동 및 음성 녹음 기능이 포함된 iOS 앱을 설계하고, Telegram 채팅만으로 TestFlight 배포까지 완료함.

  <img src="/assets/showcase/ios-testflight.jpg" alt="Telegram으로 구축된 iOS 앱 배포 사례" />
</Card>

<Card title="Oura Ring 개인 건강 비서" icon="heart-pulse" href="#">
  **@AS** • `health` `oura` `calendar`

Oura Ring의 건강 데이터와 캘린더 일정을 통합하여 개인 맞춤형 운동 및 건강 관리 조언을 제공함.

  <img src="/assets/showcase/oura-health.png" alt="Oura Ring 연동 건강 비서" />
</Card>

</CardGroup>

## 🤖 자동화 및 워크플로우 (Automation)

<CardGroup cols={2}>

<Card title="공기청정기 스마트 제어" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

실내 공기질 데이터를 실시간으로 모니터링하여 공기청정기 동작을 에이전트가 자율적으로 관리함.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="Winix 공기청정기 제어 사례" />
</Card>

<Card title="파델(Padel) 테니스 코트 예약" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`
  
  Playtomic 서비스의 예약 가능 여부를 확인하고 명령어로 즉시 예약하는 CLI 도구임.
  
  <img src="/assets/showcase/padel-screenshot.jpg" alt="파델 예약 시스템 스크린샷" />
</Card>

<Card title="회계 업무 자동 수집기" icon="file-invoice-dollar">
  **Community** • `automation` `email` `pdf`
  
  이메일로 들어오는 PDF 인보이스를 자동으로 수집하고 분류하여 세무 업무 처리를 지원함.
</Card>

<Card title="Slack 자동 고객 지원" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

회사 Slack 채널을 모니터링하여 질문에 답변하고 중요 알림을 Telegram으로 전달함. 배포된 앱의 버그를 스스로 찾아 수정함.
</Card>

</CardGroup>

## 🧠 지식 및 기억 시스템 (Memory)

<CardGroup cols={2}>

<Card title="xuezh: 중국어 학습 도우미" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`
  
  발음 피드백 및 개인 맞춤형 학습 흐름을 제공하는 인공지능 기반 중국어 학습 엔진임.
  
  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="xuezh 중국어 학습 화면" />
</Card>

<Card title="WhatsApp 기억 보관소" icon="vault">
  **Community** • `memory` `transcription` `indexing`
  
  WhatsApp 대화 내용을 분석하고 1,000개 이상의 음성 메시지를 전사하여 Git 로그와 연동된 지식 보고서를 생성함.
</Card>

</CardGroup>

## 🏗️ 인프라 및 배포 (Deployment)

<CardGroup cols={2}>

<Card title="Home Assistant 공식 애드온" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`
  
  Home Assistant OS 상에서 SSH 터널링을 지원하며 영구적인 상태 보존이 가능한 통합 솔루션임.
</Card>

<Card title="Nix 기반 재현 가능한 배포" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`
  
  복잡한 설정 없이도 모든 환경에서 동일하게 작동하도록 설계된 Nix 기반의 패키징 구성임.
</Card>

</CardGroup>

---

## 프로젝트 제출 안내

공유하고 싶은 멋진 프로젝트가 있으신가요? 언제든 환영함!

<Steps>
  <Step title="공유하기">
    [Discord #showcase 채널](https://discord.gg/clawd)에 게시하거나 [X(Twitter) @openclaw](https://x.com/openclaw) 계정으로 멘션을 보냄.
  </Step>
  <Step title="상세 정보 포함">
    프로젝트의 기능 설명, 소스 저장소(Repo) 또는 데모 링크, 그리고 가능하다면 스크린샷을 포함해 주시기 바람.
  </Step>
  <Step title="쇼케이스 등재">
    선정된 우수 프로젝트는 본 페이지에 정식으로 소개됨.
  </Step>
</Steps>
