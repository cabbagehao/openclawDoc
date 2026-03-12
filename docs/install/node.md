---
title: "Node.js"
seoTitle: "OpenClaw 用 Node.js の導入確認・更新・PATH 問題の解決"
summary: "OpenClaw 用の Node.js のインストールと設定 — バージョン要件、インストールオプション、および PATH のトラブルシューティング"
description: "Node.js を手動で準備して OpenClaw を動かすためのバージョン要件、PATH 設定、確認方法を説明します。"
read_when:
  - "OpenClaw をインストールする前に Node.js をインストールする必要がある場合"
  - "OpenClaw をインストールしたが `openclaw` コマンドが見つからない場合"
  - "npm install -g が権限や PATH の問題で失敗する場合"
---
OpenClaw には **Node 22 以降** が必要です。[インストーラースクリプト](/install#install-methods) は Node を自動検出して導入しますが、このページは、Node を手動でセットアップし、バージョン、PATH、グローバルインストールが正しく揃っているか確認したい場合のガイドです。

## バージョンの確認

```bash
node -v
```

ここで `v22.x.x` 以上が表示されれば問題ありません。Node が未導入、または古すぎる場合は、以下の方法から選んでください。

## Node のインストール

<Tabs>
  <Tab title="macOS">
    **Homebrew** (推奨):

    ```bash
    brew install node
    ```

    または、[nodejs.org](https://nodejs.org/) から macOS 用インストーラーをダウンロードしてください。

  </Tab>
  <Tab title="Linux">
    **Ubuntu / Debian:**

    ```bash
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt-get install -y nodejs
    ```

    **Fedora / RHEL:**

    ```bash
    sudo dnf install nodejs
    ```

    または、バージョンマネージャーを使用してください（下記参照）。

  </Tab>
  <Tab title="Windows">
    **winget** (推奨):

    ```powershell
    winget install OpenJS.NodeJS.LTS
    ```

    **Chocolatey:**

    ```powershell
    choco install nodejs-lts
    ```

    または、[nodejs.org](https://nodejs.org/) から Windows 用インストーラーをダウンロードしてください。

  </Tab>
</Tabs>

<Accordion title="バージョンマネージャー（nvm, fnm, mise, asdf）の使用">
  バージョンマネージャーを使うと、Node のバージョン切り替えが容易です。代表的な選択肢:

- [**fnm**](https://github.com/Schniz/fnm) — 高速、クロスプラットフォーム
- [**nvm**](https://github.com/nvm-sh/nvm) — macOS/Linux で広く使用されている
- [**mise**](https://mise.jdx.dev/) — 多言語対応（Node, Python, Ruby など）

fnm を使用した例：

```bash
fnm install 22
fnm use 22
```

  <Warning>
  バージョンマネージャーがシェルの起動ファイル（`~/.zshrc` または `~/.bashrc`）で初期化されていることを確認してください。初期化されていない場合、PATH に Node の bin ディレクトリが含まれないため、新しいターミナルセッションで `openclaw` が見つからない可能性があります。
  </Warning>
</Accordion>

## トラブルシューティング

### `openclaw: command not found`

ほとんどの場合、npm のグローバル bin ディレクトリが PATH に入っていないことが原因です。

<Steps>
  <Step title="グローバル npm プレフィックスを確認する">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="PATH に含まれているか確認する">
    ```bash
    echo "$PATH"
    ```

    出力の中に `<npm-prefix>/bin` (macOS/Linux) または `<npm-prefix>` (Windows) があるか探します。

  </Step>
  <Step title="シェルの起動ファイルに追加する">
    <Tabs>
      <Tab title="macOS / Linux">
        `~/.zshrc` または `~/.bashrc` に追加します：

        ```bash
        export PATH="$(npm prefix -g)/bin:$PATH"
        ```

        その後、新しいターミナルを開くか（または zsh で `rehash` / bash で `hash -r` を実行）、設定を反映させます。
      </Tab>
      <Tab title="Windows">
        [設定] → [システム] → [環境変数] から、`npm prefix -g` の出力をシステム PATH に追加してください。
      </Tab>
    </Tabs>

  </Step>
</Steps>

### `npm install -g` での権限エラー (Linux)

`EACCES` エラーが表示される場合は、npm のグローバルプレフィックスをユーザーが書き込み可能なディレクトリに変更してください：

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

この設定を永続的にするには、`export PATH=...` の行を `~/.bashrc` または `~/.zshrc` に追加してください。
