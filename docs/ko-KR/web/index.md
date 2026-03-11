---
summary: "Gateway 웹 인터페이스: Control UI, 바인드 모드, 보안"
read_when:
  - Tailscale을 통해 Gateway에 접근하고 싶을 때
  - 브라우저 Control UI와 설정 편집을 사용하고 싶을 때
title: "웹"
x-i18n:
  source_path: "web/index.md"
---

# 웹 (Gateway)

Gateway는 Gateway WebSocket과 같은 포트에서 작은 **브라우저 Control UI**(Vite + Lit)를 제공합니다.

- 기본값: `http://<host>:18789/`
- 선택적 접두사: `gateway.controlUi.basePath` 설정(예: `/openclaw`)

기능 자체는 [Control UI](/web/control-ui)에 정리되어 있습니다.
이 페이지는 바인드 모드, 보안, 웹 접근 인터페이스에 초점을 맞춥니다.

## 웹훅

`hooks.enabled=true`이면 Gateway는 같은 HTTP 서버에서 작은 webhook 엔드포인트도 노출합니다.
인증과 페이로드는 [Gateway configuration](/gateway/configuration)의 `hooks` 항목을 참고하세요.

## 설정(기본 활성화)

Control UI는 자산(`dist/control-ui`)이 존재하면 **기본적으로 활성화**됩니다.
설정으로 다음과 같이 제어할 수 있습니다.

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath optional
  },
}
```

## Tailscale 접근

### 통합 Serve(권장)

Gateway는 루프백에만 두고 Tailscale Serve가 이를 프록시하도록 설정합니다.

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

그런 다음 Gateway를 시작합니다.

```bash
openclaw gateway
```

열기:

- `https://<magicdns>/` (또는 설정한 `gateway.controlUi.basePath`)

### tailnet 바인드 + token

```json5
{
  gateway: {
    bind: "tailnet",
    controlUi: { enabled: true },
    auth: { mode: "token", token: "your-token" },
  },
}
```

그런 다음 Gateway를 시작합니다(비루프백 바인드에는 token이 필요).

```bash
openclaw gateway
```

열기:

- `http://<tailscale-ip>:18789/` (또는 설정한 `gateway.controlUi.basePath`)

### 공용 인터넷(Funnel)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password" }, // or OPENCLAW_GATEWAY_PASSWORD
  },
}
```

## 보안 참고

- Gateway auth는 기본적으로 필요합니다(token/password 또는 Tailscale identity headers).
- 비루프백 바인드는 여전히 **공유 token/password**(`gateway.auth` 또는 환경 변수)를 요구합니다.
- 마법사는 기본적으로 gateway token을 생성합니다(루프백에서도 마찬가지).
- UI는 `connect.params.auth.token` 또는 `connect.params.auth.password`를 전송합니다.
- 비루프백 Control UI 배포에서는 `gateway.controlUi.allowedOrigins`를 명시적으로 설정해야 합니다(완전한 origin 값). 그렇지 않으면 기본적으로 Gateway 시작이 거부됩니다.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`는 Host 헤더 기반 origin 대체 모드를 활성화하지만, 위험한 보안 약화입니다.
- Serve 사용 시 `gateway.auth.allowTailscale`이 `true`이면 Tailscale identity headers로 Control UI/WebSocket 인증을 충족할 수 있습니다(token/password 불필요). HTTP API 엔드포인트는 여전히 token/password가 필요합니다. 명시적 자격 증명을 강제하려면 `gateway.auth.allowTailscale: false`로 설정하세요. 자세한 내용은 [Tailscale](/gateway/tailscale) 및 [Security](/gateway/security)를 참고하세요. 이 토큰 없는 흐름은 게이트웨이 호스트가 신뢰된다는 전제를 둡니다.
- `gateway.tailscale.mode: "funnel"`은 `gateway.auth.mode: "password"`를 요구합니다(공유 password).

## UI 빌드

Gateway는 `dist/control-ui`에서 정적 파일을 제공합니다. 다음 명령으로 빌드합니다.

```bash
pnpm ui:build # 첫 실행 시 UI deps 자동 설치
```
