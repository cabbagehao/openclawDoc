---
summary: "DigitalOcean 上で OpenClaw を動かす方法（シンプルな有料 VPS 選択肢）"
read_when:
  - DigitalOcean で OpenClaw をセットアップしたいとき
  - OpenClaw 用の安価な VPS を検討しているとき
title: "DigitalOcean"
x-i18n:
  source_hash: "a927c4d61f30b94db1c624ccebfc950f7050ab1b425efc60542f0bc4c629af8b"
---

# OpenClaw on DigitalOcean

## 目標

DigitalOcean 上で、**月額 6 ドル**（予約価格なら 4 ドル程度）で常時稼働する OpenClaw Gateway を動かします。

月額 0 ドルの選択肢が必要で、ARM や provider 固有のセットアップを許容できるなら、[Oracle Cloud guide](/platforms/oracle) を参照してください。

## コスト比較（2026）

| Provider     | Plan            | Specs                  | Price/mo    | Notes                                 |
| ------------ | --------------- | ---------------------- | ----------- | ------------------------------------- |
| Oracle Cloud | Always Free ARM | up to 4 OCPU, 24GB RAM | $0          | ARM、capacity 制限や signup の癖あり  |
| Hetzner      | CX22            | 2 vCPU, 4GB RAM        | €3.79 (~$4) | 最安クラスの有料選択肢                |
| DigitalOcean | Basic           | 1 vCPU, 1GB RAM        | $6          | UI が分かりやすく docs も充実         |
| Vultr        | Cloud Compute   | 1 vCPU, 1GB RAM        | $6          | ロケーションが多い                    |
| Linode       | Nanode          | 1 vCPU, 1GB RAM        | $5          | 現在は Akamai 傘下                    |

**provider の選び方:**

- DigitalOcean: 最も分かりやすい UX と予測しやすいセットアップ（このガイド）
- Hetzner: 価格性能が良い（[Hetzner guide](/install/hetzner) を参照）
- Oracle Cloud: 月額 0 ドルの可能性がある一方、やや不安定で ARM 限定（[Oracle guide](/platforms/oracle) を参照）

---

## 前提条件

- DigitalOcean アカウント（[signup with $200 free credit](https://m.do.co/c/signup)）
- SSH key pair（または password auth を使う想定）
- 所要時間は約 20 分

## 1) Droplet を作成する

<Warning>
クリーンなベースイメージ（Ubuntu 24.04 LTS）を使ってください。起動スクリプトや firewall のデフォルトを確認していない限り、Marketplace の third-party 1-click image は避けるべきです。
</Warning>

1. [DigitalOcean](https://cloud.digitalocean.com/) にログインする
2. **Create → Droplets** をクリックする
3. 次を選ぶ
   - **Region:** 自分、または利用者に近いリージョン
   - **Image:** Ubuntu 24.04 LTS
   - **Size:** Basic → Regular → **$6/mo**（1 vCPU、1GB RAM、25GB SSD）
   - **Authentication:** SSH key（推奨）または password
4. **Create Droplet** をクリックする
5. 発行された IP address を控える

## 2) SSH で接続する

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

## 4) Onboarding を実行する

```bash
openclaw onboard --install-daemon
```

wizard では次を順に設定します。

- model 認証（API key または OAuth）
- channel 設定（Telegram、WhatsApp、Discord など）
- gateway token（自動生成）
- daemon install（systemd）

## 5) Gateway を確認する

```bash
# Check status
openclaw status

# Check service
systemctl --user status openclaw-gateway.service

# View logs
journalctl --user -u openclaw-gateway.service -f
```

## 6) Dashboard へアクセスする

gateway はデフォルトで loopback に bind します。Control UI へアクセスするには次のいずれかを使います。

**Option A: SSH tunnel（推奨）**

```bash
# From your local machine
ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP

# Then open: http://localhost:18789
```

**Option B: Tailscale Serve（HTTPS、loopback-only）**

```bash
# On the droplet
curl -fsSL https://tailscale.com/install.sh | sh
tailscale up

# Configure Gateway to use Tailscale Serve
openclaw config set gateway.tailscale.mode serve
openclaw gateway restart
```

開く: `https://<magicdns>/`

注:

- Serve は gateway を loopback-only のまま維持し、Control UI / WebSocket トラフィックを Tailscale identity header で認証します（tokenless auth は信頼済み gateway host を前提とします。HTTP API では引き続き token / password が必要です）
- token / password を必須にしたい場合は、`gateway.auth.allowTailscale: false` を設定するか、`gateway.auth.mode: "password"` を使ってください

**Option C: tailnet bind（Serve なし）**

```bash
openclaw config set gateway.bind tailnet
openclaw gateway restart
```

開く: `http://<tailscale-ip>:18789`（token 必須）

## 7) Channel を接続する

### Telegram

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

### WhatsApp

```bash
openclaw channels login whatsapp
# Scan QR code
```

他の provider については [Channels](/channels) を参照してください。

---

## 1GB RAM 向け最適化

6 ドルの droplet は 1GB RAM しかないため、安定稼働のために次を検討してください。

### swap を追加する（推奨）

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### 軽い model を使う

OOM が発生する場合は、次を検討します。

- ローカル model ではなく API ベースの model（Claude、GPT）を使う
- `agents.defaults.model.primary` をより軽い model に設定する

### メモリを監視する

```bash
free -h
htop
```

---

## 永続性

状態はすべて次の配下に保存されます。

- `~/.openclaw/` — config、認証情報、session data
- `~/.openclaw/workspace/` — workspace（SOUL.md、memory など）

これらは再起動後も保持されます。定期的に backup を取ってください。

```bash
tar -czvf openclaw-backup.tar.gz ~/.openclaw ~/.openclaw/workspace
```

---

## Oracle Cloud の無料代替

Oracle Cloud は、ここで挙げた有料プランよりも大幅に高性能な **Always Free** ARM instance を、月額 0 ドルで提供しています。

| What you get      | Specs                  |
| ----------------- | ---------------------- |
| **4 OCPUs**       | ARM Ampere A1          |
| **24GB RAM**      | 十分以上               |
| **200GB storage** | Block volume           |
| **Forever free**  | クレジットカード請求なし |

**注意点:**

- signup が不安定な場合があるため、失敗したら再試行が必要なことがあります
- ARM architecture のため、一部 binary は ARM build が必要です

完全なセットアップ手順は [Oracle Cloud](/platforms/oracle) を参照してください。signup のコツや登録トラブル時の対処は、この [community guide](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) も参考になります。

---

## トラブルシューティング

### Gateway が起動しない

```bash
openclaw gateway status
openclaw doctor --non-interactive
journalctl -u openclaw --no-pager -n 50
```

### Port がすでに使用中

```bash
lsof -i :18789
kill <PID>
```

### メモリ不足

```bash
# Check memory
free -h

# Add more swap
# Or upgrade to $12/mo droplet (2GB RAM)
```

---

## 関連

- [Hetzner guide](/install/hetzner) — より安価で高性能
- [Docker install](/install/docker) — コンテナ化セットアップ
- [Tailscale](/gateway/tailscale) — 安全なリモートアクセス
- [Configuration](/gateway/configuration) — 完全な設定リファレンス
