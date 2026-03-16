---
summary: "Gateway HTTP 엔드포인트를 통해 단일 도구를 직접 호출하는 방법 안내"
description: "Gateway의 `/tools/invoke` HTTP endpoint에서 single-tool calls를 실행할 때 필요한 auth, policy, request body, responses를 설명합니다."
read_when:
  - "전체 agent turn 없이 특정 tool만 호출할 때"
  - "tool policy enforcement가 필요한 automation을 구축할 때"
title: "도구 호출 API"
x-i18n:
  source_path: "gateway/tools-invoke-http-api.md"
---

# Tools Invoke (HTTP)

OpenClaw Gateway는 single tool을 직접 호출할 수 있는 간단한 HTTP endpoint를 제공합니다. 이 기능은 항상 활성화되어 있지만, Gateway auth와 tool policy로 보호됩니다.

- `POST /tools/invoke`
- Gateway와 같은 포트(WS + HTTP multiplex): `http://<gateway-host>:<port>/tools/invoke`

기본 최대 payload 크기는 **2 MB**입니다.

## Authentication

Gateway auth configuration을 사용합니다. bearer token을 보내세요.

- `Authorization: Bearer <token>`

Notes:
- `gateway.auth.mode="token"`이면 `gateway.auth.token` (또는 `OPENCLAW_GATEWAY_TOKEN`)을 사용합니다.
- `gateway.auth.mode="password"`이면 `gateway.auth.password` (또는 `OPENCLAW_GATEWAY_PASSWORD`)를 사용합니다.
- `gateway.auth.rateLimit`이 설정되어 있고 auth failures가 너무 많으면 `429`와 `Retry-After`를 반환합니다.

## Request body

```json
{
  "tool": "sessions_list",
  "action": "json",
  "args": {},
  "sessionKey": "main",
  "dryRun": false
}
```

Fields:
- `tool` (string, required): 호출할 tool name
- `action` (string, optional): tool schema가 `action`을 지원하고 args가 이를 생략한 경우 args에 매핑
- `args` (object, optional): tool-specific arguments
- `sessionKey` (string, optional): target session key. 생략하거나 `"main"`이면 configured main session key를 사용합니다 (`session.mainKey`, default agent, 또는 global scope의 `global`)
- `dryRun` (boolean, optional): future use reserved field이며 현재는 무시됩니다.

## Policy + routing behavior

tool availability는 Gateway agents와 같은 policy chain을 통과합니다.

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- group policies (session key가 group 또는 channel에 매핑될 때)
- subagent policy (subagent session key를 사용할 때)

policy에 의해 허용되지 않은 tool을 호출하면 **404**를 반환합니다.

Gateway HTTP는 세션 policy가 허용하더라도 다음 hard deny list를 기본 적용합니다.
- `sessions_spawn`
- `sessions_send`
- `gateway`
- `whatsapp_login`

이 deny list는 `gateway.tools`로 조정할 수 있습니다.

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

group policies가 context를 해석할 수 있도록 다음 headers를 선택적으로 포함할 수 있습니다.
- `x-openclaw-message-channel: <channel>` (예: `slack`, `telegram`)
- `x-openclaw-account-id: <accountId>` (다중 accounts가 있을 때)

## Responses

- `200` → `{ ok: true, result }`
- `400` → `{ ok: false, error: { type, message } }` (잘못된 request 또는 tool input error)
- `401` → unauthorized
- `429` → auth rate-limited (`Retry-After` 포함)
- `404` → tool not available (not found 또는 not allowlisted)
- `405` → method not allowed
- `500` → `{ ok: false, error: { type, message } }` (unexpected tool execution error; sanitized message)

## Example

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
