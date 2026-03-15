---
summary: "설치 스크립트(install.sh, install-cli.sh, install.ps1)의 동작 원리, 플래그 및 자동화 구성 가이드"
read_when:
  - "`openclaw.ai/install.sh` 스크립트의 상세 동작을 이해하고자 할 때"
  - CI 또는 헤드리스 환경에서 설치를 자동화하고 싶을 때
  - GitHub 소스 코드 체크아웃 기반으로 설치하려 할 때
title: "설치 스크립트 내부 동작"
x-i18n:
  source_path: "install/installer.md"
---

# 설치 스크립트 내부 동작 (Installer Internals)

OpenClaw는 `openclaw.ai` 도메인을 통해 세 가지 공식 설치 스크립트를 제공함.

| 스크립트명 | 대상 플랫폼 | 주요 기능 |
| :--- | :--- | :--- |
| [`install.sh`](#installsh) | macOS / Linux / WSL | Node.js 설치(필요 시), npm(기본) 또는 Git 기반 설치, 온보딩 실행 지원. |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL | 시스템 영향 없이 로컬 경로(`~/.openclaw`)에 Node.js와 OpenClaw를 설치. Root 권한 불필요. |
| [`install.ps1`](#installps1) | Windows (PowerShell) | Node.js 설치(필요 시), npm(기본) 또는 Git 기반 설치, 온보딩 실행 지원. |

## 퀵 명령어

<Tabs>
  <Tab title="install.sh">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

    ```bash
    # 도움말 확인
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --help
    ```

  </Tab>
  <Tab title="install-cli.sh">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```

    ```bash
    # 도움말 확인
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --help
    ```

  </Tab>
  <Tab title="install.ps1">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```

    ```powershell
    # 옵션 적용 예시
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -Tag beta -NoOnboard -DryRun
    ```

  </Tab>
</Tabs>

<Note>
설치 완료 후 새 터미널에서 `openclaw` 명령어를 찾을 수 없다면 [Node.js 문제 해결 가이드](/install/node#troubleshooting)를 참조함.
</Note>

---

## install.sh

<Tip>
macOS, Linux, WSL 환경에서 대화형으로 설치할 때 가장 권장되는 방식임.
</Tip>

### 실행 흐름 (install.sh)

<Steps>
  <Step title="OS 감지">
    macOS 및 Linux(WSL 포함) 환경을 감지함. macOS의 경우 Homebrew 설치 여부를 확인하고 누락 시 설치를 지원함.
  </Step>
  <Step title="Node.js 22 이상 보장">
    시스템의 Node.js 버전을 확인하고, 필요한 경우 Node 22 버전을 설치함 (macOS는 Homebrew, Linux는 NodeSource 설정 스크립트 활용).
  </Step>
  <Step title="Git 설치 확인">
    Git이 설치되어 있지 않은 경우 설치를 진행함.
  </Step>
  <Step title="OpenClaw 설치">
    - **npm 방식** (기본): npm을 통한 전역(Global) 설치를 수행함.
    - **Git 방식**: 저장소를 클론 또는 업데이트한 뒤 pnpm으로 의존성 설치 및 빌드를 수행하고, `~/.local/bin/openclaw` 경로에 실행 래퍼를 생성함.
  </Step>
  <Step title="설치 후 작업">
    - 업데이트나 Git 설치 시 `openclaw doctor --non-interactive`를 실행하여 시스템을 점검함.
    - 적절한 조건(TTY 활성, 온보딩 미제외 등) 충족 시 온보딩 마법사를 실행함.
    - `SHARP_IGNORE_GLOBAL_LIBVIPS=1` 설정을 기본값으로 적용함.
  </Step>
</Steps>

### 소스 체크아웃 감지

OpenClaw 소스 코드가 포함된 디렉터리(`package.json` 및 `pnpm-workspace.yaml` 존재) 내부에서 실행할 경우, 스크립트는 다음 선택지를 제공함:

- 현재 체크아웃 소스 사용 (**Git**)
- 전역 설치본 사용 (**npm**)

TTY 환경이 아니고 설치 방식이 명시되지 않은 경우, 경고 메시지와 함께 `npm` 방식을 기본값으로 선택함. 유효하지 않은 옵션 지정 시 종료 코드 `2`를 반환하며 중단됨.

### 주요 활용 예시 (install.sh)

<Tabs>
  <Tab title="표준 설치">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="온보딩 생략">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Git 기반 설치">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```
  </Tab>
  <Tab title="시뮬레이션 (Dry-run)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="주요 플래그(Flags) 레퍼런스">

| 플래그 | 설명 |
| :--- | :--- |
| `--install-method npm\|git` | 설치 방식 선택 (기본값: `npm`). 별칭: `--method` |
| `--npm` | npm 방식 즉시 선택 |
| `--git` | Git 방식 즉시 선택. 별칭: `--github` |
| `--version <version\|tag>` | npm 버전 또는 배포 태그 지정 (기본값: `latest`) |
| `--beta` | 베타 태그가 있는 경우 사용, 없으면 `latest`로 폴백 |
| `--git-dir <path>` | Git 소스 체크아웃 경로 (기본값: `~/openclaw`). 별칭: `--dir` |
| `--no-git-update` | 기존 소스 체크아웃이 있을 경우 `git pull` 업데이트 생략 |
| `--no-prompt` | 사용자 확인 프롬프트를 표시하지 않음 (자동화용) |
| `--no-onboard` | 설치 완료 후 온보딩 마법사를 실행하지 않음 |
| `--dry-run` | 실제 변경을 적용하지 않고 수행 예정 작업만 출력함 |
| `--verbose` | 디버그 정보 출력 활성화 (`set -x` 및 npm 상세 로그) |

  </Accordion>

  <Accordion title="환경 변수(Env) 레퍼런스">

| 변수명 | 설명 |
| :--- | :--- |
| `OPENCLAW_INSTALL_METHOD` | 설치 방식 지정 (`git` 또는 `npm`) |
| `OPENCLAW_VERSION` | 설치할 패키지 버전 또는 태그 지정 |
| `OPENCLAW_GIT_DIR` | Git 소스 저장 경로 지정 |
| `OPENCLAW_NO_PROMPT=1` | 대화형 프롬프트 비활성화 |
| `OPENCLAW_NO_ONBOARD=1` | 온보딩 실행 생략 |
| `OPENCLAW_DRY_RUN=1` | 드라이런 모드 활성화 |
| `SHARP_IGNORE_GLOBAL_LIBVIPS` | Sharp 라이브러리의 시스템 의존성 사용 여부 (기본값: `1`) |

  </Accordion>
</AccordionGroup>

---

## install-cli.sh

<Info>
시스템의 Node.js 환경에 영향을 주지 않고 모든 구성 요소를 로컬 경로(기본 `~/.openclaw`)에 격리하여 설치하고 싶은 경우에 적합함.
</Info>

### 실행 흐름 (install-cli.sh)

<Steps>
  <Step title="로컬 Node.js 설치">
    사용자의 설치 경로 하위(`tools/node-v<버전>`)에 Node.js 바이너리를 다운로드하고 무결성을 검증함.
  </Step>
  <Step title="Git 설치 보장">
    Git 부재 시 패키지 관리자(apt, dnf, Homebrew 등)를 통해 설치를 시도함.
  </Step>
  <Step title="격리된 경로에 설치">
    `--prefix` 옵션을 사용하여 지정된 경로에 OpenClaw를 설치하고, `bin/openclaw` 경로에 실행용 래퍼 파일을 생성함.
  </Step>
</Steps>

### 주요 활용 예시 (install-cli.sh)

<Tabs>
  <Tab title="표준 설치">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="커스텀 경로 및 버전">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --prefix /opt/openclaw --version latest
    ```
  </Tab>
  <Tab title="자동화용 JSON 출력">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="플래그 레퍼런스">

| 플래그 | 설명 |
| :--- | :--- |
| `--prefix <path>` | 설치 루트 경로 지정 (기본값: `~/.openclaw`) |
| `--version <ver>` | 설치할 패키지 버전 지정 |
| `--node-version <ver>` | 로컬에 설치할 Node.js 버전 지정 |
| `--json` | 결과를 NDJSON 형식으로 출력함 |
| `--onboard` | 설치 직후 `openclaw onboard` 실행 |

  </Accordion>
</AccordionGroup>

---

## install.ps1 (Windows)

### 실행 흐름 (install.ps1)

<Steps>
  <Step title="환경 검증">
    PowerShell 5 이상 버전 및 윈도우 환경 여부를 확인함.
  </Step>
  <Step title="Node.js 22 이상 설치">
    누락 시 winget, Chocolatey, Scoop 순서로 설치를 시도함.
  </Step>
  <Step title="OpenClaw 설치">
    - **npm 방식**: 전역 설치를 수행함.
    - **Git 방식**: 저장소 클론 및 pnpm 빌드 후 사용자 프로필의 `.local\bin\openclaw.cmd`에 래퍼를 설치함.
  </Step>
  <Step title="경로 등록 및 점검">
    설치된 경로를 사용자 PATH에 추가하고 `openclaw doctor`를 실행함.
  </Step>
</Steps>

### 주요 활용 예시 (install.ps1)

<Tabs>
  <Tab title="표준 설치">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
  <Tab title="Git 방식 설치">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git
    ```
  </Tab>
</Tabs>

---

## 문제 해결 (Troubleshooting)

<AccordionGroup>
  <Accordion title="왜 Git 설치가 필수인가요?">
    Git 방식 설치뿐만 아니라, npm 방식 설치 중에도 일부 의존성 패키지가 Git URL을 사용할 수 있기 때문임. `spawn git ENOENT` 오류를 방지하기 위해 Git 설치 여부를 점검함.
  </Accordion>

  <Accordion title="Linux에서 npm EACCES 오류가 발생함">
    일부 배포판의 npm 전역 경로가 Root 소유이기 때문임. `install.sh` 실행 시 접두사를 `~/.npm-global`로 변경하고 셸 설정 파일에 PATH 정보를 추가하도록 지원함.
  </Accordion>

  <Accordion title="sharp/libvips 빌드 오류">
    시스템에 설치된 libvips와의 충돌을 피하기 위해 기본적으로 `SHARP_IGNORE_GLOBAL_LIBVIPS=1` 설정을 사용함. 시스템 라이브러리를 꼭 사용해야 한다면 해당 변수를 `0`으로 설정하고 설치를 진행함.
  </Accordion>

  <Accordion title="설치 후 명령어를 찾을 수 없음">
    대부분 PATH 환경 변수 설정 문제임. [Node.js 상세 문제 해결](/install/node#troubleshooting) 섹션을 참조하여 경로가 올바르게 등록되었는지 확인함.
  </Accordion>
</AccordionGroup>
