---
summary: "Bonjour/mDNS 検出 + デバッグ (ゲートウェイ ビーコン、クライアント、および一般的な障害モード)"
read_when:
  - macOS/iOS での Bonjour 検出の問題のデバッグ
  - mDNS サービス タイプ、TXT レコード、または検出 UX の変更
title: "ボンジュール・ディスカバリー"
x-i18n:
  source_hash: "2454692d8d590506fe224d92e4aa6ddf2838a2a11e64529da556c7bd3e35a90c"
---

# Bonjour / mDNS ディスカバリー

OpenClaw は、**LAN のみの利便性**として Bonjour (mDNS / DNS‑SD) を使用して検出を行います
アクティブなゲートウェイ (WebSocket エンドポイント)。これはベストエフォートであり、SSH や SSH に代わるものではありません\*\*。
テールネットベースの接続。

## Tailscale 経由の広域 Bonjour (ユニキャスト DNS‑SD)

ノードとゲートウェイが異なるネットワーク上にある場合、マルチキャスト mDNS はネットワークを通過しません。
境界線。 **ユニキャスト DNS‑SD** に切り替えることで、同じ検出 UX を維持できます
(「広域ボンジュール」) Tailscale を介して。

大まかな手順:

1. ゲートウェイ ホスト (テールネット経由で到達可能) で DNS サーバーを実行します。
2. `_openclaw-gw._tcp` の DNS‑SD レコードを専用ゾーンで公開します。
   (例: `openclaw.internal.`)。
3. Tailscale **分割 DNS** を構成し、選択したドメインがそれを介して解決されるようにします
   クライアント用の DNS サーバー (iOS を含む)。

OpenClaw はあらゆる検出ドメインをサポートします。 `openclaw.internal.` はほんの一例です。
iOS/Android ノードは、`local.` と構成された広域ドメインの両方を参照します。

### ゲートウェイ構成 (推奨)

```json5
{
  gateway: { bind: "tailnet" }, // tailnet-only (recommended)
  discovery: { wideArea: { enabled: true } }, // enables wide-area DNS-SD publishing
}
```

### ワンタイム DNS サーバーのセットアップ (ゲートウェイ ホスト)

```bash
openclaw dns setup --apply
```

これにより、CoreDNS がインストールされ、次のように構成されます。

- ゲートウェイの Tailscale インターフェイス上のポート 53 のみでリッスンします
- 選択したドメイン (例: `openclaw.internal.`) を `~/.openclaw/dns/<domain>.db` から提供します

テールネットに接続されたマシンから検証します。

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### テールスケール DNS 設定

Tailscale 管理コンソールで:- ゲートウェイのテールネット IP (UDP/TCP 53) を指すネームサーバーを追加します。

- 分割 DNS を追加して、検出ドメインがそのネームサーバーを使用するようにします。

クライアントがテールネット DNS を受け入れると、iOS ノードが参照できるようになります
マルチキャストなしの検出ドメイン内の `_openclaw-gw._tcp`。

### ゲートウェイ リスナーのセキュリティ (推奨)

ゲートウェイ WS ポート (デフォルト `18789`) は、デフォルトでループバックにバインドされます。 LAN/テールネット用
アクセスし、明示的にバインドし、認証を有効にしたままにします。

テールネットのみのセットアップの場合:

- `~/.openclaw/openclaw.json` に `gateway.bind: "tailnet"` を設定します。
- ゲートウェイを再起動します (または macOS メニューバー アプリを再起動します)。

## 宣伝する内容

ゲートウェイのみが `_openclaw-gw._tcp` をアドバタイズします。

## サービスの種類

- `_openclaw-gw._tcp` — ゲートウェイ トランスポート ビーコン (macOS/iOS/Android ノードで使用)。

## TXT キー (非秘密のヒント)

ゲートウェイは、UI フローを便利にするために、秘密ではない小さなヒントをアドバタイズします。

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (ゲートウェイ WS + HTTP)
- `gatewayTls=1` (TLS が有効な場合のみ)
- `gatewayTlsSha256=<sha256>` (TLS が有効で、フィンガープリントが使用可能な場合のみ)
- `canvasPort=<port>` (キャンバス ホストが有効な場合のみ。現在は `gatewayPort` と同じ)
- `sshPort=<port>` (オーバーライドされない場合のデフォルトは 22)
- `transport=gateway`
- `cliPath=<path>` (オプション; 実行可能な `openclaw` エントリポイントへの絶対パス)
- `tailnetDns=<magicdns>` (テールネットが利用可能な場合のオプションのヒント)

セキュリティに関する注意事項:- Bonjour/mDNS TXT レコードは **未認証**です。クライアントは TXT を権威ルーティングとして扱ってはなりません。

- クライアントは、解決されたサービス エンドポイント (SRV + A/AAAA) を使用してルーティングする必要があります。 `lanHost`、`tailnetDns`、`gatewayPort`、および `gatewayTlsSha256` はヒントとしてのみ扱ってください。
- TLS ピンニングでは、アドバタイズされた `gatewayTlsSha256` が以前に保存されたピンをオーバーライドすることを決して許可してはなりません。
- iOS/Android ノードは、検出ベースの直接接続を **TLS のみ**として扱い、初回のフィンガープリントを信頼する前に明示的なユーザー確認を要求する必要があります。

## macOS でのデバッグ

便利な組み込みツール:

- インスタンスを参照します。

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- 1 つのインスタンスを解決します (`<instance>` を置き換えます):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

参照は機能するが解決に失敗する場合は、通常、LAN ポリシーにヒットしているか、
mDNS リゾルバーの問題。

## ゲートウェイ ログでのデバッグ

ゲートウェイはローリング ログ ファイルを書き込みます (起動時に次のように出力されます)。
`gateway log file: ...`)。特に次の `bonjour:` 行を探してください。

- `bonjour: advertise failed ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`

## iOS ノードでのデバッグ

iOS ノードは `NWBrowser` を使用して `_openclaw-gw._tcp` を検出します。

ログをキャプチャするには:

- 設定 → ゲートウェイ → 詳細設定 → **検出デバッグ ログ**
- 設定 → ゲートウェイ → 詳細設定 → **検出ログ** → 再現 → **コピー**

ログには、ブラウザの状態遷移と結果セットの変更が含まれます。

## 一般的な障害モード- **Bonjour はネットワークを越えません**: Tailnet または SSH を使用します

- **マルチキャストがブロックされました**: 一部の Wi-Fi ネットワークは mDNS を無効にします。
- **スリープ / インターフェイス チャーン**: macOS は一時的に mDNS 結果をドロップする場合があります。リトライ。
- **ブラウズは機能しますが、解決は失敗します**: マシン名は単純にしてください (絵文字や文字列は避けてください)。
  句読点)、ゲートウェイを再起動します。サービス インスタンス名の由来は次のとおりです。
  ホスト名なので、あまりにも複雑な名前は一部のリゾルバーを混乱させる可能性があります。

## エスケープされたインスタンス名 (`\032`)

Bonjour/DNS‑SD は、サービス インスタンス名のバイトを 10 進数 `\DDD` としてエスケープすることがよくあります。
シーケンス (例: スペースは `\032` になります)。

- これはプロトコル レベルでは正常です。
- UI は表示のためにデコードする必要があります (iOS は `BonjourEscapes.decode` を使用します)。

## 無効化/設定

- `OPENCLAW_DISABLE_BONJOUR=1` は広告を無効にします (レガシー: `OPENCLAW_DISABLE_BONJOUR`)。
- `~/.openclaw/openclaw.json` の `gateway.bind` は、ゲートウェイ バインド モードを制御します。
- `OPENCLAW_SSH_PORT` は、TXT でアドバタイズされる SSH ポートをオーバーライドします (レガシー: `OPENCLAW_SSH_PORT`)。
- `OPENCLAW_TAILNET_DNS` は、MagicDNS ヒントを TXT で公開します (レガシー: `OPENCLAW_TAILNET_DNS`)。
- `OPENCLAW_CLI_PATH` は、アドバタイズされた CLI パスをオーバーライドします (レガシー: `OPENCLAW_CLI_PATH`)。

## 関連ドキュメント

- 検出ポリシーとトランスポートの選択: [検出](/gateway/discovery)
- ノードのペアリング + 承認: [ゲートウェイのペアリング](/gateway/pairing)
