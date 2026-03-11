---
summary: "Gateway에서 OpenResponses 호환 /v1/responses HTTP 엔드포인트를 노출합니다"
read_when:
  - OpenResponses API를 사용하는 클라이언트를 통합할 때
  - item 기반 입력, client tool call, SSE 이벤트가 필요할 때
title: "OpenResponses API"
---

# OpenResponses API (HTTP)

OpenClaw Gateway는 OpenResponses 호환 `POST /v1/responses` 엔드포인트를 제공할 수 있습니다.

이 엔드포인트는 기본적으로 **비활성화**되어 있습니다. 먼저 설정에서 활성화하세요.

- `POST /v1/responses`
- Gateway와 동일한 포트(WS + HTTP 멀티플렉스): `http://<gateway-host>:<port>/v1/responses`

내부적으로 요청은 일반 Gateway agent 실행(`openclaw agent`와 동일한 코드 경로)으로 처리되므로, 라우팅, 권한, 설정이 현재 Gateway와 일치합니다.

## Authentication

Gateway 인증 설정을 사용합니다. bearer token을 전송하세요.

- `Authorization: Bearer <token>`

참고:

- `gateway.auth.mode="token"`이면 `gateway.auth.token` 또는 `OPENCLAW_GATEWAY_TOKEN`을 사용합니다.
- `gateway.auth.mode="password"`이면 `gateway.auth.password` 또는 `OPENCLAW_GATEWAY_PASSWORD`를 사용합니다.
- `gateway.auth.rateLimit`이 설정되어 있고 인증 실패가 너무 많으면, 이 엔드포인트는 `Retry-After`와 함께 `429`를 반환합니다.

## Security boundary (important)

이 엔드포인트는 해당 gateway 인스턴스에 대한 **완전한 운영자 접근** 표면으로 취급해야 합니다.

- 여기의 HTTP bearer auth는 사용자별로 좁게 제한된 범위 모델이 아닙니다.
- 이 엔드포인트에 대한 유효한 Gateway token/password는 소유자/운영자 자격 증명처럼 취급해야 합니다.
- 요청은 신뢰된 운영자 동작과 같은 control-plane agent 경로를 통해 실행됩니다.
- 이 엔드포인트에는 별도의 비소유자/사용자별 tool 경계가 없습니다. 호출자가 Gateway 인증을 통과하면 OpenClaw는 그 호출자를 이 gateway의 신뢰된 운영자로 간주합니다.
- 대상 agent policy가 민감한 tool을 허용하면, 이 엔드포인트도 해당 tool을 사용할 수 있습니다.
- 이 엔드포인트는 loopback, tailnet, private ingress에서만 사용하세요. 공용 인터넷에 직접 노출하지 마세요.

[Security](/gateway/security) 및 [Remote access](/gateway/remote)를 참고하세요.

## Choosing an agent

커스텀 헤더는 필요 없습니다. OpenResponses `model` 필드에 agent id를 넣으면 됩니다.

- `model: "openclaw:<agentId>"` (예: `"openclaw:main"`, `"openclaw:beta"`)
- `model: "agent:<agentId>"` (별칭)

또는 헤더로 특정 OpenClaw agent를 지정할 수 있습니다.

- `x-openclaw-agent-id: <agentId>` (기본값: `main`)

고급 설정:

- 세션 라우팅을 완전히 제어하려면 `x-openclaw-session-key: <sessionKey>`를 사용합니다.

## Enabling the endpoint

`gateway.http.endpoints.responses.enabled`를 `true`로 설정합니다.

```json5
{
  gateway: {
    http: {
      endpoints: {
        responses: { enabled: true },
      },
    },
  },
}
```

## Disabling the endpoint

`gateway.http.endpoints.responses.enabled`를 `false`로 설정합니다.

```json5
{
  gateway: {
    http: {
      endpoints: {
        responses: { enabled: false },
      },
    },
  },
}
```

## Session behavior

기본적으로 이 엔드포인트는 **요청별 무상태(stateless)** 입니다. 매 호출마다 새로운 session key가 생성됩니다.

요청에 OpenResponses `user` 문자열이 포함되면, Gateway는 여기서 안정적인 session key를 파생하므로 반복 호출이 같은 agent 세션을 공유할 수 있습니다.

## Request shape (supported)

요청은 item 기반 입력을 사용하는 OpenResponses API 형식을 따릅니다. 현재 지원 항목:

- `input`: 문자열 또는 item object 배열
- `instructions`: system prompt에 병합
- `tools`: client tool 정의(function tool)
- `tool_choice`: client tool 필터 또는 강제
- `stream`: SSE streaming 활성화
- `max_output_tokens`: best-effort 출력 한도(provider별 차이 있음)
- `user`: 안정적인 session routing

허용하지만 **현재 무시하는** 항목:

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `previous_response_id`
- `truncation`

## Items (input)

### `message`

역할: `system`, `developer`, `user`, `assistant`

- `system`과 `developer`는 system prompt에 추가됩니다.
- 가장 최근의 `user` 또는 `function_call_output` item이 “현재 메시지”가 됩니다.
- 그보다 앞선 user/assistant 메시지는 컨텍스트용 history에 포함됩니다.

### `function_call_output` (turn-based tools)

tool 결과를 모델에 다시 전달합니다.

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` and `item_reference`

스키마 호환성을 위해 허용하지만, 프롬프트를 구성할 때는 무시됩니다.

## Tools (client-side function tools)

`tools: [{ type: "function", function: { name, description?, parameters? } }]` 형식으로 tool을 제공합니다.

agent가 tool 호출을 결정하면, 응답은 `function_call` output item을 반환합니다.
이후 `function_call_output`이 포함된 후속 요청을 보내면 턴을 계속 진행할 수 있습니다.

## Images (`input_image`)

base64와 URL source를 모두 지원합니다.

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

현재 허용 MIME type: `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/heic`, `image/heif`
현재 최대 크기: 10MB

## Files (`input_file`)

base64와 URL source를 모두 지원합니다.

```json
{
  "type": "input_file",
  "source": {
    "type": "base64",
    "media_type": "text/plain",
    "data": "SGVsbG8gV29ybGQh",
    "filename": "hello.txt"
  }
}
```

현재 허용 MIME type: `text/plain`, `text/markdown`, `text/html`, `text/csv`, `application/json`, `application/pdf`

현재 최대 크기: 5MB

현재 동작:

- 파일 내용은 user message가 아니라 **system prompt**에 디코딩되어 추가됩니다.
  따라서 session history에는 저장되지 않고 일시적으로만 사용됩니다.
- PDF는 텍스트를 파싱합니다. 텍스트가 거의 없으면 첫 페이지들을 래스터 이미지로 변환해 모델에 전달합니다.

PDF 파싱에는 worker가 필요 없는 Node 친화적 `pdfjs-dist` legacy build를 사용합니다. 최신 PDF.js build는 브라우저 worker/DOM global을 기대하므로 Gateway에서는 사용하지 않습니다.

URL fetch 기본값:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (요청당 URL 기반 `input_file` + `input_image` 총 개수)
- 요청에는 DNS resolution, private IP 차단, redirect 제한, timeout 보호가 적용됩니다.
- 입력 유형별 hostname allowlist도 선택적으로 지원합니다(`files.urlAllowlist`, `images.urlAllowlist`).
  - 정확한 호스트: `"cdn.example.com"`
  - 와일드카드 서브도메인: `"*.assets.example.com"` (apex는 매칭하지 않음)

## File + image limits (config)

기본값은 `gateway.http.endpoints.responses` 아래에서 조정할 수 있습니다.

```json5
{
  gateway: {
    http: {
      endpoints: {
        responses: {
          enabled: true,
          maxBodyBytes: 20000000,
          maxUrlParts: 8,
          files: {
            allowUrl: true,
            urlAllowlist: ["cdn.example.com", "*.assets.example.com"],
            allowedMimes: [
              "text/plain",
              "text/markdown",
              "text/html",
              "text/csv",
              "application/json",
              "application/pdf",
            ],
            maxBytes: 5242880,
            maxChars: 200000,
            maxRedirects: 3,
            timeoutMs: 10000,
            pdf: {
              maxPages: 4,
              maxPixels: 4000000,
              minTextChars: 200,
            },
          },
          images: {
            allowUrl: true,
            urlAllowlist: ["images.example.com"],
            allowedMimes: [
              "image/jpeg",
              "image/png",
              "image/gif",
              "image/webp",
              "image/heic",
              "image/heif",
            ],
            maxBytes: 10485760,
            maxRedirects: 3,
            timeoutMs: 10000,
          },
        },
      },
    },
  },
}
```

생략 시 기본값:

- `maxBodyBytes`: 20MB
- `maxUrlParts`: 8
- `files.maxBytes`: 5MB
- `files.maxChars`: 200k
- `files.maxRedirects`: 3
- `files.timeoutMs`: 10s
- `files.pdf.maxPages`: 4
- `files.pdf.maxPixels`: 4,000,000
- `files.pdf.minTextChars`: 200
- `images.maxBytes`: 10MB
- `images.maxRedirects`: 3
- `images.timeoutMs`: 10s
- HEIC/HEIF `input_image` source는 허용되며 provider로 전달되기 전에 JPEG로 정규화됩니다.

보안 참고:

- URL allowlist는 fetch 전과 redirect hop마다 모두 강제됩니다.
- hostname을 allowlist에 넣어도 private/internal IP 차단은 우회되지 않습니다.
- 인터넷에 노출된 gateway에서는 앱 수준 보호 외에도 네트워크 egress 제어를 적용하세요.
  자세한 내용은 [Security](/gateway/security)를 참고하세요.

## Streaming (SSE)

Server-Sent Events(SSE)를 받으려면 `stream: true`를 설정하세요.

- `Content-Type: text/event-stream`
- 각 이벤트 줄은 `event: <type>`, `data: <json>` 형식입니다.
- 스트림은 `data: [DONE]`으로 종료됩니다.

현재 방출되는 이벤트 타입:

- `response.created`
- `response.in_progress`
- `response.output_item.added`
- `response.content_part.added`
- `response.output_text.delta`
- `response.output_text.done`
- `response.content_part.done`
- `response.output_item.done`
- `response.completed`
- `response.failed` (오류 시)

## Usage

기반 provider가 token 수를 보고하면 `usage`가 채워집니다.

## Errors

오류는 다음과 같은 JSON object를 사용합니다.

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

일반적인 경우:

- `401` 누락되었거나 잘못된 auth
- `400` 잘못된 요청 body
- `405` 잘못된 메서드

## Examples

비스트리밍:

```bash
curl -sS http://127.0.0.1:18789/v1/responses \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "input": "hi"
  }'
```

스트리밍:

```bash
curl -N http://127.0.0.1:18789/v1/responses \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "stream": true,
    "input": "hi"
  }'
```
