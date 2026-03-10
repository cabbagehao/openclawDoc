---
summary: "에이전트 부트스트래핑 의식은 작업 공간과 신원 파일을 시드합니다"
read_when:
  - 첫 번째 에이전트 실행 시 발생하는 일 이해하기
  - 부트스트래핑 파일 위치 설명하기
  - 온보딩 신원 설정 디버깅하기
title: "에이전트 부트스트래핑"
sidebarTitle: "부트스트래핑"
x-i18n:
  source_path: "start/bootstrapping.md"
  source_hash: "4a08b5102f25c6c4bcdbbdd44384252a9e537b245a7b070c4961a72b4c6c6601"
  provider: "anthropic"
  model: "claude-opus-4-6"
  workflow: 1
  generated_at: "2026-03-10T08:14:42.829Z"
---


# 에이전트 부트스트래핑

부트스트래핑은 에이전트 작업 공간을 준비하고 신원 세부 정보를 수집하는 **첫 실행** 의식입니다. 온보딩 후 에이전트가 처음 시작될 때 발생합니다.

## 부트스트래핑이 수행하는 작업

첫 번째 에이전트 실행 시 OpenClaw는 작업 공간(기본값 `~/.openclaw/workspace`)을 부트스트랩합니다:

- `AGENTS.md`, `BOOTSTRAP.md`, `IDENTITY.md`, `USER.md`를 시드합니다.
- 짧은 Q&A 의식을 실행합니다(한 번에 하나의 질문).
- 신원 + 선호도를 `IDENTITY.md`, `USER.md`, `SOUL.md`에 작성합니다.
- 완료되면 `BOOTSTRAP.md`를 제거하여 한 번만 실행되도록 합니다.

## 실행 위치

부트스트래핑은 항상 **게이트웨이 호스트**에서 실행됩니다. macOS 앱이 원격 Gateway에 연결하는 경우 작업 공간과 부트스트래핑 파일은 해당 원격 머신에 있습니다.

<Note>
Gateway가 다른 머신에서 실행되는 경우 게이트웨이 호스트에서 작업 공간 파일을 편집하세요(예: `user@gateway-host:~/.openclaw/workspace`).
</Note>

## 관련 문서

- macOS 앱 온보딩: [온보딩](/start/onboarding)
- 작업 공간 레이아웃: [에이전트 작업 공간](/concepts/agent-workspace)
