---
summary: "`secrets apply` 계획(Plan)을 위한 규격 정의: 대상 검증, 경로 매칭 및 auth-profiles.json 적용 범위 안내"
read_when:
  - `openclaw secrets apply` 실행을 위한 계획 파일을 생성하거나 검토할 때
  - `Invalid plan target path` 오류 발생 시 원인을 파악하고자 할 때
  - 대상 타입(Target type) 및 경로 검증 규칙을 이해해야 할 때
title: "시크릿 적용 계획 규격"
x-i18n:
  source_path: "gateway/secrets-plan-contract.md"
---

# 시크릿 적용 계획 규격 (Secrets Apply Plan Contract)

본 문서는 `openclaw secrets apply` 명령어가 강제하는 엄격한 데이터 규격(Contract)을 정의함.

적용 대상(Target)이 아래 규칙을 충족하지 않을 경우, 실제 설정 파일을 변경하기 전 단계에서 실행이 중단됨.

## 계획 파일 구조

`openclaw secrets apply --from <plan.json>` 명령어는 `targets` 배열을 포함한 다음과 같은 구조를 기대함:

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

## 지원 대상 범위

계획 파일 내의 대상은 아래 문서에 명시된 자격 증명 경로에 대해서만 허용됨:

- [시크릿 참조 지원 필드 레퍼런스](/reference/secretref-credential-surface)

## 대상 타입(Target Type) 동작 규칙

- **일치 여부**: `target.type`은 시스템이 인식할 수 있는 값이어야 하며, 정규화된 `target.path` 구조와 완벽히 일치해야 함.
- **호환성 별칭**: 기존 계획과의 하위 호환성을 위해 다음 별칭(Alias)들이 허용됨:
  - `models.providers.apiKey`
  - `skills.entries.apiKey`
  - `channels.googlechat.serviceAccount`

## 경로 검증 규칙

각 대상은 다음의 모든 검사 과정을 통과해야 함:

- `type`은 등록된 유효한 대상 타입이어야 함.
- `path`는 비어 있지 않은 점(dot) 구분자 기반의 경로 문자열이어야 함.
- `pathSegments`가 제공될 경우, 이를 합친 결과가 `path`와 정확히 일치해야 함.
- 금지된 세그먼트(`__proto__`, `prototype`, `constructor`)를 포함할 수 없음.
- 정규화된 경로는 해당 대상 타입에 정의된 경로 형태(Shape)를 따라야 함.
- `providerId` 또는 `accountId`가 명시된 경우, 경로 내에 인코딩된 식별자와 값이 일치해야 함.
- `auth-profiles.json` 대상의 경우 반드시 `agentId` 정보가 포함되어야 함.
- 새로운 `auth-profiles.json` 매핑을 생성할 때는 `authProfileProvider` 정보를 포함해야 함.

## 실패 시 동작

검증에 실패한 대상이 하나라도 발견되면 다음과 같은 오류 메시지와 함께 즉시 종료됨:

```text
Invalid plan target path for models.providers.apiKey: models.providers.openai.baseUrl
```

잘못된 계획에 대해서는 어떠한 파일 쓰기 작업도 수행되지 않음.

## 운영 참고 사항

- **런타임 및 감사**: 참조 전용 `auth-profiles.json` 항목(`keyRef`, `tokenRef`)은 런타임 해석 및 감사 범위에 자동으로 포함됨.
- **적용 범위**: `secrets apply` 명령은 `openclaw.json`과 `auth-profiles.json` 내의 지원 대상에 대해 업데이트를 수행하며, 선택적으로 기존 평문 정보를 제거(Scrub)함.

## 관리자 점검 절차

```bash
# 1. 파일 수정 없이 계획 검증만 수행 (Dry-run)
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run

# 2. 검증 완료 후 실제 적용
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
```

만약 유효하지 않은 대상 경로 오류로 실행이 실패한다면, `openclaw secrets configure` 명령을 통해 계획 파일을 다시 생성하거나 위의 규칙에 맞게 경로를 수정해야 함.

## 관련 문서 목록

- [시크릿 관리 가이드](/gateway/secrets)
- [시크릿 관련 CLI 명령어](/cli/secrets)
- [시크릿 참조 지원 필드 목록](/reference/secretref-credential-surface)
- [Gateway 설정 상세 레퍼런스](/gateway/configuration-reference)
