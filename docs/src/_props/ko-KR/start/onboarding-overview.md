---
summary: "OpenClaw의 다양한 온보딩 옵션 및 절차 개요"
read_when:
  - 본인에게 적합한 온보딩 경로를 선택하고자 할 때
  - 새로운 환경에 OpenClaw를 구축할 때
title: "온보딩 개요"
sidebarTitle: "온보딩 개요"
x-i18n:
  source_path: "start/onboarding-overview.md"
---

# 온보딩 개요

OpenClaw는 Gateway 실행 환경 및 사용자의 선호하는 설정 방식에 따라 다양한 온보딩 경로를 제공함.

## 온보딩 경로 선택

* **CLI 마법사 (CLI Wizard)**: macOS, Linux, Windows (WSL2 환경) 사용자에게 적합함.
* **macOS 앱**: Apple Silicon 및 Intel 기반 Mac 사용자를 위한 GUI 기반의 안내형 절차를 제공함.

## CLI 온보딩 마법사

터미널에서 다음 명령어를 실행하여 설정을 시작함:

```bash
openclaw onboard
```

Gateway 인스턴스, 워크스페이스, 통신 채널 및 에이전트 스킬을 세밀하게 제어하고 싶은 경우 CLI 마법사 사용을 권장함. 관련 문서:

* [온보딩 마법사 가이드 (CLI)](/start/wizard)
* [`openclaw onboard` 명령어 레퍼런스](/cli/onboard)

## macOS 앱 온보딩

macOS 환경에서 단계별 안내에 따라 손쉽게 설정을 마치고 싶은 경우 macOS 전용 앱을 사용함. 관련 문서:

* [온보딩 가이드 (macOS 앱)](/start/onboarding)

## 커스텀 공급자 (Custom Provider) 설정

목록에 없는 특정 엔드포인트나 표준 OpenAI/Anthropic API 규격을 따르는 타사 호스팅 서비스를 연동하려는 경우, CLI 마법사에서 **Custom Provider**를 선택함. 설정 과정에서 다음 정보를 입력함:

* **API 호환성 선택**: OpenAI 호환, Anthropic 호환 또는 **Unknown** (자동 감지) 중 선택.
* **연동 정보 입력**: 베이스 URL(Base URL) 및 API 키 (필요한 경우).
* **모델 정보**: 모델 ID 및 선택적 별칭(Alias) 지정.
* **엔드포인트 ID**: 여러 개의 커스텀 엔드포인트를 구분하기 위한 고유 ID 지정.

상세한 설정 단계는 위에 언급된 CLI 온보딩 문서를 참조함.
