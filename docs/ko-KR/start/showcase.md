---
title: "쇼케이스"
description: "커뮤니티가 OpenClaw로 만든 실제 프로젝트, 자동화, 배포 사례를 모아 보여 주는 페이지입니다."
summary: "커뮤니티가 만든 OpenClaw 기반 프로젝트와 실제 활용 사례 모음"
read_when:
  - 실제 OpenClaw 활용 사례를 보고 싶을 때
  - 커뮤니티 프로젝트 하이라이트를 업데이트할 때
x-i18n:
  source_path: "start/showcase.md"
---

# 쇼케이스

커뮤니티에서 만든 실제 프로젝트 모음입니다. 사람들이 OpenClaw로 무엇을 만들고 있는지 확인해 보세요.

<Info>
**여기에 소개되고 싶다면** [Discord의 #showcase](https://discord.gg/clawd)에 프로젝트를 공유하거나 [X에서 @openclaw를 태그](https://x.com/openclaw)해 주세요.
</Info>

## 🎥 OpenClaw 실전 영상

VelvetShark가 만든 전체 설정 walkthrough(28분)입니다.

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

<Card title="PR Review → Telegram 피드백" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode가 변경을 끝내고 PR을 열면, OpenClaw가 diff를 리뷰한 뒤 "minor suggestions"와 명확한 merge verdict를 Telegram으로 돌려줍니다. 먼저 고칠 critical fix도 함께 알려 줍니다.

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="OpenClaw PR review feedback delivered in Telegram" />
</Card>

<Card title="몇 분 만에 만든 와인 셀러 스킬" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

"Robby"(@openclaw)에게 로컬 와인 셀러 스킬을 만들어 달라고 요청했습니다. 샘플 CSV export와 저장 위치를 묻고, 예시 기준 962병 데이터를 바탕으로 빠르게 스킬을 만들고 테스트했습니다.

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw building a local wine cellar skill from CSV" />
</Card>

<Card title="Tesco 장보기 오토파일럿" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

주간 식단 계획부터 정기 품목 반영, 배송 슬롯 예약, 주문 확정까지 전부 자동화했습니다. API 없이 브라우저 제어만으로 처리합니다.

  <img src="/assets/showcase/tesco-shop.jpg" alt="Tesco shop automation via chat" />
</Card>

<Card title="SNAG Screenshot-to-Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

화면 일부를 hotkey로 잡으면 Gemini vision이 분석해 즉시 Markdown을 clipboard에 넣어 줍니다.

  <img src="/assets/showcase/snag.png" alt="SNAG screenshot-to-markdown tool" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

Agents, Claude, Codex, OpenClaw 사이에서 skills와 commands를 관리하는 데스크톱 앱입니다.

  <img src="/assets/showcase/agents-ui.jpg" alt="Agents UI app" />
</Card>

<Card title="Telegram Voice Notes (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Community** • `voice` `tts` `telegram`

papla.media TTS를 감싸서 Telegram 음성 노트로 결과를 보내 줍니다. 자동 재생 때문에 성가시지 않게 설계됐습니다.

  <img src="/assets/showcase/papla-tts.jpg" alt="Telegram voice note output from TTS" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.com/odrobnik/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

Homebrew로 설치해 로컬 OpenAI Codex session을 목록화하고, 확인하고, 감시할 수 있는 helper입니다. CLI와 VS Code 양쪽을 지원합니다.

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor on ClawHub" />
</Card>

<Card title="Bambu 3D Printer Control" icon="print" href="https://clawhub.com/tobiasbischoff/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

BambuLab 프린터의 status, job, camera, AMS, calibration 등을 제어하고 문제를 진단할 수 있습니다.

  <img src="/assets/showcase/bambu-cli.png" alt="Bambu CLI skill on ClawHub" />
</Card>

<Card title="Vienna Transport (Wiener Linien)" icon="train" href="https://clawhub.com/hjanuschka/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

비엔나 대중교통의 실시간 출발 정보, 운행 장애, 엘리베이터 상태, 경로 안내를 제공합니다.

  <img src="/assets/showcase/wienerlinien.png" alt="Wiener Linien skill on ClawHub" />
</Card>

<Card title="ParentPay School Meals" icon="utensils" href="#">
  **@George5562** • `automation` `browser` `parenting`

ParentPay를 통한 영국 학교 급식 예약을 자동화했습니다. 표 셀 클릭을 안정적으로 처리하려고 mouse coordinate를 사용합니다.
</Card>

<Card title="R2 Upload (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.com/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Cloudflare R2/S3에 업로드하고 보안 presigned download link를 생성합니다. 원격 OpenClaw 인스턴스와 특히 잘 맞습니다.
</Card>

<Card title="iOS App via Telegram" icon="mobile" href="#">
  **@coard** • `ios` `xcode` `testflight`

지도와 음성 녹음을 갖춘 완전한 iOS 앱을 Telegram 채팅만으로 만들고 TestFlight까지 배포했습니다.

  <img src="/assets/showcase/ios-testflight.jpg" alt="iOS app on TestFlight" />
</Card>

<Card title="Oura Ring Health Assistant" icon="heart-pulse" href="#">
  **@AS** • `health` `oura` `calendar`

Oura ring 데이터와 캘린더, 약속, 운동 일정을 결합한 개인 건강 AI 비서입니다.

  <img src="/assets/showcase/oura-health.png" alt="Oura ring health assistant" />
</Card>

<Card title="Kev's Dream Team (14+ Agents)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration` `architecture` `manifesto`

하나의 gateway 아래에 14개 이상의 agent를 두고, Opus 4.5 orchestrator가 Codex worker로 위임하는 구성입니다. Dream Team 구성, 모델 선택, sandboxing, webhooks, heartbeats, delegation flow를 정리한 [technical write-up](https://github.com/adam91holt/orchestrated-ai-articles)가 있습니다. Agent sandboxing용 [Clawdspace](https://github.com/adam91holt/clawdspace)와 [blog post](https://adams-ai-journey.ghost.io/2026-the-year-of-the-orchestrator/)도 함께 공개했습니다.
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli` `issues`

agentic workflow(Claude Code, OpenClaw)와 통합되는 Linear CLI입니다. 터미널에서 issue, project, workflow를 관리할 수 있으며, 첫 번째 외부 PR도 이미 merge됐습니다.
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli` `automation`

Beeper Desktop의 로컬 MCP API를 사용해 메시지를 읽고, 보내고, archive합니다. 에이전트가 iMessage, WhatsApp 등 여러 채팅을 한 곳에서 관리할 수 있게 합니다.
</Card>

</CardGroup>

## 🤖 자동화 및 워크플로

<CardGroup cols={2}>

<Card title="Winix Air Purifier Control" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code가 공기청정기 제어 방식을 찾아내고 검증한 뒤, OpenClaw가 방의 공기 질을 관리합니다.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="Winix air purifier control via OpenClaw" />
</Card>

<Card title="Pretty Sky Camera Shots" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill` `images`

지붕 카메라를 트리거로 삼아 하늘이 예뻐 보일 때마다 사진을 찍도록 OpenClaw에 요청했습니다. 스킬을 설계하고 실제 촬영까지 수행했습니다.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="Roof camera sky snapshot captured by OpenClaw" />
</Card>

<Card title="Visual Morning Briefing Scene" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `images` `telegram`

예약 프롬프트가 매일 아침 날씨, 할 일, 날짜, 좋아하는 게시물이나 인용문을 담은 하나의 "scene" 이미지를 OpenClaw persona를 통해 생성합니다.
</Card>

<Card title="Padel Court Booking" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`

Playtomic 예약 가능 여부를 확인하고 즉시 예약까지 수행하는 CLI입니다. 빈 코트를 놓치지 않게 해 줍니다.

  <img src="/assets/showcase/padel-screenshot.jpg" alt="padel-cli screenshot" />
</Card>

<Card title="Accounting Intake" icon="file-invoice-dollar">
  **Community** • `automation` `email` `pdf`

이메일에서 PDF를 모으고 세무사에게 보낼 문서를 준비합니다. 월간 회계 작업을 자동화합니다.
</Card>

<Card title="Couch Potato Dev Mode" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `website` `migration` `astro`

Netflix를 보면서 Telegram만으로 개인 사이트 전체를 다시 만들었습니다. Notion에서 Astro로 옮기고, 게시물 18개를 이관하고, DNS를 Cloudflare로 옮겼습니다. 노트북은 열지도 않았습니다.
</Card>

<Card title="Job Search Agent" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

채용 공고를 검색하고 CV 키워드와 대조해 관련 기회를 링크와 함께 돌려줍니다. JSearch API로 30분 만에 만들었습니다.
</Card>

<Card title="Jira Skill Builder" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `automation` `jira` `skill` `devtools`

OpenClaw를 Jira에 연결한 다음, 즉석에서 새 스킬을 생성했습니다. 당시에는 ClawHub에 존재하기도 전이었습니다.
</Card>

<Card title="Todoist Skill via Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `automation` `todoist` `skill` `telegram`

Todoist 작업을 자동화하고, OpenClaw가 Telegram 채팅 안에서 직접 스킬을 생성하도록 했습니다.
</Card>

<Card title="TradingView Analysis" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

브라우저 자동화로 TradingView에 로그인해 차트를 캡처하고 필요할 때 기술적 분석을 수행합니다. API는 쓰지 않고 브라우저 제어만 사용합니다.
</Card>

<Card title="Slack Auto-Support" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

회사 Slack 채널을 감시하다가 도움이 되는 답변을 보내고, 알림을 Telegram으로 전달합니다. 심지어 요청받지 않았는데도 배포된 앱의 production bug를 스스로 고친 적이 있습니다.
</Card>

</CardGroup>

## 🧠 지식 및 기억

<CardGroup cols={2}>

<Card title="xuezh Chinese Learning" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

OpenClaw를 활용해 발음 피드백과 학습 흐름을 제공하는 중국어 학습 엔진입니다.

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="xuezh pronunciation feedback" />
</Card>

<Card title="WhatsApp Memory Vault" icon="vault">
  **Community** • `memory` `transcription` `indexing`

WhatsApp 전체 export를 가져와 1천 개가 넘는 voice note를 전사하고, git log와 교차 검증해 링크된 markdown report를 생성합니다.
</Card>

<Card title="Karakeep Semantic Search" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

Qdrant와 OpenAI/Ollama embedding을 사용해 Karakeep bookmark에 vector search를 추가합니다.
</Card>

<Card title="Inside-Out-2 Memory" icon="brain">
  **Community** • `memory` `beliefs` `self-model`

session file을 기억으로, 기억을 belief로, belief를 진화하는 self model로 바꾸는 별도 memory manager입니다.
</Card>

</CardGroup>

## 🎙️ 음성 및 전화

<CardGroup cols={2}>

<Card title="Clawdia Phone Bridge" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

Vapi voice assistant와 OpenClaw HTTP bridge를 연결해 agent와 거의 실시간으로 전화 통화를 할 수 있게 합니다.
</Card>

<Card title="OpenRouter Transcription" icon="microphone" href="https://clawhub.com/obviyus/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

OpenRouter(Gemini 등)를 통해 다국어 오디오를 전사하는 스킬입니다. ClawHub에서 사용할 수 있습니다.
</Card>

</CardGroup>

## 🏗️ 인프라 및 배포

<CardGroup cols={2}>

<Card title="Home Assistant Add-on" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`

SSH tunnel 지원과 persistent state를 갖춘 OpenClaw gateway를 Home Assistant OS 위에서 실행합니다.
</Card>

<Card title="Home Assistant Skill" icon="toggle-on" href="https://clawhub.com/skills/homeassistant">
  **ClawHub** • `homeassistant` `skill` `automation`

자연어로 Home Assistant device를 제어하고 자동화합니다.
</Card>

<Card title="Nix Packaging" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`

재현 가능한 배포를 위해 batteries-included 방식으로 nix화한 OpenClaw 설정입니다.
</Card>

<Card title="CalDAV Calendar" icon="calendar" href="https://clawhub.com/skills/caldav-calendar">
  **ClawHub** • `calendar` `caldav` `skill`

khal/vdirsyncer를 사용하는 self-hosted calendar 통합 스킬입니다.
</Card>

</CardGroup>

## 🏠 홈 및 하드웨어

<CardGroup cols={2}>

<Card title="GoHome Automation" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`

OpenClaw를 인터페이스로 삼고 아름다운 Grafana 대시보드를 더한 Nix-native 홈 자동화 프로젝트입니다.

  <img src="/assets/showcase/gohome-grafana.png" alt="GoHome Grafana dashboard" />
</Card>

<Card title="Roborock Vacuum" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`

자연스러운 대화를 통해 Roborock 로봇 청소기를 제어합니다.

  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Roborock status" />
</Card>

</CardGroup>

## 🌟 커뮤니티 프로젝트

<CardGroup cols={2}>

<Card title="StarSwap Marketplace" icon="star" href="https://star-swap.com/">
  **Community** • `marketplace` `astronomy` `webapp`

천체 관측 장비를 위한 완전한 마켓플레이스입니다. OpenClaw 생태계와 함께 또는 그 주변에서 만들어졌습니다.
</Card>

</CardGroup>

---

## 프로젝트 제출

공유할 것이 있다면 소개해 주세요.

<Steps>
  <Step title="공유하기">
    [Discord의 #showcase](https://discord.gg/clawd)에 올리거나 [X에서 @openclaw 멘션](https://x.com/openclaw)해 주세요.
  </Step>
  <Step title="세부 정보 포함">
    무엇을 하는 프로젝트인지 설명하고, repo/demo 링크와 가능하면 screenshot도 함께 보내 주세요.
  </Step>
  <Step title="소개되기">
    눈에 띄는 프로젝트는 이 페이지에 추가합니다.
  </Step>
</Steps>
