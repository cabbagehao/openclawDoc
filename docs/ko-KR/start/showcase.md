---
title: "쇼케이스"
description: "커뮤니티의 실제 OpenClaw 프로젝트"
summary: "OpenClaw로 구동되는 커뮤니티 제작 프로젝트와 통합 사례"
read_when:
  - 실제 OpenClaw 활용 사례를 찾고 있을 때
  - 커뮤니티 프로젝트 하이라이트를 업데이트할 때
x-i18n:
  source_path: "start/showcase.md"
---

# 쇼케이스

커뮤니티의 실제 프로젝트를 모았습니다. 사람들이 OpenClaw로 무엇을 만들고 있는지 확인해 보세요.

<Info>
**소개되고 싶으신가요?** [Discord의 #showcase](https://discord.gg/clawd)에 프로젝트를 공유하거나 [X에서 @openclaw를 태그](https://x.com/openclaw)해 주세요.
</Info>

## 🎥 OpenClaw 실제 사용 장면

VelvetShark가 진행한 전체 설정 워크스루(28분)입니다.

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

[YouTube에서 보기](https://www.youtube.com/watch?v=SaWSPZoPX34)

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

[YouTube에서 보기](https://www.youtube.com/watch?v=mMSKQvlmFuQ)

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
    src="https://www.youtube-nocookie.com/embed/5kkIJNUGFho"
    title="OpenClaw community showcase"
    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
    frameBorder="0"
    loading="lazy"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowFullScreen
  />
</div>

[YouTube에서 보기](https://www.youtube.com/watch?v=5kkIJNUGFho)

## 🆕 Discord 최신 사례

<CardGroup cols={2}>
  <Card title="PR 리뷰 → Telegram 피드백" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
    **@bangnokia** • `review` `github` `telegram`

OpenCode가 변경을 마치고 PR을 연 뒤, OpenClaw가 diff를 검토해 Telegram에서 “경미한 제안”과 함께 명확한 병합 판단을 회신합니다(먼저 적용해야 할 치명적 수정도 포함).

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="Telegram으로 전달된 OpenClaw PR 리뷰 피드백" />
  </Card>

  <Card title="몇 분 만에 만든 와인 셀러 스킬" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
    **@prades_maxime** • `skills` `local` `csv`

“Robby”(@openclaw)에게 로컬 와인 셀러 스킬을 요청하자, 샘플 CSV 내보내기와 저장 위치를 물은 뒤 빠르게 스킬을 빌드하고 테스트했습니다(예시에서는 962병).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="CSV로 로컬 와인 셀러 스킬을 만드는 OpenClaw" />
  </Card>

  <Card title="Tesco 쇼핑 자동화" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
    **@marchattonhere** • `automation` `browser` `shopping`

주간 식단 → 고정 구매 품목 → 배송 슬롯 예약 → 주문 확정까지. API 없이 브라우저 제어만으로 처리합니다.

  <img src="/assets/showcase/tesco-shop.jpg" alt="채팅 기반 Tesco 쇼핑 자동화" />
  </Card>

  <Card title="SNAG 스크린샷-투-마크다운" icon="scissors" href="https://github.com/am-will/snag">
    **@am-will** • `devtools` `screenshots` `markdown`

화면 영역을 단축키로 선택하면 Gemini vision을 거쳐 즉시 Markdown이 클립보드에 들어갑니다.

  <img src="/assets/showcase/snag.png" alt="SNAG 스크린샷-투-마크다운 도구" />
  </Card>

  <Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
    **@kitze** • `ui` `skills` `sync`

Agents, Claude, Codex, OpenClaw 전반의 스킬과 명령을 관리하는 데스크톱 앱입니다.

  <img src="/assets/showcase/agents-ui.jpg" alt="Agents UI 앱" />
  </Card>

  <Card title="Telegram 음성 메모 (papla.media)" icon="microphone" href="https://papla.media/docs">
    **Community** • `voice` `tts` `telegram`

papla.media TTS를 감싸서 결과를 Telegram 음성 메모로 보냅니다(거슬리는 자동 재생 없음).

  <img src="/assets/showcase/papla-tts.jpg" alt="TTS에서 생성된 Telegram 음성 메모 출력" />
  </Card>

  <Card title="CodexMonitor" icon="eye" href="https://clawhub.com/odrobnik/codexmonitor">
    **@odrobnik** • `devtools` `codex` `brew`

Homebrew로 설치하는 도우미로, 로컬 OpenAI Codex 세션을 나열하고 확인하고 감시할 수 있습니다(CLI + VS Code).

  <img src="/assets/showcase/codexmonitor.png" alt="ClawHub의 CodexMonitor" />
  </Card>

  <Card title="Bambu 3D 프린터 제어" icon="print" href="https://clawhub.com/tobiasbischoff/bambu-cli">
    **@tobiasbischoff** • `hardware` `3d-printing` `skill`

BambuLab 프린터의 상태, 작업, 카메라, AMS, 보정 등을 제어하고 문제를 진단할 수 있습니다.

  <img src="/assets/showcase/bambu-cli.png" alt="ClawHub의 Bambu CLI 스킬" />
  </Card>

  <Card title="비엔나 대중교통 (Wiener Linien)" icon="train" href="https://clawhub.com/hjanuschka/wienerlinien">
    **@hjanuschka** • `travel` `transport` `skill`

비엔나 대중교통의 실시간 출발 정보, 장애 상황, 엘리베이터 상태, 경로 안내를 제공합니다.

  <img src="/assets/showcase/wienerlinien.png" alt="ClawHub의 Wiener Linien 스킬" />
  </Card>

  <Card title="ParentPay 학교 급식" icon="utensils" href="#">
    **@George5562** • `automation` `browser` `parenting`

ParentPay를 통한 영국 학교 급식 예약 자동화입니다. 안정적인 표 셀 클릭을 위해 마우스 좌표를 사용합니다.
</Card>

  <Card title="R2 업로드 (내 파일 보내줘)" icon="cloud-arrow-up" href="https://clawhub.com/skills/r2-upload">
    **@julianengel** • `files` `r2` `presigned-urls`

Cloudflare R2/S3에 업로드하고 안전한 presigned 다운로드 링크를 생성합니다. 원격 OpenClaw 인스턴스에 특히 유용합니다.
</Card>

  <Card title="Telegram으로 만든 iOS 앱" icon="mobile" href="#">
    **@coard** • `ios` `xcode` `testflight`

지도와 음성 녹음을 포함한 완전한 iOS 앱을 만들어 Telegram 채팅만으로 TestFlight에 배포했습니다.

  <img src="/assets/showcase/ios-testflight.jpg" alt="TestFlight에 올라간 iOS 앱" />
  </Card>

  <Card title="Oura Ring 건강 도우미" icon="heart-pulse" href="#">
    **@AS** • `health` `oura` `calendar`

Oura Ring 데이터와 일정, 약속, 운동 스케줄을 연결한 개인 AI 건강 도우미입니다.

  <img src="/assets/showcase/oura-health.png" alt="Oura Ring 건강 도우미" />
  </Card>
  <Card title="Kev의 드림팀 (14개 이상 에이전트)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
    **@adam91holt** • `multi-agent` `orchestration` `architecture` `manifesto`

하나의 Gateway 아래에서 Opus 4.5 오케스트레이터가 Codex 워커들에게 작업을 위임하는 14개 이상의 에이전트 구성입니다. Dream Team 구성, 모델 선택, 샌드박싱, 웹훅, 하트비트, 위임 흐름을 다루는 포괄적인 [기술 문서](https://github.com/adam91holt/orchestrated-ai-articles)가 있습니다. 에이전트 샌드박싱은 [Clawdspace](https://github.com/adam91holt/clawdspace)를 참고하세요. [블로그 글](https://adams-ai-journey.ghost.io/2026-the-year-of-the-orchestrator/)도 있습니다.
</Card>

  <Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
    **@NessZerra** • `devtools` `linear` `cli` `issues`

에이전트형 워크플로우(Claude Code, OpenClaw)와 통합되는 Linear용 CLI입니다. 터미널에서 이슈, 프로젝트, 워크플로우를 관리할 수 있습니다. 첫 외부 PR도 병합됐습니다.
</Card>

  <Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
    **@jules** • `messaging` `beeper` `cli` `automation`

Beeper Desktop을 통해 메시지를 읽고, 보내고, 보관합니다. Beeper 로컬 MCP API를 사용하므로 에이전트가 iMessage, WhatsApp 등 모든 채팅을 한곳에서 관리할 수 있습니다.
</Card>
</CardGroup>

## 🤖 자동화 및 워크플로우

<CardGroup cols={2}>
  <Card title="Winix 공기청정기 제어" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
    **@antonplex** • `automation` `hardware` `air-quality`

Claude Code가 공기청정기 제어 기능을 발견하고 확인한 뒤, OpenClaw가 이를 이어받아 실내 공기질을 관리합니다.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="OpenClaw를 통한 Winix 공기청정기 제어" />
  </Card>

  <Card title="예쁜 하늘 카메라 촬영" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
    **@signalgaining** • `automation` `camera` `skill` `images`

지붕 카메라를 트리거로 삼아, 하늘이 예쁠 때마다 OpenClaw에게 사진을 찍게 했습니다. 스킬을 설계하고 직접 촬영도 수행했습니다.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="OpenClaw가 촬영한 지붕 카메라 하늘 사진" />
  </Card>

  <Card title="시각형 아침 브리핑 장면" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
    **@buddyhadry** • `automation` `briefing` `images` `telegram`

예약된 프롬프트가 매일 아침 OpenClaw 페르소나를 통해 날씨, 할 일, 날짜, 좋아하는 게시물/인용문을 담은 하나의 “장면” 이미지를 생성합니다.
</Card>

  <Card title="파델 코트 예약" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
    **@joshp123** • `automation` `booking` `cli`

Playtomic 예약 가능 여부 확인 + 예약 CLI. 열린 코트를 다시는 놓치지 않게 해 줍니다.

  <img src="/assets/showcase/padel-screenshot.jpg" alt="padel-cli 스크린샷" />
  </Card>

  <Card title="회계 자료 수집" icon="file-invoice-dollar">
    **Community** • `automation` `email` `pdf`

이메일에서 PDF를 수집하고, 세무사에게 넘길 문서를 준비합니다. 월간 회계 작업을 자동화합니다.
</Card>

  <Card title="소파 감자 개발 모드" icon="couch" href="https://davekiss.com">
    **@davekiss** • `telegram` `website` `migration` `astro`

Netflix를 보면서 Telegram만으로 개인 사이트 전체를 다시 만들었습니다. Notion → Astro, 글 18개 마이그레이션, DNS는 Cloudflare로 이전. 노트북을 한 번도 열지 않았습니다.
</Card>

  <Card title="구직 에이전트" icon="briefcase">
    **@attol8** • `automation` `api` `skill`

채용 공고를 검색하고, CV 키워드와 매칭한 뒤, 관련 기회를 링크와 함께 반환합니다. JSearch API를 사용해 30분 만에 만들었습니다.
</Card>

  <Card title="Jira 스킬 빌더" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
    **@jdrhyne** • `automation` `jira` `skill` `devtools`

OpenClaw가 Jira에 연결된 뒤, ClawHub에 존재하기도 전에 새로운 스킬을 즉석에서 생성했습니다.
</Card>

  <Card title="Telegram으로 만든 Todoist 스킬" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
    **@iamsubhrajyoti** • `automation` `todoist` `skill` `telegram`

Todoist 작업을 자동화하고, OpenClaw가 Telegram 채팅 안에서 직접 스킬을 생성하도록 했습니다.
</Card>

  <Card title="TradingView 분석" icon="chart-line">
    **@bheem1798** • `finance` `browser` `automation`

브라우저 자동화로 TradingView에 로그인하고, 차트 스크린샷을 찍고, 필요할 때 기술적 분석을 수행합니다. API 없이 브라우저 제어만 사용합니다.
</Card>

  <Card title="Slack 자동 지원" icon="slack">
    **@henrymascot** • `slack` `automation` `support`

회사 Slack 채널을 지켜보다가 도움이 되는 답변을 하고, 알림은 Telegram으로 전달합니다. 심지어 요청받지 않았는데도 배포된 앱의 프로덕션 버그를 자율적으로 수정했습니다.
</Card>
</CardGroup>

## 🧠 지식 및 메모리

<CardGroup cols={2}>
  <Card title="xuezh 중국어 학습" icon="language" href="https://github.com/joshp123/xuezh">
    **@joshp123** • `learning` `voice` `skill`

OpenClaw를 통해 발음 피드백과 학습 흐름을 제공하는 중국어 학습 엔진입니다.

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="xuezh 발음 피드백" />
  </Card>

  <Card title="WhatsApp 메모리 보관소" icon="vault">
    **Community** • `memory` `transcription` `indexing`

전체 WhatsApp 내보내기 파일을 수집하고, 1천 개가 넘는 음성 메모를 전사하고, git 로그와 교차 확인한 뒤, 링크된 마크다운 보고서를 출력합니다.
</Card>

  <Card title="Karakeep 시맨틱 검색" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
    **@jamesbrooksco** • `search` `vector` `bookmarks`

Qdrant + OpenAI/Ollama 임베딩을 사용해 Karakeep 북마크에 벡터 검색을 추가합니다.
</Card>

  <Card title="Inside-Out-2 메모리" icon="brain">
    **Community** • `memory` `beliefs` `self-model`

세션 파일을 기억 → 신념 → 진화하는 self model로 전환하는 별도의 memory manager입니다.
</Card>
</CardGroup>

## 🎙️ 음성 및 전화

<CardGroup cols={2}>
  <Card title="Clawdia 전화 브리지" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
    **@alejandroOPI** • `voice` `vapi` `bridge`

Vapi 음성 비서 ↔ OpenClaw HTTP 브리지. 에이전트와 거의 실시간으로 전화 통화를 할 수 있습니다.
</Card>

  <Card title="OpenRouter 전사" icon="microphone" href="https://clawhub.com/obviyus/openrouter-transcribe">
    **@obviyus** • `transcription` `multilingual` `skill`

OpenRouter(Gemini 등)를 통한 다국어 오디오 전사입니다. ClawHub에서 이용할 수 있습니다.
</Card>
</CardGroup>

## 🏗️ 인프라 및 배포

<CardGroup cols={2}>
  <Card title="Home Assistant 애드온" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
    **@ngutman** • `homeassistant` `docker` `raspberry-pi`

SSH 터널 지원과 지속 상태를 갖춘 OpenClaw Gateway를 Home Assistant OS에서 실행합니다.
</Card>

  <Card title="Home Assistant 스킬" icon="toggle-on" href="https://clawhub.com/skills/homeassistant">
    **ClawHub** • `homeassistant` `skill` `automation`

자연어로 Home Assistant 기기를 제어하고 자동화합니다.
</Card>

  <Card title="Nix 패키징" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
    **@openclaw** • `nix` `packaging` `deployment`

재현 가능한 배포를 위한 배터리 포함형 nix 기반 OpenClaw 구성입니다.
</Card>

  <Card title="CalDAV 캘린더" icon="calendar" href="https://clawhub.com/skills/caldav-calendar">
    **ClawHub** • `calendar` `caldav` `skill`

khal/vdirsyncer를 사용하는 캘린더 스킬입니다. 자체 호스팅 캘린더 통합에 적합합니다.
</Card>
</CardGroup>

## 🏠 홈 및 하드웨어

<CardGroup cols={2}>
  <Card title="GoHome 자동화" icon="house-signal" href="https://github.com/joshp123/gohome">
    **@joshp123** • `home` `nix` `grafana`

OpenClaw를 인터페이스로 삼은 Nix 네이티브 홈 자동화이며, 보기 좋은 Grafana 대시보드도 함께 제공합니다.

  <img src="/assets/showcase/gohome-grafana.png" alt="GoHome Grafana 대시보드" />
  </Card>

  <Card title="Roborock 로봇 청소기" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
    **@joshp123** • `vacuum` `iot` `plugin`

자연스러운 대화를 통해 Roborock 로봇 청소기를 제어할 수 있습니다.

  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Roborock 상태" />
  </Card>
</CardGroup>

## 🌟 커뮤니티 프로젝트

<CardGroup cols={2}>
  <Card title="StarSwap 마켓플레이스" icon="star" href="https://star-swap.com/">
    **Community** • `marketplace` `astronomy` `webapp`

천문 장비 전체를 다루는 마켓플레이스입니다. OpenClaw 생태계와 함께 또는 그 주변에서 구축되었습니다.
</Card>
</CardGroup>

---

## 프로젝트 제출하기

공유할 것이 있나요? 기꺼이 소개하겠습니다.

<Steps>
  <Step title="공유하기">
    [Discord의 #showcase](https://discord.gg/clawd)에 올리거나 [X에서 @openclaw를 언급](https://x.com/openclaw)해 주세요
  </Step>
  <Step title="세부 정보 포함하기">
    무엇을 하는 프로젝트인지 설명하고, repo/demo 링크를 남기고, 가능하면 스크린샷도 공유해 주세요
  </Step>
  <Step title="소개되기">
    눈에 띄는 프로젝트는 이 페이지에 추가하겠습니다
  </Step>
</Steps>
