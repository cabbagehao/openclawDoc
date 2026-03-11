---
summary: "OpenClaw의 OAuth: 토큰 교환, 저장, 멀티 계정 패턴"
read_when:
  - OpenClaw OAuth를 처음부터 끝까지 이해하고 싶을 때
  - 토큰 무효화 / 로그아웃 문제를 겪을 때
  - setup-token 또는 OAuth 인증 흐름이 필요할 때
  - 여러 계정이나 프로필 라우팅을 원할 때
title: "OAuth"
---

# OAuth

OpenClaw는 이를 제공하는 프로바이더에 대해 OAuth 기반 "구독 인증(subscription auth)"을 지원합니다(특히 **OpenAI Codex (ChatGPT OAuth)**). Anthropic 구독에는 **setup-token** 흐름을 사용하세요. Anthropic 구독을 Claude Code 외부에서 사용하는 것은 과거 일부 사용자에게 제한된 적이 있으므로, 이는 사용자 선택에 따른 위험으로 간주하고 현재 Anthropic 정책은 직접 확인해야 합니다. OpenAI Codex OAuth는 OpenClaw 같은 외부 도구에서의 사용이 명시적으로 지원됩니다. 이 페이지에서는 다음을 설명합니다.

프로덕션 환경에서 Anthropic은 구독 setup-token 인증보다 API 키 인증이 더 안전하고 권장되는 경로입니다.

- OAuth **토큰 교환**이 어떻게 작동하는지(PKCE)
- 토큰이 **어디에 저장되는지**(그리고 그 이유)
- **여러 계정**을 어떻게 처리하는지(프로필 + 세션별 재정의)

OpenClaw는 또한 자체 OAuth 또는 API 키 흐름을 제공하는 **provider plugin**도 지원합니다. 다음 명령으로 실행하세요.

```bash
openclaw models auth login --provider <id>
```

## 토큰 싱크(token sink)(왜 필요한가)

OAuth 프로바이더는 로그인/갱신 흐름에서 종종 **새 refresh token**을 발급합니다. 일부 프로바이더(또는 OAuth 클라이언트)는 같은 사용자/앱에 대해 새 토큰이 발급되면 이전 refresh token을 무효화할 수 있습니다.

실제 증상:

- OpenClaw에서도 로그인하고 Claude Code / Codex CLI에서도 로그인하면 → 나중에 둘 중 하나가 무작위로 "로그아웃"된 것처럼 보일 수 있음

이를 줄이기 위해 OpenClaw는 `auth-profiles.json`을 **token sink**로 취급합니다.

- 런타임은 **한 곳**에서 자격 증명을 읽습니다.
- 여러 프로필을 유지하고 결정적으로 라우팅할 수 있습니다.

## 저장소(토큰은 어디에 저장되는가)

비밀은 **에이전트별**로 저장됩니다.

- Auth profiles(OAuth + API keys + 선택적 값 단위 ref): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- 레거시 호환 파일: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (정적 `api_key` 엔트리는 발견 시 제거됨)

레거시 import 전용 파일(여전히 지원되지만 주 저장소는 아님):

- `~/.openclaw/credentials/oauth.json`(첫 사용 시 `auth-profiles.json`으로 가져옴)

위 모든 경로는 `$OPENCLAW_STATE_DIR`(state dir override)도 따릅니다. 전체 참조: [/gateway/configuration](/gateway/configuration#auth-storage-oauth--api-keys)

정적 secret ref와 런타임 snapshot activation 동작은 [Secrets Management](/gateway/secrets)를 참고하세요.

## Anthropic setup-token(구독 인증)

<Warning>
Anthropic setup-token 지원은 기술적 호환성이지, 정책 보장을 의미하지 않습니다.
Anthropic은 과거 Claude Code 외부의 일부 구독 사용을 차단한 적이 있습니다.
구독 인증을 사용할지는 스스로 판단하고, Anthropic의 현재 약관을 직접 확인하세요.
</Warning>

아무 머신에서나 `claude setup-token`을 실행한 뒤, OpenClaw에 붙여 넣으세요.

```bash
openclaw models auth setup-token --provider anthropic
```

토큰을 다른 곳에서 생성했다면 수동으로 붙여 넣을 수도 있습니다.

```bash
openclaw models auth paste-token --provider anthropic
```

확인:

```bash
openclaw models status
```

## OAuth 교환(로그인이 작동하는 방식)

OpenClaw의 대화형 로그인 흐름은 `@mariozechner/pi-ai`에 구현되어 있으며 마법사/명령에 연결되어 있습니다.

### Anthropic setup-token

흐름 형태:

1. `claude setup-token` 실행
2. 토큰을 OpenClaw에 붙여 넣기
3. 토큰 auth profile로 저장(refresh 없음)

마법사 경로는 `openclaw onboard` → auth choice `setup-token`(Anthropic)입니다.

### OpenAI Codex(ChatGPT OAuth)

OpenAI Codex OAuth는 Codex CLI 외부, OpenClaw 워크플로우를 포함한 사용이 명시적으로 지원됩니다.

흐름 형태(PKCE):

1. PKCE verifier/challenge + 무작위 `state` 생성
2. `https://auth.openai.com/oauth/authorize?...` 열기
3. `http://127.0.0.1:1455/auth/callback`에서 콜백 캡처 시도
4. 콜백을 바인드할 수 없거나 원격/headless 환경이면, redirect URL/code를 붙여 넣기
5. `https://auth.openai.com/oauth/token`에서 교환
6. access token에서 `accountId`를 추출해 `{ access, refresh, expires, accountId }` 저장

마법사 경로는 `openclaw onboard` → auth choice `openai-codex`입니다.

## 갱신 + 만료

프로필은 `expires` 타임스탬프를 저장합니다.

런타임에서는:

- `expires`가 미래면 → 저장된 access token 사용
- 만료되었으면 → refresh 수행(파일 잠금 하에서) 후 저장된 자격 증명 덮어쓰기

갱신 흐름은 자동이므로, 일반적으로 토큰을 수동 관리할 필요는 없습니다.

## 여러 계정(프로필) + 라우팅

두 가지 패턴이 있습니다.

### 1) 권장: 분리된 에이전트

"개인용"과 "업무용"이 절대 섞이지 않게 하려면, 격리된 에이전트(분리된 세션 + 자격 증명 + 워크스페이스)를 사용하세요.

```bash
openclaw agents add work
openclaw agents add personal
```

그다음 에이전트별로 인증을 구성(마법사)하고, 채팅을 올바른 에이전트로 라우팅하세요.

### 2) 고급: 하나의 에이전트에 여러 프로필

`auth-profiles.json`은 같은 프로바이더에 대해 여러 profile ID를 지원합니다.

어떤 프로필을 사용할지는 다음으로 선택합니다.

- 전역적으로 설정 순서(`auth.order`)
- 세션별로 `/model ...@<profileId>`

예시(세션 재정의):

- `/model Opus@anthropic:work`

어떤 profile ID가 있는지 확인하는 방법:

- `openclaw channels list --json`(`auth[]` 표시)

관련 문서:

- [/concepts/model-failover](/concepts/model-failover) (회전 + 쿨다운 규칙)
- [/tools/slash-commands](/tools/slash-commands) (명령 표면)
