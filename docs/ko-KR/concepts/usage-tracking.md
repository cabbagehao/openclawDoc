---
summary: "공급자별 사용량 및 할당량 추적 기능 안내와 인증 요구 사항"
read_when:
  - 공급자 사용량/할당량(Quota) 인터페이스를 연결하거나 수정할 때
  - 사용량 추적 동작 방식이나 인증 관련 요구 사항을 설명해야 할 때
title: "사용량 추적"
x-i18n:
  source_path: "concepts/usage-tracking.md"
---

# 사용량 추적 (Usage Tracking)

## 주요 기능

- **공급자 데이터 직접 연동**: 각 공급자(Provider)의 사용량 엔드포인트에서 실제 사용량 및 할당량(Quota) 정보를 직접 가져옴.
- **실제 수치 기반**: 시스템 추정치가 아닌, 공급자가 공식적으로 보고한 데이터 범위를 표시함.

## 정보 표시 위치

- **채팅 창 내 `/status` 명령어**: 세션 토큰 사용량과 추정 비용(API 키 사용 시)을 포함한 요약 카드를 표시함. 사용 가능한 경우 **현재 모델 공급자**의 사용량 정보가 함께 나타남.
- **채팅 창 내 `/usage off|tokens|full` 명령어**: 각 응답 하단에 사용량 정보를 표시함 (OAuth 인증의 경우 토큰 수만 표시됨).
- **채팅 창 내 `/usage cost` 명령어**: OpenClaw 세션 로그를 집계하여 로컬 비용 요약을 보여줌.
- **CLI 명령어 `openclaw status --usage`**: 공급자별 상세 사용량 내역을 전체적으로 출력함.
- **CLI 명령어 `openclaw channels list`**: 공급자 설정 정보와 함께 사용량 스냅샷을 나열함 (생략 시 `--no-usage` 플래그 사용).
- **macOS 메뉴 막대 앱**: 사용 가능한 경우 'Context' 메뉴 하단의 'Usage' 섹션에서 확인 가능함.

## 지원 공급자 및 자격 증명 요구 사항

사용량 추적을 위해서는 각 공급자의 인증 정보가 인증 프로필(Auth Profiles)에 등록되어 있어야 함:

- **Anthropic (Claude)**: 인증 프로필의 OAuth 토큰.
- **GitHub Copilot**: 인증 프로필의 OAuth 토큰.
- **Gemini CLI**: 인증 프로필의 OAuth 토큰.
- **Antigravity**: 인증 프로필의 OAuth 토큰.
- **OpenAI Codex**: 인증 프로필의 OAuth 토큰 (계정 ID 정보 포함 시 활용).
- **MiniMax**: API 키 (`MINIMAX_CODE_PLAN_KEY` 또는 `MINIMAX_API_KEY`). 5시간 단위의 코딩 플랜 주기를 사용함.
- **z.ai**: 환경 변수, 설정 파일 또는 인증 저장소에 등록된 API 키.

일치하는 OAuth 또는 API 자격 증명이 존재하지 않을 경우 사용량 정보는 표시되지 않음.
