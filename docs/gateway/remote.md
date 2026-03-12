---
summary: "SSH トンネル (Gateway WS) および Tailnet を利用したリモートアクセス"
description: "専用ホストのゲートウェイへ SSH トンネルや Tailnet で接続する構成、コマンド実行位置、認証優先順位、UI 利用時の注意を整理します。"
read_when:
  - リモートゲートウェイのセットアップやトラブルシューティングを行う場合
title: "OpenClaw リモートアクセス設定 SSH トンネル・Tailnet 接続ガイド"
x-i18n:
  source_hash: "4e83f67b7c811d132b41c44476cd18dfa7c3ed18e8e3e60521ea255dcf31e279"
---
OpenClaw は、専用のホスト（デスクトップやサーバー）で動作する単一の「マスター」ゲートウェイに対し、外部からクライアントを接続する「SSH 経由のリモート」構成をサポートしています。

- **オペレーター (あなた自身 / macOS アプリ)**: SSH トンネルが万能なフォールバック手段となります。
- **ノード (iOS/Android および将来のデバイス)**: ゲートウェイの **WebSocket** に接続します（ネットワーク環境に応じて LAN、Tailnet、または SSH トンネルを使用）。

## 基本的な考え方

- ゲートウェイの WebSocket は、構成されたポート（デフォルト 18789）の **ループバック (127.0.0.1)** インターフェースで待機します。
- リモートで使用する場合は、そのループバックポートを SSH で転送するか、あるいは Tailnet/VPN を使用してトンネルを介さずに接続します。

## 一般的な VPN / Tailnet 構成（エージェントの所在）

**ゲートウェイホスト** を「エージェントが住んでいる場所」と考えてください。そこがセッション、認証プロファイル、チャネル、および状態データを所有します。手元のノート PC やモバイルノードは、そのホストへ接続しに行きます。

### 1) Tailnet 内の常時稼働ゲートウェイ (VPS または自宅サーバー)

永続的に稼働するホストでゲートウェイを実行し、**Tailscale** または SSH 経由でアクセスします。

- **最高の操作感 (UX)**: `gateway.bind: "loopback"` を維持しつつ、コントロール UI には **Tailscale Serve** を使用します。
- **フォールバック**: アクセスが必要なマシンからループバックへの SSH トンネルを併用します。
- **構築例**: [exe.dev](/install/exe-dev) (手軽な VM) や [Hetzner](/install/hetzner) (本格的な VPS)。

これは、ノート PC を頻繁にスリープさせるが、エージェントは常に稼働させておきたい場合に最適です。

### 2) 自宅のデスクトップで実行し、外出先のノート PC から操作する

ノート PC 側ではエージェントを実行せず、リモートで接続します:

- macOS アプリの **Remote over SSH** モードを使用します（Settings → General → "OpenClaw runs"）。
- アプリがトンネルの開設と管理を自動で行うため、WebChat やヘルスチェックがそのまま機能します。

詳細手順: [macOS リモートアクセス](/platforms/mac/remote)。

### 3) ノート PC で実行し、他のマシンからリモートアクセスする

ゲートウェイはローカルで動かしつつ、安全に外部へ公開します:

- 他のマシンからノート PC への SSH トンネルを張る。
- あるいは Tailscale Serve でコントロール UI を公開し、ゲートウェイ本体はループバックのみに留める。

ガイド: [Tailscale](/gateway/tailscale) および [Web の概要](/web)。

## コマンドのフロー (どこで何が動くか)

単一のゲートウェイサービスが状態とチャネルを所有し、各ノードは周辺機器（ペリフェラル）として動作します。

フローの例 (Telegram → ノード):

- Telegram のメッセージが **ゲートウェイ** に到着。
- ゲートウェイが **エージェント** を実行し、ノードツールの呼び出しが必要か判断。
- ゲートウェイが WebSocket を介して **ノード** を呼び出し（`node.*` RPC）。
- ノードが結果を返し、ゲートウェイが Telegram へ返信。

補足事項:
- **ノードはゲートウェイサービスを実行しません。** 意図的に分離されたプロファイルを使用する場合を除き、1つのホストで実行するゲートウェイは1つだけにする必要があります（詳細は [マルチゲートウェイ](/gateway/multiple-gateways) を参照）。
- macOS アプリの「ノードモード」は、ゲートウェイ WebSocket を利用する単なるノードクライアントとして動作します。

## SSH トンネル (CLI とツール)

リモートのゲートウェイ WebSocket へのローカルトンネルを作成します:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

トンネルが開通した状態であれば:
- `openclaw health` や `openclaw status --deep` は、`ws://127.0.0.1:18789` を通じてリモートゲートウェイへ到達できるようになります。
- `openclaw gateway {status,health,send,agent,call}` 等のコマンドで `--url` フラグを使用して、転送された URL を明示的に指定することも可能です。

注意: ポート番号 `18789` は、自身で構成した `gateway.port`（または `--port` や環境変数）に置き換えてください。
注意: `--url` を指定した場合、CLI は構成ファイルや環境変数の認証情報を自動では使用しません。必ず `--token` または `--password` を明示的に含めてください。認証情報がない場合はエラーとなります。

## CLI のリモート既定値設定

リモートの接続先を保存し、CLI コマンドがデフォルトでそれを使用するように設定できます:

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      url: "ws://127.0.0.1:18789",
      token: "your-token",
    },
  },
}
```

ゲートウェイがループバック限定の場合は、URL を `ws://127.0.0.1:18789` のままにしておき、あらかじめ SSH トンネルを開いておいてください。

## 認証情報の優先順位 (Contract)

ゲートウェイの認証情報（トークン/パスワード）の解決ルールは、API 呼び出し、Discord の実行承認監視、およびノード接続のすべてで共通です:

- **明示的な指定**: `--token`, `--password` フラグや、ツール設定の `gatewayToken` が常に最優先されます。
- **URL 上書き時の安全性**:
  - CLI で `--url` を指定した場合、暗黙的な（構成ファイルや環境変数の）認証情報は再利用されません。
  - 環境変数 `OPENCLAW_GATEWAY_URL` による上書き時は、環境変数経由の認証情報 (`OPENCLAW_GATEWAY_TOKEN` / `PASSWORD`) のみが使用される可能性があります。
- **ローカルモード (Local mode) 時の優先順位**:
  - トークン: `OPENCLAW_GATEWAY_TOKEN` → `gateway.auth.token` → `gateway.remote.token`
  - パスワード: `OPENCLAW_GATEWAY_PASSWORD` → `gateway.auth.password` → `gateway.remote.password`
- **リモートモード (Remote mode) 時の優先順位**:
  - トークン: `gateway.remote.token` → `OPENCLAW_GATEWAY_TOKEN` → `gateway.auth.token`
  - パスワード: `gateway.remote.password` → `OPENCLAW_GATEWAY_PASSWORD` → `gateway.auth.password`
- リモート環境への probe/status 実行時のトークンチェックはデフォルトで厳格です。リモートモード指定時は `gateway.remote.token` のみが使用され、ローカルトークンへのフォールバックは行われません。
- レガシーな `CLAWDBOT_GATEWAY_*` 環境変数は、互換性維持のためのパスでのみ使用されます。新しい認証解決ロジックでは `OPENCLAW_GATEWAY_*` のみが参照されます。

## SSH 経由でのチャット UI 利用

WebChat は独立した HTTP ポートを使用しなくなりました。SwiftUI 製のチャット UI は直接ゲートウェイの WebSocket に接続します。

- 18789 ポートを SSH で転送し、クライアントから `ws://127.0.0.1:18789` に接続してください。
- macOS では、トンネル管理を自動で行うアプリの "Remote over SSH" モードの利用を推奨します。

## macOS アプリの "Remote over SSH"

macOS のメニューバーアプリは、このリモート構成（ステータス確認、WebChat、音声ウェイク転送）をエンドツーエンドで制御できます。

手順: [macOS リモートアクセス](/platforms/mac/remote)。

## セキュリティルール (リモート / VPN)

簡潔に言えば、**必要性が確実でない限り、ゲートウェイはループバック（127.0.0.1）のみで待機させる**のが最も安全です。

- **ループバック ＋ SSH / Tailscale Serve** が最も推奨される構成です（外部に直接ポートを晒さないため）。
- 平文の `ws://` 接続は、デフォルトでループバックに限定されています。信頼できるプライベートネットワーク内で平文接続を許可したい場合は、クライアントプロセスの環境変数に `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` を設定してください。
- **ループバック以外へのバインド** (`lan`, `tailnet`, `custom`, またはループバック不可時の `auto`) を行う場合は、必ずトークンまたはパスワード認証を有効にする必要があります。
- `gateway.remote.token` / `password` はクライアント側の認証情報ソースです。これらを設定するだけでは、サーバー側の認証は有効になりません。
- `gateway.auth.*` が未設定の場合、ローカルからの呼び出し時に `gateway.remote.*` がフォールバックとして使用されることがあります。
- `wss://` を使用する際、`gateway.remote.tlsFingerprint` でリモートの TLS 証明書のフィンガープリントを固定（ピン留め）できます。
- **Tailscale Serve** を使用する場合、`gateway.auth.allowTailscale: true` を設定することで、認証ヘッダーによる Tailscale の身元確認を有効にできます（コントロール UI および WebSocket トラフィックが対象。HTTP API エンドポイントは引き続きトークン/パスワードが必要です）。このトークンレスフローは、ゲートウェイホストが信頼されていることを前提としています。
- ブラウザ制御機能はオペレーター権限と同等に扱ってください。Tailnet 限定の運用と、明示的なノードペアリングを推奨します。

詳細な解説: [セキュリティ](/gateway/security)。
