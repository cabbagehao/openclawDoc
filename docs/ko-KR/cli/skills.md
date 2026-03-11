---
summary: "스킬 목록 조회, 상세 정보 확인 및 실행 가능 여부 점검을 위한 `openclaw skills` 명령어 레퍼런스"
read_when:
  - 현재 사용 가능한 스킬 목록과 실행 준비 상태를 확인하고자 할 때
  - 특정 스킬에 필요한 바이너리, 환경 변수 또는 설정 누락 문제를 디버깅할 때
title: "skills"
x-i18n:
  source_path: "cli/skills.md"
---

# `openclaw skills`

시스템에 등록된 스킬(내장 스킬, 워크스페이스 전용 스킬, 관리형 오버라이드 포함)을 조회하고, 각 스킬의 실행 요구 사항 충족 여부를 확인함.

**관련 문서:**
- 스킬 시스템 개요: [Skills](/tools/skills)
- 스킬 설정 가이드: [Skills config](/tools/skills-config)
- ClawHub 설치 및 관리: [ClawHub](/tools/clawhub)

## 주요 명령어

```bash
# 전체 스킬 목록 조회
openclaw skills list

# 실행 요구 사항을 모두 충족한 스킬만 필터링하여 조회
openclaw skills list --eligible

# 특정 스킬의 상세 정보 및 요구 사항 확인
openclaw skills info <name>

# 전체적인 스킬 가용성 상태 요약 보고
openclaw skills check
```
