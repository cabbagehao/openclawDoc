---
summary: "모델 공급자 인증 가이드: OAuth, API 키, 설정 토큰(setup-token) 등록 및 관리 안내"
read_when:
  - 모델 인증 문제 또는 OAuth 만료 현상을 디버깅할 때
  - 자격 증명 저장 방식 및 인증 체계를 파악하고자 할 때
title: "인증"
x-i18n:
  source_path: "gateway/authentication.md"
---

# 인증 (Authentication)

OpenClaw는 모델 공급자 연동을 위해 OAuth 및 API 키 방식을 모두 지원함. 상시 가동되는 Gateway 호스트 환경에서는 **API 키** 방식이 가장 안정적이고 예측 가능한 선택임. 공급자의 계정 모델에 따라 구독 기반의 OAuth 흐름도 활용 가능함.

상세 정보:
- OAuth 전체 흐름 및 저장 구조: [/concepts/oauth](/concepts/oauth)
- 시크릿 참조(SecretRef) 기반 인증: [Secrets Management](/gateway/secrets)
- 자격 증명 적격성 및 사유 코드 규약: [Auth Credential Semantics](/auth-credential-semantics)

## 권장 설정 (API 키 방식)

장기 운영되는 Gateway 서버의 경우, 선택한 공급자의 API 키를 사용하는 것이 가장 좋음. 특히 **Anthropic**의 경우, 구독 기반의 설정 토큰(setup-token) 방식보다 정식 **API 키** 인증이 보안상 더 안전하고 권장되는 경로임.

1. 공급자 관리 콘솔에서 API 키를 생성함.
2. 해당 키를 **Gateway 호스트**(`openclaw gateway`가 실행되는 머신)에 등록함.

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Gateway가 systemd나 launchd와 같은 서비스로 구동 중이라면, 데몬이 환경 변수를 읽을 수 있도록 `~/.openclaw/.env` 파일에 기록할 것을 권장함:

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

이후 서비스를 재시작하고 상태를 확인함:

```bash
openclaw gateway restart
openclaw models status
openclaw doctor
```

직접 환경 변수를 관리하기 번거롭다면 온보딩 마법사의 도움을 받을 수 있음: `openclaw onboard`.

환경 변수 상속(`env.shellEnv`, `~/.openclaw/.env`, systemd/launchd) 및 적용 순서에 대한 상세 내용은 [도움말](/help) 섹션을 참조함.

## Anthropic: 설정 토큰 (구독 인증)

Anthropic 유료 구독 계정을 사용 중이라면 설정 토큰(setup-token) 흐름을 활용할 수 있음. 반드시 **Gateway 호스트**에서 다음 과정을 수행함:

1. 토큰 생성:
   ```bash
   claude setup-token
   ```
2. OpenClaw에 등록:
   ```bash
   openclaw models auth setup-token --provider anthropic
   ```
   (다른 기기에서 생성된 토큰인 경우 `paste-token` 명령어로 직접 입력 가능)

만약 다음과 같은 오류가 발생한다면 API 키 방식을 사용해야 함:
`This credential is only authorized for use with Claude Code and cannot be used for other API requests.`

<Warning>
Anthropic 설정 토큰 지원은 기술적인 호환성 제공일 뿐임. Anthropic은 과거 Claude Code 외부에서의 구독 계정 사용을 제한한 사례가 있음. 사용 시 정책 위반 리스크를 충분히 검토하고 공급자의 최신 약관을 직접 확인하기 바람.
</Warning>

## 인증 정보 수동 입력

모든 공급자에 대해 수동으로 토큰을 입력하고 인증 프로필(`auth-profiles.json`)을 갱신할 수 있음:

```bash
openclaw models auth paste-token --provider anthropic
openclaw models auth paste-token --provider openrouter
```

정적 자격 증명의 경우 시크릿 참조 방식도 지원함:
- `api_key` 자격 증명 내의 `keyRef: { source, provider, id }`
- `token` 자격 증명 내의 `tokenRef: { source, provider, id }`

## 자동화 상태 점검

CI/CD 파이프라인이나 모니터링 스크립트에서 활용 가능한 점검 명령어임:

```bash
openclaw models status --check
```
**종료 코드(Exit Code):**
- **`1`**: 자격 증명이 누락되었거나 만료됨.
- **`2`**: 곧 만료 예정.

상세 모니터링 가이드: [/automation/auth-monitoring](/automation/auth-monitoring)

## API 키 자동 순환 (Rotation)

OpenClaw는 특정 공급자의 요청이 속도 제한(Rate limit)에 걸릴 경우, 등록된 다른 키로 자동 재시도하는 기능을 지원함.

- **우선순위 순서**:
  1. `OPENCLAW_LIVE_<PROVIDER>_KEY` (실시간 오버라이드 전용)
  2. `<PROVIDER>_API_KEYS` (목록형)
  3. `<PROVIDER>_API_KEY` (기본 키)
  4. `<PROVIDER>_API_KEY_*` (순번형)
- **Google 공급자**: 추가 폴백으로 `GOOGLE_API_KEY` 환경 변수를 포함함.
- **재시도 조건**: 오직 속도 제한 관련 오류(`429`, `rate_limit`, `quota`, `resource exhausted` 등) 발생 시에만 다음 키로 전환함. 일반적인 에러는 즉시 실패 처리함.

## 인증 프로필 제어 및 고정

### 세션별 고정 (채팅 명령어)
현재 대화 세션에서 특정 인증 프로필을 강제 사용하도록 지정할 수 있음:
`/model <별칭-또는-ID>@<프로필ID>` (예: ` Opus@anthropic:work`)

- `/model list`: 간이 선택기 표시.
- `/model status`: 후보군 및 다음 순번 프로필 정보를 포함한 상세 뷰 표시.

### 에이전트별 순서 지정 (CLI)
에이전트 단위로 인증 프로필의 우선순위를 명시적으로 설정함 (해당 에이전트의 `auth-profiles.json`에 저장됨):

```bash
# 특정 공급자의 인증 순서 조회
openclaw models auth order get --provider anthropic

# 특정 프로필을 최우선으로 설정
openclaw models auth order set --provider anthropic anthropic:default

# 설정 초기화
openclaw models auth order clear --provider anthropic
```

## 문제 해결 (Troubleshooting)

### "No credentials found"
Anthropic 토큰 프로필이 감지되지 않는 경우, **Gateway 호스트**에서 `claude setup-token`을 다시 실행하여 인증을 마친 뒤 상태를 점검함.

### 토큰 만료 이슈
`openclaw models status` 명령어로 어떤 프로필이 만료되었는지 확인함. 필요 시 공급자 사이트에서 새 토큰을 발급받아 다시 등록함.

## 요구 사항
- Anthropic 구독 계정 (설정 토큰 사용 시).
- Claude Code CLI 설치 완료 (`claude` 명령어 가용 상태).
