---
summary: "OpenClaw macOS リリース チェックリスト (Sparkle フィード、パッケージ化、署名)"
read_when:
  - OpenClaw macOS リリースのカットまたは検証
  - Sparkle アプリキャストまたはフィード アセットの更新
title: "macOS リリース"
x-i18n:
  source_hash: "df73aa6c64c15917a7a370c7880bafbab73f9083839d0debafc16bff2f3990a6"
---

# OpenClaw macOS リリース (Sparkle)

このアプリには Sparkle 自動アップデートが同梱されるようになりました。リリース ビルドは、開発者 ID で署名され、圧縮され、署名されたアプリキャスト エントリとともに公開される必要があります。

## 前提条件

- 開発者 ID アプリケーション証明書がインストールされている (例: `Developer ID Application: <Developer Name> (<TEAMID>)`)。
- `SPARKLE_PRIVATE_KEY_FILE` として環境に設定された Sparkle 秘密キーのパス (Sparkle ed25519 秘密キーへのパス。公開キーは Info.plist に焼き付けられます)。見つからない場合は、`~/.profile` を確認してください。
- Gatekeeper で安全な DMG/zip 配布が必要な場合は、`xcrun notarytool` の公証人認証情報 (キーチェーン プロファイルまたは API キー)。
  - シェル プロファイルの App Store Connect API キー環境変数から作成された、`openclaw-notary` という名前のキーチェーン プロファイルを使用します。
    - `APP_STORE_CONNECT_API_KEY_P8`、`APP_STORE_CONNECT_KEY_ID`、`APP_STORE_CONNECT_ISSUER_ID`
    - `echo "$APP_STORE_CONNECT_API_KEY_P8" | sed 's/\\n/\n/g' > /tmp/openclaw-notary.p8`
    - `xcrun notarytool store-credentials "openclaw-notary" --key /tmp/openclaw-notary.p8 --key-id "$APP_STORE_CONNECT_KEY_ID" --issuer "$APP_STORE_CONNECT_ISSUER_ID"`
- `pnpm` がインストールされています (`pnpm install --config.node-linker=hoisted`)。
- Sparkle ツールは、`apps/macos/.build/artifacts/sparkle/Sparkle/bin/` (`sign_update`、`generate_appcast` など) で SwiftPM 経由で自動的に取得されます。

## ビルドとパッケージ化

注:- `APP_BUILD` は `CFBundleVersion`/`sparkle:version` にマップされます。数値 + 単調 (`-beta` ではありません) を維持しないと、Sparkle はそれを等しいものとして比較します。

- `APP_BUILD` が省略された場合、`scripts/package-mac-app.sh` は `APP_VERSION` から Sparkle セーフのデフォルトを導出し (`YYYYMMDDNN`: 安定したデフォルトは `90`、プレリリースはサフィックス由来のレーンを使用します)、その値と git の大きい方を使用します。コミット数。
- リリース エンジニアリングで特定の単調値が必要な場合は、`APP_BUILD` を明示的にオーバーライドできます。
- `BUILD_CONFIG=release` の場合、`scripts/package-mac-app.sh` はデフォルトでユニバーサル (`arm64 x86_64`) に自動的に設定されるようになりました。 `BUILD_ARCHS=arm64` または `BUILD_ARCHS=x86_64` を使用してオーバーライドすることもできます。ローカル/開発ビルド (`BUILD_CONFIG=debug`) の場合、デフォルトは現在のアーキテクチャ (`$(uname -m)`) になります。
- リリース アーティファクト (zip + DMG + 公証) には `scripts/package-mac-dist.sh` を使用します。ローカル/開発パッケージには `scripts/package-mac-app.sh` を使用してください。

```bash
# From repo root; set release IDs so Sparkle feed is enabled.
# This command builds release artifacts without notarization.
# APP_BUILD must be numeric + monotonic for Sparkle compare.
# Default is auto-derived from APP_VERSION when omitted.
SKIP_NOTARIZE=1 \
BUNDLE_ID=ai.openclaw.mac \
APP_VERSION=2026.3.9 \
BUILD_CONFIG=release \
SIGN_IDENTITY="Developer ID Application: <Developer Name> (<TEAMID>)" \
scripts/package-mac-dist.sh

# `package-mac-dist.sh` already creates the zip + DMG.
# If you used `package-mac-app.sh` directly instead, create them manually:
# If you want notarization/stapling in this step, use the NOTARIZE command below.
ditto -c -k --sequesterRsrc --keepParent dist/OpenClaw.app dist/OpenClaw-2026.3.9.zip

# Optional: build a styled DMG for humans (drag to /Applications)
scripts/create-dmg.sh dist/OpenClaw.app dist/OpenClaw-2026.3.9.dmg

# Recommended: build + notarize/staple zip + DMG
# First, create a keychain profile once:
#   xcrun notarytool store-credentials "openclaw-notary" \
#     --apple-id "<apple-id>" --team-id "<team-id>" --password "<app-specific-password>"
NOTARIZE=1 NOTARYTOOL_PROFILE=openclaw-notary \
BUNDLE_ID=ai.openclaw.mac \
APP_VERSION=2026.3.9 \
BUILD_CONFIG=release \
SIGN_IDENTITY="Developer ID Application: <Developer Name> (<TEAMID>)" \
scripts/package-mac-dist.sh

# Optional: ship dSYM alongside the release
ditto -c -k --keepParent apps/macos/.build/release/OpenClaw.app.dSYM dist/OpenClaw-2026.3.9.dSYM.zip
```

## アプリキャスト エントリ

リリース ノート ジェネレーターを使用して、Sparkle がフォーマットされた HTML ノートをレンダリングします。

```bash
SPARKLE_PRIVATE_KEY_FILE=/path/to/ed25519-private-key scripts/make_appcast.sh dist/OpenClaw-2026.3.9.zip https://raw.githubusercontent.com/openclaw/openclaw/main/appcast.xml
```

`CHANGELOG.md` ([`scripts/changelog-to-html.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/changelog-to-html.sh) 経由) から HTML リリース ノートを生成し、appcast エントリに埋め込みます。
公開時に、更新された `appcast.xml` をリリース アセット (zip + dSYM) と一緒にコミットします。

## 公開して検証する- `OpenClaw-2026.3.9.zip` (および `OpenClaw-2026.3.9.dSYM.zip`) を、タグ `v2026.3.9` の GitHub リリースにアップロードします

- 生のアプリキャスト URL がベイクされたフィードと一致することを確認します: `https://raw.githubusercontent.com/openclaw/openclaw/main/appcast.xml`。
- 健全性チェック:
  - `curl -I https://raw.githubusercontent.com/openclaw/openclaw/main/appcast.xml` は 200 を返します。
  - アセットのアップロード後、`curl -I <enclosure url>` は 200 を返します。
  - 以前のパブリック ビルドで、[About] タブから [Check for Updates…] を実行し、Sparkle が新しいビルドを正常にインストールすることを確認します。

完了の定義: 署名されたアプリとアプリキャストが公開され、更新フローが古いインストール済みバージョンから機能し、リリース アセットが GitHub リリースに添付されます。
