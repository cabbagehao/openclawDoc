---
title: "メモリ"
summary: "OpenClaw メモリの仕組み (ワークスペース ファイル + 自動メモリ フラッシュ)"
read_when:
  - メモリ ファイルのレイアウトとワークフローが必要な場合
  - 自動圧縮前のメモリフラッシュを調整したい
x-i18n:
  source_hash: "a6a67b9bdc3c5a803554e20bd890314842034922b9b190495893334a88d6e0c9"
---

# メモリ

OpenClaw メモリは、**エージェント ワークスペース内のプレーンなマークダウン**です。ファイルは
真実の情報源。モデルはディスクに書き込まれる内容のみを「記憶」します。

メモリ検索ツールは、アクティブ メモリ プラグインによって提供されます (デフォルト:
`memory-core`)。 `plugins.slots.memory = "none"` を使用してメモリ プラグインを無効にします。

## メモリ ファイル (Markdown)

デフォルトのワークスペース レイアウトでは、次の 2 つのメモリ レイヤーが使用されます。

- `memory/YYYY-MM-DD.md`
  - 毎日のログ (追加のみ)。
  - 今日と昨日のセッション開始時に読み取ります。
- `MEMORY.md` (オプション)
  - 厳選された長期記憶。
  - **メインのプライベート セッションでのみロードしてください** (グループ コンテキストでは決してロードしないでください)。

これらのファイルはワークスペース (`agents.defaults.workspace`、デフォルト) に存在します。
`~/.openclaw/workspace`)。完全なレイアウトについては、[エージェント ワークスペース](/concepts/agent-workspace) を参照してください。

## 記憶ツール

OpenClaw は、これらの Markdown ファイル用の 2 つのエージェント向けツールを公開します。

- `memory_search` — インデックス付きスニペットに対するセマンティック リコール。
- `memory_get` — 特定の Markdown ファイル/行範囲のターゲット読み取り。

`memory_get` は **ファイルが存在しない場合に正常に機能を低下させる**ようになりました (例:
最初の書き込み前の今日の日次ログ）。組み込みマネージャーと QMD の両方
バックエンドは `ENOENT` をスローする代わりに `{ text: "", path }` を返すため、エージェントは
「まだ何も記録されていません」を処理し、ラップせずにワークフローを続行します。
try/catch ロジックでのツール呼び出し。

## メモリに書き込むタイミング- 決定、好み、永続的な事実は `MEMORY.md` に送られます

- 日々のメモと実行中のコンテキストは `memory/YYYY-MM-DD.md` に移動します。
- 誰かが「これを覚えておいてください」と言ったら、それを書き留めてください (RAM に保存しないでください)。
- この分野はまだ発展途上です。これは、モデルに記憶を保存することを思い出させるのに役立ちます。それは何をすべきかを知るでしょう。
- 何かを保持したい場合は、**ボットにメモリに書き込むように依頼してください**。

## 自動メモリフラッシュ (圧縮前の ping)

セッションが **自動圧縮に近づくと**、OpenClaw は **サイレント、
エージェント ターン**は、モデルに**前**に耐久性のあるメモリを書き込むよう思い出させます。
コンテキストが圧縮されます。デフォルトのプロンプトでは、モデルが「応答する可能性がある」と明示的に示されています。
ただし、通常は `NO_REPLY` が正しい応答であるため、ユーザーがこのターンを目にすることはありません。

これは `agents.defaults.compaction.memoryFlush` によって制御されます。

```json5
{
  agents: {
    defaults: {
      compaction: {
        reserveTokensFloor: 20000,
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 4000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

詳細:

- **ソフトしきい値**: セッション トークンの推定値を超えたときにフラッシュがトリガーされます
  `contextWindow - reserveTokensFloor - softThresholdTokens`。
- **デフォルトではサイレント**: プロンプトには `NO_REPLY` が含まれるため、何も配信されません。
- **2 つのプロンプト**: ユーザー プロンプトとシステム プロンプトがリマインダーを追加します。
- **圧縮サイクルごとに 1 回のフラッシュ** (`sessions.json` で追跡)。
- **ワークスペースは書き込み可能である必要があります**: セッションがサンドボックスで実行される場合
  `workspaceAccess: "ro"` または `"none"` の場合、フラッシュはスキップされます。

完全な圧縮ライフサイクルについては、次を参照してください。
[セッション管理 + 圧縮](/reference/session-management-compaction)。

## ベクトルメモリ検索OpenClaw は、`MEMORY.md` および `memory/*.md` に対して小さなベクトル インデックスを構築できます

セマンティック クエリでは、表現が異なっていても、関連するメモを見つけることができます。

デフォルト:

- デフォルトで有効になっています。
- メモリ ファイルの変更を監視します (デバウンス)。
- `agents.defaults.memorySearch` でメモリ検索を構成します (トップレベルではありません)
  `memorySearch`)。
- デフォルトでリモート埋め込みを使用します。 `memorySearch.provider` が設定されていない場合、OpenClaw は以下を自動選択します。
  1. `local` `memorySearch.local.modelPath` が構成されており、ファイルが存在する場合。
  2. `openai` OpenAI キーを解決できる場合。
  3. `gemini` Gemini キーを解決できる場合。
  4. Voyage キーを解決できる場合は、`voyage`。
  5. `mistral` ミストラル キーを解決できる場合。
  6. それ以外の場合、メモリ検索は設定されるまで無効のままになります。
- ローカル モードは、node-llama-cpp を使用し、`pnpm approve-builds` が必要な場合があります。
- sqlite-vec (利用可能な場合) を使用して、SQLite 内のベクトル検索を高速化します。
- `memorySearch.provider = "ollama"` はローカル/セルフホストでもサポートされています
  Ollama 埋め込み (`/api/embeddings`) ですが、自動選択されません。リモート埋め込みには、埋め込みプロバイダーの API キーが**必要**なります。オープンクロー
  認証プロファイル、`models.providers.*.apiKey`、または環境からキーを解決します。
  変数。 Codex OAuth はチャット/完了のみをカバーしており、**満たしていません**
  メモリ検索用の埋め込み。 Gemini の場合は、`GEMINI_API_KEY` または
  `models.providers.google.apiKey`。 Voyage の場合は、`VOYAGE_API_KEY` または
  `models.providers.voyage.apiKey`。ミストラルの場合は、`MISTRAL_API_KEY` または
  `models.providers.mistral.apiKey`。 Ollama は通常、実際の API を必要としません
  キー (必要な場合は `OLLAMA_API_KEY=ollama-local` のようなプレースホルダーで十分です)
  ローカルポリシー）。
  カスタムの OpenAI 互換エンドポイントを使用する場合、
  `memorySearch.remote.apiKey` (およびオプションの `memorySearch.remote.headers`) を設定します。

### QMD バックエンド (実験的)

`memory.backend = "qmd"` を設定して、組み込みの SQLite インデクサーを
[QMD](https://github.com/tobi/qmd): を組み合わせたローカル優先検索サイドカー
BM25 + ベクター + 再ランキング。 Markdown は依然として真実の情報源です。 OpenClaw シェル
取得のために QMD に出力します。重要なポイント:

**前提条件**- デフォルトでは無効になっています。構成ごとにオプトインします (`memory.backend = "qmd"`)。

- QMD CLI を個別にインストールします (`bun install -g https://github.com/tobi/qmd` またはグラブ)
  リリース)、`qmd` バイナリがゲートウェイの `PATH` 上にあることを確認します。
- QMD には、拡張機能を使用できる SQLite ビルドが必要です (`brew install sqlite`
  macOS)。
- QMD は Bun + `node-llama-cpp` 経由で完全にローカルで実行され、GGUF を自動ダウンロードします
  最初の使用時に HuggingFace からモデルを取得します (別個の Ollama デーモンは必要ありません)。
- ゲートウェイは、自己完結型の XDG ホームで QMD を実行します。
  `~/.openclaw/agents/<agentId>/qmd/` は `XDG_CONFIG_HOME` を設定し、
  `XDG_CACHE_HOME`。
- OS サポート: Bun + SQLite がインストールされたら、macOS と Linux はすぐに動作します。
  インストールされています。 Windows は WSL2 経由で最もよくサポートされます。

**サイドカーの走行方法**- ゲートウェイは、自己完結型 QMD ホームを以下に書き込みます。
`~/.openclaw/agents/<agentId>/qmd/` (構成 + キャッシュ + SQLite DB)。

- コレクションは `memory.qmd.paths` から `qmd collection add` を介して作成されます
  (およびデフォルトのワークスペース メモリ ファイル)、`qmd update` + `qmd embed` を実行します。
  起動時および構成可能な間隔 (`memory.qmd.update.interval`、
  デフォルトは5m）。
- ゲートウェイは起動時に QMD マネージャーを初期化するようになったため、定期的に更新されます。
  最初の `memory_search` 呼び出しの前でもタイマーは準備されています。
- ブート更新がデフォルトでバックグラウンドで実行されるようになったため、チャットが開始されなくなります
  ブロックされました。 `memory.qmd.update.waitForBootSync = true` を設定して以前の内容を保持します
  ブロック行為。
- 検索は `memory.qmd.searchMode` 経由で実行されます (デフォルトは `qmd search --json` です。
  `vsearch` および `query` をサポートします)。選択したモードがフラグを拒否した場合、
  QMD ビルド、OpenClaw は `qmd query` で再試行します。 QMD が失敗するか、バイナリが
  欠落している場合、OpenClaw は自動的に組み込みの SQLite マネージャーにフォールバックするため、
  記憶ツールは引き続き機能します。
- OpenClaw は現在、QMD 埋め込みバッチサイズ調整を公開していません。バッチの動作は
  QMD 自体によって制御されます。
- **最初の検索が遅い可能性があります**: QMD はローカル GGUF モデルをダウンロードする場合があります (リランカー/クエリ)
  展開)、最初の `qmd query` 実行時。
  - OpenClaw は、QMD の実行時に `XDG_CONFIG_HOME`/`XDG_CACHE_HOME` を自動的に設定します。
  - モデルを手動で事前にダウンロードする場合 (同じインデックスをウォームアップする場合) OpenClawを使用)、エージェントの XDG ディレクトリを使用して 1 回限りのクエリを実行します。

    OpenClaw の QMD 状態は **状態ディレクトリ** (デフォルトは `~/.openclaw`) にあります。
    同じ XDG 変数をエクスポートすることで、`qmd` をまったく同じインデックスでポイントできます。
    OpenClaw は以下を使用します。

    ```bash
    # Pick the same state dir OpenClaw uses
    STATE_DIR="${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"

    export XDG_CONFIG_HOME="$STATE_DIR/agents/main/qmd/xdg-config"
    export XDG_CACHE_HOME="$STATE_DIR/agents/main/qmd/xdg-cache"

    # (Optional) force an index refresh + embeddings
    qmd update
    qmd embed

    # Warm up / trigger first-time model downloads
    qmd query "test" -c memory-root --json >/dev/null 2>&1
    ```

**構成サーフェス (`memory.qmd.*`)**- `command` (デフォルト `qmd`): 実行可能パスをオーバーライドします。

- `searchMode` (デフォルト `search`): どの QMD コマンドを返すかを選択します
  `memory_search` (`search`、`vsearch`、`query`)。
- `includeDefaultMemory` (デフォルト `true`): 自動インデックス `MEMORY.md` + `memory/**/*.md`。
- `paths[]`: 追加のディレクトリ/ファイルを追加します (`path`、オプション `pattern`、オプション
  安定版 `name`)。
- `sessions`: セッション JSONL インデックス作成をオプトインします (`enabled`、`retentionDays`、
  `exportDir`)。
- `update`: 更新頻度とメンテナンスの実行を制御します。
  (`interval`、`debounceMs`、`onBoot`、`waitForBootSync`、`embedInterval`、
  `commandTimeoutMs`、`updateTimeoutMs`、`embedTimeoutMs`)。
- `limits`: クランプ リコール ペイロード (`maxResults`、`maxSnippetChars`、
  `maxInjectedChars`、`timeoutMs`)。
- `scope`: [`session.sendPolicy`](/gateway/configuration#session) と同じスキーマ。
  デフォルトは DM のみ (`deny` すべて、`allow` ダイレクト チャット)。緩めて表面QMDにします
  グループ/チャンネル内のヒット数。
  - `match.keyPrefix` は **正規化** セッション キー (小文字、任意の値) と一致します。
    先頭の `agent:<id>:` が削除されます)。例: `discord:channel:`。
  - `match.rawKeyPrefix` は、**生** セッション キー (小文字) と一致します。
    `agent:<id>:`。例: `agent:main:discord:`。- レガシー: `match.keyPrefix: "agent:..."` は引き続き raw キー プレフィックスとして扱われます。
    ただし、わかりやすくするために `rawKeyPrefix` を使用します。
- `scope` が検索を拒否すると、OpenClaw は派生コードで警告をログに記録します。
  `channel`/`chatType` なので、空の結果はデバッグが簡単です。
- ワークスペース外で取得されたスニペットは次のように表示されます。
  `memory_search` 結果の `qmd/<collection>/<relative-path>`。 `memory_get`
  はそのプレフィックスを理解し、構成された QMD コレクション ルートから読み取ります。
- `memory.qmd.sessions.enabled = true` の場合、OpenClaw はサニタイズされたセッションをエクスポートします
  トランスクリプト (ユーザー/アシスタントのターン) を専用の QMD コレクションに変換します。
  `~/.openclaw/agents/<id>/qmd/sessions/`、つまり `memory_search` は最近のことを思い出すことができます
  組み込みの SQLite インデックスに触れることなく会話を行えます。
- `memory_search` スニペットには、`Source: <path#line>` フッターが含まれるようになりました。
  `memory.citations` は `auto`/`on` です。 `memory.citations = "off"` を保持するように設定します
  内部パス メタデータ (エージェントは引き続きパスを受け取ります)
  `memory_get` ただし、スニペット テキストではフッターとシステム プロンプトが省略されています
  エージェントにそれを引用しないよう警告します)。

**例**

```json5
memory: {
  backend: "qmd",
  citations: "auto",
  qmd: {
    includeDefaultMemory: true,
    update: { interval: "5m", debounceMs: 15000 },
    limits: { maxResults: 6, timeoutMs: 4000 },
    scope: {
      default: "deny",
      rules: [
        { action: "allow", match: { chatType: "direct" } },
        // Normalized session-key prefix (strips `agent:<id>:`).
        { action: "deny", match: { keyPrefix: "discord:channel:" } },
        // Raw session-key prefix (includes `agent:<id>:`).
        { action: "deny", match: { rawKeyPrefix: "agent:main:discord:" } },
      ]
    },
    paths: [
      { name: "docs", path: "~/notes", pattern: "**/*.md" }
    ]
  }
}
```

**引用とフォールバック**- `memory.citations` はバックエンド (`auto`/`on`/`off`) に関係なく適用されます。

- `qmd` が実行されるとき、`status().backend = "qmd"` をタグ付けして、診断でどれがどれであるかを示します。
  エンジンが結果を出しました。 QMD サブプロセスが終了するか、JSON 出力ができない場合
  解析されると、検索マネージャーは警告をログに記録し、組み込みプロバイダーを返します。
  (既存の Markdown 埋め込み) QMD が回復するまで。

### 追加のメモリパス

デフォルトのワークスペース レイアウト外で Markdown ファイルのインデックスを作成する場合は、次のコードを追加します
明示的なパス:

```json5
agents: {
  defaults: {
    memorySearch: {
      extraPaths: ["../team-docs", "/srv/shared-notes/overview.md"]
    }
  }
}
```

注:

- パスは絶対パスまたはワークスペース相対パスにすることができます。
- ディレクトリは `.md` ファイルについて再帰的にスキャンされます。
- Markdown ファイルのみがインデックス付けされます。
- シンボリックリンクは無視されます (ファイルまたはディレクトリ)。

### Gemini エンベディング (ネイティブ)

Gemini 埋め込み API を直接使用するには、プロバイダーを `gemini` に設定します。

```json5
agents: {
  defaults: {
    memorySearch: {
      provider: "gemini",
      model: "gemini-embedding-001",
      remote: {
        apiKey: "YOUR_GEMINI_API_KEY"
      }
    }
  }
}
```

注:

- `remote.baseUrl` はオプションです (デフォルトは Gemini API ベース URL)。
- `remote.headers` を使用すると、必要に応じて追加のヘッダーを追加できます。
- デフォルトのモデル: `gemini-embedding-001`。

**カスタム OpenAI 互換エンドポイント** (OpenRouter、vLLM、またはプロキシ) を使用する場合は、
OpenAI プロバイダーで `remote` 構成を使用できます。

```json5
agents: {
  defaults: {
    memorySearch: {
      provider: "openai",
      model: "text-embedding-3-small",
      remote: {
        baseUrl: "https://api.example.com/v1/",
        apiKey: "YOUR_OPENAI_COMPAT_API_KEY",
        headers: { "X-Custom-Header": "value" }
      }
    }
  }
}
```

API キーを設定したくない場合は、`memorySearch.provider = "local"` を使用するか、
`memorySearch.fallback = "none"`。

フォールバック:- `memorySearch.fallback` は、`openai`、`gemini`、`voyage`、`mistral`、`ollama`、`local`、または`none`。

- フォールバック プロバイダーは、プライマリ埋め込みプロバイダーが失敗した場合にのみ使用されます。

バッチインデックス作成 (OpenAI + Gemini + Voyage):

- デフォルトでは無効になっています。 `agents.defaults.memorySearch.remote.batch.enabled = true` を設定して、大規模コーパスのインデックス作成 (OpenAI、Gemini、および Voyage) を有効にします。
- デフォルトの動作はバッチの完了を待ちます。必要に応じて、`remote.batch.wait`、`remote.batch.pollIntervalMs`、および `remote.batch.timeoutMinutes` を調整します。
- `remote.batch.concurrency` を設定して、並行して送信するバッチ ジョブの数を制御します (デフォルト: 2)。
- バッチ モードは、`memorySearch.provider = "openai"` または `"gemini"` の場合に適用され、対応する API キーを使用します。
- Gemini バッチ ジョブは非同期埋め込みバッチ エンドポイントを使用し、Gemini バッチ API の可用性を必要とします。

OpenAI バッチが高速かつ安価な理由:

- 大規模なバックフィルの場合、OpenAI は、単一のバッチ ジョブで多くの埋め込みリクエストを送信し、OpenAI に非同期で処理させることができるため、通常、サポートされている最速のオプションです。
- OpenAI は Batch API ワークロードの割引価格を提供しているため、大規模なインデックス作成の実行は通常、同じリクエストを同期的に送信するよりも安価です。
- 詳細については、OpenAI Batch API のドキュメントと価格を参照してください。
  - [https://platform.openai.com/docs/api-reference/batch](https://platform.openai.com/docs/api-reference/batch)
  - [https://platform.openai.com/pricing](https://platform.openai.com/pricing)

設定例:

````json5
agents: {
  defaults: {
    memorySearch: {
      provider: "openai",
      model: "text-embedding-3-small",
      fallback: "openai",
      remote: {
        batch: { enabled: true, concurrency: 2 }
      },
      sync: { watch: true }
    }
  }
}
```ツール:

- `memory_search` — ファイル + 行範囲のスニペットを返します。
- `memory_get` — パスごとにメモリ ファイルの内容を読み取ります。

ローカルモード:

- `agents.defaults.memorySearch.provider = "local"` を設定します。
- `agents.defaults.memorySearch.local.modelPath` (GGUF または `hf:` URI) を提供します。
- オプション: `agents.defaults.memorySearch.fallback = "none"` を設定して、リモート フォールバックを回避します。

### 記憶ツールの仕組み

- `memory_search` は、`MEMORY.md` + `memory/**/*.md` からマークダウン チャンク (~400 トークン ターゲット、80 トークン オーバーラップ) を意味的に検索します。スニペット テキスト (最大 700 文字)、ファイル パス、行範囲、スコア、プロバイダー/モデル、およびローカルからリモートへの埋め込みからフォールバックしたかどうかを返します。完全なファイル ペイロードは返されません。
- `memory_get` は、特定のメモリ マークダウン ファイル (ワークスペース相対) を、オプションで開始行から N 行分読み取ります。 `MEMORY.md` / `memory/` の外側のパスは拒否されます。
- 両方のツールは、`memorySearch.enabled` がエージェントに対して true を解決した場合にのみ有効になります。

### 何がインデックスに登録されるか (いつ)- ファイルの種類: マークダウンのみ (`MEMORY.md`、`memory/**/*.md`)。
- インデックス ストレージ: `~/.openclaw/memory/<agentId>.sqlite` のエージェントごとの SQLite (`agents.defaults.memorySearch.store.path` 経由で構成可能、`{agentId}` トークンをサポート)。
- 鮮度: `MEMORY.md` + `memory/` のウォッチャーはインデックスをダーティとしてマークします (デバウンス 1.5 秒)。同期はセッション開始時、検索時、または一定間隔でスケジュールされ、非同期に実行されます。セッションのトランスクリプトはデルタしきい値を使用してバックグラウンド同期をトリガーします。
- トリガーの再インデックス: インデックスには、埋め込み **プロバイダー/モデル + エンドポイント フィンガープリント + チャンク パラメータ ** が保存されます。これらのいずれかが変更されると、OpenClaw は自動的にストア全体をリセットし、インデックスを再作成します。

### ハイブリッド検索 (BM25 + ベクトル)

有効にすると、OpenClaw は以下を組み合わせます。

- **ベクトルの類似性** (意味的な一致、表現は異なる場合があります)
- **BM25 キーワードの関連性** (ID、環境変数、コード シンボルなどの正確なトークン)

プラットフォームで全文検索が利用できない場合、OpenClaw はベクターのみの検索に戻ります。

#### なぜハイブリッドなのか?

ベクトル検索は、「これは同じことを意味する」という点で優れています。

- 「Mac Studio ゲートウェイ ホスト」と「ゲートウェイを実行しているマシン」
- 「ファイル更新のデバウンス」と「書き込みのたびにインデックス作成を回避」

ただし、正確な高信号トークンには弱い場合があります。

- ID (`a828e60`、`b3b9895a…`)
- コードシンボル (`memorySearch.query.hybrid`)
- エラー文字列 (「sqlite-vec が利用できません」)BM25 (フルテキスト) はその逆で、正確なトークンには強く、言い換えには弱いです。
ハイブリッド検索は実用的な中間点です。**両方の検索シグナルを使用**することで、
「自然言語」クエリと「干し草の山の針」クエリの両方で良い結果が得られます。

#### 結果 (現在のデザイン) をマージする方法

実装スケッチ:

1. 両側から候補者プールを取得します。

- **ベクトル**: コサイン類似度による上位 `maxResults * candidateMultiplier`。
- **BM25**: FTS5 BM25 ランクによるトップ `maxResults * candidateMultiplier` (低いほど優れています)。

2. BM25 ランクを 0..1 っぽいスコアに変換します。

- `textScore = 1 / (1 + max(0, bm25Rank))`

3. チャンク ID によって候補を結合し、加重スコアを計算します。

- `finalScore = vectorWeight * vectorScore + textWeight * textScore`

注:

- `vectorWeight` + `textWeight` は構成解像度で 1.0 に正規化されるため、重みはパーセンテージとして動作します。
- 埋め込みが利用できない場合 (またはプロバイダーがゼロベクトルを返した場合)、引き続き BM25 を実行し、キーワードの一致を返します。
- FTS5 を作成できない場合は、ベクトルのみの検索を維持します (ハード障害なし)。

これは「完璧な IR 理論」ではありませんが、シンプルで高速であり、実際のノートの再現率と精度が向上する傾向があります。
後でさらに詳しく説明したい場合、一般的な次のステップは相互ランク融合 (RRF) またはスコア正規化です。
(最小/最大または Z スコア) を混合する前に。

#### 後処理パイプライン

ベクトルとキーワードのスコアを結合した後、オプションの 2 つの後処理ステージ
結果リストがエージェントに届く前に調整します。

````

Vector + Keyword → Weighted Merge → Temporal Decay → Sort → MMR → Top-K Results

```どちらのステージも **デフォルトではオフ**であり、個別に有効にすることができます。

#### MMR 再ランキング (多様性)

ハイブリッド検索が結果を返す場合、複数のチャンクに類似または重複するコンテンツが含まれる場合があります。
たとえば、「ホーム ネットワーク セットアップ」を検索すると、ほぼ同一のスニペットが 5 つ返される可能性があります。
さまざまな毎日のメモから、すべて同じルーター構成について言及しています。

**MMR (Maximal Marginal Relevance)** は、多様性と関連性のバランスを取るために結果を再ランク付けします。
同じ情報を繰り返すのではなく、上位の結果がクエリのさまざまな側面をカバーしていることを確認します。

仕組み:

1. 結果は、元の関連性 (ベクトル + BM25 加重スコア) によってスコア付けされます。
2. MMR は、`λ × relevance − (1−λ) × max_similarity_to_selected` を最大化する結果を繰り返し選択します。
3. 結果間の類似性は、トークン化されたコンテンツの Jaccard テキストの類似性を使用して測定されます。

`lambda` パラメーターはトレードオフを制御します。

- `lambda = 1.0` → 純粋な関連性 (多様性ペナルティなし)
- `lambda = 0.0` → 最大の多様性 (関連性を無視)
- デフォルト: `0.7` (バランスの取れた、わずかな関連性バイアス)

**例 — クエリ:「ホーム ネットワーク セットアップ」**

これらのメモリ ファイルがあるとします。

```

memory/2026-02-10.md → "Configured Omada router, set VLAN 10 for IoT devices"
memory/2026-02-08.md → "Configured Omada router, moved IoT to VLAN 10"
memory/2026-02-05.md → "Set up AdGuard DNS on 192.168.10.2"
memory/network.md → "Router: Omada ER605, AdGuard: 192.168.10.2, VLAN 10: IoT"

```

MMR なし — 上位 3 つの結果:

```

1. memory/2026-02-10.md (score: 0.92) ← router + VLAN
2. memory/2026-02-08.md (score: 0.89) ← router + VLAN (near-duplicate!)
3. memory/network.md (score: 0.85) ← reference doc

```

MMR (λ=0.7) の場合 — 上位 3 つの結果:

```

1. memory/2026-02-10.md (score: 0.92) ← router + VLAN
2. memory/network.md (score: 0.85) ← reference doc (diverse!)
3. memory/2026-02-05.md (score: 0.78) ← AdGuard DNS (diverse!)

```

2 月 8 日のほぼ重複した情報が削除され、エージェントは 3 つの異なる情報を取得します。**有効にする場合:** `memory_search` が冗長または重複に近いスニペットを返していることに気付いた場合は、
特に毎日のメモでは、同じような情報が数日にわたって繰り返されることがよくあります。

#### 時間的減衰 (最新性ブースト)

毎日のメモを持つエージェントは、時間の経過とともに何百もの日付の付いたファイルを蓄積します。腐敗することなく、
半年前のよく書かれたメモは、同じトピックに関する昨日の更新よりも上位に表示される可能性があります。

**時間的減衰** は、各結果の経過時間に基づいてスコアに指数乗数を適用します。
したがって、最近の記憶は自然に上位にランクされ、古い記憶は薄れていきます。

```

decayedScore = score × e^(-λ × ageInDays)

```

ここで、`λ = ln(2) / halfLifeDays`。

デフォルトの半減期は 30 日です。

- 今日のメモ: 元のスコアの **100%**
- 7 日前: **~84%**
- 30 日前: **50%**
- 90 日前: **12.5%**
- 180 日前: **~1.6%**

**エバーグリーン ファイルは決して朽ちることはありません:**

- `MEMORY.md` (ルート メモリ ファイル)
- `memory/` 内の日付のないファイル (例: `memory/projects.md`、`memory/network.md`)
- これらには、常に正常にランク付けされる永続的な参照情報が含まれています。

**日付付き日次ファイル** (`memory/YYYY-MM-DD.md`) は、ファイル名から抽出された日付を使用します。
他のソース (セッショントランスクリプトなど) は、ファイル変更時 (`mtime`) にフォールバックします。

**例 — クエリ: 「ロッドの仕事のスケジュールは何ですか?」**

これらのメモリ ファイルがあるとします (今日は 2 月 10 日です):

```

memory/2025-09-15.md → "Rod works Mon-Fri, standup at 10am, pairing at 2pm" (148 days old)
memory/2026-02-10.md → "Rod has standup at 14:15, 1:1 with Zeb at 14:45" (today)
memory/2026-02-03.md → "Rod started new team, standup moved to 14:15" (7 days old)

```

腐敗なし:

```

1. memory/2025-09-15.md (score: 0.91) ← best semantic match, but stale!
2. memory/2026-02-10.md (score: 0.82)
3. memory/2026-02-03.md (score: 0.80)

```

減衰あり (halfLife=30):

```

1. memory/2026-02-10.md (score: 0.82 × 1.00 = 0.82) ← today, no decay
2. memory/2026-02-03.md (score: 0.80 × 0.85 = 0.68) ← 7 days, mild decay
3. memory/2025-09-15.md (score: 0.91 × 0.03 = 0.03) ← 148 days, nearly gone

````古くなった 9 月のメモは、生の意味論の一致が最も優れているにもかかわらず、最下位に落ちています。

**有効にする場合:** エージェントに数か月分の毎日のメモがあり、それが古いと感じた場合は、
古い情報は最近のコンテキストよりも優先されます。半減期は 30 日なので、
毎日のメモが多いワークフロー。古いメモを頻繁に参照する場合は、この期間を増やしてください (例: 90 日)。

#### 構成

どちらの機能も `memorySearch.query.hybrid` で構成されます。

```json5
agents: {
  defaults: {
    memorySearch: {
      query: {
        hybrid: {
          enabled: true,
          vectorWeight: 0.7,
          textWeight: 0.3,
          candidateMultiplier: 4,
          // Diversity: reduce redundant results
          mmr: {
            enabled: true,    // default: false
            lambda: 0.7       // 0 = max diversity, 1 = max relevance
          },
          // Recency: boost newer memories
          temporalDecay: {
            enabled: true,    // default: false
            halfLifeDays: 30  // score halves every 30 days
          }
        }
      }
    }
  }
}
````

どちらの機能も個別に有効にすることができます。

- **MMR のみ** — 類似したメモが多数あるが、年齢は関係ない場合に便利です。
- **時間的減衰のみ** — 最新性が重要であるが、結果がすでに多様である場合に役立ちます。
- **両方** — 大量の長期にわたる毎日のメモ履歴を持つエージェントに推奨されます。

### 埋め込みキャッシュ

OpenClaw は SQLite の **チャンク埋め込み**をキャッシュできるため、インデックスの再作成や頻繁な更新 (特にセッション トランスクリプト) によって変更されていないテキストが再埋め込まれることがありません。

構成:

```json5
agents: {
  defaults: {
    memorySearch: {
      cache: {
        enabled: true,
        maxEntries: 50000
      }
    }
  }
}
```

### セッションメモリ検索 (実験的)

必要に応じて、**セッション記録**のインデックスを作成し、`memory_search` を介して表示することができます。
これは実験的な旗の後ろでゲートされています。

```json5
agents: {
  defaults: {
    memorySearch: {
      experimental: { sessionMemory: true },
      sources: ["memory", "sessions"]
    }
  }
}
```

注:- セッションのインデックス作成は **オプトイン** (デフォルトではオフ) です。

- セッション更新は、デルタしきい値を超えるとデバウンスされ、**非同期にインデックス付け**されます (ベストエフォート)。
- `memory_search` はインデックス作成時にブロックしません。バックグラウンド同期が完了するまで、結果は若干古い可能性があります。
- 結果には引き続きスニペットのみが含まれます。 `memory_get` はメモリ ファイルに限定されたままです。
- セッションのインデックス作成はエージェントごとに分離されます (そのエージェントのセッション ログのみがインデックス付けされます)。
- セッション ログはディスク上に保存されます (`~/.openclaw/agents/<agentId>/sessions/*.jsonl`)。ファイルシステムにアクセスできるすべてのプロセス/ユーザーはそれらを読み取ることができるため、ディスク アクセスを信頼境界として扱います。より厳密に分離するには、別の OS ユーザーまたはホストでエージェントを実行します。

デルタしきい値 (デフォルトを表示):

```json5
agents: {
  defaults: {
    memorySearch: {
      sync: {
        sessions: {
          deltaBytes: 100000,   // ~100 KB
          deltaMessages: 50     // JSONL lines
        }
      }
    }
  }
}
```

### SQLite ベクトル アクセラレーション (sqlite-vec)

sqlite-vec 拡張機能が利用可能な場合、OpenClaw は埋め込みを
SQLite 仮想テーブル (`vec0`) でベクトル距離クエリを実行します。
データベース。これにより、すべての埋め込みを JS にロードすることなく、高速な検索が維持されます。

構成 (オプション):

```json5
agents: {
  defaults: {
    memorySearch: {
      store: {
        vector: {
          enabled: true,
          extensionPath: "/path/to/sqlite-vec"
        }
      }
    }
  }
}
```

注:- `enabled` のデフォルトは true です。無効にすると、検索はインプロセスに戻ります
保存された埋め込みに対するコサイン類似度。

- sqlite-vec 拡張機能が見つからない場合、またはロードに失敗した場合、OpenClaw は
  エラーが発生し、JS フォールバック (ベクトル テーブルなし) が続行されます。
- `extensionPath` は、バンドルされた sqlite-vec パスをオーバーライドします (カスタム ビルドに役立ちます)
  または標準以外のインストール場所）。

### ローカル埋め込みの自動ダウンロード

- デフォルトのローカル埋め込みモデル: `hf:ggml-org/embeddinggemma-300m-qat-q8_0-GGUF/embeddinggemma-300m-qat-Q8_0.gguf` (~0.6 GB)。
- `memorySearch.provider = "local"`、`node-llama-cpp` が `modelPath` を解決する場合。 GGUF が見つからない場合は、キャッシュ (または設定されている場合は `local.modelCacheDir`) に ​​\*自動ダウンロード\*\*してからロードします。再試行するとダウンロードが再開されます。
- ネイティブ ビルド要件: `pnpm approve-builds` を実行し、`node-llama-cpp`、次に `pnpm rebuild node-llama-cpp` を選択します。
- フォールバック: ローカルのセットアップが失敗して `memorySearch.fallback = "openai"` になった場合、自動的にリモートの埋め込み (オーバーライドされない限り `openai/text-embedding-3-small`) に切り替え、その理由を記録します。

### カスタム OpenAI 互換エンドポイントの例

```json5
agents: {
  defaults: {
    memorySearch: {
      provider: "openai",
      model: "text-embedding-3-small",
      remote: {
        baseUrl: "https://api.example.com/v1/",
        apiKey: "YOUR_REMOTE_API_KEY",
        headers: {
          "X-Organization": "org-id",
          "X-Project": "project-id"
        }
      }
    }
  }
}
```

注:

- `remote.*` は `models.providers.openai.*` よりも優先されます。
- `remote.headers` OpenAI ヘッダーとマージします。キーの競合ではリモートが勝ちます。 OpenAI のデフォルトを使用するには、`remote.headers` を省略します。
