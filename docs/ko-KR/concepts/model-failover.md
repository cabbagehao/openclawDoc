---
summary: "OpenClaw가 인증 프로필을 회전하고 모델 간 폴백하는 방식"
read_when:
  - 인증 프로필 회전, 쿨다운, 모델 폴백 동작을 진단할 때
  - 인증 프로필 또는 모델의 failover 규칙을 업데이트할 때
title: "모델 Failover"
---

# 모델 failover

OpenClaw는 실패를 두 단계로 처리합니다.

1. 현재 프로바이더 내부에서 **인증 프로필 회전**
2. `agents.defaults.model.fallbacks`의 다음 모델로 **모델 폴백**

이 문서는 런타임 규칙과 이를 뒷받침하는 데이터를 설명합니다.

## 인증 저장소(키 + OAuth)

OpenClaw는 API 키와 OAuth 토큰 모두에 **auth profile**을 사용합니다.

- 비밀은 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`에 저장됩니다(레거시: `~/.openclaw/agent/auth-profiles.json`).
- 설정 `auth.profiles` / `auth.order`는 **메타데이터 + 라우팅 전용**입니다(비밀 없음).
- 레거시 import 전용 OAuth 파일: `~/.openclaw/credentials/oauth.json`(첫 사용 시 `auth-profiles.json`으로 가져옴)

자세한 내용: [/concepts/oauth](/concepts/oauth)

자격 증명 타입:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }`(+ 일부 프로바이더의 `projectId`/`enterpriseUrl`)

## 프로필 ID

OAuth 로그인은 여러 계정이 공존할 수 있도록 고유한 프로필을 만듭니다.

- 기본값: 이메일이 없으면 `provider:default`
- 이메일이 있는 OAuth: `provider:<email>`(예: `google-antigravity:user@gmail.com`)

프로필은 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`의 `profiles` 아래에 있습니다.

## 회전 순서

프로바이더에 여러 프로필이 있으면 OpenClaw는 다음 순서로 순서를 정합니다.

1. **명시적 설정**: `auth.order[provider]`(설정된 경우)
2. **설정된 프로필**: 프로바이더로 필터링한 `auth.profiles`
3. **저장된 프로필**: 해당 프로바이더의 `auth-profiles.json` 엔트리

명시적 순서가 없으면 OpenClaw는 round-robin 순서를 사용합니다.

- **기본 키:** 프로필 타입(**API 키보다 OAuth 우선**)
- **보조 키:** `usageStats.lastUsed`(같은 타입 내에서는 가장 오래전에 사용한 것부터)
- **쿨다운/비활성 프로필**은 가장 뒤로 이동하며, 가장 빨리 만료되는 순으로 정렬됩니다.

### 세션 고정성(cache-friendly)

OpenClaw는 프로바이더 캐시를 따뜻하게 유지하기 위해 **세션별로 선택한 auth profile을 고정**합니다.
매 요청마다 회전하지는 않습니다. 다음 경우까지는 고정된 프로필을 재사용합니다.

- 세션이 리셋될 때(`/new` / `/reset`)
- 압축이 완료될 때(압축 횟수 증가)
- 프로필이 쿨다운/비활성 상태일 때

`/model …@<profileId>`를 통한 수동 선택은 해당 세션의 **사용자 재정의**를 설정하며, 새 세션이 시작될 때까지 자동 회전하지 않습니다.

세션 라우터가 선택한 자동 고정 프로필은 **선호값**으로 취급됩니다.
즉, 먼저 시도되지만 rate limit/timeout이 발생하면 OpenClaw가 다른 프로필로 회전할 수 있습니다.
사용자가 고정한 프로필은 그 프로필에 묶여 있으며, 실패하고 모델 폴백이 설정되어 있으면 프로필을 바꾸는 대신 다음 모델로 이동합니다.

### OAuth가 "사라진 것처럼" 보일 수 있는 이유

같은 프로바이더에 OAuth 프로필과 API 키 프로필이 둘 다 있으면, 고정하지 않은 경우 round-robin 때문에 메시지 간에 둘 사이를 전환할 수 있습니다. 하나의 프로필만 강제하려면:

- `auth.order[provider] = ["provider:profileId"]`로 고정하거나
- UI/채팅 표면이 지원할 때 `/model …`의 프로필 재정의를 사용하세요.

## 쿨다운

프로필이 인증/속도 제한 오류(또는 속도 제한처럼 보이는 timeout)로 실패하면, OpenClaw는 해당 프로필을 쿨다운 상태로 표시하고 다음 프로필로 이동합니다.
포맷/잘못된 요청 오류(예: Cloud Code Assist tool call ID 검증 실패)도 failover-worthy로 간주되어 같은 쿨다운을 사용합니다.
`Unhandled stop reason: error`,
`stop reason: error`, `reason: error` 같은 OpenAI 호환 stop-reason 오류도 timeout/failover 신호로 분류됩니다.

쿨다운은 지수 백오프를 사용합니다.

- 1분
- 5분
- 25분
- 1시간(상한)

상태는 `auth-profiles.json`의 `usageStats` 아래에 저장됩니다.

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

## 과금 비활성화

과금/크레딧 실패(예: "insufficient credits" / "credit balance too low")도 failover-worthy로 처리되지만, 보통 일시적이지는 않습니다. 짧은 쿨다운 대신 OpenClaw는 해당 프로필을 **비활성화** 상태(더 긴 백오프 포함)로 표시하고 다음 프로필/프로바이더로 회전합니다.

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

- 과금 백오프는 **5시간**에서 시작해 과금 실패마다 두 배가 되며, **24시간**에서 상한을 둡니다.
- 프로필이 **24시간** 동안 실패하지 않으면 백오프 카운터를 리셋합니다(설정 가능).

## 모델 폴백

프로바이더의 모든 프로필이 실패하면 OpenClaw는 `agents.defaults.model.fallbacks`의 다음 모델로 이동합니다. 이는 인증 실패, 속도 제한, 그리고 프로필 회전을 소진한 timeout에 적용됩니다(다른 오류는 폴백을 진행시키지 않음).

훅 또는 CLI로 모델 재정의가 있는 상태에서 런이 시작되더라도, 폴백은 설정된 폴백을 시도한 뒤 결국 `agents.defaults.model.primary`에서 끝납니다.

## 관련 설정

다음 항목은 [게이트웨이 설정](/gateway/configuration)을 참고하세요.

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel` 라우팅

더 넓은 모델 선택과 폴백 개요는 [모델](/concepts/models)을 참고하세요.
