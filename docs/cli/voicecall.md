---
summary: "「openclaw voicecall」の CLI リファレンス (音声通話プラグイン コマンド サーフェス)"
read_when:
  - "音声通話プラグインを使用しており、CLI エントリ ポイントが必要な場合"
  - "`voicecall call|Continue|status|tail|expose` の簡単な例が必要です"
title: "音声通話"
seoTitle: "OpenClaw CLI: openclaw voicecall コマンドの使い方と主要オプション・実行例"
description: "voicecall はプラグインが提供するコマンドです。これは、音声通話プラグインがインストールされ有効になっている場合にのみ表示されます。共通コマンド、Webhook の公開 (Tailscale)を確認できます。"
x-i18n:
  source_hash: "2c99e7a3d256e1c74a0f07faba9675cc5a88b1eb2fc6e22993caf3874d4f340a"
---
`voicecall` はプラグインが提供するコマンドです。これは、音声通話プラグインがインストールされ有効になっている場合にのみ表示されます。

主なドキュメント:

- 音声通話プラグイン：[音声通話](/plugins/voice-call)

## 共通コマンド

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall call --to "+15555550123" --message "Hello" --mode notify
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall end --call-id <id>
```

## Webhook の公開 (Tailscale)

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

セキュリティ上の注意: Webhook エンドポイントは信頼できるネットワークにのみ公開してください。可能であれば、ファネルよりもテールスケール サーブを優先します。
