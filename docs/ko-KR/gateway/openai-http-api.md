---
summary: "Gateway를 통해 OpenAI 규격의 /v1/chat/completions HTTP 엔드포인트를 노출하는 방법 안내"
read_when:
  - OpenAI Chat Completions 형식을 요구하는 외부 도구와 통합하고자 할 때
title: "OpenAI 호환 API (HTTP)"
x-i18n:
  source_path: "gateway/openai-http-api.md"
---

# OpenAI Chat Completions (HTTP)

OpenClaw Gateway는 OpenAI 규격을 따르는 소규모 Chat Completions 엔드포인트를 제공함.

이 엔드포인트는 보안을 위해 **기본적으로 비활성화**되어 있으며, 사용 전 설정 파일에서 활성화해야 함.

- **엔드포인트**: `POST /v1/chat/completions`
- **접속 주소**: `http://<gateway-host>:<port>/v1/chat/completions` (Gateway WebSocket과 동일한 멀티플렉스 포트 사용)

내부적으로 이 요청은 일반적인 Gateway 에이전트 실행(`openclaw agent`와 동일한 로직)으로 처리됨. 따라서 라우팅 정책, 도구 권한 및 모든 에이전트 설정이 현재 Gateway 구성과 동일하게 적용됨.

## 인증 (Authentication)

Gateway에 설정된 인증 방식을 그대로 사용하며, HTTP Bearer 토큰을 헤더에 포함하여 전송함:

- `Authorization: Bearer <token>`

**참고 사항:**
- `gateway.auth.mode="token"`인 경우 `gateway.auth.token` (또는 `OPENCLAW_GATEWAY_TOKEN` 환경 변수) 값을 사용함.
- `gateway.auth.mode="password"`인 경우 `gateway.auth.password` (또는 `OPENCLAW_GATEWAY_PASSWORD` 환경 변수) 값을 사용함.
- `gateway.auth.rateLimit`이 설정되어 있고 인증 실패 횟수가 초과되면 `429` (Too Many Requests) 오류와 함께 `Retry-After` 헤더를 반환함.

## 보안 경계 (중요)

이 엔드포인트는 해당 Gateway 인스턴스에 대한 **전체 운영자 권한(Full operator-access)**을 가진 인터페이스로 간주해야 함.

- 여기서 사용하는 HTTP Bearer 인증은 일반 사용자를 위한 제한된 범위의 권한 모델이 아님.
- 유효한 토큰이나 비밀번호를 가진 호출자는 시스템 소유자 또는 운영자와 동일한 수준의 권한을 가진 것으로 처리됨.
- 모든 요청은 신뢰할 수 있는 운영자의 작업과 동일한 제어 플레인 에이전트 경로를 통해 실행됨.
- 호출자가 인증을 통과하면 OpenClaw는 해당 호출자를 완전한 신뢰 주체로 간주하므로, 에이전트 정책에서 허용하는 모든 민감한 도구(Exec, File 등)를 사용할 수 있음.
- **보안 권고**: 이 엔드포인트를 공용 인터넷에 직접 노출하지 말고, 루프백(Loopback), Tailnet 또는 신뢰할 수 있는 전용 인그레스(Ingress) 환경에서만 사용하기 바람.

상세 내용은 [보안 가이드](/gateway/security) 및 [원격 액세스](/gateway/remote) 참조.

## 에이전트 선택 방법

별도의 커스텀 헤더 없이 OpenAI `model` 필드에 에이전트 ID를 포함하여 대상을 지정할 수 있음:

- `model: "openclaw:<agentId>"` (예: `"openclaw:main"`, `"openclaw:dev"`)
- `model: "agent:<agentId>"` (별칭 형식)

또는 전용 헤더를 사용하여 에이전트를 명시적으로 지정할 수도 있음:

- `x-openclaw-agent-id: <agentId>` (기본값: `main`)

**심화 라우팅:**
- 특정 대화 세션으로 직접 라우팅하려면 `x-openclaw-session-key: <sessionKey>` 헤더를 사용함.

## 엔드포인트 활성화 설정

`gateway.http.endpoints.chatCompletions.enabled` 값을 `true`로 설정함:

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

## 엔드포인트 비활성화 설정

기능을 끄려면 해당 값을 `false`로 설정함 (또는 해당 섹션 삭제):

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

## 세션 동작 정책

기본적으로 이 엔드포인트는 **요청별 무상태(Stateless)** 방식으로 작동하며, 매 호출 시마다 새로운 세션 키가 생성됨.

만약 요청 본문에 OpenAI 규격의 `user` 문자열이 포함되어 있다면, Gateway는 해당 값을 기반으로 고정된 세션 키를 생성함. 이를 통해 동일한 사용자의 반복 호출이 하나의 에이전트 세션(대화 맥락)을 공유하도록 구성할 수 있음.

## 스트리밍 지원 (SSE)

`stream: true` 옵션을 설정하면 서버-전송 이벤트(SSE) 방식으로 실시간 응답을 받을 수 있음:

- **Content-Type**: `text/event-stream`
- 각 이벤트 라인은 `data: <json>` 형식으로 구성됨.
- 스트림의 끝은 `data: [DONE]` 토큰으로 표시됨.

## 사용 예시

### 일반 응답 (Non-streaming)

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "messages": [{"role":"user","content":"안녕"}]
  }'
```

### 스트리밍 응답 (Streaming)

```bash
curl -N http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "stream": true,
    "messages": [{"role":"user","content":"오늘 날씨 알려줘"}]
  }'
```
