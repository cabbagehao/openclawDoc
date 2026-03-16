---
title: Ansible
description: openclaw-ansible로 OpenClaw를 운영 서버에 배포하고 Tailscale, 방화벽, systemd 보안 구성을 적용하는 가이드
summary: Ansible, Tailscale VPN, 방화벽 격리를 활용해 OpenClaw를 자동 배포하는 가이드
read_when:
  - 보안이 강화된 서버 배포 자동화가 필요할 때
  - VPN 전용 접근과 방화벽 격리 구성이 필요할 때
  - 원격 Debian/Ubuntu 서버에 OpenClaw를 배포할 때
x-i18n:
  source_path: install/ansible.md
---

# Ansible 설치

운영 서버에 OpenClaw를 배포하는 권장 방식은 **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)**을 사용하는 것입니다. 이 저장소는 보안을 우선한 아키텍처로 설계된 자동 설치 도구입니다.

## 빠른 시작

한 줄로 설치를 시작할 수 있습니다.

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

> **Full guide:** [github.com/openclaw/openclaw-ansible](https://github.com/openclaw/openclaw-ansible)
>
> Ansible 배포의 source of truth는 `openclaw-ansible` 저장소입니다. 이 페이지는 빠른 개요만 제공합니다.

## 무엇을 얻을 수 있나

- **Firewall-first security:** UFW + Docker 격리로 SSH와 Tailscale만 접근 가능
- **Tailscale VPN:** 서비스를 public으로 노출하지 않고 안전한 원격 접근 제공
- **Docker:** 격리된 sandbox 컨테이너와 localhost 전용 바인딩
- **Defense in depth:** 4계층 보안 아키텍처
- **One-command setup:** 몇 분 안에 배포 완료
- **Systemd integration:** 보안 설정을 포함한 부팅 시 자동 시작

## 요구 사항

- **OS:** Debian 11+ 또는 Ubuntu 20.04+
- **Access:** root 또는 sudo 권한
- **Network:** 패키지 설치를 위한 인터넷 연결
- **Ansible:** 2.14+ (`quick-start` 스크립트가 자동 설치)

## 설치되는 구성 요소

Ansible playbook은 다음을 설치하고 구성합니다.

1. **Tailscale** - 안전한 원격 접속을 위한 mesh VPN
2. **UFW firewall** - SSH와 Tailscale 포트만 허용
3. **Docker CE + Compose V2** - agent sandbox용
4. **Node.js 22.x + pnpm** - 런타임 의존성
5. **OpenClaw** - 컨테이너가 아닌 host 기반 설치
6. **Systemd service** - 보안 강화 옵션을 적용한 자동 시작 서비스

참고로 gateway는 **Docker 안이 아니라 host에서 직접** 실행됩니다. 대신 agent sandbox가 격리를 위해 Docker를 사용합니다. 자세한 내용은 [Sandboxing](/gateway/sandboxing)을 참고하세요.

## 설치 후 설정

설치가 끝나면 `openclaw` 사용자로 전환합니다.

```bash
sudo -i -u openclaw
```

post-install script가 다음 과정을 안내합니다.

1. **Onboarding wizard:** OpenClaw 설정 구성
2. **Provider login:** WhatsApp, Telegram, Discord, Signal 연결
3. **Gateway testing:** 설치 상태 확인
4. **Tailscale setup:** VPN mesh에 연결

### 자주 쓰는 명령

```bash
# Check service status
sudo systemctl status openclaw

# View live logs
sudo journalctl -u openclaw -f

# Restart gateway
sudo systemctl restart openclaw

# Provider login (run as openclaw user)
sudo -i -u openclaw
openclaw channels login
```

## 보안 아키텍처

### 4계층 방어

1. **Firewall(UFW):** public에는 SSH(22)와 Tailscale(41641/udp)만 노출
2. **VPN(Tailscale):** Gateway는 VPN mesh를 통해서만 접근 가능
3. **Docker Isolation:** `DOCKER-USER` iptables chain으로 외부 포트 노출 차단
4. **Systemd Hardening:** `NoNewPrivileges`, `PrivateTmp`, 비특권 사용자 실행

### 검증

외부 공격 표면은 다음처럼 확인할 수 있습니다.

```bash
nmap -p- YOUR_SERVER_IP
```

정상이라면 **port 22**만 열려 있어야 합니다. gateway와 Docker 관련 서비스는 모두 차단돼 있어야 합니다.

### Docker 활용 범위

Docker는 gateway 자체를 실행하기 위한 것이 아니라 **agent sandbox**를 위해 설치됩니다. gateway는 localhost에만 바인딩되며 Tailscale VPN을 통해 접근합니다.

sandbox 구성은 [Multi-Agent Sandbox & Tools](/tools/multi-agent-sandbox-tools) 문서를 참고하세요.

## 수동 설치

자동화 대신 직접 제어하고 싶다면:

```bash
# 1. Install prerequisites
sudo apt update && sudo apt install -y ansible git

# 2. Clone repository
git clone https://github.com/openclaw/openclaw-ansible.git
cd openclaw-ansible

# 3. Install Ansible collections
ansible-galaxy collection install -r requirements.yml

# 4. Run playbook
./run-playbook.sh

# Or run directly (then manually execute /tmp/openclaw-setup.sh after)
# ansible-playbook playbook.yml --ask-become-pass
```

## OpenClaw 업데이트

Ansible 설치는 OpenClaw를 수동 업데이트 가능한 형태로 구성합니다. 일반적인 업데이트 흐름은 [Updating](/install/updating)을 참고하세요.

설정 변경 등으로 playbook을 다시 실행하려면:

```bash
cd openclaw-ansible
./run-playbook.sh
```

이 작업은 멱등적이므로 여러 번 실행해도 안전합니다.

## 문제 해결

### 방화벽이 접속을 막는 경우

- 먼저 Tailscale VPN으로 접근 가능한지 확인하세요.
- SSH(port 22)는 항상 허용됩니다.
- gateway는 설계상 **Tailscale을 통해서만** 접근 가능합니다.

### 서비스가 시작되지 않는 경우

```bash
# Check logs
sudo journalctl -u openclaw -n 100

# Verify permissions
sudo ls -la /opt/openclaw

# Test manual start
sudo -i -u openclaw
cd ~/openclaw
pnpm start
```

### Docker sandbox 관련 문제

```bash
# Verify Docker is running
sudo systemctl status docker

# Check sandbox image
sudo docker images | grep openclaw-sandbox

# Build sandbox image if missing
cd /opt/openclaw/openclaw
sudo -u openclaw ./scripts/sandbox-setup.sh
```

### Provider login 실패

반드시 `openclaw` 사용자로 실행해야 합니다.

```bash
sudo -i -u openclaw
openclaw channels login
```

## 고급 구성

보안 아키텍처와 문제 해결을 더 자세히 보려면:

- [Security Architecture](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [Technical Details](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [Troubleshooting Guide](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## 관련 문서

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) - 전체 배포 가이드
- [Docker](/install/docker) - 컨테이너형 Gateway 구성
- [Sandboxing](/gateway/sandboxing) - agent sandbox 구성
- [Multi-Agent Sandbox & Tools](/tools/multi-agent-sandbox-tools) - agent별 격리 설정
