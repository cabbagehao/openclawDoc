---
summary: "エージェントランタイム（組み込みpi-mono）、ワークスペース契約、セッションブートストラップ"
read_when:
  - エージェントランタイム、ワークスペースブートストラップ、またはセッション動作を変更する場合
title: "エージェントランタイム"
---

# エージェントランタイム 🤖

OpenClawは**pi-mono**から派生した単一の組み込みエージェントランタイムを実行します。

## ワークスペース（必須）

OpenClawは単一のエージェントワークスペースディレクトリ（`agents.defaults.workspace`）を、ツールとコンテキストのためのエージェントの**唯一**の作業ディレクトリ（`cwd`）として使用します。

推奨：`openclaw setup`を使用して、存在しない場合は`~/.openclaw/openclaw.json`を作成し、ワークスペースファイルを初期化します。

完全なワークスペースレイアウト + バックアップガイド：[エージェントワークスペース](/concepts/agent-workspace)

`agents.defaults.sandbox`が有効な場合、メイン以外のセッションは`agents.defaults.sandbox.workspaceRoot`配下のセッションごとのワークスペースでこれをオーバーライドできます（[Gateway設定](/gateway/configuration)を参照）。

## ブートストラップファイル（注入）

`agents.defaults.workspace`内で、OpenClawは以下のユーザー編集可能なファイルを期待します：

- `AGENTS.md` — 操作手順 + "メモリ"
- `SOUL.md` — ペルソナ、境界、トーン
- `TOOLS.md` — ユーザーが管理するツールノート（例：`imsg`、`sag`、規約）
- `BOOTSTRAP.md` — 一度限りの初回実行儀式（完了後削除）
- `IDENTITY.md` — エージェント名/雰囲気/絵文字
- `USER.md` — ユーザープロファイル + 好みの呼び方

新しいセッションの最初のターンで、OpenClawはこれらのファイルの内容をエージェントコンテキストに直接注入します。

空白のファイルはスキップされます。大きなファイルはトリミングされ、プロンプトを軽量に保つためにマーカー付きで切り詰められます（完全な内容を読むにはファイルを読んでください）。

ファイルが存在しない場合、OpenClawは単一の「ファイルが見つかりません」マーカー行を注入します（`openclaw setup`は安全なデフォルトテンプレートを作成します）。

`BOOTSTRAP.md`は**真新しいワークスペース**（他のブートストラップファイルが存在しない）の場合にのみ作成されます。儀式を完了した後に削除すると、後の再起動時に再作成されません。

ブートストラップファイルの作成を完全に無効にするには（事前シードされたワークスペースの場合）、以下を設定します：

```json5
{ agent: { skipBootstrap: true } }
```

## 組み込みツール

コアツール（read/exec/edit/writeおよび関連するシステムツール）は、ツールポリシーに従って常に利用可能です。`apply_patch`はオプションであり、`tools.exec.applyPatch`によってゲートされます。`TOOLS.md`はどのツールが存在するかを制御**しません**。これは、*あなた*がそれらをどのように使用したいかのガイダンスです。

## Skills

OpenClawは3つの場所からスキルをロードします（名前の競合時はワークスペースが優先）：

- バンドル（インストールに同梱）
- 管理/ローカル：`~/.openclaw/skills`
- ワークスペース：`<workspace>/skills`

Skillsは設定/環境によってゲートできます（[Gateway設定](/gateway/configuration)の`skills`を参照）。

## pi-mono統合

OpenClawはpi-monoコードベースの一部（モデル/ツール）を再利用しますが、**セッション管理、ディスカバリー、ツール配線はOpenClawが所有**します。

- pi-codingエージェントランタイムはありません。
- `~/.pi/agent`または`<workspace>/.pi`設定は参照されません。

## セッション

セッショントランスクリプトは以下にJSONLとして保存されます：

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

セッションIDは安定しており、OpenClawによって選択されます。
レガシーPi/Tauセッションフォルダーは**読み取られません**。

## ストリーミング中のステアリング

キューモードが`steer`の場合、受信メッセージは現在の実行に注入されます。
キューは**各ツール呼び出しの後**にチェックされます。キューに入れられたメッセージが存在する場合、現在のアシスタントメッセージからの残りのツール呼び出しはスキップされ（「キューに入れられたユーザーメッセージによりスキップされました。」というエラーツール結果）、次のアシスタント応答の前にキューに入れられたユーザーメッセージが注入されます。

キューモードが`followup`または`collect`の場合、受信メッセージは現在のターンが終了するまで保持され、その後キューに入れられたペイロードで新しいエージェントターンが開始されます。モード + デバウンス/キャップ動作については[キュー](/concepts/queue)を参照してください。

ブロックストリーミングは、完了したアシスタントブロックを終了次第送信します。**デフォルトではオフ**です（`agents.defaults.blockStreamingDefault: "off"`）。
境界は`agents.defaults.blockStreamingBreak`（`text_end`対`message_end`、デフォルトはtext_end）で調整します。
ソフトブロックチャンキングは`agents.defaults.blockStreamingChunk`で制御します（デフォルトは800〜1200文字、段落区切りを優先、次に改行、最後に文）。
ストリーミングされたチャンクを`agents.defaults.blockStreamingCoalesce`で結合して、単一行のスパムを減らします（送信前のアイドルベースのマージ）。Telegram以外のチャンネルは、ブロック返信を有効にするために明示的な`*.blockStreaming: true`が必要です。
詳細なツールサマリーはツール開始時に発行されます（デバウンスなし）。Control UIは、利用可能な場合、エージェントイベントを介してツール出力をストリーミングします。
詳細：[ストリーミング + チャンキング](/concepts/streaming)。

## モデル参照

設定内のモデル参照（例：`agents.defaults.model`および`agents.defaults.models`）は、**最初**の`/`で分割して解析されます。

- モデルを設定する際は`provider/model`を使用します。
- モデルID自体に`/`が含まれている場合（OpenRouterスタイル）、プロバイダープレフィックスを含めます（例：`openrouter/moonshotai/kimi-k2`）。
- プロバイダーを省略すると、OpenClawは入力をエイリアスまたは**デフォルトプロバイダー**のモデルとして扱います（モデルIDに`/`がない場合のみ機能します）。

## 設定（最小限）

最低限、以下を設定します：

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom`（強く推奨）

---

_次：[グループチャット](/channels/group-messages)_ 🦞
