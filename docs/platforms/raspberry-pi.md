---
summary: "Raspberry Pi 上の OpenClaw（低予算のセルフホスト構成）"
read_when:
  - Raspberry Pi で OpenClaw をセットアップするとき
  - ARM デバイスで OpenClaw を動かすとき
  - 安価な常時稼働パーソナル AI を構築したいとき
title: "Raspberry Pi"
x-i18n:
  source_hash: "c114f5a285e18fb1132d5e559a668a738b8beba65531a3583434db9af0bef5b0"
---
## 目標

Raspberry Pi 上で、**約 $35〜80** の初期費用だけで（月額料金なし）、永続的かつ常時稼働の OpenClaw ゲートウェイを運用します。

特に次の用途に向いています。

- 24 時間稼働の個人 AI アシスタント
- ホームオートメーション ハブ
- 低消費電力で常時待機できる Telegram / WhatsApp ボット

## ハードウェア要件

| Pi モデル       | RAM     | 動作可否   | メモ                              |
| --------------- | ------- | ---------- | --------------------------------- |
| **Pi 5**        | 4GB/8GB | ✅ 最適    | 最も高速で推奨                    |
| **Pi 4**        | 4GB     | ✅ 良好    | 多くの利用者にとって最適          |
| **Pi 4**        | 2GB     | ✅ 実用的  | 動作します。swap の追加を推奨     |
| **Pi 4**        | 1GB     | ⚠️ 厳しい  | swap と最小構成で運用可能         |
| **Pi 3B+**      | 1GB     | ⚠️ 低速    | 動作するがかなり重い              |
| **Pi Zero 2 W** | 512MB   | ❌ 非推奨  | 推奨しません                      |

**最小構成:** 1GB RAM、1 コア、500MB ディスク

**推奨構成:** 2GB 以上の RAM、64-bit OS、16GB 以上の SD カード（または USB SSD）

## 必要なもの

- Raspberry Pi 4 または 5（2GB 以上を推奨）
- MicroSD カード（16GB 以上）または USB SSD（より高速）
- 電源アダプター（公式 Pi PSU 推奨）
- ネットワーク接続（Ethernet または Wi-Fi）
- 作業時間の目安は約 30 分

## 1) OS を書き込む

ヘッドレス サーバー用途なので、**Raspberry Pi OS Lite（64-bit）** を使います。デスクトップ環境は不要です。

1. [Raspberry Pi Imager](https://www.raspberrypi.com/software/) をダウンロードします。
2. OS として **Raspberry Pi OS Lite（64-bit）** を選びます。
3. 歯車アイコン（⚙️）を開き、次を事前設定します。
   - ホスト名: `gateway-host`
   - SSH を有効化
   - ユーザー名 / パスワードを設定
   - Wi-Fi を設定（Ethernet を使わない場合）
4. SD カードまたは USB ドライブへ書き込みます。
5. Pi に挿入して起動します。

## 2) SSH で接続する

```bash
ssh user@gateway-host
# or use the IP address
ssh user@192.168.x.x
```

## 3) システムを初期設定する

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y git curl build-essential

# Set timezone (important for cron/reminders)
sudo timedatectl set-timezone America/Chicago  # Change to your timezone
```

## 4) Node.js 22（ARM64）をインストールする

```bash
# Install Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version  # Should show v22.x.x
npm --version
```

## 5) swap を追加する（2GB 以下では重要）

swap を設定しておくと、メモリ不足によるクラッシュを防ぎやすくなります。

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

### Option A: 標準インストール（推奨）

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

### Option B: 改造しやすいインストール（検証向け）

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
npm install
npm run build
npm link
```

改造しやすいインストールでは、ログやコードへ直接アクセスしやすく、ARM 固有の問題を追いやすくなります。

## 7) オンボーディングを実行する

```bash
openclaw onboard --install-daemon
```

ウィザードでは次のように進めます。

1. **Gateway mode:** Local
2. **Auth:** API キー推奨（OAuth はヘッドレス Pi では扱いにくいことがあります）
3. **Channels:** 最初は Telegram が最も始めやすいです
4. **Daemon:** Yes（systemd）

## 8) インストールを確認する

```bash
# Check status
openclaw status

# Check service
sudo systemctl status openclaw

# View logs
journalctl -u openclaw -f
```

## 9) ダッシュボードへアクセスする

Pi はヘッドレス運用になるため、SSH トンネルを使います。

```bash
# From your laptop/desktop
ssh -L 18789:localhost:18789 user@gateway-host

# Then open in browser
open http://localhost:18789
```

常時アクセスしたい場合は Tailscale も使えます。

```bash
# On the Pi
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up

# Update config
openclaw config set gateway.bind tailnet
sudo systemctl restart openclaw
```

---

## パフォーマンス最適化

### USB SSD を使う（大きな改善）

SD カードは遅く、劣化もしやすいため、USB SSD を使うと体感差が大きく出ます。

```bash
# Check if booting from USB
lsblk
```

設定方法は [Pi USB boot guide](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot) を参照してください。

### CLI の起動を高速化する（module compile cache）

低消費電力の Pi では、Node の module compile cache を有効にすると、CLI の繰り返し実行が速くなります。

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

注:

- `NODE_COMPILE_CACHE` は `status`、`health`、`--help` など後続実行を高速化します。
- `/var/tmp` は `/tmp` より再起動後も残りやすい場所です。
- `OPENCLAW_NO_RESPAWN=1` は CLI の自己再起動による追加コストを避けます。
- 初回実行でキャッシュが温まり、2 回目以降の効果が大きくなります。

### systemd 起動チューニング（任意）

この Pi を主に OpenClaw 用として使う場合は、サービス drop-in を追加して再起動時のばらつきを減らし、起動環境を安定させられます。

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

その後、次を実行します。

```bash
sudo systemctl daemon-reload
sudo systemctl restart openclaw
```

可能であれば、OpenClaw の state / cache は SSD 上に置き、SD カードのランダム I/O ボトルネックを避けてください。

`Restart=` ポリシーが自動復旧にどう役立つかについては、[systemd can automate service recovery](https://www.redhat.com/en/blog/systemd-automate-recovery) を参照してください。

### メモリ使用量を減らす

```bash
# Disable GPU memory allocation (headless)
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt

# Disable Bluetooth if not needed
sudo systemctl disable bluetooth
```

### リソースを監視する

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

OpenClaw 本体の大部分は ARM64 で動作しますが、一部外部バイナリには ARM 向けビルドが必要です。

| ツール             | ARM64 対応 | メモ                                |
| ------------------ | ---------- | ----------------------------------- |
| Node.js            | ✅         | 問題なく動作                        |
| WhatsApp (Baileys) | ✅         | Pure JS なので問題なし              |
| Telegram           | ✅         | Pure JS なので問題なし              |
| gog (Gmail CLI)    | ⚠️         | ARM 向けリリースがあるか確認        |
| Chromium (browser) | ✅         | `sudo apt install chromium-browser` |

skill が失敗した場合は、そのバイナリに ARM 向けビルドがあるか確認してください。Go / Rust 製ツールは対応していることが多い一方、未対応のものもあります。

### 32-bit と 64-bit

**必ず 64-bit OS を使ってください。** Node.js を含む多くの最新ツールで必要です。次で確認できます。

```bash
uname -m
# Should show: aarch64 (64-bit) not armv7l (32-bit)
```

---

## 推奨モデル構成

Pi はあくまでゲートウェイ用途で、モデル本体はクラウド側で動かす前提にすると扱いやすくなります。

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

**Pi 上でローカル LLM を動かそうとはしないでください。** 小さいモデルでも遅すぎることが多く、重い処理は Claude / GPT に任せる方が現実的です。

---

## 起動時の自動起動

通常はオンボーディング ウィザードが設定しますが、確認する場合は次を実行します。

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

### メモリ不足（OOM）

```bash
# Check memory
free -h

# Add more swap (see Step 5)
# Or reduce services running on the Pi
```

### パフォーマンスが遅い

- SD カードの代わりに USB SSD を使う
- 未使用サービスを停止する: `sudo systemctl disable cups bluetooth avahi-daemon`
- CPU throttling を確認する: `vcgencmd get_throttled`（`0x0` が望ましい）

### サービスが起動しない

```bash
# Check logs
journalctl -u openclaw --no-pager -n 100

# Common fix: rebuild
cd ~/openclaw  # if using hackable install
npm run build
sudo systemctl restart openclaw
```

### ARM バイナリの問題

skill が `exec format error` で失敗する場合は、次を確認してください。

1. そのバイナリに ARM64 ビルドがあるか
2. ソースからビルドできるか
3. ARM 対応の Docker コンテナへ切り替えられるか

### Wi-Fi が切れる

ヘッドレス Pi を Wi-Fi で使う場合:

```bash
# Disable WiFi power management
sudo iwconfig wlan0 power off

# Make permanent
echo 'wireless-power off' | sudo tee -a /etc/network/interfaces
```

---

## コスト比較

| 構成           | 初期費用 | 月額費用 | メモ                     |
| -------------- | -------- | -------- | ------------------------ |
| **Pi 4 (2GB)** | 約 $45   | $0       | 電気代は年約 $5          |
| **Pi 4 (4GB)** | 約 $55   | $0       | 推奨構成                 |
| **Pi 5 (4GB)** | 約 $60   | $0       | 最も高性能               |
| **Pi 5 (8GB)** | 約 $80   | $0       | やや過剰だが余裕あり     |
| DigitalOcean   | $0       | $6/月    | 年換算で約 $72           |
| Hetzner        | $0       | €3.79/月 | 年換算で約 $50           |

**損益分岐の目安:** Pi はクラウド VPS と比べて、約 6〜12 か月で元が取れることが多いです。

---

## 関連項目

- [Linux guide](/platforms/linux) — 一般的な Linux セットアップ
- [DigitalOcean guide](/platforms/digitalocean) — クラウド代替案
- [Hetzner guide](/install/hetzner) — Docker ベースの構成
- [Tailscale](/gateway/tailscale) — リモート接続
- [Nodes](/nodes) — ノート PC やスマートフォンを Pi ゲートウェイへペアリングする方法
