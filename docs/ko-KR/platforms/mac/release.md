---
summary: "OpenClaw macOS 릴리스 체크리스트(Sparkle 피드, 패키징, 서명)"
description: "Sparkle appcast와 함께 OpenClaw macOS 릴리스를 서명, 패키징, 공증, 게시하는 절차를 정리한 체크리스트입니다."
read_when:
  - "OpenClaw macOS 릴리스를 컷하거나 검증할 때"
  - "Sparkle appcast 또는 피드 자산을 업데이트할 때"
title: "macOS 릴리스"
x-i18n:
  source_path: "platforms/mac/release.md"
---

# OpenClaw macOS 릴리스(Sparkle)

이 앱은 이제 Sparkle auto-updates를 사용합니다. release builds는 Developer ID로 서명하고, zip으로 패키징한 뒤, 서명된 appcast entry와 함께 게시해야 합니다.

## 사전 요구 사항

- Developer ID Application cert가 설치되어 있어야 합니다(예: `Developer ID Application: <Developer Name> (<TEAMID>)`).
- Sparkle private key path가 `SPARKLE_PRIVATE_KEY_FILE`로 설정되어 있어야 합니다. Sparkle ed25519 private key를 가리키며 public key는 Info.plist에 포함됩니다. 누락되어 있으면 `~/.profile`을 확인하세요.
- Gatekeeper-safe DMG/zip 배포를 원한다면 `xcrun notarytool`용 notary credentials(keychain profile 또는 API key)이 필요합니다.
  - 우리는 `openclaw-notary`라는 keychain profile을 사용하며, 이 프로필은 shell profile의 App Store Connect API key env vars로 생성합니다.
    - `APP_STORE_CONNECT_API_KEY_P8`, `APP_STORE_CONNECT_KEY_ID`, `APP_STORE_CONNECT_ISSUER_ID`
    - `echo "$APP_STORE_CONNECT_API_KEY_P8" | sed 's/\\n/\n/g' > /tmp/openclaw-notary.p8`
    - `xcrun notarytool store-credentials "openclaw-notary" --key /tmp/openclaw-notary.p8 --key-id "$APP_STORE_CONNECT_KEY_ID" --issuer "$APP_STORE_CONNECT_ISSUER_ID"`
- `pnpm` dependencies가 설치되어 있어야 합니다 (`pnpm install --config.node-linker=hoisted`).
- Sparkle tools는 SwiftPM을 통해 `apps/macos/.build/artifacts/sparkle/Sparkle/bin/` 아래로 자동으로 가져옵니다 (`sign_update`, `generate_appcast` 등).

## 빌드 및 패키징

참고:

- `APP_BUILD`는 `CFBundleVersion`/`sparkle:version`에 매핑됩니다. 숫자형이면서 단조 증가하게 유지하세요 (`-beta` 금지). 그렇지 않으면 Sparkle이 같은 값으로 비교합니다.
- `APP_BUILD`를 생략하면 `scripts/package-mac-app.sh`가 `APP_VERSION`에서 Sparkle-safe 기본값을 파생합니다 (`YYYYMMDDNN`: stable은 기본적으로 `90`, prerelease는 suffix-derived lane 사용). 그리고 그 값과 git commit count 중 더 큰 값을 사용합니다.
- release engineering에서 특정 monotonic value가 필요하면 여전히 `APP_BUILD`를 명시적으로 override할 수 있습니다.
- `BUILD_CONFIG=release`일 때 `scripts/package-mac-app.sh`는 기본적으로 universal (`arm64 x86_64`) 빌드를 사용합니다. 필요하면 `BUILD_ARCHS=arm64` 또는 `BUILD_ARCHS=x86_64`로 override할 수 있습니다. local/dev builds (`BUILD_CONFIG=debug`)에서는 현재 architecture(`$(uname -m)`)를 기본값으로 사용합니다.
- release artifacts(zip + DMG + notarization)에는 `scripts/package-mac-dist.sh`를 사용하세요. local/dev packaging에는 `scripts/package-mac-app.sh`를 사용하세요.

```bash
# From repo root; set release IDs so Sparkle feed is enabled.
# This command builds release artifacts without notarization.
# APP_BUILD must be numeric + monotonic for Sparkle compare.
# Default is auto-derived from APP_VERSION when omitted.
SKIP_NOTARIZE=1 \
BUNDLE_ID=ai.openclaw.mac \
APP_VERSION=2026.3.11 \
BUILD_CONFIG=release \
SIGN_IDENTITY="Developer ID Application: <Developer Name> (<TEAMID>)" \
scripts/package-mac-dist.sh

# `package-mac-dist.sh` already creates the zip + DMG.
# If you used `package-mac-app.sh` directly instead, create them manually:
# If you want notarization/stapling in this step, use the NOTARIZE command below.
ditto -c -k --sequesterRsrc --keepParent dist/OpenClaw.app dist/OpenClaw-2026.3.11.zip

# Optional: build a styled DMG for humans (drag to /Applications)
scripts/create-dmg.sh dist/OpenClaw.app dist/OpenClaw-2026.3.11.dmg

# Recommended: build + notarize/staple zip + DMG
# First, create a keychain profile once:
#   xcrun notarytool store-credentials "openclaw-notary" \
#     --apple-id "<apple-id>" --team-id "<team-id>" --password "<app-specific-password>"
NOTARIZE=1 NOTARYTOOL_PROFILE=openclaw-notary \
BUNDLE_ID=ai.openclaw.mac \
APP_VERSION=2026.3.11 \
BUILD_CONFIG=release \
SIGN_IDENTITY="Developer ID Application: <Developer Name> (<TEAMID>)" \
scripts/package-mac-dist.sh

# Optional: ship dSYM alongside the release
ditto -c -k --keepParent apps/macos/.build/release/OpenClaw.app.dSYM dist/OpenClaw-2026.3.11.dSYM.zip
```

## Appcast 항목

Sparkle이 서식 있는 HTML 노트를 렌더링하도록 릴리스 노트 생성기를 사용하세요.

```bash
SPARKLE_PRIVATE_KEY_FILE=/path/to/ed25519-private-key scripts/make_appcast.sh dist/OpenClaw-2026.3.11.zip https://raw.githubusercontent.com/openclaw/openclaw/main/appcast.xml
```

`CHANGELOG.md`에서 HTML release notes를 생성하고 ([`scripts/changelog-to-html.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/changelog-to-html.sh) 사용) 이를 appcast entry에 포함합니다.
게시할 때는 업데이트된 `appcast.xml`을 release assets(zip + dSYM)와 함께 커밋하세요.

## 게시 및 검증

- `OpenClaw-2026.3.11.zip`(및 `OpenClaw-2026.3.11.dSYM.zip`)을 태그 `v2026.3.11`의 GitHub release에 업로드하세요.
- 원시 appcast URL이 내장된 피드와 일치하는지 확인하세요: `https://raw.githubusercontent.com/openclaw/openclaw/main/appcast.xml`.
- 기본 점검:
  - `curl -I https://raw.githubusercontent.com/openclaw/openclaw/main/appcast.xml`가 200을 반환합니다.
  - assets 업로드 후 `curl -I <enclosure url>`가 200을 반환합니다.
  - 이전 공개 빌드에서 About 탭의 "Check for Updates..."를 실행하고 Sparkle이 새 빌드를 문제없이 설치하는지 확인합니다.

완료의 정의: signed app과 appcast가 게시되어 있고, 이전 설치 버전에서 update flow가 작동하며, release assets가 GitHub release에 첨부되어 있는 상태입니다.
