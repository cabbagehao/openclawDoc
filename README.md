# OpenClaw Japanese Documentation Project

<p align="center">
  <a href="https://openclawdoc.org/">
    <img src="https://raw.githubusercontent.com/openclaw/openclaw/main/docs/assets/pixel-lobster.svg" width="120" height="120" alt="OpenClaw Localization Logo">
  </a>
</p>

<p align="center">
  <b>The dedicated Japanese community portal for the OpenClaw ecosystem.</b>
</p>

<p align="center">
  <a href="https://openclawdoc.org/">Official Japanese Portal</a> •
  <a href="https://github.com/openclaw/openclaw">Official GitHub</a> •
  <a href="https://docs.openclaw.ai">Multilingual Docs (EN/ZH)</a>
</p>

---

This repository hosts the official 1:1 Japanese translation for OpenClaw. We aim to provide the Japanese developer community with high-quality, technically accurate, and SEO-optimized localized content.

## 🌐 Official Japanese Documentation Portal
For the most comprehensive Japanese documentation, visit:
👉 **[OpenClaw Japanese Documentation (openclawdoc.org)](https://openclawdoc.org/)**

This portal provides specialized [setup tutorials](https://openclawdoc.org/start/getting-started) and [technical deep-dives](https://openclawdoc.org/reference/rpc) in native Japanese, designed to help developers deploy and maintain their OpenClaw gateways effectively.

## 📚 External Resources
To provide additional value and enhance SEO, we provide the following resources:
- **[GitHub Wiki](https://github.com/openclaw/openclawDocs/wiki)**: A community-driven knowledge base and FAQ.
- **[GitHub Pages Portal](https://openclaw.github.io/openclawDocs/)**: A fast-loading entry point for quick access to the main documentation sections.

## 🛠 Translation Methodology
- **1:1 Parity**: Every document is strictly mapped from the official [English source](https://github.com/openclaw/openclaw/tree/main/docs).
- **AI-Driven + Manual Correction**: We utilize advanced LLM models for initial translations, followed by **thorough manual review** by senior technical writers to ensure idiomatic phrasing and precision.
- **Continuous Sync**: Automated tracking of upstream updates ensures our documentation is always current.

## 🚀 Local Development
You can preview the documentation portal locally using [Mintlify](https://mintlify.com/).

### Prerequisites
- Node.js 22+ & pnpm
- [Mintlify CLI](https://mintlify.com/) (`npm i -g mintlify`)

### Usage
```bash
# Install local dependencies
pnpm install

# Start the Mintlify dev server
pnpm docs:dev

# Run the Go-based i18n translation pipeline
pnpm docs:i18n -- -lang ja-JP <files...>
```

## 📂 Repository Structure
- `docs/`: The localized Japanese content served to [openclawdoc.org](https://openclawdoc.org/).
- `origin_docs/`: A mirror of the original English documentation.
- `web-portal/`: Landing page content for GitHub Pages.
- `wiki/`: Markdown source for the GitHub Wiki.

## 🤝 Contributing
We welcome contributions to the Japanese localization! If you find a translation error or have a technical suggestion, please open a Pull Request or Issue.

For core feature requests or bugs related to OpenClaw itself, please visit the [Main OpenClaw Repository](https://github.com/openclaw/openclaw).

## ⚠️ 重要注意事项 (Important Guidelines)

1. **禁止重命名首页后缀**：请勿将 `docs/index.mdx` 重命名为 `docs/index.md` 或其他后缀。Mintlify 强依赖该后缀来正确渲染首页组件，修改后缀会导致线上首页 404 或渲染异常。
2. **`docs/` 目录规范**：`docs/` 目录仅用于存放线上公开的文档内容。任何内部开发计划（Plans）、翻译指南、本地化脚本说明等非公开内容，请务必存放在根目录下的对应文件夹（如 `/plans`）中，严禁放入 `docs/` 目录，以免被同步发布到线上。
3. **翻译溯源**：本项目以 `origin_docs/` 中的英文文档作为翻译的唯一标准源（Source of Truth）。添加新语言或更新翻译时，请对比 `origin_docs/` 进行。
