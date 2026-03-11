---
summary: "OpenClaw 업데이트 채널(Stable, Beta, Dev)의 의미, 전환 방법 및 태깅 규칙 안내"
read_when:
  - Stable, Beta, Dev 채널 간의 전환이 필요할 때
  - 프리릴리스 태깅 또는 배포 작업을 수행할 때
title: "개발 채널 관리"
x-i18n:
  source_path: "install/development-channels.md"
---

# 개발 채널 (Development Channels)

최종 업데이트: 2026-01-21

OpenClaw는 세 가지 업데이트 채널을 운영함:

- **stable**: npm dist-tag `latest`에 대응함. 가장 안정적인 버전임.
- **beta**: npm dist-tag `beta`에 대응함. 테스트 중인 신기능이 포함된 빌드임.
- **dev**: Git 저장소의 `main` 브랜치 최신 상태임. 배포 시 npm dist-tag `dev`를 사용함.

새로운 빌드는 먼저 **beta**로 배포되어 검증 과정을 거친 후, 버전 번호 변경 없이 **`latest`로 승격**됨. npm 설치 시에는 항상 dist-tag가 최종 기준(SSOT)이 됨.

## 채널 전환 방법

### Git 체크아웃 방식

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

- **`stable` / `beta`**: 각 채널 조건에 부합하는 최신 태그를 체크아웃함 (두 채널이 동일한 태그를 가리킬 때가 많음).
- **`dev`**: `main` 브랜치로 전환하고 업스트림(Upstream) 소스 기반으로 리베이스(Rebase)를 수행함.

### npm / pnpm 전역 설치 방식

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

대응하는 npm dist-tag(`latest`, `beta`, `dev`)를 통해 패키지를 업데이트함.

`--channel` 플래그를 사용하여 **명시적으로** 채널을 변경할 경우, OpenClaw는 설치 방식까지 해당 채널에 맞게 조정함:

- **`dev`**: 로컬 Git 체크아웃 존재 여부를 확인하고(기본값 `~/openclaw`, `OPENCLAW_GIT_DIR`로 오버라이드 가능), 소스를 업데이트한 뒤 해당 체크아웃을 기반으로 전역 CLI를 재설치함.
- **`stable` / `beta`**: npm 저장소에서 해당 채널의 dist-tag 빌드를 내려받아 설치함.

*팁: Stable 버전과 Dev 버전을 병행하여 사용하고 싶다면, 두 개의 클론(Clone)을 생성한 뒤 주 Gateway가 Stable 클론을 바라보도록 설정함.*

## 플러그인 동기화 동작

`openclaw update` 명령어로 채널을 전환하면 플러그인 소스도 해당 환경에 맞춰 동기화됨:

- **`dev` 채널**: Git 체크아웃에 포함된 번들 플러그인을 우선적으로 사용함.
- **`stable` / `beta` 채널**: npm을 통해 설치된 플러그인 패키지 상태를 복원함.

## 태깅(Tagging) 모범 사례

- Git 체크아웃의 타겟이 될 릴리스에는 반드시 태그를 부여함 (Stable: `vYYYY.M.D`, Beta: `vYYYY.M.D-beta.N`).
- 하위 호환성을 위해 `vYYYY.M.D.beta.N` 형식도 지원하지만, `-beta.N` 형식을 권장함.
- 레거시 형식인 `vYYYY.M.D-<patch>` 태그 역시 Stable 버전으로 간주함.
- **불변성 유지**: 한 번 부여한 태그는 절대로 위치를 옮기거나 재사용해서는 안 됨.
- npm dist-tag는 항상 최종 설치의 기준점이 됨:
  - `latest` → 안정판 (Stable)
  - `beta` → 출시 후보군 (Candidate)
  - `dev` → 메인 브랜치 스냅샷 (선택 사항)

## macOS 앱 배포 정책

Beta 및 Dev 빌드에는 macOS 전용 앱 파일(`.app` / `.dmg`)이 **포함되지 않을 수 있음.** 이는 정상적인 동작이며 다음 사항을 준수함:

- Git 태그와 npm dist-tag는 앱 배포 여부와 관계없이 게시됨.
- 앱 빌드가 제외된 경우, 릴리스 노트나 변경 로그에 "이번 Beta 버전은 macOS 앱 빌드를 포함하지 않음"을 명시하여 혼선을 방지함.
