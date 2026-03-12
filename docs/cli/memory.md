---
summary: "`openclaw memory` の CLI リファレンス (ステータス確認、インデックス作成、記憶検索)"
read_when:
  - セマンティック記憶のインデックス作成や検索を行いたい場合
  - 記憶機能の可用性やインデックスの状態をデバッグしたい場合
title: "memory"
seoTitle: "OpenClaw CLI: openclaw memory コマンドの使い方と主要オプション・実行例"
description: "セマンティック記憶（Semantic Memory）のインデックス管理と検索を行います。この機能は現在有効な記憶プラグイン（デフォルトは memory-core）によって提供されます。"
x-i18n:
  source_hash: "a5b73731b37e1d3f6d0ddb17d58077a76d85d531ead51f59611e254d94337ba0"
---
セマンティック記憶（Semantic Memory）のインデックス管理と検索を行います。
この機能は現在有効な記憶プラグイン（デフォルトは `memory-core`）によって提供されます。無効にする場合は、構成で `plugins.slots.memory = "none"` を設定してください。

関連ドキュメント:
- 記憶の概念: [記憶](/concepts/memory)
- プラグイン: [プラグイン](/tools/plugin)

## 実行例

```bash
openclaw memory status
openclaw memory status --deep
openclaw memory index --force
openclaw memory search "ミーティングのメモ"
openclaw memory search --query "デプロイ" --max-results 20
openclaw memory status --json
openclaw memory status --deep --index
openclaw memory status --deep --index --verbose
openclaw memory status --agent main
openclaw memory index --agent main --verbose
```

## オプション

### `memory status` および `memory index`

- `--agent <id>`: 特定のエージェントを対象にします。指定しない場合、構成されているすべてのエージェントに対して実行されます。エージェントリストが未設定の場合は、デフォルトのエージェントが使用されます。
- `--verbose`: 診断やインデックス作成中に詳細なログを出力します。

### `memory status`

- `--deep`: ベクトルデータベースおよび埋め込み（Embedding）機能の可用性を診断します。
- `--index`: ストレージが「ダーティ」（更新が必要な状態）であれば再インデックスを実行します（`--deep` も含みます）。
- `--json`: JSON 形式で出力します。

### `memory index`

- `--force`: インデックスの完全な再作成を強制します。

### `memory search`

- クエリ入力: 位置引数としての `[query]`、または `--query <text>` フラグのいずれかを使用します。
- 両方が指定された場合は `--query` が優先されます。
- いずれも指定されなかった場合、コマンドはエラーで終了します。
- `--agent <id>`: 検索対象のエージェントを指定します（デフォルトは構成されたデフォルトエージェント）。
- `--max-results <n>`: 返される検索結果の最大件数を制限します。
- `--min-score <n>`: 類似度スコアが低い結果をフィルタリングします。
- `--json`: 検索結果を JSON 形式で出力します。

## 補足事項

- `memory index --verbose` を実行すると、使用されているプロバイダー、モデル、ソース、バッチ処理の状況などの詳細が表示されます。
- `memory status` は、`memorySearch.extraPaths` で設定された追加のパスも対象に含めます。
- メモリ機能で使用するリモート API キーが SecretRef として構成されている場合、コマンドは稼働中のゲートウェイのスナップショットからその値を解決します。ゲートウェイが利用できない場合、コマンドは即座に終了します。
- ゲートウェイのバージョンに関する注意: このパスを使用するには、`secrets.resolve` メソッドをサポートするゲートウェイが必要です。古いバージョンのゲートウェイでは、メソッド未定義エラーが返されます。
