---
summary: "`openclaw doctor` の CLI リファレンス (ヘルスチェックとガイド付き修復)"
read_when:
  - 接続や認証に問題があり、解決のためのガイドが必要な場合
  - アップデート後に環境の健全性を確認したい場合
title: "doctor"
x-i18n:
  source_hash: "d6d5cbb3d5a90d2a3de883d5af9ffbad30bf59bd7471231dc54d3428f129d2dc"
---
ゲートウェイや各チャネルのヘルスチェック（健全性確認）と、一般的な問題に対するクイックフィックスを提供します。

関連ドキュメント:
- トラブルシューティング: [トラブルシューティング](/gateway/troubleshooting)
- セキュリティ監査: [セキュリティ](/gateway/security)

## 実行例

```bash
openclaw doctor
openclaw doctor --repair
openclaw doctor --deep
```

補足事項:

- キーチェーンや OAuth の修正といった対話型のプロンプトは、標準入力が TTY であり、かつ `--non-interactive` が指定されて**いない**場合にのみ表示されます。Cron や Telegram 経由などのヘッドレス環境（ターミナルがない状態）では、これらのプロンプトはスキップされます。
- `--fix`（`--repair` の別名）を実行すると、現在の `~/.openclaw/openclaw.json` を `.bak` ファイルとしてバックアップした上で、不明な構成キーを削除し、削除した内容を一覧表示します。
- 状態の整合性チェックでは、セッションディレクトリ内の孤立したトランスクリプト（履歴）ファイルを検出し、`.deleted.<timestamp>` としてアーカイブすることで、安全にディスク容量を回収できます。
- `~/.openclaw/cron/jobs.json` (または `cron.store` で指定されたファイル) を走査し、古い形式の Cron ジョブがあれば、実行時に自動正規化される前にその場で最新形式に書き換えます。
- メモリ検索の準備状況もチェックします。埋め込み（embedding）用の認証情報が不足している場合は、`openclaw configure --section model` の実行を推奨します。
- サンドボックスモードが有効になっているにもかかわらず Docker が利用できない場合、解決策（Docker のインストール、または `sandbox.mode` を `off` に設定するコマンド）と共に重要度の高い警告を表示します。

## macOS における `launchctl` 環境変数の上書き

過去に `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (または `...PASSWORD`) を実行したことがある場合、その値が構成ファイルの設定を上書きし、永続的な "unauthorized"（認証エラー）の原因となることがあります。

現在の値を確認する:
```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD
```

上書き設定を解除する:
```bash
launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```
