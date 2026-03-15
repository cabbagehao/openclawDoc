---
summary: "OpenClaw를 안전하게 업데이트하기(전역 설치 또는 소스 설치), 그리고 롤백 전략"
read_when:
  - OpenClaw를 업데이트하고 있습니다
  - 업데이트 후 무언가가 깨졌습니다
title: "업데이트"
---

# 업데이트

OpenClaw는 매우 빠르게 변하고 있습니다(아직 "1.0" 이전). 업데이트는 인프라를 배포하듯 다루세요: 업데이트 → 점검 실행 → 재시작(또는 재시작을 포함한 `openclaw update` 사용) → 검증.

## 권장: 웹사이트 설치 프로그램을 다시 실행하기(제자리 업그레이드)

가장 **권장되는** 업데이트 경로는 웹사이트 설치 프로그램을 다시 실행하는 것입니다. 기존 설치를 감지해 제자리에서 업그레이드하고, 필요하면 `openclaw doctor`를 실행합니다.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

참고:

- 온보딩 마법사를 다시 실행하고 싶지 않다면 `--no-onboard`를 추가하세요.
- **소스 설치**라면 다음을 사용하세요:

  ```bash
  curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --no-onboard
  ```

  저장소가 깨끗할 때에만 설치 프로그램이 `git pull --rebase`를 수행합니다.

- **전역 설치**의 경우, 내부적으로 `npm install -g openclaw@latest`를 사용합니다.
- 레거시 참고: `clawdbot`은 호환성 셸로 계속 제공됩니다.

## 업데이트 전에

- 설치 방식을 파악하세요: **전역 설치**(npm/pnpm)인지 **소스 설치**(git clone)인지
- Gateway 실행 방식을 파악하세요: **포그라운드 터미널**인지 **감독 서비스**(launchd/systemd)인지
- 사용자 설정을 스냅샷해 두세요:
  - 설정: `~/.openclaw/openclaw.json`
  - 자격 증명: `~/.openclaw/credentials/`
  - 워크스페이스: `~/.openclaw/workspace`

## 업데이트(전역 설치)

전역 설치(하나 선택):

```bash
npm i -g openclaw@latest
```

```bash
pnpm add -g openclaw@latest
```

Gateway 런타임에는 Bun을 **권장하지 않습니다**(WhatsApp/Telegram 버그).

업데이트 채널을 바꾸려면(git + npm 설치 공통):

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --channel stable
```

일회성 설치 태그/버전은 `--tag <dist-tag|version>`을 사용하세요.

채널 의미와 릴리스 노트는 [개발 채널](/install/development-channels)을 참고하세요.

참고: npm 설치에서는 게이트웨이가 시작 시 업데이트 힌트를 로그에 남깁니다(현재 채널 태그 확인). `update.checkOnStart: false`로 비활성화할 수 있습니다.

### 코어 자동 업데이터(선택 사항)

자동 업데이터는 기본적으로 **꺼져 있으며**, 플러그인이 아닌 Gateway 코어 기능입니다.

```json
{
  "update": {
    "channel": "stable",
    "auto": {
      "enabled": true,
      "stableDelayHours": 6,
      "stableJitterHours": 12,
      "betaCheckIntervalHours": 1
    }
  }
}
```

동작 방식:

- `stable`: 새 버전이 보이면 `stableDelayHours`만큼 기다린 뒤, 설치마다 결정론적인 `stableJitterHours`를 적용해 분산 롤아웃합니다.
- `beta`: `betaCheckIntervalHours` 간격(기본: 매시간)으로 확인하고, 업데이트가 있으면 적용합니다.
- `dev`: 자동 적용 없음. 수동 `openclaw update`를 사용하세요.

자동화를 켜기 전에 `openclaw update --dry-run`으로 업데이트 동작을 미리 확인할 수 있습니다.

그다음:

```bash
openclaw doctor
openclaw gateway restart
openclaw health
```

참고:

- Gateway가 서비스로 실행 중이면 PID를 죽이는 대신 `openclaw gateway restart`를 권장합니다.
- 특정 버전에 고정해 두었다면 아래 "롤백 / 고정"을 참고하세요.

## 업데이트 (`openclaw update`)

**소스 설치**(git 체크아웃)라면 다음을 권장합니다.

```bash
openclaw update
```

이 명령은 비교적 안전한 업데이트 흐름을 실행합니다:

- 깨끗한 워크트리가 필요함
- 선택한 채널(태그 또는 브랜치)로 전환
- 설정된 upstream 기준으로 fetch + rebase(dev 채널)
- 의존성 설치, 빌드, Control UI 빌드, `openclaw doctor` 실행
- 기본적으로 게이트웨이 재시작(`--no-restart`로 생략 가능)

**npm/pnpm**으로 설치했고(git 메타데이터 없음) `openclaw update`가 설치를 감지하지 못하면, 대신 "업데이트(전역 설치)"를 사용하세요.

## 업데이트(Control UI / RPC)

Control UI에는 **Update & Restart**(RPC: `update.run`)가 있습니다. 이 동작은:

1. `openclaw update`와 같은 소스 업데이트 흐름을 실행합니다(git 체크아웃만 해당).
2. 구조화된 보고서(stdout/stderr tail)가 담긴 재시작 sentinel을 기록합니다.
3. 게이트웨이를 재시작하고 마지막 활성 세션에 보고서를 ping합니다.

rebase가 실패하면, 게이트웨이는 업데이트를 적용하지 않은 채 중단 후 재시작합니다.

## 업데이트(소스에서)

저장소 체크아웃에서:

권장:

```bash
openclaw update
```

수동 방식(비슷한 효과):

```bash
git pull
pnpm install
pnpm build
pnpm ui:build # auto-installs UI deps on first run
openclaw doctor
openclaw health
```

참고:

- 패키징된 `openclaw` 바이너리([`openclaw.mjs`](https://github.com/openclaw/openclaw/blob/main/openclaw.mjs))를 실행하거나 Node로 `dist/`를 실행할 때는 `pnpm build`가 중요합니다.
- 전역 설치 없이 저장소 체크아웃에서 실행한다면 CLI 명령은 `pnpm openclaw ...`를 사용하세요.
- TypeScript에서 직접 실행 중이라면(`pnpm openclaw ...`) 보통 재빌드는 불필요하지만, **설정 마이그레이션은 여전히 적용되므로** doctor는 실행해야 합니다.
- 전역 설치와 git 설치 사이 전환은 쉽습니다. 다른 쪽을 설치한 뒤 `openclaw doctor`를 실행하면 게이트웨이 서비스 엔트리포인트가 현재 설치 방식으로 다시 작성됩니다.

## 항상 실행: `openclaw doctor`

Doctor는 "안전한 업데이트" 명령입니다. 의도적으로 지루합니다: 복구 + 마이그레이션 + 경고.

참고: **소스 설치**(git 체크아웃) 상태라면 `openclaw doctor`가 먼저 `openclaw update`를 실행하라고 제안합니다.

보통 하는 일:

- 더 이상 권장되지 않는 설정 키 / 레거시 설정 파일 위치 마이그레이션
- DM 정책을 감사하고 위험한 "open" 설정 경고
- Gateway 상태 점검 및 필요 시 재시작 제안
- 오래된 게이트웨이 서비스(launchd/systemd, 레거시 schtasks)를 현재 OpenClaw 서비스로 감지 및 마이그레이션
- Linux에서는 systemd user lingering 보장(로그아웃 후에도 Gateway 유지)

자세한 내용: [Doctor](/gateway/doctor)

## Gateway 시작 / 중지 / 재시작

CLI(OS와 무관하게 동작):

```bash
openclaw gateway status
openclaw gateway stop
openclaw gateway restart
openclaw gateway --port 18789
openclaw logs --follow
```

감독 서비스 환경이라면:

- macOS launchd(앱 번들 LaunchAgent): `launchctl kickstart -k gui/$UID/ai.openclaw.gateway` (`ai.openclaw.<profile>` 사용, 레거시 `com.openclaw.*`도 계속 동작)
- Linux systemd 사용자 서비스: `systemctl --user restart openclaw-gateway[-<profile>].service`
- Windows (WSL2): `systemctl --user restart openclaw-gateway[-<profile>].service`
  - `launchctl`/`systemctl`은 서비스가 설치되어 있을 때만 동작합니다. 아니면 `openclaw gateway install`을 실행하세요.

런북과 정확한 서비스 라벨: [Gateway runbook](/gateway)

## 롤백 / 고정(문제가 생겼을 때)

### 고정(전역 설치)

알려진 정상 버전을 설치하세요(`<version>`은 마지막으로 잘 동작하던 버전으로 교체):

```bash
npm i -g openclaw@<version>
```

```bash
pnpm add -g openclaw@<version>
```

팁: 현재 배포된 버전은 `npm view openclaw version`으로 확인할 수 있습니다.

그다음 doctor를 다시 실행하고 재시작하세요:

```bash
openclaw doctor
openclaw gateway restart
```

### 날짜 기준 고정(소스 설치)

특정 날짜 시점의 커밋을 선택하세요(예: "2026-01-01 시점의 main 상태"):

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
```

그다음 의존성을 다시 설치하고 재시작하세요:

```bash
pnpm install
pnpm build
openclaw gateway restart
```

나중에 다시 최신으로 돌아가려면:

```bash
git checkout main
git pull
```

## 막혔을 때

- `openclaw doctor`를 다시 실행하고 출력을 주의 깊게 읽으세요(대개 해결책이 나옵니다).
- 확인: [Troubleshooting](/gateway/troubleshooting)
- Discord에 문의: [https://discord.gg/clawd](https://discord.gg/clawd)
