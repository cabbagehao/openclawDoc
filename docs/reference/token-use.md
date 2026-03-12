---
summary: "OpenClaw がプロンプト コンテキストを構築し、トークンの使用量とコストをレポートする方法"
read_when:
  - トークンの使用法、コスト、またはコンテキスト ウィンドウの説明
  - コンテキストの拡張または圧縮動作のデバッグ
title: "トークンの使用とコスト"
x-i18n:
  source_hash: "03dc3253c74c9233be25b2947d2aafcca45119b8f2902c19080c4b808b40de8f"
---
OpenClaw は文字ではなく **トークン** を追跡します。トークンはモデル固有ですが、ほとんどのトークンはモデルに固有です。
OpenAI スタイルのモデルでは、英語テキストの場合、トークンあたり平均約 4 文字です。

## システムプロンプトの構築方法

OpenClaw は実行のたびに独自のシステム プロンプトを組み立てます。これには次のものが含まれます。

- ツールリスト + 簡単な説明
- スキル リスト (メタデータのみ。命令は `read` を使用してオンデマンドでロードされます)
- 自己更新の手順
- ワークスペース + ブートストラップ ファイル (新規の場合は `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md` `MEMORY.md` および/または `memory.md` (存在する場合)。大きなファイルは `agents.defaults.bootstrapMaxChars` (デフォルト: 20000) によって切り捨てられ、ブートストラップ注入の合計は `agents.defaults.bootstrapTotalMaxChars` (デフォルト: 150000) によって制限されます。 `memory/*.md` ファイルはメモリ ツール経由でオンデマンドであり、自動挿入されません。
- 時間 (UTC + ユーザーのタイムゾーン)
- 返信タグ + ハートビート動作
- 実行時メタデータ (ホスト/OS/モデル/思考)

詳細については、[システム プロンプト](/concepts/system-prompt) を参照してください。

## コンテキスト ウィンドウで重要なこと

モデルが受け取るものはすべてコンテキスト制限にカウントされます。- システム プロンプト (上記のすべてのセクション)

- 会話履歴 (ユーザー + アシスタントのメッセージ)
- ツール呼び出しとツール結果
- 添付ファイル/トランスクリプト（画像、音声、ファイル）
- 圧縮の概要とアーティファクトのプルーニング
- プロバイダー ラッパーまたはセーフティ ヘッダー (表示されませんが、カウントされます)

画像の場合、OpenClaw はプロバイダーを呼び出す前にトランスクリプト/ツール画像ペイロードをダウンスケールします。
これを調整するには、`agents.defaults.imageMaxDimensionPx` (デフォルト: `1200`) を使用します。

- 値を低くすると、通常、ビジョン トークンの使用量とペイロード サイズが減少します。
- 値を大きくすると、OCR/UI を多用するスクリーンショットの視覚的な詳細がより多く保持されます。

実際の内訳 (挿入されたファイル、ツール、スキル、システム プロンプト サイズごと) については、`/context list` または `/context detail` を使用してください。 [コンテキスト](/concepts/context) を参照してください。

## 現在のトークンの使用状況を確認する方法

チャットでこれらを使用します。

- `/status` → **絵文字が豊富なステータス カード** (セッション モデル、コンテキストの使用法、
  最後の応答の入力/出力トークン、および **推定コスト** (API キーのみ)。
- `/usage off|tokens|full` → **応答ごとの使用法フッター**をすべての応答に追加します。
  - セッションごとに保持されます (`responseUsage` として保存されます)。
  - OAuth 認証は **コストを非表示** (トークンのみ)。
- `/usage cost` → OpenClaw セッション ログからのローカル コストの概要を示します。

その他の表面:- **TUI/Web TUI:** `/status` + `/usage` がサポートされています。

- **CLI:** `openclaw status --usage` および `openclaw channels list` の表示
  プロバイダーのクォータ ウィンドウ (応答ごとのコストではありません)。

## コストの見積もり (表示されている場合)

コストは、モデルの価格構成から推定されます。

```
models.providers.<provider>.models[].cost
```

これらは、`input`、`output`、`cacheRead`、および
`cacheWrite`。価格設定が欠落している場合、OpenClaw はトークンのみを表示します。 OAuthトークン
決してドルコストを表示しないでください。

## キャッシュ TTL とプルーニングの影響

プロバイダー プロンプト キャッシュは、キャッシュ TTL ウィンドウ内でのみ適用されます。オープンクロー缶
オプションで **cache-ttl プルーニング** を実行します。キャッシュ TTL が経過するとセッションをプルーニングします。
有効期限が切れると、後続のリクエストでキャッシュ ウィンドウを再利用できるようにキャッシュ ウィンドウがリセットされます。
完全な履歴を再キャッシュするのではなく、新たにキャッシュされたコンテキスト。これによりキャッシュが保持されます
セッションが TTL を超えてアイドル状態になると、書き込みコストが低くなります。

[ゲートウェイ構成](/gateway/configuration) で構成し、
動作の詳細については、[セッションのプルーニング](/concepts/session-pruning) を参照してください。

ハートビートは、アイドル状態のギャップ全体でキャッシュを**ウォーム**に保つことができます。モデルが TTL をキャッシュしている場合
は `1h` です。ハートビート間隔をそのすぐ下に設定すると (例: `55m`)、回避できます。
プロンプト全体を再キャッシュして、キャッシュ書き込みコストを削減します。

マルチエージェント設定では、1 つの共有モデル構成を保持し、キャッシュ動作を調整できます。
`agents.list[].params.cacheRetention` のエージェントごと。ノブごとの完全なガイドについては、[プロンプト キャッシュ](/reference/prompt-caching) を参照してください。

Anthropic API の価格設定では、キャッシュ読み取りは入力よりも大幅に安価です
トークンに対して、キャッシュ書き込みにはより高い乗数で請求されます。 Anthropic を参照
最新のレートと TTL 乗数に応じたプロンプト キャッシュの価格設定:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### 例: ハートビートで 1 時間のキャッシュを保温します

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long"
    heartbeat:
      every: "55m"
```

### 例: エージェントごとのキャッシュ戦略を使用した混合トラフィック

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long" # default baseline for most agents
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # keep long cache warm for deep sessions
    - id: "alerts"
      params:
        cacheRetention: "none" # avoid cache writes for bursty notifications
```

`agents.list[].params` は、選択したモデルの `params` の上にマージされるので、
`cacheRetention` のみをオーバーライドし、他のモデルのデフォルトを変更せずに継承します。

### 例: Anthropic 1M コンテキスト ベータ ヘッダーを有効にする

Anthropic の 1M コンテキスト ウィンドウは現在ベータ版です。 OpenClaw は、
サポートされている Opus で `context1m` を有効にする場合に必要な `anthropic-beta` 値
またはソネットモデル。

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          context1m: true
```

これは、Anthropic の `context-1m-2025-08-07` ベータ ヘッダーにマップされます。

これは、そのモデル エントリに `context1m: true` が設定されている場合にのみ適用されます。

要件: 認証情報はロングコンテキストの使用に適格である必要があります (API キー
請求、または追加使用量が有効になっているサブスクリプション）。そうでない場合、Anthropic は応答します
`HTTP 429: rate_limit_error: Extra usage is required for long context requests` と。OAuth/サブスクリプション トークン (`sk-ant-oat-*`) を使用して Anthropic を認証する場合、
OpenClaw は、現在 Anthropic であるため、`context-1m-*` ベータ ヘッダーをスキップします。
HTTP 401 との組み合わせを拒否します。

## トークンのプレッシャーを軽減するためのヒント

- `/compact` を使用して、長いセッションを要約します。
- ワークフロー内の大きなツール出力をトリミングします。
- スクリーンショットを大量に使用するセッションの場合は、`agents.defaults.imageMaxDimensionPx` を低くします。
- スキルの説明は短くしてください (スキル リストがプロンプトに挿入されます)。
- 冗長で探索的な作業には、より小さいモデルを優先します。

正確なスキル リストのオーバーヘッドの計算式については、[スキル](/tools/skills) を参照してください。
