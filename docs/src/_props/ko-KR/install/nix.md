---
summary: "Nix로 OpenClaw를 선언적으로 설치하기"
read_when:
  - 재현 가능하고 롤백 가능한 설치를 원합니다
  - 이미 Nix/NixOS/Home Manager를 사용하고 있습니다
  - 모든 것을 고정하고 선언적으로 관리하고 싶습니다
title: "Nix"
---

# Nix 설치

Nix로 OpenClaw를 실행하는 권장 방법은 \*\*[nix-openclaw](https://github.com/openclaw/nix-openclaw)\*\*를 사용하는 것입니다. 배터리 포함형 Home Manager 모듈입니다.

## 빠른 시작

다음 내용을 AI 에이전트(Claude, Cursor 등)에 붙여 넣으세요:

```text
I want to set up nix-openclaw on my Mac.
Repository: github:openclaw/nix-openclaw

What I need you to do:
1. Check if Determinate Nix is installed (if not, install it)
2. Create a local flake at ~/code/openclaw-local using templates/agent-first/flake.nix
3. Help me create a Telegram bot (@BotFather) and get my chat ID (@userinfobot)
4. Set up secrets (bot token, model provider API key) - plain files at ~/.secrets/ is fine
5. Fill in the template placeholders and run home-manager switch
6. Verify: launchd running, bot responds to messages

Reference the nix-openclaw README for module options.
```

> **📦 전체 가이드: [github.com/openclaw/nix-openclaw](https://github.com/openclaw/nix-openclaw)**
>
> Nix 설치의 진실의 원천은 nix-openclaw 저장소입니다. 이 페이지는 빠른 개요만 제공합니다.

## 포함되는 것

* Gateway + macOS 앱 + 도구(whisper, spotify, cameras) 모두 고정
* 재부팅 후에도 살아 있는 launchd 서비스
* 선언적 설정이 가능한 플러그인 시스템
* 즉시 롤백: `home-manager switch --rollback`

***

## Nix 모드 런타임 동작

nix-openclaw 사용 시(자동으로) `OPENCLAW_NIX_MODE=1`이 설정되면:

OpenClaw는 구성을 결정론적으로 만들고 자동 설치 흐름을 비활성화하는 **Nix 모드**를 지원합니다.
다음과 같이 내보내면 활성화할 수 있습니다.

```bash
OPENCLAW_NIX_MODE=1
```

macOS에서는 GUI 앱이 셸 환경 변수를 자동으로 상속하지 않습니다. defaults로도 Nix 모드를 활성화할 수 있습니다.

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### 설정 + 상태 경로

OpenClaw는 JSON5 설정을 `OPENCLAW_CONFIG_PATH`에서 읽고, 변경 가능한 데이터는 `OPENCLAW_STATE_DIR`에 저장합니다.
필요하다면 내부 경로 해석의 기준 홈 디렉터리를 제어하기 위해 `OPENCLAW_HOME`도 설정할 수 있습니다.

* `OPENCLAW_HOME` (기본 우선순위: `HOME` / `USERPROFILE` / `os.homedir()`)
* `OPENCLAW_STATE_DIR` (기본값: `~/.openclaw`)
* `OPENCLAW_CONFIG_PATH` (기본값: `$OPENCLAW_STATE_DIR/openclaw.json`)

Nix에서 실행할 때는 런타임 상태와 설정이 불변 store 밖에 머물도록 이 경로들을 Nix가 관리하는 위치로 명시적으로 지정하세요.

### Nix 모드의 런타임 동작

* 자동 설치 및 자체 변경 흐름이 비활성화됨
* 누락된 의존성은 Nix 전용 해결 메시지로 안내됨
* UI에 읽기 전용 Nix 모드 배너가 표시됨(해당 시)

## 패키징 참고(macOS)

macOS 패키징 흐름은 다음 경로의 안정적인 Info.plist 템플릿을 기대합니다:

```
apps/macos/Sources/OpenClaw/Resources/Info.plist
```

[`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh)는 이 템플릿을 앱 번들로 복사한 뒤 동적 필드(bundle ID, version/build, Git SHA, Sparkle keys)를 패치합니다. 이렇게 하면 SwiftPM 패키징과 Nix 빌드(Xcode 전체 툴체인에 의존하지 않음)에서 plist를 결정론적으로 유지할 수 있습니다.

## 관련 문서

* [nix-openclaw](https://github.com/openclaw/nix-openclaw) — 전체 설정 가이드
* [Wizard](/start/wizard) — 비 Nix CLI 설정
* [Docker](/install/docker) — 컨테이너 기반 설정
