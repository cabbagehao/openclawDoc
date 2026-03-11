---
summary: "CLI reference for `openclaw daemon` (gateway 서비스 관리용 레거시 별칭)"
read_when:
  - 스크립트에서 여전히 `openclaw daemon ...` 를 사용할 때
  - 서비스 라이프사이클 명령(install/start/stop/restart/status)이 필요할 때
title: "daemon"
---

# `openclaw daemon`

Gateway 서비스 관리 명령용 레거시 별칭입니다.

`openclaw daemon ...` 은 `openclaw gateway ...` 서비스 명령과 동일한 서비스 제어 표면에 매핑됩니다.

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

- `status`: 서비스 설치 상태를 보여 주고 Gateway 상태를 probe
- `install`: 서비스 설치 (`launchd`/`systemd`/`schtasks`)
- `uninstall`: 서비스 제거
- `start`: 서비스 시작
- `stop`: 서비스 중지
- `restart`: 서비스 재시작

## Common options

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- lifecycle (`uninstall|start|stop|restart`): `--json`

메모:

- `status` 는 가능한 경우 probe 인증을 위해 구성된 auth SecretRef 를 해석합니다.
- Linux systemd 설치에서는 `status` 의 token-drift 검사가 `Environment=` 와 `EnvironmentFile=` 유닛 소스를 모두 포함합니다.
- token auth 에 토큰이 필요하고 `gateway.auth.token` 이 SecretRef 로 관리되는 경우, `install` 은 해당 SecretRef 가 해석 가능한지 검증하지만 해석된 토큰을 서비스 환경 메타데이터에 저장하지는 않습니다.
- token auth 에 토큰이 필요하고 구성된 token SecretRef 가 해석되지 않으면 설치는 fail closed 됩니다.
- `gateway.auth.token` 과 `gateway.auth.password` 가 모두 구성되어 있는데 `gateway.auth.mode` 가 설정되지 않으면, mode 를 명시적으로 설정할 때까지 설치가 차단됩니다.

## 권장

최신 문서와 예시는 [`openclaw gateway`](/cli/gateway) 를 사용하세요.
