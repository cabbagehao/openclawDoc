---
summary: "Gateway를 통해 OpenResponses 규격의 /v1/responses HTTP 엔드포인트를 노출하는 방법 안내"
read_when:
  - OpenResponses API를 사용하는 클라이언트와 통합하고자 할 때
  - 아이템 기반 입력, 클라이언트 측 도구 호출(Client tool call), 또는 SSE 이벤트 기능이 필요할 때
title: "OpenResponses API"
x-i18n:
  source_path: "gateway/openresponses-http-api.md"
---

# OpenResponses API (HTTP)

OpenClaw Gateway는 OpenResponses 규격을 따르는 `POST /v1/responses` 엔드포인트를 제공함.

이 엔드포인트는 보안을 위해 **기본적으로 비활성화**되어 있으며, 사용 전 설정 파일에서 활성화해야 함.

* **엔드포인트**: `POST /v1/responses`
* **접속 주소**: `http://<gateway-host>:<port>/v1/responses` (Gateway WebSocket과 동일한 멀티플렉스 포트 사용)

내부적으로 이 요청은 일반적인 Gateway 에이전트 실행(`openclaw agent`와 동일한 로직)으로 처리됨. 따라서 라우팅 정책, 도구 권한 및 모든 에이전트 설정이 현재 Gateway 구성과 동일하게 적용됨.

## 인증 (Authentication)

Gateway에 설정된 인증 방식을 그대로 사용하며, HTTP Bearer 토큰을 헤더에 포함하여 전송함:

* `Authorization: Bearer <token>`

**참고 사항:**

* `gateway.auth.mode="token"`인 경우 `gateway.auth.token` (또는 `OPENCLAW_GATEWAY_TOKEN` 환경 변수) 값을 사용함.
* `gateway.auth.mode="password"`인 경우 `gateway.auth.password` (또는 `OPENCLAW_GATEWAY_PASSWORD` 환경 변수) 값을 사용함.
* `gateway.auth.rateLimit`이 설정되어 있고 인증 실패 횟수가 초과되면 `429` (Too Many Requests) 오류와 함께 `Retry-After` 헤더를 반환함.

## 보안 경계 (중요)

이 엔드포인트는 해당 Gateway 인스턴스에 대한 \*\*전체 운영자 권한(Full operator-access)\*\*을 가진 인터페이스로 간주해야 함.

* 여기서 사용하는 HTTP Bearer 인증은 일반 사용자를 위한 제한된 범위의 권한 모델이 아님.
* 유효한 토큰이나 비밀번호를 가진 호출자는 시스템 소유자 또는 운영자와 동일한 수준의 권한을 가진 것으로 처리됨.
* 모든 요청은 신뢰할 수 있는 운영자의 작업과 동일한 제어 플레인 에이전트 경로를 통해 실행됨.
* 호출자가 인증을 통과하면 OpenClaw는 해당 호출자를 완전한 신뢰 주체로 간주하므로, 에이전트 정책에서 허용하는 모든 민감한 도구(Exec, File 등)를 사용할 수 있음.
* **보안 권고**: 이 엔드포인트를 공용 인터넷에 직접 노출하지 말고, 루프백(Loopback), Tailnet 또는 신뢰할 수 있는 전용 인그레스(Ingress) 환경에서만 사용하기 바람.

상세 내용은 [보안 가이드](/gateway/security) 및 [원격 액세스](/gateway/remote) 참조.

## 에이전트 선택 방법

별도의 커스텀 헤더 없이 OpenResponses `model` 필드에 에이전트 ID를 포함하여 대상을 지정할 수 있음:

* `model: "openclaw:<agentId>"` (예: `"openclaw:main"`, `"openclaw:beta"`)
* `model: "agent:<agentId>"` (별칭 형식)

또는 전용 헤더를 사용하여 에이전트를 명시적으로 지정할 수도 있음:

* `x-openclaw-agent-id: <agentId>` (기본값: `main`)

**심화 라우팅:**

* 특정 대화 세션으로 직접 라우팅하려면 `x-openclaw-session-key: <sessionKey>` 헤더를 사용함.

## 엔드포인트 활성화 설정

`gateway.http.endpoints.responses.enabled` 값을 `true`로 설정함:

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

## 엔드포인트 비활성화 설정

기능을 끄려면 해당 값을 `false`로 설정함 (또는 해당 섹션 삭제):

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

## 세션 동작 정책

기본적으로 이 엔드포인트는 **요청별 무상태(Stateless)** 방식으로 작동하며, 매 호출 시마다 새로운 세션 키가 생성됨.

만약 요청 본문에 OpenResponses 규격의 `user` 문자열이 포함되어 있다면, Gateway는 해당 값을 기반으로 고정된 세션 키를 생성함. 이를 통해 동일한 사용자의 반복 호출이 하나의 에이전트 세션(대화 맥락)을 공유하도록 구성할 수 있음.

## 요청 형식 (지원 범위)

요청 본문은 아이템(Item) 기반 입력을 사용하는 OpenResponses API 규격을 따름. 현재 지원되는 항목은 다음과 같음:

* **`input`**: 문자열 또는 아이템 객체 배열.
* **`instructions`**: 시스템 프롬프트에 병합됨.
* **`tools`**: 클라이언트 측 함수 도구 정의.
* **`tool_choice`**: 클라이언트 도구 호출 필터링 또는 강제.
* **`stream`**: SSE 스트리밍 활성화.
* **`max_output_tokens`**: 출력 토큰 제한 (공급자 사양에 의존).
* **`user`**: 고정 세션 라우팅용 식별자.

**현재 무시되는 항목** (스키마 호환성만 유지): `max_tool_calls`, `reasoning`, `metadata`, `store`, `previous_response_id`, `truncation`.

## 아이템 타입 (입력)

### `message`

* **역할(Role)**: `system`, `developer`, `user`, `assistant`.
* `system` 및 `developer` 메시지는 시스템 프롬프트에 추가됨.
* 가장 최근의 `user` 또는 `function_call_output` 아이템이 "현재 메시지"가 됨.
* 이전의 `user`/`assistant` 메시지들은 대화 이력(History) 컨텍스트로 포함됨.

### `function_call_output` (턴 기반 도구 결과)

외부에서 실행된 도구 결과값을 모델에 다시 전달함:

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

## 도구 (클라이언트 측 함수 도구)

`tools` 배열 내에 `type: "function"` 형식을 사용하여 도구를 정의함. 에이전트가 도구 호출을 결정하면 응답 본문에 `function_call` 타입의 아이템이 반환됨. 호출자는 해당 도구를 실행한 후 `function_call_output` 아이템을 포함한 후속 요청을 보내 대화를 이어가야 함.

## 이미지 입력 (`input_image`)

Base64 데이터 또는 공개 URL 소스를 지원함:

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

* **허용 MIME 타입**: `image/jpeg`, `png`, `gif`, `webp`, `heic`, `heif`.
* **최대 용량**: 10MB.
* **참고**: HEIC/HEIF 이미지는 공급자에게 전달되기 전 JPEG로 자동 변환됨.

## 파일 입력 (`input_file`)

문서나 텍스트 파일을 Base64 또는 URL 소스로 전달함:

```json
{
  "type": "input_file",
  "source": {
    "type": "base64",
    "media_type": "application/pdf",
    "data": "...",
    "filename": "report.pdf"
  }
}
```

* **허용 MIME 타입**: `text/plain`, `markdown`, `html`, `csv`, `application/json`, `application/pdf`.
* **최대 용량**: 5MB.
* **동작 특징**: 파일 내용은 에이전트 메인 메시지가 아닌 **시스템 프롬프트**에 디코딩되어 추가됨. 따라서 세션 이력에 영구 저장되지 않는 일시적인 컨텍스트로 취급됨.
* **PDF 처리**: 텍스트를 우선 파싱하며, 텍스트가 부족한 경우 앞부분 페이지를 이미지로 래스터화하여 모델에 전달함. (Node 환경에 최적화된 `pdfjs-dist` 라이브러리 사용)

## 파일 및 이미지 제한 설정

`gateway.http.endpoints.responses` 하위에서 세부 제한 수치를 조정할 수 있음:

```json5
{
  gateway: {
    http: {
      endpoints: {
        responses: {
          enabled: true,
          maxBodyBytes: 20000000, // 요청 전체 최대 크기 (20MB)
          maxUrlParts: 8, // URL 기반 입력 최대 개수
          files: {
            allowUrl: true,
            maxBytes: 5242880, // 파일당 최대 크기 (5MB)
            maxChars: 200000, // 텍스트 추출 최대 글자 수
            timeoutMs: 10000,
            pdf: {
              maxPages: 4, // PDF 최대 처리 페이지 수
              minTextChars: 200,
            },
          },
          images: {
            allowUrl: true,
            maxBytes: 10485760, // 이미지당 최대 크기 (10MB)
            timeoutMs: 10000,
          },
        },
      },
    },
  },
}
```

**보안 주의:**

* URL 허용 목록(`urlAllowlist`)은 실제 호출 전과 리다이렉트 과정에서 모두 검증됨.
* 호스트명을 허용 목록에 추가하더라도 내부/사설 IP 대역에 대한 접근은 자동으로 차단됨.

## 스트리밍 지원 (SSE)

`stream: true` 설정 시 다음과 같은 이벤트 타입이 서버-전송 이벤트(SSE) 형식으로 방출됨:

* `response.created` / `in_progress`
* `response.output_item.added` / `done`
* `response.content_part.added` / `done`
* `response.output_text.delta` / `done`
* `response.completed`
* `response.failed` (오류 발생 시)

응답 스트림은 `data: [DONE]` 메시지로 종료됨.

## 오류 형식

오류 발생 시 다음과 같은 JSON 구조를 반환함:

```json
{ "error": { "message": "오류 메시지", "type": "invalid_request_error" } }
```

* **401**: 인증 정보 누락 또는 유효하지 않음.
* **400**: 잘못된 요청 본문 형식.
* **405**: 지원하지 않는 HTTP 메서드.

## 사용 예시

### 일반 응답 (Non-streaming)

```bash
curl -sS http://127.0.0.1:18789/v1/responses \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "input": "반가워"
  }'
```

### 스트리밍 응답 (Streaming)

```bash
curl -N http://127.0.0.1:18789/v1/responses \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "stream": true,
    "input": "오늘의 주요 뉴스 요약해줘"
  }'
```
