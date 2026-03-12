---
summary: "Oracle Cloud 上の OpenClaw（Always Free ARM）"
read_when:
  - Oracle Cloud で OpenClaw をセットアップするとき
  - OpenClaw 向けの低コスト VPS を探しているとき
  - 小規模サーバーで 24 時間稼働の OpenClaw を動かしたいとき
title: "Oracle Cloud"
x-i18n:
  source_hash: "8ec927ab5055c915fda464458f85bfb96151967c3b7cd1b1fd2b2f156110fc6d"
---
## 目標

Oracle Cloud の **Always Free** ARM 枠で、常時稼働する OpenClaw ゲートウェイを運用します。

Oracle の無料枠は OpenClaw に適していることが多く、すでに OCI アカウントがある場合は特に有力な選択肢です。ただし、次のようなトレードオフがあります。

- ARM アーキテクチャであること（大半は動作しますが、一部バイナリは x86 専用の場合があります）
- キャパシティ不足やサインアップ時の不安定さがあること

## コスト比較（2026 年）

| プロバイダー   | プラン            | スペック             | 月額   | メモ                 |
| -------------- | ----------------- | -------------------- | ------ | -------------------- |
| Oracle Cloud   | Always Free ARM   | 最大 4 OCPU、24GB RAM | $0     | ARM、空き容量が少ない |
| Hetzner        | CX22              | 2 vCPU、4GB RAM      | 約 $4  | 最安クラスの有料案   |
| DigitalOcean   | Basic             | 1 vCPU、1GB RAM      | $6     | UI が分かりやすい    |
| Vultr          | Cloud Compute     | 1 vCPU、1GB RAM      | $6     | 拠点が多い           |
| Linode         | Nanode            | 1 vCPU、1GB RAM      | $5     | 現在は Akamai 傘下   |

---

## 前提条件

- Oracle Cloud アカウント（[signup](https://www.oracle.com/cloud/free/)）
  問題がある場合は [community signup guide](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) を参照してください。
- Tailscale アカウント（[tailscale.com](https://tailscale.com) で無料）
- 作業時間の目安は約 30 分

## 1) OCI インスタンスを作成する

1. [Oracle Cloud Console](https://cloud.oracle.com/) にログインします。
2. **Compute → Instances → Create Instance** へ進みます。
3. 次のように設定します。
   - **Name:** `openclaw`
   - **Image:** Ubuntu 24.04（aarch64）
   - **Shape:** `VM.Standard.A1.Flex`（Ampere ARM）
   - **OCPUs:** 2（必要なら最大 4）
   - **Memory:** 12 GB（必要なら最大 24 GB）
   - **Boot volume:** 50 GB（無料枠は最大 200 GB）
   - **SSH key:** 公開鍵を追加
4. **Create** をクリックします。
5. パブリック IP アドレスを控えておきます。

**補足:** インスタンス作成が `Out of capacity` で失敗した場合は、別の Availability Domain を試すか、時間を置いて再試行してください。無料枠は空きが少ないことがあります。

## 2) 接続して更新する

```bash
# Connect via public IP
ssh ubuntu@YOUR_PUBLIC_IP

# Update system
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential
```

**注意:** `build-essential` は、一部依存関係を ARM 上でコンパイルするために必要です。

## 3) ユーザーとホスト名を設定する

```bash
# Set hostname
sudo hostnamectl set-hostname openclaw

# Set password for ubuntu user
sudo passwd ubuntu

# Enable lingering (keeps user services running after logout)
sudo loginctl enable-linger ubuntu
```

## 4) Tailscale をインストールする

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --ssh --hostname=openclaw
```

これで Tailscale SSH が有効になり、tailnet 上の任意の端末から `ssh openclaw` で接続できるようになります。パブリック IP を直接使う必要はありません。

確認:

```bash
tailscale status
```

**以後は Tailscale 経由で接続します:** `ssh ubuntu@openclaw`（または Tailscale IP）

## 5) OpenClaw をインストールする

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
source ~/.bashrc
```

`How do you want to hatch your bot?` と聞かれたら、**`Do this later`** を選択します。

> 注: ARM ネイティブのビルド問題に遭遇した場合は、まず `sudo apt install -y build-essential` のようなシステム パッケージを確認してから Homebrew を検討してください。

## 6) ゲートウェイを設定し、Tailscale Serve を有効にする

既定ではトークン認証を使用します。この方式は挙動が安定しており、Control UI 側で「insecure auth」系のフラグを使わずに済みます。

```bash
# Keep the Gateway private on the VM
openclaw config set gateway.bind loopback

# Require auth for the Gateway + Control UI
openclaw config set gateway.auth.mode token
openclaw doctor --generate-gateway-token

# Expose over Tailscale Serve (HTTPS + tailnet access)
openclaw config set gateway.tailscale.mode serve
openclaw config set gateway.trustedProxies '["127.0.0.1"]'

systemctl --user restart openclaw-gateway
```

## 7) 動作確認

```bash
# Check version
openclaw --version

# Check daemon status
systemctl --user status openclaw-gateway

# Check Tailscale Serve
tailscale serve status

# Test local response
curl http://localhost:18789
```

## 8) VCN セキュリティをロックダウンする

動作確認が済んだら、Tailscale 以外の通信をすべて遮断するよう VCN を絞り込みます。OCI の Virtual Cloud Network はネットワーク境界のファイアウォールとして機能し、インスタンスへ届く前にトラフィックを遮断できます。

1. OCI Console で **Networking → Virtual Cloud Networks** を開きます。
2. 対象の VCN を選び、**Security Lists** → Default Security List を開きます。
3. 次を除くすべての ingress ルールを **削除**します。
   - `0.0.0.0/0 UDP 41641`（Tailscale）
4. egress は既定のまま（全 outbound 許可）にします。

これにより、ポート 22 の SSH、HTTP、HTTPS を含む公開トラフィックはネットワーク境界で遮断されます。以後の接続経路は Tailscale のみになります。

---

## Control UI へアクセスする

Tailscale ネットワーク上の任意の端末から、次へアクセスできます。

```
https://openclaw.<tailnet-name>.ts.net/
```

`<tailnet-name>` は `tailscale status` で確認できる tailnet 名に置き換えてください。

SSH トンネルは不要です。Tailscale が次を提供します。

- HTTPS 暗号化（証明書は自動取得）
- Tailscale ID による認証
- tailnet 上の任意の端末（ノート PC、スマートフォンなど）からのアクセス

---

## セキュリティ: VCN + Tailscale（推奨ベースライン）

VCN をロックダウンし、ゲートウェイを loopback に bind しておけば、多層防御になります。公開トラフィックはネットワーク境界で遮断され、管理アクセスは tailnet 経由に限定されます。

この構成では、インターネット全体からの SSH 総当たりを防ぐ目的だけで、さらにホスト側ファイアウォールを積み増す必要性はかなり小さくなります。それでも、OS 更新、`openclaw security audit`、公開インターフェースで誤って待ち受けていないかの確認は継続してください。

### すでに保護されている項目

| 従来の対策         | 必要か     | 理由                                                  |
| ------------------ | ---------- | ----------------------------------------------------- |
| UFW firewall       | 不要       | VCN がインスタンス到達前に遮断するため                |
| fail2ban           | 不要       | VCN でポート 22 を閉じていれば総当たり対象にならない   |
| sshd hardening     | 不要       | Tailscale SSH は sshd を使わないため                  |
| Disable root login | 不要       | Tailscale は OS ユーザーではなく Tailscale ID を使うため |
| SSH key-only auth  | 不要       | Tailscale 側で認証するため                            |
| IPv6 hardening     | 通常は不要 | VCN / subnet 設定次第。実際の割り当て状況を確認すること |

### 引き続き推奨される項目

- **認証情報ディレクトリ権限:** `chmod 700 ~/.openclaw`
- **セキュリティ監査:** `openclaw security audit`
- **システム更新:** `sudo apt update && sudo apt upgrade` を定期実行
- **Tailscale の監視:** [Tailscale admin console](https://login.tailscale.com/admin) で接続端末を確認

### セキュリティ状態を検証する

```bash
# Confirm no public ports listening
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# Verify Tailscale SSH is active
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# Optional: disable sshd entirely
sudo systemctl disable --now ssh
```

---

## フォールバック: SSH トンネル

Tailscale Serve が使えない場合は、SSH トンネルを使用できます。

```bash
# From your local machine (via Tailscale)
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

その後、`http://localhost:18789` を開きます。

---

## トラブルシューティング

### インスタンス作成が失敗する（`Out of capacity`）

無料枠の ARM インスタンスは人気があります。次を試してください。

- 別の Availability Domain を選ぶ
- 混雑しにくい時間帯（早朝など）に再試行する
- shape 選択時に `Always Free` フィルターを使う

### Tailscale が接続できない

```bash
# Check status
sudo tailscale status

# Re-authenticate
sudo tailscale up --ssh --hostname=openclaw --reset
```

### ゲートウェイが起動しない

```bash
openclaw gateway status
openclaw doctor --non-interactive
journalctl --user -u openclaw-gateway -n 50
```

### Control UI に到達できない

```bash
# Verify Tailscale Serve is running
tailscale serve status

# Check gateway is listening
curl http://localhost:18789

# Restart if needed
systemctl --user restart openclaw-gateway
```

### ARM バイナリの問題

一部ツールには ARM ビルドがない場合があります。次で確認してください。

```bash
uname -m  # Should show aarch64
```

多くの npm パッケージはそのまま動作します。外部バイナリについては、`linux-arm64` や `aarch64` 向けリリースがあるか確認してください。

---

## 永続性

すべての状態は次に保存されます。

- `~/.openclaw/` — 設定、認証情報、セッション データ
- `~/.openclaw/workspace/` — workspace（`SOUL.md`、memory、artifacts）

定期バックアップの例:

```bash
tar -czvf openclaw-backup.tar.gz ~/.openclaw ~/.openclaw/workspace
```

---

## 関連項目

- [Gateway remote access](/gateway/remote) — 他のリモート接続パターン
- [Tailscale integration](/gateway/tailscale) — Tailscale の詳細
- [Gateway configuration](/gateway/configuration) — すべての設定項目
- [DigitalOcean guide](/platforms/digitalocean) — 有料だが導入しやすい選択肢
- [Hetzner guide](/install/hetzner) — Docker ベースの代替案
