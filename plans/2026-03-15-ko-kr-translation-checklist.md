# ko-KR Translation Refresh Checklist

Completion rule for each file:
- Translation reviewed against `origin_docs/<same-path>`
- Korean copy rewritten for accurate, natural technical documentation style
- Frontmatter includes a good `description`

## (root)
- [x] auth-credential-semantics.md
- [x] brave-search.md
- [x] ci.md
- [x] date-time.md
- [x] index.md
- [x] logging.md
- [x] network.md
- [x] perplexity.md
- [x] pi-dev.md
- [x] pi.md
- [x] prose.md
- [x] tts.md
- [x] vps.md

## automation
- [x] automation/auth-monitoring.md
- [x] automation/cron-jobs.md
- [x] automation/cron-vs-heartbeat.md
- [x] automation/gmail-pubsub.md
- [x] automation/hooks.md
- [x] automation/poll.md
- [x] automation/troubleshooting.md
- [x] automation/webhook.md

## channels
- [x] channels/bluebubbles.md
- [x] channels/broadcast-groups.md
- [x] channels/channel-routing.md
- [x] channels/discord.md
- [x] channels/feishu.md
- [x] channels/googlechat.md
- [x] channels/group-messages.md
- [x] channels/groups.md
- [x] channels/imessage.md
- [x] channels/index.md
- [x] channels/irc.md
- [x] channels/line.md
- [x] channels/location.md
- [x] channels/matrix.md
- [x] channels/mattermost.md
- [x] channels/msteams.md
- [x] channels/nextcloud-talk.md
- [x] channels/nostr.md
- [x] channels/pairing.md
- [x] channels/signal.md
- [x] channels/slack.md
- [x] channels/synology-chat.md
- [x] channels/telegram.md
- [x] channels/tlon.md
- [x] channels/troubleshooting.md
- [x] channels/twitch.md
- [x] channels/whatsapp.md
- [x] channels/zalo.md
- [x] channels/zalouser.md

## cli
- [x] cli/acp.md
- [x] cli/agent.md
- [x] cli/agents.md
- [x] cli/approvals.md
- [x] cli/backup.md
- [x] cli/browser.md
- [x] cli/channels.md
- [x] cli/clawbot.md
- [x] cli/completion.md
- [x] cli/config.md
- [x] cli/configure.md
- [x] cli/cron.md
- [x] cli/daemon.md
- [x] cli/dashboard.md
- [x] cli/devices.md
- [x] cli/directory.md
- [x] cli/dns.md
- [x] cli/docs.md
- [x] cli/doctor.md
- [x] cli/gateway.md
- [x] cli/health.md
- [x] cli/hooks.md
- [x] cli/index.md
- [x] cli/logs.md
- [x] cli/memory.md
- [x] cli/message.md
- [x] cli/models.md
- [x] cli/node.md
- [x] cli/nodes.md
- [x] cli/onboard.md
- [x] cli/pairing.md
- [x] cli/plugins.md
- [x] cli/qr.md
- [x] cli/reset.md
- [x] cli/sandbox.md
- [x] cli/secrets.md
- [x] cli/security.md
- [x] cli/sessions.md
- [x] cli/setup.md
- [x] cli/skills.md
- [x] cli/status.md
- [x] cli/system.md
- [x] cli/tui.md
- [x] cli/uninstall.md
- [x] cli/update.md
- [x] cli/voicecall.md
- [x] cli/webhooks.md

## concepts
- [x] concepts/agent-loop.md
- [x] concepts/agent-workspace.md
- [x] concepts/agent.md
- [x] concepts/architecture.md
- [x] concepts/compaction.md
- [x] concepts/context.md
- [x] concepts/features.md
- [x] concepts/markdown-formatting.md
- [x] concepts/memory.md
- [x] concepts/messages.md
- [x] concepts/model-failover.md
- [x] concepts/model-providers.md
- [x] concepts/models.md
- [x] concepts/multi-agent.md
- [x] concepts/oauth.md
- [x] concepts/presence.md
- [x] concepts/queue.md
- [x] concepts/retry.md
- [x] concepts/session-pruning.md
- [x] concepts/session-tool.md
- [x] concepts/session.md
- [x] concepts/streaming.md
- [x] concepts/system-prompt.md
- [x] concepts/timezone.md
- [x] concepts/typebox.md
- [x] concepts/typing-indicators.md
- [x] concepts/usage-tracking.md

## debug
- [x] debug/node-issue.md

## design
- [x] design/kilo-gateway-integration.md

## diagnostics
- [x] diagnostics/flags.md

## experiments
- [x] experiments/onboarding-config-protocol.md
- [x] experiments/plans/acp-persistent-bindings-discord-channels-telegram-topics.md
- [x] experiments/plans/acp-thread-bound-agents.md
- [x] experiments/plans/acp-unified-streaming-refactor.md
- [x] experiments/plans/browser-evaluate-cdp-refactor.md
- [x] experiments/plans/discord-async-inbound-worker.md
- [x] experiments/plans/openresponses-gateway.md
- [x] experiments/plans/pty-process-supervision.md
- [x] experiments/plans/session-binding-channel-agnostic.md
- [x] experiments/proposals/acp-bound-command-auth.md
- [x] experiments/proposals/model-config.md
- [x] experiments/research/memory.md

## gateway
- [x] gateway/authentication.md
- [x] gateway/background-process.md
- [x] gateway/bonjour.md
- [x] gateway/bridge-protocol.md
- [x] gateway/cli-backends.md
- [x] gateway/configuration-examples.md
- [x] gateway/configuration-reference.md
- [x] gateway/configuration.md
- [x] gateway/discovery.md
- [x] gateway/doctor.md
- [x] gateway/gateway-lock.md
- [x] gateway/health.md
- [x] gateway/heartbeat.md
- [x] gateway/index.md
- [x] gateway/local-models.md
- [x] gateway/logging.md
- [x] gateway/multiple-gateways.md
- [x] gateway/network-model.md
- [x] gateway/openai-http-api.md
- [x] gateway/openresponses-http-api.md
- [x] gateway/pairing.md
- [x] gateway/protocol.md
- [x] gateway/remote-gateway-readme.md
- [x] gateway/remote.md
- [x] gateway/sandbox-vs-tool-policy-vs-elevated.md
- [x] gateway/sandboxing.md
- [x] gateway/secrets-plan-contract.md
- [x] gateway/secrets.md
- [x] gateway/security/index.md
- [x] gateway/tailscale.md
- [x] gateway/tools-invoke-http-api.md
- [x] gateway/troubleshooting.md
- [x] gateway/trusted-proxy-auth.md

## help
- [x] help/debugging.md
- [x] help/environment.md
- [x] help/faq.md
- [x] help/index.md
- [x] help/scripts.md
- [x] help/testing.md
- [x] help/troubleshooting.md

## install
- [x] install/ansible.md
- [x] install/bun.md
- [x] install/development-channels.md
- [x] install/docker.md
- [x] install/exe-dev.md
- [x] install/fly.md
- [x] install/gcp.md
- [x] install/hetzner.md
- [x] install/index.md
- [x] install/installer.md
- [x] install/macos-vm.md
- [x] install/migrating.md
- [x] install/nix.md
- [x] install/node.md
- [x] install/northflank.mdx
- [x] install/podman.md
- [x] install/railway.mdx
- [x] install/render.mdx
- [x] install/uninstall.md
- [x] install/updating.md

## nodes
- [x] nodes/audio.md
- [x] nodes/camera.md
- [x] nodes/images.md
- [x] nodes/index.md
- [x] nodes/location-command.md
- [x] nodes/media-understanding.md
- [x] nodes/talk.md
- [x] nodes/troubleshooting.md
- [x] nodes/voicewake.md

## platforms
- [x] platforms/android.md
- [x] platforms/digitalocean.md
- [x] platforms/index.md
- [x] platforms/ios.md
- [x] platforms/linux.md
- [x] platforms/mac/bundled-gateway.md
- [x] platforms/mac/canvas.md
- [x] platforms/mac/child-process.md
- [x] platforms/mac/dev-setup.md
- [x] platforms/mac/health.md
- [x] platforms/mac/icon.md
- [x] platforms/mac/logging.md
- [x] platforms/mac/menu-bar.md
- [x] platforms/mac/peekaboo.md
- [x] platforms/mac/permissions.md
- [x] platforms/mac/release.md
- [x] platforms/mac/remote.md
- [x] platforms/mac/signing.md
- [x] platforms/mac/skills.md
- [x] platforms/mac/voice-overlay.md
- [x] platforms/mac/voicewake.md
- [x] platforms/mac/webchat.md
- [x] platforms/mac/xpc.md
- [x] platforms/macos.md
- [x] platforms/oracle.md
- [x] platforms/raspberry-pi.md
- [x] platforms/windows.md

## plugins
- [x] plugins/agent-tools.md
- [x] plugins/community.md
- [x] plugins/manifest.md
- [x] plugins/voice-call.md
- [x] plugins/zalouser.md

## providers
- [x] providers/anthropic.md
- [x] providers/bedrock.md
- [x] providers/claude-max-api-proxy.md
- [x] providers/cloudflare-ai-gateway.md
- [x] providers/deepgram.md
- [x] providers/github-copilot.md
- [x] providers/glm.md
- [x] providers/huggingface.md
- [x] providers/index.md
- [x] providers/kilocode.md
- [x] providers/litellm.md
- [x] providers/minimax.md
- [x] providers/mistral.md
- [x] providers/models.md
- [x] providers/moonshot.md
- [x] providers/nvidia.md
- [x] providers/ollama.md
- [x] providers/openai.md
- [x] providers/opencode-go.md
- [x] providers/opencode.md
- [x] providers/openrouter.md
- [x] providers/qianfan.md
- [x] providers/qwen.md
- [x] providers/synthetic.md
- [x] providers/together.md
- [x] providers/venice.md
- [x] providers/vercel-ai-gateway.md
- [x] providers/vllm.md
- [x] providers/xiaomi.md
- [x] providers/zai.md

## refactor
- [x] refactor/clawnet.md
- [x] refactor/cluster.md
- [x] refactor/exec-host.md
- [x] refactor/outbound-session-mirroring.md
- [x] refactor/plugin-sdk.md
- [x] refactor/strict-config.md

## reference
- [x] reference/AGENTS.default.md
- [x] reference/RELEASING.md
- [x] reference/api-usage-costs.md
- [x] reference/credits.md
- [x] reference/device-models.md
- [x] reference/prompt-caching.md
- [x] reference/rpc.md
- [x] reference/secretref-credential-surface.md
- [x] reference/session-management-compaction.md
- [x] reference/templates/AGENTS.dev.md
- [x] reference/templates/AGENTS.md
- [x] reference/templates/BOOT.md
- [x] reference/templates/BOOTSTRAP.md
- [x] reference/templates/HEARTBEAT.md
- [x] reference/templates/IDENTITY.dev.md
- [x] reference/templates/SOUL.dev.md
- [x] reference/templates/SOUL.md
- [x] reference/templates/TOOLS.dev.md
- [x] reference/templates/TOOLS.md
- [x] reference/templates/USER.dev.md
- [x] reference/test.md
- [x] reference/token-use.md
- [x] reference/transcript-hygiene.md
- [x] reference/wizard.md

## security
- [x] security/CONTRIBUTING-THREAT-MODEL.md
- [x] security/README.md
- [x] security/THREAT-MODEL-ATLAS.md
- [x] security/formal-verification.md

## start
- [x] start/bootstrapping.md
- [x] start/docs-directory.md
- [x] start/getting-started.md
- [x] start/hubs.md
- [x] start/lore.md
- [x] start/onboarding-overview.md
- [x] start/onboarding.md
- [x] start/openclaw.md
- [x] start/quickstart.md
- [x] start/setup.md
- [x] start/showcase.md
- [x] start/wizard-cli-automation.md
- [x] start/wizard-cli-reference.md
- [x] start/wizard.md

## tools
- [x] tools/acp-agents.md
- [x] tools/agent-send.md
- [x] tools/apply-patch.md
- [x] tools/browser-linux-troubleshooting.md
- [x] tools/browser-login.md
- [x] tools/browser-wsl2-windows-remote-cdp-troubleshooting.md
- [x] tools/browser.md
- [x] tools/chrome-extension.md
- [x] tools/clawhub.md
- [x] tools/creating-skills.md
- [x] tools/diffs.md
- [x] tools/elevated.md
- [x] tools/exec-approvals.md
- [x] tools/exec.md
- [x] tools/firecrawl.md
- [x] tools/index.md
- [x] tools/llm-task.md
- [x] tools/lobster.md
- [x] tools/loop-detection.md
- [x] tools/multi-agent-sandbox-tools.md
- [x] tools/pdf.md
- [x] tools/plugin.md
- [x] tools/reactions.md
- [x] tools/skills-config.md
- [x] tools/skills.md
- [x] tools/slash-commands.md
- [x] tools/subagents.md
- [x] tools/thinking.md
- [x] tools/web.md

## web
- [x] web/control-ui.md
- [x] web/dashboard.md
- [x] web/index.md
- [x] web/tui.md
- [x] web/webchat.md
