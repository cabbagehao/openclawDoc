---
title: 시크릿 관리
description: SecretRef 규격, 활성 표면 판정, provider 구성, audit/configure/apply 흐름을 설명하는 OpenClaw 시크릿 관리 가이드입니다.
summary: "시크릿 관리: SecretRef 규격, 런타임 스냅샷 동작, 안전한 일방향 스크러빙"
read_when:
  - provider 자격 증명과 `auth-profiles.json` 참조용 SecretRef를 구성할 때
  - 운영 환경에서 secrets reload, audit, configure, apply를 안전하게 처리할 때
  - startup fail-fast, inactive-surface filtering, last-known-good 동작을 이해해야 할 때
x-i18n:
  source_path: "gateway/secrets.md"
---

# 시크릿 관리

OpenClaw는 additive SecretRef를 지원하므로, 지원되는 자격 증명을 설정 파일에 평문으로 저장하지 않아도 됩니다.

평문도 여전히 동작합니다. SecretRef는 자격 증명별로 선택적으로 적용하는 방식입니다.

## 목표와 런타임 모델

시크릿은 메모리 내 런타임 스냅샷으로 해석됩니다.

- 해석은 요청 경로에서 지연 수행되지 않고, 활성화 시점에 eager하게 처리됩니다.
- 실질적으로 활성인 SecretRef를 해석하지 못하면 startup은 fail-fast로 중단됩니다.
- reload는 atomic swap을 사용합니다. 전부 성공하면 교체하고, 실패하면 last-known-good snapshot을 유지합니다.
- 런타임 요청은 활성화된 메모리 스냅샷만 읽습니다.
- outbound delivery 경로도 같은 활성 스냅샷을 읽습니다. 예를 들어 Discord reply/thread delivery나 Telegram action send는 매 전송마다 SecretRef를 다시 해석하지 않습니다.

이렇게 하면 secret provider 장애가 hot request path에 직접 들어오지 않습니다.

## Active-surface filtering

SecretRef는 실제로 활성인 surface에서만 검증합니다.

- 활성 surface: 해석되지 않으면 startup/reload를 막습니다.
- 비활성 surface: 해석되지 않아도 startup/reload를 막지 않습니다.
- 비활성 ref는 `SECRETS_REF_IGNORED_INACTIVE_SURFACE` 코드의 non-fatal 진단만 남깁니다.

비활성 surface 예시:

- 비활성화된 channel/account 항목
- 어떤 활성 account도 상속하지 않는 top-level channel credential
- 비활성화된 tool/feature surface
- `tools.web.search.provider`에서 선택되지 않은 web search provider별 키
  - auto mode(provider 미설정)에서는 provider auto-detection 우선순위에 따라 하나가 해석될 때까지 키를 차례로 확인합니다.
  - 선택이 끝난 뒤 선택되지 않은 provider 키는 해당 provider가 선택되기 전까지 비활성으로 취급됩니다.
- `gateway.remote.token` / `gateway.remote.password` SecretRef는 다음 중 하나일 때 활성입니다.
  - `gateway.mode=remote`
  - `gateway.remote.url`이 설정됨
  - `gateway.tailscale.mode`가 `serve` 또는 `funnel`
  - 위 remote surface가 없는 local mode에서는:
    - `gateway.remote.token`은 token auth가 우선 가능하고 env/auth token이 없을 때 활성
    - `gateway.remote.password`는 password auth가 우선 가능하고 env/auth password가 없을 때만 활성
- `gateway.auth.token` SecretRef는 `OPENCLAW_GATEWAY_TOKEN` 또는 `CLAWDBOT_GATEWAY_TOKEN`이 설정되어 있으면 startup auth 해석에서는 비활성입니다. 이 런타임에서는 env token 입력이 우선하기 때문입니다.

## Gateway auth surface diagnostics

`gateway.auth.token`, `gateway.auth.password`, `gateway.remote.token`, `gateway.remote.password`에 SecretRef가 구성되어 있으면 gateway startup/reload 로그가 해당 surface 상태를 명시적으로 남깁니다.

- `active`: SecretRef가 실제 auth surface 일부이며 반드시 해석되어야 합니다.
- `inactive`: 다른 auth surface가 우선하거나 remote auth가 비활성이라 이번 런타임에서는 무시됩니다.

이 항목은 `SECRETS_GATEWAY_AUTH_SURFACE`로 기록되며, 왜 active 또는 inactive로 판정되었는지 reason도 포함합니다.

## Onboarding reference preflight

온보딩이 interactive mode로 실행되고 SecretRef 저장을 선택하면, OpenClaw는 저장 전에 preflight validation을 수행합니다.

- Env ref: env var 이름을 검증하고, 온보딩 시점에 비어 있지 않은 값이 실제로 보이는지 확인합니다.
- Provider ref(`file`, `exec`): provider 선택, `id` 해석, 해석된 값의 타입을 검증합니다.
- Quickstart reuse path: `gateway.auth.token`이 이미 SecretRef인 경우, 온보딩은 probe/dashboard bootstrap 전에 같은 fail-fast gate를 사용해 해당 ref(`env`, `file`, `exec`)를 해석합니다.

검증에 실패하면 온보딩이 오류를 보여 주고 재시도를 허용합니다.

## SecretRef contract

어디에서나 같은 객체 형태를 사용합니다.

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

### `source: "env"`

```json5
{ source: "env", provider: "default", id: "OPENAI_API_KEY" }
```

검증 규칙:

- `provider`는 `^[a-z][a-z0-9_-]{0,63}$`와 일치해야 합니다.
- `id`는 `^[A-Z][A-Z0-9_]{0,127}$`와 일치해야 합니다.

### `source: "file"`

```json5
{ source: "file", provider: "filemain", id: "/providers/openai/apiKey" }
```

검증 규칙:

- `provider`는 `^[a-z][a-z0-9_-]{0,63}$`와 일치해야 합니다.
- `id`는 절대 JSON pointer(` /... `가 아니라 `/...`)여야 합니다.
- 세그먼트의 RFC6901 escaping: `~` => `~0`, `/` => `~1`

### `source: "exec"`

```json5
{ source: "exec", provider: "vault", id: "providers/openai/apiKey" }
```

검증 규칙:

- `provider`는 `^[a-z][a-z0-9_-]{0,63}$`와 일치해야 합니다.
- `id`는 `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`와 일치해야 합니다.
- `id`에는 `/`로 구분했을 때 `.` 또는 `..` 세그먼트가 들어갈 수 없습니다. 예: `a/../b`는 거부됩니다.

## Provider config

provider는 `secrets.providers` 아래에 정의합니다.

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

- 선택적으로 `allowlist`를 둘 수 있습니다.
- env 값이 없거나 비어 있으면 해석에 실패합니다.

### File provider

- `path`에 있는 로컬 파일을 읽습니다.
- `mode: "json"`은 JSON object payload를 기대하며 `id`를 pointer로 해석합니다.
- `mode: "singleValue"`는 ref id `"value"`를 기대하고 파일 내용 전체를 반환합니다.
- 경로는 ownership/permission 검사를 통과해야 합니다.
- Windows fail-closed 참고: 경로에 대해 ACL 검증을 할 수 없으면 해석이 실패합니다. 신뢰된 경로에서만 `allowInsecurePath: true`로 path security check를 우회하세요.

### Exec provider

- 셸 없이, 설정된 절대 바이너리 경로를 직접 실행합니다.
- 기본적으로 `command`는 symlink가 아닌 일반 파일을 가리켜야 합니다.
- Homebrew shim 같은 symlink command path가 필요하면 `allowSymlinkCommand: true`를 설정하세요. OpenClaw가 해석된 target path를 검증합니다.
- package manager 경로에는 `trustedDirs`와 함께 사용하는 것이 좋습니다. 예: `["/opt/homebrew"]`
- timeout, no-output timeout, output byte limit, env allowlist, trusted dirs를 지원합니다.
- Windows fail-closed 참고: command path의 ACL 검증을 할 수 없으면 해석이 실패합니다. 신뢰된 경로에서만 `allowInsecurePath: true`를 사용하세요.

요청 payload(stdin):

```json
{ "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
```

응답 payload(stdout):

```jsonc
{ "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
```

선택적인 per-id 오류:

```json
{
  "protocolVersion": 1,
  "values": {},
  "errors": { "providers/openai/apiKey": { "message": "not found" } }
}
```

## Exec integration examples

### 1Password CLI

```json5
{
  secrets: {
    providers: {
      onepassword_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/op",
        allowSymlinkCommand: true, // Homebrew symlinked binary에 필요
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
        allowSymlinkCommand: true, // Homebrew symlinked binary에 필요
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
        allowSymlinkCommand: true, // Homebrew symlinked binary에 필요
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

## Supported credential surface

지원/비지원 자격 증명의 정식 목록은 다음 문서에 정리되어 있습니다.

- [SecretRef Credential Surface](/reference/secretref-credential-surface)

런타임에서 발급되거나 주기적으로 바뀌는 자격 증명, OAuth refresh material은 의도적으로 read-only SecretRef 해석 대상에서 제외됩니다.

## Required behavior and precedence

- ref가 없는 필드: 기존과 동일하게 동작
- ref가 있는 필드: 활성 surface에서는 activation 시 반드시 해석 가능해야 함
- 평문과 ref가 함께 있으면, 지원되는 precedence path에서는 ref가 우선

경고 및 audit 신호:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (runtime warning)
- `REF_SHADOWED` (`auth-profiles.json` 자격 증명이 `openclaw.json` ref보다 우선할 때 audit finding)

Google Chat 호환 동작:

- `serviceAccountRef`가 평문 `serviceAccount`보다 우선합니다.
- 형제 ref가 설정되어 있으면 평문 값은 무시됩니다.

## Activation triggers

Secret activation은 다음 시점에 실행됩니다.

- startup (preflight + 최종 activation)
- config reload hot-apply path
- config reload restart-check path
- `secrets.reload`를 통한 수동 reload

Activation contract:

- 성공하면 snapshot을 atomically 교체합니다.
- startup에서 실패하면 gateway startup이 중단됩니다.
- runtime reload에서 실패하면 last-known-good snapshot을 유지합니다.
- outbound helper/tool call에 explicit per-call channel token을 제공해도 SecretRef activation은 일어나지 않습니다. activation 지점은 startup, reload, explicit `secrets.reload` 그대로입니다.

## Degraded and recovered signals

정상 상태 이후 reload 시점 activation에 실패하면 OpenClaw는 degraded secrets state로 들어갑니다.

one-shot system event 및 log code:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

동작:

- Degraded: runtime은 last-known-good snapshot을 계속 사용합니다.
- Recovered: 다음 activation이 성공한 뒤 한 번만 발생합니다.
- 이미 degraded 상태에서 실패가 반복되면 warning 로그만 남고 이벤트를 과도하게 반복하지 않습니다.
- startup fail-fast는 runtime이 활성화되기 전이므로 degraded event를 내지 않습니다.

## Command-path resolution

명령 경로는 gateway snapshot RPC를 통해 지원되는 SecretRef 해석을 opt-in할 수 있습니다.

크게 두 종류가 있습니다.

- strict command path: 예를 들어 `openclaw memory`의 remote-memory 경로나 `openclaw qr --remote`는 활성 snapshot을 읽고, 필요한 SecretRef를 사용할 수 없으면 fail-fast로 중단합니다.
- read-only command path: 예를 들어 `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, read-only doctor/config repair 흐름은 활성 snapshot을 우선 사용하지만, 특정 SecretRef를 못 읽는다고 명령 전체를 중단하지 않고 degrade된 출력으로 계속 진행합니다.

Read-only 동작:

- gateway가 실행 중이면 먼저 활성 snapshot을 읽습니다.
- gateway 해석이 불완전하거나 gateway가 없으면, 해당 명령 surface에 한해 targeted local fallback을 시도합니다.
- 그래도 특정 SecretRef를 사용할 수 없으면 `"configured but unavailable in this command path"` 같은 명시적 진단과 함께 degrade된 read-only 출력을 반환합니다.
- 이 degrade 동작은 해당 명령에만 적용됩니다. runtime startup, reload, send/auth path를 약하게 만들지는 않습니다.

기타 참고:

- backend secret rotation 이후 snapshot refresh는 `openclaw secrets reload`로 처리합니다.
- 이 명령 경로에서 사용하는 gateway RPC method는 `secrets.resolve`입니다.

## Audit and configure workflow

기본 운영 흐름:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

### `secrets audit`

다음 항목을 점검합니다.

- 저장 시점의 평문 값 (`openclaw.json`, `auth-profiles.json`, `.env`, 생성된 `agents/*/agent/models.json`)
- 생성된 `models.json` 항목에 남아 있는 민감 provider header 잔재
- 해석되지 않은 ref
- precedence shadowing (`auth-profiles.json`이 `openclaw.json` ref보다 우선하는 경우)
- legacy 잔재 (`auth.json`, OAuth reminder)

Header residue 참고:

- 민감 provider header 감지는 이름 휴리스틱에 기반합니다. 예를 들어 `authorization`, `x-api-key`, `token`, `secret`, `password`, `credential` 같은 공통 auth/credential header 이름과 조각을 찾습니다.

### `secrets configure`

interactive helper가 다음 작업을 지원합니다.

- 먼저 `secrets.providers`를 구성 (`env` / `file` / `exec`, add/edit/remove)
- 한 agent 범위에 대해 `openclaw.json`과 `auth-profiles.json` 안의 지원되는 secret-bearing field를 선택
- 대상 선택기에서 새 `auth-profiles.json` 매핑을 직접 생성 가능
- SecretRef 세부 정보(`source`, `provider`, `id`) 수집
- preflight resolution 실행
- 즉시 적용 가능

유용한 모드:

- `openclaw secrets configure --providers-only`
- `openclaw secrets configure --skip-provider-setup`
- `openclaw secrets configure --agent <id>`

`configure` 적용 기본값:

- 대상 provider에 대해 `auth-profiles.json`의 대응 static credential을 scrub
- `auth.json`의 legacy static `api_key` 항목 scrub
- `<config-dir>/.env`에서 대응되는 known secret line scrub

### `secrets apply`

저장된 plan을 적용합니다.

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
```

엄격한 target/path contract와 정확한 rejection rule은 다음 문서를 참고하세요.

- [Secrets Apply Plan Contract](/gateway/secrets-plan-contract)

## One-way safety policy

OpenClaw는 과거 평문 시크릿 값이 들어 있는 rollback backup을 의도적으로 기록하지 않습니다.

안전 모델:

- write mode에 들어가기 전에 preflight가 반드시 성공해야 함
- commit 전에 runtime activation을 검증함
- `apply`는 atomic file replacement와 실패 시 best-effort restore를 사용해 파일을 갱신함

## Legacy auth compatibility notes

정적 자격 증명에 대해서는, 런타임이 더 이상 평문 legacy auth 저장소에 의존하지 않습니다.

- 런타임 자격 증명 source는 해석된 메모리 스냅샷입니다.
- legacy static `api_key` 항목은 발견되면 scrub됩니다.
- OAuth 관련 호환 동작은 별도로 유지됩니다.

## Web UI note

일부 SecretInput union은 form mode보다 raw editor mode에서 설정하는 편이 더 쉽습니다.

## Related docs

- CLI 명령어: [secrets](/cli/secrets)
- plan contract 상세: [Secrets Apply Plan Contract](/gateway/secrets-plan-contract)
- credential surface: [SecretRef Credential Surface](/reference/secretref-credential-surface)
- 인증 설정: [Authentication](/gateway/authentication)
- 보안 관점: [Security](/gateway/security)
- 환경 변수 우선순위: [Environment Variables](/help/environment)
