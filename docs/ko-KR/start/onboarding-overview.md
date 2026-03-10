---
summary: "OpenClaw 온보딩 옵션 및 흐름 개요"
read_when:
  - 온보딩 경로 선택
  - 새 환경 설정
title: "온보딩 개요"
sidebarTitle: "온보딩 개요"
x-i18n:
  source_path: "start/onboarding-overview.md"
  source_hash: "64540138b717f4a4c1201868220d755a21b16fa330c558c33beb426cfa4504d0"
  provider: "anthropic"
  model: "claude-opus-4-6"
  workflow: 1
  generated_at: "2026-03-10T08:16:46.486Z"
---


# 온보딩 개요

OpenClaw는 Gateway가 실행되는 위치와 프로바이더 구성 방식에 따라 여러 온보딩 경로를 지원합니다.

## 온보딩 경로 선택

- macOS, Linux 및 Windows(WSL2 경유)용 **CLI 마법사**.
- Apple silicon 또는 Intel Mac에서 안내식 첫 실행을 위한 **macOS 앱**.

## CLI 온보딩 마법사

터미널에서 마법사를 실행하세요:

```bash
openclaw onboard
```

Gateway, 워크스페이스, 채널 및 Skills를 완전히 제어하려면 CLI 마법사를 사용하세요. 문서:

- [온보딩 마법사 (CLI)](/start/wizard)
- [`openclaw onboard` 명령](/cli/onboard)

## macOS 앱 온보딩

macOS에서 완전히 안내되는 설정을 원하면 OpenClaw 앱을 사용하세요. 문서:

- [온보딩 (macOS App)](/start/onboarding)

## 커스텀 프로바이더

표준 OpenAI 또는 Anthropic API를 제공하는 호스팅 프로바이더를 포함하여 목록에 없는 엔드포인트가 필요한 경우, CLI 마법사에서 **Custom Provider**를 선택하세요. 다음 사항을 입력하라는 메시지가 표시됩니다:

- OpenAI 호환, Anthropic 호환 또는 **Unknown**(자동 감지) 선택.
- 기본 URL 및 API 키 입력(프로바이더에서 요구하는 경우).
- 모델 ID 및 선택적 별칭 제공.
- 여러 커스텀 엔드포인트가 공존할 수 있도록 Endpoint ID 선택.

자세한 단계는 위의 CLI 온보딩 문서를 참조하세요.
