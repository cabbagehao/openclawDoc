---
title: Install
description: OpenClaw 설치 스크립트, npm/pnpm, 소스 빌드, Docker 등 다양한 설치와 유지보수 경로를 안내합니다
summary: 설치 스크립트, npm/pnpm, 소스 빌드, Docker 등 OpenClaw의 다양한 설치 방법을 안내합니다
read_when:
  - Getting Started 퀵스타트 외의 설치 방법이 필요할 때
  - 클라우드 플랫폼에 배포하려고 할 때
  - 업데이트, 마이그레이션, 제거 절차를 확인해야 할 때
x-i18n:
  source_path: install/index.md
---

# Install

이미 [Getting Started](/start/getting-started)를 따라 했다면 설치는 끝난 상태입니다. 이 페이지는 대체 설치 방법, 플랫폼별 안내, 유지보수 절차를 다룹니다.

## 시스템 요구 사항

- **[Node 22+](/install/node)** (installer script가 없으면 자동으로 설치됨)
- macOS, Linux, 또는 Windows
- 소스에서 빌드할 경우에만 `pnpm` 필요

<Note>
Windows에서는 OpenClaw를 [WSL2](https://learn.microsoft.com/en-us/windows/wsl/install) 아래에서 실행하는 것을 강하게 권장합니다.
</Note>

## 설치 방법

<Tip>
**installer script**가 OpenClaw 설치의 권장 경로입니다. Node 감지, 설치, 온보딩까지 한 번에 처리합니다.
</Tip>

<Warning>
VPS나 클라우드 호스트에서는 가능하면 서드파티 "1-click" 마켓플레이스 이미지를 피하세요. Ubuntu LTS 같은 깨끗한 베이스 OS 이미지 위에 직접 OpenClaw를 설치하는 편이 안전합니다.
</Warning>

<AccordionGroup>
  <Accordion title="Installer script" icon="rocket" defaultOpen>
    CLI를 내려받아 전역 npm 설치를 수행하고 온보딩 wizard를 시작합니다.

    <Tabs>
      <Tab title="macOS / Linux / WSL2">
        ```bash
        curl -fsSL https://openclaw.ai/install.sh | bash
        ```
      </Tab>
      <Tab title="Windows (PowerShell)">
        ```powershell
        iwr -useb https://openclaw.ai/install.ps1 | iex
        ```
      </Tab>
    </Tabs>

    이것만으로 충분합니다. 스크립트가 Node 감지, 설치, 온보딩을 처리합니다.

    온보딩을 건너뛰고 바이너리만 설치하려면:

    <Tabs>
      <Tab title="macOS / Linux / WSL2">
        ```bash
        curl -fsSL https://openclaw.ai/install.sh | bash -s -- --no-onboard
        ```
      </Tab>
      <Tab title="Windows (PowerShell)">
        ```powershell
        & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
        ```
      </Tab>
    </Tabs>

    모든 플래그, 환경 변수, CI/자동화 옵션은 [Installer internals](/install/installer)를 참고하세요.

  </Accordion>

  <Accordion title="npm / pnpm" icon="package">
    이미 Node 22+를 갖추고 있고 설치 과정을 직접 관리하고 싶다면:

    <Tabs>
      <Tab title="npm">
        ```bash
        npm install -g openclaw@latest
        openclaw onboard --install-daemon
        ```

        <Accordion title="sharp build errors?">
          libvips가 전역 설치된 환경(macOS Homebrew에서 흔함)에서 `sharp`가 실패하면 prebuilt binary를 강제하세요.

          ```bash
          SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install -g openclaw@latest
          ```

          `sharp: Please add node-gyp to your dependencies`가 보이면 build tooling을 설치하거나(macOS: Xcode CLT + `npm install -g node-gyp`) 위 환경 변수를 사용하세요.
        </Accordion>
      </Tab>
      <Tab title="pnpm">
        ```bash
        pnpm add -g openclaw@latest
        pnpm approve-builds -g
        openclaw onboard --install-daemon
        ```

        <Note>
        pnpm은 build script가 있는 패키지에 명시적 승인을 요구합니다. 첫 설치에서 "Ignored build scripts" 경고가 나오면 `pnpm approve-builds -g`를 실행해 표시된 패키지를 선택하세요.
        </Note>
      </Tab>
    </Tabs>

  </Accordion>

  <Accordion title="From source" icon="github">
    contributor이거나 로컬 checkout에서 직접 실행하려는 경우에 적합합니다.

    <Steps>
      <Step title="Clone and build">
        [OpenClaw repo](https://github.com/openclaw/openclaw)를 clone한 뒤 빌드합니다.

        ```bash
        git clone https://github.com/openclaw/openclaw.git
        cd openclaw
        pnpm install
        pnpm ui:build
        pnpm build
        ```
      </Step>
      <Step title="Link the CLI">
        `openclaw` 명령을 전역에서 쓸 수 있게 합니다.

        ```bash
        pnpm link --global
        ```

        또는 link하지 않고 저장소 안에서 `pnpm openclaw ...`로 실행해도 됩니다.
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --install-daemon
        ```
      </Step>
    </Steps>

    더 깊은 개발 워크플로는 [Setup](/start/setup)을 참고하세요.

  </Accordion>
</AccordionGroup>

## 다른 설치 방법

<CardGroup cols={2}>
  <Card title="Docker" href="/install/docker" icon="container">
    컨테이너형 또는 headless 배포.
  </Card>
  <Card title="Podman" href="/install/podman" icon="container">
    Rootless 컨테이너. `setup-podman.sh`를 한 번 실행한 뒤 launch script를 사용합니다.
  </Card>
  <Card title="Nix" href="/install/nix" icon="snowflake">
    Nix를 통한 선언적 설치.
  </Card>
  <Card title="Ansible" href="/install/ansible" icon="server">
    자동화된 fleet provisioning.
  </Card>
  <Card title="Bun" href="/install/bun" icon="zap">
    Bun runtime 기반의 CLI 전용 사용.
  </Card>
</CardGroup>

## 설치 후

정상 동작 여부를 확인합니다.

```bash
openclaw doctor         # check for config issues
openclaw status         # gateway status
openclaw dashboard      # open the browser UI
```

커스텀 runtime 경로가 필요하면 다음 환경 변수를 사용하세요.

- `OPENCLAW_HOME`: home-directory 기반 내부 경로
- `OPENCLAW_STATE_DIR`: 가변 상태 저장 위치
- `OPENCLAW_CONFIG_PATH`: config 파일 위치

우선순위와 전체 설명은 [Environment vars](/help/environment)를 참고하세요.

## 문제 해결: `openclaw` not found

<Accordion title="PATH 진단과 수정">
  빠른 진단:

```bash
node -v
npm -v
npm prefix -g
echo "$PATH"
```

`$(npm prefix -g)/bin`(macOS/Linux) 또는 `$(npm prefix -g)`(Windows)이 `$PATH`에 없다면 shell이 전역 npm 바이너리(`openclaw` 포함)를 찾지 못합니다.

해결 방법: shell 시작 파일(`~/.zshrc` 또는 `~/.bashrc`)에 추가하세요.

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

Windows에서는 `npm prefix -g` 출력 경로를 PATH에 추가하세요.

그다음 새 터미널을 열거나 zsh에서는 `rehash`, bash에서는 `hash -r`을 실행하세요.
</Accordion>

## 업데이트 / 제거

<CardGroup cols={3}>
  <Card title="Updating" href="/install/updating" icon="refresh-cw">
    OpenClaw를 최신 상태로 유지합니다.
  </Card>
  <Card title="Migrating" href="/install/migrating" icon="arrow-right">
    새 머신으로 옮깁니다.
  </Card>
  <Card title="Uninstall" href="/install/uninstall" icon="trash-2">
    OpenClaw를 완전히 제거합니다.
  </Card>
</CardGroup>
