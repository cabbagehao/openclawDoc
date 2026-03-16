---
summary: "macOS app이 gateway/Baileys health 상태를 어떻게 보여 주는지 설명합니다."
description: "macOS menu bar app에서 channel health, probe 결과, cached snapshot을 어디서 보고 어떻게 해석하는지 정리합니다."
read_when:
  - mac app의 health indicator를 디버깅할 때
title: "Health Checks"
x-i18n:
  source_path: "platforms/mac/health.md"
---

# macOS의 Health Checks

menu bar app에서 연결된 channel이 건강한지 확인하는 방법입니다.

## Menu bar

- status dot은 Baileys health를 반영합니다.
  - 초록: linked 상태이며 socket이 최근에 열림
  - 주황: 연결 중 또는 재시도 중
  - 빨강: logged out 상태이거나 probe 실패
- 보조 줄에는 `"linked · auth 12m"` 같은 문구 또는 실패 이유가 표시됩니다.
- `"Run Health Check"` 메뉴 항목은 on-demand probe를 실행합니다.

## Settings

- General tab에는 Health card가 추가되어 linked auth age, session-store path/count, last check time, last error/status code, 그리고 Run Health Check / Reveal Logs 버튼을 보여 줍니다.
- UI는 즉시 열리도록 cached snapshot을 사용하며, offline일 때도 자연스럽게 fallback합니다.
- **Channels tab**에서는 WhatsApp/Telegram channel status와 control(login QR, logout, probe, last disconnect/error)을 제공합니다.

## How the probe works

- app은 `ShellExecutor`를 통해 약 60초마다, 그리고 요청 시 `openclaw health --json`을 실행합니다. 이 probe는 메시지를 보내지 않고 credential을 읽어 상태만 보고합니다.
- flicker를 피하기 위해 마지막 성공 snapshot과 마지막 error를 따로 cache하고, 각각의 timestamp를 표시합니다.

## When in doubt

- 여전히 [Gateway health](/gateway/health)의 CLI 흐름(`openclaw status`, `openclaw status --deep`, `openclaw health --json`)을 사용할 수 있습니다.
- `web-heartbeat`와 `web-reconnect`를 보기 위해 `/tmp/openclaw/openclaw-*.log`를 tail해도 됩니다.
