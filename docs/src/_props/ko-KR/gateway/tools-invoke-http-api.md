---
summary: "Gateway HTTP 엔드포인트를 통해 단일 도구를 직접 호출하는 방법 안내"
read_when:
  - 전체 에이전트 실행 없이 특정 도구만 개별적으로 호출하고자 할 때
  - 도구 정책(Tool Policy) 강제가 필요한 자동화 워크플로를 구축할 때
title: "도구 호출 API (HTTP)"
x-i18n:
  source_path: "gateway/tools-invoke-http-api.md"
---

# 도구 호출 (Tools Invoke HTTP API)

OpenClaw Gateway는 단일 도구를 직접 호출할 수 있는 간단한 HTTP 엔드포인트를 제공함. 이 기능은 항상 활성화되어 있으나, Gateway 인증 및 도구 정책에 의해 접근이 제어됨.

* **엔드포인트**: `POST /tools/invoke`
* **접속 주소**: `http://<gateway-host>:<port>/tools/invoke` (Gateway WebSocket과 동일한 멀티플렉스 포트 사용)

기본 최대 페이로드 크기는 **2MB**임.

## 인증 (Authentication)

Gateway에 설정된 인증 구성을 따름. HTTP 헤더에 Bearer 토큰을 포함하여 전송함:

* `Authorization: Bearer <token>`

**참고 사항:**

* `gateway.auth.mode="token"`인 경우 `gateway.auth.token` (또는 `OPENCLAW_GATEWAY_TOKEN` 환경 변수) 값을 사용함.
* `gateway.auth.mode="password"`인 경우 `gateway.auth.password` (또는 `OPENCLAW_GATEWAY_PASSWORD` 환경 변수) 값을 사용함.
* `gateway.auth.rateLimit`이 설정되어 있고 인증 실패 횟수가 초과되면 `429` (Too Many Requests) 오류와 함께 `Retry-After` 헤더를 반환함.

## 요청 본문 (Request Body)

```json
{
  "tool": "sessions_list",
  "action": "json",
  "args": {},
  "sessionKey": "main",
  "dryRun": false
}
```

**주요 필드:**

* **`tool`** (문자열, 필수): 호출할 도구의 이름.
* **`action`** (문자열, 선택): 도구 스키마가 `action`을 지원하고 `args` 페이로드에서 이를 누락한 경우, 이 값이 인자로 매핑됨.
* **`args`** (객체, 선택): 도구별 실행 인자.
* **`sessionKey`** (문자열, 선택): 대상 세션 키. 생략하거나 `"main"`으로 지정할 경우, Gateway에 설정된 메인 세션 키(`session.mainKey` 및 기본 에이전트 기준, 전역 스코프에서는 `global`)를 사용함.
* **`dryRun`** (불리언, 선택): 향후 사용을 위해 예약된 필드이며 현재는 무시됨.

## 정책 및 라우팅 동작

도구의 가용성은 Gateway 에이전트와 동일한 정책 체인을 통해 필터링됨:

* `tools.profile` / `tools.byProvider.profile` (기본 프로필)
* `tools.allow` / `tools.deny` (전역 허용/차단)
* `agents.<id>.tools.*` (에이전트별 정책)
* 그룹 정책 (세션 키가 그룹이나 채널에 매핑된 경우)
* 서브에이전트 정책 (서브에이전트 세션 키 사용 시)

정책에 의해 실행이 거부된 도구를 호출할 경우 **404** 오류를 반환함.

### HTTP 전용 차단 목록 (Hard Deny List)

Gateway HTTP 인터페이스는 세션 정책과 관계없이 보안을 위해 다음 도구들을 기본적으로 차단함:

* `sessions_spawn`
* `sessions_send`
* `gateway`
* `whatsapp_login`

이 차단 목록은 `gateway.tools` 설정을 통해 사용자 지정할 수 있음:

```json5
{
  gateway: {
    tools: {
      // HTTP 호출 시 추가로 차단할 도구
      deny: ["browser"],
      // 기본 차단 목록에서 도구 제외 (허용)
      allow: ["gateway"],
    },
  },
}
```

그룹 정책의 맥락(Context) 해석을 돕기 위해 다음 헤더를 선택적으로 포함할 수 있음:

* `x-openclaw-message-channel`: 채널 ID (예: `slack`, `telegram`).
* `x-openclaw-account-id`: 다중 계정 사용 시 계정 ID.

## 응답 규격 (Responses)

* **`200`**: `{ ok: true, result }` (성공)
* **`400`**: `{ ok: false, error: { type, message } }` (잘못된 요청 또는 도구 입력 오류)
* **`401`**: 인증 실패 (Unauthorized)
* **`429`**: 인증 횟수 제한 초과 (Retry-After 포함)
* **`404`**: 도구를 찾을 수 없거나 정책에 의해 차단됨
* **`405`**: 지원하지 않는 HTTP 메서드
* **`500`**: `{ ok: false, error: { type, message } }` (도구 실행 중 예기치 않은 오류 발생, 메시지는 마스킹 처리됨)

## 사용 예시

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
