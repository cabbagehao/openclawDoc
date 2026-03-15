---
summary: "OpenClaw 설치 가이드: 설치 스크립트, npm/pnpm, 소스 빌드, Docker 등 다양한 방법 안내"
read_when:
  - "'시작하기' 퀵스타트 이외의 대체 설치 방법이 필요할 때"
  - 클라우드 플랫폼에 에이전트를 배포하고자 할 때
  - 업데이트, 마이그레이션 또는 시스템 제거 절차를 확인하고 싶을 때
title: "설치 가이드"
x-i18n:
  source_path: "install/index.md"
---

# 설치 (Install)

이미 [시작하기](/start/getting-started) 과정을 완료했나요? 그렇다면 모든 준비가 끝난 것임. 본 페이지는 대체 설치 방법, 플랫폼별 상세 지침 및 유지보수 관리 방법을 다룸.

## 시스템 요구 사항

- **[Node 22 이상](/install/node)** ([설치 스크립트](#설치-방법) 사용 시 누락된 경우 자동 설치됨)
- macOS, Linux 또는 Windows 환경
- 소스 코드 빌드 시 `pnpm` 필요

<Note>
Windows 사용자의 경우, [WSL2](https://learn.microsoft.com/ko-kr/windows/wsl/install) 환경에서 OpenClaw를 실행할 것을 강력히 권장함.
</Note>

## 설치 방법

<Tip>
**설치 스크립트** 사용을 권장함. Node.js 버전 감지, 설치 및 온보딩 과정을 단일 단계로 간편하게 처리함.
</Tip>

<Warning>
VPS 또는 클라우드 호스트 환경에서는 가급적 서드파티 "원클릭" 마켓플레이스 이미지를 피하기 바람. Ubuntu LTS와 같은 순수 베이스 OS 이미지에서 설치 스크립트를 사용하여 직접 구축하는 것이 가장 안정적임.
</Warning>

<AccordionGroup>
  <Accordion title="설치 스크립트 (권장)" icon="rocket" defaultOpen>
    CLI를 다운로드하여 npm을 통해 전역 설치하고 온보딩 마법사를 실행함.

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

    이것으로 모든 과정이 완료됨. 스크립트가 Node.js 감지부터 설치, 온보딩까지 자동으로 진행함.

    온보딩 마법사를 건너뛰고 바이너리만 즉시 설치하려면:

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

    모든 플래그, 환경 변수 및 CI/자동화 옵션에 대한 상세 내용은 [설치 스크립트 내부 동작](/install/installer)을 참조함.

  </Accordion>

  <Accordion title="패키지 매니저 (npm / pnpm)" icon="package">
    이미 Node 22 이상 버전이 설치되어 있고 설치 과정을 직접 제어하고 싶은 경우임.

    <Tabs>
      <Tab title="npm">
        ```bash
        npm install -g openclaw@latest
        openclaw onboard --install-daemon
        ```

        <Accordion title="sharp 빌드 오류 발생 시">
          macOS Homebrew 환경 등에서 `libvips`가 전역 설치되어 있어 `sharp` 빌드가 실패하는 경우, 사전 빌드된 바이너리 사용을 강제함:

          ```bash
          SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install -g openclaw@latest
          ```

          `sharp: Please add node-gyp to your dependencies` 오류가 보이면 빌드 도구를 설치(macOS: Xcode CLT + `npm install -g node-gyp`)하거나 위 환경 변수를 적용함.
        </Accordion>
      </Tab>
      <Tab title="pnpm">
        ```bash
        pnpm add -g openclaw@latest
        pnpm approve-builds -g        # openclaw, node-llama-cpp, sharp 등 빌드 승인
        openclaw onboard --install-daemon
        ```

        <Note>
        pnpm은 빌드 스크립트가 포함된 패키지에 대해 명시적인 승인이 필요함. 설치 중 "Ignored build scripts" 경고가 나타나면 `pnpm approve-builds -g`를 실행하여 해당 패키지들을 선택함.
        </Note>
      </Tab>
    </Tabs>

  </Accordion>

  <Accordion title="소스 코드 빌드" icon="github">
    기여자 또는 로컬 체크아웃 환경에서 실행하고자 하는 사용자를 위한 방식임.

    <Steps>
      <Step title="클론 및 빌드">
        [OpenClaw 저장소](https://github.com/openclaw/openclaw)를 클론하고 빌드를 수행함:

        ```bash
        git clone https://github.com/openclaw/openclaw.git
        cd openclaw
        pnpm install
        pnpm ui:build
        pnpm build
        ```
      </Step>
      <Step title="CLI 링크">
        `openclaw` 명령어를 시스템 전역에서 사용할 수 있도록 연결함:

        ```bash
        pnpm link --global
        ```

        또는 링크 없이 저장소 내부에서 `pnpm openclaw ...` 형식으로 명령어를 직접 실행할 수도 있음.
      </Step>
      <Step title="온보딩 실행">
        ```bash
        openclaw onboard --install-daemon
        ```
      </Step>
    </Steps>

    심화 개발 워크플로는 [개발 환경 설정](/start/setup) 가이드를 참조함.

  </Accordion>
</AccordionGroup>

## 기타 설치 옵션

<CardGroup cols={2}>
  <Card title="Docker" href="/install/docker" icon="container">
    컨테이너 기반 또는 헤드리스(Headless) 배포 환경용.
  </Card>
  <Card title="Podman" href="/install/podman" icon="container">
    루트리스(Rootless) 컨테이너: `setup-podman.sh` 실행 후 시작 스크립트 활용.
  </Card>
  <Card title="Nix" href="/install/nix" icon="snowflake">
    Nix 패키지 매니저를 통한 선언적 설치.
  </Card>
  <Card title="Ansible" href="/install/ansible" icon="server">
    다수의 인스턴스에 대한 자동화된 프로비저닝.
  </Card>
  <Card title="Bun" href="/install/bun" icon="zap">
    Bun 런타임을 활용한 CLI 전용 사용 환경.
  </Card>
</CardGroup>

## 설치 완료 후 확인 사항

시스템이 정상적으로 작동하는지 검증함:

```bash
openclaw doctor         # 설정 이슈 진단
openclaw status         # Gateway 상태 확인
openclaw dashboard      # 브라우저 제어 UI 열기
```

커스텀 실행 경로가 필요한 경우 다음 환경 변수를 활용함:
- `OPENCLAW_HOME`: 홈 디렉터리 기반 내부 경로 설정.
- `OPENCLAW_STATE_DIR`: 변경 가능한 상태 데이터 저장 위치 지정.
- `OPENCLAW_CONFIG_PATH`: 설정 파일(`openclaw.json`) 경로 지정.

상세 내용은 [환경 변수 레퍼런스](/help/environment)를 참조함.

## 문제 해결: `openclaw` 명령어를 찾을 수 없음

<Accordion title="PATH 환경 변수 진단 및 수정">
  **빠른 진단 방법:**

```bash
node -v
npm -v
npm prefix -g
echo "$PATH"
```

만약 `$(npm prefix -g)/bin`(macOS/Linux) 또는 `$(npm prefix -g)`(Windows) 경로가 `$PATH`에 포함되어 있지 않다면, 셸이 전역 설치된 npm 바이너리(OpenClaw 포함)를 인식하지 못함.

**수정 방법:** 셸 설정 파일(`~/.zshrc` 또는 `~/.bashrc`)에 다음 라인을 추가함:

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

Windows의 경우, 제어판의 시스템 환경 변수 설정에서 `npm prefix -g`의 출력 경로를 PATH 항목에 추가함.

설정 적용 후 새 터미널을 열거나 `rehash`(zsh) / `hash -r`(bash) 명령어로 경로 캐시를 갱신함.
</Accordion>

## 업데이트 및 제거

<CardGroup cols={3}>
  <Card title="업데이트" href="/install/updating" icon="refresh-cw">
    최신 버전 유지 방법.
  </Card>
  <Card title="마이그레이션" href="/install/migrating" icon="arrow-right">
    새로운 장비로 데이터 이동.
  </Card>
  <Card title="시스템 제거" href="/install/uninstall" icon="trash-2">
    OpenClaw 완전 삭제 절차.
  </Card>
</CardGroup>
