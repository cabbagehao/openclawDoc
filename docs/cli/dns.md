---
summary: "「openclaw dns」 (広域検出ヘルパー) の CLI リファレンス"
read_when:
  - Tailscale + CoreDNS による広域検出 (DNS-SD) が必要な場合
  - カスタム検出ドメインの分割 DNS を設定している場合 (例: openclaw.internal)
title: "DNS"
seoTitle: "OpenClaw CLI: openclaw dns コマンドの使い方と主要オプション・実行例"
description: "広域検出のための DNS ヘルパー (Tailscale + CoreDNS)。現在は macOS + Homebrew CoreDNS に重点を置いています。"
x-i18n:
  source_hash: "d2011e41982ffb4b71ab98211574529bc1c8b7769ab1838abddd593f42b12380"
---
広域検出のための DNS ヘルパー (Tailscale + CoreDNS)。現在は macOS + Homebrew CoreDNS に重点を置いています。

関連:

- ゲートウェイの検出: [検出](/gateway/discovery)
- 広域検出構成: [構成](/gateway/configuration)

## セットアップ

```bash
openclaw dns setup
openclaw dns setup --apply
```
