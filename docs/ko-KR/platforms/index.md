---
summary: "플랫폼 지원 개요(Gateway + companion apps)"
read_when:
  - OS 지원이나 설치 경로를 찾고 있을 때
  - Gateway 를 어디서 실행할지 결정할 때
title: "Platforms"
---

# Platforms

OpenClaw 코어는 TypeScript 로 작성되어 있습니다. **Node 가 권장 런타임** 입니다.
Bun 은 Gateway 용으로 권장되지 않습니다(WhatsApp/Telegram 버그).

macOS(메뉴 바 앱)와 모바일 노드(iOS/Android)용 companion app 이 있습니다. Windows 와
Linux companion app 도 계획 중이지만, Gateway 자체는 이미 오늘 완전 지원됩니다.
Windows 용 네이티브 companion app 도 계획 중이며, Gateway 는 WSL2 를 통해 실행하는 것을 권장합니다.

## OS 선택

- macOS: [macOS](/platforms/macos)
- iOS: [iOS](/platforms/ios)
- Android: [Android](/platforms/android)
- Windows: [Windows](/platforms/windows)
- Linux: [Linux](/platforms/linux)

## VPS 및 호스팅

- VPS 허브: [VPS hosting](/vps)
- Fly.io: [Fly.io](/install/fly)
- Hetzner (Docker): [Hetzner](/install/hetzner)
- GCP (Compute Engine): [GCP](/install/gcp)
- exe.dev (VM + HTTPS proxy): [exe.dev](/install/exe-dev)

## 공통 링크

- 설치 가이드: [Getting Started](/start/getting-started)
- Gateway 런북: [Gateway](/gateway)
- Gateway 설정: [Configuration](/gateway/configuration)
- 서비스 상태: `openclaw gateway status`

## Gateway 서비스 설치(CLI)

다음 중 아무 방법이나 사용하세요(모두 지원됨):

- Wizard (권장): `openclaw onboard --install-daemon`
- Direct: `openclaw gateway install`
- Configure flow: `openclaw configure` → **Gateway service** 선택
- Repair/migrate: `openclaw doctor` (서비스 설치 또는 복구 제안)

서비스 대상은 OS 에 따라 다릅니다:

- macOS: LaunchAgent (`ai.openclaw.gateway` 또는 `ai.openclaw.<profile>`; 레거시 `com.openclaw.*`)
- Linux/WSL2: systemd user service (`openclaw-gateway[-<profile>].service`)
