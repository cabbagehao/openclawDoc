---
summary: "Usage tracking surfaces and credential requirements"
description: "OpenClaw가 provider usage와 quota를 어디에 표시하는지, 어떤 credential이 있어야 노출되는지 설명합니다."
read_when:
  - provider usage/quota surface를 연결해야 할 때
  - usage tracking 동작이나 auth 요구사항을 설명해야 할 때
title: "Usage Tracking"
x-i18n:
  source_path: "concepts/usage-tracking.md"
---

# Usage tracking

## What it is

- provider의 usage/quota endpoint에서 직접 사용량을 가져옵니다
- 비용 추정치는 포함하지 않고, provider가 보고한 window만 보여줍니다

## Where it shows up

- chat의 `/status`:
  session token + estimated cost
  (API key only)가 포함된 emoji-rich status card.
  가능할 때는 **현재 model provider**의 usage도 함께 표시
- chat의 `/usage off|tokens|full`:
  response별 usage footer
  (OAuth는 token만 표시)
- chat의 `/usage cost`:
  OpenClaw session log를 집계한 local cost summary
- CLI:
  `openclaw status --usage`는 provider별 전체 breakdown을 출력
- CLI:
  `openclaw channels list`는 provider config와 함께 같은 usage snapshot을 출력
  (`--no-usage`로 생략 가능)
- macOS menu bar:
  사용 가능할 때 Context 아래의 "Usage" section에 표시

## Providers + credentials

- **Anthropic (Claude)**:
  auth profile의 OAuth token
- **GitHub Copilot**:
  auth profile의 OAuth token
- **Gemini CLI**:
  auth profile의 OAuth token
- **Antigravity**:
  auth profile의 OAuth token
- **OpenAI Codex**:
  auth profile의 OAuth token
  (`accountId`가 있으면 함께 사용)
- **MiniMax**:
  API key
  (`MINIMAX_CODE_PLAN_KEY` 또는 `MINIMAX_API_KEY`);
  5시간 coding plan window 사용
- **z.ai**:
  env/config/auth store의 API key

일치하는 OAuth/API credential이 없으면 usage는 숨겨집니다.
