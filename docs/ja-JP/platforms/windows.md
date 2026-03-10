---
summary: "Windows (WSL2) サポート + コンパニオン アプリのステータス"
read_when:
  - Windows への OpenClaw のインストール
  - Windows コンパニオン アプリのステータスを確認する場合
title: "Windows（WSL2）"
x-i18n:
  source_hash: "0732bb1719830ea088a86d9f4e2662d693fd6b3e256dcd3034d5ccdf3413035c"
---

# Windows (WSL2)

Windows 上の OpenClaw は **WSL2** 経由で推奨されます (Ubuntu を推奨)。の
CLI + ゲートウェイは Linux 内で実行されるため、ランタイムの一貫性が維持され、
ツールの互換性が大幅に向上しました (Node/Bun/pnpm、Linux バイナリ、スキル)。ネイティブ
Windows のほうが難しいかもしれません。 WSL2 は、コマンド 1 つで完全な Linux エクスペリエンスを提供します
インストールするには: `wsl --install`。

ネイティブ Windows コンパニオン アプリも計画されています。

## インストール (WSL2)

- [はじめに](/start/getting-started) (WSL 内で使用)
- [インストールとアップデート](/install/updating)
- 公式 WSL2 ガイド (Microsoft): [https://learn.microsoft.com/windows/wsl/install](https://learn.microsoft.com/windows/wsl/install)

## ゲートウェイ

- [ゲートウェイ ランブック](/gateway)
- [構成](/gateway/configuration)

## ゲートウェイ サービスのインストール (CLI)

WSL2 内:

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

プロンプトが表示されたら、**ゲートウェイ サービス** を選択します。

修復/移行:

```
openclaw doctor
```

## Windows ログイン前のゲートウェイ自動起動

ヘッドレス セットアップの場合は、誰もログインしていない場合でも完全なブート チェーンが実行されるようにします。
ウィンドウズ。

### 1) ログインせずにユーザー サービスを実行し続ける

WSL 内:

```bash
sudo loginctl enable-linger "$(whoami)"
```

### 2) OpenClaw ゲートウェイ ユーザー サービスをインストールする

WSL 内:

```bash
openclaw gateway install
```

### 3) Windows 起動時に WSL を自動的に開始する

PowerShell で管理者として:

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec /bin/true" /sc onstart /ru SYSTEM
```

`Ubuntu` を次のディストリビューション名に置き換えます。

```powershell
wsl --list --verbose
```

### スタートアップ チェーンを確認する

再起動後 (Windows サインイン前)、WSL から確認します:

```bash
systemctl --user is-enabled openclaw-gateway
systemctl --user status openclaw-gateway --no-pager
```

## 詳細: WSL サービスを LAN (ポートプロキシ) 経由で公開します

WSL には独自の仮想ネットワークがあります。別のマシンがサービスにアクセスする必要がある場合
**WSL 内** (SSH、ローカル TTS サーバー、またはゲートウェイ) で実行する場合は、次のことを行う必要があります。
Windows ポートを現在の WSL IP に転送します。 WSL IPは再起動後に変更されます。
そのため、転送ルールを更新する必要がある場合があります。

例 (PowerShell **管理者**):

```powershell
$Distro = "Ubuntu-24.04"
$ListenPort = 2222
$TargetPort = 22

$WslIp = (wsl -d $Distro -- hostname -I).Trim().Split(" ")[0]
if (-not $WslIp) { throw "WSL IP not found." }

netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=$ListenPort `
  connectaddress=$WslIp connectport=$TargetPort
```

Windows ファイアウォールを通過するポートを許可します (1 回限り):

```powershell
New-NetFirewallRule -DisplayName "WSL SSH $ListenPort" -Direction Inbound `
  -Protocol TCP -LocalPort $ListenPort -Action Allow
```

WSL の再起動後にポートプロキシを更新します。

```powershell
netsh interface portproxy delete v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 | Out-Null
netsh interface portproxy add v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 `
  connectaddress=$WslIp connectport=$TargetPort | Out-Null
```

注:

- 別のマシンからの SSH は **Windows ホスト IP** をターゲットとします (例: `ssh user@windows-host -p 2222`)。
- リモート ノードは、**到達可能な** ゲートウェイ URL (`127.0.0.1` ではない) を指している必要があります。使う
  `openclaw status --all` を確認してください。
- LAN アクセスには `listenaddress=0.0.0.0` を使用します。 `127.0.0.1` はローカルのみに保持します。
- これを自動的に実行したい場合は、スケジュールされたタスクを登録して更新を実行します。
  ログイン時のステップ。

## WSL2 の段階的なインストール

### 1) WSL2 + Ubuntu をインストールする

PowerShell を開きます (管理者):

```powershell
wsl --install
# Or pick a distro explicitly:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

Windows が要求した場合は再起動します。

### 2) systemd を有効にする (ゲートウェイのインストールに必要)

WSL ターミナルで:

```bash
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[boot]
systemd=true
EOF
```

次に、PowerShell から次のようにします。

```powershell
wsl --shutdown
```

Ubuntu を再度開き、次のことを確認します。

```bash
systemctl --user status
```

### 3) OpenClaw をインストールします (WSL 内)

WSL 内の Linux Getting Started フローに従います。```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm ui:build # auto-installs UI deps on first run
pnpm build
openclaw onboard

```

完全ガイド: [はじめに](/start/getting-started)

## Windows コンパニオン アプリ

Windows コンパニオン アプリはまだありません。実現のための貢献を歓迎します。
```
