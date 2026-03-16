---
summary: "브라우저 프로필, 탭 관리, 자동화 액션 및 확장 프로그램 연동을 위한 `openclaw browser` 명령어 레퍼런스"
description: "OpenClaw의 browser control server를 다루는 `openclaw browser` 명령으로 profile, tab, snapshot, Chrome extension relay, remote node proxy를 관리하는 방법을 설명합니다."
read_when:
  - CLI를 통해 브라우저 제어 서버를 관리하거나 자동화 작업을 수행할 때
  - 노드 호스트를 통해 원격 기기의 브라우저를 제어하고자 할 때
  - Chrome 확장 프로그램 릴레이를 설정하고 사용할 때
title: "browser"
x-i18n:
  source_path: "cli/browser.md"
---

# `openclaw browser`

OpenClaw의 브라우저 제어 서버를 관리하고 각종 브라우저 액션(탭 관리, 스냅샷 및 스크린샷 캡처, 페이지 탐색, 클릭 및 입력 등)을 실행함.

**관련 문서:**
- 브라우저 도구 및 API 상세: [Browser tool](/tools/browser)
- Chrome 확장 프로그램 연동 가이드: [Chrome extension](/tools/chrome-extension)

## 공통 플래그

- `--url <gatewayWsUrl>`: Gateway WebSocket 주소 (미지정 시 설정 파일의 기본값 사용).
- `--token <token>`: Gateway 인증 토큰 (필요한 경우).
- `--timeout <ms>`: 요청 타임아웃 시간 (밀리초 단위).
- `--browser-profile <name>`: 사용할 브라우저 프로필 지정 (기본값은 설정 파일의 정의를 따름).
- `--json`: 기계 판독이 가능한 JSON 형식으로 결과 출력.

## 빠른 시작 (로컬 환경)

```bash
openclaw browser --browser-profile chrome tabs
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

## 프로필 관리 (Profiles)

프로필은 브라우저 라우팅 설정을 명명한 것임. 주요 유형은 다음과 같음:

- **`openclaw`**: OpenClaw가 직접 관리하는 전용 Chrome 인스턴스 (격리된 사용자 데이터 디렉터리 사용).
- **`chrome`**: Chrome 확장 프로그램 릴레이를 통해 사용자가 현재 사용 중인 Chrome 브라우저의 탭을 제어함.

```bash
openclaw browser profiles
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser delete-profile --name work
```

특정 프로필을 지정하여 명령 실행:
```bash
openclaw browser --browser-profile work tabs
```

## 탭 관리 (Tabs)

```bash
openclaw browser tabs
openclaw browser open https://docs.openclaw.ai
openclaw browser focus <targetId>
openclaw browser close <targetId>
```

## 데이터 추출 및 자동화 액션

**스냅샷 추출:**
```bash
openclaw browser snapshot
```

**스크린샷 캡처:**
```bash
openclaw browser screenshot
```

**UI 자동화 (참조 기반):**
```bash
openclaw browser navigate https://example.com
openclaw browser click <ref>
openclaw browser type <ref> "hello"
```

## Chrome 확장 프로그램 릴레이 (Relay)

이 모드는 에이전트가 사용자가 수동으로 연결(Attach)한 기존 Chrome 탭을 제어할 수 있게 해줌. (자동 연결은 지원하지 않음)

**설치 방법:**
1. 확장 프로그램 파일을 특정 경로에 설치함:
   ```bash
   openclaw browser extension install
   openclaw browser extension path
   ```
2. Chrome 브라우저 실행 -> `chrome://extensions` 접속.
3. '개발자 모드' 활성화 -> '압축해제된 확장 프로그램을 로드합니다' 선택 -> 위에서 확인한 폴더 선택.

상세 가이드: [Chrome extension](/tools/chrome-extension)

## 원격 브라우저 제어 (노드 프록시)

Gateway 서버와 브라우저 실행 기기가 다를 경우, 브라우저가 설치된 기기에서 **노드 호스트(Node Host)**를 구동함. Gateway는 수신된 브라우저 액션을 해당 노드로 프록시(Proxy)하여 전달하므로 별도의 서버 설정 없이 원격 제어가 가능함.

- 자동 라우팅 설정: `gateway.nodes.browser.mode`.
- 특정 노드 고정: `gateway.nodes.browser.node`.

보안 및 원격 구성 상세: [브라우저 도구](/tools/browser), [원격 접속 가이드](/gateway/remote), [Tailscale 통합](/gateway/tailscale), [보안 개요](/gateway/security)
