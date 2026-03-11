---
summary: "stable, beta, dev 채널: 의미, 전환, 태깅"
read_when:
  - stable/beta/dev 사이를 전환하고 싶습니다
  - 프리릴리스를 태깅하거나 배포하려고 합니다
title: "개발 채널"
---

# 개발 채널

마지막 업데이트: 2026-01-21

OpenClaw는 세 가지 업데이트 채널을 제공합니다.

- **stable**: npm dist-tag `latest`
- **beta**: npm dist-tag `beta`(테스트 중인 빌드)
- **dev**: `main`의 최신 헤드(git). npm dist-tag: `dev`(배포된 경우)

빌드는 먼저 **beta**로 배포한 뒤 테스트하고, 검증된 빌드를 버전 번호를 바꾸지 않고 **`latest`로 승격**합니다. npm 설치에서는 dist-tag가 진실의 원천입니다.

## 채널 전환

Git 체크아웃:

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

- `stable`/`beta`는 가장 최근의 일치하는 태그를 체크아웃합니다(종종 같은 태그일 수 있음).
- `dev`는 `main`으로 전환하고 upstream 기준으로 rebase합니다.

npm/pnpm 전역 설치:

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

이 경우 대응하는 npm dist-tag(`latest`, `beta`, `dev`)를 통해 업데이트합니다.

`--channel`로 채널을 **명시적으로** 전환하면 OpenClaw는 설치 방식도 함께 맞춥니다.

- `dev`는 git 체크아웃을 보장하고(기본 `~/openclaw`, `OPENCLAW_GIT_DIR`로 덮어쓰기 가능), 이를 업데이트한 뒤 그 체크아웃에서 전역 CLI를 설치합니다.
- `stable`/`beta`는 일치하는 dist-tag로 npm에서 설치합니다.

팁: stable과 dev를 병행해서 쓰고 싶다면 클론을 두 개 유지하고 게이트웨이를 stable 쪽으로 지정하세요.

## 플러그인과 채널

`openclaw update`로 채널을 바꾸면 OpenClaw는 플러그인 소스도 동기화합니다.

- `dev`는 git 체크아웃에 번들된 플러그인을 우선합니다.
- `stable`과 `beta`는 npm으로 설치된 플러그인 패키지를 복원합니다.

## 태깅 모범 사례

- git 체크아웃이 도달하길 원하는 릴리스를 태그로 남기세요(`vYYYY.M.D`는 stable, `vYYYY.M.D-beta.N`은 beta).
- 호환성을 위해 `vYYYY.M.D.beta.N`도 인식하지만, `-beta.N` 형식을 권장합니다.
- 레거시 `vYYYY.M.D-<patch>` 태그도 stable(non-beta)로 인식됩니다.
- 태그는 불변으로 유지하세요. 태그를 이동하거나 재사용하지 마세요.
- npm 설치에서는 dist-tag가 계속 진실의 원천입니다.
  - `latest` → stable
  - `beta` → 후보 빌드
  - `dev` → main 스냅샷(선택 사항)

## macOS 앱 제공 여부

beta와 dev 빌드에는 macOS 앱 릴리스가 **없을 수 있습니다**. 괜찮습니다.

- git 태그와 npm dist-tag는 여전히 배포할 수 있습니다.
- 릴리스 노트나 변경 로그에 "이번 beta에는 macOS 빌드가 없음"을 명시하세요.
