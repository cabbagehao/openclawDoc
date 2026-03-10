---
summary: "OpenClaw のセットアップ、設定、使用方法に関するよくある質問"
read_when:
  - 一般的なセットアップ、インストール、オンボーディング、またはランタイムのサポート質問に回答するとき
  - より深いデバッグの前に、ユーザーから報告された問題をトリアージするとき
title: "FAQ"
---

# FAQ

実運用のセットアップ（ローカル開発、VPS、マルチエージェント、OAuth/API キー、モデルのフェイルオーバー）に対応するための簡潔な回答と、より詳細なトラブルシューティングをまとめています。ランタイム診断については [Troubleshooting](/gateway/troubleshooting) を参照してください。完全な設定リファレンスについては [Configuration](/gateway/configuration) を参照してください。

## 目次

- 問題が起きたときの最初の 60 秒
- クイックスタートと初回セットアップ
  - 行き詰まったとき、最速で抜け出す方法は？
  - OpenClaw をインストールしてセットアップする推奨方法は？
  - onboarding 後に dashboard を開くには？
  - localhost とリモートで dashboard token を認証する方法は？
  - 必要な runtime は？
  - Raspberry Pi で動きますか？
  - Raspberry Pi へのインストールでコツはありますか？
  - onboarding で "wake up my friend" の画面から進まず hatch しません。どうすればいいですか？
  - 新しいマシン（Mac mini など）へ、onboarding をやり直さずにセットアップを移行できますか？
  - 最新バージョンの変更点はどこで確認できますか？
  - `docs.openclaw.ai` にアクセスできず SSL error が出ます。どうすればいいですか？
  - stable と beta の違いは何ですか？
  - beta 版のインストール方法と、beta と dev の違いは？
  - install と onboarding には通常どれくらい時間がかかりますか？
  - 最新 bits を試すには？
  - Installer stuck。もっと詳しいフィードバックを得るには？
  - Windows install で `git not found` や `openclaw not recognized` と表示されます
  - Windows の exec 出力で中国語が文字化けします。どうすればいいですか？
  - docs で答えが見つからなかった場合、より良い答えを得るには？
  - Linux に OpenClaw をインストールするには？
  - VPS に OpenClaw をインストールするには？
  - cloudVPS の install guide はどこにありますか？
  - OpenClaw に自分自身を更新させることはできますか？
  - onboarding wizard は実際には何をしているのですか？
  - 実行するのに Claude や OpenAI の subscription は必要ですか？
  - API key なしで Claude Max subscription を使えますか？
  - Anthropic の setup-token auth はどのように動きますか？
  - Anthropic の setup-token はどこで取得できますか？
  - Claude subscription auth（Claude Pro または Max）はサポートしていますか？
  - Anthropic から HTTP 429 `ratelimiterror` が出るのはなぜですか？
  - AWS Bedrock はサポートされていますか？
  - Codex auth はどのように動きますか？
  - OpenAI subscription auth の Codex OAuth はサポートしていますか？
  - Gemini CLI OAuth はどのように設定しますか？
  - 気軽なチャット用途なら local model でも大丈夫ですか？
  - hosted model のトラフィックを特定リージョン内に保つには？
  - これをインストールするには Mac Mini を買う必要がありますか？
  - iMessage サポートには Mac mini が必要ですか？
  - OpenClaw 用に Mac mini を買った場合、MacBook Pro と接続できますか？
  - Bun は使えますか？
  - Telegram の `allowFrom` には何を入れればいいですか？
  - 1 つの WhatsApp 番号を、複数の OpenClaw instance で別々に使えますか？
  - 高速な chat agent と、coding 用の Opus agent を分けて動かせますか？
  - Linux で Homebrew は使えますか？
  - hackable git install と npm install の違いは何ですか？
  - 後から npm install と git install を切り替えられますか？
  - Gateway は laptop と VPS のどちらで動かすべきですか？
  - OpenClaw を専用マシンで動かす重要性はどれくらいですか？
  - VPS の最小要件と推奨 OS は？
  - VM 上で OpenClaw を動かせますか？要件は？
- OpenClaw とは何ですか?
  - OpenClaw を 1 段落で説明すると
  - 価値提案は何ですか
  - セットアップした直後にまず何をすればよいですか
  - OpenClaw の日常的なユースケース上位 5 つは何ですか
  - OpenClaw は SaaS 向けの lead gen、outreach、ads、blogs に役立ちますか
  - Web 開発において Claude Code と比べた利点は何ですか
- Skills と自動化
  - リポジトリを dirty な状態にせずに Skills をカスタマイズするには
  - カスタムフォルダから Skills を読み込めますか
  - タスクごとに異なるモデルを使い分けるには
  - 重い処理をしている間に bot が固まります どうやってオフロードすればいいですか
  - Discord で thread に紐づく subagent session はどのように動作しますか
  - Cron や reminder が発火しません 何を確認すべきですか
  - Linux で Skills をインストールするには
  - OpenClaw はスケジュール実行やバックグラウンドでの継続実行ができますか
  - Linux から Apple の macOS 専用 Skills を実行できますか
  - Notion や HeyGen との integration はありますか
  - browser takeover 用の Chrome extension をインストールするには
- サンドボックスとメモリ
  - 専用のサンドボックス化ドキュメントはありますか
  - Docker には制限があるように感じます 完全な機能を有効にするにはどうすればよいですか
  - ホストのフォルダをサンドボックスにバインドするにはどうすればよいですか
  - メモリはどのように動作しますか
  - メモリがすぐに忘れます 定着させるにはどうすればよいですか
  - セマンティックメモリ検索には OpenAI API key が必要ですか
  - メモリはずっと保持されますか 制限はありますか
- データはディスク上のどこに存在しますか
  - OpenClaw で使われるすべてのデータはローカルに保存されますか
  - OpenClaw はどこにデータを保存しますか
  - AGENTSmd SOULmd USERmd MEMORYmd はどこに置くべきですか
  - 推奨されるバックアップ戦略は何ですか
  - OpenClaw を完全にアンインストールするにはどうすればよいですか
  - agents は workspace の外側でも動作できますか
  - remote mode では session store はどこにありますか
- 設定の基本
  - 設定ファイルの形式と場所は何ですか
  - gatewaybind を lan または tailnet に設定したら何も待ち受けず、UI に unauthorized と表示されます
  - localhost でも token が必要になったのはなぜですか
  - 設定変更後に再起動は必要ですか
  - CLI の面白いタグラインを無効にするにはどうすればよいですか
  - web search と web fetch を有効にするにはどうすればよいですか
  - 複数デバイスにまたがって、専用 worker を備えた中央 Gateway を実行するにはどうすればよいですか
  - OpenClaw browser は headless で実行できますか
  - browser control に Brave を使うにはどうすればよいですか
- リモート Gateway と nodes
  - Telegram、Gateway、nodes の間で command はどのように伝播しますか
  - Gateway がリモートでホストされている場合、agent から自分のコンピュータにアクセスするにはどうすればよいですか
  - Tailscale は接続済みなのに返信が来ません。どうすればよいですか
  - ローカル環境と VPS 上の 2 つの OpenClaw インスタンスを相互に通信させることはできますか
  - 複数の agent 用に別々の VPS は必要ですか
  - VPS から SSH する代わりに、個人用 laptop 上の node を使う利点はありますか
  - 2 台目の laptop にはインストールすべきですか。それとも node を追加するだけでよいですか
  - nodes は Gateway service を実行しますか
  - config を適用する API / RPC の方法はありますか
  - `config.apply` で config が消えました。復旧と再発防止の方法はありますか
  - 初回インストール向けの最小限で妥当な config は何ですか
  - VPS 上で Tailscale を設定し、Mac から接続するにはどうすればよいですか
  - Mac node をリモート Gateway の Tailscale Serve に接続するにはどうすればよいですか
- 環境変数と .env の読み込み
  - OpenClaw は環境変数をどのように読み込みますか
  - service 経由で Gateway を起動したら環境変数が消えました どうすればよいですか
  - COPILOTGITHUBTOKEN を設定したのに、models status に Shell env off と表示されるのはなぜですか
- セッションと複数チャット
  - 新しい会話を開始するにはどうすればよいですか
  - 新しいメッセージを一度も送らなかった場合、セッションは自動的にリセットされますか
  - OpenClaw インスタンスのチームを作り、1 人を CEO、複数をエージェントにする方法はありますか
  - タスクの途中でコンテキストが切り詰められました。どうすれば防げますか
  - OpenClaw をインストールしたまま完全にリセットするにはどうすればよいですか
  - context too large エラーが出ます。リセットまたは compact するにはどうすればよいですか
  - なぜ "LLM request rejected: messages.content.tool_use.input field required" と表示されるのですか
  - 30 分ごとに heartbeat メッセージが送られてくるのはなぜですか
  - WhatsApp グループに bot アカウントを追加する必要はありますか
  - WhatsApp グループの JID を取得するにはどうすればよいですか
  - グループで OpenClaw が返信しないのはなぜですか
  - グループ / スレッドは DM とコンテキストを共有しますか
  - 作成できる workspace と agent の数はいくつですか
  - 複数の bot やチャットを同時に実行できますか。Slack ではどう設定すべきですか
- Models: デフォルト、選択、aliases、切り替え
  - デフォルト model とは何ですか
  - どの model を推奨しますか
  - selfhosted models の llamacpp vLLM Ollama は使えますか
  - config を消さずに models を切り替えるにはどうすればよいですか
  - OpenClaw、Flawd、Krill は models に何を使っていますか
  - 再起動せずにその場で models を切り替えるにはどうすればよいですか
  - 日常作業には GPT 5.2、coding には Codex 5.3 を使えますか
  - Model is not allowed と表示され、その後 reply がないのはなぜですか
  - Unknown model minimaxMiniMaxM25 と表示されるのはなぜですか
  - デフォルトに MiniMax、複雑なタスクには OpenAI を使えますか
  - opus sonnet gpt は builtin shortcuts ですか
  - model shortcuts aliases を定義 / 上書きするにはどうすればよいですか
  - OpenRouter や ZAI など他の providers の models を追加するにはどうすればよいですか
- モデルのフェイルオーバーと「All models failed」
  - failover はどのように動作しますか
  - このエラーは何を意味しますか
  - No credentials found for profile anthropicdefault の修正チェックリスト
  - なぜ Google Gemini も試行され、失敗したのですか
- Auth profiles: 概要と管理方法
  - auth profile とは
  - 一般的な profile ID は何ですか
  - 最初に試行される auth profile を制御できますか
  - OAuth と API key の違いは何ですか
- Gateway: ポート、「already running」、および remote mode
  - Gateway はどのポートを使用しますか
  - `openclaw gateway status` で Runtime running と表示されるのに RPC probe failed になるのはなぜですか
  - `openclaw gateway status` で Config cli と Config service が異なって表示されるのはなぜですか
  - another gateway instance is already listening とは何を意味しますか
  - OpenClaw を remote mode で実行し、client を別の Gateway に接続するにはどうすればよいですか
  - Control UI で unauthorized と表示される、または再接続を繰り返します。どうすればよいですか
  - `gatewaybind` を `tailnet` に設定したのに bind できず、何も listen しません
  - 同じ host 上で複数の Gateway を実行できますか
  - invalid handshake code 1008 とは何を意味しますか
- ログとデバッグ
  - ログはどこにありますか
  - Gateway サービスを開始/停止/再起動するには
  - Windows でターミナルを閉じてしまった場合 OpenClaw を再起動するには
  - Gateway は起動しているのに返信が届かない場合 何を確認すべきですか
  - gateway から理由なく切断された場合はどうすればよいですか
  - Telegram の setMyCommands がネットワークエラーで失敗する場合 何を確認すべきですか
  - TUI に何も表示されない場合 何を確認すべきですか
  - Gateway を完全に停止してから再起動するには
  - ELI5 openclaw gateway restart と openclaw gateway の違い
  - 何かが失敗したときに最速で詳細を取得する方法は何ですか
- メディアと添付ファイル
  - My Skills generated an imagePDF but nothing was sent
- セキュリティとアクセス制御
  - OpenClaw を受信 DM に公開しても安全ですか
  - prompt injection は公開 bot だけの懸念ですか
  - bot 専用の email、GitHub account、または phone number を持たせるべきですか
  - 自分の text messages に対する自律性を与えてもよいですか またそれは安全ですか
  - 個人アシスタント用途では、より安価な model を使えますか
  - Telegram で start を実行したのに pairing code が届きません
  - WhatsApp で連絡先にメッセージを送りますか Pairing はどのように機能しますか
- チャットコマンド、タスクの中断、「止まらない」場合
  - チャットに内部システムメッセージが表示されないようにするには
  - 実行中のタスクを停止または中断するには
  - Telegram から Discord にメッセージを送ろうとすると Crosscontext messaging denied になるのはなぜですか
  - メッセージを連投すると bot が無視しているように感じるのはなぜですか
- スクリーンショット/チャットログの正確な質問に答える

## 問題が起きたときの最初の 60 秒

1. **クイックステータス（最初の確認）**

   ```bash
   openclaw status
   ```

   OS と更新、Gateway/サービスの到達性、エージェント/セッション、プロバイダー設定とランタイムの問題を、ローカルですばやく要約して表示します（Gateway に到達可能な場合）。

2. **貼り付け可能なレポート（安全に共有可能）**

   ```bash
   openclaw status --all
   ```

   読み取り専用の診断を実行し、ログの末尾も表示します（トークンは伏せ字化されます）。

3. **デーモンとポートの状態**

   ```bash
   openclaw gateway status
   ```

   supervisor のランタイムと RPC 到達性、プローブ対象の URL、サービスが使用した可能性が高い設定を表示します。

4. **詳細プローブ**

   ```bash
   openclaw status --deep
   ```

   Gateway のヘルスチェックとプロバイダーのプローブを実行します（到達可能な Gateway が必要です）。[Health](/gateway/health) を参照してください。

5. **最新ログを追跡**

   ```bash
   openclaw logs --follow
   ```

   RPC が停止している場合は、代わりに次を使用します。

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   ファイルログはサービスログとは別です。[Logging](/logging) と [Troubleshooting](/gateway/troubleshooting) を参照してください。

6. **doctor を実行（修復）**

   ```bash
   openclaw doctor
   ```

   設定と状態を修復または移行し、ヘルスチェックを実行します。[Doctor](/gateway/doctor) を参照してください。

7. **Gateway スナップショット**

   ```bash
   openclaw health --json
   openclaw health --verbose   # エラー時に対象 URL と設定パスを表示
   ```

   実行中の Gateway に完全なスナップショットを要求します（WS-only）。[Health](/gateway/health) を参照してください。

## クイックスタートと初回セットアップ

### 行き詰まったとき、最速で抜け出す方法は？

**自分のマシンを見られる**ローカル AI agent を使ってください。これは Discord で質問するよりもはるかに効果的です。多くの「詰まった」ケースは **ローカルの設定や環境の問題**であり、リモートの支援者には確認できないためです。

- **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
- **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

これらのツールはリポジトリを読み、コマンドを実行し、ログを調べ、マシンレベルのセットアップ（PATH、サービス、権限、認証ファイル）の修正を支援できます。`hackable (git) install` を使って、**完全なソースチェックアウト**を渡してください。

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
```

これにより OpenClaw は **git checkout から**インストールされるため、agent はコードとドキュメントを読み、実際に稼働している正確なバージョンを前提に推論できます。あとでインストーラーを `--install-method git` なしで再実行すれば、いつでも stable に戻せます。

ヒント: agent にはまず修正を**計画して監督**させ（段階的に進める）、その後で本当に必要なコマンドだけを実行させてください。そうすると変更が小さくなり、監査もしやすくなります。

実際のバグや修正を見つけた場合は、GitHub issue の作成または PR の送信をお願いします。
[https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
[https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

まずは以下のコマンドから始めてください（助けを求めるときは出力も共有してください）。

```bash
openclaw status
openclaw models status
openclaw doctor
```

それぞれの役割:

- `openclaw status`: Gateway/agent の健全性と基本設定を素早く確認します。
- `openclaw models status`: provider の認証と model の利用可否を確認します。
- `openclaw doctor`: よくある設定や state の問題を検証し、修復します。

そのほか有用な CLI チェック: `openclaw status --all`, `openclaw logs --follow`,
`openclaw gateway status`, `openclaw health --verbose`.

クイックデバッグループについては「問題が起きたときの最初の 60 秒」を参照してください。
インストールドキュメント: [Install](/install), [Installer flags](/install/installer), [Updating](/install/updating)。

### OpenClaw をインストールしてセットアップする推奨方法は？

このリポジトリでは、ソースから実行し、onboarding wizard を使う方法を推奨しています。

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
openclaw onboard --install-daemon
```

wizard は UI assets も自動でビルドできます。onboarding 後は、通常 Gateway を **18789** ポートで実行します。

ソースから実行する場合（contributor/dev 向け）:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm build
pnpm ui:build # 初回実行時に UI の依存関係も自動インストール
openclaw onboard
```

まだグローバルインストールしていない場合は、`pnpm openclaw onboard` で実行してください。

### onboarding 後に dashboard を開くには？

wizard は onboarding の直後に、クリーンな（token なしの）dashboard URL でブラウザを開き、同時にサマリーにもリンクを表示します。そのタブは開いたままにしてください。起動しなかった場合は、表示された URL を同じマシン上でコピーして開いてください。

### localhost とリモートで dashboard token を認証する方法は？

**Localhost（同じマシン）:**

- `http://127.0.0.1:18789/` を開きます。
- 認証を求められた場合は、`gateway.auth.token`（または `OPENCLAW_GATEWAY_TOKEN`）の token を Control UI settings に貼り付けます。
- Gateway host で `openclaw config get gateway.auth.token` を実行して取得します（または `openclaw doctor --generate-gateway-token` で生成できます）。

**localhost ではない場合:**

- **Tailscale Serve**（推奨）: bind は loopback のままにして、`openclaw gateway --tailscale serve` を実行し、`https://<magicdns>/` を開きます。`gateway.auth.allowTailscale` が `true` なら、identity headers によって Control UI/WebSocket 認証が満たされます（token は不要で、信頼済みの Gateway host を前提とします）。ただし HTTP APIs には引き続き token/password が必要です。
- **Tailnet bind**: `openclaw gateway --bind tailnet --token "<token>"` を実行し、`http://<tailscale-ip>:18789/` を開いて、dashboard settings に token を貼り付けます。
- **SSH tunnel**: `ssh -N -L 18789:127.0.0.1:18789 user@host` を実行してから `http://127.0.0.1:18789/` を開き、Control UI settings に token を貼り付けます。

bind mode と認証の詳細は [Dashboard](/web/dashboard) と [Web surfaces](/web) を参照してください。

### 必要な runtime は？

Node **>= 22** が必要です。`pnpm` を推奨します。Gateway に Bun は **非推奨**です。

### Raspberry Pi で動きますか？

はい。Gateway は軽量で、ドキュメントでは個人利用の目安として **512MB-1GB RAM**、**1 core**、約 **500MB** のディスクで十分とされており、**Raspberry Pi 4 で動作可能**と明記されています。

ログ、メディア、その他サービスの余裕を見込みたい場合は **2GB を推奨**しますが、厳密な最低要件ではありません。

ヒント: 小さな Pi や VPS に Gateway を載せ、ノート PC やスマートフォンに **nodes** をペアリングすれば、ローカルの screen/camera/canvas やコマンド実行を利用できます。[Nodes](/nodes) を参照してください。

### Raspberry Pi へのインストールでコツはありますか？

要点だけ言うと、動作はしますが、多少の粗さはあります。

- **64-bit** OS を使い、Node は 22 以上を維持してください。
- ログを見やすく、更新もしやすい **hackable (git) install** を推奨します。
- channels/Skills なしで始め、あとから 1 つずつ追加してください。
- 変なバイナリ問題が出た場合、多くは **ARM compatibility** の問題です。

ドキュメント: [Linux](/platforms/linux), [Install](/install)。

### onboarding で "wake up my friend" の画面から進まず hatch しません。どうすればいいですか？

この画面は、Gateway に到達できて認証も通っていることが前提です。TUI は最初の hatch 時に `"Wake up, my friend!"` も自動送信します。その行が表示されても **返答がなく**、token 数が 0 のままなら、agent は一度も実行されていません。

1. Gateway を再起動します。

```bash
openclaw gateway restart
```

2. status と認証を確認します。

```bash
openclaw status
openclaw models status
openclaw logs --follow
```

3. まだ止まる場合は、以下を実行します。

```bash
openclaw doctor
```

Gateway がリモートにある場合は、tunnel/Tailscale 接続が生きていること、そして UI が正しい Gateway を向いていることを確認してください。[Remote access](/gateway/remote) を参照してください。

### 新しいマシン（Mac mini など）へ、onboarding をやり直さずにセットアップを移行できますか？

はい。**state directory** と **workspace** をコピーしてから Doctor を 1 回実行すれば移行できます。**両方**の場所をコピーする限り、bot を「**まったく同じ状態**」（memory、session history、auth、channel state）で引き継げます。

1. 新しいマシンに OpenClaw をインストールします。
2. 古いマシンから `$OPENCLAW_STATE_DIR`（既定: `~/.openclaw`）をコピーします。
3. workspace（既定: `~/.openclaw/workspace`）をコピーします。
4. `openclaw doctor` を実行し、Gateway service を再起動します。

これにより config、auth profile、WhatsApp credentials、sessions、memory が保持されます。remote mode の場合、session store と workspace を所有しているのは gateway host であることに注意してください。

**重要:** workspace だけを GitHub に commit/push しても、バックアップされるのは **memory + bootstrap files** だけで、**session history や auth は含まれません**。それらは `~/.openclaw/` 配下（たとえば `~/.openclaw/agents/<agentId>/sessions/`）に保存されます。

関連: [Migrating](/install/migrating), [Where things live on disk](/help/faq#where-does-openclaw-store-its-data),
[Agent workspace](/concepts/agent-workspace), [Doctor](/gateway/doctor),
[Remote mode](/gateway/remote)。

### 最新バージョンの変更点はどこで確認できますか？

GitHub の changelog を確認してください。
[https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

新しいエントリほど先頭にあります。先頭セクションが **Unreleased** の場合、その次の日付付きセクションが最新のリリース版です。エントリは **Highlights**、**Changes**、**Fixes**（必要に応じて docs/その他セクション）で整理されています。

### `docs.openclaw.ai` にアクセスできず SSL error が出ます。どうすればいいですか？

一部の Comcast/Xfinity 回線では、Xfinity Advanced Security により `docs.openclaw.ai` が誤ってブロックされることがあります。無効化するか、`docs.openclaw.ai` を allowlist に追加してから再試行してください。詳細: [Troubleshooting](/help/troubleshooting#docsopenclawai-shows-an-ssl-error-comcastxfinity)。
解除の支援として、こちらから報告していただけると助かります: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status)。

それでも到達できない場合、docs は GitHub に mirror されています。
[https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

### stable と beta の違いは何ですか？

**Stable** と **beta** は、別々のコードラインではなく **npm dist-tags** です。

- `latest` = stable
- `beta` = テスト用の先行ビルド

私たちはまず **beta** にビルドを出し、テストを行い、十分に安定したら**その同じバージョンを `latest` に昇格**させます。そのため beta と stable が**同じバージョン**を指していることがあります。

変更点はこちらで確認できます。
[https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

### beta 版のインストール方法と、beta と dev の違いは？

**Beta** は npm dist-tag の `beta` です（`latest` と同じことがあります）。
**Dev** は `main` の移動中の先頭（git）で、公開されると npm dist-tag `dev` を使います。

ワンライナー（macOS/Linux）:

```bash
curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
```

```bash
curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
```

Windows installer（PowerShell）:
[https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

詳細: [Development channels](/install/development-channels) と [Installer flags](/install/installer)。

### install と onboarding には通常どれくらい時間がかかりますか？

おおよその目安:

- **Install:** 2-5 分
- **Onboarding:** 5-15 分（設定する channels/models の数に依存）

止まる場合は、[Installer stuck](/help/faq#installer-stuck-how-do-i-get-more-feedback) と [Im stuck](/help/faq#im-stuck--whats-the-fastest-way-to-get-unstuck) の高速デバッグループを使ってください。

### 最新 bits を試すには？

方法は 2 つあります。

1. **Dev channel（git checkout）:**

```bash
openclaw update --channel dev
```

これにより `main` branch に切り替わり、ソースから更新されます。

2. **Hackable install（installer site から）:**

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
```

これでローカルに編集可能な repo が得られ、その後は git で更新できます。

手動でクリーンな clone を作りたい場合は、以下を使ってください。

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm build
```

ドキュメント: [Update](/cli/update), [Development channels](/install/development-channels),
[Install](/install)。

### Installer stuck。もっと詳しいフィードバックを得るには？

**verbose output** を付けて installer を再実行してください。

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
```

verbose 付き beta install:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
```

hackable (git) install の場合:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
```

Windows（PowerShell）の同等手順:

```powershell
# install.ps1 にはまだ専用の -Verbose フラグはありません。
Set-PSDebug -Trace 1
& ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
Set-PSDebug -Trace 0
```

その他のオプション: [Installer flags](/install/installer)。

### Windows install で `git not found` や `openclaw not recognized` と表示されます

Windows ではよくある問題が 2 つあります。

**1) npm error spawn git / git not found**

- **Git for Windows** をインストールし、`git` が PATH に入っていることを確認してください。
- PowerShell を閉じて開き直し、installer を再実行してください。

**2) install 後に `openclaw is not recognized` になる**

- npm の global bin folder が PATH に入っていません。
- パスは次で確認できます。

  ```powershell
  npm config get prefix
  ```

- そのディレクトリをユーザー PATH に追加してください（Windows では `\bin` の接尾辞は不要です。多くの環境では `%AppData%\npm` です）。
- PATH を更新したら、PowerShell を閉じて開き直してください。

もっともスムーズな Windows 環境にしたい場合は、ネイティブ Windows ではなく **WSL2** を使ってください。
ドキュメント: [Windows](/platforms/windows)。

### Windows の exec 出力で中国語が文字化けします。どうすればいいですか？

これは通常、ネイティブ Windows shell における console code page の不一致です。

症状:

- `system.run`/`exec` の出力で中国語が mojibake になる
- 同じコマンドが別の terminal profile では正常に見える

PowerShell での簡易回避策:

```powershell
chcp 65001
[Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$OutputEncoding = [System.Text.UTF8Encoding]::new($false)
```

その後で Gateway を再起動し、コマンドを再試行してください。

```powershell
openclaw gateway restart
```

最新版の OpenClaw でも再現する場合は、以下で追跡・報告してください。

- [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

### docs で答えが見つからなかった場合、より良い答えを得るには？

**hackable (git) install** を使ってソースと docs 一式をローカルに持ち、そのフォルダから bot（または Claude/Codex）に質問してください。そうすれば repo を読んだうえで、より正確に回答できます。

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
```

詳細: [Install](/install) と [Installer flags](/install/installer)。

### Linux に OpenClaw をインストールするには？

短く言うと、Linux guide に従ってから onboarding wizard を実行してください。

- Linux の最短手順 + service install: [Linux](/platforms/linux)。
- フル手順: [Getting Started](/start/getting-started)。
- installer と更新: [Install & updates](/install/updating)。

### VPS に OpenClaw をインストールするには？

Linux の VPS であればどれでも動作します。server に install してから、SSH/Tailscale 経由で Gateway にアクセスしてください。

ガイド: [exe.dev](/install/exe-dev), [Hetzner](/install/hetzner), [Fly.io](/install/fly)。
リモートアクセス: [Gateway remote](/gateway/remote)。

### cloudVPS の install guide はどこにありますか？

主要 provider をまとめた **hosting hub** を用意しています。1 つ選んでガイドに従ってください。

- [VPS hosting](/vps)（全 provider を集約）
- [Fly.io](/install/fly)
- [Hetzner](/install/hetzner)
- [exe.dev](/install/exe-dev)

cloud での動作は次のとおりです。**Gateway は server 上で動作**し、あなたはノート PC やスマートフォンから Control UI（または Tailscale/SSH）でアクセスします。state と workspace は server 上にあるため、host を source of truth として扱い、バックアップしてください。

その cloud Gateway に **nodes**（Mac/iOS/Android/headless）をペアリングすると、Gateway を cloud に置いたまま、ローカルの screen/camera/canvas へのアクセスやノート PC 上でのコマンド実行が可能になります。

ハブ: [Platforms](/platforms)。リモートアクセス: [Gateway remote](/gateway/remote)。
Nodes: [Nodes](/nodes), [Nodes CLI](/cli/nodes)。

### OpenClaw に自分自身を更新させることはできますか？

短く言うと、**可能ですが、推奨しません**。update 処理では Gateway が再起動し（現在の session が切断される）、クリーンな git checkout が必要になる場合があり、確認プロンプトも出ることがあります。より安全なのは、運用者が shell から更新を実行することです。

CLI は以下です。

```bash
openclaw update
openclaw update status
openclaw update --channel stable|beta|dev
openclaw update --tag <dist-tag|version>
openclaw update --no-restart
```

agent から自動化する必要がある場合:

```bash
openclaw update --yes --no-restart
openclaw gateway restart
```

ドキュメント: [Update](/cli/update), [Updating](/install/updating)。

### onboarding wizard は実際には何をしているのですか？

`openclaw onboard` は推奨されるセットアップ経路です。**local mode** では次を順番に案内します。

- **Model/auth setup**（provider OAuth/setup-token フロー、API keys、LM Studio などの local model オプションを含む）
- **Workspace** の場所と bootstrap files
- **Gateway settings**（bind/port/auth/tailscale）
- **Providers**（WhatsApp, Telegram, Discord, Mattermost (plugin), Signal, iMessage）
- **Daemon install**（macOS では LaunchAgent、Linux/WSL2 では systemd user unit）
- **Health checks** と **Skills** の選択

また、設定済みの model が不明または auth 不足の場合は警告も出します。

### 実行するのに Claude や OpenAI の subscription は必要ですか？

いいえ。OpenClaw は **API keys**（Anthropic/OpenAI/その他）でも、データを端末内に留める **local-only models** でも動作します。subscription（Claude Pro/Max や OpenAI Codex）は、それら provider を認証するための任意の手段です。

Anthropic subscription auth を選ぶ場合は、自分で判断してください。Anthropic は過去に Claude Code 以外での一部 subscription 利用をブロックしたことがあります。OpenAI Codex OAuth は、OpenClaw のような外部ツールでの利用が明示的にサポートされています。

ドキュメント: [Anthropic](/providers/anthropic), [OpenAI](/providers/openai),
[Local models](/gateway/local-models), [Models](/concepts/models)。

### API key なしで Claude Max subscription を使えますか？

はい。API key の代わりに **setup-token** で認証できます。これが subscription 用の経路です。

Claude Pro/Max subscription には **API key は含まれない**ため、subscription account における技術的な経路はこれです。ただし使うかどうかはあなたの判断です。Anthropic は過去に Claude Code 以外での一部 subscription 利用をブロックしたことがあります。
本番で最も明確かつ安全なサポート経路を望むなら、Anthropic API key を使ってください。

### Anthropic の setup-token auth はどのように動きますか？

`claude setup-token` は Claude Code CLI 経由で **token string** を生成します（web console では取得できません）。これは **どのマシンでも**実行できます。wizard で **Anthropic token (paste setup-token)** を選ぶか、`openclaw models auth paste-token --provider anthropic` で貼り付けてください。token は **anthropic** provider の auth profile として保存され、API key のように使われます（自動更新なし）。詳細: [OAuth](/concepts/oauth)。

### Anthropic の setup-token はどこで取得できますか？

**Anthropic Console にはありません**。setup-token は **どのマシンでも** **Claude Code CLI** から生成します。

```bash
claude setup-token
```

表示された token をコピーし、wizard で **Anthropic token (paste setup-token)** を選んでください。gateway host 上で実行したい場合は `openclaw models auth setup-token --provider anthropic` を使います。別の場所で `claude setup-token` を実行した場合は、gateway host で `openclaw models auth paste-token --provider anthropic` により貼り付けてください。[Anthropic](/providers/anthropic) を参照してください。

### Claude subscription auth（Claude Pro または Max）はサポートしていますか？

はい。**setup-token** 経由でサポートしています。OpenClaw は Claude Code CLI の OAuth token を再利用しなくなったため、setup-token か Anthropic API key を使ってください。token はどこで生成してもよく、gateway host に貼り付けます。[Anthropic](/providers/anthropic) と [OAuth](/concepts/oauth) を参照してください。

重要: これは技術的互換性の話であり、ポリシー保証ではありません。Anthropic は過去に Claude Code 以外での一部 subscription 利用をブロックしたことがあります。
利用するかどうか、また Anthropic の現行規約に適合するかは、あなた自身で確認してください。
本番運用や multi-user workload では、Anthropic API key auth のほうがより安全で、推奨される選択です。

### Anthropic から HTTP 429 `ratelimiterror` が出るのはなぜですか？

これは現在のウィンドウで **Anthropic の quota/rate limit** を使い切ったことを意味します。**Claude subscription**（setup-token）を使っている場合は、ウィンドウのリセットを待つか、プランをアップグレードしてください。**Anthropic API key** を使っている場合は、Anthropic Console で利用量や請求状況を確認し、必要に応じて上限を引き上げてください。

特に以下のメッセージが出る場合:
`Extra usage is required for long context requests`
これは Anthropic の 1M context beta（`context1m: true`）を使おうとしていることを示します。これは credential が long-context billing の対象である場合にのみ動作します（API key billing、または Extra Usage が有効な subscription）。

ヒント: provider が rate-limited でも OpenClaw が応答を継続できるよう、**fallback model** を設定してください。[Models](/cli/models), [OAuth](/concepts/oauth), and
[/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context) を参照してください。

### AWS Bedrock はサポートされていますか？

はい。pi-ai の **Amazon Bedrock (Converse)** provider を **manual config** で利用できます。gateway host に AWS credentials/region を設定し、models config に Bedrock provider entry を追加する必要があります。[Amazon Bedrock](/providers/bedrock) と [Model providers](/providers/models) を参照してください。managed key flow を望む場合は、Bedrock の前段に OpenAI-compatible proxy を置く方法も引き続き有効です。

### Codex auth はどのように動きますか？

OpenClaw は **OpenAI Code (Codex)** を OAuth（ChatGPT sign-in）でサポートしています。wizard は OAuth flow を実行でき、必要に応じて default model を `openai-codex/gpt-5.4` に設定します。[Model providers](/concepts/model-providers) と [Wizard](/start/wizard) を参照してください。

### OpenAI subscription auth の Codex OAuth はサポートしていますか？

はい。OpenClaw は **OpenAI Code (Codex) subscription OAuth** を完全にサポートしています。
OpenAI は、OpenClaw のような外部ツールや workflow での subscription OAuth 利用を明示的に許可しています。onboarding wizard から OAuth flow を実行できます。

[OAuth](/concepts/oauth), [Model providers](/concepts/model-providers), [Wizard](/start/wizard) を参照してください。

### Gemini CLI OAuth はどのように設定しますか？

Gemini CLI は、`openclaw.json` に client id や secret を書く方式ではなく、**plugin auth flow** を使います。

手順:

1. plugin を有効化します: `openclaw plugins enable google-gemini-cli-auth`
2. login します: `openclaw models auth login --provider google-gemini-cli --set-default`

これにより OAuth tokens は gateway host 上の auth profiles に保存されます。詳細: [Model providers](/concepts/model-providers)。

### 気軽なチャット用途なら local model でも大丈夫ですか？

通常はおすすめしません。OpenClaw には大きな context と強い safety が必要であり、小さいカードでは切り詰めや漏れが起きます。どうしても使うなら、ローカルで実行できる **最大の** MiniMax M2.5 build を（LM Studio で）動かし、[/gateway/local-models](/gateway/local-models) を確認してください。小型モデルや quantized model では prompt-injection risk が高まります。[Security](/gateway/security) を参照してください。

### hosted model のトラフィックを特定リージョン内に保つには？

リージョン固定の endpoint を選んでください。OpenRouter は MiniMax、Kimi、GLM について US-hosted options を提供しています。in-region に保ちたい場合は US-hosted variant を選択してください。同時に `models.mode: "merge"` を使えば、選択したリージョン provider を尊重しながら Anthropic/OpenAI も並べて fallback として利用できます。

### これをインストールするには Mac Mini を買う必要がありますか？

いいえ。OpenClaw は macOS または Linux（Windows は WSL2 経由）で動作します。Mac mini は任意です。常時稼働 host として買う人もいますが、小さな VPS、home server、Raspberry Pi 級のマシンでも動きます。

Mac が必要なのは **macOS-only tools** を使う場合だけです。iMessage には [BlueBubbles](/channels/bluebubbles)（推奨）を使ってください。BlueBubbles server は任意の Mac 上で動作し、Gateway は Linux など別環境で動かせます。その他の macOS-only tools を使いたい場合は、Gateway を Mac 上で動かすか、macOS node をペアリングしてください。

ドキュメント: [BlueBubbles](/channels/bluebubbles), [Nodes](/nodes), [Mac remote mode](/platforms/mac/remote)。

### iMessage サポートには Mac mini が必要ですか？

**Messages にサインイン済みの macOS device** が何らか 1 台必要です。Mac mini である必要はなく、**どの Mac でも構いません**。iMessage には **[BlueBubbles](/channels/bluebubbles)**（推奨）を使ってください。BlueBubbles server は macOS 上で動作し、Gateway は Linux など別環境で動作できます。

一般的な構成:

- Gateway は Linux/VPS で動かし、BlueBubbles server は Messages にサインインした任意の Mac で動かす。
- もっとも単純な単一マシン構成にしたい場合は、すべてをその Mac 上で動かす。

ドキュメント: [BlueBubbles](/channels/bluebubbles), [Nodes](/nodes),
[Mac remote mode](/platforms/mac/remote)。

### OpenClaw 用に Mac mini を買った場合、MacBook Pro と接続できますか？

はい。**Mac mini で Gateway を動かし**、MacBook Pro を **node**（companion device）として接続できます。nodes は Gateway を実行しません。代わりに、そのデバイス上の screen/camera/canvas や `system.run` などの追加機能を提供します。

一般的なパターン:

- Gateway は Mac mini 上（常時稼働）。
- MacBook Pro は macOS app または node host を実行し、Gateway とペアリング。
- `openclaw nodes status` / `openclaw nodes list` で状態を確認。

ドキュメント: [Nodes](/nodes), [Nodes CLI](/cli/nodes)。

### Bun は使えますか？

Bun は **非推奨**です。特に WhatsApp と Telegram で runtime bugs が見られます。
安定した Gateway には **Node** を使ってください。

それでも Bun を試したい場合は、WhatsApp/Telegram なしの非本番 Gateway で行ってください。

### Telegram の `allowFrom` には何を入れればいいですか？

`channels.telegram.allowFrom` は **人間の送信者の Telegram user ID**（数値）です。bot username ではありません。

onboarding wizard では `@username` 入力を受け付けて数値 ID に解決できますが、OpenClaw の認可で使われるのは数値 ID のみです。

より安全な方法（サードパーティ bot なし）:

- bot に DM を送り、`openclaw logs --follow` を実行して `from.id` を確認する。

公式 Bot API:

- bot に DM を送り、`https://api.telegram.org/bot<bot_token>/getUpdates` を呼び、`message.from.id` を確認する。

サードパーティ（プライバシーはやや低い）:

- `@userinfobot` または `@getidsbot` に DM を送る。

[/channels/telegram](/channels/telegram#access-control-dms--groups) を参照してください。

### 1 つの WhatsApp 番号を、複数の OpenClaw instance で別々に使えますか？

はい。**multi-agent routing** で可能です。各送信者の WhatsApp **DM**（peer `kind: "direct"`、送信者 E.164 形式 `+15551234567` など）を別々の `agentId` に bind すれば、各ユーザーに専用の workspace と session store を割り当てられます。返信元は引き続き**同じ WhatsApp account**です。また、DM access control（`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`）は WhatsApp account 単位でグローバルです。[Multi-Agent Routing](/concepts/multi-agent) と [WhatsApp](/channels/whatsapp) を参照してください。

### 高速な chat agent と、coding 用の Opus agent を分けて動かせますか？

はい。multi-agent routing を使います。各 agent に個別の default model を設定し、そのうえで inbound routes（provider account または特定の peers）を各 agent に bind してください。設定例は [Multi-Agent Routing](/concepts/multi-agent) にあります。併せて [Models](/concepts/models) と [Configuration](/gateway/configuration) も参照してください。

### Linux で Homebrew は使えますか？

はい。Homebrew は Linux（Linuxbrew）をサポートしています。簡易セットアップ:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
brew install <formula>
```

OpenClaw を systemd 経由で実行する場合は、service の PATH に `/home/linuxbrew/.linuxbrew/bin`（または自身の brew prefix）が含まれていることを確認してください。そうしないと、`brew` で入れたツールが non-login shell で解決されません。
最近の build では Linux の systemd services に一般的な user bin dirs（たとえば `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`）も prepend し、`PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR`, `FNM_DIR` が設定されていればそれも尊重します。

### hackable git install と npm install の違いは何ですか？

- **Hackable (git) install:** 完全なソース checkout で、編集可能です。contributor に最適です。
  ローカルで build し、コードや docs を修正できます。
- **npm install:** repo なしの global CLI install で、「とにかく動かしたい」場合に最適です。
  更新は npm dist-tags から行われます。

ドキュメント: [Getting started](/start/getting-started), [Updating](/install/updating)。

### 後から npm install と git install を切り替えられますか？

はい。もう一方の方式を install してから Doctor を実行すれば、gateway service が新しい entrypoint を向くようになります。
これで**データは削除されません**。変わるのは OpenClaw のコード install だけです。state
（`~/.openclaw`）と workspace（`~/.openclaw/workspace`）はそのまま残ります。

npm → git:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm build
openclaw doctor
openclaw gateway restart
```

git → npm:

```bash
npm install -g openclaw@latest
openclaw doctor
openclaw gateway restart
```

Doctor は gateway service の entrypoint mismatch を検出し、現在の install に合わせて service config を書き換える提案をします（自動化では `--repair` を使用）。

バックアップのヒント: [Backup strategy](/help/faq#whats-the-recommended-backup-strategy) を参照してください。

### Gateway は laptop と VPS のどちらで動かすべきですか？

短く言うと、**24/7 の信頼性が必要なら VPS** です。もっとも摩擦が少ない方法を優先し、sleep や再起動を許容できるならローカルでも構いません。

**Laptop（local Gateway）**

- **Pros:** server コスト不要、ローカルファイルへ直接アクセス可能、ブラウザ window が見える。
- **Cons:** sleep や network drop で切断、OS update や reboot で中断、常時起動が必要。

**VPS / cloud**

- **Pros:** 常時稼働、安定した network、laptop の sleep 問題がない、継続運用しやすい。
- **Cons:** headless 運用が多い（screenshots を使う）、ファイルアクセスはリモートのみ、更新には SSH が必要。

**OpenClaw 固有の注意:** WhatsApp/Telegram/Slack/Mattermost (plugin)/Discord はいずれも VPS で問題なく動作します。実質的なトレードオフは、**headless browser** か、見える browser window か、という点です。[Browser](/tools/browser) を参照してください。

**推奨デフォルト:** 以前に Gateway の切断を経験したなら VPS。Mac をアクティブに使っていて、ローカルファイルアクセスや可視ブラウザでの UI automation を重視するならローカルも有効です。

### OpenClaw を専用マシンで動かす重要性はどれくらいですか？

必須ではありませんが、**信頼性と分離の観点では推奨**です。

- **Dedicated host（VPS/Mac mini/Pi）:** 常時稼働しやすく、sleep/reboot による中断が少なく、権限が整理しやすく、継続運用も容易です。
- **共有 laptop/desktop:** テストやアクティブ利用には十分ですが、sleep や update による停止は見込んでください。

両方の利点を取りたいなら、Gateway は dedicated host に置き、laptop を **node** としてペアリングしてローカルの screen/camera/exec tools を使ってください。[Nodes](/nodes) を参照してください。
セキュリティ指針は [Security](/gateway/security) を確認してください。

### VPS の最小要件と推奨 OS は？

OpenClaw は軽量です。基本的な Gateway + 1 つの chat channel なら:

- **Absolute minimum:** 1 vCPU, 1GB RAM, 約 500MB disk。
- **Recommended:** 1-2 vCPU, 2GB RAM 以上。ログ、メディア、複数 channels の余裕が取れます。node tools や browser automation はリソースを消費しやすいです。

OS は **Ubuntu LTS**（または最新の Debian/Ubuntu 系）を使ってください。Linux install path はそこが最もよくテストされています。

ドキュメント: [Linux](/platforms/linux), [VPS hosting](/vps)。

### VM 上で OpenClaw を動かせますか？要件は？

はい。VM は VPS と同様に扱ってください。常時稼働し、到達可能で、Gateway と有効化する channels に十分な RAM が必要です。

基本目安:

- **Absolute minimum:** 1 vCPU, 1GB RAM。
- **Recommended:** 複数 channels、browser automation、media tools を使うなら 2GB RAM 以上。
- **OS:** Ubuntu LTS または同等の新しい Debian/Ubuntu。

Windows の場合、**WSL2 が最も簡単な VM 風セットアップ**であり、ツール互換性も最良です。[Windows](/platforms/windows), [VPS hosting](/vps) を参照してください。
macOS を VM で実行する場合は [macOS VM](/install/macos-vm) を参照してください。

## OpenClaw とは何ですか?

### OpenClaw を 1 段落で説明すると

OpenClaw は、自分のデバイス上で動かすパーソナル AI アシスタントです。普段使っているメッセージングの画面上で応答し（WhatsApp、Telegram、Slack、Mattermost (plugin)、Discord、Google Chat、Signal、iMessage、WebChat）、対応プラットフォームでは音声機能とライブ Canvas も利用できます。**Gateway** は常時稼働するコントロールプレーンであり、アシスタントそのものがプロダクトです。

### 価値提案は何ですか

OpenClaw は「単なる Claude wrapper」ではありません。これは **local-first control plane** であり、
**自分のハードウェア** 上で高機能なアシスタントを実行し、普段使っているチャットアプリからアクセスでき、
ステートフルなセッション、メモリ、ツールを利用しながら、ワークフローの主導権をホスト型
SaaS に渡さずに済みます。

主なポイント:

- **自分のデバイス、自分のデータ:** Gateway は好きな場所（Mac、Linux、VPS）で実行でき、
  workspace と session history をローカルに保持できます。
- **web sandbox ではなく実際のチャネル:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/etc
  に加え、対応プラットフォームではモバイル音声と Canvas も使えます。
- **モデル非依存:** Anthropic、OpenAI、MiniMax、OpenRouter などを利用でき、agent ごとの routing
  と failover に対応します。
- **ローカル専用オプション:** ローカルモデルを実行すれば、必要に応じて **すべてのデータを自分のデバイス上に
  とどめる** ことができます。
- **マルチエージェント routing:** チャネル、アカウント、またはタスクごとに agent を分けられ、
  それぞれが独自の workspace と defaults を持てます。
- **オープンソースで拡張しやすい:** 中身を確認し、拡張し、vendor lock-in なしで self-host できます。

Docs: [Gateway](/gateway), [Channels](/channels), [Multi-agent](/concepts/multi-agent),
[Memory](/concepts/memory).

### セットアップした直後にまず何をすればよいですか

最初のプロジェクトとしては、次のようなものがおすすめです。

- Web サイトを作る（WordPress、Shopify、またはシンプルな静的サイト）。
- モバイルアプリを試作する（構成、画面、API プラン）。
- ファイルやフォルダを整理する（クリーンアップ、命名、タグ付け）。
- Gmail を接続して、要約やフォローアップを自動化する。

大きなタスクにも対応できますが、フェーズごとに分割し、
並列作業には sub agents を使うと最も効果的です。

### OpenClaw の日常的なユースケース上位 5 つは何ですか

日常的に効果が出やすい使い方は、たとえば次のようなものです。

- **個人向けブリーフィング:** inbox、calendar、気になるニュースの要約。
- **調査とドラフト作成:** メールやドキュメントのための簡易リサーチ、要約、初稿作成。
- **リマインダーとフォローアップ:** cron や heartbeat で動く通知やチェックリスト。
- **ブラウザ自動化:** フォーム入力、データ収集、繰り返しの Web 作業。
- **デバイス横断の連携:** スマートフォンからタスクを送り、Gateway をサーバー上で実行し、結果をチャットで受け取る。

### OpenClaw は SaaS 向けの lead gen、outreach、ads、blogs に役立ちますか

はい。**調査、選別、ドラフト作成** には有効です。サイトを調べて shortlists を作り、
prospects を要約し、outreach や ad copy の下書きを書けます。

ただし、**outreach の実行や広告配信** では、人間を必ず介在させてください。スパムを避け、各地域の法令と
プラットフォームのポリシーを守り、送信前には必ず内容を確認してください。最も安全な運用パターンは、
OpenClaw にドラフトさせて人間が承認することです。

Docs: [Security](/gateway/security).

### Web 開発において Claude Code と比べた利点は何ですか

OpenClaw は **personal assistant** と coordination layer であり、IDE の代替ではありません。リポジトリ内で
最速の直接的な coding loop が必要なら Claude Code や Codex を使ってください。永続的な memory、クロスデバイスのアクセス、
tool orchestration が必要なときに OpenClaw を使います。

利点:

- **セッションをまたいで持続する memory + workspace**
- **マルチプラットフォーム access**（WhatsApp、Telegram、TUI、WebChat）
- **tool orchestration**（browser、files、scheduling、hooks）
- **常時稼働する Gateway**（VPS 上で実行し、どこからでも操作可能）
- **Nodes** によるローカルの browser/screen/camera/exec

Showcase: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

## Skills と自動化

### リポジトリを dirty な状態にせずに Skills をカスタマイズするには

リポジトリ側のコピーを直接編集するのではなく、管理された override を使ってください。変更内容は `~/.openclaw/skills/<name>/SKILL.md` に置くか、`~/.openclaw/openclaw.json` の `skills.load.extraDirs` でフォルダを追加します。優先順位は `<workspace>/skills` > `~/.openclaw/skills` > bundled なので、git に触れずに管理された override が優先されます。上流に取り込む価値のある編集だけをリポジトリに入れ、PR として提出してください。

### カスタムフォルダから Skills を読み込めますか

はい。`~/.openclaw/openclaw.json` の `skills.load.extraDirs` で追加ディレクトリを指定できます（最も低い優先順位）。デフォルトの優先順位は引き続き `<workspace>/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs` です。`clawhub` はデフォルトで `./skills` にインストールし、OpenClaw はそれを `<workspace>/skills` として扱います。

### タスクごとに異なるモデルを使い分けるには

現時点でサポートされているパターンは次のとおりです。

- **Cron jobs**: 分離された job ごとに `model` override を設定できます。
- **Sub-agents**: デフォルトモデルの異なる個別の agent にタスクをルーティングできます。
- **On-demand switch**: `/model` を使えば、現在のセッションモデルをいつでも切り替えられます。

[Cron jobs](/automation/cron-jobs)、[Multi-Agent Routing](/concepts/multi-agent)、[Slash commands](/tools/slash-commands) を参照してください。

### 重い処理をしている間に bot が固まります どうやってオフロードすればいいですか

長時間かかるタスクや並列タスクには **sub-agents** を使ってください。sub-agents は独自のセッションで実行され、
要約を返しつつ、メインの chat の応答性を維持します。

bot に "spawn a sub-agent for this task" と依頼するか、`/subagents` を使ってください。
現在 Gateway が何をしているか（そしてビジーかどうか）は、chat で `/status` を使うと確認できます。

トークンに関するヒント: 長時間タスクも sub-agents もどちらもトークンを消費します。コストが気になる場合は、
`agents.defaults.subagents.model` で sub-agents 用により安価なモデルを設定してください。

Docs: [Sub-agents](/tools/subagents)。

### Discord で thread に紐づく subagent session はどのように動作しますか

thread binding を使用します。Discord の thread を subagent または session target に紐づけることで、その thread 内の後続メッセージがその紐づいた session に留まるようにできます。

基本フロー:

- `sessions_spawn` を `thread: true` で実行します（継続的な follow-up が必要なら `mode: "session"` も任意で指定します）。
- あるいは `/focus <target>` で手動で bind します。
- `/agents` を使って binding の状態を確認します。
- `/session idle <duration|off>` と `/session max-age <duration|off>` を使って auto-unfocus を制御します。
- thread を切り離すには `/unfocus` を使います。

必要な設定:

- Global defaults: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`。
- Discord overrides: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`。
- spawn 時に auto-bind するには: `channels.discord.threadBindings.spawnSubagentSessions: true` を設定します。

Docs: [Sub-agents](/tools/subagents), [Discord](/channels/discord), [Configuration Reference](/gateway/configuration-reference), [Slash commands](/tools/slash-commands)。

### Cron や reminder が発火しません 何を確認すべきですか

Cron は Gateway プロセス内で動作します。Gateway が継続的に動いていない場合、
スケジュールされた job は実行されません。

チェックリスト:

- cron が有効であること（`cron.enabled`）と、`OPENCLAW_SKIP_CRON` が設定されていないことを確認してください。
- Gateway が 24/7 稼働していることを確認してください（スリープや再起動なし）。
- job のタイムゾーン設定（`--tz` とホストのタイムゾーン）を確認してください。

デバッグ:

```bash
openclaw cron run <jobId> --force
openclaw cron runs --id <jobId> --limit 50
```

Docs: [Cron jobs](/automation/cron-jobs), [Cron vs Heartbeat](/automation/cron-vs-heartbeat)。

### Linux で Skills をインストールするには

**ClawHub**（CLI）を使うか、Skills を workspace に配置してください。macOS の Skills UI は Linux では利用できません。
Skills は [https://clawhub.com](https://clawhub.com) で参照できます。

ClawHub CLI をインストールします（いずれかの package manager を選択）:

```bash
npm i -g clawhub
```

```bash
pnpm add -g clawhub
```

### OpenClaw はスケジュール実行やバックグラウンドでの継続実行ができますか

はい。Gateway scheduler を使います。

- **Cron jobs** はスケジュール実行または定期実行のタスク向けです（再起動後も保持されます）。
- **Heartbeat** は "main session" の定期チェック向けです。
- **Isolated jobs** は、自律的に summary を投稿したり chat に配信したりする agent 向けです。

Docs: [Cron jobs](/automation/cron-jobs), [Cron vs Heartbeat](/automation/cron-vs-heartbeat),
[Heartbeat](/gateway/heartbeat)。

### Linux から Apple の macOS 専用 Skills を実行できますか

直接はできません。macOS Skills は `metadata.openclaw.os` と必要な binary によって制御されており、Skills は **Gateway host** 上で条件を満たす場合にのみ system prompt に表示されます。Linux では、gating を override しない限り `darwin` 専用の Skills（`apple-notes`、`apple-reminders`、`things-mac` など）は読み込まれません。

サポートされているパターンは 3 つあります。

**Option A - Gateway を Mac 上で実行する（最も簡単）。**
macOS の binary が存在する環境で Gateway を動かし、Linux からは remote mode または Tailscale 経由で接続します。Gateway host が macOS なので、Skills は通常どおり読み込まれます。

**Option B - macOS node を使う（SSH なし）。**
Gateway は Linux 上で動かし、macOS node（menubar app）をペアリングして、Mac 側の **Node Run Commands** を "Always Ask" または "Always Allow" に設定します。必要な binary が node 上に存在すれば、OpenClaw は macOS 専用 Skills を利用可能として扱えます。agent は `nodes` tool 経由でそれらの Skills を実行します。"Always Ask" を選んだ場合、プロンプトで "Always Allow" を承認すると、その command が allowlist に追加されます。

**Option C - SSH 経由で macOS binary を proxy する（上級者向け）。**
Gateway は Linux 上に置いたまま、必要な CLI binary が Mac 上で動く SSH wrapper に解決されるようにします。そのうえで、Linux でも eligible になるように Skill を override します。

1. binary 用の SSH wrapper を作成します（例: Apple Notes 用の `memo`）。

   ```bash
   #!/usr/bin/env bash
   set -euo pipefail
   exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
   ```

2. wrapper を Linux host の `PATH` 上に配置します（例: `~/bin/memo`）。
3. Linux を許可するように Skill metadata を override します（workspace または `~/.openclaw/skills`）。

   ```markdown
   ---
   name: apple-notes
   description: Manage Apple Notes via the memo CLI on macOS.
   metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
   ---
   ```

4. 新しい session を開始して、Skills snapshot を更新します。

### Notion や HeyGen との integration はありますか

現時点では built-in ではありません。

選択肢:

- **Custom skill / plugin:** 信頼性の高い API アクセスにはこれが最適です（Notion も HeyGen も API を提供しています）。
- **Browser automation:** コードなしでも動きますが、遅く壊れやすくなります。

クライアントごとの context を維持したい場合（agency workflow など）は、次のような単純なパターンが使えます。

- クライアントごとに Notion page を 1 つ用意する（context + preferences + active work）。
- session の開始時に、その page を取得するよう agent に依頼する。

native integration が欲しい場合は、feature request を出すか、
それらの API を対象にした skill を作成してください。

Skills のインストール:

```bash
clawhub install <skill-slug>
clawhub update --all
```

ClawHub は現在のディレクトリ配下の `./skills` にインストールします（または設定済みの OpenClaw workspace にフォールバックします）。OpenClaw は次の session でそれを `<workspace>/skills` として扱います。複数の agent 間で共有する Skills は、`~/.openclaw/skills/<name>/SKILL.md` に配置してください。一部の Skills は Homebrew でインストールされた binary を前提としており、Linux では Linuxbrew を意味します（詳細は上記の Homebrew Linux FAQ を参照）。[Skills](/tools/skills) と [ClawHub](/tools/clawhub) も参照してください。

### browser takeover 用の Chrome extension をインストールするには

built-in installer を使い、その後 Chrome に unpacked extension を読み込んでください。

```bash
openclaw browser extension install
openclaw browser extension path
```

その後、Chrome → `chrome://extensions` → "Developer mode" を有効化 → "Load unpacked" → そのフォルダを選択します。

完全なガイド（remote Gateway + security に関する注意事項を含む）: [Chrome extension](/tools/chrome-extension)

Gateway が Chrome と同じマシン上で動いている場合（デフォルト構成）、通常は**追加の作業は不要**です。
Gateway が別の場所で動いている場合は、browser があるマシン上で node host を動かし、Gateway が browser 操作を proxy できるようにしてください。
それでも、制御したい tab では extension ボタンを自分でクリックする必要があります（自動では attach されません）。

## サンドボックスとメモリ

### 専用のサンドボックス化ドキュメントはありますか

はい。[Sandboxing](/gateway/sandboxing) を参照してください。Docker 固有のセットアップ（Docker 上での完全な gateway や sandbox イメージ）については、[Docker](/install/docker) を参照してください。

### Docker には制限があるように感じます 完全な機能を有効にするにはどうすればよいですか

デフォルトのイメージはセキュリティ優先で、`node` ユーザーとして実行されるため、
system packages、Homebrew、バンドル済みブラウザは含まれていません。より完全なセットアップにするには、次のようにします。

- `OPENCLAW_HOME_VOLUME` で `/home/node` を永続化し、キャッシュが保持されるようにする
- `OPENCLAW_DOCKER_APT_PACKAGES` で system deps をイメージに組み込む
- バンドルされている CLI で Playwright のブラウザをインストールする:
  `node /app/node_modules/playwright-core/cli.js install chromium`
- `PLAYWRIGHT_BROWSERS_PATH` を設定し、そのパスが永続化されるようにする

ドキュメント: [Docker](/install/docker), [Browser](/tools/browser)。

**DM は個人的なままにして、グループは 1 つの agent で公開サンドボックス化できますか**

はい。あなたのプライベートなトラフィックが **DMs** で、公開トラフィックが **groups** である場合は可能です。

`agents.defaults.sandbox.mode: "non-main"` を使うと、group/channel セッション（non-main keys）は Docker 内で実行され、main DM セッションはホスト上に残ります。そのうえで、`tools.sandbox.tools` を使って、サンドボックス化されたセッションで利用できるツールを制限します。

セットアップ手順と設定例: [Groups: personal DMs + public groups](/channels/groups#pattern-personal-dms-public-groups-single-agent)

主要な設定リファレンス: [Gateway configuration](/gateway/configuration#agentsdefaultssandbox)

### ホストのフォルダをサンドボックスにバインドするにはどうすればよいですか

`agents.defaults.sandbox.docker.binds` を `["host:path:mode"]`（例: `"/home/user/src:/src:ro"`）に設定します。グローバルと agent ごとの binds はマージされます。`scope: "shared"` の場合、agent ごとの binds は無視されます。機密性の高いものには `:ro` を使用し、binds はサンドボックスのファイルシステム境界を迂回することを忘れないでください。例と安全上の注意については、[Sandboxing](/gateway/sandboxing#custom-bind-mounts) と [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) を参照してください。

### メモリはどのように動作しますか

OpenClaw のメモリは、agent workspace 内の Markdown files にすぎません。

- `memory/YYYY-MM-DD.md` の daily notes
- `MEMORY.md` の curated long-term notes（main/private sessions のみ）

また OpenClaw は、モデルに durable notes の書き込みを促すための **silent pre-compaction memory flush** を auto-compaction の前に実行します。これは workspace が書き込み可能な場合にのみ実行されます（read-only sandboxes ではスキップされます）。詳細は [Memory](/concepts/memory) を参照してください。

### メモリがすぐに忘れます 定着させるにはどうすればよいですか

bot に **write the fact to memory** と依頼してください。長期的なメモは `MEMORY.md` に、短期的なコンテキストは `memory/YYYY-MM-DD.md` に入ります。

これはまだ改善を進めている領域です。モデルに memories を保存するよう改めて伝えると効果があります。
モデルは何をすべきか理解しています。それでも忘れ続ける場合は、Gateway が毎回同じ
workspace を使っていることを確認してください。

ドキュメント: [Memory](/concepts/memory), [Agent workspace](/concepts/agent-workspace)。

### セマンティックメモリ検索には OpenAI API key が必要ですか

**OpenAI embeddings** を使う場合に限り必要です。Codex OAuth がカバーするのは chat/completions であり、
embeddings へのアクセスは **付与されません**。そのため、**Codex でサインインしても（OAuth または
Codex CLI login）** セマンティックメモリ検索の助けにはなりません。OpenAI embeddings には、
引き続き実際の API key（`OPENAI_API_KEY` または `models.providers.openai.apiKey`）が必要です。

provider を明示的に設定しない場合、OpenClaw は API key を解決できるときに provider を自動選択します
（auth profiles、`models.providers.*.apiKey`、または env vars）。OpenAI key を解決できる場合は OpenAI を優先し、
そうでなければ Gemini key を解決できる場合は Gemini、その次に Voyage、次に Mistral を選びます。利用可能な
remote key がない場合、設定するまでは memory search は無効のままです。local model path が設定済みで存在する場合、
OpenClaw は `local` を優先します。Ollama は、`memorySearch.provider = "ollama"` を明示的に設定した場合にサポートされます。

ローカルのまま使いたい場合は、`memorySearch.provider = "local"`（必要に応じて
`memorySearch.fallback = "none"` も）を設定してください。Gemini embeddings を使いたい場合は、
`memorySearch.provider = "gemini"` を設定し、`GEMINI_API_KEY`（または
`memorySearch.remote.apiKey`）を指定してください。**OpenAI, Gemini, Voyage, Mistral, Ollama, or local** の embedding
models をサポートしています。セットアップの詳細は [Memory](/concepts/memory) を参照してください。

### メモリはずっと保持されますか 制限はありますか

メモリファイルはディスク上に保存され、削除するまで保持されます。制限はモデルではなく、
ストレージ容量です。ただし、**session context** は依然としてモデルの context window に制限されるため、
長い会話では compact または truncate が発生することがあります。そのため、
memory search が存在します。関連する部分だけをコンテキストに戻すためです。

ドキュメント: [Memory](/concepts/memory), [Context](/concepts/context)。

## データはディスク上のどこに存在しますか

### OpenClaw で使われるすべてのデータはローカルに保存されますか

いいえ。**OpenClaw の state はローカル**ですが、**送信先の外部サービスには、あなたが送った内容が引き続き見えます**。

- **デフォルトではローカル:** sessions、memory files、config、workspace は Gateway ホスト上にあります
  （`~/.openclaw` とあなたの workspace ディレクトリ）。
- **必然的にリモート:** model provider（Anthropic/OpenAI など）に送るメッセージは
  それらの API に送信され、chat platform（WhatsApp/Telegram/Slack など）は message data を
  それらのサーバーに保存します。
- **影響範囲は自分で制御可能:** local models を使えば prompts はあなたのマシン上に残りますが、channel
  traffic は依然としてその channel のサーバーを経由します。

関連: [Agent workspace](/concepts/agent-workspace), [Memory](/concepts/memory).

### OpenClaw はどこにデータを保存しますか

すべては `$OPENCLAW_STATE_DIR`（デフォルト: `~/.openclaw`）配下に保存されます。

| Path                                                            | Purpose                                                             |
| --------------------------------------------------------------- | ------------------------------------------------------------------- |
| `$OPENCLAW_STATE_DIR/openclaw.json`                             | メイン設定（JSON5）                                                 |
| `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | 従来の OAuth import（初回利用時に auth profiles へコピー）          |
| `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Auth profiles（OAuth、API keys、任意の `keyRef`/`tokenRef`）        |
| `$OPENCLAW_STATE_DIR/secrets.json`                              | `file` SecretRef provider 用の任意の file-backed secret payload     |
| `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | 後方互換のための従来ファイル（静的な `api_key` entries は除去済み） |
| `$OPENCLAW_STATE_DIR/credentials/`                              | provider state（例: `whatsapp/<accountId>/creds.json`）             |
| `$OPENCLAW_STATE_DIR/agents/`                                   | agent ごとの state（agentDir + sessions）                           |
| `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | 会話履歴と state（agent ごと）                                      |
| `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | session metadata（agent ごと）                                      |

従来の単一 agent パス: `~/.openclaw/agent/*`（`openclaw doctor` により移行）。

あなたの **workspace**（AGENTS.md、memory files、Skills など）は別管理で、`agents.defaults.workspace` により設定されます（デフォルト: `~/.openclaw/workspace`）。

### AGENTSmd SOULmd USERmd MEMORYmd はどこに置くべきですか

これらのファイルは `~/.openclaw` ではなく、**agent workspace** に置きます。

- **Workspace（agent ごと）**: `AGENTS.md`、`SOUL.md`、`IDENTITY.md`、`USER.md`、
  `MEMORY.md`（または `memory.md`）、`memory/YYYY-MM-DD.md`、任意で `HEARTBEAT.md`。
- **State dir（`~/.openclaw`）**: config、credentials、auth profiles、sessions、logs、
  および共有 Skills（`~/.openclaw/skills`）。

デフォルトの workspace は `~/.openclaw/workspace` で、次の設定で変更できます。

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

再起動後に bot が「忘れる」場合は、毎回同じ workspace を使って Gateway を起動しているか確認してください（加えて、remote mode では **gateway host 側の** workspace が使われ、ローカル laptop 側ではない点にも注意してください）。

ヒント: 永続化したい振る舞いや設定があるなら、chat history に頼るのではなく、bot に **AGENTS.md または MEMORY.md に書き込ませる** のがおすすめです。

[Agent workspace](/concepts/agent-workspace) と [Memory](/concepts/memory) も参照してください。

### 推奨されるバックアップ戦略は何ですか

**agent workspace** を **private** な git repo に置き、どこか非公開の場所
（たとえば GitHub private）へバックアップしてください。これにより memory と AGENTS/SOUL/USER
files を保持でき、後で assistant の「mind」を復元できます。

`~/.openclaw` 配下のもの（credentials、sessions、tokens、または暗号化された secrets payload）を commit してはいけません。
完全復元が必要なら、workspace と state directory の両方を別々に
バックアップしてください（上の migration に関する質問を参照）。

ドキュメント: [Agent workspace](/concepts/agent-workspace).

### OpenClaw を完全にアンインストールするにはどうすればよいですか

専用ガイドを参照してください: [Uninstall](/install/uninstall).

### agents は workspace の外側でも動作できますか

はい。workspace は **デフォルトの cwd** および memory anchor であり、厳格な sandbox ではありません。
relative paths は workspace 内で解決されますが、sandboxing が有効でなければ absolute paths で他の
host 上の場所にもアクセスできます。分離が必要な場合は、
[`agents.defaults.sandbox`](/gateway/sandboxing) または agent ごとの sandbox 設定を使用してください。repo をデフォルトの作業ディレクトリにしたい場合は、その agent の
`workspace` を repo root に向けてください。OpenClaw repo は単なる source code です。意図的にその中で agent を動かしたい場合を除き、workspace は分けておいてください。

例（repo をデフォルトの cwd にする場合）:

```json5
{
  agents: {
    defaults: {
      workspace: "~/Projects/my-repo",
    },
  },
}
```

### remote mode では session store はどこにありますか

session state を保持するのは **gateway host** です。remote mode の場合、確認すべき session store はローカル laptop ではなく remote machine 側にあります。[Session management](/concepts/session) を参照してください。

## 設定の基本

### 設定ファイルの形式と場所は何ですか

OpenClaw は、`$OPENCLAW_CONFIG_PATH`（デフォルト: `~/.openclaw/openclaw.json`）から任意の **JSON5** 設定を読み込みます。

```
$OPENCLAW_CONFIG_PATH
```

このファイルが存在しない場合は、安全寄りのデフォルト設定が使われます（デフォルトのワークスペース `~/.openclaw/workspace` を含みます）。

### gatewaybind を lan または tailnet に設定したら何も待ち受けず、UI に unauthorized と表示されます

ループバック以外への bind では **auth が必須** です。`gateway.auth.mode` と `gateway.auth.token` を設定してください（または `OPENCLAW_GATEWAY_TOKEN` を使用してください）。

```json5
{
  gateway: {
    bind: "lan",
    auth: {
      mode: "token",
      token: "replace-me",
    },
  },
}
```

注意:

- `gateway.remote.token` / `.password` だけでは、ローカル Gateway の auth は有効になりません。
- `gateway.auth.*` が未設定の場合、ローカルの呼び出し経路ではフォールバックとして `gateway.remote.*` を使用できます。
- Control UI は `connect.params.auth.token`（app/UI 設定に保存）で認証します。URL に token を含めるのは避けてください。

### localhost でも token が必要になったのはなぜですか

OpenClaw は、ループバックを含めてデフォルトで token auth を強制します。token が設定されていない場合、Gateway の起動時に自動生成されて `gateway.auth.token` に保存されるため、**ローカルの WS クライアントも認証が必要** です。これにより、他のローカルプロセスが Gateway を呼び出すことを防ぎます。

本当にループバックを開放したい場合は、設定で `gateway.auth.mode: "none"` を明示的に指定してください。Doctor はいつでも token を生成できます: `openclaw doctor --generate-gateway-token`。

### 設定変更後に再起動は必要ですか

Gateway は設定ファイルを監視しており、hot-reload をサポートしています。

- `gateway.reload.mode: "hybrid"`（デフォルト）: 安全な変更は hot-apply し、重要な変更は再起動します
- `hot`、`restart`、`off` もサポートされています

### CLI の面白いタグラインを無効にするにはどうすればよいですか

設定で `cli.banner.taglineMode` を指定してください。

```json5
{
  cli: {
    banner: {
      taglineMode: "off", // random | default | off
    },
  },
}
```

- `off`: タグラインの文言を非表示にしますが、バナーのタイトル/バージョン行は残ります。
- `default`: 毎回 `All your chats, one OpenClaw.` を使用します。
- `random`: 面白い/季節限定のタグラインをローテーション表示します（デフォルト動作）。
- バナー自体を完全に表示したくない場合は、環境変数 `OPENCLAW_HIDE_BANNER=1` を設定してください。

### web search と web fetch を有効にするにはどうすればよいですか

`web_fetch` は API key なしで動作します。`web_search` には Brave Search API
key が必要です。**推奨:** `openclaw configure --section web` を実行して、
`tools.web.search.apiKey` に保存してください。環境変数を使う場合は、Gateway
プロセスに対して `BRAVE_API_KEY` を設定します。

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "BRAVE_API_KEY_HERE",
        maxResults: 5,
      },
      fetch: {
        enabled: true,
      },
    },
  },
}
```

注意:

- allowlist を使っている場合は、`web_search`/`web_fetch` または `group:web` を追加してください。
- `web_fetch` はデフォルトで有効です（明示的に無効化していない限り）。
- daemon は `~/.openclaw/.env`（またはサービス環境）から環境変数を読み取ります。

ドキュメント: [Web tools](/tools/web)。

### 複数デバイスにまたがって、専用 worker を備えた中央 Gateway を実行するにはどうすればよいですか

一般的な構成は、**1 つの Gateway**（例: Raspberry Pi）に **nodes** と **agents** を組み合わせる形です。

- **Gateway (central):** channels（Signal/WhatsApp）、routing、sessions を管理します。
- **Nodes (devices):** Mac、iOS、Android などが周辺デバイスとして接続し、ローカル tools（`system.run`、`canvas`、`camera`）を公開します。
- **Agents (workers):** 特定の役割向けに分離された brain/workspace です（例: "Hetzner ops"、"Personal data"）。
- **Sub-agents:** 並列化したいときに、メイン agent からバックグラウンド作業を spawn します。
- **TUI:** Gateway に接続し、agent や session を切り替えます。

ドキュメント: [Nodes](/nodes), [Remote access](/gateway/remote), [Multi-Agent Routing](/concepts/multi-agent), [Sub-agents](/tools/subagents), [TUI](/web/tui)。

### OpenClaw browser は headless で実行できますか

はい。設定オプションで指定できます。

```json5
{
  browser: { headless: true },
  agents: {
    defaults: {
      sandbox: { browser: { headless: true } },
    },
  },
}
```

デフォルトは `false`（headful）です。headless は、一部のサイトで anti-bot チェックを誘発しやすくなります。詳細は [Browser](/tools/browser) を参照してください。

headless は **同じ Chromium engine** を使用し、ほとんどの自動化（フォーム入力、クリック、スクレイピング、ログイン）で動作します。主な違いは次のとおりです。

- ブラウザウィンドウは表示されません（見た目を確認したい場合は screenshot を使用してください）。
- headless モードでは、一部のサイトが自動化に対してより厳格になります（CAPTCHA、anti-bot）。
  たとえば、X/Twitter は headless session をブロックすることがよくあります。

### browser control に Brave を使うにはどうすればよいですか

`browser.executablePath` を Brave のバイナリ（または任意の Chromium-based browser）に設定し、Gateway を再起動してください。
設定例の全体は [Browser](/tools/browser#use-brave-or-another-chromium-based-browser) を参照してください。

## リモート Gateway と nodes

### Telegram、Gateway、nodes の間で command はどのように伝播しますか

Telegram メッセージは **Gateway** によって処理されます。Gateway は agent を実行し、
node tool が必要になった場合にのみ **Gateway WebSocket** 経由で nodes を呼び出します:

Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

nodes は受信側 provider トラフィックを見ることはなく、受け取るのは node RPC call のみです。

### Gateway がリモートでホストされている場合、agent から自分のコンピュータにアクセスするにはどうすればよいですか

短い答え: **自分のコンピュータを node としてペアリングしてください**。Gateway 自体は別の場所で動作していても、
Gateway WebSocket 経由でローカルマシン上の `node.*` tools（screen、camera、system）を呼び出せます。

一般的なセットアップ:

1. 常時稼働する host（VPS / home server）で Gateway を実行します。
2. Gateway host と自分のコンピュータを同じ tailnet に参加させます。
3. Gateway WS に到達できることを確認します（tailnet bind または SSH tunnel）。
4. ローカルで macOS app を開き、**Remote over SSH** mode（または direct tailnet）で接続して、
   node として登録できるようにします。
5. Gateway 上で node を承認します:

   ```bash
   openclaw devices list
   openclaw devices approve <requestId>
   ```

別個の TCP bridge は不要です。nodes は Gateway WebSocket 経由で接続します。

セキュリティ上の注意: macOS node をペアリングすると、そのマシンで `system.run` が可能になります。信頼できる device のみをペアリングし、[Security](/gateway/security) を確認してください。

Docs: [Nodes](/nodes), [Gateway protocol](/gateway/protocol), [macOS remote mode](/platforms/mac/remote), [Security](/gateway/security).

### Tailscale は接続済みなのに返信が来ません。どうすればよいですか

まず基本項目を確認してください:

- Gateway が実行中であること: `openclaw gateway status`
- Gateway の health: `openclaw status`
- channel の health: `openclaw channels status`

次に auth と routing を確認します:

- Tailscale Serve を使っている場合は、`gateway.auth.allowTailscale` が正しく設定されていることを確認します。
- SSH tunnel 経由で接続している場合は、ローカル tunnel が起動しており、正しい port を向いていることを確認します。
- allowlist（DM または group）に自分の account が含まれていることを確認します。

Docs: [Tailscale](/gateway/tailscale), [Remote access](/gateway/remote), [Channels](/channels).

### ローカル環境と VPS 上の 2 つの OpenClaw インスタンスを相互に通信させることはできますか

はい。組み込みの "bot-to-bot" bridge はありませんが、いくつかの信頼できる方法で接続できます。

**最も簡単な方法:** 両方の bot がアクセスできる通常の chat channel（Telegram / Slack / WhatsApp）を使います。
Bot A から Bot B にメッセージを送り、その後は通常どおり Bot B に返信させます。

**CLI bridge（汎用）:** `openclaw agent --message ... --deliver` を使って相手側 Gateway を呼び出す script を実行し、
相手の bot が listen している chat を target にします。片方の bot がリモート VPS 上にある場合は、
SSH / Tailscale 経由で CLI をそのリモート Gateway に向けてください（[Remote access](/gateway/remote) を参照）。

Example pattern（target Gateway に到達できるマシンから実行）:

```bash
openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
```

ヒント: 2 つの bot が無限 loop しないように guardrail を追加してください（mention-only、channel allowlists、または "do not reply to bot messages" ルール）。

Docs: [Remote access](/gateway/remote), [Agent CLI](/cli/agent), [Agent send](/tools/agent-send).

### 複数の agent 用に別々の VPS は必要ですか

いいえ。1 つの Gateway で複数の agent をホストでき、それぞれに独自の workspace、model defaults、routing を持たせられます。これが通常の構成であり、agent ごとに VPS を 1 台ずつ動かすよりも、はるかに低コストでシンプルです。

別々の VPS が必要になるのは、強い分離（security boundary）が必要な場合や、共有したくない大きく異なる config がある場合だけです。それ以外は、1 つの Gateway を維持して複数の agent または sub-agent を使ってください。

### VPS から SSH する代わりに、個人用 laptop 上の node を使う利点はありますか

あります。リモート Gateway から laptop に到達する第一級の方法は node であり、shell access 以上のことが可能になります。Gateway は macOS / Linux（Windows は WSL2 経由）で動作し、軽量です（小さな VPS や Raspberry Pi 級の box で十分で、4 GB RAM あれば余裕があります）。そのため、常時稼働 host と laptop 上の node を組み合わせる構成が一般的です。

- **インバウンド SSH が不要です。** nodes は Gateway WebSocket に outbound 接続し、device pairing を使います。
- **より安全な実行制御。** `system.run` はその laptop 上の node allowlists / approvals によって制御されます。
- **より多くの device tools。** nodes は `system.run` に加えて `canvas`、`camera`、`screen` を公開します。
- **ローカル browser automation。** Gateway は VPS 上に置いたまま、Chrome はローカルで動かし、Chrome extension と laptop 上の node host で制御を中継できます。

SSH は一時的な shell access には問題ありませんが、継続的な agent workflow や device automation には node の方がシンプルです。

Docs: [Nodes](/nodes), [Nodes CLI](/cli/nodes), [Chrome extension](/tools/chrome-extension).

### 2 台目の laptop にはインストールすべきですか。それとも node を追加するだけでよいですか

2 台目の laptop で必要なのが **local tools**（screen / camera / exec）だけなら、**node** として追加してください。これにより、Gateway を 1 つに保ちつつ、config の重複を避けられます。local node tools は現在 macOS のみ対応ですが、今後ほかの OS にも拡張する予定です。

2 つ目の Gateway をインストールするのは、**強い分離** が必要な場合、または完全に独立した 2 つの bot が必要な場合だけです。

Docs: [Nodes](/nodes), [Nodes CLI](/cli/nodes), [Multiple gateways](/gateway/multiple-gateways).

### nodes は Gateway service を実行しますか

いいえ。host ごとに実行すべき Gateway は通常 **1 つだけ** です。意図的に分離プロファイルを動かす場合を除きます（[Multiple gateways](/gateway/multiple-gateways) を参照）。nodes は Gateway に接続する peripheral です（iOS / Android nodes、または menubar app の macOS "node mode"）。headless node host や CLI control については、[Node host CLI](/cli/node) を参照してください。

`gateway`、`discovery`、`canvasHost` の変更には完全な restart が必要です。

### config を適用する API / RPC の方法はありますか

はい。`config.apply` はフル config を検証して書き込み、その処理の一部として Gateway を再起動します。

### `config.apply` で config が消えました。復旧と再発防止の方法はありますか

`config.apply` は **config 全体** を置き換えます。部分的な object を送ると、それ以外はすべて削除されます。

復旧方法:

- backup（git またはコピーしておいた `~/.openclaw/openclaw.json`）から復元します。
- backup がない場合は、`openclaw doctor` を再実行して channels / models を再設定します。
- 想定外の動作だった場合は bug を報告し、最後に把握していた config または任意の backup を添付してください。
- ローカルの coding agent であれば、logs や history から動作する config を再構築できることがよくあります。

再発防止:

- 小さな変更には `openclaw config set` を使います。
- 対話的な編集には `openclaw configure` を使います。

Docs: [Config](/cli/config), [Configure](/cli/configure), [Doctor](/gateway/doctor).

### 初回インストール向けの最小限で妥当な config は何ですか

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

これは workspace を設定し、誰が bot を起動できるかを制限します。

### VPS 上で Tailscale を設定し、Mac から接続するにはどうすればよいですか

最小手順:

1. **VPS に install して login する**

   ```bash
   curl -fsSL https://tailscale.com/install.sh | sh
   sudo tailscale up
   ```

2. **Mac に install して login する**
   - Tailscale app を使い、同じ tailnet に sign in します。
3. **MagicDNS を有効にする（推奨）**
   - Tailscale admin console で MagicDNS を有効にし、VPS に安定した名前を付けます。
4. **tailnet hostname を使う**
   - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
   - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

SSH なしで Control UI を使いたい場合は、VPS 上で Tailscale Serve を使います:

```bash
openclaw gateway --tailscale serve
```

これにより Gateway は loopback に bind されたままとなり、Tailscale 経由で HTTPS が公開されます。詳細は [Tailscale](/gateway/tailscale) を参照してください。

### Mac node をリモート Gateway の Tailscale Serve に接続するにはどうすればよいですか

Serve は **Gateway Control UI + WS** を公開します。nodes は同じ Gateway WS endpoint 経由で接続します。

推奨セットアップ:

1. **VPS と Mac が同じ tailnet に参加していることを確認します**。
2. **macOS app を Remote mode で使います**（SSH target には tailnet hostname を指定できます）。
   app が Gateway port を tunnel し、node として接続します。
3. **Gateway 上で node を承認します**:

   ```bash
   openclaw devices list
   openclaw devices approve <requestId>
   ```

Docs: [Gateway protocol](/gateway/protocol), [Discovery](/gateway/discovery), [macOS remote mode](/platforms/mac/remote).

## 環境変数と .env の読み込み

### OpenClaw は環境変数をどのように読み込みますか

OpenClaw は親プロセス（shell、launchd/systemd、CI など）から環境変数を読み取り、さらに以下も読み込みます。

- 現在の作業ディレクトリの `.env`
- `~/.openclaw/.env` にあるグローバルなフォールバック用の `.env`（別名 `$OPENCLAW_STATE_DIR/.env`）

どちらの `.env` ファイルも、既存の環境変数を上書きしません。

config ではインラインの環境変数も定義できます（プロセス環境に存在しない場合のみ適用されます）。

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

完全な優先順位と読み込み元については [/environment](/help/environment) を参照してください。

### service 経由で Gateway を起動したら環境変数が消えました どうすればよいですか

よくある対処法は 2 つあります。

1. 不足しているキーを `~/.openclaw/.env` に追加して、service が shell の環境変数を継承しない場合でも読み込まれるようにします。
2. shell import を有効にします（オプトインの利便機能）。

```json5
{
  env: {
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

これは login shell を実行し、不足している想定キーだけを取り込みます（上書きはしません）。対応する環境変数:
`OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

### COPILOTGITHUBTOKEN を設定したのに、models status に Shell env off と表示されるのはなぜですか

`openclaw models status` は、**shell env import** が有効かどうかを表示します。`"Shell env: off"`
は **環境変数がない** ことを意味するのではなく、OpenClaw が login shell を自動では読み込まないことを意味します。

Gateway が service（launchd/systemd）として動作している場合、shell の
environment は継承されません。次のいずれかで対処してください。

1. トークンを `~/.openclaw/.env` に記述します。

   ```
   COPILOT_GITHUB_TOKEN=...
   ```

2. または shell import を有効にします（`env.shellEnv.enabled: true`）。
3. または config の `env` ブロックに追加します（存在しない場合のみ適用されます）。

その後、gateway を再起動して再確認してください。

```bash
openclaw models status
```

Copilot トークンは `COPILOT_GITHUB_TOKEN`（`GH_TOKEN` / `GITHUB_TOKEN` も可）から読み取られます。
[/concepts/model-providers](/concepts/model-providers) および [/environment](/help/environment) を参照してください。

## セッションと複数チャット

### 新しい会話を開始するにはどうすればよいですか

単独のメッセージとして `/new` または `/reset` を送信してください。[セッション管理](/concepts/session) を参照してください。

### 新しいメッセージを一度も送らなかった場合、セッションは自動的にリセットされますか

はい。セッションは `session.idleMinutes`（デフォルトは **60**）経過後に期限切れになります。**次の**
メッセージで、そのチャットキーに対する新しいセッション ID が開始されます。これは
トランスクリプトを削除するものではなく、新しいセッションを開始するだけです。

```json5
{
  session: {
    idleMinutes: 240,
  },
}
```

### OpenClaw インスタンスのチームを作り、1 人を CEO、複数をエージェントにする方法はありますか

はい。**multi-agent routing** と **sub-agents** を使います。1 つのコーディネーター
エージェントと、それぞれ独自のワークスペースとモデルを持つ複数のワーカーエージェントを
作成できます。

とはいえ、これは **楽しい実験** として捉えるのが適切です。トークン消費が大きく、多くの場合
1 つの bot を別々のセッションで使うより効率は下がります。私たちが典型的に想定しているのは、
会話相手は 1 つの bot で、並列作業には異なるセッションを使う形です。その bot は必要に応じて
sub-agents を起動することもできます。

Docs: [Multi-agent routing](/concepts/multi-agent), [Sub-agents](/tools/subagents), [Agents CLI](/cli/agents).

### タスクの途中でコンテキストが切り詰められました。どうすれば防げますか

セッションのコンテキストはモデルのウィンドウサイズに制限されます。長いチャット、大きなツール出力、
多数のファイルは、圧縮や切り詰めの原因になります。

効果がある方法:

- bot に現在の状態を要約させて、ファイルに書き出してもらう。
- 長い作業の前に `/compact` を使い、話題を切り替えるときは `/new` を使う。
- 重要なコンテキストはワークスペース内に置き、bot に再読込させる。
- 長時間または並列の作業では sub-agents を使い、メインチャットを小さく保つ。
- 頻繁に起こる場合は、より大きなコンテキストウィンドウを持つモデルを選ぶ。

### OpenClaw をインストールしたまま完全にリセットするにはどうすればよいですか

reset コマンドを使います。

```bash
openclaw reset
```

非対話の完全リセット:

```bash
openclaw reset --scope full --yes --non-interactive
```

その後、オンボーディングを再実行します。

```bash
openclaw onboard --install-daemon
```

注意:

- オンボーディングウィザードも、既存の設定を検出した場合は **Reset** を提示します。[Wizard](/start/wizard) を参照してください。
- プロファイル（`--profile` / `OPENCLAW_PROFILE`）を使用している場合は、各 state dir（デフォルトは `~/.openclaw-<profile>`）をリセットしてください。
- Dev reset: `openclaw gateway --dev --reset`（開発専用。開発用の config、credentials、sessions、workspace を消去します）。

### context too large エラーが出ます。リセットまたは compact するにはどうすればよいですか

次のいずれかを使ってください。

- **Compact**（会話は維持しつつ、古いターンを要約します）:

  ```
  /compact
  ```

  または、要約の方針を指定するには `/compact <instructions>` を使います。

- **Reset**（同じチャットキーに対して新しいセッション ID を作成します）:

  ```
  /new
  /reset
  ```

それでも繰り返し発生する場合:

- **session pruning**（`agents.defaults.contextPruning`）を有効化または調整して、古いツール出力を削減する。
- より大きなコンテキストウィンドウを持つモデルを使う。

Docs: [Compaction](/concepts/compaction), [Session pruning](/concepts/session-pruning), [Session management](/concepts/session).

### なぜ "LLM request rejected: messages.content.tool_use.input field required" と表示されるのですか

これは provider の検証エラーです。モデルが、必須の `input` を持たない `tool_use` ブロックを
出力しています。通常はセッション履歴が古い、または破損していることを意味します（長いスレッドや
tool/schema の変更後によく起こります）。

対処方法: `/new` を単独メッセージとして送信し、新しいセッションを開始してください。

### 30 分ごとに heartbeat メッセージが送られてくるのはなぜですか

heartbeat はデフォルトで **30m** ごとに実行されます。調整または無効化するには次を使います。

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "2h", // or "0m" to disable
      },
    },
  },
}
```

`HEARTBEAT.md` が存在していても、実質的に空である場合（空行と `# Heading` のような
Markdown 見出ししかない場合）、OpenClaw は API 呼び出しを節約するために heartbeat の実行を
スキップします。ファイルが存在しない場合でも heartbeat は実行され、モデルが何をするかを判断します。

エージェントごとの上書きには `agents.list[].heartbeat` を使います。Docs: [Heartbeat](/gateway/heartbeat).

### WhatsApp グループに bot アカウントを追加する必要はありますか

いいえ。OpenClaw は **あなた自身のアカウント** で動作するため、あなたがそのグループに参加していれば、
OpenClaw もそれを見ることができます。デフォルトでは、送信者を許可するまでグループ返信はブロックされます
（`groupPolicy: "allowlist"`）。

グループ返信をトリガーできるのを **あなただけ** にしたい場合:

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
}
```

### WhatsApp グループの JID を取得するにはどうすればよいですか

方法 1（最速）: ログを tail しながら、そのグループでテストメッセージを送信します。

```bash
openclaw logs --follow --json
```

`@g.us` で終わる `chatId`（または `from`）を探してください。例:
`1234567890-1234567890@g.us`。

方法 2（すでに設定済み / allowlist 済みの場合）: config からグループ一覧を表示します。

```bash
openclaw directory groups list --channel whatsapp
```

Docs: [WhatsApp](/channels/whatsapp), [Directory](/cli/directory), [Logs](/cli/logs).

### グループで OpenClaw が返信しないのはなぜですか

よくある原因は 2 つあります。

- メンションゲーティングが有効です（デフォルト）。bot を @mention する必要があります（または `mentionPatterns` に一致させる必要があります）。
- `channels.whatsapp.groups` を `"*"` なしで設定しており、そのグループが allowlist に入っていません。

[Groups](/channels/groups) と [Group messages](/channels/group-messages) を参照してください。

### グループ / スレッドは DM とコンテキストを共有しますか

ダイレクトチャットはデフォルトでメインセッションに集約されます。グループ / チャンネルは独自のセッションキーを持ち、
Telegram のトピック / Discord のスレッドは別セッションです。[Groups](/channels/groups) と
[Group messages](/channels/group-messages) を参照してください。

### 作成できる workspace と agent の数はいくつですか

厳密な上限はありません。数十、場合によっては数百でも問題ありませんが、以下には注意してください。

- **Disk growth:** sessions と transcripts は `~/.openclaw/agents/<agentId>/sessions/` に保存されます。
- **Token cost:** agents が増えるほど、同時に使うモデル量も増えます。
- **Ops overhead:** agent ごとの auth profiles、workspaces、channel routing の管理負荷が増えます。

ヒント:

- agent ごとに **active** な workspace を 1 つに保つ（`agents.defaults.workspace`）。
- ディスク使用量が増えたら、古い sessions を prune する（JSONL または store entries を削除する）。
- `openclaw doctor` を使って、孤立した workspaces や profile の不一致を見つける。

### 複数の bot やチャットを同時に実行できますか。Slack ではどう設定すべきですか

はい。**Multi-Agent Routing** を使うことで、複数の独立した agent を実行し、受信メッセージを
channel / account / peer ごとに振り分けられます。Slack は channel としてサポートされており、
特定の agent にバインドできます。

ブラウザアクセスは強力ですが、「人間にできることを何でもできる」という意味ではありません。anti-bot、
CAPTCHAs、MFA は依然として自動化を妨げる可能性があります。最も信頼性の高いブラウザ制御を行うには、
ブラウザを動かすマシン上で Chrome extension relay を使ってください（Gateway はどこに置いても構いません）。

ベストプラクティスの構成:

- 常時稼働する Gateway host（VPS/Mac mini）。
- 役割ごとに 1 つの agent（bindings）。
- それらの agent にバインドされた Slack channel。
- 必要に応じて、extension relay（または node）経由のローカルブラウザ。

Docs: [Multi-Agent Routing](/concepts/multi-agent), [Slack](/channels/slack),
[Browser](/tools/browser), [Chrome extension](/tools/chrome-extension), [Nodes](/nodes).

## Models: デフォルト、選択、aliases、切り替え

### デフォルト model とは何ですか

OpenClaw のデフォルト model は、次に設定したものです。

```
agents.defaults.model.primary
```

Models は `provider/model` として参照されます（例: `anthropic/claude-opus-4-6`）。provider を省略すると、OpenClaw は現在、一時的な非推奨フォールバックとして `anthropic` を仮定しますが、それでも `provider/model` を**明示的に**設定するべきです。

### どの model を推奨しますか

**推奨デフォルト:** あなたの provider stack で利用できる、最新世代で最も強力な model を使ってください。  
**tool が有効な agent や信頼できない入力を扱う agent 向け:** コストよりも model の強さを優先してください。  
**日常的な / 低リスクの chat 向け:** より安価なフォールバック model を使い、agent の役割ごとにルーティングしてください。

MiniMax M2.5 には専用ドキュメントがあります: [MiniMax](/providers/minimax) と
[Local models](/gateway/local-models)。

経験則としては、高リスクな作業には**支払える範囲で最高の model**を使い、日常的な
chat や要約にはより安価な model を使ってください。agent ごとに models をルーティングでき、長いタスクは sub-agent を使って並列化できます（各 sub-agent は token を消費します）。[Models](/concepts/models) と
[Sub-agents](/tools/subagents) を参照してください。

重要な警告: より弱い model や量子化を強くかけた model は、prompt
injection や安全でない動作に対して脆弱です。[Security](/gateway/security) を参照してください。

詳細は [Models](/concepts/models) を参照してください。

### selfhosted models の llamacpp vLLM Ollama は使えますか

はい。ローカル server が OpenAI 互換 API を公開していれば、そこを指す custom provider を設定できます。Ollama は直接サポートされており、最も簡単な方法です。

セキュリティ上の注意: 小規模な model や大幅に量子化された model は、prompt
injection に対してより脆弱です。tools を使える bot には、**大規模な models** を強く推奨します。
それでも小さな models を使いたい場合は、sandboxing と厳格な tool allowlist を有効にしてください。

ドキュメント: [Ollama](/providers/ollama), [Local models](/gateway/local-models),
[Model providers](/concepts/model-providers), [Security](/gateway/security),
[Sandboxing](/gateway/sandboxing)。

### config を消さずに models を切り替えるにはどうすればよいですか

**model commands** を使うか、**model** フィールドだけを編集してください。config 全体の置き換えは避けてください。

安全な方法:

- chat で `/model` を使う（手軽、session ごと）
- `openclaw models set ...`（model config だけを更新）
- `openclaw configure --section model`（interactive）
- `~/.openclaw/openclaw.json` の `agents.defaults.model` を編集

設定全体を置き換えるつもりがない限り、部分オブジェクトで `config.apply` を使うのは避けてください。
もし config を上書きしてしまった場合は、backup から復元するか、`openclaw doctor` を再実行して修復してください。

ドキュメント: [Models](/concepts/models), [Configure](/cli/configure), [Config](/cli/config), [Doctor](/gateway/doctor)。

### OpenClaw、Flawd、Krill は models に何を使っていますか

- これらの deployment はそれぞれ異なる場合があり、時間とともに変わる可能性があります。固定の provider 推奨はありません。
- 各 gateway の現在の runtime 設定は `openclaw models status` で確認してください。
- セキュリティに敏感な / tool が有効な agents には、利用可能な最新世代で最も強力な model を使ってください。

### 再起動せずにその場で models を切り替えるにはどうすればよいですか

`/model` command を単独メッセージとして使ってください。

```
/model sonnet
/model haiku
/model opus
/model gpt
/model gpt-mini
/model gemini
/model gemini-flash
```

利用可能な models は `/model`、`/model list`、または `/model status` で一覧表示できます。

`/model`（および `/model list`）は、コンパクトな番号付き picker を表示します。番号で選択できます。

```
/model 3
```

provider 用の特定の auth profile を強制することもできます（session ごと）。

```
/model opus@anthropic:default
/model opus@anthropic:work
```

ヒント: `/model status` では、どの agent が active か、どの `auth-profiles.json` file が使われているか、次にどの auth profile が試されるかが表示されます。  
また、利用可能な場合は、設定された provider endpoint（`baseUrl`）と API mode（`api`）も表示されます。

**profile 付きで設定した pin を外すにはどうすればよいですか**

`@profile` suffix を**付けずに** `/model` を再実行してください。

```
/model anthropic/claude-opus-4-6
```

デフォルトに戻したい場合は、`/model` からそれを選ぶか、`/model <default provider/model>` を送信してください。
どの auth profile が active かは `/model status` で確認してください。

### 日常作業には GPT 5.2、coding には Codex 5.3 を使えますか

はい。片方をデフォルトに設定し、必要に応じて切り替えてください。

- **手早い切り替え（session ごと）:** 日常作業には `/model gpt-5.2`、Codex OAuth を使った coding には `/model openai-codex/gpt-5.4`。
- **デフォルト + 切り替え:** `agents.defaults.model.primary` を `openai/gpt-5.2` に設定し、coding 時だけ `openai-codex/gpt-5.4` に切り替えます（逆でも構いません）。
- **Sub-agents:** coding タスクを、異なるデフォルト model を持つ sub-agent にルーティングします。

[Models](/concepts/models) と [Slash commands](/tools/slash-commands) を参照してください。

### Model is not allowed と表示され、その後 reply がないのはなぜですか

`agents.defaults.models` が設定されている場合、それは `/model` と
session override に対する **allowlist** になります。その list にない model を選ぶと、次が返されます。

```
Model "provider/model" is not allowed. Use /model to list available models.
```

この error は、通常の reply の**代わりに**返されます。対処法: model を
`agents.defaults.models` に追加する、allowlist を削除する、または `/model list` にある model を選んでください。

### Unknown model minimaxMiniMaxM25 と表示されるのはなぜですか

これは **provider が設定されていない** ことを意味します（MiniMax provider config または auth
profile が見つからなかったため）、その model を解決できません。この検出を修正する対応は
**2026.1.12** に入っています（執筆時点では未リリース）。

修正チェックリスト:

1. **2026.1.12** に upgrade する（または source の `main` から実行する）うえで、gateway を再起動します。
2. MiniMax が設定されていることを確認します（wizard または JSON）、あるいは MiniMax API key が env/auth profiles に存在して provider を注入できるようにします。
3. 正確な model id を使います（大文字小文字を区別します）: `minimax/MiniMax-M2.5` または
   `minimax/MiniMax-M2.5-highspeed`。
4. 次を実行します。

   ```bash
   openclaw models list
   ```

   そして list から選択します（または chat で `/model list` を使います）。

[MiniMax](/providers/minimax) と [Models](/concepts/models) を参照してください。

### デフォルトに MiniMax、複雑なタスクには OpenAI を使えますか

はい。**MiniMax をデフォルト**にし、必要なときだけ **session ごと**に models を切り替えてください。
fallback は **errors** 用であり、「難しいタスク」用ではないため、`/model` か別の agent を使ってください。

**Option A: session ごとに切り替える**

```json5
{
  env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "minimax/MiniMax-M2.5" },
      models: {
        "minimax/MiniMax-M2.5": { alias: "minimax" },
        "openai/gpt-5.2": { alias: "gpt" },
      },
    },
  },
}
```

その後:

```
/model gpt
```

**Option B: 別々の agents**

- Agent A のデフォルト: MiniMax
- Agent B のデフォルト: OpenAI
- agent ごとにルーティングするか、`/agent` を使って切り替える

ドキュメント: [Models](/concepts/models), [Multi-Agent Routing](/concepts/multi-agent), [MiniMax](/providers/minimax), [OpenAI](/providers/openai)。

### opus sonnet gpt は builtin shortcuts ですか

はい。OpenClaw にはいくつかのデフォルト shorthand が含まれています（適用されるのは、その model が `agents.defaults.models` に存在する場合のみです）。

- `opus` → `anthropic/claude-opus-4-6`
- `sonnet` → `anthropic/claude-sonnet-4-6`
- `gpt` → `openai/gpt-5.4`
- `gpt-mini` → `openai/gpt-5-mini`
- `gemini` → `google/gemini-3.1-pro-preview`
- `gemini-flash` → `google/gemini-3-flash-preview`
- `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

同じ名前で独自の alias を設定した場合は、あなたの値が優先されます。

### model shortcuts aliases を定義 / 上書きするにはどうすればよいですか

Aliases は `agents.defaults.models.<modelId>.alias` から取得されます。例:

```json5
{
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-opus-4-6" },
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "anthropic/claude-sonnet-4-5": { alias: "sonnet" },
        "anthropic/claude-haiku-4-5": { alias: "haiku" },
      },
    },
  },
}
```

その後、`/model sonnet`（または対応していれば `/<alias>`）はその model ID に解決されます。

### OpenRouter や ZAI など他の providers の models を追加するにはどうすればよいですか

OpenRouter（従量課金; 多数の models）:

```json5
{
  agents: {
    defaults: {
      model: { primary: "openrouter/anthropic/claude-sonnet-4-5" },
      models: { "openrouter/anthropic/claude-sonnet-4-5": {} },
    },
  },
  env: { OPENROUTER_API_KEY: "sk-or-..." },
}
```

Z.AI（GLM models）:

```json5
{
  agents: {
    defaults: {
      model: { primary: "zai/glm-5" },
      models: { "zai/glm-5": {} },
    },
  },
  env: { ZAI_API_KEY: "..." },
}
```

provider/model を参照していても、必要な provider key が欠けている場合は、runtime auth error が発生します（例: `No API key found for provider "zai"`）。

**新しい agent を追加したあとに No API key found for provider と表示される**

通常、これは**新しい agent**の auth store が空であることを意味します。auth は agent ごとで、
保存先は次のとおりです。

```
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

対処方法:

- `openclaw agents add <id>` を実行し、wizard 中に auth を設定する。
- または、メイン agent の `agentDir` にある `auth-profiles.json` を、新しい agent の `agentDir` にコピーする。

複数の agents で `agentDir` を使い回してはいけません。auth/session の衝突が発生します。

## モデルのフェイルオーバーと「All models failed」

### failover はどのように動作しますか

failover は 2 段階で発生します。

1. 同一 provider 内での **auth profile rotation**。
2. `agents.defaults.model.fallbacks` 内の次のモデルへの **model fallback**。

失敗した profile にはクールダウン（指数バックオフ）が適用されるため、provider が rate limit に達している場合や一時的に失敗している場合でも、OpenClaw は応答を継続できます。

### このエラーは何を意味しますか

```
No credentials found for profile "anthropic:default"
```

これは、システムが auth profile ID `anthropic:default` を使用しようとしたものの、想定される auth store 内でその credentials を見つけられなかったことを意味します。

### No credentials found for profile anthropicdefault の修正チェックリスト

- **auth profiles の保存場所を確認する**（新しいパスか legacy path か）
  - Current: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Legacy: `~/.openclaw/agent/*`（`openclaw doctor` により移行）
- **env var が Gateway に読み込まれていることを確認する**
  - シェルで `ANTHROPIC_API_KEY` を設定していても、Gateway を systemd/launchd 経由で実行している場合は継承されないことがあります。`~/.openclaw/.env` に配置するか、`env.shellEnv` を有効にしてください。
- **正しい agent を編集していることを確認する**
  - multi-agent 構成では、`auth-profiles.json` が複数存在する場合があります。
- **model/auth の状態を簡易確認する**
  - `openclaw models status` を使うと、設定済みモデルと provider が認証済みかどうかを確認できます。

**No credentials found for profile anthropic の修正チェックリスト**

これは、その実行が Anthropic の auth profile に固定されている一方で、Gateway が auth store 内でそれを見つけられないことを意味します。

- **setup-token を使用する**
  - `claude setup-token` を実行し、その後 `openclaw models auth setup-token --provider anthropic` で貼り付けてください。
  - その token を別のマシンで作成した場合は、`openclaw models auth paste-token --provider anthropic` を使ってください。
- **代わりに API key を使いたい場合**
  - **gateway host** 上の `~/.openclaw/.env` に `ANTHROPIC_API_KEY` を設定してください。
  - 存在しない profile を強制する pinned order を解除してください。

    ```bash
    openclaw models auth order clear --provider anthropic
    ```

- **gateway host 上でコマンドを実行していることを確認する**
  - remote mode では、auth profiles は手元の laptop ではなく gateway machine 上に保存されます。

### なぜ Google Gemini も試行され、失敗したのですか

model 設定に Google Gemini が fallback として含まれている場合（または Gemini の shorthand に切り替えた場合）、OpenClaw は model fallback 中にそれを試行します。Google の credentials を設定していない場合は、`No API key found for provider "google"` が表示されます。

修正方法: Google auth を設定するか、fallback がそちらへルーティングされないように、`agents.defaults.model.fallbacks` / aliases から Google モデルを削除するか使用を避けてください。

**LLM request rejected message thinking signature required google antigravity**

原因: セッション履歴に **署名のない thinking blocks** が含まれています（中断されたストリームや不完全なストリームでよく発生します）。Google Antigravity では、thinking blocks に署名が必要です。

修正方法: OpenClaw は現在、Google Antigravity Claude 向けに署名のない thinking blocks を取り除きます。それでも発生する場合は、**新しいセッション** を開始するか、その agent で `/thinking off` を設定してください。

## Auth profiles: 概要と管理方法

関連: [/concepts/oauth](/concepts/oauth)（OAuth フロー、トークン保存、マルチアカウントのパターン）

### auth profile とは

auth profile は、provider に紐づいた名前付きの認証情報レコード（OAuth または API key）です。profile は次の場所に保存されます。

```
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

### 一般的な profile ID は何ですか

OpenClaw では、次のような provider 接頭辞付き ID を使用します。

- `anthropic:default`（メール identity が存在しない場合によく使われます）
- OAuth identity 用の `anthropic:<email>`
- 自分で選択するカスタム ID（例: `anthropic:work`）

### 最初に試行される auth profile を制御できますか

はい。config では、profile 用の任意メタデータと、provider ごとの順序（`auth.order.<provider>`）をサポートしています。これはシークレットを保存するものではなく、ID を provider / mode に対応付け、ローテーション順を設定するものです。

OpenClaw は、その profile が短時間の **cooldown** 状態（レート制限、タイムアウト、認証失敗）または長めの **disabled** 状態（請求、クレジット不足）にある場合、一時的にその profile をスキップすることがあります。これを確認するには、`openclaw models status --json` を実行し、`auth.unusableProfiles` を確認してください。調整項目: `auth.cooldowns.billingBackoffHours*`。

CLI を使うと、**agent 単位** の順序 override（その agent の `auth-profiles.json` に保存されます）も設定できます。

```bash
# 設定済みのデフォルト agent を対象にします（--agent を省略）
openclaw models auth order get --provider anthropic

# ローテーションを 1 つの profile に固定します（これだけを試行）
openclaw models auth order set --provider anthropic anthropic:default

# または明示的な順序を設定します（provider 内で fallback）
openclaw models auth order set --provider anthropic anthropic:work anthropic:default

# override をクリアします（config の auth.order / round-robin にフォールバック）
openclaw models auth order clear --provider anthropic
```

特定の agent を対象にする場合:

```bash
openclaw models auth order set --provider anthropic --agent main anthropic:default
```

### OAuth と API key の違いは何ですか

OpenClaw は両方をサポートしています。

- **OAuth** は、適用可能な場合、サブスクリプションのアクセスを活用することがよくあります。
- **API keys** は、トークン単位課金を使用します。

wizard は、Anthropic setup-token と OpenAI Codex OAuth を明示的にサポートしており、API keys も保存できます。

## Gateway: ポート、「already running」、および remote mode

### Gateway はどのポートを使用しますか

`gateway.port` は、WebSocket + HTTP（Control UI、hooks など）用の単一の多重化ポートを制御します。

優先順位:

```
--port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
```

### `openclaw gateway status` で Runtime running と表示されるのに RPC probe failed になるのはなぜですか

これは「running」が **supervisor**（launchd/systemd/schtasks）から見た状態だからです。RPC probe は、CLI が実際に Gateway の WebSocket に接続して `status` を呼び出していることを意味します。

`openclaw gateway status` を使い、次の行を信頼してください:

- `Probe target:`（probe が実際に使用した URL）
- `Listening:`（そのポートで実際に bind されているもの）
- `Last gateway error:`（プロセスは生きているのにポートが listen していない場合によくある根本原因）

### `openclaw gateway status` で Config cli と Config service が異なって表示されるのはなぜですか

一方の設定ファイルを編集している一方で、service は別の設定ファイルを使って実行されています（多くは `--profile` / `OPENCLAW_STATE_DIR` の不一致です）。

対処:

```bash
openclaw gateway install --force
```

service に使わせたいものと同じ `--profile` / environment でこれを実行してください。

### another gateway instance is already listening とは何を意味しますか

OpenClaw は、起動直後に WebSocket listener（デフォルトは `ws://127.0.0.1:18789`）を bind することで runtime lock を強制します。`EADDRINUSE` で bind に失敗すると、別の instance がすでに listen していることを示す `GatewayLockError` を送出します。

対処: 別の instance を停止する、ポートを解放する、または `openclaw gateway --port <port>` で実行してください。

### OpenClaw を remote mode で実行し、client を別の Gateway に接続するにはどうすればよいですか

`gateway.mode: "remote"` を設定し、必要に応じて token/password を付けた remote WebSocket URL を指定してください:

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      url: "ws://gateway.tailnet:18789",
      token: "your-token",
      password: "your-password",
    },
  },
}
```

補足:

- `openclaw gateway` が起動するのは、`gateway.mode` が `local` の場合だけです（または override flag を渡した場合）。
- macOS app は設定ファイルを監視しており、これらの値が変わると live で mode を切り替えます。

### Control UI で unauthorized と表示される、または再接続を繰り返します。どうすればよいですか

Gateway が auth 有効（`gateway.auth.*`）で動作していますが、UI が一致する token/password を送信していません。

事実（コードより）:

- Control UI は token を、現在の browser tab session と選択中の Gateway URL に対して `sessionStorage` に保持します。そのため、同じ tab 内での refresh は引き続き動作しますが、長期保持のための `localStorage` token persistence は復元しません。

対処:

- 最速: `openclaw dashboard`（dashboard URL を表示してコピーし、開こうとします。headless なら SSH のヒントを表示します）。
- まだ token がない場合: `openclaw doctor --generate-gateway-token`。
- remote の場合は先に tunnel を張ります: `ssh -N -L 18789:127.0.0.1:18789 user@host` を実行してから `http://127.0.0.1:18789/` を開いてください。
- Gateway host 側で `gateway.auth.token`（または `OPENCLAW_GATEWAY_TOKEN`）を設定してください。
- Control UI の設定に、同じ token を貼り付けてください。
- まだ解決しない場合は、`openclaw status --all` を実行し、[Troubleshooting](/gateway/troubleshooting) に従ってください。auth の詳細は [Dashboard](/web/dashboard) を参照してください。

### `gatewaybind` を `tailnet` に設定したのに bind できず、何も listen しません

`tailnet` bind は、network interface から Tailscale IP（100.64.0.0/10）を選びます。マシンが Tailscale に参加していない場合（または interface が down の場合）、bind 対象がありません。

対処:

- その host で Tailscale を起動する（100.x の address を持たせる）、または
- `gateway.bind: "loopback"` / `"lan"` に切り替えてください。

注意: `tailnet` は明示指定です。`auto` は loopback を優先します。tailnet 専用の bind を行いたい場合は `gateway.bind: "tailnet"` を使用してください。

### 同じ host 上で複数の Gateway を実行できますか

通常はできません。1 つの Gateway で複数の messaging channel と agent を実行できます。複数の Gateway が必要なのは、冗長化（例: rescue bot）または厳格な分離が必要な場合だけです。

ただし、次を分離すれば実行できます:

- `OPENCLAW_CONFIG_PATH`（instance ごとの config）
- `OPENCLAW_STATE_DIR`（instance ごとの state）
- `agents.defaults.workspace`（workspace の分離）
- `gateway.port`（一意なポート）

クイックセットアップ（推奨）:

- instance ごとに `openclaw --profile <name> …` を使ってください（`~/.openclaw-<name>` が自動作成されます）。
- 各 profile config で一意の `gateway.port` を設定してください（または手動実行時に `--port` を渡してください）。
- profile ごとの service を install してください: `openclaw --profile <name> gateway install`。

profile は service 名にも suffix を付けます（`ai.openclaw.<profile>`、legacy の `com.openclaw.*`、`openclaw-gateway-<profile>.service`、`OpenClaw Gateway (<profile>)`）。
完全なガイド: [Multiple gateways](/gateway/multiple-gateways)。

### invalid handshake code 1008 とは何を意味しますか

Gateway は **WebSocket server** であり、最初のメッセージとして
`connect` frame が送られてくることを前提としています。それ以外を受信すると、
接続を **code 1008**（policy violation）で閉じます。

よくある原因:

- **HTTP** URL（`http://...`）を browser で開いてしまい、WS client を使っていない。
- port または path が間違っている。
- proxy または tunnel が auth header を削除したか、Gateway ではない request を送っている。

クイックフィックス:

1. WS URL を使ってください: `ws://<host>:18789`（HTTPS の場合は `wss://...`）。
2. WS port を通常の browser tab で開かないでください。
3. auth が有効なら、`connect` frame に token/password を含めてください。

CLI または TUI を使っている場合、URL は次のようになります:

```
openclaw tui --url ws://<host>:18789 --token <token>
```

protocol の詳細: [Gateway protocol](/gateway/protocol)。

## ログとデバッグ

### ログはどこにありますか

ファイルログ（構造化）:

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

`logging.file` で固定パスを設定できます。ファイルログレベルは `logging.level` で制御します。コンソールの詳細度は `--verbose` と `logging.consoleLevel` で制御します。

最速でログを追う方法:

```bash
openclaw logs --follow
```

サービス/スーパーバイザログ（Gateway を launchd/systemd 経由で実行している場合）:

- macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` と `gateway.err.log`（既定: `~/.openclaw/logs/...`。プロファイル使用時は `~/.openclaw-<profile>/logs/...`）
- Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
- Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

詳細は [Troubleshooting](/gateway/troubleshooting#log-locations) を参照してください。

### Gateway サービスを開始/停止/再起動するには

Gateway ヘルパーを使用します:

```bash
openclaw gateway status
openclaw gateway restart
```

Gateway を手動で実行している場合は、`openclaw gateway --force` でポートを再取得できます。詳細は [Gateway](/gateway) を参照してください。

### Windows でターミナルを閉じてしまった場合 OpenClaw を再起動するには

Windows には **2 つのインストールモード** があります。

**1) WSL2（推奨）:** Gateway は Linux 内で動作します。

PowerShell を開き、WSL に入ってから再起動します:

```powershell
wsl
openclaw gateway status
openclaw gateway restart
```

サービスをまだインストールしていない場合は、フォアグラウンドで起動します:

```bash
openclaw gateway run
```

**2) ネイティブ Windows（非推奨）:** Gateway は Windows 上で直接動作します。

PowerShell を開いて次を実行します:

```powershell
openclaw gateway status
openclaw gateway restart
```

手動実行している場合（サービスなし）は、次を使用します:

```powershell
openclaw gateway run
```

ドキュメント: [Windows (WSL2)](/platforms/windows), [Gateway service runbook](/gateway).

### Gateway は起動しているのに返信が届かない場合 何を確認すべきですか

まずは簡易ヘルスチェックを実行してください:

```bash
openclaw status
openclaw models status
openclaw channels status
openclaw logs --follow
```

よくある原因:

- モデル認証情報が **Gateway ホスト** に読み込まれていない（`models status` を確認）。
- Channel のペアリング/許可リストにより返信がブロックされている（Channel 設定とログを確認）。
- WebChat/Dashboard が正しいトークンなしで開かれている。

リモート環境の場合は、トンネル/Tailscale 接続が有効であり、
Gateway の WebSocket に到達できることを確認してください。

ドキュメント: [Channels](/channels), [Troubleshooting](/gateway/troubleshooting), [Remote access](/gateway/remote).

### gateway から理由なく切断された場合はどうすればよいですか

通常は、UI が WebSocket 接続を失ったことを意味します。次を確認してください:

1. Gateway は動作していますか。`openclaw gateway status`
2. Gateway は健全ですか。`openclaw status`
3. UI は正しいトークンを使用していますか。`openclaw dashboard`
4. リモート環境の場合、トンネル/Tailscale 接続は有効ですか。

その後、ログを追ってください:

```bash
openclaw logs --follow
```

ドキュメント: [Dashboard](/web/dashboard), [Remote access](/gateway/remote), [Troubleshooting](/gateway/troubleshooting).

### Telegram の setMyCommands がネットワークエラーで失敗する場合 何を確認すべきですか

まずはログと Channel ステータスを確認してください:

```bash
openclaw channels status
openclaw channels logs --channel telegram
```

VPS 上またはプロキシ配下で動かしている場合は、外向き HTTPS が許可され、DNS が機能していることを確認してください。
Gateway がリモートにある場合は、Gateway ホスト上のログを見ていることを確認してください。

ドキュメント: [Telegram](/channels/telegram), [Channel troubleshooting](/channels/troubleshooting).

### TUI に何も表示されない場合 何を確認すべきですか

まず、Gateway に到達でき、エージェントが実行可能であることを確認してください:

```bash
openclaw status
openclaw models status
openclaw logs --follow
```

TUI では、現在の状態を確認するために `/status` を使用します。チャット
Channel での返信を期待している場合は、配信が有効になっていることを確認してください（`/deliver on`）。

ドキュメント: [TUI](/web/tui), [Slash commands](/tools/slash-commands).

### Gateway を完全に停止してから再起動するには

サービスをインストールしている場合:

```bash
openclaw gateway stop
openclaw gateway start
```

これにより **監視対象サービス**（macOS では launchd、Linux では systemd）を停止/開始します。
Gateway がバックグラウンドでデーモンとして動作している場合に使用してください。

フォアグラウンドで実行している場合は、Ctrl-C で停止してから次を実行します:

```bash
openclaw gateway run
```

ドキュメント: [Gateway service runbook](/gateway).

### ELI5 openclaw gateway restart と openclaw gateway の違い

- `openclaw gateway restart`: **バックグラウンドサービス**（launchd/systemd）を再起動します。
- `openclaw gateway`: このターミナルセッションで gateway を **フォアグラウンド** 実行します。

サービスをインストールしている場合は、gateway コマンドを使用してください。一時的にフォアグラウンドで実行したい場合は `openclaw gateway` を使用します。

### 何かが失敗したときに最速で詳細を取得する方法は何ですか

コンソールの詳細を増やすには、`--verbose` を付けて Gateway を起動します。その後、Channel 認証、モデルルーティング、RPC エラーを確認するためにログファイルを調べてください。

## メディアと添付ファイル

### My Skills generated an imagePDF but nothing was sent

エージェントからの送信添付ファイルには、`MEDIA:<path-or-url>` 行を含める必要があります（その行だけで 1 行にしてください）。[OpenClaw assistant setup](/start/openclaw) と [Agent send](/tools/agent-send) を参照してください。

CLI での送信:

```bash
openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
```

以下も確認してください:

- 対象チャネルが送信メディアに対応しており、allowlist によってブロックされていないこと。
- ファイルがプロバイダーのサイズ上限内であること（画像は最大 2048px にリサイズされます）。

[Images](/nodes/images) も参照してください。

## セキュリティとアクセス制御

### OpenClaw を受信 DM に公開しても安全ですか

受信 DM は信頼できない入力として扱ってください。デフォルト設定は、リスクを減らすように設計されています。

- DM 対応チャネルでのデフォルト動作は **pairing** です:
  - 未知の送信者には pairing code が送られ、bot はそのメッセージを処理しません。
  - 承認コマンド: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
  - 保留中のリクエストは **チャネルごとに 3 件** までです。code が届いていない場合は `openclaw pairing list --channel <channel> [--account <id>]` を確認してください。
- DM を公開で開放するには、明示的な opt-in が必要です (`dmPolicy: "open"` と allowlist `"*"`）。

危険な DM ポリシーを検出するには `openclaw doctor` を実行してください。

### prompt injection は公開 bot だけの懸念ですか

いいえ。prompt injection は、bot に DM を送れる相手だけではなく、**信頼できないコンテンツ** の問題です。
アシスタントが外部コンテンツ（web search/fetch、browser のページ、email、
docs、attachments、貼り付けられた logs）を読む場合、そのコンテンツには
モデルを乗っ取ろうとする命令が含まれている可能性があります。これは
**送信者があなただけである場合でも** 起こり得ます。

最大のリスクは tools が有効なときです。モデルがだまされて
コンテキストを漏えいさせたり、あなたに代わって tools を呼び出したりする可能性があります。影響範囲を抑えるには、次の対策を取ってください。

- 信頼できないコンテンツの要約には、read-only または tool-disabled の "reader" agent を使う
- tool-enabled agent では `web_search` / `web_fetch` / `browser` を無効にしておく
- sandboxing と厳格な tool allowlist を使う

詳細: [Security](/gateway/security)。

### bot 専用の email、GitHub account、または phone number を持たせるべきですか

はい。ほとんどの構成では、その方が望ましいです。bot を別の account や phone number で分離すると、
問題が起きた場合の blast radius を小さくできます。また、個人の account に影響を与えずに
credentials のローテーションや access の revoke をしやすくなります。

最初は小さく始めてください。本当に必要な tools と accounts にだけ access を与え、必要に応じて
後から拡張してください。

ドキュメント: [Security](/gateway/security), [Pairing](/channels/pairing)。

### 自分の text messages に対する自律性を与えてもよいですか またそれは安全ですか

個人のメッセージに対して完全な自律性を与えることは**推奨しません**。最も安全なパターンは次のとおりです。

- DM は **pairing mode** または厳格な allowlist のままにする。
- あなたの代わりにメッセージを送らせたい場合は、**別の number または account** を使う。
- 下書きを作らせ、**送信前に承認する**。

試す場合は、専用 account で行い、分離を保ってください。詳細は
[Security](/gateway/security) を参照してください。

### 個人アシスタント用途では、より安価な model を使えますか

はい。**ただし**、agent が chat-only で、入力が信頼できる場合に限ります。小さい tier は
instruction hijacking の影響を受けやすいため、tool-enabled agent や
信頼できないコンテンツを読む用途には避けてください。どうしても小さい model を使う必要があるなら、
tools を厳格に制限し、sandbox 内で実行してください。詳細は [Security](/gateway/security) を参照してください。

### Telegram で start を実行したのに pairing code が届きません

pairing code が送られるのは、未知の送信者が bot にメッセージを送り、
かつ `dmPolicy: "pairing"` が有効な場合**のみ**です。`/start` だけでは code は生成されません。

保留中のリクエストを確認してください:

```bash
openclaw pairing list telegram
```

すぐに access が必要な場合は、その送信者 id を allowlist に追加するか、その account で `dmPolicy: "open"` を設定してください。

### WhatsApp で連絡先にメッセージを送りますか Pairing はどのように機能しますか

いいえ。WhatsApp のデフォルト DM ポリシーは **pairing** です。未知の送信者には pairing code だけが送られ、
そのメッセージは**処理されません**。OpenClaw が返信するのは、受信した chats に対して、またはあなたが明示的にトリガーした sends に対してのみです。

pairing の承認:

```bash
openclaw pairing approve whatsapp <code>
```

保留中のリクエスト一覧:

```bash
openclaw pairing list whatsapp
```

Wizard の phone number prompt は、あなた自身の DM を許可するための **allowlist/owner** を設定するために使われます。自動送信のためのものではありません。個人の WhatsApp number で運用する場合は、その number を使い、`channels.whatsapp.selfChatMode` を有効にしてください。

## チャットコマンド、タスクの中断、「止まらない」場合

### チャットに内部システムメッセージが表示されないようにするには

内部メッセージやツールメッセージの多くは、そのセッションで **verbose** または **reasoning** が有効になっている場合にのみ表示されます。

表示されているチャットで、次を実行してください:

```
/verbose off
/reasoning off
```

それでもまだ表示が多い場合は、Control UI のセッション設定を確認し、verbose を **inherit** に設定してください。あわせて、config で `verboseDefault` が `on` に設定された bot プロファイルを使用していないことも確認してください。

ドキュメント: [Thinking and verbose](/tools/thinking), [Security](/gateway/security#reasoning--verbose-output-in-groups)。

### 実行中のタスクを停止または中断するには

以下のいずれかを **単独のメッセージとして** 送信してください（スラッシュ不要）:

```
stop
stop action
stop current action
stop run
stop current run
stop agent
stop the agent
stop openclaw
openclaw stop
stop don't do anything
stop do not do anything
stop doing anything
please stop
stop please
abort
esc
wait
exit
interrupt
```

これらは中断トリガーであり、スラッシュコマンドではありません。

バックグラウンドプロセス（exec ツール由来）については、エージェントに次を実行するよう依頼できます:

```
process action:kill sessionId:XXX
```

スラッシュコマンドの概要は [Slash commands](/tools/slash-commands) を参照してください。

ほとんどのコマンドは `/` で始まる **単独のメッセージ** として送信する必要がありますが、いくつかのショートカット（`/status` など）は allowlist に登録された送信者であれば文中でも動作します。

### Telegram から Discord にメッセージを送ろうとすると Crosscontext messaging denied になるのはなぜですか

OpenClaw はデフォルトで **cross-provider** メッセージングをブロックします。ツール呼び出しが Telegram に紐付いている場合、明示的に許可しない限り Discord には送信されません。

エージェントで cross-provider メッセージングを有効にしてください:

```json5
{
  agents: {
    defaults: {
      tools: {
        message: {
          crossContext: {
            allowAcrossProviders: true,
            marker: { enabled: true, prefix: "[from {channel}] " },
          },
        },
      },
    },
  },
}
```

config を編集したら Gateway を再起動してください。これを単一のエージェントにだけ適用したい場合は、代わりに `agents.list[].tools.message` の下で設定してください。

### メッセージを連投すると bot が無視しているように感じるのはなぜですか

Queue mode は、新しいメッセージが実行中の run とどう相互作用するかを制御します。モードを変更するには `/queue` を使用してください:

- `steer` - 新しいメッセージが現在のタスクを誘導し直します
- `followup` - メッセージを 1 件ずつ順番に実行します
- `collect` - メッセージをまとめて 1 回だけ返信します（デフォルト）
- `steer-backlog` - 今のタスクを誘導し直したうえで、あとから backlog を処理します
- `interrupt` - 現在の run を中断して新しく開始します

followup 系モードには `debounce:2s cap:25 drop:summarize` のようなオプションも追加できます。

## スクリーンショット/チャットログの正確な質問に答える

**Q: "What's the default model for Anthropic with an API key?"**

**A:** OpenClaw では、認証情報とモデル選択は別です。`ANTHROPIC_API_KEY` を設定する（または auth profiles に Anthropic API key を保存する）と認証は有効になりますが、実際のデフォルトモデルは `agents.defaults.model.primary` に設定したものです（たとえば `anthropic/claude-sonnet-4-5` や `anthropic/claude-opus-4-6`）。`No credentials found for profile "anthropic:default"` と表示される場合は、実行中の agent に対して Gateway が想定された `auth-profiles.json` から Anthropic の認証情報を見つけられなかったことを意味します。

---

まだ解決しない場合は、[Discord](https://discord.com/invite/clawd) で質問するか、[GitHub discussion](https://github.com/openclaw/openclaw/discussions) を開いてください。
