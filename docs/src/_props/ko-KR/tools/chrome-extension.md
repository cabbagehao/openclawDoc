---
summary: "Chrome 확장: 기존 Chrome 탭을 OpenClaw가 제어하도록 연결"
read_when:
  - agent가 기존 Chrome 탭을 제어하게 하고 싶을 때(toolbar button)
  - Tailscale을 통해 remote Gateway + local browser automation이 필요할 때
  - browser takeover의 보안 영향을 이해하고 싶을 때
title: "Chrome Extension"
---

# Chrome extension (browser relay)

OpenClaw Chrome extension을 사용하면, 별도의 openclaw-managed Chrome profile을 띄우는 대신 **기존 Chrome 탭**(평소 사용하는 Chrome 창)을 agent가 제어할 수 있습니다.

attach/detach는 **단일 Chrome toolbar button**으로 수행됩니다.

## What it is (concept)

구성 요소는 세 가지입니다.

* **Browser control service** (Gateway 또는 node): agent/tool이 호출하는 API(경유지는 Gateway)
* **Local relay server** (loopback CDP): control server와 extension 사이를 연결하는 브리지(기본값 `http://127.0.0.1:18792`)
* **Chrome MV3 extension**: `chrome.debugger`를 사용해 active tab에 attach하고 CDP 메시지를 relay로 전달

이후 OpenClaw는 normal `browser` tool surface를 통해 attach된 탭을 제어합니다. 적절한 profile을 선택하는 방식입니다.

## Install / load (unpacked)

1. extension을 안정적인 로컬 경로에 설치합니다.

```bash
openclaw browser extension install
```

2. 설치된 extension 디렉터리 경로를 출력합니다.

```bash
openclaw browser extension path
```

3. Chrome에서 `chrome://extensions`를 엽니다.

* “Developer mode” 활성화
* “Load unpacked” → 위에서 출력된 디렉터리 선택

4. extension을 pin 합니다.

## Updates (no build step)

extension은 OpenClaw release(npm package) 안에 정적 파일로 포함됩니다. 별도의 “build” 단계는 없습니다.

OpenClaw 업그레이드 후:

* `openclaw browser extension install`을 다시 실행해 OpenClaw state 디렉터리 아래의 설치 파일을 갱신
* Chrome → `chrome://extensions` → extension에서 “Reload” 클릭

## Use it (set gateway token once)

OpenClaw는 기본 relay port를 사용하는 `chrome` browser profile을 내장하고 있습니다.

처음 attach 하기 전에 extension Options에서 다음을 설정하세요.

* `Port` (기본값 `18792`)
* `Gateway token` (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN`과 일치해야 함)

사용 방법:

* CLI: `openclaw browser --browser-profile chrome tabs`
* Agent tool: `browser` with `profile="chrome"`

이름이나 relay port를 다르게 쓰고 싶다면 직접 profile을 만드세요.

```bash
openclaw browser create-profile \
  --name my-chrome \
  --driver extension \
  --cdp-url http://127.0.0.1:18792 \
  --color "#00AA00"
```

### Custom Gateway ports

custom gateway port를 쓰는 경우 extension relay port는 자동 계산됩니다.

**Extension Relay Port = Gateway Port + 3**

예: `gateway.port: 19001`이면:

* Extension relay port: `19004` (`gateway + 3`)

extension Options 페이지에서 계산된 relay port를 설정하세요.

## Attach / detach (toolbar button)

* OpenClaw가 제어할 탭을 엽니다.
* extension icon을 클릭합니다.
  * attach되면 badge에 `ON`이 표시됩니다.
* 다시 클릭하면 detach됩니다.

## Which tab does it control?

* “지금 보고 있는 탭”을 자동으로 제어하지는 않습니다.
* toolbar button을 눌러 **명시적으로 attach한 탭만** 제어합니다.
* 다른 탭으로 바꾸려면 그 탭을 열고 extension icon을 다시 클릭하세요.

## Badge + common errors

* `ON`: attach 완료, OpenClaw가 해당 탭 제어 가능
* `…`: local relay에 연결 중
* `!`: relay에 도달할 수 없거나 인증 실패
  가장 흔한 원인: relay server 미실행, gateway token 누락/불일치

`!`가 보이면:

* Gateway가 로컬에서 실행 중인지 확인하세요(기본 구성 기준). Gateway가 다른 머신에 있다면 이 머신에서 node host를 실행하세요.
* extension Options 페이지를 열면 relay reachability와 gateway-token auth를 검증합니다.

## Remote Gateway (use a node host)

### Local Gateway (same machine as Chrome) - usually **no extra steps**

Gateway가 Chrome과 같은 머신에서 실행되면, loopback에 browser control service를 띄우고 relay server도 자동 시작합니다. extension은 local relay와 통신하고, CLI/tool call은 Gateway로 들어갑니다.

### Remote Gateway (Gateway runs elsewhere) - **run a node host**

Gateway가 다른 머신에 있다면, Chrome이 실행되는 머신에서 node host를 시작하세요.
Gateway가 browser action을 해당 node로 프록시하므로, extension + relay는 browser 머신에만 로컬로 남습니다.

여러 node가 연결되어 있다면 `gateway.nodes.browser.node`로 하나를 고정하거나 `gateway.nodes.browser.mode`를 설정하세요.

## Sandboxing (tool containers)

agent session이 sandboxed(`agents.defaults.sandbox.mode != "off"`)라면 `browser` tool은 제한될 수 있습니다.

* 기본적으로 sandboxed session은 종종 host Chrome이 아니라 **sandbox browser**(`target="sandbox"`)를 대상으로 합니다.
* Chrome extension relay takeover는 **host** browser control server를 제어해야 합니다.

옵션:

* 가장 쉬운 방법: **non-sandboxed** session/agent에서 extension 사용
* 또는 sandboxed session에서도 host browser control을 허용:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        browser: {
          allowHostControl: true,
        },
      },
    },
  },
}
```

그 후 tool policy에서 `browser`가 deny되지 않았는지 확인하고, 필요하면 `browser` 호출에 `target="host"`를 지정하세요.

디버깅: `openclaw sandbox explain`

## Remote access tips

* Gateway와 node host를 같은 tailnet에 두고, relay port를 LAN이나 public Internet에 노출하지 마세요.
* node pairing은 의도적으로 수행하고, 원하지 않으면 browser proxy routing을 비활성화하세요(`gateway.nodes.browser.mode="off"`).
* 정말 cross-namespace가 필요한 경우가 아니라면 relay는 loopback에 유지하세요. WSL2 같은 split-host 구성에서는 `browser.relayBindHost`를 `0.0.0.0` 같은 명시적 bind 주소로 설정할 수 있지만, 그 경우에도 Gateway auth, node pairing, private network로 접근을 제한해야 합니다.

## How “extension path” works

`openclaw browser extension path`는 extension 파일이 들어 있는 **설치된** 디스크 경로를 출력합니다.

CLI는 의도적으로 `node_modules` 경로를 출력하지 않습니다. 먼저 `openclaw browser extension install`을 실행해 extension을 OpenClaw state 디렉터리 아래의 안정적인 위치로 복사하세요.

이 설치 디렉터리를 이동하거나 삭제하면, 유효한 경로로 다시 로드할 때까지 Chrome은 extension을 깨진 상태로 표시합니다.

## Security implications (read this)

이 기능은 강력하지만 위험합니다. 모델에게 “당신의 브라우저를 직접 다루는 손”을 준다고 생각해야 합니다.

* extension은 Chrome의 debugger API(`chrome.debugger`)를 사용합니다. attach된 동안 모델은 다음을 할 수 있습니다.
  * 클릭/입력/탐색
  * 페이지 내용 읽기
  * 해당 탭의 로그인 세션으로 접근 가능한 내용 사용
* **이 방식은 전용 openclaw-managed profile처럼 격리되지 않습니다.**
  * 평소 사용하는 profile/tab에 attach하면, 그 계정 상태 전체에 접근 권한을 주는 셈입니다.

권장 사항:

* extension relay는 개인 브라우징과 분리된 전용 Chrome profile에서 사용하는 편이 낫습니다.
* Gateway와 node host는 tailnet 전용으로 유지하고, Gateway auth + node pairing에 의존하세요.
* relay port를 LAN(`0.0.0.0`)에 노출하지 말고, Funnel(public)도 피하세요.
* relay는 `/cdp`, `/extension` 모두에서 비-extension origin을 차단하고 gateway-token auth를 요구합니다.

관련 문서:

* Browser tool overview: [Browser](/tools/browser)
* Security audit: [Security](/gateway/security)
* Tailscale setup: [Tailscale](/gateway/tailscale)
