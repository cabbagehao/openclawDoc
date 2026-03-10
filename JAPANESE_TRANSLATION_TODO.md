# OpenClaw 日语翻译检查与修复任务列表 (TODO)

## 🔴 高优先级 (High Priority) - 核心入门与操作
*关键页面，直接影响用户安装、配对和首次使用。*

- [x] **Home (index.md)** - 已检查并验证 (质量良好)
- [x] **Install Overview (install/index.md)** - 已检查并验证 (质量良好)
- [x] **Config Overview (gateway/configuration.md)** - 已修复 (修正了 Mattermost, Signal, Telegram 等术语)
- [ ] **Getting Started (start/getting-started.md)** - 待检查 (快速入门引导)
- [ ] **Onboarding Wizard (start/wizard.md)** - 待检查 (CLI 引导说明)
- [x] **WhatsApp (channels/whatsapp.md)** - 已检查 (质量良好)
- [x] **Telegram (channels/telegram.md)** - 已检查 (质量良好)
- [ ] **Pairing Flow (channels/pairing.md)** - 待检查 (核心配对逻辑)
- [ ] **Troubleshooting (help/index.md)** - 待检查 (故障排查入口)

## 🟡 中优先级 (Medium Priority) - 详细功能与配置
*进阶用户使用的页面，包含大量技术细节。*

- [ ] **Config Reference (gateway/configuration-reference.md)** - 待检查 (内容极多，需分块核对)
- [ ] **Security (gateway/security.md)** - 待检查 (权限与防火墙说明)
- [ ] **Other Channels (Discord, Slack, iMessage, Signal, Google Chat)** - 待检查 (修正可能的术语误译)
- [ ] **Multi-Agent Routing (concepts/multi-agent.md)** - 待检查 (架构理解)
- [ ] **Agent Loop (concepts/agent-loop.md)** - 待检查 (运行机制)
- [ ] **Updates & Migration (install/updating.md, migrating.md)** - 待检查 (维护操作)

## 🟢 低优先级 (Low Priority) - 特定平台与参考资料
*针对特定环境的指南或背景信息。*

- [ ] **Cloud Platforms (Oracle, DigitalOcean, Hetzner, GCP)** - 待检查 (已修复部分 $ 符号 LaTeX 错误)
- [ ] **Tools & Experiments (tools/index.md, experiments/)** - 待检查
- [ ] **Credits & About (reference/credits.md)** - 待检查

---
**核对标准：**
1. **术语准确性**：禁止机械翻译专有名词（如 Mattermost -> 最重要）。
2. **语气地道**：使用标准的 `です/ます` 敬体，避免第一人称（我/我们）在文档中出现。
3. **技术逻辑**：确保代码块中的参数、环境变量名称未被错误翻译。
4. **MDX 语法**：确保所有 `$` 符号被正确处理，防止 LaTeX 报错。
