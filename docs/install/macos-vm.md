---
summary: "分離や iMessage が必要な場合に、サンドボックス化された macOS VM (ローカルまたはホスト型) で OpenClaw を実行する"
read_when:
  - メインの macOS 環境から分離された OpenClaw を求めている場合
  - サンドボックス内で iMessage 統合 (BlueBubbles) を使用したい場合
  - クローン可能な、リセット可能な macOS 環境が必要な場合
  - ローカルとホスト型の macOS VM オプションを比較したい場合
title: "macOS VMs"
---
## 推奨されるデフォルト (ほとんどのユーザー向け)

- **小規模な Linux VPS**: 低コストで常時稼働するゲートウェイを用意したい場合。[VPS hosting](/vps) を参照してください。
- **専用ハードウェア** (Mac mini または Linux マシン): ブラウザ自動化のために完全な制御と **住宅用 IP** が必要な場合。多くのサイトはデータセンター IP をブロックするため、ローカルブラウジングの方が通りやすいことがあります。
- **ハイブリッド**: ゲートウェイは安価な VPS に置き、ブラウザや UI の自動化が必要なときだけ Mac を **ノード** として接続する構成です。[Nodes](/nodes) と [Gateway remote](/gateway/remote) を参照してください。

macOS 専用機能 (iMessage / BlueBubbles) が必要な場合や、普段使いの Mac から厳密に分離したい場合に macOS VM を使います。

## macOS VM のオプション

### Apple Silicon Mac (Lume) 上のローカル VM

[Lume](https://cua.ai/docs/lume) を使用して、既存の Apple Silicon Mac 上のサンドボックス化された macOS VM で OpenClaw を実行します。

これにより、以下の利点が得られます:

- 分離された完全な macOS 環境 (ホストはクリーンなまま)
- BlueBubbles 経由の iMessage サポート (Linux/Windows では不可能)
- VM をクローンすることによる即時リセット
- 追加のハードウェアやクラウドのコストなし

### ホスト型 Mac プロバイダー (クラウド)

クラウドで macOS を使用したい場合は、ホスト型 Mac プロバイダも機能します:

- [MacStadium](https://www.macstadium.com/) (ホスト型 Mac)
- 他のホスト型 Mac ベンダーでも構いません。各社の VM と SSH に関する手順に従ってください

macOS VM への SSH アクセスを取得したら、以下のステップ 6 から続行します。

---

## クイックパス (Lume、上級ユーザー向け)

1. Lume のインストール
2. `lume create openclaw --os macos --ipsw latest`
3. Setup Assistant を完了し、Remote Login (SSH) を有効にする
4. `lume run openclaw --no-display`
5. SSH で接続し、OpenClaw をインストールし、チャネルを設定する
6. 完了

---

## 必要なもの (Lume)

- Apple Silicon Mac (M1/M2/M3/M4)
- ホスト上の macOS Sequoia 以降
- VM あたり約 60 GB の空きディスク容量
- 約 20 分

---

## 1) Lume のインストール

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/trycua/cua/main/libs/lume/scripts/install.sh)"
```

`~/.local/bin` が PATH にない場合:

```bash
echo 'export PATH="$PATH:$HOME/.local/bin"' >> ~/.zshrc && source ~/.zshrc
```

確認:

```bash
lume --version
```

ドキュメント: [Lume のインストール](https://cua.ai/docs/lume/guide/getting-started/installation)

---

## 2) macOS VM の作成

```bash
lume create openclaw --os macos --ipsw latest
```

これにより macOS がダウンロードされ、VM が作成されます。 VNC ウィンドウが自動的に開きます。

注意: 接続によっては、ダウンロードに時間がかかる場合があります。

---

## 3) Setup Assistant の完了

VNC ウィンドウで:

1. 言語と地域を選択します
2. Apple ID をスキップします (後で iMessage が必要な場合はサインインします)
3. ユーザーアカウントを作成します (ユーザー名とパスワードを覚えておいてください)
4. すべてのオプション機能をスキップします

セットアップが完了したら、SSH を有効にします:

1. System Settings → General → Sharing を開きます
2. "Remote Login" を有効にします

---

## 4) VM の IP アドレスの取得

```bash
lume get openclaw
```

IP アドレス (通常は `192.168.64.x`) を探します。

---

## 5) VM への SSH 接続

```bash
ssh youruser@192.168.64.X
```

`youruser` を作成したアカウントに、IP を VM の IP に置き換えます。

---

## 6) OpenClaw のインストール

VM 内で:

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

オンボーディングのプロンプトに従って、モデルプロバイダ (Anthropic、OpenAI など) を設定します。

---

## 7) チャネルの設定

設定ファイルを編集します:

```bash
nano ~/.openclaw/openclaw.json
```

チャネルを追加します:

```json
{
  "channels": {
    "whatsapp": {
      "dmPolicy": "allowlist",
      "allowFrom": ["+15551234567"]
    },
    "telegram": {
      "botToken": "YOUR_BOT_TOKEN"
    }
  }
}
```

次に WhatsApp にログインします (QR をスキャン):

```bash
openclaw channels login
```

---

## 8) VM をヘッドレスで実行

VM を停止し、ディスプレイなしで再起動します:

```bash
lume stop openclaw
lume run openclaw --no-display
```

VM はバックグラウンドで実行されます。 OpenClaw のデーモンは Gateway を実行し続けます。

ステータスを確認するには:

```bash
ssh youruser@192.168.64.X "openclaw status"
```

---

## 補足: iMessage 統合

これは macOS で動かす大きな利点です。[BlueBubbles](https://bluebubbles.app) を使って iMessage を OpenClaw に接続できます。

VM 内で:

1. bluebubbles.app から BlueBubbles をダウンロードします
2. Apple ID でサインインします
3. Web API を有効にし、パスワードを設定します
4. BlueBubbles Webhook を Gateway に向けます (例: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`)

OpenClaw 設定に追加します:

```json
{
  "channels": {
    "bluebubbles": {
      "serverUrl": "http://localhost:1234",
      "password": "your-api-password",
      "webhookPath": "/bluebubbles-webhook"
    }
  }
}
```

ゲートウェイを再起動します。これでエージェントが iMessage を送受信できるようになります。

セットアップの詳細全体: [BlueBubbles チャネル](/channels/bluebubbles)

---

## ゴールデンイメージを保存する

さらにカスタマイズする前に、クリーンな状態のスナップショットを作成します:

```bash
lume stop openclaw
lume clone openclaw openclaw-golden
```

いつでもリセット:

```bash
lume stop openclaw && lume delete openclaw
lume clone openclaw-golden openclaw
lume run openclaw --no-display
```

---

## 24 時間 365 日動かす

以下の方法で VM を実行し続けます:

- Mac を電源に接続したままにする
- System Settings → Energy Saver でスリープを無効にする
- 必要に応じて `caffeinate` を使用する

真の常時稼働のためには、専用の Mac mini または小規模な VPS を検討してください。 [VPS ホスティング](/vps) を参照してください。

---

## トラブルシューティング

| 問題                              | 解決策                                                                                                  |
| --------------------------------- | ------------------------------------------------------------------------------------------------------- |
| VM に SSH 接続できない            | VM の System Settings で "Remote Login" が有効になっているか確認してください                            |
| VM の IP が表示されない           | VM が完全に起動するまで待ち、再度 `lume get openclaw` を実行してください                                |
| Lume コマンドが見つからない       | PATH に `~/.local/bin` を追加してください                                                               |
| WhatsApp の QR がスキャンできない | `openclaw channels login` を実行するときに (ホストではなく) VM にログインしていることを確認してください |

---

## 関連ドキュメント

- [VPS hosting](/vps)
- [Nodes](/nodes)
- [Gateway remote](/gateway/remote)
- [BlueBubbles channel](/channels/bluebubbles)
- [Lume クイックスタート](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Lume CLI リファレンス](https://cua.ai/docs/lume/reference/cli-reference)
- [無人 VM セットアップ](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (高度)
- [Docker サンドボックス化](/install/docker) (代替の分離アプローチ)
