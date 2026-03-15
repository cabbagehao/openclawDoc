---
summary: "모델 검색, 스캔 및 기본 모델, 폴백(Fallback), 인증 프로필 설정을 위한 `openclaw models` 명령어 레퍼런스"
read_when:
  - 기본 사용 모델을 변경하거나 공급자별 인증 상태를 확인하고자 할 때
  - 사용 가능한 모델을 스캔하고 인증 프로필의 오류를 디버깅할 때
title: "models"
x-i18n:
  source_path: "cli/models.md"
---

# `openclaw models`

모델 탐색, 자동 스캔 및 관련 설정(기본 모델, 장애 조치용 폴백, 인증 프로필)을 관리함.

**관련 문서:**
- 공급자 및 모델 상세 가이드: [Models](/providers/models)
- 인증 설정 방법: [시작하기](/start/getting-started)

## 주요 명령어

```bash
# 현재 설정된 기본 모델 및 인증 요약 정보 확인
openclaw models status

# 사용 가능한 전체 모델 목록 조회
openclaw models list

# 기본 사용 모델 즉시 변경 (별칭 지원)
openclaw models set <모델명-또는-별칭>

# 공급자별 사용 가능한 모델 자동 스캔 및 등록
openclaw models scan
```

`openclaw models status` 명령어는 현재 활성화된 기본 모델과 폴백 모델 리스트, 그리고 각 인증 프로필의 상태를 요약하여 보여줌. 사용량 정보(Usage snapshots)가 있는 경우 해당 정보도 함께 표시됨.

**상태 확인 옵션:**
- **`--probe`**: 설정된 모든 인증 프로필에 대해 실제 API 요청을 보내 유효성을 검증함. (주의: 실제 토큰이 소비되며 속도 제한이 발생할 수 있음)
- **`--agent <id>`**: 특정 에이전트 인스턴스의 모델 및 인증 상태를 점검함. (미지정 시 기본 에이전트 정보 출력)

### 참고 사항

- **모델 표기법**: `공급자/모델ID` 형식 또는 사전에 정의된 별칭(Alias)을 사용함.
- **파싱 규칙**: 첫 번째 `/` 문자를 기준으로 공급자와 모델을 구분함. 만약 모델 ID 자체에 `/`가 포함된 경우(예: OpenRouter 모델) 반드시 공급자 접두사를 명시해야 함 (예: `openrouter/moonshotai/kimi-k2`).
- **마스킹 정책**: 비밀번호나 키가 아닌 공개 가능한 식별자(예: `OPENAI_API_KEY`, `ollama-local`, `secretref-managed`)는 `marker(<값>)` 형식으로 표시되어 실제 비밀 정보와 구분됨.

### `models status` 상세 옵션

- `--json` / `--plain`: 출력 형식 지정.
- `--check`: 자동화 스크립트용 상태 체크 (종료 코드 1: 만료/누락, 2: 만료 예정).
- `--probe-provider <name>`: 특정 공급자만 정밀 점검.
- `--probe-profile <id>`: 특정 프로필 ID만 정밀 점검 (쉼표로 구분하여 다수 지정 가능).
- `--probe-concurrency <n>`: 프로브 실행 시의 병렬 요청 수 제한.

## 별칭 및 폴백 관리

```bash
# 등록된 모든 모델 별칭 목록 확인
openclaw models aliases list

# 장애 조치(Failover)용 폴백 모델 리스트 확인
openclaw models fallbacks list
```

## 인증 프로필 (Auth Profiles)

```bash
# 새로운 인증 정보 수동 추가
openclaw models auth add

# 공급자별 전용 인증 흐름(OAuth/API 키) 시작
openclaw models auth login --provider <id>

# Anthropic 설정 토큰(setup-token) 등록
openclaw models auth setup-token

# 외부에서 생성된 토큰 문자열 직접 입력
openclaw models auth paste-token
```

`models auth login` 명령어는 각 공급자 플러그인에서 제공하는 고유한 인증 방식을 실행함. 설치된 공급자 목록은 `openclaw plugins list` 명령어로 확인 가능함.

**주의 사항:**
- **`setup-token`**: `claude setup-token` 명령어로 생성된 값을 사용함.
- **Anthropic 정책**: Anthropic의 setup-token 지원은 기술적 호환성 제공을 목적으로 함. 과거 Claude Code 이외의 환경에서 구독 계정 사용이 제한된 사례가 있으므로, 사용 전 최신 약관을 반드시 확인해야 함.
