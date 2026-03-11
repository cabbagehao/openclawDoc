---
summary: "WSL2 Gateway + Windows Chrome remote CDP 및 extension-relay 구성을 계층별로 문제 해결"
read_when:
  - OpenClaw Gateway는 WSL2에서 돌고 Chrome은 Windows에 있을 때
  - WSL2와 Windows에 걸친 browser/control-ui 오류가 겹쳐 보일 때
  - split-host 구성에서 raw remote CDP와 Chrome extension relay 중 무엇을 쓸지 결정할 때
title: "WSL2 + Windows + remote Chrome CDP troubleshooting"
---

# WSL2 + Windows + remote Chrome CDP troubleshooting

이 가이드는 다음과 같은 split-host 구성을 다룹니다.

* OpenClaw Gateway는 WSL2 내부에서 실행
* Chrome은 Windows에서 실행
* browser control이 WSL2/Windows 경계를 넘어야 함

또한 [issue #39369](https://github.com/openclaw/openclaw/issues/39369)에서 보인 계층형 실패 패턴도 설명합니다. 서로 독립적인 문제가 동시에 보일 수 있어, 실제로는 다른 층이 깨졌는데 엉뚱한 층이 먼저 문제처럼 보이는 경우가 있습니다.

## Choose the right browser mode first

유효한 패턴은 두 가지입니다.

### Option 1: Raw remote CDP

WSL2에서 Windows Chrome의 CDP endpoint를 가리키는 remote browser profile을 사용합니다.

적합한 경우:

* browser control만 필요할 때
* Chrome remote debugging을 WSL2에 노출하는 데 익숙할 때
* Chrome extension relay가 필요 없을 때

### Option 2: Chrome extension relay

built-in `chrome` profile과 OpenClaw Chrome extension을 사용합니다.

적합한 경우:

* toolbar button으로 기존 Windows Chrome 탭에 attach하고 싶을 때
* raw `--remote-debugging-port` 대신 extension 기반 제어를 원할 때
* relay 자체도 WSL2/Windows 경계를 넘어 도달 가능해야 할 때

namespace를 넘어 extension relay를 쓴다면, [Browser](/tools/browser)와 [Chrome extension](/tools/chrome-extension)에 나온 `browser.relayBindHost`가 핵심 설정입니다.

## Working architecture

기준 구조:

* WSL2가 `127.0.0.1:18789`에서 Gateway 실행
* Windows는 일반 브라우저로 `http://127.0.0.1:18789/`의 Control UI 열기
* Windows Chrome은 `9222` 포트에서 CDP endpoint 노출
* WSL2는 그 Windows CDP endpoint에 도달 가능
* OpenClaw는 WSL2에서 도달 가능한 주소를 browser profile에 사용

## Why this setup is confusing

실패 원인이 여러 층에서 겹칠 수 있습니다.

* WSL2가 Windows CDP endpoint에 도달하지 못함
* Control UI가 secure하지 않은 origin에서 열림
* `gateway.controlUi.allowedOrigins`가 page origin과 불일치
* token 또는 pairing이 없음
* browser profile이 잘못된 주소를 가리킴
* 실제로는 cross-namespace가 필요한데 extension relay가 여전히 loopback-only

이 때문에 한 층을 고쳐도 다른 오류가 계속 보일 수 있습니다.

## Critical rule for the Control UI

UI를 Windows에서 열 때는, 의도적으로 HTTPS를 구성한 경우가 아니라면 Windows localhost를 사용하세요.

사용할 주소:

`http://127.0.0.1:18789/`

Control UI에 LAN IP를 기본값으로 쓰지 마세요. LAN 또는 tailnet 주소의 plain HTTP는 CDP 자체와 무관한 insecure-origin/device-auth 동작을 유발할 수 있습니다. 자세한 내용은 [Control UI](/web/control-ui)를 참고하세요.

## Validate in layers

위에서 아래로 검증하세요. 중간 단계를 건너뛰지 마세요.

### Layer 1: Verify Chrome is serving CDP on Windows

Windows에서 remote debugging을 켜고 Chrome 시작:

```powershell
chrome.exe --remote-debugging-port=9222
```

Windows에서 먼저 Chrome 자체를 검증:

```powershell
curl http://127.0.0.1:9222/json/version
curl http://127.0.0.1:9222/json/list
```

여기서 실패한다면 아직 OpenClaw 문제가 아닙니다.

### Layer 2: Verify WSL2 can reach that Windows endpoint

WSL2에서 `cdpUrl`에 넣으려는 **정확한 주소**로 테스트:

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

정상 결과:

* `/json/version`이 Browser / Protocol-Version metadata가 포함된 JSON 반환
* `/json/list`가 JSON 반환(열린 page가 없으면 빈 배열이어도 정상)

실패한다면:

* Windows가 아직 그 포트를 WSL2에 노출하지 않았거나
* WSL2 쪽에서 보는 주소가 잘못되었거나
* firewall / port forwarding / local proxying이 아직 안 됐습니다

이 문제가 해결되기 전에는 OpenClaw config를 건드리지 마세요.

### Layer 3: Configure the correct browser profile

raw remote CDP를 쓴다면 WSL2에서 도달 가능한 주소를 OpenClaw에 넣습니다.

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "remote",
    profiles: {
      remote: {
        cdpUrl: "http://WINDOWS_HOST_OR_IP:9222",
        attachOnly: true,
        color: "#00AA00",
      },
    },
  },
}
```

참고:

* Windows에서만 통하는 주소가 아니라 WSL2에서 도달 가능한 주소를 써야 합니다
* 외부 관리 브라우저에는 `attachOnly: true` 유지
* OpenClaw 성공을 기대하기 전에 같은 URL을 `curl`로 먼저 검증하세요

### Layer 4: If you use the Chrome extension relay instead

browser 머신과 Gateway가 namespace boundary로 나뉘어 있으면 relay에 non-loopback bind 주소가 필요할 수 있습니다.

예시:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "chrome",
    relayBindHost: "0.0.0.0",
  },
}
```

정말 필요할 때만 사용하세요.

* 기본 동작이 더 안전합니다. relay가 loopback-only로 남기 때문입니다.
* `0.0.0.0`는 노출 표면을 넓힙니다.
* Gateway auth, node pairing, 주변 네트워크를 private하게 유지하세요.

extension relay가 필요 없다면 위 raw remote CDP profile이 더 낫습니다.

### Layer 5: Verify the Control UI layer separately

Windows에서 UI 열기:

`http://127.0.0.1:18789/`

그 다음 확인:

* page origin이 `gateway.controlUi.allowedOrigins`와 일치하는지
* token auth 또는 pairing이 올바르게 설정되어 있는지
* browser 문제를 디버깅한다고 생각하면서 사실은 Control UI auth 문제를 보고 있는 건 아닌지

도움이 되는 문서:

* [Control UI](/web/control-ui)

### Layer 6: Verify end-to-end browser control

WSL2에서:

```bash
openclaw browser open https://example.com --browser-profile remote
openclaw browser tabs --browser-profile remote
```

extension relay라면:

```bash
openclaw browser tabs --browser-profile chrome
```

정상 결과:

* 탭이 Windows Chrome에서 열림
* `openclaw browser tabs`가 대상 탭 반환
* 이후 `snapshot`, `screenshot`, `navigate`도 같은 profile에서 동작

## Common misleading errors

각 메시지는 계층별 단서로 해석하세요.

* `control-ui-insecure-auth`
  * UI origin / secure-context 문제이지, CDP transport 문제는 아님
* `token_missing`
  * auth 설정 문제
* `pairing required`
  * device approval 문제
* `Remote CDP for profile "remote" is not reachable`
  * WSL2가 설정된 `cdpUrl`에 도달하지 못함
* `gateway timeout after 1500ms`
  * 대개 여전히 CDP reachability 또는 느리거나 응답 없는 remote endpoint 문제
* `Chrome extension relay is running, but no tab is connected`
  * extension relay profile을 선택했지만 attach된 탭이 아직 없음

## Fast triage checklist

1. Windows: `curl http://127.0.0.1:9222/json/version`가 되는가?
2. WSL2: `curl http://WINDOWS_HOST_OR_IP:9222/json/version`가 되는가?
3. OpenClaw config: `browser.profiles.<name>.cdpUrl`이 WSL2에서 도달 가능한 정확한 주소를 쓰는가?
4. Control UI: LAN IP가 아니라 `http://127.0.0.1:18789/`로 열고 있는가?
5. extension relay 사용 시: 정말 `browser.relayBindHost`가 필요한가, 필요하다면 명시적으로 설정했는가?

## Practical takeaway

이 구성 자체는 대체로 가능합니다. 어려운 점은 browser transport, Control UI origin security, token/pairing, extension-relay topology가 서로 독립적으로 실패할 수 있고, 사용자 입장에서는 비슷한 증상처럼 보인다는 데 있습니다.

헷갈리면 다음 순서를 지키세요.

* 먼저 Windows Chrome endpoint를 로컬에서 검증
* 그다음 같은 endpoint를 WSL2에서 검증
* 그 다음에야 OpenClaw config나 Control UI auth를 디버깅
