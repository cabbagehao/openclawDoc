---
summary: "Raspberry Pi 上の OpenClaw (低予算のセルフホスト型セットアップ)"
read_when:
  - Raspberry Pi で OpenClaw をセットアップする
  - ARM デバイスでの OpenClaw の実行
  - 安価な常時稼働パーソナル AI の構築
title: "ラズベリーパイ"
x-i18n:
  source_hash: "c114f5a285e18fb1132d5e559a668a738b8beba65531a3583434db9af0bef5b0"
---

# Raspberry Pi の OpenClaw

## 目標

**~\$35-80** の 1 回限りの費用 (月額料金なし) で、Raspberry Pi 上で永続的な常時稼働の OpenClaw ゲートウェイを実行できます。

以下に最適:

- 年中無休のパーソナル AI アシスタント
- ホームオートメーションハブ
- 低電力、常時利用可能な Telegram/WhatsApp ボット

## ハードウェア要件

| 円周率モデル    | RAM     | 動作しますか？  | メモ                                        |
| --------------- | ------- | --------------- | ------------------------------------------- |
| **Pi 5**        | 4GB/8GB | ✅ ベスト       | 最速、推奨                                  |
| **Pi 4**        | 4GB     | ✅ 良い         | ほとんどのユーザーにとってスイート スポット |
| **Pi 4**        | 2GB     | ✅ わかりました | 動作します。スワップを追加します。          |
| **Pi 4**        | 1GB     | ⚠️タイト        | スワップ、最小限の構成で可能                |
| **Pi 3B+**      | 1GB     | ⚠️遅い          | 動作するが遅い                              |
| **Pi Zero 2 W** | 512MB   | ❌              | 推奨されません                              |

**最小仕様:** 1GB RAM、1 コア、500MB ディスク  
**推奨:** 2GB 以上の RAM、64 ビット OS、16GB 以上の SD カード (または USB SSD)

## 必要なもの

- Raspberry Pi 4 または 5 (2GB 以上を推奨)
- MicroSD カード (16GB+) または USB SSD (より優れたパフォーマンス)
- 電源（公式Pi PSUを推奨）
- ネットワーク接続 (イーサネットまたは WiFi)
- ～30分

## 1) OS をフラッシュする

**Raspberry Pi OS Lite (64 ビット)** を使用します。ヘッドレス サーバーにはデスクトップは必要ありません。

1. [Raspberry Pi Imager](https://www.raspberrypi.com/software/) をダウンロードします。
2. OS を選択します: **Raspberry Pi OS Lite (64 ビット)**
3. 歯車アイコン (⚙️) をクリックして、以下を事前設定します。

- ホスト名を設定します: `gateway-host`
- SSHを有効にする
- ユーザー名/パスワードを設定します
- WiFi を設定します (イーサネットを使用しない場合)

4. SDカード/USBドライブにフラッシュします。
   5.Piを挿入して起動します。

## 2) SSH経由で接続する

```bash
ssh user@gateway-host
# or use the IP address
ssh user@192.168.x.x
```

## 3) システムセットアップ

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y git curl build-essential

# Set timezone (important for cron/reminders)
sudo timedatectl set-timezone America/Chicago  # Change to your timezone
```

## 4) Node.js 22 (ARM64) をインストールする

```bash
# Install Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version  # Should show v22.x.x
npm --version
```

## 5) スワップの追加 (2GB 以下の場合に重要)

スワップはメモリ不足によるクラッシュを防ぎます。

```bash
# Create 2GB swap file
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Optimize for low RAM (reduce swappiness)
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## 6) OpenClaw をインストールする

### オプション A: 標準インストール (推奨)

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

### オプション B: ハック可能なインストール (いじくり回し用)

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
npm install
npm run build
npm link
```

ハッキング可能なインストールにより、ログとコードに直接アクセスできるようになり、ARM 固有の問題のデバッグに役立ちます。

## 7) オンボーディングを実行する

```bash
openclaw onboard --install-daemon
```

ウィザードに従ってください:

1. **ゲートウェイ モード:** ローカル
2. **認証:** API キーを推奨 (OAuth はヘッドレス Pi では扱いにくい場合があります)
3. **チャネル:** Telegram が最も簡単に始めることができます
4. **デーモン:** はい (systemd)

## 8) インストールの確認

```bash
# Check status
openclaw status

# Check service
sudo systemctl status openclaw

# View logs
journalctl -u openclaw -f
```

## 9) ダッシュボードにアクセスする

Pi はヘッドレスであるため、SSH トンネルを使用します。

```bash
# From your laptop/desktop
ssh -L 18789:localhost:18789 user@gateway-host

# Then open in browser
open http://localhost:18789
```

または、Tailscale を使用して常時アクセスします。

```bash
# On the Pi
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up

# Update config
openclaw config set gateway.bind tailnet
sudo systemctl restart openclaw
```

---

## パフォーマンスの最適化

### USB SSD を使用する (大幅な改善)

SD カードは遅く、摩耗しやすいです。USB SSD はパフォーマンスを劇的に向上させます:

```bash
# Check if booting from USB
lsblk
```

セットアップについては、[Pi USB ブート ガイド](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot) を参照してください。

### CLI の起動を高速化 (モジュール コンパイル キャッシュ)

低電力の Pi ホストでは、ノードのモジュール コンパイル キャッシュを有効にして、CLI の繰り返し実行を高速化します。

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

注:

- `NODE_COMPILE_CACHE` は、後続の実行を高速化します (`status`、`health`、`--help`)。
- `/var/tmp` は、`/tmp` よりも再起動後も存続します。
- `OPENCLAW_NO_RESPAWN=1` は、CLI の自己復活による余分な起動コストを回避します。
- 最初の実行ではキャッシュがウォーム化されます。後の実行が最も効果的です。

### systemd 起動チューニング (オプション)

この Pi が主に OpenClaw を実行している場合は、再起動を減らすためにサービス ドロップインを追加します
ジッターを発生させて起動環境を安定に保ちます。

```bash
sudo systemctl edit openclaw
```

```ini
[Service]
Environment=OPENCLAW_NO_RESPAWN=1
Environment=NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
Restart=always
RestartSec=2
TimeoutStartSec=90
```

次に適用します:

```bash
sudo systemctl daemon-reload
sudo systemctl restart openclaw
```

可能であれば、SD カードの使用を避けるために、OpenClaw の状態/キャッシュを SSD でバックアップされたストレージに保持します。
コールド スタート時のランダム I/O ボトルネック。

`Restart=` ポリシーが自動リカバリにどのように役立つか:
[systemd はサービスの回復を自動化できます](https://www.redhat.com/en/blog/systemd-automate-recovery)。

### メモリ使用量を削減する

```bash
# Disable GPU memory allocation (headless)
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt

# Disable Bluetooth if not needed
sudo systemctl disable bluetooth
```

### モニターリソース

```bash
# Check memory
free -h

# Check CPU temperature
vcgencmd measure_temp

# Live monitoring
htop
```

---

## ARM 固有の注意事項

### バイナリ互換性

ほとんどの OpenClaw 機能は ARM64 で動作しますが、一部の外部バイナリには ARM ビルドが必要な場合があります。

| ツール | ARM64 ステータス | メモ |
| ------------------ | ------------ | ----------------------------------- |
| Node.js | ✅ | 快適に動作します |
| WhatsApp (Baileys) | ✅ | 純粋な JS、問題なし |
| Telegram | ✅ | 純粋な JS、問題なし |
| gog (Gmail CLI) | ⚠️ | ARM リリースを確認してください |
| Chromium (ブラウザ) | ✅ | `sudo apt install chromium-browser` |

スキルが失敗した場合は、そのバイナリに ARM ビルドが含まれているかどうかを確認してください。多くの Go/Rust ツールはこれを実行します。そうしない人もいます。

### 32 ビットと 64 ビット

**常に 64 ビット OS を使用してください。** Node.js および多くの最新ツールではこれが必要です。確認してください:

```bash
uname -m
# Should show: aarch64 (64-bit) not armv7l (32-bit)
```

---

## 推奨モデルセットアップ

Pi は単なるゲートウェイ (モデルはクラウドで実行される) であるため、API ベースのモデルを使用します。

```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "anthropic/claude-sonnet-4-20250514",
        "fallbacks": ["openai/gpt-4o-mini"]
      }
    }
  }
}
```

**Pi 上でローカル LLM を実行しようとしないでください** - たとえ小さなモデルでも遅すぎます。面倒な作業はクロード/GPT に任せてください。

---

## 起動時に自動起動

オンボーディング ウィザードはこれを設定しますが、次のことを確認します。

```bash
# Check service is enabled
sudo systemctl is-enabled openclaw

# Enable if not
sudo systemctl enable openclaw

# Start on boot
sudo systemctl start openclaw
```

---

## トラブルシューティング

### メモリ不足 (OOM)

```bash
# Check memory
free -h

# Add more swap (see Step 5)
# Or reduce services running on the Pi
```

### パフォーマンスが遅い

- SDカードの代わりにUSB SSDを使用してください
- 未使用のサービスを無効にする: `sudo systemctl disable cups bluetooth avahi-daemon`
- CPU スロットリングを確認します: `vcgencmd get_throttled` (`0x0` を返す必要があります)

### サービスが開始されない

```bash
# Check logs
journalctl -u openclaw --no-pager -n 100

# Common fix: rebuild
cd ~/openclaw  # if using hackable install
npm run build
sudo systemctl restart openclaw
```

### ARM バイナリの問題スキルが「実行形式エラー」で失敗した場合

1. バイナリに ARM64 ビルドがあるかどうかを確認します
2. ソースからビルドしてみる
3. または、ARM サポートを備えた Docker コンテナを使用します

### WiFi ドロップ

WiFi 上のヘッドレス Pi の場合:

```bash
# Disable WiFi power management
sudo iwconfig wlan0 power off

# Make permanent
echo 'wireless-power off' | sudo tee -a /etc/network/interfaces
```

---

## コストの比較

| セットアップ       | 1 回限りのコスト | 月額料金 | メモ                 |
| ------------------ | ---------------- | -------- | -------------------- |
| **Pi 4 (2GB)**     | ~\$45             | \$0       | + 電力 (~\$5/年)      |
| **Pi 4 (4GB)**     | ~\$55             | \$0       | おすすめ             |
| **Pi 5 (4GB)**     | ~\$60             | \$0       | 最高のパフォーマンス |
| **Pi 5 (8GB)**     | ~\$80             | \$0       | 過剰だが将来性がある |
| デジタルオーシャン | \$0               | \$6/月    | \$72/年               |
| ヘッツナー         | \$0               | €3.79/月 | ~\$50/年              |

**損益分岐点:** Pi はクラウド VPS と比較して、約 6 ～ 12 か月で元が取れます。

---

## 関連項目

- [Linux ガイド](/platforms/linux) — 一般的な Linux セットアップ
- [DigitalOcean ガイド](/platforms/digitalocean) — クラウドの代替
- [Hetzner ガイド](/install/hetzner) — Docker セットアップ
- [Tailscale](/gateway/tailscale) — リモート アクセス
- [ノード](/nodes) — ラップトップ/携帯電話を Pi ゲートウェイとペアリングします
