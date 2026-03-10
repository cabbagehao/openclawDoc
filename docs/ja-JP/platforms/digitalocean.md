---
summary: "DigitalOcean の OpenClaw (シンプルな有料 VPS オプション)"
read_when:
  - DigitalOcean での OpenClaw のセットアップ
  - OpenClaw 用の安価な VPS ホスティングを探しています
title: "デジタルオーシャン"
x-i18n:
  source_hash: "a927c4d61f30b94db1c624ccebfc950f7050ab1b425efc60542f0bc4c629af8b"
---

# DigitalOcean の OpenClaw

## 目標

DigitalOcean で永続的な OpenClaw ゲートウェイを **$6/月** (予約価格の場合は $4/月) で実行します。

月額 $0 のオプションが必要で、ARM + プロバイダー固有の設定を気にしない場合は、[Oracle Cloud ガイド](/platforms/oracle) を参照してください。

## コスト比較 (2026 年)

| プロバイダー       | 計画                       | 仕様                  | 料金/月     | メモ                               |
| ------------------ | -------------------------- | --------------------- | ----------- | ---------------------------------- |
| オラクルクラウド   | いつでも無料 ARM           | 最大 4 OCPU、24GB RAM | $0          | ARM、容量制限 / サインアップの問題 |
| ヘッツナー         | CX22                       | 2 vCPU、4GB RAM       | €3.79 (~$4) | 最安の有料オプション               |
| デジタルオーシャン | 基本                       | 1 vCPU、1GB RAM       | 6ドル       | 簡単な UI、優れたドキュメント      |
| ヴァルター         | クラウドコンピューティング | 1 vCPU、1GB RAM       | 6ドル       | 多くの場所                         |
| リノード           | ナノデ                     | 1 vCPU、1GB RAM       | 5ドル       | 現在は Akamai の一員です           |

**プロバイダーの選択:**

- DigitalOcean: 最もシンプルな UX + 予測可能なセットアップ (このガイド)
- Hetzner: 価格/パフォーマンスが良い ([Hetzner ガイド](/install/hetzner) を参照)
- Oracle Cloud: 月額 $0 の場合もありますが、より複雑で ARM のみです ([Oracle ガイド](/platforms/oracle) を参照)

---

## 前提条件- DigitalOcean アカウント ([$200 の無料クレジットでサインアップ](https://m.do.co/c/signup))

- SSH キー ペア (またはパスワード認証を使用するかどうか)
- ～20分

## 1) ドロップレットを作成する

<Warning>
クリーンなベースイメージ (Ubuntu 24.04 LTS) を使用してください。起動スクリプトとファイアウォールのデフォルトを確認していない限り、サードパーティの Marketplace 1-click イメージを使用しないでください。
</Warning>

1. [DigitalOcean](https://cloud.digitalocean.com/)にログインします。
2. [**作成 → ドロップレット**] をクリックします。
3. 以下を選択します。
   - **地域:** あなた (またはあなたのユーザー) に最も近い地域
   - **画像:** Ubuntu 24.04 LTS
   - **サイズ:** ベーシック → 通常 → **$6/月** (1 vCPU、1GB RAM、25GB SSD)
   - **認証:** SSH キー (推奨) またはパスワード
4. [**ドロップレットの作成**] をクリックします。
5. IP アドレスをメモします。

## 2) SSH経由で接続する

```bash
ssh root@YOUR_DROPLET_IP
```

## 3) OpenClaw をインストールする

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs

# Install OpenClaw
curl -fsSL https://openclaw.ai/install.sh | bash

# Verify
openclaw --version
```

## 4) オンボーディングを実行する

```bash
openclaw onboard --install-daemon
```

ウィザードの手順は次のとおりです。

- モデル認証 (API キーまたは OAuth)
- チャンネル設定 (Telegram、WhatsApp、Discord など)
- ゲートウェイトークン（自動生成）
- デーモンのインストール (systemd)

## 5) ゲートウェイを確認する

```bash
# Check status
openclaw status

# Check service
systemctl --user status openclaw-gateway.service

# View logs
journalctl --user -u openclaw-gateway.service -f
```

## 6) ダッシュボードにアクセスする

ゲートウェイはデフォルトでループバックにバインドされます。コントロール UI にアクセスするには:

**オプション A: SSH トンネル (推奨)**

```bash
# From your local machine
ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP

# Then open: http://localhost:18789
```

**オプション B: テールスケール サーブ (HTTPS、ループバックのみ)**

```bash
# On the droplet
curl -fsSL https://tailscale.com/install.sh | sh
tailscale up

# Configure Gateway to use Tailscale Serve
openclaw config set gateway.tailscale.mode serve
openclaw gateway restart
```

開く: `https://<magicdns>/`

注:- Serve はゲートウェイ ループバックのみを維持し、Tailscale ID ヘッダーを介してコントロール UI/WebSocket トラフィックを認証します (トークンレス認証は信頼されたゲートウェイ ホストを前提としています。HTTP API では依然としてトークン/パスワードが必要です)。

- 代わりにトークン/パスワードを要求するには、`gateway.auth.allowTailscale: false` を設定するか、`gateway.auth.mode: "password"` を使用します。

**オプション C: テールネット バインド (サーブなし)**

```bash
openclaw config set gateway.bind tailnet
openclaw gateway restart
```

開く: `http://<tailscale-ip>:18789` (トークンが必要)。

## 7) チャンネルを接続する

### 電報

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

### WhatsApp

```bash
openclaw channels login whatsapp
# Scan QR code
```

他のプロバイダーについては、[チャネル](/channels) を参照してください。

---

## 1GB RAM の最適化

6 ドルのドロップレットには 1GB RAM しかありません。物事をスムーズに進めるには:

### スワップを追加する (推奨)

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### 軽量モデルを使用する

OOM に遭遇している場合は、次のことを考慮してください。

- ローカル モデルの代わりに API ベースのモデル (Claude、GPT) を使用する
- `agents.defaults.model.primary` をより小さいモデルに設定する

### モニターメモリ

```bash
free -h
htop
```

---

## 永続性

すべての州は以下に属します。

- `~/.openclaw/` — 構成、認証情報、セッション データ
- `~/.openclaw/workspace/` — ワークスペース (SOUL.md、メモリなど)

これらは再起動しても存続します。定期的にバックアップしてください。

```bash
tar -czvf openclaw-backup.tar.gz ~/.openclaw ~/.openclaw/workspace
```

---

## Oracle Cloudの無料代替手段

| Oracle Cloudは、ここでの有料オプションよりも大幅に強力な**常に無料**のARMインスタンスを月額0ドルで提供します。 | 得られるもの               | 仕様 |
| -------------------------------------------------------------------------------------------------------------- | -------------------------- | ---- |
| **4 OCPU**                                                                                                     | ARM アンペア A1            |
| **24GB RAM**                                                                                                   | 十分すぎる                 |
| **200GB ストレージ**                                                                                           | ブロックボリューム         |
| **永久無料**                                                                                                   | クレジットカード手数料なし |

**注意事項:**

- サインアップは難しい場合があります (失敗した場合は再試行してください)
- ARM アーキテクチャ — ほとんどの機能は動作しますが、一部のバイナリには ARM ビルドが必要です

完全な設定ガイドについては、「[Oracle Cloud](/platforms/oracle)」を参照してください。サインアップのヒントと登録プロセスのトラブルシューティングについては、この [コミュニティ ガイド](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) を参照してください。

---

## トラブルシューティング

### ゲートウェイが起動しない

```bash
openclaw gateway status
openclaw doctor --non-interactive
journalctl -u openclaw --no-pager -n 50
```

### ポートはすでに使用されています

```bash
lsof -i :18789
kill <PID>
```

### メモリ不足です

```bash
# Check memory
free -h

# Add more swap
# Or upgrade to $12/mo droplet (2GB RAM)
```

---

## 関連項目

- [Hetzner ガイド](/install/hetzner) — より安く、より強力に
- [Docker インストール](/install/docker) — コンテナ化されたセットアップ
- [Tailscale](/gateway/tailscale) — 安全なリモート アクセス
- [構成](/gateway/configuration) — 完全な構成リファレンス
