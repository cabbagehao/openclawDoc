---
summary: "rootless Podman 컨테이너에서 OpenClaw 실행"
read_when:
  - Docker 대신 Podman으로 컨테이너화된 게이트웨이를 원합니다
title: "Podman"
---

# Podman

**rootless** Podman 컨테이너에서 OpenClaw gateway를 실행합니다. Docker와 같은 이미지를 사용합니다 (리포지토리 [Dockerfile](https://github.com/openclaw/openclaw/blob/main/Dockerfile)에서 빌드).

## Requirements

- Podman (rootless)
- 일회성 설정을 위한 sudo (사용자 생성, 이미지 빌드)

## 빠른 시작

**1. 일회성 설정** (리포지토리 루트에서 실행; 사용자 생성, 이미지 빌드, launch script 설치):

```bash
./setup-podman.sh
```

이 명령은 최소한의 `~openclaw/.openclaw/openclaw.json`도 생성합니다 (`gateway.mode="local"` 설정). 그래서 wizard를 실행하지 않아도 gateway를 시작할 수 있습니다.

기본적으로 컨테이너는 systemd service로 **설치되지 않으며**, 수동으로 시작합니다 (아래 참고). 자동 시작과 재시작이 포함된 프로덕션 스타일 설정이 필요하다면, 대신 systemd Quadlet user service로 설치하세요:

```bash
./setup-podman.sh --quadlet
```

(`OPENCLAW_PODMAN_QUADLET=1`을 설정해도 됩니다. `--container`를 사용하면 컨테이너와 launch script만 설치합니다.)

선택적 빌드 시점 환경 변수 (`setup-podman.sh` 실행 전에 설정):

- `OPENCLAW_DOCKER_APT_PACKAGES` — 이미지 빌드 중 추가 apt 패키지를 설치합니다
- `OPENCLAW_EXTENSIONS` — extension 의존성을 미리 설치합니다 (공백으로 구분된 extension 이름, 예: `diagnostics-otel matrix`)

**2. gateway 시작** (빠른 smoke test용 수동 실행):

```bash
./scripts/run-openclaw-podman.sh launch
```

**3. 온보딩 wizard** (예: channel 또는 provider 추가):

```bash
./scripts/run-openclaw-podman.sh launch setup
```

그런 다음 `http://127.0.0.1:18789/`를 열고 `~openclaw/.openclaw/.env`의 토큰(또는 setup 시 출력된 값)을 사용하세요.

## Systemd (Quadlet, 선택 사항)

`./setup-podman.sh --quadlet`(또는 `OPENCLAW_PODMAN_QUADLET=1`)를 실행했다면, gateway가 openclaw 사용자의 systemd user service로 실행되도록 [Podman Quadlet](https://docs.podman.io/en/latest/markdown/podman-systemd.unit.5.html) unit이 설치됩니다. 서비스는 setup 마지막에 활성화되고 시작됩니다.

- **시작:** `sudo systemctl --machine openclaw@ --user start openclaw.service`
- **중지:** `sudo systemctl --machine openclaw@ --user stop openclaw.service`
- **상태:** `sudo systemctl --machine openclaw@ --user status openclaw.service`
- **로그:** `sudo journalctl --machine openclaw@ --user -u openclaw.service -f`

quadlet 파일은 `~openclaw/.config/containers/systemd/openclaw.container`에 있습니다. 포트나 env를 변경하려면 그 파일(또는 이 파일이 참조하는 `.env`)을 수정한 뒤 `sudo systemctl --machine openclaw@ --user daemon-reload`를 실행하고 서비스를 재시작하세요. 부팅 시에는 openclaw에 lingering이 활성화되어 있으면 서비스가 자동으로 시작됩니다 (setup은 `loginctl`을 사용할 수 있을 때 이를 수행합니다).

초기 setup에서 quadlet을 사용하지 않았는데 **나중에** 추가하려면 다음을 다시 실행하세요: `./setup-podman.sh --quadlet`.

## openclaw 사용자 (비로그인)

`setup-podman.sh`는 전용 시스템 사용자 `openclaw`를 생성합니다:

- **셸:** `nologin` — 대화형 로그인을 허용하지 않아 공격 표면을 줄입니다.
- **홈:** 예: `/home/openclaw` — `~/.openclaw`(config, workspace)와 launch script `run-openclaw-podman.sh`를 보관합니다.
- **Rootless Podman:** 이 사용자에게는 **subuid** 및 **subgid** 범위가 있어야 합니다. 많은 배포판은 사용자를 생성할 때 이를 자동으로 할당합니다. setup이 경고를 출력하면 `/etc/subuid`와 `/etc/subgid`에 다음 줄을 추가하세요:

  ```text
  openclaw:100000:65536
  ```

  그런 다음 해당 사용자로 gateway를 시작하세요 (예: cron 또는 systemd에서):

  ```bash
  sudo -u openclaw /home/openclaw/run-openclaw-podman.sh
  sudo -u openclaw /home/openclaw/run-openclaw-podman.sh setup
  ```

- **Config:** `/home/openclaw/.openclaw`에는 `openclaw`와 root만 접근할 수 있습니다. config를 수정하려면 gateway가 실행 중일 때 Control UI를 사용하거나 `sudo -u openclaw $EDITOR /home/openclaw/.openclaw/openclaw.json`을 실행하세요.

## 환경 변수와 config

- **토큰:** `~openclaw/.openclaw/.env`에 `OPENCLAW_GATEWAY_TOKEN`으로 저장됩니다. `setup-podman.sh`와 `run-openclaw-podman.sh`는 토큰이 없으면 이를 생성합니다 (`openssl`, `python3`, 또는 `od` 사용).
- **선택 사항:** 이 `.env`에서 provider 키(예: `GROQ_API_KEY`, `OLLAMA_API_KEY`)와 다른 OpenClaw 환경 변수를 설정할 수 있습니다.
- **호스트 포트:** 기본적으로 script는 `18789`(gateway)와 `18790`(bridge)을 매핑합니다. 실행 시 `OPENCLAW_PODMAN_GATEWAY_HOST_PORT`와 `OPENCLAW_PODMAN_BRIDGE_HOST_PORT`로 **호스트** 포트 매핑을 재정의할 수 있습니다.
- **Gateway bind:** 기본적으로 `run-openclaw-podman.sh`는 안전한 로컬 접근을 위해 `--bind loopback`으로 gateway를 시작합니다. LAN에 노출하려면 `OPENCLAW_GATEWAY_BIND=lan`을 설정하고 `openclaw.json`에서 `gateway.controlUi.allowedOrigins`를 구성하세요 (또는 host-header fallback을 명시적으로 활성화하세요).
- **경로:** 호스트 config와 workspace의 기본값은 `~openclaw/.openclaw` 및 `~openclaw/.openclaw/workspace`입니다. launch script가 사용하는 호스트 경로를 바꾸려면 `OPENCLAW_CONFIG_DIR`과 `OPENCLAW_WORKSPACE_DIR`를 설정하세요.

## 스토리지 모델

- **지속되는 호스트 데이터:** `OPENCLAW_CONFIG_DIR`과 `OPENCLAW_WORKSPACE_DIR`는 컨테이너에 bind mount되며, 상태가 호스트에 유지됩니다.
- **일시적 sandbox tmpfs:** `agents.defaults.sandbox`를 활성화하면 tool sandbox 컨테이너는 `/tmp`, `/var/tmp`, `/run`에 `tmpfs`를 마운트합니다. 이 경로들은 메모리 기반이며 sandbox 컨테이너와 함께 사라집니다. 최상위 Podman 컨테이너 설정은 자체 tmpfs 마운트를 추가하지 않습니다.
- **디스크 증가 주의 지점:** 주로 확인할 경로는 `media/`, `agents/<agentId>/sessions/sessions.json`, transcript JSONL 파일, `cron/runs/*.jsonl`, 그리고 `/tmp/openclaw/` 아래(또는 구성한 `logging.file` 경로)의 순환 파일 로그입니다.

이제 `setup-podman.sh`는 이미지 tar를 private temp 디렉터리에 준비하고, setup 중 선택한 base dir를 출력합니다. 비root 실행에서는 해당 base가 안전하게 사용 가능할 때만 `TMPDIR`를 허용합니다. 그렇지 않으면 `/var/tmp`, 그다음 `/tmp`로 fallback합니다. 저장된 tar는 owner 전용으로 유지되며 대상 사용자의 `podman load`로 스트리밍되므로, 호출자 전용 private temp 디렉터리가 setup을 막지 않습니다.

## 유용한 명령

- **로그:** quadlet 사용 시 `sudo journalctl --machine openclaw@ --user -u openclaw.service -f`. script 사용 시 `sudo -u openclaw podman logs -f openclaw`
- **중지:** quadlet 사용 시 `sudo systemctl --machine openclaw@ --user stop openclaw.service`. script 사용 시 `sudo -u openclaw podman stop openclaw`
- **다시 시작:** quadlet 사용 시 `sudo systemctl --machine openclaw@ --user start openclaw.service`. script 사용 시 launch script를 다시 실행하거나 `podman start openclaw`
- **컨테이너 제거:** `sudo -u openclaw podman rm -f openclaw` — 호스트의 config와 workspace는 유지됩니다

## 문제 해결

- **config 또는 auth-profiles에서 Permission denied (EACCES) 발생:** 컨테이너는 기본적으로 `--userns=keep-id`를 사용하며, script를 실행하는 호스트 사용자와 동일한 uid/gid로 실행됩니다. 호스트의 `OPENCLAW_CONFIG_DIR`과 `OPENCLAW_WORKSPACE_DIR`가 해당 사용자 소유인지 확인하세요.
- **Gateway 시작 차단 (`gateway.mode=local` 누락):** `~openclaw/.openclaw/openclaw.json`이 존재하고 `gateway.mode="local"`을 설정하는지 확인하세요. `setup-podman.sh`는 파일이 없으면 이를 생성합니다.
- **openclaw 사용자에서 rootless Podman 실패:** `/etc/subuid`와 `/etc/subgid`에 `openclaw`용 줄(예: `openclaw:100000:65536`)이 있는지 확인하세요. 없으면 추가하고 다시 시작하세요.
- **컨테이너 이름이 이미 사용 중:** launch script는 `podman run --replace`를 사용하므로 다시 시작할 때 기존 컨테이너를 교체합니다. 수동으로 정리하려면 `podman rm -f openclaw`를 실행하세요.
- **openclaw로 실행할 때 script를 찾을 수 없음:** `run-openclaw-podman.sh`가 openclaw의 홈(예: `/home/openclaw/run-openclaw-podman.sh`)으로 복사되도록 `setup-podman.sh`가 실행되었는지 확인하세요.
- **Quadlet service를 찾을 수 없거나 시작 실패:** `.container` 파일을 수정한 뒤 `sudo systemctl --machine openclaw@ --user daemon-reload`를 실행하세요. Quadlet에는 cgroups v2가 필요합니다: `podman info --format '{{.Host.CgroupsVersion}}'`는 `2`를 출력해야 합니다.

## 선택 사항: 자신의 사용자로 실행

gateway를 일반 사용자로 실행하려면(전용 openclaw 사용자 없음) 이미지를 빌드하고, `OPENCLAW_GATEWAY_TOKEN`이 포함된 `~/.openclaw/.env`를 생성한 뒤, `--userns=keep-id`와 `~/.openclaw` 마운트를 사용해 컨테이너를 실행하세요. launch script는 openclaw 사용자 흐름을 기준으로 설계되어 있으므로, 단일 사용자 설정에서는 대신 script 안의 `podman run` 명령을 수동으로 실행하면서 config와 workspace를 자신의 홈으로 지정할 수 있습니다. 대부분의 사용자에게는 `setup-podman.sh`를 사용하고 openclaw 사용자로 실행해 config와 프로세스를 격리하는 방식을 권장합니다.
