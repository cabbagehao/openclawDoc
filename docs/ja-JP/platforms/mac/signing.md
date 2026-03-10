---
summary: "スクリプトのパッケージ化によって生成される macOS デバッグ ビルドの署名手順"
read_when:
  - Mac デバッグ ビルドのビルドまたは署名
title: "macOS の署名"
x-i18n:
  source_hash: "403b92f9a0ecdb7cb42ec097c684b7a696be3696d6eece747314a4dc90d8797e"
---

# mac 署名 (デバッグ ビルド)

このアプリは通常、[`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) から構築されますが、現在は次のようになります。- 安定したデバッグ バンドル識別子を設定します: `ai.openclaw.mac.debug`

- そのバンドル ID を使用して Info.plist を書き込みます (`BUNDLE_ID=...` によるオーバーライド)
- [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) を呼び出してメイン バイナリとアプリ バンドルに署名します。これにより、macOS は各リビルドを同じ署名付きバンドルとして扱い、TCC 権限 (通知、アクセシビリティ、画面録画、マイク、音声) を保持します。安定したアクセス許可を得るには、実際の署名 ID を使用してください。アドホックはオプトインであり、脆弱です ([macOS のアクセス許可](/platforms/mac/permissions) を参照)。
- デフォルトでは `CODESIGN_TIMESTAMP=auto` を使用します。これにより、開発者 ID 署名の信頼できるタイムスタンプが有効になります。 `CODESIGN_TIMESTAMP=off` を設定してタイムスタンプをスキップします (オフライン デバッグ ビルド)。
- Info.plist: `OpenClawBuildTimestamp` (UTC) および `OpenClawGitCommit` (ショート ハッシュ) にビルド メタデータを挿入し、About ペインにビルド、git、およびデバッグ/リリース チャネルを表示できるようにします。
- **パッケージ化にはノード 22+ が必要です**: スクリプトは TS ビルドとコントロール UI ビルドを実行します。
- 環境から `SIGN_IDENTITY` を読み取ります。 `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` (または開発者 ID アプリケーション証明書) をシェル rc に追加して、常に証明書で署名します。アドホック署名には、`ALLOW_ADHOC_SIGNING=1` または `SIGN_IDENTITY="-"` による明示的なオプトインが必要です (権限テストには推奨されません)。
- 署名後にチーム ID 監査を実行しますが、アプリ バンドル内のいずれかの Mach-O が別のチーム ID によって署名されている場合は失敗します。 `SKIP_TEAM_ID_CHECK=1` をバイパスに設定します。

## 使用法

```bash
# from repo root
scripts/package-mac-app.sh               # auto-selects identity; errors if none found
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # real cert
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh    # ad-hoc (permissions will not stick)
SIGN_IDENTITY="-" scripts/package-mac-app.sh        # explicit ad-hoc (same caveat)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh   # dev-only Sparkle Team ID mismatch workaround
```

### アドホック署名メモ`SIGN_IDENTITY="-"` (アドホック) で署名すると、スクリプトは **強化されたランタイム** (`--options runtime`) を自動的に無効にします。これは、アプリが同じチーム ID を共有しない埋め込みフレームワーク (Sparkle など) を読み込もうとするときにクラッシュを防ぐために必要です。アドホック署名は TCC 権限の永続性も破壊します。回復手順については、[macOS のアクセス許可](/platforms/mac/permissions) を参照してください

## About のメタデータを構築する

`package-mac-app.sh` はバンドルに次のスタンプを付けます。

- `OpenClawBuildTimestamp`: パッケージ時の ISO8601 UTC
- `OpenClawGitCommit`: 短い git ハッシュ (利用できない場合は `unknown`)

[バージョン情報] タブでは、これらのキーを読み取り、バージョン、ビルド日、git コミット、およびデバッグ ビルド (`#if DEBUG` 経由) かどうかを表示します。コードの変更後にパッケージャーを実行してこれらの値を更新します。

## なぜ

TCC 権限は、バンドル識別子とコード署名に関連付けられています。 UUID が変更された未署名のデバッグ ビルドにより、再構築のたびに macOS が許可を忘れる原因となっていました。バイナリに署名し (デフォルトではアドホック)、固定バンドル ID/パス (`dist/OpenClaw.app`) を維持すると、VibeTunnel アプローチと一致して、ビルド間の許可が保持されます。
