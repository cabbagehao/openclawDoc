---
summary: "macOS Skills 설정 UI 와 gateway 기반 상태"
read_when:
  - macOS Skills 설정 UI 를 업데이트할 때
  - skills gating 또는 설치 동작을 변경할 때
title: "Skills"
---

# Skills (macOS)

macOS 앱은 gateway 를 통해 OpenClaw skills 를 표시합니다. 로컬에서 skills 를 직접 파싱하지는 않습니다.

## 데이터 소스

* `skills.status` (gateway) 는 모든 skills 와 사용 가능 여부, 누락된 요구 사항을 반환합니다
  (번들 skills 에 대한 allowlist 차단도 포함).
* 요구 사항은 각 `SKILL.md` 의 `metadata.openclaw.requires` 에서 파생됩니다.

## 설치 동작

* `metadata.openclaw.install` 이 설치 옵션(brew/node/go/uv)을 정의합니다.
* 앱은 `skills.install` 을 호출해 gateway 호스트에서 설치기를 실행합니다.
* 여러 설치기가 제공되면 gateway 는 선호 설치기 하나만 노출합니다
  (brew 가 가능하면 brew, 아니면 `skills.install` 의 node manager, 기본값은 npm).

## Env/API keys

* 앱은 키를 `~/.openclaw/openclaw.json` 의 `skills.entries.<skillKey>` 아래에 저장합니다.
* `skills.update` 는 `enabled`, `apiKey`, `env` 를 패치합니다.

## 원격 모드

* 설치와 설정 업데이트는 로컬 Mac 이 아니라 gateway 호스트에서 이루어집니다.
