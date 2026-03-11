---
summary: "macOS 앱이 gateway/Baileys 상태를 보고하는 방법"
read_when:
  - mac 앱의 상태 표시기를 디버깅할 때
title: "Health Checks"
---

# macOS 의 Health Checks

메뉴 바 앱에서 연결된 채널이 정상인지 확인하는 방법입니다.

## 메뉴 바

* 상태 점은 이제 Baileys 상태를 반영합니다:
  * 초록: 연결됨 + 최근 소켓 열림
  * 주황: 연결 중/재시도 중
  * 빨강: 로그아웃됨 또는 프로브 실패
* 보조 줄은 "linked · auth 12m" 처럼 표시하거나 실패 이유를 보여 줍니다.
* "Run Health Check" 메뉴 항목은 수동 프로브를 트리거합니다.

## 설정

* General 탭에 Health 카드가 추가되어 linked auth age, session-store path/count, last check time, last error/status code, 그리고 Run Health Check / Reveal Logs 버튼을 보여 줍니다.
* UI 가 즉시 로드되도록 캐시된 스냅샷을 사용하고, 오프라인일 때도 부드럽게 폴백합니다.
* **Channels 탭** 은 WhatsApp/Telegram 의 채널 상태 + 제어(login QR, logout, probe, last disconnect/error)를 제공합니다.

## 프로브 동작 방식

* 앱은 `ShellExecutor` 를 통해 약 60초마다, 그리고 요청 시 `openclaw health --json` 을 실행합니다. 이 프로브는 메시지를 보내지 않고 자격 증명을 로드해 상태를 보고합니다.
* 깜빡임을 피하기 위해 마지막 성공 스냅샷과 마지막 오류를 별도로 캐시하고, 각각의 타임스탬프를 표시합니다.

## 확신이 없을 때

* 여전히 [Gateway health](/gateway/health) 의 CLI 흐름(`openclaw status`, `openclaw status --deep`, `openclaw health --json`)을 사용할 수 있고, `web-heartbeat` / `web-reconnect` 관련 로그를 보기 위해 `/tmp/openclaw/openclaw-*.log` 를 tail 할 수 있습니다.
