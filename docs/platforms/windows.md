---
summary: "Windows（WSL2）サポートとコンパニオン アプリの現状"
read_when:
  - Windows に OpenClaw をインストールするとき
  - Windows companion app の状況を確認したいとき
title: "Windows（WSL2）"
x-i18n:
  source_hash: "0732bb1719830ea088a86d9f4e2662d693fd6b3e256dcd3034d5ccdf3413035c"
---
Windows 上の OpenClaw は、**WSL2 経由での利用を推奨**します（Ubuntu 推奨）。CLI とゲートウェイを Linux 内で動かすことで、ランタイムの整合性を保ちやすくなり、Node / Bun / pnpm、Linux バイナリ、skills などの互換性も高くなります。ネイティブ Windows より扱いやすく、`wsl --install` の 1 コマンドで完全な Linux 環境を導入できます。

ネイティブ Windows companion app は今後対応予定です。

## インストール（WSL2）

- [Getting Started](/start/getting-started)（WSL 内で実行）
- [Install & updates](/install/updating)
- Microsoft の公式 WSL2 ガイド: [https://learn.microsoft.com/windows/wsl/install](https://learn.microsoft.com/windows/wsl/install)

## ゲートウェイ

- [Gateway runbook](/gateway)
- [Configuration](/gateway/configuration)

## ゲートウェイ サービスのインストール（CLI）

WSL2 内で次を実行します。

```
openclaw onboard --install-daemon
```

または:

```
openclaw gateway install
```

または:

```
openclaw configure
```

プロンプトが表示されたら **Gateway service** を選択します。

修復 / 移行:

```
openclaw doctor
```

## Windows ログイン前にゲートウェイを自動起動する

ヘッドレス運用では、誰も Windows にログインしていなくても起動チェーン全体が実行されるようにしておきます。

### 1) ログインなしでもユーザー サービスを維持する

WSL 内で:

```bash
sudo loginctl enable-linger "$(whoami)"
```

### 2) OpenClaw ゲートウェイのユーザー サービスをインストールする

WSL 内で:

```bash
openclaw gateway install
```

### 3) Windows 起動時に WSL を自動起動する

PowerShell を管理者として開き、次を実行します。

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec /bin/true" /sc onstart /ru SYSTEM
```

`Ubuntu` は、次で確認できる実際のディストリビューション名に置き換えてください。

```powershell
wsl --list --verbose
```

### 起動チェーンを確認する

再起動後（Windows サインイン前）に、WSL から次を確認します。

```bash
systemctl --user is-enabled openclaw-gateway
systemctl --user status openclaw-gateway --no-pager
```

## 詳細: WSL 内サービスを LAN へ公開する（portproxy）

WSL には独自の仮想ネットワークがあります。別マシンから **WSL 内** のサービス（SSH、ローカル TTS サーバー、ゲートウェイなど）へ到達させたい場合は、Windows 側のポートを現在の WSL IP へ転送する必要があります。WSL IP は再起動で変わるため、転送ルールを更新し直す必要が出ることがあります。

例（PowerShell を **管理者** で実行）:

```powershell
$Distro = "Ubuntu-24.04"
$ListenPort = 2222
$TargetPort = 22

$WslIp = (wsl -d $Distro -- hostname -I).Trim().Split(" ")[0]
if (-not $WslIp) { throw "WSL IP not found." }

netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=$ListenPort `
  connectaddress=$WslIp connectport=$TargetPort
```

Windows Firewall でこのポートを許可します（初回のみ）。

```powershell
New-NetFirewallRule -DisplayName "WSL SSH $ListenPort" -Direction Inbound `
  -Protocol TCP -LocalPort $ListenPort -Action Allow
```

WSL 再起動後に portproxy を更新するには:

```powershell
netsh interface portproxy delete v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 | Out-Null
netsh interface portproxy add v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 `
  connectaddress=$WslIp connectport=$TargetPort | Out-Null
```

注:

- 別マシンからの SSH 接続先は **Windows ホスト IP** です（例: `ssh user@windows-host -p 2222`）。
- リモート ノードは、到達可能なゲートウェイ URL を指している必要があります（`127.0.0.1` は不可）。`openclaw status --all` で確認してください。
- LAN 公開には `listenaddress=0.0.0.0` を使います。`127.0.0.1` にするとローカル専用になります。
- 自動化したい場合は、ログイン時に更新処理を実行する Scheduled Task を追加してください。

## WSL2 の段階的なインストール

### 1) WSL2 + Ubuntu をインストールする

PowerShell を管理者として開きます。

```powershell
wsl --install
# Or pick a distro explicitly:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

Windows に再起動を求められた場合は再起動します。

### 2) systemd を有効にする（ゲートウェイ インストールに必須）

WSL ターミナルで:

```bash
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[boot]
systemd=true
EOF
```

その後、PowerShell で:

```powershell
wsl --shutdown
```

Ubuntu を再度開き、次で確認します。

```bash
systemctl --user status
```

### 3) OpenClaw をインストールする（WSL 内）

WSL 内では Linux 向け Getting Started フローに従います。

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm ui:build # auto-installs UI deps on first run
pnpm build
openclaw onboard
```

完全なガイド: [Getting Started](/start/getting-started)

## Windows companion app

現時点では Windows companion app はまだありません。必要であれば、実現に向けたコントリビューションは歓迎されています。
