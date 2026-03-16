---
summary: "패키징 스크립트로 만든 macOS debug build의 signing 절차를 설명합니다."
description: "macOS debug build에서 stable bundle ID, `SIGN_IDENTITY`, ad-hoc signing 제약, TCC permission 유지 조건을 정리합니다."
read_when:
  - mac debug build를 빌드하거나 sign할 때
title: "macOS 서명"
x-i18n:
  source_path: "platforms/mac/signing.md"
---

# mac 서명(디버그 빌드)

이 app은 보통 [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh)에서 build되며, 이 스크립트는 다음을 수행합니다.

- 안정적인 debug bundle identifier를 설정합니다: `ai.openclaw.mac.debug`
- 해당 bundle ID로 `Info.plist`를 작성합니다(`BUNDLE_ID=...`로 override 가능).
- [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh)를 호출해 main binary와 app bundle을 sign합니다. 이렇게 해야 macOS가 각 rebuild를 같은 signed bundle로 취급하고 TCC permission(알림, 손쉬운 사용, 화면 기록, 마이크, 음성)을 유지합니다. 안정적인 permission 유지를 위해 실제 signing identity를 사용하세요. ad-hoc signing은 명시적 opt-in이 필요하며 취약합니다([macOS 권한](/platforms/mac/permissions) 참고).
- 기본값은 `CODESIGN_TIMESTAMP=auto`입니다. 이 설정은 Developer ID 서명에 trusted timestamp를 활성화합니다. offline debug build에서 timestamp를 생략하려면 `CODESIGN_TIMESTAMP=off`를 사용하세요.
- build metadata를 `Info.plist`에 주입합니다. `OpenClawBuildTimestamp`(UTC)와 `OpenClawGitCommit`(short hash)를 추가해 About pane에서 build, git, debug/release channel을 표시할 수 있게 합니다.
- **패키징에는 Node 22+가 필요합니다**. 이 스크립트는 TS build와 Control UI build를 실행합니다.
- 환경 변수에서 `SIGN_IDENTITY`를 읽습니다. 항상 인증서로 sign하려면 shell rc에 `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"`(또는 Developer ID Application certificate)를 추가하세요. ad-hoc signing은 `ALLOW_ADHOC_SIGNING=1` 또는 `SIGN_IDENTITY="-"`로 명시적으로 opt-in해야 합니다(permission 테스트에는 비권장).
- signing 뒤 Team ID audit를 실행하며, app bundle 내부 Mach-O가 다른 Team ID로 sign되어 있으면 실패합니다. 우회하려면 `SKIP_TEAM_ID_CHECK=1`을 설정하세요.

## 사용법

```bash
# from repo root
scripts/package-mac-app.sh               # auto-selects identity; errors if none found
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # real cert
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh    # ad-hoc (permissions will not stick)
SIGN_IDENTITY="-" scripts/package-mac-app.sh        # explicit ad-hoc (same caveat)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh   # dev-only Sparkle Team ID mismatch workaround
```

### ad-hoc signing 메모

`SIGN_IDENTITY="-"`(ad-hoc signing)으로 sign할 때 스크립트는 **Hardened Runtime**(`--options runtime`)을 자동으로 비활성화합니다. 이는 app이 같은 Team ID를 공유하지 않는 embedded framework(예: Sparkle)를 로드할 때 crash를 막기 위해 필요합니다. ad-hoc signing은 TCC permission persistence도 깨뜨립니다. 복구 단계는 [macOS 권한](/platforms/mac/permissions)을 참고하세요.

## About 창용 build metadata

`package-mac-app.sh`는 bundle에 다음 정보를 기록합니다.

- `OpenClawBuildTimestamp`: package 시점의 ISO8601 UTC
- `OpenClawGitCommit`: short git hash(없으면 `unknown`)

About tab은 이 key를 읽어 version, build date, git commit, debug build 여부(`#if DEBUG`)를 표시합니다. 코드 변경 뒤 값을 갱신하려면 packager를 다시 실행하세요.

## 이유

TCC permission은 bundle identifier와 code signature 모두에 연결됩니다. UUID가 계속 바뀌는 unsigned debug build 때문에 macOS가 rebuild마다 grant를 잊는 문제가 있었습니다. binary를 sign하고 고정된 bundle ID/path(`dist/OpenClaw.app`)를 유지하면 build 사이에서도 grant가 보존되며, 이 방식은 VibeTunnel 접근과 같습니다.
