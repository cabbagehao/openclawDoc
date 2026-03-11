---
summary: "OpenClaw macOS リリース チェックリスト（Sparkle フィード、パッケージ化、署名）"
read_when:
  - OpenClaw macOS リリースの作成または検証
  - Sparkle の appcast やフィード アセットを更新するとき
title: "macOS リリース"
x-i18n:
  source_hash: "df73aa6c64c15917a7a370c7880bafbab73f9083839d0debafc16bff2f3990a6"
---

# OpenClaw macOS リリース（Sparkle）

このアプリは Sparkle による自動更新を同梱しています。リリース ビルドは、Developer ID で署名し、zip 化したうえで、署名済みの appcast エントリと一緒に公開する必要があります。

## 前提条件

* Developer ID Application 証明書がインストールされていること（例: `Developer ID Application: <Developer Name> (<TEAMID>)`）。
* Sparkle の秘密鍵パスを `SPARKLE_PRIVATE_KEY_FILE` として環境変数に設定していること（Sparkle の ed25519 秘密鍵へのパス。公開鍵は `Info.plist` に組み込まれます）。見つからない場合は `~/.profile` を確認してください。
* Gatekeeper で安全な DMG / zip 配布を行う場合は、`xcrun notarytool` 用の認証情報（キーチェーン プロファイルまたは API キー）が必要です。
  * 使用しているキーチェーン プロファイル名は `openclaw-notary` です。これはシェル プロファイル内の App Store Connect API キー環境変数から作成します。
    * `APP_STORE_CONNECT_API_KEY_P8`
    * `APP_STORE_CONNECT_KEY_ID`
    * `APP_STORE_CONNECT_ISSUER_ID`
    * `echo "$APP_STORE_CONNECT_API_KEY_P8" | sed 's/\\n/\n/g' > /tmp/openclaw-notary.p8`
    * `xcrun notarytool store-credentials "openclaw-notary" --key /tmp/openclaw-notary.p8 --key-id "$APP_STORE_CONNECT_KEY_ID" --issuer "$APP_STORE_CONNECT_ISSUER_ID"`
* `pnpm` 依存関係をインストール済みであること（`pnpm install --config.node-linker=hoisted`）。
* Sparkle ツールは `apps/macos/.build/artifacts/sparkle/Sparkle/bin/` に SwiftPM 経由で自動取得されます（`sign_update`、`generate_appcast` など）。

## ビルドとパッケージ化

注意:

* `APP_BUILD` は `CFBundleVersion` / `sparkle:version` に対応します。Sparkle の比較が正しく動くよう、数値のみで単調増加にしてください（`-beta` は不可）。
* `APP_BUILD` を省略した場合、`scripts/package-mac-app.sh` は `APP_VERSION` から Sparkle 安全な既定値を導出します（`YYYYMMDDNN` 形式。安定版は `90`、プレリリースはサフィックス由来のレーンを使用）。その値と git のコミット数を比較し、大きい方を採用します。
* リリース エンジニアリング上、特定の単調増加値が必要であれば、`APP_BUILD` を明示的に上書きできます。
* `BUILD_CONFIG=release` の場合、`scripts/package-mac-app.sh` は既定でユニバーサル ビルド（`arm64 x86_64`）になります。必要であれば `BUILD_ARCHS=arm64` または `BUILD_ARCHS=x86_64` で上書きできます。ローカル / 開発ビルド（`BUILD_CONFIG=debug`）では、既定で現在のアーキテクチャ（`$(uname -m)`）を使用します。
* リリース用アーティファクト（zip + DMG + 公証）には `scripts/package-mac-dist.sh` を使います。ローカル / 開発用のパッケージングには `scripts/package-mac-app.sh` を使ってください。

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

## appcast エントリ

Sparkle が整形済み HTML のリリース ノートを表示できるよう、リリース ノート生成スクリプトを使用します。

```bash
SPARKLE_PRIVATE_KEY_FILE=/path/to/ed25519-private-key scripts/make_appcast.sh dist/OpenClaw-2026.3.9.zip https://raw.githubusercontent.com/openclaw/openclaw/main/appcast.xml
```

このスクリプトは `CHANGELOG.md` から HTML リリース ノートを生成し（[`scripts/changelog-to-html.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/changelog-to-html.sh) 経由）、appcast エントリへ埋め込みます。公開時には、更新済みの `appcast.xml` をリリース アセット（zip + dSYM）と一緒にコミットしてください。

## 公開と検証

* `OpenClaw-2026.3.9.zip`（および `OpenClaw-2026.3.9.dSYM.zip`）を、タグ `v2026.3.9` の GitHub リリースへアップロードします。
* 生の appcast URL がアプリに組み込まれたフィード URL と一致することを確認します: `https://raw.githubusercontent.com/openclaw/openclaw/main/appcast.xml`
* 健全性チェック:
  * `curl -I https://raw.githubusercontent.com/openclaw/openclaw/main/appcast.xml` が 200 を返すこと
  * アセットのアップロード後、`curl -I <enclosure url>` が 200 を返すこと
  * 以前の公開ビルドで About タブから `Check for Updates…` を実行し、Sparkle が新しいビルドを正常にインストールできること

完了条件: 署名済みアプリと appcast が公開されており、古いインストール済みバージョンから更新フローが正常に動作し、リリース アセットが GitHub リリースへ添付されていることです。
