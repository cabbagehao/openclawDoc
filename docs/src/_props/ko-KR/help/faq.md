---
summary: "OpenClaw 설치, 설정, 사용에 관한 자주 묻는 질문"
read_when:
  - 일반적인 설치, 온보딩, 런타임 지원 질문에 답해야 할 때
  - 더 깊은 디버깅 전에 사용자 이슈를 먼저 트리아지할 때
title: "FAQ"
x-i18n:
  source_path: "help/faq.md"
---

# FAQ

실제 운영 환경에서 자주 나오는 질문과 그에 대한 빠른 답변, 그리고 더 깊은 문제 해결 가이드를 모았습니다. 로컬 개발, VPS, 멀티 에이전트, OAuth/API 키, 모델 페일오버 같은 시나리오를 다룹니다. 런타임 진단은 [Troubleshooting](/gateway/troubleshooting), 전체 설정 참조는 [Configuration](/gateway/configuration)을 참고하세요.

## Table of contents

* \[Quick start and first-run setup]
  * [Im stuck what's the fastest way to get unstuck?](#im-stuck-whats-the-fastest-way-to-get-unstuck)
  * [What's the recommended way to install and set up OpenClaw?](#whats-the-recommended-way-to-install-and-set-up-openclaw)
  * [How do I open the dashboard after onboarding?](#how-do-i-open-the-dashboard-after-onboarding)
  * [How do I authenticate the dashboard (token) on localhost vs remote?](#how-do-i-authenticate-the-dashboard-token-on-localhost-vs-remote)
  * [What runtime do I need?](#what-runtime-do-i-need)
  * [Does it run on Raspberry Pi?](#does-it-run-on-raspberry-pi)
  * [Any tips for Raspberry Pi installs?](#any-tips-for-raspberry-pi-installs)
  * [It is stuck on "wake up my friend" / onboarding will not hatch. What now?](#it-is-stuck-on-wake-up-my-friend-onboarding-will-not-hatch-what-now)
  * [Can I migrate my setup to a new machine (Mac mini) without redoing onboarding?](#can-i-migrate-my-setup-to-a-new-machine-mac-mini-without-redoing-onboarding)
  * [Where do I see what is new in the latest version?](#where-do-i-see-what-is-new-in-the-latest-version)
  * [I can't access docs.openclaw.ai (SSL error). What now?](#i-cant-access-docsopenclawai-ssl-error-what-now)
  * [What's the difference between stable and beta?](#whats-the-difference-between-stable-and-beta)
  * [How do I install the beta version, and what's the difference between beta and dev?](#how-do-i-install-the-beta-version-and-whats-the-difference-between-beta-and-dev)
  * [How do I try the latest bits?](#how-do-i-try-the-latest-bits)
  * [How long does install and onboarding usually take?](#how-long-does-install-and-onboarding-usually-take)
  * [Installer stuck? How do I get more feedback?](#installer-stuck-how-do-i-get-more-feedback)
  * [Windows install says git not found or openclaw not recognized](#windows-install-says-git-not-found-or-openclaw-not-recognized)
  * [Windows exec output shows garbled Chinese text what should I do](#windows-exec-output-shows-garbled-chinese-text-what-should-i-do)
  * [The docs didn't answer my question - how do I get a better answer?](#the-docs-didnt-answer-my-question-how-do-i-get-a-better-answer)
  * [How do I install OpenClaw on Linux?](#how-do-i-install-openclaw-on-linux)
  * [How do I install OpenClaw on a VPS?](#how-do-i-install-openclaw-on-a-vps)
  * [Where are the cloud/VPS install guides?](#where-are-the-cloudvps-install-guides)
  * [Can I ask OpenClaw to update itself?](#can-i-ask-openclaw-to-update-itself)
  * [What does the onboarding wizard actually do?](#what-does-the-onboarding-wizard-actually-do)
  * [Do I need a Claude or OpenAI subscription to run this?](#do-i-need-a-claude-or-openai-subscription-to-run-this)
  * [Can I use Claude Max subscription without an API key](#can-i-use-claude-max-subscription-without-an-api-key)
  * [How does Anthropic "setup-token" auth work?](#how-does-anthropic-setuptoken-auth-work)
  * [Where do I find an Anthropic setup-token?](#where-do-i-find-an-anthropic-setuptoken)
  * [Do you support Claude subscription auth (Claude Pro or Max)?](#do-you-support-claude-subscription-auth-claude-pro-or-max)
  * [Why am I seeing `HTTP 429: rate_limit_error` from Anthropic?](#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)
  * [Is AWS Bedrock supported?](#is-aws-bedrock-supported)
  * [How does Codex auth work?](#how-does-codex-auth-work)
  * [Do you support OpenAI subscription auth (Codex OAuth)?](#do-you-support-openai-subscription-auth-codex-oauth)
  * [How do I set up Gemini CLI OAuth](#how-do-i-set-up-gemini-cli-oauth)
  * [Is a local model OK for casual chats?](#is-a-local-model-ok-for-casual-chats)
  * [How do I keep hosted model traffic in a specific region?](#how-do-i-keep-hosted-model-traffic-in-a-specific-region)
  * [Do I have to buy a Mac Mini to install this?](#do-i-have-to-buy-a-mac-mini-to-install-this)
  * [Do I need a Mac mini for iMessage support?](#do-i-need-a-mac-mini-for-imessage-support)
  * [If I buy a Mac mini to run OpenClaw, can I connect it to my MacBook Pro?](#if-i-buy-a-mac-mini-to-run-openclaw-can-i-connect-it-to-my-macbook-pro)
  * [Can I use Bun?](#can-i-use-bun)
  * [Telegram: what goes in `allowFrom`?](#telegram-what-goes-in-allowfrom)
  * [Can multiple people use one WhatsApp number with different OpenClaw instances?](#can-multiple-people-use-one-whatsapp-number-with-different-openclaw-instances)
  * [Can I run a "fast chat" agent and an "Opus for coding" agent?](#can-i-run-a-fast-chat-agent-and-an-opus-for-coding-agent)
  * [Does Homebrew work on Linux?](#does-homebrew-work-on-linux)
  * [What's the difference between the hackable (git) install and npm install?](#whats-the-difference-between-the-hackable-git-install-and-npm-install)
  * [Can I switch between npm and git installs later?](#can-i-switch-between-npm-and-git-installs-later)
  * [Should I run the Gateway on my laptop or a VPS?](#should-i-run-the-gateway-on-my-laptop-or-a-vps)
  * [How important is it to run OpenClaw on a dedicated machine?](#how-important-is-it-to-run-openclaw-on-a-dedicated-machine)
  * [What are the minimum VPS requirements and recommended OS?](#what-are-the-minimum-vps-requirements-and-recommended-os)
  * [Can I run OpenClaw in a VM and what are the requirements](#can-i-run-openclaw-in-a-vm-and-what-are-the-requirements)
* [What is OpenClaw?](#what-is-openclaw)
  * [What is OpenClaw, in one paragraph?](#what-is-openclaw-in-one-paragraph)
  * [What's the value proposition?](#whats-the-value-proposition)
  * [I just set it up what should I do first](#i-just-set-it-up-what-should-i-do-first)
  * [What are the top five everyday use cases for OpenClaw](#what-are-the-top-five-everyday-use-cases-for-openclaw)
  * [Can OpenClaw help with lead gen outreach ads and blogs for a SaaS](#can-openclaw-help-with-lead-gen-outreach-ads-and-blogs-for-a-saas)
  * [What are the advantages vs Claude Code for web development?](#what-are-the-advantages-vs-claude-code-for-web-development)
* [Skills and automation](#skills-and-automation)
  * [How do I customize skills without keeping the repo dirty?](#how-do-i-customize-skills-without-keeping-the-repo-dirty)
  * [Can I load skills from a custom folder?](#can-i-load-skills-from-a-custom-folder)
  * [How can I use different models for different tasks?](#how-can-i-use-different-models-for-different-tasks)
  * [The bot freezes while doing heavy work. How do I offload that?](#the-bot-freezes-while-doing-heavy-work-how-do-i-offload-that)
  * [Cron or reminders do not fire. What should I check?](#cron-or-reminders-do-not-fire-what-should-i-check)
  * [How do I install skills on Linux?](#how-do-i-install-skills-on-linux)
  * [Can OpenClaw run tasks on a schedule or continuously in the background?](#can-openclaw-run-tasks-on-a-schedule-or-continuously-in-the-background)
  * [Can I run Apple macOS-only skills from Linux?](#can-i-run-apple-macos-only-skills-from-linux)
  * [Do you have a Notion or HeyGen integration?](#do-you-have-a-notion-or-heygen-integration)
  * [How do I install the Chrome extension for browser takeover?](#how-do-i-install-the-chrome-extension-for-browser-takeover)
* [Sandboxing and memory](#sandboxing-and-memory)
  * [Is there a dedicated sandboxing doc?](#is-there-a-dedicated-sandboxing-doc)
  * [How do I bind a host folder into the sandbox?](#how-do-i-bind-a-host-folder-into-the-sandbox)
  * [How does memory work?](#how-does-memory-work)
  * [Memory keeps forgetting things. How do I make it stick?](#memory-keeps-forgetting-things-how-do-i-make-it-stick)
  * [Does memory persist forever? What are the limits?](#does-memory-persist-forever-what-are-the-limits)
  * [Does semantic memory search require an OpenAI API key?](#does-semantic-memory-search-require-an-openai-api-key)
* [Where things live on disk](#where-things-live-on-disk)
  * [Is all data used with OpenClaw saved locally?](#is-all-data-used-with-openclaw-saved-locally)
  * [Where does OpenClaw store its data?](#where-does-openclaw-store-its-data)
  * [Where should AGENTS.md / SOUL.md / USER.md / MEMORY.md live?](#where-should-agentsmd-soulmd-usermd-memorymd-live)
  * [What's the recommended backup strategy?](#whats-the-recommended-backup-strategy)
  * [How do I completely uninstall OpenClaw?](#how-do-i-completely-uninstall-openclaw)
  * [Can agents work outside the workspace?](#can-agents-work-outside-the-workspace)
  * [I'm in remote mode - where is the session store?](#im-in-remote-mode-where-is-the-session-store)
* [Config basics](#config-basics)
  * [What format is the config? Where is it?](#what-format-is-the-config-where-is-it)
  * [I set `gateway.bind: "lan"` (or `"tailnet"`) and now nothing listens / the UI says unauthorized](#i-set-gatewaybind-lan-or-tailnet-and-now-nothing-listens-the-ui-says-unauthorized)
  * [Why do I need a token on localhost now?](#why-do-i-need-a-token-on-localhost-now)
  * [Do I have to restart after changing config?](#do-i-have-to-restart-after-changing-config)
  * [How do I disable funny CLI taglines?](#how-do-i-disable-funny-cli-taglines)
  * [How do I enable web search (and web fetch)?](#how-do-i-enable-web-search-and-web-fetch)
  * [config.apply wiped my config. How do I recover and avoid this?](#configapply-wiped-my-config-how-do-i-recover-and-avoid-this)
  * [How do I run a central Gateway with specialized workers across devices?](#how-do-i-run-a-central-gateway-with-specialized-workers-across-devices)
  * [Can the OpenClaw browser run headless?](#can-the-openclaw-browser-run-headless)
  * [How do I use Brave for browser control?](#how-do-i-use-brave-for-browser-control)
* [Remote gateways and nodes](#remote-gateways-and-nodes)
  * [How do commands propagate between Telegram, the gateway, and nodes?](#how-do-commands-propagate-between-telegram-the-gateway-and-nodes)
  * [How can my agent access my computer if the Gateway is hosted remotely?](#how-can-my-agent-access-my-computer-if-the-gateway-is-hosted-remotely)
  * [Tailscale is connected but I get no replies. What now?](#tailscale-is-connected-but-i-get-no-replies-what-now)
  * [Can two OpenClaw instances talk to each other (local + VPS)?](#can-two-openclaw-instances-talk-to-each-other-local-vps)
  * [Do I need separate VPSes for multiple agents](#do-i-need-separate-vpses-for-multiple-agents)
  * [Is there a benefit to using a node on my personal laptop instead of SSH from a VPS?](#is-there-a-benefit-to-using-a-node-on-my-personal-laptop-instead-of-ssh-from-a-vps)
  * [Do nodes run a gateway service?](#do-nodes-run-a-gateway-service)
  * [Is there an API / RPC way to apply config?](#is-there-an-api-rpc-way-to-apply-config)
  * [What's a minimal "sane" config for a first install?](#whats-a-minimal-sane-config-for-a-first-install)
  * [How do I set up Tailscale on a VPS and connect from my Mac?](#how-do-i-set-up-tailscale-on-a-vps-and-connect-from-my-mac)
  * [How do I connect a Mac node to a remote Gateway (Tailscale Serve)?](#how-do-i-connect-a-mac-node-to-a-remote-gateway-tailscale-serve)
  * [Should I install on a second laptop or just add a node?](#should-i-install-on-a-second-laptop-or-just-add-a-node)
* [Env vars and .env loading](#env-vars-and-env-loading)
  * [How does OpenClaw load environment variables?](#how-does-openclaw-load-environment-variables)
  * ["I started the Gateway via the service and my env vars disappeared." What now?](#i-started-the-gateway-via-the-service-and-my-env-vars-disappeared-what-now)
  * [I set `COPILOT_GITHUB_TOKEN`, but models status shows "Shell env: off." Why?](#i-set-copilotgithubtoken-but-models-status-shows-shell-env-off-why)
* [Sessions and multiple chats](#sessions-and-multiple-chats)
  * [How do I start a fresh conversation?](#how-do-i-start-a-fresh-conversation)
  * [Do sessions reset automatically if I never send `/new`?](#do-sessions-reset-automatically-if-i-never-send-new)
  * [Is there a way to make a team of OpenClaw instances one CEO and many agents](#is-there-a-way-to-make-a-team-of-openclaw-instances-one-ceo-and-many-agents)
  * [Why did context get truncated mid-task? How do I prevent it?](#why-did-context-get-truncated-midtask-how-do-i-prevent-it)
  * [How do I completely reset OpenClaw but keep it installed?](#how-do-i-completely-reset-openclaw-but-keep-it-installed)
  * [I'm getting "context too large" errors - how do I reset or compact?](#im-getting-context-too-large-errors-how-do-i-reset-or-compact)
  * [Why am I seeing "LLM request rejected: messages.content.tool\_use.input field required"?](#why-am-i-seeing-llm-request-rejected-messagescontenttool_useinput-field-required)
  * [Why am I getting heartbeat messages every 30 minutes?](#why-am-i-getting-heartbeat-messages-every-30-minutes)
  * [Do I need to add a "bot account" to a WhatsApp group?](#do-i-need-to-add-a-bot-account-to-a-whatsapp-group)
  * [How do I get the JID of a WhatsApp group?](#how-do-i-get-the-jid-of-a-whatsapp-group)
  * [Why doesn't OpenClaw reply in a group?](#why-doesnt-openclaw-reply-in-a-group)
  * [Do groups/threads share context with DMs?](#do-groupsthreads-share-context-with-dms)
  * [How many workspaces and agents can I create?](#how-many-workspaces-and-agents-can-i-create)
  * [Can I run multiple bots or chats at the same time (Slack), and how should I set that up?](#can-i-run-multiple-bots-or-chats-at-the-same-time-slack-and-how-should-i-set-that-up)
* [Models: defaults, selection, aliases, switching](#models-defaults-selection-aliases-switching)
  * [What is the "default model"?](#what-is-the-default-model)
  * [What model do you recommend?](#what-model-do-you-recommend)
  * [How do I switch models without wiping my config?](#how-do-i-switch-models-without-wiping-my-config)
  * [Can I use self-hosted models (llama.cpp, vLLM, Ollama)?](#can-i-use-selfhosted-models-llamacpp-vllm-ollama)
  * [What do OpenClaw, Flawd, and Krill use for models?](#what-do-openclaw-flawd-and-krill-use-for-models)
  * [How do I switch models on the fly (without restarting)?](#how-do-i-switch-models-on-the-fly-without-restarting)
  * [Can I use GPT 5.2 for daily tasks and Codex 5.3 for coding](#can-i-use-gpt-52-for-daily-tasks-and-codex-53-for-coding)
  * [Why do I see "Model … is not allowed" and then no reply?](#why-do-i-see-model-is-not-allowed-and-then-no-reply)
  * [Why do I see "Unknown model: minimax/MiniMax-M2.5"?](#why-do-i-see-unknown-model-minimaxminimaxm25)
  * [Can I use MiniMax as my default and OpenAI for complex tasks?](#can-i-use-minimax-as-my-default-and-openai-for-complex-tasks)
  * [Are opus / sonnet / gpt built-in shortcuts?](#are-opus-sonnet-gpt-builtin-shortcuts)
  * [How do I define/override model shortcuts (aliases)?](#how-do-i-defineoverride-model-shortcuts-aliases)
  * [How do I add models from other providers like OpenRouter or Z.AI?](#how-do-i-add-models-from-other-providers-like-openrouter-or-zai)
* [Model failover and "All models failed"](#model-failover-and-all-models-failed)
  * [How does failover work?](#how-does-failover-work)
  * [What does this error mean?](#what-does-this-error-mean)
  * [Fix checklist for `No credentials found for profile "anthropic:default"`](#fix-checklist-for-no-credentials-found-for-profile-anthropicdefault)
  * [Why did it also try Google Gemini and fail?](#why-did-it-also-try-google-gemini-and-fail)
* [Auth profiles: what they are and how to manage them](#auth-profiles-what-they-are-and-how-to-manage-them)
  * [What is an auth profile?](#what-is-an-auth-profile)
  * [What are typical profile IDs?](#what-are-typical-profile-ids)
  * [Can I control which auth profile is tried first?](#can-i-control-which-auth-profile-is-tried-first)
  * [OAuth vs API key: what's the difference?](#oauth-vs-api-key-whats-the-difference)
* [Gateway: ports, "already running", and remote mode](#gateway-ports-already-running-and-remote-mode)
  * [What port does the Gateway use?](#what-port-does-the-gateway-use)
  * [Why does `openclaw gateway status` say `Runtime: running` but `RPC probe: failed`?](#why-does-openclaw-gateway-status-say-runtime-running-but-rpc-probe-failed)
  * [Why does `openclaw gateway status` show `Config (cli)` and `Config (service)` different?](#why-does-openclaw-gateway-status-show-config-cli-and-config-service-different)
  * [What does "another gateway instance is already listening" mean?](#what-does-another-gateway-instance-is-already-listening-mean)
  * [How do I run OpenClaw in remote mode (client connects to a Gateway elsewhere)?](#how-do-i-run-openclaw-in-remote-mode-client-connects-to-a-gateway-elsewhere)
  * [The Control UI says "unauthorized" (or keeps reconnecting). What now?](#the-control-ui-says-unauthorized-or-keeps-reconnecting-what-now)
  * [I set `gateway.bind: "tailnet"` but it can't bind / nothing listens](#i-set-gatewaybind-tailnet-but-it-cant-bind-nothing-listens)
  * [Can I run multiple Gateways on the same host?](#can-i-run-multiple-gateways-on-the-same-host)
  * [What does "invalid handshake" / code 1008 mean?](#what-does-invalid-handshake-code-1008-mean)
* [Logging and debugging](#logging-and-debugging)
  * [Where are logs?](#where-are-logs)
  * [How do I start/stop/restart the Gateway service?](#how-do-i-startstoprestart-the-gateway-service)
  * [I closed my terminal on Windows - how do I restart OpenClaw?](#i-closed-my-terminal-on-windows-how-do-i-restart-openclaw)
  * [The Gateway is up but replies never arrive. What should I check?](#the-gateway-is-up-but-replies-never-arrive-what-should-i-check)
  * ["Disconnected from gateway: no reason" - what now?](#disconnected-from-gateway-no-reason-what-now)
  * [Telegram setMyCommands fails with network errors. What should I check?](#telegram-setmycommands-fails-with-network-errors-what-should-i-check)
  * [TUI shows no output. What should I check?](#tui-shows-no-output-what-should-i-check)
  * [How do I completely stop then start the Gateway?](#how-do-i-completely-stop-then-start-the-gateway)
  * [ELI5: `openclaw gateway restart` vs `openclaw gateway`](#eli5-openclaw-gateway-restart-vs-openclaw-gateway)
  * [What's the fastest way to get more details when something fails?](#whats-the-fastest-way-to-get-more-details-when-something-fails)
* [Media and attachments](#media-and-attachments)
  * [My skill generated an image/PDF, but nothing was sent](#my-skill-generated-an-imagepdf-but-nothing-was-sent)
* [Security and access control](#security-and-access-control)
  * [Is it safe to expose OpenClaw to inbound DMs?](#is-it-safe-to-expose-openclaw-to-inbound-dms)
  * [Is prompt injection only a concern for public bots?](#is-prompt-injection-only-a-concern-for-public-bots)
  * [Should my bot have its own email GitHub account or phone number](#should-my-bot-have-its-own-email-github-account-or-phone-number)
  * [Can I give it autonomy over my text messages and is that safe](#can-i-give-it-autonomy-over-my-text-messages-and-is-that-safe)
  * [Can I use cheaper models for personal assistant tasks?](#can-i-use-cheaper-models-for-personal-assistant-tasks)
  * [I ran `/start` in Telegram but didn't get a pairing code](#i-ran-start-in-telegram-but-didnt-get-a-pairing-code)
  * [WhatsApp: will it message my contacts? How does pairing work?](#whatsapp-will-it-message-my-contacts-how-does-pairing-work)
* [Chat commands, aborting tasks, and "it won't stop"](#chat-commands-aborting-tasks-and-it-wont-stop)
  * [How do I stop internal system messages from showing in chat](#how-do-i-stop-internal-system-messages-from-showing-in-chat)
  * [How do I stop/cancel a running task?](#how-do-i-stopcancel-a-running-task)
  * [How do I send a Discord message from Telegram? ("Cross-context messaging denied")](#how-do-i-send-a-discord-message-from-telegram-crosscontext-messaging-denied)
  * [Why does it feel like the bot "ignores" rapid-fire messages?](#why-does-it-feel-like-the-bot-ignores-rapidfire-messages)

## First 60 seconds if something's broken

1. **빠른 상태 점검**

   ```bash
   openclaw status
   ```

   OS, 업데이트 상태, gateway/service 도달 가능 여부, agents/sessions, provider 설정 및 런타임 문제를 빠르게 요약해 줍니다.

2. **공유 가능한 전체 리포트**

   ```bash
   openclaw status --all
   ```

   토큰을 가린 상태로 로그 tail까지 포함한 읽기 전용 진단 리포트입니다.

3. **daemon + port 상태**

   ```bash
   openclaw gateway status
   ```

   supervisor가 보는 실행 상태, RPC 도달 가능 여부, probe 대상 URL, 서비스가 실제로 어떤 config를 썼는지를 보여줍니다.

4. **더 깊은 probe**

   ```bash
   openclaw status --deep
   ```

   gateway health check와 provider probe를 실행합니다. gateway가 reachable해야 합니다. [Health](/gateway/health) 참고.

5. **최신 로그 tail**

   ```bash
   openclaw logs --follow
   ```

   RPC가 죽어 있으면 다음으로 대체하세요.

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   파일 로그와 서비스 로그는 별개입니다. [Logging](/logging), [Troubleshooting](/gateway/troubleshooting) 참고.

6. **Doctor 실행**

   ```bash
   openclaw doctor
   ```

   config/state를 복구 및 마이그레이션하고 health check를 돌립니다. [Doctor](/gateway/doctor) 참고.

7. **Gateway snapshot**

   ```bash
   openclaw health --json
   openclaw health --verbose   # shows the target URL + config path on errors
   ```

   실행 중인 gateway에 전체 스냅샷을 요청합니다. WS 전용입니다. [Health](/gateway/health) 참고.

## Quick start and first-run setup

### Im stuck what's the fastest way to get unstuck

가장 빠른 방법은 **내 머신을 직접 볼 수 있는 로컬 AI 에이전트**를 쓰는 것입니다. Discord에 질문하는 것보다 훨씬 효과적입니다. 많은 "막혔다" 사례는 원격 도우미가 볼 수 없는 **로컬 config 또는 환경 문제**이기 때문입니다.

* **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
* **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

이 도구들은 저장소를 읽고, 명령을 실행하고, 로그를 검사하고, PATH/서비스/권한/auth 파일 같은 머신 수준 문제를 잡는 데 유용합니다. 가능한 한 **전체 소스 체크아웃**을 넘겨 주세요. hackable (git) 설치를 쓰면 됩니다.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
```

이렇게 설치하면 OpenClaw가 **git checkout 기반**으로 설치되어, 에이전트가 코드와 문서를 직접 읽고 현재 실행 중인 정확한 버전을 기준으로 추론할 수 있습니다. 나중에 원하면 `--install-method git` 없이 설치 스크립트를 다시 실행해 stable로 돌아갈 수 있습니다.

팁: 에이전트에게 문제를 **계획하고 감독**하게 한 뒤, 필요한 명령만 실행하게 하세요. 변경 범위를 작게 유지할수록 감사가 쉽습니다.

실제 버그나 수정 사항을 찾았다면 GitHub issue나 PR로 남겨 주세요.
[https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
[https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

도움을 요청할 때는 먼저 다음 명령의 출력부터 공유하는 것이 좋습니다.

```bash
openclaw status
openclaw models status
openclaw doctor
```

각 명령의 역할:

* `openclaw status`: gateway/agent 상태와 기본 config를 빠르게 요약
* `openclaw models status`: provider auth와 모델 가용성 점검
* `openclaw doctor`: 흔한 config/state 문제 검증 및 복구

추가로 유용한 점검 명령: `openclaw status --all`, `openclaw logs --follow`, `openclaw gateway status`, `openclaw health --verbose`

빠른 디버그 루프는 [First 60 seconds if something's broken](#first-60-seconds-if-something's-broken)를 보세요.
설치 관련 문서는 [Install](/install), [Installer flags](/install/installer), [Updating](/install/updating)을 참고하세요.

### What's the recommended way to install and set up OpenClaw?

저장소에서 권장하는 경로는 설치 스크립트를 실행한 뒤 onboarding wizard를 사용하는 방법입니다.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
openclaw onboard --install-daemon
```

wizard는 필요하면 UI asset도 자동으로 빌드할 수 있습니다. 일반적으로 onboarding 후에는 Gateway가 **18789** 포트에서 실행됩니다.

소스 기반 설치(기여자/개발자용):

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm build
pnpm ui:build # auto-installs UI deps on first run
openclaw onboard
```

전역 설치가 아직 없다면 `pnpm openclaw onboard`로 실행하면 됩니다.

### How do I open the dashboard after onboarding?

wizard는 onboarding이 끝난 직후 브라우저를 열면서 깨끗한 dashboard URL을 함께 출력합니다. 요약에도 링크가 다시 인쇄됩니다. 자동으로 열리지 않았다면 같은 머신에서 출력된 URL을 복사해서 여세요.

### How do I authenticate the dashboard token on localhost vs remote?

**Localhost(같은 머신)**:

* `http://127.0.0.1:18789/`를 엽니다.
* auth를 요구하면 `gateway.auth.token` 또는 `OPENCLAW_GATEWAY_TOKEN` 값을 Control UI 설정에 붙여 넣습니다.
* gateway host에서 `openclaw config get gateway.auth.token`으로 조회하거나, 없으면 `openclaw doctor --generate-gateway-token`으로 생성할 수 있습니다.

**로컬호스트가 아닐 때**:

* **Tailscale Serve(권장)**: bind는 loopback으로 유지하고 `openclaw gateway --tailscale serve`를 실행한 뒤 `https://<magicdns>/`를 엽니다. `gateway.auth.allowTailscale`이 `true`이면 identity headers로 Control UI/WebSocket auth를 만족합니다. token이 없어도 되지만 gateway host를 신뢰한다는 가정이 있습니다. HTTP API는 여전히 token/password가 필요합니다.
* **Tailnet bind**: `openclaw gateway --bind tailnet --token "<token>"`를 실행하고 `http://<tailscale-ip>:18789/`를 연 뒤 dashboard 설정에 token을 넣습니다.
* **SSH tunnel**: `ssh -N -L 18789:127.0.0.1:18789 user@host` 후 `http://127.0.0.1:18789/`를 열고 token을 입력합니다.

[Dashboard](/web/dashboard), [Web surfaces](/web)를 함께 보세요.

### What runtime do I need?

Node **>= 22**가 필요합니다. `pnpm` 사용을 권장합니다. Gateway는 Bun으로 실행하는 것을 **권장하지 않습니다**.

### Does it run on Raspberry Pi?

예. Gateway는 가볍습니다. 문서 기준으로 개인 사용은 **512MB-1GB RAM**, **1 core**, 약 **500MB 디스크**로도 가능하며, **Raspberry Pi 4에서도 실행 가능**하다고 안내합니다.

로그, 미디어, 다른 서비스까지 여유를 두고 싶다면 **2GB** 정도를 권장하지만 절대 최소 요구 사항은 아닙니다.

작은 Pi나 VPS에 Gateway를 두고, 노트북/휴대폰에는 **nodes**를 연결해 로컬 screen/camera/canvas 또는 명령 실행을 맡기는 방식이 실용적입니다. [Nodes](/nodes) 참고.

### Any tips for Raspberry Pi installs?

짧게 말하면 가능하지만 ARM 특유의 거친 부분은 감안해야 합니다.

* **64-bit** OS를 쓰고 Node는 22 이상을 유지하세요.
* 로그와 업데이트를 쉽게 보기 위해 **hackable (git) install**을 권장합니다.
* 처음에는 channels/skills 없이 시작하고 하나씩 추가하세요.
* 이상한 바이너리 문제가 생기면 대부분 **ARM 호환성** 문제입니다.

관련 문서: [Linux](/platforms/linux), [Install](/install)

### It is stuck on "wake up my friend" / onboarding will not hatch. What now?

이 화면은 Gateway에 도달 가능하고 인증이 통과해야 동작합니다. TUI는 첫 hatch 시 `"Wake up, my friend!"`를 자동으로 보냅니다. 이 문구는 보이는데 **응답이 없고** token 사용량이 0에 머문다면 agent가 실제로 실행되지 않은 것입니다.

1. 먼저 Gateway를 재시작하세요.

```bash
openclaw gateway restart
```

2. 상태와 auth를 확인합니다.

```bash
openclaw status
openclaw models status
openclaw logs --follow
```

3. 여전히 멈추면:

```bash
openclaw doctor
```

Gateway가 원격이면 tunnel/Tailscale 연결이 살아 있는지, UI가 올바른 Gateway를 가리키는지 확인하세요. [Remote access](/gateway/remote) 참고.

### Can I migrate my setup to a new machine (Mac mini) without redoing onboarding?

예. **state directory**와 **workspace**를 함께 옮긴 뒤 Doctor를 한 번 돌리면 됩니다. 두 위치를 모두 복사해야 memory, session history, auth, channel state까지 "거의 동일한 상태"로 유지됩니다.

1. 새 머신에 OpenClaw를 설치합니다.
2. 이전 머신의 `$OPENCLAW_STATE_DIR`(기본: `~/.openclaw`)를 복사합니다.
3. workspace(기본: `~/.openclaw/workspace`)를 복사합니다.
4. `openclaw doctor` 실행 후 Gateway 서비스를 재시작합니다.

이렇게 하면 config, auth profiles, WhatsApp credentials, sessions, memory가 유지됩니다. remote mode라면 session store와 workspace는 gateway host가 소유한다는 점을 잊지 마세요.

중요: workspace만 GitHub에 커밋/푸시하는 것은 **memory + bootstrap files** 백업일 뿐입니다. **session history나 auth는 백업되지 않습니다.** 그것들은 `~/.openclaw/` 아래, 예를 들어 `~/.openclaw/agents/<agentId>/sessions/`에 있습니다.

관련 문서: [Migrating](/install/migrating), [Where things live on disk](/help/faq#where-does-openclaw-store-its-data), [Agent workspace](/concepts/agent-workspace), [Doctor](/gateway/doctor), [Remote mode](/gateway/remote)

### Where do I see what is new in the latest version?

GitHub changelog를 보면 됩니다.
[https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

최신 항목이 위에 있으며, 맨 위가 **Unreleased**라면 그 다음 날짜가 적힌 섹션이 현재 배포된 최신 버전입니다. 항목은 보통 **Highlights**, **Changes**, **Fixes** 중심으로 묶입니다.

### I can't access docs.openclaw\.ai (SSL error). What now?

일부 Comcast/Xfinity 회선에서 `docs.openclaw.ai`를 Xfinity Advanced Security가 잘못 차단하는 사례가 있습니다. 이 기능을 끄거나 `docs.openclaw.ai`를 allowlist에 넣은 뒤 다시 시도해 보세요. 자세한 내용은 [Troubleshooting](/help/troubleshooting#docsopenclawai-shows-an-ssl-error-comcastxfinity) 참고. 해제 요청은 다음에 신고하면 도움이 됩니다.
[https://spa.xfinity.com/check\_url\_status](https://spa.xfinity.com/check_url_status)

여전히 접근할 수 없다면 문서는 GitHub에도 미러링되어 있습니다.
[https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

### What's the difference between stable and beta?

**Stable**과 **beta**는 별도 코드 라인이 아니라 **npm dist-tag**입니다.

* `latest` = stable
* `beta` = 테스트용 조기 빌드

우리는 먼저 **beta**로 빌드를 내보내고 검증한 다음, 충분히 안정적이면 **같은 버전**을 `latest`로 승격합니다. 그래서 beta와 stable이 **동일한 버전**을 가리킬 수도 있습니다.

변경 사항은 changelog를 보세요.
[https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

### How do I install the beta version, and what's the difference between beta and dev?

**Beta**는 npm dist-tag `beta`입니다. `latest`와 같을 수도 있습니다.
**Dev**는 `main` 브랜치의 계속 움직이는 최신 상태이며, publish될 때는 npm dist-tag `dev`를 사용합니다.

macOS/Linux 원라이너:

```bash
curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
```

```bash
curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
```

Windows 설치 스크립트(PowerShell):
[https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

더 자세한 내용은 [Development channels](/install/development-channels), [Installer flags](/install/installer) 참고.

### How long does install and onboarding usually take?

대략적인 기준:

* **Install:** 2-5분
* **Onboarding:** 채널과 모델을 얼마나 설정하느냐에 따라 5-15분

중간에 멈추면 [Installer stuck](/help/faq#installer-stuck-how-do-i-get-more-feedback)와 [Im stuck](/help/faq#im-stuck-whats-the-fastest-way-to-get-unstuck)의 빠른 디버그 루프를 따라가세요.

### How do I try the latest bits?

방법은 두 가지입니다.

1. **Dev channel(git checkout)**

```bash
openclaw update --channel dev
```

이 명령은 `main` 브랜치로 전환하고 소스 기준으로 업데이트합니다.

2. **Hackable install(설치 사이트에서)**

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
```

이렇게 하면 수정 가능한 로컬 저장소가 생기고, 이후 git으로 업데이트할 수 있습니다.

직접 클론하고 싶다면:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm build
```

문서: [Update](/cli/update), [Development channels](/install/development-channels), [Install](/install)

### Installer stuck? How do I get more feedback?

설치 스크립트를 **verbose 출력**으로 다시 실행하세요.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
```

beta 설치를 verbose로:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
```

hackable (git) install:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
```

Windows(PowerShell) 대응:

```powershell
# install.ps1 has no dedicated -Verbose flag yet.
Set-PSDebug -Trace 1
& ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
Set-PSDebug -Trace 0
```

추가 옵션은 [Installer flags](/install/installer) 참고.

### Windows install says git not found or openclaw not recognized

Windows에서는 보통 두 가지가 문제입니다.

**1) npm error spawn git / git not found**

* **Git for Windows**를 설치하고 `git`이 PATH에 들어 있는지 확인합니다.
* PowerShell을 완전히 닫았다가 다시 열고 설치를 다시 실행합니다.

**2) 설치 후 `openclaw is not recognized`**

* npm global bin 폴더가 PATH에 없습니다.

* 다음으로 경로를 확인하세요.

  ```powershell
  npm config get prefix
  ```

* 해당 디렉터리를 사용자 PATH에 추가하세요. Windows에서는 보통 `\bin` 접미사는 필요 없고 `%AppData%\npm`입니다.

* PATH를 바꾼 뒤 PowerShell을 다시 열어야 합니다.

가장 매끄러운 Windows 환경은 native보다 **WSL2**입니다. [Windows](/platforms/windows) 참고.

### Windows exec output shows garbled Chinese text what should I do

대개 native Windows 셸의 콘솔 code page 불일치 때문입니다.

증상:

* `system.run`/`exec` 출력의 중국어가 깨져 보임
* 다른 터미널 프로필에서는 같은 명령이 정상 표시됨

PowerShell에서의 임시 우회:

```powershell
chcp 65001
[Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$OutputEncoding = [System.Text.UTF8Encoding]::new($false)
```

그 후 Gateway를 재시작하고 다시 시도하세요.

```powershell
openclaw gateway restart
```

최신 OpenClaw에서도 계속 재현되면 다음 이슈를 추적하세요.

* [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

### The docs didn't answer my question - how do I get a better answer?

**hackable (git) install**을 사용해 전체 소스와 문서를 로컬에 둔 뒤, 그 폴더 안에서 bot이나 Claude/Codex에게 질문하세요. 그러면 저장소를 실제로 읽고 더 정확하게 답할 수 있습니다.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
```

추가 설명은 [Install](/install), [Installer flags](/install/installer) 참고.

### How do I install OpenClaw on Linux?

짧게 말하면 Linux 가이드를 따라 설치한 뒤 onboarding wizard를 실행하면 됩니다.

* 빠른 경로 + service 설치: [Linux](/platforms/linux)
* 전체 입문 흐름: [Getting Started](/start/getting-started)
* 설치 및 업데이트: [Install & updates](/install/updating)

### How do I install OpenClaw on a VPS?

대부분의 Linux VPS에서 동작합니다. 서버에 설치하고 SSH 또는 Tailscale로 Gateway에 접근하세요.

가이드: [exe.dev](/install/exe-dev), [Hetzner](/install/hetzner), [Fly.io](/install/fly)
원격 접근: [Gateway remote](/gateway/remote)

### Where are the cloud/VPS install guides?

자주 쓰는 provider를 모은 **hosting hub**가 있습니다.

* [VPS hosting](/vps)
* [Fly.io](/install/fly)
* [Hetzner](/install/hetzner)
* [exe.dev](/install/exe-dev)

클라우드에서의 기본 구조는 이렇습니다. **Gateway는 서버에서 실행**되고, 사용자는 노트북/휴대폰에서 Control UI 또는 Tailscale/SSH로 접근합니다. state와 workspace는 서버에 있으므로 서버를 source of truth로 보고 백업해야 합니다.

필요하면 이 cloud Gateway에 **nodes**를 연결해 로컬 screen/camera/canvas를 쓰거나 노트북에서 명령을 실행할 수 있습니다.

참고: [Platforms](/platforms), [Gateway remote](/gateway/remote), [Nodes](/nodes), [Nodes CLI](/cli/nodes)

### Can I ask OpenClaw to update itself?

짧게 말하면 **가능하지만 권장하지 않습니다**. 업데이트 과정에서 Gateway가 재시작될 수 있고, 활성 세션이 끊기며, git checkout이 깨끗해야 하거나 확인 프롬프트가 필요할 수 있습니다. 가장 안전한 방법은 운영자가 셸에서 직접 업데이트하는 것입니다.

CLI 예:

```bash
openclaw update
openclaw update status
openclaw update --channel stable|beta|dev
openclaw update --tag <dist-tag|version>
openclaw update --no-restart
```

에이전트에서 꼭 자동화해야 한다면:

```bash
openclaw update --yes --no-restart
openclaw gateway restart
```

문서: [Update](/cli/update), [Updating](/install/updating)

### What does the onboarding wizard actually do?

`openclaw onboard`는 권장 설정 경로입니다. **local mode**에서 다음을 안내합니다.

* **Model/auth setup**: provider OAuth, setup-token, API key, LM Studio 같은 local model 옵션
* **Workspace** 위치와 bootstrap 파일
* **Gateway settings**: bind/port/auth/tailscale
* **Providers**: WhatsApp, Telegram, Discord, Mattermost(plugin), Signal, iMessage
* **Daemon install**: macOS LaunchAgent, Linux/WSL2 systemd user unit
* **Health checks**와 **skills** 선택

설정된 모델이 unknown이거나 auth가 빠졌을 때도 경고합니다.

### Do I need a Claude or OpenAI subscription to run this?

아니요. **API keys**로도 쓸 수 있고, **local-only models**로도 운용할 수 있습니다. Claude Pro/Max나 OpenAI Codex 같은 구독은 선택적인 인증 수단일 뿐입니다.

Anthropic subscription auth를 선택하는지는 사용자가 직접 판단해야 합니다. 과거 Anthropic은 Claude Code 외부에서 일부 subscription 사용을 차단한 적이 있습니다. 반면 OpenAI Codex OAuth는 OpenClaw 같은 외부 도구에서의 사용이 명시적으로 지원됩니다.

문서: [Anthropic](/providers/anthropic), [OpenAI](/providers/openai), [Local models](/gateway/local-models), [Models](/concepts/models)

### Can I use Claude Max subscription without an API key

예. API key 대신 **setup-token**으로 인증할 수 있습니다. 이것이 subscription 경로입니다.

Claude Pro/Max 구독은 **API key를 포함하지 않기 때문에**, subscription 계정에서는 이것이 기술적으로 가능한 경로입니다. 다만 Anthropic은 과거 Claude Code 외부의 일부 subscription 사용을 차단한 적이 있으므로, 사용 여부는 스스로 판단해야 합니다. production 환경에서 가장 명확하고 안전한 경로는 Anthropic API key입니다.

### How does Anthropic "setup-token" auth work?

`claude setup-token`은 Claude Code CLI를 통해 **token string**을 생성합니다. 웹 콘솔에서는 얻을 수 없습니다. 어느 머신에서 실행해도 됩니다. wizard에서 \*\*Anthropic token (paste setup-token)\*\*을 선택하거나, `openclaw models auth paste-token --provider anthropic`로 붙여 넣으면 됩니다. 이 토큰은 **anthropic** provider의 auth profile로 저장되며 API key처럼 사용되지만 자동 갱신은 없습니다. 자세한 내용은 [OAuth](/concepts/oauth) 참고.

### Where do I find an Anthropic setup-token?

Anthropic Console에는 없습니다. **Claude Code CLI**에서 생성합니다.

```bash
claude setup-token
```

출력된 토큰을 복사한 뒤 wizard에서 \*\*Anthropic token (paste setup-token)\*\*을 선택하세요. gateway host에서 직접 실행하려면 `openclaw models auth setup-token --provider anthropic`를 쓰고, 다른 머신에서 생성했다면 gateway host에서 `openclaw models auth paste-token --provider anthropic`로 붙여 넣으면 됩니다. [Anthropic](/providers/anthropic) 참고.

### Do you support Claude subscription auth (Claude Pro or Max)?

예. **setup-token** 방식으로 지원합니다. OpenClaw는 더 이상 Claude Code CLI OAuth token을 재사용하지 않습니다. setup-token이나 Anthropic API key를 사용하세요. 토큰은 어디서든 생성할 수 있고 gateway host에 붙여 넣으면 됩니다. [Anthropic](/providers/anthropic), [OAuth](/concepts/oauth) 참고.

중요: 이것은 정책 보장이 아니라 **기술적 호환성**입니다. Anthropic은 과거 Claude Code 외부의 subscription 사용을 차단한 적이 있습니다. 사용 여부와 현재 약관 확인은 사용자 책임입니다. production이나 다중 사용자 워크로드에서는 Anthropic API key가 더 안전한 권장 경로입니다.

### Why am I seeing `HTTP 429: rate_limit_error` from Anthropic?

현재 윈도우에서 **Anthropic quota/rate limit**를 소진했다는 뜻입니다. **Claude subscription**(setup-token)을 쓰는 경우에는 제한이 리셋될 때까지 기다리거나 요금제를 올려야 합니다. **Anthropic API key**를 쓰는 경우에는 Anthropic Console에서 usage/billing을 확인하고 limit 상향이 필요한지 보세요.

오류가 다음과 같이 구체적이라면:
`Extra usage is required for long context requests`
이는 요청이 Anthropic의 1M context beta(`context1m: true`)를 쓰려 한다는 뜻입니다. 이 기능은 자격 증명이 long-context billing에 eligible할 때만 동작합니다. API key billing 또는 Extra Usage가 켜진 subscription이어야 합니다.

팁: provider가 rate-limited일 때도 계속 답하도록 **fallback model**을 설정하세요. [Models](/cli/models), [OAuth](/concepts/oauth), [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context) 참고.

### Is AWS Bedrock supported?

예. pi-ai의 **Amazon Bedrock (Converse)** provider를 통해 **수동 config**로 지원합니다. gateway host에 AWS credentials와 region을 준비한 뒤 models config에 Bedrock provider 항목을 추가해야 합니다. [Amazon Bedrock](/providers/bedrock), [Model providers](/providers/models) 참고. 관리형 키 흐름이 필요하면 Bedrock 앞에 OpenAI-compatible proxy를 두는 방식도 유효합니다.

### How does Codex auth work?

OpenClaw는 \*\*OpenAI Code (Codex)\*\*를 OAuth(ChatGPT sign-in)로 지원합니다. wizard가 OAuth flow를 실행해 줄 수 있고, 적절한 경우 기본 모델을 `openai-codex/gpt-5.4`로 설정합니다. [Model providers](/concepts/model-providers), [Wizard](/start/wizard) 참고.

### Do you support OpenAI subscription auth (Codex OAuth)?

예. OpenClaw는 **OpenAI Code (Codex) subscription OAuth**를 지원합니다. OpenAI는 OpenClaw 같은 외부 도구/워크플로에서 subscription OAuth 사용을 명시적으로 허용합니다. onboarding wizard에서 이 OAuth flow를 바로 실행할 수 있습니다.

문서: [OAuth](/concepts/oauth), [Model providers](/concepts/model-providers), [Wizard](/start/wizard)

### How do I set up Gemini CLI OAuth

Gemini CLI는 `openclaw.json`에 client id/secret를 넣는 방식이 아니라 **plugin auth flow**를 사용합니다.

절차:

1. plugin 활성화: `openclaw plugins enable google-gemini-cli-auth`
2. 로그인: `openclaw models auth login --provider google-gemini-cli --set-default`

이 과정은 gateway host의 auth profiles에 OAuth token을 저장합니다. 자세한 내용은 [Model providers](/concepts/model-providers) 참고.

### Is a local model OK for casual chats?

대체로 권장하지 않습니다. OpenClaw는 큰 context와 강한 안전성이 필요하기 때문에 작은 카드나 강한 양자화 모델은 자주 잘리고 새기 쉽습니다. 꼭 써야 한다면 로컬에서 가능한 한 큰 MiniMax M2.5 빌드를 돌리고 [/gateway/local-models](/gateway/local-models)를 참고하세요. 작거나 과하게 quantized된 모델은 prompt injection 위험이 더 큽니다. [Security](/gateway/security)도 함께 보세요.

### How do I keep hosted model traffic in a specific region?

region이 고정된 endpoint를 선택하세요. 예를 들어 OpenRouter는 MiniMax, Kimi, GLM에 대해 미국 호스팅 옵션을 제공합니다. 해당 variant를 고르면 트래픽을 그 지역 안에 유지할 수 있습니다. 동시에 Anthropic/OpenAI를 함께 두고 싶다면 `models.mode: "merge"`를 사용해 선택한 region provider를 유지하면서 fallbacks도 같이 둘 수 있습니다.

### Do I have to buy a Mac Mini to install this?

아니요. OpenClaw는 macOS 또는 Linux에서 실행되고, Windows는 WSL2를 권장합니다. Mac mini는 선택 사항입니다. 항상 켜 두는 호스트로 Mac mini를 쓰는 사람도 있지만, 작은 VPS, 홈서버, Raspberry Pi급 장비도 충분히 가능합니다.

Mac이 꼭 필요한 경우는 **macOS 전용 도구**를 쓸 때입니다. iMessage는 [BlueBubbles](/channels/bluebubbles)를 권장합니다. BlueBubbles server는 Mac에서 돌아가지만 Gateway는 Linux나 다른 곳에 두어도 됩니다. 다른 macOS 전용 도구가 필요하면 Gateway를 Mac에 두거나 macOS node를 연결하세요.

문서: [BlueBubbles](/channels/bluebubbles), [Nodes](/nodes), [Mac remote mode](/platforms/mac/remote)

### Do I need a Mac mini for iMessage support?

Messages에 로그인된 **어떤 macOS 기기든** 필요합니다. 반드시 Mac mini일 필요는 없습니다. iMessage는 **[BlueBubbles](/channels/bluebubbles)** 구성이 가장 권장됩니다. BlueBubbles server는 macOS에서 돌고, Gateway는 Linux나 다른 곳에 두어도 됩니다.

일반적인 구성:

* Gateway는 Linux/VPS에 두고, Messages에 로그인된 아무 Mac에서 BlueBubbles server 실행
* 가장 단순한 단일 머신 구성을 원한다면 모든 것을 Mac에서 실행

### If I buy a Mac mini to run OpenClaw, can I connect it to my MacBook Pro?

예. **Mac mini는 Gateway를 실행**하고, MacBook Pro는 **node**(companion device)로 연결할 수 있습니다. node는 Gateway를 돌리지 않고, 그 장치의 screen/camera/canvas 및 `system.run` 같은 기능만 제공합니다.

일반 패턴:

* Gateway는 Mac mini에서 항상 켜 둠
* MacBook Pro는 macOS app 또는 node host로 Gateway에 paired
* 상태 확인은 `openclaw nodes status`, `openclaw nodes list`

### Can I use Bun?

Bun은 **권장하지 않습니다**. 특히 WhatsApp과 Telegram에서 런타임 문제가 자주 보입니다. 안정적인 Gateway는 **Node**로 운영하세요.

실험적으로 Bun을 써 보고 싶다면 production이 아닌 Gateway에서, 특히 WhatsApp/Telegram 없이 시도하는 편이 안전합니다.

### Telegram: what goes in `allowFrom`?

`channels.telegram.allowFrom`에는 **사람 발신자의 Telegram user ID**가 들어갑니다. 숫자형 ID이며 bot username이 아닙니다.

onboarding wizard는 `@username` 입력을 받아 숫자 ID로 resolve할 수 있지만, OpenClaw authorization 자체는 숫자 ID만 사용합니다.

가장 안전한 확인 방법:

* bot에 DM을 보낸 뒤 `openclaw logs --follow`를 실행하고 `from.id`를 읽습니다.

공식 Bot API를 쓰려면:

* bot에 DM을 보낸 뒤 `https://api.telegram.org/bot<bot_token>/getUpdates`를 호출하고 `message.from.id`를 확인합니다.

서드파티는 개인정보 측면에서 덜 권장되지만 `@userinfobot`, `@getidsbot` 같은 봇도 있습니다.

참고: [/channels/telegram](/channels/telegram#access-control-dms--groups)

### Can multiple people use one WhatsApp number with different OpenClaw instances?

예. **multi-agent routing**으로 가능합니다. 각 사람의 WhatsApp **DM**(peer `kind: "direct"`, sender E.164 예: `+15551234567`)을 서로 다른 `agentId`에 바인딩하면 됩니다. 각 사람은 자기 workspace와 session store를 갖게 되지만, 응답은 여전히 **같은 WhatsApp 계정**에서 나갑니다. DM access control(`channels.whatsapp.dmPolicy`, `channels.whatsapp.allowFrom`)은 그 WhatsApp account 전체에 대해 공통입니다.

문서: [Multi-Agent Routing](/concepts/multi-agent), [WhatsApp](/channels/whatsapp)

### Can I run a "fast chat" agent and an "Opus for coding" agent?

예. multi-agent routing을 사용하면 됩니다. 각 agent에 서로 다른 기본 모델을 주고, inbound route를 각 agent에 묶으면 됩니다. 예시는 [Multi-Agent Routing](/concepts/multi-agent)에 있습니다. 추가로 [Models](/concepts/models), [Configuration](/gateway/configuration)도 참고하세요.

### Does Homebrew work on Linux?

예. Homebrew는 Linux도 지원합니다. 빠른 설치:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
brew install <formula>
```

OpenClaw를 systemd로 돌린다면 service PATH에 `/home/linuxbrew/.linuxbrew/bin` 또는 자신의 brew prefix가 포함되어 있는지 확인하세요. 그렇지 않으면 non-login shell에서 `brew` 설치 바이너리를 찾지 못합니다.

최근 빌드는 Linux systemd 서비스에서 흔한 user bin 디렉터리(`~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin` 등)를 자동으로 prepend하고, `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR`, `FNM_DIR`도 존중합니다.

### What's the difference between the hackable (git) install and npm install?

* **Hackable (git) install**: 전체 소스 체크아웃이 생기고 수정 가능합니다. 기여자에게 가장 적합합니다.
* **npm install**: 저장소 없이 전역 CLI만 설치합니다. "그냥 실행"이 목적일 때 적합합니다. 업데이트는 npm dist-tag를 통해 받습니다.

문서: [Getting started](/start/getting-started), [Updating](/install/updating)

### Can I switch between npm and git installs later?

예. 다른 설치 방식을 설치한 뒤 Doctor를 실행해 gateway service가 새 entrypoint를 가리키게 하면 됩니다.
이 작업은 **데이터를 삭제하지 않습니다**. OpenClaw 코드 설치만 바뀌고 state(`~/.openclaw`)와 workspace(`~/.openclaw/workspace`)는 그대로 남습니다.

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

Doctor는 gateway service entrypoint mismatch를 감지하고 현재 설치와 맞도록 서비스 config를 다시 쓰자고 제안합니다. 자동화에서는 `--repair`를 쓰면 됩니다.

백업 관련: [Backup strategy](/help/faq#whats-the-recommended-backup-strategy)

### Should I run the Gateway on my laptop or a VPS?

짧게 말하면 **24/7 안정성**이 필요하면 VPS, 마찰이 적은 개발/개인 사용이면 노트북도 괜찮습니다.

**Laptop(local Gateway)**

* 장점: 서버 비용 없음, 로컬 파일 접근이 즉시 가능, 보이는 브라우저 자동화
* 단점: 절전/네트워크 끊김에 취약, OS 업데이트/재부팅 영향, 계속 켜 둬야 함

**VPS / cloud**

* 장점: 항상 켜짐, 네트워크 안정적, 노트북 절전 문제 없음, 장기 운영에 유리
* 단점: 보통 headless, 파일 접근은 원격, 업데이트를 위해 SSH 필요

OpenClaw 관점에서는 WhatsApp/Telegram/Slack/Mattermost(plugin)/Discord는 VPS에서도 잘 동작합니다. 실질적인 차이는 **headless browser** 대 보이는 브라우저 정도입니다. [Browser](/tools/browser) 참고.

권장 기본값은 VPS입니다. 다만 Mac을 직접 쓰면서 로컬 파일 접근이나 가시적인 UI 자동화가 필요하다면 local도 충분히 좋습니다.

### How important is it to run OpenClaw on a dedicated machine?

필수는 아니지만 **신뢰성과 격리 측면에서 권장**됩니다.

* **전용 호스트(VPS/Mac mini/Pi)**: 항상 켜짐, 절전/재부팅 중단이 적음, 권한이 더 깔끔함
* **공용 노트북/데스크톱**: 테스트와 능동 사용에는 충분하지만 절전/업데이트로 끊길 수 있음

둘의 장점을 섞고 싶다면 Gateway는 전용 호스트에 두고, 노트북은 **node**로 연결해 로컬 screen/camera/exec 기능만 제공하게 하세요. [Nodes](/nodes), [Security](/gateway/security) 참고.

### What are the minimum VPS requirements and recommended OS?

OpenClaw는 가볍습니다. 기본 Gateway + 채널 하나 기준:

* **절대 최소:** 1 vCPU, 1GB RAM, 약 500MB 디스크
* **권장:** 1-2 vCPU, 2GB RAM 이상. 로그, 미디어, 다중 채널을 위한 여유

OS는 **Ubuntu LTS** 또는 최신 Debian/Ubuntu 계열이 가장 잘 검증되어 있습니다.

### Can I run OpenClaw in a VM and what are the requirements?

예. VM은 사실상 VPS처럼 취급하면 됩니다. 항상 켜져 있고, 접근 가능하며, Gateway와 채널이 쓸 RAM이 충분하면 됩니다.

기본 권장:

* **절대 최소:** 1 vCPU, 1GB RAM
* **권장:** 다중 채널, 브라우저 자동화, 미디어 도구를 쓰면 2GB RAM 이상
* **OS:** Ubuntu LTS 또는 최신 Debian/Ubuntu

Windows라면 **WSL2가 가장 쉬운 VM 스타일**이고 툴 호환성이 가장 좋습니다. [Windows](/platforms/windows), [VPS hosting](/vps), macOS VM이면 [macOS VM](/install/macos-vm) 참고.

## What is OpenClaw?

### What is OpenClaw, in one paragraph?

OpenClaw는 사용자의 기기에서 직접 실행하는 개인 AI assistant입니다. WhatsApp, Telegram, Slack, Mattermost(plugin), Discord, Google Chat, Signal, iMessage, WebChat 같은 기존 메시징 표면에서 응답하고, 지원 플랫폼에서는 voice와 live Canvas도 다룰 수 있습니다. **Gateway**는 항상 켜져 있는 control plane이고, assistant 자체가 제품입니다.

### What's the value proposition?

OpenClaw는 단순한 "Claude wrapper"가 아닙니다. 이미 쓰고 있는 채팅 앱에서 접근할 수 있고, **사용자 하드웨어 위에서**, stateful sessions, memory, tools를 가진 assistant를 운용하게 해 주는 **local-first control plane**입니다. 워크플로 제어권을 호스팅 SaaS에 넘기지 않아도 됩니다.

핵심 장점:

* **내 기기, 내 데이터:** Gateway를 Mac, Linux, VPS 어디에든 두고 workspace와 session history를 로컬에 보관
* **진짜 채널 지원:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage 등, 그리고 지원 플랫폼의 mobile voice/Canvas
* **모델 비종속:** Anthropic, OpenAI, MiniMax, OpenRouter 등을 agent별 routing/failover와 함께 사용
* **로컬 전용 선택지:** 원하면 모든 데이터를 기기 안에 남기는 local models 사용 가능
* **멀티 에이전트 routing:** 채널/계정/작업별로 workspace와 defaults가 다른 agent 분리
* **오픈소스 및 해킹 가능:** 검토, 확장, self-host 가능

문서: [Gateway](/gateway), [Channels](/channels), [Multi-agent](/concepts/multi-agent), [Memory](/concepts/memory)

### I just set it up what should I do first

처음 시도해 보기 좋은 프로젝트:

* 웹사이트 만들기(WordPress, Shopify, 정적 사이트)
* 모바일 앱 프로토타입(개요, 화면, API 계획)
* 파일/폴더 정리(정리, 이름 규칙, 태깅)
* Gmail 연결 후 요약 또는 후속 조치 자동화

큰 작업도 가능하지만, 여러 단계로 나누고 sub-agent를 활용할 때 가장 잘 동작합니다.

### What are the top five everyday use cases for OpenClaw

일상에서 체감이 큰 활용은 보통 다음과 같습니다.

* **개인 브리핑:** inbox, 캘린더, 관심 뉴스 요약
* **리서치와 초안 작성:** 메일이나 문서 초안, 짧은 조사와 요약
* **리마인더와 follow-up:** cron 또는 heartbeat 기반 알림과 체크리스트
* **브라우저 자동화:** 폼 입력, 데이터 수집, 반복 웹 작업
* **기기 간 조정:** 휴대폰에서 작업을 던지고, 서버의 Gateway가 실행한 뒤 결과를 채팅으로 받기

### Can OpenClaw help with lead gen outreach ads and blogs for a SaaS

예. **리서치, 자격 판별, 초안 작성**에는 꽤 유용합니다. 사이트를 스캔하고, 후보 목록을 만들고, 잠재 고객을 요약하고, outreach나 광고 문안 초안을 작성할 수 있습니다.

다만 **outreach나 실제 광고 집행**은 사람이 최종 확인하는 흐름을 유지하세요. 스팸, 현지 법, 플랫폼 정책을 위반하지 않도록 하고, 발송 전 검토가 가장 안전합니다.

### What are the advantages vs Claude Code for web development?

OpenClaw는 **IDE 대체품**이 아니라 personal assistant이자 coordination layer입니다. 저장소 안에서 가장 빠른 직접 코딩 루프는 Claude Code나 Codex가 더 적합합니다. OpenClaw는 지속되는 memory, cross-device access, tool orchestration이 필요할 때 강합니다.

장점:

* 세션을 넘어가는 **persistent memory + workspace**
* WhatsApp, Telegram, TUI, WebChat 같은 **다중 표면 접근**
* browser, files, scheduling, hooks를 아우르는 **tool orchestration**
* VPS에 둘 수 있는 **always-on Gateway**
* 로컬 browser/screen/camera/exec를 제공하는 **nodes**

Showcase: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

## Skills and automation

### How do I customize skills without keeping the repo dirty?

저장소 복사본을 직접 수정하지 말고 **managed override**를 쓰세요. 변경 내용은 `~/.openclaw/skills/<name>/SKILL.md`에 두거나 `~/.openclaw/openclaw.json`의 `skills.load.extraDirs`로 별도 폴더를 추가합니다. 우선순위는 `<workspace>/skills` > `~/.openclaw/skills` > bundled이므로, git 작업트리를 더럽히지 않고도 override가 적용됩니다. upstream에 반영할 가치가 있는 수정만 저장소에서 하고 PR로 보내면 됩니다.

### Can I load skills from a custom folder?

예. `~/.openclaw/openclaw.json`의 `skills.load.extraDirs`에 폴더를 추가하면 됩니다. 이 경로는 가장 낮은 우선순위입니다. 기본 우선순위는 `<workspace>/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs`입니다. `clawhub`는 기본적으로 `./skills`에 설치하며, OpenClaw는 이를 `<workspace>/skills`로 취급합니다.

### How can I use different models for different tasks?

현재 지원되는 주요 패턴:

* **Cron jobs**: job별 `model` override
* **Sub-agents**: 서로 다른 기본 모델을 갖는 agent로 작업 분리
* **On-demand switch**: 현재 세션에서 `/model`로 즉시 전환

문서: [Cron jobs](/automation/cron-jobs), [Multi-Agent Routing](/concepts/multi-agent), [Slash commands](/tools/slash-commands)

### The bot freezes while doing heavy work. How do I offload that?

길거나 병렬인 작업은 **sub-agents**로 넘기세요. sub-agent는 별도 session에서 실행되고, 요약만 반환하므로 메인 채팅이 덜 막힙니다.

bot에게 "이 작업을 sub-agent로 실행해"라고 요청하거나 `/subagents`를 사용하세요. 현재 Gateway가 무엇을 하고 있는지는 채팅의 `/status`로 볼 수 있습니다.

토큰 측면에서는 long task와 sub-agent 모두 비용이 들기 때문에, 비용이 민감하면 `agents.defaults.subagents.model`에 더 저렴한 모델을 지정하는 것이 좋습니다.

### How do thread-bound subagent sessions work on Discord

thread binding을 사용하면 됩니다. Discord thread를 특정 subagent나 session target에 묶어 두면, 그 thread의 후속 메시지가 같은 bound session으로 계속 들어갑니다.

기본 흐름:

* `sessions_spawn`에 `thread: true`를 사용하고, 필요하면 지속 follow-up을 위해 `mode: "session"` 지정
* 수동 바인딩은 `/focus <target>`
* `/agents`로 binding 상태 확인
* `/session idle <duration|off>`, `/session max-age <duration|off>`로 auto-unfocus 조정
* `/unfocus`로 thread 분리

필요 config:

* 전역 기본값: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`
* Discord override: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`
* spawn 시 자동 바인딩: `channels.discord.threadBindings.spawnSubagentSessions: true`

### Cron or reminders do not fire. What should I check?

Cron은 Gateway 프로세스 안에서 실행됩니다. Gateway가 계속 실행 중이 아니면 scheduled job도 돌지 않습니다.

체크리스트:

* `cron.enabled`가 켜져 있고 `OPENCLAW_SKIP_CRON`이 설정되지 않았는지
* Gateway가 24/7 실행 중인지
* job의 timezone 설정이 올바른지(`--tz` vs host timezone)

디버그:

```bash
openclaw cron run <jobId> --force
openclaw cron runs --id <jobId> --limit 50
```

### How do I install skills on Linux?

Linux에서는 **ClawHub CLI**를 사용하거나 workspace에 직접 skills를 넣으면 됩니다. macOS Skills UI는 Linux에서 제공되지 않습니다. 브라우징은 [https://clawhub.com](https://clawhub.com)에서 할 수 있습니다.

설치:

```bash
npm i -g clawhub
```

```bash
pnpm add -g clawhub
```

### Can OpenClaw run tasks on a schedule or continuously in the background?

예. Gateway scheduler를 쓰면 됩니다.

* **Cron jobs**: 재시작 후에도 유지되는 scheduled/repeating task
* **Heartbeat**: 메인 세션에 대한 주기적 체크
* **Isolated jobs**: 자율적으로 요약을 만들거나 채팅에 전달하는 agent job

### Can I run Apple macOS-only skills from Linux?

직접적으로는 불가능합니다. macOS 전용 skill은 `metadata.openclaw.os`와 필요한 바이너리 존재 여부에 의해 gating되며, **Gateway host**에서 조건을 만족할 때만 system prompt에 나타납니다. Linux에서는 `darwin` 전용 skill이 기본적으로 로드되지 않습니다.

지원되는 패턴은 세 가지입니다.

**Option A - Gateway를 Mac에서 실행**
가장 단순합니다. macOS 바이너리가 있는 곳에서 Gateway를 돌리고, Linux에서는 remote mode나 Tailscale로 연결하면 됩니다.

**Option B - macOS node 사용**
Gateway는 Linux에 두고, macOS node(menubar app)를 pair합니다. Node Run Commands를 "Always Ask" 또는 "Always Allow"로 설정하면, 필요한 바이너리가 node에 있을 때 macOS 전용 skill을 `nodes` 도구를 통해 실행할 수 있습니다.

**Option C - SSH로 macOS 바이너리 프록시**
Linux Gateway를 유지하되 필요한 CLI 바이너리를 Mac에서 SSH로 실행하는 wrapper로 감싸고, skill metadata에서 Linux를 허용하도록 override합니다.

1. SSH wrapper 작성
2. Linux host의 `PATH`에 둠
3. workspace 또는 `~/.openclaw/skills`에서 skill metadata override
4. 새 session을 시작해 skills snapshot 갱신

### Do you have a Notion or HeyGen integration?

현재 built-in은 아닙니다.

선택지:

* **Custom skill / plugin**: API 접근이 확실하고 안정적
* **Browser automation**: 코드는 필요 없지만 느리고 깨지기 쉬움

클라이언트별 컨텍스트를 유지해야 한다면, 간단하게는 클라이언트마다 Notion 페이지 하나를 두고 세션 시작 시 agent가 그 페이지를 가져오게 하는 패턴이 잘 먹힙니다.

원하는 네이티브 통합이 있다면 feature request를 열거나 해당 API용 skill을 직접 만들면 됩니다.

설치:

```bash
clawhub install <skill-slug>
clawhub update --all
```

ClawHub는 기본적으로 현재 디렉터리의 `./skills`에 설치하고, OpenClaw는 이를 다음 세션에서 `<workspace>/skills`로 봅니다. agent 간 공유하려면 `~/.openclaw/skills/<name>/SKILL.md`에 두면 됩니다. 일부 skill은 Homebrew 바이너리를 기대하며, Linux에서는 Linuxbrew를 의미합니다.

### How do I install the Chrome extension for browser takeover?

내장 installer를 실행한 뒤 Chrome에서 unpacked extension을 로드하면 됩니다.

```bash
openclaw browser extension install
openclaw browser extension path
```

그다음 Chrome에서 `chrome://extensions` → "Developer mode" 활성화 → "Load unpacked" → 해당 폴더 선택.

전체 가이드는 [Chrome extension](/tools/chrome-extension) 참고.

Gateway가 Chrome과 같은 머신에 있다면 보통 추가 설정이 필요 없습니다. Gateway가 다른 곳에 있다면 browser가 도는 머신에서 node host를 실행해 browser actions를 프록시하도록 해야 합니다. 그래도 제어하려는 탭에서 extension 버튼은 직접 눌러야 합니다. 자동 attach는 되지 않습니다.

## Sandboxing and memory

### Is there a dedicated sandboxing doc?

예. [Sandboxing](/gateway/sandboxing)을 보세요. Docker 전체 구성이나 sandbox 이미지까지 포함한 설정은 [Docker](/install/docker)에 있습니다.

### Docker feels limited. How do I enable full features?

기본 이미지는 보안을 우선하며 `node` 사용자로 실행됩니다. 따라서 system packages, Homebrew, bundled browsers가 포함되지 않습니다. 더 꽉 찬 환경이 필요하면:

* `OPENCLAW_HOME_VOLUME`으로 `/home/node`를 유지해 cache 보존
* `OPENCLAW_DOCKER_APT_PACKAGES`로 이미지에 system dependency bake
* 번들 CLI로 Playwright browser 설치
  `node /app/node_modules/playwright-core/cli.js install chromium`
* `PLAYWRIGHT_BROWSERS_PATH`를 설정하고 그 경로도 영속화

추가로 **DM은 개인적으로 유지하고 group만 공개 sandbox로 돌리는지**도 가능합니다. private traffic이 DM이고 public traffic이 group이라면 `agents.defaults.sandbox.mode: "non-main"`을 써서 group/channel session만 Docker에서 실행하게 하고, main DM session은 호스트에서 실행할 수 있습니다. `tools.sandbox.tools`로 sandbox 세션에서 허용하는 도구를 더 제한할 수 있습니다.

관련 문서: [Groups: personal DMs + public groups](/channels/groups#pattern-personal-dms-public-groups-single-agent), [Gateway configuration](/gateway/configuration#agentsdefaultssandbox)

### How do I bind a host folder into the sandbox?

`agents.defaults.sandbox.docker.binds`에 `["host:path:mode"]` 형식으로 넣으면 됩니다. 예: `"/home/user/src:/src:ro"`. 전역 bind와 agent별 bind는 merge되고, `scope: "shared"`일 때는 agent별 bind가 무시됩니다. 민감한 경로는 `:ro`를 쓰고, bind mount가 sandbox filesystem 벽을 우회한다는 점을 항상 기억하세요.

### How does memory work?

OpenClaw memory는 기본적으로 agent workspace 안의 Markdown 파일입니다.

* 일일 메모: `memory/YYYY-MM-DD.md`
* 장기 메모: `MEMORY.md`(main/private session 전용)

또한 auto-compaction 전에 durable note 작성을 유도하는 **silent pre-compaction memory flush**가 있습니다. workspace가 writable할 때만 실행됩니다. read-only sandbox에서는 건너뜁니다.

### Memory keeps forgetting things. How do I make it stick?

bot에게 **그 사실을 memory에 쓰라고 명시적으로 요청**하세요. 장기적으로 남길 내용은 `MEMORY.md`, 단기 문맥은 `memory/YYYY-MM-DD.md`가 맞습니다.

이 영역은 계속 개선 중입니다. 모델에게 "기억으로 저장해"라고 한 번 더 상기시키는 것만으로도 도움이 됩니다. 여전히 자주 잊는다면 Gateway가 매번 같은 workspace를 쓰는지 확인하세요.

### Does semantic memory search require an OpenAI API key?

**OpenAI embeddings**를 쓸 때만 필요합니다. Codex OAuth는 chat/completions용이고 embeddings 권한을 주지 않습니다. 즉 Codex로 로그인했더라도 semantic memory search에는 별도의 실제 OpenAI API key(`OPENAI_API_KEY` 또는 `models.providers.openai.apiKey`)가 필요합니다.

provider를 명시하지 않으면 OpenClaw는 사용 가능한 API key를 바탕으로 provider를 자동 선택합니다. 우선순위는 대략 OpenAI → Gemini → Voyage → Mistral이고, remote key가 없으면 memory search는 비활성 상태로 남습니다. local model 경로가 설정되어 있고 실제 존재하면 `local`을 우선합니다. Ollama는 `memorySearch.provider = "ollama"`일 때 지원됩니다.

완전 로컬로 가고 싶다면 `memorySearch.provider = "local"`을 사용하고, 필요하면 `memorySearch.fallback = "none"`도 설정하세요. Gemini embeddings를 쓰려면 `memorySearch.provider = "gemini"`와 `GEMINI_API_KEY` 또는 `memorySearch.remote.apiKey`를 설정하세요.

### Does memory persist forever? What are the limits?

memory 파일은 디스크에 있기 때문에 지우기 전까지 유지됩니다. 한계는 모델이 아니라 저장소 용량입니다. 다만 **session context** 자체는 모델 context window의 제약을 받기 때문에 긴 대화는 compact/truncate될 수 있습니다. 그래서 memory search가 필요한 것입니다. 관련 있는 부분만 다시 문맥으로 가져옵니다.

## Where things live on disk

### Is all data used with OpenClaw saved locally?

아니요. **OpenClaw의 state는 로컬**이지만, **외부 서비스로 보내는 데이터는 그 서비스가 보게 됩니다.**

* **기본적으로 로컬:** sessions, memory files, config, workspace는 Gateway host에 저장
* **본질적으로 원격:** Anthropic/OpenAI 등 model provider API로 보내는 데이터, WhatsApp/Telegram/Slack 같은 chat platform 메시지 데이터
* **사용자가 footprint를 통제:** local models를 쓰면 prompt는 로컬에 남지만, 채널 트래픽은 여전히 해당 채널 서버를 거칩니다

### Where does OpenClaw store its data?

기본은 모두 `$OPENCLAW_STATE_DIR`(기본: `~/.openclaw`) 아래에 있습니다.

| Path                                                            | Purpose                                                            |
| --------------------------------------------------------------- | ------------------------------------------------------------------ |
| `$OPENCLAW_STATE_DIR/openclaw.json`                             | Main config (JSON5)                                                |
| `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Legacy OAuth import (copied into auth profiles on first use)       |
| `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Auth profiles (OAuth, API keys, and optional `keyRef`/`tokenRef`)  |
| `$OPENCLAW_STATE_DIR/secrets.json`                              | Optional file-backed secret payload for `file` SecretRef providers |
| `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Legacy compatibility file (static `api_key` entries scrubbed)      |
| `$OPENCLAW_STATE_DIR/credentials/`                              | Provider state (e.g. `whatsapp/<accountId>/creds.json`)            |
| `$OPENCLAW_STATE_DIR/agents/`                                   | Per-agent state (agentDir + sessions)                              |
| `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Conversation history & state (per agent)                           |
| `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Session metadata (per agent)                                       |

legacy single-agent 경로는 `~/.openclaw/agent/*`이며 `openclaw doctor`가 마이그레이션합니다.

workspace는 별도이며 `agents.defaults.workspace`로 지정합니다. 기본값은 `~/.openclaw/workspace`입니다.

### Where should AGENTS.md / SOUL.md / USER.md / MEMORY.md live?

이 파일들은 `~/.openclaw`가 아니라 **agent workspace**에 둡니다.

* **Workspace(에이전트별):** `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`, `MEMORY.md`(또는 `memory.md`), `memory/YYYY-MM-DD.md`, 선택적 `HEARTBEAT.md`
* **State dir(`~/.openclaw`)**: config, credentials, auth profiles, sessions, logs, shared skills(`~/.openclaw/skills`)

기본 workspace:

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

재시작 후 bot이 잊는다면 매번 같은 workspace를 쓰는지 확인하세요. remote mode에서는 **로컬 노트북이 아니라 gateway host의 workspace**를 사용합니다.

지속적으로 남길 행동이나 선호는 chat history가 아니라 **AGENTS.md나 MEMORY.md에 기록하게 하는 것**이 가장 안전합니다.

### What's the recommended backup strategy?

**agent workspace**를 **private git repo**에 두고 사적으로 백업하는 것을 권장합니다. 이렇게 하면 memory와 AGENTS/SOUL/USER 파일을 보존해 나중에 assistant의 "마음"을 복원할 수 있습니다.

반대로 `~/.openclaw` 아래는 커밋하지 마세요. credentials, sessions, tokens, encrypted secret payload가 포함됩니다. 완전한 복구가 필요하다면 workspace와 state directory를 **별도로** 백업해야 합니다.

### How do I completely uninstall OpenClaw?

전용 문서인 [Uninstall](/install/uninstall)을 보세요.

### Can agents work outside the workspace?

예. workspace는 **기본 cwd**이자 memory anchor이지, 강제 sandbox는 아닙니다. 상대 경로는 workspace 안에서 해석되지만 절대 경로는 sandbox가 꺼져 있으면 다른 호스트 위치에도 접근할 수 있습니다. 실제 격리가 필요하면 [`agents.defaults.sandbox`](/gateway/sandboxing) 또는 agent별 sandbox 설정을 사용하세요.

저장소를 기본 작업 디렉터리로 삼고 싶다면 해당 agent의 `workspace`를 repo root로 지정하면 됩니다.

```json5
{
  agents: {
    defaults: {
      workspace: "~/Projects/my-repo",
    },
  },
}
```

### I'm in remote mode - where is the session store?

session state는 **gateway host**가 소유합니다. remote mode에서는 중요한 session store가 로컬 노트북이 아니라 원격 머신에 있습니다. [Session management](/concepts/session) 참고.

## Config basics

### What format is the config? Where is it?

OpenClaw는 선택적인 **JSON5** config를 `$OPENCLAW_CONFIG_PATH`에서 읽습니다. 기본값은 `~/.openclaw/openclaw.json`입니다.

파일이 없으면 `~/.openclaw/workspace`를 포함한 비교적 안전한 기본값으로 동작합니다.

### I set `gateway.bind: "lan"` (or `"tailnet"`) and now nothing listens / the UI says unauthorized

loopback이 아닌 bind는 **auth가 필수**입니다. `gateway.auth.mode`와 `gateway.auth.token`을 설정하거나 `OPENCLAW_GATEWAY_TOKEN`을 사용하세요.

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

주의:

* `gateway.remote.token`/`.password`는 local gateway auth를 자동으로 켜 주지 않습니다.
* local call path는 `gateway.auth.*`가 비어 있으면 `gateway.remote.*`를 fallback으로 사용할 수 있습니다.
* Control UI는 `connect.params.auth.token`으로 인증합니다. URL에 token을 넣는 방식은 피하세요.

### Why do I need a token on localhost now?

OpenClaw는 기본적으로 loopback에서도 token auth를 강제합니다. token이 없으면 gateway startup 시 자동 생성해 `gateway.auth.token`에 저장합니다. 그래서 **로컬 WS client도 인증**해야 합니다. 같은 머신의 다른 프로세스가 함부로 Gateway를 호출하지 못하게 막기 위한 장치입니다.

정말로 open loopback을 원하면 `gateway.auth.mode: "none"`을 명시해야 합니다. Doctor는 언제든 `openclaw doctor --generate-gateway-token`으로 token을 생성해 줄 수 있습니다.

### Do I have to restart after changing config?

Gateway는 config를 감시하고 hot-reload를 지원합니다.

* `gateway.reload.mode: "hybrid"`(기본): 안전한 변경은 hot-apply, 핵심 변경은 restart
* `hot`, `restart`, `off`도 지원

### How do I disable funny CLI taglines?

config의 `cli.banner.taglineMode`로 제어합니다.

```json5
{
  cli: {
    banner: {
      taglineMode: "off", // random | default | off
    },
  },
}
```

* `off`: tagline만 숨기고 banner 제목/버전은 유지
* `default`: 항상 `All your chats, one OpenClaw.`
* `random`: 계절성 포함한 회전 tagline. 기본값
* 배너 전체를 숨기고 싶으면 `OPENCLAW_HIDE_BANNER=1`

### How do I enable web search (and web fetch)?

`web_fetch`는 API key 없이도 동작합니다. `web_search`는 Brave Search API key가 필요합니다. 권장 경로는 `openclaw configure --section web`로 `tools.web.search.apiKey`에 저장하는 것입니다. 환경 변수로는 Gateway 프로세스에 `BRAVE_API_KEY`를 주면 됩니다.

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

주의:

* allowlist를 쓴다면 `web_search`/`web_fetch` 또는 `group:web`를 추가
* `web_fetch`는 명시적으로 끄지 않는 한 기본적으로 켜져 있음
* daemon은 `~/.openclaw/.env` 또는 서비스 환경에서 env vars를 읽음

### How do I run a central Gateway with specialized workers across devices?

일반적인 패턴은 **Gateway 하나** + **nodes** + **agents**입니다.

* **Gateway(중앙):** channels, routing, sessions를 소유
* **Nodes(장치):** Mac/iOS/Android 등이 peripheral로 연결되어 `system.run`, `canvas`, `camera` 같은 로컬 기능 제공
* **Agents(workers):** 역할별로 다른 brain/workspace/model defaults
* **Sub-agents:** 메인 agent에서 병렬 background work를 실행
* **TUI:** Gateway에 연결해 agents/sessions 전환

### Can the OpenClaw browser run headless?

예. config 옵션입니다.

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

기본값은 `false`입니다. headless는 일부 사이트에서 anti-bot 감지를 더 자주 촉발할 수 있습니다. 하지만 같은 Chromium 엔진을 사용하므로 대부분의 자동화는 동작합니다. 차이는 보이는 창이 없고, 일부 사이트가 headless를 더 엄격히 막는다는 점입니다.

### How do I use Brave for browser control?

`browser.executablePath`를 Brave 바이너리(또는 다른 Chromium 기반 브라우저) 경로로 지정하고 Gateway를 재시작하면 됩니다. [Browser](/tools/browser#use-brave-or-another-chromium-based-browser)의 예시를 참고하세요.

## Remote gateways and nodes

### How do commands propagate between Telegram, the gateway, and nodes?

Telegram 메시지는 **gateway**가 처리합니다. gateway가 agent를 실행하고, 필요한 경우에만 **Gateway WebSocket**을 통해 `node.*` 도구를 호출합니다.

Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

node는 inbound provider traffic을 직접 보지 않고, node RPC 호출만 받습니다.

### How can my agent access my computer if the Gateway is hosted remotely?

짧은 답은 **내 컴퓨터를 node로 pair하라**입니다. Gateway는 다른 곳에서 돌더라도, Gateway WebSocket을 통해 로컬 머신의 `node.*` 도구(screen, camera, system)를 호출할 수 있습니다.

일반적인 구성:

1. 항상 켜 둘 호스트(VPS/홈서버)에 Gateway 실행
2. Gateway host와 내 컴퓨터를 같은 tailnet에 연결
3. Gateway WS가 reachable한지 확인(tailnet bind 또는 SSH tunnel)
4. 로컬 macOS app을 **Remote over SSH** 또는 direct tailnet으로 연결해 node 등록
5. Gateway에서 node 승인

   ```bash
   openclaw devices list
   openclaw devices approve <requestId>
   ```

별도의 TCP bridge는 필요 없습니다. node는 Gateway WebSocket으로 바로 연결됩니다.

### Tailscale is connected but I get no replies. What now?

기본 점검:

* Gateway 실행 중인지: `openclaw gateway status`
* Gateway health: `openclaw status`
* Channel health: `openclaw channels status`

그다음 auth와 routing을 봅니다.

* Tailscale Serve를 쓴다면 `gateway.auth.allowTailscale`이 맞는지
* SSH tunnel을 쓴다면 로컬 tunnel이 살아 있고 올바른 포트를 가리키는지
* DM/group allowlist에 내 계정이 포함되는지

### Can two OpenClaw instances talk to each other (local + VPS)?

예. built-in bot-to-bot bridge는 없지만 신뢰할 수 있는 방법은 있습니다.

가장 단순한 방법은 두 봇이 접근할 수 있는 일반 채팅 채널(Telegram/Slack/WhatsApp 등)을 사용하는 것입니다. Bot A가 Bot B에게 메시지를 보내고, Bot B가 그 채널에서 정상 응답하도록 하면 됩니다.

또는 한 쪽 Gateway를 향해 `openclaw agent --message ... --deliver`를 호출하는 스크립트 브리지를 만들 수도 있습니다.

```bash
openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
```

봇끼리 무한 루프에 빠지지 않도록 mention-only, allowlist, "bot 메시지에는 답하지 않기" 같은 guardrail을 두는 것이 좋습니다.

### Do I need separate VPSes for multiple agents?

아니요. 보통은 **Gateway 하나**에 여러 agent를 두는 것이 정상적이고, 훨씬 저렴하고 단순합니다. 각 agent는 자체 workspace, model defaults, routing을 가질 수 있습니다.

별도 VPS는 보안 경계가 정말 필요하거나 config를 전혀 공유하고 싶지 않을 때만 고려하세요.

### Is there a benefit to using a node on my personal laptop instead of SSH from a VPS?

예. node는 원격 Gateway에서 노트북을 쓰는 **1급 방법**이며, 단순 SSH shell보다 더 많은 기능을 제공합니다.

* **Inbound SSH 불필요:** node가 밖으로 Gateway WebSocket에 연결
* **더 안전한 실행 제어:** 그 노트북에서 `system.run`은 allowlist/approval을 거침
* **추가 장치 도구:** `canvas`, `camera`, `screen` 제공
* **로컬 browser 자동화:** Gateway는 VPS에 두고, laptop에서 Chrome extension + node host로 제어

SSH는 단발성 셸 접근에는 괜찮지만, 지속적인 agent workflow와 device automation에는 node가 더 자연스럽습니다.

### Should I install on a second laptop or just add a node?

두 번째 노트북에서 필요한 것이 \*\*로컬 도구(screen/camera/exec)\*\*뿐이라면 **node만 추가**하세요. 이렇게 하면 Gateway를 하나로 유지하면서 중복 config를 피할 수 있습니다. 완전히 분리된 두 bot이 필요할 때만 두 번째 Gateway 설치를 고려하면 됩니다.

### Do nodes run a gateway service?

아니요. 의도적으로 profile을 나눠 격리하지 않는 한 호스트당 Gateway는 하나만 두는 것이 맞습니다. node는 gateway에 연결되는 peripheral입니다. iOS/Android node나 macOS menubar app의 node mode가 여기에 해당합니다. `gateway`, `discovery`, `canvasHost` 변경은 전체 재시작이 필요합니다.

### Is there an API / RPC way to apply config?

예. `config.apply`가 full config를 검증하고 쓰며, 그 과정에서 Gateway도 재시작합니다.

### config.apply wiped my config. How do I recover and avoid this?

`config.apply`는 **전체 config**를 교체합니다. partial object를 보내면 나머지 항목이 전부 사라집니다.

복구 방법:

* backup이 있으면 복원
* backup이 없으면 `openclaw doctor`를 다시 실행하고 channels/models를 재설정
* 예상치 못한 동작이었다면 마지막으로 알고 있던 config나 backup과 함께 bug를 보고
* 로컬 coding agent가 logs/history를 바탕으로 working config를 복원할 수도 있음

예방 방법:

* 작은 변경은 `openclaw config set`
* 대화형 수정은 `openclaw configure`

### What's a minimal "sane" config for a first install?

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

workspace를 지정하고, 누가 bot을 트리거할 수 있는지 제한하는 최소 구성입니다.

### How do I set up Tailscale on a VPS and connect from my Mac?

최소 단계:

1. **VPS에 설치 + 로그인**

   ```bash
   curl -fsSL https://tailscale.com/install.sh | sh
   sudo tailscale up
   ```

2. **Mac에 설치 + 로그인**
   * Tailscale app으로 같은 tailnet에 로그인

3. **MagicDNS 활성화(권장)**

4. **tailnet hostname 사용**
   * SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
   * Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

Control UI를 SSH 없이 쓰고 싶다면 VPS에서:

```bash
openclaw gateway --tailscale serve
```

### How do I connect a Mac node to a remote Gateway (Tailscale Serve)?

Serve는 **Gateway Control UI + WS**를 노출합니다. node도 같은 Gateway WS endpoint를 사용합니다.

권장 구성:

1. VPS와 Mac을 같은 tailnet에 둠
2. macOS app을 Remote mode로 사용. SSH target은 tailnet hostname 가능
3. gateway에서 node 승인

   ```bash
   openclaw devices list
   openclaw devices approve <requestId>
   ```

## Env vars and .env loading

### How does OpenClaw load environment variables?

OpenClaw는 부모 프로세스의 env(shell, launchd/systemd, CI 등)를 읽고, 추가로 다음도 로드합니다.

* 현재 작업 디렉터리의 `.env`
* 전역 fallback `.env`: `~/.openclaw/.env` 또는 `$OPENCLAW_STATE_DIR/.env`

두 `.env` 모두 기존 env 값을 덮어쓰지 않습니다.

config 안에 인라인 env를 둘 수도 있습니다. 이 값들은 process env에 없을 때만 적용됩니다.

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

전체 precedence는 [/environment](/help/environment)를 참고하세요.

### "I started the Gateway via the service and my env vars disappeared." What now?

보통 해결책은 두 가지입니다.

1. 누락된 키를 `~/.openclaw/.env`에 넣어 서비스가 셸 환경을 상속하지 않아도 읽게 함
2. shell import를 켜기

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

이 기능은 login shell을 실행하고 필요한 키 중 **없는 것만** 가져옵니다. `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`도 동일합니다.

### I set `COPILOT_GITHUB_TOKEN`, but models status shows "Shell env: off." Why?

`openclaw models status`의 `"Shell env: off"`는 **shell env import가 꺼져 있다**는 의미일 뿐, env vars 자체가 없다는 뜻은 아닙니다.

Gateway가 서비스로 실행되면 launchd/systemd가 사용자의 셸 환경을 자동 상속하지 않습니다. 해결책:

1. token을 `~/.openclaw/.env`에 넣기

   ```
   COPILOT_GITHUB_TOKEN=...
   ```

2. shell import 활성화(`env.shellEnv.enabled: true`)

3. 또는 config의 `env` 블록에 넣기

그리고 gateway를 재시작한 뒤 다시 확인하세요.

```bash
openclaw models status
```

Copilot token은 `COPILOT_GITHUB_TOKEN`을 우선 읽고, `GH_TOKEN`, `GITHUB_TOKEN`도 봅니다.

## Sessions and multiple chats

### How do I start a fresh conversation?

독립 메시지로 `/new` 또는 `/reset`을 보내면 됩니다. [Session management](/concepts/session) 참고.

### Do sessions reset automatically if I never send `/new`?

예. 세션은 `session.idleMinutes`(기본 **60**) 후 만료됩니다. 그 채팅 키에서 **다음 메시지**가 오면 새로운 session id가 시작됩니다. transcript를 지우는 것이 아니라 새 세션을 시작하는 것입니다.

```json5
{
  session: {
    idleMinutes: 240,
  },
}
```

### Is there a way to make a team of OpenClaw instances one CEO and many agents

예. **multi-agent routing**과 **sub-agents**로 가능합니다. coordinator agent 하나와 자체 workspace/model을 가진 worker agent 여러 개를 만들 수 있습니다.

다만 재미있는 실험으로는 좋지만 토큰 소모가 크고, 실제로는 봇 하나에 세션을 나눠 쓰는 편이 더 효율적인 경우가 많습니다.

### Why did context get truncated mid-task? How do I prevent it?

session context는 모델 window에 묶여 있습니다. 긴 대화, 큰 도구 출력, 많은 파일은 compaction 또는 truncation을 일으킬 수 있습니다.

도움이 되는 방법:

* 현재 상태를 요약해서 파일에 쓰게 하기
* 긴 작업 전 `/compact`, 주제 전환 시 `/new`
* 중요한 문맥은 workspace에 저장하고 다시 읽게 하기
* 긴 작업/병렬 작업은 sub-agent로 분리
* 더 큰 context window 모델 사용

### How do I completely reset OpenClaw but keep it installed?

다음 명령을 사용합니다.

```bash
openclaw reset
```

비대화형 전체 reset:

```bash
openclaw reset --scope full --yes --non-interactive
```

그 후 onboarding을 다시 실행:

```bash
openclaw onboard --install-daemon
```

profile을 쓴다면 각 state dir(`~/.openclaw-<profile>`)도 따로 reset해야 합니다. dev reset은 `openclaw gateway --dev --reset`입니다.

### I'm getting "context too large" errors - how do I reset or compact?

다음 중 하나를 쓰세요.

* **Compact**

  ```
  /compact
  ```

  또는 `/compact <instructions>`로 요약 방식을 안내할 수 있습니다.

* **Reset**

  ```
  /new
  /reset
  ```

계속 반복되면:

* **session pruning**(`agents.defaults.contextPruning`) 조정
* 더 큰 context window 모델 사용

### Why am I seeing "LLM request rejected: messages.content.tool\_use.input field required"?

provider validation error입니다. 모델이 필수 `input` 없는 `tool_use` block을 냈다는 뜻입니다. 보통 session history가 오래되었거나 손상된 경우에 생깁니다. 긴 thread나 tool/schema 변경 뒤에 자주 보입니다.

가장 빠른 해결은 `/new`로 새 세션을 시작하는 것입니다.

### Why am I getting heartbeat messages every 30 minutes?

heartbeat의 기본 주기는 **30m**입니다. 조정하거나 끄려면:

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

`HEARTBEAT.md`가 사실상 비어 있으면 heartbeat run을 건너뛰어 API call을 아낍니다. 파일이 없더라도 heartbeat는 실행되고 모델이 무엇을 할지 결정합니다.

### Do I need to add a "bot account" to a WhatsApp group?

아니요. OpenClaw는 **사용자 본인 계정 위에서** 동작합니다. 따라서 사용자가 그룹에 있으면 OpenClaw도 그 그룹을 볼 수 있습니다. 기본적으로 group reply는 `groupPolicy: "allowlist"` 때문에 허용된 발신자만 트리거할 수 있습니다.

오직 본인만 group에서 트리거하게 하고 싶다면:

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

### How do I get the JID of a WhatsApp group?

가장 빠른 방법은 로그를 tail하면서 그룹에 테스트 메시지를 보내는 것입니다.

```bash
openclaw logs --follow --json
```

`@g.us`로 끝나는 `chatId` 또는 `from` 값을 찾으면 됩니다. 예: `1234567890-1234567890@g.us`

이미 설정이 되어 있다면:

```bash
openclaw directory groups list --channel whatsapp
```

### Why doesn't OpenClaw reply in a group?

가장 흔한 이유는 둘입니다.

* mention gating이 켜져 있어 bot을 @mention해야 함
* `channels.whatsapp.groups`를 설정했는데 `"*"`가 없고, 현재 그룹이 allowlist에 없음

### Do groups/threads share context with DMs?

직접 대화는 기본적으로 main session으로 합쳐집니다. 반면 groups/channels는 별도 session key를 가지며, Telegram topic과 Discord thread도 각자 독립 세션입니다.

### How many workspaces and agents can I create?

하드 제한은 없습니다. 수십 개, 심지어 수백 개도 가능하지만 다음을 주시해야 합니다.

* **디스크 증가:** sessions와 transcript가 `~/.openclaw/agents/<agentId>/sessions/`에 쌓임
* **토큰 비용:** agent가 늘수록 동시 모델 사용도 늘어남
* **운영 복잡도:** agent별 auth profiles, workspaces, channel routing 관리

권장:

* agent마다 활성 workspace는 하나로 유지
* 디스크가 커지면 오래된 session 정리
* `openclaw doctor`로 stray workspace나 profile mismatch 점검

### Can I run multiple bots or chats at the same time (Slack), and how should I set that up?

예. **Multi-Agent Routing**을 사용해 여러 isolated agent를 띄우고, channel/account/peer 기준으로 inbound message를 각 agent에 라우팅할 수 있습니다. Slack도 특정 agent에 바인딩할 수 있습니다.

browser access는 강력하지만 사람처럼 "무엇이든" 되는 것은 아닙니다. anti-bot, CAPTCHA, MFA가 자동화를 막을 수 있습니다. 가장 안정적인 browser control은 브라우저가 실제로 도는 머신에서 Chrome extension relay를 쓰는 것입니다.

권장 구성:

* 항상 켜 둔 Gateway host(VPS/Mac mini)
* 역할별 agent 하나씩
* Slack channel을 해당 agent에 바인딩
* 필요 시 local browser는 extension relay나 node로 연결

## Models: defaults, selection, aliases, switching

### What is the "default model"?

OpenClaw의 기본 모델은 결국 다음 값입니다.

`agents.defaults.model.primary`

모델은 `provider/model` 형식으로 지정합니다. 예: `anthropic/claude-opus-4-6`. provider를 생략하면 현재는 임시 호환성 차원에서 `anthropic`을 가정하지만, **명시적으로** `provider/model`을 쓰는 것이 맞습니다.

### What model do you recommend?

권장 기본값은 **현재 provider stack에서 쓸 수 있는 가장 강한 최신 세대 모델**입니다.

* tool-enabled 또는 untrusted-input agent: 비용보다 모델 강도를 우선
* 일상적이고 낮은 위험의 chat: 더 저렴한 fallback 모델을 쓰고 역할별로 routing

high-stakes 작업은 가능한 최고의 모델을, routine chat/summary는 더 저렴한 모델을 쓰는 것이 일반적인 원칙입니다. agent별 라우팅과 sub-agent로 작업을 병렬화할 수 있습니다.

강한 경고: 약하거나 과하게 quantized된 모델은 prompt injection과 unsafe behavior에 더 취약합니다. [Security](/gateway/security) 참고.

### How do I switch models without wiping my config?

**model 전용 명령**이나 **모델 관련 필드만 수정**하세요. 전체 config replace는 피하는 것이 안전합니다.

안전한 선택지:

* 채팅에서 `/model`
* `openclaw models set ...`
* `openclaw configure --section model`
* `~/.openclaw/openclaw.json`의 `agents.defaults.model`만 수정

`config.apply`에 partial object를 넘기면 전체 config를 덮어쓸 수 있으니 주의하세요. 이미 덮어썼다면 backup에서 복원하거나 `openclaw doctor`로 복구하세요.

### Can I use self-hosted models (llama.cpp, vLLM, Ollama)?

예. 로컬 서버가 OpenAI-compatible API를 제공한다면 custom provider로 연결할 수 있습니다. Ollama는 직접 지원되므로 가장 쉬운 경로입니다.

보안상 작은 모델이나 강한 양자화 모델은 prompt injection에 더 취약하므로, tool을 쓸 수 있는 bot에는 **큰 모델**을 강하게 권장합니다. 작은 모델을 꼭 쓰려면 sandboxing과 엄격한 tool allowlist를 함께 사용하세요.

### What do OpenClaw, Flawd, and Krill use for models?

* 이 배포들은 서로 다를 수 있고 시간이 지나며 바뀝니다. 고정 추천 provider는 없습니다.
* 각 gateway에서 `openclaw models status`로 현재 런타임 설정을 확인하세요.
* security-sensitive/tool-enabled agent에는 항상 가능한 최신 강력 모델을 쓰는 것이 좋습니다.

### How do I switch models on the fly (without restarting)?

독립 메시지로 `/model`을 보내면 됩니다.

```
/model sonnet
/model haiku
/model opus
/model gpt
/model gpt-mini
/model gemini
/model gemini-flash
```

`/model`, `/model list`, `/model status`로 사용 가능한 모델과 현재 상태를 볼 수 있습니다. 번호 선택도 가능합니다.

```
/model 3
```

provider의 특정 auth profile을 세션 단위로 강제할 수도 있습니다.

```
/model opus@anthropic:default
/model opus@anthropic:work
```

`/model status`는 현재 active agent, 사용 중인 `auth-profiles.json`, 다음에 시도할 auth profile, provider endpoint(`baseUrl`), API mode(`api`)까지 보여줍니다.

profile pin을 해제하려면 `@profile` 없이 다시 `/model`을 보내면 됩니다.

### Can I use GPT 5.2 for daily tasks and Codex 5.3 for coding

예. 하나를 기본값으로 두고 필요할 때 바꾸면 됩니다.

* 세션별 빠른 전환: `/model gpt-5.2`, `/model openai-codex/gpt-5.4`
* 기본값 + 전환: `agents.defaults.model.primary`에 `openai/gpt-5.2`를 두고 coding 때만 `openai-codex/gpt-5.4`로 전환
* sub-agent: coding만 별도 default model을 가진 sub-agent로 분리

### Why do I see "Model … is not allowed" and then no reply?

`agents.defaults.models`가 설정되어 있으면 그 목록이 `/model`과 세션 override의 **allowlist**가 됩니다. 그 안에 없는 모델을 고르면 다음 오류가 나고 일반 응답 대신 종료됩니다.

```
Model "provider/model" is not allowed. Use /model to list available models.
```

해결: 모델을 `agents.defaults.models`에 추가하거나 allowlist를 없애거나 `/model list`에서 고르세요.

### Why do I see "Unknown model: minimax/MiniMax-M2.5"?

보통 **provider가 설정되지 않았기 때문**입니다. MiniMax provider config 또는 auth profile을 찾지 못하면 모델을 resolve할 수 없습니다.

체크리스트:

1. 최신 버전으로 업그레이드하고 gateway 재시작
2. MiniMax를 wizard나 JSON으로 설정했는지, API key가 env/auth profiles에 있는지 확인
3. 정확한 모델 id 사용. `minimax/MiniMax-M2.5` 또는 `minimax/MiniMax-M2.5-highspeed`
4. `openclaw models list`로 실제 인식되는 목록 확인

### Can I use MiniMax as my default and OpenAI for complex tasks?

예. **MiniMax를 기본값**으로 두고 필요할 때 세션별로 OpenAI로 바꾸면 됩니다. fallback은 **오류 처리용**이지 "어려운 작업용"이 아니므로, 복잡한 작업은 `/model` 또는 별도 agent로 전환하는 편이 맞습니다.

Option A: 세션별 전환

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

그 후:

```
/model gpt
```

Option B: agent 분리

* Agent A 기본값: MiniMax
* Agent B 기본값: OpenAI
* agent routing 또는 `/agent`로 전환

### Are opus / sonnet / gpt built-in shortcuts?

예. OpenClaw는 몇 가지 기본 shorthand를 제공합니다. 단, 해당 모델이 `agents.defaults.models` 안에 있을 때만 적용됩니다.

* `opus` → `anthropic/claude-opus-4-6`
* `sonnet` → `anthropic/claude-sonnet-4-6`
* `gpt` → `openai/gpt-5.4`
* `gpt-mini` → `openai/gpt-5-mini`
* `gemini` → `google/gemini-3.1-pro-preview`
* `gemini-flash` → `google/gemini-3-flash-preview`
* `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

같은 이름 alias를 직접 정의했다면 사용자 정의 값이 우선합니다.

### How do I define/override model shortcuts (aliases)?

alias는 `agents.defaults.models.<modelId>.alias`에서 옵니다.

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

그러면 `/model sonnet`이 해당 모델 ID로 resolve됩니다.

### How do I add models from other providers like OpenRouter or Z.AI?

OpenRouter 예:

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

Z.AI 예:

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

provider/model을 참조했는데 필요한 provider key가 없으면 런타임 auth error가 납니다. 예: `No API key found for provider "zai"`

새 agent를 추가한 뒤 이 오류가 나면 대개 그 **새 agent의 auth store가 비어 있기** 때문입니다. auth는 agent별이며 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`에 저장됩니다.

해결:

* `openclaw agents add <id>`를 실행하고 wizard에서 auth 설정
* 또는 메인 agent의 `auth-profiles.json`을 새 agent의 `agentDir`로 복사

`agentDir`는 여러 agent가 공유하면 안 됩니다. auth/session 충돌이 발생합니다.

## Model failover and "All models failed"

### How does failover work?

페일오버는 두 단계로 일어납니다.

1. 같은 provider 안에서 **auth profile rotation**
2. `agents.defaults.model.fallbacks`의 다음 모델로 **model fallback**

실패한 profile에는 cooldown이 적용되므로, provider가 rate-limited이거나 일시적으로 실패해도 OpenClaw가 계속 응답할 수 있습니다.

### What does this error mean?

```
No credentials found for profile "anthropic:default"
```

시스템이 `anthropic:default` auth profile ID를 사용하려 했지만, 기대한 auth store에서 해당 credentials를 찾지 못했다는 뜻입니다.

### Fix checklist for `No credentials found for profile "anthropic:default"`

* auth profile 위치 확인
  * 현재: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  * legacy: `~/.openclaw/agent/*` (`openclaw doctor`가 마이그레이션)
* Gateway가 env var를 실제로 읽는지 확인
  * 셸에서 `ANTHROPIC_API_KEY`를 설정했더라도 gateway가 systemd/launchd로 돌면 상속하지 않을 수 있습니다. `~/.openclaw/.env`에 넣거나 `env.shellEnv`를 켜세요.
* 올바른 agent를 수정 중인지 확인
  * multi-agent 구성에서는 `auth-profiles.json`이 여러 개일 수 있습니다.
* 모델/auth 상태를 sanity-check
  * `openclaw models status`로 모델 구성과 provider 인증 상태 확인

**No credentials found for profile anthropic**가 뜬다면 현재 run이 Anthropic auth profile에 pin되어 있는데, Gateway가 auth store에서 그 profile을 찾지 못한다는 뜻입니다.

* **setup-token 사용**
  * `claude setup-token` 실행 후 `openclaw models auth setup-token --provider anthropic`
  * 다른 머신에서 만들었다면 `openclaw models auth paste-token --provider anthropic`

* **API key를 쓰고 싶다면**
  * gateway host의 `~/.openclaw/.env`에 `ANTHROPIC_API_KEY` 추가
  * 없는 profile을 강제하는 pinned order를 지움

    ```bash
    openclaw models auth order clear --provider anthropic
    ```

* **명령을 gateway host에서 실행 중인지 확인**
  * remote mode에서는 auth profile이 노트북이 아니라 gateway machine에 있습니다.

### Why did it also try Google Gemini and fail?

모델 config에 Google Gemini가 fallback으로 들어 있거나 shorthand를 Gemini로 바꿨다면, model fallback 중에 Gemini도 시도됩니다. Google credentials가 없으면 `No API key found for provider "google"`가 보입니다.

해결은 Google auth를 넣거나, `agents.defaults.model.fallbacks` 또는 aliases에서 Google 모델을 제거하는 것입니다.

`LLM request rejected ... thinking signature required ... google antigravity`는 session history에 **signature 없는 thinking block**이 섞여 있을 때 나옵니다. 보통 중단되거나 partial stream이 원인입니다. Google Antigravity는 thinking block에 signature를 요구합니다.

해결: 새 세션을 시작하거나 해당 agent에서 `/thinking off`를 설정하세요.

## Auth profiles: what they are and how to manage them

### What is an auth profile?

auth profile은 provider에 묶인 이름 있는 credential record입니다. OAuth일 수도 있고 API key일 수도 있습니다. 저장 위치:

```
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

### What are typical profile IDs?

일반적으로 provider prefix가 붙습니다.

* `anthropic:default`
* `anthropic:<email>`
* 사용자가 정한 custom ID. 예: `anthropic:work`

### Can I control which auth profile is tried first?

예. config는 profile metadata와 provider별 순서(`auth.order.<provider>`)를 지원합니다. 이곳에 secret이 저장되는 것은 아니고, ID와 provider/mode 매핑 및 rotation order만 보관합니다.

profile이 짧은 **cooldown**(rate limit, timeout, auth failure)이나 더 긴 **disabled** 상태(결제 문제, 잔액 부족)에 있으면 일시적으로 건너뛸 수 있습니다. 확인은 `openclaw models status --json` 후 `auth.unusableProfiles`를 보면 됩니다. 조정은 `auth.cooldowns.billingBackoffHours*`

CLI로 agent별 override도 가능합니다.

```bash
# Defaults to the configured default agent (omit --agent)
openclaw models auth order get --provider anthropic

# Lock rotation to a single profile (only try this one)
openclaw models auth order set --provider anthropic anthropic:default

# Or set an explicit order (fallback within provider)
openclaw models auth order set --provider anthropic anthropic:work anthropic:default

# Clear override (fall back to config auth.order / round-robin)
openclaw models auth order clear --provider anthropic
```

특정 agent 대상으로:

```bash
openclaw models auth order set --provider anthropic --agent main anthropic:default
```

### OAuth vs API key: what's the difference?

둘 다 지원합니다.

* **OAuth**: 해당하는 경우 subscription access를 활용하는 경우가 많음
* **API keys**: pay-per-token billing

wizard는 Anthropic setup-token과 OpenAI Codex OAuth를 명시적으로 지원하며, API key 저장도 처리할 수 있습니다.

## Gateway: ports, "already running", and remote mode

### What port does the Gateway use?

`gateway.port`가 WebSocket + HTTP(Control UI, hooks 등)를 위한 단일 multiplexed port를 결정합니다.

우선순위:

```
--port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
```

### Why does `openclaw gateway status` say `Runtime: running` but `RPC probe: failed`?

"running"은 **supervisor**(launchd/systemd/schtasks)가 보는 상태이고, RPC probe는 CLI가 실제로 gateway WebSocket에 연결해 `status`를 호출한 결과입니다.

다음 줄을 신뢰하세요.

* `Probe target:` 실제 probe가 사용한 URL
* `Listening:` 실제로 어느 포트에 bind되어 있는지
* `Last gateway error:` 프로세스는 살아 있지만 포트가 열리지 않을 때 흔한 원인

### Why does `openclaw gateway status` show `Config (cli)` and `Config (service)` different?

지금 수정 중인 config와 서비스가 실행 중인 config가 다르다는 뜻입니다. 흔히 `--profile` 또는 `OPENCLAW_STATE_DIR` mismatch입니다.

해결:

```bash
openclaw gateway install --force
```

서비스가 실제로 사용해야 하는 같은 `--profile`/환경에서 실행해야 합니다.

### What does "another gateway instance is already listening" mean?

OpenClaw는 startup 시 즉시 WebSocket listener를 bind해 runtime lock을 걸고, 기본값은 `ws://127.0.0.1:18789`입니다. `EADDRINUSE`로 bind가 실패하면 다른 인스턴스가 이미 듣고 있다는 뜻의 `GatewayLockError`를 던집니다.

해결은 다른 인스턴스를 멈추거나 포트를 비우거나 `openclaw gateway --port <port>`를 쓰는 것입니다.

### How do I run OpenClaw in remote mode (client connects to a Gateway elsewhere)?

`gateway.mode: "remote"`로 설정하고, remote WebSocket URL과 필요하면 token/password를 줍니다.

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

주의:

* `openclaw gateway`는 `gateway.mode`가 `local`일 때만 시작됩니다. override flag를 주면 예외
* macOS app은 config file을 감시하며 값이 바뀌면 mode를 live로 전환

### The Control UI says "unauthorized" (or keeps reconnecting). What now?

gateway에 auth가 켜져 있는데(`gateway.auth.*`) UI가 일치하는 token/password를 보내지 못하는 상태입니다.

Control UI는 현재 브라우저 탭 session과 선택된 gateway URL 단위로 `sessionStorage`에 token을 저장합니다. 그래서 같은 탭 새로고침은 동작하지만, 영구적인 localStorage persistence는 하지 않습니다.

해결:

* 가장 빠른 방법: `openclaw dashboard`
* token이 아직 없으면: `openclaw doctor --generate-gateway-token`
* remote라면 먼저 tunnel: `ssh -N -L 18789:127.0.0.1:18789 user@host`
* gateway host에 `gateway.auth.token` 또는 `OPENCLAW_GATEWAY_TOKEN` 설정
* Control UI 설정에 동일한 token 붙여넣기
* 그래도 안 되면 `openclaw status --all`과 [Troubleshooting](/gateway/troubleshooting), [Dashboard](/web/dashboard) 확인

### I set `gateway.bind: "tailnet"` but it can't bind / nothing listens

`tailnet` bind는 네트워크 인터페이스에서 Tailscale IP(100.64.0.0/10)를 골라 bind합니다. 머신이 Tailscale에 붙어 있지 않거나 인터페이스가 내려가 있으면 bind할 IP가 없습니다.

해결:

* 해당 호스트에서 Tailscale을 시작해 100.x 주소를 갖게 하거나
* `gateway.bind: "loopback"` 또는 `"lan"`으로 바꾸세요.

### Can I run multiple Gateways on the same host?

보통은 권장하지 않습니다. Gateway 하나로 여러 messaging channel과 agent를 동시에 다룰 수 있습니다. 다만 rescue bot이나 강한 격리가 필요하면 여러 Gateway도 가능합니다.

필수 격리 항목:

* `OPENCLAW_CONFIG_PATH`
* `OPENCLAW_STATE_DIR`
* `agents.defaults.workspace`
* `gateway.port`

권장 빠른 구성:

* 인스턴스마다 `openclaw --profile <name> ...`
* profile config마다 고유 `gateway.port`
* profile별 서비스 설치: `openclaw --profile <name> gateway install`

### What does "invalid handshake" / code 1008 mean?

Gateway는 **WebSocket server**이며 첫 메시지로 `connect` frame을 기대합니다. 다른 것이 오면 **code 1008**로 연결을 닫습니다.

흔한 원인:

* 브라우저에서 HTTP URL을 연 경우
* 잘못된 포트 또는 path 사용
* proxy/tunnel이 auth header를 지우거나 비-Gateway 요청을 보낸 경우

빠른 해결:

1. `ws://<host>:18789` 또는 `wss://...` 사용
2. WS 포트를 일반 브라우저 탭에서 열지 않기
3. auth가 켜져 있으면 `connect` frame에 token/password 포함

CLI/TUI 예:

```
openclaw tui --url ws://<host>:18789 --token <token>
```

## Logging and debugging

### Where are logs?

구조화된 파일 로그:

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

안정적인 경로는 `logging.file`로 바꿀 수 있습니다. 파일 로그 레벨은 `logging.level`, 콘솔 상세도는 `--verbose`와 `logging.consoleLevel`이 제어합니다.

가장 빠른 tail:

```bash
openclaw logs --follow
```

서비스/supervisor 로그:

* macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log`, `gateway.err.log`
* Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
* Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

### How do I start/stop/restart the Gateway service?

gateway helper 명령을 사용하세요.

```bash
openclaw gateway status
openclaw gateway restart
```

수동 foreground 실행 중이라면 `openclaw gateway --force`로 포트를 reclaim할 수 있습니다.

### I closed my terminal on Windows - how do I restart OpenClaw?

Windows에는 두 가지 설치 방식이 있습니다.

**1) WSL2(권장)**: Gateway가 Linux 안에서 실행

```powershell
wsl
openclaw gateway status
openclaw gateway restart
```

서비스를 설치하지 않았다면:

```bash
openclaw gateway run
```

**2) Native Windows(비권장)**: Gateway가 Windows에서 직접 실행

```powershell
openclaw gateway status
openclaw gateway restart
```

서비스 없이 수동 실행 중이면:

```powershell
openclaw gateway run
```

### The Gateway is up but replies never arrive. What should I check?

먼저 빠른 상태 점검:

```bash
openclaw status
openclaw models status
openclaw channels status
openclaw logs --follow
```

흔한 원인:

* **gateway host**에 model auth가 로드되지 않음
* channel pairing/allowlist가 응답을 막음
* WebChat/Dashboard가 올바른 token 없이 열려 있음

remote 환경이라면 tunnel/Tailscale 연결과 Gateway WebSocket 도달 가능 여부를 확인하세요.

### "Disconnected from gateway: no reason" - what now?

대개 UI가 WebSocket 연결을 잃었다는 뜻입니다.

1. Gateway가 실행 중인지: `openclaw gateway status`
2. Gateway가 건강한지: `openclaw status`
3. UI가 올바른 token을 갖고 있는지: `openclaw dashboard`
4. remote라면 tunnel/Tailscale이 살아 있는지

그 다음 로그 확인:

```bash
openclaw logs --follow
```

### Telegram setMyCommands fails with network errors. What should I check?

로그와 channel status부터 시작하세요.

```bash
openclaw channels status
openclaw channels logs --channel telegram
```

VPS나 proxy 뒤에 있다면 outbound HTTPS와 DNS가 정상인지 확인하세요. Gateway가 원격이라면 반드시 **gateway host의 로그**를 보고 있는지도 체크해야 합니다.

### TUI shows no output. What should I check?

먼저 Gateway와 agent가 실제로 돌 수 있는지 확인합니다.

```bash
openclaw status
openclaw models status
openclaw logs --follow
```

TUI 안에서는 `/status`로 현재 상태를 볼 수 있습니다. 채팅 채널로 응답이 와야 한다면 `/deliver on`이 켜져 있는지 확인하세요.

### How do I completely stop then start the Gateway?

서비스를 설치했다면:

```bash
openclaw gateway stop
openclaw gateway start
```

이 명령은 background **supervised service**를 중지/시작합니다. foreground 실행 중이라면 Ctrl-C 후 다시:

```bash
openclaw gateway run
```

### ELI5: `openclaw gateway restart` vs `openclaw gateway`

* `openclaw gateway restart`: **background service** 재시작
* `openclaw gateway`: 현재 터미널 세션에서 **foreground 실행**

서비스 설치가 되어 있다면 보통 restart 계열 명령을 쓰고, 일회성 foreground 실행이 필요할 때만 `openclaw gateway`를 사용하면 됩니다.

### What's the fastest way to get more details when something fails?

Gateway를 `--verbose`로 시작해 콘솔 상세도를 높이고, 이후 로그 파일에서 channel auth, model routing, RPC error를 확인하는 것이 가장 빠릅니다.

## Media and attachments

### My skill generated an image/PDF, but nothing was sent

agent가 outbound attachment를 보내려면 독립 줄에 `MEDIA:<path-or-url>`가 포함되어야 합니다. [OpenClaw assistant setup](/start/openclaw), [Agent send](/tools/agent-send) 참고.

CLI 전송 예:

```bash
openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
```

또한 다음을 확인하세요.

* 대상 채널이 outbound media를 지원하는지
* allowlist에 막히지 않는지
* 파일 크기가 provider limit 안에 있는지. 이미지의 경우 최대 2048px로 리사이즈됩니다.

## Security and access control

### Is it safe to expose OpenClaw to inbound DMs?

inbound DM은 신뢰할 수 없는 입력으로 다뤄야 합니다. 기본값은 위험을 줄이도록 설계되어 있습니다.

* DM이 가능한 채널의 기본 동작은 **pairing**
  * 알 수 없는 발신자는 pairing code만 받으며 메시지는 처리되지 않음
  * 승인: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
  * pending request는 채널당 **3개**로 제한
* DM을 공개적으로 열려면 `dmPolicy: "open"`과 allowlist `"*"`가 필요

위험한 DM 정책은 `openclaw doctor`가 surface해 줍니다.

### Is prompt injection only a concern for public bots?

아니요. prompt injection은 누가 DM을 보내느냐보다 **신뢰할 수 없는 콘텐츠**를 읽느냐의 문제입니다. assistant가 web search/fetch, browser pages, emails, docs, attachments, pasted logs를 읽는다면, 그 안에는 모델을 가로채려는 지시가 들어 있을 수 있습니다. 발신자가 오직 나 자신이어도 마찬가지입니다.

도구가 켜져 있을 때 위험이 가장 큽니다. 모델이 context를 유출하거나 도구를 대신 호출하도록 속을 수 있기 때문입니다. 피해 범위를 줄이는 방법:

* 읽기 전용 또는 tool-disabled "reader" agent로 먼저 요약
* tool-enabled agent에서는 `web_search`, `web_fetch`, `browser`를 끄기
* sandboxing과 엄격한 tool allowlist 적용

### Should my bot have its own email GitHub account or phone number?

대부분의 구성에서는 예라고 보는 편이 좋습니다. 봇 전용 계정과 전화번호를 쓰면 문제가 생겼을 때 blast radius가 줄어들고, 개인 계정에 영향 없이 credentials를 회전하거나 access를 끊기 쉬워집니다.

처음엔 작게 시작하세요. 실제로 필요한 도구와 계정만 열고, 필요할 때만 넓히는 것이 안전합니다.

### Can I give it autonomy over my text messages and is that safe?

개인 메시지에 대해 완전 자율권을 주는 것은 **권장하지 않습니다**. 가장 안전한 패턴:

* DM은 **pairing mode**나 촘촘한 allowlist로 유지
* 대신 메시지를 보내게 하고 싶다면 **별도 번호/계정** 사용
* draft까지만 맡기고 **전송 전 승인**

실험하고 싶다면 전용 계정에서만, 그리고 격리된 상태로 하세요.

### Can I use cheaper models for personal assistant tasks?

예. 다만 agent가 chat-only이고 입력이 신뢰 가능할 때에 한합니다. 작은 등급 모델은 instruction hijacking에 더 취약하므로, tool-enabled agent나 untrusted content를 읽는 작업에는 피하세요. 꼭 써야 한다면 tools를 잠그고 sandbox 안에서 돌리세요.

### I ran `/start` in Telegram but didn't get a pairing code

pairing code는 **알 수 없는 발신자가 bot에 메시지를 보냈고**, `dmPolicy: "pairing"`이 켜져 있을 때만 발급됩니다. `/start`만으로는 code가 생성되지 않습니다.

pending request 확인:

```bash
openclaw pairing list telegram
```

즉시 접근을 원하면 sender id를 allowlist에 넣거나 해당 account의 `dmPolicy: "open"`을 쓰면 됩니다.

### WhatsApp: will it message my contacts? How does pairing work?

아니요. 기본 WhatsApp DM 정책은 **pairing**입니다. 알 수 없는 발신자는 pairing code만 받고, 그 메시지는 **처리되지 않습니다**. OpenClaw는 자신이 받은 채팅이나 사용자가 명시적으로 트리거한 전송에만 응답합니다.

승인:

```bash
openclaw pairing approve whatsapp <code>
```

pending 목록:

```bash
openclaw pairing list whatsapp
```

wizard의 phone number 프롬프트는 **allowlist/owner**를 설정하려는 용도입니다. 자동 발송용이 아닙니다. 개인 WhatsApp 번호로 운용한다면 그 번호를 넣고 `channels.whatsapp.selfChatMode`를 켜세요.

## Chat commands, aborting tasks, and "it won't stop"

### How do I stop internal system messages from showing in chat

대부분의 내부/tool 메시지는 해당 세션에서 **verbose** 또는 **reasoning**이 켜져 있을 때만 나타납니다.

문제가 보이는 채팅에서:

```
/verbose off
/reasoning off
```

그래도 시끄럽다면 Control UI의 session settings에서 verbose를 **inherit**로 두고, config에서 `verboseDefault: on`인 bot profile을 쓰고 있지 않은지도 확인하세요.

### How do I stop/cancel a running task?

다음 표현 중 하나를 **독립 메시지로** 보내면 됩니다. slash는 쓰지 않습니다.

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

이들은 slash command가 아니라 abort trigger입니다.

background process(`exec` 도구에서 실행 중)라면 agent에게 다음을 실행하게 할 수 있습니다.

```
process action:kill sessionId:XXX
```

### How do I send a Discord message from Telegram? ("Cross-context messaging denied")

OpenClaw는 기본적으로 **cross-provider messaging**을 차단합니다. Telegram에 bound된 tool call은 명시적 허용 없이는 Discord로 보낼 수 없습니다.

agent에서 cross-provider messaging을 허용하려면:

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

config 수정 후 gateway를 재시작하세요. 한 agent에만 적용하려면 `agents.list[].tools.message` 아래에 넣으면 됩니다.

### Why does it feel like the bot "ignores" rapid-fire messages?

queue mode가 새 메시지와 현재 in-flight run의 상호작용을 결정합니다. `/queue`로 바꿀 수 있습니다.

* `steer` - 새 메시지가 현재 작업을 조향
* `followup` - 메시지를 하나씩 순서대로 실행
* `collect` - 메시지를 모아 한 번에 응답. 기본값
* `steer-backlog` - 지금은 조향하고 이후 backlog 처리
* `interrupt` - 현재 run을 중단하고 새로 시작

`debounce:2s cap:25 drop:summarize` 같은 옵션을 followup 모드에 붙일 수도 있습니다.

## Answer the exact question from the screenshot/chat log

**Q: "What's the default model for Anthropic with an API key?"**

**A:** OpenClaw에서는 credentials와 model selection이 분리되어 있습니다. `ANTHROPIC_API_KEY`를 설정하거나 Anthropic API key를 auth profiles에 저장하면 인증은 가능해지지만, 실제 기본 모델은 `agents.defaults.model.primary`에 무엇을 설정했느냐로 결정됩니다. 예를 들어 `anthropic/claude-sonnet-4-5` 또는 `anthropic/claude-opus-4-6`입니다. `No credentials found for profile "anthropic:default"`가 보인다면, 해당 agent가 사용하는 `auth-profiles.json`에서 Gateway가 Anthropic credentials를 찾지 못했다는 뜻입니다.

***

여전히 막혀 있다면 [Discord](https://discord.com/invite/clawd)에서 묻거나 [GitHub discussion](https://github.com/openclaw/openclaw/discussions)을 여세요.
