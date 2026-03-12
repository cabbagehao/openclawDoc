---
summary: "エージェントランタイム (組み込み pi-mono)、ワークスペースの定義、およびセッションのセットアップ"
read_when:
  - エージェントランタイム、ワークスペースの初期化、またはセッションの動作を変更したい場合
title: "OpenClawのエージェントランタイムの仕組みと制御設計ガイド"
description: "OpenClaw は、pi-mono から派生した単一の組み込みエージェントランタイムを実行します。ワークスペース (必須)、ブートストラップファイル (自動注入)、組み込みツールを確認できます。"
x-i18n:
  source_hash: "caec99517465a2e9bcd204e661b06211cc83378edc1c52fd99e96863f78f7f14"
---
OpenClaw は、**pi-mono** から派生した単一の組み込みエージェントランタイムを実行します。

## ワークスペース (必須)

OpenClaw は、単一のエージェントワークスペースディレクトリ (`agents.defaults.workspace`) を、エージェントがツールを実行しコンテキストを取得するための**唯一の**作業ディレクトリ (`cwd`) として使用します。

推奨: `openclaw setup` を実行して、不足している `~/.openclaw/openclaw.json` の作成とワークスペースファイルの初期化を行ってください。

ワークスペースのレイアウトとバックアップに関する詳細: [エージェントワークスペース](/concepts/agent-workspace)

`agents.defaults.sandbox` が有効な場合、メイン以外のセッションでは `agents.defaults.sandbox.workspaceRoot` 配下にあるセッションごとのワークスペースで設定を上書きできます（[ゲートウェイ構成](/gateway/configuration) を参照）。

## ブートストラップファイル (自動注入)

`agents.defaults.workspace` 内には、OpenClaw が期待する以下のユーザー編集可能なファイルが存在します:

- `AGENTS.md` — 動作指示 + 「記憶」
- `SOUL.md` — ペルソナ（人格）、境界線、トーン
- `TOOLS.md` — ユーザーが管理するツールに関するメモ（例: `imsg`, `sag`, 慣習など）
- `BOOTSTRAP.md` — 初回実行時に一度だけ行われる「儀式」用ファイル（完了後に削除されます）
- `IDENTITY.md` — エージェントの名前、雰囲気、および絵文字
- `USER.md` — ユーザープロフィール + 希望する呼び名

新しいセッションの最初のターンで、OpenClaw はこれらのファイルの内容をエージェントのコンテキストに直接注入します。

内容が空のファイルはスキップされます。巨大なファイルは、プロンプトを軽量に保つためにマーカーと共に切り詰められます（すべての内容を把握するには、エージェントがそのファイルを直接読み取る必要があります）。

ファイルが存在しない場合、OpenClaw は「欠落」を示すマーカーを注入します（`openclaw setup` を実行すれば、安全なデフォルトテンプレートが作成されます）。

`BOOTSTRAP.md` は、他のブートストラップファイルが一切存在しない**新規ワークスペース**の場合にのみ作成されます。儀式を完了した後にこのファイルを削除すれば、その後の再起動時に再作成されることはありません。

既存のワークスペースを使用する場合などで、これらのファイルの自動生成を完全に無効にしたい場合は、以下を設定してください:

```json5
{ agent: { skipBootstrap: true } }
```

## 組み込みツール

コアツール（read/exec/edit/write および関連するシステムツール）は、ツールポリシーに従って常に利用可能です。`apply_patch` はオプションであり、`tools.exec.applyPatch` で許可されている場合にのみ利用できます。`TOOLS.md` はツールの存在自体を制御するものではなく、それらを*どのように*使ってほしいかをエージェントに伝えるためのガイドラインです。

## スキル (Skills)

OpenClaw は以下の 3 つの場所からスキルをロードします（名前が競合した場合はワークスペース内のものが優先されます）:

- **Bundled**: インストール環境に同梱されているスキル
- **Managed/local**: `~/.openclaw/skills`
- **Workspace**: `<workspace>/skills`

スキルは構成ファイルや環境変数で制限をかけることができます（[ゲートウェイ構成](/gateway/configuration) の `skills` セクションを参照）。

## pi-mono との統合

OpenClaw は pi-mono のコードベース（モデルやツールの一部）を再利用していますが、**セッション管理、検出、ツールの接続などは OpenClaw 独自の実装**です。

- pi-coding エージェントのランタイムは使用しません。
- `~/.pi/agent` や `<workspace>/.pi` の設定は参照されません。

## セッション (Sessions)

会話の記録（トランスクリプト）は JSONL 形式で以下の場所に保存されます:

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

セッション ID は OpenClaw によって決定され、固定されます。
以前の Pi や Tau のセッションフォルダは読み込まれません。

## ストリーミング中のステアリング (Steering)

キューモードが `steer` の場合、受信メッセージは現在の実行プロセスに割り込んで注入されます。
キューのチェックは**各ツール呼び出しの直後**に行われます。キューにメッセージがある場合、現在のアシスタントメッセージに含まれる残りのツール呼び出しはスキップされ（エラー内容: "Skipped due to queued user message."）、次のアシスタント応答の前にそのユーザーメッセージが注入されます。

キューモードが `followup` または `collect` の場合、受信メッセージは現在のターンが終わるまで保持され、その後キューに溜まった内容で新しいエージェントターンが開始されます。モードやデバウンス、上限設定の詳細は [キュー](/concepts/queue) を参照してください。

ブロックストリーミング（Block streaming）は、アシスタントのブロックが完了するたびに即座に送信する機能で、**デフォルトではオフ**になっています (`agents.defaults.blockStreamingDefault: "off"`)。
送信の区切り（境界）は `agents.defaults.blockStreamingBreak` (`text_end` または `message_end`。デフォルトは `text_end`) で調整可能です。
ブロックの分割サイズは `agents.defaults.blockStreamingChunk` で制御します（デフォルトは 800〜1200 文字。段落の区切り、改行、文の終わりの順で最適な位置を判断します）。
`agents.defaults.blockStreamingCoalesce` を使用して、短期間に連続するチャンクを結合し、通知の連打を抑えることができます。Telegram 以外のチャネルでブロック返信を有効にするには、明示的に `*.blockStreaming: true` を設定する必要があります。
詳細出力（verbose）時のツールサマリーは、ツール開始時に即座に発行されます。コントロール UI では、利用可能な場合にエージェントイベントを介してツールの出力をリアルタイムで表示できます。
詳細は [ストリーミングとチャンク化](/concepts/streaming) を参照してください。

## モデルの参照方法

構成設定（例: `agents.defaults.model`, `agents.defaults.models`）におけるモデルの参照は、**最初の** `/` で分割して解析されます。

- モデルを構成する際は `provider/model` の形式を使用してください。
- モデル ID 自体に `/` が含まれる場合（OpenRouter 形式など）は、プロバイダーのプレフィックスを含めてください（例: `openrouter/moonshotai/kimi-k2`）。
- プロバイダーを省略した場合、OpenClaw はそれをエイリアス、あるいは**デフォルトプロバイダー**のモデルとして扱います（これはモデル ID 内に `/` が含まれない場合にのみ機能します）。

## 最小限の構成例

最低限、以下の設定が必要です:

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom` (強く推奨)

---

_次は: [グループメッセージ](/channels/group-messages)_ 🦞
