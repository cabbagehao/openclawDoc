---
summary: "How OpenClaw rotates auth profiles and falls back across models"
description: "OpenClaw가 인증 프로필을 순환하고 쿨다운·비활성화·모델 fallback을 적용하는 방식을 설명합니다."
read_when:
  - auth profile rotation, cooldown, model fallback 동작을 점검해야 할 때
  - auth profile이나 model의 failover rule을 수정할 때
title: "Model Failover"
x-i18n:
  source_path: "concepts/model-failover.md"
---

# Model failover

OpenClaw는 실패를 두 단계로 처리합니다.

1. 현재 provider 안에서의 **auth profile rotation**
2. `agents.defaults.model.fallbacks`에 있는 다음 model로의 **model fallback**

이 문서는 runtime rule과 이를 뒷받침하는 data 구조를 설명합니다.

## Auth storage (keys + OAuth)

OpenClaw는 API key와 OAuth token 모두에 **auth profile**을 사용합니다.

- secret은 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`에 저장됩니다
  (legacy 경로: `~/.openclaw/agent/auth-profiles.json`)
- config의 `auth.profiles` / `auth.order`는 **metadata와 routing용**이며, secret을
  저장하지 않습니다
- legacy import-only OAuth file인 `~/.openclaw/credentials/oauth.json`은 처음 사용할 때
  `auth-profiles.json`으로 import됩니다

자세한 내용은 [/concepts/oauth](/concepts/oauth)를 참고하세요.

credential type:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }`
  (+ provider에 따라 `projectId`/`enterpriseUrl`)

## Profile IDs

OAuth login은 여러 account를 함께 쓸 수 있도록 서로 다른 profile을 만듭니다.

- email을 모르면 기본값은 `provider:default`
- email이 있으면 `provider:<email>`
  (예: `google-antigravity:user@gmail.com`)

profile은 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`의 `profiles` 아래에
저장됩니다.

## Rotation order

provider에 여러 profile이 있으면 OpenClaw는 아래 순서로 order를 정합니다.

1. `auth.order[provider]`에 명시된 **explicit config**
2. provider 기준으로 filtering한 `auth.profiles`
3. 해당 provider의 `auth-profiles.json`에 저장된 profile

명시적인 order가 없으면 OpenClaw는 round-robin order를 사용합니다.

- **Primary key:** profile type
  (**OAuth가 API key보다 먼저**)
- **Secondary key:** `usageStats.lastUsed`
  (각 type 안에서 가장 오래전에 사용한 항목이 먼저)
- **Cooldown/disabled profile:** 뒤로 이동하며, 가장 빨리 만료되는 순서대로 정렬

### Session stickiness (cache-friendly)

OpenClaw는 provider cache를 따뜻하게 유지하기 위해 **선택된 auth profile을 session별로
pin**합니다. 요청마다 profile을 돌려 쓰지 않으며, 아래 경우에만 다른 profile을
선택합니다.

- session이 reset될 때 (`/new` / `/reset`)
- compaction이 완료되어 compaction count가 증가할 때
- 현재 profile이 cooldown 또는 disabled 상태일 때

`/model …@<profileId>`로 직접 고르면 해당 session에서는 **user override**가 되며,
새 session이 시작되기 전까지 자동 rotation 대상이 아닙니다.

session router가 자동으로 고른 pinned profile은 **preference**로 취급됩니다.
먼저 시도되지만, rate limit이나 timeout이 발생하면 OpenClaw가 다른 profile로
돌아갈 수 있습니다. 반면 user가 직접 pin한 profile은 그 profile에 고정되며, 해당
profile이 실패하고 model fallback이 설정돼 있으면 OpenClaw는 profile을 바꾸지 않고
다음 model로 이동합니다.

### Why OAuth can "look lost"

같은 provider에 OAuth profile과 API key profile이 함께 있으면, pin이 없는 상태에서
round-robin에 따라 메시지 사이마다 서로 다른 profile이 선택될 수 있습니다.
하나의 profile만 강제하고 싶다면:

- `auth.order[provider] = ["provider:profileId"]`로 고정하거나
- UI/chat surface가 지원한다면 `/model …`의 profile override를 사용하세요

## Cooldowns

auth error, rate-limit error, 또는 rate limiting처럼 보이는 timeout이 나면 OpenClaw는
해당 profile을 cooldown 상태로 표시하고 다음 profile로 넘어갑니다.
Cloud Code Assist의 tool call ID validation failure 같은 format/invalid-request error도
failover-worthy error로 간주되어 같은 cooldown 규칙을 사용합니다.
OpenAI-compatible stop reason 오류인 `Unhandled stop reason: error`,
`stop reason: error`, `reason: error`도 timeout/failover signal로 분류됩니다.

cooldown은 exponential backoff를 사용합니다.

- 1 minute
- 5 minutes
- 25 minutes
- 1 hour (cap)

상태는 `auth-profiles.json`의 `usageStats`에 저장됩니다.

```json
{
  "usageStats": {
    "provider:profile": {
      "lastUsed": 1736160000000,
      "cooldownUntil": 1736160600000,
      "errorCount": 2
    }
  }
}
```

## Billing disables

billing 또는 credit 관련 오류
(예: `"insufficient credits"`, `"credit balance too low"`)는 failover-worthy이지만,
보통 transient error가 아닙니다. 그래서 짧은 cooldown 대신 profile을 **disabled**로
표시하고, 더 긴 backoff를 적용한 뒤 다음 profile/provider로 rotation합니다.

상태는 `auth-profiles.json`에 저장됩니다.

```json
{
  "usageStats": {
    "provider:profile": {
      "disabledUntil": 1736178000000,
      "disabledReason": "billing"
    }
  }
}
```

기본값:

- billing backoff는 **5 hours**에서 시작해 billing failure마다 두 배가 되며,
  최대 **24 hours**까지 증가합니다
- profile이 **24 hours** 동안 실패하지 않으면 backoff counter가 reset됩니다
  (configurable)

## Model fallback

provider의 모든 profile이 실패하면 OpenClaw는
`agents.defaults.model.fallbacks`의 다음 model로 이동합니다. 이 동작은 auth failure,
rate limit, profile rotation으로 모두 소진된 timeout에 적용됩니다
(그 외 error는 fallback을 진행하지 않음).

run이 model override로 시작되더라도, configured fallback을 시도한 뒤에는 결국
`agents.defaults.model.primary`에서 fallback chain이 끝납니다.

## Related config

[Gateway configuration](/gateway/configuration)에서 다음 설정을 확인하세요.

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel` routing

전반적인 model selection과 fallback 개요는 [Models](/concepts/models) 문서를
참고하세요.
