---
summary: "시크릿 관리 가이드: SecretRef 규격, 런타임 스냅샷 동작 및 안전한 보안 마스킹 정책 안내"
read_when:
  - 공급자 자격 증명 및 auth-profiles.json 참조를 위한 SecretRef를 구성할 때
  - 운영 환경에서 시크릿 갱신, 감사, 구성 및 적용 작업을 수행할 때
  - 시작 시 빠른 실패(Fail-fast), 비활성 인터페이스 필터링 및 마지막 정상 상태 복구 동작을 이해하고자 할 때
title: "시크릿 관리"
x-i18n:
  source_path: "gateway/secrets.md"
---

# 시크릿 관리 (Secrets Management)

OpenClaw는 **시크릿 참조(SecretRef)** 기능을 지원하여, 주요 자격 증명 정보를 설정 파일에 평문(Plaintext)으로 저장하지 않고 안전하게 관리할 수 있도록 함.

평문 저장 방식도 여전히 작동하지만, 보안 강화를 위해 자격 증명별로 시크릿 참조 방식을 선택적으로 적용할 것을 권장함.

## 목표 및 런타임 모델

시크릿 정보는 메모리상의 **런타임 스냅샷**으로 해석되어 관리됨.

* **선제적 해석**: 시크릿 해석은 요청 시점(Lazy)이 아닌, 활성화 단계에서 즉시(Eager) 수행됨.
* **빠른 실패 (Fail-fast)**: 활성화된 시크릿 참조를 해석할 수 없는 경우 Gateway 시작이 즉시 중단됨.
* **원자적 갱신 (Atomic swap)**: 설정 재로드 시 전체 해석이 성공한 경우에만 스냅샷을 교체하며, 실패 시 마지막 정상 스냅샷(Last-known-good)을 유지함.
* **메모리 기반**: 런타임 요청은 오직 활성화된 메모리 스냅샷 정보만 참조함.

이를 통해 시크릿 공급자의 일시적인 장애가 실제 메시지 처리 경로에 영향을 주지 않도록 격리함.

## 활성 인터페이스 필터링 (Active-surface filtering)

시크릿 참조는 실제 활성화된 인터페이스에서만 검증됨.

* **활성 상태**: 해석 실패 시 시스템 시작이나 재로드가 차단됨.
* **비활성 상태**: 해석 실패가 시스템 구동을 방해하지 않음. `SECRETS_REF_IGNORED_INACTIVE_SURFACE` 코드로 진단 정보만 기록됨.

**비활성 상태의 예시:**

* 비활성화된 채널 또는 계정 항목.
* 활성화된 계정에서 상속받지 않는 최상위 채널 자격 증명.
* 비활성화된 도구 또는 기능 인터페이스.
* `tools.web.search.provider`에서 선택되지 않은 검색 공급자 전용 키. (단, 자동 감지 모드인 경우 활성 상태로 간주됨)
* 환경 변수(`OPENCLAW_GATEWAY_TOKEN` 등)가 우선순위를 가져서 설정 파일의 시크릿 참조가 무시되는 경우.

## Gateway 인증 인터페이스 진단

`gateway.auth.*` 또는 `gateway.remote.*` 관련 시크릿 참조가 구성된 경우, 시작 및 재로드 시 해당 상태를 명시적으로 로그에 기록함:

* **`active`**: 해당 참조가 실제 인증 인터페이스의 일부이며 반드시 해석되어야 함을 의미함.
* **`inactive`**: 다른 인증 수단(환경 변수 등)이 우선하거나 해당 기능이 비활성화되어 무시됨을 의미함.

로그 항목에는 `SECRETS_GATEWAY_AUTH_SURFACE` 코드와 함께 구체적인 판정 사유가 포함됨.

## 온보딩 시 참조 검증

대화형 온보딩(`openclaw onboard`) 과정에서 시크릿 참조 저장을 선택하면, 저장 전 미리 검증(Preflight)을 수행함:

* **환경 변수 참조**: 변수 이름의 유효성을 검사하고 실제 값이 존재하는지 확인함.
* **공급자 참조 (`file`, `exec`)**: 공급자 선택, ID 해석 및 반환된 값의 데이터 타입을 검증함.

검증 실패 시 오류 내용을 표시하고 수정을 요청함.

## SecretRef 규격 (Contract)

모든 시크릿 참조는 다음의 통일된 객체 구조를 사용함:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

### 1) `source: "env"` (환경 변수)

```json5
{ source: "env", provider: "default", id: "OPENAI_API_KEY" }
```

* **`provider`**: 소문자, 숫자, 하이픈, 언더바 조합 (최대 64자).
* **`id`**: 대문자 환경 변수명 (최대 128자).

### 2) `source: "file"` (로컬 파일)

```json5
{ source: "file", provider: "filemain", id: "/providers/openai/apiKey" }
```

* **`id`**: 절대 경로 형식의 JSON 포인터 (`/...`). RFC6901 이스케이프 규칙(`~` → `~0`, `/` → `~1`)을 따름.

### 3) `source: "exec"` (외부 실행 파일)

```json5
{ source: "exec", provider: "vault", id: "providers/openai/apiKey" }
```

* **`id`**: 영문, 숫자 및 특수문자(`.`, `_`, `:`, `/`, `-`) 조합 (최대 256자).

## 시크릿 공급자 설정

`secrets.providers` 섹션에서 각 공급자를 정의함:

```json5
{
  secrets: {
    providers: {
      default: { source: "env" },
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json", // 또는 "singleValue"
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/vault-helper",
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
  },
}
```

### 공급자별 특이사항

* **환경 변수(`env`)**: 값이 비어 있거나 변수가 없는 경우 해석 실패로 처리됨.
* **파일(`file`)**: `mode: "json"`은 파일 내 특정 포인터를 참조하고, `"singleValue"`는 파일 내용 전체를 값으로 사용함. 경로에 대한 소유권 및 권한 검사를 수행함.
* **실행 파일(`exec`)**: 절대 경로의 바이너리를 직접 실행함(셸 미사용). 기본적으로 심볼릭 링크는 허용되지 않으나 `allowSymlinkCommand: true` 설정을 통해 해제 가능함. 타임아웃 및 출력 크기 제한을 지원함.

## 실행 파일(Exec) 연동 예시

### 1Password CLI 연동

```json5
{ source: "exec", provider: "op", id: "op://Vault/Item/password" }
```

### HashiCorp Vault CLI 연동

```json5
{ source: "exec", provider: "vault", id: "secret/data/openclaw" }
```

### sops (복호화) 연동

```json5
{ source: "exec", provider: "sops", id: "value" }
```

## 지원되는 자격 증명 필드

시크릿 참조가 가능한 필드 목록은 [시크릿 참조 지원 필드 레퍼런스](/reference/secretref-credential-surface)를 참조함. 런타임에서 생성되는 토큰이나 OAuth 리프레시 토큰 등은 의도적으로 제외됨.

## 우선순위 및 동작 규칙

* **참조 우선**: 동일 필드에 평문 값과 시크릿 참조가 모두 정의된 경우, 참조 정보가 우선적으로 적용됨.
* **경고 신호**: 평문 값이 참조에 의해 무시될 경우 `SECRETS_REF_OVERRIDES_PLAINTEXT` 로그가 기록됨.
* **Google Chat 특이사항**: `serviceAccountRef` 설정 시 평문 `serviceAccount` 값은 무시됨.

## 상태 진단 신호 (Degraded/Recovered)

정상 운영 중 시크릿 재해석에 실패하면 **기능 저하(Degraded)** 상태로 진입함:

* **`SECRETS_RELOADER_DEGRADED`**: 재해석 실패 시 발생. 시스템은 마지막 정상 스냅샷을 계속 사용함.
* **`SECRETS_RELOADER_RECOVERED`**: 다음 성공적인 활성화 시 발생.

시작 시점의 해석 실패는 기능 저하 이벤트를 발생시키지 않고 프로세스를 즉시 종료함.

## 감사 및 구성 워크플로 (Audit & Configure)

안전한 시크릿 관리를 위한 권장 절차:

```bash
openclaw secrets audit --check   # 평문 노출 여부 점검
openclaw secrets configure       # 시크릿 참조 구성 (대화형)
openclaw secrets audit --check   # 결과 재확인
```

### 시크릿 감사 (`audit`)

* 파일(`openclaw.json`, `.env` 등) 내 평문 시크릿 존재 여부 확인.
* 생성된 모델 정보 내 민감한 헤더 잔재 확인.
* 해석되지 않은 참조 및 우선순위 충돌 점검.

### 시크릿 구성 (`configure`)

* 공급자 등록부터 필드 선택까지 대화형으로 지원함.
* 기존 평문 정보를 시크릿 참조로 전환하고, 원본 파일에서 평문 정보를 안전하게 제거(Scrub)할 수 있음.

## 안전 정책 (One-way Safety)

OpenClaw는 보안을 위해 **과거의 평문 시크릿이 포함된 백업 파일을 생성하지 않음.**

* 모든 쓰기 작업 전 미리 검증을 수행함.
* 파일 업데이트 시 원자적 교체 방식을 사용하며 실패 시 최선의 복구(Best-effort restore)를 시도함.

## 관련 문서 목록

* CLI 명령어 상세: [시크릿 명령어 레퍼런스](/cli/secrets)
* 시크릿 적용 계획 규격: [시크릿 적용 계획 계약서](/gateway/secrets-plan-contract)
* 지원 필드 목록: [시크릿 참조 지원 필드](/reference/secretref-credential-surface)
* 인증 설정: [인증 가이드](/gateway/authentication)
* 시스템 보안: [보안 가이드](/gateway/security)
* 환경 변수 우선순위: [환경 설정 도움말](/help/environment)
