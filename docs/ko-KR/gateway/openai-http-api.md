---
summary: "Gateway에서 OpenAI 호환 /v1/chat/completions HTTP 엔드포인트를 노출합니다"
read_when:
  - OpenAI Chat Completions를 기대하는 도구를 통합할 때
title: "OpenAI Chat Completions"
---

# OpenAI Chat Completions (HTTP)

OpenClaw Gateway는 소규모 OpenAI 호환 Chat Completions 엔드포인트를 제공할 수 있습니다.

이 엔드포인트는 기본적으로 **비활성화**되어 있습니다. 먼저 설정에서 활성화하세요.

- `POST /v1/chat/completions`
- Gateway와 동일한 포트(WS + HTTP 멀티플렉스): `http://<gateway-host>:<port>/v1/chat/completions`

내부적으로 이 요청은 일반 Gateway 에이전트 실행(`openclaw agent`와 동일한 코드 경로)으로 처리되므로, 라우팅, 권한, 설정이 현재 Gateway와 일치합니다.

## Authentication

Gateway 인증 설정을 사용합니다. bearer token을 전송하세요.

- `Authorization: Bearer <token>`

참고:

- `gateway.auth.mode="token"`이면 `gateway.auth.token` 또는 `OPENCLAW_GATEWAY_TOKEN`을 사용합니다.
- `gateway.auth.mode="password"`이면 `gateway.auth.password` 또는 `OPENCLAW_GATEWAY_PASSWORD`를 사용합니다.
- `gateway.auth.rateLimit`이 설정되어 있고 인증 실패가 너무 많으면, 이 엔드포인트는 `Retry-After`와 함께 `429`를 반환합니다.

## Security boundary (important)

이 엔드포인트는 해당 gateway 인스턴스에 대한 **완전한 운영자 접근** 표면으로 취급해야 합니다.

- 여기의 HTTP bearer 인증은 사용자별로 좁게 제한된 범위 모델이 아닙니다.
- 이 엔드포인트에 유효한 Gateway token/password는 소유자 또는 운영자 자격 증명처럼 취급해야 합니다.
- 요청은 신뢰된 운영자 동작과 같은 제어 평면 agent 경로를 통해 실행됩니다.
- 이 엔드포인트에는 별도의 비소유자/사용자별 도구 경계가 없습니다. 호출자가 Gateway 인증을 통과하면, OpenClaw는 그 호출자를 이 gateway의 신뢰된 운영자로 간주합니다.
- 대상 에이전트 정책이 민감한 도구를 허용하면, 이 엔드포인트에서도 해당 도구를 사용할 수 있습니다.
- 이 엔드포인트는 loopback, tailnet, private ingress에서만 사용하세요. 공용 인터넷에 직접 노출하지 마세요.

[Security](/gateway/security) 및 [Remote access](/gateway/remote)를 참고하세요.

## Choosing an agent

커스텀 헤더는 필요 없습니다. OpenAI `model` 필드에 agent id를 넣으면 됩니다.

- `model: "openclaw:<agentId>"` (예: `"openclaw:main"`, `"openclaw:beta"`)
- `model: "agent:<agentId>"` (별칭)

또는 헤더로 특정 OpenClaw agent를 지정할 수 있습니다.

- `x-openclaw-agent-id: <agentId>` (기본값: `main`)

고급 설정:

- 세션 라우팅을 완전히 제어하려면 `x-openclaw-session-key: <sessionKey>`를 사용합니다.

## Enabling the endpoint

`gateway.http.endpoints.chatCompletions.enabled`를 `true`로 설정합니다.

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: { enabled: true },
      },
    },
  },
}
```

## Disabling the endpoint

`gateway.http.endpoints.chatCompletions.enabled`를 `false`로 설정합니다.

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: { enabled: false },
      },
    },
  },
}
```

## Session behavior

기본적으로 이 엔드포인트는 **요청별 무상태(stateless)** 동작을 합니다. 매 호출마다 새로운 session key가 생성됩니다.

요청에 OpenAI `user` 문자열이 포함되면, Gateway는 여기서 안정적인 session key를 파생하므로 반복 호출이 같은 agent 세션을 공유할 수 있습니다.

## Streaming (SSE)

Server-Sent Events(SSE)를 받으려면 `stream: true`를 설정하세요.

- `Content-Type: text/event-stream`
- 각 이벤트 줄은 `data: <json>` 형식입니다.
- 스트림은 `data: [DONE]`으로 종료됩니다.

## Examples

비스트리밍:

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "messages": [{"role":"user","content":"hi"}]
  }'
```

스트리밍:

```bash
curl -N http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "stream": true,
    "messages": [{"role":"user","content":"hi"}]
  }'
```
