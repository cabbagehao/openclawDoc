---
summary: "macOS の権限永続性（TCC）と署名要件"
read_when:
  - macOS の権限プロンプトが出ない、または固まる問題を調査するとき
  - macOS アプリをパッケージ化または署名するとき
  - バンドル ID やアプリのインストール パスを変更するとき
title: "macOS のアクセス許可"
seoTitle: "OpenClawのmacOS のアクセス許可 の仕組み・設定手順・運用ガイド"
description: "macOS のアクセス許可付与は壊れやすい仕組みです。TCC は、許可状態をアプリのコード署名、バンドル識別子、ディスク上の配置パスに結び付けています。このどれかが変わると、macOS は別アプリとして扱い、既存の許可を失ったり、プロンプトを表示しなくなったりします。"
x-i18n:
  source_hash: "250065b964c98c307a075ab9e23bf798f9d247f27befe2e5f271ffef1f497def"
---
macOS のアクセス許可付与は壊れやすい仕組みです。TCC は、許可状態をアプリのコード署名、バンドル識別子、ディスク上の配置パスに結び付けています。このどれかが変わると、macOS は別アプリとして扱い、既存の許可を失ったり、プロンプトを表示しなくなったりします。

## 安定した権限を維持するための要件

- 同じパス: 固定の場所からアプリを起動してください。OpenClaw では `dist/OpenClaw.app` を使用します。
- 同じバンドル ID: バンドル ID を変えると、新しい権限 ID として扱われます。
- 署名済みアプリ: 未署名または ad-hoc 署名のビルドでは、権限は永続化されません。
- 一貫した署名: 再ビルド後も同じ署名になるよう、実際の Apple Development 証明書または Developer ID 証明書を使用してください。

ad-hoc 署名では、ビルドのたびに新しい ID が生成されます。そのため macOS は過去の許可を忘れ、古いエントリを削除するまでプロンプト自体が表示されなくなることがあります。

## プロンプトが消えたときの復旧チェックリスト

1. アプリを終了します。
2. System Settings → Privacy & Security からアプリのエントリを削除します。
3. 同じパスからアプリを再起動し、アクセス許可を再度付与します。
4. それでもプロンプトが出ない場合は、`tccutil` で TCC エントリをリセットして再試行します。
5. 一部の権限は、macOS を完全に再起動しないと再表示されません。

リセット例（必要に応じて bundle ID を差し替えてください）:

```bash
sudo tccutil reset Accessibility ai.openclaw.mac
sudo tccutil reset ScreenCapture ai.openclaw.mac
sudo tccutil reset AppleEvents
```

## ファイルとフォルダーのアクセス許可（Desktop / Documents / Downloads）

macOS は、ターミナルやバックグラウンド プロセスに対しても Desktop、Documents、Downloads へのアクセスを制限する場合があります。ファイル読み取りやディレクトリ一覧が固まる場合は、実際にファイル操作を行うプロセス コンテキストに対してアクセスを付与してください。たとえば Terminal / iTerm、LaunchAgent から起動されたアプリ、SSH プロセスなどが該当します。

回避策として、ファイルを OpenClaw workspace（`~/.openclaw/workspace`）へ移動すれば、フォルダー単位の許可を避けられます。

権限まわりを検証する場合は、必ず実際の証明書で署名してください。ad-hoc ビルドが許容されるのは、権限が重要でない短時間のローカル実行だけです。
