---
summary: "Linux 지원 + companion app 상태"
description: "Linux에서 Gateway를 실행하는 빠른 경로, service 설치 방식, companion app 지원 상태를 안내합니다."
read_when:
  - "Linux companion app 상태를 확인할 때"
  - "플랫폼 커버리지나 기여를 계획할 때"
title: "Linux App"
x-i18n:
  source_path: "platforms/linux.md"
---

# Linux App

Gateway는 Linux에서 완전히 지원됩니다. **Node가 권장 runtime**입니다.
Bun은 Gateway용으로 권장되지 않습니다. WhatsApp/Telegram bugs가 있기 때문입니다.

native Linux companion apps는 계획 중입니다. 직접 만들고 싶다면 기여를 환영합니다.

## 초보자용 빠른 경로 (VPS)

1. Node 22+ 설치
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. 노트북에서: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. `http://127.0.0.1:18789/`를 열고 token을 붙여 넣기

단계별 VPS 가이드: [exe.dev](/install/exe-dev)

## Install

- [Getting Started](/start/getting-started)
- [Install & updates](/install/updating)
- optional flows: [Bun (experimental)](/install/bun), [Nix](/install/nix), [Docker](/install/docker)

## Gateway

- [Gateway runbook](/gateway)
- [Configuration](/gateway/configuration)

## Gateway service install (CLI)

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

프롬프트가 나오면 **Gateway service**를 선택하세요.

Repair/migrate:

```
openclaw doctor
```

## System control (systemd user unit)

OpenClaw는 기본적으로 systemd **user** service를 설치합니다. 공유되거나 항상 켜져 있어야 하는 서버에는 **system** service를 사용하세요. 전체 unit example과 guidance는 [Gateway runbook](/gateway)에 있습니다.

Minimal setup:

`~/.config/systemd/user/openclaw-gateway[-<profile>].service`를 만드세요.

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

Enable it:

```
systemctl --user enable --now openclaw-gateway[-<profile>].service
```
