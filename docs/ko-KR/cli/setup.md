---
summary: "CLI reference for `openclaw setup` (initialize config + workspace)"
description: "전체 onboarding wizard 없이 config 파일과 agent workspace를 초기화하는 `openclaw setup` 사용법을 간단히 설명합니다."
read_when:
  - 전체 onboarding wizard 없이 초기 설정을 시작할 때
  - 기본 workspace path를 정하고 싶을 때
title: "setup"
x-i18n:
  source_path: "cli/setup.md"
---

# `openclaw setup`

`~/.openclaw/openclaw.json`과 agent workspace를 초기화합니다.

Related:

- Getting started: [Getting started](/start/getting-started)
- Wizard: [Onboarding](/start/onboarding)

## Examples

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
```

setup에서 wizard를 실행하려면:

```bash
openclaw setup --wizard
```
