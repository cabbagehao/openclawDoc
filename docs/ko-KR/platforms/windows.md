---
summary: "Windows (WSL2) 지원 + companion app 상태"
read_when:
  - Windows에 OpenClaw를 설치할 때
  - Windows companion app 상태를 확인하려고 할 때
title: "Windows (WSL2)"
---

# Windows (WSL2)

Windows에서 OpenClaw를 사용하는 가장 권장되는 방법은 **WSL2 경유**입니다
(Ubuntu 권장). CLI + Gateway는 Linux 내부에서 실행되며, 이렇게 하면 runtime이
일관되게 유지되고 tooling 호환성이 훨씬 좋아집니다(Node/Bun/pnpm, Linux
binaries, skills). 네이티브 Windows는 더 까다로울 수 있습니다. WSL2는 완전한
Linux 경험을 제공합니다. 설치 명령은 하나입니다: `wsl --install`.

네이티브 Windows companion app은 계획되어 있습니다.

## 설치 (WSL2)

- [Getting Started](/start/getting-started) (WSL 내부에서 사용)
- [Install & updates](/install/updating)
- 공식 WSL2 가이드(Microsoft): [https://learn.microsoft.com/windows/wsl/install](https://learn.microsoft.com/windows/wsl/install)

## Gateway

- [Gateway runbook](/gateway)
- [Configuration](/gateway/configuration)

## Gateway service 설치 (CLI)

WSL2 내부에서:

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

프롬프트가 뜨면 **Gateway service**를 선택하세요.

복구/마이그레이션:

```
openclaw doctor
```

## Windows 로그인 전 Gateway 자동 시작

헤드리스 설정에서는, 아무도 Windows에 로그인하지 않아도 전체 부팅 체인이
실행되도록 해야 합니다.

### 1) 로그인 없이도 user service 계속 실행

WSL 내부에서:

```bash
sudo loginctl enable-linger "$(whoami)"
```

### 2) OpenClaw gateway user service 설치

WSL 내부에서:

```bash
openclaw gateway install
```

### 3) Windows 부팅 시 WSL 자동 시작

관리자 권한 PowerShell에서:

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec /bin/true" /sc onstart /ru SYSTEM
```

`Ubuntu`는 다음 명령으로 확인한 distro 이름으로 바꾸세요.

```powershell
wsl --list --verbose
```

### 시작 체인 확인

재부팅 후(Windows 로그인 전), WSL에서 다음을 확인하세요.

```bash
systemctl --user is-enabled openclaw-gateway
systemctl --user status openclaw-gateway --no-pager
```

## 고급: WSL 서비스를 LAN에 노출하기 (portproxy)

WSL은 자체 가상 네트워크를 가집니다. 다른 머신이 **WSL 내부에서 실행 중인**
서비스(SSH, 로컬 TTS 서버, 또는 Gateway)에 접근해야 한다면, Windows 포트를
현재 WSL IP로 포워딩해야 합니다. WSL IP는 재시작 후 바뀌므로 포워딩 규칙을
새로고침해야 할 수 있습니다.

예시(관리자 권한 **PowerShell**):

```powershell
$Distro = "Ubuntu-24.04"
$ListenPort = 2222
$TargetPort = 22

$WslIp = (wsl -d $Distro -- hostname -I).Trim().Split(" ")[0]
if (-not $WslIp) { throw "WSL IP not found." }

netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=$ListenPort `
  connectaddress=$WslIp connectport=$TargetPort
```

Windows Firewall에서 해당 포트를 허용하세요(1회만):

```powershell
New-NetFirewallRule -DisplayName "WSL SSH $ListenPort" -Direction Inbound `
  -Protocol TCP -LocalPort $ListenPort -Action Allow
```

WSL 재시작 후 portproxy 새로고침:

```powershell
netsh interface portproxy delete v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 | Out-Null
netsh interface portproxy add v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 `
  connectaddress=$WslIp connectport=$TargetPort | Out-Null
```

참고:

- 다른 머신에서의 SSH 대상은 **Windows host IP**입니다(예: `ssh user@windows-host -p 2222`).
- 원격 노드는 **도달 가능한** Gateway URL을 가리켜야 합니다(`127.0.0.1`은 안 됨). `openclaw status --all`로 확인하세요.
- LAN 접근에는 `listenaddress=0.0.0.0`을 사용하세요. `127.0.0.1`은 로컬 전용입니다.
- 이를 자동화하려면, 로그인 시 새로고침 단계를 실행하는 Scheduled Task를 등록하세요.

## 단계별 WSL2 설치

### 1) WSL2 + Ubuntu 설치

PowerShell(관리자)을 엽니다:

```powershell
wsl --install
# Or pick a distro explicitly:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

Windows에서 재부팅을 요청하면 재부팅하세요.

### 2) systemd 활성화 (gateway 설치에 필요)

WSL 터미널에서:

```bash
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[boot]
systemd=true
EOF
```

그런 다음 PowerShell에서:

```powershell
wsl --shutdown
```

Ubuntu를 다시 열고, 다음으로 확인하세요.

```bash
systemctl --user status
```

### 3) OpenClaw 설치 (WSL 내부)

WSL 내부에서 Linux Getting Started 흐름을 따르세요.

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm ui:build # auto-installs UI deps on first run
pnpm build
openclaw onboard
```

전체 가이드: [Getting Started](/start/getting-started)

## Windows companion app

아직 Windows companion app은 없습니다. 이를 실현하고 싶다면 기여를 환영합니다.
