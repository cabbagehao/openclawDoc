---
summary: "OpenClaw sandboxing의 동작 방식: mode, scope, workspace access, image"
title: Sandboxing
read_when: "sandboxing에 대한 전용 설명이 필요하거나 agents.defaults.sandbox를 조정해야 합니다."
status: active
---

# Sandboxing

OpenClaw는 영향 범위를 줄이기 위해 **Docker container 안에서 tool을 실행**할 수 있습니다.
이 기능은 **선택 사항**이며 설정(`agents.defaults.sandbox` 또는
`agents.list[].sandbox`)으로 제어됩니다. sandboxing이 꺼져 있으면 tool은 host에서 실행됩니다.
Gateway는 host에 남아 있고, 활성화된 경우 tool execution만 격리된 sandbox에서
실행됩니다.

이것이 완벽한 보안 경계는 아니지만, model이 어리석은 동작을 했을 때 filesystem
및 process 접근을 실질적으로 제한합니다.

## What gets sandboxed

- Tool execution (`exec`, `read`, `write`, `edit`, `apply_patch`, `process` 등).
- 선택적 sandboxed browser (`agents.defaults.sandbox.browser`).
  - 기본적으로 sandbox browser는 browser tool이 필요할 때 auto-start되어(CDP가 reachable한지 보장) 실행됩니다.
    `agents.defaults.sandbox.browser.autoStart`와 `agents.defaults.sandbox.browser.autoStartTimeoutMs`로 구성합니다.
  - 기본적으로 sandbox browser container는 전역 `bridge` network 대신 전용 Docker network(`openclaw-sandbox-browser`)를 사용합니다.
    `agents.defaults.sandbox.browser.network`로 구성합니다.
  - 선택적인 `agents.defaults.sandbox.browser.cdpSourceRange`는 CIDR allowlist(예: `172.21.0.1/32`)로 container-edge CDP ingress를 제한합니다.
  - noVNC observer access는 기본적으로 password로 보호되며, OpenClaw는 로컬 bootstrap page를 제공하고 noVNC를 URL fragment 안의 password로 여는 단기 token URL을 출력합니다(query/header log에 남지 않음).
  - `agents.defaults.sandbox.browser.allowHostControl`은 sandboxed session이 host browser를 명시적으로 대상으로 삼을 수 있게 합니다.
  - 선택적 allowlist로 `target: "custom"`을 제어합니다: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

sandbox되지 않는 것:

- Gateway process 자체.
- 명시적으로 host에서 실행되도록 허용된 모든 tool (예: `tools.elevated`).
  - **Elevated exec는 host에서 실행되며 sandboxing을 우회합니다.**
  - sandboxing이 꺼져 있으면 `tools.elevated`는 실행 동작을 바꾸지 않습니다(이미 host에서 실행 중). [Elevated Mode](/tools/elevated)를 참고하세요.

## Modes

`agents.defaults.sandbox.mode`는 sandboxing을 **언제** 사용할지 제어합니다:

- `"off"`: sandboxing 사용 안 함.
- `"non-main"`: **non-main** session에만 sandbox 적용 (일반 chat은 host에서 실행하고 싶을 때 기본값).
- `"all"`: 모든 session이 sandbox에서 실행됨.
  참고: `"non-main"`은 agent id가 아니라 `session.mainKey`(기본값 `"main"`)를 기준으로 합니다.
  group/channel session은 자체 key를 사용하므로 non-main으로 간주되어 sandbox됩니다.

## Scope

`agents.defaults.sandbox.scope`는 container를 **몇 개** 만들지 제어합니다:

- `"session"` (기본값): session당 하나의 container.
- `"agent"`: agent당 하나의 container.
- `"shared"`: 모든 sandboxed session이 하나의 container를 공유.

## Workspace access

`agents.defaults.sandbox.workspaceAccess`는 sandbox가 **무엇을 볼 수 있는지** 제어합니다:

- `"none"` (기본값): tool은 `~/.openclaw/sandboxes` 아래의 sandbox workspace를 봅니다.
- `"ro"`: agent workspace를 `/agent`에 read-only로 mount합니다 (`write`/`edit`/`apply_patch` 비활성화).
- `"rw"`: agent workspace를 `/workspace`에 read/write로 mount합니다.

인바운드 media는 활성 sandbox workspace(`media/inbound/*`)로 복사됩니다.
Skills 참고: `read` tool은 sandbox root 기준입니다. `workspaceAccess: "none"`이면,
OpenClaw는 읽을 수 있도록 적합한 skill을 sandbox workspace(`.../skills`)에 mirror합니다.
`"rw"`일 때는 workspace skill을 `/workspace/skills`에서 읽을 수 있습니다.

## Custom bind mounts

`agents.defaults.sandbox.docker.binds`는 추가 host 디렉터리를 container에 mount합니다.
형식: `host:container:mode` (예: `"/home/user/source:/source:rw"`).

전역 bind와 agent별 bind는 **교체되지 않고 병합됩니다**. `scope: "shared"`에서는 agent별 bind가 무시됩니다.

`agents.defaults.sandbox.browser.binds`는 추가 host 디렉터리를 **sandbox browser** container에만 mount합니다.

- 설정되면(`[]` 포함) browser container에 대해 `agents.defaults.sandbox.docker.binds`를 대체합니다.
- 생략되면 browser container는 `agents.defaults.sandbox.docker.binds`를 fallback으로 사용합니다(하위 호환).

예시 (read-only source + 추가 data 디렉터리 하나):

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

- bind는 sandbox filesystem을 우회합니다. 설정한 mode(`:ro` 또는 `:rw`) 그대로 host path를 노출합니다.
- OpenClaw는 위험한 bind source를 차단합니다(예: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev`, 그리고 이를 노출하는 상위 mount).
- 민감한 mount(secret, SSH key, service credential)는 절대적으로 필요하지 않다면 `:ro`여야 합니다.
- workspace에 read access만 필요하다면 `workspaceAccess: "ro"`와 함께 사용하세요. bind mode는 독립적으로 유지됩니다.
- bind와 tool policy, elevated exec의 상호작용은 [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated)를 참고하세요.

## Images + setup

기본 image: `openclaw-sandbox:bookworm-slim`

한 번만 빌드하세요:

```bash
scripts/sandbox-setup.sh
```

참고: 기본 image에는 **Node가 포함되지 않습니다**. skill에 Node(또는
다른 runtime)가 필요하다면, custom image에 bake하거나
`sandbox.docker.setupCommand`로 설치하세요(network egress + writable root +
root user 필요).

더 기능이 많은 sandbox image가 필요하다면(예: `curl`, `jq`, `nodejs`, `python3`, `git`),
다음을 빌드하세요:

```bash
scripts/sandbox-common-setup.sh
```

그런 다음 `agents.defaults.sandbox.docker.image`를
`openclaw-sandbox-common:bookworm-slim`으로 설정하세요.

Sandboxed browser image:

```bash
scripts/sandbox-browser-setup.sh
```

기본적으로 sandbox container는 **network 없이** 실행됩니다.
`agents.defaults.sandbox.docker.network`로 재정의할 수 있습니다.

번들된 sandbox browser image는 container workload를 위한 보수적인 Chromium startup default도 적용합니다.
현재 container 기본값은 다음과 같습니다:

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
- `noSandbox`가 활성화되면 `--no-sandbox`와 `--disable-setuid-sandbox`.
- 세 가지 graphics hardening flag(`--disable-3d-apis`,
  `--disable-software-rasterizer`, `--disable-gpu`)는 선택 사항이며
  container에 GPU 지원이 없을 때 유용합니다. workload에 WebGL 또는 기타 3D/browser 기능이 필요하다면
  `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`을 설정하세요.
- `--disable-extensions`는 기본적으로 활성화되어 있으며
  extension 의존 flow에서는 `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0`으로 비활성화할 수 있습니다.
- `--renderer-process-limit=2`는
  `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`으로 제어하며, `0`이면 Chromium 기본값을 유지합니다.

다른 runtime profile이 필요하면 custom browser image를 사용하고
자체 entrypoint를 제공하세요. 로컬(non-container) Chromium profile에서는
추가 startup flag를 붙이기 위해 `browser.extraArgs`를 사용하세요.

보안 기본값:

- `network: "host"`는 차단됩니다.
- `network: "container:<id>"`는 기본적으로 차단됩니다(namespace join 우회 위험).
- 긴급 override: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

Docker 설치 및 containerized gateway 관련 내용은 여기 있습니다:
[Docker](/install/docker)

Docker gateway 배포에서는 `docker-setup.sh`가 sandbox config를 bootstrap할 수 있습니다.
이 경로를 활성화하려면 `OPENCLAW_SANDBOX=1`(또는 `true`/`yes`/`on`)을 설정하세요.
socket 위치는 `OPENCLAW_DOCKER_SOCKET`으로 재정의할 수 있습니다. 전체 setup 및 env
참고: [Docker](/install/docker#enable-agent-sandbox-for-docker-gateway-opt-in).

## setupCommand (one-time container setup)

`setupCommand`는 sandbox container가 생성된 **후 한 번만** 실행됩니다(매 실행마다가 아님).
container 내부에서 `sh -lc`를 통해 실행됩니다.

경로:

- 전역: `agents.defaults.sandbox.docker.setupCommand`
- agent별: `agents.list[].sandbox.docker.setupCommand`

흔한 문제:

- 기본 `docker.network`는 `"none"`(egress 없음)이므로 package install이 실패합니다.
- `docker.network: "container:<id>"`는 `dangerouslyAllowContainerNamespaceJoin: true`가 필요하며 break-glass 전용입니다.
- `readOnlyRoot: true`면 쓰기가 막힙니다. `readOnlyRoot: false`로 설정하거나 custom image에 bake하세요.
- package install을 하려면 `user`가 root여야 합니다(`user`를 생략하거나 `user: "0:0"` 설정).
- Sandbox exec는 host `process.env`를 상속하지 **않습니다**.
  skill API key는 `agents.defaults.sandbox.docker.env`(또는 custom image)를 사용하세요.

## Tool policy + escape hatches

tool allow/deny policy는 sandbox rule보다 먼저 계속 적용됩니다. tool이 전역 또는 agent별로
deny되어 있다면 sandboxing이 그것을 되살리지는 않습니다.

`tools.elevated`는 host에서 `exec`를 실행하는 명시적 escape hatch입니다.
`/exec` directive는 승인된 sender에만 적용되고 session별로 유지됩니다. `exec`를 완전히 비활성화하려면
tool policy deny를 사용하세요([Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated) 참고).

디버깅:

- 유효한 sandbox mode, tool policy, fix-it config key를 확인하려면 `openclaw sandbox explain`을 사용하세요.
- “왜 이게 차단되지?”를 이해하는 모델은 [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated)를 참고하세요.
  잠금을 유지하세요.

## Multi-agent overrides

각 agent는 sandbox + tool을 override할 수 있습니다:
`agents.list[].sandbox` 및 `agents.list[].tools` (`sandbox tool policy`용 `agents.list[].tools.sandbox.tools` 포함).
우선순위는 [Multi-Agent Sandbox & Tools](/tools/multi-agent-sandbox-tools)를 참고하세요.

## Minimal enable example

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

## Related docs

- [Sandbox Configuration](/gateway/configuration#agentsdefaults-sandbox)
- [Multi-Agent Sandbox & Tools](/tools/multi-agent-sandbox-tools)
- [Security](/gateway/security)
