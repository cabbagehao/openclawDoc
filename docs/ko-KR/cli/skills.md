---
summary: "CLI reference for `openclaw skills` (list/info/check) and skill eligibility"
description: "사용 가능한 skill을 조회하고, 어떤 skill이 실행 가능하며 어떤 요구 사항이 부족한지 확인하는 `openclaw skills` 명령을 설명합니다."
read_when:
  - 어떤 skill이 사용 가능하고 실행 준비가 되었는지 확인하고 싶을 때
  - skill에 필요한 binary, env, config 누락을 디버깅할 때
title: "skills"
x-i18n:
  source_path: "cli/skills.md"
---

# `openclaw skills`

skill을 조회합니다. (bundled + workspace + managed override 포함)
어떤 skill이 eligible한지와 어떤 requirement가 부족한지도 함께 확인할 수 있습니다.

Related:

- Skills system: [Skills](/tools/skills)
- Skills config: [Skills config](/tools/skills-config)
- ClawHub installs: [ClawHub](/tools/clawhub)

## Commands

```bash
openclaw skills list
openclaw skills list --eligible
openclaw skills info <name>
openclaw skills check
```
