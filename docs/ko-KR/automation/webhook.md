---
summary: "wake 및 isolated agent 실행을 위한 webhook 입력"
read_when:
  - webhook 엔드포인트를 추가하거나 변경할 때
  - 외부 시스템을 OpenClaw에 연결할 때
title: "웹훅"
x-i18n:
  source_path: "automation/webhook.md"
---

# 웹훅

Gateway는 외부 트리거를 위한 작은 HTTP webhook 엔드포인트를 노출할 수 있습니다.

## 활성화

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    // 선택 사항: 명시적 `agentId` 라우팅을 이 허용 목록으로 제한
    // 생략하거나 "*"를 포함하면 모든 agent 허용
    // []로 설정하면 모든 명시적 `agentId` 라우팅 거부
    allowedAgentIds: ["hooks", "main"],
  },
}
```

참고:

- `hooks.token`은 `hooks.enabled=true`일 때 필수입니다.
- `hooks.path` 기본값은 `/hooks`입니다.

## 인증

모든 요청은 hook token을 포함해야 합니다. 가능하면 헤더를 사용하세요.

- `Authorization: Bearer <token>` (권장)
- `x-openclaw-token: <token>`
- 쿼리 문자열 token은 거부됩니다(`?token=...`은 `400` 반환).

## 엔드포인트

### `POST /hooks/wake`

페이로드:

```json
{ "text": "System line", "mode": "now" }
```

- `text` **필수** (string): 이벤트 설명(예: `"New email received"`)
- `mode` 선택 (`now` | `next-heartbeat`): 즉시 heartbeat를 트리거할지(기본값 `now`), 다음 주기 점검까지 기다릴지

효과:

- **main** session에 system event를 큐잉
- `mode=now`이면 즉시 heartbeat를 트리거

### `POST /hooks/agent`

페이로드:

```json
{
  "message": "Run this",
  "name": "Email",
  "agentId": "hooks",
  "sessionKey": "hook:email:msg-123",
  "wakeMode": "now",
  "deliver": true,
  "channel": "last",
  "to": "+15551234567",
  "model": "openai/gpt-5.2-mini",
  "thinking": "low",
  "timeoutSeconds": 120
}
```

- `message` **필수** (string): 에이전트가 처리할 프롬프트 또는 메시지
- `name` 선택 (string): 사람이 읽기 쉬운 hook 이름(예: `"GitHub"`). session 요약의 접두사로 사용
- `agentId` 선택 (string): 특정 agent로 이 hook을 라우팅. 알 수 없는 ID는 기본 agent로 폴백. 설정 시, 해석된 agent의 workspace와 구성을 사용해 hook 실행
- `sessionKey` 선택 (string): 에이전트 session을 식별하는 키. 기본적으로 `hooks.allowRequestSessionKey=true`가 아니면 거부
- `wakeMode` 선택 (`now` | `next-heartbeat`): 즉시 heartbeat를 트리거할지(기본값 `now`), 다음 주기 점검까지 기다릴지
- `deliver` 선택 (boolean): `true`이면 에이전트 응답을 메시징 채널로 전송. 기본값 `true`. 단순 heartbeat 확인 응답만 있는 경우 자동 건너뜀
- `channel` 선택 (string): 전달용 메시징 채널. `last`, `whatsapp`, `telegram`, `discord`, `slack`, `mattermost`(플러그인), `signal`, `imessage`, `msteams` 중 하나. 기본값 `last`
- `to` 선택 (string): 채널별 수신자 식별자(예: WhatsApp/Signal은 전화번호, Telegram은 chat ID, Discord/Slack/Mattermost(플러그인)는 channel ID, MS Teams는 conversation ID). 기본값은 main session의 마지막 수신자
- `model` 선택 (string): 모델 override(예: `anthropic/claude-3-5-sonnet` 또는 alias). 제한이 있다면 허용 모델 목록에 포함돼야 함
- `thinking` 선택 (string): thinking level override(예: `low`, `medium`, `high`)
- `timeoutSeconds` 선택 (number): 에이전트 실행 최대 시간(초)

효과:

- **isolated** agent turn 실행(독립 session key 사용)
- 항상 **main** session에 요약을 게시
- `wakeMode=now`이면 즉시 heartbeat를 트리거

## Session key 정책(호환성 깨짐 주의)

`/hooks/agent` 페이로드의 `sessionKey` override는 기본적으로 비활성화돼 있습니다.

- 권장: 고정 `hooks.defaultSessionKey`를 설정하고, 요청별 override는 끈 상태로 유지
- 선택: 꼭 필요할 때만 요청 override를 허용하고 prefix를 제한

권장 설정:

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

호환성 설정(레거시 동작):

```json5
{
  hooks: {
    enabled: true,
    token: "${OPENCLAW_HOOKS_TOKEN}",
    allowRequestSessionKey: true,
    allowedSessionKeyPrefixes: ["hook:"], // 강력 권장
  },
}
```

### `POST /hooks/<name>` (매핑 기반)

사용자 정의 hook 이름은 `hooks.mappings`를 통해 해석됩니다(설정 참조). 매핑은 임의의 페이로드를 `wake` 또는 `agent` 액션으로 변환할 수 있으며, 선택적으로 템플릿 또는 코드 변환을 사용할 수 있습니다.

매핑 옵션(요약):

- `hooks.presets: ["gmail"]`는 내장 Gmail 매핑을 활성화합니다.
- `hooks.mappings`를 사용하면 config에서 `match`, `action`, 템플릿을 정의할 수 있습니다.
- `hooks.transformsDir` + `transform.module`은 커스텀 로직용 JS/TS 모듈을 로드합니다.
  - `hooks.transformsDir`가 설정돼 있으면 OpenClaw config 디렉터리 아래 transforms 루트(보통 `~/.openclaw/hooks/transforms`) 안에 있어야 합니다.
  - `transform.module`은 유효한 transforms 디렉터리 내부로 해석돼야 하며, traversal/escape 경로는 거부됩니다.
- 범용 ingest 엔드포인트를 유지하려면 `match.source`를 사용하세요(페이로드 기반 라우팅).
- TS transform은 TS 로더(예: `bun`, `tsx`) 또는 런타임에서 미리 컴파일된 `.js`가 필요합니다.
- 응답을 채팅 인터페이스로 보내려면 매핑에 `deliver: true`와 `channel`/`to`를 설정하세요(`channel` 기본값은 `last`, 이후 WhatsApp으로 폴백).
- `agentId`는 hook을 특정 agent로 라우팅합니다. 알 수 없는 ID는 기본 agent로 폴백합니다.
- `hooks.allowedAgentIds`는 명시적 `agentId` 라우팅을 제한합니다. 생략(또는 `*` 포함)하면 모든 agent 허용, `[]`이면 명시적 `agentId` 라우팅 거부
- `hooks.defaultSessionKey`는 명시적 key가 없을 때 hook agent 실행의 기본 session을 설정합니다.
- `hooks.allowRequestSessionKey`는 `/hooks/agent` 페이로드가 `sessionKey`를 설정할 수 있는지 제어합니다(기본값: `false`).
- `hooks.allowedSessionKeyPrefixes`는 요청 페이로드 및 매핑에서 오는 명시적 `sessionKey` 값을 제한할 수 있습니다.
- `allowUnsafeExternalContent: true`는 해당 hook의 외부 콘텐츠 안전 래퍼를 비활성화합니다(위험하므로 신뢰된 내부 소스에만 사용).
- `openclaw webhooks gmail setup`은 `openclaw webhooks gmail run`용 `hooks.gmail` config를 작성합니다.
  전체 Gmail watch 흐름은 [Gmail Pub/Sub](/automation/gmail-pubsub)을 참고하세요.

## 응답

- `/hooks/wake`는 `200`
- `/hooks/agent`는 `200`(비동기 실행 수락)
- 인증 실패 시 `401`
- 같은 클라이언트에서 인증 실패가 반복되면 `429`(`Retry-After` 확인)
- 잘못된 페이로드는 `400`
- 너무 큰 페이로드는 `413`

## 예시

```bash
curl -X POST http://127.0.0.1:18789/hooks/wake \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"text":"New email received","mode":"now"}'
```

```bash
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'x-openclaw-token: SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"message":"Summarize inbox","name":"Email","wakeMode":"next-heartbeat"}'
```

### 다른 모델 사용하기

해당 실행에 사용할 모델을 바꾸려면 agent 페이로드(또는 매핑)에 `model`을 추가하세요.

```bash
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'x-openclaw-token: SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.2-mini"}'
```

`agents.defaults.models`를 강제한다면 override 모델이 그 목록에 포함돼 있어야 합니다.

```bash
curl -X POST http://127.0.0.1:18789/hooks/gmail \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"source":"gmail","messages":[{"from":"Ada","subject":"Hello","snippet":"Hi"}]}'
```

## 보안

- hook 엔드포인트는 루프백, tailnet 또는 신뢰된 reverse proxy 뒤에 두세요.
- 전용 hook token을 사용하고 gateway auth token을 재사용하지 마세요.
- 반복되는 인증 실패는 클라이언트 주소별로 rate limit이 적용돼 brute-force 시도를 늦춥니다.
- multi-agent routing을 사용한다면 명시적 `agentId` 선택을 제한하기 위해 `hooks.allowedAgentIds`를 설정하세요.
- 호출자가 session을 고를 필요가 없다면 `hooks.allowRequestSessionKey=false`를 유지하세요.
- 요청 `sessionKey`를 허용한다면 `hooks.allowedSessionKeyPrefixes`를 제한하세요(예: `["hook:"]`).
- 민감한 원본 페이로드를 webhook 로그에 그대로 남기지 마세요.
- hook 페이로드는 기본적으로 신뢰되지 않는 것으로 간주되며 안전 경계로 감싸집니다.
  특정 hook에서 이를 꺼야 한다면 해당 매핑에 `allowUnsafeExternalContent: true`를 설정하세요(위험).
