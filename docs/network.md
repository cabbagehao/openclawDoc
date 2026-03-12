---
summary: "ネットワークハブ: ゲートウェイの接続面、ペアリング、検出、セキュリティ"
read_when:
  - ネットワーク構成とセキュリティの概要を把握したいとき
  - ローカルアクセスと tailnet アクセス、またはペアリングを切り分けるとき
  - ネットワーク関連ドキュメントの正規一覧を確認したいとき
title: "Network"
x-i18n:
  source_hash: "6a0d5080db73de4c21d9bf376059f6c4a26ab129c8280ce6b1f54fa9ace48beb"
---
このハブでは、OpenClaw が localhost、LAN、tailnet をまたいでデバイスと接続し、ペアリングし、安全性を確保するための中核ドキュメントをまとめています。

## コアモデル

- [ゲートウェイアーキテクチャ](/concepts/architecture)
- [ゲートウェイプロトコル](/gateway/protocol)
- [ゲートウェイランブック](/gateway)
- [Web サーフェスと bind mode](/web)

## ペアリングと識別

- [ペアリング概要（DM + ノード）](/channels/pairing)
- [ゲートウェイ管理ノードのペアリング](/gateway/pairing)
- [Devices CLI（ペアリング + トークンローテーション）](/cli/devices)
- [Pairing CLI（DM 承認）](/cli/pairing)

ローカルトラスト:

- ローカル接続（loopback、またはゲートウェイホスト自身の tailnet アドレス）は、同一ホスト上の UX を損なわないよう、ペアリングが自動承認される場合があります
- 非ローカルの tailnet / LAN クライアントでは、引き続き明示的なペアリング承認が必要です

## 検出とトランスポート

- [Discovery と transports](/gateway/discovery)
- [Bonjour / mDNS](/gateway/bonjour)
- [リモートアクセス（SSH）](/gateway/remote)
- [Tailscale](/gateway/tailscale)

## ノードとトランスポート

- [ノード概要](/nodes)
- [Bridge protocol（legacy ノード）](/gateway/bridge-protocol)
- [ノードランブック: iOS](/platforms/ios)
- [ノードランブック: Android](/platforms/android)

## セキュリティ

- [セキュリティ概要](/gateway/security)
- [ゲートウェイ設定リファレンス](/gateway/configuration)
- [トラブルシューティング](/gateway/troubleshooting)
- [Doctor](/gateway/doctor)
