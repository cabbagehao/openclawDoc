---
summary: "OpenClaw가 지원하는 OS와 companion app 구성을 한눈에 정리합니다."
description: "macOS, iOS, Android, Windows, Linux, VPS 환경에서 OpenClaw Gateway와 companion app을 어떻게 배치할지 빠르게 확인할 수 있습니다."
read_when:
  - OS 지원 범위나 설치 경로를 찾을 때
  - Gateway를 어디에서 실행할지 결정할 때
title: "Platforms"
x-i18n:
  source_path: "platforms/index.md"
---

# Platforms

OpenClaw core는 TypeScript로 작성되어 있으며 **권장 runtime은 Node**입니다.
Gateway에는 Bun을 권장하지 않습니다. WhatsApp/Telegram 관련 문제가 있기 때문입니다.

companion app은 macOS(menu bar app)와 mobile node(iOS/Android)용으로 제공됩니다. Windows와 Linux companion app도 계획되어 있지만, Gateway 자체는 이미 완전히 지원됩니다. Windows native companion app도 계획 중이며, Gateway는 WSL2에서 실행하는 구성을 권장합니다.

## OS 선택

- macOS: [macOS](/platforms/macos)
- iOS: [iOS](/platforms/ios)
- Android: [Android](/platforms/android)
- Windows: [Windows](/platforms/windows)
- Linux: [Linux](/platforms/linux)

## VPS 및 호스팅

- VPS hub: [VPS hosting](/vps)
- Fly.io: [Fly.io](/install/fly)
- Hetzner (Docker): [Hetzner](/install/hetzner)
- GCP (Compute Engine): [GCP](/install/gcp)
- exe.dev (VM + HTTPS proxy): [exe.dev](/install/exe-dev)

## 공통 링크

- 설치 가이드: [Getting Started](/start/getting-started)
- Gateway runbook: [Gateway](/gateway)
- Gateway configuration: [Configuration](/gateway/configuration)
- service status: `openclaw gateway status`

## Gateway 서비스 설치 (CLI)

다음 경로는 모두 지원됩니다.

- Wizard(권장): `openclaw onboard --install-daemon`
- Direct: `openclaw gateway install`
- Configure flow: `openclaw configure` -> **Gateway service** 선택
- Repair/migrate: `openclaw doctor` (service 설치 또는 복구 제안)

service target은 OS에 따라 다릅니다.

- macOS: LaunchAgent (`ai.openclaw.gateway` 또는 `ai.openclaw.<profile>`; legacy `com.openclaw.*`)
- Linux/WSL2: systemd user service (`openclaw-gateway[-<profile>].service`)
