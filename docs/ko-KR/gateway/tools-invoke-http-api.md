---
summary: "Gateway HTTP 엔드포인트를 통해 단일 도구를 직접 호출합니다"
read_when:
  - 전체 에이전트 턴을 실행하지 않고 도구를 호출할 때
  - 도구 정책 강제를 필요로 하는 자동화를 구축할 때
title: "도구 Invoke API"
---

# 도구 Invoke (HTTP)

OpenClaw의 Gateway는 단일 도구를 직접 호출하기 위한 간단한 HTTP 엔드포인트를 제공합니다. 이 엔드포인트는 항상 활성화되어 있지만, Gateway 인증과 도구 정책의 제어를 받습니다.

- `POST /tools/invoke`
- Gateway와 같은 포트(WS + HTTP 멀티플렉스): `http://<gateway-host>:<port>/tools/invoke`

기본 최대 payload 크기는 2 MB입니다.

## 인증

Gateway 인증 설정을 사용합니다. bearer token을 보내세요.

- `Authorization: Bearer <token>`

참고:

- `gateway.auth.mode="token"` 인 경우 `gateway.auth.token`(또는 `OPENCLAW_GATEWAY_TOKEN`)을 사용합니다.
- `gateway.auth.mode="password"` 인 경우 `gateway.auth.password`(또는 `OPENCLAW_GATEWAY_PASSWORD`)를 사용합니다.
- `gateway.auth.rateLimit` 이 구성되어 있고 인증 실패가 너무 많이 발생하면, 엔드포인트는 `Retry-After` 와 함께 `429` 를 반환합니다.

## 요청 본문

```json
{
  "tool": "sessions_list",
  "action": "json",
  "args": {},
  "sessionKey": "main",
  "dryRun": false
}
```

필드:

- `tool` (string, required): 호출할 도구 이름입니다.
- `action` (string, optional): 도구 스키마가 `action` 을 지원하고 args payload에 이것이 생략된 경우 args로 매핑됩니다.
- `args` (object, optional): 도구별 인자입니다.
- `sessionKey` (string, optional): 대상 세션 키입니다. 생략되거나 `"main"` 이면 Gateway는 구성된 메인 세션 키를 사용합니다(`session.mainKey` 와 기본 에이전트를 따르며, 전역 범위에서는 `global`).
- `dryRun` (boolean, optional): 향후 사용을 위해 예약되어 있으며, 현재는 무시됩니다.

## 정책 + 라우팅 동작

도구 가용성은 Gateway 에이전트가 사용하는 것과 동일한 정책 체인을 통해 필터링됩니다.

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- group 정책(세션 키가 group 또는 channel에 매핑되는 경우)
- 서브에이전트 정책(서브에이전트 세션 키로 호출하는 경우)

도구가 정책상 허용되지 않으면 엔드포인트는 **404** 를 반환합니다.

Gateway HTTP는 기본적으로 하드 차단 목록도 적용합니다(세션 정책에서 도구를 허용하더라도 적용됨).

- `sessions_spawn`
- `sessions_send`
- `gateway`
- `whatsapp_login`

`gateway.tools` 를 통해 이 차단 목록을 사용자 지정할 수 있습니다.

```json5
{
  gateway: {
    tools: {
      // Additional tools to block over HTTP /tools/invoke
      deny: ["browser"],
      // Remove tools from the default deny list
      allow: ["gateway"],
    },
  },
}
```

group 정책이 컨텍스트를 해석하는 데 도움이 되도록, 선택적으로 다음을 설정할 수 있습니다.

- `x-openclaw-message-channel: <channel>` (예: `slack`, `telegram`)
- `x-openclaw-account-id: <accountId>` (여러 account가 존재하는 경우)

## 응답

- `200` → `{ ok: true, result }`
- `400` → `{ ok: false, error: { type, message } }` (잘못된 요청 또는 도구 입력 오류)
- `401` → unauthorized
- `429` → 인증 rate limit 적용됨 (`Retry-After` 설정됨)
- `404` → 도구를 사용할 수 없음(찾을 수 없거나 허용 목록에 없음)
- `405` → 허용되지 않는 메서드
- `500` → `{ ok: false, error: { type, message } }` (예기치 않은 도구 실행 오류, 민감 정보를 제거한 메시지)

## 예시

```bash
curl -sS http://127.0.0.1:18789/tools/invoke \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "tool": "sessions_list",
    "action": "json",
    "args": {}
  }'
```
