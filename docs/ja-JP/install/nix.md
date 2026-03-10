---
summary: "Nix を使用して OpenClaw を宣言的にインストールする"
read_when:
  - 再現性があり、ロールバック可能なインストールを求めている場合
  - すでに Nix/NixOS/Home Manager を使用している場合
  - すべてを固定して宣言的に管理したい場合
title: "Nix"
---

# Nix インストール

Nix で OpenClaw を実行するための推奨される方法は、**[nix-openclaw](https://github.com/openclaw/nix-openclaw)** (必要なものがすべて揃った Home Manager モジュール) を介することです。

## クイックスタート

これを AI エージェント (Claude、Cursor など) に貼り付けてください:

```text
I want to set up nix-openclaw on my Mac.
Repository: github:openclaw/nix-openclaw

What I need you to do:
1. Check if Determinate Nix is installed (if not, install it)
2. Create a local flake at ~/code/openclaw-local using templates/agent-first/flake.nix
3. Help me create a Telegram bot (@BotFather) and get my chat ID (@userinfobot)
4. Set up secrets (bot token, model provider API key) - plain files at ~/.secrets/ is fine
5. Fill in the template placeholders and run home-manager switch
6. Verify: launchd running, bot responds to messages

Reference the nix-openclaw README for module options.
```

> **📦 完全なガイド: [github.com/openclaw/nix-openclaw](https://github.com/openclaw/nix-openclaw)**
>
> nix-openclaw リポジトリは、Nix インストールの信頼できる情報源です。このページは単なる概要です。

## 得られるもの

- Gateway + macOS アプリ + ツール (whisper, spotify, cameras) — すべて固定
- 再起動後も残る Launchd サービス
- 宣言的設定を備えたプラグインシステム
- インスタントロールバック: `home-manager switch --rollback`

---

## Nix モードのランタイムの動作

`OPENCLAW_NIX_MODE=1` が設定されている場合 (nix-openclaw では自動):

OpenClaw は、設定を決定論的にし、自動インストールフローを無効にする **Nix モード** をサポートしています。
エクスポートして有効にします:

```bash
OPENCLAW_NIX_MODE=1
```

macOS では、GUI アプリは自動的にシェルの環境変数を継承しません。
defaults 経由で Nix モードを有効にすることもできます:

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### Config + 状態のパス

OpenClaw は `OPENCLAW_CONFIG_PATH` から JSON5 設定を読み取り、`OPENCLAW_STATE_DIR` にミュータブルなデータを保存します。
必要に応じて、`OPENCLAW_HOME` を設定して、内部パス解決に使用されるベースのホームディレクトリを制御することもできます。

- `OPENCLAW_HOME` (優先順位のデフォルト: `HOME` / `USERPROFILE` / `os.homedir()`)
- `OPENCLAW_STATE_DIR` (デフォルト: `~/.openclaw`)
- `OPENCLAW_CONFIG_PATH` (デフォルト: `$OPENCLAW_STATE_DIR/openclaw.json`)

Nix の下で実行する場合は、ランタイムの状態と設定が不変のストアから外れるように、これらを明示的に Nix 管理の場所に設定してください。

### Nix モードでのランタイムの動作

- 自動インストールと自己変異フローは無効になります
- 依存関係が不足している場合、Nix 固有の修復メッセージが表示されます
- 存在する場合、UI に読み取り専用の Nix モードバナーが表示されます

## パッケージングに関する注意 (macOS)

macOS のパッケージングフローは、以下にある安定した Info.plist テンプレートを想定しています:

```
apps/macos/Sources/OpenClaw/Resources/Info.plist
```

[`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) は、このテンプレートをアプリバンドルにコピーし、動的フィールド (バンドル ID、バージョン/ビルド、Git SHA、Sparkle キー) にパッチを当てます。これにより、SwiftPM パッケージングと Nix ビルド (完全な Xcode ツールチェーンに依存しない) で plist が決定論的に保たれます。

## 関連

- [nix-openclaw](https://github.com/openclaw/nix-openclaw) — 完全なセットアップガイド
- [ウィザード](/start/wizard) — Nix 以外の CLI セットアップ
- [Docker](/install/docker) — コンテナ化されたセットアップ
