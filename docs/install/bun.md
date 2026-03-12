---
summary: "Bun ワークフロー（実験的）: インストール方法と pnpm との差分、注意点"
description: "Bun で OpenClaw リポジトリを動かす実験的ワークフローと、pnpm との違い、注意点を説明します。"
read_when:
  - 最速のローカル開発ループ（bun + watch）を使いたい
  - Bun のインストール、パッチ、ライフサイクルスクリプトで問題が出た
title: "Bun で OpenClaw を導入・実行する実験的ワークフロー"
---
目的は、`pnpm` のワークフローから大きく外れずに、このリポジトリを **Bun** で実行できるようにすることです。Bun は任意で利用できますが、WhatsApp / Telegram 用途では推奨されません。

⚠️ **ゲートウェイのランタイムには推奨されません**。WhatsApp / Telegram まわりで不具合があるため、本番環境では Node を使用してください。

## ステータス

- Bun は TypeScript を直接実行するための任意のローカルランタイムです（`bun run …`、`bun --watch …`）。
- ビルドの既定は `pnpm` で、引き続き完全にサポートされています。一部のドキュメント用ツールも `pnpm` を使います。
- Bun は `pnpm-lock.yaml` を利用できないため、このファイルは無視されます。

## インストール

既定のインストール:

```sh
bun install
```

補足: `bun.lock` / `bun.lockb` は `.gitignore` に含まれているため、どちらを使ってもリポジトリに余計な差分は出ません。ロックファイルを一切書き込みたくない場合は、次を使います。

```sh
bun install --no-save
```

## ビルド / テスト (Bun)

```sh
bun run build
bun run vitest run
```

## Bun のライフサイクルスクリプト (既定ではブロック)

Bun は、依存パッケージのライフサイクルスクリプトを明示的に信頼しない限り、実行をブロックすることがあります（`bun pm untrusted` / `bun pm trust`）。

このリポジトリでは、一般にブロックされるスクリプトは通常不要です。

- `@whiskeysockets/baileys` の `preinstall`: Node のメジャーバージョンが 20 以上かを確認します。OpenClaw では Node 22+ を想定しています。
- `protobufjs` の `postinstall`: 互換性のないバージョン体系に関する警告を出すだけで、ビルド成果物は生成しません。

これらのスクリプトが本当に必要なランタイム問題に遭遇した場合のみ、明示的に信頼してください。

```sh
bun pm trust @whiskeysockets/baileys protobufjs
```

## 注意点

- 一部のスクリプトはまだ `pnpm` を前提にしています。たとえば `docs:build`、`ui:*`、`protocol:check` です。現時点では、これらは `pnpm` で実行してください。
