---
summary: "Bun ワークフロー (実験的): pnpm との比較、インストール、注意点"
read_when:
  - 最速のローカル開発ループを求めている場合 (bun + watch)
  - Bun のインストール/パッチ/ライフサイクルスクリプトの問題に遭遇した場合
title: "Bun (実験的)"
---

# Bun (実験的)

目標: pnpm のワークフローから逸脱することなく、このリポジトリを **Bun** で実行すること (オプション、WhatsApp/Telegram では非推奨)。

⚠️ **Gateway ランタイムとしては推奨されません** (WhatsApp/Telegram のバグのため)。本番環境では Node を使用してください。

## ステータス

- Bun は、TypeScript を直接実行するためのオプションのローカルランタイムです (`bun run …`, `bun --watch …`)。
- ビルドのデフォルトは `pnpm` であり、引き続き完全にサポートされます (一部のドキュメントツールでも使用されています)。
- Bun は `pnpm-lock.yaml` を使用できず、無視します。

## インストール

デフォルト:

```sh
bun install
```

注意: `bun.lock`/`bun.lockb` は gitignore されているため、どちらにしてもリポジトリに変更は生じません。*ロックファイルの書き込みを一切行いたくない*場合は:

```sh
bun install --no-save
```

## ビルド / テスト (Bun)

```sh
bun run build
bun run vitest run
```

## Bun のライフサイクルスクリプト (デフォルトでブロック)

Bun は、明示的に信頼されない限り、依存関係のライフサイクルスクリプトをブロックする場合があります (`bun pm untrusted` / `bun pm trust`)。
このリポジトリでは、一般的にブロックされるスクリプトは必要ありません:

- `@whiskeysockets/baileys` `preinstall`: Node のメジャーバージョンが 20 以上であることを確認します (私たちは Node 22+ を実行しています)。
- `protobufjs` `postinstall`: 互換性のないバージョンスキームに関する警告を出力します (ビルドアーティファクトはありません)。

これらのスクリプトを必要とする実際のランタイムの問題に遭遇した場合は、明示的に信頼してください:

```sh
bun pm trust @whiskeysockets/baileys protobufjs
```

## 注意点

- 一部のスクリプトはまだ pnpm をハードコードしています (例: `docs:build`, `ui:*`, `protocol:check`)。現時点では、これらは pnpm を介して実行してください。
