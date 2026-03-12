---
summary: "`openclaw node` の CLI リファレンス (ヘッドレスノードホスト)"
read_when:
  - ヘッドレスノードホストを実行したい場合
  - "`system.run` のために非 macOS ノードをペアリングしたい場合"
title: "node"
x-i18n:
  source_hash: "cf901108417a08df7293e7f2542b424057fcb8e4e12455d39895e4c8d4cfaee6"
---
ゲートウェイの WebSocket に接続し、このマシン上で `system.run` や `system.which` 機能を公開する**ヘッドレスノードホスト**を実行します。

## ノードホストを利用する理由

フル機能の macOS 用コンパニオンアプリをインストールすることなく、エージェントが**ネットワーク内の他のマシンでコマンドを実行**できるようにしたい場合にノードホストを使用します。

主なユースケース:
- リモートの Linux/Windows マシン（ビルドサーバー、実験用マシン、NAS など）でコマンドを実行する。
- ゲートウェイ上の実行環境は**サンドボックス化**しつつ、承認された操作のみを他のホストへ委任する。
- 自動化処理や CI ノード用に、軽量なヘッドレス実行ターゲットを提供する。

実行は、ノードホスト上の**実行承認（exec approvals）**とエージェントごとの許可リストによって保護されているため、コマンドへのアクセス範囲を明示的に制限できます。

## ブラウザプロキシ (ゼロ構成)

ノード上で `browser.enabled` が無効にされていない限り、ノードホストは自動的にブラウザプロキシをアドバタイズ（通知）します。これにより、追加の設定なしでエージェントがそのノード上でブラウザ自動化を利用できるようになります。

必要に応じて、ノード側でこの機能を無効にできます:

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

オプション:
- `--host <host>`: ゲートウェイの WebSocket ホスト (デフォルト: `127.0.0.1`)
- `--port <port>`: ゲートウェイの WebSocket ポート (デフォルト: `18789`)
- `--tls`: ゲートウェイとの接続に TLS を使用する
- `--tls-fingerprint <sha256>`: 期待される TLS 証明書のフィンガープリント (sha256)
- `--node-id <id>`: ノード ID を上書きする (ペアリングトークンがクリアされます)
- `--display-name <name>`: ノードの表示名を上書きする

## ノードホストにおけるゲートウェイ認証

`openclaw node run` および `openclaw node install` は、構成ファイルや環境変数からゲートウェイの認証情報を解決します（ノード用コマンドには `--token` や `--password` フラグはありません）:

- 最初に `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` がチェックされます。
- 次にローカル構成のフォールバックとして `gateway.auth.token` / `gateway.auth.password` がチェックされます。
- ローカルモードにおいて `gateway.auth.*` が未設定の場合、`gateway.remote.token` / `gateway.remote.password` もフォールバックの対象となります。
- `gateway.mode=remote` の場合、リモート優先順位ルールに従ってリモートクライアント用のフィールド (`gateway.remote.token` / `gateway.remote.password`) が使用されます。
- レガシーな `CLAWDBOT_GATEWAY_*` 環境変数は、ノードホストの認証解決では無視されます。

## サービス (バックグラウンド実行)

ヘッドレスノードホストをユーザーサービスとしてインストールします。

```bash
openclaw node install --host <gateway-host> --port 18789
```

オプション:
- `--host <host>`, `--port <port>`, `--tls`, `--tls-fingerprint <sha256>`, `--node-id <id>`, `--display-name <name>`: 上記の `run` コマンドと同様。
- `--runtime <runtime>`: サービスのランタイムを指定 (`node` または `bun`)。
- `--force`: すでにインストールされている場合に再インストール・上書きする。

サービスの管理:
```bash
openclaw node status
openclaw node stop
openclaw node restart
openclaw node uninstall
```

フォアグラウンドで実行（サービス化しない）したい場合は `openclaw node run` を使用してください。
サービス管理用のコマンドは、機械可読な出力のために `--json` フラグをサポートしています。

## ペアリング (Pairing)

初回接続時に、ゲートウェイ上で保留中のデバイスペアリング要求 (`role: node`) が作成されます。以下のコマンドで承認してください:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

ノードホストは、自身のノード ID、トークン、表示名、およびゲートウェイ接続情報を `~/.openclaw/node.json` に保存します。

## 実行承認 (Exec approvals)

`system.run` によるコマンド実行は、ローカルの実行承認設定によって制御されます:

- 設定ファイル: `~/.openclaw/exec-approvals.json`
- 概念解説: [実行承認](/tools/exec-approvals)
- ゲートウェイからの編集: `openclaw approvals --node <id|name|ip>`
