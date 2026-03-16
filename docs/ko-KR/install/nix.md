---
summary: "Nix로 OpenClaw를 선언적으로 설치하기"
description: "nix-openclaw로 OpenClaw를 선언적으로 설치하고 `OPENCLAW_NIX_MODE`에서의 런타임 동작을 이해하는 빠른 안내입니다."
read_when:
  - "재현 가능하고 롤백 가능한 설치를 원할 때"
  - "이미 Nix/NixOS/Home Manager를 사용할 때"
  - "모든 것을 고정하고 선언적으로 관리하고 싶을 때"
title: "Nix"
x-i18n:
  source_path: "install/nix.md"
---

# Nix 설치

Nix로 OpenClaw를 실행하는 권장 방법은 **[nix-openclaw](https://github.com/openclaw/nix-openclaw)**입니다. batteries-included Home Manager module입니다.

## 빠른 시작

다음 내용을 AI agent(Claude, Cursor 등)에 붙여 넣으세요.

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
> Nix 설치의 source of truth는 nix-openclaw 저장소입니다. 이 페이지는 빠른 개요만 제공합니다.

## 포함되는 것

- Gateway + macOS app + tools(whisper, spotify, cameras) 모두 pinned
- 재부팅 후에도 살아 있는 launchd service
- declarative config를 지원하는 plugin system
- 즉시 롤백: `home-manager switch --rollback`

---

## Nix mode runtime behavior

nix-openclaw를 사용하면(자동으로) `OPENCLAW_NIX_MODE=1`이 설정됩니다.

OpenClaw는 구성을 deterministic하게 만들고 auto-install flows를 비활성화하는 **Nix mode**를 지원합니다.
다음과 같이 export해서 활성화할 수 있습니다.

```bash
OPENCLAW_NIX_MODE=1
```

macOS에서는 GUI app이 shell env vars를 자동으로 상속하지 않습니다. defaults로도 Nix mode를 활성화할 수 있습니다.

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### Config + state paths

OpenClaw는 JSON5 config를 `OPENCLAW_CONFIG_PATH`에서 읽고, mutable data는 `OPENCLAW_STATE_DIR`에 저장합니다.
필요하다면 내부 path resolution의 기준 home directory를 제어하기 위해 `OPENCLAW_HOME`도 설정할 수 있습니다.

- `OPENCLAW_HOME` (기본 우선순위: `HOME` / `USERPROFILE` / `os.homedir()`)
- `OPENCLAW_STATE_DIR` (기본값: `~/.openclaw`)
- `OPENCLAW_CONFIG_PATH` (기본값: `$OPENCLAW_STATE_DIR/openclaw.json`)

Nix에서 실행할 때는 runtime state와 config가 immutable store 밖에 머물도록 이 경로들을 Nix-managed locations로 명시적으로 지정하세요.

### Runtime behavior in Nix mode

- auto-install과 self-mutation flows가 비활성화됩니다
- 누락된 dependencies는 Nix-specific remediation messages로 안내됩니다
- UI에는 해당 시 read-only Nix mode banner가 표시됩니다

## Packaging note (macOS)

macOS 패키징 흐름은 다음 경로의 안정적인 Info.plist 템플릿을 기대합니다:

```
apps/macos/Sources/OpenClaw/Resources/Info.plist
```

[`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh)는 이 템플릿을 app bundle로 복사한 뒤 dynamic fields(bundle ID, version/build, Git SHA, Sparkle keys)를 패치합니다. 이렇게 하면 SwiftPM packaging과 Nix builds(Xcode 전체 toolchain에 의존하지 않음)에서 plist를 deterministic하게 유지할 수 있습니다.

## Related

- [nix-openclaw](https://github.com/openclaw/nix-openclaw) — 전체 설정 가이드
- [Wizard](/start/wizard) — 비 Nix CLI 설정
- [Docker](/install/docker) — 컨테이너 기반 설정
