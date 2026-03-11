---
summary: "CLI reference for `openclaw skills` (list/info/check) 및 스킬 사용 가능 여부"
read_when:
  - 어떤 스킬을 사용할 수 있고 실행 준비가 되었는지 보고 싶을 때
  - 스킬에 필요한 바이너리/env/config 누락을 디버깅할 때
title: "skills"
---

# `openclaw skills`

스킬(번들 포함 + 워크스페이스 + 관리형 override)을 살펴보고, 어떤 항목이 실행 가능하며 어떤 요구 사항이 부족한지 확인합니다.

관련 문서:

- Skills system: [Skills](/tools/skills)
- Skills config: [Skills config](/tools/skills-config)
- ClawHub 설치: [ClawHub](/tools/clawhub)

## Commands

```bash
openclaw skills list
openclaw skills list --eligible
openclaw skills info <name>
openclaw skills check
```
