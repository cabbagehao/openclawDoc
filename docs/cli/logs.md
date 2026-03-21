---
summary: "「openclaw ログ」の CLI リファレンス (RPC 経由のテール ゲートウェイ ログ)"
read_when:
  - ゲートウェイのログをリモートで追跡する必要があります (SSH を使用しない)
  - ツール用に JSON ログ行が必要な場合
title: "logs"
seoTitle: "OpenClaw CLI: openclaw logs コマンドの使い方と主要オプション・実行例"
description: "Tail Gateway ファイルは RPC 経由でログを記録します (リモート モードで動作します)。例を確認できます。"
x-i18n:
  source_hash: "81be02b6f8acad32ccf2d280827c7188a3c2f6bba0de5cbfa39fcc0bee3129cd"
---
Tail Gateway ファイルは RPC 経由でログを記録します (リモート モードで動作します)。

関連:

- ロギングの概要: [ロギング](/logging)

## 例

```bash
openclaw logs
openclaw logs --follow
openclaw logs --json
openclaw logs --limit 500
openclaw logs --local-time
openclaw logs --follow --local-time
```

`--local-time` を使用して、ローカル タイムゾーンでタイムスタンプをレンダリングします。
