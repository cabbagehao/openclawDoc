---
title: "プロンプトキャッシング"
seoTitle: "OpenClawプロンプトキャッシングの仕組みと運用判断ガイド"
summary: "プロンプト キャッシュ ノブ、マージ順序、プロバイダーの動作、およびチューニング パターン"
read_when:
description: "プロンプト キャッシュとは、モデル プロバイダーが変更されていないプロンプト プレフィックス (通常はシステム/開発者の指示やその他の安定したコンテキスト) を毎回再処理するのではなく、ターンをまたいで再利用できることを意味します。"
x-i18n:
  source_hash: "7952e90d0d6eb23fee4e0046220dddc7c89dc19aae0129d0619290e081a92778"
---
プロンプト キャッシュとは、モデル プロバイダーが変更されていないプロンプト プレフィックス (通常はシステム/開発者の指示やその他の安定したコンテキスト) を毎回再処理するのではなく、ターンをまたいで再利用できることを意味します。最初に一致したリクエストはキャッシュ トークンを書き込み (`cacheWrite`)、その後の一致したリクエストはキャッシュ トークンを読み戻すことができます (`cacheRead`)。

これが重要な理由: トークンコストの削減、応答の高速化、長時間実行セッションのパフォーマンスの予測可能性の向上。キャッシュを使用しないと、ほとんどの入力が変更されなかった場合でも、プロンプトが繰り返されると、ターンごとにプロンプ​​ト コストの全額が支払われます。

このページでは、プロンプト再利用とトークン コストに影響を与えるキャッシュ関連のノブをすべて取り上げます。

Anthropic の価格の詳細については、以下を参照してください。
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

## プライマリノブ

### `cacheRetention` (モデルおよびエージェントごと)

モデルパラメータでキャッシュ保持を設定します。

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # none | short | long
```

エージェントごとのオーバーライド:

```yaml
agents:
  list:
    - id: "alerts"
      params:
        cacheRetention: "none"
```

構成のマージ順序:

1. `agents.defaults.models["provider/model"].params`
2. `agents.list[].params` (エージェント ID の一致、キーによるオーバーライド)

### レガシー `cacheControlTtl`

従来の値は引き続き受け入れられ、マッピングされます。

- `5m` -> `short`
- `1h` -> `long`

新しい構成には `cacheRetention` を優先します。

### `contextPruning.mode: "cache-ttl"`

キャッシュ TTL ウィンドウの後に古いツール結果コンテキストを削除し、アイドル後のリクエストがサイズを超えた履歴を再キャッシュしないようにします。

````yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```完全な動作については、[セッション プルーニング](/concepts/session-pruning) を参照してください。

### ハートビートの保温

ハートビートは、キャッシュ ウィンドウを暖かく保ち、アイドル ギャップ後のキャッシュ書き込みの繰り返しを減らすことができます。

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
````

エージェントごとのハートビートは `agents.list[].heartbeat` でサポートされています。

## プロバイダーの動作

### Anthropic (直接 API)

- `cacheRetention` がサポートされています。
- Anthropic API キー認証プロファイルを使用すると、OpenClaw は設定を解除すると Anthropic モデル参照に `cacheRetention: "short"` をシードします。

### アマゾンの岩盤

- Anthropic Claude モデル参照 (`amazon-bedrock/*anthropic.claude*`) は、明示的な `cacheRetention` パススルーをサポートします。
- 非人為的岩盤モデルは実行時に `cacheRetention: "none"` に強制されます。

### OpenRouter 人間モデル

`openrouter/anthropic/*` モデル参照の場合、OpenClaw はシステム/開発者プロンプト ブロックに Anthropic `cache_control` を挿入して、プロンプト キャッシュの再利用を改善します。

### 他のプロバイダー

プロバイダーがこのキャッシュ モードをサポートしていない場合、`cacheRetention` は効果がありません。

## チューニングパターン

### 混合トラフィック (推奨デフォルト)

メイン エージェントで長期間のベースラインを維持し、バースト通知エージェントのキャッシュを無効にします。

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long"
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m"
    - id: "alerts"
      params:
        cacheRetention: "none"
```

### コスト優先のベースライン

- ベースライン `cacheRetention: "short"` を設定します。
- `contextPruning.mode: "cache-ttl"` を有効にします。
- ウォーム キャッシュの恩恵を受けるエージェントに対してのみ、ハートビートを TTL 未満に保ちます。

## キャッシュ診断

OpenClaw は、組み込みエージェントの実行用の専用のキャッシュ トレース診断を公開します。

### `diagnostics.cacheTrace` 構成

````yaml
diagnostics:
  cacheTrace:
    enabled: true
    filePath: "~/.openclaw/logs/cache-trace.jsonl" # optional
    includeMessages: false # default true
    includePrompt: false # default true
    includeSystem: false # default true
```デフォルト:

- `filePath`: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`
- `includeMessages`: `true`
- `includePrompt`: `true`
- `includeSystem`: `true`

### 環境切り替え (1 回限りのデバッグ)

- `OPENCLAW_CACHE_TRACE=1` はキャッシュ トレースを有効にします。
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` は出力パスをオーバーライドします。
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` は、完全なメッセージ ペイロードのキャプチャを切り替えます。
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` は、プロンプト テキストのキャプチャを切り替えます。
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` は、システム プロンプト キャプチャを切り替えます。

### 何を検査するか

- キャッシュ トレース イベントは JSONL であり、`session:loaded`、`prompt:before`、`stream:context`、`session:after` などのステージングされたスナップショットが含まれます。
- ターンごとのキャッシュ トークンの影響は、`cacheRead` および `cacheWrite` を介して通常の使用状況に表示されます (たとえば、`/usage full` およびセッション使用状況の概要)。

## 簡単なトラブルシューティング

- ほとんどのターンで高い `cacheWrite` : 揮発性のシステム プロンプト入力をチェックし、モデル/プロバイダーがキャッシュ設定をサポートしていることを確認します。
- `cacheRetention` による影響なし: モデル キーが `agents.defaults.models["provider/model"]` と一致することを確認します。
- キャッシュ設定を使用した Bedrock Nova/Mistral リクエスト: ランタイム強制は `none` になることが予想されます。

関連ドキュメント:

- [人族](/providers/anthropic)
- [トークンの使用とコスト](/reference/token-use)
- [セッションのプルーニング](/concepts/session-pruning)
- [ゲートウェイ構成リファレンス](/gateway/configuration-reference)
````
