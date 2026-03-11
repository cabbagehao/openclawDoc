---
summary: "OpenClaw macOS 릴리스 체크리스트(Sparkle 피드, 패키징, 서명)"
read_when:
  - OpenClaw macOS 릴리스를 컷하거나 검증할 때
  - Sparkle appcast 또는 피드 자산을 업데이트할 때
title: "macOS 릴리스"
---

# OpenClaw macOS 릴리스(Sparkle)

이 앱은 이제 Sparkle 자동 업데이트를 제공합니다. 릴리스 빌드는 Developer ID로 서명하고, zip으로 패키징한 뒤, 서명된 appcast 항목과 함께 게시해야 합니다.

## 사전 요구 사항

- Developer ID Application 인증서가 설치되어 있어야 합니다(예: `Developer ID Application: <Developer Name> (<TEAMID>)`).
- Sparkle 개인 키 경로가 환경 변수 `SPARKLE_PRIVATE_KEY_FILE`로 설정되어 있어야 합니다(Sparkle ed25519 개인 키 경로이며, 공개 키는 Info.plist에 포함됨). 누락되어 있으면 `~/.profile`을 확인하세요.
- Gatekeeper에 안전한 DMG/zip 배포를 원한다면 `xcrun notarytool`용 공증 자격 증명(키체인 프로필 또는 API 키)이 필요합니다.
  - 우리는 `openclaw-notary`라는 이름의 키체인 프로필을 사용하며, 이 프로필은 셸 프로필의 App Store Connect API 키 환경 변수로 생성합니다.
    - `APP_STORE_CONNECT_API_KEY_P8`, `APP_STORE_CONNECT_KEY_ID`, `APP_STORE_CONNECT_ISSUER_ID`
    - `echo "$APP_STORE_CONNECT_API_KEY_P8" | sed 's/\\n/\n/g' > /tmp/openclaw-notary.p8`
    - `xcrun notarytool store-credentials "openclaw-notary" --key /tmp/openclaw-notary.p8 --key-id "$APP_STORE_CONNECT_KEY_ID" --issuer "$APP_STORE_CONNECT_ISSUER_ID"`
- `pnpm` 의존성이 설치되어 있어야 합니다(`pnpm install --config.node-linker=hoisted`).
- Sparkle 도구는 SwiftPM을 통해 `apps/macos/.build/artifacts/sparkle/Sparkle/bin/` 아래로 자동으로 가져옵니다(`sign_update`, `generate_appcast` 등).

## 빌드 및 패키징

참고:

- `APP_BUILD`는 `CFBundleVersion`/`sparkle:version`에 매핑됩니다. 숫자형이면서 단조 증가하게 유지하세요(`-beta` 금지). 그렇지 않으면 Sparkle이 동일한 값으로 비교합니다.
- `APP_BUILD`를 생략하면 `scripts/package-mac-app.sh`가 `APP_VERSION`에서 Sparkle에 안전한 기본값을 파생합니다(`YYYYMMDDNN`: 안정 버전은 기본적으로 `90`, 프리릴리스는 접미사에서 파생한 레인을 사용). 그리고 그 값과 git 커밋 수 중 더 큰 값을 사용합니다.
- 릴리스 엔지니어링에서 특정한 단조 증가 값을 요구하면 여전히 `APP_BUILD`를 명시적으로 재정의할 수 있습니다.
- `BUILD_CONFIG=release`일 때 `scripts/package-mac-app.sh`는 이제 기본적으로 유니버설(`arm64 x86_64`) 빌드를 사용합니다. 필요하면 `BUILD_ARCHS=arm64` 또는 `BUILD_ARCHS=x86_64`로 재정의할 수 있습니다. 로컬/개발 빌드(`BUILD_CONFIG=debug`)에서는 현재 아키텍처(`$(uname -m)`)를 기본값으로 사용합니다.
- 릴리스 아티팩트(zip + DMG + 공증)에는 `scripts/package-mac-dist.sh`를 사용하세요. 로컬/개발 패키징에는 `scripts/package-mac-app.sh`를 사용하세요.

```bash
# 저장소 루트에서 실행합니다. Sparkle 피드가 활성화되도록 릴리스 ID를 설정하세요.
# 이 명령은 공증 없이 릴리스 아티팩트를 빌드합니다.
# Sparkle 비교를 위해 APP_BUILD는 숫자형이면서 단조 증가해야 합니다.
# 생략하면 APP_VERSION에서 자동으로 파생됩니다.
SKIP_NOTARIZE=1 \
BUNDLE_ID=ai.openclaw.mac \
APP_VERSION=2026.3.9 \
BUILD_CONFIG=release \
SIGN_IDENTITY="Developer ID Application: <Developer Name> (<TEAMID>)" \
scripts/package-mac-dist.sh

# `package-mac-dist.sh`는 이미 zip과 DMG를 생성합니다.
# 대신 `package-mac-app.sh`를 직접 사용했다면 수동으로 생성하세요.
# 이 단계에서 공증/스테이플링도 원한다면 아래 NOTARIZE 명령을 사용하세요.
ditto -c -k --sequesterRsrc --keepParent dist/OpenClaw.app dist/OpenClaw-2026.3.9.zip

# 선택 사항: 사람이 사용하기 좋은 스타일의 DMG를 빌드합니다(/Applications로 드래그)
scripts/create-dmg.sh dist/OpenClaw.app dist/OpenClaw-2026.3.9.dmg

# 권장: zip + DMG를 빌드하고 공증/스테이플링까지 수행합니다.
# 먼저 키체인 프로필을 한 번 생성하세요.
#   xcrun notarytool store-credentials "openclaw-notary" \
#     --apple-id "<apple-id>" --team-id "<team-id>" --password "<app-specific-password>"
NOTARIZE=1 NOTARYTOOL_PROFILE=openclaw-notary \
BUNDLE_ID=ai.openclaw.mac \
APP_VERSION=2026.3.9 \
BUILD_CONFIG=release \
SIGN_IDENTITY="Developer ID Application: <Developer Name> (<TEAMID>)" \
scripts/package-mac-dist.sh

# 선택 사항: 릴리스와 함께 dSYM도 배포합니다.
ditto -c -k --keepParent apps/macos/.build/release/OpenClaw.app.dSYM dist/OpenClaw-2026.3.9.dSYM.zip
```

## Appcast 항목

Sparkle이 서식 있는 HTML 노트를 렌더링하도록 릴리스 노트 생성기를 사용하세요.

```bash
SPARKLE_PRIVATE_KEY_FILE=/path/to/ed25519-private-key scripts/make_appcast.sh dist/OpenClaw-2026.3.9.zip https://raw.githubusercontent.com/openclaw/openclaw/main/appcast.xml
```

`CHANGELOG.md`에서 HTML 릴리스 노트를 생성하고([`scripts/changelog-to-html.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/changelog-to-html.sh) 사용) 이를 appcast 항목에 포함합니다.
게시할 때는 업데이트된 `appcast.xml`을 릴리스 자산(zip + dSYM)과 함께 커밋하세요.

## 게시 및 검증

- `OpenClaw-2026.3.9.zip`(및 `OpenClaw-2026.3.9.dSYM.zip`)을 태그 `v2026.3.9`의 GitHub 릴리스에 업로드하세요.
- 원시 appcast URL이 내장된 피드와 일치하는지 확인하세요: `https://raw.githubusercontent.com/openclaw/openclaw/main/appcast.xml`.
- 기본 점검:
  - `curl -I https://raw.githubusercontent.com/openclaw/openclaw/main/appcast.xml`가 200을 반환합니다.
  - 자산 업로드 후 `curl -I <enclosure url>`가 200을 반환합니다.
  - 이전 공개 빌드에서 About 탭의 "Check for Updates..."를 실행하고 Sparkle이 새 빌드를 문제없이 설치하는지 확인합니다.

완료의 정의: 서명된 앱과 appcast가 게시되어 있고, 이전에 설치된 버전에서 업데이트 흐름이 작동하며, 릴리스 자산이 GitHub 릴리스에 첨부되어 있습니다.
