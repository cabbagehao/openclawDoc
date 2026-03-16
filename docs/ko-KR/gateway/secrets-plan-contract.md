---
summary: "`secrets apply` 계획(Plan)을 위한 규격 정의: 대상 검증, 경로 매칭 및 auth-profiles.json 적용 범위 안내"
description: "`openclaw secrets apply`가 허용하는 target types, path validation rules, `auth-profiles.json` scope를 정의한 계약 문서입니다."
read_when:
  - "`openclaw secrets apply` 실행을 위한 계획 파일을 생성하거나 검토할 때"
  - "`Invalid plan target path` 오류 발생 시 원인을 파악하고자 할 때"
  - 대상 타입(Target type) 및 경로 검증 규칙을 이해해야 할 때
title: "시크릿 적용 계획 규격"
x-i18n:
  source_path: "gateway/secrets-plan-contract.md"
---

# 시크릿 적용 계획 규격

이 문서는 `openclaw secrets apply`가 강제하는 엄격한 contract를 정의합니다.

target이 아래 규칙을 충족하지 않으면, 실제 config를 변경하기 전에 apply가 실패합니다.

## Plan file shape

`openclaw secrets apply --from <plan.json>`은 `targets` 배열을 포함한 다음 구조를 기대합니다.

```json5
{
  version: 1,
  protocolVersion: 1,
  targets: [
    {
      type: "models.providers.apiKey",
      path: "models.providers.openai.apiKey",
      pathSegments: ["models", "providers", "openai", "apiKey"],
      providerId: "openai",
      ref: { source: "env", provider: "default", id: "OPENAI_API_KEY" },
    },
    {
      type: "auth-profiles.api_key.key",
      path: "profiles.openai:default.key",
      pathSegments: ["profiles", "openai:default", "key"],
      agentId: "main",
      ref: { source: "env", provider: "default", id: "OPENAI_API_KEY" },
    },
  ],
}
```

## Supported target scope

plan targets는 다음 문서에 나오는 supported credential paths에 대해서만 허용됩니다.

- [SecretRef Credential Surface](/reference/secretref-credential-surface)

## Target type behavior

General rule:

- `target.type`은 인식 가능한 값이어야 하며, 정규화된 `target.path` shape와 일치해야 합니다.

Compatibility aliases는 기존 plans를 위해 계속 허용됩니다.
  - `models.providers.apiKey`
  - `skills.entries.apiKey`
  - `channels.googlechat.serviceAccount`

## Path validation rules

각 target은 다음 조건을 모두 통과해야 합니다.

- `type`은 인식 가능한 target type이어야 합니다.
- `path`는 비어 있지 않은 dot path여야 합니다.
- `pathSegments`는 생략할 수 있습니다. 제공되면 정규화 결과가 `path`와 정확히 같아야 합니다.
- 금지된 segments는 거부됩니다: `__proto__`, `prototype`, `constructor`
- 정규화된 path는 target type에 등록된 path shape와 일치해야 합니다.
- `providerId` 또는 `accountId`가 있으면 path 안에 인코딩된 id와 일치해야 합니다.
- `auth-profiles.json` targets에는 `agentId`가 필요합니다.
- 새 `auth-profiles.json` mapping을 만들 때는 `authProfileProvider`를 포함해야 합니다.

## Failure behavior

target이 검증에 실패하면 다음과 같은 오류와 함께 즉시 종료합니다.

```text
Invalid plan target path for models.providers.apiKey: models.providers.openai.baseUrl
```

잘못된 plan에 대해서는 어떤 write도 commit되지 않습니다.

## Runtime and audit scope notes

- ref-only `auth-profiles.json` 항목 (`keyRef`, `tokenRef`)은 runtime resolution과 audit coverage에 포함됩니다.
- `secrets apply`는 supported `openclaw.json` targets, supported `auth-profiles.json` targets, optional scrub targets를 기록합니다.

## Operator checks

```bash
# Validate plan without writes
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run

# Then apply for real
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
```

invalid target path 메시지로 실패하면, `openclaw secrets configure`로 plan을 다시 생성하거나 위 규칙에 맞게 target path를 수정하세요.

## Related docs

- [Secrets Management](/gateway/secrets)
- [CLI `secrets`](/cli/secrets)
- [SecretRef Credential Surface](/reference/secretref-credential-surface)
- [Configuration Reference](/gateway/configuration-reference)
