---
summary: "Gateway サービス、ライフサイクル、および運用の Runbook"
read_when:
  - ゲートウェイプロセスの実行またはデバッグ
title: "ゲートウェイのランブック"
x-i18n:
  source_hash: "38e67f594affc017c4f67811b048ba71434744b611fdb336b504bfc90fcd4a75"
---

# ゲートウェイランブック

このページは、ゲートウェイ サービスの 1 日目の起動と 2 日目の操作に使用します。

<CardGroup cols={2}>
  <Card title="綿密なトラブルシューティング" icon="siren" href="/gateway/troubleshooting">
    正確なコマンド ラダーとログ署名による症状優先の診断。
  </Card>
  <Card title="構成" icon="sliders" href="/gateway/configuration">
    タスク指向のセットアップ ガイド + 完全な構成リファレンス。
  </Card>
  <Card title="機密管理" icon="key-round" href="/gateway/secrets">
    SecretRef コントラクト、実行時のスナップショットの動作、および移行/再ロード操作。
  </Card>
  <Card title="シークレットプラン契約" icon="shield-check" href="/gateway/secrets-plan-contract">
    正確な `secrets apply` ターゲット/パス ルールと参照専用の認証プロファイルの動作。
  </Card>
</CardGroup>

## 5 分間のローカル起動

<Steps>
  <Step title="ゲートウェイを開始する">

```bash
openclaw gateway --port 18789
# debug/trace mirrored to stdio
openclaw gateway --port 18789 --verbose
# force-kill listener on selected port, then start
openclaw gateway --force
```

  </Step>

  <Step title="サービスの正常性を確認する">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

正常なベースライン: `Runtime: running` および `RPC probe: ok`。

  </Step>

  <Step title="チャネルの準備状況を検証する">

```bash
openclaw channels status --probe
```

  </Step>
</Steps>

<Note>
ゲートウェイ構成のリロードは、アクティブな構成ファイルのパス (プロファイル/状態のデフォルト、または設定されている場合は `OPENCLAW_CONFIG_PATH` から解決されます) を監視します。
デフォルトのモードは `gateway.reload.mode="hybrid"` です。
</Note>

## ランタイムモデル- ルーティング、コントロール プレーン、およびチャネル接続のための 1 つの常時接続プロセス

- 単一の多重化ポート:
  - WebSocket制御/RPC
  - HTTP API (OpenAI 互換、レスポンス、ツール呼び出し)
  - コントロール UI とフック
- デフォルトのバインド モード: `loopback`。
- デフォルトでは認証が必要です (`gateway.auth.token` / `gateway.auth.password`、または `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`)。

### ポートとバインドの優先順位

| 設定               | 解決順序                                                      |
| ------------------ | ------------------------------------------------------------- |
| ゲートウェイポート | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| バインドモード     | CLI/オーバーライド → `gateway.bind` → `loopback`              |

### ホットリロードモード

| `gateway.reload.mode` | 行動                                                 |
| --------------------- | ---------------------------------------------------- |
| `off`                 | 設定のリロードはありません                           |
| `hot`                 | ホットセーフな変更のみを適用する                     |
| `restart`             | リロードが必要な変更時に再起動                       |
| `hybrid` (デフォルト) | 安全な場合はホット適用し、必要に応じて再起動します。 |

## オペレーターコマンドセット

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

推奨: テールスケール/VPN。
フォールバック: SSH トンネル。

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

次に、クライアントをローカルで `ws://127.0.0.1:18789` に接続します。

<Warning>
ゲートウェイ認証が構成されている場合、クライアントは SSH トンネル経由でも認証 (`token`/`password`) を送信する必要があります。
</Warning>

参照: [リモート ゲートウェイ](/gateway/remote)、[認証](/gateway/authentication)、[テールスケール](/gateway/tailscale)。

## 監督とサービスのライフサイクル

実稼働環境と同様の信頼性を得るには、監視付き実行を使用します。

<Tabs>
  <Tab title="macOS (起動)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

LaunchAgent ラベルは `ai.openclaw.gateway` (デフォルト) または `ai.openclaw.<profile>` (名前付きプロファイル) です。 `openclaw doctor` は、サービス構成のドリフトを監査および修復します。

  </Tab>

  <Tab title="Linux (systemd ユーザー)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

ログアウト後の永続性を確保するには、残留を有効にします。

```bash
sudo loginctl enable-linger <user>
```

  </Tab>

  <Tab title="Linux（システムサービス）">

マルチユーザー/常時接続ホストにはシステム装置を使用してください。

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

  </Tab>
</Tabs>

## 1 つのホスト上の複数のゲートウェイ

ほとんどのセットアップでは、**1** ゲートウェイを実行する必要があります。
厳密な分離/冗長性 (レスキュー プロファイルなど) の場合にのみ複数を使用します。

インスタンスごとのチェックリスト:

- ユニークな `gateway.port`
- ユニークな `OPENCLAW_CONFIG_PATH`
- ユニークな `OPENCLAW_STATE_DIR`
- ユニークな `agents.defaults.workspace`

例:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json OPENCLAW_STATE_DIR=~/.openclaw-a openclaw gateway --port 19001
OPENCLAW_CONFIG_PATH=~/.openclaw/b.json OPENCLAW_STATE_DIR=~/.openclaw-b openclaw gateway --port 19002
```

参照: [複数のゲートウェイ](/gateway/multiple-gateways)。

### 開発プロファイルのクイック パス

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

デフォルトには、分離状態/構成およびベース ゲートウェイ ポート `19001` が含まれます。

## プロトコルのクイック リファレンス (オペレーター ビュー)- 最初のクライアント フレームは `connect` である必要があります

- ゲートウェイは `hello-ok` スナップショット (`presence`、`health`、`stateVersion`、`uptimeMs`、制限/ポリシー) を返します。
- リクエスト: `req(method, params)` → `res(ok/payload|error)`。
- 一般的なイベント: `connect.challenge`、`agent`、`chat`、`presence`、`tick`、`health`、`heartbeat`、 `shutdown`。

エージェントの実行は 2 段階です。

1. 即時承認 (`status:"accepted"`)
2. 最終完了応答 (`status:"ok"|"error"`)、間にストリーミングされた `agent` イベントが含まれます。

プロトコルの完全なドキュメントを参照してください: [ゲートウェイ プロトコル](/gateway/protocol)。

## 動作確認

### 活気

- WS を開き、`connect` を送信します。
- スナップショット付きの `hello-ok` 応答が期待されます。

### 準備完了

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### ギャップの回復

イベントはリプレイされません。シーケンスのギャップがある場合は、続行する前に状態 (`health`、`system-presence`) を更新します。

## 一般的な失敗の兆候|署名 |考えられる問題 |

| -------------------------------------------------------------- | -------------------------------------- |
| `refusing to bind gateway ... without auth` |トークン/パスワードなしの非ループバック バインド |
| `another gateway instance is already listening` / `EADDRINUSE` |ポートの競合 |
| `Gateway start blocked: set gateway.mode=local` |設定をリモート モードに設定 |
| `unauthorized` 接続中 |クライアントとゲートウェイ間の認証の不一致 |

完全な診断ラダーについては、[ゲートウェイのトラブルシューティング](/gateway/troubleshooting) を使用してください。

## 安全性の保証

- ゲートウェイが使用できない場合、ゲートウェイ プロトコル クライアントは高速に失敗します (暗黙的なダイレクト チャネル フォールバックはありません)。
- 無効または接続されていない最初のフレームは拒否され、閉じられます。
- 正常なシャットダウンは、ソケットを閉じる前に `shutdown` イベントを発行します。

---

関連:

- [トラブルシューティング](/gateway/troubleshooting)
- [バックグラウンドプロセス](/gateway/background-process)
- [構成](/gateway/configuration)
- [健康](/gateway/health)
- [博士](/gateway/doctor)
- [認証](/gateway/authentication)
