---
summary: "Gateway 플러그인 설치, 삭제, 활성화 및 문제 해결을 위한 `openclaw plugins` 명령어 레퍼런스"
read_when:
  - Gateway 프로세스 내에서 실행되는 플러그인이나 확장 기능을 관리하고자 할 때
  - 플러그인 로드 실패 원인을 디버깅하고 점검해야 할 때
title: "plugins"
x-i18n:
  source_path: "cli/plugins.md"
---

# `openclaw plugins`

Gateway 프로세스에 로드되어 기능을 확장하는 플러그인(Plugins) 및 익스텐션(Extensions)을 관리함.

**관련 문서:**

* 플러그인 시스템 개요: [Plugins](/tools/plugin)
* 플러그인 매니페스트 및 스키마: [Plugin manifest](/plugins/manifest)
* 보안 강화 설정: [Security](/gateway/security)

## 주요 명령어

```bash
# 설치된 플러그인 목록 조회
openclaw plugins list

# 특정 플러그인의 상세 정보 확인
openclaw plugins info <id>

# 플러그인 활성화
openclaw plugins enable <id>

# 플러그인 비활성화
openclaw plugins disable <id>

# 플러그인 완전 제거
openclaw plugins uninstall <id>

# 플러그인 로드 오류 진단
openclaw plugins doctor

# 특정 플러그인 업데이트
openclaw plugins update <id>

# 설치된 모든 npm 플러그인 업데이트
openclaw plugins update --all
```

내장(Bundled) 플러그인은 OpenClaw 설치 시 함께 제공되지만 초기에는 비활성 상태임. 활성화하려면 `plugins enable` 명령어를 사용함.

모든 플러그인은 반드시 인라인 JSON 스키마(`configSchema`)가 포함된 `openclaw.plugin.json` 매니페스트 파일을 포함해야 함. 매니페스트나 스키마가 누락되거나 유효하지 않을 경우 플러그인 로드 및 설정 검증이 실패함.

## 플러그인 설치 (Install)

```bash
# 로컬 경로 또는 패키지 명으로 설치
openclaw plugins install <경로-또는-이름>

# npm 패키지 설치 시 특정 버전 고정
openclaw plugins install <npm-spec> --pin
```

<Warning>
  **보안 주의**: 플러그인 설치는 시스템에서 임의의 코드를 실행하는 것과 같음. 신뢰할 수 있는 소스만 사용하고, 가급적 버전을 고정(`--pin`)하여 관리할 것을 권장함.
</Warning>

**설치 규칙:**

* **npm 설치**: 레지스트리에 등록된 패키지 이름과 선택적으로 정확한 버전 또는 배포 태그(`dist-tag`)만 허용함. 보안을 위해 의존성 설치 시 `--ignore-scripts` 옵션이 강제됨.
* **버전 선택**: 일반적인 이름이나 `@latest` 지정 시 안정(Stable) 버전을 우선함. 프리릴리스(Prerelease) 버전 설치 시에는 `@beta` 등 명시적인 태그 사용이 필요함.
* **이름 충돌**: 설치하려는 이름이 내장 플러그인 ID와 겹칠 경우(예: `diffs`), 시스템은 내장 플러그인을 우선적으로 설치함. 동일 명칭의 외부 npm 패키지를 설치하려면 `@scope/name` 형식을 사용해야 함.
* **로컬 연결**: `--link` 플래그를 사용하면 파일을 복사하지 않고 로컬 디렉터리 경로를 직접 참조함.

지원 압축 형식: `.zip`, `.tgz`, `.tar.gz`, `.tar`.

## 플러그인 삭제 (Uninstall)

```bash
# 플러그인 레코드 및 파일 삭제
openclaw plugins uninstall <id>

# 파일은 유지하고 설정 정보만 제거
openclaw plugins uninstall <id> --keep-files
```

`uninstall` 명령어 수행 시 설정 파일의 `entries`, `installs`, 허용 목록 및 연결 경로 정보가 모두 삭제됨. 특히 활성화된 메모리 플러그인이 삭제될 경우, 시스템 메모리 슬롯은 기본값인 `memory-core`로 자동 복구됨.

기본적으로 상태 디렉터리의 익스텐션 루트(`$OPENCLAW_STATE_DIR/extensions/<id>`) 하위의 설치 폴더도 함께 삭제됨.

## 플러그인 업데이트 (Update)

업데이트는 오직 npm을 통해 설치된 플러그인(`plugins.installs`에 등록된 항목)에만 적용됨.

저장된 무결성 해시(Integrity hash) 정보가 존재하고 새로 가져온 아티팩트의 해시가 변경된 경우, 시스템은 경고 메시지를 출력하고 사용자 승인을 요청함. CI 환경이나 비대화형 실행 시에는 전역 `--yes` 플래그로 이를 건너뛸 수 있음.
