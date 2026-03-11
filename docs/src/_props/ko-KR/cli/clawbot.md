---
summary: "하위 호환성을 위해 유지되는 레거시 별칭 명령어 `openclaw clawbot` 레퍼런스"
read_when:
  - "`openclaw clawbot ...` 형식을 사용하는 이전 스크립트를 유지보수해야 할 때"
  - 최신 명령어로의 마이그레이션 가이드가 필요할 때
title: "clawbot (Legacy)"
x-i18n:
  source_path: "cli/clawbot.md"
---

# `openclaw clawbot`

이 명령어는 하위 호환성 유지를 위해 제공되는 레거시 별칭(Alias) 네임스페이스임.

## 지원되는 별칭

* `openclaw clawbot qr`: [`openclaw qr`](/cli/qr) 명령어와 동일하게 동작함.

## 마이그레이션 권장 사항

향후 버전에서의 지원 중단을 대비하여 가급적 최신 최상위 명령어를 직접 사용할 것을 권장함:

* `openclaw clawbot qr` → **`openclaw qr`** 사용 권장.
