---
summary: "Node + tsx「__name は関数ではありません」クラッシュに関するメモと回避策"
read_when:
  - ノードのみの開発スクリプトまたは監視モードの失敗のデバッグ
  - OpenClaw での tsx/esbuild ローダーのクラッシュを調査する
title: "ノード + tsx のクラッシュ"
x-i18n:
  source_hash: "f5beab7cdfe7679680f65176234a617293ce495886cfffb151518adfa61dc8dc"
---

# Node + tsx "\_\_name は関数ではありません" クラッシュ

## 概要

`tsx` を使用してノード経由で OpenClaw を実行すると、起動時に次のメッセージが表示されて失敗します。

```
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (.../src/logging/subsystem.ts:203:25)
    at .../src/agents/auth-profiles/constants.ts:25:20
```

これは、開発スクリプトを Bun から `tsx` に切り替えた後に始まりました (`2871657e` をコミット、2026 年 1 月 6 日)。同じランタイム パスが Bun でも機能しました。

## 環境

- ノード: v25.x (v25.3.0 で確認)
  -tsx：4.21.0
- OS: macOS (Node 25 を実行する他のプラットフォームでも再現される可能性があります)

## 再現 (ノードのみ)

```bash
# in repo root
node --version
pnpm install
node --import tsx src/entry.ts status
```

## リポジトリ内の最小限の再現

```bash
node --import tsx scripts/repro/tsx-name-repro.ts
```

## ノードのバージョン確認

- ノード 25.3.0: 失敗します
- ノード 22.22.0 (Homebrew `node@22`): 失敗します
- ノード 24: ここにはまだインストールされていません。検証が必要です

## メモ/仮説

- `tsx` は、esbuild を使用して TS/ESM を変換します。 esbuild の `keepNames` は `__name` ヘルパーを生成し、関数定義を `__name(...)` でラップします。
- クラッシュは、`__name` が存在するが実行時の関数ではないことを示しています。これは、ノード 25 ローダー パスでこのモジュールのヘルパーが欠落しているか上書きされていることを意味します。
- ヘルパーが見つからないか書き換えられた場合、同様の `__name` ヘルパーの問題が他の esbuild コンシューマーでも報告されています。

## 回帰履歴

- `2871657e` (2026-01-06): Bun をオプションにするために、スクリプトが Bun から tsx に変更されました。
- その前 (Bun パス)、`openclaw status` と `gateway:watch` は動作していました。

## 回避策- 開発スクリプトには Bun を使用します (現在の一時的な復帰)

- Node + tsc watch を使用し、コンパイルされた出力を実行します。

  ```bash
  pnpm exec tsc --watch --preserveWatchOutput
  node --watch openclaw.mjs status
  ```

- ローカルで確認済み: `pnpm exec tsc -p tsconfig.json` + `node openclaw.mjs status` はノード 25 で動作します。
- 可能であれば、TS ローダーの esbuild keepNames を無効にします (`__name` ヘルパーの挿入を防ぎます)。 tsx は現在これを公開していません。
- `tsx` を使用してノード LTS (22/24) をテストし、問題がノード 25 固有のものであるかどうかを確認します。

## 参考文献

- [https://opennext.js.org/cloudflare/howtos/keep_names](https://opennext.js.org/cloudflare/howtos/keep_names)
- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## 次のステップ

- ノード 22/24 で再現して、ノード 25 の回帰を確認します。
- `tsx` を毎晩テストするか、既知の回帰が存在する場合は以前のバージョンに固定します。
- ノード LTS で再現する場合は、`__name` スタック トレースを使用して最小限の再現をアップストリームにファイルします。
