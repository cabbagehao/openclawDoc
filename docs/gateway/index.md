---
summary: "ゲートウェイサービスの実行、ライフサイクル、および運用のためのランブック"
read_when:
  - ゲートウェイプロセスの実行やデバッグを行う場合
title: "ゲートウェイランブック"
---
このページでは、ゲートウェイサービスの初期起動から日常的な運用（Day-2 ops）について説明します。

<CardGroup cols={2}>
  <Card title="詳細なトラブルシューティング" icon="siren" href="/gateway/troubleshooting">
    具体的な症状から原因を特定するための診断手順と、ログの見分け方。
  </Card>
  <Card title="構成設定" icon="sliders" href="/gateway/configuration">
    目的別のセットアップガイドと、全設定項目の詳細リファレンス。
  </Card>
  <Card title="シークレット管理" icon="key-round" href="/gateway/secrets">
    SecretRef の仕様、実行時スナップショットの挙動、および移行・リロード操作。
  </Card>
  <Card title="シークレット適用計画の仕様" icon="shield-check" href="/gateway/secrets-plan-contract">
    `secrets apply` の対象パスに関するルールと、参照限定の認証プロファイルの挙動。
  </Card>
</CardGroup>

## 5分で完了するローカル起動手順

<Steps>
  <Step title="ゲートウェイの起動">

```bash
openclaw gateway --port 18789
# デバッグ/トレースログを標準出力に表示する場合
openclaw gateway --port 18789 --verbose
# ポートが塞がっている場合に強制終了して起動
openclaw gateway --force
```

  </Step>

  <Step title="サービスの健全性確認">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

正常な状態の目安: `Runtime: running` および `RPC probe: ok`。

  </Step>

  <Step title="チャネルの準備状況を確認">

```bash
openclaw channels status --probe
```

  </Step>
</Steps>

<Note>
ゲートウェイの構成リロード機能は、有効な構成ファイルのパス（プロファイルや状態のデフォルト、または `OPENCLAW_CONFIG_PATH` から解決されたもの）を監視します。デフォルトの動作モードは `gateway.reload.mode="hybrid"` です。
</Note>

## 実行モデル

- ルーティング、コントロールプレーン、およびチャネル接続を担う単一の常駐プロセスです。
- 1 つのポートで以下の機能をマルチプレクス（多重化）して提供します:
  - WebSocket による制御と RPC
  - HTTP API (OpenAI 互換、Responses API、ツール実行)
  - コントロール UI および Webhook フック
- デフォルトの待機（bind）モード: `loopback` (127.0.0.1)。
- デフォルトで認証が必要です (`gateway.auth.token`, `gateway.auth.password`, または環境変数 `OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`)。

### ポートとバインド設定の優先順位

| 設定項目 | 優先順位 |
| :--- | :--- |
| ゲートウェイポート | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| バインドモード | CLI 引数/上書き → `gateway.bind` → `loopback` |

### ホットリロード（設定の即時反映）モード

| `gateway.reload.mode` | 挙動 |
| :--- | :--- |
| `off` | 構成変更を自動反映しません。 |
| `hot` | 安全に反映可能な変更のみを即時適用します。 |
| `restart` | 再起動が必要な変更があった場合にプロセスを再起動します。 |
| `hybrid` (既定) | 安全な場合は即時適用し、必要な場合のみ再起動します。 |

## 管理用コマンドセット

```bash
openclaw gateway status
openclaw gateway status --deep
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

## リモートアクセス

推奨: Tailscale または VPN。
フォールバック: SSH トンネル。

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

その後、ローカルのクライアントを `ws://127.0.0.1:18789` に接続します。

<Warning>
ゲートウェイの認証が設定されている場合、SSH トンネル経由であってもクライアントは認証情報（トークン/パスワード）を送信する必要があります。
</Warning>

参照: [リモートゲートウェイ](/gateway/remote), [認証](/gateway/authentication), [Tailscale](/gateway/tailscale)

## サービス管理とライフサイクル

安定した運用のために、各 OS のサービス管理ツールを使用することを推奨します。

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

LaunchAgent のラベルは `ai.openclaw.gateway`（既定）または `ai.openclaw.<profile>` です。`openclaw doctor` でサービス設定の不一致を監査・修復できます。

  </Tab>

  <Tab title="Linux (systemd ユーザー単位)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

ログアウト後もプロセスを維持するには、lingering を有効にしてください:

```bash
sudo loginctl enable-linger <user>
```

  </Tab>

  <Tab title="Linux (システムサービス)">

マルチユーザー環境や常時稼働サーバーでは、システムユニットを使用してください。

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

  </Tab>
</Tabs>

## 1台のホストで複数のゲートウェイを動かす

通常は **1つ** のゲートウェイで十分です。
厳格な分離が必要な場合や、冗長構成（救旧用プロファイルなど）を組む場合にのみ複数起動してください。

各インスタンスで一意にする必要がある項目:
- `gateway.port`
- `OPENCLAW_CONFIG_PATH`
- `OPENCLAW_STATE_DIR`
- `agents.defaults.workspace`

実行例:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json OPENCLAW_STATE_DIR=~/.openclaw-a openclaw gateway --port 19001
OPENCLAW_CONFIG_PATH=~/.openclaw/b.json OPENCLAW_STATE_DIR=~/.openclaw-b openclaw gateway --port 19002
```

参照: [マルチゲートウェイ](/gateway/multiple-gateways)

### 開発用（dev）プロファイルのクイックパス

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

このモードでは、状態・構成が分離され、ポート番号は `19001` がデフォルトとなります。

## プロトコル早見表 (オペレーター視点)

- クライアントからの最初のフレームは `connect` である必要があります。
- ゲートウェイは `hello-ok` スナップショット (`presence`, `health`, `stateVersion`, `uptimeMs`, 各種制限/ポリシー) を返します。
- リクエスト: `req(method, params)` → `res(ok/payload|error)`。
- 主なイベント: `connect.challenge`, `agent`, `chat`, `presence`, `tick`, `health`, `heartbeat`, `shutdown`。

エージェントの実行は 2 段階で行われます:
1. 即時の受理確認 (`status: "accepted"`)。
2. 最終的な完了応答 (`status: "ok" | "error"`)。この間に、ストリーミングされた `agent` イベントが配信されます。

詳細はプロトコル説明書を参照してください: [ゲートウェイプロトコル](/gateway/protocol)

## 運用チェック項目

### 生存確認 (Liveness)
- WebSocket を開き、`connect` を送信。
- スナップショットを含む `hello-ok` が返ってくることを確認。

### 準備状況 (Readiness)

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### 通信欠落からの復旧 (Gap recovery)
イベントの再送は行われません。シーケンス番号に飛び（Gap）が生じた場合は、継続する前に状態情報（`health`, `system-presence`）をリフレッシュしてください。

## よくある失敗パターンのシグネチャ

| メッセージ | 推定される原因 |
| :--- | :--- |
| `refusing to bind gateway ... without auth` | 認証設定（トークン/パスワード）なしでループバック以外にバインドしようとした。 |
| `another gateway instance is already listening` / `EADDRINUSE` | ポートの衝突。 |
| `Gateway start blocked: set gateway.mode=local` | 構成が `remote` モードになっている。 |
| 接続時の `unauthorized` | クライアントとゲートウェイ間で認証情報が一致していない。 |

詳細な診断フローは、[ゲートウェイのトラブルシューティング](/gateway/troubleshooting) を活用してください。

## 安全性の保証

- ゲートウェイが利用できない場合、プロトコルクライアントは即座にエラーとなります（暗黙的なチャネル直結へのフォールバックは行われません）。
- 不正なフレームや `connect` 以外の初回フレームは拒否され、切断されます。
- 正常なシャットダウン時には、ソケットを閉じる前に `shutdown` イベントを発行します。

---

関連項目:
- [トラブルシューティング](/gateway/troubleshooting)
- [バックグラウンドプロセス](/gateway/background-process)
- [構成設定](/gateway/configuration)
- [ヘルスチェック](/gateway/health)
- [Doctor](/gateway/doctor)
- [認証](/gateway/authentication)
