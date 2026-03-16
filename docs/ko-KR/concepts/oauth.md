---
summary: "OAuth in OpenClaw: token exchange, storage, and multi-account patterns"
description: "OpenClaw의 OAuth token exchange, 저장 위치, refresh 동작, 다중 account routing 방식을 설명합니다."
read_when:
  - "OpenClaw의 OAuth 흐름을 전체적으로 이해하고 싶을 때"
  - "token invalidation이나 logout 문제를 조사할 때"
  - "setup-token 또는 OAuth auth flow를 써야 할 때"
  - "여러 account 또는 profile routing을 구성하려고 할 때"
title: "OAuth"
x-i18n:
  source_path: "concepts/oauth.md"
---

# OAuth

OpenClaw는 OAuth를 제공하는 provider에 대해 "subscription auth"를 지원합니다.
대표적인 예가 **OpenAI Codex (ChatGPT OAuth)**입니다. Anthropic subscription은
**setup-token** flow를 사용하세요. 다만 Anthropic subscription은 과거에 Claude Code
외부 사용이 일부 사용자에게 제한된 적이 있으므로, 이 방식은 사용자 선택에 따른
risk로 보고 현재 Anthropic policy는 직접 확인하는 편이 안전합니다.
반면 OpenAI Codex OAuth는 OpenClaw 같은 external tool에서의 사용이 명시적으로
지원됩니다. 이 문서에서는 다음을 설명합니다.

운영 환경에서 Anthropic을 쓴다면, subscription setup-token auth보다 API key auth가
더 안전하고 권장되는 경로입니다.

- OAuth **token exchange**가 어떻게 동작하는지 (PKCE)
- token이 어디에 **저장**되는지, 그리고 그 이유
- **multiple account**를 어떻게 처리하는지
  (profile + per-session override)

OpenClaw는 자체 OAuth 또는 API-key flow를 제공하는 **provider plugin**도 지원합니다.
실행 명령:

```bash
openclaw models auth login --provider <id>
```

## The token sink (why it exists)

OAuth provider는 로그인/refresh 과정에서 **새 refresh token**을 발급하는 경우가
많습니다. 어떤 provider나 OAuth client는 같은 user/app에 대해 새 refresh token이
생기면 이전 refresh token을 무효화하기도 합니다.

실제 증상:

- OpenClaw와 Claude Code / Codex CLI 양쪽에서 같은 account로 로그인하면, 나중에 둘 중
  하나가 갑자기 "logged out"된 것처럼 동작할 수 있음

이 문제를 줄이기 위해 OpenClaw는 `auth-profiles.json`을 **token sink**로 다룹니다.

- runtime은 credential을 **한 곳**에서 읽습니다
- 여러 profile을 유지하면서 deterministic하게 routing할 수 있습니다

## Storage (where tokens live)

secret은 **agent별로** 저장됩니다.

- Auth profile (OAuth + API key + optional value-level ref):
  `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Legacy compatibility file:
  `~/.openclaw/agents/<agentId>/agent/auth.json`
  (`api_key` 정적 항목은 발견 시 scrub됨)

Legacy import-only file
(여전히 지원되지만 main store는 아님):

- `~/.openclaw/credentials/oauth.json`
  (처음 사용할 때 `auth-profiles.json`으로 import됨)

위 경로는 모두 `$OPENCLAW_STATE_DIR` override를 따릅니다.
전체 reference는
[/gateway/configuration](/gateway/configuration#auth-storage-oauth--api-keys)를
보세요.

static secret ref와 runtime snapshot activation behavior는
[Secrets Management](/gateway/secrets)를 참고하세요.

## Anthropic setup-token (subscription auth)

<Warning>
Anthropic setup-token 지원은 기술적인 호환성을 의미할 뿐, policy 보장을 뜻하지는
않습니다. Anthropic은 과거 Claude Code 외부의 일부 subscription usage를 막은 적이
있습니다. subscription auth를 사용할지는 스스로 판단하고, 현재 Anthropic terms도
직접 확인하세요.
</Warning>

어느 machine에서든 `claude setup-token`을 실행한 뒤, OpenClaw에 붙여 넣습니다.

```bash
openclaw models auth setup-token --provider anthropic
```

다른 곳에서 token을 만들었다면 수동으로 붙여 넣을 수 있습니다.

```bash
openclaw models auth paste-token --provider anthropic
```

확인:

```bash
openclaw models status
```

## OAuth exchange (how login works)

OpenClaw의 interactive login flow는 `@mariozechner/pi-ai`에 구현되어 있으며,
wizard와 command에 연결되어 있습니다.

### Anthropic setup-token

flow 형태:

1. `claude setup-token` 실행
2. token을 OpenClaw에 붙여 넣기
3. refresh 없는 token auth profile로 저장

wizard 경로는 `openclaw onboard` → auth choice `setup-token` (Anthropic)입니다.

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth는 Codex CLI 외부에서의 사용이 명시적으로 지원되며, OpenClaw
workflow도 이에 포함됩니다.

flow 형태 (PKCE):

1. PKCE verifier/challenge와 random `state` 생성
2. `https://auth.openai.com/oauth/authorize?...` 열기
3. `http://127.0.0.1:1455/auth/callback`에서 callback 수집 시도
4. callback bind에 실패하거나 remote/headless 환경이면 redirect URL 또는 code를
   직접 붙여 넣기
5. `https://auth.openai.com/oauth/token`에서 token exchange
6. access token에서 `accountId`를 추출하고
   `{ access, refresh, expires, accountId }`를 저장

wizard 경로는 `openclaw onboard` → auth choice `openai-codex`입니다.

## Refresh + expiry

각 profile은 `expires` timestamp를 저장합니다.

runtime에서는:

- `expires`가 미래 시각이면 저장된 access token을 그대로 사용
- 만료됐으면 file lock 아래에서 refresh를 수행하고 저장된 credential을 덮어씀

refresh flow는 자동으로 처리되므로, 일반적으로 token을 수동 관리할 필요는 없습니다.

## Multiple accounts (profiles) + routing

두 가지 패턴이 있습니다.

### 1) Preferred: separate agents

"personal"과 "work"가 절대 섞이지 않게 하려면 isolated agent를 사용하세요.
(서로 다른 session + credential + workspace)

```bash
openclaw agents add work
openclaw agents add personal
```

그 다음 agent별로 auth를 설정하고 wizard나 binding으로 chat을 올바른 agent에
route합니다.

### 2) Advanced: multiple profiles in one agent

`auth-profiles.json`은 같은 provider에 대해 여러 profile ID를 지원합니다.

어떤 profile을 쓸지는 다음 방식으로 고를 수 있습니다.

- global config order (`auth.order`)
- `/model ...@<profileId>`를 통한 per-session override

예시:

- `/model Opus@anthropic:work`

어떤 profile ID가 존재하는지 보려면:

- `openclaw channels list --json`
  (`auth[]`를 표시)

관련 문서:

- [/concepts/model-failover](/concepts/model-failover)
  (rotation + cooldown rule)
- [/tools/slash-commands](/tools/slash-commands)
  (command surface)
