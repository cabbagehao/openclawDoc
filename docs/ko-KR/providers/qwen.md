---
summary: "OpenClaw에서 Qwen OAuth(무료 티어) 사용하기"
description: "OpenClaw에서 Qwen OAuth(무료 티어) 사용하기"
read_when:
  - OpenClaw에서 Qwen을 사용하고 싶을 때
  - Qwen Coder에 무료 티어 OAuth 액세스를 사용하고 싶을 때
title: "Qwen"
---

# Qwen

Qwen은 Qwen Coder 및 Qwen Vision 모델에 대해 무료 티어 OAuth 흐름을 제공합니다
(하루 2,000회 요청, Qwen의 요청 제한이 적용됨).

## 플러그인 활성화

```bash
openclaw plugins enable qwen-portal-auth
```

활성화한 뒤 Gateway를 다시 시작하세요.

## 인증

```bash
openclaw models auth login --provider qwen-portal --set-default
```

이 명령은 Qwen device-code OAuth 흐름을 실행하고 `models.json`에 프로바이더 항목을
기록합니다(빠르게 전환할 수 있도록 `qwen` 별칭도 함께 추가됨).

## 모델 ID

- `qwen-portal/coder-model`
- `qwen-portal/vision-model`

다음 명령으로 모델을 전환할 수 있습니다:

```bash
openclaw models set qwen-portal/coder-model
```

## Qwen Code CLI 로그인 재사용

이미 Qwen Code CLI로 로그인했다면, OpenClaw는 auth store를 로드할 때
`~/.qwen/oauth_creds.json`의 자격 증명을 동기화합니다. 그래도
`models.providers.qwen-portal` 항목은 필요합니다(위 로그인 명령으로 생성하세요).

## 참고

- 토큰은 자동으로 갱신됩니다. 갱신에 실패하거나 액세스가 취소되면 로그인 명령을 다시 실행하세요.
- 기본 base URL은 `https://portal.qwen.ai/v1`입니다(Qwen이 다른 엔드포인트를 제공하면
  `models.providers.qwen-portal.baseUrl`로 재정의하세요).
- 프로바이더 전체 규칙은 [모델 제공업체](/concepts/model-providers)를 참고하세요.
