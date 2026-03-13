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
  <a href="https://openclawdoc.org/">Official Japanese Docs</a> •
  <a href="https://docs.openclaw.ai">Official Docs (EN/ZH)</a> •
  <a href="https://github.com/openclaw/openclaw">Official GitHub</a>
</p>

---

This repository hosts the official 1:1 Japanese translation of the OpenClaw documentation. Our goal is to provide the Japanese developer community with high-quality, technically accurate localized content.

## 🌐 Official Japanese Portal
For the best reading experience in Japanese, please visit:
👉 **[OpenClaw Japanese Documentation (openclawdoc.org)](https://openclawdoc.org/)**

This site is optimized for SEO and localized specifically for Japan, featuring detailed [OpenClaw installation guides](https://openclawdoc.org/install/index) and [technical references](https://openclawdoc.org/reference/rpc) in native Japanese.

### Other Languages
- For **English** and **Chinese** versions, please visit the official documentation at [docs.openclaw.ai](https://docs.openclaw.ai).
- The original source code and documentation can be found at the [openclaw/openclaw](https://github.com/openclaw/openclaw) repository.

## 🛠 Translation Methodology
We ensure the highest quality by combining advanced technology with expert review:

- **1:1 Parity**: Every page is meticulously synced with the [official OpenClaw docs](https://docs.openclaw.ai), maintaining structure and logic.
- **AI-Driven + Manual Correction**: We leverage state-of-the-art AI models for initial translation, followed by **rigorous manual proofreading** to ensure idiomatic phrasing and technical accuracy.
- **Continuous Updates**: We track upstream changes daily to provide the Japanese community with the latest feature documentation and security updates.

## 🚀 Local Development
You can run and preview the documentation portal locally using the following commands:

### Prerequisites
- Node.js 22+ & pnpm
- [Mintlify CLI](https://mintlify.com/) (`npm i -g mintlify`)

### Usage
```bash
# Install local dependencies
pnpm install

# Start the Mintlify dev server
pnpm docs:dev

# Run the i18n translation pipeline (Go-based)
pnpm docs:i18n -- -lang ja-JP <files...>
```

## 📂 Repository Structure
- `docs/`: The translated Japanese content served to [openclawdoc.org](https://openclawdoc.org/).
- `origin_docs/`: A reference mirror of the latest English source.
- `scripts/`: Tooling for automated syncing and validation.
- `.i18n/`: Japanese glossary terms and translation memory assets.

## 🤝 Contributing
Found an error or have a better translation suggestion? We welcome contributions to improve the Japanese documentation! Please open a Pull Request or an Issue. 

For core feature requests or bugs related to the OpenClaw gateway itself, please visit the [Main OpenClaw Repository](https://github.com/openclaw/openclaw).
