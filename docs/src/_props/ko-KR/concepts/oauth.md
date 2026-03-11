---
summary: "OpenClaw의 OAuth 인증 체계: 토큰 교환 방식, 저장 위치 및 다중 계정 활용 패턴 안내"
read_when:
  - OpenClaw의 OAuth 인증 메커니즘을 심층적으로 이해하고자 할 때
  - 토큰 만료 또는 예기치 않은 로그아웃 문제를 해결해야 할 때
  - setup-token 또는 OAuth 로그인 절차가 궁금할 때
  - 하나의 공급자 내에서 여러 계정이나 프로필을 관리하고 싶을 때
title: "OAuth 인증"
x-i18n:
  source_path: "concepts/oauth.md"
---

# OAuth 인증

OpenClaw는 공급자별 "구독 기반 인증(Subscription Auth)"을 위해 OAuth 방식을 지원함 (대표적으로 **OpenAI Codex/ChatGPT OAuth**). Anthropic 구독 사용자의 경우 **setup-token** 흐름을 활용할 수 있음. 단, Anthropic의 경우 Claude Code 외부에서의 구독 사용이 정책상 제한될 수 있으므로, 사용 시 공급자의 최신 약관을 반드시 확인해야 함. OpenAI Codex OAuth는 OpenClaw와 같은 외부 도구에서의 활용이 공식적으로 지원됨.

운영 환경의 Anthropic 사용 시에는 구독 기반의 setup-token보다 정식 **API 키** 인증 방식을 사용할 것을 권장함.

이 가이드에서는 다음 내용을 다룸:

* **토큰 교환(Token Exchange)** 방식 (PKCE 프로토콜)
* 자격 증명의 **저장 위치** 및 관리 원칙
* **다중 계정** 처리 (프로필 시스템 및 세션별 오버라이드)

또한, OpenClaw는 플러그인을 통해 공급자별 독자적인 OAuth 또는 API 키 인증 흐름을 확장할 수 있음:

```bash
openclaw models auth login --provider <공급자ID>
```

## 토큰 싱크 (Token Sink): 단일 관리의 필요성

OAuth 공급자는 로그인 또는 갱신(Refresh) 시 흔히 **새로운 리프레시 토큰**을 발급함. 이때 일부 공급자는 동일 계정에 대해 새 토큰이 생성되면 기존 토큰을 즉시 무효화함.

* **문제 현상**: OpenClaw와 다른 CLI 도구(예: Claude Code)에서 동시에 로그인하여 사용할 경우, 한쪽에서 토큰을 갱신하면 다른 한쪽은 강제로 로그아웃되는 현상이 발생함.

이를 방지하기 위해 OpenClaw는 `auth-profiles.json` 파일을 모든 인증 정보의 \*\*단일 소스(SSOT)\*\*로 취급함:

* 런타임은 오직 **지정된 한 곳**에서만 자격 증명을 읽어옴.
* 여러 프로필을 유지하며 결정론적인 라우팅 규칙에 따라 적절한 토큰을 선택함.

## 자격 증명 저장소 위치

모든 비밀 정보는 **에이전트별**로 격리되어 저장됨:

* **인증 프로필**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (OAuth, API 키, 시크릿 참조 포함)
* **레거시 호환 파일**: `~/.openclaw/agents/<agentId>/agent/auth.json` (발견 시 정적 API 키 정보는 마스킹 처리됨)
* **가져오기 전용**: `~/.openclaw/credentials/oauth.json` (최초 실행 시 `auth-profiles.json`으로 자동 병합됨)

위 모든 경로는 `$OPENCLAW_STATE_DIR` 환경 변수 설정을 준수함. 상세 내용은 [Gateway 설정 가이드](/gateway/configuration) 참조.

정적 시크릿 참조(SecretRef) 및 런타임 활성화 동작은 [시크릿 관리 가이드](/gateway/secrets) 참조.

## Anthropic setup-token (구독 인증)

<Warning>
  Anthropic의 setup-token 지원은 기술적인 호환성 제공일 뿐, 정책적인 사용 보장을 의미하지 않음. 사용자는 Anthropic의 서비스 약관을 준수해야 하며, 정책 위반으로 인한 계정 제한 위험을 스스로 감수해야 함.
</Warning>

활성화 방법:

1. `claude setup-token` 명령어로 토큰 생성.
2. OpenClaw에 해당 토큰 등록:
   ```bash
   openclaw models auth setup-token --provider anthropic
   ```
   (다른 기기에서 생성한 토큰은 `paste-token` 명령어로 직접 입력 가능)

확인 명령어: `openclaw models status`

## OAuth 인증 프로세스 (Login)

### Anthropic setup-token 흐름

1. 외부에서 토큰 생성.
2. OpenClaw에 수동 입력.
3. 리프레시 기능이 없는 단일 토큰 프로필로 저장됨.

### OpenAI Codex (ChatGPT OAuth) 흐름

PKCE(Proof Key for Code Exchange) 프로토콜을 사용하며 OpenClaw 워크플로우에서 공식 지원됨:

1. PKCE 검증자/챌린지 및 무작위 `state` 값 생성.
2. 브라우저에서 OpenAI 인증 페이지 오픈.
3. 로컬 콜백 엔드포인트(`http://127.0.0.1:1455/auth/callback`)로 인증 정보 수신.
4. (헤드리스 환경의 경우) 리디렉션된 URL이나 코드를 직접 복사하여 입력.
5. 최종 토큰 교환 후 `access`, `refresh`, `expires`, `accountId` 정보를 프로필에 저장.

## 토큰 갱신 및 만료 관리

각 프로필은 `expires`(만료 시각) 정보를 보유함:

* **유효한 경우**: 저장된 액세스 토큰을 즉시 사용.
* **만료된 경우**: 파일 잠금(File lock) 상태에서 자동으로 리프레시를 수행하고 갱신된 정보를 파일에 업데이트함.

이 과정은 시스템에서 자동으로 처리되므로 사용자가 수동으로 개입할 필요가 없음.

## 다중 계정(프로필) 관리 및 라우팅

공급자별로 여러 계정을 사용하는 경우 다음 두 가지 패턴을 권장함:

### 1. 권장 방식: 독립된 에이전트 운영

"개인용"과 "업무용" 데이터를 완벽히 분리하고 싶다면, 각각 별도의 에이전트를 생성함:

```bash
openclaw agents add work
openclaw agents add personal
```

각 에이전트는 독립된 워크스페이스와 인증 프로필을 가짐.

### 2. 심화 방식: 단일 에이전트 내 멀티 프로필

하나의 에이전트 데이터 디렉터리에 여러 프로필 ID를 등록하여 사용함:

* **전역 설정**: `auth.order` 옵션으로 우선순위 지정.
* **세션별 지정**: 채팅 시 `/model ...@<profileId>` 명령어로 특정 계정 강제 지정.
  * 예: `/model Opus@anthropic:work`

사용 가능한 프로필 목록 확인:
`openclaw channels list --json` 명령의 `auth[]` 항목 참조.

관련 가이드:

* [모델 장애 조치(Failover) 규칙](/concepts/model-failover): 순환 및 쿨다운 정책.
* [슬래시 명령어 사용법](/tools/slash-commands): 실시간 설정 변경 도구.
