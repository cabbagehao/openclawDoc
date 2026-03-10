---
summary: "コンテキスト: モデルが何を認識するか、モデルがどのように構築されるか、およびモデルを検査する方法"
read_when:
  - OpenClaw における「コンテキスト」の意味を理解したい
  - モデルが何かを「知っている」（または忘れてしまった）理由をデバッグしている場合
  - コンテキストのオーバーヘッド (/context、/status、/compact) を削減したい場合
title: "コンテクスト"
x-i18n:
  source_hash: "69f2096f34281b9d094b3ce63d927265c723f696015be8de57c1821c627c51b9"
---

# コンテキスト

「コンテキスト」とは、**OpenClaw が実行のためにモデルに送信するすべてのもの**です。これは、モデルの **コンテキスト ウィンドウ** (トークン制限) によって制限されます。

初心者メンタルモデル:

- **システム プロンプト** (OpenClaw ビルド): ルール、ツール、スキル リスト、時間/ランタイム、および挿入されたワークスペース ファイル。
- **会話履歴**: このセッションのあなたのメッセージ + アシスタントのメッセージ。
- **ツール呼び出し/結果 + 添付ファイル**: コマンド出力、ファイル読み取り、画像/音声など。

コンテキストは「メモリ」と*同じものではありません*。メモリはディスクに保存でき、後で再ロードできます。 context は、モデルの現在のウィンドウ内にあるものです。

## クイックスタート (コンテキストを検査)

- `/status` → 簡単に「ウィンドウはどれくらい埋まっていますか?」ビュー + セッション設定。
- `/context list` → 注入された内容 + 大まかなサイズ (ファイルごと + 合計)。
- `/context detail` → より詳細な内訳: ファイルごと、ツールごとのスキーマ サイズ、スキルごとのエントリ サイズ、およびシステム プロンプト サイズ。
- `/usage tokens` → 通常の返信に返信ごとの使用法フッターを追加します。
- `/compact` → ウィンドウ領域を解放するために、古い履歴をコンパクトなエントリに要約します。

参照: [スラッシュ コマンド](/tools/slash-commands)、[トークンの使用とコスト](/reference/token-use)、[圧縮](/concepts/compaction)。

## 出力例

値は、モデル、プロバイダー、ツール ポリシー、ワークスペースの内容によって異なります。

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
Tool schemas (JSON): 31,988 chars (~7,997 tok) (counts toward context; not shown as text)
Tools: (same as above)

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

## コンテキスト ウィンドウにカウントされるものモデルが受け取るものはすべて考慮されます。これには以下が含まれます

- システム プロンプト (すべてのセクション)。
- 会話履歴。
- ツール呼び出し + ツール結果。
- 添付ファイル/トランスクリプト (画像/音声/ファイル)。
- 圧縮の概要とアーティファクトのプルーニング。
- プロバイダーの「ラッパー」または非表示のヘッダー (表示されませんが、カウントされます)。

## OpenClaw がシステム プロンプトを構築する方法

システム プロンプトは **OpenClaw が所有**しており、実行のたびに再構築されます。これには次のものが含まれます。

- ツールリスト + 簡単な説明。
- スキル リスト (メタデータのみ。以下を参照)。
- ワークスペースの場所。
- 時間 (UTC + 設定されている場合は変換されたユーザー時間)。
- ランタイムメタデータ (ホスト/OS/モデル/思考)。
- **プロジェクト コンテキスト**の下にワークスペース ブートストラップ ファイルを挿入しました。

完全な内訳: [システム プロンプト](/concepts/system-prompt)。

## 挿入されたワークスペース ファイル (プロジェクト コンテキスト)

デフォルトでは、OpenClaw はワークスペース ファイルの固定セットを挿入します (存在する場合)。

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (初回実行のみ)

大きなファイルは、`agents.defaults.bootstrapMaxChars` (デフォルトは `20000` 文字) を使用してファイルごとに切り詰められます。 OpenClaw はまた、`agents.defaults.bootstrapTotalMaxChars` (デフォルトは `150000` 文字) を含むファイル全体にブートストラップ注入の合計上限を適用します。 `/context` は、**生のサイズと挿入された** サイズ、および切り捨てが発生したかどうかを示します。切り捨てが発生すると、ランタイムはプロジェクト コンテキストの下にプロンプ​​ト内警告ブロックを挿入できます。これを `agents.defaults.bootstrapPromptTruncationWarning` (`off`、`once`、`always`、デフォルトは `once`) で構成します。

## スキル: 何が注入されるか、オンデマンドでロードされるか

システム プロンプトには、コンパクトな **スキル リスト** (名前 + 説明 + 場所) が含まれています。このリストには実際のオーバーヘッドがあります。

スキルの説明はデフォルトでは含まれていません\_。モデルは **必要な場合のみ**、スキルの `read` `SKILL.md` を実行することが期待されます。

## ツール: 2 つのコストがかかります

ツールは次の 2 つの方法でコンテキストに影響を与えます。

1. システム プロンプト内の **ツール リスト テキスト** (「ツール」として表示されるもの)。
2. **ツール スキーマ** (JSON)。これらはモデルに送信されるので、モデルはツールを呼び出すことができます。プレーン テキストとして表示されない場合でも、コンテキストとして考慮されます。

`/context detail` は最大のツール スキーマを分類して、何が支配的であるかを確認できます。

## コマンド、ディレクティブ、および「インライン ショートカット」

スラッシュ コマンドはゲートウェイによって処理されます。いくつかの異なる動作があります。- **スタンドアロン コマンド**: `/...` のみのメッセージはコマンドとして実行されます。

- **ディレクティブ**: `/think`、`/verbose`、`/reasoning`、`/elevated`、`/model`、`/queue` は、モデルがメッセージを確認する前に削除されます。
  - ディレクティブのみのメッセージはセッション設定を保持します。
  - 通常のメッセージ内のインライン ディレクティブは、メッセージごとのヒントとして機能します。
- **インライン ショートカット** (許可リストに登録された送信者のみ): 通常のメッセージ内の特定の `/...` トークンはすぐに実行でき (例: "hey /status")、モデルが残りのテキストを確認する前に削除されます。

詳細: [スラッシュコマンド](/tools/slash-commands)。

## セッション、圧縮、およびプルーニング (存続するもの)

メッセージ間で何が保持されるかは、メカニズムによって異なります。

- **通常の履歴**は、ポリシーによって圧縮/削除されるまでセッション トランスクリプトに残ります。
- **圧縮** は、要約をトランスクリプトに保存し、最近のメッセージをそのまま保持します。
- **プルーニング** では、古いツールの実行結果がメモリ内プロンプトから削除されますが、トランスクリプトは書き換えられません。

ドキュメント: [セッション](/concepts/session)、[圧縮](/concepts/compaction)、[セッションのプルーニング](/concepts/session-pruning)。デフォルトでは、OpenClaw は組み込みの `legacy` コンテキスト エンジンをアセンブリと
圧縮。 `kind: "context-engine"` を提供するプラグインをインストールすると、
`plugins.slots.contextEngine` で選択し、OpenClaw がコンテキストを委任します
アセンブリ、`/compact`、およびそれに関連するサブエージェント コンテキストのライフサイクル フック
代わりにエンジン。

## `/context` が実際に報告する内容

`/context` は、利用可能な場合は最新の**実行ビルド** システム プロンプト レポートを優先します。

- `System prompt (run)` = 最後の埋め込み (ツール対応) 実行からキャプチャされ、セッション ストアに保存されます。
- `System prompt (estimate)` = 実行レポートが存在しない場合 (またはレポートを生成しない CLI バックエンド経由で実行している場合)、オンザフライで計算されます。

いずれにしても、規模と上位の貢献者を報告します。完全なシステム プロンプトまたはツール スキーマは**ダンプされません**。
