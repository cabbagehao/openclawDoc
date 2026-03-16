---
title: "Node.js"
summary: "OpenClaw용 Node.js 설치 및 구성 — 버전 요구 사항, 설치 옵션, PATH 문제 해결"
description: "OpenClaw 설치 전 필요한 Node.js 버전, 설치 방법, PATH와 전역 npm 문제 해결 절차를 안내합니다."
read_when:
  - OpenClaw 설치 전에 Node.js를 설치해야 합니다
  - OpenClaw를 설치했지만 `openclaw` 명령을 찾을 수 없습니다
  - "`npm install -g`가 권한 또는 PATH 문제로 실패합니다"
---

# Node.js

OpenClaw는 **Node 22 이상**이 필요합니다. [설치 스크립트](/install#install-methods)가 Node를 자동으로 감지하고 설치하지만, 이 문서는 Node를 직접 설치하고 버전, PATH, 전역 설치가 올바르게 연결되었는지 점검하려는 경우를 위한 가이드입니다.

## 버전 확인

```bash
node -v
```

출력이 `v22.x.x` 이상이면 괜찮습니다. Node가 설치되지 않았거나 버전이 너무 낮다면 아래 설치 방법 중 하나를 선택하세요.

## Node 설치

<Tabs>
  <Tab title="macOS">
    **Homebrew** (권장):

    ```bash
    brew install node
    ```

    또는 [nodejs.org](https://nodejs.org/)에서 macOS 설치 프로그램을 내려받으세요.

  </Tab>
  <Tab title="Linux">
    **Ubuntu / Debian:**

    ```bash
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt-get install -y nodejs
    ```

    **Fedora / RHEL:**

    ```bash
    sudo dnf install nodejs
    ```

    또는 버전 매니저를 사용하세요(아래 참고).

  </Tab>
  <Tab title="Windows">
    **winget** (권장):

    ```powershell
    winget install OpenJS.NodeJS.LTS
    ```

    **Chocolatey:**

    ```powershell
    choco install nodejs-lts
    ```

    또는 [nodejs.org](https://nodejs.org/)에서 Windows 설치 프로그램을 내려받으세요.

  </Tab>
</Tabs>

<Accordion title="버전 매니저 사용하기 (nvm, fnm, mise, asdf)">
  버전 매니저를 사용하면 Node 버전을 쉽게 전환할 수 있습니다. 대표적인 선택지는 다음과 같습니다.

- [**fnm**](https://github.com/Schniz/fnm) — 빠르고 크로스플랫폼
- [**nvm**](https://github.com/nvm-sh/nvm) — macOS/Linux에서 널리 사용
- [**mise**](https://mise.jdx.dev/) — 다중 언어(Node, Python, Ruby 등) 지원

예시: fnm 사용

```bash
fnm install 22
fnm use 22
```

  <Warning>
  버전 매니저 초기화가 셸 시작 파일(`~/.zshrc` 또는 `~/.bashrc`)에 들어 있는지 확인하세요. 없으면 새 터미널 세션에서 PATH에 Node의 bin 디렉터리가 포함되지 않아 `openclaw`를 찾지 못할 수 있습니다.
  </Warning>
</Accordion>

## 문제 해결

### `openclaw: command not found`

이 문제는 거의 항상 npm의 전역 bin 디렉터리가 PATH에 없다는 뜻입니다.

<Steps>
  <Step title="전역 npm prefix 찾기">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="PATH에 있는지 확인">
    ```bash
    echo "$PATH"
    ```

    출력에서 `<npm-prefix>/bin`(macOS/Linux) 또는 `<npm-prefix>`(Windows)을 찾으세요.

  </Step>
  <Step title="셸 시작 파일에 추가">
    <Tabs>
      <Tab title="macOS / Linux">
        `~/.zshrc` 또는 `~/.bashrc`에 추가하세요:

        ```bash
        export PATH="$(npm prefix -g)/bin:$PATH"
        ```

        그다음 새 터미널을 열거나(zsh는 `rehash`, bash는 `hash -r`) 경로 캐시를 갱신하세요.
      </Tab>
      <Tab title="Windows">
        Settings → System → Environment Variables에서 `npm prefix -g` 출력값을 시스템 PATH에 추가하세요.
      </Tab>
    </Tabs>

  </Step>
</Steps>

### `npm install -g` 권한 오류(Linux)

`EACCES` 오류가 보이면 npm 전역 prefix를 사용자 쓰기 가능 디렉터리로 바꾸세요:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

영구 적용하려면 `export PATH=...` 줄을 `~/.bashrc` 또는 `~/.zshrc`에 추가하세요.
