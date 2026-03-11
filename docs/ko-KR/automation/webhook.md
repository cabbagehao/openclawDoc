---
summary: "에이전트 깨우기 및 격리된 실행을 위한 외부 웹훅(Webhook) 유입 설정 가이드"
read_when:
  - 새로운 웹훅 엔드포인트를 추가하거나 설정을 변경하고자 할 때
  - 외부 시스템을 OpenClaw와 연동하여 자동화를 구축할 때
title: "웹훅 (Webhooks)"
x-i18n:
  source_path: "automation/webhook.md"
---

# 웹훅 (Webhooks)

Gateway 서버는 외부 트리거를 수신하기 위한 가벼운 HTTP 웹훅(Webhook) 엔드포인트를 노출할 수 있음.

## 활성화 방법

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    // 선택 사항: 명시적인 `agentId` 라우팅을 허용할 목록 지정.
    // 생략하거나 "*" 포함 시 모든 에이전트 허용.
    // [] 설정 시 모든 명시적 에이전트 라우팅 차단.
    allowedAgentIds: ["hooks", "main"],
  },
}
}
```

**참고 사항:**
- `hooks.enabled: true` 설정 시 `hooks.token`은 필수 항목임.
- `hooks.path`의 기본값은 `/hooks`임.

## 인증 (Auth)

모든 웹훅 요청에는 반드시 설정된 훅 토큰이 포함되어야 함. 다음과 같은 헤더 방식 사용을 권장함:

- **`Authorization: Bearer <token>`** (권장)
- **`x-openclaw-token: <token>`**
- 쿼리 스트링 방식(`?token=...`)은 보안을 위해 `400` 오류를 반환하며 거부됨.

---

## 기본 엔드포인트

### `POST /hooks/wake`

메인 세션에 시스템 이벤트를 추가하여 에이전트를 활성화함.

**페이로드 예시:**
```json
{ "text": "시스템 메시지 내용", "mode": "now" }
```

- **`text`** (문자열, 필수): 이벤트에 대한 설명 (예: "새 이메일이 도착했습니다").
- **`mode`** (선택, `now` | `next-heartbeat`): 즉시 하트비트를 트리거할지(기본값 `now`), 다음 예약된 점검 시점까지 기다릴지 결정함.

**동작 결과:**
- **메인(Main)** 세션의 대기열에 시스템 이벤트를 추가함.
- `mode: "now"`인 경우 즉시 하트비트 실행을 유도함.

### `POST /hooks/agent`

별도의 격리된 세션에서 에이전트의 단일 턴을 실행함.

**페이로드 예시:**
```json
{
  "message": "수행할 작업 지시",
  "name": "이메일 알림",
  "agentId": "hooks",
  "sessionKey": "hook:email:msg-123",
  "wakeMode": "now",
  "deliver": true,
  "channel": "last",
  "to": "+821012345678",
  "model": "openai/gpt-4o-mini",
  "thinking": "low",
  "timeoutSeconds": 120
}
```

- **`message`** (문자열, 필수): 에이전트가 처리할 프롬프트 본문.
- **`name`** (문자열, 선택): 훅의 이름 (예: "GitHub"). 세션 요약의 접두사로 사용됨.
- **`agentId`** (문자열, 선택): 특정 에이전트 인스턴스로 라우팅. 알 수 없는 ID는 기본 에이전트로 폴백됨.
- **`sessionKey`** (문자열, 선택): 에이전트 세션을 식별하는 키. 기본적으로 `hooks.allowRequestSessionKey: true`가 아니면 거부됨.
- **`wakeMode`** (선택, `now` | `next-heartbeat`): 즉시 실행할지 여부 결정.
- **`deliver`** (불리언, 선택): 에이전트의 응답을 실제 채팅 채널로 전송할지 여부 (기본값 `true`). 단순 확인 응답은 자동으로 필터링됨.
- **`channel`** / **`to`** (선택): 응답을 전달할 채널 및 수신자 ID. 미지정 시 메인 세션의 마지막 소통 경로를 따름.
- **`model`** / **`thinking`** (선택): 해당 실행에만 적용할 모델 및 사고 수준 오버라이드.

**동작 결과:**
- **격리된(Isolated)** 전용 세션 키를 사용하여 에이전트를 실행함.
- 실행 요약을 항상 **메인 세션**에 기록함.
- `wakeMode: "now"`인 경우 즉시 실행을 시작함.

---

## 세션 키 정책 (보안 정책 변경 안내)

보안 강화를 위해 `/hooks/agent` 요청을 통한 `sessionKey` 오버라이드는 기본적으로 비활성화되어 있음.

- **권장**: `hooks.defaultSessionKey`를 고정하고 요청 기반의 오버라이드는 비활성 상태로 유지함.
- **필요 시**: 오버라이드를 허용하되, `allowedSessionKeyPrefixes`를 통해 접두사를 제한할 것을 강력히 권장함.

**권장 설정 예시:**
```json5
{
  hooks: {
    enabled: true,
    token: "${OPENCLAW_HOOKS_TOKEN}",
    defaultSessionKey: "hook:ingress",
    allowRequestSessionKey: false,
    allowedSessionKeyPrefixes: ["hook:"],
  },
}
```

---

### `POST /hooks/<name>` (커스텀 매핑)

`hooks.mappings` 설정을 통해 임의의 페이로드를 `wake` 또는 `agent` 액션으로 변환할 수 있음.

**매핑 옵션 요약:**
- **`hooks.presets: ["gmail"]`**: 내장된 Gmail 매핑 프리셋 활성화.
- **`hooks.mappings`**: 설정 파일 내에서 매칭 조건, 액션 및 템플릿 정의.
- **JS/TS 변환 모듈**: `hooks.transformsDir` 하위의 모듈을 로드하여 복잡한 로직 처리 가능. (주의: 디렉터리 외부 경로 참조 불가)
- **응답 라우팅**: 매핑 내에 `deliver: true` 및 `channel`/`to` 정보를 포함하여 채팅 채널로 결과 전송 가능.
- **보안**: 훅 페이로드는 기본적으로 신뢰할 수 없는 데이터로 간주되어 안전 경계로 보호됨. 신뢰할 수 있는 내부 소스인 경우에만 `allowUnsafeExternalContent: true`로 해제함.

---

## 응답 코드 (Status Codes)

- **`200`**: 요청 수락 및 실행 시작 (비동기 포함).
- **`401`**: 인증 실패 (잘못된 토큰).
- **`429`**: 동일 클라이언트의 반복된 인증 실패로 인한 속도 제한.
- **`400`**: 페이로드 규격 오류.
- **`413`**: 허용된 페이로드 크기 초과.

## 사용 예시 (curl)

**에이전트 깨우기:**
```bash
curl -X POST http://127.0.0.1:18789/hooks/wake \
  -H 'Authorization: Bearer YOUR_SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"text":"새로운 이메일이 수신되었습니다","mode":"now"}'
```

**격리된 에이전트 실행:**
```bash
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'x-openclaw-token: YOUR_SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"message":"받은 편지함 요약해줘","name":"Email","model":"openai/gpt-4o-mini"}'
```

## 보안 가이드라인

- 웹훅 엔드포인트는 루프백(Loopback), Tailnet 또는 신뢰할 수 있는 리버스 프록시 뒤에 배치함.
- 반드시 전용 훅 토큰을 사용하며, Gateway 인증 토큰을 재사용하지 않음.
- 멀티 에이전트 환경에서는 `hooks.allowedAgentIds`를 설정하여 접근 가능한 에이전트를 제한함.
- `hooks.allowRequestSessionKey`는 가급적 `false`로 유지하며, 필요한 경우에만 특정 접두사로 제한함.
- 훅 페이로드는 기본적으로 위험한 콘텐츠로 간주되므로, 반드시 필요한 경우가 아니라면 외부 콘텐츠 안전 래퍼를 유지함.
