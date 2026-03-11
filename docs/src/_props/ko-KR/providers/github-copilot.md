---
summary: "device flow를 사용해 OpenClaw에서 GitHub Copilot에 로그인하기"
read_when:
  - GitHub Copilot을 모델 제공업체로 사용하고 싶을 때
  - "`openclaw models auth login-github-copilot` 흐름이 필요할 때"
title: "GitHub Copilot"
x-i18n:
  source_path: "providers/github-copilot.md"
---

# GitHub Copilot

## What is GitHub Copilot?

GitHub Copilot은 GitHub의 AI 코딩 어시스턴트입니다. GitHub 계정과 요금제에 맞는 Copilot 모델에 접근할 수 있으며,
OpenClaw는 Copilot을 모델 제공업체로 두 가지 방식으로 사용할 수 있습니다.

## Two ways to use Copilot in OpenClaw

### 1) Built-in GitHub Copilot provider (`github-copilot`)

네이티브 device-login flow를 사용해 GitHub 토큰을 얻은 뒤, OpenClaw 실행 시 이를 Copilot API 토큰으로 교환합니다.
VS Code가 필요 없기 때문에 이것이 **기본값**이자 가장 단순한 경로입니다.

### 2) Copilot Proxy plugin (`copilot-proxy`)

**Copilot Proxy** VS Code 확장을 로컬 브리지로 사용합니다. OpenClaw는 프록시의 `/v1` 엔드포인트와 통신하며,
그쪽에서 구성한 모델 목록을 사용합니다. 이미 VS Code에서 Copilot Proxy를 쓰고 있거나 그 경로로 라우팅해야 한다면
이 방식을 선택하세요. 플러그인을 활성화하고 VS Code 확장을 계속 실행해 두어야 합니다.

GitHub Copilot을 모델 제공업체(`github-copilot`)로 사용하세요. 로그인 명령은 GitHub device flow를 실행하고,
auth profile을 저장한 뒤 해당 profile을 쓰도록 설정을 업데이트합니다.

## CLI setup

```bash
openclaw models auth login-github-copilot
```

URL 방문과 일회성 코드 입력을 안내받게 됩니다. 완료될 때까지 터미널을 닫지 마세요.

### Optional flags

```bash
openclaw models auth login-github-copilot --profile-id github-copilot:work
openclaw models auth login-github-copilot --yes
```

## Set a default model

```bash
openclaw models set github-copilot/gpt-4o
```

### Config snippet

```json5
{
  agents: { defaults: { model: { primary: "github-copilot/gpt-4o" } } },
}
```

## Notes

* 대화형 TTY가 필요하므로 터미널에서 직접 실행하세요.
* Copilot 모델 가용성은 요금제에 따라 달라집니다. 모델이 거부되면 다른 ID(예: `github-copilot/gpt-4.1`)를 시도하세요.
* 로그인은 auth profile 저장소에 GitHub 토큰을 저장하고, OpenClaw 실행 시 이를 Copilot API 토큰으로 교환합니다.
