---
summary: "설치 스크립트 동작 방식(install.sh, install-cli.sh, install.ps1), 플래그, 자동화"
read_when:
  - `openclaw.ai/install.sh`가 어떻게 동작하는지 이해하고 싶습니다
  - 설치를 자동화하려고 합니다(CI / 헤드리스)
  - GitHub 체크아웃에서 설치하려고 합니다
title: "설치 스크립트 내부 동작"
---

# 설치 스크립트 내부 동작

OpenClaw는 `openclaw.ai`에서 제공되는 세 가지 설치 스크립트를 함께 제공합니다.

| 스크립트                           | 플랫폼               | 역할                                                                                              |
| ---------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | 필요 시 Node를 설치하고, npm(기본) 또는 git으로 OpenClaw를 설치하며, 온보딩도 실행할 수 있습니다. |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | 로컬 prefix(`~/.openclaw`) 아래에 Node + OpenClaw를 설치합니다. 루트 권한이 필요 없습니다.        |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | 필요 시 Node를 설치하고, npm(기본) 또는 git으로 OpenClaw를 설치하며, 온보딩도 실행할 수 있습니다. |

## 빠른 명령

<Tabs>
  <Tab title="install.sh">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --help
    ```

  </Tab>
  <Tab title="install-cli.sh">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --help
    ```

  </Tab>
  <Tab title="install.ps1">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```

    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -Tag beta -NoOnboard -DryRun
    ```

  </Tab>
</Tabs>

<Note>
설치는 성공했지만 새 터미널에서 `openclaw`를 찾을 수 없다면 [Node.js 문제 해결](/install/node#troubleshooting)을 참고하세요.
</Note>

---

## install.sh

<Tip>
macOS/Linux/WSL에서 대부분의 대화형 설치에 권장됩니다.
</Tip>

### 흐름 (install.sh)

<Steps>
  <Step title="OS 감지">
    macOS와 Linux(WSL 포함)를 지원합니다. macOS가 감지되면 Homebrew가 없을 때 설치합니다.
  </Step>
  <Step title="Node.js 22+ 보장">
    Node 버전을 확인하고, 필요하면 Node 22를 설치합니다(macOS는 Homebrew, Linux의 apt/dnf/yum은 NodeSource 설정 스크립트 사용).
  </Step>
  <Step title="Git 보장">
    Git이 없으면 설치합니다.
  </Step>
  <Step title="OpenClaw 설치">
    - `npm` 방식(기본): npm 전역 설치
    - `git` 방식: 저장소를 클론/업데이트하고, pnpm으로 의존성을 설치하고 빌드한 뒤 `~/.local/bin/openclaw`에 래퍼를 설치
  </Step>
  <Step title="설치 후 작업">
    - 업그레이드와 git 설치에서 `openclaw doctor --non-interactive`를 실행합니다(best effort)
    - 조건이 맞으면 온보딩을 시도합니다(TTY 사용 가능, 온보딩 비활성화 아님, bootstrap/config 검사 통과)
    - 기본값으로 `SHARP_IGNORE_GLOBAL_LIBVIPS=1`을 사용합니다
  </Step>
</Steps>

### 소스 체크아웃 감지

OpenClaw 체크아웃 안에서 실행되면(`package.json` + `pnpm-workspace.yaml`) 스크립트는 다음 두 가지를 제안합니다:

- 체크아웃 사용 (`git`)
- 전역 설치 사용 (`npm`)

TTY를 사용할 수 없고 설치 방식도 지정되지 않았다면 기본값은 `npm`이며 경고를 출력합니다.

잘못된 설치 방식 선택 또는 잘못된 `--install-method` 값인 경우 스크립트는 종료 코드 `2`로 끝납니다.

### 예시 (install.sh)

<Tabs>
  <Tab title="기본">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="온보딩 건너뛰기">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Git 설치">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```
  </Tab>
  <Tab title="드라이런">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="플래그 참고">

| 플래그                          | 설명                                                 |
| ------------------------------- | ---------------------------------------------------- |
| `--install-method npm\|git`     | 설치 방식 선택(기본: `npm`). 별칭: `--method`        |
| `--npm`                         | npm 방식 바로가기                                    |
| `--git`                         | git 방식 바로가기. 별칭: `--github`                  |
| `--version <version\|dist-tag>` | npm 버전 또는 dist-tag(기본: `latest`)               |
| `--beta`                        | beta dist-tag가 있으면 사용, 없으면 `latest`로 대체  |
| `--git-dir <path>`              | 체크아웃 디렉터리(기본: `~/openclaw`). 별칭: `--dir` |
| `--no-git-update`               | 기존 체크아웃에서 `git pull` 건너뛰기                |
| `--no-prompt`                   | 프롬프트 비활성화                                    |
| `--no-onboard`                  | 온보딩 건너뛰기                                      |
| `--onboard`                     | 온보딩 활성화                                        |
| `--dry-run`                     | 변경을 적용하지 않고 수행할 작업만 출력              |
| `--verbose`                     | 디버그 출력 활성화(`set -x`, npm notice-level 로그)  |
| `--help`                        | 사용법 표시(`-h`)                                    |

  </Accordion>

  <Accordion title="환경 변수 참고">

| 변수                                        | 설명                               |
| ------------------------------------------- | ---------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | 설치 방식                          |
| `OPENCLAW_VERSION=latest\|next\|<semver>`   | npm 버전 또는 dist-tag             |
| `OPENCLAW_BETA=0\|1`                        | beta가 있으면 사용                 |
| `OPENCLAW_GIT_DIR=<path>`                   | 체크아웃 디렉터리                  |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | git 업데이트 토글                  |
| `OPENCLAW_NO_PROMPT=1`                      | 프롬프트 비활성화                  |
| `OPENCLAW_NO_ONBOARD=1`                     | 온보딩 건너뛰기                    |
| `OPENCLAW_DRY_RUN=1`                        | 드라이런 모드                      |
| `OPENCLAW_VERBOSE=1`                        | 디버그 모드                        |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | npm 로그 레벨                      |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`          | sharp/libvips 동작 제어(기본: `1`) |

  </Accordion>
</AccordionGroup>

---

## install-cli.sh

<Info>
시스템 Node 의존성 없이 모든 것을 로컬 prefix(기본 `~/.openclaw`) 아래에 두고 싶을 때를 위한 설계입니다.
</Info>

### 흐름 (install-cli.sh)

<Steps>
  <Step title="로컬 Node 런타임 설치">
    Node tarball(기본 `22.22.0`)을 `<prefix>/tools/node-v<version>`에 내려받고 SHA-256을 검증합니다.
  </Step>
  <Step title="Git 보장">
    Git이 없으면 Linux에서는 apt/dnf/yum, macOS에서는 Homebrew를 통해 설치를 시도합니다.
  </Step>
  <Step title="prefix 아래에 OpenClaw 설치">
    npm에 `--prefix <prefix>`를 넘겨 설치한 뒤, `<prefix>/bin/openclaw`에 래퍼를 작성합니다.
  </Step>
</Steps>

### 예시 (install-cli.sh)

<Tabs>
  <Tab title="기본">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="사용자 지정 prefix + 버전">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --prefix /opt/openclaw --version latest
    ```
  </Tab>
  <Tab title="자동화용 JSON 출력">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="온보딩 실행">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="플래그 참고">

| 플래그                 | 설명                                                                           |
| ---------------------- | ------------------------------------------------------------------------------ |
| `--prefix <path>`      | 설치 prefix(기본: `~/.openclaw`)                                               |
| `--version <ver>`      | OpenClaw 버전 또는 dist-tag(기본: `latest`)                                    |
| `--node-version <ver>` | Node 버전(기본: `22.22.0`)                                                     |
| `--json`               | NDJSON 이벤트 출력                                                             |
| `--onboard`            | 설치 후 `openclaw onboard` 실행                                                |
| `--no-onboard`         | 온보딩 건너뛰기(기본값)                                                        |
| `--set-npm-prefix`     | Linux에서 현재 prefix가 쓰기 불가하면 npm prefix를 `~/.npm-global`로 강제 설정 |
| `--help`               | 사용법 표시(`-h`)                                                              |

  </Accordion>

  <Accordion title="환경 변수 참고">

| 변수                                        | 설명                                                                    |
| ------------------------------------------- | ----------------------------------------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                    | 설치 prefix                                                             |
| `OPENCLAW_VERSION=<ver>`                    | OpenClaw 버전 또는 dist-tag                                             |
| `OPENCLAW_NODE_VERSION=<ver>`               | Node 버전                                                               |
| `OPENCLAW_NO_ONBOARD=1`                     | 온보딩 건너뛰기                                                         |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | npm 로그 레벨                                                           |
| `OPENCLAW_GIT_DIR=<path>`                   | 레거시 정리용 조회 경로(이전 `Peekaboo` 서브모듈 체크아웃 제거 시 사용) |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`          | sharp/libvips 동작 제어(기본: `1`)                                      |

  </Accordion>
</AccordionGroup>

---

## install.ps1

### 흐름 (install.ps1)

<Steps>
  <Step title="PowerShell + Windows 환경 보장">
    PowerShell 5 이상이 필요합니다.
  </Step>
  <Step title="Node.js 22+ 보장">
    없으면 winget, 그다음 Chocolatey, 그다음 Scoop 순서로 설치를 시도합니다.
  </Step>
  <Step title="OpenClaw 설치">
    - `npm` 방식(기본): 선택한 `-Tag`를 사용해 npm 전역 설치
    - `git` 방식: 저장소를 클론/업데이트하고 pnpm으로 설치/빌드한 뒤 `%USERPROFILE%\.local\bin\openclaw.cmd`에 래퍼를 설치
  </Step>
  <Step title="설치 후 작업">
    가능하면 필요한 bin 디렉터리를 사용자 PATH에 추가한 뒤, 업그레이드와 git 설치에서 `openclaw doctor --non-interactive`를 실행합니다(best effort).
  </Step>
</Steps>

### 예시 (install.ps1)

<Tabs>
  <Tab title="기본">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
  <Tab title="Git 설치">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git
    ```
  </Tab>
  <Tab title="사용자 지정 git 디렉터리">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -GitDir "C:\openclaw"
    ```
  </Tab>
  <Tab title="드라이런">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -DryRun
    ```
  </Tab>
  <Tab title="디버그 추적">
    ```powershell
    # install.ps1 has no dedicated -Verbose flag yet.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="플래그 참고">

| 플래그                    | 설명                                              |
| ------------------------- | ------------------------------------------------- |
| `-InstallMethod npm\|git` | 설치 방식(기본: `npm`)                            |
| `-Tag <tag>`              | npm dist-tag(기본: `latest`)                      |
| `-GitDir <path>`          | 체크아웃 디렉터리(기본: `%USERPROFILE%\openclaw`) |
| `-NoOnboard`              | 온보딩 건너뛰기                                   |
| `-NoGitUpdate`            | `git pull` 건너뛰기                               |
| `-DryRun`                 | 수행할 작업만 출력                                |

  </Accordion>

  <Accordion title="환경 변수 참고">

| 변수                               | 설명              |
| ---------------------------------- | ----------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | 설치 방식         |
| `OPENCLAW_GIT_DIR=<path>`          | 체크아웃 디렉터리 |
| `OPENCLAW_NO_ONBOARD=1`            | 온보딩 건너뛰기   |
| `OPENCLAW_GIT_UPDATE=0`            | git pull 비활성화 |
| `OPENCLAW_DRY_RUN=1`               | 드라이런 모드     |

  </Accordion>
</AccordionGroup>

<Note>
`-InstallMethod git`를 사용했는데 Git이 없으면, 스크립트는 종료하면서 Git for Windows 링크를 출력합니다.
</Note>

---

## CI 및 자동화

예측 가능한 실행을 위해 비대화형 플래그/환경 변수를 사용하세요.

<Tabs>
  <Tab title="install.sh (비대화형 npm)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-prompt --no-onboard
    ```
  </Tab>
  <Tab title="install.sh (비대화형 git)">
    ```bash
    OPENCLAW_INSTALL_METHOD=git OPENCLAW_NO_PROMPT=1 \
      curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="install-cli.sh (JSON)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="install.ps1 (온보딩 건너뛰기)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

---

## 문제 해결

<AccordionGroup>
  <Accordion title="왜 Git이 필요한가요?">
    `git` 설치 방식에는 Git이 필요합니다. `npm` 설치에서도 의존성이 git URL을 사용할 때 `spawn git ENOENT` 실패를 피하기 위해 Git을 확인/설치합니다.
  </Accordion>

  <Accordion title="왜 Linux에서 npm이 EACCES를 내나요?">
    일부 Linux 환경은 npm 전역 prefix를 root 소유 경로로 가리킵니다. `install.sh`는 prefix를 `~/.npm-global`로 바꾸고 PATH export를 셸 rc 파일에 추가할 수 있습니다(해당 파일이 있을 때).
  </Accordion>

  <Accordion title="sharp/libvips 문제">
    스크립트는 기본값으로 `SHARP_IGNORE_GLOBAL_LIBVIPS=1`을 설정해 sharp가 시스템 libvips에 맞춰 빌드되는 일을 피합니다. 이를 덮어쓰려면:

    ```bash
    SHARP_IGNORE_GLOBAL_LIBVIPS=0 curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    Git for Windows를 설치하고 PowerShell을 다시 연 뒤 설치 프로그램을 다시 실행하세요.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    `npm config get prefix`를 실행한 뒤 그 디렉터리를 사용자 PATH에 추가하세요(Windows에서는 `\bin` 접미사가 필요 없습니다). 그런 다음 PowerShell을 다시 여세요.
  </Accordion>

  <Accordion title="Windows: 자세한 설치 출력은 어떻게 보나요?">
    `install.ps1`은 현재 전용 `-Verbose` 스위치를 제공하지 않습니다.
    스크립트 수준 진단을 위해 PowerShell 추적을 사용하세요:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="설치 후 openclaw를 찾을 수 없음">
    대개 PATH 문제입니다. [Node.js 문제 해결](/install/node#troubleshooting)을 참고하세요.
  </Accordion>
</AccordionGroup>
