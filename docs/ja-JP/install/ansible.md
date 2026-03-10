---
summary: "Ansible、Tailscale VPN、およびファイアウォール分離を使用した、自動化され、強化された OpenClaw のインストール"
read_when:
  - セキュリティを強化した自動サーバーデプロイを求めている場合
  - VPN アクセスを備えたファイアウォール分離セットアップが必要な場合
  - リモートの Debian/Ubuntu サーバーにデプロイする場合
title: "Ansible"
---

# Ansible インストール

本番サーバーに OpenClaw をデプロイするための推奨される方法は、**[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** (セキュリティファーストのアーキテクチャを備えた自動インストーラー) を介することです。

## クイックスタート

ワンコマンドインストール:

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

> **📦 完全なガイド: [github.com/openclaw/openclaw-ansible](https://github.com/openclaw/openclaw-ansible)**
>
> openclaw-ansible リポジトリは、Ansible デプロイの信頼できる情報源です。このページは簡単な概要です。

## 得られるもの

- 🔒 **ファイアウォールファーストのセキュリティ**: UFW + Docker の分離 (SSH + Tailscale のみアクセス可能)
- 🔐 **Tailscale VPN**: サービスを公開せずに安全なリモートアクセス
- 🐳 **Docker**: 分離されたサンドボックスコンテナ、localhost のみのバインディング
- 🛡️ **多層防御**: 4層のセキュリティアーキテクチャ
- 🚀 **ワンコマンドセットアップ**: 数分でデプロイ完了
- 🔧 **Systemd 統合**: 強化を伴う起動時の自動開始

## 要件

- **OS**: Debian 11+ または Ubuntu 20.04+
- **アクセス**: Root または sudo 権限
- **ネットワーク**: パッケージインストール用のインターネット接続
- **Ansible**: 2.14+ (クイックスタートスクリプトによって自動的にインストールされます)

## インストールされるもの

Ansible Playbook は以下をインストールおよび設定します:

1. **Tailscale** (安全なリモートアクセス用のメッシュ VPN)
2. **UFW ファイアウォール** (SSH + Tailscale ポートのみ)
3. **Docker CE + Compose V2** (エージェントサンドボックス用)
4. **Node.js 22.x + pnpm** (ランタイムの依存関係)
5. **OpenClaw** (コンテナ化されていない、ホストベース)
6. **Systemd サービス** (セキュリティ強化を伴う自動起動)

注意: Gateway は (**Docker 内ではなく**) **ホスト上で直接**実行されますが、エージェントのサンドボックスは分離のために Docker を使用します。詳細については、[サンドボックス化](/gateway/sandboxing)を参照してください。

## インストール後のセットアップ

インストールが完了したら、openclaw ユーザーに切り替えます:

```bash
sudo -i -u openclaw
```

インストール後スクリプトがガイドします:

1. **オンボーディングウィザード**: OpenClaw の設定
2. **プロバイダのログイン**: WhatsApp/Telegram/Discord/Signal の接続
3. **Gateway テスト**: インストールの確認
4. **Tailscale セットアップ**: VPN メッシュへの接続

### クイックコマンド

```bash
# サービスのステータスを確認
sudo systemctl status openclaw

# ライブログを表示
sudo journalctl -u openclaw -f

# Gateway を再起動
sudo systemctl restart openclaw

# プロバイダログイン (openclaw ユーザーとして実行)
sudo -i -u openclaw
openclaw channels login
```

## セキュリティアーキテクチャ

### 4層防御

1. **ファイアウォール (UFW)**: パブリックに公開されるのは SSH (22) と Tailscale (41641/udp) のみ
2. **VPN (Tailscale)**: Gateway は VPN メッシュ経由でのみアクセス可能
3. **Docker の分離**: DOCKER-USER iptables チェーンは外部ポートの公開を防ぎます
4. **Systemd の強化**: NoNewPrivileges、PrivateTmp、非特権ユーザー

### 検証

外部アタックサーフェスのテスト:

```bash
nmap -p- YOUR_SERVER_IP
```

**ポート 22 のみ** (SSH) が開いていることを確認する必要があります。他のすべてのサービス (Gateway、Docker) はロックダウンされています。

### Docker の可用性

Docker は、Gateway 自体を実行するためではなく、**エージェントのサンドボックス** (分離されたツールの実行) のためにインストールされます。Gateway は localhost のみにバインドされ、Tailscale VPN 経由でアクセスできます。

サンドボックスの設定については、[マルチエージェント サンドボックスとツール](/tools/multi-agent-sandbox-tools)を参照してください。

## 手動インストール

自動化よりも手動での制御を好む場合:

```bash
# 1. 前提条件のインストール
sudo apt update && sudo apt install -y ansible git

# 2. リポジトリのクローン
git clone https://github.com/openclaw/openclaw-ansible.git
cd openclaw-ansible

# 3. Ansible コレクションのインストール
ansible-galaxy collection install -r requirements.yml

# 4. Playbook の実行
./run-playbook.sh

# または直接実行します (その後、手動で /tmp/openclaw-setup.sh を実行します)
# ansible-playbook playbook.yml --ask-become-pass
```

## OpenClaw のアップデート

Ansible インストーラーは、手動アップデート用に OpenClaw をセットアップします。標準のアップデートフローについては、[アップデート](/install/updating)を参照してください。

(設定の変更などのために) Ansible Playbook を再実行するには:

```bash
cd openclaw-ansible
./run-playbook.sh
```

注意: これは冪等性があり、複数回実行しても安全です。

## トラブルシューティング

### ファイアウォールが接続をブロックする

ロックアウトされた場合:

- 最初に Tailscale VPN 経由でアクセスできることを確認してください
- SSH アクセス (ポート 22) は常に許可されています
- 設計上、Gateway は Tailscale 経由で**のみ**アクセス可能です

### サービスが開始しない

```bash
# ログを確認
sudo journalctl -u openclaw -n 100

# 権限を確認
sudo ls -la /opt/openclaw

# 手動起動をテスト
sudo -i -u openclaw
cd ~/openclaw
pnpm start
```

### Docker サンドボックスの問題

```bash
# Docker が実行されていることを確認
sudo systemctl status docker

# サンドボックスイメージを確認
sudo docker images | grep openclaw-sandbox

# ない場合はサンドボックスイメージをビルド
cd /opt/openclaw/openclaw
sudo -u openclaw ./scripts/sandbox-setup.sh
```

### プロバイダのログインが失敗する

`openclaw` ユーザーとして実行していることを確認してください:

```bash
sudo -i -u openclaw
openclaw channels login
```

## 高度な設定

詳細なセキュリティアーキテクチャとトラブルシューティングについて:

- [セキュリティアーキテクチャ](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [技術詳細](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [トラブルシューティングガイド](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## 関連

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) — 完全なデプロイガイド
- [Docker](/install/docker) — コンテナ化された Gateway セットアップ
- [サンドボックス化](/gateway/sandboxing) — エージェントサンドボックスの設定
- [マルチエージェント サンドボックスとツール](/tools/multi-agent-sandbox-tools) — エージェントごとの分離
