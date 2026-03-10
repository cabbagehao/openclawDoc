---
summary: "「openclaw」コマンド、サブコマンド、およびオプションに関する OpenClaw CLI リファレンス"
read_when:
  - CLI コマンドまたはオプションの追加または変更
  - 新しいコマンド サーフェスの文書化
title: "CLI リファレンス"
x-i18n:
  source_hash: "122d1f3db36f15fd5ab39380cb6ae9dbf8fe42a575e864e73d5abc064be9f0d5"
---

# CLI リファレンス

このページでは、現在の CLI の動作について説明します。コマンドが変更された場合は、このドキュメントを更新してください。

## コマンドページ- [`setup`](/cli/setup)

- [`onboard`](/cli/onboard)
- [`configure`](/cli/configure)
- [`config`](/cli/config)
- [`completion`](/cli/completion)
- [`doctor`](/cli/doctor)
- [`dashboard`](/cli/dashboard)
- [`backup`](/cli/backup)
- [`reset`](/cli/reset)
- [`uninstall`](/cli/uninstall)
- [`update`](/cli/update)
- [`message`](/cli/message)
- [`agent`](/cli/agent)
- [`agents`](/cli/agents)
- [`acp`](/cli/acp)
- [`status`](/cli/status)
- [`health`](/cli/health)
- [`sessions`](/cli/sessions)
- [`gateway`](/cli/gateway)
- [`logs`](/cli/logs)
- [`system`](/cli/system)
- [`models`](/cli/models)
- [`memory`](/cli/memory)
- [`directory`](/cli/directory)
- [`nodes`](/cli/nodes)
- [`devices`](/cli/devices)
- [`node`](/cli/node)
- [`approvals`](/cli/approvals)
- [`sandbox`](/cli/sandbox)
- [`tui`](/cli/tui)
- [`browser`](/cli/browser)
- [`cron`](/cli/cron)
- [`dns`](/cli/dns)
- [`docs`](/cli/docs)
- [`hooks`](/cli/hooks)- [`webhooks`](/cli/webhooks)
- [`pairing`](/cli/pairing)
- [`qr`](/cli/qr)
- [`plugins`](/cli/plugins) (プラグイン コマンド)
- [`channels`](/cli/channels)
- [`security`](/cli/security)
- [`secrets`](/cli/secrets)
- [`skills`](/cli/skills)
- [`daemon`](/cli/daemon) (ゲートウェイ サービス コマンドのレガシー エイリアス)
- [`clawbot`](/cli/clawbot) (従来のエイリアス名前空間)
- [`voicecall`](/cli/voicecall) (プラグイン; インストールされている場合)

## グローバルフラグ

- `--dev`: `~/.openclaw-dev` で状態を分離し、デフォルト ポートをシフトします。
- `--profile <name>`: `~/.openclaw-<name>` で状態を分離します。
- `--no-color`: ANSI カラーを無効にします。
- `--update`: `openclaw update` の短縮形 (ソース インストールのみ)。
- `-V`、`--version`、`-v`: バージョンを出力して終了します。

## 出力スタイル

- ANSI カラーと進行状況インジケーターは、TTY セッションでのみレンダリングされます。
- OSC-8 ハイパーリンクは、サポートされている端末でクリック可能なリンクとしてレンダリングされます。それ以外の場合は、プレーンな URL に戻ります。
- `--json` (サポートされている場合は `--plain`) は、クリーンな出力のためのスタイル設定を無効にします。
- `--no-color` は ANSI スタイルを無効にします。 `NO_COLOR=1` も尊重されます。
- 長時間実行されるコマンドには進行状況インジケーターが表示されます (サポートされている場合は OSC 9;4)。

## カラーパレット

OpenClaw は、CLI 出力にロブスター パレットを使用します。- `accent` (#FF5A2D): 見出し、ラベル、主なハイライト。

- `accentBright` (#FF7A3D): コマンド名、強調。
- `accentDim` (#D14A22): 二次強調表示テキスト。
- `info` (#FF8A5B): 情報値。
- `success` (#2FBF71): 成功状態。
- `warn` (#FFB020): 警告、フォールバック、注意。
- `error` (#E23D2D): エラー、失敗。
- `muted` (#8B7F77): ディエンファシス、メタデータ。

パレットの真実の情報源: `src/terminal/palette.ts` (別名「ロブスターの縫い目」)。

## コマンドツリー

```
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

注: プラグインは追加のトップレベル コマンド (`openclaw voicecall` など) を追加できます。

## セキュリティ

- `openclaw security audit` — 一般的なセキュリティ フットガンの監査設定 + ローカル状態。
- `openclaw security audit --deep` — ベストエフォートのライブ ゲートウェイ プローブ。
- `openclaw security audit --fix` — 安全なデフォルトと chmod state/config を厳格化します。

## 秘密

- `openclaw secrets reload` — 参照を再解決し、実行時スナップショットをアトミックに交換します。
- `openclaw secrets audit` — 平文の残余、未解決の参照、および優先順位のドリフトをスキャンします。
- `openclaw secrets configure` — プロバイダーのセットアップ + SecretRef マッピング + プリフライト/適用のための対話型ヘルパー。
- `openclaw secrets apply --from <plan.json>` — 以前に生成された計画を適用します (`--dry-run` がサポートされています)。

## プラグイン

拡張機能とその構成を管理します。- `openclaw plugins list` — プラグインを検出します (マシン出力には `--json` を使用します)。

- `openclaw plugins info <id>` — プラグインの詳細を表示します。
- `openclaw plugins install <path|.tgz|npm-spec>` — プラグインをインストールします (またはプラグイン パスを `plugins.load.paths` に追加します)。
- `openclaw plugins enable <id>` / `disable <id>` — `plugins.entries.<id>.enabled` を切り替えます。
- `openclaw plugins doctor` — プラグインのロード エラーを報告します。

ほとんどのプラグインの変更にはゲートウェイの再起動が必要です。 [/plugin](/tools/plugin) を参照してください。

## メモリ

`MEMORY.md` + `memory/*.md` に対するベクトル検索:

- `openclaw memory status` — インデックス統計を表示します。
- `openclaw memory index` — メモリ ファイルのインデックスを再作成します。
- `openclaw memory search "<query>"` (または `--query "<query>"`) — メモリ上のセマンティック検索。

## チャットスラッシュコマンド

チャット メッセージは `/...` コマンド (テキストおよびネイティブ) をサポートします。 [/tools/slash-commands](/tools/slash-commands) を参照してください。

ハイライト:

- `/status` で簡単に診断できます。
- `/config` 永続的な構成変更の場合。
- `/debug` はランタイムのみの構成オーバーライド用 (ディスクではなくメモリ。`commands.debug: true` が必要)。

## セットアップ + オンボーディング

### `setup`

config + ワークスペースを初期化します。

オプション:

- `--workspace <dir>`: エージェント ワークスペース パス (デフォルト `~/.openclaw/workspace`)。
- `--wizard`: オンボーディング ウィザードを実行します。
- `--non-interactive`: プロンプトなしでウィザードを実行します。
- `--mode <local|remote>`: ウィザード モード。
- `--remote-url <url>`: リモート ゲートウェイ URL。
- `--remote-token <token>`: リモート ゲートウェイ トークン。ウィザード フラグ (`--non-interactive`、`--mode`、`--remote-url`、`--remote-token`) が存在すると、ウィザードが自動実行されます。

### `onboard`

ゲートウェイ、ワークスペース、スキルを設定するための対話型ウィザード。

オプション:- `--workspace <dir>`

- `--reset` (ウィザードの前に設定 + 資格情報 + セッションをリセット)
- `--reset-scope <config|config+creds+sessions|full>` (デフォルトは `config+creds+sessions`、ワークスペースも削除するには `full` を使用します)
- `--non-interactive`
- `--mode <local|remote>`
- `--flow <quickstart|advanced|manual>` (マニュアルはアドバンストのエイリアスです)
- `--auth-choice <setup-token|token|chutes|openai-codex|openai-api-key|openrouter-api-key|ai-gateway-api-key|moonshot-api-key|moonshot-api-key-cn|kimi-code-api-key|synthetic-api-key|venice-api-key|gemini-api-key|zai-api-key|mistral-api-key|apiKey|minimax-api|minimax-api-lightning|opencode-zen|custom-api-key|skip>`
- `--token-provider <id>` (非対話型; `--auth-choice token` とともに使用)
- `--token <token>` (非対話型; `--auth-choice token` とともに使用)
- `--token-profile-id <id>` (非対話型; デフォルト: `<provider>:manual`)
- `--token-expires-in <duration>` (非対話型; 例: `365d`、`12h`)
- `--secret-input-mode <plaintext|ref>` (デフォルトは `plaintext`、平文キーの代わりにプロバイダーのデフォルトの環境参照を保存するには `ref` を使用します)
- `--anthropic-api-key <key>`
- `--openai-api-key <key>`
- `--mistral-api-key <key>`
- `--openrouter-api-key <key>`
- `--ai-gateway-api-key <key>`
- `--moonshot-api-key <key>`
- `--kimi-code-api-key <key>`
- `--gemini-api-key <key>`
- `--zai-api-key <key>`
- `--minimax-api-key <key>`
- `--opencode-zen-api-key <key>`
- `--custom-base-url <url>` (非対話型; `--auth-choice custom-api-key` とともに使用)
- `--custom-model-id <id>` (非対話型; `--auth-choice custom-api-key` とともに使用)
- `--custom-api-key <key>` (非対話型; オプション; `--auth-choice custom-api-key` とともに使用; 省略された場合は `CUSTOM_API_KEY` に戻ります)
- `--custom-provider-id <id>` (非対話型、オプションのカスタム プロバイダー ID)
- `--custom-compatibility <openai|anthropic>` (非対話型、オプション、デフォルト `openai`)
- `--gateway-port <port>`
- `--gateway-bind <loopback|lan|tailnet|auto|custom>`
- `--gateway-auth <token|password>`
- `--gateway-token <token>`- `--gateway-token-ref-env <name>` (非対話型。`gateway.auth.token` を環境 SecretRef として保存します。環境変数を設定する必要があります。`--gateway-token` と組み合わせることはできません)
- `--gateway-password <password>`
- `--remote-url <url>`
- `--remote-token <token>`
- `--tailscale <off|serve|funnel>`
- `--tailscale-reset-on-exit`
- `--install-daemon`
- `--no-install-daemon` (別名: `--skip-daemon`)
- `--daemon-runtime <node|bun>`
- `--skip-channels`
- `--skip-skills`
- `--skip-health`
- `--skip-ui`
- `--node-manager <npm|pnpm|bun>` (pnpm を推奨。ゲートウェイ ランタイムには bun は推奨されません)
- `--json`

### `configure`

インタラクティブな構成ウィザード (モデル、チャネル、スキル、ゲートウェイ)。

### `config`

非対話型構成ヘルパー (get/set/unset/file/validate)。 `openclaw config` を何も指定せずに実行しています
サブコマンドはウィザードを起動します。

サブコマンド:

- `config get <path>`: 設定値 (ドット/括弧パス) を出力します。
- `config set <path> <value>`: 値 (JSON5 または生の文字列) を設定します。
- `config unset <path>`: 値を削除します。
- `config file`: アクティブな構成ファイルのパスを出力します。
- `config validate`: ゲートウェイを起動せずに、現在の構成をスキーマに対して検証します。
- `config validate --json`: 機械可読な JSON 出力を出力します。

### `doctor`

ヘルスチェック + クイックフィックス (構成 + ゲートウェイ + 従来のサービス)。

オプション:- `--no-workspace-suggestions`: ワークスペースのメモリ ヒントを無効にします。

- `--yes`: プロンプトを表示せずにデフォルトを受け入れます (ヘッドレス)。
- `--non-interactive`: プロンプトをスキップします。安全な移行のみを適用してください。
- `--deep`: システム サービスをスキャンして追加のゲートウェイ インストールを探します。

## チャネルヘルパー

### `channels`

チャット チャネル アカウント (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (プラグイン)/Signal/iMessage/MS Teams) を管理します。

サブコマンド:- `channels list`: 設定されたチャネルと認証プロファイルを表示します。

- `channels status`: ゲートウェイの到達可能性とチャネルの健全性をチェックします (`--probe` は追加のチェックを実行します。ゲートウェイの健全性プローブには `openclaw health` または `openclaw status --deep` を使用します)。
- ヒント: `channels status` は、一般的な構成ミスを検出できる場合に、推奨される修正を含む警告を出力します (その後、`openclaw doctor` が示されます)。
- `channels logs`: ゲートウェイ ログ ファイルから最近のチャネル ログを表示します。
- `channels add`: フラグが渡されない場合のウィザード スタイルのセットアップ。 flags は非対話モードに切り替わります。
  - 単一アカウントのトップレベル設定をまだ使用しているチャンネルにデフォルト以外のアカウントを追加すると、OpenClaw は新しいアカウントを書き込む前に、アカウント スコープの値を `channels.<channel>.accounts.default` に移動します。
  - 非対話型 `channels add` はバインディングを自動作成/アップグレードしません。チャネルのみのバインディングは引き続きデフォルトのアカウントと一致します。
- `channels remove`: デフォルトでは無効です。プロンプトを表示せずに構成エントリを削除するには、`--delete` を渡します。
- `channels login`: 対話型チャネル ログイン (WhatsApp Web のみ)。
- `channels logout`: チャネル セッションからログアウトします (サポートされている場合)。

一般的なオプション:

- `--channel <name>`: `whatsapp|telegram|discord|googlechat|slack|mattermost|signal|imessage|msteams`
- `--account <id>`: チャネル アカウント ID (デフォルト `default`)
- `--name <label>`: アカウントの表示名

`channels login` オプション:- `--channel <channel>` (デフォルトは `whatsapp`、`whatsapp`/`web` をサポート)

- `--account <id>`
- `--verbose`

`channels logout` オプション:

- `--channel <channel>` (デフォルトは `whatsapp`)
- `--account <id>`

`channels list` オプション:

- `--no-usage`: モデル プロバイダーの使用状況/クォータ スナップショットをスキップします (OAuth/API ベースのみ)。
- `--json`: 出力 JSON (`--no-usage` が設定されていない場合の使用法を含む)。

`channels logs` オプション:

- `--channel <name|all>` (デフォルト `all`)
- `--lines <n>` (デフォルト `200`)
- `--json`

詳細: [/concepts/oauth](/concepts/oauth)

例:

```bash
openclaw channels add --channel telegram --account alerts --name "Alerts Bot" --token $TELEGRAM_BOT_TOKEN
openclaw channels add --channel discord --account work --name "Work Bot" --token $DISCORD_BOT_TOKEN
openclaw channels remove --channel discord --account work --delete
openclaw channels status --probe
openclaw status --deep
```

### `skills`

利用可能なスキルと準備状況情報をリストし、検査します。

サブコマンド:

- `skills list`: スキルのリスト (サブコマンドがない場合のデフォルト)。
- `skills info <name>`: 1 つのスキルの詳細を表示します。
- `skills check`: 準備ができている要件と不足している要件の概要。

オプション:

- `--eligible`: 準備ができているスキルのみを表示します。
- `--json`: JSON を出力します (スタイルなし)。
- `-v`、`--verbose`: 不足している要件の詳細を含めます。

ヒント: `npx clawhub` を使用して、スキルを検索、インストール、同期します。

### `pairing`

チャネル全体での DM ペアリング リクエストを承認します。

サブコマンド:

- `pairing list [channel] [--channel <channel>] [--account <id>] [--json]`
- `pairing approve <channel> <code> [--account <id>] [--notify]`
- `pairing approve --channel <channel> [--account <id>] <code> [--notify]`

### `devices`

ゲートウェイ デバイス ペアリング エントリと役割ごとのデバイス トークンを管理します。

サブコマンド:- `devices list [--json]`

- `devices approve [requestId] [--latest]`
- `devices reject <requestId>`
- `devices remove <deviceId>`
- `devices clear --yes [--pending]`
- `devices rotate --device <id> --role <role> [--scope <scope...>]`
- `devices revoke --device <id> --role <role>`

### `webhooks gmail`

Gmail Pub/Sub フックのセットアップ + ランナー。 [/automation/gmail-pubsub](/automation/gmail-pubsub) を参照してください。

サブコマンド:

- `webhooks gmail setup` (`--account <email>` が必要; `--project`、`--topic`、`--subscription`、`--label`、`--hook-url`、をサポート`--hook-token`、`--push-token`、`--bind`、`--port`、`--path`、`--include-body`、`--max-bytes`、 `--renew-minutes`、`--tailscale`、`--tailscale-path`、`--tailscale-target`、`--push-endpoint`、`--json`)
- `webhooks gmail run` (同じフラグの実行時オーバーライド)

### `dns setup`

広域探索 DNS ヘルパー (CoreDNS + Tailscale)。 [/gateway/discovery](/gateway/discovery) を参照してください。

オプション:

- `--apply`: CoreDNS 構成をインストール/更新します (sudo が必要、macOS のみ)。

## メッセージング + エージェント

### `message`

統合されたアウトバウンド メッセージング + チャネル アクション。

参照: [/cli/message](/cli/message)

サブコマンド:

- `message send|poll|react|reactions|read|edit|delete|pin|unpin|pins|permissions|search|timeout|kick|ban`
- `message thread <create|list|reply>`
- `message emoji <list|upload>`
- `message sticker <send|upload>`
- `message role <info|add|remove>`
- `message channel <info|list>`
- `message member info`
- `message voice status`
- `message event <list|create>`

例:

- `openclaw message send --target +15555550123 --message "Hi"`
- `openclaw message poll --channel discord --target channel:123 --poll-question "Snack?" --poll-option Pizza --poll-option Sushi`

### `agent`

ゲートウェイ (または `--local` 埋め込み) 経由でエージェント ターンを 1 回実行します。

必須:

- `--message <text>`オプション:

- `--to <dest>` (セッションキーとオプションの配信用)
- `--session-id <id>`
- `--thinking <off|minimal|low|medium|high|xhigh>` (GPT-5.2 + Codex モデルのみ)
- `--verbose <on|full|off>`
- `--channel <whatsapp|telegram|discord|slack|mattermost|signal|imessage|msteams>`
- `--local`
- `--deliver`
- `--json`
- `--timeout <seconds>`

### `agents`

分離されたエージェントを管理します (ワークスペース + 認証 + ルーティング)。

#### `agents list`

構成されたエージェントをリストします。

オプション:

- `--json`
- `--bindings`

#### `agents add [name]`

新しい分離エージェントを追加します。フラグ (または `--non-interactive`) が渡されない限り、ガイド付きウィザードを実行します。 `--workspace` は非対話モードで必要です。

オプション:

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>` (繰り返し可能)
- `--non-interactive`
- `--json`

バインディング仕様は `channel[:accountId]` を使用します。 `accountId` が省略された場合、OpenClaw はチャネルのデフォルト/プラグイン フックを介してアカウント スコープを解決する可能性があります。それ以外の場合は、明示的なアカウント スコープのないチャネル バインディングになります。

#### `agents bindings`

ルーティング バインディングをリストします。

オプション:

- `--agent <id>`
- `--json`

#### `agents bind`

エージェントのルーティング バインディングを追加します。

オプション:

- `--agent <id>`
- `--bind <channel[:accountId]>` (繰り返し可能)
- `--json`

#### `agents unbind`

エージェントのルーティング バインディングを削除します。

オプション:

- `--agent <id>`
- `--bind <channel[:accountId]>` (繰り返し可能)
- `--all`
- `--json`

#### `agents delete <id>`エージェントを削除し、そのワークスペースと状態を整理します

オプション:

- `--force`
- `--json`

### `acp`

IDE をゲートウェイに接続する ACP ブリッジを実行します。

完全なオプションと例については、[`acp`](/cli/acp) を参照してください。

### `status`

リンクされたセッションの健全性と最近の受信者を表示します。

オプション:

- `--json`
- `--all` (完全な診断; 読み取り専用、貼り付け可能)
- `--deep` (プローブ チャネル)
- `--usage` (モデルプロバイダーの使用量/割り当てを表示)
- `--timeout <ms>`
- `--verbose`
- `--debug` (`--verbose` のエイリアス)

注:

- 概要には、利用可能な場合、ゲートウェイ + ノード ホスト サービスのステータスが含まれます。

### 使用状況の追跡

OpenClaw は、OAuth/API 認証情報が利用可能な場合、プロバイダーの使用状況/割り当てを表示できます。

表面:

- `/status` (利用可能な場合、短いプロバイダー使用量行を追加します)
- `openclaw status --usage` (プロバイダーの完全な内訳を出力)
- macOS メニュー バー (コンテキストの下の使用セクション)

注:

- データはプロバイダーの使用エンドポイントから直接取得されます (推定値なし)。
- プロバイダー: Anthropic、GitHub Copilot、OpenAI Codex OAuth、およびこれらのプロバイダー プラグインが有効な場合の Gemini CLI/Antigravity。
- 一致する資格情報が存在しない場合、使用法は非表示になります。
- 詳細: [使用状況追跡](/concepts/usage-tracking) を参照してください。

### `health`

実行中のゲートウェイからヘルスを取得します。

オプション:

- `--json`
- `--timeout <ms>`
- `--verbose`### `sessions`

保存されている会話セッションをリストします。

オプション:

- `--json`
- `--verbose`
- `--store <path>`
- `--active <minutes>`

## リセット/アンインストール

### `reset`

ローカルの設定/状態をリセットします (CLI のインストールを維持します)。

オプション:

- `--scope <config|config+creds+sessions|full>`
- `--yes`
- `--non-interactive`
- `--dry-run`

注:

- `--non-interactive` には `--scope` および `--yes` が必要です。

### `uninstall`

ゲートウェイ サービスとローカル データをアンインストールします (CLI は残ります)。

オプション:

- `--service`
- `--state`
- `--workspace`
- `--app`
- `--all`
- `--yes`
- `--non-interactive`
- `--dry-run`

注:

- `--non-interactive` には、`--yes` と明示的なスコープ (または `--all`) が必要です。

## ゲートウェイ

### `gateway`

WebSocket ゲートウェイを実行します。

オプション:

- `--port <port>`
- `--bind <loopback|tailnet|lan|auto|custom>`
- `--token <token>`
- `--auth <token|password>`
- `--password <password>`
- `--password-file <path>`
- `--tailscale <off|serve|funnel>`
- `--tailscale-reset-on-exit`
- `--allow-unconfigured`
- `--dev`
- `--reset` (開発構成 + 資格情報 + セッション + ワークスペースをリセット)
- `--force` (ポート上の既存のリスナーを強制終了)
- `--verbose`
- `--claude-cli-logs`
- `--ws-log <auto|full|compact>`
- `--compact` (`--ws-log compact` のエイリアス)
- `--raw-stream`
- `--raw-stream-path <path>`

### `gateway service`

ゲートウェイ サービス (launchd/systemd/schtasks) を管理します。

サブコマンド:- `gateway status` (デフォルトでゲートウェイ RPC をプローブします)

- `gateway install` (サービスのインストール)
- `gateway uninstall`
- `gateway start`
- `gateway stop`
- `gateway restart`

注:

- `gateway status` は、サービスの解決されたポート/構成を使用して、デフォルトでゲートウェイ RPC をプローブします (`--url/--token/--password` でオーバーライドされます)。
- `gateway status` は、スクリプト用に `--no-probe`、`--deep`、および `--json` をサポートします。
- `gateway status` は、レガシーまたは追加のゲートウェイ サービスを検出できる場合には、それらのサービスも表示します (`--deep` はシステム レベルのスキャンを追加します)。プロファイル名付きの OpenClaw サービスはファーストクラスとして扱われ、「エクストラ」としてフラグが立てられません。
- `gateway status` は、CLI が使用する構成パスとサービスが使用する可能性のある構成 (サービス環境)、および解決されたプローブ ターゲット URL を出力します。
- Linux systemd インストールでは、ステータス トークン ドリフト チェックに `Environment=` と `EnvironmentFile=` の両方のユニット ソースが含まれます。
- `gateway install|uninstall|start|stop|restart` は、スクリプト用に `--json` をサポートします (デフォルトの出力は人間に優しいままです)。
- `gateway install` のデフォルトはノード ランタイムです。 bun は **推奨されません** (WhatsApp/Telegram のバグ)。
- `gateway install` オプション: `--port`、`--runtime`、`--token`、`--force`、`--json`。

### `logs`

RPC 経由のテール ゲートウェイ ファイル ログ。

注:- TTY セッションは、色分けされた構造化されたビューをレンダリングします。非 TTY はプレーン テキストに戻ります。

- `--json` は、行区切りの JSON (行ごとに 1 つのログ イベント) を出力します。

例:

```bash
openclaw logs --follow
openclaw logs --limit 200
openclaw logs --plain
openclaw logs --json
openclaw logs --no-color
```

### `gateway <subcommand>`

ゲートウェイ CLI ヘルパー (RPC サブコマンドには `--url`、`--token`、`--password`、`--timeout`、`--expect-final` を使用します)。
`--url` を渡すと、CLI は構成または環境の資格情報を自動適用しません。
`--token` または `--password` を明示的に含めます。明示的な資格情報が欠落しているとエラーになります。

サブコマンド:

- `gateway call <method> [--params <json>]`
- `gateway health`
- `gateway status`
- `gateway probe`
- `gateway discover`
- `gateway install|uninstall|start|stop|restart`
- `gateway run`

一般的な RPC:

- `config.apply` (検証 + 構成の書き込み + 再起動 + ウェイク)
- `config.patch` (部分的な更新 + 再起動 + ウェイクをマージ)
- `update.run` (アップデートの実行 + 再起動 + スリープ解除)

ヒント: `config.set`/`config.apply`/`config.patch` を直接呼び出す場合は、から `baseHash` を渡します。
`config.get` 構成がすでに存在する場合。

## モデル

フォールバック動作とスキャン戦略については、[/concepts/models](/concepts/models) を参照してください。

Anthropic セットアップ トークン (サポートされています):

```bash
claude setup-token
openclaw models auth setup-token --provider anthropic
openclaw models status
```

ポリシーに関する注記: これは技術的な互換性に関するものです。 Anthropic が一部をブロックしました
過去に Claude Code 以外でサブスクリプションを使用したこと。現在の Anthropic を確認する
運用環境で setup-token に依存する前に、### `models` (ルート)

`openclaw models` は、`models status` のエイリアスです。

ルートオプション:

- `--status-json` (`models status --json` のエイリアス)
- `--status-plain` (`models status --plain` のエイリアス)

### `models list`

オプション:

- `--all`
- `--local`
- `--provider <name>`
- `--json`
- `--plain`

### `models status`

オプション:

- `--json`
- `--plain`
- `--check` (出口 1=期限切れ/欠落、2=期限切れ)
- `--probe` (構成された認証プロファイルのライブ プローブ)
- `--probe-provider <name>`
- `--probe-profile <id>` (繰り返しまたはカンマ区切り)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`

認証ストア内のプロファイルの認証概要と OAuth 有効期限ステータスが常に含まれます。
`--probe` はライブ リクエストを実行します (トークンを消費し、レート制限をトリガーする可能性があります)。

### `models set <model>`

`agents.defaults.model.primary` を設定します。

### `models set-image <model>`

`agents.defaults.imageModel.primary` を設定します。

### `models aliases list|add|remove`

オプション:

- `list`: `--json`、`--plain`
- `add <alias> <model>`
- `remove <alias>`

### `models fallbacks list|add|remove|clear`

オプション:

- `list`: `--json`、`--plain`
- `add <model>`
- `remove <model>`
- `clear`

### `models image-fallbacks list|add|remove|clear`

オプション:

- `list`: `--json`、`--plain`
- `add <model>`
- `remove <model>`
- `clear`

### `models scan`

オプション:- `--min-params <b>`

- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>`
- `--concurrency <n>`
- `--no-probe`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

### `models auth add|setup-token|paste-token`

オプション:

- `add`: 対話型認証ヘルパー
- `setup-token`: `--provider <name>` (デフォルトは `anthropic`)、`--yes`
- `paste-token`: `--provider <name>`、`--profile-id <id>`、`--expires-in <duration>`

### `models auth order get|set|clear`

オプション:

- `get`: `--provider <name>`、`--agent <id>`、`--json`
- `set`: `--provider <name>`、`--agent <id>`、`<profileIds...>`
- `clear`: `--provider <name>`、`--agent <id>`

## システム

### `system event`

システム イベントをキューに入れ、必要に応じてハートビート (ゲートウェイ RPC) をトリガーします。

必須:

- `--text <text>`

オプション:

- `--mode <now|next-heartbeat>`
- `--json`
- `--url`、`--token`、`--timeout`、`--expect-final`

### `system heartbeat last|enable|disable`

ハートビート制御 (ゲートウェイ RPC)。

オプション:

- `--json`
- `--url`、`--token`、`--timeout`、`--expect-final`

### `system presence`

システム プレゼンス エントリを一覧表示します (ゲートウェイ RPC)。

オプション:

- `--json`
- `--url`、`--token`、`--timeout`、`--expect-final`

## クロン

スケジュールされたジョブを管理します (ゲートウェイ RPC)。 [/automation/cron-jobs](/automation/cron-jobs) を参照してください。

サブコマンド:- `cron status [--json]`

- `cron list [--all] [--json]` (デフォルトでテーブル出力。生の場合は `--json` を使用)
- `cron add` (エイリアス: `create`; `--name` と、`--at` | `--every` | `--cron` の 1 つだけ、および 1 つのペイロードが必要です`--system-event` | `--message`)
- `cron edit <id>` (パッチフィールド)
- `cron rm <id>` (エイリアス: `remove`、`delete`)
- `cron enable <id>`
- `cron disable <id>`
- `cron runs --id <id> [--limit <n>]`
- `cron run <id> [--force]`

すべての `cron` コマンドは、`--url`、`--token`、`--timeout`、`--expect-final` を受け入れます。

## ノードホスト

`node` は **ヘッドレス ノード ホスト**を実行するか、バックグラウンド サービスとして管理します。参照
[`openclaw node`](/cli/node)。

サブコマンド:

- `node run --host <gateway-host> --port 18789`
- `node status`
- `node install [--host <gateway-host>] [--port <port>] [--tls] [--tls-fingerprint <sha256>] [--node-id <id>] [--display-name <name>] [--runtime <node|bun>] [--force]`
- `node uninstall`
- `node stop`
- `node restart`

認証に関するメモ:

- `node` は、env/config からのゲートウェイ認証を解決します (`--token`/`--password` フラグはありません): `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`、次に `gateway.auth.*`、経由のリモート モード サポートあり`gateway.remote.*`。
- レガシー `CLAWDBOT_GATEWAY_*` 環境変数は、ノードとホスト間の認証解決では意図的に無視されます。

## ノード

`nodes` はゲートウェイと通信し、ペアになったノードをターゲットにします。 [/nodes](/nodes) を参照してください。

一般的なオプション:

- `--url`、`--token`、`--timeout`、`--json`

サブコマンド:- `nodes status [--connected] [--last-connected <duration>]`

- `nodes describe --node <id|name|ip>`
- `nodes list [--connected] [--last-connected <duration>]`
- `nodes pending`
- `nodes approve <requestId>`
- `nodes reject <requestId>`
- `nodes rename --node <id|name|ip> --name <displayName>`
- `nodes invoke --node <id|name|ip> --command <command> [--params <json>] [--invoke-timeout <ms>] [--idempotency-key <key>]`
- `nodes run --node <id|name|ip> [--cwd <path>] [--env KEY=VAL] [--command-timeout <ms>] [--needs-screen-recording] [--invoke-timeout <ms>] <command...>` (Mac ノードまたはヘッドレス ノード ホスト)
- `nodes notify --node <id|name|ip> [--title <text>] [--body <text>] [--sound <name>] [--priority <passive|active|timeSensitive>] [--delivery <system|overlay|auto>] [--invoke-timeout <ms>]` (Mac のみ)

カメラ:

- `nodes camera list --node <id|name|ip>`
- `nodes camera snap --node <id|name|ip> [--facing front|back|both] [--device-id <id>] [--max-width <px>] [--quality <0-1>] [--delay-ms <ms>] [--invoke-timeout <ms>]`
- `nodes camera clip --node <id|name|ip> [--facing front|back] [--device-id <id>] [--duration <ms|10s|1m>] [--no-audio] [--invoke-timeout <ms>]`

キャンバス + スクリーン:

- `nodes canvas snapshot --node <id|name|ip> [--format png|jpg|jpeg] [--max-width <px>] [--quality <0-1>] [--invoke-timeout <ms>]`
- `nodes canvas present --node <id|name|ip> [--target <urlOrPath>] [--x <px>] [--y <px>] [--width <px>] [--height <px>] [--invoke-timeout <ms>]`
- `nodes canvas hide --node <id|name|ip> [--invoke-timeout <ms>]`
- `nodes canvas navigate <url> --node <id|name|ip> [--invoke-timeout <ms>]`
- `nodes canvas eval [<js>] --node <id|name|ip> [--js <code>] [--invoke-timeout <ms>]`
- `nodes canvas a2ui push --node <id|name|ip> (--jsonl <path> | --text <text>) [--invoke-timeout <ms>]`
- `nodes canvas a2ui reset --node <id|name|ip> [--invoke-timeout <ms>]`
- `nodes screen record --node <id|name|ip> [--screen <index>] [--duration <ms|10s>] [--fps <n>] [--no-audio] [--out <path>] [--invoke-timeout <ms>]`

場所:

- `nodes location get --node <id|name|ip> [--max-age <ms>] [--accuracy <coarse|balanced|precise>] [--location-timeout <ms>] [--invoke-timeout <ms>]`

## ブラウザ

ブラウザ制御 CLI (専用 Chrome/Brave/Edge/Chromium)。 [`openclaw browser`](/cli/browser) および [ブラウザ ツール](/tools/browser) を参照してください。

一般的なオプション:

- `--url`、`--token`、`--timeout`、`--json`
- `--browser-profile <name>`

管理:

- `browser status`
- `browser start`
- `browser stop`
- `browser reset-profile`
- `browser tabs`
- `browser open <url>`
- `browser focus <targetId>`
- `browser close [targetId]`
- `browser profiles`
- `browser create-profile --name <name> [--color <hex>] [--cdp-url <url>]`
- `browser delete-profile --name <name>`

検査:

- `browser screenshot [targetId] [--full-page] [--ref <ref>] [--element <selector>] [--type png|jpeg]`
- `browser snapshot [--format aria|ai] [--target-id <id>] [--limit <n>] [--interactive] [--compact] [--depth <n>] [--selector <sel>] [--out <path>]`

アクション:

- `browser navigate <url> [--target-id <id>]`
- `browser resize <width> <height> [--target-id <id>]`
- `browser click <ref> [--double] [--button <left|right|middle>] [--modifiers <csv>] [--target-id <id>]`
- `browser type <ref> <text> [--submit] [--slowly] [--target-id <id>]`
- `browser press <key> [--target-id <id>]`
- `browser hover <ref> [--target-id <id>]`
- `browser drag <startRef> <endRef> [--target-id <id>]`
- `browser select <ref> <values...> [--target-id <id>]`
- `browser upload <paths...> [--ref <ref>] [--input-ref <ref>] [--element <selector>] [--target-id <id>] [--timeout-ms <ms>]`
- `browser fill [--fields <json>] [--fields-file <path>] [--target-id <id>]`
- `browser dialog --accept|--dismiss [--prompt <text>] [--target-id <id>] [--timeout-ms <ms>]`
- `browser wait [--time <ms>] [--text <value>] [--text-gone <value>] [--target-id <id>]`
- `browser evaluate --fn <code> [--ref <ref>] [--target-id <id>]`
- `browser console [--level <error|warn|info>] [--target-id <id>]`
- `browser pdf [--target-id <id>]`

## ドキュメントの検索

### `docs [query...]`

ライブ ドキュメント インデックスを検索します。## トゥイ

### `tui`

ゲートウェイに接続されているターミナル UI を開きます。

オプション:

- `--url <url>`
- `--token <token>`
- `--password <password>`
- `--session <key>`
- `--deliver`
- `--thinking <level>`
- `--message <text>`
- `--timeout-ms <ms>` (デフォルトは `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`
