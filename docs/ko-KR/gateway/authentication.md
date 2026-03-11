---
summary: "모델 인증: OAuth, API 키, setup-token"
read_when:
  - 모델 인증이나 OAuth 만료를 디버깅할 때
  - 인증 또는 자격 증명 저장 방식을 문서화할 때
title: "인증"
---

# 인증

OpenClaw는 모델 provider에 대해 OAuth와 API 키를 지원합니다. 항상 실행되는 gateway 호스트에서는 API 키가 보통 가장 예측 가능한 선택입니다. provider 계정 모델에 맞는 경우 subscription/OAuth 흐름도 지원합니다.

전체 OAuth 흐름과 저장 레이아웃은 [/concepts/oauth](/concepts/oauth) 를 참고하세요.
SecretRef 기반 인증(`env`/`file`/`exec` provider)은 [시크릿 관리](/gateway/secrets) 를 참고하세요.
`models status --probe` 에서 사용하는 credential eligibility/reason-code 규칙은 [인증 자격 증명 의미론](/auth-credential-semantics) 을 참고하세요.

## 권장 설정 (API 키, 모든 provider)

장기간 실행되는 gateway를 운영한다면, 선택한 provider의 API 키로 시작하세요.
특히 Anthropic은 API 키 인증이 안전한 경로이며 subscription setup-token 인증보다 권장됩니다.

1. provider 콘솔에서 API 키를 생성합니다.
2. **gateway 호스트**(`openclaw gateway` 가 실행되는 머신)에 키를 둡니다.

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Gateway가 systemd/launchd 아래에서 실행 중이라면, daemon이 읽을 수 있도록 키를 `~/.openclaw/.env` 에 두는 편이 좋습니다.

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

그다음 daemon(또는 Gateway 프로세스)을 재시작하고 다시 확인합니다.

```bash
openclaw models status
openclaw doctor
```

env var를 직접 관리하고 싶지 않다면 onboarding wizard가 daemon용 API 키를 저장할 수 있습니다: `openclaw onboard`

env 상속(`env.shellEnv`, `~/.openclaw/.env`, systemd/launchd) 세부 사항은 [도움말](/help) 을 참고하세요.

## Anthropic: setup-token (subscription auth)

Claude subscription을 사용 중이라면 setup-token 흐름을 지원합니다. 반드시 **gateway 호스트**에서 실행하세요.

```bash
claude setup-token
```

그다음 OpenClaw에 붙여 넣습니다.

```bash
openclaw models auth setup-token --provider anthropic
```

토큰을 다른 머신에서 만들었다면 수동으로 붙여 넣으세요.

```bash
openclaw models auth paste-token --provider anthropic
```

다음과 같은 Anthropic 오류가 보인다면:

```
This credential is only authorized for use with Claude Code and cannot be used for other API requests.
```

Anthropic API 키를 대신 사용하세요.

<Warning>
Anthropic setup-token 지원은 기술적 호환성만 의미합니다. Anthropic은 과거에 Claude Code 외부의 일부 subscription 사용을 차단한 적이 있습니다. 정책 리스크를 감수할지 스스로 판단한 경우에만 사용하고, 현재 약관은 직접 확인하세요.
</Warning>

수동 토큰 입력(모든 provider; `auth-profiles.json` 기록 + config 갱신):

```bash
openclaw models auth paste-token --provider anthropic
openclaw models auth paste-token --provider openrouter
```

정적 자격 증명에는 auth profile ref도 지원됩니다.

- `api_key` 자격 증명은 `keyRef: { source, provider, id }` 사용 가능
- `token` 자격 증명은 `tokenRef: { source, provider, id }` 사용 가능

자동화 친화적 점검(만료/없음이면 exit `1`, 만료 임박이면 `2`):

```bash
openclaw models status --check
```

systemd/Termux용 선택적 운영 스크립트는 여기 있습니다:
[/automation/auth-monitoring](/automation/auth-monitoring)

> `claude setup-token` 은 interactive TTY가 필요합니다.

## 모델 인증 상태 확인

```bash
openclaw models status
openclaw doctor
```

## API 키 회전 동작 (gateway)

일부 provider는 API 호출이 rate limit에 걸렸을 때 대체 키로 요청을 재시도할 수 있습니다.

- 우선순위
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (단일 override)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Google provider는 추가 fallback으로 `GOOGLE_API_KEY` 도 포함합니다.
- 동일한 키 목록은 사용 전에 중복 제거됩니다.
- OpenClaw는 rate-limit 오류(예: `429`, `rate_limit`, `quota`, `resource exhausted`)에 대해서만 다음 키로 재시도합니다.
- rate-limit가 아닌 오류는 대체 키로 재시도하지 않습니다.
- 모든 키가 실패하면 마지막 시도의 최종 오류를 반환합니다.

## 어떤 자격 증명을 사용할지 제어하기

### 세션별 (채팅 명령)

현재 세션에서 특정 provider 자격 증명을 고정하려면 `/model <alias-or-id>@<profileId>` 를 사용하세요(예시 profile id: `anthropic:default`, `anthropic:work`).

간단한 선택기는 `/model`(또는 `/model list`)을, 전체 보기(후보 + 다음 auth profile, 구성된 경우 provider endpoint 세부 정보 포함)는 `/model status` 를 사용하세요.

### 에이전트별 (CLI override)

에이전트에 대한 명시적 auth profile 순서 override를 설정합니다(해당 에이전트의 `auth-profiles.json` 에 저장).

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

특정 에이전트를 대상으로 하려면 `--agent <id>` 를 사용하고, 생략하면 설정된 기본 에이전트를 사용합니다.

## 문제 해결

### “No credentials found”

Anthropic token profile이 없으면 **gateway 호스트**에서 `claude setup-token` 을 실행한 뒤 다시 확인하세요.

```bash
openclaw models status
```

### Token expiring/expired

어떤 profile이 만료 중인지 `openclaw models status` 로 확인하세요. profile이 없다면 `claude setup-token` 을 다시 실행하고 토큰을 다시 붙여 넣으세요.

## 요구 사항

- Anthropic subscription 계정 (`claude setup-token` 용)
- Claude Code CLI 설치 (`claude` 명령 사용 가능)
