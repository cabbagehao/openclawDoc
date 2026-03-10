---
summary: "「openclaw メモリ」の CLI リファレンス (ステータス/インデックス/検索)"
read_when:
  - セマンティックメモリにインデックスを付けたり、検索したりしたい
  - メモリの可用性またはインデックス作成をデバッグしている
title: "メモリ"
x-i18n:
  source_hash: "a5b73731b37e1d3f6d0ddb17d58077a76d85d531ead51f59611e254d94337ba0"
---

# `openclaw memory`

セマンティックメモリのインデックス作成と検索を管理します。
アクティブ メモリ プラグインによって提供されます (デフォルト: `memory-core`、無効にするには `plugins.slots.memory = "none"` を設定します)。

関連:

- メモリの概念: [メモリ](/concepts/memory)
- プラグイン: [プラグイン](/tools/plugin)

## 例

```bash
openclaw memory status
openclaw memory status --deep
openclaw memory index --force
openclaw memory search "meeting notes"
openclaw memory search --query "deployment" --max-results 20
openclaw memory status --json
openclaw memory status --deep --index
openclaw memory status --deep --index --verbose
openclaw memory status --agent main
openclaw memory index --agent main --verbose
```

## オプション

`memory status` および `memory index`:

- `--agent <id>`: 単一のエージェントを対象とします。これがないと、これらのコマンドは構成されたエージェントごとに実行されます。エージェント リストが設定されていない場合は、デフォルトのエージェントに戻ります。
- `--verbose`: プローブおよびインデックス作成中に詳細なログを出力します。

`memory status`:

- `--deep`: プローブ ベクトル + 埋め込みの可用性。
- `--index`: ストアがダーティな場合は再インデックスを実行します (`--deep` を暗黙的に示します)。
- `--json`: JSON 出力を印刷します。

`memory index`:

- `--force`: 完全なインデックスの再作成を強制します。

`memory search`:

- クエリ入力: 位置 `[query]` または `--query <text>` のいずれかを渡します。
- 両方が指定された場合は、`--query` が優先されます。
- どちらも指定されていない場合、コマンドはエラーで終了します。
- `--agent <id>`: 単一のエージェントを対象とします (デフォルト: デフォルトのエージェント)。
- `--max-results <n>`: 返される結果の数を制限します。
- `--min-score <n>`: スコアの低い一致を除外します。
- `--json`: JSON 結果を出力します。

注:- `memory index --verbose` は、フェーズごとの詳細 (プロバイダー、モデル、ソース、バッチ アクティビティ) を出力します。

- `memory status` には、`memorySearch.extraPaths` 経由で構成された追加のパスが含まれます。
- 事実上アクティブなメモリのリモート API キー フィールドが SecretRefs として構成されている場合、コマンドはアクティブなゲートウェイ スナップショットからそれらの値を解決します。ゲートウェイが使用できない場合、コマンドはすぐに失敗します。
- ゲートウェイのバージョンに関する注意: このコマンド パスには、`secrets.resolve` をサポートするゲートウェイが必要です。古いゲートウェイは、不明なメソッドのエラーを返します。
