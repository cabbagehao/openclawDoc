# OpenClaw Documentation Translations

<p align="center">
  <a href="https://github.com/openclaw/openclaw">
    <img src="https://raw.githubusercontent.com/openclaw/openclaw/main/docs/assets/pixel-lobster.svg" width="120" height="120" alt="OpenClaw Logo">
  </a>
</p>

<p align="center">
  <b>Official 1:1 translations of the OpenClaw documentation.</b>
</p>

<p align="center">
  <a href="https://openclaw.io">Official Website</a> •
  <a href="https://docs.openclaw.io">Documentation</a> •
  <a href="https://github.com/openclaw/openclaw">GitHub</a>
</p>

---

This repository is a standalone workspace for maintaining the official translations of the [OpenClaw](https://github.com/openclaw/openclaw) documentation. We provide high-quality, localized content for global users, ensuring they have the same depth of information as the original English version.

## Source & Accuracy

Our documentation is meticulously synced with the `docs/` folder in the official [openclaw/openclaw](https://github.com/openclaw/openclaw) repository.

- **1:1 Parity**: Every translated page corresponds directly to its English counterpart.
- **AI-Driven Translation**: We leverage advanced AI models to generate initial translations.
- **Manual Proofreading**: Every page undergoes a rigorous manual review process to ensure technical accuracy, correct terminology, and idiomatic phrasing.

## Supported Languages

- **Japanese (ja-JP)**: [View Japanese Docs](https://docs.openclaw.io/ja-JP)
- **Simplified Chinese (zh-CN)**: [View Chinese Docs](https://docs.openclaw.io/zh-CN)

## Development & Setup

This workspace allows you to run and preview the documentation site locally using [Mintlify](https://mintlify.com/).

### Prerequisites

- **Node.js 22+**
- **pnpm**
- **Go** (for running the translation pipeline)
- **Mintlify CLI** (`npm i -g mintlify`)

### Commands

```bash
# Install dependencies
pnpm install

# Start local development preview
pnpm docs:dev

# Run translation pipeline
pnpm docs:i18n -- -lang <locale> <files...>

# Lint and check links
pnpm check:docs
```

## Repository Structure

- `docs/`: The user-facing documentation content.
- `origin_docs/`: A reference copy of the original English documentation.
- `scripts/`: Custom tooling for syncing, formatting, and translating the docs.
- `.i18n/`: Glossary and translation memory assets.

## Contributing

We welcome contributions to improve our translations! If you find a technical error or an awkward phrasing, please open a Pull Request or an Issue in this repository.

For core feature requests or bugs related to OpenClaw itself, please visit the [Main OpenClaw Repository](https://github.com/openclaw/openclaw).
