---
summary: "プラグイン manifest と JSON Schema 要件（厳格な設定検証）"
read_when:
  - OpenClaw プラグインを開発しているとき
  - プラグイン設定 schema を配布したい、または validation error を調べたいとき
title: "プラグイン マニフェスト"
x-i18n:
  source_hash: "a4c589022cea530e524951a11cf654d3bf80ee536893c2d4b7823d20d583c631"
---

# Plugin manifest（openclaw\.plugin.json）

すべてのプラグインは、**plugin root** に `openclaw.plugin.json` を **必ず** 含める必要があります。OpenClaw はこの manifest を使って、**プラグイン コードを実行せずに** 設定を検証します。manifest が欠落している、または不正な場合は plugin error として扱われ、設定検証は失敗します。

完全なプラグイン システムの説明は [Plugins](/tools/plugin) を参照してください。

## 必須フィールド

```json
{
  "id": "voice-call",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

必須キー:

* `id`（string）: 正式な plugin id
* `configSchema`（object）: プラグイン設定用の JSON Schema（inline）

任意キー:

* `kind`（string）: plugin kind（例: `"memory"`、`"context-engine"`）
* `channels`（array）: このプラグインが登録する channel id（例: `["matrix"]`）
* `providers`（array）: このプラグインが登録する provider id
* `skills`（array）: 読み込む skill ディレクトリ（plugin root からの相対パス）
* `name`（string）: 表示名
* `description`（string）: 短い概要
* `uiHints`（object）: UI 描画用の label / placeholder / sensitive flag
* `version`（string）: プラグイン バージョン（参考情報）

## JSON Schema の要件

* **すべてのプラグインは JSON Schema を同梱する必要があります。** 設定を一切受け取らない場合でも必須です。
* 空の schema でも構いません。例: `{ "type": "object", "additionalProperties": false }`
* schema の検証は runtime ではなく、設定の読み書き時に行われます。

## 検証時の挙動

* プラグイン manifest で宣言されていない channel id に対する `channels.*` キーは **エラー** です。
* `plugins.entries.<id>`、`plugins.allow`、`plugins.deny`、`plugins.slots.*` は、**発見可能な** plugin id を参照していなければならず、不明な id は **エラー** になります。
* plugin がインストールされていても、manifest または schema が壊れている、あるいは欠落している場合、validation は失敗し、Doctor が plugin error を報告します。
* plugin 設定が存在していても、その plugin が **無効** であれば、設定自体は保持され、Doctor とログには **warning** が出ます。

## 補足

* manifest は、ローカル filesystem から読み込む plugin を含め、**すべてのプラグインで必須** です。
* runtime はプラグイン モジュールを別途読み込みます。manifest は discovery と validation のためだけに使われます。
* 排他的な plugin kind は `plugins.slots.*` で選択します。
  * `kind: "memory"` は `plugins.slots.memory` で選択します。
  * `kind: "context-engine"` は `plugins.slots.contextEngine` で選択します。
    既定値は組み込みの `legacy` です。
* plugin が native module に依存する場合は、build 手順と、必要な package manager の allowlist 要件（例: pnpm の `allow-build-scripts`、`pnpm rebuild <package>`）を明記してください。
