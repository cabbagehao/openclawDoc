---
summary: "OpenClaw macOS 앱을 작업하는 개발자를 위한 설정 가이드"
read_when:
  - macOS 개발 환경을 설정할 때
title: "macOS Dev Setup"
---

# macOS Developer Setup

이 가이드는 OpenClaw macOS 애플리케이션을 소스에서 빌드하고 실행하는 데 필요한 단계를 설명합니다.

## Prerequisites

앱을 빌드하기 전에 다음이 설치되어 있는지 확인하세요:

1. **Xcode 26.2+**: Swift 개발에 필요
2. **Node.js 22+ & pnpm**: gateway, CLI, packaging script 에 필요

## 1. 의존성 설치

프로젝트 전체 의존성을 설치합니다:

```bash
pnpm install
```

## 2. 앱 빌드 및 패키징

macOS 앱을 빌드하고 `dist/OpenClaw.app` 으로 패키징하려면 다음을 실행하세요:

```bash
./scripts/package-mac-app.sh
```

Apple Developer ID certificate 가 없다면, 스크립트는 자동으로 **ad-hoc signing** (`-`)을 사용합니다.

dev run mode, signing flag, Team ID 문제 해결은 macOS 앱 README 를 참고하세요:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **Note**: ad-hoc signed 앱은 보안 프롬프트를 띄울 수 있습니다. 앱이 "Abort trap 6" 과 함께 즉시 크래시하면 아래 [Troubleshooting](#troubleshooting) 절을 보세요.

## 3. CLI 설치

macOS 앱은 백그라운드 작업 관리를 위해 전역 `openclaw` CLI 설치를 기대합니다.

**설치 방법 (권장):**

1. OpenClaw 앱을 엽니다.
2. **General** settings 탭으로 이동합니다.
3. **"Install CLI"** 를 클릭합니다.

또는 수동 설치:

```bash
npm install -g openclaw@<version>
```

## Troubleshooting

### Build 실패: Toolchain 또는 SDK 불일치

macOS 앱 빌드는 최신 macOS SDK 와 Swift 6.2 toolchain 을 기대합니다.

**시스템 의존성 (필수):**

* **Software Update 에서 제공되는 최신 macOS 버전** (Xcode 26.2 SDK 에 필요)
* **Xcode 26.2** (Swift 6.2 toolchain)

**확인 명령:**

```bash
xcodebuild -version
xcrun swift --version
```

버전이 맞지 않으면 macOS/Xcode 를 업데이트하고 다시 빌드하세요.

### 권한 허용 시 앱 크래시

**Speech Recognition** 또는 **Microphone** 접근을 허용할 때 앱이 크래시하면, 손상된 TCC cache 또는 signature mismatch 때문일 수 있습니다.

**Fix:**

1. TCC 권한 초기화:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. 그래도 안 되면 [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) 에서 `BUNDLE_ID` 를 잠시 바꿔 macOS 가 "clean slate" 로 보도록 합니다.

### Gateway 가 "Starting..." 에서 멈춤

gateway 상태가 계속 "Starting..." 으로 남아 있으면 zombie process 가 포트를 잡고 있는지 확인하세요:

```bash
openclaw gateway status
openclaw gateway stop

# LaunchAgent 를 쓰지 않는 경우(dev mode / manual run), listener 찾기:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

manual run 이 포트를 잡고 있으면 해당 프로세스를 중지하세요(Ctrl+C). 마지막 수단으로 위에서 찾은 PID 를 종료하세요.
