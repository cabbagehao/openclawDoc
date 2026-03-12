---
summary: "`openclaw completion` の CLI リファレンス (シェル補完スクリプトの生成とインストール)"
read_when:
  - zsh, bash, fish, PowerShell 用のシェル補完を導入したい場合
  - 補完スクリプトを OpenClaw の状態ディレクトリにキャッシュしたい場合
title: "OpenClaw CLI: openclaw completion コマンドの使い方と主要オプション・実行例"
description: "シェル補完スクリプトを生成し、オプションでシェルプロファイルにインストールします。使用法、オプション、補足事項を確認できます。"
x-i18n:
  source_hash: "7bbf140a880bafdb7140149f85465d66d0d46e5a3da6a1e41fb78be2fd2bd4d0"
---
シェル補完スクリプトを生成し、オプションでシェルプロファイルにインストールします。

## 使用法

```bash
openclaw completion
openclaw completion --shell zsh
openclaw completion --install
openclaw completion --shell fish --install
openclaw completion --write-state
openclaw completion --shell bash --write-state
```

## オプション

- `-s, --shell <shell>`: 対象とするシェルを指定 (`zsh`, `bash`, `powershell`, `fish`。デフォルトは `zsh`)
- `-i, --install`: シェルプロファイルに source 行を追加して補完を有効化
- `--write-state`: 標準出力への表示は行わず、補完スクリプトを `$OPENCLAW_STATE_DIR/completions` に書き込む
- `-y, --yes`: インストール時の確認プロンプトをスキップ

## 補足事項

- `--install` を指定すると、シェルプロファイルに小さな "OpenClaw Completion" ブロックが書き込まれ、キャッシュされたスクリプトが読み込まれるようになります。
- `--install` または `--write-state` を指定しない場合、スクリプトの内容が標準出力に表示されます。
- 補完の生成時にはコマンドツリーが即座にロードされるため、入れ子になったサブコマンドもすべて含まれます。
