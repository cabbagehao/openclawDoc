---
summary: "「openclaw ノード」(ヘッドレス ノード ホスト) の CLI リファレンス"
read_when:
  - ヘッドレスノードホストの実行
  - system.run 用の非 macOS ノードのペアリング
title: "ノード"
x-i18n:
  source_hash: "cf901108417a08df7293e7f2542b424057fcb8e4e12455d39895e4c8d4cfaee6"
---

# `openclaw node`

ゲートウェイ WebSocket に接続して公開する **ヘッドレス ノード ホスト**を実行します。
このマシン上の `system.run` / `system.which`。

## ノードホストを使用する理由は何ですか?

エージェントが **他のマシン上でコマンドを実行**できるようにする場合は、ノード ホストを使用します。
完全な macOS コンパニオン アプリをインストールせずにネットワークに接続できます。

一般的な使用例:

- リモート Linux/Windows ボックス (ビルド サーバー、ラボ マシン、NAS) でコマンドを実行します。
- ゲートウェイ上で実行を**サンドボックス**に保ちますが、承認された実行は他のホストに委任します。
- 自動化ノードまたは CI ノードに軽量のヘッドレス実行ターゲットを提供します。

実行は引き続き **実行承認** とエージェントごとの許可リストによって保護されています。
ノード ホストにアクセスできるため、コマンド アクセスの範囲を限定して明示的に保つことができます。

## ブラウザ プロキシ (ゼロ構成)

`browser.enabled` がそうでない場合、ノード ホストはブラウザ プロキシを自動的にアドバタイズします。
ノード上で無効になっています。これにより、エージェントはそのノード上でブラウザ自動化を使用できるようになります。
追加の設定なしで。

必要に応じてノード上で無効にします。

```json5
{
  nodeHost: {
    browserProxy: {
      enabled: false,
    },
  },
}
```

## 実行 (フォアグラウンド)

```bash
openclaw node run --host <gateway-host> --port 18789
```

オプション:- `--host <host>`: ゲートウェイ WebSocket ホスト (デフォルト: `127.0.0.1`)

- `--port <port>`: ゲートウェイ WebSocket ポート (デフォルト: `18789`)
- `--tls`: ゲートウェイ接続に TLS を使用します
- `--tls-fingerprint <sha256>`: 予期される TLS 証明書のフィンガープリント (sha256)
- `--node-id <id>`: ノード ID を上書きします (ペアリング トークンをクリアします)
- `--display-name <name>`: ノードの表示名をオーバーライドします。

## ノードホストのゲートウェイ認証

`openclaw node run` および `openclaw node install` は、config/env からゲートウェイ認証を解決します (ノード コマンドに `--token`/`--password` フラグはありません)。

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` が最初にチェックされます。
- その後、ローカル構成フォールバック: `gateway.auth.token` / `gateway.auth.password`。
- ローカル モードでは、`gateway.auth.*` が設定されていない場合、`gateway.remote.token` / `gateway.remote.password` もフォールバックとして適格です。
- `gateway.mode=remote` では、リモート クライアント フィールド (`gateway.remote.token` / `gateway.remote.password`) もリモート優先順位ルールに従って適格です。
- レガシー `CLAWDBOT_GATEWAY_*` 環境変数は、ノード ホスト認証解決では無視されます。

## サービス (バックグラウンド)

ヘッドレス ノード ホストをユーザー サービスとしてインストールします。

```bash
openclaw node install --host <gateway-host> --port 18789
```

オプション:- `--host <host>`: ゲートウェイ WebSocket ホスト (デフォルト: `127.0.0.1`)

- `--port <port>`: ゲートウェイ WebSocket ポート (デフォルト: `18789`)
- `--tls`: ゲートウェイ接続に TLS を使用します
- `--tls-fingerprint <sha256>`: 予期される TLS 証明書のフィンガープリント (sha256)
- `--node-id <id>`: ノード ID を上書きします (ペアリング トークンをクリアします)
- `--display-name <name>`: ノードの表示名をオーバーライドします。
- `--runtime <runtime>`: サービス ランタイム (`node` または `bun`)
- `--force`: すでにインストールされている場合は再インストール/上書きします

サービスを管理します。

```bash
openclaw node status
openclaw node stop
openclaw node restart
openclaw node uninstall
```

フォアグラウンド ノード ホスト (サービスなし) には `openclaw node run` を使用します。

サービス コマンドは、機械可読出力の `--json` を受け入れます。

## ペアリング

最初の接続では、ゲートウェイ上に保留中のデバイス ペアリング要求 (`role: node`) が作成されます。
次の方法で承認します。

```bash
openclaw devices list
openclaw devices approve <requestId>
```

ノード ホストは、そのノード ID、トークン、表示名、およびゲートウェイ接続情報を次の場所に保存します。
`~/.openclaw/node.json`。

## 幹部の承認

`system.run` はローカルの幹部の承認によって制限されています。

- `~/.openclaw/exec-approvals.json`
- [幹部の承認](/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (ゲートウェイから編集)
