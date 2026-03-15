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

The repository is organized around a localized docs workspace:
- `origin_docs/` contains the upstream English documentation mirrored into this repository. It is the source of truth for translation and sync work.
- `docs/` contains the localized documentation variants that are published from this project.

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
- `docs/`: Published documentation content for this repository, including localized pages and site configuration.
- `origin_docs/`: The mirrored upstream English documentation set. Use this directory as the canonical source when translating, syncing, or reviewing localized files.
- `scripts/`: Local tooling for sync, coverage checks, link audits, formatting, and translation workflows.
- `plans/`: Internal implementation and translation planning documents that should not be published as site content.
- `web-portal/`: Landing page content for GitHub Pages.
- `wiki/`: Markdown source for the GitHub Wiki.

## 🤝 Contributing
We welcome contributions to the Japanese localization! If you find a translation error or have a technical suggestion, please open a Pull Request or Issue.

For core feature requests or bugs related to OpenClaw itself, please visit the [Main OpenClaw Repository](https://github.com/openclaw/openclaw).
