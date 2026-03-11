---
summary: "`openclaw browser`용 CLI 레퍼런스(프로필, 탭, 액션, 확장 프로그램 릴레이)"
read_when:
  - `openclaw browser`를 사용할 때 일반적인 작업 예시가 필요할 때
  - node host를 통해 다른 머신에서 실행 중인 브라우저를 제어하고 싶을 때
  - Chrome 확장 프로그램 릴레이를 사용하고 싶을 때(툴바 버튼으로 attach/detach)
title: "browser"
---

# `openclaw browser`

OpenClaw의 브라우저 제어 서버를 관리하고 브라우저 액션(탭, 스냅샷, 스크린샷, 탐색, 클릭, 입력)을 실행합니다.

관련 문서:

- 브라우저 도구 + API: [Browser tool](/tools/browser)
- Chrome 확장 프로그램 릴레이: [Chrome extension](/tools/chrome-extension)

## 공통 플래그

- `--url <gatewayWsUrl>`: Gateway WebSocket URL(기본값은 config).
- `--token <token>`: Gateway 토큰(필요한 경우).
- `--timeout <ms>`: 요청 timeout(ms).
- `--browser-profile <name>`: 브라우저 프로필을 선택합니다(기본값은 config에서 가져옴).
- `--json`: 기계가 읽을 수 있는 출력(지원되는 경우).

## 빠른 시작(로컬)

```bash
openclaw browser --browser-profile chrome tabs
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

## 프로필

프로필은 이름이 있는 브라우저 라우팅 config입니다. 실제로는 다음과 같습니다:

- `openclaw`: 전용 OpenClaw 관리 Chrome 인스턴스를 실행하거나 여기에 attach합니다(격리된 사용자 데이터 디렉터리).
- `chrome`: Chrome 확장 프로그램 릴레이를 통해 기존 Chrome 탭을 제어합니다.

```bash
openclaw browser profiles
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser delete-profile --name work
```

특정 프로필 사용:

```bash
openclaw browser --browser-profile work tabs
```

## 탭

```bash
openclaw browser tabs
openclaw browser open https://docs.openclaw.ai
openclaw browser focus <targetId>
openclaw browser close <targetId>
```

## 스냅샷 / 스크린샷 / 액션

스냅샷:

```bash
openclaw browser snapshot
```

스크린샷:

```bash
openclaw browser screenshot
```

탐색/클릭/입력(ref 기반 UI 자동화):

```bash
openclaw browser navigate https://example.com
openclaw browser click <ref>
openclaw browser type <ref> "hello"
```

## Chrome 확장 프로그램 릴레이(툴바 버튼으로 attach)

이 모드에서는 수동으로 attach한 기존 Chrome 탭을 에이전트가 제어할 수 있습니다(auto-attach는 하지 않음).

압축 해제된 확장 프로그램을 고정된 경로에 설치합니다:

```bash
openclaw browser extension install
openclaw browser extension path
```

그런 다음 Chrome에서 `chrome://extensions`를 열고 "Developer mode"를 활성화한 뒤 "Load unpacked"를 선택하고 출력된 폴더를 고릅니다.

전체 가이드: [Chrome extension](/tools/chrome-extension)

## 원격 브라우저 제어(node host 프록시)

브라우저와 다른 머신에서 Gateway가 실행 중이라면, Chrome/Brave/Edge/Chromium이 있는 머신에서 **node host**를 실행합니다. Gateway는 브라우저 액션을 해당 노드로 프록시합니다(별도의 브라우저 제어 서버는 필요 없음).

자동 라우팅은 `gateway.nodes.browser.mode`로 제어하고, 여러 노드가 연결된 경우 특정 노드에 고정하려면 `gateway.nodes.browser.node`를 사용합니다.

보안 + 원격 설정: [Browser tool](/tools/browser), [Remote access](/gateway/remote), [Tailscale](/gateway/tailscale), [Security](/gateway/security)
