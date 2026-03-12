---
summary: "doctor コマンド: ヘルスチェック、構成の移行、および修復手順"
description: "構成移行、レガシー状態の整理、認証やサンドボックスの健全性確認、再起動前後の修復フローをまとめた doctor コマンド解説です。"
read_when:
  - doctor による移行処理（migration）を追加・変更する場合
  - 構成設定に破壊的な変更を導入する場合
title: "OpenClaw向け openclaw doctor の修復手順と健全性診断ガイド"
x-i18n:
  source_hash: "814e0719a170ef7c9fc43358e1fda1f3646f3f8dfa3214654354aab60c0fde2c"
---
`openclaw doctor` は、OpenClaw の修復および移行（マイグレーション）用ツールです。古くなった構成設定や状態を修正し、ヘルスチェックを実行して、具体的な修復手順を提示します。

## クイックスタート

```bash
openclaw doctor
```

### ヘッドレス / 自動化環境

```bash
openclaw doctor --yes
```

確認プロンプトを表示せず、デフォルト設定で修復を適用します（再起動、サービス、サンドボックスの修復ステップを含みます）。

```bash
openclaw doctor --repair
```

確認なしで推奨される修復を適用します（安全な範囲での修復と再起動）。

```bash
openclaw doctor --repair --force
```

より強力な修復を適用します（カスタムのスーパーバイザー構成などを強制的に上書きします）。

```bash
openclaw doctor --non-interactive
```

プロンプトを表示せず、安全な移行（構成の正規化、ディスク上の状態移動など）のみを適用します。人間による確認が必要な再起動、サービス、サンドボックス操作はスキップされます。
レガシーな状態の移行は、検出されれば自動的に実行されます。

```bash
openclaw doctor --deep
```

システムサービス（launchd/systemd/schtasks）をスキャンして、重複したゲートウェイのインストールがないか確認します。

変更を書き込む前に内容を確認したい場合は、まず設定ファイルを開いてください:

```bash
cat ~/.openclaw/openclaw.json
```

## 主な機能 (サマリー)

- Git インストール環境における、実行前のオプションアップデート（対話モードのみ）。
- UI プロトコルの鮮度チェック（プロトコルスキーマが新しい場合にコントロール UI を再構築）。
- ヘルスチェックと再起動の提案。
- スキルの準備状況サマリー（利用可能/不足/ブロック）。
- レガシーな構成値の正規化。
- OpenCode Zen プロバイダーの上書きに関する警告 (`models.providers.opencode`)。
- ディスク上のレガシーな状態（セッション、エージェントディレクトリ、WhatsApp 認証情報）の移行。
- レガシーな Cron ストアの移行（`jobId`, `schedule.cron`, 各種ペイロード/配信フィールド, `notify: true` 形式の Webhook ジョブなど）。
- 状態の整合性と権限のチェック（セッション、履歴、状態ディレクトリ）。
- ローカル実行時の構成ファイルの権限チェック (chmod 600)。
- モデル認証の健全性チェック: OAuth の期限確認、期限間近なトークンの更新、クールダウンや無効化状態の報告。
- 重複したワークスペースディレクトリの検出 (`~/openclaw`)。
- サンドボックス有効時の Docker イメージの修復。
- レガシーなサービスの移行と、余分なゲートウェイの検出。
- ゲートウェイの実行状況チェック（サービスはインストールされているが起動していない、古い launchd ラベルが残っている、など）。
- 各チャネルのステータス警告（稼働中のゲートウェイから情報を取得）。
- スーパーバイザー設定（launchd/systemd/schtasks）の監査と、オプションの修復。
- ゲートウェイの実行環境に関するベストプラクティスチェック（Node vs Bun、バージョンマネージャーのパスなど）。
- ゲートウェイポート（デフォルト 18789）の衝突診断。
- 安全でない DM ポリシーに対するセキュリティ警告。
- ローカルトークンモードにおける認証チェック（トークンソースがない場合に生成を提案。SecretRef 設定は上書きしません）。
- Linux における systemd linger チェック。
- ソースインストール環境のチェック（pnpm ワークスペースの不一致、UI アセットや tsx バイナリの欠落など）。
- 更新後の構成ファイルとウィザード用メタデータの書き込み。

## 詳細な挙動と設計意図

### 0) オプションのアップデート (Git インストール時)

Git チェックアウトによるインストールで、かつ対話モードで実行されている場合、doctor の実行前に最新状態へのアップデート（fetch/rebase/build）を提案します。

### 1) 構成の正規化

構成ファイルに古い形式の値（例: チャネル個別の上書きがない `messages.ackReaction` など）が含まれている場合、最新のスキーマに合わせて正規化します。

### 2) レガシーな構成キーの移行

構成ファイルに非推奨（deprecated）のキーが含まれている場合、他のコマンドの実行を拒否し、`openclaw doctor` の実行を促します。

Doctor は以下の処理を行います:
- どのレガシーキーが見つかったかを説明。
- 適用した移行内容を表示。
- `~/.openclaw/openclaw.json` を最新のスキーマで書き換え。

また、ゲートウェイは起動時に古い形式の構成を検知すると、自動的に doctor 相当の移行処理を実行します。そのため、手動で doctor を実行しなくても構成は最新の状態に保たれます。

現在の主な移行項目:
- `routing.allowFrom` → `channels.whatsapp.allowFrom`
- `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
- `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
- `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
- `routing.queue` → `messages.queue`
- `routing.bindings` → トップレベルの `bindings`
- `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
- `routing.agentToAgent` → `tools.agentToAgent`
- `routing.transcribeAudio` → `tools.media.audio.models`
- `bindings[].match.accountID` → `bindings[].match.accountId`
- 名前付きの `accounts` があるが `accounts.default` が欠落している場合、トップレベルの単一アカウント設定を `channels.<channel>.accounts.default` へ移動。
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`

マルチアカウントチャネルにおけるアカウント既定値（default）に関する警告も含まれます:
- 2 つ以上のアカウントが構成されており、かつ `defaultAccount` や `accounts.default` が未設定の場合、意図しないアカウントがルーティングで使用される可能性があるため警告を表示します。
- `defaultAccount` が存在しないアカウント ID を指している場合に警告を表示します。

### 2b) OpenCode Zen プロバイダーの上書き

`models.providers.opencode` (または `opencode-zen`) を手動で追加している場合、`@mariozechner/pi-ai` が提供する組み込みカタログが上書きされます。これにより、すべてのモデルが単一の API に固定されたり、利用コストが正しく計算されなくなったりすることがあります。Doctor はこの上書き設定を削除し、モデルごとの適切なルーティングとコスト計算を復元するよう促します。

### 3) ディスク上のレガシー状態の移行

Doctor は、ディスク上の古いディレクトリ構造を最新の構造へ移行できます:

- セッションストアと履歴（トランスクリプト）:
  - `~/.openclaw/sessions/` → `~/.openclaw/agents/<agentId>/sessions/`
- エージェントディレクトリ:
  - `~/.openclaw/agent/` → `~/.openclaw/agents/<agentId>/agent/`
- WhatsApp 認証状態 (Baileys):
  - レガシーな `~/.openclaw/credentials/*.json` (`oauth.json` を除く)
  - → `~/.openclaw/credentials/whatsapp/<accountId>/...` (デフォルト ID は `default`)

これらの移行はベストエフォートかつべき等（何度行っても同じ結果になる）です。移行済みのフォルダがバックアップとして残された場合には警告を表示します。ゲートウェイ/CLI は起動時にセッションとエージェントディレクトリを自動移行するため、手動で doctor を実行しなくても履歴や認証情報はエージェントごとのパスへ移動します。WhatsApp の認証情報は、安全のため `openclaw doctor` 経由でのみ移行されます。

### 3b) レガシーな Cron ストアの移行

Cron ジョブの保存ファイル（デフォルト `~/.openclaw/cron/jobs.json`）をスキャンし、古い形式のジョブを最新形式へ移行します。

現在の主なクリーンアップ項目:
- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- トップレベルのペイロードフィールド（`message`, `model`, `thinking` など） → `payload` 配下へ
- トップレベルの配信フィールド（`deliver`, `channel`, `to`, `provider` など） → `delivery` 配下へ
- ペイロード内の `provider` 配信別名 → 明示的な `delivery.channel` へ
- レガシーな `notify: true` 形式のジョブ → 明示的な `delivery.mode="webhook"` (かつ `delivery.to=cron.webhook`) へ

`notify: true` の移行は、挙動が変わらない場合にのみ自動で行われます。既存の非 Webhook 配信モードと混在している場合は、警告を表示して手動での確認を求めます。

### 4) 状態の整合性チェック (永続化、ルーティング、安全性)

状態（state）ディレクトリはシステムの要です。ここが失われると、セッション、認証情報、ログ、構成のすべてが失われます（別途バックアップがない限り）。

Doctor による主なチェック項目:
- **ディレクトリの欠落**: 致命的なデータ損失について警告し、再作成を促します（失われたデータは復元できません）。
- **書き込み権限**: 書き込み可能であることを確認し、必要に応じて権限の修復を提案します。所有者やグループの不一致があれば `chown` のヒントを表示します。
- **macOS のクラウド同期ディレクトリ**: 状態ディレクトリが iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) や `~/Library/CloudStorage/...` 配下にある場合に警告します。同期処理によって I/O が遅延したり、ロックの競合が発生したりするリスクを避けるためです。
- **Linux の SD/eMMC カード**: 状態ディレクトリが `mmcblk*` マウントポイントにある場合に警告します。SD や eMMC カードはランダム I/O が遅く、書き換え回数の多いセッションや認証情報の保存には不向きなためです。
- **セッション用ディレクトリの欠落**: 履歴の保存に不可欠な `sessions/` フォルダなどをチェックし、`ENOENT` エラーによるクラッシュを防ぎます。
- **履歴（トランスクリプト）の不一致**: セッション記録はあるが、対応する履歴ファイルが見つからない場合に警告します。
- **メインセッションの「1行 JSONL」**: メインの履歴ファイルが 1 行しかない（履歴が蓄積されていない）場合にフラグを立てます。
- **複数の状態ディレクトリ**: ホームディレクトリ内に複数の `~/.openclaw` フォルダがあったり、`OPENCLAW_STATE_DIR` が別の場所を指していたりする場合に警告します（履歴が分散する原因となります）。
- **リモートモード時の注意**: `gateway.mode=remote` の場合、状態データはリモートホスト側にあるため、そのホスト上で doctor を実行するよう促します。
- **構成ファイルの権限**: `~/.openclaw/openclaw.json` が他のユーザーから読み取り可能な場合に警告し、`600` (自分のみ) への厳格化を提案します。

### 5) モデル認証の健全性 (OAuth の有効期限)

認証ストア内の OAuth プロファイルを検査し、期限切れや間近なトークンがあれば警告し、可能であれば更新（リフレッシュ）を試みます。Anthropic の Claude Code プロファイルが古い場合は、`claude setup-token` の実行（または貼り付け）を提案します。更新プロンプトは対話モード（TTY）でのみ表示され、`--non-interactive` 時はスキップされます。

また、以下の理由で一時的に利用不可となっているプロファイルも報告します:
- 短時間のクールダウン（レート制限、タイムアウト、認証失敗など）
- 長時間の無効化（支払い情報の問題、クレジット不足など）

### 6) フック用モデルの検証

`hooks.gmail.model` が設定されている場合、そのモデルがカタログに含まれているか、および許可リストに含まれているかを検証し、解決できない場合に警告します。

### 7) サンドボックスイメージの修復

サンドボックスが有効な場合、必要な Docker イメージが存在するか確認し、不足していればビルドやレガシー名称への切り替えを提案します。

### 8) ゲートウェイサービスの移行と整理

レガシーなゲートウェイサービス（launchd/systemd/schtasks）を検出し、それらを削除して、現在のポート設定で新しい OpenClaw サービスをインストールすることを提案します。また、重複したサービスをスキャンし、整理のためのヒントを表示します。プロファイル名が付与された OpenClaw サービスは正規のものとして扱われ、「重複」とはみなされません。

### 9) セキュリティ警告

特定のプロバイダーにおいて許可リストなしで DM を受け付けている設定や、危険なフラグが有効なポリシー設定に対して警告を表示します。

### 10) systemd linger (Linux)

Linux でユーザーサービスとして実行している場合、ログアウト後もゲートウェイが停止しないよう、lingering 設定が有効であることを確認します。

### 11) スキル（Skills）のステータス

現在のワークスペースにおける、スキルの利用可能・不足・ブロック状況のサマリーを表示します。

### 12) ゲートウェイ認証チェック (ローカルトークン)

ローカルゲートウェイのトークン認証の準備状況を確認します。
- トークンモードでトークンが必要だが、生成済みのものが存在しない場合に生成を提案します。
- `gateway.auth.token` が SecretRef で管理されているものの取得できない場合に警告を表示します（平文で上書きすることはありません）。
- `openclaw doctor --generate-gateway-token` は、SecretRef が構成されていない場合にのみ強制的にトークンを生成します。

### 12b) 読み取り専用の SecretRef 対応修復

実行時の挙動を弱めることなく、構成された認証情報を安全に検査して修復を行います。
- `openclaw doctor --fix` は、`status` 系コマンドと同じ読み取り専用の SecretRef サマリーモデルを使用して構成を修復します。
- 例: Telegram の `allowFrom` や `groupAllowFrom` における `@username` から ID への修復において、利用可能なボット認証情報を安全に使用します。
- ボットトークンが SecretRef で管理されており、現在のパスで解決できない場合、doctor は「設定済みだが未解決」として報告し、クラッシュや「欠落」という誤った報告を避けて自動解決をスキップします。

### 13) ゲートウェイのヘルスチェックと再起動

ヘルスチェックを実行し、ゲートウェイが不健全な状態であれば再起動を提案します。

### 14) チャネルステータスの警告

ゲートウェイが正常であれば、各チャネルのステータスプローブを実行し、警告と修正案を表示します。

### 15) スーパーバイザー構成の監査と修復

インストール済みのサービス構成（launchd/systemd/schtasks）をチェックし、不足している、あるいは古いデフォルト設定（systemd のネットワーク待機設定や再起動遅延など）がないか確認します。不一致があれば更新を推奨し、現在のデフォルト設定で書き換えることができます。

補足事項:
- 書き換えの前に必ず確認プロンプトが表示されます。
- `openclaw doctor --yes` は、修復プロンプトをすべて承認します。
- `openclaw doctor --repair` は、プロンプトなしで推奨される修正を適用します。
- `openclaw doctor --repair --force` は、カスタム設定を強制的に上書きします。
- トークン認証が必要で `gateway.auth.token` が SecretRef 管理下の場合、サービスのインストール/修復において SecretRef の妥当性は検証されますが、解決された平文トークンがサービスの環境メタデータに書き込まれることはありません。
- トークン認証が必要かつ SecretRef が解決できない場合、doctor は具体的な手順を示してインストール/修復をブロックします。
- `gateway.auth.token` と `gateway.auth.password` の両方が構成され、かつ `gateway.auth.mode` が未設定の場合、モードが明示的に設定されるまでインストール/修復はブロックされます。
- Linux のユーザー用 systemd ユニットにおいて、`Environment=` と `EnvironmentFile=` の両方のソースを対象にトークンの不一致をチェックします。
- いつでも `openclaw gateway install --force` で構成の完全な再作成を強制できます。

### 16) ゲートウェイの実行状況とポート診断

サービスの実行状況（PID、最終終了ステータス）を確認し、インストールされているが実際には動いていない場合に警告します。また、ポート（デフォルト 18789）の衝突を検知し、可能性のある原因（既起動プロセス、SSH トンネルなど）を報告します。

### 17) ゲートウェイの実行環境に関するベストプラクティス

ゲートウェイサービスが Bun や、バージョン管理ツール (`nvm`, `fnm`, `volta`, `asdf` など) のパス配下の Node で実行されている場合に警告を表示します。WhatsApp や Telegram チャネルは Node を必要とし、バージョン管理ツールのパスは（サービスがシェルの初期化ファイルを読み込まないため）アップデート時に壊れる可能性があります。可能な場合は、システムの Node インストール (Homebrew/apt/choco) への移行を提案します。

### 18) 構成の書き込みとウィザード用メタデータ

 doctor の実行によって発生した構成の変更を保存し、実行記録としてウィザード用メタデータを付記します。

### 19) ワークスペースに関するヒント (バックアップと記憶システム)

ワークスペースに記憶システムが設定されていない場合に導入を提案し、また Git 管理されていない場合にバックアップに関するアドバイスを表示します。

ワークスペースの構造や Git によるバックアップ（プライベートな GitHub や GitLab を推奨）については、[エージェントワークスペース](/concepts/agent-workspace) を参照してください。
