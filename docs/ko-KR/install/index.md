---
summary: "OpenClaw 설치하기 — 설치 스크립트, npm/pnpm, 소스 빌드, Docker 등"
read_when:
  - Getting Started 빠른 시작 외의 설치 방법이 필요합니다
  - 클라우드 플랫폼에 배포하려고 합니다
  - 업데이트, 마이그레이션, 제거가 필요합니다
title: "설치"
---

# 설치

이미 [Getting Started](/start/getting-started)를 따라 하셨나요? 그렇다면 준비는 끝났습니다. 이 페이지는 대체 설치 방법, 플랫폼별 안내, 유지보수 정보를 다룹니다.

## 시스템 요구 사항

- **[Node 22+](/install/node)** (`[설치 스크립트](#install-methods)`는 없으면 자동으로 설치합니다)
- macOS, Linux, 또는 Windows
- 소스에서 빌드할 때만 `pnpm` 필요

<Note>
Windows에서는 OpenClaw를 [WSL2](https://learn.microsoft.com/en-us/windows/wsl/install)에서 실행하는 것을 강력히 권장합니다.
</Note>

## 설치 방법

<Tip>
**설치 스크립트**가 OpenClaw 설치 권장 방식입니다. Node 감지, 설치, 온보딩을 한 번에 처리합니다.
</Tip>

<Warning>
VPS/클라우드 호스트에서는 가능하면 서드파티 "원클릭" 마켓플레이스 이미지를 피하세요. Ubuntu LTS 같은 깨끗한 베이스 OS 이미지를 사용한 뒤, 설치 스크립트로 직접 OpenClaw를 설치하는 편이 좋습니다.
</Warning>

<AccordionGroup>
  <Accordion title="설치 스크립트" icon="rocket" defaultOpen>
    CLI를 내려받아 npm으로 전역 설치하고, 온보딩 마법사를 실행합니다.

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

    여기까지면 충분합니다. 스크립트가 Node 감지, 설치, 온보딩을 처리합니다.

    온보딩은 건너뛰고 바이너리만 설치하려면:

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

    모든 플래그, 환경 변수, CI/자동화 옵션은 [설치 스크립트 내부 동작](/install/installer)을 참고하세요.

  </Accordion>

  <Accordion title="npm / pnpm" icon="package">
    이미 Node 22+가 있고 설치를 직접 관리하고 싶다면:

    <Tabs>
      <Tab title="npm">
        ```bash
        npm install -g openclaw@latest
        openclaw onboard --install-daemon
        ```

        <Accordion title="sharp 빌드 오류가 나나요?">
          전역으로 libvips가 설치되어 있고(macOS Homebrew 환경에서 흔합니다) `sharp`가 실패하면, 사전 빌드 바이너리를 강제하세요:

          ```bash
          SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install -g openclaw@latest
          ```

          `sharp: Please add node-gyp to your dependencies`가 보이면, 빌드 도구를 설치하거나(macOS: Xcode CLT + `npm install -g node-gyp`) 위 환경 변수를 사용하세요.
        </Accordion>
      </Tab>
      <Tab title="pnpm">
        ```bash
        pnpm add -g openclaw@latest
        pnpm approve-builds -g        # approve openclaw, node-llama-cpp, sharp, etc.
        openclaw onboard --install-daemon
        ```

        <Note>
        pnpm은 빌드 스크립트가 있는 패키지에 대해 명시적 승인을 요구합니다. 첫 설치에서 "Ignored build scripts" 경고가 나오면 `pnpm approve-builds -g`를 실행해 목록에 나온 패키지를 선택하세요.
        </Note>
      </Tab>
    </Tabs>

  </Accordion>

  <Accordion title="소스에서 설치" icon="github">
    기여자나 로컬 체크아웃에서 실행하고 싶은 사용자를 위한 방식입니다.

    <Steps>
      <Step title="클론하고 빌드하기">
        [OpenClaw 저장소](https://github.com/openclaw/openclaw)를 클론한 뒤 빌드하세요:

        ```bash
        git clone https://github.com/openclaw/openclaw.git
        cd openclaw
        pnpm install
        pnpm ui:build
        pnpm build
        ```
      </Step>
      <Step title="CLI 링크하기">
        `openclaw` 명령을 전역에서 사용할 수 있게 만듭니다:

        ```bash
        pnpm link --global
        ```

        또는 링크를 생략하고 저장소 안에서 `pnpm openclaw ...`로 명령을 실행해도 됩니다.
      </Step>
      <Step title="온보딩 실행">
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
    컨테이너 기반 또는 헤드리스 배포.
  </Card>
  <Card title="Podman" href="/install/podman" icon="container">
    루트리스 컨테이너: `setup-podman.sh`를 한 번 실행한 뒤, 시작 스크립트를 사용합니다.
  </Card>
  <Card title="Nix" href="/install/nix" icon="snowflake">
    Nix를 통한 선언적 설치.
  </Card>
  <Card title="Ansible" href="/install/ansible" icon="server">
    자동화된 대규모 프로비저닝.
  </Card>
  <Card title="Bun" href="/install/bun" icon="zap">
    Bun 런타임을 이용한 CLI 전용 사용.
  </Card>
</CardGroup>

## 설치 후

정상 동작을 확인하세요:

```bash
openclaw doctor         # check for config issues
openclaw status         # gateway status
openclaw dashboard      # open the browser UI
```

사용자 정의 런타임 경로가 필요하면 다음을 사용하세요:

- 홈 디렉터리 기반 내부 경로용 `OPENCLAW_HOME`
- 변경 가능한 상태 저장 위치용 `OPENCLAW_STATE_DIR`
- 설정 파일 경로용 `OPENCLAW_CONFIG_PATH`

우선순위와 전체 설명은 [환경 변수](/help/environment)를 참고하세요.

## 문제 해결: `openclaw`를 찾을 수 없음

<Accordion title="PATH 진단과 수정">
  빠른 진단:

```bash
node -v
npm -v
npm prefix -g
echo "$PATH"
```

`$(npm prefix -g)/bin`(macOS/Linux) 또는 `$(npm prefix -g)`(Windows)이 `$PATH`에 **없다면**, 셸이 전역 npm 바이너리(`openclaw` 포함)를 찾을 수 없습니다.

수정 방법: 셸 시작 파일(`~/.zshrc` 또는 `~/.bashrc`)에 다음을 추가하세요.

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

Windows에서는 `npm prefix -g` 출력값을 PATH에 추가하세요.

그다음 새 터미널을 열거나(zsh는 `rehash`, bash는 `hash -r`) 경로 캐시를 갱신하세요.
</Accordion>

## 업데이트 / 제거

<CardGroup cols={3}>
  <Card title="업데이트" href="/install/updating" icon="refresh-cw">
    OpenClaw를 최신 상태로 유지합니다.
  </Card>
  <Card title="마이그레이션" href="/install/migrating" icon="arrow-right">
    새 장비로 이동합니다.
  </Card>
  <Card title="제거" href="/install/uninstall" icon="trash-2">
    OpenClaw를 완전히 제거합니다.
  </Card>
</CardGroup>
