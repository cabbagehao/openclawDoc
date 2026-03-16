---
summary: "OpenClaw의 모든 문서로 연결되는 허브"
read_when:
  - 문서 전체 지도를 보고 싶을 때
title: "문서 허브"
description: "왼쪽 내비게이션에 보이지 않는 심화 문서까지 한곳에서 찾을 수 있는 OpenClaw 문서 허브입니다."
x-i18n:
  source_path: "start/hubs.md"
---

# 문서 허브

<Note>
OpenClaw가 처음이라면 먼저 [시작하기](/start/getting-started)를 읽어보세요.
</Note>

이 허브를 사용하면 왼쪽 내비게이션에 보이지 않는 심화 가이드와 레퍼런스 문서까지 한곳에서 빠르게 찾을 수 있습니다.

## 시작하기

- [인덱스](/)
- [시작하기](/start/getting-started)
- [빠른 시작](/start/quickstart)
- [온보딩](/start/onboarding)
- [온보딩 마법사](/start/wizard)
- [설정](/start/setup)
- [로컬 Gateway 대시보드](http://127.0.0.1:18789/)
- [도움말](/help)
- [문서 디렉터리](/start/docs-directory)
- [Configuration](/gateway/configuration)
- [Configuration examples](/gateway/configuration-examples)
- [OpenClaw 어시스턴트 설정](/start/openclaw)
- [쇼케이스](/start/showcase)
- [Lore](/start/lore)

## 설치 및 업데이트

- [Docker](/install/docker)
- [Nix](/install/nix)
- [업데이트 / 롤백](/install/updating)
- [Bun 워크플로우 (실험적)](/install/bun)

## 핵심 개념

- [아키텍처](/concepts/architecture)
- [기능](/concepts/features)
- [네트워크 허브](/network)
- [에이전트 런타임](/concepts/agent)
- [에이전트 워크스페이스](/concepts/agent-workspace)
- [메모리](/concepts/memory)
- [에이전트 루프](/concepts/agent-loop)
- [스트리밍 + 청킹](/concepts/streaming)
- [멀티 에이전트 라우팅](/concepts/multi-agent)
- [컴팩션](/concepts/compaction)
- [세션](/concepts/session)
- [세션 프루닝](/concepts/session-pruning)
- [세션 도구](/concepts/session-tool)
- [Queue](/concepts/queue)
- [슬래시 명령어](/tools/slash-commands)
- [RPC adapters](/reference/rpc)
- [TypeBox 스키마](/concepts/typebox)
- [시간대 처리](/concepts/timezone)
- [프레즌스](/concepts/presence)
- [Discovery + transports](/gateway/discovery)
- [Bonjour](/gateway/bonjour)
- [채널 라우팅](/channels/channel-routing)
- [그룹](/channels/groups)
- [그룹 메시지](/channels/group-messages)
- [모델 페일오버](/concepts/model-failover)
- [OAuth](/concepts/oauth)

## 공급자 및 입력 채널

- [채팅 채널 허브](/channels)
- [모델 공급자 허브](/providers/models)
- [WhatsApp](/channels/whatsapp)
- [Telegram](/channels/telegram)
- [Slack](/channels/slack)
- [Discord](/channels/discord)
- [Mattermost](/channels/mattermost) (plugin)
- [Signal](/channels/signal)
- [BlueBubbles (iMessage)](/channels/bluebubbles)
- [iMessage (legacy)](/channels/imessage)
- [위치 파싱](/channels/location)
- [WebChat](/web/webchat)
- [Webhooks](/automation/webhook)
- [Gmail Pub/Sub 자동화](/automation/gmail-pubsub)

## Gateway + 운영

- [Gateway runbook](/gateway)
- [네트워크 모델](/gateway/network-model)
- [Gateway 페어링](/gateway/pairing)
- [Gateway 잠금](/gateway/gateway-lock)
- [백그라운드 프로세스](/gateway/background-process)
- [Health](/gateway/health)
- [Heartbeat](/gateway/heartbeat)
- [Doctor](/gateway/doctor)
- [로깅](/gateway/logging)
- [샌드박싱](/gateway/sandboxing)
- [Dashboard](/web/dashboard)
- [Control UI](/web/control-ui)
- [원격 액세스](/gateway/remote)
- [원격 Gateway README](/gateway/remote-gateway-readme)
- [Tailscale](/gateway/tailscale)
- [보안](/gateway/security)
- [문제 해결](/gateway/troubleshooting)

## 도구 + 자동화

- [도구 표면](/tools)
- [OpenProse](/prose)
- [CLI reference](/cli)
- [Exec tool](/tools/exec)
- [PDF tool](/tools/pdf)
- [Elevated mode](/tools/elevated)
- [Cron jobs](/automation/cron-jobs)
- [Cron vs Heartbeat](/automation/cron-vs-heartbeat)
- [Thinking + verbose](/tools/thinking)
- [모델](/concepts/models)
- [Sub-agents](/tools/subagents)
- [Agent send CLI](/tools/agent-send)
- [Terminal UI](/web/tui)
- [Browser control](/tools/browser)
- [Browser (Linux 문제 해결)](/tools/browser-linux-troubleshooting)
- [Polls](/automation/poll)

## 노드, 미디어, 음성

- [노드 개요](/nodes)
- [카메라](/nodes/camera)
- [이미지](/nodes/images)
- [오디오](/nodes/audio)
- [위치 명령](/nodes/location-command)
- [Voice wake](/nodes/voicewake)
- [Talk mode](/nodes/talk)

## 플랫폼

- [플랫폼 개요](/platforms)
- [macOS](/platforms/macos)
- [iOS](/platforms/ios)
- [Android](/platforms/android)
- [Windows (WSL2)](/platforms/windows)
- [Linux](/platforms/linux)
- [웹 인터페이스](/web)

## macOS 컴패니언 앱 (고급)

- [macOS 개발 설정](/platforms/mac/dev-setup)
- [macOS 메뉴 막대](/platforms/mac/menu-bar)
- [macOS 음성 깨우기](/platforms/mac/voicewake)
- [macOS 음성 오버레이](/platforms/mac/voice-overlay)
- [macOS WebChat](/platforms/mac/webchat)
- [macOS Canvas 연동](/platforms/mac/canvas)
- [macOS child process](/platforms/mac/child-process)
- [macOS health](/platforms/mac/health)
- [macOS icon](/platforms/mac/icon)
- [macOS logging](/platforms/mac/logging)
- [macOS permissions](/platforms/mac/permissions)
- [macOS remote](/platforms/mac/remote)
- [macOS signing](/platforms/mac/signing)
- [macOS release](/platforms/mac/release)
- [macOS 전용 Gateway (launchd)](/platforms/mac/bundled-gateway)
- [macOS XPC 통신](/platforms/mac/xpc)
- [macOS skills](/platforms/mac/skills)
- [macOS Peekaboo](/platforms/mac/peekaboo)

## 워크스페이스 + 템플릿

- [Skills](/tools/skills)
- [ClawHub](/tools/clawhub)
- [Skills config](/tools/skills-config)
- [기본 AGENTS 설정](/reference/AGENTS.default)
- [Templates: AGENTS](/reference/templates/AGENTS)
- [Templates: BOOTSTRAP](/reference/templates/BOOTSTRAP)
- [Templates: HEARTBEAT](/reference/templates/HEARTBEAT)
- [Templates: IDENTITY](/reference/templates/IDENTITY)
- [Templates: SOUL](/reference/templates/SOUL)
- [Templates: TOOLS](/reference/templates/TOOLS)
- [Templates: USER](/reference/templates/USER)

## 실험 (탐색용)

- [온보딩 config protocol](/experiments/onboarding-config-protocol)
- [연구: 메모리](/experiments/research/memory)
- [모델 config 탐색](/experiments/proposals/model-config)

## 프로젝트

- [Credits](/reference/credits)

## 테스트 및 릴리스

- [Testing](/reference/test)
- [릴리스 체크리스트](/reference/RELEASING)
- [지원 기기 모델 목록](/reference/device-models)
