---
summary: "Gateway용 브라우저 기반 Control UI(채팅, 노드, 설정)"
read_when:
  - 브라우저에서 Gateway를 운영하고 싶을 때
  - SSH 터널 없이 Tailnet 접근을 원할 때
title: "Control UI"
x-i18n:
  source_path: "web/control-ui.md"
---

# Control UI (브라우저)

Control UI는 Gateway가 제공하는 작은 **Vite + Lit** 단일 페이지 앱입니다.

- 기본값: `http://<host>:18789/`
- 선택적 접두사: `gateway.controlUi.basePath` 설정(예: `/openclaw`)

이 UI는 같은 포트에서 **Gateway WebSocket에 직접 연결**합니다.

## 빠르게 열기(로컬)

Gateway가 같은 컴퓨터에서 실행 중이라면 다음 주소를 엽니다.

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (또는 [http://localhost:18789/](http://localhost:18789/))

페이지가 열리지 않으면 먼저 Gateway를 시작하세요. `openclaw gateway`

인증 정보는 WebSocket 핸드셰이크 시 다음을 통해 전달됩니다.

- `connect.params.auth.token`
- `connect.params.auth.password`
  대시보드 설정 패널은 현재 브라우저 탭 세션과 선택한 gateway URL에 대해서만 token을 유지하며, password는 저장하지 않습니다.
  온보딩 마법사는 기본적으로 gateway token을 생성하므로, 첫 연결 시 이곳에 붙여 넣으면 됩니다.

## 기기 페어링(첫 연결)

새 브라우저나 기기에서 Control UI에 연결하면, Gateway는 **일회성 페어링 승인**을 요구합니다. 같은 Tailnet에서 `gateway.auth.allowTailscale: true`를 쓰고 있어도 마찬가지입니다. 이는 무단 접근을 막기 위한 보안 조치입니다.

**표시되는 메시지:** `"disconnected (1008): pairing required"`

**기기 승인 방법:**

```bash
# 대기 중 요청 목록 확인
openclaw devices list

# 요청 ID로 승인
openclaw devices approve <requestId>
```

한 번 승인되면 해당 기기는 기억되며, `openclaw devices revoke --device <id> --role <role>`로 취소하지 않는 한 다시 승인할 필요가 없습니다. token 회전 및 취소는 [Devices CLI](/cli/devices)를 참고하세요.

**참고:**

- 로컬 연결(`127.0.0.1`)은 자동 승인됩니다.
- 원격 연결(LAN, Tailnet 등)은 명시적 승인이 필요합니다.
- 각 브라우저 프로필은 고유한 기기 ID를 생성하므로, 브라우저를 바꾸거나 브라우저 데이터를 지우면 다시 페어링해야 합니다.

## 언어 지원

Control UI는 첫 로드 시 브라우저 로케일을 기준으로 자체 로컬라이즈되며, 나중에는 Access 카드의 언어 선택기에서 직접 바꿀 수 있습니다.

- 지원 로케일: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`
- 영어 이외 번역은 브라우저에서 지연 로드됩니다.
- 선택한 로케일은 브라우저 저장소에 저장되어 이후 방문에도 재사용됩니다.
- 번역 키가 누락되면 영어로 대체됩니다.

## 지금 가능한 일

- Gateway WS를 통한 모델 채팅(`chat.history`, `chat.send`, `chat.abort`, `chat.inject`)
- Chat에서 도구 호출 + 실시간 도구 출력 카드 스트리밍(에이전트 이벤트)
- 채널: WhatsApp/Telegram/Discord/Slack + 플러그인 채널(Mattermost 등) 상태, QR 로그인, 채널별 설정(`channels.status`, `web.login.*`, `config.patch`)
- 인스턴스: presence 목록 + 새로고침(`system-presence`)
- 세션: 목록 + 세션별 thinking/verbose 재정의(`sessions.list`, `sessions.patch`)
- 크론 작업: 목록/추가/수정/실행/활성화/비활성화 + 실행 이력(`cron.*`)
- 스킬: 상태, 활성화/비활성화, 설치, API 키 업데이트(`skills.*`)
- 노드: 목록 + 기능(cap) 확인(`node.list`)
- exec 승인: gateway 또는 node 허용 목록 편집 + `exec host=gateway/node`의 ask 정책(`exec.approvals.*`)
- 설정: `~/.openclaw/openclaw.json` 조회/편집(`config.get`, `config.set`)
- 설정: 검증 후 적용 + 재시작(`config.apply`) 및 마지막 활성 세션 깨우기
- 설정 저장 시 동시 편집 덮어쓰기를 막기 위한 base-hash 가드 포함
- 설정 스키마 + 폼 렌더링(`config.schema`, 플러그인 + 채널 스키마 포함), Raw JSON 편집기 유지
- 디버그: status/health/models 스냅샷 + 이벤트 로그 + 수동 RPC 호출(`status`, `health`, `models.list`)
- 로그: gateway 파일 로그 실시간 tail + 필터/내보내기(`logs.tail`)
- 업데이트: 패키지/git 업데이트 + 재시작(`update.run`) 및 재시작 보고서

Cron jobs 패널 참고:

- 격리된 작업의 기본 전달 방식은 announce summary입니다. 내부 전용 실행이 필요하면 none으로 바꿀 수 있습니다.
- announce를 선택하면 channel/target 필드가 나타납니다.
- webhook 모드는 `delivery.mode = "webhook"`을 사용하며, `delivery.to`에는 유효한 HTTP(S) webhook URL을 넣어야 합니다.
- 메인 세션 작업에서는 webhook 및 none 전달 모드를 사용할 수 있습니다.
- 고급 편집 항목에는 실행 후 삭제, agent override 해제, cron 정확/분산 옵션, agent model/thinking override, best-effort 전달 토글이 포함됩니다.
- 폼 검증은 필드 단위 오류와 함께 인라인으로 처리되며, 값이 잘못되면 저장 버튼이 비활성화됩니다.
- 전용 bearer token을 전송하려면 `cron.webhookToken`을 설정하세요. 생략하면 인증 헤더 없이 webhook을 보냅니다.
- 하위 호환용: `notify: true`가 저장된 레거시 작업은 마이그레이션 전까지 `cron.webhook`을 계속 사용할 수 있습니다.

## 채팅 동작

- `chat.send`는 **논블로킹**입니다. 즉시 `{ runId, status: "started" }`로 확인 응답을 반환하고, 응답은 `chat` 이벤트로 스트리밍됩니다.
- 같은 `idempotencyKey`로 다시 보내면 실행 중에는 `{ status: "in_flight" }`, 완료 후에는 `{ status: "ok" }`를 반환합니다.
- `chat.history` 응답은 UI 안전을 위해 크기가 제한됩니다. transcript 항목이 너무 크면 Gateway는 긴 텍스트 필드를 잘라내거나, 무거운 메타데이터 블록을 생략하거나, 지나치게 큰 메시지를 자리표시자(`\[chat.history omitted: message too large]`)로 대체할 수 있습니다.
- `chat.inject`는 세션 transcript에 어시스턴트 메모를 추가하고, UI 전용 업데이트를 위해 `chat` 이벤트를 브로드캐스트합니다(에이전트 실행 없음, 채널 전달 없음).
- 중지 방법:
  - **Stop** 클릭(`chat.abort` 호출)
  - `/stop` 입력(또는 `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop` 같은 단독 중단 문구)
  - `chat.abort`는 `{ sessionKey }`(`runId` 없음)를 지원하므로 해당 세션의 모든 활성 실행을 중단할 수 있습니다.
- 중단 시 부분 출력 보존:
  - 실행이 중단되면 어시스턴트 부분 출력이 UI에 그대로 보일 수 있습니다.
  - 버퍼된 출력이 있으면 Gateway는 중단된 어시스턴트 부분 출력을 transcript history에 저장합니다.
  - 저장된 항목에는 abort metadata가 포함되어, transcript 소비자가 일반 완료 출력과 구분할 수 있습니다.

## Tailnet 접근(권장)

### 통합 Tailscale Serve(권장)

Gateway는 루프백에만 두고 Tailscale Serve가 HTTPS로 프록시하도록 설정합니다.

```bash
openclaw gateway --tailscale serve
```

열기:

- `https://<magicdns>/` (또는 설정한 `gateway.controlUi.basePath`)

기본적으로 `gateway.auth.allowTailscale`이 `true`이면, Control UI/WebSocket Serve 요청은 Tailscale identity headers(`tailscale-user-login`)로 인증할 수 있습니다. OpenClaw는 `tailscale whois`로 `x-forwarded-for` 주소를 해석해 헤더와 일치하는지 검증하고, 요청이 loopback으로 들어오면서 Tailscale의 `x-forwarded-*` 헤더가 있는 경우에만 이를 허용합니다. Serve 트래픽에도 token/password를 요구하고 싶다면 `gateway.auth.allowTailscale: false`로 설정하거나 `gateway.auth.mode: "password"`를 강제하세요.
token 없는 Serve 인증은 gateway host가 신뢰된다는 전제를 둡니다. 해당 호스트에서 신뢰할 수 없는 로컬 코드가 실행될 수 있다면 token/password 인증을 요구하세요.

### tailnet 바인드 + token

```bash
openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
```

그런 다음 다음 주소를 엽니다.

- `http://<tailscale-ip>:18789/` (또는 설정한 `gateway.controlUi.basePath`)

UI 설정에 token을 붙여 넣으세요(`connect.params.auth.token`으로 전송됨).

## 안전하지 않은 HTTP

대시보드를 평문 HTTP(`http://<lan-ip>` 또는 `http://<tailscale-ip>`)로 열면 브라우저는 **비보안 컨텍스트**로 동작하며 WebCrypto를 차단합니다. 기본적으로 OpenClaw는 기기 식별이 없는 Control UI 연결을 **차단**합니다.

**권장 해결책:** HTTPS(Tailscale Serve)를 사용하거나 UI를 로컬에서 여세요.

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (gateway host에서)

**allowInsecureAuth 토글 동작:**

```json5
{
  gateway: {
    controlUi: { allowInsecureAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`allowInsecureAuth`는 Control UI의 device identity 또는 pairing 검사를 우회하지 않습니다.

**비상 전용(break-glass):**

```json5
{
  gateway: {
    controlUi: { dangerouslyDisableDeviceAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`dangerouslyDisableDeviceAuth`는 Control UI device identity 검사를 비활성화하며, 심각한 보안 약화를 의미합니다. 긴급 상황이 끝나면 즉시 원복하세요.

HTTPS 설정 가이드는 [Tailscale](/gateway/tailscale)를 참고하세요.

## UI 빌드

Gateway는 `dist/control-ui`에서 정적 파일을 제공합니다. 다음 명령으로 빌드합니다.

```bash
pnpm ui:build # 첫 실행 시 UI deps 자동 설치
```

고정 자산 URL이 필요할 때는 절대 base path를 지정할 수 있습니다.

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

로컬 개발용(별도 개발 서버):

```bash
pnpm ui:dev # 첫 실행 시 UI deps 자동 설치
```

그런 다음 UI가 사용할 Gateway WS URL(예: `ws://127.0.0.1:18789`)을 지정하세요.

## 디버깅/테스트: 개발 서버 + 원격 Gateway

Control UI는 정적 파일이며 WebSocket 대상은 설정 가능하므로, HTTP origin과 달라도 됩니다. 로컬에서 Vite 개발 서버를 띄우고 Gateway는 다른 곳에서 실행할 때 특히 유용합니다.

1. UI 개발 서버 시작: `pnpm ui:dev`
2. 다음과 같은 URL 열기:

```text
http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
```

선택적 1회용 인증(필요 시):

```text
http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
```

참고:

- `gatewayUrl`은 로드 후 localStorage에 저장되며 URL에서는 제거됩니다.
- `token`은 URL fragment에서 가져와 현재 브라우저 탭 세션과 선택한 gateway URL용 sessionStorage에 저장되고, URL에서는 제거됩니다. localStorage에는 저장되지 않습니다.
- `password`는 메모리에만 유지됩니다.
- `gatewayUrl`이 설정되면 UI는 config나 환경의 자격 증명으로 대체하지 않습니다.
  `token`(또는 `password`)을 명시적으로 제공해야 하며, 없으면 오류입니다.
- Gateway가 TLS 뒤에 있다면 `wss://`를 사용하세요(Tailscale Serve, HTTPS proxy 등).
- `gatewayUrl`은 클릭재킹 방지를 위해 최상위 창에서만 허용됩니다(임베드 환경 제외).
- 비루프백 Control UI 배포에서는 `gateway.controlUi.allowedOrigins`를 명시적으로 설정해야 합니다(완전한 origin 값).
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`는 Host-header origin fallback 모드를 켜지만, 위험한 보안 모드입니다.

예시:

```json5
{
  gateway: {
    controlUi: {
      allowedOrigins: ["http://localhost:5173"],
    },
  },
}
```

원격 접속 설정 상세: [Remote access](/gateway/remote)
