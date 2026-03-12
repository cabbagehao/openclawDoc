---
summary: "`openclaw` コマンド、サブコマンド、およびオプションに関する CLI リファレンス"
read_when:
  - CLI コマンドやオプションを追加・変更する場合
  - 新しいコマンド体系をドキュメント化する場合
title: "CLI リファレンス"
x-i18n:
  source_hash: "122d1f3db36f15fd5ab39380cb6ae9dbf8fe42a575e864e73d5abc064be9f0d5"
---
このページでは、現在の CLI の動作について説明します。コマンド仕様が変更された場合は、このドキュメントも更新してください。

## 各コマンドのページ

- [`setup`](/cli/setup) - セットアップ
- [`onboard`](/cli/onboard) - オンボーディング
- [`configure`](/cli/configure) - 対話型設定
- [`config`](/cli/config) - 構成管理
- [`completion`](/cli/completion) - シェル補完
- [`doctor`](/cli/doctor) - 診断と修復
- [`dashboard`](/cli/dashboard) - コントロール UI
- [`backup`](/cli/backup) - バックアップ
- [`reset`](/cli/reset) - リセット
- [`uninstall`](/cli/uninstall) - アンインストール
- [`update`](/cli/update) - アップデート
- [`message`](/cli/message) - メッセージ送信
- [`agent`](/cli/agent) - エージェント実行
- [`agents`](/cli/agents) - 複数エージェント管理
- [`acp`](/cli/acp) - ACP ブリッジ
- [`status`](/cli/status) - ステータス表示
- [`health`](/cli/health) - ヘルスチェック
- [`sessions`](/cli/sessions) - セッション管理
- [`gateway`](/cli/gateway) - ゲートウェイ管理
- [`logs`](/cli/logs) - ログ参照
- [`system`](/cli/system) - システム制御
- [`models`](/cli/models) - モデル管理
- [`memory`](/cli/memory) - 記憶（ベクトル検索）
- [`directory`](/cli/directory) - 連絡先ディレクトリ
- [`nodes`](/cli/nodes) - ノード管理
- [`devices`](/cli/devices) - デバイス管理
- [`node`](/cli/node) - ノードホスト実行
- [`approvals`](/cli/approvals) - 実行承認管理
- [`sandbox`](/cli/sandbox) - サンドボックス管理
- [`tui`](/cli/tui) - ターミナル UI
- [`browser`](/cli/browser) - ブラウザ制御
- [`cron`](/cli/cron) - Cron ジョブ管理
- [`dns`](/cli/dns) - 検出用 DNS 設定
- [`docs`](/cli/docs) - ドキュメント検索
- [`hooks`](/cli/hooks) - フック管理
- [`webhooks`](/cli/webhooks) - Webhook 管理
- [`pairing`](/cli/pairing) - ペアリング承認
- [`qr`](/cli/qr) - QR コード表示
- [`plugins`](/cli/plugins) - プラグイン管理
- [`channels`](/cli/channels) - チャネル管理
- [`security`](/cli/security) - セキュリティ監査
- [`secrets`](/cli/secrets) - シークレット管理
- [`skills`](/cli/skills) - スキル管理
- [`daemon`](/cli/daemon) - デーモン管理 (レガシー)
- [`clawbot`](/cli/clawbot) - 旧コマンド別名
- [`voicecall`](/cli/voicecall) - 音声通話プラグイン（インストール時のみ）

## グローバルフラグ

- `--dev`: 状態を `~/.openclaw-dev` に分離し、デフォルトポートを変更します。
- `--profile <name>`: 状態を `~/.openclaw-<name>` に分離します。
- `--no-color`: ANSI カラーを無効にします。
- `--update`: `openclaw update` の短縮形 (ソースインストール時のみ有効)。
- `-V`, `--version`, `-v`: バージョンを表示して終了します。

## 出力スタイル

- ANSI カラーと進捗インジケーターは、TTY セッション（対話型ターミナル）でのみ表示されます。
- OSC-8 ハイパーリンクは、対応しているターミナルではクリック可能なリンクとして表示されます。未対応の場合は通常の URL が表示されます。
- `--json` (および対応コマンドでの `--plain`) は、装飾を無効にしてクリーンなデータを出力します。
- `--no-color` または環境変数 `NO_COLOR=1` が指定された場合、カラー装飾が無効になります。
- 実行時間の長いコマンドでは、進捗インジケーター（対応端末では OSC 9;4）が表示されます。

## カラーパレット

OpenClaw CLI は、ロブスター（ザリガニ）をモチーフにしたパレットを使用しています。

- `accent` (#FF5A2D): 見出し、ラベル、主要なハイライト。
- `accentBright` (#FF7A3D): コマンド名、強調。
- `accentDim` (#D14A22): 二次的な強調テキスト。
- `info` (#FF8A5B): 情報的な値。
- `success` (#2FBF71): 成功ステータス。
- `warn` (#FFB020): 警告、フォールバック、注意。
- `error` (#E23D2D): エラー、失敗。
- `muted` (#8B7F77): 非強調、メタデータ。

パレットの定義元: `src/terminal/palette.ts`

## コマンドツリー

```text
openclaw [--dev] [--profile <name>] <command>
  setup
  onboard
  configure
  config
    get
    set
    unset
  completion
  doctor
  dashboard
  backup
    create
    verify
  security
    audit
  secrets
    reload
    migrate
  reset
  uninstall
  update
  channels
    list
    status
    logs
    add
    remove
    login
    logout
  directory
  skills
    list
    info
    check
  plugins
    list
    info
    install
    enable
    disable
    doctor
  memory
    status
    index
    search
  message
  agent
  agents
    list
    add
    delete
  acp
  status
  health
  sessions
  gateway
    call
    health
    status
    probe
    discover
    install
    uninstall
    start
    stop
    restart
    run
  daemon
    status
    install
    uninstall
    start
    stop
    restart
  logs
  system
    event
    heartbeat last|enable|disable
    presence
  models
    list
    status
    set
    set-image
    aliases list|add|remove
    fallbacks list|add|remove|clear
    image-fallbacks list|add|remove|clear
    scan
    auth add|setup-token|paste-token
    auth order get|set|clear
  sandbox
    list
    recreate
    explain
  cron
    status
    list
    add
    edit
    rm
    enable
    disable
    runs
    run
  nodes
  devices
  node
    run
    status
    install
    uninstall
    start
    stop
    restart
  approvals
    get
    set
    allowlist add|remove
  browser
    status
    start
    stop
    reset-profile
    tabs
    open
    focus
    close
    profiles
    create-profile
    delete-profile
    screenshot
    snapshot
    navigate
    resize
    click
    type
    press
    hover
    drag
    select
    upload
    fill
    dialog
    wait
    evaluate
    console
    pdf
  hooks
    list
    info
    check
    enable
    disable
    install
    update
  webhooks
    gmail setup|run
  pairing
    list
    approve
  qr
  clawbot
    qr
  docs
  dns
    setup
  tui
```

注意: プラグインによって、さらにトップレベルコマンドが追加される場合があります（例: `openclaw voicecall`）。

---

## セキュリティ (Security)

- `openclaw security audit` — 構成やローカル状態をスキャンし、セキュリティ上の脆弱な設定がないか監査します。
- `openclaw security audit --deep` — 稼働中のゲートウェイに対してもライブプローブを実行します。
- `openclaw security audit --fix` — 安全なデフォルト設定を適用し、状態ディレクトリや構成ファイルの権限を厳格化します。

## シークレット (Secrets)

- `openclaw secrets reload` — 参照を再解決し、実行時のスナップショットをアトミックに切り替えます。
- `openclaw secrets audit` — 平文の残存、未解決の参照、優先順位の乖離をスキャンします。
- `openclaw secrets configure` — プロバイダー設定、SecretRef マッピング、プリフライト/適用を支援する対話型ヘルパーです。
- `openclaw secrets apply --from <plan.json>` — 事前に生成された実行計画を適用します（`--dry-run` 対応）。

## プラグイン (Plugins)

拡張機能とその構成を管理します:

- `openclaw plugins list` — インストール済みのプラグインを確認します。
- `openclaw plugins info <id>` — 特定のプラグインの詳細を表示します。
- `openclaw plugins install <path|.tgz|npm-spec>` — プラグインをインストールします。
- `openclaw plugins enable <id>` / `disable <id>` — プラグインの有効・無効を切り替えます。
- `openclaw plugins doctor` — プラグインのロードエラーを報告します。

ほとんどの変更を反映させるにはゲートウェイの再起動が必要です。詳細は [/plugin](/tools/plugin) を参照してください。

## 記憶 (Memory)

`MEMORY.md` や `memory/*.md` に対するベクトル検索を行います:

- `openclaw memory status` — インデックスの統計情報を表示します。
- `openclaw memory index` — 記憶ファイルのインデックスを再作成します。
- `openclaw memory search "<query>"` — 記憶に対するセマンティック検索を実行します。

## チャット内スラッシュコマンド

チャットメッセージ内では `/...` 形式のコマンド（テキストおよびネイティブ）が利用可能です。詳細は [/tools/slash-commands](/tools/slash-commands) を参照してください。

主なコマンド:
- `/status`: 迅速な自己診断。
- `/config`: 永続的な構成変更。
- `/debug`: 実行時のみの構成オーバーライド（ディスクではなくメモリ上のみ、`commands.debug: true` が必要）。

## セットアップとオンボーディング

### `setup`

構成ファイルとワークスペースを初期化します。

オプション:
- `--workspace <dir>`: ワークスペースのパス (デフォルト `~/.openclaw/workspace`)。
- `--wizard`: オンボーディングウィザードを実行。
- `--non-interactive`: プロンプトなしで実行。
- `--mode <local|remote>`: ウィザードのモード。

ウィザード関連のフラグが指定された場合、ウィザードが自動的に開始されます。

### `onboard`

ゲートウェイ、ワークスペース、スキルをセットアップするための対話型ウィザードです。

主なオプション:
- `--workspace <dir>`: ワークスペースのパス。
- `--reset`: ウィザード実行前に既存の構成、認証情報、セッションをリセット。
- `--reset-scope <config|config+creds+sessions|full>`: リセットの範囲。
- `--auth-choice <...>`: 初期認証方法の選択。
- `--secret-input-mode <plaintext|ref>`: 認証情報の保存形式（平文か環境変数参照か）。
- 各プロバイダー用 API キー指定フラグ (`--anthropic-api-key` など)。
- `--install-daemon`: 管理サービスとしてインストール。
- `--node-manager <npm|pnpm|bun>`: パッケージマネージャーの選択。

### `configure`

対話型の構成設定ウィザード（モデル、チャネル、スキル、ゲートウェイ）です。

### `config`

非対話型の構成管理ヘルパーです。サブコマンドなしで実行するとウィザードが開始されます。

サブコマンド:
- `config get <path>`: 指定したパスの値を表示。
- `config set <path> <value>`: 値を設定 (JSON5 または生文字列)。
- `config unset <path>`: 設定を削除。
- `config file`: 有効な構成ファイルのパスを表示。
- `config validate`: 構成内容をスキーマに対して検証。

### `doctor`

ヘルスチェックと迅速な修復（構成、ゲートウェイ、レガシーサービス）を行います。

オプション:
- `--yes`: プロンプトを表示せずデフォルト設定を適用。
- `--non-interactive`: 安全な移行（マイグレーション）のみを自動適用。
- `--deep`: システム全体をスキャンして余分なインストールがないか確認。

---

## 各機能のヘルパー

### `channels`

チャットチャネルのアカウント（WhatsApp, Telegram, Discord, Google Chat, Slack, Mattermost, Signal, iMessage, MS Teams）を管理します。

サブコマンド:
- `channels list`: 構成済みのチャネルと認証プロファイルを表示。
- `channels status`: 到達可能性と健全性を確認。
- `channels logs`: ゲートウェイのログファイルから最近のチャネルログを抽出。
- `channels add`: アカウントの追加（対話型ウィザードあり）。
- `channels login`: 対話型ログイン (WhatsApp Web など)。

### `skills`

利用可能なスキルとその準備状況を確認します。

サブコマンド:
- `skills list`: スキルの一覧表示。
- `skills info <name>`: 特定のスキルの詳細。
- `skills check`: 必要条件を満たしているかのチェック。

### `pairing`

各チャネルにおける DM のペアリング要求を承認します。

### `devices`

ゲートウェイのデバイスペアリングエントリと、ロールごとのデバイストークンを管理します。

### `webhooks gmail`

Gmail Pub/Sub フックのセットアップと実行を行います。

### `dns setup`

広域検出用 DNS ヘルパー（CoreDNS + Tailscale）の設定を行います。

---

## メッセージングとエージェント

### `message`

統合されたアウトバウンドメッセージ送信およびチャネル操作を行います。

サブコマンド:
`send`, `poll`, `react`, `read`, `edit`, `delete`, `pin`, `permissions`, `search`, `thread`, `emoji`, `sticker`, `role`, `channel`, `member info` など。

### `agent`

ゲートウェイ経由でエージェントターンを 1 回実行します。

### `agents`

分離されたエージェント（ワークスペース、認証、ルーティングが独立）を管理します。

サブコマンド:
`list`, `add`, `delete`, `bind`, `unbind`, `bindings` など。

### `acp`

IDE をゲートウェイに接続するための ACP ブリッジを実行します。

---

## ステータスと診断

### `status`

リンクされたセッションの健全性と、最近の通信相手を表示します。

### `health`

稼働中のゲートウェイからヘルス情報を取得します。

### `sessions`

保存されている会話セッションを一覧表示します。

---

## リセットとアンインストール

### `reset`

ローカルの構成や状態をリセットします（CLI 自体はインストールされたままになります）。

### `uninstall`

ゲートウェイサービスとローカルデータをアンインストールします。

---

## ゲートウェイ (Gateway)

### `gateway`

WebSocket ゲートウェイ本体を起動します。

### `gateway service`

ゲートウェイをサービス（launchd, systemd, schtasks）として管理します。

サブコマンド:
`status`, `install`, `uninstall`, `start`, `stop`, `restart`

---

## ログ (Logs)

### `logs`

RPC 経由でゲートウェイのファイルログをリアルタイム表示（tail）します。

---

## モデル (Models)

### `models`

認証プロファイルの概要や、OAuth の有効期限などを表示します。

サブコマンド:
`list`, `status`, `set`, `scan`, `auth`, `aliases`, `fallbacks` など。

---

## システム (System)

### `system`

システムイベントの投入、ハートビートの制御、プレゼンス情報の確認などを行います。

---

## Cron

スケジュールされたジョブを管理します。

---

## ノード (Node)

### `node`

ヘッドレスノードホストを実行、またはサービスとして管理します。

### `nodes`

ゲートウェイと通信し、ペアリングされたノードを操作します。

---

## ブラウザ (Browser)

### `browser`

ブラウザ制御用の CLI です。

---

## TUI

### `tui`

ゲートウェイに接続されたターミナル UI を開きます。
