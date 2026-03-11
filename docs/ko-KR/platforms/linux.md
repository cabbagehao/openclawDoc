---
summary: "Linux 지원 + companion app 상태"
read_when:
  - Linux companion app 상태를 확인할 때
  - 플랫폼 커버리지나 기여를 계획할 때
title: "Linux App"
---

# Linux App

Gateway 는 Linux 에서 완전히 지원됩니다. **Node 가 권장 런타임** 입니다.
Bun 은 Gateway 용으로 권장되지 않습니다(WhatsApp/Telegram 버그).

네이티브 Linux companion app 은 계획 중입니다. 구축을 돕고 싶다면 기여를 환영합니다.

## 초보자용 빠른 경로 (VPS)

1. Node 22+ 설치
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. 노트북에서: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. `http://127.0.0.1:18789/` 를 열고 token 붙여 넣기

단계별 VPS 가이드: [exe.dev](/install/exe-dev)

## Install

- [Getting Started](/start/getting-started)
- [Install & updates](/install/updating)
- 선택 흐름: [Bun (experimental)](/install/bun), [Nix](/install/nix), [Docker](/install/docker)

## Gateway

- [Gateway runbook](/gateway)
- [Configuration](/gateway/configuration)

## Gateway 서비스 설치(CLI)

다음 중 하나를 사용하세요:

```
openclaw onboard --install-daemon
```

또는:

```
openclaw gateway install
```

또는:

```
openclaw configure
```

프롬프트가 나오면 **Gateway service** 를 선택하세요.

Repair/migrate:

```
openclaw doctor
```

## 시스템 제어 (systemd user unit)

OpenClaw 는 기본적으로 systemd **user** service 를 설치합니다. 공유되거나 항상 켜져 있어야 하는 서버에는 **system** service 를 사용하세요. 전체 unit 예시와 가이드는 [Gateway runbook](/gateway) 에 있습니다.

최소 설정:

`~/.config/systemd/user/openclaw-gateway[-<profile>].service` 생성:

```
[Unit]
Description=OpenClaw Gateway (profile: <profile>, v<version>)
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5

[Install]
WantedBy=default.target
```

활성화:

```
systemctl --user enable --now openclaw-gateway[-<profile>].service
```
