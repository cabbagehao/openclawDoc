---
summary: "사용량 추적 표면과 자격 증명 요구 사항"
read_when:
  - provider usage/quota 표면을 연결할 때
  - 사용량 추적 동작이나 인증 요구 사항을 설명해야 할 때
title: "Usage Tracking"
---

# 사용량 추적

## 무엇인가

- provider usage/quota 를 해당 provider 의 usage endpoint 에서 직접 가져옵니다.
- 비용 추정은 하지 않습니다. provider 가 보고한 기간만 표시합니다.

## 어디에 표시되나

- 채팅의 `/status`: 세션 토큰 + 추정 비용(API key 일 때만)을 포함한 이모지 중심 상태 카드. provider usage 는 가능한 경우 **현재 모델 provider** 기준으로 표시됩니다.
- 채팅의 `/usage off|tokens|full`: 응답별 usage footer (OAuth 는 토큰만 표시)
- 채팅의 `/usage cost`: OpenClaw 세션 로그를 바탕으로 한 로컬 비용 요약
- CLI: `openclaw status --usage` 가 provider 별 전체 내역을 출력
- CLI: `openclaw channels list` 가 provider config 옆에 동일한 usage snapshot 을 출력(`--no-usage` 로 생략 가능)
- macOS 메뉴 바: Context 아래의 "Usage" 섹션(가능한 경우에만)

## Providers + credentials

- **Anthropic (Claude)**: auth profile 의 OAuth 토큰
- **GitHub Copilot**: auth profile 의 OAuth 토큰
- **Gemini CLI**: auth profile 의 OAuth 토큰
- **Antigravity**: auth profile 의 OAuth 토큰
- **OpenAI Codex**: auth profile 의 OAuth 토큰(accountId 가 있으면 사용)
- **MiniMax**: API key (coding plan key; `MINIMAX_CODE_PLAN_KEY` 또는 `MINIMAX_API_KEY`); 5시간 coding plan window 사용
- **z.ai**: env/config/auth store 를 통한 API key

일치하는 OAuth/API 자격 증명이 없으면 usage 는 숨겨집니다.
