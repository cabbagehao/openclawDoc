---
summary: "OpenClaw의 인증 프로필 순환 및 모델 장애 조치(Failover) 메커니즘 안내"
read_when:
  - 인증 프로필의 자동 순환, 쿨다운(Cooldown) 또는 모델 폴백 동작을 분석할 때
  - 인증 프로필 및 모델의 장애 조치 규칙을 업데이트하고자 할 때
title: "모델 장애 조치"
x-i18n:
  source_path: "concepts/model-failover.md"
---

# 모델 장애 조치 (Model Failover)

OpenClaw는 실행 중 발생하는 실패 상황을 다음과 같은 2단계 절차를 통해 처리함:

1. **인증 프로필 순환 (Rotation)**: 현재 사용 중인 공급자(Provider) 내에서 다른 인증 프로필로 전환함.
2. **모델 폴백 (Fallback)**: 모든 프로필 시도가 실패할 경우, `agents.defaults.model.fallbacks`에 정의된 다음 모델로 전환함.

이 문서는 이러한 장애 조치 과정의 런타임 규칙과 데이터 구조를 설명함.

## 자격 증명 저장소 (Keys + OAuth)

OpenClaw는 API 키와 OAuth 토큰 모두에 대해 **인증 프로필(Auth Profiles)** 시스템을 사용함.

- **비밀 정보 저장**: 실제 키 데이터는 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` 파일에 저장됨.
- **설정 파일 역할**: `openclaw.json`의 `auth.profiles` 및 `auth.order` 항목은 메타데이터와 라우팅 규칙만을 담고 있으며, 실제 시크릿 데이터는 포함하지 않음.
- **레거시 데이터**: 이전 버전의 `oauth.json` 파일은 최초 실행 시 `auth-profiles.json`으로 자동 마이그레이션됨.

상세 정보: [OAuth 인증 가이드](/concepts/oauth)

### 자격 증명 유형 (Types)
- `api_key`: 공급자 정보와 API 키 값.
- `oauth`: 공급자 정보, 액세스/리프레시 토큰, 만료 시각 및 계정 정보.

## 프로필 식별자 (Profile IDs)

OAuth 로그인을 통해 생성되는 프로필은 여러 계정이 공존할 수 있도록 고유한 ID를 가짐:

- **기본값**: 이메일 정보가 없는 경우 `provider:default`.
- **이메일 포함 시**: `provider:<email>` (예: `openai:user@example.com`).

이 정보는 `auth-profiles.json` 파일의 `profiles` 섹션에서 관리됨.

## 프로필 순환 순서 (Rotation Order)

공급자별로 여러 프로필이 존재할 경우 다음 우선순위에 따라 순서를 결정함:

1. **명시적 설정**: `auth.order[provider]`에 정의된 순서.
2. **구성된 프로필**: `auth.profiles`에 등록된 목록 중 해당 공급자 필터링 결과.
3. **저장된 데이터**: `auth-profiles.json`에 실제 존재하는 데이터 기반.

별도의 명시적 순서가 없을 경우 **라운드 로빈(Round-robin)** 방식을 사용함:
- **1차 정렬**: 인증 유형 (일반적으로 **OAuth 프로필을 API 키보다 우선** 사용).
- **2차 정렬**: `lastUsed` 시각 (가장 오래전에 사용한 프로필 우선).
- **예외**: 쿨다운(Cooldown) 상태이거나 비활성화된 프로필은 목록의 마지막으로 이동하며, 만료 예정 시간이 빠른 순서대로 배치됨.

### 세션 고정성 (Session Stickiness)

효율적인 캐시 활용과 일관성 유지를 위해 **세션별로 선택된 인증 프로필을 고정(Pinning)**하여 사용함. 매 요청마다 프로필을 바꾸지 않으며, 다음 상황에서만 고정이 해제됨:

- 사용자가 세션을 초기화한 경우 (`/new`, `/reset`).
- 대화 압축(Compaction)이 완료되어 압축 횟수가 증가한 경우.
- 현재 고정된 프로필이 쿨다운 또는 비활성 상태가 된 경우.

`/model …@<profileId>` 명령어로 프로필을 직접 지정하면 해당 세션에 대해 **사용자 오버라이드**가 적용되며, 세션 종료 전까지 자동 순환 대상에서 제외됨.

<Note>
**OAuth 우선순위 주의**: 동일 공급자에 OAuth와 API 키 프로필이 혼재되어 있고 순서가 고정되지 않은 경우, 라운드 로빈 로직에 의해 메시지마다 프로필이 바뀔 수 있음. 특정 계정 사용을 강제하려면 `auth.order` 설정을 활용함.
</Note>

## 쿨다운 (Cooldowns)

인증 오류, 속도 제한(Rate limit), 혹은 속도 제한으로 의심되는 타임아웃 발생 시 OpenClaw는 해당 프로필을 '쿨다운' 상태로 설정하고 다음 프로필로 전환함. OpenAI 호환 응답의 `Unhandled stop reason: error` 등도 장애 조치 신호로 간주함.

쿨다운에는 **지수 백오프(Exponential Backoff)**가 적용됨:
- 1분 → 5분 → 25분 → 최대 1시간.

상태 정보는 `auth-profiles.json`의 `usageStats` 하위에 기록됨.

## 과금 관련 비활성화 (Billing Disables)

"잔액 부족(Insufficient credits)"과 같은 과금 관련 오류는 일시적인 장애가 아닐 가능성이 높으므로, 일반 쿨다운보다 훨씬 긴 **비활성화(Disabled)** 상태로 전환함.

- **백오프 주기**: 5시간부터 시작하여 실패 반복 시마다 2배로 증가 (최대 24시간).
- **초기화**: 해당 프로필이 24시간 동안 실패 없이 유지될 경우 백오프 카운터를 초기화함.

## 모델 폴백 (Model Fallback)

특정 공급자의 모든 인증 프로필이 실패하거나 속도 제한에 걸린 경우, OpenClaw는 `agents.defaults.model.fallbacks` 목록에 정의된 다음 모델로 완전히 전환함.

- **진행 조건**: 인증 실패, 속도 제한, 프로필 전체 순환 후에도 지속되는 타임아웃 시에만 다음 폴백 모델로 이동함 (기타 일반적인 모델 에러는 폴백을 트리거하지 않음).
- **오버라이드 시 동작**: 명령어나 훅을 통해 특정 모델을 강제한 경우에도, 해당 모델이 실패하면 설정된 폴백 리스트를 따라가며 최종적으로는 기본 모델(`agents.defaults.model.primary`)로 수렴함.

## 관련 설정 항목

상세 스키마는 [Gateway 설정 레퍼런스](/gateway/configuration)를 참조함:

- `auth.profiles` / `auth.order`: 인증 프로필 정의 및 순서 제어.
- `auth.cooldowns.*`: 과금 백오프 및 실패 윈도우 시간 설정.
- `agents.defaults.model.primary` / `fallbacks`: 기본 모델 및 장애 조치 대상 모델 리스트.
- `agents.defaults.imageModel`: 이미지 생성용 모델 라우팅 설정.

전반적인 모델 선택 전략은 [모델 관리 가이드](/concepts/models) 참조.
