---
summary: "OpenClawのインストール — インストーラースクリプト、npm/pnpm、ソースからのビルド、Dockerなど"
description: "インストーラー以外の導入方法、プラットフォーム別手順、メンテナンス項目をまとめたインストール総合ガイドです。"
read_when:
  - 導入ガイド(Getting Started)以外のインストール方法が必要な場合
  - クラウドプラットフォームへデプロイしたい場合
  - アップデート、移行、またはアンインストールを行う必要がある場合
title: "インストール"
seoTitle: "OpenClawのインストール方法一覧と導入比較ガイド"
---
すでに[導入ガイド(Getting Started)](/start/getting-started)の手順を完了していますか？ その場合は準備完了です。このページでは、代替のインストール方法、プラットフォーム固有の手順、およびメンテナンスについて説明します。

## システム要件

- **[Node 22+](/install/node)** (見つからない場合、[インストーラースクリプト](#インストール方法)がインストールします)
- macOS、Linux、または Windows
- ソースからビルドする場合のみ `pnpm` が必要

<Note>
Windowsでは、[WSL2](https://learn.microsoft.com/en-us/windows/wsl/install)環境でOpenClawを実行することを強く推奨します。
</Note>

## インストール方法

<Tip>
OpenClawのインストールには**インストーラースクリプト**の使用が推奨されます。Nodeの検出、インストール、オンボーディングをワンステップで処理します。
</Tip>

<Warning>
VPS/クラウドホストを利用する場合、サードパーティの「1クリック」マーケットプレイスイメージは可能な限り避けてください。クリーンなベースOSイメージ（例: Ubuntu LTS）を優先し、インストーラースクリプトを使用してOpenClawをご自身でインストールしてください。
</Warning>

<AccordionGroup>
  <Accordion title="インストーラースクリプト" icon="rocket" defaultOpen>
    CLIをダウンロードし、npm経由でグローバルにインストールして、オンボーディングウィザードを起動します。

    <Tabs>
      <Tab title="macOS / Linux / WSL2">
        ```bash
        curl -fsSL https://openclaw.ai/install.sh | bash
        ```
      </Tab>
      <Tab title="Windows (PowerShell)">
        ```powershell
        iwr -useb https://openclaw.ai/install.ps1 | iex
        ```
      </Tab>
    </Tabs>

    これだけで完了です。スクリプトがNodeの検出、インストール、およびオンボーディングを処理します。

    オンボーディングをスキップしてバイナリのインストールのみを行う場合は、次のように実行します。

    <Tabs>
      <Tab title="macOS / Linux / WSL2">
        ```bash
        curl -fsSL https://openclaw.ai/install.sh | bash -s -- --no-onboard
        ```
      </Tab>
      <Tab title="Windows (PowerShell)">
        ```powershell
        & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
        ```
      </Tab>
    </Tabs>

    すべてのフラグ、環境変数(env vars)、CI/自動化オプションについては、[インストーラの内部仕様(Installer internals)](/install/installer)を参照してください。

  </Accordion>

  <Accordion title="npm / pnpm" icon="package">
    すでにNode 22+がインストールされており、ご自身でインストールを管理したい場合:

    <Tabs>
      <Tab title="npm">
        ```bash
        npm install -g openclaw@latest
        openclaw onboard --install-daemon
        ```

        <Accordion title="sharpのビルドエラーが発生した場合">
          libvipsがグローバルにインストールされており（macOSのHomebrew経由でよく見られます）、`sharp`のビルドに失敗する場合は、ビルド済みバイナリを強制的に使用します。

          ```bash
          SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install -g openclaw@latest
          ```

          `sharp: Please add node-gyp to your dependencies`というエラーが表示された場合は、ビルドツールをインストールするか（macOS: Xcode CLT + `npm install -g node-gyp`）、上記の環境変数を使用してください。
        </Accordion>
      </Tab>
      <Tab title="pnpm">
        ```bash
        pnpm add -g openclaw@latest
        pnpm approve-builds -g        # approve openclaw, node-llama-cpp, sharp, etc.
        openclaw onboard --install-daemon
        ```

        <Note>
        pnpmでは、ビルドスクリプトを含むパッケージに対して明示的な承認が必要です。最初のインストール時に「Ignored build scripts(ビルドスクリプトが無視されました)」という警告が表示された後、`pnpm approve-builds -g` を実行し、リストされたパッケージを選択してください。
        </Note>
      </Tab>
    </Tabs>

  </Accordion>

  <Accordion title="ソースからのビルド" icon="github">
    コントリビューター、またはローカルのチェックアウトから実行したい方向けの方法です。

    <Steps>
      <Step title="クローンとビルド">
        [OpenClawリポジトリ](https://github.com/openclaw/openclaw)をクローンしてビルドします:

        ```bash
        git clone https://github.com/openclaw/openclaw.git
        cd openclaw
        pnpm install
        pnpm ui:build
        pnpm build
        ```
      </Step>
      <Step title="CLIのリンク">
        `openclaw`コマンドをグローバルに利用できるようにします:

        ```bash
        pnpm link --global
        ```

        または、リンクをスキップして、リポジトリ内から `pnpm openclaw ...` を経由してコマンドを実行することもできます。
      </Step>
      <Step title="オンボーディングの実行">
        ```bash
        openclaw onboard --install-daemon
        ```
      </Step>
    </Steps>

    より詳細な開発ワークフローについては、[セットアップ(Setup)](/start/setup)を参照してください。

  </Accordion>
</AccordionGroup>

## その他のインストール方法

<CardGroup cols={2}>
  <Card title="Docker" href="/install/docker" icon="container">
    コンテナ化、またはヘッドレスでのデプロイメント。
  </Card>
  <Card title="Podman" href="/install/podman" icon="container">
    ルートレスコンテナ: 一度だけ `setup-podman.sh` を実行し、その後起動スクリプトを実行します。
  </Card>
  <Card title="Nix" href="/install/nix" icon="snowflake">
    Nixを使用した宣言的インストール。
  </Card>
  <Card title="Ansible" href="/install/ansible" icon="server">
    自動化されたフリート(fleet)のプロビジョニング。
  </Card>
  <Card title="Bun" href="/install/bun" icon="zap">
    Bunランタイムを経由したCLIのみの利用。
  </Card>
</CardGroup>

## インストール後

すべてが正常に動作しているか確認します:

```bash
openclaw doctor         # check for config issues
openclaw status         # gateway status
openclaw dashboard      # open the browser UI
```

カスタムのランタイムパスが必要な場合は、以下を使用します:

- `OPENCLAW_HOME` - ホームディレクトリベースの内部パス用
- `OPENCLAW_STATE_DIR` - 変更可能な状態の保存場所用
- `OPENCLAW_CONFIG_PATH` - 設定ファイルの場所用

優先順位や詳細については、[環境変数(Environment vars)](/help/environment)を参照してください。

## トラブルシューティング: `openclaw` が見つからない

<Accordion title="PATHの診断と修正">
  簡単な診断方法:

```bash
node -v
npm -v
npm prefix -g
echo "$PATH"
```

`$(npm prefix -g)/bin` (macOS/Linux) または `$(npm prefix -g)` (Windows) が `$PATH` に**含まれていない**場合、シェルはグローバルなnpmバイナリ（`openclaw` を含む）を見つけることができません。

修正方法 — シェルのスタートアップファイル（`~/.zshrc` または `~/.bashrc`）に以下を追加します:

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

Windowsの場合は、`npm prefix -g` の出力を環境変数 PATH に追加してください。

その後、新しいターミナルを開くか（またはzshの場合は `rehash`、bashの場合は `hash -r` を実行します）、設定を反映させます。
</Accordion>

## アップデート / アンインストール

<CardGroup cols={3}>
  <Card title="アップデート" href="/install/updating" icon="refresh-cw">
    OpenClawを最新の状態に保ちます。
  </Card>
  <Card title="移行" href="/install/migrating" icon="arrow-right">
    新しいマシンに移動します。
  </Card>
  <Card title="アンインストール" href="/install/uninstall" icon="trash-2">
    OpenClawを完全に削除します。
  </Card>
</CardGroup>
