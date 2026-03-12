---
summary: "Gateway ダッシュボード（Control UI）のアクセスと認証"
read_when:
  - ダッシュボード認証または公開モードの変更時
title: "OpenClaw Gatewayダッシュボードのアクセス方法と認証設定ガイド"
description: "Gateway ダッシュボードへのアクセス方法と認証設定を説明します。Control UI の公開場所、`basePath` の変更、ローカル接続時の確認事項を確認できます。"
x-i18n:
  source_hash: "243230ad35672a374afec7ad9ea344c5fb74bdb7ea3a36e21a0b2a313583d000"
---
Gateway ダッシュボードは、デフォルトで `/` から提供されるブラウザ Control UI です
（`gateway.controlUi.basePath` で上書き可能）。

クイックオープン（ローカル Gateway）：

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（または [http://localhost:18789/](http://localhost:18789/)）

主要な参照先：

- [Control UI](/web/control-ui) - 使用方法と UI 機能について
- [Tailscale](/gateway/tailscale) - Serve/Funnel 自動化について
- [Web surfaces](/web) - バインドモードとセキュリティに関する注意事項

認証は WebSocket ハンドシェイク時に `connect.params.auth`（トークンまたはパスワード）を介して強制されます。[Gateway 設定](/gateway/configuration)の `gateway.auth` を参照してください。

セキュリティに関する注意：Control UI は**管理者用サーフェス**です（チャット、設定、実行承認）。
公開しないでください。UI は現在のブラウザタブセッションと選択された Gateway URL のために sessionStorage にダッシュボード URL トークンを保持し、読み込み後に URL からそれらを削除します。
localhost、Tailscale Serve、または SSH トンネルの使用を推奨します。

## 高速パス（推奨）

- オンボーディング後、CLI は自動的にダッシュボードを開き、クリーンな（トークン化されていない）リンクを表示します。
- いつでも再オープン：`openclaw dashboard`（リンクをコピーし、可能であればブラウザを開き、ヘッドレスの場合は SSH ヒントを表示）。
- UI が認証を求める場合は、`gateway.auth.token`（または `OPENCLAW_GATEWAY_TOKEN`）からトークンを Control UI 設定に貼り付けてください。

## トークンの基本（ローカル vs リモート）

- **Localhost**：`http://127.0.0.1:18789/` を開きます。
- **トークンソース**：`gateway.auth.token`（または `OPENCLAW_GATEWAY_TOKEN`）；`openclaw dashboard` は一回限りのブートストラップのために URL フラグメント経由でそれを渡すことができ、Control UI は localStorage ではなく現在のブラウザタブセッションと選択された Gateway URL のために sessionStorage にそれを保持します。
- `gateway.auth.token` が SecretRef 管理されている場合、`openclaw dashboard` は設計上、トークン化されていない URL を表示/コピー/オープンします。これにより、シェルログ、クリップボード履歴、またはブラウザ起動引数に外部管理されたトークンが公開されることを回避します。
- `gateway.auth.token` が SecretRef として設定されており、現在のシェルで未解決の場合、`openclaw dashboard` は引き続きトークン化されていない URL と実行可能な認証セットアップガイダンスを表示します。
- **Localhost 以外**：Tailscale Serve（`gateway.auth.allowTailscale: true` の場合、Control UI/WebSocket に対してトークンレス、信頼された Gateway ホストを想定；HTTP API は引き続きトークン/パスワードが必要）、トークン付き tailnet バインド、または SSH トンネルを使用します。[Web surfaces](/web) を参照してください。

## "unauthorized" / 1008 が表示される場合

- Gateway に到達可能であることを確認します（ローカル：`openclaw status`；リモート：SSH トンネル `ssh -N -L 18789:127.0.0.1:18789 user@host` を実行してから `http://127.0.0.1:18789/` を開く）。
- Gateway ホストからトークンを取得または提供します：
  - プレーンテキスト設定：`openclaw config get gateway.auth.token`
  - SecretRef 管理設定：外部シークレットプロバイダーを解決するか、このシェルで `OPENCLAW_GATEWAY_TOKEN` をエクスポートしてから、`openclaw dashboard` を再実行
  - トークンが設定されていない場合：`openclaw doctor --generate-gateway-token`
- ダッシュボード設定で、トークンを認証フィールドに貼り付けてから接続します。
