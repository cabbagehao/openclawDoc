---
summary: "CLI オンボーディング ウィザードの完全なリファレンス: すべてのステップ、フラグ、および設定フィールド"
read_when:
  - 特定のウィザードのステップまたはフラグを検索する
  - 非対話型モードによるオンボーディングの自動化
  - デバッグウィザードの動作
title: "OpenClawオンボーディングウィザードの設定項目リファレンス"
description: "これは、openclaw onboard CLI ウィザードの完全なリファレンスです。高レベルの概要については、オンボーディング ウィザード を参照してください。"
sidebarTitle: "Wizard Reference"
x-i18n:
  source_hash: "5b263d1ac76097b11894d62b521ac654c1204f7ecf4f9fe8a6be627ab7f9e06c"
---
これは、`openclaw onboard` CLI ウィザードの完全なリファレンスです。
高レベルの概要については、[オンボーディング ウィザード](/start/wizard) を参照してください。

## フローの詳細（ローカルモード）

<Steps>

  <Step title="既存の構成の検出">
    - `~/.openclaw/openclaw.json` が存在する場合は、**Keep / Modify / Reset** を選択します。
    - 明示的に **リセット** を選択しない限り、ウィザードを再実行しても何も消去されません**
      (または `--reset` を渡します)。
    - CLI `--reset` のデフォルトは `config+creds+sessions` です。 `--reset-scope full` を使用してください
      ワークスペースも削除します。
    - 構成が無効であるか、レガシーキーが含まれている場合、ウィザードは停止し、次のメッセージが表示されます。
      続行する前に `openclaw doctor` を実行してください。
    - リセットは `trash` (`rm` は使用しません) を使用し、次のスコープを提供します。
      - 設定のみ
      - 構成 + 認証情報 + セッション
      - フルリセット（ワークスペースも削除）
  </Step>
  <Step title="Model/Auth">
    - **Anthropic API キー**: `ANTHROPIC_API_KEY` (存在する場合) を使用するか、キーの入力を求め、デーモンで使用するために保存します。
    - **Anthropic OAuth (Claude Code CLI)**: macOS では、ウィザードはキーチェーン項目「Claude Code-credentials」をチェックします (launchd の開始がブロックされないように「常に許可」を選択します)。 Linux/Windows では、`~/.claude/.credentials.json` が存在する場合はそれを再利用します。
    - **Anthropic トークン (セットアップ トークンの貼り付け)**: 任意のマシンで `claude setup-token` を実行し、トークンを貼り付けます (名前を付けることができます。空白 = デフォルト)。
    - **OpenAI コード (Codex) サブスクリプション (Codex CLI)**: `~/.codex/auth.json` が存在する場合、ウィザードはそれを再利用できます。
    - **OpenAI Code (Codex) サブスクリプション (OAuth)**: ブラウザー フロー。 `code#state` を貼り付けます。- モデルが設定されていない場合、`agents.defaults.model` を `openai-codex/gpt-5.2` に設定するか、`openai/*` に設定します。
    - **OpenAI API キー**: `OPENAI_API_KEY` (存在する場合) を使用するか、キーの入力を求め、それを認証プロファイルに保存します。
    - **xAI (Grok) API キー**: `XAI_API_KEY` を要求し、xAI をモデル プロバイダーとして構成します。
    - **OpenCode Zen (マルチモデル プロキシ)**: `OPENCODE_API_KEY` (または `OPENCODE_ZEN_API_KEY`、https://opencode.ai/auth で入手) のプロンプトが表示されます。
    - **API キー**: キーを保存します。
    - **Vercel AI Gateway (マルチモデル プロキシ)**: `AI_GATEWAY_API_KEY` のプロンプトが表示されます。
    - 詳細: [Vercel AI ゲートウェイ](/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: アカウント ID、ゲートウェイ ID、`CLOUDFLARE_AI_GATEWAY_API_KEY` の入力を求められます。
    - 詳細: [Cloudflare AI ゲートウェイ](/providers/cloudflare-ai-gateway)
    - **MiniMax M2.5**: 構成は自動で書き込まれます。
    - 詳細: [MiniMax](/providers/minimax)
    - **合成 (Anthropic 互換)**: `SYNTHETIC_API_KEY` のプロンプトが表示されます。
    - 詳細: [合成](/providers/synthetic)
    - **ムーンショット (キミ K2)**: 設定は自動で書き込まれます。
    - **キミコーディング**: 設定は自動で書き込まれます。
    - 詳細: [ムーンショット AI (キミ + キミ コーディング)](/providers/moonshot)
    - **スキップ**: 認証がまだ設定されていません。- 検出されたオプションからデフォルトのモデルを選択します (またはプロバイダー/モデルを手動で入力します)。最高の品質とプロンプト インジェクション リスクの低減を実現するには、プロバイダー スタックで利用可能な最も強力な最新世代モデルを選択してください。
    - ウィザードはモデル チェックを実行し、構成されたモデルが不明であるか認証が欠落している場合に警告します。
    - API キーのストレージ モードのデフォルトは、プレーンテキストの認証プロファイル値です。代わりに `--secret-input-mode ref` を使用して、env-backed refs を保存します (例: `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)。
    - OAuth 資格情報は `~/.openclaw/credentials/oauth.json` にあります。認証プロファイルは `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (API キー + OAuth) にあります。
    - 詳細: [/concepts/oauth](/concepts/oauth)
    <Note>
    ヘッドレス/サーバーのヒント: ブラウザーを備えたマシンで OAuth を完了し、コピーします。
    `~/.openclaw/credentials/oauth.json` (または `$OPENCLAW_STATE_DIR/credentials/oauth.json`) を
    ゲートウェイホスト。
    </Note>
  </Step>
  <Step title="ワークスペース">
    - デフォルト `~/.openclaw/workspace` (構成可能)。
    - エージェントのブートストラップ儀式に必要なワークスペース ファイルをシードします。
    - 完全なワークスペース レイアウト + バックアップ ガイド: [エージェント ワークスペース](/concepts/agent-workspace)
  </Step>
  <Step title="ゲートウェイ">
    - ポート、バインド、認証モード、テールスケール公開。
    - 認証の推奨事項: ローカル WS クライアントが認証する必要があるため、ループバックの場合でも **トークン** を保持します。
    - トークン モードでは、インタラクティブなオンボーディングにより次のことが提供されます。
      - **平文トークンを生成/保存** (デフォルト)
      - **SecretRef を使用** (オプトイン)- クイックスタートは、オンボード プローブ/ダッシュボード ブートストラップのために、`env`、`file`、および `exec` プロバイダー全体で既存の `gateway.auth.token` SecretRef を再利用します。
      - SecretRef が構成されているが解決できない場合、ランタイム認証を静かに低下させるのではなく、明確な修正メッセージが表示されてオンボードが早期に失敗します。
    - パスワード モードでは、インタラクティブ オンボーディングはプレーンテキストまたは SecretRef ストレージもサポートします。
    - 非対話型トークン SecretRef パス: `--gateway-token-ref-env <ENV_VAR>`。
      - オンボーディング プロセス環境には空ではない環境変数が必要です。
      ・`--gateway-token`との併用はできません。
    - すべてのローカル プロセスを完全に信頼する場合にのみ、認証を無効にします。
    - 非ループバック バインドでも認証が必要です。
  </Step>
  <Step title="チャンネル">
    - [WhatsApp](/channels/whatsapp): オプションの QR ログイン。
    - [テレグラム](/channels/telegram): ボットトークン。
    - [Discord](/channels/discord): ボットトークン。
    - [Google Chat](/channels/googlechat): サービス アカウント JSON + Webhook オーディエンス。
    - [Mattermost](/channels/mattermost) (プラグイン): ボット トークン + ベース URL。
    - [シグナル](/channels/signal): オプションの `signal-cli` インストール + アカウント構成。
    - [BlueBubbles](/channels/bluebubbles): **iMessage に推奨**;サーバー URL + パスワード + Webhook。
    - [iMessage](/channels/imessage): 従来の `imsg` CLI パス + DB アクセス。- DM セキュリティ: デフォルトはペアリングです。最初の DM はコードを送信します。 `openclaw pairing approve <channel> <code>` 経由で承認するか、許可リストを使用します。
  </Step>
  <Step title="ウェブ検索">
    - プロバイダーを選択します: Perplexity、Brave、Gemini、Grok、または Kim (またはスキップ)。
    - API キーを貼り付けます (QuickStart は環境変数または既存の構成からキーを自動検出します)。
    - `--skip-search` でスキップします。
    - 後で構成します: `openclaw configure --section web`。
  </Step>
  <Step title="デーモンのインストール">
    - macOS: LaunchAgent
      - ログインしたユーザーセッションが必要です。ヘッドレスの場合は、カスタム LaunchDaemon (同梱されていません) を使用します。
    - Linux (および WSL2 経由の Windows): systemd ユーザー ユニット
      - ウィザードは、ログアウト後もゲートウェイが起動したままになるように、`loginctl enable-linger <user>` を介して残留を有効にしようとします。
      - sudo を要求する場合があります (`/var/lib/systemd/linger` を書き込みます)。最初は sudo なしで試行します。
    - **実行時の選択:** ノード (推奨、WhatsApp/Telegram には必須)。パンは**お勧めしません**。
    - トークン認証にトークンが必要で、`gateway.auth.token` が SecretRef で管理されている場合、デーモン インストールはそれを検証しますが、解決されたプレーンテキスト トークン値をスーパーバイザ サービス環境メタデータに保持しません。
    - トークン認証にトークンが必要で、構成されたトークン SecretRef が未解決の場合、実用的なガイダンスによってデーモンのインストールがブロックされます。
    - `gateway.auth.token` と `gateway.auth.password` の両方が構成され、`gateway.auth.mode` が設定されていない場合、モードが明示的に設定されるまでデーモンのインストールはブロックされます。
  </Step>
  <Step title="健康診断">
    - ゲートウェイを開始し (必要な場合)、`openclaw health` を実行します。
    - ヒント: `openclaw status --deep` は、ゲートウェイ正常性プローブをステータス出力に追加します (到達可能なゲートウェイが必要です)。
  </Step>
  <Step title="スキル（推奨）">
    - 利用可能なスキルを読み取り、要件を確認します。
    - ノード マネージャーを選択できます: **npm / pnpm** (bun は推奨されません)。
    - オプションの依存関係をインストールします (一部は macOS で Homebrew を使用します)。
  </Step>
  <Step title="仕上げる">
    - 追加機能用の iOS/Android/macOS アプリを含む概要と次のステップ。
  </Step>
</Steps>

<Note>
GUI が検出されない場合、ウィザードはブラウザを開く代わりに、コントロール UI の SSH ポート転送命令を出力します。
コントロール UI アセットが見つからない場合、ウィザードはそれらを構築しようとします。フォールバックは `pnpm ui:build` (UI deps を自動インストールします)。
</Note>

## 非対話型モード

`--non-interactive` を使用して、オンボーディングを自動化またはスクリプト化します。

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-skills
```

機械可読な概要として `--json` を追加します。

非対話モードのゲートウェイ トークン SecretRef:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN
```

`--gateway-token` と `--gateway-token-ref-env` は相互に排他的です。

<Note>
`--json` は、非対話型モードを意味するものではありません**。スクリプトには `--non-interactive` (および `--workspace`) を使用します。
</Note><AccordionGroup>
  <Accordion title="ジェミニの例">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice gemini-api-key \
      --gemini-api-key "$GEMINI_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Z.AIの例">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice zai-api-key \
      --zai-api-key "$ZAI_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Vercel AI ゲートウェイの例">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice ai-gateway-api-key \
      --ai-gateway-api-key "$AI_GATEWAY_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Cloudflare AIゲートウェイの例">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice cloudflare-ai-gateway-api-key \
      --cloudflare-ai-gateway-account-id "your-account-id" \
      --cloudflare-ai-gateway-gateway-id "your-gateway-id" \
      --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="ムーンショットの例">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice moonshot-api-key \
      --moonshot-api-key "$MOONSHOT_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="合成例">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice synthetic-api-key \
      --synthetic-api-key "$SYNTHETIC_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="OpenCode Zen の例">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice opencode-zen \
      --opencode-zen-api-key "$OPENCODE_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
</AccordionGroup>

### エージェントの追加 (非対話型)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.2 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## ゲートウェイ ウィザード RPC

ゲートウェイは、RPC 経由でウィザード フローを公開します (`wizard.start`、`wizard.next`、`wizard.cancel`、`wizard.status`)。
クライアント (macOS アプリ、コントロール UI) は、オンボーディング ロジックを再実装せずにステップをレンダリングできます。

## シグナルのセットアップ (signal-cli)

ウィザードは、GitHub リリースから `signal-cli` をインストールできます。

- 適切なリリース資産をダウンロードします。
- `~/.openclaw/tools/signal-cli/<version>/` の下に保存されます。
- `channels.signal.cliPath` を構成に書き込みます。

注:

- JVM ビルドには **Java 21** が必要です。
- ネイティブ ビルドが利用可能な場合は使用されます。
- Windows は WSL2 を使用します。 signal-cli のインストールは、WSL 内の Linux フローに従います。

## ウィザードが書き込む内容

`~/.openclaw/openclaw.json` の一般的なフィールド:- `agents.defaults.workspace`

- `agents.defaults.model` / `models.providers` (ミニマックスを選択した場合)
- `tools.profile` (未設定の場合、ローカル オンボーディングはデフォルトで `"coding"` になります。既存の明示的な値は保持されます)
- `gateway.*` (モード、バインド、認証、テールスケール)
- `session.dmScope` (動作の詳細: [CLI オンボーディング リファレンス](/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`、`channels.discord.token`、`channels.signal.*`、`channels.imessage.*`
- プロンプト中にオプトインするときのチャネル許可リスト (Slack/Discord/Matrix/Microsoft Teams) (可能な場合、名前は ID に解決されます)。
- `skills.install.nodeManager`
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` は `agents.list[]` とオプションの `bindings` を書き込みます。

WhatsApp 認証情報は `~/.openclaw/credentials/whatsapp/<accountId>/` の下にあります。
セッションは `~/.openclaw/agents/<agentId>/sessions/` に保存されます。

一部のチャンネルはプラグインとして提供されます。オンボーディング中にいずれかを選択すると、ウィザードが
構成する前に、インストール (npm またはローカル パス) を求めるプロンプトが表示されます。

## 関連ドキュメント- ウィザードの概要: [オンボーディング ウィザード](/start/wizard)

- macOS アプリのオンボーディング: [オンボーディング](/start/onboarding)
- 構成リファレンス: [ゲートウェイ構成](/gateway/configuration)
- プロバイダー: [WhatsApp](/channels/whatsapp)、[Telegram](/channels/telegram)、[Discord](/channels/discord)、[Google Chat](/channels/googlechat)、[Signal](/channels/signal)、 [BlueBubbles](/channels/bluebubbles) (iMessage)、[iMessage](/channels/imessage) (レガシー)
- スキル: [スキル](/tools/skills)、[スキル構成](/tools/skills-config)
