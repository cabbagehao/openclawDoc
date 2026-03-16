---
description: "Pomerium, Caddy, nginx 같은 신뢰 가능한 역방향 프록시에 OpenClaw Gateway 인증을 위임하는 가이드"
summary: "Gateway 인증을 신뢰할 수 있는 역방향 프록시(Pomerium, Caddy, nginx + OAuth 등)에 위임하는 방법 안내"
read_when:
  - 신원 인식 프록시(Identity-aware proxy) 뒤에서 OpenClaw를 운영하고자 할 때
  - Pomerium, Caddy, Nginx 등을 활용한 OAuth 인증 레이어를 구축할 때
  - 역방향 프록시 환경에서 발생하는 WebSocket 1008 인증 오류를 해결해야 할 때
  - HSTS 등 HTTP 보안 헤더 설정 위치를 결정하고자 할 때
title: "신뢰할 수 있는 프록시 인증"
x-i18n:
  source_path: "gateway/trusted-proxy-auth.md"
---

# 신뢰할 수 있는 프록시 인증 (Trusted Proxy Auth)

> ⚠️ **보안 주의 사항:** 이 모드는 인증 권한을 역방향 프록시(Reverse Proxy)에 전적으로 위임함. 설정 오류 발생 시 Gateway가 무단 접근에 노출될 위험이 크므로, 활성화 전 본 가이드를 충분히 숙지하기 바람.

## 사용 권장 사례

다음과 같은 환경에서 `trusted-proxy` 인증 모드를 사용함:

- OpenClaw를 **신원 인식 프록시**(Identity-aware proxy: Pomerium, Caddy + OAuth, Nginx + oauth2-proxy, Traefik + Forward Auth 등) 뒤에서 운영하는 경우.
- 프록시가 모든 인증을 처리하고 사용자 신원 정보를 HTTP 헤더를 통해 전달하는 경우.
- 프록시가 Gateway로 접근하는 유일한 경로인 Kubernetes 또는 컨테이너 환경인 경우.
- 브라우저가 WebSocket 페이로드에 토큰을 포함하지 못해 발생하는 `1008 unauthorized` 오류를 해결해야 하는 경우.

## 사용 부적합 사례

- 프록시가 사용자 인증을 직접 수행하지 않는 경우 (단순 TLS 종료기나 로드 밸런서인 경우).
- 방화벽 설정 오류 등으로 프록시를 거치지 않고 Gateway에 직접 접근할 수 있는 경로가 존재하는 경우.
- 프록시가 기존의 전달된 헤더(Forwarded headers)를 올바르게 제거하거나 덮어쓰는지 확신할 수 없는 경우.
- 개인 전용 단일 사용자 환경인 경우 (Tailscale Serve + 루프백 설정이 훨씬 간편하고 안전함).

## 동작 원리

1. 역방향 프록시가 사용자 인증(OAuth, OIDC, SAML 등)을 수행함.
2. 인증 성공 시, 프록시는 사용자 신원 정보(예: `x-forwarded-user: nick@example.com`)를 담은 헤더를 추가하여 요청을 전달함.
3. OpenClaw는 해당 요청이 **신뢰할 수 있는 프록시 IP**(`gateway.trustedProxies`에 정의됨)로부터 왔는지 확인함.
4. OpenClaw는 설정된 헤더에서 사용자 신원 정보를 추출함.
5. 모든 검증이 완료되면 요청을 최종 승인함.

## 제어 UI 페어링 동작 (Control UI Pairing)

`gateway.auth.mode = "trusted-proxy"`가 활성화되고 프록시 검증을 통과한 경우, 제어 UI의 WebSocket 세션은 별도의 **기기 페어링 인증 없이도 연결이 허용됨.**

**영향 및 고려 사항:**
- 이 모드에서는 페어링 절차가 제어 UI 접근의 주된 차단막 역할을 하지 않음.
- 실제 접근 제어는 역방향 프록시의 인증 정책 및 `allowUsers` 설정에 의해 결정됨.
- Gateway로의 유입 경로는 반드시 신뢰할 수 있는 프록시 IP만 허용되도록 네트워크 보안(방화벽)을 강화해야 함.

## 설정 방법

```json5
{
  gateway: {
    // Use loopback for same-host proxy setups; use lan/custom for remote proxy hosts
    bind: "loopback",

    // CRITICAL: Only add your proxy's IP(s) here
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // Header containing authenticated user identity (required)
        userHeader: "x-forwarded-user",

        // Optional: headers that MUST be present (proxy verification)
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // Optional: restrict to specific users (empty = allow all)
        allowUsers: ["nick@example.com", "admin@company.org"],
      },
    },
  },
}
```

`gateway.bind`가 `loopback`인 경우, `gateway.trustedProxies` 목록에 루프백 주소(`127.0.0.1`, `::1` 등)를 반드시 포함해야 함.

### 설정 레퍼런스

| 필드명 | 필수 여부 | 설명 |
| :--- | :---: | :--- |
| `gateway.trustedProxies` | 예 | 신뢰할 프록시 IP 주소 배열. 다른 IP에서의 요청은 즉시 거부됨. |
| `gateway.auth.mode` | 예 | 반드시 `"trusted-proxy"`로 설정해야 함. |
| `gateway.auth.trustedProxy.userHeader` | 예 | 인증된 사용자의 이메일이나 ID가 담긴 HTTP 헤더 이름. |
| `gateway.auth.trustedProxy.requiredHeaders` | 아니오 | 보안 강화를 위해 요청 시 반드시 포함되어야 하는 추가 헤더 목록. |
| `gateway.auth.trustedProxy.allowUsers` | 아니오 | 접근 허용 사용자 허용 목록. 비어 있는 경우 인증된 모든 사용자를 수락함. |

## TLS 종료 및 HSTS 설정 가이드

가급적 단일 TLS 종료 지점을 운영하고, 해당 지점에서 HSTS 정책을 적용할 것을 권장함.

### 권장 패턴: 프록시 서버에서의 TLS 종료
역방향 프록시가 `https://control.example.com` 도메인의 HTTPS 통신을 담당하는 경우, 프록시 설정에서 `Strict-Transport-Security` 헤더를 추가함.

- 공용 인터넷 노출 환경에 가장 적합한 방식임.
- 인증서 관리 및 HTTP 보안 정책을 한 곳에서 집중 관리할 수 있음.
- OpenClaw는 프록시 뒤에서 안전하게 루프백 HTTP 모드로 운영 가능함.

**헤더 설정 예시:**
```text
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### Gateway에서의 직접 TLS 종료
OpenClaw가 직접 HTTPS 요청을 수신하는 경우(별도의 프록시 없음):

```json5
{
  gateway: {
    tls: { enabled: true },
    http: {
      securityHeaders: {
        strictTransportSecurity: "max-age=31536000; includeSubDomains",
      },
    },
  },
}
```

### 단계적 적용 지침
- 초기에는 `max-age=300`과 같이 짧은 시간으로 설정하여 트래픽 영향도를 확인함.
- 안정성이 확인된 후 `max-age=31536000`(1년)과 같은 장기 값으로 변경함.
- 모든 서브도메인이 HTTPS를 완벽히 지원하는 경우에만 `includeSubDomains` 옵션을 추가함.
- 로컬 루프백 개발 환경에서는 HSTS 설정의 실익이 없음.

## 프록시 구성 예시

### 1) Pomerium
Pomerium은 `x-pomerium-claim-email` 헤더를 통해 신원 정보를 전달함.

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["10.0.0.1"],
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-pomerium-claim-email",
        requiredHeaders: ["x-pomerium-jwt-assertion"],
      },
    },
  },
}
```

### 2) Caddy (OAuth 연동)
`caddy-security` 플러그인을 사용하여 사용자 신원 헤더를 주입함.

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["127.0.0.1"],
    auth: {
      mode: "trusted-proxy",
      trustedProxy: { userHeader: "x-forwarded-user" },
    },
  },
}
```

### 3) Nginx + oauth2-proxy
`x-auth-request-email` 헤더를 통해 사용자 정보를 전달받음.

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["10.0.0.1"],
    auth: {
      mode: "trusted-proxy",
      trustedProxy: { userHeader: "x-auth-request-email" },
    },
  },
}
```

## 보안 체크리스트

프록시 인증을 활성화하기 전 다음 항목들을 반드시 확인함:

- [ ] **단일 경로 보장**: Gateway 포트는 오직 프록시 서버로부터의 접근만 허용하도록 방화벽으로 보호되고 있는가?
- [ ] **최소한의 신뢰**: `trustedProxies` 목록에 서브넷 전체가 아닌 실제 프록시 IP만 등록되어 있는가?
- [ ] **헤더 위조 방지**: 프록시 서버가 클라이언트가 보낸 기존의 `x-forwarded-*` 헤더를 무시하고 새로 덮어쓰도록 설정되어 있는가?
- [ ] **보안 전송**: 프록시가 TLS를 처리하며 사용자는 HTTPS를 통해 접속하는가?
- [ ] **사용자 제한**: `allowUsers`를 설정하여 인가된 특정 사용자만 접근할 수 있도록 제한했는가? (강력 권장)

## 보안 감사 (`security audit`)

`openclaw security audit` 실행 시 프록시 인증 모드가 활성화되어 있다면 **심각(Critical)** 수준의 결과로 보고됨. 이는 보안 책임을 프록시 구성에 위임하고 있음을 상기시키기 위한 의도적인 알림임. 감사는 다음 항목들을 중점적으로 확인함:
- `trustedProxies` 설정 누락 여부.
- `userHeader` 설정 누락 여부.
- `allowUsers`가 비어 있는지 여부 (모든 인증 사용자 허용 상태).

## 문제 해결 (Troubleshooting)

- **`"trusted_proxy_untrusted_source"`**: 요청이 허용된 프록시 IP 목록에 없음. 프록시 서버의 실제 IP 주소를 다시 확인함 (Docker 등 컨테이너 환경에서는 IP가 유동적일 수 있음).
- **`"trusted_proxy_user_missing"`**: 사용자 신원 헤더가 비어 있거나 누락됨. 프록시에서 헤더 주입 설정이 올바른지, 헤더 이름의 오타는 없는지 확인함.
- **`"trusted_proxy_user_not_allowed"`**: 인증은 되었으나 `allowUsers` 허용 목록에 포함되지 않은 사용자임.
- **WebSocket 연결 실패**: 프록시가 WebSocket 업그레이드(`Upgrade: websocket`)를 지원하는지, 그리고 업그레이드 요청 시에도 신원 헤더를 동일하게 전달하는지 확인함.

## 관련 문서 목록

- [시스템 보안 가이드](/gateway/security)
- [Gateway 설정 레퍼런스](/gateway/configuration)
- [원격 액세스 구성 패턴](/gateway/remote)
- [Tailscale 연동 가이드](/gateway/tailscale)
