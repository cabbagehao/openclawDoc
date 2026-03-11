---
summary: "CLI 참고: `openclaw secrets` (reload, audit, configure, apply)"
read_when:
  - 런타임에서 secret ref를 다시 해석할 때
  - 평문 잔여물과 unresolved ref를 점검할 때
  - SecretRef를 설정하고 일방향 scrub 변경을 적용할 때
title: "secrets"
---

# `openclaw secrets`

`openclaw secrets`는 SecretRef를 관리하고 현재 런타임 snapshot을 건강한 상태로 유지할 때 사용합니다.

명령 역할:

- `reload`: gateway RPC(`secrets.reload`)로 ref를 다시 해석하고, 완전히 성공했을 때만 runtime snapshot을 교체합니다(config 파일은 쓰지 않음).
- `audit`: configuration/auth/generated-model 저장소와 legacy residue를 읽기 전용으로 스캔하여 plaintext, unresolved ref, precedence drift를 찾습니다.
- `configure`: provider 설정, 대상 매핑, preflight를 위한 대화형 planner입니다(TTY 필요).
- `apply`: 저장된 plan을 실행합니다. `--dry-run`은 검증만 수행하고, 이후 지정된 plaintext residue를 scrub합니다.

권장 운영 루프:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets audit --check
openclaw secrets reload
```

CI/게이트용 종료 코드 참고:

- `audit --check`는 발견 사항이 있으면 `1`을 반환합니다.
- unresolved ref는 `2`를 반환합니다.

관련 문서:

- Secrets guide: [Secrets Management](/gateway/secrets)
- Credential surface: [SecretRef Credential Surface](/reference/secretref-credential-surface)
- Security guide: [Security](/gateway/security)

## Reload runtime snapshot

secret ref를 다시 해석하고 runtime snapshot을 원자적으로 교체합니다.

```bash
openclaw secrets reload
openclaw secrets reload --json
```

참고:

- gateway RPC 메서드 `secrets.reload`를 사용합니다.
- 해석에 실패하면 gateway는 마지막 정상 snapshot을 유지하고 오류를 반환합니다. 부분 적용은 없습니다.
- JSON 응답에는 `warningCount`가 포함됩니다.

## Audit

다음 항목에 대해 OpenClaw 상태를 스캔합니다.

- plaintext secret 저장
- unresolved ref
- precedence drift(`auth-profiles.json` 자격 증명이 `openclaw.json` ref를 가리는 경우)
- 생성된 `agents/*/agent/models.json` residue(provider `apiKey` 값과 민감한 provider header)
- legacy residue(legacy auth store 항목, OAuth reminder)

Header residue 참고:

- 민감한 provider header 탐지는 이름 기반 휴리스틱입니다. `authorization`, `x-api-key`, `token`, `secret`, `password`, `credential` 같은 공통 인증 헤더명과 조각을 사용합니다.

```bash
openclaw secrets audit
openclaw secrets audit --check
openclaw secrets audit --json
```

종료 동작:

- `--check`는 발견 사항이 있으면 non-zero로 종료합니다.
- unresolved ref는 더 높은 우선순위의 non-zero 코드로 종료합니다.

리포트 주요 필드:

- `status`: `clean | findings | unresolved`
- `summary`: `plaintextCount`, `unresolvedRefCount`, `shadowedRefCount`, `legacyResidueCount`
- finding code:
  - `PLAINTEXT_FOUND`
  - `REF_UNRESOLVED`
  - `REF_SHADOWED`
  - `LEGACY_RESIDUE`

## Configure (interactive helper)

대화형으로 provider와 SecretRef 변경을 구성하고, preflight를 수행한 뒤 선택적으로 적용합니다.

```bash
openclaw secrets configure
openclaw secrets configure --plan-out /tmp/openclaw-secrets-plan.json
openclaw secrets configure --apply --yes
openclaw secrets configure --providers-only
openclaw secrets configure --skip-provider-setup
openclaw secrets configure --agent ops
openclaw secrets configure --json
```

흐름:

- 먼저 provider 설정(`secrets.providers` alias의 `add/edit/remove`)
- 그다음 credential mapping(필드를 선택하고 `{source, provider, id}` ref 배정)
- 마지막으로 preflight 및 선택적 apply

플래그:

- `--providers-only`: `secrets.providers`만 설정하고 credential mapping은 건너뜀
- `--skip-provider-setup`: provider 설정은 건너뛰고 기존 provider에 credential mapping만 수행
- `--agent <id>`: `auth-profiles.json` 대상 탐색과 쓰기 범위를 하나의 agent store로 제한

참고:

- 대화형 TTY가 필요합니다.
- `--providers-only`와 `--skip-provider-setup`은 함께 사용할 수 없습니다.
- `configure`는 `openclaw.json`의 secret-bearing field와 선택된 agent 범위의 `auth-profiles.json`을 대상으로 합니다.
- `configure`는 picker 흐름에서 직접 새 `auth-profiles.json` 매핑을 만들 수 있습니다.
- 정식 지원 surface는 [SecretRef Credential Surface](/reference/secretref-credential-surface)입니다.
- apply 전에 preflight resolution을 수행합니다.
- 생성된 plan은 기본적으로 scrub 옵션(`scrubEnv`, `scrubAuthProfilesForProviderTargets`, `scrubLegacyAuthJson`)이 모두 활성화됩니다.
- apply 경로는 scrub된 plaintext 값에 대해 일방향입니다.
- `--apply`를 쓰지 않아도 CLI는 preflight 뒤에 `Apply this plan now?`를 물어봅니다.
- `--apply`를 사용하고 `--yes`가 없으면, 되돌릴 수 없다는 추가 확인 프롬프트가 표시됩니다.

Exec provider 안전성 참고:

- Homebrew 설치는 종종 `/opt/homebrew/bin/*` 아래의 심볼릭 링크 바이너리를 노출합니다.
- 신뢰된 package-manager 경로에 꼭 필요할 때만 `allowSymlinkCommand: true`를 설정하고, `trustedDirs`(예: `["/opt/homebrew"]`)와 함께 사용하세요.
- Windows에서 provider 경로의 ACL 검증을 할 수 없으면 OpenClaw는 fail closed 합니다. 신뢰된 경로에서만 해당 provider에 `allowInsecurePath: true`를 설정해 경로 보안 검사를 우회하세요.

## Apply a saved plan

이전에 생성한 plan을 적용하거나 preflight만 수행합니다.

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --json
```

Plan 계약 세부 사항(허용 대상 경로, 검증 규칙, 실패 의미):

- [Secrets Apply Plan Contract](/gateway/secrets-plan-contract)

`apply`가 갱신할 수 있는 것:

- `openclaw.json` (SecretRef 대상 + provider upsert/delete)
- `auth-profiles.json` (provider-target scrubbing)
- legacy `auth.json` residue
- 마이그레이션된 값에 해당하는 `~/.openclaw/.env`의 알려진 secret key

## Why no rollback backups

`secrets apply`는 이전 plaintext 값을 포함한 rollback backup을 의도적으로 만들지 않습니다.

안전성은 엄격한 preflight와, 실패 시 best-effort 메모리 복구를 포함한 거의 원자적인 apply 경로에서 보장됩니다.

## Example

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

`audit --check`가 여전히 plaintext 발견 사항을 보고하면, 남아 있는 대상 경로를 수정한 뒤 audit을 다시 실행하세요.
