---
summary: "IDE 統合のために ACP ブリッジを実行する"
read_when:
  - ACP ベースの IDE 統合のセットアップ
  - ゲートウェイへの ACP セッション ルーティングのデバッグ
title: "acp"
x-i18n:
  source_hash: "dfc8230568ae37649a303d532dc332f73b5d69a3358ae7b68a872c7d1614ec7f"
---

# acp

OpenClaw ゲートウェイと通信する [エージェント クライアント プロトコル (ACP)](https://agentclientprotocol.com/) ブリッジを実行します。

このコマンドは、IDE の標準入出力を介して ACP を話し、プロンプトをゲートウェイに転送します。
WebSocket経由で。 ACP セッションをゲートウェイ セッション キーにマップしたままにします。

`openclaw acp` はゲートウェイベースの ACP ブリッジであり、完全な ACP ネイティブ エディタではありません
ランタイム。セッション ルーティング、即時配信、基本的なストリーミングに重点を置いています。
更新情報。

## 互換性マトリックス| ACPエリア |ステータス |メモ |

| --------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `initialize`、`newSession`、`prompt`、`cancel` |実装済み |標準入出力を介したコア ブリッジ フローからゲートウェイへのチャット/送信 + アボート。 |
| `listSessions`、スラッシュ コマンド |実装済み |セッション リストはゲートウェイのセッション状態に対して機能します。コマンドは `available_commands_update` 経由でアドバタイズされます。 || `loadSession` |部分的 | ACP セッションをゲートウェイ セッション キーに再バインドし、保存されているユーザー/アシスタントのテキスト履歴を再生します。ツール/システム履歴はまだ再構築されていません。 |
|プロンプトコンテンツ (`text`、埋め込み `resource`、画像) |部分的 |テキスト/リソースはチャット入力にフラット化されます。画像はゲートウェイの添付ファイルになります。 |
|セッションモード |部分的 | `session/set_mode` がサポートされており、ブリッジは思考レベル、ツールの冗長性、推論、使用法の詳細、および高度なアクションに対するゲートウェイ支援の初期セッション制御を公開します。より広範な ACP ネイティブ モード/構成サーフェスはまだ範囲外です。 |
|セッション情報と使用状況の最新情報 |部分的 |ブリッジは、キャッシュされたゲートウェイ セッション スナップショットから `session_info_update` 通知とベストエフォート `usage_update` 通知を発行します。使用量は概算であり、ゲートウェイ トークンの合計が新しいとマークされた場合にのみ送信されます。 ||ツールストリーミング |部分的 | `tool_call` / `tool_call_update` イベントには、生の I/O、テキスト コンテンツ、およびゲートウェイ ツールの引数/結果が公開するときのベストエフォート型のファイルの場所が含まれます。埋め込み端末とより豊富な差分出力はまだ公開されていません。 |
|セッションごとの MCP サーバー (`mcpServers`) |サポートされていません |ブリッジ モードはセッションごとの MCP サーバー要求を拒否します。代わりに、OpenClaw ゲートウェイまたはエージェントで MCP を構成します。 |
|クライアント ファイル システム メソッド (`fs/read_text_file`、`fs/write_text_file`) |サポートされていません |ブリッジは ACP クライアント ファイルシステム メソッドを呼び出しません。 |
|クライアント端末メソッド (`terminal/*`) |サポートされていません |ブリッジは、ACP クライアント端末を作成したり、ツール呼び出しを通じて端末 ID をストリームしたりしません。 ||セッションプラン / 思考ストリーミング |サポートされていません |現在、ブリッジは出力テキストとツールのステータスを出力しますが、ACP の計画や考えの更新は出力しません。 |

## 既知の制限事項- `loadSession` は、保存されたユーザーとアシスタントのテキスト履歴を再生しますが、再生しません

過去のツール呼び出し、システム通知、またはより豊富な ACP ネイティブ イベントを再構築します。
タイプ。

- 複数の ACP クライアントが同じゲートウェイ セッション キーを共有する場合、イベントとキャンセル
  ルーティングはクライアントごとに厳密に分離されるのではなく、ベストエフォート型です。を優先します
  クリーンなエディターローカルが必要な場合のデフォルトの分離された `acp:<uuid>` セッション
  曲がる。
- ゲートウェイの停止状態は ACP 停止理由に変換されますが、そのマッピングは
  完全な ACP ネイティブのランタイムよりも表現力が劣ります。
- 初期セッション コントロールは現在、ゲートウェイ ノブの焦点を当てたサブセットを表示しています。
  思考レベル、ツールの冗長性、推論、使用法の詳細、およびレベルの向上
  アクション。モデル選択と実行ホスト制御はまだ ACP として公開されていません
  設定オプション。
- `session_info_update` および `usage_update` はゲートウェイ セッションから派生します
  ライブ ACP ネイティブのランタイム アカウンティングではなく、スナップショットです。使用量はおおよその目安ですが、
  コストデータは伝送されず、ゲートウェイが合計トークンをマークした場合にのみ発行されます。
  データは新鮮なものです。
- ツール追跡データはベストエフォート型です。ブリッジは、次のファイル パスを表示できます。
  既知のツールの引数/結果に表示されますが、ACP ターミナルまたは
  構造化されたファイルの差分。

## 使用法

```bash
openclaw acp

# Remote Gateway
openclaw acp --url wss://gateway-host:18789 --token <token>

# Remote Gateway (token from file)
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Attach to an existing session key
openclaw acp --session agent:main:main

# Attach by label (must already exist)
openclaw acp --session-label "support inbox"

# Reset the session key before the first prompt
openclaw acp --session agent:main:main --reset-session
```

## ACP クライアント (デバッグ)組み込みの ACP クライアントを使用して、IDE を使用せずにブリッジの健全性をチェックします

これにより ACP ブリッジが生成され、対話的にプロンプ​​トを入力できるようになります。

```bash
openclaw acp client

# Point the spawned bridge at a remote Gateway
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Override the server command (default: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

権限モデル (クライアント デバッグ モード):

- 自動承認は許可リストに基づいており、信頼できるコア ツール ID にのみ適用されます。
- `read` 自動承認の範囲は、現在の作業ディレクトリ (設定されている場合は `--cwd`) に限定されます。
- 不明な/非コア ツール名、範囲外の読み取り、および危険なツールには、常に明示的な即時承認が必要です。
- サーバーが提供する `toolCall.kind` は、信頼できないメタデータ (承認ソースではない) として扱われます。

## これの使い方

IDE (または他のクライアント) がエージェント クライアント プロトコルを話し、必要な場合は ACP を使用します。
OpenClaw ゲートウェイ セッションを駆動します。

1. ゲートウェイが実行されていることを確認します (ローカルまたはリモート)。
2. ゲートウェイ ターゲットを構成します (構成またはフラグ)。
3. 標準入出力で `openclaw acp` を実行するように IDE を指定します。

設定例 (永続的):

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

直接実行の例 (構成書き込みなし):

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# preferred for local process safety
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## エージェントの選択

ACP はエージェントを直接選択しません。ゲートウェイ セッション キーによってルーティングされます。

エージェント スコープのセッション キーを使用して、特定のエージェントをターゲットにします。

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

各 ACP セッションは、単一のゲートウェイ セッション キーにマップされます。 1 つのエージェントが複数のエージェントを持つことができます
セッション。オーバーライドしない限り、ACP はデフォルトで分離された `acp:<uuid>` セッションになります
キーまたはラベル。セッションごとの `mcpServers` はブリッジ モードではサポートされません。 ACP クライアントの場合
`newSession` または `loadSession` の間に送信すると、ブリッジはクリアを返します。
黙って無視するのではなく、エラーを返します。

## `acpx` から使用 (Codex、Claude、その他の ACP クライアント)

Codex や Claude Code などのコーディング エージェントに相談したい場合は、
ACP 上の OpenClaw ボットの場合は、組み込みの `openclaw` ターゲットとともに `acpx` を使用します。

一般的なフロー:

1. ゲートウェイを実行し、ACP ブリッジがゲートウェイに到達できることを確認します。
2. `openclaw acp` に `acpx openclaw` を指定します。
3. コーディング エージェントに使用させる OpenClaw セッション キーをターゲットにします。

例:

```bash
# One-shot request into your default OpenClaw ACP session
acpx openclaw exec "Summarize the active OpenClaw session state."

# Persistent named session for follow-up turns
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

`acpx openclaw` で特定のゲートウェイとセッション キーをターゲットにする場合は、
`~/.acpx/config.json` の `openclaw` エージェント コマンドをオーバーライドします。

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

リポジトリローカル OpenClaw チェックアウトの場合は、CLI エントリポイントの代わりに直接 CLI エントリポイントを使用します。
dev ランナーを使用して、ACP ストリームをクリーンな状態に保ちます。たとえば:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

これは、Codex、Claude Code、または別の ACP 対応クライアントを使用できるようにする最も簡単な方法です。
端末をスクレイピングせずに OpenClaw エージェントからコンテキスト情報を取得します。

## Zed エディターのセットアップ

`~/.config/zed/settings.json` にカスタム ACP エージェントを追加します (または Zed の設定 UI を使用します)。

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": ["acp"],
      "env": {}
    }
  }
}
```

特定のゲートウェイまたはエージェントをターゲットにするには:

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": [
        "acp",
        "--url",
        "wss://gateway-host:18789",
        "--token",
        "<token>",
        "--session",
        "agent:design:main"
      ],
      "env": {}
    }
  }
}
```

Zed で、エージェント パネルを開き、「OpenClaw ACP」を選択してスレッドを開始します。

## セッションマッピングデフォルトでは、ACP セッションは、`acp:` プレフィックスが付いた分離されたゲートウェイ セッション キーを取得します

既知のセッションを再利用するには、セッション キーまたはラベルを渡します。

- `--session <key>`: 特定のゲートウェイ セッション キーを使用します。
- `--session-label <label>`: ラベルによって既存のセッションを解決します。
- `--reset-session`: そのキーの新しいセッション ID を作成します (同じキー、新しいトランスクリプト)。

ACP クライアントがメタデータをサポートしている場合は、セッションごとにオーバーライドできます。

```json
{
  "_meta": {
    "sessionKey": "agent:main:main",
    "sessionLabel": "support inbox",
    "resetSession": true
  }
}
```

セッション キーの詳細については、[/concepts/session](/concepts/session) をご覧ください。

## オプション

- `--url <url>`: ゲートウェイ WebSocket URL (構成時のデフォルトはgateway.remote.url)。
- `--token <token>`: ゲートウェイ認証トークン。
- `--token-file <path>`: ファイルからゲートウェイ認証トークンを読み取ります。
- `--password <password>`: ゲートウェイ認証パスワード。
- `--password-file <path>`: ファイルからゲートウェイ認証パスワードを読み取ります。
- `--session <key>`: デフォルトのセッションキー。
- `--session-label <label>`: 解決するデフォルトのセッション ラベル。
- `--require-existing`: セッション キー/ラベルが存在しない場合は失敗します。
- `--reset-session`: 初めて使用する前にセッション キーをリセットします。
- `--no-prefix-cwd`: プロンプトの前に作業ディレクトリを付けないでください。
- `--verbose, -v`: 標準エラー出力への詳細ログ。

セキュリティ上の注意:- `--token` および `--password` は、一部のシステムのローカル プロセス リストに表示される場合があります。

- `--token-file`/`--password-file` または環境変数 (`OPENCLAW_GATEWAY_TOKEN`、`OPENCLAW_GATEWAY_PASSWORD`) を優先します。
- ゲートウェイ認証解決は、他のゲートウェイ クライアントが使用する共有コントラクトに従います。
  - ローカル モード: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> `gateway.auth.*` が設定されていない場合の `gateway.remote.*` フォールバック
  - リモート モード: `gateway.remote.*` リモート優先順位ルールごとの env/config フォールバックあり
  - `--url` はオーバーライドセーフであり、暗黙的な config/env 認証情報を再利用しません。明示的な `--token`/`--password` (またはファイルのバリアント) を渡します
- ACP ランタイム バックエンド子プロセスは、コンテキスト固有のシェル/プロファイル ルールに使用できる `OPENCLAW_SHELL=acp` を受け取ります。
- `openclaw acp client` は、生成されたブリッジ プロセスに `OPENCLAW_SHELL=acp-client` を設定します。

### `acp client` オプション

- `--cwd <dir>`: ACP セッションの作業ディレクトリ。
- `--server <command>`: ACP サーバー コマンド (デフォルト: `openclaw`)。
- `--server-args <args...>`: ACP サーバーに渡される追加の引数。
- `--server-verbose`: ACP サーバーで詳細ログを有効にします。
- `--verbose, -v`: 詳細なクライアント ログ。
