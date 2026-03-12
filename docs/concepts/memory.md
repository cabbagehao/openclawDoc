---
title: "記憶 (Memory)"
seoTitle: "OpenClawのセマンティック記憶の仕組みと検索運用ガイド"
summary: "OpenClaw における記憶の仕組み (ワークスペース内のファイル管理と自動フラッシュ機能)"
read_when:
description: "OpenClaw の記憶は、エージェントのワークスペース内にあるプレーンな Markdown ファイル です。ファイルが「真実のソース」であり、モデルはディスクに書き込まれた内容のみを「記憶」として保持し続けます。"
x-i18n:
  source_hash: "a6a67b9bdc3c5a803554e20bd890314842034922b9b190495893334a88d6e0c9"
---
OpenClaw の記憶は、**エージェントのワークスペース内にあるプレーンな Markdown ファイル** です。ファイルが「真実のソース」であり、モデルはディスクに書き込まれた内容のみを「記憶」として保持し続けます。

記憶検索ツールは、有効な記憶プラグイン（デフォルトは `memory-core`）によって提供されます。記憶機能を無効にする場合は、構成で `plugins.slots.memory = "none"` を設定してください。

## 記憶ファイル (Markdown)

デフォルトのワークスペース構成では、2 つの記憶レイヤーを使用します:

- `memory/YYYY-MM-DD.md`
  - 日ごとのログ (追記専用)。
  - セッション開始時に「今日」と「昨日」のファイルが読み込まれます。
- `MEMORY.md` (オプション)
  - 整理された長期記憶。
  - **プライベートなメインセッションでのみロードされます**（グループチャットなどの共有コンテキストではロードされません）。

これらのファイルはワークスペース (`agents.defaults.workspace`、デフォルトは `~/.openclaw/workspace`) 配下に保存されます。詳細は [エージェントワークスペース](/concepts/agent-workspace) を参照してください。

## 記憶ツール

エージェント（モデル）向けに、以下の 2 つのツールが公開されています:

- `memory_search`: インデックス化されたスニペットに対するセマンティック検索（意味ベースの検索）。
- `memory_get`: 特定の Markdown ファイルの指定した行範囲を直接読み取り。

`memory_get` は、**ファイルが存在しない場合でもエラーにならず適切に処理を継続** します（例：その日の最初の書き込みが行われる前の日次ログ）。組み込みのマネージャーおよび QMD バックエンドは、エラーを投げる代わりに `{ text: "", path }` を返すため、エージェントは「まだ何も記録されていない」ことを理解して処理を進めることができます。

## いつ記憶に書き込むべきか

- 決定事項、好み、不変の事実などは `MEMORY.md` へ。
- 日々のメモや進行中の文脈などは `memory/YYYY-MM-DD.md` へ。
- ユーザーが「これを覚えておいて」と言った内容は、RAM（メモリ上の一時記憶）に留めず、即座にファイルに書き留めてください。
- この分野はまだ進化の途上です。モデルに対して「記憶に保存して」と促すことで、モデルは適切に書き込み先を判断します。
- 重要な情報を確実に定着させたい場合は、**ボットに記憶へ書き込むよう明示的に依頼** してください。

## 自動メモリフラッシュ (圧縮前の確認)

セッションが **自動圧縮（コンパクション）のタイミングに近づくと**、OpenClaw はコンテキストが要約される **前に**、重要な情報を永続的な記憶として保存するようモデルに促す **サイレントな実行ターン** をトリガーします。デフォルトのプロンプトではモデルが返信を行う可能性がある旨が記載されていますが、通常は `NO_REPLY` が返されるため、ユーザーがこのターンを目にすることはありません。

この動作は `agents.defaults.compaction.memoryFlush` で制御されます:

```json5
{
  agents: {
    defaults: {
      compaction: {
        reserveTokensFloor: 20000,
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 4000,
          systemPrompt: "セッションが圧縮（コンパクション）に近づいています。永続化すべき記憶を今すぐ保存してください。",
          prompt: "重要なメモを memory/YYYY-MM-DD.md に書き込んでください。保存すべき内容がなければ NO_REPLY と返してください。",
        },
      },
    },
  },
}
```

補足:
- **Soft threshold**: セッションの推定トークン数が `contextWindow - reserveTokensFloor - softThresholdTokens` を超えたときにフラッシュが発動します。
- **サイレント動作**: デフォルトのプロンプトに `NO_REPLY` に関する指示が含まれているため、ユーザーにメッセージは届きません。
- **2 つのプロンプト**: ユーザープロンプトとシステムプロンプトの両方でリマインダーが追加されます。
- **1 圧縮サイクルにつき 1 回**: このフラッシュ処理は `sessions.json` で追跡されます。
- **書き込み権限が必要**: セッションがサンドボックス内で動作し、`workspaceAccess` が `"ro"` (読み取り専用) または `"none"` の場合、フラッシュ処理はスキップされます。

圧縮のライフサイクル全体の詳細は、[セッション管理と圧縮](/reference/session-management-compaction) を参照してください。

## ベクトル記憶検索

OpenClaw は `MEMORY.md` および `memory/*.md` に対して軽量なベクトルインデックスを構築できます。これにより、言葉の表現が異なっていても意味の近いメモを検索で見つけることが可能になります。

デフォルト設定:
- デフォルトで有効。
- 記憶ファイルの変更を監視（デバウンス処理あり）。
- `agents.defaults.memorySearch` で設定します（トップレベルの `memorySearch` ではありません）。
- デフォルトでリモートの埋め込み（Embeddings）を使用します。`memorySearch.provider` が未設定の場合、OpenClaw は以下の順序で自動選択します:
  1. `local`: `memorySearch.local.modelPath` が設定され、ファイルが存在する場合。
  2. `openai`: OpenAI のキーが解決できる場合。
  3. `gemini`: Gemini のキーが解決できる場合。
  4. `voyage`: Voyage のキーが解決できる場合。
  5. `mistral`: Mistral のキーが解決できる場合。
  6. それ以外の場合は、設定が行われるまで記憶検索は無効化されます。
- ローカルモードは `node-llama-cpp` を使用し、環境によっては `pnpm approve-builds` が必要です。
- `sqlite-vec` (利用可能な場合) を使用して、SQLite 内でのベクトル検索を高速化します。
- `memorySearch.provider = "ollama"` による自前ホストの Ollama 埋め込み (`/api/embeddings`) もサポートしていますが、自動選択の対象外です。

リモート埋め込みを使用するには、プロバイダーの API キーが **必須** です。OpenClaw は、認証プロファイル、`models.providers.*.apiKey`、または環境変数からキーを取得します。注意点として、Codex の OAuth 認証はチャット/完了用であり、記憶検索用の埋め込みには **対応していません**。Gemini の場合は `GEMINI_API_KEY` または `models.providers.google.apiKey` を、Voyage は `VOYAGE_API_KEY` を、Mistral は `MISTRAL_API_KEY` を使用してください。Ollama は通常、実際のキーは不要です（ローカルポリシーで必要な場合は `OLLAMA_API_KEY=ollama-local` などのダミー値で十分です）。
独自の OpenAI 互換エンドポイントを使用する場合は、`memorySearch.remote.apiKey`（およびオプションで `memorySearch.remote.headers`）を設定してください。

### QMD バックエンド (実験的)

`memory.backend = "qmd"` を設定することで、組み込みの SQLite インデクサーから [QMD](https://github.com/tobi/qmd) に切り替えることができます。QMD は BM25、ベクトル検索、および再ランク付け（reranking）を組み合わせたローカル優先の検索エンジンです。Markdown ファイルが引き続き「真実のソース」であり、OpenClaw は情報の取得を QMD に委託します。

**前提条件:**
- デフォルトでは無効。構成で `memory.backend = "qmd"` を指定して有効化します。
- QMD CLI を別途インストールし（`bun install -g https://github.com/tobi/qmd` など）、`qmd` バイナリにゲートウェイの `PATH` が通っている必要があります。
- QMD には、拡張機能を許可した SQLite ビルド（macOS なら `brew install sqlite`）が必要です。
- QMD は Bun と `node-llama-cpp` を介して完全にローカルで動作し、初回使用時に HuggingFace から GGUF モデルを自動ダウンロードします（別途 Ollama デーモンを起動する必要はありません）。
- ゲートウェイは、`XDG_CONFIG_HOME` と `XDG_CACHE_HOME` を設定することで、`~/.openclaw/agents/<agentId>/qmd/` 配下の独立した XDG ホーム環境で QMD を実行します。
- OS 対応: macOS と Linux では Bun と SQLite があればそのまま動作します。Windows は WSL2 経由での利用を推奨します。

**動作の仕組み:**
- ゲートウェイは `~/.openclaw/agents/<agentId>/qmd/` 配下に QMD の設定・キャッシュ・DB を作成します。
- `memory.qmd.paths`（およびデフォルトのワークスペース記憶ファイル）からコレクションが作成され、起動時および設定された間隔（`memory.qmd.update.interval`、デフォルト 5 分）で `qmd update` と `qmd embed` が実行されます。
- ゲートウェイは起動時に QMD マネージャーを初期化するため、最初の検索が行われる前から定期更新タイマーが作動します。
- 起動時の同期処理はデフォルトでバックグラウンドで実行されるため、チャットの開始が待たされることはありません。以前のように同期完了を待ちたい場合は `memory.qmd.update.waitForBootSync = true` を設定してください。
- 検索は `memory.qmd.searchMode`（デフォルトは `search`。`vsearch` や `query` も指定可能）に従って実行されます。QMD が失敗したりバイナリが見つからない場合は、自動的に組み込みの SQLite マネージャーへフォールバックします。
- QMD の埋め込みバッチサイズ設定は、現在は OpenClaw からは露出されておらず、QMD 自身の制御に委ねられています。
- **初回検索は時間がかかる場合があります**: QMD は最初の `qmd query` 実行時にローカルの GGUF モデル（リランカーなど）をダウンロードすることがあるためです。
  - モデルを事前に手動でダウンロードしておきたい場合は、エージェントの XDG ディレクトリ環境変数をエクスポートした状態で一度クエリを実行してください。

    ```bash
    STATE_DIR="${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"
    export XDG_CONFIG_HOME="$STATE_DIR/agents/main/qmd/xdg-config"
    export XDG_CACHE_HOME="$STATE_DIR/agents/main/qmd/xdg-cache"
    qmd update
    qmd embed
    qmd query "テスト" -c memory-root --json >/dev/null 2>&1
    ```

**構成設定 (`memory.qmd.*`):**
- `command` (デフォルト `qmd`): バイナリのパス。
- `searchMode`: 検索に使用するサブコマンド。
- `includeDefaultMemory`: ワークスペースの標準ファイルを自動インデックスするかどうか。
- `paths[]`: 追加のディレクトリやファイル (`path`, `pattern`, 固有の `name`)。
- `sessions`: 会話履歴（JSONL）のインデックス化設定。
- `update`: 更新の頻度やタイムアウト設定。
- `limits`: 検索結果の件数や文字数制限。
- `scope`: [`session.sendPolicy`](/gateway/configuration#session) と同じスキーマで、どのセッションで QMD 検索を許可するかを制限します。デフォルトは DM のみです。
  - `match.keyPrefix`: 正規化されたセッションキー（`agent:<id>:` を除去したもの）に前方一致。例: `discord:channel:`。
  - `match.rawKeyPrefix`: 生のセッションキー（`agent:<id>:` を含む）に前方一致。例: `agent:main:discord:`。
- 検索結果のスニペットには、`memory.citations` が `auto` または `on` の場合に `Source: <path#line>` というフッターが付与されます。

### 追加の記憶パス

デフォルトのワークスペース構成外にある Markdown ファイルをインデックスに含めたい場合は、パスを明示的に追加します:

```json5
agents: {
  defaults: {
    memorySearch: {
      extraPaths: ["../team-docs", "/srv/shared-notes/overview.md"]
    }
  }
}
```

補足:
- 絶対パスまたはワークスペース相対パスを指定可能。
- ディレクトリは `.md` ファイルを求めて再帰的にスキャンされます。
- Markdown ファイルのみが対象です。
- シンボリックリンクは無視されます。

### Gemini 埋め込み (ネイティブ)

Gemini Embeddings API を直接使用する場合:

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

### 記憶ツールの動作詳細

- `memory_search`: `MEMORY.md` および `memory/` 以下の Markdown ファイルをチャンク化（約 400 トークン単位）して意味的に検索します。スニペット（最大約 700 文字）、ファイルパス、行範囲、スコア、使用されたプロバイダー/モデルを返します。
- `memory_get`: パス指定でファイルを読み取ります。`MEMORY.md` および `memory/` 以外のパスへのアクセスは拒否されます。
- 両ツールともに、エージェントの設定で `memorySearch.enabled` が有効な場合にのみ利用可能です。

### インデックスの作成と更新

- ファイル形式: Markdown のみ。
- 保存先: エージェントごとの SQLite ファイル `~/.openclaw/memory/<agentId>.sqlite`。
- 鮮度管理: ファイル変更を監視し、セッション開始時や検索時に非同期で同期を実行します。
- 全再インデックスのトリガー: 埋め込みの **プロバイダー/モデル、エンドポイント情報、またはチャンク化パラメータ** が変更された場合、OpenClaw は自動的に既存のインデックスをリセットし、最初から作り直します。

### ハイブリッド検索 (BM25 + ベクトル)

有効にすると、OpenClaw は以下の 2 つを組み合わせた検索を行います:
- **ベクトル類似度**: 意味的な一致。言葉の揺れを許容します。
- **BM25 キーワード適合度**: ID、環境変数、コードのシンボル名など、正確な文字列一致。

プラットフォームで全文検索機能が利用できない場合、自動的にベクトル検索のみにフォールバックします。

### 検索結果の後処理パイプライン

結果リストがエージェントに渡される前に、2 つのオプションステージで精度を高めることができます:

```
ベクトル + キーワード → 重み付けマージ → 時間的減衰 → ソート → MMR → 上位 K 件
```

#### MMR 再ランク付け (多様性)

似たような内容のメモ（例：毎日同じことを書いている日報など）が検索結果を占領するのを防ぎ、情報の多様性を確保します。
`lambda` パラメータ（0〜1）で、関連性重視か多様性重視かを調整できます。デフォルトは `0.7`（関連性重視）です。

#### 時間的減衰 (新しさの重視)

古い情報よりも最近の情報を優先的に上位へ表示します。
デフォルトの半減期は 30 日です（30 日前のメモはスコアが 50% になります）。
ただし、`MEMORY.md` などの **Evergreen（不朽の）ファイル** や日付のないファイルは、時間の経過による減衰の対象外となり、常に一定の基準で評価されます。

構成例:
```json5
agents: {
  defaults: {
    memorySearch: {
      query: {
        hybrid: {
          enabled: true,
          vectorWeight: 0.7,
          textWeight: 0.3,
          mmr: { enabled: true, lambda: 0.7 },
          temporalDecay: { enabled: true, halfLifeDays: 30 }
        }
      }
    }
  }
}
```

### 埋め込みキャッシュ

インデックスの再作成時に、変更されていないテキストを再度 API で埋め込み処理するのを防ぐためのキャッシュ機能です。

```json5
agents: {
  defaults: {
    memorySearch: {
      cache: { enabled: true, maxEntries: 50000 }
    }
  }
}
```

### セッション記憶の検索 (実験的)

会話履歴（セッション記録）自体をインデックス化し、記憶検索の対象に含めることができます。実験的な機能です。

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
- セッションの同期は、一定量のメッセージ（デフォルト 50 行）やデータ量（100KB）の増分が発生した際に、バックグラウンドで非同期に行われます。
- 履歴ファイルはディスク上に保存されているため、この機能を利用する際はホスト上のファイルアクセス権限が信頼の境界となります。
