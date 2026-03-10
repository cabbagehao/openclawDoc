---
summary: "Oracle Cloud 上の OpenClaw (常に無料の ARM)"
read_when:
  - Oracle CloudでのOpenClawのセットアップ
  - OpenClaw 用の低コストの VPS ホスティングを確認する場合
  - 小規模サーバー上で年中無休の OpenClaw が必要
title: "オラクルクラウド"
x-i18n:
  source_hash: "8ec927ab5055c915fda464458f85bfb96151967c3b7cd1b1fd2b2f156110fc6d"
---

# Oracle Cloud (OCI) 上の OpenClaw

## 目標

Oracle Cloudの**Always Free** ARM層で永続的なOpenClaw Gatewayを実行します。

Oracle の無料枠は OpenClaw に最適です (特に OCI アカウントをすでに持っている場合) が、次のようなトレードオフがあります。

- ARM アーキテクチャ (ほとんどの機能は動作しますが、一部のバイナリは x86 専用である可能性があります)
- 容量とサインアップは難しい場合があります

## コスト比較 (2026 年)

| プロバイダー       | 計画                       | 仕様                  | 料金/月 | メモ                          |
| ------------------ | -------------------------- | --------------------- | ------- | ----------------------------- |
| オラクルクラウド   | いつでも無料 ARM           | 最大 4 OCPU、24GB RAM | \$0      | ARM、容量が限られている       |
| ヘッツナー         | CX22                       | 2 vCPU、4GB RAM       | ~ $4    | 最安の有料オプション          |
| デジタルオーシャン | 基本                       | 1 vCPU、1GB RAM       | 6ドル   | 簡単な UI、優れたドキュメント |
| ヴァルター         | クラウドコンピューティング | 1 vCPU、1GB RAM       | 6ドル   | 多くの場所                    |
| リノード           | ナノデ                     | 1 vCPU、1GB RAM       | 5ドル   | 現在は Akamai の一員です      |

---

## 前提条件

- Oracle Cloudアカウント([サインアップ](https://www.oracle.com/cloud/free/)) - 問題が発生した場合は、[コミュニティサインアップガイド](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd)を参照してください。
- Tailscale アカウント ([tailscale.com](https://tailscale.com) で無料)
- ～30分

## 1) OCI インスタンスを作成する

1. [Oracle Cloud コンソール](https://cloud.oracle.com/)にログインします。
2. **コンピューティング → インスタンス → インスタンスの作成** に移動します
3. 以下を設定します。
   - **名前:** `openclaw`
   - **画像:** Ubuntu 24.04 (aarch64)
   - **形状:** `VM.Standard.A1.Flex` (アンペア ARM)
   - **OCPU:** 2 (または最大 4)
   - **メモリ:** 12 GB (または最大 24 GB)
   - **ブート ボリューム:** 50 GB (最大 200 GB まで空き)
   - **SSH キー:** 公開キーを追加します
4. [**作成**] をクリックします。
5. パブリック IP アドレスをメモします。

**ヒント:** インスタンスの作成が「容量不足」で失敗した場合は、別の可用性ドメインを試すか、後で再試行してください。無料利用枠の容量には制限があります。

## 2) 接続して更新する

```bash
# Connect via public IP
ssh ubuntu@YOUR_PUBLIC_IP

# Update system
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential
```

**注意:** `build-essential` は、一部の依存関係の ARM コンパイルに必要です。

## 3) ユーザーとホスト名を構成する

```bash
# Set hostname
sudo hostnamectl set-hostname openclaw

# Set password for ubuntu user
sudo passwd ubuntu

# Enable lingering (keeps user services running after logout)
sudo loginctl enable-linger ubuntu
```

## 4) Tailscaleをインストールする

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --ssh --hostname=openclaw
```

これにより、Tailscale SSH が有効になり、テールネット上の任意のデバイスから `ssh openclaw` 経由で接続できるようになります。パブリック IP は必要ありません。

確認:

```bash
tailscale status
```

**今後は、Tailscale 経由で接続します:** `ssh ubuntu@openclaw` (または Tailscale IP を使用します)。

## 5) OpenClaw をインストールする

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
source ~/.bashrc
```

「ボットをどのように孵化させますか?」というプロンプトが表示されたら、**「後で実行する」** を選択します。

> 注: ARM ネイティブのビルドの問題が発生した場合は、Homebrew に到達する前に、システム パッケージ (例: `sudo apt install -y build-essential`) から始めてください。

## 6) ゲートウェイを構成し (ループバック + トークン認証)、Tailscale Serve を有効にします

トークン認証をデフォルトとして使用します。これは予測可能であり、「安全でない認証」コントロール UI フラグが必要なくなります。

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

## 7) 確認する

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

## 8) VCNセキュリティをロックダウンする

すべてが機能しているので、VCNをロックダウンして、Tailscaleを除くすべてのトラフィックをブロックします。 OCI の Virtual Cloud Network は、ネットワーク エッジでファイアウォールとして機能します。トラフィックはインスタンスに到達する前にブロックされます。

1. OCIコンソールで**ネットワーク→仮想クラウドネットワーク**に移動します。
   2.VCN→**セキュリティ・リスト**→デフォルト・セキュリティ・リストをクリックします。
2. 以下を除くすべてのイングレス ルールを **削除**します。
   - `0.0.0.0/0 UDP 41641` (テールスケール)
3. デフォルトの出力ルールを維持します (すべてのアウトバウンドを許可します)。

これにより、ポート 22 の SSH、HTTP、HTTPS、およびネットワーク エッジにあるその他すべてがブロックされます。今後は、Tailscale 経由でのみ接続できます。

---

## コントロール UI にアクセスする

Tailscale ネットワーク上の任意のデバイスから:

```
https://openclaw.<tailnet-name>.ts.net/
```

`<tailnet-name>` をテールネット名に置き換えます (`tailscale status` に表示されます)。

SSH トンネルは必要ありません。 Tailscale は以下を提供します。

- HTTPS 暗号化 (自動証明書)
- Tailscale ID による認証
- テールネット上の任意のデバイス (ラップトップ、電話など) からアクセス

---

## セキュリティ: VCN + Tailscale (推奨ベースライン)

VCN がロックダウンされ (UDP 41641 のみオープン)、ゲートウェイがループバックにバインドされているため、強力な多層防御が実現します。パブリック トラフィックはネットワーク エッジでブロックされ、管理アクセスはテールネット経由で行われます。

このセットアップでは、純粋にインターネット全体の SSH ブルート フォースを阻止するために、追加のホストベースのファイアウォール ルールを追加する必要性が大幅に軽減されます。それでも、OS を最新の状態に保ち、`openclaw security audit` を実行し、パブリック インターフェイスで誤ってリッスンしていないか確認する必要があります。

### すでに保護されているもの

| 従来のステップ | 必要ですか？ | なぜ |
| ------------------ | ----------- | ------------------------------------------------------------------------------ |
| UFW ファイアウォール | いいえ | トラフィックがインスタンスに到達する前に VCN がブロックされる |
| fail2ban | いいえ | VCN でポート 22 がブロックされている場合はブルートフォースなし |
| sshd の強化 | いいえ | Tailscale SSH は sshd を使用しません |
| root ログインを無効化 | いいえ | Tailscale は、システム ユーザーではなく、Tailscale ID を使用します |
| SSH キーのみの認証 | いいえ | Tailscale はテールネット経由で認証します |
| IPv6 の強化 | 通常は不要 | VCN/サブネット設定によって異なります。実際に何が割り当て/公開されているかを確認してください |

### まだお勧めします

- **資格情報のアクセス許可:** `chmod 700 ~/.openclaw`
- **セキュリティ監査:** `openclaw security audit`
- **システム アップデート:** `sudo apt update && sudo apt upgrade` 定期的に
- **Tailscale の監視:** [Tailscale 管理コンソール] でデバイスを確認します(https://login.tailscale.com/admin)

### セキュリティ体制を検証する

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

Tailscale Serve が機能しない場合は、SSH トンネルを使用します。

```bash
# From your local machine (via Tailscale)
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

次に、`http://localhost:18789` を開きます。

---

## トラブルシューティング### インスタンスの作成が失敗する (「容量不足」)

無料枠の ARM インスタンスが人気です。試してみてください:

- 異なる可用性ドメイン
- オフピーク時間帯（早朝）に再試行してください
- 形状を選択するときに「Always Free」フィルターを使用します

### テールスケールが接続できない

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

### コントロール UI にアクセスできません

```bash
# Verify Tailscale Serve is running
tailscale serve status

# Check gateway is listening
curl http://localhost:18789

# Restart if needed
systemctl --user restart openclaw-gateway
```

### ARM バイナリの問題

一部のツールには ARM ビルドが含まれていない場合があります。確認してください:

```bash
uname -m  # Should show aarch64
```

ほとんどの npm パッケージは正常に動作します。バイナリについては、`linux-arm64` または `aarch64` リリースを探してください。

---

## 永続性

すべての状態は以下に保存されます:

- `~/.openclaw/` — 設定、認証情報、セッション データ
- `~/.openclaw/workspace/` — ワークスペース (SOUL.md、記憶、アーティファクト)

定期的にバックアップしてください:

```bash
tar -czvf openclaw-backup.tar.gz ~/.openclaw ~/.openclaw/workspace
```

---

## 関連項目

- [ゲートウェイ リモート アクセス](/gateway/remote) — 他のリモート アクセス パターン
- [Tailscale の統合](/gateway/tailscale) — Tailscale の完全なドキュメント
- [ゲートウェイ構成](/gateway/configuration) — すべての構成オプション
- [DigitalOcean ガイド](/platforms/digitalocean) — 有料 + 簡単なサインアップを希望する場合
- [Hetzner ガイド](/install/hetzner) — Docker ベースの代替案
