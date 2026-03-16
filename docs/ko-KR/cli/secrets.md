---
summary: "CLI reference for `openclaw secrets` (reload, audit, configure, apply)"
description: "SecretRef를 다시 해석하고 plaintext 잔여물을 감사하며 interactive plan을 적용하는 `openclaw secrets` 명령 흐름을 설명합니다."
read_when:
  - runtime에서 secret ref를 다시 resolve하고 싶을 때
  - plaintext 잔여물과 unresolved ref를 audit하고 싶을 때
  - SecretRef를 구성하고 one-way scrub 변경을 적용하고 싶을 때
title: "secrets"
x-i18n:
  source_path: "cli/secrets.md"
---

# `openclaw secrets`

`openclaw secrets`는 SecretRef를 관리하고 active runtime snapshot을 건강하게 유지하는 데 사용합니다.

Command roles:

- `reload`: gateway RPC(`secrets.reload`)로 ref를 다시 resolve하고, 전체 성공 시에만 runtime snapshot을 교체합니다. (config write 없음)
- `audit`: config, auth, generated-model store, legacy residue를 read-only로 스캔하여 plaintext, unresolved ref, precedence drift를 찾습니다.
- `configure`: provider setup, target mapping, preflight를 위한 interactive planner입니다. (TTY 필요)
- `apply`: 저장된 plan을 실행합니다. (`--dry-run`은 validation만) 이후 대상 plaintext residue를 scrub합니다.

권장 operator loop:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets audit --check
openclaw secrets reload
```

CI/gate용 exit code:

- `audit --check`는 finding이 있으면 `1`을 반환합니다.
- unresolved ref는 `2`를 반환합니다.

Related:

- Secrets guide: [Secrets Management](/gateway/secrets)
- Credential surface: [SecretRef Credential Surface](/reference/secretref-credential-surface)
- Security guide: [Security](/gateway/security)

## Reload runtime snapshot

secret ref를 다시 resolve하고 runtime snapshot을 atomic하게 교체합니다.

```bash
openclaw secrets reload
openclaw secrets reload --json
```

Notes:

- gateway RPC method `secrets.reload`를 사용합니다.
- resolution이 실패하면 gateway는 마지막 known-good snapshot을 유지하고 오류를 반환합니다. (partial activation 없음)
- JSON response에는 `warningCount`가 포함됩니다.

## Audit

OpenClaw state에서 다음을 스캔합니다.

- plaintext secret storage
- unresolved ref
- precedence drift (`auth-profiles.json` credential이 `openclaw.json` ref를 가리는 경우)
- generated `agents/*/agent/models.json` residue (provider `apiKey` 값과 민감한 provider header)
- legacy residue (legacy auth store entry, OAuth reminder)

Header residue 참고:

- 민감한 provider header 탐지는 이름 기반 heuristic입니다. (`authorization`, `x-api-key`, `token`, `secret`, `password`, `credential` 등)

```bash
openclaw secrets audit
openclaw secrets audit --check
openclaw secrets audit --json
```

Exit behavior:

- `--check`는 finding이 있으면 non-zero로 종료합니다.
- unresolved ref는 더 높은 우선순위의 non-zero code로 종료합니다.

Report shape highlights:

- `status`: `clean | findings | unresolved`
- `summary`: `plaintextCount`, `unresolvedRefCount`, `shadowedRefCount`, `legacyResidueCount`
- finding code:
  - `PLAINTEXT_FOUND`
  - `REF_UNRESOLVED`
  - `REF_SHADOWED`
  - `LEGACY_RESIDUE`

## Configure (interactive helper)

provider와 SecretRef 변경을 interactive하게 구성하고 preflight를 실행한 뒤, 원하면 바로 apply합니다.

```bash
openclaw secrets configure
openclaw secrets configure --plan-out /tmp/openclaw-secrets-plan.json
openclaw secrets configure --apply --yes
openclaw secrets configure --providers-only
openclaw secrets configure --skip-provider-setup
openclaw secrets configure --agent ops
openclaw secrets configure --json
```

Flow:

- 먼저 provider setup (`secrets.providers` alias의 add/edit/remove)
- 다음 credential mapping (field를 선택하고 `{source, provider, id}` ref 할당)
- 마지막으로 preflight와 optional apply

Flags:

- `--providers-only`: `secrets.providers`만 구성하고 credential mapping은 건너뜁니다.
- `--skip-provider-setup`: provider setup을 건너뛰고 기존 provider에 credential을 매핑합니다.
- `--agent <id>`: `auth-profiles.json` target discovery와 write 범위를 하나의 agent store로 제한합니다.

Notes:

- interactive TTY가 필요합니다.
- `--providers-only`와 `--skip-provider-setup`은 함께 사용할 수 없습니다.
- `configure`는 `openclaw.json`과 선택한 agent 범위의 `auth-profiles.json`에서 secret-bearing field를 대상으로 합니다.
- `configure`는 picker flow에서 새로운 `auth-profiles.json` mapping을 직접 만드는 것도 지원합니다.
- canonical supported surface: [SecretRef Credential Surface](/reference/secretref-credential-surface)
- apply 전에 preflight resolution을 수행합니다.
- 생성된 plan은 기본적으로 scrub option(`scrubEnv`, `scrubAuthProfilesForProviderTargets`, `scrubLegacyAuthJson`)이 모두 활성화됩니다.
- scrub된 plaintext value에 대해 apply 경로는 되돌릴 수 없습니다.
- `--apply`가 없더라도 preflight 뒤에는 `Apply this plan now?`를 묻습니다.
- `--apply`가 있고 `--yes`가 없으면, 되돌릴 수 없다는 추가 확인을 한 번 더 묻습니다.

Exec provider safety note:

- Homebrew 설치는 종종 `/opt/homebrew/bin/*` 아래 symlink binary를 노출합니다.
- 필요할 때만 `allowSymlinkCommand: true`를 켜고, `trustedDirs`(예: `["/opt/homebrew"]`)와 함께 사용하세요.
- Windows에서 provider path의 ACL verification을 할 수 없으면 OpenClaw는 fail-closed로 동작합니다. 신뢰하는 경로에 한해서만 해당 provider에 `allowInsecurePath: true`를 설정해 우회하세요.

## Apply a saved plan

이전에 생성한 plan을 적용하거나 preflight만 실행합니다.

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --json
```

plan contract detail(허용 target path, validation rule, failure semantic):

- [Secrets Apply Plan Contract](/gateway/secrets-plan-contract)

`apply`가 갱신할 수 있는 대상:

- `openclaw.json` (SecretRef target + provider upsert/delete)
- `auth-profiles.json` (provider-target scrubbing)
- legacy `auth.json` residue
- 값이 migration된 `~/.openclaw/.env`의 known secret key

## Why no rollback backups

`secrets apply`는 이전 plaintext 값을 담은 rollback backup을 의도적으로 만들지 않습니다.

안전성은 엄격한 preflight와, failure 시 best-effort in-memory restore를 수행하는 atomic-ish apply에서 나옵니다.

## Example

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

`audit --check`가 여전히 plaintext finding을 보고하면, 남은 target path를 수정하고 audit를 다시 실행하세요.
