---
summary: "OpenClaw 온보딩 옵션과 흐름 개요"
read_when:
  - 온보딩 경로를 선택할 때
  - 새 환경을 설정할 때
title: "온보딩 개요"
sidebarTitle: "온보딩 개요"
x-i18n:
  source_path: "start/onboarding-overview.md"
---

# 온보딩 개요

OpenClaw는 Gateway가 어디에서 실행되는지, 그리고 제공업체를 어떤 방식으로 구성하고 싶은지에 따라 여러 온보딩 경로를 지원합니다.

## 온보딩 경로 선택하기

- **CLI 마법사**: macOS, Linux, Windows(WSL2 경유)
- **macOS 앱**: Apple Silicon 또는 Intel Mac에서의 안내형 첫 실행

## CLI 온보딩 마법사

터미널에서 마법사를 실행합니다.

```bash
openclaw onboard
```

Gateway, 워크스페이스, 채널, 스킬을 세밀하게 제어하고 싶다면 CLI 마법사를 사용하세요. 관련 문서:

- [온보딩 마법사(CLI)](/start/wizard)
- [`openclaw onboard` 명령](/cli/onboard)

## macOS 앱 온보딩

macOS에서 완전한 안내형 설정을 원한다면 OpenClaw 앱을 사용하세요. 관련 문서:

- [온보딩(macOS 앱)](/start/onboarding)

## Custom Provider

목록에 없는 엔드포인트가 필요하다면, 표준 OpenAI 또는 Anthropic API를 노출하는 호스팅 제공업체를 포함해 CLI 마법사에서 **Custom Provider**를 선택하세요. 그러면 다음 항목을 입력하게 됩니다.

- OpenAI 호환, Anthropic 호환, 또는 **Unknown**(자동 감지) 선택
- base URL 및 API 키 입력(제공업체가 요구하는 경우)
- 모델 ID와 선택적 alias 입력
- 여러 사용자 정의 엔드포인트가 공존할 수 있도록 Endpoint ID 선택

자세한 단계는 위의 CLI 온보딩 문서를 따라가세요.
