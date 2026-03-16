---
title: "Browser Troubleshooting"
description: "Linux에서 Chrome·Brave·Edge·Chromium CDP 시작 실패와 extension relay 연결 문제를 해결하는 가이드입니다."
summary: "Linux에서 OpenClaw browser control용 Chrome/Brave/Edge/Chromium CDP 시작 문제를 해결합니다"
read_when: "Linux에서 browser control이 실패할 때, 특히 snap Chromium을 쓰는 경우"
x-i18n:
  source_path: "tools/browser-linux-troubleshooting.md"
---

# Browser Troubleshooting (Linux)

## Problem: "Failed to start Chrome CDP on port 18800"

OpenClaw의 browser control server가 Chrome/Brave/Edge/Chromium을 실행하지 못하고 다음 오류를 표시합니다.

```
{"error":"Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"."}
```

### Root Cause

Ubuntu와 많은 Linux 배포판에서 기본 Chromium 설치는 **snap package**입니다. snap의 AppArmor confinement가 OpenClaw가 브라우저 프로세스를 실행하고 모니터링하는 방식과 충돌합니다.

`apt install chromium` 명령은 실제 브라우저가 아니라 snap으로 리디렉션하는 stub package를 설치합니다.

```
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

이것은 진짜 브라우저가 아니라 래퍼일 뿐입니다.

### Solution 1: Install Google Chrome (Recommended)

snap sandbox를 사용하지 않는 공식 Google Chrome `.deb` 패키지를 설치합니다.

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # 의존성 오류가 있을 때
```

그다음 OpenClaw 설정(`~/.openclaw/openclaw.json`)을 갱신하세요.

```json
{
  "browser": {
    "enabled": true,
    "executablePath": "/usr/bin/google-chrome-stable",
    "headless": true,
    "noSandbox": true
  }
}
```

### Solution 2: Use Snap Chromium with Attach-Only Mode

snap Chromium을 반드시 써야 한다면, OpenClaw가 수동으로 시작한 브라우저에 attach만 하도록 설정합니다.

1. 설정을 갱신합니다.

```json
{
  "browser": {
    "enabled": true,
    "attachOnly": true,
    "headless": true,
    "noSandbox": true
  }
}
```

2. Chromium을 수동으로 시작합니다.

```bash
chromium-browser --headless --no-sandbox --disable-gpu \
  --remote-debugging-port=18800 \
  --user-data-dir=$HOME/.openclaw/browser/openclaw/user-data \
  about:blank &
```

3. 필요하면 Chrome을 자동으로 시작하는 systemd user service를 만듭니다.

```ini
# ~/.config/systemd/user/openclaw-browser.service
[Unit]
Description=OpenClaw Browser (Chrome CDP)
After=network.target

[Service]
ExecStart=/snap/bin/chromium --headless --no-sandbox --disable-gpu --remote-debugging-port=18800 --user-data-dir=%h/.openclaw/browser/openclaw/user-data about:blank
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
```

활성화 명령: `systemctl --user enable --now openclaw-browser.service`

### Verifying the Browser Works

상태 확인:

```bash
curl -s http://127.0.0.1:18791/ | jq '{running, pid, chosenBrowser}'
```

브라우징 테스트:

```bash
curl -s -X POST http://127.0.0.1:18791/start
curl -s http://127.0.0.1:18791/tabs
```

### Config Reference

| Option                   | Description                                                      | Default                                         |
| ------------------------ | ---------------------------------------------------------------- | ----------------------------------------------- |
| `browser.enabled`        | browser control 활성화                                           | `true`                                          |
| `browser.executablePath` | Chromium 계열 브라우저 바이너리 경로(Chrome/Brave/Edge/Chromium) | 자동 감지(Chromium 계열이면 기본 브라우저 우선) |
| `browser.headless`       | GUI 없이 실행                                                    | `false`                                         |
| `browser.noSandbox`      | `--no-sandbox` 플래그 추가(Linux 일부 환경에서 필요)             | `false`                                         |
| `browser.attachOnly`     | 브라우저를 직접 실행하지 않고 기존 브라우저에만 attach           | `false`                                         |
| `browser.cdpPort`        | Chrome DevTools Protocol 포트                                    | `18800`                                         |

### Problem: "Chrome extension relay is running, but no tab is connected"

`chrome` 프로필(extension relay)을 사용 중입니다. 이 프로필은 OpenClaw browser extension이 실제 탭에 연결되어 있을 것을 기대합니다.

해결 방법:

1. **관리형 브라우저 사용:** `openclaw browser start --browser-profile openclaw`
   또는 `browser.defaultProfile: "openclaw"`를 설정합니다.
2. **extension relay 사용:** 확장을 설치하고 탭을 연 다음 OpenClaw 확장 아이콘을 눌러 연결합니다.

참고:

- `chrome` 프로필은 가능하면 **시스템 기본 Chromium 브라우저**를 사용합니다.
- 로컬 `openclaw` 프로필은 `cdpPort`/`cdpUrl`을 자동 할당합니다. 원격 CDP가 아니라면 직접 설정하지 마세요.
