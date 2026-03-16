---
summary: "OpenClaw의 온보딩 옵션과 흐름 개요"
read_when:
  - 온보딩 경로를 선택할 때
  - 새 환경을 설정할 때
title: "온보딩 개요"
sidebarTitle: "온보딩 개요"
description: "Gateway 실행 위치와 공급자 구성 방식에 따라 선택할 수 있는 OpenClaw 온보딩 경로를 안내합니다."
x-i18n:
  source_path: "start/onboarding-overview.md"
---

# 온보딩 개요

OpenClaw는 Gateway가 실행되는 위치와 공급자 구성 방식에 따라 여러 온보딩 경로를 지원합니다.

## 온보딩 경로 선택

- **CLI 마법사**: macOS, Linux, Windows(WSL2 경유)용입니다.
- **macOS 앱**: Apple silicon 또는 Intel Mac에서 첫 실행을 단계별로 안내합니다.

## CLI 온보딩 마법사

터미널에서 다음 명령을 실행하세요.

```bash
openclaw onboard
```

Gateway, 워크스페이스, 채널, 스킬을 세밀하게 제어하고 싶다면 CLI 마법사를 사용하세요. 관련 문서:

- [온보딩 마법사 (CLI)](/start/wizard)
- [`openclaw onboard` 명령](/cli/onboard)

## macOS 앱 온보딩

macOS에서 완전한 안내형 설정을 원하면 OpenClaw 앱을 사용하세요. 관련 문서:

- [온보딩 (macOS 앱)](/start/onboarding)

## Custom Provider

목록에 없는 엔드포인트가 필요하거나, 표준 OpenAI 또는 Anthropic API를 제공하는 호스팅 공급자를 연결해야 한다면 CLI 마법사에서 **Custom Provider**를 선택하세요. 다음 정보를 입력하게 됩니다.

- OpenAI-compatible, Anthropic-compatible, 또는 **Unknown**(자동 감지) 중 선택
- Base URL과 API key 입력(공급자가 요구하는 경우)
- model ID와 선택적 alias 입력
- 여러 custom endpoint를 함께 쓰기 위한 Endpoint ID 선택

자세한 단계별 설명은 위의 CLI 온보딩 문서를 따르세요.
