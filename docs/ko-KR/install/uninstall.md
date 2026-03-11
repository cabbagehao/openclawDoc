---
summary: "OpenClaw를 완전히 제거하기(CLI, 서비스, 상태, 워크스페이스)"
read_when:
  - 머신에서 OpenClaw를 제거하려고 합니다
  - 제거 후에도 게이트웨이 서비스가 계속 실행 중입니다
title: "제거"
---

# 제거

두 가지 경로가 있습니다.

- `openclaw`가 아직 설치되어 있으면 **간단한 경로**
- CLI는 없어졌지만 서비스가 계속 돌고 있으면 **수동 서비스 제거**

## 간단한 경로(CLI가 아직 설치됨)

권장: 내장 제거기를 사용하세요.

```bash
openclaw uninstall
```

비대화형(자동화 / npx):

```bash
openclaw uninstall --all --yes --non-interactive
npx -y openclaw uninstall --all --yes --non-interactive
```

수동 단계(결과는 동일):

1. 게이트웨이 서비스를 중지합니다:

```bash
openclaw gateway stop
```

2. 게이트웨이 서비스(launchd/systemd/schtasks)를 제거합니다:

```bash
openclaw gateway uninstall
```

3. 상태 + 설정을 삭제합니다:

```bash
rm -rf "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"
```

`OPENCLAW_CONFIG_PATH`를 상태 디렉터리 바깥의 사용자 지정 위치로 지정했다면 그 파일도 삭제하세요.

4. 워크스페이스를 삭제합니다(선택 사항, 에이전트 파일 제거):

```bash
rm -rf ~/.openclaw/workspace
```

5. CLI 설치를 제거합니다(사용한 방식 선택):

```bash
npm rm -g openclaw
pnpm remove -g openclaw
bun remove -g openclaw
```

6. macOS 앱을 설치했다면:

```bash
rm -rf /Applications/OpenClaw.app
```

참고:

- profile(`--profile` / `OPENCLAW_PROFILE`)를 사용했다면 각 상태 디렉터리(기본값 `~/.openclaw-<profile>`)마다 3단계를 반복하세요.
- 원격 모드에서는 상태 디렉터리가 **게이트웨이 호스트**에 있으므로 1-4단계도 այնտեղ서 실행해야 합니다.

## 수동 서비스 제거(CLI가 설치되지 않음)

게이트웨이 서비스는 계속 실행 중인데 `openclaw` 명령이 없을 때 사용합니다.

### macOS (launchd)

기본 라벨은 `ai.openclaw.gateway`입니다(또는 `ai.openclaw.<profile>`; 레거시 `com.openclaw.*`가 남아 있을 수도 있음):

```bash
launchctl bootout gui/$UID/ai.openclaw.gateway
rm -f ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

profile을 썼다면 라벨과 plist 이름을 `ai.openclaw.<profile>`로 바꾸세요. 레거시 `com.openclaw.*` plist가 있으면 함께 제거하세요.

### Linux (systemd user unit)

기본 unit 이름은 `openclaw-gateway.service`입니다(또는 `openclaw-gateway-<profile>.service`):

```bash
systemctl --user disable --now openclaw-gateway.service
rm -f ~/.config/systemd/user/openclaw-gateway.service
systemctl --user daemon-reload
```

### Windows (Scheduled Task)

기본 작업 이름은 `OpenClaw Gateway`입니다(또는 `OpenClaw Gateway (<profile>)`).
작업 스크립트는 상태 디렉터리 아래에 있습니다.

```powershell
schtasks /Delete /F /TN "OpenClaw Gateway"
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.cmd"
```

profile을 썼다면 해당 작업 이름과 `~\.openclaw-<profile>\gateway.cmd`를 삭제하세요.

## 일반 설치 vs 소스 체크아웃

### 일반 설치(install.sh / npm / pnpm / bun)

`https://openclaw.ai/install.sh` 또는 `install.ps1`을 사용했다면 CLI는 `npm install -g openclaw@latest`로 설치되었습니다.
`npm rm -g openclaw`로 제거하세요(그 방식으로 설치했다면 `pnpm remove -g` / `bun remove -g`도 가능).

### 소스 체크아웃(git clone)

저장소 체크아웃에서 실행 중이라면(`git clone` + `openclaw ...` / `bun run openclaw ...`):

1. 저장소를 지우기 **전에** 게이트웨이 서비스를 제거하세요(위의 간단한 경로 또는 수동 서비스 제거 사용).
2. 저장소 디렉터리를 삭제하세요.
3. 위에서 설명한 대로 상태 + 워크스페이스를 제거하세요.
