---
title: "Browser (OpenClaw-managed)"
description: "OpenClaw가 관리하는 격리 브라우저, Chrome extension relay, remote CDP 설정과 제어 방식을 설명합니다."
summary: "통합 브라우저 제어 서비스 + action 명령"
read_when:
  - agent가 제어하는 브라우저 자동화를 추가할 때
  - openclaw가 내 Chrome 사용을 방해하는 이유를 디버깅할 때
  - macOS 앱에서 browser 설정 + lifecycle을 구현할 때
x-i18n:
  source_path: "tools/browser.md"
---

# Browser (openclaw-managed)

OpenClaw는 agent가 제어하는 **전용 Chrome/Brave/Edge/Chromium profile**을 실행할 수 있습니다.
이 profile은 개인 브라우저와 분리되어 있으며, Gateway 내부의 작은 로컬 control service를 통해 관리됩니다. (loopback only)

입문자 관점:

- 이것은 **agent 전용의 별도 브라우저**라고 생각하면 됩니다.
- `openclaw` profile은 **개인 브라우저 profile을 건드리지 않습니다**.
- agent는 안전한 레인 안에서 **탭을 열고, 페이지를 읽고, 클릭하고, 입력할 수 있습니다**.
- 기본 `chrome` profile은 extension relay를 통해 **시스템 기본 Chromium 브라우저**를 사용합니다. 격리된 managed browser가 필요하면 `openclaw`로 전환하세요.

## 제공되는 것

- **openclaw**라는 별도 browser profile(기본적으로 주황색 accent).
- 예측 가능한 탭 제어(list/open/focus/close).
- Agent action(click/type/drag/select), snapshot, screenshot, PDF.
- 선택적 다중 profile 지원(`openclaw`, `work`, `remote`, ...).

이 browser는 **일상적으로 쓰는 메인 브라우저가 아닙니다**. agent 자동화와 검증을 위한 안전하고 격리된 표면입니다.

## 빠른 시작

```bash
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

“Browser disabled”가 나온다면 config에서 활성화하고(아래 참고) Gateway를 재시작하세요.

## Profiles: `openclaw` vs `chrome`

- `openclaw`: managed, isolated browser(extension 필요 없음).
- `chrome`: **시스템 브라우저**에 연결하는 extension relay(OpenClaw extension이 탭에 attach되어 있어야 함).

managed mode를 기본값으로 쓰려면 `browser.defaultProfile: "openclaw"`를 설정하세요.

## Configuration

Browser 설정은 `~/.openclaw/openclaw.json`에 있습니다.

```json5
{
  browser: {
    enabled: true, // default: true
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: true, // default trusted-network mode
      // allowPrivateNetwork: true, // legacy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // legacy single-profile override
    remoteCdpTimeoutMs: 1500, // remote CDP HTTP timeout (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // remote CDP WebSocket handshake timeout (ms)
    defaultProfile: "chrome",
    color: "#FF4500",
    headless: false,
    noSandbox: false,
    attachOnly: false,
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
  },
}
```

참고:

- browser control service는 `gateway.port` 에서 파생된 포트의 loopback에 bind됩니다
  (기본값: `18791`, 즉 gateway + 2). relay는 다음 포트(`18792`)를 사용합니다.
- Gateway 포트(`gateway.port` 또는 `OPENCLAW_GATEWAY_PORT`)를 override하면,
  파생 browser 포트도 같은 “family” 안에서 함께 이동합니다.
- `cdpUrl` 은 설정하지 않으면 기본적으로 relay 포트를 사용합니다.
- `remoteCdpTimeoutMs` 는 remote(non-loopback) CDP reachability check에 적용됩니다.
- `remoteCdpHandshakeTimeoutMs` 는 remote CDP WebSocket reachability check에 적용됩니다.
- Browser navigation/open-tab은 SSRF guard가 navigation 전에 적용되고, navigation 후 최종 `http(s)` URL에서도 best-effort로 다시 검사됩니다.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` 의 기본값은 `true` 입니다(trusted-network model). 엄격한 public-only browsing이 필요하면 `false` 로 설정하세요.
- 호환성을 위해 `browser.ssrfPolicy.allowPrivateNetwork` 도 legacy alias로 계속 지원됩니다.
- `attachOnly: true` 는 “로컬 browser는 절대 실행하지 말고, 이미 실행 중일 때만 attach하라”는 뜻입니다.
- `color` 와 profile별 `color` 는 browser UI에 tint를 적용해서 어떤 profile이 활성화되어 있는지 보여줍니다.
- 기본 profile은 `openclaw` 입니다(OpenClaw-managed standalone browser). Chrome extension relay를 기본값으로 쓰려면 `defaultProfile: "chrome"` 을 사용하세요.
- 자동 감지 순서: 시스템 기본 browser가 Chromium 기반이면 그것을 사용, 아니면 Chrome → Brave → Edge → Chromium → Chrome Canary.
- 로컬 `openclaw` profile은 `cdpPort`/`cdpUrl` 을 자동 할당합니다. 이 값은 remote CDP에만 설정하세요.

## Brave(또는 다른 Chromium 기반 브라우저) 사용

**시스템 기본** browser가 Chromium 기반(Chrome/Brave/Edge 등)이면 OpenClaw가 자동으로 사용합니다. 자동 감지를 override하려면 `browser.executablePath` 를 설정하세요.

CLI 예시:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
```

```json5
// macOS
{
  browser: {
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"
  }
}

// Windows
{
  browser: {
    executablePath: "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe"
  }
}

// Linux
{
  browser: {
    executablePath: "/usr/bin/brave-browser"
  }
}
```

## Local vs remote control

- **Local control (기본값):** Gateway가 loopback control service를 시작하고 로컬 browser를 실행할 수 있습니다.
- **Remote control (node host):** browser가 있는 머신에서 node host를 실행하면 Gateway가 그쪽으로 browser action을 proxy합니다.
- **Remote CDP:** `browser.profiles.<name>.cdpUrl`(또는 `browser.cdpUrl`)을 설정해 remote Chromium 기반 browser에 attach합니다. 이 경우 OpenClaw는 로컬 browser를 실행하지 않습니다.

Remote CDP URL은 auth를 포함할 수 있습니다.

- Query token(예: `https://provider.example?token=<token>`)
- HTTP Basic auth(예: `https://user:pass@provider.example`)

OpenClaw는 `/json/*` endpoint 호출과 CDP WebSocket 연결 시 이 auth를 그대로 유지합니다. token을 config 파일에 커밋하는 대신 환경 변수나 secret manager를 사용하는 편이 좋습니다.

## Node browser proxy(zero-config 기본값)

browser가 있는 머신에서 **node host** 를 실행하면, OpenClaw는 추가 browser config 없이도 browser tool 호출을 해당 node로 자동 라우팅할 수 있습니다. 이것이 remote gateway의 기본 경로입니다.

참고:

- node host는 로컬 browser control server를 **proxy command** 를 통해 노출합니다.
- profile은 node 자신의 `browser.profiles` config에서 옵니다(로컬과 동일).
- 원하지 않으면 비활성화할 수 있습니다.
  - node에서: `nodeHost.browserProxy.enabled=false`
  - gateway에서: `gateway.nodes.browser.mode="off"`

## Browserless(hosted remote CDP)

[Browserless](https://browserless.io)는 HTTPS로 CDP endpoint를 제공하는 hosted Chromium 서비스입니다. OpenClaw browser profile을 Browserless region endpoint로 지정하고 API key로 인증할 수 있습니다.

예시:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserless",
    remoteCdpTimeoutMs: 2000,
    remoteCdpHandshakeTimeoutMs: 4000,
    profiles: {
      browserless: {
        cdpUrl: "https://production-sfo.browserless.io?token=<BROWSERLESS_API_KEY>",
        color: "#00AA00",
      },
    },
  },
}
```

참고:

- `<BROWSERLESS_API_KEY>` 는 실제 Browserless token으로 바꾸세요.
- Browserless 계정에 맞는 region endpoint를 선택하세요(자세한 내용은 공식 문서 참고).

## Direct WebSocket CDP providers

일부 hosted browser 서비스는 표준 HTTP 기반 CDP discovery(`/json/version`) 대신 **직접 WebSocket endpoint** 를 제공합니다. OpenClaw는 둘 다 지원합니다.

- **HTTP(S) endpoint** (예: Browserless) — OpenClaw가 `/json/version` 을 호출해 WebSocket debugger URL을 찾은 다음 연결합니다.
- **WebSocket endpoint** (`ws://` / `wss://`) — OpenClaw가 `/json/version` 을 건너뛰고 직접 연결합니다. [Browserbase](https://www.browserbase.com) 같은 서비스나 WebSocket URL을 직접 제공하는 provider에 사용하세요.

### Browserbase

[Browserbase](https://www.browserbase.com)는 built-in CAPTCHA solving, stealth mode, residential proxies를 제공하는 headless browser 클라우드 플랫폼입니다.

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserbase",
    remoteCdpTimeoutMs: 3000,
    remoteCdpHandshakeTimeoutMs: 5000,
    profiles: {
      browserbase: {
        cdpUrl: "wss://connect.browserbase.com?apiKey=<BROWSERBASE_API_KEY>",
        color: "#F97316",
      },
    },
  },
}
```

참고:

- [가입](https://www.browserbase.com/sign-up)한 뒤 [Overview dashboard](https://www.browserbase.com/overview) 에서 **API Key** 를 복사하세요.
- `<BROWSERBASE_API_KEY>` 는 실제 Browserbase API key로 바꾸세요.
- Browserbase는 WebSocket connect 시 browser session을 자동 생성하므로 별도의 수동 session 생성이 필요 없습니다.
- 무료 tier는 동시 세션 1개와 월 1 browser hour를 제공합니다. 유료 플랜 제한은 [pricing](https://www.browserbase.com/pricing)을 참고하세요.
- 전체 API reference, SDK guide, integration example은 [Browserbase docs](https://docs.browserbase.com) 를 참고하세요.

## Security

핵심 개념:

- Browser control은 loopback-only이며, 액세스는 Gateway auth 또는 node pairing을 통해 흐릅니다.
- browser control이 활성화되어 있고 auth가 설정되어 있지 않으면, OpenClaw는 시작 시 `gateway.auth.token` 을 자동 생성하고 config에 영속 저장합니다.
- Gateway와 모든 node host는 private network(Tailscale)에 두고, public exposure는 피하세요.
- remote CDP URL/token은 secret으로 취급하세요. 환경 변수 또는 secret manager 사용을 권장합니다.

Remote CDP 팁:

- 가능하면 암호화된 endpoint(HTTPS 또는 WSS)와 짧은 수명의 token을 사용하세요.
- 장수 token을 config 파일에 직접 넣는 것은 피하세요.

## Profiles (multi-browser)

OpenClaw는 여러 named profile(routing config)을 지원합니다. profile 유형은 다음과 같습니다.

- **openclaw-managed**: 자체 user data directory + CDP port를 가진 전용 Chromium 기반 browser 인스턴스
- **remote**: 명시적인 CDP URL(다른 곳에서 실행 중인 Chromium 기반 browser)
- **extension relay**: 로컬 relay + Chrome extension을 통한 기존 Chrome tab

기본값:

- `openclaw` profile은 없으면 자동 생성됩니다.
- `chrome` profile은 Chrome extension relay용으로 내장되어 있습니다(기본적으로 `http://127.0.0.1:18792` 를 가리킴).
- 로컬 CDP 포트는 기본적으로 **18800–18899** 에서 할당됩니다.
- profile을 삭제하면 해당 로컬 data directory는 휴지통으로 이동됩니다.

모든 control endpoint는 `?profile=<name>` 을 받습니다. CLI에서는 `--browser-profile` 을 사용합니다.

## Chrome extension relay(기존 Chrome 사용)

OpenClaw는 로컬 CDP relay + Chrome extension을 통해 **기존 Chrome tab** 도 제어할 수 있습니다(별도의 “openclaw” Chrome 인스턴스 없이).

전체 가이드: [Chrome extension](/tools/chrome-extension)

흐름:

- Gateway가 로컬에서 실행되거나(같은 머신), browser 머신에서 node host가 실행됩니다.
- 로컬 **relay server** 가 loopback `cdpUrl` 에서 대기합니다(기본값: `http://127.0.0.1:18792`).
- 제어할 tab에서 **OpenClaw Browser Relay** extension 아이콘을 클릭해 attach합니다(자동 attach되지 않음).
- agent는 올바른 profile을 선택해 일반 `browser` tool을 통해 그 tab을 제어합니다.

Gateway가 다른 곳에서 실행된다면, browser 머신에서 node host를 실행해 Gateway가 browser action을 proxy할 수 있게 하세요.

### Sandboxed sessions

agent session이 sandboxed라면, `browser` tool은 기본적으로 `target="sandbox"`(sandbox browser)일 수 있습니다.
Chrome extension relay takeover는 host browser control이 필요하므로, 다음 중 하나를 선택해야 합니다.

- session을 unsandboxed로 실행하거나
- `agents.defaults.sandbox.browser.allowHostControl: true` 를 설정하고 tool 호출 시 `target="host"` 를 사용합니다.

### Setup

1. extension을 로드합니다(dev/unpacked):

```bash
openclaw browser extension install
```

- Chrome → `chrome://extensions` → “Developer mode” 활성화
- “Load unpacked” → `openclaw browser extension path` 가 출력한 디렉터리 선택
- extension을 pin한 뒤 제어할 tab에서 클릭합니다(badge에 `ON` 표시).

2. 사용:

- CLI: `openclaw browser --browser-profile chrome tabs`
- Agent tool: `browser` with `profile="chrome"`

선택 사항: 다른 이름이나 relay port를 쓰고 싶다면 profile을 직접 만드세요.

```bash
openclaw browser create-profile \
  --name my-chrome \
  --driver extension \
  --cdp-url http://127.0.0.1:18792 \
  --color "#00AA00"
```

참고:

- 이 모드는 대부분의 작업(screenshot/snapshot/action)에 Playwright-on-CDP를 사용합니다.
- detach하려면 extension 아이콘을 다시 클릭하세요.
- 기본적으로 relay는 loopback-only로 두세요. relay가 다른 network namespace에서 접근 가능해야 한다면(예: WSL2의 Gateway, Windows의 Chrome), `browser.relayBindHost` 를 `0.0.0.0` 같은 명시적 bind address로 설정하되 주변 네트워크는 비공개이며 인증된 상태로 유지하세요.

WSL2 / cross-namespace 예시:

```json5
{
  browser: {
    enabled: true,
    relayBindHost: "0.0.0.0",
    defaultProfile: "chrome",
  },
}
```

## 격리 보장

- **전용 user data dir**: 개인 browser profile을 절대 건드리지 않습니다.
- **전용 포트**: 개발 워크플로와 충돌하지 않도록 `9222` 를 피합니다.
- **예측 가능한 탭 제어**: “마지막 탭”이 아니라 `targetId` 로 대상 탭을 지정합니다.

## Browser selection

로컬 실행 시 OpenClaw는 사용 가능한 브라우저를 다음 순서로 선택합니다.

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

`browser.executablePath` 로 override할 수 있습니다.

플랫폼별:

- macOS: `/Applications` 와 `~/Applications` 를 확인합니다.
- Linux: `google-chrome`, `brave`, `microsoft-edge`, `chromium` 등을 찾습니다.
- Windows: 일반적인 설치 경로를 확인합니다.

## Control API (선택 사항)

로컬 integration 전용으로, Gateway는 작은 loopback HTTP API를 노출합니다.

- Status/start/stop: `GET /`, `POST /start`, `POST /stop`
- Tabs: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Snapshot/screenshot: `GET /snapshot`, `POST /screenshot`
- Actions: `POST /navigate`, `POST /act`
- Hooks: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- Downloads: `POST /download`, `POST /wait/download`
- Debugging: `GET /console`, `POST /pdf`
- Debugging: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Network: `POST /response/body`
- State: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- State: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Settings: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

모든 endpoint는 `?profile=<name>` 을 받습니다.

gateway auth가 설정되어 있다면 browser HTTP route도 auth가 필요합니다.

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` 또는 해당 password를 사용하는 HTTP Basic auth

### Playwright requirement

일부 기능(navigate/act/AI snapshot/role snapshot, element screenshot, PDF)은 Playwright가 필요합니다.
Playwright가 설치되어 있지 않으면, 해당 endpoint는 명확한 501 error를 반환합니다.
ARIA snapshot과 기본 screenshot은 openclaw-managed Chrome에서 계속 동작합니다.
Chrome extension relay driver에서는 ARIA snapshot과 screenshot에도 Playwright가 필요합니다.

`Playwright is not available in this gateway build` 가 보이면, 전체 Playwright 패키지(`playwright-core`가 아님)를 설치하고 gateway를 재시작하거나, browser support가 포함된 OpenClaw를 다시 설치하세요.

#### Docker Playwright install

Gateway를 Docker에서 실행한다면 `npx playwright` 는 피하세요(npm override conflict). 대신 번들된 CLI를 사용하세요.

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

browser download를 영속화하려면 `PLAYWRIGHT_BROWSERS_PATH` 를 설정하고(예: `/home/node/.cache/ms-playwright`), `/home/node` 가 `OPENCLAW_HOME_VOLUME` 또는 bind mount로 영속화되도록 하세요. 자세한 내용은 [Docker](/install/docker) 를 참고하세요.

## 동작 방식(내부)

상위 수준 흐름:

- 작은 **control server** 가 HTTP 요청을 받습니다.
- **CDP** 를 통해 Chromium 기반 browser(Chrome/Brave/Edge/Chromium)에 연결합니다.
- 고급 action(click/type/snapshot/PDF)에는 CDP 위에서 **Playwright** 를 사용합니다.
- Playwright가 없으면 non-Playwright 작업만 사용할 수 있습니다.

이 설계는 agent에 안정적이고 예측 가능한 인터페이스를 제공하면서, 로컬/원격 browser와 profile을 유연하게 교체할 수 있게 해줍니다.

## CLI quick reference

모든 명령은 특정 profile을 지정하기 위해 `--browser-profile <name>` 을 받습니다.
모든 명령은 machine-readable output을 위한 `--json` 도 지원합니다(stable payloads).

기본:

- `openclaw browser status`
- `openclaw browser start`
- `openclaw browser stop`
- `openclaw browser tabs`
- `openclaw browser tab`
- `openclaw browser tab new`
- `openclaw browser tab select 2`
- `openclaw browser tab close 2`
- `openclaw browser open https://example.com`
- `openclaw browser focus abcd1234`
- `openclaw browser close abcd1234`

검사:

- `openclaw browser screenshot`
- `openclaw browser screenshot --full-page`
- `openclaw browser screenshot --ref 12`
- `openclaw browser screenshot --ref e12`
- `openclaw browser snapshot`
- `openclaw browser snapshot --format aria --limit 200`
- `openclaw browser snapshot --interactive --compact --depth 6`
- `openclaw browser snapshot --efficient`
- `openclaw browser snapshot --labels`
- `openclaw browser snapshot --selector "#main" --interactive`
- `openclaw browser snapshot --frame "iframe#main" --interactive`
- `openclaw browser console --level error`
- `openclaw browser errors --clear`
- `openclaw browser requests --filter api --clear`
- `openclaw browser pdf`
- `openclaw browser responsebody "**/api" --max-chars 5000`

액션:

- `openclaw browser navigate https://example.com`
- `openclaw browser resize 1280 720`
- `openclaw browser click 12 --double`
- `openclaw browser click e12 --double`
- `openclaw browser type 23 "hello" --submit`
- `openclaw browser press Enter`
- `openclaw browser hover 44`
- `openclaw browser scrollintoview e12`
- `openclaw browser drag 10 11`
- `openclaw browser select 9 OptionA OptionB`
- `openclaw browser download e12 report.pdf`
- `openclaw browser waitfordownload report.pdf`
- `openclaw browser upload /tmp/openclaw/uploads/file.pdf`
- `openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'`
- `openclaw browser dialog --accept`
- `openclaw browser wait --text "Done"`
- `openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"`
- `openclaw browser evaluate --fn '(el) => el.textContent' --ref 7`
- `openclaw browser highlight e12`
- `openclaw browser trace start`
- `openclaw browser trace stop`

상태:

- `openclaw browser cookies`
- `openclaw browser cookies set session abc123 --url "https://example.com"`
- `openclaw browser cookies clear`
- `openclaw browser storage local get`
- `openclaw browser storage local set theme dark`
- `openclaw browser storage session clear`
- `openclaw browser set offline on`
- `openclaw browser set headers --headers-json '{"X-Debug":"1"}'`
- `openclaw browser set credentials user pass`
- `openclaw browser set credentials --clear`
- `openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"`
- `openclaw browser set geo --clear`
- `openclaw browser set media dark`
- `openclaw browser set timezone America/New_York`
- `openclaw browser set locale en-US`
- `openclaw browser set device "iPhone 14"`

참고:

- `upload` 와 `dialog` 는 **arming** 호출입니다. chooser/dialog를 트리거하는 click/press 전에 먼저 실행하세요.
- download 와 trace 출력 경로는 OpenClaw temp root로 제한됩니다.
  - traces: `/tmp/openclaw` (fallback: `${os.tmpdir()}/openclaw`)
  - downloads: `/tmp/openclaw/downloads` (fallback: `${os.tmpdir()}/openclaw/downloads`)
- upload 경로도 OpenClaw temp uploads root로 제한됩니다.
  - uploads: `/tmp/openclaw/uploads` (fallback: `${os.tmpdir()}/openclaw/uploads`)
- `upload` 는 `--input-ref` 또는 `--element` 로 file input을 직접 설정할 수도 있습니다.
- `snapshot`:
  - `--format ai` (Playwright 설치 시 기본값): 숫자 ref(`aria-ref="<n>"`)가 포함된 AI snapshot을 반환합니다.
  - `--format aria`: accessibility tree를 반환합니다(ref 없음, inspection 전용).
  - `--efficient` (또는 `--mode efficient`): compact role snapshot preset(interactive + compact + depth + lower maxChars).
  - Config 기본값(tool/CLI 전용): 호출자가 mode를 넘기지 않을 때 efficient snapshot을 사용하려면 `browser.snapshotDefaults.mode: "efficient"` 를 설정하세요([Gateway configuration](/gateway/configuration#browser-openclaw-managed-browser) 참고).
  - Role snapshot 옵션(`--interactive`, `--compact`, `--depth`, `--selector`)은 `ref=e12` 같은 ref를 가진 role-based snapshot을 강제합니다.
  - `--frame "<iframe selector>"` 는 role snapshot 범위를 특정 iframe으로 제한합니다(`e12` 같은 role ref와 함께 사용).
  - `--interactive` 는 상호작용 가능한 element를 고르기 쉬운 평면 목록으로 출력합니다(action 구동에 가장 적합).
  - `--labels` 는 overlay된 ref label이 포함된 viewport-only screenshot을 추가합니다(`MEDIA:<path>` 출력).
- `click`/`type` 등은 `snapshot` 에서 나온 `ref` 가 필요합니다(숫자 `12` 또는 role ref `e12`).
  action에는 의도적으로 CSS selector를 지원하지 않습니다.

## Snapshots and refs

OpenClaw는 두 가지 “snapshot” 스타일을 지원합니다.

- **AI snapshot (numeric refs)**: `openclaw browser snapshot` (기본값, `--format ai`)
  - 출력: 숫자 ref가 포함된 텍스트 snapshot
  - 액션: `openclaw browser click 12`, `openclaw browser type 23 "hello"`
  - 내부적으로는 Playwright의 `aria-ref` 로 ref를 해석합니다.

- **Role snapshot (`e12` 같은 role ref)**: `openclaw browser snapshot --interactive` (또는 `--compact`, `--depth`, `--selector`, `--frame`)
  - 출력: `[ref=e12]`(및 선택적으로 `[nth=1]`)가 포함된 role 기반 list/tree
  - 액션: `openclaw browser click e12`, `openclaw browser highlight e12`
  - 내부적으로는 `getByRole(...)` 로 ref를 해석합니다(중복 시 `nth()` 추가).
  - `--labels` 를 추가하면 overlay된 `e12` label이 들어간 viewport screenshot도 포함됩니다.

Ref 동작:

- ref는 **navigation 사이에서 안정적이지 않습니다**. 실패하면 `snapshot` 을 다시 실행해 새 ref를 사용하세요.
- role snapshot을 `--frame` 과 함께 찍었다면, 다음 role snapshot 전까지 role ref는 해당 iframe 범위로 제한됩니다.

## Wait power-ups

시간/텍스트 외에도 다양한 조건으로 기다릴 수 있습니다.

- URL 대기(Playwright glob 지원):
  - `openclaw browser wait --url "**/dash"`
- Load state 대기:
  - `openclaw browser wait --load networkidle`
- JS predicate 대기:
  - `openclaw browser wait --fn "window.ready===true"`
- Selector가 visible 상태가 될 때까지 대기:
  - `openclaw browser wait "#main"`

이 조건들은 함께 조합할 수 있습니다.

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## Debug workflows

action이 실패했을 때(예: “not visible”, “strict mode violation”, “covered”):

1. `openclaw browser snapshot --interactive`
2. `click <ref>` / `type <ref>` 를 사용합니다(interactive mode에서는 role ref 권장)
3. 여전히 실패하면 `openclaw browser highlight <ref>` 로 Playwright가 무엇을 가리키는지 확인합니다
4. 페이지 동작이 이상하면:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. 깊이 있게 디버깅하려면 trace를 기록합니다:
   - `openclaw browser trace start`
   - 문제를 재현
   - `openclaw browser trace stop` (`TRACE:<path>` 출력)

## JSON output

`--json` 은 스크립팅과 structured tooling용입니다.

예시:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

JSON의 role snapshot에는 `refs` 와 함께 작은 `stats` 블록(lines/chars/refs/interactive)이 포함되어, 도구가 payload 크기와 밀도를 판단할 수 있게 해줍니다.

## State and environment knobs

이 옵션들은 “사이트가 X처럼 동작하게 만들기” 워크플로에 유용합니다.

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Storage: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Headers: `set headers --headers-json '{"X-Debug":"1"}'` (legacy `set headers --json '{"X-Debug":"1"}'` 도 계속 지원)
- HTTP basic auth: `set credentials user pass` (또는 `--clear`)
- Geolocation: `set geo <lat> <lon> --origin "https://example.com"` (또는 `--clear`)
- Media: `set media dark|light|no-preference|none`
- Timezone / locale: `set timezone ...`, `set locale ...`
- Device / viewport:
  - `set device "iPhone 14"` (Playwright device preset)
  - `set viewport 1280 720`

## Security & privacy

- openclaw browser profile에는 로그인된 session이 들어 있을 수 있으므로 민감한 것으로 취급하세요.
- `browser act kind=evaluate` / `openclaw browser evaluate` 와 `wait --fn` 은 페이지 컨텍스트에서 임의 JavaScript를 실행합니다. 프롬프트 인젝션이 이를 조종할 수 있습니다. 필요 없다면 `browser.evaluateEnabled=false` 로 비활성화하세요.
- 로그인과 anti-bot 관련 참고(X/Twitter 등)는 [Browser login + X/Twitter posting](/tools/browser-login) 을 보세요.
- Gateway/node host는 비공개(loopback 또는 tailnet-only)로 유지하세요.
- Remote CDP endpoint는 강력합니다. 터널링하고 보호하세요.

strict-mode 예시(기본적으로 private/internal 대상 차단):

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // optional exact allow
    },
  },
}
```

## Troubleshooting

Linux 전용 이슈(특히 snap Chromium)는 [Browser troubleshooting](/tools/browser-linux-troubleshooting) 를 참고하세요.

WSL2 Gateway + Windows Chrome split-host 구성은 [WSL2 + Windows + remote Chrome CDP troubleshooting](/tools/browser-wsl2-windows-remote-cdp-troubleshooting) 를 참고하세요.

## Agent tools + how control works

agent는 browser 자동화를 위해 **하나의 tool** 을 받습니다.

- `browser` — status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

매핑 방식:

- `browser snapshot` 은 안정적인 UI tree(AI 또는 ARIA)를 반환합니다.
- `browser act` 는 snapshot의 `ref` ID를 사용해 click/type/drag/select를 수행합니다.
- `browser screenshot` 은 pixel을 캡처합니다(full page 또는 element).
- `browser` 는 다음을 받습니다.
  - `profile`: named browser profile(openclaw, chrome, remote CDP)을 선택
  - `target` (`sandbox` | `host` | `node`): browser가 어디에 있는지 선택
  - sandboxed session에서 `target: "host"` 를 쓰려면 `agents.defaults.sandbox.browser.allowHostControl=true` 가 필요합니다.
  - `target` 을 생략하면 sandboxed session은 기본적으로 `sandbox`, non-sandbox session은 `host` 를 사용합니다.
  - browser-capable node가 연결되어 있으면, `target="host"` 또는 `target="node"` 로 고정하지 않는 한 tool이 자동 라우팅될 수 있습니다.

이렇게 하면 agent 동작이 예측 가능해지고 brittle selector를 피할 수 있습니다.
