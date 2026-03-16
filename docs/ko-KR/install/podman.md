---
title: Podman
description: rootless Podman으로 OpenClaw Gateway를 실행하고 Quadlet 서비스와 영구 스토리지를 구성하는 가이드
summary: rootless Podman 컨테이너에서 OpenClaw Gateway를 실행하는 가이드
read_when:
  - Docker 대신 Podman으로 컨테이너형 Gateway를 운영하고 싶을 때
x-i18n:
  source_path: install/podman.md
---

# Podman

**rootless** Podman 컨테이너에서 OpenClaw Gateway를 실행합니다. Docker와 같은 이미지를 사용하며, 저장소의 [Dockerfile](https://github.com/openclaw/openclaw/blob/main/Dockerfile)에서 빌드합니다.

## 준비 사항

- Podman(rootless)
- 일회성 초기 설정을 위한 `sudo` 권한(사용자 생성, 이미지 빌드)

## 빠른 시작

**1. 일회성 설정**(저장소 루트에서 실행, 사용자 생성/이미지 빌드/launch script 설치):

```bash
./setup-podman.sh
```

이 명령은 최소 구성의 `~openclaw/.openclaw/openclaw.json`도 함께 만들어 `gateway.mode="local"`을 설정합니다. 그래서 wizard를 따로 실행하지 않아도 gateway를 시작할 수 있습니다.

기본값으로는 컨테이너를 systemd service로 설치하지 않고 직접 시작합니다. 부팅 시 자동 시작과 재시작까지 포함한 운영형 구성이 필요하면 systemd Quadlet user service로 설치하세요.

```bash
./setup-podman.sh --quadlet
```

또는 `OPENCLAW_PODMAN_QUADLET=1`을 사용할 수 있습니다. `--container`는 컨테이너와 launch script만 설치합니다.

`setup-podman.sh` 실행 전 설정할 수 있는 빌드 시점 환경 변수:

- `OPENCLAW_DOCKER_APT_PACKAGES` - 이미지 빌드 중 추가 apt 패키지 설치
- `OPENCLAW_EXTENSIONS` - extension 의존성 사전 설치(공백으로 구분, 예: `diagnostics-otel matrix`)

**2. Gateway 시작**(빠른 smoke test용 수동 실행):

```bash
./scripts/run-openclaw-podman.sh launch
```

**3. 온보딩 wizard**(예: channel 또는 provider 추가):

```bash
./scripts/run-openclaw-podman.sh launch setup
```

그다음 `http://127.0.0.1:18789/`를 열고 `~openclaw/.openclaw/.env`의 token 또는 setup 중 출력된 token을 사용하세요.

## systemd(Quadlet, 선택 사항)

`./setup-podman.sh --quadlet` 또는 `OPENCLAW_PODMAN_QUADLET=1`을 사용하면 [Podman Quadlet](https://docs.podman.io/en/latest/markdown/podman-systemd.unit.5.html) unit이 설치되어, openclaw 사용자의 systemd user service로 gateway가 실행됩니다. setup 마지막에 서비스가 활성화되고 시작됩니다.

- **시작:** `sudo systemctl --machine openclaw@ --user start openclaw.service`
- **중지:** `sudo systemctl --machine openclaw@ --user stop openclaw.service`
- **상태:** `sudo systemctl --machine openclaw@ --user status openclaw.service`
- **로그:** `sudo journalctl --machine openclaw@ --user -u openclaw.service -f`

quadlet 파일은 `~openclaw/.config/containers/systemd/openclaw.container`에 있습니다. 포트나 env를 바꾸려면 그 파일 또는 이 파일이 참조하는 `.env`를 수정한 뒤 `sudo systemctl --machine openclaw@ --user daemon-reload`를 실행하고 서비스를 다시 시작하세요. boot 시 자동 시작은 openclaw 사용자에 lingering이 켜져 있을 때 동작하며, `loginctl`을 쓸 수 있으면 setup이 이를 설정합니다.

초기 setup에서 quadlet을 사용하지 않았고 나중에 추가하고 싶다면 다음을 다시 실행하세요.

```bash
./setup-podman.sh --quadlet
```

## `openclaw` 사용자(비로그인)

`setup-podman.sh`는 전용 시스템 사용자 `openclaw`를 생성합니다.

- **Shell:** `nologin` - 대화형 로그인 비허용으로 공격 표면 축소
- **Home:** 예: `/home/openclaw` - `~/.openclaw`(config, workspace)와 `run-openclaw-podman.sh` 저장
- **Rootless Podman:** 이 사용자에는 **subuid**와 **subgid** 범위가 필요합니다. 많은 배포판에서는 사용자 생성 시 자동 할당되지만, setup이 경고를 표시하면 `/etc/subuid`와 `/etc/subgid`에 다음 줄을 추가하세요.

  ```text
  openclaw:100000:65536
  ```

  그다음 해당 사용자로 gateway를 시작합니다. 예를 들어 cron 또는 systemd에서:

  ```bash
  sudo -u openclaw /home/openclaw/run-openclaw-podman.sh
  sudo -u openclaw /home/openclaw/run-openclaw-podman.sh setup
  ```

- **Config:** `/home/openclaw/.openclaw`에는 `openclaw`와 root만 접근할 수 있습니다. config를 수정하려면 gateway가 실행 중일 때 Control UI를 사용하거나 `sudo -u openclaw $EDITOR /home/openclaw/.openclaw/openclaw.json`을 실행하세요.

## 환경 변수와 config

- **Token:** `~openclaw/.openclaw/.env`에 `OPENCLAW_GATEWAY_TOKEN`으로 저장됩니다. `setup-podman.sh`와 `run-openclaw-podman.sh`는 token이 없으면 `openssl`, `python3`, 또는 `od`를 사용해 생성합니다.
- **선택 사항:** 같은 `.env`에 provider key(예: `GROQ_API_KEY`, `OLLAMA_API_KEY`)와 다른 OpenClaw env var를 넣을 수 있습니다.
- **Host ports:** 기본값으로 script가 `18789`(gateway)와 `18790`(bridge)을 host에 매핑합니다. host 쪽 포트를 바꾸려면 실행 시 `OPENCLAW_PODMAN_GATEWAY_HOST_PORT`와 `OPENCLAW_PODMAN_BRIDGE_HOST_PORT`를 지정하세요.
- **Gateway bind:** 기본적으로 `run-openclaw-podman.sh`는 안전한 로컬 접근을 위해 `--bind loopback`으로 gateway를 시작합니다. LAN에 노출하려면 `OPENCLAW_GATEWAY_BIND=lan`을 설정하고 `openclaw.json`에서 `gateway.controlUi.allowedOrigins`를 구성하거나 host-header fallback을 명시적으로 허용하세요.
- **Paths:** host의 config와 workspace 기본 경로는 `~openclaw/.openclaw`와 `~openclaw/.openclaw/workspace`입니다. launch script가 사용하는 host 경로를 바꾸려면 `OPENCLAW_CONFIG_DIR`과 `OPENCLAW_WORKSPACE_DIR`를 설정하세요.

## 스토리지 모델

- **Persistent host data:** `OPENCLAW_CONFIG_DIR`과 `OPENCLAW_WORKSPACE_DIR`는 컨테이너에 bind mount되며 상태가 host에 유지됩니다.
- **Ephemeral sandbox tmpfs:** `agents.defaults.sandbox`를 켜면 tool sandbox 컨테이너가 `/tmp`, `/var/tmp`, `/run`에 `tmpfs`를 마운트합니다. 이 경로들은 메모리 기반이고 sandbox 컨테이너가 사라지면 함께 없어집니다. 최상위 Podman 컨테이너는 별도 tmpfs를 추가하지 않습니다.
- **Disk growth hotspots:** 주로 `media/`, `agents/<agentId>/sessions/sessions.json`, transcript JSONL 파일, `cron/runs/*.jsonl`, 그리고 `/tmp/openclaw/` 아래 또는 설정된 `logging.file` 경로의 rolling file log를 주시하세요.

`setup-podman.sh`는 이제 이미지 tar를 private temp 디렉터리에 staging하고, setup 중 선택한 base dir를 출력합니다. non-root 실행에서는 해당 base가 안전한 경우에만 `TMPDIR`를 사용하고, 그렇지 않으면 `/var/tmp`, 그다음 `/tmp`로 fallback합니다. 저장된 tar는 owner만 접근할 수 있고 대상 사용자의 `podman load`로 스트리밍되므로, 호출자 전용 private temp dir이 setup을 막지 않습니다.

## 유용한 명령

- **로그:** Quadlet 사용 시 `sudo journalctl --machine openclaw@ --user -u openclaw.service -f`, script 사용 시 `sudo -u openclaw podman logs -f openclaw`
- **중지:** Quadlet 사용 시 `sudo systemctl --machine openclaw@ --user stop openclaw.service`, script 사용 시 `sudo -u openclaw podman stop openclaw`
- **다시 시작:** Quadlet 사용 시 `sudo systemctl --machine openclaw@ --user start openclaw.service`, script 사용 시 launch script를 다시 실행하거나 `podman start openclaw`
- **컨테이너 제거:** `sudo -u openclaw podman rm -f openclaw` - host의 config와 workspace는 유지됨

## 문제 해결

- **config 또는 auth-profiles에서 `Permission denied (EACCES)` 발생:** 컨테이너는 기본적으로 `--userns=keep-id`를 사용하고, script를 실행한 host 사용자와 같은 uid/gid로 실행됩니다. host의 `OPENCLAW_CONFIG_DIR`과 `OPENCLAW_WORKSPACE_DIR`가 그 사용자 소유인지 확인하세요.
- **Gateway 시작 차단(`gateway.mode=local` 누락):** `~openclaw/.openclaw/openclaw.json`이 존재하고 `gateway.mode="local"`을 설정하는지 확인하세요. `setup-podman.sh`는 파일이 없으면 자동으로 만듭니다.
- **openclaw 사용자에서 rootless Podman 실패:** `/etc/subuid`와 `/etc/subgid`에 `openclaw`용 항목(예: `openclaw:100000:65536`)이 있는지 확인하고, 없으면 추가한 뒤 다시 시작하세요.
- **컨테이너 이름 충돌:** launch script는 `podman run --replace`를 사용하므로 재시작 시 기존 컨테이너를 교체합니다. 수동 정리가 필요하면 `podman rm -f openclaw`를 실행하세요.
- **openclaw로 실행할 때 script를 찾을 수 없음:** `setup-podman.sh`가 실행되어 `run-openclaw-podman.sh`가 `/home/openclaw/run-openclaw-podman.sh` 같은 openclaw 홈으로 복사됐는지 확인하세요.
- **Quadlet service를 찾을 수 없거나 시작 실패:** `.container` 파일을 수정한 뒤 `sudo systemctl --machine openclaw@ --user daemon-reload`를 실행하세요. Quadlet은 cgroups v2가 필요하며, `podman info --format '{{.Host.CgroupsVersion}}'` 결과가 `2`여야 합니다.

## 선택 사항: 자신의 사용자로 실행

전용 `openclaw` 사용자 없이 일반 사용자로 gateway를 실행하려면 이미지를 빌드하고, `OPENCLAW_GATEWAY_TOKEN`이 들어 있는 `~/.openclaw/.env`를 만든 뒤, `--userns=keep-id`와 `~/.openclaw` 마운트를 사용해 컨테이너를 실행하면 됩니다. launch script는 `openclaw` 사용자 흐름을 기준으로 설계돼 있으므로, 단일 사용자 구성에서는 script 안의 `podman run` 명령을 수동으로 실행하면서 config와 workspace 경로를 자신의 홈으로 맞추면 됩니다. 대부분의 사용자는 `setup-podman.sh`와 전용 `openclaw` 사용자를 쓰는 방식이 config와 프로세스 격리에 더 적합합니다.
