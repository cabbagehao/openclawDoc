---
summary: "スクリプトのパッケージ化によって生成される macOS デバッグ ビルドの署名手順"
read_when:
  - macOS の debug ビルドをビルドまたは署名するとき
title: "macOS の署名"
x-i18n:
  source_hash: "403b92f9a0ecdb7cb42ec097c684b7a696be3696d6eece747314a4dc90d8797e"
---

# mac signing (debug builds)

このアプリは通常 [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) からビルドします。このスクリプトは現在、次の処理を行います。

* 安定した debug 用 bundle identifier `ai.openclaw.mac.debug` を設定します。
* その bundle ID を使って Info.plist を書き出します (`BUNDLE_ID=...` で上書き可能)。
* [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) を呼び出し、メイン バイナリと app bundle に署名します。これにより macOS は各 rebuild を同一の署名済み bundle と見なし、TCC のアクセス許可 (notifications、accessibility、screen recording、microphone、speech) を維持しやすくなります。安定した権限を維持したい場合は実際の署名 identity を使ってください。ad-hoc は明示的な opt-in であり、壊れやすい方式です ([macOS のアクセス許可](/platforms/mac/permissions) を参照)。
* 既定では `CODESIGN_TIMESTAMP=auto` を使います。これは Developer ID 署名に trusted timestamp を付与します。オフライン debug ビルドでは `CODESIGN_TIMESTAMP=off` にして timestamp 付与を省略できます。
* Info.plist に build metadata を埋め込みます。`OpenClawBuildTimestamp` (UTC) と `OpenClawGitCommit` (short hash) を追加し、About pane に build 情報、git 情報、debug/release channel を表示できるようにします。
* **パッケージ化には Node 22 以降が必要です**。このスクリプトは TypeScript build と Control UI build を実行します。
* `SIGN_IDENTITY` を環境変数から読み取ります。常に自分の証明書で署名したい場合は、`export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` (または Developer ID Application 証明書) を shell rc に追加してください。ad-hoc 署名を使うには `ALLOW_ADHOC_SIGNING=1` または `SIGN_IDENTITY="-"` を明示的に指定する必要があります。権限テストには推奨されません。
* 署名後に Team ID の監査を実行し、app bundle 内のいずれかの Mach-O が別の Team ID で署名されていた場合は失敗します。必要なら `SKIP_TEAM_ID_CHECK=1` で回避できます。

## 使い方

```bash
# from repo root
scripts/package-mac-app.sh               # auto-selects identity; errors if none found
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # real cert
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh    # ad-hoc (permissions will not stick)
SIGN_IDENTITY="-" scripts/package-mac-app.sh        # explicit ad-hoc (same caveat)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh   # dev-only Sparkle Team ID mismatch workaround
```

### ad-hoc 署名に関する注意

`SIGN_IDENTITY="-"` (ad-hoc) で署名した場合、スクリプトは **Hardened Runtime** (`--options runtime`) を自動的に無効化します。これは、同じ Team ID を共有しない埋め込みフレームワーク (Sparkle など) の読み込み時にクラッシュするのを防ぐために必要です。ad-hoc 署名は TCC アクセス許可の永続化も壊します。復旧手順は [macOS のアクセス許可](/platforms/mac/permissions) を参照してください。

## About 向けの build metadata

`package-mac-app.sh` は bundle に次の値を埋め込みます。

* `OpenClawBuildTimestamp`: パッケージ時点の ISO8601 UTC
* `OpenClawGitCommit`: 短い git hash (取得できない場合は `unknown`)

About タブでは、これらのキーを読み取り、バージョン、build 日時、git commit、debug build かどうか (`#if DEBUG`) を表示します。コード変更後にこれらを更新したい場合は、packager を再実行してください。

## 背景

TCC アクセス許可は、bundle identifier とコード署名の両方に結び付いています。UUID が毎回変わる未署名の debug build では、rebuild のたびに macOS が付与済み権限を忘れていました。バイナリに署名し、固定の bundle ID / パス (`dist/OpenClaw.app`) を維持することで、VibeTunnel と同じ考え方で build 間の権限維持を狙っています。
