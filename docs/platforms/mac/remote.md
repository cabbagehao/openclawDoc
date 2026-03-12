---
summary: "SSH 経由でリモート OpenClaw ゲートウェイを制御するための macOS アプリ フロー"
read_when:
  - macOS からのリモート制御をセットアップまたはデバッグするとき
title: "リモート制御"
x-i18n:
  source_hash: "4bb945460f613e02cc26008d19400b1439ff1208fe93a1e4c956865ad0286fe1"
---
この構成では、macOS アプリを、別ホスト（デスクトップ / サーバー）で動作する OpenClaw ゲートウェイの完全なリモート コントローラーとして利用できます。これはアプリの **Remote over SSH**（remote run）機能です。ヘルスチェック、Voice Wake の転送、Web Chat を含むすべての機能が、_Settings → General_ で設定した同じ SSH 構成を共有します。

## モード

- **Local (this Mac)**: すべてをこの Mac 上で実行します。SSH は使いません。
- **Remote over SSH (default)**: OpenClaw コマンドはリモート ホスト上で実行されます。macOS アプリは `-o BatchMode`、選択した identity / key、ローカル ポート転送を含む SSH 接続を開きます。
- **Remote direct (ws/wss)**: SSH トンネルを使わず、ゲートウェイ URL に直接接続します。たとえば Tailscale Serve や公開 HTTPS リバース プロキシ経由です。

## リモート転送方式

リモート モードでは 2 種類の転送方式を利用できます。

- **SSH tunnel**（既定）: `ssh -N -L ...` でゲートウェイ ポートを localhost に転送します。トンネルは loopback を使うため、ゲートウェイ側からはノードの IP が `127.0.0.1` に見えます。
- **Direct (ws/wss)**: ゲートウェイ URL へ直接接続します。ゲートウェイには実際のクライアント IP が見えます。

## リモート ホスト側の前提条件

1. Node と pnpm をインストールし、OpenClaw CLI をビルド / インストールします（`pnpm install && pnpm build && pnpm link --global`）。
2. 非対話シェルでも `openclaw` が PATH 上で見つかるようにしてください。必要なら `/usr/local/bin` または `/opt/homebrew/bin` に symlink します。
3. 鍵認証で SSH 接続できるようにします。LAN 外から安定して到達させるには **Tailscale** IP の利用を推奨します。

## macOS アプリ側のセットアップ

1. _Settings → General_ を開きます。
2. **OpenClaw runs** で **Remote over SSH** を選び、次を設定します。
   - **Transport**: **SSH tunnel** または **Direct (ws/wss)**
   - **SSH target**: `user@host`（必要なら `:port` を付与）
     - ゲートウェイが同一 LAN 上にあり Bonjour を広告している場合は、検出済みリストから選んで自動入力できます。
   - **Gateway URL**（Direct のみ）: `wss://gateway.example.ts.net`。ローカル / LAN なら `ws://...` も使用できます。
   - **Identity file**（advanced）: 利用する鍵ファイルへのパス
   - **Project root**（advanced）: コマンド実行に使うリモート側 checkout パス
   - **CLI path**（advanced）: 実行可能な `openclaw` エントリポイント、またはバイナリへの任意のパス。広告されている場合は自動入力されます。
3. **Test remote** を実行します。成功すれば、リモート側で `openclaw status --json` が正しく実行できています。失敗の多くは PATH または CLI の問題で、exit 127 はリモート側で CLI が見つからないことを示します。
4. 以後、ヘルスチェックと Web Chat はこの SSH トンネル経由で自動実行されます。

## Web Chat

- **SSH tunnel**: Web Chat は転送された WebSocket 制御ポート（既定 18789）経由でゲートウェイに接続します。
- **Direct (ws/wss)**: Web Chat は設定されたゲートウェイ URL へ直接接続します。
- 個別の WebChat HTTP サーバーは、現在は存在しません。

## 権限

- リモート ホストにも、ローカルと同じ TCC 承認が必要です。Automation、Accessibility、Screen Recording、Microphone、Speech Recognition、Notifications を、そのマシンで一度オンボーディングして付与してください。
- ノードは `node.list` / `node.describe` を通じて権限状態を通知するため、エージェントは利用可能な機能を把握できます。

## セキュリティに関する注意

- リモート ホストでは loopback bind を優先し、SSH または Tailscale 経由で接続してください。
- SSH トンネルでは strict host-key checking を使用します。事前にホスト鍵を信頼し、`~/.ssh/known_hosts` に登録しておいてください。
- ゲートウェイを非 loopback インターフェースへ bind する場合は、トークンまたはパスワード認証を必須にしてください。
- 詳細は [Security](/gateway/security) と [Tailscale](/gateway/tailscale) を参照してください。

## WhatsApp ログイン フロー（リモート）

- `openclaw channels login --verbose` は **リモート ホスト上で** 実行します。表示された QR を電話の WhatsApp で読み取ってください。
- 認証期限が切れた場合も、そのホスト上でログインを再実行します。リンクの問題はヘルスチェックに反映されます。

## トラブルシューティング

- **exit 127 / not found**: 非ログイン シェルで `openclaw` が PATH にありません。`/etc/paths`、シェル rc、または `/usr/local/bin` / `/opt/homebrew/bin` への symlink を確認してください。
- **Health probe failed**: SSH の到達性、PATH、Baileys がログイン済みか（`openclaw status --json`）を確認してください。
- **Web Chat stuck**: リモート ホストでゲートウェイが動作しており、転送ポートがゲートウェイの WS ポートと一致しているか確認してください。UI は正常な WS 接続を前提とします。
- **Node IP shows 127.0.0.1**: SSH tunnel では正常です。ゲートウェイ側で実際のクライアント IP を見たい場合は、**Transport** を **Direct (ws/wss)** に切り替えてください。
- **Voice Wake**: リモート モードではトリガー フレーズが自動転送されます。追加の転送プロセスは不要です。

## 通知音

`openclaw` と `node.invoke` を使えば、スクリプトから通知単位でサウンドを指定できます。例:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

現在のアプリには、グローバルな `default sound` 切り替えはありません。呼び出し側がリクエストごとにサウンドを指定するか、無音にするかを決めます。
