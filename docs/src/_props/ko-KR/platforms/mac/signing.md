---
summary: "패키징 스크립트가 생성한 macOS 디버그 빌드를 위한 서명 단계"
read_when:
  - mac 디버그 빌드를 빌드하거나 서명할 때
title: "macOS 서명"
---

# mac 서명(디버그 빌드)

이 앱은 보통 [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh)에서 빌드되며, 이 스크립트는 이제 다음을 수행합니다.

* 안정적인 디버그 번들 식별자를 설정합니다: `ai.openclaw.mac.debug`
* 해당 번들 ID로 Info.plist를 작성합니다(`BUNDLE_ID=...`로 재정의 가능).
* [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh)를 호출해 메인 바이너리와 앱 번들을 서명하므로, macOS가 각 리빌드를 동일한 서명된 번들로 취급하고 TCC 권한(알림, 손쉬운 사용, 화면 기록, 마이크, 음성)을 유지합니다. 안정적인 권한 유지를 위해서는 실제 서명 ID를 사용하세요. 임시(ad-hoc) 서명 방식은 명시적으로 opt-in 해야 하며 취약합니다([macOS 권한](/platforms/mac/permissions) 참고).
* 기본적으로 `CODESIGN_TIMESTAMP=auto`를 사용합니다. 이 설정은 Developer ID 서명에 신뢰할 수 있는 타임스탬프를 활성화합니다. 타임스탬프를 건너뛰려면(오프라인 디버그 빌드) `CODESIGN_TIMESTAMP=off`로 설정하세요.
* 빌드 메타데이터를 Info.plist에 주입합니다. `OpenClawBuildTimestamp`(UTC)와 `OpenClawGitCommit`(짧은 해시)를 추가해 정보 패널에서 빌드, git, 디버그/릴리스 채널을 표시할 수 있게 합니다.
* **패키징에는 Node 22+가 필요합니다**. 이 스크립트는 TS 빌드와 Control UI 빌드를 실행합니다.
* 환경 변수에서 `SIGN_IDENTITY`를 읽습니다. 항상 인증서로 서명하려면 셸 rc에 `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"`(또는 Developer ID Application 인증서)를 추가하세요. 임시 서명은 `ALLOW_ADHOC_SIGNING=1` 또는 `SIGN_IDENTITY="-"`를 통해 명시적으로 opt-in 해야 합니다(권한 테스트에는 권장하지 않음).
* 서명 후 Team ID 감사를 실행하며, 앱 번들 내부의 Mach-O가 다른 Team ID로 서명되어 있으면 실패합니다. 우회하려면 `SKIP_TEAM_ID_CHECK=1`을 설정하세요.

## 사용법

```bash
# repo 루트에서
scripts/package-mac-app.sh               # 자동으로 ID를 선택하며, 찾지 못하면 오류 발생
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # 실제 인증서
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh    # 임시(ad-hoc) 서명(권한이 유지되지 않음)
SIGN_IDENTITY="-" scripts/package-mac-app.sh        # 명시적 임시 서명(동일한 주의사항 적용)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh   # 개발 전용 Sparkle Team ID 불일치 우회책
```

### 임시(ad-hoc) 서명 참고

`SIGN_IDENTITY="-"`(임시 서명)으로 서명할 때 스크립트는 **Hardened Runtime**(`--options runtime`)을 자동으로 비활성화합니다. 이는 앱이 동일한 Team ID를 공유하지 않는 내장 프레임워크(예: Sparkle)를 로드하려 할 때 충돌이 발생하는 것을 막기 위해 필요합니다. 임시 서명은 TCC 권한 지속성도 깨뜨립니다. 복구 단계는 [macOS 권한](/platforms/mac/permissions)을 참고하세요.

## 정보 창용 빌드 메타데이터

`package-mac-app.sh`는 번들에 다음 정보를 기록합니다.

* `OpenClawBuildTimestamp`: 패키징 시점의 ISO8601 UTC
* `OpenClawGitCommit`: 짧은 git 해시(사용할 수 없으면 `unknown`)

정보 탭은 이 키들을 읽어 버전, 빌드 날짜, git 커밋, 그리고 디버그 빌드 여부(`#if DEBUG`를 통해)를 표시합니다. 코드 변경 후 이 값을 새로 고치려면 패키저를 다시 실행하세요.

## 이유

TCC 권한은 번들 식별자와 코드 서명 모두에 연결됩니다. UUID가 계속 바뀌는 서명되지 않은 디버그 빌드 때문에 macOS가 리빌드할 때마다 권한 부여를 잊고 있었습니다. 바이너리를 서명하고(기본값은 임시 서명) 고정된 번들 ID/경로(`dist/OpenClaw.app`)를 유지하면 빌드 간 권한 부여가 보존되어 VibeTunnel 방식과 일치하게 됩니다.
