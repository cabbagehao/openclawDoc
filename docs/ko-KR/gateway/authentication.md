---
title: Authentication
description: "OpenClaw Gateway에서 모델 제공자 OAuth, API key, Anthropic setup-token 인증을 구성하고 점검하는 가이드"
summary: "모델 인증 가이드: OAuth, API keys, setup-token"
read_when:
  - 모델 인증 문제나 OAuth 만료를 디버깅할 때
  - 인증 또는 자격 증명 저장 방식을 문서화할 때
x-i18n:
  source_path: gateway/authentication.md
---

# Authentication

OpenClaw는 모델 제공자용으로 OAuth와 API key를 모두 지원합니다. 오래 실행되는 gateway 호스트에서는 보통 API key가 가장 예측 가능하고 안정적인 선택입니다. 구독형/OAuth 흐름도 제공자 계정 모델과 맞는 경우 사용할 수 있습니다.

전체 OAuth 흐름과 저장 구조는 [/concepts/oauth](/concepts/oauth)를 참고하세요.
SecretRef 기반 인증(`env`/`file`/`exec` providers)은 [Secrets Management](/gateway/secrets)를 참고하세요.
`models status --probe`가 사용하는 자격 증명 적격성과 reason-code 규칙은 [Auth Credential Semantics](/auth-credential-semantics)를 참고하세요.

## 권장 설정(API key, 모든 provider 공통)

장기 실행 gateway를 운영한다면 먼저 사용할 provider의 API key부터 구성하세요.
특히 Anthropic은 subscription setup-token보다 API key 인증을 더 안전한 경로로 권장합니다.

1. provider 콘솔에서 API key를 생성합니다.
2. 그 키를 **gateway host**(`openclaw gateway`가 실행되는 머신)에 배치합니다.

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Gateway가 systemd/launchd 아래에서 실행된다면, daemon이 읽을 수 있도록 `~/.openclaw/.env`에 키를 두는 편이 좋습니다.

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

그다음 daemon 또는 Gateway 프로세스를 재시작하고 다시 점검합니다.

```bash
openclaw models status
openclaw doctor
```

환경 변수를 직접 관리하고 싶지 않다면 onboarding wizard가 daemon용 API key를 저장할 수 있습니다: `openclaw onboard`

환경 변수 상속(`env.shellEnv`, `~/.openclaw/.env`, systemd/launchd)에 대한 자세한 내용은 [Help](/help)를 참고하세요.

## Anthropic: setup-token(구독 인증)

Claude subscription을 사용 중이라면 setup-token 흐름을 지원합니다. 반드시 **gateway host**에서 실행하세요.

```bash
claude setup-token
```

그다음 OpenClaw에 붙여 넣습니다.

```bash
openclaw models auth setup-token --provider anthropic
```

토큰을 다른 머신에서 만들었다면 수동으로 붙여 넣을 수 있습니다.

```bash
openclaw models auth paste-token --provider anthropic
```

다음과 같은 Anthropic 오류가 보이면:

```text
This credential is only authorized for use with Claude Code and cannot be used for other API requests.
```

Anthropic API key를 대신 사용하세요.

<Warning>
Anthropic setup-token 지원은 기술적 호환성 수준입니다. Anthropic은 과거에 Claude Code 외부에서 일부 subscription 사용을 제한한 적이 있습니다. 현재 정책 리스크를 직접 검토하고, 사용 전 Anthropic 최신 약관을 확인하세요.
</Warning>

수동 토큰 입력은 모든 provider에서 사용할 수 있으며, `auth-profiles.json`을 기록하고 config를 갱신합니다.

```bash
openclaw models auth paste-token --provider anthropic
openclaw models auth paste-token --provider openrouter
```

정적 자격 증명에는 auth profile ref도 지원합니다.

- `api_key` 자격 증명은 `keyRef: { source, provider, id }`를 사용할 수 있습니다.
- `token` 자격 증명은 `tokenRef: { source, provider, id }`를 사용할 수 있습니다.

자동화 친화적인 점검 명령은 다음과 같습니다. 만료되었거나 누락되면 exit `1`, 만료 임박이면 `2`를 반환합니다.

```bash
openclaw models status --check
```

선택적 운영 스크립트(systemd/Termux)는 여기 문서화되어 있습니다:
[/automation/auth-monitoring](/automation/auth-monitoring)

> `claude setup-token`은 interactive TTY가 필요합니다.

## 모델 인증 상태 확인

```bash
openclaw models status
openclaw doctor
```

## API key rotation 동작(gateway)

일부 provider는 API 호출이 rate limit에 걸렸을 때 다른 key로 재시도할 수 있습니다.

- 우선순위:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (단일 override)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Google provider는 추가 fallback으로 `GOOGLE_API_KEY`도 포함합니다.
- 동일한 key 목록은 사용 전에 dedupe됩니다.
- OpenClaw는 rate-limit 오류(예: `429`, `rate_limit`, `quota`, `resource exhausted`)에 대해서만 다음 key로 재시도합니다.
- rate-limit이 아닌 오류에는 다른 key로 재시도하지 않습니다.
- 모든 key가 실패하면 마지막 시도의 최종 오류를 반환합니다.

## 사용할 자격 증명 제어

### 세션 단위(채팅 명령)

`/model <alias-or-id>@<profileId>`를 사용하면 현재 세션에서 특정 provider 자격 증명을 고정할 수 있습니다. 예시 profile id: `anthropic:default`, `anthropic:work`

`/model` 또는 `/model list`는 간단한 picker를 보여주고, `/model status`는 전체 보기(candidates + next auth profile, 그리고 설정된 경우 provider endpoint 상세 정보)를 보여줍니다.

### 에이전트 단위(CLI override)

에이전트별로 명시적인 auth profile 순서를 설정할 수 있습니다. 이 값은 해당 agent의 `auth-profiles.json`에 저장됩니다.

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

특정 agent를 대상으로 하려면 `--agent <id>`를 사용하고, 생략하면 설정된 기본 agent에 적용됩니다.

## 문제 해결

### “No credentials found”

Anthropic token profile이 없다면 **gateway host**에서 `claude setup-token`을 실행한 뒤 다시 점검하세요.

```bash
openclaw models status
```

### Token expiring/expired

`openclaw models status`로 어떤 profile이 만료 중인지 확인하세요. profile이 없다면 `claude setup-token`을 다시 실행하고 토큰을 다시 붙여 넣으세요.

## 요구 사항

- Anthropic subscription 계정(`claude setup-token`용)
- Claude Code CLI 설치(`claude` 명령 사용 가능)
