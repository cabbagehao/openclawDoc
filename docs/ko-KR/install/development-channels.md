---
summary: "OpenClaw 업데이트 채널(Stable, Beta, Dev)의 의미, 전환 방법 및 태깅 규칙 안내"
description: "`stable`, `beta`, `dev` 채널의 의미와 전환 방식, dist-tag 운영 원칙, 릴리스 태깅 규칙을 설명합니다."
read_when:
  - Stable, Beta, Dev 채널 간의 전환이 필요할 때
  - 프리릴리스 태깅 또는 배포 작업을 수행할 때
title: "개발 채널 관리"
x-i18n:
  source_path: "install/development-channels.md"
---

# Development channels

최종 업데이트: 2026-01-21

OpenClaw는 세 가지 업데이트 채널을 제공합니다.

- **stable**: npm dist-tag `latest`
- **beta**: npm dist-tag `beta` (테스트 중인 빌드)
- **dev**: `main`의 이동하는 헤드(git). 게시될 때는 npm dist-tag `dev`

새 빌드는 먼저 **beta**로 배포해 검증한 뒤, 버전 번호를 바꾸지 않고 **`latest`로 승격**합니다. npm 설치에서는 dist-tag가 기준입니다.

## Switching channels

Git checkout:

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

- `stable`/`beta`는 조건에 맞는 최신 태그를 체크아웃합니다. 두 채널이 같은 태그를 가리키는 경우도 많습니다.
- `dev`는 `main`으로 전환한 뒤 upstream 기준으로 rebase합니다.

npm/pnpm global install:

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

해당 npm dist-tag(`latest`, `beta`, `dev`)를 통해 패키지를 업데이트합니다.

`--channel`로 **명시적으로** 채널을 전환하면, OpenClaw는 설치 방식도 함께 맞춥니다.

- `dev`는 git checkout(기본값 `~/openclaw`, `OPENCLAW_GIT_DIR`로 변경 가능)을 준비하고 업데이트한 뒤, 그 checkout에서 전역 CLI를 다시 설치합니다.
- `stable`/`beta`는 해당 dist-tag로 npm에서 설치합니다.

Tip: stable과 dev를 병행해 쓰고 싶다면 clone을 두 개 유지하고, gateway는 stable 쪽을 보도록 두세요.

## Plugins and channels

`openclaw update`로 채널을 전환하면 플러그인 소스도 함께 동기화됩니다.

- `dev`는 git checkout에 포함된 bundled plugins를 우선 사용합니다.
- `stable`과 `beta`는 npm으로 설치된 plugin packages를 복원합니다.

## Tagging best practices

- git checkout이 도달해야 하는 릴리스에는 태그를 붙이세요. stable은 `vYYYY.M.D`, beta는 `vYYYY.M.D-beta.N`을 사용합니다.
- 호환성을 위해 `vYYYY.M.D.beta.N`도 인식하지만, `-beta.N` 형식을 권장합니다.
- 기존 `vYYYY.M.D-<patch>` 태그도 stable(비 beta)로 인식합니다.
- 태그는 불변으로 유지하세요. 이미 만든 태그를 이동하거나 재사용하지 마세요.
- npm dist-tags는 npm 설치의 기준입니다.
  - `latest` → stable
  - `beta` → candidate build
  - `dev` → main snapshot (선택 사항)

## macOS app availability

beta와 dev 빌드에는 macOS 앱 릴리스가 **없을 수도 있습니다.** 이는 정상입니다.

- git tag와 npm dist-tag는 그대로 게시할 수 있습니다.
- macOS 빌드가 빠졌다면 릴리스 노트나 changelog에 "no macOS build for this beta"라고 명시하세요.
