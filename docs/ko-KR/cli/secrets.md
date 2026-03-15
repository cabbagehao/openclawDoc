---
summary: "시크릿 참조(SecretRef) 재해석, 평문 잔여물 점검 및 시크릿 구성을 위한 `openclaw secrets` 명령어 레퍼런스"
read_when:
  - 런타임 시점에 시크릿 참조를 다시 해석(Resolve)하고자 할 때
  - 설정 파일 내 평문 노출 여부나 해석되지 않은 참조를 감사(Audit)할 때
  - 새로운 시크릿 공급자를 구성하고 평문 데이터를 시크릿 참조로 일괄 전환할 때
title: "secrets"
x-i18n:
  source_path: "cli/secrets.md"
---

# `openclaw secrets`

시크릿 참조(SecretRef)를 관리하고 현재 런타임 스냅샷의 무결성을 유지함.

## 하위 명령어 역할

- **`reload`**: Gateway RPC(`secrets.reload`)를 호출하여 모든 참조를 다시 해석함. 완전히 성공했을 때만 런타임 스냅샷을 교체하며, 설정 파일은 수정하지 않음.
- **`audit`**: 설정, 인증 프로필, 생성된 모델 정보 및 레거시 잔여물을 읽기 전용으로 스캔하여 평문 비밀 정보 노출, 해석되지 않은 참조, 우선순위 불일치 등을 점검함.
- **`configure`**: 시크릿 공급자 설정 및 필드 매핑을 위한 대화형 계획 도구(Planner)임. (터미널 TTY 환경 필요)
- **`apply`**: 저장된 계획 파일(`.json`)을 실행함. `--dry-run`으로 검증만 수행하거나, 실제 실행 후 기존의 평문 잔여물들을 영구 삭제(Scrub)함.

## 권장 운영 프로세스

```bash
# 1. 현재 상태 점검
openclaw secrets audit --check

# 2. 대화형 설정 및 계획 생성
openclaw secrets configure

# 3. 생성된 계획 검증 (Dry-run)
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run

# 4. 계획 실제 적용 및 평문 데이터 삭제
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json

# 5. 최종 점검 및 런타임 반영
openclaw secrets audit --check
openclaw secrets reload
```

**종료 코드 안내 (CI/CD 연동용):**
- `audit --check`: 문제 발견 시 `1` 반환.
- 해석되지 않은 참조 존재 시 `2` 반환.

**관련 문서:**
- 시크릿 관리 가이드: [Secrets Management](/gateway/secrets)
- 지원되는 시크릿 필드 목록: [SecretRef Credential Surface](/reference/secretref-credential-surface)
- 보안 아키텍처 개요: [Security](/gateway/security)

---

## 런타임 스냅샷 재로드 (Reload)

시크릿 참조를 다시 해석하고 런타임 스냅샷을 원자적으로 교체함.

```bash
openclaw secrets reload
openclaw secrets reload --json
```

- **동작 특징**: 해석 과정에서 하나라도 실패하면 기존의 정상 스냅샷을 유지하고 오류를 반환함. 부분적인 적용은 지원하지 않음.
- **결과값**: JSON 응답에는 `warningCount` 정보가 포함됨.

## 시크릿 감사 (Audit)

OpenClaw 상태 데이터에서 다음 항목들을 정밀 스캔함:

- 저장된 **평문(Plaintext)** 비밀 정보 유무.
- **해석 불가능한** 시크릿 참조 정보.
- **우선순위 불일치**: `auth-profiles.json`의 자격 증명이 `openclaw.json`의 시크릿 참조를 가리고(Shadowing) 있는 경우.
- **자동 생성 파일 잔여물**: `models.json` 등에 남은 API 키나 민감한 헤더 정보.
- **레거시 데이터**: 이전 버전의 인증 정보나 OAuth 관련 기록.

**헤더 탐지 규칙**: `authorization`, `x-api-key`, `token`, `secret`, `password`, `credential` 등 주요 키워드를 포함한 헤더를 민감 정보로 간주함.

```bash
openclaw secrets audit
openclaw secrets audit --check
openclaw secrets audit --json
```

## 대화형 구성 도우미 (Configure)

공급자 및 시크릿 참조 변경 사항을 단계별로 구성하고 즉석에서 검증함.

```bash
openclaw secrets configure
openclaw secrets configure --plan-out /tmp/secrets-plan.json
openclaw secrets configure --apply --yes
openclaw secrets configure --agent ops
```

**설정 흐름:**
1. **공급자 설정**: `secrets.providers` 별칭 등록 및 수정.
2. **필드 매핑**: 암호화가 필요한 필드를 선택하고 `{source, provider, id}` 참조를 할당함.
3. **사전 검증 및 적용**: 실제 적용 전 해석 가능 여부를 테스트함.

**주요 옵션:**
- **`--agent <id>`**: 인증 프로필 스캔 및 수정 범위를 특정 에이전트로 한정함.
- **`--apply`**: 계획 수립 완료 후 즉시 적용함. `--yes` 플래그가 없으면 최종 확인 프롬프트를 표시함.

<Note>
**실행 권한 주의**: 시크릿 공급자로 실행 파일(Exec)을 사용할 경우, Homebrew 등의 경로(`/opt/homebrew/bin/*`)는 심볼릭 링크인 경우가 많음. 이 경우 해당 공급자에 `allowSymlinkCommand: true`를 설정하고 `trustedDirs` 목록에 해당 경로를 추가해야 함.
</Note>

## 계획 파일 적용 (Apply)

이전에 생성된 계획 파일을 바탕으로 실제 변경을 수행함.

```bash
openclaw secrets apply --from /tmp/secrets-plan.json
```

**수정 대상 범위:**
- `openclaw.json`: 시크릿 참조 필드 업데이트 및 공급자 정보 관리.
- `auth-profiles.json`: 대상 필드의 평문 데이터 삭제.
- 레거시 `auth.json` 및 `~/.openclaw/.env` 파일 정제.

상세 규약은 [Secrets Apply Plan Contract](/gateway/secrets-plan-contract) 참조.

## 롤백 및 백업 정책

`secrets apply` 명령어는 보안을 위해 평문 데이터가 포함된 **이전 버전의 백업 파일을 생성하지 않음.** 안전한 작업을 위해 실행 전 엄격한 사전 검증(Preflight)을 수행하며, 오류 발생 시 메모리 내에서 최선의 노력을 다해 복구를 시도함.

## 문제 해결 예시

```bash
openclaw secrets audit --check
# 문제 발견 시
openclaw secrets configure
# 수정 완료 후 재점검
openclaw secrets audit --check
```
감사 결과 여전히 평문 노출이 보고된다면, 출력된 경로 정보에 따라 해당 설정을 시크릿 참조로 전환하고 감사를 다시 실행함.
