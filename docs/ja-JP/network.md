---
summary: "ネットワーク ハブ: ゲートウェイ サーフェス、ペアリング、検出、セキュリティ"
read_when:
  - ネットワーク アーキテクチャとセキュリティの概要が必要です
  - ローカルとテールネットのアクセスまたはペアリングをデバッグしています
  - ネットワーキング ドキュメントの正規リストが必要な場合
title: "ネットワーク"
x-i18n:
  source_hash: "6a0d5080db73de4c21d9bf376059f6c4a26ab129c8280ce6b1f54fa9ace48beb"
---

# ネットワークハブ

このハブは、OpenClaw の接続、ペアリング、セキュリティの確保方法に関するコア ドキュメントにリンクしています。
ローカルホスト、LAN、テールネット上のデバイス。

## コアモデル

- [ゲートウェイ アーキテクチャ](/concepts/architecture)
- [ゲートウェイプロトコル](/gateway/protocol)
- [ゲートウェイ ランブック](/gateway)
- [Web サーフェス + バインド モード](/web)

## ペアリング + ID

- [ペアリングの概要 (DM + ノード)](/channels/pairing)
- [ゲートウェイ所有ノードのペアリング](/gateway/pairing)
- [デバイス CLI (ペアリング + トークン ローテーション)](/cli/devices)
- [CLI のペアリング (DM 承認)](/cli/pairing)

ローカルの信頼:

- ローカル接続 (ループバックまたはゲートウェイ ホスト自身のテールネット アドレス) は、
  ペアリングが自動承認されるため、同じホストの UX がスムーズに保たれます。
- 非ローカル テールネット/LAN クライアントでも、明示的なペアリングの承認が必要です。

## ディスカバリー + トランスポート

- [発見と輸送](/gateway/discovery)
- [Bonjour / mDNS](/gateway/bonjour)
- [リモートアクセス(SSH)](/gateway/remote)
- [尾鱗](/gateway/tailscale)

## ノード + トランスポート

- [ノードの概要](/nodes)
- [ブリッジプロトコル(レガシーノード)](/gateway/bridge-protocol)
- [ノード ランブック: iOS](/platforms/ios)
- [ノード ランブック: Android](/platforms/android)

## セキュリティ

- [セキュリティの概要](/gateway/security)
- [ゲートウェイ構成リファレンス](/gateway/configuration)
- [トラブルシューティング](/gateway/troubleshooting)
- [博士](/gateway/doctor)
