---
summary: "`secrets apply` 계획을 위한 계약: target validation, path matching, `auth-profiles.json` target scope"
read_when:
  - `openclaw secrets apply` 계획을 생성하거나 검토할 때
  - `Invalid plan target path` 오류를 디버깅할 때
  - target type 및 path validation 동작을 이해할 때
title: "Secrets Apply Plan Contract"
---

# Secrets apply plan contract

이 페이지는 `openclaw secrets apply` 가 강제하는 엄격한 계약을 정의합니다.

target 이 이 규칙과 맞지 않으면, apply 는 config 를 변경하기 전에 실패합니다.

## Plan file shape

`openclaw secrets apply --from <plan.json>` 은 plan target 의 `targets` 배열을 기대합니다:

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

plan target 은 다음의 지원되는 credential path 에 대해서만 허용됩니다:

- [SecretRef Credential Surface](/reference/secretref-credential-surface)

## Target type behavior

일반 규칙:

- `target.type` 은 인식 가능한 값이어야 하며, 정규화된 `target.path` shape 와 일치해야 합니다.

기존 plan 과의 호환을 위한 alias 는 계속 허용됩니다:

- `models.providers.apiKey`
- `skills.entries.apiKey`
- `channels.googlechat.serviceAccount`

## Path validation rules

각 target 은 다음을 모두 만족해야 합니다:

- `type` 이 인식 가능한 target type 이어야 함
- `path` 는 비어 있지 않은 dot path 여야 함
- `pathSegments` 는 생략 가능. 제공되면 `path` 와 정확히 같은 경로로 정규화되어야 함
- 금지된 segment 는 거부됨: `__proto__`, `prototype`, `constructor`
- 정규화된 path 는 target type 에 등록된 path shape 와 일치해야 함
- `providerId` 또는 `accountId` 가 설정되어 있으면 path 에 인코딩된 id 와 일치해야 함
- `auth-profiles.json` target 은 `agentId` 가 필요함
- 새로운 `auth-profiles.json` 매핑을 만들 때는 `authProfileProvider` 를 포함해야 함

## Failure behavior

target 이 validation 에 실패하면 apply 는 다음과 같은 오류로 종료됩니다:

```text
Invalid plan target path for models.providers.apiKey: models.providers.openai.baseUrl
```

잘못된 plan 에 대해서는 어떤 write 도 커밋되지 않습니다.

## Runtime and audit scope notes

- ref-only `auth-profiles.json` 항목(`keyRef`/`tokenRef`)은 runtime resolution 과 audit coverage 에 포함됩니다.
- `secrets apply` 는 지원되는 `openclaw.json` target, 지원되는 `auth-profiles.json` target, 그리고 선택적 scrub target 을 씁니다.

## Operator checks

```bash
# 쓰기 없이 계획 검증
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run

# 그런 다음 실제 적용
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
```

invalid target path 메시지와 함께 apply 가 실패하면, `openclaw secrets configure` 로 plan 을 다시 생성하거나 위에서 지원되는 shape 로 target path 를 수정하세요.

## Related docs

- [Secrets Management](/gateway/secrets)
- [CLI `secrets`](/cli/secrets)
- [SecretRef Credential Surface](/reference/secretref-credential-surface)
- [Configuration Reference](/gateway/configuration-reference)
