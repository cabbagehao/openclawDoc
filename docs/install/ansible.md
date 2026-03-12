---
summary: "Ansible、Tailscale VPN、ファイアウォール分離を使った、自動化された堅牢な OpenClaw インストール"
description: "openclaw-ansible を使って、本番サーバーへ安全に OpenClaw を自動導入する手順と運用方法をまとめます。"
read_when:
  - セキュリティを考慮した自動サーバーデプロイを行いたいとき
  - VPN 経由のみで到達できる、ファイアウォール分離構成が必要なとき
  - リモートの Debian / Ubuntu サーバーへデプロイするとき
title: "Ansible"
seoTitle: "Ansible と Tailscale で OpenClaw を自動構築する導入手順"
x-i18n:
  source_hash: "b1e1e1ea13bff37b22bc58dad4b15a2233c6492771403dff364c738504aa7159"
---
OpenClaw を本番サーバーへデプロイする推奨手段は、**[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** を使う方法です。これは、セキュリティを優先した設計の自動インストーラーです。

## クイックスタート

1 コマンドでインストールできます。

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

> **完全ガイド: [github.com/openclaw/openclaw-ansible](https://github.com/openclaw/openclaw-ansible)**
>
> Ansible デプロイに関する一次情報は `openclaw-ansible` リポジトリです。このページは概要だけをまとめています。

## 導入されるもの

- **ファイアウォール優先のセキュリティ**: UFW + Docker 分離により、外部公開は SSH と Tailscale のみ
- **Tailscale VPN**: サービスを公開せずに安全なリモートアクセスを確保
- **Docker**: 分離されたサンドボックスコンテナを提供し、localhost バインドを維持
- **多層防御**: 4 層のセキュリティアーキテクチャ
- **1 コマンドセットアップ**: 数分で一式をデプロイ
- **systemd 統合**: ハードニング付きで起動時に自動起動

## 要件

- **OS**: Debian 11 以降、または Ubuntu 20.04 以降
- **権限**: root または sudo 権限
- **ネットワーク**: パッケージを取得できるインターネット接続
- **Ansible**: 2.14 以降 (クイックスタートスクリプトが自動で導入)

## インストールされる内容

Ansible playbook では、次をインストールして設定します。

1. **Tailscale** (安全なリモートアクセス用のメッシュ VPN)
2. **UFW firewall** (SSH + Tailscale のポートのみ許可)
3. **Docker CE + Compose V2** (エージェント用サンドボックスで使用)
4. **Node.js 22.x + pnpm** (実行に必要な依存関係)
5. **OpenClaw** (コンテナ化せず、ホスト上で実行)
6. **systemd service** (セキュリティ強化付きの自動起動)

補足: ゲートウェイ自体は **Docker ではなくホスト上で直接動作** します。一方で、エージェントのサンドボックスは Docker を使って分離します。詳細は [Sandboxing](/gateway/sandboxing) を参照してください。

## インストール後のセットアップ

インストールが完了したら、`openclaw` ユーザーへ切り替えます。

```bash
sudo -i -u openclaw
```

post-install スクリプトの案内に従って、次を進めます。

1. **オンボーディングウィザード**: OpenClaw の基本設定
2. **プロバイダーログイン**: WhatsApp / Telegram / Discord / Signal の接続
3. **ゲートウェイテスト**: インストール結果の確認
4. **Tailscale セットアップ**: VPN メッシュへの参加

### よく使うコマンド

```bash
# サービス状態の確認
sudo systemctl status openclaw

# ライブログの確認
sudo journalctl -u openclaw -f

# ゲートウェイの再起動
sudo systemctl restart openclaw

# プロバイダーログイン (openclaw ユーザーで実行)
sudo -i -u openclaw
openclaw channels login
```

## セキュリティアーキテクチャ

### 4 層防御

1. **Firewall (UFW)**: 公開されるのは SSH (22) と Tailscale (41641/udp) のみ
2. **VPN (Tailscale)**: ゲートウェイには VPN メッシュ経由でのみ到達可能
3. **Docker isolation**: `DOCKER-USER` iptables チェーンで外部ポート公開を防止
4. **Systemd hardening**: `NoNewPrivileges`、`PrivateTmp`、非特権ユーザーで実行

### 検証

外部から見える攻撃面は次で確認できます。

```bash
nmap -p- YOUR_SERVER_IP
```

**開いているのは 22 番ポート (SSH) のみ** であるべきです。その他のサービス (ゲートウェイ、Docker) はすべて閉じられている想定です。

### Docker の位置づけ

Docker は **エージェント用サンドボックス** (隔離されたツール実行環境) のために導入されます。ゲートウェイ本体は Docker 上では動かず、localhost のみにバインドされ、Tailscale VPN 経由でアクセスします。

サンドボックス設定の詳細は [Multi-Agent Sandbox & Tools](/tools/multi-agent-sandbox-tools) を参照してください。

## 手動インストール

自動化ではなく、手順を手元で制御したい場合は次の流れでも導入できます。

```bash
# 1. 前提パッケージを導入
sudo apt update && sudo apt install -y ansible git

# 2. リポジトリを clone
git clone https://github.com/openclaw/openclaw-ansible.git
cd openclaw-ansible

# 3. Ansible collections を導入
ansible-galaxy collection install -r requirements.yml

# 4. Playbook を実行
./run-playbook.sh

# あるいは直接実行 (その場合は後で /tmp/openclaw-setup.sh を手動実行)
# ansible-playbook playbook.yml --ask-become-pass
```

## OpenClaw の更新

Ansible インストーラーで構築した環境では、OpenClaw 本体の更新は手動運用になります。標準の更新手順は [Updating](/install/updating) を参照してください。

設定変更などで Ansible playbook を再実行したい場合は、次を使います。

```bash
cd openclaw-ansible
./run-playbook.sh
```

補足: この処理は冪等であり、複数回実行しても安全です。

## トラブルシューティング

### Firewall によって接続できない

接続できなくなった場合は、次を確認してください。

- まず Tailscale VPN 経由で入れることを確認する
- SSH (22 番ポート) は常に許可されている
- ゲートウェイは設計上 **Tailscale 経由でのみ** 到達可能

### Service が起動しない

```bash
# ログを確認
sudo journalctl -u openclaw -n 100

# 権限を確認
sudo ls -la /opt/openclaw

# 手動起動を試す
sudo -i -u openclaw
cd ~/openclaw
pnpm start
```

### Docker サンドボックスに問題がある

```bash
# Docker の状態を確認
sudo systemctl status docker

# サンドボックスイメージを確認
sudo docker images | grep openclaw-sandbox

# イメージがなければビルド
cd /opt/openclaw/openclaw
sudo -u openclaw ./scripts/sandbox-setup.sh
```

### プロバイダーログインが失敗する

`openclaw` ユーザーとして実行していることを確認してください。

```bash
sudo -i -u openclaw
openclaw channels login
```

## 高度な設定

セキュリティアーキテクチャや詳細な調査手順は、次の資料を参照してください。

- [Security Architecture](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [Technical Details](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [Troubleshooting Guide](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## 関連項目

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) — 完全なデプロイガイド
- [Docker](/install/docker) — コンテナ化したゲートウェイ構成
- [Sandboxing](/gateway/sandboxing) — エージェントサンドボックス設定
- [Multi-Agent Sandbox & Tools](/tools/multi-agent-sandbox-tools) — エージェント単位の分離
