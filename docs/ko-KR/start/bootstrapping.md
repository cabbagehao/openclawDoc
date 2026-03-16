---
summary: "워크스페이스와 신원 파일을 초기화하는 에이전트 부트스트래핑 절차"
read_when:
  - 에이전트 첫 실행 시 어떤 일이 일어나는지 이해하고 싶을 때
  - 부트스트래핑 파일이 어디에 저장되는지 설명해야 할 때
  - 온보딩 신원 설정을 디버깅할 때
title: "에이전트 부트스트래핑"
sidebarTitle: "부트스트래핑"
description: "워크스페이스를 초기화하고 신원 정보를 수집하는 첫 실행 부트스트래핑 절차를 설명합니다."
x-i18n:
  source_path: "start/bootstrapping.md"
---

# 에이전트 부트스트래핑

부트스트래핑은 에이전트 워크스페이스를 준비하고 신원 정보를 수집하는 **첫 실행** 절차입니다. 온보딩이 끝난 뒤 에이전트가 처음 시작될 때 실행됩니다.

## 부트스트래핑에서 하는 일

에이전트가 처음 실행되면 OpenClaw는 워크스페이스(기본값 `~/.openclaw/workspace`)를 부트스트랩합니다.

- `AGENTS.md`, `BOOTSTRAP.md`, `IDENTITY.md`, `USER.md`를 시드합니다.
- 짧은 Q&A 절차를 한 번에 한 질문씩 진행합니다.
- 신원 정보와 선호도를 `IDENTITY.md`, `USER.md`, `SOUL.md`에 기록합니다.
- 완료되면 `BOOTSTRAP.md`를 삭제해 한 번만 실행되도록 합니다.

## 실행 위치

부트스트래핑은 항상 **gateway host**에서 실행됩니다. macOS 앱이 원격 Gateway에 연결되어 있다면, 워크스페이스와 부트스트래핑 파일은 그 원격 머신에 저장됩니다.

<Note>
Gateway가 다른 머신에서 실행 중이면 워크스페이스 파일은 gateway host에서 수정해야 합니다(예: `user@gateway-host:~/.openclaw/workspace`).
</Note>

## 관련 문서

- macOS 앱 온보딩: [온보딩](/start/onboarding)
- 워크스페이스 구조: [에이전트 워크스페이스](/concepts/agent-workspace)
