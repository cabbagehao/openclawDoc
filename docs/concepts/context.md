---
summary: "コンテキスト: モデルが認識する内容、その構築方法、および検査方法"
read_when:
  - OpenClaw における「コンテキスト」の意味を理解したい場合
  - モデルがある事柄を「知っている」理由や「忘れてしまった」理由をデバッグしたい場合
  - コンテキストのオーバーヘッドを削減したい場合 (/context, /status, /compact)
title: "コンテキスト"
x-i18n:
  source_hash: "69f2096f34281b9d094b3ce63d927265c723f696015be8de57c1821c627c51b9"
---
「コンテキスト」とは、**OpenClaw が 1 回の実行（ターン）のためにモデルに送信する情報のすべて** を指します。これはモデル固有の **コンテキストウィンドウ**（トークン制限）によって上限が決まります。

基本的なイメージ:

- **システムプロンプト** (OpenClaw が生成): ルール、利用可能なツール、スキル一覧、現在時刻/環境情報、および注入されたワークスペースファイル。
- **会話履歴**: そのセッションにおけるユーザーとアシスタントのメッセージ。
- **ツール呼び出しと結果 + 添付ファイル**: コマンドの出力、ファイルの読み取り内容、画像や音声データなど。

コンテキストは「記憶（メモ）」とは*異なります*。記憶はディスクに保存され、後で再ロードされるものですが、コンテキストはモデルの現在の「視界」に入っている情報を指します。

## クイックスタート (コンテキストの検査)

- `/status` → ウィンドウの埋まり具合とセッション設定を素早く確認。
- `/context list` → 注入されている内容とおおよそのサイズ（ファイルごとおよび合計）を確認。
- `/context detail` → さらに詳細な内訳（ファイルごと、ツールごとのスキーマサイズ、スキルごとのエントリサイズ、システムプロンプトのサイズ）を確認。
- `/usage tokens` → 通常の返信の末尾に、その回のトークン利用状況を付加。
- `/compact` → ウィンドウの空きを増やすため、古い履歴を要約エントリに圧縮。

関連ドキュメント: [スラッシュコマンド](/tools/slash-commands), [トークン利用とコスト](/reference/token-use), [圧縮（コンパクション）](/concepts/compaction)

## 出力例

値はモデル、プロバイダー、ツールポリシー、およびワークスペースの内容によって異なります。

### `/context list`

```
🧠 Context breakdown
Workspace: <workspaceDir>
Bootstrap max/file: 20,000 chars
Sandbox: mode=non-main sandboxed=false
System prompt (run): 38,412 chars (~9,603 tok) (Project Context 23,901 chars (~5,976 tok))

Injected workspace files:
- AGENTS.md: OK | raw 1,742 chars (~436 tok) | injected 1,742 chars (~436 tok)
- SOUL.md: OK | raw 912 chars (~228 tok) | injected 912 chars (~228 tok)
- TOOLS.md: TRUNCATED | raw 54,210 chars (~13,553 tok) | injected 20,962 chars (~5,241 tok)
- IDENTITY.md: OK | raw 211 chars (~53 tok) | injected 211 chars (~53 tok)
- USER.md: OK | raw 388 chars (~97 tok) | injected 388 chars (~97 tok)
- HEARTBEAT.md: MISSING | raw 0 | injected 0
- BOOTSTRAP.md: OK | raw 0 chars (~0 tok) | injected 0 chars (~0 tok)

Skills list (system prompt text): 2,184 chars (~546 tok) (12 skills)
Tools: read, edit, write, exec, process, browser, message, sessions_send, …
Tool list (system prompt text): 1,032 chars (~258 tok)
Tool schemas (JSON): 31,988 chars (~7,997 tok) (コンテキストとしてカウントされますが、テキストとしては表示されません)
Tools: (上記と同じ)

Session tokens (cached): 14,250 total / ctx=32,000
```

### `/context detail`

```
🧠 Context breakdown (detailed)
…
Top skills (prompt entry size):
- frontend-design: 412 chars (~103 tok)
- oracle: 401 chars (~101 tok)
… (+10 more skills)

Top tools (schema size):
- browser: 9,812 chars (~2,453 tok)
- exec: 6,240 chars (~1,560 tok)
… (+N more tools)
```

## コンテキストウィンドウとしてカウントされるもの

モデルが受信するすべての情報がカウント対象です:

- システムプロンプト（すべてのセクション）
- 会話履歴
- ツールの呼び出し内容と実行結果
- 添付ファイルやトランスクリプト（画像、音声、ドキュメントなど）
- 圧縮（コンパクション）時の要約やプルーニングの痕跡
- プロバイダーによる「ラッパー」や隠しヘッダー（表示されませんが、カウントされます）

## OpenClaw によるシステムプロンプトの構築

システムプロンプトは **OpenClaw が管理** し、実行ごとに再構築されます。これには以下の内容が含まれます:

- ツール一覧と短い説明
- スキル一覧（メタデータのみ。詳細は後述）
- ワークスペースの場所
- 現在時刻（UTC、および設定されていればユーザー時刻に変換されたもの）
- 実行時のメタデータ（ホスト、OS、モデル、思考設定）
- **Project Context** として注入されたワークスペースの初期化ファイル

詳細な内訳: [システムプロンプト](/concepts/system-prompt)

## 注入されるワークスペースファイル (Project Context)

デフォルトでは、OpenClaw は以下のワークスペースファイルが存在すれば注入します:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (初回実行時のみ)

巨大なファイルは、`agents.defaults.bootstrapMaxChars`（デフォルト 20,000 文字）によってファイルごとに切り詰められます。また、すべてのファイルを合わせた合計注入量の上限として `agents.defaults.bootstrapTotalMaxChars`（デフォルト 150,000 文字）が適用されます。`/context` コマンドで、**生のサイズ vs 注入されたサイズ** と、切り詰めが発生したかどうかを確認できます。

切り詰めが発生した場合、システムプロンプトの Project Context セクションに警告ブロックが注入されます。この振る舞いは `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`。デフォルトは `once`) で設定可能です。

## スキル: 注入されるもの vs オンデマンドでロードされるもの

システムプロンプトには、スキルの名前、説明、場所を含むコンパクトな **スキル一覧** が含まれます。この一覧自体が一定のコンテキストを消費します。

スキルの詳細な指示内容は、デフォルトでは**含まれません**。モデルは **必要なときにだけ** スキルの `SKILL.md` を `read` して内容を確認するよう指示されています。

## ツールの 2 つのコスト

ツールは 2 つの形でコンテキストに影響を与えます:

1. システムプロンプト内の **ツール一覧テキスト** (「Tooling」として表示される部分)。
2. **ツールスキーマ** (JSON 形式)。これはモデルがツールを呼び出せるように送信されるデータです。プレーンテキストとしては表示されませんが、コンテキストウィンドウを消費します。

`/context detail` を使用すると、どのツールスキーマがコンテキストを多く消費しているかを確認できます。

## コマンド、ディレクティブ、およびインラインショートカット

スラッシュコマンドはゲートウェイによって処理されます。振る舞いにはいくつかの種類があります:

- **スタンドアロンコマンド**: メッセージが `/...` のみの場合は、コマンドとして実行されます。
- **ディレクティブ**: `/think`, `/verbose`, `/reasoning`, `/elevated`, `/model`, `/queue` は、モデルに渡される前にメッセージから除去されます。
  - ディレクティブのみのメッセージは、セッション設定を永続的に変更します。
  - 通常のメッセージ内に含まれるディレクティブは、その回限りのヒントとして機能します。
- **インラインショートカット** (許可された送信者のみ): 通常のメッセージ内に含まれる特定の `/...` トークン（例: 「ねえ /status」）は即座に実行され、残りのテキストがモデルに渡される前に除去されます。

詳細は [スラッシュコマンド](/tools/slash-commands) を参照してください。

## セッション、圧縮、およびプルーニング（何が残るか）

メッセージをまたいで何が保持されるかは、その仕組みによります:

- **通常の履歴**: 構成ポリシーによって圧縮・削除されるまで、セッション記録に残り続けます。
- **圧縮（Compaction）**: 古い履歴を要約し、記録（トランスクリプト）に保存します。最近のメッセージはそのまま保持されます。
- **プルーニング（Pruning）**: その回の実行のために、**メモリ上の** プロンプトから古いツール結果を削除します。記録（トランスクリプト）自体は書き換えません。

ドキュメント: [セッション](/concepts/session), [圧縮（コンパクション）](/concepts/compaction), [セッションプルーニング](/concepts/session-pruning)

デフォルトでは、OpenClaw は組み込みの `legacy` コンテキストエンジンを使用して組み立てと圧縮を行います。`kind: "context-engine"` を提供するプラグインをインストールし、`plugins.slots.contextEngine` でそれを選択した場合、コンテキストの組み立て、`/compact`、および関連するサブエージェントのコンテキスト処理はそのプラグインに委任されます。

## `/context` が報告する情報のソース

`/context` は、利用可能な場合は最新の **実行時に構築された** システムプロンプトレポートを優先的に表示します:

- `System prompt (run)` = 最後に埋め込みランタイム（ツール利用可能な状態）で実行された際にキャプチャされ、セッションストアに保存された内容。
- `System prompt (estimate)` = 実行レポートが存在しない場合（またはレポートを生成しない CLI バックエンド経由で実行している場合）に、その場で計算された推定値。

いずれの場合も、サイズと上位の消費要因を報告します。システムプロンプトの全文やツールスキーマの生データを出力（ダンプ）することはありません。
