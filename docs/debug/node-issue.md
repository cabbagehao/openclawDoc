---
summary: "Node + tsx における「__name is not a function」クラッシュの原因と回避策"
read_when:
  - Node 限定の開発スクリプトやウォッチモードの失敗をデバッグする場合
  - OpenClaw における tsx/esbuild ローダーのクラッシュを調査する場合
title: "Node + tsx のクラッシュ"
seoTitle: "OpenClawのNodeとtsxのクラッシュ原因を切り分けるデバッグガイド"
description: "この問題は、開発スクリプトを Bun から tsx へ切り替えた後（コミット 2871657e, 2026-01-06）に発生し始めました。Bun を使用した実行パスでは問題なく動作していました。"
x-i18n:
  source_hash: "f5beab7cdfe7679680f65176234a617293ce495886cfffb151518adfa61dc8dc"
---
## 概要

Node 上で `tsx` を使用して OpenClaw を実行しようとすると、起動時に以下の TypeError で失敗する場合があります:

```
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (.../src/logging/subsystem.ts:203:25)
    at .../src/agents/auth-profiles/constants.ts:25:20
```

この問題は、開発スクリプトを Bun から `tsx` へ切り替えた後（コミット `2871657e`, 2026-01-06）に発生し始めました。Bun を使用した実行パスでは問題なく動作していました。

## 環境

- Node: v25.x (v25.3.0 で確認)
- tsx: 4.21.0
- OS: macOS (Node 25 が動作する他のプラットフォームでも再現する可能性があります)

## 再現手順 (Node のみ)

```bash
# リポジトリルートにて
node --version
pnpm install
node --import tsx src/entry.ts status
```

## リポジトリ内の最小再現コード

```bash
node --import tsx scripts/repro/tsx-name-repro.ts
```

## Node バージョンごとの状況

- Node 25.3.0: 失敗
- Node 22.22.0 (Homebrew `node@22`): 失敗
- Node 24: 未検証

## 原因の仮説

- `tsx` は TypeScript/ESM の変換に esbuild を使用しています。esbuild の `keepNames` オプションは `__name` ヘルパーを生成し、関数定義を `__name(...)` でラップします。
- クラッシュの内容は、実行時に `__name` は存在するものの関数ではないことを示しています。これは、Node 25 のローダーパスにおいて、このモジュールのヘルパーが欠落しているか、あるいは上書きされている可能性を示唆しています。
- 他の esbuild 利用者からも、同様の `__name` ヘルパーに関する問題が報告されています。

## 回帰の経緯

- `2871657e` (2026-01-06): Bun を必須条件から外すため、スクリプトを Bun から tsx へ変更。
- それ以前 (Bun パス) では、`openclaw status` や `gateway:watch` は正常に動作していました。

## 回避策

- 開発スクリプトには Bun を使用する（現在の一時的な暫定処置）。
- Node + tsc watch を使用し、コンパイル後の出力を実行する:

  ```bash
  pnpm exec tsc --watch --preserveWatchOutput
  node --watch openclaw.mjs status
  ```

- ローカル環境で `pnpm exec tsc -p tsconfig.json` + `node openclaw.mjs status` が Node 25 上で動作することを確認済みです。
- 可能であれば TS ローダーで esbuild の keepNames を無効化する（`__name` ヘルパーの挿入を防ぐ）。ただし、現在 tsx はこの設定を公開していません。
- Node LTS (22/24) と `tsx` の組み合わせで、この問題が Node 25 固有のものかどうかをテストする。

## 参考資料

- [Cloudflare: howtos/keep_names](https://opennext.js.org/cloudflare/howtos/keep_names)
- [esbuild API: #keep-names](https://esbuild.github.io/api/#keep-names)
- [esbuild Issue #1031](https://github.com/evanw/esbuild/issues/1031)

## 次のステップ

- Node 22/24 で再現を試み、Node 25 での回帰（デグレード）かどうかを特定する。
- `tsx` のナイトリービルドを試すか、既知の不具合がある場合は以前のバージョンに固定する。
- Node LTS でも再現する場合は、`__name` のスタックトレースを添えてアップストリームに最小再現例を報告する。
