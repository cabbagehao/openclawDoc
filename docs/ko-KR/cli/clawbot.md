---
summary: "CLI reference for `openclaw clawbot` (legacy alias namespace)"
description: "openclaw clawbot 레거시 alias의 현재 용도와 권장 migration 경로를 설명합니다."
read_when:
  - 오래된 스크립트에서 openclaw clawbot 명령을 유지할 때
  - 현재 명령 체계로 옮길 계획을 세울 때
title: "clawbot"
x-i18n:
  source_path: 'cli/clawbot.md'
---

# `openclaw clawbot`

backwards compatibility를 위해 유지되는 legacy alias namespace입니다.

현재 지원되는 alias:

- `openclaw clawbot qr` ([`openclaw qr`](/cli/qr)와 동일 동작)

## Migration

가능하면 현대적인 top-level 명령을 직접 사용하세요.

- `openclaw clawbot qr` -> `openclaw qr`
