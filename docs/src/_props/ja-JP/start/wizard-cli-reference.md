---
summary: "CLI オンボーディングフロー、認証/モデルのセットアップ、出力、および内部構造に関する完全なリファレンス"
read_when:
  - openclaw onboard の詳細な動作が必要な場合
  - オンボーディング結果のデバッグやオンボーディングクライアントの統合を行う場合
title: "CLI オンボーディングリファレンス"
sidebarTitle: "CLI リファレンス"
---

# CLI オンボーディングリファレンス (CLI Onboarding Reference)

このページは `openclaw onboard` の完全なリファレンスです。
簡単なガイドについては、[オンボーディングウィザード (CLI)](/start/wizard) を参照してください。

## ウィザードが行うこと

ローカルモード（デフォルト）では、以下の手順を案内します：

* モデルと認証のセットアップ（OpenAI Code サブスクリプション OAuth、Anthropic API キーまたはセットアップトークン、さらに MiniMax、GLM、Moonshot、および AI Gateway のオプション）
* ワークスペースの場所とブートストラップファイル
* Gateway 設定（ポート、バインド、認証、Tailscale）
* チャンネルとプロバイダー（Telegram、WhatsApp、Discord、Google Chat、Mattermost プラグイン、Signal）
* デーモンのインストール（LaunchAgent または systemd ユーザーユニット）
* ヘルスチェック
* Skills（スキル）のセットアップ

リモートモードは、他の場所にある Gateway に接続するようにこのマシンを構成します。
リモートホストに何かをインストールしたり変更したりすることはありません。

## ローカルフローの詳細

<Steps>
  <Step title="既存の設定の検出">
    * `~/.openclaw/openclaw.json` が存在する場合、Keep（保持）、Modify（変更）、または Reset（リセット）を選択します。
    * 明示的に Reset を選択する（または `--reset` を渡す）場合を除き、ウィザードを再実行しても何も消去されません。
    * CLI の `--reset` はデフォルトで `config+creds+sessions` になります。ワークスペースも削除するには `--reset-scope full` を使用します。
    * 設定が無効であるか、古い（レガシーな）キーが含まれている場合、ウィザードは停止し、続行する前に `openclaw doctor` を実行するように求めます。
    * Reset は `trash` を使用し、以下のスコープを提供します：
      * Config only (設定のみ)
      * Config + credentials + sessions (設定 + 資格情報 + セッション)
      * Full reset (完全なリセット。ワークスペースも削除します)
  </Step>

  <Step title="モデルと認証">
    * 完全なオプションマトリックスは [認証とモデルのオプション](#auth-and-model-options) にあります。
  </Step>

  <Step title="ワークスペース">
    * デフォルトは `~/.openclaw/workspace` です（設定可能）。
    * 初回実行のブートストラップ儀式に必要なワークスペースファイルをシードします。
    * ワークスペースのレイアウト：[エージェントワークスペース](/concepts/agent-workspace)。
  </Step>

  <Step title="Gateway">
    * ポート、バインド、認証モード、Tailscale への公開についてのプロンプトを表示します。
    * 推奨：ループバックであってもトークン認証を有効にしたままにし、ローカルの WS クライアントが認証する必要があるようにします。
    * トークンモードでは、対話型オンボーディングは以下を提供します：
      * **平文トークンの生成/保存** (デフォルト)
      * **SecretRef の使用** (オプトイン)
    * パスワードモードでは、対話型オンボーディングは平文または SecretRef の保存もサポートします。
    * 非対話型のトークン SecretRef パス：`--gateway-token-ref-env <ENV_VAR>`。
      * オンボーディングプロセス環境で、空ではない環境変数が必要です。
      * `--gateway-token` と組み合わせることはできません。
    * すべてのローカルプロセスを完全に信頼している場合にのみ、認証を無効にしてください。
    * 非ループバックバインドには依然として認証が必要です。
  </Step>

  <Step title="チャンネル">
    * [WhatsApp](/channels/whatsapp): オプションの QR ログイン
    * [Telegram](/channels/telegram): ボットトークン
    * [Discord](/channels/discord): ボットトークン
    * [Google Chat](/channels/googlechat): サービスアカウント JSON + Webhook オーディエンス
    * [Mattermost](/channels/mattermost) プラグイン: ボットトークン + ベース URL
    * [Signal](/channels/signal): オプションの `signal-cli` インストール + アカウント構成
    * [BlueBubbles](/channels/bluebubbles): iMessage に推奨。サーバー URL + パスワード + Webhook
    * [iMessage](/channels/imessage): レガシーな `imsg` CLI パス + DB アクセス
    * DM セキュリティ: デフォルトはペアリング（pairing）です。最初の DM はコードを送信します。
      `openclaw pairing approve <channel> <code>` で承認するか、許可リストを使用します。
  </Step>

  <Step title="デーモンのインストール">
    * macOS: LaunchAgent
      * ログインしたユーザーセッションが必要です。ヘッドレスの場合は、カスタムの LaunchDaemon を使用してください（同梱されていません）。
    * Linux および Windows (WSL2 経由): systemd ユーザーユニット
      * ログアウト後も Gateway が稼働し続けるように、ウィザードは `loginctl enable-linger <user>` を試みます。
      * sudo のプロンプトが表示される場合があります（`/var/lib/systemd/linger` に書き込みます）。最初は sudo なしで試行します。
    * ランタイムの選択: Node（推奨。WhatsApp および Telegram に必要）。Bun は推奨されません。
  </Step>

  <Step title="ヘルスチェック">
    * （必要に応じて）Gateway を起動し、`openclaw health` を実行します。
    * `openclaw status --deep` は、ステータス出力に Gateway のヘルスプローブを追加します。
  </Step>

  <Step title="スキル (Skills)">
    * 利用可能なスキルを読み取り、要件を確認します。
    * ノードマネージャーを選択できます：npm または pnpm（bun は推奨されません）。
    * オプションの依存関係をインストールします（macOS では一部 Homebrew を使用します）。
  </Step>

  <Step title="完了">
    * iOS、Android、および macOS アプリのオプションを含む、概要と次のステップ。
  </Step>
</Steps>

<Note>
  GUI が検出されない場合、ウィザードはブラウザを開く代わりに、Control UI 用の SSH ポートフォワードの指示を出力します。
  Control UI のアセットが見つからない場合、ウィザードはそれらのビルドを試みます。フォールバックは `pnpm ui:build` です（UI の依存関係を自動インストールします）。
</Note>

## リモートモードの詳細

リモートモードは、他の場所にある Gateway に接続するようにこのマシンを構成します。

<Info>
  リモートモードでは、リモートホストへのインストールや変更は行われません。
</Info>

設定する内容：

* リモート Gateway の URL (`ws://...`)
* リモート Gateway 認証が必要な場合のトークン（推奨）

<Note>
  - Gateway がループバックのみの場合は、SSH トンネリングまたは Tailnet を使用してください。
  - 検出のヒント：
    * macOS: Bonjour (`dns-sd`)
    * Linux: Avahi (`avahi-browse`)
</Note>

## 認証とモデルのオプション

<AccordionGroup>
  <Accordion title="Anthropic API キー">
    `ANTHROPIC_API_KEY` が存在する場合はそれを使用するか、キーの入力を求め、デーモンで使用するために保存します。
  </Accordion>

  <Accordion title="Anthropic OAuth (Claude Code CLI)">
    * macOS: キーチェーンの項目 "Claude Code-credentials" をチェックします
    * Linux および Windows: 存在する場合は `~/.claude/.credentials.json` を再利用します

    macOS では、launchd の起動がブロックされないように「常に許可 (Always Allow)」を選択してください。
  </Accordion>

  <Accordion title="Anthropic トークン (setup-token の貼り付け)">
    任意のマシンで `claude setup-token` を実行し、トークンを貼り付けます。
    名前を付けることができます。空白の場合はデフォルトが使用されます。
  </Accordion>

  <Accordion title="OpenAI Code サブスクリプション (Codex CLI の再利用)">
    `~/.codex/auth.json` が存在する場合、ウィザードはそれを再利用できます。
  </Accordion>

  <Accordion title="OpenAI Code サブスクリプション (OAuth)">
    ブラウザのフロー。`code#state` を貼り付けます。

    モデルが未設定、または `openai/*` の場合、`agents.defaults.model` を `openai-codex/gpt-5.4` に設定します。
  </Accordion>

  <Accordion title="OpenAI API キー">
    `OPENAI_API_KEY` が存在する場合はそれを使用するか、キーの入力を求め、認証プロファイルに資格情報を保存します。

    モデルが未設定、`openai/*`、または `openai-codex/*` の場合、`agents.defaults.model` を `openai/gpt-5.1-codex` に設定します。
  </Accordion>

  <Accordion title="xAI (Grok) API キー">
    `XAI_API_KEY` の入力を求め、モデルプロバイダーとして xAI を設定します。
  </Accordion>

  <Accordion title="OpenCode Zen">
    `OPENCODE_API_KEY` (または `OPENCODE_ZEN_API_KEY`) の入力を求めます。
    セットアップ URL: [opencode.ai/auth](https://opencode.ai/auth)。
  </Accordion>

  <Accordion title="API キー (汎用)">
    キーを保存します。
  </Accordion>

  <Accordion title="Vercel AI Gateway">
    `AI_GATEWAY_API_KEY` の入力を求めます。
    詳細: [Vercel AI Gateway](/providers/vercel-ai-gateway)。
  </Accordion>

  <Accordion title="Cloudflare AI Gateway">
    アカウント ID、ゲートウェイ ID、および `CLOUDFLARE_AI_GATEWAY_API_KEY` の入力を求めます。
    詳細: [Cloudflare AI Gateway](/providers/cloudflare-ai-gateway)。
  </Accordion>

  <Accordion title="MiniMax M2.5">
    設定は自動的に書き込まれます。
    詳細: [MiniMax](/providers/minimax)。
  </Accordion>

  <Accordion title="Synthetic (Anthropic 互換)">
    `SYNTHETIC_API_KEY` の入力を求めます。
    詳細: [Synthetic](/providers/synthetic)。
  </Accordion>

  <Accordion title="Moonshot と Kimi Coding">
    Moonshot (Kimi K2) および Kimi Coding の設定は自動的に書き込まれます。
    詳細: [Moonshot AI (Kimi + Kimi Coding)](/providers/moonshot)。
  </Accordion>

  <Accordion title="カスタムプロバイダー">
    OpenAI 互換および Anthropic 互換のエンドポイントで機能します。

    対話型オンボーディングは、他のプロバイダーの API キーフローと同じ API キー保存の選択肢をサポートしています：

    * **今すぐ API キーを貼り付ける** (平文)
    * **シークレット参照を使用する** (環境変数参照または設定済みプロバイダー参照。事前検証付き)

    非対話型フラグ：

    * `--auth-choice custom-api-key`
    * `--custom-base-url`
    * `--custom-model-id`
    * `--custom-api-key` (オプション。フォールバックは `CUSTOM_API_KEY`)
    * `--custom-provider-id` (オプション)
    * `--custom-compatibility <openai|anthropic>` (オプション。デフォルトは `openai`)
  </Accordion>

  <Accordion title="スキップ">
    認証を未設定のままにします。
  </Accordion>
</AccordionGroup>

モデルの動作：

* 検出されたオプションからデフォルトモデルを選択するか、プロバイダーとモデルを手動で入力します。
* ウィザードはモデルチェックを実行し、構成されたモデルが不明な場合や認証がない場合は警告を出します。

資格情報とプロファイルのパス：

* OAuth 資格情報：`~/.openclaw/credentials/oauth.json`
* 認証プロファイル（API キー + OAuth）：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`

資格情報ストレージモード：

* デフォルトのオンボーディング動作では、API キーを平文の値として認証プロファイルに保存します。
* `--secret-input-mode ref` は、平文のキー保存の代わりに参照（リファレンス）モードを有効にします。
  対話型オンボーディングでは、以下のいずれかを選択できます：
  * 環境変数参照（例：`keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`）
  * 設定済みプロバイダー参照（`file` または `exec`。プロバイダーエイリアス + id を使用）
* 対話型の参照モードでは、保存する前に高速な事前検証（プリフライトバリデーション）を実行します。
  * 環境変数参照：現在のオンボーディング環境において、変数名と空ではない値を検証します。
  * プロバイダー参照：プロバイダー設定を検証し、要求された ID を解決します。
  * 事前検証に失敗した場合、オンボーディングはエラーを表示し、再試行できるようにします。
* 非対話型モードでは、`--secret-input-mode ref` は環境変数ベースのみです。
  * オンボーディングプロセス環境でプロバイダーの環境変数を設定してください。
  * インラインのキーフラグ（例：`--openai-api-key`）は、その環境変数が設定されている必要があります。そうでない場合、オンボーディングは即座にエラーになります。
  * カスタムプロバイダーの場合、非対話型の `ref` モードでは `models.providers.<id>.apiKey` が `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }` として保存されます。
  * そのカスタムプロバイダーのケースでは、`--custom-api-key` は `CUSTOM_API_KEY` が設定されている必要があります。そうでない場合、オンボーディングは即座にエラーになります。
* Gateway 認証資格情報は、対話型オンボーディングで平文と SecretRef の選択肢をサポートしています：
  * トークンモード：**平文トークンの生成/保存** (デフォルト) または **SecretRef の使用**。
  * パスワードモード：平文 または SecretRef。
* 非対話型のトークン SecretRef パス：`--gateway-token-ref-env <ENV_VAR>`。
* 既存の平文のセットアップは、変更なしで引き続き機能します。

<Note>
  ヘッドレスおよびサーバーでのヒント：ブラウザがあるマシンで OAuth を完了し、その後 `~/.openclaw/credentials/oauth.json` (または `$OPENCLAW_STATE_DIR/credentials/oauth.json`) を Gateway ホストにコピーしてください。
</Note>

## 出力と内部構造

`~/.openclaw/openclaw.json` 内の典型的なフィールド：

* `agents.defaults.workspace`
* `agents.defaults.model` / `models.providers` (Minimax が選択された場合)
* `tools.profile` (ローカルオンボーディングでは、未設定の場合にデフォルトで `"coding"` になります。既存の明示的な値は保持されます)
* `gateway.*` (モード、バインド、認証、tailscale)
* `session.dmScope` (ローカルオンボーディングでは、未設定の場合にデフォルトで `per-channel-peer` になります。既存の明示的な値は保持されます)
* `channels.telegram.botToken`, `channels.discord.token`, `channels.signal.*`, `channels.imessage.*`
* プロンプト中にオプトインした場合のチャンネル許可リスト (Slack、Discord、Matrix、Microsoft Teams)（可能な場合、名前は ID に解決されます）
* `skills.install.nodeManager`
* `wizard.lastRunAt`
* `wizard.lastRunVersion`
* `wizard.lastRunCommit`
* `wizard.lastRunCommand`
* `wizard.lastRunMode`

`openclaw agents add` は `agents.list[]` とオプションの `bindings` を書き込みます。

WhatsApp 資格情報は `~/.openclaw/credentials/whatsapp/<accountId>/` の下に配置されます。
セッションは `~/.openclaw/agents/<agentId>/sessions/` の下に保存されます。

<Note>
  一部のチャンネルはプラグインとして提供されます。オンボーディング中に選択された場合、ウィザードはチャンネル設定の前にプラグイン（npm またはローカルパス）をインストールするように求めます。
</Note>

Gateway ウィザード RPC:

* `wizard.start`
* `wizard.next`
* `wizard.cancel`
* `wizard.status`

クライアント（macOS アプリと Control UI）は、オンボーディングロジックを再実装することなくステップをレンダリングできます。

Signal セットアップの動作：

* 適切なリリースアセットをダウンロードします
* それを `~/.openclaw/tools/signal-cli/<version>/` の下に保存します
* 設定ファイルに `channels.signal.cliPath` を書き込みます
* JVM ビルドには Java 21 が必要です
* ネイティブビルドが利用可能な場合はそれが使用されます
* Windows では WSL2 を使用し、WSL 内の Linux 向け signal-cli フローに従います

## 関連ドキュメント

* オンボーディングハブ: [オンボーディングウィザード (CLI)](/start/wizard)
* 自動化とスクリプト: [CLI 自動化](/start/wizard-cli-automation)
* コマンドリファレンス: [`openclaw onboard`](/cli/onboard)
