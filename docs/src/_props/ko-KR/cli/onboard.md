---
summary: "Gateway, 워크스페이스, 인증, 채널 및 스킬 통합 설정을 위한 `openclaw onboard` 대화형 명령어 레퍼런스"
read_when:
  - 안내에 따라 OpenClaw 초기 환경(로컬 또는 원격)을 구축하고자 할 때
title: "onboard"
x-i18n:
  source_path: "cli/onboard.md"
---

# `openclaw onboard`

로컬 또는 원격 Gateway 설정을 지원하는 대화형 온보딩 마법사를 실행함.

## 관련 가이드

* **CLI 온보딩 통합 허브**: [Onboarding Wizard (CLI)](/start/wizard)
* **온보딩 전체 개요**: [Onboarding Overview](/start/onboarding-overview)
* **상세 기술 레퍼런스**: [CLI Onboarding Reference](/start/wizard-cli-reference)
* **자동화 가이드**: [CLI Automation](/start/wizard-cli-automation)
* **macOS 앱 사용자 전용**: [Onboarding (macOS App)](/start/onboarding)

## 사용 예시

```bash
# 기본 대화형 설정 시작
openclaw onboard

# 필수 항목만 묻는 빠른 설정 모드
openclaw onboard --flow quickstart

# 모든 세부 항목을 직접 설정하는 수동 모드
openclaw onboard --flow manual

# 이미 가동 중인 원격 Gateway에 연결 설정
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

신뢰할 수 있는 사설 네트워크 내에서 보안되지 않은 `ws://` 주소를 사용해야 하는 경우, 온보딩 실행 전 환경 변수에 `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`을 설정함.

### 비대화형 커스텀 공급자 설정 예시

```bash
openclaw onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --secret-input-mode plaintext \
  --custom-compatibility openai
```

`--custom-api-key` 플래그 생략 시, 시스템은 환경 변수에서 `CUSTOM_API_KEY`를 자동으로 확인함.

### 평문 대신 시크릿 참조(Ref)로 저장

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

`--secret-input-mode ref` 옵션을 사용하면 실제 키 값 대신 환경 변수 기반의 참조 정보가 설정 파일에 기록됨.

**비대화형 `ref` 모드 주의 사항:**

* 대상 공급자의 환경 변수(예: `OPENAI_API_KEY`)가 온보딩 프로세스에 미리 설정되어 있어야 함.
* 환경 변수가 없는 상태에서 인라인 키 플래그를 넘기면 오류와 함께 즉시 종료됨.

### 비대화형 Gateway 토큰 옵션

* `--gateway-auth token --gateway-token <값>`: 평문 토큰 저장.
* `--gateway-auth token --gateway-token-ref-env <환경변수명>`: 해당 환경 변수를 참조하는 SecretRef 형식으로 저장.
* 두 옵션은 동시에 사용할 수 없음.
* 데몬(Daemon) 설치 시, 토큰이 SecretRef로 관리되면 참조의 유효성만 검증하고 실제 평문 값을 서비스 메타데이터에 기록하지 않음.

**사용 예시:**

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN \
  --accept-risk
```

## 대화형 시크릿 참조 설정 동작

* 마법사 진행 중 비밀 정보 입력 단계에서 **Use secret reference**를 선택함.
* 이후 **Environment variable** (환경 변수) 또는 설정된 **Secret provider** (`file` 또는 `exec`) 중 하나를 선택함.
* 시스템은 저장 전 즉시 유효성 검증(Preflight validation)을 수행하며, 실패 시 사유를 표시하고 재시도를 허용함.

## 공급자별 특이 사항

* **Z.AI (GLM)**: `--auth-choice zai-api-key`는 키 값을 분석하여 최적의 엔드포인트를 자동 감지함. 특정 플랜 사용 시 `zai-coding-global` 등의 세부 옵션 선택 가능.
* **Mistral**: `--auth-choice mistral-api-key` 옵션을 통해 비대화형 설정 지원.

## 설정 흐름(Flow) 안내

* **`quickstart`**: 필수 질문만 표시하며, Gateway 토큰을 자동으로 생성함.
* **`manual`**: 포트, 바인딩 주소, 인증 방식 등 모든 상세 설정을 사용자가 직접 지정함 (`advanced`와 동일).
* **첫 대화 시작**: 별도의 채널 설정 없이 바로 대화하려면 `openclaw dashboard`를 통해 Control UI를 활용함.
* **커스텀 공급자**: 목록에 없는 OpenAI/Anthropic 호환 엔드포인트를 연결할 때 사용함.

## 설정 완료 후 주요 명령어

```bash
# 추가적인 세부 설정 변경
openclaw configure

# 독립된 워크스페이스를 가진 에이전트 추가
openclaw agents add <이름>
```

<Note>
  `--json` 플래그가 비대화형 모드를 보장하지는 않음. 스크립트 자동화 시에는 반드시 **`--non-interactive`** 플래그를 명시해야 함.
</Note>
