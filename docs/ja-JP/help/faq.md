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

- [問題が起きたときの最初の 60 秒](#first-60-seconds-if-somethings-broken)
- [クイックスタートと初回セットアップ](#quick-start-and-first-run-setup)
  - [行き詰まったとき、最速で抜け出す方法は？](#im-stuck-whats-the-fastest-way-to-get-unstuck)
  - [OpenClaw をインストールしてセットアップする推奨方法は？](#whats-the-recommended-way-to-install-and-set-up-openclaw)
  - [オンボーディング後にダッシュボードを開くには？](#how-do-i-open-the-dashboard-after-onboarding)
  - [localhost とリモートでダッシュボードトークンを認証する方法は？](#how-do-i-authenticate-the-dashboard-token-on-localhost-vs-remote)
  - [必要なランタイムは？](#what-runtime-do-i-need)
  - [Raspberry Pi で動きますか？](#does-it-run-on-raspberry-pi)
  - [Raspberry Pi へのインストールでコツはありますか？](#any-tips-for-raspberry-pi-installs)
  - [オンボーディングで "wake up my friend" の画面から進まず hatch しません。どうすればいいですか？](#it-is-stuck-on-wake-up-my-friend-onboarding-will-not-hatch-what-now)
  - [新しいマシン（Mac mini など）へ、オンボーディングをやり直さずにセットアップを移行できますか？](#can-i-migrate-my-setup-to-a-new-machine-mac-mini-without-redoing-onboarding)
  - [最新バージョンの変更点はどこで確認できますか？](#where-do-i-see-what-is-new-in-the-latest-version)
  - [`docs.openclaw.ai` にアクセスできず SSL error が出ます。どうすればいいですか？](#i-cant-access-docs-openclaw-ai-ssl-error-what-now)
  - [stable と beta の違いは何ですか？](#whats-the-difference-between-stable-and-beta)
  - [beta 版のインストール方法と、beta と dev の違いは？](#how-do-i-install-the-beta-version-and-whats-the-difference-between-beta-and-dev)
  - [インストールとオンボーディングには通常どれくらい時間がかかりますか？](#how-long-does-install-and-onboarding-usually-take)
  - [最新版を試すには？](#how-do-i-try-the-latest-bits)
  - [インストーラーが止まる。もっと詳しいフィードバックを得るには？](#installer-stuck-how-do-i-get-more-feedback)
  - [Windows インストールで `git not found` や `openclaw not recognized` と表示されます](#windows-install-says-git-not-found-or-openclaw-not-recognized)
  - [Windows の exec 出力で中国語が文字化けします。どうすればいいですか？](#windows-exec-output-shows-garbled-chinese-text-what-should-i-do)
  - [ドキュメントで答えが見つからなかった場合、より良い答えを得るには？](#the-docs-didnt-answer-my-question-how-do-i-get-a-better-answer)
  - [Linux に OpenClaw をインストールするには？](#how-do-i-install-openclaw-on-linux)
  - [VPS に OpenClaw をインストールするには？](#how-do-i-install-openclaw-on-a-vps)
  - [クラウド/VPS のインストールガイドはどこにありますか？](#where-are-the-cloudvps-install-guides)
  - [OpenClaw に自分自身を更新させることはできますか？](#can-i-ask-openclaw-to-update-itself)
  - [オンボーディングウィザードは実際には何をしているのですか？](#what-does-the-onboarding-wizard-actually-do)
  - [実行するのに Claude や OpenAI のサブスクリプションは必要ですか？](#do-i-need-a-claude-or-openai-subscription-to-run-this)
  - [API キーなしで Claude Max サブスクリプションを使えますか？](#can-i-use-claude-max-subscription-without-an-api-key)
  - [Anthropic の setup-token 認証はどのように動きますか？](#how-does-anthropic-setuptoken-auth-work)
  - [Anthropic の setup-トークンはどこで取得できますか？](#where-do-i-find-an-anthropic-setuptoken)
  - [Claude サブスクリプション認証（Claude Pro または Max）はサポートしていますか？](#do-you-support-claude-subscription-auth-claude-pro-or-max)
  - [Anthropic から HTTP 429 `ratelimiterror` が出るのはなぜですか？](#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)
  - [AWS Bedrock はサポートされていますか？](#is-aws-bedrock-supported)
  - [Codex 認証はどのように動きますか？](#how-does-codex-auth-work)
  - [OpenAI サブスクリプション認証の Codex OAuth はサポートしていますか？](#do-you-support-openai-subscription-auth-codex-oauth)
  - [Gemini CLI OAuth はどのように設定しますか？](#how-do-i-set-up-gemini-cli-oauth)
  - [気軽なチャット用途ならローカルモデルでも大丈夫ですか？](#is-a-local-model-ok-for-casual-chats)
  - [ホスト型モデルのトラフィックを特定リージョン内に保つには？](#how-do-i-keep-hosted-model-traffic-in-a-specific-region)
  - [これをインストールするには Mac Mini を買う必要がありますか？](#do-i-have-to-buy-a-mac-mini-to-install-this)
  - [iMessage サポートには Mac mini が必要ですか？](#do-i-need-a-mac-mini-for-imessage-support)
  - [OpenClaw 用に Mac mini を買った場合、MacBook Pro と接続できますか？](#if-i-buy-a-mac-mini-to-run-openclaw-can-i-connect-it-to-my-macbook-pro)
  - [Bun は使えますか？](#can-i-use-bun)
  - [Telegram の `allowFrom` には何を入れればいいですか？](#telegram-what-goes-in-allowfrom)
  - [1 つの WhatsApp 番号を、複数の OpenClaw インスタンスで別々に使えますか？](#can-multiple-people-use-one-whatsapp-number-with-different-openclaw-instances)
  - [高速なチャット用エージェントと、コーディング用の Opus エージェントを分けて動かせますか？](#can-i-run-a-fast-chat-agent-and-an-opus-for-coding-agent)
  - [Linux で Homebrew は使えますか？](#does-homebrew-work-on-linux)
  - [hackable git インストールと npm インストールの違いは何ですか？](#whats-the-difference-between-the-hackable-git-install-and-npm-install)
  - [後から npm インストールと git インストールを切り替えられますか？](#can-i-switch-between-npm-and-git-installs-later)
  - [ゲートウェイはラップトップと VPS のどちらで動かすべきですか？](#should-i-run-the-gateway-on-my-laptop-or-a-vps)
  - [OpenClaw を専用マシンで動かす重要性はどれくらいですか？](#how-important-is-it-to-run-openclaw-on-a-dedicated-machine)
  - [VPS の最小要件と推奨 OS は？](#what-are-the-minimum-vps-requirements-and-recommended-os)
  - [VM 上で OpenClaw を動かせますか？要件は？](#can-i-run-openclaw-in-a-vm-and-what-are-the-requirements)
- [OpenClaw とは何ですか？](#what-is-openclaw)
  - [OpenClaw を 1 段落で説明すると](#what-is-openclaw-in-one-paragraph)
  - [価値提案は何ですか](#whats-the-value-proposition)
  - [セットアップした直後にまず何をすればよいですか](#i-just-set-it-up-what-should-i-do-first)
  - [OpenClaw の日常的なユースケース上位 5 つは何ですか](#what-are-the-top-five-everyday-use-cases-for-openclaw)
  - [OpenClaw は SaaS 向けのリード獲得、アウトリーチ、広告、ブログに役立ちますか](#can-openclaw-help-with-lead-gen-outreach-ads-and-blogs-for-a-saas)
  - [Web 開発において Claude Code と比べた利点は何ですか](#what-are-the-advantages-vs-claude-code-for-web-development)
- [スキルと自動化](#skills-and-automation)
  - [リポジトリを汚さずにスキルをカスタマイズするには](#how-do-i-customize-skills-without-keeping-the-repo-dirty)
  - [カスタムフォルダからスキルを読み込めますか](#can-i-load-skills-from-a-custom-folder)
  - [タスクごとに異なるモデルを使い分けるには](#how-can-i-use-different-models-for-different-tasks)
  - [重い処理をしている間にボットが固まりますどうやってオフロードすればいいですか](#the-bot-freezes-while-doing-heavy-work-how-do-i-offload-that)
  - [Discord でスレッドに紐づくサブエージェントセッションはどのように動作しますか](#how-do-thread-bound-subagent-sessions-work-on-discord)
  - [Cron やリマインダーが発火しません何を確認すべきですか](#cron-or-reminders-do-not-fire-what-should-i-check)
  - [Linux でスキルをインストールするには](#how-do-i-install-skills-on-linux)
  - [OpenClaw はスケジュール実行やバックグラウンドでの継続実行ができますか](#can-openclaw-run-tasks-on-a-schedule-or-continuously-in-the-background)
  - [Linux から Apple の macOS 専用スキルを実行できますか](#can-i-run-apple-macos-only-skills-from-linux)
  - [Notion や HeyGen との連携はありますか](#do-you-have-a-notion-or-heygen-integration)
  - [ブラウザ乗っ取り用の Chrome extension をインストールするには](#how-do-i-install-the-chrome-extension-for-browser-takeover)
- [サンドボックスとメモリ](#sandboxing-and-memory)
  - [専用のサンドボックス化ドキュメントはありますか](#is-there-a-dedicated-sandboxing-doc)
  - [Docker には制限があるように感じます完全な機能を有効にするにはどうすればよいですか](#docker-feels-limited-how-do-i-enable-full-features)
  - [ホストのフォルダをサンドボックスにバインドするにはどうすればよいですか](#how-do-i-bind-a-host-folder-into-the-sandbox)
  - [メモリはどのように動作しますか](#how-does-memory-work)
  - [メモリがすぐに忘れます定着させるにはどうすればよいですか](#memory-keeps-forgetting-things-how-do-i-make-it-stick)
  - [セマンティックメモリ検索には OpenAI API キーが必要ですか](#does-semantic-memory-search-require-an-openai-api-key)
  - [メモリはずっと保持されますか制限はありますか](#does-memory-persist-forever-what-are-the-limits)
- [データはディスク上のどこに存在しますか](#where-things-live-on-disk)
  - [OpenClaw で使われるデータはすべてローカルに保存されますか](#is-all-data-used-with-openclaw-saved-locally)
  - [OpenClaw はどこにデータを保存しますか](#where-does-openclaw-store-its-data)
  - [AGENTS.md SOUL.md USER.md MEMORY.md はどこに置くべきですか](#where-should-agentsmd-soulmd-usermd-memorymd-live)
  - [推奨されるバックアップ戦略は何ですか](#whats-the-recommended-backup-strategy)
  - [OpenClaw を完全にアンインストールするにはどうすればよいですか](#how-do-i-completely-uninstall-openclaw)
  - [エージェントはワークスペースの外側でも動作できますか](#can-agents-work-outside-the-workspace)
  - [リモートモードではセッションストアはどこにありますか](#im-in-remote-mode-where-is-the-session-store)
- [設定の基本](#config-basics)
  - [設定ファイルの形式と場所は何ですか](#what-format-is-the-config-where-is-it)
  - [`gateway.bind` を `lan` または `tailnet` に設定したら何も待ち受けず、UI に `unauthorized` と表示されます](#i-set-gatewaybind-lan-or-tailnet-and-now-nothing-listens-the-ui-says-unauthorized)
  - [localhost でも トークンが必要になったのはなぜですか](#why-do-i-need-a-token-on-localhost-now)
  - [設定変更後に再起動は必要ですか](#do-i-have-to-restart-after-changing-config)
  - [CLI の面白いタグラインを無効にするにはどうすればよいですか](#how-do-i-disable-funny-cli-taglines)
  - [web search と web fetch を有効にするにはどうすればよいですか](#how-do-i-enable-web-search-and-web-fetch)
  - [複数デバイスにまたがって、専用ワーカーを備えた中央ゲートウェイを実行するにはどうすればよいですか](#how-do-i-run-a-central-gateway-with-specialized-workers-across-devices)
  - [OpenClaw ブラウザはヘッドレスで実行できますか](#can-the-openclaw-browser-run-headless)
  - [ブラウザ制御に Brave を使うにはどうすればよいですか](#how-do-i-use-brave-for-browser-control)
- [リモートゲートウェイとノード](#remote-gateways-and-nodes)
  - [Telegram、ゲートウェイ、ノードの間でコマンドはどのように伝播しますか](#how-do-commands-propagate-between-telegram-the-gateway-and-nodes)
  - [ゲートウェイがリモートでホストされている場合、エージェントから自分のコンピュータにアクセスするにはどうすればよいですか](#how-can-my-agent-access-my-computer-if-the-gateway-is-hosted-remotely)
  - [Tailscale は接続済みなのに返信が来ません。どうすればよいですか](#tailscale-is-connected-but-i-get-no-replies-what-now)
  - [ローカル環境と VPS 上の 2 つの OpenClaw インスタンスを相互に通信させることはできますか](#can-two-openclaw-instances-talk-to-each-other-local-vps)
  - [複数のエージェント用に別々の VPS は必要ですか](#do-i-need-separate-vpses-for-multiple-agents)
  - [VPS から SSH する代わりに、個人用ラップトップ上のノードを使う利点はありますか](#is-there-a-benefit-to-using-a-node-on-my-personal-laptop-instead-of-ssh-from-a-vps)
  - [2 台目のラップトップにはインストールすべきですか。それともノードを追加するだけでよいですか](#should-i-install-on-a-second-laptop-or-just-add-a-node)
  - [ノードはゲートウェイサービスを実行しますか](#do-nodes-run-a-gateway-service)
  - [設定を適用する API / RPC の方法はありますか](#is-there-an-api-rpc-way-to-apply-config)
  - [`config.apply` で設定が消えました。復旧と再発防止の方法はありますか](#configapply-wiped-my-config-how-do-i-recover-and-avoid-this)
  - [初回インストール向けの最小限で妥当な設定は何ですか](#whats-a-minimal-sane-config-for-a-first-install)
  - [VPS 上で Tailscale を設定し、Mac から接続するにはどうすればよいですか](#how-do-i-set-up-tailscale-on-a-vps-and-connect-from-my-mac)
  - [Mac ノードをリモートゲートウェイの Tailscale Serve に接続するにはどうすればよいですか](#how-do-i-connect-a-mac-node-to-a-remote-gateway-tailscale-serve)
- [環境変数と .env の読み込み](#env-vars-and-env-loading)
  - [OpenClaw は環境変数をどのように読み込みますか](#how-does-openclaw-load-environment-variables)
  - [サービス経由でゲートウェイを起動したら環境変数が消えましたどうすればよいですか](#i-started-the-gateway-via-the-service-and-my-env-vars-disappeared-what-now)
  - [`COPILOT_GITHUB_TOKEN` を設定したのに、モデル status に Shell env off と表示されるのはなぜですか](#i-set-copilotgithubtoken-but-models-status-shows-shell-env-off-why)
- [セッションと複数チャット](#sessions-and-multiple-chats)
  - [新しい会話を開始するにはどうすればよいですか](#how-do-i-start-a-fresh-conversation)
  - [新しいメッセージを一度も送らなかった場合、セッションは自動的にリセットされますか](#do-sessions-reset-automatically-if-i-never-send-new)
  - [OpenClaw インスタンスのチームを作り、1 人を CEO、複数をエージェントにする方法はありますか](#is-there-a-way-to-make-a-team-of-openclaw-instances-one-ceo-and-many-agents)
  - [タスクの途中でコンテキストが切り詰められました。どうすれば防げますか](#why-did-context-get-truncated-midtask-how-do-i-prevent-it)
  - [OpenClaw をインストールしたまま完全にリセットするにはどうすればよいですか](#how-do-i-completely-reset-openclaw-but-keep-it-installed)
  - [context too large エラーが出ます。リセットまたは compact するにはどうすればよいですか](#im-getting-context-too-large-errors-how-do-i-reset-or-compact)
  - [なぜ "LLM request rejected: messages.content.tool_use.input field required" と表示されるのですか](#why-am-i-seeing-llm-request-rejected-messages-content-tool-use-input-field-required)
  - [30 分ごとに heartbeat メッセージが送られてくるのはなぜですか](#why-am-i-getting-heartbeat-messages-every-30-minutes)
  - [WhatsApp グループにボットアカウントを追加する必要はありますか](#do-i-need-to-add-a-bot-account-to-a-whatsapp-group)
  - [WhatsApp グループの JID を取得するにはどうすればよいですか](#how-do-i-get-the-jid-of-a-whatsapp-group)
  - [グループで OpenClaw が返信しないのはなぜですか](#why-doesnt-openclaw-reply-in-a-group)
  - [グループ / スレッドは DM とコンテキストを共有しますか](#do-groups-threads-share-context-with-dms)
  - [作成できるワークスペースとエージェントの数はいくつですか](#how-many-workspaces-and-agents-can-i-create)
  - [複数のボットやチャットを同時に実行できますか。Slack ではどう設定すべきですか](#can-i-run-multiple-bots-or-chats-at-the-same-time-slack-and-how-should-i-set-that-up)
- [Models: デフォルト、選択、aliases、切り替え](#models-defaults-selection-aliases-switching)
  - [デフォルトモデルとは何ですか](#what-is-the-default-model)
  - [どのモデルを推奨しますか](#what-model-do-you-recommend)
  - [selfホスト型モデルs の llamacpp vLLM Ollama は使えますか](#can-i-use-selfhosted-models-llamacpp-vllm-ollama)
  - [設定を消さずにモデルを切り替えるにはどうすればよいですか](#how-do-i-switch-models-without-wiping-my-config)
  - [OpenClaw、Flawd、Krill はモデルに何を使っていますか](#what-do-openclaw-flawd-and-krill-use-for-models)
  - [再起動せずにその場でモデルを切り替えるにはどうすればよいですか](#how-do-i-switch-models-on-the-fly-without-restarting)
  - [日常作業には GPT 5.2、コーディングには Codex 5.3 を使えますか](#can-i-use-gpt-5-2-for-daily-tasks-and-codex-5-3-for-coding)
  - [Model is not allowed と表示され、その後返信がないのはなぜですか](#why-do-i-see-model-is-not-allowed-and-then-no-reply)
  - [Unknown モデル minimax/MiniMax-M2.5 と表示されるのはなぜですか](#why-do-i-see-unknown-model-minimaxminimaxm25)
  - [デフォルトに MiniMax、複雑なタスクには OpenAI を使えますか](#can-i-use-minimax-as-my-default-and-openai-for-complex-tasks)
  - [opus sonnet gpt は builtin shortcuts ですか](#are-opus-sonnet-gpt-builtin-shortcuts)
  - [モデル shortcuts aliases を定義 / 上書きするにはどうすればよいですか](#how-do-i-defineoverride-model-shortcuts-aliases)
  - [OpenRouter や ZAI など他のプロバイダーのモデルを追加するにはどうすればよいですか](#how-do-i-add-models-from-other-providers-like-openrouter-or-zai)
- [モデルのフェイルオーバーと「All モデル failed」](#model-failover-and-all-models-failed)
  - [failover はどのように動作しますか](#how-does-failover-work)
  - [このエラーは何を意味しますか](#what-does-this-error-mean)
  - [`No credentials found for profile "anthropic:default"` の修正チェックリスト](#fix-checklist-for-no-認証情報-found-for-profile-anthropicdefault)
  - [なぜ Google Gemini も試行され、失敗したのですか](#why-did-it-also-try-google-gemini-and-fail)
- [認証プロファイル: 概要と管理方法](#auth-profiles-what-they-are-and-how-to-manage-them)
  - [認証プロファイルとは](#what-is-an-auth-profile)
  - [一般的なプロファイル ID は何ですか](#what-are-typical-profile-ids)
  - [最初に試行される認証プロファイルを制御できますか](#can-i-control-which-auth-profile-is-tried-first)
  - [OAuth と API キーの違いは何ですか](#oauth-vs-api-key-whats-the-difference)
- [ゲートウェイ: ポート、「already running」、およびリモートモード](#gateway-ports-already-running-and-remote-mode)
  - [ゲートウェイはどのポートを使用しますか](#what-port-does-the-gateway-use)
  - [`openclaw ゲートウェイ status` で Runtime running と表示されるのに RPC probe failed になるのはなぜですか](#why-does-openclaw-gateway-status-say-runtime-running-but-rpc-probe-failed)
  - [`openclaw ゲートウェイ status` で Config cli と Config サービスが異なって表示されるのはなぜですか](#why-does-openclaw-gateway-status-show-config-cli-and-config-service-different)
  - [another ゲートウェイインスタンス is already listening とは何を意味しますか](#what-does-another-gateway-instance-is-already-listening-mean)
  - [OpenClaw をリモートモードで実行し、クライアントを別のゲートウェイに接続するにはどうすればよいですか](#how-do-i-run-openclaw-in-remote-mode-client-connects-to-a-gateway-elsewhere)
  - [Control UI で `unauthorized` と表示される、または再接続を繰り返します。どうすればよいですか](#the-control-ui-says-unauthorized-or-keeps-reconnecting-what-now)
  - [`gateway.bind` を `tailnet` に設定したのにバインドできず、何も待ち受けません](#i-set-gatewaybind-tailnet-but-it-cant-bind-nothing-listens)
  - [同じ host 上で複数のゲートウェイを実行できますか](#can-i-run-multiple-gateways-on-the-same-host)
  - [invalid handshake code 1008 とは何を意味しますか](#what-does-invalid-handshake-code-1008-mean)
- [ログとデバッグ](#logging-and-debugging)
  - [ログはどこにありますか](#where-are-logs)
  - [ゲートウェイサービスを開始/停止/再起動するには](#how-do-i-start-stop-restart-the-gateway-service)
  - [Windows でターミナルを閉じてしまった場合 OpenClaw を再起動するには](#i-closed-my-terminal-on-windows-how-do-i-restart-openclaw)
  - [ゲートウェイは起動しているのに返信が届かない場合何を確認すべきですか](#the-gateway-is-up-but-replies-never-arrive-what-should-i-check)
  - [ゲートウェイから理由なく切断された場合はどうすればよいですか](#disconnected-from-gateway-no-reason-what-now)
  - [Telegram の setMyCommands がネットワークエラーで失敗する場合何を確認すべきですか](#telegram-setmycommands-fails-with-network-errors-what-should-i-check)
  - [TUI に何も表示されない場合何を確認すべきですか](#tui-shows-no-output-what-should-i-check)
  - [ゲートウェイを完全に停止してから再起動するには](#how-do-i-completely-stop-then-start-the-gateway)
  - [ELI5 openclaw ゲートウェイ restart と openclaw ゲートウェイの違い](#eli5-openclaw-gateway-restart-vs-openclaw-gateway)
  - [何かが失敗したときに最速で詳細を取得する方法は何ですか](#whats-the-fastest-way-to-get-more-details-when-something-fails)
- [メディアと添付ファイル](#media-and-attachments)
  - [My スキル generated an image/PDF but nothing was sent](#my-skill-generated-an-imagepdf-but-nothing-was-sent)
- [セキュリティとアクセス制御](#security-and-access-control)
  - [OpenClaw を受信 DM に公開しても安全ですか](#is-it-safe-to-expose-openclaw-to-inbound-dms)
  - [プロンプトインジェクションは公開ボットだけの懸念ですか](#is-prompt-injection-only-a-concern-for-public-bots)
  - [ボット専用の email、GitHub account、または phone number を持たせるべきですか](#should-my-bot-have-its-own-email-github-account-or-phone-number)
  - [自分の text messages に対する自律性を与えてもよいですかまたそれは安全ですか](#can-i-give-it-autonomy-over-my-text-messages-and-is-that-safe)
  - [個人アシスタント用途では、より安価なモデルを使えますか](#can-i-use-cheaper-models-for-personal-assistant-tasks)
  - [Telegram で start を実行したのにペアリングコードが届きません](#i-ran-start-in-telegram-but-didnt-get-a-pairing-code)
  - [WhatsApp で連絡先にメッセージを送りますか Pairing はどのように機能しますか](#whatsapp-will-it-message-my-contacts-how-does-pairing-work)
- [チャットコマンド、タスクの中断、「止まらない」場合](#chat-commands-aborting-tasks-and-it-wont-stop)
  - [チャットに内部システムメッセージが表示されないようにするには](#how-do-i-stop-internal-system-messages-from-showing-in-chat)
  - [実行中のタスクを停止または中断するには](#how-do-i-stopcancel-a-running-task)
  - [Telegram から Discord にメッセージを送ろうとすると Cross-context messaging denied になるのはなぜですか](#how-do-i-send-a-discord-message-from-telegram-crosscontext-messaging-denied)
  - [メッセージを連投するとボットが無視しているように感じるのはなぜですか](#why-does-it-feel-like-the-bot-ignores-rapidfire-messages)
- [スクリーンショット/チャットログの正確な質問に答える](#answer-the-exact-question-from-the-screenshot-chat-log)

## 問題が起きたときの最初の 60 秒

1. **クイックステータス（最初の確認）**

   ```bash
   openclaw status
   ```

   OS と更新、ゲートウェイ/サービスの到達性、エージェント/セッション、プロバイダー設定とランタイムの問題を、ローカルですばやく要約して表示します（ゲートウェイに到達可能な場合）。

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

   ゲートウェイ のヘルスチェックとプロバイダーのプローブを実行します（到達可能な ゲートウェイが必要です）。[Health](/gateway/health) を参照してください。

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

7. **ゲートウェイ スナップショット**

   ```bash
   openclaw health --json
   openclaw health --verbose   # エラー時に対象 URL と設定パスを表示
   ```

   実行中の ゲートウェイに完全なスナップショットを要求します（WS-only）。[Health](/gateway/health) を参照してください。

## クイックスタートと初回セットアップ

### 行き詰まったとき、最速で抜け出す方法は？

**自分のマシンを見られる**ローカル AI エージェント を使ってください。これは Discord で質問するよりもはるかに効果的です。多くの「詰まった」ケースは **ローカルの設定や環境の問題**であり、リモートの支援者には確認できないためです。

- **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
- **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

これらのツールはリポジトリを読み、コマンドを実行し、ログを調べ、マシンレベルのセットアップ（PATH、サービス、権限、認証ファイル）の修正を支援できます。`hackable (git) install` を使って、**完全なソースチェックアウト**を渡してください。

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
```

これにより OpenClaw は **git checkout から**インストールされるため、エージェント はコードとドキュメントを読み、実際に稼働している正確なバージョンを前提に推論できます。あとでインストーラーを `--install-method git` なしで再実行すれば、いつでも stable に戻せます。

ヒント: エージェントにはまず修正を**計画して監督**させ（段階的に進める）、その後で本当に必要なコマンドだけを実行させてください。そうすると変更が小さくなり、監査もしやすくなります。

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

- `openclaw status`: ゲートウェイ/エージェント の健全性と基本設定を素早く確認します。
- `openclaw models status`: プロバイダー の認証と モデル の利用可否を確認します。
- `openclaw doctor`: よくある設定や 状態 の問題を検証し、修復します。

そのほか有用な CLI チェック: `openclaw status --all`, `openclaw logs --follow`,
`openclaw gateway status`, `openclaw health --verbose`.

クイックデバッグループについては「問題が起きたときの最初の 60 秒」を参照してください。
インストールドキュメント: [Install](/install), [Installer flags](/install/installer), [Updating](/install/updating)。

<h3 id="whats-the-recommended-way-to-install-and-set-up-openclaw">OpenClaw をインストールしてセットアップする推奨方法は？</h3>

このリポジトリでは、ソースから実行し、オンボーディングウィザード を使う方法を推奨しています。

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
openclaw onboard --install-daemon
```

ウィザード は UI assets も自動でビルドできます。オンボーディング 後は、通常 ゲートウェイを **18789** ポートで実行します。

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

<h3 id="how-do-i-open-the-dashboard-after-onboarding">オンボーディング後にダッシュボードを開くには？</h3>

ウィザード は オンボーディング の直後に、クリーンな（token なしの）ダッシュボード URL でブラウザを開き、同時にサマリーにもリンクを表示します。そのタブは開いたままにしてください。起動しなかった場合は、表示された URL を同じマシン上でコピーして開いてください。

<h3 id="how-do-i-authenticate-the-dashboard-token-on-localhost-vs-remote">localhost とリモートでダッシュボードトークンを認証する方法は？</h3>

**Localhost（同じマシン）:**

- `http://127.0.0.1:18789/` を開きます。
- 認証を求められた場合は、`gateway.auth.token`（または `OPENCLAW_GATEWAY_TOKEN`）の トークンを Control UI 設定 に貼り付けます。
- ゲートウェイホスト で `openclaw config get gateway.auth.token` を実行して取得します（または `openclaw doctor --generate-gateway-token` で生成できます）。

**localhost ではない場合:**

- **Tailscale Serve**（推奨）: bind は loopback のままにして、`openclaw gateway --tailscale serve` を実行し、`https://<magicdns>/` を開きます。`gateway.auth.allowTailscale` が `true` なら、ID headers によって Control UI/WebSocket 認証が満たされます（トークンは不要で、信頼済みの ゲートウェイホスト を前提とします）。ただし HTTP APIs には引き続き トークン / パスワード が必要です。
- **Tailnet bind**: `openclaw gateway --bind tailnet --token "<token>"` を実行し、`http://<tailscale-ip>:18789/` を開いて、ダッシュボード 設定 に トークンを貼り付けます。
- **SSH tunnel**: `ssh -N -L 18789:127.0.0.1:18789 user@host` を実行してから `http://127.0.0.1:18789/` を開き、Control UI 設定 に トークンを貼り付けます。

bind mode と認証の詳細は [Dashboard](/web/dashboard) と [Web surfaces](/web) を参照してください。

<h3 id="what-runtime-do-i-need">必要なランタイムは？</h3>

Node **>= 22** が必要です。`pnpm` を推奨します。ゲートウェイに Bun は **非推奨**です。

<h3 id="does-it-run-on-raspberry-pi">Raspberry Pi で動きますか？</h3>

はい。ゲートウェイ は軽量で、ドキュメントでは個人利用の目安として **512MB-1GB RAM**、**1 core**、約 **500MB** のディスクで十分とされており、**Raspberry Pi 4 で動作可能**と明記されています。

ログ、メディア、その他サービスの余裕を見込みたい場合は **2GB を推奨**しますが、厳密な最低要件ではありません。

ヒント: 小さな Pi や VPS に ゲートウェイを載せ、ノート PC やスマートフォンに **ノード** をペアリングすれば、ローカルの screen/camera/canvas やコマンド実行を利用できます。[Nodes](/nodes) を参照してください。

<h3 id="any-tips-for-raspberry-pi-installs">Raspberry Pi へのインストールでコツはありますか？</h3>

要点だけ言うと、動作はしますが、多少の粗さはあります。

- **64-bit** OS を使い、Node は 22 以上を維持してください。
- ログを見やすく、更新もしやすい **hackable (git) install** を推奨します。
- チャネル/スキル なしで始め、あとから 1 つずつ追加してください。
- 変なバイナリ問題が出た場合、多くは **ARM compatibility** の問題です。

ドキュメント: [Linux](/platforms/linux), [Install](/install)。

<h3 id="it-is-stuck-on-wake-up-my-friend-onboarding-will-not-hatch-what-now">オンボーディングで "wake up my friend" の画面から進まず hatch しません。どうすればいいですか？</h3>

この画面は、ゲートウェイに到達できて認証も通っていることが前提です。TUI は最初の hatch 時に `"Wake up, my friend!"` も自動送信します。その行が表示されても **返答がなく**、トークン数が 0 のままなら、エージェント は一度も実行されていません。

1. ゲートウェイを再起動します。

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

ゲートウェイがリモートにある場合は、tunnel/Tailscale 接続が生きていること、そして UI が正しい ゲートウェイを向いていることを確認してください。[Remote access](/gateway/remote) を参照してください。

<h3 id="can-i-migrate-my-setup-to-a-new-machine-mac-mini-without-redoing-onboarding">新しいマシン（Mac mini など）へ、オンボーディングをやり直さずにセットアップを移行できますか？</h3>

はい。**状態ディレクトリ** と **ワークスペース** をコピーしてから Doctor を 1 回実行すれば移行できます。**両方**の場所をコピーする限り、ボット を「**まったく同じ状態**」（memory、セッション履歴、auth、チャネル state）で引き継げます。

1. 新しいマシンに OpenClaw をインストールします。
2. 古いマシンから `$OPENCLAW_STATE_DIR`（既定: `~/.openclaw`）をコピーします。
3. ワークスペース（既定: `~/.openclaw/workspace`）をコピーします。
4. `openclaw doctor` を実行し、ゲートウェイ サービス を再起動します。

これにより 設定、認証プロファイル、WhatsApp 認証情報、セッション、memory が保持されます。リモートモード の場合、セッションストア と ワークスペースを所有しているのは ゲートウェイホスト であることに注意してください。

**重要:** ワークスペースだけを GitHub に commit/push しても、バックアップされるのは **memory + bootstrap files** だけで、**セッション履歴 や 認証は含まれません**。それらは `~/.openclaw/` 配下（たとえば `~/.openclaw/agents/<agentId>/sessions/`）に保存されます。

関連: [Migrating](/install/migrating), [Where things live on disk](/help/faq#where-does-openclaw-store-its-data),
[Agent ワークスペース](/concepts/agent-workspace), [Doctor](/gateway/doctor),
[Remote mode](/gateway/remote)。

<h3 id="where-do-i-see-what-is-new-in-the-latest-version">最新バージョンの変更点はどこで確認できますか？</h3>

GitHub の changelog を確認してください。
[https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

新しいエントリほど先頭にあります。先頭セクションが **Unreleased** の場合、その次の日付付きセクションが最新のリリース版です。エントリは **Highlights**、**Changes**、**Fixes**（必要に応じて docs/その他セクション）で整理されています。

<h3 id="i-cant-access-docs-openclaw-ai-ssl-error-what-now">`docs.openclaw.ai` にアクセスできず SSL error が出ます。どうすればいいですか？</h3>

一部の Comcast/Xfinity 回線では、Xfinity Advanced Security により `docs.openclaw.ai` が誤ってブロックされることがあります。無効化するか、`docs.openclaw.ai` を allowlist に追加してから再試行してください。詳細: [Troubleshooting](/help/troubleshooting#docsopenclawai-shows-an-ssl-error-comcastxfinity)。
解除の支援として、こちらから報告していただけると助かります: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status)。

それでも到達できない場合、docs は GitHub に mirror されています。
[https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

<h3 id="whats-the-difference-between-stable-and-beta">stable と beta の違いは何ですか？</h3>

**Stable** と **beta** は、別々のコードラインではなく **npm dist-tags** です。

- `latest` = stable
- `beta` = テスト用の先行ビルド

私たちはまず **beta** にビルドを出し、テストを行い、十分に安定したら**その同じバージョンを `latest` に昇格**させます。そのため beta と stable が**同じバージョン**を指していることがあります。

変更点はこちらで確認できます。
[https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

<h3 id="how-do-i-install-the-beta-version-and-whats-the-difference-between-beta-and-dev">beta 版のインストール方法と、beta と dev の違いは？</h3>

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

詳細: [Development チャネル](/install/development-channels) と [Installer flags](/install/installer)。

<h3 id="how-long-does-install-and-onboarding-usually-take">インストールとオンボーディングには通常どれくらい時間がかかりますか？</h3>

おおよその目安:

- **Install:** 2-5 分
- **Onboarding:** 5-15 分（設定する チャネル/モデル の数に依存）

止まる場合は、[インストーラーが止まる場合](/help/faq#installer-stuck-how-do-i-get-more-feedback) と [行き詰まったとき](/help/faq#im-stuck--whats-the-fastest-way-to-get-unstuck) の高速デバッグループを使ってください。

<h3 id="how-do-i-try-the-latest-bits">最新版を試すには？</h3>

方法は 2 つあります。

1. **Dev チャネル（git checkout）:**

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

ドキュメント: [Update](/cli/update), [Development チャネル](/install/development-channels),
[Install](/install)。

<h3 id="installer-stuck-how-do-i-get-more-feedback">インストーラーが止まる。もっと詳しいフィードバックを得るには？</h3>

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

<h3 id="windows-install-says-git-not-found-or-openclaw-not-recognized">Windows インストールで `git not found` や `openclaw not recognized` と表示されます</h3>

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

<h3 id="windows-exec-output-shows-garbled-chinese-text-what-should-i-do">Windows の exec 出力で中国語が文字化けします。どうすればいいですか？</h3>

これは通常、ネイティブ Windows shell における console code page の不一致です。

症状:

- `system.run`/`exec` の出力で中国語が mojibake になる
- 同じコマンドが別の terminal プロファイル では正常に見える

PowerShell での簡易回避策:

```powershell
chcp 65001
[Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$OutputEncoding = [System.Text.UTF8Encoding]::new($false)
```

その後で ゲートウェイを再起動し、コマンドを再試行してください。

```powershell
openclaw gateway restart
```

最新版の OpenClaw でも再現する場合は、以下で追跡・報告してください。

- [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

<h3 id="the-docs-didnt-answer-my-question-how-do-i-get-a-better-answer">ドキュメントで答えが見つからなかった場合、より良い答えを得るには？</h3>

**hackable (git) install** を使ってソースと docs 一式をローカルに持ち、そのフォルダから ボット（または Claude/Codex）に質問してください。そうすれば repo を読んだうえで、より正確に回答できます。

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
```

詳細: [Install](/install) と [Installer flags](/install/installer)。

<h3 id="how-do-i-install-openclaw-on-linux">Linux に OpenClaw をインストールするには？</h3>

短く言うと、Linux guide に従ってから オンボーディングウィザード を実行してください。

- Linux の最短手順 + サービス install: [Linux](/platforms/linux)。
- フル手順: [Getting Started](/start/getting-started)。
- installer と更新: [Install & updates](/install/updating)。

<h3 id="how-do-i-install-openclaw-on-a-vps">VPS に OpenClaw をインストールするには？</h3>

Linux の VPS であればどれでも動作します。server に install してから、SSH/Tailscale 経由で ゲートウェイにアクセスしてください。

ガイド: [exe.dev](/install/exe-dev), [Hetzner](/install/hetzner), [Fly.io](/install/fly)。
リモートアクセス: [ゲートウェイ remote](/gateway/remote)。

<h3 id="where-are-the-cloudvps-install-guides">クラウド/VPS のインストールガイドはどこにありますか？</h3>

主要 プロバイダー をまとめた **hosting hub** を用意しています。1 つ選んでガイドに従ってください。

- [VPS hosting](/vps)（全 プロバイダー を集約）
- [Fly.io](/install/fly)
- [Hetzner](/install/hetzner)
- [exe.dev](/install/exe-dev)

cloud での動作は次のとおりです。**ゲートウェイ は server 上で動作**し、あなたはノート PC やスマートフォンから Control UI（または Tailscale/SSH）でアクセスします。状態 と ワークスペース は server 上にあるため、host を source of truth として扱い、バックアップしてください。

その cloud ゲートウェイに **ノード**（Mac/iOS/Android/ヘッドレス）をペアリングすると、ゲートウェイを cloud に置いたまま、ローカルの screen/camera/canvas へのアクセスやノート PC 上でのコマンド実行が可能になります。

ハブ: [Platforms](/platforms)。リモートアクセス: [ゲートウェイ remote](/gateway/remote)。
Nodes: [Nodes](/nodes), [Nodes CLI](/cli/nodes)。

<h3 id="can-i-ask-openclaw-to-update-itself">OpenClaw に自分自身を更新させることはできますか？</h3>

短く言うと、**可能ですが、推奨しません**。update 処理では ゲートウェイが再起動し（現在の セッションが切断される）、クリーンな git checkout が必要になる場合があり、確認プロンプトも出ることがあります。より安全なのは、運用者が shell から更新を実行することです。

CLI は以下です。

```bash
openclaw update
openclaw update status
openclaw update --channel stable|beta|dev
openclaw update --tag <dist-tag|version>
openclaw update --no-restart
```

エージェント から自動化する必要がある場合:

```bash
openclaw update --yes --no-restart
openclaw gateway restart
```

ドキュメント: [Update](/cli/update), [Updating](/install/updating)。

<h3 id="what-does-the-onboarding-wizard-actually-do">オンボーディングウィザードは実際には何をしているのですか？</h3>

`openclaw onboard` は推奨されるセットアップ経路です。**local mode** では次を順番に案内します。

- **Model/auth setup**（プロバイダー OAuth/setup-token フロー、API キー、LM Studio などの ローカルモデルのオプションを含む）
- **Workspace** の場所と bootstrap files
- **ゲートウェイ 設定**（bind/port/auth/tailscale）
- **Providers**（WhatsApp, Telegram, Discord, Mattermost (plugin), Signal, iMessage）
- **Daemon install**（macOS では LaunchAgent、Linux/WSL2 では systemd user unit）
- **Health checks** と **スキル** の選択

また、設定済みの モデル が不明または auth 不足の場合は警告も出します。

<h3 id="do-i-need-a-claude-or-openai-subscription-to-run-this">実行するのに Claude や OpenAI のサブスクリプションは必要ですか？</h3>

いいえ。OpenClaw は **API キー**（Anthropic/OpenAI/その他）でも、データを端末内に留める **local-only モデル** でも動作します。サブスクリプション（Claude Pro/Max や OpenAI Codex）は、それら プロバイダー を認証するための任意の手段です。

Anthropic サブスクリプション認証を選ぶ場合は、自分で判断してください。Anthropic は過去に Claude Code 以外での一部 サブスクリプション 利用をブロックしたことがあります。OpenAI Codex OAuth は、OpenClaw のような外部ツールでの利用が明示的にサポートされています。

ドキュメント: [Anthropic](/providers/anthropic), [OpenAI](/providers/openai),
[Local モデル](/gateway/local-models), [Models](/concepts/models)。

<h3 id="can-i-use-claude-max-subscription-without-an-api-key">API キーなしで Claude Max サブスクリプションを使えますか？</h3>

はい。API キー の代わりに **setup-token** で認証できます。これが サブスクリプション 用の経路です。

Claude Pro/Max サブスクリプション には **API キー は含まれない**ため、サブスクリプション account における技術的な経路はこれです。ただし使うかどうかはあなたの判断です。Anthropic は過去に Claude Code 以外での一部 サブスクリプション 利用をブロックしたことがあります。
本番で最も明確かつ安全なサポート経路を望むなら、Anthropic API キー を使ってください。

<h3 id="how-does-anthropic-setuptoken-auth-work">Anthropic の setup-token 認証はどのように動きますか？</h3>

`claude setup-token` は Claude Code CLI 経由で **token string** を生成します（web console では取得できません）。これは **どのマシンでも**実行できます。ウィザード で **Anthropic token (paste setup-token)** を選ぶか、`openclaw models auth paste-token --provider anthropic` で貼り付けてください。トークンは **anthropic** プロバイダー の 認証プロファイル として保存され、API キー のように使われます（自動更新なし）。詳細: [OAuth](/concepts/oauth)。

<h3 id="where-do-i-find-an-anthropic-setuptoken">Anthropic の setup-トークンはどこで取得できますか？</h3>

**Anthropic Console にはありません**。setup-トークンは **どのマシンでも** **Claude Code CLI** から生成します。

```bash
claude setup-token
```

表示された トークンをコピーし、ウィザード で **Anthropic token (paste setup-token)** を選んでください。ゲートウェイホスト上で実行したい場合は `openclaw models auth setup-token --provider anthropic` を使います。別の場所で `claude setup-token` を実行した場合は、ゲートウェイホスト で `openclaw models auth paste-token --provider anthropic` により貼り付けてください。[Anthropic](/providers/anthropic) を参照してください。

<h3 id="do-you-support-claude-subscription-auth-claude-pro-or-max">Claude サブスクリプション認証（Claude Pro または Max）はサポートしていますか？</h3>

はい。**setup-token** 経由でサポートしています。OpenClaw は Claude Code CLI の OAuth トークンを再利用しなくなったため、setup-token か Anthropic API キー を使ってください。トークンはどこで生成してもよく、ゲートウェイホスト に貼り付けます。[Anthropic](/providers/anthropic) と [OAuth](/concepts/oauth) を参照してください。

重要: これは技術的互換性の話であり、ポリシー保証ではありません。Anthropic は過去に Claude Code 以外での一部 サブスクリプション 利用をブロックしたことがあります。
利用するかどうか、また Anthropic の現行規約に適合するかは、あなた自身で確認してください。
本番運用や 複数ユーザー運用 では、Anthropic API キー auth のほうがより安全で、推奨される選択です。

<h3 id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic">Anthropic から HTTP 429 `ratelimiterror` が出るのはなぜですか？</h3>

これは現在のウィンドウで **Anthropic の 利用上限 / レート制限** を使い切ったことを意味します。**Claude subscription**（setup-token）を使っている場合は、ウィンドウのリセットを待つか、プランをアップグレードしてください。**Anthropic API キー** を使っている場合は、Anthropic Console で利用量や請求状況を確認し、必要に応じて上限を引き上げてください。

特に以下のメッセージが出る場合:
`Extra usage is required for long context requests`
これは Anthropic の 1M context beta（`context1m: true`）を使おうとしていることを示します。これは credential が long-context billing の対象である場合にのみ動作します（API キー billing、または Extra Usage が有効な subscription）。

ヒント: プロバイダー が rate-limited でも OpenClaw が応答を継続できるよう、**フォールバック モデル** を設定してください。[Models](/cli/models), [OAuth](/concepts/oauth), and
[/ゲートウェイ/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context) を参照してください。

<h3 id="is-aws-bedrock-supported">AWS Bedrock はサポートされていますか？</h3>

はい。pi-ai の **Amazon Bedrock (Converse)** プロバイダー を **manual 設定** で利用できます。ゲートウェイホスト に AWS 認証情報/region を設定し、モデル設定 に Bedrock プロバイダー entry を追加する必要があります。[Amazon Bedrock](/providers/bedrock) と [Model プロバイダー](/providers/models) を参照してください。managed key flow を望む場合は、Bedrock の前段に OpenAI-compatible proxy を置く方法も引き続き有効です。

<h3 id="how-does-codex-auth-work">Codex 認証はどのように動きますか？</h3>

OpenClaw は **OpenAI Code (Codex)** を OAuth（ChatGPT sign-in）でサポートしています。ウィザード は OAuth flow を実行でき、必要に応じて デフォルトモデル を `openai-codex/gpt-5.4` に設定します。[Model プロバイダー](/concepts/model-providers) と [Wizard](/start/wizard) を参照してください。

<h3 id="do-you-support-openai-subscription-auth-codex-oauth">OpenAI サブスクリプション認証の Codex OAuth はサポートしていますか？</h3>

はい。OpenClaw は **OpenAI Code (Codex) サブスクリプション OAuth** を完全にサポートしています。
OpenAI は、OpenClaw のような外部ツールや workflow での サブスクリプション OAuth 利用を明示的に許可しています。オンボーディングウィザード から OAuth flow を実行できます。

[OAuth](/concepts/oauth), [Model プロバイダー](/concepts/model-providers), [Wizard](/start/wizard) を参照してください。

<h3 id="how-do-i-set-up-gemini-cli-oauth">Gemini CLI OAuth はどのように設定しますか？</h3>

Gemini CLI は、`openclaw.json` に client id や secret を書く方式ではなく、**plugin auth flow** を使います。

手順:

1. plugin を有効化します: `openclaw plugins enable google-gemini-cli-auth`
2. login します: `openclaw models auth login --provider google-gemini-cli --set-default`

これにより OAuth tokens は ゲートウェイホスト上の 認証プロファイル に保存されます。詳細: [Model プロバイダー](/concepts/model-providers)。

<h3 id="is-a-local-model-ok-for-casual-chats">気軽なチャット用途ならローカルモデルでも大丈夫ですか？</h3>

通常はおすすめしません。OpenClaw には大きな context と強い safety が必要であり、小さいカードでは切り詰めや漏れが起きます。どうしても使うなら、ローカルで実行できる **最大の** MiniMax M2.5 build を（LM Studio で）動かし、[/ゲートウェイ/local-モデル](/gateway/local-models) を確認してください。小型モデルや quantized モデル では prompt-injection risk が高まります。[Security](/gateway/security) を参照してください。

<h3 id="how-do-i-keep-hosted-model-traffic-in-a-specific-region">ホスト型モデルのトラフィックを特定リージョン内に保つには？</h3>

リージョン固定の endpoint を選んでください。OpenRouter は MiniMax、Kimi、GLM について US-hosted options を提供しています。in-region に保ちたい場合は US-hosted variant を選択してください。同時に `models.mode: "merge"` を使えば、選択したリージョン プロバイダー を尊重しながら Anthropic/OpenAI も並べて フォールバック として利用できます。

<h3 id="do-i-have-to-buy-a-mac-mini-to-install-this">これをインストールするには Mac Mini を買う必要がありますか？</h3>

いいえ。OpenClaw は macOS または Linux（Windows は WSL2 経由）で動作します。Mac mini は任意です。常時稼働 host として買う人もいますが、小さな VPS、home server、Raspberry Pi 級のマシンでも動きます。

Mac が必要なのは **macOS-only tools** を使う場合だけです。iMessage には [BlueBubbles](/channels/bluebubbles)（推奨）を使ってください。BlueBubbles server は任意の Mac 上で動作し、ゲートウェイ は Linux など別環境で動かせます。その他の macOS-only tools を使いたい場合は、ゲートウェイを Mac 上で動かすか、macOS ノード をペアリングしてください。

ドキュメント: [BlueBubbles](/channels/bluebubbles), [Nodes](/nodes), [Mac リモートモード](/platforms/mac/remote)。

<h3 id="do-i-need-a-mac-mini-for-imessage-support">iMessage サポートには Mac mini が必要ですか？</h3>

**Messages にサインイン済みの macOS device** が何らか 1 台必要です。Mac mini である必要はなく、**どの Mac でも構いません**。iMessage には **[BlueBubbles](/channels/bluebubbles)**（推奨）を使ってください。BlueBubbles server は macOS 上で動作し、ゲートウェイ は Linux など別環境で動作できます。

一般的な構成:

- ゲートウェイ は Linux/VPS で動かし、BlueBubbles server は Messages にサインインした任意の Mac で動かす。
- もっとも単純な単一マシン構成にしたい場合は、すべてをその Mac 上で動かす。

ドキュメント: [BlueBubbles](/channels/bluebubbles), [Nodes](/nodes),
[Mac リモートモード](/platforms/mac/remote)。

<h3 id="if-i-buy-a-mac-mini-to-run-openclaw-can-i-connect-it-to-my-macbook-pro">OpenClaw 用に Mac mini を買った場合、MacBook Pro と接続できますか？</h3>

はい。**Mac mini で ゲートウェイを動かし**、MacBook Pro を **ノード**（companion device）として接続できます。ノード は ゲートウェイを実行しません。代わりに、そのデバイス上の screen/camera/canvas や `system.run` などの追加機能を提供します。

一般的なパターン:

- ゲートウェイ は Mac mini 上（常時稼働）。
- MacBook Pro は macOS app または ノード host を実行し、ゲートウェイ とペアリング。
- `openclaw nodes status` / `openclaw nodes list` で状態を確認。

ドキュメント: [Nodes](/nodes), [Nodes CLI](/cli/nodes)。

<h3 id="can-i-use-bun">Bun は使えますか？</h3>

Bun は **非推奨**です。特に WhatsApp と Telegram で ランタイム bugs が見られます。
安定した ゲートウェイには **Node** を使ってください。

それでも Bun を試したい場合は、WhatsApp/Telegram なしの非本番 ゲートウェイ で行ってください。

<h3 id="telegram-what-goes-in-allowfrom">Telegram の `allowFrom` には何を入れればいいですか？</h3>

`channels.telegram.allowFrom` は **人間の送信者の Telegram user ID**（数値）です。ボット username ではありません。

オンボーディングウィザード では `@username` 入力を受け付けて数値 ID に解決できますが、OpenClaw の認可で使われるのは数値 ID のみです。

より安全な方法（サードパーティ ボット なし）:

- ボット に DM を送り、`openclaw logs --follow` を実行して `from.id` を確認する。

公式 Bot API:

- ボット に DM を送り、`https://api.telegram.org/bot<bot_token>/getUpdates` を呼び、`message.from.id` を確認する。

サードパーティ（プライバシーはやや低い）:

- `@userinfobot` または `@getidsbot` に DM を送る。

[/チャネル/telegram](/channels/telegram#access-control-dms--groups) を参照してください。

<h3 id="can-multiple-people-use-one-whatsapp-number-with-different-openclaw-instances">1 つの WhatsApp 番号を、複数の OpenClaw インスタンスで別々に使えますか？</h3>

はい。**マルチエージェントルーティング** で可能です。各送信者の WhatsApp **DM**（peer `kind: "direct"`、送信者 E.164 形式 `+15551234567` など）を別々の `agentId` に bind すれば、各ユーザーに専用の ワークスペース と セッションストア を割り当てられます。返信元は引き続き**同じ WhatsApp account**です。また、DM access control（`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`）は WhatsApp account 単位でグローバルです。[Multi-Agent Routing](/concepts/multi-agent) と [WhatsApp](/channels/whatsapp) を参照してください。

<h3 id="can-i-run-a-fast-chat-agent-and-an-opus-for-coding-agent">高速なチャット用エージェントと、コーディング用の Opus エージェントを分けて動かせますか？</h3>

はい。マルチエージェントルーティング を使います。各 エージェントに個別の デフォルトモデル を設定し、そのうえで inbound routes（プロバイダー account または特定の peers）を各 エージェントに bind してください。設定例は [Multi-Agent Routing](/concepts/multi-agent) にあります。併せて [Models](/concepts/models) と [Configuration](/gateway/configuration) も参照してください。

<h3 id="does-homebrew-work-on-linux">Linux で Homebrew は使えますか？</h3>

はい。Homebrew は Linux（Linuxbrew）をサポートしています。簡易セットアップ:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
brew install <formula>
```

OpenClaw を systemd 経由で実行する場合は、サービス の PATH に `/home/linuxbrew/.linuxbrew/bin`（または自身の brew prefix）が含まれていることを確認してください。そうしないと、`brew` で入れたツールが non-login shell で解決されません。
最近の build では Linux の systemd サービスに一般的な user bin dirs（たとえば `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`）も prepend し、`PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR`, `FNM_DIR` が設定されていればそれも尊重します。

<h3 id="whats-the-difference-between-the-hackable-git-install-and-npm-install">hackable git インストールと npm インストールの違いは何ですか？</h3>

- **Hackable (git) install:** 完全なソース checkout で、編集可能です。contributor に最適です。
  ローカルで build し、コードや docs を修正できます。
- **npm install:** repo なしの global CLI install で、「とにかく動かしたい」場合に最適です。
  更新は npm dist-tags から行われます。

ドキュメント: [Getting started](/start/getting-started), [Updating](/install/updating)。

<h3 id="can-i-switch-between-npm-and-git-installs-later">後から npm インストールと git インストールを切り替えられますか？</h3>

はい。もう一方の方式を install してから Doctor を実行すれば、ゲートウェイ サービス が新しい entrypoint を向くようになります。
これで**データは削除されません**。変わるのは OpenClaw のコード install だけです。state
（`~/.openclaw`）と ワークスペース（`~/.openclaw/workspace`）はそのまま残ります。

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

Doctor は ゲートウェイ サービス の entrypoint mismatch を検出し、現在の install に合わせて サービス 設定 を書き換える提案をします（自動化では `--repair` を使用）。

バックアップのヒント: [Backup strategy](/help/faq#whats-the-recommended-backup-strategy) を参照してください。

<h3 id="should-i-run-the-gateway-on-my-laptop-or-a-vps">ゲートウェイはラップトップと VPS のどちらで動かすべきですか？</h3>

短く言うと、**24/7 の信頼性が必要なら VPS** です。もっとも摩擦が少ない方法を優先し、sleep や再起動を許容できるならローカルでも構いません。

**Laptop（local ゲートウェイ）**

- **Pros:** server コスト不要、ローカルファイルへ直接アクセス可能、ブラウザ window が見える。
- **Cons:** sleep や network drop で切断、OS update や reboot で中断、常時起動が必要。

**VPS / cloud**

- **Pros:** 常時稼働、安定した network、ラップトップ の sleep 問題がない、継続運用しやすい。
- **Cons:** ヘッドレス 運用が多い（screenshots を使う）、ファイルアクセスはリモートのみ、更新には SSH が必要。

**OpenClaw 固有の注意:** WhatsApp/Telegram/Slack/Mattermost (plugin)/Discord はいずれも VPS で問題なく動作します。実質的なトレードオフは、**ヘッドレス browser** か、見える browser window か、という点です。[Browser](/tools/browser) を参照してください。

**推奨デフォルト:** 以前に ゲートウェイ の切断を経験したなら VPS。Mac をアクティブに使っていて、ローカルファイルアクセスや可視ブラウザでの UI automation を重視するならローカルも有効です。

<h3 id="how-important-is-it-to-run-openclaw-on-a-dedicated-machine">OpenClaw を専用マシンで動かす重要性はどれくらいですか？</h3>

必須ではありませんが、**信頼性と分離の観点では推奨**です。

- **Dedicated host（VPS/Mac mini/Pi）:** 常時稼働しやすく、sleep/reboot による中断が少なく、権限が整理しやすく、継続運用も容易です。
- **共有 ラップトップ/desktop:** テストやアクティブ利用には十分ですが、sleep や update による停止は見込んでください。

両方の利点を取りたいなら、ゲートウェイ は dedicated host に置き、ラップトップ を **ノード** としてペアリングしてローカルの screen/camera/exec tools を使ってください。[Nodes](/nodes) を参照してください。
セキュリティ指針は [Security](/gateway/security) を確認してください。

<h3 id="what-are-the-minimum-vps-requirements-and-recommended-os">VPS の最小要件と推奨 OS は？</h3>

OpenClaw は軽量です。基本的な ゲートウェイ + 1 つの chat チャネル なら:

- **Absolute minimum:** 1 vCPU, 1GB RAM, 約 500MB disk。
- **Recommended:** 1-2 vCPU, 2GB RAM 以上。ログ、メディア、複数 チャネル の余裕が取れます。ノード tools や browser automation はリソースを消費しやすいです。

OS は **Ubuntu LTS**（または最新の Debian/Ubuntu 系）を使ってください。Linux install path はそこが最もよくテストされています。

ドキュメント: [Linux](/platforms/linux), [VPS hosting](/vps)。

<h3 id="can-i-run-openclaw-in-a-vm-and-what-are-the-requirements">VM 上で OpenClaw を動かせますか？要件は？</h3>

はい。VM は VPS と同様に扱ってください。常時稼働し、到達可能で、ゲートウェイ と有効化する チャネル に十分な RAM が必要です。

基本目安:

- **Absolute minimum:** 1 vCPU, 1GB RAM。
- **Recommended:** 複数 チャネル、browser automation、media tools を使うなら 2GB RAM 以上。
- **OS:** Ubuntu LTS または同等の新しい Debian/Ubuntu。

Windows の場合、**WSL2 が最も簡単な VM 風セットアップ**であり、ツール互換性も最良です。[Windows](/platforms/windows), [VPS hosting](/vps) を参照してください。
macOS を VM で実行する場合は [macOS VM](/install/macos-vm) を参照してください。

<h2 id="what-is-openclaw">OpenClaw とは何ですか？</h2>

<h3 id="what-is-openclaw-in-one-paragraph">OpenClaw を 1 段落で説明すると</h3>

OpenClaw は、自分のデバイス上で動かすパーソナル AI アシスタントです。普段使っているメッセージングの画面上で応答し（WhatsApp、Telegram、Slack、Mattermost (plugin)、Discord、Google Chat、Signal、iMessage、WebChat）、対応プラットフォームでは音声機能とライブ Canvas も利用できます。**ゲートウェイ** は常時稼働するコントロールプレーンであり、アシスタントそのものがプロダクトです。

<h3 id="whats-the-value-proposition">価値提案は何ですか</h3>

OpenClaw は「単なる Claude wrapper」ではありません。これは **local-first control plane** であり、
**自分のハードウェア** 上で高機能なアシスタントを実行し、普段使っているチャットアプリからアクセスでき、
ステートフルなセッション、メモリ、ツールを利用しながら、ワークフローの主導権をホスト型
SaaS に渡さずに済みます。

主なポイント:

- **自分のデバイス、自分のデータ:** ゲートウェイ は好きな場所（Mac、Linux、VPS）で実行でき、
  ワークスペース と セッション履歴 をローカルに保持できます。
- **web sandbox ではなく実際のチャネル:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/etc
  に加え、対応プラットフォームではモバイル音声と Canvas も使えます。
- **モデル非依存:** Anthropic、OpenAI、MiniMax、OpenRouter などを利用でき、エージェント ごとの routing
  と failover に対応します。
- **ローカル専用オプション:** ローカルモデルを実行すれば、必要に応じて **すべてのデータを自分のデバイス上に
  とどめる** ことができます。
- **マルチエージェント routing:** チャネル、アカウント、またはタスクごとに エージェント を分けられ、
  それぞれが独自の ワークスペース と defaults を持てます。
- **オープンソースで拡張しやすい:** 中身を確認し、拡張し、vendor lock-in なしで self-host できます。

Docs: [ゲートウェイ](/gateway), [Channels](/channels), [Multi-エージェント](/concepts/multi-agent),
[Memory](/concepts/memory).

<h3 id="i-just-set-it-up-what-should-i-do-first">セットアップした直後にまず何をすればよいですか</h3>

最初のプロジェクトとしては、次のようなものがおすすめです。

- Web サイトを作る（WordPress、Shopify、またはシンプルな静的サイト）。
- モバイルアプリを試作する（構成、画面、API プラン）。
- ファイルやフォルダを整理する（クリーンアップ、命名、タグ付け）。
- Gmail を接続して、要約やフォローアップを自動化する。

大きなタスクにも対応できますが、フェーズごとに分割し、
並列作業には sub エージェント を使うと最も効果的です。

<h3 id="what-are-the-top-five-everyday-use-cases-for-openclaw">OpenClaw の日常的なユースケース上位 5 つは何ですか</h3>

日常的に効果が出やすい使い方は、たとえば次のようなものです。

- **個人向けブリーフィング:** inbox、calendar、気になるニュースの要約。
- **調査とドラフト作成:** メールやドキュメントのための簡易リサーチ、要約、初稿作成。
- **リマインダーとフォローアップ:** cron や heartbeat で動く通知やチェックリスト。
- **ブラウザ自動化:** フォーム入力、データ収集、繰り返しの Web 作業。
- **デバイス横断の連携:** スマートフォンからタスクを送り、ゲートウェイをサーバー上で実行し、結果をチャットで受け取る。

<h3 id="can-openclaw-help-with-lead-gen-outreach-ads-and-blogs-for-a-saas">OpenClaw は SaaS 向けのリード獲得、アウトリーチ、広告、ブログに役立ちますか</h3>

はい。**調査、選別、ドラフト作成** には有効です。サイトを調べて shortlists を作り、
prospects を要約し、アウトリーチ や ad copy の下書きを書けます。

ただし、**アウトリーチ の実行や広告配信** では、人間を必ず介在させてください。スパムを避け、各地域の法令と
プラットフォームのポリシーを守り、送信前には必ず内容を確認してください。最も安全な運用パターンは、
OpenClaw にドラフトさせて人間が承認することです。

Docs: [Security](/gateway/security).

<h3 id="what-are-the-advantages-vs-claude-code-for-web-development">Web 開発において Claude Code と比べた利点は何ですか</h3>

OpenClaw は **personal assistant** と coordination layer であり、IDE の代替ではありません。リポジトリ内で
最速の直接的な coding loop が必要なら Claude Code や Codex を使ってください。永続的な memory、クロスデバイスのアクセス、
tool orchestration が必要なときに OpenClaw を使います。

利点:

- **セッションをまたいで持続する memory + ワークスペース**
- **マルチプラットフォーム access**（WhatsApp、Telegram、TUI、WebChat）
- **tool orchestration**（browser、files、scheduling、hooks）
- **常時稼働する ゲートウェイ**（VPS 上で実行し、どこからでも操作可能）
- **Nodes** によるローカルの browser/screen/camera/exec

Showcase: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

<h2 id="skills-and-automation">スキルと自動化</h2>

<h3 id="how-do-i-customize-skills-without-keeping-the-repo-dirty">リポジトリを汚さずにスキルをカスタマイズするには</h3>

リポジトリ側のコピーを直接編集するのではなく、管理された override を使ってください。変更内容は `~/.openclaw/skills/<name>/SKILL.md` に置くか、`~/.openclaw/openclaw.json` の `skills.load.extraDirs` でフォルダを追加します。優先順位は `<workspace>/skills` > `~/.openclaw/skills` > bundled なので、git に触れずに管理された override が優先されます。上流に取り込む価値のある編集だけをリポジトリに入れ、PR として提出してください。

<h3 id="can-i-load-skills-from-a-custom-folder">カスタムフォルダからスキルを読み込めますか</h3>

はい。`~/.openclaw/openclaw.json` の `skills.load.extraDirs` で追加ディレクトリを指定できます（最も低い優先順位）。デフォルトの優先順位は引き続き `<workspace>/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs` です。`clawhub` はデフォルトで `./skills` にインストールし、OpenClaw はそれを `<workspace>/skills` として扱います。

<h3 id="how-can-i-use-different-models-for-different-tasks">タスクごとに異なるモデルを使い分けるには</h3>

現時点でサポートされているパターンは次のとおりです。

- **Cron jobs**: 分離された job ごとに `model` override を設定できます。
- **Sub-エージェント**: デフォルトモデルの異なる個別の エージェントにタスクをルーティングできます。
- **On-demand switch**: `/model` を使えば、現在のセッションモデルをいつでも切り替えられます。

[Cron jobs](/automation/cron-jobs)、[Multi-Agent Routing](/concepts/multi-agent)、[Slash commands](/tools/slash-commands) を参照してください。

<h3 id="the-bot-freezes-while-doing-heavy-work-how-do-i-offload-that">重い処理をしている間にボットが固まりますどうやってオフロードすればいいですか</h3>

長時間かかるタスクや並列タスクには **sub-エージェント** を使ってください。sub-エージェント は独自のセッションで実行され、
要約を返しつつ、メインの chat の応答性を維持します。

ボット に "spawn a sub-エージェント for this task" と依頼するか、`/subagents` を使ってください。
現在 ゲートウェイが何をしているか（そしてビジーかどうか）は、chat で `/status` を使うと確認できます。

トークンに関するヒント: 長時間タスクも sub-エージェント もどちらもトークンを消費します。コストが気になる場合は、
`agents.defaults.subagents.model` で sub-エージェント 用により安価なモデルを設定してください。

Docs: [Sub-エージェント](/tools/subagents)。

<h3 id="how-do-thread-bound-subagent-sessions-work-on-discord">Discord でスレッドに紐づくサブエージェントセッションはどのように動作しますか</h3>

thread binding を使用します。Discord の thread を subagent または セッション target に紐づけることで、その thread 内の後続メッセージがその紐づいた セッション に留まるようにできます。

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

Docs: [Sub-エージェント](/tools/subagents), [Discord](/channels/discord), [Configuration Reference](/gateway/configuration-reference), [Slash commands](/tools/slash-commands)。

<h3 id="cron-or-reminders-do-not-fire-what-should-i-check">Cron やリマインダーが発火しません何を確認すべきですか</h3>

Cron は ゲートウェイ プロセス内で動作します。ゲートウェイが継続的に動いていない場合、
スケジュールされた job は実行されません。

チェックリスト:

- cron が有効であること（`cron.enabled`）と、`OPENCLAW_SKIP_CRON` が設定されていないことを確認してください。
- ゲートウェイが 24/7 稼働していることを確認してください（スリープや再起動なし）。
- job のタイムゾーン設定（`--tz` とホストのタイムゾーン）を確認してください。

デバッグ:

```bash
openclaw cron run <jobId> --force
openclaw cron runs --id <jobId> --limit 50
```

Docs: [Cron jobs](/automation/cron-jobs), [Cron vs Heartbeat](/automation/cron-vs-heartbeat)。

<h3 id="how-do-i-install-skills-on-linux">Linux でスキルをインストールするには</h3>

**ClawHub**（CLI）を使うか、スキル を ワークスペース に配置してください。macOS の スキル UI は Linux では利用できません。
スキル は [https://clawhub.com](https://clawhub.com) で参照できます。

ClawHub CLI をインストールします（いずれかの package manager を選択）:

```bash
npm i -g clawhub
```

```bash
pnpm add -g clawhub
```

<h3 id="can-openclaw-run-tasks-on-a-schedule-or-continuously-in-the-background">OpenClaw はスケジュール実行やバックグラウンドでの継続実行ができますか</h3>

はい。ゲートウェイ scheduler を使います。

- **Cron jobs** はスケジュール実行または定期実行のタスク向けです（再起動後も保持されます）。
- **Heartbeat** は "main セッション" の定期チェック向けです。
- **Isolated jobs** は、自律的に summary を投稿したり chat に配信したりする エージェント 向けです。

Docs: [Cron jobs](/automation/cron-jobs), [Cron vs Heartbeat](/automation/cron-vs-heartbeat),
[Heartbeat](/gateway/heartbeat)。

<h3 id="can-i-run-apple-macos-only-skills-from-linux">Linux から Apple の macOS 専用スキルを実行できますか</h3>

直接はできません。macOS スキル は `metadata.openclaw.os` と必要な binary によって制御されており、スキル は **ゲートウェイホスト** 上で条件を満たす場合にのみ system prompt に表示されます。Linux では、gating を override しない限り `darwin` 専用の スキル（`apple-notes`、`apple-reminders`、`things-mac` など）は読み込まれません。

サポートされているパターンは 3 つあります。

**Option A - ゲートウェイを Mac 上で実行する（最も簡単）。**
macOS の binary が存在する環境で ゲートウェイを動かし、Linux からは リモートモード または Tailscale 経由で接続します。ゲートウェイホスト が macOS なので、スキル は通常どおり読み込まれます。

**Option B - macOS ノード を使う（SSH なし）。**
ゲートウェイ は Linux 上で動かし、macOS ノード（menubar app）をペアリングして、Mac 側の **Node Run Commands** を "Always Ask" または "Always Allow" に設定します。必要な binary が ノード 上に存在すれば、OpenClaw は macOS 専用 スキル を利用可能として扱えます。エージェント は `nodes` tool 経由でそれらの スキル を実行します。"Always Ask" を選んだ場合、プロンプトで "Always Allow" を承認すると、その command が allowlist に追加されます。

**Option C - SSH 経由で macOS binary を proxy する（上級者向け）。**
ゲートウェイ は Linux 上に置いたまま、必要な CLI binary が Mac 上で動く SSH wrapper に解決されるようにします。そのうえで、Linux でも eligible になるように Skill を override します。

1. binary 用の SSH wrapper を作成します（例: Apple Notes 用の `memo`）。

   ```bash
   #!/usr/bin/env bash
   set -euo pipefail
   exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
   ```

2. wrapper を Linux host の `PATH` 上に配置します（例: `~/bin/memo`）。
3. Linux を許可するように Skill metadata を override します（ワークスペース または `~/.openclaw/skills`）。

   ```markdown
   ---
   name: apple-notes
   description: Manage Apple Notes via the memo CLI on macOS.
   metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
   ---
   ```

4. 新しい セッション を開始して、スキル snapshot を更新します。

<h3 id="do-you-have-a-notion-or-heygen-integration">Notion や HeyGen との連携はありますか</h3>

現時点では built-in ではありません。

選択肢:

- **Custom skill / plugin:** 信頼性の高い API アクセスにはこれが最適です（Notion も HeyGen も API を提供しています）。
- **Browser automation:** コードなしでも動きますが、遅く壊れやすくなります。

クライアントごとの context を維持したい場合（agency workflow など）は、次のような単純なパターンが使えます。

- クライアントごとに Notion page を 1 つ用意する（context + preferences + active work）。
- セッション の開始時に、その page を取得するよう エージェントに依頼する。

native 連携 が欲しい場合は、feature request を出すか、
それらの API を対象にした skill を作成してください。

スキル のインストール:

```bash
clawhub install <skill-slug>
clawhub update --all
```

ClawHub は現在のディレクトリ配下の `./skills` にインストールします（または設定済みの OpenClaw ワークスペース にフォールバックします）。OpenClaw は次の セッション でそれを `<workspace>/skills` として扱います。複数の エージェント 間で共有する スキル は、`~/.openclaw/skills/<name>/SKILL.md` に配置してください。一部の スキル は Homebrew でインストールされた binary を前提としており、Linux では Linuxbrew を意味します（詳細は上記の Homebrew Linux FAQ を参照）。[スキル](/tools/skills) と [ClawHub](/tools/clawhub) も参照してください。

<h3 id="how-do-i-install-the-chrome-extension-for-browser-takeover">ブラウザ乗っ取り用の Chrome extension をインストールするには</h3>

built-in installer を使い、その後 Chrome に unpacked extension を読み込んでください。

```bash
openclaw browser extension install
openclaw browser extension path
```

その後、Chrome → `chrome://extensions` → "Developer mode" を有効化 → "Load unpacked" → そのフォルダを選択します。

完全なガイド（remote ゲートウェイ + security に関する注意事項を含む）: [Chrome extension](/tools/chrome-extension)

ゲートウェイが Chrome と同じマシン上で動いている場合（デフォルト構成）、通常は**追加の作業は不要**です。
ゲートウェイが別の場所で動いている場合は、browser があるマシン上で ノード host を動かし、ゲートウェイが browser 操作を proxy できるようにしてください。
それでも、制御したい tab では extension ボタンを自分でクリックする必要があります（自動では attach されません）。

<h2 id="sandboxing-and-memory">サンドボックスとメモリ</h2>

<h3 id="is-there-a-dedicated-sandboxing-doc">専用のサンドボックス化ドキュメントはありますか</h3>

はい。[Sandboxing](/gateway/sandboxing) を参照してください。Docker 固有のセットアップ（Docker 上での完全な ゲートウェイ や sandbox イメージ）については、[Docker](/install/docker) を参照してください。

<h3 id="docker-feels-limited-how-do-i-enable-full-features">Docker には制限があるように感じます完全な機能を有効にするにはどうすればよいですか</h3>

デフォルトのイメージはセキュリティ優先で、`node` ユーザーとして実行されるため、
system packages、Homebrew、バンドル済みブラウザは含まれていません。より完全なセットアップにするには、次のようにします。

- `OPENCLAW_HOME_VOLUME` で `/home/node` を永続化し、キャッシュが保持されるようにする
- `OPENCLAW_DOCKER_APT_PACKAGES` で system deps をイメージに組み込む
- バンドルされている CLI で Playwright のブラウザをインストールする:
  `node /app/node_modules/playwright-core/cli.js install chromium`
- `PLAYWRIGHT_BROWSERS_PATH` を設定し、そのパスが永続化されるようにする

ドキュメント: [Docker](/install/docker), [Browser](/tools/browser)。

**DM は個人的なままにして、グループは 1 つの エージェント で公開サンドボックス化できますか**

はい。あなたのプライベートなトラフィックが **DMs** で、公開トラフィックが **groups** である場合は可能です。

`agents.defaults.sandbox.mode: "non-main"` を使うと、group/チャネル セッション（non-main keys）は Docker 内で実行され、main DM セッションはホスト上に残ります。そのうえで、`tools.sandbox.tools` を使って、サンドボックス化されたセッションで利用できるツールを制限します。

セットアップ手順と設定例: [Groups: personal DMs + public groups](/channels/groups#pattern-personal-dms-public-groups-single-agent)

主要な設定リファレンス: [ゲートウェイ configuration](/gateway/configuration#agentsdefaultssandbox)

<h3 id="how-do-i-bind-a-host-folder-into-the-sandbox">ホストのフォルダをサンドボックスにバインドするにはどうすればよいですか</h3>

`agents.defaults.sandbox.docker.binds` を `["host:path:mode"]`（例: `"/home/user/src:/src:ro"`）に設定します。グローバルと エージェント ごとの binds はマージされます。`scope: "shared"` の場合、エージェント ごとの binds は無視されます。機密性の高いものには `:ro` を使用し、binds はサンドボックスのファイルシステム境界を迂回することを忘れないでください。例と安全上の注意については、[Sandboxing](/gateway/sandboxing#custom-bind-mounts) と [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) を参照してください。

<h3 id="how-does-memory-work">メモリはどのように動作しますか</h3>

OpenClaw のメモリは、エージェント ワークスペース 内の Markdown files にすぎません。

- `memory/YYYY-MM-DD.md` の daily notes
- `MEMORY.md` の curated long-term notes（main/private セッション のみ）

また OpenClaw は、モデルに durable notes の書き込みを促すための **silent pre-compaction memory flush** を auto-compaction の前に実行します。これは ワークスペース が書き込み可能な場合にのみ実行されます（read-only sandboxes ではスキップされます）。詳細は [Memory](/concepts/memory) を参照してください。

<h3 id="memory-keeps-forgetting-things-how-do-i-make-it-stick">メモリがすぐに忘れます定着させるにはどうすればよいですか</h3>

ボット に **write the fact to memory** と依頼してください。長期的なメモは `MEMORY.md` に、短期的なコンテキストは `memory/YYYY-MM-DD.md` に入ります。

これはまだ改善を進めている領域です。モデルに memories を保存するよう改めて伝えると効果があります。
モデルは何をすべきか理解しています。それでも忘れ続ける場合は、ゲートウェイが毎回同じ
ワークスペースを使っていることを確認してください。

ドキュメント: [Memory](/concepts/memory), [Agent ワークスペース](/concepts/agent-workspace)。

<h3 id="does-semantic-memory-search-require-an-openai-api-key">セマンティックメモリ検索には OpenAI API キーが必要ですか</h3>

**OpenAI embeddings** を使う場合に限り必要です。Codex OAuth がカバーするのは chat/completions であり、
embeddings へのアクセスは **付与されません**。そのため、**Codex でサインインしても（OAuth または
Codex CLI login）** セマンティックメモリ検索の助けにはなりません。OpenAI embeddings には、
引き続き実際の API キー（`OPENAI_API_KEY` または `models.providers.openai.apiKey`）が必要です。

プロバイダー を明示的に設定しない場合、OpenClaw は API キー を解決できるときに プロバイダー を自動選択します
（認証プロファイル、`models.providers.*.apiKey`、または env vars）。OpenAI key を解決できる場合は OpenAI を優先し、
そうでなければ Gemini key を解決できる場合は Gemini、その次に Voyage、次に Mistral を選びます。利用可能な
remote key がない場合、設定するまでは memory search は無効のままです。ローカルモデル path が設定済みで存在する場合、
OpenClaw は `local` を優先します。Ollama は、`memorySearch.provider = "ollama"` を明示的に設定した場合にサポートされます。

ローカルのまま使いたい場合は、`memorySearch.provider = "local"`（必要に応じて
`memorySearch.フォールバック = "none"` も）を設定してください。Gemini embeddings を使いたい場合は、
`memorySearch.provider = "gemini"` を設定し、`GEMINI_API_KEY`（または
`memorySearch.remote.apiKey`）を指定してください。**OpenAI, Gemini, Voyage, Mistral, Ollama, or local** の embedding
モデル をサポートしています。セットアップの詳細は [Memory](/concepts/memory) を参照してください。

<h3 id="does-memory-persist-forever-what-are-the-limits">メモリはずっと保持されますか制限はありますか</h3>

メモリファイルはディスク上に保存され、削除するまで保持されます。制限はモデルではなく、
ストレージ容量です。ただし、**セッション context** は依然としてモデルの context window に制限されるため、
長い会話では compact または truncate が発生することがあります。そのため、
memory search が存在します。関連する部分だけをコンテキストに戻すためです。

ドキュメント: [Memory](/concepts/memory), [Context](/concepts/context)。

<h2 id="where-things-live-on-disk">データはディスク上のどこに存在しますか</h2>

<h3 id="is-all-data-used-with-openclaw-saved-locally">OpenClaw で使われるデータはすべてローカルに保存されますか</h3>

いいえ。**OpenClaw の 状態 はローカル**ですが、**送信先の外部サービスには、あなたが送った内容が引き続き見えます**。

- **デフォルトではローカル:** セッション、memory files、設定、ワークスペース は ゲートウェイ ホスト上にあります
  （`~/.openclaw` とあなたの ワークスペース ディレクトリ）。
- **必然的にリモート:** モデル プロバイダー（Anthropic/OpenAI など）に送るメッセージは
  それらの API に送信され、chat platform（WhatsApp/Telegram/Slack など）は message data を
  それらのサーバーに保存します。
- **影響範囲は自分で制御可能:** ローカルモデルs を使えば prompts はあなたのマシン上に残りますが、チャネル
  traffic は依然としてその チャネル のサーバーを経由します。

関連: [Agent ワークスペース](/concepts/agent-workspace), [Memory](/concepts/memory).

<h3 id="where-does-openclaw-store-its-data">OpenClaw はどこにデータを保存しますか</h3>

すべては `$OPENCLAW_STATE_DIR`（デフォルト: `~/.openclaw`）配下に保存されます。

| Path                                                            | Purpose                                                             |
| --------------------------------------------------------------- | ------------------------------------------------------------------- |
| `$OPENCLAW_STATE_DIR/openclaw.json`                             | メイン設定（JSON5）                                                 |
| `$OPENCLAW_STATE_DIR/認証情報/oauth.json`                    | 従来の OAuth import（初回利用時に 認証プロファイル へコピー）          |
| `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | 認証プロファイル（OAuth、API キー、任意の `keyRef`/`tokenRef`）        |
| `$OPENCLAW_STATE_DIR/secrets.json`                              | `file` SecretRef プロバイダー 用の任意の file-backed secret payload     |
| `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | 後方互換のための従来ファイル（静的な `api_key` entries は除去済み） |
| `$OPENCLAW_STATE_DIR/認証情報/`                              | プロバイダー 状態（例: `whatsapp/<accountId>/creds.json`）             |
| `$OPENCLAW_STATE_DIR/agents/`                                   | エージェント ごとの 状態（agentDir + セッション）                           |
| `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | 会話履歴と 状態（エージェント ごと）                                      |
| `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | セッション metadata（エージェント ごと）                                      |

従来の単一 エージェント パス: `~/.openclaw/agent/*`（`openclaw doctor` により移行）。

あなたの **ワークスペース**（AGENTS.md、memory files、スキル など）は別管理で、`agents.defaults.workspace` により設定されます（デフォルト: `~/.openclaw/workspace`）。

<h3 id="where-should-agentsmd-soulmd-usermd-memorymd-live">AGENTS.md SOUL.md USER.md MEMORY.md はどこに置くべきですか</h3>

これらのファイルは `~/.openclaw` ではなく、**エージェント ワークスペース** に置きます。

- **Workspace（エージェント ごと）**: `AGENTS.md`、`SOUL.md`、`IDENTITY.md`、`USER.md`、
  `MEMORY.md`（または `memory.md`）、`memory/YYYY-MM-DD.md`、任意で `HEARTBEAT.md`。
- **State dir（`~/.openclaw`）**: 設定、認証情報、認証プロファイル、セッション、logs、
  および共有 スキル（`~/.openclaw/skills`）。

デフォルトの ワークスペース は `~/.openclaw/workspace` で、次の設定で変更できます。

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

再起動後に ボット が「忘れる」場合は、毎回同じ ワークスペースを使って ゲートウェイを起動しているか確認してください（加えて、リモートモード では **ゲートウェイホスト側の** ワークスペース が使われ、ローカル ラップトップ 側ではない点にも注意してください）。

ヒント: 永続化したい振る舞いや設定があるなら、chat 履歴 に頼るのではなく、ボット に **AGENTS.md または MEMORY.md に書き込ませる** のがおすすめです。

[Agent ワークスペース](/concepts/agent-workspace) と [Memory](/concepts/memory) も参照してください。

<h3 id="whats-the-recommended-backup-strategy">推奨されるバックアップ戦略は何ですか</h3>

**エージェント ワークスペース** を **private** な git repo に置き、どこか非公開の場所
（たとえば GitHub private）へバックアップしてください。これにより memory と AGENTS/SOUL/USER
files を保持でき、後で assistant の「mind」を復元できます。

`~/.openclaw` 配下のもの（認証情報、セッション、tokens、または暗号化された secrets payload）を commit してはいけません。
完全復元が必要なら、ワークスペース と 状態ディレクトリ の両方を別々に
バックアップしてください（上の migration に関する質問を参照）。

ドキュメント: [Agent ワークスペース](/concepts/agent-workspace).

<h3 id="how-do-i-completely-uninstall-openclaw">OpenClaw を完全にアンインストールするにはどうすればよいですか</h3>

専用ガイドを参照してください: [Uninstall](/install/uninstall).

<h3 id="can-agents-work-outside-the-workspace">エージェントはワークスペースの外側でも動作できますか</h3>

はい。ワークスペース は **デフォルトの cwd** および memory anchor であり、厳格な sandbox ではありません。
relative paths は ワークスペース 内で解決されますが、sandboxing が有効でなければ absolute paths で他の
host 上の場所にもアクセスできます。分離が必要な場合は、
[`agents.defaults.sandbox`](/gateway/sandboxing) または エージェント ごとの sandbox 設定を使用してください。repo をデフォルトの作業ディレクトリにしたい場合は、その エージェント の
`workspace` を repo root に向けてください。OpenClaw repo は単なる source code です。意図的にその中で エージェント を動かしたい場合を除き、ワークスペース は分けておいてください。

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

<h3 id="im-in-remote-mode-where-is-the-session-store">リモートモードではセッションストアはどこにありますか</h3>

セッション 状態 を保持するのは **ゲートウェイホスト** です。リモートモード の場合、確認すべき セッションストア はローカル ラップトップ ではなく リモートマシン 側にあります。[Session management](/concepts/session) を参照してください。

<h2 id="config-basics">設定の基本</h2>

<h3 id="what-format-is-the-config-where-is-it">設定ファイルの形式と場所は何ですか</h3>

OpenClaw は、`$OPENCLAW_CONFIG_PATH`（デフォルト: `~/.openclaw/openclaw.json`）から任意の **JSON5** 設定を読み込みます。

```
$OPENCLAW_CONFIG_PATH
```

このファイルが存在しない場合は、安全寄りのデフォルト設定が使われます（デフォルトのワークスペース `~/.openclaw/workspace` を含みます）。

<h3 id="i-set-gatewaybind-lan-or-tailnet-and-now-nothing-listens-the-ui-says-unauthorized">`gateway.bind` を `lan` または `tailnet` に設定したら何も待ち受けず、UI に `unauthorized` と表示されます</h3>

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

- `gateway.remote.token` / `.password` だけでは、ローカル ゲートウェイ の 認証は有効になりません。
- `gateway.auth.*` が未設定の場合、ローカルの呼び出し経路ではフォールバックとして `gateway.remote.*` を使用できます。
- Control UI は `connect.params.auth.token`（app/UI 設定に保存）で認証します。URL に トークンを含めるのは避けてください。

<h3 id="why-do-i-need-a-token-on-localhost-now">localhost でも トークンが必要になったのはなぜですか</h3>

OpenClaw は、ループバックを含めてデフォルトで token 認証を強制します。トークンが設定されていない場合、ゲートウェイ の起動時に自動生成されて `gateway.auth.token` に保存されるため、**ローカルの WS クライアントも認証が必要** です。これにより、他のローカルプロセスが ゲートウェイを呼び出すことを防ぎます。

本当にループバックを開放したい場合は、設定で `gateway.auth.mode: "none"` を明示的に指定してください。Doctor はいつでも トークンを生成できます: `openclaw doctor --generate-gateway-token`。

<h3 id="do-i-have-to-restart-after-changing-config">設定変更後に再起動は必要ですか</h3>

ゲートウェイ は設定ファイルを監視しており、hot-reload をサポートしています。

- `gateway.reload.mode: "hybrid"`（デフォルト）: 安全な変更は hot-apply し、重要な変更は再起動します
- `hot`、`restart`、`off` もサポートされています

<h3 id="how-do-i-disable-funny-cli-taglines">CLI の面白いタグラインを無効にするにはどうすればよいですか</h3>

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

<h3 id="how-do-i-enable-web-search-and-web-fetch">web search と web fetch を有効にするにはどうすればよいですか</h3>

`web_fetch` は API キー なしで動作します。`web_search` には Brave Search API
key が必要です。**推奨:** `openclaw configure --section web` を実行して、
`tools.web.search.apiKey` に保存してください。環境変数を使う場合は、ゲートウェイ
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

<h3 id="how-do-i-run-a-central-gateway-with-specialized-workers-across-devices">複数デバイスにまたがって、専用ワーカーを備えた中央ゲートウェイを実行するにはどうすればよいですか</h3>

一般的な構成は、**1 つの ゲートウェイ**（例: Raspberry Pi）に **ノード** と **エージェント** を組み合わせる形です。

- **ゲートウェイ (central):** チャネル（Signal/WhatsApp）、routing、セッション を管理します。
- **Nodes (devices):** Mac、iOS、Android などが周辺デバイスとして接続し、ローカル tools（`system.run`、`canvas`、`camera`）を公開します。
- **Agents (workers):** 特定の役割向けに分離された brain/ワークスペース です（例: "Hetzner ops"、"Personal data"）。
- **Sub-エージェント:** 並列化したいときに、メイン エージェント からバックグラウンド作業を spawn します。
- **TUI:** ゲートウェイに接続し、エージェント や セッション を切り替えます。

ドキュメント: [Nodes](/nodes), [Remote access](/gateway/remote), [Multi-Agent Routing](/concepts/multi-agent), [Sub-エージェント](/tools/subagents), [TUI](/web/tui)。

<h3 id="can-the-openclaw-browser-run-headless">OpenClaw ブラウザはヘッドレスで実行できますか</h3>

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

デフォルトは `false`（headful）です。ヘッドレス は、一部のサイトで anti-ボット チェックを誘発しやすくなります。詳細は [Browser](/tools/browser) を参照してください。

ヘッドレス は **同じ Chromium engine** を使用し、ほとんどの自動化（フォーム入力、クリック、スクレイピング、ログイン）で動作します。主な違いは次のとおりです。

- ブラウザウィンドウは表示されません（見た目を確認したい場合は screenshot を使用してください）。
- ヘッドレス モードでは、一部のサイトが自動化に対してより厳格になります（CAPTCHA、anti-ボット）。
  たとえば、X/Twitter は ヘッドレス セッション をブロックすることがよくあります。

<h3 id="how-do-i-use-brave-for-browser-control">ブラウザ制御に Brave を使うにはどうすればよいですか</h3>

`browser.executablePath` を Brave のバイナリ（または任意の Chromium-based browser）に設定し、ゲートウェイを再起動してください。
設定例の全体は [Browser](/tools/browser#use-brave-or-another-chromium-based-browser) を参照してください。

<h2 id="remote-gateways-and-nodes">リモートゲートウェイとノード</h2>

<h3 id="how-do-commands-propagate-between-telegram-the-gateway-and-nodes">Telegram、ゲートウェイ、ノードの間でコマンドはどのように伝播しますか</h3>

Telegram メッセージは **ゲートウェイ** によって処理されます。ゲートウェイ は エージェント を実行し、
ノード tool が必要になった場合にのみ **ゲートウェイ WebSocket** 経由で ノード を呼び出します:

Telegram → ゲートウェイ → Agent → `node.*` → Node → ゲートウェイ → Telegram

ノード は受信側 プロバイダー トラフィックを見ることはなく、受け取るのは ノード RPC call のみです。

<h3 id="how-can-my-agent-access-my-computer-if-the-gateway-is-hosted-remotely">ゲートウェイがリモートでホストされている場合、エージェントから自分のコンピュータにアクセスするにはどうすればよいですか</h3>

短い答え: **自分のコンピュータを ノード としてペアリングしてください**。ゲートウェイ 自体は別の場所で動作していても、
ゲートウェイ WebSocket 経由でローカルマシン上の `node.*` tools（screen、camera、system）を呼び出せます。

一般的なセットアップ:

1. 常時稼働する host（VPS / home server）で ゲートウェイを実行します。
2. ゲートウェイホスト と自分のコンピュータを同じ tailnet に参加させます。
3. ゲートウェイ WS に到達できることを確認します（tailnet bind または SSH tunnel）。
4. ローカルで macOS app を開き、**Remote over SSH** mode（または direct tailnet）で接続して、
   ノード として登録できるようにします。
5. ゲートウェイ 上で ノード を承認します:

   ```bash
   openclaw devices list
   openclaw devices approve <requestId>
   ```

別個の TCP bridge は不要です。ノード は ゲートウェイ WebSocket 経由で接続します。

セキュリティ上の注意: macOS ノード をペアリングすると、そのマシンで `system.run` が可能になります。信頼できる device のみをペアリングし、[Security](/gateway/security) を確認してください。

Docs: [Nodes](/nodes), [ゲートウェイ protocol](/gateway/protocol), [macOS リモートモード](/platforms/mac/remote), [Security](/gateway/security).

<h3 id="tailscale-is-connected-but-i-get-no-replies-what-now">Tailscale は接続済みなのに返信が来ません。どうすればよいですか</h3>

まず基本項目を確認してください:

- ゲートウェイが実行中であること: `openclaw gateway status`
- ゲートウェイ の health: `openclaw status`
- チャネル の health: `openclaw channels status`

次に auth と routing を確認します:

- Tailscale Serve を使っている場合は、`gateway.auth.allowTailscale` が正しく設定されていることを確認します。
- SSH tunnel 経由で接続している場合は、ローカル tunnel が起動しており、正しい port を向いていることを確認します。
- allowlist（DM または group）に自分の account が含まれていることを確認します。

Docs: [Tailscale](/gateway/tailscale), [Remote access](/gateway/remote), [Channels](/channels).

<h3 id="can-two-openclaw-instances-talk-to-each-other-local-vps">ローカル環境と VPS 上の 2 つの OpenClaw インスタンスを相互に通信させることはできますか</h3>

はい。組み込みの "ボット-to-ボット" bridge はありませんが、いくつかの信頼できる方法で接続できます。

**最も簡単な方法:** 両方の ボット がアクセスできる通常の chat チャネル（Telegram / Slack / WhatsApp）を使います。
Bot A から Bot B にメッセージを送り、その後は通常どおり Bot B に返信させます。

**CLI bridge（汎用）:** `openclaw agent --message ... --deliver` を使って相手側 ゲートウェイを呼び出す script を実行し、
相手の ボット が 待ち受けている chat を target にします。片方の ボット がリモート VPS 上にある場合は、
SSH / Tailscale 経由で CLI をそのリモート ゲートウェイに向けてください（[Remote access](/gateway/remote) を参照）。

Example pattern（target ゲートウェイに到達できるマシンから実行）:

```bash
openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
```

ヒント: 2 つの ボット が無限 loop しないように guardrail を追加してください（mention-only、チャネル allowlists、または "do not 返信 to ボット messages" ルール）。

Docs: [Remote access](/gateway/remote), [Agent CLI](/cli/agent), [Agent send](/tools/agent-send).

<h3 id="do-i-need-separate-vpses-for-multiple-agents">複数のエージェント用に別々の VPS は必要ですか</h3>

いいえ。1 つの ゲートウェイ で複数の エージェント をホストでき、それぞれに独自の ワークスペース、モデル defaults、routing を持たせられます。これが通常の構成であり、エージェント ごとに VPS を 1 台ずつ動かすよりも、はるかに低コストでシンプルです。

別々の VPS が必要になるのは、強い分離（security boundary）が必要な場合や、共有したくない大きく異なる 設定 がある場合だけです。それ以外は、1 つの ゲートウェイを維持して複数の エージェント または sub-エージェント を使ってください。

<h3 id="is-there-a-benefit-to-using-a-node-on-my-personal-laptop-instead-of-ssh-from-a-vps">VPS から SSH する代わりに、個人用ラップトップ上のノードを使う利点はありますか</h3>

あります。リモート ゲートウェイ から ラップトップ に到達する第一級の方法は ノード であり、shell access 以上のことが可能になります。ゲートウェイ は macOS / Linux（Windows は WSL2 経由）で動作し、軽量です（小さな VPS や Raspberry Pi 級の box で十分で、4 GB RAM あれば余裕があります）。そのため、常時稼働 host と ラップトップ 上の ノード を組み合わせる構成が一般的です。

- **インバウンド SSH が不要です。** ノード は ゲートウェイ WebSocket に outbound 接続し、device pairing を使います。
- **より安全な実行制御。** `system.run` はその ラップトップ 上の ノード allowlists / approvals によって制御されます。
- **より多くの device tools。** ノード は `system.run` に加えて `canvas`、`camera`、`screen` を公開します。
- **ローカル browser automation。** ゲートウェイ は VPS 上に置いたまま、Chrome はローカルで動かし、Chrome extension と ラップトップ 上の ノード host で制御を中継できます。

SSH は一時的な shell access には問題ありませんが、継続的な エージェント workflow や device automation には ノード の方がシンプルです。

Docs: [Nodes](/nodes), [Nodes CLI](/cli/nodes), [Chrome extension](/tools/chrome-extension).

<h3 id="should-i-install-on-a-second-laptop-or-just-add-a-node">2 台目のラップトップにはインストールすべきですか。それともノードを追加するだけでよいですか</h3>

2 台目の ラップトップ で必要なのが **local tools**（screen / camera / exec）だけなら、**ノード** として追加してください。これにより、ゲートウェイを 1 つに保ちつつ、設定 の重複を避けられます。local ノード tools は現在 macOS のみ対応ですが、今後ほかの OS にも拡張する予定です。

2 つ目の ゲートウェイをインストールするのは、**強い分離** が必要な場合、または完全に独立した 2 つの ボット が必要な場合だけです。

Docs: [Nodes](/nodes), [Nodes CLI](/cli/nodes), [Multiple gateways](/gateway/multiple-gateways).

<h3 id="do-nodes-run-a-gateway-service">ノードはゲートウェイサービスを実行しますか</h3>

いいえ。host ごとに実行すべき ゲートウェイ は通常 **1 つだけ** です。意図的に分離プロファイルを動かす場合を除きます（[Multiple gateways](/gateway/multiple-gateways) を参照）。ノード は ゲートウェイに接続する peripheral です（iOS / Android ノード、または menubar app の macOS "ノード mode"）。ヘッドレス ノード host や CLI control については、[Node host CLI](/cli/node) を参照してください。

`gateway`、`discovery`、`canvasHost` の変更には完全な restart が必要です。

<h3 id="is-there-an-api-rpc-way-to-apply-config">設定を適用する API / RPC の方法はありますか</h3>

はい。`config.apply` はフル 設定 を検証して書き込み、その処理の一部として ゲートウェイを再起動します。

<h3 id="configapply-wiped-my-config-how-do-i-recover-and-avoid-this">`config.apply` で設定が消えました。復旧と再発防止の方法はありますか</h3>

`config.apply` は **設定 全体** を置き換えます。部分的な object を送ると、それ以外はすべて削除されます。

復旧方法:

- backup（git またはコピーしておいた `~/.openclaw/openclaw.json`）から復元します。
- backup がない場合は、`openclaw doctor` を再実行して チャネル / モデル を再設定します。
- 想定外の動作だった場合は bug を報告し、最後に把握していた 設定 または任意の backup を添付してください。
- ローカルの coding エージェント であれば、logs や 履歴 から動作する 設定 を再構築できることがよくあります。

再発防止:

- 小さな変更には `openclaw config set` を使います。
- 対話的な編集には `openclaw configure` を使います。

Docs: [Config](/cli/config), [Configure](/cli/configure), [Doctor](/gateway/doctor).

<h3 id="whats-a-minimal-sane-config-for-a-first-install">初回インストール向けの最小限で妥当な設定は何ですか</h3>

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

これは ワークスペースを設定し、誰が ボット を起動できるかを制限します。

<h3 id="how-do-i-set-up-tailscale-on-a-vps-and-connect-from-my-mac">VPS 上で Tailscale を設定し、Mac から接続するにはどうすればよいですか</h3>

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
   - ゲートウェイ WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

SSH なしで Control UI を使いたい場合は、VPS 上で Tailscale Serve を使います:

```bash
openclaw gateway --tailscale serve
```

これにより ゲートウェイ は loopback に bind されたままとなり、Tailscale 経由で HTTPS が公開されます。詳細は [Tailscale](/gateway/tailscale) を参照してください。

<h3 id="how-do-i-connect-a-mac-node-to-a-remote-gateway-tailscale-serve">Mac ノードをリモートゲートウェイの Tailscale Serve に接続するにはどうすればよいですか</h3>

Serve は **ゲートウェイ Control UI + WS** を公開します。ノード は同じ ゲートウェイ WS endpoint 経由で接続します。

推奨セットアップ:

1. **VPS と Mac が同じ tailnet に参加していることを確認します**。
2. **macOS app を Remote mode で使います**（SSH target には tailnet hostname を指定できます）。
   app が ゲートウェイ port を tunnel し、ノード として接続します。
3. **ゲートウェイ 上で ノード を承認します**:

   ```bash
   openclaw devices list
   openclaw devices approve <requestId>
   ```

Docs: [ゲートウェイ protocol](/gateway/protocol), [Discovery](/gateway/discovery), [macOS リモートモード](/platforms/mac/remote).

<h2 id="env-vars-and-env-loading">環境変数と .env の読み込み</h2>

<h3 id="how-does-openclaw-load-environment-variables">OpenClaw は環境変数をどのように読み込みますか</h3>

OpenClaw は親プロセス（shell、launchd/systemd、CI など）から環境変数を読み取り、さらに以下も読み込みます。

- 現在の作業ディレクトリの `.env`
- `~/.openclaw/.env` にあるグローバルなフォールバック用の `.env`（別名 `$OPENCLAW_STATE_DIR/.env`）

どちらの `.env` ファイルも、既存の環境変数を上書きしません。

設定ではインラインの環境変数も定義できます（プロセス環境に存在しない場合のみ適用されます）。

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

完全な優先順位と読み込み元については [/environment](/help/environment) を参照してください。

<h3 id="i-started-the-gateway-via-the-service-and-my-env-vars-disappeared-what-now">サービス経由でゲートウェイを起動したら環境変数が消えましたどうすればよいですか</h3>

よくある対処法は 2 つあります。

1. 不足しているキーを `~/.openclaw/.env` に追加して、サービス が shell の環境変数を継承しない場合でも読み込まれるようにします。
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

<h3 id="i-set-copilotgithubtoken-but-models-status-shows-shell-env-off-why">`COPILOT_GITHUB_TOKEN` を設定したのに、モデル status に Shell env off と表示されるのはなぜですか</h3>

`openclaw models status` は、**shell env import** が有効かどうかを表示します。`"Shell env: off"`
は **環境変数がない** ことを意味するのではなく、OpenClaw が login shell を自動では読み込まないことを意味します。

ゲートウェイが サービス（launchd/systemd）として動作している場合、shell の
environment は継承されません。次のいずれかで対処してください。

1. トークンを `~/.openclaw/.env` に記述します。

   ```
   COPILOT_GITHUB_TOKEN=...
   ```

2. または shell import を有効にします（`env.shellEnv.enabled: true`）。
3. または 設定 の `env` ブロックに追加します（存在しない場合のみ適用されます）。

その後、ゲートウェイを再起動して再確認してください。

```bash
openclaw models status
```

Copilot トークンは `COPILOT_GITHUB_TOKEN`（`GH_TOKEN` / `GITHUB_TOKEN` も可）から読み取られます。
[/concepts/モデル-プロバイダー](/concepts/model-providers) および [/environment](/help/environment) を参照してください。

<h2 id="sessions-and-multiple-chats">セッションと複数チャット</h2>

<h3 id="how-do-i-start-a-fresh-conversation">新しい会話を開始するにはどうすればよいですか</h3>

単独のメッセージとして `/new` または `/reset` を送信してください。[セッション管理](/concepts/session) を参照してください。

<h3 id="do-sessions-reset-automatically-if-i-never-send-new">新しいメッセージを一度も送らなかった場合、セッションは自動的にリセットされますか</h3>

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

<h3 id="is-there-a-way-to-make-a-team-of-openclaw-instances-one-ceo-and-many-agents">OpenClaw インスタンスのチームを作り、1 人を CEO、複数をエージェントにする方法はありますか</h3>

はい。**マルチエージェントルーティング** と **sub-エージェント** を使います。1 つのコーディネーター
エージェントと、それぞれ独自のワークスペースとモデルを持つ複数のワーカーエージェントを
作成できます。

とはいえ、これは **楽しい実験** として捉えるのが適切です。トークン消費が大きく、多くの場合
1 つの ボット を別々のセッションで使うより効率は下がります。私たちが典型的に想定しているのは、
会話相手は 1 つの ボット で、並列作業には異なるセッションを使う形です。その ボット は必要に応じて
sub-エージェント を起動することもできます。

Docs: [Multi-エージェント routing](/concepts/multi-agent), [Sub-エージェント](/tools/subagents), [Agents CLI](/cli/agents).

<h3 id="why-did-context-get-truncated-midtask-how-do-i-prevent-it">タスクの途中でコンテキストが切り詰められました。どうすれば防げますか</h3>

セッションのコンテキストはモデルのウィンドウサイズに制限されます。長いチャット、大きなツール出力、
多数のファイルは、圧縮や切り詰めの原因になります。

効果がある方法:

- ボット に現在の状態を要約させて、ファイルに書き出してもらう。
- 長い作業の前に `/compact` を使い、話題を切り替えるときは `/new` を使う。
- 重要なコンテキストはワークスペース内に置き、ボット に再読込させる。
- 長時間または並列の作業では sub-エージェント を使い、メインチャットを小さく保つ。
- 頻繁に起こる場合は、より大きなコンテキストウィンドウを持つモデルを選ぶ。

<h3 id="how-do-i-completely-reset-openclaw-but-keep-it-installed">OpenClaw をインストールしたまま完全にリセットするにはどうすればよいですか</h3>

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
- プロファイル（`--profile` / `OPENCLAW_PROFILE`）を使用している場合は、各 状態 dir（デフォルトは `~/.openclaw-<profile>`）をリセットしてください。
- Dev reset: `openclaw gateway --dev --reset`（開発専用。開発用の 設定、認証情報、セッション、ワークスペースを消去します）。

<h3 id="im-getting-context-too-large-errors-how-do-i-reset-or-compact">context too large エラーが出ます。リセットまたは compact するにはどうすればよいですか</h3>

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

- **セッション pruning**（`agents.defaults.contextPruning`）を有効化または調整して、古いツール出力を削減する。
- より大きなコンテキストウィンドウを持つモデルを使う。

Docs: [Compaction](/concepts/compaction), [Session pruning](/concepts/session-pruning), [Session management](/concepts/session).

<h3 id="why-am-i-seeing-llm-request-rejected-messages-content-tool-use-input-field-required">なぜ "LLM request rejected: messages.content.tool_use.input field required" と表示されるのですか</h3>

これは プロバイダー の検証エラーです。モデルが、必須の `input` を持たない `tool_use` ブロックを
出力しています。通常はセッション履歴が古い、または破損していることを意味します（長いスレッドや
tool/schema の変更後によく起こります）。

対処方法: `/new` を単独メッセージとして送信し、新しいセッションを開始してください。

<h3 id="why-am-i-getting-heartbeat-messages-every-30-minutes">30 分ごとに heartbeat メッセージが送られてくるのはなぜですか</h3>

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

<h3 id="do-i-need-to-add-a-bot-account-to-a-whatsapp-group">WhatsApp グループにボットアカウントを追加する必要はありますか</h3>

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

<h3 id="how-do-i-get-the-jid-of-a-whatsapp-group">WhatsApp グループの JID を取得するにはどうすればよいですか</h3>

方法 1（最速）: ログを tail しながら、そのグループでテストメッセージを送信します。

```bash
openclaw logs --follow --json
```

`@g.us` で終わる `chatId`（または `from`）を探してください。例:
`1234567890-1234567890@g.us`。

方法 2（すでに設定済み / allowlist 済みの場合）: 設定 からグループ一覧を表示します。

```bash
openclaw directory groups list --channel whatsapp
```

Docs: [WhatsApp](/channels/whatsapp), [Directory](/cli/directory), [Logs](/cli/logs).

<h3 id="why-doesnt-openclaw-reply-in-a-group">グループで OpenClaw が返信しないのはなぜですか</h3>

よくある原因は 2 つあります。

- メンションゲーティングが有効です（デフォルト）。ボット を @mention する必要があります（または `mentionPatterns` に一致させる必要があります）。
- `channels.whatsapp.groups` を `"*"` なしで設定しており、そのグループが allowlist に入っていません。

[Groups](/channels/groups) と [Group messages](/channels/group-messages) を参照してください。

<h3 id="do-groups-threads-share-context-with-dms">グループ / スレッドは DM とコンテキストを共有しますか</h3>

ダイレクトチャットはデフォルトでメインセッションに集約されます。グループ / チャンネルは独自のセッションキーを持ち、
Telegram のトピック / Discord のスレッドは別セッションです。[Groups](/channels/groups) と
[Group messages](/channels/group-messages) を参照してください。

<h3 id="how-many-workspaces-and-agents-can-i-create">作成できるワークスペースとエージェントの数はいくつですか</h3>

厳密な上限はありません。数十、場合によっては数百でも問題ありませんが、以下には注意してください。

- **Disk growth:** セッション と transcripts は `~/.openclaw/agents/<agentId>/sessions/` に保存されます。
- **Token cost:** エージェント が増えるほど、同時に使うモデル量も増えます。
- **Ops overhead:** エージェント ごとの 認証プロファイル、ワークスペース、チャネル routing の管理負荷が増えます。

ヒント:

- エージェント ごとに **active** な ワークスペースを 1 つに保つ（`agents.defaults.workspace`）。
- ディスク使用量が増えたら、古い セッション を prune する（JSONL または store entries を削除する）。
- `openclaw doctor` を使って、孤立した ワークスペース や プロファイル の不一致を見つける。

<h3 id="can-i-run-multiple-bots-or-chats-at-the-same-time-slack-and-how-should-i-set-that-up">複数のボットやチャットを同時に実行できますか。Slack ではどう設定すべきですか</h3>

はい。**Multi-Agent Routing** を使うことで、複数の独立した エージェント を実行し、受信メッセージを
チャネル / account / peer ごとに振り分けられます。Slack は チャネル としてサポートされており、
特定の エージェントにバインドできます。

ブラウザアクセスは強力ですが、「人間にできることを何でもできる」という意味ではありません。anti-ボット、
CAPTCHAs、MFA は依然として自動化を妨げる可能性があります。最も信頼性の高いブラウザ制御を行うには、
ブラウザを動かすマシン上で Chrome extension relay を使ってください（ゲートウェイ はどこに置いても構いません）。

ベストプラクティスの構成:

- 常時稼働する ゲートウェイホスト（VPS/Mac mini）。
- 役割ごとに 1 つの エージェント（bindings）。
- それらの エージェントにバインドされた Slack チャネル。
- 必要に応じて、extension relay（または ノード）経由のローカルブラウザ。

Docs: [Multi-Agent Routing](/concepts/multi-agent), [Slack](/channels/slack),
[Browser](/tools/browser), [Chrome extension](/tools/chrome-extension), [Nodes](/nodes).

<h2 id="models-defaults-selection-aliases-switching">Models: デフォルト、選択、aliases、切り替え</h2>

<h3 id="what-is-the-default-model">デフォルトモデルとは何ですか</h3>

OpenClaw のデフォルト モデル は、次に設定したものです。

```
agents.defaults.model.primary
```

Models は `provider/model` として参照されます（例: `anthropic/claude-opus-4-6`）。プロバイダー を省略すると、OpenClaw は現在、一時的な非推奨フォールバックとして `anthropic` を仮定しますが、それでも `provider/model` を**明示的に**設定するべきです。

<h3 id="what-model-do-you-recommend">どのモデルを推奨しますか</h3>

**推奨デフォルト:** あなたの プロバイダー stack で利用できる、最新世代で最も強力な モデル を使ってください。
**tool が有効な エージェント や信頼できない入力を扱う エージェント 向け:** コストよりも モデル の強さを優先してください。
**日常的な / 低リスクの chat 向け:** より安価なフォールバック モデル を使い、エージェント の役割ごとにルーティングしてください。

MiniMax M2.5 には専用ドキュメントがあります: [MiniMax](/providers/minimax) と
[Local モデル](/gateway/local-models)。

経験則としては、高リスクな作業には**支払える範囲で最高の モデル**を使い、日常的な
chat や要約にはより安価な モデル を使ってください。エージェント ごとに モデル をルーティングでき、長いタスクは sub-エージェント を使って並列化できます（各 sub-エージェント は トークンを消費します）。[Models](/concepts/models) と
[Sub-エージェント](/tools/subagents) を参照してください。

重要な警告: より弱い モデル や量子化を強くかけた モデル は、prompt
injection や安全でない動作に対して脆弱です。[Security](/gateway/security) を参照してください。

詳細は [Models](/concepts/models) を参照してください。

<h3 id="can-i-use-selfhosted-models-llamacpp-vllm-ollama">selfホスト型モデルs の llamacpp vLLM Ollama は使えますか</h3>

はい。ローカル server が OpenAI 互換 API を公開していれば、そこを指す custom プロバイダー を設定できます。Ollama は直接サポートされており、最も簡単な方法です。

セキュリティ上の注意: 小規模な モデル や大幅に量子化された モデル は、prompt
injection に対してより脆弱です。tools を使える ボット には、**大規模な モデル** を強く推奨します。
それでも小さな モデル を使いたい場合は、sandboxing と厳格な tool allowlist を有効にしてください。

ドキュメント: [Ollama](/providers/ollama), [Local モデル](/gateway/local-models),
[Model プロバイダー](/concepts/model-providers), [Security](/gateway/security),
[Sandboxing](/gateway/sandboxing)。

<h3 id="how-do-i-switch-models-without-wiping-my-config">設定を消さずにモデルを切り替えるにはどうすればよいですか</h3>

**モデル commands** を使うか、**モデル** フィールドだけを編集してください。設定 全体の置き換えは避けてください。

安全な方法:

- chat で `/model` を使う（手軽、セッション ごと）
- `openclaw models set ...`（モデル設定 だけを更新）
- `openclaw configure --section model`（interactive）
- `~/.openclaw/openclaw.json` の `agents.defaults.model` を編集

設定全体を置き換えるつもりがない限り、部分オブジェクトで `config.apply` を使うのは避けてください。
もし 設定 を上書きしてしまった場合は、backup から復元するか、`openclaw doctor` を再実行して修復してください。

ドキュメント: [Models](/concepts/models), [Configure](/cli/configure), [Config](/cli/config), [Doctor](/gateway/doctor)。

<h3 id="what-do-openclaw-flawd-and-krill-use-for-models">OpenClaw、Flawd、Krill はモデルに何を使っていますか</h3>

- これらの deployment はそれぞれ異なる場合があり、時間とともに変わる可能性があります。固定の プロバイダー 推奨はありません。
- 各 ゲートウェイ の現在の ランタイム 設定は `openclaw models status` で確認してください。
- セキュリティに敏感な / tool が有効な エージェントには、利用可能な最新世代で最も強力な モデル を使ってください。

<h3 id="how-do-i-switch-models-on-the-fly-without-restarting">再起動せずにその場でモデルを切り替えるにはどうすればよいですか</h3>

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

利用可能な モデル は `/model`、`/model list`、または `/model status` で一覧表示できます。

`/model`（および `/model list`）は、コンパクトな番号付き picker を表示します。番号で選択できます。

```
/model 3
```

プロバイダー 用の特定の 認証プロファイル を強制することもできます（セッション ごと）。

```
/model opus@anthropic:default
/model opus@anthropic:work
```

ヒント: `/model status` では、どの エージェント が active か、どの `auth-profiles.json` file が使われているか、次にどの 認証プロファイル が試されるかが表示されます。
また、利用可能な場合は、設定された プロバイダー endpoint（`baseUrl`）と API mode（`api`）も表示されます。

**プロファイル 付きで設定した pin を外すにはどうすればよいですか**

`@profile` suffix を**付けずに** `/model` を再実行してください。

```
/model anthropic/claude-opus-4-6
```

デフォルトに戻したい場合は、`/model` からそれを選ぶか、`/model <default provider/model>` を送信してください。
どの 認証プロファイル が active かは `/model status` で確認してください。

<h3 id="can-i-use-gpt-5-2-for-daily-tasks-and-codex-5-3-for-coding">日常作業には GPT 5.2、コーディングには Codex 5.3 を使えますか</h3>

はい。片方をデフォルトに設定し、必要に応じて切り替えてください。

- **手早い切り替え（セッション ごと）:** 日常作業には `/model gpt-5.2`、Codex OAuth を使った coding には `/model openai-codex/gpt-5.4`。
- **デフォルト + 切り替え:** `agents.defaults.model.primary` を `openai/gpt-5.2` に設定し、coding 時だけ `openai-codex/gpt-5.4` に切り替えます（逆でも構いません）。
- **Sub-エージェント:** coding タスクを、異なるデフォルト モデル を持つ sub-エージェントにルーティングします。

[Models](/concepts/models) と [Slash commands](/tools/slash-commands) を参照してください。

<h3 id="why-do-i-see-model-is-not-allowed-and-then-no-reply">Model is not allowed と表示され、その後返信がないのはなぜですか</h3>

`agents.defaults.models` が設定されている場合、それは `/model` と
セッション override に対する **allowlist** になります。その list にない モデル を選ぶと、次が返されます。

```
Model "provider/model" is not allowed. Use /model to list available models.
```

この error は、通常の 返信 の**代わりに**返されます。対処法: モデル を
`agents.defaults.models` に追加する、allowlist を削除する、または `/model list` にある モデル を選んでください。

<h3 id="why-do-i-see-unknown-model-minimaxminimaxm25">Unknown モデル minimax/MiniMax-M2.5 と表示されるのはなぜですか</h3>

これは **プロバイダー が設定されていない** ことを意味します（MiniMax プロバイダー 設定 または auth
プロファイル が見つからなかったため）、その モデル を解決できません。この検出を修正する対応は
**2026.1.12** に入っています（執筆時点では未リリース）。

修正チェックリスト:

1. **2026.1.12** に upgrade する（または source の `main` から実行する）うえで、ゲートウェイを再起動します。
2. MiniMax が設定されていることを確認します（ウィザード または JSON）、あるいは MiniMax API キー が env/認証プロファイル に存在して プロバイダー を注入できるようにします。
3. 正確な モデル id を使います（大文字小文字を区別します）: `minimax/MiniMax-M2.5` または
   `minimax/MiniMax-M2.5-highspeed`。
4. 次を実行します。

   ```bash
   openclaw models list
   ```

   そして list から選択します（または chat で `/model list` を使います）。

[MiniMax](/providers/minimax) と [Models](/concepts/models) を参照してください。

<h3 id="can-i-use-minimax-as-my-default-and-openai-for-complex-tasks">デフォルトに MiniMax、複雑なタスクには OpenAI を使えますか</h3>

はい。**MiniMax をデフォルト**にし、必要なときだけ **セッション ごと**に モデル を切り替えてください。
フォールバック は **errors** 用であり、「難しいタスク」用ではないため、`/model` か別の エージェント を使ってください。

**Option A: セッション ごとに切り替える**

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

**Option B: 別々の エージェント**

- Agent A のデフォルト: MiniMax
- Agent B のデフォルト: OpenAI
- エージェント ごとにルーティングするか、`/agent` を使って切り替える

ドキュメント: [Models](/concepts/models), [Multi-Agent Routing](/concepts/multi-agent), [MiniMax](/providers/minimax), [OpenAI](/providers/openai)。

<h3 id="are-opus-sonnet-gpt-builtin-shortcuts">opus sonnet gpt は builtin shortcuts ですか</h3>

はい。OpenClaw にはいくつかのデフォルト shorthand が含まれています（適用されるのは、その モデル が `agents.defaults.models` に存在する場合のみです）。

- `opus` → `anthropic/claude-opus-4-6`
- `sonnet` → `anthropic/claude-sonnet-4-6`
- `gpt` → `openai/gpt-5.4`
- `gpt-mini` → `openai/gpt-5-mini`
- `gemini` → `google/gemini-3.1-pro-preview`
- `gemini-flash` → `google/gemini-3-flash-preview`
- `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

同じ名前で独自の alias を設定した場合は、あなたの値が優先されます。

<h3 id="how-do-i-defineoverride-model-shortcuts-aliases">モデル shortcuts aliases を定義 / 上書きするにはどうすればよいですか</h3>

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

その後、`/model sonnet`（または対応していれば `/<alias>`）はその モデル ID に解決されます。

<h3 id="how-do-i-add-models-from-other-providers-like-openrouter-or-zai">OpenRouter や ZAI など他のプロバイダーのモデルを追加するにはどうすればよいですか</h3>

OpenRouter（従量課金; 多数の モデル）:

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

Z.AI（GLM モデル）:

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

プロバイダー/モデル を参照していても、必要な プロバイダー key が欠けている場合は、ランタイム auth error が発生します（例: `No API key found for provider "zai"`）。

**新しい エージェント を追加したあとに No API キー found for プロバイダー と表示される**

通常、これは**新しい エージェント**の 認証ストア が空であることを意味します。認証は エージェント ごとで、
保存先は次のとおりです。

```
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

対処方法:

- `openclaw agents add <id>` を実行し、ウィザード 中に 認証を設定する。
- または、メイン エージェント の `agentDir` にある `auth-profiles.json` を、新しい エージェント の `agentDir` にコピーする。

複数の エージェント で `agentDir` を使い回してはいけません。auth/セッション の衝突が発生します。

<h2 id="model-failover-and-all-models-failed">モデルのフェイルオーバーと「All モデル failed」</h2>

<h3 id="how-does-failover-work">failover はどのように動作しますか</h3>

failover は 2 段階で発生します。

1. 同一 プロバイダー 内での **認証プロファイル rotation**。
2. `agents.defaults.model.フォールバックs` 内の次のモデルへの **モデル フォールバック**。

失敗した プロファイル にはクールダウン（指数バックオフ）が適用されるため、プロバイダー が rate limit に達している場合や一時的に失敗している場合でも、OpenClaw は応答を継続できます。

<h3 id="what-does-this-error-mean">このエラーは何を意味しますか</h3>

```
No credentials found for profile "anthropic:default"
```

これは、システムが 認証プロファイル ID `anthropic:default` を使用しようとしたものの、想定される 認証ストア 内でその 認証情報 を見つけられなかったことを意味します。

<h3 id="fix-checklist-for-no-認証情報-found-for-profile-anthropicdefault">`No credentials found for profile "anthropic:default"` の修正チェックリスト</h3>

- **認証プロファイル の保存場所を確認する**（新しいパスか legacy path か）
  - Current: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Legacy: `~/.openclaw/agent/*`（`openclaw doctor` により移行）
- **env var が ゲートウェイに読み込まれていることを確認する**
  - シェルで `ANTHROPIC_API_KEY` を設定していても、ゲートウェイを systemd/launchd 経由で実行している場合は継承されないことがあります。`~/.openclaw/.env` に配置するか、`env.shellEnv` を有効にしてください。
- **正しい エージェント を編集していることを確認する**
  - multi-エージェント 構成では、`auth-profiles.json` が複数存在する場合があります。
- **モデル/auth の状態を簡易確認する**
  - `openclaw models status` を使うと、設定済みモデルと プロバイダー が認証済みかどうかを確認できます。

**No credentials found for profile anthropic の修正チェックリスト**

これは、その実行が Anthropic の 認証プロファイル に固定されている一方で、ゲートウェイが 認証ストア 内でそれを見つけられないことを意味します。

- **setup-トークンを使用する**
  - `claude setup-token` を実行し、その後 `openclaw models auth setup-token --provider anthropic` で貼り付けてください。
  - その トークンを別のマシンで作成した場合は、`openclaw models auth paste-token --provider anthropic` を使ってください。
- **代わりに API キー を使いたい場合**
  - **ゲートウェイホスト** 上の `~/.openclaw/.env` に `ANTHROPIC_API_KEY` を設定してください。
  - 存在しない プロファイル を強制する pinned order を解除してください。

    ```bash
    openclaw models auth order clear --provider anthropic
    ```

- **ゲートウェイホスト上でコマンドを実行していることを確認する**
  - リモートモード では、認証プロファイルは手元の ラップトップ ではなく ゲートウェイホスト 上に保存されます。

<h3 id="why-did-it-also-try-google-gemini-and-fail">なぜ Google Gemini も試行され、失敗したのですか</h3>

モデル設定に Google Gemini が フォールバック として含まれている場合（または Gemini の shorthand に切り替えた場合）、OpenClaw は モデル フォールバック 中にそれを試行します。Google の 認証情報 を設定していない場合は、`No API key found for provider "google"` が表示されます。

修正方法: Google 認証を設定するか、フォールバックがそちらへルーティングされないように、`agents.defaults.model.フォールバックs` / aliases から Google モデルを削除するか使用を避けてください。

**LLM request rejected message thinking signature required google antigravity**

原因: セッション履歴に **署名のない thinking blocks** が含まれています（中断されたストリームや不完全なストリームでよく発生します）。Google Antigravity では、thinking blocks に署名が必要です。

修正方法: OpenClaw は現在、Google Antigravity Claude 向けに署名のない thinking blocks を取り除きます。それでも発生する場合は、**新しいセッション** を開始するか、その エージェント で `/thinking off` を設定してください。

<h2 id="auth-profiles-what-they-are-and-how-to-manage-them">認証プロファイル: 概要と管理方法</h2>

関連: [/concepts/oauth](/concepts/oauth)（OAuth フロー、トークン保存、マルチアカウントのパターン）

<h3 id="what-is-an-auth-profile">認証プロファイルとは</h3>

認証プロファイルは、プロバイダーに紐づいた名前付きの認証情報レコード（OAuth または API キー）です。プロファイルは次の場所に保存されます。

```
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

<h3 id="what-are-typical-profile-ids">一般的なプロファイル ID は何ですか</h3>

OpenClaw では、次のような プロバイダー 接頭辞付き ID を使用します。

- `anthropic:default`（メール ID が存在しない場合によく使われます）
- OAuth ID 用の `anthropic:<email>`
- 自分で選択するカスタム ID（例: `anthropic:work`）

<h3 id="can-i-control-which-auth-profile-is-tried-first">最初に試行される認証プロファイルを制御できますか</h3>

はい。設定では、プロファイル 用の任意メタデータと、プロバイダーごとの順序（`auth.order.<provider>`）をサポートしています。これはシークレットを保存するものではなく、ID を プロバイダー / モードに対応付け、ローテーション順を設定するものです。

OpenClaw は、その プロファイル が短時間の **cooldown** 状態（レート制限、タイムアウト、認証失敗）または長めの **disabled** 状態（請求、クレジット不足）にある場合、一時的にその プロファイル をスキップすることがあります。これを確認するには、`openclaw models status --json` を実行し、`auth.unusableProfiles` を確認してください。調整項目: `auth.cooldowns.billingBackoffHours*`。

CLI を使うと、**エージェント単位** の順序 override（その エージェント の `auth-profiles.json` に保存されます）も設定できます。

```bash
# 設定済みのデフォルト agent を対象にします（--agent を省略）
openclaw models auth order get --provider anthropic

# ローテーションを 1 つの profile に固定します（これだけを試行）
openclaw models auth order set --provider anthropic anthropic:default

# または明示的な順序を設定します（provider 内で フォールバック）
openclaw models auth order set --provider anthropic anthropic:work anthropic:default

# override をクリアします（config の auth.order / round-robin にフォールバック）
openclaw models auth order clear --provider anthropic
```

特定の エージェント を対象にする場合:

```bash
openclaw models auth order set --provider anthropic --agent main anthropic:default
```

<h3 id="oauth-vs-api-key-whats-the-difference">OAuth と API キーの違いは何ですか</h3>

OpenClaw は両方をサポートしています。

- **OAuth** は、適用可能な場合、サブスクリプションのアクセスを活用することがよくあります。
- **API キー** は、トークン単位課金を使用します。

ウィザード は、Anthropic setup-token と OpenAI Codex OAuth を明示的にサポートしており、API キー も保存できます。

<h2 id="gateway-ports-already-running-and-remote-mode">ゲートウェイ: ポート、「already running」、およびリモートモード</h2>

<h3 id="what-port-does-the-gateway-use">ゲートウェイはどのポートを使用しますか</h3>

`gateway.port` は、WebSocket + HTTP（Control UI、hooks など）用の単一の多重化ポートを制御します。

優先順位:

```
--port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
```

<h3 id="why-does-openclaw-gateway-status-say-runtime-running-but-rpc-probe-failed">`openclaw ゲートウェイ status` で Runtime running と表示されるのに RPC probe failed になるのはなぜですか</h3>

これは「running」が **supervisor**（launchd/systemd/schtasks）から見た状態だからです。RPC probe は、CLI が実際に ゲートウェイ の WebSocket に接続して `status` を呼び出していることを意味します。

`openclaw gateway status` を使い、次の行を信頼してください:

- `Probe target:`（probe が実際に使用した URL）
- `Listening:`（そのポートで実際に bind されているもの）
- `Last gateway error:`（プロセスは生きているのにポートが 待ち受けていない場合によくある根本原因）

<h3 id="why-does-openclaw-gateway-status-show-config-cli-and-config-service-different">`openclaw ゲートウェイ status` で Config cli と Config サービスが異なって表示されるのはなぜですか</h3>

一方の設定ファイルを編集している一方で、サービスは別の設定ファイルを使って実行されています（多くは `--profile` / `OPENCLAW_STATE_DIR` の不一致です）。

対処:

```bash
openclaw gateway install --force
```

サービスに使わせたいものと同じ `--profile` / environment でこれを実行してください。

<h3 id="what-does-another-gateway-instance-is-already-listening-mean">another ゲートウェイインスタンス is already listening とは何を意味しますか</h3>

OpenClaw は、起動直後に WebSocket listener（デフォルトは `ws://127.0.0.1:18789`）を bind することで ランタイム lock を強制します。`EADDRINUSE` で bind に失敗すると、別の インスタンス がすでに 待ち受けていることを示す `GatewayLockError` を送出します。

対処: 別の インスタンス を停止する、ポートを解放する、または `openclaw gateway --port <port>` で実行してください。

<h3 id="how-do-i-run-openclaw-in-remote-mode-client-connects-to-a-gateway-elsewhere">OpenClaw をリモートモードで実行し、クライアントを別のゲートウェイに接続するにはどうすればよいですか</h3>

`gateway.mode: "remote"` を設定し、必要に応じて トークン / パスワード を付けた リモート WebSocket URL を指定してください:

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
- macOS app は設定ファイルを監視しており、これらの値が変わると ライブで モードを切り替えます。

<h3 id="the-control-ui-says-unauthorized-or-keeps-reconnecting-what-now">Control UI で `unauthorized` と表示される、または再接続を繰り返します。どうすればよいですか</h3>

ゲートウェイが auth 有効（`gateway.auth.*`）で動作していますが、UI が一致する トークン / パスワード を送信していません。

事実（コードより）:

- Control UI は トークンを、現在の ブラウザタブのセッション と選択中の ゲートウェイ URL に対して `sessionStorage` に保持します。そのため、同じ タブ内での refresh は引き続き動作しますが、長期保持のための `localStorage` token persistence は復元しません。

対処:

- 最速: `openclaw dashboard`（ダッシュボード URL を表示してコピーし、開こうとします。ヘッドレス なら SSH のヒントを表示します）。
- まだ トークンがない場合: `openclaw doctor --generate-gateway-token`。
- remote の場合は先に tunnel を張ります: `ssh -N -L 18789:127.0.0.1:18789 user@host` を実行してから `http://127.0.0.1:18789/` を開いてください。
- ゲートウェイホスト側で `gateway.auth.token`（または `OPENCLAW_GATEWAY_TOKEN`）を設定してください。
- Control UI の設定に、同じ トークンを貼り付けてください。
- まだ解決しない場合は、`openclaw status --all` を実行し、[Troubleshooting](/gateway/troubleshooting) に従ってください。auth の詳細は [Dashboard](/web/dashboard) を参照してください。

<h3 id="i-set-gatewaybind-tailnet-but-it-cant-bind-nothing-listens">`gateway.bind` を `tailnet` に設定したのにバインドできず、何も待ち受けません</h3>

`tailnet` bind は、network interface から Tailscale IP（100.64.0.0/10）を選びます。マシンが Tailscale に参加していない場合（または interface が down の場合）、bind 対象がありません。

対処:

- その host で Tailscale を起動する（100.x の address を持たせる）、または
- `gateway.bind: "loopback"` / `"lan"` に切り替えてください。

注意: `tailnet` は明示指定です。`auto` は loopback を優先します。tailnet 専用の bind を行いたい場合は `gateway.bind: "tailnet"` を使用してください。

<h3 id="can-i-run-multiple-gateways-on-the-same-host">同じ host 上で複数のゲートウェイを実行できますか</h3>

通常はできません。1 つの ゲートウェイ で複数の メッセージングチャネル と エージェント を実行できます。複数の ゲートウェイが必要なのは、冗長化（例: rescue ボット）または厳格な分離が必要な場合だけです。

ただし、次を分離すれば実行できます:

- `OPENCLAW_CONFIG_PATH`（インスタンス ごとの 設定）
- `OPENCLAW_STATE_DIR`（インスタンス ごとの state）
- `agents.defaults.workspace`（ワークスペース の分離）
- `gateway.port`（一意なポート）

クイックセットアップ（推奨）:

- インスタンス ごとに `openclaw --profile <name> …` を使ってください（`~/.openclaw-<name>` が自動作成されます）。
- 各 プロファイル 設定 で一意の `gateway.port` を設定してください（または手動実行時に `--port` を渡してください）。
- プロファイル ごとの サービス を install してください: `openclaw --profile <name> gateway install`。

プロファイルは サービス 名にも suffix を付けます（`ai.openclaw.<profile>`、legacy の `com.openclaw.*`、`openclaw-gateway-<profile>.service`、`OpenClaw Gateway (<profile>)`）。
完全なガイド: [Multiple gateways](/gateway/multiple-gateways)。

<h3 id="what-does-invalid-handshake-code-1008-mean">invalid handshake code 1008 とは何を意味しますか</h3>

ゲートウェイ は **WebSocket server** であり、最初のメッセージとして
`connect` frame が送られてくることを前提としています。それ以外を受信すると、
接続を **code 1008**（policy violation）で閉じます。

よくある原因:

- **HTTP** URL（`http://...`）を browser で開いてしまい、WS client を使っていない。
- port または path が間違っている。
- proxy または tunnel が auth header を削除したか、ゲートウェイ ではない request を送っている。

クイックフィックス:

1. WS URL を使ってください: `ws://<host>:18789`（HTTPS の場合は `wss://...`）。
2. WS port を通常の browser tab で開かないでください。
3. 認証が有効なら、`connect` frame に トークン / パスワード を含めてください。

CLI または TUI を使っている場合、URL は次のようになります:

```
openclaw tui --url ws://<host>:18789 --token <token>
```

protocol の詳細: [ゲートウェイ protocol](/gateway/protocol)。

<h2 id="logging-and-debugging">ログとデバッグ</h2>

<h3 id="where-are-logs">ログはどこにありますか</h3>

ファイルログ（構造化）:

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

`logging.file` で固定パスを設定できます。ファイルログレベルは `logging.level` で制御します。コンソールの詳細度は `--verbose` と `logging.consoleLevel` で制御します。

最速でログを追う方法:

```bash
openclaw logs --follow
```

サービス/スーパーバイザログ（ゲートウェイを launchd/systemd 経由で実行している場合）:

- macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` と `gateway.err.log`（既定: `~/.openclaw/logs/...`。プロファイル使用時は `~/.openclaw-<profile>/logs/...`）
- Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
- Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

詳細は [Troubleshooting](/gateway/troubleshooting#log-locations) を参照してください。

<h3 id="how-do-i-start-stop-restart-the-gateway-service">ゲートウェイサービスを開始/停止/再起動するには</h3>

ゲートウェイ ヘルパーを使用します:

```bash
openclaw gateway status
openclaw gateway restart
```

ゲートウェイを手動で実行している場合は、`openclaw gateway --force` でポートを再取得できます。詳細は [ゲートウェイ](/gateway) を参照してください。

<h3 id="i-closed-my-terminal-on-windows-how-do-i-restart-openclaw">Windows でターミナルを閉じてしまった場合 OpenClaw を再起動するには</h3>

Windows には **2 つのインストールモード** があります。

**1) WSL2（推奨）:** ゲートウェイ は Linux 内で動作します。

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

**2) ネイティブ Windows（非推奨）:** ゲートウェイ は Windows 上で直接動作します。

PowerShell を開いて次を実行します:

```powershell
openclaw gateway status
openclaw gateway restart
```

手動実行している場合（サービスなし）は、次を使用します:

```powershell
openclaw gateway run
```

ドキュメント: [Windows (WSL2)](/platforms/windows), [ゲートウェイ サービス runbook](/gateway).

<h3 id="the-gateway-is-up-but-replies-never-arrive-what-should-i-check">ゲートウェイは起動しているのに返信が届かない場合何を確認すべきですか</h3>

まずは簡易ヘルスチェックを実行してください:

```bash
openclaw status
openclaw models status
openclaw channels status
openclaw logs --follow
```

よくある原因:

- モデル認証情報が **ゲートウェイ ホスト** に読み込まれていない（`models status` を確認）。
- Channel のペアリング/許可リストにより返信がブロックされている（Channel 設定とログを確認）。
- WebChat/Dashboard が正しいトークンなしで開かれている。

リモート環境の場合は、トンネル/Tailscale 接続が有効であり、
ゲートウェイ の WebSocket に到達できることを確認してください。

ドキュメント: [Channels](/channels), [Troubleshooting](/gateway/troubleshooting), [Remote access](/gateway/remote).

<h3 id="disconnected-from-gateway-no-reason-what-now">ゲートウェイから理由なく切断された場合はどうすればよいですか</h3>

通常は、UI が WebSocket 接続を失ったことを意味します。次を確認してください:

1. ゲートウェイ は動作していますか。`openclaw gateway status`
2. ゲートウェイ は健全ですか。`openclaw status`
3. UI は正しいトークンを使用していますか。`openclaw dashboard`
4. リモート環境の場合、トンネル/Tailscale 接続は有効ですか。

その後、ログを追ってください:

```bash
openclaw logs --follow
```

ドキュメント: [Dashboard](/web/dashboard), [Remote access](/gateway/remote), [Troubleshooting](/gateway/troubleshooting).

<h3 id="telegram-setmycommands-fails-with-network-errors-what-should-i-check">Telegram の setMyCommands がネットワークエラーで失敗する場合何を確認すべきですか</h3>

まずはログと Channel ステータスを確認してください:

```bash
openclaw channels status
openclaw channels logs --channel telegram
```

VPS 上またはプロキシ配下で動かしている場合は、外向き HTTPS が許可され、DNS が機能していることを確認してください。
ゲートウェイがリモートにある場合は、ゲートウェイ ホスト上のログを見ていることを確認してください。

ドキュメント: [Telegram](/channels/telegram), [Channel troubleshooting](/channels/troubleshooting).

<h3 id="tui-shows-no-output-what-should-i-check">TUI に何も表示されない場合何を確認すべきですか</h3>

まず、ゲートウェイに到達でき、エージェントが実行可能であることを確認してください:

```bash
openclaw status
openclaw models status
openclaw logs --follow
```

TUI では、現在の状態を確認するために `/status` を使用します。チャット
Channel での返信を期待している場合は、配信が有効になっていることを確認してください（`/deliver on`）。

ドキュメント: [TUI](/web/tui), [Slash commands](/tools/slash-commands).

<h3 id="how-do-i-completely-stop-then-start-the-gateway">ゲートウェイを完全に停止してから再起動するには</h3>

サービスをインストールしている場合:

```bash
openclaw gateway stop
openclaw gateway start
```

これにより **監視対象サービス**（macOS では launchd、Linux では systemd）を停止/開始します。
ゲートウェイがバックグラウンドでデーモンとして動作している場合に使用してください。

フォアグラウンドで実行している場合は、Ctrl-C で停止してから次を実行します:

```bash
openclaw gateway run
```

ドキュメント: [ゲートウェイ サービス runbook](/gateway).

<h3 id="eli5-openclaw-gateway-restart-vs-openclaw-gateway">ELI5 openclaw ゲートウェイ restart と openclaw ゲートウェイの違い</h3>

- `openclaw gateway restart`: **バックグラウンドサービス**（launchd/systemd）を再起動します。
- `openclaw gateway`: このターミナルセッションで ゲートウェイを **フォアグラウンド** 実行します。

サービスをインストールしている場合は、ゲートウェイ コマンドを使用してください。一時的にフォアグラウンドで実行したい場合は `openclaw gateway` を使用します。

<h3 id="whats-the-fastest-way-to-get-more-details-when-something-fails">何かが失敗したときに最速で詳細を取得する方法は何ですか</h3>

コンソールの詳細を増やすには、`--verbose` を付けて ゲートウェイを起動します。その後、Channel 認証、モデルルーティング、RPC エラーを確認するためにログファイルを調べてください。

<h2 id="media-and-attachments">メディアと添付ファイル</h2>

<h3 id="my-skill-generated-an-imagepdf-but-nothing-was-sent">My スキル generated an image/PDF but nothing was sent</h3>

エージェントからの送信添付ファイルには、`MEDIA:<path-or-url>` 行を含める必要があります（その行だけで 1 行にしてください）。[OpenClaw assistant setup](/start/openclaw) と [Agent send](/tools/agent-send) を参照してください。

CLI での送信:

```bash
openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
```

以下も確認してください:

- 対象チャネルが送信メディアに対応しており、allowlist によってブロックされていないこと。
- ファイルがプロバイダーのサイズ上限内であること（画像は最大 2048px にリサイズされます）。

[Images](/nodes/images) も参照してください。

<h2 id="security-and-access-control">セキュリティとアクセス制御</h2>

<h3 id="is-it-safe-to-expose-openclaw-to-inbound-dms">OpenClaw を受信 DM に公開しても安全ですか</h3>

受信 DM は信頼できない入力として扱ってください。デフォルト設定は、リスクを減らすように設計されています。

- DM 対応チャネルでのデフォルト動作は **pairing** です:
  - 未知の送信者には ペアリングコード が送られ、ボット はそのメッセージを処理しません。
  - 承認コマンド: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
  - 保留中のリクエストは **チャネルごとに 3 件** までです。code が届いていない場合は `openclaw pairing list --channel <channel> [--account <id>]` を確認してください。
- DM を公開で開放するには、明示的な opt-in が必要です (`dmPolicy: "open"` と allowlist `"*"`）。

危険な DM ポリシーを検出するには `openclaw doctor` を実行してください。

<h3 id="is-prompt-injection-only-a-concern-for-public-bots">プロンプトインジェクションは公開ボットだけの懸念ですか</h3>

いいえ。プロンプトインジェクション は、ボット に DM を送れる相手だけではなく、**信頼できないコンテンツ** の問題です。
アシスタントが外部コンテンツ（web search/fetch、browser のページ、email、
docs、attachments、貼り付けられた logs）を読む場合、そのコンテンツには
モデルを乗っ取ろうとする命令が含まれている可能性があります。これは
**送信者があなただけである場合でも** 起こり得ます。

最大のリスクは tools が有効なときです。モデルがだまされて
コンテキストを漏えいさせたり、あなたに代わって tools を呼び出したりする可能性があります。影響範囲を抑えるには、次の対策を取ってください。

- 信頼できないコンテンツの要約には、read-only または tool-disabled の "reader" エージェント を使う
- tool-enabled エージェント では `web_search` / `web_fetch` / `browser` を無効にしておく
- sandboxing と厳格な tool allowlist を使う

詳細: [Security](/gateway/security)。

<h3 id="should-my-bot-have-its-own-email-github-account-or-phone-number">ボット専用の email、GitHub account、または phone number を持たせるべきですか</h3>

はい。ほとんどの構成では、その方が望ましいです。ボット を別の account や phone number で分離すると、
問題が起きた場合の blast radius を小さくできます。また、個人の account に影響を与えずに
認証情報 のローテーションや access の revoke をしやすくなります。

最初は小さく始めてください。本当に必要な tools と accounts にだけ access を与え、必要に応じて
後から拡張してください。

ドキュメント: [Security](/gateway/security), [Pairing](/channels/pairing)。

<h3 id="can-i-give-it-autonomy-over-my-text-messages-and-is-that-safe">自分の text messages に対する自律性を与えてもよいですかまたそれは安全ですか</h3>

個人のメッセージに対して完全な自律性を与えることは**推奨しません**。最も安全なパターンは次のとおりです。

- DM は **pairing mode** または厳格な allowlist のままにする。
- あなたの代わりにメッセージを送らせたい場合は、**別の number または account** を使う。
- 下書きを作らせ、**送信前に承認する**。

試す場合は、専用 account で行い、分離を保ってください。詳細は
[Security](/gateway/security) を参照してください。

<h3 id="can-i-use-cheaper-models-for-personal-assistant-tasks">個人アシスタント用途では、より安価なモデルを使えますか</h3>

はい。**ただし**、エージェント が chat-only で、入力が信頼できる場合に限ります。小さい tier は
instruction hijacking の影響を受けやすいため、tool-enabled エージェント や
信頼できないコンテンツを読む用途には避けてください。どうしても小さい モデル を使う必要があるなら、
tools を厳格に制限し、sandbox 内で実行してください。詳細は [Security](/gateway/security) を参照してください。

<h3 id="i-ran-start-in-telegram-but-didnt-get-a-pairing-code">Telegram で start を実行したのにペアリングコードが届きません</h3>

ペアリングコード が送られるのは、未知の送信者が ボット にメッセージを送り、
かつ `dmPolicy: "pairing"` が有効な場合**のみ**です。`/start` だけでは code は生成されません。

保留中のリクエストを確認してください:

```bash
openclaw pairing list telegram
```

すぐに access が必要な場合は、その送信者 id を allowlist に追加するか、その account で `dmPolicy: "open"` を設定してください。

<h3 id="whatsapp-will-it-message-my-contacts-how-does-pairing-work">WhatsApp で連絡先にメッセージを送りますか Pairing はどのように機能しますか</h3>

いいえ。WhatsApp のデフォルト DM ポリシーは **pairing** です。未知の送信者には ペアリングコード だけが送られ、
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

<h2 id="chat-commands-aborting-tasks-and-it-wont-stop">チャットコマンド、タスクの中断、「止まらない」場合</h2>

<h3 id="how-do-i-stop-internal-system-messages-from-showing-in-chat">チャットに内部システムメッセージが表示されないようにするには</h3>

内部メッセージやツールメッセージの多くは、そのセッションで **verbose** または **reasoning** が有効になっている場合にのみ表示されます。

表示されているチャットで、次を実行してください:

```
/verbose off
/reasoning off
```

それでもまだ表示が多い場合は、Control UI のセッション設定を確認し、verbose を **inherit** に設定してください。あわせて、設定 で `verboseDefault` が `on` に設定された ボット プロファイルを使用していないことも確認してください。

ドキュメント: [Thinking and verbose](/tools/thinking), [Security](/gateway/security#reasoning--verbose-output-in-groups)。

<h3 id="how-do-i-stopcancel-a-running-task">実行中のタスクを停止または中断するには</h3>

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

<h3 id="how-do-i-send-a-discord-message-from-telegram-crosscontext-messaging-denied">Telegram から Discord にメッセージを送ろうとすると Cross-context messaging denied になるのはなぜですか</h3>

OpenClaw はデフォルトで **cross-プロバイダー** メッセージングをブロックします。ツール呼び出しが Telegram に紐付いている場合、明示的に許可しない限り Discord には送信されません。

エージェントで cross-プロバイダー メッセージングを有効にしてください:

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

設定 を編集したら ゲートウェイを再起動してください。これを単一のエージェントにだけ適用したい場合は、代わりに `agents.list[].tools.message` の下で設定してください。

<h3 id="why-does-it-feel-like-the-bot-ignores-rapidfire-messages">メッセージを連投するとボットが無視しているように感じるのはなぜですか</h3>

Queue mode は、新しいメッセージが実行中の run とどう相互作用するかを制御します。モードを変更するには `/queue` を使用してください:

- `steer` - 新しいメッセージが現在のタスクを誘導し直します
- `followup` - メッセージを 1 件ずつ順番に実行します
- `collect` - メッセージをまとめて 1 回だけ返信します（デフォルト）
- `steer-backlog` - 今のタスクを誘導し直したうえで、あとから backlog を処理します
- `interrupt` - 現在の run を中断して新しく開始します

followup 系モードには `debounce:2s cap:25 drop:summarize` のようなオプションも追加できます。

<h2 id="answer-the-exact-question-from-the-screenshot-chat-log">スクリーンショット/チャットログの正確な質問に答える</h2>

**Q: "What's the デフォルトモデル for Anthropic with an API キー?"**

**A:** OpenClaw では、認証情報とモデル選択は別です。`ANTHROPIC_API_KEY` を設定する（または 認証プロファイル に Anthropic API キー を保存する）と認証は有効になりますが、実際のデフォルトモデルは `agents.defaults.model.primary` に設定したものです（たとえば `anthropic/claude-sonnet-4-5` や `anthropic/claude-opus-4-6`）。`No credentials found for profile "anthropic:default"` と表示される場合は、実行中の エージェントに対して ゲートウェイが想定された `auth-profiles.json` から Anthropic の認証情報を見つけられなかったことを意味します。

---

まだ解決しない場合は、[Discord](https://discord.com/invite/clawd) で質問するか、[GitHub discussion](https://github.com/openclaw/openclaw/discussions) を開いてください。
