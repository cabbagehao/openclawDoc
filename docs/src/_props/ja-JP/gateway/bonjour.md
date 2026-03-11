---
summary: "Bonjour/mDNS による検出とデバッグ (ゲートウェイのビーコン、クライアント、および一般的な失敗パターン)"
read_when:
  - macOS/iOS で Bonjour による検出がうまくいかない場合
  - mDNS のサービスタイプや TXT レコード、検出 UI/UX を変更する場合
title: "Bonjour による検出"
x-i18n:
  source_hash: "2454692d8d590506fe224d92e4aa6ddf2838a2a11e64529da556c7bd3e35a90c"
---

# Bonjour / mDNS による検出

OpenClaw は、稼働中のゲートウェイ（WebSocket エンドポイント）を見つけるための **LAN 内限定の便利な機能** として Bonjour (mDNS / DNS-SD) を使用します。これはベストエフォートの仕組みであり、SSH や Tailscale による接続を完全に置き換えるものではありません。

## Tailscale を介した広域 Bonjour (ユニキャスト DNS-SD)

ノードとゲートウェイが異なるネットワークにある場合、通常のマルチキャスト mDNS はネットワークの境界を越えることができません。その場合、Tailscale 上で **ユニキャスト DNS-SD**（「広域 Bonjour」）に切り替えることで、同じ検出体験を維持できます。

主な手順:

1. ゲートウェイホスト上で DNS サーバーを実行します（Tailnet 経由で到達可能であること）。
2. 専用のゾーン（例: `openclaw.internal.`）の下で、`_openclaw-gw._tcp` の DNS-SD レコードを公開します。
3. クライアント（iOS を含む）において、選択したドメインがその DNS サーバーで解決されるよう、Tailscale の **Split DNS** を設定します。

OpenClaw は任意の検出ドメインをサポートしています。`openclaw.internal.` はあくまで一例です。iOS/Android ノードは、`local.` と、構成された広域ドメインの両方をスキャンします。

### ゲートウェイの構成 (推奨)

```json5
{
  gateway: { bind: "tailnet" }, // Tailnet 限定（推奨）
  discovery: { wideArea: { enabled: true } }, // 広域 DNS-SD 公開を有効化
}
```

### DNS サーバーのセットアップ (ゲートウェイホスト側、一度のみ)

```bash
openclaw dns setup --apply
```

これにより CoreDNS がインストールされ、以下の設定が行われます:

* ゲートウェイの Tailscale インターフェースのポート 53 のみで待機。
* 指定したドメイン（例: `openclaw.internal.`）を `~/.openclaw/dns/<domain>.db` から配信。

Tailnet に接続された別のマシンから検証します:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Tailscale の DNS 設定

Tailscale の管理コンソール（Admin Console）にて:

* ゲートウェイの Tailnet IP (UDP/TCP 53) を指す Nameserver を追加します。
* 検出用ドメインがその Nameserver を使用するように Split DNS を追加します。

クライアント側で Tailnet DNS が受け入れられると、iOS ノードなどはマルチキャストを使わずに、検出ドメイン内の `_openclaw-gw._tcp` を見つけられるようになります。

### ゲートウェイリスナーのセキュリティ (推奨)

ゲートウェイの WS ポート（デフォルト 18789）は、既定ではループバックにバインドされます。LAN や Tailnet からアクセス可能にするには、明示的にバインド設定を行い、認証を有効にしたままにしてください。

Tailnet 限定のセットアップの場合:

* `~/.openclaw/openclaw.json` で `gateway.bind: "tailnet"` を設定します。
* ゲートウェイ（または macOS のメニューバーアプリ）を再起動します。

## 公開される内容

ゲートウェイのみが `_openclaw-gw._tcp` を公開（Advertise）します。

## サービスタイプ

* `_openclaw-gw._tcp` — ゲートウェイの通信用ビーコン（macOS/iOS/Android ノードが使用）。

## TXT キー (非機密のヒント情報)

ゲートウェイは、UI 上の利便性を高めるために、秘密ではない小さなヒント情報を公開します:

* `role=gateway`
* `displayName=<表示名>`
* `lanHost=<ホスト名>.local`
* `gatewayPort=<ポート番号>` (ゲートウェイの WS + HTTP)
* `gatewayTls=1` (TLS 有効時のみ)
* `gatewayTlsSha256=<sha256>` (TLS 有効かつフィンガープリント利用可能時のみ)
* `canvasPort=<ポート番号>` (Canvas ホスト有効時のみ。現在は `gatewayPort` と同じ)
* `sshPort=<ポート番号>` (明示的な上書きがない場合はデフォルト 22)
* `transport=gateway`
* `cliPath=<パス>` (オプション。実行可能な `openclaw` エントリポイントの絶対パス)
* `tailnetDns=<magicdns>` (Tailnet 利用時のオプション。自動検出されます)

セキュリティ上の注意:

* Bonjour/mDNS の TXT レコードは **未認証（署名なし）** です。クライアントは TXT の内容を信頼できるルーティング情報として扱ってはいけません。
* クライアントは、解決されたサービスエンドポイント (SRV + A/AAAA) を優先して使用すべきです。`lanHost`, `tailnetDns`, `gatewayPort`, `gatewayTlsSha256` はあくまでヒントとして扱ってください。
* TLS ピン留め（Pinning）において、公開された `gatewayTlsSha256` が、以前に保存されたピンを上書きすることを決して許可してはいけません。
* iOS/Android ノードは、検出ベースの直接接続を **TLS 限定** として扱い、初回接続時のフィンガープリントを信頼する前にユーザーへ明示的な確認を求める必要があります。

## macOS でのデバッグ方法

便利な標準ツール:

* インスタンスの一覧を表示:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

* 特定のインスタンスを解決 (名前解決の確認):

  ```bash
  dns-sd -L "<インスタンス名>" _openclaw-gw._tcp local.
  ```

一覧には出るが解決（Resolve）に失敗する場合は、通常、LAN 内のポリシー制限や mDNS リゾルバーの問題です。

## ゲートウェイログでのデバッグ

ゲートウェイはローテーションされるログファイルを書き出します（起動時に `gateway log file: ...` として表示されます）。`bonjour:` で始まる行を確認してください。特に以下の内容に注目してください:

* `bonjour: advertise failed ...` (公開失敗)
* `bonjour: ... name conflict resolved` / `hostname conflict resolved` (名前衝突の解消)
* `bonjour: watchdog detected non-announced service ...` (ウォッチドッグによる未公開サービスの検出)

## iOS ノードでのデバッグ

iOS ノードは `NWBrowser` を使用して `_openclaw-gw._tcp` を探します。

ログを取得するには:

* Settings → Gateway → Advanced → **Discovery Debug Logs** をオンにする。
* Settings → Gateway → Advanced → **Discovery Logs** → 再現操作を行う → **Copy** でコピー。

ログには、ブラウザの状態遷移や検出結果の変更履歴が含まれます。

## よくある失敗パターン

* **Bonjour がネットワークを越えられない**: Tailnet または SSH を使用してください。
* **マルチキャストがブロックされている**: 一部の Wi-Fi ネットワークでは mDNS が無効化されています。
* **スリープやインターフェースの切り替え**: macOS が一時的に mDNS の結果を落とすことがあります。再試行してください。
* **一覧には出るが解決に失敗する**: マシン名をシンプルにし（絵文字や記号を避ける）、ゲートウェイを再起動してください。サービスインスタンス名はホスト名から派生するため、複雑すぎる名前は一部のリゾルバーを混乱させることがあります。

## エスケープされたインスタンス名 (`\032`)

Bonjour/DNS-SD では、サービスインスタンス名に含まれる特定のバイト（スペースなど）を 10 進数の `\DDD` シーケンスとしてエスケープすることがあります（例: スペースは `\032` になります）。

* これはプロトコル上の正常な仕様です。
* UI 側で表示用にデコードする必要があります（iOS では `BonjourEscapes.decode` を使用しています）。

## 無効化と設定

* `OPENCLAW_DISABLE_BONJOUR=1` で公開を無効化できます。
* `~/.openclaw/openclaw.json` 内の `gateway.bind` で、ゲートウェイの待機モードを制御します。
* `OPENCLAW_SSH_PORT` で、TXT レコードに含める SSH ポート番号を上書きできます。
* `OPENCLAW_TAILNET_DNS` で、TXT レコードに MagicDNS のヒントを含めることができます。
* `OPENCLAW_CLI_PATH` で、公開される CLI パスを上書きできます。

## 関連ドキュメント

* 検出ポリシーと通信路の選択: [検出](/gateway/discovery)
* ノードのペアリングと承認: [ゲートウェイのペアリング](/gateway/pairing)
