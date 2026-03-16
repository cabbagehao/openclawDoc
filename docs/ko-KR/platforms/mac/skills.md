---
summary: "macOS Skills 설정 UI와 gateway 기반 상태 모델을 설명합니다."
description: "macOS app이 skills 목록, 설치 옵션, API key 저장, remote mode 동작을 gateway를 통해 어떻게 처리하는지 정리합니다."
read_when:
  - macOS Skills settings UI를 수정할 때
  - skills gating 또는 install 동작을 바꿀 때
title: "Skills"
x-i18n:
  source_path: "platforms/mac/skills.md"
---

# Skills (macOS)

macOS app은 gateway를 통해 OpenClaw skills를 노출합니다. skill을 로컬에서 직접 파싱하지는 않습니다.

## 데이터 소스

- `skills.status`(gateway)는 모든 skill과 함께 eligibility, missing requirement를 반환합니다. bundled skill에 대한 allowlist block도 여기에 포함됩니다.
- requirement는 각 `SKILL.md`의 `metadata.openclaw.requires`에서 파생됩니다.

## 설치 동작

- `metadata.openclaw.install`이 install option(`brew`/`node`/`go`/`uv`)을 정의합니다.
- app은 `skills.install`을 호출해 gateway host에서 installer를 실행합니다.
- installer가 여러 개 제공되면 gateway는 preferred installer 하나만 보여 줍니다. `brew`를 쓸 수 있으면 `brew`를 우선하고, 아니면 `skills.install`의 node manager를 사용하며, 기본값은 `npm`입니다.

## Env/API keys

- app은 key를 `~/.openclaw/openclaw.json`의 `skills.entries.<skillKey>` 아래에 저장합니다.
- `skills.update`는 `enabled`, `apiKey`, `env`를 patch합니다.

## 원격 모드

- install과 config update는 로컬 Mac이 아니라 gateway host에서 수행됩니다.
