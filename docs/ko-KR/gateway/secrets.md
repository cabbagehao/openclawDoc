---
summary: "Secrets 관리: SecretRef contract, runtime snapshot 동작, 안전한 단방향 scrubbing"
read_when:
  - provider credential 및 `auth-profiles.json` ref용 SecretRef를 구성할 때
  - 프로덕션에서 secrets reload, audit, configure, apply를 안전하게 운영할 때
  - startup fail-fast, inactive-surface filtering, last-known-good 동작을 이해할 때
title: "Secrets Management"
---

# Secrets management

OpenClaw는 additive SecretRef를 지원하므로, 지원되는 credential을 configuration에
평문으로 저장하지 않아도 됩니다.

평문도 여전히 동작합니다. SecretRef는 credential별로 opt-in입니다.

## 목표와 runtime model

Secrets는 메모리 내 runtime snapshot으로 해석됩니다.

- Resolution은 request path에서 지연 수행되지 않고 activation 중 eager하게 수행됩니다.
- 실질적으로 활성화된 SecretRef를 해석할 수 없으면 startup은 즉시 실패합니다.
- Reload는 atomic swap을 사용합니다: 전체 성공이거나, last-known-good snapshot을 유지합니다.
- Runtime request는 활성 메모리 snapshot만 읽습니다.

이렇게 하면 secret provider 장애가 hot request path로 들어오지 않게 할 수 있습니다.

## Active-surface filtering

SecretRef는 실질적으로 활성화된 surface에서만 검증됩니다.

- 활성 surface: 해석되지 않은 ref는 startup/reload를 막습니다.
- 비활성 surface: 해석되지 않은 ref는 startup/reload를 막지 않습니다.
- 비활성 ref는 `SECRETS_REF_IGNORED_INACTIVE_SURFACE` 코드의 비치명적 diagnostics를 발생시킵니다.

비활성 surface의 예:

- 비활성화된 channel/account entry
- 어떤 활성 account도 상속하지 않는 top-level channel credential
- 비활성화된 tool/feature surface
- `tools.web.search.provider`에서 선택되지 않은 web search provider 전용 key
  Provider가 설정되지 않은 auto mode에서는, provider 전용 key도 provider auto-detection을 위해 활성으로 간주됩니다.
- `gateway.remote.token` / `gateway.remote.password` SecretRef는 (`gateway.remote.enabled`가 `false`가 아닐 때) 다음 중 하나가 true이면 활성입니다:
  - `gateway.mode=remote`
  - `gateway.remote.url`이 구성됨
  - `gateway.tailscale.mode`가 `serve` 또는 `funnel`
    위 remote surface가 없는 local mode에서는:
  - env/auth token이 구성되지 않았고 token auth가 승리할 수 있을 때 `gateway.remote.token`이 활성입니다.
  - env/auth password가 구성되지 않았고 password auth가 승리할 수 있을 때만 `gateway.remote.password`가 활성입니다.
- `gateway.auth.token` SecretRef는 `OPENCLAW_GATEWAY_TOKEN`(또는 `CLAWDBOT_GATEWAY_TOKEN`)이 설정되어 있으면 startup auth resolution에서는 비활성입니다. 해당 runtime에서는 env token 입력이 우선하기 때문입니다.

## Gateway auth surface diagnostics

`gateway.auth.token`, `gateway.auth.password`, `gateway.remote.token`, 또는
`gateway.remote.password`에 SecretRef가 구성되어 있으면, gateway startup/reload는
surface 상태를 명시적으로 로그에 남깁니다.

- `active`: SecretRef가 실질적인 auth surface의 일부이며 반드시 해석되어야 합니다.
- `inactive`: 다른 auth surface가 우선하거나 remote auth가 비활성/미활성 상태이기 때문에 이 runtime에서는 SecretRef가 무시됩니다.

이 항목들은 `SECRETS_GATEWAY_AUTH_SURFACE`로 로깅되며, active-surface policy가 사용한
이유도 함께 포함하므로 credential이 왜 active 또는 inactive로 처리되었는지 확인할 수 있습니다.

## Onboarding reference preflight

Onboarding이 interactive mode로 실행되고 SecretRef 저장을 선택하면, OpenClaw는
저장 전에 preflight validation을 수행합니다.

- Env ref: env var 이름을 검증하고 onboarding 중 비어 있지 않은 값이 보이는지 확인합니다.
- Provider ref(`file` 또는 `exec`): provider 선택을 검증하고, `id`를 해석하며, 해석된 값의 type을 확인합니다.
- Quickstart reuse path: `gateway.auth.token`이 이미 SecretRef이면, onboarding은 probe/dashboard bootstrap 전에 이를 해석합니다(`env`, `file`, `exec` ref 모두 대상). 이때 동일한 fail-fast gate를 사용합니다.

검증에 실패하면 onboarding은 오류를 보여주고 재시도를 허용합니다.

## SecretRef contract

모든 곳에서 하나의 object shape를 사용하세요.

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

### `source: "env"`

```json5
{ source: "env", provider: "default", id: "OPENAI_API_KEY" }
```

검증:

- `provider`는 `^[a-z][a-z0-9_-]{0,63}$`와 일치해야 함
- `id`는 `^[A-Z][A-Z0-9_]{0,127}$`와 일치해야 함

### `source: "file"`

```json5
{ source: "file", provider: "filemain", id: "/providers/openai/apiKey" }
```

검증:

- `provider`는 `^[a-z][a-z0-9_-]{0,63}$`와 일치해야 함
- `id`는 절대 JSON pointer(`/{...}`)여야 함
- segment의 RFC6901 escaping: `~` => `~0`, `/` => `~1`

### `source: "exec"`

```json5
{ source: "exec", provider: "vault", id: "providers/openai/apiKey" }
```

검증:

- `provider`는 `^[a-z][a-z0-9_-]{0,63}$`와 일치해야 함
- `id`는 `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`와 일치해야 함

## Provider config

Provider는 `secrets.providers` 아래에 정의합니다.

```json5
{
  secrets: {
    providers: {
      default: { source: "env" },
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json", // or "singleValue"
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        args: ["--profile", "prod"],
        passEnv: ["PATH", "VAULT_ADDR"],
        jsonOnly: true,
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
    resolution: {
      maxProviderConcurrency: 4,
      maxRefsPerProvider: 512,
      maxBatchBytes: 262144,
    },
  },
}
```

### Env provider

- `allowlist`를 통한 선택적 allowlist 지원
- 없거나 비어 있는 env 값은 resolution 실패 처리됨

### File provider

- `path`에서 로컬 파일을 읽습니다.
- `mode: "json"`은 JSON object payload를 기대하며, `id`를 pointer로 해석합니다.
- `mode: "singleValue"`는 ref id `"value"`를 기대하며 파일 내용을 반환합니다.
- Path는 ownership/permission 검사를 통과해야 합니다.
- Windows fail-closed 참고: 경로에 대한 ACL 검증을 사용할 수 없으면 resolution은 실패합니다. 신뢰된 경로에 한해서만, 해당 provider에 `allowInsecurePath: true`를 설정해 path security check를 우회할 수 있습니다.

### Exec provider

- shell 없이 구성된 절대 binary path를 실행합니다.
- 기본적으로 `command`는 일반 파일을 가리켜야 하며(symlink 불가)
- Homebrew shim 같은 symlink command path를 허용하려면 `allowSymlinkCommand: true`를 설정하세요. OpenClaw는 해석된 target path를 검증합니다.
- 패키지 관리자 경로에는 `allowSymlinkCommand`와 `trustedDirs`를 함께 사용하세요(예: `["/opt/homebrew"]`).
- timeout, no-output timeout, output byte limit, env allowlist, trusted dir를 지원합니다.
- Windows fail-closed 참고: command path에 대한 ACL 검증을 사용할 수 없으면 resolution은 실패합니다. 신뢰된 경로에 한해서만, 해당 provider에 `allowInsecurePath: true`를 설정해 path security check를 우회할 수 있습니다.

Request payload (`stdin`):

```json
{ "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
```

Response payload (`stdout`):

```jsonc
{ "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
```

선택적 per-id 오류:

```json
{
  "protocolVersion": 1,
  "values": {},
  "errors": { "providers/openai/apiKey": { "message": "not found" } }
}
```

## Exec integration 예시

### 1Password CLI

```json5
{
  secrets: {
    providers: {
      onepassword_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/op",
        allowSymlinkCommand: true, // required for Homebrew symlinked binaries
        trustedDirs: ["/opt/homebrew"],
        args: ["read", "op://Personal/OpenClaw QA API Key/password"],
        passEnv: ["HOME"],
        jsonOnly: false,
      },
    },
  },
  models: {
    providers: {
      openai: {
        baseUrl: "https://api.openai.com/v1",
        models: [{ id: "gpt-5", name: "gpt-5" }],
        apiKey: { source: "exec", provider: "onepassword_openai", id: "value" },
      },
    },
  },
}
```

### HashiCorp Vault CLI

```json5
{
  secrets: {
    providers: {
      vault_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/vault",
        allowSymlinkCommand: true, // required for Homebrew symlinked binaries
        trustedDirs: ["/opt/homebrew"],
        args: ["kv", "get", "-field=OPENAI_API_KEY", "secret/openclaw"],
        passEnv: ["VAULT_ADDR", "VAULT_TOKEN"],
        jsonOnly: false,
      },
    },
  },
  models: {
    providers: {
      openai: {
        baseUrl: "https://api.openai.com/v1",
        models: [{ id: "gpt-5", name: "gpt-5" }],
        apiKey: { source: "exec", provider: "vault_openai", id: "value" },
      },
    },
  },
}
```

### `sops`

```json5
{
  secrets: {
    providers: {
      sops_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/sops",
        allowSymlinkCommand: true, // required for Homebrew symlinked binaries
        trustedDirs: ["/opt/homebrew"],
        args: ["-d", "--extract", '["providers"]["openai"]["apiKey"]', "/path/to/secrets.enc.json"],
        passEnv: ["SOPS_AGE_KEY_FILE"],
        jsonOnly: false,
      },
    },
  },
  models: {
    providers: {
      openai: {
        baseUrl: "https://api.openai.com/v1",
        models: [{ id: "gpt-5", name: "gpt-5" }],
        apiKey: { source: "exec", provider: "sops_openai", id: "value" },
      },
    },
  },
}
```

## 지원되는 credential surface

정식으로 지원되는 credential과 지원되지 않는 credential의 canonical 목록은 다음에 있습니다.

- [SecretRef Credential Surface](/reference/secretref-credential-surface)

Runtime에서 발급되거나 순환되는 credential 및 OAuth refresh material은 읽기 전용 SecretRef resolution에서 의도적으로 제외됩니다.

## 필수 동작과 precedence

- ref가 없는 field: 변경 없음
- ref가 있는 field: activation 중 활성 surface에서는 필수
- 평문과 ref가 모두 있으면, 지원되는 precedence path에서는 ref가 우선합니다.

Warning 및 audit signal:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (runtime warning)
- `REF_SHADOWED` (`auth-profiles.json` credential이 `openclaw.json` ref보다 우선할 때의 audit finding)

Google Chat 호환 동작:

- `serviceAccountRef`가 평문 `serviceAccount`보다 우선합니다.
- sibling ref가 설정되어 있으면 평문 값은 무시됩니다.

## Activation trigger

Secret activation은 다음 시점에 실행됩니다.

- Startup (preflight + 최종 activation)
- Config reload hot-apply path
- Config reload restart-check path
- `secrets.reload`를 통한 수동 reload

Activation contract:

- 성공하면 snapshot을 atomically swap합니다.
- Startup 실패는 gateway startup을 중단합니다.
- Runtime reload 실패 시 last-known-good snapshot을 유지합니다.

## Degraded 및 recovered signal

정상 상태 이후 reload 시 activation이 실패하면, OpenClaw는 degraded secrets state에 들어갑니다.

일회성 system event 및 log 코드:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

동작:

- Degraded: runtime은 last-known-good snapshot을 유지합니다.
- Recovered: 다음 successful activation 이후 한 번만 발생합니다.
- 이미 degraded 상태에서 반복 실패하면 warning은 남기지만 event를 계속 스팸하지는 않습니다.
- Startup fail-fast는 runtime이 한 번도 active가 되지 않았으므로 degraded event를 발생시키지 않습니다.

## Command-path resolution

Command path는 gateway snapshot RPC를 통해 지원되는 SecretRef resolution에 opt-in할 수 있습니다.

크게 두 가지 동작이 있습니다.

- Strict command path(예: `openclaw memory` remote-memory path와 `openclaw qr --remote`)는 활성 snapshot에서 읽고, 필요한 SecretRef를 사용할 수 없으면 즉시 실패합니다.
- Read-only command path(예: `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, 그리고 읽기 전용 doctor/config repair flow)도 활성 snapshot을 우선 사용하지만, 해당 command path에서 대상 SecretRef를 사용할 수 없으면 중단하지 않고 degraded 상태로 동작합니다.

Read-only 동작:

- gateway가 실행 중이면, 이 명령들은 먼저 활성 snapshot에서 읽습니다.
- gateway resolution이 불완전하거나 gateway를 사용할 수 없으면, 특정 command surface에 대해 targeted local fallback을 시도합니다.
- targeted SecretRef를 여전히 사용할 수 없으면, 명령은 “configured but unavailable in this command path” 같은 명시적 diagnostics와 함께 degraded read-only output으로 계속 진행합니다.
- 이 degraded 동작은 command-local 전용입니다. runtime startup, reload, send/auth path를 약화시키지 않습니다.

기타 참고:

- backend secret rotation 이후 snapshot 새로고침은 `openclaw secrets reload`가 처리합니다.
- 이 command path들이 사용하는 Gateway RPC method: `secrets.resolve`

## Audit 및 configure 워크플로

기본 operator flow:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

### `secrets audit`

Finding에는 다음이 포함됩니다.

- 저장 시점의 평문 값(`openclaw.json`, `auth-profiles.json`, `.env`, 그리고 생성된 `agents/*/agent/models.json`)
- 생성된 `models.json` entry에 남아 있는 평문 민감 provider header 흔적
- 해석되지 않은 ref
- precedence shadowing (`auth-profiles.json`이 `openclaw.json` ref보다 우선)
- 레거시 흔적(`auth.json`, OAuth reminder)

Header residue 참고:

- 민감 provider header 감지는 이름 기반 휴리스틱으로 수행됩니다(일반적인 auth/credential header 이름과 `authorization`, `x-api-key`, `token`, `secret`, `password`, `credential` 같은 fragment 기준).

### `secrets configure`

다음을 수행하는 interactive helper입니다.

- 먼저 `secrets.providers`를 구성(`env`/`file`/`exec`, 추가/수정/삭제)
- 지원되는 secret 포함 field를 `openclaw.json` 및 하나의 agent scope에 대한 `auth-profiles.json`에서 선택 가능
- target picker에서 직접 새로운 `auth-profiles.json` mapping 생성 가능
- SecretRef 세부 정보(`source`, `provider`, `id`) 수집
- preflight resolution 실행
- 즉시 적용 가능

유용한 모드:

- `openclaw secrets configure --providers-only`
- `openclaw secrets configure --skip-provider-setup`
- `openclaw secrets configure --agent <id>`

`configure` apply 기본 동작:

- 대상 provider에 대해 `auth-profiles.json`의 일치하는 정적 credential을 scrub
- `auth.json`의 레거시 정적 `api_key` entry를 scrub
- `<config-dir>/.env`의 일치하는 알려진 secret line을 scrub

### `secrets apply`

저장된 plan 적용:

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
```

엄격한 target/path contract 세부 사항과 정확한 rejection rule은 다음을 참고하세요.

- [Secrets Apply Plan Contract](/gateway/secrets-plan-contract)

## 단방향 안전 정책

OpenClaw는 과거 평문 secret 값을 포함하는 rollback backup을 의도적으로 작성하지 않습니다.

안전 모델:

- write mode 전에 preflight가 반드시 성공해야 함
- commit 전에 runtime activation을 검증함
- apply는 atomic file replacement와 실패 시 best-effort restore를 사용해 파일을 갱신함

## 레거시 auth 호환성 참고

정적 credential에 대해 runtime은 더 이상 평문 레거시 auth 저장소에 의존하지 않습니다.

- Runtime credential source는 해석된 메모리 내 snapshot입니다.
- 레거시 정적 `api_key` entry는 발견 시 scrub됩니다.
- OAuth 관련 호환 동작은 별도로 유지됩니다.

## Web UI 참고

일부 SecretInput union은 form mode보다 raw editor mode에서 구성하는 편이 더 쉽습니다.

## 관련 문서

- CLI 명령: [secrets](/cli/secrets)
- Plan contract 세부 사항: [Secrets Apply Plan Contract](/gateway/secrets-plan-contract)
- Credential surface: [SecretRef Credential Surface](/reference/secretref-credential-surface)
- Auth 설정: [Authentication](/gateway/authentication)
- Security posture: [Security](/gateway/security)
- Environment precedence: [Environment Variables](/help/environment)
