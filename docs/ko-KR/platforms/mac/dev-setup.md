---
summary: "OpenClaw macOS 앱을 작업하는 개발자를 위한 설정 가이드"
description: "소스에서 OpenClaw macOS 앱을 빌드하고 CLI를 연결하며 Xcode/TCC/port 문제를 점검하는 개발 환경 설정 가이드입니다."
read_when:
  - "macOS 개발 환경을 설정할 때"
title: "macOS Dev Setup"
x-i18n:
  source_path: "platforms/mac/dev-setup.md"
---

# macOS Developer Setup

이 가이드는 OpenClaw macOS app을 source에서 빌드하고 실행하는 데 필요한 단계를 설명합니다.

## Prerequisites

앱을 빌드하기 전에 다음이 설치되어 있는지 확인하세요.

1. **Xcode 26.2+**: Swift 개발에 필요
2. **Node.js 22+ & pnpm**: gateway, CLI, packaging scripts에 필요

## 1. Install dependencies

프로젝트 전체 dependencies를 설치합니다.

```bash
pnpm install
```

## 2. Build and package the app

macOS app을 빌드하고 `dist/OpenClaw.app`으로 패키징하려면 다음을 실행하세요.

```bash
./scripts/package-mac-app.sh
```

Apple Developer ID certificate가 없다면, 스크립트는 자동으로 **ad-hoc signing** (`-`)을 사용합니다.

dev run modes, signing flags, Team ID troubleshooting은 macOS app README를 참고하세요.
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **Note**: ad-hoc signed apps는 보안 프롬프트를 띄울 수 있습니다. 앱이 "Abort trap 6"과 함께 즉시 크래시하면 아래 [Troubleshooting](#troubleshooting)을 보세요.

## 3. Install the CLI

macOS app은 background task 관리를 위해 전역 `openclaw` CLI 설치를 기대합니다.

**설치 방법 (권장):**

1. OpenClaw 앱을 엽니다.
2. **General** settings 탭으로 이동합니다.
3. **"Install CLI"**를 클릭합니다.

또는 수동 설치:

```bash
npm install -g openclaw@<version>
```

## Troubleshooting

### Build fails: toolchain 또는 SDK 불일치

macOS app 빌드는 최신 macOS SDK와 Swift 6.2 toolchain을 기대합니다.

**시스템 의존성 (필수):**

- **Software Update에서 제공되는 최신 macOS 버전** (Xcode 26.2 SDK에 필요)
- **Xcode 26.2** (Swift 6.2 toolchain)

**확인 명령:**

```bash
xcodebuild -version
xcrun swift --version
```

버전이 맞지 않으면 macOS/Xcode를 업데이트하고 다시 빌드하세요.

### App crashes on permission grant

**Speech Recognition** 또는 **Microphone** 접근을 허용할 때 앱이 크래시하면, 손상된 TCC cache 또는 signature mismatch 때문일 수 있습니다.

**Fix:**

1. TCC permissions를 초기화합니다.

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. 그래도 안 되면 [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh)에서 `BUNDLE_ID`를 잠시 바꿔 macOS가 "clean slate"로 보도록 합니다.

### Gateway "Starting..." indefinitely

gateway status가 계속 "Starting..."으로 남아 있으면 zombie process가 port를 잡고 있는지 확인하세요.

```bash
openclaw gateway status
openclaw gateway stop

# If you’re not using a LaunchAgent (dev mode / manual runs), find the listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

manual run이 port를 잡고 있으면 해당 process를 중지하세요(Ctrl+C). 마지막 수단으로 위에서 찾은 PID를 종료하세요.
