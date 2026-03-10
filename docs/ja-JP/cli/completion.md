---
summary: "「openclaw 補完」の CLI リファレンス (シェル補完スクリプトの生成/インストール)"
read_when:
  - zsh/bash/fish/PowerShell のシェル補完が必要な場合
  - OpenClaw 状態で完了スクリプトをキャッシュする必要があります
title: "完了"
x-i18n:
  source_hash: "7bbf140a880bafdb7140149f85465d66d0d46e5a3da6a1e41fb78be2fd2bd4d0"
---

# `openclaw completion`

シェル完了スクリプトを生成し、必要に応じてそれらをシェル プロファイルにインストールします。

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

- `-s, --shell <shell>`: シェル ターゲット (`zsh`、`bash`、`powershell`、`fish`、デフォルト: `zsh`)
- `-i, --install`: シェル プロファイルにソース行を追加することでインストールが完了します。
- `--write-state`: 標準出力に出力せずに、完了スクリプトを `$OPENCLAW_STATE_DIR/completions` に書き込みます。
- `-y, --yes`: インストール確認プロンプトをスキップします

## 注意事項

- `--install` は、小さな「OpenClaw Completion」ブロックをシェル プロファイルに書き込み、キャッシュされたスクリプトをポイントします。
- `--install` または `--write-state` を指定しない場合、コマンドはスクリプトを標準出力に出力します。
- 完了生成ではコマンド ツリーが積極的に読み込まれるため、ネストされたサブコマンドが含まれます。
