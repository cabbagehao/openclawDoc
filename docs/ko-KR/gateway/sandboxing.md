---
title: Sandboxing
description: OpenClaw 샌드박싱의 모드, 범위, workspaceAccess, bind mounts, 이미지와 setupCommand 설정을 설명합니다.
summary: "OpenClaw 샌드박싱 동작 방식: modes, scopes, workspace access, images"
read_when: "샌드박싱 자체를 따로 이해하고 싶거나 `agents.defaults.sandbox`를 조정해야 할 때"
status: active
x-i18n:
  source_path: "gateway/sandboxing.md"
---

# Sandboxing

OpenClaw는 영향 범위를 줄이기 위해 **Docker 컨테이너 안에서 도구를 실행**할 수 있습니다.
이 기능은 **선택 사항**이며 설정(`agents.defaults.sandbox` 또는 `agents.list[].sandbox`)으로 제어합니다.
샌드박싱이 꺼져 있으면 도구는 호스트에서 실행됩니다.
Gateway 프로세스 자체는 호스트에 남고, 활성화된 경우 도구 실행만 격리된 샌드박스에서 수행됩니다.

이것이 완벽한 보안 경계는 아니지만, 모델이 잘못된 행동을 했을 때 파일시스템과 프로세스 접근을 실질적으로 제한합니다.

## 무엇이 샌드박싱되는가

- 도구 실행 (`exec`, `read`, `write`, `edit`, `apply_patch`, `process` 등)
- 선택적인 sandboxed browser (`agents.defaults.sandbox.browser`)
  - 기본적으로 브라우저 도구가 필요할 때 sandbox browser가 자동 시작되어 CDP가 닿을 수 있게 합니다.
    `agents.defaults.sandbox.browser.autoStart`, `agents.defaults.sandbox.browser.autoStartTimeoutMs`로 설정합니다.
  - 기본적으로 sandbox browser 컨테이너는 전역 `bridge` 대신 전용 Docker network(`openclaw-sandbox-browser`)를 사용합니다.
    `agents.defaults.sandbox.browser.network`로 조정합니다.
  - 선택적인 `agents.defaults.sandbox.browser.cdpSourceRange`는 container-edge CDP ingress를 CIDR allowlist(예: `172.21.0.1/32`)로 제한합니다.
  - noVNC observer access는 기본적으로 비밀번호로 보호되며, OpenClaw는 로컬 bootstrap 페이지용 단기 token URL을 발급하고 URL fragment에 비밀번호를 담아 noVNC를 엽니다. query/header 로그에는 남지 않습니다.
  - `agents.defaults.sandbox.browser.allowHostControl`을 켜면 sandboxed session이 호스트 브라우저를 명시적으로 대상으로 삼을 수 있습니다.
  - `target: "custom"`에는 선택적 allowlist인 `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`가 적용됩니다.

샌드박싱되지 않는 것:

- Gateway 프로세스 자체
- 명시적으로 호스트 실행이 허용된 도구(예: `tools.elevated`)
  - **Elevated exec는 호스트에서 실행되며 샌드박싱을 우회합니다.**
  - 샌드박싱이 꺼져 있으면 `tools.elevated`는 실행 위치를 바꾸지 않습니다. 이미 호스트이기 때문입니다. [Elevated Mode](/tools/elevated)를 참고하세요.

## Modes

`agents.defaults.sandbox.mode`는 **언제** 샌드박싱을 사용할지 결정합니다.

- `"off"`: 샌드박싱 안 함
- `"non-main"`: **non-main** 세션만 샌드박싱. 일반 채팅은 호스트에서 유지하고 싶을 때 기본값으로 많이 씁니다.
- `"all"`: 모든 세션을 샌드박스에서 실행

참고:
`"non-main"` 판정은 agent id가 아니라 `session.mainKey`(기본값 `"main"`)를 기준으로 합니다.
group/channel session은 자체 키를 쓰므로 non-main으로 간주되어 샌드박싱됩니다.

## Scope

`agents.defaults.sandbox.scope`는 **몇 개의 컨테이너를 만들지**를 결정합니다.

- `"session"` (기본값): 세션당 컨테이너 1개
- `"agent"`: agent당 컨테이너 1개
- `"shared"`: 모든 sandboxed session이 컨테이너 1개를 공유

## Workspace access

`agents.defaults.sandbox.workspaceAccess`는 **샌드박스가 어떤 워크스페이스를 볼 수 있는지**를 결정합니다.

- `"none"` (기본값): 도구는 `~/.openclaw/sandboxes` 아래의 sandbox workspace만 봅니다.
- `"ro"`: agent workspace를 `/agent`에 읽기 전용으로 마운트합니다. (`write` / `edit` / `apply_patch` 비활성화)
- `"rw"`: agent workspace를 `/workspace`에 읽기/쓰기 가능하게 마운트합니다.

인바운드 미디어는 활성 샌드박스 workspace(`media/inbound/*`)로 복사됩니다.

Skill 참고:
`read` 도구는 샌드박스 루트를 기준으로 동작합니다.
`workspaceAccess: "none"`이면 OpenClaw가 읽을 수 있는 skill을 sandbox workspace(`.../skills`)로 미러링합니다.
`"rw"`이면 workspace skill을 `/workspace/skills`에서 읽을 수 있습니다.

## Custom bind mounts

`agents.defaults.sandbox.docker.binds`는 추가 호스트 디렉터리를 컨테이너에 마운트합니다.
형식은 `host:container:mode`입니다. 예: `"/home/user/source:/source:rw"`.

전역 bind와 agent별 bind는 **대체가 아니라 병합**됩니다.
`scope: "shared"`일 때는 agent별 bind가 무시됩니다.

`agents.defaults.sandbox.browser.binds`는 **sandbox browser** 컨테이너에만 추가 host 디렉터리를 마운트합니다.

- 값이 설정되면(`[]` 포함) 브라우저 컨테이너에서는 `agents.defaults.sandbox.docker.binds`를 대체합니다.
- 생략되면 브라우저 컨테이너는 이전 호환성을 위해 `agents.defaults.sandbox.docker.binds`를 fallback으로 사용합니다.

예시(읽기 전용 source + 추가 data directory):

```json5
{
  agents: {
    defaults: {
      sandbox: {
        docker: {
          binds: ["/home/user/source:/source:ro", "/var/data/myapp:/data:ro"],
        },
      },
    },
    list: [
      {
        id: "build",
        sandbox: {
          docker: {
            binds: ["/mnt/cache:/cache:rw"],
          },
        },
      },
    ],
  },
}
```

보안 참고:

- bind는 샌드박스 파일시스템을 우회합니다. 지정한 모드(`:ro` 또는 `:rw`) 그대로 호스트 경로가 노출됩니다.
- OpenClaw는 위험한 bind source(`docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` 및 이를 노출하는 상위 mount)를 차단합니다.
- secrets, SSH keys, service credentials 같은 민감 mount는 꼭 필요한 경우가 아니면 `:ro`를 사용하세요.
- workspace 읽기만 필요하다면 `workspaceAccess: "ro"`와 함께 쓰세요. bind 모드는 여전히 별도로 적용됩니다.
- bind와 tool policy, elevated exec의 관계는 [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated)를 참고하세요.

## Images + setup

기본 이미지: `openclaw-sandbox:bookworm-slim`

한 번만 빌드하면 됩니다.

```bash
scripts/sandbox-setup.sh
```

참고:
기본 이미지에는 Node가 포함되어 있지 않습니다.
skill에 Node나 다른 런타임이 필요하다면 custom image를 굽거나 `sandbox.docker.setupCommand`로 설치하세요.
이 경우 network egress, writable root, root user가 필요합니다.

`curl`, `jq`, `nodejs`, `python3`, `git` 같은 일반 도구가 들어 있는 더 실용적인 이미지가 필요하다면 다음을 빌드하세요.

```bash
scripts/sandbox-common-setup.sh
```

그리고 `agents.defaults.sandbox.docker.image`를 `openclaw-sandbox-common:bookworm-slim`으로 설정합니다.

sandboxed browser 이미지:

```bash
scripts/sandbox-browser-setup.sh
```

기본적으로 sandbox 컨테이너는 **네트워크 없이** 실행됩니다.
`agents.defaults.sandbox.docker.network`로 덮어쓸 수 있습니다.

번들된 sandbox browser 이미지는 컨테이너 환경에 맞춘 보수적인 Chromium 시작 기본값도 함께 적용합니다.
현재 기본값은 다음과 같습니다.

- `--remote-debugging-address=127.0.0.1`
- `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
- `--user-data-dir=${HOME}/.chrome`
- `--no-first-run`
- `--no-default-browser-check`
- `--disable-3d-apis`
- `--disable-gpu`
- `--disable-dev-shm-usage`
- `--disable-background-networking`
- `--disable-extensions`
- `--disable-features=TranslateUI`
- `--disable-breakpad`
- `--disable-crash-reporter`
- `--disable-software-rasterizer`
- `--no-zygote`
- `--metrics-recording-only`
- `--renderer-process-limit=2`
- `noSandbox`가 켜져 있을 때 `--no-sandbox`, `--disable-setuid-sandbox`
- 세 개의 graphics hardening flag(`--disable-3d-apis`, `--disable-software-rasterizer`, `--disable-gpu`)는 선택 사항입니다. 컨테이너에 GPU 지원이 없을 때 유용합니다. WebGL이나 3D 기능이 필요하다면 `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`으로 끄세요.
- `--disable-extensions`는 기본적으로 켜져 있으며, 확장 프로그램이 필요한 경우 `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0`으로 끌 수 있습니다.
- `--renderer-process-limit=2`는 `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`으로 제어합니다. `0`이면 Chromium 기본값을 유지합니다.

다른 런타임 프로필이 필요하다면 custom browser image를 만들고 자체 entrypoint를 제공하세요.
로컬(non-container) Chromium 프로필은 `browser.extraArgs`로 추가 시작 플래그를 붙일 수 있습니다.

보안 기본값:

- `network: "host"`는 차단됩니다.
- `network: "container:<id>"`도 기본적으로 차단됩니다. namespace join 우회 위험이 있기 때문입니다.
- break-glass override: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`

Docker 설치와 containerized gateway 관련 문서는 [Docker](/install/docker)를 참고하세요.

Docker gateway 배포에서는 `docker-setup.sh`가 sandbox config를 bootstrap할 수 있습니다.
이 경로를 켜려면 `OPENCLAW_SANDBOX=1`(또는 `true` / `yes` / `on`)을 설정하세요.
socket 위치는 `OPENCLAW_DOCKER_SOCKET`으로 덮어쓸 수 있습니다.
전체 설정과 환경 변수는 [Docker](/install/docker#enable-agent-sandbox-for-docker-gateway-opt-in)를 참고하세요.

## setupCommand (1회성 컨테이너 설정)

`setupCommand`는 샌드박스 컨테이너가 생성된 직후 **한 번만** 실행됩니다. 매 실행마다 반복되지 않습니다.
컨테이너 안에서 `sh -lc`로 실행됩니다.

경로:

- 전역: `agents.defaults.sandbox.docker.setupCommand`
- agent별: `agents.list[].sandbox.docker.setupCommand`

흔한 함정:

- 기본 `docker.network`는 `"none"`이라 패키지 설치가 실패합니다.
- `docker.network: "container:<id>"`는 `dangerouslyAllowContainerNamespaceJoin: true`가 있어야 하며 break-glass 전용입니다.
- `readOnlyRoot: true`이면 쓰기가 막힙니다. `readOnlyRoot: false`로 바꾸거나 custom image를 쓰세요.
- 패키지 설치는 root user가 필요합니다. `user`를 생략하거나 `user: "0:0"`을 사용하세요.
- sandbox exec는 호스트 `process.env`를 상속하지 않습니다. skill API key는 `agents.defaults.sandbox.docker.env` 또는 custom image로 전달해야 합니다.

## Tool policy + escape hatches

샌드박스 규칙보다 tool allow/deny policy가 먼저 적용됩니다.
전역 또는 agent별로 도구가 차단되어 있으면 샌드박싱이 그것을 되살려 주지 않습니다.

`tools.elevated`는 `exec`를 호스트에서 실행하는 명시적 탈출구입니다.
`/exec` 지시문은 권한 있는 발신자에게만 적용되며 세션별로 유지됩니다.
`exec`를 확실히 끄려면 tool policy deny를 사용하세요.
자세한 구분은 [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated)를 참고하세요.

디버깅:

- `openclaw sandbox explain`으로 실제 sandbox mode, tool policy, fix-it config key를 확인하세요.
- "왜 막히는가?"를 빠르게 판단하려면 [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated)를 참고하세요.

## Multi-agent overrides

각 agent는 sandbox와 tools를 개별 override할 수 있습니다.
경로는 `agents.list[].sandbox`, `agents.list[].tools`, 그리고 sandbox tool policy용 `agents.list[].tools.sandbox.tools`입니다.
우선순위는 [Multi-Agent Sandbox & Tools](/tools/multi-agent-sandbox-tools)를 참고하세요.

## 최소 활성화 예시

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        scope: "session",
        workspaceAccess: "none",
      },
    },
  },
}
```

## 관련 문서

- [Sandbox Configuration](/gateway/configuration#agentsdefaults-sandbox)
- [Multi-Agent Sandbox & Tools](/tools/multi-agent-sandbox-tools)
- [Security](/gateway/security)
