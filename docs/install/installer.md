---
summary: "インストーラースクリプト（install.sh、install-cli.sh、install.ps1）の仕組み、フラグ、自動化方法"
description: "install.sh、install-cli.sh、install.ps1 の役割、フラグ、自動化方法をまとめたインストーラ内部ガイドです。"
read_when:
  - "`openclaw.ai/install.sh` を理解したい場合"
  - "インストールの自動化（CI / ヘッドレス）をしたい場合"
  - "GitHub のチェックアウトからインストールしたい場合"
title: "OpenClaw install.sh・install-cli.sh・install.ps1 の仕組みと使い方"
---
OpenClaw には、`openclaw.ai` から配布される 3 つのインストーラースクリプトがあります。

| スクリプト                         | プラットフォーム     | 行うこと                                                                                                                       |
| ---------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | 必要に応じて Node をインストールし、npm（デフォルト）または git 経由で OpenClaw をインストール。オンボーディングの実行も可能。 |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | Node + OpenClaw をローカルプレフィックス（`~/.openclaw`）にインストール。ルート権限は不要。                                    |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | 必要に応じて Node をインストールし、npm（デフォルト）または git 経由で OpenClaw をインストール。オンボーディングの実行も可能。 |

## クイックコマンド

<Tabs>
  <Tab title="install.sh">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --help
    ```

  </Tab>
  <Tab title="install-cli.sh">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --help
    ```

  </Tab>
  <Tab title="install.ps1">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```

    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -Tag beta -NoOnboard -DryRun
    ```

  </Tab>
</Tabs>

<Note>
インストールに成功したものの、新しいターミナルで `openclaw` が見つからない場合は、[Node.js のトラブルシューティング](/install/node#troubleshooting) を参照してください。
</Note>

---

## install.sh

<Tip>
macOS/Linux/WSL でのほとんどの対話型インストールに推奨されます。
</Tip>

### フロー (install.sh)

<Steps>
  <Step title="OS の検出">
    macOS および Linux（WSL を含む）をサポート。macOS が検出され、Homebrew がない場合はインストールします。
  </Step>
  <Step title="Node.js 22+ の確保">
    Node のバージョンを確認し、必要に応じて Node 22 をインストールします（macOS では Homebrew、Linux の apt/dnf/yum では NodeSource セットアップスクリプトを使用）。
  </Step>
  <Step title="Git の確保">
    Git がない場合はインストールします。
  </Step>
  <Step title="OpenClaw のインストール">
    - `npm` メソッド（デフォルト）：グローバル npm インストール
    - `git` メソッド：リポジトリをクローン/アップデートし、pnpm で依存関係をインストールしてビルドし、`~/.local/bin/openclaw` にラッパーをインストール
  </Step>
  <Step title="インストール後のタスク">
    - アップグレード時および git インストール時には、`openclaw doctor --non-interactive` を可能な範囲で実行
    - 適切な場合（TTY が利用可能、オンボーディングが無効化されていない、ブートストラップ/設定チェックに合格した場合）にオンボーディングを試行
    - デフォルトで `SHARP_IGNORE_GLOBAL_LIBVIPS=1` を設定
  </Step>
</Steps>

### ソースチェックアウトの検出

OpenClaw のチェックアウトディレクトリ（`package.json` + `pnpm-workspace.yaml`）内で実行された場合、スクリプトは以下の選択肢を提示します：

- チェックアウトを使用する (`git`)
- グローバルインストールを使用する (`npm`)

TTY が利用できず、インストールメソッドが設定されていない場合は、デフォルトで `npm` になり、警告を表示します。

無効なメソッド選択、または無効な `--install-method` 値が指定された場合、スクリプトは終了コード `2` で終了します。

### 例 (install.sh)

<Tabs>
  <Tab title="デフォルト">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="オンボーディングをスキップ">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Git インストール">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```
  </Tab>
  <Tab title="ドライラン">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="フラグリファレンス">

| フラグ                          | 説明                                                                        |
| ------------------------------- | --------------------------------------------------------------------------- |
| `--install-method npm\|git`     | インストール方法の選択（デフォルト: `npm`）。エイリアス: `--method`         |
| `--npm`                         | npm メソッドのショートカット                                                |
| `--git`                         | git メソッドのショートカット。エイリアス: `--github`                        |
| `--version <version\|dist-tag>` | npm バージョンまたは dist-tag（デフォルト: `latest`）                       |
| `--beta`                        | 利用可能な場合は beta dist-tag を使用。なければ `latest`                    |
| `--git-dir <path>`              | チェックアウトディレクトリ（デフォルト: `~/openclaw`）。エイリアス: `--dir` |
| `--no-git-update`               | 既存のチェックアウトに対する `git pull` をスキップ                          |
| `--no-prompt`                   | プロンプトを無効化                                                          |
| `--no-onboard`                  | オンボーディングをスキップ                                                  |
| `--onboard`                     | オンボーディングを有効化                                                    |
| `--dry-run`                     | 変更を適用せずにアクションを表示                                            |
| `--verbose`                     | デバッグ出力を有効化（`set -x`、npm notice レベルのログ）                   |
| `--help`                        | 使い方を表示 (`-h`)                                                         |

  </Accordion>

  <Accordion title="環境変数リファレンス">

| 変数                                        | 説明                                        |
| ------------------------------------------- | ------------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | インストール方法                            |
| `OPENCLAW_VERSION=latest\|next\|<semver>`   | npm バージョンまたは dist-tag               |
| `OPENCLAW_BETA=0\|1`                        | 利用可能な場合は beta を使用                |
| `OPENCLAW_GIT_DIR=<path>`                   | チェックアウトディレクトリ                  |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | git アップデートの切り替え                  |
| `OPENCLAW_NO_PROMPT=1`                      | プロンプトを無効化                          |
| `OPENCLAW_NO_ONBOARD=1`                     | オンボーディングをスキップ                  |
| `OPENCLAW_DRY_RUN=1`                        | ドライランモード                            |
| `OPENCLAW_VERBOSE=1`                        | デバッグモード                              |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | npm ログレベル                              |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`          | sharp/libvips の動作制御（デフォルト: `1`） |

  </Accordion>
</AccordionGroup>

---

## install-cli.sh

<Info>
すべてをローカルプレフィックス（デフォルト `~/.openclaw`）の下に置き、システム Node への依存を避けたい環境向けに設計されています。
</Info>

### フロー (install-cli.sh)

<Steps>
  <Step title="ローカル Node ランタイムのインストール">
    Node の tarball（デフォルト `22.22.0`）を `<prefix>/tools/node-v<version>` にダウンロードし、SHA-256 を検証します。
  </Step>
  <Step title="Git の確保">
    Git がない場合は、Linux では apt/dnf/yum、macOS では Homebrew を介してインストールを試みます。
  </Step>
  <Step title="プレフィックス下への OpenClaw のインストール">
    `--prefix <prefix>` を使用して npm でインストールし、`<prefix>/bin/openclaw` にラッパーを書き込みます。
  </Step>
</Steps>

### 例 (install-cli.sh)

<Tabs>
  <Tab title="デフォルト">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="カスタムプレフィックス + バージョン">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --prefix /opt/openclaw --version latest
    ```
  </Tab>
  <Tab title="自動化用 JSON 出力">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="オンボーディングの実行">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="フラグリファレンス">

| フラグ                 | 説明                                                                                            |
| ---------------------- | ----------------------------------------------------------------------------------------------- |
| `--prefix <path>`      | インストールプレフィックス（デフォルト: `~/.openclaw`）                                         |
| `--version <ver>`      | OpenClaw バージョンまたは dist-tag（デフォルト: `latest`）                                      |
| `--node-version <ver>` | Node バージョン（デフォルト: `22.22.0`）                                                        |
| `--json`               | NDJSON イベントを出力                                                                           |
| `--onboard`            | インストール後に `openclaw onboard` を実行                                                      |
| `--no-onboard`         | オンボーディングをスキップ（デフォルト）                                                        |
| `--set-npm-prefix`     | Linux で、現在のプレフィックスが書き込み不可の場合、npm プレフィックスを `~/.npm-global` に強制 |
| `--help`               | 使い方を表示 (`-h`)                                                                             |

  </Accordion>

  <Accordion title="環境変数リファレンス">

| 変数                                        | 説明                                                                               |
| ------------------------------------------- | ---------------------------------------------------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                    | インストールプレフィックス                                                         |
| `OPENCLAW_VERSION=<ver>`                    | OpenClaw バージョンまたは dist-tag                                                 |
| `OPENCLAW_NODE_VERSION=<ver>`               | Node バージョン                                                                    |
| `OPENCLAW_NO_ONBOARD=1`                     | オンボーディングをスキップ                                                         |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | npm ログレベル                                                                     |
| `OPENCLAW_GIT_DIR=<path>`                   | レガシーなクリーンアップ用検索パス（古い `Peekaboo` サブモジュールの削除時に使用） |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`          | sharp/libvips の動作制御（デフォルト: `1`）                                        |

  </Accordion>
</AccordionGroup>

---

## install.ps1

### フロー (install.ps1)

<Steps>
  <Step title="PowerShell + Windows 環境の確保">
    PowerShell 5 以上が必要。
  </Step>
  <Step title="Node.js 22+ の確保">
    ない場合は、winget、次に Chocolatey、次に Scoop を介してインストールを試みます。
  </Step>
  <Step title="OpenClaw のインストール">
    - `npm` メソッド（デフォルト）：選択された `-Tag` を使用したグローバル npm インストール
    - `git` メソッド：リポジトリをクローン/アップデートし、pnpm でインストール/ビルド。`%USERPROFILE%\.local\bin\openclaw.cmd` にラッパーをインストール
  </Step>
  <Step title="インストール後のタスク">
    必要に応じて bin ディレクトリをユーザー PATH へ追加し、アップグレード時および git インストール時には `openclaw doctor --non-interactive` を可能な範囲で実行します。
  </Step>
</Steps>

### 例 (install.ps1)

<Tabs>
  <Tab title="デフォルト">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
  <Tab title="Git インストール">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git
    ```
  </Tab>
  <Tab title="カスタム git ディレクトリ">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -GitDir "C:\openclaw"
    ```
  </Tab>
  <Tab title="ドライラン">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -DryRun
    ```
  </Tab>
  <Tab title="デバッグトレース">
    ```powershell
    # install.ps1 にはまだ専用の -Verbose フラグはありません。
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="フラグリファレンス">

| フラグ                    | 説明                                                               |
| ------------------------- | ------------------------------------------------------------------ |
| `-InstallMethod npm\|git` | インストール方法（デフォルト: `npm`）                              |
| `-Tag <tag>`              | npm dist-tag（デフォルト: `latest`）                               |
| `-GitDir <path>`          | チェックアウトディレクトリ（デフォルト: `%USERPROFILE%\openclaw`） |
| `-NoOnboard`              | オンボーディングをスキップ                                         |
| `-NoGitUpdate`            | `git pull` をスキップ                                              |
| `-DryRun`                 | アクションのみを表示                                               |

  </Accordion>

  <Accordion title="環境変数リファレンス">

| 変数                               | 説明                       |
| ---------------------------------- | -------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | インストール方法           |
| `OPENCLAW_GIT_DIR=<path>`          | チェックアウトディレクトリ |
| `OPENCLAW_NO_ONBOARD=1`            | オンボーディングをスキップ |
| `OPENCLAW_GIT_UPDATE=0`            | git pull を無効化          |
| `OPENCLAW_DRY_RUN=1`               | ドライランモード           |

  </Accordion>
</AccordionGroup>

<Note>
`-InstallMethod git` が使用され、Git がない場合、スクリプトは終了し、Git for Windows のリンクを表示します。
</Note>

---

## CI と自動化

予測可能な実行のために、非対話型フラグ/環境変数を使用してください。

<Tabs>
  <Tab title="install.sh (非対話型 npm)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-prompt --no-onboard
    ```
  </Tab>
  <Tab title="install.sh (非対話型 git)">
    ```bash
    OPENCLAW_INSTALL_METHOD=git OPENCLAW_NO_PROMPT=1 \
      curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="install-cli.sh (JSON)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="install.ps1 (オンボーディングをスキップ)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

---

## トラブルシューティング

<AccordionGroup>
  <Accordion title="なぜ Git が必要なのですか？">
    `git` インストール方法には Git が必要です。`npm` インストールでも、依存関係が git URL を使用している場合の `spawn git ENOENT` エラーを避けるために Git がチェック/インストールされます。
  </Accordion>

  <Accordion title="なぜ Linux で npm が EACCES エラーになるのですか？">
    一部の Linux セットアップでは、npm のグローバルプレフィックスが root 所有のパスを指しています。`install.sh` はプレフィックスを `~/.npm-global` に切り替え、シェルの rc ファイル（存在する場合）に PATH の export を追記できます。
  </Accordion>

  <Accordion title="sharp/libvips の問題">
    スクリプトは、sharp がシステムの libvips に対してビルドされるのを避けるため、デフォルトで `SHARP_IGNORE_GLOBAL_LIBVIPS=1` を設定します。これを上書きするには：

    ```bash
    SHARP_IGNORE_GLOBAL_LIBVIPS=0 curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    Git for Windows をインストールし、PowerShell を開き直し、インストーラーを再実行してください。
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    `npm config get prefix` を実行し、そのディレクトリをユーザー PATH に追加し（Windows では `\bin` サフィックスは不要）、PowerShell を開き直してください。
  </Accordion>

  <Accordion title="Windows: インストーラーの詳細な出力を取得する方法">
    `install.ps1` には現在 `-Verbose` スイッチはありません。
    スクリプトレベルの診断には PowerShell のトレースを使用してください：

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="インストール後に openclaw が見つからない">
    通常は PATH の問題です。[Node.js のトラブルシューティング](/install/node#troubleshooting) を参照してください。
  </Accordion>
</AccordionGroup>
