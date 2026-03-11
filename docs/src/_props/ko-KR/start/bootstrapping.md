---
summary: "워크스페이스 초기화 및 신원 정보 파일을 생성하는 에이전트 부트스트래핑 과정 안내"
read_when:
  - 에이전트 최초 실행 시 수행되는 작업을 이해하고자 할 때
  - 부트스트래핑 관련 파일의 저장 위치를 확인해야 할 때
  - 온보딩 과정의 신원 설정 문제를 디버깅할 때
title: "에이전트 부트스트래핑"
sidebarTitle: "부트스트래핑"
x-i18n:
  source_path: "start/bootstrapping.md"
---

# 에이전트 부트스트래핑(Bootstrapping)

부트스트래핑은 에이전트 워크스페이스를 준비하고 필요한 신원 정보를 수집하는 **최초 실행** 절차임. 온보딩 완료 후 에이전트가 처음 시작될 때 자동으로 진행됨.

## 주요 수행 작업

에이전트가 처음 실행되면 OpenClaw는 지정된 워크스페이스 경로(기본값: `~/.openclaw/workspace`)를 초기화함:

* **기본 파일 생성**: `AGENTS.md`, `BOOTSTRAP.md`, `IDENTITY.md`, `USER.md` 파일을 생성(Seeding)함.
* **Q\&A 진행**: 사용자에게 필요한 정보를 묻는 짧은 인터뷰 과정을 거침.
* **정보 기록**: 수집된 신원 정보 및 사용자 선호도를 `IDENTITY.md`, `USER.md`, `SOUL.md` 파일에 기록함.
* **파일 정리**: 모든 과정이 완료되면 `BOOTSTRAP.md` 파일을 삭제하여 중복 실행되지 않도록 함.

## 실행 환경 및 위치

부트스트래핑은 항상 **Gateway가 설치된 호스트**에서 실행됨. 예를 들어, macOS 앱을 통해 원격 Gateway 서버에 연결한 경우, 워크스페이스 및 부트스트래핑 관련 파일은 로컬 PC가 아닌 원격 서버에 저장됨.

<Note>
  Gateway가 외부 서버에서 실행 중인 경우, 워크스페이스 파일 편집은 해당 서버에 접속하여 수행해야 함 (예: `ssh user@gateway-host` 접속 후 `~/.openclaw/workspace` 편집).
</Note>

## 관련 문서

* **macOS 앱 온보딩 가이드**: [온보딩 절차 안내](/start/onboarding)
* **워크스페이스 구조 상세**: [에이전트 워크스페이스 이해하기](/concepts/agent-workspace)
