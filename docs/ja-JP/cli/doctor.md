---
summary: "「オープンクロー ドクター」の CLI リファレンス (ヘルスチェック + ガイド付き修復)"
read_when:
  - 接続/認証の問題があり、ガイド付きの修正が必要です
  - 更新したので健全性チェックが必要です
title: "医者"
x-i18n:
  source_hash: "d6d5cbb3d5a90d2a3de883d5af9ffbad30bf59bd7471231dc54d3428f129d2dc"
---

# `openclaw doctor`

ゲートウェイとチャネルのヘルスチェックとクイックフィックス。

関連:

- トラブルシューティング: [トラブルシューティング](/gateway/troubleshooting)
- セキュリティ監査: [セキュリティ](/gateway/security)

## 例

```bash
openclaw doctor
openclaw doctor --repair
openclaw doctor --deep
```

注:

- 対話型プロンプト (キーチェーン/OAuth 修正など) は、標準入力が TTY で、`--non-interactive` が**設定されていない**場合にのみ実行されます。ヘッドレス実行 (cron、Telegram、ターミナルなし) ではプロンプトがスキップされます。
- `--fix` (`--repair` のエイリアス) は、バックアップを `~/.openclaw/openclaw.json.bak` に書き込み、不明な構成キーを削除し、それぞれの削除をリストします。
- 状態整合性チェックでは、セッション ディレクトリ内の孤立したトランスクリプト ファイルが検出され、それらを `.deleted.<timestamp>` としてアーカイブしてスペースを安全に再利用できるようになりました。
- Doctor はまた、レガシー cron ジョブ シェイプの `~/.openclaw/cron/jobs.json` (または `cron.store`) をスキャンし、スケジューラが実行時に自動正規化する前に、適切な場所に再書き込みできます。
- Doctor にはメモリ検索の準備状況チェックが含まれており、埋め込み資格情報が欠落している場合は `openclaw configure --section model` を推奨できます。
- サンドボックス モードが有効になっているが Docker が利用できない場合、医師は修復を伴う高信号警告を報告します (`install Docker` または `openclaw config set agents.defaults.sandbox.mode off`)。

## macOS: `launchctl` 環境オーバーライド

以前に `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (または `...PASSWORD`) を実行した場合、その値が設定ファイルを上書きし、永続的な「不正な」エラーが発生する可能性があります。

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```
