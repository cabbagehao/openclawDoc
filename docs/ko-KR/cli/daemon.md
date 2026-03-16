---
summary: "CLI reference for `openclaw daemon` (legacy alias for gateway service management)"
description: "openclaw daemon 레거시 alias가 Gateway service 명령에 어떻게 매핑되는지 설명합니다."
read_when:
  - 오래된 스크립트에서 openclaw daemon 명령을 유지할 때
  - Gateway service 명령 흐름을 확인할 때
title: "daemon"
x-i18n:
  source_path: 'cli/daemon.md'
---

# `openclaw daemon`

Gateway service management command의 legacy alias입니다.

`openclaw daemon ...`은 `openclaw gateway ...` service command와 같은 control surface에 매핑됩니다.

## Usage

```bash
openclaw daemon status
openclaw daemon install
openclaw daemon start
openclaw daemon stop
openclaw daemon restart
openclaw daemon uninstall
```

## Subcommands

- `status`: service install state를 보여주고 Gateway health를 probe
- `install`: service 설치 (`launchd`/`systemd`/`schtasks`)
- `uninstall`: service 제거
- `start`: service 시작
- `stop`: service 중지
- `restart`: service 재시작

## Common options

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- lifecycle (`uninstall|start|stop|restart`): `--json`

Notes:

- `status`는 가능하면 probe auth를 위해 configured auth SecretRef를 resolve합니다.
- Linux systemd install에서는 `status`의 token drift check가 `Environment=`와 `EnvironmentFile=` unit source를 모두 포함합니다.
- token auth에 token이 필요하고 `gateway.auth.token`이 SecretRef-managed이면, `install`은 SecretRef가 resolvable한지 검증하지만 resolved token 자체를 service environment metadata에 저장하지는 않습니다.
- token auth에 token이 필요한데 configured token SecretRef가 unresolved라면 install은 fail closed합니다.
- `gateway.auth.token`과 `gateway.auth.password`가 모두 설정되어 있고 `gateway.auth.mode`가 unset이면, install은 mode를 명시할 때까지 차단됩니다.

## Prefer

현재 문서와 예시는 [`openclaw gateway`](/cli/gateway)를 사용하는 편이 좋습니다.
