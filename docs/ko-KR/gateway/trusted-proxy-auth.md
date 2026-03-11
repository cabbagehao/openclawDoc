---
summary: "gateway 인증을 신뢰된 reverse proxy(Pomerium, Caddy, nginx + OAuth)에 위임"
read_when:
  - OpenClaw를 identity-aware proxy 뒤에서 실행할 때
  - OpenClaw 앞단에 Pomerium, Caddy, nginx + OAuth를 둘 때
  - reverse proxy 구성에서 WebSocket 1008 unauthorized 오류를 해결할 때
  - HSTS 및 기타 HTTP hardening header를 어디서 설정할지 결정할 때
---

# Trusted Proxy Auth

> ⚠️ **보안 민감 기능입니다.** 이 모드는 인증을 reverse proxy에 전적으로 위임합니다. 잘못 설정하면 Gateway가 무단 접근에 노출될 수 있습니다. 활성화하기 전에 이 페이지를 끝까지 읽으세요.

## When to Use

다음 경우 `trusted-proxy` auth mode를 사용하세요.

- OpenClaw를 **identity-aware proxy**(Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + forward auth) 뒤에서 실행할 때
- proxy가 모든 인증을 처리하고 사용자 identity를 header로 넘길 때
- Kubernetes 또는 container 환경에서 proxy만이 Gateway로 가는 유일한 경로일 때
- browser가 WS payload에 token을 넣지 못해 WebSocket `1008 unauthorized` 오류가 날 때

## When NOT to Use

- proxy가 사용자 인증을 하지 않는다면(단순 TLS terminator나 load balancer)
- proxy를 우회해서 Gateway로 가는 경로가 하나라도 있다면(firewall hole, 내부망 직접 접근)
- proxy가 forwarded header를 제대로 strip/overwrite 하는지 확신이 없다면
- 개인의 단일 사용자 접근만 필요하다면(Tailscale Serve + loopback이 훨씬 단순함)

## How It Works

1. reverse proxy가 사용자를 인증(OAuth, OIDC, SAML 등)
2. proxy가 인증된 사용자 identity를 담은 header 추가(예: `x-forwarded-user: nick@example.com`)
3. OpenClaw가 요청이 **신뢰된 proxy IP**에서 왔는지 확인(`gateway.trustedProxies`)
4. OpenClaw가 설정된 header에서 사용자 identity 추출
5. 모든 조건이 맞으면 요청을 승인

## Control UI Pairing Behavior

`gateway.auth.mode = "trusted-proxy"`가 활성화되고, 요청이 trusted-proxy check를 통과하면 Control UI WebSocket session은 device pairing identity 없이도 연결할 수 있습니다.

의미:

- 이 모드에서는 pairing이 Control UI 접근의 주된 게이트가 아닙니다.
- 실제 접근 제어는 reverse proxy auth policy와 `allowUsers`가 담당합니다.
- gateway ingress는 반드시 trusted proxy IP만 허용하도록 잠가 두세요(`gateway.trustedProxies` + firewall).

## Configuration

```json5
{
  gateway: {
    // 같은 호스트에 proxy가 있을 때는 loopback, remote proxy host면 lan/custom 사용
    bind: "loopback",

    // 중요: 실제 proxy IP만 여기에 추가
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // 인증된 사용자 identity가 들어 있는 header (필수)
        userHeader: "x-forwarded-user",

        // 선택: 반드시 있어야 하는 header(proxy 검증)
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // 선택: 특정 사용자만 허용(비어 있으면 인증된 사용자 전부 허용)
        allowUsers: ["nick@example.com", "admin@company.org"],
      },
    },
  },
}
```

`gateway.bind`가 `loopback`이면 `gateway.trustedProxies`에 loopback proxy 주소(`127.0.0.1`, `::1`, 또는 동등한 loopback CIDR)도 포함해야 합니다.

### Configuration Reference

| Field                                       | Required | Description                                                      |
| ------------------------------------------- | -------- | ---------------------------------------------------------------- |
| `gateway.trustedProxies`                    | Yes      | 신뢰할 proxy IP 배열. 다른 IP에서 오는 요청은 거부됨             |
| `gateway.auth.mode`                         | Yes      | 반드시 `"trusted-proxy"`여야 함                                  |
| `gateway.auth.trustedProxy.userHeader`      | Yes      | 인증된 사용자 identity를 담는 header 이름                        |
| `gateway.auth.trustedProxy.requiredHeaders` | No       | 요청을 신뢰하려면 반드시 존재해야 하는 추가 header               |
| `gateway.auth.trustedProxy.allowUsers`      | No       | 허용할 사용자 identity allowlist. 비어 있으면 인증된 사용자 전부 |

## TLS termination and HSTS

TLS termination 지점은 하나만 두고, HSTS도 그 지점에서 적용하세요.

### Recommended pattern: proxy TLS termination

reverse proxy가 `https://control.example.com`의 HTTPS를 처리한다면, 해당 도메인의 `Strict-Transport-Security`는 proxy에서 설정하세요.

- 인터넷 공개 배포에 적합
- certificate와 HTTP hardening policy를 한 곳에서 관리 가능
- OpenClaw는 proxy 뒤의 loopback HTTP로 유지 가능

예시 header 값:

```text
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### Gateway TLS termination

OpenClaw 자체가 HTTPS를 직접 제공하고(TLS-terminating proxy 없음), 직접 termination을 맡는 경우:

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

`strictTransportSecurity`는 string header value를 받거나, 명시적으로 끄려면 `false`를 받습니다.

### Rollout guidance

- 먼저 짧은 max age(예: `max-age=300`)로 시작해 트래픽을 검증하세요.
- 충분한 확신이 생긴 뒤에만 긴 값(예: `max-age=31536000`)으로 올리세요.
- 모든 서브도메인이 HTTPS 준비가 되어 있을 때만 `includeSubDomains`를 추가하세요.
- preload는 전체 도메인 세트가 preload 요건을 만족하도록 의도적으로 설계된 경우에만 사용하세요.
- loopback-only 로컬 개발에는 HSTS가 실질적 이점을 주지 않습니다.

## Proxy Setup Examples

### Pomerium

Pomerium은 identity를 `x-pomerium-claim-email`(또는 다른 claim header)로 전달하고, JWT를 `x-pomerium-jwt-assertion`으로 전달합니다.

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["10.0.0.1"], // Pomerium IP
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

Pomerium config 예시:

```yaml
routes:
  - from: https://openclaw.example.com
    to: http://openclaw-gateway:18789
    policy:
      - allow:
          or:
            - email:
                is: nick@example.com
    pass_identity_headers: true
```

### Caddy with OAuth

`caddy-security` plugin을 쓰는 Caddy는 사용자를 인증하고 identity header를 전달할 수 있습니다.

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["127.0.0.1"], // 같은 호스트에 Caddy가 있을 때
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-forwarded-user",
      },
    },
  },
}
```

Caddyfile 예시:

```
openclaw.example.com {
    authenticate with oauth2_provider
    authorize with policy1

    reverse_proxy openclaw:18789 {
        header_up X-Forwarded-User {http.auth.user.email}
    }
}
```

### nginx + oauth2-proxy

oauth2-proxy는 사용자를 인증하고 identity를 `x-auth-request-email`로 넘깁니다.

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["10.0.0.1"], // nginx/oauth2-proxy IP
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-auth-request-email",
      },
    },
  },
}
```

nginx config 예시:

```nginx
location / {
    auth_request /oauth2/auth;
    auth_request_set $user $upstream_http_x_auth_request_email;

    proxy_pass http://openclaw:18789;
    proxy_set_header X-Auth-Request-Email $user;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

### Traefik with Forward Auth

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["172.17.0.1"], // Traefik container IP
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-forwarded-user",
      },
    },
  },
}
```

## Security Checklist

trusted-proxy auth를 켜기 전에 반드시 확인할 것:

- [ ] **Proxy is the only path**: Gateway 포트는 proxy 외에는 모두 firewall로 차단됨
- [ ] **trustedProxies is minimal**: 전체 subnet이 아니라 실제 proxy IP만 포함
- [ ] **Proxy strips headers**: proxy가 client가 보낸 `x-forwarded-*` header를 append가 아니라 overwrite 함
- [ ] **TLS termination**: proxy가 TLS를 처리하고, 사용자는 HTTPS로 연결
- [ ] **allowUsers is set** (권장): 인증된 누구나 허용하지 말고 알려진 사용자로 제한

## Security Audit

`openclaw security audit`는 trusted-proxy auth를 **critical** severity로 표시합니다. 의도된 동작입니다. 보안을 proxy 구성에 위임하고 있다는 사실을 다시 상기시키기 위한 경고입니다.

감사 항목:

- `trustedProxies` 누락
- `userHeader` 누락
- 비어 있는 `allowUsers` (인증된 사용자 누구나 허용)

## Troubleshooting

### "trusted_proxy_untrusted_source"

요청이 `gateway.trustedProxies`에 없는 IP에서 왔습니다. 확인할 것:

- proxy IP가 맞는가? (Docker container IP는 바뀔 수 있음)
- proxy 앞단에 load balancer가 있는가?
- `docker inspect` 또는 `kubectl get pods -o wide`로 실제 IP 확인

### "trusted_proxy_user_missing"

user header가 비어 있거나 없습니다. 확인할 것:

- proxy가 identity header를 전달하도록 설정되어 있는가?
- header 이름이 맞는가? (대소문자는 무시되지만 철자는 중요)
- proxy에서 사용자가 실제로 인증되었는가?

### "trusted*proxy_missing_header*\*"

필수 header 중 하나가 없습니다. 확인할 것:

- 해당 header에 대한 proxy 설정
- 체인 중간에서 header가 strip 되고 있지 않은지

### "trusted_proxy_user_not_allowed"

사용자는 인증되었지만 `allowUsers`에 없습니다. 추가하거나 allowlist를 제거하세요.

### WebSocket Still Failing

proxy가 다음을 만족하는지 확인하세요.

- WebSocket upgrade 지원(`Upgrade: websocket`, `Connection: upgrade`)
- identity header를 WebSocket upgrade 요청에도 전달(HTTP에만 적용하면 안 됨)
- WebSocket 연결에 별도 auth path를 두고 있지 않음

## Migration from Token Auth

token auth에서 trusted-proxy로 옮길 때:

1. proxy가 사용자를 인증하고 header를 전달하도록 설정
2. proxy 구성을 독립적으로 테스트(curl + header)
3. OpenClaw config를 trusted-proxy auth로 변경
4. Gateway 재시작
5. Control UI에서 WebSocket 연결 테스트
6. `openclaw security audit`를 실행하고 결과 검토

## Related

- [Security](/gateway/security) - 전체 보안 가이드
- [Configuration](/gateway/configuration) - config reference
- [Remote Access](/gateway/remote) - 다른 remote access 패턴
- [Tailscale](/gateway/tailscale) - tailnet-only 접근에는 더 단순한 대안
