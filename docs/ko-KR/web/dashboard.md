---
summary: "Gateway 대시보드(Control UI)의 접근 및 인증"
read_when:
  - 대시보드 인증 방식이나 노출 모드를 바꿀 때
title: "대시보드"
description: "Gateway 대시보드(Control UI)의 접속 경로, 인증 방식, 문제 해결 절차를 설명합니다."
x-i18n:
  source_path: "web/dashboard.md"
---

# 대시보드 (Control UI)

Gateway 대시보드는 기본적으로 `/`에서 제공되는 브라우저용 Control UI입니다(`gateway.controlUi.basePath`로 변경 가능).

빠르게 열기(로컬 Gateway):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (또는 [http://localhost:18789/](http://localhost:18789/))

핵심 참고 문서:

- 사용법과 UI 기능: [Control UI](/web/control-ui)
- Serve/Funnel 자동화: [Tailscale](/gateway/tailscale)
- 바인드 모드와 보안 참고: [Web surfaces](/web)

인증은 WebSocket 핸드셰이크 중 `connect.params.auth`(token 또는 password)를 통해 강제됩니다. 자세한 내용은 [Gateway configuration](/gateway/configuration)의 `gateway.auth`를 참고하세요.

보안 참고: Control UI는 **관리자 인터페이스**입니다(채팅, config, exec approvals 포함). 공개 인터넷에 노출하지 마세요. UI는 현재 브라우저 탭 세션과 선택한 gateway URL에 대해서만 대시보드 URL token을 sessionStorage에 저장하고, 로드 후 URL에서는 제거합니다. 가능하면 localhost, Tailscale Serve, 또는 SSH 터널을 사용하세요.

## 빠른 경로(권장)

- 온보딩 후 CLI는 대시보드를 자동으로 열고 깔끔한(비토큰) 링크를 출력합니다.
- 언제든 다시 열기: `openclaw dashboard` (링크를 복사하고, 가능하면 브라우저를 열며, 헤드리스 환경이면 SSH 힌트를 표시)
- UI가 인증을 요구하면 `gateway.auth.token`(또는 `OPENCLAW_GATEWAY_TOKEN`) 값을 Control UI 설정에 붙여 넣으세요.

## token 기본 사항(로컬 vs 원격)

- **Localhost**: `http://127.0.0.1:18789/`를 엽니다.
- **Token 출처**: `gateway.auth.token`(또는 `OPENCLAW_GATEWAY_TOKEN`); `openclaw dashboard`는 1회 부트스트랩용으로 URL fragment를 통해 이를 전달할 수 있으며, Control UI는 localStorage 대신 현재 브라우저 탭 세션과 선택한 gateway URL용 sessionStorage에 저장합니다.
- `gateway.auth.token`이 SecretRef로 관리되면, `openclaw dashboard`는 의도적으로 비토큰 URL만 출력/복사/오픈합니다. 외부 관리 토큰이 shell 로그, 클립보드 기록, 브라우저 실행 인자에 노출되는 것을 막기 위함입니다.
- `gateway.auth.token`이 SecretRef로 구성되어 있고 현재 shell에서 해석되지 않더라도, `openclaw dashboard`는 비토큰 URL과 함께 실행 가능한 인증 설정 가이드를 출력합니다.
- **Localhost가 아닌 경우**: Tailscale Serve(`gateway.auth.allowTailscale: true`일 때 Control UI/WebSocket은 token 없이 인증 가능, 단 gateway host가 신뢰된다는 전제; HTTP API는 여전히 token/password 필요), 또는 tailnet 바인드 + token, 또는 SSH 터널을 사용하세요. 자세한 내용은 [Web surfaces](/web)를 참고하세요.

## “unauthorized” / 1008 이 보일 때

- gateway에 접근 가능한지 확인하세요(로컬: `openclaw status`; 원격: SSH 터널 `ssh -N -L 18789:127.0.0.1:18789 user@host` 후 `http://127.0.0.1:18789/` 열기).
- `AUTH_TOKEN_MISMATCH`의 경우, gateway가 재시도 힌트를 반환하면 클라이언트는 캐시된 device token으로 한 번 신뢰된 재시도를 수행할 수 있습니다. 그 재시도 후에도 인증이 실패하면 token drift를 수동으로 해결해야 합니다.
- token drift 복구 단계는 [Token drift recovery checklist](/cli/devices#token-drift-recovery-checklist)를 따르세요.
- gateway host에서 token을 가져오거나 제공하세요.
  - 평문 config: `openclaw config get gateway.auth.token`
  - SecretRef-managed config: 외부 secret provider를 해석하거나 이 shell에 `OPENCLAW_GATEWAY_TOKEN`을 export한 뒤 `openclaw dashboard`를 다시 실행
  - token이 설정되지 않은 경우: `openclaw doctor --generate-gateway-token`
- 대시보드 설정의 auth 필드에 token을 붙여 넣은 뒤 연결하세요.
