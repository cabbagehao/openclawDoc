---
description: "OpenResponses /v1/responses 엔드포인트 추가와 Chat Completions 폐기 경로를 정리한 게이트웨이 계획입니다"
summary: "계획: OpenResponses /v1/responses 엔드포인트를 추가하고 chat completions 를 깔끔하게 폐기"
read_when:
  - "`/v1/responses` gateway 지원을 설계하거나 구현할 때"
  - Chat Completions 호환성에서의 마이그레이션을 계획할 때
owner: "openclaw"
status: "draft"
last_updated: "2026-01-19"
title: "OpenResponses Gateway 계획"
x-i18n:
  source_path: "experiments/plans/openresponses-gateway.md"
---

# OpenResponses Gateway 통합 계획

## 맥락

OpenClaw Gateway 는 현재 `/v1/chat/completions` 에서 최소한의 OpenAI 호환 Chat Completions 엔드포인트를 노출한다([OpenAI Chat Completions](/gateway/openai-http-api) 참고).

Open Responses 는 OpenAI Responses API 를 기반으로 한 공개 추론 표준이다. 에이전트형 워크플로를 위해 설계되었으며 item 기반 입력과 의미론적 스트리밍 이벤트를 사용한다. OpenResponses 사양은 `/v1/chat/completions` 가 아니라 `/v1/responses` 를 정의한다.

## 목표

- OpenResponses 의미론을 따르는 `/v1/responses` 엔드포인트를 추가한다.
- Chat Completions 는 쉽게 비활성화하고 결국 제거할 수 있는 호환 계층으로 유지한다.
- 검증과 파싱을 격리되고 재사용 가능한 스키마로 표준화한다.

## 비목표

- 첫 단계에서 OpenResponses 전체 기능(images, files, hosted tools)까지 모두 맞추지는 않는다.
- 내부 에이전트 실행 로직이나 tool orchestration 을 교체하지 않는다.
- 첫 단계에서는 기존 `/v1/chat/completions` 동작을 변경하지 않는다.

## 리서치 요약

출처: OpenResponses OpenAPI, OpenResponses specification site, Hugging Face 블로그 글.

추출된 핵심 사항:

- `POST /v1/responses` 는 `model`, `input` (string 또는 `ItemParam[]`), `instructions`, `tools`, `tool_choice`, `stream`, `max_output_tokens`, `max_tool_calls` 같은 `CreateResponseBody` 필드를 받는다.
- `ItemParam` 은 다음에 대한 discriminated union 이다.
  - 역할이 `system`, `developer`, `user`, `assistant` 인 `message` 항목
  - `function_call`, `function_call_output`
  - `reasoning`
  - `item_reference`
- 성공 응답은 `object: "response"`, `status`, `output` 항목을 가진 `ResponseResource` 를 반환한다.
- 스트리밍은 다음과 같은 의미론적 이벤트를 사용한다.
  - `response.created`, `response.in_progress`, `response.completed`, `response.failed`
  - `response.output_item.added`, `response.output_item.done`
  - `response.content_part.added`, `response.content_part.done`
  - `response.output_text.delta`, `response.output_text.done`
- 사양은 다음을 요구한다.
  - `Content-Type: text/event-stream`
  - `event:` 값은 JSON 의 `type` 필드와 일치해야 함
  - 종료 이벤트는 문자 그대로 `[DONE]` 이어야 함
- reasoning 항목은 `content`, `encrypted_content`, `summary` 를 노출할 수 있다.
- HF 예제는 요청에 `OpenResponses-Version: latest` 헤더를 포함한다(선택 사항).

## 제안 아키텍처

- Zod 스키마만 담는 `src/gateway/open-responses.schema.ts` 를 추가한다(gateway import 없음).
- `/v1/responses` 용으로 `src/gateway/openresponses-http.ts` (또는 `open-responses-http.ts`)를 추가한다.
- `src/gateway/openai-http.ts` 는 레거시 호환 어댑터로 유지한다.
- 설정 `gateway.http.endpoints.responses.enabled` 를 추가한다(기본값 `false`).
- `gateway.http.endpoints.chatCompletions.enabled` 는 독립적으로 유지하여 두 엔드포인트를 별도로 토글할 수 있게 한다.
- Chat Completions 가 활성화되어 있으면 시작 시 레거시 상태를 알리는 경고를 출력한다.

## Chat Completions 폐기 경로

- 엄격한 모듈 경계를 유지한다. responses 와 chat completions 가 스키마 타입을 공유하지 않도록 한다.
- Chat Completions 는 설정 기반 opt-in 으로 만들어 코드 변경 없이 비활성화 가능하게 한다.
- `/v1/responses` 가 안정화되면 문서에서 Chat Completions 를 레거시로 표시한다.
- 향후 선택 과제로, 제거 경로를 단순화하기 위해 Chat Completions 요청을 Responses 핸들러로 매핑할 수 있다.

## Phase 1 지원 범위

- `input` 으로 string 또는 message 역할과 `function_call_output` 을 포함한 `ItemParam[]` 을 받는다.
- system 및 developer 메시지를 `extraSystemPrompt` 로 추출한다.
- 에이전트 실행 시 가장 최근의 `user` 또는 `function_call_output` 을 현재 메시지로 사용한다.
- 지원하지 않는 content part(image/file)는 `invalid_request_error` 로 거부한다.
- `output_text` 콘텐츠를 담은 단일 assistant 메시지를 반환한다.
- 토큰 집계가 연결되기 전까지 `usage` 는 0 값으로 반환한다.

## 검증 전략(SDK 없이)

- 다음 지원 범위에 대한 Zod 스키마를 구현한다.
  - `CreateResponseBody`
  - `ItemParam` + message content part union
  - `ResponseResource`
  - gateway 가 사용하는 streaming event shape
- 드리프트를 막고 향후 코드 생성을 쉽게 하도록 스키마는 하나의 격리된 모듈에 둔다.

## 스트리밍 구현(Phase 1)

- SSE 라인에 `event:` 와 `data:` 를 모두 포함한다.
- 요구되는 최소 시퀀스:
  - `response.created`
  - `response.output_item.added`
  - `response.content_part.added`
  - `response.output_text.delta` (필요한 만큼 반복)
  - `response.output_text.done`
  - `response.content_part.done`
  - `response.completed`
  - `[DONE]`

## 테스트 및 검증 계획

- `/v1/responses` 에 대한 e2e 커버리지를 추가한다.
  - 인증 필요
  - 비스트림 응답 형태
  - 스트림 이벤트 순서와 `[DONE]`
  - 헤더와 `user` 를 이용한 세션 라우팅
- `src/gateway/openai-http.test.ts` 는 변경하지 않는다.
- 수동 확인: `stream: true` 로 `/v1/responses` 에 curl 을 보내고 이벤트 순서와 종료 `[DONE]` 를 검증한다.

## 문서 업데이트(후속)

- `/v1/responses` 사용법과 예제를 위한 새 문서 페이지를 추가한다.
- `/gateway/openai-http-api` 를 업데이트해 레거시 안내와 `/v1/responses` 포인터를 추가한다.
