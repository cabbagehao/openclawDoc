---
summary: "설정 파일 및 워크스페이스 초기화를 위한 `openclaw setup` 명령어 레퍼런스"
read_when:
  - 전체 온보딩 마법사 과정을 거치지 않고 초기 환경만 빠르게 구성하고자 할 때
  - 기본 워크스페이스 저장 경로를 설정하고 싶을 때
title: "setup"
x-i18n:
  source_path: "cli/setup.md"
---

# `openclaw setup`

`~/.openclaw/openclaw.json` 설정 파일과 에이전트 워크스페이스 디렉터리를 초기화함.

**관련 문서:**
- 시작 가이드: [Getting started](/start/getting-started)
- 온보딩 마법사 안내: [Onboarding](/start/onboarding)

## 사용 예시

```bash
# 기본 설정으로 초기화 실행
openclaw setup

# 워크스페이스 경로를 직접 지정하여 초기화
openclaw setup --workspace ~/.openclaw/workspace
```

명령어를 통해 온보딩 마법사를 즉시 실행하려면:

```bash
openclaw setup --wizard
```
